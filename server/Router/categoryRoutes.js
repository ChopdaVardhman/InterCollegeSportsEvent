const express = require('express');
const router = express.Router();
const categoryController = require('../Controller/categoryController');

// GET /api/categories
router.get('/categories', categoryController.getCategories);

module.exports = router;