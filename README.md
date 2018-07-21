# Twitter Lite

A tiny, full-featured, modern client / server library for the [Twitter API](https://developer.twitter.com/en/docs/basics/things-every-developer-should-know).

[![npm](https://img.shields.io/npm/v/twitter-lite.svg)](https://npm.im/twitter-lite) [![travis](https://travis-ci.org/Preposterous/twitter-lite.svg?branch=master)](https://travis-ci.org/Preposterous/twitter-lite)

## Features

- Promise driven via Async / Await
- Both REST and Stream support
- Works both in Node and in browsers
- Up-to-date APIs
- Under 1kb
- Minimal dependencies
- Test suite

## Why

We have built this library because existing ones [have not been recently maintained](https://github.com/desmondmorris/node-twitter), or depend on [outdated](https://github.com/ttezel/twit/issues/411) [libraries](https://github.com/ttezel/twit/issues/412).

## Installation

```sh
yarn add twitter-lite
```

```sh
npm install twitter-lite
```

## Usage

- Create an app on [https://apps.twitter.com/](https://apps.twitter.com)
- Grab the Consumer Key (API Key) and Consumer Secret (API Secret) from Keys and Access Tokens
- Make sure you set the right access level for your app
- If you want to use user-based authentication, grab the access token key and secret as well

### App vs. User authentication

Twitter has two different authentication options:

- App: higher rate limits. Great for building your own Twitter App.
- User: lower rate limits. Great for making requests on behalf of a User.

**User** authentication requires:

- `consumer_key`
- `consumer_secret`
- `access_token_key`
- `access_token_secret`

**App** authentication requires:

- `bearer_token`

App authentication is a simple header behind the scenes:

```es6
headers: {
  Authorization: `Bearer ${bearer_token}`;
}
```

You can get the bearer token by calling `.getBearerToken()`.

### Verifying credentials example (user auth)

```es6
const client = new Twitter({
  subdomain: "api",
  consumer_key: "abc", // from Twitter.
  consumer_secret: "def", // from Twitter.
  access_token_key: "uvw", // from your User (oauth_token)
  access_token_secret: "xyz" // from your User (oauth_token_secret)
});

client
  .get("account/verify_credentials")
  .then(results => {
    console.log("results", results);
  })
  .catch(console.error);
```

### App authentication example

```es6
const user = new Twitter({
  consumer_key: "abc",
  consumer_secret: "def",
});

const response = await user.getBearerToken();
const app = new Twitter({
  bearer_token: response.access_token
});
```

### Oauth authentication

According to the [docs](https://developer.twitter.com/en/docs/basics/authentication/api-reference/authenticate) this helps you get access token from your users.

- [Request Token documentation](https://developer.twitter.com/en/docs/basics/authentication/api-reference/request_token)
- [Access Token documentation](https://developer.twitter.com/en/docs/basics/authentication/api-reference/access_token)

```es6
const client = new Twitter({
  consumer_key: "xyz",
  consumer_secret: "xyz"
});

client
  .getRequestToken("http://callbackurl.com")
  .then(res =>
    console.log({
      reqTkn: res.oauth_token,
      reqTknSecret: res.oauth_token_secret
    })
  )
  .catch(console.error);
```

Then you redirect your user to `https://api.twitter.com/oauth/authenticate?oauth_token=xyz123abc`, and once you get the verifier and the token, you pass them on to the next stage of the authentication.

```es6
const client = new Twitter({
  consumer_key: "xyz",
  consumer_secret: "xyz"
});

client
  .getAccessToken({
    key: requestToken,
    secret: requestTokenSecret,
    verifier: oauthVerifier
  })
  .then(res =>
    console.log({
      accTkn: res.oauth_token,
      accTknSecret: res.oauth_token_secret,
      userId: res.user_id,
      screenName: res.screen_name
    })
  )
  .catch(console.error);
```

And this will return you your `access_token` and `access_token_secret`.

## Streams

To learn more about the streaming API visit the [Twitter Docs](https://developer.twitter.com/en/docs/tweets/filter-realtime/api-reference/post-statuses-filter.html). The streaming API works only in Node.

```es6
const client = new Twitter({
  consumer_key: "xyz" // from Twitter.
  consumer_secret: "xyz" // from Twitter.
  access_token_key: "abc" // from your User (oauth_token)
  access_token_secret: "abc" // from your User (oauth_token_secret)
});

const parameters = {
  track: "#bitcoin,#litecoin,#monero", // #bitcoin, #litecoin, #monero
  follow: "422297024,873788249839370240", // @OrchardAI, @tylerbuchea
  locations: "-122.75,36.8,-121.75,37.8", // Bounding box -	San Francisco
};

client.stream("statuses/filter", parameters)
  .on("start", response => console.log("start"))
  .on("data", data => console.log("data", data.text))
  .on("ping", () => console.log("ping"))
  .on("error", error => console.log("error", error))
  .on("end", response => console.log("end"));

// to stop the stream:
client.stream.destroy(); // emits "end" and "error" event
```

## Methods

### .get(endpoint, parameters)

```es6
const client = new Twitter({
  consumer_key: "xyz",
  consumer_secret: "xyz",
  access_token_key: "abc",
  access_token_secret: "abc"
});

const rateLimits = await app.get("statuses/show", {
  id: "1016078154497048576",
});
```

### .post(endpoint, body, parameters)

Use the `.post` method for actions that change state, as documented in the Twitter API. For [example](https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/post-friendships-create.html), to follow a user:

```es6
const client = new Twitter({
  consumer_key: "xyz",
  consumer_secret: "xyz",
  access_token_key: "abc",
  access_token_secret: "abc"
});

await client.post("friendships/create", null, {
  screen_name: "dandv"
});
```

Note: [for now](https://github.com/Preposterous/twitter-lite/issues/15#issuecomment-402902433), make sure to pass a `null` body to `.post`. This is subject to change in a future version of the library.

### .getBearerToken()

See the [app authenticatio example](#app-authentication-example).

### .getRequestToken(twitterCallbackUrl)

See the [OAuth example](#oauth-authentication).

### .getAccessToken(options)

See the [OAuth example](#oauth-authentication).

## Troubleshooting

### API Errors

API errors are returned as an array of errors under the `errors` key of the response object. Make sure to check for the presence of this field, in addition to any try/catch blocks you may have.

### Numeric vs. string IDs

Twitter uses [numeric IDs](https://developer.twitter.com/en/docs/basics/twitter-ids.html) that in practice can be up to 18 characters long. Due to rounding errors, it's [unsafe to use numeric IDs in JavaScript](https://developer.twitter.com/en/docs/basics/things-every-developer-should-know). Always set `stringify_ids: true` when possible, so that Twitter will return strings instead of numbers, and rely on the `id_str` field, rather than on the `id` field.

## Contributing

With the library nearing v1.0, contributions are welcome! Areas especially in need of help involve multimedia (see [#33](https://github.com/Preposterous/twitter-lite/issues/33) for example), adding tests, and [getting v1.0 out the door](https://github.com/Preposterous/twitter-lite/issues/21).

### Development

1.  Fork/clone the repo
2.  `yarn/npm install`
3.  Go to https://apps.twitter.com and create an app for testing this module. Make sure it has read/write permissions.
4.  Grab the consumer key/secret, and the access token/secret and place them in a [.env](https://www.npmjs.com/package/dotenv) file in the project's root directory, under the following variables:
    ```
    TWITTER_CONSUMER_KEY=...
    TWITTER_CONSUMER_SECRET=...
    ACCESS_TOKEN=...
    ACCESS_TOKEN_SECRET=...
    ```
5.  `yarn/npm test` and make sure all tests pass
6.  Add your contribution, along with test case(s). Note: feel free to skip the ["should DM user"](https://github.com/Preposterous/twitter-lite/blob/34e8dbb3efb9a45564275f16473af59dbc4409e5/twitter.test.js#L167) test during development by changing that `it()` call to `it.skip()`, but remember to revert that change before committing. This will prevent your account from being flagged as [abusing the API to send too many DMs](https://github.com/Preposterous/twitter-lite/commit/5ee2ce4232faa07453ea2f0b4d63ee7a6d119ce7).
7.  When all tests pass, run `npm run precommit` for linting with [prettier](https://www.npmjs.com/package/prettier)
8.  Commit using a [descriptive message](https://chris.beams.io/posts/git-commit/) (please squash all your commits into one!)
9.  `git push` and submit your PR!

## Credits

Authors:

- [@peterpme](https://github.com/peterpme)
- [@dandv](https://github.com/dandv)

Over the years, thanks to:

- [@technoweenie](http://github.com/technoweenie)
- [@jdub](http://github.com/jdub)
- [@desmondmorris](http://github.com/desmondmorris)
- [@ttezel](https://github.com/ttezel)
- [Node Twitter Community](https://github.com/desmondmorris/node-twitter/graphs/contributors)
