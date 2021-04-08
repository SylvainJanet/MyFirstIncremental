/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/error-stack-parser/error-stack-parser.js":
/*!***************************************************************!*\
  !*** ./node_modules/error-stack-parser/error-stack-parser.js ***!
  \***************************************************************/
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function(root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

    /* istanbul ignore next */
    if (true) {
        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! stackframe */ "./node_modules/stackframe/stackframe.js")], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    } else {}
}(this, function ErrorStackParser(StackFrame) {
    'use strict';

    var FIREFOX_SAFARI_STACK_REGEXP = /(^|@)\S+\:\d+/;
    var CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+\:\d+|\(native\))/m;
    var SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code\])?$/;

    function _map(array, fn, thisArg) {
        if (typeof Array.prototype.map === 'function') {
            return array.map(fn, thisArg);
        } else {
            var output = new Array(array.length);
            for (var i = 0; i < array.length; i++) {
                output[i] = fn.call(thisArg, array[i]);
            }
            return output;
        }
    }

    function _filter(array, fn, thisArg) {
        if (typeof Array.prototype.filter === 'function') {
            return array.filter(fn, thisArg);
        } else {
            var output = [];
            for (var i = 0; i < array.length; i++) {
                if (fn.call(thisArg, array[i])) {
                    output.push(array[i]);
                }
            }
            return output;
        }
    }

    function _indexOf(array, target) {
        if (typeof Array.prototype.indexOf === 'function') {
            return array.indexOf(target);
        } else {
            for (var i = 0; i < array.length; i++) {
                if (array[i] === target) {
                    return i;
                }
            }
            return -1;
        }
    }

    return {
        /**
         * Given an Error object, extract the most information from it.
         *
         * @param {Error} error object
         * @return {Array} of StackFrames
         */
        parse: function ErrorStackParser$$parse(error) {
            if (typeof error.stacktrace !== 'undefined' || typeof error['opera#sourceloc'] !== 'undefined') {
                return this.parseOpera(error);
            } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
                return this.parseV8OrIE(error);
            } else if (error.stack) {
                return this.parseFFOrSafari(error);
            } else {
                throw new Error('Cannot parse given Error object');
            }
        },

        // Separate line and column numbers from a string of the form: (URI:Line:Column)
        extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
            // Fail-fast but return locations like "(native)"
            if (urlLike.indexOf(':') === -1) {
                return [urlLike];
            }

            var regExp = /(.+?)(?:\:(\d+))?(?:\:(\d+))?$/;
            var parts = regExp.exec(urlLike.replace(/[\(\)]/g, ''));
            return [parts[1], parts[2] || undefined, parts[3] || undefined];
        },

        parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
            var filtered = _filter(error.stack.split('\n'), function(line) {
                return !!line.match(CHROME_IE_STACK_REGEXP);
            }, this);

            return _map(filtered, function(line) {
                if (line.indexOf('(eval ') > -1) {
                    // Throw away eval information until we implement stacktrace.js/stackframe#8
                    line = line.replace(/eval code/g, 'eval').replace(/(\(eval at [^\()]*)|(\)\,.*$)/g, '');
                }
                var tokens = line.replace(/^\s+/, '').replace(/\(eval code/g, '(').split(/\s+/).slice(1);
                var locationParts = this.extractLocation(tokens.pop());
                var functionName = tokens.join(' ') || undefined;
                var fileName = _indexOf(['eval', '<anonymous>'], locationParts[0]) > -1 ? undefined : locationParts[0];

                return new StackFrame(functionName, undefined, fileName, locationParts[1], locationParts[2], line);
            }, this);
        },

        parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
            var filtered = _filter(error.stack.split('\n'), function(line) {
                return !line.match(SAFARI_NATIVE_CODE_REGEXP);
            }, this);

            return _map(filtered, function(line) {
                // Throw away eval information until we implement stacktrace.js/stackframe#8
                if (line.indexOf(' > eval') > -1) {
                    line = line.replace(/ line (\d+)(?: > eval line \d+)* > eval\:\d+\:\d+/g, ':$1');
                }

                if (line.indexOf('@') === -1 && line.indexOf(':') === -1) {
                    // Safari eval frames only have function names and nothing else
                    return new StackFrame(line);
                } else {
                    var tokens = line.split('@');
                    var locationParts = this.extractLocation(tokens.pop());
                    var functionName = tokens.join('@') || undefined;
                    return new StackFrame(functionName,
                        undefined,
                        locationParts[0],
                        locationParts[1],
                        locationParts[2],
                        line);
                }
            }, this);
        },

        parseOpera: function ErrorStackParser$$parseOpera(e) {
            if (!e.stacktrace || (e.message.indexOf('\n') > -1 &&
                e.message.split('\n').length > e.stacktrace.split('\n').length)) {
                return this.parseOpera9(e);
            } else if (!e.stack) {
                return this.parseOpera10(e);
            } else {
                return this.parseOpera11(e);
            }
        },

        parseOpera9: function ErrorStackParser$$parseOpera9(e) {
            var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
            var lines = e.message.split('\n');
            var result = [];

            for (var i = 2, len = lines.length; i < len; i += 2) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    result.push(new StackFrame(undefined, undefined, match[2], match[1], undefined, lines[i]));
                }
            }

            return result;
        },

        parseOpera10: function ErrorStackParser$$parseOpera10(e) {
            var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
            var lines = e.stacktrace.split('\n');
            var result = [];

            for (var i = 0, len = lines.length; i < len; i += 2) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    result.push(
                        new StackFrame(
                            match[3] || undefined,
                            undefined,
                            match[2],
                            match[1],
                            undefined,
                            lines[i]
                        )
                    );
                }
            }

            return result;
        },

        // Opera 10.65+ Error.stack very similar to FF/Safari
        parseOpera11: function ErrorStackParser$$parseOpera11(error) {
            var filtered = _filter(error.stack.split('\n'), function(line) {
                return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) && !line.match(/^Error created at/);
            }, this);

            return _map(filtered, function(line) {
                var tokens = line.split('@');
                var locationParts = this.extractLocation(tokens.pop());
                var functionCall = (tokens.shift() || '');
                var functionName = functionCall
                        .replace(/<anonymous function(: (\w+))?>/, '$2')
                        .replace(/\([^\)]*\)/g, '') || undefined;
                var argsRaw;
                if (functionCall.match(/\(([^\)]*)\)/)) {
                    argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, '$1');
                }
                var args = (argsRaw === undefined || argsRaw === '[arguments not available]') ?
                    undefined : argsRaw.split(',');
                return new StackFrame(
                    functionName,
                    args,
                    locationParts[0],
                    locationParts[1],
                    locationParts[2],
                    line);
            }, this);
        }
    };
}));



/***/ }),

/***/ "./node_modules/stack-generator/node_modules/stackframe/stackframe.js":
/*!****************************************************************************!*\
  !*** ./node_modules/stack-generator/node_modules/stackframe/stackframe.js ***!
  \****************************************************************************/
/***/ (function(module, exports) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function(root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

    /* istanbul ignore next */
    if (true) {
        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    } else {}
}(this, function() {
    'use strict';
    function _isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function _capitalize(str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
    }

    function _getter(p) {
        return function() {
            return this[p];
        };
    }

    var booleanProps = ['isConstructor', 'isEval', 'isNative', 'isToplevel'];
    var numericProps = ['columnNumber', 'lineNumber'];
    var stringProps = ['fileName', 'functionName', 'source'];
    var arrayProps = ['args'];
    var objectProps = ['evalOrigin'];

    var props = booleanProps.concat(numericProps, stringProps, arrayProps, objectProps);

    function StackFrame(obj) {
        if (!obj) return;
        for (var i = 0; i < props.length; i++) {
            if (obj[props[i]] !== undefined) {
                this['set' + _capitalize(props[i])](obj[props[i]]);
            }
        }
    }

    StackFrame.prototype = {
        getArgs: function() {
            return this.args;
        },
        setArgs: function(v) {
            if (Object.prototype.toString.call(v) !== '[object Array]') {
                throw new TypeError('Args must be an Array');
            }
            this.args = v;
        },

        getEvalOrigin: function() {
            return this.evalOrigin;
        },
        setEvalOrigin: function(v) {
            if (v instanceof StackFrame) {
                this.evalOrigin = v;
            } else if (v instanceof Object) {
                this.evalOrigin = new StackFrame(v);
            } else {
                throw new TypeError('Eval Origin must be an Object or StackFrame');
            }
        },

        toString: function() {
            var fileName = this.getFileName() || '';
            var lineNumber = this.getLineNumber() || '';
            var columnNumber = this.getColumnNumber() || '';
            var functionName = this.getFunctionName() || '';
            if (this.getIsEval()) {
                if (fileName) {
                    return '[eval] (' + fileName + ':' + lineNumber + ':' + columnNumber + ')';
                }
                return '[eval]:' + lineNumber + ':' + columnNumber;
            }
            if (functionName) {
                return functionName + ' (' + fileName + ':' + lineNumber + ':' + columnNumber + ')';
            }
            return fileName + ':' + lineNumber + ':' + columnNumber;
        }
    };

    StackFrame.fromString = function StackFrame$$fromString(str) {
        var argsStartIndex = str.indexOf('(');
        var argsEndIndex = str.lastIndexOf(')');

        var functionName = str.substring(0, argsStartIndex);
        var args = str.substring(argsStartIndex + 1, argsEndIndex).split(',');
        var locationString = str.substring(argsEndIndex + 1);

        if (locationString.indexOf('@') === 0) {
            var parts = /@(.+?)(?::(\d+))?(?::(\d+))?$/.exec(locationString, '');
            var fileName = parts[1];
            var lineNumber = parts[2];
            var columnNumber = parts[3];
        }

        return new StackFrame({
            functionName: functionName,
            args: args || undefined,
            fileName: fileName,
            lineNumber: lineNumber || undefined,
            columnNumber: columnNumber || undefined
        });
    };

    for (var i = 0; i < booleanProps.length; i++) {
        StackFrame.prototype['get' + _capitalize(booleanProps[i])] = _getter(booleanProps[i]);
        StackFrame.prototype['set' + _capitalize(booleanProps[i])] = (function(p) {
            return function(v) {
                this[p] = Boolean(v);
            };
        })(booleanProps[i]);
    }

    for (var j = 0; j < numericProps.length; j++) {
        StackFrame.prototype['get' + _capitalize(numericProps[j])] = _getter(numericProps[j]);
        StackFrame.prototype['set' + _capitalize(numericProps[j])] = (function(p) {
            return function(v) {
                if (!_isNumber(v)) {
                    throw new TypeError(p + ' must be a Number');
                }
                this[p] = Number(v);
            };
        })(numericProps[j]);
    }

    for (var k = 0; k < stringProps.length; k++) {
        StackFrame.prototype['get' + _capitalize(stringProps[k])] = _getter(stringProps[k]);
        StackFrame.prototype['set' + _capitalize(stringProps[k])] = (function(p) {
            return function(v) {
                this[p] = String(v);
            };
        })(stringProps[k]);
    }

    return StackFrame;
}));


/***/ }),

/***/ "./node_modules/stack-generator/stack-generator.js":
/*!*********************************************************!*\
  !*** ./node_modules/stack-generator/stack-generator.js ***!
  \*********************************************************/
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

    /* istanbul ignore next */
    if (true) {
        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! stackframe */ "./node_modules/stack-generator/node_modules/stackframe/stackframe.js")], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    } else {}
}(this, function (StackFrame) {
    return {
        backtrace: function StackGenerator$$backtrace(opts) {
            var stack = [];
            var maxStackSize = 10;

            if (typeof opts === 'object' && typeof opts.maxStackSize === 'number') {
                maxStackSize = opts.maxStackSize;
            }

            var curr = arguments.callee;
            while (curr && stack.length < maxStackSize) {
                // Allow V8 optimizations
                var args = new Array(curr['arguments'].length);
                for(var i = 0; i < args.length; ++i) {
                    args[i] = curr['arguments'][i];
                }
                if (/function(?:\s+([\w$]+))+\s*\(/.test(curr.toString())) {
                    stack.push(new StackFrame({functionName: RegExp.$1 || undefined, args: args}));
                } else {
                    stack.push(new StackFrame({args: args}));
                }

                try {
                    curr = curr.caller;
                } catch (e) {
                    break;
                }
            }
            return stack;
        }
    };
}));


/***/ }),

/***/ "./node_modules/stackframe/stackframe.js":
/*!***********************************************!*\
  !*** ./node_modules/stackframe/stackframe.js ***!
  \***********************************************/
/***/ (function(module, exports) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

    /* istanbul ignore next */
    if (true) {
        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    } else {}
}(this, function () {
    'use strict';
    function _isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function StackFrame(functionName, args, fileName, lineNumber, columnNumber, source) {
        if (functionName !== undefined) {
            this.setFunctionName(functionName);
        }
        if (args !== undefined) {
            this.setArgs(args);
        }
        if (fileName !== undefined) {
            this.setFileName(fileName);
        }
        if (lineNumber !== undefined) {
            this.setLineNumber(lineNumber);
        }
        if (columnNumber !== undefined) {
            this.setColumnNumber(columnNumber);
        }
        if (source !== undefined) {
            this.setSource(source);
        }
    }

    StackFrame.prototype = {
        getFunctionName: function () {
            return this.functionName;
        },
        setFunctionName: function (v) {
            this.functionName = String(v);
        },

        getArgs: function () {
            return this.args;
        },
        setArgs: function (v) {
            if (Object.prototype.toString.call(v) !== '[object Array]') {
                throw new TypeError('Args must be an Array');
            }
            this.args = v;
        },

        // NOTE: Property name may be misleading as it includes the path,
        // but it somewhat mirrors V8's JavaScriptStackTraceApi
        // https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi and Gecko's
        // http://mxr.mozilla.org/mozilla-central/source/xpcom/base/nsIException.idl#14
        getFileName: function () {
            return this.fileName;
        },
        setFileName: function (v) {
            this.fileName = String(v);
        },

        getLineNumber: function () {
            return this.lineNumber;
        },
        setLineNumber: function (v) {
            if (!_isNumber(v)) {
                throw new TypeError('Line Number must be a Number');
            }
            this.lineNumber = Number(v);
        },

        getColumnNumber: function () {
            return this.columnNumber;
        },
        setColumnNumber: function (v) {
            if (!_isNumber(v)) {
                throw new TypeError('Column Number must be a Number');
            }
            this.columnNumber = Number(v);
        },

        getSource: function () {
            return this.source;
        },
        setSource: function (v) {
            this.source = String(v);
        },

        toString: function() {
            var functionName = this.getFunctionName() || '{anonymous}';
            var args = '(' + (this.getArgs() || []).join(',') + ')';
            var fileName = this.getFileName() ? ('@' + this.getFileName()) : '';
            var lineNumber = _isNumber(this.getLineNumber()) ? (':' + this.getLineNumber()) : '';
            var columnNumber = _isNumber(this.getColumnNumber()) ? (':' + this.getColumnNumber()) : '';
            return functionName + args + fileName + lineNumber + columnNumber;
        }
    };

    return StackFrame;
}));


/***/ }),

/***/ "./node_modules/stacktrace-gps/node_modules/source-map/lib/array-set.js":
/*!******************************************************************************!*\
  !*** ./node_modules/stacktrace-gps/node_modules/source-map/lib/array-set.js ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = __webpack_require__(/*! ./util */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/util.js");
var has = Object.prototype.hasOwnProperty;

/**
 * A data structure which is a combination of an array and a set. Adding a new
 * member is O(1), testing for membership is O(1), and finding the index of an
 * element is O(1). Removing elements from the set is not supported. Only
 * strings are supported for membership.
 */
function ArraySet() {
  this._array = [];
  this._set = Object.create(null);
}

/**
 * Static method for creating ArraySet instances from an existing array.
 */
ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
  var set = new ArraySet();
  for (var i = 0, len = aArray.length; i < len; i++) {
    set.add(aArray[i], aAllowDuplicates);
  }
  return set;
};

/**
 * Return how many unique items are in this ArraySet. If duplicates have been
 * added, than those do not count towards the size.
 *
 * @returns Number
 */
ArraySet.prototype.size = function ArraySet_size() {
  return Object.getOwnPropertyNames(this._set).length;
};

/**
 * Add the given string to this set.
 *
 * @param String aStr
 */
ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
  var sStr = util.toSetString(aStr);
  var isDuplicate = has.call(this._set, sStr);
  var idx = this._array.length;
  if (!isDuplicate || aAllowDuplicates) {
    this._array.push(aStr);
  }
  if (!isDuplicate) {
    this._set[sStr] = idx;
  }
};

/**
 * Is the given string a member of this set?
 *
 * @param String aStr
 */
ArraySet.prototype.has = function ArraySet_has(aStr) {
  var sStr = util.toSetString(aStr);
  return has.call(this._set, sStr);
};

/**
 * What is the index of the given string in the array?
 *
 * @param String aStr
 */
ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
  var sStr = util.toSetString(aStr);
  if (has.call(this._set, sStr)) {
    return this._set[sStr];
  }
  throw new Error('"' + aStr + '" is not in the set.');
};

/**
 * What is the element at the given index?
 *
 * @param Number aIdx
 */
ArraySet.prototype.at = function ArraySet_at(aIdx) {
  if (aIdx >= 0 && aIdx < this._array.length) {
    return this._array[aIdx];
  }
  throw new Error('No element indexed by ' + aIdx);
};

/**
 * Returns the array representation of this set (which has the proper indices
 * indicated by indexOf). Note that this is a copy of the internal array used
 * for storing the members so that no one can mess with internal state.
 */
ArraySet.prototype.toArray = function ArraySet_toArray() {
  return this._array.slice();
};

exports.ArraySet = ArraySet;


/***/ }),

/***/ "./node_modules/stacktrace-gps/node_modules/source-map/lib/base64-vlq.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/stacktrace-gps/node_modules/source-map/lib/base64-vlq.js ***!
  \*******************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var base64 = __webpack_require__(/*! ./base64 */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/base64.js");

// A single base 64 digit can contain 6 bits of data. For the base 64 variable
// length quantities we use in the source map spec, the first bit is the sign,
// the next four bits are the actual value, and the 6th bit is the
// continuation bit. The continuation bit tells us whether there are more
// digits in this value following this digit.
//
//   Continuation
//   |    Sign
//   |    |
//   V    V
//   101011

var VLQ_BASE_SHIFT = 5;

// binary: 100000
var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

// binary: 011111
var VLQ_BASE_MASK = VLQ_BASE - 1;

// binary: 100000
var VLQ_CONTINUATION_BIT = VLQ_BASE;

/**
 * Converts from a two-complement value to a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
 */
function toVLQSigned(aValue) {
  return aValue < 0
    ? ((-aValue) << 1) + 1
    : (aValue << 1) + 0;
}

/**
 * Converts to a two-complement value from a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
 */
function fromVLQSigned(aValue) {
  var isNegative = (aValue & 1) === 1;
  var shifted = aValue >> 1;
  return isNegative
    ? -shifted
    : shifted;
}

/**
 * Returns the base 64 VLQ encoded value.
 */
exports.encode = function base64VLQ_encode(aValue) {
  var encoded = "";
  var digit;

  var vlq = toVLQSigned(aValue);

  do {
    digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      // There are still more digits in this value, so we must make sure the
      // continuation bit is marked.
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += base64.encode(digit);
  } while (vlq > 0);

  return encoded;
};

/**
 * Decodes the next base 64 VLQ value from the given string and returns the
 * value and the rest of the string via the out parameter.
 */
exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
  var strLen = aStr.length;
  var result = 0;
  var shift = 0;
  var continuation, digit;

  do {
    if (aIndex >= strLen) {
      throw new Error("Expected more digits in base 64 VLQ value.");
    }

    digit = base64.decode(aStr.charCodeAt(aIndex++));
    if (digit === -1) {
      throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
    }

    continuation = !!(digit & VLQ_CONTINUATION_BIT);
    digit &= VLQ_BASE_MASK;
    result = result + (digit << shift);
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  aOutParam.value = fromVLQSigned(result);
  aOutParam.rest = aIndex;
};


/***/ }),

/***/ "./node_modules/stacktrace-gps/node_modules/source-map/lib/base64.js":
/*!***************************************************************************!*\
  !*** ./node_modules/stacktrace-gps/node_modules/source-map/lib/base64.js ***!
  \***************************************************************************/
/***/ ((__unused_webpack_module, exports) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

/**
 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
 */
exports.encode = function (number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number];
  }
  throw new TypeError("Must be between 0 and 63: " + number);
};

/**
 * Decode a single base 64 character code digit to an integer. Returns -1 on
 * failure.
 */
exports.decode = function (charCode) {
  var bigA = 65;     // 'A'
  var bigZ = 90;     // 'Z'

  var littleA = 97;  // 'a'
  var littleZ = 122; // 'z'

  var zero = 48;     // '0'
  var nine = 57;     // '9'

  var plus = 43;     // '+'
  var slash = 47;    // '/'

  var littleOffset = 26;
  var numberOffset = 52;

  // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
  if (bigA <= charCode && charCode <= bigZ) {
    return (charCode - bigA);
  }

  // 26 - 51: abcdefghijklmnopqrstuvwxyz
  if (littleA <= charCode && charCode <= littleZ) {
    return (charCode - littleA + littleOffset);
  }

  // 52 - 61: 0123456789
  if (zero <= charCode && charCode <= nine) {
    return (charCode - zero + numberOffset);
  }

  // 62: +
  if (charCode == plus) {
    return 62;
  }

  // 63: /
  if (charCode == slash) {
    return 63;
  }

  // Invalid base64 digit.
  return -1;
};


/***/ }),

/***/ "./node_modules/stacktrace-gps/node_modules/source-map/lib/binary-search.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/stacktrace-gps/node_modules/source-map/lib/binary-search.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, exports) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

exports.GREATEST_LOWER_BOUND = 1;
exports.LEAST_UPPER_BOUND = 2;

/**
 * Recursive implementation of binary search.
 *
 * @param aLow Indices here and lower do not contain the needle.
 * @param aHigh Indices here and higher do not contain the needle.
 * @param aNeedle The element being searched for.
 * @param aHaystack The non-empty array being searched.
 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 */
function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
  // This function terminates when one of the following is true:
  //
  //   1. We find the exact element we are looking for.
  //
  //   2. We did not find the exact element, but we can return the index of
  //      the next-closest element.
  //
  //   3. We did not find the exact element, and there is no next-closest
  //      element than the one we are searching for, so we return -1.
  var mid = Math.floor((aHigh - aLow) / 2) + aLow;
  var cmp = aCompare(aNeedle, aHaystack[mid], true);
  if (cmp === 0) {
    // Found the element we are looking for.
    return mid;
  }
  else if (cmp > 0) {
    // Our needle is greater than aHaystack[mid].
    if (aHigh - mid > 1) {
      // The element is in the upper half.
      return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
    }

    // The exact needle element was not found in this haystack. Determine if
    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return aHigh < aHaystack.length ? aHigh : -1;
    } else {
      return mid;
    }
  }
  else {
    // Our needle is less than aHaystack[mid].
    if (mid - aLow > 1) {
      // The element is in the lower half.
      return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
    }

    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return mid;
    } else {
      return aLow < 0 ? -1 : aLow;
    }
  }
}

/**
 * This is an implementation of binary search which will always try and return
 * the index of the closest element if there is no exact hit. This is because
 * mappings between original and generated line/col pairs are single points,
 * and there is an implicit region between each of them, so a miss just means
 * that you aren't on the very start of a region.
 *
 * @param aNeedle The element you are looking for.
 * @param aHaystack The array that is being searched.
 * @param aCompare A function which takes the needle and an element in the
 *     array and returns -1, 0, or 1 depending on whether the needle is less
 *     than, equal to, or greater than the element, respectively.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
 */
exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
  if (aHaystack.length === 0) {
    return -1;
  }

  var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                              aCompare, aBias || exports.GREATEST_LOWER_BOUND);
  if (index < 0) {
    return -1;
  }

  // We have found either the exact element, or the next-closest element than
  // the one we are searching for. However, there may be more than one such
  // element. Make sure we always return the smallest of these.
  while (index - 1 >= 0) {
    if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
      break;
    }
    --index;
  }

  return index;
};


/***/ }),

/***/ "./node_modules/stacktrace-gps/node_modules/source-map/lib/mapping-list.js":
/*!*********************************************************************************!*\
  !*** ./node_modules/stacktrace-gps/node_modules/source-map/lib/mapping-list.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2014 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = __webpack_require__(/*! ./util */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/util.js");

/**
 * Determine whether mappingB is after mappingA with respect to generated
 * position.
 */
function generatedPositionAfter(mappingA, mappingB) {
  // Optimized for most common case
  var lineA = mappingA.generatedLine;
  var lineB = mappingB.generatedLine;
  var columnA = mappingA.generatedColumn;
  var columnB = mappingB.generatedColumn;
  return lineB > lineA || lineB == lineA && columnB >= columnA ||
         util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
}

/**
 * A data structure to provide a sorted view of accumulated mappings in a
 * performance conscious manner. It trades a neglibable overhead in general
 * case for a large speedup in case of mappings being added in order.
 */
function MappingList() {
  this._array = [];
  this._sorted = true;
  // Serves as infimum
  this._last = {generatedLine: -1, generatedColumn: 0};
}

/**
 * Iterate through internal items. This method takes the same arguments that
 * `Array.prototype.forEach` takes.
 *
 * NOTE: The order of the mappings is NOT guaranteed.
 */
MappingList.prototype.unsortedForEach =
  function MappingList_forEach(aCallback, aThisArg) {
    this._array.forEach(aCallback, aThisArg);
  };

/**
 * Add the given source mapping.
 *
 * @param Object aMapping
 */
MappingList.prototype.add = function MappingList_add(aMapping) {
  if (generatedPositionAfter(this._last, aMapping)) {
    this._last = aMapping;
    this._array.push(aMapping);
  } else {
    this._sorted = false;
    this._array.push(aMapping);
  }
};

/**
 * Returns the flat, sorted array of mappings. The mappings are sorted by
 * generated position.
 *
 * WARNING: This method returns internal data without copying, for
 * performance. The return value must NOT be mutated, and should be treated as
 * an immutable borrow. If you want to take ownership, you must make your own
 * copy.
 */
MappingList.prototype.toArray = function MappingList_toArray() {
  if (!this._sorted) {
    this._array.sort(util.compareByGeneratedPositionsInflated);
    this._sorted = true;
  }
  return this._array;
};

exports.MappingList = MappingList;


/***/ }),

/***/ "./node_modules/stacktrace-gps/node_modules/source-map/lib/quick-sort.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/stacktrace-gps/node_modules/source-map/lib/quick-sort.js ***!
  \*******************************************************************************/
/***/ ((__unused_webpack_module, exports) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

// It turns out that some (most?) JavaScript engines don't self-host
// `Array.prototype.sort`. This makes sense because C++ will likely remain
// faster than JS when doing raw CPU-intensive sorting. However, when using a
// custom comparator function, calling back and forth between the VM's C++ and
// JIT'd JS is rather slow *and* loses JIT type information, resulting in
// worse generated code for the comparator function than would be optimal. In
// fact, when sorting with a comparator, these costs outweigh the benefits of
// sorting in C++. By using our own JS-implemented Quick Sort (below), we get
// a ~3500ms mean speed-up in `bench/bench.html`.

/**
 * Swap the elements indexed by `x` and `y` in the array `ary`.
 *
 * @param {Array} ary
 *        The array.
 * @param {Number} x
 *        The index of the first item.
 * @param {Number} y
 *        The index of the second item.
 */
function swap(ary, x, y) {
  var temp = ary[x];
  ary[x] = ary[y];
  ary[y] = temp;
}

/**
 * Returns a random integer within the range `low .. high` inclusive.
 *
 * @param {Number} low
 *        The lower bound on the range.
 * @param {Number} high
 *        The upper bound on the range.
 */
function randomIntInRange(low, high) {
  return Math.round(low + (Math.random() * (high - low)));
}

/**
 * The Quick Sort algorithm.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 * @param {Number} p
 *        Start index of the array
 * @param {Number} r
 *        End index of the array
 */
function doQuickSort(ary, comparator, p, r) {
  // If our lower bound is less than our upper bound, we (1) partition the
  // array into two pieces and (2) recurse on each half. If it is not, this is
  // the empty array and our base case.

  if (p < r) {
    // (1) Partitioning.
    //
    // The partitioning chooses a pivot between `p` and `r` and moves all
    // elements that are less than or equal to the pivot to the before it, and
    // all the elements that are greater than it after it. The effect is that
    // once partition is done, the pivot is in the exact place it will be when
    // the array is put in sorted order, and it will not need to be moved
    // again. This runs in O(n) time.

    // Always choose a random pivot so that an input array which is reverse
    // sorted does not cause O(n^2) running time.
    var pivotIndex = randomIntInRange(p, r);
    var i = p - 1;

    swap(ary, pivotIndex, r);
    var pivot = ary[r];

    // Immediately after `j` is incremented in this loop, the following hold
    // true:
    //
    //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
    //
    //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
    for (var j = p; j < r; j++) {
      if (comparator(ary[j], pivot) <= 0) {
        i += 1;
        swap(ary, i, j);
      }
    }

    swap(ary, i + 1, j);
    var q = i + 1;

    // (2) Recurse on each half.

    doQuickSort(ary, comparator, p, q - 1);
    doQuickSort(ary, comparator, q + 1, r);
  }
}

/**
 * Sort the given array in-place with the given comparator function.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 */
exports.quickSort = function (ary, comparator) {
  doQuickSort(ary, comparator, 0, ary.length - 1);
};


/***/ }),

/***/ "./node_modules/stacktrace-gps/node_modules/source-map/lib/source-map-consumer.js":
/*!****************************************************************************************!*\
  !*** ./node_modules/stacktrace-gps/node_modules/source-map/lib/source-map-consumer.js ***!
  \****************************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = __webpack_require__(/*! ./util */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/util.js");
var binarySearch = __webpack_require__(/*! ./binary-search */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/binary-search.js");
var ArraySet = __webpack_require__(/*! ./array-set */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/array-set.js").ArraySet;
var base64VLQ = __webpack_require__(/*! ./base64-vlq */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/base64-vlq.js");
var quickSort = __webpack_require__(/*! ./quick-sort */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/quick-sort.js").quickSort;

function SourceMapConsumer(aSourceMap) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
  }

  return sourceMap.sections != null
    ? new IndexedSourceMapConsumer(sourceMap)
    : new BasicSourceMapConsumer(sourceMap);
}

SourceMapConsumer.fromSourceMap = function(aSourceMap) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap);
}

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer.prototype._version = 3;

// `__generatedMappings` and `__originalMappings` are arrays that hold the
// parsed mapping coordinates from the source map's "mappings" attribute. They
// are lazily instantiated, accessed via the `_generatedMappings` and
// `_originalMappings` getters respectively, and we only parse the mappings
// and create these arrays once queried for a source location. We jump through
// these hoops because there can be many thousands of mappings, and parsing
// them is expensive, so we only want to do it if we must.
//
// Each object in the arrays is of the form:
//
//     {
//       generatedLine: The line number in the generated code,
//       generatedColumn: The column number in the generated code,
//       source: The path to the original source file that generated this
//               chunk of code,
//       originalLine: The line number in the original source that
//                     corresponds to this chunk of generated code,
//       originalColumn: The column number in the original source that
//                       corresponds to this chunk of generated code,
//       name: The name of the original symbol which generated this chunk of
//             code.
//     }
//
// All properties except for `generatedLine` and `generatedColumn` can be
// `null`.
//
// `_generatedMappings` is ordered by the generated positions.
//
// `_originalMappings` is ordered by the original positions.

SourceMapConsumer.prototype.__generatedMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
  get: function () {
    if (!this.__generatedMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__generatedMappings;
  }
});

SourceMapConsumer.prototype.__originalMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
  get: function () {
    if (!this.__originalMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__originalMappings;
  }
});

SourceMapConsumer.prototype._charIsMappingSeparator =
  function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
    var c = aStr.charAt(index);
    return c === ";" || c === ",";
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
SourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  };

SourceMapConsumer.GENERATED_ORDER = 1;
SourceMapConsumer.ORIGINAL_ORDER = 2;

SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer.LEAST_UPPER_BOUND = 2;

/**
 * Iterate over each mapping between an original source/line/column and a
 * generated line/column in this source map.
 *
 * @param Function aCallback
 *        The function that is called with each mapping.
 * @param Object aContext
 *        Optional. If specified, this object will be the value of `this` every
 *        time that `aCallback` is called.
 * @param aOrder
 *        Either `SourceMapConsumer.GENERATED_ORDER` or
 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
 *        iterate over the mappings sorted by the generated file's line/column
 *        order or the original's source/line/column order, respectively. Defaults to
 *        `SourceMapConsumer.GENERATED_ORDER`.
 */
SourceMapConsumer.prototype.eachMapping =
  function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

    var mappings;
    switch (order) {
    case SourceMapConsumer.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
    }

    var sourceRoot = this.sourceRoot;
    mappings.map(function (mapping) {
      var source = mapping.source === null ? null : this._sources.at(mapping.source);
      if (source != null && sourceRoot != null) {
        source = util.join(sourceRoot, source);
      }
      return {
        source: source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name === null ? null : this._names.at(mapping.name)
      };
    }, this).forEach(aCallback, context);
  };

/**
 * Returns all generated line and column information for the original source,
 * line, and column provided. If no column is provided, returns all mappings
 * corresponding to a either the line we are searching for or the next
 * closest line that has any mappings. Otherwise, returns all mappings
 * corresponding to the given line and either the column we are searching for
 * or the next closest column that has any offsets.
 *
 * The only argument is an object with the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.
 *   - column: Optional. the column number in the original source.
 *
 * and an array of objects is returned, each with the following properties:
 *
 *   - line: The line number in the generated source, or null.
 *   - column: The column number in the generated source, or null.
 */
SourceMapConsumer.prototype.allGeneratedPositionsFor =
  function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
    var line = util.getArg(aArgs, 'line');

    // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
    // returns the index of the closest mapping less than the needle. By
    // setting needle.originalColumn to 0, we thus find the last mapping for
    // the given line, provided such a mapping exists.
    var needle = {
      source: util.getArg(aArgs, 'source'),
      originalLine: line,
      originalColumn: util.getArg(aArgs, 'column', 0)
    };

    if (this.sourceRoot != null) {
      needle.source = util.relative(this.sourceRoot, needle.source);
    }
    if (!this._sources.has(needle.source)) {
      return [];
    }
    needle.source = this._sources.indexOf(needle.source);

    var mappings = [];

    var index = this._findMapping(needle,
                                  this._originalMappings,
                                  "originalLine",
                                  "originalColumn",
                                  util.compareByOriginalPositions,
                                  binarySearch.LEAST_UPPER_BOUND);
    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (aArgs.column === undefined) {
        var originalLine = mapping.originalLine;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we found. Since
        // mappings are sorted, this is guaranteed to find all mappings for
        // the line we found.
        while (mapping && mapping.originalLine === originalLine) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      } else {
        var originalColumn = mapping.originalColumn;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we were searching for.
        // Since mappings are sorted, this is guaranteed to find all mappings for
        // the line we are searching for.
        while (mapping &&
               mapping.originalLine === line &&
               mapping.originalColumn == originalColumn) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      }
    }

    return mappings;
  };

exports.SourceMapConsumer = SourceMapConsumer;

/**
 * A BasicSourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The only parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referrenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - sourcesContent: Optional. An array of contents of the original source files.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: Optional. The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
function BasicSourceMapConsumer(aSourceMap) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
  }

  var version = util.getArg(sourceMap, 'version');
  var sources = util.getArg(sourceMap, 'sources');
  // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
  // requires the array) to play nice here.
  var names = util.getArg(sourceMap, 'names', []);
  var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
  var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
  var mappings = util.getArg(sourceMap, 'mappings');
  var file = util.getArg(sourceMap, 'file', null);

  // Once again, Sass deviates from the spec and supplies the version as a
  // string rather than a number, so we use loose equality checking here.
  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  sources = sources
    .map(String)
    // Some source maps produce relative source paths like "./foo.js" instead of
    // "foo.js".  Normalize these first so that future comparisons will succeed.
    // See bugzil.la/1090768.
    .map(util.normalize)
    // Always ensure that absolute sources are internally stored relative to
    // the source root, if the source root is absolute. Not doing this would
    // be particularly problematic when the source root is a prefix of the
    // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
    .map(function (source) {
      return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
        ? util.relative(sourceRoot, source)
        : source;
    });

  // Pass `true` below to allow duplicate names and sources. While source maps
  // are intended to be compressed and deduplicated, the TypeScript compiler
  // sometimes generates source maps with duplicates in them. See Github issue
  // #72 and bugzil.la/889492.
  this._names = ArraySet.fromArray(names.map(String), true);
  this._sources = ArraySet.fromArray(sources, true);

  this.sourceRoot = sourceRoot;
  this.sourcesContent = sourcesContent;
  this._mappings = mappings;
  this.file = file;
}

BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

/**
 * Create a BasicSourceMapConsumer from a SourceMapGenerator.
 *
 * @param SourceMapGenerator aSourceMap
 *        The source map that will be consumed.
 * @returns BasicSourceMapConsumer
 */
BasicSourceMapConsumer.fromSourceMap =
  function SourceMapConsumer_fromSourceMap(aSourceMap) {
    var smc = Object.create(BasicSourceMapConsumer.prototype);

    var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
    var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
    smc.sourceRoot = aSourceMap._sourceRoot;
    smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                            smc.sourceRoot);
    smc.file = aSourceMap._file;

    // Because we are modifying the entries (by converting string sources and
    // names to indices into the sources and names ArraySets), we have to make
    // a copy of the entry or else bad things happen. Shared mutable state
    // strikes again! See github issue #191.

    var generatedMappings = aSourceMap._mappings.toArray().slice();
    var destGeneratedMappings = smc.__generatedMappings = [];
    var destOriginalMappings = smc.__originalMappings = [];

    for (var i = 0, length = generatedMappings.length; i < length; i++) {
      var srcMapping = generatedMappings[i];
      var destMapping = new Mapping;
      destMapping.generatedLine = srcMapping.generatedLine;
      destMapping.generatedColumn = srcMapping.generatedColumn;

      if (srcMapping.source) {
        destMapping.source = sources.indexOf(srcMapping.source);
        destMapping.originalLine = srcMapping.originalLine;
        destMapping.originalColumn = srcMapping.originalColumn;

        if (srcMapping.name) {
          destMapping.name = names.indexOf(srcMapping.name);
        }

        destOriginalMappings.push(destMapping);
      }

      destGeneratedMappings.push(destMapping);
    }

    quickSort(smc.__originalMappings, util.compareByOriginalPositions);

    return smc;
  };

/**
 * The version of the source mapping spec that we are consuming.
 */
BasicSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
  get: function () {
    return this._sources.toArray().map(function (s) {
      return this.sourceRoot != null ? util.join(this.sourceRoot, s) : s;
    }, this);
  }
});

/**
 * Provide the JIT with a nice shape / hidden class.
 */
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
BasicSourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    var generatedLine = 1;
    var previousGeneratedColumn = 0;
    var previousOriginalLine = 0;
    var previousOriginalColumn = 0;
    var previousSource = 0;
    var previousName = 0;
    var length = aStr.length;
    var index = 0;
    var cachedSegments = {};
    var temp = {};
    var originalMappings = [];
    var generatedMappings = [];
    var mapping, str, segment, end, value;

    while (index < length) {
      if (aStr.charAt(index) === ';') {
        generatedLine++;
        index++;
        previousGeneratedColumn = 0;
      }
      else if (aStr.charAt(index) === ',') {
        index++;
      }
      else {
        mapping = new Mapping();
        mapping.generatedLine = generatedLine;

        // Because each offset is encoded relative to the previous one,
        // many segments often have the same encoding. We can exploit this
        // fact by caching the parsed variable length fields of each segment,
        // allowing us to avoid a second parse if we encounter the same
        // segment again.
        for (end = index; end < length; end++) {
          if (this._charIsMappingSeparator(aStr, end)) {
            break;
          }
        }
        str = aStr.slice(index, end);

        segment = cachedSegments[str];
        if (segment) {
          index += str.length;
        } else {
          segment = [];
          while (index < end) {
            base64VLQ.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }

          if (segment.length === 2) {
            throw new Error('Found a source, but no line and column');
          }

          if (segment.length === 3) {
            throw new Error('Found a source and line, but no column');
          }

          cachedSegments[str] = segment;
        }

        // Generated column.
        mapping.generatedColumn = previousGeneratedColumn + segment[0];
        previousGeneratedColumn = mapping.generatedColumn;

        if (segment.length > 1) {
          // Original source.
          mapping.source = previousSource + segment[1];
          previousSource += segment[1];

          // Original line.
          mapping.originalLine = previousOriginalLine + segment[2];
          previousOriginalLine = mapping.originalLine;
          // Lines are stored 0-based
          mapping.originalLine += 1;

          // Original column.
          mapping.originalColumn = previousOriginalColumn + segment[3];
          previousOriginalColumn = mapping.originalColumn;

          if (segment.length > 4) {
            // Original name.
            mapping.name = previousName + segment[4];
            previousName += segment[4];
          }
        }

        generatedMappings.push(mapping);
        if (typeof mapping.originalLine === 'number') {
          originalMappings.push(mapping);
        }
      }
    }

    quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated);
    this.__generatedMappings = generatedMappings;

    quickSort(originalMappings, util.compareByOriginalPositions);
    this.__originalMappings = originalMappings;
  };

/**
 * Find the mapping that best matches the hypothetical "needle" mapping that
 * we are searching for in the given "haystack" of mappings.
 */
BasicSourceMapConsumer.prototype._findMapping =
  function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                         aColumnName, aComparator, aBias) {
    // To return the position we are searching for, we must first find the
    // mapping for the given position and then return the opposite position it
    // points to. Because the mappings are sorted, we can use binary search to
    // find the best mapping.

    if (aNeedle[aLineName] <= 0) {
      throw new TypeError('Line must be greater than or equal to 1, got '
                          + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError('Column must be greater than or equal to 0, got '
                          + aNeedle[aColumnName]);
    }

    return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
  };

/**
 * Compute the last column for each generated mapping. The last column is
 * inclusive.
 */
BasicSourceMapConsumer.prototype.computeColumnSpans =
  function SourceMapConsumer_computeColumnSpans() {
    for (var index = 0; index < this._generatedMappings.length; ++index) {
      var mapping = this._generatedMappings[index];

      // Mappings do not contain a field for the last generated columnt. We
      // can come up with an optimistic estimate, however, by assuming that
      // mappings are contiguous (i.e. given two consecutive mappings, the
      // first mapping ends where the second one starts).
      if (index + 1 < this._generatedMappings.length) {
        var nextMapping = this._generatedMappings[index + 1];

        if (mapping.generatedLine === nextMapping.generatedLine) {
          mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
          continue;
        }
      }

      // The last mapping for each line spans the entire line.
      mapping.lastGeneratedColumn = Infinity;
    }
  };

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.
 *   - column: The column number in the generated source.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.
 *   - column: The column number in the original source, or null.
 *   - name: The original identifier, or null.
 */
BasicSourceMapConsumer.prototype.originalPositionFor =
  function SourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._generatedMappings,
      "generatedLine",
      "generatedColumn",
      util.compareByGeneratedPositionsDeflated,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._generatedMappings[index];

      if (mapping.generatedLine === needle.generatedLine) {
        var source = util.getArg(mapping, 'source', null);
        if (source !== null) {
          source = this._sources.at(source);
          if (this.sourceRoot != null) {
            source = util.join(this.sourceRoot, source);
          }
        }
        var name = util.getArg(mapping, 'name', null);
        if (name !== null) {
          name = this._names.at(name);
        }
        return {
          source: source,
          line: util.getArg(mapping, 'originalLine', null),
          column: util.getArg(mapping, 'originalColumn', null),
          name: name
        };
      }
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
  function BasicSourceMapConsumer_hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() &&
      !this.sourcesContent.some(function (sc) { return sc == null; });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
BasicSourceMapConsumer.prototype.sourceContentFor =
  function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }

    if (this.sourceRoot != null) {
      aSource = util.relative(this.sourceRoot, aSource);
    }

    if (this._sources.has(aSource)) {
      return this.sourcesContent[this._sources.indexOf(aSource)];
    }

    var url;
    if (this.sourceRoot != null
        && (url = util.urlParse(this.sourceRoot))) {
      // XXX: file:// URIs and absolute paths lead to unexpected behavior for
      // many users. We can help them out when they expect file:// URIs to
      // behave like it would if they were running a local HTTP server. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
      var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
      if (url.scheme == "file"
          && this._sources.has(fileUriAbsPath)) {
        return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
      }

      if ((!url.path || url.path == "/")
          && this._sources.has("/" + aSource)) {
        return this.sourcesContent[this._sources.indexOf("/" + aSource)];
      }
    }

    // This function is used recursively from
    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
    // don't want to throw if we can't find the source - we just want to
    // return null, so we provide a flag to exit gracefully.
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.
 *   - column: The column number in the original source.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.
 *   - column: The column number in the generated source, or null.
 */
BasicSourceMapConsumer.prototype.generatedPositionFor =
  function SourceMapConsumer_generatedPositionFor(aArgs) {
    var source = util.getArg(aArgs, 'source');
    if (this.sourceRoot != null) {
      source = util.relative(this.sourceRoot, source);
    }
    if (!this._sources.has(source)) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }
    source = this._sources.indexOf(source);

    var needle = {
      source: source,
      originalLine: util.getArg(aArgs, 'line'),
      originalColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._originalMappings,
      "originalLine",
      "originalColumn",
      util.compareByOriginalPositions,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (mapping.source === needle.source) {
        return {
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null),
          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
        };
      }
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  };

exports.BasicSourceMapConsumer = BasicSourceMapConsumer;

/**
 * An IndexedSourceMapConsumer instance represents a parsed source map which
 * we can query for information. It differs from BasicSourceMapConsumer in
 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
 * input.
 *
 * The only parameter is a raw source map (either as a JSON string, or already
 * parsed to an object). According to the spec for indexed source maps, they
 * have the following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - file: Optional. The generated file this source map is associated with.
 *   - sections: A list of section definitions.
 *
 * Each value under the "sections" field has two fields:
 *   - offset: The offset into the original specified at which this section
 *       begins to apply, defined as an object with a "line" and "column"
 *       field.
 *   - map: A source map definition. This source map could also be indexed,
 *       but doesn't have to be.
 *
 * Instead of the "map" field, it's also possible to have a "url" field
 * specifying a URL to retrieve a source map from, but that's currently
 * unsupported.
 *
 * Here's an example source map, taken from the source map spec[0], but
 * modified to omit a section which uses the "url" field.
 *
 *  {
 *    version : 3,
 *    file: "app.js",
 *    sections: [{
 *      offset: {line:100, column:10},
 *      map: {
 *        version : 3,
 *        file: "section.js",
 *        sources: ["foo.js", "bar.js"],
 *        names: ["src", "maps", "are", "fun"],
 *        mappings: "AAAA,E;;ABCDE;"
 *      }
 *    }],
 *  }
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
 */
function IndexedSourceMapConsumer(aSourceMap) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
  }

  var version = util.getArg(sourceMap, 'version');
  var sections = util.getArg(sourceMap, 'sections');

  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  this._sources = new ArraySet();
  this._names = new ArraySet();

  var lastOffset = {
    line: -1,
    column: 0
  };
  this._sections = sections.map(function (s) {
    if (s.url) {
      // The url field will require support for asynchronicity.
      // See https://github.com/mozilla/source-map/issues/16
      throw new Error('Support for url field in sections not implemented.');
    }
    var offset = util.getArg(s, 'offset');
    var offsetLine = util.getArg(offset, 'line');
    var offsetColumn = util.getArg(offset, 'column');

    if (offsetLine < lastOffset.line ||
        (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
      throw new Error('Section offsets must be ordered and non-overlapping.');
    }
    lastOffset = offset;

    return {
      generatedOffset: {
        // The offset fields are 0-based, but we use 1-based indices when
        // encoding/decoding from VLQ.
        generatedLine: offsetLine + 1,
        generatedColumn: offsetColumn + 1
      },
      consumer: new SourceMapConsumer(util.getArg(s, 'map'))
    }
  });
}

IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

/**
 * The version of the source mapping spec that we are consuming.
 */
IndexedSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
  get: function () {
    var sources = [];
    for (var i = 0; i < this._sections.length; i++) {
      for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }
});

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.
 *   - column: The column number in the generated source.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.
 *   - column: The column number in the original source, or null.
 *   - name: The original identifier, or null.
 */
IndexedSourceMapConsumer.prototype.originalPositionFor =
  function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    // Find the section containing the generated position we're trying to map
    // to an original position.
    var sectionIndex = binarySearch.search(needle, this._sections,
      function(needle, section) {
        var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
        if (cmp) {
          return cmp;
        }

        return (needle.generatedColumn -
                section.generatedOffset.generatedColumn);
      });
    var section = this._sections[sectionIndex];

    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }

    return section.consumer.originalPositionFor({
      line: needle.generatedLine -
        (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn -
        (section.generatedOffset.generatedLine === needle.generatedLine
         ? section.generatedOffset.generatedColumn - 1
         : 0),
      bias: aArgs.bias
    });
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
  function IndexedSourceMapConsumer_hasContentsOfAllSources() {
    return this._sections.every(function (s) {
      return s.consumer.hasContentsOfAllSources();
    });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
IndexedSourceMapConsumer.prototype.sourceContentFor =
  function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      var content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.
 *   - column: The column number in the original source.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.
 *   - column: The column number in the generated source, or null.
 */
IndexedSourceMapConsumer.prototype.generatedPositionFor =
  function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      // Only consider this section if the requested source is in the list of
      // sources of the consumer.
      if (section.consumer.sources.indexOf(util.getArg(aArgs, 'source')) === -1) {
        continue;
      }
      var generatedPosition = section.consumer.generatedPositionFor(aArgs);
      if (generatedPosition) {
        var ret = {
          line: generatedPosition.line +
            (section.generatedOffset.generatedLine - 1),
          column: generatedPosition.column +
            (section.generatedOffset.generatedLine === generatedPosition.line
             ? section.generatedOffset.generatedColumn - 1
             : 0)
        };
        return ret;
      }
    }

    return {
      line: null,
      column: null
    };
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
IndexedSourceMapConsumer.prototype._parseMappings =
  function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    this.__generatedMappings = [];
    this.__originalMappings = [];
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];
      var sectionMappings = section.consumer._generatedMappings;
      for (var j = 0; j < sectionMappings.length; j++) {
        var mapping = sectionMappings[j];

        var source = section.consumer._sources.at(mapping.source);
        if (section.consumer.sourceRoot !== null) {
          source = util.join(section.consumer.sourceRoot, source);
        }
        this._sources.add(source);
        source = this._sources.indexOf(source);

        var name = section.consumer._names.at(mapping.name);
        this._names.add(name);
        name = this._names.indexOf(name);

        // The mappings coming from the consumer for the section have
        // generated positions relative to the start of the section, so we
        // need to offset them to be relative to the start of the concatenated
        // generated file.
        var adjustedMapping = {
          source: source,
          generatedLine: mapping.generatedLine +
            (section.generatedOffset.generatedLine - 1),
          generatedColumn: mapping.generatedColumn +
            (section.generatedOffset.generatedLine === mapping.generatedLine
            ? section.generatedOffset.generatedColumn - 1
            : 0),
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: name
        };

        this.__generatedMappings.push(adjustedMapping);
        if (typeof adjustedMapping.originalLine === 'number') {
          this.__originalMappings.push(adjustedMapping);
        }
      }
    }

    quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
    quickSort(this.__originalMappings, util.compareByOriginalPositions);
  };

exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;


/***/ }),

/***/ "./node_modules/stacktrace-gps/node_modules/source-map/lib/source-map-generator.js":
/*!*****************************************************************************************!*\
  !*** ./node_modules/stacktrace-gps/node_modules/source-map/lib/source-map-generator.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var base64VLQ = __webpack_require__(/*! ./base64-vlq */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/base64-vlq.js");
var util = __webpack_require__(/*! ./util */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/util.js");
var ArraySet = __webpack_require__(/*! ./array-set */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/array-set.js").ArraySet;
var MappingList = __webpack_require__(/*! ./mapping-list */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/mapping-list.js").MappingList;

/**
 * An instance of the SourceMapGenerator represents a source map which is
 * being built incrementally. You may pass an object with the following
 * properties:
 *
 *   - file: The filename of the generated source.
 *   - sourceRoot: A root for all relative URLs in this source map.
 */
function SourceMapGenerator(aArgs) {
  if (!aArgs) {
    aArgs = {};
  }
  this._file = util.getArg(aArgs, 'file', null);
  this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
  this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
  this._sources = new ArraySet();
  this._names = new ArraySet();
  this._mappings = new MappingList();
  this._sourcesContents = null;
}

SourceMapGenerator.prototype._version = 3;

/**
 * Creates a new SourceMapGenerator based on a SourceMapConsumer
 *
 * @param aSourceMapConsumer The SourceMap.
 */
SourceMapGenerator.fromSourceMap =
  function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
    var sourceRoot = aSourceMapConsumer.sourceRoot;
    var generator = new SourceMapGenerator({
      file: aSourceMapConsumer.file,
      sourceRoot: sourceRoot
    });
    aSourceMapConsumer.eachMapping(function (mapping) {
      var newMapping = {
        generated: {
          line: mapping.generatedLine,
          column: mapping.generatedColumn
        }
      };

      if (mapping.source != null) {
        newMapping.source = mapping.source;
        if (sourceRoot != null) {
          newMapping.source = util.relative(sourceRoot, newMapping.source);
        }

        newMapping.original = {
          line: mapping.originalLine,
          column: mapping.originalColumn
        };

        if (mapping.name != null) {
          newMapping.name = mapping.name;
        }
      }

      generator.addMapping(newMapping);
    });
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        generator.setSourceContent(sourceFile, content);
      }
    });
    return generator;
  };

/**
 * Add a single mapping from original source line and column to the generated
 * source's line and column for this source map being created. The mapping
 * object should have the following properties:
 *
 *   - generated: An object with the generated line and column positions.
 *   - original: An object with the original line and column positions.
 *   - source: The original source file (relative to the sourceRoot).
 *   - name: An optional original token name for this mapping.
 */
SourceMapGenerator.prototype.addMapping =
  function SourceMapGenerator_addMapping(aArgs) {
    var generated = util.getArg(aArgs, 'generated');
    var original = util.getArg(aArgs, 'original', null);
    var source = util.getArg(aArgs, 'source', null);
    var name = util.getArg(aArgs, 'name', null);

    if (!this._skipValidation) {
      this._validateMapping(generated, original, source, name);
    }

    if (source != null) {
      source = String(source);
      if (!this._sources.has(source)) {
        this._sources.add(source);
      }
    }

    if (name != null) {
      name = String(name);
      if (!this._names.has(name)) {
        this._names.add(name);
      }
    }

    this._mappings.add({
      generatedLine: generated.line,
      generatedColumn: generated.column,
      originalLine: original != null && original.line,
      originalColumn: original != null && original.column,
      source: source,
      name: name
    });
  };

/**
 * Set the source content for a source file.
 */
SourceMapGenerator.prototype.setSourceContent =
  function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
    var source = aSourceFile;
    if (this._sourceRoot != null) {
      source = util.relative(this._sourceRoot, source);
    }

    if (aSourceContent != null) {
      // Add the source content to the _sourcesContents map.
      // Create a new _sourcesContents map if the property is null.
      if (!this._sourcesContents) {
        this._sourcesContents = Object.create(null);
      }
      this._sourcesContents[util.toSetString(source)] = aSourceContent;
    } else if (this._sourcesContents) {
      // Remove the source file from the _sourcesContents map.
      // If the _sourcesContents map is empty, set the property to null.
      delete this._sourcesContents[util.toSetString(source)];
      if (Object.keys(this._sourcesContents).length === 0) {
        this._sourcesContents = null;
      }
    }
  };

/**
 * Applies the mappings of a sub-source-map for a specific source file to the
 * source map being generated. Each mapping to the supplied source file is
 * rewritten using the supplied source map. Note: The resolution for the
 * resulting mappings is the minimium of this map and the supplied map.
 *
 * @param aSourceMapConsumer The source map to be applied.
 * @param aSourceFile Optional. The filename of the source file.
 *        If omitted, SourceMapConsumer's file property will be used.
 * @param aSourceMapPath Optional. The dirname of the path to the source map
 *        to be applied. If relative, it is relative to the SourceMapConsumer.
 *        This parameter is needed when the two source maps aren't in the same
 *        directory, and the source map to be applied contains relative source
 *        paths. If so, those relative source paths need to be rewritten
 *        relative to the SourceMapGenerator.
 */
SourceMapGenerator.prototype.applySourceMap =
  function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
    var sourceFile = aSourceFile;
    // If aSourceFile is omitted, we will use the file property of the SourceMap
    if (aSourceFile == null) {
      if (aSourceMapConsumer.file == null) {
        throw new Error(
          'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
          'or the source map\'s "file" property. Both were omitted.'
        );
      }
      sourceFile = aSourceMapConsumer.file;
    }
    var sourceRoot = this._sourceRoot;
    // Make "sourceFile" relative if an absolute Url is passed.
    if (sourceRoot != null) {
      sourceFile = util.relative(sourceRoot, sourceFile);
    }
    // Applying the SourceMap can add and remove items from the sources and
    // the names array.
    var newSources = new ArraySet();
    var newNames = new ArraySet();

    // Find mappings for the "sourceFile"
    this._mappings.unsortedForEach(function (mapping) {
      if (mapping.source === sourceFile && mapping.originalLine != null) {
        // Check if it can be mapped by the source map, then update the mapping.
        var original = aSourceMapConsumer.originalPositionFor({
          line: mapping.originalLine,
          column: mapping.originalColumn
        });
        if (original.source != null) {
          // Copy mapping
          mapping.source = original.source;
          if (aSourceMapPath != null) {
            mapping.source = util.join(aSourceMapPath, mapping.source)
          }
          if (sourceRoot != null) {
            mapping.source = util.relative(sourceRoot, mapping.source);
          }
          mapping.originalLine = original.line;
          mapping.originalColumn = original.column;
          if (original.name != null) {
            mapping.name = original.name;
          }
        }
      }

      var source = mapping.source;
      if (source != null && !newSources.has(source)) {
        newSources.add(source);
      }

      var name = mapping.name;
      if (name != null && !newNames.has(name)) {
        newNames.add(name);
      }

    }, this);
    this._sources = newSources;
    this._names = newNames;

    // Copy sourcesContents of applied map.
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aSourceMapPath != null) {
          sourceFile = util.join(aSourceMapPath, sourceFile);
        }
        if (sourceRoot != null) {
          sourceFile = util.relative(sourceRoot, sourceFile);
        }
        this.setSourceContent(sourceFile, content);
      }
    }, this);
  };

/**
 * A mapping can have one of the three levels of data:
 *
 *   1. Just the generated position.
 *   2. The Generated position, original position, and original source.
 *   3. Generated and original position, original source, as well as a name
 *      token.
 *
 * To maintain consistency, we validate that any new mapping being added falls
 * in to one of these categories.
 */
SourceMapGenerator.prototype._validateMapping =
  function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                              aName) {
    if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
        && aGenerated.line > 0 && aGenerated.column >= 0
        && !aOriginal && !aSource && !aName) {
      // Case 1.
      return;
    }
    else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
             && aOriginal && 'line' in aOriginal && 'column' in aOriginal
             && aGenerated.line > 0 && aGenerated.column >= 0
             && aOriginal.line > 0 && aOriginal.column >= 0
             && aSource) {
      // Cases 2 and 3.
      return;
    }
    else {
      throw new Error('Invalid mapping: ' + JSON.stringify({
        generated: aGenerated,
        source: aSource,
        original: aOriginal,
        name: aName
      }));
    }
  };

/**
 * Serialize the accumulated mappings in to the stream of base 64 VLQs
 * specified by the source map format.
 */
SourceMapGenerator.prototype._serializeMappings =
  function SourceMapGenerator_serializeMappings() {
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 1;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousName = 0;
    var previousSource = 0;
    var result = '';
    var next;
    var mapping;
    var nameIdx;
    var sourceIdx;

    var mappings = this._mappings.toArray();
    for (var i = 0, len = mappings.length; i < len; i++) {
      mapping = mappings[i];
      next = ''

      if (mapping.generatedLine !== previousGeneratedLine) {
        previousGeneratedColumn = 0;
        while (mapping.generatedLine !== previousGeneratedLine) {
          next += ';';
          previousGeneratedLine++;
        }
      }
      else {
        if (i > 0) {
          if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
            continue;
          }
          next += ',';
        }
      }

      next += base64VLQ.encode(mapping.generatedColumn
                                 - previousGeneratedColumn);
      previousGeneratedColumn = mapping.generatedColumn;

      if (mapping.source != null) {
        sourceIdx = this._sources.indexOf(mapping.source);
        next += base64VLQ.encode(sourceIdx - previousSource);
        previousSource = sourceIdx;

        // lines are stored 0-based in SourceMap spec version 3
        next += base64VLQ.encode(mapping.originalLine - 1
                                   - previousOriginalLine);
        previousOriginalLine = mapping.originalLine - 1;

        next += base64VLQ.encode(mapping.originalColumn
                                   - previousOriginalColumn);
        previousOriginalColumn = mapping.originalColumn;

        if (mapping.name != null) {
          nameIdx = this._names.indexOf(mapping.name);
          next += base64VLQ.encode(nameIdx - previousName);
          previousName = nameIdx;
        }
      }

      result += next;
    }

    return result;
  };

SourceMapGenerator.prototype._generateSourcesContent =
  function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
    return aSources.map(function (source) {
      if (!this._sourcesContents) {
        return null;
      }
      if (aSourceRoot != null) {
        source = util.relative(aSourceRoot, source);
      }
      var key = util.toSetString(source);
      return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
        ? this._sourcesContents[key]
        : null;
    }, this);
  };

/**
 * Externalize the source map.
 */
SourceMapGenerator.prototype.toJSON =
  function SourceMapGenerator_toJSON() {
    var map = {
      version: this._version,
      sources: this._sources.toArray(),
      names: this._names.toArray(),
      mappings: this._serializeMappings()
    };
    if (this._file != null) {
      map.file = this._file;
    }
    if (this._sourceRoot != null) {
      map.sourceRoot = this._sourceRoot;
    }
    if (this._sourcesContents) {
      map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
    }

    return map;
  };

/**
 * Render the source map being generated to a string.
 */
SourceMapGenerator.prototype.toString =
  function SourceMapGenerator_toString() {
    return JSON.stringify(this.toJSON());
  };

exports.SourceMapGenerator = SourceMapGenerator;


/***/ }),

/***/ "./node_modules/stacktrace-gps/node_modules/source-map/lib/source-node.js":
/*!********************************************************************************!*\
  !*** ./node_modules/stacktrace-gps/node_modules/source-map/lib/source-node.js ***!
  \********************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var SourceMapGenerator = __webpack_require__(/*! ./source-map-generator */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/source-map-generator.js").SourceMapGenerator;
var util = __webpack_require__(/*! ./util */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/util.js");

// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
// operating systems these days (capturing the result).
var REGEX_NEWLINE = /(\r?\n)/;

// Newline character code for charCodeAt() comparisons
var NEWLINE_CODE = 10;

// Private symbol for identifying `SourceNode`s when multiple versions of
// the source-map library are loaded. This MUST NOT CHANGE across
// versions!
var isSourceNode = "$$$isSourceNode$$$";

/**
 * SourceNodes provide a way to abstract over interpolating/concatenating
 * snippets of generated JavaScript source code while maintaining the line and
 * column information associated with the original source code.
 *
 * @param aLine The original line number.
 * @param aColumn The original column number.
 * @param aSource The original source's filename.
 * @param aChunks Optional. An array of strings which are snippets of
 *        generated JS, or other SourceNodes.
 * @param aName The original identifier.
 */
function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
  this.children = [];
  this.sourceContents = {};
  this.line = aLine == null ? null : aLine;
  this.column = aColumn == null ? null : aColumn;
  this.source = aSource == null ? null : aSource;
  this.name = aName == null ? null : aName;
  this[isSourceNode] = true;
  if (aChunks != null) this.add(aChunks);
}

/**
 * Creates a SourceNode from generated code and a SourceMapConsumer.
 *
 * @param aGeneratedCode The generated code
 * @param aSourceMapConsumer The SourceMap for the generated code
 * @param aRelativePath Optional. The path that relative sources in the
 *        SourceMapConsumer should be relative to.
 */
SourceNode.fromStringWithSourceMap =
  function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
    // The SourceNode we want to fill with the generated code
    // and the SourceMap
    var node = new SourceNode();

    // All even indices of this array are one line of the generated code,
    // while all odd indices are the newlines between two adjacent lines
    // (since `REGEX_NEWLINE` captures its match).
    // Processed fragments are removed from this array, by calling `shiftNextLine`.
    var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
    var shiftNextLine = function() {
      var lineContents = remainingLines.shift();
      // The last line of a file might not have a newline.
      var newLine = remainingLines.shift() || "";
      return lineContents + newLine;
    };

    // We need to remember the position of "remainingLines"
    var lastGeneratedLine = 1, lastGeneratedColumn = 0;

    // The generate SourceNodes we need a code range.
    // To extract it current and last mapping is used.
    // Here we store the last mapping.
    var lastMapping = null;

    aSourceMapConsumer.eachMapping(function (mapping) {
      if (lastMapping !== null) {
        // We add the code from "lastMapping" to "mapping":
        // First check if there is a new line in between.
        if (lastGeneratedLine < mapping.generatedLine) {
          // Associate first line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
          lastGeneratedLine++;
          lastGeneratedColumn = 0;
          // The remaining code is added without mapping
        } else {
          // There is no new line in between.
          // Associate the code between "lastGeneratedColumn" and
          // "mapping.generatedColumn" with "lastMapping"
          var nextLine = remainingLines[0];
          var code = nextLine.substr(0, mapping.generatedColumn -
                                        lastGeneratedColumn);
          remainingLines[0] = nextLine.substr(mapping.generatedColumn -
                                              lastGeneratedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
          addMappingWithCode(lastMapping, code);
          // No more remaining code, continue
          lastMapping = mapping;
          return;
        }
      }
      // We add the generated code until the first mapping
      // to the SourceNode without any mapping.
      // Each line is added as separate string.
      while (lastGeneratedLine < mapping.generatedLine) {
        node.add(shiftNextLine());
        lastGeneratedLine++;
      }
      if (lastGeneratedColumn < mapping.generatedColumn) {
        var nextLine = remainingLines[0];
        node.add(nextLine.substr(0, mapping.generatedColumn));
        remainingLines[0] = nextLine.substr(mapping.generatedColumn);
        lastGeneratedColumn = mapping.generatedColumn;
      }
      lastMapping = mapping;
    }, this);
    // We have processed all mappings.
    if (remainingLines.length > 0) {
      if (lastMapping) {
        // Associate the remaining code in the current line with "lastMapping"
        addMappingWithCode(lastMapping, shiftNextLine());
      }
      // and add the remaining lines without any mapping
      node.add(remainingLines.join(""));
    }

    // Copy sourcesContent into SourceNode
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aRelativePath != null) {
          sourceFile = util.join(aRelativePath, sourceFile);
        }
        node.setSourceContent(sourceFile, content);
      }
    });

    return node;

    function addMappingWithCode(mapping, code) {
      if (mapping === null || mapping.source === undefined) {
        node.add(code);
      } else {
        var source = aRelativePath
          ? util.join(aRelativePath, mapping.source)
          : mapping.source;
        node.add(new SourceNode(mapping.originalLine,
                                mapping.originalColumn,
                                source,
                                code,
                                mapping.name));
      }
    }
  };

/**
 * Add a chunk of generated JS to this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.add = function SourceNode_add(aChunk) {
  if (Array.isArray(aChunk)) {
    aChunk.forEach(function (chunk) {
      this.add(chunk);
    }, this);
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    if (aChunk) {
      this.children.push(aChunk);
    }
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Add a chunk of generated JS to the beginning of this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
  if (Array.isArray(aChunk)) {
    for (var i = aChunk.length-1; i >= 0; i--) {
      this.prepend(aChunk[i]);
    }
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    this.children.unshift(aChunk);
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Walk over the tree of JS snippets in this node and its children. The
 * walking function is called once for each snippet of JS and is passed that
 * snippet and the its original associated source's line/column location.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walk = function SourceNode_walk(aFn) {
  var chunk;
  for (var i = 0, len = this.children.length; i < len; i++) {
    chunk = this.children[i];
    if (chunk[isSourceNode]) {
      chunk.walk(aFn);
    }
    else {
      if (chunk !== '') {
        aFn(chunk, { source: this.source,
                     line: this.line,
                     column: this.column,
                     name: this.name });
      }
    }
  }
};

/**
 * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
 * each of `this.children`.
 *
 * @param aSep The separator.
 */
SourceNode.prototype.join = function SourceNode_join(aSep) {
  var newChildren;
  var i;
  var len = this.children.length;
  if (len > 0) {
    newChildren = [];
    for (i = 0; i < len-1; i++) {
      newChildren.push(this.children[i]);
      newChildren.push(aSep);
    }
    newChildren.push(this.children[i]);
    this.children = newChildren;
  }
  return this;
};

/**
 * Call String.prototype.replace on the very right-most source snippet. Useful
 * for trimming whitespace from the end of a source node, etc.
 *
 * @param aPattern The pattern to replace.
 * @param aReplacement The thing to replace the pattern with.
 */
SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
  var lastChild = this.children[this.children.length - 1];
  if (lastChild[isSourceNode]) {
    lastChild.replaceRight(aPattern, aReplacement);
  }
  else if (typeof lastChild === 'string') {
    this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
  }
  else {
    this.children.push(''.replace(aPattern, aReplacement));
  }
  return this;
};

/**
 * Set the source content for a source file. This will be added to the SourceMapGenerator
 * in the sourcesContent field.
 *
 * @param aSourceFile The filename of the source file
 * @param aSourceContent The content of the source file
 */
SourceNode.prototype.setSourceContent =
  function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
    this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
  };

/**
 * Walk over the tree of SourceNodes. The walking function is called for each
 * source file content and is passed the filename and source content.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walkSourceContents =
  function SourceNode_walkSourceContents(aFn) {
    for (var i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i][isSourceNode]) {
        this.children[i].walkSourceContents(aFn);
      }
    }

    var sources = Object.keys(this.sourceContents);
    for (var i = 0, len = sources.length; i < len; i++) {
      aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
    }
  };

/**
 * Return the string representation of this source node. Walks over the tree
 * and concatenates all the various snippets together to one string.
 */
SourceNode.prototype.toString = function SourceNode_toString() {
  var str = "";
  this.walk(function (chunk) {
    str += chunk;
  });
  return str;
};

/**
 * Returns the string representation of this source node along with a source
 * map.
 */
SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
  var generated = {
    code: "",
    line: 1,
    column: 0
  };
  var map = new SourceMapGenerator(aArgs);
  var sourceMappingActive = false;
  var lastOriginalSource = null;
  var lastOriginalLine = null;
  var lastOriginalColumn = null;
  var lastOriginalName = null;
  this.walk(function (chunk, original) {
    generated.code += chunk;
    if (original.source !== null
        && original.line !== null
        && original.column !== null) {
      if(lastOriginalSource !== original.source
         || lastOriginalLine !== original.line
         || lastOriginalColumn !== original.column
         || lastOriginalName !== original.name) {
        map.addMapping({
          source: original.source,
          original: {
            line: original.line,
            column: original.column
          },
          generated: {
            line: generated.line,
            column: generated.column
          },
          name: original.name
        });
      }
      lastOriginalSource = original.source;
      lastOriginalLine = original.line;
      lastOriginalColumn = original.column;
      lastOriginalName = original.name;
      sourceMappingActive = true;
    } else if (sourceMappingActive) {
      map.addMapping({
        generated: {
          line: generated.line,
          column: generated.column
        }
      });
      lastOriginalSource = null;
      sourceMappingActive = false;
    }
    for (var idx = 0, length = chunk.length; idx < length; idx++) {
      if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
        generated.line++;
        generated.column = 0;
        // Mappings end at eol
        if (idx + 1 === length) {
          lastOriginalSource = null;
          sourceMappingActive = false;
        } else if (sourceMappingActive) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
      } else {
        generated.column++;
      }
    }
  });
  this.walkSourceContents(function (sourceFile, sourceContent) {
    map.setSourceContent(sourceFile, sourceContent);
  });

  return { code: generated.code, map: map };
};

exports.SourceNode = SourceNode;


/***/ }),

/***/ "./node_modules/stacktrace-gps/node_modules/source-map/lib/util.js":
/*!*************************************************************************!*\
  !*** ./node_modules/stacktrace-gps/node_modules/source-map/lib/util.js ***!
  \*************************************************************************/
/***/ ((__unused_webpack_module, exports) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a helper function for getting values from parameter/options
 * objects.
 *
 * @param args The object we are extracting values from
 * @param name The name of the property we are getting.
 * @param defaultValue An optional value to return if the property is missing
 * from the object. If this is not specified and the property is missing, an
 * error will be thrown.
 */
function getArg(aArgs, aName, aDefaultValue) {
  if (aName in aArgs) {
    return aArgs[aName];
  } else if (arguments.length === 3) {
    return aDefaultValue;
  } else {
    throw new Error('"' + aName + '" is a required argument.');
  }
}
exports.getArg = getArg;

var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
var dataUrlRegexp = /^data:.+\,.+$/;

function urlParse(aUrl) {
  var match = aUrl.match(urlRegexp);
  if (!match) {
    return null;
  }
  return {
    scheme: match[1],
    auth: match[2],
    host: match[3],
    port: match[4],
    path: match[5]
  };
}
exports.urlParse = urlParse;

function urlGenerate(aParsedUrl) {
  var url = '';
  if (aParsedUrl.scheme) {
    url += aParsedUrl.scheme + ':';
  }
  url += '//';
  if (aParsedUrl.auth) {
    url += aParsedUrl.auth + '@';
  }
  if (aParsedUrl.host) {
    url += aParsedUrl.host;
  }
  if (aParsedUrl.port) {
    url += ":" + aParsedUrl.port
  }
  if (aParsedUrl.path) {
    url += aParsedUrl.path;
  }
  return url;
}
exports.urlGenerate = urlGenerate;

/**
 * Normalizes a path, or the path portion of a URL:
 *
 * - Replaces consecutive slashes with one slash.
 * - Removes unnecessary '.' parts.
 * - Removes unnecessary '<dir>/..' parts.
 *
 * Based on code in the Node.js 'path' core module.
 *
 * @param aPath The path or url to normalize.
 */
function normalize(aPath) {
  var path = aPath;
  var url = urlParse(aPath);
  if (url) {
    if (!url.path) {
      return aPath;
    }
    path = url.path;
  }
  var isAbsolute = exports.isAbsolute(path);

  var parts = path.split(/\/+/);
  for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
    part = parts[i];
    if (part === '.') {
      parts.splice(i, 1);
    } else if (part === '..') {
      up++;
    } else if (up > 0) {
      if (part === '') {
        // The first part is blank if the path is absolute. Trying to go
        // above the root is a no-op. Therefore we can remove all '..' parts
        // directly after the root.
        parts.splice(i + 1, up);
        up = 0;
      } else {
        parts.splice(i, 2);
        up--;
      }
    }
  }
  path = parts.join('/');

  if (path === '') {
    path = isAbsolute ? '/' : '.';
  }

  if (url) {
    url.path = path;
    return urlGenerate(url);
  }
  return path;
}
exports.normalize = normalize;

/**
 * Joins two paths/URLs.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be joined with the root.
 *
 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
 *   first.
 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
 *   is updated with the result and aRoot is returned. Otherwise the result
 *   is returned.
 *   - If aPath is absolute, the result is aPath.
 *   - Otherwise the two paths are joined with a slash.
 * - Joining for example 'http://' and 'www.example.com' is also supported.
 */
function join(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }
  if (aPath === "") {
    aPath = ".";
  }
  var aPathUrl = urlParse(aPath);
  var aRootUrl = urlParse(aRoot);
  if (aRootUrl) {
    aRoot = aRootUrl.path || '/';
  }

  // `join(foo, '//www.example.org')`
  if (aPathUrl && !aPathUrl.scheme) {
    if (aRootUrl) {
      aPathUrl.scheme = aRootUrl.scheme;
    }
    return urlGenerate(aPathUrl);
  }

  if (aPathUrl || aPath.match(dataUrlRegexp)) {
    return aPath;
  }

  // `join('http://', 'www.example.com')`
  if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
    aRootUrl.host = aPath;
    return urlGenerate(aRootUrl);
  }

  var joined = aPath.charAt(0) === '/'
    ? aPath
    : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

  if (aRootUrl) {
    aRootUrl.path = joined;
    return urlGenerate(aRootUrl);
  }
  return joined;
}
exports.join = join;

exports.isAbsolute = function (aPath) {
  return aPath.charAt(0) === '/' || !!aPath.match(urlRegexp);
};

/**
 * Make a path relative to a URL or another path.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be made relative to aRoot.
 */
function relative(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }

  aRoot = aRoot.replace(/\/$/, '');

  // It is possible for the path to be above the root. In this case, simply
  // checking whether the root is a prefix of the path won't work. Instead, we
  // need to remove components from the root one by one, until either we find
  // a prefix that fits, or we run out of components to remove.
  var level = 0;
  while (aPath.indexOf(aRoot + '/') !== 0) {
    var index = aRoot.lastIndexOf("/");
    if (index < 0) {
      return aPath;
    }

    // If the only part of the root that is left is the scheme (i.e. http://,
    // file:///, etc.), one or more slashes (/), or simply nothing at all, we
    // have exhausted all components, so the path is not relative to the root.
    aRoot = aRoot.slice(0, index);
    if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
      return aPath;
    }

    ++level;
  }

  // Make sure we add a "../" for each component we removed from the root.
  return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
}
exports.relative = relative;

var supportsNullProto = (function () {
  var obj = Object.create(null);
  return !('__proto__' in obj);
}());

function identity (s) {
  return s;
}

/**
 * Because behavior goes wacky when you set `__proto__` on objects, we
 * have to prefix all the strings in our set with an arbitrary character.
 *
 * See https://github.com/mozilla/source-map/pull/31 and
 * https://github.com/mozilla/source-map/issues/30
 *
 * @param String aStr
 */
function toSetString(aStr) {
  if (isProtoString(aStr)) {
    return '$' + aStr;
  }

  return aStr;
}
exports.toSetString = supportsNullProto ? identity : toSetString;

function fromSetString(aStr) {
  if (isProtoString(aStr)) {
    return aStr.slice(1);
  }

  return aStr;
}
exports.fromSetString = supportsNullProto ? identity : fromSetString;

function isProtoString(s) {
  if (!s) {
    return false;
  }

  var length = s.length;

  if (length < 9 /* "__proto__".length */) {
    return false;
  }

  if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
      s.charCodeAt(length - 2) !== 95  /* '_' */ ||
      s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 4) !== 116 /* 't' */ ||
      s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
      s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
      s.charCodeAt(length - 8) !== 95  /* '_' */ ||
      s.charCodeAt(length - 9) !== 95  /* '_' */) {
    return false;
  }

  for (var i = length - 10; i >= 0; i--) {
    if (s.charCodeAt(i) !== 36 /* '$' */) {
      return false;
    }
  }

  return true;
}

/**
 * Comparator between two mappings where the original positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same original source/line/column, but different generated
 * line and column the same. Useful when searching for a mapping with a
 * stubbed out mapping.
 */
function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
  var cmp = mappingA.source - mappingB.source;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0 || onlyCompareOriginal) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  return mappingA.name - mappingB.name;
}
exports.compareByOriginalPositions = compareByOriginalPositions;

/**
 * Comparator between two mappings with deflated source and name indices where
 * the generated positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same generated line and column, but different
 * source/name/original line and column the same. Useful when searching for a
 * mapping with a stubbed out mapping.
 */
function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0 || onlyCompareGenerated) {
    return cmp;
  }

  cmp = mappingA.source - mappingB.source;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return mappingA.name - mappingB.name;
}
exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

function strcmp(aStr1, aStr2) {
  if (aStr1 === aStr2) {
    return 0;
  }

  if (aStr1 > aStr2) {
    return 1;
  }

  return -1;
}

/**
 * Comparator between two mappings with inflated source and name strings where
 * the generated positions are compared.
 */
function compareByGeneratedPositionsInflated(mappingA, mappingB) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;


/***/ }),

/***/ "./node_modules/stacktrace-gps/node_modules/source-map/source-map.js":
/*!***************************************************************************!*\
  !*** ./node_modules/stacktrace-gps/node_modules/source-map/source-map.js ***!
  \***************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
exports.SourceMapGenerator = __webpack_require__(/*! ./lib/source-map-generator */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/source-map-generator.js").SourceMapGenerator;
exports.SourceMapConsumer = __webpack_require__(/*! ./lib/source-map-consumer */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/source-map-consumer.js").SourceMapConsumer;
exports.SourceNode = __webpack_require__(/*! ./lib/source-node */ "./node_modules/stacktrace-gps/node_modules/source-map/lib/source-node.js").SourceNode;


/***/ }),

/***/ "./node_modules/stacktrace-gps/stacktrace-gps.js":
/*!*******************************************************!*\
  !*** ./node_modules/stacktrace-gps/stacktrace-gps.js ***!
  \*******************************************************/
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function(root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

    /* istanbul ignore next */
    if (true) {
        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! source-map */ "./node_modules/stacktrace-gps/node_modules/source-map/source-map.js"), __webpack_require__(/*! stackframe */ "./node_modules/stackframe/stackframe.js")], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    } else {}
}(this, function(SourceMap, StackFrame) {
    'use strict';

    /**
     * Make a X-Domain request to url and callback.
     *
     * @param {String} url
     * @returns {Promise} with response text if fulfilled
     */
    function _xdr(url) {
        return new Promise(function(resolve, reject) {
            var req = new XMLHttpRequest();
            req.open('get', url);
            req.onerror = reject;
            req.onreadystatechange = function onreadystatechange() {
                if (req.readyState === 4) {
                    if (req.status >= 200 && req.status < 300) {
                        resolve(req.responseText);
                    } else {
                        reject(new Error('HTTP status: ' + req.status + ' retrieving ' + url));
                    }
                }
            };
            req.send();
        });

    }

    /**
     * Convert a Base64-encoded string into its original representation.
     * Used for inline sourcemaps.
     *
     * @param {String} b64str Base-64 encoded string
     * @returns {String} original representation of the base64-encoded string.
     */
    function _atob(b64str) {
        if (typeof window !== 'undefined' && window.atob) {
            return window.atob(b64str);
        } else {
            throw new Error('You must supply a polyfill for window.atob in this environment');
        }
    }

    function _parseJson(string) {
        if (typeof JSON !== 'undefined' && JSON.parse) {
            return JSON.parse(string);
        } else {
            throw new Error('You must supply a polyfill for JSON.parse in this environment');
        }
    }

    function _findFunctionName(source, lineNumber/*, columnNumber*/) {
        // function {name}({args}) m[1]=name m[2]=args
        var reFunctionDeclaration = /function\s+([^(]*?)\s*\(([^)]*)\)/;
        // {name} = function ({args}) TODO args capture
        var reFunctionExpression = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*function\b/;
        // {name} = eval()
        var reFunctionEvaluation = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*(?:eval|new Function)\b/;
        var lines = source.split('\n');

        // Walk backwards in the source lines until we find the line which matches one of the patterns above
        var code = '';
        var maxLines = Math.min(lineNumber, 20);
        var m;
        for (var i = 0; i < maxLines; ++i) {
            // lineNo is 1-based, source[] is 0-based
            var line = lines[lineNumber - i - 1];
            var commentPos = line.indexOf('//');
            if (commentPos >= 0) {
                line = line.substr(0, commentPos);
            }

            if (line) {
                code = line + code;
                m = reFunctionExpression.exec(code);
                if (m && m[1]) {
                    return m[1];
                }
                m = reFunctionDeclaration.exec(code);
                if (m && m[1]) {
                    return m[1];
                }
                m = reFunctionEvaluation.exec(code);
                if (m && m[1]) {
                    return m[1];
                }
            }
        }
        return undefined;
    }

    function _ensureSupportedEnvironment() {
        if (typeof Object.defineProperty !== 'function' || typeof Object.create !== 'function') {
            throw new Error('Unable to consume source maps in older browsers');
        }
    }

    function _ensureStackFrameIsLegit(stackframe) {
        if (typeof stackframe !== 'object') {
            throw new TypeError('Given StackFrame is not an object');
        } else if (typeof stackframe.fileName !== 'string') {
            throw new TypeError('Given file name is not a String');
        } else if (typeof stackframe.lineNumber !== 'number' ||
            stackframe.lineNumber % 1 !== 0 ||
            stackframe.lineNumber < 1) {
            throw new TypeError('Given line number must be a positive integer');
        } else if (typeof stackframe.columnNumber !== 'number' ||
            stackframe.columnNumber % 1 !== 0 ||
            stackframe.columnNumber < 0) {
            throw new TypeError('Given column number must be a non-negative integer');
        }
        return true;
    }

    function _findSourceMappingURL(source) {
        var m = /\/\/[#@] ?sourceMappingURL=([^\s'"]+)\s*$/.exec(source);
        if (m && m[1]) {
            return m[1];
        } else {
            throw new Error('sourceMappingURL not found');
        }
    }

    function _extractLocationInfoFromSourceMap(stackframe, rawSourceMap, sourceCache) {
        return new Promise(function(resolve, reject) {
            var mapConsumer = new SourceMap.SourceMapConsumer(rawSourceMap);

            var loc = mapConsumer.originalPositionFor({
                line: stackframe.lineNumber,
                column: stackframe.columnNumber
            });

            if (loc.source) {
                var mappedSource = mapConsumer.sourceContentFor(loc.source);
                if (mappedSource) {
                    sourceCache[loc.source] = mappedSource;
                }
                resolve(
                    new StackFrame(
                        loc.name || stackframe.functionName,
                        stackframe.args,
                        loc.source,
                        loc.line,
                        loc.column));
            } else {
                reject(new Error('Could not get original source for given stackframe and source map'));
            }
        });
    }

    /**
     * @constructor
     * @param {Object} opts
     *      opts.sourceCache = {url: "Source String"} => preload source cache
     *      opts.offline = True to prevent network requests.
     *              Best effort without sources or source maps.
     *      opts.ajax = Promise returning function to make X-Domain requests
     */
    return function StackTraceGPS(opts) {
        if (!(this instanceof StackTraceGPS)) {
            return new StackTraceGPS(opts);
        }
        opts = opts || {};

        this.sourceCache = opts.sourceCache || {};

        this.ajax = opts.ajax || _xdr;

        this._atob = opts.atob || _atob;

        this._get = function _get(location) {
            return new Promise(function(resolve, reject) {
                var isDataUrl = location.substr(0, 5) === 'data:';
                if (this.sourceCache[location]) {
                    resolve(this.sourceCache[location]);
                } else if (opts.offline && !isDataUrl) {
                    reject(new Error('Cannot make network requests in offline mode'));
                } else {
                    if (isDataUrl) {
                        // data URLs can have parameters.
                        // see http://tools.ietf.org/html/rfc2397
                        var supportedEncodingRegexp =
                            /^data:application\/json;([\w=:"-]+;)*base64,/;
                        var match = location.match(supportedEncodingRegexp);
                        if (match) {
                            var sourceMapStart = match[0].length;
                            var encodedSource = location.substr(sourceMapStart);
                            var source = this._atob(encodedSource);
                            this.sourceCache[location] = source;
                            resolve(source);
                        } else {
                            reject(new Error('The encoding of the inline sourcemap is not supported'));
                        }
                    } else {
                        var xhrPromise = this.ajax(location, {method: 'get'});
                        // Cache the Promise to prevent duplicate in-flight requests
                        this.sourceCache[location] = xhrPromise;
                        xhrPromise.then(resolve, reject);
                    }
                }
            }.bind(this));
        };

        /**
         * Given a StackFrame, enhance function name and use source maps for a
         * better StackFrame.
         *
         * @param {StackFrame} stackframe object
         * @returns {Promise} that resolves with with source-mapped StackFrame
         */
        this.pinpoint = function StackTraceGPS$$pinpoint(stackframe) {
            return new Promise(function(resolve, reject) {
                this.getMappedLocation(stackframe).then(function(mappedStackFrame) {
                    function resolveMappedStackFrame() {
                        resolve(mappedStackFrame);
                    }

                    this.findFunctionName(mappedStackFrame)
                        .then(resolve, resolveMappedStackFrame)
                        ['catch'](resolveMappedStackFrame);
                }.bind(this), reject);
            }.bind(this));
        };

        /**
         * Given a StackFrame, guess function name from location information.
         *
         * @param {StackFrame} stackframe
         * @returns {Promise} that resolves with enhanced StackFrame.
         */
        this.findFunctionName = function StackTraceGPS$$findFunctionName(stackframe) {
            return new Promise(function(resolve, reject) {
                _ensureStackFrameIsLegit(stackframe);
                this._get(stackframe.fileName).then(function getSourceCallback(source) {
                    var lineNumber = stackframe.lineNumber;
                    var columnNumber = stackframe.columnNumber;
                    var guessedFunctionName = _findFunctionName(source, lineNumber, columnNumber);
                    // Only replace functionName if we found something
                    if (guessedFunctionName) {
                        resolve(new StackFrame(guessedFunctionName,
                            stackframe.args,
                            stackframe.fileName,
                            lineNumber,
                            columnNumber));
                    } else {
                        resolve(stackframe);
                    }
                }, reject)['catch'](reject);
            }.bind(this));
        };

        /**
         * Given a StackFrame, seek source-mapped location and return new enhanced StackFrame.
         *
         * @param {StackFrame} stackframe
         * @returns {Promise} that resolves with enhanced StackFrame.
         */
        this.getMappedLocation = function StackTraceGPS$$getMappedLocation(stackframe) {
            return new Promise(function(resolve, reject) {
                _ensureSupportedEnvironment();
                _ensureStackFrameIsLegit(stackframe);

                var sourceCache = this.sourceCache;
                var fileName = stackframe.fileName;
                this._get(fileName).then(function(source) {
                    var sourceMappingURL = _findSourceMappingURL(source);
                    var isDataUrl = sourceMappingURL.substr(0, 5) === 'data:';
                    var base = fileName.substring(0, fileName.lastIndexOf('/') + 1);

                    if (sourceMappingURL[0] !== '/' && !isDataUrl && !(/^https?:\/\/|^\/\//i).test(sourceMappingURL)) {
                        sourceMappingURL = base + sourceMappingURL;
                    }

                    this._get(sourceMappingURL).then(function(sourceMap) {
                        if (typeof sourceMap === 'string') {
                            sourceMap = _parseJson(sourceMap.replace(/^\)\]\}'/, ''));
                        }
                        if (typeof sourceMap.sourceRoot === 'undefined') {
                            sourceMap.sourceRoot = base;
                        }

                        _extractLocationInfoFromSourceMap(stackframe, sourceMap, sourceCache)
                            .then(resolve)['catch'](function() {
                            resolve(stackframe);
                        });
                    }, reject)['catch'](reject);
                }.bind(this), reject)['catch'](reject);
            }.bind(this));
        };
    };
}));


/***/ }),

/***/ "./node_modules/stacktrace-js/stacktrace.js":
/*!**************************************************!*\
  !*** ./node_modules/stacktrace-js/stacktrace.js ***!
  \**************************************************/
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function(root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

    /* istanbul ignore next */
    if (true) {
        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! error-stack-parser */ "./node_modules/error-stack-parser/error-stack-parser.js"), __webpack_require__(/*! stack-generator */ "./node_modules/stack-generator/stack-generator.js"), __webpack_require__(/*! stacktrace-gps */ "./node_modules/stacktrace-gps/stacktrace-gps.js")], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    } else {}
}(this, function StackTrace(ErrorStackParser, StackGenerator, StackTraceGPS) {
    var _options = {
        filter: function(stackframe) {
            // Filter out stackframes for this library by default
            return (stackframe.functionName || '').indexOf('StackTrace$$') === -1 &&
                (stackframe.functionName || '').indexOf('ErrorStackParser$$') === -1 &&
                (stackframe.functionName || '').indexOf('StackTraceGPS$$') === -1 &&
                (stackframe.functionName || '').indexOf('StackGenerator$$') === -1;
        },
        sourceCache: {}
    };

    var _generateError = function StackTrace$$GenerateError() {
        try {
            // Error must be thrown to get stack in IE
            throw new Error();
        } catch (err) {
            return err;
        }
    };

    /**
     * Merge 2 given Objects. If a conflict occurs the second object wins.
     * Does not do deep merges.
     *
     * @param {Object} first base object
     * @param {Object} second overrides
     * @returns {Object} merged first and second
     * @private
     */
    function _merge(first, second) {
        var target = {};

        [first, second].forEach(function(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    target[prop] = obj[prop];
                }
            }
            return target;
        });

        return target;
    }

    function _isShapedLikeParsableError(err) {
        return err.stack || err['opera#sourceloc'];
    }

    function _filtered(stackframes, filter) {
        if (typeof filter === 'function') {
            return stackframes.filter(filter);
        }
        return stackframes;
    }

    return {
        /**
         * Get a backtrace from invocation point.
         *
         * @param {Object} opts
         * @returns {Array} of StackFrame
         */
        get: function StackTrace$$get(opts) {
            var err = _generateError();
            return _isShapedLikeParsableError(err) ? this.fromError(err, opts) : this.generateArtificially(opts);
        },

        /**
         * Get a backtrace from invocation point.
         * IMPORTANT: Does not handle source maps or guess function names!
         *
         * @param {Object} opts
         * @returns {Array} of StackFrame
         */
        getSync: function StackTrace$$getSync(opts) {
            opts = _merge(_options, opts);
            var err = _generateError();
            var stack = _isShapedLikeParsableError(err) ? ErrorStackParser.parse(err) : StackGenerator.backtrace(opts);
            return _filtered(stack, opts.filter);
        },

        /**
         * Given an error object, parse it.
         *
         * @param {Error} error object
         * @param {Object} opts
         * @returns {Promise} for Array[StackFrame}
         */
        fromError: function StackTrace$$fromError(error, opts) {
            opts = _merge(_options, opts);
            var gps = new StackTraceGPS(opts);
            return new Promise(function(resolve) {
                var stackframes = _filtered(ErrorStackParser.parse(error), opts.filter);
                resolve(Promise.all(stackframes.map(function(sf) {
                    return new Promise(function(resolve) {
                        function resolveOriginal() {
                            resolve(sf);
                        }

                        gps.pinpoint(sf).then(resolve, resolveOriginal)['catch'](resolveOriginal);
                    });
                })));
            }.bind(this));
        },

        /**
         * Use StackGenerator to generate a backtrace.
         *
         * @param {Object} opts
         * @returns {Promise} of Array[StackFrame]
         */
        generateArtificially: function StackTrace$$generateArtificially(opts) {
            opts = _merge(_options, opts);
            var stackFrames = StackGenerator.backtrace(opts);
            if (typeof opts.filter === 'function') {
                stackFrames = stackFrames.filter(opts.filter);
            }
            return Promise.resolve(stackFrames);
        },

        /**
         * Given a function, wrap it such that invocations trigger a callback that
         * is called with a stack trace.
         *
         * @param {Function} fn to be instrumented
         * @param {Function} callback function to call with a stack trace on invocation
         * @param {Function} errback optional function to call with error if unable to get stack trace.
         * @param {Object} thisArg optional context object (e.g. window)
         */
        instrument: function StackTrace$$instrument(fn, callback, errback, thisArg) {
            if (typeof fn !== 'function') {
                throw new Error('Cannot instrument non-function object');
            } else if (typeof fn.__stacktraceOriginalFn === 'function') {
                // Already instrumented, return given Function
                return fn;
            }

            var instrumented = function StackTrace$$instrumented() {
                try {
                    this.get().then(callback, errback)['catch'](errback);
                    return fn.apply(thisArg || this, arguments);
                } catch (e) {
                    if (_isShapedLikeParsableError(e)) {
                        this.fromError(e).then(callback, errback)['catch'](errback);
                    }
                    throw e;
                }
            }.bind(this);
            instrumented.__stacktraceOriginalFn = fn;

            return instrumented;
        },

        /**
         * Given a function that has been instrumented,
         * revert the function to it's original (non-instrumented) state.
         *
         * @param {Function} fn to de-instrument
         */
        deinstrument: function StackTrace$$deinstrument(fn) {
            if (typeof fn !== 'function') {
                throw new Error('Cannot de-instrument non-function object');
            } else if (typeof fn.__stacktraceOriginalFn === 'function') {
                return fn.__stacktraceOriginalFn;
            } else {
                // Function not instrumented, return original
                return fn;
            }
        },

        /**
         * Given an error message and Array of StackFrames, serialize and POST to given URL.
         *
         * @param {Array} stackframes
         * @param {String} url
         * @param {String} errorMsg
         */
        report: function StackTrace$$report(stackframes, url, errorMsg) {
            return new Promise(function(resolve, reject) {
                var req = new XMLHttpRequest();
                req.onerror = reject;
                req.onreadystatechange = function onreadystatechange() {
                    if (req.readyState === 4) {
                        if (req.status >= 200 && req.status < 400) {
                            resolve(req.responseText);
                        } else {
                            reject(new Error('POST to ' + url + ' failed with status: ' + req.status));
                        }
                    }
                };
                req.open('post', url);
                req.setRequestHeader('Content-Type', 'application/json');

                var reportPayload = {stack: stackframes};
                if (errorMsg !== undefined) {
                    reportPayload.message = errorMsg;
                }

                req.send(JSON.stringify(reportPayload));
            });
        }
    };
}));


/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/control/CategoryServiceControl.js":
/*!*****************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/control/CategoryServiceControl.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var CategoryService_1 = __webpack_require__(/*! ../log/category/CategoryService */ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryService.js");
var LoggerOptions_1 = __webpack_require__(/*! ../log/LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
var DataStructures_1 = __webpack_require__(/*! ../utils/DataStructures */ "./node_modules/typescript-logging/dist/commonjs/utils/DataStructures.js");
/**
 * Implementation class for CategoryServiceControl.
 */
var CategoryServiceControlImpl = (function () {
    function CategoryServiceControlImpl() {
    }
    CategoryServiceControlImpl.prototype.help = function () {
        /* tslint:disable:no-console */
        console.log(CategoryServiceControlImpl._help);
        /* tslint:enable:no-console */
    };
    CategoryServiceControlImpl.prototype.example = function () {
        /* tslint:disable:no-console */
        console.log(CategoryServiceControlImpl._example);
        /* tslint:enable:no-console */
    };
    CategoryServiceControlImpl.prototype.showSettings = function (id) {
        if (id === void 0) { id = "all"; }
        var result = new DataStructures_1.StringBuilder();
        var service = CategoryServiceControlImpl._getCategoryService();
        var categories = CategoryServiceControlImpl._getCategories(id);
        categories.forEach(function (category) {
            CategoryServiceControlImpl._processCategory(service, category, result, 0);
        });
        /* tslint:disable:no-console */
        console.log(result.toString());
        /* tslint:enable:no-console */
    };
    CategoryServiceControlImpl.prototype.change = function (settings) {
        var service = CategoryServiceControlImpl._getCategoryService();
        var categories = CategoryServiceControlImpl._getCategories(settings.category);
        var logLevel = null;
        var formatEnum = null;
        var showCategoryName = null;
        var showTimestamp = null;
        var result = null;
        var addResult = function (value) {
            if (result !== null) {
                result += ", ";
            }
            if (result === null) {
                result = value;
            }
            else {
                result += value;
            }
        };
        addResult("recursive=" + settings.recursive);
        if (typeof settings.logLevel === "string") {
            logLevel = LoggerOptions_1.LogLevel.fromString(settings.logLevel);
            addResult("logLevel=" + settings.logLevel);
        }
        if (typeof settings.logFormat === "string") {
            formatEnum = LoggerOptions_1.DateFormatEnum.fromString(settings.logFormat);
            addResult("logFormat=" + settings.logFormat);
        }
        if (typeof settings.showCategoryName === "boolean") {
            showCategoryName = settings.showCategoryName;
            addResult("showCategoryName=" + settings.showCategoryName);
        }
        if (typeof settings.showTimestamp === "boolean") {
            showTimestamp = settings.showTimestamp;
            addResult("showTimestamp=" + settings.showTimestamp);
        }
        var applyChanges = function (cat) {
            var categorySettings = service.getCategorySettings(cat);
            // Should not happen but make tslint happy
            if (categorySettings !== null) {
                if (logLevel !== null) {
                    categorySettings.logLevel = logLevel;
                }
                if (formatEnum !== null) {
                    categorySettings.logFormat.dateFormat.formatEnum = formatEnum;
                }
                if (showTimestamp !== null) {
                    categorySettings.logFormat.showTimeStamp = showTimestamp;
                }
                if (showCategoryName !== null) {
                    categorySettings.logFormat.showCategoryName = showCategoryName;
                }
            }
        };
        categories.forEach(function (cat) { return CategoryServiceControlImpl._applyToCategory(cat, settings.recursive, applyChanges); });
        /* tslint:disable:no-console */
        console.log("Applied changes: " + result + " to categories '" + settings.category + "'.");
        /* tslint:enable:no-console */
    };
    CategoryServiceControlImpl.prototype.reset = function (id) {
        if (id === void 0) { id = "all"; }
        var service = CategoryServiceControlImpl._getCategoryService();
        var categories = CategoryServiceControlImpl._getCategories(id);
        var applyChanges = function (cat) {
            var categorySettings = service.getCategorySettings(cat);
            var original = service.getOriginalCategorySettings(cat);
            // Should not happen but make tslint happy
            if (categorySettings !== null && original !== null) {
                categorySettings.logLevel = original.logLevel;
                categorySettings.logFormat.dateFormat.formatEnum = original.logFormat.dateFormat.formatEnum;
                categorySettings.logFormat.showTimeStamp = original.logFormat.showTimeStamp;
                categorySettings.logFormat.showCategoryName = original.logFormat.showCategoryName;
            }
        };
        categories.forEach(function (cat) { return CategoryServiceControlImpl._applyToCategory(cat, true, applyChanges); });
        /* tslint:disable:no-console */
        console.log("Applied reset to category: " + id + ".");
        /* tslint:enable:no-console */
    };
    CategoryServiceControlImpl._processCategory = function (service, category, result, indent) {
        var settings = service.getCategorySettings(category);
        if (settings !== null) {
            result.append("  " + category.id + ": ");
            if (indent > 0) {
                for (var i = 0; i < indent; i++) {
                    result.append("  ");
                }
            }
            result.append(category.name + " (" + LoggerOptions_1.LogLevel[settings.logLevel].toString() + "@" + LoggerOptions_1.LoggerType[settings.loggerType].toString() + ")\n");
            if (category.children.length > 0) {
                category.children.forEach(function (child) {
                    CategoryServiceControlImpl._processCategory(service, child, result, indent + 1);
                });
            }
        }
    };
    CategoryServiceControlImpl._applyToCategory = function (category, recursive, apply) {
        apply(category);
        if (recursive) {
            category.children.forEach(function (child) {
                CategoryServiceControlImpl._applyToCategory(child, recursive, apply);
            });
        }
    };
    CategoryServiceControlImpl._getCategoryService = function () {
        return CategoryService_1.CategoryServiceImpl.getInstance();
    };
    CategoryServiceControlImpl._getCategories = function (idCategory) {
        var service = CategoryServiceControlImpl._getCategoryService();
        var categories = [];
        if (idCategory === "all") {
            categories = service.getRootCategories();
        }
        else {
            var category = service.getCategoryById(idCategory);
            if (category === null) {
                throw new Error("Failed to find category with id " + idCategory);
            }
            categories.push(category);
        }
        return categories;
    };
    CategoryServiceControlImpl._help = "\n  help(): void\n    ** Shows this help.\n\n  example(): void\n    ** Shows an example on how to use this.\n\n  showSettings(id: number | \"all\" = \"all\"): void\n    ** Shows settings for a specific category, or for all. The id of categories can be found by calling this method without parameter.\n\n  change(settings: CategoryServiceControlSettings): void\n    ** Changes the current settings for one or all categories.\n    **\n       CategoryServiceControlSettings, properties of object:\n         category: number | \"all\"\n           ** Apply to specific category, or \"all\".\n           ** Required\n\n         recursive: boolean\n           ** Apply to child categories (true) or not.\n           ** Required\n\n         logLevel: \"Fatal\" | \"Error\" | \"Warn\" | \"Info\" | \"Debug\" | \"Trace\" | undefined\n           ** Set log level, undefined will not change the setting.\n           ** Optional\n\n         logFormat: \"Default\" | \"YearMonthDayTime\" | \"YearDayMonthWithFullTime\" | \"YearDayMonthTime\" | undefined\n           ** Set the log format, undefined will not change the setting.\n           ** Optional\n\n         showTimestamp: boolean | undefined\n           ** Whether to show timestamp, undefined will not change the setting.\n           ** Optional\n\n         showCategoryName: boolean | undefined\n           ** Whether to show the category name, undefined will not change the setting.\n           ** Optional\n\n   reset(id: number | \"all\"): void\n     ** Resets everything to original values, for one specific or for all categories.\n";
    CategoryServiceControlImpl._example = "\n  Examples:\n    change({category: \"all\", recursive:true, logLevel: \"Info\"})\n      ** Change loglevel to Info for all categories, apply to child categories as well.\n\n    change({category: 1, recursive:false, logLevel: \"Warn\"})\n      ** Change logLevel for category 1, do not recurse.\n\n    change({category: \"all\", recursive:true, logLevel: \"Debug\", logFormat: \"YearDayMonthTime\", showTimestamp:false, showCategoryName:false})\n      ** Change loglevel to Debug for all categories, apply format, do not show timestamp and category names - recursively to child categories.\n\n";
    return CategoryServiceControlImpl;
}());
exports.CategoryServiceControlImpl = CategoryServiceControlImpl;
//# sourceMappingURL=CategoryServiceControl.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/control/LogGroupControl.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/control/LogGroupControl.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var LoggerOptions_1 = __webpack_require__(/*! ../log/LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
var LFService_1 = __webpack_require__(/*! ../log/standard/LFService */ "./node_modules/typescript-logging/dist/commonjs/log/standard/LFService.js");
var DataStructures_1 = __webpack_require__(/*! ../utils/DataStructures */ "./node_modules/typescript-logging/dist/commonjs/utils/DataStructures.js");
var LoggerControlImpl = (function () {
    function LoggerControlImpl() {
    }
    LoggerControlImpl.prototype.help = function () {
        /* tslint:disable:no-console */
        console.log(LoggerControlImpl._help);
        /* tslint:enable:no-console */
    };
    LoggerControlImpl.prototype.listFactories = function () {
        var rtSettingsFactories = LoggerControlImpl._getRuntimeSettingsLoggerFactories();
        var result = new DataStructures_1.StringBuilder();
        result.appendLine("Registered LoggerFactories (index / name)");
        for (var i = 0; i < rtSettingsFactories.length; i++) {
            var rtSettingsFactory = rtSettingsFactories[i];
            result.append("  " + i).append(": " + rtSettingsFactory.getName() + "\n");
        }
        /* tslint:disable:no-console */
        console.log(result.toString());
        /* tslint:enable:no-console */
    };
    LoggerControlImpl.prototype.showSettings = function (id) {
        if (id === void 0) { id = "all"; }
        var result = [];
        if (id === "all") {
            var idx_1 = 0;
            LoggerControlImpl._getRuntimeSettingsLoggerFactories().forEach(function (item) {
                result.push(new DataStructures_1.TuplePair(idx_1++, item));
            });
        }
        else {
            var settings = LoggerControlImpl._getRuntimeSettingsLoggerFactories();
            if (id >= 0 && id < settings.length) {
                result.push(new DataStructures_1.TuplePair(id, settings[id]));
            }
            else {
                throw new Error("Requested number: " + id + " was not found.");
            }
        }
        for (var _i = 0, result_1 = result; _i < result_1.length; _i++) {
            var setting = result_1[_i];
            /* tslint:disable:no-console */
            console.log("  LoggerFactory: " + setting.y.getName() + " (id=" + setting.x + ")");
            var logGroupRuntimeSettings = setting.y.getLogGroupRuntimeSettings();
            for (var g = 0; g < logGroupRuntimeSettings.length; g++) {
                var groupSetting = logGroupRuntimeSettings[g];
                console.log("     LogGroup: (id=" + g + ")");
                console.log("       RegExp: " + groupSetting.logGroupRule.regExp.source);
                console.log("       Level: " + LoggerOptions_1.LogLevel[groupSetting.level].toString());
                console.log("       LoggerType: " + LoggerOptions_1.LoggerType[groupSetting.loggerType].toString());
            }
            /* tslint:enable:no-console */
        }
    };
    LoggerControlImpl.prototype.reset = function (idFactory) {
        if (idFactory === void 0) { idFactory = "all"; }
        var loggerFactoriesSettings = LoggerControlImpl._getRuntimeSettingsLoggerFactories();
        var result = [];
        if (idFactory === "all") {
            result = loggerFactoriesSettings;
        }
        else {
            if (idFactory >= 0 && idFactory < loggerFactoriesSettings.length) {
                result.push(loggerFactoriesSettings[idFactory]);
            }
        }
        result.forEach(function (setting) {
            /* tslint:disable:no-console */
            console.log("Reset all settings for factory " + idFactory);
            /* tslint:enable:no-console */
            var control = new LoggerFactoryControlImpl(setting);
            control.reset();
        });
    };
    LoggerControlImpl.prototype.getLoggerFactoryControl = function (idFactory) {
        var loggerFactoriesSettings = LoggerControlImpl._getRuntimeSettingsLoggerFactories();
        if (idFactory >= 0 && idFactory < loggerFactoriesSettings.length) {
            return new LoggerFactoryControlImpl(loggerFactoriesSettings[idFactory]);
        }
        throw new Error("idFactory is invalid (less than 0) or non existing id.");
    };
    LoggerControlImpl._getRuntimeSettingsLoggerFactories = function () {
        return LoggerControlImpl._getSettings().getRuntimeSettingsForLoggerFactories();
    };
    LoggerControlImpl._getSettings = function () {
        return LFService_1.LFService.getRuntimeSettings();
    };
    LoggerControlImpl._help = "\n  help(): void\n    ** Shows this help.\n\n  listFactories(): void\n    ** List all registered LoggerFactories with associated log groups with respective ids (ids can be used to target a factory and/or group).\n\n  showSettings(idFactory: number | \"all\"): void\n    ** Show log group settings for idFactory (use listFactories to find id for a LoggerFactory). If idFactory is \"all\" shows all factories.\n\n  getLoggerFactoryControl(idFactory: number): LoggerFactoryControl\n    ** Return LoggerFactoryControl when found for given idFactory or throws Error if invalid or null, get the id by using listFactories()\n\n  reset(idFactory: number | \"all\"): void\n    ** Resets given factory or all factories back to original values.\n";
    return LoggerControlImpl;
}());
exports.LoggerControlImpl = LoggerControlImpl;
var LoggerFactoryControlImpl = (function () {
    function LoggerFactoryControlImpl(settings) {
        this._settings = settings;
    }
    LoggerFactoryControlImpl.prototype.help = function () {
        /* tslint:disable:no-console */
        console.log(LoggerFactoryControlImpl._help);
        /* tslint:enable:no-console */
    };
    LoggerFactoryControlImpl.prototype.example = function () {
        /* tslint:disable:no-console */
        console.log(LoggerFactoryControlImpl._example);
        /* tslint:enable:no-console */
    };
    LoggerFactoryControlImpl.prototype.showSettings = function (id) {
        if (id === void 0) { id = "all"; }
        var result = new DataStructures_1.StringBuilder();
        var logGroupRuntimeSettings = this._settings.getLogGroupRuntimeSettings();
        result.appendLine("Registered LogGroups (index / expression)");
        for (var i = 0; i < logGroupRuntimeSettings.length; i++) {
            var logGroupRuntimeSetting = logGroupRuntimeSettings[i];
            result.appendLine("  " + i + ": " + logGroupRuntimeSetting.logGroupRule.regExp.source + ", logLevel=" +
                LoggerOptions_1.LogLevel[logGroupRuntimeSetting.level].toString() + ", showTimestamp=" + logGroupRuntimeSetting.logFormat.showTimeStamp +
                ", showLoggerName=" + logGroupRuntimeSetting.logFormat.showLoggerName +
                ", format=" + LoggerOptions_1.DateFormatEnum[logGroupRuntimeSetting.logFormat.dateFormat.formatEnum].toString());
        }
        /* tslint:disable:no-console */
        console.log(result.toString());
        /* tslint:enable:no-console */
    };
    LoggerFactoryControlImpl.prototype.change = function (settings) {
        var logGroupRuntimeSettings = this._getLogGroupRunTimeSettingsFor(settings.group);
        var logLevel = null;
        var formatEnum = null;
        var showLoggerName = null;
        var showTimestamp = null;
        var result = null;
        var addResult = function (value) {
            if (result !== null) {
                result += ", ";
            }
            if (result === null) {
                result = value;
            }
            else {
                result += value;
            }
        };
        if (typeof settings.logLevel === "string") {
            logLevel = LoggerOptions_1.LogLevel.fromString(settings.logLevel);
            addResult("logLevel=" + settings.logLevel);
        }
        if (typeof settings.logFormat === "string") {
            formatEnum = LoggerOptions_1.DateFormatEnum.fromString(settings.logFormat);
            addResult("logFormat=" + settings.logFormat);
        }
        if (typeof settings.showLoggerName === "boolean") {
            showLoggerName = settings.showLoggerName;
            addResult("showLoggerName=" + settings.showLoggerName);
        }
        if (typeof settings.showTimestamp === "boolean") {
            showTimestamp = settings.showTimestamp;
            addResult("showTimestamp=" + settings.showTimestamp);
        }
        logGroupRuntimeSettings.forEach(function (s) {
            if (logLevel !== null) {
                s.level = logLevel;
            }
            if (formatEnum !== null) {
                s.logFormat.dateFormat.formatEnum = formatEnum;
            }
            if (showTimestamp !== null) {
                s.logFormat.showTimeStamp = showTimestamp;
            }
            if (showLoggerName !== null) {
                s.logFormat.showLoggerName = showLoggerName;
            }
        });
        /* tslint:disable:no-console */
        console.log("Applied changes: " + result + " to log groups '" + settings.group + "'.");
        /* tslint:enable:no-console */
    };
    LoggerFactoryControlImpl.prototype.reset = function (idGroup) {
        if (idGroup === void 0) { idGroup = "all"; }
        var settings = this._getLogGroupRunTimeSettingsFor(idGroup);
        for (var _i = 0, settings_1 = settings; _i < settings_1.length; _i++) {
            var setting = settings_1[_i];
            setting.level = setting.logGroupRule.level;
            setting.logFormat.showTimeStamp = setting.logGroupRule.logFormat.showTimeStamp;
            setting.logFormat.showLoggerName = setting.logGroupRule.logFormat.showLoggerName;
            setting.logFormat.dateFormat.formatEnum = setting.logGroupRule.logFormat.dateFormat.formatEnum;
        }
        /* tslint:disable:no-console */
        console.log("Reset all settings for group " + idGroup);
        /* tslint:enable:no-console */
    };
    LoggerFactoryControlImpl.prototype._getLogGroupRunTimeSettingsFor = function (idGroup) {
        var settings = [];
        if (idGroup === "all") {
            settings = this._settings.getLogGroupRuntimeSettings();
        }
        else {
            this._checkIndex(idGroup);
            settings.push(this._settings.getLogGroupRuntimeSettings()[idGroup]);
        }
        return settings;
    };
    LoggerFactoryControlImpl.prototype._checkIndex = function (index) {
        if (index < 0 || index >= this._settings.getLogGroupRuntimeSettings().length) {
            throw new Error("Invalid index, use listLogGroups to find out a valid one.");
        }
    };
    LoggerFactoryControlImpl._help = "\n  help(): void\n    ** Shows this help.\n\n  example(): void\n    ** Shows an example of usage.\n\n  showSettings(id: number | \"all\"): void\n    ** Prints settings for given group id, \"all\" for all group.\n\n  change(settings: LogGroupControlSettings): void\n    ** Changes the current settings for one or all log groups.\n    **\n       LogGroupControlSettings, properties of object:\n         group: number | \"all\"\n           ** Apply to specific group, or \"all\".\n           ** Required\n\n         logLevel: \"Fatal\" | \"Error\" | \"Warn\" | \"Info\" | \"Debug\" | \"Trace\" | undefined\n           ** Set log level, undefined will not change the setting.\n           ** Optional\n\n         logFormat: \"Default\" | \"YearMonthDayTime\" | \"YearDayMonthWithFullTime\" | \"YearDayMonthTime\" | undefined\n           ** Set the log format, undefined will not change the setting.\n           ** Optional\n\n         showTimestamp: boolean | undefined\n           ** Whether to show timestamp, undefined will not change the setting.\n           ** Optional\n\n         showLoggerName: boolean | undefined\n           ** Whether to show the logger name, undefined will not change the setting.\n           ** Optional\n\n  reset(id: number | \"all\"): void\n    ** Resets everything to original values, for one specific or for all groups.\n\n  help():\n    ** Shows this help.\n";
    LoggerFactoryControlImpl._example = "\n  Examples:\n    change({group: \"all\", logLevel: \"Info\"})\n      ** Change loglevel to Info for all groups.\n\n    change({group: 1, recursive:false, logLevel: \"Warn\"})\n      ** Change logLevel for group 1 to Warn.\n\n    change({group: \"all\", logLevel: \"Debug\", logFormat: \"YearDayMonthTime\", showTimestamp:false, showLoggerName:false})\n      ** Change loglevel to Debug for all groups, apply format, do not show timestamp and logger names.\n";
    return LoggerFactoryControlImpl;
}());
//# sourceMappingURL=LogGroupControl.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/extension/ExtensionHelper.js":
/*!************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/extension/ExtensionHelper.js ***!
  \************************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var CategoryService_1 = __webpack_require__(/*! ../log/category/CategoryService */ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryService.js");
var LoggerOptions_1 = __webpack_require__(/*! ../log/LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
var MessageUtils_1 = __webpack_require__(/*! ../utils/MessageUtils */ "./node_modules/typescript-logging/dist/commonjs/utils/MessageUtils.js");
var ExtensionHelper = (function () {
    function ExtensionHelper() {
        // Private constructor
    }
    /**
     * Enables the window event listener to listen to messages (from extensions).
     * Can be registered/enabled only once.
     */
    ExtensionHelper.register = function () {
        if (!ExtensionHelper.registered) {
            var listener = function (evt) {
                var msg = evt.data;
                if (msg !== null) {
                    ExtensionHelper.processMessageFromExtension(msg);
                }
            };
            if (typeof window !== "undefined" && typeof window.removeEventListener !== "undefined" && typeof window.addEventListener !== "undefined") {
                window.removeEventListener("message", listener);
                window.addEventListener("message", listener);
                ExtensionHelper.registered = true;
            }
        }
    };
    ExtensionHelper.processMessageFromExtension = function (msg) {
        if (!ExtensionHelper.registered) {
            return;
        }
        /* tslint:disable:no-console */
        if (msg.from === "tsl-extension") {
            var data = msg.data;
            switch (data.type) {
                case "register":
                    ExtensionHelper.enableExtensionIntegration();
                    break;
                case "request-change-loglevel":
                    var valueRequest = data.value;
                    var catsApplied = ExtensionHelper.applyLogLevel(valueRequest.categoryId, valueRequest.logLevel, valueRequest.recursive);
                    if (catsApplied.length > 0) {
                        // Send changes back
                        ExtensionHelper.sendCategoriesRuntimeUpdateMessage(catsApplied);
                    }
                    break;
                default:
                    console.log("Unknown command to process message from extension, command was: " + data.type);
                    break;
            }
        }
        /* tslint:enable:no-console */
    };
    ExtensionHelper.sendCategoryLogMessage = function (msg) {
        if (!ExtensionHelper.registered) {
            return;
        }
        var categoryIds = msg.categories.map(function (cat) {
            return cat.id;
        });
        var content = {
            type: "log-message",
            value: {
                categories: categoryIds,
                errorAsStack: msg.errorAsStack,
                formattedMessage: MessageUtils_1.MessageFormatUtils.renderDefaultMessage(msg, false),
                logLevel: LoggerOptions_1.LogLevel[msg.level].toString(),
                message: msg.messageAsString,
                resolvedErrorMessage: msg.isResolvedErrorMessage
            }
        };
        var message = {
            data: content,
            from: "tsl-logging",
        };
        ExtensionHelper.sendMessage(message);
    };
    ExtensionHelper.sendCategoriesRuntimeUpdateMessage = function (categories) {
        if (!ExtensionHelper.registered) {
            return;
        }
        var service = CategoryService_1.CategoryServiceImpl.getInstance();
        var catLevels = { categories: Array() };
        categories.forEach(function (cat) {
            var catSettings = service.getCategorySettings(cat);
            if (catSettings != null) {
                catLevels.categories.push({ id: cat.id, logLevel: LoggerOptions_1.LogLevel[catSettings.logLevel].toString() });
            }
        });
        var content = {
            type: "categories-rt-update",
            value: catLevels,
        };
        var message = {
            data: content,
            from: "tsl-logging"
        };
        ExtensionHelper.sendMessage(message);
    };
    ExtensionHelper.sendRootCategoriesToExtension = function () {
        if (!ExtensionHelper.registered) {
            return;
        }
        var categories = CategoryService_1.CategoryServiceImpl.getInstance().getRootCategories().map(function (cat) {
            return ExtensionHelper.getCategoryAsJSON(cat);
        });
        var content = {
            type: "root-categories-tree",
            value: categories
        };
        var message = {
            data: content,
            from: "tsl-logging"
        };
        ExtensionHelper.sendMessage(message);
    };
    /**
     * If extension integration is enabled, will send the root categories over to the extension.
     * Otherwise does nothing.
     */
    ExtensionHelper.getCategoryAsJSON = function (cat) {
        var childCategories = cat.children.map(function (child) {
            return ExtensionHelper.getCategoryAsJSON(child);
        });
        return {
            children: childCategories,
            id: cat.id,
            logLevel: LoggerOptions_1.LogLevel[cat.logLevel].toString(),
            name: cat.name,
            parentId: (cat.parent != null ? cat.parent.id : null),
        };
    };
    ExtensionHelper.applyLogLevel = function (categoryId, logLevel, recursive) {
        var cats = [];
        var category = CategoryService_1.CategoryServiceImpl.getInstance().getCategoryById(categoryId);
        if (category != null) {
            ExtensionHelper._applyLogLevelRecursive(category, LoggerOptions_1.LogLevel.fromString(logLevel), recursive, cats);
        }
        else {
            /* tslint:disable:no-console */
            console.log("Could not change log level, failed to find category with id: " + categoryId);
            /* tslint:enable:no-console */
        }
        return cats;
    };
    ExtensionHelper._applyLogLevelRecursive = function (category, logLevel, recursive, cats) {
        var categorySettings = CategoryService_1.CategoryServiceImpl.getInstance().getCategorySettings(category);
        if (categorySettings != null) {
            categorySettings.logLevel = logLevel;
            cats.push(category);
            if (recursive) {
                category.children.forEach(function (child) {
                    ExtensionHelper._applyLogLevelRecursive(child, logLevel, recursive, cats);
                });
            }
        }
    };
    ExtensionHelper.getAllCategories = function () {
        var cats = [];
        var addCats = function (cat, allCats) {
            allCats.push(cat);
            cat.children.forEach(function (catChild) {
                addCats(catChild, allCats);
            });
        };
        CategoryService_1.CategoryServiceImpl.getInstance().getRootCategories().forEach(function (cat) {
            addCats(cat, cats);
        });
        return cats;
    };
    ExtensionHelper.sendMessage = function (msg) {
        if (!ExtensionHelper.registered) {
            return;
        }
        if (typeof window !== "undefined" && typeof window.postMessage !== "undefined") {
            window.postMessage(msg, "*");
        }
    };
    /**
     *  Extension framework will call this to enable the integration between two,
     *  after this call the framework will respond with postMessage() messages.
     */
    ExtensionHelper.enableExtensionIntegration = function () {
        if (!ExtensionHelper.registered) {
            return;
        }
        var instance = CategoryService_1.CategoryServiceImpl.getInstance();
        instance.enableExtensionIntegration();
        // Send over all categories
        ExtensionHelper.sendRootCategoriesToExtension();
        // Send over the current runtime levels
        var cats = ExtensionHelper.getAllCategories();
        ExtensionHelper.sendCategoriesRuntimeUpdateMessage(cats);
    };
    ExtensionHelper.registered = false;
    return ExtensionHelper;
}());
exports.ExtensionHelper = ExtensionHelper;
//# sourceMappingURL=ExtensionHelper.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js":
/*!****************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js ***!
  \****************************************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Log level for a logger.
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Trace"] = 0] = "Trace";
    LogLevel[LogLevel["Debug"] = 1] = "Debug";
    LogLevel[LogLevel["Info"] = 2] = "Info";
    LogLevel[LogLevel["Warn"] = 3] = "Warn";
    LogLevel[LogLevel["Error"] = 4] = "Error";
    LogLevel[LogLevel["Fatal"] = 5] = "Fatal";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
/* tslint:disable:no-namespace */
(function (LogLevel) {
    /**
     * Returns LogLevel based on string representation
     * @param val Value
     * @returns {LogLevel}, Error is thrown if invalid.
     */
    function fromString(val) {
        if (val == null) {
            throw new Error("Argument must be set");
        }
        switch (val.toLowerCase()) {
            case "trace":
                return LogLevel.Trace;
            case "debug":
                return LogLevel.Debug;
            case "info":
                return LogLevel.Info;
            case "warn":
                return LogLevel.Warn;
            case "error":
                return LogLevel.Error;
            case "fatal":
                return LogLevel.Fatal;
            default:
                throw new Error("Unsupported value for conversion: " + val);
        }
    }
    LogLevel.fromString = fromString;
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
/* tslint:disable:enable-namespace */
/**
 * Where to log to? Pick one of the constants. Custom requires a callback to be present, see LFService.createLoggerFactory(...)
 * where this comes into play.
 */
var LoggerType;
(function (LoggerType) {
    LoggerType[LoggerType["Console"] = 0] = "Console";
    LoggerType[LoggerType["MessageBuffer"] = 1] = "MessageBuffer";
    LoggerType[LoggerType["Custom"] = 2] = "Custom";
})(LoggerType = exports.LoggerType || (exports.LoggerType = {}));
/**
 * Defines several date enums used for formatting a date.
 */
var DateFormatEnum;
(function (DateFormatEnum) {
    /**
     * Displays as: year-month-day hour:minute:second,millis -> 1999-02-12 23:59:59,123
     * Note the date separator can be set separately.
     */
    DateFormatEnum[DateFormatEnum["Default"] = 0] = "Default";
    /**
     * Displays as: year-month-day hour:minute:second -> 1999-02-12 23:59:59
     * Note the date separator can be set separately.
     */
    DateFormatEnum[DateFormatEnum["YearMonthDayTime"] = 1] = "YearMonthDayTime";
    /**
     * Displays as: year-day-month hour:minute:second,millis -> 1999-12-02 23:59:59,123
     * Note the date separator can be set separately.
     */
    DateFormatEnum[DateFormatEnum["YearDayMonthWithFullTime"] = 2] = "YearDayMonthWithFullTime";
    /**
     * Displays as: year-day-month hour:minute:second -> 1999-12-02 23:59:59
     * Note the date separator can be set separately.
     */
    DateFormatEnum[DateFormatEnum["YearDayMonthTime"] = 3] = "YearDayMonthTime";
})(DateFormatEnum = exports.DateFormatEnum || (exports.DateFormatEnum = {}));
/* tslint:disable:no-namespace */
(function (DateFormatEnum) {
    /**
     * Returns LogLevel based on string representation
     * @param val Value
     * @returns {LogLevel}, Error is thrown if invalid.
     */
    function fromString(val) {
        if (val == null) {
            throw new Error("Argument must be set");
        }
        switch (val.toLowerCase()) {
            case "default":
                return DateFormatEnum.Default;
            case "yearmonthdayTime":
                return DateFormatEnum.YearMonthDayTime;
            case "yeardaymonthwithfulltime":
                return DateFormatEnum.YearDayMonthWithFullTime;
            case "yeardaymonthtime":
                return DateFormatEnum.YearDayMonthTime;
            default:
                throw new Error("Unsupported value for conversion: " + val);
        }
    }
    DateFormatEnum.fromString = fromString;
})(DateFormatEnum = exports.DateFormatEnum || (exports.DateFormatEnum = {}));
/* tslint:disable:enable-namespace */
/**
 * DateFormat class, stores data on how to format a date.
 */
var DateFormat = (function () {
    /**
     * Constructor to define the dateformat used for logging, can be called empty as it uses defaults.
     * @param formatEnum DateFormatEnum, use one of the constants from the enum. Defaults to DateFormatEnum.Default
     * @param dateSeparator Separator used between dates, defaults to -
     */
    function DateFormat(formatEnum, dateSeparator) {
        if (formatEnum === void 0) { formatEnum = DateFormatEnum.Default; }
        if (dateSeparator === void 0) { dateSeparator = "-"; }
        this._formatEnum = formatEnum;
        this._dateSeparator = dateSeparator;
    }
    Object.defineProperty(DateFormat.prototype, "formatEnum", {
        get: function () {
            return this._formatEnum;
        },
        set: function (value) {
            this._formatEnum = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DateFormat.prototype, "dateSeparator", {
        get: function () {
            return this._dateSeparator;
        },
        set: function (value) {
            this._dateSeparator = value;
        },
        enumerable: true,
        configurable: true
    });
    DateFormat.prototype.copy = function () {
        return new DateFormat(this._formatEnum, this._dateSeparator);
    };
    return DateFormat;
}());
exports.DateFormat = DateFormat;
/**
 * Information about the log format, what will a log line look like?
 */
var LogFormat = (function () {
    /**
     * Constructor to create a LogFormat. Can be created without parameters where it will use sane defaults.
     * @param dateFormat DateFormat (what needs the date look like in the log line)
     * @param showTimeStamp Show date timestamp at all?
     * @param showLoggerName Show the logger name?
     */
    function LogFormat(dateFormat, showTimeStamp, showLoggerName) {
        if (dateFormat === void 0) { dateFormat = new DateFormat(); }
        if (showTimeStamp === void 0) { showTimeStamp = true; }
        if (showLoggerName === void 0) { showLoggerName = true; }
        this._showTimeStamp = true;
        this._showLoggerName = true;
        this._dateFormat = dateFormat;
        this._showTimeStamp = showTimeStamp;
        this._showLoggerName = showLoggerName;
    }
    Object.defineProperty(LogFormat.prototype, "dateFormat", {
        get: function () {
            return this._dateFormat;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogFormat.prototype, "showTimeStamp", {
        get: function () {
            return this._showTimeStamp;
        },
        set: function (value) {
            this._showTimeStamp = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogFormat.prototype, "showLoggerName", {
        get: function () {
            return this._showLoggerName;
        },
        set: function (value) {
            this._showLoggerName = value;
        },
        enumerable: true,
        configurable: true
    });
    return LogFormat;
}());
exports.LogFormat = LogFormat;
/**
 * Information about the log format, what will a log line look like?
 */
var CategoryLogFormat = (function () {
    /**
     * Create an instance defining the category log format used.
     * @param dateFormat Date format (uses default), for details see DateFormat class.
     * @param showTimeStamp True to show timestamp in the logging, defaults to true.
     * @param showCategoryName True to show category name in the logging, defaults to true.
     */
    function CategoryLogFormat(dateFormat, showTimeStamp, showCategoryName) {
        if (dateFormat === void 0) { dateFormat = new DateFormat(); }
        if (showTimeStamp === void 0) { showTimeStamp = true; }
        if (showCategoryName === void 0) { showCategoryName = true; }
        this._dateFormat = dateFormat;
        this._showTimeStamp = showTimeStamp;
        this._showCategoryName = showCategoryName;
    }
    Object.defineProperty(CategoryLogFormat.prototype, "dateFormat", {
        get: function () {
            return this._dateFormat;
        },
        set: function (value) {
            this._dateFormat = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryLogFormat.prototype, "showTimeStamp", {
        get: function () {
            return this._showTimeStamp;
        },
        set: function (value) {
            this._showTimeStamp = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryLogFormat.prototype, "showCategoryName", {
        get: function () {
            return this._showCategoryName;
        },
        set: function (value) {
            this._showCategoryName = value;
        },
        enumerable: true,
        configurable: true
    });
    CategoryLogFormat.prototype.copy = function () {
        return new CategoryLogFormat(this._dateFormat.copy(), this._showTimeStamp, this._showCategoryName);
    };
    return CategoryLogFormat;
}());
exports.CategoryLogFormat = CategoryLogFormat;
//# sourceMappingURL=LoggerOptions.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/category/AbstractCategoryLogger.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/category/AbstractCategoryLogger.js ***!
  \**********************************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DataStructures_1 = __webpack_require__(/*! ../../utils/DataStructures */ "./node_modules/typescript-logging/dist/commonjs/utils/DataStructures.js");
var MessageUtils_1 = __webpack_require__(/*! ../../utils/MessageUtils */ "./node_modules/typescript-logging/dist/commonjs/utils/MessageUtils.js");
var LoggerOptions_1 = __webpack_require__(/*! ../LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
var CategoryLogMessageImpl = (function () {
    function CategoryLogMessageImpl(message, error, categories, date, level, logFormat, ready) {
        this._resolvedErrorMessage = false;
        this._errorAsStack = null;
        this._message = message;
        this._error = error;
        this._categories = categories;
        this._date = date;
        this._level = level;
        this._logFormat = logFormat;
        this._ready = ready;
    }
    Object.defineProperty(CategoryLogMessageImpl.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryLogMessageImpl.prototype, "error", {
        get: function () {
            return this._error;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryLogMessageImpl.prototype, "categories", {
        get: function () {
            return this._categories;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryLogMessageImpl.prototype, "date", {
        get: function () {
            return this._date;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryLogMessageImpl.prototype, "level", {
        get: function () {
            return this._level;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryLogMessageImpl.prototype, "logFormat", {
        get: function () {
            return this._logFormat;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryLogMessageImpl.prototype, "isMessageLogData", {
        get: function () {
            return typeof (this._message) !== "string";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryLogMessageImpl.prototype, "messageAsString", {
        get: function () {
            if (typeof (this._message) === "string") {
                return this._message;
            }
            return this._message.msg;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryLogMessageImpl.prototype, "logData", {
        get: function () {
            var result = null;
            if (typeof (this._message) !== "string") {
                result = this.message;
            }
            return result;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryLogMessageImpl.prototype, "isResolvedErrorMessage", {
        get: function () {
            return this._resolvedErrorMessage;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryLogMessageImpl.prototype, "errorAsStack", {
        get: function () {
            return this._errorAsStack;
        },
        set: function (stack) {
            this._errorAsStack = stack;
        },
        enumerable: true,
        configurable: true
    });
    CategoryLogMessageImpl.prototype.isReady = function () {
        return this._ready;
    };
    CategoryLogMessageImpl.prototype.setReady = function (value) {
        this._ready = value;
    };
    Object.defineProperty(CategoryLogMessageImpl.prototype, "resolvedErrorMessage", {
        get: function () {
            return this._resolvedErrorMessage;
        },
        set: function (value) {
            this._resolvedErrorMessage = value;
        },
        enumerable: true,
        configurable: true
    });
    return CategoryLogMessageImpl;
}());
/**
 * Abstract category logger, use as your base class for new type of loggers (it
 * saves you a lot of work) and override doLog(CategoryLogMessage). The message argument
 * provides full access to anything related to the logging event.
 * If you just want the standard line of logging, call: this.createDefaultLogMessage(msg) on
 * this class which will return you the formatted log message as string (e.g. the
 * default loggers all use this).
 */
var AbstractCategoryLogger = (function () {
    function AbstractCategoryLogger(rootCategory, runtimeSettings) {
        this.allMessages = new DataStructures_1.LinkedList();
        this.rootCategory = rootCategory;
        this.runtimeSettings = runtimeSettings;
    }
    AbstractCategoryLogger.prototype.trace = function (msg) {
        var categories = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            categories[_i - 1] = arguments[_i];
        }
        this._log.apply(this, [LoggerOptions_1.LogLevel.Trace, msg, null, false].concat(categories));
    };
    AbstractCategoryLogger.prototype.debug = function (msg) {
        var categories = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            categories[_i - 1] = arguments[_i];
        }
        this._log.apply(this, [LoggerOptions_1.LogLevel.Debug, msg, null, false].concat(categories));
    };
    AbstractCategoryLogger.prototype.info = function (msg) {
        var categories = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            categories[_i - 1] = arguments[_i];
        }
        this._log.apply(this, [LoggerOptions_1.LogLevel.Info, msg, null, false].concat(categories));
    };
    AbstractCategoryLogger.prototype.warn = function (msg) {
        var categories = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            categories[_i - 1] = arguments[_i];
        }
        this._log.apply(this, [LoggerOptions_1.LogLevel.Warn, msg, null, false].concat(categories));
    };
    AbstractCategoryLogger.prototype.error = function (msg, error) {
        var categories = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            categories[_i - 2] = arguments[_i];
        }
        this._log.apply(this, [LoggerOptions_1.LogLevel.Error, msg, error, false].concat(categories));
    };
    AbstractCategoryLogger.prototype.fatal = function (msg, error) {
        var categories = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            categories[_i - 2] = arguments[_i];
        }
        this._log.apply(this, [LoggerOptions_1.LogLevel.Fatal, msg, error, false].concat(categories));
    };
    AbstractCategoryLogger.prototype.resolved = function (msg, error) {
        var categories = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            categories[_i - 2] = arguments[_i];
        }
        this._log.apply(this, [LoggerOptions_1.LogLevel.Error, msg, error, true].concat(categories));
    };
    AbstractCategoryLogger.prototype.log = function (level, msg, error) {
        var categories = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            categories[_i - 3] = arguments[_i];
        }
        this._log.apply(this, [level, msg, error, false].concat(categories));
    };
    AbstractCategoryLogger.prototype.getRootCategory = function () {
        return this.rootCategory;
    };
    AbstractCategoryLogger.prototype.createDefaultLogMessage = function (msg) {
        return MessageUtils_1.MessageFormatUtils.renderDefaultMessage(msg, true);
    };
    /**
     * Return optional message formatter. All LoggerTypes (except custom) will see if
     * they have this, and if so use it to log.
     * @returns {((message:CategoryLogMessage)=>string)|null}
     */
    AbstractCategoryLogger.prototype._getMessageFormatter = function () {
        var categorySettings = this.runtimeSettings.getCategorySettings(this.rootCategory);
        // Should not happen but make ts happy
        if (categorySettings === null) {
            throw new Error("Did not find CategorySettings for rootCategory: " + this.rootCategory.name);
        }
        return categorySettings.formatterLogMessage;
    };
    AbstractCategoryLogger.prototype._log = function (level, msg, error, resolved) {
        if (error === void 0) { error = null; }
        if (resolved === void 0) { resolved = false; }
        var categories = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            categories[_i - 4] = arguments[_i];
        }
        // this._logInternal(level, () => msg, () => error, resolved, ...categories);
        var functionMessage = function () {
            if (typeof msg === "function") {
                return msg();
            }
            return msg;
        };
        var functionError = function () {
            if (typeof error === "function") {
                return error();
            }
            return error;
        };
        this._logInternal.apply(this, [level, functionMessage, functionError, resolved].concat(categories));
    };
    AbstractCategoryLogger.prototype._logInternal = function (level, msg, error, resolved) {
        var _this = this;
        var categories = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            categories[_i - 4] = arguments[_i];
        }
        var logCategories = [this.rootCategory];
        // Log root category by default if none present
        if (typeof categories !== "undefined" && categories.length > 0) {
            logCategories = logCategories.concat(categories.filter(function (c) { return c !== _this.rootCategory; }));
        }
        var _loop_1 = function (i) {
            var category = logCategories[i];
            if (category === null) {
                throw new Error("Cannot have a null element within categories, at index=" + i);
            }
            var settings = this_1.runtimeSettings.getCategorySettings(category);
            if (settings === null) {
                throw new Error("Category with path: " + category.getCategoryPath() + " is not registered with this logger, maybe " +
                    "you registered it with a different root logger?");
            }
            if (settings.logLevel <= level) {
                var actualError = error !== null ? error() : null;
                if (actualError === null) {
                    var logMessage = new CategoryLogMessageImpl(msg(), actualError, logCategories, new Date(), level, settings.logFormat, true);
                    logMessage.resolvedErrorMessage = resolved;
                    this_1.allMessages.addTail(logMessage);
                    this_1.processMessages();
                }
                else {
                    var logMessage_1 = new CategoryLogMessageImpl(msg(), actualError, logCategories, new Date(), level, settings.logFormat, false);
                    logMessage_1.resolvedErrorMessage = resolved;
                    this_1.allMessages.addTail(logMessage_1);
                    MessageUtils_1.MessageFormatUtils.renderError(actualError).then(function (stack) {
                        logMessage_1.errorAsStack = stack;
                        logMessage_1.setReady(true);
                        _this.processMessages();
                    }).catch(function () {
                        logMessage_1.errorAsStack = "<UNKNOWN> unable to get stack.";
                        logMessage_1.setReady(true);
                        _this.processMessages();
                    });
                }
                return "break";
            }
        };
        var this_1 = this;
        // Get the runtime levels for given categories. If their level is lower than given level, we log.
        // In addition we pass along which category/categories we log this statement for.
        for (var i = 0; i < logCategories.length; i++) {
            var state_1 = _loop_1(i);
            if (state_1 === "break")
                break;
        }
    };
    AbstractCategoryLogger.prototype.processMessages = function () {
        // Basically we wait until errors are resolved (those messages
        // may not be ready).
        var msgs = this.allMessages;
        if (msgs.getSize() > 0) {
            do {
                var msg = msgs.getHead();
                if (msg != null) {
                    if (!msg.isReady()) {
                        break;
                    }
                    msgs.removeHead();
                    this.doLog(msg);
                }
            } while (msgs.getSize() > 0);
        }
    };
    return AbstractCategoryLogger;
}());
exports.AbstractCategoryLogger = AbstractCategoryLogger;
//# sourceMappingURL=AbstractCategoryLogger.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/category/Category.js":
/*!********************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/category/Category.js ***!
  \********************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var LoggerOptions_1 = __webpack_require__(/*! ../LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
var CategoryService_1 = __webpack_require__(/*! ./CategoryService */ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryService.js");
/**
 * Category for use with categorized logging.
 * At minimum you need one category, which will serve as the root category.
 * You can create child categories (like a tree). You can have multiple root
 * categories.
 */
var Category = (function () {
    function Category(name, parent) {
        if (parent === void 0) { parent = null; }
        this._children = [];
        this._logLevel = LoggerOptions_1.LogLevel.Error;
        if (name.indexOf("#") !== -1) {
            throw new Error("Cannot use # in a name of a Category");
        }
        this._id = Category.nextId();
        this._name = name;
        this._parent = parent;
        if (this._parent !== null) {
            this._parent._children.push(this);
        }
        CategoryService_1.CategoryServiceImpl.getInstance().registerCategory(this);
    }
    Object.defineProperty(Category.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Category.prototype, "parent", {
        get: function () {
            return this._parent;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Category.prototype, "children", {
        get: function () {
            return this._children;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Category.prototype, "logLevel", {
        get: function () {
            return this._logLevel;
        },
        enumerable: true,
        configurable: true
    });
    Category.prototype.trace = function (msg) {
        var categories = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            categories[_i - 1] = arguments[_i];
        }
        this.loadCategoryLogger();
        (_a = this._logger).trace.apply(_a, [msg].concat(categories));
        var _a;
    };
    Category.prototype.debug = function (msg) {
        var categories = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            categories[_i - 1] = arguments[_i];
        }
        this.loadCategoryLogger();
        (_a = this._logger).debug.apply(_a, [msg].concat(categories));
        var _a;
    };
    Category.prototype.info = function (msg) {
        var categories = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            categories[_i - 1] = arguments[_i];
        }
        this.loadCategoryLogger();
        (_a = this._logger).info.apply(_a, [msg].concat(categories));
        var _a;
    };
    Category.prototype.warn = function (msg) {
        var categories = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            categories[_i - 1] = arguments[_i];
        }
        this.loadCategoryLogger();
        (_a = this._logger).warn.apply(_a, [msg].concat(categories));
        var _a;
    };
    Category.prototype.error = function (msg, error) {
        var categories = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            categories[_i - 2] = arguments[_i];
        }
        this.loadCategoryLogger();
        (_a = this._logger).error.apply(_a, [msg, error].concat(categories));
        var _a;
    };
    Category.prototype.fatal = function (msg, error) {
        var categories = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            categories[_i - 2] = arguments[_i];
        }
        this.loadCategoryLogger();
        (_a = this._logger).fatal.apply(_a, [msg, error].concat(categories));
        var _a;
    };
    Category.prototype.resolved = function (msg, error) {
        var categories = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            categories[_i - 2] = arguments[_i];
        }
        this.loadCategoryLogger();
        (_a = this._logger).resolved.apply(_a, [msg, error].concat(categories));
        var _a;
    };
    Category.prototype.log = function (level, msg, error) {
        var categories = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            categories[_i - 3] = arguments[_i];
        }
        this.loadCategoryLogger();
        (_a = this._logger).log.apply(_a, [level, msg, error].concat(categories));
        var _a;
    };
    Category.prototype.getCategoryPath = function () {
        var result = this.name;
        var cat = this.parent;
        while (cat != null) {
            result = cat.name + "#" + result;
            cat = cat.parent;
        }
        return result;
    };
    Object.defineProperty(Category.prototype, "id", {
        /**
         * Returns the id for this category (this
         * is for internal purposes only).
         * @returns {number} Id
         */
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    Category.prototype.loadCategoryLogger = function () {
        if (!this._logger) {
            this._logger = CategoryService_1.CategoryServiceImpl.getInstance().getLogger(this);
        }
        if (typeof this._logger === "undefined" || this._logger === null) {
            throw new Error("Failed to load a logger for category (should not happen): " + this.name);
        }
    };
    Category.nextId = function () {
        return Category.currentId++;
    };
    Category.currentId = 1;
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryConfiguration.js":
/*!*********************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/category/CategoryConfiguration.js ***!
  \*********************************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var LoggerOptions_1 = __webpack_require__(/*! ../LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
/**
 * Default configuration, can be used to initially set a different default configuration
 * on the CategoryServiceFactory. This will be applied to all categories already registered (or
 * registered in the future). Can also be applied to one Category (and childs).
 */
var CategoryConfiguration = (function () {
    /**
     * Create a new instance
     * @param logLevel Log level for all loggers, default is LogLevel.Error
     * @param loggerType Where to log, default is LoggerType.Console
     * @param logFormat What logging format to use, use default instance, for default values see CategoryLogFormat.
     * @param callBackLogger Optional callback, if LoggerType.Custom is used as loggerType. In that case must return a new Logger instance.
     *            It is recommended to extend AbstractCategoryLogger to make your custom logger.
     */
    function CategoryConfiguration(logLevel, loggerType, logFormat, callBackLogger) {
        if (logLevel === void 0) { logLevel = LoggerOptions_1.LogLevel.Error; }
        if (loggerType === void 0) { loggerType = LoggerOptions_1.LoggerType.Console; }
        if (logFormat === void 0) { logFormat = new LoggerOptions_1.CategoryLogFormat(); }
        if (callBackLogger === void 0) { callBackLogger = null; }
        this._formatterLogMessage = null;
        this._logLevel = logLevel;
        this._loggerType = loggerType;
        this._logFormat = logFormat;
        this._callBackLogger = callBackLogger;
        if (this._loggerType === LoggerOptions_1.LoggerType.Custom && this.callBackLogger === null) {
            throw new Error("If you specify loggerType to be Custom, you must provide the callBackLogger argument");
        }
    }
    Object.defineProperty(CategoryConfiguration.prototype, "logLevel", {
        get: function () {
            return this._logLevel;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryConfiguration.prototype, "loggerType", {
        get: function () {
            return this._loggerType;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryConfiguration.prototype, "logFormat", {
        get: function () {
            return this._logFormat;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryConfiguration.prototype, "callBackLogger", {
        get: function () {
            return this._callBackLogger;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryConfiguration.prototype, "formatterLogMessage", {
        /**
         * Get the formatterLogMessage function, see comment on the setter.
         * @returns {((message:CategoryLogMessage)=>string)|null}
         */
        get: function () {
            return this._formatterLogMessage;
        },
        /**
         * Set the default formatterLogMessage function, if set it is applied to all type of loggers except for a custom logger.
         * By default this is null (not set). You can assign a function to allow custom formatting of a log message.
         * Each log message will call this function then and expects your function to format the message and return a string.
         * Will throw an error if you attempt to set a formatterLogMessage if the LoggerType is custom.
         * @param value The formatter function, or null to reset it.
         */
        set: function (value) {
            if (value !== null && this._loggerType === LoggerOptions_1.LoggerType.Custom) {
                throw new Error("You cannot specify a formatter for log messages if your loggerType is Custom");
            }
            this._formatterLogMessage = value;
        },
        enumerable: true,
        configurable: true
    });
    CategoryConfiguration.prototype.copy = function () {
        var config = new CategoryConfiguration(this.logLevel, this.loggerType, this.logFormat.copy(), this.callBackLogger);
        config.formatterLogMessage = this.formatterLogMessage;
        return config;
    };
    return CategoryConfiguration;
}());
exports.CategoryConfiguration = CategoryConfiguration;
//# sourceMappingURL=CategoryConfiguration.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryConsoleLoggerImpl.js":
/*!*************************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/category/CategoryConsoleLoggerImpl.js ***!
  \*************************************************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
var LoggerOptions_1 = __webpack_require__(/*! ../LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
var AbstractCategoryLogger_1 = __webpack_require__(/*! ./AbstractCategoryLogger */ "./node_modules/typescript-logging/dist/commonjs/log/category/AbstractCategoryLogger.js");
/**
 * Simple logger, that logs to the console. If the console is unavailable will throw an exception.
 */
var CategoryConsoleLoggerImpl = (function (_super) {
    __extends(CategoryConsoleLoggerImpl, _super);
    function CategoryConsoleLoggerImpl(rootCategory, runtimeSettings) {
        return _super.call(this, rootCategory, runtimeSettings) || this;
    }
    CategoryConsoleLoggerImpl.prototype.doLog = function (msg) {
        if (console !== undefined) {
            var messageFormatter = this._getMessageFormatter();
            var fullMsg = void 0;
            if (messageFormatter === null) {
                fullMsg = this.createDefaultLogMessage(msg);
            }
            else {
                fullMsg = messageFormatter(msg);
            }
            var logged = false;
            /* tslint:disable:no-console */
            switch (msg.level) {
                case LoggerOptions_1.LogLevel.Trace:
                    // Don't try trace we don't want stacks
                    break;
                case LoggerOptions_1.LogLevel.Debug:
                    // Don't try, too much differences of consoles.
                    break;
                case LoggerOptions_1.LogLevel.Info:
                    if (console.info) {
                        console.info(fullMsg);
                        logged = true;
                    }
                    break;
                case LoggerOptions_1.LogLevel.Warn:
                    if (console.warn) {
                        console.warn(fullMsg);
                        logged = true;
                    }
                    break;
                case LoggerOptions_1.LogLevel.Error:
                case LoggerOptions_1.LogLevel.Fatal:
                    if (console.error) {
                        console.error(fullMsg);
                        logged = true;
                    }
                    break;
                default:
                    throw new Error("Unsupported level: " + msg.level);
            }
            if (!logged) {
                console.log(fullMsg);
            }
            /* tslint:enable:no-console */
        }
        else {
            throw new Error("Console is not defined, cannot log msg: " + msg.messageAsString);
        }
    };
    return CategoryConsoleLoggerImpl;
}(AbstractCategoryLogger_1.AbstractCategoryLogger));
exports.CategoryConsoleLoggerImpl = CategoryConsoleLoggerImpl;
//# sourceMappingURL=CategoryConsoleLoggerImpl.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryDelegateLoggerImpl.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/category/CategoryDelegateLoggerImpl.js ***!
  \**************************************************************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Delegate logger, delegates logging to given logger (constructor).
 */
var CategoryDelegateLoggerImpl = (function () {
    function CategoryDelegateLoggerImpl(delegate) {
        this._delegate = delegate;
    }
    Object.defineProperty(CategoryDelegateLoggerImpl.prototype, "delegate", {
        get: function () {
            return this._delegate;
        },
        set: function (value) {
            this._delegate = value;
        },
        enumerable: true,
        configurable: true
    });
    CategoryDelegateLoggerImpl.prototype.trace = function (msg) {
        var categories = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            categories[_i - 1] = arguments[_i];
        }
        (_a = this._delegate).trace.apply(_a, [msg].concat(categories));
        var _a;
    };
    CategoryDelegateLoggerImpl.prototype.debug = function (msg) {
        var categories = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            categories[_i - 1] = arguments[_i];
        }
        (_a = this._delegate).debug.apply(_a, [msg].concat(categories));
        var _a;
    };
    CategoryDelegateLoggerImpl.prototype.info = function (msg) {
        var categories = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            categories[_i - 1] = arguments[_i];
        }
        (_a = this._delegate).info.apply(_a, [msg].concat(categories));
        var _a;
    };
    CategoryDelegateLoggerImpl.prototype.warn = function (msg) {
        var categories = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            categories[_i - 1] = arguments[_i];
        }
        (_a = this._delegate).warn.apply(_a, [msg].concat(categories));
        var _a;
    };
    CategoryDelegateLoggerImpl.prototype.error = function (msg, error) {
        var categories = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            categories[_i - 2] = arguments[_i];
        }
        (_a = this._delegate).error.apply(_a, [msg, error].concat(categories));
        var _a;
    };
    CategoryDelegateLoggerImpl.prototype.fatal = function (msg, error) {
        var categories = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            categories[_i - 2] = arguments[_i];
        }
        (_a = this._delegate).fatal.apply(_a, [msg, error].concat(categories));
        var _a;
    };
    CategoryDelegateLoggerImpl.prototype.resolved = function (msg, error) {
        var categories = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            categories[_i - 2] = arguments[_i];
        }
        (_a = this._delegate).resolved.apply(_a, [msg, error].concat(categories));
        var _a;
    };
    CategoryDelegateLoggerImpl.prototype.log = function (level, msg, error) {
        var categories = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            categories[_i - 3] = arguments[_i];
        }
        (_a = this._delegate).log.apply(_a, [level, msg, error].concat(categories));
        var _a;
    };
    return CategoryDelegateLoggerImpl;
}());
exports.CategoryDelegateLoggerImpl = CategoryDelegateLoggerImpl;
//# sourceMappingURL=CategoryDelegateLoggerImpl.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryExtensionLoggerImpl.js":
/*!***************************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/category/CategoryExtensionLoggerImpl.js ***!
  \***************************************************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
var ExtensionHelper_1 = __webpack_require__(/*! ../../extension/ExtensionHelper */ "./node_modules/typescript-logging/dist/commonjs/extension/ExtensionHelper.js");
var AbstractCategoryLogger_1 = __webpack_require__(/*! ./AbstractCategoryLogger */ "./node_modules/typescript-logging/dist/commonjs/log/category/AbstractCategoryLogger.js");
/**
 * This class should not be used directly, it is used for communication with the extension only.
 */
var CategoryExtensionLoggerImpl = (function (_super) {
    __extends(CategoryExtensionLoggerImpl, _super);
    function CategoryExtensionLoggerImpl(rootCategory, runtimeSettings) {
        return _super.call(this, rootCategory, runtimeSettings) || this;
    }
    CategoryExtensionLoggerImpl.prototype.doLog = function (msg) {
        if (typeof window !== "undefined") {
            ExtensionHelper_1.ExtensionHelper.sendCategoryLogMessage(msg);
        }
        else {
            /* tslint:disable:no-console */
            console.log("window is not available, you must be running in a browser for this. Dropped message.");
            /* tslint:enable:no-console */
        }
    };
    return CategoryExtensionLoggerImpl;
}(AbstractCategoryLogger_1.AbstractCategoryLogger));
exports.CategoryExtensionLoggerImpl = CategoryExtensionLoggerImpl;
//# sourceMappingURL=CategoryExtensionLoggerImpl.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryMessageBufferImpl.js":
/*!*************************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/category/CategoryMessageBufferImpl.js ***!
  \*************************************************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
var AbstractCategoryLogger_1 = __webpack_require__(/*! ./AbstractCategoryLogger */ "./node_modules/typescript-logging/dist/commonjs/log/category/AbstractCategoryLogger.js");
/**
 * Logger which buffers all messages, use with care due to possible high memory footprint.
 * Can be convenient in some cases. Call toString() for full output, or cast to this class
 * and call getMessages() to do something with it yourself.
 */
var CategoryMessageBufferLoggerImpl = (function (_super) {
    __extends(CategoryMessageBufferLoggerImpl, _super);
    function CategoryMessageBufferLoggerImpl() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.messages = [];
        return _this;
    }
    CategoryMessageBufferLoggerImpl.prototype.getMessages = function () {
        return this.messages;
    };
    CategoryMessageBufferLoggerImpl.prototype.toString = function () {
        return this.messages.map(function (msg) {
            return msg;
        }).join("\n");
    };
    CategoryMessageBufferLoggerImpl.prototype.doLog = function (msg) {
        var messageFormatter = this._getMessageFormatter();
        var fullMsg;
        if (messageFormatter === null) {
            fullMsg = this.createDefaultLogMessage(msg);
        }
        else {
            fullMsg = messageFormatter(msg);
        }
        this.messages.push(fullMsg);
    };
    return CategoryMessageBufferLoggerImpl;
}(AbstractCategoryLogger_1.AbstractCategoryLogger));
exports.CategoryMessageBufferLoggerImpl = CategoryMessageBufferLoggerImpl;
//# sourceMappingURL=CategoryMessageBufferImpl.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryRuntimeSettings.js":
/*!***********************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/category/CategoryRuntimeSettings.js ***!
  \***********************************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var LoggerOptions_1 = __webpack_require__(/*! ../LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
/**
 * RuntimeSettings for a category, at runtime these are associated to a category.
 */
var CategoryRuntimeSettings = (function () {
    function CategoryRuntimeSettings(category, logLevel, loggerType, logFormat, callBackLogger, formatterLogMessage) {
        if (logLevel === void 0) { logLevel = LoggerOptions_1.LogLevel.Error; }
        if (loggerType === void 0) { loggerType = LoggerOptions_1.LoggerType.Console; }
        if (logFormat === void 0) { logFormat = new LoggerOptions_1.CategoryLogFormat(); }
        if (callBackLogger === void 0) { callBackLogger = null; }
        if (formatterLogMessage === void 0) { formatterLogMessage = null; }
        this._formatterLogMessage = null;
        this._category = category;
        this._logLevel = logLevel;
        this._loggerType = loggerType;
        this._logFormat = logFormat;
        this._callBackLogger = callBackLogger;
        this._formatterLogMessage = formatterLogMessage;
    }
    Object.defineProperty(CategoryRuntimeSettings.prototype, "category", {
        get: function () {
            return this._category;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryRuntimeSettings.prototype, "logLevel", {
        get: function () {
            return this._logLevel;
        },
        set: function (value) {
            this._logLevel = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryRuntimeSettings.prototype, "loggerType", {
        get: function () {
            return this._loggerType;
        },
        set: function (value) {
            this._loggerType = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryRuntimeSettings.prototype, "logFormat", {
        get: function () {
            return this._logFormat;
        },
        set: function (value) {
            this._logFormat = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryRuntimeSettings.prototype, "callBackLogger", {
        get: function () {
            return this._callBackLogger;
        },
        set: function (value) {
            this._callBackLogger = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryRuntimeSettings.prototype, "formatterLogMessage", {
        get: function () {
            return this._formatterLogMessage;
        },
        set: function (value) {
            this._formatterLogMessage = value;
        },
        enumerable: true,
        configurable: true
    });
    return CategoryRuntimeSettings;
}());
exports.CategoryRuntimeSettings = CategoryRuntimeSettings;
//# sourceMappingURL=CategoryRuntimeSettings.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryService.js":
/*!***************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/category/CategoryService.js ***!
  \***************************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DataStructures_1 = __webpack_require__(/*! ../../utils/DataStructures */ "./node_modules/typescript-logging/dist/commonjs/utils/DataStructures.js");
var LoggerOptions_1 = __webpack_require__(/*! ../LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
var CategoryConsoleLoggerImpl_1 = __webpack_require__(/*! ./CategoryConsoleLoggerImpl */ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryConsoleLoggerImpl.js");
var CategoryDelegateLoggerImpl_1 = __webpack_require__(/*! ./CategoryDelegateLoggerImpl */ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryDelegateLoggerImpl.js");
var CategoryExtensionLoggerImpl_1 = __webpack_require__(/*! ./CategoryExtensionLoggerImpl */ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryExtensionLoggerImpl.js");
var CategoryMessageBufferImpl_1 = __webpack_require__(/*! ./CategoryMessageBufferImpl */ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryMessageBufferImpl.js");
var ExtensionHelper_1 = __webpack_require__(/*! ../../extension/ExtensionHelper */ "./node_modules/typescript-logging/dist/commonjs/extension/ExtensionHelper.js");
var CategoryRuntimeSettings_1 = __webpack_require__(/*! ./CategoryRuntimeSettings */ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryRuntimeSettings.js");
var CategoryConfiguration_1 = __webpack_require__(/*! ./CategoryConfiguration */ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryConfiguration.js");
/**
 * The service (only available as singleton) for all category related stuff as
 * retrieving, registering a logger. You should normally NOT use this,
 * instead use CategoryServiceFactory which is meant for end users.
 */
var CategoryServiceImpl = (function () {
    function CategoryServiceImpl() {
        this._defaultConfig = new CategoryConfiguration_1.CategoryConfiguration();
        this._mapState = new DataStructures_1.SimpleMap();
        // Private constructor
        ExtensionHelper_1.ExtensionHelper.register();
    }
    CategoryServiceImpl.getInstance = function () {
        // Load on-demand, to assure webpack ordering of module usage doesn't screw things over
        // for us when we accidentally change the order.
        if (CategoryServiceImpl._INSTANCE === null) {
            CategoryServiceImpl._INSTANCE = new CategoryServiceImpl();
        }
        return CategoryServiceImpl._INSTANCE;
    };
    CategoryServiceImpl.prototype.getLogger = function (category) {
        return this.createOrGetCategoryState(category).logger;
    };
    /**
     * Clears everything, including a default configuration you may have set.
     * After this you need to re-register your categories etc.
     */
    CategoryServiceImpl.prototype.clear = function () {
        this._mapState.clear();
        this.setDefaultConfiguration(new CategoryConfiguration_1.CategoryConfiguration());
    };
    CategoryServiceImpl.prototype.getCategorySettings = function (category) {
        return this.createOrGetCategoryState(category).currentRuntimeSettings;
    };
    CategoryServiceImpl.prototype.getOriginalCategorySettings = function (category) {
        return this.createOrGetCategoryState(category).originalRuntimeSettings;
    };
    /**
     * Set the default configuration. New root loggers created get this
     * applied. If you want to reset all current loggers to have this
     * applied as well, pass in reset=true (the default is false). All
     * categories will be reset then as well.
     * @param config New config
     * @param reset Defaults to true. Set to true to reset all loggers and current runtimesettings.
     */
    CategoryServiceImpl.prototype.setDefaultConfiguration = function (config, reset) {
        if (reset === void 0) { reset = true; }
        this._defaultConfig = config;
        if (reset) {
            this._mapState.forEachValue(function (state) {
                state.updateSettings(config);
            });
        }
    };
    /**
     * Set new configuration settings for a category (and possibly its child categories)
     * @param config Config
     * @param category Category
     * @param applyChildren True to apply to child categories, defaults to false.
     */
    CategoryServiceImpl.prototype.setConfigurationCategory = function (config, category, applyChildren) {
        var _this = this;
        if (applyChildren === void 0) { applyChildren = false; }
        this.createOrGetCategoryState(category).updateSettings(config);
        // Apply the settings to children recursive if requested
        if (applyChildren) {
            category.children.forEach(function (child) {
                // False flag, a child cannot reset a rootlogger
                _this.setConfigurationCategory(config, child, applyChildren);
            });
        }
    };
    CategoryServiceImpl.prototype.registerCategory = function (category) {
        if (category === null || typeof category === "undefined") {
            throw new Error("Category CANNOT be null/undefined");
        }
        if (this._mapState.exists(CategoryServiceImpl.getCategoryKey(category))) {
            throw new Error("Cannot add this root category with name: " + category.name + ", it already exists (same name in hierarchy).");
        }
        this.createOrGetCategoryState(category);
    };
    /**
     * Used to enable integration with chrome extension. Do not use manually, the
     * extension and the logger framework deal with this.
     */
    CategoryServiceImpl.prototype.enableExtensionIntegration = function () {
        var _this = this;
        this._mapState.forEachValue(function (state) { return state.enableForExtension(_this); });
    };
    /**
     * Return all root categories currently registered.
     */
    CategoryServiceImpl.prototype.getRootCategories = function () {
        return this._mapState.values().filter(function (state) { return state.category.parent == null; }).map(function (state) { return state.category; });
    };
    /**
     * Return Category by id
     * @param id The id of the category to find
     * @returns {Category} or null if not found
     */
    CategoryServiceImpl.prototype.getCategoryById = function (id) {
        var result = this._mapState.values().filter(function (state) { return state.category.id === id; }).map(function (state) { return state.category; });
        if (result.length === 1) {
            return result[0];
        }
        return null;
    };
    CategoryServiceImpl.prototype.createOrGetCategoryState = function (category) {
        var key = CategoryServiceImpl.getCategoryKey(category);
        var state = this._mapState.get(key);
        if (typeof state !== "undefined") {
            return state;
        }
        var newState = this.createState(category);
        this._mapState.put(key, newState);
        return newState;
    };
    CategoryServiceImpl.prototype.createState = function (category) {
        var _this = this;
        return new CategoryState(category, function () { return _this._defaultConfig; }, function (config, cat) { return _this.createLogger(config, cat); });
    };
    CategoryServiceImpl.prototype.createLogger = function (config, category) {
        // Default is always a console logger
        switch (config.loggerType) {
            case LoggerOptions_1.LoggerType.Console:
                return new CategoryConsoleLoggerImpl_1.CategoryConsoleLoggerImpl(category, this);
            case LoggerOptions_1.LoggerType.MessageBuffer:
                return new CategoryMessageBufferImpl_1.CategoryMessageBufferLoggerImpl(category, this);
            case LoggerOptions_1.LoggerType.Custom:
                if (config.callBackLogger === null) {
                    throw new Error("Cannot create custom logger, custom callback is null");
                }
                else {
                    return config.callBackLogger(category, this);
                }
            default:
                throw new Error("Cannot create a Logger for LoggerType: " + config.loggerType);
        }
    };
    CategoryServiceImpl.getCategoryKey = function (category) {
        return category.getCategoryPath();
    };
    // Singleton category service, used by CategoryServiceFactory as well as Categories.
    // Loaded on demand. Do NOT change as webpack may pack things in wrong order otherwise.
    CategoryServiceImpl._INSTANCE = null;
    return CategoryServiceImpl;
}());
exports.CategoryServiceImpl = CategoryServiceImpl;
var CategoryState = (function () {
    function CategoryState(category, defaultConfig, createLogger) {
        this._category = category;
        this._lazyState = new LazyState(category, defaultConfig, createLogger);
    }
    Object.defineProperty(CategoryState.prototype, "category", {
        get: function () {
            return this._category;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryState.prototype, "logger", {
        get: function () {
            return this._lazyState.getLogger();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryState.prototype, "originalRuntimeSettings", {
        get: function () {
            return this._lazyState.getOriginalRuntimeSettings();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CategoryState.prototype, "currentRuntimeSettings", {
        get: function () {
            return this._lazyState.getCurrentRuntimeSettings();
        },
        enumerable: true,
        configurable: true
    });
    CategoryState.prototype.enableForExtension = function (runtimeSettings) {
        this._lazyState.enableForExtension(runtimeSettings);
    };
    CategoryState.prototype.updateSettings = function (config) {
        this._lazyState.updateSettings(config);
    };
    return CategoryState;
}());
var LazyState = (function () {
    function LazyState(category, defaultConfig, createLogger) {
        this._category = category;
        this._defaultConfig = defaultConfig;
        this._createLogger = createLogger;
    }
    LazyState.prototype.isLoaded = function () {
        return (typeof this._logger !== "undefined");
    };
    LazyState.prototype.getLogger = function () {
        this.loadLoggerOnDemand();
        return this._delegateLogger;
    };
    LazyState.prototype.getOriginalRuntimeSettings = function () {
        this.loadLoggerOnDemand();
        return this._originalRuntimeSettings;
    };
    LazyState.prototype.getCurrentRuntimeSettings = function () {
        this.loadLoggerOnDemand();
        return this._currentRuntimeSettings;
    };
    LazyState.prototype.enableForExtension = function (runtimeSettings) {
        this.loadLoggerOnDemand();
        if (!(this._wrappedLogger instanceof CategoryExtensionLoggerImpl_1.CategoryExtensionLoggerImpl)) {
            /* tslint:disable no-console */
            console.log("Reconfiguring logger for extension for category: " + this._category.name);
            /* tslint:enable no-console */
            this._wrappedLogger = new CategoryExtensionLoggerImpl_1.CategoryExtensionLoggerImpl(this._category, runtimeSettings);
            this._delegateLogger.delegate = this._wrappedLogger;
        }
    };
    LazyState.prototype.updateSettings = function (config) {
        if (this.isLoaded()) {
            this._currentRuntimeSettings.logLevel = config.logLevel;
            this._currentRuntimeSettings.loggerType = config.loggerType;
            this._currentRuntimeSettings.logFormat = config.logFormat;
            this._currentRuntimeSettings.callBackLogger = config.callBackLogger;
            this._currentRuntimeSettings.formatterLogMessage = config.formatterLogMessage;
            // Replace the real logger, it may have changed.
            this._logger = this._createLogger(config, this._category);
            if (!(this._wrappedLogger instanceof CategoryExtensionLoggerImpl_1.CategoryExtensionLoggerImpl)) {
                this._wrappedLogger = this._logger;
            }
            this._delegateLogger.delegate = this._wrappedLogger;
        }
        else {
            // Set this config, it may be for the category specific, the default is therefore not good enough.
            this._defaultConfig = function () { return config; };
        }
    };
    LazyState.prototype.loadLoggerOnDemand = function () {
        if (!this.isLoaded()) {
            this._logger = this._createLogger(this._defaultConfig(), this._category);
            this._wrappedLogger = this._logger;
            this._delegateLogger = new CategoryDelegateLoggerImpl_1.CategoryDelegateLoggerImpl(this._wrappedLogger);
            this._originalRuntimeSettings = this.initNewSettings();
            this._currentRuntimeSettings = this.initNewSettings();
        }
    };
    LazyState.prototype.initNewSettings = function () {
        var defSettings = this._defaultConfig().copy();
        return new CategoryRuntimeSettings_1.CategoryRuntimeSettings(this._category, defSettings.logLevel, defSettings.loggerType, defSettings.logFormat, defSettings.callBackLogger, defSettings.formatterLogMessage);
    };
    return LazyState;
}());
//# sourceMappingURL=CategoryService.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryServiceFactory.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/category/CategoryServiceFactory.js ***!
  \**********************************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var CategoryService_1 = __webpack_require__(/*! ./CategoryService */ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryService.js");
/**
 * Categorized service for logging, where logging is bound to categories which
 * can log horizontally through specific application logic (services, group(s) of components etc).
 * For the standard way of logging like most frameworks do these days, use LFService instead.
 * If you want fine grained control to divide sections of your application in
 * logical units to enable/disable logging for, this is the service you want to use instead.
 * Also for this type a browser plugin will be available.
 */
var CategoryServiceFactory = (function () {
    function CategoryServiceFactory() {
        // Private constructor.
    }
    /**
     * Return a CategoryLogger for given ROOT category (thus has no parent).
     * You can only retrieve loggers for their root, when logging
     * you specify to log for what (child)categories.
     * @param root Category root (has no parent)
     * @returns {CategoryLogger}
     */
    CategoryServiceFactory.getLogger = function (root) {
        return CategoryService_1.CategoryServiceImpl.getInstance().getLogger(root);
    };
    /**
     * Clears everything, any registered (root)categories and loggers
     * are discarded. Resets to default configuration.
     */
    CategoryServiceFactory.clear = function () {
        return CategoryService_1.CategoryServiceImpl.getInstance().clear();
    };
    /**
     * Set the default configuration. New root loggers created get this
     * applied. If you want to reset all current loggers to have this
     * applied as well, pass in reset=true (the default is false). All
     * categories runtimesettings will be reset then as well.
     * @param config The new default configuration
     * @param reset If true, will reset *all* runtimesettings for all loggers/categories to these. Default is true.
     */
    CategoryServiceFactory.setDefaultConfiguration = function (config, reset) {
        if (reset === void 0) { reset = true; }
        CategoryService_1.CategoryServiceImpl.getInstance().setDefaultConfiguration(config, reset);
    };
    /**
     * Set new configuration settings for a category (and possibly its child categories)
     * @param config Config
     * @param category Category
     * @param applyChildren True to apply to child categories, defaults to false.
     */
    CategoryServiceFactory.setConfigurationCategory = function (config, category, applyChildren) {
        if (applyChildren === void 0) { applyChildren = false; }
        CategoryService_1.CategoryServiceImpl.getInstance().setConfigurationCategory(config, category, applyChildren);
    };
    return CategoryServiceFactory;
}());
exports.CategoryServiceFactory = CategoryServiceFactory;
//# sourceMappingURL=CategoryServiceFactory.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/standard/AbstractLogger.js":
/*!**************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/standard/AbstractLogger.js ***!
  \**************************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var LoggerOptions_1 = __webpack_require__(/*! ../LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
var DataStructures_1 = __webpack_require__(/*! ../../utils/DataStructures */ "./node_modules/typescript-logging/dist/commonjs/utils/DataStructures.js");
var MessageUtils_1 = __webpack_require__(/*! ../../utils/MessageUtils */ "./node_modules/typescript-logging/dist/commonjs/utils/MessageUtils.js");
var LogMessageInternalImpl = (function () {
    function LogMessageInternalImpl(loggerName, message, errorAsStack, error, logGroupRule, date, level, ready) {
        this._errorAsStack = null;
        this._error = null;
        this._loggerName = loggerName;
        this._message = message;
        this._errorAsStack = errorAsStack;
        this._error = error;
        this._logGroupRule = logGroupRule;
        this._date = date;
        this._level = level;
        this._ready = ready;
    }
    Object.defineProperty(LogMessageInternalImpl.prototype, "loggerName", {
        get: function () {
            return this._loggerName;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogMessageInternalImpl.prototype, "message", {
        get: function () {
            return this._message;
        },
        set: function (value) {
            this._message = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogMessageInternalImpl.prototype, "errorAsStack", {
        get: function () {
            return this._errorAsStack;
        },
        set: function (value) {
            this._errorAsStack = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogMessageInternalImpl.prototype, "error", {
        get: function () {
            return this._error;
        },
        set: function (value) {
            this._error = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogMessageInternalImpl.prototype, "logGroupRule", {
        get: function () {
            return this._logGroupRule;
        },
        set: function (value) {
            this._logGroupRule = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogMessageInternalImpl.prototype, "date", {
        get: function () {
            return this._date;
        },
        set: function (value) {
            this._date = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogMessageInternalImpl.prototype, "level", {
        get: function () {
            return this._level;
        },
        set: function (value) {
            this._level = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogMessageInternalImpl.prototype, "isMessageLogData", {
        get: function () {
            return typeof (this._message) !== "string";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogMessageInternalImpl.prototype, "ready", {
        get: function () {
            return this._ready;
        },
        set: function (value) {
            this._ready = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogMessageInternalImpl.prototype, "messageAsString", {
        get: function () {
            if (typeof (this._message) === "string") {
                return this._message;
            }
            return this._message.msg;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogMessageInternalImpl.prototype, "logData", {
        get: function () {
            var result = null;
            if (typeof (this._message) !== "string") {
                result = this.message;
            }
            return result;
        },
        enumerable: true,
        configurable: true
    });
    return LogMessageInternalImpl;
}());
/**
 * Abstract base logger, extend to easily implement a custom logger that
 * logs wherever you want. You only need to implement doLog(msg: LogMessage) and
 * log that somewhere (it will contain format and everything else).
 */
var AbstractLogger = (function () {
    function AbstractLogger(name, logGroupRuntimeSettings) {
        this._allMessages = new DataStructures_1.LinkedList();
        this._open = true;
        this._name = name;
        this._logGroupRuntimeSettings = logGroupRuntimeSettings;
    }
    Object.defineProperty(AbstractLogger.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: true,
        configurable: true
    });
    AbstractLogger.prototype.trace = function (msg, error) {
        if (error === void 0) { error = null; }
        this._log(LoggerOptions_1.LogLevel.Trace, msg, error);
    };
    AbstractLogger.prototype.debug = function (msg, error) {
        if (error === void 0) { error = null; }
        this._log(LoggerOptions_1.LogLevel.Debug, msg, error);
    };
    AbstractLogger.prototype.info = function (msg, error) {
        if (error === void 0) { error = null; }
        this._log(LoggerOptions_1.LogLevel.Info, msg, error);
    };
    AbstractLogger.prototype.warn = function (msg, error) {
        if (error === void 0) { error = null; }
        this._log(LoggerOptions_1.LogLevel.Warn, msg, error);
    };
    AbstractLogger.prototype.error = function (msg, error) {
        if (error === void 0) { error = null; }
        this._log(LoggerOptions_1.LogLevel.Error, msg, error);
    };
    AbstractLogger.prototype.fatal = function (msg, error) {
        if (error === void 0) { error = null; }
        this._log(LoggerOptions_1.LogLevel.Fatal, msg, error);
    };
    AbstractLogger.prototype.isTraceEnabled = function () {
        return this._logGroupRuntimeSettings.level === LoggerOptions_1.LogLevel.Trace;
    };
    AbstractLogger.prototype.isDebugEnabled = function () {
        return this._logGroupRuntimeSettings.level <= LoggerOptions_1.LogLevel.Debug;
    };
    AbstractLogger.prototype.isInfoEnabled = function () {
        return this._logGroupRuntimeSettings.level <= LoggerOptions_1.LogLevel.Info;
    };
    AbstractLogger.prototype.isWarnEnabled = function () {
        return this._logGroupRuntimeSettings.level <= LoggerOptions_1.LogLevel.Warn;
    };
    AbstractLogger.prototype.isErrorEnabled = function () {
        return this._logGroupRuntimeSettings.level <= LoggerOptions_1.LogLevel.Error;
    };
    AbstractLogger.prototype.isFatalEnabled = function () {
        return this._logGroupRuntimeSettings.level <= LoggerOptions_1.LogLevel.Fatal;
    };
    AbstractLogger.prototype.getLogLevel = function () {
        return this._logGroupRuntimeSettings.level;
    };
    AbstractLogger.prototype.isOpen = function () {
        return this._open;
    };
    AbstractLogger.prototype.close = function () {
        this._open = false;
        this._allMessages.clear();
    };
    AbstractLogger.prototype.createDefaultLogMessage = function (msg) {
        return MessageUtils_1.MessageFormatUtils.renderDefaultLog4jMessage(msg, true);
    };
    /**
     * Return optional message formatter. All LoggerTypes (except custom) will see if
     * they have this, and if so use it to log.
     * @returns {((message:LogMessage)=>string)|null}
     */
    AbstractLogger.prototype._getMessageFormatter = function () {
        return this._logGroupRuntimeSettings.formatterLogMessage;
    };
    AbstractLogger.prototype._log = function (level, msg, error) {
        if (error === void 0) { error = null; }
        if (this._open && this._logGroupRuntimeSettings.level <= level) {
            var functionMessage = function () {
                if (typeof msg === "function") {
                    return msg();
                }
                return msg;
            };
            var functionError = function () {
                if (typeof error === "function") {
                    return error();
                }
                return error;
            };
            this._allMessages.addTail(this.createMessage(level, functionMessage, functionError, new Date()));
            this.processMessages();
        }
    };
    AbstractLogger.prototype.createMessage = function (level, msg, error, date) {
        var _this = this;
        var errorResult = error();
        if (errorResult !== null) {
            var message_1 = new LogMessageInternalImpl(this._name, msg(), null, errorResult, this._logGroupRuntimeSettings.logGroupRule, date, level, false);
            MessageUtils_1.MessageFormatUtils.renderError(errorResult).then(function (stack) {
                message_1.errorAsStack = stack;
                message_1.ready = true;
                _this.processMessages();
            }).catch(function () {
                message_1.errorAsStack = "<UNKNOWN> unable to get stack.";
                message_1.ready = true;
                _this.processMessages();
            });
            return message_1;
        }
        return new LogMessageInternalImpl(this._name, msg(), null, errorResult, this._logGroupRuntimeSettings.logGroupRule, date, level, true);
    };
    AbstractLogger.prototype.processMessages = function () {
        // Basically we wait until errors are resolved (those messages
        // may not be ready).
        var msgs = this._allMessages;
        if (msgs.getSize() > 0) {
            do {
                var msg = msgs.getHead();
                if (msg != null) {
                    if (!msg.ready) {
                        break;
                    }
                    msgs.removeHead();
                    // This can never be null normally, but strict null checking ...
                    if (msg.message !== null) {
                        this.doLog(msg);
                    }
                }
            } while (msgs.getSize() > 0);
        }
    };
    return AbstractLogger;
}());
exports.AbstractLogger = AbstractLogger;
//# sourceMappingURL=AbstractLogger.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/standard/ConsoleLoggerImpl.js":
/*!*****************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/standard/ConsoleLoggerImpl.js ***!
  \*****************************************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
var AbstractLogger_1 = __webpack_require__(/*! ./AbstractLogger */ "./node_modules/typescript-logging/dist/commonjs/log/standard/AbstractLogger.js");
var LoggerOptions_1 = __webpack_require__(/*! ../LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
/**
 * Simple logger, that logs to the console. If the console is unavailable will throw exception.
 */
var ConsoleLoggerImpl = (function (_super) {
    __extends(ConsoleLoggerImpl, _super);
    function ConsoleLoggerImpl(name, logGroupRuntimeSettings) {
        return _super.call(this, name, logGroupRuntimeSettings) || this;
    }
    ConsoleLoggerImpl.prototype.doLog = function (message) {
        if (console !== undefined) {
            var logged = false;
            var logLevel = message.level;
            var messageFormatter = this._getMessageFormatter();
            var msg = void 0;
            if (messageFormatter === null) {
                msg = this.createDefaultLogMessage(message);
            }
            else {
                msg = messageFormatter(message);
            }
            /* tslint:disable:no-console */
            switch (logLevel) {
                case LoggerOptions_1.LogLevel.Trace:
                    // Do not try trace we don't want a stack
                    break;
                case LoggerOptions_1.LogLevel.Debug:
                    // Don't try, too much differences of consoles.
                    break;
                case LoggerOptions_1.LogLevel.Info:
                    if (console.info) {
                        console.info(msg);
                        logged = true;
                    }
                    break;
                case LoggerOptions_1.LogLevel.Warn:
                    if (console.warn) {
                        console.warn(msg);
                        logged = true;
                    }
                    break;
                case LoggerOptions_1.LogLevel.Error:
                case LoggerOptions_1.LogLevel.Fatal:
                    if (console.error) {
                        console.error(msg);
                        logged = true;
                    }
                    break;
                default:
                    throw new Error("Log level not supported: " + logLevel);
            }
            if (!logged) {
                console.log(msg);
            }
            /* tslint:enable:no-console */
        }
        else {
            throw new Error("Console is not defined, cannot log msg: " + message.message);
        }
    };
    return ConsoleLoggerImpl;
}(AbstractLogger_1.AbstractLogger));
exports.ConsoleLoggerImpl = ConsoleLoggerImpl;
//# sourceMappingURL=ConsoleLoggerImpl.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/standard/LFService.js":
/*!*********************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/standard/LFService.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DataStructures_1 = __webpack_require__(/*! ../../utils/DataStructures */ "./node_modules/typescript-logging/dist/commonjs/utils/DataStructures.js");
var LoggerOptions_1 = __webpack_require__(/*! ../LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
var LoggerFactoryImpl_1 = __webpack_require__(/*! ./LoggerFactoryImpl */ "./node_modules/typescript-logging/dist/commonjs/log/standard/LoggerFactoryImpl.js");
var ExtensionHelper_1 = __webpack_require__(/*! ../../extension/ExtensionHelper */ "./node_modules/typescript-logging/dist/commonjs/extension/ExtensionHelper.js");
var LogGroupRule_1 = __webpack_require__(/*! ./LogGroupRule */ "./node_modules/typescript-logging/dist/commonjs/log/standard/LogGroupRule.js");
var LoggerFactoryOptions_1 = __webpack_require__(/*! ./LoggerFactoryOptions */ "./node_modules/typescript-logging/dist/commonjs/log/standard/LoggerFactoryOptions.js");
var LFServiceImpl = (function () {
    function LFServiceImpl() {
        // Private constructor.
        this._nameCounter = 1;
        this._mapFactories = new DataStructures_1.SimpleMap();
        ExtensionHelper_1.ExtensionHelper.register();
    }
    LFServiceImpl.getInstance = function () {
        // Loaded on demand. Do NOT change as webpack may pack things in wrong order otherwise.
        if (LFServiceImpl._INSTANCE === null) {
            LFServiceImpl._INSTANCE = new LFServiceImpl();
        }
        return LFServiceImpl._INSTANCE;
    };
    /**
     * Create a new LoggerFactory with given options (if any). If no options
     * are specified, the LoggerFactory, will accept any named logger and will
     * log on info level by default for, to the console.
     * @param options Options, optional.
     * @returns {LoggerFactory}
     */
    LFServiceImpl.prototype.createLoggerFactory = function (options) {
        if (options === void 0) { options = null; }
        var name = "LoggerFactory" + this._nameCounter++;
        return this.createNamedLoggerFactory(name, options);
    };
    /**
     * Create a new LoggerFactory using given name (used for console api/extension).
     * @param name Name Pick something short but distinguishable.
     * @param options Options, optional
     * @return {LoggerFactory}
     */
    LFServiceImpl.prototype.createNamedLoggerFactory = function (name, options) {
        if (options === void 0) { options = null; }
        if (this._mapFactories.exists(name)) {
            throw new Error("LoggerFactory with name " + name + " already exists.");
        }
        var factory;
        if (options !== null) {
            factory = new LoggerFactoryImpl_1.LoggerFactoryImpl(name, options);
        }
        else {
            factory = new LoggerFactoryImpl_1.LoggerFactoryImpl(name, LFServiceImpl.createDefaultOptions());
        }
        this._mapFactories.put(name, factory);
        return factory;
    };
    /**
     * Closes all Loggers for LoggerFactories that were created.
     * After this call, all previously fetched Loggers (from their
     * factories) are unusable. The factories remain as they were.
     */
    LFServiceImpl.prototype.closeLoggers = function () {
        this._mapFactories.values().forEach(function (factory) {
            factory.closeLoggers();
        });
        this._mapFactories.clear();
        this._nameCounter = 1;
    };
    LFServiceImpl.prototype.getRuntimeSettingsForLoggerFactories = function () {
        var result = [];
        this._mapFactories.forEachValue(function (factory) { return result.push(factory); });
        return result;
    };
    LFServiceImpl.prototype.getLogGroupSettings = function (nameLoggerFactory, idLogGroupRule) {
        var factory = this._mapFactories.get(nameLoggerFactory);
        if (typeof factory === "undefined") {
            return null;
        }
        return factory.getLogGroupRuntimeSettingsByIndex(idLogGroupRule);
    };
    LFServiceImpl.prototype.getLoggerFactoryRuntimeSettingsByName = function (nameLoggerFactory) {
        var result = this._mapFactories.get(nameLoggerFactory);
        if (typeof result === "undefined") {
            return null;
        }
        return result;
    };
    LFServiceImpl.createDefaultOptions = function () {
        return new LoggerFactoryOptions_1.LoggerFactoryOptions().addLogGroupRule(new LogGroupRule_1.LogGroupRule(new RegExp(".+"), LoggerOptions_1.LogLevel.Info));
    };
    // Loaded on demand. Do NOT change as webpack may pack things in wrong order otherwise.
    LFServiceImpl._INSTANCE = null;
    return LFServiceImpl;
}());
/**
 * Create and configure your LoggerFactory from here.
 */
var LFService = (function () {
    function LFService() {
    }
    /**
     * Create a new LoggerFactory with given options (if any). If no options
     * are specified, the LoggerFactory, will accept any named logger and will
     * log on info level by default for, to the console.
     * @param options Options, optional.
     * @returns {LoggerFactory}
     */
    LFService.createLoggerFactory = function (options) {
        if (options === void 0) { options = null; }
        return LFService.INSTANCE_SERVICE.createLoggerFactory(options);
    };
    /**
     * Create a new LoggerFactory using given name (used for console api/extension).
     * @param name Name Pick something short but distinguishable. The word "DEFAULT" is reserved and cannot be taken, it is used
     * for the default LoggerFactory.
     * @param options Options, optional
     * @return {LoggerFactory}
     */
    LFService.createNamedLoggerFactory = function (name, options) {
        if (options === void 0) { options = null; }
        if (name === LFService.DEFAULT_LOGGER_FACTORY_NAME) {
            throw new Error("LoggerFactory name: " + LFService.DEFAULT_LOGGER_FACTORY_NAME + " is reserved and cannot be used.");
        }
        return LFService.INSTANCE_SERVICE.createNamedLoggerFactory(name, options);
    };
    /**
     * Closes all Loggers for LoggerFactories that were created.
     * After this call, all previously fetched Loggers (from their
     * factories) are unusable. The factories remain as they were.
     */
    LFService.closeLoggers = function () {
        return LFService.INSTANCE_SERVICE.closeLoggers();
    };
    /**
     * Return LFServiceRuntimeSettings to retrieve information loggerfactories
     * and their runtime settings.
     * @returns {LFServiceRuntimeSettings}
     */
    LFService.getRuntimeSettings = function () {
        return LFService.INSTANCE_SERVICE;
    };
    Object.defineProperty(LFService, "DEFAULT", {
        /**
         * This property returns the default LoggerFactory (if not yet initialized it is initialized).
         * This LoggerFactory can be used to share among multiple
         * applications/libraries - that way you can enable/change logging over everything from
         * your own application when required.
         * It is recommended to be used by library developers to make logging easily available for the
         * consumers of their libraries.
         * It is highly recommended to use Loggers from the LoggerFactory with unique grouping/names to prevent
         * clashes of Loggers between multiple projects.
         * @returns {LoggerFactory} Returns the default LoggerFactory
         */
        get: function () {
            return LFService.getDefault();
        },
        enumerable: true,
        configurable: true
    });
    LFService.getDefault = function () {
        if (LFService.DEFAULT_LOGGER_FACTORY === null) {
            LFService.DEFAULT_LOGGER_FACTORY = LFService.DEFAULT_LOGGER_FACTORY = LFService.INSTANCE_SERVICE.createNamedLoggerFactory(LFService.DEFAULT_LOGGER_FACTORY_NAME, new LoggerFactoryOptions_1.LoggerFactoryOptions().addLogGroupRule(new LogGroupRule_1.LogGroupRule(new RegExp(".+"), LoggerOptions_1.LogLevel.Error)));
        }
        return LFService.DEFAULT_LOGGER_FACTORY;
    };
    LFService.DEFAULT_LOGGER_FACTORY_NAME = "DEFAULT";
    LFService.INSTANCE_SERVICE = LFServiceImpl.getInstance();
    LFService.DEFAULT_LOGGER_FACTORY = null;
    return LFService;
}());
exports.LFService = LFService;
//# sourceMappingURL=LFService.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/standard/LogGroupRule.js":
/*!************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/standard/LogGroupRule.js ***!
  \************************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var LoggerOptions_1 = __webpack_require__(/*! ../LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
/**
 * Defines a LogGroupRule, this allows you to either have everything configured the same way
 * or for example loggers that start with name model. It allows you to group loggers together
 * to have a certain loglevel and other settings. You can configure this when creating the
 * LoggerFactory (which accepts multiple LogGroupRules).
 */
var LogGroupRule = (function () {
    /**
     * Create a LogGroupRule. Basically you define what logger name(s) match for this group, what level should be used what logger type (where to log)
     * and what format to write in. If the loggerType is custom, then the callBackLogger must be supplied as callback function to return a custom logger.
     * @param regExp Regular expression, what matches for your logger names for this group
     * @param level LogLevel
     * @param logFormat LogFormat
     * @param loggerType Type of logger, if Custom, make sure to implement callBackLogger and pass in, this will be called so you can return your own logger.
     * @param callBackLogger Callback function to return a new clean custom logger (yours!)
     */
    function LogGroupRule(regExp, level, logFormat, loggerType, callBackLogger) {
        if (logFormat === void 0) { logFormat = new LoggerOptions_1.LogFormat(); }
        if (loggerType === void 0) { loggerType = LoggerOptions_1.LoggerType.Console; }
        if (callBackLogger === void 0) { callBackLogger = null; }
        this._formatterLogMessage = null;
        this._regExp = regExp;
        this._level = level;
        this._logFormat = logFormat;
        this._loggerType = loggerType;
        this._callBackLogger = callBackLogger;
    }
    Object.defineProperty(LogGroupRule.prototype, "regExp", {
        get: function () {
            return this._regExp;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogGroupRule.prototype, "level", {
        get: function () {
            return this._level;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogGroupRule.prototype, "loggerType", {
        get: function () {
            return this._loggerType;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogGroupRule.prototype, "logFormat", {
        get: function () {
            return this._logFormat;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogGroupRule.prototype, "callBackLogger", {
        get: function () {
            return this._callBackLogger;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogGroupRule.prototype, "formatterLogMessage", {
        /**
         * Get the formatterLogMessage function, see comment on the setter.
         * @returns {((message:LogMessage)=>string)|null}
         */
        get: function () {
            return this._formatterLogMessage;
        },
        /**
         * Set the default formatterLogMessage function, if set it is applied to all type of loggers except for a custom logger.
         * By default this is null (not set). You can assign a function to allow custom formatting of a log message.
         * Each log message will call this function then and expects your function to format the message and return a string.
         * Will throw an error if you attempt to set a formatterLogMessage if the LoggerType is custom.
         * @param value The formatter function, or null to reset it.
         */
        set: function (value) {
            if (value !== null && this._loggerType === LoggerOptions_1.LoggerType.Custom) {
                throw new Error("You cannot specify a formatter for log messages if your loggerType is Custom");
            }
            this._formatterLogMessage = value;
        },
        enumerable: true,
        configurable: true
    });
    return LogGroupRule;
}());
exports.LogGroupRule = LogGroupRule;
//# sourceMappingURL=LogGroupRule.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/standard/LogGroupRuntimeSettings.js":
/*!***********************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/standard/LogGroupRuntimeSettings.js ***!
  \***********************************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var LoggerOptions_1 = __webpack_require__(/*! ../LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
/**
 * Represents the runtime settings for a LogGroup (LogGroupRule).
 */
var LogGroupRuntimeSettings = (function () {
    function LogGroupRuntimeSettings(logGroupRule) {
        this._formatterLogMessage = null;
        this._logGroupRule = logGroupRule;
        this._level = logGroupRule.level;
        this._loggerType = logGroupRule.loggerType;
        this._logFormat = new LoggerOptions_1.LogFormat(new LoggerOptions_1.DateFormat(logGroupRule.logFormat.dateFormat.formatEnum, logGroupRule.logFormat.dateFormat.dateSeparator), logGroupRule.logFormat.showTimeStamp, logGroupRule.logFormat.showLoggerName);
        this._callBackLogger = logGroupRule.callBackLogger;
        this._formatterLogMessage = logGroupRule.formatterLogMessage;
    }
    Object.defineProperty(LogGroupRuntimeSettings.prototype, "logGroupRule", {
        /**
         * Returns original LogGroupRule (so not runtime settings!)
         * @return {LogGroupRule}
         */
        get: function () {
            return this._logGroupRule;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogGroupRuntimeSettings.prototype, "level", {
        get: function () {
            return this._level;
        },
        set: function (value) {
            this._level = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogGroupRuntimeSettings.prototype, "loggerType", {
        get: function () {
            return this._loggerType;
        },
        set: function (value) {
            this._loggerType = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogGroupRuntimeSettings.prototype, "logFormat", {
        get: function () {
            return this._logFormat;
        },
        set: function (value) {
            this._logFormat = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogGroupRuntimeSettings.prototype, "callBackLogger", {
        get: function () {
            return this._callBackLogger;
        },
        set: function (value) {
            this._callBackLogger = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LogGroupRuntimeSettings.prototype, "formatterLogMessage", {
        get: function () {
            return this._formatterLogMessage;
        },
        set: function (value) {
            this._formatterLogMessage = value;
        },
        enumerable: true,
        configurable: true
    });
    return LogGroupRuntimeSettings;
}());
exports.LogGroupRuntimeSettings = LogGroupRuntimeSettings;
//# sourceMappingURL=LogGroupRuntimeSettings.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/standard/LoggerFactoryImpl.js":
/*!*****************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/standard/LoggerFactoryImpl.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DataStructures_1 = __webpack_require__(/*! ../../utils/DataStructures */ "./node_modules/typescript-logging/dist/commonjs/utils/DataStructures.js");
var LoggerOptions_1 = __webpack_require__(/*! ../LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
var ConsoleLoggerImpl_1 = __webpack_require__(/*! ./ConsoleLoggerImpl */ "./node_modules/typescript-logging/dist/commonjs/log/standard/ConsoleLoggerImpl.js");
var MessageBufferLoggerImpl_1 = __webpack_require__(/*! ./MessageBufferLoggerImpl */ "./node_modules/typescript-logging/dist/commonjs/log/standard/MessageBufferLoggerImpl.js");
var AbstractLogger_1 = __webpack_require__(/*! ./AbstractLogger */ "./node_modules/typescript-logging/dist/commonjs/log/standard/AbstractLogger.js");
var LogGroupRuntimeSettings_1 = __webpack_require__(/*! ./LogGroupRuntimeSettings */ "./node_modules/typescript-logging/dist/commonjs/log/standard/LogGroupRuntimeSettings.js");
var LoggerFactoryImpl = (function () {
    function LoggerFactoryImpl(name, options) {
        this._loggers = new DataStructures_1.SimpleMap();
        this._logGroupRuntimeSettingsIndexed = [];
        this._loggerToLogGroupSettings = new DataStructures_1.SimpleMap();
        this._name = name;
        this.configure(options);
    }
    LoggerFactoryImpl.prototype.configure = function (options) {
        this._options = options;
        // Close any current open loggers.
        this.closeLoggers();
        this._loggerToLogGroupSettings.clear();
        this._logGroupRuntimeSettingsIndexed = [];
        var logGroupRules = this._options.logGroupRules;
        /* tslint:disable:prefer-for-of */
        for (var i = 0; i < logGroupRules.length; i++) {
            this._logGroupRuntimeSettingsIndexed.push(new LogGroupRuntimeSettings_1.LogGroupRuntimeSettings(logGroupRules[i]));
        }
        /* tslint:enable:prefer-for-of */
    };
    LoggerFactoryImpl.prototype.getLogger = function (named) {
        if (!this._options.enabled) {
            throw new Error("LoggerFactory is not enabled, please check your options passed in");
        }
        var logger = this._loggers.get(named);
        if (typeof logger !== "undefined") {
            return logger;
        }
        // Initialize logger with appropriate level
        logger = this.loadLogger(named);
        this._loggers.put(named, logger);
        return logger;
    };
    LoggerFactoryImpl.prototype.isEnabled = function () {
        return this._options.enabled;
    };
    LoggerFactoryImpl.prototype.closeLoggers = function () {
        this._loggers.forEachValue(function (logger) {
            // We can only close if AbstractLogger is used (our loggers, but user loggers may not extend it, even though unlikely).
            if (logger instanceof AbstractLogger_1.AbstractLogger) {
                logger.close();
            }
        });
        this._loggers.clear();
    };
    LoggerFactoryImpl.prototype.getName = function () {
        return this._name;
    };
    LoggerFactoryImpl.prototype.getLogGroupRuntimeSettingsByIndex = function (idx) {
        if (idx >= 0 && idx < this._logGroupRuntimeSettingsIndexed.length) {
            return this._logGroupRuntimeSettingsIndexed[idx];
        }
        return null;
    };
    LoggerFactoryImpl.prototype.getLogGroupRuntimeSettingsByLoggerName = function (nameLogger) {
        var result = this._loggerToLogGroupSettings.get(nameLogger);
        if (typeof result === "undefined") {
            return null;
        }
        return result;
    };
    LoggerFactoryImpl.prototype.getLogGroupRuntimeSettings = function () {
        return this._logGroupRuntimeSettingsIndexed.slice(0);
    };
    LoggerFactoryImpl.prototype.loadLogger = function (named) {
        var logGroupRules = this._options.logGroupRules;
        for (var i = 0; i < logGroupRules.length; i++) {
            var logGroupRule = logGroupRules[i];
            if (logGroupRule.regExp.test(named)) {
                var logGroupRuntimeSettings = this._logGroupRuntimeSettingsIndexed[i];
                var logger = void 0;
                switch (logGroupRule.loggerType) {
                    case LoggerOptions_1.LoggerType.Console:
                        logger = new ConsoleLoggerImpl_1.ConsoleLoggerImpl(named, logGroupRuntimeSettings);
                        break;
                    case LoggerOptions_1.LoggerType.MessageBuffer:
                        logger = new MessageBufferLoggerImpl_1.MessageBufferLoggerImpl(named, logGroupRuntimeSettings);
                        break;
                    case LoggerOptions_1.LoggerType.Custom:
                        if (logGroupRule.callBackLogger != null) {
                            logger = logGroupRule.callBackLogger(named, logGroupRuntimeSettings);
                        }
                        else {
                            throw new Error("Cannot create a custom logger, custom callback is null");
                        }
                        break;
                    default:
                        throw new Error("Cannot create a Logger for LoggerType: " + logGroupRule.loggerType);
                }
                // For a new logger map it by its name
                this._loggerToLogGroupSettings.put(named, logGroupRuntimeSettings);
                return logger;
            }
        }
        throw new Error("Failed to find a match to create a Logger for: " + named);
    };
    return LoggerFactoryImpl;
}());
exports.LoggerFactoryImpl = LoggerFactoryImpl;
//# sourceMappingURL=LoggerFactoryImpl.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/standard/LoggerFactoryOptions.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/standard/LoggerFactoryOptions.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Options object you can use to configure the LoggerFactory you create at LFService.
 */
var LoggerFactoryOptions = (function () {
    function LoggerFactoryOptions() {
        this._logGroupRules = [];
        this._enabled = true;
    }
    /**
     * Add LogGroupRule, see {LogGroupRule) for details
     * @param rule Rule to add
     * @returns {LoggerFactoryOptions} returns itself
     */
    LoggerFactoryOptions.prototype.addLogGroupRule = function (rule) {
        this._logGroupRules.push(rule);
        return this;
    };
    /**
     * Enable or disable logging completely for the LoggerFactory.
     * @param enabled True for enabled (default)
     * @returns {LoggerFactoryOptions} returns itself
     */
    LoggerFactoryOptions.prototype.setEnabled = function (enabled) {
        this._enabled = enabled;
        return this;
    };
    Object.defineProperty(LoggerFactoryOptions.prototype, "logGroupRules", {
        get: function () {
            return this._logGroupRules;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LoggerFactoryOptions.prototype, "enabled", {
        get: function () {
            return this._enabled;
        },
        enumerable: true,
        configurable: true
    });
    return LoggerFactoryOptions;
}());
exports.LoggerFactoryOptions = LoggerFactoryOptions;
//# sourceMappingURL=LoggerFactoryOptions.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/log/standard/MessageBufferLoggerImpl.js":
/*!***********************************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/log/standard/MessageBufferLoggerImpl.js ***!
  \***********************************************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
var AbstractLogger_1 = __webpack_require__(/*! ./AbstractLogger */ "./node_modules/typescript-logging/dist/commonjs/log/standard/AbstractLogger.js");
/**
 * Logger which buffers all messages, use with care due to possible high memory footprint.
 * Can be convenient in some cases. Call toString() for full output, or cast to this class
 * and call getMessages() to do something with it yourself.
 */
var MessageBufferLoggerImpl = (function (_super) {
    __extends(MessageBufferLoggerImpl, _super);
    function MessageBufferLoggerImpl(name, logGroupRuntimeSettings) {
        var _this = _super.call(this, name, logGroupRuntimeSettings) || this;
        _this.messages = [];
        return _this;
    }
    MessageBufferLoggerImpl.prototype.close = function () {
        this.messages = [];
        _super.prototype.close.call(this);
    };
    MessageBufferLoggerImpl.prototype.getMessages = function () {
        return this.messages;
    };
    MessageBufferLoggerImpl.prototype.toString = function () {
        return this.messages.map(function (msg) {
            return msg;
        }).join("\n");
    };
    MessageBufferLoggerImpl.prototype.doLog = function (message) {
        var messageFormatter = this._getMessageFormatter();
        var fullMsg;
        if (messageFormatter === null) {
            fullMsg = this.createDefaultLogMessage(message);
        }
        else {
            fullMsg = messageFormatter(message);
        }
        this.messages.push(fullMsg);
    };
    return MessageBufferLoggerImpl;
}(AbstractLogger_1.AbstractLogger));
exports.MessageBufferLoggerImpl = MessageBufferLoggerImpl;
//# sourceMappingURL=MessageBufferLoggerImpl.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/typescript-logging.js":
/*!*****************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/typescript-logging.js ***!
  \*****************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", ({ value: true }));
var LogGroupControl_1 = __webpack_require__(/*! ./control/LogGroupControl */ "./node_modules/typescript-logging/dist/commonjs/control/LogGroupControl.js");
var CategoryServiceControl_1 = __webpack_require__(/*! ./control/CategoryServiceControl */ "./node_modules/typescript-logging/dist/commonjs/control/CategoryServiceControl.js");
var ExtensionHelper_1 = __webpack_require__(/*! ./extension/ExtensionHelper */ "./node_modules/typescript-logging/dist/commonjs/extension/ExtensionHelper.js");
exports.ExtensionHelper = ExtensionHelper_1.ExtensionHelper;
// Category related
var AbstractCategoryLogger_1 = __webpack_require__(/*! ./log/category/AbstractCategoryLogger */ "./node_modules/typescript-logging/dist/commonjs/log/category/AbstractCategoryLogger.js");
exports.AbstractCategoryLogger = AbstractCategoryLogger_1.AbstractCategoryLogger;
var CategoryConsoleLoggerImpl_1 = __webpack_require__(/*! ./log/category/CategoryConsoleLoggerImpl */ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryConsoleLoggerImpl.js");
exports.CategoryConsoleLoggerImpl = CategoryConsoleLoggerImpl_1.CategoryConsoleLoggerImpl;
var CategoryDelegateLoggerImpl_1 = __webpack_require__(/*! ./log/category/CategoryDelegateLoggerImpl */ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryDelegateLoggerImpl.js");
exports.CategoryDelegateLoggerImpl = CategoryDelegateLoggerImpl_1.CategoryDelegateLoggerImpl;
var Category_1 = __webpack_require__(/*! ./log/category/Category */ "./node_modules/typescript-logging/dist/commonjs/log/category/Category.js");
exports.Category = Category_1.Category;
var CategoryRuntimeSettings_1 = __webpack_require__(/*! ./log/category/CategoryRuntimeSettings */ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryRuntimeSettings.js");
exports.CategoryRuntimeSettings = CategoryRuntimeSettings_1.CategoryRuntimeSettings;
var CategoryConfiguration_1 = __webpack_require__(/*! ./log/category/CategoryConfiguration */ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryConfiguration.js");
exports.CategoryConfiguration = CategoryConfiguration_1.CategoryConfiguration;
var CategoryMessageBufferImpl_1 = __webpack_require__(/*! ./log/category/CategoryMessageBufferImpl */ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryMessageBufferImpl.js");
exports.CategoryMessageBufferLoggerImpl = CategoryMessageBufferImpl_1.CategoryMessageBufferLoggerImpl;
var CategoryServiceFactory_1 = __webpack_require__(/*! ./log/category/CategoryServiceFactory */ "./node_modules/typescript-logging/dist/commonjs/log/category/CategoryServiceFactory.js");
exports.CategoryServiceFactory = CategoryServiceFactory_1.CategoryServiceFactory;
var LoggerFactoryOptions_1 = __webpack_require__(/*! ./log/standard/LoggerFactoryOptions */ "./node_modules/typescript-logging/dist/commonjs/log/standard/LoggerFactoryOptions.js");
exports.LoggerFactoryOptions = LoggerFactoryOptions_1.LoggerFactoryOptions;
var LogGroupRule_1 = __webpack_require__(/*! ./log/standard/LogGroupRule */ "./node_modules/typescript-logging/dist/commonjs/log/standard/LogGroupRule.js");
exports.LogGroupRule = LogGroupRule_1.LogGroupRule;
var LFService_1 = __webpack_require__(/*! ./log/standard/LFService */ "./node_modules/typescript-logging/dist/commonjs/log/standard/LFService.js");
exports.LFService = LFService_1.LFService;
var AbstractLogger_1 = __webpack_require__(/*! ./log/standard/AbstractLogger */ "./node_modules/typescript-logging/dist/commonjs/log/standard/AbstractLogger.js");
exports.AbstractLogger = AbstractLogger_1.AbstractLogger;
var ConsoleLoggerImpl_1 = __webpack_require__(/*! ./log/standard/ConsoleLoggerImpl */ "./node_modules/typescript-logging/dist/commonjs/log/standard/ConsoleLoggerImpl.js");
exports.ConsoleLoggerImpl = ConsoleLoggerImpl_1.ConsoleLoggerImpl;
var MessageBufferLoggerImpl_1 = __webpack_require__(/*! ./log/standard/MessageBufferLoggerImpl */ "./node_modules/typescript-logging/dist/commonjs/log/standard/MessageBufferLoggerImpl.js");
exports.MessageBufferLoggerImpl = MessageBufferLoggerImpl_1.MessageBufferLoggerImpl;
var LoggerOptions_1 = __webpack_require__(/*! ./log/LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
exports.CategoryLogFormat = LoggerOptions_1.CategoryLogFormat;
exports.DateFormat = LoggerOptions_1.DateFormat;
exports.DateFormatEnum = LoggerOptions_1.DateFormatEnum;
exports.LogFormat = LoggerOptions_1.LogFormat;
exports.LoggerType = LoggerOptions_1.LoggerType;
exports.LogLevel = LoggerOptions_1.LogLevel;
// Utilities
var DataStructures_1 = __webpack_require__(/*! ./utils/DataStructures */ "./node_modules/typescript-logging/dist/commonjs/utils/DataStructures.js");
exports.SimpleMap = DataStructures_1.SimpleMap;
exports.LinkedList = DataStructures_1.LinkedList;
__export(__webpack_require__(/*! ./utils/JSONHelper */ "./node_modules/typescript-logging/dist/commonjs/utils/JSONHelper.js"));
var MessageUtils_1 = __webpack_require__(/*! ./utils/MessageUtils */ "./node_modules/typescript-logging/dist/commonjs/utils/MessageUtils.js");
exports.MessageFormatUtils = MessageUtils_1.MessageFormatUtils;
/*
 Functions to export on TSL libarary var.
*/
// Export help function
function help() {
    /* tslint:disable:no-console */
    console.log("help()\n   ** Shows this help\n\n getLogControl(): LoggerControl\n   ** Returns LoggerControl Object, use to dynamically change loglevels for log4j logging.\n   ** Call .help() on LoggerControl object for available options.\n\n getCategoryControl(): CategoryServiceControl\n   ** Returns CategoryServiceControl Object, use to dynamically change loglevels for category logging.\n   ** Call .help() on CategoryServiceControl object for available options.\n");
    /* tslint:enable:no-console */
}
exports.help = help;
// Export LogControl function (log4j)
function getLogControl() {
    return new LogGroupControl_1.LoggerControlImpl();
}
exports.getLogControl = getLogControl;
// Export CategoryControl function
function getCategoryControl() {
    return new CategoryServiceControl_1.CategoryServiceControlImpl();
}
exports.getCategoryControl = getCategoryControl;
//# sourceMappingURL=typescript-logging.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/utils/DataStructures.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/utils/DataStructures.js ***!
  \*******************************************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var LinkedNode = (function () {
    function LinkedNode(value) {
        this._previous = null;
        this._next = null;
        this._value = value;
    }
    Object.defineProperty(LinkedNode.prototype, "previous", {
        get: function () {
            return this._previous;
        },
        set: function (value) {
            this._previous = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LinkedNode.prototype, "next", {
        get: function () {
            return this._next;
        },
        set: function (value) {
            this._next = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LinkedNode.prototype, "value", {
        get: function () {
            return this._value;
        },
        enumerable: true,
        configurable: true
    });
    return LinkedNode;
}());
/**
 * Double linkedlist implementation.
 */
var LinkedList = (function () {
    function LinkedList() {
        this.head = null;
        this.size = 0;
    }
    LinkedList.prototype.addHead = function (value) {
        if (!this.createHeadIfNeeded(value)) {
            if (this.head != null) {
                var nextNode = this.head.next;
                var newHeadNode = new LinkedNode(value);
                if (nextNode != null) {
                    nextNode.previous = newHeadNode;
                    newHeadNode.next = nextNode;
                }
                this.head = newHeadNode;
            }
            else {
                throw new Error("This should never happen, list implementation broken");
            }
        }
        this.size++;
    };
    LinkedList.prototype.addTail = function (value) {
        if (!this.createHeadIfNeeded(value)) {
            var oldTailNode = this.getTailNode();
            if (oldTailNode != null) {
                var newTailNode = new LinkedNode(value);
                oldTailNode.next = newTailNode;
                newTailNode.previous = oldTailNode;
            }
            else {
                throw new Error("List implementation broken");
            }
        }
        this.size++;
    };
    LinkedList.prototype.clear = function () {
        this.head = null;
        this.size = 0;
    };
    LinkedList.prototype.getHead = function () {
        if (this.head != null) {
            return this.head.value;
        }
        return null;
    };
    LinkedList.prototype.removeHead = function () {
        if (this.head != null) {
            var oldHead = this.head;
            var value = oldHead.value;
            this.head = oldHead.next;
            this.size--;
            return value;
        }
        return null;
    };
    LinkedList.prototype.getTail = function () {
        var node = this.getTailNode();
        if (node != null) {
            return node.value;
        }
        return null;
    };
    LinkedList.prototype.removeTail = function () {
        var node = this.getTailNode();
        if (node != null) {
            if (node === this.head) {
                this.head = null;
            }
            else {
                var previousNode = node.previous;
                if (previousNode != null) {
                    previousNode.next = null;
                }
                else {
                    throw new Error("List implementation is broken");
                }
            }
            this.size--;
            return node.value;
        }
        return null;
    };
    LinkedList.prototype.getSize = function () {
        return this.size;
    };
    LinkedList.prototype.filter = function (f) {
        var recurse = function (fn, node, values) {
            if (fn(node.value)) {
                values.push(node.value);
            }
            var nextNode = node.next;
            if (nextNode != null) {
                recurse(fn, nextNode, values);
            }
        };
        var result = [];
        var currentNode = this.head;
        if (currentNode != null) {
            recurse(f, currentNode, result);
        }
        return result;
    };
    LinkedList.prototype.createHeadIfNeeded = function (value) {
        if (this.head == null) {
            this.head = new LinkedNode(value);
            return true;
        }
        return false;
    };
    LinkedList.prototype.getTailNode = function () {
        if (this.head == null) {
            return null;
        }
        var node = this.head;
        while (node.next != null) {
            node = node.next;
        }
        return node;
    };
    return LinkedList;
}());
exports.LinkedList = LinkedList;
/**
 * Map implementation keyed by string (always).
 */
var SimpleMap = (function () {
    function SimpleMap() {
        this.array = {};
    }
    SimpleMap.prototype.put = function (key, value) {
        this.array[key] = value;
    };
    SimpleMap.prototype.get = function (key) {
        return this.array[key];
    };
    SimpleMap.prototype.exists = function (key) {
        var value = this.array[key];
        return (typeof value !== "undefined");
    };
    SimpleMap.prototype.remove = function (key) {
        var value = this.array[key];
        if (typeof value !== "undefined") {
            delete this.array[key];
        }
        return value;
    };
    SimpleMap.prototype.keys = function () {
        var keys = [];
        for (var key in this.array) {
            // To prevent random stuff to appear
            if (this.array.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys;
    };
    SimpleMap.prototype.values = function () {
        var values = [];
        for (var key in this.array) {
            // To prevent random stuff to appear
            if (this.array.hasOwnProperty(key)) {
                values.push(this.get(key));
            }
        }
        return values;
    };
    SimpleMap.prototype.size = function () {
        return this.keys().length;
    };
    SimpleMap.prototype.isEmpty = function () {
        return this.size() === 0;
    };
    SimpleMap.prototype.clear = function () {
        this.array = {};
    };
    SimpleMap.prototype.forEach = function (cbFunction) {
        var count = 0;
        for (var key in this.array) {
            // To prevent random stuff to appear
            if (this.array.hasOwnProperty(key)) {
                var value = this.array[key];
                cbFunction(key, value, count);
                count++;
            }
        }
    };
    SimpleMap.prototype.forEachValue = function (cbFunction) {
        var count = 0;
        for (var key in this.array) {
            // To prevent random stuff to appear
            if (this.array.hasOwnProperty(key)) {
                var value = this.array[key];
                cbFunction(value, count);
                count++;
            }
        }
    };
    return SimpleMap;
}());
exports.SimpleMap = SimpleMap;
/**
 * Tuple to hold two values.
 */
var TuplePair = (function () {
    function TuplePair(x, y) {
        this._x = x;
        this._y = y;
    }
    Object.defineProperty(TuplePair.prototype, "x", {
        get: function () {
            return this._x;
        },
        set: function (value) {
            this._x = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TuplePair.prototype, "y", {
        get: function () {
            return this._y;
        },
        set: function (value) {
            this._y = value;
        },
        enumerable: true,
        configurable: true
    });
    return TuplePair;
}());
exports.TuplePair = TuplePair;
/**
 * Utility class to build up a string.
 */
var StringBuilder = (function () {
    function StringBuilder() {
        this.data = [];
    }
    StringBuilder.prototype.append = function (line) {
        if (line === undefined || line == null) {
            throw new Error("String must be set, cannot append null or undefined");
        }
        this.data.push(line);
        return this;
    };
    StringBuilder.prototype.appendLine = function (line) {
        this.data.push(line + "\n");
        return this;
    };
    StringBuilder.prototype.isEmpty = function () {
        return this.data.length === 0;
    };
    StringBuilder.prototype.clear = function () {
        this.data = [];
    };
    StringBuilder.prototype.toString = function (separator) {
        if (separator === void 0) { separator = ""; }
        return this.data.join(separator);
    };
    return StringBuilder;
}());
exports.StringBuilder = StringBuilder;
//# sourceMappingURL=DataStructures.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/utils/JSONHelper.js":
/*!***************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/utils/JSONHelper.js ***!
  \***************************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Module containing bunch of JSON related stuff.
 */
var LoggerOptions_1 = __webpack_require__(/*! ../log/LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
var DataStructures_1 = __webpack_require__(/*! ./DataStructures */ "./node_modules/typescript-logging/dist/commonjs/utils/DataStructures.js");
var JSONTypeImpl = (function () {
    function JSONTypeImpl(value) {
        this._value = value;
    }
    JSONTypeImpl.prototype.getValue = function () {
        return this._value;
    };
    JSONTypeImpl.prototype.toString = function () {
        var value = this.getValue();
        if (value != null) {
            return value.toString();
        }
        return "null";
    };
    return JSONTypeImpl;
}());
var JSONBooleanType = (function (_super) {
    __extends(JSONBooleanType, _super);
    function JSONBooleanType(value) {
        return _super.call(this, value) || this;
    }
    return JSONBooleanType;
}(JSONTypeImpl));
var JSONNumberType = (function (_super) {
    __extends(JSONNumberType, _super);
    function JSONNumberType(value) {
        return _super.call(this, value) || this;
    }
    return JSONNumberType;
}(JSONTypeImpl));
var JSONStringType = (function (_super) {
    __extends(JSONStringType, _super);
    function JSONStringType(value) {
        return _super.call(this, value) || this;
    }
    JSONStringType.prototype.toString = function () {
        var value = this.getValue();
        if (value != null) {
            return JSON.stringify(value.toString());
        }
        return "null";
    };
    return JSONStringType;
}(JSONTypeImpl));
var JSONObjectType = (function (_super) {
    __extends(JSONObjectType, _super);
    function JSONObjectType(value) {
        return _super.call(this, value) || this;
    }
    return JSONObjectType;
}(JSONTypeImpl));
var JSONArrayType = (function (_super) {
    __extends(JSONArrayType, _super);
    function JSONArrayType(value) {
        return _super.call(this, value) || this;
    }
    JSONArrayType.prototype.toString = function () {
        var value = this.getValue();
        if (value != null) {
            return value.toString();
        }
        return "null";
    };
    return JSONArrayType;
}(JSONTypeImpl));
var JSONNullType = (function (_super) {
    __extends(JSONNullType, _super);
    function JSONNullType() {
        return _super.call(this, null) || this;
    }
    JSONNullType.prototype.toString = function () {
        return "null";
    };
    return JSONNullType;
}(JSONTypeImpl));
var JSONTypeConverter = (function () {
    function JSONTypeConverter() {
    }
    JSONTypeConverter.toJSONType = function (value) {
        if (value === null) {
            return new JSONNullType();
        }
        if (typeof value === "string") {
            return new JSONStringType(value);
        }
        if (typeof value === "number") {
            return new JSONNumberType(value);
        }
        if (typeof value === "boolean") {
            return new JSONBooleanType(value);
        }
        if (value instanceof JSONObject) {
            return new JSONObjectType(value);
        }
        throw new Error("Type not supported for value: " + value);
    };
    return JSONTypeConverter;
}());
var JSONObject = (function () {
    function JSONObject() {
        this.values = new DataStructures_1.SimpleMap();
    }
    JSONObject.prototype.addBoolean = function (name, value) {
        this.checkName(name);
        JSONObject.checkValue(value);
        this.values.put(name, new JSONBooleanType(value));
        return this;
    };
    JSONObject.prototype.addNumber = function (name, value) {
        this.checkName(name);
        JSONObject.checkValue(value);
        this.values.put(name, new JSONNumberType(value));
        return this;
    };
    JSONObject.prototype.addString = function (name, value) {
        this.checkName(name);
        JSONObject.checkValue(value);
        this.values.put(name, new JSONStringType(value));
        return this;
    };
    JSONObject.prototype.addNull = function (name) {
        this.checkName(name);
        this.values.put(name, new JSONNullType());
        return this;
    };
    JSONObject.prototype.addArray = function (name, array) {
        this.checkName(name);
        JSONObject.checkValue(array);
        if (array == null) {
            throw new Error("Cannot add array as null");
        }
        this.values.put(name, new JSONArrayType(array));
        return this;
    };
    JSONObject.prototype.addObject = function (name, object) {
        this.checkName(name);
        JSONObject.checkValue(object);
        if (object == null) {
            throw new Error("Cannot add object as null");
        }
        this.values.put(name, new JSONObjectType(object));
        return this;
    };
    JSONObject.prototype.toString = function (pretty) {
        var _this = this;
        if (pretty === void 0) { pretty = false; }
        var comma = false;
        var buffer = new DataStructures_1.StringBuilder();
        buffer.append("{");
        this.values.keys().forEach(function (key) {
            var value = _this.values.get(key);
            if (value != null) {
                if (comma) {
                    buffer.append(",");
                }
                buffer.append('"').append(key).append('":').append(value.toString());
                comma = true;
            }
        });
        buffer.append("}");
        return buffer.toString();
    };
    JSONObject.prototype.checkName = function (name) {
        if (name == null || name === undefined) {
            throw new Error("Name is null or undefined");
        }
        if (this.values.exists(name)) {
            throw new Error("Name " + name + " is already present for this object");
        }
    };
    JSONObject.checkValue = function (value) {
        if (value === undefined) {
            throw new Error("Value is undefined");
        }
    };
    return JSONObject;
}());
exports.JSONObject = JSONObject;
var JSONArray = (function () {
    function JSONArray() {
        this.objects = [];
    }
    JSONArray.prototype.add = function (object) {
        if (object === undefined) {
            throw new Error("Object is not allowed to be undefined");
        }
        this.objects.push(JSONTypeConverter.toJSONType(object));
        return this;
    };
    JSONArray.prototype.toString = function (pretty) {
        if (pretty === void 0) { pretty = false; }
        var buffer = new DataStructures_1.StringBuilder();
        buffer.append("[");
        this.objects.forEach(function (value, index) {
            if (index > 0) {
                buffer.append(",");
            }
            buffer.append(value.toString());
        });
        buffer.append("]");
        return buffer.toString();
    };
    return JSONArray;
}());
exports.JSONArray = JSONArray;
/**
 * Utility class that helps us convert things to and from json (not for normal usage).
 */
var JSONHelper = (function () {
    function JSONHelper() {
    }
    JSONHelper.categoryToJSON = function (cat, recursive) {
        /*
         {
         "categories":
         [
         { id=1,
         name: "x",
         parent: null,
         logLevel: "Error"
         },
         { id=2,
         name: "y",
         parent: 1,
         logLevel: "Error"
         }
         ]
         }
         */
        var arr = new JSONArray();
        JSONHelper._categoryToJSON(cat, arr, recursive);
        var object = new JSONObject();
        object.addArray("categories", arr);
        return object;
    };
    JSONHelper._categoryToJSON = function (cat, arr, recursive) {
        var object = new JSONObject();
        object.addNumber("id", cat.id);
        object.addString("name", cat.name);
        object.addString("logLevel", LoggerOptions_1.LogLevel[cat.logLevel].toString());
        if (cat.parent != null) {
            object.addNumber("parent", cat.parent.id);
        }
        else {
            object.addNull("parent");
        }
        arr.add(object);
        if (recursive) {
            cat.children.forEach(function (child) {
                JSONHelper._categoryToJSON(child, arr, recursive);
            });
        }
    };
    return JSONHelper;
}());
exports.JSONHelper = JSONHelper;
//# sourceMappingURL=JSONHelper.js.map

/***/ }),

/***/ "./node_modules/typescript-logging/dist/commonjs/utils/MessageUtils.js":
/*!*****************************************************************************!*\
  !*** ./node_modules/typescript-logging/dist/commonjs/utils/MessageUtils.js ***!
  \*****************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var ST = __webpack_require__(/*! stacktrace-js */ "./node_modules/stacktrace-js/stacktrace.js");
var LoggerOptions_1 = __webpack_require__(/*! ../log/LoggerOptions */ "./node_modules/typescript-logging/dist/commonjs/log/LoggerOptions.js");
/**
 * Some utilities to format messages.
 */
var MessageFormatUtils = (function () {
    function MessageFormatUtils() {
    }
    /**
     * Render given date in given DateFormat and return as String.
     * @param date Date
     * @param dateFormat Format
     * @returns {string} Formatted date
     */
    MessageFormatUtils.renderDate = function (date, dateFormat) {
        var lpad = function (value, chars, padWith) {
            var howMany = chars - value.length;
            if (howMany > 0) {
                var res = "";
                for (var i = 0; i < howMany; i++) {
                    res += padWith;
                }
                res += value;
                return res;
            }
            return value;
        };
        var fullYear = function (d) {
            return lpad(d.getFullYear().toString(), 4, "0");
        };
        var month = function (d) {
            return lpad((d.getMonth() + 1).toString(), 2, "0");
        };
        var day = function (d) {
            return lpad(d.getDate().toString(), 2, "0");
        };
        var hours = function (d) {
            return lpad(d.getHours().toString(), 2, "0");
        };
        var minutes = function (d) {
            return lpad(d.getMinutes().toString(), 2, "0");
        };
        var seconds = function (d) {
            return lpad(d.getSeconds().toString(), 2, "0");
        };
        var millis = function (d) {
            return lpad(d.getMilliseconds().toString(), 3, "0");
        };
        var dateSeparator = dateFormat.dateSeparator;
        var ds = "";
        switch (dateFormat.formatEnum) {
            case LoggerOptions_1.DateFormatEnum.Default:
                // yyyy-mm-dd hh:mm:ss,m
                ds = fullYear(date) + dateSeparator + month(date) + dateSeparator + day(date) + " " +
                    hours(date) + ":" + minutes(date) + ":" + seconds(date) + "," + millis(date);
                break;
            case LoggerOptions_1.DateFormatEnum.YearMonthDayTime:
                ds = fullYear(date) + dateSeparator + month(date) + dateSeparator + day(date) + " " +
                    hours(date) + ":" + minutes(date) + ":" + seconds(date);
                break;
            case LoggerOptions_1.DateFormatEnum.YearDayMonthWithFullTime:
                ds = fullYear(date) + dateSeparator + day(date) + dateSeparator + month(date) + " " +
                    hours(date) + ":" + minutes(date) + ":" + seconds(date) + "," + millis(date);
                break;
            case LoggerOptions_1.DateFormatEnum.YearDayMonthTime:
                ds = fullYear(date) + dateSeparator + day(date) + dateSeparator + month(date) + " " +
                    hours(date) + ":" + minutes(date) + ":" + seconds(date);
                break;
            default:
                throw new Error("Unsupported date format enum: " + dateFormat.formatEnum);
        }
        return ds;
    };
    /**
     * Renders given category log message in default format.
     * @param msg Message to format
     * @param addStack If true adds the stack to the output, otherwise skips it
     * @returns {string} Formatted message
     */
    MessageFormatUtils.renderDefaultMessage = function (msg, addStack) {
        var result = "";
        var logFormat = msg.logFormat;
        if (logFormat.showTimeStamp) {
            result += MessageFormatUtils.renderDate(msg.date, logFormat.dateFormat) + " ";
        }
        result += LoggerOptions_1.LogLevel[msg.level].toUpperCase();
        if (msg.isResolvedErrorMessage) {
            result += " (resolved)";
        }
        result += " ";
        if (logFormat.showCategoryName) {
            result += "[";
            msg.categories.forEach(function (value, idx) {
                if (idx > 0) {
                    result += ", ";
                }
                result += value.name;
            });
            result += "]";
        }
        // Get the normal string message first
        var actualStringMsg = "";
        var dataString = "";
        var messageOrLogData = msg.message;
        if (typeof messageOrLogData === "string") {
            actualStringMsg = messageOrLogData;
        }
        else {
            var logData = messageOrLogData;
            actualStringMsg = logData.msg;
            // We do have data?
            if (logData.data) {
                dataString = " [data]: " + (logData.ds ? logData.ds(logData.data) : JSON.stringify(logData.data));
            }
        }
        result += " " + actualStringMsg + "" + dataString;
        if (addStack && msg.errorAsStack !== null) {
            result += "\n" + msg.errorAsStack;
        }
        return result;
    };
    /**
     * Renders given log4j log message in default format.
     * @param msg Message to format
     * @param addStack If true adds the stack to the output, otherwise skips it
     * @returns {string} Formatted message
     */
    MessageFormatUtils.renderDefaultLog4jMessage = function (msg, addStack) {
        var format = msg.logGroupRule.logFormat;
        var result = "";
        if (format.showTimeStamp) {
            result += MessageFormatUtils.renderDate(msg.date, format.dateFormat) + " ";
        }
        result += LoggerOptions_1.LogLevel[msg.level].toUpperCase() + " ";
        if (format.showLoggerName) {
            result += "[" + msg.loggerName + "]";
        }
        // Get the normal string message first
        var actualStringMsg = "";
        var dataString = "";
        if (typeof msg.message === "string") {
            actualStringMsg = msg.message;
        }
        else {
            var logData = msg.message;
            actualStringMsg = logData.msg;
            // We do have data?
            if (logData.data) {
                dataString = " [data]: " + (logData.ds ? logData.ds(logData.data) : JSON.stringify(logData.data));
            }
        }
        result += " " + actualStringMsg + "" + dataString;
        if (addStack && msg.errorAsStack !== null) {
            result += "\n" + msg.errorAsStack;
        }
        return result;
    };
    /**
     * Render error as stack
     * @param error Return error as Promise
     * @returns {Promise<string>|Promise} Promise for stack
     */
    MessageFormatUtils.renderError = function (error) {
        var result = error.name + ": " + error.message + "\n@";
        return new Promise(function (resolve) {
            // This one has a promise too
            ST.fromError(error, { offline: true }).then(function (frames) {
                var stackStr = (frames.map(function (frame) {
                    return frame.toString();
                })).join("\n  ");
                result += "\n" + stackStr;
                // This resolves our returned promise
                resolve(result);
            }).catch(function () {
                result = "Unexpected error object was passed in. ";
                try {
                    result += "Could not resolve it, stringified object: " + JSON.stringify(error);
                }
                catch (e) {
                    // Cannot stringify can only tell something was wrong.
                    result += "Could not resolve it or stringify it.";
                }
                resolve(result);
            });
        });
    };
    return MessageFormatUtils;
}());
exports.MessageFormatUtils = MessageFormatUtils;
//# sourceMappingURL=MessageUtils.js.map

/***/ }),

/***/ "./src/js/allImports.js":
/*!******************************!*\
  !*** ./src/js/allImports.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _window_onError_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./window/onError.js */ "./src/js/window/onError.js");



/***/ }),

/***/ "./src/js/exceptions/errorCode.js":
/*!****************************************!*\
  !*** ./src/js/exceptions/errorCode.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ErrorCode": () => (/* binding */ ErrorCode)
/* harmony export */ });
var NO_ERROR = -1, TEST = 0;
var ErrorCode = (function () {
    function ErrorCode() {
    }
    Object.defineProperty(ErrorCode, "NO_ERROR", {
        get: function () {
            return NO_ERROR;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ErrorCode, "TEST", {
        get: function () {
            return TEST;
        },
        enumerable: false,
        configurable: true
    });
    return ErrorCode;
}());



/***/ }),

/***/ "./src/js/exceptions/errorCustom.js":
/*!******************************************!*\
  !*** ./src/js/exceptions/errorCustom.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ErrorCustom": () => (/* binding */ ErrorCustom)
/* harmony export */ });
/* harmony import */ var _errorCode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./errorCode */ "./src/js/exceptions/errorCode.js");
/* harmony import */ var _errorMessages__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./errorMessages */ "./src/js/exceptions/errorMessages.js");
/* harmony import */ var _errorType_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./errorType.js */ "./src/js/exceptions/errorType.js");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();



var ErrorCustom = (function (_super) {
    __extends(ErrorCustom, _super);
    function ErrorCustom(type, code, message) {
        var _this = _super.call(this) || this;
        _this.name = "ErrorCustom";
        _this.type = type;
        _this.code = code;
        _this.message = message;
        return _this;
    }
    ErrorCustom.getLogErrorMessage = function (error) {
        return "Error - type " + _errorType_js__WEBPACK_IMPORTED_MODULE_2__.ErrorType[error.type] + " - code " + error.code + " - " + error.message;
    };
    ErrorCustom.prototype.getLogErrorMessage = function () {
        return ErrorCustom.getLogErrorMessage(this);
    };
    ErrorCustom.getSolvedError = function () {
        return new ErrorCustom(_errorType_js__WEBPACK_IMPORTED_MODULE_2__.ErrorType.None, _errorCode__WEBPACK_IMPORTED_MODULE_0__.ErrorCode.NO_ERROR, _errorMessages__WEBPACK_IMPORTED_MODULE_1__.ErrorMessages.EMPTY);
    };
    ErrorCustom.isSolved = function (error) {
        return error.type === _errorType_js__WEBPACK_IMPORTED_MODULE_2__.ErrorType.None && error.code === _errorCode__WEBPACK_IMPORTED_MODULE_0__.ErrorCode.NO_ERROR && error.message === _errorMessages__WEBPACK_IMPORTED_MODULE_1__.ErrorMessages.EMPTY;
    };
    ErrorCustom.prototype.isSolved = function () {
        return ErrorCustom.isSolved(this);
    };
    return ErrorCustom;
}(Error));



/***/ }),

/***/ "./src/js/exceptions/errorMessages.js":
/*!********************************************!*\
  !*** ./src/js/exceptions/errorMessages.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ErrorMessages": () => (/* binding */ ErrorMessages)
/* harmony export */ });
var EMPTY = "", TEST = "test error message";
var ErrorMessages = (function () {
    function ErrorMessages() {
    }
    Object.defineProperty(ErrorMessages, "TEST", {
        get: function () {
            return TEST;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ErrorMessages, "EMPTY", {
        get: function () {
            return EMPTY;
        },
        enumerable: false,
        configurable: true
    });
    return ErrorMessages;
}());



/***/ }),

/***/ "./src/js/exceptions/errorService.js":
/*!*******************************************!*\
  !*** ./src/js/exceptions/errorService.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ErrorService": () => (/* binding */ ErrorService),
/* harmony export */   "errorServiceLoader": () => (/* binding */ errorServiceLoader)
/* harmony export */ });
/* harmony import */ var _errorCustom_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./errorCustom.js */ "./src/js/exceptions/errorCustom.js");
/* harmony import */ var _helpers_TypeHelper_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./../helpers/TypeHelper.js */ "./src/js/helpers/TypeHelper.js");


var ErrorService = (function () {
    function ErrorService() {
    }
    ErrorService.getErrorType = function () {
        return ErrorService.errorCustom.type;
    };
    ErrorService.getErrorMessage = function () {
        return ErrorService.errorCustom.message;
    };
    ErrorService.getErrorCode = function () {
        return ErrorService.errorCustom.code;
    };
    ErrorService.setError = function (type, code, message) {
        ErrorService.errorCustom = new _errorCustom_js__WEBPACK_IMPORTED_MODULE_0__.ErrorCustom(type, code, message);
    };
    ErrorService.setErrorCustom = function (error) {
        ErrorService.errorCustom = error;
    };
    ErrorService.dealtWith = function () {
        ErrorService.errorCustom = _errorCustom_js__WEBPACK_IMPORTED_MODULE_0__.ErrorCustom.getSolvedError();
    };
    ErrorService.dealWith = function () {
        var res = new _errorCustom_js__WEBPACK_IMPORTED_MODULE_0__.ErrorCustom(ErrorService.getErrorType(), ErrorService.getErrorCode(), ErrorService.getErrorMessage());
        ErrorService.dealtWith();
        return res;
    };
    ErrorService.errorCustom = _errorCustom_js__WEBPACK_IMPORTED_MODULE_0__.ErrorCustom.getSolvedError();
    return ErrorService;
}());

var errorServiceLoader = function (error) {
    if (_helpers_TypeHelper_js__WEBPACK_IMPORTED_MODULE_1__.TypeHelper.isErrorCustom(error)) {
        var errorCustom = error;
        ErrorService.setErrorCustom(errorCustom);
    }
};


/***/ }),

/***/ "./src/js/exceptions/errorType.js":
/*!****************************************!*\
  !*** ./src/js/exceptions/errorType.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ErrorType": () => (/* binding */ ErrorType)
/* harmony export */ });
var ErrorType;
(function (ErrorType) {
    ErrorType[ErrorType["Test"] = 0] = "Test";
    ErrorType[ErrorType["None"] = 1] = "None";
})(ErrorType || (ErrorType = {}));


/***/ }),

/***/ "./src/js/helpers/TypeHelper.js":
/*!**************************************!*\
  !*** ./src/js/helpers/TypeHelper.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TypeHelper": () => (/* binding */ TypeHelper)
/* harmony export */ });
/* harmony import */ var _exceptions_errorType_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./../exceptions/errorType.js */ "./src/js/exceptions/errorType.js");

var TypeHelper = (function () {
    function TypeHelper() {
    }
    TypeHelper.isErrorCustom = function (object) {
        return object !== null && typeof object !== "undefined" &&
            typeof object.type !== "undefined" &&
            TypeHelper.isErrorType(object.type) &&
            typeof object.code === "number" &&
            typeof object.message === "string";
    };
    TypeHelper.isErrorType = function (object) {
        return object !== null && typeof object !== "undefined" &&
            Boolean(object in _exceptions_errorType_js__WEBPACK_IMPORTED_MODULE_0__.ErrorType);
    };
    return TypeHelper;
}());



/***/ }),

/***/ "./src/js/log/config.js":
/*!******************************!*\
  !*** ./src/js/log/config.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Log": () => (/* binding */ Log)
/* harmony export */ });
/* harmony import */ var typescript_logging__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! typescript-logging */ "./node_modules/typescript-logging/dist/commonjs/typescript-logging.js");
/* harmony import */ var typescript_logging__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(typescript_logging__WEBPACK_IMPORTED_MODULE_0__);

typescript_logging__WEBPACK_IMPORTED_MODULE_0__.CategoryServiceFactory.setDefaultConfiguration(new typescript_logging__WEBPACK_IMPORTED_MODULE_0__.CategoryConfiguration(typescript_logging__WEBPACK_IMPORTED_MODULE_0__.LogLevel.Trace));
var Log = new typescript_logging__WEBPACK_IMPORTED_MODULE_0__.Category("log");


/***/ }),

/***/ "./src/js/log/exceptionLogger.js":
/*!***************************************!*\
  !*** ./src/js/log/exceptionLogger.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "exceptionLogger": () => (/* binding */ exceptionLogger)
/* harmony export */ });
/* harmony import */ var _exceptions_errorCustom_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./../exceptions/errorCustom.js */ "./src/js/exceptions/errorCustom.js");
/* harmony import */ var _exceptions_errorService_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../exceptions/errorService.js */ "./src/js/exceptions/errorService.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./config.js */ "./src/js/log/config.js");
/* harmony import */ var _helpers_TypeHelper_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./../helpers/TypeHelper.js */ "./src/js/helpers/TypeHelper.js");




var NOT_CUSTOM_ERROR = "not custom error", UNDEFINED_ERROR = "undefined error", logErrorCustom = function (errorCustom) {
    _config_js__WEBPACK_IMPORTED_MODULE_2__.Log.error(_exceptions_errorCustom_js__WEBPACK_IMPORTED_MODULE_0__.ErrorCustom.getLogErrorMessage(errorCustom), errorCustom);
    alert(_exceptions_errorCustom_js__WEBPACK_IMPORTED_MODULE_0__.ErrorCustom.getLogErrorMessage(errorCustom));
    _exceptions_errorService_js__WEBPACK_IMPORTED_MODULE_1__.ErrorService.dealWith();
}, logErrorNotCustom = function (error) {
    _config_js__WEBPACK_IMPORTED_MODULE_2__.Log.fatal(NOT_CUSTOM_ERROR + " - " + error.message, error);
}, logUndefined = function () {
    _config_js__WEBPACK_IMPORTED_MODULE_2__.Log.fatal(UNDEFINED_ERROR, new Error());
};
var exceptionLogger = function (error) {
    if (_helpers_TypeHelper_js__WEBPACK_IMPORTED_MODULE_3__.TypeHelper.isErrorCustom(error)) {
        logErrorCustom(error);
        return true;
    }
    if (error) {
        logErrorNotCustom(error);
        return false;
    }
    logUndefined();
    return false;
};


/***/ }),

/***/ "./src/js/window/onError.js":
/*!**********************************!*\
  !*** ./src/js/window/onError.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _exceptions_errorService__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../exceptions/errorService */ "./src/js/exceptions/errorService.js");
/* harmony import */ var _log_exceptionLogger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../log/exceptionLogger */ "./src/js/log/exceptionLogger.js");


window.onerror = function (_event, _source, _lineno, _colno, error) {
    (0,_exceptions_errorService__WEBPACK_IMPORTED_MODULE_0__.errorServiceLoader)(error);
    return (0,_log_exceptionLogger__WEBPACK_IMPORTED_MODULE_1__.exceptionLogger)(error);
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!************************!*\
  !*** ./src/js/main.js ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _allImports_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./allImports.js */ "./src/js/allImports.js");


})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9teS1maXJzdC1pbmNyZW1lbnRhbC8uL25vZGVfbW9kdWxlcy9lcnJvci1zdGFjay1wYXJzZXIvZXJyb3Itc3RhY2stcGFyc2VyLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vbm9kZV9tb2R1bGVzL3N0YWNrLWdlbmVyYXRvci9ub2RlX21vZHVsZXMvc3RhY2tmcmFtZS9zdGFja2ZyYW1lLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vbm9kZV9tb2R1bGVzL3N0YWNrLWdlbmVyYXRvci9zdGFjay1nZW5lcmF0b3IuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvc3RhY2tmcmFtZS9zdGFja2ZyYW1lLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vbm9kZV9tb2R1bGVzL3N0YWNrdHJhY2UtZ3BzL25vZGVfbW9kdWxlcy9zb3VyY2UtbWFwL2xpYi9hcnJheS1zZXQuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvc3RhY2t0cmFjZS1ncHMvbm9kZV9tb2R1bGVzL3NvdXJjZS1tYXAvbGliL2Jhc2U2NC12bHEuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvc3RhY2t0cmFjZS1ncHMvbm9kZV9tb2R1bGVzL3NvdXJjZS1tYXAvbGliL2Jhc2U2NC5qcyIsIndlYnBhY2s6Ly9teS1maXJzdC1pbmNyZW1lbnRhbC8uL25vZGVfbW9kdWxlcy9zdGFja3RyYWNlLWdwcy9ub2RlX21vZHVsZXMvc291cmNlLW1hcC9saWIvYmluYXJ5LXNlYXJjaC5qcyIsIndlYnBhY2s6Ly9teS1maXJzdC1pbmNyZW1lbnRhbC8uL25vZGVfbW9kdWxlcy9zdGFja3RyYWNlLWdwcy9ub2RlX21vZHVsZXMvc291cmNlLW1hcC9saWIvbWFwcGluZy1saXN0LmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vbm9kZV9tb2R1bGVzL3N0YWNrdHJhY2UtZ3BzL25vZGVfbW9kdWxlcy9zb3VyY2UtbWFwL2xpYi9xdWljay1zb3J0LmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vbm9kZV9tb2R1bGVzL3N0YWNrdHJhY2UtZ3BzL25vZGVfbW9kdWxlcy9zb3VyY2UtbWFwL2xpYi9zb3VyY2UtbWFwLWNvbnN1bWVyLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vbm9kZV9tb2R1bGVzL3N0YWNrdHJhY2UtZ3BzL25vZGVfbW9kdWxlcy9zb3VyY2UtbWFwL2xpYi9zb3VyY2UtbWFwLWdlbmVyYXRvci5qcyIsIndlYnBhY2s6Ly9teS1maXJzdC1pbmNyZW1lbnRhbC8uL25vZGVfbW9kdWxlcy9zdGFja3RyYWNlLWdwcy9ub2RlX21vZHVsZXMvc291cmNlLW1hcC9saWIvc291cmNlLW5vZGUuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvc3RhY2t0cmFjZS1ncHMvbm9kZV9tb2R1bGVzL3NvdXJjZS1tYXAvbGliL3V0aWwuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvc3RhY2t0cmFjZS1ncHMvbm9kZV9tb2R1bGVzL3NvdXJjZS1tYXAvc291cmNlLW1hcC5qcyIsIndlYnBhY2s6Ly9teS1maXJzdC1pbmNyZW1lbnRhbC8uL25vZGVfbW9kdWxlcy9zdGFja3RyYWNlLWdwcy9zdGFja3RyYWNlLWdwcy5qcyIsIndlYnBhY2s6Ly9teS1maXJzdC1pbmNyZW1lbnRhbC8uL25vZGVfbW9kdWxlcy9zdGFja3RyYWNlLWpzL3N0YWNrdHJhY2UuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvdHlwZXNjcmlwdC1sb2dnaW5nL2Rpc3QvY29tbW9uanMvY29udHJvbC9DYXRlZ29yeVNlcnZpY2VDb250cm9sLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vbm9kZV9tb2R1bGVzL3R5cGVzY3JpcHQtbG9nZ2luZy9kaXN0L2NvbW1vbmpzL2NvbnRyb2wvTG9nR3JvdXBDb250cm9sLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vbm9kZV9tb2R1bGVzL3R5cGVzY3JpcHQtbG9nZ2luZy9kaXN0L2NvbW1vbmpzL2V4dGVuc2lvbi9FeHRlbnNpb25IZWxwZXIuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvdHlwZXNjcmlwdC1sb2dnaW5nL2Rpc3QvY29tbW9uanMvbG9nL0xvZ2dlck9wdGlvbnMuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvdHlwZXNjcmlwdC1sb2dnaW5nL2Rpc3QvY29tbW9uanMvbG9nL2NhdGVnb3J5L0Fic3RyYWN0Q2F0ZWdvcnlMb2dnZXIuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvdHlwZXNjcmlwdC1sb2dnaW5nL2Rpc3QvY29tbW9uanMvbG9nL2NhdGVnb3J5L0NhdGVnb3J5LmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vbm9kZV9tb2R1bGVzL3R5cGVzY3JpcHQtbG9nZ2luZy9kaXN0L2NvbW1vbmpzL2xvZy9jYXRlZ29yeS9DYXRlZ29yeUNvbmZpZ3VyYXRpb24uanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvdHlwZXNjcmlwdC1sb2dnaW5nL2Rpc3QvY29tbW9uanMvbG9nL2NhdGVnb3J5L0NhdGVnb3J5Q29uc29sZUxvZ2dlckltcGwuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvdHlwZXNjcmlwdC1sb2dnaW5nL2Rpc3QvY29tbW9uanMvbG9nL2NhdGVnb3J5L0NhdGVnb3J5RGVsZWdhdGVMb2dnZXJJbXBsLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vbm9kZV9tb2R1bGVzL3R5cGVzY3JpcHQtbG9nZ2luZy9kaXN0L2NvbW1vbmpzL2xvZy9jYXRlZ29yeS9DYXRlZ29yeUV4dGVuc2lvbkxvZ2dlckltcGwuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvdHlwZXNjcmlwdC1sb2dnaW5nL2Rpc3QvY29tbW9uanMvbG9nL2NhdGVnb3J5L0NhdGVnb3J5TWVzc2FnZUJ1ZmZlckltcGwuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvdHlwZXNjcmlwdC1sb2dnaW5nL2Rpc3QvY29tbW9uanMvbG9nL2NhdGVnb3J5L0NhdGVnb3J5UnVudGltZVNldHRpbmdzLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vbm9kZV9tb2R1bGVzL3R5cGVzY3JpcHQtbG9nZ2luZy9kaXN0L2NvbW1vbmpzL2xvZy9jYXRlZ29yeS9DYXRlZ29yeVNlcnZpY2UuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvdHlwZXNjcmlwdC1sb2dnaW5nL2Rpc3QvY29tbW9uanMvbG9nL2NhdGVnb3J5L0NhdGVnb3J5U2VydmljZUZhY3RvcnkuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvdHlwZXNjcmlwdC1sb2dnaW5nL2Rpc3QvY29tbW9uanMvbG9nL3N0YW5kYXJkL0Fic3RyYWN0TG9nZ2VyLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vbm9kZV9tb2R1bGVzL3R5cGVzY3JpcHQtbG9nZ2luZy9kaXN0L2NvbW1vbmpzL2xvZy9zdGFuZGFyZC9Db25zb2xlTG9nZ2VySW1wbC5qcyIsIndlYnBhY2s6Ly9teS1maXJzdC1pbmNyZW1lbnRhbC8uL25vZGVfbW9kdWxlcy90eXBlc2NyaXB0LWxvZ2dpbmcvZGlzdC9jb21tb25qcy9sb2cvc3RhbmRhcmQvTEZTZXJ2aWNlLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vbm9kZV9tb2R1bGVzL3R5cGVzY3JpcHQtbG9nZ2luZy9kaXN0L2NvbW1vbmpzL2xvZy9zdGFuZGFyZC9Mb2dHcm91cFJ1bGUuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvdHlwZXNjcmlwdC1sb2dnaW5nL2Rpc3QvY29tbW9uanMvbG9nL3N0YW5kYXJkL0xvZ0dyb3VwUnVudGltZVNldHRpbmdzLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vbm9kZV9tb2R1bGVzL3R5cGVzY3JpcHQtbG9nZ2luZy9kaXN0L2NvbW1vbmpzL2xvZy9zdGFuZGFyZC9Mb2dnZXJGYWN0b3J5SW1wbC5qcyIsIndlYnBhY2s6Ly9teS1maXJzdC1pbmNyZW1lbnRhbC8uL25vZGVfbW9kdWxlcy90eXBlc2NyaXB0LWxvZ2dpbmcvZGlzdC9jb21tb25qcy9sb2cvc3RhbmRhcmQvTG9nZ2VyRmFjdG9yeU9wdGlvbnMuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9ub2RlX21vZHVsZXMvdHlwZXNjcmlwdC1sb2dnaW5nL2Rpc3QvY29tbW9uanMvbG9nL3N0YW5kYXJkL01lc3NhZ2VCdWZmZXJMb2dnZXJJbXBsLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vbm9kZV9tb2R1bGVzL3R5cGVzY3JpcHQtbG9nZ2luZy9kaXN0L2NvbW1vbmpzL3R5cGVzY3JpcHQtbG9nZ2luZy5qcyIsIndlYnBhY2s6Ly9teS1maXJzdC1pbmNyZW1lbnRhbC8uL25vZGVfbW9kdWxlcy90eXBlc2NyaXB0LWxvZ2dpbmcvZGlzdC9jb21tb25qcy91dGlscy9EYXRhU3RydWN0dXJlcy5qcyIsIndlYnBhY2s6Ly9teS1maXJzdC1pbmNyZW1lbnRhbC8uL25vZGVfbW9kdWxlcy90eXBlc2NyaXB0LWxvZ2dpbmcvZGlzdC9jb21tb25qcy91dGlscy9KU09OSGVscGVyLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vbm9kZV9tb2R1bGVzL3R5cGVzY3JpcHQtbG9nZ2luZy9kaXN0L2NvbW1vbmpzL3V0aWxzL01lc3NhZ2VVdGlscy5qcyIsIndlYnBhY2s6Ly9teS1maXJzdC1pbmNyZW1lbnRhbC8uL3NyYy9qcy9hbGxJbXBvcnRzLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vc3JjL2pzL2V4Y2VwdGlvbnMvZXJyb3JDb2RlLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vc3JjL2pzL2V4Y2VwdGlvbnMvZXJyb3JDdXN0b20uanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9zcmMvanMvZXhjZXB0aW9ucy9lcnJvck1lc3NhZ2VzLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vc3JjL2pzL2V4Y2VwdGlvbnMvZXJyb3JTZXJ2aWNlLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vc3JjL2pzL2V4Y2VwdGlvbnMvZXJyb3JUeXBlLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vc3JjL2pzL2hlbHBlcnMvVHlwZUhlbHBlci5qcyIsIndlYnBhY2s6Ly9teS1maXJzdC1pbmNyZW1lbnRhbC8uL3NyYy9qcy9sb2cvY29uZmlnLmpzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsLy4vc3JjL2pzL2xvZy9leGNlcHRpb25Mb2dnZXIuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvLi9zcmMvanMvd2luZG93L29uRXJyb3IuanMiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL215LWZpcnN0LWluY3JlbWVudGFsL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vbXktZmlyc3QtaW5jcmVtZW50YWwvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9teS1maXJzdC1pbmNyZW1lbnRhbC8uL3NyYy9qcy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFFBQVEsSUFBMEM7QUFDbEQsUUFBUSxpQ0FBNkIsQ0FBQyxnRkFBWSxDQUFDLG9DQUFFLE9BQU87QUFBQTtBQUFBO0FBQUEsa0dBQUM7QUFDN0QsS0FBSyxNQUFNLEVBSU47QUFDTCxDQUFDO0FBQ0Q7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBLDJCQUEyQixrQkFBa0I7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQSwyQkFBMkIsa0JBQWtCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCwyQkFBMkIsa0JBQWtCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLE1BQU07QUFDekIsb0JBQW9CLE1BQU07QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxhQUFhO0FBQ2I7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFD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QTtBQUNBLHNDQUFzQyxTQUFTO0FBQy9DO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxnQkFBZ0I7Ozs7Ozs7Ozs7O0FDdkdoQixnQkFBZ0Isb0JBQW9CO0FBQ3BDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyREFBMkQ7QUFDM0Qsb0JBQW9CO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGFBQWEsbUJBQU8sQ0FBQyxxRkFBVTs7QUFFL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBOzs7Ozs7Ozs7OztBQzNJQSxnQkFBZ0Isb0JBQW9CO0FBQ3BDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2QsZ0JBQWdCO0FBQ2hCLGdCQUFnQjs7QUFFaEIsbUJBQW1CO0FBQ25CLG9CQUFvQjs7QUFFcEIsZ0JBQWdCO0FBQ2hCLGdCQUFnQjs7QUFFaEIsZ0JBQWdCO0FBQ2hCLGlCQUFpQjs7QUFFakI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7O0FDbEVBLGdCQUFnQixvQkFBb0I7QUFDcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSw0QkFBNEI7QUFDNUIseUJBQXlCOztBQUV6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7OztBQzlHQSxnQkFBZ0Isb0JBQW9CO0FBQ3BDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsV0FBVyxtQkFBTyxDQUFDLGlGQUFROztBQUUzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0I7QUFDaEI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1CQUFtQjs7Ozs7Ozs7Ozs7QUM5RW5CLGdCQUFnQixvQkFBb0I7QUFDcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxNQUFNO0FBQ2pCO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsT0FBTztBQUNsQjtBQUNBLFdBQVcsT0FBTztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsTUFBTTtBQUNqQjtBQUNBLFdBQVcsU0FBUztBQUNwQjtBQUNBLFdBQVcsT0FBTztBQUNsQjtBQUNBLFdBQVcsT0FBTztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLE9BQU87QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsTUFBTTtBQUNqQjtBQUNBLFdBQVcsU0FBUztBQUNwQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7Ozs7Ozs7Ozs7O0FDakhBLGdCQUFnQixvQkFBb0I7QUFDcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxXQUFXLG1CQUFPLENBQUMsaUZBQVE7QUFDM0IsbUJBQW1CLG1CQUFPLENBQUMsbUdBQWlCO0FBQzVDLGVBQWUseUhBQStCO0FBQzlDLGdCQUFnQixtQkFBTyxDQUFDLDZGQUFjO0FBQ3RDLGdCQUFnQiw0SEFBaUM7O0FBRWpEO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRDtBQUN0RDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQjtBQUNuQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVzs7QUFFWDtBQUNBO0FBQ0EsT0FBTztBQUNQOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXOztBQUVYO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEseUJBQXlCOztBQUV6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixNQUFNO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0RBQXNEO0FBQ3REOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxzREFBc0QsWUFBWTtBQUNsRTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLG1DQUFtQztBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCLGNBQWM7QUFDdkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1Qix3Q0FBd0M7QUFDL0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtDQUErQyxtQkFBbUIsRUFBRTtBQUNwRTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLDhCQUE4Qjs7QUFFOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQixvQkFBb0I7QUFDckM7QUFDQTtB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QUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLEtBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSwwQ0FBMEMsU0FBUztBQUNuRDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQjtBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsMEJBQTBCOzs7Ozs7Ozs7OztBQ25aMUIsZ0JBQWdCLG9CQUFvQjtBQUNwQztBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLHlCQUF5Qix5SkFBb0Q7QUFDN0UsV0FBVyxtQkFBTyxDQUFDLGlGQUFROztBQUUzQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDLFFBQVE7QUFDekM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLENBQUM7QUFDRCxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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Q0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUN4QmdFO0FBQ1A7QUFDekQ7QUFDQSxJQUFJLDRFQUFrQjtBQUN0QixXQUFXLHFFQUFlO0FBQzFCOzs7Ozs7O1VDTEE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLGdDQUFnQyxZQUFZO1dBQzVDO1dBQ0EsRTs7Ozs7V0NQQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHdDQUF3Qyx5Q0FBeUM7V0FDakY7V0FDQTtXQUNBLEU7Ozs7O1dDUEEsd0Y7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0Esc0RBQXNELGtCQUFrQjtXQUN4RTtXQUNBLCtDQUErQyxjQUFjO1dBQzdELEU7Ozs7Ozs7Ozs7Ozs7QUNOeUIiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIC8vIFVuaXZlcnNhbCBNb2R1bGUgRGVmaW5pdGlvbiAoVU1EKSB0byBzdXBwb3J0IEFNRCwgQ29tbW9uSlMvTm9kZS5qcywgUmhpbm8sIGFuZCBicm93c2Vycy5cblxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoJ2Vycm9yLXN0YWNrLXBhcnNlcicsIFsnc3RhY2tmcmFtZSddLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnc3RhY2tmcmFtZScpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByb290LkVycm9yU3RhY2tQYXJzZXIgPSBmYWN0b3J5KHJvb3QuU3RhY2tGcmFtZSk7XG4gICAgfVxufSh0aGlzLCBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyKFN0YWNrRnJhbWUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgRklSRUZPWF9TQUZBUklfU1RBQ0tfUkVHRVhQID0gLyhefEApXFxTK1xcOlxcZCsvO1xuICAgIHZhciBDSFJPTUVfSUVfU1RBQ0tfUkVHRVhQID0gL15cXHMqYXQgLiooXFxTK1xcOlxcZCt8XFwobmF0aXZlXFwpKS9tO1xuICAgIHZhciBTQUZBUklfTkFUSVZFX0NPREVfUkVHRVhQID0gL14oZXZhbEApPyhcXFtuYXRpdmUgY29kZVxcXSk/JC87XG5cbiAgICBmdW5jdGlvbiBfbWFwKGFycmF5LCBmbiwgdGhpc0FyZykge1xuICAgICAgICBpZiAodHlwZW9mIEFycmF5LnByb3RvdHlwZS5tYXAgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBhcnJheS5tYXAoZm4sIHRoaXNBcmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIG91dHB1dCA9IG5ldyBBcnJheShhcnJheS5sZW5ndGgpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIG91dHB1dFtpXSA9IGZuLmNhbGwodGhpc0FyZywgYXJyYXlbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9maWx0ZXIoYXJyYXksIGZuLCB0aGlzQXJnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgQXJyYXkucHJvdG90eXBlLmZpbHRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIGFycmF5LmZpbHRlcihmbiwgdGhpc0FyZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZuLmNhbGwodGhpc0FyZywgYXJyYXlbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGFycmF5W2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2luZGV4T2YoYXJyYXksIHRhcmdldCkge1xuICAgICAgICBpZiAodHlwZW9mIEFycmF5LnByb3RvdHlwZS5pbmRleE9mID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gYXJyYXkuaW5kZXhPZih0YXJnZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChhcnJheVtpXSA9PT0gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHaXZlbiBhbiBFcnJvciBvYmplY3QsIGV4dHJhY3QgdGhlIG1vc3QgaW5mb3JtYXRpb24gZnJvbSBpdC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFcnJvcn0gZXJyb3Igb2JqZWN0XG4gICAgICAgICAqIEByZXR1cm4ge0FycmF5fSBvZiBTdGFja0ZyYW1lc1xuICAgICAgICAgKi9cbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGVycm9yLnN0YWNrdHJhY2UgIT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBlcnJvclsnb3BlcmEjc291cmNlbG9jJ10gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPcGVyYShlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVycm9yLnN0YWNrICYmIGVycm9yLnN0YWNrLm1hdGNoKENIUk9NRV9JRV9TVEFDS19SRUdFWFApKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VWOE9ySUUoZXJyb3IpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5zdGFjaykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlRkZPclNhZmFyaShlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHBhcnNlIGdpdmVuIEVycm9yIG9iamVjdCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIFNlcGFyYXRlIGxpbmUgYW5kIGNvbHVtbiBudW1iZXJzIGZyb20gYSBzdHJpbmcgb2YgdGhlIGZvcm06IChVUkk6TGluZTpDb2x1bW4pXG4gICAgICAgIGV4dHJhY3RMb2NhdGlvbjogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkZXh0cmFjdExvY2F0aW9uKHVybExpa2UpIHtcbiAgICAgICAgICAgIC8vIEZhaWwtZmFzdCBidXQgcmV0dXJuIGxvY2F0aW9ucyBsaWtlIFwiKG5hdGl2ZSlcIlxuICAgICAgICAgICAgaWYgKHVybExpa2UuaW5kZXhPZignOicpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbdXJsTGlrZV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByZWdFeHAgPSAvKC4rPykoPzpcXDooXFxkKykpPyg/OlxcOihcXGQrKSk/JC87XG4gICAgICAgICAgICB2YXIgcGFydHMgPSByZWdFeHAuZXhlYyh1cmxMaWtlLnJlcGxhY2UoL1tcXChcXCldL2csICcnKSk7XG4gICAgICAgICAgICByZXR1cm4gW3BhcnRzWzFdLCBwYXJ0c1syXSB8fCB1bmRlZmluZWQsIHBhcnRzWzNdIHx8IHVuZGVmaW5lZF07XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VWOE9ySUU6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlVjhPcklFKGVycm9yKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVyZWQgPSBfZmlsdGVyKGVycm9yLnN0YWNrLnNwbGl0KCdcXG4nKSwgZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhIWxpbmUubWF0Y2goQ0hST01FX0lFX1NUQUNLX1JFR0VYUCk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICAgICAgcmV0dXJuIF9tYXAoZmlsdGVyZWQsIGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAobGluZS5pbmRleE9mKCcoZXZhbCAnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRocm93IGF3YXkgZXZhbCBpbmZvcm1hdGlvbiB1bnRpbCB3ZSBpbXBsZW1lbnQgc3RhY2t0cmFjZS5qcy9zdGFja2ZyYW1lIzhcbiAgICAgICAgICAgICAgICAgICAgbGluZSA9IGxpbmUucmVwbGFjZSgvZXZhbCBjb2RlL2csICdldmFsJykucmVwbGFjZSgvKFxcKGV2YWwgYXQgW15cXCgpXSopfChcXClcXCwuKiQpL2csICcnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRva2VucyA9IGxpbmUucmVwbGFjZSgvXlxccysvLCAnJykucmVwbGFjZSgvXFwoZXZhbCBjb2RlL2csICcoJykuc3BsaXQoL1xccysvKS5zbGljZSgxKTtcbiAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb25QYXJ0cyA9IHRoaXMuZXh0cmFjdExvY2F0aW9uKHRva2Vucy5wb3AoKSk7XG4gICAgICAgICAgICAgICAgdmFyIGZ1bmN0aW9uTmFtZSA9IHRva2Vucy5qb2luKCcgJykgfHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHZhciBmaWxlTmFtZSA9IF9pbmRleE9mKFsnZXZhbCcsICc8YW5vbnltb3VzPiddLCBsb2NhdGlvblBhcnRzWzBdKSA+IC0xID8gdW5kZWZpbmVkIDogbG9jYXRpb25QYXJ0c1swXTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU3RhY2tGcmFtZShmdW5jdGlvbk5hbWUsIHVuZGVmaW5lZCwgZmlsZU5hbWUsIGxvY2F0aW9uUGFydHNbMV0sIGxvY2F0aW9uUGFydHNbMl0sIGxpbmUpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VGRk9yU2FmYXJpOiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZUZGT3JTYWZhcmkoZXJyb3IpIHtcbiAgICAgICAgICAgIHZhciBmaWx0ZXJlZCA9IF9maWx0ZXIoZXJyb3Iuc3RhY2suc3BsaXQoJ1xcbicpLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFsaW5lLm1hdGNoKFNBRkFSSV9OQVRJVkVfQ09ERV9SRUdFWFApO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgICAgIHJldHVybiBfbWFwKGZpbHRlcmVkLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhyb3cgYXdheSBldmFsIGluZm9ybWF0aW9uIHVudGlsIHdlIGltcGxlbWVudCBzdGFja3RyYWNlLmpzL3N0YWNrZnJhbWUjOFxuICAgICAgICAgICAgICAgIGlmIChsaW5lLmluZGV4T2YoJyA+IGV2YWwnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmUgPSBsaW5lLnJlcGxhY2UoLyBsaW5lIChcXGQrKSg/OiA+IGV2YWwgbGluZSBcXGQrKSogPiBldmFsXFw6XFxkK1xcOlxcZCsvZywgJzokMScpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChsaW5lLmluZGV4T2YoJ0AnKSA9PT0gLTEgJiYgbGluZS5pbmRleE9mKCc6JykgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFNhZmFyaSBldmFsIGZyYW1lcyBvbmx5IGhhdmUgZnVuY3Rpb24gbmFtZXMgYW5kIG5vdGhpbmcgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFN0YWNrRnJhbWUobGluZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRva2VucyA9IGxpbmUuc3BsaXQoJ0AnKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uUGFydHMgPSB0aGlzLmV4dHJhY3RMb2NhdGlvbih0b2tlbnMucG9wKCkpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZnVuY3Rpb25OYW1lID0gdG9rZW5zLmpvaW4oJ0AnKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU3RhY2tGcmFtZShmdW5jdGlvbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvblBhcnRzWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25QYXJ0c1sxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uUGFydHNbMl0sXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzZU9wZXJhOiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZU9wZXJhKGUpIHtcbiAgICAgICAgICAgIGlmICghZS5zdGFja3RyYWNlIHx8IChlLm1lc3NhZ2UuaW5kZXhPZignXFxuJykgPiAtMSAmJlxuICAgICAgICAgICAgICAgIGUubWVzc2FnZS5zcGxpdCgnXFxuJykubGVuZ3RoID4gZS5zdGFja3RyYWNlLnNwbGl0KCdcXG4nKS5sZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPcGVyYTkoZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFlLnN0YWNrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPcGVyYTEwKGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZU9wZXJhMTEoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VPcGVyYTk6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlT3BlcmE5KGUpIHtcbiAgICAgICAgICAgIHZhciBsaW5lUkUgPSAvTGluZSAoXFxkKykuKnNjcmlwdCAoPzppbiApPyhcXFMrKS9pO1xuICAgICAgICAgICAgdmFyIGxpbmVzID0gZS5tZXNzYWdlLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDIsIGxlbiA9IGxpbmVzLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoID0gbGluZVJFLmV4ZWMobGluZXNbaV0pO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXcgU3RhY2tGcmFtZSh1bmRlZmluZWQsIHVuZGVmaW5lZCwgbWF0Y2hbMl0sIG1hdGNoWzFdLCB1bmRlZmluZWQsIGxpbmVzW2ldKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gICAgICAgIHBhcnNlT3BlcmExMDogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VPcGVyYTEwKGUpIHtcbiAgICAgICAgICAgIHZhciBsaW5lUkUgPSAvTGluZSAoXFxkKykuKnNjcmlwdCAoPzppbiApPyhcXFMrKSg/OjogSW4gZnVuY3Rpb24gKFxcUyspKT8kL2k7XG4gICAgICAgICAgICB2YXIgbGluZXMgPSBlLnN0YWNrdHJhY2Uuc3BsaXQoJ1xcbicpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gbGluZXMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSBsaW5lUkUuZXhlYyhsaW5lc1tpXSk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFN0YWNrRnJhbWUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hbM10gfHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaFsyXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaFsxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZXNbaV1cbiAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gT3BlcmEgMTAuNjUrIEVycm9yLnN0YWNrIHZlcnkgc2ltaWxhciB0byBGRi9TYWZhcmlcbiAgICAgICAgcGFyc2VPcGVyYTExOiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZU9wZXJhMTEoZXJyb3IpIHtcbiAgICAgICAgICAgIHZhciBmaWx0ZXJlZCA9IF9maWx0ZXIoZXJyb3Iuc3RhY2suc3BsaXQoJ1xcbicpLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhbGluZS5tYXRjaChGSVJFRk9YX1NBRkFSSV9TVEFDS19SRUdFWFApICYmICFsaW5lLm1hdGNoKC9eRXJyb3IgY3JlYXRlZCBhdC8pO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgICAgIHJldHVybiBfbWFwKGZpbHRlcmVkLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRva2VucyA9IGxpbmUuc3BsaXQoJ0AnKTtcbiAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb25QYXJ0cyA9IHRoaXMuZXh0cmFjdExvY2F0aW9uKHRva2Vucy5wb3AoKSk7XG4gICAgICAgICAgICAgICAgdmFyIGZ1bmN0aW9uQ2FsbCA9ICh0b2tlbnMuc2hpZnQoKSB8fCAnJyk7XG4gICAgICAgICAgICAgICAgdmFyIGZ1bmN0aW9uTmFtZSA9IGZ1bmN0aW9uQ2FsbFxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLzxhbm9ueW1vdXMgZnVuY3Rpb24oOiAoXFx3KykpPz4vLCAnJDInKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcKFteXFwpXSpcXCkvZywgJycpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB2YXIgYXJnc1JhdztcbiAgICAgICAgICAgICAgICBpZiAoZnVuY3Rpb25DYWxsLm1hdGNoKC9cXCgoW15cXCldKilcXCkvKSkge1xuICAgICAgICAgICAgICAgICAgICBhcmdzUmF3ID0gZnVuY3Rpb25DYWxsLnJlcGxhY2UoL15bXlxcKF0rXFwoKFteXFwpXSopXFwpJC8sICckMScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IChhcmdzUmF3ID09PSB1bmRlZmluZWQgfHwgYXJnc1JhdyA9PT0gJ1thcmd1bWVudHMgbm90IGF2YWlsYWJsZV0nKSA/XG4gICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCA6IGFyZ3NSYXcuc3BsaXQoJywnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFN0YWNrRnJhbWUoXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25QYXJ0c1swXSxcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25QYXJ0c1sxXSxcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25QYXJ0c1syXSxcbiAgICAgICAgICAgICAgICAgICAgbGluZSk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH07XG59KSk7XG5cbiIsIihmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIC8vIFVuaXZlcnNhbCBNb2R1bGUgRGVmaW5pdGlvbiAoVU1EKSB0byBzdXBwb3J0IEFNRCwgQ29tbW9uSlMvTm9kZS5qcywgUmhpbm8sIGFuZCBicm93c2Vycy5cblxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoJ3N0YWNrZnJhbWUnLCBbXSwgZmFjdG9yeSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdC5TdGFja0ZyYW1lID0gZmFjdG9yeSgpO1xuICAgIH1cbn0odGhpcywgZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGZ1bmN0aW9uIF9pc051bWJlcihuKSB7XG4gICAgICAgIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2NhcGl0YWxpemUoc3RyKSB7XG4gICAgICAgIHJldHVybiBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc3Vic3RyaW5nKDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9nZXR0ZXIocCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1twXTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgYm9vbGVhblByb3BzID0gWydpc0NvbnN0cnVjdG9yJywgJ2lzRXZhbCcsICdpc05hdGl2ZScsICdpc1RvcGxldmVsJ107XG4gICAgdmFyIG51bWVyaWNQcm9wcyA9IFsnY29sdW1uTnVtYmVyJywgJ2xpbmVOdW1iZXInXTtcbiAgICB2YXIgc3RyaW5nUHJvcHMgPSBbJ2ZpbGVOYW1lJywgJ2Z1bmN0aW9uTmFtZScsICdzb3VyY2UnXTtcbiAgICB2YXIgYXJyYXlQcm9wcyA9IFsnYXJncyddO1xuICAgIHZhciBvYmplY3RQcm9wcyA9IFsnZXZhbE9yaWdpbiddO1xuXG4gICAgdmFyIHByb3BzID0gYm9vbGVhblByb3BzLmNvbmNhdChudW1lcmljUHJvcHMsIHN0cmluZ1Byb3BzLCBhcnJheVByb3BzLCBvYmplY3RQcm9wcyk7XG5cbiAgICBmdW5jdGlvbiBTdGFja0ZyYW1lKG9iaikge1xuICAgICAgICBpZiAoIW9iaikgcmV0dXJuO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAob2JqW3Byb3BzW2ldXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpc1snc2V0JyArIF9jYXBpdGFsaXplKHByb3BzW2ldKV0ob2JqW3Byb3BzW2ldXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBTdGFja0ZyYW1lLnByb3RvdHlwZSA9IHtcbiAgICAgICAgZ2V0QXJnczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcmdzO1xuICAgICAgICB9LFxuICAgICAgICBzZXRBcmdzOiBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHYpICE9PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJncyBtdXN0IGJlIGFuIEFycmF5Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmFyZ3MgPSB2O1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldEV2YWxPcmlnaW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXZhbE9yaWdpbjtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0RXZhbE9yaWdpbjogZnVuY3Rpb24odikge1xuICAgICAgICAgICAgaWYgKHYgaW5zdGFuY2VvZiBTdGFja0ZyYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ldmFsT3JpZ2luID0gdjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodiBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZXZhbE9yaWdpbiA9IG5ldyBTdGFja0ZyYW1lKHYpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFdmFsIE9yaWdpbiBtdXN0IGJlIGFuIE9iamVjdCBvciBTdGFja0ZyYW1lJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGZpbGVOYW1lID0gdGhpcy5nZXRGaWxlTmFtZSgpIHx8ICcnO1xuICAgICAgICAgICAgdmFyIGxpbmVOdW1iZXIgPSB0aGlzLmdldExpbmVOdW1iZXIoKSB8fCAnJztcbiAgICAgICAgICAgIHZhciBjb2x1bW5OdW1iZXIgPSB0aGlzLmdldENvbHVtbk51bWJlcigpIHx8ICcnO1xuICAgICAgICAgICAgdmFyIGZ1bmN0aW9uTmFtZSA9IHRoaXMuZ2V0RnVuY3Rpb25OYW1lKCkgfHwgJyc7XG4gICAgICAgICAgICBpZiAodGhpcy5nZXRJc0V2YWwoKSkge1xuICAgICAgICAgICAgICAgIGlmIChmaWxlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1tldmFsXSAoJyArIGZpbGVOYW1lICsgJzonICsgbGluZU51bWJlciArICc6JyArIGNvbHVtbk51bWJlciArICcpJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICdbZXZhbF06JyArIGxpbmVOdW1iZXIgKyAnOicgKyBjb2x1bW5OdW1iZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZnVuY3Rpb25OYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uTmFtZSArICcgKCcgKyBmaWxlTmFtZSArICc6JyArIGxpbmVOdW1iZXIgKyAnOicgKyBjb2x1bW5OdW1iZXIgKyAnKSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmlsZU5hbWUgKyAnOicgKyBsaW5lTnVtYmVyICsgJzonICsgY29sdW1uTnVtYmVyO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIFN0YWNrRnJhbWUuZnJvbVN0cmluZyA9IGZ1bmN0aW9uIFN0YWNrRnJhbWUkJGZyb21TdHJpbmcoc3RyKSB7XG4gICAgICAgIHZhciBhcmdzU3RhcnRJbmRleCA9IHN0ci5pbmRleE9mKCcoJyk7XG4gICAgICAgIHZhciBhcmdzRW5kSW5kZXggPSBzdHIubGFzdEluZGV4T2YoJyknKTtcblxuICAgICAgICB2YXIgZnVuY3Rpb25OYW1lID0gc3RyLnN1YnN0cmluZygwLCBhcmdzU3RhcnRJbmRleCk7XG4gICAgICAgIHZhciBhcmdzID0gc3RyLnN1YnN0cmluZyhhcmdzU3RhcnRJbmRleCArIDEsIGFyZ3NFbmRJbmRleCkuc3BsaXQoJywnKTtcbiAgICAgICAgdmFyIGxvY2F0aW9uU3RyaW5nID0gc3RyLnN1YnN0cmluZyhhcmdzRW5kSW5kZXggKyAxKTtcblxuICAgICAgICBpZiAobG9jYXRpb25TdHJpbmcuaW5kZXhPZignQCcpID09PSAwKSB7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSAvQCguKz8pKD86OihcXGQrKSk/KD86OihcXGQrKSk/JC8uZXhlYyhsb2NhdGlvblN0cmluZywgJycpO1xuICAgICAgICAgICAgdmFyIGZpbGVOYW1lID0gcGFydHNbMV07XG4gICAgICAgICAgICB2YXIgbGluZU51bWJlciA9IHBhcnRzWzJdO1xuICAgICAgICAgICAgdmFyIGNvbHVtbk51bWJlciA9IHBhcnRzWzNdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBTdGFja0ZyYW1lKHtcbiAgICAgICAgICAgIGZ1bmN0aW9uTmFtZTogZnVuY3Rpb25OYW1lLFxuICAgICAgICAgICAgYXJnczogYXJncyB8fCB1bmRlZmluZWQsXG4gICAgICAgICAgICBmaWxlTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGNvbHVtbk51bWJlcjogY29sdW1uTnVtYmVyIHx8IHVuZGVmaW5lZFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBib29sZWFuUHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgU3RhY2tGcmFtZS5wcm90b3R5cGVbJ2dldCcgKyBfY2FwaXRhbGl6ZShib29sZWFuUHJvcHNbaV0pXSA9IF9nZXR0ZXIoYm9vbGVhblByb3BzW2ldKTtcbiAgICAgICAgU3RhY2tGcmFtZS5wcm90b3R5cGVbJ3NldCcgKyBfY2FwaXRhbGl6ZShib29sZWFuUHJvcHNbaV0pXSA9IChmdW5jdGlvbihwKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24odikge1xuICAgICAgICAgICAgICAgIHRoaXNbcF0gPSBCb29sZWFuKHYpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkoYm9vbGVhblByb3BzW2ldKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IG51bWVyaWNQcm9wcy5sZW5ndGg7IGorKykge1xuICAgICAgICBTdGFja0ZyYW1lLnByb3RvdHlwZVsnZ2V0JyArIF9jYXBpdGFsaXplKG51bWVyaWNQcm9wc1tqXSldID0gX2dldHRlcihudW1lcmljUHJvcHNbal0pO1xuICAgICAgICBTdGFja0ZyYW1lLnByb3RvdHlwZVsnc2V0JyArIF9jYXBpdGFsaXplKG51bWVyaWNQcm9wc1tqXSldID0gKGZ1bmN0aW9uKHApIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFfaXNOdW1iZXIodikpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihwICsgJyBtdXN0IGJlIGEgTnVtYmVyJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXNbcF0gPSBOdW1iZXIodik7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KShudW1lcmljUHJvcHNbal0pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGsgPSAwOyBrIDwgc3RyaW5nUHJvcHMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgU3RhY2tGcmFtZS5wcm90b3R5cGVbJ2dldCcgKyBfY2FwaXRhbGl6ZShzdHJpbmdQcm9wc1trXSldID0gX2dldHRlcihzdHJpbmdQcm9wc1trXSk7XG4gICAgICAgIFN0YWNrRnJhbWUucHJvdG90eXBlWydzZXQnICsgX2NhcGl0YWxpemUoc3RyaW5nUHJvcHNba10pXSA9IChmdW5jdGlvbihwKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24odikge1xuICAgICAgICAgICAgICAgIHRoaXNbcF0gPSBTdHJpbmcodik7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KShzdHJpbmdQcm9wc1trXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFN0YWNrRnJhbWU7XG59KSk7XG4iLCIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgLy8gVW5pdmVyc2FsIE1vZHVsZSBEZWZpbml0aW9uIChVTUQpIHRvIHN1cHBvcnQgQU1ELCBDb21tb25KUy9Ob2RlLmpzLCBSaGlubywgYW5kIGJyb3dzZXJzLlxuXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZSgnc3RhY2stZ2VuZXJhdG9yJywgWydzdGFja2ZyYW1lJ10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdzdGFja2ZyYW1lJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3QuU3RhY2tHZW5lcmF0b3IgPSBmYWN0b3J5KHJvb3QuU3RhY2tGcmFtZSk7XG4gICAgfVxufSh0aGlzLCBmdW5jdGlvbiAoU3RhY2tGcmFtZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGJhY2t0cmFjZTogZnVuY3Rpb24gU3RhY2tHZW5lcmF0b3IkJGJhY2t0cmFjZShvcHRzKSB7XG4gICAgICAgICAgICB2YXIgc3RhY2sgPSBbXTtcbiAgICAgICAgICAgIHZhciBtYXhTdGFja1NpemUgPSAxMDtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2Ygb3B0cy5tYXhTdGFja1NpemUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgbWF4U3RhY2tTaXplID0gb3B0cy5tYXhTdGFja1NpemU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBjdXJyID0gYXJndW1lbnRzLmNhbGxlZTtcbiAgICAgICAgICAgIHdoaWxlIChjdXJyICYmIHN0YWNrLmxlbmd0aCA8IG1heFN0YWNrU2l6ZSkge1xuICAgICAgICAgICAgICAgIC8vIEFsbG93IFY4IG9wdGltaXphdGlvbnNcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IG5ldyBBcnJheShjdXJyWydhcmd1bWVudHMnXS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbaV0gPSBjdXJyWydhcmd1bWVudHMnXVtpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKC9mdW5jdGlvbig/OlxccysoW1xcdyRdKykpK1xccypcXCgvLnRlc3QoY3Vyci50b1N0cmluZygpKSkge1xuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKG5ldyBTdGFja0ZyYW1lKHtmdW5jdGlvbk5hbWU6IFJlZ0V4cC4kMSB8fCB1bmRlZmluZWQsIGFyZ3M6IGFyZ3N9KSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaChuZXcgU3RhY2tGcmFtZSh7YXJnczogYXJnc30pKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyID0gY3Vyci5jYWxsZXI7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RhY2s7XG4gICAgICAgIH1cbiAgICB9O1xufSkpO1xuIiwiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIC8vIFVuaXZlcnNhbCBNb2R1bGUgRGVmaW5pdGlvbiAoVU1EKSB0byBzdXBwb3J0IEFNRCwgQ29tbW9uSlMvTm9kZS5qcywgUmhpbm8sIGFuZCBicm93c2Vycy5cblxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoJ3N0YWNrZnJhbWUnLCBbXSwgZmFjdG9yeSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdC5TdGFja0ZyYW1lID0gZmFjdG9yeSgpO1xuICAgIH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBmdW5jdGlvbiBfaXNOdW1iZXIobikge1xuICAgICAgICByZXR1cm4gIWlzTmFOKHBhcnNlRmxvYXQobikpICYmIGlzRmluaXRlKG4pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIFN0YWNrRnJhbWUoZnVuY3Rpb25OYW1lLCBhcmdzLCBmaWxlTmFtZSwgbGluZU51bWJlciwgY29sdW1uTnVtYmVyLCBzb3VyY2UpIHtcbiAgICAgICAgaWYgKGZ1bmN0aW9uTmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldEZ1bmN0aW9uTmFtZShmdW5jdGlvbk5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcmdzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJncyhhcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmlsZU5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRGaWxlTmFtZShmaWxlTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpbmVOdW1iZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRMaW5lTnVtYmVyKGxpbmVOdW1iZXIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2x1bW5OdW1iZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRDb2x1bW5OdW1iZXIoY29sdW1uTnVtYmVyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc291cmNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U291cmNlKHNvdXJjZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBTdGFja0ZyYW1lLnByb3RvdHlwZSA9IHtcbiAgICAgICAgZ2V0RnVuY3Rpb25OYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mdW5jdGlvbk5hbWU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldEZ1bmN0aW9uTmFtZTogZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIHRoaXMuZnVuY3Rpb25OYW1lID0gU3RyaW5nKHYpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldEFyZ3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFyZ3M7XG4gICAgICAgIH0sXG4gICAgICAgIHNldEFyZ3M6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHYpICE9PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJncyBtdXN0IGJlIGFuIEFycmF5Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmFyZ3MgPSB2O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIE5PVEU6IFByb3BlcnR5IG5hbWUgbWF5IGJlIG1pc2xlYWRpbmcgYXMgaXQgaW5jbHVkZXMgdGhlIHBhdGgsXG4gICAgICAgIC8vIGJ1dCBpdCBzb21ld2hhdCBtaXJyb3JzIFY4J3MgSmF2YVNjcmlwdFN0YWNrVHJhY2VBcGlcbiAgICAgICAgLy8gaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC93aWtpL0phdmFTY3JpcHRTdGFja1RyYWNlQXBpIGFuZCBHZWNrbydzXG4gICAgICAgIC8vIGh0dHA6Ly9teHIubW96aWxsYS5vcmcvbW96aWxsYS1jZW50cmFsL3NvdXJjZS94cGNvbS9iYXNlL25zSUV4Y2VwdGlvbi5pZGwjMTRcbiAgICAgICAgZ2V0RmlsZU5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZpbGVOYW1lO1xuICAgICAgICB9LFxuICAgICAgICBzZXRGaWxlTmFtZTogZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsZU5hbWUgPSBTdHJpbmcodik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0TGluZU51bWJlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGluZU51bWJlcjtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0TGluZU51bWJlcjogZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIGlmICghX2lzTnVtYmVyKHYpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTGluZSBOdW1iZXIgbXVzdCBiZSBhIE51bWJlcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5saW5lTnVtYmVyID0gTnVtYmVyKHYpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldENvbHVtbk51bWJlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29sdW1uTnVtYmVyO1xuICAgICAgICB9LFxuICAgICAgICBzZXRDb2x1bW5OdW1iZXI6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICBpZiAoIV9pc051bWJlcih2KSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0NvbHVtbiBOdW1iZXIgbXVzdCBiZSBhIE51bWJlcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jb2x1bW5OdW1iZXIgPSBOdW1iZXIodik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0U291cmNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zb3VyY2U7XG4gICAgICAgIH0sXG4gICAgICAgIHNldFNvdXJjZTogZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIHRoaXMuc291cmNlID0gU3RyaW5nKHYpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBmdW5jdGlvbk5hbWUgPSB0aGlzLmdldEZ1bmN0aW9uTmFtZSgpIHx8ICd7YW5vbnltb3VzfSc7XG4gICAgICAgICAgICB2YXIgYXJncyA9ICcoJyArICh0aGlzLmdldEFyZ3MoKSB8fCBbXSkuam9pbignLCcpICsgJyknO1xuICAgICAgICAgICAgdmFyIGZpbGVOYW1lID0gdGhpcy5nZXRGaWxlTmFtZSgpID8gKCdAJyArIHRoaXMuZ2V0RmlsZU5hbWUoKSkgOiAnJztcbiAgICAgICAgICAgIHZhciBsaW5lTnVtYmVyID0gX2lzTnVtYmVyKHRoaXMuZ2V0TGluZU51bWJlcigpKSA/ICgnOicgKyB0aGlzLmdldExpbmVOdW1iZXIoKSkgOiAnJztcbiAgICAgICAgICAgIHZhciBjb2x1bW5OdW1iZXIgPSBfaXNOdW1iZXIodGhpcy5nZXRDb2x1bW5OdW1iZXIoKSkgPyAoJzonICsgdGhpcy5nZXRDb2x1bW5OdW1iZXIoKSkgOiAnJztcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbk5hbWUgKyBhcmdzICsgZmlsZU5hbWUgKyBsaW5lTnVtYmVyICsgY29sdW1uTnVtYmVyO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBTdGFja0ZyYW1lO1xufSkpO1xuIiwiLyogLSotIE1vZGU6IGpzOyBqcy1pbmRlbnQtbGV2ZWw6IDI7IC0qLSAqL1xuLypcbiAqIENvcHlyaWdodCAyMDExIE1vemlsbGEgRm91bmRhdGlvbiBhbmQgY29udHJpYnV0b3JzXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTmV3IEJTRCBsaWNlbnNlLiBTZWUgTElDRU5TRSBvcjpcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2VcbiAqL1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQSBkYXRhIHN0cnVjdHVyZSB3aGljaCBpcyBhIGNvbWJpbmF0aW9uIG9mIGFuIGFycmF5IGFuZCBhIHNldC4gQWRkaW5nIGEgbmV3XG4gKiBtZW1iZXIgaXMgTygxKSwgdGVzdGluZyBmb3IgbWVtYmVyc2hpcCBpcyBPKDEpLCBhbmQgZmluZGluZyB0aGUgaW5kZXggb2YgYW5cbiAqIGVsZW1lbnQgaXMgTygxKS4gUmVtb3ZpbmcgZWxlbWVudHMgZnJvbSB0aGUgc2V0IGlzIG5vdCBzdXBwb3J0ZWQuIE9ubHlcbiAqIHN0cmluZ3MgYXJlIHN1cHBvcnRlZCBmb3IgbWVtYmVyc2hpcC5cbiAqL1xuZnVuY3Rpb24gQXJyYXlTZXQoKSB7XG4gIHRoaXMuX2FycmF5ID0gW107XG4gIHRoaXMuX3NldCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG59XG5cbi8qKlxuICogU3RhdGljIG1ldGhvZCBmb3IgY3JlYXRpbmcgQXJyYXlTZXQgaW5zdGFuY2VzIGZyb20gYW4gZXhpc3RpbmcgYXJyYXkuXG4gKi9cbkFycmF5U2V0LmZyb21BcnJheSA9IGZ1bmN0aW9uIEFycmF5U2V0X2Zyb21BcnJheShhQXJyYXksIGFBbGxvd0R1cGxpY2F0ZXMpIHtcbiAgdmFyIHNldCA9IG5ldyBBcnJheVNldCgpO1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYUFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgc2V0LmFkZChhQXJyYXlbaV0sIGFBbGxvd0R1cGxpY2F0ZXMpO1xuICB9XG4gIHJldHVybiBzZXQ7XG59O1xuXG4vKipcbiAqIFJldHVybiBob3cgbWFueSB1bmlxdWUgaXRlbXMgYXJlIGluIHRoaXMgQXJyYXlTZXQuIElmIGR1cGxpY2F0ZXMgaGF2ZSBiZWVuXG4gKiBhZGRlZCwgdGhhbiB0aG9zZSBkbyBub3QgY291bnQgdG93YXJkcyB0aGUgc2l6ZS5cbiAqXG4gKiBAcmV0dXJucyBOdW1iZXJcbiAqL1xuQXJyYXlTZXQucHJvdG90eXBlLnNpemUgPSBmdW5jdGlvbiBBcnJheVNldF9zaXplKCkge1xuICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGhpcy5fc2V0KS5sZW5ndGg7XG59O1xuXG4vKipcbiAqIEFkZCB0aGUgZ2l2ZW4gc3RyaW5nIHRvIHRoaXMgc2V0LlxuICpcbiAqIEBwYXJhbSBTdHJpbmcgYVN0clxuICovXG5BcnJheVNldC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gQXJyYXlTZXRfYWRkKGFTdHIsIGFBbGxvd0R1cGxpY2F0ZXMpIHtcbiAgdmFyIHNTdHIgPSB1dGlsLnRvU2V0U3RyaW5nKGFTdHIpO1xuICB2YXIgaXNEdXBsaWNhdGUgPSBoYXMuY2FsbCh0aGlzLl9zZXQsIHNTdHIpO1xuICB2YXIgaWR4ID0gdGhpcy5fYXJyYXkubGVuZ3RoO1xuICBpZiAoIWlzRHVwbGljYXRlIHx8IGFBbGxvd0R1cGxpY2F0ZXMpIHtcbiAgICB0aGlzLl9hcnJheS5wdXNoKGFTdHIpO1xuICB9XG4gIGlmICghaXNEdXBsaWNhdGUpIHtcbiAgICB0aGlzLl9zZXRbc1N0cl0gPSBpZHg7XG4gIH1cbn07XG5cbi8qKlxuICogSXMgdGhlIGdpdmVuIHN0cmluZyBhIG1lbWJlciBvZiB0aGlzIHNldD9cbiAqXG4gKiBAcGFyYW0gU3RyaW5nIGFTdHJcbiAqL1xuQXJyYXlTZXQucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uIEFycmF5U2V0X2hhcyhhU3RyKSB7XG4gIHZhciBzU3RyID0gdXRpbC50b1NldFN0cmluZyhhU3RyKTtcbiAgcmV0dXJuIGhhcy5jYWxsKHRoaXMuX3NldCwgc1N0cik7XG59O1xuXG4vKipcbiAqIFdoYXQgaXMgdGhlIGluZGV4IG9mIHRoZSBnaXZlbiBzdHJpbmcgaW4gdGhlIGFycmF5P1xuICpcbiAqIEBwYXJhbSBTdHJpbmcgYVN0clxuICovXG5BcnJheVNldC5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIEFycmF5U2V0X2luZGV4T2YoYVN0cikge1xuICB2YXIgc1N0ciA9IHV0aWwudG9TZXRTdHJpbmcoYVN0cik7XG4gIGlmIChoYXMuY2FsbCh0aGlzLl9zZXQsIHNTdHIpKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NldFtzU3RyXTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ1wiJyArIGFTdHIgKyAnXCIgaXMgbm90IGluIHRoZSBzZXQuJyk7XG59O1xuXG4vKipcbiAqIFdoYXQgaXMgdGhlIGVsZW1lbnQgYXQgdGhlIGdpdmVuIGluZGV4P1xuICpcbiAqIEBwYXJhbSBOdW1iZXIgYUlkeFxuICovXG5BcnJheVNldC5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiBBcnJheVNldF9hdChhSWR4KSB7XG4gIGlmIChhSWR4ID49IDAgJiYgYUlkeCA8IHRoaXMuX2FycmF5Lmxlbmd0aCkge1xuICAgIHJldHVybiB0aGlzLl9hcnJheVthSWR4XTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ05vIGVsZW1lbnQgaW5kZXhlZCBieSAnICsgYUlkeCk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGFycmF5IHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgc2V0ICh3aGljaCBoYXMgdGhlIHByb3BlciBpbmRpY2VzXG4gKiBpbmRpY2F0ZWQgYnkgaW5kZXhPZikuIE5vdGUgdGhhdCB0aGlzIGlzIGEgY29weSBvZiB0aGUgaW50ZXJuYWwgYXJyYXkgdXNlZFxuICogZm9yIHN0b3JpbmcgdGhlIG1lbWJlcnMgc28gdGhhdCBubyBvbmUgY2FuIG1lc3Mgd2l0aCBpbnRlcm5hbCBzdGF0ZS5cbiAqL1xuQXJyYXlTZXQucHJvdG90eXBlLnRvQXJyYXkgPSBmdW5jdGlvbiBBcnJheVNldF90b0FycmF5KCkge1xuICByZXR1cm4gdGhpcy5fYXJyYXkuc2xpY2UoKTtcbn07XG5cbmV4cG9ydHMuQXJyYXlTZXQgPSBBcnJheVNldDtcbiIsIi8qIC0qLSBNb2RlOiBqczsganMtaW5kZW50LWxldmVsOiAyOyAtKi0gKi9cbi8qXG4gKiBDb3B5cmlnaHQgMjAxMSBNb3ppbGxhIEZvdW5kYXRpb24gYW5kIGNvbnRyaWJ1dG9yc1xuICogTGljZW5zZWQgdW5kZXIgdGhlIE5ldyBCU0QgbGljZW5zZS4gU2VlIExJQ0VOU0Ugb3I6XG4gKiBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvQlNELTMtQ2xhdXNlXG4gKlxuICogQmFzZWQgb24gdGhlIEJhc2UgNjQgVkxRIGltcGxlbWVudGF0aW9uIGluIENsb3N1cmUgQ29tcGlsZXI6XG4gKiBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nsb3N1cmUtY29tcGlsZXIvc291cmNlL2Jyb3dzZS90cnVuay9zcmMvY29tL2dvb2dsZS9kZWJ1Z2dpbmcvc291cmNlbWFwL0Jhc2U2NFZMUS5qYXZhXG4gKlxuICogQ29weXJpZ2h0IDIwMTEgVGhlIENsb3N1cmUgQ29tcGlsZXIgQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICogbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZVxuICogbWV0OlxuICpcbiAqICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gKiAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gKiAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlXG4gKiAgICBjb3B5cmlnaHQgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZ1xuICogICAgZGlzY2xhaW1lciBpbiB0aGUgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkXG4gKiAgICB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gKiAgKiBOZWl0aGVyIHRoZSBuYW1lIG9mIEdvb2dsZSBJbmMuIG5vciB0aGUgbmFtZXMgb2YgaXRzXG4gKiAgICBjb250cmlidXRvcnMgbWF5IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzIGRlcml2ZWRcbiAqICAgIGZyb20gdGhpcyBzb2Z0d2FyZSB3aXRob3V0IHNwZWNpZmljIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbi5cbiAqXG4gKiBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTXG4gKiBcIkFTIElTXCIgQU5EIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UXG4gKiBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1JcbiAqIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUXG4gKiBPV05FUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCxcbiAqIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsIEJVVCBOT1RcbiAqIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLFxuICogREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZXG4gKiBUSEVPUlkgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXG4gKiAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0VcbiAqIE9GIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJy4vYmFzZTY0Jyk7XG5cbi8vIEEgc2luZ2xlIGJhc2UgNjQgZGlnaXQgY2FuIGNvbnRhaW4gNiBiaXRzIG9mIGRhdGEuIEZvciB0aGUgYmFzZSA2NCB2YXJpYWJsZVxuLy8gbGVuZ3RoIHF1YW50aXRpZXMgd2UgdXNlIGluIHRoZSBzb3VyY2UgbWFwIHNwZWMsIHRoZSBmaXJzdCBiaXQgaXMgdGhlIHNpZ24sXG4vLyB0aGUgbmV4dCBmb3VyIGJpdHMgYXJlIHRoZSBhY3R1YWwgdmFsdWUsIGFuZCB0aGUgNnRoIGJpdCBpcyB0aGVcbi8vIGNvbnRpbnVhdGlvbiBiaXQuIFRoZSBjb250aW51YXRpb24gYml0IHRlbGxzIHVzIHdoZXRoZXIgdGhlcmUgYXJlIG1vcmVcbi8vIGRpZ2l0cyBpbiB0aGlzIHZhbHVlIGZvbGxvd2luZyB0aGlzIGRpZ2l0LlxuLy9cbi8vICAgQ29udGludWF0aW9uXG4vLyAgIHwgICAgU2lnblxuLy8gICB8ICAgIHxcbi8vICAgViAgICBWXG4vLyAgIDEwMTAxMVxuXG52YXIgVkxRX0JBU0VfU0hJRlQgPSA1O1xuXG4vLyBiaW5hcnk6IDEwMDAwMFxudmFyIFZMUV9CQVNFID0gMSA8PCBWTFFfQkFTRV9TSElGVDtcblxuLy8gYmluYXJ5OiAwMTExMTFcbnZhciBWTFFfQkFTRV9NQVNLID0gVkxRX0JBU0UgLSAxO1xuXG4vLyBiaW5hcnk6IDEwMDAwMFxudmFyIFZMUV9DT05USU5VQVRJT05fQklUID0gVkxRX0JBU0U7XG5cbi8qKlxuICogQ29udmVydHMgZnJvbSBhIHR3by1jb21wbGVtZW50IHZhbHVlIHRvIGEgdmFsdWUgd2hlcmUgdGhlIHNpZ24gYml0IGlzXG4gKiBwbGFjZWQgaW4gdGhlIGxlYXN0IHNpZ25pZmljYW50IGJpdC4gIEZvciBleGFtcGxlLCBhcyBkZWNpbWFsczpcbiAqICAgMSBiZWNvbWVzIDIgKDEwIGJpbmFyeSksIC0xIGJlY29tZXMgMyAoMTEgYmluYXJ5KVxuICogICAyIGJlY29tZXMgNCAoMTAwIGJpbmFyeSksIC0yIGJlY29tZXMgNSAoMTAxIGJpbmFyeSlcbiAqL1xuZnVuY3Rpb24gdG9WTFFTaWduZWQoYVZhbHVlKSB7XG4gIHJldHVybiBhVmFsdWUgPCAwXG4gICAgPyAoKC1hVmFsdWUpIDw8IDEpICsgMVxuICAgIDogKGFWYWx1ZSA8PCAxKSArIDA7XG59XG5cbi8qKlxuICogQ29udmVydHMgdG8gYSB0d28tY29tcGxlbWVudCB2YWx1ZSBmcm9tIGEgdmFsdWUgd2hlcmUgdGhlIHNpZ24gYml0IGlzXG4gKiBwbGFjZWQgaW4gdGhlIGxlYXN0IHNpZ25pZmljYW50IGJpdC4gIEZvciBleGFtcGxlLCBhcyBkZWNpbWFsczpcbiAqICAgMiAoMTAgYmluYXJ5KSBiZWNvbWVzIDEsIDMgKDExIGJpbmFyeSkgYmVjb21lcyAtMVxuICogICA0ICgxMDAgYmluYXJ5KSBiZWNvbWVzIDIsIDUgKDEwMSBiaW5hcnkpIGJlY29tZXMgLTJcbiAqL1xuZnVuY3Rpb24gZnJvbVZMUVNpZ25lZChhVmFsdWUpIHtcbiAgdmFyIGlzTmVnYXRpdmUgPSAoYVZhbHVlICYgMSkgPT09IDE7XG4gIHZhciBzaGlmdGVkID0gYVZhbHVlID4+IDE7XG4gIHJldHVybiBpc05lZ2F0aXZlXG4gICAgPyAtc2hpZnRlZFxuICAgIDogc2hpZnRlZDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBiYXNlIDY0IFZMUSBlbmNvZGVkIHZhbHVlLlxuICovXG5leHBvcnRzLmVuY29kZSA9IGZ1bmN0aW9uIGJhc2U2NFZMUV9lbmNvZGUoYVZhbHVlKSB7XG4gIHZhciBlbmNvZGVkID0gXCJcIjtcbiAgdmFyIGRpZ2l0O1xuXG4gIHZhciB2bHEgPSB0b1ZMUVNpZ25lZChhVmFsdWUpO1xuXG4gIGRvIHtcbiAgICBkaWdpdCA9IHZscSAmIFZMUV9CQVNFX01BU0s7XG4gICAgdmxxID4+Pj0gVkxRX0JBU0VfU0hJRlQ7XG4gICAgaWYgKHZscSA+IDApIHtcbiAgICAgIC8vIFRoZXJlIGFyZSBzdGlsbCBtb3JlIGRpZ2l0cyBpbiB0aGlzIHZhbHVlLCBzbyB3ZSBtdXN0IG1ha2Ugc3VyZSB0aGVcbiAgICAgIC8vIGNvbnRpbnVhdGlvbiBiaXQgaXMgbWFya2VkLlxuICAgICAgZGlnaXQgfD0gVkxRX0NPTlRJTlVBVElPTl9CSVQ7XG4gICAgfVxuICAgIGVuY29kZWQgKz0gYmFzZTY0LmVuY29kZShkaWdpdCk7XG4gIH0gd2hpbGUgKHZscSA+IDApO1xuXG4gIHJldHVybiBlbmNvZGVkO1xufTtcblxuLyoqXG4gKiBEZWNvZGVzIHRoZSBuZXh0IGJhc2UgNjQgVkxRIHZhbHVlIGZyb20gdGhlIGdpdmVuIHN0cmluZyBhbmQgcmV0dXJucyB0aGVcbiAqIHZhbHVlIGFuZCB0aGUgcmVzdCBvZiB0aGUgc3RyaW5nIHZpYSB0aGUgb3V0IHBhcmFtZXRlci5cbiAqL1xuZXhwb3J0cy5kZWNvZGUgPSBmdW5jdGlvbiBiYXNlNjRWTFFfZGVjb2RlKGFTdHIsIGFJbmRleCwgYU91dFBhcmFtKSB7XG4gIHZhciBzdHJMZW4gPSBhU3RyLmxlbmd0aDtcbiAgdmFyIHJlc3VsdCA9IDA7XG4gIHZhciBzaGlmdCA9IDA7XG4gIHZhciBjb250aW51YXRpb24sIGRpZ2l0O1xuXG4gIGRvIHtcbiAgICBpZiAoYUluZGV4ID49IHN0ckxlbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgbW9yZSBkaWdpdHMgaW4gYmFzZSA2NCBWTFEgdmFsdWUuXCIpO1xuICAgIH1cblxuICAgIGRpZ2l0ID0gYmFzZTY0LmRlY29kZShhU3RyLmNoYXJDb2RlQXQoYUluZGV4KyspKTtcbiAgICBpZiAoZGlnaXQgPT09IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGJhc2U2NCBkaWdpdDogXCIgKyBhU3RyLmNoYXJBdChhSW5kZXggLSAxKSk7XG4gICAgfVxuXG4gICAgY29udGludWF0aW9uID0gISEoZGlnaXQgJiBWTFFfQ09OVElOVUFUSU9OX0JJVCk7XG4gICAgZGlnaXQgJj0gVkxRX0JBU0VfTUFTSztcbiAgICByZXN1bHQgPSByZXN1bHQgKyAoZGlnaXQgPDwgc2hpZnQpO1xuICAgIHNoaWZ0ICs9IFZMUV9CQVNFX1NISUZUO1xuICB9IHdoaWxlIChjb250aW51YXRpb24pO1xuXG4gIGFPdXRQYXJhbS52YWx1ZSA9IGZyb21WTFFTaWduZWQocmVzdWx0KTtcbiAgYU91dFBhcmFtLnJlc3QgPSBhSW5kZXg7XG59O1xuIiwiLyogLSotIE1vZGU6IGpzOyBqcy1pbmRlbnQtbGV2ZWw6IDI7IC0qLSAqL1xuLypcbiAqIENvcHlyaWdodCAyMDExIE1vemlsbGEgRm91bmRhdGlvbiBhbmQgY29udHJpYnV0b3JzXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTmV3IEJTRCBsaWNlbnNlLiBTZWUgTElDRU5TRSBvcjpcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2VcbiAqL1xuXG52YXIgaW50VG9DaGFyTWFwID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nLnNwbGl0KCcnKTtcblxuLyoqXG4gKiBFbmNvZGUgYW4gaW50ZWdlciBpbiB0aGUgcmFuZ2Ugb2YgMCB0byA2MyB0byBhIHNpbmdsZSBiYXNlIDY0IGRpZ2l0LlxuICovXG5leHBvcnRzLmVuY29kZSA9IGZ1bmN0aW9uIChudW1iZXIpIHtcbiAgaWYgKDAgPD0gbnVtYmVyICYmIG51bWJlciA8IGludFRvQ2hhck1hcC5sZW5ndGgpIHtcbiAgICByZXR1cm4gaW50VG9DaGFyTWFwW251bWJlcl07XG4gIH1cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk11c3QgYmUgYmV0d2VlbiAwIGFuZCA2MzogXCIgKyBudW1iZXIpO1xufTtcblxuLyoqXG4gKiBEZWNvZGUgYSBzaW5nbGUgYmFzZSA2NCBjaGFyYWN0ZXIgY29kZSBkaWdpdCB0byBhbiBpbnRlZ2VyLiBSZXR1cm5zIC0xIG9uXG4gKiBmYWlsdXJlLlxuICovXG5leHBvcnRzLmRlY29kZSA9IGZ1bmN0aW9uIChjaGFyQ29kZSkge1xuICB2YXIgYmlnQSA9IDY1OyAgICAgLy8gJ0EnXG4gIHZhciBiaWdaID0gOTA7ICAgICAvLyAnWidcblxuICB2YXIgbGl0dGxlQSA9IDk3OyAgLy8gJ2EnXG4gIHZhciBsaXR0bGVaID0gMTIyOyAvLyAneidcblxuICB2YXIgemVybyA9IDQ4OyAgICAgLy8gJzAnXG4gIHZhciBuaW5lID0gNTc7ICAgICAvLyAnOSdcblxuICB2YXIgcGx1cyA9IDQzOyAgICAgLy8gJysnXG4gIHZhciBzbGFzaCA9IDQ3OyAgICAvLyAnLydcblxuICB2YXIgbGl0dGxlT2Zmc2V0ID0gMjY7XG4gIHZhciBudW1iZXJPZmZzZXQgPSA1MjtcblxuICAvLyAwIC0gMjU6IEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaXG4gIGlmIChiaWdBIDw9IGNoYXJDb2RlICYmIGNoYXJDb2RlIDw9IGJpZ1opIHtcbiAgICByZXR1cm4gKGNoYXJDb2RlIC0gYmlnQSk7XG4gIH1cblxuICAvLyAyNiAtIDUxOiBhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5elxuICBpZiAobGl0dGxlQSA8PSBjaGFyQ29kZSAmJiBjaGFyQ29kZSA8PSBsaXR0bGVaKSB7XG4gICAgcmV0dXJuIChjaGFyQ29kZSAtIGxpdHRsZUEgKyBsaXR0bGVPZmZzZXQpO1xuICB9XG5cbiAgLy8gNTIgLSA2MTogMDEyMzQ1Njc4OVxuICBpZiAoemVybyA8PSBjaGFyQ29kZSAmJiBjaGFyQ29kZSA8PSBuaW5lKSB7XG4gICAgcmV0dXJuIChjaGFyQ29kZSAtIHplcm8gKyBudW1iZXJPZmZzZXQpO1xuICB9XG5cbiAgLy8gNjI6ICtcbiAgaWYgKGNoYXJDb2RlID09IHBsdXMpIHtcbiAgICByZXR1cm4gNjI7XG4gIH1cblxuICAvLyA2MzogL1xuICBpZiAoY2hhckNvZGUgPT0gc2xhc2gpIHtcbiAgICByZXR1cm4gNjM7XG4gIH1cblxuICAvLyBJbnZhbGlkIGJhc2U2NCBkaWdpdC5cbiAgcmV0dXJuIC0xO1xufTtcbiIsIi8qIC0qLSBNb2RlOiBqczsganMtaW5kZW50LWxldmVsOiAyOyAtKi0gKi9cbi8qXG4gKiBDb3B5cmlnaHQgMjAxMSBNb3ppbGxhIEZvdW5kYXRpb24gYW5kIGNvbnRyaWJ1dG9yc1xuICogTGljZW5zZWQgdW5kZXIgdGhlIE5ldyBCU0QgbGljZW5zZS4gU2VlIExJQ0VOU0Ugb3I6XG4gKiBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvQlNELTMtQ2xhdXNlXG4gKi9cblxuZXhwb3J0cy5HUkVBVEVTVF9MT1dFUl9CT1VORCA9IDE7XG5leHBvcnRzLkxFQVNUX1VQUEVSX0JPVU5EID0gMjtcblxuLyoqXG4gKiBSZWN1cnNpdmUgaW1wbGVtZW50YXRpb24gb2YgYmluYXJ5IHNlYXJjaC5cbiAqXG4gKiBAcGFyYW0gYUxvdyBJbmRpY2VzIGhlcmUgYW5kIGxvd2VyIGRvIG5vdCBjb250YWluIHRoZSBuZWVkbGUuXG4gKiBAcGFyYW0gYUhpZ2ggSW5kaWNlcyBoZXJlIGFuZCBoaWdoZXIgZG8gbm90IGNvbnRhaW4gdGhlIG5lZWRsZS5cbiAqIEBwYXJhbSBhTmVlZGxlIFRoZSBlbGVtZW50IGJlaW5nIHNlYXJjaGVkIGZvci5cbiAqIEBwYXJhbSBhSGF5c3RhY2sgVGhlIG5vbi1lbXB0eSBhcnJheSBiZWluZyBzZWFyY2hlZC5cbiAqIEBwYXJhbSBhQ29tcGFyZSBGdW5jdGlvbiB3aGljaCB0YWtlcyB0d28gZWxlbWVudHMgYW5kIHJldHVybnMgLTEsIDAsIG9yIDEuXG4gKiBAcGFyYW0gYUJpYXMgRWl0aGVyICdiaW5hcnlTZWFyY2guR1JFQVRFU1RfTE9XRVJfQk9VTkQnIG9yXG4gKiAgICAgJ2JpbmFyeVNlYXJjaC5MRUFTVF9VUFBFUl9CT1VORCcuIFNwZWNpZmllcyB3aGV0aGVyIHRvIHJldHVybiB0aGVcbiAqICAgICBjbG9zZXN0IGVsZW1lbnQgdGhhdCBpcyBzbWFsbGVyIHRoYW4gb3IgZ3JlYXRlciB0aGFuIHRoZSBvbmUgd2UgYXJlXG4gKiAgICAgc2VhcmNoaW5nIGZvciwgcmVzcGVjdGl2ZWx5LCBpZiB0aGUgZXhhY3QgZWxlbWVudCBjYW5ub3QgYmUgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIHJlY3Vyc2l2ZVNlYXJjaChhTG93LCBhSGlnaCwgYU5lZWRsZSwgYUhheXN0YWNrLCBhQ29tcGFyZSwgYUJpYXMpIHtcbiAgLy8gVGhpcyBmdW5jdGlvbiB0ZXJtaW5hdGVzIHdoZW4gb25lIG9mIHRoZSBmb2xsb3dpbmcgaXMgdHJ1ZTpcbiAgLy9cbiAgLy8gICAxLiBXZSBmaW5kIHRoZSBleGFjdCBlbGVtZW50IHdlIGFyZSBsb29raW5nIGZvci5cbiAgLy9cbiAgLy8gICAyLiBXZSBkaWQgbm90IGZpbmQgdGhlIGV4YWN0IGVsZW1lbnQsIGJ1dCB3ZSBjYW4gcmV0dXJuIHRoZSBpbmRleCBvZlxuICAvLyAgICAgIHRoZSBuZXh0LWNsb3Nlc3QgZWxlbWVudC5cbiAgLy9cbiAgLy8gICAzLiBXZSBkaWQgbm90IGZpbmQgdGhlIGV4YWN0IGVsZW1lbnQsIGFuZCB0aGVyZSBpcyBubyBuZXh0LWNsb3Nlc3RcbiAgLy8gICAgICBlbGVtZW50IHRoYW4gdGhlIG9uZSB3ZSBhcmUgc2VhcmNoaW5nIGZvciwgc28gd2UgcmV0dXJuIC0xLlxuICB2YXIgbWlkID0gTWF0aC5mbG9vcigoYUhpZ2ggLSBhTG93KSAvIDIpICsgYUxvdztcbiAgdmFyIGNtcCA9IGFDb21wYXJlKGFOZWVkbGUsIGFIYXlzdGFja1ttaWRdLCB0cnVlKTtcbiAgaWYgKGNtcCA9PT0gMCkge1xuICAgIC8vIEZvdW5kIHRoZSBlbGVtZW50IHdlIGFyZSBsb29raW5nIGZvci5cbiAgICByZXR1cm4gbWlkO1xuICB9XG4gIGVsc2UgaWYgKGNtcCA+IDApIHtcbiAgICAvLyBPdXIgbmVlZGxlIGlzIGdyZWF0ZXIgdGhhbiBhSGF5c3RhY2tbbWlkXS5cbiAgICBpZiAoYUhpZ2ggLSBtaWQgPiAxKSB7XG4gICAgICAvLyBUaGUgZWxlbWVudCBpcyBpbiB0aGUgdXBwZXIgaGFsZi5cbiAgICAgIHJldHVybiByZWN1cnNpdmVTZWFyY2gobWlkLCBhSGlnaCwgYU5lZWRsZSwgYUhheXN0YWNrLCBhQ29tcGFyZSwgYUJpYXMpO1xuICAgIH1cblxuICAgIC8vIFRoZSBleGFjdCBuZWVkbGUgZWxlbWVudCB3YXMgbm90IGZvdW5kIGluIHRoaXMgaGF5c3RhY2suIERldGVybWluZSBpZlxuICAgIC8vIHdlIGFyZSBpbiB0ZXJtaW5hdGlvbiBjYXNlICgzKSBvciAoMikgYW5kIHJldHVybiB0aGUgYXBwcm9wcmlhdGUgdGhpbmcuXG4gICAgaWYgKGFCaWFzID09IGV4cG9ydHMuTEVBU1RfVVBQRVJfQk9VTkQpIHtcbiAgICAgIHJldHVybiBhSGlnaCA8IGFIYXlzdGFjay5sZW5ndGggPyBhSGlnaCA6IC0xO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbWlkO1xuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICAvLyBPdXIgbmVlZGxlIGlzIGxlc3MgdGhhbiBhSGF5c3RhY2tbbWlkXS5cbiAgICBpZiAobWlkIC0gYUxvdyA+IDEpIHtcbiAgICAgIC8vIFRoZSBlbGVtZW50IGlzIGluIHRoZSBsb3dlciBoYWxmLlxuICAgICAgcmV0dXJuIHJlY3Vyc2l2ZVNlYXJjaChhTG93LCBtaWQsIGFOZWVkbGUsIGFIYXlzdGFjaywgYUNvbXBhcmUsIGFCaWFzKTtcbiAgICB9XG5cbiAgICAvLyB3ZSBhcmUgaW4gdGVybWluYXRpb24gY2FzZSAoMykgb3IgKDIpIGFuZCByZXR1cm4gdGhlIGFwcHJvcHJpYXRlIHRoaW5nLlxuICAgIGlmIChhQmlhcyA9PSBleHBvcnRzLkxFQVNUX1VQUEVSX0JPVU5EKSB7XG4gICAgICByZXR1cm4gbWlkO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYUxvdyA8IDAgPyAtMSA6IGFMb3c7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVGhpcyBpcyBhbiBpbXBsZW1lbnRhdGlvbiBvZiBiaW5hcnkgc2VhcmNoIHdoaWNoIHdpbGwgYWx3YXlzIHRyeSBhbmQgcmV0dXJuXG4gKiB0aGUgaW5kZXggb2YgdGhlIGNsb3Nlc3QgZWxlbWVudCBpZiB0aGVyZSBpcyBubyBleGFjdCBoaXQuIFRoaXMgaXMgYmVjYXVzZVxuICogbWFwcGluZ3MgYmV0d2VlbiBvcmlnaW5hbCBhbmQgZ2VuZXJhdGVkIGxpbmUvY29sIHBhaXJzIGFyZSBzaW5nbGUgcG9pbnRzLFxuICogYW5kIHRoZXJlIGlzIGFuIGltcGxpY2l0IHJlZ2lvbiBiZXR3ZWVuIGVhY2ggb2YgdGhlbSwgc28gYSBtaXNzIGp1c3QgbWVhbnNcbiAqIHRoYXQgeW91IGFyZW4ndCBvbiB0aGUgdmVyeSBzdGFydCBvZiBhIHJlZ2lvbi5cbiAqXG4gKiBAcGFyYW0gYU5lZWRsZSBUaGUgZWxlbWVudCB5b3UgYXJlIGxvb2tpbmcgZm9yLlxuICogQHBhcmFtIGFIYXlzdGFjayBUaGUgYXJyYXkgdGhhdCBpcyBiZWluZyBzZWFyY2hlZC5cbiAqIEBwYXJhbSBhQ29tcGFyZSBBIGZ1bmN0aW9uIHdoaWNoIHRha2VzIHRoZSBuZWVkbGUgYW5kIGFuIGVsZW1lbnQgaW4gdGhlXG4gKiAgICAgYXJyYXkgYW5kIHJldHVybnMgLTEsIDAsIG9yIDEgZGVwZW5kaW5nIG9uIHdoZXRoZXIgdGhlIG5lZWRsZSBpcyBsZXNzXG4gKiAgICAgdGhhbiwgZXF1YWwgdG8sIG9yIGdyZWF0ZXIgdGhhbiB0aGUgZWxlbWVudCwgcmVzcGVjdGl2ZWx5LlxuICogQHBhcmFtIGFCaWFzIEVpdGhlciAnYmluYXJ5U2VhcmNoLkdSRUFURVNUX0xPV0VSX0JPVU5EJyBvclxuICogICAgICdiaW5hcnlTZWFyY2guTEVBU1RfVVBQRVJfQk9VTkQnLiBTcGVjaWZpZXMgd2hldGhlciB0byByZXR1cm4gdGhlXG4gKiAgICAgY2xvc2VzdCBlbGVtZW50IHRoYXQgaXMgc21hbGxlciB0aGFuIG9yIGdyZWF0ZXIgdGhhbiB0aGUgb25lIHdlIGFyZVxuICogICAgIHNlYXJjaGluZyBmb3IsIHJlc3BlY3RpdmVseSwgaWYgdGhlIGV4YWN0IGVsZW1lbnQgY2Fubm90IGJlIGZvdW5kLlxuICogICAgIERlZmF1bHRzIHRvICdiaW5hcnlTZWFyY2guR1JFQVRFU1RfTE9XRVJfQk9VTkQnLlxuICovXG5leHBvcnRzLnNlYXJjaCA9IGZ1bmN0aW9uIHNlYXJjaChhTmVlZGxlLCBhSGF5c3RhY2ssIGFDb21wYXJlLCBhQmlhcykge1xuICBpZiAoYUhheXN0YWNrLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gIHZhciBpbmRleCA9IHJlY3Vyc2l2ZVNlYXJjaCgtMSwgYUhheXN0YWNrLmxlbmd0aCwgYU5lZWRsZSwgYUhheXN0YWNrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYUNvbXBhcmUsIGFCaWFzIHx8IGV4cG9ydHMuR1JFQVRFU1RfTE9XRVJfQk9VTkQpO1xuICBpZiAoaW5kZXggPCAwKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgLy8gV2UgaGF2ZSBmb3VuZCBlaXRoZXIgdGhlIGV4YWN0IGVsZW1lbnQsIG9yIHRoZSBuZXh0LWNsb3Nlc3QgZWxlbWVudCB0aGFuXG4gIC8vIHRoZSBvbmUgd2UgYXJlIHNlYXJjaGluZyBmb3IuIEhvd2V2ZXIsIHRoZXJlIG1heSBiZSBtb3JlIHRoYW4gb25lIHN1Y2hcbiAgLy8gZWxlbWVudC4gTWFrZSBzdXJlIHdlIGFsd2F5cyByZXR1cm4gdGhlIHNtYWxsZXN0IG9mIHRoZXNlLlxuICB3aGlsZSAoaW5kZXggLSAxID49IDApIHtcbiAgICBpZiAoYUNvbXBhcmUoYUhheXN0YWNrW2luZGV4XSwgYUhheXN0YWNrW2luZGV4IC0gMV0sIHRydWUpICE9PSAwKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgLS1pbmRleDtcbiAgfVxuXG4gIHJldHVybiBpbmRleDtcbn07XG4iLCIvKiAtKi0gTW9kZToganM7IGpzLWluZGVudC1sZXZlbDogMjsgLSotICovXG4vKlxuICogQ29weXJpZ2h0IDIwMTQgTW96aWxsYSBGb3VuZGF0aW9uIGFuZCBjb250cmlidXRvcnNcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBOZXcgQlNEIGxpY2Vuc2UuIFNlZSBMSUNFTlNFIG9yOlxuICogaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL0JTRC0zLUNsYXVzZVxuICovXG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbi8qKlxuICogRGV0ZXJtaW5lIHdoZXRoZXIgbWFwcGluZ0IgaXMgYWZ0ZXIgbWFwcGluZ0Egd2l0aCByZXNwZWN0IHRvIGdlbmVyYXRlZFxuICogcG9zaXRpb24uXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlZFBvc2l0aW9uQWZ0ZXIobWFwcGluZ0EsIG1hcHBpbmdCKSB7XG4gIC8vIE9wdGltaXplZCBmb3IgbW9zdCBjb21tb24gY2FzZVxuICB2YXIgbGluZUEgPSBtYXBwaW5nQS5nZW5lcmF0ZWRMaW5lO1xuICB2YXIgbGluZUIgPSBtYXBwaW5nQi5nZW5lcmF0ZWRMaW5lO1xuICB2YXIgY29sdW1uQSA9IG1hcHBpbmdBLmdlbmVyYXRlZENvbHVtbjtcbiAgdmFyIGNvbHVtbkIgPSBtYXBwaW5nQi5nZW5lcmF0ZWRDb2x1bW47XG4gIHJldHVybiBsaW5lQiA+IGxpbmVBIHx8IGxpbmVCID09IGxpbmVBICYmIGNvbHVtbkIgPj0gY29sdW1uQSB8fFxuICAgICAgICAgdXRpbC5jb21wYXJlQnlHZW5lcmF0ZWRQb3NpdGlvbnNJbmZsYXRlZChtYXBwaW5nQSwgbWFwcGluZ0IpIDw9IDA7XG59XG5cbi8qKlxuICogQSBkYXRhIHN0cnVjdHVyZSB0byBwcm92aWRlIGEgc29ydGVkIHZpZXcgb2YgYWNjdW11bGF0ZWQgbWFwcGluZ3MgaW4gYVxuICogcGVyZm9ybWFuY2UgY29uc2Npb3VzIG1hbm5lci4gSXQgdHJhZGVzIGEgbmVnbGliYWJsZSBvdmVyaGVhZCBpbiBnZW5lcmFsXG4gKiBjYXNlIGZvciBhIGxhcmdlIHNwZWVkdXAgaW4gY2FzZSBvZiBtYXBwaW5ncyBiZWluZyBhZGRlZCBpbiBvcmRlci5cbiAqL1xuZnVuY3Rpb24gTWFwcGluZ0xpc3QoKSB7XG4gIHRoaXMuX2FycmF5ID0gW107XG4gIHRoaXMuX3NvcnRlZCA9IHRydWU7XG4gIC8vIFNlcnZlcyBhcyBpbmZpbXVtXG4gIHRoaXMuX2xhc3QgPSB7Z2VuZXJhdGVkTGluZTogLTEsIGdlbmVyYXRlZENvbHVtbjogMH07XG59XG5cbi8qKlxuICogSXRlcmF0ZSB0aHJvdWdoIGludGVybmFsIGl0ZW1zLiBUaGlzIG1ldGhvZCB0YWtlcyB0aGUgc2FtZSBhcmd1bWVudHMgdGhhdFxuICogYEFycmF5LnByb3RvdHlwZS5mb3JFYWNoYCB0YWtlcy5cbiAqXG4gKiBOT1RFOiBUaGUgb3JkZXIgb2YgdGhlIG1hcHBpbmdzIGlzIE5PVCBndWFyYW50ZWVkLlxuICovXG5NYXBwaW5nTGlzdC5wcm90b3R5cGUudW5zb3J0ZWRGb3JFYWNoID1cbiAgZnVuY3Rpb24gTWFwcGluZ0xpc3RfZm9yRWFjaChhQ2FsbGJhY2ssIGFUaGlzQXJnKSB7XG4gICAgdGhpcy5fYXJyYXkuZm9yRWFjaChhQ2FsbGJhY2ssIGFUaGlzQXJnKTtcbiAgfTtcblxuLyoqXG4gKiBBZGQgdGhlIGdpdmVuIHNvdXJjZSBtYXBwaW5nLlxuICpcbiAqIEBwYXJhbSBPYmplY3QgYU1hcHBpbmdcbiAqL1xuTWFwcGluZ0xpc3QucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIE1hcHBpbmdMaXN0X2FkZChhTWFwcGluZykge1xuICBpZiAoZ2VuZXJhdGVkUG9zaXRpb25BZnRlcih0aGlzLl9sYXN0LCBhTWFwcGluZykpIHtcbiAgICB0aGlzLl9sYXN0ID0gYU1hcHBpbmc7XG4gICAgdGhpcy5fYXJyYXkucHVzaChhTWFwcGluZyk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fc29ydGVkID0gZmFsc2U7XG4gICAgdGhpcy5fYXJyYXkucHVzaChhTWFwcGluZyk7XG4gIH1cbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmxhdCwgc29ydGVkIGFycmF5IG9mIG1hcHBpbmdzLiBUaGUgbWFwcGluZ3MgYXJlIHNvcnRlZCBieVxuICogZ2VuZXJhdGVkIHBvc2l0aW9uLlxuICpcbiAqIFdBUk5JTkc6IFRoaXMgbWV0aG9kIHJldHVybnMgaW50ZXJuYWwgZGF0YSB3aXRob3V0IGNvcHlpbmcsIGZvclxuICogcGVyZm9ybWFuY2UuIFRoZSByZXR1cm4gdmFsdWUgbXVzdCBOT1QgYmUgbXV0YXRlZCwgYW5kIHNob3VsZCBiZSB0cmVhdGVkIGFzXG4gKiBhbiBpbW11dGFibGUgYm9ycm93LiBJZiB5b3Ugd2FudCB0byB0YWtlIG93bmVyc2hpcCwgeW91IG11c3QgbWFrZSB5b3VyIG93blxuICogY29weS5cbiAqL1xuTWFwcGluZ0xpc3QucHJvdG90eXBlLnRvQXJyYXkgPSBmdW5jdGlvbiBNYXBwaW5nTGlzdF90b0FycmF5KCkge1xuICBpZiAoIXRoaXMuX3NvcnRlZCkge1xuICAgIHRoaXMuX2FycmF5LnNvcnQodXRpbC5jb21wYXJlQnlHZW5lcmF0ZWRQb3NpdGlvbnNJbmZsYXRlZCk7XG4gICAgdGhpcy5fc29ydGVkID0gdHJ1ZTtcbiAgfVxuICByZXR1cm4gdGhpcy5fYXJyYXk7XG59O1xuXG5leHBvcnRzLk1hcHBpbmdMaXN0ID0gTWFwcGluZ0xpc3Q7XG4iLCIvKiAtKi0gTW9kZToganM7IGpzLWluZGVudC1sZXZlbDogMjsgLSotICovXG4vKlxuICogQ29weXJpZ2h0IDIwMTEgTW96aWxsYSBGb3VuZGF0aW9uIGFuZCBjb250cmlidXRvcnNcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBOZXcgQlNEIGxpY2Vuc2UuIFNlZSBMSUNFTlNFIG9yOlxuICogaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL0JTRC0zLUNsYXVzZVxuICovXG5cbi8vIEl0IHR1cm5zIG91dCB0aGF0IHNvbWUgKG1vc3Q/KSBKYXZhU2NyaXB0IGVuZ2luZXMgZG9uJ3Qgc2VsZi1ob3N0XG4vLyBgQXJyYXkucHJvdG90eXBlLnNvcnRgLiBUaGlzIG1ha2VzIHNlbnNlIGJlY2F1c2UgQysrIHdpbGwgbGlrZWx5IHJlbWFpblxuLy8gZmFzdGVyIHRoYW4gSlMgd2hlbiBkb2luZyByYXcgQ1BVLWludGVuc2l2ZSBzb3J0aW5nLiBIb3dldmVyLCB3aGVuIHVzaW5nIGFcbi8vIGN1c3RvbSBjb21wYXJhdG9yIGZ1bmN0aW9uLCBjYWxsaW5nIGJhY2sgYW5kIGZvcnRoIGJldHdlZW4gdGhlIFZNJ3MgQysrIGFuZFxuLy8gSklUJ2QgSlMgaXMgcmF0aGVyIHNsb3cgKmFuZCogbG9zZXMgSklUIHR5cGUgaW5mb3JtYXRpb24sIHJlc3VsdGluZyBpblxuLy8gd29yc2UgZ2VuZXJhdGVkIGNvZGUgZm9yIHRoZSBjb21wYXJhdG9yIGZ1bmN0aW9uIHRoYW4gd291bGQgYmUgb3B0aW1hbC4gSW5cbi8vIGZhY3QsIHdoZW4gc29ydGluZyB3aXRoIGEgY29tcGFyYXRvciwgdGhlc2UgY29zdHMgb3V0d2VpZ2ggdGhlIGJlbmVmaXRzIG9mXG4vLyBzb3J0aW5nIGluIEMrKy4gQnkgdXNpbmcgb3VyIG93biBKUy1pbXBsZW1lbnRlZCBRdWljayBTb3J0IChiZWxvdyksIHdlIGdldFxuLy8gYSB+MzUwMG1zIG1lYW4gc3BlZWQtdXAgaW4gYGJlbmNoL2JlbmNoLmh0bWxgLlxuXG4vKipcbiAqIFN3YXAgdGhlIGVsZW1lbnRzIGluZGV4ZWQgYnkgYHhgIGFuZCBgeWAgaW4gdGhlIGFycmF5IGBhcnlgLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGFyeVxuICogICAgICAgIFRoZSBhcnJheS5cbiAqIEBwYXJhbSB7TnVtYmVyfSB4XG4gKiAgICAgICAgVGhlIGluZGV4IG9mIHRoZSBmaXJzdCBpdGVtLlxuICogQHBhcmFtIHtOdW1iZXJ9IHlcbiAqICAgICAgICBUaGUgaW5kZXggb2YgdGhlIHNlY29uZCBpdGVtLlxuICovXG5mdW5jdGlvbiBzd2FwKGFyeSwgeCwgeSkge1xuICB2YXIgdGVtcCA9IGFyeVt4XTtcbiAgYXJ5W3hdID0gYXJ5W3ldO1xuICBhcnlbeV0gPSB0ZW1wO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSByYW5kb20gaW50ZWdlciB3aXRoaW4gdGhlIHJhbmdlIGBsb3cgLi4gaGlnaGAgaW5jbHVzaXZlLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBsb3dcbiAqICAgICAgICBUaGUgbG93ZXIgYm91bmQgb24gdGhlIHJhbmdlLlxuICogQHBhcmFtIHtOdW1iZXJ9IGhpZ2hcbiAqICAgICAgICBUaGUgdXBwZXIgYm91bmQgb24gdGhlIHJhbmdlLlxuICovXG5mdW5jdGlvbiByYW5kb21JbnRJblJhbmdlKGxvdywgaGlnaCkge1xuICByZXR1cm4gTWF0aC5yb3VuZChsb3cgKyAoTWF0aC5yYW5kb20oKSAqIChoaWdoIC0gbG93KSkpO1xufVxuXG4vKipcbiAqIFRoZSBRdWljayBTb3J0IGFsZ29yaXRobS5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBhcnlcbiAqICAgICAgICBBbiBhcnJheSB0byBzb3J0LlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY29tcGFyYXRvclxuICogICAgICAgIEZ1bmN0aW9uIHRvIHVzZSB0byBjb21wYXJlIHR3byBpdGVtcy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBwXG4gKiAgICAgICAgU3RhcnQgaW5kZXggb2YgdGhlIGFycmF5XG4gKiBAcGFyYW0ge051bWJlcn0gclxuICogICAgICAgIEVuZCBpbmRleCBvZiB0aGUgYXJyYXlcbiAqL1xuZnVuY3Rpb24gZG9RdWlja1NvcnQoYXJ5LCBjb21wYXJhdG9yLCBwLCByKSB7XG4gIC8vIElmIG91ciBsb3dlciBib3VuZCBpcyBsZXNzIHRoYW4gb3VyIHVwcGVyIGJvdW5kLCB3ZSAoMSkgcGFydGl0aW9uIHRoZVxuICAvLyBhcnJheSBpbnRvIHR3byBwaWVjZXMgYW5kICgyKSByZWN1cnNlIG9uIGVhY2ggaGFsZi4gSWYgaXQgaXMgbm90LCB0aGlzIGlzXG4gIC8vIHRoZSBlbXB0eSBhcnJheSBhbmQgb3VyIGJhc2UgY2FzZS5cblxuICBpZiAocCA8IHIpIHtcbiAgICAvLyAoMSkgUGFydGl0aW9uaW5nLlxuICAgIC8vXG4gICAgLy8gVGhlIHBhcnRpdGlvbmluZyBjaG9vc2VzIGEgcGl2b3QgYmV0d2VlbiBgcGAgYW5kIGByYCBhbmQgbW92ZXMgYWxsXG4gICAgLy8gZWxlbWVudHMgdGhhdCBhcmUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHRoZSBwaXZvdCB0byB0aGUgYmVmb3JlIGl0LCBhbmRcbiAgICAvLyBhbGwgdGhlIGVsZW1lbnRzIHRoYXQgYXJlIGdyZWF0ZXIgdGhhbiBpdCBhZnRlciBpdC4gVGhlIGVmZmVjdCBpcyB0aGF0XG4gICAgLy8gb25jZSBwYXJ0aXRpb24gaXMgZG9uZSwgdGhlIHBpdm90IGlzIGluIHRoZSBleGFjdCBwbGFjZSBpdCB3aWxsIGJlIHdoZW5cbiAgICAvLyB0aGUgYXJyYXkgaXMgcHV0IGluIHNvcnRlZCBvcmRlciwgYW5kIGl0IHdpbGwgbm90IG5lZWQgdG8gYmUgbW92ZWRcbiAgICAvLyBhZ2Fpbi4gVGhpcyBydW5zIGluIE8obikgdGltZS5cblxuICAgIC8vIEFsd2F5cyBjaG9vc2UgYSByYW5kb20gcGl2b3Qgc28gdGhhdCBhbiBpbnB1dCBhcnJheSB3aGljaCBpcyByZXZlcnNlXG4gICAgLy8gc29ydGVkIGRvZXMgbm90IGNhdXNlIE8obl4yKSBydW5uaW5nIHRpbWUuXG4gICAgdmFyIHBpdm90SW5kZXggPSByYW5kb21JbnRJblJhbmdlKHAsIHIpO1xuICAgIHZhciBpID0gcCAtIDE7XG5cbiAgICBzd2FwKGFyeSwgcGl2b3RJbmRleCwgcik7XG4gICAgdmFyIHBpdm90ID0gYXJ5W3JdO1xuXG4gICAgLy8gSW1tZWRpYXRlbHkgYWZ0ZXIgYGpgIGlzIGluY3JlbWVudGVkIGluIHRoaXMgbG9vcCwgdGhlIGZvbGxvd2luZyBob2xkXG4gICAgLy8gdHJ1ZTpcbiAgICAvL1xuICAgIC8vICAgKiBFdmVyeSBlbGVtZW50IGluIGBhcnlbcCAuLiBpXWAgaXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHRoZSBwaXZvdC5cbiAgICAvL1xuICAgIC8vICAgKiBFdmVyeSBlbGVtZW50IGluIGBhcnlbaSsxIC4uIGotMV1gIGlzIGdyZWF0ZXIgdGhhbiB0aGUgcGl2b3QuXG4gICAgZm9yICh2YXIgaiA9IHA7IGogPCByOyBqKyspIHtcbiAgICAgIGlmIChjb21wYXJhdG9yKGFyeVtqXSwgcGl2b3QpIDw9IDApIHtcbiAgICAgICAgaSArPSAxO1xuICAgICAgICBzd2FwKGFyeSwgaSwgaik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3dhcChhcnksIGkgKyAxLCBqKTtcbiAgICB2YXIgcSA9IGkgKyAxO1xuXG4gICAgLy8gKDIpIFJlY3Vyc2Ugb24gZWFjaCBoYWxmLlxuXG4gICAgZG9RdWlja1NvcnQoYXJ5LCBjb21wYXJhdG9yLCBwLCBxIC0gMSk7XG4gICAgZG9RdWlja1NvcnQoYXJ5LCBjb21wYXJhdG9yLCBxICsgMSwgcik7XG4gIH1cbn1cblxuLyoqXG4gKiBTb3J0IHRoZSBnaXZlbiBhcnJheSBpbi1wbGFjZSB3aXRoIHRoZSBnaXZlbiBjb21wYXJhdG9yIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGFyeVxuICogICAgICAgIEFuIGFycmF5IHRvIHNvcnQuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjb21wYXJhdG9yXG4gKiAgICAgICAgRnVuY3Rpb24gdG8gdXNlIHRvIGNvbXBhcmUgdHdvIGl0ZW1zLlxuICovXG5leHBvcnRzLnF1aWNrU29ydCA9IGZ1bmN0aW9uIChhcnksIGNvbXBhcmF0b3IpIHtcbiAgZG9RdWlja1NvcnQoYXJ5LCBjb21wYXJhdG9yLCAwLCBhcnkubGVuZ3RoIC0gMSk7XG59O1xuIiwiLyogLSotIE1vZGU6IGpzOyBqcy1pbmRlbnQtbGV2ZWw6IDI7IC0qLSAqL1xuLypcbiAqIENvcHlyaWdodCAyMDExIE1vemlsbGEgRm91bmRhdGlvbiBhbmQgY29udHJpYnV0b3JzXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTmV3IEJTRCBsaWNlbnNlLiBTZWUgTElDRU5TRSBvcjpcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2VcbiAqL1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyIGJpbmFyeVNlYXJjaCA9IHJlcXVpcmUoJy4vYmluYXJ5LXNlYXJjaCcpO1xudmFyIEFycmF5U2V0ID0gcmVxdWlyZSgnLi9hcnJheS1zZXQnKS5BcnJheVNldDtcbnZhciBiYXNlNjRWTFEgPSByZXF1aXJlKCcuL2Jhc2U2NC12bHEnKTtcbnZhciBxdWlja1NvcnQgPSByZXF1aXJlKCcuL3F1aWNrLXNvcnQnKS5xdWlja1NvcnQ7XG5cbmZ1bmN0aW9uIFNvdXJjZU1hcENvbnN1bWVyKGFTb3VyY2VNYXApIHtcbiAgdmFyIHNvdXJjZU1hcCA9IGFTb3VyY2VNYXA7XG4gIGlmICh0eXBlb2YgYVNvdXJjZU1hcCA9PT0gJ3N0cmluZycpIHtcbiAgICBzb3VyY2VNYXAgPSBKU09OLnBhcnNlKGFTb3VyY2VNYXAucmVwbGFjZSgvXlxcKVxcXVxcfScvLCAnJykpO1xuICB9XG5cbiAgcmV0dXJuIHNvdXJjZU1hcC5zZWN0aW9ucyAhPSBudWxsXG4gICAgPyBuZXcgSW5kZXhlZFNvdXJjZU1hcENvbnN1bWVyKHNvdXJjZU1hcClcbiAgICA6IG5ldyBCYXNpY1NvdXJjZU1hcENvbnN1bWVyKHNvdXJjZU1hcCk7XG59XG5cblNvdXJjZU1hcENvbnN1bWVyLmZyb21Tb3VyY2VNYXAgPSBmdW5jdGlvbihhU291cmNlTWFwKSB7XG4gIHJldHVybiBCYXNpY1NvdXJjZU1hcENvbnN1bWVyLmZyb21Tb3VyY2VNYXAoYVNvdXJjZU1hcCk7XG59XG5cbi8qKlxuICogVGhlIHZlcnNpb24gb2YgdGhlIHNvdXJjZSBtYXBwaW5nIHNwZWMgdGhhdCB3ZSBhcmUgY29uc3VtaW5nLlxuICovXG5Tb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuX3ZlcnNpb24gPSAzO1xuXG4vLyBgX19nZW5lcmF0ZWRNYXBwaW5nc2AgYW5kIGBfX29yaWdpbmFsTWFwcGluZ3NgIGFyZSBhcnJheXMgdGhhdCBob2xkIHRoZVxuLy8gcGFyc2VkIG1hcHBpbmcgY29vcmRpbmF0ZXMgZnJvbSB0aGUgc291cmNlIG1hcCdzIFwibWFwcGluZ3NcIiBhdHRyaWJ1dGUuIFRoZXlcbi8vIGFyZSBsYXppbHkgaW5zdGFudGlhdGVkLCBhY2Nlc3NlZCB2aWEgdGhlIGBfZ2VuZXJhdGVkTWFwcGluZ3NgIGFuZFxuLy8gYF9vcmlnaW5hbE1hcHBpbmdzYCBnZXR0ZXJzIHJlc3BlY3RpdmVseSwgYW5kIHdlIG9ubHkgcGFyc2UgdGhlIG1hcHBpbmdzXG4vLyBhbmQgY3JlYXRlIHRoZXNlIGFycmF5cyBvbmNlIHF1ZXJpZWQgZm9yIGEgc291cmNlIGxvY2F0aW9uLiBXZSBqdW1wIHRocm91Z2hcbi8vIHRoZXNlIGhvb3BzIGJlY2F1c2UgdGhlcmUgY2FuIGJlIG1hbnkgdGhvdXNhbmRzIG9mIG1hcHBpbmdzLCBhbmQgcGFyc2luZ1xuLy8gdGhlbSBpcyBleHBlbnNpdmUsIHNvIHdlIG9ubHkgd2FudCB0byBkbyBpdCBpZiB3ZSBtdXN0LlxuLy9cbi8vIEVhY2ggb2JqZWN0IGluIHRoZSBhcnJheXMgaXMgb2YgdGhlIGZvcm06XG4vL1xuLy8gICAgIHtcbi8vICAgICAgIGdlbmVyYXRlZExpbmU6IFRoZSBsaW5lIG51bWJlciBpbiB0aGUgZ2VuZXJhdGVkIGNvZGUsXG4vLyAgICAgICBnZW5lcmF0ZWRDb2x1bW46IFRoZSBjb2x1bW4gbnVtYmVyIGluIHRoZSBnZW5lcmF0ZWQgY29kZSxcbi8vICAgICAgIHNvdXJjZTogVGhlIHBhdGggdG8gdGhlIG9yaWdpbmFsIHNvdXJjZSBmaWxlIHRoYXQgZ2VuZXJhdGVkIHRoaXNcbi8vICAgICAgICAgICAgICAgY2h1bmsgb2YgY29kZSxcbi8vICAgICAgIG9yaWdpbmFsTGluZTogVGhlIGxpbmUgbnVtYmVyIGluIHRoZSBvcmlnaW5hbCBzb3VyY2UgdGhhdFxuLy8gICAgICAgICAgICAgICAgICAgICBjb3JyZXNwb25kcyB0byB0aGlzIGNodW5rIG9mIGdlbmVyYXRlZCBjb2RlLFxuLy8gICAgICAgb3JpZ2luYWxDb2x1bW46IFRoZSBjb2x1bW4gbnVtYmVyIGluIHRoZSBvcmlnaW5hbCBzb3VyY2UgdGhhdFxuLy8gICAgICAgICAgICAgICAgICAgICAgIGNvcnJlc3BvbmRzIHRvIHRoaXMgY2h1bmsgb2YgZ2VuZXJhdGVkIGNvZGUsXG4vLyAgICAgICBuYW1lOiBUaGUgbmFtZSBvZiB0aGUgb3JpZ2luYWwgc3ltYm9sIHdoaWNoIGdlbmVyYXRlZCB0aGlzIGNodW5rIG9mXG4vLyAgICAgICAgICAgICBjb2RlLlxuLy8gICAgIH1cbi8vXG4vLyBBbGwgcHJvcGVydGllcyBleGNlcHQgZm9yIGBnZW5lcmF0ZWRMaW5lYCBhbmQgYGdlbmVyYXRlZENvbHVtbmAgY2FuIGJlXG4vLyBgbnVsbGAuXG4vL1xuLy8gYF9nZW5lcmF0ZWRNYXBwaW5nc2AgaXMgb3JkZXJlZCBieSB0aGUgZ2VuZXJhdGVkIHBvc2l0aW9ucy5cbi8vXG4vLyBgX29yaWdpbmFsTWFwcGluZ3NgIGlzIG9yZGVyZWQgYnkgdGhlIG9yaWdpbmFsIHBvc2l0aW9ucy5cblxuU291cmNlTWFwQ29uc3VtZXIucHJvdG90eXBlLl9fZ2VuZXJhdGVkTWFwcGluZ3MgPSBudWxsO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZSwgJ19nZW5lcmF0ZWRNYXBwaW5ncycsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLl9fZ2VuZXJhdGVkTWFwcGluZ3MpIHtcbiAgICAgIHRoaXMuX3BhcnNlTWFwcGluZ3ModGhpcy5fbWFwcGluZ3MsIHRoaXMuc291cmNlUm9vdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX19nZW5lcmF0ZWRNYXBwaW5ncztcbiAgfVxufSk7XG5cblNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZS5fX29yaWdpbmFsTWFwcGluZ3MgPSBudWxsO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZSwgJ19vcmlnaW5hbE1hcHBpbmdzJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuX19vcmlnaW5hbE1hcHBpbmdzKSB7XG4gICAgICB0aGlzLl9wYXJzZU1hcHBpbmdzKHRoaXMuX21hcHBpbmdzLCB0aGlzLnNvdXJjZVJvb3QpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9fb3JpZ2luYWxNYXBwaW5ncztcbiAgfVxufSk7XG5cblNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZS5fY2hhcklzTWFwcGluZ1NlcGFyYXRvciA9XG4gIGZ1bmN0aW9uIFNvdXJjZU1hcENvbnN1bWVyX2NoYXJJc01hcHBpbmdTZXBhcmF0b3IoYVN0ciwgaW5kZXgpIHtcbiAgICB2YXIgYyA9IGFTdHIuY2hhckF0KGluZGV4KTtcbiAgICByZXR1cm4gYyA9PT0gXCI7XCIgfHwgYyA9PT0gXCIsXCI7XG4gIH07XG5cbi8qKlxuICogUGFyc2UgdGhlIG1hcHBpbmdzIGluIGEgc3RyaW5nIGluIHRvIGEgZGF0YSBzdHJ1Y3R1cmUgd2hpY2ggd2UgY2FuIGVhc2lseVxuICogcXVlcnkgKHRoZSBvcmRlcmVkIGFycmF5cyBpbiB0aGUgYHRoaXMuX19nZW5lcmF0ZWRNYXBwaW5nc2AgYW5kXG4gKiBgdGhpcy5fX29yaWdpbmFsTWFwcGluZ3NgIHByb3BlcnRpZXMpLlxuICovXG5Tb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuX3BhcnNlTWFwcGluZ3MgPVxuICBmdW5jdGlvbiBTb3VyY2VNYXBDb25zdW1lcl9wYXJzZU1hcHBpbmdzKGFTdHIsIGFTb3VyY2VSb290KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiU3ViY2xhc3NlcyBtdXN0IGltcGxlbWVudCBfcGFyc2VNYXBwaW5nc1wiKTtcbiAgfTtcblxuU291cmNlTWFwQ29uc3VtZXIuR0VORVJBVEVEX09SREVSID0gMTtcblNvdXJjZU1hcENvbnN1bWVyLk9SSUdJTkFMX09SREVSID0gMjtcblxuU291cmNlTWFwQ29uc3VtZXIuR1JFQVRFU1RfTE9XRVJfQk9VTkQgPSAxO1xuU291cmNlTWFwQ29uc3VtZXIuTEVBU1RfVVBQRVJfQk9VTkQgPSAyO1xuXG4vKipcbiAqIEl0ZXJhdGUgb3ZlciBlYWNoIG1hcHBpbmcgYmV0d2VlbiBhbiBvcmlnaW5hbCBzb3VyY2UvbGluZS9jb2x1bW4gYW5kIGFcbiAqIGdlbmVyYXRlZCBsaW5lL2NvbHVtbiBpbiB0aGlzIHNvdXJjZSBtYXAuXG4gKlxuICogQHBhcmFtIEZ1bmN0aW9uIGFDYWxsYmFja1xuICogICAgICAgIFRoZSBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGVhY2ggbWFwcGluZy5cbiAqIEBwYXJhbSBPYmplY3QgYUNvbnRleHRcbiAqICAgICAgICBPcHRpb25hbC4gSWYgc3BlY2lmaWVkLCB0aGlzIG9iamVjdCB3aWxsIGJlIHRoZSB2YWx1ZSBvZiBgdGhpc2AgZXZlcnlcbiAqICAgICAgICB0aW1lIHRoYXQgYGFDYWxsYmFja2AgaXMgY2FsbGVkLlxuICogQHBhcmFtIGFPcmRlclxuICogICAgICAgIEVpdGhlciBgU291cmNlTWFwQ29uc3VtZXIuR0VORVJBVEVEX09SREVSYCBvclxuICogICAgICAgIGBTb3VyY2VNYXBDb25zdW1lci5PUklHSU5BTF9PUkRFUmAuIFNwZWNpZmllcyB3aGV0aGVyIHlvdSB3YW50IHRvXG4gKiAgICAgICAgaXRlcmF0ZSBvdmVyIHRoZSBtYXBwaW5ncyBzb3J0ZWQgYnkgdGhlIGdlbmVyYXRlZCBmaWxlJ3MgbGluZS9jb2x1bW5cbiAqICAgICAgICBvcmRlciBvciB0aGUgb3JpZ2luYWwncyBzb3VyY2UvbGluZS9jb2x1bW4gb3JkZXIsIHJlc3BlY3RpdmVseS4gRGVmYXVsdHMgdG9cbiAqICAgICAgICBgU291cmNlTWFwQ29uc3VtZXIuR0VORVJBVEVEX09SREVSYC5cbiAqL1xuU291cmNlTWFwQ29uc3VtZXIucHJvdG90eXBlLmVhY2hNYXBwaW5nID1cbiAgZnVuY3Rpb24gU291cmNlTWFwQ29uc3VtZXJfZWFjaE1hcHBpbmcoYUNhbGxiYWNrLCBhQ29udGV4dCwgYU9yZGVyKSB7XG4gICAgdmFyIGNvbnRleHQgPSBhQ29udGV4dCB8fCBudWxsO1xuICAgIHZhciBvcmRlciA9IGFPcmRlciB8fCBTb3VyY2VNYXBDb25zdW1lci5HRU5FUkFURURfT1JERVI7XG5cbiAgICB2YXIgbWFwcGluZ3M7XG4gICAgc3dpdGNoIChvcmRlcikge1xuICAgIGNhc2UgU291cmNlTWFwQ29uc3VtZXIuR0VORVJBVEVEX09SREVSOlxuICAgICAgbWFwcGluZ3MgPSB0aGlzLl9nZW5lcmF0ZWRNYXBwaW5ncztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgU291cmNlTWFwQ29uc3VtZXIuT1JJR0lOQUxfT1JERVI6XG4gICAgICBtYXBwaW5ncyA9IHRoaXMuX29yaWdpbmFsTWFwcGluZ3M7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBvcmRlciBvZiBpdGVyYXRpb24uXCIpO1xuICAgIH1cblxuICAgIHZhciBzb3VyY2VSb290ID0gdGhpcy5zb3VyY2VSb290O1xuICAgIG1hcHBpbmdzLm1hcChmdW5jdGlvbiAobWFwcGluZykge1xuICAgICAgdmFyIHNvdXJjZSA9IG1hcHBpbmcuc291cmNlID09PSBudWxsID8gbnVsbCA6IHRoaXMuX3NvdXJjZXMuYXQobWFwcGluZy5zb3VyY2UpO1xuICAgICAgaWYgKHNvdXJjZSAhPSBudWxsICYmIHNvdXJjZVJvb3QgIT0gbnVsbCkge1xuICAgICAgICBzb3VyY2UgPSB1dGlsLmpvaW4oc291cmNlUm9vdCwgc291cmNlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHNvdXJjZTogc291cmNlLFxuICAgICAgICBnZW5lcmF0ZWRMaW5lOiBtYXBwaW5nLmdlbmVyYXRlZExpbmUsXG4gICAgICAgIGdlbmVyYXRlZENvbHVtbjogbWFwcGluZy5nZW5lcmF0ZWRDb2x1bW4sXG4gICAgICAgIG9yaWdpbmFsTGluZTogbWFwcGluZy5vcmlnaW5hbExpbmUsXG4gICAgICAgIG9yaWdpbmFsQ29sdW1uOiBtYXBwaW5nLm9yaWdpbmFsQ29sdW1uLFxuICAgICAgICBuYW1lOiBtYXBwaW5nLm5hbWUgPT09IG51bGwgPyBudWxsIDogdGhpcy5fbmFtZXMuYXQobWFwcGluZy5uYW1lKVxuICAgICAgfTtcbiAgICB9LCB0aGlzKS5mb3JFYWNoKGFDYWxsYmFjaywgY29udGV4dCk7XG4gIH07XG5cbi8qKlxuICogUmV0dXJucyBhbGwgZ2VuZXJhdGVkIGxpbmUgYW5kIGNvbHVtbiBpbmZvcm1hdGlvbiBmb3IgdGhlIG9yaWdpbmFsIHNvdXJjZSxcbiAqIGxpbmUsIGFuZCBjb2x1bW4gcHJvdmlkZWQuIElmIG5vIGNvbHVtbiBpcyBwcm92aWRlZCwgcmV0dXJucyBhbGwgbWFwcGluZ3NcbiAqIGNvcnJlc3BvbmRpbmcgdG8gYSBlaXRoZXIgdGhlIGxpbmUgd2UgYXJlIHNlYXJjaGluZyBmb3Igb3IgdGhlIG5leHRcbiAqIGNsb3Nlc3QgbGluZSB0aGF0IGhhcyBhbnkgbWFwcGluZ3MuIE90aGVyd2lzZSwgcmV0dXJucyBhbGwgbWFwcGluZ3NcbiAqIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGdpdmVuIGxpbmUgYW5kIGVpdGhlciB0aGUgY29sdW1uIHdlIGFyZSBzZWFyY2hpbmcgZm9yXG4gKiBvciB0aGUgbmV4dCBjbG9zZXN0IGNvbHVtbiB0aGF0IGhhcyBhbnkgb2Zmc2V0cy5cbiAqXG4gKiBUaGUgb25seSBhcmd1bWVudCBpcyBhbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gKlxuICogICAtIHNvdXJjZTogVGhlIGZpbGVuYW1lIG9mIHRoZSBvcmlnaW5hbCBzb3VyY2UuXG4gKiAgIC0gbGluZTogVGhlIGxpbmUgbnVtYmVyIGluIHRoZSBvcmlnaW5hbCBzb3VyY2UuXG4gKiAgIC0gY29sdW1uOiBPcHRpb25hbC4gdGhlIGNvbHVtbiBudW1iZXIgaW4gdGhlIG9yaWdpbmFsIHNvdXJjZS5cbiAqXG4gKiBhbmQgYW4gYXJyYXkgb2Ygb2JqZWN0cyBpcyByZXR1cm5lZCwgZWFjaCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAqXG4gKiAgIC0gbGluZTogVGhlIGxpbmUgbnVtYmVyIGluIHRoZSBnZW5lcmF0ZWQgc291cmNlLCBvciBudWxsLlxuICogICAtIGNvbHVtbjogVGhlIGNvbHVtbiBudW1iZXIgaW4gdGhlIGdlbmVyYXRlZCBzb3VyY2UsIG9yIG51bGwuXG4gKi9cblNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZS5hbGxHZW5lcmF0ZWRQb3NpdGlvbnNGb3IgPVxuICBmdW5jdGlvbiBTb3VyY2VNYXBDb25zdW1lcl9hbGxHZW5lcmF0ZWRQb3NpdGlvbnNGb3IoYUFyZ3MpIHtcbiAgICB2YXIgbGluZSA9IHV0aWwuZ2V0QXJnKGFBcmdzLCAnbGluZScpO1xuXG4gICAgLy8gV2hlbiB0aGVyZSBpcyBubyBleGFjdCBtYXRjaCwgQmFzaWNTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuX2ZpbmRNYXBwaW5nXG4gICAgLy8gcmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIGNsb3Nlc3QgbWFwcGluZyBsZXNzIHRoYW4gdGhlIG5lZWRsZS4gQnlcbiAgICAvLyBzZXR0aW5nIG5lZWRsZS5vcmlnaW5hbENvbHVtbiB0byAwLCB3ZSB0aHVzIGZpbmQgdGhlIGxhc3QgbWFwcGluZyBmb3JcbiAgICAvLyB0aGUgZ2l2ZW4gbGluZSwgcHJvdmlkZWQgc3VjaCBhIG1hcHBpbmcgZXhpc3RzLlxuICAgIHZhciBuZWVkbGUgPSB7XG4gICAgICBzb3VyY2U6IHV0aWwuZ2V0QXJnKGFBcmdzLCAnc291cmNlJyksXG4gICAgICBvcmlnaW5hbExpbmU6IGxpbmUsXG4gICAgICBvcmlnaW5hbENvbHVtbjogdXRpbC5nZXRBcmcoYUFyZ3MsICdjb2x1bW4nLCAwKVxuICAgIH07XG5cbiAgICBpZiAodGhpcy5zb3VyY2VSb290ICE9IG51bGwpIHtcbiAgICAgIG5lZWRsZS5zb3VyY2UgPSB1dGlsLnJlbGF0aXZlKHRoaXMuc291cmNlUm9vdCwgbmVlZGxlLnNvdXJjZSk7XG4gICAgfVxuICAgIGlmICghdGhpcy5fc291cmNlcy5oYXMobmVlZGxlLnNvdXJjZSkpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgbmVlZGxlLnNvdXJjZSA9IHRoaXMuX3NvdXJjZXMuaW5kZXhPZihuZWVkbGUuc291cmNlKTtcblxuICAgIHZhciBtYXBwaW5ncyA9IFtdO1xuXG4gICAgdmFyIGluZGV4ID0gdGhpcy5fZmluZE1hcHBpbmcobmVlZGxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX29yaWdpbmFsTWFwcGluZ3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJvcmlnaW5hbExpbmVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm9yaWdpbmFsQ29sdW1uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXRpbC5jb21wYXJlQnlPcmlnaW5hbFBvc2l0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaW5hcnlTZWFyY2guTEVBU1RfVVBQRVJfQk9VTkQpO1xuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICB2YXIgbWFwcGluZyA9IHRoaXMuX29yaWdpbmFsTWFwcGluZ3NbaW5kZXhdO1xuXG4gICAgICBpZiAoYUFyZ3MuY29sdW1uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIG9yaWdpbmFsTGluZSA9IG1hcHBpbmcub3JpZ2luYWxMaW5lO1xuXG4gICAgICAgIC8vIEl0ZXJhdGUgdW50aWwgZWl0aGVyIHdlIHJ1biBvdXQgb2YgbWFwcGluZ3MsIG9yIHdlIHJ1biBpbnRvXG4gICAgICAgIC8vIGEgbWFwcGluZyBmb3IgYSBkaWZmZXJlbnQgbGluZSB0aGFuIHRoZSBvbmUgd2UgZm91bmQuIFNpbmNlXG4gICAgICAgIC8vIG1hcHBpbmdzIGFyZSBzb3J0ZWQsIHRoaXMgaXMgZ3VhcmFudGVlZCB0byBmaW5kIGFsbCBtYXBwaW5ncyBmb3JcbiAgICAgICAgLy8gdGhlIGxpbmUgd2UgZm91bmQuXG4gICAgICAgIHdoaWxlIChtYXBwaW5nICYmIG1hcHBpbmcub3JpZ2luYWxMaW5lID09PSBvcmlnaW5hbExpbmUpIHtcbiAgICAgICAgICBtYXBwaW5ncy5wdXNoKHtcbiAgICAgICAgICAgIGxpbmU6IHV0aWwuZ2V0QXJnKG1hcHBpbmcsICdnZW5lcmF0ZWRMaW5lJywgbnVsbCksXG4gICAgICAgICAgICBjb2x1bW46IHV0aWwuZ2V0QXJnKG1hcHBpbmcsICdnZW5lcmF0ZWRDb2x1bW4nLCBudWxsKSxcbiAgICAgICAgICAgIGxhc3RDb2x1bW46IHV0aWwuZ2V0QXJnKG1hcHBpbmcsICdsYXN0R2VuZXJhdGVkQ29sdW1uJywgbnVsbClcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIG1hcHBpbmcgPSB0aGlzLl9vcmlnaW5hbE1hcHBpbmdzWysraW5kZXhdO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgb3JpZ2luYWxDb2x1bW4gPSBtYXBwaW5nLm9yaWdpbmFsQ29sdW1uO1xuXG4gICAgICAgIC8vIEl0ZXJhdGUgdW50aWwgZWl0aGVyIHdlIHJ1biBvdXQgb2YgbWFwcGluZ3MsIG9yIHdlIHJ1biBpbnRvXG4gICAgICAgIC8vIGEgbWFwcGluZyBmb3IgYSBkaWZmZXJlbnQgbGluZSB0aGFuIHRoZSBvbmUgd2Ugd2VyZSBzZWFyY2hpbmcgZm9yLlxuICAgICAgICAvLyBTaW5jZSBtYXBwaW5ncyBhcmUgc29ydGVkLCB0aGlzIGlzIGd1YXJhbnRlZWQgdG8gZmluZCBhbGwgbWFwcGluZ3MgZm9yXG4gICAgICAgIC8vIHRoZSBsaW5lIHdlIGFyZSBzZWFyY2hpbmcgZm9yLlxuICAgICAgICB3aGlsZSAobWFwcGluZyAmJlxuICAgICAgICAgICAgICAgbWFwcGluZy5vcmlnaW5hbExpbmUgPT09IGxpbmUgJiZcbiAgICAgICAgICAgICAgIG1hcHBpbmcub3JpZ2luYWxDb2x1bW4gPT0gb3JpZ2luYWxDb2x1bW4pIHtcbiAgICAgICAgICBtYXBwaW5ncy5wdXNoKHtcbiAgICAgICAgICAgIGxpbmU6IHV0aWwuZ2V0QXJnKG1hcHBpbmcsICdnZW5lcmF0ZWRMaW5lJywgbnVsbCksXG4gICAgICAgICAgICBjb2x1bW46IHV0aWwuZ2V0QXJnKG1hcHBpbmcsICdnZW5lcmF0ZWRDb2x1bW4nLCBudWxsKSxcbiAgICAgICAgICAgIGxhc3RDb2x1bW46IHV0aWwuZ2V0QXJnKG1hcHBpbmcsICdsYXN0R2VuZXJhdGVkQ29sdW1uJywgbnVsbClcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIG1hcHBpbmcgPSB0aGlzLl9vcmlnaW5hbE1hcHBpbmdzWysraW5kZXhdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hcHBpbmdzO1xuICB9O1xuXG5leHBvcnRzLlNvdXJjZU1hcENvbnN1bWVyID0gU291cmNlTWFwQ29uc3VtZXI7XG5cbi8qKlxuICogQSBCYXNpY1NvdXJjZU1hcENvbnN1bWVyIGluc3RhbmNlIHJlcHJlc2VudHMgYSBwYXJzZWQgc291cmNlIG1hcCB3aGljaCB3ZSBjYW5cbiAqIHF1ZXJ5IGZvciBpbmZvcm1hdGlvbiBhYm91dCB0aGUgb3JpZ2luYWwgZmlsZSBwb3NpdGlvbnMgYnkgZ2l2aW5nIGl0IGEgZmlsZVxuICogcG9zaXRpb24gaW4gdGhlIGdlbmVyYXRlZCBzb3VyY2UuXG4gKlxuICogVGhlIG9ubHkgcGFyYW1ldGVyIGlzIHRoZSByYXcgc291cmNlIG1hcCAoZWl0aGVyIGFzIGEgSlNPTiBzdHJpbmcsIG9yXG4gKiBhbHJlYWR5IHBhcnNlZCB0byBhbiBvYmplY3QpLiBBY2NvcmRpbmcgdG8gdGhlIHNwZWMsIHNvdXJjZSBtYXBzIGhhdmUgdGhlXG4gKiBmb2xsb3dpbmcgYXR0cmlidXRlczpcbiAqXG4gKiAgIC0gdmVyc2lvbjogV2hpY2ggdmVyc2lvbiBvZiB0aGUgc291cmNlIG1hcCBzcGVjIHRoaXMgbWFwIGlzIGZvbGxvd2luZy5cbiAqICAgLSBzb3VyY2VzOiBBbiBhcnJheSBvZiBVUkxzIHRvIHRoZSBvcmlnaW5hbCBzb3VyY2UgZmlsZXMuXG4gKiAgIC0gbmFtZXM6IEFuIGFycmF5IG9mIGlkZW50aWZpZXJzIHdoaWNoIGNhbiBiZSByZWZlcnJlbmNlZCBieSBpbmRpdmlkdWFsIG1hcHBpbmdzLlxuICogICAtIHNvdXJjZVJvb3Q6IE9wdGlvbmFsLiBUaGUgVVJMIHJvb3QgZnJvbSB3aGljaCBhbGwgc291cmNlcyBhcmUgcmVsYXRpdmUuXG4gKiAgIC0gc291cmNlc0NvbnRlbnQ6IE9wdGlvbmFsLiBBbiBhcnJheSBvZiBjb250ZW50cyBvZiB0aGUgb3JpZ2luYWwgc291cmNlIGZpbGVzLlxuICogICAtIG1hcHBpbmdzOiBBIHN0cmluZyBvZiBiYXNlNjQgVkxRcyB3aGljaCBjb250YWluIHRoZSBhY3R1YWwgbWFwcGluZ3MuXG4gKiAgIC0gZmlsZTogT3B0aW9uYWwuIFRoZSBnZW5lcmF0ZWQgZmlsZSB0aGlzIHNvdXJjZSBtYXAgaXMgYXNzb2NpYXRlZCB3aXRoLlxuICpcbiAqIEhlcmUgaXMgYW4gZXhhbXBsZSBzb3VyY2UgbWFwLCB0YWtlbiBmcm9tIHRoZSBzb3VyY2UgbWFwIHNwZWNbMF06XG4gKlxuICogICAgIHtcbiAqICAgICAgIHZlcnNpb24gOiAzLFxuICogICAgICAgZmlsZTogXCJvdXQuanNcIixcbiAqICAgICAgIHNvdXJjZVJvb3QgOiBcIlwiLFxuICogICAgICAgc291cmNlczogW1wiZm9vLmpzXCIsIFwiYmFyLmpzXCJdLFxuICogICAgICAgbmFtZXM6IFtcInNyY1wiLCBcIm1hcHNcIiwgXCJhcmVcIiwgXCJmdW5cIl0sXG4gKiAgICAgICBtYXBwaW5nczogXCJBQSxBQjs7QUJDREU7XCJcbiAqICAgICB9XG4gKlxuICogWzBdOiBodHRwczovL2RvY3MuZ29vZ2xlLmNvbS9kb2N1bWVudC9kLzFVMVJHQWVoUXdSeXBVVG92RjFLUmxwaU9GemUwYi1fMmdjNmZBSDBLWTBrL2VkaXQ/cGxpPTEjXG4gKi9cbmZ1bmN0aW9uIEJhc2ljU291cmNlTWFwQ29uc3VtZXIoYVNvdXJjZU1hcCkge1xuICB2YXIgc291cmNlTWFwID0gYVNvdXJjZU1hcDtcbiAgaWYgKHR5cGVvZiBhU291cmNlTWFwID09PSAnc3RyaW5nJykge1xuICAgIHNvdXJjZU1hcCA9IEpTT04ucGFyc2UoYVNvdXJjZU1hcC5yZXBsYWNlKC9eXFwpXFxdXFx9Jy8sICcnKSk7XG4gIH1cblxuICB2YXIgdmVyc2lvbiA9IHV0aWwuZ2V0QXJnKHNvdXJjZU1hcCwgJ3ZlcnNpb24nKTtcbiAgdmFyIHNvdXJjZXMgPSB1dGlsLmdldEFyZyhzb3VyY2VNYXAsICdzb3VyY2VzJyk7XG4gIC8vIFNhc3MgMy4zIGxlYXZlcyBvdXQgdGhlICduYW1lcycgYXJyYXksIHNvIHdlIGRldmlhdGUgZnJvbSB0aGUgc3BlYyAod2hpY2hcbiAgLy8gcmVxdWlyZXMgdGhlIGFycmF5KSB0byBwbGF5IG5pY2UgaGVyZS5cbiAgdmFyIG5hbWVzID0gdXRpbC5nZXRBcmcoc291cmNlTWFwLCAnbmFtZXMnLCBbXSk7XG4gIHZhciBzb3VyY2VSb290ID0gdXRpbC5nZXRBcmcoc291cmNlTWFwLCAnc291cmNlUm9vdCcsIG51bGwpO1xuICB2YXIgc291cmNlc0NvbnRlbnQgPSB1dGlsLmdldEFyZyhzb3VyY2VNYXAsICdzb3VyY2VzQ29udGVudCcsIG51bGwpO1xuICB2YXIgbWFwcGluZ3MgPSB1dGlsLmdldEFyZyhzb3VyY2VNYXAsICdtYXBwaW5ncycpO1xuICB2YXIgZmlsZSA9IHV0aWwuZ2V0QXJnKHNvdXJjZU1hcCwgJ2ZpbGUnLCBudWxsKTtcblxuICAvLyBPbmNlIGFnYWluLCBTYXNzIGRldmlhdGVzIGZyb20gdGhlIHNwZWMgYW5kIHN1cHBsaWVzIHRoZSB2ZXJzaW9uIGFzIGFcbiAgLy8gc3RyaW5nIHJhdGhlciB0aGFuIGEgbnVtYmVyLCBzbyB3ZSB1c2UgbG9vc2UgZXF1YWxpdHkgY2hlY2tpbmcgaGVyZS5cbiAgaWYgKHZlcnNpb24gIT0gdGhpcy5fdmVyc2lvbikge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgdmVyc2lvbjogJyArIHZlcnNpb24pO1xuICB9XG5cbiAgc291cmNlcyA9IHNvdXJjZXNcbiAgICAubWFwKFN0cmluZylcbiAgICAvLyBTb21lIHNvdXJjZSBtYXBzIHByb2R1Y2UgcmVsYXRpdmUgc291cmNlIHBhdGhzIGxpa2UgXCIuL2Zvby5qc1wiIGluc3RlYWQgb2ZcbiAgICAvLyBcImZvby5qc1wiLiAgTm9ybWFsaXplIHRoZXNlIGZpcnN0IHNvIHRoYXQgZnV0dXJlIGNvbXBhcmlzb25zIHdpbGwgc3VjY2VlZC5cbiAgICAvLyBTZWUgYnVnemlsLmxhLzEwOTA3NjguXG4gICAgLm1hcCh1dGlsLm5vcm1hbGl6ZSlcbiAgICAvLyBBbHdheXMgZW5zdXJlIHRoYXQgYWJzb2x1dGUgc291cmNlcyBhcmUgaW50ZXJuYWxseSBzdG9yZWQgcmVsYXRpdmUgdG9cbiAgICAvLyB0aGUgc291cmNlIHJvb3QsIGlmIHRoZSBzb3VyY2Ugcm9vdCBpcyBhYnNvbHV0ZS4gTm90IGRvaW5nIHRoaXMgd291bGRcbiAgICAvLyBiZSBwYXJ0aWN1bGFybHkgcHJvYmxlbWF0aWMgd2hlbiB0aGUgc291cmNlIHJvb3QgaXMgYSBwcmVmaXggb2YgdGhlXG4gICAgLy8gc291cmNlICh2YWxpZCwgYnV0IHdoeT8/KS4gU2VlIGdpdGh1YiBpc3N1ZSAjMTk5IGFuZCBidWd6aWwubGEvMTE4ODk4Mi5cbiAgICAubWFwKGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICAgIHJldHVybiBzb3VyY2VSb290ICYmIHV0aWwuaXNBYnNvbHV0ZShzb3VyY2VSb290KSAmJiB1dGlsLmlzQWJzb2x1dGUoc291cmNlKVxuICAgICAgICA/IHV0aWwucmVsYXRpdmUoc291cmNlUm9vdCwgc291cmNlKVxuICAgICAgICA6IHNvdXJjZTtcbiAgICB9KTtcblxuICAvLyBQYXNzIGB0cnVlYCBiZWxvdyB0byBhbGxvdyBkdXBsaWNhdGUgbmFtZXMgYW5kIHNvdXJjZXMuIFdoaWxlIHNvdXJjZSBtYXBzXG4gIC8vIGFyZSBpbnRlbmRlZCB0byBiZSBjb21wcmVzc2VkIGFuZCBkZWR1cGxpY2F0ZWQsIHRoZSBUeXBlU2NyaXB0IGNvbXBpbGVyXG4gIC8vIHNvbWV0aW1lcyBnZW5lcmF0ZXMgc291cmNlIG1hcHMgd2l0aCBkdXBsaWNhdGVzIGluIHRoZW0uIFNlZSBHaXRodWIgaXNzdWVcbiAgLy8gIzcyIGFuZCBidWd6aWwubGEvODg5NDkyLlxuICB0aGlzLl9uYW1lcyA9IEFycmF5U2V0LmZyb21BcnJheShuYW1lcy5tYXAoU3RyaW5nKSwgdHJ1ZSk7XG4gIHRoaXMuX3NvdXJjZXMgPSBBcnJheVNldC5mcm9tQXJyYXkoc291cmNlcywgdHJ1ZSk7XG5cbiAgdGhpcy5zb3VyY2VSb290ID0gc291cmNlUm9vdDtcbiAgdGhpcy5zb3VyY2VzQ29udGVudCA9IHNvdXJjZXNDb250ZW50O1xuICB0aGlzLl9tYXBwaW5ncyA9IG1hcHBpbmdzO1xuICB0aGlzLmZpbGUgPSBmaWxlO1xufVxuXG5CYXNpY1NvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU291cmNlTWFwQ29uc3VtZXIucHJvdG90eXBlKTtcbkJhc2ljU291cmNlTWFwQ29uc3VtZXIucHJvdG90eXBlLmNvbnN1bWVyID0gU291cmNlTWFwQ29uc3VtZXI7XG5cbi8qKlxuICogQ3JlYXRlIGEgQmFzaWNTb3VyY2VNYXBDb25zdW1lciBmcm9tIGEgU291cmNlTWFwR2VuZXJhdG9yLlxuICpcbiAqIEBwYXJhbSBTb3VyY2VNYXBHZW5lcmF0b3IgYVNvdXJjZU1hcFxuICogICAgICAgIFRoZSBzb3VyY2UgbWFwIHRoYXQgd2lsbCBiZSBjb25zdW1lZC5cbiAqIEByZXR1cm5zIEJhc2ljU291cmNlTWFwQ29uc3VtZXJcbiAqL1xuQmFzaWNTb3VyY2VNYXBDb25zdW1lci5mcm9tU291cmNlTWFwID1cbiAgZnVuY3Rpb24gU291cmNlTWFwQ29uc3VtZXJfZnJvbVNvdXJjZU1hcChhU291cmNlTWFwKSB7XG4gICAgdmFyIHNtYyA9IE9iamVjdC5jcmVhdGUoQmFzaWNTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUpO1xuXG4gICAgdmFyIG5hbWVzID0gc21jLl9uYW1lcyA9IEFycmF5U2V0LmZyb21BcnJheShhU291cmNlTWFwLl9uYW1lcy50b0FycmF5KCksIHRydWUpO1xuICAgIHZhciBzb3VyY2VzID0gc21jLl9zb3VyY2VzID0gQXJyYXlTZXQuZnJvbUFycmF5KGFTb3VyY2VNYXAuX3NvdXJjZXMudG9BcnJheSgpLCB0cnVlKTtcbiAgICBzbWMuc291cmNlUm9vdCA9IGFTb3VyY2VNYXAuX3NvdXJjZVJvb3Q7XG4gICAgc21jLnNvdXJjZXNDb250ZW50ID0gYVNvdXJjZU1hcC5fZ2VuZXJhdGVTb3VyY2VzQ29udGVudChzbWMuX3NvdXJjZXMudG9BcnJheSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc21jLnNvdXJjZVJvb3QpO1xuICAgIHNtYy5maWxlID0gYVNvdXJjZU1hcC5fZmlsZTtcblxuICAgIC8vIEJlY2F1c2Ugd2UgYXJlIG1vZGlmeWluZyB0aGUgZW50cmllcyAoYnkgY29udmVydGluZyBzdHJpbmcgc291cmNlcyBhbmRcbiAgICAvLyBuYW1lcyB0byBpbmRpY2VzIGludG8gdGhlIHNvdXJjZXMgYW5kIG5hbWVzIEFycmF5U2V0cyksIHdlIGhhdmUgdG8gbWFrZVxuICAgIC8vIGEgY29weSBvZiB0aGUgZW50cnkgb3IgZWxzZSBiYWQgdGhpbmdzIGhhcHBlbi4gU2hhcmVkIG11dGFibGUgc3RhdGVcbiAgICAvLyBzdHJpa2VzIGFnYWluISBTZWUgZ2l0aHViIGlzc3VlICMxOTEuXG5cbiAgICB2YXIgZ2VuZXJhdGVkTWFwcGluZ3MgPSBhU291cmNlTWFwLl9tYXBwaW5ncy50b0FycmF5KCkuc2xpY2UoKTtcbiAgICB2YXIgZGVzdEdlbmVyYXRlZE1hcHBpbmdzID0gc21jLl9fZ2VuZXJhdGVkTWFwcGluZ3MgPSBbXTtcbiAgICB2YXIgZGVzdE9yaWdpbmFsTWFwcGluZ3MgPSBzbWMuX19vcmlnaW5hbE1hcHBpbmdzID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gZ2VuZXJhdGVkTWFwcGluZ3MubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzcmNNYXBwaW5nID0gZ2VuZXJhdGVkTWFwcGluZ3NbaV07XG4gICAgICB2YXIgZGVzdE1hcHBpbmcgPSBuZXcgTWFwcGluZztcbiAgICAgIGRlc3RNYXBwaW5nLmdlbmVyYXRlZExpbmUgPSBzcmNNYXBwaW5nLmdlbmVyYXRlZExpbmU7XG4gICAgICBkZXN0TWFwcGluZy5nZW5lcmF0ZWRDb2x1bW4gPSBzcmNNYXBwaW5nLmdlbmVyYXRlZENvbHVtbjtcblxuICAgICAgaWYgKHNyY01hcHBpbmcuc291cmNlKSB7XG4gICAgICAgIGRlc3RNYXBwaW5nLnNvdXJjZSA9IHNvdXJjZXMuaW5kZXhPZihzcmNNYXBwaW5nLnNvdXJjZSk7XG4gICAgICAgIGRlc3RNYXBwaW5nLm9yaWdpbmFsTGluZSA9IHNyY01hcHBpbmcub3JpZ2luYWxMaW5lO1xuICAgICAgICBkZXN0TWFwcGluZy5vcmlnaW5hbENvbHVtbiA9IHNyY01hcHBpbmcub3JpZ2luYWxDb2x1bW47XG5cbiAgICAgICAgaWYgKHNyY01hcHBpbmcubmFtZSkge1xuICAgICAgICAgIGRlc3RNYXBwaW5nLm5hbWUgPSBuYW1lcy5pbmRleE9mKHNyY01hcHBpbmcubmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBkZXN0T3JpZ2luYWxNYXBwaW5ncy5wdXNoKGRlc3RNYXBwaW5nKTtcbiAgICAgIH1cblxuICAgICAgZGVzdEdlbmVyYXRlZE1hcHBpbmdzLnB1c2goZGVzdE1hcHBpbmcpO1xuICAgIH1cblxuICAgIHF1aWNrU29ydChzbWMuX19vcmlnaW5hbE1hcHBpbmdzLCB1dGlsLmNvbXBhcmVCeU9yaWdpbmFsUG9zaXRpb25zKTtcblxuICAgIHJldHVybiBzbWM7XG4gIH07XG5cbi8qKlxuICogVGhlIHZlcnNpb24gb2YgdGhlIHNvdXJjZSBtYXBwaW5nIHNwZWMgdGhhdCB3ZSBhcmUgY29uc3VtaW5nLlxuICovXG5CYXNpY1NvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZS5fdmVyc2lvbiA9IDM7XG5cbi8qKlxuICogVGhlIGxpc3Qgb2Ygb3JpZ2luYWwgc291cmNlcy5cbiAqL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJhc2ljU291cmNlTWFwQ29uc3VtZXIucHJvdG90eXBlLCAnc291cmNlcycsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NvdXJjZXMudG9BcnJheSgpLm1hcChmdW5jdGlvbiAocykge1xuICAgICAgcmV0dXJuIHRoaXMuc291cmNlUm9vdCAhPSBudWxsID8gdXRpbC5qb2luKHRoaXMuc291cmNlUm9vdCwgcykgOiBzO1xuICAgIH0sIHRoaXMpO1xuICB9XG59KTtcblxuLyoqXG4gKiBQcm92aWRlIHRoZSBKSVQgd2l0aCBhIG5pY2Ugc2hhcGUgLyBoaWRkZW4gY2xhc3MuXG4gKi9cbmZ1bmN0aW9uIE1hcHBpbmcoKSB7XG4gIHRoaXMuZ2VuZXJhdGVkTGluZSA9IDA7XG4gIHRoaXMuZ2VuZXJhdGVkQ29sdW1uID0gMDtcbiAgdGhpcy5zb3VyY2UgPSBudWxsO1xuICB0aGlzLm9yaWdpbmFsTGluZSA9IG51bGw7XG4gIHRoaXMub3JpZ2luYWxDb2x1bW4gPSBudWxsO1xuICB0aGlzLm5hbWUgPSBudWxsO1xufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBtYXBwaW5ncyBpbiBhIHN0cmluZyBpbiB0byBhIGRhdGEgc3RydWN0dXJlIHdoaWNoIHdlIGNhbiBlYXNpbHlcbiAqIHF1ZXJ5ICh0aGUgb3JkZXJlZCBhcnJheXMgaW4gdGhlIGB0aGlzLl9fZ2VuZXJhdGVkTWFwcGluZ3NgIGFuZFxuICogYHRoaXMuX19vcmlnaW5hbE1hcHBpbmdzYCBwcm9wZXJ0aWVzKS5cbiAqL1xuQmFzaWNTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuX3BhcnNlTWFwcGluZ3MgPVxuICBmdW5jdGlvbiBTb3VyY2VNYXBDb25zdW1lcl9wYXJzZU1hcHBpbmdzKGFTdHIsIGFTb3VyY2VSb290KSB7XG4gICAgdmFyIGdlbmVyYXRlZExpbmUgPSAxO1xuICAgIHZhciBwcmV2aW91c0dlbmVyYXRlZENvbHVtbiA9IDA7XG4gICAgdmFyIHByZXZpb3VzT3JpZ2luYWxMaW5lID0gMDtcbiAgICB2YXIgcHJldmlvdXNPcmlnaW5hbENvbHVtbiA9IDA7XG4gICAgdmFyIHByZXZpb3VzU291cmNlID0gMDtcbiAgICB2YXIgcHJldmlvdXNOYW1lID0gMDtcbiAgICB2YXIgbGVuZ3RoID0gYVN0ci5sZW5ndGg7XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgY2FjaGVkU2VnbWVudHMgPSB7fTtcbiAgICB2YXIgdGVtcCA9IHt9O1xuICAgIHZhciBvcmlnaW5hbE1hcHBpbmdzID0gW107XG4gICAgdmFyIGdlbmVyYXRlZE1hcHBpbmdzID0gW107XG4gICAgdmFyIG1hcHBpbmcsIHN0ciwgc2VnbWVudCwgZW5kLCB2YWx1ZTtcblxuICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgaWYgKGFTdHIuY2hhckF0KGluZGV4KSA9PT0gJzsnKSB7XG4gICAgICAgIGdlbmVyYXRlZExpbmUrKztcbiAgICAgICAgaW5kZXgrKztcbiAgICAgICAgcHJldmlvdXNHZW5lcmF0ZWRDb2x1bW4gPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoYVN0ci5jaGFyQXQoaW5kZXgpID09PSAnLCcpIHtcbiAgICAgICAgaW5kZXgrKztcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBtYXBwaW5nID0gbmV3IE1hcHBpbmcoKTtcbiAgICAgICAgbWFwcGluZy5nZW5lcmF0ZWRMaW5lID0gZ2VuZXJhdGVkTGluZTtcblxuICAgICAgICAvLyBCZWNhdXNlIGVhY2ggb2Zmc2V0IGlzIGVuY29kZWQgcmVsYXRpdmUgdG8gdGhlIHByZXZpb3VzIG9uZSxcbiAgICAgICAgLy8gbWFueSBzZWdtZW50cyBvZnRlbiBoYXZlIHRoZSBzYW1lIGVuY29kaW5nLiBXZSBjYW4gZXhwbG9pdCB0aGlzXG4gICAgICAgIC8vIGZhY3QgYnkgY2FjaGluZyB0aGUgcGFyc2VkIHZhcmlhYmxlIGxlbmd0aCBmaWVsZHMgb2YgZWFjaCBzZWdtZW50LFxuICAgICAgICAvLyBhbGxvd2luZyB1cyB0byBhdm9pZCBhIHNlY29uZCBwYXJzZSBpZiB3ZSBlbmNvdW50ZXIgdGhlIHNhbWVcbiAgICAgICAgLy8gc2VnbWVudCBhZ2Fpbi5cbiAgICAgICAgZm9yIChlbmQgPSBpbmRleDsgZW5kIDwgbGVuZ3RoOyBlbmQrKykge1xuICAgICAgICAgIGlmICh0aGlzLl9jaGFySXNNYXBwaW5nU2VwYXJhdG9yKGFTdHIsIGVuZCkpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdHIgPSBhU3RyLnNsaWNlKGluZGV4LCBlbmQpO1xuXG4gICAgICAgIHNlZ21lbnQgPSBjYWNoZWRTZWdtZW50c1tzdHJdO1xuICAgICAgICBpZiAoc2VnbWVudCkge1xuICAgICAgICAgIGluZGV4ICs9IHN0ci5sZW5ndGg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VnbWVudCA9IFtdO1xuICAgICAgICAgIHdoaWxlIChpbmRleCA8IGVuZCkge1xuICAgICAgICAgICAgYmFzZTY0VkxRLmRlY29kZShhU3RyLCBpbmRleCwgdGVtcCk7XG4gICAgICAgICAgICB2YWx1ZSA9IHRlbXAudmFsdWU7XG4gICAgICAgICAgICBpbmRleCA9IHRlbXAucmVzdDtcbiAgICAgICAgICAgIHNlZ21lbnQucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHNlZ21lbnQubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZvdW5kIGEgc291cmNlLCBidXQgbm8gbGluZSBhbmQgY29sdW1uJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHNlZ21lbnQubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZvdW5kIGEgc291cmNlIGFuZCBsaW5lLCBidXQgbm8gY29sdW1uJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY2FjaGVkU2VnbWVudHNbc3RyXSA9IHNlZ21lbnQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZW5lcmF0ZWQgY29sdW1uLlxuICAgICAgICBtYXBwaW5nLmdlbmVyYXRlZENvbHVtbiA9IHByZXZpb3VzR2VuZXJhdGVkQ29sdW1uICsgc2VnbWVudFswXTtcbiAgICAgICAgcHJldmlvdXNHZW5lcmF0ZWRDb2x1bW4gPSBtYXBwaW5nLmdlbmVyYXRlZENvbHVtbjtcblxuICAgICAgICBpZiAoc2VnbWVudC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgLy8gT3JpZ2luYWwgc291cmNlLlxuICAgICAgICAgIG1hcHBpbmcuc291cmNlID0gcHJldmlvdXNTb3VyY2UgKyBzZWdtZW50WzFdO1xuICAgICAgICAgIHByZXZpb3VzU291cmNlICs9IHNlZ21lbnRbMV07XG5cbiAgICAgICAgICAvLyBPcmlnaW5hbCBsaW5lLlxuICAgICAgICAgIG1hcHBpbmcub3JpZ2luYWxMaW5lID0gcHJldmlvdXNPcmlnaW5hbExpbmUgKyBzZWdtZW50WzJdO1xuICAgICAgICAgIHByZXZpb3VzT3JpZ2luYWxMaW5lID0gbWFwcGluZy5vcmlnaW5hbExpbmU7XG4gICAgICAgICAgLy8gTGluZXMgYXJlIHN0b3JlZCAwLWJhc2VkXG4gICAgICAgICAgbWFwcGluZy5vcmlnaW5hbExpbmUgKz0gMTtcblxuICAgICAgICAgIC8vIE9yaWdpbmFsIGNvbHVtbi5cbiAgICAgICAgICBtYXBwaW5nLm9yaWdpbmFsQ29sdW1uID0gcHJldmlvdXNPcmlnaW5hbENvbHVtbiArIHNlZ21lbnRbM107XG4gICAgICAgICAgcHJldmlvdXNPcmlnaW5hbENvbHVtbiA9IG1hcHBpbmcub3JpZ2luYWxDb2x1bW47XG5cbiAgICAgICAgICBpZiAoc2VnbWVudC5sZW5ndGggPiA0KSB7XG4gICAgICAgICAgICAvLyBPcmlnaW5hbCBuYW1lLlxuICAgICAgICAgICAgbWFwcGluZy5uYW1lID0gcHJldmlvdXNOYW1lICsgc2VnbWVudFs0XTtcbiAgICAgICAgICAgIHByZXZpb3VzTmFtZSArPSBzZWdtZW50WzRdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGdlbmVyYXRlZE1hcHBpbmdzLnB1c2gobWFwcGluZyk7XG4gICAgICAgIGlmICh0eXBlb2YgbWFwcGluZy5vcmlnaW5hbExpbmUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgb3JpZ2luYWxNYXBwaW5ncy5wdXNoKG1hcHBpbmcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcXVpY2tTb3J0KGdlbmVyYXRlZE1hcHBpbmdzLCB1dGlsLmNvbXBhcmVCeUdlbmVyYXRlZFBvc2l0aW9uc0RlZmxhdGVkKTtcbiAgICB0aGlzLl9fZ2VuZXJhdGVkTWFwcGluZ3MgPSBnZW5lcmF0ZWRNYXBwaW5ncztcblxuICAgIHF1aWNrU29ydChvcmlnaW5hbE1hcHBpbmdzLCB1dGlsLmNvbXBhcmVCeU9yaWdpbmFsUG9zaXRpb25zKTtcbiAgICB0aGlzLl9fb3JpZ2luYWxNYXBwaW5ncyA9IG9yaWdpbmFsTWFwcGluZ3M7XG4gIH07XG5cbi8qKlxuICogRmluZCB0aGUgbWFwcGluZyB0aGF0IGJlc3QgbWF0Y2hlcyB0aGUgaHlwb3RoZXRpY2FsIFwibmVlZGxlXCIgbWFwcGluZyB0aGF0XG4gKiB3ZSBhcmUgc2VhcmNoaW5nIGZvciBpbiB0aGUgZ2l2ZW4gXCJoYXlzdGFja1wiIG9mIG1hcHBpbmdzLlxuICovXG5CYXNpY1NvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZS5fZmluZE1hcHBpbmcgPVxuICBmdW5jdGlvbiBTb3VyY2VNYXBDb25zdW1lcl9maW5kTWFwcGluZyhhTmVlZGxlLCBhTWFwcGluZ3MsIGFMaW5lTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYUNvbHVtbk5hbWUsIGFDb21wYXJhdG9yLCBhQmlhcykge1xuICAgIC8vIFRvIHJldHVybiB0aGUgcG9zaXRpb24gd2UgYXJlIHNlYXJjaGluZyBmb3IsIHdlIG11c3QgZmlyc3QgZmluZCB0aGVcbiAgICAvLyBtYXBwaW5nIGZvciB0aGUgZ2l2ZW4gcG9zaXRpb24gYW5kIHRoZW4gcmV0dXJuIHRoZSBvcHBvc2l0ZSBwb3NpdGlvbiBpdFxuICAgIC8vIHBvaW50cyB0by4gQmVjYXVzZSB0aGUgbWFwcGluZ3MgYXJlIHNvcnRlZCwgd2UgY2FuIHVzZSBiaW5hcnkgc2VhcmNoIHRvXG4gICAgLy8gZmluZCB0aGUgYmVzdCBtYXBwaW5nLlxuXG4gICAgaWYgKGFOZWVkbGVbYUxpbmVOYW1lXSA8PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdMaW5lIG11c3QgYmUgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIDEsIGdvdCAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICsgYU5lZWRsZVthTGluZU5hbWVdKTtcbiAgICB9XG4gICAgaWYgKGFOZWVkbGVbYUNvbHVtbk5hbWVdIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ29sdW1uIG11c3QgYmUgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIDAsIGdvdCAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICsgYU5lZWRsZVthQ29sdW1uTmFtZV0pO1xuICAgIH1cblxuICAgIHJldHVybiBiaW5hcnlTZWFyY2guc2VhcmNoKGFOZWVkbGUsIGFNYXBwaW5ncywgYUNvbXBhcmF0b3IsIGFCaWFzKTtcbiAgfTtcblxuLyoqXG4gKiBDb21wdXRlIHRoZSBsYXN0IGNvbHVtbiBmb3IgZWFjaCBnZW5lcmF0ZWQgbWFwcGluZy4gVGhlIGxhc3QgY29sdW1uIGlzXG4gKiBpbmNsdXNpdmUuXG4gKi9cbkJhc2ljU291cmNlTWFwQ29uc3VtZXIucHJvdG90eXBlLmNvbXB1dGVDb2x1bW5TcGFucyA9XG4gIGZ1bmN0aW9uIFNvdXJjZU1hcENvbnN1bWVyX2NvbXB1dGVDb2x1bW5TcGFucygpIHtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5fZ2VuZXJhdGVkTWFwcGluZ3MubGVuZ3RoOyArK2luZGV4KSB7XG4gICAgICB2YXIgbWFwcGluZyA9IHRoaXMuX2dlbmVyYXRlZE1hcHBpbmdzW2luZGV4XTtcblxuICAgICAgLy8gTWFwcGluZ3MgZG8gbm90IGNvbnRhaW4gYSBmaWVsZCBmb3IgdGhlIGxhc3QgZ2VuZXJhdGVkIGNvbHVtbnQuIFdlXG4gICAgICAvLyBjYW4gY29tZSB1cCB3aXRoIGFuIG9wdGltaXN0aWMgZXN0aW1hdGUsIGhvd2V2ZXIsIGJ5IGFzc3VtaW5nIHRoYXRcbiAgICAgIC8vIG1hcHBpbmdzIGFyZSBjb250aWd1b3VzIChpLmUuIGdpdmVuIHR3byBjb25zZWN1dGl2ZSBtYXBwaW5ncywgdGhlXG4gICAgICAvLyBmaXJzdCBtYXBwaW5nIGVuZHMgd2hlcmUgdGhlIHNlY29uZCBvbmUgc3RhcnRzKS5cbiAgICAgIGlmIChpbmRleCArIDEgPCB0aGlzLl9nZW5lcmF0ZWRNYXBwaW5ncy5sZW5ndGgpIHtcbiAgICAgICAgdmFyIG5leHRNYXBwaW5nID0gdGhpcy5fZ2VuZXJhdGVkTWFwcGluZ3NbaW5kZXggKyAxXTtcblxuICAgICAgICBpZiAobWFwcGluZy5nZW5lcmF0ZWRMaW5lID09PSBuZXh0TWFwcGluZy5nZW5lcmF0ZWRMaW5lKSB7XG4gICAgICAgICAgbWFwcGluZy5sYXN0R2VuZXJhdGVkQ29sdW1uID0gbmV4dE1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uIC0gMTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBUaGUgbGFzdCBtYXBwaW5nIGZvciBlYWNoIGxpbmUgc3BhbnMgdGhlIGVudGlyZSBsaW5lLlxuICAgICAgbWFwcGluZy5sYXN0R2VuZXJhdGVkQ29sdW1uID0gSW5maW5pdHk7XG4gICAgfVxuICB9O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIG9yaWdpbmFsIHNvdXJjZSwgbGluZSwgYW5kIGNvbHVtbiBpbmZvcm1hdGlvbiBmb3IgdGhlIGdlbmVyYXRlZFxuICogc291cmNlJ3MgbGluZSBhbmQgY29sdW1uIHBvc2l0aW9ucyBwcm92aWRlZC4gVGhlIG9ubHkgYXJndW1lbnQgaXMgYW4gb2JqZWN0XG4gKiB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAqXG4gKiAgIC0gbGluZTogVGhlIGxpbmUgbnVtYmVyIGluIHRoZSBnZW5lcmF0ZWQgc291cmNlLlxuICogICAtIGNvbHVtbjogVGhlIGNvbHVtbiBudW1iZXIgaW4gdGhlIGdlbmVyYXRlZCBzb3VyY2UuXG4gKiAgIC0gYmlhczogRWl0aGVyICdTb3VyY2VNYXBDb25zdW1lci5HUkVBVEVTVF9MT1dFUl9CT1VORCcgb3JcbiAqICAgICAnU291cmNlTWFwQ29uc3VtZXIuTEVBU1RfVVBQRVJfQk9VTkQnLiBTcGVjaWZpZXMgd2hldGhlciB0byByZXR1cm4gdGhlXG4gKiAgICAgY2xvc2VzdCBlbGVtZW50IHRoYXQgaXMgc21hbGxlciB0aGFuIG9yIGdyZWF0ZXIgdGhhbiB0aGUgb25lIHdlIGFyZVxuICogICAgIHNlYXJjaGluZyBmb3IsIHJlc3BlY3RpdmVseSwgaWYgdGhlIGV4YWN0IGVsZW1lbnQgY2Fubm90IGJlIGZvdW5kLlxuICogICAgIERlZmF1bHRzIHRvICdTb3VyY2VNYXBDb25zdW1lci5HUkVBVEVTVF9MT1dFUl9CT1VORCcuXG4gKlxuICogYW5kIGFuIG9iamVjdCBpcyByZXR1cm5lZCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAqXG4gKiAgIC0gc291cmNlOiBUaGUgb3JpZ2luYWwgc291cmNlIGZpbGUsIG9yIG51bGwuXG4gKiAgIC0gbGluZTogVGhlIGxpbmUgbnVtYmVyIGluIHRoZSBvcmlnaW5hbCBzb3VyY2UsIG9yIG51bGwuXG4gKiAgIC0gY29sdW1uOiBUaGUgY29sdW1uIG51bWJlciBpbiB0aGUgb3JpZ2luYWwgc291cmNlLCBvciBudWxsLlxuICogICAtIG5hbWU6IFRoZSBvcmlnaW5hbCBpZGVudGlmaWVyLCBvciBudWxsLlxuICovXG5CYXNpY1NvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZS5vcmlnaW5hbFBvc2l0aW9uRm9yID1cbiAgZnVuY3Rpb24gU291cmNlTWFwQ29uc3VtZXJfb3JpZ2luYWxQb3NpdGlvbkZvcihhQXJncykge1xuICAgIHZhciBuZWVkbGUgPSB7XG4gICAgICBnZW5lcmF0ZWRMaW5lOiB1dGlsLmdldEFyZyhhQXJncywgJ2xpbmUnKSxcbiAgICAgIGdlbmVyYXRlZENvbHVtbjogdXRpbC5nZXRBcmcoYUFyZ3MsICdjb2x1bW4nKVxuICAgIH07XG5cbiAgICB2YXIgaW5kZXggPSB0aGlzLl9maW5kTWFwcGluZyhcbiAgICAgIG5lZWRsZSxcbiAgICAgIHRoaXMuX2dlbmVyYXRlZE1hcHBpbmdzLFxuICAgICAgXCJnZW5lcmF0ZWRMaW5lXCIsXG4gICAgICBcImdlbmVyYXRlZENvbHVtblwiLFxuICAgICAgdXRpbC5jb21wYXJlQnlHZW5lcmF0ZWRQb3NpdGlvbnNEZWZsYXRlZCxcbiAgICAgIHV0aWwuZ2V0QXJnKGFBcmdzLCAnYmlhcycsIFNvdXJjZU1hcENvbnN1bWVyLkdSRUFURVNUX0xPV0VSX0JPVU5EKVxuICAgICk7XG5cbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgdmFyIG1hcHBpbmcgPSB0aGlzLl9nZW5lcmF0ZWRNYXBwaW5nc1tpbmRleF07XG5cbiAgICAgIGlmIChtYXBwaW5nLmdlbmVyYXRlZExpbmUgPT09IG5lZWRsZS5nZW5lcmF0ZWRMaW5lKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSB1dGlsLmdldEFyZyhtYXBwaW5nLCAnc291cmNlJywgbnVsbCk7XG4gICAgICAgIGlmIChzb3VyY2UgIT09IG51bGwpIHtcbiAgICAgICAgICBzb3VyY2UgPSB0aGlzLl9zb3VyY2VzLmF0KHNvdXJjZSk7XG4gICAgICAgICAgaWYgKHRoaXMuc291cmNlUm9vdCAhPSBudWxsKSB7XG4gICAgICAgICAgICBzb3VyY2UgPSB1dGlsLmpvaW4odGhpcy5zb3VyY2VSb290LCBzb3VyY2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgbmFtZSA9IHV0aWwuZ2V0QXJnKG1hcHBpbmcsICduYW1lJywgbnVsbCk7XG4gICAgICAgIGlmIChuYW1lICE9PSBudWxsKSB7XG4gICAgICAgICAgbmFtZSA9IHRoaXMuX25hbWVzLmF0KG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc291cmNlOiBzb3VyY2UsXG4gICAgICAgICAgbGluZTogdXRpbC5nZXRBcmcobWFwcGluZywgJ29yaWdpbmFsTGluZScsIG51bGwpLFxuICAgICAgICAgIGNvbHVtbjogdXRpbC5nZXRBcmcobWFwcGluZywgJ29yaWdpbmFsQ29sdW1uJywgbnVsbCksXG4gICAgICAgICAgbmFtZTogbmFtZVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBzb3VyY2U6IG51bGwsXG4gICAgICBsaW5lOiBudWxsLFxuICAgICAgY29sdW1uOiBudWxsLFxuICAgICAgbmFtZTogbnVsbFxuICAgIH07XG4gIH07XG5cbi8qKlxuICogUmV0dXJuIHRydWUgaWYgd2UgaGF2ZSB0aGUgc291cmNlIGNvbnRlbnQgZm9yIGV2ZXJ5IHNvdXJjZSBpbiB0aGUgc291cmNlXG4gKiBtYXAsIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xuQmFzaWNTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuaGFzQ29udGVudHNPZkFsbFNvdXJjZXMgPVxuICBmdW5jdGlvbiBCYXNpY1NvdXJjZU1hcENvbnN1bWVyX2hhc0NvbnRlbnRzT2ZBbGxTb3VyY2VzKCkge1xuICAgIGlmICghdGhpcy5zb3VyY2VzQ29udGVudCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zb3VyY2VzQ29udGVudC5sZW5ndGggPj0gdGhpcy5fc291cmNlcy5zaXplKCkgJiZcbiAgICAgICF0aGlzLnNvdXJjZXNDb250ZW50LnNvbWUoZnVuY3Rpb24gKHNjKSB7IHJldHVybiBzYyA9PSBudWxsOyB9KTtcbiAgfTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBvcmlnaW5hbCBzb3VyY2UgY29udGVudC4gVGhlIG9ubHkgYXJndW1lbnQgaXMgdGhlIHVybCBvZiB0aGVcbiAqIG9yaWdpbmFsIHNvdXJjZSBmaWxlLiBSZXR1cm5zIG51bGwgaWYgbm8gb3JpZ2luYWwgc291cmNlIGNvbnRlbnQgaXNcbiAqIGF2YWlsYWJsZS5cbiAqL1xuQmFzaWNTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuc291cmNlQ29udGVudEZvciA9XG4gIGZ1bmN0aW9uIFNvdXJjZU1hcENvbnN1bWVyX3NvdXJjZUNvbnRlbnRGb3IoYVNvdXJjZSwgbnVsbE9uTWlzc2luZykge1xuICAgIGlmICghdGhpcy5zb3VyY2VzQ29udGVudCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc291cmNlUm9vdCAhPSBudWxsKSB7XG4gICAgICBhU291cmNlID0gdXRpbC5yZWxhdGl2ZSh0aGlzLnNvdXJjZVJvb3QsIGFTb3VyY2UpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9zb3VyY2VzLmhhcyhhU291cmNlKSkge1xuICAgICAgcmV0dXJuIHRoaXMuc291cmNlc0NvbnRlbnRbdGhpcy5fc291cmNlcy5pbmRleE9mKGFTb3VyY2UpXTtcbiAgICB9XG5cbiAgICB2YXIgdXJsO1xuICAgIGlmICh0aGlzLnNvdXJjZVJvb3QgIT0gbnVsbFxuICAgICAgICAmJiAodXJsID0gdXRpbC51cmxQYXJzZSh0aGlzLnNvdXJjZVJvb3QpKSkge1xuICAgICAgLy8gWFhYOiBmaWxlOi8vIFVSSXMgYW5kIGFic29sdXRlIHBhdGhzIGxlYWQgdG8gdW5leHBlY3RlZCBiZWhhdmlvciBmb3JcbiAgICAgIC8vIG1hbnkgdXNlcnMuIFdlIGNhbiBoZWxwIHRoZW0gb3V0IHdoZW4gdGhleSBleHBlY3QgZmlsZTovLyBVUklzIHRvXG4gICAgICAvLyBiZWhhdmUgbGlrZSBpdCB3b3VsZCBpZiB0aGV5IHdlcmUgcnVubmluZyBhIGxvY2FsIEhUVFAgc2VydmVyLiBTZWVcbiAgICAgIC8vIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTg4NTU5Ny5cbiAgICAgIHZhciBmaWxlVXJpQWJzUGF0aCA9IGFTb3VyY2UucmVwbGFjZSgvXmZpbGU6XFwvXFwvLywgXCJcIik7XG4gICAgICBpZiAodXJsLnNjaGVtZSA9PSBcImZpbGVcIlxuICAgICAgICAgICYmIHRoaXMuX3NvdXJjZXMuaGFzKGZpbGVVcmlBYnNQYXRoKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zb3VyY2VzQ29udGVudFt0aGlzLl9zb3VyY2VzLmluZGV4T2YoZmlsZVVyaUFic1BhdGgpXVxuICAgICAgfVxuXG4gICAgICBpZiAoKCF1cmwucGF0aCB8fCB1cmwucGF0aCA9PSBcIi9cIilcbiAgICAgICAgICAmJiB0aGlzLl9zb3VyY2VzLmhhcyhcIi9cIiArIGFTb3VyY2UpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNvdXJjZXNDb250ZW50W3RoaXMuX3NvdXJjZXMuaW5kZXhPZihcIi9cIiArIGFTb3VyY2UpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgcmVjdXJzaXZlbHkgZnJvbVxuICAgIC8vIEluZGV4ZWRTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuc291cmNlQ29udGVudEZvci4gSW4gdGhhdCBjYXNlLCB3ZVxuICAgIC8vIGRvbid0IHdhbnQgdG8gdGhyb3cgaWYgd2UgY2FuJ3QgZmluZCB0aGUgc291cmNlIC0gd2UganVzdCB3YW50IHRvXG4gICAgLy8gcmV0dXJuIG51bGwsIHNvIHdlIHByb3ZpZGUgYSBmbGFnIHRvIGV4aXQgZ3JhY2VmdWxseS5cbiAgICBpZiAobnVsbE9uTWlzc2luZykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdcIicgKyBhU291cmNlICsgJ1wiIGlzIG5vdCBpbiB0aGUgU291cmNlTWFwLicpO1xuICAgIH1cbiAgfTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBnZW5lcmF0ZWQgbGluZSBhbmQgY29sdW1uIGluZm9ybWF0aW9uIGZvciB0aGUgb3JpZ2luYWwgc291cmNlLFxuICogbGluZSwgYW5kIGNvbHVtbiBwb3NpdGlvbnMgcHJvdmlkZWQuIFRoZSBvbmx5IGFyZ3VtZW50IGlzIGFuIG9iamVjdCB3aXRoXG4gKiB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gKlxuICogICAtIHNvdXJjZTogVGhlIGZpbGVuYW1lIG9mIHRoZSBvcmlnaW5hbCBzb3VyY2UuXG4gKiAgIC0gbGluZTogVGhlIGxpbmUgbnVtYmVyIGluIHRoZSBvcmlnaW5hbCBzb3VyY2UuXG4gKiAgIC0gY29sdW1uOiBUaGUgY29sdW1uIG51bWJlciBpbiB0aGUgb3JpZ2luYWwgc291cmNlLlxuICogICAtIGJpYXM6IEVpdGhlciAnU291cmNlTWFwQ29uc3VtZXIuR1JFQVRFU1RfTE9XRVJfQk9VTkQnIG9yXG4gKiAgICAgJ1NvdXJjZU1hcENvbnN1bWVyLkxFQVNUX1VQUEVSX0JPVU5EJy4gU3BlY2lmaWVzIHdoZXRoZXIgdG8gcmV0dXJuIHRoZVxuICogICAgIGNsb3Nlc3QgZWxlbWVudCB0aGF0IGlzIHNtYWxsZXIgdGhhbiBvciBncmVhdGVyIHRoYW4gdGhlIG9uZSB3ZSBhcmVcbiAqICAgICBzZWFyY2hpbmcgZm9yLCByZXNwZWN0aXZlbHksIGlmIHRoZSBleGFjdCBlbGVtZW50IGNhbm5vdCBiZSBmb3VuZC5cbiAqICAgICBEZWZhdWx0cyB0byAnU291cmNlTWFwQ29uc3VtZXIuR1JFQVRFU1RfTE9XRVJfQk9VTkQnLlxuICpcbiAqIGFuZCBhbiBvYmplY3QgaXMgcmV0dXJuZWQgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gKlxuICogICAtIGxpbmU6IFRoZSBsaW5lIG51bWJlciBpbiB0aGUgZ2VuZXJhdGVkIHNvdXJjZSwgb3IgbnVsbC5cbiAqICAgLSBjb2x1bW46IFRoZSBjb2x1bW4gbnVtYmVyIGluIHRoZSBnZW5lcmF0ZWQgc291cmNlLCBvciBudWxsLlxuICovXG5CYXNpY1NvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZS5nZW5lcmF0ZWRQb3NpdGlvbkZvciA9XG4gIGZ1bmN0aW9uIFNvdXJjZU1hcENvbnN1bWVyX2dlbmVyYXRlZFBvc2l0aW9uRm9yKGFBcmdzKSB7XG4gICAgdmFyIHNvdXJjZSA9IHV0aWwuZ2V0QXJnKGFBcmdzLCAnc291cmNlJyk7XG4gICAgaWYgKHRoaXMuc291cmNlUm9vdCAhPSBudWxsKSB7XG4gICAgICBzb3VyY2UgPSB1dGlsLnJlbGF0aXZlKHRoaXMuc291cmNlUm9vdCwgc291cmNlKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9zb3VyY2VzLmhhcyhzb3VyY2UpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsaW5lOiBudWxsLFxuICAgICAgICBjb2x1bW46IG51bGwsXG4gICAgICAgIGxhc3RDb2x1bW46IG51bGxcbiAgICAgIH07XG4gICAgfVxuICAgIHNvdXJjZSA9IHRoaXMuX3NvdXJjZXMuaW5kZXhPZihzb3VyY2UpO1xuXG4gICAgdmFyIG5lZWRsZSA9IHtcbiAgICAgIHNvdXJjZTogc291cmNlLFxuICAgICAgb3JpZ2luYWxMaW5lOiB1dGlsLmdldEFyZyhhQXJncywgJ2xpbmUnKSxcbiAgICAgIG9yaWdpbmFsQ29sdW1uOiB1dGlsLmdldEFyZyhhQXJncywgJ2NvbHVtbicpXG4gICAgfTtcblxuICAgIHZhciBpbmRleCA9IHRoaXMuX2ZpbmRNYXBwaW5nKFxuICAgICAgbmVlZGxlLFxuICAgICAgdGhpcy5fb3JpZ2luYWxNYXBwaW5ncyxcbiAgICAgIFwib3JpZ2luYWxMaW5lXCIsXG4gICAgICBcIm9yaWdpbmFsQ29sdW1uXCIsXG4gICAgICB1dGlsLmNvbXBhcmVCeU9yaWdpbmFsUG9zaXRpb25zLFxuICAgICAgdXRpbC5nZXRBcmcoYUFyZ3MsICdiaWFzJywgU291cmNlTWFwQ29uc3VtZXIuR1JFQVRFU1RfTE9XRVJfQk9VTkQpXG4gICAgKTtcblxuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICB2YXIgbWFwcGluZyA9IHRoaXMuX29yaWdpbmFsTWFwcGluZ3NbaW5kZXhdO1xuXG4gICAgICBpZiAobWFwcGluZy5zb3VyY2UgPT09IG5lZWRsZS5zb3VyY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsaW5lOiB1dGlsLmdldEFyZyhtYXBwaW5nLCAnZ2VuZXJhdGVkTGluZScsIG51bGwpLFxuICAgICAgICAgIGNvbHVtbjogdXRpbC5nZXRBcmcobWFwcGluZywgJ2dlbmVyYXRlZENvbHVtbicsIG51bGwpLFxuICAgICAgICAgIGxhc3RDb2x1bW46IHV0aWwuZ2V0QXJnKG1hcHBpbmcsICdsYXN0R2VuZXJhdGVkQ29sdW1uJywgbnVsbClcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbGluZTogbnVsbCxcbiAgICAgIGNvbHVtbjogbnVsbCxcbiAgICAgIGxhc3RDb2x1bW46IG51bGxcbiAgICB9O1xuICB9O1xuXG5leHBvcnRzLkJhc2ljU291cmNlTWFwQ29uc3VtZXIgPSBCYXNpY1NvdXJjZU1hcENvbnN1bWVyO1xuXG4vKipcbiAqIEFuIEluZGV4ZWRTb3VyY2VNYXBDb25zdW1lciBpbnN0YW5jZSByZXByZXNlbnRzIGEgcGFyc2VkIHNvdXJjZSBtYXAgd2hpY2hcbiAqIHdlIGNhbiBxdWVyeSBmb3IgaW5mb3JtYXRpb24uIEl0IGRpZmZlcnMgZnJvbSBCYXNpY1NvdXJjZU1hcENvbnN1bWVyIGluXG4gKiB0aGF0IGl0IHRha2VzIFwiaW5kZXhlZFwiIHNvdXJjZSBtYXBzIChpLmUuIG9uZXMgd2l0aCBhIFwic2VjdGlvbnNcIiBmaWVsZCkgYXNcbiAqIGlucHV0LlxuICpcbiAqIFRoZSBvbmx5IHBhcmFtZXRlciBpcyBhIHJhdyBzb3VyY2UgbWFwIChlaXRoZXIgYXMgYSBKU09OIHN0cmluZywgb3IgYWxyZWFkeVxuICogcGFyc2VkIHRvIGFuIG9iamVjdCkuIEFjY29yZGluZyB0byB0aGUgc3BlYyBmb3IgaW5kZXhlZCBzb3VyY2UgbWFwcywgdGhleVxuICogaGF2ZSB0aGUgZm9sbG93aW5nIGF0dHJpYnV0ZXM6XG4gKlxuICogICAtIHZlcnNpb246IFdoaWNoIHZlcnNpb24gb2YgdGhlIHNvdXJjZSBtYXAgc3BlYyB0aGlzIG1hcCBpcyBmb2xsb3dpbmcuXG4gKiAgIC0gZmlsZTogT3B0aW9uYWwuIFRoZSBnZW5lcmF0ZWQgZmlsZSB0aGlzIHNvdXJjZSBtYXAgaXMgYXNzb2NpYXRlZCB3aXRoLlxuICogICAtIHNlY3Rpb25zOiBBIGxpc3Qgb2Ygc2VjdGlvbiBkZWZpbml0aW9ucy5cbiAqXG4gKiBFYWNoIHZhbHVlIHVuZGVyIHRoZSBcInNlY3Rpb25zXCIgZmllbGQgaGFzIHR3byBmaWVsZHM6XG4gKiAgIC0gb2Zmc2V0OiBUaGUgb2Zmc2V0IGludG8gdGhlIG9yaWdpbmFsIHNwZWNpZmllZCBhdCB3aGljaCB0aGlzIHNlY3Rpb25cbiAqICAgICAgIGJlZ2lucyB0byBhcHBseSwgZGVmaW5lZCBhcyBhbiBvYmplY3Qgd2l0aCBhIFwibGluZVwiIGFuZCBcImNvbHVtblwiXG4gKiAgICAgICBmaWVsZC5cbiAqICAgLSBtYXA6IEEgc291cmNlIG1hcCBkZWZpbml0aW9uLiBUaGlzIHNvdXJjZSBtYXAgY291bGQgYWxzbyBiZSBpbmRleGVkLFxuICogICAgICAgYnV0IGRvZXNuJ3QgaGF2ZSB0byBiZS5cbiAqXG4gKiBJbnN0ZWFkIG9mIHRoZSBcIm1hcFwiIGZpZWxkLCBpdCdzIGFsc28gcG9zc2libGUgdG8gaGF2ZSBhIFwidXJsXCIgZmllbGRcbiAqIHNwZWNpZnlpbmcgYSBVUkwgdG8gcmV0cmlldmUgYSBzb3VyY2UgbWFwIGZyb20sIGJ1dCB0aGF0J3MgY3VycmVudGx5XG4gKiB1bnN1cHBvcnRlZC5cbiAqXG4gKiBIZXJlJ3MgYW4gZXhhbXBsZSBzb3VyY2UgbWFwLCB0YWtlbiBmcm9tIHRoZSBzb3VyY2UgbWFwIHNwZWNbMF0sIGJ1dFxuICogbW9kaWZpZWQgdG8gb21pdCBhIHNlY3Rpb24gd2hpY2ggdXNlcyB0aGUgXCJ1cmxcIiBmaWVsZC5cbiAqXG4gKiAge1xuICogICAgdmVyc2lvbiA6IDMsXG4gKiAgICBmaWxlOiBcImFwcC5qc1wiLFxuICogICAgc2VjdGlvbnM6IFt7XG4gKiAgICAgIG9mZnNldDoge2xpbmU6MTAwLCBjb2x1bW46MTB9LFxuICogICAgICBtYXA6IHtcbiAqICAgICAgICB2ZXJzaW9uIDogMyxcbiAqICAgICAgICBmaWxlOiBcInNlY3Rpb24uanNcIixcbiAqICAgICAgICBzb3VyY2VzOiBbXCJmb28uanNcIiwgXCJiYXIuanNcIl0sXG4gKiAgICAgICAgbmFtZXM6IFtcInNyY1wiLCBcIm1hcHNcIiwgXCJhcmVcIiwgXCJmdW5cIl0sXG4gKiAgICAgICAgbWFwcGluZ3M6IFwiQUFBQSxFOztBQkNERTtcIlxuICogICAgICB9XG4gKiAgICB9XSxcbiAqICB9XG4gKlxuICogWzBdOiBodHRwczovL2RvY3MuZ29vZ2xlLmNvbS9kb2N1bWVudC9kLzFVMVJHQWVoUXdSeXBVVG92RjFLUmxwaU9GemUwYi1fMmdjNmZBSDBLWTBrL2VkaXQjaGVhZGluZz1oLjUzNWVzM3hlcHJndFxuICovXG5mdW5jdGlvbiBJbmRleGVkU291cmNlTWFwQ29uc3VtZXIoYVNvdXJjZU1hcCkge1xuICB2YXIgc291cmNlTWFwID0gYVNvdXJjZU1hcDtcbiAgaWYgKHR5cGVvZiBhU291cmNlTWFwID09PSAnc3RyaW5nJykge1xuICAgIHNvdXJjZU1hcCA9IEpTT04ucGFyc2UoYVNvdXJjZU1hcC5yZXBsYWNlKC9eXFwpXFxdXFx9Jy8sICcnKSk7XG4gIH1cblxuICB2YXIgdmVyc2lvbiA9IHV0aWwuZ2V0QXJnKHNvdXJjZU1hcCwgJ3ZlcnNpb24nKTtcbiAgdmFyIHNlY3Rpb25zID0gdXRpbC5nZXRBcmcoc291cmNlTWFwLCAnc2VjdGlvbnMnKTtcblxuICBpZiAodmVyc2lvbiAhPSB0aGlzLl92ZXJzaW9uKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbnN1cHBvcnRlZCB2ZXJzaW9uOiAnICsgdmVyc2lvbik7XG4gIH1cblxuICB0aGlzLl9zb3VyY2VzID0gbmV3IEFycmF5U2V0KCk7XG4gIHRoaXMuX25hbWVzID0gbmV3IEFycmF5U2V0KCk7XG5cbiAgdmFyIGxhc3RPZmZzZXQgPSB7XG4gICAgbGluZTogLTEsXG4gICAgY29sdW1uOiAwXG4gIH07XG4gIHRoaXMuX3NlY3Rpb25zID0gc2VjdGlvbnMubWFwKGZ1bmN0aW9uIChzKSB7XG4gICAgaWYgKHMudXJsKSB7XG4gICAgICAvLyBUaGUgdXJsIGZpZWxkIHdpbGwgcmVxdWlyZSBzdXBwb3J0IGZvciBhc3luY2hyb25pY2l0eS5cbiAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbW96aWxsYS9zb3VyY2UtbWFwL2lzc3Vlcy8xNlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTdXBwb3J0IGZvciB1cmwgZmllbGQgaW4gc2VjdGlvbnMgbm90IGltcGxlbWVudGVkLicpO1xuICAgIH1cbiAgICB2YXIgb2Zmc2V0ID0gdXRpbC5nZXRBcmcocywgJ29mZnNldCcpO1xuICAgIHZhciBvZmZzZXRMaW5lID0gdXRpbC5nZXRBcmcob2Zmc2V0LCAnbGluZScpO1xuICAgIHZhciBvZmZzZXRDb2x1bW4gPSB1dGlsLmdldEFyZyhvZmZzZXQsICdjb2x1bW4nKTtcblxuICAgIGlmIChvZmZzZXRMaW5lIDwgbGFzdE9mZnNldC5saW5lIHx8XG4gICAgICAgIChvZmZzZXRMaW5lID09PSBsYXN0T2Zmc2V0LmxpbmUgJiYgb2Zmc2V0Q29sdW1uIDwgbGFzdE9mZnNldC5jb2x1bW4pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NlY3Rpb24gb2Zmc2V0cyBtdXN0IGJlIG9yZGVyZWQgYW5kIG5vbi1vdmVybGFwcGluZy4nKTtcbiAgICB9XG4gICAgbGFzdE9mZnNldCA9IG9mZnNldDtcblxuICAgIHJldHVybiB7XG4gICAgICBnZW5lcmF0ZWRPZmZzZXQ6IHtcbiAgICAgICAgLy8gVGhlIG9mZnNldCBmaWVsZHMgYXJlIDAtYmFzZWQsIGJ1dCB3ZSB1c2UgMS1iYXNlZCBpbmRpY2VzIHdoZW5cbiAgICAgICAgLy8gZW5jb2RpbmcvZGVjb2RpbmcgZnJvbSBWTFEuXG4gICAgICAgIGdlbmVyYXRlZExpbmU6IG9mZnNldExpbmUgKyAxLFxuICAgICAgICBnZW5lcmF0ZWRDb2x1bW46IG9mZnNldENvbHVtbiArIDFcbiAgICAgIH0sXG4gICAgICBjb25zdW1lcjogbmV3IFNvdXJjZU1hcENvbnN1bWVyKHV0aWwuZ2V0QXJnKHMsICdtYXAnKSlcbiAgICB9XG4gIH0pO1xufVxuXG5JbmRleGVkU291cmNlTWFwQ29uc3VtZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUpO1xuSW5kZXhlZFNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFNvdXJjZU1hcENvbnN1bWVyO1xuXG4vKipcbiAqIFRoZSB2ZXJzaW9uIG9mIHRoZSBzb3VyY2UgbWFwcGluZyBzcGVjIHRoYXQgd2UgYXJlIGNvbnN1bWluZy5cbiAqL1xuSW5kZXhlZFNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZS5fdmVyc2lvbiA9IDM7XG5cbi8qKlxuICogVGhlIGxpc3Qgb2Ygb3JpZ2luYWwgc291cmNlcy5cbiAqL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KEluZGV4ZWRTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUsICdzb3VyY2VzJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc291cmNlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fc2VjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5fc2VjdGlvbnNbaV0uY29uc3VtZXIuc291cmNlcy5sZW5ndGg7IGorKykge1xuICAgICAgICBzb3VyY2VzLnB1c2godGhpcy5fc2VjdGlvbnNbaV0uY29uc3VtZXIuc291cmNlc1tqXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzb3VyY2VzO1xuICB9XG59KTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBvcmlnaW5hbCBzb3VyY2UsIGxpbmUsIGFuZCBjb2x1bW4gaW5mb3JtYXRpb24gZm9yIHRoZSBnZW5lcmF0ZWRcbiAqIHNvdXJjZSdzIGxpbmUgYW5kIGNvbHVtbiBwb3NpdGlvbnMgcHJvdmlkZWQuIFRoZSBvbmx5IGFyZ3VtZW50IGlzIGFuIG9iamVjdFxuICogd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gKlxuICogICAtIGxpbmU6IFRoZSBsaW5lIG51bWJlciBpbiB0aGUgZ2VuZXJhdGVkIHNvdXJjZS5cbiAqICAgLSBjb2x1bW46IFRoZSBjb2x1bW4gbnVtYmVyIGluIHRoZSBnZW5lcmF0ZWQgc291cmNlLlxuICpcbiAqIGFuZCBhbiBvYmplY3QgaXMgcmV0dXJuZWQgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gKlxuICogICAtIHNvdXJjZTogVGhlIG9yaWdpbmFsIHNvdXJjZSBmaWxlLCBvciBudWxsLlxuICogICAtIGxpbmU6IFRoZSBsaW5lIG51bWJlciBpbiB0aGUgb3JpZ2luYWwgc291cmNlLCBvciBudWxsLlxuICogICAtIGNvbHVtbjogVGhlIGNvbHVtbiBudW1iZXIgaW4gdGhlIG9yaWdpbmFsIHNvdXJjZSwgb3IgbnVsbC5cbiAqICAgLSBuYW1lOiBUaGUgb3JpZ2luYWwgaWRlbnRpZmllciwgb3IgbnVsbC5cbiAqL1xuSW5kZXhlZFNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZS5vcmlnaW5hbFBvc2l0aW9uRm9yID1cbiAgZnVuY3Rpb24gSW5kZXhlZFNvdXJjZU1hcENvbnN1bWVyX29yaWdpbmFsUG9zaXRpb25Gb3IoYUFyZ3MpIHtcbiAgICB2YXIgbmVlZGxlID0ge1xuICAgICAgZ2VuZXJhdGVkTGluZTogdXRpbC5nZXRBcmcoYUFyZ3MsICdsaW5lJyksXG4gICAgICBnZW5lcmF0ZWRDb2x1bW46IHV0aWwuZ2V0QXJnKGFBcmdzLCAnY29sdW1uJylcbiAgICB9O1xuXG4gICAgLy8gRmluZCB0aGUgc2VjdGlvbiBjb250YWluaW5nIHRoZSBnZW5lcmF0ZWQgcG9zaXRpb24gd2UncmUgdHJ5aW5nIHRvIG1hcFxuICAgIC8vIHRvIGFuIG9yaWdpbmFsIHBvc2l0aW9uLlxuICAgIHZhciBzZWN0aW9uSW5kZXggPSBiaW5hcnlTZWFyY2guc2VhcmNoKG5lZWRsZSwgdGhpcy5fc2VjdGlvbnMsXG4gICAgICBmdW5jdGlvbihuZWVkbGUsIHNlY3Rpb24pIHtcbiAgICAgICAgdmFyIGNtcCA9IG5lZWRsZS5nZW5lcmF0ZWRMaW5lIC0gc2VjdGlvbi5nZW5lcmF0ZWRPZmZzZXQuZ2VuZXJhdGVkTGluZTtcbiAgICAgICAgaWYgKGNtcCkge1xuICAgICAgICAgIHJldHVybiBjbXA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKG5lZWRsZS5nZW5lcmF0ZWRDb2x1bW4gLVxuICAgICAgICAgICAgICAgIHNlY3Rpb24uZ2VuZXJhdGVkT2Zmc2V0LmdlbmVyYXRlZENvbHVtbik7XG4gICAgICB9KTtcbiAgICB2YXIgc2VjdGlvbiA9IHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JbmRleF07XG5cbiAgICBpZiAoIXNlY3Rpb24pIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHNvdXJjZTogbnVsbCxcbiAgICAgICAgbGluZTogbnVsbCxcbiAgICAgICAgY29sdW1uOiBudWxsLFxuICAgICAgICBuYW1lOiBudWxsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBzZWN0aW9uLmNvbnN1bWVyLm9yaWdpbmFsUG9zaXRpb25Gb3Ioe1xuICAgICAgbGluZTogbmVlZGxlLmdlbmVyYXRlZExpbmUgLVxuICAgICAgICAoc2VjdGlvbi5nZW5lcmF0ZWRPZmZzZXQuZ2VuZXJhdGVkTGluZSAtIDEpLFxuICAgICAgY29sdW1uOiBuZWVkbGUuZ2VuZXJhdGVkQ29sdW1uIC1cbiAgICAgICAgKHNlY3Rpb24uZ2VuZXJhdGVkT2Zmc2V0LmdlbmVyYXRlZExpbmUgPT09IG5lZWRsZS5nZW5lcmF0ZWRMaW5lXG4gICAgICAgICA/IHNlY3Rpb24uZ2VuZXJhdGVkT2Zmc2V0LmdlbmVyYXRlZENvbHVtbiAtIDFcbiAgICAgICAgIDogMCksXG4gICAgICBiaWFzOiBhQXJncy5iaWFzXG4gICAgfSk7XG4gIH07XG5cbi8qKlxuICogUmV0dXJuIHRydWUgaWYgd2UgaGF2ZSB0aGUgc291cmNlIGNvbnRlbnQgZm9yIGV2ZXJ5IHNvdXJjZSBpbiB0aGUgc291cmNlXG4gKiBtYXAsIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xuSW5kZXhlZFNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZS5oYXNDb250ZW50c09mQWxsU291cmNlcyA9XG4gIGZ1bmN0aW9uIEluZGV4ZWRTb3VyY2VNYXBDb25zdW1lcl9oYXNDb250ZW50c09mQWxsU291cmNlcygpIHtcbiAgICByZXR1cm4gdGhpcy5fc2VjdGlvbnMuZXZlcnkoZnVuY3Rpb24gKHMpIHtcbiAgICAgIHJldHVybiBzLmNvbnN1bWVyLmhhc0NvbnRlbnRzT2ZBbGxTb3VyY2VzKCk7XG4gICAgfSk7XG4gIH07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgb3JpZ2luYWwgc291cmNlIGNvbnRlbnQuIFRoZSBvbmx5IGFyZ3VtZW50IGlzIHRoZSB1cmwgb2YgdGhlXG4gKiBvcmlnaW5hbCBzb3VyY2UgZmlsZS4gUmV0dXJucyBudWxsIGlmIG5vIG9yaWdpbmFsIHNvdXJjZSBjb250ZW50IGlzXG4gKiBhdmFpbGFibGUuXG4gKi9cbkluZGV4ZWRTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuc291cmNlQ29udGVudEZvciA9XG4gIGZ1bmN0aW9uIEluZGV4ZWRTb3VyY2VNYXBDb25zdW1lcl9zb3VyY2VDb250ZW50Rm9yKGFTb3VyY2UsIG51bGxPbk1pc3NpbmcpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX3NlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgc2VjdGlvbiA9IHRoaXMuX3NlY3Rpb25zW2ldO1xuXG4gICAgICB2YXIgY29udGVudCA9IHNlY3Rpb24uY29uc3VtZXIuc291cmNlQ29udGVudEZvcihhU291cmNlLCB0cnVlKTtcbiAgICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgIHJldHVybiBjb250ZW50O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAobnVsbE9uTWlzc2luZykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdcIicgKyBhU291cmNlICsgJ1wiIGlzIG5vdCBpbiB0aGUgU291cmNlTWFwLicpO1xuICAgIH1cbiAgfTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBnZW5lcmF0ZWQgbGluZSBhbmQgY29sdW1uIGluZm9ybWF0aW9uIGZvciB0aGUgb3JpZ2luYWwgc291cmNlLFxuICogbGluZSwgYW5kIGNvbHVtbiBwb3NpdGlvbnMgcHJvdmlkZWQuIFRoZSBvbmx5IGFyZ3VtZW50IGlzIGFuIG9iamVjdCB3aXRoXG4gKiB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gKlxuICogICAtIHNvdXJjZTogVGhlIGZpbGVuYW1lIG9mIHRoZSBvcmlnaW5hbCBzb3VyY2UuXG4gKiAgIC0gbGluZTogVGhlIGxpbmUgbnVtYmVyIGluIHRoZSBvcmlnaW5hbCBzb3VyY2UuXG4gKiAgIC0gY29sdW1uOiBUaGUgY29sdW1uIG51bWJlciBpbiB0aGUgb3JpZ2luYWwgc291cmNlLlxuICpcbiAqIGFuZCBhbiBvYmplY3QgaXMgcmV0dXJuZWQgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gKlxuICogICAtIGxpbmU6IFRoZSBsaW5lIG51bWJlciBpbiB0aGUgZ2VuZXJhdGVkIHNvdXJjZSwgb3IgbnVsbC5cbiAqICAgLSBjb2x1bW46IFRoZSBjb2x1bW4gbnVtYmVyIGluIHRoZSBnZW5lcmF0ZWQgc291cmNlLCBvciBudWxsLlxuICovXG5JbmRleGVkU291cmNlTWFwQ29uc3VtZXIucHJvdG90eXBlLmdlbmVyYXRlZFBvc2l0aW9uRm9yID1cbiAgZnVuY3Rpb24gSW5kZXhlZFNvdXJjZU1hcENvbnN1bWVyX2dlbmVyYXRlZFBvc2l0aW9uRm9yKGFBcmdzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9zZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHNlY3Rpb24gPSB0aGlzLl9zZWN0aW9uc1tpXTtcblxuICAgICAgLy8gT25seSBjb25zaWRlciB0aGlzIHNlY3Rpb24gaWYgdGhlIHJlcXVlc3RlZCBzb3VyY2UgaXMgaW4gdGhlIGxpc3Qgb2ZcbiAgICAgIC8vIHNvdXJjZXMgb2YgdGhlIGNvbnN1bWVyLlxuICAgICAgaWYgKHNlY3Rpb24uY29uc3VtZXIuc291cmNlcy5pbmRleE9mKHV0aWwuZ2V0QXJnKGFBcmdzLCAnc291cmNlJykpID09PSAtMSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHZhciBnZW5lcmF0ZWRQb3NpdGlvbiA9IHNlY3Rpb24uY29uc3VtZXIuZ2VuZXJhdGVkUG9zaXRpb25Gb3IoYUFyZ3MpO1xuICAgICAgaWYgKGdlbmVyYXRlZFBvc2l0aW9uKSB7XG4gICAgICAgIHZhciByZXQgPSB7XG4gICAgICAgICAgbGluZTogZ2VuZXJhdGVkUG9zaXRpb24ubGluZSArXG4gICAgICAgICAgICAoc2VjdGlvbi5nZW5lcmF0ZWRPZmZzZXQuZ2VuZXJhdGVkTGluZSAtIDEpLFxuICAgICAgICAgIGNvbHVtbjogZ2VuZXJhdGVkUG9zaXRpb24uY29sdW1uICtcbiAgICAgICAgICAgIChzZWN0aW9uLmdlbmVyYXRlZE9mZnNldC5nZW5lcmF0ZWRMaW5lID09PSBnZW5lcmF0ZWRQb3NpdGlvbi5saW5lXG4gICAgICAgICAgICAgPyBzZWN0aW9uLmdlbmVyYXRlZE9mZnNldC5nZW5lcmF0ZWRDb2x1bW4gLSAxXG4gICAgICAgICAgICAgOiAwKVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBsaW5lOiBudWxsLFxuICAgICAgY29sdW1uOiBudWxsXG4gICAgfTtcbiAgfTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgbWFwcGluZ3MgaW4gYSBzdHJpbmcgaW4gdG8gYSBkYXRhIHN0cnVjdHVyZSB3aGljaCB3ZSBjYW4gZWFzaWx5XG4gKiBxdWVyeSAodGhlIG9yZGVyZWQgYXJyYXlzIGluIHRoZSBgdGhpcy5fX2dlbmVyYXRlZE1hcHBpbmdzYCBhbmRcbiAqIGB0aGlzLl9fb3JpZ2luYWxNYXBwaW5nc2AgcHJvcGVydGllcykuXG4gKi9cbkluZGV4ZWRTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuX3BhcnNlTWFwcGluZ3MgPVxuICBmdW5jdGlvbiBJbmRleGVkU291cmNlTWFwQ29uc3VtZXJfcGFyc2VNYXBwaW5ncyhhU3RyLCBhU291cmNlUm9vdCkge1xuICAgIHRoaXMuX19nZW5lcmF0ZWRNYXBwaW5ncyA9IFtdO1xuICAgIHRoaXMuX19vcmlnaW5hbE1hcHBpbmdzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9zZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHNlY3Rpb24gPSB0aGlzLl9zZWN0aW9uc1tpXTtcbiAgICAgIHZhciBzZWN0aW9uTWFwcGluZ3MgPSBzZWN0aW9uLmNvbnN1bWVyLl9nZW5lcmF0ZWRNYXBwaW5ncztcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc2VjdGlvbk1hcHBpbmdzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHZhciBtYXBwaW5nID0gc2VjdGlvbk1hcHBpbmdzW2pdO1xuXG4gICAgICAgIHZhciBzb3VyY2UgPSBzZWN0aW9uLmNvbnN1bWVyLl9zb3VyY2VzLmF0KG1hcHBpbmcuc291cmNlKTtcbiAgICAgICAgaWYgKHNlY3Rpb24uY29uc3VtZXIuc291cmNlUm9vdCAhPT0gbnVsbCkge1xuICAgICAgICAgIHNvdXJjZSA9IHV0aWwuam9pbihzZWN0aW9uLmNvbnN1bWVyLnNvdXJjZVJvb3QsIHNvdXJjZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc291cmNlcy5hZGQoc291cmNlKTtcbiAgICAgICAgc291cmNlID0gdGhpcy5fc291cmNlcy5pbmRleE9mKHNvdXJjZSk7XG5cbiAgICAgICAgdmFyIG5hbWUgPSBzZWN0aW9uLmNvbnN1bWVyLl9uYW1lcy5hdChtYXBwaW5nLm5hbWUpO1xuICAgICAgICB0aGlzLl9uYW1lcy5hZGQobmFtZSk7XG4gICAgICAgIG5hbWUgPSB0aGlzLl9uYW1lcy5pbmRleE9mKG5hbWUpO1xuXG4gICAgICAgIC8vIFRoZSBtYXBwaW5ncyBjb21pbmcgZnJvbSB0aGUgY29uc3VtZXIgZm9yIHRoZSBzZWN0aW9uIGhhdmVcbiAgICAgICAgLy8gZ2VuZXJhdGVkIHBvc2l0aW9ucyByZWxhdGl2ZSB0byB0aGUgc3RhcnQgb2YgdGhlIHNlY3Rpb24sIHNvIHdlXG4gICAgICAgIC8vIG5lZWQgdG8gb2Zmc2V0IHRoZW0gdG8gYmUgcmVsYXRpdmUgdG8gdGhlIHN0YXJ0IG9mIHRoZSBjb25jYXRlbmF0ZWRcbiAgICAgICAgLy8gZ2VuZXJhdGVkIGZpbGUuXG4gICAgICAgIHZhciBhZGp1c3RlZE1hcHBpbmcgPSB7XG4gICAgICAgICAgc291cmNlOiBzb3VyY2UsXG4gICAgICAgICAgZ2VuZXJhdGVkTGluZTogbWFwcGluZy5nZW5lcmF0ZWRMaW5lICtcbiAgICAgICAgICAgIChzZWN0aW9uLmdlbmVyYXRlZE9mZnNldC5nZW5lcmF0ZWRMaW5lIC0gMSksXG4gICAgICAgICAgZ2VuZXJhdGVkQ29sdW1uOiBtYXBwaW5nLmdlbmVyYXRlZENvbHVtbiArXG4gICAgICAgICAgICAoc2VjdGlvbi5nZW5lcmF0ZWRPZmZzZXQuZ2VuZXJhdGVkTGluZSA9PT0gbWFwcGluZy5nZW5lcmF0ZWRMaW5lXG4gICAgICAgICAgICA/IHNlY3Rpb24uZ2VuZXJhdGVkT2Zmc2V0LmdlbmVyYXRlZENvbHVtbiAtIDFcbiAgICAgICAgICAgIDogMCksXG4gICAgICAgICAgb3JpZ2luYWxMaW5lOiBtYXBwaW5nLm9yaWdpbmFsTGluZSxcbiAgICAgICAgICBvcmlnaW5hbENvbHVtbjogbWFwcGluZy5vcmlnaW5hbENvbHVtbixcbiAgICAgICAgICBuYW1lOiBuYW1lXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5fX2dlbmVyYXRlZE1hcHBpbmdzLnB1c2goYWRqdXN0ZWRNYXBwaW5nKTtcbiAgICAgICAgaWYgKHR5cGVvZiBhZGp1c3RlZE1hcHBpbmcub3JpZ2luYWxMaW5lID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIHRoaXMuX19vcmlnaW5hbE1hcHBpbmdzLnB1c2goYWRqdXN0ZWRNYXBwaW5nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHF1aWNrU29ydCh0aGlzLl9fZ2VuZXJhdGVkTWFwcGluZ3MsIHV0aWwuY29tcGFyZUJ5R2VuZXJhdGVkUG9zaXRpb25zRGVmbGF0ZWQpO1xuICAgIHF1aWNrU29ydCh0aGlzLl9fb3JpZ2luYWxNYXBwaW5ncywgdXRpbC5jb21wYXJlQnlPcmlnaW5hbFBvc2l0aW9ucyk7XG4gIH07XG5cbmV4cG9ydHMuSW5kZXhlZFNvdXJjZU1hcENvbnN1bWVyID0gSW5kZXhlZFNvdXJjZU1hcENvbnN1bWVyO1xuIiwiLyogLSotIE1vZGU6IGpzOyBqcy1pbmRlbnQtbGV2ZWw6IDI7IC0qLSAqL1xuLypcbiAqIENvcHlyaWdodCAyMDExIE1vemlsbGEgRm91bmRhdGlvbiBhbmQgY29udHJpYnV0b3JzXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTmV3IEJTRCBsaWNlbnNlLiBTZWUgTElDRU5TRSBvcjpcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2VcbiAqL1xuXG52YXIgYmFzZTY0VkxRID0gcmVxdWlyZSgnLi9iYXNlNjQtdmxxJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyIEFycmF5U2V0ID0gcmVxdWlyZSgnLi9hcnJheS1zZXQnKS5BcnJheVNldDtcbnZhciBNYXBwaW5nTGlzdCA9IHJlcXVpcmUoJy4vbWFwcGluZy1saXN0JykuTWFwcGluZ0xpc3Q7XG5cbi8qKlxuICogQW4gaW5zdGFuY2Ugb2YgdGhlIFNvdXJjZU1hcEdlbmVyYXRvciByZXByZXNlbnRzIGEgc291cmNlIG1hcCB3aGljaCBpc1xuICogYmVpbmcgYnVpbHQgaW5jcmVtZW50YWxseS4gWW91IG1heSBwYXNzIGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmdcbiAqIHByb3BlcnRpZXM6XG4gKlxuICogICAtIGZpbGU6IFRoZSBmaWxlbmFtZSBvZiB0aGUgZ2VuZXJhdGVkIHNvdXJjZS5cbiAqICAgLSBzb3VyY2VSb290OiBBIHJvb3QgZm9yIGFsbCByZWxhdGl2ZSBVUkxzIGluIHRoaXMgc291cmNlIG1hcC5cbiAqL1xuZnVuY3Rpb24gU291cmNlTWFwR2VuZXJhdG9yKGFBcmdzKSB7XG4gIGlmICghYUFyZ3MpIHtcbiAgICBhQXJncyA9IHt9O1xuICB9XG4gIHRoaXMuX2ZpbGUgPSB1dGlsLmdldEFyZyhhQXJncywgJ2ZpbGUnLCBudWxsKTtcbiAgdGhpcy5fc291cmNlUm9vdCA9IHV0aWwuZ2V0QXJnKGFBcmdzLCAnc291cmNlUm9vdCcsIG51bGwpO1xuICB0aGlzLl9za2lwVmFsaWRhdGlvbiA9IHV0aWwuZ2V0QXJnKGFBcmdzLCAnc2tpcFZhbGlkYXRpb24nLCBmYWxzZSk7XG4gIHRoaXMuX3NvdXJjZXMgPSBuZXcgQXJyYXlTZXQoKTtcbiAgdGhpcy5fbmFtZXMgPSBuZXcgQXJyYXlTZXQoKTtcbiAgdGhpcy5fbWFwcGluZ3MgPSBuZXcgTWFwcGluZ0xpc3QoKTtcbiAgdGhpcy5fc291cmNlc0NvbnRlbnRzID0gbnVsbDtcbn1cblxuU291cmNlTWFwR2VuZXJhdG9yLnByb3RvdHlwZS5fdmVyc2lvbiA9IDM7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBTb3VyY2VNYXBHZW5lcmF0b3IgYmFzZWQgb24gYSBTb3VyY2VNYXBDb25zdW1lclxuICpcbiAqIEBwYXJhbSBhU291cmNlTWFwQ29uc3VtZXIgVGhlIFNvdXJjZU1hcC5cbiAqL1xuU291cmNlTWFwR2VuZXJhdG9yLmZyb21Tb3VyY2VNYXAgPVxuICBmdW5jdGlvbiBTb3VyY2VNYXBHZW5lcmF0b3JfZnJvbVNvdXJjZU1hcChhU291cmNlTWFwQ29uc3VtZXIpIHtcbiAgICB2YXIgc291cmNlUm9vdCA9IGFTb3VyY2VNYXBDb25zdW1lci5zb3VyY2VSb290O1xuICAgIHZhciBnZW5lcmF0b3IgPSBuZXcgU291cmNlTWFwR2VuZXJhdG9yKHtcbiAgICAgIGZpbGU6IGFTb3VyY2VNYXBDb25zdW1lci5maWxlLFxuICAgICAgc291cmNlUm9vdDogc291cmNlUm9vdFxuICAgIH0pO1xuICAgIGFTb3VyY2VNYXBDb25zdW1lci5lYWNoTWFwcGluZyhmdW5jdGlvbiAobWFwcGluZykge1xuICAgICAgdmFyIG5ld01hcHBpbmcgPSB7XG4gICAgICAgIGdlbmVyYXRlZDoge1xuICAgICAgICAgIGxpbmU6IG1hcHBpbmcuZ2VuZXJhdGVkTGluZSxcbiAgICAgICAgICBjb2x1bW46IG1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGlmIChtYXBwaW5nLnNvdXJjZSAhPSBudWxsKSB7XG4gICAgICAgIG5ld01hcHBpbmcuc291cmNlID0gbWFwcGluZy5zb3VyY2U7XG4gICAgICAgIGlmIChzb3VyY2VSb290ICE9IG51bGwpIHtcbiAgICAgICAgICBuZXdNYXBwaW5nLnNvdXJjZSA9IHV0aWwucmVsYXRpdmUoc291cmNlUm9vdCwgbmV3TWFwcGluZy5zb3VyY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgbmV3TWFwcGluZy5vcmlnaW5hbCA9IHtcbiAgICAgICAgICBsaW5lOiBtYXBwaW5nLm9yaWdpbmFsTGluZSxcbiAgICAgICAgICBjb2x1bW46IG1hcHBpbmcub3JpZ2luYWxDb2x1bW5cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAobWFwcGluZy5uYW1lICE9IG51bGwpIHtcbiAgICAgICAgICBuZXdNYXBwaW5nLm5hbWUgPSBtYXBwaW5nLm5hbWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZ2VuZXJhdG9yLmFkZE1hcHBpbmcobmV3TWFwcGluZyk7XG4gICAgfSk7XG4gICAgYVNvdXJjZU1hcENvbnN1bWVyLnNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAoc291cmNlRmlsZSkge1xuICAgICAgdmFyIGNvbnRlbnQgPSBhU291cmNlTWFwQ29uc3VtZXIuc291cmNlQ29udGVudEZvcihzb3VyY2VGaWxlKTtcbiAgICAgIGlmIChjb250ZW50ICE9IG51bGwpIHtcbiAgICAgICAgZ2VuZXJhdG9yLnNldFNvdXJjZUNvbnRlbnQoc291cmNlRmlsZSwgY29udGVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGdlbmVyYXRvcjtcbiAgfTtcblxuLyoqXG4gKiBBZGQgYSBzaW5nbGUgbWFwcGluZyBmcm9tIG9yaWdpbmFsIHNvdXJjZSBsaW5lIGFuZCBjb2x1bW4gdG8gdGhlIGdlbmVyYXRlZFxuICogc291cmNlJ3MgbGluZSBhbmQgY29sdW1uIGZvciB0aGlzIHNvdXJjZSBtYXAgYmVpbmcgY3JlYXRlZC4gVGhlIG1hcHBpbmdcbiAqIG9iamVjdCBzaG91bGQgaGF2ZSB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gKlxuICogICAtIGdlbmVyYXRlZDogQW4gb2JqZWN0IHdpdGggdGhlIGdlbmVyYXRlZCBsaW5lIGFuZCBjb2x1bW4gcG9zaXRpb25zLlxuICogICAtIG9yaWdpbmFsOiBBbiBvYmplY3Qgd2l0aCB0aGUgb3JpZ2luYWwgbGluZSBhbmQgY29sdW1uIHBvc2l0aW9ucy5cbiAqICAgLSBzb3VyY2U6IFRoZSBvcmlnaW5hbCBzb3VyY2UgZmlsZSAocmVsYXRpdmUgdG8gdGhlIHNvdXJjZVJvb3QpLlxuICogICAtIG5hbWU6IEFuIG9wdGlvbmFsIG9yaWdpbmFsIHRva2VuIG5hbWUgZm9yIHRoaXMgbWFwcGluZy5cbiAqL1xuU291cmNlTWFwR2VuZXJhdG9yLnByb3RvdHlwZS5hZGRNYXBwaW5nID1cbiAgZnVuY3Rpb24gU291cmNlTWFwR2VuZXJhdG9yX2FkZE1hcHBpbmcoYUFyZ3MpIHtcbiAgICB2YXIgZ2VuZXJhdGVkID0gdXRpbC5nZXRBcmcoYUFyZ3MsICdnZW5lcmF0ZWQnKTtcbiAgICB2YXIgb3JpZ2luYWwgPSB1dGlsLmdldEFyZyhhQXJncywgJ29yaWdpbmFsJywgbnVsbCk7XG4gICAgdmFyIHNvdXJjZSA9IHV0aWwuZ2V0QXJnKGFBcmdzLCAnc291cmNlJywgbnVsbCk7XG4gICAgdmFyIG5hbWUgPSB1dGlsLmdldEFyZyhhQXJncywgJ25hbWUnLCBudWxsKTtcblxuICAgIGlmICghdGhpcy5fc2tpcFZhbGlkYXRpb24pIHtcbiAgICAgIHRoaXMuX3ZhbGlkYXRlTWFwcGluZyhnZW5lcmF0ZWQsIG9yaWdpbmFsLCBzb3VyY2UsIG5hbWUpO1xuICAgIH1cblxuICAgIGlmIChzb3VyY2UgIT0gbnVsbCkge1xuICAgICAgc291cmNlID0gU3RyaW5nKHNvdXJjZSk7XG4gICAgICBpZiAoIXRoaXMuX3NvdXJjZXMuaGFzKHNvdXJjZSkpIHtcbiAgICAgICAgdGhpcy5fc291cmNlcy5hZGQoc291cmNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobmFtZSAhPSBudWxsKSB7XG4gICAgICBuYW1lID0gU3RyaW5nKG5hbWUpO1xuICAgICAgaWYgKCF0aGlzLl9uYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgICAgdGhpcy5fbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX21hcHBpbmdzLmFkZCh7XG4gICAgICBnZW5lcmF0ZWRMaW5lOiBnZW5lcmF0ZWQubGluZSxcbiAgICAgIGdlbmVyYXRlZENvbHVtbjogZ2VuZXJhdGVkLmNvbHVtbixcbiAgICAgIG9yaWdpbmFsTGluZTogb3JpZ2luYWwgIT0gbnVsbCAmJiBvcmlnaW5hbC5saW5lLFxuICAgICAgb3JpZ2luYWxDb2x1bW46IG9yaWdpbmFsICE9IG51bGwgJiYgb3JpZ2luYWwuY29sdW1uLFxuICAgICAgc291cmNlOiBzb3VyY2UsXG4gICAgICBuYW1lOiBuYW1lXG4gICAgfSk7XG4gIH07XG5cbi8qKlxuICogU2V0IHRoZSBzb3VyY2UgY29udGVudCBmb3IgYSBzb3VyY2UgZmlsZS5cbiAqL1xuU291cmNlTWFwR2VuZXJhdG9yLnByb3RvdHlwZS5zZXRTb3VyY2VDb250ZW50ID1cbiAgZnVuY3Rpb24gU291cmNlTWFwR2VuZXJhdG9yX3NldFNvdXJjZUNvbnRlbnQoYVNvdXJjZUZpbGUsIGFTb3VyY2VDb250ZW50KSB7XG4gICAgdmFyIHNvdXJjZSA9IGFTb3VyY2VGaWxlO1xuICAgIGlmICh0aGlzLl9zb3VyY2VSb290ICE9IG51bGwpIHtcbiAgICAgIHNvdXJjZSA9IHV0aWwucmVsYXRpdmUodGhpcy5fc291cmNlUm9vdCwgc291cmNlKTtcbiAgICB9XG5cbiAgICBpZiAoYVNvdXJjZUNvbnRlbnQgIT0gbnVsbCkge1xuICAgICAgLy8gQWRkIHRoZSBzb3VyY2UgY29udGVudCB0byB0aGUgX3NvdXJjZXNDb250ZW50cyBtYXAuXG4gICAgICAvLyBDcmVhdGUgYSBuZXcgX3NvdXJjZXNDb250ZW50cyBtYXAgaWYgdGhlIHByb3BlcnR5IGlzIG51bGwuXG4gICAgICBpZiAoIXRoaXMuX3NvdXJjZXNDb250ZW50cykge1xuICAgICAgICB0aGlzLl9zb3VyY2VzQ29udGVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgfVxuICAgICAgdGhpcy5fc291cmNlc0NvbnRlbnRzW3V0aWwudG9TZXRTdHJpbmcoc291cmNlKV0gPSBhU291cmNlQ29udGVudDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX3NvdXJjZXNDb250ZW50cykge1xuICAgICAgLy8gUmVtb3ZlIHRoZSBzb3VyY2UgZmlsZSBmcm9tIHRoZSBfc291cmNlc0NvbnRlbnRzIG1hcC5cbiAgICAgIC8vIElmIHRoZSBfc291cmNlc0NvbnRlbnRzIG1hcCBpcyBlbXB0eSwgc2V0IHRoZSBwcm9wZXJ0eSB0byBudWxsLlxuICAgICAgZGVsZXRlIHRoaXMuX3NvdXJjZXNDb250ZW50c1t1dGlsLnRvU2V0U3RyaW5nKHNvdXJjZSldO1xuICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMuX3NvdXJjZXNDb250ZW50cykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRoaXMuX3NvdXJjZXNDb250ZW50cyA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4vKipcbiAqIEFwcGxpZXMgdGhlIG1hcHBpbmdzIG9mIGEgc3ViLXNvdXJjZS1tYXAgZm9yIGEgc3BlY2lmaWMgc291cmNlIGZpbGUgdG8gdGhlXG4gKiBzb3VyY2UgbWFwIGJlaW5nIGdlbmVyYXRlZC4gRWFjaCBtYXBwaW5nIHRvIHRoZSBzdXBwbGllZCBzb3VyY2UgZmlsZSBpc1xuICogcmV3cml0dGVuIHVzaW5nIHRoZSBzdXBwbGllZCBzb3VyY2UgbWFwLiBOb3RlOiBUaGUgcmVzb2x1dGlvbiBmb3IgdGhlXG4gKiByZXN1bHRpbmcgbWFwcGluZ3MgaXMgdGhlIG1pbmltaXVtIG9mIHRoaXMgbWFwIGFuZCB0aGUgc3VwcGxpZWQgbWFwLlxuICpcbiAqIEBwYXJhbSBhU291cmNlTWFwQ29uc3VtZXIgVGhlIHNvdXJjZSBtYXAgdG8gYmUgYXBwbGllZC5cbiAqIEBwYXJhbSBhU291cmNlRmlsZSBPcHRpb25hbC4gVGhlIGZpbGVuYW1lIG9mIHRoZSBzb3VyY2UgZmlsZS5cbiAqICAgICAgICBJZiBvbWl0dGVkLCBTb3VyY2VNYXBDb25zdW1lcidzIGZpbGUgcHJvcGVydHkgd2lsbCBiZSB1c2VkLlxuICogQHBhcmFtIGFTb3VyY2VNYXBQYXRoIE9wdGlvbmFsLiBUaGUgZGlybmFtZSBvZiB0aGUgcGF0aCB0byB0aGUgc291cmNlIG1hcFxuICogICAgICAgIHRvIGJlIGFwcGxpZWQuIElmIHJlbGF0aXZlLCBpdCBpcyByZWxhdGl2ZSB0byB0aGUgU291cmNlTWFwQ29uc3VtZXIuXG4gKiAgICAgICAgVGhpcyBwYXJhbWV0ZXIgaXMgbmVlZGVkIHdoZW4gdGhlIHR3byBzb3VyY2UgbWFwcyBhcmVuJ3QgaW4gdGhlIHNhbWVcbiAqICAgICAgICBkaXJlY3RvcnksIGFuZCB0aGUgc291cmNlIG1hcCB0byBiZSBhcHBsaWVkIGNvbnRhaW5zIHJlbGF0aXZlIHNvdXJjZVxuICogICAgICAgIHBhdGhzLiBJZiBzbywgdGhvc2UgcmVsYXRpdmUgc291cmNlIHBhdGhzIG5lZWQgdG8gYmUgcmV3cml0dGVuXG4gKiAgICAgICAgcmVsYXRpdmUgdG8gdGhlIFNvdXJjZU1hcEdlbmVyYXRvci5cbiAqL1xuU291cmNlTWFwR2VuZXJhdG9yLnByb3RvdHlwZS5hcHBseVNvdXJjZU1hcCA9XG4gIGZ1bmN0aW9uIFNvdXJjZU1hcEdlbmVyYXRvcl9hcHBseVNvdXJjZU1hcChhU291cmNlTWFwQ29uc3VtZXIsIGFTb3VyY2VGaWxlLCBhU291cmNlTWFwUGF0aCkge1xuICAgIHZhciBzb3VyY2VGaWxlID0gYVNvdXJjZUZpbGU7XG4gICAgLy8gSWYgYVNvdXJjZUZpbGUgaXMgb21pdHRlZCwgd2Ugd2lsbCB1c2UgdGhlIGZpbGUgcHJvcGVydHkgb2YgdGhlIFNvdXJjZU1hcFxuICAgIGlmIChhU291cmNlRmlsZSA9PSBudWxsKSB7XG4gICAgICBpZiAoYVNvdXJjZU1hcENvbnN1bWVyLmZpbGUgPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ1NvdXJjZU1hcEdlbmVyYXRvci5wcm90b3R5cGUuYXBwbHlTb3VyY2VNYXAgcmVxdWlyZXMgZWl0aGVyIGFuIGV4cGxpY2l0IHNvdXJjZSBmaWxlLCAnICtcbiAgICAgICAgICAnb3IgdGhlIHNvdXJjZSBtYXBcXCdzIFwiZmlsZVwiIHByb3BlcnR5LiBCb3RoIHdlcmUgb21pdHRlZC4nXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBzb3VyY2VGaWxlID0gYVNvdXJjZU1hcENvbnN1bWVyLmZpbGU7XG4gICAgfVxuICAgIHZhciBzb3VyY2VSb290ID0gdGhpcy5fc291cmNlUm9vdDtcbiAgICAvLyBNYWtlIFwic291cmNlRmlsZVwiIHJlbGF0aXZlIGlmIGFuIGFic29sdXRlIFVybCBpcyBwYXNzZWQuXG4gICAgaWYgKHNvdXJjZVJvb3QgIT0gbnVsbCkge1xuICAgICAgc291cmNlRmlsZSA9IHV0aWwucmVsYXRpdmUoc291cmNlUm9vdCwgc291cmNlRmlsZSk7XG4gICAgfVxuICAgIC8vIEFwcGx5aW5nIHRoZSBTb3VyY2VNYXAgY2FuIGFkZCBhbmQgcmVtb3ZlIGl0ZW1zIGZyb20gdGhlIHNvdXJjZXMgYW5kXG4gICAgLy8gdGhlIG5hbWVzIGFycmF5LlxuICAgIHZhciBuZXdTb3VyY2VzID0gbmV3IEFycmF5U2V0KCk7XG4gICAgdmFyIG5ld05hbWVzID0gbmV3IEFycmF5U2V0KCk7XG5cbiAgICAvLyBGaW5kIG1hcHBpbmdzIGZvciB0aGUgXCJzb3VyY2VGaWxlXCJcbiAgICB0aGlzLl9tYXBwaW5ncy51bnNvcnRlZEZvckVhY2goZnVuY3Rpb24gKG1hcHBpbmcpIHtcbiAgICAgIGlmIChtYXBwaW5nLnNvdXJjZSA9PT0gc291cmNlRmlsZSAmJiBtYXBwaW5nLm9yaWdpbmFsTGluZSAhPSBudWxsKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGl0IGNhbiBiZSBtYXBwZWQgYnkgdGhlIHNvdXJjZSBtYXAsIHRoZW4gdXBkYXRlIHRoZSBtYXBwaW5nLlxuICAgICAgICB2YXIgb3JpZ2luYWwgPSBhU291cmNlTWFwQ29uc3VtZXIub3JpZ2luYWxQb3NpdGlvbkZvcih7XG4gICAgICAgICAgbGluZTogbWFwcGluZy5vcmlnaW5hbExpbmUsXG4gICAgICAgICAgY29sdW1uOiBtYXBwaW5nLm9yaWdpbmFsQ29sdW1uXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAob3JpZ2luYWwuc291cmNlICE9IG51bGwpIHtcbiAgICAgICAgICAvLyBDb3B5IG1hcHBpbmdcbiAgICAgICAgICBtYXBwaW5nLnNvdXJjZSA9IG9yaWdpbmFsLnNvdXJjZTtcbiAgICAgICAgICBpZiAoYVNvdXJjZU1hcFBhdGggIT0gbnVsbCkge1xuICAgICAgICAgICAgbWFwcGluZy5zb3VyY2UgPSB1dGlsLmpvaW4oYVNvdXJjZU1hcFBhdGgsIG1hcHBpbmcuc291cmNlKVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc291cmNlUm9vdCAhPSBudWxsKSB7XG4gICAgICAgICAgICBtYXBwaW5nLnNvdXJjZSA9IHV0aWwucmVsYXRpdmUoc291cmNlUm9vdCwgbWFwcGluZy5zb3VyY2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBtYXBwaW5nLm9yaWdpbmFsTGluZSA9IG9yaWdpbmFsLmxpbmU7XG4gICAgICAgICAgbWFwcGluZy5vcmlnaW5hbENvbHVtbiA9IG9yaWdpbmFsLmNvbHVtbjtcbiAgICAgICAgICBpZiAob3JpZ2luYWwubmFtZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBtYXBwaW5nLm5hbWUgPSBvcmlnaW5hbC5uYW1lO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgc291cmNlID0gbWFwcGluZy5zb3VyY2U7XG4gICAgICBpZiAoc291cmNlICE9IG51bGwgJiYgIW5ld1NvdXJjZXMuaGFzKHNvdXJjZSkpIHtcbiAgICAgICAgbmV3U291cmNlcy5hZGQoc291cmNlKTtcbiAgICAgIH1cblxuICAgICAgdmFyIG5hbWUgPSBtYXBwaW5nLm5hbWU7XG4gICAgICBpZiAobmFtZSAhPSBudWxsICYmICFuZXdOYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgICAgbmV3TmFtZXMuYWRkKG5hbWUpO1xuICAgICAgfVxuXG4gICAgfSwgdGhpcyk7XG4gICAgdGhpcy5fc291cmNlcyA9IG5ld1NvdXJjZXM7XG4gICAgdGhpcy5fbmFtZXMgPSBuZXdOYW1lcztcblxuICAgIC8vIENvcHkgc291cmNlc0NvbnRlbnRzIG9mIGFwcGxpZWQgbWFwLlxuICAgIGFTb3VyY2VNYXBDb25zdW1lci5zb3VyY2VzLmZvckVhY2goZnVuY3Rpb24gKHNvdXJjZUZpbGUpIHtcbiAgICAgIHZhciBjb250ZW50ID0gYVNvdXJjZU1hcENvbnN1bWVyLnNvdXJjZUNvbnRlbnRGb3Ioc291cmNlRmlsZSk7XG4gICAgICBpZiAoY29udGVudCAhPSBudWxsKSB7XG4gICAgICAgIGlmIChhU291cmNlTWFwUGF0aCAhPSBudWxsKSB7XG4gICAgICAgICAgc291cmNlRmlsZSA9IHV0aWwuam9pbihhU291cmNlTWFwUGF0aCwgc291cmNlRmlsZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNvdXJjZVJvb3QgIT0gbnVsbCkge1xuICAgICAgICAgIHNvdXJjZUZpbGUgPSB1dGlsLnJlbGF0aXZlKHNvdXJjZVJvb3QsIHNvdXJjZUZpbGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0U291cmNlQ29udGVudChzb3VyY2VGaWxlLCBjb250ZW50KTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKTtcbiAgfTtcblxuLyoqXG4gKiBBIG1hcHBpbmcgY2FuIGhhdmUgb25lIG9mIHRoZSB0aHJlZSBsZXZlbHMgb2YgZGF0YTpcbiAqXG4gKiAgIDEuIEp1c3QgdGhlIGdlbmVyYXRlZCBwb3NpdGlvbi5cbiAqICAgMi4gVGhlIEdlbmVyYXRlZCBwb3NpdGlvbiwgb3JpZ2luYWwgcG9zaXRpb24sIGFuZCBvcmlnaW5hbCBzb3VyY2UuXG4gKiAgIDMuIEdlbmVyYXRlZCBhbmQgb3JpZ2luYWwgcG9zaXRpb24sIG9yaWdpbmFsIHNvdXJjZSwgYXMgd2VsbCBhcyBhIG5hbWVcbiAqICAgICAgdG9rZW4uXG4gKlxuICogVG8gbWFpbnRhaW4gY29uc2lzdGVuY3ksIHdlIHZhbGlkYXRlIHRoYXQgYW55IG5ldyBtYXBwaW5nIGJlaW5nIGFkZGVkIGZhbGxzXG4gKiBpbiB0byBvbmUgb2YgdGhlc2UgY2F0ZWdvcmllcy5cbiAqL1xuU291cmNlTWFwR2VuZXJhdG9yLnByb3RvdHlwZS5fdmFsaWRhdGVNYXBwaW5nID1cbiAgZnVuY3Rpb24gU291cmNlTWFwR2VuZXJhdG9yX3ZhbGlkYXRlTWFwcGluZyhhR2VuZXJhdGVkLCBhT3JpZ2luYWwsIGFTb3VyY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYU5hbWUpIHtcbiAgICBpZiAoYUdlbmVyYXRlZCAmJiAnbGluZScgaW4gYUdlbmVyYXRlZCAmJiAnY29sdW1uJyBpbiBhR2VuZXJhdGVkXG4gICAgICAgICYmIGFHZW5lcmF0ZWQubGluZSA+IDAgJiYgYUdlbmVyYXRlZC5jb2x1bW4gPj0gMFxuICAgICAgICAmJiAhYU9yaWdpbmFsICYmICFhU291cmNlICYmICFhTmFtZSkge1xuICAgICAgLy8gQ2FzZSAxLlxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBlbHNlIGlmIChhR2VuZXJhdGVkICYmICdsaW5lJyBpbiBhR2VuZXJhdGVkICYmICdjb2x1bW4nIGluIGFHZW5lcmF0ZWRcbiAgICAgICAgICAgICAmJiBhT3JpZ2luYWwgJiYgJ2xpbmUnIGluIGFPcmlnaW5hbCAmJiAnY29sdW1uJyBpbiBhT3JpZ2luYWxcbiAgICAgICAgICAgICAmJiBhR2VuZXJhdGVkLmxpbmUgPiAwICYmIGFHZW5lcmF0ZWQuY29sdW1uID49IDBcbiAgICAgICAgICAgICAmJiBhT3JpZ2luYWwubGluZSA+IDAgJiYgYU9yaWdpbmFsLmNvbHVtbiA+PSAwXG4gICAgICAgICAgICAgJiYgYVNvdXJjZSkge1xuICAgICAgLy8gQ2FzZXMgMiBhbmQgMy5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbWFwcGluZzogJyArIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgZ2VuZXJhdGVkOiBhR2VuZXJhdGVkLFxuICAgICAgICBzb3VyY2U6IGFTb3VyY2UsXG4gICAgICAgIG9yaWdpbmFsOiBhT3JpZ2luYWwsXG4gICAgICAgIG5hbWU6IGFOYW1lXG4gICAgICB9KSk7XG4gICAgfVxuICB9O1xuXG4vKipcbiAqIFNlcmlhbGl6ZSB0aGUgYWNjdW11bGF0ZWQgbWFwcGluZ3MgaW4gdG8gdGhlIHN0cmVhbSBvZiBiYXNlIDY0IFZMUXNcbiAqIHNwZWNpZmllZCBieSB0aGUgc291cmNlIG1hcCBmb3JtYXQuXG4gKi9cblNvdXJjZU1hcEdlbmVyYXRvci5wcm90b3R5cGUuX3NlcmlhbGl6ZU1hcHBpbmdzID1cbiAgZnVuY3Rpb24gU291cmNlTWFwR2VuZXJhdG9yX3NlcmlhbGl6ZU1hcHBpbmdzKCkge1xuICAgIHZhciBwcmV2aW91c0dlbmVyYXRlZENvbHVtbiA9IDA7XG4gICAgdmFyIHByZXZpb3VzR2VuZXJhdGVkTGluZSA9IDE7XG4gICAgdmFyIHByZXZpb3VzT3JpZ2luYWxDb2x1bW4gPSAwO1xuICAgIHZhciBwcmV2aW91c09yaWdpbmFsTGluZSA9IDA7XG4gICAgdmFyIHByZXZpb3VzTmFtZSA9IDA7XG4gICAgdmFyIHByZXZpb3VzU291cmNlID0gMDtcbiAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgdmFyIG5leHQ7XG4gICAgdmFyIG1hcHBpbmc7XG4gICAgdmFyIG5hbWVJZHg7XG4gICAgdmFyIHNvdXJjZUlkeDtcblxuICAgIHZhciBtYXBwaW5ncyA9IHRoaXMuX21hcHBpbmdzLnRvQXJyYXkoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gbWFwcGluZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIG1hcHBpbmcgPSBtYXBwaW5nc1tpXTtcbiAgICAgIG5leHQgPSAnJ1xuXG4gICAgICBpZiAobWFwcGluZy5nZW5lcmF0ZWRMaW5lICE9PSBwcmV2aW91c0dlbmVyYXRlZExpbmUpIHtcbiAgICAgICAgcHJldmlvdXNHZW5lcmF0ZWRDb2x1bW4gPSAwO1xuICAgICAgICB3aGlsZSAobWFwcGluZy5nZW5lcmF0ZWRMaW5lICE9PSBwcmV2aW91c0dlbmVyYXRlZExpbmUpIHtcbiAgICAgICAgICBuZXh0ICs9ICc7JztcbiAgICAgICAgICBwcmV2aW91c0dlbmVyYXRlZExpbmUrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgIGlmICghdXRpbC5jb21wYXJlQnlHZW5lcmF0ZWRQb3NpdGlvbnNJbmZsYXRlZChtYXBwaW5nLCBtYXBwaW5nc1tpIC0gMV0pKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmV4dCArPSAnLCc7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbmV4dCArPSBiYXNlNjRWTFEuZW5jb2RlKG1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIHByZXZpb3VzR2VuZXJhdGVkQ29sdW1uKTtcbiAgICAgIHByZXZpb3VzR2VuZXJhdGVkQ29sdW1uID0gbWFwcGluZy5nZW5lcmF0ZWRDb2x1bW47XG5cbiAgICAgIGlmIChtYXBwaW5nLnNvdXJjZSAhPSBudWxsKSB7XG4gICAgICAgIHNvdXJjZUlkeCA9IHRoaXMuX3NvdXJjZXMuaW5kZXhPZihtYXBwaW5nLnNvdXJjZSk7XG4gICAgICAgIG5leHQgKz0gYmFzZTY0VkxRLmVuY29kZShzb3VyY2VJZHggLSBwcmV2aW91c1NvdXJjZSk7XG4gICAgICAgIHByZXZpb3VzU291cmNlID0gc291cmNlSWR4O1xuXG4gICAgICAgIC8vIGxpbmVzIGFyZSBzdG9yZWQgMC1iYXNlZCBpbiBTb3VyY2VNYXAgc3BlYyB2ZXJzaW9uIDNcbiAgICAgICAgbmV4dCArPSBiYXNlNjRWTFEuZW5jb2RlKG1hcHBpbmcub3JpZ2luYWxMaW5lIC0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIHByZXZpb3VzT3JpZ2luYWxMaW5lKTtcbiAgICAgICAgcHJldmlvdXNPcmlnaW5hbExpbmUgPSBtYXBwaW5nLm9yaWdpbmFsTGluZSAtIDE7XG5cbiAgICAgICAgbmV4dCArPSBiYXNlNjRWTFEuZW5jb2RlKG1hcHBpbmcub3JpZ2luYWxDb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLSBwcmV2aW91c09yaWdpbmFsQ29sdW1uKTtcbiAgICAgICAgcHJldmlvdXNPcmlnaW5hbENvbHVtbiA9IG1hcHBpbmcub3JpZ2luYWxDb2x1bW47XG5cbiAgICAgICAgaWYgKG1hcHBpbmcubmFtZSAhPSBudWxsKSB7XG4gICAgICAgICAgbmFtZUlkeCA9IHRoaXMuX25hbWVzLmluZGV4T2YobWFwcGluZy5uYW1lKTtcbiAgICAgICAgICBuZXh0ICs9IGJhc2U2NFZMUS5lbmNvZGUobmFtZUlkeCAtIHByZXZpb3VzTmFtZSk7XG4gICAgICAgICAgcHJldmlvdXNOYW1lID0gbmFtZUlkeDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXN1bHQgKz0gbmV4dDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG5Tb3VyY2VNYXBHZW5lcmF0b3IucHJvdG90eXBlLl9nZW5lcmF0ZVNvdXJjZXNDb250ZW50ID1cbiAgZnVuY3Rpb24gU291cmNlTWFwR2VuZXJhdG9yX2dlbmVyYXRlU291cmNlc0NvbnRlbnQoYVNvdXJjZXMsIGFTb3VyY2VSb290KSB7XG4gICAgcmV0dXJuIGFTb3VyY2VzLm1hcChmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgICBpZiAoIXRoaXMuX3NvdXJjZXNDb250ZW50cykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmIChhU291cmNlUm9vdCAhPSBudWxsKSB7XG4gICAgICAgIHNvdXJjZSA9IHV0aWwucmVsYXRpdmUoYVNvdXJjZVJvb3QsIHNvdXJjZSk7XG4gICAgICB9XG4gICAgICB2YXIga2V5ID0gdXRpbC50b1NldFN0cmluZyhzb3VyY2UpO1xuICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLl9zb3VyY2VzQ29udGVudHMsIGtleSlcbiAgICAgICAgPyB0aGlzLl9zb3VyY2VzQ29udGVudHNba2V5XVxuICAgICAgICA6IG51bGw7XG4gICAgfSwgdGhpcyk7XG4gIH07XG5cbi8qKlxuICogRXh0ZXJuYWxpemUgdGhlIHNvdXJjZSBtYXAuXG4gKi9cblNvdXJjZU1hcEdlbmVyYXRvci5wcm90b3R5cGUudG9KU09OID1cbiAgZnVuY3Rpb24gU291cmNlTWFwR2VuZXJhdG9yX3RvSlNPTigpIHtcbiAgICB2YXIgbWFwID0ge1xuICAgICAgdmVyc2lvbjogdGhpcy5fdmVyc2lvbixcbiAgICAgIHNvdXJjZXM6IHRoaXMuX3NvdXJjZXMudG9BcnJheSgpLFxuICAgICAgbmFtZXM6IHRoaXMuX25hbWVzLnRvQXJyYXkoKSxcbiAgICAgIG1hcHBpbmdzOiB0aGlzLl9zZXJpYWxpemVNYXBwaW5ncygpXG4gICAgfTtcbiAgICBpZiAodGhpcy5fZmlsZSAhPSBudWxsKSB7XG4gICAgICBtYXAuZmlsZSA9IHRoaXMuX2ZpbGU7XG4gICAgfVxuICAgIGlmICh0aGlzLl9zb3VyY2VSb290ICE9IG51bGwpIHtcbiAgICAgIG1hcC5zb3VyY2VSb290ID0gdGhpcy5fc291cmNlUm9vdDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3NvdXJjZXNDb250ZW50cykge1xuICAgICAgbWFwLnNvdXJjZXNDb250ZW50ID0gdGhpcy5fZ2VuZXJhdGVTb3VyY2VzQ29udGVudChtYXAuc291cmNlcywgbWFwLnNvdXJjZVJvb3QpO1xuICAgIH1cblxuICAgIHJldHVybiBtYXA7XG4gIH07XG5cbi8qKlxuICogUmVuZGVyIHRoZSBzb3VyY2UgbWFwIGJlaW5nIGdlbmVyYXRlZCB0byBhIHN0cmluZy5cbiAqL1xuU291cmNlTWFwR2VuZXJhdG9yLnByb3RvdHlwZS50b1N0cmluZyA9XG4gIGZ1bmN0aW9uIFNvdXJjZU1hcEdlbmVyYXRvcl90b1N0cmluZygpIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy50b0pTT04oKSk7XG4gIH07XG5cbmV4cG9ydHMuU291cmNlTWFwR2VuZXJhdG9yID0gU291cmNlTWFwR2VuZXJhdG9yO1xuIiwiLyogLSotIE1vZGU6IGpzOyBqcy1pbmRlbnQtbGV2ZWw6IDI7IC0qLSAqL1xuLypcbiAqIENvcHlyaWdodCAyMDExIE1vemlsbGEgRm91bmRhdGlvbiBhbmQgY29udHJpYnV0b3JzXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTmV3IEJTRCBsaWNlbnNlLiBTZWUgTElDRU5TRSBvcjpcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2VcbiAqL1xuXG52YXIgU291cmNlTWFwR2VuZXJhdG9yID0gcmVxdWlyZSgnLi9zb3VyY2UtbWFwLWdlbmVyYXRvcicpLlNvdXJjZU1hcEdlbmVyYXRvcjtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbi8vIE1hdGNoZXMgYSBXaW5kb3dzLXN0eWxlIGBcXHJcXG5gIG5ld2xpbmUgb3IgYSBgXFxuYCBuZXdsaW5lIHVzZWQgYnkgYWxsIG90aGVyXG4vLyBvcGVyYXRpbmcgc3lzdGVtcyB0aGVzZSBkYXlzIChjYXB0dXJpbmcgdGhlIHJlc3VsdCkuXG52YXIgUkVHRVhfTkVXTElORSA9IC8oXFxyP1xcbikvO1xuXG4vLyBOZXdsaW5lIGNoYXJhY3RlciBjb2RlIGZvciBjaGFyQ29kZUF0KCkgY29tcGFyaXNvbnNcbnZhciBORVdMSU5FX0NPREUgPSAxMDtcblxuLy8gUHJpdmF0ZSBzeW1ib2wgZm9yIGlkZW50aWZ5aW5nIGBTb3VyY2VOb2RlYHMgd2hlbiBtdWx0aXBsZSB2ZXJzaW9ucyBvZlxuLy8gdGhlIHNvdXJjZS1tYXAgbGlicmFyeSBhcmUgbG9hZGVkLiBUaGlzIE1VU1QgTk9UIENIQU5HRSBhY3Jvc3Ncbi8vIHZlcnNpb25zIVxudmFyIGlzU291cmNlTm9kZSA9IFwiJCQkaXNTb3VyY2VOb2RlJCQkXCI7XG5cbi8qKlxuICogU291cmNlTm9kZXMgcHJvdmlkZSBhIHdheSB0byBhYnN0cmFjdCBvdmVyIGludGVycG9sYXRpbmcvY29uY2F0ZW5hdGluZ1xuICogc25pcHBldHMgb2YgZ2VuZXJhdGVkIEphdmFTY3JpcHQgc291cmNlIGNvZGUgd2hpbGUgbWFpbnRhaW5pbmcgdGhlIGxpbmUgYW5kXG4gKiBjb2x1bW4gaW5mb3JtYXRpb24gYXNzb2NpYXRlZCB3aXRoIHRoZSBvcmlnaW5hbCBzb3VyY2UgY29kZS5cbiAqXG4gKiBAcGFyYW0gYUxpbmUgVGhlIG9yaWdpbmFsIGxpbmUgbnVtYmVyLlxuICogQHBhcmFtIGFDb2x1bW4gVGhlIG9yaWdpbmFsIGNvbHVtbiBudW1iZXIuXG4gKiBAcGFyYW0gYVNvdXJjZSBUaGUgb3JpZ2luYWwgc291cmNlJ3MgZmlsZW5hbWUuXG4gKiBAcGFyYW0gYUNodW5rcyBPcHRpb25hbC4gQW4gYXJyYXkgb2Ygc3RyaW5ncyB3aGljaCBhcmUgc25pcHBldHMgb2ZcbiAqICAgICAgICBnZW5lcmF0ZWQgSlMsIG9yIG90aGVyIFNvdXJjZU5vZGVzLlxuICogQHBhcmFtIGFOYW1lIFRoZSBvcmlnaW5hbCBpZGVudGlmaWVyLlxuICovXG5mdW5jdGlvbiBTb3VyY2VOb2RlKGFMaW5lLCBhQ29sdW1uLCBhU291cmNlLCBhQ2h1bmtzLCBhTmFtZSkge1xuICB0aGlzLmNoaWxkcmVuID0gW107XG4gIHRoaXMuc291cmNlQ29udGVudHMgPSB7fTtcbiAgdGhpcy5saW5lID0gYUxpbmUgPT0gbnVsbCA/IG51bGwgOiBhTGluZTtcbiAgdGhpcy5jb2x1bW4gPSBhQ29sdW1uID09IG51bGwgPyBudWxsIDogYUNvbHVtbjtcbiAgdGhpcy5zb3VyY2UgPSBhU291cmNlID09IG51bGwgPyBudWxsIDogYVNvdXJjZTtcbiAgdGhpcy5uYW1lID0gYU5hbWUgPT0gbnVsbCA/IG51bGwgOiBhTmFtZTtcbiAgdGhpc1tpc1NvdXJjZU5vZGVdID0gdHJ1ZTtcbiAgaWYgKGFDaHVua3MgIT0gbnVsbCkgdGhpcy5hZGQoYUNodW5rcyk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFNvdXJjZU5vZGUgZnJvbSBnZW5lcmF0ZWQgY29kZSBhbmQgYSBTb3VyY2VNYXBDb25zdW1lci5cbiAqXG4gKiBAcGFyYW0gYUdlbmVyYXRlZENvZGUgVGhlIGdlbmVyYXRlZCBjb2RlXG4gKiBAcGFyYW0gYVNvdXJjZU1hcENvbnN1bWVyIFRoZSBTb3VyY2VNYXAgZm9yIHRoZSBnZW5lcmF0ZWQgY29kZVxuICogQHBhcmFtIGFSZWxhdGl2ZVBhdGggT3B0aW9uYWwuIFRoZSBwYXRoIHRoYXQgcmVsYXRpdmUgc291cmNlcyBpbiB0aGVcbiAqICAgICAgICBTb3VyY2VNYXBDb25zdW1lciBzaG91bGQgYmUgcmVsYXRpdmUgdG8uXG4gKi9cblNvdXJjZU5vZGUuZnJvbVN0cmluZ1dpdGhTb3VyY2VNYXAgPVxuICBmdW5jdGlvbiBTb3VyY2VOb2RlX2Zyb21TdHJpbmdXaXRoU291cmNlTWFwKGFHZW5lcmF0ZWRDb2RlLCBhU291cmNlTWFwQ29uc3VtZXIsIGFSZWxhdGl2ZVBhdGgpIHtcbiAgICAvLyBUaGUgU291cmNlTm9kZSB3ZSB3YW50IHRvIGZpbGwgd2l0aCB0aGUgZ2VuZXJhdGVkIGNvZGVcbiAgICAvLyBhbmQgdGhlIFNvdXJjZU1hcFxuICAgIHZhciBub2RlID0gbmV3IFNvdXJjZU5vZGUoKTtcblxuICAgIC8vIEFsbCBldmVuIGluZGljZXMgb2YgdGhpcyBhcnJheSBhcmUgb25lIGxpbmUgb2YgdGhlIGdlbmVyYXRlZCBjb2RlLFxuICAgIC8vIHdoaWxlIGFsbCBvZGQgaW5kaWNlcyBhcmUgdGhlIG5ld2xpbmVzIGJldHdlZW4gdHdvIGFkamFjZW50IGxpbmVzXG4gICAgLy8gKHNpbmNlIGBSRUdFWF9ORVdMSU5FYCBjYXB0dXJlcyBpdHMgbWF0Y2gpLlxuICAgIC8vIFByb2Nlc3NlZCBmcmFnbWVudHMgYXJlIHJlbW92ZWQgZnJvbSB0aGlzIGFycmF5LCBieSBjYWxsaW5nIGBzaGlmdE5leHRMaW5lYC5cbiAgICB2YXIgcmVtYWluaW5nTGluZXMgPSBhR2VuZXJhdGVkQ29kZS5zcGxpdChSRUdFWF9ORVdMSU5FKTtcbiAgICB2YXIgc2hpZnROZXh0TGluZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxpbmVDb250ZW50cyA9IHJlbWFpbmluZ0xpbmVzLnNoaWZ0KCk7XG4gICAgICAvLyBUaGUgbGFzdCBsaW5lIG9mIGEgZmlsZSBtaWdodCBub3QgaGF2ZSBhIG5ld2xpbmUuXG4gICAgICB2YXIgbmV3TGluZSA9IHJlbWFpbmluZ0xpbmVzLnNoaWZ0KCkgfHwgXCJcIjtcbiAgICAgIHJldHVybiBsaW5lQ29udGVudHMgKyBuZXdMaW5lO1xuICAgIH07XG5cbiAgICAvLyBXZSBuZWVkIHRvIHJlbWVtYmVyIHRoZSBwb3NpdGlvbiBvZiBcInJlbWFpbmluZ0xpbmVzXCJcbiAgICB2YXIgbGFzdEdlbmVyYXRlZExpbmUgPSAxLCBsYXN0R2VuZXJhdGVkQ29sdW1uID0gMDtcblxuICAgIC8vIFRoZSBnZW5lcmF0ZSBTb3VyY2VOb2RlcyB3ZSBuZWVkIGEgY29kZSByYW5nZS5cbiAgICAvLyBUbyBleHRyYWN0IGl0IGN1cnJlbnQgYW5kIGxhc3QgbWFwcGluZyBpcyB1c2VkLlxuICAgIC8vIEhlcmUgd2Ugc3RvcmUgdGhlIGxhc3QgbWFwcGluZy5cbiAgICB2YXIgbGFzdE1hcHBpbmcgPSBudWxsO1xuXG4gICAgYVNvdXJjZU1hcENvbnN1bWVyLmVhY2hNYXBwaW5nKGZ1bmN0aW9uIChtYXBwaW5nKSB7XG4gICAgICBpZiAobGFzdE1hcHBpbmcgIT09IG51bGwpIHtcbiAgICAgICAgLy8gV2UgYWRkIHRoZSBjb2RlIGZyb20gXCJsYXN0TWFwcGluZ1wiIHRvIFwibWFwcGluZ1wiOlxuICAgICAgICAvLyBGaXJzdCBjaGVjayBpZiB0aGVyZSBpcyBhIG5ldyBsaW5lIGluIGJldHdlZW4uXG4gICAgICAgIGlmIChsYXN0R2VuZXJhdGVkTGluZSA8IG1hcHBpbmcuZ2VuZXJhdGVkTGluZSkge1xuICAgICAgICAgIC8vIEFzc29jaWF0ZSBmaXJzdCBsaW5lIHdpdGggXCJsYXN0TWFwcGluZ1wiXG4gICAgICAgICAgYWRkTWFwcGluZ1dpdGhDb2RlKGxhc3RNYXBwaW5nLCBzaGlmdE5leHRMaW5lKCkpO1xuICAgICAgICAgIGxhc3RHZW5lcmF0ZWRMaW5lKys7XG4gICAgICAgICAgbGFzdEdlbmVyYXRlZENvbHVtbiA9IDA7XG4gICAgICAgICAgLy8gVGhlIHJlbWFpbmluZyBjb2RlIGlzIGFkZGVkIHdpdGhvdXQgbWFwcGluZ1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIG5ldyBsaW5lIGluIGJldHdlZW4uXG4gICAgICAgICAgLy8gQXNzb2NpYXRlIHRoZSBjb2RlIGJldHdlZW4gXCJsYXN0R2VuZXJhdGVkQ29sdW1uXCIgYW5kXG4gICAgICAgICAgLy8gXCJtYXBwaW5nLmdlbmVyYXRlZENvbHVtblwiIHdpdGggXCJsYXN0TWFwcGluZ1wiXG4gICAgICAgICAgdmFyIG5leHRMaW5lID0gcmVtYWluaW5nTGluZXNbMF07XG4gICAgICAgICAgdmFyIGNvZGUgPSBuZXh0TGluZS5zdWJzdHIoMCwgbWFwcGluZy5nZW5lcmF0ZWRDb2x1bW4gLVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RHZW5lcmF0ZWRDb2x1bW4pO1xuICAgICAgICAgIHJlbWFpbmluZ0xpbmVzWzBdID0gbmV4dExpbmUuc3Vic3RyKG1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uIC1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0R2VuZXJhdGVkQ29sdW1uKTtcbiAgICAgICAgICBsYXN0R2VuZXJhdGVkQ29sdW1uID0gbWFwcGluZy5nZW5lcmF0ZWRDb2x1bW47XG4gICAgICAgICAgYWRkTWFwcGluZ1dpdGhDb2RlKGxhc3RNYXBwaW5nLCBjb2RlKTtcbiAgICAgICAgICAvLyBObyBtb3JlIHJlbWFpbmluZyBjb2RlLCBjb250aW51ZVxuICAgICAgICAgIGxhc3RNYXBwaW5nID0gbWFwcGluZztcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIFdlIGFkZCB0aGUgZ2VuZXJhdGVkIGNvZGUgdW50aWwgdGhlIGZpcnN0IG1hcHBpbmdcbiAgICAgIC8vIHRvIHRoZSBTb3VyY2VOb2RlIHdpdGhvdXQgYW55IG1hcHBpbmcuXG4gICAgICAvLyBFYWNoIGxpbmUgaXMgYWRkZWQgYXMgc2VwYXJhdGUgc3RyaW5nLlxuICAgICAgd2hpbGUgKGxhc3RHZW5lcmF0ZWRMaW5lIDwgbWFwcGluZy5nZW5lcmF0ZWRMaW5lKSB7XG4gICAgICAgIG5vZGUuYWRkKHNoaWZ0TmV4dExpbmUoKSk7XG4gICAgICAgIGxhc3RHZW5lcmF0ZWRMaW5lKys7XG4gICAgICB9XG4gICAgICBpZiAobGFzdEdlbmVyYXRlZENvbHVtbiA8IG1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uKSB7XG4gICAgICAgIHZhciBuZXh0TGluZSA9IHJlbWFpbmluZ0xpbmVzWzBdO1xuICAgICAgICBub2RlLmFkZChuZXh0TGluZS5zdWJzdHIoMCwgbWFwcGluZy5nZW5lcmF0ZWRDb2x1bW4pKTtcbiAgICAgICAgcmVtYWluaW5nTGluZXNbMF0gPSBuZXh0TGluZS5zdWJzdHIobWFwcGluZy5nZW5lcmF0ZWRDb2x1bW4pO1xuICAgICAgICBsYXN0R2VuZXJhdGVkQ29sdW1uID0gbWFwcGluZy5nZW5lcmF0ZWRDb2x1bW47XG4gICAgICB9XG4gICAgICBsYXN0TWFwcGluZyA9IG1hcHBpbmc7XG4gICAgfSwgdGhpcyk7XG4gICAgLy8gV2UgaGF2ZSBwcm9jZXNzZWQgYWxsIG1hcHBpbmdzLlxuICAgIGlmIChyZW1haW5pbmdMaW5lcy5sZW5ndGggPiAwKSB7XG4gICAgICBpZiAobGFzdE1hcHBpbmcpIHtcbiAgICAgICAgLy8gQXNzb2NpYXRlIHRoZSByZW1haW5pbmcgY29kZSBpbiB0aGUgY3VycmVudCBsaW5lIHdpdGggXCJsYXN0TWFwcGluZ1wiXG4gICAgICAgIGFkZE1hcHBpbmdXaXRoQ29kZShsYXN0TWFwcGluZywgc2hpZnROZXh0TGluZSgpKTtcbiAgICAgIH1cbiAgICAgIC8vIGFuZCBhZGQgdGhlIHJlbWFpbmluZyBsaW5lcyB3aXRob3V0IGFueSBtYXBwaW5nXG4gICAgICBub2RlLmFkZChyZW1haW5pbmdMaW5lcy5qb2luKFwiXCIpKTtcbiAgICB9XG5cbiAgICAvLyBDb3B5IHNvdXJjZXNDb250ZW50IGludG8gU291cmNlTm9kZVxuICAgIGFTb3VyY2VNYXBDb25zdW1lci5zb3VyY2VzLmZvckVhY2goZnVuY3Rpb24gKHNvdXJjZUZpbGUpIHtcbiAgICAgIHZhciBjb250ZW50ID0gYVNvdXJjZU1hcENvbnN1bWVyLnNvdXJjZUNvbnRlbnRGb3Ioc291cmNlRmlsZSk7XG4gICAgICBpZiAoY29udGVudCAhPSBudWxsKSB7XG4gICAgICAgIGlmIChhUmVsYXRpdmVQYXRoICE9IG51bGwpIHtcbiAgICAgICAgICBzb3VyY2VGaWxlID0gdXRpbC5qb2luKGFSZWxhdGl2ZVBhdGgsIHNvdXJjZUZpbGUpO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUuc2V0U291cmNlQ29udGVudChzb3VyY2VGaWxlLCBjb250ZW50KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBub2RlO1xuXG4gICAgZnVuY3Rpb24gYWRkTWFwcGluZ1dpdGhDb2RlKG1hcHBpbmcsIGNvZGUpIHtcbiAgICAgIGlmIChtYXBwaW5nID09PSBudWxsIHx8IG1hcHBpbmcuc291cmNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbm9kZS5hZGQoY29kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgc291cmNlID0gYVJlbGF0aXZlUGF0aFxuICAgICAgICAgID8gdXRpbC5qb2luKGFSZWxhdGl2ZVBhdGgsIG1hcHBpbmcuc291cmNlKVxuICAgICAgICAgIDogbWFwcGluZy5zb3VyY2U7XG4gICAgICAgIG5vZGUuYWRkKG5ldyBTb3VyY2VOb2RlKG1hcHBpbmcub3JpZ2luYWxMaW5lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXBwaW5nLm9yaWdpbmFsQ29sdW1uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcHBpbmcubmFtZSkpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuLyoqXG4gKiBBZGQgYSBjaHVuayBvZiBnZW5lcmF0ZWQgSlMgdG8gdGhpcyBzb3VyY2Ugbm9kZS5cbiAqXG4gKiBAcGFyYW0gYUNodW5rIEEgc3RyaW5nIHNuaXBwZXQgb2YgZ2VuZXJhdGVkIEpTIGNvZGUsIGFub3RoZXIgaW5zdGFuY2Ugb2ZcbiAqICAgICAgICBTb3VyY2VOb2RlLCBvciBhbiBhcnJheSB3aGVyZSBlYWNoIG1lbWJlciBpcyBvbmUgb2YgdGhvc2UgdGhpbmdzLlxuICovXG5Tb3VyY2VOb2RlLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiBTb3VyY2VOb2RlX2FkZChhQ2h1bmspIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoYUNodW5rKSkge1xuICAgIGFDaHVuay5mb3JFYWNoKGZ1bmN0aW9uIChjaHVuaykge1xuICAgICAgdGhpcy5hZGQoY2h1bmspO1xuICAgIH0sIHRoaXMpO1xuICB9XG4gIGVsc2UgaWYgKGFDaHVua1tpc1NvdXJjZU5vZGVdIHx8IHR5cGVvZiBhQ2h1bmsgPT09IFwic3RyaW5nXCIpIHtcbiAgICBpZiAoYUNodW5rKSB7XG4gICAgICB0aGlzLmNoaWxkcmVuLnB1c2goYUNodW5rKTtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgIFwiRXhwZWN0ZWQgYSBTb3VyY2VOb2RlLCBzdHJpbmcsIG9yIGFuIGFycmF5IG9mIFNvdXJjZU5vZGVzIGFuZCBzdHJpbmdzLiBHb3QgXCIgKyBhQ2h1bmtcbiAgICApO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgYSBjaHVuayBvZiBnZW5lcmF0ZWQgSlMgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGlzIHNvdXJjZSBub2RlLlxuICpcbiAqIEBwYXJhbSBhQ2h1bmsgQSBzdHJpbmcgc25pcHBldCBvZiBnZW5lcmF0ZWQgSlMgY29kZSwgYW5vdGhlciBpbnN0YW5jZSBvZlxuICogICAgICAgIFNvdXJjZU5vZGUsIG9yIGFuIGFycmF5IHdoZXJlIGVhY2ggbWVtYmVyIGlzIG9uZSBvZiB0aG9zZSB0aGluZ3MuXG4gKi9cblNvdXJjZU5vZGUucHJvdG90eXBlLnByZXBlbmQgPSBmdW5jdGlvbiBTb3VyY2VOb2RlX3ByZXBlbmQoYUNodW5rKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KGFDaHVuaykpIHtcbiAgICBmb3IgKHZhciBpID0gYUNodW5rLmxlbmd0aC0xOyBpID49IDA7IGktLSkge1xuICAgICAgdGhpcy5wcmVwZW5kKGFDaHVua1tpXSk7XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKGFDaHVua1tpc1NvdXJjZU5vZGVdIHx8IHR5cGVvZiBhQ2h1bmsgPT09IFwic3RyaW5nXCIpIHtcbiAgICB0aGlzLmNoaWxkcmVuLnVuc2hpZnQoYUNodW5rKTtcbiAgfVxuICBlbHNlIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgXCJFeHBlY3RlZCBhIFNvdXJjZU5vZGUsIHN0cmluZywgb3IgYW4gYXJyYXkgb2YgU291cmNlTm9kZXMgYW5kIHN0cmluZ3MuIEdvdCBcIiArIGFDaHVua1xuICAgICk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFdhbGsgb3ZlciB0aGUgdHJlZSBvZiBKUyBzbmlwcGV0cyBpbiB0aGlzIG5vZGUgYW5kIGl0cyBjaGlsZHJlbi4gVGhlXG4gKiB3YWxraW5nIGZ1bmN0aW9uIGlzIGNhbGxlZCBvbmNlIGZvciBlYWNoIHNuaXBwZXQgb2YgSlMgYW5kIGlzIHBhc3NlZCB0aGF0XG4gKiBzbmlwcGV0IGFuZCB0aGUgaXRzIG9yaWdpbmFsIGFzc29jaWF0ZWQgc291cmNlJ3MgbGluZS9jb2x1bW4gbG9jYXRpb24uXG4gKlxuICogQHBhcmFtIGFGbiBUaGUgdHJhdmVyc2FsIGZ1bmN0aW9uLlxuICovXG5Tb3VyY2VOb2RlLnByb3RvdHlwZS53YWxrID0gZnVuY3Rpb24gU291cmNlTm9kZV93YWxrKGFGbikge1xuICB2YXIgY2h1bms7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgY2h1bmsgPSB0aGlzLmNoaWxkcmVuW2ldO1xuICAgIGlmIChjaHVua1tpc1NvdXJjZU5vZGVdKSB7XG4gICAgICBjaHVuay53YWxrKGFGbik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaWYgKGNodW5rICE9PSAnJykge1xuICAgICAgICBhRm4oY2h1bmssIHsgc291cmNlOiB0aGlzLnNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgIGxpbmU6IHRoaXMubGluZSxcbiAgICAgICAgICAgICAgICAgICAgIGNvbHVtbjogdGhpcy5jb2x1bW4sXG4gICAgICAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWUgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIExpa2UgYFN0cmluZy5wcm90b3R5cGUuam9pbmAgZXhjZXB0IGZvciBTb3VyY2VOb2Rlcy4gSW5zZXJ0cyBgYVN0cmAgYmV0d2VlblxuICogZWFjaCBvZiBgdGhpcy5jaGlsZHJlbmAuXG4gKlxuICogQHBhcmFtIGFTZXAgVGhlIHNlcGFyYXRvci5cbiAqL1xuU291cmNlTm9kZS5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uIFNvdXJjZU5vZGVfam9pbihhU2VwKSB7XG4gIHZhciBuZXdDaGlsZHJlbjtcbiAgdmFyIGk7XG4gIHZhciBsZW4gPSB0aGlzLmNoaWxkcmVuLmxlbmd0aDtcbiAgaWYgKGxlbiA+IDApIHtcbiAgICBuZXdDaGlsZHJlbiA9IFtdO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW4tMTsgaSsrKSB7XG4gICAgICBuZXdDaGlsZHJlbi5wdXNoKHRoaXMuY2hpbGRyZW5baV0pO1xuICAgICAgbmV3Q2hpbGRyZW4ucHVzaChhU2VwKTtcbiAgICB9XG4gICAgbmV3Q2hpbGRyZW4ucHVzaCh0aGlzLmNoaWxkcmVuW2ldKTtcbiAgICB0aGlzLmNoaWxkcmVuID0gbmV3Q2hpbGRyZW47XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIENhbGwgU3RyaW5nLnByb3RvdHlwZS5yZXBsYWNlIG9uIHRoZSB2ZXJ5IHJpZ2h0LW1vc3Qgc291cmNlIHNuaXBwZXQuIFVzZWZ1bFxuICogZm9yIHRyaW1taW5nIHdoaXRlc3BhY2UgZnJvbSB0aGUgZW5kIG9mIGEgc291cmNlIG5vZGUsIGV0Yy5cbiAqXG4gKiBAcGFyYW0gYVBhdHRlcm4gVGhlIHBhdHRlcm4gdG8gcmVwbGFjZS5cbiAqIEBwYXJhbSBhUmVwbGFjZW1lbnQgVGhlIHRoaW5nIHRvIHJlcGxhY2UgdGhlIHBhdHRlcm4gd2l0aC5cbiAqL1xuU291cmNlTm9kZS5wcm90b3R5cGUucmVwbGFjZVJpZ2h0ID0gZnVuY3Rpb24gU291cmNlTm9kZV9yZXBsYWNlUmlnaHQoYVBhdHRlcm4sIGFSZXBsYWNlbWVudCkge1xuICB2YXIgbGFzdENoaWxkID0gdGhpcy5jaGlsZHJlblt0aGlzLmNoaWxkcmVuLmxlbmd0aCAtIDFdO1xuICBpZiAobGFzdENoaWxkW2lzU291cmNlTm9kZV0pIHtcbiAgICBsYXN0Q2hpbGQucmVwbGFjZVJpZ2h0KGFQYXR0ZXJuLCBhUmVwbGFjZW1lbnQpO1xuICB9XG4gIGVsc2UgaWYgKHR5cGVvZiBsYXN0Q2hpbGQgPT09ICdzdHJpbmcnKSB7XG4gICAgdGhpcy5jaGlsZHJlblt0aGlzLmNoaWxkcmVuLmxlbmd0aCAtIDFdID0gbGFzdENoaWxkLnJlcGxhY2UoYVBhdHRlcm4sIGFSZXBsYWNlbWVudCk7XG4gIH1cbiAgZWxzZSB7XG4gICAgdGhpcy5jaGlsZHJlbi5wdXNoKCcnLnJlcGxhY2UoYVBhdHRlcm4sIGFSZXBsYWNlbWVudCkpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIHNvdXJjZSBjb250ZW50IGZvciBhIHNvdXJjZSBmaWxlLiBUaGlzIHdpbGwgYmUgYWRkZWQgdG8gdGhlIFNvdXJjZU1hcEdlbmVyYXRvclxuICogaW4gdGhlIHNvdXJjZXNDb250ZW50IGZpZWxkLlxuICpcbiAqIEBwYXJhbSBhU291cmNlRmlsZSBUaGUgZmlsZW5hbWUgb2YgdGhlIHNvdXJjZSBmaWxlXG4gKiBAcGFyYW0gYVNvdXJjZUNvbnRlbnQgVGhlIGNvbnRlbnQgb2YgdGhlIHNvdXJjZSBmaWxlXG4gKi9cblNvdXJjZU5vZGUucHJvdG90eXBlLnNldFNvdXJjZUNvbnRlbnQgPVxuICBmdW5jdGlvbiBTb3VyY2VOb2RlX3NldFNvdXJjZUNvbnRlbnQoYVNvdXJjZUZpbGUsIGFTb3VyY2VDb250ZW50KSB7XG4gICAgdGhpcy5zb3VyY2VDb250ZW50c1t1dGlsLnRvU2V0U3RyaW5nKGFTb3VyY2VGaWxlKV0gPSBhU291cmNlQ29udGVudDtcbiAgfTtcblxuLyoqXG4gKiBXYWxrIG92ZXIgdGhlIHRyZWUgb2YgU291cmNlTm9kZXMuIFRoZSB3YWxraW5nIGZ1bmN0aW9uIGlzIGNhbGxlZCBmb3IgZWFjaFxuICogc291cmNlIGZpbGUgY29udGVudCBhbmQgaXMgcGFzc2VkIHRoZSBmaWxlbmFtZSBhbmQgc291cmNlIGNvbnRlbnQuXG4gKlxuICogQHBhcmFtIGFGbiBUaGUgdHJhdmVyc2FsIGZ1bmN0aW9uLlxuICovXG5Tb3VyY2VOb2RlLnByb3RvdHlwZS53YWxrU291cmNlQ29udGVudHMgPVxuICBmdW5jdGlvbiBTb3VyY2VOb2RlX3dhbGtTb3VyY2VDb250ZW50cyhhRm4pIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgaWYgKHRoaXMuY2hpbGRyZW5baV1baXNTb3VyY2VOb2RlXSkge1xuICAgICAgICB0aGlzLmNoaWxkcmVuW2ldLndhbGtTb3VyY2VDb250ZW50cyhhRm4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBzb3VyY2VzID0gT2JqZWN0LmtleXModGhpcy5zb3VyY2VDb250ZW50cyk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHNvdXJjZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFGbih1dGlsLmZyb21TZXRTdHJpbmcoc291cmNlc1tpXSksIHRoaXMuc291cmNlQ29udGVudHNbc291cmNlc1tpXV0pO1xuICAgIH1cbiAgfTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGlzIHNvdXJjZSBub2RlLiBXYWxrcyBvdmVyIHRoZSB0cmVlXG4gKiBhbmQgY29uY2F0ZW5hdGVzIGFsbCB0aGUgdmFyaW91cyBzbmlwcGV0cyB0b2dldGhlciB0byBvbmUgc3RyaW5nLlxuICovXG5Tb3VyY2VOb2RlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIFNvdXJjZU5vZGVfdG9TdHJpbmcoKSB7XG4gIHZhciBzdHIgPSBcIlwiO1xuICB0aGlzLndhbGsoZnVuY3Rpb24gKGNodW5rKSB7XG4gICAgc3RyICs9IGNodW5rO1xuICB9KTtcbiAgcmV0dXJuIHN0cjtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgc291cmNlIG5vZGUgYWxvbmcgd2l0aCBhIHNvdXJjZVxuICogbWFwLlxuICovXG5Tb3VyY2VOb2RlLnByb3RvdHlwZS50b1N0cmluZ1dpdGhTb3VyY2VNYXAgPSBmdW5jdGlvbiBTb3VyY2VOb2RlX3RvU3RyaW5nV2l0aFNvdXJjZU1hcChhQXJncykge1xuICB2YXIgZ2VuZXJhdGVkID0ge1xuICAgIGNvZGU6IFwiXCIsXG4gICAgbGluZTogMSxcbiAgICBjb2x1bW46IDBcbiAgfTtcbiAgdmFyIG1hcCA9IG5ldyBTb3VyY2VNYXBHZW5lcmF0b3IoYUFyZ3MpO1xuICB2YXIgc291cmNlTWFwcGluZ0FjdGl2ZSA9IGZhbHNlO1xuICB2YXIgbGFzdE9yaWdpbmFsU291cmNlID0gbnVsbDtcbiAgdmFyIGxhc3RPcmlnaW5hbExpbmUgPSBudWxsO1xuICB2YXIgbGFzdE9yaWdpbmFsQ29sdW1uID0gbnVsbDtcbiAgdmFyIGxhc3RPcmlnaW5hbE5hbWUgPSBudWxsO1xuICB0aGlzLndhbGsoZnVuY3Rpb24gKGNodW5rLCBvcmlnaW5hbCkge1xuICAgIGdlbmVyYXRlZC5jb2RlICs9IGNodW5rO1xuICAgIGlmIChvcmlnaW5hbC5zb3VyY2UgIT09IG51bGxcbiAgICAgICAgJiYgb3JpZ2luYWwubGluZSAhPT0gbnVsbFxuICAgICAgICAmJiBvcmlnaW5hbC5jb2x1bW4gIT09IG51bGwpIHtcbiAgICAgIGlmKGxhc3RPcmlnaW5hbFNvdXJjZSAhPT0gb3JpZ2luYWwuc291cmNlXG4gICAgICAgICB8fCBsYXN0T3JpZ2luYWxMaW5lICE9PSBvcmlnaW5hbC5saW5lXG4gICAgICAgICB8fCBsYXN0T3JpZ2luYWxDb2x1bW4gIT09IG9yaWdpbmFsLmNvbHVtblxuICAgICAgICAgfHwgbGFzdE9yaWdpbmFsTmFtZSAhPT0gb3JpZ2luYWwubmFtZSkge1xuICAgICAgICBtYXAuYWRkTWFwcGluZyh7XG4gICAgICAgICAgc291cmNlOiBvcmlnaW5hbC5zb3VyY2UsXG4gICAgICAgICAgb3JpZ2luYWw6IHtcbiAgICAgICAgICAgIGxpbmU6IG9yaWdpbmFsLmxpbmUsXG4gICAgICAgICAgICBjb2x1bW46IG9yaWdpbmFsLmNvbHVtblxuICAgICAgICAgIH0sXG4gICAgICAgICAgZ2VuZXJhdGVkOiB7XG4gICAgICAgICAgICBsaW5lOiBnZW5lcmF0ZWQubGluZSxcbiAgICAgICAgICAgIGNvbHVtbjogZ2VuZXJhdGVkLmNvbHVtblxuICAgICAgICAgIH0sXG4gICAgICAgICAgbmFtZTogb3JpZ2luYWwubmFtZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGxhc3RPcmlnaW5hbFNvdXJjZSA9IG9yaWdpbmFsLnNvdXJjZTtcbiAgICAgIGxhc3RPcmlnaW5hbExpbmUgPSBvcmlnaW5hbC5saW5lO1xuICAgICAgbGFzdE9yaWdpbmFsQ29sdW1uID0gb3JpZ2luYWwuY29sdW1uO1xuICAgICAgbGFzdE9yaWdpbmFsTmFtZSA9IG9yaWdpbmFsLm5hbWU7XG4gICAgICBzb3VyY2VNYXBwaW5nQWN0aXZlID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHNvdXJjZU1hcHBpbmdBY3RpdmUpIHtcbiAgICAgIG1hcC5hZGRNYXBwaW5nKHtcbiAgICAgICAgZ2VuZXJhdGVkOiB7XG4gICAgICAgICAgbGluZTogZ2VuZXJhdGVkLmxpbmUsXG4gICAgICAgICAgY29sdW1uOiBnZW5lcmF0ZWQuY29sdW1uXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgbGFzdE9yaWdpbmFsU291cmNlID0gbnVsbDtcbiAgICAgIHNvdXJjZU1hcHBpbmdBY3RpdmUgPSBmYWxzZTtcbiAgICB9XG4gICAgZm9yICh2YXIgaWR4ID0gMCwgbGVuZ3RoID0gY2h1bmsubGVuZ3RoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XG4gICAgICBpZiAoY2h1bmsuY2hhckNvZGVBdChpZHgpID09PSBORVdMSU5FX0NPREUpIHtcbiAgICAgICAgZ2VuZXJhdGVkLmxpbmUrKztcbiAgICAgICAgZ2VuZXJhdGVkLmNvbHVtbiA9IDA7XG4gICAgICAgIC8vIE1hcHBpbmdzIGVuZCBhdCBlb2xcbiAgICAgICAgaWYgKGlkeCArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIGxhc3RPcmlnaW5hbFNvdXJjZSA9IG51bGw7XG4gICAgICAgICAgc291cmNlTWFwcGluZ0FjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKHNvdXJjZU1hcHBpbmdBY3RpdmUpIHtcbiAgICAgICAgICBtYXAuYWRkTWFwcGluZyh7XG4gICAgICAgICAgICBzb3VyY2U6IG9yaWdpbmFsLnNvdXJjZSxcbiAgICAgICAgICAgIG9yaWdpbmFsOiB7XG4gICAgICAgICAgICAgIGxpbmU6IG9yaWdpbmFsLmxpbmUsXG4gICAgICAgICAgICAgIGNvbHVtbjogb3JpZ2luYWwuY29sdW1uXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2VuZXJhdGVkOiB7XG4gICAgICAgICAgICAgIGxpbmU6IGdlbmVyYXRlZC5saW5lLFxuICAgICAgICAgICAgICBjb2x1bW46IGdlbmVyYXRlZC5jb2x1bW5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYW1lOiBvcmlnaW5hbC5uYW1lXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGdlbmVyYXRlZC5jb2x1bW4rKztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICB0aGlzLndhbGtTb3VyY2VDb250ZW50cyhmdW5jdGlvbiAoc291cmNlRmlsZSwgc291cmNlQ29udGVudCkge1xuICAgIG1hcC5zZXRTb3VyY2VDb250ZW50KHNvdXJjZUZpbGUsIHNvdXJjZUNvbnRlbnQpO1xuICB9KTtcblxuICByZXR1cm4geyBjb2RlOiBnZW5lcmF0ZWQuY29kZSwgbWFwOiBtYXAgfTtcbn07XG5cbmV4cG9ydHMuU291cmNlTm9kZSA9IFNvdXJjZU5vZGU7XG4iLCIvKiAtKi0gTW9kZToganM7IGpzLWluZGVudC1sZXZlbDogMjsgLSotICovXG4vKlxuICogQ29weXJpZ2h0IDIwMTEgTW96aWxsYSBGb3VuZGF0aW9uIGFuZCBjb250cmlidXRvcnNcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBOZXcgQlNEIGxpY2Vuc2UuIFNlZSBMSUNFTlNFIG9yOlxuICogaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL0JTRC0zLUNsYXVzZVxuICovXG5cbi8qKlxuICogVGhpcyBpcyBhIGhlbHBlciBmdW5jdGlvbiBmb3IgZ2V0dGluZyB2YWx1ZXMgZnJvbSBwYXJhbWV0ZXIvb3B0aW9uc1xuICogb2JqZWN0cy5cbiAqXG4gKiBAcGFyYW0gYXJncyBUaGUgb2JqZWN0IHdlIGFyZSBleHRyYWN0aW5nIHZhbHVlcyBmcm9tXG4gKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgd2UgYXJlIGdldHRpbmcuXG4gKiBAcGFyYW0gZGVmYXVsdFZhbHVlIEFuIG9wdGlvbmFsIHZhbHVlIHRvIHJldHVybiBpZiB0aGUgcHJvcGVydHkgaXMgbWlzc2luZ1xuICogZnJvbSB0aGUgb2JqZWN0LiBJZiB0aGlzIGlzIG5vdCBzcGVjaWZpZWQgYW5kIHRoZSBwcm9wZXJ0eSBpcyBtaXNzaW5nLCBhblxuICogZXJyb3Igd2lsbCBiZSB0aHJvd24uXG4gKi9cbmZ1bmN0aW9uIGdldEFyZyhhQXJncywgYU5hbWUsIGFEZWZhdWx0VmFsdWUpIHtcbiAgaWYgKGFOYW1lIGluIGFBcmdzKSB7XG4gICAgcmV0dXJuIGFBcmdzW2FOYW1lXTtcbiAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAgcmV0dXJuIGFEZWZhdWx0VmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdcIicgKyBhTmFtZSArICdcIiBpcyBhIHJlcXVpcmVkIGFyZ3VtZW50LicpO1xuICB9XG59XG5leHBvcnRzLmdldEFyZyA9IGdldEFyZztcblxudmFyIHVybFJlZ2V4cCA9IC9eKD86KFtcXHcrXFwtLl0rKTopP1xcL1xcLyg/OihcXHcrOlxcdyspQCk/KFtcXHcuXSopKD86OihcXGQrKSk/KFxcUyopJC87XG52YXIgZGF0YVVybFJlZ2V4cCA9IC9eZGF0YTouK1xcLC4rJC87XG5cbmZ1bmN0aW9uIHVybFBhcnNlKGFVcmwpIHtcbiAgdmFyIG1hdGNoID0gYVVybC5tYXRjaCh1cmxSZWdleHApO1xuICBpZiAoIW1hdGNoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBzY2hlbWU6IG1hdGNoWzFdLFxuICAgIGF1dGg6IG1hdGNoWzJdLFxuICAgIGhvc3Q6IG1hdGNoWzNdLFxuICAgIHBvcnQ6IG1hdGNoWzRdLFxuICAgIHBhdGg6IG1hdGNoWzVdXG4gIH07XG59XG5leHBvcnRzLnVybFBhcnNlID0gdXJsUGFyc2U7XG5cbmZ1bmN0aW9uIHVybEdlbmVyYXRlKGFQYXJzZWRVcmwpIHtcbiAgdmFyIHVybCA9ICcnO1xuICBpZiAoYVBhcnNlZFVybC5zY2hlbWUpIHtcbiAgICB1cmwgKz0gYVBhcnNlZFVybC5zY2hlbWUgKyAnOic7XG4gIH1cbiAgdXJsICs9ICcvLyc7XG4gIGlmIChhUGFyc2VkVXJsLmF1dGgpIHtcbiAgICB1cmwgKz0gYVBhcnNlZFVybC5hdXRoICsgJ0AnO1xuICB9XG4gIGlmIChhUGFyc2VkVXJsLmhvc3QpIHtcbiAgICB1cmwgKz0gYVBhcnNlZFVybC5ob3N0O1xuICB9XG4gIGlmIChhUGFyc2VkVXJsLnBvcnQpIHtcbiAgICB1cmwgKz0gXCI6XCIgKyBhUGFyc2VkVXJsLnBvcnRcbiAgfVxuICBpZiAoYVBhcnNlZFVybC5wYXRoKSB7XG4gICAgdXJsICs9IGFQYXJzZWRVcmwucGF0aDtcbiAgfVxuICByZXR1cm4gdXJsO1xufVxuZXhwb3J0cy51cmxHZW5lcmF0ZSA9IHVybEdlbmVyYXRlO1xuXG4vKipcbiAqIE5vcm1hbGl6ZXMgYSBwYXRoLCBvciB0aGUgcGF0aCBwb3J0aW9uIG9mIGEgVVJMOlxuICpcbiAqIC0gUmVwbGFjZXMgY29uc2VjdXRpdmUgc2xhc2hlcyB3aXRoIG9uZSBzbGFzaC5cbiAqIC0gUmVtb3ZlcyB1bm5lY2Vzc2FyeSAnLicgcGFydHMuXG4gKiAtIFJlbW92ZXMgdW5uZWNlc3NhcnkgJzxkaXI+Ly4uJyBwYXJ0cy5cbiAqXG4gKiBCYXNlZCBvbiBjb2RlIGluIHRoZSBOb2RlLmpzICdwYXRoJyBjb3JlIG1vZHVsZS5cbiAqXG4gKiBAcGFyYW0gYVBhdGggVGhlIHBhdGggb3IgdXJsIHRvIG5vcm1hbGl6ZS5cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplKGFQYXRoKSB7XG4gIHZhciBwYXRoID0gYVBhdGg7XG4gIHZhciB1cmwgPSB1cmxQYXJzZShhUGF0aCk7XG4gIGlmICh1cmwpIHtcbiAgICBpZiAoIXVybC5wYXRoKSB7XG4gICAgICByZXR1cm4gYVBhdGg7XG4gICAgfVxuICAgIHBhdGggPSB1cmwucGF0aDtcbiAgfVxuICB2YXIgaXNBYnNvbHV0ZSA9IGV4cG9ydHMuaXNBYnNvbHV0ZShwYXRoKTtcblxuICB2YXIgcGFydHMgPSBwYXRoLnNwbGl0KC9cXC8rLyk7XG4gIGZvciAodmFyIHBhcnQsIHVwID0gMCwgaSA9IHBhcnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgcGFydCA9IHBhcnRzW2ldO1xuICAgIGlmIChwYXJ0ID09PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKHBhcnQgPT09ICcuLicpIHtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCA+IDApIHtcbiAgICAgIGlmIChwYXJ0ID09PSAnJykge1xuICAgICAgICAvLyBUaGUgZmlyc3QgcGFydCBpcyBibGFuayBpZiB0aGUgcGF0aCBpcyBhYnNvbHV0ZS4gVHJ5aW5nIHRvIGdvXG4gICAgICAgIC8vIGFib3ZlIHRoZSByb290IGlzIGEgbm8tb3AuIFRoZXJlZm9yZSB3ZSBjYW4gcmVtb3ZlIGFsbCAnLi4nIHBhcnRzXG4gICAgICAgIC8vIGRpcmVjdGx5IGFmdGVyIHRoZSByb290LlxuICAgICAgICBwYXJ0cy5zcGxpY2UoaSArIDEsIHVwKTtcbiAgICAgICAgdXAgPSAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFydHMuc3BsaWNlKGksIDIpO1xuICAgICAgICB1cC0tO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwYXRoID0gcGFydHMuam9pbignLycpO1xuXG4gIGlmIChwYXRoID09PSAnJykge1xuICAgIHBhdGggPSBpc0Fic29sdXRlID8gJy8nIDogJy4nO1xuICB9XG5cbiAgaWYgKHVybCkge1xuICAgIHVybC5wYXRoID0gcGF0aDtcbiAgICByZXR1cm4gdXJsR2VuZXJhdGUodXJsKTtcbiAgfVxuICByZXR1cm4gcGF0aDtcbn1cbmV4cG9ydHMubm9ybWFsaXplID0gbm9ybWFsaXplO1xuXG4vKipcbiAqIEpvaW5zIHR3byBwYXRocy9VUkxzLlxuICpcbiAqIEBwYXJhbSBhUm9vdCBUaGUgcm9vdCBwYXRoIG9yIFVSTC5cbiAqIEBwYXJhbSBhUGF0aCBUaGUgcGF0aCBvciBVUkwgdG8gYmUgam9pbmVkIHdpdGggdGhlIHJvb3QuXG4gKlxuICogLSBJZiBhUGF0aCBpcyBhIFVSTCBvciBhIGRhdGEgVVJJLCBhUGF0aCBpcyByZXR1cm5lZCwgdW5sZXNzIGFQYXRoIGlzIGFcbiAqICAgc2NoZW1lLXJlbGF0aXZlIFVSTDogVGhlbiB0aGUgc2NoZW1lIG9mIGFSb290LCBpZiBhbnksIGlzIHByZXBlbmRlZFxuICogICBmaXJzdC5cbiAqIC0gT3RoZXJ3aXNlIGFQYXRoIGlzIGEgcGF0aC4gSWYgYVJvb3QgaXMgYSBVUkwsIHRoZW4gaXRzIHBhdGggcG9ydGlvblxuICogICBpcyB1cGRhdGVkIHdpdGggdGhlIHJlc3VsdCBhbmQgYVJvb3QgaXMgcmV0dXJuZWQuIE90aGVyd2lzZSB0aGUgcmVzdWx0XG4gKiAgIGlzIHJldHVybmVkLlxuICogICAtIElmIGFQYXRoIGlzIGFic29sdXRlLCB0aGUgcmVzdWx0IGlzIGFQYXRoLlxuICogICAtIE90aGVyd2lzZSB0aGUgdHdvIHBhdGhzIGFyZSBqb2luZWQgd2l0aCBhIHNsYXNoLlxuICogLSBKb2luaW5nIGZvciBleGFtcGxlICdodHRwOi8vJyBhbmQgJ3d3dy5leGFtcGxlLmNvbScgaXMgYWxzbyBzdXBwb3J0ZWQuXG4gKi9cbmZ1bmN0aW9uIGpvaW4oYVJvb3QsIGFQYXRoKSB7XG4gIGlmIChhUm9vdCA9PT0gXCJcIikge1xuICAgIGFSb290ID0gXCIuXCI7XG4gIH1cbiAgaWYgKGFQYXRoID09PSBcIlwiKSB7XG4gICAgYVBhdGggPSBcIi5cIjtcbiAgfVxuICB2YXIgYVBhdGhVcmwgPSB1cmxQYXJzZShhUGF0aCk7XG4gIHZhciBhUm9vdFVybCA9IHVybFBhcnNlKGFSb290KTtcbiAgaWYgKGFSb290VXJsKSB7XG4gICAgYVJvb3QgPSBhUm9vdFVybC5wYXRoIHx8ICcvJztcbiAgfVxuXG4gIC8vIGBqb2luKGZvbywgJy8vd3d3LmV4YW1wbGUub3JnJylgXG4gIGlmIChhUGF0aFVybCAmJiAhYVBhdGhVcmwuc2NoZW1lKSB7XG4gICAgaWYgKGFSb290VXJsKSB7XG4gICAgICBhUGF0aFVybC5zY2hlbWUgPSBhUm9vdFVybC5zY2hlbWU7XG4gICAgfVxuICAgIHJldHVybiB1cmxHZW5lcmF0ZShhUGF0aFVybCk7XG4gIH1cblxuICBpZiAoYVBhdGhVcmwgfHwgYVBhdGgubWF0Y2goZGF0YVVybFJlZ2V4cCkpIHtcbiAgICByZXR1cm4gYVBhdGg7XG4gIH1cblxuICAvLyBgam9pbignaHR0cDovLycsICd3d3cuZXhhbXBsZS5jb20nKWBcbiAgaWYgKGFSb290VXJsICYmICFhUm9vdFVybC5ob3N0ICYmICFhUm9vdFVybC5wYXRoKSB7XG4gICAgYVJvb3RVcmwuaG9zdCA9IGFQYXRoO1xuICAgIHJldHVybiB1cmxHZW5lcmF0ZShhUm9vdFVybCk7XG4gIH1cblxuICB2YXIgam9pbmVkID0gYVBhdGguY2hhckF0KDApID09PSAnLydcbiAgICA/IGFQYXRoXG4gICAgOiBub3JtYWxpemUoYVJvb3QucmVwbGFjZSgvXFwvKyQvLCAnJykgKyAnLycgKyBhUGF0aCk7XG5cbiAgaWYgKGFSb290VXJsKSB7XG4gICAgYVJvb3RVcmwucGF0aCA9IGpvaW5lZDtcbiAgICByZXR1cm4gdXJsR2VuZXJhdGUoYVJvb3RVcmwpO1xuICB9XG4gIHJldHVybiBqb2luZWQ7XG59XG5leHBvcnRzLmpvaW4gPSBqb2luO1xuXG5leHBvcnRzLmlzQWJzb2x1dGUgPSBmdW5jdGlvbiAoYVBhdGgpIHtcbiAgcmV0dXJuIGFQYXRoLmNoYXJBdCgwKSA9PT0gJy8nIHx8ICEhYVBhdGgubWF0Y2godXJsUmVnZXhwKTtcbn07XG5cbi8qKlxuICogTWFrZSBhIHBhdGggcmVsYXRpdmUgdG8gYSBVUkwgb3IgYW5vdGhlciBwYXRoLlxuICpcbiAqIEBwYXJhbSBhUm9vdCBUaGUgcm9vdCBwYXRoIG9yIFVSTC5cbiAqIEBwYXJhbSBhUGF0aCBUaGUgcGF0aCBvciBVUkwgdG8gYmUgbWFkZSByZWxhdGl2ZSB0byBhUm9vdC5cbiAqL1xuZnVuY3Rpb24gcmVsYXRpdmUoYVJvb3QsIGFQYXRoKSB7XG4gIGlmIChhUm9vdCA9PT0gXCJcIikge1xuICAgIGFSb290ID0gXCIuXCI7XG4gIH1cblxuICBhUm9vdCA9IGFSb290LnJlcGxhY2UoL1xcLyQvLCAnJyk7XG5cbiAgLy8gSXQgaXMgcG9zc2libGUgZm9yIHRoZSBwYXRoIHRvIGJlIGFib3ZlIHRoZSByb290LiBJbiB0aGlzIGNhc2UsIHNpbXBseVxuICAvLyBjaGVja2luZyB3aGV0aGVyIHRoZSByb290IGlzIGEgcHJlZml4IG9mIHRoZSBwYXRoIHdvbid0IHdvcmsuIEluc3RlYWQsIHdlXG4gIC8vIG5lZWQgdG8gcmVtb3ZlIGNvbXBvbmVudHMgZnJvbSB0aGUgcm9vdCBvbmUgYnkgb25lLCB1bnRpbCBlaXRoZXIgd2UgZmluZFxuICAvLyBhIHByZWZpeCB0aGF0IGZpdHMsIG9yIHdlIHJ1biBvdXQgb2YgY29tcG9uZW50cyB0byByZW1vdmUuXG4gIHZhciBsZXZlbCA9IDA7XG4gIHdoaWxlIChhUGF0aC5pbmRleE9mKGFSb290ICsgJy8nKSAhPT0gMCkge1xuICAgIHZhciBpbmRleCA9IGFSb290Lmxhc3RJbmRleE9mKFwiL1wiKTtcbiAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICByZXR1cm4gYVBhdGg7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIG9ubHkgcGFydCBvZiB0aGUgcm9vdCB0aGF0IGlzIGxlZnQgaXMgdGhlIHNjaGVtZSAoaS5lLiBodHRwOi8vLFxuICAgIC8vIGZpbGU6Ly8vLCBldGMuKSwgb25lIG9yIG1vcmUgc2xhc2hlcyAoLyksIG9yIHNpbXBseSBub3RoaW5nIGF0IGFsbCwgd2VcbiAgICAvLyBoYXZlIGV4aGF1c3RlZCBhbGwgY29tcG9uZW50cywgc28gdGhlIHBhdGggaXMgbm90IHJlbGF0aXZlIHRvIHRoZSByb290LlxuICAgIGFSb290ID0gYVJvb3Quc2xpY2UoMCwgaW5kZXgpO1xuICAgIGlmIChhUm9vdC5tYXRjaCgvXihbXlxcL10rOlxcLyk/XFwvKiQvKSkge1xuICAgICAgcmV0dXJuIGFQYXRoO1xuICAgIH1cblxuICAgICsrbGV2ZWw7XG4gIH1cblxuICAvLyBNYWtlIHN1cmUgd2UgYWRkIGEgXCIuLi9cIiBmb3IgZWFjaCBjb21wb25lbnQgd2UgcmVtb3ZlZCBmcm9tIHRoZSByb290LlxuICByZXR1cm4gQXJyYXkobGV2ZWwgKyAxKS5qb2luKFwiLi4vXCIpICsgYVBhdGguc3Vic3RyKGFSb290Lmxlbmd0aCArIDEpO1xufVxuZXhwb3J0cy5yZWxhdGl2ZSA9IHJlbGF0aXZlO1xuXG52YXIgc3VwcG9ydHNOdWxsUHJvdG8gPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgb2JqID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgcmV0dXJuICEoJ19fcHJvdG9fXycgaW4gb2JqKTtcbn0oKSk7XG5cbmZ1bmN0aW9uIGlkZW50aXR5IChzKSB7XG4gIHJldHVybiBzO1xufVxuXG4vKipcbiAqIEJlY2F1c2UgYmVoYXZpb3IgZ29lcyB3YWNreSB3aGVuIHlvdSBzZXQgYF9fcHJvdG9fX2Agb24gb2JqZWN0cywgd2VcbiAqIGhhdmUgdG8gcHJlZml4IGFsbCB0aGUgc3RyaW5ncyBpbiBvdXIgc2V0IHdpdGggYW4gYXJiaXRyYXJ5IGNoYXJhY3Rlci5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21vemlsbGEvc291cmNlLW1hcC9wdWxsLzMxIGFuZFxuICogaHR0cHM6Ly9naXRodWIuY29tL21vemlsbGEvc291cmNlLW1hcC9pc3N1ZXMvMzBcbiAqXG4gKiBAcGFyYW0gU3RyaW5nIGFTdHJcbiAqL1xuZnVuY3Rpb24gdG9TZXRTdHJpbmcoYVN0cikge1xuICBpZiAoaXNQcm90b1N0cmluZyhhU3RyKSkge1xuICAgIHJldHVybiAnJCcgKyBhU3RyO1xuICB9XG5cbiAgcmV0dXJuIGFTdHI7XG59XG5leHBvcnRzLnRvU2V0U3RyaW5nID0gc3VwcG9ydHNOdWxsUHJvdG8gPyBpZGVudGl0eSA6IHRvU2V0U3RyaW5nO1xuXG5mdW5jdGlvbiBmcm9tU2V0U3RyaW5nKGFTdHIpIHtcbiAgaWYgKGlzUHJvdG9TdHJpbmcoYVN0cikpIHtcbiAgICByZXR1cm4gYVN0ci5zbGljZSgxKTtcbiAgfVxuXG4gIHJldHVybiBhU3RyO1xufVxuZXhwb3J0cy5mcm9tU2V0U3RyaW5nID0gc3VwcG9ydHNOdWxsUHJvdG8gPyBpZGVudGl0eSA6IGZyb21TZXRTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzUHJvdG9TdHJpbmcocykge1xuICBpZiAoIXMpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB2YXIgbGVuZ3RoID0gcy5sZW5ndGg7XG5cbiAgaWYgKGxlbmd0aCA8IDkgLyogXCJfX3Byb3RvX19cIi5sZW5ndGggKi8pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAocy5jaGFyQ29kZUF0KGxlbmd0aCAtIDEpICE9PSA5NSAgLyogJ18nICovIHx8XG4gICAgICBzLmNoYXJDb2RlQXQobGVuZ3RoIC0gMikgIT09IDk1ICAvKiAnXycgKi8gfHxcbiAgICAgIHMuY2hhckNvZGVBdChsZW5ndGggLSAzKSAhPT0gMTExIC8qICdvJyAqLyB8fFxuICAgICAgcy5jaGFyQ29kZUF0KGxlbmd0aCAtIDQpICE9PSAxMTYgLyogJ3QnICovIHx8XG4gICAgICBzLmNoYXJDb2RlQXQobGVuZ3RoIC0gNSkgIT09IDExMSAvKiAnbycgKi8gfHxcbiAgICAgIHMuY2hhckNvZGVBdChsZW5ndGggLSA2KSAhPT0gMTE0IC8qICdyJyAqLyB8fFxuICAgICAgcy5jaGFyQ29kZUF0KGxlbmd0aCAtIDcpICE9PSAxMTIgLyogJ3AnICovIHx8XG4gICAgICBzLmNoYXJDb2RlQXQobGVuZ3RoIC0gOCkgIT09IDk1ICAvKiAnXycgKi8gfHxcbiAgICAgIHMuY2hhckNvZGVBdChsZW5ndGggLSA5KSAhPT0gOTUgIC8qICdfJyAqLykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGZvciAodmFyIGkgPSBsZW5ndGggLSAxMDsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAocy5jaGFyQ29kZUF0KGkpICE9PSAzNiAvKiAnJCcgKi8pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBDb21wYXJhdG9yIGJldHdlZW4gdHdvIG1hcHBpbmdzIHdoZXJlIHRoZSBvcmlnaW5hbCBwb3NpdGlvbnMgYXJlIGNvbXBhcmVkLlxuICpcbiAqIE9wdGlvbmFsbHkgcGFzcyBpbiBgdHJ1ZWAgYXMgYG9ubHlDb21wYXJlR2VuZXJhdGVkYCB0byBjb25zaWRlciB0d29cbiAqIG1hcHBpbmdzIHdpdGggdGhlIHNhbWUgb3JpZ2luYWwgc291cmNlL2xpbmUvY29sdW1uLCBidXQgZGlmZmVyZW50IGdlbmVyYXRlZFxuICogbGluZSBhbmQgY29sdW1uIHRoZSBzYW1lLiBVc2VmdWwgd2hlbiBzZWFyY2hpbmcgZm9yIGEgbWFwcGluZyB3aXRoIGFcbiAqIHN0dWJiZWQgb3V0IG1hcHBpbmcuXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVCeU9yaWdpbmFsUG9zaXRpb25zKG1hcHBpbmdBLCBtYXBwaW5nQiwgb25seUNvbXBhcmVPcmlnaW5hbCkge1xuICB2YXIgY21wID0gbWFwcGluZ0Euc291cmNlIC0gbWFwcGluZ0Iuc291cmNlO1xuICBpZiAoY21wICE9PSAwKSB7XG4gICAgcmV0dXJuIGNtcDtcbiAgfVxuXG4gIGNtcCA9IG1hcHBpbmdBLm9yaWdpbmFsTGluZSAtIG1hcHBpbmdCLm9yaWdpbmFsTGluZTtcbiAgaWYgKGNtcCAhPT0gMCkge1xuICAgIHJldHVybiBjbXA7XG4gIH1cblxuICBjbXAgPSBtYXBwaW5nQS5vcmlnaW5hbENvbHVtbiAtIG1hcHBpbmdCLm9yaWdpbmFsQ29sdW1uO1xuICBpZiAoY21wICE9PSAwIHx8IG9ubHlDb21wYXJlT3JpZ2luYWwpIHtcbiAgICByZXR1cm4gY21wO1xuICB9XG5cbiAgY21wID0gbWFwcGluZ0EuZ2VuZXJhdGVkQ29sdW1uIC0gbWFwcGluZ0IuZ2VuZXJhdGVkQ29sdW1uO1xuICBpZiAoY21wICE9PSAwKSB7XG4gICAgcmV0dXJuIGNtcDtcbiAgfVxuXG4gIGNtcCA9IG1hcHBpbmdBLmdlbmVyYXRlZExpbmUgLSBtYXBwaW5nQi5nZW5lcmF0ZWRMaW5lO1xuICBpZiAoY21wICE9PSAwKSB7XG4gICAgcmV0dXJuIGNtcDtcbiAgfVxuXG4gIHJldHVybiBtYXBwaW5nQS5uYW1lIC0gbWFwcGluZ0IubmFtZTtcbn1cbmV4cG9ydHMuY29tcGFyZUJ5T3JpZ2luYWxQb3NpdGlvbnMgPSBjb21wYXJlQnlPcmlnaW5hbFBvc2l0aW9ucztcblxuLyoqXG4gKiBDb21wYXJhdG9yIGJldHdlZW4gdHdvIG1hcHBpbmdzIHdpdGggZGVmbGF0ZWQgc291cmNlIGFuZCBuYW1lIGluZGljZXMgd2hlcmVcbiAqIHRoZSBnZW5lcmF0ZWQgcG9zaXRpb25zIGFyZSBjb21wYXJlZC5cbiAqXG4gKiBPcHRpb25hbGx5IHBhc3MgaW4gYHRydWVgIGFzIGBvbmx5Q29tcGFyZUdlbmVyYXRlZGAgdG8gY29uc2lkZXIgdHdvXG4gKiBtYXBwaW5ncyB3aXRoIHRoZSBzYW1lIGdlbmVyYXRlZCBsaW5lIGFuZCBjb2x1bW4sIGJ1dCBkaWZmZXJlbnRcbiAqIHNvdXJjZS9uYW1lL29yaWdpbmFsIGxpbmUgYW5kIGNvbHVtbiB0aGUgc2FtZS4gVXNlZnVsIHdoZW4gc2VhcmNoaW5nIGZvciBhXG4gKiBtYXBwaW5nIHdpdGggYSBzdHViYmVkIG91dCBtYXBwaW5nLlxuICovXG5mdW5jdGlvbiBjb21wYXJlQnlHZW5lcmF0ZWRQb3NpdGlvbnNEZWZsYXRlZChtYXBwaW5nQSwgbWFwcGluZ0IsIG9ubHlDb21wYXJlR2VuZXJhdGVkKSB7XG4gIHZhciBjbXAgPSBtYXBwaW5nQS5nZW5lcmF0ZWRMaW5lIC0gbWFwcGluZ0IuZ2VuZXJhdGVkTGluZTtcbiAgaWYgKGNtcCAhPT0gMCkge1xuICAgIHJldHVybiBjbXA7XG4gIH1cblxuICBjbXAgPSBtYXBwaW5nQS5nZW5lcmF0ZWRDb2x1bW4gLSBtYXBwaW5nQi5nZW5lcmF0ZWRDb2x1bW47XG4gIGlmIChjbXAgIT09IDAgfHwgb25seUNvbXBhcmVHZW5lcmF0ZWQpIHtcbiAgICByZXR1cm4gY21wO1xuICB9XG5cbiAgY21wID0gbWFwcGluZ0Euc291cmNlIC0gbWFwcGluZ0Iuc291cmNlO1xuICBpZiAoY21wICE9PSAwKSB7XG4gICAgcmV0dXJuIGNtcDtcbiAgfVxuXG4gIGNtcCA9IG1hcHBpbmdBLm9yaWdpbmFsTGluZSAtIG1hcHBpbmdCLm9yaWdpbmFsTGluZTtcbiAgaWYgKGNtcCAhPT0gMCkge1xuICAgIHJldHVybiBjbXA7XG4gIH1cblxuICBjbXAgPSBtYXBwaW5nQS5vcmlnaW5hbENvbHVtbiAtIG1hcHBpbmdCLm9yaWdpbmFsQ29sdW1uO1xuICBpZiAoY21wICE9PSAwKSB7XG4gICAgcmV0dXJuIGNtcDtcbiAgfVxuXG4gIHJldHVybiBtYXBwaW5nQS5uYW1lIC0gbWFwcGluZ0IubmFtZTtcbn1cbmV4cG9ydHMuY29tcGFyZUJ5R2VuZXJhdGVkUG9zaXRpb25zRGVmbGF0ZWQgPSBjb21wYXJlQnlHZW5lcmF0ZWRQb3NpdGlvbnNEZWZsYXRlZDtcblxuZnVuY3Rpb24gc3RyY21wKGFTdHIxLCBhU3RyMikge1xuICBpZiAoYVN0cjEgPT09IGFTdHIyKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBpZiAoYVN0cjEgPiBhU3RyMikge1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIENvbXBhcmF0b3IgYmV0d2VlbiB0d28gbWFwcGluZ3Mgd2l0aCBpbmZsYXRlZCBzb3VyY2UgYW5kIG5hbWUgc3RyaW5ncyB3aGVyZVxuICogdGhlIGdlbmVyYXRlZCBwb3NpdGlvbnMgYXJlIGNvbXBhcmVkLlxuICovXG5mdW5jdGlvbiBjb21wYXJlQnlHZW5lcmF0ZWRQb3NpdGlvbnNJbmZsYXRlZChtYXBwaW5nQSwgbWFwcGluZ0IpIHtcbiAgdmFyIGNtcCA9IG1hcHBpbmdBLmdlbmVyYXRlZExpbmUgLSBtYXBwaW5nQi5nZW5lcmF0ZWRMaW5lO1xuICBpZiAoY21wICE9PSAwKSB7XG4gICAgcmV0dXJuIGNtcDtcbiAgfVxuXG4gIGNtcCA9IG1hcHBpbmdBLmdlbmVyYXRlZENvbHVtbiAtIG1hcHBpbmdCLmdlbmVyYXRlZENvbHVtbjtcbiAgaWYgKGNtcCAhPT0gMCkge1xuICAgIHJldHVybiBjbXA7XG4gIH1cblxuICBjbXAgPSBzdHJjbXAobWFwcGluZ0Euc291cmNlLCBtYXBwaW5nQi5zb3VyY2UpO1xuICBpZiAoY21wICE9PSAwKSB7XG4gICAgcmV0dXJuIGNtcDtcbiAgfVxuXG4gIGNtcCA9IG1hcHBpbmdBLm9yaWdpbmFsTGluZSAtIG1hcHBpbmdCLm9yaWdpbmFsTGluZTtcbiAgaWYgKGNtcCAhPT0gMCkge1xuICAgIHJldHVybiBjbXA7XG4gIH1cblxuICBjbXAgPSBtYXBwaW5nQS5vcmlnaW5hbENvbHVtbiAtIG1hcHBpbmdCLm9yaWdpbmFsQ29sdW1uO1xuICBpZiAoY21wICE9PSAwKSB7XG4gICAgcmV0dXJuIGNtcDtcbiAgfVxuXG4gIHJldHVybiBzdHJjbXAobWFwcGluZ0EubmFtZSwgbWFwcGluZ0IubmFtZSk7XG59XG5leHBvcnRzLmNvbXBhcmVCeUdlbmVyYXRlZFBvc2l0aW9uc0luZmxhdGVkID0gY29tcGFyZUJ5R2VuZXJhdGVkUG9zaXRpb25zSW5mbGF0ZWQ7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMDktMjAxMSBNb3ppbGxhIEZvdW5kYXRpb24gYW5kIGNvbnRyaWJ1dG9yc1xuICogTGljZW5zZWQgdW5kZXIgdGhlIE5ldyBCU0QgbGljZW5zZS4gU2VlIExJQ0VOU0UudHh0IG9yOlxuICogaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL0JTRC0zLUNsYXVzZVxuICovXG5leHBvcnRzLlNvdXJjZU1hcEdlbmVyYXRvciA9IHJlcXVpcmUoJy4vbGliL3NvdXJjZS1tYXAtZ2VuZXJhdG9yJykuU291cmNlTWFwR2VuZXJhdG9yO1xuZXhwb3J0cy5Tb3VyY2VNYXBDb25zdW1lciA9IHJlcXVpcmUoJy4vbGliL3NvdXJjZS1tYXAtY29uc3VtZXInKS5Tb3VyY2VNYXBDb25zdW1lcjtcbmV4cG9ydHMuU291cmNlTm9kZSA9IHJlcXVpcmUoJy4vbGliL3NvdXJjZS1ub2RlJykuU291cmNlTm9kZTtcbiIsIihmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIC8vIFVuaXZlcnNhbCBNb2R1bGUgRGVmaW5pdGlvbiAoVU1EKSB0byBzdXBwb3J0IEFNRCwgQ29tbW9uSlMvTm9kZS5qcywgUmhpbm8sIGFuZCBicm93c2Vycy5cblxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoJ3N0YWNrdHJhY2UtZ3BzJywgWydzb3VyY2UtbWFwJywgJ3N0YWNrZnJhbWUnXSwgZmFjdG9yeSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ3NvdXJjZS1tYXAvbGliL3NvdXJjZS1tYXAtY29uc3VtZXInKSwgcmVxdWlyZSgnc3RhY2tmcmFtZScpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByb290LlN0YWNrVHJhY2VHUFMgPSBmYWN0b3J5KHJvb3QuU291cmNlTWFwIHx8IHJvb3Quc291cmNlTWFwLCByb290LlN0YWNrRnJhbWUpO1xuICAgIH1cbn0odGhpcywgZnVuY3Rpb24oU291cmNlTWFwLCBTdGFja0ZyYW1lKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogTWFrZSBhIFgtRG9tYWluIHJlcXVlc3QgdG8gdXJsIGFuZCBjYWxsYmFjay5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gd2l0aCByZXNwb25zZSB0ZXh0IGlmIGZ1bGZpbGxlZFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF94ZHIodXJsKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgIHZhciByZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIHJlcS5vcGVuKCdnZXQnLCB1cmwpO1xuICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSByZWplY3Q7XG4gICAgICAgICAgICByZXEub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gb25yZWFkeXN0YXRlY2hhbmdlKCkge1xuICAgICAgICAgICAgICAgIGlmIChyZXEucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVxLnN0YXR1cyA+PSAyMDAgJiYgcmVxLnN0YXR1cyA8IDMwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ0hUVFAgc3RhdHVzOiAnICsgcmVxLnN0YXR1cyArICcgcmV0cmlldmluZyAnICsgdXJsKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxLnNlbmQoKTtcbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGEgQmFzZTY0LWVuY29kZWQgc3RyaW5nIGludG8gaXRzIG9yaWdpbmFsIHJlcHJlc2VudGF0aW9uLlxuICAgICAqIFVzZWQgZm9yIGlubGluZSBzb3VyY2VtYXBzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGI2NHN0ciBCYXNlLTY0IGVuY29kZWQgc3RyaW5nXG4gICAgICogQHJldHVybnMge1N0cmluZ30gb3JpZ2luYWwgcmVwcmVzZW50YXRpb24gb2YgdGhlIGJhc2U2NC1lbmNvZGVkIHN0cmluZy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfYXRvYihiNjRzdHIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5hdG9iKSB7XG4gICAgICAgICAgICByZXR1cm4gd2luZG93LmF0b2IoYjY0c3RyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignWW91IG11c3Qgc3VwcGx5IGEgcG9seWZpbGwgZm9yIHdpbmRvdy5hdG9iIGluIHRoaXMgZW52aXJvbm1lbnQnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9wYXJzZUpzb24oc3RyaW5nKSB7XG4gICAgICAgIGlmICh0eXBlb2YgSlNPTiAhPT0gJ3VuZGVmaW5lZCcgJiYgSlNPTi5wYXJzZSkge1xuICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2Uoc3RyaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignWW91IG11c3Qgc3VwcGx5IGEgcG9seWZpbGwgZm9yIEpTT04ucGFyc2UgaW4gdGhpcyBlbnZpcm9ubWVudCcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2ZpbmRGdW5jdGlvbk5hbWUoc291cmNlLCBsaW5lTnVtYmVyLyosIGNvbHVtbk51bWJlciovKSB7XG4gICAgICAgIC8vIGZ1bmN0aW9uIHtuYW1lfSh7YXJnc30pIG1bMV09bmFtZSBtWzJdPWFyZ3NcbiAgICAgICAgdmFyIHJlRnVuY3Rpb25EZWNsYXJhdGlvbiA9IC9mdW5jdGlvblxccysoW14oXSo/KVxccypcXCgoW14pXSopXFwpLztcbiAgICAgICAgLy8ge25hbWV9ID0gZnVuY3Rpb24gKHthcmdzfSkgVE9ETyBhcmdzIGNhcHR1cmVcbiAgICAgICAgdmFyIHJlRnVuY3Rpb25FeHByZXNzaW9uID0gL1snXCJdPyhbJF9BLVphLXpdWyRfQS1aYS16MC05XSopWydcIl0/XFxzKls6PV1cXHMqZnVuY3Rpb25cXGIvO1xuICAgICAgICAvLyB7bmFtZX0gPSBldmFsKClcbiAgICAgICAgdmFyIHJlRnVuY3Rpb25FdmFsdWF0aW9uID0gL1snXCJdPyhbJF9BLVphLXpdWyRfQS1aYS16MC05XSopWydcIl0/XFxzKls6PV1cXHMqKD86ZXZhbHxuZXcgRnVuY3Rpb24pXFxiLztcbiAgICAgICAgdmFyIGxpbmVzID0gc291cmNlLnNwbGl0KCdcXG4nKTtcblxuICAgICAgICAvLyBXYWxrIGJhY2t3YXJkcyBpbiB0aGUgc291cmNlIGxpbmVzIHVudGlsIHdlIGZpbmQgdGhlIGxpbmUgd2hpY2ggbWF0Y2hlcyBvbmUgb2YgdGhlIHBhdHRlcm5zIGFib3ZlXG4gICAgICAgIHZhciBjb2RlID0gJyc7XG4gICAgICAgIHZhciBtYXhMaW5lcyA9IE1hdGgubWluKGxpbmVOdW1iZXIsIDIwKTtcbiAgICAgICAgdmFyIG07XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWF4TGluZXM7ICsraSkge1xuICAgICAgICAgICAgLy8gbGluZU5vIGlzIDEtYmFzZWQsIHNvdXJjZVtdIGlzIDAtYmFzZWRcbiAgICAgICAgICAgIHZhciBsaW5lID0gbGluZXNbbGluZU51bWJlciAtIGkgLSAxXTtcbiAgICAgICAgICAgIHZhciBjb21tZW50UG9zID0gbGluZS5pbmRleE9mKCcvLycpO1xuICAgICAgICAgICAgaWYgKGNvbW1lbnRQb3MgPj0gMCkge1xuICAgICAgICAgICAgICAgIGxpbmUgPSBsaW5lLnN1YnN0cigwLCBjb21tZW50UG9zKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGxpbmUpIHtcbiAgICAgICAgICAgICAgICBjb2RlID0gbGluZSArIGNvZGU7XG4gICAgICAgICAgICAgICAgbSA9IHJlRnVuY3Rpb25FeHByZXNzaW9uLmV4ZWMoY29kZSk7XG4gICAgICAgICAgICAgICAgaWYgKG0gJiYgbVsxXSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbVsxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbSA9IHJlRnVuY3Rpb25EZWNsYXJhdGlvbi5leGVjKGNvZGUpO1xuICAgICAgICAgICAgICAgIGlmIChtICYmIG1bMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1bMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG0gPSByZUZ1bmN0aW9uRXZhbHVhdGlvbi5leGVjKGNvZGUpO1xuICAgICAgICAgICAgICAgIGlmIChtICYmIG1bMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1bMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2Vuc3VyZVN1cHBvcnRlZEVudmlyb25tZW50KCkge1xuICAgICAgICBpZiAodHlwZW9mIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgT2JqZWN0LmNyZWF0ZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gY29uc3VtZSBzb3VyY2UgbWFwcyBpbiBvbGRlciBicm93c2VycycpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2Vuc3VyZVN0YWNrRnJhbWVJc0xlZ2l0KHN0YWNrZnJhbWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzdGFja2ZyYW1lICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignR2l2ZW4gU3RhY2tGcmFtZSBpcyBub3QgYW4gb2JqZWN0Jyk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHN0YWNrZnJhbWUuZmlsZU5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdHaXZlbiBmaWxlIG5hbWUgaXMgbm90IGEgU3RyaW5nJyk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHN0YWNrZnJhbWUubGluZU51bWJlciAhPT0gJ251bWJlcicgfHxcbiAgICAgICAgICAgIHN0YWNrZnJhbWUubGluZU51bWJlciAlIDEgIT09IDAgfHxcbiAgICAgICAgICAgIHN0YWNrZnJhbWUubGluZU51bWJlciA8IDEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0dpdmVuIGxpbmUgbnVtYmVyIG11c3QgYmUgYSBwb3NpdGl2ZSBpbnRlZ2VyJyk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHN0YWNrZnJhbWUuY29sdW1uTnVtYmVyICE9PSAnbnVtYmVyJyB8fFxuICAgICAgICAgICAgc3RhY2tmcmFtZS5jb2x1bW5OdW1iZXIgJSAxICE9PSAwIHx8XG4gICAgICAgICAgICBzdGFja2ZyYW1lLmNvbHVtbk51bWJlciA8IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0dpdmVuIGNvbHVtbiBudW1iZXIgbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2ZpbmRTb3VyY2VNYXBwaW5nVVJMKHNvdXJjZSkge1xuICAgICAgICB2YXIgbSA9IC9cXC9cXC9bI0BdID9zb3VyY2VNYXBwaW5nVVJMPShbXlxccydcIl0rKVxccyokLy5leGVjKHNvdXJjZSk7XG4gICAgICAgIGlmIChtICYmIG1bMV0pIHtcbiAgICAgICAgICAgIHJldHVybiBtWzFdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzb3VyY2VNYXBwaW5nVVJMIG5vdCBmb3VuZCcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2V4dHJhY3RMb2NhdGlvbkluZm9Gcm9tU291cmNlTWFwKHN0YWNrZnJhbWUsIHJhd1NvdXJjZU1hcCwgc291cmNlQ2FjaGUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgdmFyIG1hcENvbnN1bWVyID0gbmV3IFNvdXJjZU1hcC5Tb3VyY2VNYXBDb25zdW1lcihyYXdTb3VyY2VNYXApO1xuXG4gICAgICAgICAgICB2YXIgbG9jID0gbWFwQ29uc3VtZXIub3JpZ2luYWxQb3NpdGlvbkZvcih7XG4gICAgICAgICAgICAgICAgbGluZTogc3RhY2tmcmFtZS5saW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGNvbHVtbjogc3RhY2tmcmFtZS5jb2x1bW5OdW1iZXJcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAobG9jLnNvdXJjZSkge1xuICAgICAgICAgICAgICAgIHZhciBtYXBwZWRTb3VyY2UgPSBtYXBDb25zdW1lci5zb3VyY2VDb250ZW50Rm9yKGxvYy5zb3VyY2UpO1xuICAgICAgICAgICAgICAgIGlmIChtYXBwZWRTb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlQ2FjaGVbbG9jLnNvdXJjZV0gPSBtYXBwZWRTb3VyY2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUoXG4gICAgICAgICAgICAgICAgICAgIG5ldyBTdGFja0ZyYW1lKFxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jLm5hbWUgfHwgc3RhY2tmcmFtZS5mdW5jdGlvbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFja2ZyYW1lLmFyZ3MsXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2Muc291cmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jLmxpbmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2MuY29sdW1uKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ0NvdWxkIG5vdCBnZXQgb3JpZ2luYWwgc291cmNlIGZvciBnaXZlbiBzdGFja2ZyYW1lIGFuZCBzb3VyY2UgbWFwJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICAgICAqICAgICAgb3B0cy5zb3VyY2VDYWNoZSA9IHt1cmw6IFwiU291cmNlIFN0cmluZ1wifSA9PiBwcmVsb2FkIHNvdXJjZSBjYWNoZVxuICAgICAqICAgICAgb3B0cy5vZmZsaW5lID0gVHJ1ZSB0byBwcmV2ZW50IG5ldHdvcmsgcmVxdWVzdHMuXG4gICAgICogICAgICAgICAgICAgIEJlc3QgZWZmb3J0IHdpdGhvdXQgc291cmNlcyBvciBzb3VyY2UgbWFwcy5cbiAgICAgKiAgICAgIG9wdHMuYWpheCA9IFByb21pc2UgcmV0dXJuaW5nIGZ1bmN0aW9uIHRvIG1ha2UgWC1Eb21haW4gcmVxdWVzdHNcbiAgICAgKi9cbiAgICByZXR1cm4gZnVuY3Rpb24gU3RhY2tUcmFjZUdQUyhvcHRzKSB7XG4gICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTdGFja1RyYWNlR1BTKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBTdGFja1RyYWNlR1BTKG9wdHMpO1xuICAgICAgICB9XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgICAgIHRoaXMuc291cmNlQ2FjaGUgPSBvcHRzLnNvdXJjZUNhY2hlIHx8IHt9O1xuXG4gICAgICAgIHRoaXMuYWpheCA9IG9wdHMuYWpheCB8fCBfeGRyO1xuXG4gICAgICAgIHRoaXMuX2F0b2IgPSBvcHRzLmF0b2IgfHwgX2F0b2I7XG5cbiAgICAgICAgdGhpcy5fZ2V0ID0gZnVuY3Rpb24gX2dldChsb2NhdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIHZhciBpc0RhdGFVcmwgPSBsb2NhdGlvbi5zdWJzdHIoMCwgNSkgPT09ICdkYXRhOic7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc291cmNlQ2FjaGVbbG9jYXRpb25dKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5zb3VyY2VDYWNoZVtsb2NhdGlvbl0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0cy5vZmZsaW5lICYmICFpc0RhdGFVcmwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignQ2Fubm90IG1ha2UgbmV0d29yayByZXF1ZXN0cyBpbiBvZmZsaW5lIG1vZGUnKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzRGF0YVVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGF0YSBVUkxzIGNhbiBoYXZlIHBhcmFtZXRlcnMuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzZWUgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMjM5N1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN1cHBvcnRlZEVuY29kaW5nUmVnZXhwID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvXmRhdGE6YXBwbGljYXRpb25cXC9qc29uOyhbXFx3PTpcIi1dKzspKmJhc2U2NCwvO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1hdGNoID0gbG9jYXRpb24ubWF0Y2goc3VwcG9ydGVkRW5jb2RpbmdSZWdleHApO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNvdXJjZU1hcFN0YXJ0ID0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbmNvZGVkU291cmNlID0gbG9jYXRpb24uc3Vic3RyKHNvdXJjZU1hcFN0YXJ0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc291cmNlID0gdGhpcy5fYXRvYihlbmNvZGVkU291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZUNhY2hlW2xvY2F0aW9uXSA9IHNvdXJjZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1RoZSBlbmNvZGluZyBvZiB0aGUgaW5saW5lIHNvdXJjZW1hcCBpcyBub3Qgc3VwcG9ydGVkJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHhoclByb21pc2UgPSB0aGlzLmFqYXgobG9jYXRpb24sIHttZXRob2Q6ICdnZXQnfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWNoZSB0aGUgUHJvbWlzZSB0byBwcmV2ZW50IGR1cGxpY2F0ZSBpbi1mbGlnaHQgcmVxdWVzdHNcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc291cmNlQ2FjaGVbbG9jYXRpb25dID0geGhyUHJvbWlzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHhoclByb21pc2UudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2l2ZW4gYSBTdGFja0ZyYW1lLCBlbmhhbmNlIGZ1bmN0aW9uIG5hbWUgYW5kIHVzZSBzb3VyY2UgbWFwcyBmb3IgYVxuICAgICAgICAgKiBiZXR0ZXIgU3RhY2tGcmFtZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdGFja0ZyYW1lfSBzdGFja2ZyYW1lIG9iamVjdFxuICAgICAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gdGhhdCByZXNvbHZlcyB3aXRoIHdpdGggc291cmNlLW1hcHBlZCBTdGFja0ZyYW1lXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBpbnBvaW50ID0gZnVuY3Rpb24gU3RhY2tUcmFjZUdQUyQkcGlucG9pbnQoc3RhY2tmcmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0TWFwcGVkTG9jYXRpb24oc3RhY2tmcmFtZSkudGhlbihmdW5jdGlvbihtYXBwZWRTdGFja0ZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHJlc29sdmVNYXBwZWRTdGFja0ZyYW1lKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShtYXBwZWRTdGFja0ZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmluZEZ1bmN0aW9uTmFtZShtYXBwZWRTdGFja0ZyYW1lKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVzb2x2ZSwgcmVzb2x2ZU1hcHBlZFN0YWNrRnJhbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICBbJ2NhdGNoJ10ocmVzb2x2ZU1hcHBlZFN0YWNrRnJhbWUpO1xuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSwgcmVqZWN0KTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdpdmVuIGEgU3RhY2tGcmFtZSwgZ3Vlc3MgZnVuY3Rpb24gbmFtZSBmcm9tIGxvY2F0aW9uIGluZm9ybWF0aW9uLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1N0YWNrRnJhbWV9IHN0YWNrZnJhbWVcbiAgICAgICAgICogQHJldHVybnMge1Byb21pc2V9IHRoYXQgcmVzb2x2ZXMgd2l0aCBlbmhhbmNlZCBTdGFja0ZyYW1lLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maW5kRnVuY3Rpb25OYW1lID0gZnVuY3Rpb24gU3RhY2tUcmFjZUdQUyQkZmluZEZ1bmN0aW9uTmFtZShzdGFja2ZyYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgX2Vuc3VyZVN0YWNrRnJhbWVJc0xlZ2l0KHN0YWNrZnJhbWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dldChzdGFja2ZyYW1lLmZpbGVOYW1lKS50aGVuKGZ1bmN0aW9uIGdldFNvdXJjZUNhbGxiYWNrKHNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGluZU51bWJlciA9IHN0YWNrZnJhbWUubGluZU51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbHVtbk51bWJlciA9IHN0YWNrZnJhbWUuY29sdW1uTnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZ3Vlc3NlZEZ1bmN0aW9uTmFtZSA9IF9maW5kRnVuY3Rpb25OYW1lKHNvdXJjZSwgbGluZU51bWJlciwgY29sdW1uTnVtYmVyKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gT25seSByZXBsYWNlIGZ1bmN0aW9uTmFtZSBpZiB3ZSBmb3VuZCBzb21ldGhpbmdcbiAgICAgICAgICAgICAgICAgICAgaWYgKGd1ZXNzZWRGdW5jdGlvbk5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUobmV3IFN0YWNrRnJhbWUoZ3Vlc3NlZEZ1bmN0aW9uTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFja2ZyYW1lLmFyZ3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tmcmFtZS5maWxlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbHVtbk51bWJlcikpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShzdGFja2ZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIHJlamVjdClbJ2NhdGNoJ10ocmVqZWN0KTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdpdmVuIGEgU3RhY2tGcmFtZSwgc2VlayBzb3VyY2UtbWFwcGVkIGxvY2F0aW9uIGFuZCByZXR1cm4gbmV3IGVuaGFuY2VkIFN0YWNrRnJhbWUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RhY2tGcmFtZX0gc3RhY2tmcmFtZVxuICAgICAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gdGhhdCByZXNvbHZlcyB3aXRoIGVuaGFuY2VkIFN0YWNrRnJhbWUuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmdldE1hcHBlZExvY2F0aW9uID0gZnVuY3Rpb24gU3RhY2tUcmFjZUdQUyQkZ2V0TWFwcGVkTG9jYXRpb24oc3RhY2tmcmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIF9lbnN1cmVTdXBwb3J0ZWRFbnZpcm9ubWVudCgpO1xuICAgICAgICAgICAgICAgIF9lbnN1cmVTdGFja0ZyYW1lSXNMZWdpdChzdGFja2ZyYW1lKTtcblxuICAgICAgICAgICAgICAgIHZhciBzb3VyY2VDYWNoZSA9IHRoaXMuc291cmNlQ2FjaGU7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGVOYW1lID0gc3RhY2tmcmFtZS5maWxlTmFtZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nZXQoZmlsZU5hbWUpLnRoZW4oZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzb3VyY2VNYXBwaW5nVVJMID0gX2ZpbmRTb3VyY2VNYXBwaW5nVVJMKHNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpc0RhdGFVcmwgPSBzb3VyY2VNYXBwaW5nVVJMLnN1YnN0cigwLCA1KSA9PT0gJ2RhdGE6JztcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJhc2UgPSBmaWxlTmFtZS5zdWJzdHJpbmcoMCwgZmlsZU5hbWUubGFzdEluZGV4T2YoJy8nKSArIDEpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2VNYXBwaW5nVVJMWzBdICE9PSAnLycgJiYgIWlzRGF0YVVybCAmJiAhKC9eaHR0cHM/OlxcL1xcL3xeXFwvXFwvL2kpLnRlc3Qoc291cmNlTWFwcGluZ1VSTCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZU1hcHBpbmdVUkwgPSBiYXNlICsgc291cmNlTWFwcGluZ1VSTDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dldChzb3VyY2VNYXBwaW5nVVJMKS50aGVuKGZ1bmN0aW9uKHNvdXJjZU1hcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2VNYXAgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlTWFwID0gX3BhcnNlSnNvbihzb3VyY2VNYXAucmVwbGFjZSgvXlxcKVxcXVxcfScvLCAnJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2VNYXAuc291cmNlUm9vdCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VNYXAuc291cmNlUm9vdCA9IGJhc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIF9leHRyYWN0TG9jYXRpb25JbmZvRnJvbVNvdXJjZU1hcChzdGFja2ZyYW1lLCBzb3VyY2VNYXAsIHNvdXJjZUNhY2hlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKHJlc29sdmUpWydjYXRjaCddKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc3RhY2tmcmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KVsnY2F0Y2gnXShyZWplY3QpO1xuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSwgcmVqZWN0KVsnY2F0Y2gnXShyZWplY3QpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfTtcbiAgICB9O1xufSkpO1xuIiwiKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgLy8gVW5pdmVyc2FsIE1vZHVsZSBEZWZpbml0aW9uIChVTUQpIHRvIHN1cHBvcnQgQU1ELCBDb21tb25KUy9Ob2RlLmpzLCBSaGlubywgYW5kIGJyb3dzZXJzLlxuXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZSgnc3RhY2t0cmFjZScsIFsnZXJyb3Itc3RhY2stcGFyc2VyJywgJ3N0YWNrLWdlbmVyYXRvcicsICdzdGFja3RyYWNlLWdwcyddLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnZXJyb3Itc3RhY2stcGFyc2VyJyksIHJlcXVpcmUoJ3N0YWNrLWdlbmVyYXRvcicpLCByZXF1aXJlKCdzdGFja3RyYWNlLWdwcycpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByb290LlN0YWNrVHJhY2UgPSBmYWN0b3J5KHJvb3QuRXJyb3JTdGFja1BhcnNlciwgcm9vdC5TdGFja0dlbmVyYXRvciwgcm9vdC5TdGFja1RyYWNlR1BTKTtcbiAgICB9XG59KHRoaXMsIGZ1bmN0aW9uIFN0YWNrVHJhY2UoRXJyb3JTdGFja1BhcnNlciwgU3RhY2tHZW5lcmF0b3IsIFN0YWNrVHJhY2VHUFMpIHtcbiAgICB2YXIgX29wdGlvbnMgPSB7XG4gICAgICAgIGZpbHRlcjogZnVuY3Rpb24oc3RhY2tmcmFtZSkge1xuICAgICAgICAgICAgLy8gRmlsdGVyIG91dCBzdGFja2ZyYW1lcyBmb3IgdGhpcyBsaWJyYXJ5IGJ5IGRlZmF1bHRcbiAgICAgICAgICAgIHJldHVybiAoc3RhY2tmcmFtZS5mdW5jdGlvbk5hbWUgfHwgJycpLmluZGV4T2YoJ1N0YWNrVHJhY2UkJCcpID09PSAtMSAmJlxuICAgICAgICAgICAgICAgIChzdGFja2ZyYW1lLmZ1bmN0aW9uTmFtZSB8fCAnJykuaW5kZXhPZignRXJyb3JTdGFja1BhcnNlciQkJykgPT09IC0xICYmXG4gICAgICAgICAgICAgICAgKHN0YWNrZnJhbWUuZnVuY3Rpb25OYW1lIHx8ICcnKS5pbmRleE9mKCdTdGFja1RyYWNlR1BTJCQnKSA9PT0gLTEgJiZcbiAgICAgICAgICAgICAgICAoc3RhY2tmcmFtZS5mdW5jdGlvbk5hbWUgfHwgJycpLmluZGV4T2YoJ1N0YWNrR2VuZXJhdG9yJCQnKSA9PT0gLTE7XG4gICAgICAgIH0sXG4gICAgICAgIHNvdXJjZUNhY2hlOiB7fVxuICAgIH07XG5cbiAgICB2YXIgX2dlbmVyYXRlRXJyb3IgPSBmdW5jdGlvbiBTdGFja1RyYWNlJCRHZW5lcmF0ZUVycm9yKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gRXJyb3IgbXVzdCBiZSB0aHJvd24gdG8gZ2V0IHN0YWNrIGluIElFXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE1lcmdlIDIgZ2l2ZW4gT2JqZWN0cy4gSWYgYSBjb25mbGljdCBvY2N1cnMgdGhlIHNlY29uZCBvYmplY3Qgd2lucy5cbiAgICAgKiBEb2VzIG5vdCBkbyBkZWVwIG1lcmdlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBmaXJzdCBiYXNlIG9iamVjdFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzZWNvbmQgb3ZlcnJpZGVzXG4gICAgICogQHJldHVybnMge09iamVjdH0gbWVyZ2VkIGZpcnN0IGFuZCBzZWNvbmRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9tZXJnZShmaXJzdCwgc2Vjb25kKSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB7fTtcblxuICAgICAgICBbZmlyc3QsIHNlY29uZF0uZm9yRWFjaChmdW5jdGlvbihvYmopIHtcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRbcHJvcF0gPSBvYmpbcHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfaXNTaGFwZWRMaWtlUGFyc2FibGVFcnJvcihlcnIpIHtcbiAgICAgICAgcmV0dXJuIGVyci5zdGFjayB8fCBlcnJbJ29wZXJhI3NvdXJjZWxvYyddO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9maWx0ZXJlZChzdGFja2ZyYW1lcywgZmlsdGVyKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZmlsdGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RhY2tmcmFtZXMuZmlsdGVyKGZpbHRlcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0YWNrZnJhbWVzO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgYSBiYWNrdHJhY2UgZnJvbSBpbnZvY2F0aW9uIHBvaW50LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXl9IG9mIFN0YWNrRnJhbWVcbiAgICAgICAgICovXG4gICAgICAgIGdldDogZnVuY3Rpb24gU3RhY2tUcmFjZSQkZ2V0KG9wdHMpIHtcbiAgICAgICAgICAgIHZhciBlcnIgPSBfZ2VuZXJhdGVFcnJvcigpO1xuICAgICAgICAgICAgcmV0dXJuIF9pc1NoYXBlZExpa2VQYXJzYWJsZUVycm9yKGVycikgPyB0aGlzLmZyb21FcnJvcihlcnIsIG9wdHMpIDogdGhpcy5nZW5lcmF0ZUFydGlmaWNpYWxseShvcHRzKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IGEgYmFja3RyYWNlIGZyb20gaW52b2NhdGlvbiBwb2ludC5cbiAgICAgICAgICogSU1QT1JUQU5UOiBEb2VzIG5vdCBoYW5kbGUgc291cmNlIG1hcHMgb3IgZ3Vlc3MgZnVuY3Rpb24gbmFtZXMhXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheX0gb2YgU3RhY2tGcmFtZVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0U3luYzogZnVuY3Rpb24gU3RhY2tUcmFjZSQkZ2V0U3luYyhvcHRzKSB7XG4gICAgICAgICAgICBvcHRzID0gX21lcmdlKF9vcHRpb25zLCBvcHRzKTtcbiAgICAgICAgICAgIHZhciBlcnIgPSBfZ2VuZXJhdGVFcnJvcigpO1xuICAgICAgICAgICAgdmFyIHN0YWNrID0gX2lzU2hhcGVkTGlrZVBhcnNhYmxlRXJyb3IoZXJyKSA/IEVycm9yU3RhY2tQYXJzZXIucGFyc2UoZXJyKSA6IFN0YWNrR2VuZXJhdG9yLmJhY2t0cmFjZShvcHRzKTtcbiAgICAgICAgICAgIHJldHVybiBfZmlsdGVyZWQoc3RhY2ssIG9wdHMuZmlsdGVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2l2ZW4gYW4gZXJyb3Igb2JqZWN0LCBwYXJzZSBpdC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFcnJvcn0gZXJyb3Igb2JqZWN0XG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gICAgICAgICAqIEByZXR1cm5zIHtQcm9taXNlfSBmb3IgQXJyYXlbU3RhY2tGcmFtZX1cbiAgICAgICAgICovXG4gICAgICAgIGZyb21FcnJvcjogZnVuY3Rpb24gU3RhY2tUcmFjZSQkZnJvbUVycm9yKGVycm9yLCBvcHRzKSB7XG4gICAgICAgICAgICBvcHRzID0gX21lcmdlKF9vcHRpb25zLCBvcHRzKTtcbiAgICAgICAgICAgIHZhciBncHMgPSBuZXcgU3RhY2tUcmFjZUdQUyhvcHRzKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YWNrZnJhbWVzID0gX2ZpbHRlcmVkKEVycm9yU3RhY2tQYXJzZXIucGFyc2UoZXJyb3IpLCBvcHRzLmZpbHRlcik7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShQcm9taXNlLmFsbChzdGFja2ZyYW1lcy5tYXAoZnVuY3Rpb24oc2YpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHJlc29sdmVPcmlnaW5hbCgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHNmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZ3BzLnBpbnBvaW50KHNmKS50aGVuKHJlc29sdmUsIHJlc29sdmVPcmlnaW5hbClbJ2NhdGNoJ10ocmVzb2x2ZU9yaWdpbmFsKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSkpKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVzZSBTdGFja0dlbmVyYXRvciB0byBnZW5lcmF0ZSBhIGJhY2t0cmFjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAgICAgICAgICogQHJldHVybnMge1Byb21pc2V9IG9mIEFycmF5W1N0YWNrRnJhbWVdXG4gICAgICAgICAqL1xuICAgICAgICBnZW5lcmF0ZUFydGlmaWNpYWxseTogZnVuY3Rpb24gU3RhY2tUcmFjZSQkZ2VuZXJhdGVBcnRpZmljaWFsbHkob3B0cykge1xuICAgICAgICAgICAgb3B0cyA9IF9tZXJnZShfb3B0aW9ucywgb3B0cyk7XG4gICAgICAgICAgICB2YXIgc3RhY2tGcmFtZXMgPSBTdGFja0dlbmVyYXRvci5iYWNrdHJhY2Uob3B0cyk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdHMuZmlsdGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgc3RhY2tGcmFtZXMgPSBzdGFja0ZyYW1lcy5maWx0ZXIob3B0cy5maWx0ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShzdGFja0ZyYW1lcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdpdmVuIGEgZnVuY3Rpb24sIHdyYXAgaXQgc3VjaCB0aGF0IGludm9jYXRpb25zIHRyaWdnZXIgYSBjYWxsYmFjayB0aGF0XG4gICAgICAgICAqIGlzIGNhbGxlZCB3aXRoIGEgc3RhY2sgdHJhY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIHRvIGJlIGluc3RydW1lbnRlZFxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBmdW5jdGlvbiB0byBjYWxsIHdpdGggYSBzdGFjayB0cmFjZSBvbiBpbnZvY2F0aW9uXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGVycmJhY2sgb3B0aW9uYWwgZnVuY3Rpb24gdG8gY2FsbCB3aXRoIGVycm9yIGlmIHVuYWJsZSB0byBnZXQgc3RhY2sgdHJhY2UuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB0aGlzQXJnIG9wdGlvbmFsIGNvbnRleHQgb2JqZWN0IChlLmcuIHdpbmRvdylcbiAgICAgICAgICovXG4gICAgICAgIGluc3RydW1lbnQ6IGZ1bmN0aW9uIFN0YWNrVHJhY2UkJGluc3RydW1lbnQoZm4sIGNhbGxiYWNrLCBlcnJiYWNrLCB0aGlzQXJnKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5zdHJ1bWVudCBub24tZnVuY3Rpb24gb2JqZWN0Jyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBmbi5fX3N0YWNrdHJhY2VPcmlnaW5hbEZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgLy8gQWxyZWFkeSBpbnN0cnVtZW50ZWQsIHJldHVybiBnaXZlbiBGdW5jdGlvblxuICAgICAgICAgICAgICAgIHJldHVybiBmbjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGluc3RydW1lbnRlZCA9IGZ1bmN0aW9uIFN0YWNrVHJhY2UkJGluc3RydW1lbnRlZCgpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldCgpLnRoZW4oY2FsbGJhY2ssIGVycmJhY2spWydjYXRjaCddKGVycmJhY2spO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpc0FyZyB8fCB0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9pc1NoYXBlZExpa2VQYXJzYWJsZUVycm9yKGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZyb21FcnJvcihlKS50aGVuKGNhbGxiYWNrLCBlcnJiYWNrKVsnY2F0Y2gnXShlcnJiYWNrKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgICAgIGluc3RydW1lbnRlZC5fX3N0YWNrdHJhY2VPcmlnaW5hbEZuID0gZm47XG5cbiAgICAgICAgICAgIHJldHVybiBpbnN0cnVtZW50ZWQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdpdmVuIGEgZnVuY3Rpb24gdGhhdCBoYXMgYmVlbiBpbnN0cnVtZW50ZWQsXG4gICAgICAgICAqIHJldmVydCB0aGUgZnVuY3Rpb24gdG8gaXQncyBvcmlnaW5hbCAobm9uLWluc3RydW1lbnRlZCkgc3RhdGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIHRvIGRlLWluc3RydW1lbnRcbiAgICAgICAgICovXG4gICAgICAgIGRlaW5zdHJ1bWVudDogZnVuY3Rpb24gU3RhY2tUcmFjZSQkZGVpbnN0cnVtZW50KGZuKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZGUtaW5zdHJ1bWVudCBub24tZnVuY3Rpb24gb2JqZWN0Jyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBmbi5fX3N0YWNrdHJhY2VPcmlnaW5hbEZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLl9fc3RhY2t0cmFjZU9yaWdpbmFsRm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEZ1bmN0aW9uIG5vdCBpbnN0cnVtZW50ZWQsIHJldHVybiBvcmlnaW5hbFxuICAgICAgICAgICAgICAgIHJldHVybiBmbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2l2ZW4gYW4gZXJyb3IgbWVzc2FnZSBhbmQgQXJyYXkgb2YgU3RhY2tGcmFtZXMsIHNlcmlhbGl6ZSBhbmQgUE9TVCB0byBnaXZlbiBVUkwuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IHN0YWNrZnJhbWVzXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGVycm9yTXNnXG4gICAgICAgICAqL1xuICAgICAgICByZXBvcnQ6IGZ1bmN0aW9uIFN0YWNrVHJhY2UkJHJlcG9ydChzdGFja2ZyYW1lcywgdXJsLCBlcnJvck1zZykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIHZhciByZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IHJlamVjdDtcbiAgICAgICAgICAgICAgICByZXEub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gb25yZWFkeXN0YXRlY2hhbmdlKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVxLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXEuc3RhdHVzID49IDIwMCAmJiByZXEuc3RhdHVzIDwgNDAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignUE9TVCB0byAnICsgdXJsICsgJyBmYWlsZWQgd2l0aCBzdGF0dXM6ICcgKyByZXEuc3RhdHVzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJlcS5vcGVuKCdwb3N0JywgdXJsKTtcbiAgICAgICAgICAgICAgICByZXEuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcblxuICAgICAgICAgICAgICAgIHZhciByZXBvcnRQYXlsb2FkID0ge3N0YWNrOiBzdGFja2ZyYW1lc307XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yTXNnICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0UGF5bG9hZC5tZXNzYWdlID0gZXJyb3JNc2c7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVxLnNlbmQoSlNPTi5zdHJpbmdpZnkocmVwb3J0UGF5bG9hZCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufSkpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgQ2F0ZWdvcnlTZXJ2aWNlXzEgPSByZXF1aXJlKFwiLi4vbG9nL2NhdGVnb3J5L0NhdGVnb3J5U2VydmljZVwiKTtcbnZhciBMb2dnZXJPcHRpb25zXzEgPSByZXF1aXJlKFwiLi4vbG9nL0xvZ2dlck9wdGlvbnNcIik7XG52YXIgRGF0YVN0cnVjdHVyZXNfMSA9IHJlcXVpcmUoXCIuLi91dGlscy9EYXRhU3RydWN0dXJlc1wiKTtcbi8qKlxuICogSW1wbGVtZW50YXRpb24gY2xhc3MgZm9yIENhdGVnb3J5U2VydmljZUNvbnRyb2wuXG4gKi9cbnZhciBDYXRlZ29yeVNlcnZpY2VDb250cm9sSW1wbCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ2F0ZWdvcnlTZXJ2aWNlQ29udHJvbEltcGwoKSB7XG4gICAgfVxuICAgIENhdGVnb3J5U2VydmljZUNvbnRyb2xJbXBsLnByb3RvdHlwZS5oZWxwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1jb25zb2xlICovXG4gICAgICAgIGNvbnNvbGUubG9nKENhdGVnb3J5U2VydmljZUNvbnRyb2xJbXBsLl9oZWxwKTtcbiAgICAgICAgLyogdHNsaW50OmVuYWJsZTpuby1jb25zb2xlICovXG4gICAgfTtcbiAgICBDYXRlZ29yeVNlcnZpY2VDb250cm9sSW1wbC5wcm90b3R5cGUuZXhhbXBsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tY29uc29sZSAqL1xuICAgICAgICBjb25zb2xlLmxvZyhDYXRlZ29yeVNlcnZpY2VDb250cm9sSW1wbC5fZXhhbXBsZSk7XG4gICAgICAgIC8qIHRzbGludDplbmFibGU6bm8tY29uc29sZSAqL1xuICAgIH07XG4gICAgQ2F0ZWdvcnlTZXJ2aWNlQ29udHJvbEltcGwucHJvdG90eXBlLnNob3dTZXR0aW5ncyA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICBpZiAoaWQgPT09IHZvaWQgMCkgeyBpZCA9IFwiYWxsXCI7IH1cbiAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBEYXRhU3RydWN0dXJlc18xLlN0cmluZ0J1aWxkZXIoKTtcbiAgICAgICAgdmFyIHNlcnZpY2UgPSBDYXRlZ29yeVNlcnZpY2VDb250cm9sSW1wbC5fZ2V0Q2F0ZWdvcnlTZXJ2aWNlKCk7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzID0gQ2F0ZWdvcnlTZXJ2aWNlQ29udHJvbEltcGwuX2dldENhdGVnb3JpZXMoaWQpO1xuICAgICAgICBjYXRlZ29yaWVzLmZvckVhY2goZnVuY3Rpb24gKGNhdGVnb3J5KSB7XG4gICAgICAgICAgICBDYXRlZ29yeVNlcnZpY2VDb250cm9sSW1wbC5fcHJvY2Vzc0NhdGVnb3J5KHNlcnZpY2UsIGNhdGVnb3J5LCByZXN1bHQsIDApO1xuICAgICAgICB9KTtcbiAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tY29uc29sZSAqL1xuICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQudG9TdHJpbmcoKSk7XG4gICAgICAgIC8qIHRzbGludDplbmFibGU6bm8tY29uc29sZSAqL1xuICAgIH07XG4gICAgQ2F0ZWdvcnlTZXJ2aWNlQ29udHJvbEltcGwucHJvdG90eXBlLmNoYW5nZSA9IGZ1bmN0aW9uIChzZXR0aW5ncykge1xuICAgICAgICB2YXIgc2VydmljZSA9IENhdGVnb3J5U2VydmljZUNvbnRyb2xJbXBsLl9nZXRDYXRlZ29yeVNlcnZpY2UoKTtcbiAgICAgICAgdmFyIGNhdGVnb3JpZXMgPSBDYXRlZ29yeVNlcnZpY2VDb250cm9sSW1wbC5fZ2V0Q2F0ZWdvcmllcyhzZXR0aW5ncy5jYXRlZ29yeSk7XG4gICAgICAgIHZhciBsb2dMZXZlbCA9IG51bGw7XG4gICAgICAgIHZhciBmb3JtYXRFbnVtID0gbnVsbDtcbiAgICAgICAgdmFyIHNob3dDYXRlZ29yeU5hbWUgPSBudWxsO1xuICAgICAgICB2YXIgc2hvd1RpbWVzdGFtcCA9IG51bGw7XG4gICAgICAgIHZhciByZXN1bHQgPSBudWxsO1xuICAgICAgICB2YXIgYWRkUmVzdWx0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IFwiLCBcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgYWRkUmVzdWx0KFwicmVjdXJzaXZlPVwiICsgc2V0dGluZ3MucmVjdXJzaXZlKTtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXR0aW5ncy5sb2dMZXZlbCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgbG9nTGV2ZWwgPSBMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuZnJvbVN0cmluZyhzZXR0aW5ncy5sb2dMZXZlbCk7XG4gICAgICAgICAgICBhZGRSZXN1bHQoXCJsb2dMZXZlbD1cIiArIHNldHRpbmdzLmxvZ0xldmVsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHNldHRpbmdzLmxvZ0Zvcm1hdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgZm9ybWF0RW51bSA9IExvZ2dlck9wdGlvbnNfMS5EYXRlRm9ybWF0RW51bS5mcm9tU3RyaW5nKHNldHRpbmdzLmxvZ0Zvcm1hdCk7XG4gICAgICAgICAgICBhZGRSZXN1bHQoXCJsb2dGb3JtYXQ9XCIgKyBzZXR0aW5ncy5sb2dGb3JtYXQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0dGluZ3Muc2hvd0NhdGVnb3J5TmFtZSA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgICAgIHNob3dDYXRlZ29yeU5hbWUgPSBzZXR0aW5ncy5zaG93Q2F0ZWdvcnlOYW1lO1xuICAgICAgICAgICAgYWRkUmVzdWx0KFwic2hvd0NhdGVnb3J5TmFtZT1cIiArIHNldHRpbmdzLnNob3dDYXRlZ29yeU5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0dGluZ3Muc2hvd1RpbWVzdGFtcCA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgICAgIHNob3dUaW1lc3RhbXAgPSBzZXR0aW5ncy5zaG93VGltZXN0YW1wO1xuICAgICAgICAgICAgYWRkUmVzdWx0KFwic2hvd1RpbWVzdGFtcD1cIiArIHNldHRpbmdzLnNob3dUaW1lc3RhbXApO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhcHBseUNoYW5nZXMgPSBmdW5jdGlvbiAoY2F0KSB7XG4gICAgICAgICAgICB2YXIgY2F0ZWdvcnlTZXR0aW5ncyA9IHNlcnZpY2UuZ2V0Q2F0ZWdvcnlTZXR0aW5ncyhjYXQpO1xuICAgICAgICAgICAgLy8gU2hvdWxkIG5vdCBoYXBwZW4gYnV0IG1ha2UgdHNsaW50IGhhcHB5XG4gICAgICAgICAgICBpZiAoY2F0ZWdvcnlTZXR0aW5ncyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChsb2dMZXZlbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeVNldHRpbmdzLmxvZ0xldmVsID0gbG9nTGV2ZWw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmb3JtYXRFbnVtICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5U2V0dGluZ3MubG9nRm9ybWF0LmRhdGVGb3JtYXQuZm9ybWF0RW51bSA9IGZvcm1hdEVudW07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzaG93VGltZXN0YW1wICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5U2V0dGluZ3MubG9nRm9ybWF0LnNob3dUaW1lU3RhbXAgPSBzaG93VGltZXN0YW1wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2hvd0NhdGVnb3J5TmFtZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeVNldHRpbmdzLmxvZ0Zvcm1hdC5zaG93Q2F0ZWdvcnlOYW1lID0gc2hvd0NhdGVnb3J5TmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNhdGVnb3JpZXMuZm9yRWFjaChmdW5jdGlvbiAoY2F0KSB7IHJldHVybiBDYXRlZ29yeVNlcnZpY2VDb250cm9sSW1wbC5fYXBwbHlUb0NhdGVnb3J5KGNhdCwgc2V0dGluZ3MucmVjdXJzaXZlLCBhcHBseUNoYW5nZXMpOyB9KTtcbiAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tY29uc29sZSAqL1xuICAgICAgICBjb25zb2xlLmxvZyhcIkFwcGxpZWQgY2hhbmdlczogXCIgKyByZXN1bHQgKyBcIiB0byBjYXRlZ29yaWVzICdcIiArIHNldHRpbmdzLmNhdGVnb3J5ICsgXCInLlwiKTtcbiAgICAgICAgLyogdHNsaW50OmVuYWJsZTpuby1jb25zb2xlICovXG4gICAgfTtcbiAgICBDYXRlZ29yeVNlcnZpY2VDb250cm9sSW1wbC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgaWYgKGlkID09PSB2b2lkIDApIHsgaWQgPSBcImFsbFwiOyB9XG4gICAgICAgIHZhciBzZXJ2aWNlID0gQ2F0ZWdvcnlTZXJ2aWNlQ29udHJvbEltcGwuX2dldENhdGVnb3J5U2VydmljZSgpO1xuICAgICAgICB2YXIgY2F0ZWdvcmllcyA9IENhdGVnb3J5U2VydmljZUNvbnRyb2xJbXBsLl9nZXRDYXRlZ29yaWVzKGlkKTtcbiAgICAgICAgdmFyIGFwcGx5Q2hhbmdlcyA9IGZ1bmN0aW9uIChjYXQpIHtcbiAgICAgICAgICAgIHZhciBjYXRlZ29yeVNldHRpbmdzID0gc2VydmljZS5nZXRDYXRlZ29yeVNldHRpbmdzKGNhdCk7XG4gICAgICAgICAgICB2YXIgb3JpZ2luYWwgPSBzZXJ2aWNlLmdldE9yaWdpbmFsQ2F0ZWdvcnlTZXR0aW5ncyhjYXQpO1xuICAgICAgICAgICAgLy8gU2hvdWxkIG5vdCBoYXBwZW4gYnV0IG1ha2UgdHNsaW50IGhhcHB5XG4gICAgICAgICAgICBpZiAoY2F0ZWdvcnlTZXR0aW5ncyAhPT0gbnVsbCAmJiBvcmlnaW5hbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNhdGVnb3J5U2V0dGluZ3MubG9nTGV2ZWwgPSBvcmlnaW5hbC5sb2dMZXZlbDtcbiAgICAgICAgICAgICAgICBjYXRlZ29yeVNldHRpbmdzLmxvZ0Zvcm1hdC5kYXRlRm9ybWF0LmZvcm1hdEVudW0gPSBvcmlnaW5hbC5sb2dGb3JtYXQuZGF0ZUZvcm1hdC5mb3JtYXRFbnVtO1xuICAgICAgICAgICAgICAgIGNhdGVnb3J5U2V0dGluZ3MubG9nRm9ybWF0LnNob3dUaW1lU3RhbXAgPSBvcmlnaW5hbC5sb2dGb3JtYXQuc2hvd1RpbWVTdGFtcDtcbiAgICAgICAgICAgICAgICBjYXRlZ29yeVNldHRpbmdzLmxvZ0Zvcm1hdC5zaG93Q2F0ZWdvcnlOYW1lID0gb3JpZ2luYWwubG9nRm9ybWF0LnNob3dDYXRlZ29yeU5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNhdGVnb3JpZXMuZm9yRWFjaChmdW5jdGlvbiAoY2F0KSB7IHJldHVybiBDYXRlZ29yeVNlcnZpY2VDb250cm9sSW1wbC5fYXBwbHlUb0NhdGVnb3J5KGNhdCwgdHJ1ZSwgYXBwbHlDaGFuZ2VzKTsgfSk7XG4gICAgICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLWNvbnNvbGUgKi9cbiAgICAgICAgY29uc29sZS5sb2coXCJBcHBsaWVkIHJlc2V0IHRvIGNhdGVnb3J5OiBcIiArIGlkICsgXCIuXCIpO1xuICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLWNvbnNvbGUgKi9cbiAgICB9O1xuICAgIENhdGVnb3J5U2VydmljZUNvbnRyb2xJbXBsLl9wcm9jZXNzQ2F0ZWdvcnkgPSBmdW5jdGlvbiAoc2VydmljZSwgY2F0ZWdvcnksIHJlc3VsdCwgaW5kZW50KSB7XG4gICAgICAgIHZhciBzZXR0aW5ncyA9IHNlcnZpY2UuZ2V0Q2F0ZWdvcnlTZXR0aW5ncyhjYXRlZ29yeSk7XG4gICAgICAgIGlmIChzZXR0aW5ncyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmVzdWx0LmFwcGVuZChcIiAgXCIgKyBjYXRlZ29yeS5pZCArIFwiOiBcIik7XG4gICAgICAgICAgICBpZiAoaW5kZW50ID4gMCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5kZW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmFwcGVuZChcIiAgXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdC5hcHBlbmQoY2F0ZWdvcnkubmFtZSArIFwiIChcIiArIExvZ2dlck9wdGlvbnNfMS5Mb2dMZXZlbFtzZXR0aW5ncy5sb2dMZXZlbF0udG9TdHJpbmcoKSArIFwiQFwiICsgTG9nZ2VyT3B0aW9uc18xLkxvZ2dlclR5cGVbc2V0dGluZ3MubG9nZ2VyVHlwZV0udG9TdHJpbmcoKSArIFwiKVxcblwiKTtcbiAgICAgICAgICAgIGlmIChjYXRlZ29yeS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnkuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgQ2F0ZWdvcnlTZXJ2aWNlQ29udHJvbEltcGwuX3Byb2Nlc3NDYXRlZ29yeShzZXJ2aWNlLCBjaGlsZCwgcmVzdWx0LCBpbmRlbnQgKyAxKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgQ2F0ZWdvcnlTZXJ2aWNlQ29udHJvbEltcGwuX2FwcGx5VG9DYXRlZ29yeSA9IGZ1bmN0aW9uIChjYXRlZ29yeSwgcmVjdXJzaXZlLCBhcHBseSkge1xuICAgICAgICBhcHBseShjYXRlZ29yeSk7XG4gICAgICAgIGlmIChyZWN1cnNpdmUpIHtcbiAgICAgICAgICAgIGNhdGVnb3J5LmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgQ2F0ZWdvcnlTZXJ2aWNlQ29udHJvbEltcGwuX2FwcGx5VG9DYXRlZ29yeShjaGlsZCwgcmVjdXJzaXZlLCBhcHBseSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQ2F0ZWdvcnlTZXJ2aWNlQ29udHJvbEltcGwuX2dldENhdGVnb3J5U2VydmljZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIENhdGVnb3J5U2VydmljZV8xLkNhdGVnb3J5U2VydmljZUltcGwuZ2V0SW5zdGFuY2UoKTtcbiAgICB9O1xuICAgIENhdGVnb3J5U2VydmljZUNvbnRyb2xJbXBsLl9nZXRDYXRlZ29yaWVzID0gZnVuY3Rpb24gKGlkQ2F0ZWdvcnkpIHtcbiAgICAgICAgdmFyIHNlcnZpY2UgPSBDYXRlZ29yeVNlcnZpY2VDb250cm9sSW1wbC5fZ2V0Q2F0ZWdvcnlTZXJ2aWNlKCk7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzID0gW107XG4gICAgICAgIGlmIChpZENhdGVnb3J5ID09PSBcImFsbFwiKSB7XG4gICAgICAgICAgICBjYXRlZ29yaWVzID0gc2VydmljZS5nZXRSb290Q2F0ZWdvcmllcygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGNhdGVnb3J5ID0gc2VydmljZS5nZXRDYXRlZ29yeUJ5SWQoaWRDYXRlZ29yeSk7XG4gICAgICAgICAgICBpZiAoY2F0ZWdvcnkgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gZmluZCBjYXRlZ29yeSB3aXRoIGlkIFwiICsgaWRDYXRlZ29yeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRlZ29yaWVzLnB1c2goY2F0ZWdvcnkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYXRlZ29yaWVzO1xuICAgIH07XG4gICAgQ2F0ZWdvcnlTZXJ2aWNlQ29udHJvbEltcGwuX2hlbHAgPSBcIlxcbiAgaGVscCgpOiB2b2lkXFxuICAgICoqIFNob3dzIHRoaXMgaGVscC5cXG5cXG4gIGV4YW1wbGUoKTogdm9pZFxcbiAgICAqKiBTaG93cyBhbiBleGFtcGxlIG9uIGhvdyB0byB1c2UgdGhpcy5cXG5cXG4gIHNob3dTZXR0aW5ncyhpZDogbnVtYmVyIHwgXFxcImFsbFxcXCIgPSBcXFwiYWxsXFxcIik6IHZvaWRcXG4gICAgKiogU2hvd3Mgc2V0dGluZ3MgZm9yIGEgc3BlY2lmaWMgY2F0ZWdvcnksIG9yIGZvciBhbGwuIFRoZSBpZCBvZiBjYXRlZ29yaWVzIGNhbiBiZSBmb3VuZCBieSBjYWxsaW5nIHRoaXMgbWV0aG9kIHdpdGhvdXQgcGFyYW1ldGVyLlxcblxcbiAgY2hhbmdlKHNldHRpbmdzOiBDYXRlZ29yeVNlcnZpY2VDb250cm9sU2V0dGluZ3MpOiB2b2lkXFxuICAgICoqIENoYW5nZXMgdGhlIGN1cnJlbnQgc2V0dGluZ3MgZm9yIG9uZSBvciBhbGwgY2F0ZWdvcmllcy5cXG4gICAgKipcXG4gICAgICAgQ2F0ZWdvcnlTZXJ2aWNlQ29udHJvbFNldHRpbmdzLCBwcm9wZXJ0aWVzIG9mIG9iamVjdDpcXG4gICAgICAgICBjYXRlZ29yeTogbnVtYmVyIHwgXFxcImFsbFxcXCJcXG4gICAgICAgICAgICoqIEFwcGx5IHRvIHNwZWNpZmljIGNhdGVnb3J5LCBvciBcXFwiYWxsXFxcIi5cXG4gICAgICAgICAgICoqIFJlcXVpcmVkXFxuXFxuICAgICAgICAgcmVjdXJzaXZlOiBib29sZWFuXFxuICAgICAgICAgICAqKiBBcHBseSB0byBjaGlsZCBjYXRlZ29yaWVzICh0cnVlKSBvciBub3QuXFxuICAgICAgICAgICAqKiBSZXF1aXJlZFxcblxcbiAgICAgICAgIGxvZ0xldmVsOiBcXFwiRmF0YWxcXFwiIHwgXFxcIkVycm9yXFxcIiB8IFxcXCJXYXJuXFxcIiB8IFxcXCJJbmZvXFxcIiB8IFxcXCJEZWJ1Z1xcXCIgfCBcXFwiVHJhY2VcXFwiIHwgdW5kZWZpbmVkXFxuICAgICAgICAgICAqKiBTZXQgbG9nIGxldmVsLCB1bmRlZmluZWQgd2lsbCBub3QgY2hhbmdlIHRoZSBzZXR0aW5nLlxcbiAgICAgICAgICAgKiogT3B0aW9uYWxcXG5cXG4gICAgICAgICBsb2dGb3JtYXQ6IFxcXCJEZWZhdWx0XFxcIiB8IFxcXCJZZWFyTW9udGhEYXlUaW1lXFxcIiB8IFxcXCJZZWFyRGF5TW9udGhXaXRoRnVsbFRpbWVcXFwiIHwgXFxcIlllYXJEYXlNb250aFRpbWVcXFwiIHwgdW5kZWZpbmVkXFxuICAgICAgICAgICAqKiBTZXQgdGhlIGxvZyBmb3JtYXQsIHVuZGVmaW5lZCB3aWxsIG5vdCBjaGFuZ2UgdGhlIHNldHRpbmcuXFxuICAgICAgICAgICAqKiBPcHRpb25hbFxcblxcbiAgICAgICAgIHNob3dUaW1lc3RhbXA6IGJvb2xlYW4gfCB1bmRlZmluZWRcXG4gICAgICAgICAgICoqIFdoZXRoZXIgdG8gc2hvdyB0aW1lc3RhbXAsIHVuZGVmaW5lZCB3aWxsIG5vdCBjaGFuZ2UgdGhlIHNldHRpbmcuXFxuICAgICAgICAgICAqKiBPcHRpb25hbFxcblxcbiAgICAgICAgIHNob3dDYXRlZ29yeU5hbWU6IGJvb2xlYW4gfCB1bmRlZmluZWRcXG4gICAgICAgICAgICoqIFdoZXRoZXIgdG8gc2hvdyB0aGUgY2F0ZWdvcnkgbmFtZSwgdW5kZWZpbmVkIHdpbGwgbm90IGNoYW5nZSB0aGUgc2V0dGluZy5cXG4gICAgICAgICAgICoqIE9wdGlvbmFsXFxuXFxuICAgcmVzZXQoaWQ6IG51bWJlciB8IFxcXCJhbGxcXFwiKTogdm9pZFxcbiAgICAgKiogUmVzZXRzIGV2ZXJ5dGhpbmcgdG8gb3JpZ2luYWwgdmFsdWVzLCBmb3Igb25lIHNwZWNpZmljIG9yIGZvciBhbGwgY2F0ZWdvcmllcy5cXG5cIjtcbiAgICBDYXRlZ29yeVNlcnZpY2VDb250cm9sSW1wbC5fZXhhbXBsZSA9IFwiXFxuICBFeGFtcGxlczpcXG4gICAgY2hhbmdlKHtjYXRlZ29yeTogXFxcImFsbFxcXCIsIHJlY3Vyc2l2ZTp0cnVlLCBsb2dMZXZlbDogXFxcIkluZm9cXFwifSlcXG4gICAgICAqKiBDaGFuZ2UgbG9nbGV2ZWwgdG8gSW5mbyBmb3IgYWxsIGNhdGVnb3JpZXMsIGFwcGx5IHRvIGNoaWxkIGNhdGVnb3JpZXMgYXMgd2VsbC5cXG5cXG4gICAgY2hhbmdlKHtjYXRlZ29yeTogMSwgcmVjdXJzaXZlOmZhbHNlLCBsb2dMZXZlbDogXFxcIldhcm5cXFwifSlcXG4gICAgICAqKiBDaGFuZ2UgbG9nTGV2ZWwgZm9yIGNhdGVnb3J5IDEsIGRvIG5vdCByZWN1cnNlLlxcblxcbiAgICBjaGFuZ2Uoe2NhdGVnb3J5OiBcXFwiYWxsXFxcIiwgcmVjdXJzaXZlOnRydWUsIGxvZ0xldmVsOiBcXFwiRGVidWdcXFwiLCBsb2dGb3JtYXQ6IFxcXCJZZWFyRGF5TW9udGhUaW1lXFxcIiwgc2hvd1RpbWVzdGFtcDpmYWxzZSwgc2hvd0NhdGVnb3J5TmFtZTpmYWxzZX0pXFxuICAgICAgKiogQ2hhbmdlIGxvZ2xldmVsIHRvIERlYnVnIGZvciBhbGwgY2F0ZWdvcmllcywgYXBwbHkgZm9ybWF0LCBkbyBub3Qgc2hvdyB0aW1lc3RhbXAgYW5kIGNhdGVnb3J5IG5hbWVzIC0gcmVjdXJzaXZlbHkgdG8gY2hpbGQgY2F0ZWdvcmllcy5cXG5cXG5cIjtcbiAgICByZXR1cm4gQ2F0ZWdvcnlTZXJ2aWNlQ29udHJvbEltcGw7XG59KCkpO1xuZXhwb3J0cy5DYXRlZ29yeVNlcnZpY2VDb250cm9sSW1wbCA9IENhdGVnb3J5U2VydmljZUNvbnRyb2xJbXBsO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Q2F0ZWdvcnlTZXJ2aWNlQ29udHJvbC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBMb2dnZXJPcHRpb25zXzEgPSByZXF1aXJlKFwiLi4vbG9nL0xvZ2dlck9wdGlvbnNcIik7XG52YXIgTEZTZXJ2aWNlXzEgPSByZXF1aXJlKFwiLi4vbG9nL3N0YW5kYXJkL0xGU2VydmljZVwiKTtcbnZhciBEYXRhU3RydWN0dXJlc18xID0gcmVxdWlyZShcIi4uL3V0aWxzL0RhdGFTdHJ1Y3R1cmVzXCIpO1xudmFyIExvZ2dlckNvbnRyb2xJbXBsID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMb2dnZXJDb250cm9sSW1wbCgpIHtcbiAgICB9XG4gICAgTG9nZ2VyQ29udHJvbEltcGwucHJvdG90eXBlLmhlbHAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLWNvbnNvbGUgKi9cbiAgICAgICAgY29uc29sZS5sb2coTG9nZ2VyQ29udHJvbEltcGwuX2hlbHApO1xuICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLWNvbnNvbGUgKi9cbiAgICB9O1xuICAgIExvZ2dlckNvbnRyb2xJbXBsLnByb3RvdHlwZS5saXN0RmFjdG9yaWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcnRTZXR0aW5nc0ZhY3RvcmllcyA9IExvZ2dlckNvbnRyb2xJbXBsLl9nZXRSdW50aW1lU2V0dGluZ3NMb2dnZXJGYWN0b3JpZXMoKTtcbiAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBEYXRhU3RydWN0dXJlc18xLlN0cmluZ0J1aWxkZXIoKTtcbiAgICAgICAgcmVzdWx0LmFwcGVuZExpbmUoXCJSZWdpc3RlcmVkIExvZ2dlckZhY3RvcmllcyAoaW5kZXggLyBuYW1lKVwiKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBydFNldHRpbmdzRmFjdG9yaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcnRTZXR0aW5nc0ZhY3RvcnkgPSBydFNldHRpbmdzRmFjdG9yaWVzW2ldO1xuICAgICAgICAgICAgcmVzdWx0LmFwcGVuZChcIiAgXCIgKyBpKS5hcHBlbmQoXCI6IFwiICsgcnRTZXR0aW5nc0ZhY3RvcnkuZ2V0TmFtZSgpICsgXCJcXG5cIik7XG4gICAgICAgIH1cbiAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tY29uc29sZSAqL1xuICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQudG9TdHJpbmcoKSk7XG4gICAgICAgIC8qIHRzbGludDplbmFibGU6bm8tY29uc29sZSAqL1xuICAgIH07XG4gICAgTG9nZ2VyQ29udHJvbEltcGwucHJvdG90eXBlLnNob3dTZXR0aW5ncyA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICBpZiAoaWQgPT09IHZvaWQgMCkgeyBpZCA9IFwiYWxsXCI7IH1cbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICBpZiAoaWQgPT09IFwiYWxsXCIpIHtcbiAgICAgICAgICAgIHZhciBpZHhfMSA9IDA7XG4gICAgICAgICAgICBMb2dnZXJDb250cm9sSW1wbC5fZ2V0UnVudGltZVNldHRpbmdzTG9nZ2VyRmFjdG9yaWVzKCkuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ldyBEYXRhU3RydWN0dXJlc18xLlR1cGxlUGFpcihpZHhfMSsrLCBpdGVtKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBzZXR0aW5ncyA9IExvZ2dlckNvbnRyb2xJbXBsLl9nZXRSdW50aW1lU2V0dGluZ3NMb2dnZXJGYWN0b3JpZXMoKTtcbiAgICAgICAgICAgIGlmIChpZCA+PSAwICYmIGlkIDwgc2V0dGluZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IERhdGFTdHJ1Y3R1cmVzXzEuVHVwbGVQYWlyKGlkLCBzZXR0aW5nc1tpZF0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlJlcXVlc3RlZCBudW1iZXI6IFwiICsgaWQgKyBcIiB3YXMgbm90IGZvdW5kLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIHJlc3VsdF8xID0gcmVzdWx0OyBfaSA8IHJlc3VsdF8xLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgdmFyIHNldHRpbmcgPSByZXN1bHRfMVtfaV07XG4gICAgICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1jb25zb2xlICovXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIiAgTG9nZ2VyRmFjdG9yeTogXCIgKyBzZXR0aW5nLnkuZ2V0TmFtZSgpICsgXCIgKGlkPVwiICsgc2V0dGluZy54ICsgXCIpXCIpO1xuICAgICAgICAgICAgdmFyIGxvZ0dyb3VwUnVudGltZVNldHRpbmdzID0gc2V0dGluZy55LmdldExvZ0dyb3VwUnVudGltZVNldHRpbmdzKCk7XG4gICAgICAgICAgICBmb3IgKHZhciBnID0gMDsgZyA8IGxvZ0dyb3VwUnVudGltZVNldHRpbmdzLmxlbmd0aDsgZysrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGdyb3VwU2V0dGluZyA9IGxvZ0dyb3VwUnVudGltZVNldHRpbmdzW2ddO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiICAgICBMb2dHcm91cDogKGlkPVwiICsgZyArIFwiKVwiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiAgICAgICBSZWdFeHA6IFwiICsgZ3JvdXBTZXR0aW5nLmxvZ0dyb3VwUnVsZS5yZWdFeHAuc291cmNlKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiAgICAgICBMZXZlbDogXCIgKyBMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWxbZ3JvdXBTZXR0aW5nLmxldmVsXS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiAgICAgICBMb2dnZXJUeXBlOiBcIiArIExvZ2dlck9wdGlvbnNfMS5Mb2dnZXJUeXBlW2dyb3VwU2V0dGluZy5sb2dnZXJUeXBlXS50b1N0cmluZygpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIHRzbGludDplbmFibGU6bm8tY29uc29sZSAqL1xuICAgICAgICB9XG4gICAgfTtcbiAgICBMb2dnZXJDb250cm9sSW1wbC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoaWRGYWN0b3J5KSB7XG4gICAgICAgIGlmIChpZEZhY3RvcnkgPT09IHZvaWQgMCkgeyBpZEZhY3RvcnkgPSBcImFsbFwiOyB9XG4gICAgICAgIHZhciBsb2dnZXJGYWN0b3JpZXNTZXR0aW5ncyA9IExvZ2dlckNvbnRyb2xJbXBsLl9nZXRSdW50aW1lU2V0dGluZ3NMb2dnZXJGYWN0b3JpZXMoKTtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICBpZiAoaWRGYWN0b3J5ID09PSBcImFsbFwiKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBsb2dnZXJGYWN0b3JpZXNTZXR0aW5ncztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChpZEZhY3RvcnkgPj0gMCAmJiBpZEZhY3RvcnkgPCBsb2dnZXJGYWN0b3JpZXNTZXR0aW5ncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChsb2dnZXJGYWN0b3JpZXNTZXR0aW5nc1tpZEZhY3RvcnldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXN1bHQuZm9yRWFjaChmdW5jdGlvbiAoc2V0dGluZykge1xuICAgICAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tY29uc29sZSAqL1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXNldCBhbGwgc2V0dGluZ3MgZm9yIGZhY3RvcnkgXCIgKyBpZEZhY3RvcnkpO1xuICAgICAgICAgICAgLyogdHNsaW50OmVuYWJsZTpuby1jb25zb2xlICovXG4gICAgICAgICAgICB2YXIgY29udHJvbCA9IG5ldyBMb2dnZXJGYWN0b3J5Q29udHJvbEltcGwoc2V0dGluZyk7XG4gICAgICAgICAgICBjb250cm9sLnJlc2V0KCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgTG9nZ2VyQ29udHJvbEltcGwucHJvdG90eXBlLmdldExvZ2dlckZhY3RvcnlDb250cm9sID0gZnVuY3Rpb24gKGlkRmFjdG9yeSkge1xuICAgICAgICB2YXIgbG9nZ2VyRmFjdG9yaWVzU2V0dGluZ3MgPSBMb2dnZXJDb250cm9sSW1wbC5fZ2V0UnVudGltZVNldHRpbmdzTG9nZ2VyRmFjdG9yaWVzKCk7XG4gICAgICAgIGlmIChpZEZhY3RvcnkgPj0gMCAmJiBpZEZhY3RvcnkgPCBsb2dnZXJGYWN0b3JpZXNTZXR0aW5ncy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTG9nZ2VyRmFjdG9yeUNvbnRyb2xJbXBsKGxvZ2dlckZhY3Rvcmllc1NldHRpbmdzW2lkRmFjdG9yeV0pO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImlkRmFjdG9yeSBpcyBpbnZhbGlkIChsZXNzIHRoYW4gMCkgb3Igbm9uIGV4aXN0aW5nIGlkLlwiKTtcbiAgICB9O1xuICAgIExvZ2dlckNvbnRyb2xJbXBsLl9nZXRSdW50aW1lU2V0dGluZ3NMb2dnZXJGYWN0b3JpZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBMb2dnZXJDb250cm9sSW1wbC5fZ2V0U2V0dGluZ3MoKS5nZXRSdW50aW1lU2V0dGluZ3NGb3JMb2dnZXJGYWN0b3JpZXMoKTtcbiAgICB9O1xuICAgIExvZ2dlckNvbnRyb2xJbXBsLl9nZXRTZXR0aW5ncyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIExGU2VydmljZV8xLkxGU2VydmljZS5nZXRSdW50aW1lU2V0dGluZ3MoKTtcbiAgICB9O1xuICAgIExvZ2dlckNvbnRyb2xJbXBsLl9oZWxwID0gXCJcXG4gIGhlbHAoKTogdm9pZFxcbiAgICAqKiBTaG93cyB0aGlzIGhlbHAuXFxuXFxuICBsaXN0RmFjdG9yaWVzKCk6IHZvaWRcXG4gICAgKiogTGlzdCBhbGwgcmVnaXN0ZXJlZCBMb2dnZXJGYWN0b3JpZXMgd2l0aCBhc3NvY2lhdGVkIGxvZyBncm91cHMgd2l0aCByZXNwZWN0aXZlIGlkcyAoaWRzIGNhbiBiZSB1c2VkIHRvIHRhcmdldCBhIGZhY3RvcnkgYW5kL29yIGdyb3VwKS5cXG5cXG4gIHNob3dTZXR0aW5ncyhpZEZhY3Rvcnk6IG51bWJlciB8IFxcXCJhbGxcXFwiKTogdm9pZFxcbiAgICAqKiBTaG93IGxvZyBncm91cCBzZXR0aW5ncyBmb3IgaWRGYWN0b3J5ICh1c2UgbGlzdEZhY3RvcmllcyB0byBmaW5kIGlkIGZvciBhIExvZ2dlckZhY3RvcnkpLiBJZiBpZEZhY3RvcnkgaXMgXFxcImFsbFxcXCIgc2hvd3MgYWxsIGZhY3Rvcmllcy5cXG5cXG4gIGdldExvZ2dlckZhY3RvcnlDb250cm9sKGlkRmFjdG9yeTogbnVtYmVyKTogTG9nZ2VyRmFjdG9yeUNvbnRyb2xcXG4gICAgKiogUmV0dXJuIExvZ2dlckZhY3RvcnlDb250cm9sIHdoZW4gZm91bmQgZm9yIGdpdmVuIGlkRmFjdG9yeSBvciB0aHJvd3MgRXJyb3IgaWYgaW52YWxpZCBvciBudWxsLCBnZXQgdGhlIGlkIGJ5IHVzaW5nIGxpc3RGYWN0b3JpZXMoKVxcblxcbiAgcmVzZXQoaWRGYWN0b3J5OiBudW1iZXIgfCBcXFwiYWxsXFxcIik6IHZvaWRcXG4gICAgKiogUmVzZXRzIGdpdmVuIGZhY3Rvcnkgb3IgYWxsIGZhY3RvcmllcyBiYWNrIHRvIG9yaWdpbmFsIHZhbHVlcy5cXG5cIjtcbiAgICByZXR1cm4gTG9nZ2VyQ29udHJvbEltcGw7XG59KCkpO1xuZXhwb3J0cy5Mb2dnZXJDb250cm9sSW1wbCA9IExvZ2dlckNvbnRyb2xJbXBsO1xudmFyIExvZ2dlckZhY3RvcnlDb250cm9sSW1wbCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTG9nZ2VyRmFjdG9yeUNvbnRyb2xJbXBsKHNldHRpbmdzKSB7XG4gICAgICAgIHRoaXMuX3NldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgfVxuICAgIExvZ2dlckZhY3RvcnlDb250cm9sSW1wbC5wcm90b3R5cGUuaGVscCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tY29uc29sZSAqL1xuICAgICAgICBjb25zb2xlLmxvZyhMb2dnZXJGYWN0b3J5Q29udHJvbEltcGwuX2hlbHApO1xuICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLWNvbnNvbGUgKi9cbiAgICB9O1xuICAgIExvZ2dlckZhY3RvcnlDb250cm9sSW1wbC5wcm90b3R5cGUuZXhhbXBsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tY29uc29sZSAqL1xuICAgICAgICBjb25zb2xlLmxvZyhMb2dnZXJGYWN0b3J5Q29udHJvbEltcGwuX2V4YW1wbGUpO1xuICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLWNvbnNvbGUgKi9cbiAgICB9O1xuICAgIExvZ2dlckZhY3RvcnlDb250cm9sSW1wbC5wcm90b3R5cGUuc2hvd1NldHRpbmdzID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIGlmIChpZCA9PT0gdm9pZCAwKSB7IGlkID0gXCJhbGxcIjsgfVxuICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IERhdGFTdHJ1Y3R1cmVzXzEuU3RyaW5nQnVpbGRlcigpO1xuICAgICAgICB2YXIgbG9nR3JvdXBSdW50aW1lU2V0dGluZ3MgPSB0aGlzLl9zZXR0aW5ncy5nZXRMb2dHcm91cFJ1bnRpbWVTZXR0aW5ncygpO1xuICAgICAgICByZXN1bHQuYXBwZW5kTGluZShcIlJlZ2lzdGVyZWQgTG9nR3JvdXBzIChpbmRleCAvIGV4cHJlc3Npb24pXCIpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxvZ0dyb3VwUnVudGltZVNldHRpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbG9nR3JvdXBSdW50aW1lU2V0dGluZyA9IGxvZ0dyb3VwUnVudGltZVNldHRpbmdzW2ldO1xuICAgICAgICAgICAgcmVzdWx0LmFwcGVuZExpbmUoXCIgIFwiICsgaSArIFwiOiBcIiArIGxvZ0dyb3VwUnVudGltZVNldHRpbmcubG9nR3JvdXBSdWxlLnJlZ0V4cC5zb3VyY2UgKyBcIiwgbG9nTGV2ZWw9XCIgK1xuICAgICAgICAgICAgICAgIExvZ2dlck9wdGlvbnNfMS5Mb2dMZXZlbFtsb2dHcm91cFJ1bnRpbWVTZXR0aW5nLmxldmVsXS50b1N0cmluZygpICsgXCIsIHNob3dUaW1lc3RhbXA9XCIgKyBsb2dHcm91cFJ1bnRpbWVTZXR0aW5nLmxvZ0Zvcm1hdC5zaG93VGltZVN0YW1wICtcbiAgICAgICAgICAgICAgICBcIiwgc2hvd0xvZ2dlck5hbWU9XCIgKyBsb2dHcm91cFJ1bnRpbWVTZXR0aW5nLmxvZ0Zvcm1hdC5zaG93TG9nZ2VyTmFtZSArXG4gICAgICAgICAgICAgICAgXCIsIGZvcm1hdD1cIiArIExvZ2dlck9wdGlvbnNfMS5EYXRlRm9ybWF0RW51bVtsb2dHcm91cFJ1bnRpbWVTZXR0aW5nLmxvZ0Zvcm1hdC5kYXRlRm9ybWF0LmZvcm1hdEVudW1dLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLWNvbnNvbGUgKi9cbiAgICAgICAgY29uc29sZS5sb2cocmVzdWx0LnRvU3RyaW5nKCkpO1xuICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLWNvbnNvbGUgKi9cbiAgICB9O1xuICAgIExvZ2dlckZhY3RvcnlDb250cm9sSW1wbC5wcm90b3R5cGUuY2hhbmdlID0gZnVuY3Rpb24gKHNldHRpbmdzKSB7XG4gICAgICAgIHZhciBsb2dHcm91cFJ1bnRpbWVTZXR0aW5ncyA9IHRoaXMuX2dldExvZ0dyb3VwUnVuVGltZVNldHRpbmdzRm9yKHNldHRpbmdzLmdyb3VwKTtcbiAgICAgICAgdmFyIGxvZ0xldmVsID0gbnVsbDtcbiAgICAgICAgdmFyIGZvcm1hdEVudW0gPSBudWxsO1xuICAgICAgICB2YXIgc2hvd0xvZ2dlck5hbWUgPSBudWxsO1xuICAgICAgICB2YXIgc2hvd1RpbWVzdGFtcCA9IG51bGw7XG4gICAgICAgIHZhciByZXN1bHQgPSBudWxsO1xuICAgICAgICB2YXIgYWRkUmVzdWx0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IFwiLCBcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXR0aW5ncy5sb2dMZXZlbCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgbG9nTGV2ZWwgPSBMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuZnJvbVN0cmluZyhzZXR0aW5ncy5sb2dMZXZlbCk7XG4gICAgICAgICAgICBhZGRSZXN1bHQoXCJsb2dMZXZlbD1cIiArIHNldHRpbmdzLmxvZ0xldmVsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHNldHRpbmdzLmxvZ0Zvcm1hdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgZm9ybWF0RW51bSA9IExvZ2dlck9wdGlvbnNfMS5EYXRlRm9ybWF0RW51bS5mcm9tU3RyaW5nKHNldHRpbmdzLmxvZ0Zvcm1hdCk7XG4gICAgICAgICAgICBhZGRSZXN1bHQoXCJsb2dGb3JtYXQ9XCIgKyBzZXR0aW5ncy5sb2dGb3JtYXQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0dGluZ3Muc2hvd0xvZ2dlck5hbWUgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgICAgICBzaG93TG9nZ2VyTmFtZSA9IHNldHRpbmdzLnNob3dMb2dnZXJOYW1lO1xuICAgICAgICAgICAgYWRkUmVzdWx0KFwic2hvd0xvZ2dlck5hbWU9XCIgKyBzZXR0aW5ncy5zaG93TG9nZ2VyTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBzZXR0aW5ncy5zaG93VGltZXN0YW1wID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICAgICAgc2hvd1RpbWVzdGFtcCA9IHNldHRpbmdzLnNob3dUaW1lc3RhbXA7XG4gICAgICAgICAgICBhZGRSZXN1bHQoXCJzaG93VGltZXN0YW1wPVwiICsgc2V0dGluZ3Muc2hvd1RpbWVzdGFtcCk7XG4gICAgICAgIH1cbiAgICAgICAgbG9nR3JvdXBSdW50aW1lU2V0dGluZ3MuZm9yRWFjaChmdW5jdGlvbiAocykge1xuICAgICAgICAgICAgaWYgKGxvZ0xldmVsICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcy5sZXZlbCA9IGxvZ0xldmVsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZvcm1hdEVudW0gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzLmxvZ0Zvcm1hdC5kYXRlRm9ybWF0LmZvcm1hdEVudW0gPSBmb3JtYXRFbnVtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNob3dUaW1lc3RhbXAgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzLmxvZ0Zvcm1hdC5zaG93VGltZVN0YW1wID0gc2hvd1RpbWVzdGFtcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzaG93TG9nZ2VyTmFtZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHMubG9nRm9ybWF0LnNob3dMb2dnZXJOYW1lID0gc2hvd0xvZ2dlck5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1jb25zb2xlICovXG4gICAgICAgIGNvbnNvbGUubG9nKFwiQXBwbGllZCBjaGFuZ2VzOiBcIiArIHJlc3VsdCArIFwiIHRvIGxvZyBncm91cHMgJ1wiICsgc2V0dGluZ3MuZ3JvdXAgKyBcIicuXCIpO1xuICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLWNvbnNvbGUgKi9cbiAgICB9O1xuICAgIExvZ2dlckZhY3RvcnlDb250cm9sSW1wbC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoaWRHcm91cCkge1xuICAgICAgICBpZiAoaWRHcm91cCA9PT0gdm9pZCAwKSB7IGlkR3JvdXAgPSBcImFsbFwiOyB9XG4gICAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuX2dldExvZ0dyb3VwUnVuVGltZVNldHRpbmdzRm9yKGlkR3JvdXApO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIHNldHRpbmdzXzEgPSBzZXR0aW5nczsgX2kgPCBzZXR0aW5nc18xLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgdmFyIHNldHRpbmcgPSBzZXR0aW5nc18xW19pXTtcbiAgICAgICAgICAgIHNldHRpbmcubGV2ZWwgPSBzZXR0aW5nLmxvZ0dyb3VwUnVsZS5sZXZlbDtcbiAgICAgICAgICAgIHNldHRpbmcubG9nRm9ybWF0LnNob3dUaW1lU3RhbXAgPSBzZXR0aW5nLmxvZ0dyb3VwUnVsZS5sb2dGb3JtYXQuc2hvd1RpbWVTdGFtcDtcbiAgICAgICAgICAgIHNldHRpbmcubG9nRm9ybWF0LnNob3dMb2dnZXJOYW1lID0gc2V0dGluZy5sb2dHcm91cFJ1bGUubG9nRm9ybWF0LnNob3dMb2dnZXJOYW1lO1xuICAgICAgICAgICAgc2V0dGluZy5sb2dGb3JtYXQuZGF0ZUZvcm1hdC5mb3JtYXRFbnVtID0gc2V0dGluZy5sb2dHcm91cFJ1bGUubG9nRm9ybWF0LmRhdGVGb3JtYXQuZm9ybWF0RW51bTtcbiAgICAgICAgfVxuICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1jb25zb2xlICovXG4gICAgICAgIGNvbnNvbGUubG9nKFwiUmVzZXQgYWxsIHNldHRpbmdzIGZvciBncm91cCBcIiArIGlkR3JvdXApO1xuICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLWNvbnNvbGUgKi9cbiAgICB9O1xuICAgIExvZ2dlckZhY3RvcnlDb250cm9sSW1wbC5wcm90b3R5cGUuX2dldExvZ0dyb3VwUnVuVGltZVNldHRpbmdzRm9yID0gZnVuY3Rpb24gKGlkR3JvdXApIHtcbiAgICAgICAgdmFyIHNldHRpbmdzID0gW107XG4gICAgICAgIGlmIChpZEdyb3VwID09PSBcImFsbFwiKSB7XG4gICAgICAgICAgICBzZXR0aW5ncyA9IHRoaXMuX3NldHRpbmdzLmdldExvZ0dyb3VwUnVudGltZVNldHRpbmdzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9jaGVja0luZGV4KGlkR3JvdXApO1xuICAgICAgICAgICAgc2V0dGluZ3MucHVzaCh0aGlzLl9zZXR0aW5ncy5nZXRMb2dHcm91cFJ1bnRpbWVTZXR0aW5ncygpW2lkR3JvdXBdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2V0dGluZ3M7XG4gICAgfTtcbiAgICBMb2dnZXJGYWN0b3J5Q29udHJvbEltcGwucHJvdG90eXBlLl9jaGVja0luZGV4ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdGhpcy5fc2V0dGluZ3MuZ2V0TG9nR3JvdXBSdW50aW1lU2V0dGluZ3MoKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgaW5kZXgsIHVzZSBsaXN0TG9nR3JvdXBzIHRvIGZpbmQgb3V0IGEgdmFsaWQgb25lLlwiKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTG9nZ2VyRmFjdG9yeUNvbnRyb2xJbXBsLl9oZWxwID0gXCJcXG4gIGhlbHAoKTogdm9pZFxcbiAgICAqKiBTaG93cyB0aGlzIGhlbHAuXFxuXFxuICBleGFtcGxlKCk6IHZvaWRcXG4gICAgKiogU2hvd3MgYW4gZXhhbXBsZSBvZiB1c2FnZS5cXG5cXG4gIHNob3dTZXR0aW5ncyhpZDogbnVtYmVyIHwgXFxcImFsbFxcXCIpOiB2b2lkXFxuICAgICoqIFByaW50cyBzZXR0aW5ncyBmb3IgZ2l2ZW4gZ3JvdXAgaWQsIFxcXCJhbGxcXFwiIGZvciBhbGwgZ3JvdXAuXFxuXFxuICBjaGFuZ2Uoc2V0dGluZ3M6IExvZ0dyb3VwQ29udHJvbFNldHRpbmdzKTogdm9pZFxcbiAgICAqKiBDaGFuZ2VzIHRoZSBjdXJyZW50IHNldHRpbmdzIGZvciBvbmUgb3IgYWxsIGxvZyBncm91cHMuXFxuICAgICoqXFxuICAgICAgIExvZ0dyb3VwQ29udHJvbFNldHRpbmdzLCBwcm9wZXJ0aWVzIG9mIG9iamVjdDpcXG4gICAgICAgICBncm91cDogbnVtYmVyIHwgXFxcImFsbFxcXCJcXG4gICAgICAgICAgICoqIEFwcGx5IHRvIHNwZWNpZmljIGdyb3VwLCBvciBcXFwiYWxsXFxcIi5cXG4gICAgICAgICAgICoqIFJlcXVpcmVkXFxuXFxuICAgICAgICAgbG9nTGV2ZWw6IFxcXCJGYXRhbFxcXCIgfCBcXFwiRXJyb3JcXFwiIHwgXFxcIldhcm5cXFwiIHwgXFxcIkluZm9cXFwiIHwgXFxcIkRlYnVnXFxcIiB8IFxcXCJUcmFjZVxcXCIgfCB1bmRlZmluZWRcXG4gICAgICAgICAgICoqIFNldCBsb2cgbGV2ZWwsIHVuZGVmaW5lZCB3aWxsIG5vdCBjaGFuZ2UgdGhlIHNldHRpbmcuXFxuICAgICAgICAgICAqKiBPcHRpb25hbFxcblxcbiAgICAgICAgIGxvZ0Zvcm1hdDogXFxcIkRlZmF1bHRcXFwiIHwgXFxcIlllYXJNb250aERheVRpbWVcXFwiIHwgXFxcIlllYXJEYXlNb250aFdpdGhGdWxsVGltZVxcXCIgfCBcXFwiWWVhckRheU1vbnRoVGltZVxcXCIgfCB1bmRlZmluZWRcXG4gICAgICAgICAgICoqIFNldCB0aGUgbG9nIGZvcm1hdCwgdW5kZWZpbmVkIHdpbGwgbm90IGNoYW5nZSB0aGUgc2V0dGluZy5cXG4gICAgICAgICAgICoqIE9wdGlvbmFsXFxuXFxuICAgICAgICAgc2hvd1RpbWVzdGFtcDogYm9vbGVhbiB8IHVuZGVmaW5lZFxcbiAgICAgICAgICAgKiogV2hldGhlciB0byBzaG93IHRpbWVzdGFtcCwgdW5kZWZpbmVkIHdpbGwgbm90IGNoYW5nZSB0aGUgc2V0dGluZy5cXG4gICAgICAgICAgICoqIE9wdGlvbmFsXFxuXFxuICAgICAgICAgc2hvd0xvZ2dlck5hbWU6IGJvb2xlYW4gfCB1bmRlZmluZWRcXG4gICAgICAgICAgICoqIFdoZXRoZXIgdG8gc2hvdyB0aGUgbG9nZ2VyIG5hbWUsIHVuZGVmaW5lZCB3aWxsIG5vdCBjaGFuZ2UgdGhlIHNldHRpbmcuXFxuICAgICAgICAgICAqKiBPcHRpb25hbFxcblxcbiAgcmVzZXQoaWQ6IG51bWJlciB8IFxcXCJhbGxcXFwiKTogdm9pZFxcbiAgICAqKiBSZXNldHMgZXZlcnl0aGluZyB0byBvcmlnaW5hbCB2YWx1ZXMsIGZvciBvbmUgc3BlY2lmaWMgb3IgZm9yIGFsbCBncm91cHMuXFxuXFxuICBoZWxwKCk6XFxuICAgICoqIFNob3dzIHRoaXMgaGVscC5cXG5cIjtcbiAgICBMb2dnZXJGYWN0b3J5Q29udHJvbEltcGwuX2V4YW1wbGUgPSBcIlxcbiAgRXhhbXBsZXM6XFxuICAgIGNoYW5nZSh7Z3JvdXA6IFxcXCJhbGxcXFwiLCBsb2dMZXZlbDogXFxcIkluZm9cXFwifSlcXG4gICAgICAqKiBDaGFuZ2UgbG9nbGV2ZWwgdG8gSW5mbyBmb3IgYWxsIGdyb3Vwcy5cXG5cXG4gICAgY2hhbmdlKHtncm91cDogMSwgcmVjdXJzaXZlOmZhbHNlLCBsb2dMZXZlbDogXFxcIldhcm5cXFwifSlcXG4gICAgICAqKiBDaGFuZ2UgbG9nTGV2ZWwgZm9yIGdyb3VwIDEgdG8gV2Fybi5cXG5cXG4gICAgY2hhbmdlKHtncm91cDogXFxcImFsbFxcXCIsIGxvZ0xldmVsOiBcXFwiRGVidWdcXFwiLCBsb2dGb3JtYXQ6IFxcXCJZZWFyRGF5TW9udGhUaW1lXFxcIiwgc2hvd1RpbWVzdGFtcDpmYWxzZSwgc2hvd0xvZ2dlck5hbWU6ZmFsc2V9KVxcbiAgICAgICoqIENoYW5nZSBsb2dsZXZlbCB0byBEZWJ1ZyBmb3IgYWxsIGdyb3VwcywgYXBwbHkgZm9ybWF0LCBkbyBub3Qgc2hvdyB0aW1lc3RhbXAgYW5kIGxvZ2dlciBuYW1lcy5cXG5cIjtcbiAgICByZXR1cm4gTG9nZ2VyRmFjdG9yeUNvbnRyb2xJbXBsO1xufSgpKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUxvZ0dyb3VwQ29udHJvbC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBDYXRlZ29yeVNlcnZpY2VfMSA9IHJlcXVpcmUoXCIuLi9sb2cvY2F0ZWdvcnkvQ2F0ZWdvcnlTZXJ2aWNlXCIpO1xudmFyIExvZ2dlck9wdGlvbnNfMSA9IHJlcXVpcmUoXCIuLi9sb2cvTG9nZ2VyT3B0aW9uc1wiKTtcbnZhciBNZXNzYWdlVXRpbHNfMSA9IHJlcXVpcmUoXCIuLi91dGlscy9NZXNzYWdlVXRpbHNcIik7XG52YXIgRXh0ZW5zaW9uSGVscGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBFeHRlbnNpb25IZWxwZXIoKSB7XG4gICAgICAgIC8vIFByaXZhdGUgY29uc3RydWN0b3JcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW5hYmxlcyB0aGUgd2luZG93IGV2ZW50IGxpc3RlbmVyIHRvIGxpc3RlbiB0byBtZXNzYWdlcyAoZnJvbSBleHRlbnNpb25zKS5cbiAgICAgKiBDYW4gYmUgcmVnaXN0ZXJlZC9lbmFibGVkIG9ubHkgb25jZS5cbiAgICAgKi9cbiAgICBFeHRlbnNpb25IZWxwZXIucmVnaXN0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghRXh0ZW5zaW9uSGVscGVyLnJlZ2lzdGVyZWQpIHtcbiAgICAgICAgICAgIHZhciBsaXN0ZW5lciA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbXNnID0gZXZ0LmRhdGE7XG4gICAgICAgICAgICAgICAgaWYgKG1zZyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBFeHRlbnNpb25IZWxwZXIucHJvY2Vzc01lc3NhZ2VGcm9tRXh0ZW5zaW9uKG1zZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciAhPT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2Ygd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgbGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBsaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgRXh0ZW5zaW9uSGVscGVyLnJlZ2lzdGVyZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBFeHRlbnNpb25IZWxwZXIucHJvY2Vzc01lc3NhZ2VGcm9tRXh0ZW5zaW9uID0gZnVuY3Rpb24gKG1zZykge1xuICAgICAgICBpZiAoIUV4dGVuc2lvbkhlbHBlci5yZWdpc3RlcmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tY29uc29sZSAqL1xuICAgICAgICBpZiAobXNnLmZyb20gPT09IFwidHNsLWV4dGVuc2lvblwiKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IG1zZy5kYXRhO1xuICAgICAgICAgICAgc3dpdGNoIChkYXRhLnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwicmVnaXN0ZXJcIjpcbiAgICAgICAgICAgICAgICAgICAgRXh0ZW5zaW9uSGVscGVyLmVuYWJsZUV4dGVuc2lvbkludGVncmF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJyZXF1ZXN0LWNoYW5nZS1sb2dsZXZlbFwiOlxuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWVSZXF1ZXN0ID0gZGF0YS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhdHNBcHBsaWVkID0gRXh0ZW5zaW9uSGVscGVyLmFwcGx5TG9nTGV2ZWwodmFsdWVSZXF1ZXN0LmNhdGVnb3J5SWQsIHZhbHVlUmVxdWVzdC5sb2dMZXZlbCwgdmFsdWVSZXF1ZXN0LnJlY3Vyc2l2ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYXRzQXBwbGllZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTZW5kIGNoYW5nZXMgYmFja1xuICAgICAgICAgICAgICAgICAgICAgICAgRXh0ZW5zaW9uSGVscGVyLnNlbmRDYXRlZ29yaWVzUnVudGltZVVwZGF0ZU1lc3NhZ2UoY2F0c0FwcGxpZWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVW5rbm93biBjb21tYW5kIHRvIHByb2Nlc3MgbWVzc2FnZSBmcm9tIGV4dGVuc2lvbiwgY29tbWFuZCB3YXM6IFwiICsgZGF0YS50eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLyogdHNsaW50OmVuYWJsZTpuby1jb25zb2xlICovXG4gICAgfTtcbiAgICBFeHRlbnNpb25IZWxwZXIuc2VuZENhdGVnb3J5TG9nTWVzc2FnZSA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICAgICAgaWYgKCFFeHRlbnNpb25IZWxwZXIucmVnaXN0ZXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjYXRlZ29yeUlkcyA9IG1zZy5jYXRlZ29yaWVzLm1hcChmdW5jdGlvbiAoY2F0KSB7XG4gICAgICAgICAgICByZXR1cm4gY2F0LmlkO1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGNvbnRlbnQgPSB7XG4gICAgICAgICAgICB0eXBlOiBcImxvZy1tZXNzYWdlXCIsXG4gICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IGNhdGVnb3J5SWRzLFxuICAgICAgICAgICAgICAgIGVycm9yQXNTdGFjazogbXNnLmVycm9yQXNTdGFjayxcbiAgICAgICAgICAgICAgICBmb3JtYXR0ZWRNZXNzYWdlOiBNZXNzYWdlVXRpbHNfMS5NZXNzYWdlRm9ybWF0VXRpbHMucmVuZGVyRGVmYXVsdE1lc3NhZ2UobXNnLCBmYWxzZSksXG4gICAgICAgICAgICAgICAgbG9nTGV2ZWw6IExvZ2dlck9wdGlvbnNfMS5Mb2dMZXZlbFttc2cubGV2ZWxdLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogbXNnLm1lc3NhZ2VBc1N0cmluZyxcbiAgICAgICAgICAgICAgICByZXNvbHZlZEVycm9yTWVzc2FnZTogbXNnLmlzUmVzb2x2ZWRFcnJvck1lc3NhZ2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBkYXRhOiBjb250ZW50LFxuICAgICAgICAgICAgZnJvbTogXCJ0c2wtbG9nZ2luZ1wiLFxuICAgICAgICB9O1xuICAgICAgICBFeHRlbnNpb25IZWxwZXIuc2VuZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgfTtcbiAgICBFeHRlbnNpb25IZWxwZXIuc2VuZENhdGVnb3JpZXNSdW50aW1lVXBkYXRlTWVzc2FnZSA9IGZ1bmN0aW9uIChjYXRlZ29yaWVzKSB7XG4gICAgICAgIGlmICghRXh0ZW5zaW9uSGVscGVyLnJlZ2lzdGVyZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2VydmljZSA9IENhdGVnb3J5U2VydmljZV8xLkNhdGVnb3J5U2VydmljZUltcGwuZ2V0SW5zdGFuY2UoKTtcbiAgICAgICAgdmFyIGNhdExldmVscyA9IHsgY2F0ZWdvcmllczogQXJyYXkoKSB9O1xuICAgICAgICBjYXRlZ29yaWVzLmZvckVhY2goZnVuY3Rpb24gKGNhdCkge1xuICAgICAgICAgICAgdmFyIGNhdFNldHRpbmdzID0gc2VydmljZS5nZXRDYXRlZ29yeVNldHRpbmdzKGNhdCk7XG4gICAgICAgICAgICBpZiAoY2F0U2V0dGluZ3MgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNhdExldmVscy5jYXRlZ29yaWVzLnB1c2goeyBpZDogY2F0LmlkLCBsb2dMZXZlbDogTG9nZ2VyT3B0aW9uc18xLkxvZ0xldmVsW2NhdFNldHRpbmdzLmxvZ0xldmVsXS50b1N0cmluZygpIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGNvbnRlbnQgPSB7XG4gICAgICAgICAgICB0eXBlOiBcImNhdGVnb3JpZXMtcnQtdXBkYXRlXCIsXG4gICAgICAgICAgICB2YWx1ZTogY2F0TGV2ZWxzLFxuICAgICAgICB9O1xuICAgICAgICB2YXIgbWVzc2FnZSA9IHtcbiAgICAgICAgICAgIGRhdGE6IGNvbnRlbnQsXG4gICAgICAgICAgICBmcm9tOiBcInRzbC1sb2dnaW5nXCJcbiAgICAgICAgfTtcbiAgICAgICAgRXh0ZW5zaW9uSGVscGVyLnNlbmRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIH07XG4gICAgRXh0ZW5zaW9uSGVscGVyLnNlbmRSb290Q2F0ZWdvcmllc1RvRXh0ZW5zaW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIUV4dGVuc2lvbkhlbHBlci5yZWdpc3RlcmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNhdGVnb3JpZXMgPSBDYXRlZ29yeVNlcnZpY2VfMS5DYXRlZ29yeVNlcnZpY2VJbXBsLmdldEluc3RhbmNlKCkuZ2V0Um9vdENhdGVnb3JpZXMoKS5tYXAoZnVuY3Rpb24gKGNhdCkge1xuICAgICAgICAgICAgcmV0dXJuIEV4dGVuc2lvbkhlbHBlci5nZXRDYXRlZ29yeUFzSlNPTihjYXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGNvbnRlbnQgPSB7XG4gICAgICAgICAgICB0eXBlOiBcInJvb3QtY2F0ZWdvcmllcy10cmVlXCIsXG4gICAgICAgICAgICB2YWx1ZTogY2F0ZWdvcmllc1xuICAgICAgICB9O1xuICAgICAgICB2YXIgbWVzc2FnZSA9IHtcbiAgICAgICAgICAgIGRhdGE6IGNvbnRlbnQsXG4gICAgICAgICAgICBmcm9tOiBcInRzbC1sb2dnaW5nXCJcbiAgICAgICAgfTtcbiAgICAgICAgRXh0ZW5zaW9uSGVscGVyLnNlbmRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogSWYgZXh0ZW5zaW9uIGludGVncmF0aW9uIGlzIGVuYWJsZWQsIHdpbGwgc2VuZCB0aGUgcm9vdCBjYXRlZ29yaWVzIG92ZXIgdG8gdGhlIGV4dGVuc2lvbi5cbiAgICAgKiBPdGhlcndpc2UgZG9lcyBub3RoaW5nLlxuICAgICAqL1xuICAgIEV4dGVuc2lvbkhlbHBlci5nZXRDYXRlZ29yeUFzSlNPTiA9IGZ1bmN0aW9uIChjYXQpIHtcbiAgICAgICAgdmFyIGNoaWxkQ2F0ZWdvcmllcyA9IGNhdC5jaGlsZHJlbi5tYXAoZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgICAgICAgICByZXR1cm4gRXh0ZW5zaW9uSGVscGVyLmdldENhdGVnb3J5QXNKU09OKGNoaWxkKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjaGlsZHJlbjogY2hpbGRDYXRlZ29yaWVzLFxuICAgICAgICAgICAgaWQ6IGNhdC5pZCxcbiAgICAgICAgICAgIGxvZ0xldmVsOiBMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWxbY2F0LmxvZ0xldmVsXS50b1N0cmluZygpLFxuICAgICAgICAgICAgbmFtZTogY2F0Lm5hbWUsXG4gICAgICAgICAgICBwYXJlbnRJZDogKGNhdC5wYXJlbnQgIT0gbnVsbCA/IGNhdC5wYXJlbnQuaWQgOiBudWxsKSxcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIEV4dGVuc2lvbkhlbHBlci5hcHBseUxvZ0xldmVsID0gZnVuY3Rpb24gKGNhdGVnb3J5SWQsIGxvZ0xldmVsLCByZWN1cnNpdmUpIHtcbiAgICAgICAgdmFyIGNhdHMgPSBbXTtcbiAgICAgICAgdmFyIGNhdGVnb3J5ID0gQ2F0ZWdvcnlTZXJ2aWNlXzEuQ2F0ZWdvcnlTZXJ2aWNlSW1wbC5nZXRJbnN0YW5jZSgpLmdldENhdGVnb3J5QnlJZChjYXRlZ29yeUlkKTtcbiAgICAgICAgaWYgKGNhdGVnb3J5ICE9IG51bGwpIHtcbiAgICAgICAgICAgIEV4dGVuc2lvbkhlbHBlci5fYXBwbHlMb2dMZXZlbFJlY3Vyc2l2ZShjYXRlZ29yeSwgTG9nZ2VyT3B0aW9uc18xLkxvZ0xldmVsLmZyb21TdHJpbmcobG9nTGV2ZWwpLCByZWN1cnNpdmUsIGNhdHMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tY29uc29sZSAqL1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJDb3VsZCBub3QgY2hhbmdlIGxvZyBsZXZlbCwgZmFpbGVkIHRvIGZpbmQgY2F0ZWdvcnkgd2l0aCBpZDogXCIgKyBjYXRlZ29yeUlkKTtcbiAgICAgICAgICAgIC8qIHRzbGludDplbmFibGU6bm8tY29uc29sZSAqL1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYXRzO1xuICAgIH07XG4gICAgRXh0ZW5zaW9uSGVscGVyLl9hcHBseUxvZ0xldmVsUmVjdXJzaXZlID0gZnVuY3Rpb24gKGNhdGVnb3J5LCBsb2dMZXZlbCwgcmVjdXJzaXZlLCBjYXRzKSB7XG4gICAgICAgIHZhciBjYXRlZ29yeVNldHRpbmdzID0gQ2F0ZWdvcnlTZXJ2aWNlXzEuQ2F0ZWdvcnlTZXJ2aWNlSW1wbC5nZXRJbnN0YW5jZSgpLmdldENhdGVnb3J5U2V0dGluZ3MoY2F0ZWdvcnkpO1xuICAgICAgICBpZiAoY2F0ZWdvcnlTZXR0aW5ncyAhPSBudWxsKSB7XG4gICAgICAgICAgICBjYXRlZ29yeVNldHRpbmdzLmxvZ0xldmVsID0gbG9nTGV2ZWw7XG4gICAgICAgICAgICBjYXRzLnB1c2goY2F0ZWdvcnkpO1xuICAgICAgICAgICAgaWYgKHJlY3Vyc2l2ZSkge1xuICAgICAgICAgICAgICAgIGNhdGVnb3J5LmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgIEV4dGVuc2lvbkhlbHBlci5fYXBwbHlMb2dMZXZlbFJlY3Vyc2l2ZShjaGlsZCwgbG9nTGV2ZWwsIHJlY3Vyc2l2ZSwgY2F0cyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV4dGVuc2lvbkhlbHBlci5nZXRBbGxDYXRlZ29yaWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2F0cyA9IFtdO1xuICAgICAgICB2YXIgYWRkQ2F0cyA9IGZ1bmN0aW9uIChjYXQsIGFsbENhdHMpIHtcbiAgICAgICAgICAgIGFsbENhdHMucHVzaChjYXQpO1xuICAgICAgICAgICAgY2F0LmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGNhdENoaWxkKSB7XG4gICAgICAgICAgICAgICAgYWRkQ2F0cyhjYXRDaGlsZCwgYWxsQ2F0cyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgQ2F0ZWdvcnlTZXJ2aWNlXzEuQ2F0ZWdvcnlTZXJ2aWNlSW1wbC5nZXRJbnN0YW5jZSgpLmdldFJvb3RDYXRlZ29yaWVzKCkuZm9yRWFjaChmdW5jdGlvbiAoY2F0KSB7XG4gICAgICAgICAgICBhZGRDYXRzKGNhdCwgY2F0cyk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY2F0cztcbiAgICB9O1xuICAgIEV4dGVuc2lvbkhlbHBlci5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICAgICAgaWYgKCFFeHRlbnNpb25IZWxwZXIucmVnaXN0ZXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiB3aW5kb3cucG9zdE1lc3NhZ2UgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZShtc2csIFwiKlwiKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogIEV4dGVuc2lvbiBmcmFtZXdvcmsgd2lsbCBjYWxsIHRoaXMgdG8gZW5hYmxlIHRoZSBpbnRlZ3JhdGlvbiBiZXR3ZWVuIHR3byxcbiAgICAgKiAgYWZ0ZXIgdGhpcyBjYWxsIHRoZSBmcmFtZXdvcmsgd2lsbCByZXNwb25kIHdpdGggcG9zdE1lc3NhZ2UoKSBtZXNzYWdlcy5cbiAgICAgKi9cbiAgICBFeHRlbnNpb25IZWxwZXIuZW5hYmxlRXh0ZW5zaW9uSW50ZWdyYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghRXh0ZW5zaW9uSGVscGVyLnJlZ2lzdGVyZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaW5zdGFuY2UgPSBDYXRlZ29yeVNlcnZpY2VfMS5DYXRlZ29yeVNlcnZpY2VJbXBsLmdldEluc3RhbmNlKCk7XG4gICAgICAgIGluc3RhbmNlLmVuYWJsZUV4dGVuc2lvbkludGVncmF0aW9uKCk7XG4gICAgICAgIC8vIFNlbmQgb3ZlciBhbGwgY2F0ZWdvcmllc1xuICAgICAgICBFeHRlbnNpb25IZWxwZXIuc2VuZFJvb3RDYXRlZ29yaWVzVG9FeHRlbnNpb24oKTtcbiAgICAgICAgLy8gU2VuZCBvdmVyIHRoZSBjdXJyZW50IHJ1bnRpbWUgbGV2ZWxzXG4gICAgICAgIHZhciBjYXRzID0gRXh0ZW5zaW9uSGVscGVyLmdldEFsbENhdGVnb3JpZXMoKTtcbiAgICAgICAgRXh0ZW5zaW9uSGVscGVyLnNlbmRDYXRlZ29yaWVzUnVudGltZVVwZGF0ZU1lc3NhZ2UoY2F0cyk7XG4gICAgfTtcbiAgICBFeHRlbnNpb25IZWxwZXIucmVnaXN0ZXJlZCA9IGZhbHNlO1xuICAgIHJldHVybiBFeHRlbnNpb25IZWxwZXI7XG59KCkpO1xuZXhwb3J0cy5FeHRlbnNpb25IZWxwZXIgPSBFeHRlbnNpb25IZWxwZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1FeHRlbnNpb25IZWxwZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIExvZyBsZXZlbCBmb3IgYSBsb2dnZXIuXG4gKi9cbnZhciBMb2dMZXZlbDtcbihmdW5jdGlvbiAoTG9nTGV2ZWwpIHtcbiAgICBMb2dMZXZlbFtMb2dMZXZlbFtcIlRyYWNlXCJdID0gMF0gPSBcIlRyYWNlXCI7XG4gICAgTG9nTGV2ZWxbTG9nTGV2ZWxbXCJEZWJ1Z1wiXSA9IDFdID0gXCJEZWJ1Z1wiO1xuICAgIExvZ0xldmVsW0xvZ0xldmVsW1wiSW5mb1wiXSA9IDJdID0gXCJJbmZvXCI7XG4gICAgTG9nTGV2ZWxbTG9nTGV2ZWxbXCJXYXJuXCJdID0gM10gPSBcIldhcm5cIjtcbiAgICBMb2dMZXZlbFtMb2dMZXZlbFtcIkVycm9yXCJdID0gNF0gPSBcIkVycm9yXCI7XG4gICAgTG9nTGV2ZWxbTG9nTGV2ZWxbXCJGYXRhbFwiXSA9IDVdID0gXCJGYXRhbFwiO1xufSkoTG9nTGV2ZWwgPSBleHBvcnRzLkxvZ0xldmVsIHx8IChleHBvcnRzLkxvZ0xldmVsID0ge30pKTtcbi8qIHRzbGludDpkaXNhYmxlOm5vLW5hbWVzcGFjZSAqL1xuKGZ1bmN0aW9uIChMb2dMZXZlbCkge1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgTG9nTGV2ZWwgYmFzZWQgb24gc3RyaW5nIHJlcHJlc2VudGF0aW9uXG4gICAgICogQHBhcmFtIHZhbCBWYWx1ZVxuICAgICAqIEByZXR1cm5zIHtMb2dMZXZlbH0sIEVycm9yIGlzIHRocm93biBpZiBpbnZhbGlkLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZyb21TdHJpbmcodmFsKSB7XG4gICAgICAgIGlmICh2YWwgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgbXVzdCBiZSBzZXRcIik7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoICh2YWwudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgY2FzZSBcInRyYWNlXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIExvZ0xldmVsLlRyYWNlO1xuICAgICAgICAgICAgY2FzZSBcImRlYnVnXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIExvZ0xldmVsLkRlYnVnO1xuICAgICAgICAgICAgY2FzZSBcImluZm9cIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gTG9nTGV2ZWwuSW5mbztcbiAgICAgICAgICAgIGNhc2UgXCJ3YXJuXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIExvZ0xldmVsLldhcm47XG4gICAgICAgICAgICBjYXNlIFwiZXJyb3JcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gTG9nTGV2ZWwuRXJyb3I7XG4gICAgICAgICAgICBjYXNlIFwiZmF0YWxcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gTG9nTGV2ZWwuRmF0YWw7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuc3VwcG9ydGVkIHZhbHVlIGZvciBjb252ZXJzaW9uOiBcIiArIHZhbCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgTG9nTGV2ZWwuZnJvbVN0cmluZyA9IGZyb21TdHJpbmc7XG59KShMb2dMZXZlbCA9IGV4cG9ydHMuTG9nTGV2ZWwgfHwgKGV4cG9ydHMuTG9nTGV2ZWwgPSB7fSkpO1xuLyogdHNsaW50OmRpc2FibGU6ZW5hYmxlLW5hbWVzcGFjZSAqL1xuLyoqXG4gKiBXaGVyZSB0byBsb2cgdG8/IFBpY2sgb25lIG9mIHRoZSBjb25zdGFudHMuIEN1c3RvbSByZXF1aXJlcyBhIGNhbGxiYWNrIHRvIGJlIHByZXNlbnQsIHNlZSBMRlNlcnZpY2UuY3JlYXRlTG9nZ2VyRmFjdG9yeSguLi4pXG4gKiB3aGVyZSB0aGlzIGNvbWVzIGludG8gcGxheS5cbiAqL1xudmFyIExvZ2dlclR5cGU7XG4oZnVuY3Rpb24gKExvZ2dlclR5cGUpIHtcbiAgICBMb2dnZXJUeXBlW0xvZ2dlclR5cGVbXCJDb25zb2xlXCJdID0gMF0gPSBcIkNvbnNvbGVcIjtcbiAgICBMb2dnZXJUeXBlW0xvZ2dlclR5cGVbXCJNZXNzYWdlQnVmZmVyXCJdID0gMV0gPSBcIk1lc3NhZ2VCdWZmZXJcIjtcbiAgICBMb2dnZXJUeXBlW0xvZ2dlclR5cGVbXCJDdXN0b21cIl0gPSAyXSA9IFwiQ3VzdG9tXCI7XG59KShMb2dnZXJUeXBlID0gZXhwb3J0cy5Mb2dnZXJUeXBlIHx8IChleHBvcnRzLkxvZ2dlclR5cGUgPSB7fSkpO1xuLyoqXG4gKiBEZWZpbmVzIHNldmVyYWwgZGF0ZSBlbnVtcyB1c2VkIGZvciBmb3JtYXR0aW5nIGEgZGF0ZS5cbiAqL1xudmFyIERhdGVGb3JtYXRFbnVtO1xuKGZ1bmN0aW9uIChEYXRlRm9ybWF0RW51bSkge1xuICAgIC8qKlxuICAgICAqIERpc3BsYXlzIGFzOiB5ZWFyLW1vbnRoLWRheSBob3VyOm1pbnV0ZTpzZWNvbmQsbWlsbGlzIC0+IDE5OTktMDItMTIgMjM6NTk6NTksMTIzXG4gICAgICogTm90ZSB0aGUgZGF0ZSBzZXBhcmF0b3IgY2FuIGJlIHNldCBzZXBhcmF0ZWx5LlxuICAgICAqL1xuICAgIERhdGVGb3JtYXRFbnVtW0RhdGVGb3JtYXRFbnVtW1wiRGVmYXVsdFwiXSA9IDBdID0gXCJEZWZhdWx0XCI7XG4gICAgLyoqXG4gICAgICogRGlzcGxheXMgYXM6IHllYXItbW9udGgtZGF5IGhvdXI6bWludXRlOnNlY29uZCAtPiAxOTk5LTAyLTEyIDIzOjU5OjU5XG4gICAgICogTm90ZSB0aGUgZGF0ZSBzZXBhcmF0b3IgY2FuIGJlIHNldCBzZXBhcmF0ZWx5LlxuICAgICAqL1xuICAgIERhdGVGb3JtYXRFbnVtW0RhdGVGb3JtYXRFbnVtW1wiWWVhck1vbnRoRGF5VGltZVwiXSA9IDFdID0gXCJZZWFyTW9udGhEYXlUaW1lXCI7XG4gICAgLyoqXG4gICAgICogRGlzcGxheXMgYXM6IHllYXItZGF5LW1vbnRoIGhvdXI6bWludXRlOnNlY29uZCxtaWxsaXMgLT4gMTk5OS0xMi0wMiAyMzo1OTo1OSwxMjNcbiAgICAgKiBOb3RlIHRoZSBkYXRlIHNlcGFyYXRvciBjYW4gYmUgc2V0IHNlcGFyYXRlbHkuXG4gICAgICovXG4gICAgRGF0ZUZvcm1hdEVudW1bRGF0ZUZvcm1hdEVudW1bXCJZZWFyRGF5TW9udGhXaXRoRnVsbFRpbWVcIl0gPSAyXSA9IFwiWWVhckRheU1vbnRoV2l0aEZ1bGxUaW1lXCI7XG4gICAgLyoqXG4gICAgICogRGlzcGxheXMgYXM6IHllYXItZGF5LW1vbnRoIGhvdXI6bWludXRlOnNlY29uZCAtPiAxOTk5LTEyLTAyIDIzOjU5OjU5XG4gICAgICogTm90ZSB0aGUgZGF0ZSBzZXBhcmF0b3IgY2FuIGJlIHNldCBzZXBhcmF0ZWx5LlxuICAgICAqL1xuICAgIERhdGVGb3JtYXRFbnVtW0RhdGVGb3JtYXRFbnVtW1wiWWVhckRheU1vbnRoVGltZVwiXSA9IDNdID0gXCJZZWFyRGF5TW9udGhUaW1lXCI7XG59KShEYXRlRm9ybWF0RW51bSA9IGV4cG9ydHMuRGF0ZUZvcm1hdEVudW0gfHwgKGV4cG9ydHMuRGF0ZUZvcm1hdEVudW0gPSB7fSkpO1xuLyogdHNsaW50OmRpc2FibGU6bm8tbmFtZXNwYWNlICovXG4oZnVuY3Rpb24gKERhdGVGb3JtYXRFbnVtKSB7XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBMb2dMZXZlbCBiYXNlZCBvbiBzdHJpbmcgcmVwcmVzZW50YXRpb25cbiAgICAgKiBAcGFyYW0gdmFsIFZhbHVlXG4gICAgICogQHJldHVybnMge0xvZ0xldmVsfSwgRXJyb3IgaXMgdGhyb3duIGlmIGludmFsaWQuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZnJvbVN0cmluZyh2YWwpIHtcbiAgICAgICAgaWYgKHZhbCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBtdXN0IGJlIHNldFwiKTtcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKHZhbC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICBjYXNlIFwiZGVmYXVsdFwiOlxuICAgICAgICAgICAgICAgIHJldHVybiBEYXRlRm9ybWF0RW51bS5EZWZhdWx0O1xuICAgICAgICAgICAgY2FzZSBcInllYXJtb250aGRheVRpbWVcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gRGF0ZUZvcm1hdEVudW0uWWVhck1vbnRoRGF5VGltZTtcbiAgICAgICAgICAgIGNhc2UgXCJ5ZWFyZGF5bW9udGh3aXRoZnVsbHRpbWVcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gRGF0ZUZvcm1hdEVudW0uWWVhckRheU1vbnRoV2l0aEZ1bGxUaW1lO1xuICAgICAgICAgICAgY2FzZSBcInllYXJkYXltb250aHRpbWVcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gRGF0ZUZvcm1hdEVudW0uWWVhckRheU1vbnRoVGltZTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5zdXBwb3J0ZWQgdmFsdWUgZm9yIGNvbnZlcnNpb246IFwiICsgdmFsKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBEYXRlRm9ybWF0RW51bS5mcm9tU3RyaW5nID0gZnJvbVN0cmluZztcbn0pKERhdGVGb3JtYXRFbnVtID0gZXhwb3J0cy5EYXRlRm9ybWF0RW51bSB8fCAoZXhwb3J0cy5EYXRlRm9ybWF0RW51bSA9IHt9KSk7XG4vKiB0c2xpbnQ6ZGlzYWJsZTplbmFibGUtbmFtZXNwYWNlICovXG4vKipcbiAqIERhdGVGb3JtYXQgY2xhc3MsIHN0b3JlcyBkYXRhIG9uIGhvdyB0byBmb3JtYXQgYSBkYXRlLlxuICovXG52YXIgRGF0ZUZvcm1hdCA9IChmdW5jdGlvbiAoKSB7XG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3IgdG8gZGVmaW5lIHRoZSBkYXRlZm9ybWF0IHVzZWQgZm9yIGxvZ2dpbmcsIGNhbiBiZSBjYWxsZWQgZW1wdHkgYXMgaXQgdXNlcyBkZWZhdWx0cy5cbiAgICAgKiBAcGFyYW0gZm9ybWF0RW51bSBEYXRlRm9ybWF0RW51bSwgdXNlIG9uZSBvZiB0aGUgY29uc3RhbnRzIGZyb20gdGhlIGVudW0uIERlZmF1bHRzIHRvIERhdGVGb3JtYXRFbnVtLkRlZmF1bHRcbiAgICAgKiBAcGFyYW0gZGF0ZVNlcGFyYXRvciBTZXBhcmF0b3IgdXNlZCBiZXR3ZWVuIGRhdGVzLCBkZWZhdWx0cyB0byAtXG4gICAgICovXG4gICAgZnVuY3Rpb24gRGF0ZUZvcm1hdChmb3JtYXRFbnVtLCBkYXRlU2VwYXJhdG9yKSB7XG4gICAgICAgIGlmIChmb3JtYXRFbnVtID09PSB2b2lkIDApIHsgZm9ybWF0RW51bSA9IERhdGVGb3JtYXRFbnVtLkRlZmF1bHQ7IH1cbiAgICAgICAgaWYgKGRhdGVTZXBhcmF0b3IgPT09IHZvaWQgMCkgeyBkYXRlU2VwYXJhdG9yID0gXCItXCI7IH1cbiAgICAgICAgdGhpcy5fZm9ybWF0RW51bSA9IGZvcm1hdEVudW07XG4gICAgICAgIHRoaXMuX2RhdGVTZXBhcmF0b3IgPSBkYXRlU2VwYXJhdG9yO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRGF0ZUZvcm1hdC5wcm90b3R5cGUsIFwiZm9ybWF0RW51bVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Zvcm1hdEVudW07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9mb3JtYXRFbnVtID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShEYXRlRm9ybWF0LnByb3RvdHlwZSwgXCJkYXRlU2VwYXJhdG9yXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0ZVNlcGFyYXRvcjtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX2RhdGVTZXBhcmF0b3IgPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgRGF0ZUZvcm1hdC5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlRm9ybWF0KHRoaXMuX2Zvcm1hdEVudW0sIHRoaXMuX2RhdGVTZXBhcmF0b3IpO1xuICAgIH07XG4gICAgcmV0dXJuIERhdGVGb3JtYXQ7XG59KCkpO1xuZXhwb3J0cy5EYXRlRm9ybWF0ID0gRGF0ZUZvcm1hdDtcbi8qKlxuICogSW5mb3JtYXRpb24gYWJvdXQgdGhlIGxvZyBmb3JtYXQsIHdoYXQgd2lsbCBhIGxvZyBsaW5lIGxvb2sgbGlrZT9cbiAqL1xudmFyIExvZ0Zvcm1hdCA9IChmdW5jdGlvbiAoKSB7XG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3IgdG8gY3JlYXRlIGEgTG9nRm9ybWF0LiBDYW4gYmUgY3JlYXRlZCB3aXRob3V0IHBhcmFtZXRlcnMgd2hlcmUgaXQgd2lsbCB1c2Ugc2FuZSBkZWZhdWx0cy5cbiAgICAgKiBAcGFyYW0gZGF0ZUZvcm1hdCBEYXRlRm9ybWF0ICh3aGF0IG5lZWRzIHRoZSBkYXRlIGxvb2sgbGlrZSBpbiB0aGUgbG9nIGxpbmUpXG4gICAgICogQHBhcmFtIHNob3dUaW1lU3RhbXAgU2hvdyBkYXRlIHRpbWVzdGFtcCBhdCBhbGw/XG4gICAgICogQHBhcmFtIHNob3dMb2dnZXJOYW1lIFNob3cgdGhlIGxvZ2dlciBuYW1lP1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIExvZ0Zvcm1hdChkYXRlRm9ybWF0LCBzaG93VGltZVN0YW1wLCBzaG93TG9nZ2VyTmFtZSkge1xuICAgICAgICBpZiAoZGF0ZUZvcm1hdCA9PT0gdm9pZCAwKSB7IGRhdGVGb3JtYXQgPSBuZXcgRGF0ZUZvcm1hdCgpOyB9XG4gICAgICAgIGlmIChzaG93VGltZVN0YW1wID09PSB2b2lkIDApIHsgc2hvd1RpbWVTdGFtcCA9IHRydWU7IH1cbiAgICAgICAgaWYgKHNob3dMb2dnZXJOYW1lID09PSB2b2lkIDApIHsgc2hvd0xvZ2dlck5hbWUgPSB0cnVlOyB9XG4gICAgICAgIHRoaXMuX3Nob3dUaW1lU3RhbXAgPSB0cnVlO1xuICAgICAgICB0aGlzLl9zaG93TG9nZ2VyTmFtZSA9IHRydWU7XG4gICAgICAgIHRoaXMuX2RhdGVGb3JtYXQgPSBkYXRlRm9ybWF0O1xuICAgICAgICB0aGlzLl9zaG93VGltZVN0YW1wID0gc2hvd1RpbWVTdGFtcDtcbiAgICAgICAgdGhpcy5fc2hvd0xvZ2dlck5hbWUgPSBzaG93TG9nZ2VyTmFtZTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KExvZ0Zvcm1hdC5wcm90b3R5cGUsIFwiZGF0ZUZvcm1hdFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGVGb3JtYXQ7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShMb2dGb3JtYXQucHJvdG90eXBlLCBcInNob3dUaW1lU3RhbXBcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zaG93VGltZVN0YW1wO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fc2hvd1RpbWVTdGFtcCA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTG9nRm9ybWF0LnByb3RvdHlwZSwgXCJzaG93TG9nZ2VyTmFtZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Nob3dMb2dnZXJOYW1lO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fc2hvd0xvZ2dlck5hbWUgPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgcmV0dXJuIExvZ0Zvcm1hdDtcbn0oKSk7XG5leHBvcnRzLkxvZ0Zvcm1hdCA9IExvZ0Zvcm1hdDtcbi8qKlxuICogSW5mb3JtYXRpb24gYWJvdXQgdGhlIGxvZyBmb3JtYXQsIHdoYXQgd2lsbCBhIGxvZyBsaW5lIGxvb2sgbGlrZT9cbiAqL1xudmFyIENhdGVnb3J5TG9nRm9ybWF0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYW4gaW5zdGFuY2UgZGVmaW5pbmcgdGhlIGNhdGVnb3J5IGxvZyBmb3JtYXQgdXNlZC5cbiAgICAgKiBAcGFyYW0gZGF0ZUZvcm1hdCBEYXRlIGZvcm1hdCAodXNlcyBkZWZhdWx0KSwgZm9yIGRldGFpbHMgc2VlIERhdGVGb3JtYXQgY2xhc3MuXG4gICAgICogQHBhcmFtIHNob3dUaW1lU3RhbXAgVHJ1ZSB0byBzaG93IHRpbWVzdGFtcCBpbiB0aGUgbG9nZ2luZywgZGVmYXVsdHMgdG8gdHJ1ZS5cbiAgICAgKiBAcGFyYW0gc2hvd0NhdGVnb3J5TmFtZSBUcnVlIHRvIHNob3cgY2F0ZWdvcnkgbmFtZSBpbiB0aGUgbG9nZ2luZywgZGVmYXVsdHMgdG8gdHJ1ZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBDYXRlZ29yeUxvZ0Zvcm1hdChkYXRlRm9ybWF0LCBzaG93VGltZVN0YW1wLCBzaG93Q2F0ZWdvcnlOYW1lKSB7XG4gICAgICAgIGlmIChkYXRlRm9ybWF0ID09PSB2b2lkIDApIHsgZGF0ZUZvcm1hdCA9IG5ldyBEYXRlRm9ybWF0KCk7IH1cbiAgICAgICAgaWYgKHNob3dUaW1lU3RhbXAgPT09IHZvaWQgMCkgeyBzaG93VGltZVN0YW1wID0gdHJ1ZTsgfVxuICAgICAgICBpZiAoc2hvd0NhdGVnb3J5TmFtZSA9PT0gdm9pZCAwKSB7IHNob3dDYXRlZ29yeU5hbWUgPSB0cnVlOyB9XG4gICAgICAgIHRoaXMuX2RhdGVGb3JtYXQgPSBkYXRlRm9ybWF0O1xuICAgICAgICB0aGlzLl9zaG93VGltZVN0YW1wID0gc2hvd1RpbWVTdGFtcDtcbiAgICAgICAgdGhpcy5fc2hvd0NhdGVnb3J5TmFtZSA9IHNob3dDYXRlZ29yeU5hbWU7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDYXRlZ29yeUxvZ0Zvcm1hdC5wcm90b3R5cGUsIFwiZGF0ZUZvcm1hdFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGVGb3JtYXQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9kYXRlRm9ybWF0ID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDYXRlZ29yeUxvZ0Zvcm1hdC5wcm90b3R5cGUsIFwic2hvd1RpbWVTdGFtcFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Nob3dUaW1lU3RhbXA7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93VGltZVN0YW1wID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDYXRlZ29yeUxvZ0Zvcm1hdC5wcm90b3R5cGUsIFwic2hvd0NhdGVnb3J5TmFtZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Nob3dDYXRlZ29yeU5hbWU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93Q2F0ZWdvcnlOYW1lID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIENhdGVnb3J5TG9nRm9ybWF0LnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IENhdGVnb3J5TG9nRm9ybWF0KHRoaXMuX2RhdGVGb3JtYXQuY29weSgpLCB0aGlzLl9zaG93VGltZVN0YW1wLCB0aGlzLl9zaG93Q2F0ZWdvcnlOYW1lKTtcbiAgICB9O1xuICAgIHJldHVybiBDYXRlZ29yeUxvZ0Zvcm1hdDtcbn0oKSk7XG5leHBvcnRzLkNhdGVnb3J5TG9nRm9ybWF0ID0gQ2F0ZWdvcnlMb2dGb3JtYXQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Mb2dnZXJPcHRpb25zLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIERhdGFTdHJ1Y3R1cmVzXzEgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvRGF0YVN0cnVjdHVyZXNcIik7XG52YXIgTWVzc2FnZVV0aWxzXzEgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvTWVzc2FnZVV0aWxzXCIpO1xudmFyIExvZ2dlck9wdGlvbnNfMSA9IHJlcXVpcmUoXCIuLi9Mb2dnZXJPcHRpb25zXCIpO1xudmFyIENhdGVnb3J5TG9nTWVzc2FnZUltcGwgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENhdGVnb3J5TG9nTWVzc2FnZUltcGwobWVzc2FnZSwgZXJyb3IsIGNhdGVnb3JpZXMsIGRhdGUsIGxldmVsLCBsb2dGb3JtYXQsIHJlYWR5KSB7XG4gICAgICAgIHRoaXMuX3Jlc29sdmVkRXJyb3JNZXNzYWdlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2Vycm9yQXNTdGFjayA9IG51bGw7XG4gICAgICAgIHRoaXMuX21lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICB0aGlzLl9lcnJvciA9IGVycm9yO1xuICAgICAgICB0aGlzLl9jYXRlZ29yaWVzID0gY2F0ZWdvcmllcztcbiAgICAgICAgdGhpcy5fZGF0ZSA9IGRhdGU7XG4gICAgICAgIHRoaXMuX2xldmVsID0gbGV2ZWw7XG4gICAgICAgIHRoaXMuX2xvZ0Zvcm1hdCA9IGxvZ0Zvcm1hdDtcbiAgICAgICAgdGhpcy5fcmVhZHkgPSByZWFkeTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENhdGVnb3J5TG9nTWVzc2FnZUltcGwucHJvdG90eXBlLCBcIm1lc3NhZ2VcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tZXNzYWdlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ2F0ZWdvcnlMb2dNZXNzYWdlSW1wbC5wcm90b3R5cGUsIFwiZXJyb3JcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9lcnJvcjtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENhdGVnb3J5TG9nTWVzc2FnZUltcGwucHJvdG90eXBlLCBcImNhdGVnb3JpZXNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jYXRlZ29yaWVzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ2F0ZWdvcnlMb2dNZXNzYWdlSW1wbC5wcm90b3R5cGUsIFwiZGF0ZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDYXRlZ29yeUxvZ01lc3NhZ2VJbXBsLnByb3RvdHlwZSwgXCJsZXZlbFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xldmVsO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ2F0ZWdvcnlMb2dNZXNzYWdlSW1wbC5wcm90b3R5cGUsIFwibG9nRm9ybWF0XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbG9nRm9ybWF0O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ2F0ZWdvcnlMb2dNZXNzYWdlSW1wbC5wcm90b3R5cGUsIFwiaXNNZXNzYWdlTG9nRGF0YVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiAodGhpcy5fbWVzc2FnZSkgIT09IFwic3RyaW5nXCI7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDYXRlZ29yeUxvZ01lc3NhZ2VJbXBsLnByb3RvdHlwZSwgXCJtZXNzYWdlQXNTdHJpbmdcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKHRoaXMuX21lc3NhZ2UpID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21lc3NhZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbWVzc2FnZS5tc2c7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDYXRlZ29yeUxvZ01lc3NhZ2VJbXBsLnByb3RvdHlwZSwgXCJsb2dEYXRhXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbnVsbDtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKHRoaXMuX21lc3NhZ2UpICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5tZXNzYWdlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENhdGVnb3J5TG9nTWVzc2FnZUltcGwucHJvdG90eXBlLCBcImlzUmVzb2x2ZWRFcnJvck1lc3NhZ2VcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZXNvbHZlZEVycm9yTWVzc2FnZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENhdGVnb3J5TG9nTWVzc2FnZUltcGwucHJvdG90eXBlLCBcImVycm9yQXNTdGFja1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Vycm9yQXNTdGFjaztcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoc3RhY2spIHtcbiAgICAgICAgICAgIHRoaXMuX2Vycm9yQXNTdGFjayA9IHN0YWNrO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBDYXRlZ29yeUxvZ01lc3NhZ2VJbXBsLnByb3RvdHlwZS5pc1JlYWR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVhZHk7XG4gICAgfTtcbiAgICBDYXRlZ29yeUxvZ01lc3NhZ2VJbXBsLnByb3RvdHlwZS5zZXRSZWFkeSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLl9yZWFkeSA9IHZhbHVlO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENhdGVnb3J5TG9nTWVzc2FnZUltcGwucHJvdG90eXBlLCBcInJlc29sdmVkRXJyb3JNZXNzYWdlXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVzb2x2ZWRFcnJvck1lc3NhZ2U7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9yZXNvbHZlZEVycm9yTWVzc2FnZSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICByZXR1cm4gQ2F0ZWdvcnlMb2dNZXNzYWdlSW1wbDtcbn0oKSk7XG4vKipcbiAqIEFic3RyYWN0IGNhdGVnb3J5IGxvZ2dlciwgdXNlIGFzIHlvdXIgYmFzZSBjbGFzcyBmb3IgbmV3IHR5cGUgb2YgbG9nZ2VycyAoaXRcbiAqIHNhdmVzIHlvdSBhIGxvdCBvZiB3b3JrKSBhbmQgb3ZlcnJpZGUgZG9Mb2coQ2F0ZWdvcnlMb2dNZXNzYWdlKS4gVGhlIG1lc3NhZ2UgYXJndW1lbnRcbiAqIHByb3ZpZGVzIGZ1bGwgYWNjZXNzIHRvIGFueXRoaW5nIHJlbGF0ZWQgdG8gdGhlIGxvZ2dpbmcgZXZlbnQuXG4gKiBJZiB5b3UganVzdCB3YW50IHRoZSBzdGFuZGFyZCBsaW5lIG9mIGxvZ2dpbmcsIGNhbGw6IHRoaXMuY3JlYXRlRGVmYXVsdExvZ01lc3NhZ2UobXNnKSBvblxuICogdGhpcyBjbGFzcyB3aGljaCB3aWxsIHJldHVybiB5b3UgdGhlIGZvcm1hdHRlZCBsb2cgbWVzc2FnZSBhcyBzdHJpbmcgKGUuZy4gdGhlXG4gKiBkZWZhdWx0IGxvZ2dlcnMgYWxsIHVzZSB0aGlzKS5cbiAqL1xudmFyIEFic3RyYWN0Q2F0ZWdvcnlMb2dnZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEFic3RyYWN0Q2F0ZWdvcnlMb2dnZXIocm9vdENhdGVnb3J5LCBydW50aW1lU2V0dGluZ3MpIHtcbiAgICAgICAgdGhpcy5hbGxNZXNzYWdlcyA9IG5ldyBEYXRhU3RydWN0dXJlc18xLkxpbmtlZExpc3QoKTtcbiAgICAgICAgdGhpcy5yb290Q2F0ZWdvcnkgPSByb290Q2F0ZWdvcnk7XG4gICAgICAgIHRoaXMucnVudGltZVNldHRpbmdzID0gcnVudGltZVNldHRpbmdzO1xuICAgIH1cbiAgICBBYnN0cmFjdENhdGVnb3J5TG9nZ2VyLnByb3RvdHlwZS50cmFjZSA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICAgICAgdmFyIGNhdGVnb3JpZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGNhdGVnb3JpZXNbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbG9nLmFwcGx5KHRoaXMsIFtMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuVHJhY2UsIG1zZywgbnVsbCwgZmFsc2VdLmNvbmNhdChjYXRlZ29yaWVzKSk7XG4gICAgfTtcbiAgICBBYnN0cmFjdENhdGVnb3J5TG9nZ2VyLnByb3RvdHlwZS5kZWJ1ZyA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICAgICAgdmFyIGNhdGVnb3JpZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGNhdGVnb3JpZXNbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbG9nLmFwcGx5KHRoaXMsIFtMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuRGVidWcsIG1zZywgbnVsbCwgZmFsc2VdLmNvbmNhdChjYXRlZ29yaWVzKSk7XG4gICAgfTtcbiAgICBBYnN0cmFjdENhdGVnb3J5TG9nZ2VyLnByb3RvdHlwZS5pbmZvID0gZnVuY3Rpb24gKG1zZykge1xuICAgICAgICB2YXIgY2F0ZWdvcmllcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgY2F0ZWdvcmllc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9sb2cuYXBwbHkodGhpcywgW0xvZ2dlck9wdGlvbnNfMS5Mb2dMZXZlbC5JbmZvLCBtc2csIG51bGwsIGZhbHNlXS5jb25jYXQoY2F0ZWdvcmllcykpO1xuICAgIH07XG4gICAgQWJzdHJhY3RDYXRlZ29yeUxvZ2dlci5wcm90b3R5cGUud2FybiA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICAgICAgdmFyIGNhdGVnb3JpZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGNhdGVnb3JpZXNbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbG9nLmFwcGx5KHRoaXMsIFtMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuV2FybiwgbXNnLCBudWxsLCBmYWxzZV0uY29uY2F0KGNhdGVnb3JpZXMpKTtcbiAgICB9O1xuICAgIEFic3RyYWN0Q2F0ZWdvcnlMb2dnZXIucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKG1zZywgZXJyb3IpIHtcbiAgICAgICAgdmFyIGNhdGVnb3JpZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAyOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGNhdGVnb3JpZXNbX2kgLSAyXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbG9nLmFwcGx5KHRoaXMsIFtMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuRXJyb3IsIG1zZywgZXJyb3IsIGZhbHNlXS5jb25jYXQoY2F0ZWdvcmllcykpO1xuICAgIH07XG4gICAgQWJzdHJhY3RDYXRlZ29yeUxvZ2dlci5wcm90b3R5cGUuZmF0YWwgPSBmdW5jdGlvbiAobXNnLCBlcnJvcikge1xuICAgICAgICB2YXIgY2F0ZWdvcmllcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDI7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgY2F0ZWdvcmllc1tfaSAtIDJdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9sb2cuYXBwbHkodGhpcywgW0xvZ2dlck9wdGlvbnNfMS5Mb2dMZXZlbC5GYXRhbCwgbXNnLCBlcnJvciwgZmFsc2VdLmNvbmNhdChjYXRlZ29yaWVzKSk7XG4gICAgfTtcbiAgICBBYnN0cmFjdENhdGVnb3J5TG9nZ2VyLnByb3RvdHlwZS5yZXNvbHZlZCA9IGZ1bmN0aW9uIChtc2csIGVycm9yKSB7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMjsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBjYXRlZ29yaWVzW19pIC0gMl0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2xvZy5hcHBseSh0aGlzLCBbTG9nZ2VyT3B0aW9uc18xLkxvZ0xldmVsLkVycm9yLCBtc2csIGVycm9yLCB0cnVlXS5jb25jYXQoY2F0ZWdvcmllcykpO1xuICAgIH07XG4gICAgQWJzdHJhY3RDYXRlZ29yeUxvZ2dlci5wcm90b3R5cGUubG9nID0gZnVuY3Rpb24gKGxldmVsLCBtc2csIGVycm9yKSB7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMzsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBjYXRlZ29yaWVzW19pIC0gM10gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2xvZy5hcHBseSh0aGlzLCBbbGV2ZWwsIG1zZywgZXJyb3IsIGZhbHNlXS5jb25jYXQoY2F0ZWdvcmllcykpO1xuICAgIH07XG4gICAgQWJzdHJhY3RDYXRlZ29yeUxvZ2dlci5wcm90b3R5cGUuZ2V0Um9vdENhdGVnb3J5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yb290Q2F0ZWdvcnk7XG4gICAgfTtcbiAgICBBYnN0cmFjdENhdGVnb3J5TG9nZ2VyLnByb3RvdHlwZS5jcmVhdGVEZWZhdWx0TG9nTWVzc2FnZSA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICAgICAgcmV0dXJuIE1lc3NhZ2VVdGlsc18xLk1lc3NhZ2VGb3JtYXRVdGlscy5yZW5kZXJEZWZhdWx0TWVzc2FnZShtc2csIHRydWUpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJuIG9wdGlvbmFsIG1lc3NhZ2UgZm9ybWF0dGVyLiBBbGwgTG9nZ2VyVHlwZXMgKGV4Y2VwdCBjdXN0b20pIHdpbGwgc2VlIGlmXG4gICAgICogdGhleSBoYXZlIHRoaXMsIGFuZCBpZiBzbyB1c2UgaXQgdG8gbG9nLlxuICAgICAqIEByZXR1cm5zIHsoKG1lc3NhZ2U6Q2F0ZWdvcnlMb2dNZXNzYWdlKT0+c3RyaW5nKXxudWxsfVxuICAgICAqL1xuICAgIEFic3RyYWN0Q2F0ZWdvcnlMb2dnZXIucHJvdG90eXBlLl9nZXRNZXNzYWdlRm9ybWF0dGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2F0ZWdvcnlTZXR0aW5ncyA9IHRoaXMucnVudGltZVNldHRpbmdzLmdldENhdGVnb3J5U2V0dGluZ3ModGhpcy5yb290Q2F0ZWdvcnkpO1xuICAgICAgICAvLyBTaG91bGQgbm90IGhhcHBlbiBidXQgbWFrZSB0cyBoYXBweVxuICAgICAgICBpZiAoY2F0ZWdvcnlTZXR0aW5ncyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGlkIG5vdCBmaW5kIENhdGVnb3J5U2V0dGluZ3MgZm9yIHJvb3RDYXRlZ29yeTogXCIgKyB0aGlzLnJvb3RDYXRlZ29yeS5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2F0ZWdvcnlTZXR0aW5ncy5mb3JtYXR0ZXJMb2dNZXNzYWdlO1xuICAgIH07XG4gICAgQWJzdHJhY3RDYXRlZ29yeUxvZ2dlci5wcm90b3R5cGUuX2xvZyA9IGZ1bmN0aW9uIChsZXZlbCwgbXNnLCBlcnJvciwgcmVzb2x2ZWQpIHtcbiAgICAgICAgaWYgKGVycm9yID09PSB2b2lkIDApIHsgZXJyb3IgPSBudWxsOyB9XG4gICAgICAgIGlmIChyZXNvbHZlZCA9PT0gdm9pZCAwKSB7IHJlc29sdmVkID0gZmFsc2U7IH1cbiAgICAgICAgdmFyIGNhdGVnb3JpZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSA0OyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGNhdGVnb3JpZXNbX2kgLSA0XSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgLy8gdGhpcy5fbG9nSW50ZXJuYWwobGV2ZWwsICgpID0+IG1zZywgKCkgPT4gZXJyb3IsIHJlc29sdmVkLCAuLi5jYXRlZ29yaWVzKTtcbiAgICAgICAgdmFyIGZ1bmN0aW9uTWVzc2FnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbXNnID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbXNnKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbXNnO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZnVuY3Rpb25FcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXJyb3IgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnJvcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGVycm9yO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9sb2dJbnRlcm5hbC5hcHBseSh0aGlzLCBbbGV2ZWwsIGZ1bmN0aW9uTWVzc2FnZSwgZnVuY3Rpb25FcnJvciwgcmVzb2x2ZWRdLmNvbmNhdChjYXRlZ29yaWVzKSk7XG4gICAgfTtcbiAgICBBYnN0cmFjdENhdGVnb3J5TG9nZ2VyLnByb3RvdHlwZS5fbG9nSW50ZXJuYWwgPSBmdW5jdGlvbiAobGV2ZWwsIG1zZywgZXJyb3IsIHJlc29sdmVkKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gNDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBjYXRlZ29yaWVzW19pIC0gNF0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHZhciBsb2dDYXRlZ29yaWVzID0gW3RoaXMucm9vdENhdGVnb3J5XTtcbiAgICAgICAgLy8gTG9nIHJvb3QgY2F0ZWdvcnkgYnkgZGVmYXVsdCBpZiBub25lIHByZXNlbnRcbiAgICAgICAgaWYgKHR5cGVvZiBjYXRlZ29yaWVzICE9PSBcInVuZGVmaW5lZFwiICYmIGNhdGVnb3JpZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbG9nQ2F0ZWdvcmllcyA9IGxvZ0NhdGVnb3JpZXMuY29uY2F0KGNhdGVnb3JpZXMuZmlsdGVyKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjICE9PSBfdGhpcy5yb290Q2F0ZWdvcnk7IH0pKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgX2xvb3BfMSA9IGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICB2YXIgY2F0ZWdvcnkgPSBsb2dDYXRlZ29yaWVzW2ldO1xuICAgICAgICAgICAgaWYgKGNhdGVnb3J5ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGhhdmUgYSBudWxsIGVsZW1lbnQgd2l0aGluIGNhdGVnb3JpZXMsIGF0IGluZGV4PVwiICsgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB0aGlzXzEucnVudGltZVNldHRpbmdzLmdldENhdGVnb3J5U2V0dGluZ3MoY2F0ZWdvcnkpO1xuICAgICAgICAgICAgaWYgKHNldHRpbmdzID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2F0ZWdvcnkgd2l0aCBwYXRoOiBcIiArIGNhdGVnb3J5LmdldENhdGVnb3J5UGF0aCgpICsgXCIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCB0aGlzIGxvZ2dlciwgbWF5YmUgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcInlvdSByZWdpc3RlcmVkIGl0IHdpdGggYSBkaWZmZXJlbnQgcm9vdCBsb2dnZXI/XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNldHRpbmdzLmxvZ0xldmVsIDw9IGxldmVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFjdHVhbEVycm9yID0gZXJyb3IgIT09IG51bGwgPyBlcnJvcigpIDogbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoYWN0dWFsRXJyb3IgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxvZ01lc3NhZ2UgPSBuZXcgQ2F0ZWdvcnlMb2dNZXNzYWdlSW1wbChtc2coKSwgYWN0dWFsRXJyb3IsIGxvZ0NhdGVnb3JpZXMsIG5ldyBEYXRlKCksIGxldmVsLCBzZXR0aW5ncy5sb2dGb3JtYXQsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBsb2dNZXNzYWdlLnJlc29sdmVkRXJyb3JNZXNzYWdlID0gcmVzb2x2ZWQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNfMS5hbGxNZXNzYWdlcy5hZGRUYWlsKGxvZ01lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzXzEucHJvY2Vzc01lc3NhZ2VzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbG9nTWVzc2FnZV8xID0gbmV3IENhdGVnb3J5TG9nTWVzc2FnZUltcGwobXNnKCksIGFjdHVhbEVycm9yLCBsb2dDYXRlZ29yaWVzLCBuZXcgRGF0ZSgpLCBsZXZlbCwgc2V0dGluZ3MubG9nRm9ybWF0LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIGxvZ01lc3NhZ2VfMS5yZXNvbHZlZEVycm9yTWVzc2FnZSA9IHJlc29sdmVkO1xuICAgICAgICAgICAgICAgICAgICB0aGlzXzEuYWxsTWVzc2FnZXMuYWRkVGFpbChsb2dNZXNzYWdlXzEpO1xuICAgICAgICAgICAgICAgICAgICBNZXNzYWdlVXRpbHNfMS5NZXNzYWdlRm9ybWF0VXRpbHMucmVuZGVyRXJyb3IoYWN0dWFsRXJyb3IpLnRoZW4oZnVuY3Rpb24gKHN0YWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dNZXNzYWdlXzEuZXJyb3JBc1N0YWNrID0gc3RhY2s7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dNZXNzYWdlXzEuc2V0UmVhZHkodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9jZXNzTWVzc2FnZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nTWVzc2FnZV8xLmVycm9yQXNTdGFjayA9IFwiPFVOS05PV04+IHVuYWJsZSB0byBnZXQgc3RhY2suXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dNZXNzYWdlXzEuc2V0UmVhZHkodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9jZXNzTWVzc2FnZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBcImJyZWFrXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciB0aGlzXzEgPSB0aGlzO1xuICAgICAgICAvLyBHZXQgdGhlIHJ1bnRpbWUgbGV2ZWxzIGZvciBnaXZlbiBjYXRlZ29yaWVzLiBJZiB0aGVpciBsZXZlbCBpcyBsb3dlciB0aGFuIGdpdmVuIGxldmVsLCB3ZSBsb2cuXG4gICAgICAgIC8vIEluIGFkZGl0aW9uIHdlIHBhc3MgYWxvbmcgd2hpY2ggY2F0ZWdvcnkvY2F0ZWdvcmllcyB3ZSBsb2cgdGhpcyBzdGF0ZW1lbnQgZm9yLlxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxvZ0NhdGVnb3JpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBzdGF0ZV8xID0gX2xvb3BfMShpKTtcbiAgICAgICAgICAgIGlmIChzdGF0ZV8xID09PSBcImJyZWFrXCIpXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEFic3RyYWN0Q2F0ZWdvcnlMb2dnZXIucHJvdG90eXBlLnByb2Nlc3NNZXNzYWdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gQmFzaWNhbGx5IHdlIHdhaXQgdW50aWwgZXJyb3JzIGFyZSByZXNvbHZlZCAodGhvc2UgbWVzc2FnZXNcbiAgICAgICAgLy8gbWF5IG5vdCBiZSByZWFkeSkuXG4gICAgICAgIHZhciBtc2dzID0gdGhpcy5hbGxNZXNzYWdlcztcbiAgICAgICAgaWYgKG1zZ3MuZ2V0U2l6ZSgpID4gMCkge1xuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIHZhciBtc2cgPSBtc2dzLmdldEhlYWQoKTtcbiAgICAgICAgICAgICAgICBpZiAobXNnICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtc2cuaXNSZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtc2dzLnJlbW92ZUhlYWQoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb0xvZyhtc2cpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gd2hpbGUgKG1zZ3MuZ2V0U2l6ZSgpID4gMCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBBYnN0cmFjdENhdGVnb3J5TG9nZ2VyO1xufSgpKTtcbmV4cG9ydHMuQWJzdHJhY3RDYXRlZ29yeUxvZ2dlciA9IEFic3RyYWN0Q2F0ZWdvcnlMb2dnZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1BYnN0cmFjdENhdGVnb3J5TG9nZ2VyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIExvZ2dlck9wdGlvbnNfMSA9IHJlcXVpcmUoXCIuLi9Mb2dnZXJPcHRpb25zXCIpO1xudmFyIENhdGVnb3J5U2VydmljZV8xID0gcmVxdWlyZShcIi4vQ2F0ZWdvcnlTZXJ2aWNlXCIpO1xuLyoqXG4gKiBDYXRlZ29yeSBmb3IgdXNlIHdpdGggY2F0ZWdvcml6ZWQgbG9nZ2luZy5cbiAqIEF0IG1pbmltdW0geW91IG5lZWQgb25lIGNhdGVnb3J5LCB3aGljaCB3aWxsIHNlcnZlIGFzIHRoZSByb290IGNhdGVnb3J5LlxuICogWW91IGNhbiBjcmVhdGUgY2hpbGQgY2F0ZWdvcmllcyAobGlrZSBhIHRyZWUpLiBZb3UgY2FuIGhhdmUgbXVsdGlwbGUgcm9vdFxuICogY2F0ZWdvcmllcy5cbiAqL1xudmFyIENhdGVnb3J5ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDYXRlZ29yeShuYW1lLCBwYXJlbnQpIHtcbiAgICAgICAgaWYgKHBhcmVudCA9PT0gdm9pZCAwKSB7IHBhcmVudCA9IG51bGw7IH1cbiAgICAgICAgdGhpcy5fY2hpbGRyZW4gPSBbXTtcbiAgICAgICAgdGhpcy5fbG9nTGV2ZWwgPSBMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuRXJyb3I7XG4gICAgICAgIGlmIChuYW1lLmluZGV4T2YoXCIjXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHVzZSAjIGluIGEgbmFtZSBvZiBhIENhdGVnb3J5XCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2lkID0gQ2F0ZWdvcnkubmV4dElkKCk7XG4gICAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLl9wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgIGlmICh0aGlzLl9wYXJlbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX3BhcmVudC5fY2hpbGRyZW4ucHVzaCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBDYXRlZ29yeVNlcnZpY2VfMS5DYXRlZ29yeVNlcnZpY2VJbXBsLmdldEluc3RhbmNlKCkucmVnaXN0ZXJDYXRlZ29yeSh0aGlzKTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENhdGVnb3J5LnByb3RvdHlwZSwgXCJuYW1lXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbmFtZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENhdGVnb3J5LnByb3RvdHlwZSwgXCJwYXJlbnRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQ7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDYXRlZ29yeS5wcm90b3R5cGUsIFwiY2hpbGRyZW5cIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jaGlsZHJlbjtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENhdGVnb3J5LnByb3RvdHlwZSwgXCJsb2dMZXZlbFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xvZ0xldmVsO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBDYXRlZ29yeS5wcm90b3R5cGUudHJhY2UgPSBmdW5jdGlvbiAobXNnKSB7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBjYXRlZ29yaWVzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubG9hZENhdGVnb3J5TG9nZ2VyKCk7XG4gICAgICAgIChfYSA9IHRoaXMuX2xvZ2dlcikudHJhY2UuYXBwbHkoX2EsIFttc2ddLmNvbmNhdChjYXRlZ29yaWVzKSk7XG4gICAgICAgIHZhciBfYTtcbiAgICB9O1xuICAgIENhdGVnb3J5LnByb3RvdHlwZS5kZWJ1ZyA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICAgICAgdmFyIGNhdGVnb3JpZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGNhdGVnb3JpZXNbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sb2FkQ2F0ZWdvcnlMb2dnZXIoKTtcbiAgICAgICAgKF9hID0gdGhpcy5fbG9nZ2VyKS5kZWJ1Zy5hcHBseShfYSwgW21zZ10uY29uY2F0KGNhdGVnb3JpZXMpKTtcbiAgICAgICAgdmFyIF9hO1xuICAgIH07XG4gICAgQ2F0ZWdvcnkucHJvdG90eXBlLmluZm8gPSBmdW5jdGlvbiAobXNnKSB7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBjYXRlZ29yaWVzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubG9hZENhdGVnb3J5TG9nZ2VyKCk7XG4gICAgICAgIChfYSA9IHRoaXMuX2xvZ2dlcikuaW5mby5hcHBseShfYSwgW21zZ10uY29uY2F0KGNhdGVnb3JpZXMpKTtcbiAgICAgICAgdmFyIF9hO1xuICAgIH07XG4gICAgQ2F0ZWdvcnkucHJvdG90eXBlLndhcm4gPSBmdW5jdGlvbiAobXNnKSB7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBjYXRlZ29yaWVzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubG9hZENhdGVnb3J5TG9nZ2VyKCk7XG4gICAgICAgIChfYSA9IHRoaXMuX2xvZ2dlcikud2Fybi5hcHBseShfYSwgW21zZ10uY29uY2F0KGNhdGVnb3JpZXMpKTtcbiAgICAgICAgdmFyIF9hO1xuICAgIH07XG4gICAgQ2F0ZWdvcnkucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKG1zZywgZXJyb3IpIHtcbiAgICAgICAgdmFyIGNhdGVnb3JpZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAyOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGNhdGVnb3JpZXNbX2kgLSAyXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sb2FkQ2F0ZWdvcnlMb2dnZXIoKTtcbiAgICAgICAgKF9hID0gdGhpcy5fbG9nZ2VyKS5lcnJvci5hcHBseShfYSwgW21zZywgZXJyb3JdLmNvbmNhdChjYXRlZ29yaWVzKSk7XG4gICAgICAgIHZhciBfYTtcbiAgICB9O1xuICAgIENhdGVnb3J5LnByb3RvdHlwZS5mYXRhbCA9IGZ1bmN0aW9uIChtc2csIGVycm9yKSB7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMjsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBjYXRlZ29yaWVzW19pIC0gMl0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubG9hZENhdGVnb3J5TG9nZ2VyKCk7XG4gICAgICAgIChfYSA9IHRoaXMuX2xvZ2dlcikuZmF0YWwuYXBwbHkoX2EsIFttc2csIGVycm9yXS5jb25jYXQoY2F0ZWdvcmllcykpO1xuICAgICAgICB2YXIgX2E7XG4gICAgfTtcbiAgICBDYXRlZ29yeS5wcm90b3R5cGUucmVzb2x2ZWQgPSBmdW5jdGlvbiAobXNnLCBlcnJvcikge1xuICAgICAgICB2YXIgY2F0ZWdvcmllcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDI7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgY2F0ZWdvcmllc1tfaSAtIDJdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxvYWRDYXRlZ29yeUxvZ2dlcigpO1xuICAgICAgICAoX2EgPSB0aGlzLl9sb2dnZXIpLnJlc29sdmVkLmFwcGx5KF9hLCBbbXNnLCBlcnJvcl0uY29uY2F0KGNhdGVnb3JpZXMpKTtcbiAgICAgICAgdmFyIF9hO1xuICAgIH07XG4gICAgQ2F0ZWdvcnkucHJvdG90eXBlLmxvZyA9IGZ1bmN0aW9uIChsZXZlbCwgbXNnLCBlcnJvcikge1xuICAgICAgICB2YXIgY2F0ZWdvcmllcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDM7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgY2F0ZWdvcmllc1tfaSAtIDNdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxvYWRDYXRlZ29yeUxvZ2dlcigpO1xuICAgICAgICAoX2EgPSB0aGlzLl9sb2dnZXIpLmxvZy5hcHBseShfYSwgW2xldmVsLCBtc2csIGVycm9yXS5jb25jYXQoY2F0ZWdvcmllcykpO1xuICAgICAgICB2YXIgX2E7XG4gICAgfTtcbiAgICBDYXRlZ29yeS5wcm90b3R5cGUuZ2V0Q2F0ZWdvcnlQYXRoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5uYW1lO1xuICAgICAgICB2YXIgY2F0ID0gdGhpcy5wYXJlbnQ7XG4gICAgICAgIHdoaWxlIChjYXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmVzdWx0ID0gY2F0Lm5hbWUgKyBcIiNcIiArIHJlc3VsdDtcbiAgICAgICAgICAgIGNhdCA9IGNhdC5wYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDYXRlZ29yeS5wcm90b3R5cGUsIFwiaWRcIiwge1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyB0aGUgaWQgZm9yIHRoaXMgY2F0ZWdvcnkgKHRoaXNcbiAgICAgICAgICogaXMgZm9yIGludGVybmFsIHB1cnBvc2VzIG9ubHkpLlxuICAgICAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBJZFxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faWQ7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIENhdGVnb3J5LnByb3RvdHlwZS5sb2FkQ2F0ZWdvcnlMb2dnZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy5fbG9nZ2VyKSB7XG4gICAgICAgICAgICB0aGlzLl9sb2dnZXIgPSBDYXRlZ29yeVNlcnZpY2VfMS5DYXRlZ29yeVNlcnZpY2VJbXBsLmdldEluc3RhbmNlKCkuZ2V0TG9nZ2VyKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fbG9nZ2VyID09PSBcInVuZGVmaW5lZFwiIHx8IHRoaXMuX2xvZ2dlciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGxvYWQgYSBsb2dnZXIgZm9yIGNhdGVnb3J5IChzaG91bGQgbm90IGhhcHBlbik6IFwiICsgdGhpcy5uYW1lKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQ2F0ZWdvcnkubmV4dElkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gQ2F0ZWdvcnkuY3VycmVudElkKys7XG4gICAgfTtcbiAgICBDYXRlZ29yeS5jdXJyZW50SWQgPSAxO1xuICAgIHJldHVybiBDYXRlZ29yeTtcbn0oKSk7XG5leHBvcnRzLkNhdGVnb3J5ID0gQ2F0ZWdvcnk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1DYXRlZ29yeS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBMb2dnZXJPcHRpb25zXzEgPSByZXF1aXJlKFwiLi4vTG9nZ2VyT3B0aW9uc1wiKTtcbi8qKlxuICogRGVmYXVsdCBjb25maWd1cmF0aW9uLCBjYW4gYmUgdXNlZCB0byBpbml0aWFsbHkgc2V0IGEgZGlmZmVyZW50IGRlZmF1bHQgY29uZmlndXJhdGlvblxuICogb24gdGhlIENhdGVnb3J5U2VydmljZUZhY3RvcnkuIFRoaXMgd2lsbCBiZSBhcHBsaWVkIHRvIGFsbCBjYXRlZ29yaWVzIGFscmVhZHkgcmVnaXN0ZXJlZCAob3JcbiAqIHJlZ2lzdGVyZWQgaW4gdGhlIGZ1dHVyZSkuIENhbiBhbHNvIGJlIGFwcGxpZWQgdG8gb25lIENhdGVnb3J5IChhbmQgY2hpbGRzKS5cbiAqL1xudmFyIENhdGVnb3J5Q29uZmlndXJhdGlvbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IGluc3RhbmNlXG4gICAgICogQHBhcmFtIGxvZ0xldmVsIExvZyBsZXZlbCBmb3IgYWxsIGxvZ2dlcnMsIGRlZmF1bHQgaXMgTG9nTGV2ZWwuRXJyb3JcbiAgICAgKiBAcGFyYW0gbG9nZ2VyVHlwZSBXaGVyZSB0byBsb2csIGRlZmF1bHQgaXMgTG9nZ2VyVHlwZS5Db25zb2xlXG4gICAgICogQHBhcmFtIGxvZ0Zvcm1hdCBXaGF0IGxvZ2dpbmcgZm9ybWF0IHRvIHVzZSwgdXNlIGRlZmF1bHQgaW5zdGFuY2UsIGZvciBkZWZhdWx0IHZhbHVlcyBzZWUgQ2F0ZWdvcnlMb2dGb3JtYXQuXG4gICAgICogQHBhcmFtIGNhbGxCYWNrTG9nZ2VyIE9wdGlvbmFsIGNhbGxiYWNrLCBpZiBMb2dnZXJUeXBlLkN1c3RvbSBpcyB1c2VkIGFzIGxvZ2dlclR5cGUuIEluIHRoYXQgY2FzZSBtdXN0IHJldHVybiBhIG5ldyBMb2dnZXIgaW5zdGFuY2UuXG4gICAgICogICAgICAgICAgICBJdCBpcyByZWNvbW1lbmRlZCB0byBleHRlbmQgQWJzdHJhY3RDYXRlZ29yeUxvZ2dlciB0byBtYWtlIHlvdXIgY3VzdG9tIGxvZ2dlci5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBDYXRlZ29yeUNvbmZpZ3VyYXRpb24obG9nTGV2ZWwsIGxvZ2dlclR5cGUsIGxvZ0Zvcm1hdCwgY2FsbEJhY2tMb2dnZXIpIHtcbiAgICAgICAgaWYgKGxvZ0xldmVsID09PSB2b2lkIDApIHsgbG9nTGV2ZWwgPSBMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuRXJyb3I7IH1cbiAgICAgICAgaWYgKGxvZ2dlclR5cGUgPT09IHZvaWQgMCkgeyBsb2dnZXJUeXBlID0gTG9nZ2VyT3B0aW9uc18xLkxvZ2dlclR5cGUuQ29uc29sZTsgfVxuICAgICAgICBpZiAobG9nRm9ybWF0ID09PSB2b2lkIDApIHsgbG9nRm9ybWF0ID0gbmV3IExvZ2dlck9wdGlvbnNfMS5DYXRlZ29yeUxvZ0Zvcm1hdCgpOyB9XG4gICAgICAgIGlmIChjYWxsQmFja0xvZ2dlciA9PT0gdm9pZCAwKSB7IGNhbGxCYWNrTG9nZ2VyID0gbnVsbDsgfVxuICAgICAgICB0aGlzLl9mb3JtYXR0ZXJMb2dNZXNzYWdlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbG9nTGV2ZWwgPSBsb2dMZXZlbDtcbiAgICAgICAgdGhpcy5fbG9nZ2VyVHlwZSA9IGxvZ2dlclR5cGU7XG4gICAgICAgIHRoaXMuX2xvZ0Zvcm1hdCA9IGxvZ0Zvcm1hdDtcbiAgICAgICAgdGhpcy5fY2FsbEJhY2tMb2dnZXIgPSBjYWxsQmFja0xvZ2dlcjtcbiAgICAgICAgaWYgKHRoaXMuX2xvZ2dlclR5cGUgPT09IExvZ2dlck9wdGlvbnNfMS5Mb2dnZXJUeXBlLkN1c3RvbSAmJiB0aGlzLmNhbGxCYWNrTG9nZ2VyID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJZiB5b3Ugc3BlY2lmeSBsb2dnZXJUeXBlIHRvIGJlIEN1c3RvbSwgeW91IG11c3QgcHJvdmlkZSB0aGUgY2FsbEJhY2tMb2dnZXIgYXJndW1lbnRcIik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENhdGVnb3J5Q29uZmlndXJhdGlvbi5wcm90b3R5cGUsIFwibG9nTGV2ZWxcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9sb2dMZXZlbDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENhdGVnb3J5Q29uZmlndXJhdGlvbi5wcm90b3R5cGUsIFwibG9nZ2VyVHlwZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xvZ2dlclR5cGU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDYXRlZ29yeUNvbmZpZ3VyYXRpb24ucHJvdG90eXBlLCBcImxvZ0Zvcm1hdFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xvZ0Zvcm1hdDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENhdGVnb3J5Q29uZmlndXJhdGlvbi5wcm90b3R5cGUsIFwiY2FsbEJhY2tMb2dnZXJcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jYWxsQmFja0xvZ2dlcjtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENhdGVnb3J5Q29uZmlndXJhdGlvbi5wcm90b3R5cGUsIFwiZm9ybWF0dGVyTG9nTWVzc2FnZVwiLCB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIGZvcm1hdHRlckxvZ01lc3NhZ2UgZnVuY3Rpb24sIHNlZSBjb21tZW50IG9uIHRoZSBzZXR0ZXIuXG4gICAgICAgICAqIEByZXR1cm5zIHsoKG1lc3NhZ2U6Q2F0ZWdvcnlMb2dNZXNzYWdlKT0+c3RyaW5nKXxudWxsfVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZm9ybWF0dGVyTG9nTWVzc2FnZTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCB0aGUgZGVmYXVsdCBmb3JtYXR0ZXJMb2dNZXNzYWdlIGZ1bmN0aW9uLCBpZiBzZXQgaXQgaXMgYXBwbGllZCB0byBhbGwgdHlwZSBvZiBsb2dnZXJzIGV4Y2VwdCBmb3IgYSBjdXN0b20gbG9nZ2VyLlxuICAgICAgICAgKiBCeSBkZWZhdWx0IHRoaXMgaXMgbnVsbCAobm90IHNldCkuIFlvdSBjYW4gYXNzaWduIGEgZnVuY3Rpb24gdG8gYWxsb3cgY3VzdG9tIGZvcm1hdHRpbmcgb2YgYSBsb2cgbWVzc2FnZS5cbiAgICAgICAgICogRWFjaCBsb2cgbWVzc2FnZSB3aWxsIGNhbGwgdGhpcyBmdW5jdGlvbiB0aGVuIGFuZCBleHBlY3RzIHlvdXIgZnVuY3Rpb24gdG8gZm9ybWF0IHRoZSBtZXNzYWdlIGFuZCByZXR1cm4gYSBzdHJpbmcuXG4gICAgICAgICAqIFdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgeW91IGF0dGVtcHQgdG8gc2V0IGEgZm9ybWF0dGVyTG9nTWVzc2FnZSBpZiB0aGUgTG9nZ2VyVHlwZSBpcyBjdXN0b20uXG4gICAgICAgICAqIEBwYXJhbSB2YWx1ZSBUaGUgZm9ybWF0dGVyIGZ1bmN0aW9uLCBvciBudWxsIHRvIHJlc2V0IGl0LlxuICAgICAgICAgKi9cbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB0aGlzLl9sb2dnZXJUeXBlID09PSBMb2dnZXJPcHRpb25zXzEuTG9nZ2VyVHlwZS5DdXN0b20pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJZb3UgY2Fubm90IHNwZWNpZnkgYSBmb3JtYXR0ZXIgZm9yIGxvZyBtZXNzYWdlcyBpZiB5b3VyIGxvZ2dlclR5cGUgaXMgQ3VzdG9tXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZm9ybWF0dGVyTG9nTWVzc2FnZSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBDYXRlZ29yeUNvbmZpZ3VyYXRpb24ucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb25maWcgPSBuZXcgQ2F0ZWdvcnlDb25maWd1cmF0aW9uKHRoaXMubG9nTGV2ZWwsIHRoaXMubG9nZ2VyVHlwZSwgdGhpcy5sb2dGb3JtYXQuY29weSgpLCB0aGlzLmNhbGxCYWNrTG9nZ2VyKTtcbiAgICAgICAgY29uZmlnLmZvcm1hdHRlckxvZ01lc3NhZ2UgPSB0aGlzLmZvcm1hdHRlckxvZ01lc3NhZ2U7XG4gICAgICAgIHJldHVybiBjb25maWc7XG4gICAgfTtcbiAgICByZXR1cm4gQ2F0ZWdvcnlDb25maWd1cmF0aW9uO1xufSgpKTtcbmV4cG9ydHMuQ2F0ZWdvcnlDb25maWd1cmF0aW9uID0gQ2F0ZWdvcnlDb25maWd1cmF0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Q2F0ZWdvcnlDb25maWd1cmF0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgTG9nZ2VyT3B0aW9uc18xID0gcmVxdWlyZShcIi4uL0xvZ2dlck9wdGlvbnNcIik7XG52YXIgQWJzdHJhY3RDYXRlZ29yeUxvZ2dlcl8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RDYXRlZ29yeUxvZ2dlclwiKTtcbi8qKlxuICogU2ltcGxlIGxvZ2dlciwgdGhhdCBsb2dzIHRvIHRoZSBjb25zb2xlLiBJZiB0aGUgY29uc29sZSBpcyB1bmF2YWlsYWJsZSB3aWxsIHRocm93IGFuIGV4Y2VwdGlvbi5cbiAqL1xudmFyIENhdGVnb3J5Q29uc29sZUxvZ2dlckltcGwgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhDYXRlZ29yeUNvbnNvbGVMb2dnZXJJbXBsLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIENhdGVnb3J5Q29uc29sZUxvZ2dlckltcGwocm9vdENhdGVnb3J5LCBydW50aW1lU2V0dGluZ3MpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlci5jYWxsKHRoaXMsIHJvb3RDYXRlZ29yeSwgcnVudGltZVNldHRpbmdzKSB8fCB0aGlzO1xuICAgIH1cbiAgICBDYXRlZ29yeUNvbnNvbGVMb2dnZXJJbXBsLnByb3RvdHlwZS5kb0xvZyA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICAgICAgaWYgKGNvbnNvbGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdmFyIG1lc3NhZ2VGb3JtYXR0ZXIgPSB0aGlzLl9nZXRNZXNzYWdlRm9ybWF0dGVyKCk7XG4gICAgICAgICAgICB2YXIgZnVsbE1zZyA9IHZvaWQgMDtcbiAgICAgICAgICAgIGlmIChtZXNzYWdlRm9ybWF0dGVyID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZnVsbE1zZyA9IHRoaXMuY3JlYXRlRGVmYXVsdExvZ01lc3NhZ2UobXNnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZ1bGxNc2cgPSBtZXNzYWdlRm9ybWF0dGVyKG1zZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbG9nZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1jb25zb2xlICovXG4gICAgICAgICAgICBzd2l0Y2ggKG1zZy5sZXZlbCkge1xuICAgICAgICAgICAgICAgIGNhc2UgTG9nZ2VyT3B0aW9uc18xLkxvZ0xldmVsLlRyYWNlOlxuICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCB0cnkgdHJhY2Ugd2UgZG9uJ3Qgd2FudCBzdGFja3NcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuRGVidWc6XG4gICAgICAgICAgICAgICAgICAgIC8vIERvbid0IHRyeSwgdG9vIG11Y2ggZGlmZmVyZW5jZXMgb2YgY29uc29sZXMuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgTG9nZ2VyT3B0aW9uc18xLkxvZ0xldmVsLkluZm86XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25zb2xlLmluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhmdWxsTXNnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuV2FybjpcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnNvbGUud2Fybikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGZ1bGxNc2cpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIExvZ2dlck9wdGlvbnNfMS5Mb2dMZXZlbC5FcnJvcjpcbiAgICAgICAgICAgICAgICBjYXNlIExvZ2dlck9wdGlvbnNfMS5Mb2dMZXZlbC5GYXRhbDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnNvbGUuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZnVsbE1zZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuc3VwcG9ydGVkIGxldmVsOiBcIiArIG1zZy5sZXZlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWxvZ2dlZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGZ1bGxNc2cpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLyogdHNsaW50OmVuYWJsZTpuby1jb25zb2xlICovXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb25zb2xlIGlzIG5vdCBkZWZpbmVkLCBjYW5ub3QgbG9nIG1zZzogXCIgKyBtc2cubWVzc2FnZUFzU3RyaW5nKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIENhdGVnb3J5Q29uc29sZUxvZ2dlckltcGw7XG59KEFic3RyYWN0Q2F0ZWdvcnlMb2dnZXJfMS5BYnN0cmFjdENhdGVnb3J5TG9nZ2VyKSk7XG5leHBvcnRzLkNhdGVnb3J5Q29uc29sZUxvZ2dlckltcGwgPSBDYXRlZ29yeUNvbnNvbGVMb2dnZXJJbXBsO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Q2F0ZWdvcnlDb25zb2xlTG9nZ2VySW1wbC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogRGVsZWdhdGUgbG9nZ2VyLCBkZWxlZ2F0ZXMgbG9nZ2luZyB0byBnaXZlbiBsb2dnZXIgKGNvbnN0cnVjdG9yKS5cbiAqL1xudmFyIENhdGVnb3J5RGVsZWdhdGVMb2dnZXJJbXBsID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDYXRlZ29yeURlbGVnYXRlTG9nZ2VySW1wbChkZWxlZ2F0ZSkge1xuICAgICAgICB0aGlzLl9kZWxlZ2F0ZSA9IGRlbGVnYXRlO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ2F0ZWdvcnlEZWxlZ2F0ZUxvZ2dlckltcGwucHJvdG90eXBlLCBcImRlbGVnYXRlXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZGVsZWdhdGU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9kZWxlZ2F0ZSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBDYXRlZ29yeURlbGVnYXRlTG9nZ2VySW1wbC5wcm90b3R5cGUudHJhY2UgPSBmdW5jdGlvbiAobXNnKSB7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBjYXRlZ29yaWVzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIChfYSA9IHRoaXMuX2RlbGVnYXRlKS50cmFjZS5hcHBseShfYSwgW21zZ10uY29uY2F0KGNhdGVnb3JpZXMpKTtcbiAgICAgICAgdmFyIF9hO1xuICAgIH07XG4gICAgQ2F0ZWdvcnlEZWxlZ2F0ZUxvZ2dlckltcGwucHJvdG90eXBlLmRlYnVnID0gZnVuY3Rpb24gKG1zZykge1xuICAgICAgICB2YXIgY2F0ZWdvcmllcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgY2F0ZWdvcmllc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICAoX2EgPSB0aGlzLl9kZWxlZ2F0ZSkuZGVidWcuYXBwbHkoX2EsIFttc2ddLmNvbmNhdChjYXRlZ29yaWVzKSk7XG4gICAgICAgIHZhciBfYTtcbiAgICB9O1xuICAgIENhdGVnb3J5RGVsZWdhdGVMb2dnZXJJbXBsLnByb3RvdHlwZS5pbmZvID0gZnVuY3Rpb24gKG1zZykge1xuICAgICAgICB2YXIgY2F0ZWdvcmllcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgY2F0ZWdvcmllc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICAoX2EgPSB0aGlzLl9kZWxlZ2F0ZSkuaW5mby5hcHBseShfYSwgW21zZ10uY29uY2F0KGNhdGVnb3JpZXMpKTtcbiAgICAgICAgdmFyIF9hO1xuICAgIH07XG4gICAgQ2F0ZWdvcnlEZWxlZ2F0ZUxvZ2dlckltcGwucHJvdG90eXBlLndhcm4gPSBmdW5jdGlvbiAobXNnKSB7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBjYXRlZ29yaWVzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIChfYSA9IHRoaXMuX2RlbGVnYXRlKS53YXJuLmFwcGx5KF9hLCBbbXNnXS5jb25jYXQoY2F0ZWdvcmllcykpO1xuICAgICAgICB2YXIgX2E7XG4gICAgfTtcbiAgICBDYXRlZ29yeURlbGVnYXRlTG9nZ2VySW1wbC5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAobXNnLCBlcnJvcikge1xuICAgICAgICB2YXIgY2F0ZWdvcmllcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDI7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgY2F0ZWdvcmllc1tfaSAtIDJdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICAoX2EgPSB0aGlzLl9kZWxlZ2F0ZSkuZXJyb3IuYXBwbHkoX2EsIFttc2csIGVycm9yXS5jb25jYXQoY2F0ZWdvcmllcykpO1xuICAgICAgICB2YXIgX2E7XG4gICAgfTtcbiAgICBDYXRlZ29yeURlbGVnYXRlTG9nZ2VySW1wbC5wcm90b3R5cGUuZmF0YWwgPSBmdW5jdGlvbiAobXNnLCBlcnJvcikge1xuICAgICAgICB2YXIgY2F0ZWdvcmllcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDI7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgY2F0ZWdvcmllc1tfaSAtIDJdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICAoX2EgPSB0aGlzLl9kZWxlZ2F0ZSkuZmF0YWwuYXBwbHkoX2EsIFttc2csIGVycm9yXS5jb25jYXQoY2F0ZWdvcmllcykpO1xuICAgICAgICB2YXIgX2E7XG4gICAgfTtcbiAgICBDYXRlZ29yeURlbGVnYXRlTG9nZ2VySW1wbC5wcm90b3R5cGUucmVzb2x2ZWQgPSBmdW5jdGlvbiAobXNnLCBlcnJvcikge1xuICAgICAgICB2YXIgY2F0ZWdvcmllcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDI7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgY2F0ZWdvcmllc1tfaSAtIDJdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICAoX2EgPSB0aGlzLl9kZWxlZ2F0ZSkucmVzb2x2ZWQuYXBwbHkoX2EsIFttc2csIGVycm9yXS5jb25jYXQoY2F0ZWdvcmllcykpO1xuICAgICAgICB2YXIgX2E7XG4gICAgfTtcbiAgICBDYXRlZ29yeURlbGVnYXRlTG9nZ2VySW1wbC5wcm90b3R5cGUubG9nID0gZnVuY3Rpb24gKGxldmVsLCBtc2csIGVycm9yKSB7XG4gICAgICAgIHZhciBjYXRlZ29yaWVzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMzsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBjYXRlZ29yaWVzW19pIC0gM10gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIChfYSA9IHRoaXMuX2RlbGVnYXRlKS5sb2cuYXBwbHkoX2EsIFtsZXZlbCwgbXNnLCBlcnJvcl0uY29uY2F0KGNhdGVnb3JpZXMpKTtcbiAgICAgICAgdmFyIF9hO1xuICAgIH07XG4gICAgcmV0dXJuIENhdGVnb3J5RGVsZWdhdGVMb2dnZXJJbXBsO1xufSgpKTtcbmV4cG9ydHMuQ2F0ZWdvcnlEZWxlZ2F0ZUxvZ2dlckltcGwgPSBDYXRlZ29yeURlbGVnYXRlTG9nZ2VySW1wbDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUNhdGVnb3J5RGVsZWdhdGVMb2dnZXJJbXBsLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgRXh0ZW5zaW9uSGVscGVyXzEgPSByZXF1aXJlKFwiLi4vLi4vZXh0ZW5zaW9uL0V4dGVuc2lvbkhlbHBlclwiKTtcbnZhciBBYnN0cmFjdENhdGVnb3J5TG9nZ2VyXzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdENhdGVnb3J5TG9nZ2VyXCIpO1xuLyoqXG4gKiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgdXNlZCBkaXJlY3RseSwgaXQgaXMgdXNlZCBmb3IgY29tbXVuaWNhdGlvbiB3aXRoIHRoZSBleHRlbnNpb24gb25seS5cbiAqL1xudmFyIENhdGVnb3J5RXh0ZW5zaW9uTG9nZ2VySW1wbCA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKENhdGVnb3J5RXh0ZW5zaW9uTG9nZ2VySW1wbCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBDYXRlZ29yeUV4dGVuc2lvbkxvZ2dlckltcGwocm9vdENhdGVnb3J5LCBydW50aW1lU2V0dGluZ3MpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlci5jYWxsKHRoaXMsIHJvb3RDYXRlZ29yeSwgcnVudGltZVNldHRpbmdzKSB8fCB0aGlzO1xuICAgIH1cbiAgICBDYXRlZ29yeUV4dGVuc2lvbkxvZ2dlckltcGwucHJvdG90eXBlLmRvTG9nID0gZnVuY3Rpb24gKG1zZykge1xuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgRXh0ZW5zaW9uSGVscGVyXzEuRXh0ZW5zaW9uSGVscGVyLnNlbmRDYXRlZ29yeUxvZ01lc3NhZ2UobXNnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLWNvbnNvbGUgKi9cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwid2luZG93IGlzIG5vdCBhdmFpbGFibGUsIHlvdSBtdXN0IGJlIHJ1bm5pbmcgaW4gYSBicm93c2VyIGZvciB0aGlzLiBEcm9wcGVkIG1lc3NhZ2UuXCIpO1xuICAgICAgICAgICAgLyogdHNsaW50OmVuYWJsZTpuby1jb25zb2xlICovXG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBDYXRlZ29yeUV4dGVuc2lvbkxvZ2dlckltcGw7XG59KEFic3RyYWN0Q2F0ZWdvcnlMb2dnZXJfMS5BYnN0cmFjdENhdGVnb3J5TG9nZ2VyKSk7XG5leHBvcnRzLkNhdGVnb3J5RXh0ZW5zaW9uTG9nZ2VySW1wbCA9IENhdGVnb3J5RXh0ZW5zaW9uTG9nZ2VySW1wbDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUNhdGVnb3J5RXh0ZW5zaW9uTG9nZ2VySW1wbC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIEFic3RyYWN0Q2F0ZWdvcnlMb2dnZXJfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q2F0ZWdvcnlMb2dnZXJcIik7XG4vKipcbiAqIExvZ2dlciB3aGljaCBidWZmZXJzIGFsbCBtZXNzYWdlcywgdXNlIHdpdGggY2FyZSBkdWUgdG8gcG9zc2libGUgaGlnaCBtZW1vcnkgZm9vdHByaW50LlxuICogQ2FuIGJlIGNvbnZlbmllbnQgaW4gc29tZSBjYXNlcy4gQ2FsbCB0b1N0cmluZygpIGZvciBmdWxsIG91dHB1dCwgb3IgY2FzdCB0byB0aGlzIGNsYXNzXG4gKiBhbmQgY2FsbCBnZXRNZXNzYWdlcygpIHRvIGRvIHNvbWV0aGluZyB3aXRoIGl0IHlvdXJzZWxmLlxuICovXG52YXIgQ2F0ZWdvcnlNZXNzYWdlQnVmZmVyTG9nZ2VySW1wbCA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKENhdGVnb3J5TWVzc2FnZUJ1ZmZlckxvZ2dlckltcGwsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gQ2F0ZWdvcnlNZXNzYWdlQnVmZmVyTG9nZ2VySW1wbCgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyICE9PSBudWxsICYmIF9zdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLm1lc3NhZ2VzID0gW107XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgQ2F0ZWdvcnlNZXNzYWdlQnVmZmVyTG9nZ2VySW1wbC5wcm90b3R5cGUuZ2V0TWVzc2FnZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2VzO1xuICAgIH07XG4gICAgQ2F0ZWdvcnlNZXNzYWdlQnVmZmVyTG9nZ2VySW1wbC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2VzLm1hcChmdW5jdGlvbiAobXNnKSB7XG4gICAgICAgICAgICByZXR1cm4gbXNnO1xuICAgICAgICB9KS5qb2luKFwiXFxuXCIpO1xuICAgIH07XG4gICAgQ2F0ZWdvcnlNZXNzYWdlQnVmZmVyTG9nZ2VySW1wbC5wcm90b3R5cGUuZG9Mb2cgPSBmdW5jdGlvbiAobXNnKSB7XG4gICAgICAgIHZhciBtZXNzYWdlRm9ybWF0dGVyID0gdGhpcy5fZ2V0TWVzc2FnZUZvcm1hdHRlcigpO1xuICAgICAgICB2YXIgZnVsbE1zZztcbiAgICAgICAgaWYgKG1lc3NhZ2VGb3JtYXR0ZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGZ1bGxNc2cgPSB0aGlzLmNyZWF0ZURlZmF1bHRMb2dNZXNzYWdlKG1zZyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmdWxsTXNnID0gbWVzc2FnZUZvcm1hdHRlcihtc2cpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubWVzc2FnZXMucHVzaChmdWxsTXNnKTtcbiAgICB9O1xuICAgIHJldHVybiBDYXRlZ29yeU1lc3NhZ2VCdWZmZXJMb2dnZXJJbXBsO1xufShBYnN0cmFjdENhdGVnb3J5TG9nZ2VyXzEuQWJzdHJhY3RDYXRlZ29yeUxvZ2dlcikpO1xuZXhwb3J0cy5DYXRlZ29yeU1lc3NhZ2VCdWZmZXJMb2dnZXJJbXBsID0gQ2F0ZWdvcnlNZXNzYWdlQnVmZmVyTG9nZ2VySW1wbDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUNhdGVnb3J5TWVzc2FnZUJ1ZmZlckltcGwuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgTG9nZ2VyT3B0aW9uc18xID0gcmVxdWlyZShcIi4uL0xvZ2dlck9wdGlvbnNcIik7XG4vKipcbiAqIFJ1bnRpbWVTZXR0aW5ncyBmb3IgYSBjYXRlZ29yeSwgYXQgcnVudGltZSB0aGVzZSBhcmUgYXNzb2NpYXRlZCB0byBhIGNhdGVnb3J5LlxuICovXG52YXIgQ2F0ZWdvcnlSdW50aW1lU2V0dGluZ3MgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENhdGVnb3J5UnVudGltZVNldHRpbmdzKGNhdGVnb3J5LCBsb2dMZXZlbCwgbG9nZ2VyVHlwZSwgbG9nRm9ybWF0LCBjYWxsQmFja0xvZ2dlciwgZm9ybWF0dGVyTG9nTWVzc2FnZSkge1xuICAgICAgICBpZiAobG9nTGV2ZWwgPT09IHZvaWQgMCkgeyBsb2dMZXZlbCA9IExvZ2dlck9wdGlvbnNfMS5Mb2dMZXZlbC5FcnJvcjsgfVxuICAgICAgICBpZiAobG9nZ2VyVHlwZSA9PT0gdm9pZCAwKSB7IGxvZ2dlclR5cGUgPSBMb2dnZXJPcHRpb25zXzEuTG9nZ2VyVHlwZS5Db25zb2xlOyB9XG4gICAgICAgIGlmIChsb2dGb3JtYXQgPT09IHZvaWQgMCkgeyBsb2dGb3JtYXQgPSBuZXcgTG9nZ2VyT3B0aW9uc18xLkNhdGVnb3J5TG9nRm9ybWF0KCk7IH1cbiAgICAgICAgaWYgKGNhbGxCYWNrTG9nZ2VyID09PSB2b2lkIDApIHsgY2FsbEJhY2tMb2dnZXIgPSBudWxsOyB9XG4gICAgICAgIGlmIChmb3JtYXR0ZXJMb2dNZXNzYWdlID09PSB2b2lkIDApIHsgZm9ybWF0dGVyTG9nTWVzc2FnZSA9IG51bGw7IH1cbiAgICAgICAgdGhpcy5fZm9ybWF0dGVyTG9nTWVzc2FnZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2NhdGVnb3J5ID0gY2F0ZWdvcnk7XG4gICAgICAgIHRoaXMuX2xvZ0xldmVsID0gbG9nTGV2ZWw7XG4gICAgICAgIHRoaXMuX2xvZ2dlclR5cGUgPSBsb2dnZXJUeXBlO1xuICAgICAgICB0aGlzLl9sb2dGb3JtYXQgPSBsb2dGb3JtYXQ7XG4gICAgICAgIHRoaXMuX2NhbGxCYWNrTG9nZ2VyID0gY2FsbEJhY2tMb2dnZXI7XG4gICAgICAgIHRoaXMuX2Zvcm1hdHRlckxvZ01lc3NhZ2UgPSBmb3JtYXR0ZXJMb2dNZXNzYWdlO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ2F0ZWdvcnlSdW50aW1lU2V0dGluZ3MucHJvdG90eXBlLCBcImNhdGVnb3J5XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY2F0ZWdvcnk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDYXRlZ29yeVJ1bnRpbWVTZXR0aW5ncy5wcm90b3R5cGUsIFwibG9nTGV2ZWxcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9sb2dMZXZlbDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX2xvZ0xldmVsID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDYXRlZ29yeVJ1bnRpbWVTZXR0aW5ncy5wcm90b3R5cGUsIFwibG9nZ2VyVHlwZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xvZ2dlclR5cGU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9sb2dnZXJUeXBlID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDYXRlZ29yeVJ1bnRpbWVTZXR0aW5ncy5wcm90b3R5cGUsIFwibG9nRm9ybWF0XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbG9nRm9ybWF0O1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fbG9nRm9ybWF0ID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDYXRlZ29yeVJ1bnRpbWVTZXR0aW5ncy5wcm90b3R5cGUsIFwiY2FsbEJhY2tMb2dnZXJcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jYWxsQmFja0xvZ2dlcjtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX2NhbGxCYWNrTG9nZ2VyID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDYXRlZ29yeVJ1bnRpbWVTZXR0aW5ncy5wcm90b3R5cGUsIFwiZm9ybWF0dGVyTG9nTWVzc2FnZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Zvcm1hdHRlckxvZ01lc3NhZ2U7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9mb3JtYXR0ZXJMb2dNZXNzYWdlID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIHJldHVybiBDYXRlZ29yeVJ1bnRpbWVTZXR0aW5ncztcbn0oKSk7XG5leHBvcnRzLkNhdGVnb3J5UnVudGltZVNldHRpbmdzID0gQ2F0ZWdvcnlSdW50aW1lU2V0dGluZ3M7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1DYXRlZ29yeVJ1bnRpbWVTZXR0aW5ncy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBEYXRhU3RydWN0dXJlc18xID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL0RhdGFTdHJ1Y3R1cmVzXCIpO1xudmFyIExvZ2dlck9wdGlvbnNfMSA9IHJlcXVpcmUoXCIuLi9Mb2dnZXJPcHRpb25zXCIpO1xudmFyIENhdGVnb3J5Q29uc29sZUxvZ2dlckltcGxfMSA9IHJlcXVpcmUoXCIuL0NhdGVnb3J5Q29uc29sZUxvZ2dlckltcGxcIik7XG52YXIgQ2F0ZWdvcnlEZWxlZ2F0ZUxvZ2dlckltcGxfMSA9IHJlcXVpcmUoXCIuL0NhdGVnb3J5RGVsZWdhdGVMb2dnZXJJbXBsXCIpO1xudmFyIENhdGVnb3J5RXh0ZW5zaW9uTG9nZ2VySW1wbF8xID0gcmVxdWlyZShcIi4vQ2F0ZWdvcnlFeHRlbnNpb25Mb2dnZXJJbXBsXCIpO1xudmFyIENhdGVnb3J5TWVzc2FnZUJ1ZmZlckltcGxfMSA9IHJlcXVpcmUoXCIuL0NhdGVnb3J5TWVzc2FnZUJ1ZmZlckltcGxcIik7XG52YXIgRXh0ZW5zaW9uSGVscGVyXzEgPSByZXF1aXJlKFwiLi4vLi4vZXh0ZW5zaW9uL0V4dGVuc2lvbkhlbHBlclwiKTtcbnZhciBDYXRlZ29yeVJ1bnRpbWVTZXR0aW5nc18xID0gcmVxdWlyZShcIi4vQ2F0ZWdvcnlSdW50aW1lU2V0dGluZ3NcIik7XG52YXIgQ2F0ZWdvcnlDb25maWd1cmF0aW9uXzEgPSByZXF1aXJlKFwiLi9DYXRlZ29yeUNvbmZpZ3VyYXRpb25cIik7XG4vKipcbiAqIFRoZSBzZXJ2aWNlIChvbmx5IGF2YWlsYWJsZSBhcyBzaW5nbGV0b24pIGZvciBhbGwgY2F0ZWdvcnkgcmVsYXRlZCBzdHVmZiBhc1xuICogcmV0cmlldmluZywgcmVnaXN0ZXJpbmcgYSBsb2dnZXIuIFlvdSBzaG91bGQgbm9ybWFsbHkgTk9UIHVzZSB0aGlzLFxuICogaW5zdGVhZCB1c2UgQ2F0ZWdvcnlTZXJ2aWNlRmFjdG9yeSB3aGljaCBpcyBtZWFudCBmb3IgZW5kIHVzZXJzLlxuICovXG52YXIgQ2F0ZWdvcnlTZXJ2aWNlSW1wbCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ2F0ZWdvcnlTZXJ2aWNlSW1wbCgpIHtcbiAgICAgICAgdGhpcy5fZGVmYXVsdENvbmZpZyA9IG5ldyBDYXRlZ29yeUNvbmZpZ3VyYXRpb25fMS5DYXRlZ29yeUNvbmZpZ3VyYXRpb24oKTtcbiAgICAgICAgdGhpcy5fbWFwU3RhdGUgPSBuZXcgRGF0YVN0cnVjdHVyZXNfMS5TaW1wbGVNYXAoKTtcbiAgICAgICAgLy8gUHJpdmF0ZSBjb25zdHJ1Y3RvclxuICAgICAgICBFeHRlbnNpb25IZWxwZXJfMS5FeHRlbnNpb25IZWxwZXIucmVnaXN0ZXIoKTtcbiAgICB9XG4gICAgQ2F0ZWdvcnlTZXJ2aWNlSW1wbC5nZXRJbnN0YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gTG9hZCBvbi1kZW1hbmQsIHRvIGFzc3VyZSB3ZWJwYWNrIG9yZGVyaW5nIG9mIG1vZHVsZSB1c2FnZSBkb2Vzbid0IHNjcmV3IHRoaW5ncyBvdmVyXG4gICAgICAgIC8vIGZvciB1cyB3aGVuIHdlIGFjY2lkZW50YWxseSBjaGFuZ2UgdGhlIG9yZGVyLlxuICAgICAgICBpZiAoQ2F0ZWdvcnlTZXJ2aWNlSW1wbC5fSU5TVEFOQ0UgPT09IG51bGwpIHtcbiAgICAgICAgICAgIENhdGVnb3J5U2VydmljZUltcGwuX0lOU1RBTkNFID0gbmV3IENhdGVnb3J5U2VydmljZUltcGwoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gQ2F0ZWdvcnlTZXJ2aWNlSW1wbC5fSU5TVEFOQ0U7XG4gICAgfTtcbiAgICBDYXRlZ29yeVNlcnZpY2VJbXBsLnByb3RvdHlwZS5nZXRMb2dnZXIgPSBmdW5jdGlvbiAoY2F0ZWdvcnkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlT3JHZXRDYXRlZ29yeVN0YXRlKGNhdGVnb3J5KS5sb2dnZXI7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDbGVhcnMgZXZlcnl0aGluZywgaW5jbHVkaW5nIGEgZGVmYXVsdCBjb25maWd1cmF0aW9uIHlvdSBtYXkgaGF2ZSBzZXQuXG4gICAgICogQWZ0ZXIgdGhpcyB5b3UgbmVlZCB0byByZS1yZWdpc3RlciB5b3VyIGNhdGVnb3JpZXMgZXRjLlxuICAgICAqL1xuICAgIENhdGVnb3J5U2VydmljZUltcGwucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9tYXBTdGF0ZS5jbGVhcigpO1xuICAgICAgICB0aGlzLnNldERlZmF1bHRDb25maWd1cmF0aW9uKG5ldyBDYXRlZ29yeUNvbmZpZ3VyYXRpb25fMS5DYXRlZ29yeUNvbmZpZ3VyYXRpb24oKSk7XG4gICAgfTtcbiAgICBDYXRlZ29yeVNlcnZpY2VJbXBsLnByb3RvdHlwZS5nZXRDYXRlZ29yeVNldHRpbmdzID0gZnVuY3Rpb24gKGNhdGVnb3J5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZU9yR2V0Q2F0ZWdvcnlTdGF0ZShjYXRlZ29yeSkuY3VycmVudFJ1bnRpbWVTZXR0aW5ncztcbiAgICB9O1xuICAgIENhdGVnb3J5U2VydmljZUltcGwucHJvdG90eXBlLmdldE9yaWdpbmFsQ2F0ZWdvcnlTZXR0aW5ncyA9IGZ1bmN0aW9uIChjYXRlZ29yeSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVPckdldENhdGVnb3J5U3RhdGUoY2F0ZWdvcnkpLm9yaWdpbmFsUnVudGltZVNldHRpbmdzO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24uIE5ldyByb290IGxvZ2dlcnMgY3JlYXRlZCBnZXQgdGhpc1xuICAgICAqIGFwcGxpZWQuIElmIHlvdSB3YW50IHRvIHJlc2V0IGFsbCBjdXJyZW50IGxvZ2dlcnMgdG8gaGF2ZSB0aGlzXG4gICAgICogYXBwbGllZCBhcyB3ZWxsLCBwYXNzIGluIHJlc2V0PXRydWUgKHRoZSBkZWZhdWx0IGlzIGZhbHNlKS4gQWxsXG4gICAgICogY2F0ZWdvcmllcyB3aWxsIGJlIHJlc2V0IHRoZW4gYXMgd2VsbC5cbiAgICAgKiBAcGFyYW0gY29uZmlnIE5ldyBjb25maWdcbiAgICAgKiBAcGFyYW0gcmVzZXQgRGVmYXVsdHMgdG8gdHJ1ZS4gU2V0IHRvIHRydWUgdG8gcmVzZXQgYWxsIGxvZ2dlcnMgYW5kIGN1cnJlbnQgcnVudGltZXNldHRpbmdzLlxuICAgICAqL1xuICAgIENhdGVnb3J5U2VydmljZUltcGwucHJvdG90eXBlLnNldERlZmF1bHRDb25maWd1cmF0aW9uID0gZnVuY3Rpb24gKGNvbmZpZywgcmVzZXQpIHtcbiAgICAgICAgaWYgKHJlc2V0ID09PSB2b2lkIDApIHsgcmVzZXQgPSB0cnVlOyB9XG4gICAgICAgIHRoaXMuX2RlZmF1bHRDb25maWcgPSBjb25maWc7XG4gICAgICAgIGlmIChyZXNldCkge1xuICAgICAgICAgICAgdGhpcy5fbWFwU3RhdGUuZm9yRWFjaFZhbHVlKGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICAgICAgICAgIHN0YXRlLnVwZGF0ZVNldHRpbmdzKGNvbmZpZyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogU2V0IG5ldyBjb25maWd1cmF0aW9uIHNldHRpbmdzIGZvciBhIGNhdGVnb3J5IChhbmQgcG9zc2libHkgaXRzIGNoaWxkIGNhdGVnb3JpZXMpXG4gICAgICogQHBhcmFtIGNvbmZpZyBDb25maWdcbiAgICAgKiBAcGFyYW0gY2F0ZWdvcnkgQ2F0ZWdvcnlcbiAgICAgKiBAcGFyYW0gYXBwbHlDaGlsZHJlbiBUcnVlIHRvIGFwcGx5IHRvIGNoaWxkIGNhdGVnb3JpZXMsIGRlZmF1bHRzIHRvIGZhbHNlLlxuICAgICAqL1xuICAgIENhdGVnb3J5U2VydmljZUltcGwucHJvdG90eXBlLnNldENvbmZpZ3VyYXRpb25DYXRlZ29yeSA9IGZ1bmN0aW9uIChjb25maWcsIGNhdGVnb3J5LCBhcHBseUNoaWxkcmVuKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChhcHBseUNoaWxkcmVuID09PSB2b2lkIDApIHsgYXBwbHlDaGlsZHJlbiA9IGZhbHNlOyB9XG4gICAgICAgIHRoaXMuY3JlYXRlT3JHZXRDYXRlZ29yeVN0YXRlKGNhdGVnb3J5KS51cGRhdGVTZXR0aW5ncyhjb25maWcpO1xuICAgICAgICAvLyBBcHBseSB0aGUgc2V0dGluZ3MgdG8gY2hpbGRyZW4gcmVjdXJzaXZlIGlmIHJlcXVlc3RlZFxuICAgICAgICBpZiAoYXBwbHlDaGlsZHJlbikge1xuICAgICAgICAgICAgY2F0ZWdvcnkuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAgICAgICAgICAgICAvLyBGYWxzZSBmbGFnLCBhIGNoaWxkIGNhbm5vdCByZXNldCBhIHJvb3Rsb2dnZXJcbiAgICAgICAgICAgICAgICBfdGhpcy5zZXRDb25maWd1cmF0aW9uQ2F0ZWdvcnkoY29uZmlnLCBjaGlsZCwgYXBwbHlDaGlsZHJlbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQ2F0ZWdvcnlTZXJ2aWNlSW1wbC5wcm90b3R5cGUucmVnaXN0ZXJDYXRlZ29yeSA9IGZ1bmN0aW9uIChjYXRlZ29yeSkge1xuICAgICAgICBpZiAoY2F0ZWdvcnkgPT09IG51bGwgfHwgdHlwZW9mIGNhdGVnb3J5ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYXRlZ29yeSBDQU5OT1QgYmUgbnVsbC91bmRlZmluZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX21hcFN0YXRlLmV4aXN0cyhDYXRlZ29yeVNlcnZpY2VJbXBsLmdldENhdGVnb3J5S2V5KGNhdGVnb3J5KSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBhZGQgdGhpcyByb290IGNhdGVnb3J5IHdpdGggbmFtZTogXCIgKyBjYXRlZ29yeS5uYW1lICsgXCIsIGl0IGFscmVhZHkgZXhpc3RzIChzYW1lIG5hbWUgaW4gaGllcmFyY2h5KS5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jcmVhdGVPckdldENhdGVnb3J5U3RhdGUoY2F0ZWdvcnkpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogVXNlZCB0byBlbmFibGUgaW50ZWdyYXRpb24gd2l0aCBjaHJvbWUgZXh0ZW5zaW9uLiBEbyBub3QgdXNlIG1hbnVhbGx5LCB0aGVcbiAgICAgKiBleHRlbnNpb24gYW5kIHRoZSBsb2dnZXIgZnJhbWV3b3JrIGRlYWwgd2l0aCB0aGlzLlxuICAgICAqL1xuICAgIENhdGVnb3J5U2VydmljZUltcGwucHJvdG90eXBlLmVuYWJsZUV4dGVuc2lvbkludGVncmF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLl9tYXBTdGF0ZS5mb3JFYWNoVmFsdWUoZnVuY3Rpb24gKHN0YXRlKSB7IHJldHVybiBzdGF0ZS5lbmFibGVGb3JFeHRlbnNpb24oX3RoaXMpOyB9KTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJldHVybiBhbGwgcm9vdCBjYXRlZ29yaWVzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAqL1xuICAgIENhdGVnb3J5U2VydmljZUltcGwucHJvdG90eXBlLmdldFJvb3RDYXRlZ29yaWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFwU3RhdGUudmFsdWVzKCkuZmlsdGVyKGZ1bmN0aW9uIChzdGF0ZSkgeyByZXR1cm4gc3RhdGUuY2F0ZWdvcnkucGFyZW50ID09IG51bGw7IH0pLm1hcChmdW5jdGlvbiAoc3RhdGUpIHsgcmV0dXJuIHN0YXRlLmNhdGVnb3J5OyB9KTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJldHVybiBDYXRlZ29yeSBieSBpZFxuICAgICAqIEBwYXJhbSBpZCBUaGUgaWQgb2YgdGhlIGNhdGVnb3J5IHRvIGZpbmRcbiAgICAgKiBAcmV0dXJucyB7Q2F0ZWdvcnl9IG9yIG51bGwgaWYgbm90IGZvdW5kXG4gICAgICovXG4gICAgQ2F0ZWdvcnlTZXJ2aWNlSW1wbC5wcm90b3R5cGUuZ2V0Q2F0ZWdvcnlCeUlkID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLl9tYXBTdGF0ZS52YWx1ZXMoKS5maWx0ZXIoZnVuY3Rpb24gKHN0YXRlKSB7IHJldHVybiBzdGF0ZS5jYXRlZ29yeS5pZCA9PT0gaWQ7IH0pLm1hcChmdW5jdGlvbiAoc3RhdGUpIHsgcmV0dXJuIHN0YXRlLmNhdGVnb3J5OyB9KTtcbiAgICAgICAgaWYgKHJlc3VsdC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHRbMF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbiAgICBDYXRlZ29yeVNlcnZpY2VJbXBsLnByb3RvdHlwZS5jcmVhdGVPckdldENhdGVnb3J5U3RhdGUgPSBmdW5jdGlvbiAoY2F0ZWdvcnkpIHtcbiAgICAgICAgdmFyIGtleSA9IENhdGVnb3J5U2VydmljZUltcGwuZ2V0Q2F0ZWdvcnlLZXkoY2F0ZWdvcnkpO1xuICAgICAgICB2YXIgc3RhdGUgPSB0aGlzLl9tYXBTdGF0ZS5nZXQoa2V5KTtcbiAgICAgICAgaWYgKHR5cGVvZiBzdGF0ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuZXdTdGF0ZSA9IHRoaXMuY3JlYXRlU3RhdGUoY2F0ZWdvcnkpO1xuICAgICAgICB0aGlzLl9tYXBTdGF0ZS5wdXQoa2V5LCBuZXdTdGF0ZSk7XG4gICAgICAgIHJldHVybiBuZXdTdGF0ZTtcbiAgICB9O1xuICAgIENhdGVnb3J5U2VydmljZUltcGwucHJvdG90eXBlLmNyZWF0ZVN0YXRlID0gZnVuY3Rpb24gKGNhdGVnb3J5KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHJldHVybiBuZXcgQ2F0ZWdvcnlTdGF0ZShjYXRlZ29yeSwgZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuX2RlZmF1bHRDb25maWc7IH0sIGZ1bmN0aW9uIChjb25maWcsIGNhdCkgeyByZXR1cm4gX3RoaXMuY3JlYXRlTG9nZ2VyKGNvbmZpZywgY2F0KTsgfSk7XG4gICAgfTtcbiAgICBDYXRlZ29yeVNlcnZpY2VJbXBsLnByb3RvdHlwZS5jcmVhdGVMb2dnZXIgPSBmdW5jdGlvbiAoY29uZmlnLCBjYXRlZ29yeSkge1xuICAgICAgICAvLyBEZWZhdWx0IGlzIGFsd2F5cyBhIGNvbnNvbGUgbG9nZ2VyXG4gICAgICAgIHN3aXRjaCAoY29uZmlnLmxvZ2dlclR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgTG9nZ2VyT3B0aW9uc18xLkxvZ2dlclR5cGUuQ29uc29sZTpcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENhdGVnb3J5Q29uc29sZUxvZ2dlckltcGxfMS5DYXRlZ29yeUNvbnNvbGVMb2dnZXJJbXBsKGNhdGVnb3J5LCB0aGlzKTtcbiAgICAgICAgICAgIGNhc2UgTG9nZ2VyT3B0aW9uc18xLkxvZ2dlclR5cGUuTWVzc2FnZUJ1ZmZlcjpcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENhdGVnb3J5TWVzc2FnZUJ1ZmZlckltcGxfMS5DYXRlZ29yeU1lc3NhZ2VCdWZmZXJMb2dnZXJJbXBsKGNhdGVnb3J5LCB0aGlzKTtcbiAgICAgICAgICAgIGNhc2UgTG9nZ2VyT3B0aW9uc18xLkxvZ2dlclR5cGUuQ3VzdG9tOlxuICAgICAgICAgICAgICAgIGlmIChjb25maWcuY2FsbEJhY2tMb2dnZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGNyZWF0ZSBjdXN0b20gbG9nZ2VyLCBjdXN0b20gY2FsbGJhY2sgaXMgbnVsbFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb25maWcuY2FsbEJhY2tMb2dnZXIoY2F0ZWdvcnksIHRoaXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGNyZWF0ZSBhIExvZ2dlciBmb3IgTG9nZ2VyVHlwZTogXCIgKyBjb25maWcubG9nZ2VyVHlwZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIENhdGVnb3J5U2VydmljZUltcGwuZ2V0Q2F0ZWdvcnlLZXkgPSBmdW5jdGlvbiAoY2F0ZWdvcnkpIHtcbiAgICAgICAgcmV0dXJuIGNhdGVnb3J5LmdldENhdGVnb3J5UGF0aCgpO1xuICAgIH07XG4gICAgLy8gU2luZ2xldG9uIGNhdGVnb3J5IHNlcnZpY2UsIHVzZWQgYnkgQ2F0ZWdvcnlTZXJ2aWNlRmFjdG9yeSBhcyB3ZWxsIGFzIENhdGVnb3JpZXMuXG4gICAgLy8gTG9hZGVkIG9uIGRlbWFuZC4gRG8gTk9UIGNoYW5nZSBhcyB3ZWJwYWNrIG1heSBwYWNrIHRoaW5ncyBpbiB3cm9uZyBvcmRlciBvdGhlcndpc2UuXG4gICAgQ2F0ZWdvcnlTZXJ2aWNlSW1wbC5fSU5TVEFOQ0UgPSBudWxsO1xuICAgIHJldHVybiBDYXRlZ29yeVNlcnZpY2VJbXBsO1xufSgpKTtcbmV4cG9ydHMuQ2F0ZWdvcnlTZXJ2aWNlSW1wbCA9IENhdGVnb3J5U2VydmljZUltcGw7XG52YXIgQ2F0ZWdvcnlTdGF0ZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ2F0ZWdvcnlTdGF0ZShjYXRlZ29yeSwgZGVmYXVsdENvbmZpZywgY3JlYXRlTG9nZ2VyKSB7XG4gICAgICAgIHRoaXMuX2NhdGVnb3J5ID0gY2F0ZWdvcnk7XG4gICAgICAgIHRoaXMuX2xhenlTdGF0ZSA9IG5ldyBMYXp5U3RhdGUoY2F0ZWdvcnksIGRlZmF1bHRDb25maWcsIGNyZWF0ZUxvZ2dlcik7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDYXRlZ29yeVN0YXRlLnByb3RvdHlwZSwgXCJjYXRlZ29yeVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhdGVnb3J5O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ2F0ZWdvcnlTdGF0ZS5wcm90b3R5cGUsIFwibG9nZ2VyXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGF6eVN0YXRlLmdldExvZ2dlcigpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ2F0ZWdvcnlTdGF0ZS5wcm90b3R5cGUsIFwib3JpZ2luYWxSdW50aW1lU2V0dGluZ3NcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9sYXp5U3RhdGUuZ2V0T3JpZ2luYWxSdW50aW1lU2V0dGluZ3MoKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENhdGVnb3J5U3RhdGUucHJvdG90eXBlLCBcImN1cnJlbnRSdW50aW1lU2V0dGluZ3NcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9sYXp5U3RhdGUuZ2V0Q3VycmVudFJ1bnRpbWVTZXR0aW5ncygpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBDYXRlZ29yeVN0YXRlLnByb3RvdHlwZS5lbmFibGVGb3JFeHRlbnNpb24gPSBmdW5jdGlvbiAocnVudGltZVNldHRpbmdzKSB7XG4gICAgICAgIHRoaXMuX2xhenlTdGF0ZS5lbmFibGVGb3JFeHRlbnNpb24ocnVudGltZVNldHRpbmdzKTtcbiAgICB9O1xuICAgIENhdGVnb3J5U3RhdGUucHJvdG90eXBlLnVwZGF0ZVNldHRpbmdzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICB0aGlzLl9sYXp5U3RhdGUudXBkYXRlU2V0dGluZ3MoY29uZmlnKTtcbiAgICB9O1xuICAgIHJldHVybiBDYXRlZ29yeVN0YXRlO1xufSgpKTtcbnZhciBMYXp5U3RhdGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExhenlTdGF0ZShjYXRlZ29yeSwgZGVmYXVsdENvbmZpZywgY3JlYXRlTG9nZ2VyKSB7XG4gICAgICAgIHRoaXMuX2NhdGVnb3J5ID0gY2F0ZWdvcnk7XG4gICAgICAgIHRoaXMuX2RlZmF1bHRDb25maWcgPSBkZWZhdWx0Q29uZmlnO1xuICAgICAgICB0aGlzLl9jcmVhdGVMb2dnZXIgPSBjcmVhdGVMb2dnZXI7XG4gICAgfVxuICAgIExhenlTdGF0ZS5wcm90b3R5cGUuaXNMb2FkZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAodHlwZW9mIHRoaXMuX2xvZ2dlciAhPT0gXCJ1bmRlZmluZWRcIik7XG4gICAgfTtcbiAgICBMYXp5U3RhdGUucHJvdG90eXBlLmdldExvZ2dlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5sb2FkTG9nZ2VyT25EZW1hbmQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlbGVnYXRlTG9nZ2VyO1xuICAgIH07XG4gICAgTGF6eVN0YXRlLnByb3RvdHlwZS5nZXRPcmlnaW5hbFJ1bnRpbWVTZXR0aW5ncyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5sb2FkTG9nZ2VyT25EZW1hbmQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX29yaWdpbmFsUnVudGltZVNldHRpbmdzO1xuICAgIH07XG4gICAgTGF6eVN0YXRlLnByb3RvdHlwZS5nZXRDdXJyZW50UnVudGltZVNldHRpbmdzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmxvYWRMb2dnZXJPbkRlbWFuZCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5fY3VycmVudFJ1bnRpbWVTZXR0aW5ncztcbiAgICB9O1xuICAgIExhenlTdGF0ZS5wcm90b3R5cGUuZW5hYmxlRm9yRXh0ZW5zaW9uID0gZnVuY3Rpb24gKHJ1bnRpbWVTZXR0aW5ncykge1xuICAgICAgICB0aGlzLmxvYWRMb2dnZXJPbkRlbWFuZCgpO1xuICAgICAgICBpZiAoISh0aGlzLl93cmFwcGVkTG9nZ2VyIGluc3RhbmNlb2YgQ2F0ZWdvcnlFeHRlbnNpb25Mb2dnZXJJbXBsXzEuQ2F0ZWdvcnlFeHRlbnNpb25Mb2dnZXJJbXBsKSkge1xuICAgICAgICAgICAgLyogdHNsaW50OmRpc2FibGUgbm8tY29uc29sZSAqL1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZWNvbmZpZ3VyaW5nIGxvZ2dlciBmb3IgZXh0ZW5zaW9uIGZvciBjYXRlZ29yeTogXCIgKyB0aGlzLl9jYXRlZ29yeS5uYW1lKTtcbiAgICAgICAgICAgIC8qIHRzbGludDplbmFibGUgbm8tY29uc29sZSAqL1xuICAgICAgICAgICAgdGhpcy5fd3JhcHBlZExvZ2dlciA9IG5ldyBDYXRlZ29yeUV4dGVuc2lvbkxvZ2dlckltcGxfMS5DYXRlZ29yeUV4dGVuc2lvbkxvZ2dlckltcGwodGhpcy5fY2F0ZWdvcnksIHJ1bnRpbWVTZXR0aW5ncyk7XG4gICAgICAgICAgICB0aGlzLl9kZWxlZ2F0ZUxvZ2dlci5kZWxlZ2F0ZSA9IHRoaXMuX3dyYXBwZWRMb2dnZXI7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExhenlTdGF0ZS5wcm90b3R5cGUudXBkYXRlU2V0dGluZ3MgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgIGlmICh0aGlzLmlzTG9hZGVkKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRSdW50aW1lU2V0dGluZ3MubG9nTGV2ZWwgPSBjb25maWcubG9nTGV2ZWw7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50UnVudGltZVNldHRpbmdzLmxvZ2dlclR5cGUgPSBjb25maWcubG9nZ2VyVHlwZTtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRSdW50aW1lU2V0dGluZ3MubG9nRm9ybWF0ID0gY29uZmlnLmxvZ0Zvcm1hdDtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRSdW50aW1lU2V0dGluZ3MuY2FsbEJhY2tMb2dnZXIgPSBjb25maWcuY2FsbEJhY2tMb2dnZXI7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50UnVudGltZVNldHRpbmdzLmZvcm1hdHRlckxvZ01lc3NhZ2UgPSBjb25maWcuZm9ybWF0dGVyTG9nTWVzc2FnZTtcbiAgICAgICAgICAgIC8vIFJlcGxhY2UgdGhlIHJlYWwgbG9nZ2VyLCBpdCBtYXkgaGF2ZSBjaGFuZ2VkLlxuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyID0gdGhpcy5fY3JlYXRlTG9nZ2VyKGNvbmZpZywgdGhpcy5fY2F0ZWdvcnkpO1xuICAgICAgICAgICAgaWYgKCEodGhpcy5fd3JhcHBlZExvZ2dlciBpbnN0YW5jZW9mIENhdGVnb3J5RXh0ZW5zaW9uTG9nZ2VySW1wbF8xLkNhdGVnb3J5RXh0ZW5zaW9uTG9nZ2VySW1wbCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93cmFwcGVkTG9nZ2VyID0gdGhpcy5fbG9nZ2VyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZGVsZWdhdGVMb2dnZXIuZGVsZWdhdGUgPSB0aGlzLl93cmFwcGVkTG9nZ2VyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gU2V0IHRoaXMgY29uZmlnLCBpdCBtYXkgYmUgZm9yIHRoZSBjYXRlZ29yeSBzcGVjaWZpYywgdGhlIGRlZmF1bHQgaXMgdGhlcmVmb3JlIG5vdCBnb29kIGVub3VnaC5cbiAgICAgICAgICAgIHRoaXMuX2RlZmF1bHRDb25maWcgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBjb25maWc7IH07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExhenlTdGF0ZS5wcm90b3R5cGUubG9hZExvZ2dlck9uRGVtYW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNMb2FkZWQoKSkge1xuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyID0gdGhpcy5fY3JlYXRlTG9nZ2VyKHRoaXMuX2RlZmF1bHRDb25maWcoKSwgdGhpcy5fY2F0ZWdvcnkpO1xuICAgICAgICAgICAgdGhpcy5fd3JhcHBlZExvZ2dlciA9IHRoaXMuX2xvZ2dlcjtcbiAgICAgICAgICAgIHRoaXMuX2RlbGVnYXRlTG9nZ2VyID0gbmV3IENhdGVnb3J5RGVsZWdhdGVMb2dnZXJJbXBsXzEuQ2F0ZWdvcnlEZWxlZ2F0ZUxvZ2dlckltcGwodGhpcy5fd3JhcHBlZExvZ2dlcik7XG4gICAgICAgICAgICB0aGlzLl9vcmlnaW5hbFJ1bnRpbWVTZXR0aW5ncyA9IHRoaXMuaW5pdE5ld1NldHRpbmdzKCk7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50UnVudGltZVNldHRpbmdzID0gdGhpcy5pbml0TmV3U2V0dGluZ3MoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF6eVN0YXRlLnByb3RvdHlwZS5pbml0TmV3U2V0dGluZ3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkZWZTZXR0aW5ncyA9IHRoaXMuX2RlZmF1bHRDb25maWcoKS5jb3B5KCk7XG4gICAgICAgIHJldHVybiBuZXcgQ2F0ZWdvcnlSdW50aW1lU2V0dGluZ3NfMS5DYXRlZ29yeVJ1bnRpbWVTZXR0aW5ncyh0aGlzLl9jYXRlZ29yeSwgZGVmU2V0dGluZ3MubG9nTGV2ZWwsIGRlZlNldHRpbmdzLmxvZ2dlclR5cGUsIGRlZlNldHRpbmdzLmxvZ0Zvcm1hdCwgZGVmU2V0dGluZ3MuY2FsbEJhY2tMb2dnZXIsIGRlZlNldHRpbmdzLmZvcm1hdHRlckxvZ01lc3NhZ2UpO1xuICAgIH07XG4gICAgcmV0dXJuIExhenlTdGF0ZTtcbn0oKSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1DYXRlZ29yeVNlcnZpY2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgQ2F0ZWdvcnlTZXJ2aWNlXzEgPSByZXF1aXJlKFwiLi9DYXRlZ29yeVNlcnZpY2VcIik7XG4vKipcbiAqIENhdGVnb3JpemVkIHNlcnZpY2UgZm9yIGxvZ2dpbmcsIHdoZXJlIGxvZ2dpbmcgaXMgYm91bmQgdG8gY2F0ZWdvcmllcyB3aGljaFxuICogY2FuIGxvZyBob3Jpem9udGFsbHkgdGhyb3VnaCBzcGVjaWZpYyBhcHBsaWNhdGlvbiBsb2dpYyAoc2VydmljZXMsIGdyb3VwKHMpIG9mIGNvbXBvbmVudHMgZXRjKS5cbiAqIEZvciB0aGUgc3RhbmRhcmQgd2F5IG9mIGxvZ2dpbmcgbGlrZSBtb3N0IGZyYW1ld29ya3MgZG8gdGhlc2UgZGF5cywgdXNlIExGU2VydmljZSBpbnN0ZWFkLlxuICogSWYgeW91IHdhbnQgZmluZSBncmFpbmVkIGNvbnRyb2wgdG8gZGl2aWRlIHNlY3Rpb25zIG9mIHlvdXIgYXBwbGljYXRpb24gaW5cbiAqIGxvZ2ljYWwgdW5pdHMgdG8gZW5hYmxlL2Rpc2FibGUgbG9nZ2luZyBmb3IsIHRoaXMgaXMgdGhlIHNlcnZpY2UgeW91IHdhbnQgdG8gdXNlIGluc3RlYWQuXG4gKiBBbHNvIGZvciB0aGlzIHR5cGUgYSBicm93c2VyIHBsdWdpbiB3aWxsIGJlIGF2YWlsYWJsZS5cbiAqL1xudmFyIENhdGVnb3J5U2VydmljZUZhY3RvcnkgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENhdGVnb3J5U2VydmljZUZhY3RvcnkoKSB7XG4gICAgICAgIC8vIFByaXZhdGUgY29uc3RydWN0b3IuXG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybiBhIENhdGVnb3J5TG9nZ2VyIGZvciBnaXZlbiBST09UIGNhdGVnb3J5ICh0aHVzIGhhcyBubyBwYXJlbnQpLlxuICAgICAqIFlvdSBjYW4gb25seSByZXRyaWV2ZSBsb2dnZXJzIGZvciB0aGVpciByb290LCB3aGVuIGxvZ2dpbmdcbiAgICAgKiB5b3Ugc3BlY2lmeSB0byBsb2cgZm9yIHdoYXQgKGNoaWxkKWNhdGVnb3JpZXMuXG4gICAgICogQHBhcmFtIHJvb3QgQ2F0ZWdvcnkgcm9vdCAoaGFzIG5vIHBhcmVudClcbiAgICAgKiBAcmV0dXJucyB7Q2F0ZWdvcnlMb2dnZXJ9XG4gICAgICovXG4gICAgQ2F0ZWdvcnlTZXJ2aWNlRmFjdG9yeS5nZXRMb2dnZXIgPSBmdW5jdGlvbiAocm9vdCkge1xuICAgICAgICByZXR1cm4gQ2F0ZWdvcnlTZXJ2aWNlXzEuQ2F0ZWdvcnlTZXJ2aWNlSW1wbC5nZXRJbnN0YW5jZSgpLmdldExvZ2dlcihyb290KTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENsZWFycyBldmVyeXRoaW5nLCBhbnkgcmVnaXN0ZXJlZCAocm9vdCljYXRlZ29yaWVzIGFuZCBsb2dnZXJzXG4gICAgICogYXJlIGRpc2NhcmRlZC4gUmVzZXRzIHRvIGRlZmF1bHQgY29uZmlndXJhdGlvbi5cbiAgICAgKi9cbiAgICBDYXRlZ29yeVNlcnZpY2VGYWN0b3J5LmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gQ2F0ZWdvcnlTZXJ2aWNlXzEuQ2F0ZWdvcnlTZXJ2aWNlSW1wbC5nZXRJbnN0YW5jZSgpLmNsZWFyKCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIGRlZmF1bHQgY29uZmlndXJhdGlvbi4gTmV3IHJvb3QgbG9nZ2VycyBjcmVhdGVkIGdldCB0aGlzXG4gICAgICogYXBwbGllZC4gSWYgeW91IHdhbnQgdG8gcmVzZXQgYWxsIGN1cnJlbnQgbG9nZ2VycyB0byBoYXZlIHRoaXNcbiAgICAgKiBhcHBsaWVkIGFzIHdlbGwsIHBhc3MgaW4gcmVzZXQ9dHJ1ZSAodGhlIGRlZmF1bHQgaXMgZmFsc2UpLiBBbGxcbiAgICAgKiBjYXRlZ29yaWVzIHJ1bnRpbWVzZXR0aW5ncyB3aWxsIGJlIHJlc2V0IHRoZW4gYXMgd2VsbC5cbiAgICAgKiBAcGFyYW0gY29uZmlnIFRoZSBuZXcgZGVmYXVsdCBjb25maWd1cmF0aW9uXG4gICAgICogQHBhcmFtIHJlc2V0IElmIHRydWUsIHdpbGwgcmVzZXQgKmFsbCogcnVudGltZXNldHRpbmdzIGZvciBhbGwgbG9nZ2Vycy9jYXRlZ29yaWVzIHRvIHRoZXNlLiBEZWZhdWx0IGlzIHRydWUuXG4gICAgICovXG4gICAgQ2F0ZWdvcnlTZXJ2aWNlRmFjdG9yeS5zZXREZWZhdWx0Q29uZmlndXJhdGlvbiA9IGZ1bmN0aW9uIChjb25maWcsIHJlc2V0KSB7XG4gICAgICAgIGlmIChyZXNldCA9PT0gdm9pZCAwKSB7IHJlc2V0ID0gdHJ1ZTsgfVxuICAgICAgICBDYXRlZ29yeVNlcnZpY2VfMS5DYXRlZ29yeVNlcnZpY2VJbXBsLmdldEluc3RhbmNlKCkuc2V0RGVmYXVsdENvbmZpZ3VyYXRpb24oY29uZmlnLCByZXNldCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBTZXQgbmV3IGNvbmZpZ3VyYXRpb24gc2V0dGluZ3MgZm9yIGEgY2F0ZWdvcnkgKGFuZCBwb3NzaWJseSBpdHMgY2hpbGQgY2F0ZWdvcmllcylcbiAgICAgKiBAcGFyYW0gY29uZmlnIENvbmZpZ1xuICAgICAqIEBwYXJhbSBjYXRlZ29yeSBDYXRlZ29yeVxuICAgICAqIEBwYXJhbSBhcHBseUNoaWxkcmVuIFRydWUgdG8gYXBwbHkgdG8gY2hpbGQgY2F0ZWdvcmllcywgZGVmYXVsdHMgdG8gZmFsc2UuXG4gICAgICovXG4gICAgQ2F0ZWdvcnlTZXJ2aWNlRmFjdG9yeS5zZXRDb25maWd1cmF0aW9uQ2F0ZWdvcnkgPSBmdW5jdGlvbiAoY29uZmlnLCBjYXRlZ29yeSwgYXBwbHlDaGlsZHJlbikge1xuICAgICAgICBpZiAoYXBwbHlDaGlsZHJlbiA9PT0gdm9pZCAwKSB7IGFwcGx5Q2hpbGRyZW4gPSBmYWxzZTsgfVxuICAgICAgICBDYXRlZ29yeVNlcnZpY2VfMS5DYXRlZ29yeVNlcnZpY2VJbXBsLmdldEluc3RhbmNlKCkuc2V0Q29uZmlndXJhdGlvbkNhdGVnb3J5KGNvbmZpZywgY2F0ZWdvcnksIGFwcGx5Q2hpbGRyZW4pO1xuICAgIH07XG4gICAgcmV0dXJuIENhdGVnb3J5U2VydmljZUZhY3Rvcnk7XG59KCkpO1xuZXhwb3J0cy5DYXRlZ29yeVNlcnZpY2VGYWN0b3J5ID0gQ2F0ZWdvcnlTZXJ2aWNlRmFjdG9yeTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUNhdGVnb3J5U2VydmljZUZhY3RvcnkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgTG9nZ2VyT3B0aW9uc18xID0gcmVxdWlyZShcIi4uL0xvZ2dlck9wdGlvbnNcIik7XG52YXIgRGF0YVN0cnVjdHVyZXNfMSA9IHJlcXVpcmUoXCIuLi8uLi91dGlscy9EYXRhU3RydWN0dXJlc1wiKTtcbnZhciBNZXNzYWdlVXRpbHNfMSA9IHJlcXVpcmUoXCIuLi8uLi91dGlscy9NZXNzYWdlVXRpbHNcIik7XG52YXIgTG9nTWVzc2FnZUludGVybmFsSW1wbCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTG9nTWVzc2FnZUludGVybmFsSW1wbChsb2dnZXJOYW1lLCBtZXNzYWdlLCBlcnJvckFzU3RhY2ssIGVycm9yLCBsb2dHcm91cFJ1bGUsIGRhdGUsIGxldmVsLCByZWFkeSkge1xuICAgICAgICB0aGlzLl9lcnJvckFzU3RhY2sgPSBudWxsO1xuICAgICAgICB0aGlzLl9lcnJvciA9IG51bGw7XG4gICAgICAgIHRoaXMuX2xvZ2dlck5hbWUgPSBsb2dnZXJOYW1lO1xuICAgICAgICB0aGlzLl9tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgdGhpcy5fZXJyb3JBc1N0YWNrID0gZXJyb3JBc1N0YWNrO1xuICAgICAgICB0aGlzLl9lcnJvciA9IGVycm9yO1xuICAgICAgICB0aGlzLl9sb2dHcm91cFJ1bGUgPSBsb2dHcm91cFJ1bGU7XG4gICAgICAgIHRoaXMuX2RhdGUgPSBkYXRlO1xuICAgICAgICB0aGlzLl9sZXZlbCA9IGxldmVsO1xuICAgICAgICB0aGlzLl9yZWFkeSA9IHJlYWR5O1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTG9nTWVzc2FnZUludGVybmFsSW1wbC5wcm90b3R5cGUsIFwibG9nZ2VyTmFtZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xvZ2dlck5hbWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShMb2dNZXNzYWdlSW50ZXJuYWxJbXBsLnByb3RvdHlwZSwgXCJtZXNzYWdlXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbWVzc2FnZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX21lc3NhZ2UgPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KExvZ01lc3NhZ2VJbnRlcm5hbEltcGwucHJvdG90eXBlLCBcImVycm9yQXNTdGFja1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Vycm9yQXNTdGFjaztcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX2Vycm9yQXNTdGFjayA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTG9nTWVzc2FnZUludGVybmFsSW1wbC5wcm90b3R5cGUsIFwiZXJyb3JcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9lcnJvcjtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX2Vycm9yID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShMb2dNZXNzYWdlSW50ZXJuYWxJbXBsLnByb3RvdHlwZSwgXCJsb2dHcm91cFJ1bGVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9sb2dHcm91cFJ1bGU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9sb2dHcm91cFJ1bGUgPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KExvZ01lc3NhZ2VJbnRlcm5hbEltcGwucHJvdG90eXBlLCBcImRhdGVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRlO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fZGF0ZSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTG9nTWVzc2FnZUludGVybmFsSW1wbC5wcm90b3R5cGUsIFwibGV2ZWxcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9sZXZlbDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX2xldmVsID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShMb2dNZXNzYWdlSW50ZXJuYWxJbXBsLnByb3RvdHlwZSwgXCJpc01lc3NhZ2VMb2dEYXRhXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mICh0aGlzLl9tZXNzYWdlKSAhPT0gXCJzdHJpbmdcIjtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KExvZ01lc3NhZ2VJbnRlcm5hbEltcGwucHJvdG90eXBlLCBcInJlYWR5XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVhZHk7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWFkeSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTG9nTWVzc2FnZUludGVybmFsSW1wbC5wcm90b3R5cGUsIFwibWVzc2FnZUFzU3RyaW5nXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mICh0aGlzLl9tZXNzYWdlKSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9tZXNzYWdlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21lc3NhZ2UubXNnO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTG9nTWVzc2FnZUludGVybmFsSW1wbC5wcm90b3R5cGUsIFwibG9nRGF0YVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG51bGw7XG4gICAgICAgICAgICBpZiAodHlwZW9mICh0aGlzLl9tZXNzYWdlKSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMubWVzc2FnZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIHJldHVybiBMb2dNZXNzYWdlSW50ZXJuYWxJbXBsO1xufSgpKTtcbi8qKlxuICogQWJzdHJhY3QgYmFzZSBsb2dnZXIsIGV4dGVuZCB0byBlYXNpbHkgaW1wbGVtZW50IGEgY3VzdG9tIGxvZ2dlciB0aGF0XG4gKiBsb2dzIHdoZXJldmVyIHlvdSB3YW50LiBZb3Ugb25seSBuZWVkIHRvIGltcGxlbWVudCBkb0xvZyhtc2c6IExvZ01lc3NhZ2UpIGFuZFxuICogbG9nIHRoYXQgc29tZXdoZXJlIChpdCB3aWxsIGNvbnRhaW4gZm9ybWF0IGFuZCBldmVyeXRoaW5nIGVsc2UpLlxuICovXG52YXIgQWJzdHJhY3RMb2dnZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEFic3RyYWN0TG9nZ2VyKG5hbWUsIGxvZ0dyb3VwUnVudGltZVNldHRpbmdzKSB7XG4gICAgICAgIHRoaXMuX2FsbE1lc3NhZ2VzID0gbmV3IERhdGFTdHJ1Y3R1cmVzXzEuTGlua2VkTGlzdCgpO1xuICAgICAgICB0aGlzLl9vcGVuID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fbmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuX2xvZ0dyb3VwUnVudGltZVNldHRpbmdzID0gbG9nR3JvdXBSdW50aW1lU2V0dGluZ3M7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBYnN0cmFjdExvZ2dlci5wcm90b3R5cGUsIFwibmFtZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIEFic3RyYWN0TG9nZ2VyLnByb3RvdHlwZS50cmFjZSA9IGZ1bmN0aW9uIChtc2csIGVycm9yKSB7XG4gICAgICAgIGlmIChlcnJvciA9PT0gdm9pZCAwKSB7IGVycm9yID0gbnVsbDsgfVxuICAgICAgICB0aGlzLl9sb2coTG9nZ2VyT3B0aW9uc18xLkxvZ0xldmVsLlRyYWNlLCBtc2csIGVycm9yKTtcbiAgICB9O1xuICAgIEFic3RyYWN0TG9nZ2VyLnByb3RvdHlwZS5kZWJ1ZyA9IGZ1bmN0aW9uIChtc2csIGVycm9yKSB7XG4gICAgICAgIGlmIChlcnJvciA9PT0gdm9pZCAwKSB7IGVycm9yID0gbnVsbDsgfVxuICAgICAgICB0aGlzLl9sb2coTG9nZ2VyT3B0aW9uc18xLkxvZ0xldmVsLkRlYnVnLCBtc2csIGVycm9yKTtcbiAgICB9O1xuICAgIEFic3RyYWN0TG9nZ2VyLnByb3RvdHlwZS5pbmZvID0gZnVuY3Rpb24gKG1zZywgZXJyb3IpIHtcbiAgICAgICAgaWYgKGVycm9yID09PSB2b2lkIDApIHsgZXJyb3IgPSBudWxsOyB9XG4gICAgICAgIHRoaXMuX2xvZyhMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuSW5mbywgbXNnLCBlcnJvcik7XG4gICAgfTtcbiAgICBBYnN0cmFjdExvZ2dlci5wcm90b3R5cGUud2FybiA9IGZ1bmN0aW9uIChtc2csIGVycm9yKSB7XG4gICAgICAgIGlmIChlcnJvciA9PT0gdm9pZCAwKSB7IGVycm9yID0gbnVsbDsgfVxuICAgICAgICB0aGlzLl9sb2coTG9nZ2VyT3B0aW9uc18xLkxvZ0xldmVsLldhcm4sIG1zZywgZXJyb3IpO1xuICAgIH07XG4gICAgQWJzdHJhY3RMb2dnZXIucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKG1zZywgZXJyb3IpIHtcbiAgICAgICAgaWYgKGVycm9yID09PSB2b2lkIDApIHsgZXJyb3IgPSBudWxsOyB9XG4gICAgICAgIHRoaXMuX2xvZyhMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuRXJyb3IsIG1zZywgZXJyb3IpO1xuICAgIH07XG4gICAgQWJzdHJhY3RMb2dnZXIucHJvdG90eXBlLmZhdGFsID0gZnVuY3Rpb24gKG1zZywgZXJyb3IpIHtcbiAgICAgICAgaWYgKGVycm9yID09PSB2b2lkIDApIHsgZXJyb3IgPSBudWxsOyB9XG4gICAgICAgIHRoaXMuX2xvZyhMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuRmF0YWwsIG1zZywgZXJyb3IpO1xuICAgIH07XG4gICAgQWJzdHJhY3RMb2dnZXIucHJvdG90eXBlLmlzVHJhY2VFbmFibGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbG9nR3JvdXBSdW50aW1lU2V0dGluZ3MubGV2ZWwgPT09IExvZ2dlck9wdGlvbnNfMS5Mb2dMZXZlbC5UcmFjZTtcbiAgICB9O1xuICAgIEFic3RyYWN0TG9nZ2VyLnByb3RvdHlwZS5pc0RlYnVnRW5hYmxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvZ0dyb3VwUnVudGltZVNldHRpbmdzLmxldmVsIDw9IExvZ2dlck9wdGlvbnNfMS5Mb2dMZXZlbC5EZWJ1ZztcbiAgICB9O1xuICAgIEFic3RyYWN0TG9nZ2VyLnByb3RvdHlwZS5pc0luZm9FbmFibGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbG9nR3JvdXBSdW50aW1lU2V0dGluZ3MubGV2ZWwgPD0gTG9nZ2VyT3B0aW9uc18xLkxvZ0xldmVsLkluZm87XG4gICAgfTtcbiAgICBBYnN0cmFjdExvZ2dlci5wcm90b3R5cGUuaXNXYXJuRW5hYmxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvZ0dyb3VwUnVudGltZVNldHRpbmdzLmxldmVsIDw9IExvZ2dlck9wdGlvbnNfMS5Mb2dMZXZlbC5XYXJuO1xuICAgIH07XG4gICAgQWJzdHJhY3RMb2dnZXIucHJvdG90eXBlLmlzRXJyb3JFbmFibGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbG9nR3JvdXBSdW50aW1lU2V0dGluZ3MubGV2ZWwgPD0gTG9nZ2VyT3B0aW9uc18xLkxvZ0xldmVsLkVycm9yO1xuICAgIH07XG4gICAgQWJzdHJhY3RMb2dnZXIucHJvdG90eXBlLmlzRmF0YWxFbmFibGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbG9nR3JvdXBSdW50aW1lU2V0dGluZ3MubGV2ZWwgPD0gTG9nZ2VyT3B0aW9uc18xLkxvZ0xldmVsLkZhdGFsO1xuICAgIH07XG4gICAgQWJzdHJhY3RMb2dnZXIucHJvdG90eXBlLmdldExvZ0xldmVsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbG9nR3JvdXBSdW50aW1lU2V0dGluZ3MubGV2ZWw7XG4gICAgfTtcbiAgICBBYnN0cmFjdExvZ2dlci5wcm90b3R5cGUuaXNPcGVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fb3BlbjtcbiAgICB9O1xuICAgIEFic3RyYWN0TG9nZ2VyLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fb3BlbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9hbGxNZXNzYWdlcy5jbGVhcigpO1xuICAgIH07XG4gICAgQWJzdHJhY3RMb2dnZXIucHJvdG90eXBlLmNyZWF0ZURlZmF1bHRMb2dNZXNzYWdlID0gZnVuY3Rpb24gKG1zZykge1xuICAgICAgICByZXR1cm4gTWVzc2FnZVV0aWxzXzEuTWVzc2FnZUZvcm1hdFV0aWxzLnJlbmRlckRlZmF1bHRMb2c0ak1lc3NhZ2UobXNnLCB0cnVlKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJldHVybiBvcHRpb25hbCBtZXNzYWdlIGZvcm1hdHRlci4gQWxsIExvZ2dlclR5cGVzIChleGNlcHQgY3VzdG9tKSB3aWxsIHNlZSBpZlxuICAgICAqIHRoZXkgaGF2ZSB0aGlzLCBhbmQgaWYgc28gdXNlIGl0IHRvIGxvZy5cbiAgICAgKiBAcmV0dXJucyB7KChtZXNzYWdlOkxvZ01lc3NhZ2UpPT5zdHJpbmcpfG51bGx9XG4gICAgICovXG4gICAgQWJzdHJhY3RMb2dnZXIucHJvdG90eXBlLl9nZXRNZXNzYWdlRm9ybWF0dGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbG9nR3JvdXBSdW50aW1lU2V0dGluZ3MuZm9ybWF0dGVyTG9nTWVzc2FnZTtcbiAgICB9O1xuICAgIEFic3RyYWN0TG9nZ2VyLnByb3RvdHlwZS5fbG9nID0gZnVuY3Rpb24gKGxldmVsLCBtc2csIGVycm9yKSB7XG4gICAgICAgIGlmIChlcnJvciA9PT0gdm9pZCAwKSB7IGVycm9yID0gbnVsbDsgfVxuICAgICAgICBpZiAodGhpcy5fb3BlbiAmJiB0aGlzLl9sb2dHcm91cFJ1bnRpbWVTZXR0aW5ncy5sZXZlbCA8PSBsZXZlbCkge1xuICAgICAgICAgICAgdmFyIGZ1bmN0aW9uTWVzc2FnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1zZyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtc2coKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1zZztcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgZnVuY3Rpb25FcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVycm9yID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBlcnJvcjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLl9hbGxNZXNzYWdlcy5hZGRUYWlsKHRoaXMuY3JlYXRlTWVzc2FnZShsZXZlbCwgZnVuY3Rpb25NZXNzYWdlLCBmdW5jdGlvbkVycm9yLCBuZXcgRGF0ZSgpKSk7XG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NNZXNzYWdlcygpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBBYnN0cmFjdExvZ2dlci5wcm90b3R5cGUuY3JlYXRlTWVzc2FnZSA9IGZ1bmN0aW9uIChsZXZlbCwgbXNnLCBlcnJvciwgZGF0ZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZXJyb3JSZXN1bHQgPSBlcnJvcigpO1xuICAgICAgICBpZiAoZXJyb3JSZXN1bHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlXzEgPSBuZXcgTG9nTWVzc2FnZUludGVybmFsSW1wbCh0aGlzLl9uYW1lLCBtc2coKSwgbnVsbCwgZXJyb3JSZXN1bHQsIHRoaXMuX2xvZ0dyb3VwUnVudGltZVNldHRpbmdzLmxvZ0dyb3VwUnVsZSwgZGF0ZSwgbGV2ZWwsIGZhbHNlKTtcbiAgICAgICAgICAgIE1lc3NhZ2VVdGlsc18xLk1lc3NhZ2VGb3JtYXRVdGlscy5yZW5kZXJFcnJvcihlcnJvclJlc3VsdCkudGhlbihmdW5jdGlvbiAoc3RhY2spIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlXzEuZXJyb3JBc1N0YWNrID0gc3RhY2s7XG4gICAgICAgICAgICAgICAgbWVzc2FnZV8xLnJlYWR5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBfdGhpcy5wcm9jZXNzTWVzc2FnZXMoKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlXzEuZXJyb3JBc1N0YWNrID0gXCI8VU5LTk9XTj4gdW5hYmxlIHRvIGdldCBzdGFjay5cIjtcbiAgICAgICAgICAgICAgICBtZXNzYWdlXzEucmVhZHkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIF90aGlzLnByb2Nlc3NNZXNzYWdlcygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gbWVzc2FnZV8xO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgTG9nTWVzc2FnZUludGVybmFsSW1wbCh0aGlzLl9uYW1lLCBtc2coKSwgbnVsbCwgZXJyb3JSZXN1bHQsIHRoaXMuX2xvZ0dyb3VwUnVudGltZVNldHRpbmdzLmxvZ0dyb3VwUnVsZSwgZGF0ZSwgbGV2ZWwsIHRydWUpO1xuICAgIH07XG4gICAgQWJzdHJhY3RMb2dnZXIucHJvdG90eXBlLnByb2Nlc3NNZXNzYWdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gQmFzaWNhbGx5IHdlIHdhaXQgdW50aWwgZXJyb3JzIGFyZSByZXNvbHZlZCAodGhvc2UgbWVzc2FnZXNcbiAgICAgICAgLy8gbWF5IG5vdCBiZSByZWFkeSkuXG4gICAgICAgIHZhciBtc2dzID0gdGhpcy5fYWxsTWVzc2FnZXM7XG4gICAgICAgIGlmIChtc2dzLmdldFNpemUoKSA+IDApIHtcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICB2YXIgbXNnID0gbXNncy5nZXRIZWFkKCk7XG4gICAgICAgICAgICAgICAgaWYgKG1zZyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbXNnLnJlYWR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtc2dzLnJlbW92ZUhlYWQoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBjYW4gbmV2ZXIgYmUgbnVsbCBub3JtYWxseSwgYnV0IHN0cmljdCBudWxsIGNoZWNraW5nIC4uLlxuICAgICAgICAgICAgICAgICAgICBpZiAobXNnLm1lc3NhZ2UgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZG9Mb2cobXNnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gd2hpbGUgKG1zZ3MuZ2V0U2l6ZSgpID4gMCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBBYnN0cmFjdExvZ2dlcjtcbn0oKSk7XG5leHBvcnRzLkFic3RyYWN0TG9nZ2VyID0gQWJzdHJhY3RMb2dnZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1BYnN0cmFjdExvZ2dlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIEFic3RyYWN0TG9nZ2VyXzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdExvZ2dlclwiKTtcbnZhciBMb2dnZXJPcHRpb25zXzEgPSByZXF1aXJlKFwiLi4vTG9nZ2VyT3B0aW9uc1wiKTtcbi8qKlxuICogU2ltcGxlIGxvZ2dlciwgdGhhdCBsb2dzIHRvIHRoZSBjb25zb2xlLiBJZiB0aGUgY29uc29sZSBpcyB1bmF2YWlsYWJsZSB3aWxsIHRocm93IGV4Y2VwdGlvbi5cbiAqL1xudmFyIENvbnNvbGVMb2dnZXJJbXBsID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoQ29uc29sZUxvZ2dlckltcGwsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gQ29uc29sZUxvZ2dlckltcGwobmFtZSwgbG9nR3JvdXBSdW50aW1lU2V0dGluZ3MpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlci5jYWxsKHRoaXMsIG5hbWUsIGxvZ0dyb3VwUnVudGltZVNldHRpbmdzKSB8fCB0aGlzO1xuICAgIH1cbiAgICBDb25zb2xlTG9nZ2VySW1wbC5wcm90b3R5cGUuZG9Mb2cgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICBpZiAoY29uc29sZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB2YXIgbG9nZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICB2YXIgbG9nTGV2ZWwgPSBtZXNzYWdlLmxldmVsO1xuICAgICAgICAgICAgdmFyIG1lc3NhZ2VGb3JtYXR0ZXIgPSB0aGlzLl9nZXRNZXNzYWdlRm9ybWF0dGVyKCk7XG4gICAgICAgICAgICB2YXIgbXNnID0gdm9pZCAwO1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2VGb3JtYXR0ZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBtc2cgPSB0aGlzLmNyZWF0ZURlZmF1bHRMb2dNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbXNnID0gbWVzc2FnZUZvcm1hdHRlcihtZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLWNvbnNvbGUgKi9cbiAgICAgICAgICAgIHN3aXRjaCAobG9nTGV2ZWwpIHtcbiAgICAgICAgICAgICAgICBjYXNlIExvZ2dlck9wdGlvbnNfMS5Mb2dMZXZlbC5UcmFjZTpcbiAgICAgICAgICAgICAgICAgICAgLy8gRG8gbm90IHRyeSB0cmFjZSB3ZSBkb24ndCB3YW50IGEgc3RhY2tcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuRGVidWc6XG4gICAgICAgICAgICAgICAgICAgIC8vIERvbid0IHRyeSwgdG9vIG11Y2ggZGlmZmVyZW5jZXMgb2YgY29uc29sZXMuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgTG9nZ2VyT3B0aW9uc18xLkxvZ0xldmVsLkluZm86XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25zb2xlLmluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhtc2cpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIExvZ2dlck9wdGlvbnNfMS5Mb2dMZXZlbC5XYXJuOlxuICAgICAgICAgICAgICAgICAgICBpZiAoY29uc29sZS53YXJuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4obXNnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuRXJyb3I6XG4gICAgICAgICAgICAgICAgY2FzZSBMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuRmF0YWw6XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25zb2xlLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkxvZyBsZXZlbCBub3Qgc3VwcG9ydGVkOiBcIiArIGxvZ0xldmVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghbG9nZ2VkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cobXNnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIHRzbGludDplbmFibGU6bm8tY29uc29sZSAqL1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29uc29sZSBpcyBub3QgZGVmaW5lZCwgY2Fubm90IGxvZyBtc2c6IFwiICsgbWVzc2FnZS5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIENvbnNvbGVMb2dnZXJJbXBsO1xufShBYnN0cmFjdExvZ2dlcl8xLkFic3RyYWN0TG9nZ2VyKSk7XG5leHBvcnRzLkNvbnNvbGVMb2dnZXJJbXBsID0gQ29uc29sZUxvZ2dlckltcGw7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Db25zb2xlTG9nZ2VySW1wbC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBEYXRhU3RydWN0dXJlc18xID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL0RhdGFTdHJ1Y3R1cmVzXCIpO1xudmFyIExvZ2dlck9wdGlvbnNfMSA9IHJlcXVpcmUoXCIuLi9Mb2dnZXJPcHRpb25zXCIpO1xudmFyIExvZ2dlckZhY3RvcnlJbXBsXzEgPSByZXF1aXJlKFwiLi9Mb2dnZXJGYWN0b3J5SW1wbFwiKTtcbnZhciBFeHRlbnNpb25IZWxwZXJfMSA9IHJlcXVpcmUoXCIuLi8uLi9leHRlbnNpb24vRXh0ZW5zaW9uSGVscGVyXCIpO1xudmFyIExvZ0dyb3VwUnVsZV8xID0gcmVxdWlyZShcIi4vTG9nR3JvdXBSdWxlXCIpO1xudmFyIExvZ2dlckZhY3RvcnlPcHRpb25zXzEgPSByZXF1aXJlKFwiLi9Mb2dnZXJGYWN0b3J5T3B0aW9uc1wiKTtcbnZhciBMRlNlcnZpY2VJbXBsID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMRlNlcnZpY2VJbXBsKCkge1xuICAgICAgICAvLyBQcml2YXRlIGNvbnN0cnVjdG9yLlxuICAgICAgICB0aGlzLl9uYW1lQ291bnRlciA9IDE7XG4gICAgICAgIHRoaXMuX21hcEZhY3RvcmllcyA9IG5ldyBEYXRhU3RydWN0dXJlc18xLlNpbXBsZU1hcCgpO1xuICAgICAgICBFeHRlbnNpb25IZWxwZXJfMS5FeHRlbnNpb25IZWxwZXIucmVnaXN0ZXIoKTtcbiAgICB9XG4gICAgTEZTZXJ2aWNlSW1wbC5nZXRJbnN0YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gTG9hZGVkIG9uIGRlbWFuZC4gRG8gTk9UIGNoYW5nZSBhcyB3ZWJwYWNrIG1heSBwYWNrIHRoaW5ncyBpbiB3cm9uZyBvcmRlciBvdGhlcndpc2UuXG4gICAgICAgIGlmIChMRlNlcnZpY2VJbXBsLl9JTlNUQU5DRSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgTEZTZXJ2aWNlSW1wbC5fSU5TVEFOQ0UgPSBuZXcgTEZTZXJ2aWNlSW1wbCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBMRlNlcnZpY2VJbXBsLl9JTlNUQU5DRTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBMb2dnZXJGYWN0b3J5IHdpdGggZ2l2ZW4gb3B0aW9ucyAoaWYgYW55KS4gSWYgbm8gb3B0aW9uc1xuICAgICAqIGFyZSBzcGVjaWZpZWQsIHRoZSBMb2dnZXJGYWN0b3J5LCB3aWxsIGFjY2VwdCBhbnkgbmFtZWQgbG9nZ2VyIGFuZCB3aWxsXG4gICAgICogbG9nIG9uIGluZm8gbGV2ZWwgYnkgZGVmYXVsdCBmb3IsIHRvIHRoZSBjb25zb2xlLlxuICAgICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMsIG9wdGlvbmFsLlxuICAgICAqIEByZXR1cm5zIHtMb2dnZXJGYWN0b3J5fVxuICAgICAqL1xuICAgIExGU2VydmljZUltcGwucHJvdG90eXBlLmNyZWF0ZUxvZ2dlckZhY3RvcnkgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSBudWxsOyB9XG4gICAgICAgIHZhciBuYW1lID0gXCJMb2dnZXJGYWN0b3J5XCIgKyB0aGlzLl9uYW1lQ291bnRlcisrO1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVOYW1lZExvZ2dlckZhY3RvcnkobmFtZSwgb3B0aW9ucyk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgTG9nZ2VyRmFjdG9yeSB1c2luZyBnaXZlbiBuYW1lICh1c2VkIGZvciBjb25zb2xlIGFwaS9leHRlbnNpb24pLlxuICAgICAqIEBwYXJhbSBuYW1lIE5hbWUgUGljayBzb21ldGhpbmcgc2hvcnQgYnV0IGRpc3Rpbmd1aXNoYWJsZS5cbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zLCBvcHRpb25hbFxuICAgICAqIEByZXR1cm4ge0xvZ2dlckZhY3Rvcnl9XG4gICAgICovXG4gICAgTEZTZXJ2aWNlSW1wbC5wcm90b3R5cGUuY3JlYXRlTmFtZWRMb2dnZXJGYWN0b3J5ID0gZnVuY3Rpb24gKG5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0gbnVsbDsgfVxuICAgICAgICBpZiAodGhpcy5fbWFwRmFjdG9yaWVzLmV4aXN0cyhuYW1lKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTG9nZ2VyRmFjdG9yeSB3aXRoIG5hbWUgXCIgKyBuYW1lICsgXCIgYWxyZWFkeSBleGlzdHMuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBmYWN0b3J5O1xuICAgICAgICBpZiAob3B0aW9ucyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgZmFjdG9yeSA9IG5ldyBMb2dnZXJGYWN0b3J5SW1wbF8xLkxvZ2dlckZhY3RvcnlJbXBsKG5hbWUsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZmFjdG9yeSA9IG5ldyBMb2dnZXJGYWN0b3J5SW1wbF8xLkxvZ2dlckZhY3RvcnlJbXBsKG5hbWUsIExGU2VydmljZUltcGwuY3JlYXRlRGVmYXVsdE9wdGlvbnMoKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbWFwRmFjdG9yaWVzLnB1dChuYW1lLCBmYWN0b3J5KTtcbiAgICAgICAgcmV0dXJuIGZhY3Rvcnk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDbG9zZXMgYWxsIExvZ2dlcnMgZm9yIExvZ2dlckZhY3RvcmllcyB0aGF0IHdlcmUgY3JlYXRlZC5cbiAgICAgKiBBZnRlciB0aGlzIGNhbGwsIGFsbCBwcmV2aW91c2x5IGZldGNoZWQgTG9nZ2VycyAoZnJvbSB0aGVpclxuICAgICAqIGZhY3RvcmllcykgYXJlIHVudXNhYmxlLiBUaGUgZmFjdG9yaWVzIHJlbWFpbiBhcyB0aGV5IHdlcmUuXG4gICAgICovXG4gICAgTEZTZXJ2aWNlSW1wbC5wcm90b3R5cGUuY2xvc2VMb2dnZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9tYXBGYWN0b3JpZXMudmFsdWVzKCkuZm9yRWFjaChmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgICAgICAgICAgZmFjdG9yeS5jbG9zZUxvZ2dlcnMoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX21hcEZhY3Rvcmllcy5jbGVhcigpO1xuICAgICAgICB0aGlzLl9uYW1lQ291bnRlciA9IDE7XG4gICAgfTtcbiAgICBMRlNlcnZpY2VJbXBsLnByb3RvdHlwZS5nZXRSdW50aW1lU2V0dGluZ3NGb3JMb2dnZXJGYWN0b3JpZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgdGhpcy5fbWFwRmFjdG9yaWVzLmZvckVhY2hWYWx1ZShmdW5jdGlvbiAoZmFjdG9yeSkgeyByZXR1cm4gcmVzdWx0LnB1c2goZmFjdG9yeSk7IH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgTEZTZXJ2aWNlSW1wbC5wcm90b3R5cGUuZ2V0TG9nR3JvdXBTZXR0aW5ncyA9IGZ1bmN0aW9uIChuYW1lTG9nZ2VyRmFjdG9yeSwgaWRMb2dHcm91cFJ1bGUpIHtcbiAgICAgICAgdmFyIGZhY3RvcnkgPSB0aGlzLl9tYXBGYWN0b3JpZXMuZ2V0KG5hbWVMb2dnZXJGYWN0b3J5KTtcbiAgICAgICAgaWYgKHR5cGVvZiBmYWN0b3J5ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFjdG9yeS5nZXRMb2dHcm91cFJ1bnRpbWVTZXR0aW5nc0J5SW5kZXgoaWRMb2dHcm91cFJ1bGUpO1xuICAgIH07XG4gICAgTEZTZXJ2aWNlSW1wbC5wcm90b3R5cGUuZ2V0TG9nZ2VyRmFjdG9yeVJ1bnRpbWVTZXR0aW5nc0J5TmFtZSA9IGZ1bmN0aW9uIChuYW1lTG9nZ2VyRmFjdG9yeSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5fbWFwRmFjdG9yaWVzLmdldChuYW1lTG9nZ2VyRmFjdG9yeSk7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgTEZTZXJ2aWNlSW1wbC5jcmVhdGVEZWZhdWx0T3B0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMb2dnZXJGYWN0b3J5T3B0aW9uc18xLkxvZ2dlckZhY3RvcnlPcHRpb25zKCkuYWRkTG9nR3JvdXBSdWxlKG5ldyBMb2dHcm91cFJ1bGVfMS5Mb2dHcm91cFJ1bGUobmV3IFJlZ0V4cChcIi4rXCIpLCBMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuSW5mbykpO1xuICAgIH07XG4gICAgLy8gTG9hZGVkIG9uIGRlbWFuZC4gRG8gTk9UIGNoYW5nZSBhcyB3ZWJwYWNrIG1heSBwYWNrIHRoaW5ncyBpbiB3cm9uZyBvcmRlciBvdGhlcndpc2UuXG4gICAgTEZTZXJ2aWNlSW1wbC5fSU5TVEFOQ0UgPSBudWxsO1xuICAgIHJldHVybiBMRlNlcnZpY2VJbXBsO1xufSgpKTtcbi8qKlxuICogQ3JlYXRlIGFuZCBjb25maWd1cmUgeW91ciBMb2dnZXJGYWN0b3J5IGZyb20gaGVyZS5cbiAqL1xudmFyIExGU2VydmljZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTEZTZXJ2aWNlKCkge1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgTG9nZ2VyRmFjdG9yeSB3aXRoIGdpdmVuIG9wdGlvbnMgKGlmIGFueSkuIElmIG5vIG9wdGlvbnNcbiAgICAgKiBhcmUgc3BlY2lmaWVkLCB0aGUgTG9nZ2VyRmFjdG9yeSwgd2lsbCBhY2NlcHQgYW55IG5hbWVkIGxvZ2dlciBhbmQgd2lsbFxuICAgICAqIGxvZyBvbiBpbmZvIGxldmVsIGJ5IGRlZmF1bHQgZm9yLCB0byB0aGUgY29uc29sZS5cbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zLCBvcHRpb25hbC5cbiAgICAgKiBAcmV0dXJucyB7TG9nZ2VyRmFjdG9yeX1cbiAgICAgKi9cbiAgICBMRlNlcnZpY2UuY3JlYXRlTG9nZ2VyRmFjdG9yeSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IG51bGw7IH1cbiAgICAgICAgcmV0dXJuIExGU2VydmljZS5JTlNUQU5DRV9TRVJWSUNFLmNyZWF0ZUxvZ2dlckZhY3Rvcnkob3B0aW9ucyk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgTG9nZ2VyRmFjdG9yeSB1c2luZyBnaXZlbiBuYW1lICh1c2VkIGZvciBjb25zb2xlIGFwaS9leHRlbnNpb24pLlxuICAgICAqIEBwYXJhbSBuYW1lIE5hbWUgUGljayBzb21ldGhpbmcgc2hvcnQgYnV0IGRpc3Rpbmd1aXNoYWJsZS4gVGhlIHdvcmQgXCJERUZBVUxUXCIgaXMgcmVzZXJ2ZWQgYW5kIGNhbm5vdCBiZSB0YWtlbiwgaXQgaXMgdXNlZFxuICAgICAqIGZvciB0aGUgZGVmYXVsdCBMb2dnZXJGYWN0b3J5LlxuICAgICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMsIG9wdGlvbmFsXG4gICAgICogQHJldHVybiB7TG9nZ2VyRmFjdG9yeX1cbiAgICAgKi9cbiAgICBMRlNlcnZpY2UuY3JlYXRlTmFtZWRMb2dnZXJGYWN0b3J5ID0gZnVuY3Rpb24gKG5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0gbnVsbDsgfVxuICAgICAgICBpZiAobmFtZSA9PT0gTEZTZXJ2aWNlLkRFRkFVTFRfTE9HR0VSX0ZBQ1RPUllfTkFNRSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTG9nZ2VyRmFjdG9yeSBuYW1lOiBcIiArIExGU2VydmljZS5ERUZBVUxUX0xPR0dFUl9GQUNUT1JZX05BTUUgKyBcIiBpcyByZXNlcnZlZCBhbmQgY2Fubm90IGJlIHVzZWQuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBMRlNlcnZpY2UuSU5TVEFOQ0VfU0VSVklDRS5jcmVhdGVOYW1lZExvZ2dlckZhY3RvcnkobmFtZSwgb3B0aW9ucyk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDbG9zZXMgYWxsIExvZ2dlcnMgZm9yIExvZ2dlckZhY3RvcmllcyB0aGF0IHdlcmUgY3JlYXRlZC5cbiAgICAgKiBBZnRlciB0aGlzIGNhbGwsIGFsbCBwcmV2aW91c2x5IGZldGNoZWQgTG9nZ2VycyAoZnJvbSB0aGVpclxuICAgICAqIGZhY3RvcmllcykgYXJlIHVudXNhYmxlLiBUaGUgZmFjdG9yaWVzIHJlbWFpbiBhcyB0aGV5IHdlcmUuXG4gICAgICovXG4gICAgTEZTZXJ2aWNlLmNsb3NlTG9nZ2VycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIExGU2VydmljZS5JTlNUQU5DRV9TRVJWSUNFLmNsb3NlTG9nZ2VycygpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJuIExGU2VydmljZVJ1bnRpbWVTZXR0aW5ncyB0byByZXRyaWV2ZSBpbmZvcm1hdGlvbiBsb2dnZXJmYWN0b3JpZXNcbiAgICAgKiBhbmQgdGhlaXIgcnVudGltZSBzZXR0aW5ncy5cbiAgICAgKiBAcmV0dXJucyB7TEZTZXJ2aWNlUnVudGltZVNldHRpbmdzfVxuICAgICAqL1xuICAgIExGU2VydmljZS5nZXRSdW50aW1lU2V0dGluZ3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBMRlNlcnZpY2UuSU5TVEFOQ0VfU0VSVklDRTtcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShMRlNlcnZpY2UsIFwiREVGQVVMVFwiLCB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGlzIHByb3BlcnR5IHJldHVybnMgdGhlIGRlZmF1bHQgTG9nZ2VyRmFjdG9yeSAoaWYgbm90IHlldCBpbml0aWFsaXplZCBpdCBpcyBpbml0aWFsaXplZCkuXG4gICAgICAgICAqIFRoaXMgTG9nZ2VyRmFjdG9yeSBjYW4gYmUgdXNlZCB0byBzaGFyZSBhbW9uZyBtdWx0aXBsZVxuICAgICAgICAgKiBhcHBsaWNhdGlvbnMvbGlicmFyaWVzIC0gdGhhdCB3YXkgeW91IGNhbiBlbmFibGUvY2hhbmdlIGxvZ2dpbmcgb3ZlciBldmVyeXRoaW5nIGZyb21cbiAgICAgICAgICogeW91ciBvd24gYXBwbGljYXRpb24gd2hlbiByZXF1aXJlZC5cbiAgICAgICAgICogSXQgaXMgcmVjb21tZW5kZWQgdG8gYmUgdXNlZCBieSBsaWJyYXJ5IGRldmVsb3BlcnMgdG8gbWFrZSBsb2dnaW5nIGVhc2lseSBhdmFpbGFibGUgZm9yIHRoZVxuICAgICAgICAgKiBjb25zdW1lcnMgb2YgdGhlaXIgbGlicmFyaWVzLlxuICAgICAgICAgKiBJdCBpcyBoaWdobHkgcmVjb21tZW5kZWQgdG8gdXNlIExvZ2dlcnMgZnJvbSB0aGUgTG9nZ2VyRmFjdG9yeSB3aXRoIHVuaXF1ZSBncm91cGluZy9uYW1lcyB0byBwcmV2ZW50XG4gICAgICAgICAqIGNsYXNoZXMgb2YgTG9nZ2VycyBiZXR3ZWVuIG11bHRpcGxlIHByb2plY3RzLlxuICAgICAgICAgKiBAcmV0dXJucyB7TG9nZ2VyRmFjdG9yeX0gUmV0dXJucyB0aGUgZGVmYXVsdCBMb2dnZXJGYWN0b3J5XG4gICAgICAgICAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBMRlNlcnZpY2UuZ2V0RGVmYXVsdCgpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBMRlNlcnZpY2UuZ2V0RGVmYXVsdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKExGU2VydmljZS5ERUZBVUxUX0xPR0dFUl9GQUNUT1JZID09PSBudWxsKSB7XG4gICAgICAgICAgICBMRlNlcnZpY2UuREVGQVVMVF9MT0dHRVJfRkFDVE9SWSA9IExGU2VydmljZS5ERUZBVUxUX0xPR0dFUl9GQUNUT1JZID0gTEZTZXJ2aWNlLklOU1RBTkNFX1NFUlZJQ0UuY3JlYXRlTmFtZWRMb2dnZXJGYWN0b3J5KExGU2VydmljZS5ERUZBVUxUX0xPR0dFUl9GQUNUT1JZX05BTUUsIG5ldyBMb2dnZXJGYWN0b3J5T3B0aW9uc18xLkxvZ2dlckZhY3RvcnlPcHRpb25zKCkuYWRkTG9nR3JvdXBSdWxlKG5ldyBMb2dHcm91cFJ1bGVfMS5Mb2dHcm91cFJ1bGUobmV3IFJlZ0V4cChcIi4rXCIpLCBMb2dnZXJPcHRpb25zXzEuTG9nTGV2ZWwuRXJyb3IpKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIExGU2VydmljZS5ERUZBVUxUX0xPR0dFUl9GQUNUT1JZO1xuICAgIH07XG4gICAgTEZTZXJ2aWNlLkRFRkFVTFRfTE9HR0VSX0ZBQ1RPUllfTkFNRSA9IFwiREVGQVVMVFwiO1xuICAgIExGU2VydmljZS5JTlNUQU5DRV9TRVJWSUNFID0gTEZTZXJ2aWNlSW1wbC5nZXRJbnN0YW5jZSgpO1xuICAgIExGU2VydmljZS5ERUZBVUxUX0xPR0dFUl9GQUNUT1JZID0gbnVsbDtcbiAgICByZXR1cm4gTEZTZXJ2aWNlO1xufSgpKTtcbmV4cG9ydHMuTEZTZXJ2aWNlID0gTEZTZXJ2aWNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9TEZTZXJ2aWNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIExvZ2dlck9wdGlvbnNfMSA9IHJlcXVpcmUoXCIuLi9Mb2dnZXJPcHRpb25zXCIpO1xuLyoqXG4gKiBEZWZpbmVzIGEgTG9nR3JvdXBSdWxlLCB0aGlzIGFsbG93cyB5b3UgdG8gZWl0aGVyIGhhdmUgZXZlcnl0aGluZyBjb25maWd1cmVkIHRoZSBzYW1lIHdheVxuICogb3IgZm9yIGV4YW1wbGUgbG9nZ2VycyB0aGF0IHN0YXJ0IHdpdGggbmFtZSBtb2RlbC4gSXQgYWxsb3dzIHlvdSB0byBncm91cCBsb2dnZXJzIHRvZ2V0aGVyXG4gKiB0byBoYXZlIGEgY2VydGFpbiBsb2dsZXZlbCBhbmQgb3RoZXIgc2V0dGluZ3MuIFlvdSBjYW4gY29uZmlndXJlIHRoaXMgd2hlbiBjcmVhdGluZyB0aGVcbiAqIExvZ2dlckZhY3RvcnkgKHdoaWNoIGFjY2VwdHMgbXVsdGlwbGUgTG9nR3JvdXBSdWxlcykuXG4gKi9cbnZhciBMb2dHcm91cFJ1bGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIExvZ0dyb3VwUnVsZS4gQmFzaWNhbGx5IHlvdSBkZWZpbmUgd2hhdCBsb2dnZXIgbmFtZShzKSBtYXRjaCBmb3IgdGhpcyBncm91cCwgd2hhdCBsZXZlbCBzaG91bGQgYmUgdXNlZCB3aGF0IGxvZ2dlciB0eXBlICh3aGVyZSB0byBsb2cpXG4gICAgICogYW5kIHdoYXQgZm9ybWF0IHRvIHdyaXRlIGluLiBJZiB0aGUgbG9nZ2VyVHlwZSBpcyBjdXN0b20sIHRoZW4gdGhlIGNhbGxCYWNrTG9nZ2VyIG11c3QgYmUgc3VwcGxpZWQgYXMgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmV0dXJuIGEgY3VzdG9tIGxvZ2dlci5cbiAgICAgKiBAcGFyYW0gcmVnRXhwIFJlZ3VsYXIgZXhwcmVzc2lvbiwgd2hhdCBtYXRjaGVzIGZvciB5b3VyIGxvZ2dlciBuYW1lcyBmb3IgdGhpcyBncm91cFxuICAgICAqIEBwYXJhbSBsZXZlbCBMb2dMZXZlbFxuICAgICAqIEBwYXJhbSBsb2dGb3JtYXQgTG9nRm9ybWF0XG4gICAgICogQHBhcmFtIGxvZ2dlclR5cGUgVHlwZSBvZiBsb2dnZXIsIGlmIEN1c3RvbSwgbWFrZSBzdXJlIHRvIGltcGxlbWVudCBjYWxsQmFja0xvZ2dlciBhbmQgcGFzcyBpbiwgdGhpcyB3aWxsIGJlIGNhbGxlZCBzbyB5b3UgY2FuIHJldHVybiB5b3VyIG93biBsb2dnZXIuXG4gICAgICogQHBhcmFtIGNhbGxCYWNrTG9nZ2VyIENhbGxiYWNrIGZ1bmN0aW9uIHRvIHJldHVybiBhIG5ldyBjbGVhbiBjdXN0b20gbG9nZ2VyICh5b3VycyEpXG4gICAgICovXG4gICAgZnVuY3Rpb24gTG9nR3JvdXBSdWxlKHJlZ0V4cCwgbGV2ZWwsIGxvZ0Zvcm1hdCwgbG9nZ2VyVHlwZSwgY2FsbEJhY2tMb2dnZXIpIHtcbiAgICAgICAgaWYgKGxvZ0Zvcm1hdCA9PT0gdm9pZCAwKSB7IGxvZ0Zvcm1hdCA9IG5ldyBMb2dnZXJPcHRpb25zXzEuTG9nRm9ybWF0KCk7IH1cbiAgICAgICAgaWYgKGxvZ2dlclR5cGUgPT09IHZvaWQgMCkgeyBsb2dnZXJUeXBlID0gTG9nZ2VyT3B0aW9uc18xLkxvZ2dlclR5cGUuQ29uc29sZTsgfVxuICAgICAgICBpZiAoY2FsbEJhY2tMb2dnZXIgPT09IHZvaWQgMCkgeyBjYWxsQmFja0xvZ2dlciA9IG51bGw7IH1cbiAgICAgICAgdGhpcy5fZm9ybWF0dGVyTG9nTWVzc2FnZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX3JlZ0V4cCA9IHJlZ0V4cDtcbiAgICAgICAgdGhpcy5fbGV2ZWwgPSBsZXZlbDtcbiAgICAgICAgdGhpcy5fbG9nRm9ybWF0ID0gbG9nRm9ybWF0O1xuICAgICAgICB0aGlzLl9sb2dnZXJUeXBlID0gbG9nZ2VyVHlwZTtcbiAgICAgICAgdGhpcy5fY2FsbEJhY2tMb2dnZXIgPSBjYWxsQmFja0xvZ2dlcjtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KExvZ0dyb3VwUnVsZS5wcm90b3R5cGUsIFwicmVnRXhwXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVnRXhwO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTG9nR3JvdXBSdWxlLnByb3RvdHlwZSwgXCJsZXZlbFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xldmVsO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTG9nR3JvdXBSdWxlLnByb3RvdHlwZSwgXCJsb2dnZXJUeXBlXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbG9nZ2VyVHlwZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KExvZ0dyb3VwUnVsZS5wcm90b3R5cGUsIFwibG9nRm9ybWF0XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbG9nRm9ybWF0O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTG9nR3JvdXBSdWxlLnByb3RvdHlwZSwgXCJjYWxsQmFja0xvZ2dlclwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhbGxCYWNrTG9nZ2VyO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTG9nR3JvdXBSdWxlLnByb3RvdHlwZSwgXCJmb3JtYXR0ZXJMb2dNZXNzYWdlXCIsIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgZm9ybWF0dGVyTG9nTWVzc2FnZSBmdW5jdGlvbiwgc2VlIGNvbW1lbnQgb24gdGhlIHNldHRlci5cbiAgICAgICAgICogQHJldHVybnMgeygobWVzc2FnZTpMb2dNZXNzYWdlKT0+c3RyaW5nKXxudWxsfVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZm9ybWF0dGVyTG9nTWVzc2FnZTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCB0aGUgZGVmYXVsdCBmb3JtYXR0ZXJMb2dNZXNzYWdlIGZ1bmN0aW9uLCBpZiBzZXQgaXQgaXMgYXBwbGllZCB0byBhbGwgdHlwZSBvZiBsb2dnZXJzIGV4Y2VwdCBmb3IgYSBjdXN0b20gbG9nZ2VyLlxuICAgICAgICAgKiBCeSBkZWZhdWx0IHRoaXMgaXMgbnVsbCAobm90IHNldCkuIFlvdSBjYW4gYXNzaWduIGEgZnVuY3Rpb24gdG8gYWxsb3cgY3VzdG9tIGZvcm1hdHRpbmcgb2YgYSBsb2cgbWVzc2FnZS5cbiAgICAgICAgICogRWFjaCBsb2cgbWVzc2FnZSB3aWxsIGNhbGwgdGhpcyBmdW5jdGlvbiB0aGVuIGFuZCBleHBlY3RzIHlvdXIgZnVuY3Rpb24gdG8gZm9ybWF0IHRoZSBtZXNzYWdlIGFuZCByZXR1cm4gYSBzdHJpbmcuXG4gICAgICAgICAqIFdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgeW91IGF0dGVtcHQgdG8gc2V0IGEgZm9ybWF0dGVyTG9nTWVzc2FnZSBpZiB0aGUgTG9nZ2VyVHlwZSBpcyBjdXN0b20uXG4gICAgICAgICAqIEBwYXJhbSB2YWx1ZSBUaGUgZm9ybWF0dGVyIGZ1bmN0aW9uLCBvciBudWxsIHRvIHJlc2V0IGl0LlxuICAgICAgICAgKi9cbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB0aGlzLl9sb2dnZXJUeXBlID09PSBMb2dnZXJPcHRpb25zXzEuTG9nZ2VyVHlwZS5DdXN0b20pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJZb3UgY2Fubm90IHNwZWNpZnkgYSBmb3JtYXR0ZXIgZm9yIGxvZyBtZXNzYWdlcyBpZiB5b3VyIGxvZ2dlclR5cGUgaXMgQ3VzdG9tXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZm9ybWF0dGVyTG9nTWVzc2FnZSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICByZXR1cm4gTG9nR3JvdXBSdWxlO1xufSgpKTtcbmV4cG9ydHMuTG9nR3JvdXBSdWxlID0gTG9nR3JvdXBSdWxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9TG9nR3JvdXBSdWxlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIExvZ2dlck9wdGlvbnNfMSA9IHJlcXVpcmUoXCIuLi9Mb2dnZXJPcHRpb25zXCIpO1xuLyoqXG4gKiBSZXByZXNlbnRzIHRoZSBydW50aW1lIHNldHRpbmdzIGZvciBhIExvZ0dyb3VwIChMb2dHcm91cFJ1bGUpLlxuICovXG52YXIgTG9nR3JvdXBSdW50aW1lU2V0dGluZ3MgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExvZ0dyb3VwUnVudGltZVNldHRpbmdzKGxvZ0dyb3VwUnVsZSkge1xuICAgICAgICB0aGlzLl9mb3JtYXR0ZXJMb2dNZXNzYWdlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbG9nR3JvdXBSdWxlID0gbG9nR3JvdXBSdWxlO1xuICAgICAgICB0aGlzLl9sZXZlbCA9IGxvZ0dyb3VwUnVsZS5sZXZlbDtcbiAgICAgICAgdGhpcy5fbG9nZ2VyVHlwZSA9IGxvZ0dyb3VwUnVsZS5sb2dnZXJUeXBlO1xuICAgICAgICB0aGlzLl9sb2dGb3JtYXQgPSBuZXcgTG9nZ2VyT3B0aW9uc18xLkxvZ0Zvcm1hdChuZXcgTG9nZ2VyT3B0aW9uc18xLkRhdGVGb3JtYXQobG9nR3JvdXBSdWxlLmxvZ0Zvcm1hdC5kYXRlRm9ybWF0LmZvcm1hdEVudW0sIGxvZ0dyb3VwUnVsZS5sb2dGb3JtYXQuZGF0ZUZvcm1hdC5kYXRlU2VwYXJhdG9yKSwgbG9nR3JvdXBSdWxlLmxvZ0Zvcm1hdC5zaG93VGltZVN0YW1wLCBsb2dHcm91cFJ1bGUubG9nRm9ybWF0LnNob3dMb2dnZXJOYW1lKTtcbiAgICAgICAgdGhpcy5fY2FsbEJhY2tMb2dnZXIgPSBsb2dHcm91cFJ1bGUuY2FsbEJhY2tMb2dnZXI7XG4gICAgICAgIHRoaXMuX2Zvcm1hdHRlckxvZ01lc3NhZ2UgPSBsb2dHcm91cFJ1bGUuZm9ybWF0dGVyTG9nTWVzc2FnZTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KExvZ0dyb3VwUnVudGltZVNldHRpbmdzLnByb3RvdHlwZSwgXCJsb2dHcm91cFJ1bGVcIiwge1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBvcmlnaW5hbCBMb2dHcm91cFJ1bGUgKHNvIG5vdCBydW50aW1lIHNldHRpbmdzISlcbiAgICAgICAgICogQHJldHVybiB7TG9nR3JvdXBSdWxlfVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbG9nR3JvdXBSdWxlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTG9nR3JvdXBSdW50aW1lU2V0dGluZ3MucHJvdG90eXBlLCBcImxldmVsXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGV2ZWw7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9sZXZlbCA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTG9nR3JvdXBSdW50aW1lU2V0dGluZ3MucHJvdG90eXBlLCBcImxvZ2dlclR5cGVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9sb2dnZXJUeXBlO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyVHlwZSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTG9nR3JvdXBSdW50aW1lU2V0dGluZ3MucHJvdG90eXBlLCBcImxvZ0Zvcm1hdFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xvZ0Zvcm1hdDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX2xvZ0Zvcm1hdCA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTG9nR3JvdXBSdW50aW1lU2V0dGluZ3MucHJvdG90eXBlLCBcImNhbGxCYWNrTG9nZ2VyXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY2FsbEJhY2tMb2dnZXI7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9jYWxsQmFja0xvZ2dlciA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTG9nR3JvdXBSdW50aW1lU2V0dGluZ3MucHJvdG90eXBlLCBcImZvcm1hdHRlckxvZ01lc3NhZ2VcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9mb3JtYXR0ZXJMb2dNZXNzYWdlO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fZm9ybWF0dGVyTG9nTWVzc2FnZSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICByZXR1cm4gTG9nR3JvdXBSdW50aW1lU2V0dGluZ3M7XG59KCkpO1xuZXhwb3J0cy5Mb2dHcm91cFJ1bnRpbWVTZXR0aW5ncyA9IExvZ0dyb3VwUnVudGltZVNldHRpbmdzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9TG9nR3JvdXBSdW50aW1lU2V0dGluZ3MuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgRGF0YVN0cnVjdHVyZXNfMSA9IHJlcXVpcmUoXCIuLi8uLi91dGlscy9EYXRhU3RydWN0dXJlc1wiKTtcbnZhciBMb2dnZXJPcHRpb25zXzEgPSByZXF1aXJlKFwiLi4vTG9nZ2VyT3B0aW9uc1wiKTtcbnZhciBDb25zb2xlTG9nZ2VySW1wbF8xID0gcmVxdWlyZShcIi4vQ29uc29sZUxvZ2dlckltcGxcIik7XG52YXIgTWVzc2FnZUJ1ZmZlckxvZ2dlckltcGxfMSA9IHJlcXVpcmUoXCIuL01lc3NhZ2VCdWZmZXJMb2dnZXJJbXBsXCIpO1xudmFyIEFic3RyYWN0TG9nZ2VyXzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdExvZ2dlclwiKTtcbnZhciBMb2dHcm91cFJ1bnRpbWVTZXR0aW5nc18xID0gcmVxdWlyZShcIi4vTG9nR3JvdXBSdW50aW1lU2V0dGluZ3NcIik7XG52YXIgTG9nZ2VyRmFjdG9yeUltcGwgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExvZ2dlckZhY3RvcnlJbXBsKG5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fbG9nZ2VycyA9IG5ldyBEYXRhU3RydWN0dXJlc18xLlNpbXBsZU1hcCgpO1xuICAgICAgICB0aGlzLl9sb2dHcm91cFJ1bnRpbWVTZXR0aW5nc0luZGV4ZWQgPSBbXTtcbiAgICAgICAgdGhpcy5fbG9nZ2VyVG9Mb2dHcm91cFNldHRpbmdzID0gbmV3IERhdGFTdHJ1Y3R1cmVzXzEuU2ltcGxlTWFwKCk7XG4gICAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmNvbmZpZ3VyZShvcHRpb25zKTtcbiAgICB9XG4gICAgTG9nZ2VyRmFjdG9yeUltcGwucHJvdG90eXBlLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX29wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICAvLyBDbG9zZSBhbnkgY3VycmVudCBvcGVuIGxvZ2dlcnMuXG4gICAgICAgIHRoaXMuY2xvc2VMb2dnZXJzKCk7XG4gICAgICAgIHRoaXMuX2xvZ2dlclRvTG9nR3JvdXBTZXR0aW5ncy5jbGVhcigpO1xuICAgICAgICB0aGlzLl9sb2dHcm91cFJ1bnRpbWVTZXR0aW5nc0luZGV4ZWQgPSBbXTtcbiAgICAgICAgdmFyIGxvZ0dyb3VwUnVsZXMgPSB0aGlzLl9vcHRpb25zLmxvZ0dyb3VwUnVsZXM7XG4gICAgICAgIC8qIHRzbGludDpkaXNhYmxlOnByZWZlci1mb3Itb2YgKi9cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsb2dHcm91cFJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLl9sb2dHcm91cFJ1bnRpbWVTZXR0aW5nc0luZGV4ZWQucHVzaChuZXcgTG9nR3JvdXBSdW50aW1lU2V0dGluZ3NfMS5Mb2dHcm91cFJ1bnRpbWVTZXR0aW5ncyhsb2dHcm91cFJ1bGVzW2ldKSk7XG4gICAgICAgIH1cbiAgICAgICAgLyogdHNsaW50OmVuYWJsZTpwcmVmZXItZm9yLW9mICovXG4gICAgfTtcbiAgICBMb2dnZXJGYWN0b3J5SW1wbC5wcm90b3R5cGUuZ2V0TG9nZ2VyID0gZnVuY3Rpb24gKG5hbWVkKSB7XG4gICAgICAgIGlmICghdGhpcy5fb3B0aW9ucy5lbmFibGVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMb2dnZXJGYWN0b3J5IGlzIG5vdCBlbmFibGVkLCBwbGVhc2UgY2hlY2sgeW91ciBvcHRpb25zIHBhc3NlZCBpblwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbG9nZ2VyID0gdGhpcy5fbG9nZ2Vycy5nZXQobmFtZWQpO1xuICAgICAgICBpZiAodHlwZW9mIGxvZ2dlciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgcmV0dXJuIGxvZ2dlcjtcbiAgICAgICAgfVxuICAgICAgICAvLyBJbml0aWFsaXplIGxvZ2dlciB3aXRoIGFwcHJvcHJpYXRlIGxldmVsXG4gICAgICAgIGxvZ2dlciA9IHRoaXMubG9hZExvZ2dlcihuYW1lZCk7XG4gICAgICAgIHRoaXMuX2xvZ2dlcnMucHV0KG5hbWVkLCBsb2dnZXIpO1xuICAgICAgICByZXR1cm4gbG9nZ2VyO1xuICAgIH07XG4gICAgTG9nZ2VyRmFjdG9yeUltcGwucHJvdG90eXBlLmlzRW5hYmxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX29wdGlvbnMuZW5hYmxlZDtcbiAgICB9O1xuICAgIExvZ2dlckZhY3RvcnlJbXBsLnByb3RvdHlwZS5jbG9zZUxvZ2dlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2xvZ2dlcnMuZm9yRWFjaFZhbHVlKGZ1bmN0aW9uIChsb2dnZXIpIHtcbiAgICAgICAgICAgIC8vIFdlIGNhbiBvbmx5IGNsb3NlIGlmIEFic3RyYWN0TG9nZ2VyIGlzIHVzZWQgKG91ciBsb2dnZXJzLCBidXQgdXNlciBsb2dnZXJzIG1heSBub3QgZXh0ZW5kIGl0LCBldmVuIHRob3VnaCB1bmxpa2VseSkuXG4gICAgICAgICAgICBpZiAobG9nZ2VyIGluc3RhbmNlb2YgQWJzdHJhY3RMb2dnZXJfMS5BYnN0cmFjdExvZ2dlcikge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5jbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fbG9nZ2Vycy5jbGVhcigpO1xuICAgIH07XG4gICAgTG9nZ2VyRmFjdG9yeUltcGwucHJvdG90eXBlLmdldE5hbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICAgIH07XG4gICAgTG9nZ2VyRmFjdG9yeUltcGwucHJvdG90eXBlLmdldExvZ0dyb3VwUnVudGltZVNldHRpbmdzQnlJbmRleCA9IGZ1bmN0aW9uIChpZHgpIHtcbiAgICAgICAgaWYgKGlkeCA+PSAwICYmIGlkeCA8IHRoaXMuX2xvZ0dyb3VwUnVudGltZVNldHRpbmdzSW5kZXhlZC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9sb2dHcm91cFJ1bnRpbWVTZXR0aW5nc0luZGV4ZWRbaWR4XTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIExvZ2dlckZhY3RvcnlJbXBsLnByb3RvdHlwZS5nZXRMb2dHcm91cFJ1bnRpbWVTZXR0aW5nc0J5TG9nZ2VyTmFtZSA9IGZ1bmN0aW9uIChuYW1lTG9nZ2VyKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLl9sb2dnZXJUb0xvZ0dyb3VwU2V0dGluZ3MuZ2V0KG5hbWVMb2dnZXIpO1xuICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIExvZ2dlckZhY3RvcnlJbXBsLnByb3RvdHlwZS5nZXRMb2dHcm91cFJ1bnRpbWVTZXR0aW5ncyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvZ0dyb3VwUnVudGltZVNldHRpbmdzSW5kZXhlZC5zbGljZSgwKTtcbiAgICB9O1xuICAgIExvZ2dlckZhY3RvcnlJbXBsLnByb3RvdHlwZS5sb2FkTG9nZ2VyID0gZnVuY3Rpb24gKG5hbWVkKSB7XG4gICAgICAgIHZhciBsb2dHcm91cFJ1bGVzID0gdGhpcy5fb3B0aW9ucy5sb2dHcm91cFJ1bGVzO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxvZ0dyb3VwUnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBsb2dHcm91cFJ1bGUgPSBsb2dHcm91cFJ1bGVzW2ldO1xuICAgICAgICAgICAgaWYgKGxvZ0dyb3VwUnVsZS5yZWdFeHAudGVzdChuYW1lZCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgbG9nR3JvdXBSdW50aW1lU2V0dGluZ3MgPSB0aGlzLl9sb2dHcm91cFJ1bnRpbWVTZXR0aW5nc0luZGV4ZWRbaV07XG4gICAgICAgICAgICAgICAgdmFyIGxvZ2dlciA9IHZvaWQgMDtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGxvZ0dyb3VwUnVsZS5sb2dnZXJUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgTG9nZ2VyT3B0aW9uc18xLkxvZ2dlclR5cGUuQ29uc29sZTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlciA9IG5ldyBDb25zb2xlTG9nZ2VySW1wbF8xLkNvbnNvbGVMb2dnZXJJbXBsKG5hbWVkLCBsb2dHcm91cFJ1bnRpbWVTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBMb2dnZXJPcHRpb25zXzEuTG9nZ2VyVHlwZS5NZXNzYWdlQnVmZmVyOlxuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyID0gbmV3IE1lc3NhZ2VCdWZmZXJMb2dnZXJJbXBsXzEuTWVzc2FnZUJ1ZmZlckxvZ2dlckltcGwobmFtZWQsIGxvZ0dyb3VwUnVudGltZVNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIExvZ2dlck9wdGlvbnNfMS5Mb2dnZXJUeXBlLkN1c3RvbTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb2dHcm91cFJ1bGUuY2FsbEJhY2tMb2dnZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlciA9IGxvZ0dyb3VwUnVsZS5jYWxsQmFja0xvZ2dlcihuYW1lZCwgbG9nR3JvdXBSdW50aW1lU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGNyZWF0ZSBhIGN1c3RvbSBsb2dnZXIsIGN1c3RvbSBjYWxsYmFjayBpcyBudWxsXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgY3JlYXRlIGEgTG9nZ2VyIGZvciBMb2dnZXJUeXBlOiBcIiArIGxvZ0dyb3VwUnVsZS5sb2dnZXJUeXBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gRm9yIGEgbmV3IGxvZ2dlciBtYXAgaXQgYnkgaXRzIG5hbWVcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXJUb0xvZ0dyb3VwU2V0dGluZ3MucHV0KG5hbWVkLCBsb2dHcm91cFJ1bnRpbWVTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxvZ2dlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gZmluZCBhIG1hdGNoIHRvIGNyZWF0ZSBhIExvZ2dlciBmb3I6IFwiICsgbmFtZWQpO1xuICAgIH07XG4gICAgcmV0dXJuIExvZ2dlckZhY3RvcnlJbXBsO1xufSgpKTtcbmV4cG9ydHMuTG9nZ2VyRmFjdG9yeUltcGwgPSBMb2dnZXJGYWN0b3J5SW1wbDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUxvZ2dlckZhY3RvcnlJbXBsLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBPcHRpb25zIG9iamVjdCB5b3UgY2FuIHVzZSB0byBjb25maWd1cmUgdGhlIExvZ2dlckZhY3RvcnkgeW91IGNyZWF0ZSBhdCBMRlNlcnZpY2UuXG4gKi9cbnZhciBMb2dnZXJGYWN0b3J5T3B0aW9ucyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTG9nZ2VyRmFjdG9yeU9wdGlvbnMoKSB7XG4gICAgICAgIHRoaXMuX2xvZ0dyb3VwUnVsZXMgPSBbXTtcbiAgICAgICAgdGhpcy5fZW5hYmxlZCA9IHRydWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZCBMb2dHcm91cFJ1bGUsIHNlZSB7TG9nR3JvdXBSdWxlKSBmb3IgZGV0YWlsc1xuICAgICAqIEBwYXJhbSBydWxlIFJ1bGUgdG8gYWRkXG4gICAgICogQHJldHVybnMge0xvZ2dlckZhY3RvcnlPcHRpb25zfSByZXR1cm5zIGl0c2VsZlxuICAgICAqL1xuICAgIExvZ2dlckZhY3RvcnlPcHRpb25zLnByb3RvdHlwZS5hZGRMb2dHcm91cFJ1bGUgPSBmdW5jdGlvbiAocnVsZSkge1xuICAgICAgICB0aGlzLl9sb2dHcm91cFJ1bGVzLnB1c2gocnVsZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogRW5hYmxlIG9yIGRpc2FibGUgbG9nZ2luZyBjb21wbGV0ZWx5IGZvciB0aGUgTG9nZ2VyRmFjdG9yeS5cbiAgICAgKiBAcGFyYW0gZW5hYmxlZCBUcnVlIGZvciBlbmFibGVkIChkZWZhdWx0KVxuICAgICAqIEByZXR1cm5zIHtMb2dnZXJGYWN0b3J5T3B0aW9uc30gcmV0dXJucyBpdHNlbGZcbiAgICAgKi9cbiAgICBMb2dnZXJGYWN0b3J5T3B0aW9ucy5wcm90b3R5cGUuc2V0RW5hYmxlZCA9IGZ1bmN0aW9uIChlbmFibGVkKSB7XG4gICAgICAgIHRoaXMuX2VuYWJsZWQgPSBlbmFibGVkO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShMb2dnZXJGYWN0b3J5T3B0aW9ucy5wcm90b3R5cGUsIFwibG9nR3JvdXBSdWxlc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xvZ0dyb3VwUnVsZXM7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShMb2dnZXJGYWN0b3J5T3B0aW9ucy5wcm90b3R5cGUsIFwiZW5hYmxlZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIHJldHVybiBMb2dnZXJGYWN0b3J5T3B0aW9ucztcbn0oKSk7XG5leHBvcnRzLkxvZ2dlckZhY3RvcnlPcHRpb25zID0gTG9nZ2VyRmFjdG9yeU9wdGlvbnM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Mb2dnZXJGYWN0b3J5T3B0aW9ucy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIEFic3RyYWN0TG9nZ2VyXzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdExvZ2dlclwiKTtcbi8qKlxuICogTG9nZ2VyIHdoaWNoIGJ1ZmZlcnMgYWxsIG1lc3NhZ2VzLCB1c2Ugd2l0aCBjYXJlIGR1ZSB0byBwb3NzaWJsZSBoaWdoIG1lbW9yeSBmb290cHJpbnQuXG4gKiBDYW4gYmUgY29udmVuaWVudCBpbiBzb21lIGNhc2VzLiBDYWxsIHRvU3RyaW5nKCkgZm9yIGZ1bGwgb3V0cHV0LCBvciBjYXN0IHRvIHRoaXMgY2xhc3NcbiAqIGFuZCBjYWxsIGdldE1lc3NhZ2VzKCkgdG8gZG8gc29tZXRoaW5nIHdpdGggaXQgeW91cnNlbGYuXG4gKi9cbnZhciBNZXNzYWdlQnVmZmVyTG9nZ2VySW1wbCA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKE1lc3NhZ2VCdWZmZXJMb2dnZXJJbXBsLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIE1lc3NhZ2VCdWZmZXJMb2dnZXJJbXBsKG5hbWUsIGxvZ0dyb3VwUnVudGltZVNldHRpbmdzKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIG5hbWUsIGxvZ0dyb3VwUnVudGltZVNldHRpbmdzKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5tZXNzYWdlcyA9IFtdO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIE1lc3NhZ2VCdWZmZXJMb2dnZXJJbXBsLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlcyA9IFtdO1xuICAgICAgICBfc3VwZXIucHJvdG90eXBlLmNsb3NlLmNhbGwodGhpcyk7XG4gICAgfTtcbiAgICBNZXNzYWdlQnVmZmVyTG9nZ2VySW1wbC5wcm90b3R5cGUuZ2V0TWVzc2FnZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2VzO1xuICAgIH07XG4gICAgTWVzc2FnZUJ1ZmZlckxvZ2dlckltcGwucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tZXNzYWdlcy5tYXAoZnVuY3Rpb24gKG1zZykge1xuICAgICAgICAgICAgcmV0dXJuIG1zZztcbiAgICAgICAgfSkuam9pbihcIlxcblwiKTtcbiAgICB9O1xuICAgIE1lc3NhZ2VCdWZmZXJMb2dnZXJJbXBsLnByb3RvdHlwZS5kb0xvZyA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgIHZhciBtZXNzYWdlRm9ybWF0dGVyID0gdGhpcy5fZ2V0TWVzc2FnZUZvcm1hdHRlcigpO1xuICAgICAgICB2YXIgZnVsbE1zZztcbiAgICAgICAgaWYgKG1lc3NhZ2VGb3JtYXR0ZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGZ1bGxNc2cgPSB0aGlzLmNyZWF0ZURlZmF1bHRMb2dNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZnVsbE1zZyA9IG1lc3NhZ2VGb3JtYXR0ZXIobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tZXNzYWdlcy5wdXNoKGZ1bGxNc2cpO1xuICAgIH07XG4gICAgcmV0dXJuIE1lc3NhZ2VCdWZmZXJMb2dnZXJJbXBsO1xufShBYnN0cmFjdExvZ2dlcl8xLkFic3RyYWN0TG9nZ2VyKSk7XG5leHBvcnRzLk1lc3NhZ2VCdWZmZXJMb2dnZXJJbXBsID0gTWVzc2FnZUJ1ZmZlckxvZ2dlckltcGw7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1NZXNzYWdlQnVmZmVyTG9nZ2VySW1wbC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIF9fZXhwb3J0KG0pIHtcbiAgICBmb3IgKHZhciBwIGluIG0pIGlmICghZXhwb3J0cy5oYXNPd25Qcm9wZXJ0eShwKSkgZXhwb3J0c1twXSA9IG1bcF07XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgTG9nR3JvdXBDb250cm9sXzEgPSByZXF1aXJlKFwiLi9jb250cm9sL0xvZ0dyb3VwQ29udHJvbFwiKTtcbnZhciBDYXRlZ29yeVNlcnZpY2VDb250cm9sXzEgPSByZXF1aXJlKFwiLi9jb250cm9sL0NhdGVnb3J5U2VydmljZUNvbnRyb2xcIik7XG52YXIgRXh0ZW5zaW9uSGVscGVyXzEgPSByZXF1aXJlKFwiLi9leHRlbnNpb24vRXh0ZW5zaW9uSGVscGVyXCIpO1xuZXhwb3J0cy5FeHRlbnNpb25IZWxwZXIgPSBFeHRlbnNpb25IZWxwZXJfMS5FeHRlbnNpb25IZWxwZXI7XG4vLyBDYXRlZ29yeSByZWxhdGVkXG52YXIgQWJzdHJhY3RDYXRlZ29yeUxvZ2dlcl8xID0gcmVxdWlyZShcIi4vbG9nL2NhdGVnb3J5L0Fic3RyYWN0Q2F0ZWdvcnlMb2dnZXJcIik7XG5leHBvcnRzLkFic3RyYWN0Q2F0ZWdvcnlMb2dnZXIgPSBBYnN0cmFjdENhdGVnb3J5TG9nZ2VyXzEuQWJzdHJhY3RDYXRlZ29yeUxvZ2dlcjtcbnZhciBDYXRlZ29yeUNvbnNvbGVMb2dnZXJJbXBsXzEgPSByZXF1aXJlKFwiLi9sb2cvY2F0ZWdvcnkvQ2F0ZWdvcnlDb25zb2xlTG9nZ2VySW1wbFwiKTtcbmV4cG9ydHMuQ2F0ZWdvcnlDb25zb2xlTG9nZ2VySW1wbCA9IENhdGVnb3J5Q29uc29sZUxvZ2dlckltcGxfMS5DYXRlZ29yeUNvbnNvbGVMb2dnZXJJbXBsO1xudmFyIENhdGVnb3J5RGVsZWdhdGVMb2dnZXJJbXBsXzEgPSByZXF1aXJlKFwiLi9sb2cvY2F0ZWdvcnkvQ2F0ZWdvcnlEZWxlZ2F0ZUxvZ2dlckltcGxcIik7XG5leHBvcnRzLkNhdGVnb3J5RGVsZWdhdGVMb2dnZXJJbXBsID0gQ2F0ZWdvcnlEZWxlZ2F0ZUxvZ2dlckltcGxfMS5DYXRlZ29yeURlbGVnYXRlTG9nZ2VySW1wbDtcbnZhciBDYXRlZ29yeV8xID0gcmVxdWlyZShcIi4vbG9nL2NhdGVnb3J5L0NhdGVnb3J5XCIpO1xuZXhwb3J0cy5DYXRlZ29yeSA9IENhdGVnb3J5XzEuQ2F0ZWdvcnk7XG52YXIgQ2F0ZWdvcnlSdW50aW1lU2V0dGluZ3NfMSA9IHJlcXVpcmUoXCIuL2xvZy9jYXRlZ29yeS9DYXRlZ29yeVJ1bnRpbWVTZXR0aW5nc1wiKTtcbmV4cG9ydHMuQ2F0ZWdvcnlSdW50aW1lU2V0dGluZ3MgPSBDYXRlZ29yeVJ1bnRpbWVTZXR0aW5nc18xLkNhdGVnb3J5UnVudGltZVNldHRpbmdzO1xudmFyIENhdGVnb3J5Q29uZmlndXJhdGlvbl8xID0gcmVxdWlyZShcIi4vbG9nL2NhdGVnb3J5L0NhdGVnb3J5Q29uZmlndXJhdGlvblwiKTtcbmV4cG9ydHMuQ2F0ZWdvcnlDb25maWd1cmF0aW9uID0gQ2F0ZWdvcnlDb25maWd1cmF0aW9uXzEuQ2F0ZWdvcnlDb25maWd1cmF0aW9uO1xudmFyIENhdGVnb3J5TWVzc2FnZUJ1ZmZlckltcGxfMSA9IHJlcXVpcmUoXCIuL2xvZy9jYXRlZ29yeS9DYXRlZ29yeU1lc3NhZ2VCdWZmZXJJbXBsXCIpO1xuZXhwb3J0cy5DYXRlZ29yeU1lc3NhZ2VCdWZmZXJMb2dnZXJJbXBsID0gQ2F0ZWdvcnlNZXNzYWdlQnVmZmVySW1wbF8xLkNhdGVnb3J5TWVzc2FnZUJ1ZmZlckxvZ2dlckltcGw7XG52YXIgQ2F0ZWdvcnlTZXJ2aWNlRmFjdG9yeV8xID0gcmVxdWlyZShcIi4vbG9nL2NhdGVnb3J5L0NhdGVnb3J5U2VydmljZUZhY3RvcnlcIik7XG5leHBvcnRzLkNhdGVnb3J5U2VydmljZUZhY3RvcnkgPSBDYXRlZ29yeVNlcnZpY2VGYWN0b3J5XzEuQ2F0ZWdvcnlTZXJ2aWNlRmFjdG9yeTtcbnZhciBMb2dnZXJGYWN0b3J5T3B0aW9uc18xID0gcmVxdWlyZShcIi4vbG9nL3N0YW5kYXJkL0xvZ2dlckZhY3RvcnlPcHRpb25zXCIpO1xuZXhwb3J0cy5Mb2dnZXJGYWN0b3J5T3B0aW9ucyA9IExvZ2dlckZhY3RvcnlPcHRpb25zXzEuTG9nZ2VyRmFjdG9yeU9wdGlvbnM7XG52YXIgTG9nR3JvdXBSdWxlXzEgPSByZXF1aXJlKFwiLi9sb2cvc3RhbmRhcmQvTG9nR3JvdXBSdWxlXCIpO1xuZXhwb3J0cy5Mb2dHcm91cFJ1bGUgPSBMb2dHcm91cFJ1bGVfMS5Mb2dHcm91cFJ1bGU7XG52YXIgTEZTZXJ2aWNlXzEgPSByZXF1aXJlKFwiLi9sb2cvc3RhbmRhcmQvTEZTZXJ2aWNlXCIpO1xuZXhwb3J0cy5MRlNlcnZpY2UgPSBMRlNlcnZpY2VfMS5MRlNlcnZpY2U7XG52YXIgQWJzdHJhY3RMb2dnZXJfMSA9IHJlcXVpcmUoXCIuL2xvZy9zdGFuZGFyZC9BYnN0cmFjdExvZ2dlclwiKTtcbmV4cG9ydHMuQWJzdHJhY3RMb2dnZXIgPSBBYnN0cmFjdExvZ2dlcl8xLkFic3RyYWN0TG9nZ2VyO1xudmFyIENvbnNvbGVMb2dnZXJJbXBsXzEgPSByZXF1aXJlKFwiLi9sb2cvc3RhbmRhcmQvQ29uc29sZUxvZ2dlckltcGxcIik7XG5leHBvcnRzLkNvbnNvbGVMb2dnZXJJbXBsID0gQ29uc29sZUxvZ2dlckltcGxfMS5Db25zb2xlTG9nZ2VySW1wbDtcbnZhciBNZXNzYWdlQnVmZmVyTG9nZ2VySW1wbF8xID0gcmVxdWlyZShcIi4vbG9nL3N0YW5kYXJkL01lc3NhZ2VCdWZmZXJMb2dnZXJJbXBsXCIpO1xuZXhwb3J0cy5NZXNzYWdlQnVmZmVyTG9nZ2VySW1wbCA9IE1lc3NhZ2VCdWZmZXJMb2dnZXJJbXBsXzEuTWVzc2FnZUJ1ZmZlckxvZ2dlckltcGw7XG52YXIgTG9nZ2VyT3B0aW9uc18xID0gcmVxdWlyZShcIi4vbG9nL0xvZ2dlck9wdGlvbnNcIik7XG5leHBvcnRzLkNhdGVnb3J5TG9nRm9ybWF0ID0gTG9nZ2VyT3B0aW9uc18xLkNhdGVnb3J5TG9nRm9ybWF0O1xuZXhwb3J0cy5EYXRlRm9ybWF0ID0gTG9nZ2VyT3B0aW9uc18xLkRhdGVGb3JtYXQ7XG5leHBvcnRzLkRhdGVGb3JtYXRFbnVtID0gTG9nZ2VyT3B0aW9uc18xLkRhdGVGb3JtYXRFbnVtO1xuZXhwb3J0cy5Mb2dGb3JtYXQgPSBMb2dnZXJPcHRpb25zXzEuTG9nRm9ybWF0O1xuZXhwb3J0cy5Mb2dnZXJUeXBlID0gTG9nZ2VyT3B0aW9uc18xLkxvZ2dlclR5cGU7XG5leHBvcnRzLkxvZ0xldmVsID0gTG9nZ2VyT3B0aW9uc18xLkxvZ0xldmVsO1xuLy8gVXRpbGl0aWVzXG52YXIgRGF0YVN0cnVjdHVyZXNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzL0RhdGFTdHJ1Y3R1cmVzXCIpO1xuZXhwb3J0cy5TaW1wbGVNYXAgPSBEYXRhU3RydWN0dXJlc18xLlNpbXBsZU1hcDtcbmV4cG9ydHMuTGlua2VkTGlzdCA9IERhdGFTdHJ1Y3R1cmVzXzEuTGlua2VkTGlzdDtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3V0aWxzL0pTT05IZWxwZXJcIikpO1xudmFyIE1lc3NhZ2VVdGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHMvTWVzc2FnZVV0aWxzXCIpO1xuZXhwb3J0cy5NZXNzYWdlRm9ybWF0VXRpbHMgPSBNZXNzYWdlVXRpbHNfMS5NZXNzYWdlRm9ybWF0VXRpbHM7XG4vKlxuIEZ1bmN0aW9ucyB0byBleHBvcnQgb24gVFNMIGxpYmFyYXJ5IHZhci5cbiovXG4vLyBFeHBvcnQgaGVscCBmdW5jdGlvblxuZnVuY3Rpb24gaGVscCgpIHtcbiAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1jb25zb2xlICovXG4gICAgY29uc29sZS5sb2coXCJoZWxwKClcXG4gICAqKiBTaG93cyB0aGlzIGhlbHBcXG5cXG4gZ2V0TG9nQ29udHJvbCgpOiBMb2dnZXJDb250cm9sXFxuICAgKiogUmV0dXJucyBMb2dnZXJDb250cm9sIE9iamVjdCwgdXNlIHRvIGR5bmFtaWNhbGx5IGNoYW5nZSBsb2dsZXZlbHMgZm9yIGxvZzRqIGxvZ2dpbmcuXFxuICAgKiogQ2FsbCAuaGVscCgpIG9uIExvZ2dlckNvbnRyb2wgb2JqZWN0IGZvciBhdmFpbGFibGUgb3B0aW9ucy5cXG5cXG4gZ2V0Q2F0ZWdvcnlDb250cm9sKCk6IENhdGVnb3J5U2VydmljZUNvbnRyb2xcXG4gICAqKiBSZXR1cm5zIENhdGVnb3J5U2VydmljZUNvbnRyb2wgT2JqZWN0LCB1c2UgdG8gZHluYW1pY2FsbHkgY2hhbmdlIGxvZ2xldmVscyBmb3IgY2F0ZWdvcnkgbG9nZ2luZy5cXG4gICAqKiBDYWxsIC5oZWxwKCkgb24gQ2F0ZWdvcnlTZXJ2aWNlQ29udHJvbCBvYmplY3QgZm9yIGF2YWlsYWJsZSBvcHRpb25zLlxcblwiKTtcbiAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLWNvbnNvbGUgKi9cbn1cbmV4cG9ydHMuaGVscCA9IGhlbHA7XG4vLyBFeHBvcnQgTG9nQ29udHJvbCBmdW5jdGlvbiAobG9nNGopXG5mdW5jdGlvbiBnZXRMb2dDb250cm9sKCkge1xuICAgIHJldHVybiBuZXcgTG9nR3JvdXBDb250cm9sXzEuTG9nZ2VyQ29udHJvbEltcGwoKTtcbn1cbmV4cG9ydHMuZ2V0TG9nQ29udHJvbCA9IGdldExvZ0NvbnRyb2w7XG4vLyBFeHBvcnQgQ2F0ZWdvcnlDb250cm9sIGZ1bmN0aW9uXG5mdW5jdGlvbiBnZXRDYXRlZ29yeUNvbnRyb2woKSB7XG4gICAgcmV0dXJuIG5ldyBDYXRlZ29yeVNlcnZpY2VDb250cm9sXzEuQ2F0ZWdvcnlTZXJ2aWNlQ29udHJvbEltcGwoKTtcbn1cbmV4cG9ydHMuZ2V0Q2F0ZWdvcnlDb250cm9sID0gZ2V0Q2F0ZWdvcnlDb250cm9sO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dHlwZXNjcmlwdC1sb2dnaW5nLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIExpbmtlZE5vZGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExpbmtlZE5vZGUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fcHJldmlvdXMgPSBudWxsO1xuICAgICAgICB0aGlzLl9uZXh0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KExpbmtlZE5vZGUucHJvdG90eXBlLCBcInByZXZpb3VzXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcHJldmlvdXM7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9wcmV2aW91cyA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTGlua2VkTm9kZS5wcm90b3R5cGUsIFwibmV4dFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25leHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9uZXh0ID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShMaW5rZWROb2RlLnByb3RvdHlwZSwgXCJ2YWx1ZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICByZXR1cm4gTGlua2VkTm9kZTtcbn0oKSk7XG4vKipcbiAqIERvdWJsZSBsaW5rZWRsaXN0IGltcGxlbWVudGF0aW9uLlxuICovXG52YXIgTGlua2VkTGlzdCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGlua2VkTGlzdCgpIHtcbiAgICAgICAgdGhpcy5oZWFkID0gbnVsbDtcbiAgICAgICAgdGhpcy5zaXplID0gMDtcbiAgICB9XG4gICAgTGlua2VkTGlzdC5wcm90b3R5cGUuYWRkSGVhZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAoIXRoaXMuY3JlYXRlSGVhZElmTmVlZGVkKHZhbHVlKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaGVhZCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHROb2RlID0gdGhpcy5oZWFkLm5leHQ7XG4gICAgICAgICAgICAgICAgdmFyIG5ld0hlYWROb2RlID0gbmV3IExpbmtlZE5vZGUodmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChuZXh0Tm9kZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHROb2RlLnByZXZpb3VzID0gbmV3SGVhZE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIG5ld0hlYWROb2RlLm5leHQgPSBuZXh0Tm9kZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5oZWFkID0gbmV3SGVhZE5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIHNob3VsZCBuZXZlciBoYXBwZW4sIGxpc3QgaW1wbGVtZW50YXRpb24gYnJva2VuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2l6ZSsrO1xuICAgIH07XG4gICAgTGlua2VkTGlzdC5wcm90b3R5cGUuYWRkVGFpbCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAoIXRoaXMuY3JlYXRlSGVhZElmTmVlZGVkKHZhbHVlKSkge1xuICAgICAgICAgICAgdmFyIG9sZFRhaWxOb2RlID0gdGhpcy5nZXRUYWlsTm9kZSgpO1xuICAgICAgICAgICAgaWYgKG9sZFRhaWxOb2RlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV3VGFpbE5vZGUgPSBuZXcgTGlua2VkTm9kZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgb2xkVGFpbE5vZGUubmV4dCA9IG5ld1RhaWxOb2RlO1xuICAgICAgICAgICAgICAgIG5ld1RhaWxOb2RlLnByZXZpb3VzID0gb2xkVGFpbE5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMaXN0IGltcGxlbWVudGF0aW9uIGJyb2tlblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNpemUrKztcbiAgICB9O1xuICAgIExpbmtlZExpc3QucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmhlYWQgPSBudWxsO1xuICAgICAgICB0aGlzLnNpemUgPSAwO1xuICAgIH07XG4gICAgTGlua2VkTGlzdC5wcm90b3R5cGUuZ2V0SGVhZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuaGVhZCAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oZWFkLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG4gICAgTGlua2VkTGlzdC5wcm90b3R5cGUucmVtb3ZlSGVhZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuaGVhZCAhPSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgb2xkSGVhZCA9IHRoaXMuaGVhZDtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IG9sZEhlYWQudmFsdWU7XG4gICAgICAgICAgICB0aGlzLmhlYWQgPSBvbGRIZWFkLm5leHQ7XG4gICAgICAgICAgICB0aGlzLnNpemUtLTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIExpbmtlZExpc3QucHJvdG90eXBlLmdldFRhaWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXRUYWlsTm9kZSgpO1xuICAgICAgICBpZiAobm9kZSAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZS52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIExpbmtlZExpc3QucHJvdG90eXBlLnJlbW92ZVRhaWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXRUYWlsTm9kZSgpO1xuICAgICAgICBpZiAobm9kZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAobm9kZSA9PT0gdGhpcy5oZWFkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oZWFkID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBwcmV2aW91c05vZGUgPSBub2RlLnByZXZpb3VzO1xuICAgICAgICAgICAgICAgIGlmIChwcmV2aW91c05vZGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBwcmV2aW91c05vZGUubmV4dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMaXN0IGltcGxlbWVudGF0aW9uIGlzIGJyb2tlblwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNpemUtLTtcbiAgICAgICAgICAgIHJldHVybiBub2RlLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG4gICAgTGlua2VkTGlzdC5wcm90b3R5cGUuZ2V0U2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6ZTtcbiAgICB9O1xuICAgIExpbmtlZExpc3QucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHZhciByZWN1cnNlID0gZnVuY3Rpb24gKGZuLCBub2RlLCB2YWx1ZXMpIHtcbiAgICAgICAgICAgIGlmIChmbihub2RlLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKG5vZGUudmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG5leHROb2RlID0gbm9kZS5uZXh0O1xuICAgICAgICAgICAgaWYgKG5leHROb2RlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZWN1cnNlKGZuLCBuZXh0Tm9kZSwgdmFsdWVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICB2YXIgY3VycmVudE5vZGUgPSB0aGlzLmhlYWQ7XG4gICAgICAgIGlmIChjdXJyZW50Tm9kZSAhPSBudWxsKSB7XG4gICAgICAgICAgICByZWN1cnNlKGYsIGN1cnJlbnROb2RlLCByZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBMaW5rZWRMaXN0LnByb3RvdHlwZS5jcmVhdGVIZWFkSWZOZWVkZWQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHRoaXMuaGVhZCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmhlYWQgPSBuZXcgTGlua2VkTm9kZSh2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBMaW5rZWRMaXN0LnByb3RvdHlwZS5nZXRUYWlsTm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuaGVhZCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuaGVhZDtcbiAgICAgICAgd2hpbGUgKG5vZGUubmV4dCAhPSBudWxsKSB7XG4gICAgICAgICAgICBub2RlID0gbm9kZS5uZXh0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH07XG4gICAgcmV0dXJuIExpbmtlZExpc3Q7XG59KCkpO1xuZXhwb3J0cy5MaW5rZWRMaXN0ID0gTGlua2VkTGlzdDtcbi8qKlxuICogTWFwIGltcGxlbWVudGF0aW9uIGtleWVkIGJ5IHN0cmluZyAoYWx3YXlzKS5cbiAqL1xudmFyIFNpbXBsZU1hcCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2ltcGxlTWFwKCkge1xuICAgICAgICB0aGlzLmFycmF5ID0ge307XG4gICAgfVxuICAgIFNpbXBsZU1hcC5wcm90b3R5cGUucHV0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5hcnJheVtrZXldID0gdmFsdWU7XG4gICAgfTtcbiAgICBTaW1wbGVNYXAucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXJyYXlba2V5XTtcbiAgICB9O1xuICAgIFNpbXBsZU1hcC5wcm90b3R5cGUuZXhpc3RzID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLmFycmF5W2tleV07XG4gICAgICAgIHJldHVybiAodHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiKTtcbiAgICB9O1xuICAgIFNpbXBsZU1hcC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLmFycmF5W2tleV07XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmFycmF5W2tleV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG4gICAgU2ltcGxlTWFwLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIga2V5cyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5hcnJheSkge1xuICAgICAgICAgICAgLy8gVG8gcHJldmVudCByYW5kb20gc3R1ZmYgdG8gYXBwZWFyXG4gICAgICAgICAgICBpZiAodGhpcy5hcnJheS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGtleXM7XG4gICAgfTtcbiAgICBTaW1wbGVNYXAucHJvdG90eXBlLnZhbHVlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHZhbHVlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5hcnJheSkge1xuICAgICAgICAgICAgLy8gVG8gcHJldmVudCByYW5kb20gc3R1ZmYgdG8gYXBwZWFyXG4gICAgICAgICAgICBpZiAodGhpcy5hcnJheS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWVzLnB1c2godGhpcy5nZXQoa2V5KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9O1xuICAgIFNpbXBsZU1hcC5wcm90b3R5cGUuc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMua2V5cygpLmxlbmd0aDtcbiAgICB9O1xuICAgIFNpbXBsZU1hcC5wcm90b3R5cGUuaXNFbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6ZSgpID09PSAwO1xuICAgIH07XG4gICAgU2ltcGxlTWFwLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5hcnJheSA9IHt9O1xuICAgIH07XG4gICAgU2ltcGxlTWFwLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGNiRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIGNvdW50ID0gMDtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuYXJyYXkpIHtcbiAgICAgICAgICAgIC8vIFRvIHByZXZlbnQgcmFuZG9tIHN0dWZmIHRvIGFwcGVhclxuICAgICAgICAgICAgaWYgKHRoaXMuYXJyYXkuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRoaXMuYXJyYXlba2V5XTtcbiAgICAgICAgICAgICAgICBjYkZ1bmN0aW9uKGtleSwgdmFsdWUsIGNvdW50KTtcbiAgICAgICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBTaW1wbGVNYXAucHJvdG90eXBlLmZvckVhY2hWYWx1ZSA9IGZ1bmN0aW9uIChjYkZ1bmN0aW9uKSB7XG4gICAgICAgIHZhciBjb3VudCA9IDA7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmFycmF5KSB7XG4gICAgICAgICAgICAvLyBUbyBwcmV2ZW50IHJhbmRvbSBzdHVmZiB0byBhcHBlYXJcbiAgICAgICAgICAgIGlmICh0aGlzLmFycmF5Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLmFycmF5W2tleV07XG4gICAgICAgICAgICAgICAgY2JGdW5jdGlvbih2YWx1ZSwgY291bnQpO1xuICAgICAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBTaW1wbGVNYXA7XG59KCkpO1xuZXhwb3J0cy5TaW1wbGVNYXAgPSBTaW1wbGVNYXA7XG4vKipcbiAqIFR1cGxlIHRvIGhvbGQgdHdvIHZhbHVlcy5cbiAqL1xudmFyIFR1cGxlUGFpciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVHVwbGVQYWlyKHgsIHkpIHtcbiAgICAgICAgdGhpcy5feCA9IHg7XG4gICAgICAgIHRoaXMuX3kgPSB5O1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoVHVwbGVQYWlyLnByb3RvdHlwZSwgXCJ4XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5feDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ggPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFR1cGxlUGFpci5wcm90b3R5cGUsIFwieVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3k7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl95ID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIHJldHVybiBUdXBsZVBhaXI7XG59KCkpO1xuZXhwb3J0cy5UdXBsZVBhaXIgPSBUdXBsZVBhaXI7XG4vKipcbiAqIFV0aWxpdHkgY2xhc3MgdG8gYnVpbGQgdXAgYSBzdHJpbmcuXG4gKi9cbnZhciBTdHJpbmdCdWlsZGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdHJpbmdCdWlsZGVyKCkge1xuICAgICAgICB0aGlzLmRhdGEgPSBbXTtcbiAgICB9XG4gICAgU3RyaW5nQnVpbGRlci5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgaWYgKGxpbmUgPT09IHVuZGVmaW5lZCB8fCBsaW5lID09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlN0cmluZyBtdXN0IGJlIHNldCwgY2Fubm90IGFwcGVuZCBudWxsIG9yIHVuZGVmaW5lZFwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRhdGEucHVzaChsaW5lKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTdHJpbmdCdWlsZGVyLnByb3RvdHlwZS5hcHBlbmRMaW5lID0gZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgdGhpcy5kYXRhLnB1c2gobGluZSArIFwiXFxuXCIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFN0cmluZ0J1aWxkZXIucHJvdG90eXBlLmlzRW1wdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGEubGVuZ3RoID09PSAwO1xuICAgIH07XG4gICAgU3RyaW5nQnVpbGRlci5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IFtdO1xuICAgIH07XG4gICAgU3RyaW5nQnVpbGRlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoc2VwYXJhdG9yKSB7XG4gICAgICAgIGlmIChzZXBhcmF0b3IgPT09IHZvaWQgMCkgeyBzZXBhcmF0b3IgPSBcIlwiOyB9XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGEuam9pbihzZXBhcmF0b3IpO1xuICAgIH07XG4gICAgcmV0dXJuIFN0cmluZ0J1aWxkZXI7XG59KCkpO1xuZXhwb3J0cy5TdHJpbmdCdWlsZGVyID0gU3RyaW5nQnVpbGRlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPURhdGFTdHJ1Y3R1cmVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIE1vZHVsZSBjb250YWluaW5nIGJ1bmNoIG9mIEpTT04gcmVsYXRlZCBzdHVmZi5cbiAqL1xudmFyIExvZ2dlck9wdGlvbnNfMSA9IHJlcXVpcmUoXCIuLi9sb2cvTG9nZ2VyT3B0aW9uc1wiKTtcbnZhciBEYXRhU3RydWN0dXJlc18xID0gcmVxdWlyZShcIi4vRGF0YVN0cnVjdHVyZXNcIik7XG52YXIgSlNPTlR5cGVJbXBsID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBKU09OVHlwZUltcGwodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICB9XG4gICAgSlNPTlR5cGVJbXBsLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICAgIH07XG4gICAgSlNPTlR5cGVJbXBsLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gdGhpcy5nZXRWYWx1ZSgpO1xuICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFwibnVsbFwiO1xuICAgIH07XG4gICAgcmV0dXJuIEpTT05UeXBlSW1wbDtcbn0oKSk7XG52YXIgSlNPTkJvb2xlYW5UeXBlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoSlNPTkJvb2xlYW5UeXBlLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEpTT05Cb29sZWFuVHlwZSh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gX3N1cGVyLmNhbGwodGhpcywgdmFsdWUpIHx8IHRoaXM7XG4gICAgfVxuICAgIHJldHVybiBKU09OQm9vbGVhblR5cGU7XG59KEpTT05UeXBlSW1wbCkpO1xudmFyIEpTT05OdW1iZXJUeXBlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoSlNPTk51bWJlclR5cGUsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gSlNPTk51bWJlclR5cGUodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlci5jYWxsKHRoaXMsIHZhbHVlKSB8fCB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gSlNPTk51bWJlclR5cGU7XG59KEpTT05UeXBlSW1wbCkpO1xudmFyIEpTT05TdHJpbmdUeXBlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoSlNPTlN0cmluZ1R5cGUsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gSlNPTlN0cmluZ1R5cGUodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlci5jYWxsKHRoaXMsIHZhbHVlKSB8fCB0aGlzO1xuICAgIH1cbiAgICBKU09OU3RyaW5nVHlwZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IHRoaXMuZ2V0VmFsdWUoKTtcbiAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZS50b1N0cmluZygpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXCJudWxsXCI7XG4gICAgfTtcbiAgICByZXR1cm4gSlNPTlN0cmluZ1R5cGU7XG59KEpTT05UeXBlSW1wbCkpO1xudmFyIEpTT05PYmplY3RUeXBlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoSlNPTk9iamVjdFR5cGUsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gSlNPTk9iamVjdFR5cGUodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlci5jYWxsKHRoaXMsIHZhbHVlKSB8fCB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gSlNPTk9iamVjdFR5cGU7XG59KEpTT05UeXBlSW1wbCkpO1xudmFyIEpTT05BcnJheVR5cGUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhKU09OQXJyYXlUeXBlLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEpTT05BcnJheVR5cGUodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlci5jYWxsKHRoaXMsIHZhbHVlKSB8fCB0aGlzO1xuICAgIH1cbiAgICBKU09OQXJyYXlUeXBlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gdGhpcy5nZXRWYWx1ZSgpO1xuICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFwibnVsbFwiO1xuICAgIH07XG4gICAgcmV0dXJuIEpTT05BcnJheVR5cGU7XG59KEpTT05UeXBlSW1wbCkpO1xudmFyIEpTT05OdWxsVHlwZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEpTT05OdWxsVHlwZSwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBKU09OTnVsbFR5cGUoKSB7XG4gICAgICAgIHJldHVybiBfc3VwZXIuY2FsbCh0aGlzLCBudWxsKSB8fCB0aGlzO1xuICAgIH1cbiAgICBKU09OTnVsbFR5cGUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJudWxsXCI7XG4gICAgfTtcbiAgICByZXR1cm4gSlNPTk51bGxUeXBlO1xufShKU09OVHlwZUltcGwpKTtcbnZhciBKU09OVHlwZUNvbnZlcnRlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSlNPTlR5cGVDb252ZXJ0ZXIoKSB7XG4gICAgfVxuICAgIEpTT05UeXBlQ29udmVydGVyLnRvSlNPTlR5cGUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEpTT05OdWxsVHlwZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgSlNPTlN0cmluZ1R5cGUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgSlNPTk51bWJlclR5cGUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEpTT05Cb29sZWFuVHlwZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgSlNPTk9iamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBKU09OT2JqZWN0VHlwZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVHlwZSBub3Qgc3VwcG9ydGVkIGZvciB2YWx1ZTogXCIgKyB2YWx1ZSk7XG4gICAgfTtcbiAgICByZXR1cm4gSlNPTlR5cGVDb252ZXJ0ZXI7XG59KCkpO1xudmFyIEpTT05PYmplY3QgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEpTT05PYmplY3QoKSB7XG4gICAgICAgIHRoaXMudmFsdWVzID0gbmV3IERhdGFTdHJ1Y3R1cmVzXzEuU2ltcGxlTWFwKCk7XG4gICAgfVxuICAgIEpTT05PYmplY3QucHJvdG90eXBlLmFkZEJvb2xlYW4gPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5jaGVja05hbWUobmFtZSk7XG4gICAgICAgIEpTT05PYmplY3QuY2hlY2tWYWx1ZSh2YWx1ZSk7XG4gICAgICAgIHRoaXMudmFsdWVzLnB1dChuYW1lLCBuZXcgSlNPTkJvb2xlYW5UeXBlKHZhbHVlKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgSlNPTk9iamVjdC5wcm90b3R5cGUuYWRkTnVtYmVyID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuY2hlY2tOYW1lKG5hbWUpO1xuICAgICAgICBKU09OT2JqZWN0LmNoZWNrVmFsdWUodmFsdWUpO1xuICAgICAgICB0aGlzLnZhbHVlcy5wdXQobmFtZSwgbmV3IEpTT05OdW1iZXJUeXBlKHZhbHVlKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgSlNPTk9iamVjdC5wcm90b3R5cGUuYWRkU3RyaW5nID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuY2hlY2tOYW1lKG5hbWUpO1xuICAgICAgICBKU09OT2JqZWN0LmNoZWNrVmFsdWUodmFsdWUpO1xuICAgICAgICB0aGlzLnZhbHVlcy5wdXQobmFtZSwgbmV3IEpTT05TdHJpbmdUeXBlKHZhbHVlKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgSlNPTk9iamVjdC5wcm90b3R5cGUuYWRkTnVsbCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHRoaXMuY2hlY2tOYW1lKG5hbWUpO1xuICAgICAgICB0aGlzLnZhbHVlcy5wdXQobmFtZSwgbmV3IEpTT05OdWxsVHlwZSgpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBKU09OT2JqZWN0LnByb3RvdHlwZS5hZGRBcnJheSA9IGZ1bmN0aW9uIChuYW1lLCBhcnJheSkge1xuICAgICAgICB0aGlzLmNoZWNrTmFtZShuYW1lKTtcbiAgICAgICAgSlNPTk9iamVjdC5jaGVja1ZhbHVlKGFycmF5KTtcbiAgICAgICAgaWYgKGFycmF5ID09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBhZGQgYXJyYXkgYXMgbnVsbFwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZhbHVlcy5wdXQobmFtZSwgbmV3IEpTT05BcnJheVR5cGUoYXJyYXkpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBKU09OT2JqZWN0LnByb3RvdHlwZS5hZGRPYmplY3QgPSBmdW5jdGlvbiAobmFtZSwgb2JqZWN0KSB7XG4gICAgICAgIHRoaXMuY2hlY2tOYW1lKG5hbWUpO1xuICAgICAgICBKU09OT2JqZWN0LmNoZWNrVmFsdWUob2JqZWN0KTtcbiAgICAgICAgaWYgKG9iamVjdCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgYWRkIG9iamVjdCBhcyBudWxsXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudmFsdWVzLnB1dChuYW1lLCBuZXcgSlNPTk9iamVjdFR5cGUob2JqZWN0KSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgSlNPTk9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAocHJldHR5KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChwcmV0dHkgPT09IHZvaWQgMCkgeyBwcmV0dHkgPSBmYWxzZTsgfVxuICAgICAgICB2YXIgY29tbWEgPSBmYWxzZTtcbiAgICAgICAgdmFyIGJ1ZmZlciA9IG5ldyBEYXRhU3RydWN0dXJlc18xLlN0cmluZ0J1aWxkZXIoKTtcbiAgICAgICAgYnVmZmVyLmFwcGVuZChcIntcIik7XG4gICAgICAgIHRoaXMudmFsdWVzLmtleXMoKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IF90aGlzLnZhbHVlcy5nZXQoa2V5KTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbW1hKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlci5hcHBlbmQoXCIsXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBidWZmZXIuYXBwZW5kKCdcIicpLmFwcGVuZChrZXkpLmFwcGVuZCgnXCI6JykuYXBwZW5kKHZhbHVlLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgIGNvbW1hID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGJ1ZmZlci5hcHBlbmQoXCJ9XCIpO1xuICAgICAgICByZXR1cm4gYnVmZmVyLnRvU3RyaW5nKCk7XG4gICAgfTtcbiAgICBKU09OT2JqZWN0LnByb3RvdHlwZS5jaGVja05hbWUgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICBpZiAobmFtZSA9PSBudWxsIHx8IG5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTmFtZSBpcyBudWxsIG9yIHVuZGVmaW5lZFwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy52YWx1ZXMuZXhpc3RzKG5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOYW1lIFwiICsgbmFtZSArIFwiIGlzIGFscmVhZHkgcHJlc2VudCBmb3IgdGhpcyBvYmplY3RcIik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEpTT05PYmplY3QuY2hlY2tWYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVmFsdWUgaXMgdW5kZWZpbmVkXCIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gSlNPTk9iamVjdDtcbn0oKSk7XG5leHBvcnRzLkpTT05PYmplY3QgPSBKU09OT2JqZWN0O1xudmFyIEpTT05BcnJheSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSlNPTkFycmF5KCkge1xuICAgICAgICB0aGlzLm9iamVjdHMgPSBbXTtcbiAgICB9XG4gICAgSlNPTkFycmF5LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgICAgIGlmIChvYmplY3QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT2JqZWN0IGlzIG5vdCBhbGxvd2VkIHRvIGJlIHVuZGVmaW5lZFwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9iamVjdHMucHVzaChKU09OVHlwZUNvbnZlcnRlci50b0pTT05UeXBlKG9iamVjdCkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIEpTT05BcnJheS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAocHJldHR5KSB7XG4gICAgICAgIGlmIChwcmV0dHkgPT09IHZvaWQgMCkgeyBwcmV0dHkgPSBmYWxzZTsgfVxuICAgICAgICB2YXIgYnVmZmVyID0gbmV3IERhdGFTdHJ1Y3R1cmVzXzEuU3RyaW5nQnVpbGRlcigpO1xuICAgICAgICBidWZmZXIuYXBwZW5kKFwiW1wiKTtcbiAgICAgICAgdGhpcy5vYmplY3RzLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKGluZGV4ID4gMCkge1xuICAgICAgICAgICAgICAgIGJ1ZmZlci5hcHBlbmQoXCIsXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnVmZmVyLmFwcGVuZCh2YWx1ZS50b1N0cmluZygpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ1ZmZlci5hcHBlbmQoXCJdXCIpO1xuICAgICAgICByZXR1cm4gYnVmZmVyLnRvU3RyaW5nKCk7XG4gICAgfTtcbiAgICByZXR1cm4gSlNPTkFycmF5O1xufSgpKTtcbmV4cG9ydHMuSlNPTkFycmF5ID0gSlNPTkFycmF5O1xuLyoqXG4gKiBVdGlsaXR5IGNsYXNzIHRoYXQgaGVscHMgdXMgY29udmVydCB0aGluZ3MgdG8gYW5kIGZyb20ganNvbiAobm90IGZvciBub3JtYWwgdXNhZ2UpLlxuICovXG52YXIgSlNPTkhlbHBlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSlNPTkhlbHBlcigpIHtcbiAgICB9XG4gICAgSlNPTkhlbHBlci5jYXRlZ29yeVRvSlNPTiA9IGZ1bmN0aW9uIChjYXQsIHJlY3Vyc2l2ZSkge1xuICAgICAgICAvKlxuICAgICAgICAge1xuICAgICAgICAgXCJjYXRlZ29yaWVzXCI6XG4gICAgICAgICBbXG4gICAgICAgICB7IGlkPTEsXG4gICAgICAgICBuYW1lOiBcInhcIixcbiAgICAgICAgIHBhcmVudDogbnVsbCxcbiAgICAgICAgIGxvZ0xldmVsOiBcIkVycm9yXCJcbiAgICAgICAgIH0sXG4gICAgICAgICB7IGlkPTIsXG4gICAgICAgICBuYW1lOiBcInlcIixcbiAgICAgICAgIHBhcmVudDogMSxcbiAgICAgICAgIGxvZ0xldmVsOiBcIkVycm9yXCJcbiAgICAgICAgIH1cbiAgICAgICAgIF1cbiAgICAgICAgIH1cbiAgICAgICAgICovXG4gICAgICAgIHZhciBhcnIgPSBuZXcgSlNPTkFycmF5KCk7XG4gICAgICAgIEpTT05IZWxwZXIuX2NhdGVnb3J5VG9KU09OKGNhdCwgYXJyLCByZWN1cnNpdmUpO1xuICAgICAgICB2YXIgb2JqZWN0ID0gbmV3IEpTT05PYmplY3QoKTtcbiAgICAgICAgb2JqZWN0LmFkZEFycmF5KFwiY2F0ZWdvcmllc1wiLCBhcnIpO1xuICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgIH07XG4gICAgSlNPTkhlbHBlci5fY2F0ZWdvcnlUb0pTT04gPSBmdW5jdGlvbiAoY2F0LCBhcnIsIHJlY3Vyc2l2ZSkge1xuICAgICAgICB2YXIgb2JqZWN0ID0gbmV3IEpTT05PYmplY3QoKTtcbiAgICAgICAgb2JqZWN0LmFkZE51bWJlcihcImlkXCIsIGNhdC5pZCk7XG4gICAgICAgIG9iamVjdC5hZGRTdHJpbmcoXCJuYW1lXCIsIGNhdC5uYW1lKTtcbiAgICAgICAgb2JqZWN0LmFkZFN0cmluZyhcImxvZ0xldmVsXCIsIExvZ2dlck9wdGlvbnNfMS5Mb2dMZXZlbFtjYXQubG9nTGV2ZWxdLnRvU3RyaW5nKCkpO1xuICAgICAgICBpZiAoY2F0LnBhcmVudCAhPSBudWxsKSB7XG4gICAgICAgICAgICBvYmplY3QuYWRkTnVtYmVyKFwicGFyZW50XCIsIGNhdC5wYXJlbnQuaWQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgb2JqZWN0LmFkZE51bGwoXCJwYXJlbnRcIik7XG4gICAgICAgIH1cbiAgICAgICAgYXJyLmFkZChvYmplY3QpO1xuICAgICAgICBpZiAocmVjdXJzaXZlKSB7XG4gICAgICAgICAgICBjYXQuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAgICAgICAgICAgICBKU09OSGVscGVyLl9jYXRlZ29yeVRvSlNPTihjaGlsZCwgYXJyLCByZWN1cnNpdmUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBKU09OSGVscGVyO1xufSgpKTtcbmV4cG9ydHMuSlNPTkhlbHBlciA9IEpTT05IZWxwZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1KU09OSGVscGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFNUID0gcmVxdWlyZShcInN0YWNrdHJhY2UtanNcIik7XG52YXIgTG9nZ2VyT3B0aW9uc18xID0gcmVxdWlyZShcIi4uL2xvZy9Mb2dnZXJPcHRpb25zXCIpO1xuLyoqXG4gKiBTb21lIHV0aWxpdGllcyB0byBmb3JtYXQgbWVzc2FnZXMuXG4gKi9cbnZhciBNZXNzYWdlRm9ybWF0VXRpbHMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE1lc3NhZ2VGb3JtYXRVdGlscygpIHtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVuZGVyIGdpdmVuIGRhdGUgaW4gZ2l2ZW4gRGF0ZUZvcm1hdCBhbmQgcmV0dXJuIGFzIFN0cmluZy5cbiAgICAgKiBAcGFyYW0gZGF0ZSBEYXRlXG4gICAgICogQHBhcmFtIGRhdGVGb3JtYXQgRm9ybWF0XG4gICAgICogQHJldHVybnMge3N0cmluZ30gRm9ybWF0dGVkIGRhdGVcbiAgICAgKi9cbiAgICBNZXNzYWdlRm9ybWF0VXRpbHMucmVuZGVyRGF0ZSA9IGZ1bmN0aW9uIChkYXRlLCBkYXRlRm9ybWF0KSB7XG4gICAgICAgIHZhciBscGFkID0gZnVuY3Rpb24gKHZhbHVlLCBjaGFycywgcGFkV2l0aCkge1xuICAgICAgICAgICAgdmFyIGhvd01hbnkgPSBjaGFycyAtIHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgIGlmIChob3dNYW55ID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciByZXMgPSBcIlwiO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaG93TWFueTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcyArPSBwYWRXaXRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXMgKz0gdmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGZ1bGxZZWFyID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBscGFkKGQuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpLCA0LCBcIjBcIik7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBtb250aCA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gbHBhZCgoZC5nZXRNb250aCgpICsgMSkudG9TdHJpbmcoKSwgMiwgXCIwXCIpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZGF5ID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBscGFkKGQuZ2V0RGF0ZSgpLnRvU3RyaW5nKCksIDIsIFwiMFwiKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGhvdXJzID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBscGFkKGQuZ2V0SG91cnMoKS50b1N0cmluZygpLCAyLCBcIjBcIik7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBtaW51dGVzID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBscGFkKGQuZ2V0TWludXRlcygpLnRvU3RyaW5nKCksIDIsIFwiMFwiKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHNlY29uZHMgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIGxwYWQoZC5nZXRTZWNvbmRzKCkudG9TdHJpbmcoKSwgMiwgXCIwXCIpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgbWlsbGlzID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBscGFkKGQuZ2V0TWlsbGlzZWNvbmRzKCkudG9TdHJpbmcoKSwgMywgXCIwXCIpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZGF0ZVNlcGFyYXRvciA9IGRhdGVGb3JtYXQuZGF0ZVNlcGFyYXRvcjtcbiAgICAgICAgdmFyIGRzID0gXCJcIjtcbiAgICAgICAgc3dpdGNoIChkYXRlRm9ybWF0LmZvcm1hdEVudW0pIHtcbiAgICAgICAgICAgIGNhc2UgTG9nZ2VyT3B0aW9uc18xLkRhdGVGb3JtYXRFbnVtLkRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgLy8geXl5eS1tbS1kZCBoaDptbTpzcyxtXG4gICAgICAgICAgICAgICAgZHMgPSBmdWxsWWVhcihkYXRlKSArIGRhdGVTZXBhcmF0b3IgKyBtb250aChkYXRlKSArIGRhdGVTZXBhcmF0b3IgKyBkYXkoZGF0ZSkgKyBcIiBcIiArXG4gICAgICAgICAgICAgICAgICAgIGhvdXJzKGRhdGUpICsgXCI6XCIgKyBtaW51dGVzKGRhdGUpICsgXCI6XCIgKyBzZWNvbmRzKGRhdGUpICsgXCIsXCIgKyBtaWxsaXMoZGF0ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIExvZ2dlck9wdGlvbnNfMS5EYXRlRm9ybWF0RW51bS5ZZWFyTW9udGhEYXlUaW1lOlxuICAgICAgICAgICAgICAgIGRzID0gZnVsbFllYXIoZGF0ZSkgKyBkYXRlU2VwYXJhdG9yICsgbW9udGgoZGF0ZSkgKyBkYXRlU2VwYXJhdG9yICsgZGF5KGRhdGUpICsgXCIgXCIgK1xuICAgICAgICAgICAgICAgICAgICBob3VycyhkYXRlKSArIFwiOlwiICsgbWludXRlcyhkYXRlKSArIFwiOlwiICsgc2Vjb25kcyhkYXRlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTG9nZ2VyT3B0aW9uc18xLkRhdGVGb3JtYXRFbnVtLlllYXJEYXlNb250aFdpdGhGdWxsVGltZTpcbiAgICAgICAgICAgICAgICBkcyA9IGZ1bGxZZWFyKGRhdGUpICsgZGF0ZVNlcGFyYXRvciArIGRheShkYXRlKSArIGRhdGVTZXBhcmF0b3IgKyBtb250aChkYXRlKSArIFwiIFwiICtcbiAgICAgICAgICAgICAgICAgICAgaG91cnMoZGF0ZSkgKyBcIjpcIiArIG1pbnV0ZXMoZGF0ZSkgKyBcIjpcIiArIHNlY29uZHMoZGF0ZSkgKyBcIixcIiArIG1pbGxpcyhkYXRlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTG9nZ2VyT3B0aW9uc18xLkRhdGVGb3JtYXRFbnVtLlllYXJEYXlNb250aFRpbWU6XG4gICAgICAgICAgICAgICAgZHMgPSBmdWxsWWVhcihkYXRlKSArIGRhdGVTZXBhcmF0b3IgKyBkYXkoZGF0ZSkgKyBkYXRlU2VwYXJhdG9yICsgbW9udGgoZGF0ZSkgKyBcIiBcIiArXG4gICAgICAgICAgICAgICAgICAgIGhvdXJzKGRhdGUpICsgXCI6XCIgKyBtaW51dGVzKGRhdGUpICsgXCI6XCIgKyBzZWNvbmRzKGRhdGUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnN1cHBvcnRlZCBkYXRlIGZvcm1hdCBlbnVtOiBcIiArIGRhdGVGb3JtYXQuZm9ybWF0RW51bSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRzO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmVuZGVycyBnaXZlbiBjYXRlZ29yeSBsb2cgbWVzc2FnZSBpbiBkZWZhdWx0IGZvcm1hdC5cbiAgICAgKiBAcGFyYW0gbXNnIE1lc3NhZ2UgdG8gZm9ybWF0XG4gICAgICogQHBhcmFtIGFkZFN0YWNrIElmIHRydWUgYWRkcyB0aGUgc3RhY2sgdG8gdGhlIG91dHB1dCwgb3RoZXJ3aXNlIHNraXBzIGl0XG4gICAgICogQHJldHVybnMge3N0cmluZ30gRm9ybWF0dGVkIG1lc3NhZ2VcbiAgICAgKi9cbiAgICBNZXNzYWdlRm9ybWF0VXRpbHMucmVuZGVyRGVmYXVsdE1lc3NhZ2UgPSBmdW5jdGlvbiAobXNnLCBhZGRTdGFjaykge1xuICAgICAgICB2YXIgcmVzdWx0ID0gXCJcIjtcbiAgICAgICAgdmFyIGxvZ0Zvcm1hdCA9IG1zZy5sb2dGb3JtYXQ7XG4gICAgICAgIGlmIChsb2dGb3JtYXQuc2hvd1RpbWVTdGFtcCkge1xuICAgICAgICAgICAgcmVzdWx0ICs9IE1lc3NhZ2VGb3JtYXRVdGlscy5yZW5kZXJEYXRlKG1zZy5kYXRlLCBsb2dGb3JtYXQuZGF0ZUZvcm1hdCkgKyBcIiBcIjtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgKz0gTG9nZ2VyT3B0aW9uc18xLkxvZ0xldmVsW21zZy5sZXZlbF0udG9VcHBlckNhc2UoKTtcbiAgICAgICAgaWYgKG1zZy5pc1Jlc29sdmVkRXJyb3JNZXNzYWdlKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gXCIgKHJlc29sdmVkKVwiO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCArPSBcIiBcIjtcbiAgICAgICAgaWYgKGxvZ0Zvcm1hdC5zaG93Q2F0ZWdvcnlOYW1lKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gXCJbXCI7XG4gICAgICAgICAgICBtc2cuY2F0ZWdvcmllcy5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwgaWR4KSB7XG4gICAgICAgICAgICAgICAgaWYgKGlkeCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IFwiLCBcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IHZhbHVlLm5hbWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJlc3VsdCArPSBcIl1cIjtcbiAgICAgICAgfVxuICAgICAgICAvLyBHZXQgdGhlIG5vcm1hbCBzdHJpbmcgbWVzc2FnZSBmaXJzdFxuICAgICAgICB2YXIgYWN0dWFsU3RyaW5nTXNnID0gXCJcIjtcbiAgICAgICAgdmFyIGRhdGFTdHJpbmcgPSBcIlwiO1xuICAgICAgICB2YXIgbWVzc2FnZU9yTG9nRGF0YSA9IG1zZy5tZXNzYWdlO1xuICAgICAgICBpZiAodHlwZW9mIG1lc3NhZ2VPckxvZ0RhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGFjdHVhbFN0cmluZ01zZyA9IG1lc3NhZ2VPckxvZ0RhdGE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgbG9nRGF0YSA9IG1lc3NhZ2VPckxvZ0RhdGE7XG4gICAgICAgICAgICBhY3R1YWxTdHJpbmdNc2cgPSBsb2dEYXRhLm1zZztcbiAgICAgICAgICAgIC8vIFdlIGRvIGhhdmUgZGF0YT9cbiAgICAgICAgICAgIGlmIChsb2dEYXRhLmRhdGEpIHtcbiAgICAgICAgICAgICAgICBkYXRhU3RyaW5nID0gXCIgW2RhdGFdOiBcIiArIChsb2dEYXRhLmRzID8gbG9nRGF0YS5kcyhsb2dEYXRhLmRhdGEpIDogSlNPTi5zdHJpbmdpZnkobG9nRGF0YS5kYXRhKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ICs9IFwiIFwiICsgYWN0dWFsU3RyaW5nTXNnICsgXCJcIiArIGRhdGFTdHJpbmc7XG4gICAgICAgIGlmIChhZGRTdGFjayAmJiBtc2cuZXJyb3JBc1N0YWNrICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gXCJcXG5cIiArIG1zZy5lcnJvckFzU3RhY2s7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlbmRlcnMgZ2l2ZW4gbG9nNGogbG9nIG1lc3NhZ2UgaW4gZGVmYXVsdCBmb3JtYXQuXG4gICAgICogQHBhcmFtIG1zZyBNZXNzYWdlIHRvIGZvcm1hdFxuICAgICAqIEBwYXJhbSBhZGRTdGFjayBJZiB0cnVlIGFkZHMgdGhlIHN0YWNrIHRvIHRoZSBvdXRwdXQsIG90aGVyd2lzZSBza2lwcyBpdFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IEZvcm1hdHRlZCBtZXNzYWdlXG4gICAgICovXG4gICAgTWVzc2FnZUZvcm1hdFV0aWxzLnJlbmRlckRlZmF1bHRMb2c0ak1lc3NhZ2UgPSBmdW5jdGlvbiAobXNnLCBhZGRTdGFjaykge1xuICAgICAgICB2YXIgZm9ybWF0ID0gbXNnLmxvZ0dyb3VwUnVsZS5sb2dGb3JtYXQ7XG4gICAgICAgIHZhciByZXN1bHQgPSBcIlwiO1xuICAgICAgICBpZiAoZm9ybWF0LnNob3dUaW1lU3RhbXApIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBNZXNzYWdlRm9ybWF0VXRpbHMucmVuZGVyRGF0ZShtc2cuZGF0ZSwgZm9ybWF0LmRhdGVGb3JtYXQpICsgXCIgXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ICs9IExvZ2dlck9wdGlvbnNfMS5Mb2dMZXZlbFttc2cubGV2ZWxdLnRvVXBwZXJDYXNlKCkgKyBcIiBcIjtcbiAgICAgICAgaWYgKGZvcm1hdC5zaG93TG9nZ2VyTmFtZSkge1xuICAgICAgICAgICAgcmVzdWx0ICs9IFwiW1wiICsgbXNnLmxvZ2dlck5hbWUgKyBcIl1cIjtcbiAgICAgICAgfVxuICAgICAgICAvLyBHZXQgdGhlIG5vcm1hbCBzdHJpbmcgbWVzc2FnZSBmaXJzdFxuICAgICAgICB2YXIgYWN0dWFsU3RyaW5nTXNnID0gXCJcIjtcbiAgICAgICAgdmFyIGRhdGFTdHJpbmcgPSBcIlwiO1xuICAgICAgICBpZiAodHlwZW9mIG1zZy5tZXNzYWdlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBhY3R1YWxTdHJpbmdNc2cgPSBtc2cubWVzc2FnZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBsb2dEYXRhID0gbXNnLm1lc3NhZ2U7XG4gICAgICAgICAgICBhY3R1YWxTdHJpbmdNc2cgPSBsb2dEYXRhLm1zZztcbiAgICAgICAgICAgIC8vIFdlIGRvIGhhdmUgZGF0YT9cbiAgICAgICAgICAgIGlmIChsb2dEYXRhLmRhdGEpIHtcbiAgICAgICAgICAgICAgICBkYXRhU3RyaW5nID0gXCIgW2RhdGFdOiBcIiArIChsb2dEYXRhLmRzID8gbG9nRGF0YS5kcyhsb2dEYXRhLmRhdGEpIDogSlNPTi5zdHJpbmdpZnkobG9nRGF0YS5kYXRhKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ICs9IFwiIFwiICsgYWN0dWFsU3RyaW5nTXNnICsgXCJcIiArIGRhdGFTdHJpbmc7XG4gICAgICAgIGlmIChhZGRTdGFjayAmJiBtc2cuZXJyb3JBc1N0YWNrICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gXCJcXG5cIiArIG1zZy5lcnJvckFzU3RhY2s7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlbmRlciBlcnJvciBhcyBzdGFja1xuICAgICAqIEBwYXJhbSBlcnJvciBSZXR1cm4gZXJyb3IgYXMgUHJvbWlzZVxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZz58UHJvbWlzZX0gUHJvbWlzZSBmb3Igc3RhY2tcbiAgICAgKi9cbiAgICBNZXNzYWdlRm9ybWF0VXRpbHMucmVuZGVyRXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGVycm9yLm5hbWUgKyBcIjogXCIgKyBlcnJvci5tZXNzYWdlICsgXCJcXG5AXCI7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgLy8gVGhpcyBvbmUgaGFzIGEgcHJvbWlzZSB0b29cbiAgICAgICAgICAgIFNULmZyb21FcnJvcihlcnJvciwgeyBvZmZsaW5lOiB0cnVlIH0pLnRoZW4oZnVuY3Rpb24gKGZyYW1lcykge1xuICAgICAgICAgICAgICAgIHZhciBzdGFja1N0ciA9IChmcmFtZXMubWFwKGZ1bmN0aW9uIChmcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnJhbWUudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB9KSkuam9pbihcIlxcbiAgXCIpO1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBcIlxcblwiICsgc3RhY2tTdHI7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyByZXNvbHZlcyBvdXIgcmV0dXJuZWQgcHJvbWlzZVxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBcIlVuZXhwZWN0ZWQgZXJyb3Igb2JqZWN0IHdhcyBwYXNzZWQgaW4uIFwiO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBcIkNvdWxkIG5vdCByZXNvbHZlIGl0LCBzdHJpbmdpZmllZCBvYmplY3Q6IFwiICsgSlNPTi5zdHJpbmdpZnkoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBDYW5ub3Qgc3RyaW5naWZ5IGNhbiBvbmx5IHRlbGwgc29tZXRoaW5nIHdhcyB3cm9uZy5cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IFwiQ291bGQgbm90IHJlc29sdmUgaXQgb3Igc3RyaW5naWZ5IGl0LlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gTWVzc2FnZUZvcm1hdFV0aWxzO1xufSgpKTtcbmV4cG9ydHMuTWVzc2FnZUZvcm1hdFV0aWxzID0gTWVzc2FnZUZvcm1hdFV0aWxzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9TWVzc2FnZVV0aWxzLmpzLm1hcCIsImltcG9ydCBcIi4vd2luZG93L29uRXJyb3IuanNcIjtcclxuIiwidmFyIE5PX0VSUk9SID0gLTEsIFRFU1QgPSAwO1xyXG52YXIgRXJyb3JDb2RlID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIEVycm9yQ29kZSgpIHtcclxuICAgIH1cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFcnJvckNvZGUsIFwiTk9fRVJST1JcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gTk9fRVJST1I7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEVycm9yQ29kZSwgXCJURVNUXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFRFU1Q7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIEVycm9yQ29kZTtcclxufSgpKTtcclxuZXhwb3J0IHsgRXJyb3JDb2RlIH07XHJcbiIsInZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24gKGQsIGIpIHtcclxuICAgICAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XHJcbiAgICAgICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcclxuICAgICAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGIsIHApKSBkW3BdID0gYltwXTsgfTtcclxuICAgICAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGIgIT09IFwiZnVuY3Rpb25cIiAmJiBiICE9PSBudWxsKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2xhc3MgZXh0ZW5kcyB2YWx1ZSBcIiArIFN0cmluZyhiKSArIFwiIGlzIG5vdCBhIGNvbnN0cnVjdG9yIG9yIG51bGxcIik7XHJcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cclxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5pbXBvcnQgeyBFcnJvckNvZGUgfSBmcm9tIFwiLi9lcnJvckNvZGVcIjtcclxuaW1wb3J0IHsgRXJyb3JNZXNzYWdlcyB9IGZyb20gXCIuL2Vycm9yTWVzc2FnZXNcIjtcclxuaW1wb3J0IHsgRXJyb3JUeXBlIH0gZnJvbSBcIi4vZXJyb3JUeXBlLmpzXCI7XHJcbnZhciBFcnJvckN1c3RvbSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XHJcbiAgICBfX2V4dGVuZHMoRXJyb3JDdXN0b20sIF9zdXBlcik7XHJcbiAgICBmdW5jdGlvbiBFcnJvckN1c3RvbSh0eXBlLCBjb2RlLCBtZXNzYWdlKSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcclxuICAgICAgICBfdGhpcy5uYW1lID0gXCJFcnJvckN1c3RvbVwiO1xyXG4gICAgICAgIF90aGlzLnR5cGUgPSB0eXBlO1xyXG4gICAgICAgIF90aGlzLmNvZGUgPSBjb2RlO1xyXG4gICAgICAgIF90aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xyXG4gICAgICAgIHJldHVybiBfdGhpcztcclxuICAgIH1cclxuICAgIEVycm9yQ3VzdG9tLmdldExvZ0Vycm9yTWVzc2FnZSA9IGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgIHJldHVybiBcIkVycm9yIC0gdHlwZSBcIiArIEVycm9yVHlwZVtlcnJvci50eXBlXSArIFwiIC0gY29kZSBcIiArIGVycm9yLmNvZGUgKyBcIiAtIFwiICsgZXJyb3IubWVzc2FnZTtcclxuICAgIH07XHJcbiAgICBFcnJvckN1c3RvbS5wcm90b3R5cGUuZ2V0TG9nRXJyb3JNZXNzYWdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBFcnJvckN1c3RvbS5nZXRMb2dFcnJvck1lc3NhZ2UodGhpcyk7XHJcbiAgICB9O1xyXG4gICAgRXJyb3JDdXN0b20uZ2V0U29sdmVkRXJyb3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBFcnJvckN1c3RvbShFcnJvclR5cGUuTm9uZSwgRXJyb3JDb2RlLk5PX0VSUk9SLCBFcnJvck1lc3NhZ2VzLkVNUFRZKTtcclxuICAgIH07XHJcbiAgICBFcnJvckN1c3RvbS5pc1NvbHZlZCA9IGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgIHJldHVybiBlcnJvci50eXBlID09PSBFcnJvclR5cGUuTm9uZSAmJiBlcnJvci5jb2RlID09PSBFcnJvckNvZGUuTk9fRVJST1IgJiYgZXJyb3IubWVzc2FnZSA9PT0gRXJyb3JNZXNzYWdlcy5FTVBUWTtcclxuICAgIH07XHJcbiAgICBFcnJvckN1c3RvbS5wcm90b3R5cGUuaXNTb2x2ZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIEVycm9yQ3VzdG9tLmlzU29sdmVkKHRoaXMpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBFcnJvckN1c3RvbTtcclxufShFcnJvcikpO1xyXG5leHBvcnQgeyBFcnJvckN1c3RvbSB9O1xyXG4iLCJ2YXIgRU1QVFkgPSBcIlwiLCBURVNUID0gXCJ0ZXN0IGVycm9yIG1lc3NhZ2VcIjtcclxudmFyIEVycm9yTWVzc2FnZXMgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gRXJyb3JNZXNzYWdlcygpIHtcclxuICAgIH1cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFcnJvck1lc3NhZ2VzLCBcIlRFU1RcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gVEVTVDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXJyb3JNZXNzYWdlcywgXCJFTVBUWVwiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBFTVBUWTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gRXJyb3JNZXNzYWdlcztcclxufSgpKTtcclxuZXhwb3J0IHsgRXJyb3JNZXNzYWdlcyB9O1xyXG4iLCJpbXBvcnQgeyBFcnJvckN1c3RvbSB9IGZyb20gXCIuL2Vycm9yQ3VzdG9tLmpzXCI7XHJcbmltcG9ydCB7IFR5cGVIZWxwZXIgfSBmcm9tIFwiLi8uLi9oZWxwZXJzL1R5cGVIZWxwZXIuanNcIjtcclxudmFyIEVycm9yU2VydmljZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBFcnJvclNlcnZpY2UoKSB7XHJcbiAgICB9XHJcbiAgICBFcnJvclNlcnZpY2UuZ2V0RXJyb3JUeXBlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBFcnJvclNlcnZpY2UuZXJyb3JDdXN0b20udHlwZTtcclxuICAgIH07XHJcbiAgICBFcnJvclNlcnZpY2UuZ2V0RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBFcnJvclNlcnZpY2UuZXJyb3JDdXN0b20ubWVzc2FnZTtcclxuICAgIH07XHJcbiAgICBFcnJvclNlcnZpY2UuZ2V0RXJyb3JDb2RlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBFcnJvclNlcnZpY2UuZXJyb3JDdXN0b20uY29kZTtcclxuICAgIH07XHJcbiAgICBFcnJvclNlcnZpY2Uuc2V0RXJyb3IgPSBmdW5jdGlvbiAodHlwZSwgY29kZSwgbWVzc2FnZSkge1xyXG4gICAgICAgIEVycm9yU2VydmljZS5lcnJvckN1c3RvbSA9IG5ldyBFcnJvckN1c3RvbSh0eXBlLCBjb2RlLCBtZXNzYWdlKTtcclxuICAgIH07XHJcbiAgICBFcnJvclNlcnZpY2Uuc2V0RXJyb3JDdXN0b20gPSBmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgICAgICBFcnJvclNlcnZpY2UuZXJyb3JDdXN0b20gPSBlcnJvcjtcclxuICAgIH07XHJcbiAgICBFcnJvclNlcnZpY2UuZGVhbHRXaXRoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIEVycm9yU2VydmljZS5lcnJvckN1c3RvbSA9IEVycm9yQ3VzdG9tLmdldFNvbHZlZEVycm9yKCk7XHJcbiAgICB9O1xyXG4gICAgRXJyb3JTZXJ2aWNlLmRlYWxXaXRoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciByZXMgPSBuZXcgRXJyb3JDdXN0b20oRXJyb3JTZXJ2aWNlLmdldEVycm9yVHlwZSgpLCBFcnJvclNlcnZpY2UuZ2V0RXJyb3JDb2RlKCksIEVycm9yU2VydmljZS5nZXRFcnJvck1lc3NhZ2UoKSk7XHJcbiAgICAgICAgRXJyb3JTZXJ2aWNlLmRlYWx0V2l0aCgpO1xyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9O1xyXG4gICAgRXJyb3JTZXJ2aWNlLmVycm9yQ3VzdG9tID0gRXJyb3JDdXN0b20uZ2V0U29sdmVkRXJyb3IoKTtcclxuICAgIHJldHVybiBFcnJvclNlcnZpY2U7XHJcbn0oKSk7XHJcbmV4cG9ydCB7IEVycm9yU2VydmljZSB9O1xyXG5leHBvcnQgdmFyIGVycm9yU2VydmljZUxvYWRlciA9IGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgaWYgKFR5cGVIZWxwZXIuaXNFcnJvckN1c3RvbShlcnJvcikpIHtcclxuICAgICAgICB2YXIgZXJyb3JDdXN0b20gPSBlcnJvcjtcclxuICAgICAgICBFcnJvclNlcnZpY2Uuc2V0RXJyb3JDdXN0b20oZXJyb3JDdXN0b20pO1xyXG4gICAgfVxyXG59O1xyXG4iLCJleHBvcnQgdmFyIEVycm9yVHlwZTtcclxuKGZ1bmN0aW9uIChFcnJvclR5cGUpIHtcclxuICAgIEVycm9yVHlwZVtFcnJvclR5cGVbXCJUZXN0XCJdID0gMF0gPSBcIlRlc3RcIjtcclxuICAgIEVycm9yVHlwZVtFcnJvclR5cGVbXCJOb25lXCJdID0gMV0gPSBcIk5vbmVcIjtcclxufSkoRXJyb3JUeXBlIHx8IChFcnJvclR5cGUgPSB7fSkpO1xyXG4iLCJpbXBvcnQgeyBFcnJvclR5cGUgfSBmcm9tIFwiLi8uLi9leGNlcHRpb25zL2Vycm9yVHlwZS5qc1wiO1xyXG52YXIgVHlwZUhlbHBlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBUeXBlSGVscGVyKCkge1xyXG4gICAgfVxyXG4gICAgVHlwZUhlbHBlci5pc0Vycm9yQ3VzdG9tID0gZnVuY3Rpb24gKG9iamVjdCkge1xyXG4gICAgICAgIHJldHVybiBvYmplY3QgIT09IG51bGwgJiYgdHlwZW9mIG9iamVjdCAhPT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgICAgICAgICB0eXBlb2Ygb2JqZWN0LnR5cGUgIT09IFwidW5kZWZpbmVkXCIgJiZcclxuICAgICAgICAgICAgVHlwZUhlbHBlci5pc0Vycm9yVHlwZShvYmplY3QudHlwZSkgJiZcclxuICAgICAgICAgICAgdHlwZW9mIG9iamVjdC5jb2RlID09PSBcIm51bWJlclwiICYmXHJcbiAgICAgICAgICAgIHR5cGVvZiBvYmplY3QubWVzc2FnZSA9PT0gXCJzdHJpbmdcIjtcclxuICAgIH07XHJcbiAgICBUeXBlSGVscGVyLmlzRXJyb3JUeXBlID0gZnVuY3Rpb24gKG9iamVjdCkge1xyXG4gICAgICAgIHJldHVybiBvYmplY3QgIT09IG51bGwgJiYgdHlwZW9mIG9iamVjdCAhPT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgICAgICAgICBCb29sZWFuKG9iamVjdCBpbiBFcnJvclR5cGUpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBUeXBlSGVscGVyO1xyXG59KCkpO1xyXG5leHBvcnQgeyBUeXBlSGVscGVyIH07XHJcbiIsImltcG9ydCB7IENhdGVnb3J5LCBDYXRlZ29yeUNvbmZpZ3VyYXRpb24sIENhdGVnb3J5U2VydmljZUZhY3RvcnksIExvZ0xldmVsIH0gZnJvbSBcInR5cGVzY3JpcHQtbG9nZ2luZ1wiO1xyXG5DYXRlZ29yeVNlcnZpY2VGYWN0b3J5LnNldERlZmF1bHRDb25maWd1cmF0aW9uKG5ldyBDYXRlZ29yeUNvbmZpZ3VyYXRpb24oTG9nTGV2ZWwuVHJhY2UpKTtcclxuZXhwb3J0IHZhciBMb2cgPSBuZXcgQ2F0ZWdvcnkoXCJsb2dcIik7XHJcbiIsImltcG9ydCB7IEVycm9yQ3VzdG9tIH0gZnJvbSBcIi4vLi4vZXhjZXB0aW9ucy9lcnJvckN1c3RvbS5qc1wiO1xyXG5pbXBvcnQgeyBFcnJvclNlcnZpY2UgfSBmcm9tIFwiLi4vZXhjZXB0aW9ucy9lcnJvclNlcnZpY2UuanNcIjtcclxuaW1wb3J0IHsgTG9nIH0gZnJvbSBcIi4vY29uZmlnLmpzXCI7XHJcbmltcG9ydCB7IFR5cGVIZWxwZXIgfSBmcm9tIFwiLi8uLi9oZWxwZXJzL1R5cGVIZWxwZXIuanNcIjtcclxudmFyIE5PVF9DVVNUT01fRVJST1IgPSBcIm5vdCBjdXN0b20gZXJyb3JcIiwgVU5ERUZJTkVEX0VSUk9SID0gXCJ1bmRlZmluZWQgZXJyb3JcIiwgbG9nRXJyb3JDdXN0b20gPSBmdW5jdGlvbiAoZXJyb3JDdXN0b20pIHtcclxuICAgIExvZy5lcnJvcihFcnJvckN1c3RvbS5nZXRMb2dFcnJvck1lc3NhZ2UoZXJyb3JDdXN0b20pLCBlcnJvckN1c3RvbSk7XHJcbiAgICBhbGVydChFcnJvckN1c3RvbS5nZXRMb2dFcnJvck1lc3NhZ2UoZXJyb3JDdXN0b20pKTtcclxuICAgIEVycm9yU2VydmljZS5kZWFsV2l0aCgpO1xyXG59LCBsb2dFcnJvck5vdEN1c3RvbSA9IGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgTG9nLmZhdGFsKE5PVF9DVVNUT01fRVJST1IgKyBcIiAtIFwiICsgZXJyb3IubWVzc2FnZSwgZXJyb3IpO1xyXG59LCBsb2dVbmRlZmluZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBMb2cuZmF0YWwoVU5ERUZJTkVEX0VSUk9SLCBuZXcgRXJyb3IoKSk7XHJcbn07XHJcbmV4cG9ydCB2YXIgZXhjZXB0aW9uTG9nZ2VyID0gZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICBpZiAoVHlwZUhlbHBlci5pc0Vycm9yQ3VzdG9tKGVycm9yKSkge1xyXG4gICAgICAgIGxvZ0Vycm9yQ3VzdG9tKGVycm9yKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGxvZ0Vycm9yTm90Q3VzdG9tKGVycm9yKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBsb2dVbmRlZmluZWQoKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxufTtcclxuIiwiaW1wb3J0IHsgZXJyb3JTZXJ2aWNlTG9hZGVyIH0gZnJvbSBcIi4uL2V4Y2VwdGlvbnMvZXJyb3JTZXJ2aWNlXCI7XHJcbmltcG9ydCB7IGV4Y2VwdGlvbkxvZ2dlciB9IGZyb20gXCIuLi9sb2cvZXhjZXB0aW9uTG9nZ2VyXCI7XHJcbndpbmRvdy5vbmVycm9yID0gZnVuY3Rpb24gKF9ldmVudCwgX3NvdXJjZSwgX2xpbmVubywgX2NvbG5vLCBlcnJvcikge1xyXG4gICAgZXJyb3JTZXJ2aWNlTG9hZGVyKGVycm9yKTtcclxuICAgIHJldHVybiBleGNlcHRpb25Mb2dnZXIoZXJyb3IpO1xyXG59O1xyXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbl9fd2VicGFja19yZXF1aXJlX18ubiA9IChtb2R1bGUpID0+IHtcblx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG5cdFx0KCkgPT4gKG1vZHVsZVsnZGVmYXVsdCddKSA6XG5cdFx0KCkgPT4gKG1vZHVsZSk7XG5cdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsIHsgYTogZ2V0dGVyIH0pO1xuXHRyZXR1cm4gZ2V0dGVyO1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IFwiLi9hbGxJbXBvcnRzLmpzXCI7XHJcbiJdLCJzb3VyY2VSb290IjoiIn0=