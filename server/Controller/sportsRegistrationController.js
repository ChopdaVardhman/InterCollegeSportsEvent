const SportsRegistration = require('../Model/sportsRegistrationModel');
const { poolPromise } = require('../Config/db'); // List aur Validation ke liye pool
const sql = require('mssql'); // Input parameter types sanitize karne ke liye

// "14/05/2001" (DD/MM/YYYY) ya ISO format ko MSSQL standard format (YYYY-MM-DD) me convert karne ke liye
const formatToISODate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr.includes('-')) return dateStr.split('T')[0];

  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return null;
};

// Gender ko M/F/Male/Female se standard "Male" / "Female" me convert karne ke liye
const formatGender = (val) => {
  if (!val) return null;
  const g = val.toString().trim().toUpperCase();
  if (g === 'M' || g === 'MALE') return 'Male';
  if (g === 'F' || g === 'FEMALE') return 'Female';
  return val.toString().trim();
};

// ==========================================
// 1. CREATE REGISTRATION (Single / Bulk)
// ==========================================
exports.createRegistration = async (req, res) => {
  console.log("=== INCOMING HEADERS ===", req.headers['content-type']);
  console.log("=== INCOMING REQ.BODY ===", req.body);

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Body is received as empty or undefined. Check request payload.",
      receivedBody: req.body
    });
  }

  try {
    const pool = await poolPromise;
    const {
      Sport_ID,
      Category_ID,
      Group_name,
      group_name,
      students
    } = req.body;

    const finalGroupName = (Group_name || group_name || '').toString().trim();

    // -------------------------------------------------------------------
    // CASE 1: GROUP EVENT (Multiple Students Array)
    // -------------------------------------------------------------------
    if (Array.isArray(students) && students.length > 0) {
      if (!Sport_ID || !Category_ID || !finalGroupName) {
        return res.status(400).json({
          success: false,
          message: 'For Group Event Sport_ID, Category_ID aur Group_name required.'
        });
      }

      // Check 1: Duplicate Group Name Validation
      const checkGroupQuery = `
        SELECT COUNT(1) AS groupCount 
        FROM TBL_Student_Sports_Registration 
        WHERE LOWER(LTRIM(RTRIM(Group_name))) = LOWER(@groupName)
          AND Sport_ID = @sportId
      `;

      const checkResult = await pool.request()
        .input('groupName', sql.NVarChar, finalGroupName)
        .input('sportId', sql.Int, parseInt(Sport_ID, 10))
        .query(checkGroupQuery);

      if (checkResult.recordset[0].groupCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Group Name "${finalGroupName}" this person allready selected for this sports , select other sports!`
        });
      }

      // Check 2: Maximum 3 Registrations Per Student Limit Check
      for (const s of students) {
        const studentUeId = s.ue_id ? s.ue_id.toString().trim() : null;
        const studentName = (s.student_name || s.Student_name || '').toString().trim();

        if (studentUeId) {
          const countQuery = `
            SELECT COUNT(1) AS regCount 
            FROM TBL_Student_Sports_Registration 
            WHERE ue_id = @ueId
          `;
          const countRes = await pool.request()
            .input('ueId', sql.VarChar, studentUeId)
            .query(countQuery);

          if (countRes.recordset[0].regCount >= 3) {
            return res.status(400).json({
              success: false,
              message: `Student "${studentName}" (UE ID: ${studentUeId}) it already registered in 3 sports event . cannot register in other sports(event).`
            });
          }
        }
      }

      const recordsToInsert = students.map((s) => ({
        ue_id: s.ue_id ? s.ue_id.toString().trim() : null,
        Student_name: (s.student_name || s.Student_name || '').toString().trim(),
        DateofBirth: formatToISODate(s.dob || s.DateofBirth),
        College_Full_Name_E: (s.College_Full_Name_E || '').toString().trim(),
        current_semester_name_e: s.semester ? s.semester.toString().trim() : (s.current_semester_name_e || null),
        current_course_year_name_e: s.course_year ? s.course_year.toString().trim() : (s.current_course_year_name_e || null),
        Father_Name_E: s.father_name ? s.father_name.toString().trim() : (s.Father_Name_E || null),
        Sport_ID: parseInt(Sport_ID, 10),
        Category_ID: parseInt(Category_ID, 10),
        Group_name: finalGroupName,
        College_Id: s.college_id ? parseInt(s.college_id, 10) : (s.College_Id ? parseInt(s.College_Id, 10) : null),
        Gender: formatGender(s.gender || s.Gender)
      }));

      // Model ka bulkCreate call karein
      const insertedRows = await SportsRegistration.bulkCreate(recordsToInsert);

      return res.status(201).json({
        success: true,
        message: `${insertedRows.length} team members successfully registed!`,
        totalAdded: insertedRows.length,
        data: insertedRows
      });
    }

    // -------------------------------------------------------------------
    // CASE 2: INDIVIDUAL EVENT (Single Student)
    // -------------------------------------------------------------------
    const {
      ue_id,
      student_name,
      dob,
      College_Full_Name_E,
      semester,
      course_year,
      father_name,
      gender,
      Gender,
      college_id,
      College_Id
    } = req.body;

    if (!ue_id || !student_name || !College_Full_Name_E || !Sport_ID || !Category_ID) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: ue_id, student_name, College_Full_Name_E, Sport_ID, and Category_ID are required.'
      });
    }

    const trimmedUeId = ue_id.toString().trim();

    // Check: Maximum 3 Registrations Per Student Limit Check
    const countQuery = `
      SELECT COUNT(1) AS regCount 
      FROM TBL_Student_Sports_Registration 
      WHERE ue_id = @ueId
    `;
    const countRes = await pool.request()
      .input('ueId', sql.VarChar, trimmedUeId)
      .query(countQuery);

    if (countRes.recordset[0].regCount >= 3) {
      return res.status(400).json({
        success: false,
        message: `Student "${student_name}" (UE ID: ${trimmedUeId}) it already registered in 3 sports event . cannot register in other sports(event).`
      });
    }

    const assignedCollegeId = college_id ? parseInt(college_id, 10) : (College_Id ? parseInt(College_Id, 10) : null);

    const payload = {
      ue_id: trimmedUeId,
      Student_name: student_name.trim(),
      DateofBirth: formatToISODate(dob),
      College_Full_Name_E: College_Full_Name_E.trim(),
      current_semester_name_e: semester ? semester.trim() : null,
      current_course_year_name_e: course_year ? course_year.trim() : null,
      Father_Name_E: father_name ? father_name.trim() : null,
      Sport_ID: parseInt(Sport_ID, 10),
      Category_ID: parseInt(Category_ID, 10),
      Group_name: finalGroupName !== '' ? finalGroupName : null,
      College_Id: assignedCollegeId,
      Gender: formatGender(gender || Gender)
    };

    const newRecord = await SportsRegistration.create(payload);

    return res.status(201).json({
      success: true,
      message: 'Student sports registration successful.',
      data: {
        registration_id: newRecord.Registration_id
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save registration.',
      error: error.message
    });
  }
};

// ==========================================
// 2. GET ALL REGISTRATIONS (Table Listing)
// ==========================================
exports.getAllRegistrations = async (req, res) => {
  try {
    const pool = await poolPromise;
    const query = `
      SELECT 
    r.Registration_id,
    r.ue_id,
    r.Student_name,
    r.DateofBirth,
    r.College_Full_Name_E,
    r.current_semester_name_e,
    r.current_course_year_name_e,
    r.Father_Name_E,
    r.Sport_ID,
    r.Category_ID,
    r.Group_name,
    r.College_Id,
    r.Gender,                       -- <-- YEH LINE HONI ZARURI HAI
    sm.Sport_Name,
    sc.Sports_Category AS Sports_Category
  FROM TBL_Student_Sports_Registration r
  LEFT JOIN TBL_Sports_Master sm ON r.Sport_ID = sm.Sport_ID
  LEFT JOIN TBL_Sports_Category sc ON r.Category_ID = sc.Category_ID
  ORDER BY r.Registration_id DESC
    `;

    const result = await pool.request().query(query);

    return res.status(200).json({
      success: true,
      total: result.recordset.length,
      data: result.recordset
    });
  } catch (error) {
    console.error('Fetch Registrations Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve registrations.',
      error: error.message
    });
  }
};


// ==========================================
// 3. DELETE REGISTRATION (By Registration_id)
// ==========================================
exports.deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Registration ID required hai!'
      });
    }

    const pool = await poolPromise;

    const result = await pool.request()
      .input('Registration_id', sql.Int, parseInt(id, 10))
      .query(`
        DELETE FROM TBL_Student_Sports_Registration 
        WHERE Registration_id = @Registration_id
      `);

    // Agar ID database me nahi mili ya pehle se delete ho chuki hai
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ye record nahi mila ya pehle hi delete ho chuka hai!'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student registration successfully delete ho gaya!'
    });

  } catch (error) {
    console.error('Delete Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Delete karne me error aayi!',
      error: error.message
    });
  }
};