const express = require('express');
const { Category } = require('../models/product.model');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      include: [{ model: Category, as: 'subcategories' }],
      order: [['name', 'ASC']]
    });
    res.status(200).json({ categories });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, parentId } = req.body;
    const category = await Category.create({ name, description, parentId });
    logger.info(`Category created: ${category.id}`);
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    logger.error('Create category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
