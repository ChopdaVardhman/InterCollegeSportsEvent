const StudentModel = require('../Model/student.model');

exports.getStudentDetails = async (req, res) => {
  try {
    const studentId = req.params.id || req.body.id;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const student = await StudentModel.getStudentById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No student record found with ID: ${studentId}`
      });
    }

    return res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching student details',
      error: error.message
    });
  }
};