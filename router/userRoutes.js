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
const redisClient = require('../redisClient')
const fs = require('fs');
const { error } = require('console');



router.post('/login', limiter, async (req, res, next) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Login failed! User not found.' });
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
            res.status(400).json({ error: 'Login Failed!' });
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
            return res.status(400).json({ error: 'Email and Password required!' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password should be 8 characters long!' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = await User.create({
            email,
            password: hashedPassword,
            role
        });

        const verificationToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '10m' });
        const verificationLink = `${req.protocol}://${req.get('host')}/verify-email?token=${verificationToken}`;

        await mailer(email, verificationLink);
        res.status(200).json({ message: 'Registration Completed!' });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
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
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ message: 'If this email is registered, you will receive a password reset link.' });
        }
        const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '10m' });
        await mailer(user.email, token);

        res.status(200).json({ message: 'You can reset your password now', token });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});



router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findById(decoded.id);

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

        if (path.exists(filepath)) {
            return res.download(filepath, (err) => {
                if (err) {
                    return res.status(404).json({ error: 'File not found' });
                }
            });
        } else {
            return res.status(404).json({ error: 'File not found' });
        }
    } catch (err) {
        res.status(403).json({ error: 'You are not authorized to access this page' });
    }
});



router.get('/user-details', authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.params.page) || 1;
        const limit = parseInt(req.params.limit) || 10;
        const offset = (page - 1) * limit;

        const cacheKey = `useDetails ${page}:${limit}`;

        redisClient.get(cacheKey, async (err, cachedData) => {
            if (err) throw err;
            if (cachedData) {
                return res.status(200).json(JSON.parse(cachedData));
            }
            else {
                const users = await User.find().skip(offset).limit(limit);
                const totalUsers = await User.countDocuments();
                if (users.length > 0) { // Check if users array is not empty
                    const response = {
                        users,
                        currentPage: page,
                        totalPages: Math.ceil(totalUsers / limit),
                        totalUsers
                    };

                    redisClient.setEx(cacheKey, 60, JSON.stringify(response));
                    res.status(200).json(response);

                } else {
                    res.status(404).send('No user data found!');
                }
            }
        })
    } catch (err) {
        res.status(500).send('Something went wrong');
    }
});





router.get('/search', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offSet = (page - 1) * limit;

    const search = req.query.search || '';

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
            return res.status(404).json({ error: 'No user data found against this username' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while searching for users' });
    }
});



router.delete('/delete-file/:filename', authMiddleware, async (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '../uploads/', filename);
    if (fs.existsSync(filepath)) {
        fs.unlink(filepath, (err) => {
            if (err) {
                res.status(500).json({ error: "Failed to delete the file" });
            }
            res.status(200).json({ message: "File deleted successfully!" })
        })
    }
    else {
        res.status(404).json({ error: "File does not exists" });
    }

})



router.get('/:id', authMiddleware, (req, res) => {
    const id = req.params.id;
    console.log(id);
    if (id) {
        res.send(`User id is ${id}`);
    } else {
        res.send('User id is null');
    }

});

module.exports = router;