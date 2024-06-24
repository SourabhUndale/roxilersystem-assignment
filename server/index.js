const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');



const app = express();
app.use(express.json());



const corsOptions = {
    origin: 'http://localhost:3001', // React frontend origin
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));

mongoose.connect('mongodb://localhost:27017/product-transactions', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const transactionSchema = new mongoose.Schema({
    id: String,
    title: String,
    description: String,
    price: Number,
    dateOfSale: Date,
    category: String,
    sold: Boolean,
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Fetch and initialize database with seed data
app.get('/initialize', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        await Transaction.deleteMany(); // Clear existing data
        await Transaction.insertMany(response.data); // Seed new data
        res.send({ message: 'Database initialized with seed data' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

// /transactions
app.get('/transactions', async (req, res) => {
    const { search = '', page = 1, perPage = 10 } = req.query;
    const query = {
        $or: [
            { title: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') },
            { price: !isNaN(search) ? Number(search) : undefined },
        ].filter(Boolean),
    };

    try {
        const transactions = await Transaction.find(query)
            .skip((page - 1) * perPage)
            .limit(Number(perPage));
        res.send(transactions);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//satatistics

app.get('/statistics', async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`${month} 1, 2022`);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);

    try {
        const totalSales = await Transaction.aggregate([
            { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
            { $group: { _id: null, totalAmount: { $sum: '$price' }, totalSoldItems: { $sum: 1 } } },
        ]);

        const notSoldItems = await Transaction.countDocuments({
            dateOfSale: { $gte: startDate, $lt: endDate },
            sold: false,
        });

        res.send({
            totalSaleAmount: totalSales[0]?.totalAmount || 0,
            totalSoldItems: totalSales[0]?.totalSoldItems || 0,
            totalNotSoldItems: notSoldItems,
        });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//bar-chart
app.get('/bar-chart', async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`${month} 1, 2022`);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);

    try {
        const priceRanges = [
            { range: '0-100', min: 0, max: 100 },
            { range: '101-200', min: 101, max: 200 },
            { range: '201-300', min: 201, max: 300 },
            { range: '301-400', min: 301, max: 400 },
            { range: '401-500', min: 401, max: 500 },
            { range: '501-600', min: 501, max: 600 },
            { range: '601-700', min: 601, max: 700 },
            { range: '701-800', min: 701, max: 800 },
            { range: '801-900', min: 801, max: 900 },
            { range: '901-above', min: 901, max: Infinity },
        ];

        const barChart = await Promise.all(
            priceRanges.map(async ({ range, min, max }) => {
                const count = await Transaction.countDocuments({
                    dateOfSale: { $gte: startDate, $lt: endDate },
                    price: { $gte: min, $lt: max === Infinity ? 1e9 : max },
                });
                return { range, count };
            })
        );

        res.send(barChart);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});


//pie-chart
app.get('/pie-chart', async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`${month} 1, 2022`);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);

    try {
        const categories = await Transaction.aggregate([
            { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
        ]);

        res.send(categories.map(({ _id, count }) => ({ category: _id, count })));
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});


//combined
app.get('/combined', async (req, res) => {
    const { month } = req.query;

    try {
        const [transactions, statistics, barChart, pieChart] = await Promise.all([
            axios.get(`http://localhost:3000/transactions?month=${month}`),
            axios.get(`http://localhost:3000/statistics?month=${month}`),
            axios.get(`http://localhost:3000/bar-chart?month=${month}`),
            axios.get(`http://localhost:3000/pie-chart?month=${month}`),
        ]);

        res.send({
            transactions: transactions.data,
            statistics: statistics.data,
            barChart: barChart.data,
            pieChart: pieChart.data,
        });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});
