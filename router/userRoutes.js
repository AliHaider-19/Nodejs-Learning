const express = require('express')
const router = express.Router();
const authMiddleware = require('../middleware/validation')
const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');



router.get('/:id', authMiddleware, (req, res) => {

    const id = req.params.id;
    console.log(id)
    if (id) {
        res.send(`User id is ${id}`)
    }
    else {
        res.send('User id is null')
    }
})

router.post('/login', authMiddleware, async (req, res, next) => {
    const { username, password } = req.body;
    try {
        if (!username || !password) {
            throw new Error('Username and password is required')
        }
        // if (username == 'admin' && password == 'password') {
        //     res.send('Login Successful!')
        // }
        const user = await User.findOne({ username: username });
        console.log(user);
        if (!user) {
            return res.status(400).send('Login failed! User not found.');
        }

        const confirmPass = await bcrypt.compare(password, user.password);
        if (confirmPass) {
            const token = jwt.sign({ userId: user.id }, "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c", { expiresIn: "1h" });
            res.status(200).json({ message: 'Login Successful!', token });
        }
        else {
            res.send('Login Faild!')
        }
    }
    catch (err) {
        next(err)
    }

})


router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
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
                password: hasedPassword
            })
            user.save();
            res.status(200).send('Resgiteration Completed!')
        }
    }
    catch (err) {
        throw new Error(err.message)
    }
})


module.exports = router;