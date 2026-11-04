const { poolPromise } = require('../Config/db');

const CategoryModel = {
    getAllCategories: async () => {
        // 1. Connection pool ka wait karein
        const pool = await poolPromise;

        const query = `
            SELECT 
                Category_ID, 
                Sports_Category AS Category_Name 
            FROM dbo.TBL_Sports_Category
        `;

        // 2. Pool se request banayein
        const result = await pool.request().query(query);
        return result.recordset;
    }
};

module.exports = CategoryModel;