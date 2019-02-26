'use strict';

const resolvePackagePathSync = require('./');
const Project = require('fixturify-project');
const fs = require('fs-extra');
const FIXTURE_ROOT = `${__dirname}/tmp/fixtures/`
const expect = require('chai').expect;

describe('fast-package-resolve', function() {
  beforeEach(function() {
    fs.removeSync(FIXTURE_ROOT);
  });

  afterEach(function() {
    fs.removeSync(FIXTURE_ROOT);
  });

  it('ok', function() {
    let rsvp;
    let a;
    let orange;
    let apple;
    const app = new Project('app', '3.1.1',  app => {
      rsvp = app.addDependency('rsvp', '3.2.2', rsvp => {
        a = rsvp.addDependency('a', '1.1.1');
      });
      orange = app.addDependency('orange', '1.0.0');
      apple = app.addDependency('apple', '1.0.0');
    });

    app.writeSync();

    expect(resolvePackagePathSync('app',    app.root)).    to.eql(null);
    expect(resolvePackagePathSync('rsvp',   app.baseDir)). to.eql(`${app.root}/app/node_modules/rsvp/package.json`);
    expect(resolvePackagePathSync('orange', app.baseDir)). to.eql(`${app.root}/app/node_modules/orange/package.json`);
    expect(resolvePackagePathSync('apple',  app.baseDir)). to.eql(`${app.root}/app/node_modules/apple/package.json`);
    expect(resolvePackagePathSync('a',      app.baseDir)). to.eql(null);
    expect(resolvePackagePathSync('a',      rsvp.baseDir)).to.eql(`${rsvp.baseDir}/node_modules/a/package.json`);
    expect(resolvePackagePathSync('rsvp',   a.baseDir)).   to.eql(`${rsvp.baseDir}/package.json`);
    expect(resolvePackagePathSync('orange', a.baseDir)).   to.eql(`${orange.baseDir}/package.json`);
    expect(resolvePackagePathSync('apple',  a.baseDir)).   to.eql(`${apple.baseDir}/package.json`);
    expect(resolvePackagePathSync('app',    a.baseDir)).   to.eql(null);
  });
});
