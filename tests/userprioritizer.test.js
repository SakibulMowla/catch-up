const { JEST_DEFAULT_TIMEOUT_MS, DB_SETUP_WAIT_TIME_MS } = require('../src/constants');
const DBWrapper = require('../src/dbwrapper');
const delay = require('../src/utility');
const UserPrioritizer = require('../src/userprioritizer');

const dbWrapper = new DBWrapper();
const userPrioritizer = new UserPrioritizer();

const UserTable = 'devcatchupusers';
const MeetingTable = 'devcatchupmeetings';

beforeAll(async () => {
  const userTableParams = {
    TableName: UserTable,
    KeySchema: [
      { AttributeName: 'email', KeyType: 'HASH' }, // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'email', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10,
    },
  };
  await dbWrapper.createTable(userTableParams);

  const meetingTableParams = {
    TableName: MeetingTable,
    KeySchema: [
      { AttributeName: 'email1', KeyType: 'HASH' }, // Partition key
      { AttributeName: 'timestamp', KeyType: 'RANGE' }, // //Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: 'email1', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10,
    },
  };
  await dbWrapper.createTable(meetingTableParams);

  // wait for db setup to finish
  await delay(DB_SETUP_WAIT_TIME_MS);

  const batchWriteParams = {
    RequestItems: {
      devcatchupusers: [
        {
          PutRequest: {
            Item: {
              KEY: { S: 'email' },
              email: { S: 'sakibulmowla@gmail.com' },
              firstname: { S: 'Sakibul' },
              lastname: { S: 'Mowla' },
            },
          },
        },
        {
          PutRequest: {
            Item: {
              KEY: { S: 'email' },
              email: { S: 'masum.nayeem@gmail.com' },
              firstname: { S: 'Kazi' },
              lastname: { S: 'Nayeem' },
            },
          },
        },
        {
          PutRequest: {
            Item: {
              KEY: { S: 'email' },
              email: { S: 'biswajit.sust@gmail.com' },
              firstname: { S: 'Biswajit' },
              lastname: { S: 'Debnath' },
            },
          },
        },
      ],
    },
  };
  await dbWrapper.batchWriteItem(batchWriteParams);
}, JEST_DEFAULT_TIMEOUT_MS + DB_SETUP_WAIT_TIME_MS);

afterAll(async () => {
  const userTableParams = {
    TableName: UserTable,
  };
  await dbWrapper.deleteTable(userTableParams);

  const meetingTableParams = {
    TableName: MeetingTable,
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
      devcatchupmeetings: [
        {
          PutRequest: {
            Item: {
              KEY: { S: 'email1' },
              email1: { S: 'sakibulmowla@gmail.com' },
              email2: { S: 'biswajit.sust@gmail.com' },
              timestamp: { S: dec31st2021DateString },
            },
          },
        },
        {
          PutRequest: {
            Item: {
              KEY: { S: 'email1' },
              email1: { S: 'biswajit.sust@gmail.com' },
              email2: { S: 'sakibulmowla@gmail.com' },
              timestamp: { S: dec21st2021DateString },
            },
          },
        },
      ],
    },
  };
  await dbWrapper.batchWriteItem(batchWriteParamsForPutting);

  const orderedUserList = await userPrioritizer.getOrderedListOfUsers('dev');

  expect(orderedUserList.length).toBe(3);
  expect(orderedUserList[0].email).toBe('masum.nayeem@gmail.com');
});

test('users should be prioritized in latemost last meeting order', async () => {
  const dec22nd2021DateString = new Date(2021, 12, 22).toISOString();
  const dec11th2021DateString = new Date(2021, 12, 11).toISOString();
  const batchWriteParamsForPutting = {
    RequestItems: {
      devcatchupmeetings: [
        {
          PutRequest: {
            Item: {
              KEY: { S: 'email1' },
              email1: { S: 'masum.nayeem@gmail.com' },
              email2: { S: 'sakibulmowla@gmail.com' },
              timestamp: { S: dec22nd2021DateString },
            },
          },
        },
        {
          PutRequest: {
            Item: {
              KEY: { S: 'email1' },
              email1: { S: 'sakibulmowla@gmail.com' },
              email2: { S: 'biswajit.sust@gmail.com' },
              timestamp: { S: dec11th2021DateString },
            },
          },
        },
      ],
    },
  };
  await dbWrapper.batchWriteItem(batchWriteParamsForPutting);

  const orderedUserList = await userPrioritizer.getOrderedListOfUsers('dev');

  expect(orderedUserList.length).toBe(3);
  expect(orderedUserList[0].email).toBe('biswajit.sust@gmail.com');
  expect(orderedUserList[1].email).toBe('masum.nayeem@gmail.com');
  expect(orderedUserList[2].email).toBe('sakibulmowla@gmail.com');
});
