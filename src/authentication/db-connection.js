import urljoin from 'url-join';

import objectHelper from '../helper/object';
import assert from '../helper/assert';
import responseHandler from '../helper/response-handler';

function DBConnection(request, options) {
  this.baseOptions = options;
  this.request = request;
}

/**
 * @callback signUpCallback
 * @param {Error} [err] error returned by authok with the reason why the signup failed
 * @param {Object} [result] result of the signup request
 * @param {Object} result.email user's email
 * @param {Object} result.emailVerified if the user's email was verified
 * @ignore
 */

/**
 * Creates a new user in a authok Database connection
 *
 * @method signup
 * @param {Object} options
 * @param {String} options.email user email address
 * @param {String} options.password user password
 * @param {String} [options.username] user desired username. Required if you use a database connection and you have enabled `Requires Username`
 * @param {String} [options.given_name] The user's given name(s).
 * @param {String} [options.family_name] The user's family name(s).
 * @param {String} [options.name] The user's full name.
 * @param {String} [options.nickname] The user's nickname.
 * @param {String} [options.picture] A URI pointing to the user's picture.
 * @param {String} options.connection name of the connection where the user will be created
 * @param {Object} [options.user_metadata] additional signup attributes used for creating the user. Will be stored in `user_metadata`
 * @param {signUpCallback} cb
 * @see   {@link https://authok.cn/docs/api/authentication#signup}
 * @ignore
 */
DBConnection.prototype.signup = function (options, cb) {
  var url;
  var body;
  var metadata;

  assert.check(
    options,
    { type: 'object', message: 'options parameter is not valid' },
    {
      connection: { type: 'string', message: 'connection option is required' },
      email: { type: 'string', message: 'email option is required' },
      password: { type: 'string', message: 'password option is required' }
    }
  );
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'dbconnections', 'signup');

  body = objectHelper
    .merge(this.baseOptions, ['clientID', 'state'])
    .with(options);

  metadata = body.user_metadata || body.userMetadata;

  body = objectHelper.blacklist(body, [
    'scope',
    'userMetadata',
    'user_metadata'
  ]);

  body = objectHelper.toSnakeCase(body, ['authokClient']);

  if (metadata) {
    body.user_metadata = metadata;
  }

  return this.request.post(url).send(body).end(responseHandler(cb));
};

/**
 * @callback changePasswordCallback
 * @param {Error} [err] error returned by authok with the reason why the request failed
 * @ignore
 */

/**
 * Request an email with instruction to change a user's password
 *
 * @method changePasswordByEmail
 * @param {Object} options
 * @param {String} options.email address where the user will receive the change password email. It should match the user's email in authok
 * @param {String} options.connection name of the connection where the user was created
 * @param {changePasswordCallback} cb
 * @see   {@link https://authok.cn/docs/api/authentication#change-password}
 * @ignore
 */
DBConnection.prototype.changePasswordByEmail = function (options, cb) {
  var url;
  var body;

  assert.check(
    options,
    { type: 'object', message: 'options parameter is not valid' },
    {
      connection: { type: 'string', message: 'connection option is required' },
      email: { type: 'string', message: 'email option is required' }
    }
  );
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'dbconnections', 'change_password');

  body = objectHelper
    .merge(this.baseOptions, ['clientID'])
    .with(options, ['email', 'connection']);

  body = objectHelper.toSnakeCase(body, ['authokClient']);

  return this.request.post(url).send(body).end(responseHandler(cb));
};

/**
 * Request an sms with instruction to change a user's password
 *
 * @method changePasswordDirectly
 * @param {Object} options
 * @param {String} options.realm 'sms' or 'email'
 * @param {String} options.connection ??????????????????
 * @param {String} options.vcode address where the user will receive the change password email. It should match the user's email in authok
 * @param {String} options.username realm??? sms ?????? username, realm ??? email ?????? phoneNumber
 * @param {String} options.password address where the user will receive the change password email. It should match the user's email in authok
 * @param {changePasswordCallback} cb
 * @see   {@link https://docs.authok.cn/api/authentication#change-password}
 * @ignore
 */
DBConnection.prototype.changePasswordDirectly = function (options, cb) {
  var url;
  var body;

  assert.check(
    options,
    { type: 'object', message: 'options parameter is not valid' },
    {
      realm: { type: 'string', message: 'realm option is required' },
      connection: { type: 'string', message: 'connection option is required' },
      vcode: { type: 'string', message: 'vcode option is required' },
      username: { type: 'string', message: 'username option is required' },
      password: { type: 'string', message: 'password option is required' }
    }
  );
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(
    this.baseOptions.rootUrl,
    'dbconnections',
    'change_password_directly'
  );

  body = objectHelper
    .merge(this.baseOptions, ['clientID'])
    .with(options, ['realm', 'connection', 'vcode', 'username', 'password']);

  body = objectHelper.toSnakeCase(body, ['authokClient']);

  return this.request.post(url).send(body).end(responseHandler(cb));
};

export default DBConnection;
