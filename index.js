const express = require('express')
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/userModel')

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
    // fileFilter: (req, file, cb) => {
    //     if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'||file.) {
    //         cb(null, true)
    //     }
    //     else {
    //         cb(new Error('Invalid File Type'))
    //     }
    // }
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
    const tempPath = req.fil.path;
    const targetPath = path.join(__dirname, '../uploads/', req.file.originalname);
    fs.rename(tempPath, targetPath, err => {
        if (err) {
            return res.status(500).json({ error: 'File upload failed' });
        }
        res.status(200).json({
            message: "File uploaded successfully!",
            filename: req.file.originalname,
            size: req.file.size,
            path: req.file.path
        })
    })
})

// File Handling

app.post('/:filename', (req, res) => {
    const filename = req.params.filename;
    const uploadsDir = path.join(__dirname, './uploads');
    const filePath = path.join(uploadsDir, filename);
    const data = "my name is Ali Haider";

    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }

    // Write the file
    fs.writeFile(filePath, data, (err) => {
        if (err) {
            console.log('There was an error writing to the file');
            return res.status(500).send('Error writing file');
        }

        // Read the file after writing
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                console.error('There was an error reading the file', err);
                return res.status(500).send('Error reading file');
            }
            console.log('File content:', data);
            res.status(200).send(data); // Respond with the file content
        });
    });
});





app.use(error)
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', () => {
    console.error('There is some error on server side')
})

