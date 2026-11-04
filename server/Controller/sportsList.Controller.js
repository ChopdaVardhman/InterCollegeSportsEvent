const SportsListModel = require('../Model/sportsList.model');

exports.getSportsList = async (req, res) => {
  try {
    // ID route params ya query params se lein
    const sportsTypeId = req.params.id || req.query.id || req.body.id;

    if (!sportsTypeId) {
      return res.status(400).json({
        success: false,
        message: 'Sports Type ID (Category ID) is required'
      });
    }

    const sportsList = await SportsListModel.getSportsListById(sportsTypeId);

    if (!sportsList || sportsList.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No sports found for Category ID: ${sportsTypeId}`
      });
    }

    return res.status(200).json({
      success: true,
      data: sportsList
    });
  } catch (error) {
    console.error('Error fetching sports list:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching sports list',
      error: error.message
    });
  }
};

exports.insertSport = async (req, res) => {
  try {
    const { Category_ID, Sport_Name, Min_player } = req.body;

    if (!Category_ID || !Sport_Name) {
      return res.status(400).json({ success: false, message: 'Category ID and Sport Name are required.' });
    }

    await SportsListModel.addSport({ Category_ID, Sport_Name, Min_player });

    res.json({ success: true, message: 'Sport added successfully!' });
  } catch (err) {
    console.error('Error adding sport:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};