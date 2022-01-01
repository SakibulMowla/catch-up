const { JEST_DEFAULT_TIMEOUT_MS, DB_SETUP_WAIT_TIME_MS, TABLE } = require('../src/constants');
const DBWrapper = require('../src/dbwrapper');
const delay = require('../src/utility');

const dbWrapper = new DBWrapper();

test('create devcatchupusers table', async () => {
  const params = {
    AttributeDefinitions: [
      { AttributeName: 'email', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'email', KeyType: 'HASH' }, // Partition key
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10,
    },
    TableName: TABLE.USERS.dev,
  };
  const response = await dbWrapper.createTable(params);
  expect(response.TableDescription.TableName).toBe(TABLE.USERS.dev);
  expect(response.TableDescription.TableStatus).toBe('CREATING');
});

test('put elements in devcatchupusers table', async () => {
  // wait for db setup to finish
  await delay(DB_SETUP_WAIT_TIME_MS);

  const batchWriteParams = {
    RequestItems: {
      [TABLE.USERS.dev]: [
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
      ],
    },
  };
  await dbWrapper.batchWriteItem(batchWriteParams);

  const scanParams = {
    ProjectionExpression: 'email, firstname, lastname',
    TableName: TABLE.USERS.dev,
  };
  const response = await dbWrapper.scan(scanParams);

  expect(response.Count).toBe(2);
}, JEST_DEFAULT_TIMEOUT_MS + DB_SETUP_WAIT_TIME_MS);

test('query devcatchupusers table', async () => {
  const params = {
    ExpressionAttributeValues: {
      ':email': { S: 'sakibulmowla@gmail.com' },
    },
    KeyConditionExpression: 'email = :email',
    ProjectionExpression: 'firstname',
    TableName: TABLE.USERS.dev,
  };
  const response = await dbWrapper.query(params);
  expect(response.Count).toBe(1);
});

test('delete devcatchupusers table', async () => {
  const params = {
    TableName: TABLE.USERS.dev,
  };
  const response = await dbWrapper.deleteTable(params);
  expect(response.TableDescription.TableName).toBe(TABLE.USERS.dev);
  expect(response.TableDescription.TableStatus).toBe('DELETING');

  // wait for db deletion to finish
  await delay(DB_SETUP_WAIT_TIME_S);
}, JEST_DEFAULT_TIMEOUT_MS + DB_SETUP_WAIT_TIME_MS);
