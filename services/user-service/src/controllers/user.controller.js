const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const User = require('../models/user.model');
const logger = require('../utils/logger');

class UserController {
  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ user: user.toJSON() });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { firstName, lastName } = req.body;

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;

      await user.save();

      logger.info(`Profile updated for user: ${user.id}`);

      res.status(200).json({
        message: 'Profile updated successfully',
        user: user.toJSON()
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.id}`);

      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 10, search = '', role } = req.query;
      const offset = (page - 1) * limit;

      const where = {};

      if (search) {
        where[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (role) {
        where.role = role;
      }

      const { count, rows: users } = await User.findAndCountAll({
        where,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        users: users.map(user => user.toJSON()),
        pagination: {
          total: count,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ user: user.toJSON() });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async updateUserRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { role } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.role = role;
      await user.save();

      logger.info(`Role updated for user ${user.id} to ${role} by admin ${req.user.userId}`);

      res.status(200).json({
        message: 'User role updated successfully',
        user: user.toJSON()
      });
    } catch (error) {
      logger.error('Update user role error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (id === req.user.userId) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Soft delete by deactivating
      user.isActive = false;
      await user.save();

      logger.info(`User ${id} deactivated by admin ${req.user.userId}`);

      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = new UserController();
