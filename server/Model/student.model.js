const { sql, poolPromise } = require('../Config/db');

class StudentModel {
  static async getStudentById(id) {
    const pool = await poolPromise;
    const request = pool.request();

    request.input('id', sql.Int, id);

    // Apni exact table aur ID column name ke anusar check karein
    const query = `
     select distinct
Student_name
,DateofBirth
,College_Full_Name_E
,current_semester_name_e
,current_course_year_name_e
,Father_Name_E

from [A_Edu].[TBL_Student_Detail_View] where student_id= @id

select * from m_edu.M_College where End_Session is NULL
    `;

    const result = await request.query(query);
    return result.recordset[0] || null;
  }
}

module.exports = StudentModel;