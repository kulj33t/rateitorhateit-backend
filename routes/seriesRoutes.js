const express = require('express');
const { 
  getSeries, 
  getSeriesById, 
  updateLibraryStatus, 
  rankSeries,
  getMyProfileData 
} = require('../controllers/seriesController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getSeries);

router.get('/my-profile', protect, getMyProfileData);
router.post('/:id/library', protect, updateLibraryStatus);
router.post('/:id/rank', protect, rankSeries);

router.get('/:id', getSeriesById);

module.exports = router;