const DBWrapper = require('./dbwrapper');

const dbWrapper = new DBWrapper();

// eslint-disable-next-line no-promise-executor-return
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  await delay(60 * 1000);

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
}, 5000 + 60 * 1000);

test('delete devcatchupusers table', async () => {
  const table = 'devcatchupusers';
  const params = {
    TableName: table,
  };
  const response = await dbWrapper.deleteTable(params);
  expect(response.TableDescription.TableName).toBe(table);
  expect(response.TableDescription.TableStatus).toBe('DELETING');
});
