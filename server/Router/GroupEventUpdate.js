const express = require('express');
const router = express.Router();
const sportsController = require('../Controller/GroupEventGroupController');

// Route for updating group details
router.put('/update-group/:groupName', sportsController.updateGroup);

// Route for removing a player from a group with Min_player validation
router.delete('/remove-group-player/:registrationId', sportsController.removeGroupPlayer);

//  Saari group registrations fetch karne ke route (/all-registrations)
router.get('/all-registrations', sportsController.getAllRegistrations);

module.exports = router;