import User from '../models/User.js';

export class UserRepository {
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async findById(id, includePassword = false) {
    let query = User.findById(id);
    if (includePassword) {
      query = query.select('+passwordHash');
    }
    return await query.exec();
  }

  async findByEmail(email, includePassword = false) {
    let query = User.findOne({ email: email.toLowerCase().trim() });
    if (includePassword) {
      query = query.select('+passwordHash');
    }
    return await query.exec();
  }

  async updateById(id, updateData) {
    return await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  async findAll({ filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 } }) {
    return await User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async count(filter = {}) {
    return await User.countDocuments(filter).exec();
  }
}

export const userRepository = new UserRepository();
export default userRepository;
