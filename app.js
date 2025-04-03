const express = require('express');
const passport = require('passport');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const i18nextMiddleware = require('i18next-express-middleware');
const i18next = require('./src/config/i18n');
const { swaggerUi, swaggerSpec } = require('./swagger');
const sendEmailNotification = require('./src/services/emailService');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(passport.initialize());
app.use(cookieParser());

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// i18n Middleware
app.use(i18nextMiddleware.handle(i18next));

// Custom Language Detection Middleware
app.use((req, res, next) => {
    // Get the preferred language from the 'Accept-Language' header
    const acceptLang = req.headers['accept-language'];

    // If no 'Accept-Language' header is present, fallback to other options (query or cookies)
    const queryLang = req.query.lang;
    const cookieLang = req.cookies.lang;

    // If 'Accept-Language' is provided, use the first language from it (e.g., 'en-US', 'fr-FR')
    const headerLang = acceptLang ? acceptLang.split(',')[0].split('-')[0] : null; // Extract the language part (e.g., 'en', 'fr')

    // Supported languages
    const supportedLangs = ['en', 'es', 'fr', 'de', 'pl'];

    // Determine the final language based on the order of preference
    const detectedLang = headerLang || queryLang || cookieLang || 'en';  // Default to 'en' if none found
    const finalLang = supportedLangs.includes(detectedLang) ? detectedLang : 'en'; // Fallback to 'en' if not supported

    // Attach language to request object and set translation function
    req.language = finalLang;
    req.t = i18next.getFixedT(finalLang); // Attach i18n translation function

    // Set language in cookie for future requests
    res.cookie('lang', finalLang, {
        maxAge: 900000,
        httpOnly: false,
        sameSite: 'strict'
    });

    next();
});


// Routes
app.use('/users', require('./src/routes/userRoutes'));
app.use('/events', require('./src/routes/eventRoutes'));
app.use('/categories', require('./src/routes/categoryRoutes'));

// Email Test Route
app.post('/test-email', async (req, res) => {
    try {
        const to = 'recipient@example.com';
        const subject = 'Test Email';
        const message = 'This is a test email.';
        await sendEmailNotification(to, subject, message);
        res.status(200).send('Email sent successfully');
    } catch (error) {
        res.status(500).send('Error sending email: ' + error.message);
    }
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Test Language Route
app.get('/test-lang', (req, res) => {
    const lang = req.query.lang || 'en';

    i18next.changeLanguage(lang, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Language change failed' });
        }

        res.json({
            selectedLanguage: lang,
            message: i18next.t('hello', { lng: lang }),
        });
    });
});

module.exports = app;
