const tmi = require('tmi.js');
const {
    handleCommands
} = require('./commands');
const {
    getToken
} = require('./token-credentials');
const {
    getUserInfo
} = require('./get-user-info');
const translate = require('@vitalets/google-translate-api');
const tf = require('@tensorflow/tfjs');
const {
    startTraining,
    predictSingleData,
    predictTestData
} = require('./model');
const config = require("./config");
const User = require('./user-data.model');
const { getDutchStreams } = require('./get-dutch-streamers');

let client;
let token;

const translateSentence = async (sentence) => {
    try {
        return await translate(sentence, {
            to: 'en'
        });
    } catch (err) {
        console.log("couldn't translate: " + sentence);
        return null;
    }
}

const opts = {
    identity: {
        username: config.username,
        password: config.password,
    },
    channels: [
        'JayriVM',
        'Talon_EXE',
        'The_CAG',
        'Frapsel',
        'MrSeeSharp',
        'itsnoomie',
    ]
};

const parseToUserSchema = (twitchUser) => {
    return {
        'twitchId': twitchUser.id,
        'twitchName': twitchUser.display_name,
        'imageUrl': twitchUser.profile_image_url,
        'amountSad': 0,
        'amountAnger': 0,
        'amountFear': 0,
        'amountJoy': 0,
        'amountLove': 0,
        'amountSurprise': 0,
        'messageCount': 0,
    }
}

const getOrInsertUser = async (twitchUser) => {
    let user;
    user = await User.findOne({
        'twitchId': twitchUser.id
    });
    if (!user) {
        const mappedUserData = parseToUserSchema(twitchUser);
        user = new User(mappedUserData);
        user.save();
    }
    return user;
}

const addChannelsToBot = async () => {
    const streamers = JSON.parse(await getDutchStreams(token)).data;
    streamers.forEach(streamer => {
        console.log(streamer.user_name);
        opts.channels.push(streamer.user_name);
    });
}

const startChatListen = async () => {
    token = await getToken();
    token = JSON.parse(token).access_token;
    // await addChannelsToBot();
    console.log(opts);
    client = new tmi.client(opts);

    client.on('message', onMessageHandler);
    client.on('connected', onConnectedHandler);

    client.connect();
};

const addToUserData = async (user, predictionData, labelArray) => {
    const moodToString = labelArray[predictionData];
    console.log(user.twitchName + ': ' + moodToString);
    switch (labelArray[predictionData]) {
        case 'anger':
            user.amountAnger++;
            break;
        case 'fear':
            user.amountFear++;
            break;
        case 'joy':
            user.amountJoy++;
            break;
        case 'love':
            user.amountLove++;
            break;
        case 'sadness':
            user.amountSad++;
            break;
        case 'surprise':
            user.amountSurprise++;
            break;
    };
    user.messageCount++;
    console.log(user.twitchName + ' data added!');
    user.save();
};

const onMessageHandler = async (target, context, msg, self) => {
    if (self || msg.startsWith('!')) {
        return;
    }

    const punctuationRegex = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;
    const numberRegex = /[0-9]/g;
    const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g
    msg = msg.replace(punctuationRegex, '');
    msg = msg.replace(emojiRegex, '');
    msg = msg.replace(numberRegex, '');

    const userInfo = JSON.parse(await getUserInfo(context['user-id'], token)).data[0];
    const user = await getOrInsertUser(userInfo);

    const message = msg.trim().toLowerCase();
    let model;

    try {
        model = await tf.loadLayersModel('file://model/model.json');
        const translateData = await translateSentence(message);
        if (translateData) {
            const singleData = await predictSingleData(translateData.text, model);
            if (singleData) {
                await addToUserData(user, singleData[0], singleData[1]);
            }
        };
    } catch (err) {
        console.log(err);
        if (!model) {
            await startTraining();
            let model = await tf.loadLayersModel('file://model/model.json');
            await predictTestData(model);
        };
    };

    // handleCommands(target, message, client);
}

const onConnectedHandler = (addr, port) => {
    console.log(`* Connected to ${addr}:${port}`);
}

module.exports = {
    startChatListen,
};