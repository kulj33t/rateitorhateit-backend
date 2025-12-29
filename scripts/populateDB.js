require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Series = require('../models/seriesModel');


const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_ACCESS_TOKEN; 
const PAGES_TO_FETCH = 3;


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    accept: 'application/json'
  }
});


const populate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('DB Connected.');


    console.log('\n--- Fetching Top Rated ---');
    await fetchAndSave('top_rated');


    console.log('\n--- Fetching Popular ---');
    await fetchAndSave('popular');

    console.log('\nData Import Complete!');
    process.exit();
  } catch (err) {
    console.error('Critical Error:', err);
    process.exit(1);
  }
};


async function fetchAndSave(category) {
  for (let page = 1; page <= PAGES_TO_FETCH; page++) {
    console.log(`\nProcessing ${category} Page ${page}...`);
    

    const { data } = await tmdbClient.get(`/tv/${category}?language=en-US&page=${page}`);
    

    for (const show of data.results) {

      let trailerUrl = null;
      try {
        const videoRes = await tmdbClient.get(`/tv/${show.id}/videos?language=en-US`);
        const videos = videoRes.data.results;
        

        const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer') || videos[0];
        if (trailer) {
          trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
        }
      } catch (e) {
        console.log(`Could not fetch video for ${show.name}`);
      }


      const seriesData = {
        title: show.name,
        description: show.overview || 'No description available.',
        releaseDate: show.first_air_date,

        coverImage: show.poster_path 
          ? `https://image.tmdb.org/t/p/w500${show.poster_path}` 
          : null,
        backdropImage: show.backdrop_path 
          ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` 
          : null,
        
        trailerUrl: trailerUrl,
        
        source: 'TMDB',
        externalId: show.id.toString(),
        popularityScore: show.popularity
      };

   
      await Series.findOneAndUpdate(
        { externalId: seriesData.externalId, source: 'TMDB' },
        seriesData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      process.stdout.write('.'); 
      
 
      await sleep(100); 
    }
  }
}

populate();