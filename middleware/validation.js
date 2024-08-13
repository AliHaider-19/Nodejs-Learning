const jwt = require('jsonwebtoken');

module.exports = validation = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        console.log('Authorization header missing');
        return res.status(401).json({ error: 'No authorization header found' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log('Token missing in authorization header');
        return res.status(401).json({ error: 'Token is missing' });
    }

    try {
        console.log('Token received:', token);
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        console.log('Token decoded successfully:', decodedToken);
        req.user = decodedToken;  // Attach decoded token to request object

        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};
