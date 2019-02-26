'use strict';
var path = require('path');
var assert = require('chai').assert;
var resolvePackagePath = require('../');
var _cache = resolvePackagePath._CACHE.MODULE_ENTRY;
var resolvePackagePath = require('../lib/resolve-package-path');
var Cache = require('../lib/cache');
var CacheGroup = require('../lib/cache-group');
var fixturesPath = path.join(__dirname, 'fixtures');

describe('resolvePackagePath', function() {

  describe('._findPackagePath', function() {
    // NOTE: _findPackagePath requires that 'dir' must be non-empty and valid.

    var FOO_PATH = path.join(fixturesPath, 'node_modules/foo/');  // result is OS-normalized
    var FOO_BAR_PATH = path.join(fixturesPath, 'node_modules/foo/node_modules/bar/');  // result is OS-normalized

    it('finds linked package.json', function() {
      var result = resolvePackagePath._findPackagePath(_cache,
                                                       'linked/node_modules/bar/package.json',
                                                       FOO_BAR_PATH);
      assert.equal(result,
                   path.join(fixturesPath, 'node_modules/linked/node_modules/bar/package.json'),
                   'should resolve link to real path package.json');
    });

    it('does not find invalid package.json file name', function() {
      var result = resolvePackagePath._findPackagePath(_cache,
                                                       'dedupped/package2.json',
                                                       FOO_BAR_PATH);
      assert.isNull(result, 'invalid package.json should return null');
    });

    it('does not find invalid package file name', function() {
      var result = resolvePackagePath._findPackagePath(_cache,
                                                       'dedupped2/package.json',
                                                       FOO_BAR_PATH);
      assert.isNull(result, 'invalid package filename should return null');
    });

    it('finds child package.json', function() {
      var result = resolvePackagePath._findPackagePath(_cache,
                                                       'bar/package.json',
                                                       FOO_PATH);
      assert.equal(result,
                   path.join(FOO_BAR_PATH, 'package.json'),
                   '"child" package.json should resolve correctly');
    });

    it('finds parent package.json', function() {
      var result = resolvePackagePath._findPackagePath(_cache,
                                                       'foo/package.json',
                                                       FOO_BAR_PATH);
      assert.equal(result,
                   path.join(FOO_PATH, 'package.json'),
                   '"parent" package.json should resolve correctly');
    });

    // Note: we do not need to provide a 'find self package.json' because this private function is only called
    // during resolvePackagePath when the path does not start with './'.

    it('finds uncle package.json', function() {
      var result = resolvePackagePath._findPackagePath(_cache,
                                                       'dedupped/package.json',
                                                       FOO_BAR_PATH);
      assert.equal(result,
                   path.join(fixturesPath, 'node_modules/dedupped/package.json'),
                   '"uncle" package.json should resolve correctly');
    });
  });

  describe('._getRealDirectoryPath', function() {
    var cache;
    var linkedDirPath = path.join(fixturesPath, 'node_modules', 'foo', 'node_modules', 'linked');
    var unlinkedDirPath = path.join(fixturesPath, 'node_modules', 'linked');

    beforeEach(function() {
      cache = new Cache()
    });

    it('resolves linked dir through link to unlinked dir', function() {
      var result = resolvePackagePath._getRealDirectoryPath(cache, linkedDirPath);
      assert.equal(result, unlinkedDirPath, 'link should resolve to real path package.json');
      assert.equal(cache.size, 1, 'cache should contain 1 entry');
      assert.equal(cache.get(linkedDirPath), unlinkedDirPath, 'cached entry from linked path should be to unlinked path');
    });

    it('resolves unlinked dir to itself', function() {
      var result1 = resolvePackagePath._getRealDirectoryPath(cache, linkedDirPath);  // repeat just to load an entry
      var result2 = resolvePackagePath._getRealDirectoryPath(cache, unlinkedDirPath);
      assert.equal(cache.size, 2, 'cache should now contain 2 entries');
      assert.equal(result1, result2, '2 cache entries should both have the same value (different keys)');
      assert.equal(result2, unlinkedDirPath, 'resolving the unlinked path should not change the value');
      assert.equal(cache.get(unlinkedDirPath), unlinkedDirPath, 'the cached value for the unlinked path should be to itself');
    });

    it('resolves an existing file as null (it is not a directory)', function() {
      var filePath = path.join(unlinkedDirPath, 'index.js');
      var result = resolvePackagePath._getRealDirectoryPath(cache, filePath);
      assert.isNull(result, 'reference to a file should return null');
      assert.isNull(cache.get(filePath), 'cache reference to file should return null');
    });

    it('resolves a non-existent path as null', function() {
      var result = resolvePackagePath._getRealDirectoryPath(cache, unlinkedDirPath + '2');
      assert.isNull(result, 'reference to a non-existent path correctly returns null');
    });
  });

  describe('._getRealFilePath', function() {
    // create a temporary cache to make sure that we're actually caching things.
    var cache;
    var linkedPkgPath = path.join(fixturesPath, 'node_modules', 'foo', 'node_modules', 'linked', 'package.json');
    var unlinkedPkgPath = path.join(fixturesPath, 'node_modules', 'linked', 'package.json');
    var dirPath = path.join(fixturesPath, 'node_modules', 'linked');

    beforeEach(function() {
      cache = new Cache();
    });
    
    it('resolves linked package.json through link to unlinked', function() {
      var result = resolvePackagePath._getRealFilePath(cache, linkedPkgPath);
      assert.equal(result, unlinkedPkgPath, 'link should resolve to real path package.json');
      assert.equal(cache.size, 1, 'cache should contain 1 entry');
      assert.equal(cache.get(linkedPkgPath), unlinkedPkgPath, 'cached entry from linked path should be to unlinked path');
    });
    
    it('resolves unlinked package.json to itself', function() {
      var result1 = resolvePackagePath._getRealFilePath(cache, linkedPkgPath);  // repeat just to load an entry
      var result2 = resolvePackagePath._getRealFilePath(cache, unlinkedPkgPath);
      assert.equal(cache.size, 2, 'cache should now contain 2 entries');
      assert.equal(result1, result2, '2 cache entries should both have the same value (different keys)');
      assert.equal(result2, unlinkedPkgPath, 'resolving the unlinked path should not change the value');
      assert.equal(cache.get(unlinkedPkgPath), unlinkedPkgPath, 'the cached value for the unlinked path should be to itself');
    });

    it('resolves an existing directory as null (it is not a file)', function() {
      var result = resolvePackagePath._getRealFilePath(cache, dirPath);
      assert.isNull(result, 'reference to a directory should return null');
      assert.isNull(cache.get(dirPath), 'cache reference to directory should return null');
    });

    it('resolves a non-existent path as null', function() {
      var result = resolvePackagePath._getRealFilePath(cache, dirPath + '2');
      assert.isNull(result, 'reference to a non-existent path correctly returns null');
    });
  });

  describe('resolvePackagePath', function() {
    var caches;
    var linkedDirPath = path.join(fixturesPath, 'node_modules', 'foo', 'node_modules', 'linked');
    var unlinkedDirPath = path.join(fixturesPath, 'node_modules', 'linked');
    var fooDirPath = path.join(fixturesPath, 'node_modules', 'foo');

    beforeEach(function() {
      caches = new CacheGroup();
    });

    it('no module name', function() {
      assert.throws(function() {return resolvePackagePath(caches, null, '/');}, TypeError);
    });

    it('invalid dir', function() {
      assert.throws(function() {return resolvePackagePath(caches, 'foo', 'abcd');}, TypeError);
    });

    it('linked directory as name', function() {
      var result = resolvePackagePath(caches, linkedDirPath, null);
      assert.equal(path.join(unlinkedDirPath, 'package.json'), result, 'should resolve to unlinked "linked/package.json"');
    });

    it('through linked directory as dir to node_modules package', function() {
      var result = resolvePackagePath(caches, 'bar', linkedDirPath);
      assert.equal(path.join(unlinkedDirPath, 'node_modules', 'bar', 'package.json'), result, 'should resolve to unlinked "linked/node_ odules/bar/package.json"');
    });

    it('.. relative path through "linked" directory', function() {
      var fooBarDirPath = path.join(fixturesPath, 'node_modules', 'foo', 'node_modules', 'bar');
      var result = resolvePackagePath(caches, '../linked', fooBarDirPath);
      assert.equal(path.join(unlinkedDirPath, 'package.json'), result, 'should resolve to unlinked "linked/package.json"');
    });

    it('. relative path ', function() {
      var fooNodeModulesDirPath = path.join(fixturesPath, 'node_modules', 'foo', 'node_modules');
      var result = resolvePackagePath(caches, '..', fooNodeModulesDirPath);
      assert.equal(path.join(fooDirPath, 'package.json'), result, 'should resolve to "foo/package.json"');
    });

    it('. relative empty path ', function() {
      var result = resolvePackagePath(caches, '.', fooDirPath);
      assert.equal(path.join(fooDirPath, 'package.json'), result, 'should resolve to "foo/package.json"');
    });
  });
});
