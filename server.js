const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const { exec } = require('child_process');
const connectDB = require('./config/db');

dotenv.config({ quiet: true });

connectDB();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const authRoutes = require('./routes/authRoutes');
const seriesRoutes = require('./routes/seriesRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/series', seriesRoutes);

cron.schedule('0 0 * * *', () => {
  console.log('Triggering Daily Data Update...');
  
  exec('node scripts/populateDB.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Update Failed: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Update Stderr: ${stderr}`);
      return;
    }
    console.log(`Daily Update Complete:\n${stdout}`);
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});