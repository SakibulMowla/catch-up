const AWS = require('aws-sdk');
const { TABLE } = require('./constants');
const DBWrapper = require('./dbwrapper');

AWS.config.update({
  endpoint: 'https://dynamodb.us-west-2.amazonaws.com',
  region: 'us-west-2',
});

function getUsersSortedByLastMeetingTimestamp(allUsersWithTimestamp) {
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
  constructor(allUsers) {
    this.allUsers = allUsers;
    this.dbWrapper = new DBWrapper();
  }

  async getUsersWithLastMeetingDate(tier = 'dev') {
    return Promise.all(this.allUsers.Items.map(async (user) => {
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
        Limit: 1,
        ProjectionExpression: 'email1, #timestamp',
        ScanIndexForward: false,
        TableName: TABLE.MEETINGS[tier],
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

  async getOrderedListOfUsers(tier = 'dev') {
    const allUsersWithTimestamp = await this.getUsersWithLastMeetingDate(tier);
    console.log('allUsersWithTimestamp = ', JSON.stringify(allUsersWithTimestamp, null, 2));

    const allUsersortedByLastMeetingDate = getUsersSortedByLastMeetingTimestamp(
      allUsersWithTimestamp,
    );
    console.log('allUsersortedByLastMeetingDate = ', JSON.stringify(allUsersortedByLastMeetingDate, null, 2));

    return allUsersortedByLastMeetingDate;
  }
}

module.exports = UserPrioritizer;
