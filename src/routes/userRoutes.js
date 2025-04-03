const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { register, login } = require('../controllers/authController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const i18next = require('i18next');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API for user authentication and management
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               preferred_language:
 *                 type: string
 *                 example: "en"
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: integer
 *                 role:
 *                   type: string
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */
router.post('/register', register);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Authenticate and log in a user
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: integer
 *                 role:
 *                   type: string
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/login', login);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all registered users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: List of registered users
 *       403:
 *         description: Forbidden (only admins can access)
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticate, authorize(['admin']), async (req, res) => {
    try {
        console.log("Request User:", req.user);  // Log the user to check decoded token
        const users = await User.findAll(); // If using Sequelize
        res.json(users);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ message: req.t('server_error') });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a single user by ID
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to retrieve
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: req.t('user_not_found') }); // Translated error message
        }
        res.json(user);
    } catch (err) {
        console.error("Error fetching user by ID:", err);
        res.status(500).json({ message: req.t('server_error') }); // Translated error message
    }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user by ID (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               preferred_language:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Forbidden (only admins can update)
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: req.t('user_not_found') });
        }
        await user.update(req.body);
        res.json({
            message: req.t('user_updated_successfully'),  // Translated success message
            user: user
        });
    } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).json({ message: req.t('server_error') });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Forbidden (only admins can delete)
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: req.t('user_not_found') });
        }
        console.log(`Deleting user with ID: ${user.id}`);
        await user.destroy();
        res.status(200).json({ message: req.t('user_deleted_successfully') });  // Translated success message
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ message: req.t('server_error') });
    }
});

module.exports = router;
