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
  DB_SETUP_WAIT_TIME_MS: 10 * 1000,
  DYNAMODB,
  JEST_DEFAULT_TIMEOUT_MS: 5000,
  MJ_API_URL: 'https://api.mailjet.com/v3.1/',
  TABLE,
};
