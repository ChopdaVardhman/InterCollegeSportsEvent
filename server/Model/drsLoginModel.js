const { sql, poolPromise } = require('../Config/db');

class DRSLoginModel {
  static async findByUsername(username) {
    try {
      const pool = await poolPromise; // Yahan sql.connect() ki jagah poolPromise use karein
      const result = await pool.request()
        .input('username', sql.VarChar, username)
        .query('SELECT * FROM Inter_College_SPorts_Event_Dean_Login WHERE User_Name = @username'); // Sahi table ka naam
      
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DRSLoginModel;