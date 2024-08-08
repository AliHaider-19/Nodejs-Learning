const rateLimiter = require('express-rate-limit')


const limiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
})

module.exports = limiter;