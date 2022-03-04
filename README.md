![](https://cdn.authok.cn/resources/oss-source-large-2x.png)

# authok.js

[![Build Status][circleci-image]][circleci-url]
[![NPM version][npm-image]][npm-url]
[![Coverage][codecov-image]][codecov-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fauthok%2Fauthok.js.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fauthok%2Fauthok.js?ref=badge_shield)

Authok API 的 Javascript 客户端 sdk.

authok.js 的完整 API 文档请参考 [这里](https://authok.github.io/authok.js/index.html).

## Index

- [安装](#install)
- [authok.WebAuth](#authokwebauth)
- [authok.Authentication](#authokauthentication)
- [authok.Management](#authokmanagement)
- [免密登录](#passwordless-login)
- [组织](#organizations)
- [文档](#documentation)
- [迁移](#migration)
- [开发](#develop)
- [问题报告](#issue-reporting)
- [作者](#author)
- [许可](#license)

## Install

通过 CDN:

```html
<!-- Latest patch release -->
<script src="https://cdn.authok.cn/js/authok/9.18.0/authok.min.js"></script>
```

通过 [npm](https://npmjs.org):

```sh
npm install authok-js
```

在安装 `authok-js` 模块后, 你需要把它和其所有依赖一起打包.

## authok.WebAuth

提供了对所有认证流程的支持.

### 初始化

```js
var authok = new authok.WebAuth({
  domain: '{YOUR_authok_DOMAIN}',
  clientID: '{YOUR_authok_CLIENT_ID}'
});
```

**参数**

All parameters can be considered optional unless otherwise stated.

| 选项                          | 类型              | 描述                                                                                                                                                                                                                                                                                     |
| :---------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain`                      | string (required) | Your authok account domain such as `'example.authok.cn'` or `'example.cn.authok.cn'`.                                                                                                                                                                                                    |
| `clientID`                    | string (required) | The Client ID found on your Application settings page.                                                                                                                                                                                                                                   |
| `redirectUri`                 | string            | The URL where authok will call back to with the result of a successful or failed authentication. It must be added to the "Allowed Callback URLs" in your authok Application's settings.                                                                                                  |
| `scope`                       | string            | The default scope used for all authorization requests.                                                                                                                                                                                                                                   |
| `audience`                    | string            | The default audience, used if requesting access to an API.                                                                                                                                                                                                                               |
| `responseType`                | string            | Response type for all authentication requests. It can be any space separated list of the values `code`, `token`, `id_token`. **If you don't provide a global `responseType`, you will have to provide a `responseType` for each method that you use**.                                   |
| `responseMode`                | string            | The default responseMode used, defaults to `'fragment'`. The `parseHash` method can be used to parse authentication responses using fragment response mode. Supported values are `query`, `fragment` and `form_post`. The `query` value is only supported when `responseType` is `code`. |
| `_disableDeprecationWarnings` | boolean           | Indicates if deprecation warnings should be output to the browser console, defaults to `false`.                                                                                                                                                                                          |
| `maxAge`                      | number            | Used during token validation. Specifies the maximum elapsed time in seconds since the last time the user was actively authenticated by the authorization server. If the elapsed time is greater than this value, the token is considered invalid and the user must be re-authenticated.  |
| `leeway`                      | number            | Used during ID token validation. Specifies the number of seconds to account for clock skew when validating time-based claims such as `iat` and `exp`. The default is 60 seconds.                                                                                                         |
| `organization`                | string            | The ID of the Organization to log in to (see [Organizations](#organizations))                                                                                                                                                                                                            |
| `invitation`                  | string            | The ID of the user invitation to accept. This is usually used in conjunction with the `organization` parameter, and should be parsed from an invitation URL. (see [Organizations](#organizations))                                                                                       |

### API

#### authorize(options)

重定向到 `/authorize` 端点以启动验证/授权事务。authok 将会把结果回调给您指定的 URL `redirectUri`.

**注意:** 该方法默认的 scope 为 `openid profile email`.

```js
authok.authorize({
  audience: 'https://mystore.com/api/v2',
  scope: 'read:order write:order',
  responseType: 'token',
  redirectUri: 'https://example.com/auth/callback'
});
```

#### parseHash(options, callback)

解析 URL 哈希片段以提取 authok 身份验证响应的结果.

**注意:** 该方法需要您的令牌采用 **RS256** 进行签名. 请查看 [迁移指南](https://authok.cn/docs/libraries/authokjs/v8/migration-guide#switching-from-hs256-to-rs256) 以获取更多信息.

```js
authok.parseHash({ hash: window.location.hash }, function (err, authResult) {
  if (err) {
    return console.log(err);
  }

  // The contents of authResult depend on which authentication parameters were used.
  // It can include the following:
  // authResult.accessToken - access token for the API specified by `audience`
  // authResult.expiresIn - string with the access token's expiration time in seconds
  // authResult.idToken - ID token JWT containing user profile information

  authok.client.userInfo(authResult.accessToken, function (err, user) {
    // Now you have the user's information
  });
});
```

#### checkSession(options, callback)

为已经在您的域建立过 SSO 会话的用户获取新令牌. 如果用户未经身份验证，身份验证结果将为空，并将收到如下错误: `{error: 'login_required'}`.
该方法可以接受任何有效的 OAuth2 参数，和传给 `/authorize` 端点的参数一样.

Everything happens inside an iframe, so it will not reload your application or redirect away from it.

```js
authok.checkSession(
  {
    audience: 'https://mystore.com/api/v2',
    scope: 'read:order write:order'
  },
  function (err, authResult) {
    // Authentication tokens or error
  }
);
```

The contents of `authResult` are identical to those returned by `parseHash()`.

**Important:** If you're not using the hosted login page to do social logins, you have to use your own [social connection keys](https://manage.authok.cn/#/connections/social). If you use authok's dev keys, you'll always get `login_required` as an error when calling `checkSession`.

**Important:** Because there is no redirect in this method, `responseType: 'code'` is not supported and will throw an error.

Remember to add the URL where the authorization request originates from to the Allowed Web Origins list of your authok Application in the [Dashboard](https://manage.authok.cn/) under your Applications's **Settings**.

#### client.login(options, callback)

使用 `/oauth/token`端点来进行用户名/密码认证. 这里不会初始化 SSO 会话, 所以不能用于静默认证.

```js
authok.client.login(
  {
    realm: 'Username-Password-Authentication', //connection name or HRD domain
    username: 'info@authok.cn',
    password: 'areallystrongpassword',
    audience: 'https://mystore.com/api/v2',
    scope: 'read:order write:order'
  },
  function (err, authResult) {
    // Auth tokens in the result or an error
  }
);
```

The contents of `authResult` are identical to those returned by `parseHash()`.

**onRedirecting hook**

When using `login` to log in using a username and password, authok.js initially makes a call to authok to get a login ticket, before sending that login ticket to the `/authorize` endpoint to be exchanged for tokens. You are able to specify an `onRedirecting` hook here to handle when authok.js is about to redirect to the `/authorize` endpoint, for the purposes of executing some custom code (analytics, etc).

To do this, specify the `onRedirecting` function in the options and ensure that the `done` callback is called when you are finished executing your custom code. Otherwise, authentication will be blocked.

```js
authok.client.login(
  {
    realm: 'Username-Password-Authentication', //connection name or HRD domain
    username: 'info@authok.cn',
    password: 'areallystrongpassword',
    onRedirecting: function (done) {
      // Your custom code here
      done();
    }
  },
  function (err, authResult) {
    // Auth tokens in the result or an error
  }
);
```

## authok.Authentication

Provides an API client for the authok Authentication API.

### Initialize

```js
var authok = new authok.Authentication({
  domain: '{YOUR_authok_DOMAIN}',
  clientID: '{YOUR_authok_CLIENT_ID}'
});
```

### API

#### buildAuthorizeUrl(options)

Builds and returns the `/authorize` url in order to initialize a new authN/authZ transaction. [https://authok.cn/docs/api/authentication#database-ad-ldap-passive-](https://authok.cn/docs/api/authentication#database-ad-ldap-passive-)

#### buildLogoutUrl(options)

Builds and returns the Logout url in order to initialize a new authN/authZ transaction. [https://authok.cn/docs/api/authentication#logout](https://authok.cn/docs/api/authentication#logout)

#### loginWithDefaultDirectory(options, cb)

Makes a call to the `oauth/token` endpoint with `password` grant type. [https://authok.cn/docs/api-auth/grant/password](https://authok.cn/docs/api-auth/grant/password)

#### login(options, cb)

Makes a call to the `oauth/token` endpoint with `https://authok.cn/oauth/grant-type/password-realm` grant type.

#### oauthToken(options, cb)

Makes a call to the `oauth/token` endpoint.

#### userInfo(token, cb)

Makes a call to the `/userinfo` endpoint and returns the user profile.

## authok.Management

Provides an API Client for the authok Management API (only methods meant to be used from the client with the user token). You should use an `access_token` with the `https://YOUR_DOMAIN.authok.cn/api/v2/` audience to make this work. For more information, read [the user management section of the authok.js documentation](https://authok.cn/docs/libraries/authokjs/v9#user-management).

## Passwordless Login

For information on how to implement Passwordless Login with this SDK, please read [Passwordless Login on authok Docs](https://authok.cn/docs/libraries/authokjs#passwordless-login).

### Initialize

```js
var authok = new authok.Management({
  domain: '{YOUR_authok_DOMAIN}',
  token: '{ACCESS_TOKEN_FROM_THE_USER}'
});
```

### API

- **getUser(userId, cb)**: Returns the user profile. [https://authok.cn/docs/api/management/v2#!/Users/get_users_by_id](https://authok.cn/docs/api/management/v2#!/Users/get_users_by_id)
- **patchUserMetadata(userId, userMetadata, cb)**: Updates the user metadata. It will patch the user metadata with the attributes sent. [https://authok.cn/docs/api/management/v2#!/Users/patch_users_by_id](https://authok.cn/docs/api/management/v2#!/Users/patch_users_by_id)
- **patchUserAttributes(userId, user, cb)**: Updates the user attributes. It will patch the root attributes that the server allows it. To check what attributes can be patched, go to [https://authok.cn/docs/api/management/v2#!/Users/patch_users_by_id](https://authok.cn/docs/api/management/v2#!/Users/patch_users_by_id)
- **linkUser(userId, secondaryUserToken, cb)**: Link two users. [https://authok.cn/docs/api/management/v2#!/Users/post_identities](https://authok.cn/docs/api/management/v2#!/Users/post_identities)

## 组织(Organizations)

[Organizations](https://authok.cn/docs/organizations) is a set of features that provide better support for developers who build and maintain SaaS and Business-to-Business (B2B) applications.

### 登录到组织

在创建 `WebAuth` client 时设置 `organization` 参数:

```js
var webAuth = new WebAuth({
  domain: '{YOUR_authok_DOMAIN}',
  clientID: '{YOUR_authok_CLIENT_ID}',
  organization: '{YOUR_authok_ORGANIZATION_ID}'
});
```

You can also specify an organization when calling `authorize`:

```js
webAuth.authorize({
  organization: '{YOUR_authok_ORGANIZATION_ID}'
});
```

### Accept user invitations

Accept a user invitation through the SDK by creating a route within your application that can handle the user invitation URL, and log the user in by passing the `organization` and `invitation` parameters from this URL. You can either use `authorize` or `popup.authorize` as needed.

```js
var url = new URL(invitationUrl)
var params = new URLSearchParams(url.search);

if (organization && invitation) {
  webAuth.authorize({
    organization: params.get('organization')
    invitation: params.get('invitation')
  });
}
```

## Documentation

For a complete reference and examples please check our [docs](https://authok.cn/docs/libraries/authokjs).

## Migration

If you need help migrating to v9, please refer to the [v9 Migration Guide](https://authok.cn/docs/libraries/authokjs/v9/migration-guide).

If you need help migrating to v8, please refer to the [v8 Migration Guide](https://authok.cn/docs/libraries/authokjs/v8/migration-guide).

## Develop

Run `npm install` to set up the environment.

Run `npm start` to point your browser to [`https://localhost:3000/`](https://localhost:3000/) to verify the example page works.

Run `npm test` to run the test suite.

Run `npm run ci:test` to run the tests that ci runs.

Run `npm run test:watch` to run the test suite while you work.

Run `npm run test:coverage` to run the test suite with coverage report.

Run `npm run lint` to run the linter and check code styles.

Run `npm install && npm run build && npm run test:es-check:es5 && npm run test:es-check:es2015:module` to check for JS incompatibility.

See [.circleci/config.yml](.circleci/config.yml) for additional checks that might be run as part of
[circleci integration tests](https://circleci.com/).

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://authok.cn/whitehat) details the procedure for disclosing security issues.

For authok related questions/support please use the [Support Center](https://support.authok.cn).

## Author

[authok](https://authok.cn)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.

<!-- Vaaaaarrrrsss -->

[npm-image]: https://img.shields.io/npm/v/authok-js.svg?style=flat-square
[npm-url]: https://npmjs.org/package/authok-js
[circleci-image]: https://img.shields.io/circleci/project/github/authok/authok.js.svg?branch=master&style=flat-square
[circleci-url]: https://circleci.com/gh/authok/authok.js
[codecov-image]: https://img.shields.io/codecov/c/github/authok/authok.js/master.svg?style=flat-square
[codecov-url]: https://codecov.io/github/authok/authok.js?branch=master
[license-image]: https://img.shields.io/npm/l/authok-js.svg?style=flat-square
[license-url]: #license
[downloads-image]: https://img.shields.io/npm/dm/authok-js.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/authok-js

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fauthok%2Fauthok.js.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fauthok%2Fauthok.js?ref=badge_large)
