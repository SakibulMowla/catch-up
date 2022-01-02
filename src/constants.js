const ADMIN = {
  EMAIL: 'sakibulmowla@gmail.com',
  FULLNAME: 'Catchup Admin',
};

const DYNAMODB = {
  ENDPOINT: 'https://dynamodb.us-west-2.amazonaws.com',
  REGION: 'us-west-2',
};

const TABLE = {
  MEETINGS: {
    dev: 'devcatchupmeetings',
    prod: 'catchupmeetings',
  },
  USERS: {
    dev: 'devcatchupusers',
    prod: 'catchupusers',
  },
};

module.exports = {
  ADMIN,
  DB_SETUP_WAIT_TIME_MS: 5 * 1000,
  DYNAMODB,
  JEST_DEFAULT_TIMEOUT_MS: 5000,
  TABLE,
};
