const express = require('express');
const { 
  getSeries, 
  getSeriesById, 
  tapSeries, 
  rankSeries 
} = require('../controllers/seriesController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


router.get('/', getSeries);
router.get('/:id', getSeriesById);
router.post('/:id/tap', tapSeries);


router.post('/:id/rank', protect, rankSeries);

module.exports = router;