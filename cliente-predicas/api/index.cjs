// Vercel toma todo lo que está en /api como función serverless.
// .cjs porque el package.json del frontend tiene "type": "module" y el
// backend (require/module.exports) es CommonJS — así conviven sin tocar nada más.
module.exports = require('../../index.js');
