const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/user.model');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

class AuthController {
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists with this email' });
      }

      // Create new user
      const user = await User.create({
        email,
        password,
        firstName,
        lastName
      });

      logger.info(`New user registered: ${user.id}`);

      res.status(201).json({
        message: 'User registered successfully',
        user: user.toJSON()
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, mfaToken } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check MFA if enabled
      if (user.mfaEnabled) {
        if (!mfaToken) {
          return res.status(200).json({ requiresMFA: true });
        }

        const verified = speakeasy.totp.verify({
          secret: user.mfaSecret,
          encoding: 'base32',
          token: mfaToken,
          window: parseInt(process.env.MFA_WINDOW, 10) || 1
        });

        if (!verified) {
          return res.status(401).json({ message: 'Invalid MFA token' });
        }
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
      );

      logger.info(`User logged in: ${user.id}`);

      res.status(200).json({
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: user.toJSON()
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

      // Find user
      const user = await User.findByPk(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(200).json({ accessToken });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
  }

  async logout(req, res) {
    try {
      // In a production system, you would invalidate the token here
      // For now, we'll just return success (client should delete the token)
      logger.info(`User logged out: ${req.user.userId}`);
      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async enableMFA(req, res) {
    try {
      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.mfaEnabled) {
        return res.status(400).json({ message: 'MFA is already enabled' });
      }

      // Generate MFA secret
      const secret = speakeasy.generateSecret({
        name: `${process.env.MFA_ISSUER || 'CloudRetail'} (${user.email})`
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      // Save secret (temporarily, until verified)
      user.mfaSecret = secret.base32;
      await user.save();

      res.status(200).json({
        message: 'MFA secret generated. Please scan the QR code and verify.',
        secret: secret.base32,
        qrCode: qrCodeUrl
      });
    } catch (error) {
      logger.error('Enable MFA error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async verifyMFA(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: 'MFA token is required' });
      }

      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.mfaSecret) {
        return res.status(400).json({ message: 'MFA is not set up' });
      }

      // Verify token
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token,
        window: parseInt(process.env.MFA_WINDOW, 10) || 1
      });

      if (!verified) {
        return res.status(401).json({ message: 'Invalid MFA token' });
      }

      // Enable MFA
      user.mfaEnabled = true;
      await user.save();

      logger.info(`MFA enabled for user: ${user.id}`);

      res.status(200).json({ message: 'MFA enabled successfully' });
    } catch (error) {
      logger.error('Verify MFA error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async disableMFA(req, res) {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ message: 'Password is required to disable MFA' });
      }

      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid password' });
      }

      // Disable MFA
      user.mfaEnabled = false;
      user.mfaSecret = null;
      await user.save();

      logger.info(`MFA disabled for user: ${user.id}`);

      res.status(200).json({ message: 'MFA disabled successfully' });
    } catch (error) {
      logger.error('Disable MFA error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = new AuthController();
