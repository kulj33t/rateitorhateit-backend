const Series = require('../models/seriesModel');
const Rating = require('../models/ratingModel');
const Library = require('../models/libraryModel');

const rankValues = { 'F': 1, 'D': 2, 'C': 3, 'B': 4, 'A': 5, 'S': 6, 'SS': 7, 'SSS': 8 };

exports.getSeries = async (req, res) => {
  try {
    const { search, sort } = req.query;
    let query = {};

    if (search) query.title = { $regex: search, $options: 'i' };

    let sortOption = { popularityScore: -1 };
    if (sort === 'top_rated') sortOption = { averageRating: -1 };
    else if (sort === 'newest') sortOption = { releaseDate: -1 };

    const series = await Series.find(query).sort(sortOption).limit(50);
    res.status(200).json({ success: true, count: series.length, data: series });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getSeriesById = async (req, res) => {
  try {
    const series = await Series.findById(req.params.id);
    if (!series) return res.status(404).json({ success: false, error: 'Series not found' });
    res.status(200).json({ success: true, data: series });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateLibraryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const seriesId = req.params.id;
    const userId = req.user.id;

    if (status === 'remove') {
      await Library.findOneAndDelete({ user: userId, series: seriesId });
      return res.status(200).json({ success: true, data: null });
    }

    if (!['watching', 'watch_later'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const entry = await Library.findOneAndUpdate(
      { user: userId, series: seriesId },
      { status, updatedAt: Date.now() },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.rankSeries = async (req, res) => {
  try {
    const { rank } = req.body;
    const seriesId = req.params.id;
    const userId = req.user.id;

    if (!rankValues[rank]) return res.status(400).json({ success: false, error: 'Invalid Rank' });

    const series = await Series.findById(seriesId);
    if (!series) return res.status(404).json({ success: false, error: 'Series not found' });

    const existingRating = await Rating.findOne({ user: userId, series: seriesId });
    
    const newScore = rankValues[rank];
    let currentTotalScore = series.averageRating * series.voteCount;

    if (existingRating) {
      currentTotalScore -= existingRating.numericValue;
      
      const oldRank = existingRating.rank;
      if (series.ratingDistribution && series.ratingDistribution[oldRank] > 0) {
        series.ratingDistribution[oldRank]--;
      }

      existingRating.rank = rank;
      existingRating.numericValue = newScore;
      await existingRating.save();
    } else {
      await Rating.create({
        rank,
        numericValue: newScore,
        series: seriesId,
        user: userId
      });

      series.voteCount += 1;
    }

    currentTotalScore += newScore;
    
    if (series.voteCount > 0) {
      series.averageRating = currentTotalScore / series.voteCount;
    } else {
      series.averageRating = 0;
    }

    series.rankLabel = getLabelFromScore(series.averageRating);

    if (!series.ratingDistribution) series.ratingDistribution = {};
    series.ratingDistribution[rank] = (series.ratingDistribution[rank] || 0) + 1;

    await series.save();

    res.status(200).json({ success: true, data: series });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getMyProfileData = async (req, res) => {
  try {
    const userId = req.user.id;

    const rated = await Rating.find({ user: userId }).populate('series', 'title coverImage').sort('-createdAt');
    const library = await Library.find({ user: userId }).populate('series', 'title coverImage').sort('-updatedAt');

    const watching = library.filter(item => item.status === 'watching');
    const watchLater = library.filter(item => item.status === 'watch_later');

    res.status(200).json({
      success: true,
      data: {
        rated,
        watching,
        watchLater
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

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