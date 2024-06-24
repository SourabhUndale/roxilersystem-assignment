import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
// import './TransactionDashboard.css'; // Import the CSS file


ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// const [monthss, setMonthss] = useState('')

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const TransactionDashboard = () => {
    const [month, setMonth] = useState("March");
    const [transactions, setTransactions] = useState([]);
    const [statistics, setStatistics] = useState({});
    const [barChart, setBarChart] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const perPage = 10;

    const axiosInstance = axios.create({
        baseURL: 'http://localhost:3000', // Backend base URL
    });

    useEffect(() => {
        fetchTransactions();
        fetchStatistics();
        fetchBarChart();
    }, [month, search, page]);

    const fetchTransactions = async () => {
        const response = await axiosInstance.get('/transactions', {
            params: { month, search, page, perPage }
        });
        setTransactions(response.data);
    };

    const fetchStatistics = async () => {
        const response = await axiosInstance.get('/statistics', { params: { month } });
        setStatistics(response.data);
    };

    const fetchBarChart = async () => {
        const response = await axiosInstance.get('/bar-chart', { params: { month } });
        setBarChart(response.data);
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleMonthChange = (e) => {
        setMonth(e.target.value);
        setPage(1);
    };

    const nextPage = () => setPage(page + 1);
    const prevPage = () => setPage(page - 1);

    return (
        <div className="container">
            <div className="header">
                <div>
                    <label>Select Month: </label>
                    <select value={month} onChange={handleMonthChange}>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>

                <div>
                    <label>Search Transactions: </label>
                    <input type="text" value={search} onChange={handleSearch} />
                </div>
            </div>

            <div className="table-container">
                <h2>Transactions</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Price</th>
                            <th>Category</th>
                            <th>Sold</th>
                            <th>Date of Sale</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(transaction => (
                            <tr key={transaction.id}>
                                <td>{transaction.title}</td>
                                <td>{transaction.description}</td>
                                <td>{transaction.price}</td>
                                <td>{transaction.category}</td>
                                <td>{transaction.sold ? 'Yes' : 'No'}</td>
                                <td>{new Date(transaction.dateOfSale).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button onClick={prevPage} disabled={page === 1}>Previous</button>
                <button onClick={nextPage}>Next</button>
            </div>

            <div className="statistics-container">
                <h2>Statistics : {month} </h2>
                <div>Total Sale Amount: {statistics.totalSaleAmount}</div>
                <div>Total Sold Items: {statistics.totalSoldItems}</div>
                <div>Total Not Sold Items: {statistics.totalNotSoldItems}</div>
            </div>

            <div className="chart-container">
                <h2>Bar Chart Status : {month} </h2>
                <Bar
                    data={{
                        labels: barChart.map(item => item.range),
                        datasets: [{
                            label: 'Number of Items',
                            data: barChart.map(item => item.count),
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1,
                        }]
                    }}
                    options={{ scales: { y: { beginAtZero: true } } }}
                />
            </div>
        </div>
    );
};

export default TransactionDashboard;
