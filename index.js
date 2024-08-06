const express = require('express')

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(express.static('public'))

const logging = require('./middleware/logging')

const error = require('./middleware/error')
const userRouter = require('./router/userRoutes')
const authMiddleware = require('./middleware/validation')

app.use(logging);
app.use('/user', userRouter);

app.get('/', (req, res) => {
    res.send('Hello, World!');
})


app.get('/about', (req, res) => {
    res.send('This is the about page');
})

app.get('/greet', (req, res) => {
    const name = req.query.name;
    if (name) {
        res.send(`Hello ${name}`);
    }
    else {
        res.send('Hello, Guest!')
    }
})


app.post('/login', authMiddleware, (req, res, next) => {
    const { username, password } = req.body;
    try {

        if (!username || !password) {
            throw new Error('Username and password is required')
        }
        if (username == 'admin' && password == 'password') {
            res.send('Login Successful!')
        }
        else {
            res.send('Login Faild!')
        }
    }
    catch (err) {
        next(err)
    }

})



app.use(error)
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', () => {
    console.error('There is some error on server side')
})