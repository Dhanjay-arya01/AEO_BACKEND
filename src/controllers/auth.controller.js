import authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.util.js';

export async function signup(req, res, next) {
  try {
    const { name, email, password, company, role } = req.body;
    const result = await authService.signup({ name, email, password, company, role });
    return sendSuccess(res, result, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return sendSuccess(res, result, 'Login successful', 200);
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    // Stateless JWT: client discards token
    return sendSuccess(res, null, 'Logged out successfully', 200);
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id || req.user._id);
    return sendSuccess(res, user, 'Current user retrieved', 200);
  } catch (error) {
    next(error);
  }
}

export default {
  signup,
  login,
  logout,
  getCurrentUser,
};
