const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  originalText: {
    type: String,
    required: true,
  },

  aiImprovedText: {
    type: String,
  },
  aiScore: {
    type: Number,
  },
  atsScore: {
    type: Number,
  },
  suggestions: [
    {
      type: String,
    },
  ],
  lastMatchScore: Number,
    lastMissingSkills: [String],
    lastRecommendedKeywords: [String],
    lastSummary: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Resume = mongoose.model("Resume", resumeSchema);

module.exports = Resume;
