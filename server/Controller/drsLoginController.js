const DRSLoginModel = require('../Model/drsLoginModel');

exports.loginDRS = async (req, res) => {
  try {
    const { User_Name, Password } = req.body;

    if (!User_Name || !Password) {
      return res.status(400).json({ success: false, message: 'User Name aur Password bharna anivarya hai!' });
    }

    const user = await DRSLoginModel.findByUsername(User_Name);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Galat Username ya Password!' });
    }

    // Password check (agar plain text hai)
    if (user.Password !== Password) {
      return res.status(401).json({ success: false, message: 'Galat Username ya Password!' });
    }

    return res.status(200).json({
      success: true,
      message: 'Login safal raha!',
      data: {
        user_id: user.ID || user.College__ID,
        user_name: user.User_Name
      }
    });

  } catch (error) {
    console.error('DRS Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server mein kuch samasya aa gayi hai.' });
  }
};