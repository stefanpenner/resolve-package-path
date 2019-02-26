'use strict';

var resolvePackagePath = require('../');
var Project = require('fixturify-project');
var fs = require('fs-extra');
var FIXTURE_ROOT = `${__dirname}/tmp/fixtures/`
var expect = require('chai').expect;

describe('fast-package-resolve', function() {
  beforeEach(function() {
    fs.removeSync(FIXTURE_ROOT);
  });

  afterEach(function() {
    fs.removeSync(FIXTURE_ROOT);
  });

  it('exposes it\'s cache', function() {
    expect(resolvePackagePath._CACHE).to.be.ok;
    expect(resolvePackagePath._resetCache).to.be.a('function');
  });

  it('appears to reset cache', function() {
    resolvePackagePath._CACHE.PATH.set('hi', 1);
    expect(resolvePackagePath._CACHE.PATH.has('hi')).eql(true);
    resolvePackagePath._resetCache();
    expect(resolvePackagePath._CACHE.PATH.has('hi')).eql(false);
  });

  it('handles basic traditional NPM usage', function() {
    var rsvp;
    var a;
    var orange;
    var apple;
    var app = new Project('app', '3.1.1',  app => {
      rsvp = app.addDependency('rsvp', '3.2.2', rsvp => {
        a = rsvp.addDependency('a', '1.1.1');
      });
      orange = app.addDependency('orange', '1.0.0');
      apple = app.addDependency('apple', '1.0.0');
    });

    app.writeSync();

    expect(resolvePackagePath('app',    app.root)).    to.eql(null);
    expect(resolvePackagePath('rsvp',   app.baseDir)). to.eql(`${app.root}/app/node_modules/rsvp/package.json`);
    expect(resolvePackagePath('orange', app.baseDir)). to.eql(`${app.root}/app/node_modules/orange/package.json`);
    expect(resolvePackagePath('apple',  app.baseDir)). to.eql(`${app.root}/app/node_modules/apple/package.json`);
    expect(resolvePackagePath('a',      app.baseDir)). to.eql(null);
    expect(resolvePackagePath('a',      rsvp.baseDir)).to.eql(`${rsvp.baseDir}/node_modules/a/package.json`);
    expect(resolvePackagePath('rsvp',   a.baseDir)).   to.eql(`${rsvp.baseDir}/package.json`);
    expect(resolvePackagePath('orange', a.baseDir)).   to.eql(`${orange.baseDir}/package.json`);
    expect(resolvePackagePath('apple',  a.baseDir)).   to.eql(`${apple.baseDir}/package.json`);
    expect(resolvePackagePath('app',    a.baseDir)).   to.eql(null);
  });

  it.skip('handles yarn pnp usage', function() {
    // TODO: test this
  });
});
