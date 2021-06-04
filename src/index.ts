'use strict';

import path from 'path';
import customResolvePackagePath from './resolve-package-path';

const ALLOWED_ERROR_CODES: { [key: string]: boolean } = {
  // resolve package error codes
  MODULE_NOT_FOUND: true,

  // Yarn PnP Error Codes
  UNDECLARED_DEPENDENCY: true,
  MISSING_PEER_DEPENDENCY: true,
  MISSING_DEPENDENCY: true,
};

import CacheGroup = require('./cache-group');
import Cache = require('./cache');
const getRealFilePath = customResolvePackagePath._getRealFilePath;
const getRealDirectoryPath = customResolvePackagePath._getRealDirectoryPath;
const __findUpPackagePath = customResolvePackagePath._findUpPackagePath;

let CACHE = new CacheGroup();
let FIND_UP_CACHE = new Cache();
let pnp: any;

try {
  // eslint-disable-next-line node/no-missing-require
  pnp = require('pnpapi');
} catch (error) {
  // not in Yarn PnP; not a problem
}

/**
 * Search each directory in the absolute path `baseDir`, from leaf to root, for
 * a `package.json`, and return the first match, or `null` if no `package.json`
 * was found.
 *
 * @public
 * @param {string} baseDir - an absolute path in which to search for a `package.json`
 * @param {CacheGroup|boolean} [_cache] (optional)
 *  * if true: will choose the default global cache
 *  * if false: will not cache
 *  * if undefined or omitted, will choose the default global cache
 *  * otherwise we assume the argument is an external cache of the form provided by resolve-package-path/lib/cache-group.js
 *
 * @return {string|null} a full path to the resolved package.json if found or null if not
 */
function _findUpPackagePath(baseDir: string, _cache?: Cache | boolean) {
  let cache;
  if (_cache === undefined || _cache === null || _cache === true) {
    // if no cache specified, or if cache is true then use the global cache
    cache = FIND_UP_CACHE;
  } else if (_cache === false) {
    // if cache is explicity false, create a throw-away cache;
    cache = new Cache();
  } else {
    // otherwise, assume the user has provided an alternative cache for the following form:
    // provided by resolve-package-path/lib/cache-group.js
    cache = _cache;
  }

  let absoluteStart = path.resolve(baseDir);

  return __findUpPackagePath(cache, absoluteStart);
}

/*
 * @public
 *
 * @method resolvePackagePathSync
 * @param {string} name name of the dependency module.
 * @param {string} baseDir root dir to run the resolve from
 * @param {Boolean|CustomCache} (optional)
 *  * if true: will choose the default global cache
 *  * if false: will not cache
 *  * if undefined or omitted, will choose the default global cache
 *  * otherwise we assume the argument is an external cache of the form provided by resolve-package-path/lib/cache-group.js
 *
 * @return {string|null} a full path to the resolved package.json if found or null if not
 */
export = resolvePackagePath;
function resolvePackagePath(
  target: string,
  baseDir: string,
  _cache?: CacheGroup | boolean,
): string | null {
  let cache;

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

  if (baseDir.charAt(baseDir.length - 1) !== path.sep) {
    baseDir = `${baseDir}${path.sep}`;
  }

  const key = target + '\x00' + baseDir;

  let pkgPath;

  if (cache.PATH.has(key)) {
    pkgPath = cache.PATH.get(key);
  } else {
    try {
      // the custom `pnp` code here can be removed when yarn 1.13 is the
      // current release. This is due to Yarn 1.13 and resolve interoperating
      // together seamlessly.
      pkgPath = pnp
        ? pnp.resolveToUnqualified(target + '/package.json', baseDir)
        : customResolvePackagePath(cache, target, baseDir);
    } catch (e) {
      if (e !== null && typeof e === 'object') {
        const code: keyof typeof ALLOWED_ERROR_CODES = e.code;
        if (ALLOWED_ERROR_CODES[code] === true) {
          pkgPath = null;
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }

    cache.PATH.set(key, pkgPath);
  }
  return pkgPath;
}

resolvePackagePath._resetCache = function () {
  CACHE = new CacheGroup();
  FIND_UP_CACHE = new Cache();
};
// eslint-disable-next-line no-redeclare
module resolvePackagePath {
  export let _CACHE: CacheGroup;
  export let _FIND_UP_CACHE = FIND_UP_CACHE;
  export let findUpPackagePath = _findUpPackagePath;
}
Object.defineProperty(resolvePackagePath, '_CACHE', {
  get: function () {
    return CACHE;
  },
});
Object.defineProperty(resolvePackagePath, '_FIND_UP_CACHE', {
  get: function () {
    return FIND_UP_CACHE;
  },
});

resolvePackagePath.getRealFilePath = function (filePath: string) {
  return getRealFilePath(CACHE.REAL_FILE_PATH, filePath);
};

resolvePackagePath.getRealDirectoryPath = function (directoryPath: string) {
  return getRealDirectoryPath(CACHE.REAL_DIRECTORY_PATH, directoryPath);
};
