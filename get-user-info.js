const request = require("request");
const config = require("./config");

const getUserInfo = async (userid, bearerToken) => {
  return new Promise((resolve, reject) => {
    request({
        method: "GET",
        uri: `https://api.twitch.tv/helix/users?id=${userid}`,
        headers: {
            'Client-Id': config.clientID,
            'Authorization': `Bearer ${bearerToken}`,
        },
      },

      // callback
      (error, response, body) => {
        resolve(body);
      }
    );
  });
};

module.exports = {
  getUserInfo,
};