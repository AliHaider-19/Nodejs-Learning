const jwt = require('jsonwebtoken');
module.exports = validation = (req, res, next) => {

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header found' });
    }
    const token = authHeader.split(' ')[1]
    const decodeToken = jwt.verify(token, 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')
    if (!decodeToken) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    else {
        next();
    }

}