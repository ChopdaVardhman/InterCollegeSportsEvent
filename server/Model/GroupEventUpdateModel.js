const { sql, poolPromise } = require('../Config/db');

// 1. College ID ke base par registrations fetch karne ke liye function
// Dano tables se join karke College ID aur Group registrations fetch karne ke liye
async function getAllRegistrationsData(collegeId) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('College_Id', sql.Int, collegeId)
        .query(`
            SELECT 
                r.*, 
                s.Sport_Name, 
                s.Min_player 
            FROM TBL_Student_Sports_Registration r
            INNER JOIN TBL_Sports_Master s ON r.Sport_ID = s.Sport_ID
            WHERE r.College_Id = @College_Id 
              AND r.Group_name IS NOT NULL 
              AND r.Group_name != ''
        `);
    return result.recordset;
}

// 2. Group ki common details update karne ke liye function
async function updateGroupData(groupName, data) {
    const pool = await poolPromise; // <-- poolPromise use karein
    const { Sport_ID, Category_ID, College_Id, Gender } = data;
    
    const result = await pool.request()
        .input('Group_name', sql.VarChar, groupName)
        .input('Sport_ID', sql.Int, Sport_ID)
        .input('Category_ID', sql.Int, Category_ID)
        .input('College_Id', sql.Int, College_Id)
        .input('Gender', sql.VarChar, Gender)
        .query(`
            UPDATE TBL_Student_Sports_Registration 
            SET Sport_ID = @Sport_ID, 
                Category_ID = @Category_ID, 
                College_Id = @College_Id, 
                Gender = @Gender
            WHERE Group_name = @Group_name
        `);
    return result;
}

// 3. Group se player remove karne aur Min_player validation check karne ke liye function
async function removePlayerFromGroup(registrationId) {
    const pool = await poolPromise; // <-- poolPromise use karein

    // Player ka Group_name aur Sport_ID pata karein
    const playerQuery = await pool.request()
        .input('Registration_id', sql.Int, registrationId)
        .query(`SELECT Group_name, Sport_ID FROM TBL_Student_Sports_Registration WHERE Registration_id = @Registration_id`);
    
    if (playerQuery.recordset.length === 0) {
        return { success: false, message: 'Player not found in registrations.' };
    }

    const { Group_name, Sport_ID } = playerQuery.recordset[0];

    // TBL_Sports_Master se Min_player ki limit check karein
    const sportQuery = await pool.request()
        .input('Sport_ID', sql.Int, Sport_ID)
        .query(`SELECT Min_player FROM TBL_Sports_Master WHERE Sport_ID = @Sport_ID`);
    
    const minPlayers = sportQuery.recordset[0]?.Min_player || 1;

    // Group me current kitne players hain count karein
    const countQuery = await pool.request()
        .input('Group_name', sql.VarChar, Group_name)
        .query(`SELECT COUNT(*) as total FROM TBL_Student_Sports_Registration WHERE Group_name = @Group_name`);
    
    const currentCount = countQuery.recordset[0].total;

    // Validation: Agar limit minimum players ke barabar ya kam ho toh error return karein
    if (currentCount <= minPlayers) {
        return { 
            success: false, 
            message: `Cannot remove player! This sport requires a minimum of ${minPlayers} players in a group.` 
        };
    }

    // Safe hone par player ko delete/remove kar dein
    await pool.request()
        .input('Registration_id', sql.Int, registrationId)
        .query(`DELETE FROM TBL_Student_Sports_Registration WHERE Registration_id = @Registration_id`);

    return { success: true, message: 'Player successfully removed from the group.' };
}

module.exports = {
    getAllRegistrationsData,
    updateGroupData,
    removePlayerFromGroup
};