const express = require('express')
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config();
const connection = () => {
    mongoose.connect(process.env.MONGO_URL)
    console.log('Connected')
}

connection();

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));


const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdir(uploadDir)
}


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true)
        }
        else {
            cb(new Error('Invalid File Type'))
        }
    }
})
const logging = require('./middleware/logging')
const error = require('./middleware/error')
const userRouter = require('./router/userRoutes')
const adminRouter = require('./router/adminRouter')

app.use(logging);
app.use('/user', userRouter);
app.use('/admin', adminRouter)

app.get('/', (req, res) => {
    res.send('Hello, World!');
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


app.post('/upload', upload.single('file'), (req, res) => {
    res.json({
        message: "File uploaded Successfully!",
        filename: req.file.originalname,
        size: req.file.size,
        path: req.file.path
    })

})

app.use(error)
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', () => {
    console.error('There is some error on server side')
})