import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gender: { type: String, default: 'Unknown' },
  grade: { type: Number, default: 0 },
  math: { type: Number, default: 0 },
  science: { type: Number, default: 0 },
  english: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  isDebarred: { type: Boolean, default: false },
  recordId: { type: Number }
});

const SessionSchema = new mongoose.Schema({
  sessionName: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now
  },
  minScore: { type: Number, default: 0 },
  minMath: { type: Number, default: 0 },
  minScience: { type: Number, default: 0 },
  minEnglish: { type: Number, default: 0 },
  searchQuery: { type: String, default: '' },
  students: [StudentSchema]
});

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
