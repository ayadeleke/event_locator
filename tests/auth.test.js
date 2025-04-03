const request = require('supertest');
const app = require('../app');

describe('🔐 Authentication Tests', () => {
    let token;

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Password123!',
                preferred_language: 'en'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        token = res.body.token;
    });

    it('should not register a user with an existing email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Password123!',
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('email_exists');
    });

    it('should login an existing user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'Password123!',
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should reject login with incorrect credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'wrongpassword',
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('invalid_credentials');
    });
});
