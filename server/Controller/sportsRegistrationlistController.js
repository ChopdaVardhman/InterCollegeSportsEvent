const SportsRegistration = require('../Model/sportsRegistrationModelList');

exports.getAllRegistrations = async (req, res) => {
  try {
    const data = await SportsRegistration.getAll();

    return res.status(200).json({
      success: true,
      total: data.length,
      data: data
    });
  } catch (error) {
    console.error('Fetch Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch data.',
      error: error.message
    });
  }
};