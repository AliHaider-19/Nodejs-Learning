const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = []
io.on('connection', (socket) => {
    // socket.custome = () => {
    //     console.log('Ali Haider')
    // }
    console.log('User Connected');
    // console.log('Socket Id', socket.id);
    // socket.custome()
    // console.log('Socket Rooms', socket.rooms);

    socket.on('adduser', username => {
        socket.user = username;
        users.push(username)
        io.sockets.emit('users', users)
        io.to(socket.id).emit('private', {
            id: socket.id,
            name: socket.user,
            msg: "Welcome to the chat!",
        })
    })

    // socket.on('chat message', (msg) => {
    //     console.log(msg);
    //     io.emit('chat message', msg); // Ensure consistent event name
    // });
    socket.on("message", message => {
        io.sockets.emit("message", {
            message,
            user: socket.user,
            id: socket.id,
        });
    });



    // socket.on('disconnect', () => {
    //     console.log('User Disconnected');
    // });
    socket.on("disconnect", () => {
        console.log(`user ${socket.user} is disconnected`);
        if (socket.user) {
            users.splice(users.indexOf(socket.user), 1);
            io.sockets.emit("user", users);
            console.log("remaining users:", users);
        }
    });
});

require('dotenv').config();
const connection = () => {
    mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => console.error('Failed to connect to MongoDB', err));
};

connection();

const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }
});

const logging = require('./middleware/logging');
const error = require('./middleware/error');
const userRouter = require('./router/userRoutes');
const adminRouter = require('./router/adminRouter');

app.use(logging);
app.use('/user', userRouter);
app.use('/admin', adminRouter);

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.get('/greet', (req, res) => {
    const name = req.query.name;
    if (name) {
        res.send(`Hello ${name}`);
    } else {
        res.send('Hello, Guest!');
    }
});

app.post('/upload', upload.single('file'), (req, res) => {
    const tempPath = req.file.path;
    const targetPath = path.join(__dirname, 'uploads', req.file.originalname);

    fs.rename(tempPath, targetPath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'File upload failed' });
        }
        res.status(200).json({
            message: "File uploaded successfully!",
            filename: req.file.originalname,
            size: req.file.size,
            path: targetPath
        });
    });
});

// File Handling
app.post('/:filename', (req, res) => {
    const filename = req.params.filename;
    const uploadsDir = path.join(__dirname, 'uploads');
    const filePath = path.join(uploadsDir, filename);
    const data = "my name is Ali Haider";

    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
        try {
            fs.mkdirSync(uploadsDir);
        } catch (err) {
            return res.status(500).send('Error creating directory');
        }
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

app.use(error);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', () => {
    console.error('There is some error on server side');
});
