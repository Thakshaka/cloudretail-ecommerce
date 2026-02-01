const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty()
], userController.updateProfile);
router.put('/password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], userController.changePassword);

// Admin routes
router.get('/', roleMiddleware(['admin']), userController.getAllUsers);
router.get('/:id', roleMiddleware(['admin']), userController.getUserById);
router.put('/:id/role', roleMiddleware(['admin']), [
  body('role').isIn(['customer', 'admin', 'support'])
], userController.updateUserRole);
router.delete('/:id', roleMiddleware(['admin']), userController.deleteUser);

module.exports = router;
