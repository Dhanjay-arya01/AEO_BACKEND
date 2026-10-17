import mongoose from 'mongoose';
import Audit from '../models/Audit.js';

export class AuditRepository {
  async create(auditData) {
    const audit = new Audit(auditData);
    return await audit.save();
  }

  async findById(id) {
    return await Audit.findById(id)
      .populate('projectId', 'name domain websiteUrl')
      .populate('ownerId', 'name email')
      .exec();
  }

  async findByJobId(jobId) {
    return await Audit.findOne({ jobId }).exec();
  }

  async findByProjectId(projectId, { skip = 0, limit = 10, sort = { createdAt: -1 } } = {}) {
    return await Audit.find({ projectId })
      .select('-results') // Omit heavy results blob from listing queries
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findByOwnerId(ownerId, { skip = 0, limit = 10, sort = { createdAt: -1 } } = {}) {
    return await Audit.find({ ownerId })
      .select('-results')
      .populate('projectId', 'name domain')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findAll({ filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 } } = {}) {
    return await Audit.find(filter)
      .select('-results')
      .populate('projectId', 'name domain')
      .populate('ownerId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async updateById(id, updateData) {
    return await Audit.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  async count(filter = {}) {
    return await Audit.countDocuments(filter).exec();
  }

  async deleteByProjectId(projectId) {
    return await Audit.deleteMany({ projectId }).exec();
  }

  async getStatusCounts(ownerId = null) {
    const match = ownerId ? { ownerId: new mongoose.Types.ObjectId(ownerId) } : {};
    const pipeline = [
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ];
    const results = await Audit.aggregate(pipeline).exec();
    return results.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
  }

  async getAverageScores(ownerId = null) {
    const match = {
      status: 'COMPLETED',
      seoScore: { $ne: null },
      aeoScore: { $ne: null },
    };
    if (ownerId) {
      match.ownerId = new mongoose.Types.ObjectId(ownerId);
    }

    const result = await Audit.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          avgSeoScore: { $avg: '$seoScore' },
          avgAeoScore: { $avg: '$aeoScore' },
          totalCompleted: { $sum: 1 },
        },
      },
    ]).exec();

    if (!result || result.length === 0) {
      return { avgSeoScore: 0, avgAeoScore: 0, totalCompleted: 0 };
    }

    return {
      avgSeoScore: Math.round(result[0].avgSeoScore || 0),
      avgAeoScore: Math.round(result[0].avgAeoScore || 0),
      totalCompleted: result[0].totalCompleted || 0,
    };
  }
}

export const auditRepository = new AuditRepository();
export default auditRepository;
