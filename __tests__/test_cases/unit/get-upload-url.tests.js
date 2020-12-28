require('dotenv').config();
const when = require('../../steps/when');
const chance = require('chance');

describe('When getImageUrl runs', () => {
  it.each([
    ['.png', 'image/png'],
    ['.jpeg', 'image/jpeg'],
    ['.png', null],
    ['.jpeg', null],
    [null, 'image/png'],
    [null, 'image/jpeg'],
  ])(
    'Returns a signed S3 url for extension [%s] and content type [%s]',
    async (extension, contentType) => {
      const username = chance.Chance().guid();
      const signerUrl = await when.we_invoke_getImageUploadUrl(
        username,
        extension,
        contentType,
      );

      const { BUCKET_NAME } = process.env;
      const regEx = new RegExp(
        `https://${BUCKET_NAME}.s3-accelerate.amazonaws.com/${username}/.*${
          extension || ''
        }\?.*Content-Type=${encodeURIComponent(contentType || 'image/jpeg')}.*`,
      );

      expect(signerUrl).toMatch(regEx);
    },
  );

  it;
});
