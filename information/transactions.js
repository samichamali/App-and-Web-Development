const express = require('express');
const router = express.Router();
const Transaction = require('../functions/transactions');
const Product = require('../functions/products');
const { protect } = require('../functions/auth');
// @route   POST /api/transactions
// @desc    Create a new order
router.post('/', protect, async (req, res) => {
    try {
        const { productIds } = req.body;

        // Calculate total price on the server (Security Best Practice!)
        const products = await Product.find({ _id: { $in: productIds } });
        const total = products.reduce((sum, p) => sum + p.price, 0);

        const newTransaction = new Transaction({
            userId: req.user.id, // Taken from the JWT token
            productIds,
            totalPrice: total
        });

        const savedTransaction = await newTransaction.save();
        res.json(savedTransaction);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/transactions
// @desc    Get all orders for the logged-in user
router.get('/', protect, async (req, res) => {
    try {
        // Find transactions where userId matches the token's user ID
        const orders = await Transaction.find({ userId: req.user.id })
            .populate('productIds') // This joins the product details (name, price) automatically
            .sort({ createdAt: -1 }); // Newest first

        res.json(orders);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;