module.exports = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    if (Object.keys(req.params).length > 0) {
        console.log('Params:', req.params);
    }
    if (Object.keys(req.query).length > 0) {
        console.log('Query:', req.query);
    }
    if (Object.keys(req.body).length > 0) {
        console.log('Body:', req.body);
    }

    next();
};
