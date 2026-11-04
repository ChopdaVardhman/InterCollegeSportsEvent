const express = require('express');
const router = express.Router();
const sportsController = require('../Controller/sportsRegistrationlistController');

// GET endpoint
router.get('/sports-registration-list', sportsController.getAllRegistrations);

module.exports = router;