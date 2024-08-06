module.exports = validation = (req, res, next) => {

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header found' });
    }
    const token = authHeader.split(' ')[1]
    if (token !== 'your-secure-token') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    next();
}