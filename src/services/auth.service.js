import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';
import userRepository from '../repositories/user.repository.js';
import { ApiError } from '../utils/apiError.util.js';

export class AuthService {
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id || user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  async signup({ name, email, password, company, role = 'USER' }) {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw ApiError.conflict('An account with this email address already exists.', 'EMAIL_EXISTS');
    }

    // Hash password with 12 rounds
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Prevent regular signup from creating admin directly unless specified safely
    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    const user = await userRepository.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      company: company ? company.trim() : '',
      role: assignedRole,
      isActive: true,
      lastLoginAt: new Date(),
    });

    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token,
    };
  }

  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await userRepository.findByEmail(normalizedEmail, true);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password combination.', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account is deactivated. Please contact an administrator.', 'ACCOUNT_DEACTIVATED');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password combination.', 'INVALID_CREDENTIALS');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token,
    };
  }

  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    return user.toJSON();
  }
}

export const authService = new AuthService();
export default authService;
