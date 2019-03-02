'use strict';

function includes(array, entry) {
  var result = false;

  for (var  i =0; i < array.length; i++) {
    if (array[i] === entry) {
      return true;
    }
  }
  return false;
}
/*
 * utility to detect if node is respective symlinks or not
 */
module.exports = function(process) {
  return !!process.env.NODE_PRESERVE_SYMLINKS || includes(process.execArgv, '--preserve-symlinks');
};
