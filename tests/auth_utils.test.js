import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/env.js';
import { authService } from '../src/services/auth.service.js';
import { getPaginationParams, buildPaginationMeta } from '../src/utils/pagination.util.js';
import { validateSignup, validateLogin } from '../src/validators/auth.validator.js';

describe('Auth & Pagination Utilities', () => {
  test('generates valid JWT token with user payload', () => {
    const mockUser = { id: 'usr_123', email: 'test@example.com', role: 'USER' };
    const token = authService.generateToken(mockUser);
    assert.ok(token);

    const decoded = jwt.verify(token, JWT_SECRET);
    assert.equal(decoded.id, 'usr_123');
    assert.equal(decoded.email, 'test@example.com');
    assert.equal(decoded.role, 'USER');
  });

  test('validates signup payload correctly', () => {
    const invalidReq = { body: { name: '', email: 'not-an-email', password: '123' } };
    const errors = validateSignup(invalidReq);
    assert.equal(errors.length, 3);

    const validReq = { body: { name: 'Alice Doe', email: 'alice@example.com', password: 'SecurePassword123' } };
    const validErrors = validateSignup(validReq);
    assert.equal(validErrors.length, 0);
  });

  test('validates login payload correctly', () => {
    const invalidReq = { body: { email: '', password: '' } };
    const errors = validateLogin(invalidReq);
    assert.equal(errors.length, 2);

    const validReq = { body: { email: 'alice@example.com', password: 'SecurePassword123' } };
    const validErrors = validateLogin(validReq);
    assert.equal(validErrors.length, 0);
  });

  test('calculates pagination parameters and metadata properly', () => {
    const params = getPaginationParams({ page: '2', limit: '15' });
    assert.equal(params.page, 2);
    assert.equal(params.limit, 15);
    assert.equal(params.skip, 15);

    const meta = buildPaginationMeta(42, 2, 15);
    assert.equal(meta.total, 42);
    assert.equal(meta.totalPages, 3);
    assert.equal(meta.hasNextPage, true);
    assert.equal(meta.hasPrevPage, true);
  });
});
