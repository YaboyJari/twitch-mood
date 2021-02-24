
require('@tensorflow/tfjs-node');
const express = require('express');
const tf = require('@tensorflow/tfjs');
const { startChatListen } = require('./chatbot');
const { predictTestData } = require('./model');
const PORT = 3000;

(async () => {
  console.log('Starting server...');
  const app = express();
  await app.listen(PORT);
  console.log(`Server started. Listening on port ${PORT}`);
  startChatListen();
})();
