const AWS = require('aws-sdk');
const DBWrapper = require('./dbwrapper');

AWS.config.update({
  region: 'us-west-2',
  endpoint: 'https://dynamodb.us-west-2.amazonaws.com',
});

const UserTable = 'catchupusers';
const MeetingTable = 'catchupmeetings';
const DevPrefix = 'dev';

function getUsersSortedByLastMeetingDate(allUsersWithTimestamp) {
  const compareTimestamp = (item1, item2) => {
    const a = item1.timestamp;
    const b = item2.timestamp;
    if (a === null) {
      return -1;
    }
    if (b === null) {
      return 1;
    }
    if (a < b) {
      return -1;
    }
    if (a > b) {
      return 1;
    }
    return 0;
  };
  const allUsersWithTimestampCopy = [...allUsersWithTimestamp];
  allUsersWithTimestampCopy.sort(compareTimestamp);
  return allUsersWithTimestampCopy;
}

class UserPrioritizer {
  constructor() {
    this.dbWrapper = new DBWrapper();
    this.dynamodb = new AWS.DynamoDB();
    this.docClient = new AWS.DynamoDB.DocumentClient();
  }

  async getUsersWithLastMeetingDate(allUsers, tier = 'prod') {
    return Promise.all(allUsers.Items.map(async (user) => {
      const params = {
        ExpressionAttributeValues: {
          ':email1': { S: user.email },
        },
        KeyConditionExpression: 'email1 = :email1',
        ProjectionExpression: 'email1, #timestamp',
        ExpressionAttributeNames: {
          '#timestamp': 'timestamp',
        },
        TableName: (tier === 'dev' ? DevPrefix : '') + MeetingTable,
        ScanIndexForward: false,
        Limit: 1,
      };
      const response = await this.dbWrapper.query(params);
      console.log('User = ', JSON.stringify(user, null, 2));
      console.log('getUsersWithLastMeetingDate in map = ', JSON.stringify(response, null, 2));

      return {
        email: user.email,
        timestamp: response.Count === 0 ? null : response.Items[0].timestamp.S,
      };
    }));
  }

  async getOrderedListOfUsers(tier = 'prod') {
    const scanParams = {
      TableName: (tier === 'dev' ? DevPrefix : '') + UserTable,
      ProjectionExpression: 'email, firstname, lastname',
    };

    const allUsers = await this.dbWrapper.scan(scanParams);
    console.log('allUsers = ', JSON.stringify(allUsers, null, 2));

    const allUsersWithTimestamp = await this.getUsersWithLastMeetingDate(allUsers, tier);
    console.log('allUsersWithTimestamp = ', JSON.stringify(allUsersWithTimestamp, null, 2));

    const allUsersortedByLastMeetingDate = getUsersSortedByLastMeetingDate(allUsersWithTimestamp);
    console.log('allUsersortedByLastMeetingDate = ', JSON.stringify(allUsersortedByLastMeetingDate, null, 2));

    return allUsersortedByLastMeetingDate;
  }
}

module.exports = UserPrioritizer;
