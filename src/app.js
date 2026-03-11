const express = require('express');
const workoutRoutes = require('./routes/workout-routes');

function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(express.static('public'));
  app.use('/api', workoutRoutes);

  return app;
}

module.exports = { createApp };
