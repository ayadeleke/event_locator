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
            throw new Error('Google Maps API key is missing');
        }

        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: address,
                key: apiKey
            }
        });

        console.log('Geocode response:', response.data);

        if (response.data.status === 'ZERO_RESULTS') {
            throw new Error(`No results found for address: ${address}`);
        }

        if (response.data.status !== 'OK') {
            throw new Error(`Geocoding error: ${response.data.status} - ${response.data.error_message || 'No error details available'}`);
        }

        const location = response.data.results[0]?.geometry.location;
        if (!location) {
            throw new Error('Valid response but no location found');
        }

        return [location.lng, location.lat];
    } catch (error) {
        console.error('Geocoding failed:', {
            address: address,
            error: error.message,
            stack: error.stack
        });
        throw new Error(`Could not geocode address: ${address}. ${error.message}`);
    }
}

// Function to convert coordinates to address using Google Maps API
async function reverseGeocode(lat, lng) {
    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                latlng: `${lat},${lng}`,
                key: apiKey
            }
        });

        const address = response.data.results[0]?.formatted_address;
        return address || 'Address not found';
    } catch (error) {
        console.error("Reverse geocoding error:", error);
        return 'Address not found';
    }
}

// Create an event
exports.createEvent = async (req, res) => {
    try {
        const { title, description, category, event_time, locationAddress, created_by } = req.body;

        if (!title || !category || !event_time || !locationAddress || !created_by) {
            return res.status(400).json({ message: req.t('missing_required_fields') });
        }

        // Get coordinates from the address
        let longitude, latitude;
        try {
            [longitude, latitude] = await geocodeAddress(locationAddress);
        } catch (geocodeError) {
            return res.status(400).json({ 
                message: 'Address geocoding failed',
                details: geocodeError.message,
                providedAddress: locationAddress
            });
        }

        // Find or create the category
        let eventCategory = await Category.findOne({ where: { name: category } });
        if (!eventCategory) {
            eventCategory = await Category.create({ name: category, description: null });
        }

        // Get user by ID
        const user = await User.findByPk(created_by);
        if (!user) {
            return res.status(404).json({ message: req.t('user_not_found') });
        }

        // Check for duplicate event
        const existingEvent = await Event.findOne({
            where: {
                title,
                event_time,
                category_id: eventCategory.id, // Compare by category_id, not name
                // Compare location coordinates
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

        // Create the event
        const newEvent = await Event.create({
            title,
            description,
            event_time,
            location: sequelize.fn('ST_SetSRID', sequelize.fn('ST_GeomFromGeoJSON', JSON.stringify({
                type: 'Point',
                coordinates: [longitude, latitude]
            })), 4326),
            category_id: eventCategory.id,
            created_by: user.id
        });

        // Fetch users within 50km of the event location
        const users = await User.findAll({
            where: sequelize.where(
                sequelize.fn('ST_DWithin', 
                    sequelize.col('User.location'), 
                    sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', longitude, latitude), 4326), 
                    50000), // 50 km in meters
                true
            )
        });

        // Send email notifications to the users
        for (const user of users) {
            const emailSubject = `Upcoming Event: ${newEvent.title}`;
            const emailMessage = `Don't miss out on the upcoming event in your neighbourhood! Event Title: ${newEvent.title} on ${newEvent.event_time}. Location: ${locationAddress}`;
            await sendEmailNotification(user.email, emailSubject, emailMessage);
        }

        res.status(201).json({ message: req.t('event_created'), event: newEvent });
    } catch (error) {
        console.error("Error creating event:", {
            error: error.message,
            stack: error.stack,
            requestBody: req.body
        });
        res.status(500).json({ 
            message: req.t('server_error'),
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};



// Get all events with streamlined output
exports.getEvents = async (req, res) => {
    try {
        const { category, address, radius = 5000, page = 1, limit = 10 } = req.query; // Default radius is 5000 meters (5 km), page 1 and limit 10
        let whereClause = {}; // Ensure whereClause is always initialized as an object

        // Filter by category
        if (category) {
            const eventCategory = await Category.findOne({
                where: {
                    name: {
                        [Op.iLike]: category // Case-insensitive match for category name
                    }
                }
            });

            if (!eventCategory) {
                return res.status(404).json({ message: req.t('category_not_found') });
            }

            whereClause.category_id = eventCategory.id;
        }

        // Search by address proximity
        if (address) {
            try {
                const [longitude, latitude] = await geocodeAddress(address); // Geocode the address to get coordinates
                console.log("Geocoded coordinates:", longitude, latitude);

                if (!longitude || !latitude) {
                    console.log("Invalid coordinates received");
                    return res.status(400).json({ message: "Invalid address. No coordinates found." });
                }

                // Check if coordinates are valid
                if (isNaN(longitude) || isNaN(latitude)) {
                    console.log("Coordinates are not valid numbers:", longitude, latitude);
                    return res.status(400).json({ message: "Invalid coordinates received." });
                }

                // Ensure whereClause is not undefined before adding ST_DWithin
                whereClause = {
                    ...whereClause, // Add existing conditions if any
                    [Op.and]: [
                        sequelize.where(
                            sequelize.fn(
                                'ST_DWithin', // PostGIS function to check distance between geometries
                                sequelize.col('Event.location'), // Event location column
                                sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', longitude, latitude), 4326), // Geographical point
                                radius // Distance in meters
                            ),
                            true
                        )
                    ]
                };
            } catch (error) {
                console.log("Error geocoding address:", error);
                return res.status(400).json({ message: req.t('invalid_address') });
            }
        }

        // Calculate offset
        const offset = (page - 1) * limit;

        // Fetch filtered events with pagination
        const events = await Event.findAndCountAll({
            where: whereClause,
            include: [
                { model: Category, attributes: ['name'] },
                { model: User, attributes: ['username'] }
            ],
            limit: Number(limit),
            offset: Number(offset),
            order: [['event_time', 'ASC']], // Order by event time, you can change this as needed
        });

        // If no events match the location or filters, return a message
        if (events.rows.length === 0) {
            return res.status(404).json({ message: "No events found matching the criteria." });
        }

        // Dynamically geocode the location for each event to add the address
        const formattedEvents = await Promise.all(events.rows.map(async (event) => {
            const coordinates = event.location; // Assuming location is a geometry field
            const [latitude, longitude] = [coordinates.coordinates[0], coordinates.coordinates[1]]; // Adjust if using different format
            const address = await reverseGeocode(latitude, longitude); // Get the address using geocoding API

            return {
                id: event.id,
                title: event.title,
                description: event.description,
                address: address, // Dynamically include address
                event_time: event.event_time,
                category_name: event.Category?.name || 'Unknown Category',
                created_by: event.User?.username || 'Unknown User'
            };
        }));

        // Calculate total number of pages
        const totalPages = Math.ceil(events.count / limit);

        res.json({
            message: 'Events fetched successfully',
            data: formattedEvents,
            pagination: {
                currentPage: Number(page),
                totalPages: totalPages,
                totalCount: events.count,
            },
        });
    } catch (error) {
        console.error("Error fetching events:", error);
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
            address: locationAddress,
            event_time: event.event_time,
            category_name: event.Category?.name || 'Unknown Category',
            created_by: event.User?.username || 'Unknown User'
        });
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ message: req.t('server_error') });
    }
};

// Get events filtered by radius from a location (either address or coordinates)
exports.getEventsByRadius = async (req, res) => {
    try {
        const { address, latitude, longitude, radius = 5000, category, startDate, endDate } = req.query;

        if (!address && (!latitude || !longitude)) {
            return res.status(400).json({ message: "Address or latitude/longitude must be provided." });
        }

        let geoCoordinates = { lat: latitude, lon: longitude };

        // If address is provided, geocode it to get lat/lon
        if (address) {
            geoCoordinates = await geocodeAddress(address);
            if (!geoCoordinates) {
                return res.status(400).json({ message: "Invalid address provided." });
            }
        }

        const { lat, lon } = geoCoordinates;

        // Build the basic query filter for radius
        const whereClause = {
            [Op.and]: [
                sequelize.where(
                    sequelize.fn(
                        'ST_DWithin', // PostGIS function to check distance between geometries
                        sequelize.col('Event.location'), // Event location column
                        sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', lon, lat), 4326), // Geographical point
                        radius // Distance in meters (default 5000 meters)
                    ),
                    true
                )
            ]
        };

        // Additional filtering for category (if provided)
        if (category) {
            whereClause[Op.and].push({
                '$Category.name$': {
                    [Op.iLike]: category // Case-insensitive match
                }
            });
        }

        // Filtering by event date (if provided)
        if (startDate && endDate) {
            whereClause[Op.and].push({
                eventDate: {
                    [Op.between]: [startDate, endDate] // Filter events within a date range
                }
            });
        }

        // Fetch events within the specified radius and other filters
        const events = await Event.findAll({
            where: whereClause,
            include: [
                { model: Category, attributes: ['name'] },
                { model: User, attributes: ['username'] }
            ]
        });

        if (events.length === 0) {
            return res.status(404).json({ message: "No events found for the specified location and filters." });
        }

        // Send the filtered events
        res.json(events);
    } catch (error) {
        console.error("Error fetching events by radius:", error);
        res.status(500).json({ message: req.t('server_error') });
    }
};

// Update an event
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

// Delete an event
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).json({ message: req.t('event_not_found') });
        }

        await event.destroy();
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: req.t('server_error') });
    }
};

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



