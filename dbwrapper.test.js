const { JEST_DEFAULT_TIMEOUT_MS, DB_SETUP_WAIT_TIME_MS } = require('./constants');
const DBWrapper = require('./dbwrapper');
const delay = require('./library');

const dbWrapper = new DBWrapper();

test('create devcatchupusers table', async () => {
  const table = 'devcatchupusers';
  const params = {
    TableName: table,
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
  const response = await dbWrapper.createTable(params);
  expect(response.TableDescription.TableName).toBe(table);
  expect(response.TableDescription.TableStatus).toBe('CREATING');
});

test('put elements in devcatchupusers table', async () => {
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
      ],
    },
  };
  await dbWrapper.batchWriteItem(batchWriteParams);

  const scanParams = {
    TableName: 'devcatchupusers',
    ProjectionExpression: 'email, firstname, lastname',
  };
  const response = await dbWrapper.scan(scanParams);

  expect(response.Count).toBe(2);
}, JEST_DEFAULT_TIMEOUT_MS + DB_SETUP_WAIT_TIME_MS);

test('query devcatchupusers table', async () => {
  const table = 'devcatchupusers';
  const params = {
    ExpressionAttributeValues: {
      ':email': { S: 'sakibulmowla@gmail.com' },
    },
    KeyConditionExpression: 'email = :email',
    ProjectionExpression: 'firstname',
    TableName: table,
  };
  const response = await dbWrapper.query(params);
  expect(response.Count).toBe(1);
});

test('delete devcatchupusers table', async () => {
  const table = 'devcatchupusers';
  const params = {
    TableName: table,
  };
  const response = await dbWrapper.deleteTable(params);
  expect(response.TableDescription.TableName).toBe(table);
  expect(response.TableDescription.TableStatus).toBe('DELETING');

  // wait for db deletion to finish
  await delay(DB_SETUP_WAIT_TIME_MS);
}, JEST_DEFAULT_TIMEOUT_MS + DB_SETUP_WAIT_TIME_MS);
