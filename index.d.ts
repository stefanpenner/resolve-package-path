import CacheGroup = require('./lib/cache-group');
export = resolvePackagePath;
declare function resolvePackagePath(target: string, basedir: string, _cache?: CacheGroup | boolean): any;
declare namespace resolvePackagePath {
    var _resetCache: () => void;
}
