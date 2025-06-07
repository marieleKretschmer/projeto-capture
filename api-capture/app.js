const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const ocrRoutes = require('./routes/ocrRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/ocr', ocrRoutes);

module.exports = app;