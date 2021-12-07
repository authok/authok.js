import CrossOriginAuthentication from './cross-origin-authentication';
import Warn from '../helper/warn';

/**
 * @class
 * @classdesc This class cannot be instantiated directly. Instead, use WebAuth.redirect
 * @hideconstructor
 */
function Redirect(authok, options) {
  this.webAuth = authok;
  this.baseOptions = options;
  this.crossOriginAuthentication = new CrossOriginAuthentication(
    authok,
    this.baseOptions
  );

  this.warn = new Warn({
    disableWarnings: !!options._disableDeprecationWarnings
  });
}

/**
 * username/password 进行用户登录, 采用跨域认证 (/co/authenticate) 流程. 你可以用 `username` 或 `email` 来标识用户, `username` 的优先级高于 `email`.
 * 部分浏览器可能无法成功认证，如果第三方 cookie 被浏览器禁用的话. [查看这里获取更多信息.]{@link https://authok.com/docs/cross-origin-authentication}.
 * 调用 /co/authenticate 之后, you'll have to use the {@link parseHash} function at the `redirectUri` specified in the constructor.
 *
 * @method loginWithCredentials
 * @deprecated This method will be released in the next major version. Use `webAuth.login` instead.
 * @param {Object} options options used in the {@link authorize} call after the login_ticket is acquired
 * @param {String} [options.username] Username (与 email 互斥)
 * @param {String} [options.email] Email (与 username 互斥)
 * @param {String} options.password Password
 * @param {String} [options.connection] 用于认证用户的连接, 可以是 realm 名字 或 database 连接 的名字
 * @param {crossOriginLoginCallback} cb Callback function called only when an authentication error, like invalid username or password, occurs. For other types of errors, there will be a redirect to the `redirectUri`.
 * @memberof Redirect.prototype
 * @memberof Redirect.prototype
 */
Redirect.prototype.loginWithCredentials = function (options, cb) {
  options.realm = options.realm || options.connection;
  delete options.connection;
  this.crossOriginAuthentication.login(options, cb);
};

/**
 * Signs up a new user and automatically logs the user in after the signup.
 *
 * @method signupAndLogin
 * @param {Object} options
 * @param {String} options.email user email address
 * @param {String} options.password user password
 * @param {String} options.connection name of the connection where the user will be created
 * @param {crossOriginLoginCallback} cb
 * @memberof Redirect.prototype
 */
Redirect.prototype.signupAndLogin = function (options, cb) {
  var _this = this;

  return this.webAuth.client.dbConnection.signup(options, function (err) {
    if (err) {
      return cb(err);
    }

    options.realm = options.realm || options.connection;
    delete options.connection;

    return _this.webAuth.login(options, cb);
  });
};

export default Redirect;
