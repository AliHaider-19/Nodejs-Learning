const express = require('express')
const router = express.Router();
const authMiddleware = require('../middleware/validation')
const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const limiter = require('../middleware/rateLimiter');
const nodemailer = require('nodemailer');
const mailer = require('../middleware/mailer');



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

    const { email, password } = req.body;
    try {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const user = await User.findOne({ email: email });
        console.log(user);
        if (!user) {
            return res.status(400).send('Login failed! User not found.');
        }

        const confirmPass = await bcrypt.compare(password, user.password);
        if (confirmPass) {
            const token = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.SECRET_KEY,
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
        const { email, password, role } = req.body;
        const saltRounds = 10;
        if (!email || !password) {
            throw new Error('Email and Password required!')
        }

        if (password.length < 8) {
            throw new Error('Password should be 8 character long!')
        }
        const hasedPassword = await bcrypt.hash(password, saltRounds);
        const user = await User.create({
            email: email,
            password: hasedPassword,
            role: role
        })
        await user.save();

        const verificationToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '10m' })
        const verificationLink = `${req.protocol}://${req.get('host')}/verify-email?token=${verificationToken}`;

        await mailer(email, verificationLink);
        res.status(200).send('Resgiteration Completed!')

    }
    catch (err) {
        res.status(400).send(err.message);
        throw new Error(err.message)
    }
})
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        if (user.verified) {
            return res.status(400).json({ message: 'Email is already verified.' });
        }
        user.verified = true;
        await user.save();

        res.status(200).json({ message: 'Email successfully verified.' });
    } catch (error) {
        res.status(400).json({ error: 'Invalid or expired token.' });
    }
});


router.post('/request-reset-password', async (req, res) => {
    try {

        const email = req.body.email;
        const user = await User.findOne({ email: email });
        if (!user) {
            res.status(404).send('User not found');
        }
        const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '10m' });
        res.status(200).json({ message: 'You can reset your password now', token });
    }
    catch (err) {
        res.status(400).send(err.message);
        throw new Error(err.message)
    }
})


router.post('/reset-password', authMiddleware, async (req, res) => {
    try {
        const saltRounds = 10;
        const password = req.body.password;
        const hasedPassword = await bcrypt.hash(password, saltRounds)
        const user = await User.updateOne({ _id: req.user.id }, { password: hasedPassword })
        if (user) {
            res.status(200).send('Password reset Successfully!');
        }
        else {
            res.status(400).send('Failed during reset password');
        }
    }
    catch (err) {
        res.status(400).send(err.message)
        throw new Error(err.message)
    }
})




module.exports = router;