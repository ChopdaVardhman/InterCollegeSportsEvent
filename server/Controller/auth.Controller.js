const DeanModel = require('../Model/dean.model');

exports.login = async (req, res) => {
  try {
    const { collegeId, password } = req.body;

    if (!collegeId || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'College ID and Password are required' 
      });
    }

    const dean = await DeanModel.findByCollegeId(collegeId);

    if (!dean) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid College ID' 
      });
    }

    // Direct password match (hash use kar rahe ho to bcrypt.compare use karein)
    if (dean.Password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        collegeId: dean.College__ID,
        userName: dean.User_Name
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};