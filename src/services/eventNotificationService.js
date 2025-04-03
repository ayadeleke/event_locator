const { User, Event } = require('./src/models'); // Assuming you have a User and Event model
const sendEmailNotification = require('./src/services/emailService');

// Function to send email notifications to users within 50km of the event
async function sendEventNotifications(eventId) {
    try {
        // Retrieve the event details
        const event = await Event.findByPk(eventId);
        if (!event) {
            console.error('Event not found');
            return;
        }

        // Get the event's latitude and longitude
        const eventLat = event.latitude;
        const eventLng = event.longitude;

        // Query for users within 50km of the event using PostGIS or your preferred method
        const users = await User.findAll({
            where: sequelize.literal(`
                ST_DWithin(
                    ST_SetSRID(ST_Point(longitude, latitude), 4326), 
                    ST_SetSRID(ST_Point(${eventLng}, ${eventLat}), 4326), 
                    50000)  -- 50 km radius
            `)
        });

        if (users.length === 0) {
            console.log('No users found within 50km radius');
            return;
        }

        // Send email notification to each user
        for (let user of users) {
            const subject = `Upcoming Event: ${event.name}`;
            const message = `Don't miss out on the upcoming event: ${event.name} on ${event.date}.`;

            await sendEmailNotification(user.email, subject, message);
        }

        console.log('Email notifications sent successfully to users within 50km radius');
    } catch (error) {
        console.error('Error sending email notifications:', error);
    }
}

// Example: Call this function when a new event is created
sendEventNotifications(newEventId);
