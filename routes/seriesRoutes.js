const express = require('express');
const { 
  getSeries, 
  getSeriesById, 
  tapSeries, 
  rankSeries,
  getMyRatings 
} = require('../controllers/seriesController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


router.get('/', getSeries);


router.get('/my-ratings', protect, getMyRatings);
router.post('/:id/tap', protect, tapSeries);
router.post('/:id/rank', protect, rankSeries);


router.get('/:id', getSeriesById);

module.exports = router;