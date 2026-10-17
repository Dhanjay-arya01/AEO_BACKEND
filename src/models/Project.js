import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    websiteUrl: {
      type: String,
      required: [true, 'Website URL is required'],
      trim: true,
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    websiteType: {
      type: String,
      enum: {
        values: ['SaaS', 'E-commerce', 'Agency', 'Blog', 'Portfolio', 'Other'],
        message: '{VALUE} is not a valid website type',
      },
      default: 'SaaS',
    },
    targetAudience: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Target audience cannot exceed 200 characters'],
    },
    targetLocation: {
      type: String,
      default: 'Global',
      trim: true,
      maxlength: [100, 'Target location cannot exceed 100 characters'],
    },
    keywords: {
      type: [String],
      default: [],
    },
    competitors: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.ownerId = ret.ownerId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.ownerId = ret.ownerId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

projectSchema.index({ ownerId: 1, domain: 1 });
projectSchema.index({ ownerId: 1, createdAt: -1 });

export const Project = mongoose.model('Project', projectSchema);
export default Project;
