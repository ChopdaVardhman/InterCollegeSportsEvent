const SportsModel = require('../Model/sports.model');

class SportsController {
  // GET: /api/students/college/:collegeId
  static async getStudentsByCollege(req, res) {
    try {
      const collegeId = parseInt(req.params.collegeId, 10);

      if (isNaN(collegeId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid College ID'
        });
      }

      const students = await SportsModel.getStudentsByCollegeId(collegeId);

      return res.status(200).json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('getStudentsByCollege Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  }
}

module.exports = SportsController;