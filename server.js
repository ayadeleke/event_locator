const app = require('./app');
const { sequelize } = require('./src/config/sequelize');

const PORT = process.env.PORT || 3000;

sequelize.authenticate()
    .then(() => {
        console.log('Connected to PostgreSQL database successfully');
        return sequelize.sync();
    })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to the database:', err);
    });
