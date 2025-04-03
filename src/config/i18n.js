const i18next = require('i18next');
const en = require('../locales/en.json');
const es = require('../locales/es.json');
const fr = require('../locales/fr.json');
const de = require('../locales/de.json');
const pl = require('../locales/pl.json');

i18next.init({
    lng: 'en', // Default language
    resources: {
        en: { translation: en },
        es: { translation: es },
        fr: { translation: fr },
        de: { translation: de },
        pl: { translation: pl },
    },
    fallbackLng: 'en',
});

module.exports = i18next;
