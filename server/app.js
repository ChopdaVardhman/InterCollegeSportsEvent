const express = require('express');
const cors = require('cors');
const authRoutes = require('./Router/auth.route');
const studentRoutes = require('./Router/student.route');
const sportslist = require('./Router/SportsList.router')
const categoryRoutes = require('./Router/categoryRoutes');
const studentlist = require('./Router/sports.routes')
const sportsRegistration = require('./Router/sportsRegistrationRoutes');
const sportsRegistrationList = require('./Router/sportsRegistrationListRoutes');
const drsRoutes = require('./Router/drsLoginRoutes');
const healthRoutes = require('./Router/healthRoutes');

const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes);

// Routes Mount
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/sportslist',sportslist);
app.use('/api', categoryRoutes);
app.use('/api' , studentlist);
app.use('/api',sportsRegistration);
app.use('/api',sportsRegistrationList);


app.use('/api/drs', drsRoutes);

module.exports = app;