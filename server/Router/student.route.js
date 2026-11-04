const express = require('express');
const router = express.Router();
const studentController = require('../Controller/student.Controller');

// GET request: /api/student/1
router.get('/:id', studentController.getStudentDetails);

// POST request: /api/student/details (Body: { "id": 1 })
router.post('/details', studentController.getStudentDetails);

module.exports = router;