const AWS = require('aws-sdk');
const DBWrapper = require('./dbwrapper');
const { DYNAMODB, TABLE } = require('./constants');

AWS.config.update({
  endpoint: DYNAMODB.ENDPOINT,
  region: DYNAMODB.REGION,
});

class Matcher {
  constructor(tier = 'dev') {
    this.tier = tier;
    this.dbWrapper = new DBWrapper();
  }

  async getPreferenceList(user, orderedAllUserList) {
    const totalUsers = orderedAllUserList.length;
    const params = {
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':email1': {
          S: user.email,
        },
      },
      KeyConditionExpression: 'email1 = :email1',
      Limit: totalUsers - 1,
      ProjectionExpression: 'email2, #timestamp',
      ScanIndexForward: false,
      TableName: TABLE.MEETINGS[this.tier],
    };

    const userLatestMeetings = await this.dbWrapper.query(params);
    console.log('getPreferenceList userLatestMeetings = ', JSON.stringify(userLatestMeetings, null, 2));

    const preferenceList = [];
    const preferenceSet = new Set();
    userLatestMeetings.Items.forEach((element) => {
      if (preferenceSet.has(element.email2.S)) {
        return;
      }

      preferenceList.unshift(element.email2.S);
      preferenceSet.add(element.email2.S);
    });

    orderedAllUserList.forEach((element) => {
      if (!preferenceSet.has(element.email) && element.email !== user.email) {
        preferenceList.unshift(element.email);
      }
    });

    console.log('user = ', user, ', preferenceList = ', JSON.stringify(preferenceList, null, 2));

    return preferenceList;
  }

  async getMatchedGroups(orderedAllUserList) {
    const assignedUsers = new Set();
    const matchedGroups = [];
    // 1. for...of is needed here to send the getPreferenceList calls in sequence
    // 2. using map makes it parallel and doesn't preserve the order of the list
    // 3. forEach can't be used when await is inside
    // eslint-disable-next-line no-restricted-syntax
    for (const userA of orderedAllUserList) {
      if (assignedUsers.has(userA.email)) {
        break;
      }

      // eslint-disable-next-line no-await-in-loop
      const preferenceList = await this.getPreferenceList(userA, orderedAllUserList);
      const userBemail = preferenceList.find((email) => !assignedUsers.has(email));
      console.log('userA = ', JSON.stringify(userA, null, 2));
      console.log('userBemail = ', userBemail);
      if (userBemail) {
        console.log('userA.email = ', userA.email);
        console.log('userBemail = ', userBemail);
        matchedGroups.push([userA.email, userBemail]);
        assignedUsers.add(userA.email);
        assignedUsers.add(userBemail);
      }
    }

    console.log('matchedGroups = ', JSON.stringify(matchedGroups, null, 2));

    return matchedGroups;
  }
}

module.exports = Matcher;
