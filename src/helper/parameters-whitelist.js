// For future reference:,
// The only parameters that should be allowed are parameters
// defined by the specification, or existing parameters that we
// need for compatibility

import objectHelper from './object';

var tokenParams = [
  // authok
  'realm',
  'audience',
  'otp',
  // oauth2
  'client_id',
  'client_secret',
  'redirect_uri',
  'scope',
  'code',
  'grant_type',
  'username',
  'password',
  'refresh_token',
  'assertion',
  'client_assertion',
  'client_assertion_type',
  'code_verifier'
];

var authorizeParams = [
  // authok
  'connection',
  'connection_scope',
  'authokClient',
  'owp',
  'device',
  'realm',
  'organization',
  'invitation',

  'protocol',
  '_csrf',
  '_intstate',
  'login_ticket',

  // oauth2
  'client_id',
  'response_type',
  'response_mode',
  'redirect_uri',
  'audience',
  'scope',
  'state',
  'nonce',
  'display',
  'prompt',
  'screen_hint',
  'max_age',
  'ui_locales',
  'claims_locales',
  'id_token_hint',
  'login_hint',
  'acr_values',
  'claims',
  'registration',
  'request',
  'request_uri',
  'code_challenge',
  'code_challenge_method',

  // ADDITIONAL_PARAMETERS:
  // https://authok.cn/docs/api/authentication?javascript#social
  'access_type',
  'display'
];

function oauthAuthorizeParams(warn, params) {
  var notAllowed = objectHelper.getKeysNotIn(params, authorizeParams);

  if (notAllowed.length > 0) {
    warn.warning(
      'Following parameters are not allowed on the `/authorize` endpoint: [' +
        notAllowed.join(',') +
        ']'
    );
  }

  return params;
}

function oauthTokenParams(warn, params) {
  return objectHelper.pick(params, tokenParams);
}

export default {
  oauthTokenParams: oauthTokenParams,
  oauthAuthorizeParams: oauthAuthorizeParams
};
