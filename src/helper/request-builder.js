/* eslint-disable no-param-reassign */
import request from 'superagent';
import base64Url from './base64_url';
import version from '../version';
import objectHelper from './object';

// ------------------------------------------------ RequestWrapper

function RequestWrapper(req) {
  this.request = req;
  this.method = req.method;
  this.url = req.url;
  this.body = req._data;
  this.headers = req._header;
}

RequestWrapper.prototype.abort = function () {
  this.request.abort();
};

RequestWrapper.prototype.getMethod = function () {
  return this.method;
};

RequestWrapper.prototype.getBody = function () {
  return this.body;
};

RequestWrapper.prototype.getUrl = function () {
  return this.url;
};

RequestWrapper.prototype.getHeaders = function () {
  return this.headers;
};

// ------------------------------------------------ RequestObj

function RequestObj(req) {
  this.request = req;
}

RequestObj.prototype.set = function (key, value) {
  this.request = this.request.set(key, value);
  return this;
};

RequestObj.prototype.send = function (body) {
  this.request = this.request.send(objectHelper.trimUserDetails(body));
  return this;
};

RequestObj.prototype.withCredentials = function () {
  this.request = this.request.withCredentials();
  return this;
};

RequestObj.prototype.end = function (cb) {
  this.request.end(cb);
  return new RequestWrapper(this.request);
};

// ------------------------------------------------ RequestBuilder

function RequestBuilder(options) {
  this._sendTelemetry =
    options._sendTelemetry === false ? options._sendTelemetry : true;
  this._telemetryInfo = options._telemetryInfo || null;
  this._timesToRetryFailedRequests = options._timesToRetryFailedRequests;
  this.headers = options.headers || {};
  this._universalLoginPage = options.universalLoginPage;
}

RequestBuilder.prototype.setCommonConfiguration = function (
  ongoingRequest,
  options
) {
  options = options || {};

  if (this._timesToRetryFailedRequests > 0) {
    ongoingRequest = ongoingRequest.retry(this._timesToRetryFailedRequests);
  }

  if (options.noHeaders) {
    return ongoingRequest;
  }

  var headers = this.headers;
  ongoingRequest = ongoingRequest.set('Content-Type', 'application/json');

  if (options.xRequestLanguage) {
    ongoingRequest = ongoingRequest.set(
      'X-Request-Language',
      options.xRequestLanguage
    );
  }

  var keys = Object.keys(this.headers);

  for (var a = 0; a < keys.length; a++) {
    ongoingRequest = ongoingRequest.set(keys[a], headers[keys[a]]);
  }

  if (this._sendTelemetry) {
    ongoingRequest = ongoingRequest.set(
      'authok-Client',
      this.getTelemetryData()
    );
  }

  return ongoingRequest;
};

RequestBuilder.prototype.getTelemetryData = function () {
  var telemetryName = this._universalLoginPage ? 'authok.js-ulp' : 'authok.js';
  var clientInfo = { name: telemetryName, version: version.raw };
  if (this._telemetryInfo) {
    clientInfo = objectHelper.extend({}, this._telemetryInfo);
    clientInfo.env = objectHelper.extend({}, this._telemetryInfo.env);
    clientInfo.env[telemetryName] = version.raw;
  }
  var jsonClientInfo = JSON.stringify(clientInfo);
  return base64Url.encode(jsonClientInfo);
};

RequestBuilder.prototype.get = function (url, options) {
  return new RequestObj(this.setCommonConfiguration(request.get(url), options));
};

RequestBuilder.prototype.post = function (url, options) {
  return new RequestObj(
    this.setCommonConfiguration(request.post(url), options)
  );
};

RequestBuilder.prototype.patch = function (url, options) {
  return new RequestObj(
    this.setCommonConfiguration(request.patch(url), options)
  );
};

export default RequestBuilder;
