  const sportsModel = require('../Model/GroupEventUpdateModel');

// Group Update Controller
exports.updateGroup = async (req, res) => {
    try {
        const groupName = req.params.groupName;
        const updateData = req.body;
        
        await sportsModel.updateGroupData(groupName, updateData);
        res.status(200).json({ success: true, message: 'Group details updated successfully!' });
    } catch (err) {
        console.error('Error in updateGroup controller:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// Remove Group Player Controller (with Min_player validation)
exports.removeGroupPlayer = async (req, res) => {
    try {
        const registrationId = req.params.registrationId;
        const response = await sportsModel.removePlayerFromGroup(registrationId);
        
        if (!response.success) {
            return res.status(400).json(response);
        }
        
        res.status(200).json(response);
    } catch (err) {
        console.error('Error in removeGroupPlayer controller:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};