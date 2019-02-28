'use strict';

var customResolvePackagePath = require('./lib/resolve-package-path');
var ALLOWED_ERROR_CODES = {
  // resolve package error codes
  MODULE_NOT_FOUND: true,

  // Yarn PnP Error Codes
  UNDECLARED_DEPENDENCY: true,
  MISSING_PEER_DEPENDENCY: true,
  MISSING_DEPENDENCY: true
};

var pnp;
var CacheGroup = require('./lib/cache-group');
var CACHE = new CacheGroup();

try {
  pnp = require('pnpapi');
} catch (error) {
  // not in Yarn PnP; not a problem
}

/*
 * @public
 *
 * @method resolvePackagePathSync
 * @param {string} name name of the dependency module.
 * @param {string} basedir root dir to run the resolve from
 * @param {Boolean|CustomCache} (optional)
 *  * if true: will choose the default global cache
 *  * if false: will not cache
 *  * if undefined or omitted, will choose the default global cache
 *  * otherwise we assume the argument is an external cache of the form provided by resolve-package-path/lib/cache-group.js
 *
 * @return {string|null} a full path to the resolved package.json if found or null if not
 */
module.exports = function resolvePackagePath(target, basedir, _cache) {
  var cache;

  if (_cache === undefined || _cache === null || _cache === true) {
    // if no cache specified, or if cache is true then use the global cache
    cache = CACHE;
  } else if (_cache === false) {
    // if cache is explicity false, create a throw-away cache;
    cache = new CacheGroup();
  } else {
    // otherwise, assume the user has provided an alternative cache for the following form:
    // provided by resolve-package-path/lib/cache-group.js
    cache = _cache;
  }

  var key = target + '\x00' + basedir;

  var pkgPath;

  if (cache.PATH.has(key)) {
    pkgPath = cache.PATH.get(key, pkgPath);
  } else {
    try {
      // the custom `pnp` code here can be removed when yarn 1.13 is the
      // current release. This is due to Yarn 1.13 and resolve interoperating
      // together seemlessly.
      pkgPath = pnp
        ? pnp.resolveToUnqualified( target + '/package.json', basedir)
        : customResolvePackagePath(cache, target, basedir);
    } catch (e) {
      if (ALLOWED_ERROR_CODES[e.code] === true) {
        pkgPath = null;
      } else {
        throw e;
      }
    }

    cache.PATH.set(key, pkgPath);
  }
  return pkgPath;
}

module.exports._resetCache = function() {
  CACHE = new CacheGroup();
};

Object.defineProperty(module.exports, '_CACHE', {
  get: function() {
    return CACHE;
  }
});
