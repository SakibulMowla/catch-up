const UserPrioritizer = require('./userprioritizer');
const Matcher = require('./matcher');
const { TABLE } = require('./constants');
const DBWrapper = require('./dbwrapper');
const MailSender = require('./mailsender');

function createEmailToUserMap(allUsers) {
  const emailToUserMap = new Map();
  allUsers.Items.forEach((user) => {
    emailToUserMap.set(user.email, user);
  });
  return emailToUserMap;
}

class Organizer {
  constructor(tier = 'dev') {
    this.tier = tier;
    this.dbWrapper = new DBWrapper();
  }

  async getAllUsers() {
    const scanParams = {
      ProjectionExpression: 'email, firstname, lastname',
      TableName: TABLE.USERS[this.tier],
    };

    const dbWrapper = new DBWrapper();
    const allUsers = await dbWrapper.scan(scanParams);
    console.log('allUsers = ', JSON.stringify(allUsers, null, 2));
    return allUsers;
  }

  async recordMeeting(userA, userB) {
    const currentDatetimeString = new Date().toISOString();

    const batchWriteParamsForPutting = {
      RequestItems: {
        [TABLE.MEETINGS[this.tier]]: [
          {
            PutRequest: {
              Item: {
                KEY: { S: 'email1' },
                email1: { S: userA.email },
                email2: { S: userB.email },
                timestamp: { S: currentDatetimeString },
              },
            },
          },
          {
            PutRequest: {
              Item: {
                KEY: { S: 'email1' },
                email1: { S: userB.email },
                email2: { S: userA.email },
                timestamp: { S: currentDatetimeString },
              },
            },
          },
        ],
      },
    };
    await this.dbWrapper.batchWriteItem(batchWriteParamsForPutting);
  }

  async organizeMeetings() {
    const allUsers = await this.getAllUsers();
    const emailToUserMap = createEmailToUserMap(allUsers);
    const userPrioritizer = new UserPrioritizer(allUsers);
    const orderedUserList = await userPrioritizer.getOrderedListOfUsers(this.tier);
    const matcher = new Matcher(orderedUserList);
    const matchedGroups = await matcher.getMatchedGroups(this.tier);
    const mailSender = new MailSender('dev');

    console.log('matchedGroups = ', JSON.stringify(matchedGroups, null, 2));
    matchedGroups.forEach(async (group, index) => {
      console.log('index = ', index, 'group = ', JSON.stringify(group));
      const userA = emailToUserMap.get(group[0]);
      const userB = emailToUserMap.get(group[1]);
      console.log(`Trying to send email to: ${JSON.stringify(userA)} and ${JSON.stringify(userB, null, 2)}`);
      mailSender.sendMail(userA, userB)
        .then(async () => {
          console.log('send successful');
          return this.recordMeeting(userA, userB);
        })
        .catch(() => {
          console.log('send failure');
        });
    });
  }
}

if (process.argv[2] && (process.argv[2] === 'dev' || process.argv[2] === 'prod')) {
  console.log(process.argv);
  const organizer = new Organizer('dev');
  organizer.organizeMeetings();
} else {
  console.error('Pass dev or prod as the command line argument as the tier where the script will run');
}

module.exports = Organizer;
