require('dotenv').config();
const AWS = require('aws-sdk');
const axios = require('axios');
const fs = require('fs');

const user_exists_in_UsersTable = async ({ id }) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient();

  console.debug(
    `looking for user [${id}] in table [${process.env.USERS_TABLE}]`,
  );

  const response = await DynamoDB.get({
    TableName: process.env.USERS_TABLE,
    Key: {
      id,
    },
  }).promise();

  expect(response.Item).toBeTruthy();

  return response.Item;
};

const user_can_upload_image_to_url = async (url, filePath, contentType) => {
  const data = fs.readFileSync(filePath);
  await axios.put(url, data, { headers: { 'Content-Type': contentType } });

  console.debug('uploaded image to', url);
};

const user_can_download_image_from = async (url) => {
  const { data } = await axios.get(url);

  console.debug('downloaded image to', url);

  return data;
};

module.exports = {
  user_exists_in_UsersTable,
  user_can_upload_image_to_url,
  user_can_download_image_from,
};
