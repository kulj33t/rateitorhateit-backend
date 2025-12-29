const mongoose = require('mongoose');

const librarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  series: {
    type: mongoose.Schema.ObjectId,
    ref: 'Series',
    required: true
  },
  status: {
    type: String,
    enum: ['watching', 'watch_later'],
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

librarySchema.index({ user: 1, series: 1 }, { unique: true });

module.exports = mongoose.model('Library', librarySchema);