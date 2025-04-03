const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * Swagger definition
 * You can change the options based on your needs
 */
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Event Locator APP',
            version: '1.0.1',
            description: 'API documentation for the Event Locator application',
            contact: {
                name: 'Ayotunde Adeleke',
                email: 'a.adeleke@alustudent.com'
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local development server'
            }
        ],
        components: {
            securitySchemes: {
              bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
              },
            },
            parameters: {
                AcceptLanguage: {
                    name: 'Accept-Language',
                    in: 'header',
                    description: 'Language preference for the response (e.g., "en" for English, "es" for Spanish).',
                    required: false,
                    schema: {
                        type: 'string',
                        example: 'en'
                    }
                },
            },
        },
    },
    apis: ['./src/routes/*.js', './src/controllers/*.js'], // Path to the API routes and controllers
};

/**
 * Initialize swagger-jsdoc
 */
const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = {
    swaggerUi,
    swaggerSpec,
};
