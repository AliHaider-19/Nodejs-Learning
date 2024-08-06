module.exports = (err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
    res.status(500).json({ error: err.message });
};
