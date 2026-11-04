const express = require('express');
const router = express.Router();
const sportsListController = require('../Controller/sportsList.Controller');

// GET request: /api/sportslist/:id
router.get('/:id', sportsListController.getSportsList);

// POST request: /api/sportslist/add-sport (Naya sport insert karne ke liye naya route)
router.post('/add-sport', sportsListController.insertSport);

module.exports = router;