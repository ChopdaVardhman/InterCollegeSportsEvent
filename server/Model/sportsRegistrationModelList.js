const { poolPromise } = require('../Config/db');

const SportsRegistration = {
  // Saara data SELECT * se fetch karne ke liye
  getAll: async () => {
    const pool = await poolPromise;
    const query = `SELECT 
        r.Registration_id,
        r.ue_id,
        r.Student_name,
        r.DateofBirth,
        r.College_Full_Name_E,
        r.current_semester_name_e,
        r.current_course_year_name_e,
        r.Father_Name_E,
        r.Group_name,
        r.Sport_ID,
        r.Category_ID,
        -- Exact column: TBL_Sports_Master.Sport_Name
        ISNULL(sm.Sport_Name, 'Sport #' + CAST(r.Sport_ID AS VARCHAR)) AS Sport_Name,
        -- Exact column: TBL_Sports_Category.Sports_Category
        ISNULL(sc.Sports_Category, 'Category #' + CAST(r.Category_ID AS VARCHAR)) AS Sports_Category
      FROM TBL_Student_Sports_Registration r
      LEFT JOIN TBL_Sports_Master sm 
        ON r.Sport_ID = sm.Sport_ID
      LEFT JOIN TBL_Sports_Category sc 
        ON r.Category_ID = sc.Category_ID
      ORDER BY r.Registration_id DESC`;
    const result = await pool.request().query(query);
    return result.recordset;
  }
};

module.exports = SportsRegistration;