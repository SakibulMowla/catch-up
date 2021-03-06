const { JEST_DEFAULT_TIMEOUT_MS, DB_SETUP_WAIT_TIME_MS, TABLE } = require('../src/constants');
const DBWrapper = require('../src/dbwrapper');
const { delay, getMeetingsTablePutRequestItem, getUserTablePutRequestItem } = require('../src/utility');
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

test('user with no previous meeting should be on top of priority list', async () => {
  const dec31st2021DateString = new Date(2021, 12, 31).toISOString();
  const dec21st2021DateString = new Date(2021, 12, 21).toISOString();
  const batchWriteParamsForPutting = {
    RequestItems: {
      [TABLE.MEETINGS.dev]: [
        getMeetingsTablePutRequestItem('sakibulmowla@gmail.com', 'biswajit.sust@gmail.com', dec31st2021DateString),
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

  expect(orderedUserList.length).toBe(3);
  expect(orderedUserList[0].email).toBe('masum.nayeem@gmail.com');
});

test('users should be prioritized in latemost last meeting order', async () => {
  const dec22nd2021DateString = new Date(2021, 12, 22).toISOString();
  const dec11th2021DateString = new Date(2021, 12, 11).toISOString();
  const batchWriteParamsForPutting = {
    RequestItems: {
      [TABLE.MEETINGS.dev]: [
        getMeetingsTablePutRequestItem('masum.nayeem@gmail.com', 'sakibulmowla@gmail.com', dec22nd2021DateString),
        getMeetingsTablePutRequestItem('sakibulmowla@gmail.com', 'biswajit.sust@gmail.com', dec11th2021DateString),
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

  expect(orderedUserList.length).toBe(3);
  expect(orderedUserList[0].email).toBe('biswajit.sust@gmail.com');
  expect(orderedUserList[1].email).toBe('masum.nayeem@gmail.com');
  expect(orderedUserList[2].email).toBe('sakibulmowla@gmail.com');
});
