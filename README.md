# fast-resolve-package [![Build Status](https://travis-ci.org/stefanpenner/fast-resolve-package.svg?branch=master)](https://travis-ci.org/stefanpenner/fast-resolve-package) [![Build status](https://ci.appveyor.com/api/projects/status/p8pf9rohgoa7u6il?svg=true)](https://ci.appveyor.com/project/embercli/fast-resolve-package)

This project is special purpose made, to resolve package.json's given a specific module name, and basedir to start searching from. It cannot and does not resolve anything else.

To achieve it's performance, it memoizes results identically to how node's `require` does. Specifically, for a given moduleName and baseDir it will, for the duration of the process, always return the exact same response.

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

### Inspecting the cache

```js
const resolve = require('fast-resolve-package');
resolve._CACHE // a JavaScript Map instance containing key => value of `${moduleName}\x00${baseDir}`;
```
