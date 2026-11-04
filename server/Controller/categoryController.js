const CategoryModel = require('../Model/categoryModel');

const getCategories = async (req, res) => {
    try {
        const data = await CategoryModel.getAllCategories();
        res.status(200).json({
            status: true,
            message: 'Categories fetched successfully',
            data: data
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

module.exports = {
    getCategories
};