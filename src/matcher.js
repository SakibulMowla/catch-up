const AWS = require('aws-sdk');
const DBWrapper = require('./dbwrapper');

AWS.config.update({
  region: 'us-west-2',
  endpoint: 'https://dynamodb.us-west-2.amazonaws.com',
});

const MeetingTable = 'catchupmeetings';
const DevPrefix = 'dev';

class Matcher {
  constructor(orderedAllUserList) {
    this.dbWrapper = new DBWrapper();
    this.assignedUsers = new Set();
    this.orderedAllUserList = orderedAllUserList;
    this.totalUsers = this.orderedAllUserList.length;
  }

  async getPreferenceList(user, tier = 'dev') {
    const params = {
      ExpressionAttributeValues: {
        ':email1': { S: user.email },
      },
      KeyConditionExpression: 'email1 = :email1',
      ProjectionExpression: 'email2, #timestamp',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp',
      },
      TableName: (tier === 'dev' ? DevPrefix : '') + MeetingTable,
      ScanIndexForward: false,
      Limit: this.totalUsers - 1,
    };

    const response = await this.dbWrapper.query(params);
    console.log('getPreferenceList response = ', JSON.stringify(response, null, 2));

    const preferenceList = [];
    const preferenceSet = new Set();
    response.Items.forEach((element) => {
      if (preferenceSet.has(element.email2.S)) {
        return;
      }

      preferenceList.unshift(element.email2.S);
      preferenceSet.add(element.email2.S);
    });

    this.orderedAllUserList.forEach((element) => {
      if (!preferenceSet.has(element.email) && element.email !== user.email) {
        preferenceList.unshift(element.email);
      }
    });

    console.log('preferenceList response = ', JSON.stringify(preferenceList, null, 2));

    return preferenceList;
  }

  async getMatchedGroups(tier = 'dev') {
    const matchedGroups = [];
    // 1. for...of is needed here to send the getPreferenceList calls in sequence
    // 2. using map makes it parallel and doesn't preserve the order of the list
    // 3. forEach can't be used when await is inside
    // eslint-disable-next-line no-restricted-syntax
    for (const userA of this.orderedAllUserList) {
      if (this.assignedUsers.has(userA.email)) {
        break;
      }

      // eslint-disable-next-line no-await-in-loop
      const preferenceList = await this.getPreferenceList(userA, tier);
      const userBemail = preferenceList.find((email) => !this.assignedUsers.has(email));
      console.log('userA = ', JSON.stringify(userA, null, 2));
      console.log('userBemail = ', userBemail);
      if (userBemail) {
        console.log('userA.email = ', userA.email);
        console.log('userBemail = ', userBemail);
        matchedGroups.push([userA.email, userBemail]);
        this.assignedUsers.add(userA.email);
        this.assignedUsers.add(userBemail);
      }
    }

    console.log('matchedGroups = ', JSON.stringify(matchedGroups, null, 2));

    return matchedGroups;
  }
}

module.exports = Matcher;
