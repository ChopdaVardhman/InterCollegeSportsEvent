const { sql, poolPromise } = require('../Config/db');

class DeanModel {
  // Find Dean by College ID
  static async findByCollegeId(collegeId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('collegeId', sql.Int, collegeId)
      .query(`
        SELECT College__ID, Password, User_Name 
        FROM [IGKVRevaluation_2026_06_30].[dbo].[Inter_College_SPorts_Event_Dean_Login]
        WHERE College__ID = @collegeId
      `);
    return result.recordset[0] || null;
  }

  // Create new Dean account
  static async createDean(collegeId, password, userName) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('collegeId', sql.Int, collegeId)
      .input('password', sql.VarChar, password)
      .input('userName', sql.VarChar, userName)
      .query(`
        INSERT INTO [IGKVRevaluation_2026_06_30].[dbo].[Inter_College_SPorts_Event_Dean_Login]
        (College__ID, Password, User_Name)
        VALUES (@collegeId, @password, @userName)
      `);
    return result.rowsAffected[0] > 0;
  }
}

module.exports = DeanModel;