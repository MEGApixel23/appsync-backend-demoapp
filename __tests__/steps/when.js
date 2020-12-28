require('dotenv').config();
const fs = require('fs');
const AWS = require('aws-sdk');
const velocityTemplate = require('amplify-velocity-template');
const velocityMapper = require('amplify-appsync-simulator/lib/velocity/value-mapper/mapper');
const GraphQL = require('../lib/GraphQL');

const we_invoke_confirmUserSignup = async (username, name, email) => {
  const handler = require('../../functions/confirm-user-signup').handler;
  const context = {};
  const event = {
    version: '1',
    region: process.env.AWS_REGION,
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    userName: username,
    triggerSource: 'PostConfirmation_ConfirmSignUp',
    request: {
      userAttributes: {
        sub: username,
        'cognito:email_alias': email,
        'cognito:user_status': 'CONFIRMED',
        email_verified: 'false',
        name,
        email,
      },
    },
    response: {},
  };

  await handler(event, context);
};

const a_user_signs_up = async (password, name, email) => {
  const cognito = new AWS.CognitoIdentityServiceProvider();
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.WEB_COGNITO_USER_POOL_CLIEND_ID;

  const signUpResponse = await cognito
    .signUp({
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: 'name', Value: name }],
    })
    .promise();

  const username = signUpResponse.UserSub;

  console.debug(`[${email}] - user has signed up [${username}]`);

  await cognito
    .adminConfirmSignUp({
      UserPoolId: userPoolId,
      Username: username,
    })
    .promise();

  console.debug(`[${email}] - confirmed sign up`);

  return {
    username,
    name,
    email,
  };
};

const we_invoke_an_appsync_template = (templatePath, context) => {
  const template = fs.readFileSync(templatePath, { encoding: 'utf-8' });
  const ast = velocityTemplate.parse(template);
  const compiler = new velocityTemplate.Compile(ast, {
    valueMapper: velocityMapper.map,
    escape: false,
  });

  return JSON.parse(compiler.render(context));
};

const a_user_calls_getMyProfile = async (user) => {
  const getMyProfileQuery = `
    query getMyProfile {
      getMyProfile {
        backgroundImageUrl
        bio
        createdAt
        followersCount
        birthdate
        followingCount
        id
        imageUrl
        likesCount
        location
        name
        screenName
        tweetsCount
        website
      }
    }
  `;

  const data = await GraphQL.request(
    process.env.API_URL,
    getMyProfileQuery,
    {},
    user.accessToken,
  );
  const profile = data.getMyProfile;

  console.debug(`[${user.username}] - fetched a profile`);

  return profile;
};

const a_user_calls_editMyProfile = async (user, input) => {
  const editMyProfileMutation = `
    mutation editMyProfile($input: ProfileInput!) {
      editMyProfile(newProfile: $input) {
        backgroundImageUrl
        bio
        createdAt
        followersCount
        birthdate
        followingCount
        id
        imageUrl
        likesCount
        location
        name
        screenName
        tweetsCount
        website
      }
    }
  `;
  const variables = { input };
  const data = await GraphQL.request(
    process.env.API_URL,
    editMyProfileMutation,
    variables,
    user.accessToken,
  );
  const profile = data.editMyProfile;

  console.debug(`[${user.username}] - edited a profile`);

  return profile;
};

const a_user_calls_getImageUploadUrl = async (user, extension, contentType) => {
  const editMyProfileMutation = `
    query getImageUploadUrl($extension: String!, $contentType: String!) {
      getImageUploadUrl(extension: $extension, contentType: $contentType)
    }
  `;
  const variables = { extension, contentType };
  const data = await GraphQL.request(
    process.env.API_URL,
    editMyProfileMutation,
    variables,
    user.accessToken,
  );
  const url = data.getImageUploadUrl;

  console.debug(`[${user.username}] - got image upload url`);

  return url;
};

const we_invoke_getImageUploadUrl = async (
  username,
  extension,
  contentType,
) => {
  const handler = require('../../functions/get-upload-url').handler;
  const context = {};
  const event = {
    identity: {
      username,
    },
    arguments: {
      extension,
      contentType,
    },
  };

  return handler(event, context);
};

module.exports = {
  we_invoke_confirmUserSignup,
  a_user_signs_up,
  we_invoke_an_appsync_template,
  a_user_calls_getMyProfile,
  a_user_calls_editMyProfile,
  we_invoke_getImageUploadUrl,
  a_user_calls_getImageUploadUrl,
};
