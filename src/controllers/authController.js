const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const i18next = require('i18next');
require('dotenv').config();

async function geocodeAddress(address, language) {
    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            throw new Error(req.t('google_maps_api_key_missing'));
        }

        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: address,
                key: apiKey
            }
        });

        if (response.data.status === 'ZERO_RESULTS') {
            throw new Error(req.t('geocode_no_results', { address }));
        }

        if (response.data.status !== 'OK') {
            throw new Error(req.t('geocode_error', { status: response.data.status, error_message: response.data.error_message || 'No error details available' }));
        }

        const location = response.data.results[0]?.geometry.location;
        if (!location) {
            throw new Error(req.t('geocode_no_location_found'));
        }

        return [location.lng, location.lat]; 
    } catch (error) {
        console.error('Geocoding failed:', {
            address: address,
            error: error.message,
            stack: error.stack
        });
        throw new Error(req.t('geocode_failed', { address, error: error.message }));
    }
}


async function reverseGeocode(lat, lng, language) {
    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                latlng: `${lat},${lng}`,
                key: apiKey
            }
        });

        const address = response.data.results[0]?.formatted_address;
        return address || req.t('address_not_found');
    } catch (error) {
        console.error("Reverse geocoding error:", error);
        return req.t('address_not_found');
    }
}

exports.register = async (req, res) => {
    try {
        const { username, email, password, preferred_language, address } = req.body;

        if (!username || !email || !password || !preferred_language || !address) {
            return res.status(400).json({ message: req.t('missing_required_fields') });
        }

        let longitude, latitude;
        try {
            [longitude, latitude] = await geocodeAddress(address, preferred_language);
        } catch (geocodeError) {
            return res.status(400).json({
                message: req.t('address_geocoding_failed'),
                details: geocodeError.message,
                providedAddress: address
            });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: req.t('email_exists') });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            email,
            password_hash: hashedPassword,
            preferred_language,
            address: address,
            location: { type: 'Point', coordinates: [longitude, latitude] },
            role: "user"
        });

        const token = jwt.sign(
            { id: newUser.id, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const t = i18next.getFixedT(preferred_language || req.language);

        res.status(201).json({
            user_id: newUser.id,
            role: newUser.role,
            message: t('user_registered'),
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: req.t('server_error') });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: req.t('invalid_credentials') });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: req.t('invalid_credentials') });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            user_id: user.id,
            role: user.role,
            message: req.t('login_success'),
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: req.t('server_error') });
    }
};
