const express = require('express')
const router = express.Router();
const authMiddleware = require('../middleware/validation')
const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const limiter = require('../middleware/rateLimiter');

router.get('/:id', authMiddleware, (req, res) => {
    const role = req.user.role; // Access role from req.user
    if (role === 'Admin') {
        const id = req.params.id;
        console.log(id);
        if (id) {
            res.send(`User id is ${id}`);
        } else {
            res.send('User id is null');
        }
    } else {
        res.status(403).send('You are not authorized to access this page');
    }
});


router.post('/login', limiter, async (req, res, next) => {

    const { username, password } = req.body;
    try {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        const user = await User.findOne({ username: username });
        console.log(user);
        if (!user) {
            return res.status(400).send('Login failed! User not found.');
        }

        const confirmPass = await bcrypt.compare(password, user.password);
        if (confirmPass) {
            const token = jwt.sign(
                { userId: user.id, role: user.role },
                'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
                { expiresIn: '1h' }
            );
            res.status(200).json({ message: 'Login Successful!', token });
        } else {
            res.status(400).send('Login Failed!');
        }
    } catch (err) {
        next(err);
    }
});

router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const saltRounds = 10;
        if (!username || !password) {
            throw new Error('Username and Password required!')
        }

        else if (password.length < 8) {
            throw new Error('Password should be 8 character long!')
        }
        else {
            const hasedPassword = await bcrypt.hash(password, saltRounds);
            const user = await User.create({
                username: username,
                password: hasedPassword,
                role: role
            })
            await user.save();
            res.status(200).send('Resgiteration Completed!')
        }
    }
    catch (err) {
        res.status(400).send(err.message);
        throw new Error(err.message)
    }
})


module.exports = router;