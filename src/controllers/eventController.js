const Event = require('../models/events');
const Category = require('../models/category');
const User = require('../models/user');
const sequelize = require('../config/config');
const axios = require("axios");
const { Op } = require('sequelize');
const sendEmailNotification = require('../services/emailService');

// Geocode address to get latitude and longitude
async function geocodeAddress(address) {
    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            throw new Error(req.t('google_maps_api_key_missing'));
        }

        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: { address, key: apiKey }
        });

        if (response.data.status === 'ZERO_RESULTS') {
            throw new Error(req.t('no_results_for_address', { address }));
        }

        if (response.data.status !== 'OK') {
            throw new Error(req.t('geocoding_error', { status: response.data.status }));
        }

        const location = response.data.results[0]?.geometry.location;
        if (!location) {
            throw new Error(req.t('valid_response_no_location'));
        }

        return [location.lng, location.lat];
    } catch (error) {
        console.error(req.t('geocoding_failed'), { address, error: error.message });
        throw new Error(req.t('could_not_geocode_address', { address, error: error.message }));
    }
}

// Reverse geocode to get an address from coordinates
async function reverseGeocode(lat, lng) {
    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: { latlng: `${lat},${lng}`, key: apiKey }
        });

        return response.data.results[0]?.formatted_address || req.t('address_not_found');
    } catch (error) {
        console.error(req.t('reverse_geocoding_error'), error);
        return req.t('address_not_found');
    }
}

// Create an event
exports.createEvent = async (req, res) => {
    try {
        const { title, description, category, event_time, locationAddress, created_by } = req.body;

        if (!title || !category || !event_time || !locationAddress || !created_by) {
            return res.status(400).json({ message: req.t('missing_required_fields') });
        }

        // Ensure event_time is a valid date
        const parsedEventTime = new Date(event_time);
        if (isNaN(parsedEventTime.getTime())) {
            return res.status(400).json({ message: req.t('invalid_event_time') });
        }

        let longitude, latitude;
        try {
            [longitude, latitude] = await geocodeAddress(locationAddress);
        } catch (geocodeError) {
            return res.status(400).json({ 
                message: req.t('address_geocoding_failed'),
                details: geocodeError.message
            });
        }

        let eventCategory = await Category.findOne({ where: { name: category } });
        if (!eventCategory) {
            eventCategory = await Category.create({ name: category, description: null });
        }

        const user = await User.findByPk(created_by);
        if (!user) {
            return res.status(404).json({ message: req.t('user_not_found') });
        }

        const existingEvent = await Event.findOne({
            where: {
                title,
                event_time: parsedEventTime,
                category_id: eventCategory.id,
                [Op.and]: [
                    sequelize.where(
                        sequelize.fn('ST_AsText', sequelize.col('location')),
                        sequelize.fn('ST_AsText', sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', longitude, latitude), 4326))
                    )
                ]
            }
        });

        if (existingEvent) {
            return res.status(400).json({ message: req.t('similar_event_already_exists') });
        }

        const newEvent = await Event.create({
            title,
            description,
            event_time: parsedEventTime,
            location: sequelize.fn('ST_SetSRID', sequelize.fn('ST_GeomFromGeoJSON', JSON.stringify({
                type: 'Point',
                coordinates: [longitude, latitude]
            })), 4326),
            category_id: eventCategory.id,
            created_by: user.id
        });

        const users = await User.findAll({
            where: sequelize.where(
                sequelize.fn('ST_DWithin', 
                    sequelize.col('User.location'), 
                    sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', longitude, latitude), 4326), 
                    50000
                ),
                true
            )
        });

        // Send email notifications to users
        for (const user of users) {
            const emailSubject = `Upcoming Event: ${newEvent.title}`;
            const emailMessage = `Don't miss out on the upcoming event in your neighbourhood!
            Event Title: ${newEvent.title} 
            on ${newEvent.event_time}. 
            Location: ${locationAddress}`;
            await sendEmailNotification(user.email, emailSubject, emailMessage);
        }

        res.status(201).json({ message: req.t('event_created'), event: newEvent });
    } catch (error) {
        console.error(req.t('error_creating_event'), { error: error.message });
        res.status(500).json({ message: req.t('server_error') });
    }
};



// Get all events
exports.getEvents = async (req, res) => {
    try {
        const { category, address, radius = 5000, page = 1, limit = 10 } = req.query;
        let whereClause = {};

        if (category) {
            const eventCategory = await Category.findOne({ where: { name: { [Op.iLike]: category } } });
            if (!eventCategory) {
                return res.status(404).json({ message: req.t('category_not_found') });
            }
            whereClause.category_id = eventCategory.id;
        }

        if (address) {
            try {
                const [longitude, latitude] = await geocodeAddress(address);
                whereClause = {
                    ...whereClause,
                    [Op.and]: [
                        sequelize.where(
                            sequelize.fn('ST_DWithin', 
                                sequelize.col('Event.location'), 
                                sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', longitude, latitude), 4326), 
                                radius
                            ),
                            true
                        )
                    ]
                };
            } catch (error) {
                return res.status(400).json({ message: req.t('invalid_address') });
            }
        }

        const offset = (page - 1) * limit;
        const events = await Event.findAndCountAll({
            where: whereClause,
            include: [
                { model: Category, attributes: ['name'] },
                { model: User, attributes: ['username'] }
            ],
            limit: Number(limit),
            offset: Number(offset),
            order: [['event_time', 'ASC']],
        });

        if (events.rows.length === 0) {
            return res.status(404).json({ message: req.t('no_events_found') });
        }

        const formattedEvents = await Promise.all(events.rows.map(async (event) => {
            let geoJSON;
        
            // Check if location is a valid GeoJSON string or an object
            if (typeof event.location === 'string') {
                geoJSON = JSON.parse(event.location);
            } else {
                geoJSON = event.location;
            }
        
            const [longitude, latitude] = geoJSON.coordinates;
            const address = await reverseGeocode(latitude, longitude);
        
            return {
                id: event.id,
                title: event.title,
                description: event.description,
                address,
                event_time: event.event_time,
                category_name: event.Category?.name || req.t('unknown_category'),
                created_by: event.User?.username || req.t('unknown_user')
            };
        }));
        

        res.json({
            message: req.t('events_fetched_successfully'),
            data: formattedEvents,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(events.count / limit),
                totalCount: events.count,
            },
        });
    } catch (error) {
        console.error(req.t('error_fetching_events'), error);
        res.status(500).json({ message: req.t('server_error') });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id, { 
            include: [
                { model: Category, attributes: ['name'] },
                { model: User, attributes: ['username'] }
            ],
            attributes: [
                'id', 'title', 'description', 'event_time', 
                [sequelize.literal('ST_AsGeoJSON("Event"."location")'), 'location']
            ]
        });

        if (!event) {
            return res.status(404).json({ message: req.t('event_not_found') });
        }

        const geoJSON = JSON.parse(event.location);
        const [longitude, latitude] = geoJSON.coordinates;
        const address = await reverseGeocode(latitude, longitude);

        res.json({
            id: event.id,
            title: event.title,
            description: event.description,
            address: address || req.t('unknown_location'),
            event_time: event.event_time,
            category_name: event.Category?.name || req.t('unknown_category'),
            created_by: event.User?.username || req.t('unknown_user')
        });
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ message: req.t('server_error') });
    }
};

// Get event by Radius
exports.getEventsByRadius = async (req, res) => {
    try {
        const { address, latitude, longitude, radius = 5000, category, startDate, endDate } = req.query;

        if (!address && (!latitude || !longitude)) {
            return res.status(400).json({ message: req.t('location_required') });
        }

        let geoCoordinates = { lat: latitude, lon: longitude };

        // Geocode address if provided
        if (address) {
            geoCoordinates = await geocodeAddress(address);
            if (!geoCoordinates) {
                return res.status(400).json({ message: req.t('invalid_address') });
            }
        }

        const { lat, lon } = geoCoordinates;

        // Filter by radius
        const whereClause = {
            [Op.and]: [
                sequelize.where(
                    sequelize.fn(
                        'ST_DWithin',
                        sequelize.col('Event.location'),
                        sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', lon, lat), 4326),
                        radius
                    ),
                    true
                )
            ]
        };

        // Filter by category
        if (category) {
            whereClause[Op.and].push({
                '$Category.name$': { [Op.iLike]: category }
            });
        }

        // Filter by date range
        if (startDate && endDate) {
            whereClause[Op.and].push({
                eventDate: { [Op.between]: [startDate, endDate] }
            });
        }

        // Fetch events
        const events = await Event.findAll({
            where: whereClause,
            include: [
                { model: Category, attributes: ['name'] },
                { model: User, attributes: ['username'] }
            ]
        });

        if (events.length === 0) {
            return res.status(404).json({ message: req.t('no_events_found') });
        }

        res.json(events);
    } catch (error) {
        console.error("Error fetching events by radius:", error);
        res.status(500).json({ message: req.t('server_error') });
    }
};

// Update Event by ID
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).json({ message: req.t('event_not_found') });
        }

        await event.update(req.body);
        res.json({ message: req.t('event_updated'), event });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ message: req.t('server_error') });
    }
};

// Delete Events
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).json({ message: req.t('event_not_found') });
        }

        await event.destroy();
        res.status(204).json({ message: req.t('event_deleted') });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: req.t('server_error') });
    }
};

// Email Notification
const Redis = require("ioredis");
const publisher = new Redis();
const sendNotification = require("../utils/publisher");

async function notifyUsers(event) {
    const users = await getUsersInterestedInCategory(event.category_id);
    
    users.forEach(user => {
        const message = {
            userEmail: user.email,
            eventTitle: event.title,
            eventTime: event.event_time,
        };

        // For RabbitMQ (Delayed Notifications)
        sendNotification(user.email, message.eventTitle, message.eventTime, 3600000); // 1 hour delay
    });
}

