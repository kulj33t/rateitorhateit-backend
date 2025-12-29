const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  rank: {
    type: String,
    required: true,
    enum: ['F', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']
  },
  numericValue: {
    type: Number,
    required: true
  },
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ratingSchema.index({ series: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);