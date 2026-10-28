const express = require('express');
const router = express.Router();
const authController = require('../Controller/auth.Controller');

router.post('/login', authController.login);

module.exports = router;