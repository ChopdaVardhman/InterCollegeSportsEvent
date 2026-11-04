const express = require('express');
const router = express.Router();
const drsLoginController = require('../Controller/drsLoginController');

// POST route: /api/drs/login
router.post('/login', drsLoginController.loginDRS);

module.exports = router;