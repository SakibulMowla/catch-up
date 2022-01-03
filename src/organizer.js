const UserPrioritizer = require('./userprioritizer');
const Matcher = require('./matcher');
const { TABLE } = require('./constants');
const DBWrapper = require('./dbwrapper');
const MailSender = require('./mailsender');
const { getMeetingsTablePutRequestItem } = require('./utility');

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
    this.userPrioritizer = new UserPrioritizer(this.tier);
    this.matcher = new Matcher(this.tier);
    this.mailSender = new MailSender(this.tier);
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
          getMeetingsTablePutRequestItem(userA.email, userB.email, currentDatetimeString),
          getMeetingsTablePutRequestItem(userB.email, userA.email, currentDatetimeString),
        ],
      },
    };
    await this.dbWrapper.batchWriteItem(batchWriteParamsForPutting);
  }

  async organizeMeetings() {
    const allUsers = await this.getAllUsers();
    const emailToUserMap = createEmailToUserMap(allUsers);
    const orderedUserList = await this.userPrioritizer.getOrderedListOfUsers(allUsers);
    const matchedGroups = await this.matcher.getMatchedGroups(orderedUserList);

    console.log('matchedGroups = ', JSON.stringify(matchedGroups, null, 2));
    matchedGroups.forEach(async (group) => {
      const userA = emailToUserMap.get(group[0]);
      const userB = emailToUserMap.get(group[1]);
      this.mailSender.sendMail(userA, userB)
        .then(async () => {
          console.log(`send successful for ${JSON.stringify(userA)} and ${JSON.stringify(userB)}`);
          return this.recordMeeting(userA, userB);
        })
        .catch((err) => {
          if (err && err.response && err.response.data) {
            console.error(`Reason = StatusCode: ${err.response.data.StatusCode}, ErrorMessage: ${err.response.data.ErrorMessage}`);
          }else{
            console.error('Reason = ', err);
          }
          console.error(`send failure for ${JSON.stringify(userA)} and ${JSON.stringify(userB)}`);
        });
    });
  }
}

if (process.argv[2] && (process.argv[2] === 'dev' || process.argv[2] === 'prod')) {
  console.log(process.argv);
  const organizer = new Organizer(process.argv[2]);
  organizer.organizeMeetings();
} else {
  console.error('Pass dev or prod as the command line argument as the tier where the script will run');
}

module.exports = Organizer;
