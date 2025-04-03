const axios = require('axios');

const geocodeAddress = async (address) => {
    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
            params: {
                address,
                key: apiKey
            }
        });

        if (response.data.status === 'OK') {
            const { lat, lng } = response.data.results[0].geometry.location;
            return { lat, lng };
        } else {
            throw new Error(`Geocoding error: ${response.data.status}`);
        }
    } catch (error) {
        console.error("Geocoding error:", error);
        throw new Error('Unable to geocode the address');
    }
};

module.exports = { geocodeAddress };
