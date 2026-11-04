const express = require('express');
const router = express.Router();
const sportsController = require('../Controller/sportsRegistrationController');

// POST endpoint: Naye records save karne ke liye (Individual ya Group event)
router.post('/sports-registration', sportsController.createRegistration);

// GET endpoint: Registered participants ki list fetch karne ke liye
router.get('/sports-registration', sportsController.getAllRegistrations);

router.delete('/delete-registration/:id', sportsController.deleteRegistration);

module.exports = router;