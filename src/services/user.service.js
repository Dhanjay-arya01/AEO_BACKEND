import userRepository from '../repositories/user.repository.js';
import { ApiError } from '../utils/apiError.util.js';

export class UserService {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found.');
    }
    return user.toJSON();
  }

  async updateProfile(userId, { name, avatarUrl, company }) {
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl.trim();
    if (company !== undefined) updateData.company = company.trim();

    const updatedUser = await userRepository.updateById(userId, updateData);
    if (!updatedUser) {
      throw ApiError.notFound('User not found.');
    }
    return updatedUser.toJSON();
  }

  async deactivateSelf(userId) {
    const updatedUser = await userRepository.updateById(userId, { isActive: false });
    if (!updatedUser) {
      throw ApiError.notFound('User not found.');
    }
    return { success: true, message: 'Account deactivated successfully.' };
  }
}

export const userService = new UserService();
export default userService;
