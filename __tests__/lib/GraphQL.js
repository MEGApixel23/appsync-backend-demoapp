const axios = require('axios');
const { get } = require('lodash');

const throwOnErrors = ({ query, variables, errors }) => {
  if (errors) {
    const errorMessage = `
      query: ${query.substr(0, 100)}
      
      variables: ${JSON.stringify(variables, null, 2)}
      
      error: ${JSON.stringify(errors, null, 2)}
    `;

    throw new Error(errorMessage);
  }
};

const request = async (url, query, variables = {}, auth) => {
  const headers = {};

  if (auth) {
    headers.Authorization = auth;
  }

  try {
    const response = await axios({
      method: 'POST',
      url,
      headers,
      data: {
        query,
        variables: JSON.stringify(variables),
      },
    });
    const { data, errors } = response.data;

    throwOnErrors({ query, variables, errors });

    return data;
  } catch (error) {
    const errors = get(error, 'response.data.errors');

    throwOnErrors({ query, variables, errors });

    throw error;
  }
};

module.exports = {
  request,
};
