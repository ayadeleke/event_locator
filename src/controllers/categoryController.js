const Category = require('../models/category');

// Create a new category
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: req.t('category_name_required') });
        }

        const [category, created] = await Category.findOrCreate({
            where: { name },
            defaults: { description }
        });

        if (!created) {
            return res.status(400).json({ message: req.t('category_already_exists') });
        }

        res.status(201).json({ message: req.t('category_created'), category });
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ message: req.t('server_error') });
    }
};

// Get all categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: req.t('server_error') });
    }
};

// Get a category by ID
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ message: req.t('category_not_found') });
        }
        res.json(category);
    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ message: req.t('server_error') });
    }
};

// Update a category
exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ message: req.t('category_not_found') });
        }

        await category.update(req.body);
        res.json({ message: req.t('category_updated'), category });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ message: req.t('server_error') });
    }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ message: req.t('category_not_found') });
        }

        await category.destroy();
        res.status(204).send(); // No content
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: req.t('server_error') });
    }
};
