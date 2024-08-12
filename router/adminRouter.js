const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/validation')


router.get('/:id', authMiddleware, (req, res) => {
    const role = req.user.role;
    if (role.toLowerCase() === 'admin') {
        res.status(200).send(`Admin id is ${id}`)
    }
})
router.get('/profile', authMiddleware, (req, res) => {
    const role = req.user.role;
    if (role.toLowerCase() === 'admin') {
        res.status(200).send('You name is Ali Haider');
    }
})


module.exports = router