const { sql, poolPromise } = require('../Config/db');

class SportsList {
  static async getSportsListById(categoryId) {
    const pool = await poolPromise;
    const request = pool.request();

    request.input('categoryId', sql.Int, categoryId);

    const query = `
      SELECT Sport_ID, Sport_Name , Min_player
      FROM [dbo].[TBL_Sports_Master]
      WHERE Category_ID = @categoryId;
    `;

    const result = await request.query(query);
    // Pura array return karein taaki us category ke sabhi sports milein
    return result.recordset || [];
  }

// Naya sport insert karne se pehle check karne ka method
  static async addSport(sportData) {
    const pool = await poolPromise;

    // 1. Pehle check karein ki sport pehle se added hai ya nahi
    const checkRequest = pool.request();
    checkRequest.input('SportName', sql.NVarChar, sportData.Sport_Name.trim());
    checkRequest.input('CategoryId', sql.Int, sportData.Category_ID);

    const checkQuery = `
      SELECT COUNT(*) AS count 
      FROM [dbo].[TBL_Sports_Master] 
      WHERE LOWER(RTRIM(LTRIM(Sport_Name))) = LOWER(RTRIM(LTRIM(@SportName)))
      AND Category_ID = @CategoryId;
    `;

    const checkResult = await checkRequest.query(checkQuery);
    
    if (checkResult.recordset[0].count > 0) {
      throw new Error('This sport is already added in this category!');
    }

    // 2. Agar nahi hai, tab insert karein
    const insertRequest = pool.request();
    insertRequest.input('CategoryId', sql.Int, sportData.Category_ID);
    insertRequest.input('SportName', sql.NVarChar, sportData.Sport_Name.trim());
    insertRequest.input('MinPlayer', sql.Int, sportData.Min_player || null);

    const insertQuery = `
      INSERT INTO [dbo].[TBL_Sports_Master] (Category_ID, Sport_Name, Is_Active, Created_At, Min_player)
      VALUES (@CategoryId, @SportName, 1, GETDATE(), @MinPlayer);
    `;

    const result = await insertRequest.query(insertQuery);
    return result;
  }
}

module.exports = SportsList;