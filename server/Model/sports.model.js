const { poolPromise, sql } = require('../Config/db');

class SportsModel {
  // College_Id ke according students list lana
  static async getStudentsByCollegeId(collegeId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('CollegeId', sql.Int, collegeId)
      .query(`
    SELECT DISTINCT
    st.ue_id,
    st.Student_name,
    st.DateofBirth,
    st.College_Full_Name_E,
    st.current_semester_name_e,
    st.current_course_year_name_e,
    st.Father_Name_E,
    st.Degree_Programme_Name_E,
    st.Gender_ID
FROM [A_Edu].[TBL_Student_Detail_View] AS st 
WHERE st.College_Id = @CollegeId 
  AND st.current_academic_session_id = 25;
      `);
    return result.recordset;
  }
}

module.exports = SportsModel;