require('dotenv').config();
const { Chance } = require('chance');
const path = require('path');
const given = require('../../steps/given');
const when = require('../../steps/when');
const then = require('../../steps/then');

describe('Given an authenticated user', () => {
  let user;
  let profile;

  beforeAll(async () => {
    user = await given.an_authenticated_user();
    profile = await when.a_user_calls_getMyProfile(user);
  });

  it('The user can fetch his profile with getMyProfile', async () => {
    expect(profile).toMatchObject({
      id: user.username,
      name: user.name,
      imageUrl: null,
      backgroundImageUrl: null,
      bio: null,
      location: null,
      website: null,
      birthdate: null,
      createdAt: expect.stringMatching(
        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g,
      ),
      followersCount: 0,
      followingCount: 0,
      tweetsCount: 0,
      likesCount: 0,
    });

    const [firstName, lastName] = profile.name.split(' ');

    expect(profile.screenName).toContain(firstName);
    expect(profile.screenName).toContain(lastName);
  });

  it('The user can get an URL to upload a new profile image', async () => {
    const uploadUrl = await when.a_user_calls_getImageUploadUrl(
      user,
      '.png',
      'image/png',
    );
    const bucketName = process.env.BUCKET_NAME;
    const regex = new RegExp(
      `https://${bucketName}.s3-accelerate.amazonaws.com/${
        user.username
      }/.*.png\?.*Content-Type=${encodeURIComponent('image/png')}.*`,
    );

    expect(uploadUrl).toMatch(regex);

    const filePath = path.join(__dirname, '../../data/avatar.png');

    await then.user_can_upload_image_to_url(uploadUrl, filePath, 'image/png');

    const [downloadUrl] = uploadUrl.split('?');

    await then.user_can_download_image_from(downloadUrl);
  });

  it('The user can edit their profile with editMyProfile', async () => {
    const newName = new Chance().first();
    const input = {
      name: newName,
    };
    const newProfile = await when.a_user_calls_editMyProfile(user, input);

    expect(newProfile).toMatchObject({
      ...profile,
      name: newName,
    });

    const [firstName, lastName] = profile.name.split(' ');

    expect(profile.screenName).toContain(firstName);
    expect(profile.screenName).toContain(lastName);
  });
});
