import expect from 'expect.js';

import sinon from 'sinon';

import RequestMock from '../mock/request-mock';

import request from 'superagent';

import RequestBuilder from '../../src/helper/request-builder';
import windowHelper from '../../src/helper/window';
import Storage from '../../src/helper/storage';
import Authentication from '../../src/authentication';

var telemetryInfo = new RequestBuilder({}).getTelemetryData();

describe('authok.authentication', function () {
  before(function () {
    this.webAuthSpy = {
      checkSession: sinon.spy(),
      _universalLogin: {
        getSSOData: sinon.spy()
      }
    };
  });

  describe('initialization', function () {
    it('should use first argument as options when only one argument is used', function () {
      var authok = new Authentication({ domain: 'foo', clientID: 'cid' });
      expect(authok.baseOptions.domain).to.be.equal('foo');
    });
    it('should use second argument as options when two arguments are used', function () {
      var authok = new Authentication({}, { domain: 'foo', clientID: 'cid' });
      expect(authok.baseOptions.domain).to.be.equal('foo');
    });

    [
      { domain: 'https://foo', expectedRootUrl: 'https://foo' },
      { domain: 'http://foo', expectedRootUrl: 'http://foo' },
      { domain: 'HTTPS://FOO', expectedRootUrl: 'HTTPS://FOO' },
      { domain: 'foo', expectedRootUrl: 'https://foo' }
    ].forEach(function (mockData) {
      it(`should construct root url ${mockData.expectedRootUrl} when using domain ${mockData.domain}`, function () {
        var authok = new Authentication({
          domain: mockData.domain,
          clientID: 'cid'
        });
        expect(authok.baseOptions.rootUrl).to.be.equal(
          mockData.expectedRootUrl
        );
      });
    });

    it('should check that options is passed', function () {
      expect(function () {
        var authok = new Authentication();
      }).to.throwException(function (e) {
        expect(e.message).to.be('options parameter is not valid');
      });
    });

    it('should check that domain is set', function () {
      expect(function () {
        var authok = new Authentication(this.webAuthSpy, { clientID: '...' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('domain option is required');
      });
    });

    it('should check that clientID is set', function () {
      expect(function () {
        var authok = new Authentication(this.webAuthSpy, {
          domain: 'me.authok.cn'
        });
      }).to.throwException(function (e) {
        expect(e.message).to.be('clientID option is required');
      });
    });
  });

  context('buildAuthorizeUrl', function () {
    before(function () {
      this.authok = new Authentication(this.webAuthSpy, {
        domain: 'me.authok.cn',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    it('should check that options is valid', function () {
      expect(() => {
        this.authok.buildAuthorizeUrl('asdfasdfds');
      }).to.throwException(function (e) {
        expect(e.message).to.be('options parameter is not valid');
      });
    });

    [
      'username',
      'popupOptions',
      'domain',
      'tenant',
      'timeout',
      'appState'
    ].forEach(function (param) {
      it('should remove parameter: ' + param, function () {
        var options = {};
        options[param] = 'foobar';
        var url = this.authok.buildAuthorizeUrl(options);
        expect(url).to.be(
          'https://me.authok.cn/authorize?client_id=...&response_type=code&redirect_uri=http%3A%2F%2Fpage.com%2Fcallback'
        );
      });
    });

    it('should return a url using the default settings', function () {
      var url = this.authok.buildAuthorizeUrl({ state: '1234' });

      expect(url).to.be(
        'https://me.authok.cn/authorize?client_id=...&response_type=code&redirect_uri=http%3A%2F%2Fpage.com%2Fcallback&state=1234'
      );
    });

    it('should return a url with connection_scope', function () {
      var url = this.authok.buildAuthorizeUrl({
        responseType: 'token',
        redirectUri: 'http://anotherpage.com/callback2',
        prompt: 'none',
        state: '1234',
        connection_scope: 'scope1,scope2'
      });

      expect(url).to.be(
        'https://me.authok.cn/authorize?client_id=...&response_type=token&redirect_uri=http%3A%2F%2Fanotherpage.com%2Fcallback2&prompt=none&state=1234&connection_scope=scope1%2Cscope2'
      );
    });

    it('should return a url with connection_scope as a string', function () {
      var url = this.authok.buildAuthorizeUrl({
        responseType: 'token',
        redirectUri: 'http://anotherpage.com/callback2',
        prompt: 'none',
        state: '1234',
        connection_scope: ['scope1', 'scope2']
      });

      expect(url).to.be(
        'https://me.authok.cn/authorize?client_id=...&response_type=token&redirect_uri=http%3A%2F%2Fanotherpage.com%2Fcallback2&prompt=none&state=1234&connection_scope=scope1%2Cscope2'
      );
    });

    it('should return a url using overriding the default settings', function () {
      var url = this.authok.buildAuthorizeUrl({
        responseType: 'token',
        redirectUri: 'http://anotherpage.com/callback2',
        prompt: 'none',
        state: '1234'
      });

      expect(url).to.be(
        'https://me.authok.cn/authorize?client_id=...&response_type=token&redirect_uri=http%3A%2F%2Fanotherpage.com%2Fcallback2&prompt=none&state=1234'
      );
    });

    it('should return a url using only the allowed authorization parameter device', function () {
      var url = this.authok.buildAuthorizeUrl({
        responseType: 'token',
        redirectUri: 'http://anotherpage.com/callback2',
        prompt: 'none',
        state: '1234',
        device: 'my-device'
      });

      expect(url).to.be(
        'https://me.authok.cn/authorize?client_id=...&response_type=token&redirect_uri=http%3A%2F%2Fanotherpage.com%2Fcallback2&prompt=none&state=1234&device=my-device'
      );
    });
  });

  context('buildAuthorizeUrl with Telemetry', function () {
    before(function () {
      this.authok = new Authentication(this.webAuthSpy, {
        domain: 'me.authok.cn',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code'
      });
    });

    it('should return a url using overriding the default settings', function () {
      var url = this.authok.buildAuthorizeUrl({
        responseType: 'token',
        redirectUri: 'http://anotherpage.com/callback2',
        prompt: 'none',
        state: '1234'
      });

      expect(url).to.be(
        'https://me.authok.cn/authorize?client_id=...&response_type=token&redirect_uri=http%3A%2F%2Fanotherpage.com%2Fcallback2&prompt=none&state=1234&authokClient=' +
          encodeURIComponent(telemetryInfo)
      );
    });
  });

  context('buildLogoutUrl', function () {
    before(function () {
      this.authok = new Authentication(this.webAuthSpy, {
        domain: 'me.authok.cn',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    it('should check that options is valid', function () {
      expect(() => {
        this.authok.buildLogoutUrl('asdfasdfds');
      }).to.throwException(function (e) {
        expect(e.message).to.be('options parameter is not valid');
      });
    });

    it('should return a url using the default settings', function () {
      var url = this.authok.buildLogoutUrl();

      expect(url).to.be('https://me.authok.cn/v1/logout?client_id=...');
    });

    it('should ignore the clientID', function () {
      var url = this.authok.buildLogoutUrl({
        clientID: undefined
      });

      expect(url).to.be('https://me.authok.cn/v1/logout?');
    });

    it('should return a url using overriding the default settings', function () {
      var url = this.authok.buildLogoutUrl({
        clientID: '123',
        returnTo: 'http://page.com',
        federated: ''
      });

      expect(url).to.be(
        'https://me.authok.cn/v1/logout?client_id=123&returnTo=http%3A%2F%2Fpage.com&federated'
      );
    });
    it('should not add value for federated', function () {
      var url = this.authok.buildLogoutUrl({
        clientID: '123',
        returnTo: 'http://page.com',
        federated: true
      });

      expect(url).to.be(
        'https://me.authok.cn/v1/logout?client_id=123&returnTo=http%3A%2F%2Fpage.com&federated'
      );
    });
    it('should not included federated param if the value is false', function () {
      var url = this.authok.buildLogoutUrl({
        clientID: '123',
        returnTo: 'http://page.com',
        federated: false
      });

      expect(url).to.be(
        'https://me.authok.cn/v1/logout?client_id=123&returnTo=http%3A%2F%2Fpage.com'
      );
    });
  });

  context('buildLogoutUrl with Telemetry', function () {
    before(function () {
      this.authok = new Authentication(this.webAuthSpy, {
        domain: 'me.authok.cn',
        clientID: '123',
        redirectUri: 'http://page.com/callback',
        responseType: 'code'
      });
    });

    it('should return a url using overriding the default settings', function () {
      var url = this.authok.buildLogoutUrl({
        clientID: '123',
        returnTo: 'http://page.com',
        federated: ''
      });

      expect(url).to.be(
        'https://me.authok.cn/v1/logout?client_id=123&returnTo=http%3A%2F%2Fpage.com&authokClient=' +
          encodeURIComponent(telemetryInfo) +
          '&federated'
      );
    });
  });

  context('getSSOData', function () {
    context('when outside of the hosted login page', function () {
      before(function () {
        this.authok = new Authentication(this.webAuthSpy, {
          domain: 'me.authok.cn',
          clientID: '...',
          redirectUri: 'http://page.com/callback',
          responseType: 'code',
          _sendTelemetry: false
        });
        sinon.stub(Storage.prototype, 'getItem').callsFake(function (key) {
          expect(key).to.be('authok.ssodata');
          return JSON.stringify({
            lastUsedConnection: 'lastUsedConnection',
            lastUsedUsername: 'lastUsedUsername',
            lastUsedSub: 'the-user-id'
          });
        });
      });
      after(function () {
        Storage.prototype.getItem.restore();
      });
      beforeEach(function () {
        sinon.stub(windowHelper, 'getWindow').callsFake(function () {
          return { location: { host: 'other-domain.authok.cn' } };
        });
      });
      afterEach(function () {
        windowHelper.getWindow.restore();
      });
      it('fails if callback is not a function', function () {
        var _this = this;
        expect(function () {
          _this.authok.getSSOData(null, null);
        }).to.throwError();
      });
      it('works if callback is the second param', function (done) {
        this.authok.getSSOData(null, function (err, result) {
          done();
        });

        this.webAuthSpy.checkSession.lastCall.args[1](null, {
          idTokenPayload: { sub: 'some-other-id' }
        });
      });
      it('uses correct scope and responseType', function () {
        this.authok.getSSOData(function () {});
        expect(this.webAuthSpy.checkSession.lastCall.args[0]).to.be.eql({
          responseType: 'token id_token',
          scope: 'openid profile email',
          connection: 'lastUsedConnection',
          timeout: 5000
        });
      });
      it('returns sso:false if checkSession fails', function (done) {
        this.authok.getSSOData(function (err, result) {
          expect(err).to.be.eql({ some: 'error' });
          expect(result).to.be.eql({ sso: false });
          done();
        });

        this.webAuthSpy.checkSession.lastCall.args[1]({ some: 'error' });
      });
      it("returns sso:false if lastUsedSub is different from checkSesion's sub", function (done) {
        this.authok.getSSOData(function (err, result) {
          expect(err).to.be.eql(null);
          expect(result).to.be.eql({ sso: false });
          done();
        });

        this.webAuthSpy.checkSession.lastCall.args[1](null, {
          idTokenPayload: { sub: 'some-other-id' }
        });
      });
      it('do not return error if error === login_required', function (done) {
        this.authok.getSSOData(function (err, result) {
          expect(err).to.be(null);
          expect(result).to.be.eql({ sso: false });
          done();
        });

        this.webAuthSpy.checkSession.lastCall.args[1]({
          error: 'login_required',
          error_description: 'foobar'
        });
      });
      it('provides a better description for consent_required error', function (done) {
        this.authok.getSSOData(function (err, result) {
          expect(err).to.be.eql({
            error: 'consent_required',
            error_description:
              'Consent required. When using `getSSOData`, the user has to be authenticated with the following scope: `openid profile email`.'
          });
          expect(result).to.be.eql({ sso: false });
          done();
        });

        this.webAuthSpy.checkSession.lastCall.args[1]({
          error: 'consent_required',
          error_description: 'foobar'
        });
      });
      it('returns ssoData object with lastUsedConnection and idTokenPayload.name when there is no idTokenPayload.email', function (done) {
        this.authok.getSSOData(function (err, result) {
          expect(err).to.be(null);
          expect(result).to.be.eql({
            lastUsedConnection: { name: 'lastUsedConnection' },
            lastUsedUserID: 'the-user-id',
            lastUsedUsername: 'last-used-user-name',
            lastUsedClientID: '...',
            sessionClients: ['...'],
            sso: true
          });
          done();
        });

        this.webAuthSpy.checkSession.lastCall.args[1](null, {
          idTokenPayload: { sub: 'the-user-id', name: 'last-used-user-name' }
        });
      });
      it('returns ssoData object with lastUsedConnection and idTokenPayload.email by default', function (done) {
        this.authok.getSSOData(function (err, result) {
          expect(err).to.be(null);
          expect(result).to.be.eql({
            lastUsedConnection: { name: 'lastUsedConnection' },
            lastUsedUserID: 'the-user-id',
            lastUsedUsername: 'last-used-user-email',
            lastUsedClientID: '...',
            sessionClients: ['...'],
            sso: true
          });
          done();
        });

        this.webAuthSpy.checkSession.lastCall.args[1](null, {
          idTokenPayload: {
            sub: 'the-user-id',
            email: 'last-used-user-email',
            name: 'do not use me'
          }
        });
      });
    });

    context('when inside of the hosted login page', function () {
      before(function () {
        this.authok = new Authentication(this.webAuthSpy, {
          domain: 'me.authok.cn',
          clientID: '...',
          redirectUri: 'http://page.com/callback',
          responseType: 'code',
          _sendTelemetry: false
        });
      });
      beforeEach(function () {
        sinon.stub(windowHelper, 'getWindow').callsFake(function () {
          return { location: { host: 'me.authok.cn' } };
        });
      });
      afterEach(function () {
        windowHelper.getWindow.restore();
      });
      it('calls webauth._universalLogin.getSSOData with same params', function () {
        this.authok.getSSOData('withActiveDirectories', 'cb');
        expect(
          this.webAuthSpy._universalLogin.getSSOData.lastCall.args
        ).to.be.eql(['withActiveDirectories', 'cb']);
      });
    });
  });

  context('userInfo', function () {
    before(function () {
      this.authok = new Authentication(this.webAuthSpy, {
        domain: 'me.authok.cn',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    afterEach(function () {
      request.get.restore();
    });

    it('should call userinfo with the access token', function (done) {
      sinon.stub(request, 'get').callsFake(function (url) {
        expect(url).to.be('https://me.authok.cn/userinfo');
        return new RequestMock({
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer abcd1234'
          },
          cb: function (cb) {
            cb(null, {
              body: {
                user_id: '...',
                provider: 'authok',
                connection: 'Username-Password-Authentication',
                is_social: false
              }
            });
          }
        });
      });

      this.authok.userInfo('abcd1234', function (err, data) {
        expect(err).to.be(null);
        expect(data).to.eql({
          user_id: '...',
          provider: 'authok',
          connection: 'Username-Password-Authentication',
          is_social: false
        });
        done();
      });
    });
  });

  context('delegation', function () {
    before(function () {
      this.authok = new Authentication(this.webAuthSpy, {
        domain: 'me.authok.cn',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    afterEach(function () {
      request.post.restore();
    });

    it('should call delegation with all the options', function (done) {
      sinon.stub(request, 'post').callsFake(function (url) {
        expect(url).to.be('https://me.authok.cn/delegation');
        return new RequestMock({
          body: {
            client_id: '...',
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            refresh_token: 'your_refresh_token',
            api_type: 'app'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function (cb) {
            cb(null, {
              body: {
                token_type: 'Bearer',
                expires_in: 36000,
                id_token: 'eyJ...'
              }
            });
          }
        });
      });

      this.authok.delegation(
        {
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          refresh_token: 'your_refresh_token',
          api_type: 'app'
        },
        function (err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({
            tokenType: 'Bearer',
            expiresIn: 36000,
            idToken: 'eyJ...'
          });
          done();
        }
      );
    });
  });

  context('login', function () {
    before(function () {
      this.authok = new Authentication(this.webAuthSpy, {
        domain: 'me.authok.cn',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    afterEach(function () {
      this.authok.oauthToken.restore();
    });

    it('should call oauthToken with all the options', function (done) {
      sinon.stub(this.authok, 'oauthToken').callsFake(function (options, cb) {
        expect(options).to.eql({
          username: 'someUsername',
          password: '123456',
          grantType: 'password'
        });
        cb();
      });

      this.authok.loginWithDefaultDirectory(
        {
          username: 'someUsername',
          password: '123456'
        },
        function (err, data) {
          done();
        }
      );
    });

    it('should call oauthToken with all the options', function (done) {
      sinon.stub(this.authok, 'oauthToken').callsFake(function (options, cb) {
        expect(options).to.eql({
          username: 'someUsername',
          password: '123456',
          grantType: 'http://authok.cn/oauth/grant-type/password-realm',
          realm: 'pepe.com'
        });
        cb();
      });

      this.authok.login(
        {
          username: 'someUsername',
          password: '123456',
          realm: 'pepe.com'
        },
        function (err, data) {
          done();
        }
      );
    });
  });

  context('challenge', function () {
    context('when the client does not have state', function () {
      before(function () {
        this.authok = new Authentication(this.webAuthSpy, {
          domain: 'me.authok.cn',
          clientID: '...',
          redirectUri: 'http://page.com/callback',
          responseType: 'code',
          _sendTelemetry: false
        });
      });

      it('should return nothing', function (done) {
        this.authok.getChallenge((err, challenge) => {
          expect(err).to.not.be.ok();
          expect(challenge).to.not.be.ok();
          done();
        });
      });
    });

    context('when the client has state', function () {
      before(function () {
        this.authok = new Authentication(this.webAuthSpy, {
          domain: 'me.authok.cn',
          clientID: '...',
          redirectUri: 'http://page.com/callback',
          responseType: 'code',
          _sendTelemetry: false,
          state: '123abc'
        });
      });

      afterEach(function () {
        request.post.restore();
      });

      it('should post state and returns the image/type', function (done) {
        sinon.stub(request, 'post').callsFake(function (url) {
          expect(url).to.be('https://me.authok.cn/usernamepassword/challenge');
          return new RequestMock({
            body: {
              state: '123abc'
            },
            headers: {
              'Content-Type': 'application/json'
            },
            cb: function (cb) {
              cb(null, {
                body: {
                  image: 'svg+yadayada',
                  type: 'code'
                }
              });
            }
          });
        });

        this.authok.getChallenge((err, challenge) => {
          expect(err).to.not.be.ok();
          expect(challenge.image).to.be('svg+yadayada');
          expect(challenge.type).to.be('code');
          done();
        });
      });

      it('should return the error if network fails', function (done) {
        sinon.stub(request, 'post').callsFake(function (url) {
          expect(url).to.be('https://me.authok.cn/usernamepassword/challenge');
          return new RequestMock({
            body: {
              state: '123abc'
            },
            headers: {
              'Content-Type': 'application/json'
            },
            cb: function (cb) {
              cb(new Error('error error error'));
            }
          });
        });

        this.authok.getChallenge((err, challenge) => {
          expect(err.original.message).to.equal('error error error');
          done();
        });
      });
    });
  });

  context('oauthToken', function () {
    before(function () {
      this.authok = new Authentication(this.webAuthSpy, {
        domain: 'me.authok.cn',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    afterEach(function () {
      request.post.restore();
    });

    it('should allow to login', function (done) {
      sinon.stub(request, 'post').callsFake(function (url) {
        expect(url).to.be('https://me.authok.cn/oauth/token');
        return new RequestMock({
          body: {
            client_id: '...',
            grant_type: 'password',
            username: 'someUsername',
            password: '123456'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function (cb) {
            cb(null, {
              body: {
                token_type: 'Bearer',
                expires_in: 36000,
                id_token: 'eyJ...'
              }
            });
          }
        });
      });

      this.authok.oauthToken(
        {
          username: 'someUsername',
          password: '123456',
          grantType: 'password'
        },
        function (err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({
            tokenType: 'Bearer',
            expiresIn: 36000,
            idToken: 'eyJ...'
          });
          done();
        }
      );
    });
  });

  context('getUserCountry', function () {
    before(function () {
      this.authok = new Authentication(this.webAuthSpy, {
        domain: 'me.authok.cn',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    afterEach(function () {
      request.get.restore();
    });

    it('should return the user country code', function (done) {
      sinon.stub(request, 'get').callsFake(function (url) {
        expect(url).to.be('https://me.authok.cn/user/geoloc/country');
        return new RequestMock({
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function (cb) {
            cb(null, {
              body: {
                country_code: 'AR'
              }
            });
          }
        });
      });

      this.authok.getUserCountry(function (err, data) {
        expect(err).to.be(null);
        expect(data).to.eql({
          countryCode: 'AR'
        });
        done();
      });
    });
  });
});
