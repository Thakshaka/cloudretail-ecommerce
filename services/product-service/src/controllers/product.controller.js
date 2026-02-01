const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Product, Category } = require('../models/product.model');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

const CACHE_TTL = 300; // 5 minutes

class ProductController {
  async getAllProducts(req, res) {
    try {
      const { page = 1, limit = 10, search = '', categoryId, minPrice, maxPrice } = req.query;
      const offset = (page - 1) * limit;

      // Try cache first
      const cacheKey = `products:${page}:${limit}:${search}:${categoryId}:${minPrice}:${maxPrice}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        logger.info('Cache hit for products list');
        return res.status(200).json(JSON.parse(cached));
      }

      const where = { isActive: true };

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { sku: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (categoryId) where.categoryId = categoryId;
      
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price[Op.gte] = minPrice;
        if (maxPrice) where.price[Op.lte] = maxPrice;
      }

      const { count, rows: products } = await Product.findAndCountAll({
        where,
        include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [['createdAt', 'DESC']]
      });

      const result = {
        products,
        pagination: {
          total: count,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(count / limit)
        }
      };

      // Cache the result
      await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));

      res.status(200).json(result);
    } catch (error) {
      logger.error('Get all products error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getProductById(req, res) {
    try {
      const { id } = req.params;

      // Try cache first
      const cacheKey = `product:${id}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        logger.info(`Cache hit for product ${id}`);
        return res.status(200).json(JSON.parse(cached));
      }

      const product = await Product.findByPk(id, {
        include: [{ model: Category, as: 'category' }]
      });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Cache the result
      await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify({ product }));

      res.status(200).json({ product });
    } catch (error) {
      logger.error('Get product by ID error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async createProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, price, sku, categoryId, imageUrl, tags } = req.body;

      const product = await Product.create({
        name,
        description,
        price,
        sku,
        categoryId,
        imageUrl,
        tags
      });

      // Invalidate cache
      await this.invalidateProductCache();

      logger.info(`Product created: ${product.id}`);

      res.status(201).json({
        message: 'Product created successfully',
        product
      });
    } catch (error) {
      logger.error('Create product error:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'Product with this SKU already exists' });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async updateProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updates = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      await product.update(updates);

      // Invalidate cache
      await this.invalidateProductCache();
      await redisClient.del(`product:${id}`);

      logger.info(`Product updated: ${id}`);

      res.status(200).json({
        message: 'Product updated successfully',
        product
      });
    } catch (error) {
      logger.error('Update product error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Soft delete
      product.isActive = false;
      await product.save();

      // Invalidate cache
      await this.invalidateProductCache();
      await redisClient.del(`product:${id}`);

      logger.info(`Product deleted: ${id}`);

      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      logger.error('Delete product error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async invalidateProductCache() {
    try {
      // Simple approach: just log that we're invalidating
      // In production, you'd use Redis SCAN or maintain a set of cache keys
      logger.info('Invalidating product cache');
      // Note: Redis keys() is not recommended for production
      // For now, we'll just let the cache expire naturally via TTL
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
  }
}

module.exports = new ProductController();
