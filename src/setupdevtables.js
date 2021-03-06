const { DB_SETUP_WAIT_TIME_MS, TABLE } = require('./constants');
const DBWrapper = require('./dbwrapper');
const { delay, getUserTablePutRequestItem } = require('./utility');

const dbWrapper = new DBWrapper();

async function setupdevtables() {
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
  try {
    await dbWrapper.createTable(userTableParams);
  } catch (error) {
    console.error('Error = ', error);
  }

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
  try {
    await dbWrapper.createTable(meetingTableParams);
  } catch (error) {
    console.error('Error = ', error);
  }

  // wait for db setup to finish
  await delay(DB_SETUP_WAIT_TIME_MS);

  const batchWriteParams = {
    RequestItems: {
      [TABLE.USERS.dev]: [
        getUserTablePutRequestItem('sakibulmowla@gmail.com', 'Sakibul', 'Mowla'),
        getUserTablePutRequestItem('sakibul_mowla@yahoo.com', 'Another', 'Sakib'),
      ],
    },
  };
  try {
    await dbWrapper.batchWriteItem(batchWriteParams);
  } catch (error) {
    console.error('Error = ', error);
  }
}

setupdevtables();
