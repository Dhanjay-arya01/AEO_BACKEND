import mongoose from 'mongoose';

export const AUDIT_STATUSES = [
  'QUEUED',
  'CRAWLING',
  'SEO_ANALYSIS',
  'AEO_ANALYSIS',
  'RESEARCHING',
  'INDEXING',
  'GENERATING',
  'VALIDATING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
];

const auditSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: AUDIT_STATUSES,
        message: '{VALUE} is not a valid audit status',
      },
      default: 'QUEUED',
      index: true,
    },
    progress: {
      type: Number,
      min: [0, 'Progress cannot be less than 0'],
      max: [100, 'Progress cannot exceed 100'],
      default: 0,
    },
    currentStage: {
      type: String,
      enum: AUDIT_STATUSES,
      default: 'QUEUED',
    },
    jobId: {
      type: String,
      required: [true, 'Job ID is required'],
      unique: true,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    error: {
      message: { type: String, default: null },
      code: { type: String, default: null },
      stage: { type: String, default: null },
      details: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    seoScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    aeoScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    summary: {
      type: String,
      default: '',
    },
    // Flexible container for SEO issues, AEO items, recommendations, and metrics from worker
    results: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        issues: [],
        aeoAnalysis: [],
        recommendations: [],
        pages: [],
        technicalOverview: null,
      }),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.projectId = ret.projectId.toString();
        ret.ownerId = ret.ownerId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.projectId = ret.projectId.toString();
        ret.ownerId = ret.ownerId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

auditSchema.index({ projectId: 1, createdAt: -1 });
auditSchema.index({ ownerId: 1, createdAt: -1 });
auditSchema.index({ status: 1, createdAt: -1 });

export const Audit = mongoose.model('Audit', auditSchema);
export default Audit;
