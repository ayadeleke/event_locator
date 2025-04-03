const request = require('supertest');
const app = require('../app');

describe('📍 Event Management Tests', () => {
    let token;
    let eventId;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'Password123!' });

        token = res.body.token;
    });

    it('should create a new event', async () => {
        const res = await request(app)
            .post('/api/events/')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Tech Conference',
                location: 'Lagos, Nigeria',
                date: '2025-05-10T12:00:00Z',
                category: 'Technology'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        eventId = res.body.id;
    });

    it('should fetch all events', async () => {
        const res = await request(app).get('/api/events/');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should fetch a single event by ID', async () => {
        const res = await request(app).get(`/api/events/${eventId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe('Tech Conference');
    });

    it('should update an event', async () => {
        const res = await request(app)
            .put(`/api/events/${eventId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Updated Conference' });

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe('Updated Conference');
    });

    it('should delete an event', async () => {
        const res = await request(app)
            .delete(`/api/events/${eventId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
    });
});
