'use strict';

const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
  twitchId: { type: String, required: true },
  twitchName: { type: String, required: true },
  imageUrl: { type: String, required: true },
  amountSad: { type: Number, required: true },
  amountAnger: { type: Number, required: true },
  amountFear: { type: Number, required: true },
  amountJoy: { type: Number, required: true },
  amountLove: { type: Number, required: true },
  amountSurprise: { type: Number, required: true },
  messageCount: { type: Number, required: true }
});

module.exports = mongoose.model('user_data', userDataSchema);
