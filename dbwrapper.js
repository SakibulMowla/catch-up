const AWS = require('aws-sdk');

AWS.config.update({
  region: 'us-west-2',
  endpoint: 'https://dynamodb.us-west-2.amazonaws.com',
});

class DBWrapper {
  constructor() {
    this.dynamodb = new AWS.DynamoDB();
    this.docClient = new AWS.DynamoDB.DocumentClient();
  }

  async createTable(params) {
    const response = await this.dynamodb.createTable(params).promise();
    console.log('createTable response = ', JSON.stringify(response, null, 2));
    return response;
  }

  async batchWriteItem(params) {
    const response = await this.dynamodb.batchWriteItem(params).promise();
    console.log('batchWriteItem response = ', JSON.stringify(response, null, 2));
    return response;
  }

  async scan(params) {
    const response = await this.docClient.scan(params).promise();
    console.log('scan response = ', JSON.stringify(response, null, 2));
    return response;
  }

  async query(params) {
    const response = await this.dynamodb.query(params).promise();
    console.log('query response = ', JSON.stringify(response, null, 2));
    return response;
  }

  async deleteTable(params) {
    const response = await this.dynamodb.deleteTable(params).promise();
    console.log('deleteTable response = ', JSON.stringify(response, null, 2));
    return response;
  }
}

module.exports = DBWrapper;
