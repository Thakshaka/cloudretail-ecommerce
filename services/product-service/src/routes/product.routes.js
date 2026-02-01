const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/product.controller');

const router = express.Router();

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('categoryId').isUUID().withMessage('Valid category ID is required')
];

/**
 * @openapi
 * /:
 *   get:
 *     summary: Retrieve a list of products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: A list of products.
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               sku: { type: string }
 *               categoryId: { type: string }
 *     responses:
 *       201:
 *         description: Created.
 */
router.get('/', productController.getAllProducts);

/**
 * @openapi
 * /{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product details.
 */
router.get('/:id', productController.getProductById);

router.post('/', productValidation, productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;

