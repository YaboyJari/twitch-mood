const tmi = require('tmi.js');
const { handleCommands } = require('./commands');
const { getToken } = require('./token-credentials');
const { getUserInfo } = require('./get-user-info');
const translate = require('@vitalets/google-translate-api');
const tf = require('@tensorflow/tfjs');
const { startTraining, predictSingleData } = require('./model');
const config = require("./config");

let client;
let token;

const translateSentence = async (sentence) => {
    return await translate(sentence, {
        to: 'en'
    });
}

const opts = {
    identity: {
        username: config.username,
        password: config.password,
    },
    channels: [
        config.username,
    ]
};

const startChatListen = async () => {
    client = new tmi.client(opts);

    client.on('message', onMessageHandler);
    client.on('connected', onConnectedHandler);
    token = await getToken();
    token = JSON.parse(token).access_token;

    client.connect();
};

const onMessageHandler = async (target, context, msg, self) => {
    if (self) {
        return;
    }

    const userInfo = JSON.parse(await getUserInfo(context['user-id'], token));
    console.log(userInfo);

    const message = msg.trim();

    try {
        let model = await tf.loadLayersModel('file://model/model.json');
        // const testData = await predictTestData(model);
        const translateData = await translateSentence(message);
        predictSingleData(translateData.text, model);
     } catch (err) {
       await startTraining();
     }
    
    // handleCommands(target, message, client);
}

const onConnectedHandler = (addr, port) => {
    console.log(`* Connected to ${addr}:${port}`);
}

module.exports = {
    startChatListen,
};