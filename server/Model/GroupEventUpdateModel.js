const sql = require('../Config/db');

// Group ki common details update karne ke liye function
async function updateGroupData(groupName, data) {
    const pool = await sql.connect();
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

// Group se player remove karne aur Min_player validation check karne ke liye function
async function removePlayerFromGroup(registrationId) {
    const pool = await sql.connect();

    // 1. Player ka Group_name aur Sport_ID pata karein[cite: 2]
    const playerQuery = await pool.request()
        .input('Registration_id', sql.Int, registrationId)
        .query(`SELECT Group_name, Sport_ID FROM TBL_Student_Sports_Registration WHERE Registration_id = @Registration_id`);
    
    if (playerQuery.recordset.length === 0) {
        return { success: false, message: 'Player not found in registrations.' };
    }

    const { Group_name, Sport_ID } = playerQuery.recordset[0];

    // 2. TBL_Sports_Master se Min_player ki limit check karein[cite: 3]
    const sportQuery = await pool.request()
        .input('Sport_ID', sql.Int, Sport_ID)
        .query(`SELECT Min_player FROM TBL_Sports_Master WHERE Sport_ID = @Sport_ID`);
    
    const minPlayers = sportQuery.recordset[0]?.Min_player || 1;

    // 3. Group me current kitne players hain count karein[cite: 2]
    const countQuery = await pool.request()
        .input('Group_name', sql.VarChar, groupName = Group_name)
        .query(`SELECT COUNT(*) as total FROM TBL_Student_Sports_Registration WHERE Group_name = @Group_name`);
    
    const currentCount = countQuery.recordset[0].total;

    // 4. Validation: Agar limit minimum players ke barabar ya kam ho toh error return karein
    if (currentCount <= minPlayers) {
        return { 
            success: false, 
            message: `Cannot remove player! This sport requires a minimum of ${minPlayers} players in a group.` 
        };
    }

    // 5. Safe hone par player ko delete/remove kar dein[cite: 2]
    await pool.request()
        .input('Registration_id', sql.Int, registrationId)
        .query(`DELETE FROM TBL_Student_Sports_Registration WHERE Registration_id = @Registration_id`);

    return { success: true, message: 'Player successfully removed from the group.' };
}

module.exports = {
    updateGroupData,
    removePlayerFromGroup
};