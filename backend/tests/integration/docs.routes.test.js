const request = require('supertest');
const app = require('../../src/app');

test('GET /api/docs serve a documentação interativa (Swagger UI)', async () => {
  const res = await request(app).get('/api/docs/');
  expect(res.status).toBe(200);
  expect(res.text).toContain('swagger-ui');
});
