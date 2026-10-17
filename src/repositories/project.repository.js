import Project from '../models/Project.js';

export class ProjectRepository {
  async create(projectData) {
    const project = new Project(projectData);
    return await project.save();
  }

  async findById(id) {
    return await Project.findById(id).exec();
  }

  async findByOwner(ownerId, { skip = 0, limit = 10, sort = { createdAt: -1 }, search = '' } = {}) {
    const filter = { ownerId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
      ];
    }

    return await Project.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findAll({ filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 } } = {}) {
    return await Project.find(filter)
      .populate('ownerId', 'name email company')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async updateById(id, updateData) {
    return await Project.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  async deleteById(id) {
    return await Project.findByIdAndDelete(id).exec();
  }

  async count(filter = {}) {
    return await Project.countDocuments(filter).exec();
  }
}

export const projectRepository = new ProjectRepository();
export default projectRepository;
