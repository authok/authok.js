import expect from 'expect.js';

import sinon from 'sinon';

import RequestMock from '../mock/request-mock';

import request from 'superagent';

import Management from '../../src/management';

describe('authok.Management', function () {
  describe('initialization', function () {
    it('should check that options is passed', function () {
      expect(function () {
        var authok = new Management();
      }).to.throwException(function (e) {
        expect(e.message).to.be('options parameter is not valid');
      });
    });

    it('should check that domain is set', function () {
      expect(function () {
        var authok = new Management({ token: '...' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('domain option is required');
      });
    });

    it('should check that token is set', function () {
      expect(function () {
        var authok = new Management({ domain: 'me.authok.cn' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('token option is required');
      });
    });
  });

  context('getUser options', function () {
    before(function () {
      this.authok = new Management({
        domain: 'me.authok.cn',
        token: '...',
        _sendTelemetry: false
      });
    });

    it('should check that userId is valid', function () {
      expect(() => {
        this.authok.getUser();
      }).to.throwException(function (e) {
        expect(e.message).to.be('userId parameter is not valid');
      });
    });

    it('should check that cb is valid', function () {
      expect(() => {
        this.authok.getUser('...');
      }).to.throwException(function (e) {
        expect(e.message).to.be('cb parameter is not valid');
      });
    });
  });

  context('getUser', function () {
    before(function () {
      this.authok = new Management({
        domain: 'me.authok.cn',
        token: 'the_token',
        _sendTelemetry: false
      });
    });

    afterEach(function () {
      request.get.restore();
    });

    it('should fetch the user from the api', function (done) {
      sinon.stub(request, 'get').callsFake(function (url) {
        expect(url).to.be('https://me.authok.cn/api/v2/users/authok|123');
        return new RequestMock({
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer the_token'
          },
          cb: function (cb) {
            cb(null, {
              body: {
                user_id: 'authok|123',
                email: 'me@example.com'
              }
            });
          }
        });
      });

      this.authok.getUser('authok|123', function (err, user) {
        expect(err).to.be(null);
        expect(user).to.eql({
          user_id: 'authok|123',
          email: 'me@example.com'
        });
        done();
      });
    });
  });

  context('patchUserMetadata options', function () {
    before(function () {
      this.authok = new Management({
        domain: 'me.authok.cn',
        token: '...',
        _sendTelemetry: false
      });
    });

    it('should check that userId is valid', function () {
      expect(() => {
        this.authok.patchUserMetadata();
      }).to.throwException(function (e) {
        expect(e.message).to.be('userId parameter is not valid');
      });
    });

    it('should check that userMetadata is valid', function () {
      expect(() => {
        this.authok.patchUserMetadata('...');
      }).to.throwException(function (e) {
        expect(e.message).to.be('userMetadata parameter is not valid');
      });
    });

    it('should check that cb is valid', function () {
      expect(() => {
        this.authok.patchUserMetadata('...', {});
      }).to.throwException(function (e) {
        expect(e.message).to.be('cb parameter is not valid');
      });
    });
  });

  context('patchUserMetadata', function () {
    before(function () {
      this.authok = new Management({
        domain: 'me.authok.cn',
        token: 'the_token',
        _sendTelemetry: false
      });
    });

    afterEach(function () {
      request.patch.restore();
    });

    it('should fetch the user from the api', function (done) {
      sinon.stub(request, 'patch').callsFake(function (url) {
        expect(url).to.be('https://me.authok.cn/api/v2/users/authok|123');
        return new RequestMock({
          body: {
            user_metadata: { role: 'admin' }
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer the_token'
          },
          cb: function (cb) {
            cb(null, {
              body: {
                user_id: 'authok|123',
                email: 'me@example.com',
                user_metadata: { role: 'admin' }
              }
            });
          }
        });
      });

      this.authok.patchUserMetadata(
        'authok|123',
        { role: 'admin' },
        function (err, user) {
          expect(err).to.be(null);
          expect(user).to.eql({
            user_id: 'authok|123',
            email: 'me@example.com',
            user_metadata: { role: 'admin' }
          });
          done();
        }
      );
    });
  });

  context('patchUserAttributes options', function () {
    before(function () {
      this.authok = new Management({
        domain: 'me.authok.cn',
        token: '...',
        _sendTelemetry: false
      });
    });

    it('should check that userId is valid', function () {
      expect(() => {
        this.authok.patchUserAttributes();
      }).to.throwException(function (e) {
        expect(e.message).to.be('userId parameter is not valid');
      });
    });

    it('should check that user is valid', function () {
      expect(() => {
        this.authok.patchUserAttributes('...');
      }).to.throwException(function (e) {
        expect(e.message).to.be('user parameter is not valid');
      });
    });

    it('should check that cb is valid', function () {
      expect(() => {
        this.authok.patchUserAttributes('...', {});
      }).to.throwException(function (e) {
        expect(e.message).to.be('cb parameter is not valid');
      });
    });
  });

  context('patchUserAttributes', function () {
    before(function () {
      this.authok = new Management({
        domain: 'me.authok.cn',
        token: 'the_token',
        _sendTelemetry: false
      });
    });

    afterEach(function () {
      request.patch.restore();
    });

    it('should fetch the user from the api', function (done) {
      sinon.stub(request, 'patch').callsFake(function (url) {
        expect(url).to.be('https://me.authok.cn/api/v2/users/authok|123');
        return new RequestMock({
          body: {
            name: 'test name'
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer the_token'
          },
          cb: function (cb) {
            cb(null, {
              body: {
                user_id: 'authok|123',
                email: 'me@example.com',
                name: 'test name'
              }
            });
          }
        });
      });

      this.authok.patchUserAttributes(
        'authok|123',
        { name: 'test name' },
        function (err, user) {
          expect(err).to.be(null);
          expect(user).to.eql({
            user_id: 'authok|123',
            email: 'me@example.com',
            name: 'test name'
          });
          done();
        }
      );
    });
  });

  context('linkUsers options', function () {
    before(function () {
      this.authok = new Management({
        domain: 'me.authok.cn',
        token: '...',
        _sendTelemetry: false
      });
    });

    it('should check that userId is valid', function () {
      expect(() => {
        this.authok.linkUser();
      }).to.throwException(function (e) {
        expect(e.message).to.be('userId parameter is not valid');
      });
    });

    it('should check that secondaryUserToken is valid', function () {
      expect(() => {
        this.authok.linkUser('...');
      }).to.throwException(function (e) {
        expect(e.message).to.be('secondaryUserToken parameter is not valid');
      });
    });

    it('should check that cb is valid', function () {
      expect(() => {
        this.authok.linkUser('...', '...');
      }).to.throwException(function (e) {
        expect(e.message).to.be('cb parameter is not valid');
      });
    });
  });

  context('linkUsers', function () {
    before(function () {
      this.authok = new Management({
        domain: 'me.authok.cn',
        token: 'the_token',
        _sendTelemetry: false
      });
    });

    afterEach(function () {
      request.post.restore();
    });

    it('should fetch the user from the api', function (done) {
      sinon.stub(request, 'post').callsFake(function (url) {
        expect(url).to.be(
          'https://me.authok.cn/api/v2/users/twitter|191919191919191/identities'
        );
        return new RequestMock({
          body: {
            link_with: 'the_second_token'
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer the_token'
          },
          cb: function (cb) {
            cb(null, {
              body: [
                {
                  connection: 'twitter',
                  user_id: '191919191919191',
                  provider: 'twitter',
                  profile_data: {
                    email: '',
                    email_verified: false,
                    name: '',
                    username: 'johndoe',
                    given_name: '',
                    phone_number: '',
                    phone_verified: false,
                    family_name: ''
                  },
                  is_social: false,
                  access_token: ''
                }
              ]
            });
          }
        });
      });

      this.authok.linkUser(
        'twitter|191919191919191',
        'the_second_token',
        function (err, user) {
          expect(err).to.be(null);
          expect(user).to.eql([
            {
              connection: 'twitter',
              user_id: '191919191919191',
              provider: 'twitter',
              profile_data: {
                email: '',
                email_verified: false,
                name: '',
                username: 'johndoe',
                given_name: '',
                phone_number: '',
                phone_verified: false,
                family_name: ''
              },
              is_social: false,
              access_token: ''
            }
          ]);
          done();
        }
      );
    });
  });
});
