const express = require('express')
const router = express.Router();
const authMiddleware = require('../middleware/validation')
const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const limiter = require('../middleware/rateLimiter');
const nodemailer = require('nodemailer');
const mailer = require('../middleware/mailer');
const path = require('path')



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
                { userId: user._id, role: user.role },
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
        await mailer(user.email, token);

        res.status(200).json({ message: 'You can reset your password now', token });
    }
    catch (err) {
        res.status(400).send(err.message);
        throw new Error(err.message)
    }
})


router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.password = await bcrypt.hash(newPassword, 10); // Make sure to hash the password
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        res.status(400).json({ error: 'Invalid or expired token' });
    }
});



router.get('/download/:filename', authMiddleware, (req, res) => {
    try {
        const filename = req.params.filename;

        const filepath = path.join(__dirname, '../uploads', filename);
        console.log(filepath)
        if (filepath) {

            res.download(filepath, (err) => {
                if (err) {
                    res.status(404).send('Provided file path is not provided')
                }
            })
        }

        else {
            throw new Error('You are not allowed to this page')
        }
    }
    catch (err) {
        res.status(404).send('You are not authorized to this page');
    }
})



router.get('/user-details', authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.params.page) || 1;
        const limit = parseInt(req.params.limit) || 10;
        const offset = (page - 1) * limit;

        const users = await User.find().skip(offset).limit(limit);
        const totalUsers = await User.countDocuments();
        if (users.length > 0) { // Check if users array is not empty
            res.status(200).json({
                users,
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers
            });
        } else {
            res.status(404).send('No user data found!');
        }
    } catch (err) {
        res.status(500).send('Something went wrong');
    }
});





router.get('/search', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offSet = (page - 1) * limit;

    const search = req.query || '';

    const query = {
        $or: [
            { username: new RegExp(search, 'i') },
            { email: new RegExp(search, 'i') }
        ]
    };

    try {
        const users = await User.find(query).skip(offSet).limit(limit);
        const totalUsers = await User.countDocuments(query);

        if (users.length > 0) {
            return res.json({
                users,
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers
            });
        } else {
            return res.send('No user data found against this username');
        }
    } catch (error) {
        return res.status(500).send('An error occurred while searching for users');
    }
});






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



module.exports = router;