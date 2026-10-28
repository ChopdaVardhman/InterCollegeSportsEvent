const express = require('express');
const cors = require('cors');
const authRoutes = require('./Router/auth.route');
const studentRoutes = require('./Router/student.route');

const app = express();

app.use(cors());
app.use(express.json());

// Routes Mount
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);

module.exports = app;