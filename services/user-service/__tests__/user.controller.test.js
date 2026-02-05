const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');

describe('User Controller', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Create and login test user
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'testuser@example.com',
        password: 'Test@1234',
        firstName: 'Test',
        lastName: 'User'
      });

    authToken = registerResponse.body.token;
    testUser = registerResponse.body.user;
  });

  afterAll(async () => {
    await User.destroy({ where: {}, truncate: true });
  });

  describe('GET /api/v1/users/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('testuser@example.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/v1/users/profile')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe('Updated');
      expect(response.body.lastName).toBe('Name');
    });

    it('should not allow email update', async () => {
      const updateData = {
        email: 'newemail@example.com'
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Email should remain unchanged
      expect(response.body.email).toBe('testuser@example.com');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .put('/api/v1/users/profile')
        .send({ firstName: 'Test' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/users/profile', () => {
    it('should delete user account', async () => {
      // Create a new user for deletion test
      const newUserResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'todelete@example.com',
          password: 'Test@1234',
          firstName: 'To',
          lastName: 'Delete'
        });

      const deleteToken = newUserResponse.body.token;

      await request(app)
        .delete('/api/v1/users/profile')
        .set('Authorization', `Bearer ${deleteToken}`)
        .expect(200);

      // Verify user is deleted
      const user = await User.findOne({ where: { email: 'todelete@example.com' } });
      expect(user).toBeNull();
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .delete('/api/v1/users/profile')
        .expect(401);
    });
  });
});
