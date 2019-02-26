'use strict';

const resolve = require('resolve');
const ALLOWED_ERROR_CODES = {
  // resolve package error codes
  MODULE_NOT_FOUND: true,

  // Yarn PnP Error Codes
  UNDECLARED_DEPENDENCY: true,
  MISSING_PEER_DEPENDENCY: true,
  MISSING_DEPENDENCY: true
};

let pnp;
let CACHE = new Map();

try {
  pnp = require('pnpapi');
} catch (error) {
  // not in Yarn PnP; not a problem
}

/*
 *
/* @public
 *
 * @method resolvePackagePathSync
 * @param {string} name name of the dependency module.
 * @param {string} basedir root dir to run the resolve from
 * @param {Boolean} shouldCache (optional) intended to bypass cache defaulting to true
 * @return {string|null} a full path to the resolved package.json if found or null if not
 */
module.exports = function resolvePackagePathSync(target, basedir, shouldCache = true) {
  let pkgPath;
  target = `${target}/package.json`;
  let key = `${target}\x00${basedir}`;

  if (shouldCache && CACHE.has(key)) {
    pkgPath = CACHE.get(key);
  } else {
    try {
      // the custom `pnp` code here can be removed when yarn 1.13 is the
      // current release this is due to Yarn 1.13 and resolve interoperating
      // together seemlessly
      pkgPath = pnp
        ? pnp.resolveToUnqualified(target, basedir)
        : resolve.sync(target, { basedir });
    } catch (e) {
      if (ALLOWED_ERROR_CODES[e.code] === true) {
        pkgPath = null;
      } else {
        throw e;
      }
    }

    if (shouldCache) {
      CACHE.set(key, pkgPath);
    }
  }
  return pkgPath;
}

module.exports._resetCache = function() {
  CACHE = new Map();
};
