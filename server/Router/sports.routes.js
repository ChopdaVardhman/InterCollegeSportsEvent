const express = require('express');
const router = express.Router();
const SportsController = require('../Controller/sports.controller');

// Dynamic College ID route
router.get('/students/college/:collegeId', SportsController.getStudentsByCollege);

module.exports = router;