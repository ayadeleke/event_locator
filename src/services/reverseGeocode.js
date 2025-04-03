const axios = require('axios');

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