const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema({

    
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    default: "No description available."
  },
  releaseDate: Date,
  genres: [String],


  coverImage: String,   
  backdropImage: String, 
  trailerUrl: String,    


  source: {
    type: String,
    default: 'TMDB'
  },
  externalId: {
    type: String,
    required: true
  },
  popularityScore: {
    type: Number, 
    default: 0
  },

  

  simpleLikes: { type: Number, default: 0 },
  simpleHates: { type: Number, default: 0 },



  averageRating: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 10 
  },
  voteCount: { type: Number, default: 0 }, 


  ratingDistribution: {
    F:   { type: Number, default: 0 },
    D:   { type: Number, default: 0 },
    C:   { type: Number, default: 0 },
    B:   { type: Number, default: 0 },
    A:   { type: Number, default: 0 },
    S:   { type: Number, default: 0 },
    SS:  { type: Number, default: 0 },
    SSS: { type: Number, default: 0 }
  },

  updatedAt: { type: Date, default: Date.now }
});


seriesSchema.index({ source: 1, externalId: 1 }, { unique: true });

module.exports = mongoose.model('Series', seriesSchema);