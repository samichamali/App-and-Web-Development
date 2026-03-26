const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const Product = require('./functions/products');
const User = require('./functions/users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // 1. Import CORS

dotenv.config();

// initialising the app
const app = express();
app.use(cors());

// middleware, being apple to parse uploads and request bodies
app.use('/uploads', express.static('uploads')); // Serve images
app.use(express.json());
// have all files served from this "public" file.
app.use(express.static(path.join(__dirname, 'public')));

// point the public website to the folder than contains its information (public)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MULTER config (Storage logic) we have to use this, since node.js doesnt have built-in file uploading capabilities.
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

const dbURI = 'mongodb://db:27017/appleStore';
mongoose.connect(dbURI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("PROBLEM: ", err));



// API Function to add products to the database on mongodb, we are using mongoose on node.js.
app.post('/api/addproduct', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;
        const newProduct = new Product({
            name,
            description,
            price,
            category,
            stock,
            image: req.file ? `uploads/${req.file.filename}` : ''
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API Function used to register users to the platform, it also contains fail safes checking if a user already exists.
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // check if user exists and stop if true
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        // hashing the password (traditional method)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // if all the previous functions and checks worked, created the user and add them to database.
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            message: "success"
        });
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});


app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: "Invalid email or password"});

        // check their hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid email or password"});

        // if everything is alright assign them a token
        const token = jwt.sign(
            { id: user._id},
            process.env.JWT_SECRET || '8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
            { expiresIn: '30d' }
            // we could use an env variable but we can stick to a preset string for now, it's not a serious test.
        );

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: token // This is what the frontend will save
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route to get all products
app.get('/api/products', async (req, res) => {
    try {
        // 1. Fetch all products from the database
        // .sort({ createdAt: -1 }) puts the newest Apple gear at the top
        const products = await Product.find({}).sort({ createdAt: -1 });

        // 2. Check if the store is empty
        if (products.length === 0) {
            return res.status(404).json({ message: "No products found in the store." });
        }

        // 3. Return the list to the frontend
        res.json(products);
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ message: "Server error while fetching products" });
    }
});

app.use('/api/transactions', require('./information/transactions'));

// Turn the server on on the specfic port 5000, accessible on localhost:5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`runnig on ${PORT}`));