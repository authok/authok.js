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

除非另有说明，否则均为可选参数.

| 选项                          | 类型            | 描述                                                                                                                                                                                              |
| :---------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain`                      | string (必填项) | 您的 authok 租户域名, 例如 `'example.cn.authok.cn'`.                                                                                                                                              |
| `clientID`                    | string (必填项) | 在 **应用** >> **设置** 中获取 对应的 Client ID .                                                                                                                                                 |
| `redirectUri`                 | string          | 验证成功或失败后，authok 将把结果回调给该 URL. 需要被加入到 **应用** >> **设置** >> "回调 URL" .                                                                                                  |
| `scope`                       | string          | 用于所有授权请求的默认 scope .                                                                                                                                                                    |
| `audience`                    | string          | 默认的 audience, 用于访问 API.                                                                                                                                                                    |
| `responseType`                | string          | 响应类型. 允许的响应类型 `code`, `token`, `id_token`, 多个响应类型用空格分割. **如果你没有提供全局 `responseType`, 则每次方法调用你都需要提供 `responseType` 参数**.                              |
| `responseMode`                | string          | 响应模式, 默认为 `'fragment'`. `parseHash` 方法可通过 `fragment` 响应模式来解析认证响应. 支持的响应模式有 `query`, `fragment` 和 `form_post`. `query` 只有在 `responseType` 为 `code` 时才被允许. |
| `_disableDeprecationWarnings` | boolean         | 是否应将弃用警告输出到浏览器控制台，默认为`false`.                                                                                                                                                |
| `maxAge`                      | number          | 从上一次认证成功开始，令牌存活的有效期(秒为单位). 如果过期，令牌不可用，用户需要重新认证.                                                                                                         |
| `leeway`                      | number          | 在 IDToken 验证期间使用。指定在验证基于时间的声明（如`iat`和`exp`）时可允许的时钟偏移(秒为单位)。默认值为 60 秒.                                                                                  |
| `organization`                | string          | 组织 ID, 登录组织时需要 (参考 [组织](#organizations))                                                                                                                                             |
| `invitation`                  | string          | 用户邀请 ID . 通常和 `organization` 参数结合使用, 通常从邀请链接的参数进行解析. (参考 [组织](#organizations))                                                                                     |

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

  // authResult 的内容取决于何种认证参数被使用. 可包含如下信息:
  // authResult.accessToken - 通过 `audience` 指定的访问令牌
  // authResult.expiresIn - 访问令牌的过期时间(以秒为单位)
  // authResult.idToken - JWT 格式的 ID token, 包含用户详情

  authok.client.userInfo(authResult.accessToken, function (err, user) {
    // 获取到用户信息
  });
});
```

#### checkSession(options, callback)

为已经在您的域建立过 SSO 会话的用户获取新令牌. 如果用户未经身份验证，身份验证结果将为空，并将收到如下错误: `{error: 'login_required'}`.
该方法可以接受任何有效的 OAuth2 参数，和传给 `/authorize` 端点的参数一样.

逻辑都在 iframe 中执行，因此它不会重新加载应用程序或进行页面重定向。

```js
authok.checkSession(
  {
    audience: 'https://mystore.com/api/v2',
    scope: 'read:order write:order'
  },
  function (err, authResult) {
    // 认证令牌或错误
  }
);
```

`authResult` 与 `parseHash()` 返回的内容相同.

**重要:** 如果您不是采用托管登录页进行社会化登录, 您必须使用自己的 [社交身份源配置](https://manage.authok.cn/#/connections/social). 如果您使用 Authok 的开发配置, 在调用 `checkSession` 时总是会收到 `login_required` 错误.

**重要:** 因为该方法不会发生重定向, 所以不支持 `responseType: 'code'`，否则会抛出错误.

请记得将发起授权请求的 来源 URL 添加到 [管理后台](https://manage.authok.cn/) >> **应用** >> **设置** >> `允许的Web来源` 列表中.

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
    // 成功, 则返回的结果中包含 认证令牌; 失败, 则错误信息包含在 err 中
  }
);
```

`authResult` 与 `parseHash()` 返回的内容相同.

**onRedirecting hook**

当使用用户名/密码进行登录 `login` 时，authok.js 首先会向 authok 获取一个登录票证`login ticket`，然后将该登录票证发送到 `/authorize` 端点交换令牌。
您可以指定一个 `onRedirecting` 钩子, 在重定向到 `/authorize` 端点前做一些自定义处理（例如统计分析等).

To do this, specify the `onRedirecting` function in the options and ensure that the `done` callback is called when you are finished executing your custom code. Otherwise, authentication will be blocked.

```js
authok.client.login(
  {
    realm: 'Username-Password-Authentication', //数据源名称 或者 HRD domain
    username: 'info@authok.cn',
    password: 'areallystrongpassword',
    onRedirecting: function (done) {
      // 自定义代码
      done();
    }
  },
  function (err, authResult) {
    // Auth tokens in the result or an error
  }
);
```

## authok.Authentication

为 Authok 认证 API 提供的客户端 API.

### 初始化

```js
var authok = new authok.Authentication({
  domain: '{YOUR_authok_DOMAIN}',
  clientID: '{YOUR_authok_CLIENT_ID}'
});
```

### API

#### buildAuthorizeUrl(options)

构建并返回 `/authorize` url 用于初始化新的 authN/authZ 事务. [https://authok.cn/docs/api/authentication#database-ad-ldap-passive-](https://authok.cn/docs/api/authentication#database-ad-ldap-passive-)

#### buildLogoutUrl(options)

构建并返回 退登 url. [https://authok.cn/docs/api/authentication#logout](https://authok.cn/docs/api/authentication#logout)

#### loginWithDefaultDirectory(options, cb)

采用授权类型 `password` 来调用 `oauth/token` 端点. [https://authok.cn/docs/api-auth/grant/password](https://authok.cn/docs/api-auth/grant/password)

#### login(options, cb)

调用 `oauth/token` 端点, 授权类型为 `https://authok.cn/oauth/grant-type/password-realm`.

#### oauthToken(options, cb)

调用 `oauth/token` 端点.

#### userInfo(token, cb)

调用 `/userinfo` 端点并返回用户详情.

## authok.Management

Authok 管理 API 对应的 客户端 API (只有用户令牌中包含权限的方法可被调用). 您可以设置 `access_token` 和 `https://YOUR_DOMAIN.authok.cn/api/v1/` audience 来进行调用. 更多请参考 [Authok.js 文档中的用户管理章节](https://authok.cn/docs/libraries/authokjs/v9#user-management).

## 免密登录

有关如何使用此 SDK 实现无密码登录的信息，请阅读 authok Docs 上的无密码登录。

请参考 [免密登录](https://authok.cn/docs/libraries/authokjs#passwordless-login).

### 初始化

```js
var authok = new authok.Management({
  domain: '{YOUR_authok_DOMAIN}',
  token: '{ACCESS_TOKEN_FROM_THE_USER}'
});
```

### API

- **getUser(userId, cb)**: 返回用户详情. [参考](https://authok.cn/docs/api/management/v2#!/Users/get_users_by_id)
- **patchUserMetadata(userId, userMetadata, cb)**: 更新用户元数据. [参考](https://authok.cn/docs/api/management/v2#!/Users/patch_users_by_id)
- **patchUserAttributes(userId, user, cb)**: 更新用户属性. [进一步查看哪些用户属性可被修改](https://authok.cn/docs/api/management/v2#!/Users/patch_users_by_id)
- **linkUser(userId, secondaryUserToken, cb)**: 关联两个用户. [参考](https://authok.cn/docs/api/management/v2#!/Users/post_identities)

## 组织(Organizations)

[组织](https://authok.cn/docs/organizations) 主要用于支持多租户 SaaS 应用和 B2B 应用.

### 登录到组织

在创建 `WebAuth` client 时设置 `organization` 参数:

```js
var webAuth = new WebAuth({
  domain: '{YOUR_authok_DOMAIN}',
  clientID: '{YOUR_authok_CLIENT_ID}',
  organization: '{YOUR_authok_ORGANIZATION_ID}'
});
```

您可以在 调用 `authorize` 时指定 organization:

```js
webAuth.authorize({
  organization: '{YOUR_authok_ORGANIZATION_ID}'
});
```

### 接受用户邀请

在您的应用中创建一个路由用于处理邀请连接，然后通过 SDK 接受用户邀请, 并通过 `organization` 和 `invitation` 参数进行登录. 您可以根据需要使用 `authorize` 或 `popup.authorize`.

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

## 文档

完整参考和更多例子请参考 [官方文档](https://authok.cn/docs/libraries/authokjs).

## 开发

运行 `npm install` 来构建环境.

运行 `npm start` 可以在浏览器中 [`https://localhost:3000/`](https://localhost:3000/) 运行示例.

运行 `npm test` 来执行测试.

运行 `npm run ci:test` 来进行 ci 测试.

运行 `npm run test:watch` 可以在运行时自动检测并执行测试.

运行 `npm run test:coverage` 进行测试并生成覆盖报告.

运行 `npm run lint` 进行 格式对齐 和代码风格检查.

运行 `npm install && npm run build && npm run test:es-check:es5 && npm run test:es-check:es2015:module` 来检查 JS 兼容性.

参考 [.circleci/config.yml](.circleci/config.yml) 查看其它检查. [circleci 集成测试](https://circleci.com/).

## 问题报告

如果您发现了 bug, 或者有功能建议, 请给仓库提交 issue. 请不要在公开的 GitHub 问题报告中提交安全漏洞.

authok 相关的问题/支持请使用 [支持中心](https://support.authok.cn).

## 作者

[authok](https://authok.cn)

## 许可

该项目基于 MIT 许可. 请参考 [LICENSE](LICENSE) 文件获取更多信息.

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
