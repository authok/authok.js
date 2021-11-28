import expect from 'expect.js';

import * as authok from '../src/index';
import authokDefault from '../src/index';

describe('Exports the correct objects', () => {
  it('should export raw objects', () => {
    expect(Object.keys(authok)).to.be.eql([
      'Authentication',
      'Management',
      'WebAuth',
      'version',
      'default'
    ]);
  });
  it('should export default object', () => {
    expect(Object.keys(authokDefault)).to.be.eql([
      'Authentication',
      'Management',
      'WebAuth',
      'version'
    ]);
  });
});
