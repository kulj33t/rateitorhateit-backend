const mongoose = require('mongoose');

const likeHateSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['like', 'hate'],
    required: true
  }
});


likeHateSchema.index({ series: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('LikeHate', likeHateSchema);