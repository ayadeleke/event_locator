const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const ratingController = require('../controllers/ratingController');
const { testEmailNotification } = require('../controllers/emailController');

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: API for managing events and event ratings
 */

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Retrieve a list of events with optional filtering
 *     tags: [Events]
 *     description: Fetch events based on category, address, or location-based radius filtering. Filters are optional and can be combined. Pagination is supported for efficient event retrieval.
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           example: "music"
 *         description: Filter events by category (e.g., "environment", "music").
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *           example: "New York"
 *         description: Filter events by address.
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *           example: 40.7128
 *         description: Latitude for location-based filtering (must be used with longitude and radius).
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *           example: -74.0060
 *         description: Longitude for location-based filtering.
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *           format: int32
 *           example: 5000
 *         description: Search radius in meters (only applicable when latitude and longitude are provided).
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: The page number for pagination (default is 1).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: The number of events per page (default is 10).
 *     responses:
 *       200:
 *         description: A list of filtered events with pagination info.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Events fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalCount:
 *                       type: integer
 *                       example: 50
 *       400:
 *         description: Bad request due to invalid query parameters.
 *       500:
 *         description: Internal server error.
 */
router.get('/', eventController.getEvents);


/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get an event by ID
 *     tags: [Events]
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - name: id
 *         in: path
 *         description: Event ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 date:
 *                   type: string
 *                   format: date-time
 *                 location:
 *                   type: string
 *       404:
 *         description: Event not found
 */
router.get('/:id', eventController.getEventById);

// Protected routes

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event (admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *             example:
 *               title: "Concert"
 *               description: "Live concert by famous band."
 *               date: "2025-05-20T19:00:00Z"
 *               location: "Los Angeles, CA"
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.post('/', authenticate, authorize(['admin']), eventController.createEvent);

/**
 * @swagger
 * /events/{id}/rate:
 *   post:
 *     summary: Rate an event (authenticated users only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - name: id
 *         in: path
 *         description: Event ID to rate
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: ""
 *     responses:
 *       200:
 *         description: Rating submitted successfully
 *       400:
 *         description: Invalid rating
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.post('/:id/rate', authenticate, ratingController.rateEvent);

/**
 * @swagger
 * /events/{id}/ratings:
 *   get:
 *     summary: Get all ratings for an event
 *     tags: [Events]
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - name: id
 *         in: path
 *         description: Event ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of ratings for the event
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: integer
 *                   rating:
 *                     type: integer
 *                   comment:
 *                     type: string
 *       404:
 *         description: Event not found
 */
router.get('/:id/ratings', ratingController.getRatingsForEvent);

// Restricted routes (admin only)

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Update an event (admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - name: id
 *         in: path
 *         description: Event ID to update
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *             example:
 *               title: "Updated Concert"
 *               description: "Updated live concert event."
 *               date: "2025-06-10T19:00:00Z"
 *               location: "New York, NY"
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Event not found
 */
router.put('/:id', authenticate, authorize(['admin']), eventController.updateEvent);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete an event (admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - name: id
 *         in: path
 *         description: Event ID to delete
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Event not found
 */
router.delete('/:id', authenticate, authorize(['admin']), eventController.deleteEvent);

/**
 * @swagger
 * /events/{eventId}/rating/{id}:
 *   delete:
 *     summary: Delete a rating for an event (authenticated users only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - name: eventId
 *         in: path
 *         description: Event ID
 *         required: true
 *         schema:
 *           type: integer
 *       - name: id
 *         in: path
 *         description: Rating ID to delete
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rating deleted successfully
 *       404:
 *         description: Rating or event not found
 */
router.delete('/:eventId/rating/:id', authenticate, ratingController.deleteRating);

module.exports = router;
