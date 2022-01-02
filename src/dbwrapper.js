const AWS = require('aws-sdk');
const { DYNAMODB } = require('./constants');

AWS.config.update({
  endpoint: DYNAMODB.ENDPOINT,
  region: DYNAMODB.REGION,
});

class DBWrapper {
  constructor() {
    this.dynamodb = new AWS.DynamoDB();
    this.docClient = new AWS.DynamoDB.DocumentClient();
  }

  async createTable(params) {
    try {
      const response = await this.dynamodb.createTable(params).promise();
      console.log('createTable response = ', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error(`Error in createTable. params = ${JSON.stringify(params, null, 2)}, error = ${error}`);
      throw error;
    }
  }

  async batchWriteItem(params) {
    try {
      const response = await this.dynamodb.batchWriteItem(params).promise();
      console.log('batchWriteItem response = ', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error(`Error in batchWriteItem. params = ${JSON.stringify(params, null, 2)}, error = ${error}`);
      throw error;
    }
  }

  async scan(params) {
    try {
      const response = await this.docClient.scan(params).promise();
      console.log('scan response = ', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error(`Error in scan. params = ${JSON.stringify(params, null, 2)}, error = ${error}`);
      throw error;
    }
  }

  async query(params) {
    try {
      const response = await this.dynamodb.query(params).promise();
      console.log('query response = ', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error(`Error in query. params = ${JSON.stringify(params, null, 2)}, error = ${error}`);
      throw error;
    }
  }

  async deleteTable(params) {
    try {
      const response = await this.dynamodb.deleteTable(params).promise();
      console.log('deleteTable response = ', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error(`Error in deleteTable. params = ${JSON.stringify(params, null, 2)}, error = ${error}`);
      throw error;
    }
  }
}

module.exports = DBWrapper;
