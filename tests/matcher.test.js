const { JEST_DEFAULT_TIMEOUT_MS, DB_SETUP_WAIT_TIME_MS, TABLE } = require('../src/constants');
const DBWrapper = require('../src/dbwrapper');
const { delay, getMeetingsTablePutRequestItem, getUserTablePutRequestItem } = require('../src/utility');
const Matcher = require('../src/matcher');
const UserPrioritizer = require('../src/userprioritizer');

const dbWrapper = new DBWrapper();

beforeAll(async () => {
  const userTableParams = {
    AttributeDefinitions: [
      {
        AttributeName: 'email',
        AttributeType: 'S',
      },
    ],
    KeySchema: [
      {
        AttributeName: 'email',
        KeyType: 'HASH',
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10,
    },
    TableName: TABLE.USERS.dev,
  };
  await dbWrapper.createTable(userTableParams);

  const meetingTableParams = {
    AttributeDefinitions: [
      {
        AttributeName: 'email1',
        AttributeType: 'S',
      }, {
        AttributeName: 'timestamp',
        AttributeType: 'S',
      },
    ],
    KeySchema: [
      {
        AttributeName: 'email1',
        KeyType: 'HASH',
      }, // Partition key
      {
        AttributeName: 'timestamp',
        KeyType: 'RANGE',
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10,
    },
    TableName: TABLE.MEETINGS.dev,
  };
  await dbWrapper.createTable(meetingTableParams);

  // wait for db setup to finish
  await delay(DB_SETUP_WAIT_TIME_MS);

  const batchWriteParams = {
    RequestItems: {
      [TABLE.USERS.dev]: [
        getUserTablePutRequestItem('sakibulmowla@gmail.com', 'Sakibul', 'Mowla'),
        getUserTablePutRequestItem('masum.nayeem@gmail.com', 'Kazi', 'Nayeem'),
        getUserTablePutRequestItem('biswajit.sust@gmail.com', 'Biswajit', 'Debnath'),
      ],
    },
  };
  await dbWrapper.batchWriteItem(batchWriteParams);
}, JEST_DEFAULT_TIMEOUT_MS + DB_SETUP_WAIT_TIME_MS);

afterAll(async () => {
  const userTableParams = {
    TableName: TABLE.USERS.dev,
  };
  await dbWrapper.deleteTable(userTableParams);

  const meetingTableParams = {
    TableName: TABLE.MEETINGS.dev,
  };
  await dbWrapper.deleteTable(meetingTableParams);

  // wait for db deletion to finish
  await delay(DB_SETUP_WAIT_TIME_MS);
}, JEST_DEFAULT_TIMEOUT_MS + DB_SETUP_WAIT_TIME_MS);

test('user with latemost recent meeting should be priotitized', async () => {
  const dec31st2021DateString = new Date(2021, 12, 31).toISOString();
  const dec21st2021DateString = new Date(2021, 12, 21).toISOString();

  const batchWriteParamsForPutting = {
    RequestItems: {
      [TABLE.MEETINGS.dev]: [
        getMeetingsTablePutRequestItem('masum.nayeem@gmail.com', 'biswajit.sust@gmail.com', dec31st2021DateString),
        getMeetingsTablePutRequestItem('biswajit.sust@gmail.com', 'masum.nayeem@gmail.com', dec31st2021DateString),
        getMeetingsTablePutRequestItem('sakibulmowla@gmail.com', 'biswajit.sust@gmail.com', dec21st2021DateString),
        getMeetingsTablePutRequestItem('biswajit.sust@gmail.com', 'sakibulmowla@gmail.com', dec21st2021DateString),
      ],
    },
  };
  await dbWrapper.batchWriteItem(batchWriteParamsForPutting);

  const scanParams = {
    ProjectionExpression: 'email, firstname, lastname',
    TableName: TABLE.USERS.dev,
  };

  const allUsers = await dbWrapper.scan(scanParams);
  console.log('allUsers = ', JSON.stringify(allUsers, null, 2));

  const userPrioritizer = new UserPrioritizer('dev');
  const orderedUserList = await userPrioritizer.getOrderedListOfUsers(allUsers);
  const matcher = new Matcher('dev');

  const preferenceListOfSakibul = await matcher.getPreferenceList(
    {
      email: 'sakibulmowla@gmail.com',
      firstname: 'Sakibul',
      lastname: 'Mowla',
      timestamp: dec21st2021DateString,
    },
    orderedUserList,
  );
  expect(preferenceListOfSakibul).toStrictEqual([
    'masum.nayeem@gmail.com',
    'biswajit.sust@gmail.com',
  ]);

  const preferenceListOfBiswajit = await matcher.getPreferenceList(
    {
      email: 'biswajit.sust@gmail.com',
      firstname: 'Biswajit',
      lastname: 'Debnath',
      timestamp: dec31st2021DateString,
    },
    orderedUserList,
  );
  expect(preferenceListOfBiswajit).toStrictEqual([
    'sakibulmowla@gmail.com',
    'masum.nayeem@gmail.com',
  ]);

  const matchedGroups = await matcher.getMatchedGroups(orderedUserList);
  expect(matchedGroups).toStrictEqual([
    [
      'sakibulmowla@gmail.com',
      'masum.nayeem@gmail.com',
    ],
  ]);
});
