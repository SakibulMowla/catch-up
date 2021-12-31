const { JEST_DEFAULT_TIMEOUT_MS, DB_SETUP_WAIT_TIME_MS } = require('../src/constants');
const DBWrapper = require('../src/dbwrapper');
const delay = require('../src/utility');
const Matcher = require('../src/matcher');
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

test('xxxxxxxs', async () => {
  const dec31st2021DateString = new Date(2021, 12, 31).toISOString();
  const dec21st2021DateString = new Date(2021, 12, 21).toISOString();

  const batchWriteParamsForPutting = {
    RequestItems: {
      devcatchupmeetings: [
        {
          PutRequest: {
            Item: {
              KEY: { S: 'email1' },
              email1: { S: 'masum.nayeem@gmail.com' },
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
              email2: { S: 'masum.nayeem@gmail.com' },
              timestamp: { S: dec31st2021DateString },
            },
          },
        },
        {
          PutRequest: {
            Item: {
              KEY: { S: 'email1' },
              email1: { S: 'sakibulmowla@gmail.com' },
              email2: { S: 'biswajit.sust@gmail.com' },
              timestamp: { S: dec21st2021DateString },
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
  const matcher = new Matcher(orderedUserList);

  const preferenceListOfSakibul = await matcher.getPreferenceList(
    {
      firstname: 'Sakibul',
      lastname: 'Mowla',
      email: 'sakibulmowla@gmail.com',
      timestamp: dec21st2021DateString,
    },
    'dev',
  );
  expect(preferenceListOfSakibul).toStrictEqual([
    'masum.nayeem@gmail.com',
    'biswajit.sust@gmail.com',
  ]);

  const preferenceListOfBiswajit = await matcher.getPreferenceList(
    {
      firstname: 'Biswajit',
      lastname: 'Debnath',
      email: 'biswajit.sust@gmail.com',
      timestamp: dec31st2021DateString,
    },
    'dev',
  );
  expect(preferenceListOfBiswajit).toStrictEqual([
    'sakibulmowla@gmail.com',
    'masum.nayeem@gmail.com',
  ]);

  const matchedGroups = await matcher.getMatchedGroups('dev');
  expect(matchedGroups).toStrictEqual([
    [
      'sakibulmowla@gmail.com',
      'masum.nayeem@gmail.com',
    ],
  ]);
});
