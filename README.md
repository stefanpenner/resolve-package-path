# fast-resolve-package [![Build Status](https://travis-ci.org/stefanpenner/fast-resolve-package.svg?branch=master)](https://travis-ci.org/stefanpenner/fast-resolve-package) [![Build status](https://ci.appveyor.com/api/projects/status/p8pf9rohgoa7u6il?svg=true)](https://ci.appveyor.com/project/embercli/fast-resolve-package)

This project is special purpose made, to resolve package.json's given a
specific module name, and basedir to start searching from. It cannot and does
not resolve anything else.

To achieve its performance, to does 2 specific things:

* it memoizes results identically to how node's `require` does. Specifically,
for a given moduleName and baseDir it will, for the duration of the process,
always return the exact same response.
* it re-implements the require.resolve to only work for resolving package.json's. This cuts down unneeded IO. (based on @davecombs approach)

## usage

```sh
yarn add fast-resolve-package
```

```js
const resolve = require('fast-resolve-package');

resolve('rsvp', 'base-dir/to/start/the/node_resolution-algorithm-from') => // /path/to/rsvp.json or null
```


## advanced usage


### Disable default caching

Although by default `fast-resolve-package` caches or memoizes results, this feature can be disable:

```js
const resolve = require('fast-resolve-package');

resolve('rsvp', 'base-dir/to/start/the/node_resolution-algorithm-from', false) => // uncached result /path/to/rsvp.json or null
```

### purging the cache

```js
const resolve = require('fast-resolve-package');
resolve._resetCache();
```

### Providing an alternative cache

In some advanced circumtances, you may want to gain access to the cache to share between more systems.
In that case, a cache instance of the following form can be provided as a third argument:

cache = ``{
  RESOLVED_PACKAGE_PATH: new Map(),
  REAL_FILE_PATH: new Map(),
  REAL_DIRECTORY_PATH: new Map()
};


const resolvePackagePath = require('fast-resolve-package');
resolvePackagePath('rsvp', 'path/to/start/from', cache);
```
