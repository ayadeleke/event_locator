const request = require('supertest');
const app = require('../app');

describe('🌍 Geospatial & Search Tests', () => {
    it('should return events near a location', async () => {
        const res = await request(app).get('/api/events/nearby?lat=6.5244&lng=3.3792&radius=5000');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter events by category', async () => {
        const res = await request(app).get('/api/events/category/Technology');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
