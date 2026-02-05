const request = require('supertest');
const app = require('../../src/app');
const { Product } = require('../../src/models');

describe('Product Controller', () => {
  beforeEach(async () => {
    await Product.destroy({ where: {}, truncate: true });
  });

  describe('POST /api/v1/products', () => {
    it('should create a new product successfully', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'Electronics',
        imageUrl: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post('/api/v1/products')
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(productData.name);
      expect(response.body.price).toBe(productData.price);
    });

    it('should return 400 for invalid price', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: -10,
        category: 'Electronics'
      };

      await request(app)
        .post('/api/v1/products')
        .send(productData)
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      const productData = {
        description: 'Test Description'
      };

      await request(app)
        .post('/api/v1/products')
        .send(productData)
        .expect(400);
    });
  });

  describe('GET /api/v1/products', () => {
    beforeEach(async () => {
      // Create test products
      await Product.bulkCreate([
        {
          name: 'Product 1',
          description: 'Description 1',
          price: 10.00,
          category: 'Electronics'
        },
        {
          name: 'Product 2',
          description: 'Description 2',
          price: 20.00,
          category: 'Books'
        },
        {
          name: 'Product 3',
          description: 'Description 3',
          price: 30.00,
          category: 'Electronics'
        }
      ]);
    });

    it('should get all products', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body.products).toHaveLength(3);
      expect(response.body).toHaveProperty('total', 3);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/v1/products?category=Electronics')
        .expect(200);

      expect(response.body.products).toHaveLength(2);
      expect(response.body.products.every(p => p.category === 'Electronics')).toBe(true);
    });

    it('should paginate products', async () => {
      const response = await request(app)
        .get('/api/v1/products?page=1&limit=2')
        .expect(200);

      expect(response.body.products).toHaveLength(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
    });

    it('should search products by name', async () => {
      const response = await request(app)
        .get('/api/v1/products?search=Product 1')
        .expect(200);

      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].name).toBe('Product 1');
    });
  });

  describe('GET /api/v1/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'Electronics'
      });
    });

    it('should get product by id', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${testProduct.id}`)
        .expect(200);

      expect(response.body.id).toBe(testProduct.id);
      expect(response.body.name).toBe(testProduct.name);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .get(`/api/v1/products/${fakeId}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'Electronics'
      });
    });

    it('should update product successfully', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 149.99
      };

      const response = await request(app)
        .put(`/api/v1/products/${testProduct.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Updated Product');
      expect(response.body.price).toBe(149.99);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .put(`/api/v1/products/${fakeId}`)
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'Electronics'
      });
    });

    it('should delete product successfully', async () => {
      await request(app)
        .delete(`/api/v1/products/${testProduct.id}`)
        .expect(200);

      const product = await Product.findByPk(testProduct.id);
      expect(product).toBeNull();
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .delete(`/api/v1/products/${fakeId}`)
        .expect(404);
    });
  });
});
