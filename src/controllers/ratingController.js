const Rating = require('../models/rating');
const Event = require('../models/events');

exports.rateEvent = async (req, res) => {
    const { id } = req.params; // Event ID
    const { rating, comment } = req.body;
    const user_id = req.user.id; // Extracted from JWT

    try {
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Rating must be between 1 and 5." });
        }

        // Check if user already rated this event
        let existingRating = await Rating.findOne({ where: { user_id, event_id: id } });

        if (existingRating) {
            // Update existing rating
            existingRating.rating = rating;
            existingRating.comment = comment || existingRating.comment;
            await existingRating.save();
        } else {
            // Create new rating
            await Rating.create({ user_id, event_id: id, rating, comment });
        }

        // Recalculate average rating for event
        const ratings = await Rating.findAll({ where: { event_id: id } });
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

        await Event.update({ averageRating: avgRating }, { where: { id } });

        res.json({ message: "Rating submitted successfully.", rating: [rating, comment], averageRating: avgRating });
    } catch (error) {
        res.status(500).json({ error: "An error occurred while rating the event." });
    }
};

// Get ratings for an event
exports.getRatingsForEvent = async (req, res) => {
    const { id } = req.params; // Event ID

    try {
        const ratings = await Rating.findAll({ where: { event_id: id } });

        if (ratings.length === 0) {
            return res.json({ message: "No ratings yet for this event.", ratings: [] });
        }

        // Calculate average rating safely
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

        res.json({ averageRating: avgRating, ratings });
    } catch (error) {
        console.error("Error retrieving ratings:", error);
        res.status(500).json({ error: "An error occurred while retrieving ratings." });
    }
};


// Delete a rating
exports.deleteRating = async (req, res) => {
    const { id } = req.params; // Rating ID
    const user_id = req.user.id; // Extracted from JWT

    try {
        const rating = await Rating.findOne({ where: { id, user_id } });

        if (!rating) {
            return res.status(404).json({ error: "Rating not found or you do not have permission to delete it." });
        }

        await rating.destroy();

        // Recalculate average rating for event
        const ratings = await Rating.findAll({ where: { event_id: rating.event_id } });
        const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

        await Event.update({ averageRating: avgRating }, { where: { id: rating.event_id } });

        res.json({ message: "Rating deleted successfully.", averageRating: avgRating });
    } catch (error) {
        res.status(500).json({ error: "An error occurred while deleting the rating." });
    }
};

