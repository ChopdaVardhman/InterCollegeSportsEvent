const { sql, poolPromise } = require('../Config/db');

const SportsRegistration = {
  // 1. Single Insert (Individual Event ke liye)
  create: async (data) => {
    const pool = await poolPromise;
    const request = pool.request();

    request.input('ue_id', sql.VarChar(50), data.ue_id || null);
    request.input('Student_name', sql.NVarChar(150), data.Student_name || null);
    request.input('DateofBirth', sql.Date, data.DateofBirth || null);
    request.input('College_Full_Name_E', sql.NVarChar(250), data.College_Full_Name_E || null);
    request.input('current_semester_name_e', sql.NVarChar(50), data.current_semester_name_e || null);
    request.input('current_course_year_name_e', sql.NVarChar(50), data.current_course_year_name_e || null);
    request.input('Father_Name_E', sql.NVarChar(150), data.Father_Name_E || null);
    request.input('Sport_ID', sql.Int, data.Sport_ID);
    request.input('Category_ID', sql.Int, data.Category_ID);
    request.input('Group_name', sql.NVarChar(100), data.Group_name || null);
    request.input('College_Id', sql.Int, data.College_Id || null);
    request.input('Gender', sql.VarChar(50), data.Gender || null);

    const query = `
      INSERT INTO TBL_Student_Sports_Registration (
        ue_id,
        Student_name,
        DateofBirth,
        College_Full_Name_E,
        current_semester_name_e,
        current_course_year_name_e,
        Father_Name_E,
        Sport_ID,
        Category_ID,
        Group_name,
        College_Id,
        Gender
      )
      VALUES (
        @ue_id,
        @Student_name,
        @DateofBirth,
        @College_Full_Name_E,
        @current_semester_name_e,
        @current_course_year_name_e,
        @Father_Name_E,
        @Sport_ID,
        @Category_ID,
        @Group_name,
        @College_Id,
        @Gender
      );
      SELECT SCOPE_IDENTITY() AS Registration_id;
    `;

    const result = await request.query(query);
    return result.recordset[0];
  },

  // 2. Bulk Insert (Group Event ke liye multiple students)
  bulkCreate: async (records) => {
    const pool = await poolPromise;
    const insertedIds = [];

    // Transaction ke andar batch insert taaki agar ek bhi fail ho to rollback ho sake
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const data of records) {
        const request = new sql.Request(transaction);

        request.input('ue_id', sql.VarChar(50), data.ue_id || null);
        request.input('Student_name', sql.NVarChar(150), data.Student_name || null);
        request.input('DateofBirth', sql.Date, data.DateofBirth || null);
        request.input('College_Full_Name_E', sql.NVarChar(250), data.College_Full_Name_E || null);
        request.input('current_semester_name_e', sql.NVarChar(50), data.current_semester_name_e || null);
        request.input('current_course_year_name_e', sql.NVarChar(50), data.current_course_year_name_e || null);
        request.input('Father_Name_E', sql.NVarChar(150), data.Father_Name_E || null);
        request.input('Sport_ID', sql.Int, data.Sport_ID);
        request.input('Category_ID', sql.Int, data.Category_ID);
        request.input('Group_name', sql.NVarChar(100), data.Group_name || null);
        request.input('College_Id', sql.Int, data.College_Id || null);
        request.input('Gender', sql.VarChar(50), data.Gender || null);

        const query = `
          INSERT INTO TBL_Student_Sports_Registration (
            ue_id,
            Student_name,
            DateofBirth,
            College_Full_Name_E,
            current_semester_name_e,
            current_course_year_name_e,
            Father_Name_E,
            Sport_ID,
            Category_ID,
            Group_name,
            College_Id,
            Gender
          )
          VALUES (
            @ue_id,
            @Student_name,
            @DateofBirth,
            @College_Full_Name_E,
            @current_semester_name_e,
            @current_course_year_name_e,
            @Father_Name_E,
            @Sport_ID,
            @Category_ID,
            @Group_name,
            @College_Id,
            @Gender
          );
          SELECT SCOPE_IDENTITY() AS Registration_id;
        `;

        const result = await request.query(query);
        insertedIds.push(result.recordset[0]);
      }

      await transaction.commit();
      return insertedIds;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};

module.exports = SportsRegistration;