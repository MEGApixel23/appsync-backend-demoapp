require('dotenv').config();

const AWS = require('aws-sdk');

const user_exists_in_UsersTable = async ({ id }) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient();

  console.debug(`looking for user [${id}] in table [${process.env.USERS_TABLE}]`);

  const response = await DynamoDB.get({
    TableName: process.env.USERS_TABLE,
    Key: {
      id
    }
  }).promise();

  expect(response.Item).toBeTruthy();

  return response.Item;
};

module.exports = {
  user_exists_in_UsersTable,
};