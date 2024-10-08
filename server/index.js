const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const pointsRouter = require('./routes/points');
require('dotenv').config();

const app = express();
app.use(cookieParser());
app.use(express.json());

const IS_RECORD_ENABLED = process.env.IS_RECORD_ENABLED === 'true';

if (IS_RECORD_ENABLED) {
  const connectWithRetry = () => {
    mongoose.connect(process.env.MONGODB_URI).then(() => {
      console.log('MongoDB is connected');
    }).catch(err => {
      console.log(err);
      setTimeout(connectWithRetry, 5000); // Retry connection after 5 seconds
    });
  };

  connectWithRetry();
}

app.use('/api/points', pointsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
