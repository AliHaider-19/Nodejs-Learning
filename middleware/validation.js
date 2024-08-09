const jwt = require('jsonwebtoken');

module.exports = validation = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header found' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token is missing' });
    }
    try {
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        console.log('Token Validated')
        req.user = decodedToken;  // Attach decoded token to request object if needed later

        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

