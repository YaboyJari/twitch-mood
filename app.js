
require('@tensorflow/tfjs-node');
const express = require('express');
const { startChatListen } = require('./chatbot');
const { connect } = require('./mongoose-initializer');
const PORT = 3000;

(async () => {
  await connect();
  console.log('Starting server...');
  const app = express();
  await app.listen(PORT);
  console.log(`Server started. Listening on port ${PORT}`);
  startChatListen();
})();
