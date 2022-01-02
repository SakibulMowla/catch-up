// eslint-disable-next-line no-promise-executor-return
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getUserTablePutRequestItem = (email, firstname, lastname) => ({
  PutRequest: {
    Item: {
      KEY: { S: 'email' },
      email: { S: email },
      firstname: { S: firstname },
      lastname: { S: lastname },
    },
  },
});

const getMeetingsTablePutRequestItem = (email1, email2, timestamp) => ({
  PutRequest: {
    Item: {
      KEY: { S: 'email1' },
      email1: { S: email1 },
      email2: { S: email2 },
      timestamp: { S: timestamp },
    },
  },
});

module.exports = { delay, getMeetingsTablePutRequestItem, getUserTablePutRequestItem };
