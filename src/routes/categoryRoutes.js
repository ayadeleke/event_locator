const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: API for managing categories
 */

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Only admin can create category)
 */
router.post('/', authenticate, authorize(['admin']), categoryController.createCategory);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   example: 
 *                     id: 1
 *                     name: 'Music'
 *                     description: 'All things music related'
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The category ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *       404:
 *         description: Category not found
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update an existing category by ID (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The category ID
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *             example:
 *               name: 'Art'
 *               description: 'All things related to art'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Only admin can update category)
 *       404:
 *         description: Category not found
 */
router.put('/:id', authenticate, authorize(['admin']), categoryController.updateCategory);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category by ID (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The category ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Only admin can delete category)
 *       404:
 *         description: Category not found
 */
router.delete('/:id', authenticate, authorize(['admin']), categoryController.deleteCategory);

module.exports = router;
