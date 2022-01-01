module.exports = {
  ADMIN: {
    EMAIL: 'sakibulmowla@gmail.com',
    FULLNAME: 'Catchup Admin',
  },
  DB_SETUP_WAIT_TIME_MS: 10 * 1000,
  JEST_DEFAULT_TIMEOUT_MS: 5000,
  TABLE: {
    MEETINGS: {
      dev: 'devcatchupmeetings',
      prod: 'catchupmeetings',
    },
    USERS: {
      dev: 'devcatchupusers',
      prod: 'catchupusers',
    },
  },
};
