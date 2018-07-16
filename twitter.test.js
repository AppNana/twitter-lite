require("dotenv").config();
const Twitter = require("./twitter");

const {
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  ACCESS_TOKEN,
  ACCESS_TOKEN_SECRET
} = process.env;

function newClient(subdomain = "api") {
  return new Twitter({
    subdomain,
    consumer_key: TWITTER_CONSUMER_KEY,
    consumer_secret: TWITTER_CONSUMER_SECRET,
    access_token_key: ACCESS_TOKEN,
    access_token_secret: ACCESS_TOKEN_SECRET
  });
}

describe("core", () => {
  it("should default export to be a function", () => {
    expect(new Twitter()).toBeInstanceOf(Twitter);
  });

  it("should return the API URL", () => {
    expect(new Twitter().url).toEqual("https://api.twitter.com/1.1");
  });

  it("should return a stream API URL", () => {
    const options = { subdomain: "stream" };
    expect(new Twitter(options).url).toEqual("https://stream.twitter.com/1.1");
  });
});

describe("auth", () => {
  it("should fail on invalid access_token_secret", async () => {
    const client = new Twitter({
      subdomain: "api",
      consumer_key: TWITTER_CONSUMER_KEY,
      consumer_secret: TWITTER_CONSUMER_SECRET,
      access_token_key: ACCESS_TOKEN,
      access_token_secret: "xyz"
    });

    const results = await client.get("account/verify_credentials");
    expect(results).toEqual({
      errors: [{ code: 32, message: "Could not authenticate you." }]
    });
  });

  it("should fail on invalid or expired token", async () => {
    const client = new Twitter({
      subdomain: "api",
      consumer_key: "xyz",
      consumer_secret: "xyz",
      access_token_key: "xyz",
      access_token_secret: "xyz"
    });

    const results = await client.get("account/verify_credentials");
    expect(results).toEqual({
      errors: [{ code: 89, message: "Invalid or expired token." }]
    });
  });

  it("should verify credentials with correct tokens", async () => {
    const client = newClient();

    const response = await client.get("account/verify_credentials");
    expect(response).toMatchObject({
      created_at: "Wed Mar 14 21:17:37 +0000 2018",
      name: "Nodejs Testing Account",
      lang: "en",
      screen_name: "nodejs_lite",
      description: "Twitter Lite Testing Account"
    });
  });
});

describe("misc", () => {
  let client;
  beforeAll(() => (client = newClient()));

  it("should show 2 favorited tweets", async () => {
    const response = await client.get("favorites/list");
    const [first, second] = response;

    const results = [
      {
        id: first.id
      },
      {
        id: second.id
      }
    ];

    expect(results).toEqual([
      {
        id: 973775515453722600
      },
      {
        id: 972868365898334200
      }
    ]);
  });

  it("should fail to follow unspecified user", async () => {
    const response = await client.post("friendships/create");
    expect(response).toEqual({
      errors: [
        {
          code: 108,
          message: "Cannot find specified user."
        }
      ]
    });
  });

  it("should follow user", async () => {
    // This is counter-intuitive - see https://github.com/Preposterous/twitter-lite/issues/15#issuecomment-402902433
    const response = await client.post("friendships/create", null, {
      screen_name: "dandv"
    });
    expect(response).toMatchObject({
      name: "Dan Dascalescu"
    });
  });

  it("should unfollow user", async () => {
    // This is counter-intuitive - see above
    const response = await client.post("friendships/destroy", null, {
      user_id: "15008676"
    });
    expect(response).toMatchObject({
      name: "Dan Dascalescu"
    });
  });

  it("should DM user", async () => {
    const randomString = Math.random()
      .toString(36)
      .substr(2, 11);

    // POST with body and no parameters per https://developer.twitter.com/en/docs/direct-messages/sending-and-receiving/guides/direct-message-migration.html
    const response = await client.post("direct_messages/events/new", {
      event: {
        type: "message_create",
        message_create: {
          target: {
            recipient_id: "50426068"
          },
          message_data: {
            text: randomString
          }
        }
      }
    });
    expect(response).toMatchObject({
      event: {
        type: "message_create",
        id: expect.stringMatching(/^\d+$/),
        created_timestamp: expect.any(String),
        message_create: {
          message_data: {
            text: randomString
          }
        }
      }
    });
  });

  it("should get details about 100 users with 18-character ids", async () => {
    // https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-users-lookup
    // says to use POST (and presumably put the request in the body) but that
    // returns an error that no users were found. Test that GET does work.
    const client = newClient();
    const users = await client.get("users/lookup", {
      user_id: [...Array(99).fill("928759224599040001"), "711030662728437760"]
    });
    expect(users).toHaveLength(2);
  });
});
