const Series = require('../models/seriesModel');
const Rating = require('../models/ratingModel');
const LikeHate = require('../models/likeHateModel');

const rankValues = {
  'F': 1, 'D': 2, 'C': 3, 'B': 4, 'A': 5, 'S': 6, 'SS': 7, 'SSS': 8
};

// ## Get All Series
exports.getSeries = async (req, res) => {
  try {
    const { search, sort } = req.query;
    let query = {};

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    let sortOption = { popularityScore: -1 };
    if (sort === 'top_rated') {
      sortOption = { averageRating: -1 };
    } else if (sort === 'newest') {
      sortOption = { releaseDate: -1 };
    }

    const series = await Series.find(query).sort(sortOption).limit(50);

    res.status(200).json({ success: true, count: series.length, data: series });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ## Get Single Series
exports.getSeriesById = async (req, res) => {
  try {
    const series = await Series.findById(req.params.id);
    if (!series) {
      return res.status(404).json({ success: false, error: 'Series not found' });
    }
    res.status(200).json({ success: true, data: series });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ## Tap Series (Like/Hate with Spam Protection)
exports.tapSeries = async (req, res) => {
  try {
    const { type } = req.body;
    const seriesId = req.params.id;
    const userId = req.user.id;

    const series = await Series.findById(seriesId);
    if (!series) {
      return res.status(404).json({ success: false, error: 'Series not found' });
    }

    const existingTap = await LikeHate.findOne({ user: userId, series: seriesId });

    if (existingTap) {
      if (existingTap.type === type) {
        await existingTap.deleteOne();
        if (type === 'like') series.simpleLikes = Math.max(0, series.simpleLikes - 1);
        if (type === 'hate') series.simpleHates = Math.max(0, series.simpleHates - 1);
      } else {
        existingTap.type = type;
        await existingTap.save();
        
        if (type === 'like') {
          series.simpleLikes += 1;
          series.simpleHates = Math.max(0, series.simpleHates - 1);
        } else {
          series.simpleHates += 1;
          series.simpleLikes = Math.max(0, series.simpleLikes - 1);
        }
      }
    } else {
      await LikeHate.create({ user: userId, series: seriesId, type });
      if (type === 'like') series.simpleLikes += 1;
      if (type === 'hate') series.simpleHates += 1;
    }

    await series.save();
    res.status(200).json({ success: true, data: series });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ## Rank Series (Authenticated)
exports.rankSeries = async (req, res) => {
  try {
    const { rank } = req.body;
    const seriesId = req.params.id;
    const userId = req.user.id;

    if (!rankValues[rank]) {
      return res.status(400).json({ success: false, error: 'Invalid Rank' });
    }

    const series = await Series.findById(seriesId);
    if (!series) {
      return res.status(404).json({ success: false, error: 'Series not found' });
    }

    await Rating.create({
      rank,
      numericValue: rankValues[rank],
      series: seriesId,
      user: userId
    });

    if (!series.ratingDistribution) {
        series.ratingDistribution = {}; 
    }
    
    series.ratingDistribution[rank] = (series.ratingDistribution[rank] || 0) + 1;
    
    const currentTotal = series.averageRating * series.voteCount;
    series.voteCount += 1;
    series.averageRating = (currentTotal + rankValues[rank]) / series.voteCount;
    
    series.rankLabel = getLabelFromScore(series.averageRating);

    await series.save();

    res.status(200).json({ success: true, data: series });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'You have already rated this series' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// ## Helper Function
const getLabelFromScore = (score) => {
  if (score >= 7.5) return 'SSS';
  if (score >= 6.5) return 'SS';
  if (score >= 5.5) return 'S';
  if (score >= 4.5) return 'A';
  if (score >= 3.5) return 'B';
  if (score >= 2.5) return 'C';
  if (score >= 1.5) return 'D';
  return 'F';
};