;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @license AngularJS v1.3.15
 * (c) 2010-2014 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular, undefined) {

'use strict';

/**
 * @ngdoc object
 * @name angular.mock
 * @description
 *
 * Namespace from 'angular-mocks.js' which contains testing related code.
 */
angular.mock = {};

/**
 * ! This is a private undocumented service !
 *
 * @name $browser
 *
 * @description
 * This service is a mock implementation of {@link ng.$browser}. It provides fake
 * implementation for commonly used browser apis that are hard to test, e.g. setTimeout, xhr,
 * cookies, etc...
 *
 * The api of this service is the same as that of the real {@link ng.$browser $browser}, except
 * that there are several helper methods available which can be used in tests.
 */
angular.mock.$BrowserProvider = function() {
  this.$get = function() {
    return new angular.mock.$Browser();
  };
};

angular.mock.$Browser = function() {
  var self = this;

  this.isMock = true;
  self.$$url = "http://server/";
  self.$$lastUrl = self.$$url; // used by url polling fn
  self.pollFns = [];

  // TODO(vojta): remove this temporary api
  self.$$completeOutstandingRequest = angular.noop;
  self.$$incOutstandingRequestCount = angular.noop;


  // register url polling fn

  self.onUrlChange = function(listener) {
    self.pollFns.push(
      function() {
        if (self.$$lastUrl !== self.$$url || self.$$state !== self.$$lastState) {
          self.$$lastUrl = self.$$url;
          self.$$lastState = self.$$state;
          listener(self.$$url, self.$$state);
        }
      }
    );

    return listener;
  };

  self.$$checkUrlChange = angular.noop;

  self.cookieHash = {};
  self.lastCookieHash = {};
  self.deferredFns = [];
  self.deferredNextId = 0;

  self.defer = function(fn, delay) {
    delay = delay || 0;
    self.deferredFns.push({time:(self.defer.now + delay), fn:fn, id: self.deferredNextId});
    self.deferredFns.sort(function(a, b) { return a.time - b.time;});
    return self.deferredNextId++;
  };


  /**
   * @name $browser#defer.now
   *
   * @description
   * Current milliseconds mock time.
   */
  self.defer.now = 0;


  self.defer.cancel = function(deferId) {
    var fnIndex;

    angular.forEach(self.deferredFns, function(fn, index) {
      if (fn.id === deferId) fnIndex = index;
    });

    if (fnIndex !== undefined) {
      self.deferredFns.splice(fnIndex, 1);
      return true;
    }

    return false;
  };


  /**
   * @name $browser#defer.flush
   *
   * @description
   * Flushes all pending requests and executes the defer callbacks.
   *
   * @param {number=} number of milliseconds to flush. See {@link #defer.now}
   */
  self.defer.flush = function(delay) {
    if (angular.isDefined(delay)) {
      self.defer.now += delay;
    } else {
      if (self.deferredFns.length) {
        self.defer.now = self.deferredFns[self.deferredFns.length - 1].time;
      } else {
        throw new Error('No deferred tasks to be flushed');
      }
    }

    while (self.deferredFns.length && self.deferredFns[0].time <= self.defer.now) {
      self.deferredFns.shift().fn();
    }
  };

  self.$$baseHref = '/';
  self.baseHref = function() {
    return this.$$baseHref;
  };
};
angular.mock.$Browser.prototype = {

/**
  * @name $browser#poll
  *
  * @description
  * run all fns in pollFns
  */
  poll: function poll() {
    angular.forEach(this.pollFns, function(pollFn) {
      pollFn();
    });
  },

  addPollFn: function(pollFn) {
    this.pollFns.push(pollFn);
    return pollFn;
  },

  url: function(url, replace, state) {
    if (angular.isUndefined(state)) {
      state = null;
    }
    if (url) {
      this.$$url = url;
      // Native pushState serializes & copies the object; simulate it.
      this.$$state = angular.copy(state);
      return this;
    }

    return this.$$url;
  },

  state: function() {
    return this.$$state;
  },

  cookies:  function(name, value) {
    if (name) {
      if (angular.isUndefined(value)) {
        delete this.cookieHash[name];
      } else {
        if (angular.isString(value) &&       //strings only
            value.length <= 4096) {          //strict cookie storage limits
          this.cookieHash[name] = value;
        }
      }
    } else {
      if (!angular.equals(this.cookieHash, this.lastCookieHash)) {
        this.lastCookieHash = angular.copy(this.cookieHash);
        this.cookieHash = angular.copy(this.cookieHash);
      }
      return this.cookieHash;
    }
  },

  notifyWhenNoOutstandingRequests: function(fn) {
    fn();
  }
};


/**
 * @ngdoc provider
 * @name $exceptionHandlerProvider
 *
 * @description
 * Configures the mock implementation of {@link ng.$exceptionHandler} to rethrow or to log errors
 * passed to the `$exceptionHandler`.
 */

/**
 * @ngdoc service
 * @name $exceptionHandler
 *
 * @description
 * Mock implementation of {@link ng.$exceptionHandler} that rethrows or logs errors passed
 * to it. See {@link ngMock.$exceptionHandlerProvider $exceptionHandlerProvider} for configuration
 * information.
 *
 *
 * ```js
 *   describe('$exceptionHandlerProvider', function() {
 *
 *     it('should capture log messages and exceptions', function() {
 *
 *       module(function($exceptionHandlerProvider) {
 *         $exceptionHandlerProvider.mode('log');
 *       });
 *
 *       inject(function($log, $exceptionHandler, $timeout) {
 *         $timeout(function() { $log.log(1); });
 *         $timeout(function() { $log.log(2); throw 'banana peel'; });
 *         $timeout(function() { $log.log(3); });
 *         expect($exceptionHandler.errors).toEqual([]);
 *         expect($log.assertEmpty());
 *         $timeout.flush();
 *         expect($exceptionHandler.errors).toEqual(['banana peel']);
 *         expect($log.log.logs).toEqual([[1], [2], [3]]);
 *       });
 *     });
 *   });
 * ```
 */

angular.mock.$ExceptionHandlerProvider = function() {
  var handler;

  /**
   * @ngdoc method
   * @name $exceptionHandlerProvider#mode
   *
   * @description
   * Sets the logging mode.
   *
   * @param {string} mode Mode of operation, defaults to `rethrow`.
   *
   *   - `log`: Sometimes it is desirable to test that an error is thrown, for this case the `log`
   *            mode stores an array of errors in `$exceptionHandler.errors`, to allow later
   *            assertion of them. See {@link ngMock.$log#assertEmpty assertEmpty()} and
   *            {@link ngMock.$log#reset reset()}
   *   - `rethrow`: If any errors are passed to the handler in tests, it typically means that there
   *                is a bug in the application or test, so this mock will make these tests fail.
   *                For any implementations that expect exceptions to be thrown, the `rethrow` mode
   *                will also maintain a log of thrown errors.
   */
  this.mode = function(mode) {

    switch (mode) {
      case 'log':
      case 'rethrow':
        var errors = [];
        handler = function(e) {
          if (arguments.length == 1) {
            errors.push(e);
          } else {
            errors.push([].slice.call(arguments, 0));
          }
          if (mode === "rethrow") {
            throw e;
          }
        };
        handler.errors = errors;
        break;
      default:
        throw new Error("Unknown mode '" + mode + "', only 'log'/'rethrow' modes are allowed!");
    }
  };

  this.$get = function() {
    return handler;
  };

  this.mode('rethrow');
};


/**
 * @ngdoc service
 * @name $log
 *
 * @description
 * Mock implementation of {@link ng.$log} that gathers all logged messages in arrays
 * (one array per logging level). These arrays are exposed as `logs` property of each of the
 * level-specific log function, e.g. for level `error` the array is exposed as `$log.error.logs`.
 *
 */
angular.mock.$LogProvider = function() {
  var debug = true;

  function concat(array1, array2, index) {
    return array1.concat(Array.prototype.slice.call(array2, index));
  }

  this.debugEnabled = function(flag) {
    if (angular.isDefined(flag)) {
      debug = flag;
      return this;
    } else {
      return debug;
    }
  };

  this.$get = function() {
    var $log = {
      log: function() { $log.log.logs.push(concat([], arguments, 0)); },
      warn: function() { $log.warn.logs.push(concat([], arguments, 0)); },
      info: function() { $log.info.logs.push(concat([], arguments, 0)); },
      error: function() { $log.error.logs.push(concat([], arguments, 0)); },
      debug: function() {
        if (debug) {
          $log.debug.logs.push(concat([], arguments, 0));
        }
      }
    };

    /**
     * @ngdoc method
     * @name $log#reset
     *
     * @description
     * Reset all of the logging arrays to empty.
     */
    $log.reset = function() {
      /**
       * @ngdoc property
       * @name $log#log.logs
       *
       * @description
       * Array of messages logged using {@link ng.$log#log `log()`}.
       *
       * @example
       * ```js
       * $log.log('Some Log');
       * var first = $log.log.logs.unshift();
       * ```
       */
      $log.log.logs = [];
      /**
       * @ngdoc property
       * @name $log#info.logs
       *
       * @description
       * Array of messages logged using {@link ng.$log#info `info()`}.
       *
       * @example
       * ```js
       * $log.info('Some Info');
       * var first = $log.info.logs.unshift();
       * ```
       */
      $log.info.logs = [];
      /**
       * @ngdoc property
       * @name $log#warn.logs
       *
       * @description
       * Array of messages logged using {@link ng.$log#warn `warn()`}.
       *
       * @example
       * ```js
       * $log.warn('Some Warning');
       * var first = $log.warn.logs.unshift();
       * ```
       */
      $log.warn.logs = [];
      /**
       * @ngdoc property
       * @name $log#error.logs
       *
       * @description
       * Array of messages logged using {@link ng.$log#error `error()`}.
       *
       * @example
       * ```js
       * $log.error('Some Error');
       * var first = $log.error.logs.unshift();
       * ```
       */
      $log.error.logs = [];
        /**
       * @ngdoc property
       * @name $log#debug.logs
       *
       * @description
       * Array of messages logged using {@link ng.$log#debug `debug()`}.
       *
       * @example
       * ```js
       * $log.debug('Some Error');
       * var first = $log.debug.logs.unshift();
       * ```
       */
      $log.debug.logs = [];
    };

    /**
     * @ngdoc method
     * @name $log#assertEmpty
     *
     * @description
     * Assert that all of the logging methods have no logged messages. If any messages are present,
     * an exception is thrown.
     */
    $log.assertEmpty = function() {
      var errors = [];
      angular.forEach(['error', 'warn', 'info', 'log', 'debug'], function(logLevel) {
        angular.forEach($log[logLevel].logs, function(log) {
          angular.forEach(log, function(logItem) {
            errors.push('MOCK $log (' + logLevel + '): ' + String(logItem) + '\n' +
                        (logItem.stack || ''));
          });
        });
      });
      if (errors.length) {
        errors.unshift("Expected $log to be empty! Either a message was logged unexpectedly, or " +
          "an expected log message was not checked and removed:");
        errors.push('');
        throw new Error(errors.join('\n---------\n'));
      }
    };

    $log.reset();
    return $log;
  };
};


/**
 * @ngdoc service
 * @name $interval
 *
 * @description
 * Mock implementation of the $interval service.
 *
 * Use {@link ngMock.$interval#flush `$interval.flush(millis)`} to
 * move forward by `millis` milliseconds and trigger any functions scheduled to run in that
 * time.
 *
 * @param {function()} fn A function that should be called repeatedly.
 * @param {number} delay Number of milliseconds between each function call.
 * @param {number=} [count=0] Number of times to repeat. If not set, or 0, will repeat
 *   indefinitely.
 * @param {boolean=} [invokeApply=true] If set to `false` skips model dirty checking, otherwise
 *   will invoke `fn` within the {@link ng.$rootScope.Scope#$apply $apply} block.
 * @returns {promise} A promise which will be notified on each iteration.
 */
angular.mock.$IntervalProvider = function() {
  this.$get = ['$browser', '$rootScope', '$q', '$$q',
       function($browser,   $rootScope,   $q,   $$q) {
    var repeatFns = [],
        nextRepeatId = 0,
        now = 0;

    var $interval = function(fn, delay, count, invokeApply) {
      var iteration = 0,
          skipApply = (angular.isDefined(invokeApply) && !invokeApply),
          deferred = (skipApply ? $$q : $q).defer(),
          promise = deferred.promise;

      count = (angular.isDefined(count)) ? count : 0;
      promise.then(null, null, fn);

      promise.$$intervalId = nextRepeatId;

      function tick() {
        deferred.notify(iteration++);

        if (count > 0 && iteration >= count) {
          var fnIndex;
          deferred.resolve(iteration);

          angular.forEach(repeatFns, function(fn, index) {
            if (fn.id === promise.$$intervalId) fnIndex = index;
          });

          if (fnIndex !== undefined) {
            repeatFns.splice(fnIndex, 1);
          }
        }

        if (skipApply) {
          $browser.defer.flush();
        } else {
          $rootScope.$apply();
        }
      }

      repeatFns.push({
        nextTime:(now + delay),
        delay: delay,
        fn: tick,
        id: nextRepeatId,
        deferred: deferred
      });
      repeatFns.sort(function(a, b) { return a.nextTime - b.nextTime;});

      nextRepeatId++;
      return promise;
    };
    /**
     * @ngdoc method
     * @name $interval#cancel
     *
     * @description
     * Cancels a task associated with the `promise`.
     *
     * @param {promise} promise A promise from calling the `$interval` function.
     * @returns {boolean} Returns `true` if the task was successfully cancelled.
     */
    $interval.cancel = function(promise) {
      if (!promise) return false;
      var fnIndex;

      angular.forEach(repeatFns, function(fn, index) {
        if (fn.id === promise.$$intervalId) fnIndex = index;
      });

      if (fnIndex !== undefined) {
        repeatFns[fnIndex].deferred.reject('canceled');
        repeatFns.splice(fnIndex, 1);
        return true;
      }

      return false;
    };

    /**
     * @ngdoc method
     * @name $interval#flush
     * @description
     *
     * Runs interval tasks scheduled to be run in the next `millis` milliseconds.
     *
     * @param {number=} millis maximum timeout amount to flush up until.
     *
     * @return {number} The amount of time moved forward.
     */
    $interval.flush = function(millis) {
      now += millis;
      while (repeatFns.length && repeatFns[0].nextTime <= now) {
        var task = repeatFns[0];
        task.fn();
        task.nextTime += task.delay;
        repeatFns.sort(function(a, b) { return a.nextTime - b.nextTime;});
      }
      return millis;
    };

    return $interval;
  }];
};


/* jshint -W101 */
/* The R_ISO8061_STR regex is never going to fit into the 100 char limit!
 * This directive should go inside the anonymous function but a bug in JSHint means that it would
 * not be enacted early enough to prevent the warning.
 */
var R_ISO8061_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?:\:?(\d\d)(?:\:?(\d\d)(?:\.(\d{3}))?)?)?(Z|([+-])(\d\d):?(\d\d)))?$/;

function jsonStringToDate(string) {
  var match;
  if (match = string.match(R_ISO8061_STR)) {
    var date = new Date(0),
        tzHour = 0,
        tzMin  = 0;
    if (match[9]) {
      tzHour = int(match[9] + match[10]);
      tzMin = int(match[9] + match[11]);
    }
    date.setUTCFullYear(int(match[1]), int(match[2]) - 1, int(match[3]));
    date.setUTCHours(int(match[4] || 0) - tzHour,
                     int(match[5] || 0) - tzMin,
                     int(match[6] || 0),
                     int(match[7] || 0));
    return date;
  }
  return string;
}

function int(str) {
  return parseInt(str, 10);
}

function padNumber(num, digits, trim) {
  var neg = '';
  if (num < 0) {
    neg =  '-';
    num = -num;
  }
  num = '' + num;
  while (num.length < digits) num = '0' + num;
  if (trim)
    num = num.substr(num.length - digits);
  return neg + num;
}


/**
 * @ngdoc type
 * @name angular.mock.TzDate
 * @description
 *
 * *NOTE*: this is not an injectable instance, just a globally available mock class of `Date`.
 *
 * Mock of the Date type which has its timezone specified via constructor arg.
 *
 * The main purpose is to create Date-like instances with timezone fixed to the specified timezone
 * offset, so that we can test code that depends on local timezone settings without dependency on
 * the time zone settings of the machine where the code is running.
 *
 * @param {number} offset Offset of the *desired* timezone in hours (fractions will be honored)
 * @param {(number|string)} timestamp Timestamp representing the desired time in *UTC*
 *
 * @example
 * !!!! WARNING !!!!!
 * This is not a complete Date object so only methods that were implemented can be called safely.
 * To make matters worse, TzDate instances inherit stuff from Date via a prototype.
 *
 * We do our best to intercept calls to "unimplemented" methods, but since the list of methods is
 * incomplete we might be missing some non-standard methods. This can result in errors like:
 * "Date.prototype.foo called on incompatible Object".
 *
 * ```js
 * var newYearInBratislava = new TzDate(-1, '2009-12-31T23:00:00Z');
 * newYearInBratislava.getTimezoneOffset() => -60;
 * newYearInBratislava.getFullYear() => 2010;
 * newYearInBratislava.getMonth() => 0;
 * newYearInBratislava.getDate() => 1;
 * newYearInBratislava.getHours() => 0;
 * newYearInBratislava.getMinutes() => 0;
 * newYearInBratislava.getSeconds() => 0;
 * ```
 *
 */
angular.mock.TzDate = function(offset, timestamp) {
  var self = new Date(0);
  if (angular.isString(timestamp)) {
    var tsStr = timestamp;

    self.origDate = jsonStringToDate(timestamp);

    timestamp = self.origDate.getTime();
    if (isNaN(timestamp))
      throw {
        name: "Illegal Argument",
        message: "Arg '" + tsStr + "' passed into TzDate constructor is not a valid date string"
      };
  } else {
    self.origDate = new Date(timestamp);
  }

  var localOffset = new Date(timestamp).getTimezoneOffset();
  self.offsetDiff = localOffset * 60 * 1000 - offset * 1000 * 60 * 60;
  self.date = new Date(timestamp + self.offsetDiff);

  self.getTime = function() {
    return self.date.getTime() - self.offsetDiff;
  };

  self.toLocaleDateString = function() {
    return self.date.toLocaleDateString();
  };

  self.getFullYear = function() {
    return self.date.getFullYear();
  };

  self.getMonth = function() {
    return self.date.getMonth();
  };

  self.getDate = function() {
    return self.date.getDate();
  };

  self.getHours = function() {
    return self.date.getHours();
  };

  self.getMinutes = function() {
    return self.date.getMinutes();
  };

  self.getSeconds = function() {
    return self.date.getSeconds();
  };

  self.getMilliseconds = function() {
    return self.date.getMilliseconds();
  };

  self.getTimezoneOffset = function() {
    return offset * 60;
  };

  self.getUTCFullYear = function() {
    return self.origDate.getUTCFullYear();
  };

  self.getUTCMonth = function() {
    return self.origDate.getUTCMonth();
  };

  self.getUTCDate = function() {
    return self.origDate.getUTCDate();
  };

  self.getUTCHours = function() {
    return self.origDate.getUTCHours();
  };

  self.getUTCMinutes = function() {
    return self.origDate.getUTCMinutes();
  };

  self.getUTCSeconds = function() {
    return self.origDate.getUTCSeconds();
  };

  self.getUTCMilliseconds = function() {
    return self.origDate.getUTCMilliseconds();
  };

  self.getDay = function() {
    return self.date.getDay();
  };

  // provide this method only on browsers that already have it
  if (self.toISOString) {
    self.toISOString = function() {
      return padNumber(self.origDate.getUTCFullYear(), 4) + '-' +
            padNumber(self.origDate.getUTCMonth() + 1, 2) + '-' +
            padNumber(self.origDate.getUTCDate(), 2) + 'T' +
            padNumber(self.origDate.getUTCHours(), 2) + ':' +
            padNumber(self.origDate.getUTCMinutes(), 2) + ':' +
            padNumber(self.origDate.getUTCSeconds(), 2) + '.' +
            padNumber(self.origDate.getUTCMilliseconds(), 3) + 'Z';
    };
  }

  //hide all methods not implemented in this mock that the Date prototype exposes
  var unimplementedMethods = ['getUTCDay',
      'getYear', 'setDate', 'setFullYear', 'setHours', 'setMilliseconds',
      'setMinutes', 'setMonth', 'setSeconds', 'setTime', 'setUTCDate', 'setUTCFullYear',
      'setUTCHours', 'setUTCMilliseconds', 'setUTCMinutes', 'setUTCMonth', 'setUTCSeconds',
      'setYear', 'toDateString', 'toGMTString', 'toJSON', 'toLocaleFormat', 'toLocaleString',
      'toLocaleTimeString', 'toSource', 'toString', 'toTimeString', 'toUTCString', 'valueOf'];

  angular.forEach(unimplementedMethods, function(methodName) {
    self[methodName] = function() {
      throw new Error("Method '" + methodName + "' is not implemented in the TzDate mock");
    };
  });

  return self;
};

//make "tzDateInstance instanceof Date" return true
angular.mock.TzDate.prototype = Date.prototype;
/* jshint +W101 */

angular.mock.animate = angular.module('ngAnimateMock', ['ng'])

  .config(['$provide', function($provide) {

    var reflowQueue = [];
    $provide.value('$$animateReflow', function(fn) {
      var index = reflowQueue.length;
      reflowQueue.push(fn);
      return function cancel() {
        reflowQueue.splice(index, 1);
      };
    });

    $provide.decorator('$animate', ['$delegate', '$$asyncCallback', '$timeout', '$browser',
                            function($delegate,   $$asyncCallback,   $timeout,   $browser) {
      var animate = {
        queue: [],
        cancel: $delegate.cancel,
        enabled: $delegate.enabled,
        triggerCallbackEvents: function() {
          $$asyncCallback.flush();
        },
        triggerCallbackPromise: function() {
          $timeout.flush(0);
        },
        triggerCallbacks: function() {
          this.triggerCallbackEvents();
          this.triggerCallbackPromise();
        },
        triggerReflow: function() {
          angular.forEach(reflowQueue, function(fn) {
            fn();
          });
          reflowQueue = [];
        }
      };

      angular.forEach(
        ['animate','enter','leave','move','addClass','removeClass','setClass'], function(method) {
        animate[method] = function() {
          animate.queue.push({
            event: method,
            element: arguments[0],
            options: arguments[arguments.length - 1],
            args: arguments
          });
          return $delegate[method].apply($delegate, arguments);
        };
      });

      return animate;
    }]);

  }]);


/**
 * @ngdoc function
 * @name angular.mock.dump
 * @description
 *
 * *NOTE*: this is not an injectable instance, just a globally available function.
 *
 * Method for serializing common angular objects (scope, elements, etc..) into strings, useful for
 * debugging.
 *
 * This method is also available on window, where it can be used to display objects on debug
 * console.
 *
 * @param {*} object - any object to turn into string.
 * @return {string} a serialized string of the argument
 */
angular.mock.dump = function(object) {
  return serialize(object);

  function serialize(object) {
    var out;

    if (angular.isElement(object)) {
      object = angular.element(object);
      out = angular.element('<div></div>');
      angular.forEach(object, function(element) {
        out.append(angular.element(element).clone());
      });
      out = out.html();
    } else if (angular.isArray(object)) {
      out = [];
      angular.forEach(object, function(o) {
        out.push(serialize(o));
      });
      out = '[ ' + out.join(', ') + ' ]';
    } else if (angular.isObject(object)) {
      if (angular.isFunction(object.$eval) && angular.isFunction(object.$apply)) {
        out = serializeScope(object);
      } else if (object instanceof Error) {
        out = object.stack || ('' + object.name + ': ' + object.message);
      } else {
        // TODO(i): this prevents methods being logged,
        // we should have a better way to serialize objects
        out = angular.toJson(object, true);
      }
    } else {
      out = String(object);
    }

    return out;
  }

  function serializeScope(scope, offset) {
    offset = offset ||  '  ';
    var log = [offset + 'Scope(' + scope.$id + '): {'];
    for (var key in scope) {
      if (Object.prototype.hasOwnProperty.call(scope, key) && !key.match(/^(\$|this)/)) {
        log.push('  ' + key + ': ' + angular.toJson(scope[key]));
      }
    }
    var child = scope.$$childHead;
    while (child) {
      log.push(serializeScope(child, offset + '  '));
      child = child.$$nextSibling;
    }
    log.push('}');
    return log.join('\n' + offset);
  }
};

/**
 * @ngdoc service
 * @name $httpBackend
 * @description
 * Fake HTTP backend implementation suitable for unit testing applications that use the
 * {@link ng.$http $http service}.
 *
 * *Note*: For fake HTTP backend implementation suitable for end-to-end testing or backend-less
 * development please see {@link ngMockE2E.$httpBackend e2e $httpBackend mock}.
 *
 * During unit testing, we want our unit tests to run quickly and have no external dependencies so
 * we don’t want to send [XHR](https://developer.mozilla.org/en/xmlhttprequest) or
 * [JSONP](http://en.wikipedia.org/wiki/JSONP) requests to a real server. All we really need is
 * to verify whether a certain request has been sent or not, or alternatively just let the
 * application make requests, respond with pre-trained responses and assert that the end result is
 * what we expect it to be.
 *
 * This mock implementation can be used to respond with static or dynamic responses via the
 * `expect` and `when` apis and their shortcuts (`expectGET`, `whenPOST`, etc).
 *
 * When an Angular application needs some data from a server, it calls the $http service, which
 * sends the request to a real server using $httpBackend service. With dependency injection, it is
 * easy to inject $httpBackend mock (which has the same API as $httpBackend) and use it to verify
 * the requests and respond with some testing data without sending a request to a real server.
 *
 * There are two ways to specify what test data should be returned as http responses by the mock
 * backend when the code under test makes http requests:
 *
 * - `$httpBackend.expect` - specifies a request expectation
 * - `$httpBackend.when` - specifies a backend definition
 *
 *
 * # Request Expectations vs Backend Definitions
 *
 * Request expectations provide a way to make assertions about requests made by the application and
 * to define responses for those requests. The test will fail if the expected requests are not made
 * or they are made in the wrong order.
 *
 * Backend definitions allow you to define a fake backend for your application which doesn't assert
 * if a particular request was made or not, it just returns a trained response if a request is made.
 * The test will pass whether or not the request gets made during testing.
 *
 *
 * <table class="table">
 *   <tr><th width="220px"></th><th>Request expectations</th><th>Backend definitions</th></tr>
 *   <tr>
 *     <th>Syntax</th>
 *     <td>.expect(...).respond(...)</td>
 *     <td>.when(...).respond(...)</td>
 *   </tr>
 *   <tr>
 *     <th>Typical usage</th>
 *     <td>strict unit tests</td>
 *     <td>loose (black-box) unit testing</td>
 *   </tr>
 *   <tr>
 *     <th>Fulfills multiple requests</th>
 *     <td>NO</td>
 *     <td>YES</td>
 *   </tr>
 *   <tr>
 *     <th>Order of requests matters</th>
 *     <td>YES</td>
 *     <td>NO</td>
 *   </tr>
 *   <tr>
 *     <th>Request required</th>
 *     <td>YES</td>
 *     <td>NO</td>
 *   </tr>
 *   <tr>
 *     <th>Response required</th>
 *     <td>optional (see below)</td>
 *     <td>YES</td>
 *   </tr>
 * </table>
 *
 * In cases where both backend definitions and request expectations are specified during unit
 * testing, the request expectations are evaluated first.
 *
 * If a request expectation has no response specified, the algorithm will search your backend
 * definitions for an appropriate response.
 *
 * If a request didn't match any expectation or if the expectation doesn't have the response
 * defined, the backend definitions are evaluated in sequential order to see if any of them match
 * the request. The response from the first matched definition is returned.
 *
 *
 * # Flushing HTTP requests
 *
 * The $httpBackend used in production always responds to requests asynchronously. If we preserved
 * this behavior in unit testing, we'd have to create async unit tests, which are hard to write,
 * to follow and to maintain. But neither can the testing mock respond synchronously; that would
 * change the execution of the code under test. For this reason, the mock $httpBackend has a
 * `flush()` method, which allows the test to explicitly flush pending requests. This preserves
 * the async api of the backend, while allowing the test to execute synchronously.
 *
 *
 * # Unit testing with mock $httpBackend
 * The following code shows how to setup and use the mock backend when unit testing a controller.
 * First we create the controller under test:
 *
  ```js
  // The module code
  angular
    .module('MyApp', [])
    .controller('MyController', MyController);

  // The controller code
  function MyController($scope, $http) {
    var authToken;

    $http.get('/auth.py').success(function(data, status, headers) {
      authToken = headers('A-Token');
      $scope.user = data;
    });

    $scope.saveMessage = function(message) {
      var headers = { 'Authorization': authToken };
      $scope.status = 'Saving...';

      $http.post('/add-msg.py', message, { headers: headers } ).success(function(response) {
        $scope.status = '';
      }).error(function() {
        $scope.status = 'ERROR!';
      });
    };
  }
  ```
 *
 * Now we setup the mock backend and create the test specs:
 *
  ```js
    // testing controller
    describe('MyController', function() {
       var $httpBackend, $rootScope, createController, authRequestHandler;

       // Set up the module
       beforeEach(module('MyApp'));

       beforeEach(inject(function($injector) {
         // Set up the mock http service responses
         $httpBackend = $injector.get('$httpBackend');
         // backend definition common for all tests
         authRequestHandler = $httpBackend.when('GET', '/auth.py')
                                .respond({userId: 'userX'}, {'A-Token': 'xxx'});

         // Get hold of a scope (i.e. the root scope)
         $rootScope = $injector.get('$rootScope');
         // The $controller service is used to create instances of controllers
         var $controller = $injector.get('$controller');

         createController = function() {
           return $controller('MyController', {'$scope' : $rootScope });
         };
       }));


       afterEach(function() {
         $httpBackend.verifyNoOutstandingExpectation();
         $httpBackend.verifyNoOutstandingRequest();
       });


       it('should fetch authentication token', function() {
         $httpBackend.expectGET('/auth.py');
         var controller = createController();
         $httpBackend.flush();
       });


       it('should fail authentication', function() {

         // Notice how you can change the response even after it was set
         authRequestHandler.respond(401, '');

         $httpBackend.expectGET('/auth.py');
         var controller = createController();
         $httpBackend.flush();
         expect($rootScope.status).toBe('Failed...');
       });


       it('should send msg to server', function() {
         var controller = createController();
         $httpBackend.flush();

         // now you don’t care about the authentication, but
         // the controller will still send the request and
         // $httpBackend will respond without you having to
         // specify the expectation and response for this request

         $httpBackend.expectPOST('/add-msg.py', 'message content').respond(201, '');
         $rootScope.saveMessage('message content');
         expect($rootScope.status).toBe('Saving...');
         $httpBackend.flush();
         expect($rootScope.status).toBe('');
       });


       it('should send auth header', function() {
         var controller = createController();
         $httpBackend.flush();

         $httpBackend.expectPOST('/add-msg.py', undefined, function(headers) {
           // check if the header was send, if it wasn't the expectation won't
           // match the request and the test will fail
           return headers['Authorization'] == 'xxx';
         }).respond(201, '');

         $rootScope.saveMessage('whatever');
         $httpBackend.flush();
       });
    });
   ```
 */
angular.mock.$HttpBackendProvider = function() {
  this.$get = ['$rootScope', '$timeout', createHttpBackendMock];
};

/**
 * General factory function for $httpBackend mock.
 * Returns instance for unit testing (when no arguments specified):
 *   - passing through is disabled
 *   - auto flushing is disabled
 *
 * Returns instance for e2e testing (when `$delegate` and `$browser` specified):
 *   - passing through (delegating request to real backend) is enabled
 *   - auto flushing is enabled
 *
 * @param {Object=} $delegate Real $httpBackend instance (allow passing through if specified)
 * @param {Object=} $browser Auto-flushing enabled if specified
 * @return {Object} Instance of $httpBackend mock
 */
function createHttpBackendMock($rootScope, $timeout, $delegate, $browser) {
  var definitions = [],
      expectations = [],
      responses = [],
      responsesPush = angular.bind(responses, responses.push),
      copy = angular.copy;

  function createResponse(status, data, headers, statusText) {
    if (angular.isFunction(status)) return status;

    return function() {
      return angular.isNumber(status)
          ? [status, data, headers, statusText]
          : [200, status, data, headers];
    };
  }

  // TODO(vojta): change params to: method, url, data, headers, callback
  function $httpBackend(method, url, data, callback, headers, timeout, withCredentials) {
    var xhr = new MockXhr(),
        expectation = expectations[0],
        wasExpected = false;

    function prettyPrint(data) {
      return (angular.isString(data) || angular.isFunction(data) || data instanceof RegExp)
          ? data
          : angular.toJson(data);
    }

    function wrapResponse(wrapped) {
      if (!$browser && timeout) {
        timeout.then ? timeout.then(handleTimeout) : $timeout(handleTimeout, timeout);
      }

      return handleResponse;

      function handleResponse() {
        var response = wrapped.response(method, url, data, headers);
        xhr.$$respHeaders = response[2];
        callback(copy(response[0]), copy(response[1]), xhr.getAllResponseHeaders(),
                 copy(response[3] || ''));
      }

      function handleTimeout() {
        for (var i = 0, ii = responses.length; i < ii; i++) {
          if (responses[i] === handleResponse) {
            responses.splice(i, 1);
            callback(-1, undefined, '');
            break;
          }
        }
      }
    }

    if (expectation && expectation.match(method, url)) {
      if (!expectation.matchData(data))
        throw new Error('Expected ' + expectation + ' with different data\n' +
            'EXPECTED: ' + prettyPrint(expectation.data) + '\nGOT:      ' + data);

      if (!expectation.matchHeaders(headers))
        throw new Error('Expected ' + expectation + ' with different headers\n' +
                        'EXPECTED: ' + prettyPrint(expectation.headers) + '\nGOT:      ' +
                        prettyPrint(headers));

      expectations.shift();

      if (expectation.response) {
        responses.push(wrapResponse(expectation));
        return;
      }
      wasExpected = true;
    }

    var i = -1, definition;
    while ((definition = definitions[++i])) {
      if (definition.match(method, url, data, headers || {})) {
        if (definition.response) {
          // if $browser specified, we do auto flush all requests
          ($browser ? $browser.defer : responsesPush)(wrapResponse(definition));
        } else if (definition.passThrough) {
          $delegate(method, url, data, callback, headers, timeout, withCredentials);
        } else throw new Error('No response defined !');
        return;
      }
    }
    throw wasExpected ?
        new Error('No response defined !') :
        new Error('Unexpected request: ' + method + ' ' + url + '\n' +
                  (expectation ? 'Expected ' + expectation : 'No more request expected'));
  }

  /**
   * @ngdoc method
   * @name $httpBackend#when
   * @description
   * Creates a new backend definition.
   *
   * @param {string} method HTTP method.
   * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
   *   and returns true if the url match the current definition.
   * @param {(string|RegExp|function(string))=} data HTTP request body or function that receives
   *   data string and returns true if the data is as expected.
   * @param {(Object|function(Object))=} headers HTTP headers or function that receives http header
   *   object and returns true if the headers match the current definition.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   *
   *  - respond –
   *      `{function([status,] data[, headers, statusText])
   *      | function(function(method, url, data, headers)}`
   *    – The respond method takes a set of static data to be returned or a function that can
   *    return an array containing response status (number), response data (string), response
   *    headers (Object), and the text for the status (string). The respond method returns the
   *    `requestHandler` object for possible overrides.
   */
  $httpBackend.when = function(method, url, data, headers) {
    var definition = new MockHttpExpectation(method, url, data, headers),
        chain = {
          respond: function(status, data, headers, statusText) {
            definition.passThrough = undefined;
            definition.response = createResponse(status, data, headers, statusText);
            return chain;
          }
        };

    if ($browser) {
      chain.passThrough = function() {
        definition.response = undefined;
        definition.passThrough = true;
        return chain;
      };
    }

    definitions.push(definition);
    return chain;
  };

  /**
   * @ngdoc method
   * @name $httpBackend#whenGET
   * @description
   * Creates a new backend definition for GET requests. For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
   *   and returns true if the url match the current definition.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#whenHEAD
   * @description
   * Creates a new backend definition for HEAD requests. For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
   *   and returns true if the url match the current definition.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#whenDELETE
   * @description
   * Creates a new backend definition for DELETE requests. For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
   *   and returns true if the url match the current definition.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#whenPOST
   * @description
   * Creates a new backend definition for POST requests. For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
   *   and returns true if the url match the current definition.
   * @param {(string|RegExp|function(string))=} data HTTP request body or function that receives
   *   data string and returns true if the data is as expected.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#whenPUT
   * @description
   * Creates a new backend definition for PUT requests.  For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
   *   and returns true if the url match the current definition.
   * @param {(string|RegExp|function(string))=} data HTTP request body or function that receives
   *   data string and returns true if the data is as expected.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#whenJSONP
   * @description
   * Creates a new backend definition for JSONP requests. For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
   *   and returns true if the url match the current definition.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */
  createShortMethods('when');


  /**
   * @ngdoc method
   * @name $httpBackend#expect
   * @description
   * Creates a new request expectation.
   *
   * @param {string} method HTTP method.
   * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
   *   and returns true if the url match the current definition.
   * @param {(string|RegExp|function(string)|Object)=} data HTTP request body or function that
   *  receives data string and returns true if the data is as expected, or Object if request body
   *  is in JSON format.
   * @param {(Object|function(Object))=} headers HTTP headers or function that receives http header
   *   object and returns true if the headers match the current expectation.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *  request is handled. You can save this object for later use and invoke `respond` again in
   *  order to change how a matched request is handled.
   *
   *  - respond –
   *    `{function([status,] data[, headers, statusText])
   *    | function(function(method, url, data, headers)}`
   *    – The respond method takes a set of static data to be returned or a function that can
   *    return an array containing response status (number), response data (string), response
   *    headers (Object), and the text for the status (string). The respond method returns the
   *    `requestHandler` object for possible overrides.
   */
  $httpBackend.expect = function(method, url, data, headers) {
    var expectation = new MockHttpExpectation(method, url, data, headers),
        chain = {
          respond: function(status, data, headers, statusText) {
            expectation.response = createResponse(status, data, headers, statusText);
            return chain;
          }
        };

    expectations.push(expectation);
    return chain;
  };


  /**
   * @ngdoc method
   * @name $httpBackend#expectGET
   * @description
   * Creates a new request expectation for GET requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
   *   and returns true if the url match the current definition.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled. See #expect for more info.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectHEAD
   * @description
   * Creates a new request expectation for HEAD requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
   *   and returns true if the url match the current definition.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectDELETE
   * @description
   * Creates a new request expectation for DELETE requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
   *   and returns true if the url match the current definition.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectPOST
   * @description
   * Creates a new request expectation for POST requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
   *   and returns true if the url match the current definition.
   * @param {(string|RegExp|function(string)|Object)=} data HTTP request body or function that
   *  receives data string and returns true if the data is as expected, or Object if request body
   *  is in JSON format.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectPUT
   * @description
   * Creates a new request expectation for PUT requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
   *   and returns true if the url match the current definition.
   * @param {(string|RegExp|function(string)|Object)=} data HTTP request body or function that
   *  receives data string and returns true if the data is as expected, or Object if request body
   *  is in JSON format.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectPATCH
   * @description
   * Creates a new request expectation for PATCH requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
   *   and returns true if the url match the current definition.
   * @param {(string|RegExp|function(string)|Object)=} data HTTP request body or function that
   *  receives data string and returns true if the data is as expected, or Object if request body
   *  is in JSON format.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectJSONP
   * @description
   * Creates a new request expectation for JSONP requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
   *   and returns true if the url match the current definition.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */
  createShortMethods('expect');


  /**
   * @ngdoc method
   * @name $httpBackend#flush
   * @description
   * Flushes all pending requests using the trained responses.
   *
   * @param {number=} count Number of responses to flush (in the order they arrived). If undefined,
   *   all pending requests will be flushed. If there are no pending requests when the flush method
   *   is called an exception is thrown (as this typically a sign of programming error).
   */
  $httpBackend.flush = function(count, digest) {
    if (digest !== false) $rootScope.$digest();
    if (!responses.length) throw new Error('No pending request to flush !');

    if (angular.isDefined(count) && count !== null) {
      while (count--) {
        if (!responses.length) throw new Error('No more pending request to flush !');
        responses.shift()();
      }
    } else {
      while (responses.length) {
        responses.shift()();
      }
    }
    $httpBackend.verifyNoOutstandingExpectation(digest);
  };


  /**
   * @ngdoc method
   * @name $httpBackend#verifyNoOutstandingExpectation
   * @description
   * Verifies that all of the requests defined via the `expect` api were made. If any of the
   * requests were not made, verifyNoOutstandingExpectation throws an exception.
   *
   * Typically, you would call this method following each test case that asserts requests using an
   * "afterEach" clause.
   *
   * ```js
   *   afterEach($httpBackend.verifyNoOutstandingExpectation);
   * ```
   */
  $httpBackend.verifyNoOutstandingExpectation = function(digest) {
    if (digest !== false) $rootScope.$digest();
    if (expectations.length) {
      throw new Error('Unsatisfied requests: ' + expectations.join(', '));
    }
  };


  /**
   * @ngdoc method
   * @name $httpBackend#verifyNoOutstandingRequest
   * @description
   * Verifies that there are no outstanding requests that need to be flushed.
   *
   * Typically, you would call this method following each test case that asserts requests using an
   * "afterEach" clause.
   *
   * ```js
   *   afterEach($httpBackend.verifyNoOutstandingRequest);
   * ```
   */
  $httpBackend.verifyNoOutstandingRequest = function() {
    if (responses.length) {
      throw new Error('Unflushed requests: ' + responses.length);
    }
  };


  /**
   * @ngdoc method
   * @name $httpBackend#resetExpectations
   * @description
   * Resets all request expectations, but preserves all backend definitions. Typically, you would
   * call resetExpectations during a multiple-phase test when you want to reuse the same instance of
   * $httpBackend mock.
   */
  $httpBackend.resetExpectations = function() {
    expectations.length = 0;
    responses.length = 0;
  };

  return $httpBackend;


  function createShortMethods(prefix) {
    angular.forEach(['GET', 'DELETE', 'JSONP', 'HEAD'], function(method) {
     $httpBackend[prefix + method] = function(url, headers) {
       return $httpBackend[prefix](method, url, undefined, headers);
     };
    });

    angular.forEach(['PUT', 'POST', 'PATCH'], function(method) {
      $httpBackend[prefix + method] = function(url, data, headers) {
        return $httpBackend[prefix](method, url, data, headers);
      };
    });
  }
}

function MockHttpExpectation(method, url, data, headers) {

  this.data = data;
  this.headers = headers;

  this.match = function(m, u, d, h) {
    if (method != m) return false;
    if (!this.matchUrl(u)) return false;
    if (angular.isDefined(d) && !this.matchData(d)) return false;
    if (angular.isDefined(h) && !this.matchHeaders(h)) return false;
    return true;
  };

  this.matchUrl = function(u) {
    if (!url) return true;
    if (angular.isFunction(url.test)) return url.test(u);
    if (angular.isFunction(url)) return url(u);
    return url == u;
  };

  this.matchHeaders = function(h) {
    if (angular.isUndefined(headers)) return true;
    if (angular.isFunction(headers)) return headers(h);
    return angular.equals(headers, h);
  };

  this.matchData = function(d) {
    if (angular.isUndefined(data)) return true;
    if (data && angular.isFunction(data.test)) return data.test(d);
    if (data && angular.isFunction(data)) return data(d);
    if (data && !angular.isString(data)) {
      return angular.equals(angular.fromJson(angular.toJson(data)), angular.fromJson(d));
    }
    return data == d;
  };

  this.toString = function() {
    return method + ' ' + url;
  };
}

function createMockXhr() {
  return new MockXhr();
}

function MockXhr() {

  // hack for testing $http, $httpBackend
  MockXhr.$$lastInstance = this;

  this.open = function(method, url, async) {
    this.$$method = method;
    this.$$url = url;
    this.$$async = async;
    this.$$reqHeaders = {};
    this.$$respHeaders = {};
  };

  this.send = function(data) {
    this.$$data = data;
  };

  this.setRequestHeader = function(key, value) {
    this.$$reqHeaders[key] = value;
  };

  this.getResponseHeader = function(name) {
    // the lookup must be case insensitive,
    // that's why we try two quick lookups first and full scan last
    var header = this.$$respHeaders[name];
    if (header) return header;

    name = angular.lowercase(name);
    header = this.$$respHeaders[name];
    if (header) return header;

    header = undefined;
    angular.forEach(this.$$respHeaders, function(headerVal, headerName) {
      if (!header && angular.lowercase(headerName) == name) header = headerVal;
    });
    return header;
  };

  this.getAllResponseHeaders = function() {
    var lines = [];

    angular.forEach(this.$$respHeaders, function(value, key) {
      lines.push(key + ': ' + value);
    });
    return lines.join('\n');
  };

  this.abort = angular.noop;
}


/**
 * @ngdoc service
 * @name $timeout
 * @description
 *
 * This service is just a simple decorator for {@link ng.$timeout $timeout} service
 * that adds a "flush" and "verifyNoPendingTasks" methods.
 */

angular.mock.$TimeoutDecorator = ['$delegate', '$browser', function($delegate, $browser) {

  /**
   * @ngdoc method
   * @name $timeout#flush
   * @description
   *
   * Flushes the queue of pending tasks.
   *
   * @param {number=} delay maximum timeout amount to flush up until
   */
  $delegate.flush = function(delay) {
    $browser.defer.flush(delay);
  };

  /**
   * @ngdoc method
   * @name $timeout#verifyNoPendingTasks
   * @description
   *
   * Verifies that there are no pending tasks that need to be flushed.
   */
  $delegate.verifyNoPendingTasks = function() {
    if ($browser.deferredFns.length) {
      throw new Error('Deferred tasks to flush (' + $browser.deferredFns.length + '): ' +
          formatPendingTasksAsString($browser.deferredFns));
    }
  };

  function formatPendingTasksAsString(tasks) {
    var result = [];
    angular.forEach(tasks, function(task) {
      result.push('{id: ' + task.id + ', ' + 'time: ' + task.time + '}');
    });

    return result.join(', ');
  }

  return $delegate;
}];

angular.mock.$RAFDecorator = ['$delegate', function($delegate) {
  var queue = [];
  var rafFn = function(fn) {
    var index = queue.length;
    queue.push(fn);
    return function() {
      queue.splice(index, 1);
    };
  };

  rafFn.supported = $delegate.supported;

  rafFn.flush = function() {
    if (queue.length === 0) {
      throw new Error('No rAF callbacks present');
    }

    var length = queue.length;
    for (var i = 0; i < length; i++) {
      queue[i]();
    }

    queue = [];
  };

  return rafFn;
}];

angular.mock.$AsyncCallbackDecorator = ['$delegate', function($delegate) {
  var callbacks = [];
  var addFn = function(fn) {
    callbacks.push(fn);
  };
  addFn.flush = function() {
    angular.forEach(callbacks, function(fn) {
      fn();
    });
    callbacks = [];
  };
  return addFn;
}];

/**
 *
 */
angular.mock.$RootElementProvider = function() {
  this.$get = function() {
    return angular.element('<div ng-app></div>');
  };
};

/**
 * @ngdoc service
 * @name $controller
 * @description
 * A decorator for {@link ng.$controller} with additional `bindings` parameter, useful when testing
 * controllers of directives that use {@link $compile#-bindtocontroller- `bindToController`}.
 *
 *
 * ## Example
 *
 * ```js
 *
 * // Directive definition ...
 *
 * myMod.directive('myDirective', {
 *   controller: 'MyDirectiveController',
 *   bindToController: {
 *     name: '@'
 *   }
 * });
 *
 *
 * // Controller definition ...
 *
 * myMod.controller('MyDirectiveController', ['log', function($log) {
 *   $log.info(this.name);
 * })];
 *
 *
 * // In a test ...
 *
 * describe('myDirectiveController', function() {
 *   it('should write the bound name to the log', inject(function($controller, $log) {
 *     var ctrl = $controller('MyDirective', { /* no locals &#42;/ }, { name: 'Clark Kent' });
 *     expect(ctrl.name).toEqual('Clark Kent');
 *     expect($log.info.logs).toEqual(['Clark Kent']);
 *   });
 * });
 *
 * ```
 *
 * @param {Function|string} constructor If called with a function then it's considered to be the
 *    controller constructor function. Otherwise it's considered to be a string which is used
 *    to retrieve the controller constructor using the following steps:
 *
 *    * check if a controller with given name is registered via `$controllerProvider`
 *    * check if evaluating the string on the current scope returns a constructor
 *    * if $controllerProvider#allowGlobals, check `window[constructor]` on the global
 *      `window` object (not recommended)
 *
 *    The string can use the `controller as property` syntax, where the controller instance is published
 *    as the specified property on the `scope`; the `scope` must be injected into `locals` param for this
 *    to work correctly.
 *
 * @param {Object} locals Injection locals for Controller.
 * @param {Object=} bindings Properties to add to the controller before invoking the constructor. This is used
 *                           to simulate the `bindToController` feature and simplify certain kinds of tests.
 * @return {Object} Instance of given controller.
 */
angular.mock.$ControllerDecorator = ['$delegate', function($delegate) {
  return function(expression, locals, later, ident) {
    if (later && typeof later === 'object') {
      var create = $delegate(expression, locals, true, ident);
      angular.extend(create.instance, later);
      return create();
    }
    return $delegate(expression, locals, later, ident);
  };
}];


/**
 * @ngdoc module
 * @name ngMock
 * @packageName angular-mocks
 * @description
 *
 * # ngMock
 *
 * The `ngMock` module provides support to inject and mock Angular services into unit tests.
 * In addition, ngMock also extends various core ng services such that they can be
 * inspected and controlled in a synchronous manner within test code.
 *
 *
 * <div doc-module-components="ngMock"></div>
 *
 */
angular.module('ngMock', ['ng']).provider({
  $browser: angular.mock.$BrowserProvider,
  $exceptionHandler: angular.mock.$ExceptionHandlerProvider,
  $log: angular.mock.$LogProvider,
  $interval: angular.mock.$IntervalProvider,
  $httpBackend: angular.mock.$HttpBackendProvider,
  $rootElement: angular.mock.$RootElementProvider
}).config(['$provide', function($provide) {
  $provide.decorator('$timeout', angular.mock.$TimeoutDecorator);
  $provide.decorator('$$rAF', angular.mock.$RAFDecorator);
  $provide.decorator('$$asyncCallback', angular.mock.$AsyncCallbackDecorator);
  $provide.decorator('$rootScope', angular.mock.$RootScopeDecorator);
  $provide.decorator('$controller', angular.mock.$ControllerDecorator);
}]);

/**
 * @ngdoc module
 * @name ngMockE2E
 * @module ngMockE2E
 * @packageName angular-mocks
 * @description
 *
 * The `ngMockE2E` is an angular module which contains mocks suitable for end-to-end testing.
 * Currently there is only one mock present in this module -
 * the {@link ngMockE2E.$httpBackend e2e $httpBackend} mock.
 */
angular.module('ngMockE2E', ['ng']).config(['$provide', function($provide) {
  $provide.decorator('$httpBackend', angular.mock.e2e.$httpBackendDecorator);
}]);

/**
 * @ngdoc service
 * @name $httpBackend
 * @module ngMockE2E
 * @description
 * Fake HTTP backend implementation suitable for end-to-end testing or backend-less development of
 * applications that use the {@link ng.$http $http service}.
 *
 * *Note*: For fake http backend implementation suitable for unit testing please see
 * {@link ngMock.$httpBackend unit-testing $httpBackend mock}.
 *
 * This implementation can be used to respond with static or dynamic responses via the `when` api
 * and its shortcuts (`whenGET`, `whenPOST`, etc) and optionally pass through requests to the
 * real $httpBackend for specific requests (e.g. to interact with certain remote apis or to fetch
 * templates from a webserver).
 *
 * As opposed to unit-testing, in an end-to-end testing scenario or in scenario when an application
 * is being developed with the real backend api replaced with a mock, it is often desirable for
 * certain category of requests to bypass the mock and issue a real http request (e.g. to fetch
 * templates or static files from the webserver). To configure the backend with this behavior
 * use the `passThrough` request handler of `when` instead of `respond`.
 *
 * Additionally, we don't want to manually have to flush mocked out requests like we do during unit
 * testing. For this reason the e2e $httpBackend flushes mocked out requests
 * automatically, closely simulating the behavior of the XMLHttpRequest object.
 *
 * To setup the application to run with this http backend, you have to create a module that depends
 * on the `ngMockE2E` and your application modules and defines the fake backend:
 *
 * ```js
 *   myAppDev = angular.module('myAppDev', ['myApp', 'ngMockE2E']);
 *   myAppDev.run(function($httpBackend) {
 *     phones = [{name: 'phone1'}, {name: 'phone2'}];
 *
 *     // returns the current list of phones
 *     $httpBackend.whenGET('/phones').respond(phones);
 *
 *     // adds a new phone to the phones array
 *     $httpBackend.whenPOST('/phones').respond(function(method, url, data) {
 *       var phone = angular.fromJson(data);
 *       phones.push(phone);
 *       return [200, phone, {}];
 *     });
 *     $httpBackend.whenGET(/^\/templates\//).passThrough();
 *     //...
 *   });
 * ```
 *
 * Afterwards, bootstrap your app with this new module.
 */

/**
 * @ngdoc method
 * @name $httpBackend#when
 * @module ngMockE2E
 * @description
 * Creates a new backend definition.
 *
 * @param {string} method HTTP method.
 * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
 *   and returns true if the url match the current definition.
 * @param {(string|RegExp)=} data HTTP request body.
 * @param {(Object|function(Object))=} headers HTTP headers or function that receives http header
 *   object and returns true if the headers match the current definition.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 *
 *  - respond –
 *    `{function([status,] data[, headers, statusText])
 *    | function(function(method, url, data, headers)}`
 *    – The respond method takes a set of static data to be returned or a function that can return
 *    an array containing response status (number), response data (string), response headers
 *    (Object), and the text for the status (string).
 *  - passThrough – `{function()}` – Any request matching a backend definition with
 *    `passThrough` handler will be passed through to the real backend (an XHR request will be made
 *    to the server.)
 *  - Both methods return the `requestHandler` object for possible overrides.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenGET
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for GET requests. For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
 *   and returns true if the url match the current definition.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenHEAD
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for HEAD requests. For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
 *   and returns true if the url match the current definition.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenDELETE
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for DELETE requests. For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
 *   and returns true if the url match the current definition.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenPOST
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for POST requests. For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
 *   and returns true if the url match the current definition.
 * @param {(string|RegExp)=} data HTTP request body.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenPUT
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for PUT requests.  For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
 *   and returns true if the url match the current definition.
 * @param {(string|RegExp)=} data HTTP request body.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenPATCH
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for PATCH requests.  For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
 *   and returns true if the url match the current definition.
 * @param {(string|RegExp)=} data HTTP request body.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenJSONP
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for JSONP requests. For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives the url
 *   and returns true if the url match the current definition.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */
angular.mock.e2e = {};
angular.mock.e2e.$httpBackendDecorator =
  ['$rootScope', '$timeout', '$delegate', '$browser', createHttpBackendMock];


/**
 * @ngdoc type
 * @name $rootScope.Scope
 * @module ngMock
 * @description
 * {@link ng.$rootScope.Scope Scope} type decorated with helper methods useful for testing. These
 * methods are automatically available on any {@link ng.$rootScope.Scope Scope} instance when
 * `ngMock` module is loaded.
 *
 * In addition to all the regular `Scope` methods, the following helper methods are available:
 */
angular.mock.$RootScopeDecorator = ['$delegate', function($delegate) {

  var $rootScopePrototype = Object.getPrototypeOf($delegate);

  $rootScopePrototype.$countChildScopes = countChildScopes;
  $rootScopePrototype.$countWatchers = countWatchers;

  return $delegate;

  // ------------------------------------------------------------------------------------------ //

  /**
   * @ngdoc method
   * @name $rootScope.Scope#$countChildScopes
   * @module ngMock
   * @description
   * Counts all the direct and indirect child scopes of the current scope.
   *
   * The current scope is excluded from the count. The count includes all isolate child scopes.
   *
   * @returns {number} Total number of child scopes.
   */
  function countChildScopes() {
    // jshint validthis: true
    var count = 0; // exclude the current scope
    var pendingChildHeads = [this.$$childHead];
    var currentScope;

    while (pendingChildHeads.length) {
      currentScope = pendingChildHeads.shift();

      while (currentScope) {
        count += 1;
        pendingChildHeads.push(currentScope.$$childHead);
        currentScope = currentScope.$$nextSibling;
      }
    }

    return count;
  }


  /**
   * @ngdoc method
   * @name $rootScope.Scope#$countWatchers
   * @module ngMock
   * @description
   * Counts all the watchers of direct and indirect child scopes of the current scope.
   *
   * The watchers of the current scope are included in the count and so are all the watchers of
   * isolate child scopes.
   *
   * @returns {number} Total number of watchers.
   */
  function countWatchers() {
    // jshint validthis: true
    var count = this.$$watchers ? this.$$watchers.length : 0; // include the current scope
    var pendingChildHeads = [this.$$childHead];
    var currentScope;

    while (pendingChildHeads.length) {
      currentScope = pendingChildHeads.shift();

      while (currentScope) {
        count += currentScope.$$watchers ? currentScope.$$watchers.length : 0;
        pendingChildHeads.push(currentScope.$$childHead);
        currentScope = currentScope.$$nextSibling;
      }
    }

    return count;
  }
}];


if (window.jasmine || window.mocha) {

  var currentSpec = null,
      annotatedFunctions = [],
      isSpecRunning = function() {
        return !!currentSpec;
      };

  angular.mock.$$annotate = angular.injector.$$annotate;
  angular.injector.$$annotate = function(fn) {
    if (typeof fn === 'function' && !fn.$inject) {
      annotatedFunctions.push(fn);
    }
    return angular.mock.$$annotate.apply(this, arguments);
  };


  (window.beforeEach || window.setup)(function() {
    annotatedFunctions = [];
    currentSpec = this;
  });

  (window.afterEach || window.teardown)(function() {
    var injector = currentSpec.$injector;

    annotatedFunctions.forEach(function(fn) {
      delete fn.$inject;
    });

    angular.forEach(currentSpec.$modules, function(module) {
      if (module && module.$$hashKey) {
        module.$$hashKey = undefined;
      }
    });

    currentSpec.$injector = null;
    currentSpec.$modules = null;
    currentSpec = null;

    if (injector) {
      injector.get('$rootElement').off();
      injector.get('$browser').pollFns.length = 0;
    }

    // clean up jquery's fragment cache
    angular.forEach(angular.element.fragments, function(val, key) {
      delete angular.element.fragments[key];
    });

    MockXhr.$$lastInstance = null;

    angular.forEach(angular.callbacks, function(val, key) {
      delete angular.callbacks[key];
    });
    angular.callbacks.counter = 0;
  });

  /**
   * @ngdoc function
   * @name angular.mock.module
   * @description
   *
   * *NOTE*: This function is also published on window for easy access.<br>
   * *NOTE*: This function is declared ONLY WHEN running tests with jasmine or mocha
   *
   * This function registers a module configuration code. It collects the configuration information
   * which will be used when the injector is created by {@link angular.mock.inject inject}.
   *
   * See {@link angular.mock.inject inject} for usage example
   *
   * @param {...(string|Function|Object)} fns any number of modules which are represented as string
   *        aliases or as anonymous module initialization functions. The modules are used to
   *        configure the injector. The 'ng' and 'ngMock' modules are automatically loaded. If an
   *        object literal is passed they will be registered as values in the module, the key being
   *        the module name and the value being what is returned.
   */
  window.module = angular.mock.module = function() {
    var moduleFns = Array.prototype.slice.call(arguments, 0);
    return isSpecRunning() ? workFn() : workFn;
    /////////////////////
    function workFn() {
      if (currentSpec.$injector) {
        throw new Error('Injector already created, can not register a module!');
      } else {
        var modules = currentSpec.$modules || (currentSpec.$modules = []);
        angular.forEach(moduleFns, function(module) {
          if (angular.isObject(module) && !angular.isArray(module)) {
            modules.push(function($provide) {
              angular.forEach(module, function(value, key) {
                $provide.value(key, value);
              });
            });
          } else {
            modules.push(module);
          }
        });
      }
    }
  };

  /**
   * @ngdoc function
   * @name angular.mock.inject
   * @description
   *
   * *NOTE*: This function is also published on window for easy access.<br>
   * *NOTE*: This function is declared ONLY WHEN running tests with jasmine or mocha
   *
   * The inject function wraps a function into an injectable function. The inject() creates new
   * instance of {@link auto.$injector $injector} per test, which is then used for
   * resolving references.
   *
   *
   * ## Resolving References (Underscore Wrapping)
   * Often, we would like to inject a reference once, in a `beforeEach()` block and reuse this
   * in multiple `it()` clauses. To be able to do this we must assign the reference to a variable
   * that is declared in the scope of the `describe()` block. Since we would, most likely, want
   * the variable to have the same name of the reference we have a problem, since the parameter
   * to the `inject()` function would hide the outer variable.
   *
   * To help with this, the injected parameters can, optionally, be enclosed with underscores.
   * These are ignored by the injector when the reference name is resolved.
   *
   * For example, the parameter `_myService_` would be resolved as the reference `myService`.
   * Since it is available in the function body as _myService_, we can then assign it to a variable
   * defined in an outer scope.
   *
   * ```
   * // Defined out reference variable outside
   * var myService;
   *
   * // Wrap the parameter in underscores
   * beforeEach( inject( function(_myService_){
   *   myService = _myService_;
   * }));
   *
   * // Use myService in a series of tests.
   * it('makes use of myService', function() {
   *   myService.doStuff();
   * });
   *
   * ```
   *
   * See also {@link angular.mock.module angular.mock.module}
   *
   * ## Example
   * Example of what a typical jasmine tests looks like with the inject method.
   * ```js
   *
   *   angular.module('myApplicationModule', [])
   *       .value('mode', 'app')
   *       .value('version', 'v1.0.1');
   *
   *
   *   describe('MyApp', function() {
   *
   *     // You need to load modules that you want to test,
   *     // it loads only the "ng" module by default.
   *     beforeEach(module('myApplicationModule'));
   *
   *
   *     // inject() is used to inject arguments of all given functions
   *     it('should provide a version', inject(function(mode, version) {
   *       expect(version).toEqual('v1.0.1');
   *       expect(mode).toEqual('app');
   *     }));
   *
   *
   *     // The inject and module method can also be used inside of the it or beforeEach
   *     it('should override a version and test the new version is injected', function() {
   *       // module() takes functions or strings (module aliases)
   *       module(function($provide) {
   *         $provide.value('version', 'overridden'); // override version here
   *       });
   *
   *       inject(function(version) {
   *         expect(version).toEqual('overridden');
   *       });
   *     });
   *   });
   *
   * ```
   *
   * @param {...Function} fns any number of functions which will be injected using the injector.
   */



  var ErrorAddingDeclarationLocationStack = function(e, errorForStack) {
    this.message = e.message;
    this.name = e.name;
    if (e.line) this.line = e.line;
    if (e.sourceId) this.sourceId = e.sourceId;
    if (e.stack && errorForStack)
      this.stack = e.stack + '\n' + errorForStack.stack;
    if (e.stackArray) this.stackArray = e.stackArray;
  };
  ErrorAddingDeclarationLocationStack.prototype.toString = Error.prototype.toString;

  window.inject = angular.mock.inject = function() {
    var blockFns = Array.prototype.slice.call(arguments, 0);
    var errorForStack = new Error('Declaration Location');
    return isSpecRunning() ? workFn.call(currentSpec) : workFn;
    /////////////////////
    function workFn() {
      var modules = currentSpec.$modules || [];
      var strictDi = !!currentSpec.$injectorStrict;
      modules.unshift('ngMock');
      modules.unshift('ng');
      var injector = currentSpec.$injector;
      if (!injector) {
        if (strictDi) {
          // If strictDi is enabled, annotate the providerInjector blocks
          angular.forEach(modules, function(moduleFn) {
            if (typeof moduleFn === "function") {
              angular.injector.$$annotate(moduleFn);
            }
          });
        }
        injector = currentSpec.$injector = angular.injector(modules, strictDi);
        currentSpec.$injectorStrict = strictDi;
      }
      for (var i = 0, ii = blockFns.length; i < ii; i++) {
        if (currentSpec.$injectorStrict) {
          // If the injector is strict / strictDi, and the spec wants to inject using automatic
          // annotation, then annotate the function here.
          injector.annotate(blockFns[i]);
        }
        try {
          /* jshint -W040 *//* Jasmine explicitly provides a `this` object when calling functions */
          injector.invoke(blockFns[i] || angular.noop, this);
          /* jshint +W040 */
        } catch (e) {
          if (e.stack && errorForStack) {
            throw new ErrorAddingDeclarationLocationStack(e, errorForStack);
          }
          throw e;
        } finally {
          errorForStack = null;
        }
      }
    }
  };


  angular.mock.inject.strictDi = function(value) {
    value = arguments.length ? !!value : true;
    return isSpecRunning() ? workFn() : workFn;

    function workFn() {
      if (value !== currentSpec.$injectorStrict) {
        if (currentSpec.$injector) {
          throw new Error('Injector already created, can not modify strict annotations');
        } else {
          currentSpec.$injectorStrict = value;
        }
      }
    }
  };
}


})(window, window.angular);

},{}],2:[function(require,module,exports){
/**
 * angular-spinner version 0.5.1
 * License: MIT.
 * Copyright (C) 2013, 2014, Uri Shaked and contributors.
 */

(function (root) {
	'use strict';

	function factory(angular, Spinner) {

		angular
			.module('angularSpinner', [])

			.factory('usSpinnerService', ['$rootScope', function ($rootScope) {
				var config = {};

				config.spin = function (key) {
					$rootScope.$broadcast('us-spinner:spin', key);
				};

				config.stop = function (key) {
					$rootScope.$broadcast('us-spinner:stop', key);
				};

				return config;
			}])

			.directive('usSpinner', ['$window', function ($window) {
				return {
					scope: true,
					link: function (scope, element, attr) {
						var SpinnerConstructor = Spinner || $window.Spinner;

						scope.spinner = null;

						scope.key = angular.isDefined(attr.spinnerKey) ? attr.spinnerKey : false;

						scope.startActive = angular.isDefined(attr.spinnerStartActive) ?
							attr.spinnerStartActive : scope.key ?
							false : true;

						function stopSpinner() {
							if (scope.spinner) {
								scope.spinner.stop();
							}
						}

						scope.spin = function () {
							if (scope.spinner) {
								scope.spinner.spin(element[0]);
							}
						};

						scope.stop = function () {
							scope.startActive = false;
							stopSpinner();
						};

						scope.$watch(attr.usSpinner, function (options) {
							stopSpinner();
							scope.spinner = new SpinnerConstructor(options);
							if (!scope.key || scope.startActive) {
								scope.spinner.spin(element[0]);
							}
						}, true);

						scope.$on('us-spinner:spin', function (event, key) {
							if (key === scope.key) {
								scope.spin();
							}
						});

						scope.$on('us-spinner:stop', function (event, key) {
							if (key === scope.key) {
								scope.stop();
							}
						});

						scope.$on('$destroy', function () {
							scope.stop();
							scope.spinner = null;
						});
					}
				};
			}]);
	}

	if (typeof define === 'function' && define.amd) {
		/* AMD module */
		define(['angular', 'spin'], factory);
	} else {
		/* Browser global */
		factory(root.angular);
	}
}(window));

},{}],3:[function(require,module,exports){
/**
 * Copyright (c) 2011-2014 Felix Gnass
 * Licensed under the MIT license
 */
(function(root, factory) {

  /* CommonJS */
  if (typeof exports == 'object')  module.exports = factory()

  /* AMD module */
  else if (typeof define == 'function' && define.amd) define(factory)

  /* Browser global */
  else root.Spinner = factory()
}
(this, function() {
  "use strict";

  var prefixes = ['webkit', 'Moz', 'ms', 'O'] /* Vendor prefixes */
    , animations = {} /* Animation rules keyed by their name */
    , useCssAnimations /* Whether to use CSS animations or setTimeout */

  /**
   * Utility function to create elements. If no tag name is given,
   * a DIV is created. Optionally properties can be passed.
   */
  function createEl(tag, prop) {
    var el = document.createElement(tag || 'div')
      , n

    for(n in prop) el[n] = prop[n]
    return el
  }

  /**
   * Appends children and returns the parent.
   */
  function ins(parent /* child1, child2, ...*/) {
    for (var i=1, n=arguments.length; i<n; i++)
      parent.appendChild(arguments[i])

    return parent
  }

  /**
   * Insert a new stylesheet to hold the @keyframe or VML rules.
   */
  var sheet = (function() {
    var el = createEl('style', {type : 'text/css'})
    ins(document.getElementsByTagName('head')[0], el)
    return el.sheet || el.styleSheet
  }())

  /**
   * Creates an opacity keyframe animation rule and returns its name.
   * Since most mobile Webkits have timing issues with animation-delay,
   * we create separate rules for each line/segment.
   */
  function addAnimation(alpha, trail, i, lines) {
    var name = ['opacity', trail, ~~(alpha*100), i, lines].join('-')
      , start = 0.01 + i/lines * 100
      , z = Math.max(1 - (1-alpha) / trail * (100-start), alpha)
      , prefix = useCssAnimations.substring(0, useCssAnimations.indexOf('Animation')).toLowerCase()
      , pre = prefix && '-' + prefix + '-' || ''

    if (!animations[name]) {
      sheet.insertRule(
        '@' + pre + 'keyframes ' + name + '{' +
        '0%{opacity:' + z + '}' +
        start + '%{opacity:' + alpha + '}' +
        (start+0.01) + '%{opacity:1}' +
        (start+trail) % 100 + '%{opacity:' + alpha + '}' +
        '100%{opacity:' + z + '}' +
        '}', sheet.cssRules.length)

      animations[name] = 1
    }

    return name
  }

  /**
   * Tries various vendor prefixes and returns the first supported property.
   */
  function vendor(el, prop) {
    var s = el.style
      , pp
      , i

    prop = prop.charAt(0).toUpperCase() + prop.slice(1)
    for(i=0; i<prefixes.length; i++) {
      pp = prefixes[i]+prop
      if(s[pp] !== undefined) return pp
    }
    if(s[prop] !== undefined) return prop
  }

  /**
   * Sets multiple style properties at once.
   */
  function css(el, prop) {
    for (var n in prop)
      el.style[vendor(el, n)||n] = prop[n]

    return el
  }

  /**
   * Fills in default values.
   */
  function merge(obj) {
    for (var i=1; i < arguments.length; i++) {
      var def = arguments[i]
      for (var n in def)
        if (obj[n] === undefined) obj[n] = def[n]
    }
    return obj
  }

  /**
   * Returns the line color from the given string or array.
   */
  function getColor(color, idx) {
    return typeof color == 'string' ? color : color[idx % color.length]
  }

  // Built-in defaults

  var defaults = {
    lines: 12,            // The number of lines to draw
    length: 7,            // The length of each line
    width: 5,             // The line thickness
    radius: 10,           // The radius of the inner circle
    rotate: 0,            // Rotation offset
    corners: 1,           // Roundness (0..1)
    color: '#000',        // #rgb or #rrggbb
    direction: 1,         // 1: clockwise, -1: counterclockwise
    speed: 1,             // Rounds per second
    trail: 100,           // Afterglow percentage
    opacity: 1/4,         // Opacity of the lines
    fps: 20,              // Frames per second when using setTimeout()
    zIndex: 2e9,          // Use a high z-index by default
    className: 'spinner', // CSS class to assign to the element
    top: '50%',           // center vertically
    left: '50%',          // center horizontally
    position: 'absolute'  // element position
  }

  /** The constructor */
  function Spinner(o) {
    this.opts = merge(o || {}, Spinner.defaults, defaults)
  }

  // Global defaults that override the built-ins:
  Spinner.defaults = {}

  merge(Spinner.prototype, {

    /**
     * Adds the spinner to the given target element. If this instance is already
     * spinning, it is automatically removed from its previous target b calling
     * stop() internally.
     */
    spin: function(target) {
      this.stop()

      var self = this
        , o = self.opts
        , el = self.el = css(createEl(0, {className: o.className}), {position: o.position, width: 0, zIndex: o.zIndex})

      css(el, {
        left: o.left,
        top: o.top
      })
        
      if (target) {
        target.insertBefore(el, target.firstChild||null)
      }

      el.setAttribute('role', 'progressbar')
      self.lines(el, self.opts)

      if (!useCssAnimations) {
        // No CSS animation support, use setTimeout() instead
        var i = 0
          , start = (o.lines - 1) * (1 - o.direction) / 2
          , alpha
          , fps = o.fps
          , f = fps/o.speed
          , ostep = (1-o.opacity) / (f*o.trail / 100)
          , astep = f/o.lines

        ;(function anim() {
          i++;
          for (var j = 0; j < o.lines; j++) {
            alpha = Math.max(1 - (i + (o.lines - j) * astep) % f * ostep, o.opacity)

            self.opacity(el, j * o.direction + start, alpha, o)
          }
          self.timeout = self.el && setTimeout(anim, ~~(1000/fps))
        })()
      }
      return self
    },

    /**
     * Stops and removes the Spinner.
     */
    stop: function() {
      var el = this.el
      if (el) {
        clearTimeout(this.timeout)
        if (el.parentNode) el.parentNode.removeChild(el)
        this.el = undefined
      }
      return this
    },

    /**
     * Internal method that draws the individual lines. Will be overwritten
     * in VML fallback mode below.
     */
    lines: function(el, o) {
      var i = 0
        , start = (o.lines - 1) * (1 - o.direction) / 2
        , seg

      function fill(color, shadow) {
        return css(createEl(), {
          position: 'absolute',
          width: (o.length+o.width) + 'px',
          height: o.width + 'px',
          background: color,
          boxShadow: shadow,
          transformOrigin: 'left',
          transform: 'rotate(' + ~~(360/o.lines*i+o.rotate) + 'deg) translate(' + o.radius+'px' +',0)',
          borderRadius: (o.corners * o.width>>1) + 'px'
        })
      }

      for (; i < o.lines; i++) {
        seg = css(createEl(), {
          position: 'absolute',
          top: 1+~(o.width/2) + 'px',
          transform: o.hwaccel ? 'translate3d(0,0,0)' : '',
          opacity: o.opacity,
          animation: useCssAnimations && addAnimation(o.opacity, o.trail, start + i * o.direction, o.lines) + ' ' + 1/o.speed + 's linear infinite'
        })

        if (o.shadow) ins(seg, css(fill('#000', '0 0 4px ' + '#000'), {top: 2+'px'}))
        ins(el, ins(seg, fill(getColor(o.color, i), '0 0 1px rgba(0,0,0,.1)')))
      }
      return el
    },

    /**
     * Internal method that adjusts the opacity of a single line.
     * Will be overwritten in VML fallback mode below.
     */
    opacity: function(el, i, val) {
      if (i < el.childNodes.length) el.childNodes[i].style.opacity = val
    }

  })


  function initVML() {

    /* Utility function to create a VML tag */
    function vml(tag, attr) {
      return createEl('<' + tag + ' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">', attr)
    }

    // No CSS transforms but VML support, add a CSS rule for VML elements:
    sheet.addRule('.spin-vml', 'behavior:url(#default#VML)')

    Spinner.prototype.lines = function(el, o) {
      var r = o.length+o.width
        , s = 2*r

      function grp() {
        return css(
          vml('group', {
            coordsize: s + ' ' + s,
            coordorigin: -r + ' ' + -r
          }),
          { width: s, height: s }
        )
      }

      var margin = -(o.width+o.length)*2 + 'px'
        , g = css(grp(), {position: 'absolute', top: margin, left: margin})
        , i

      function seg(i, dx, filter) {
        ins(g,
          ins(css(grp(), {rotation: 360 / o.lines * i + 'deg', left: ~~dx}),
            ins(css(vml('roundrect', {arcsize: o.corners}), {
                width: r,
                height: o.width,
                left: o.radius,
                top: -o.width>>1,
                filter: filter
              }),
              vml('fill', {color: getColor(o.color, i), opacity: o.opacity}),
              vml('stroke', {opacity: 0}) // transparent stroke to fix color bleeding upon opacity change
            )
          )
        )
      }

      if (o.shadow)
        for (i = 1; i <= o.lines; i++)
          seg(i, -2, 'progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)')

      for (i = 1; i <= o.lines; i++) seg(i)
      return ins(el, g)
    }

    Spinner.prototype.opacity = function(el, i, val, o) {
      var c = el.firstChild
      o = o.shadow && o.lines || 0
      if (c && i+o < c.childNodes.length) {
        c = c.childNodes[i+o]; c = c && c.firstChild; c = c && c.firstChild
        if (c) c.opacity = val
      }
    }
  }

  var probe = css(createEl('group'), {behavior: 'url(#default#VML)'})

  if (!vendor(probe, 'transform') && probe.adj) initVML()
  else useCssAnimations = vendor(probe, 'animation')

  return Spinner

}));

},{}],4:[function(require,module,exports){
exports.ADD = 'ADD';
exports.REMOVE = 'REMOVE';
exports.CLEAR = 'CLEAR';
exports.TOGGLE = 'TOGGLE';
exports.TOGGLE_ALL = 'TOGGLE_ALL';
exports.REFRESH = 'REFRESH';




},{}],5:[function(require,module,exports){
'use strict';
require('./config/EsiHttpInterceptor');
require('./controllers');
require('./directives');
require('./filters');
require('./services');
require('./stores');
require('./dispatchers');
window.Spinner = require('../bower_components/spin.js/spin');
require('../bower_components/angular-spinner/angular-spinner');


var module = angular.module('app', ['gettext', 'angularSpinner',
'ui.router',
'esi.filters',
'esi.directives', 
'esi.controllers',
'esi.services',
'esi.stores',
'esi.dispatchers',
'esi.EsiHttpInterceptor'
]);


module.config(['$stateProvider', '$urlRouterProvider', '$provide', '$locationProvider',
       function($stateProvider, $urlRouterProvider, $provide, $locationProvider) {
            
    $locationProvider.html5Mode(false);
    
    $urlRouterProvider.otherwise('/todo/all');

    
    $provide.decorator("$exceptionHandler", ['$delegate', '$injector', function($delegate, $injector ) {
        return function(exception, cause) {
            if (exception.message === "SessionExpiredException") {
                $injector.get('$state').transitionTo('error', {message: "Session has Expired"});
                return;
            }
            
            if(exception.message === "SystemError"){
                $injector.get('$state').transitionTo('error', {message: "Sorry, an error has occured"});
                return;
            }
                
            $delegate(exception, cause);
            
            // TODO AM: log exceptions on the server
        };
    }]);
    
    
    $stateProvider
        

        .state('todo', {
            abstract: true,
            url: "/todo",
            controller: "TodoCtrl",
            templateUrl: "/templates/todo.html"
        })
        .state('todo.all', {
            url: "/all",
            filter: 'getItems'
        })
        .state('todo.active', {
            url: "/active",
            filter: 'getActive'
        })
        .state('todo.completed', {
            url: "/completed",
            filter: 'getCompleted'
        })
        
        
        .state('error', {
            url: "/error/:message",
            template: "<h2 class='error'>{{message}}</h2>",
            controller: ["$scope", "$stateParams", function($scope, $stateParams){
                $scope.message = $stateParams.message;
            }]
        });

    }]);


},{"../bower_components/angular-spinner/angular-spinner":2,"../bower_components/spin.js/spin":3,"./config/EsiHttpInterceptor":6,"./controllers":8,"./directives":10,"./dispatchers":12,"./filters":13,"./services":17,"./stores":19}],6:[function(require,module,exports){
'use strict';
/** 
 * register the response interceptor to handle error messages and 'loading' indicator
 */
var module = angular.module('esi.EsiHttpInterceptor', []);

module.config(['$httpProvider', function ($httpProvider) {
    
    var interceptor = ['$q', 'ErrorDisplayService', '$injector','usSpinnerService',
        function ($q, ErrorDisplayService, $injector, usSpinnerService) {
        var $http;
        return {
            request : function(config) {
                
                // show 'loading' indicator
                usSpinnerService.spin('global-spinner');
                
                return config || $q.when(config);
            },
    
            response : function(response) {
                
                // hide error message
                ErrorDisplayService.displayError(null);
                
                // lazily initialize $http variable
                $http = $http || $injector.get('$http');
                
                // hide 'loading' indicator
                if ($http.pendingRequests.length < 1) {
                  usSpinnerService.stop('global-spinner');
                }            
                
                return response || $q.when(response);
            },
    
            responseError : function(response) {
    
                if (response.status === 400) {
                    if(response.data){
                        ErrorDisplayService.displayError(response.data.errorCode);
                    }
                } else if (response.status === 401) {
                    throw new Error('SessionExpiredException');
                } else if(response.status >= 500) {
                    throw new Error('SystemError');
                }
                
                // lazily initialize $http variable
                $http = $http || $injector.get('$http');
                
                // hide 'loading' indicator
                if ($http.pendingRequests.length < 1) {
                  usSpinnerService.stop('global-spinner');
                }
                
                return $q.reject(response);
            }
        };        
    }];
    
    $httpProvider.interceptors.push(interceptor);
    
}]);
},{}],7:[function(require,module,exports){
'use strict';
var uuid = require('node-uuid');
var actions = require('../actions');

module.exports = TodoCtrl;

TodoCtrl.$inject = ['$scope', '$state', 'Dispatcher', 'ErrorDisplayService', 'TodoStore', 'UndoDispatcher'];

function TodoCtrl($scope, $state, Dispatcher, ErrorDisplayService, TodoStore, UndoDispatcher){
    
    $scope.$on('$stateChangeSuccess', function(event, toState){
        $scope.todos = TodoStore[toState.filter]();
    });
    
    function handleChange(){
        $scope.todos = TodoStore[$state.current.filter]();
        $scope.totalCount = TodoStore.getTotalCount();
        $scope.activeCount = TodoStore.getActiveCount();
        $scope.completedCount = TodoStore.getCompletedCount();
        $scope.newTodo = null;
    }
    // load initial state
    handleChange();
    
    TodoStore.onChange(handleChange);
    
    $scope.remove = function(item){
        Dispatcher.emit(actions.REMOVE, item);
    };

    $scope.toggle = function(item){
        Dispatcher.emit(actions.TOGGLE, item);
    };

    $scope.clearCompleted = function(){
        Dispatcher.emit(actions.CLEAR, TodoStore.getCompleted());
        if($state.$current.name === 'todo.completed'){
            $state.go('todo.all');
        }
    };

    $scope.add = function(event){
        
        if(event.keyCode === 13 && !_.isEmpty($scope.newTodo)){
            var todo = {
                id: uuid.v1(),
                name: $scope.newTodo,
                completed: false
            };
            Dispatcher.emit(actions.ADD, todo);
            
        }
        
    };
    
    $scope.hideError = function(){
        ErrorDisplayService.displayError(null);
    };
    
    $scope.undo = function(){
        UndoDispatcher.undo();
    };
    
    $scope.redo = function(){
        UndoDispatcher.redo();
    };
    
    $scope.hasUndo = function(){
        return UndoDispatcher.hasUndo();
    };
    
    $scope.hasRedo = function(){
        return UndoDispatcher.hasRedo();
    };
}
},{"../actions":4,"node-uuid":25}],8:[function(require,module,exports){
'use strict';

var module = angular.module('esi.controllers', []);

module.controller("TodoCtrl", require("./TodoCtrl"));

},{"./TodoCtrl":7}],9:[function(require,module,exports){
'use strict';

module.exports = esiActive;
        
    
/** 'esi-acive' attribute can be added to links in order to style them with 'selected' class when
 * current location path matches the value of the link's href.
 * 
 * For example:
 * <a href="/member/activity" esi-active >activity</a>
 * will get class='active' if current location starts with '/member/activity'
 *
 * Note: '/en' or '/fr' language context or '#' or '#!' hashbang mode will be ignoroed, so
 * <a href="/fr/member/activity" esi-active >activity</a>
 * will get class='active' if current location starts with '/member/activity'
 *
 * It is possible to override href value by providing a value to 'esi-acive' attribute
 * 
 * For example:
 * <a href="/member/activity" esi-active='/member' >member</a>
 * will be 'active' if current location starts with '/member'
 *
 */
esiActive.$inject = ['$location'];
function esiActive($location) {
    return function(scope, elm, attrs) {
        
        // if esi-active attribute value is not provided - use href but without the '/en' or '/fr' or '#' or '#!' prefix
        var href = attrs.esiActive || attrs.href.replace(/^(?:\/en\/)|(?:\/fr\/)|(?:#!?\/)/, '/');
        
        scope.$watch(
            function(){
                return $location.path();
            },
            
            function(path) {
                if (path.match(href)) {
                  elm.addClass("selected");
                } else {
                  elm.removeClass("selected");
                }
            }
        );
    };
}
},{}],10:[function(require,module,exports){
'use strict';

var module = angular.module('esi.directives', []);

module.directive('esiActive', require('./esiActive'));

},{"./esiActive":9}],11:[function(require,module,exports){
'use strict';

var EventEmitter = require('eventemitter2').EventEmitter2;
var util = require('util');

module.exports = UndoDispatcher;
UndoDispatcher.$inject = ['Dispatcher'];

function UndoDispatcher(Dispatcher){
    
    var undoQueue = [];
    var redoQueue = [];
    
    Dispatcher.onAny(function(payload, isRedo) {
        undoQueue.push({action: this.event, payload: payload});
        if(!isRedo){
            redoQueue = [];
        }
    });
    
    // extend EventEmitter
    util.inherits(UndoEmitter, EventEmitter);
    function UndoEmitter (){
        //call super constructor
        EventEmitter.call(this);
    }
    
    UndoEmitter.prototype.undo = function(){
        var event = undoQueue.pop();
        redoQueue.push(event);
        this.emit(event.action, angular.copy(event.payload));
    };

    UndoEmitter.prototype.redo = function(){
        var event = redoQueue.pop();
        Dispatcher.emit(event.action, angular.copy(event.payload), true);
    };
    
    UndoEmitter.prototype.hasUndo = function(){
        return undoQueue.length > 0;
    };
    
    UndoEmitter.prototype.hasRedo = function(){
        return redoQueue.length > 0;
    };
    
    return new UndoEmitter();
    
}

},{"eventemitter2":21,"util":24}],12:[function(require,module,exports){
'use strict';
var EventEmitter = require('eventemitter2').EventEmitter2;

var module = angular.module('esi.dispatchers', []);

module.value('Dispatcher', new EventEmitter());
module.factory("UndoDispatcher", require("./UndoDispatcher"));


},{"./UndoDispatcher":11,"eventemitter2":21}],13:[function(require,module,exports){
'use strict';

/* Filters */

var module = angular.module('esi.filters', []);

module.filter('translateErrorCode', require('./translateErrorCode'));



},{"./translateErrorCode":14}],14:[function(require,module,exports){
'use strict';

module.exports = translateErrorCode;

var ErrorCodes = {
    
    BAD_REQUEST: {
        en: "Unfortunately, we're unable to process your request. We apologize for the inconvenience.",
        fr: "Malheureusement, il nous est impossible de donner suite à votre demande. Nous sommes désolés des inconvénients subis, le cas échéant."
    },
    
    DUPLICATE_ITEM: {
        en: "Can not add duplicate item! Plese try again.",
        fr: "Vous ne pouvez pas ajouter l'article en double ! Plese réessayer ."
    },
    
    SESSION_EXPIRED: {
        en: "Your session has expired.",
        fr: "Votre session a expiré."        
    }
};


translateErrorCode.$inject = ['gettextCatalog'];

function translateErrorCode (gettextCatalog) {
    return function(errorCode) {
        var lang = gettextCatalog.currentLanguage === "fr_CA" ? 'fr' : 'en';
        if(ErrorCodes[errorCode] && ErrorCodes[errorCode][lang]){
            return ErrorCodes[errorCode][lang];
        }else{
            return errorCode;
        }
    };
    
}

},{}],15:[function(require,module,exports){
'use strict';

module.exports = ErrorDisplayService;

ErrorDisplayService.$inject = ['$rootScope', '$location', '$anchorScroll'];

function ErrorDisplayService($rootScope, $location, $anchorScroll){
    return {
        displayError: function(errorCode){
            $rootScope.errorMsg = errorCode;
            $location.hash('errorAnchor');
            $anchorScroll();    
            $location.hash(null);
        }
    };
}
},{}],16:[function(require,module,exports){
"use strict";

module.exports = TodoService;

TodoService.$inject = ['$http'];

function TodoService($http){
    
    
    return {
        getTodos: function(){
            return $http.get("/todos").then(function(response){
                return response.data;
            });
        },
        
        add: function(item){
            return $http.post("/todos", item).then(function(response){
                return response.data;
            });
        },
        
        remove: function(item){
            return $http({method:"DELETE",url:"/todos/"+item.id}).then(function(response){
                return response.data;
            });
        },
        
        update: function(item){
            return $http.put("/todos", item).then(function(response){
                return response.data;
            });            
        },
        
        clearCompleted: function(){
            return $http({method:"DELETE",url:"/todos/completed"}).then(function(response){
                return response.data;
            });            
        }
        
    };


}


},{}],17:[function(require,module,exports){
'use strict';

var module = angular.module('esi.services', []);

module.factory("TodoService", require("./TodoService"));
module.factory("ErrorDisplayService", require("./ErrorDisplayService"));


},{"./ErrorDisplayService":15,"./TodoService":16}],18:[function(require,module,exports){
"use strict";

var EventEmitter = require('events').EventEmitter;
var actions = require('../actions');

module.exports = TodoStore;

TodoStore.$inject = ['Dispatcher', 'TodoService', 'UndoDispatcher'];

function TodoStore(Dispatcher, TodoService, UndoDispatcher){
    
    var items = [];
    
    var changeEventEmitter = new EventEmitter();
    
    function emitChange(){
        changeEventEmitter.emit('change');
    }
    
    function update(data){
        items = data;
        emitChange();
    }
    
    // load todos
    TodoService.getTodos().then(update);
    
    // register event handlers with Dispatcher
    Dispatcher.on(actions.ADD, function(newTodo){
        TodoService.add(newTodo).then(update);
    });

    Dispatcher.on(actions.REMOVE, function(item){
        TodoService.remove(item).then(update);
    });

    Dispatcher.on(actions.CLEAR, function(){
        TodoService.clearCompleted().then(update);
    });

    Dispatcher.on(actions.TOGGLE, function(item){
        TodoService.update(item).then(update);
    });
    
    
    // register undo handlers
    UndoDispatcher.on(actions.ADD, function(item){
        TodoService.remove(item).then(update);
    });

    UndoDispatcher.on(actions.REMOVE, function(item){
        TodoService.add(item).then(update);
    });

    UndoDispatcher.on(actions.CLEAR, function(completedItems){
        completedItems.forEach(function(item){
            TodoService.add(item).then(update);
        });
    });

    UndoDispatcher.on(actions.TOGGLE, function(item){
        item.completed = !item.completed;
        TodoService.update(item).then(update);
    });    

    
    // return read-only interface
    return {
        getItems: function(){
            return items;
        },
        
        getActive: function(){
            return items.filter(function(item){
                return item.completed === false;
            });
        },
        
        getCompleted: function(){
            return items.filter(function(item){
                return item.completed;
            });
        },
        
        getTotalCount: function(){
            return items.length;
        },
        
        getActiveCount: function(){
            return items.reduce(function(count, todo){
                return todo.completed ? count : count+=1;
            }, 0);
        },
        
        getCompletedCount: function(){
            return items.reduce(function(count, todo){
                return todo.completed ? count+=1 : count;
            }, 0);
        },
        
        onChange: function(listener){
            changeEventEmitter.on('change', listener);
        }
        
    };


}


},{"../actions":4,"events":23}],19:[function(require,module,exports){
'use strict';

var module = angular.module('esi.stores', []);

module.factory("TodoStore", require("./TodoStore"));



},{"./TodoStore":18}],20:[function(require,module,exports){
'use strict';
var uuid = require('node-uuid');
require('./app');
require('../bower_components/angular-mocks/angular-mocks.js');


var module = angular.module('templateApp', ['app', 'ngMockE2E']);



//simulate a network delay
//wrapping the original $httpBackend ($delegate), with our own function, which sets a
//timeout before calling the actual callback with the response data.
// thanks to the author of this blogpost http://endlessindirection.wordpress.com/2013/05/18/angularjs-delay-response-from-httpbackend/

//module.config(function($provide) {
//    $provide.decorator('$httpBackend', function($delegate) {
//        var proxy = function(method, url, data, callback, headers) {
//            var interceptor = function() {
//                var _this = this,
//                    _arguments = arguments;
//                setTimeout(function() {
//                    callback.apply(_this, _arguments);
//                }, 1000);
//            };
//            return $delegate.call(this, method, url, data, interceptor, headers);
//        };
//        for(var key in $delegate) {
//            proxy[key] = $delegate[key];
//        }
//        return proxy;
//    });
//});

module.run(['$httpBackend', function($httpBackend) {

    // let templates pass through
    $httpBackend.whenGET(/\/templates\/.*/).passThrough();
    $httpBackend.whenGET(/.html/).passThrough();    
    
    
    var todos = [            
        {
            id: uuid.v1(),
            name: "todo1",
            completed: false
        },
        {
            id: uuid.v1(),
            name: "todo2",
            completed: false
        },
        {
            id: uuid.v1(),
            name: "todo3",
            completed: true
        }
    ];    
   
    $httpBackend.whenGET('/todos').respond(todos);
    
    // add new
    $httpBackend.whenPOST('/todos').respond(function(method, url, data) {
        var newItem = angular.fromJson(data);
        // check for duplicate
        var duplcates = todos.filter(function(item){
            return newItem.name === item.name;
        });

        if(!_.isEmpty(duplcates)){
            return [400, {errorCode: "DUPLICATE_ITEM", errorMessage: "Submitted item already exists"}];
        }
        
        todos.push(newItem);
        return [200, todos]; 
    });
    
    // update
    $httpBackend.whenPUT('/todos').respond(function(method, url, data) {
        var todo = angular.fromJson(data);
        for(var i in todos){
            if(todos[i].id === todo.id){
                todos[i] = todo;
                break;
            }
        }
        return [200, todos];
    });
    
    // delete completed
    $httpBackend.whenDELETE('/todos/completed').respond(function() {
        todos = todos.filter(function(todo){
            return !todo.completed;
        });
        return [200, todos];
    });   
    
    // delete item by id
    $httpBackend.whenDELETE(/\/todos\/.*/).respond(function(method, url) {
        var id = url.match(/\/todos\/(.*)/)[1];
        todos = todos.filter(function(item){
            return id !== item.id;
        });
        
        return [200, todos]; 
    });
    
}]);

},{"../bower_components/angular-mocks/angular-mocks.js":1,"./app":5,"node-uuid":25}],21:[function(require,module,exports){
/*!
 * EventEmitter2
 * https://github.com/hij1nx/EventEmitter2
 *
 * Copyright (c) 2013 hij1nx
 * Licensed under the MIT license.
 */
;!function(undefined) {

  var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };
  var defaultMaxListeners = 10;

  function init() {
    this._events = {};
    if (this._conf) {
      configure.call(this, this._conf);
    }
  }

  function configure(conf) {
    if (conf) {

      this._conf = conf;

      conf.delimiter && (this.delimiter = conf.delimiter);
      conf.maxListeners && (this._events.maxListeners = conf.maxListeners);
      conf.wildcard && (this.wildcard = conf.wildcard);
      conf.newListener && (this.newListener = conf.newListener);

      if (this.wildcard) {
        this.listenerTree = {};
      }
    }
  }

  function EventEmitter(conf) {
    this._events = {};
    this.newListener = false;
    configure.call(this, conf);
  }

  //
  // Attention, function return type now is array, always !
  // It has zero elements if no any matches found and one or more
  // elements (leafs) if there are matches
  //
  function searchListenerTree(handlers, type, tree, i) {
    if (!tree) {
      return [];
    }
    var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
        typeLength = type.length, currentType = type[i], nextType = type[i+1];
    if (i === typeLength && tree._listeners) {
      //
      // If at the end of the event(s) list and the tree has listeners
      // invoke those listeners.
      //
      if (typeof tree._listeners === 'function') {
        handlers && handlers.push(tree._listeners);
        return [tree];
      } else {
        for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
          handlers && handlers.push(tree._listeners[leaf]);
        }
        return [tree];
      }
    }

    if ((currentType === '*' || currentType === '**') || tree[currentType]) {
      //
      // If the event emitted is '*' at this part
      // or there is a concrete match at this patch
      //
      if (currentType === '*') {
        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
          }
        }
        return listeners;
      } else if(currentType === '**') {
        endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
        if(endReached && tree._listeners) {
          // The next element has a _listeners, add it to the handlers.
          listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
        }

        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            if(branch === '*' || branch === '**') {
              if(tree[branch]._listeners && !endReached) {
                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
              }
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            } else if(branch === nextType) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
            } else {
              // No match on this one, shift into the tree but not in the type array.
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            }
          }
        }
        return listeners;
      }

      listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
    }

    xTree = tree['*'];
    if (xTree) {
      //
      // If the listener tree will allow any match for this part,
      // then recursively explore all branches of the tree
      //
      searchListenerTree(handlers, type, xTree, i+1);
    }

    xxTree = tree['**'];
    if(xxTree) {
      if(i < typeLength) {
        if(xxTree._listeners) {
          // If we have a listener on a '**', it will catch all, so add its handler.
          searchListenerTree(handlers, type, xxTree, typeLength);
        }

        // Build arrays of matching next branches and others.
        for(branch in xxTree) {
          if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
            if(branch === nextType) {
              // We know the next element will match, so jump twice.
              searchListenerTree(handlers, type, xxTree[branch], i+2);
            } else if(branch === currentType) {
              // Current node matches, move into the tree.
              searchListenerTree(handlers, type, xxTree[branch], i+1);
            } else {
              isolatedBranch = {};
              isolatedBranch[branch] = xxTree[branch];
              searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
            }
          }
        }
      } else if(xxTree._listeners) {
        // We have reached the end and still on a '**'
        searchListenerTree(handlers, type, xxTree, typeLength);
      } else if(xxTree['*'] && xxTree['*']._listeners) {
        searchListenerTree(handlers, type, xxTree['*'], typeLength);
      }
    }

    return listeners;
  }

  function growListenerTree(type, listener) {

    type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

    //
    // Looks for two consecutive '**', if so, don't add the event at all.
    //
    for(var i = 0, len = type.length; i+1 < len; i++) {
      if(type[i] === '**' && type[i+1] === '**') {
        return;
      }
    }

    var tree = this.listenerTree;
    var name = type.shift();

    while (name) {

      if (!tree[name]) {
        tree[name] = {};
      }

      tree = tree[name];

      if (type.length === 0) {

        if (!tree._listeners) {
          tree._listeners = listener;
        }
        else if(typeof tree._listeners === 'function') {
          tree._listeners = [tree._listeners, listener];
        }
        else if (isArray(tree._listeners)) {

          tree._listeners.push(listener);

          if (!tree._listeners.warned) {

            var m = defaultMaxListeners;

            if (typeof this._events.maxListeners !== 'undefined') {
              m = this._events.maxListeners;
            }

            if (m > 0 && tree._listeners.length > m) {

              tree._listeners.warned = true;
              console.error('(node) warning: possible EventEmitter memory ' +
                            'leak detected. %d listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit.',
                            tree._listeners.length);
              console.trace();
            }
          }
        }
        return true;
      }
      name = type.shift();
    }
    return true;
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.

  EventEmitter.prototype.delimiter = '.';

  EventEmitter.prototype.setMaxListeners = function(n) {
    this._events || init.call(this);
    this._events.maxListeners = n;
    if (!this._conf) this._conf = {};
    this._conf.maxListeners = n;
  };

  EventEmitter.prototype.event = '';

  EventEmitter.prototype.once = function(event, fn) {
    this.many(event, 1, fn);
    return this;
  };

  EventEmitter.prototype.many = function(event, ttl, fn) {
    var self = this;

    if (typeof fn !== 'function') {
      throw new Error('many only accepts instances of Function');
    }

    function listener() {
      if (--ttl === 0) {
        self.off(event, listener);
      }
      fn.apply(this, arguments);
    }

    listener._origin = fn;

    this.on(event, listener);

    return self;
  };

  EventEmitter.prototype.emit = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this.newListener) {
      if (!this._events.newListener) { return false; }
    }

    // Loop through the *_all* functions and invoke them.
    if (this._all) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
      for (i = 0, l = this._all.length; i < l; i++) {
        this.event = type;
        this._all[i].apply(this, args);
      }
    }

    // If there is no 'error' event listener then throw.
    if (type === 'error') {

      if (!this._all &&
        !this._events.error &&
        !(this.wildcard && this.listenerTree.error)) {

        if (arguments[1] instanceof Error) {
          throw arguments[1]; // Unhandled 'error' event
        } else {
          throw new Error("Uncaught, unspecified 'error' event.");
        }
        return false;
      }
    }

    var handler;

    if(this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    }
    else {
      handler = this._events[type];
    }

    if (typeof handler === 'function') {
      this.event = type;
      if (arguments.length === 1) {
        handler.call(this);
      }
      else if (arguments.length > 1)
        switch (arguments.length) {
          case 2:
            handler.call(this, arguments[1]);
            break;
          case 3:
            handler.call(this, arguments[1], arguments[2]);
            break;
          // slower
          default:
            var l = arguments.length;
            var args = new Array(l - 1);
            for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
            handler.apply(this, args);
        }
      return true;
    }
    else if (handler) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

      var listeners = handler.slice();
      for (var i = 0, l = listeners.length; i < l; i++) {
        this.event = type;
        listeners[i].apply(this, args);
      }
      return (listeners.length > 0) || !!this._all;
    }
    else {
      return !!this._all;
    }

  };

  EventEmitter.prototype.on = function(type, listener) {

    if (typeof type === 'function') {
      this.onAny(type);
      return this;
    }

    if (typeof listener !== 'function') {
      throw new Error('on only accepts instances of Function');
    }
    this._events || init.call(this);

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    this.emit('newListener', type, listener);

    if(this.wildcard) {
      growListenerTree.call(this, type, listener);
      return this;
    }

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    }
    else if(typeof this._events[type] === 'function') {
      // Adding the second element, need to change to array.
      this._events[type] = [this._events[type], listener];
    }
    else if (isArray(this._events[type])) {
      // If we've already got an array, just append.
      this._events[type].push(listener);

      // Check for listener leak
      if (!this._events[type].warned) {

        var m = defaultMaxListeners;

        if (typeof this._events.maxListeners !== 'undefined') {
          m = this._events.maxListeners;
        }

        if (m > 0 && this._events[type].length > m) {

          this._events[type].warned = true;
          console.error('(node) warning: possible EventEmitter memory ' +
                        'leak detected. %d listeners added. ' +
                        'Use emitter.setMaxListeners() to increase limit.',
                        this._events[type].length);
          console.trace();
        }
      }
    }
    return this;
  };

  EventEmitter.prototype.onAny = function(fn) {

    if (typeof fn !== 'function') {
      throw new Error('onAny only accepts instances of Function');
    }

    if(!this._all) {
      this._all = [];
    }

    // Add the function to the event listener collection.
    this._all.push(fn);
    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  EventEmitter.prototype.off = function(type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('removeListener only takes instances of Function');
    }

    var handlers,leafs=[];

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
    }
    else {
      // does not use listeners(), so no side effect of creating _events[type]
      if (!this._events[type]) return this;
      handlers = this._events[type];
      leafs.push({_listeners:handlers});
    }

    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
      var leaf = leafs[iLeaf];
      handlers = leaf._listeners;
      if (isArray(handlers)) {

        var position = -1;

        for (var i = 0, length = handlers.length; i < length; i++) {
          if (handlers[i] === listener ||
            (handlers[i].listener && handlers[i].listener === listener) ||
            (handlers[i]._origin && handlers[i]._origin === listener)) {
            position = i;
            break;
          }
        }

        if (position < 0) {
          continue;
        }

        if(this.wildcard) {
          leaf._listeners.splice(position, 1);
        }
        else {
          this._events[type].splice(position, 1);
        }

        if (handlers.length === 0) {
          if(this.wildcard) {
            delete leaf._listeners;
          }
          else {
            delete this._events[type];
          }
        }
        return this;
      }
      else if (handlers === listener ||
        (handlers.listener && handlers.listener === listener) ||
        (handlers._origin && handlers._origin === listener)) {
        if(this.wildcard) {
          delete leaf._listeners;
        }
        else {
          delete this._events[type];
        }
      }
    }

    return this;
  };

  EventEmitter.prototype.offAny = function(fn) {
    var i = 0, l = 0, fns;
    if (fn && this._all && this._all.length > 0) {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++) {
        if(fn === fns[i]) {
          fns.splice(i, 1);
          return this;
        }
      }
    } else {
      this._all = [];
    }
    return this;
  };

  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

  EventEmitter.prototype.removeAllListeners = function(type) {
    if (arguments.length === 0) {
      !this._events || init.call(this);
      return this;
    }

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

      for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
        var leaf = leafs[iLeaf];
        leaf._listeners = null;
      }
    }
    else {
      if (!this._events[type]) return this;
      this._events[type] = null;
    }
    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    if(this.wildcard) {
      var handlers = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
      return handlers;
    }

    this._events || init.call(this);

    if (!this._events[type]) this._events[type] = [];
    if (!isArray(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  };

  EventEmitter.prototype.listenersAny = function() {

    if(this._all) {
      return this._all;
    }
    else {
      return [];
    }

  };

  if (typeof define === 'function' && define.amd) {
     // AMD. Register as an anonymous module.
    define(function() {
      return EventEmitter;
    });
  } else if (typeof exports === 'object') {
    // CommonJS
    exports.EventEmitter2 = EventEmitter;
  }
  else {
    // Browser global.
    window.EventEmitter2 = EventEmitter;
  }
}();

},{}],22:[function(require,module,exports){


//
// The shims in this file are not fully implemented shims for the ES5
// features, but do work for the particular usecases there is in
// the other modules.
//

var toString = Object.prototype.toString;
var hasOwnProperty = Object.prototype.hasOwnProperty;

// Array.isArray is supported in IE9
function isArray(xs) {
  return toString.call(xs) === '[object Array]';
}
exports.isArray = typeof Array.isArray === 'function' ? Array.isArray : isArray;

// Array.prototype.indexOf is supported in IE9
exports.indexOf = function indexOf(xs, x) {
  if (xs.indexOf) return xs.indexOf(x);
  for (var i = 0; i < xs.length; i++) {
    if (x === xs[i]) return i;
  }
  return -1;
};

// Array.prototype.filter is supported in IE9
exports.filter = function filter(xs, fn) {
  if (xs.filter) return xs.filter(fn);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    if (fn(xs[i], i, xs)) res.push(xs[i]);
  }
  return res;
};

// Array.prototype.forEach is supported in IE9
exports.forEach = function forEach(xs, fn, self) {
  if (xs.forEach) return xs.forEach(fn, self);
  for (var i = 0; i < xs.length; i++) {
    fn.call(self, xs[i], i, xs);
  }
};

// Array.prototype.map is supported in IE9
exports.map = function map(xs, fn) {
  if (xs.map) return xs.map(fn);
  var out = new Array(xs.length);
  for (var i = 0; i < xs.length; i++) {
    out[i] = fn(xs[i], i, xs);
  }
  return out;
};

// Array.prototype.reduce is supported in IE9
exports.reduce = function reduce(array, callback, opt_initialValue) {
  if (array.reduce) return array.reduce(callback, opt_initialValue);
  var value, isValueSet = false;

  if (2 < arguments.length) {
    value = opt_initialValue;
    isValueSet = true;
  }
  for (var i = 0, l = array.length; l > i; ++i) {
    if (array.hasOwnProperty(i)) {
      if (isValueSet) {
        value = callback(value, array[i], i, array);
      }
      else {
        value = array[i];
        isValueSet = true;
      }
    }
  }

  return value;
};

// String.prototype.substr - negative index don't work in IE8
if ('ab'.substr(-1) !== 'b') {
  exports.substr = function (str, start, length) {
    // did we get a negative start, calculate how much it is from the beginning of the string
    if (start < 0) start = str.length + start;

    // call the original function
    return str.substr(start, length);
  };
} else {
  exports.substr = function (str, start, length) {
    return str.substr(start, length);
  };
}

// String.prototype.trim is supported in IE9
exports.trim = function (str) {
  if (str.trim) return str.trim();
  return str.replace(/^\s+|\s+$/g, '');
};

// Function.prototype.bind is supported in IE9
exports.bind = function () {
  var args = Array.prototype.slice.call(arguments);
  var fn = args.shift();
  if (fn.bind) return fn.bind.apply(fn, args);
  var self = args.shift();
  return function () {
    fn.apply(self, args.concat([Array.prototype.slice.call(arguments)]));
  };
};

// Object.create is supported in IE9
function create(prototype, properties) {
  var object;
  if (prototype === null) {
    object = { '__proto__' : null };
  }
  else {
    if (typeof prototype !== 'object') {
      throw new TypeError(
        'typeof prototype[' + (typeof prototype) + '] != \'object\''
      );
    }
    var Type = function () {};
    Type.prototype = prototype;
    object = new Type();
    object.__proto__ = prototype;
  }
  if (typeof properties !== 'undefined' && Object.defineProperties) {
    Object.defineProperties(object, properties);
  }
  return object;
}
exports.create = typeof Object.create === 'function' ? Object.create : create;

// Object.keys and Object.getOwnPropertyNames is supported in IE9 however
// they do show a description and number property on Error objects
function notObject(object) {
  return ((typeof object != "object" && typeof object != "function") || object === null);
}

function keysShim(object) {
  if (notObject(object)) {
    throw new TypeError("Object.keys called on a non-object");
  }

  var result = [];
  for (var name in object) {
    if (hasOwnProperty.call(object, name)) {
      result.push(name);
    }
  }
  return result;
}

// getOwnPropertyNames is almost the same as Object.keys one key feature
//  is that it returns hidden properties, since that can't be implemented,
//  this feature gets reduced so it just shows the length property on arrays
function propertyShim(object) {
  if (notObject(object)) {
    throw new TypeError("Object.getOwnPropertyNames called on a non-object");
  }

  var result = keysShim(object);
  if (exports.isArray(object) && exports.indexOf(object, 'length') === -1) {
    result.push('length');
  }
  return result;
}

var keys = typeof Object.keys === 'function' ? Object.keys : keysShim;
var getOwnPropertyNames = typeof Object.getOwnPropertyNames === 'function' ?
  Object.getOwnPropertyNames : propertyShim;

if (new Error().hasOwnProperty('description')) {
  var ERROR_PROPERTY_FILTER = function (obj, array) {
    if (toString.call(obj) === '[object Error]') {
      array = exports.filter(array, function (name) {
        return name !== 'description' && name !== 'number' && name !== 'message';
      });
    }
    return array;
  };

  exports.keys = function (object) {
    return ERROR_PROPERTY_FILTER(object, keys(object));
  };
  exports.getOwnPropertyNames = function (object) {
    return ERROR_PROPERTY_FILTER(object, getOwnPropertyNames(object));
  };
} else {
  exports.keys = keys;
  exports.getOwnPropertyNames = getOwnPropertyNames;
}

// Object.getOwnPropertyDescriptor - supported in IE8 but only on dom elements
function valueObject(value, key) {
  return { value: value[key] };
}

if (typeof Object.getOwnPropertyDescriptor === 'function') {
  try {
    Object.getOwnPropertyDescriptor({'a': 1}, 'a');
    exports.getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  } catch (e) {
    // IE8 dom element issue - use a try catch and default to valueObject
    exports.getOwnPropertyDescriptor = function (value, key) {
      try {
        return Object.getOwnPropertyDescriptor(value, key);
      } catch (e) {
        return valueObject(value, key);
      }
    };
  }
} else {
  exports.getOwnPropertyDescriptor = valueObject;
}

},{}],23:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util');

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!util.isNumber(n) || n < 0)
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (util.isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (util.isUndefined(handler))
    return false;

  if (util.isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (util.isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!util.isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              util.isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (util.isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (util.isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!util.isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      console.trace();
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!util.isFunction(listener))
    throw TypeError('listener must be a function');

  function g() {
    this.removeListener(type, g);
    listener.apply(this, arguments);
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!util.isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (util.isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (util.isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (util.isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (util.isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (util.isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};
},{"util":24}],24:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var shims = require('_shims');

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  shims.forEach(array, function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = shims.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = shims.getOwnPropertyNames(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }

  shims.forEach(keys, function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = shims.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }

  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (shims.indexOf(ctx.seen, desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = shims.reduce(output, function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return shims.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) && objectToString(e) === '[object Error]';
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.binarySlice === 'function'
  ;
}
exports.isBuffer = isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = shims.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = shims.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

},{"_shims":22}],25:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

(function() {
  var _global = this;

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng;

  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
  //
  // Moderately fast, high quality
  if (typeof(_global.require) == 'function') {
    try {
      var _rb = _global.require('crypto').randomBytes;
      _rng = _rb && function() {return _rb(16);};
    } catch(e) {}
  }

  if (!_rng && _global.crypto && crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    var _rnds8 = new Uint8Array(16);
    _rng = function whatwgRNG() {
      crypto.getRandomValues(_rnds8);
      return _rnds8;
    };
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
  }

  // Buffer class to use
  var BufferClass = typeof(_global.Buffer) == 'function' ? _global.Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = options.msecs != null ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) == 'string') {
      buf = options == 'binary' ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;

  if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = uuid;
  } else  if (typeof define === 'function' && define.amd) {
    // Publish as AMD module
    define(function() {return uuid;});
 

  } else {
    // Publish as global (in browsers)
    var _previousRoot = _global.uuid;

    // **`noConflict()` - (browser only) to reset global 'uuid' var**
    uuid.noConflict = function() {
      _global.uuid = _previousRoot;
      return uuid;
    };

    _global.uuid = uuid;
  }
}).call(this);

},{}]},{},[20])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXkvZGV2L3dvcmsvZ2l0aHViL3RvZG8tZmx1eC1hbmd1bGFyL2FwcC9ib3dlcl9jb21wb25lbnRzL2FuZ3VsYXItbW9ja3MvYW5ndWxhci1tb2Nrcy5qcyIsIi9Vc2Vycy9hbmRyZXkvZGV2L3dvcmsvZ2l0aHViL3RvZG8tZmx1eC1hbmd1bGFyL2FwcC9ib3dlcl9jb21wb25lbnRzL2FuZ3VsYXItc3Bpbm5lci9hbmd1bGFyLXNwaW5uZXIuanMiLCIvVXNlcnMvYW5kcmV5L2Rldi93b3JrL2dpdGh1Yi90b2RvLWZsdXgtYW5ndWxhci9hcHAvYm93ZXJfY29tcG9uZW50cy9zcGluLmpzL3NwaW4uanMiLCIvVXNlcnMvYW5kcmV5L2Rldi93b3JrL2dpdGh1Yi90b2RvLWZsdXgtYW5ndWxhci9hcHAvanMvYWN0aW9ucy5qcyIsIi9Vc2Vycy9hbmRyZXkvZGV2L3dvcmsvZ2l0aHViL3RvZG8tZmx1eC1hbmd1bGFyL2FwcC9qcy9hcHAuanMiLCIvVXNlcnMvYW5kcmV5L2Rldi93b3JrL2dpdGh1Yi90b2RvLWZsdXgtYW5ndWxhci9hcHAvanMvY29uZmlnL0VzaUh0dHBJbnRlcmNlcHRvci5qcyIsIi9Vc2Vycy9hbmRyZXkvZGV2L3dvcmsvZ2l0aHViL3RvZG8tZmx1eC1hbmd1bGFyL2FwcC9qcy9jb250cm9sbGVycy9Ub2RvQ3RybC5qcyIsIi9Vc2Vycy9hbmRyZXkvZGV2L3dvcmsvZ2l0aHViL3RvZG8tZmx1eC1hbmd1bGFyL2FwcC9qcy9jb250cm9sbGVycy9pbmRleC5qcyIsIi9Vc2Vycy9hbmRyZXkvZGV2L3dvcmsvZ2l0aHViL3RvZG8tZmx1eC1hbmd1bGFyL2FwcC9qcy9kaXJlY3RpdmVzL2VzaUFjdGl2ZS5qcyIsIi9Vc2Vycy9hbmRyZXkvZGV2L3dvcmsvZ2l0aHViL3RvZG8tZmx1eC1hbmd1bGFyL2FwcC9qcy9kaXJlY3RpdmVzL2luZGV4LmpzIiwiL1VzZXJzL2FuZHJleS9kZXYvd29yay9naXRodWIvdG9kby1mbHV4LWFuZ3VsYXIvYXBwL2pzL2Rpc3BhdGNoZXJzL1VuZG9EaXNwYXRjaGVyLmpzIiwiL1VzZXJzL2FuZHJleS9kZXYvd29yay9naXRodWIvdG9kby1mbHV4LWFuZ3VsYXIvYXBwL2pzL2Rpc3BhdGNoZXJzL2luZGV4LmpzIiwiL1VzZXJzL2FuZHJleS9kZXYvd29yay9naXRodWIvdG9kby1mbHV4LWFuZ3VsYXIvYXBwL2pzL2ZpbHRlcnMvaW5kZXguanMiLCIvVXNlcnMvYW5kcmV5L2Rldi93b3JrL2dpdGh1Yi90b2RvLWZsdXgtYW5ndWxhci9hcHAvanMvZmlsdGVycy90cmFuc2xhdGVFcnJvckNvZGUuanMiLCIvVXNlcnMvYW5kcmV5L2Rldi93b3JrL2dpdGh1Yi90b2RvLWZsdXgtYW5ndWxhci9hcHAvanMvc2VydmljZXMvRXJyb3JEaXNwbGF5U2VydmljZS5qcyIsIi9Vc2Vycy9hbmRyZXkvZGV2L3dvcmsvZ2l0aHViL3RvZG8tZmx1eC1hbmd1bGFyL2FwcC9qcy9zZXJ2aWNlcy9Ub2RvU2VydmljZS5qcyIsIi9Vc2Vycy9hbmRyZXkvZGV2L3dvcmsvZ2l0aHViL3RvZG8tZmx1eC1hbmd1bGFyL2FwcC9qcy9zZXJ2aWNlcy9pbmRleC5qcyIsIi9Vc2Vycy9hbmRyZXkvZGV2L3dvcmsvZ2l0aHViL3RvZG8tZmx1eC1hbmd1bGFyL2FwcC9qcy9zdG9yZXMvVG9kb1N0b3JlLmpzIiwiL1VzZXJzL2FuZHJleS9kZXYvd29yay9naXRodWIvdG9kby1mbHV4LWFuZ3VsYXIvYXBwL2pzL3N0b3Jlcy9pbmRleC5qcyIsIi9Vc2Vycy9hbmRyZXkvZGV2L3dvcmsvZ2l0aHViL3RvZG8tZmx1eC1hbmd1bGFyL2FwcC9qcy90b2RvQXBwRGV2LmpzIiwiL1VzZXJzL2FuZHJleS9kZXYvd29yay9naXRodWIvdG9kby1mbHV4LWFuZ3VsYXIvbm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjIvbGliL2V2ZW50ZW1pdHRlcjIuanMiLCIvVXNlcnMvYW5kcmV5L2Rldi93b3JrL2dpdGh1Yi90b2RvLWZsdXgtYW5ndWxhci9ub2RlX21vZHVsZXMvZ3J1bnQtd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi9fc2hpbXMuanMiLCIvVXNlcnMvYW5kcmV5L2Rldi93b3JrL2dpdGh1Yi90b2RvLWZsdXgtYW5ndWxhci9ub2RlX21vZHVsZXMvZ3J1bnQtd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi9ldmVudHMuanMiLCIvVXNlcnMvYW5kcmV5L2Rldi93b3JrL2dpdGh1Yi90b2RvLWZsdXgtYW5ndWxhci9ub2RlX21vZHVsZXMvZ3J1bnQtd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi91dGlsLmpzIiwiL1VzZXJzL2FuZHJleS9kZXYvd29yay9naXRodWIvdG9kby1mbHV4LWFuZ3VsYXIvbm9kZV9tb2R1bGVzL25vZGUtdXVpZC91dWlkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcDZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2UgQW5ndWxhckpTIHYxLjMuMTVcbiAqIChjKSAyMDEwLTIwMTQgR29vZ2xlLCBJbmMuIGh0dHA6Ly9hbmd1bGFyanMub3JnXG4gKiBMaWNlbnNlOiBNSVRcbiAqL1xuKGZ1bmN0aW9uKHdpbmRvdywgYW5ndWxhciwgdW5kZWZpbmVkKSB7XG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmdkb2Mgb2JqZWN0XG4gKiBAbmFtZSBhbmd1bGFyLm1vY2tcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIE5hbWVzcGFjZSBmcm9tICdhbmd1bGFyLW1vY2tzLmpzJyB3aGljaCBjb250YWlucyB0ZXN0aW5nIHJlbGF0ZWQgY29kZS5cbiAqL1xuYW5ndWxhci5tb2NrID0ge307XG5cbi8qKlxuICogISBUaGlzIGlzIGEgcHJpdmF0ZSB1bmRvY3VtZW50ZWQgc2VydmljZSAhXG4gKlxuICogQG5hbWUgJGJyb3dzZXJcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqIFRoaXMgc2VydmljZSBpcyBhIG1vY2sgaW1wbGVtZW50YXRpb24gb2Yge0BsaW5rIG5nLiRicm93c2VyfS4gSXQgcHJvdmlkZXMgZmFrZVxuICogaW1wbGVtZW50YXRpb24gZm9yIGNvbW1vbmx5IHVzZWQgYnJvd3NlciBhcGlzIHRoYXQgYXJlIGhhcmQgdG8gdGVzdCwgZS5nLiBzZXRUaW1lb3V0LCB4aHIsXG4gKiBjb29raWVzLCBldGMuLi5cbiAqXG4gKiBUaGUgYXBpIG9mIHRoaXMgc2VydmljZSBpcyB0aGUgc2FtZSBhcyB0aGF0IG9mIHRoZSByZWFsIHtAbGluayBuZy4kYnJvd3NlciAkYnJvd3Nlcn0sIGV4Y2VwdFxuICogdGhhdCB0aGVyZSBhcmUgc2V2ZXJhbCBoZWxwZXIgbWV0aG9kcyBhdmFpbGFibGUgd2hpY2ggY2FuIGJlIHVzZWQgaW4gdGVzdHMuXG4gKi9cbmFuZ3VsYXIubW9jay4kQnJvd3NlclByb3ZpZGVyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuJGdldCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgYW5ndWxhci5tb2NrLiRCcm93c2VyKCk7XG4gIH07XG59O1xuXG5hbmd1bGFyLm1vY2suJEJyb3dzZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHRoaXMuaXNNb2NrID0gdHJ1ZTtcbiAgc2VsZi4kJHVybCA9IFwiaHR0cDovL3NlcnZlci9cIjtcbiAgc2VsZi4kJGxhc3RVcmwgPSBzZWxmLiQkdXJsOyAvLyB1c2VkIGJ5IHVybCBwb2xsaW5nIGZuXG4gIHNlbGYucG9sbEZucyA9IFtdO1xuXG4gIC8vIFRPRE8odm9qdGEpOiByZW1vdmUgdGhpcyB0ZW1wb3JhcnkgYXBpXG4gIHNlbGYuJCRjb21wbGV0ZU91dHN0YW5kaW5nUmVxdWVzdCA9IGFuZ3VsYXIubm9vcDtcbiAgc2VsZi4kJGluY091dHN0YW5kaW5nUmVxdWVzdENvdW50ID0gYW5ndWxhci5ub29wO1xuXG5cbiAgLy8gcmVnaXN0ZXIgdXJsIHBvbGxpbmcgZm5cblxuICBzZWxmLm9uVXJsQ2hhbmdlID0gZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICBzZWxmLnBvbGxGbnMucHVzaChcbiAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoc2VsZi4kJGxhc3RVcmwgIT09IHNlbGYuJCR1cmwgfHwgc2VsZi4kJHN0YXRlICE9PSBzZWxmLiQkbGFzdFN0YXRlKSB7XG4gICAgICAgICAgc2VsZi4kJGxhc3RVcmwgPSBzZWxmLiQkdXJsO1xuICAgICAgICAgIHNlbGYuJCRsYXN0U3RhdGUgPSBzZWxmLiQkc3RhdGU7XG4gICAgICAgICAgbGlzdGVuZXIoc2VsZi4kJHVybCwgc2VsZi4kJHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG5cbiAgICByZXR1cm4gbGlzdGVuZXI7XG4gIH07XG5cbiAgc2VsZi4kJGNoZWNrVXJsQ2hhbmdlID0gYW5ndWxhci5ub29wO1xuXG4gIHNlbGYuY29va2llSGFzaCA9IHt9O1xuICBzZWxmLmxhc3RDb29raWVIYXNoID0ge307XG4gIHNlbGYuZGVmZXJyZWRGbnMgPSBbXTtcbiAgc2VsZi5kZWZlcnJlZE5leHRJZCA9IDA7XG5cbiAgc2VsZi5kZWZlciA9IGZ1bmN0aW9uKGZuLCBkZWxheSkge1xuICAgIGRlbGF5ID0gZGVsYXkgfHwgMDtcbiAgICBzZWxmLmRlZmVycmVkRm5zLnB1c2goe3RpbWU6KHNlbGYuZGVmZXIubm93ICsgZGVsYXkpLCBmbjpmbiwgaWQ6IHNlbGYuZGVmZXJyZWROZXh0SWR9KTtcbiAgICBzZWxmLmRlZmVycmVkRm5zLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYS50aW1lIC0gYi50aW1lO30pO1xuICAgIHJldHVybiBzZWxmLmRlZmVycmVkTmV4dElkKys7XG4gIH07XG5cblxuICAvKipcbiAgICogQG5hbWUgJGJyb3dzZXIjZGVmZXIubm93XG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBDdXJyZW50IG1pbGxpc2Vjb25kcyBtb2NrIHRpbWUuXG4gICAqL1xuICBzZWxmLmRlZmVyLm5vdyA9IDA7XG5cblxuICBzZWxmLmRlZmVyLmNhbmNlbCA9IGZ1bmN0aW9uKGRlZmVySWQpIHtcbiAgICB2YXIgZm5JbmRleDtcblxuICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxmLmRlZmVycmVkRm5zLCBmdW5jdGlvbihmbiwgaW5kZXgpIHtcbiAgICAgIGlmIChmbi5pZCA9PT0gZGVmZXJJZCkgZm5JbmRleCA9IGluZGV4O1xuICAgIH0pO1xuXG4gICAgaWYgKGZuSW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgc2VsZi5kZWZlcnJlZEZucy5zcGxpY2UoZm5JbmRleCwgMSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cblxuICAvKipcbiAgICogQG5hbWUgJGJyb3dzZXIjZGVmZXIuZmx1c2hcbiAgICpcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIEZsdXNoZXMgYWxsIHBlbmRpbmcgcmVxdWVzdHMgYW5kIGV4ZWN1dGVzIHRoZSBkZWZlciBjYWxsYmFja3MuXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBmbHVzaC4gU2VlIHtAbGluayAjZGVmZXIubm93fVxuICAgKi9cbiAgc2VsZi5kZWZlci5mbHVzaCA9IGZ1bmN0aW9uKGRlbGF5KSB7XG4gICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKGRlbGF5KSkge1xuICAgICAgc2VsZi5kZWZlci5ub3cgKz0gZGVsYXk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzZWxmLmRlZmVycmVkRm5zLmxlbmd0aCkge1xuICAgICAgICBzZWxmLmRlZmVyLm5vdyA9IHNlbGYuZGVmZXJyZWRGbnNbc2VsZi5kZWZlcnJlZEZucy5sZW5ndGggLSAxXS50aW1lO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBkZWZlcnJlZCB0YXNrcyB0byBiZSBmbHVzaGVkJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgd2hpbGUgKHNlbGYuZGVmZXJyZWRGbnMubGVuZ3RoICYmIHNlbGYuZGVmZXJyZWRGbnNbMF0udGltZSA8PSBzZWxmLmRlZmVyLm5vdykge1xuICAgICAgc2VsZi5kZWZlcnJlZEZucy5zaGlmdCgpLmZuKCk7XG4gICAgfVxuICB9O1xuXG4gIHNlbGYuJCRiYXNlSHJlZiA9ICcvJztcbiAgc2VsZi5iYXNlSHJlZiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLiQkYmFzZUhyZWY7XG4gIH07XG59O1xuYW5ndWxhci5tb2NrLiRCcm93c2VyLnByb3RvdHlwZSA9IHtcblxuLyoqXG4gICogQG5hbWUgJGJyb3dzZXIjcG9sbFxuICAqXG4gICogQGRlc2NyaXB0aW9uXG4gICogcnVuIGFsbCBmbnMgaW4gcG9sbEZuc1xuICAqL1xuICBwb2xsOiBmdW5jdGlvbiBwb2xsKCkge1xuICAgIGFuZ3VsYXIuZm9yRWFjaCh0aGlzLnBvbGxGbnMsIGZ1bmN0aW9uKHBvbGxGbikge1xuICAgICAgcG9sbEZuKCk7XG4gICAgfSk7XG4gIH0sXG5cbiAgYWRkUG9sbEZuOiBmdW5jdGlvbihwb2xsRm4pIHtcbiAgICB0aGlzLnBvbGxGbnMucHVzaChwb2xsRm4pO1xuICAgIHJldHVybiBwb2xsRm47XG4gIH0sXG5cbiAgdXJsOiBmdW5jdGlvbih1cmwsIHJlcGxhY2UsIHN0YXRlKSB7XG4gICAgaWYgKGFuZ3VsYXIuaXNVbmRlZmluZWQoc3RhdGUpKSB7XG4gICAgICBzdGF0ZSA9IG51bGw7XG4gICAgfVxuICAgIGlmICh1cmwpIHtcbiAgICAgIHRoaXMuJCR1cmwgPSB1cmw7XG4gICAgICAvLyBOYXRpdmUgcHVzaFN0YXRlIHNlcmlhbGl6ZXMgJiBjb3BpZXMgdGhlIG9iamVjdDsgc2ltdWxhdGUgaXQuXG4gICAgICB0aGlzLiQkc3RhdGUgPSBhbmd1bGFyLmNvcHkoc3RhdGUpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuJCR1cmw7XG4gIH0sXG5cbiAgc3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLiQkc3RhdGU7XG4gIH0sXG5cbiAgY29va2llczogIGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgaWYgKG5hbWUpIHtcbiAgICAgIGlmIChhbmd1bGFyLmlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICBkZWxldGUgdGhpcy5jb29raWVIYXNoW25hbWVdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGFuZ3VsYXIuaXNTdHJpbmcodmFsdWUpICYmICAgICAgIC8vc3RyaW5ncyBvbmx5XG4gICAgICAgICAgICB2YWx1ZS5sZW5ndGggPD0gNDA5NikgeyAgICAgICAgICAvL3N0cmljdCBjb29raWUgc3RvcmFnZSBsaW1pdHNcbiAgICAgICAgICB0aGlzLmNvb2tpZUhhc2hbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWFuZ3VsYXIuZXF1YWxzKHRoaXMuY29va2llSGFzaCwgdGhpcy5sYXN0Q29va2llSGFzaCkpIHtcbiAgICAgICAgdGhpcy5sYXN0Q29va2llSGFzaCA9IGFuZ3VsYXIuY29weSh0aGlzLmNvb2tpZUhhc2gpO1xuICAgICAgICB0aGlzLmNvb2tpZUhhc2ggPSBhbmd1bGFyLmNvcHkodGhpcy5jb29raWVIYXNoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmNvb2tpZUhhc2g7XG4gICAgfVxuICB9LFxuXG4gIG5vdGlmeVdoZW5Ob091dHN0YW5kaW5nUmVxdWVzdHM6IGZ1bmN0aW9uKGZuKSB7XG4gICAgZm4oKTtcbiAgfVxufTtcblxuXG4vKipcbiAqIEBuZ2RvYyBwcm92aWRlclxuICogQG5hbWUgJGV4Y2VwdGlvbkhhbmRsZXJQcm92aWRlclxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogQ29uZmlndXJlcyB0aGUgbW9jayBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgbmcuJGV4Y2VwdGlvbkhhbmRsZXJ9IHRvIHJldGhyb3cgb3IgdG8gbG9nIGVycm9yc1xuICogcGFzc2VkIHRvIHRoZSBgJGV4Y2VwdGlvbkhhbmRsZXJgLlxuICovXG5cbi8qKlxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lICRleGNlcHRpb25IYW5kbGVyXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBNb2NrIGltcGxlbWVudGF0aW9uIG9mIHtAbGluayBuZy4kZXhjZXB0aW9uSGFuZGxlcn0gdGhhdCByZXRocm93cyBvciBsb2dzIGVycm9ycyBwYXNzZWRcbiAqIHRvIGl0LiBTZWUge0BsaW5rIG5nTW9jay4kZXhjZXB0aW9uSGFuZGxlclByb3ZpZGVyICRleGNlcHRpb25IYW5kbGVyUHJvdmlkZXJ9IGZvciBjb25maWd1cmF0aW9uXG4gKiBpbmZvcm1hdGlvbi5cbiAqXG4gKlxuICogYGBganNcbiAqICAgZGVzY3JpYmUoJyRleGNlcHRpb25IYW5kbGVyUHJvdmlkZXInLCBmdW5jdGlvbigpIHtcbiAqXG4gKiAgICAgaXQoJ3Nob3VsZCBjYXB0dXJlIGxvZyBtZXNzYWdlcyBhbmQgZXhjZXB0aW9ucycsIGZ1bmN0aW9uKCkge1xuICpcbiAqICAgICAgIG1vZHVsZShmdW5jdGlvbigkZXhjZXB0aW9uSGFuZGxlclByb3ZpZGVyKSB7XG4gKiAgICAgICAgICRleGNlcHRpb25IYW5kbGVyUHJvdmlkZXIubW9kZSgnbG9nJyk7XG4gKiAgICAgICB9KTtcbiAqXG4gKiAgICAgICBpbmplY3QoZnVuY3Rpb24oJGxvZywgJGV4Y2VwdGlvbkhhbmRsZXIsICR0aW1lb3V0KSB7XG4gKiAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkgeyAkbG9nLmxvZygxKTsgfSk7XG4gKiAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkgeyAkbG9nLmxvZygyKTsgdGhyb3cgJ2JhbmFuYSBwZWVsJzsgfSk7XG4gKiAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkgeyAkbG9nLmxvZygzKTsgfSk7XG4gKiAgICAgICAgIGV4cGVjdCgkZXhjZXB0aW9uSGFuZGxlci5lcnJvcnMpLnRvRXF1YWwoW10pO1xuICogICAgICAgICBleHBlY3QoJGxvZy5hc3NlcnRFbXB0eSgpKTtcbiAqICAgICAgICAgJHRpbWVvdXQuZmx1c2goKTtcbiAqICAgICAgICAgZXhwZWN0KCRleGNlcHRpb25IYW5kbGVyLmVycm9ycykudG9FcXVhbChbJ2JhbmFuYSBwZWVsJ10pO1xuICogICAgICAgICBleHBlY3QoJGxvZy5sb2cubG9ncykudG9FcXVhbChbWzFdLCBbMl0sIFszXV0pO1xuICogICAgICAgfSk7XG4gKiAgICAgfSk7XG4gKiAgIH0pO1xuICogYGBgXG4gKi9cblxuYW5ndWxhci5tb2NrLiRFeGNlcHRpb25IYW5kbGVyUHJvdmlkZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGhhbmRsZXI7XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBtZXRob2RcbiAgICogQG5hbWUgJGV4Y2VwdGlvbkhhbmRsZXJQcm92aWRlciNtb2RlXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBTZXRzIHRoZSBsb2dnaW5nIG1vZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtb2RlIE1vZGUgb2Ygb3BlcmF0aW9uLCBkZWZhdWx0cyB0byBgcmV0aHJvd2AuXG4gICAqXG4gICAqICAgLSBgbG9nYDogU29tZXRpbWVzIGl0IGlzIGRlc2lyYWJsZSB0byB0ZXN0IHRoYXQgYW4gZXJyb3IgaXMgdGhyb3duLCBmb3IgdGhpcyBjYXNlIHRoZSBgbG9nYFxuICAgKiAgICAgICAgICAgIG1vZGUgc3RvcmVzIGFuIGFycmF5IG9mIGVycm9ycyBpbiBgJGV4Y2VwdGlvbkhhbmRsZXIuZXJyb3JzYCwgdG8gYWxsb3cgbGF0ZXJcbiAgICogICAgICAgICAgICBhc3NlcnRpb24gb2YgdGhlbS4gU2VlIHtAbGluayBuZ01vY2suJGxvZyNhc3NlcnRFbXB0eSBhc3NlcnRFbXB0eSgpfSBhbmRcbiAgICogICAgICAgICAgICB7QGxpbmsgbmdNb2NrLiRsb2cjcmVzZXQgcmVzZXQoKX1cbiAgICogICAtIGByZXRocm93YDogSWYgYW55IGVycm9ycyBhcmUgcGFzc2VkIHRvIHRoZSBoYW5kbGVyIGluIHRlc3RzLCBpdCB0eXBpY2FsbHkgbWVhbnMgdGhhdCB0aGVyZVxuICAgKiAgICAgICAgICAgICAgICBpcyBhIGJ1ZyBpbiB0aGUgYXBwbGljYXRpb24gb3IgdGVzdCwgc28gdGhpcyBtb2NrIHdpbGwgbWFrZSB0aGVzZSB0ZXN0cyBmYWlsLlxuICAgKiAgICAgICAgICAgICAgICBGb3IgYW55IGltcGxlbWVudGF0aW9ucyB0aGF0IGV4cGVjdCBleGNlcHRpb25zIHRvIGJlIHRocm93biwgdGhlIGByZXRocm93YCBtb2RlXG4gICAqICAgICAgICAgICAgICAgIHdpbGwgYWxzbyBtYWludGFpbiBhIGxvZyBvZiB0aHJvd24gZXJyb3JzLlxuICAgKi9cbiAgdGhpcy5tb2RlID0gZnVuY3Rpb24obW9kZSkge1xuXG4gICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICBjYXNlICdsb2cnOlxuICAgICAgY2FzZSAncmV0aHJvdyc6XG4gICAgICAgIHZhciBlcnJvcnMgPSBbXTtcbiAgICAgICAgaGFuZGxlciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1vZGUgPT09IFwicmV0aHJvd1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaGFuZGxlci5lcnJvcnMgPSBlcnJvcnM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBtb2RlICdcIiArIG1vZGUgKyBcIicsIG9ubHkgJ2xvZycvJ3JldGhyb3cnIG1vZGVzIGFyZSBhbGxvd2VkIVwiKTtcbiAgICB9XG4gIH07XG5cbiAgdGhpcy4kZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGhhbmRsZXI7XG4gIH07XG5cbiAgdGhpcy5tb2RlKCdyZXRocm93Jyk7XG59O1xuXG5cbi8qKlxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lICRsb2dcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqIE1vY2sgaW1wbGVtZW50YXRpb24gb2Yge0BsaW5rIG5nLiRsb2d9IHRoYXQgZ2F0aGVycyBhbGwgbG9nZ2VkIG1lc3NhZ2VzIGluIGFycmF5c1xuICogKG9uZSBhcnJheSBwZXIgbG9nZ2luZyBsZXZlbCkuIFRoZXNlIGFycmF5cyBhcmUgZXhwb3NlZCBhcyBgbG9nc2AgcHJvcGVydHkgb2YgZWFjaCBvZiB0aGVcbiAqIGxldmVsLXNwZWNpZmljIGxvZyBmdW5jdGlvbiwgZS5nLiBmb3IgbGV2ZWwgYGVycm9yYCB0aGUgYXJyYXkgaXMgZXhwb3NlZCBhcyBgJGxvZy5lcnJvci5sb2dzYC5cbiAqXG4gKi9cbmFuZ3VsYXIubW9jay4kTG9nUHJvdmlkZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGRlYnVnID0gdHJ1ZTtcblxuICBmdW5jdGlvbiBjb25jYXQoYXJyYXkxLCBhcnJheTIsIGluZGV4KSB7XG4gICAgcmV0dXJuIGFycmF5MS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJyYXkyLCBpbmRleCkpO1xuICB9XG5cbiAgdGhpcy5kZWJ1Z0VuYWJsZWQgPSBmdW5jdGlvbihmbGFnKSB7XG4gICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKGZsYWcpKSB7XG4gICAgICBkZWJ1ZyA9IGZsYWc7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGRlYnVnO1xuICAgIH1cbiAgfTtcblxuICB0aGlzLiRnZXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgJGxvZyA9IHtcbiAgICAgIGxvZzogZnVuY3Rpb24oKSB7ICRsb2cubG9nLmxvZ3MucHVzaChjb25jYXQoW10sIGFyZ3VtZW50cywgMCkpOyB9LFxuICAgICAgd2FybjogZnVuY3Rpb24oKSB7ICRsb2cud2Fybi5sb2dzLnB1c2goY29uY2F0KFtdLCBhcmd1bWVudHMsIDApKTsgfSxcbiAgICAgIGluZm86IGZ1bmN0aW9uKCkgeyAkbG9nLmluZm8ubG9ncy5wdXNoKGNvbmNhdChbXSwgYXJndW1lbnRzLCAwKSk7IH0sXG4gICAgICBlcnJvcjogZnVuY3Rpb24oKSB7ICRsb2cuZXJyb3IubG9ncy5wdXNoKGNvbmNhdChbXSwgYXJndW1lbnRzLCAwKSk7IH0sXG4gICAgICBkZWJ1ZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChkZWJ1Zykge1xuICAgICAgICAgICRsb2cuZGVidWcubG9ncy5wdXNoKGNvbmNhdChbXSwgYXJndW1lbnRzLCAwKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAqIEBuYW1lICRsb2cjcmVzZXRcbiAgICAgKlxuICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAqIFJlc2V0IGFsbCBvZiB0aGUgbG9nZ2luZyBhcnJheXMgdG8gZW1wdHkuXG4gICAgICovXG4gICAgJGxvZy5yZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgICAgLyoqXG4gICAgICAgKiBAbmdkb2MgcHJvcGVydHlcbiAgICAgICAqIEBuYW1lICRsb2cjbG9nLmxvZ3NcbiAgICAgICAqXG4gICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAqIEFycmF5IG9mIG1lc3NhZ2VzIGxvZ2dlZCB1c2luZyB7QGxpbmsgbmcuJGxvZyNsb2cgYGxvZygpYH0uXG4gICAgICAgKlxuICAgICAgICogQGV4YW1wbGVcbiAgICAgICAqIGBgYGpzXG4gICAgICAgKiAkbG9nLmxvZygnU29tZSBMb2cnKTtcbiAgICAgICAqIHZhciBmaXJzdCA9ICRsb2cubG9nLmxvZ3MudW5zaGlmdCgpO1xuICAgICAgICogYGBgXG4gICAgICAgKi9cbiAgICAgICRsb2cubG9nLmxvZ3MgPSBbXTtcbiAgICAgIC8qKlxuICAgICAgICogQG5nZG9jIHByb3BlcnR5XG4gICAgICAgKiBAbmFtZSAkbG9nI2luZm8ubG9nc1xuICAgICAgICpcbiAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICogQXJyYXkgb2YgbWVzc2FnZXMgbG9nZ2VkIHVzaW5nIHtAbGluayBuZy4kbG9nI2luZm8gYGluZm8oKWB9LlxuICAgICAgICpcbiAgICAgICAqIEBleGFtcGxlXG4gICAgICAgKiBgYGBqc1xuICAgICAgICogJGxvZy5pbmZvKCdTb21lIEluZm8nKTtcbiAgICAgICAqIHZhciBmaXJzdCA9ICRsb2cuaW5mby5sb2dzLnVuc2hpZnQoKTtcbiAgICAgICAqIGBgYFxuICAgICAgICovXG4gICAgICAkbG9nLmluZm8ubG9ncyA9IFtdO1xuICAgICAgLyoqXG4gICAgICAgKiBAbmdkb2MgcHJvcGVydHlcbiAgICAgICAqIEBuYW1lICRsb2cjd2Fybi5sb2dzXG4gICAgICAgKlxuICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgKiBBcnJheSBvZiBtZXNzYWdlcyBsb2dnZWQgdXNpbmcge0BsaW5rIG5nLiRsb2cjd2FybiBgd2FybigpYH0uXG4gICAgICAgKlxuICAgICAgICogQGV4YW1wbGVcbiAgICAgICAqIGBgYGpzXG4gICAgICAgKiAkbG9nLndhcm4oJ1NvbWUgV2FybmluZycpO1xuICAgICAgICogdmFyIGZpcnN0ID0gJGxvZy53YXJuLmxvZ3MudW5zaGlmdCgpO1xuICAgICAgICogYGBgXG4gICAgICAgKi9cbiAgICAgICRsb2cud2Fybi5sb2dzID0gW107XG4gICAgICAvKipcbiAgICAgICAqIEBuZ2RvYyBwcm9wZXJ0eVxuICAgICAgICogQG5hbWUgJGxvZyNlcnJvci5sb2dzXG4gICAgICAgKlxuICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgKiBBcnJheSBvZiBtZXNzYWdlcyBsb2dnZWQgdXNpbmcge0BsaW5rIG5nLiRsb2cjZXJyb3IgYGVycm9yKClgfS5cbiAgICAgICAqXG4gICAgICAgKiBAZXhhbXBsZVxuICAgICAgICogYGBganNcbiAgICAgICAqICRsb2cuZXJyb3IoJ1NvbWUgRXJyb3InKTtcbiAgICAgICAqIHZhciBmaXJzdCA9ICRsb2cuZXJyb3IubG9ncy51bnNoaWZ0KCk7XG4gICAgICAgKiBgYGBcbiAgICAgICAqL1xuICAgICAgJGxvZy5lcnJvci5sb2dzID0gW107XG4gICAgICAgIC8qKlxuICAgICAgICogQG5nZG9jIHByb3BlcnR5XG4gICAgICAgKiBAbmFtZSAkbG9nI2RlYnVnLmxvZ3NcbiAgICAgICAqXG4gICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAqIEFycmF5IG9mIG1lc3NhZ2VzIGxvZ2dlZCB1c2luZyB7QGxpbmsgbmcuJGxvZyNkZWJ1ZyBgZGVidWcoKWB9LlxuICAgICAgICpcbiAgICAgICAqIEBleGFtcGxlXG4gICAgICAgKiBgYGBqc1xuICAgICAgICogJGxvZy5kZWJ1ZygnU29tZSBFcnJvcicpO1xuICAgICAgICogdmFyIGZpcnN0ID0gJGxvZy5kZWJ1Zy5sb2dzLnVuc2hpZnQoKTtcbiAgICAgICAqIGBgYFxuICAgICAgICovXG4gICAgICAkbG9nLmRlYnVnLmxvZ3MgPSBbXTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAqIEBuYW1lICRsb2cjYXNzZXJ0RW1wdHlcbiAgICAgKlxuICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAqIEFzc2VydCB0aGF0IGFsbCBvZiB0aGUgbG9nZ2luZyBtZXRob2RzIGhhdmUgbm8gbG9nZ2VkIG1lc3NhZ2VzLiBJZiBhbnkgbWVzc2FnZXMgYXJlIHByZXNlbnQsXG4gICAgICogYW4gZXhjZXB0aW9uIGlzIHRocm93bi5cbiAgICAgKi9cbiAgICAkbG9nLmFzc2VydEVtcHR5ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZXJyb3JzID0gW107XG4gICAgICBhbmd1bGFyLmZvckVhY2goWydlcnJvcicsICd3YXJuJywgJ2luZm8nLCAnbG9nJywgJ2RlYnVnJ10sIGZ1bmN0aW9uKGxvZ0xldmVsKSB7XG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaCgkbG9nW2xvZ0xldmVsXS5sb2dzLCBmdW5jdGlvbihsb2cpIHtcbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2gobG9nLCBmdW5jdGlvbihsb2dJdGVtKSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaCgnTU9DSyAkbG9nICgnICsgbG9nTGV2ZWwgKyAnKTogJyArIFN0cmluZyhsb2dJdGVtKSArICdcXG4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgIChsb2dJdGVtLnN0YWNrIHx8ICcnKSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICBlcnJvcnMudW5zaGlmdChcIkV4cGVjdGVkICRsb2cgdG8gYmUgZW1wdHkhIEVpdGhlciBhIG1lc3NhZ2Ugd2FzIGxvZ2dlZCB1bmV4cGVjdGVkbHksIG9yIFwiICtcbiAgICAgICAgICBcImFuIGV4cGVjdGVkIGxvZyBtZXNzYWdlIHdhcyBub3QgY2hlY2tlZCBhbmQgcmVtb3ZlZDpcIik7XG4gICAgICAgIGVycm9ycy5wdXNoKCcnKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9ycy5qb2luKCdcXG4tLS0tLS0tLS1cXG4nKSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgICRsb2cucmVzZXQoKTtcbiAgICByZXR1cm4gJGxvZztcbiAgfTtcbn07XG5cblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgJGludGVydmFsXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBNb2NrIGltcGxlbWVudGF0aW9uIG9mIHRoZSAkaW50ZXJ2YWwgc2VydmljZS5cbiAqXG4gKiBVc2Uge0BsaW5rIG5nTW9jay4kaW50ZXJ2YWwjZmx1c2ggYCRpbnRlcnZhbC5mbHVzaChtaWxsaXMpYH0gdG9cbiAqIG1vdmUgZm9yd2FyZCBieSBgbWlsbGlzYCBtaWxsaXNlY29uZHMgYW5kIHRyaWdnZXIgYW55IGZ1bmN0aW9ucyBzY2hlZHVsZWQgdG8gcnVuIGluIHRoYXRcbiAqIHRpbWUuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbigpfSBmbiBBIGZ1bmN0aW9uIHRoYXQgc2hvdWxkIGJlIGNhbGxlZCByZXBlYXRlZGx5LlxuICogQHBhcmFtIHtudW1iZXJ9IGRlbGF5IE51bWJlciBvZiBtaWxsaXNlY29uZHMgYmV0d2VlbiBlYWNoIGZ1bmN0aW9uIGNhbGwuXG4gKiBAcGFyYW0ge251bWJlcj19IFtjb3VudD0wXSBOdW1iZXIgb2YgdGltZXMgdG8gcmVwZWF0LiBJZiBub3Qgc2V0LCBvciAwLCB3aWxsIHJlcGVhdFxuICogICBpbmRlZmluaXRlbHkuXG4gKiBAcGFyYW0ge2Jvb2xlYW49fSBbaW52b2tlQXBwbHk9dHJ1ZV0gSWYgc2V0IHRvIGBmYWxzZWAgc2tpcHMgbW9kZWwgZGlydHkgY2hlY2tpbmcsIG90aGVyd2lzZVxuICogICB3aWxsIGludm9rZSBgZm5gIHdpdGhpbiB0aGUge0BsaW5rIG5nLiRyb290U2NvcGUuU2NvcGUjJGFwcGx5ICRhcHBseX0gYmxvY2suXG4gKiBAcmV0dXJucyB7cHJvbWlzZX0gQSBwcm9taXNlIHdoaWNoIHdpbGwgYmUgbm90aWZpZWQgb24gZWFjaCBpdGVyYXRpb24uXG4gKi9cbmFuZ3VsYXIubW9jay4kSW50ZXJ2YWxQcm92aWRlciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLiRnZXQgPSBbJyRicm93c2VyJywgJyRyb290U2NvcGUnLCAnJHEnLCAnJCRxJyxcbiAgICAgICBmdW5jdGlvbigkYnJvd3NlciwgICAkcm9vdFNjb3BlLCAgICRxLCAgICQkcSkge1xuICAgIHZhciByZXBlYXRGbnMgPSBbXSxcbiAgICAgICAgbmV4dFJlcGVhdElkID0gMCxcbiAgICAgICAgbm93ID0gMDtcblxuICAgIHZhciAkaW50ZXJ2YWwgPSBmdW5jdGlvbihmbiwgZGVsYXksIGNvdW50LCBpbnZva2VBcHBseSkge1xuICAgICAgdmFyIGl0ZXJhdGlvbiA9IDAsXG4gICAgICAgICAgc2tpcEFwcGx5ID0gKGFuZ3VsYXIuaXNEZWZpbmVkKGludm9rZUFwcGx5KSAmJiAhaW52b2tlQXBwbHkpLFxuICAgICAgICAgIGRlZmVycmVkID0gKHNraXBBcHBseSA/ICQkcSA6ICRxKS5kZWZlcigpLFxuICAgICAgICAgIHByb21pc2UgPSBkZWZlcnJlZC5wcm9taXNlO1xuXG4gICAgICBjb3VudCA9IChhbmd1bGFyLmlzRGVmaW5lZChjb3VudCkpID8gY291bnQgOiAwO1xuICAgICAgcHJvbWlzZS50aGVuKG51bGwsIG51bGwsIGZuKTtcblxuICAgICAgcHJvbWlzZS4kJGludGVydmFsSWQgPSBuZXh0UmVwZWF0SWQ7XG5cbiAgICAgIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgICAgIGRlZmVycmVkLm5vdGlmeShpdGVyYXRpb24rKyk7XG5cbiAgICAgICAgaWYgKGNvdW50ID4gMCAmJiBpdGVyYXRpb24gPj0gY291bnQpIHtcbiAgICAgICAgICB2YXIgZm5JbmRleDtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGl0ZXJhdGlvbik7XG5cbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2gocmVwZWF0Rm5zLCBmdW5jdGlvbihmbiwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChmbi5pZCA9PT0gcHJvbWlzZS4kJGludGVydmFsSWQpIGZuSW5kZXggPSBpbmRleDtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmIChmbkluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlcGVhdEZucy5zcGxpY2UoZm5JbmRleCwgMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNraXBBcHBseSkge1xuICAgICAgICAgICRicm93c2VyLmRlZmVyLmZsdXNoKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXBlYXRGbnMucHVzaCh7XG4gICAgICAgIG5leHRUaW1lOihub3cgKyBkZWxheSksXG4gICAgICAgIGRlbGF5OiBkZWxheSxcbiAgICAgICAgZm46IHRpY2ssXG4gICAgICAgIGlkOiBuZXh0UmVwZWF0SWQsXG4gICAgICAgIGRlZmVycmVkOiBkZWZlcnJlZFxuICAgICAgfSk7XG4gICAgICByZXBlYXRGbnMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhLm5leHRUaW1lIC0gYi5uZXh0VGltZTt9KTtcblxuICAgICAgbmV4dFJlcGVhdElkKys7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgKiBAbmFtZSAkaW50ZXJ2YWwjY2FuY2VsXG4gICAgICpcbiAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgKiBDYW5jZWxzIGEgdGFzayBhc3NvY2lhdGVkIHdpdGggdGhlIGBwcm9taXNlYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7cHJvbWlzZX0gcHJvbWlzZSBBIHByb21pc2UgZnJvbSBjYWxsaW5nIHRoZSBgJGludGVydmFsYCBmdW5jdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHRhc2sgd2FzIHN1Y2Nlc3NmdWxseSBjYW5jZWxsZWQuXG4gICAgICovXG4gICAgJGludGVydmFsLmNhbmNlbCA9IGZ1bmN0aW9uKHByb21pc2UpIHtcbiAgICAgIGlmICghcHJvbWlzZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgdmFyIGZuSW5kZXg7XG5cbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChyZXBlYXRGbnMsIGZ1bmN0aW9uKGZuLCBpbmRleCkge1xuICAgICAgICBpZiAoZm4uaWQgPT09IHByb21pc2UuJCRpbnRlcnZhbElkKSBmbkluZGV4ID0gaW5kZXg7XG4gICAgICB9KTtcblxuICAgICAgaWYgKGZuSW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXBlYXRGbnNbZm5JbmRleF0uZGVmZXJyZWQucmVqZWN0KCdjYW5jZWxlZCcpO1xuICAgICAgICByZXBlYXRGbnMuc3BsaWNlKGZuSW5kZXgsIDEpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICogQG5hbWUgJGludGVydmFsI2ZsdXNoXG4gICAgICogQGRlc2NyaXB0aW9uXG4gICAgICpcbiAgICAgKiBSdW5zIGludGVydmFsIHRhc2tzIHNjaGVkdWxlZCB0byBiZSBydW4gaW4gdGhlIG5leHQgYG1pbGxpc2AgbWlsbGlzZWNvbmRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXI9fSBtaWxsaXMgbWF4aW11bSB0aW1lb3V0IGFtb3VudCB0byBmbHVzaCB1cCB1bnRpbC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge251bWJlcn0gVGhlIGFtb3VudCBvZiB0aW1lIG1vdmVkIGZvcndhcmQuXG4gICAgICovXG4gICAgJGludGVydmFsLmZsdXNoID0gZnVuY3Rpb24obWlsbGlzKSB7XG4gICAgICBub3cgKz0gbWlsbGlzO1xuICAgICAgd2hpbGUgKHJlcGVhdEZucy5sZW5ndGggJiYgcmVwZWF0Rm5zWzBdLm5leHRUaW1lIDw9IG5vdykge1xuICAgICAgICB2YXIgdGFzayA9IHJlcGVhdEZuc1swXTtcbiAgICAgICAgdGFzay5mbigpO1xuICAgICAgICB0YXNrLm5leHRUaW1lICs9IHRhc2suZGVsYXk7XG4gICAgICAgIHJlcGVhdEZucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEubmV4dFRpbWUgLSBiLm5leHRUaW1lO30pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1pbGxpcztcbiAgICB9O1xuXG4gICAgcmV0dXJuICRpbnRlcnZhbDtcbiAgfV07XG59O1xuXG5cbi8qIGpzaGludCAtVzEwMSAqL1xuLyogVGhlIFJfSVNPODA2MV9TVFIgcmVnZXggaXMgbmV2ZXIgZ29pbmcgdG8gZml0IGludG8gdGhlIDEwMCBjaGFyIGxpbWl0IVxuICogVGhpcyBkaXJlY3RpdmUgc2hvdWxkIGdvIGluc2lkZSB0aGUgYW5vbnltb3VzIGZ1bmN0aW9uIGJ1dCBhIGJ1ZyBpbiBKU0hpbnQgbWVhbnMgdGhhdCBpdCB3b3VsZFxuICogbm90IGJlIGVuYWN0ZWQgZWFybHkgZW5vdWdoIHRvIHByZXZlbnQgdGhlIHdhcm5pbmcuXG4gKi9cbnZhciBSX0lTTzgwNjFfU1RSID0gL14oXFxkezR9KS0/KFxcZFxcZCktPyhcXGRcXGQpKD86VChcXGRcXGQpKD86XFw6PyhcXGRcXGQpKD86XFw6PyhcXGRcXGQpKD86XFwuKFxcZHszfSkpPyk/KT8oWnwoWystXSkoXFxkXFxkKTo/KFxcZFxcZCkpKT8kLztcblxuZnVuY3Rpb24ganNvblN0cmluZ1RvRGF0ZShzdHJpbmcpIHtcbiAgdmFyIG1hdGNoO1xuICBpZiAobWF0Y2ggPSBzdHJpbmcubWF0Y2goUl9JU084MDYxX1NUUikpIHtcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKDApLFxuICAgICAgICB0ekhvdXIgPSAwLFxuICAgICAgICB0ek1pbiAgPSAwO1xuICAgIGlmIChtYXRjaFs5XSkge1xuICAgICAgdHpIb3VyID0gaW50KG1hdGNoWzldICsgbWF0Y2hbMTBdKTtcbiAgICAgIHR6TWluID0gaW50KG1hdGNoWzldICsgbWF0Y2hbMTFdKTtcbiAgICB9XG4gICAgZGF0ZS5zZXRVVENGdWxsWWVhcihpbnQobWF0Y2hbMV0pLCBpbnQobWF0Y2hbMl0pIC0gMSwgaW50KG1hdGNoWzNdKSk7XG4gICAgZGF0ZS5zZXRVVENIb3VycyhpbnQobWF0Y2hbNF0gfHwgMCkgLSB0ekhvdXIsXG4gICAgICAgICAgICAgICAgICAgICBpbnQobWF0Y2hbNV0gfHwgMCkgLSB0ek1pbixcbiAgICAgICAgICAgICAgICAgICAgIGludChtYXRjaFs2XSB8fCAwKSxcbiAgICAgICAgICAgICAgICAgICAgIGludChtYXRjaFs3XSB8fCAwKSk7XG4gICAgcmV0dXJuIGRhdGU7XG4gIH1cbiAgcmV0dXJuIHN0cmluZztcbn1cblxuZnVuY3Rpb24gaW50KHN0cikge1xuICByZXR1cm4gcGFyc2VJbnQoc3RyLCAxMCk7XG59XG5cbmZ1bmN0aW9uIHBhZE51bWJlcihudW0sIGRpZ2l0cywgdHJpbSkge1xuICB2YXIgbmVnID0gJyc7XG4gIGlmIChudW0gPCAwKSB7XG4gICAgbmVnID0gICctJztcbiAgICBudW0gPSAtbnVtO1xuICB9XG4gIG51bSA9ICcnICsgbnVtO1xuICB3aGlsZSAobnVtLmxlbmd0aCA8IGRpZ2l0cykgbnVtID0gJzAnICsgbnVtO1xuICBpZiAodHJpbSlcbiAgICBudW0gPSBudW0uc3Vic3RyKG51bS5sZW5ndGggLSBkaWdpdHMpO1xuICByZXR1cm4gbmVnICsgbnVtO1xufVxuXG5cbi8qKlxuICogQG5nZG9jIHR5cGVcbiAqIEBuYW1lIGFuZ3VsYXIubW9jay5UekRhdGVcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqICpOT1RFKjogdGhpcyBpcyBub3QgYW4gaW5qZWN0YWJsZSBpbnN0YW5jZSwganVzdCBhIGdsb2JhbGx5IGF2YWlsYWJsZSBtb2NrIGNsYXNzIG9mIGBEYXRlYC5cbiAqXG4gKiBNb2NrIG9mIHRoZSBEYXRlIHR5cGUgd2hpY2ggaGFzIGl0cyB0aW1lem9uZSBzcGVjaWZpZWQgdmlhIGNvbnN0cnVjdG9yIGFyZy5cbiAqXG4gKiBUaGUgbWFpbiBwdXJwb3NlIGlzIHRvIGNyZWF0ZSBEYXRlLWxpa2UgaW5zdGFuY2VzIHdpdGggdGltZXpvbmUgZml4ZWQgdG8gdGhlIHNwZWNpZmllZCB0aW1lem9uZVxuICogb2Zmc2V0LCBzbyB0aGF0IHdlIGNhbiB0ZXN0IGNvZGUgdGhhdCBkZXBlbmRzIG9uIGxvY2FsIHRpbWV6b25lIHNldHRpbmdzIHdpdGhvdXQgZGVwZW5kZW5jeSBvblxuICogdGhlIHRpbWUgem9uZSBzZXR0aW5ncyBvZiB0aGUgbWFjaGluZSB3aGVyZSB0aGUgY29kZSBpcyBydW5uaW5nLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXQgT2Zmc2V0IG9mIHRoZSAqZGVzaXJlZCogdGltZXpvbmUgaW4gaG91cnMgKGZyYWN0aW9ucyB3aWxsIGJlIGhvbm9yZWQpXG4gKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gdGltZXN0YW1wIFRpbWVzdGFtcCByZXByZXNlbnRpbmcgdGhlIGRlc2lyZWQgdGltZSBpbiAqVVRDKlxuICpcbiAqIEBleGFtcGxlXG4gKiAhISEhIFdBUk5JTkcgISEhISFcbiAqIFRoaXMgaXMgbm90IGEgY29tcGxldGUgRGF0ZSBvYmplY3Qgc28gb25seSBtZXRob2RzIHRoYXQgd2VyZSBpbXBsZW1lbnRlZCBjYW4gYmUgY2FsbGVkIHNhZmVseS5cbiAqIFRvIG1ha2UgbWF0dGVycyB3b3JzZSwgVHpEYXRlIGluc3RhbmNlcyBpbmhlcml0IHN0dWZmIGZyb20gRGF0ZSB2aWEgYSBwcm90b3R5cGUuXG4gKlxuICogV2UgZG8gb3VyIGJlc3QgdG8gaW50ZXJjZXB0IGNhbGxzIHRvIFwidW5pbXBsZW1lbnRlZFwiIG1ldGhvZHMsIGJ1dCBzaW5jZSB0aGUgbGlzdCBvZiBtZXRob2RzIGlzXG4gKiBpbmNvbXBsZXRlIHdlIG1pZ2h0IGJlIG1pc3Npbmcgc29tZSBub24tc3RhbmRhcmQgbWV0aG9kcy4gVGhpcyBjYW4gcmVzdWx0IGluIGVycm9ycyBsaWtlOlxuICogXCJEYXRlLnByb3RvdHlwZS5mb28gY2FsbGVkIG9uIGluY29tcGF0aWJsZSBPYmplY3RcIi5cbiAqXG4gKiBgYGBqc1xuICogdmFyIG5ld1llYXJJbkJyYXRpc2xhdmEgPSBuZXcgVHpEYXRlKC0xLCAnMjAwOS0xMi0zMVQyMzowMDowMFonKTtcbiAqIG5ld1llYXJJbkJyYXRpc2xhdmEuZ2V0VGltZXpvbmVPZmZzZXQoKSA9PiAtNjA7XG4gKiBuZXdZZWFySW5CcmF0aXNsYXZhLmdldEZ1bGxZZWFyKCkgPT4gMjAxMDtcbiAqIG5ld1llYXJJbkJyYXRpc2xhdmEuZ2V0TW9udGgoKSA9PiAwO1xuICogbmV3WWVhckluQnJhdGlzbGF2YS5nZXREYXRlKCkgPT4gMTtcbiAqIG5ld1llYXJJbkJyYXRpc2xhdmEuZ2V0SG91cnMoKSA9PiAwO1xuICogbmV3WWVhckluQnJhdGlzbGF2YS5nZXRNaW51dGVzKCkgPT4gMDtcbiAqIG5ld1llYXJJbkJyYXRpc2xhdmEuZ2V0U2Vjb25kcygpID0+IDA7XG4gKiBgYGBcbiAqXG4gKi9cbmFuZ3VsYXIubW9jay5UekRhdGUgPSBmdW5jdGlvbihvZmZzZXQsIHRpbWVzdGFtcCkge1xuICB2YXIgc2VsZiA9IG5ldyBEYXRlKDApO1xuICBpZiAoYW5ndWxhci5pc1N0cmluZyh0aW1lc3RhbXApKSB7XG4gICAgdmFyIHRzU3RyID0gdGltZXN0YW1wO1xuXG4gICAgc2VsZi5vcmlnRGF0ZSA9IGpzb25TdHJpbmdUb0RhdGUodGltZXN0YW1wKTtcblxuICAgIHRpbWVzdGFtcCA9IHNlbGYub3JpZ0RhdGUuZ2V0VGltZSgpO1xuICAgIGlmIChpc05hTih0aW1lc3RhbXApKVxuICAgICAgdGhyb3cge1xuICAgICAgICBuYW1lOiBcIklsbGVnYWwgQXJndW1lbnRcIixcbiAgICAgICAgbWVzc2FnZTogXCJBcmcgJ1wiICsgdHNTdHIgKyBcIicgcGFzc2VkIGludG8gVHpEYXRlIGNvbnN0cnVjdG9yIGlzIG5vdCBhIHZhbGlkIGRhdGUgc3RyaW5nXCJcbiAgICAgIH07XG4gIH0gZWxzZSB7XG4gICAgc2VsZi5vcmlnRGF0ZSA9IG5ldyBEYXRlKHRpbWVzdGFtcCk7XG4gIH1cblxuICB2YXIgbG9jYWxPZmZzZXQgPSBuZXcgRGF0ZSh0aW1lc3RhbXApLmdldFRpbWV6b25lT2Zmc2V0KCk7XG4gIHNlbGYub2Zmc2V0RGlmZiA9IGxvY2FsT2Zmc2V0ICogNjAgKiAxMDAwIC0gb2Zmc2V0ICogMTAwMCAqIDYwICogNjA7XG4gIHNlbGYuZGF0ZSA9IG5ldyBEYXRlKHRpbWVzdGFtcCArIHNlbGYub2Zmc2V0RGlmZik7XG5cbiAgc2VsZi5nZXRUaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYuZGF0ZS5nZXRUaW1lKCkgLSBzZWxmLm9mZnNldERpZmY7XG4gIH07XG5cbiAgc2VsZi50b0xvY2FsZURhdGVTdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5kYXRlLnRvTG9jYWxlRGF0ZVN0cmluZygpO1xuICB9O1xuXG4gIHNlbGYuZ2V0RnVsbFllYXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5kYXRlLmdldEZ1bGxZZWFyKCk7XG4gIH07XG5cbiAgc2VsZi5nZXRNb250aCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzZWxmLmRhdGUuZ2V0TW9udGgoKTtcbiAgfTtcblxuICBzZWxmLmdldERhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5kYXRlLmdldERhdGUoKTtcbiAgfTtcblxuICBzZWxmLmdldEhvdXJzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYuZGF0ZS5nZXRIb3VycygpO1xuICB9O1xuXG4gIHNlbGYuZ2V0TWludXRlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzZWxmLmRhdGUuZ2V0TWludXRlcygpO1xuICB9O1xuXG4gIHNlbGYuZ2V0U2Vjb25kcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzZWxmLmRhdGUuZ2V0U2Vjb25kcygpO1xuICB9O1xuXG4gIHNlbGYuZ2V0TWlsbGlzZWNvbmRzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYuZGF0ZS5nZXRNaWxsaXNlY29uZHMoKTtcbiAgfTtcblxuICBzZWxmLmdldFRpbWV6b25lT2Zmc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG9mZnNldCAqIDYwO1xuICB9O1xuXG4gIHNlbGYuZ2V0VVRDRnVsbFllYXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5vcmlnRGF0ZS5nZXRVVENGdWxsWWVhcigpO1xuICB9O1xuXG4gIHNlbGYuZ2V0VVRDTW9udGggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5vcmlnRGF0ZS5nZXRVVENNb250aCgpO1xuICB9O1xuXG4gIHNlbGYuZ2V0VVRDRGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzZWxmLm9yaWdEYXRlLmdldFVUQ0RhdGUoKTtcbiAgfTtcblxuICBzZWxmLmdldFVUQ0hvdXJzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYub3JpZ0RhdGUuZ2V0VVRDSG91cnMoKTtcbiAgfTtcblxuICBzZWxmLmdldFVUQ01pbnV0ZXMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5vcmlnRGF0ZS5nZXRVVENNaW51dGVzKCk7XG4gIH07XG5cbiAgc2VsZi5nZXRVVENTZWNvbmRzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYub3JpZ0RhdGUuZ2V0VVRDU2Vjb25kcygpO1xuICB9O1xuXG4gIHNlbGYuZ2V0VVRDTWlsbGlzZWNvbmRzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYub3JpZ0RhdGUuZ2V0VVRDTWlsbGlzZWNvbmRzKCk7XG4gIH07XG5cbiAgc2VsZi5nZXREYXkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5kYXRlLmdldERheSgpO1xuICB9O1xuXG4gIC8vIHByb3ZpZGUgdGhpcyBtZXRob2Qgb25seSBvbiBicm93c2VycyB0aGF0IGFscmVhZHkgaGF2ZSBpdFxuICBpZiAoc2VsZi50b0lTT1N0cmluZykge1xuICAgIHNlbGYudG9JU09TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBwYWROdW1iZXIoc2VsZi5vcmlnRGF0ZS5nZXRVVENGdWxsWWVhcigpLCA0KSArICctJyArXG4gICAgICAgICAgICBwYWROdW1iZXIoc2VsZi5vcmlnRGF0ZS5nZXRVVENNb250aCgpICsgMSwgMikgKyAnLScgK1xuICAgICAgICAgICAgcGFkTnVtYmVyKHNlbGYub3JpZ0RhdGUuZ2V0VVRDRGF0ZSgpLCAyKSArICdUJyArXG4gICAgICAgICAgICBwYWROdW1iZXIoc2VsZi5vcmlnRGF0ZS5nZXRVVENIb3VycygpLCAyKSArICc6JyArXG4gICAgICAgICAgICBwYWROdW1iZXIoc2VsZi5vcmlnRGF0ZS5nZXRVVENNaW51dGVzKCksIDIpICsgJzonICtcbiAgICAgICAgICAgIHBhZE51bWJlcihzZWxmLm9yaWdEYXRlLmdldFVUQ1NlY29uZHMoKSwgMikgKyAnLicgK1xuICAgICAgICAgICAgcGFkTnVtYmVyKHNlbGYub3JpZ0RhdGUuZ2V0VVRDTWlsbGlzZWNvbmRzKCksIDMpICsgJ1onO1xuICAgIH07XG4gIH1cblxuICAvL2hpZGUgYWxsIG1ldGhvZHMgbm90IGltcGxlbWVudGVkIGluIHRoaXMgbW9jayB0aGF0IHRoZSBEYXRlIHByb3RvdHlwZSBleHBvc2VzXG4gIHZhciB1bmltcGxlbWVudGVkTWV0aG9kcyA9IFsnZ2V0VVRDRGF5JyxcbiAgICAgICdnZXRZZWFyJywgJ3NldERhdGUnLCAnc2V0RnVsbFllYXInLCAnc2V0SG91cnMnLCAnc2V0TWlsbGlzZWNvbmRzJyxcbiAgICAgICdzZXRNaW51dGVzJywgJ3NldE1vbnRoJywgJ3NldFNlY29uZHMnLCAnc2V0VGltZScsICdzZXRVVENEYXRlJywgJ3NldFVUQ0Z1bGxZZWFyJyxcbiAgICAgICdzZXRVVENIb3VycycsICdzZXRVVENNaWxsaXNlY29uZHMnLCAnc2V0VVRDTWludXRlcycsICdzZXRVVENNb250aCcsICdzZXRVVENTZWNvbmRzJyxcbiAgICAgICdzZXRZZWFyJywgJ3RvRGF0ZVN0cmluZycsICd0b0dNVFN0cmluZycsICd0b0pTT04nLCAndG9Mb2NhbGVGb3JtYXQnLCAndG9Mb2NhbGVTdHJpbmcnLFxuICAgICAgJ3RvTG9jYWxlVGltZVN0cmluZycsICd0b1NvdXJjZScsICd0b1N0cmluZycsICd0b1RpbWVTdHJpbmcnLCAndG9VVENTdHJpbmcnLCAndmFsdWVPZiddO1xuXG4gIGFuZ3VsYXIuZm9yRWFjaCh1bmltcGxlbWVudGVkTWV0aG9kcywgZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgIHNlbGZbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCAnXCIgKyBtZXRob2ROYW1lICsgXCInIGlzIG5vdCBpbXBsZW1lbnRlZCBpbiB0aGUgVHpEYXRlIG1vY2tcIik7XG4gICAgfTtcbiAgfSk7XG5cbiAgcmV0dXJuIHNlbGY7XG59O1xuXG4vL21ha2UgXCJ0ekRhdGVJbnN0YW5jZSBpbnN0YW5jZW9mIERhdGVcIiByZXR1cm4gdHJ1ZVxuYW5ndWxhci5tb2NrLlR6RGF0ZS5wcm90b3R5cGUgPSBEYXRlLnByb3RvdHlwZTtcbi8qIGpzaGludCArVzEwMSAqL1xuXG5hbmd1bGFyLm1vY2suYW5pbWF0ZSA9IGFuZ3VsYXIubW9kdWxlKCduZ0FuaW1hdGVNb2NrJywgWyduZyddKVxuXG4gIC5jb25maWcoWyckcHJvdmlkZScsIGZ1bmN0aW9uKCRwcm92aWRlKSB7XG5cbiAgICB2YXIgcmVmbG93UXVldWUgPSBbXTtcbiAgICAkcHJvdmlkZS52YWx1ZSgnJCRhbmltYXRlUmVmbG93JywgZnVuY3Rpb24oZm4pIHtcbiAgICAgIHZhciBpbmRleCA9IHJlZmxvd1F1ZXVlLmxlbmd0aDtcbiAgICAgIHJlZmxvd1F1ZXVlLnB1c2goZm4pO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIGNhbmNlbCgpIHtcbiAgICAgICAgcmVmbG93UXVldWUuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRhbmltYXRlJywgWyckZGVsZWdhdGUnLCAnJCRhc3luY0NhbGxiYWNrJywgJyR0aW1lb3V0JywgJyRicm93c2VyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigkZGVsZWdhdGUsICAgJCRhc3luY0NhbGxiYWNrLCAgICR0aW1lb3V0LCAgICRicm93c2VyKSB7XG4gICAgICB2YXIgYW5pbWF0ZSA9IHtcbiAgICAgICAgcXVldWU6IFtdLFxuICAgICAgICBjYW5jZWw6ICRkZWxlZ2F0ZS5jYW5jZWwsXG4gICAgICAgIGVuYWJsZWQ6ICRkZWxlZ2F0ZS5lbmFibGVkLFxuICAgICAgICB0cmlnZ2VyQ2FsbGJhY2tFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICQkYXN5bmNDYWxsYmFjay5mbHVzaCgpO1xuICAgICAgICB9LFxuICAgICAgICB0cmlnZ2VyQ2FsbGJhY2tQcm9taXNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAkdGltZW91dC5mbHVzaCgwKTtcbiAgICAgICAgfSxcbiAgICAgICAgdHJpZ2dlckNhbGxiYWNrczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyQ2FsbGJhY2tFdmVudHMoKTtcbiAgICAgICAgICB0aGlzLnRyaWdnZXJDYWxsYmFja1Byb21pc2UoKTtcbiAgICAgICAgfSxcbiAgICAgICAgdHJpZ2dlclJlZmxvdzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHJlZmxvd1F1ZXVlLCBmdW5jdGlvbihmbikge1xuICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZWZsb3dRdWV1ZSA9IFtdO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBhbmd1bGFyLmZvckVhY2goXG4gICAgICAgIFsnYW5pbWF0ZScsJ2VudGVyJywnbGVhdmUnLCdtb3ZlJywnYWRkQ2xhc3MnLCdyZW1vdmVDbGFzcycsJ3NldENsYXNzJ10sIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgICBhbmltYXRlW21ldGhvZF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmltYXRlLnF1ZXVlLnB1c2goe1xuICAgICAgICAgICAgZXZlbnQ6IG1ldGhvZCxcbiAgICAgICAgICAgIGVsZW1lbnQ6IGFyZ3VtZW50c1swXSxcbiAgICAgICAgICAgIG9wdGlvbnM6IGFyZ3VtZW50c1thcmd1bWVudHMubGVuZ3RoIC0gMV0sXG4gICAgICAgICAgICBhcmdzOiBhcmd1bWVudHNcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gJGRlbGVnYXRlW21ldGhvZF0uYXBwbHkoJGRlbGVnYXRlLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBhbmltYXRlO1xuICAgIH1dKTtcblxuICB9XSk7XG5cblxuLyoqXG4gKiBAbmdkb2MgZnVuY3Rpb25cbiAqIEBuYW1lIGFuZ3VsYXIubW9jay5kdW1wXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiAqTk9URSo6IHRoaXMgaXMgbm90IGFuIGluamVjdGFibGUgaW5zdGFuY2UsIGp1c3QgYSBnbG9iYWxseSBhdmFpbGFibGUgZnVuY3Rpb24uXG4gKlxuICogTWV0aG9kIGZvciBzZXJpYWxpemluZyBjb21tb24gYW5ndWxhciBvYmplY3RzIChzY29wZSwgZWxlbWVudHMsIGV0Yy4uKSBpbnRvIHN0cmluZ3MsIHVzZWZ1bCBmb3JcbiAqIGRlYnVnZ2luZy5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyBhbHNvIGF2YWlsYWJsZSBvbiB3aW5kb3csIHdoZXJlIGl0IGNhbiBiZSB1c2VkIHRvIGRpc3BsYXkgb2JqZWN0cyBvbiBkZWJ1Z1xuICogY29uc29sZS5cbiAqXG4gKiBAcGFyYW0geyp9IG9iamVjdCAtIGFueSBvYmplY3QgdG8gdHVybiBpbnRvIHN0cmluZy5cbiAqIEByZXR1cm4ge3N0cmluZ30gYSBzZXJpYWxpemVkIHN0cmluZyBvZiB0aGUgYXJndW1lbnRcbiAqL1xuYW5ndWxhci5tb2NrLmR1bXAgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgcmV0dXJuIHNlcmlhbGl6ZShvYmplY3QpO1xuXG4gIGZ1bmN0aW9uIHNlcmlhbGl6ZShvYmplY3QpIHtcbiAgICB2YXIgb3V0O1xuXG4gICAgaWYgKGFuZ3VsYXIuaXNFbGVtZW50KG9iamVjdCkpIHtcbiAgICAgIG9iamVjdCA9IGFuZ3VsYXIuZWxlbWVudChvYmplY3QpO1xuICAgICAgb3V0ID0gYW5ndWxhci5lbGVtZW50KCc8ZGl2PjwvZGl2PicpO1xuICAgICAgYW5ndWxhci5mb3JFYWNoKG9iamVjdCwgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICBvdXQuYXBwZW5kKGFuZ3VsYXIuZWxlbWVudChlbGVtZW50KS5jbG9uZSgpKTtcbiAgICAgIH0pO1xuICAgICAgb3V0ID0gb3V0Lmh0bWwoKTtcbiAgICB9IGVsc2UgaWYgKGFuZ3VsYXIuaXNBcnJheShvYmplY3QpKSB7XG4gICAgICBvdXQgPSBbXTtcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChvYmplY3QsIGZ1bmN0aW9uKG8pIHtcbiAgICAgICAgb3V0LnB1c2goc2VyaWFsaXplKG8pKTtcbiAgICAgIH0pO1xuICAgICAgb3V0ID0gJ1sgJyArIG91dC5qb2luKCcsICcpICsgJyBdJztcbiAgICB9IGVsc2UgaWYgKGFuZ3VsYXIuaXNPYmplY3Qob2JqZWN0KSkge1xuICAgICAgaWYgKGFuZ3VsYXIuaXNGdW5jdGlvbihvYmplY3QuJGV2YWwpICYmIGFuZ3VsYXIuaXNGdW5jdGlvbihvYmplY3QuJGFwcGx5KSkge1xuICAgICAgICBvdXQgPSBzZXJpYWxpemVTY29wZShvYmplY3QpO1xuICAgICAgfSBlbHNlIGlmIChvYmplY3QgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICBvdXQgPSBvYmplY3Quc3RhY2sgfHwgKCcnICsgb2JqZWN0Lm5hbWUgKyAnOiAnICsgb2JqZWN0Lm1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVE9ETyhpKTogdGhpcyBwcmV2ZW50cyBtZXRob2RzIGJlaW5nIGxvZ2dlZCxcbiAgICAgICAgLy8gd2Ugc2hvdWxkIGhhdmUgYSBiZXR0ZXIgd2F5IHRvIHNlcmlhbGl6ZSBvYmplY3RzXG4gICAgICAgIG91dCA9IGFuZ3VsYXIudG9Kc29uKG9iamVjdCwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCA9IFN0cmluZyhvYmplY3QpO1xuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICBmdW5jdGlvbiBzZXJpYWxpemVTY29wZShzY29wZSwgb2Zmc2V0KSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0IHx8ICAnICAnO1xuICAgIHZhciBsb2cgPSBbb2Zmc2V0ICsgJ1Njb3BlKCcgKyBzY29wZS4kaWQgKyAnKTogeyddO1xuICAgIGZvciAodmFyIGtleSBpbiBzY29wZSkge1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzY29wZSwga2V5KSAmJiAha2V5Lm1hdGNoKC9eKFxcJHx0aGlzKS8pKSB7XG4gICAgICAgIGxvZy5wdXNoKCcgICcgKyBrZXkgKyAnOiAnICsgYW5ndWxhci50b0pzb24oc2NvcGVba2V5XSkpO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgY2hpbGQgPSBzY29wZS4kJGNoaWxkSGVhZDtcbiAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgIGxvZy5wdXNoKHNlcmlhbGl6ZVNjb3BlKGNoaWxkLCBvZmZzZXQgKyAnICAnKSk7XG4gICAgICBjaGlsZCA9IGNoaWxkLiQkbmV4dFNpYmxpbmc7XG4gICAgfVxuICAgIGxvZy5wdXNoKCd9Jyk7XG4gICAgcmV0dXJuIGxvZy5qb2luKCdcXG4nICsgb2Zmc2V0KTtcbiAgfVxufTtcblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgJGh0dHBCYWNrZW5kXG4gKiBAZGVzY3JpcHRpb25cbiAqIEZha2UgSFRUUCBiYWNrZW5kIGltcGxlbWVudGF0aW9uIHN1aXRhYmxlIGZvciB1bml0IHRlc3RpbmcgYXBwbGljYXRpb25zIHRoYXQgdXNlIHRoZVxuICoge0BsaW5rIG5nLiRodHRwICRodHRwIHNlcnZpY2V9LlxuICpcbiAqICpOb3RlKjogRm9yIGZha2UgSFRUUCBiYWNrZW5kIGltcGxlbWVudGF0aW9uIHN1aXRhYmxlIGZvciBlbmQtdG8tZW5kIHRlc3Rpbmcgb3IgYmFja2VuZC1sZXNzXG4gKiBkZXZlbG9wbWVudCBwbGVhc2Ugc2VlIHtAbGluayBuZ01vY2tFMkUuJGh0dHBCYWNrZW5kIGUyZSAkaHR0cEJhY2tlbmQgbW9ja30uXG4gKlxuICogRHVyaW5nIHVuaXQgdGVzdGluZywgd2Ugd2FudCBvdXIgdW5pdCB0ZXN0cyB0byBydW4gcXVpY2tseSBhbmQgaGF2ZSBubyBleHRlcm5hbCBkZXBlbmRlbmNpZXMgc29cbiAqIHdlIGRvbuKAmXQgd2FudCB0byBzZW5kIFtYSFJdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL3htbGh0dHByZXF1ZXN0KSBvclxuICogW0pTT05QXShodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0pTT05QKSByZXF1ZXN0cyB0byBhIHJlYWwgc2VydmVyLiBBbGwgd2UgcmVhbGx5IG5lZWQgaXNcbiAqIHRvIHZlcmlmeSB3aGV0aGVyIGEgY2VydGFpbiByZXF1ZXN0IGhhcyBiZWVuIHNlbnQgb3Igbm90LCBvciBhbHRlcm5hdGl2ZWx5IGp1c3QgbGV0IHRoZVxuICogYXBwbGljYXRpb24gbWFrZSByZXF1ZXN0cywgcmVzcG9uZCB3aXRoIHByZS10cmFpbmVkIHJlc3BvbnNlcyBhbmQgYXNzZXJ0IHRoYXQgdGhlIGVuZCByZXN1bHQgaXNcbiAqIHdoYXQgd2UgZXhwZWN0IGl0IHRvIGJlLlxuICpcbiAqIFRoaXMgbW9jayBpbXBsZW1lbnRhdGlvbiBjYW4gYmUgdXNlZCB0byByZXNwb25kIHdpdGggc3RhdGljIG9yIGR5bmFtaWMgcmVzcG9uc2VzIHZpYSB0aGVcbiAqIGBleHBlY3RgIGFuZCBgd2hlbmAgYXBpcyBhbmQgdGhlaXIgc2hvcnRjdXRzIChgZXhwZWN0R0VUYCwgYHdoZW5QT1NUYCwgZXRjKS5cbiAqXG4gKiBXaGVuIGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gbmVlZHMgc29tZSBkYXRhIGZyb20gYSBzZXJ2ZXIsIGl0IGNhbGxzIHRoZSAkaHR0cCBzZXJ2aWNlLCB3aGljaFxuICogc2VuZHMgdGhlIHJlcXVlc3QgdG8gYSByZWFsIHNlcnZlciB1c2luZyAkaHR0cEJhY2tlbmQgc2VydmljZS4gV2l0aCBkZXBlbmRlbmN5IGluamVjdGlvbiwgaXQgaXNcbiAqIGVhc3kgdG8gaW5qZWN0ICRodHRwQmFja2VuZCBtb2NrICh3aGljaCBoYXMgdGhlIHNhbWUgQVBJIGFzICRodHRwQmFja2VuZCkgYW5kIHVzZSBpdCB0byB2ZXJpZnlcbiAqIHRoZSByZXF1ZXN0cyBhbmQgcmVzcG9uZCB3aXRoIHNvbWUgdGVzdGluZyBkYXRhIHdpdGhvdXQgc2VuZGluZyBhIHJlcXVlc3QgdG8gYSByZWFsIHNlcnZlci5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHdheXMgdG8gc3BlY2lmeSB3aGF0IHRlc3QgZGF0YSBzaG91bGQgYmUgcmV0dXJuZWQgYXMgaHR0cCByZXNwb25zZXMgYnkgdGhlIG1vY2tcbiAqIGJhY2tlbmQgd2hlbiB0aGUgY29kZSB1bmRlciB0ZXN0IG1ha2VzIGh0dHAgcmVxdWVzdHM6XG4gKlxuICogLSBgJGh0dHBCYWNrZW5kLmV4cGVjdGAgLSBzcGVjaWZpZXMgYSByZXF1ZXN0IGV4cGVjdGF0aW9uXG4gKiAtIGAkaHR0cEJhY2tlbmQud2hlbmAgLSBzcGVjaWZpZXMgYSBiYWNrZW5kIGRlZmluaXRpb25cbiAqXG4gKlxuICogIyBSZXF1ZXN0IEV4cGVjdGF0aW9ucyB2cyBCYWNrZW5kIERlZmluaXRpb25zXG4gKlxuICogUmVxdWVzdCBleHBlY3RhdGlvbnMgcHJvdmlkZSBhIHdheSB0byBtYWtlIGFzc2VydGlvbnMgYWJvdXQgcmVxdWVzdHMgbWFkZSBieSB0aGUgYXBwbGljYXRpb24gYW5kXG4gKiB0byBkZWZpbmUgcmVzcG9uc2VzIGZvciB0aG9zZSByZXF1ZXN0cy4gVGhlIHRlc3Qgd2lsbCBmYWlsIGlmIHRoZSBleHBlY3RlZCByZXF1ZXN0cyBhcmUgbm90IG1hZGVcbiAqIG9yIHRoZXkgYXJlIG1hZGUgaW4gdGhlIHdyb25nIG9yZGVyLlxuICpcbiAqIEJhY2tlbmQgZGVmaW5pdGlvbnMgYWxsb3cgeW91IHRvIGRlZmluZSBhIGZha2UgYmFja2VuZCBmb3IgeW91ciBhcHBsaWNhdGlvbiB3aGljaCBkb2Vzbid0IGFzc2VydFxuICogaWYgYSBwYXJ0aWN1bGFyIHJlcXVlc3Qgd2FzIG1hZGUgb3Igbm90LCBpdCBqdXN0IHJldHVybnMgYSB0cmFpbmVkIHJlc3BvbnNlIGlmIGEgcmVxdWVzdCBpcyBtYWRlLlxuICogVGhlIHRlc3Qgd2lsbCBwYXNzIHdoZXRoZXIgb3Igbm90IHRoZSByZXF1ZXN0IGdldHMgbWFkZSBkdXJpbmcgdGVzdGluZy5cbiAqXG4gKlxuICogPHRhYmxlIGNsYXNzPVwidGFibGVcIj5cbiAqICAgPHRyPjx0aCB3aWR0aD1cIjIyMHB4XCI+PC90aD48dGg+UmVxdWVzdCBleHBlY3RhdGlvbnM8L3RoPjx0aD5CYWNrZW5kIGRlZmluaXRpb25zPC90aD48L3RyPlxuICogICA8dHI+XG4gKiAgICAgPHRoPlN5bnRheDwvdGg+XG4gKiAgICAgPHRkPi5leHBlY3QoLi4uKS5yZXNwb25kKC4uLik8L3RkPlxuICogICAgIDx0ZD4ud2hlbiguLi4pLnJlc3BvbmQoLi4uKTwvdGQ+XG4gKiAgIDwvdHI+XG4gKiAgIDx0cj5cbiAqICAgICA8dGg+VHlwaWNhbCB1c2FnZTwvdGg+XG4gKiAgICAgPHRkPnN0cmljdCB1bml0IHRlc3RzPC90ZD5cbiAqICAgICA8dGQ+bG9vc2UgKGJsYWNrLWJveCkgdW5pdCB0ZXN0aW5nPC90ZD5cbiAqICAgPC90cj5cbiAqICAgPHRyPlxuICogICAgIDx0aD5GdWxmaWxscyBtdWx0aXBsZSByZXF1ZXN0czwvdGg+XG4gKiAgICAgPHRkPk5PPC90ZD5cbiAqICAgICA8dGQ+WUVTPC90ZD5cbiAqICAgPC90cj5cbiAqICAgPHRyPlxuICogICAgIDx0aD5PcmRlciBvZiByZXF1ZXN0cyBtYXR0ZXJzPC90aD5cbiAqICAgICA8dGQ+WUVTPC90ZD5cbiAqICAgICA8dGQ+Tk88L3RkPlxuICogICA8L3RyPlxuICogICA8dHI+XG4gKiAgICAgPHRoPlJlcXVlc3QgcmVxdWlyZWQ8L3RoPlxuICogICAgIDx0ZD5ZRVM8L3RkPlxuICogICAgIDx0ZD5OTzwvdGQ+XG4gKiAgIDwvdHI+XG4gKiAgIDx0cj5cbiAqICAgICA8dGg+UmVzcG9uc2UgcmVxdWlyZWQ8L3RoPlxuICogICAgIDx0ZD5vcHRpb25hbCAoc2VlIGJlbG93KTwvdGQ+XG4gKiAgICAgPHRkPllFUzwvdGQ+XG4gKiAgIDwvdHI+XG4gKiA8L3RhYmxlPlxuICpcbiAqIEluIGNhc2VzIHdoZXJlIGJvdGggYmFja2VuZCBkZWZpbml0aW9ucyBhbmQgcmVxdWVzdCBleHBlY3RhdGlvbnMgYXJlIHNwZWNpZmllZCBkdXJpbmcgdW5pdFxuICogdGVzdGluZywgdGhlIHJlcXVlc3QgZXhwZWN0YXRpb25zIGFyZSBldmFsdWF0ZWQgZmlyc3QuXG4gKlxuICogSWYgYSByZXF1ZXN0IGV4cGVjdGF0aW9uIGhhcyBubyByZXNwb25zZSBzcGVjaWZpZWQsIHRoZSBhbGdvcml0aG0gd2lsbCBzZWFyY2ggeW91ciBiYWNrZW5kXG4gKiBkZWZpbml0aW9ucyBmb3IgYW4gYXBwcm9wcmlhdGUgcmVzcG9uc2UuXG4gKlxuICogSWYgYSByZXF1ZXN0IGRpZG4ndCBtYXRjaCBhbnkgZXhwZWN0YXRpb24gb3IgaWYgdGhlIGV4cGVjdGF0aW9uIGRvZXNuJ3QgaGF2ZSB0aGUgcmVzcG9uc2VcbiAqIGRlZmluZWQsIHRoZSBiYWNrZW5kIGRlZmluaXRpb25zIGFyZSBldmFsdWF0ZWQgaW4gc2VxdWVudGlhbCBvcmRlciB0byBzZWUgaWYgYW55IG9mIHRoZW0gbWF0Y2hcbiAqIHRoZSByZXF1ZXN0LiBUaGUgcmVzcG9uc2UgZnJvbSB0aGUgZmlyc3QgbWF0Y2hlZCBkZWZpbml0aW9uIGlzIHJldHVybmVkLlxuICpcbiAqXG4gKiAjIEZsdXNoaW5nIEhUVFAgcmVxdWVzdHNcbiAqXG4gKiBUaGUgJGh0dHBCYWNrZW5kIHVzZWQgaW4gcHJvZHVjdGlvbiBhbHdheXMgcmVzcG9uZHMgdG8gcmVxdWVzdHMgYXN5bmNocm9ub3VzbHkuIElmIHdlIHByZXNlcnZlZFxuICogdGhpcyBiZWhhdmlvciBpbiB1bml0IHRlc3RpbmcsIHdlJ2QgaGF2ZSB0byBjcmVhdGUgYXN5bmMgdW5pdCB0ZXN0cywgd2hpY2ggYXJlIGhhcmQgdG8gd3JpdGUsXG4gKiB0byBmb2xsb3cgYW5kIHRvIG1haW50YWluLiBCdXQgbmVpdGhlciBjYW4gdGhlIHRlc3RpbmcgbW9jayByZXNwb25kIHN5bmNocm9ub3VzbHk7IHRoYXQgd291bGRcbiAqIGNoYW5nZSB0aGUgZXhlY3V0aW9uIG9mIHRoZSBjb2RlIHVuZGVyIHRlc3QuIEZvciB0aGlzIHJlYXNvbiwgdGhlIG1vY2sgJGh0dHBCYWNrZW5kIGhhcyBhXG4gKiBgZmx1c2goKWAgbWV0aG9kLCB3aGljaCBhbGxvd3MgdGhlIHRlc3QgdG8gZXhwbGljaXRseSBmbHVzaCBwZW5kaW5nIHJlcXVlc3RzLiBUaGlzIHByZXNlcnZlc1xuICogdGhlIGFzeW5jIGFwaSBvZiB0aGUgYmFja2VuZCwgd2hpbGUgYWxsb3dpbmcgdGhlIHRlc3QgdG8gZXhlY3V0ZSBzeW5jaHJvbm91c2x5LlxuICpcbiAqXG4gKiAjIFVuaXQgdGVzdGluZyB3aXRoIG1vY2sgJGh0dHBCYWNrZW5kXG4gKiBUaGUgZm9sbG93aW5nIGNvZGUgc2hvd3MgaG93IHRvIHNldHVwIGFuZCB1c2UgdGhlIG1vY2sgYmFja2VuZCB3aGVuIHVuaXQgdGVzdGluZyBhIGNvbnRyb2xsZXIuXG4gKiBGaXJzdCB3ZSBjcmVhdGUgdGhlIGNvbnRyb2xsZXIgdW5kZXIgdGVzdDpcbiAqXG4gIGBgYGpzXG4gIC8vIFRoZSBtb2R1bGUgY29kZVxuICBhbmd1bGFyXG4gICAgLm1vZHVsZSgnTXlBcHAnLCBbXSlcbiAgICAuY29udHJvbGxlcignTXlDb250cm9sbGVyJywgTXlDb250cm9sbGVyKTtcblxuICAvLyBUaGUgY29udHJvbGxlciBjb2RlXG4gIGZ1bmN0aW9uIE15Q29udHJvbGxlcigkc2NvcGUsICRodHRwKSB7XG4gICAgdmFyIGF1dGhUb2tlbjtcblxuICAgICRodHRwLmdldCgnL2F1dGgucHknKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEsIHN0YXR1cywgaGVhZGVycykge1xuICAgICAgYXV0aFRva2VuID0gaGVhZGVycygnQS1Ub2tlbicpO1xuICAgICAgJHNjb3BlLnVzZXIgPSBkYXRhO1xuICAgIH0pO1xuXG4gICAgJHNjb3BlLnNhdmVNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgdmFyIGhlYWRlcnMgPSB7ICdBdXRob3JpemF0aW9uJzogYXV0aFRva2VuIH07XG4gICAgICAkc2NvcGUuc3RhdHVzID0gJ1NhdmluZy4uLic7XG5cbiAgICAgICRodHRwLnBvc3QoJy9hZGQtbXNnLnB5JywgbWVzc2FnZSwgeyBoZWFkZXJzOiBoZWFkZXJzIH0gKS5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICRzY29wZS5zdGF0dXMgPSAnJztcbiAgICAgIH0pLmVycm9yKGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUuc3RhdHVzID0gJ0VSUk9SISc7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG4gIGBgYFxuICpcbiAqIE5vdyB3ZSBzZXR1cCB0aGUgbW9jayBiYWNrZW5kIGFuZCBjcmVhdGUgdGhlIHRlc3Qgc3BlY3M6XG4gKlxuICBgYGBqc1xuICAgIC8vIHRlc3RpbmcgY29udHJvbGxlclxuICAgIGRlc2NyaWJlKCdNeUNvbnRyb2xsZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICB2YXIgJGh0dHBCYWNrZW5kLCAkcm9vdFNjb3BlLCBjcmVhdGVDb250cm9sbGVyLCBhdXRoUmVxdWVzdEhhbmRsZXI7XG5cbiAgICAgICAvLyBTZXQgdXAgdGhlIG1vZHVsZVxuICAgICAgIGJlZm9yZUVhY2gobW9kdWxlKCdNeUFwcCcpKTtcblxuICAgICAgIGJlZm9yZUVhY2goaW5qZWN0KGZ1bmN0aW9uKCRpbmplY3Rvcikge1xuICAgICAgICAgLy8gU2V0IHVwIHRoZSBtb2NrIGh0dHAgc2VydmljZSByZXNwb25zZXNcbiAgICAgICAgICRodHRwQmFja2VuZCA9ICRpbmplY3Rvci5nZXQoJyRodHRwQmFja2VuZCcpO1xuICAgICAgICAgLy8gYmFja2VuZCBkZWZpbml0aW9uIGNvbW1vbiBmb3IgYWxsIHRlc3RzXG4gICAgICAgICBhdXRoUmVxdWVzdEhhbmRsZXIgPSAkaHR0cEJhY2tlbmQud2hlbignR0VUJywgJy9hdXRoLnB5JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlc3BvbmQoe3VzZXJJZDogJ3VzZXJYJ30sIHsnQS1Ub2tlbic6ICd4eHgnfSk7XG5cbiAgICAgICAgIC8vIEdldCBob2xkIG9mIGEgc2NvcGUgKGkuZS4gdGhlIHJvb3Qgc2NvcGUpXG4gICAgICAgICAkcm9vdFNjb3BlID0gJGluamVjdG9yLmdldCgnJHJvb3RTY29wZScpO1xuICAgICAgICAgLy8gVGhlICRjb250cm9sbGVyIHNlcnZpY2UgaXMgdXNlZCB0byBjcmVhdGUgaW5zdGFuY2VzIG9mIGNvbnRyb2xsZXJzXG4gICAgICAgICB2YXIgJGNvbnRyb2xsZXIgPSAkaW5qZWN0b3IuZ2V0KCckY29udHJvbGxlcicpO1xuXG4gICAgICAgICBjcmVhdGVDb250cm9sbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgIHJldHVybiAkY29udHJvbGxlcignTXlDb250cm9sbGVyJywgeyckc2NvcGUnIDogJHJvb3RTY29wZSB9KTtcbiAgICAgICAgIH07XG4gICAgICAgfSkpO1xuXG5cbiAgICAgICBhZnRlckVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAkaHR0cEJhY2tlbmQudmVyaWZ5Tm9PdXRzdGFuZGluZ0V4cGVjdGF0aW9uKCk7XG4gICAgICAgICAkaHR0cEJhY2tlbmQudmVyaWZ5Tm9PdXRzdGFuZGluZ1JlcXVlc3QoKTtcbiAgICAgICB9KTtcblxuXG4gICAgICAgaXQoJ3Nob3VsZCBmZXRjaCBhdXRoZW50aWNhdGlvbiB0b2tlbicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgJGh0dHBCYWNrZW5kLmV4cGVjdEdFVCgnL2F1dGgucHknKTtcbiAgICAgICAgIHZhciBjb250cm9sbGVyID0gY3JlYXRlQ29udHJvbGxlcigpO1xuICAgICAgICAgJGh0dHBCYWNrZW5kLmZsdXNoKCk7XG4gICAgICAgfSk7XG5cblxuICAgICAgIGl0KCdzaG91bGQgZmFpbCBhdXRoZW50aWNhdGlvbicsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAvLyBOb3RpY2UgaG93IHlvdSBjYW4gY2hhbmdlIHRoZSByZXNwb25zZSBldmVuIGFmdGVyIGl0IHdhcyBzZXRcbiAgICAgICAgIGF1dGhSZXF1ZXN0SGFuZGxlci5yZXNwb25kKDQwMSwgJycpO1xuXG4gICAgICAgICAkaHR0cEJhY2tlbmQuZXhwZWN0R0VUKCcvYXV0aC5weScpO1xuICAgICAgICAgdmFyIGNvbnRyb2xsZXIgPSBjcmVhdGVDb250cm9sbGVyKCk7XG4gICAgICAgICAkaHR0cEJhY2tlbmQuZmx1c2goKTtcbiAgICAgICAgIGV4cGVjdCgkcm9vdFNjb3BlLnN0YXR1cykudG9CZSgnRmFpbGVkLi4uJyk7XG4gICAgICAgfSk7XG5cblxuICAgICAgIGl0KCdzaG91bGQgc2VuZCBtc2cgdG8gc2VydmVyJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICB2YXIgY29udHJvbGxlciA9IGNyZWF0ZUNvbnRyb2xsZXIoKTtcbiAgICAgICAgICRodHRwQmFja2VuZC5mbHVzaCgpO1xuXG4gICAgICAgICAvLyBub3cgeW91IGRvbuKAmXQgY2FyZSBhYm91dCB0aGUgYXV0aGVudGljYXRpb24sIGJ1dFxuICAgICAgICAgLy8gdGhlIGNvbnRyb2xsZXIgd2lsbCBzdGlsbCBzZW5kIHRoZSByZXF1ZXN0IGFuZFxuICAgICAgICAgLy8gJGh0dHBCYWNrZW5kIHdpbGwgcmVzcG9uZCB3aXRob3V0IHlvdSBoYXZpbmcgdG9cbiAgICAgICAgIC8vIHNwZWNpZnkgdGhlIGV4cGVjdGF0aW9uIGFuZCByZXNwb25zZSBmb3IgdGhpcyByZXF1ZXN0XG5cbiAgICAgICAgICRodHRwQmFja2VuZC5leHBlY3RQT1NUKCcvYWRkLW1zZy5weScsICdtZXNzYWdlIGNvbnRlbnQnKS5yZXNwb25kKDIwMSwgJycpO1xuICAgICAgICAgJHJvb3RTY29wZS5zYXZlTWVzc2FnZSgnbWVzc2FnZSBjb250ZW50Jyk7XG4gICAgICAgICBleHBlY3QoJHJvb3RTY29wZS5zdGF0dXMpLnRvQmUoJ1NhdmluZy4uLicpO1xuICAgICAgICAgJGh0dHBCYWNrZW5kLmZsdXNoKCk7XG4gICAgICAgICBleHBlY3QoJHJvb3RTY29wZS5zdGF0dXMpLnRvQmUoJycpO1xuICAgICAgIH0pO1xuXG5cbiAgICAgICBpdCgnc2hvdWxkIHNlbmQgYXV0aCBoZWFkZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgIHZhciBjb250cm9sbGVyID0gY3JlYXRlQ29udHJvbGxlcigpO1xuICAgICAgICAgJGh0dHBCYWNrZW5kLmZsdXNoKCk7XG5cbiAgICAgICAgICRodHRwQmFja2VuZC5leHBlY3RQT1NUKCcvYWRkLW1zZy5weScsIHVuZGVmaW5lZCwgZnVuY3Rpb24oaGVhZGVycykge1xuICAgICAgICAgICAvLyBjaGVjayBpZiB0aGUgaGVhZGVyIHdhcyBzZW5kLCBpZiBpdCB3YXNuJ3QgdGhlIGV4cGVjdGF0aW9uIHdvbid0XG4gICAgICAgICAgIC8vIG1hdGNoIHRoZSByZXF1ZXN0IGFuZCB0aGUgdGVzdCB3aWxsIGZhaWxcbiAgICAgICAgICAgcmV0dXJuIGhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9PSAneHh4JztcbiAgICAgICAgIH0pLnJlc3BvbmQoMjAxLCAnJyk7XG5cbiAgICAgICAgICRyb290U2NvcGUuc2F2ZU1lc3NhZ2UoJ3doYXRldmVyJyk7XG4gICAgICAgICAkaHR0cEJhY2tlbmQuZmx1c2goKTtcbiAgICAgICB9KTtcbiAgICB9KTtcbiAgIGBgYFxuICovXG5hbmd1bGFyLm1vY2suJEh0dHBCYWNrZW5kUHJvdmlkZXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy4kZ2V0ID0gWyckcm9vdFNjb3BlJywgJyR0aW1lb3V0JywgY3JlYXRlSHR0cEJhY2tlbmRNb2NrXTtcbn07XG5cbi8qKlxuICogR2VuZXJhbCBmYWN0b3J5IGZ1bmN0aW9uIGZvciAkaHR0cEJhY2tlbmQgbW9jay5cbiAqIFJldHVybnMgaW5zdGFuY2UgZm9yIHVuaXQgdGVzdGluZyAod2hlbiBubyBhcmd1bWVudHMgc3BlY2lmaWVkKTpcbiAqICAgLSBwYXNzaW5nIHRocm91Z2ggaXMgZGlzYWJsZWRcbiAqICAgLSBhdXRvIGZsdXNoaW5nIGlzIGRpc2FibGVkXG4gKlxuICogUmV0dXJucyBpbnN0YW5jZSBmb3IgZTJlIHRlc3RpbmcgKHdoZW4gYCRkZWxlZ2F0ZWAgYW5kIGAkYnJvd3NlcmAgc3BlY2lmaWVkKTpcbiAqICAgLSBwYXNzaW5nIHRocm91Z2ggKGRlbGVnYXRpbmcgcmVxdWVzdCB0byByZWFsIGJhY2tlbmQpIGlzIGVuYWJsZWRcbiAqICAgLSBhdXRvIGZsdXNoaW5nIGlzIGVuYWJsZWRcbiAqXG4gKiBAcGFyYW0ge09iamVjdD19ICRkZWxlZ2F0ZSBSZWFsICRodHRwQmFja2VuZCBpbnN0YW5jZSAoYWxsb3cgcGFzc2luZyB0aHJvdWdoIGlmIHNwZWNpZmllZClcbiAqIEBwYXJhbSB7T2JqZWN0PX0gJGJyb3dzZXIgQXV0by1mbHVzaGluZyBlbmFibGVkIGlmIHNwZWNpZmllZFxuICogQHJldHVybiB7T2JqZWN0fSBJbnN0YW5jZSBvZiAkaHR0cEJhY2tlbmQgbW9ja1xuICovXG5mdW5jdGlvbiBjcmVhdGVIdHRwQmFja2VuZE1vY2soJHJvb3RTY29wZSwgJHRpbWVvdXQsICRkZWxlZ2F0ZSwgJGJyb3dzZXIpIHtcbiAgdmFyIGRlZmluaXRpb25zID0gW10sXG4gICAgICBleHBlY3RhdGlvbnMgPSBbXSxcbiAgICAgIHJlc3BvbnNlcyA9IFtdLFxuICAgICAgcmVzcG9uc2VzUHVzaCA9IGFuZ3VsYXIuYmluZChyZXNwb25zZXMsIHJlc3BvbnNlcy5wdXNoKSxcbiAgICAgIGNvcHkgPSBhbmd1bGFyLmNvcHk7XG5cbiAgZnVuY3Rpb24gY3JlYXRlUmVzcG9uc2Uoc3RhdHVzLCBkYXRhLCBoZWFkZXJzLCBzdGF0dXNUZXh0KSB7XG4gICAgaWYgKGFuZ3VsYXIuaXNGdW5jdGlvbihzdGF0dXMpKSByZXR1cm4gc3RhdHVzO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGFuZ3VsYXIuaXNOdW1iZXIoc3RhdHVzKVxuICAgICAgICAgID8gW3N0YXR1cywgZGF0YSwgaGVhZGVycywgc3RhdHVzVGV4dF1cbiAgICAgICAgICA6IFsyMDAsIHN0YXR1cywgZGF0YSwgaGVhZGVyc107XG4gICAgfTtcbiAgfVxuXG4gIC8vIFRPRE8odm9qdGEpOiBjaGFuZ2UgcGFyYW1zIHRvOiBtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycywgY2FsbGJhY2tcbiAgZnVuY3Rpb24gJGh0dHBCYWNrZW5kKG1ldGhvZCwgdXJsLCBkYXRhLCBjYWxsYmFjaywgaGVhZGVycywgdGltZW91dCwgd2l0aENyZWRlbnRpYWxzKSB7XG4gICAgdmFyIHhociA9IG5ldyBNb2NrWGhyKCksXG4gICAgICAgIGV4cGVjdGF0aW9uID0gZXhwZWN0YXRpb25zWzBdLFxuICAgICAgICB3YXNFeHBlY3RlZCA9IGZhbHNlO1xuXG4gICAgZnVuY3Rpb24gcHJldHR5UHJpbnQoZGF0YSkge1xuICAgICAgcmV0dXJuIChhbmd1bGFyLmlzU3RyaW5nKGRhdGEpIHx8IGFuZ3VsYXIuaXNGdW5jdGlvbihkYXRhKSB8fCBkYXRhIGluc3RhbmNlb2YgUmVnRXhwKVxuICAgICAgICAgID8gZGF0YVxuICAgICAgICAgIDogYW5ndWxhci50b0pzb24oZGF0YSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd3JhcFJlc3BvbnNlKHdyYXBwZWQpIHtcbiAgICAgIGlmICghJGJyb3dzZXIgJiYgdGltZW91dCkge1xuICAgICAgICB0aW1lb3V0LnRoZW4gPyB0aW1lb3V0LnRoZW4oaGFuZGxlVGltZW91dCkgOiAkdGltZW91dChoYW5kbGVUaW1lb3V0LCB0aW1lb3V0KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGhhbmRsZVJlc3BvbnNlO1xuXG4gICAgICBmdW5jdGlvbiBoYW5kbGVSZXNwb25zZSgpIHtcbiAgICAgICAgdmFyIHJlc3BvbnNlID0gd3JhcHBlZC5yZXNwb25zZShtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycyk7XG4gICAgICAgIHhoci4kJHJlc3BIZWFkZXJzID0gcmVzcG9uc2VbMl07XG4gICAgICAgIGNhbGxiYWNrKGNvcHkocmVzcG9uc2VbMF0pLCBjb3B5KHJlc3BvbnNlWzFdKSwgeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpLFxuICAgICAgICAgICAgICAgICBjb3B5KHJlc3BvbnNlWzNdIHx8ICcnKSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGhhbmRsZVRpbWVvdXQoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHJlc3BvbnNlcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgaWYgKHJlc3BvbnNlc1tpXSA9PT0gaGFuZGxlUmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJlc3BvbnNlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBjYWxsYmFjaygtMSwgdW5kZWZpbmVkLCAnJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXhwZWN0YXRpb24gJiYgZXhwZWN0YXRpb24ubWF0Y2gobWV0aG9kLCB1cmwpKSB7XG4gICAgICBpZiAoIWV4cGVjdGF0aW9uLm1hdGNoRGF0YShkYXRhKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCAnICsgZXhwZWN0YXRpb24gKyAnIHdpdGggZGlmZmVyZW50IGRhdGFcXG4nICtcbiAgICAgICAgICAgICdFWFBFQ1RFRDogJyArIHByZXR0eVByaW50KGV4cGVjdGF0aW9uLmRhdGEpICsgJ1xcbkdPVDogICAgICAnICsgZGF0YSk7XG5cbiAgICAgIGlmICghZXhwZWN0YXRpb24ubWF0Y2hIZWFkZXJzKGhlYWRlcnMpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkICcgKyBleHBlY3RhdGlvbiArICcgd2l0aCBkaWZmZXJlbnQgaGVhZGVyc1xcbicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ0VYUEVDVEVEOiAnICsgcHJldHR5UHJpbnQoZXhwZWN0YXRpb24uaGVhZGVycykgKyAnXFxuR09UOiAgICAgICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldHR5UHJpbnQoaGVhZGVycykpO1xuXG4gICAgICBleHBlY3RhdGlvbnMuc2hpZnQoKTtcblxuICAgICAgaWYgKGV4cGVjdGF0aW9uLnJlc3BvbnNlKSB7XG4gICAgICAgIHJlc3BvbnNlcy5wdXNoKHdyYXBSZXNwb25zZShleHBlY3RhdGlvbikpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB3YXNFeHBlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIGkgPSAtMSwgZGVmaW5pdGlvbjtcbiAgICB3aGlsZSAoKGRlZmluaXRpb24gPSBkZWZpbml0aW9uc1srK2ldKSkge1xuICAgICAgaWYgKGRlZmluaXRpb24ubWF0Y2gobWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMgfHwge30pKSB7XG4gICAgICAgIGlmIChkZWZpbml0aW9uLnJlc3BvbnNlKSB7XG4gICAgICAgICAgLy8gaWYgJGJyb3dzZXIgc3BlY2lmaWVkLCB3ZSBkbyBhdXRvIGZsdXNoIGFsbCByZXF1ZXN0c1xuICAgICAgICAgICgkYnJvd3NlciA/ICRicm93c2VyLmRlZmVyIDogcmVzcG9uc2VzUHVzaCkod3JhcFJlc3BvbnNlKGRlZmluaXRpb24pKTtcbiAgICAgICAgfSBlbHNlIGlmIChkZWZpbml0aW9uLnBhc3NUaHJvdWdoKSB7XG4gICAgICAgICAgJGRlbGVnYXRlKG1ldGhvZCwgdXJsLCBkYXRhLCBjYWxsYmFjaywgaGVhZGVycywgdGltZW91dCwgd2l0aENyZWRlbnRpYWxzKTtcbiAgICAgICAgfSBlbHNlIHRocm93IG5ldyBFcnJvcignTm8gcmVzcG9uc2UgZGVmaW5lZCAhJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgd2FzRXhwZWN0ZWQgP1xuICAgICAgICBuZXcgRXJyb3IoJ05vIHJlc3BvbnNlIGRlZmluZWQgIScpIDpcbiAgICAgICAgbmV3IEVycm9yKCdVbmV4cGVjdGVkIHJlcXVlc3Q6ICcgKyBtZXRob2QgKyAnICcgKyB1cmwgKyAnXFxuJyArXG4gICAgICAgICAgICAgICAgICAoZXhwZWN0YXRpb24gPyAnRXhwZWN0ZWQgJyArIGV4cGVjdGF0aW9uIDogJ05vIG1vcmUgcmVxdWVzdCBleHBlY3RlZCcpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCN3aGVuXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCBIVFRQIG1ldGhvZC5cbiAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIHRoZSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2ggdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpKT19IGRhdGEgSFRUUCByZXF1ZXN0IGJvZHkgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlc1xuICAgKiAgIGRhdGEgc3RyaW5nIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGRhdGEgaXMgYXMgZXhwZWN0ZWQuXG4gICAqIEBwYXJhbSB7KE9iamVjdHxmdW5jdGlvbihPYmplY3QpKT19IGhlYWRlcnMgSFRUUCBoZWFkZXJzIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgaHR0cCBoZWFkZXJcbiAgICogICBvYmplY3QgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgaGVhZGVycyBtYXRjaCB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogICByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2UgYHJlc3BvbmRgIGFnYWluIGluXG4gICAqICAgb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKlxuICAgKiAgLSByZXNwb25kIOKAk1xuICAgKiAgICAgIGB7ZnVuY3Rpb24oW3N0YXR1cyxdIGRhdGFbLCBoZWFkZXJzLCBzdGF0dXNUZXh0XSlcbiAgICogICAgICB8IGZ1bmN0aW9uKGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzKX1gXG4gICAqICAgIOKAkyBUaGUgcmVzcG9uZCBtZXRob2QgdGFrZXMgYSBzZXQgb2Ygc3RhdGljIGRhdGEgdG8gYmUgcmV0dXJuZWQgb3IgYSBmdW5jdGlvbiB0aGF0IGNhblxuICAgKiAgICByZXR1cm4gYW4gYXJyYXkgY29udGFpbmluZyByZXNwb25zZSBzdGF0dXMgKG51bWJlciksIHJlc3BvbnNlIGRhdGEgKHN0cmluZyksIHJlc3BvbnNlXG4gICAqICAgIGhlYWRlcnMgKE9iamVjdCksIGFuZCB0aGUgdGV4dCBmb3IgdGhlIHN0YXR1cyAoc3RyaW5nKS4gVGhlIHJlc3BvbmQgbWV0aG9kIHJldHVybnMgdGhlXG4gICAqICAgIGByZXF1ZXN0SGFuZGxlcmAgb2JqZWN0IGZvciBwb3NzaWJsZSBvdmVycmlkZXMuXG4gICAqL1xuICAkaHR0cEJhY2tlbmQud2hlbiA9IGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzKSB7XG4gICAgdmFyIGRlZmluaXRpb24gPSBuZXcgTW9ja0h0dHBFeHBlY3RhdGlvbihtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycyksXG4gICAgICAgIGNoYWluID0ge1xuICAgICAgICAgIHJlc3BvbmQ6IGZ1bmN0aW9uKHN0YXR1cywgZGF0YSwgaGVhZGVycywgc3RhdHVzVGV4dCkge1xuICAgICAgICAgICAgZGVmaW5pdGlvbi5wYXNzVGhyb3VnaCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGRlZmluaXRpb24ucmVzcG9uc2UgPSBjcmVhdGVSZXNwb25zZShzdGF0dXMsIGRhdGEsIGhlYWRlcnMsIHN0YXR1c1RleHQpO1xuICAgICAgICAgICAgcmV0dXJuIGNoYWluO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgIGlmICgkYnJvd3Nlcikge1xuICAgICAgY2hhaW4ucGFzc1Rocm91Z2ggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZGVmaW5pdGlvbi5yZXNwb25zZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgZGVmaW5pdGlvbi5wYXNzVGhyb3VnaCA9IHRydWU7XG4gICAgICAgIHJldHVybiBjaGFpbjtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZGVmaW5pdGlvbnMucHVzaChkZWZpbml0aW9uKTtcbiAgICByZXR1cm4gY2hhaW47XG4gIH07XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBtZXRob2RcbiAgICogQG5hbWUgJGh0dHBCYWNrZW5kI3doZW5HRVRcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBHRVQgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGB3aGVuKClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgdGhlIHVybFxuICAgKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaCB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycy5cbiAgICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBtZXRob2QgdGhhdCBjb250cm9scyBob3cgYSBtYXRjaGVkXG4gICAqIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlbkhFQURcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBIRUFEIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgd2hlbigpYC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIHRoZSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2ggdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIHsoT2JqZWN0fGZ1bmN0aW9uKE9iamVjdCkpPX0gaGVhZGVycyBIVFRQIGhlYWRlcnMuXG4gICAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgbWV0aG9kIHRoYXQgY29udHJvbHMgaG93IGEgbWF0Y2hlZFxuICAgKiByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2UgYHJlc3BvbmRgIGFnYWluIGluXG4gICAqIG9yZGVyIHRvIGNoYW5nZSBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBtZXRob2RcbiAgICogQG5hbWUgJGh0dHBCYWNrZW5kI3doZW5ERUxFVEVcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBERUxFVEUgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGB3aGVuKClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgdGhlIHVybFxuICAgKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaCB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycy5cbiAgICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBtZXRob2QgdGhhdCBjb250cm9scyBob3cgYSBtYXRjaGVkXG4gICAqIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlblBPU1RcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBQT1NUIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgd2hlbigpYC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIHRoZSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2ggdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpKT19IGRhdGEgSFRUUCByZXF1ZXN0IGJvZHkgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlc1xuICAgKiAgIGRhdGEgc3RyaW5nIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGRhdGEgaXMgYXMgZXhwZWN0ZWQuXG4gICAqIEBwYXJhbSB7KE9iamVjdHxmdW5jdGlvbihPYmplY3QpKT19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlIGByZXNwb25kYCBhZ2FpbiBpblxuICAgKiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCN3aGVuUFVUXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbiBmb3IgUFVUIHJlcXVlc3RzLiAgRm9yIG1vcmUgaW5mbyBzZWUgYHdoZW4oKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyB0aGUgdXJsXG4gICAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoIHRoZSBjdXJyZW50IGRlZmluaXRpb24uXG4gICAqIEBwYXJhbSB7KHN0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKSk9fSBkYXRhIEhUVFAgcmVxdWVzdCBib2R5IG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXNcbiAgICogICBkYXRhIHN0cmluZyBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSBkYXRhIGlzIGFzIGV4cGVjdGVkLlxuICAgKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycy5cbiAgICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBtZXRob2QgdGhhdCBjb250cm9scyBob3cgYSBtYXRjaGVkXG4gICAqIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlbkpTT05QXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbiBmb3IgSlNPTlAgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGB3aGVuKClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgdGhlIHVybFxuICAgKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaCB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlIGByZXNwb25kYCBhZ2FpbiBpblxuICAgKiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gICAqL1xuICBjcmVhdGVTaG9ydE1ldGhvZHMoJ3doZW4nKTtcblxuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCBleHBlY3RhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCBIVFRQIG1ldGhvZC5cbiAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIHRoZSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2ggdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfE9iamVjdCk9fSBkYXRhIEhUVFAgcmVxdWVzdCBib2R5IG9yIGZ1bmN0aW9uIHRoYXRcbiAgICogIHJlY2VpdmVzIGRhdGEgc3RyaW5nIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGRhdGEgaXMgYXMgZXhwZWN0ZWQsIG9yIE9iamVjdCBpZiByZXF1ZXN0IGJvZHlcbiAgICogIGlzIGluIEpTT04gZm9ybWF0LlxuICAgKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycyBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGh0dHAgaGVhZGVyXG4gICAqICAgb2JqZWN0IGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGhlYWRlcnMgbWF0Y2ggdGhlIGN1cnJlbnQgZXhwZWN0YXRpb24uXG4gICAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgbWV0aG9kIHRoYXQgY29udHJvbHMgaG93IGEgbWF0Y2hlZFxuICAgKiAgcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlIGByZXNwb25kYCBhZ2FpbiBpblxuICAgKiAgb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKlxuICAgKiAgLSByZXNwb25kIOKAk1xuICAgKiAgICBge2Z1bmN0aW9uKFtzdGF0dXMsXSBkYXRhWywgaGVhZGVycywgc3RhdHVzVGV4dF0pXG4gICAqICAgIHwgZnVuY3Rpb24oZnVuY3Rpb24obWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMpfWBcbiAgICogICAg4oCTIFRoZSByZXNwb25kIG1ldGhvZCB0YWtlcyBhIHNldCBvZiBzdGF0aWMgZGF0YSB0byBiZSByZXR1cm5lZCBvciBhIGZ1bmN0aW9uIHRoYXQgY2FuXG4gICAqICAgIHJldHVybiBhbiBhcnJheSBjb250YWluaW5nIHJlc3BvbnNlIHN0YXR1cyAobnVtYmVyKSwgcmVzcG9uc2UgZGF0YSAoc3RyaW5nKSwgcmVzcG9uc2VcbiAgICogICAgaGVhZGVycyAoT2JqZWN0KSwgYW5kIHRoZSB0ZXh0IGZvciB0aGUgc3RhdHVzIChzdHJpbmcpLiBUaGUgcmVzcG9uZCBtZXRob2QgcmV0dXJucyB0aGVcbiAgICogICAgYHJlcXVlc3RIYW5kbGVyYCBvYmplY3QgZm9yIHBvc3NpYmxlIG92ZXJyaWRlcy5cbiAgICovXG4gICRodHRwQmFja2VuZC5leHBlY3QgPSBmdW5jdGlvbihtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycykge1xuICAgIHZhciBleHBlY3RhdGlvbiA9IG5ldyBNb2NrSHR0cEV4cGVjdGF0aW9uKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzKSxcbiAgICAgICAgY2hhaW4gPSB7XG4gICAgICAgICAgcmVzcG9uZDogZnVuY3Rpb24oc3RhdHVzLCBkYXRhLCBoZWFkZXJzLCBzdGF0dXNUZXh0KSB7XG4gICAgICAgICAgICBleHBlY3RhdGlvbi5yZXNwb25zZSA9IGNyZWF0ZVJlc3BvbnNlKHN0YXR1cywgZGF0YSwgaGVhZGVycywgc3RhdHVzVGV4dCk7XG4gICAgICAgICAgICByZXR1cm4gY2hhaW47XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgZXhwZWN0YXRpb25zLnB1c2goZXhwZWN0YXRpb24pO1xuICAgIHJldHVybiBjaGFpbjtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RHRVRcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCBleHBlY3RhdGlvbiBmb3IgR0VUIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgZXhwZWN0KClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgdGhlIHVybFxuICAgKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaCB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0ge09iamVjdD19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlIGByZXNwb25kYCBhZ2FpbiBpblxuICAgKiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuIFNlZSAjZXhwZWN0IGZvciBtb3JlIGluZm8uXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RIRUFEXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBDcmVhdGVzIGEgbmV3IHJlcXVlc3QgZXhwZWN0YXRpb24gZm9yIEhFQUQgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGBleHBlY3QoKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyB0aGUgdXJsXG4gICAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoIHRoZSBjdXJyZW50IGRlZmluaXRpb24uXG4gICAqIEBwYXJhbSB7T2JqZWN0PX0gaGVhZGVycyBIVFRQIGhlYWRlcnMuXG4gICAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgbWV0aG9kIHRoYXQgY29udHJvbHMgaG93IGEgbWF0Y2hlZFxuICAgKiAgIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogICBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RERUxFVEVcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCBleHBlY3RhdGlvbiBmb3IgREVMRVRFIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgZXhwZWN0KClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgdGhlIHVybFxuICAgKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaCB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0ge09iamVjdD19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogICByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2UgYHJlc3BvbmRgIGFnYWluIGluXG4gICAqICAgb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjZXhwZWN0UE9TVFxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQ3JlYXRlcyBhIG5ldyByZXF1ZXN0IGV4cGVjdGF0aW9uIGZvciBQT1NUIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgZXhwZWN0KClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgdGhlIHVybFxuICAgKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaCB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0geyhzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl8T2JqZWN0KT19IGRhdGEgSFRUUCByZXF1ZXN0IGJvZHkgb3IgZnVuY3Rpb24gdGhhdFxuICAgKiAgcmVjZWl2ZXMgZGF0YSBzdHJpbmcgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgZGF0YSBpcyBhcyBleHBlY3RlZCwgb3IgT2JqZWN0IGlmIHJlcXVlc3QgYm9keVxuICAgKiAgaXMgaW4gSlNPTiBmb3JtYXQuXG4gICAqIEBwYXJhbSB7T2JqZWN0PX0gaGVhZGVycyBIVFRQIGhlYWRlcnMuXG4gICAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgbWV0aG9kIHRoYXQgY29udHJvbHMgaG93IGEgbWF0Y2hlZFxuICAgKiAgIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogICBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RQVVRcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCBleHBlY3RhdGlvbiBmb3IgUFVUIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgZXhwZWN0KClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgdGhlIHVybFxuICAgKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaCB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0geyhzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl8T2JqZWN0KT19IGRhdGEgSFRUUCByZXF1ZXN0IGJvZHkgb3IgZnVuY3Rpb24gdGhhdFxuICAgKiAgcmVjZWl2ZXMgZGF0YSBzdHJpbmcgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgZGF0YSBpcyBhcyBleHBlY3RlZCwgb3IgT2JqZWN0IGlmIHJlcXVlc3QgYm9keVxuICAgKiAgaXMgaW4gSlNPTiBmb3JtYXQuXG4gICAqIEBwYXJhbSB7T2JqZWN0PX0gaGVhZGVycyBIVFRQIGhlYWRlcnMuXG4gICAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgbWV0aG9kIHRoYXQgY29udHJvbHMgaG93IGEgbWF0Y2hlZFxuICAgKiAgIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogICBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RQQVRDSFxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQ3JlYXRlcyBhIG5ldyByZXF1ZXN0IGV4cGVjdGF0aW9uIGZvciBQQVRDSCByZXF1ZXN0cy4gRm9yIG1vcmUgaW5mbyBzZWUgYGV4cGVjdCgpYC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIHRoZSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2ggdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfE9iamVjdCk9fSBkYXRhIEhUVFAgcmVxdWVzdCBib2R5IG9yIGZ1bmN0aW9uIHRoYXRcbiAgICogIHJlY2VpdmVzIGRhdGEgc3RyaW5nIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGRhdGEgaXMgYXMgZXhwZWN0ZWQsIG9yIE9iamVjdCBpZiByZXF1ZXN0IGJvZHlcbiAgICogIGlzIGluIEpTT04gZm9ybWF0LlxuICAgKiBAcGFyYW0ge09iamVjdD19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogICByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2UgYHJlc3BvbmRgIGFnYWluIGluXG4gICAqICAgb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjZXhwZWN0SlNPTlBcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCBleHBlY3RhdGlvbiBmb3IgSlNPTlAgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGBleHBlY3QoKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyB0aGUgdXJsXG4gICAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoIHRoZSBjdXJyZW50IGRlZmluaXRpb24uXG4gICAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgbWV0aG9kIHRoYXQgY29udHJvbHMgaG93IGEgbWF0Y2hlZFxuICAgKiAgIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogICBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gICAqL1xuICBjcmVhdGVTaG9ydE1ldGhvZHMoJ2V4cGVjdCcpO1xuXG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBtZXRob2RcbiAgICogQG5hbWUgJGh0dHBCYWNrZW5kI2ZsdXNoXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBGbHVzaGVzIGFsbCBwZW5kaW5nIHJlcXVlc3RzIHVzaW5nIHRoZSB0cmFpbmVkIHJlc3BvbnNlcy5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXI9fSBjb3VudCBOdW1iZXIgb2YgcmVzcG9uc2VzIHRvIGZsdXNoIChpbiB0aGUgb3JkZXIgdGhleSBhcnJpdmVkKS4gSWYgdW5kZWZpbmVkLFxuICAgKiAgIGFsbCBwZW5kaW5nIHJlcXVlc3RzIHdpbGwgYmUgZmx1c2hlZC4gSWYgdGhlcmUgYXJlIG5vIHBlbmRpbmcgcmVxdWVzdHMgd2hlbiB0aGUgZmx1c2ggbWV0aG9kXG4gICAqICAgaXMgY2FsbGVkIGFuIGV4Y2VwdGlvbiBpcyB0aHJvd24gKGFzIHRoaXMgdHlwaWNhbGx5IGEgc2lnbiBvZiBwcm9ncmFtbWluZyBlcnJvcikuXG4gICAqL1xuICAkaHR0cEJhY2tlbmQuZmx1c2ggPSBmdW5jdGlvbihjb3VudCwgZGlnZXN0KSB7XG4gICAgaWYgKGRpZ2VzdCAhPT0gZmFsc2UpICRyb290U2NvcGUuJGRpZ2VzdCgpO1xuICAgIGlmICghcmVzcG9uc2VzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCdObyBwZW5kaW5nIHJlcXVlc3QgdG8gZmx1c2ggIScpO1xuXG4gICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKGNvdW50KSAmJiBjb3VudCAhPT0gbnVsbCkge1xuICAgICAgd2hpbGUgKGNvdW50LS0pIHtcbiAgICAgICAgaWYgKCFyZXNwb25zZXMubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoJ05vIG1vcmUgcGVuZGluZyByZXF1ZXN0IHRvIGZsdXNoICEnKTtcbiAgICAgICAgcmVzcG9uc2VzLnNoaWZ0KCkoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgd2hpbGUgKHJlc3BvbnNlcy5sZW5ndGgpIHtcbiAgICAgICAgcmVzcG9uc2VzLnNoaWZ0KCkoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgJGh0dHBCYWNrZW5kLnZlcmlmeU5vT3V0c3RhbmRpbmdFeHBlY3RhdGlvbihkaWdlc3QpO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBtZXRob2RcbiAgICogQG5hbWUgJGh0dHBCYWNrZW5kI3ZlcmlmeU5vT3V0c3RhbmRpbmdFeHBlY3RhdGlvblxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVmVyaWZpZXMgdGhhdCBhbGwgb2YgdGhlIHJlcXVlc3RzIGRlZmluZWQgdmlhIHRoZSBgZXhwZWN0YCBhcGkgd2VyZSBtYWRlLiBJZiBhbnkgb2YgdGhlXG4gICAqIHJlcXVlc3RzIHdlcmUgbm90IG1hZGUsIHZlcmlmeU5vT3V0c3RhbmRpbmdFeHBlY3RhdGlvbiB0aHJvd3MgYW4gZXhjZXB0aW9uLlxuICAgKlxuICAgKiBUeXBpY2FsbHksIHlvdSB3b3VsZCBjYWxsIHRoaXMgbWV0aG9kIGZvbGxvd2luZyBlYWNoIHRlc3QgY2FzZSB0aGF0IGFzc2VydHMgcmVxdWVzdHMgdXNpbmcgYW5cbiAgICogXCJhZnRlckVhY2hcIiBjbGF1c2UuXG4gICAqXG4gICAqIGBgYGpzXG4gICAqICAgYWZ0ZXJFYWNoKCRodHRwQmFja2VuZC52ZXJpZnlOb091dHN0YW5kaW5nRXhwZWN0YXRpb24pO1xuICAgKiBgYGBcbiAgICovXG4gICRodHRwQmFja2VuZC52ZXJpZnlOb091dHN0YW5kaW5nRXhwZWN0YXRpb24gPSBmdW5jdGlvbihkaWdlc3QpIHtcbiAgICBpZiAoZGlnZXN0ICE9PSBmYWxzZSkgJHJvb3RTY29wZS4kZGlnZXN0KCk7XG4gICAgaWYgKGV4cGVjdGF0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5zYXRpc2ZpZWQgcmVxdWVzdHM6ICcgKyBleHBlY3RhdGlvbnMuam9pbignLCAnKSk7XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBtZXRob2RcbiAgICogQG5hbWUgJGh0dHBCYWNrZW5kI3ZlcmlmeU5vT3V0c3RhbmRpbmdSZXF1ZXN0XG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBWZXJpZmllcyB0aGF0IHRoZXJlIGFyZSBubyBvdXRzdGFuZGluZyByZXF1ZXN0cyB0aGF0IG5lZWQgdG8gYmUgZmx1c2hlZC5cbiAgICpcbiAgICogVHlwaWNhbGx5LCB5b3Ugd291bGQgY2FsbCB0aGlzIG1ldGhvZCBmb2xsb3dpbmcgZWFjaCB0ZXN0IGNhc2UgdGhhdCBhc3NlcnRzIHJlcXVlc3RzIHVzaW5nIGFuXG4gICAqIFwiYWZ0ZXJFYWNoXCIgY2xhdXNlLlxuICAgKlxuICAgKiBgYGBqc1xuICAgKiAgIGFmdGVyRWFjaCgkaHR0cEJhY2tlbmQudmVyaWZ5Tm9PdXRzdGFuZGluZ1JlcXVlc3QpO1xuICAgKiBgYGBcbiAgICovXG4gICRodHRwQmFja2VuZC52ZXJpZnlOb091dHN0YW5kaW5nUmVxdWVzdCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChyZXNwb25zZXMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZmx1c2hlZCByZXF1ZXN0czogJyArIHJlc3BvbnNlcy5sZW5ndGgpO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNyZXNldEV4cGVjdGF0aW9uc1xuICAgKiBAZGVzY3JpcHRpb25cbiAgICogUmVzZXRzIGFsbCByZXF1ZXN0IGV4cGVjdGF0aW9ucywgYnV0IHByZXNlcnZlcyBhbGwgYmFja2VuZCBkZWZpbml0aW9ucy4gVHlwaWNhbGx5LCB5b3Ugd291bGRcbiAgICogY2FsbCByZXNldEV4cGVjdGF0aW9ucyBkdXJpbmcgYSBtdWx0aXBsZS1waGFzZSB0ZXN0IHdoZW4geW91IHdhbnQgdG8gcmV1c2UgdGhlIHNhbWUgaW5zdGFuY2Ugb2ZcbiAgICogJGh0dHBCYWNrZW5kIG1vY2suXG4gICAqL1xuICAkaHR0cEJhY2tlbmQucmVzZXRFeHBlY3RhdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgICBleHBlY3RhdGlvbnMubGVuZ3RoID0gMDtcbiAgICByZXNwb25zZXMubGVuZ3RoID0gMDtcbiAgfTtcblxuICByZXR1cm4gJGh0dHBCYWNrZW5kO1xuXG5cbiAgZnVuY3Rpb24gY3JlYXRlU2hvcnRNZXRob2RzKHByZWZpeCkge1xuICAgIGFuZ3VsYXIuZm9yRWFjaChbJ0dFVCcsICdERUxFVEUnLCAnSlNPTlAnLCAnSEVBRCddLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICAgJGh0dHBCYWNrZW5kW3ByZWZpeCArIG1ldGhvZF0gPSBmdW5jdGlvbih1cmwsIGhlYWRlcnMpIHtcbiAgICAgICByZXR1cm4gJGh0dHBCYWNrZW5kW3ByZWZpeF0obWV0aG9kLCB1cmwsIHVuZGVmaW5lZCwgaGVhZGVycyk7XG4gICAgIH07XG4gICAgfSk7XG5cbiAgICBhbmd1bGFyLmZvckVhY2goWydQVVQnLCAnUE9TVCcsICdQQVRDSCddLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICAgICRodHRwQmFja2VuZFtwcmVmaXggKyBtZXRob2RdID0gZnVuY3Rpb24odXJsLCBkYXRhLCBoZWFkZXJzKSB7XG4gICAgICAgIHJldHVybiAkaHR0cEJhY2tlbmRbcHJlZml4XShtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycyk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIE1vY2tIdHRwRXhwZWN0YXRpb24obWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMpIHtcblxuICB0aGlzLmRhdGEgPSBkYXRhO1xuICB0aGlzLmhlYWRlcnMgPSBoZWFkZXJzO1xuXG4gIHRoaXMubWF0Y2ggPSBmdW5jdGlvbihtLCB1LCBkLCBoKSB7XG4gICAgaWYgKG1ldGhvZCAhPSBtKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKCF0aGlzLm1hdGNoVXJsKHUpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKGQpICYmICF0aGlzLm1hdGNoRGF0YShkKSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChoKSAmJiAhdGhpcy5tYXRjaEhlYWRlcnMoaCkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICB0aGlzLm1hdGNoVXJsID0gZnVuY3Rpb24odSkge1xuICAgIGlmICghdXJsKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoYW5ndWxhci5pc0Z1bmN0aW9uKHVybC50ZXN0KSkgcmV0dXJuIHVybC50ZXN0KHUpO1xuICAgIGlmIChhbmd1bGFyLmlzRnVuY3Rpb24odXJsKSkgcmV0dXJuIHVybCh1KTtcbiAgICByZXR1cm4gdXJsID09IHU7XG4gIH07XG5cbiAgdGhpcy5tYXRjaEhlYWRlcnMgPSBmdW5jdGlvbihoKSB7XG4gICAgaWYgKGFuZ3VsYXIuaXNVbmRlZmluZWQoaGVhZGVycykpIHJldHVybiB0cnVlO1xuICAgIGlmIChhbmd1bGFyLmlzRnVuY3Rpb24oaGVhZGVycykpIHJldHVybiBoZWFkZXJzKGgpO1xuICAgIHJldHVybiBhbmd1bGFyLmVxdWFscyhoZWFkZXJzLCBoKTtcbiAgfTtcblxuICB0aGlzLm1hdGNoRGF0YSA9IGZ1bmN0aW9uKGQpIHtcbiAgICBpZiAoYW5ndWxhci5pc1VuZGVmaW5lZChkYXRhKSkgcmV0dXJuIHRydWU7XG4gICAgaWYgKGRhdGEgJiYgYW5ndWxhci5pc0Z1bmN0aW9uKGRhdGEudGVzdCkpIHJldHVybiBkYXRhLnRlc3QoZCk7XG4gICAgaWYgKGRhdGEgJiYgYW5ndWxhci5pc0Z1bmN0aW9uKGRhdGEpKSByZXR1cm4gZGF0YShkKTtcbiAgICBpZiAoZGF0YSAmJiAhYW5ndWxhci5pc1N0cmluZyhkYXRhKSkge1xuICAgICAgcmV0dXJuIGFuZ3VsYXIuZXF1YWxzKGFuZ3VsYXIuZnJvbUpzb24oYW5ndWxhci50b0pzb24oZGF0YSkpLCBhbmd1bGFyLmZyb21Kc29uKGQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGRhdGEgPT0gZDtcbiAgfTtcblxuICB0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG1ldGhvZCArICcgJyArIHVybDtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTW9ja1hocigpIHtcbiAgcmV0dXJuIG5ldyBNb2NrWGhyKCk7XG59XG5cbmZ1bmN0aW9uIE1vY2tYaHIoKSB7XG5cbiAgLy8gaGFjayBmb3IgdGVzdGluZyAkaHR0cCwgJGh0dHBCYWNrZW5kXG4gIE1vY2tYaHIuJCRsYXN0SW5zdGFuY2UgPSB0aGlzO1xuXG4gIHRoaXMub3BlbiA9IGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBhc3luYykge1xuICAgIHRoaXMuJCRtZXRob2QgPSBtZXRob2Q7XG4gICAgdGhpcy4kJHVybCA9IHVybDtcbiAgICB0aGlzLiQkYXN5bmMgPSBhc3luYztcbiAgICB0aGlzLiQkcmVxSGVhZGVycyA9IHt9O1xuICAgIHRoaXMuJCRyZXNwSGVhZGVycyA9IHt9O1xuICB9O1xuXG4gIHRoaXMuc2VuZCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB0aGlzLiQkZGF0YSA9IGRhdGE7XG4gIH07XG5cbiAgdGhpcy5zZXRSZXF1ZXN0SGVhZGVyID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgIHRoaXMuJCRyZXFIZWFkZXJzW2tleV0gPSB2YWx1ZTtcbiAgfTtcblxuICB0aGlzLmdldFJlc3BvbnNlSGVhZGVyID0gZnVuY3Rpb24obmFtZSkge1xuICAgIC8vIHRoZSBsb29rdXAgbXVzdCBiZSBjYXNlIGluc2Vuc2l0aXZlLFxuICAgIC8vIHRoYXQncyB3aHkgd2UgdHJ5IHR3byBxdWljayBsb29rdXBzIGZpcnN0IGFuZCBmdWxsIHNjYW4gbGFzdFxuICAgIHZhciBoZWFkZXIgPSB0aGlzLiQkcmVzcEhlYWRlcnNbbmFtZV07XG4gICAgaWYgKGhlYWRlcikgcmV0dXJuIGhlYWRlcjtcblxuICAgIG5hbWUgPSBhbmd1bGFyLmxvd2VyY2FzZShuYW1lKTtcbiAgICBoZWFkZXIgPSB0aGlzLiQkcmVzcEhlYWRlcnNbbmFtZV07XG4gICAgaWYgKGhlYWRlcikgcmV0dXJuIGhlYWRlcjtcblxuICAgIGhlYWRlciA9IHVuZGVmaW5lZDtcbiAgICBhbmd1bGFyLmZvckVhY2godGhpcy4kJHJlc3BIZWFkZXJzLCBmdW5jdGlvbihoZWFkZXJWYWwsIGhlYWRlck5hbWUpIHtcbiAgICAgIGlmICghaGVhZGVyICYmIGFuZ3VsYXIubG93ZXJjYXNlKGhlYWRlck5hbWUpID09IG5hbWUpIGhlYWRlciA9IGhlYWRlclZhbDtcbiAgICB9KTtcbiAgICByZXR1cm4gaGVhZGVyO1xuICB9O1xuXG4gIHRoaXMuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxpbmVzID0gW107XG5cbiAgICBhbmd1bGFyLmZvckVhY2godGhpcy4kJHJlc3BIZWFkZXJzLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICBsaW5lcy5wdXNoKGtleSArICc6ICcgKyB2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGxpbmVzLmpvaW4oJ1xcbicpO1xuICB9O1xuXG4gIHRoaXMuYWJvcnQgPSBhbmd1bGFyLm5vb3A7XG59XG5cblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgJHRpbWVvdXRcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIFRoaXMgc2VydmljZSBpcyBqdXN0IGEgc2ltcGxlIGRlY29yYXRvciBmb3Ige0BsaW5rIG5nLiR0aW1lb3V0ICR0aW1lb3V0fSBzZXJ2aWNlXG4gKiB0aGF0IGFkZHMgYSBcImZsdXNoXCIgYW5kIFwidmVyaWZ5Tm9QZW5kaW5nVGFza3NcIiBtZXRob2RzLlxuICovXG5cbmFuZ3VsYXIubW9jay4kVGltZW91dERlY29yYXRvciA9IFsnJGRlbGVnYXRlJywgJyRicm93c2VyJywgZnVuY3Rpb24oJGRlbGVnYXRlLCAkYnJvd3Nlcikge1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICR0aW1lb3V0I2ZsdXNoXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKlxuICAgKiBGbHVzaGVzIHRoZSBxdWV1ZSBvZiBwZW5kaW5nIHRhc2tzLlxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcj19IGRlbGF5IG1heGltdW0gdGltZW91dCBhbW91bnQgdG8gZmx1c2ggdXAgdW50aWxcbiAgICovXG4gICRkZWxlZ2F0ZS5mbHVzaCA9IGZ1bmN0aW9uKGRlbGF5KSB7XG4gICAgJGJyb3dzZXIuZGVmZXIuZmx1c2goZGVsYXkpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICR0aW1lb3V0I3ZlcmlmeU5vUGVuZGluZ1Rhc2tzXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKlxuICAgKiBWZXJpZmllcyB0aGF0IHRoZXJlIGFyZSBubyBwZW5kaW5nIHRhc2tzIHRoYXQgbmVlZCB0byBiZSBmbHVzaGVkLlxuICAgKi9cbiAgJGRlbGVnYXRlLnZlcmlmeU5vUGVuZGluZ1Rhc2tzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCRicm93c2VyLmRlZmVycmVkRm5zLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdEZWZlcnJlZCB0YXNrcyB0byBmbHVzaCAoJyArICRicm93c2VyLmRlZmVycmVkRm5zLmxlbmd0aCArICcpOiAnICtcbiAgICAgICAgICBmb3JtYXRQZW5kaW5nVGFza3NBc1N0cmluZygkYnJvd3Nlci5kZWZlcnJlZEZucykpO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBmb3JtYXRQZW5kaW5nVGFza3NBc1N0cmluZyh0YXNrcykge1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICBhbmd1bGFyLmZvckVhY2godGFza3MsIGZ1bmN0aW9uKHRhc2spIHtcbiAgICAgIHJlc3VsdC5wdXNoKCd7aWQ6ICcgKyB0YXNrLmlkICsgJywgJyArICd0aW1lOiAnICsgdGFzay50aW1lICsgJ30nKTtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHQuam9pbignLCAnKTtcbiAgfVxuXG4gIHJldHVybiAkZGVsZWdhdGU7XG59XTtcblxuYW5ndWxhci5tb2NrLiRSQUZEZWNvcmF0b3IgPSBbJyRkZWxlZ2F0ZScsIGZ1bmN0aW9uKCRkZWxlZ2F0ZSkge1xuICB2YXIgcXVldWUgPSBbXTtcbiAgdmFyIHJhZkZuID0gZnVuY3Rpb24oZm4pIHtcbiAgICB2YXIgaW5kZXggPSBxdWV1ZS5sZW5ndGg7XG4gICAgcXVldWUucHVzaChmbik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcXVldWUuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9O1xuICB9O1xuXG4gIHJhZkZuLnN1cHBvcnRlZCA9ICRkZWxlZ2F0ZS5zdXBwb3J0ZWQ7XG5cbiAgcmFmRm4uZmx1c2ggPSBmdW5jdGlvbigpIHtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHJBRiBjYWxsYmFja3MgcHJlc2VudCcpO1xuICAgIH1cblxuICAgIHZhciBsZW5ndGggPSBxdWV1ZS5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcXVldWVbaV0oKTtcbiAgICB9XG5cbiAgICBxdWV1ZSA9IFtdO1xuICB9O1xuXG4gIHJldHVybiByYWZGbjtcbn1dO1xuXG5hbmd1bGFyLm1vY2suJEFzeW5jQ2FsbGJhY2tEZWNvcmF0b3IgPSBbJyRkZWxlZ2F0ZScsIGZ1bmN0aW9uKCRkZWxlZ2F0ZSkge1xuICB2YXIgY2FsbGJhY2tzID0gW107XG4gIHZhciBhZGRGbiA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgY2FsbGJhY2tzLnB1c2goZm4pO1xuICB9O1xuICBhZGRGbi5mbHVzaCA9IGZ1bmN0aW9uKCkge1xuICAgIGFuZ3VsYXIuZm9yRWFjaChjYWxsYmFja3MsIGZ1bmN0aW9uKGZuKSB7XG4gICAgICBmbigpO1xuICAgIH0pO1xuICAgIGNhbGxiYWNrcyA9IFtdO1xuICB9O1xuICByZXR1cm4gYWRkRm47XG59XTtcblxuLyoqXG4gKlxuICovXG5hbmd1bGFyLm1vY2suJFJvb3RFbGVtZW50UHJvdmlkZXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy4kZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGFuZ3VsYXIuZWxlbWVudCgnPGRpdiBuZy1hcHA+PC9kaXY+Jyk7XG4gIH07XG59O1xuXG4vKipcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSAkY29udHJvbGxlclxuICogQGRlc2NyaXB0aW9uXG4gKiBBIGRlY29yYXRvciBmb3Ige0BsaW5rIG5nLiRjb250cm9sbGVyfSB3aXRoIGFkZGl0aW9uYWwgYGJpbmRpbmdzYCBwYXJhbWV0ZXIsIHVzZWZ1bCB3aGVuIHRlc3RpbmdcbiAqIGNvbnRyb2xsZXJzIG9mIGRpcmVjdGl2ZXMgdGhhdCB1c2Uge0BsaW5rICRjb21waWxlIy1iaW5kdG9jb250cm9sbGVyLSBgYmluZFRvQ29udHJvbGxlcmB9LlxuICpcbiAqXG4gKiAjIyBFeGFtcGxlXG4gKlxuICogYGBganNcbiAqXG4gKiAvLyBEaXJlY3RpdmUgZGVmaW5pdGlvbiAuLi5cbiAqXG4gKiBteU1vZC5kaXJlY3RpdmUoJ215RGlyZWN0aXZlJywge1xuICogICBjb250cm9sbGVyOiAnTXlEaXJlY3RpdmVDb250cm9sbGVyJyxcbiAqICAgYmluZFRvQ29udHJvbGxlcjoge1xuICogICAgIG5hbWU6ICdAJ1xuICogICB9XG4gKiB9KTtcbiAqXG4gKlxuICogLy8gQ29udHJvbGxlciBkZWZpbml0aW9uIC4uLlxuICpcbiAqIG15TW9kLmNvbnRyb2xsZXIoJ015RGlyZWN0aXZlQ29udHJvbGxlcicsIFsnbG9nJywgZnVuY3Rpb24oJGxvZykge1xuICogICAkbG9nLmluZm8odGhpcy5uYW1lKTtcbiAqIH0pXTtcbiAqXG4gKlxuICogLy8gSW4gYSB0ZXN0IC4uLlxuICpcbiAqIGRlc2NyaWJlKCdteURpcmVjdGl2ZUNvbnRyb2xsZXInLCBmdW5jdGlvbigpIHtcbiAqICAgaXQoJ3Nob3VsZCB3cml0ZSB0aGUgYm91bmQgbmFtZSB0byB0aGUgbG9nJywgaW5qZWN0KGZ1bmN0aW9uKCRjb250cm9sbGVyLCAkbG9nKSB7XG4gKiAgICAgdmFyIGN0cmwgPSAkY29udHJvbGxlcignTXlEaXJlY3RpdmUnLCB7IC8qIG5vIGxvY2FscyAmIzQyOy8gfSwgeyBuYW1lOiAnQ2xhcmsgS2VudCcgfSk7XG4gKiAgICAgZXhwZWN0KGN0cmwubmFtZSkudG9FcXVhbCgnQ2xhcmsgS2VudCcpO1xuICogICAgIGV4cGVjdCgkbG9nLmluZm8ubG9ncykudG9FcXVhbChbJ0NsYXJrIEtlbnQnXSk7XG4gKiAgIH0pO1xuICogfSk7XG4gKlxuICogYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbnxzdHJpbmd9IGNvbnN0cnVjdG9yIElmIGNhbGxlZCB3aXRoIGEgZnVuY3Rpb24gdGhlbiBpdCdzIGNvbnNpZGVyZWQgdG8gYmUgdGhlXG4gKiAgICBjb250cm9sbGVyIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLiBPdGhlcndpc2UgaXQncyBjb25zaWRlcmVkIHRvIGJlIGEgc3RyaW5nIHdoaWNoIGlzIHVzZWRcbiAqICAgIHRvIHJldHJpZXZlIHRoZSBjb250cm9sbGVyIGNvbnN0cnVjdG9yIHVzaW5nIHRoZSBmb2xsb3dpbmcgc3RlcHM6XG4gKlxuICogICAgKiBjaGVjayBpZiBhIGNvbnRyb2xsZXIgd2l0aCBnaXZlbiBuYW1lIGlzIHJlZ2lzdGVyZWQgdmlhIGAkY29udHJvbGxlclByb3ZpZGVyYFxuICogICAgKiBjaGVjayBpZiBldmFsdWF0aW5nIHRoZSBzdHJpbmcgb24gdGhlIGN1cnJlbnQgc2NvcGUgcmV0dXJucyBhIGNvbnN0cnVjdG9yXG4gKiAgICAqIGlmICRjb250cm9sbGVyUHJvdmlkZXIjYWxsb3dHbG9iYWxzLCBjaGVjayBgd2luZG93W2NvbnN0cnVjdG9yXWAgb24gdGhlIGdsb2JhbFxuICogICAgICBgd2luZG93YCBvYmplY3QgKG5vdCByZWNvbW1lbmRlZClcbiAqXG4gKiAgICBUaGUgc3RyaW5nIGNhbiB1c2UgdGhlIGBjb250cm9sbGVyIGFzIHByb3BlcnR5YCBzeW50YXgsIHdoZXJlIHRoZSBjb250cm9sbGVyIGluc3RhbmNlIGlzIHB1Ymxpc2hlZFxuICogICAgYXMgdGhlIHNwZWNpZmllZCBwcm9wZXJ0eSBvbiB0aGUgYHNjb3BlYDsgdGhlIGBzY29wZWAgbXVzdCBiZSBpbmplY3RlZCBpbnRvIGBsb2NhbHNgIHBhcmFtIGZvciB0aGlzXG4gKiAgICB0byB3b3JrIGNvcnJlY3RseS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gbG9jYWxzIEluamVjdGlvbiBsb2NhbHMgZm9yIENvbnRyb2xsZXIuXG4gKiBAcGFyYW0ge09iamVjdD19IGJpbmRpbmdzIFByb3BlcnRpZXMgdG8gYWRkIHRvIHRoZSBjb250cm9sbGVyIGJlZm9yZSBpbnZva2luZyB0aGUgY29uc3RydWN0b3IuIFRoaXMgaXMgdXNlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICB0byBzaW11bGF0ZSB0aGUgYGJpbmRUb0NvbnRyb2xsZXJgIGZlYXR1cmUgYW5kIHNpbXBsaWZ5IGNlcnRhaW4ga2luZHMgb2YgdGVzdHMuXG4gKiBAcmV0dXJuIHtPYmplY3R9IEluc3RhbmNlIG9mIGdpdmVuIGNvbnRyb2xsZXIuXG4gKi9cbmFuZ3VsYXIubW9jay4kQ29udHJvbGxlckRlY29yYXRvciA9IFsnJGRlbGVnYXRlJywgZnVuY3Rpb24oJGRlbGVnYXRlKSB7XG4gIHJldHVybiBmdW5jdGlvbihleHByZXNzaW9uLCBsb2NhbHMsIGxhdGVyLCBpZGVudCkge1xuICAgIGlmIChsYXRlciAmJiB0eXBlb2YgbGF0ZXIgPT09ICdvYmplY3QnKSB7XG4gICAgICB2YXIgY3JlYXRlID0gJGRlbGVnYXRlKGV4cHJlc3Npb24sIGxvY2FscywgdHJ1ZSwgaWRlbnQpO1xuICAgICAgYW5ndWxhci5leHRlbmQoY3JlYXRlLmluc3RhbmNlLCBsYXRlcik7XG4gICAgICByZXR1cm4gY3JlYXRlKCk7XG4gICAgfVxuICAgIHJldHVybiAkZGVsZWdhdGUoZXhwcmVzc2lvbiwgbG9jYWxzLCBsYXRlciwgaWRlbnQpO1xuICB9O1xufV07XG5cblxuLyoqXG4gKiBAbmdkb2MgbW9kdWxlXG4gKiBAbmFtZSBuZ01vY2tcbiAqIEBwYWNrYWdlTmFtZSBhbmd1bGFyLW1vY2tzXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiAjIG5nTW9ja1xuICpcbiAqIFRoZSBgbmdNb2NrYCBtb2R1bGUgcHJvdmlkZXMgc3VwcG9ydCB0byBpbmplY3QgYW5kIG1vY2sgQW5ndWxhciBzZXJ2aWNlcyBpbnRvIHVuaXQgdGVzdHMuXG4gKiBJbiBhZGRpdGlvbiwgbmdNb2NrIGFsc28gZXh0ZW5kcyB2YXJpb3VzIGNvcmUgbmcgc2VydmljZXMgc3VjaCB0aGF0IHRoZXkgY2FuIGJlXG4gKiBpbnNwZWN0ZWQgYW5kIGNvbnRyb2xsZWQgaW4gYSBzeW5jaHJvbm91cyBtYW5uZXIgd2l0aGluIHRlc3QgY29kZS5cbiAqXG4gKlxuICogPGRpdiBkb2MtbW9kdWxlLWNvbXBvbmVudHM9XCJuZ01vY2tcIj48L2Rpdj5cbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCduZ01vY2snLCBbJ25nJ10pLnByb3ZpZGVyKHtcbiAgJGJyb3dzZXI6IGFuZ3VsYXIubW9jay4kQnJvd3NlclByb3ZpZGVyLFxuICAkZXhjZXB0aW9uSGFuZGxlcjogYW5ndWxhci5tb2NrLiRFeGNlcHRpb25IYW5kbGVyUHJvdmlkZXIsXG4gICRsb2c6IGFuZ3VsYXIubW9jay4kTG9nUHJvdmlkZXIsXG4gICRpbnRlcnZhbDogYW5ndWxhci5tb2NrLiRJbnRlcnZhbFByb3ZpZGVyLFxuICAkaHR0cEJhY2tlbmQ6IGFuZ3VsYXIubW9jay4kSHR0cEJhY2tlbmRQcm92aWRlcixcbiAgJHJvb3RFbGVtZW50OiBhbmd1bGFyLm1vY2suJFJvb3RFbGVtZW50UHJvdmlkZXJcbn0pLmNvbmZpZyhbJyRwcm92aWRlJywgZnVuY3Rpb24oJHByb3ZpZGUpIHtcbiAgJHByb3ZpZGUuZGVjb3JhdG9yKCckdGltZW91dCcsIGFuZ3VsYXIubW9jay4kVGltZW91dERlY29yYXRvcik7XG4gICRwcm92aWRlLmRlY29yYXRvcignJCRyQUYnLCBhbmd1bGFyLm1vY2suJFJBRkRlY29yYXRvcik7XG4gICRwcm92aWRlLmRlY29yYXRvcignJCRhc3luY0NhbGxiYWNrJywgYW5ndWxhci5tb2NrLiRBc3luY0NhbGxiYWNrRGVjb3JhdG9yKTtcbiAgJHByb3ZpZGUuZGVjb3JhdG9yKCckcm9vdFNjb3BlJywgYW5ndWxhci5tb2NrLiRSb290U2NvcGVEZWNvcmF0b3IpO1xuICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRjb250cm9sbGVyJywgYW5ndWxhci5tb2NrLiRDb250cm9sbGVyRGVjb3JhdG9yKTtcbn1dKTtcblxuLyoqXG4gKiBAbmdkb2MgbW9kdWxlXG4gKiBAbmFtZSBuZ01vY2tFMkVcbiAqIEBtb2R1bGUgbmdNb2NrRTJFXG4gKiBAcGFja2FnZU5hbWUgYW5ndWxhci1tb2Nrc1xuICogQGRlc2NyaXB0aW9uXG4gKlxuICogVGhlIGBuZ01vY2tFMkVgIGlzIGFuIGFuZ3VsYXIgbW9kdWxlIHdoaWNoIGNvbnRhaW5zIG1vY2tzIHN1aXRhYmxlIGZvciBlbmQtdG8tZW5kIHRlc3RpbmcuXG4gKiBDdXJyZW50bHkgdGhlcmUgaXMgb25seSBvbmUgbW9jayBwcmVzZW50IGluIHRoaXMgbW9kdWxlIC1cbiAqIHRoZSB7QGxpbmsgbmdNb2NrRTJFLiRodHRwQmFja2VuZCBlMmUgJGh0dHBCYWNrZW5kfSBtb2NrLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnbmdNb2NrRTJFJywgWyduZyddKS5jb25maWcoWyckcHJvdmlkZScsIGZ1bmN0aW9uKCRwcm92aWRlKSB7XG4gICRwcm92aWRlLmRlY29yYXRvcignJGh0dHBCYWNrZW5kJywgYW5ndWxhci5tb2NrLmUyZS4kaHR0cEJhY2tlbmREZWNvcmF0b3IpO1xufV0pO1xuXG4vKipcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSAkaHR0cEJhY2tlbmRcbiAqIEBtb2R1bGUgbmdNb2NrRTJFXG4gKiBAZGVzY3JpcHRpb25cbiAqIEZha2UgSFRUUCBiYWNrZW5kIGltcGxlbWVudGF0aW9uIHN1aXRhYmxlIGZvciBlbmQtdG8tZW5kIHRlc3Rpbmcgb3IgYmFja2VuZC1sZXNzIGRldmVsb3BtZW50IG9mXG4gKiBhcHBsaWNhdGlvbnMgdGhhdCB1c2UgdGhlIHtAbGluayBuZy4kaHR0cCAkaHR0cCBzZXJ2aWNlfS5cbiAqXG4gKiAqTm90ZSo6IEZvciBmYWtlIGh0dHAgYmFja2VuZCBpbXBsZW1lbnRhdGlvbiBzdWl0YWJsZSBmb3IgdW5pdCB0ZXN0aW5nIHBsZWFzZSBzZWVcbiAqIHtAbGluayBuZ01vY2suJGh0dHBCYWNrZW5kIHVuaXQtdGVzdGluZyAkaHR0cEJhY2tlbmQgbW9ja30uXG4gKlxuICogVGhpcyBpbXBsZW1lbnRhdGlvbiBjYW4gYmUgdXNlZCB0byByZXNwb25kIHdpdGggc3RhdGljIG9yIGR5bmFtaWMgcmVzcG9uc2VzIHZpYSB0aGUgYHdoZW5gIGFwaVxuICogYW5kIGl0cyBzaG9ydGN1dHMgKGB3aGVuR0VUYCwgYHdoZW5QT1NUYCwgZXRjKSBhbmQgb3B0aW9uYWxseSBwYXNzIHRocm91Z2ggcmVxdWVzdHMgdG8gdGhlXG4gKiByZWFsICRodHRwQmFja2VuZCBmb3Igc3BlY2lmaWMgcmVxdWVzdHMgKGUuZy4gdG8gaW50ZXJhY3Qgd2l0aCBjZXJ0YWluIHJlbW90ZSBhcGlzIG9yIHRvIGZldGNoXG4gKiB0ZW1wbGF0ZXMgZnJvbSBhIHdlYnNlcnZlcikuXG4gKlxuICogQXMgb3Bwb3NlZCB0byB1bml0LXRlc3RpbmcsIGluIGFuIGVuZC10by1lbmQgdGVzdGluZyBzY2VuYXJpbyBvciBpbiBzY2VuYXJpbyB3aGVuIGFuIGFwcGxpY2F0aW9uXG4gKiBpcyBiZWluZyBkZXZlbG9wZWQgd2l0aCB0aGUgcmVhbCBiYWNrZW5kIGFwaSByZXBsYWNlZCB3aXRoIGEgbW9jaywgaXQgaXMgb2Z0ZW4gZGVzaXJhYmxlIGZvclxuICogY2VydGFpbiBjYXRlZ29yeSBvZiByZXF1ZXN0cyB0byBieXBhc3MgdGhlIG1vY2sgYW5kIGlzc3VlIGEgcmVhbCBodHRwIHJlcXVlc3QgKGUuZy4gdG8gZmV0Y2hcbiAqIHRlbXBsYXRlcyBvciBzdGF0aWMgZmlsZXMgZnJvbSB0aGUgd2Vic2VydmVyKS4gVG8gY29uZmlndXJlIHRoZSBiYWNrZW5kIHdpdGggdGhpcyBiZWhhdmlvclxuICogdXNlIHRoZSBgcGFzc1Rocm91Z2hgIHJlcXVlc3QgaGFuZGxlciBvZiBgd2hlbmAgaW5zdGVhZCBvZiBgcmVzcG9uZGAuXG4gKlxuICogQWRkaXRpb25hbGx5LCB3ZSBkb24ndCB3YW50IHRvIG1hbnVhbGx5IGhhdmUgdG8gZmx1c2ggbW9ja2VkIG91dCByZXF1ZXN0cyBsaWtlIHdlIGRvIGR1cmluZyB1bml0XG4gKiB0ZXN0aW5nLiBGb3IgdGhpcyByZWFzb24gdGhlIGUyZSAkaHR0cEJhY2tlbmQgZmx1c2hlcyBtb2NrZWQgb3V0IHJlcXVlc3RzXG4gKiBhdXRvbWF0aWNhbGx5LCBjbG9zZWx5IHNpbXVsYXRpbmcgdGhlIGJlaGF2aW9yIG9mIHRoZSBYTUxIdHRwUmVxdWVzdCBvYmplY3QuXG4gKlxuICogVG8gc2V0dXAgdGhlIGFwcGxpY2F0aW9uIHRvIHJ1biB3aXRoIHRoaXMgaHR0cCBiYWNrZW5kLCB5b3UgaGF2ZSB0byBjcmVhdGUgYSBtb2R1bGUgdGhhdCBkZXBlbmRzXG4gKiBvbiB0aGUgYG5nTW9ja0UyRWAgYW5kIHlvdXIgYXBwbGljYXRpb24gbW9kdWxlcyBhbmQgZGVmaW5lcyB0aGUgZmFrZSBiYWNrZW5kOlxuICpcbiAqIGBgYGpzXG4gKiAgIG15QXBwRGV2ID0gYW5ndWxhci5tb2R1bGUoJ215QXBwRGV2JywgWydteUFwcCcsICduZ01vY2tFMkUnXSk7XG4gKiAgIG15QXBwRGV2LnJ1bihmdW5jdGlvbigkaHR0cEJhY2tlbmQpIHtcbiAqICAgICBwaG9uZXMgPSBbe25hbWU6ICdwaG9uZTEnfSwge25hbWU6ICdwaG9uZTInfV07XG4gKlxuICogICAgIC8vIHJldHVybnMgdGhlIGN1cnJlbnQgbGlzdCBvZiBwaG9uZXNcbiAqICAgICAkaHR0cEJhY2tlbmQud2hlbkdFVCgnL3Bob25lcycpLnJlc3BvbmQocGhvbmVzKTtcbiAqXG4gKiAgICAgLy8gYWRkcyBhIG5ldyBwaG9uZSB0byB0aGUgcGhvbmVzIGFycmF5XG4gKiAgICAgJGh0dHBCYWNrZW5kLndoZW5QT1NUKCcvcGhvbmVzJykucmVzcG9uZChmdW5jdGlvbihtZXRob2QsIHVybCwgZGF0YSkge1xuICogICAgICAgdmFyIHBob25lID0gYW5ndWxhci5mcm9tSnNvbihkYXRhKTtcbiAqICAgICAgIHBob25lcy5wdXNoKHBob25lKTtcbiAqICAgICAgIHJldHVybiBbMjAwLCBwaG9uZSwge31dO1xuICogICAgIH0pO1xuICogICAgICRodHRwQmFja2VuZC53aGVuR0VUKC9eXFwvdGVtcGxhdGVzXFwvLykucGFzc1Rocm91Z2goKTtcbiAqICAgICAvLy4uLlxuICogICB9KTtcbiAqIGBgYFxuICpcbiAqIEFmdGVyd2FyZHMsIGJvb3RzdHJhcCB5b3VyIGFwcCB3aXRoIHRoaXMgbmV3IG1vZHVsZS5cbiAqL1xuXG4vKipcbiAqIEBuZ2RvYyBtZXRob2RcbiAqIEBuYW1lICRodHRwQmFja2VuZCN3aGVuXG4gKiBAbW9kdWxlIG5nTW9ja0UyRVxuICogQGRlc2NyaXB0aW9uXG4gKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kIEhUVFAgbWV0aG9kLlxuICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIHRoZSB1cmxcbiAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoIHRoZSBjdXJyZW50IGRlZmluaXRpb24uXG4gKiBAcGFyYW0geyhzdHJpbmd8UmVnRXhwKT19IGRhdGEgSFRUUCByZXF1ZXN0IGJvZHkuXG4gKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycyBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGh0dHAgaGVhZGVyXG4gKiAgIG9iamVjdCBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSBoZWFkZXJzIG1hdGNoIHRoZSBjdXJyZW50IGRlZmluaXRpb24uXG4gKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIGFuZCBgcGFzc1Rocm91Z2hgIG1ldGhvZHMgdGhhdFxuICogICBjb250cm9sIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlXG4gKiAgIGByZXNwb25kYCBvciBgcGFzc1Rocm91Z2hgIGFnYWluIGluIG9yZGVyIHRvIGNoYW5nZSBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC5cbiAqXG4gKiAgLSByZXNwb25kIOKAk1xuICogICAgYHtmdW5jdGlvbihbc3RhdHVzLF0gZGF0YVssIGhlYWRlcnMsIHN0YXR1c1RleHRdKVxuICogICAgfCBmdW5jdGlvbihmdW5jdGlvbihtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycyl9YFxuICogICAg4oCTIFRoZSByZXNwb25kIG1ldGhvZCB0YWtlcyBhIHNldCBvZiBzdGF0aWMgZGF0YSB0byBiZSByZXR1cm5lZCBvciBhIGZ1bmN0aW9uIHRoYXQgY2FuIHJldHVyblxuICogICAgYW4gYXJyYXkgY29udGFpbmluZyByZXNwb25zZSBzdGF0dXMgKG51bWJlciksIHJlc3BvbnNlIGRhdGEgKHN0cmluZyksIHJlc3BvbnNlIGhlYWRlcnNcbiAqICAgIChPYmplY3QpLCBhbmQgdGhlIHRleHQgZm9yIHRoZSBzdGF0dXMgKHN0cmluZykuXG4gKiAgLSBwYXNzVGhyb3VnaCDigJMgYHtmdW5jdGlvbigpfWAg4oCTIEFueSByZXF1ZXN0IG1hdGNoaW5nIGEgYmFja2VuZCBkZWZpbml0aW9uIHdpdGhcbiAqICAgIGBwYXNzVGhyb3VnaGAgaGFuZGxlciB3aWxsIGJlIHBhc3NlZCB0aHJvdWdoIHRvIHRoZSByZWFsIGJhY2tlbmQgKGFuIFhIUiByZXF1ZXN0IHdpbGwgYmUgbWFkZVxuICogICAgdG8gdGhlIHNlcnZlci4pXG4gKiAgLSBCb3RoIG1ldGhvZHMgcmV0dXJuIHRoZSBgcmVxdWVzdEhhbmRsZXJgIG9iamVjdCBmb3IgcG9zc2libGUgb3ZlcnJpZGVzLlxuICovXG5cbi8qKlxuICogQG5nZG9jIG1ldGhvZFxuICogQG5hbWUgJGh0dHBCYWNrZW5kI3doZW5HRVRcbiAqIEBtb2R1bGUgbmdNb2NrRTJFXG4gKiBAZGVzY3JpcHRpb25cbiAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBHRVQgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGB3aGVuKClgLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyB0aGUgdXJsXG4gKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaCB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICogQHBhcmFtIHsoT2JqZWN0fGZ1bmN0aW9uKE9iamVjdCkpPX0gaGVhZGVycyBIVFRQIGhlYWRlcnMuXG4gKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIGFuZCBgcGFzc1Rocm91Z2hgIG1ldGhvZHMgdGhhdFxuICogICBjb250cm9sIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlXG4gKiAgIGByZXNwb25kYCBvciBgcGFzc1Rocm91Z2hgIGFnYWluIGluIG9yZGVyIHRvIGNoYW5nZSBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC5cbiAqL1xuXG4vKipcbiAqIEBuZ2RvYyBtZXRob2RcbiAqIEBuYW1lICRodHRwQmFja2VuZCN3aGVuSEVBRFxuICogQG1vZHVsZSBuZ01vY2tFMkVcbiAqIEBkZXNjcmlwdGlvblxuICogQ3JlYXRlcyBhIG5ldyBiYWNrZW5kIGRlZmluaXRpb24gZm9yIEhFQUQgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGB3aGVuKClgLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyB0aGUgdXJsXG4gKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaCB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICogQHBhcmFtIHsoT2JqZWN0fGZ1bmN0aW9uKE9iamVjdCkpPX0gaGVhZGVycyBIVFRQIGhlYWRlcnMuXG4gKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIGFuZCBgcGFzc1Rocm91Z2hgIG1ldGhvZHMgdGhhdFxuICogICBjb250cm9sIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlXG4gKiAgIGByZXNwb25kYCBvciBgcGFzc1Rocm91Z2hgIGFnYWluIGluIG9yZGVyIHRvIGNoYW5nZSBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC5cbiAqL1xuXG4vKipcbiAqIEBuZ2RvYyBtZXRob2RcbiAqIEBuYW1lICRodHRwQmFja2VuZCN3aGVuREVMRVRFXG4gKiBAbW9kdWxlIG5nTW9ja0UyRVxuICogQGRlc2NyaXB0aW9uXG4gKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbiBmb3IgREVMRVRFIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgd2hlbigpYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgdGhlIHVybFxuICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2ggdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAqIEBwYXJhbSB7KE9iamVjdHxmdW5jdGlvbihPYmplY3QpKT19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBhbmQgYHBhc3NUaHJvdWdoYCBtZXRob2RzIHRoYXRcbiAqICAgY29udHJvbCBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZVxuICogICBgcmVzcG9uZGAgb3IgYHBhc3NUaHJvdWdoYCBhZ2FpbiBpbiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2MgbWV0aG9kXG4gKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlblBPU1RcbiAqIEBtb2R1bGUgbmdNb2NrRTJFXG4gKiBAZGVzY3JpcHRpb25cbiAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBQT1NUIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgd2hlbigpYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgdGhlIHVybFxuICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2ggdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAqIEBwYXJhbSB7KHN0cmluZ3xSZWdFeHApPX0gZGF0YSBIVFRQIHJlcXVlc3QgYm9keS5cbiAqIEBwYXJhbSB7KE9iamVjdHxmdW5jdGlvbihPYmplY3QpKT19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBhbmQgYHBhc3NUaHJvdWdoYCBtZXRob2RzIHRoYXRcbiAqICAgY29udHJvbCBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZVxuICogICBgcmVzcG9uZGAgb3IgYHBhc3NUaHJvdWdoYCBhZ2FpbiBpbiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2MgbWV0aG9kXG4gKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlblBVVFxuICogQG1vZHVsZSBuZ01vY2tFMkVcbiAqIEBkZXNjcmlwdGlvblxuICogQ3JlYXRlcyBhIG5ldyBiYWNrZW5kIGRlZmluaXRpb24gZm9yIFBVVCByZXF1ZXN0cy4gIEZvciBtb3JlIGluZm8gc2VlIGB3aGVuKClgLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyB0aGUgdXJsXG4gKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaCB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cCk9fSBkYXRhIEhUVFAgcmVxdWVzdCBib2R5LlxuICogQHBhcmFtIHsoT2JqZWN0fGZ1bmN0aW9uKE9iamVjdCkpPX0gaGVhZGVycyBIVFRQIGhlYWRlcnMuXG4gKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIGFuZCBgcGFzc1Rocm91Z2hgIG1ldGhvZHMgdGhhdFxuICogICBjb250cm9sIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlXG4gKiAgIGByZXNwb25kYCBvciBgcGFzc1Rocm91Z2hgIGFnYWluIGluIG9yZGVyIHRvIGNoYW5nZSBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC5cbiAqL1xuXG4vKipcbiAqIEBuZ2RvYyBtZXRob2RcbiAqIEBuYW1lICRodHRwQmFja2VuZCN3aGVuUEFUQ0hcbiAqIEBtb2R1bGUgbmdNb2NrRTJFXG4gKiBAZGVzY3JpcHRpb25cbiAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBQQVRDSCByZXF1ZXN0cy4gIEZvciBtb3JlIGluZm8gc2VlIGB3aGVuKClgLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyB0aGUgdXJsXG4gKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaCB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cCk9fSBkYXRhIEhUVFAgcmVxdWVzdCBib2R5LlxuICogQHBhcmFtIHsoT2JqZWN0fGZ1bmN0aW9uKE9iamVjdCkpPX0gaGVhZGVycyBIVFRQIGhlYWRlcnMuXG4gKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIGFuZCBgcGFzc1Rocm91Z2hgIG1ldGhvZHMgdGhhdFxuICogICBjb250cm9sIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlXG4gKiAgIGByZXNwb25kYCBvciBgcGFzc1Rocm91Z2hgIGFnYWluIGluIG9yZGVyIHRvIGNoYW5nZSBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC5cbiAqL1xuXG4vKipcbiAqIEBuZ2RvYyBtZXRob2RcbiAqIEBuYW1lICRodHRwQmFja2VuZCN3aGVuSlNPTlBcbiAqIEBtb2R1bGUgbmdNb2NrRTJFXG4gKiBAZGVzY3JpcHRpb25cbiAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBKU09OUCByZXF1ZXN0cy4gRm9yIG1vcmUgaW5mbyBzZWUgYHdoZW4oKWAuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIHRoZSB1cmxcbiAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoIHRoZSBjdXJyZW50IGRlZmluaXRpb24uXG4gKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIGFuZCBgcGFzc1Rocm91Z2hgIG1ldGhvZHMgdGhhdFxuICogICBjb250cm9sIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlXG4gKiAgIGByZXNwb25kYCBvciBgcGFzc1Rocm91Z2hgIGFnYWluIGluIG9yZGVyIHRvIGNoYW5nZSBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC5cbiAqL1xuYW5ndWxhci5tb2NrLmUyZSA9IHt9O1xuYW5ndWxhci5tb2NrLmUyZS4kaHR0cEJhY2tlbmREZWNvcmF0b3IgPVxuICBbJyRyb290U2NvcGUnLCAnJHRpbWVvdXQnLCAnJGRlbGVnYXRlJywgJyRicm93c2VyJywgY3JlYXRlSHR0cEJhY2tlbmRNb2NrXTtcblxuXG4vKipcbiAqIEBuZ2RvYyB0eXBlXG4gKiBAbmFtZSAkcm9vdFNjb3BlLlNjb3BlXG4gKiBAbW9kdWxlIG5nTW9ja1xuICogQGRlc2NyaXB0aW9uXG4gKiB7QGxpbmsgbmcuJHJvb3RTY29wZS5TY29wZSBTY29wZX0gdHlwZSBkZWNvcmF0ZWQgd2l0aCBoZWxwZXIgbWV0aG9kcyB1c2VmdWwgZm9yIHRlc3RpbmcuIFRoZXNlXG4gKiBtZXRob2RzIGFyZSBhdXRvbWF0aWNhbGx5IGF2YWlsYWJsZSBvbiBhbnkge0BsaW5rIG5nLiRyb290U2NvcGUuU2NvcGUgU2NvcGV9IGluc3RhbmNlIHdoZW5cbiAqIGBuZ01vY2tgIG1vZHVsZSBpcyBsb2FkZWQuXG4gKlxuICogSW4gYWRkaXRpb24gdG8gYWxsIHRoZSByZWd1bGFyIGBTY29wZWAgbWV0aG9kcywgdGhlIGZvbGxvd2luZyBoZWxwZXIgbWV0aG9kcyBhcmUgYXZhaWxhYmxlOlxuICovXG5hbmd1bGFyLm1vY2suJFJvb3RTY29wZURlY29yYXRvciA9IFsnJGRlbGVnYXRlJywgZnVuY3Rpb24oJGRlbGVnYXRlKSB7XG5cbiAgdmFyICRyb290U2NvcGVQcm90b3R5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoJGRlbGVnYXRlKTtcblxuICAkcm9vdFNjb3BlUHJvdG90eXBlLiRjb3VudENoaWxkU2NvcGVzID0gY291bnRDaGlsZFNjb3BlcztcbiAgJHJvb3RTY29wZVByb3RvdHlwZS4kY291bnRXYXRjaGVycyA9IGNvdW50V2F0Y2hlcnM7XG5cbiAgcmV0dXJuICRkZWxlZ2F0ZTtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkcm9vdFNjb3BlLlNjb3BlIyRjb3VudENoaWxkU2NvcGVzXG4gICAqIEBtb2R1bGUgbmdNb2NrXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBDb3VudHMgYWxsIHRoZSBkaXJlY3QgYW5kIGluZGlyZWN0IGNoaWxkIHNjb3BlcyBvZiB0aGUgY3VycmVudCBzY29wZS5cbiAgICpcbiAgICogVGhlIGN1cnJlbnQgc2NvcGUgaXMgZXhjbHVkZWQgZnJvbSB0aGUgY291bnQuIFRoZSBjb3VudCBpbmNsdWRlcyBhbGwgaXNvbGF0ZSBjaGlsZCBzY29wZXMuXG4gICAqXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IFRvdGFsIG51bWJlciBvZiBjaGlsZCBzY29wZXMuXG4gICAqL1xuICBmdW5jdGlvbiBjb3VudENoaWxkU2NvcGVzKCkge1xuICAgIC8vIGpzaGludCB2YWxpZHRoaXM6IHRydWVcbiAgICB2YXIgY291bnQgPSAwOyAvLyBleGNsdWRlIHRoZSBjdXJyZW50IHNjb3BlXG4gICAgdmFyIHBlbmRpbmdDaGlsZEhlYWRzID0gW3RoaXMuJCRjaGlsZEhlYWRdO1xuICAgIHZhciBjdXJyZW50U2NvcGU7XG5cbiAgICB3aGlsZSAocGVuZGluZ0NoaWxkSGVhZHMubGVuZ3RoKSB7XG4gICAgICBjdXJyZW50U2NvcGUgPSBwZW5kaW5nQ2hpbGRIZWFkcy5zaGlmdCgpO1xuXG4gICAgICB3aGlsZSAoY3VycmVudFNjb3BlKSB7XG4gICAgICAgIGNvdW50ICs9IDE7XG4gICAgICAgIHBlbmRpbmdDaGlsZEhlYWRzLnB1c2goY3VycmVudFNjb3BlLiQkY2hpbGRIZWFkKTtcbiAgICAgICAgY3VycmVudFNjb3BlID0gY3VycmVudFNjb3BlLiQkbmV4dFNpYmxpbmc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvdW50O1xuICB9XG5cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkcm9vdFNjb3BlLlNjb3BlIyRjb3VudFdhdGNoZXJzXG4gICAqIEBtb2R1bGUgbmdNb2NrXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBDb3VudHMgYWxsIHRoZSB3YXRjaGVycyBvZiBkaXJlY3QgYW5kIGluZGlyZWN0IGNoaWxkIHNjb3BlcyBvZiB0aGUgY3VycmVudCBzY29wZS5cbiAgICpcbiAgICogVGhlIHdhdGNoZXJzIG9mIHRoZSBjdXJyZW50IHNjb3BlIGFyZSBpbmNsdWRlZCBpbiB0aGUgY291bnQgYW5kIHNvIGFyZSBhbGwgdGhlIHdhdGNoZXJzIG9mXG4gICAqIGlzb2xhdGUgY2hpbGQgc2NvcGVzLlxuICAgKlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUb3RhbCBudW1iZXIgb2Ygd2F0Y2hlcnMuXG4gICAqL1xuICBmdW5jdGlvbiBjb3VudFdhdGNoZXJzKCkge1xuICAgIC8vIGpzaGludCB2YWxpZHRoaXM6IHRydWVcbiAgICB2YXIgY291bnQgPSB0aGlzLiQkd2F0Y2hlcnMgPyB0aGlzLiQkd2F0Y2hlcnMubGVuZ3RoIDogMDsgLy8gaW5jbHVkZSB0aGUgY3VycmVudCBzY29wZVxuICAgIHZhciBwZW5kaW5nQ2hpbGRIZWFkcyA9IFt0aGlzLiQkY2hpbGRIZWFkXTtcbiAgICB2YXIgY3VycmVudFNjb3BlO1xuXG4gICAgd2hpbGUgKHBlbmRpbmdDaGlsZEhlYWRzLmxlbmd0aCkge1xuICAgICAgY3VycmVudFNjb3BlID0gcGVuZGluZ0NoaWxkSGVhZHMuc2hpZnQoKTtcblxuICAgICAgd2hpbGUgKGN1cnJlbnRTY29wZSkge1xuICAgICAgICBjb3VudCArPSBjdXJyZW50U2NvcGUuJCR3YXRjaGVycyA/IGN1cnJlbnRTY29wZS4kJHdhdGNoZXJzLmxlbmd0aCA6IDA7XG4gICAgICAgIHBlbmRpbmdDaGlsZEhlYWRzLnB1c2goY3VycmVudFNjb3BlLiQkY2hpbGRIZWFkKTtcbiAgICAgICAgY3VycmVudFNjb3BlID0gY3VycmVudFNjb3BlLiQkbmV4dFNpYmxpbmc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvdW50O1xuICB9XG59XTtcblxuXG5pZiAod2luZG93Lmphc21pbmUgfHwgd2luZG93Lm1vY2hhKSB7XG5cbiAgdmFyIGN1cnJlbnRTcGVjID0gbnVsbCxcbiAgICAgIGFubm90YXRlZEZ1bmN0aW9ucyA9IFtdLFxuICAgICAgaXNTcGVjUnVubmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISFjdXJyZW50U3BlYztcbiAgICAgIH07XG5cbiAgYW5ndWxhci5tb2NrLiQkYW5ub3RhdGUgPSBhbmd1bGFyLmluamVjdG9yLiQkYW5ub3RhdGU7XG4gIGFuZ3VsYXIuaW5qZWN0b3IuJCRhbm5vdGF0ZSA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgaWYgKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJyAmJiAhZm4uJGluamVjdCkge1xuICAgICAgYW5ub3RhdGVkRnVuY3Rpb25zLnB1c2goZm4pO1xuICAgIH1cbiAgICByZXR1cm4gYW5ndWxhci5tb2NrLiQkYW5ub3RhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcblxuXG4gICh3aW5kb3cuYmVmb3JlRWFjaCB8fCB3aW5kb3cuc2V0dXApKGZ1bmN0aW9uKCkge1xuICAgIGFubm90YXRlZEZ1bmN0aW9ucyA9IFtdO1xuICAgIGN1cnJlbnRTcGVjID0gdGhpcztcbiAgfSk7XG5cbiAgKHdpbmRvdy5hZnRlckVhY2ggfHwgd2luZG93LnRlYXJkb3duKShmdW5jdGlvbigpIHtcbiAgICB2YXIgaW5qZWN0b3IgPSBjdXJyZW50U3BlYy4kaW5qZWN0b3I7XG5cbiAgICBhbm5vdGF0ZWRGdW5jdGlvbnMuZm9yRWFjaChmdW5jdGlvbihmbikge1xuICAgICAgZGVsZXRlIGZuLiRpbmplY3Q7XG4gICAgfSk7XG5cbiAgICBhbmd1bGFyLmZvckVhY2goY3VycmVudFNwZWMuJG1vZHVsZXMsIGZ1bmN0aW9uKG1vZHVsZSkge1xuICAgICAgaWYgKG1vZHVsZSAmJiBtb2R1bGUuJCRoYXNoS2V5KSB7XG4gICAgICAgIG1vZHVsZS4kJGhhc2hLZXkgPSB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjdXJyZW50U3BlYy4kaW5qZWN0b3IgPSBudWxsO1xuICAgIGN1cnJlbnRTcGVjLiRtb2R1bGVzID0gbnVsbDtcbiAgICBjdXJyZW50U3BlYyA9IG51bGw7XG5cbiAgICBpZiAoaW5qZWN0b3IpIHtcbiAgICAgIGluamVjdG9yLmdldCgnJHJvb3RFbGVtZW50Jykub2ZmKCk7XG4gICAgICBpbmplY3Rvci5nZXQoJyRicm93c2VyJykucG9sbEZucy5sZW5ndGggPSAwO1xuICAgIH1cblxuICAgIC8vIGNsZWFuIHVwIGpxdWVyeSdzIGZyYWdtZW50IGNhY2hlXG4gICAgYW5ndWxhci5mb3JFYWNoKGFuZ3VsYXIuZWxlbWVudC5mcmFnbWVudHMsIGZ1bmN0aW9uKHZhbCwga2V5KSB7XG4gICAgICBkZWxldGUgYW5ndWxhci5lbGVtZW50LmZyYWdtZW50c1trZXldO1xuICAgIH0pO1xuXG4gICAgTW9ja1hoci4kJGxhc3RJbnN0YW5jZSA9IG51bGw7XG5cbiAgICBhbmd1bGFyLmZvckVhY2goYW5ndWxhci5jYWxsYmFja3MsIGZ1bmN0aW9uKHZhbCwga2V5KSB7XG4gICAgICBkZWxldGUgYW5ndWxhci5jYWxsYmFja3Nba2V5XTtcbiAgICB9KTtcbiAgICBhbmd1bGFyLmNhbGxiYWNrcy5jb3VudGVyID0gMDtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxuICAgKiBAbmFtZSBhbmd1bGFyLm1vY2subW9kdWxlXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKlxuICAgKiAqTk9URSo6IFRoaXMgZnVuY3Rpb24gaXMgYWxzbyBwdWJsaXNoZWQgb24gd2luZG93IGZvciBlYXN5IGFjY2Vzcy48YnI+XG4gICAqICpOT1RFKjogVGhpcyBmdW5jdGlvbiBpcyBkZWNsYXJlZCBPTkxZIFdIRU4gcnVubmluZyB0ZXN0cyB3aXRoIGphc21pbmUgb3IgbW9jaGFcbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbiByZWdpc3RlcnMgYSBtb2R1bGUgY29uZmlndXJhdGlvbiBjb2RlLiBJdCBjb2xsZWN0cyB0aGUgY29uZmlndXJhdGlvbiBpbmZvcm1hdGlvblxuICAgKiB3aGljaCB3aWxsIGJlIHVzZWQgd2hlbiB0aGUgaW5qZWN0b3IgaXMgY3JlYXRlZCBieSB7QGxpbmsgYW5ndWxhci5tb2NrLmluamVjdCBpbmplY3R9LlxuICAgKlxuICAgKiBTZWUge0BsaW5rIGFuZ3VsYXIubW9jay5pbmplY3QgaW5qZWN0fSBmb3IgdXNhZ2UgZXhhbXBsZVxuICAgKlxuICAgKiBAcGFyYW0gey4uLihzdHJpbmd8RnVuY3Rpb258T2JqZWN0KX0gZm5zIGFueSBudW1iZXIgb2YgbW9kdWxlcyB3aGljaCBhcmUgcmVwcmVzZW50ZWQgYXMgc3RyaW5nXG4gICAqICAgICAgICBhbGlhc2VzIG9yIGFzIGFub255bW91cyBtb2R1bGUgaW5pdGlhbGl6YXRpb24gZnVuY3Rpb25zLiBUaGUgbW9kdWxlcyBhcmUgdXNlZCB0b1xuICAgKiAgICAgICAgY29uZmlndXJlIHRoZSBpbmplY3Rvci4gVGhlICduZycgYW5kICduZ01vY2snIG1vZHVsZXMgYXJlIGF1dG9tYXRpY2FsbHkgbG9hZGVkLiBJZiBhblxuICAgKiAgICAgICAgb2JqZWN0IGxpdGVyYWwgaXMgcGFzc2VkIHRoZXkgd2lsbCBiZSByZWdpc3RlcmVkIGFzIHZhbHVlcyBpbiB0aGUgbW9kdWxlLCB0aGUga2V5IGJlaW5nXG4gICAqICAgICAgICB0aGUgbW9kdWxlIG5hbWUgYW5kIHRoZSB2YWx1ZSBiZWluZyB3aGF0IGlzIHJldHVybmVkLlxuICAgKi9cbiAgd2luZG93Lm1vZHVsZSA9IGFuZ3VsYXIubW9jay5tb2R1bGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbW9kdWxlRm5zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICByZXR1cm4gaXNTcGVjUnVubmluZygpID8gd29ya0ZuKCkgOiB3b3JrRm47XG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgZnVuY3Rpb24gd29ya0ZuKCkge1xuICAgICAgaWYgKGN1cnJlbnRTcGVjLiRpbmplY3Rvcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luamVjdG9yIGFscmVhZHkgY3JlYXRlZCwgY2FuIG5vdCByZWdpc3RlciBhIG1vZHVsZSEnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBtb2R1bGVzID0gY3VycmVudFNwZWMuJG1vZHVsZXMgfHwgKGN1cnJlbnRTcGVjLiRtb2R1bGVzID0gW10pO1xuICAgICAgICBhbmd1bGFyLmZvckVhY2gobW9kdWxlRm5zLCBmdW5jdGlvbihtb2R1bGUpIHtcbiAgICAgICAgICBpZiAoYW5ndWxhci5pc09iamVjdChtb2R1bGUpICYmICFhbmd1bGFyLmlzQXJyYXkobW9kdWxlKSkge1xuICAgICAgICAgICAgbW9kdWxlcy5wdXNoKGZ1bmN0aW9uKCRwcm92aWRlKSB7XG4gICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChtb2R1bGUsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgICAgICAkcHJvdmlkZS52YWx1ZShrZXksIHZhbHVlKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlcy5wdXNoKG1vZHVsZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxuICAgKiBAbmFtZSBhbmd1bGFyLm1vY2suaW5qZWN0XG4gICAqIEBkZXNjcmlwdGlvblxuICAgKlxuICAgKiAqTk9URSo6IFRoaXMgZnVuY3Rpb24gaXMgYWxzbyBwdWJsaXNoZWQgb24gd2luZG93IGZvciBlYXN5IGFjY2Vzcy48YnI+XG4gICAqICpOT1RFKjogVGhpcyBmdW5jdGlvbiBpcyBkZWNsYXJlZCBPTkxZIFdIRU4gcnVubmluZyB0ZXN0cyB3aXRoIGphc21pbmUgb3IgbW9jaGFcbiAgICpcbiAgICogVGhlIGluamVjdCBmdW5jdGlvbiB3cmFwcyBhIGZ1bmN0aW9uIGludG8gYW4gaW5qZWN0YWJsZSBmdW5jdGlvbi4gVGhlIGluamVjdCgpIGNyZWF0ZXMgbmV3XG4gICAqIGluc3RhbmNlIG9mIHtAbGluayBhdXRvLiRpbmplY3RvciAkaW5qZWN0b3J9IHBlciB0ZXN0LCB3aGljaCBpcyB0aGVuIHVzZWQgZm9yXG4gICAqIHJlc29sdmluZyByZWZlcmVuY2VzLlxuICAgKlxuICAgKlxuICAgKiAjIyBSZXNvbHZpbmcgUmVmZXJlbmNlcyAoVW5kZXJzY29yZSBXcmFwcGluZylcbiAgICogT2Z0ZW4sIHdlIHdvdWxkIGxpa2UgdG8gaW5qZWN0IGEgcmVmZXJlbmNlIG9uY2UsIGluIGEgYGJlZm9yZUVhY2goKWAgYmxvY2sgYW5kIHJldXNlIHRoaXNcbiAgICogaW4gbXVsdGlwbGUgYGl0KClgIGNsYXVzZXMuIFRvIGJlIGFibGUgdG8gZG8gdGhpcyB3ZSBtdXN0IGFzc2lnbiB0aGUgcmVmZXJlbmNlIHRvIGEgdmFyaWFibGVcbiAgICogdGhhdCBpcyBkZWNsYXJlZCBpbiB0aGUgc2NvcGUgb2YgdGhlIGBkZXNjcmliZSgpYCBibG9jay4gU2luY2Ugd2Ugd291bGQsIG1vc3QgbGlrZWx5LCB3YW50XG4gICAqIHRoZSB2YXJpYWJsZSB0byBoYXZlIHRoZSBzYW1lIG5hbWUgb2YgdGhlIHJlZmVyZW5jZSB3ZSBoYXZlIGEgcHJvYmxlbSwgc2luY2UgdGhlIHBhcmFtZXRlclxuICAgKiB0byB0aGUgYGluamVjdCgpYCBmdW5jdGlvbiB3b3VsZCBoaWRlIHRoZSBvdXRlciB2YXJpYWJsZS5cbiAgICpcbiAgICogVG8gaGVscCB3aXRoIHRoaXMsIHRoZSBpbmplY3RlZCBwYXJhbWV0ZXJzIGNhbiwgb3B0aW9uYWxseSwgYmUgZW5jbG9zZWQgd2l0aCB1bmRlcnNjb3Jlcy5cbiAgICogVGhlc2UgYXJlIGlnbm9yZWQgYnkgdGhlIGluamVjdG9yIHdoZW4gdGhlIHJlZmVyZW5jZSBuYW1lIGlzIHJlc29sdmVkLlxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgdGhlIHBhcmFtZXRlciBgX215U2VydmljZV9gIHdvdWxkIGJlIHJlc29sdmVkIGFzIHRoZSByZWZlcmVuY2UgYG15U2VydmljZWAuXG4gICAqIFNpbmNlIGl0IGlzIGF2YWlsYWJsZSBpbiB0aGUgZnVuY3Rpb24gYm9keSBhcyBfbXlTZXJ2aWNlXywgd2UgY2FuIHRoZW4gYXNzaWduIGl0IHRvIGEgdmFyaWFibGVcbiAgICogZGVmaW5lZCBpbiBhbiBvdXRlciBzY29wZS5cbiAgICpcbiAgICogYGBgXG4gICAqIC8vIERlZmluZWQgb3V0IHJlZmVyZW5jZSB2YXJpYWJsZSBvdXRzaWRlXG4gICAqIHZhciBteVNlcnZpY2U7XG4gICAqXG4gICAqIC8vIFdyYXAgdGhlIHBhcmFtZXRlciBpbiB1bmRlcnNjb3Jlc1xuICAgKiBiZWZvcmVFYWNoKCBpbmplY3QoIGZ1bmN0aW9uKF9teVNlcnZpY2VfKXtcbiAgICogICBteVNlcnZpY2UgPSBfbXlTZXJ2aWNlXztcbiAgICogfSkpO1xuICAgKlxuICAgKiAvLyBVc2UgbXlTZXJ2aWNlIGluIGEgc2VyaWVzIG9mIHRlc3RzLlxuICAgKiBpdCgnbWFrZXMgdXNlIG9mIG15U2VydmljZScsIGZ1bmN0aW9uKCkge1xuICAgKiAgIG15U2VydmljZS5kb1N0dWZmKCk7XG4gICAqIH0pO1xuICAgKlxuICAgKiBgYGBcbiAgICpcbiAgICogU2VlIGFsc28ge0BsaW5rIGFuZ3VsYXIubW9jay5tb2R1bGUgYW5ndWxhci5tb2NrLm1vZHVsZX1cbiAgICpcbiAgICogIyMgRXhhbXBsZVxuICAgKiBFeGFtcGxlIG9mIHdoYXQgYSB0eXBpY2FsIGphc21pbmUgdGVzdHMgbG9va3MgbGlrZSB3aXRoIHRoZSBpbmplY3QgbWV0aG9kLlxuICAgKiBgYGBqc1xuICAgKlxuICAgKiAgIGFuZ3VsYXIubW9kdWxlKCdteUFwcGxpY2F0aW9uTW9kdWxlJywgW10pXG4gICAqICAgICAgIC52YWx1ZSgnbW9kZScsICdhcHAnKVxuICAgKiAgICAgICAudmFsdWUoJ3ZlcnNpb24nLCAndjEuMC4xJyk7XG4gICAqXG4gICAqXG4gICAqICAgZGVzY3JpYmUoJ015QXBwJywgZnVuY3Rpb24oKSB7XG4gICAqXG4gICAqICAgICAvLyBZb3UgbmVlZCB0byBsb2FkIG1vZHVsZXMgdGhhdCB5b3Ugd2FudCB0byB0ZXN0LFxuICAgKiAgICAgLy8gaXQgbG9hZHMgb25seSB0aGUgXCJuZ1wiIG1vZHVsZSBieSBkZWZhdWx0LlxuICAgKiAgICAgYmVmb3JlRWFjaChtb2R1bGUoJ215QXBwbGljYXRpb25Nb2R1bGUnKSk7XG4gICAqXG4gICAqXG4gICAqICAgICAvLyBpbmplY3QoKSBpcyB1c2VkIHRvIGluamVjdCBhcmd1bWVudHMgb2YgYWxsIGdpdmVuIGZ1bmN0aW9uc1xuICAgKiAgICAgaXQoJ3Nob3VsZCBwcm92aWRlIGEgdmVyc2lvbicsIGluamVjdChmdW5jdGlvbihtb2RlLCB2ZXJzaW9uKSB7XG4gICAqICAgICAgIGV4cGVjdCh2ZXJzaW9uKS50b0VxdWFsKCd2MS4wLjEnKTtcbiAgICogICAgICAgZXhwZWN0KG1vZGUpLnRvRXF1YWwoJ2FwcCcpO1xuICAgKiAgICAgfSkpO1xuICAgKlxuICAgKlxuICAgKiAgICAgLy8gVGhlIGluamVjdCBhbmQgbW9kdWxlIG1ldGhvZCBjYW4gYWxzbyBiZSB1c2VkIGluc2lkZSBvZiB0aGUgaXQgb3IgYmVmb3JlRWFjaFxuICAgKiAgICAgaXQoJ3Nob3VsZCBvdmVycmlkZSBhIHZlcnNpb24gYW5kIHRlc3QgdGhlIG5ldyB2ZXJzaW9uIGlzIGluamVjdGVkJywgZnVuY3Rpb24oKSB7XG4gICAqICAgICAgIC8vIG1vZHVsZSgpIHRha2VzIGZ1bmN0aW9ucyBvciBzdHJpbmdzIChtb2R1bGUgYWxpYXNlcylcbiAgICogICAgICAgbW9kdWxlKGZ1bmN0aW9uKCRwcm92aWRlKSB7XG4gICAqICAgICAgICAgJHByb3ZpZGUudmFsdWUoJ3ZlcnNpb24nLCAnb3ZlcnJpZGRlbicpOyAvLyBvdmVycmlkZSB2ZXJzaW9uIGhlcmVcbiAgICogICAgICAgfSk7XG4gICAqXG4gICAqICAgICAgIGluamVjdChmdW5jdGlvbih2ZXJzaW9uKSB7XG4gICAqICAgICAgICAgZXhwZWN0KHZlcnNpb24pLnRvRXF1YWwoJ292ZXJyaWRkZW4nKTtcbiAgICogICAgICAgfSk7XG4gICAqICAgICB9KTtcbiAgICogICB9KTtcbiAgICpcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7Li4uRnVuY3Rpb259IGZucyBhbnkgbnVtYmVyIG9mIGZ1bmN0aW9ucyB3aGljaCB3aWxsIGJlIGluamVjdGVkIHVzaW5nIHRoZSBpbmplY3Rvci5cbiAgICovXG5cblxuXG4gIHZhciBFcnJvckFkZGluZ0RlY2xhcmF0aW9uTG9jYXRpb25TdGFjayA9IGZ1bmN0aW9uKGUsIGVycm9yRm9yU3RhY2spIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBlLm1lc3NhZ2U7XG4gICAgdGhpcy5uYW1lID0gZS5uYW1lO1xuICAgIGlmIChlLmxpbmUpIHRoaXMubGluZSA9IGUubGluZTtcbiAgICBpZiAoZS5zb3VyY2VJZCkgdGhpcy5zb3VyY2VJZCA9IGUuc291cmNlSWQ7XG4gICAgaWYgKGUuc3RhY2sgJiYgZXJyb3JGb3JTdGFjaylcbiAgICAgIHRoaXMuc3RhY2sgPSBlLnN0YWNrICsgJ1xcbicgKyBlcnJvckZvclN0YWNrLnN0YWNrO1xuICAgIGlmIChlLnN0YWNrQXJyYXkpIHRoaXMuc3RhY2tBcnJheSA9IGUuc3RhY2tBcnJheTtcbiAgfTtcbiAgRXJyb3JBZGRpbmdEZWNsYXJhdGlvbkxvY2F0aW9uU3RhY2sucHJvdG90eXBlLnRvU3RyaW5nID0gRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4gIHdpbmRvdy5pbmplY3QgPSBhbmd1bGFyLm1vY2suaW5qZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGJsb2NrRm5zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICB2YXIgZXJyb3JGb3JTdGFjayA9IG5ldyBFcnJvcignRGVjbGFyYXRpb24gTG9jYXRpb24nKTtcbiAgICByZXR1cm4gaXNTcGVjUnVubmluZygpID8gd29ya0ZuLmNhbGwoY3VycmVudFNwZWMpIDogd29ya0ZuO1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGZ1bmN0aW9uIHdvcmtGbigpIHtcbiAgICAgIHZhciBtb2R1bGVzID0gY3VycmVudFNwZWMuJG1vZHVsZXMgfHwgW107XG4gICAgICB2YXIgc3RyaWN0RGkgPSAhIWN1cnJlbnRTcGVjLiRpbmplY3RvclN0cmljdDtcbiAgICAgIG1vZHVsZXMudW5zaGlmdCgnbmdNb2NrJyk7XG4gICAgICBtb2R1bGVzLnVuc2hpZnQoJ25nJyk7XG4gICAgICB2YXIgaW5qZWN0b3IgPSBjdXJyZW50U3BlYy4kaW5qZWN0b3I7XG4gICAgICBpZiAoIWluamVjdG9yKSB7XG4gICAgICAgIGlmIChzdHJpY3REaSkge1xuICAgICAgICAgIC8vIElmIHN0cmljdERpIGlzIGVuYWJsZWQsIGFubm90YXRlIHRoZSBwcm92aWRlckluamVjdG9yIGJsb2Nrc1xuICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChtb2R1bGVzLCBmdW5jdGlvbihtb2R1bGVGbikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtb2R1bGVGbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgIGFuZ3VsYXIuaW5qZWN0b3IuJCRhbm5vdGF0ZShtb2R1bGVGbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaW5qZWN0b3IgPSBjdXJyZW50U3BlYy4kaW5qZWN0b3IgPSBhbmd1bGFyLmluamVjdG9yKG1vZHVsZXMsIHN0cmljdERpKTtcbiAgICAgICAgY3VycmVudFNwZWMuJGluamVjdG9yU3RyaWN0ID0gc3RyaWN0RGk7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBibG9ja0Zucy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgIGlmIChjdXJyZW50U3BlYy4kaW5qZWN0b3JTdHJpY3QpIHtcbiAgICAgICAgICAvLyBJZiB0aGUgaW5qZWN0b3IgaXMgc3RyaWN0IC8gc3RyaWN0RGksIGFuZCB0aGUgc3BlYyB3YW50cyB0byBpbmplY3QgdXNpbmcgYXV0b21hdGljXG4gICAgICAgICAgLy8gYW5ub3RhdGlvbiwgdGhlbiBhbm5vdGF0ZSB0aGUgZnVuY3Rpb24gaGVyZS5cbiAgICAgICAgICBpbmplY3Rvci5hbm5vdGF0ZShibG9ja0Zuc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvKiBqc2hpbnQgLVcwNDAgKi8vKiBKYXNtaW5lIGV4cGxpY2l0bHkgcHJvdmlkZXMgYSBgdGhpc2Agb2JqZWN0IHdoZW4gY2FsbGluZyBmdW5jdGlvbnMgKi9cbiAgICAgICAgICBpbmplY3Rvci5pbnZva2UoYmxvY2tGbnNbaV0gfHwgYW5ndWxhci5ub29wLCB0aGlzKTtcbiAgICAgICAgICAvKiBqc2hpbnQgK1cwNDAgKi9cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGlmIChlLnN0YWNrICYmIGVycm9yRm9yU3RhY2spIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvckFkZGluZ0RlY2xhcmF0aW9uTG9jYXRpb25TdGFjayhlLCBlcnJvckZvclN0YWNrKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBlcnJvckZvclN0YWNrID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuXG4gIGFuZ3VsYXIubW9jay5pbmplY3Quc3RyaWN0RGkgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHZhbHVlID0gYXJndW1lbnRzLmxlbmd0aCA/ICEhdmFsdWUgOiB0cnVlO1xuICAgIHJldHVybiBpc1NwZWNSdW5uaW5nKCkgPyB3b3JrRm4oKSA6IHdvcmtGbjtcblxuICAgIGZ1bmN0aW9uIHdvcmtGbigpIHtcbiAgICAgIGlmICh2YWx1ZSAhPT0gY3VycmVudFNwZWMuJGluamVjdG9yU3RyaWN0KSB7XG4gICAgICAgIGlmIChjdXJyZW50U3BlYy4kaW5qZWN0b3IpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luamVjdG9yIGFscmVhZHkgY3JlYXRlZCwgY2FuIG5vdCBtb2RpZnkgc3RyaWN0IGFubm90YXRpb25zJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VycmVudFNwZWMuJGluamVjdG9yU3RyaWN0ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cblxufSkod2luZG93LCB3aW5kb3cuYW5ndWxhcik7XG4iLCIvKipcbiAqIGFuZ3VsYXItc3Bpbm5lciB2ZXJzaW9uIDAuNS4xXG4gKiBMaWNlbnNlOiBNSVQuXG4gKiBDb3B5cmlnaHQgKEMpIDIwMTMsIDIwMTQsIFVyaSBTaGFrZWQgYW5kIGNvbnRyaWJ1dG9ycy5cbiAqL1xuXG4oZnVuY3Rpb24gKHJvb3QpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGZ1bmN0aW9uIGZhY3RvcnkoYW5ndWxhciwgU3Bpbm5lcikge1xuXG5cdFx0YW5ndWxhclxuXHRcdFx0Lm1vZHVsZSgnYW5ndWxhclNwaW5uZXInLCBbXSlcblxuXHRcdFx0LmZhY3RvcnkoJ3VzU3Bpbm5lclNlcnZpY2UnLCBbJyRyb290U2NvcGUnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSkge1xuXHRcdFx0XHR2YXIgY29uZmlnID0ge307XG5cblx0XHRcdFx0Y29uZmlnLnNwaW4gPSBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCd1cy1zcGlubmVyOnNwaW4nLCBrZXkpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGNvbmZpZy5zdG9wID0gZnVuY3Rpb24gKGtleSkge1xuXHRcdFx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgndXMtc3Bpbm5lcjpzdG9wJywga2V5KTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRyZXR1cm4gY29uZmlnO1xuXHRcdFx0fV0pXG5cblx0XHRcdC5kaXJlY3RpdmUoJ3VzU3Bpbm5lcicsIFsnJHdpbmRvdycsIGZ1bmN0aW9uICgkd2luZG93KSB7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0c2NvcGU6IHRydWUsXG5cdFx0XHRcdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRyKSB7XG5cdFx0XHRcdFx0XHR2YXIgU3Bpbm5lckNvbnN0cnVjdG9yID0gU3Bpbm5lciB8fCAkd2luZG93LlNwaW5uZXI7XG5cblx0XHRcdFx0XHRcdHNjb3BlLnNwaW5uZXIgPSBudWxsO1xuXG5cdFx0XHRcdFx0XHRzY29wZS5rZXkgPSBhbmd1bGFyLmlzRGVmaW5lZChhdHRyLnNwaW5uZXJLZXkpID8gYXR0ci5zcGlubmVyS2V5IDogZmFsc2U7XG5cblx0XHRcdFx0XHRcdHNjb3BlLnN0YXJ0QWN0aXZlID0gYW5ndWxhci5pc0RlZmluZWQoYXR0ci5zcGlubmVyU3RhcnRBY3RpdmUpID9cblx0XHRcdFx0XHRcdFx0YXR0ci5zcGlubmVyU3RhcnRBY3RpdmUgOiBzY29wZS5rZXkgP1xuXHRcdFx0XHRcdFx0XHRmYWxzZSA6IHRydWU7XG5cblx0XHRcdFx0XHRcdGZ1bmN0aW9uIHN0b3BTcGlubmVyKCkge1xuXHRcdFx0XHRcdFx0XHRpZiAoc2NvcGUuc3Bpbm5lcikge1xuXHRcdFx0XHRcdFx0XHRcdHNjb3BlLnNwaW5uZXIuc3RvcCgpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHNjb3BlLnNwaW4gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHRcdGlmIChzY29wZS5zcGlubmVyKSB7XG5cdFx0XHRcdFx0XHRcdFx0c2NvcGUuc3Bpbm5lci5zcGluKGVsZW1lbnRbMF0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0XHRzY29wZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0XHRzY29wZS5zdGFydEFjdGl2ZSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRzdG9wU3Bpbm5lcigpO1xuXHRcdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdFx0c2NvcGUuJHdhdGNoKGF0dHIudXNTcGlubmVyLCBmdW5jdGlvbiAob3B0aW9ucykge1xuXHRcdFx0XHRcdFx0XHRzdG9wU3Bpbm5lcigpO1xuXHRcdFx0XHRcdFx0XHRzY29wZS5zcGlubmVyID0gbmV3IFNwaW5uZXJDb25zdHJ1Y3RvcihvcHRpb25zKTtcblx0XHRcdFx0XHRcdFx0aWYgKCFzY29wZS5rZXkgfHwgc2NvcGUuc3RhcnRBY3RpdmUpIHtcblx0XHRcdFx0XHRcdFx0XHRzY29wZS5zcGlubmVyLnNwaW4oZWxlbWVudFswXSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0sIHRydWUpO1xuXG5cdFx0XHRcdFx0XHRzY29wZS4kb24oJ3VzLXNwaW5uZXI6c3BpbicsIGZ1bmN0aW9uIChldmVudCwga2V5KSB7XG5cdFx0XHRcdFx0XHRcdGlmIChrZXkgPT09IHNjb3BlLmtleSkge1xuXHRcdFx0XHRcdFx0XHRcdHNjb3BlLnNwaW4oKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdHNjb3BlLiRvbigndXMtc3Bpbm5lcjpzdG9wJywgZnVuY3Rpb24gKGV2ZW50LCBrZXkpIHtcblx0XHRcdFx0XHRcdFx0aWYgKGtleSA9PT0gc2NvcGUua2V5KSB7XG5cdFx0XHRcdFx0XHRcdFx0c2NvcGUuc3RvcCgpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0c2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdFx0c2NvcGUuc3RvcCgpO1xuXHRcdFx0XHRcdFx0XHRzY29wZS5zcGlubmVyID0gbnVsbDtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblx0XHRcdH1dKTtcblx0fVxuXG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHQvKiBBTUQgbW9kdWxlICovXG5cdFx0ZGVmaW5lKFsnYW5ndWxhcicsICdzcGluJ10sIGZhY3RvcnkpO1xuXHR9IGVsc2Uge1xuXHRcdC8qIEJyb3dzZXIgZ2xvYmFsICovXG5cdFx0ZmFjdG9yeShyb290LmFuZ3VsYXIpO1xuXHR9XG59KHdpbmRvdykpO1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxNCBGZWxpeCBHbmFzc1xuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKi9cbihmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG5cbiAgLyogQ29tbW9uSlMgKi9cbiAgaWYgKHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnKSAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KClcblxuICAvKiBBTUQgbW9kdWxlICovXG4gIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSBkZWZpbmUoZmFjdG9yeSlcblxuICAvKiBCcm93c2VyIGdsb2JhbCAqL1xuICBlbHNlIHJvb3QuU3Bpbm5lciA9IGZhY3RvcnkoKVxufVxuKHRoaXMsIGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgcHJlZml4ZXMgPSBbJ3dlYmtpdCcsICdNb3onLCAnbXMnLCAnTyddIC8qIFZlbmRvciBwcmVmaXhlcyAqL1xuICAgICwgYW5pbWF0aW9ucyA9IHt9IC8qIEFuaW1hdGlvbiBydWxlcyBrZXllZCBieSB0aGVpciBuYW1lICovXG4gICAgLCB1c2VDc3NBbmltYXRpb25zIC8qIFdoZXRoZXIgdG8gdXNlIENTUyBhbmltYXRpb25zIG9yIHNldFRpbWVvdXQgKi9cblxuICAvKipcbiAgICogVXRpbGl0eSBmdW5jdGlvbiB0byBjcmVhdGUgZWxlbWVudHMuIElmIG5vIHRhZyBuYW1lIGlzIGdpdmVuLFxuICAgKiBhIERJViBpcyBjcmVhdGVkLiBPcHRpb25hbGx5IHByb3BlcnRpZXMgY2FuIGJlIHBhc3NlZC5cbiAgICovXG4gIGZ1bmN0aW9uIGNyZWF0ZUVsKHRhZywgcHJvcCkge1xuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnIHx8ICdkaXYnKVxuICAgICAgLCBuXG5cbiAgICBmb3IobiBpbiBwcm9wKSBlbFtuXSA9IHByb3Bbbl1cbiAgICByZXR1cm4gZWxcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmRzIGNoaWxkcmVuIGFuZCByZXR1cm5zIHRoZSBwYXJlbnQuXG4gICAqL1xuICBmdW5jdGlvbiBpbnMocGFyZW50IC8qIGNoaWxkMSwgY2hpbGQyLCAuLi4qLykge1xuICAgIGZvciAodmFyIGk9MSwgbj1hcmd1bWVudHMubGVuZ3RoOyBpPG47IGkrKylcbiAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChhcmd1bWVudHNbaV0pXG5cbiAgICByZXR1cm4gcGFyZW50XG4gIH1cblxuICAvKipcbiAgICogSW5zZXJ0IGEgbmV3IHN0eWxlc2hlZXQgdG8gaG9sZCB0aGUgQGtleWZyYW1lIG9yIFZNTCBydWxlcy5cbiAgICovXG4gIHZhciBzaGVldCA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgZWwgPSBjcmVhdGVFbCgnc3R5bGUnLCB7dHlwZSA6ICd0ZXh0L2Nzcyd9KVxuICAgIGlucyhkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLCBlbClcbiAgICByZXR1cm4gZWwuc2hlZXQgfHwgZWwuc3R5bGVTaGVldFxuICB9KCkpXG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gb3BhY2l0eSBrZXlmcmFtZSBhbmltYXRpb24gcnVsZSBhbmQgcmV0dXJucyBpdHMgbmFtZS5cbiAgICogU2luY2UgbW9zdCBtb2JpbGUgV2Via2l0cyBoYXZlIHRpbWluZyBpc3N1ZXMgd2l0aCBhbmltYXRpb24tZGVsYXksXG4gICAqIHdlIGNyZWF0ZSBzZXBhcmF0ZSBydWxlcyBmb3IgZWFjaCBsaW5lL3NlZ21lbnQuXG4gICAqL1xuICBmdW5jdGlvbiBhZGRBbmltYXRpb24oYWxwaGEsIHRyYWlsLCBpLCBsaW5lcykge1xuICAgIHZhciBuYW1lID0gWydvcGFjaXR5JywgdHJhaWwsIH5+KGFscGhhKjEwMCksIGksIGxpbmVzXS5qb2luKCctJylcbiAgICAgICwgc3RhcnQgPSAwLjAxICsgaS9saW5lcyAqIDEwMFxuICAgICAgLCB6ID0gTWF0aC5tYXgoMSAtICgxLWFscGhhKSAvIHRyYWlsICogKDEwMC1zdGFydCksIGFscGhhKVxuICAgICAgLCBwcmVmaXggPSB1c2VDc3NBbmltYXRpb25zLnN1YnN0cmluZygwLCB1c2VDc3NBbmltYXRpb25zLmluZGV4T2YoJ0FuaW1hdGlvbicpKS50b0xvd2VyQ2FzZSgpXG4gICAgICAsIHByZSA9IHByZWZpeCAmJiAnLScgKyBwcmVmaXggKyAnLScgfHwgJydcblxuICAgIGlmICghYW5pbWF0aW9uc1tuYW1lXSkge1xuICAgICAgc2hlZXQuaW5zZXJ0UnVsZShcbiAgICAgICAgJ0AnICsgcHJlICsgJ2tleWZyYW1lcyAnICsgbmFtZSArICd7JyArXG4gICAgICAgICcwJXtvcGFjaXR5OicgKyB6ICsgJ30nICtcbiAgICAgICAgc3RhcnQgKyAnJXtvcGFjaXR5OicgKyBhbHBoYSArICd9JyArXG4gICAgICAgIChzdGFydCswLjAxKSArICcle29wYWNpdHk6MX0nICtcbiAgICAgICAgKHN0YXJ0K3RyYWlsKSAlIDEwMCArICcle29wYWNpdHk6JyArIGFscGhhICsgJ30nICtcbiAgICAgICAgJzEwMCV7b3BhY2l0eTonICsgeiArICd9JyArXG4gICAgICAgICd9Jywgc2hlZXQuY3NzUnVsZXMubGVuZ3RoKVxuXG4gICAgICBhbmltYXRpb25zW25hbWVdID0gMVxuICAgIH1cblxuICAgIHJldHVybiBuYW1lXG4gIH1cblxuICAvKipcbiAgICogVHJpZXMgdmFyaW91cyB2ZW5kb3IgcHJlZml4ZXMgYW5kIHJldHVybnMgdGhlIGZpcnN0IHN1cHBvcnRlZCBwcm9wZXJ0eS5cbiAgICovXG4gIGZ1bmN0aW9uIHZlbmRvcihlbCwgcHJvcCkge1xuICAgIHZhciBzID0gZWwuc3R5bGVcbiAgICAgICwgcHBcbiAgICAgICwgaVxuXG4gICAgcHJvcCA9IHByb3AuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwcm9wLnNsaWNlKDEpXG4gICAgZm9yKGk9MDsgaTxwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgcHAgPSBwcmVmaXhlc1tpXStwcm9wXG4gICAgICBpZihzW3BwXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcHBcbiAgICB9XG4gICAgaWYoc1twcm9wXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcHJvcFxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgbXVsdGlwbGUgc3R5bGUgcHJvcGVydGllcyBhdCBvbmNlLlxuICAgKi9cbiAgZnVuY3Rpb24gY3NzKGVsLCBwcm9wKSB7XG4gICAgZm9yICh2YXIgbiBpbiBwcm9wKVxuICAgICAgZWwuc3R5bGVbdmVuZG9yKGVsLCBuKXx8bl0gPSBwcm9wW25dXG5cbiAgICByZXR1cm4gZWxcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWxscyBpbiBkZWZhdWx0IHZhbHVlcy5cbiAgICovXG4gIGZ1bmN0aW9uIG1lcmdlKG9iaikge1xuICAgIGZvciAodmFyIGk9MTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGRlZiA9IGFyZ3VtZW50c1tpXVxuICAgICAgZm9yICh2YXIgbiBpbiBkZWYpXG4gICAgICAgIGlmIChvYmpbbl0gPT09IHVuZGVmaW5lZCkgb2JqW25dID0gZGVmW25dXG4gICAgfVxuICAgIHJldHVybiBvYmpcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBsaW5lIGNvbG9yIGZyb20gdGhlIGdpdmVuIHN0cmluZyBvciBhcnJheS5cbiAgICovXG4gIGZ1bmN0aW9uIGdldENvbG9yKGNvbG9yLCBpZHgpIHtcbiAgICByZXR1cm4gdHlwZW9mIGNvbG9yID09ICdzdHJpbmcnID8gY29sb3IgOiBjb2xvcltpZHggJSBjb2xvci5sZW5ndGhdXG4gIH1cblxuICAvLyBCdWlsdC1pbiBkZWZhdWx0c1xuXG4gIHZhciBkZWZhdWx0cyA9IHtcbiAgICBsaW5lczogMTIsICAgICAgICAgICAgLy8gVGhlIG51bWJlciBvZiBsaW5lcyB0byBkcmF3XG4gICAgbGVuZ3RoOiA3LCAgICAgICAgICAgIC8vIFRoZSBsZW5ndGggb2YgZWFjaCBsaW5lXG4gICAgd2lkdGg6IDUsICAgICAgICAgICAgIC8vIFRoZSBsaW5lIHRoaWNrbmVzc1xuICAgIHJhZGl1czogMTAsICAgICAgICAgICAvLyBUaGUgcmFkaXVzIG9mIHRoZSBpbm5lciBjaXJjbGVcbiAgICByb3RhdGU6IDAsICAgICAgICAgICAgLy8gUm90YXRpb24gb2Zmc2V0XG4gICAgY29ybmVyczogMSwgICAgICAgICAgIC8vIFJvdW5kbmVzcyAoMC4uMSlcbiAgICBjb2xvcjogJyMwMDAnLCAgICAgICAgLy8gI3JnYiBvciAjcnJnZ2JiXG4gICAgZGlyZWN0aW9uOiAxLCAgICAgICAgIC8vIDE6IGNsb2Nrd2lzZSwgLTE6IGNvdW50ZXJjbG9ja3dpc2VcbiAgICBzcGVlZDogMSwgICAgICAgICAgICAgLy8gUm91bmRzIHBlciBzZWNvbmRcbiAgICB0cmFpbDogMTAwLCAgICAgICAgICAgLy8gQWZ0ZXJnbG93IHBlcmNlbnRhZ2VcbiAgICBvcGFjaXR5OiAxLzQsICAgICAgICAgLy8gT3BhY2l0eSBvZiB0aGUgbGluZXNcbiAgICBmcHM6IDIwLCAgICAgICAgICAgICAgLy8gRnJhbWVzIHBlciBzZWNvbmQgd2hlbiB1c2luZyBzZXRUaW1lb3V0KClcbiAgICB6SW5kZXg6IDJlOSwgICAgICAgICAgLy8gVXNlIGEgaGlnaCB6LWluZGV4IGJ5IGRlZmF1bHRcbiAgICBjbGFzc05hbWU6ICdzcGlubmVyJywgLy8gQ1NTIGNsYXNzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudFxuICAgIHRvcDogJzUwJScsICAgICAgICAgICAvLyBjZW50ZXIgdmVydGljYWxseVxuICAgIGxlZnQ6ICc1MCUnLCAgICAgICAgICAvLyBjZW50ZXIgaG9yaXpvbnRhbGx5XG4gICAgcG9zaXRpb246ICdhYnNvbHV0ZScgIC8vIGVsZW1lbnQgcG9zaXRpb25cbiAgfVxuXG4gIC8qKiBUaGUgY29uc3RydWN0b3IgKi9cbiAgZnVuY3Rpb24gU3Bpbm5lcihvKSB7XG4gICAgdGhpcy5vcHRzID0gbWVyZ2UobyB8fCB7fSwgU3Bpbm5lci5kZWZhdWx0cywgZGVmYXVsdHMpXG4gIH1cblxuICAvLyBHbG9iYWwgZGVmYXVsdHMgdGhhdCBvdmVycmlkZSB0aGUgYnVpbHQtaW5zOlxuICBTcGlubmVyLmRlZmF1bHRzID0ge31cblxuICBtZXJnZShTcGlubmVyLnByb3RvdHlwZSwge1xuXG4gICAgLyoqXG4gICAgICogQWRkcyB0aGUgc3Bpbm5lciB0byB0aGUgZ2l2ZW4gdGFyZ2V0IGVsZW1lbnQuIElmIHRoaXMgaW5zdGFuY2UgaXMgYWxyZWFkeVxuICAgICAqIHNwaW5uaW5nLCBpdCBpcyBhdXRvbWF0aWNhbGx5IHJlbW92ZWQgZnJvbSBpdHMgcHJldmlvdXMgdGFyZ2V0IGIgY2FsbGluZ1xuICAgICAqIHN0b3AoKSBpbnRlcm5hbGx5LlxuICAgICAqL1xuICAgIHNwaW46IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgdGhpcy5zdG9wKClcblxuICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgICwgbyA9IHNlbGYub3B0c1xuICAgICAgICAsIGVsID0gc2VsZi5lbCA9IGNzcyhjcmVhdGVFbCgwLCB7Y2xhc3NOYW1lOiBvLmNsYXNzTmFtZX0pLCB7cG9zaXRpb246IG8ucG9zaXRpb24sIHdpZHRoOiAwLCB6SW5kZXg6IG8uekluZGV4fSlcblxuICAgICAgY3NzKGVsLCB7XG4gICAgICAgIGxlZnQ6IG8ubGVmdCxcbiAgICAgICAgdG9wOiBvLnRvcFxuICAgICAgfSlcbiAgICAgICAgXG4gICAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgIHRhcmdldC5pbnNlcnRCZWZvcmUoZWwsIHRhcmdldC5maXJzdENoaWxkfHxudWxsKVxuICAgICAgfVxuXG4gICAgICBlbC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAncHJvZ3Jlc3NiYXInKVxuICAgICAgc2VsZi5saW5lcyhlbCwgc2VsZi5vcHRzKVxuXG4gICAgICBpZiAoIXVzZUNzc0FuaW1hdGlvbnMpIHtcbiAgICAgICAgLy8gTm8gQ1NTIGFuaW1hdGlvbiBzdXBwb3J0LCB1c2Ugc2V0VGltZW91dCgpIGluc3RlYWRcbiAgICAgICAgdmFyIGkgPSAwXG4gICAgICAgICAgLCBzdGFydCA9IChvLmxpbmVzIC0gMSkgKiAoMSAtIG8uZGlyZWN0aW9uKSAvIDJcbiAgICAgICAgICAsIGFscGhhXG4gICAgICAgICAgLCBmcHMgPSBvLmZwc1xuICAgICAgICAgICwgZiA9IGZwcy9vLnNwZWVkXG4gICAgICAgICAgLCBvc3RlcCA9ICgxLW8ub3BhY2l0eSkgLyAoZipvLnRyYWlsIC8gMTAwKVxuICAgICAgICAgICwgYXN0ZXAgPSBmL28ubGluZXNcblxuICAgICAgICA7KGZ1bmN0aW9uIGFuaW0oKSB7XG4gICAgICAgICAgaSsrO1xuICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgby5saW5lczsgaisrKSB7XG4gICAgICAgICAgICBhbHBoYSA9IE1hdGgubWF4KDEgLSAoaSArIChvLmxpbmVzIC0gaikgKiBhc3RlcCkgJSBmICogb3N0ZXAsIG8ub3BhY2l0eSlcblxuICAgICAgICAgICAgc2VsZi5vcGFjaXR5KGVsLCBqICogby5kaXJlY3Rpb24gKyBzdGFydCwgYWxwaGEsIG8pXG4gICAgICAgICAgfVxuICAgICAgICAgIHNlbGYudGltZW91dCA9IHNlbGYuZWwgJiYgc2V0VGltZW91dChhbmltLCB+figxMDAwL2ZwcykpXG4gICAgICAgIH0pKClcbiAgICAgIH1cbiAgICAgIHJldHVybiBzZWxmXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0b3BzIGFuZCByZW1vdmVzIHRoZSBTcGlubmVyLlxuICAgICAqL1xuICAgIHN0b3A6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGVsID0gdGhpcy5lbFxuICAgICAgaWYgKGVsKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpXG4gICAgICAgIGlmIChlbC5wYXJlbnROb2RlKSBlbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVsKVxuICAgICAgICB0aGlzLmVsID0gdW5kZWZpbmVkXG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpc1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbnRlcm5hbCBtZXRob2QgdGhhdCBkcmF3cyB0aGUgaW5kaXZpZHVhbCBsaW5lcy4gV2lsbCBiZSBvdmVyd3JpdHRlblxuICAgICAqIGluIFZNTCBmYWxsYmFjayBtb2RlIGJlbG93LlxuICAgICAqL1xuICAgIGxpbmVzOiBmdW5jdGlvbihlbCwgbykge1xuICAgICAgdmFyIGkgPSAwXG4gICAgICAgICwgc3RhcnQgPSAoby5saW5lcyAtIDEpICogKDEgLSBvLmRpcmVjdGlvbikgLyAyXG4gICAgICAgICwgc2VnXG5cbiAgICAgIGZ1bmN0aW9uIGZpbGwoY29sb3IsIHNoYWRvdykge1xuICAgICAgICByZXR1cm4gY3NzKGNyZWF0ZUVsKCksIHtcbiAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICB3aWR0aDogKG8ubGVuZ3RoK28ud2lkdGgpICsgJ3B4JyxcbiAgICAgICAgICBoZWlnaHQ6IG8ud2lkdGggKyAncHgnLFxuICAgICAgICAgIGJhY2tncm91bmQ6IGNvbG9yLFxuICAgICAgICAgIGJveFNoYWRvdzogc2hhZG93LFxuICAgICAgICAgIHRyYW5zZm9ybU9yaWdpbjogJ2xlZnQnLFxuICAgICAgICAgIHRyYW5zZm9ybTogJ3JvdGF0ZSgnICsgfn4oMzYwL28ubGluZXMqaStvLnJvdGF0ZSkgKyAnZGVnKSB0cmFuc2xhdGUoJyArIG8ucmFkaXVzKydweCcgKycsMCknLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogKG8uY29ybmVycyAqIG8ud2lkdGg+PjEpICsgJ3B4J1xuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBmb3IgKDsgaSA8IG8ubGluZXM7IGkrKykge1xuICAgICAgICBzZWcgPSBjc3MoY3JlYXRlRWwoKSwge1xuICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgIHRvcDogMSt+KG8ud2lkdGgvMikgKyAncHgnLFxuICAgICAgICAgIHRyYW5zZm9ybTogby5od2FjY2VsID8gJ3RyYW5zbGF0ZTNkKDAsMCwwKScgOiAnJyxcbiAgICAgICAgICBvcGFjaXR5OiBvLm9wYWNpdHksXG4gICAgICAgICAgYW5pbWF0aW9uOiB1c2VDc3NBbmltYXRpb25zICYmIGFkZEFuaW1hdGlvbihvLm9wYWNpdHksIG8udHJhaWwsIHN0YXJ0ICsgaSAqIG8uZGlyZWN0aW9uLCBvLmxpbmVzKSArICcgJyArIDEvby5zcGVlZCArICdzIGxpbmVhciBpbmZpbml0ZSdcbiAgICAgICAgfSlcblxuICAgICAgICBpZiAoby5zaGFkb3cpIGlucyhzZWcsIGNzcyhmaWxsKCcjMDAwJywgJzAgMCA0cHggJyArICcjMDAwJyksIHt0b3A6IDIrJ3B4J30pKVxuICAgICAgICBpbnMoZWwsIGlucyhzZWcsIGZpbGwoZ2V0Q29sb3Ioby5jb2xvciwgaSksICcwIDAgMXB4IHJnYmEoMCwwLDAsLjEpJykpKVxuICAgICAgfVxuICAgICAgcmV0dXJuIGVsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEludGVybmFsIG1ldGhvZCB0aGF0IGFkanVzdHMgdGhlIG9wYWNpdHkgb2YgYSBzaW5nbGUgbGluZS5cbiAgICAgKiBXaWxsIGJlIG92ZXJ3cml0dGVuIGluIFZNTCBmYWxsYmFjayBtb2RlIGJlbG93LlxuICAgICAqL1xuICAgIG9wYWNpdHk6IGZ1bmN0aW9uKGVsLCBpLCB2YWwpIHtcbiAgICAgIGlmIChpIDwgZWwuY2hpbGROb2Rlcy5sZW5ndGgpIGVsLmNoaWxkTm9kZXNbaV0uc3R5bGUub3BhY2l0eSA9IHZhbFxuICAgIH1cblxuICB9KVxuXG5cbiAgZnVuY3Rpb24gaW5pdFZNTCgpIHtcblxuICAgIC8qIFV0aWxpdHkgZnVuY3Rpb24gdG8gY3JlYXRlIGEgVk1MIHRhZyAqL1xuICAgIGZ1bmN0aW9uIHZtbCh0YWcsIGF0dHIpIHtcbiAgICAgIHJldHVybiBjcmVhdGVFbCgnPCcgKyB0YWcgKyAnIHhtbG5zPVwidXJuOnNjaGVtYXMtbWljcm9zb2Z0LmNvbTp2bWxcIiBjbGFzcz1cInNwaW4tdm1sXCI+JywgYXR0cilcbiAgICB9XG5cbiAgICAvLyBObyBDU1MgdHJhbnNmb3JtcyBidXQgVk1MIHN1cHBvcnQsIGFkZCBhIENTUyBydWxlIGZvciBWTUwgZWxlbWVudHM6XG4gICAgc2hlZXQuYWRkUnVsZSgnLnNwaW4tdm1sJywgJ2JlaGF2aW9yOnVybCgjZGVmYXVsdCNWTUwpJylcblxuICAgIFNwaW5uZXIucHJvdG90eXBlLmxpbmVzID0gZnVuY3Rpb24oZWwsIG8pIHtcbiAgICAgIHZhciByID0gby5sZW5ndGgrby53aWR0aFxuICAgICAgICAsIHMgPSAyKnJcblxuICAgICAgZnVuY3Rpb24gZ3JwKCkge1xuICAgICAgICByZXR1cm4gY3NzKFxuICAgICAgICAgIHZtbCgnZ3JvdXAnLCB7XG4gICAgICAgICAgICBjb29yZHNpemU6IHMgKyAnICcgKyBzLFxuICAgICAgICAgICAgY29vcmRvcmlnaW46IC1yICsgJyAnICsgLXJcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB7IHdpZHRoOiBzLCBoZWlnaHQ6IHMgfVxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIHZhciBtYXJnaW4gPSAtKG8ud2lkdGgrby5sZW5ndGgpKjIgKyAncHgnXG4gICAgICAgICwgZyA9IGNzcyhncnAoKSwge3Bvc2l0aW9uOiAnYWJzb2x1dGUnLCB0b3A6IG1hcmdpbiwgbGVmdDogbWFyZ2lufSlcbiAgICAgICAgLCBpXG5cbiAgICAgIGZ1bmN0aW9uIHNlZyhpLCBkeCwgZmlsdGVyKSB7XG4gICAgICAgIGlucyhnLFxuICAgICAgICAgIGlucyhjc3MoZ3JwKCksIHtyb3RhdGlvbjogMzYwIC8gby5saW5lcyAqIGkgKyAnZGVnJywgbGVmdDogfn5keH0pLFxuICAgICAgICAgICAgaW5zKGNzcyh2bWwoJ3JvdW5kcmVjdCcsIHthcmNzaXplOiBvLmNvcm5lcnN9KSwge1xuICAgICAgICAgICAgICAgIHdpZHRoOiByLFxuICAgICAgICAgICAgICAgIGhlaWdodDogby53aWR0aCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBvLnJhZGl1cyxcbiAgICAgICAgICAgICAgICB0b3A6IC1vLndpZHRoPj4xLFxuICAgICAgICAgICAgICAgIGZpbHRlcjogZmlsdGVyXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICB2bWwoJ2ZpbGwnLCB7Y29sb3I6IGdldENvbG9yKG8uY29sb3IsIGkpLCBvcGFjaXR5OiBvLm9wYWNpdHl9KSxcbiAgICAgICAgICAgICAgdm1sKCdzdHJva2UnLCB7b3BhY2l0eTogMH0pIC8vIHRyYW5zcGFyZW50IHN0cm9rZSB0byBmaXggY29sb3IgYmxlZWRpbmcgdXBvbiBvcGFjaXR5IGNoYW5nZVxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgfVxuXG4gICAgICBpZiAoby5zaGFkb3cpXG4gICAgICAgIGZvciAoaSA9IDE7IGkgPD0gby5saW5lczsgaSsrKVxuICAgICAgICAgIHNlZyhpLCAtMiwgJ3Byb2dpZDpEWEltYWdlVHJhbnNmb3JtLk1pY3Jvc29mdC5CbHVyKHBpeGVscmFkaXVzPTIsbWFrZXNoYWRvdz0xLHNoYWRvd29wYWNpdHk9LjMpJylcblxuICAgICAgZm9yIChpID0gMTsgaSA8PSBvLmxpbmVzOyBpKyspIHNlZyhpKVxuICAgICAgcmV0dXJuIGlucyhlbCwgZylcbiAgICB9XG5cbiAgICBTcGlubmVyLnByb3RvdHlwZS5vcGFjaXR5ID0gZnVuY3Rpb24oZWwsIGksIHZhbCwgbykge1xuICAgICAgdmFyIGMgPSBlbC5maXJzdENoaWxkXG4gICAgICBvID0gby5zaGFkb3cgJiYgby5saW5lcyB8fCAwXG4gICAgICBpZiAoYyAmJiBpK28gPCBjLmNoaWxkTm9kZXMubGVuZ3RoKSB7XG4gICAgICAgIGMgPSBjLmNoaWxkTm9kZXNbaStvXTsgYyA9IGMgJiYgYy5maXJzdENoaWxkOyBjID0gYyAmJiBjLmZpcnN0Q2hpbGRcbiAgICAgICAgaWYgKGMpIGMub3BhY2l0eSA9IHZhbFxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHZhciBwcm9iZSA9IGNzcyhjcmVhdGVFbCgnZ3JvdXAnKSwge2JlaGF2aW9yOiAndXJsKCNkZWZhdWx0I1ZNTCknfSlcblxuICBpZiAoIXZlbmRvcihwcm9iZSwgJ3RyYW5zZm9ybScpICYmIHByb2JlLmFkaikgaW5pdFZNTCgpXG4gIGVsc2UgdXNlQ3NzQW5pbWF0aW9ucyA9IHZlbmRvcihwcm9iZSwgJ2FuaW1hdGlvbicpXG5cbiAgcmV0dXJuIFNwaW5uZXJcblxufSkpO1xuIiwiZXhwb3J0cy5BREQgPSAnQUREJztcbmV4cG9ydHMuUkVNT1ZFID0gJ1JFTU9WRSc7XG5leHBvcnRzLkNMRUFSID0gJ0NMRUFSJztcbmV4cG9ydHMuVE9HR0xFID0gJ1RPR0dMRSc7XG5leHBvcnRzLlRPR0dMRV9BTEwgPSAnVE9HR0xFX0FMTCc7XG5leHBvcnRzLlJFRlJFU0ggPSAnUkVGUkVTSCc7XG5cblxuXG4iLCIndXNlIHN0cmljdCc7XG5yZXF1aXJlKCcuL2NvbmZpZy9Fc2lIdHRwSW50ZXJjZXB0b3InKTtcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMnKTtcbnJlcXVpcmUoJy4vZGlyZWN0aXZlcycpO1xucmVxdWlyZSgnLi9maWx0ZXJzJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2VzJyk7XG5yZXF1aXJlKCcuL3N0b3JlcycpO1xucmVxdWlyZSgnLi9kaXNwYXRjaGVycycpO1xud2luZG93LlNwaW5uZXIgPSByZXF1aXJlKCcuLi9ib3dlcl9jb21wb25lbnRzL3NwaW4uanMvc3BpbicpO1xucmVxdWlyZSgnLi4vYm93ZXJfY29tcG9uZW50cy9hbmd1bGFyLXNwaW5uZXIvYW5ndWxhci1zcGlubmVyJyk7XG5cblxudmFyIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ2dldHRleHQnLCAnYW5ndWxhclNwaW5uZXInLFxuJ3VpLnJvdXRlcicsXG4nZXNpLmZpbHRlcnMnLFxuJ2VzaS5kaXJlY3RpdmVzJywgXG4nZXNpLmNvbnRyb2xsZXJzJyxcbidlc2kuc2VydmljZXMnLFxuJ2VzaS5zdG9yZXMnLFxuJ2VzaS5kaXNwYXRjaGVycycsXG4nZXNpLkVzaUh0dHBJbnRlcmNlcHRvcidcbl0pO1xuXG5cbm1vZHVsZS5jb25maWcoWyckc3RhdGVQcm92aWRlcicsICckdXJsUm91dGVyUHJvdmlkZXInLCAnJHByb3ZpZGUnLCAnJGxvY2F0aW9uUHJvdmlkZXInLFxuICAgICAgIGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRwcm92aWRlLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgICAgICAgICAgXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKGZhbHNlKTtcbiAgICBcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvdG9kby9hbGwnKTtcblxuICAgIFxuICAgICRwcm92aWRlLmRlY29yYXRvcihcIiRleGNlcHRpb25IYW5kbGVyXCIsIFsnJGRlbGVnYXRlJywgJyRpbmplY3RvcicsIGZ1bmN0aW9uKCRkZWxlZ2F0ZSwgJGluamVjdG9yICkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZXhjZXB0aW9uLCBjYXVzZSkge1xuICAgICAgICAgICAgaWYgKGV4Y2VwdGlvbi5tZXNzYWdlID09PSBcIlNlc3Npb25FeHBpcmVkRXhjZXB0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAkaW5qZWN0b3IuZ2V0KCckc3RhdGUnKS50cmFuc2l0aW9uVG8oJ2Vycm9yJywge21lc3NhZ2U6IFwiU2Vzc2lvbiBoYXMgRXhwaXJlZFwifSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZihleGNlcHRpb24ubWVzc2FnZSA9PT0gXCJTeXN0ZW1FcnJvclwiKXtcbiAgICAgICAgICAgICAgICAkaW5qZWN0b3IuZ2V0KCckc3RhdGUnKS50cmFuc2l0aW9uVG8oJ2Vycm9yJywge21lc3NhZ2U6IFwiU29ycnksIGFuIGVycm9yIGhhcyBvY2N1cmVkXCJ9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAkZGVsZWdhdGUoZXhjZXB0aW9uLCBjYXVzZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFRPRE8gQU06IGxvZyBleGNlcHRpb25zIG9uIHRoZSBzZXJ2ZXJcbiAgICAgICAgfTtcbiAgICB9XSk7XG4gICAgXG4gICAgXG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgICAgXG5cbiAgICAgICAgLnN0YXRlKCd0b2RvJywge1xuICAgICAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgICAgICB1cmw6IFwiL3RvZG9cIixcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFwiVG9kb0N0cmxcIixcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcIi90ZW1wbGF0ZXMvdG9kby5odG1sXCJcbiAgICAgICAgfSlcbiAgICAgICAgLnN0YXRlKCd0b2RvLmFsbCcsIHtcbiAgICAgICAgICAgIHVybDogXCIvYWxsXCIsXG4gICAgICAgICAgICBmaWx0ZXI6ICdnZXRJdGVtcydcbiAgICAgICAgfSlcbiAgICAgICAgLnN0YXRlKCd0b2RvLmFjdGl2ZScsIHtcbiAgICAgICAgICAgIHVybDogXCIvYWN0aXZlXCIsXG4gICAgICAgICAgICBmaWx0ZXI6ICdnZXRBY3RpdmUnXG4gICAgICAgIH0pXG4gICAgICAgIC5zdGF0ZSgndG9kby5jb21wbGV0ZWQnLCB7XG4gICAgICAgICAgICB1cmw6IFwiL2NvbXBsZXRlZFwiLFxuICAgICAgICAgICAgZmlsdGVyOiAnZ2V0Q29tcGxldGVkJ1xuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC5zdGF0ZSgnZXJyb3InLCB7XG4gICAgICAgICAgICB1cmw6IFwiL2Vycm9yLzptZXNzYWdlXCIsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogXCI8aDIgY2xhc3M9J2Vycm9yJz57e21lc3NhZ2V9fTwvaDI+XCIsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXCIkc2NvcGVcIiwgXCIkc3RhdGVQYXJhbXNcIiwgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGVQYXJhbXMpe1xuICAgICAgICAgICAgICAgICRzY29wZS5tZXNzYWdlID0gJHN0YXRlUGFyYW1zLm1lc3NhZ2U7XG4gICAgICAgICAgICB9XVxuICAgICAgICB9KTtcblxuICAgIH1dKTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuLyoqIFxuICogcmVnaXN0ZXIgdGhlIHJlc3BvbnNlIGludGVyY2VwdG9yIHRvIGhhbmRsZSBlcnJvciBtZXNzYWdlcyBhbmQgJ2xvYWRpbmcnIGluZGljYXRvclxuICovXG52YXIgbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ2VzaS5Fc2lIdHRwSW50ZXJjZXB0b3InLCBbXSk7XG5cbm1vZHVsZS5jb25maWcoWyckaHR0cFByb3ZpZGVyJywgZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICBcbiAgICB2YXIgaW50ZXJjZXB0b3IgPSBbJyRxJywgJ0Vycm9yRGlzcGxheVNlcnZpY2UnLCAnJGluamVjdG9yJywndXNTcGlubmVyU2VydmljZScsXG4gICAgICAgIGZ1bmN0aW9uICgkcSwgRXJyb3JEaXNwbGF5U2VydmljZSwgJGluamVjdG9yLCB1c1NwaW5uZXJTZXJ2aWNlKSB7XG4gICAgICAgIHZhciAkaHR0cDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlcXVlc3QgOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBzaG93ICdsb2FkaW5nJyBpbmRpY2F0b3JcbiAgICAgICAgICAgICAgICB1c1NwaW5uZXJTZXJ2aWNlLnNwaW4oJ2dsb2JhbC1zcGlubmVyJyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZyB8fCAkcS53aGVuKGNvbmZpZyk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgcmVzcG9uc2UgOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIGhpZGUgZXJyb3IgbWVzc2FnZVxuICAgICAgICAgICAgICAgIEVycm9yRGlzcGxheVNlcnZpY2UuZGlzcGxheUVycm9yKG51bGwpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIGxhemlseSBpbml0aWFsaXplICRodHRwIHZhcmlhYmxlXG4gICAgICAgICAgICAgICAgJGh0dHAgPSAkaHR0cCB8fCAkaW5qZWN0b3IuZ2V0KCckaHR0cCcpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIGhpZGUgJ2xvYWRpbmcnIGluZGljYXRvclxuICAgICAgICAgICAgICAgIGlmICgkaHR0cC5wZW5kaW5nUmVxdWVzdHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgdXNTcGlubmVyU2VydmljZS5zdG9wKCdnbG9iYWwtc3Bpbm5lcicpO1xuICAgICAgICAgICAgICAgIH0gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UgfHwgJHEud2hlbihyZXNwb25zZSk7XG4gICAgICAgICAgICB9LFxuICAgIFxuICAgICAgICAgICAgcmVzcG9uc2VFcnJvciA6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEpe1xuICAgICAgICAgICAgICAgICAgICAgICAgRXJyb3JEaXNwbGF5U2VydmljZS5kaXNwbGF5RXJyb3IocmVzcG9uc2UuZGF0YS5lcnJvckNvZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Nlc3Npb25FeHBpcmVkRXhjZXB0aW9uJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKHJlc3BvbnNlLnN0YXR1cyA+PSA1MDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTeXN0ZW1FcnJvcicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBsYXppbHkgaW5pdGlhbGl6ZSAkaHR0cCB2YXJpYWJsZVxuICAgICAgICAgICAgICAgICRodHRwID0gJGh0dHAgfHwgJGluamVjdG9yLmdldCgnJGh0dHAnKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBoaWRlICdsb2FkaW5nJyBpbmRpY2F0b3JcbiAgICAgICAgICAgICAgICBpZiAoJGh0dHAucGVuZGluZ1JlcXVlc3RzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgIHVzU3Bpbm5lclNlcnZpY2Uuc3RvcCgnZ2xvYmFsLXNwaW5uZXInKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07ICAgICAgICBcbiAgICB9XTtcbiAgICBcbiAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKGludGVyY2VwdG9yKTtcbiAgICBcbn1dKTsiLCIndXNlIHN0cmljdCc7XG52YXIgdXVpZCA9IHJlcXVpcmUoJ25vZGUtdXVpZCcpO1xudmFyIGFjdGlvbnMgPSByZXF1aXJlKCcuLi9hY3Rpb25zJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gVG9kb0N0cmw7XG5cblRvZG9DdHJsLiRpbmplY3QgPSBbJyRzY29wZScsICckc3RhdGUnLCAnRGlzcGF0Y2hlcicsICdFcnJvckRpc3BsYXlTZXJ2aWNlJywgJ1RvZG9TdG9yZScsICdVbmRvRGlzcGF0Y2hlciddO1xuXG5mdW5jdGlvbiBUb2RvQ3RybCgkc2NvcGUsICRzdGF0ZSwgRGlzcGF0Y2hlciwgRXJyb3JEaXNwbGF5U2VydmljZSwgVG9kb1N0b3JlLCBVbmRvRGlzcGF0Y2hlcil7XG4gICAgXG4gICAgJHNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlKXtcbiAgICAgICAgJHNjb3BlLnRvZG9zID0gVG9kb1N0b3JlW3RvU3RhdGUuZmlsdGVyXSgpO1xuICAgIH0pO1xuICAgIFxuICAgIGZ1bmN0aW9uIGhhbmRsZUNoYW5nZSgpe1xuICAgICAgICAkc2NvcGUudG9kb3MgPSBUb2RvU3RvcmVbJHN0YXRlLmN1cnJlbnQuZmlsdGVyXSgpO1xuICAgICAgICAkc2NvcGUudG90YWxDb3VudCA9IFRvZG9TdG9yZS5nZXRUb3RhbENvdW50KCk7XG4gICAgICAgICRzY29wZS5hY3RpdmVDb3VudCA9IFRvZG9TdG9yZS5nZXRBY3RpdmVDb3VudCgpO1xuICAgICAgICAkc2NvcGUuY29tcGxldGVkQ291bnQgPSBUb2RvU3RvcmUuZ2V0Q29tcGxldGVkQ291bnQoKTtcbiAgICAgICAgJHNjb3BlLm5ld1RvZG8gPSBudWxsO1xuICAgIH1cbiAgICAvLyBsb2FkIGluaXRpYWwgc3RhdGVcbiAgICBoYW5kbGVDaGFuZ2UoKTtcbiAgICBcbiAgICBUb2RvU3RvcmUub25DaGFuZ2UoaGFuZGxlQ2hhbmdlKTtcbiAgICBcbiAgICAkc2NvcGUucmVtb3ZlID0gZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgIERpc3BhdGNoZXIuZW1pdChhY3Rpb25zLlJFTU9WRSwgaXRlbSk7XG4gICAgfTtcblxuICAgICRzY29wZS50b2dnbGUgPSBmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgRGlzcGF0Y2hlci5lbWl0KGFjdGlvbnMuVE9HR0xFLCBpdGVtKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmNsZWFyQ29tcGxldGVkID0gZnVuY3Rpb24oKXtcbiAgICAgICAgRGlzcGF0Y2hlci5lbWl0KGFjdGlvbnMuQ0xFQVIsIFRvZG9TdG9yZS5nZXRDb21wbGV0ZWQoKSk7XG4gICAgICAgIGlmKCRzdGF0ZS4kY3VycmVudC5uYW1lID09PSAndG9kby5jb21wbGV0ZWQnKXtcbiAgICAgICAgICAgICRzdGF0ZS5nbygndG9kby5hbGwnKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkc2NvcGUuYWRkID0gZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICBcbiAgICAgICAgaWYoZXZlbnQua2V5Q29kZSA9PT0gMTMgJiYgIV8uaXNFbXB0eSgkc2NvcGUubmV3VG9kbykpe1xuICAgICAgICAgICAgdmFyIHRvZG8gPSB7XG4gICAgICAgICAgICAgICAgaWQ6IHV1aWQudjEoKSxcbiAgICAgICAgICAgICAgICBuYW1lOiAkc2NvcGUubmV3VG9kbyxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZWQ6IGZhbHNlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgRGlzcGF0Y2hlci5lbWl0KGFjdGlvbnMuQURELCB0b2RvKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIFxuICAgIH07XG4gICAgXG4gICAgJHNjb3BlLmhpZGVFcnJvciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIEVycm9yRGlzcGxheVNlcnZpY2UuZGlzcGxheUVycm9yKG51bGwpO1xuICAgIH07XG4gICAgXG4gICAgJHNjb3BlLnVuZG8gPSBmdW5jdGlvbigpe1xuICAgICAgICBVbmRvRGlzcGF0Y2hlci51bmRvKCk7XG4gICAgfTtcbiAgICBcbiAgICAkc2NvcGUucmVkbyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIFVuZG9EaXNwYXRjaGVyLnJlZG8oKTtcbiAgICB9O1xuICAgIFxuICAgICRzY29wZS5oYXNVbmRvID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIFVuZG9EaXNwYXRjaGVyLmhhc1VuZG8oKTtcbiAgICB9O1xuICAgIFxuICAgICRzY29wZS5oYXNSZWRvID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIFVuZG9EaXNwYXRjaGVyLmhhc1JlZG8oKTtcbiAgICB9O1xufSIsIid1c2Ugc3RyaWN0JztcblxudmFyIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCdlc2kuY29udHJvbGxlcnMnLCBbXSk7XG5cbm1vZHVsZS5jb250cm9sbGVyKFwiVG9kb0N0cmxcIiwgcmVxdWlyZShcIi4vVG9kb0N0cmxcIikpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGVzaUFjdGl2ZTtcbiAgICAgICAgXG4gICAgXG4vKiogJ2VzaS1hY2l2ZScgYXR0cmlidXRlIGNhbiBiZSBhZGRlZCB0byBsaW5rcyBpbiBvcmRlciB0byBzdHlsZSB0aGVtIHdpdGggJ3NlbGVjdGVkJyBjbGFzcyB3aGVuXG4gKiBjdXJyZW50IGxvY2F0aW9uIHBhdGggbWF0Y2hlcyB0aGUgdmFsdWUgb2YgdGhlIGxpbmsncyBocmVmLlxuICogXG4gKiBGb3IgZXhhbXBsZTpcbiAqIDxhIGhyZWY9XCIvbWVtYmVyL2FjdGl2aXR5XCIgZXNpLWFjdGl2ZSA+YWN0aXZpdHk8L2E+XG4gKiB3aWxsIGdldCBjbGFzcz0nYWN0aXZlJyBpZiBjdXJyZW50IGxvY2F0aW9uIHN0YXJ0cyB3aXRoICcvbWVtYmVyL2FjdGl2aXR5J1xuICpcbiAqIE5vdGU6ICcvZW4nIG9yICcvZnInIGxhbmd1YWdlIGNvbnRleHQgb3IgJyMnIG9yICcjIScgaGFzaGJhbmcgbW9kZSB3aWxsIGJlIGlnbm9yb2VkLCBzb1xuICogPGEgaHJlZj1cIi9mci9tZW1iZXIvYWN0aXZpdHlcIiBlc2ktYWN0aXZlID5hY3Rpdml0eTwvYT5cbiAqIHdpbGwgZ2V0IGNsYXNzPSdhY3RpdmUnIGlmIGN1cnJlbnQgbG9jYXRpb24gc3RhcnRzIHdpdGggJy9tZW1iZXIvYWN0aXZpdHknXG4gKlxuICogSXQgaXMgcG9zc2libGUgdG8gb3ZlcnJpZGUgaHJlZiB2YWx1ZSBieSBwcm92aWRpbmcgYSB2YWx1ZSB0byAnZXNpLWFjaXZlJyBhdHRyaWJ1dGVcbiAqIFxuICogRm9yIGV4YW1wbGU6XG4gKiA8YSBocmVmPVwiL21lbWJlci9hY3Rpdml0eVwiIGVzaS1hY3RpdmU9Jy9tZW1iZXInID5tZW1iZXI8L2E+XG4gKiB3aWxsIGJlICdhY3RpdmUnIGlmIGN1cnJlbnQgbG9jYXRpb24gc3RhcnRzIHdpdGggJy9tZW1iZXInXG4gKlxuICovXG5lc2lBY3RpdmUuJGluamVjdCA9IFsnJGxvY2F0aW9uJ107XG5mdW5jdGlvbiBlc2lBY3RpdmUoJGxvY2F0aW9uKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbG0sIGF0dHJzKSB7XG4gICAgICAgIFxuICAgICAgICAvLyBpZiBlc2ktYWN0aXZlIGF0dHJpYnV0ZSB2YWx1ZSBpcyBub3QgcHJvdmlkZWQgLSB1c2UgaHJlZiBidXQgd2l0aG91dCB0aGUgJy9lbicgb3IgJy9mcicgb3IgJyMnIG9yICcjIScgcHJlZml4XG4gICAgICAgIHZhciBocmVmID0gYXR0cnMuZXNpQWN0aXZlIHx8IGF0dHJzLmhyZWYucmVwbGFjZSgvXig/OlxcL2VuXFwvKXwoPzpcXC9mclxcLyl8KD86IyE/XFwvKS8sICcvJyk7XG4gICAgICAgIFxuICAgICAgICBzY29wZS4kd2F0Y2goXG4gICAgICAgICAgICBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJldHVybiAkbG9jYXRpb24ucGF0aCgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZnVuY3Rpb24ocGF0aCkge1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLm1hdGNoKGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICBlbG0uYWRkQ2xhc3MoXCJzZWxlY3RlZFwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgZWxtLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH07XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ2VzaS5kaXJlY3RpdmVzJywgW10pO1xuXG5tb2R1bGUuZGlyZWN0aXZlKCdlc2lBY3RpdmUnLCByZXF1aXJlKCcuL2VzaUFjdGl2ZScpKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjInKS5FdmVudEVtaXR0ZXIyO1xudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gVW5kb0Rpc3BhdGNoZXI7XG5VbmRvRGlzcGF0Y2hlci4kaW5qZWN0ID0gWydEaXNwYXRjaGVyJ107XG5cbmZ1bmN0aW9uIFVuZG9EaXNwYXRjaGVyKERpc3BhdGNoZXIpe1xuICAgIFxuICAgIHZhciB1bmRvUXVldWUgPSBbXTtcbiAgICB2YXIgcmVkb1F1ZXVlID0gW107XG4gICAgXG4gICAgRGlzcGF0Y2hlci5vbkFueShmdW5jdGlvbihwYXlsb2FkLCBpc1JlZG8pIHtcbiAgICAgICAgdW5kb1F1ZXVlLnB1c2goe2FjdGlvbjogdGhpcy5ldmVudCwgcGF5bG9hZDogcGF5bG9hZH0pO1xuICAgICAgICBpZighaXNSZWRvKXtcbiAgICAgICAgICAgIHJlZG9RdWV1ZSA9IFtdO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgLy8gZXh0ZW5kIEV2ZW50RW1pdHRlclxuICAgIHV0aWwuaW5oZXJpdHMoVW5kb0VtaXR0ZXIsIEV2ZW50RW1pdHRlcik7XG4gICAgZnVuY3Rpb24gVW5kb0VtaXR0ZXIgKCl7XG4gICAgICAgIC8vY2FsbCBzdXBlciBjb25zdHJ1Y3RvclxuICAgICAgICBFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcbiAgICB9XG4gICAgXG4gICAgVW5kb0VtaXR0ZXIucHJvdG90eXBlLnVuZG8gPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgZXZlbnQgPSB1bmRvUXVldWUucG9wKCk7XG4gICAgICAgIHJlZG9RdWV1ZS5wdXNoKGV2ZW50KTtcbiAgICAgICAgdGhpcy5lbWl0KGV2ZW50LmFjdGlvbiwgYW5ndWxhci5jb3B5KGV2ZW50LnBheWxvYWQpKTtcbiAgICB9O1xuXG4gICAgVW5kb0VtaXR0ZXIucHJvdG90eXBlLnJlZG8gPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgZXZlbnQgPSByZWRvUXVldWUucG9wKCk7XG4gICAgICAgIERpc3BhdGNoZXIuZW1pdChldmVudC5hY3Rpb24sIGFuZ3VsYXIuY29weShldmVudC5wYXlsb2FkKSwgdHJ1ZSk7XG4gICAgfTtcbiAgICBcbiAgICBVbmRvRW1pdHRlci5wcm90b3R5cGUuaGFzVW5kbyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiB1bmRvUXVldWUubGVuZ3RoID4gMDtcbiAgICB9O1xuICAgIFxuICAgIFVuZG9FbWl0dGVyLnByb3RvdHlwZS5oYXNSZWRvID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHJlZG9RdWV1ZS5sZW5ndGggPiAwO1xuICAgIH07XG4gICAgXG4gICAgcmV0dXJuIG5ldyBVbmRvRW1pdHRlcigpO1xuICAgIFxufVxuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjInKS5FdmVudEVtaXR0ZXIyO1xuXG52YXIgbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ2VzaS5kaXNwYXRjaGVycycsIFtdKTtcblxubW9kdWxlLnZhbHVlKCdEaXNwYXRjaGVyJywgbmV3IEV2ZW50RW1pdHRlcigpKTtcbm1vZHVsZS5mYWN0b3J5KFwiVW5kb0Rpc3BhdGNoZXJcIiwgcmVxdWlyZShcIi4vVW5kb0Rpc3BhdGNoZXJcIikpO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbi8qIEZpbHRlcnMgKi9cblxudmFyIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCdlc2kuZmlsdGVycycsIFtdKTtcblxubW9kdWxlLmZpbHRlcigndHJhbnNsYXRlRXJyb3JDb2RlJywgcmVxdWlyZSgnLi90cmFuc2xhdGVFcnJvckNvZGUnKSk7XG5cblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRyYW5zbGF0ZUVycm9yQ29kZTtcblxudmFyIEVycm9yQ29kZXMgPSB7XG4gICAgXG4gICAgQkFEX1JFUVVFU1Q6IHtcbiAgICAgICAgZW46IFwiVW5mb3J0dW5hdGVseSwgd2UncmUgdW5hYmxlIHRvIHByb2Nlc3MgeW91ciByZXF1ZXN0LiBXZSBhcG9sb2dpemUgZm9yIHRoZSBpbmNvbnZlbmllbmNlLlwiLFxuICAgICAgICBmcjogXCJNYWxoZXVyZXVzZW1lbnQsIGlsIG5vdXMgZXN0IGltcG9zc2libGUgZGUgZG9ubmVyIHN1aXRlIMOgIHZvdHJlIGRlbWFuZGUuIE5vdXMgc29tbWVzIGTDqXNvbMOpcyBkZXMgaW5jb252w6luaWVudHMgc3ViaXMsIGxlIGNhcyDDqWNow6lhbnQuXCJcbiAgICB9LFxuICAgIFxuICAgIERVUExJQ0FURV9JVEVNOiB7XG4gICAgICAgIGVuOiBcIkNhbiBub3QgYWRkIGR1cGxpY2F0ZSBpdGVtISBQbGVzZSB0cnkgYWdhaW4uXCIsXG4gICAgICAgIGZyOiBcIlZvdXMgbmUgcG91dmV6IHBhcyBham91dGVyIGwnYXJ0aWNsZSBlbiBkb3VibGUgISBQbGVzZSByw6llc3NheWVyIC5cIlxuICAgIH0sXG4gICAgXG4gICAgU0VTU0lPTl9FWFBJUkVEOiB7XG4gICAgICAgIGVuOiBcIllvdXIgc2Vzc2lvbiBoYXMgZXhwaXJlZC5cIixcbiAgICAgICAgZnI6IFwiVm90cmUgc2Vzc2lvbiBhIGV4cGlyw6kuXCIgICAgICAgIFxuICAgIH1cbn07XG5cblxudHJhbnNsYXRlRXJyb3JDb2RlLiRpbmplY3QgPSBbJ2dldHRleHRDYXRhbG9nJ107XG5cbmZ1bmN0aW9uIHRyYW5zbGF0ZUVycm9yQ29kZSAoZ2V0dGV4dENhdGFsb2cpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXJyb3JDb2RlKSB7XG4gICAgICAgIHZhciBsYW5nID0gZ2V0dGV4dENhdGFsb2cuY3VycmVudExhbmd1YWdlID09PSBcImZyX0NBXCIgPyAnZnInIDogJ2VuJztcbiAgICAgICAgaWYoRXJyb3JDb2Rlc1tlcnJvckNvZGVdICYmIEVycm9yQ29kZXNbZXJyb3JDb2RlXVtsYW5nXSl7XG4gICAgICAgICAgICByZXR1cm4gRXJyb3JDb2Rlc1tlcnJvckNvZGVdW2xhbmddO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHJldHVybiBlcnJvckNvZGU7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVycm9yRGlzcGxheVNlcnZpY2U7XG5cbkVycm9yRGlzcGxheVNlcnZpY2UuJGluamVjdCA9IFsnJHJvb3RTY29wZScsICckbG9jYXRpb24nLCAnJGFuY2hvclNjcm9sbCddO1xuXG5mdW5jdGlvbiBFcnJvckRpc3BsYXlTZXJ2aWNlKCRyb290U2NvcGUsICRsb2NhdGlvbiwgJGFuY2hvclNjcm9sbCl7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZGlzcGxheUVycm9yOiBmdW5jdGlvbihlcnJvckNvZGUpe1xuICAgICAgICAgICAgJHJvb3RTY29wZS5lcnJvck1zZyA9IGVycm9yQ29kZTtcbiAgICAgICAgICAgICRsb2NhdGlvbi5oYXNoKCdlcnJvckFuY2hvcicpO1xuICAgICAgICAgICAgJGFuY2hvclNjcm9sbCgpOyAgICBcbiAgICAgICAgICAgICRsb2NhdGlvbi5oYXNoKG51bGwpO1xuICAgICAgICB9XG4gICAgfTtcbn0iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBUb2RvU2VydmljZTtcblxuVG9kb1NlcnZpY2UuJGluamVjdCA9IFsnJGh0dHAnXTtcblxuZnVuY3Rpb24gVG9kb1NlcnZpY2UoJGh0dHApe1xuICAgIFxuICAgIFxuICAgIHJldHVybiB7XG4gICAgICAgIGdldFRvZG9zOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldChcIi90b2Rvc1wiKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgYWRkOiBmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KFwiL3RvZG9zXCIsIGl0ZW0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKGl0ZW0pe1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHttZXRob2Q6XCJERUxFVEVcIix1cmw6XCIvdG9kb3MvXCIraXRlbS5pZH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKGl0ZW0pe1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnB1dChcIi90b2Rvc1wiLCBpdGVtKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIH0pOyAgICAgICAgICAgIFxuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgY2xlYXJDb21wbGV0ZWQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe21ldGhvZDpcIkRFTEVURVwiLHVybDpcIi90b2Rvcy9jb21wbGV0ZWRcIn0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgfSk7ICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfTtcblxuXG59XG5cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCdlc2kuc2VydmljZXMnLCBbXSk7XG5cbm1vZHVsZS5mYWN0b3J5KFwiVG9kb1NlcnZpY2VcIiwgcmVxdWlyZShcIi4vVG9kb1NlcnZpY2VcIikpO1xubW9kdWxlLmZhY3RvcnkoXCJFcnJvckRpc3BsYXlTZXJ2aWNlXCIsIHJlcXVpcmUoXCIuL0Vycm9yRGlzcGxheVNlcnZpY2VcIikpO1xuXG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcbnZhciBhY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRvZG9TdG9yZTtcblxuVG9kb1N0b3JlLiRpbmplY3QgPSBbJ0Rpc3BhdGNoZXInLCAnVG9kb1NlcnZpY2UnLCAnVW5kb0Rpc3BhdGNoZXInXTtcblxuZnVuY3Rpb24gVG9kb1N0b3JlKERpc3BhdGNoZXIsIFRvZG9TZXJ2aWNlLCBVbmRvRGlzcGF0Y2hlcil7XG4gICAgXG4gICAgdmFyIGl0ZW1zID0gW107XG4gICAgXG4gICAgdmFyIGNoYW5nZUV2ZW50RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICBcbiAgICBmdW5jdGlvbiBlbWl0Q2hhbmdlKCl7XG4gICAgICAgIGNoYW5nZUV2ZW50RW1pdHRlci5lbWl0KCdjaGFuZ2UnKTtcbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gdXBkYXRlKGRhdGEpe1xuICAgICAgICBpdGVtcyA9IGRhdGE7XG4gICAgICAgIGVtaXRDaGFuZ2UoKTtcbiAgICB9XG4gICAgXG4gICAgLy8gbG9hZCB0b2Rvc1xuICAgIFRvZG9TZXJ2aWNlLmdldFRvZG9zKCkudGhlbih1cGRhdGUpO1xuICAgIFxuICAgIC8vIHJlZ2lzdGVyIGV2ZW50IGhhbmRsZXJzIHdpdGggRGlzcGF0Y2hlclxuICAgIERpc3BhdGNoZXIub24oYWN0aW9ucy5BREQsIGZ1bmN0aW9uKG5ld1RvZG8pe1xuICAgICAgICBUb2RvU2VydmljZS5hZGQobmV3VG9kbykudGhlbih1cGRhdGUpO1xuICAgIH0pO1xuXG4gICAgRGlzcGF0Y2hlci5vbihhY3Rpb25zLlJFTU9WRSwgZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgIFRvZG9TZXJ2aWNlLnJlbW92ZShpdGVtKS50aGVuKHVwZGF0ZSk7XG4gICAgfSk7XG5cbiAgICBEaXNwYXRjaGVyLm9uKGFjdGlvbnMuQ0xFQVIsIGZ1bmN0aW9uKCl7XG4gICAgICAgIFRvZG9TZXJ2aWNlLmNsZWFyQ29tcGxldGVkKCkudGhlbih1cGRhdGUpO1xuICAgIH0pO1xuXG4gICAgRGlzcGF0Y2hlci5vbihhY3Rpb25zLlRPR0dMRSwgZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgIFRvZG9TZXJ2aWNlLnVwZGF0ZShpdGVtKS50aGVuKHVwZGF0ZSk7XG4gICAgfSk7XG4gICAgXG4gICAgXG4gICAgLy8gcmVnaXN0ZXIgdW5kbyBoYW5kbGVyc1xuICAgIFVuZG9EaXNwYXRjaGVyLm9uKGFjdGlvbnMuQURELCBmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgVG9kb1NlcnZpY2UucmVtb3ZlKGl0ZW0pLnRoZW4odXBkYXRlKTtcbiAgICB9KTtcblxuICAgIFVuZG9EaXNwYXRjaGVyLm9uKGFjdGlvbnMuUkVNT1ZFLCBmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgVG9kb1NlcnZpY2UuYWRkKGl0ZW0pLnRoZW4odXBkYXRlKTtcbiAgICB9KTtcblxuICAgIFVuZG9EaXNwYXRjaGVyLm9uKGFjdGlvbnMuQ0xFQVIsIGZ1bmN0aW9uKGNvbXBsZXRlZEl0ZW1zKXtcbiAgICAgICAgY29tcGxldGVkSXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgICAgIFRvZG9TZXJ2aWNlLmFkZChpdGVtKS50aGVuKHVwZGF0ZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgVW5kb0Rpc3BhdGNoZXIub24oYWN0aW9ucy5UT0dHTEUsIGZ1bmN0aW9uKGl0ZW0pe1xuICAgICAgICBpdGVtLmNvbXBsZXRlZCA9ICFpdGVtLmNvbXBsZXRlZDtcbiAgICAgICAgVG9kb1NlcnZpY2UudXBkYXRlKGl0ZW0pLnRoZW4odXBkYXRlKTtcbiAgICB9KTsgICAgXG5cbiAgICBcbiAgICAvLyByZXR1cm4gcmVhZC1vbmx5IGludGVyZmFjZVxuICAgIHJldHVybiB7XG4gICAgICAgIGdldEl0ZW1zOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW1zO1xuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgZ2V0QWN0aXZlOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW1zLmZpbHRlcihmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5jb21wbGV0ZWQgPT09IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBnZXRDb21wbGV0ZWQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gaXRlbXMuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pe1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLmNvbXBsZXRlZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgZ2V0VG90YWxDb3VudDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiBpdGVtcy5sZW5ndGg7XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBnZXRBY3RpdmVDb3VudDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiBpdGVtcy5yZWR1Y2UoZnVuY3Rpb24oY291bnQsIHRvZG8pe1xuICAgICAgICAgICAgICAgIHJldHVybiB0b2RvLmNvbXBsZXRlZCA/IGNvdW50IDogY291bnQrPTE7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIGdldENvbXBsZXRlZENvdW50OiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW1zLnJlZHVjZShmdW5jdGlvbihjb3VudCwgdG9kbyl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvZG8uY29tcGxldGVkID8gY291bnQrPTEgOiBjb3VudDtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgb25DaGFuZ2U6IGZ1bmN0aW9uKGxpc3RlbmVyKXtcbiAgICAgICAgICAgIGNoYW5nZUV2ZW50RW1pdHRlci5vbignY2hhbmdlJywgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgIH07XG5cblxufVxuXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBtb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgnZXNpLnN0b3JlcycsIFtdKTtcblxubW9kdWxlLmZhY3RvcnkoXCJUb2RvU3RvcmVcIiwgcmVxdWlyZShcIi4vVG9kb1N0b3JlXCIpKTtcblxuXG4iLCIndXNlIHN0cmljdCc7XG52YXIgdXVpZCA9IHJlcXVpcmUoJ25vZGUtdXVpZCcpO1xucmVxdWlyZSgnLi9hcHAnKTtcbnJlcXVpcmUoJy4uL2Jvd2VyX2NvbXBvbmVudHMvYW5ndWxhci1tb2Nrcy9hbmd1bGFyLW1vY2tzLmpzJyk7XG5cblxudmFyIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCd0ZW1wbGF0ZUFwcCcsIFsnYXBwJywgJ25nTW9ja0UyRSddKTtcblxuXG5cbi8vc2ltdWxhdGUgYSBuZXR3b3JrIGRlbGF5XG4vL3dyYXBwaW5nIHRoZSBvcmlnaW5hbCAkaHR0cEJhY2tlbmQgKCRkZWxlZ2F0ZSksIHdpdGggb3VyIG93biBmdW5jdGlvbiwgd2hpY2ggc2V0cyBhXG4vL3RpbWVvdXQgYmVmb3JlIGNhbGxpbmcgdGhlIGFjdHVhbCBjYWxsYmFjayB3aXRoIHRoZSByZXNwb25zZSBkYXRhLlxuLy8gdGhhbmtzIHRvIHRoZSBhdXRob3Igb2YgdGhpcyBibG9ncG9zdCBodHRwOi8vZW5kbGVzc2luZGlyZWN0aW9uLndvcmRwcmVzcy5jb20vMjAxMy8wNS8xOC9hbmd1bGFyanMtZGVsYXktcmVzcG9uc2UtZnJvbS1odHRwYmFja2VuZC9cblxuLy9tb2R1bGUuY29uZmlnKGZ1bmN0aW9uKCRwcm92aWRlKSB7XG4vLyAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRodHRwQmFja2VuZCcsIGZ1bmN0aW9uKCRkZWxlZ2F0ZSkge1xuLy8gICAgICAgIHZhciBwcm94eSA9IGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBkYXRhLCBjYWxsYmFjaywgaGVhZGVycykge1xuLy8gICAgICAgICAgICB2YXIgaW50ZXJjZXB0b3IgPSBmdW5jdGlvbigpIHtcbi8vICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXMsXG4vLyAgICAgICAgICAgICAgICAgICAgX2FyZ3VtZW50cyA9IGFyZ3VtZW50cztcbi8vICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkoX3RoaXMsIF9hcmd1bWVudHMpO1xuLy8gICAgICAgICAgICAgICAgfSwgMTAwMCk7XG4vLyAgICAgICAgICAgIH07XG4vLyAgICAgICAgICAgIHJldHVybiAkZGVsZWdhdGUuY2FsbCh0aGlzLCBtZXRob2QsIHVybCwgZGF0YSwgaW50ZXJjZXB0b3IsIGhlYWRlcnMpO1xuLy8gICAgICAgIH07XG4vLyAgICAgICAgZm9yKHZhciBrZXkgaW4gJGRlbGVnYXRlKSB7XG4vLyAgICAgICAgICAgIHByb3h5W2tleV0gPSAkZGVsZWdhdGVba2V5XTtcbi8vICAgICAgICB9XG4vLyAgICAgICAgcmV0dXJuIHByb3h5O1xuLy8gICAgfSk7XG4vL30pO1xuXG5tb2R1bGUucnVuKFsnJGh0dHBCYWNrZW5kJywgZnVuY3Rpb24oJGh0dHBCYWNrZW5kKSB7XG5cbiAgICAvLyBsZXQgdGVtcGxhdGVzIHBhc3MgdGhyb3VnaFxuICAgICRodHRwQmFja2VuZC53aGVuR0VUKC9cXC90ZW1wbGF0ZXNcXC8uKi8pLnBhc3NUaHJvdWdoKCk7XG4gICAgJGh0dHBCYWNrZW5kLndoZW5HRVQoLy5odG1sLykucGFzc1Rocm91Z2goKTsgICAgXG4gICAgXG4gICAgXG4gICAgdmFyIHRvZG9zID0gWyAgICAgICAgICAgIFxuICAgICAgICB7XG4gICAgICAgICAgICBpZDogdXVpZC52MSgpLFxuICAgICAgICAgICAgbmFtZTogXCJ0b2RvMVwiLFxuICAgICAgICAgICAgY29tcGxldGVkOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBpZDogdXVpZC52MSgpLFxuICAgICAgICAgICAgbmFtZTogXCJ0b2RvMlwiLFxuICAgICAgICAgICAgY29tcGxldGVkOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBpZDogdXVpZC52MSgpLFxuICAgICAgICAgICAgbmFtZTogXCJ0b2RvM1wiLFxuICAgICAgICAgICAgY29tcGxldGVkOiB0cnVlXG4gICAgICAgIH1cbiAgICBdOyAgICBcbiAgIFxuICAgICRodHRwQmFja2VuZC53aGVuR0VUKCcvdG9kb3MnKS5yZXNwb25kKHRvZG9zKTtcbiAgICBcbiAgICAvLyBhZGQgbmV3XG4gICAgJGh0dHBCYWNrZW5kLndoZW5QT1NUKCcvdG9kb3MnKS5yZXNwb25kKGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBkYXRhKSB7XG4gICAgICAgIHZhciBuZXdJdGVtID0gYW5ndWxhci5mcm9tSnNvbihkYXRhKTtcbiAgICAgICAgLy8gY2hlY2sgZm9yIGR1cGxpY2F0ZVxuICAgICAgICB2YXIgZHVwbGNhdGVzID0gdG9kb3MuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pe1xuICAgICAgICAgICAgcmV0dXJuIG5ld0l0ZW0ubmFtZSA9PT0gaXRlbS5uYW1lO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZighXy5pc0VtcHR5KGR1cGxjYXRlcykpe1xuICAgICAgICAgICAgcmV0dXJuIFs0MDAsIHtlcnJvckNvZGU6IFwiRFVQTElDQVRFX0lURU1cIiwgZXJyb3JNZXNzYWdlOiBcIlN1Ym1pdHRlZCBpdGVtIGFscmVhZHkgZXhpc3RzXCJ9XTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdG9kb3MucHVzaChuZXdJdGVtKTtcbiAgICAgICAgcmV0dXJuIFsyMDAsIHRvZG9zXTsgXG4gICAgfSk7XG4gICAgXG4gICAgLy8gdXBkYXRlXG4gICAgJGh0dHBCYWNrZW5kLndoZW5QVVQoJy90b2RvcycpLnJlc3BvbmQoZnVuY3Rpb24obWV0aG9kLCB1cmwsIGRhdGEpIHtcbiAgICAgICAgdmFyIHRvZG8gPSBhbmd1bGFyLmZyb21Kc29uKGRhdGEpO1xuICAgICAgICBmb3IodmFyIGkgaW4gdG9kb3Mpe1xuICAgICAgICAgICAgaWYodG9kb3NbaV0uaWQgPT09IHRvZG8uaWQpe1xuICAgICAgICAgICAgICAgIHRvZG9zW2ldID0gdG9kbztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gWzIwMCwgdG9kb3NdO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIGRlbGV0ZSBjb21wbGV0ZWRcbiAgICAkaHR0cEJhY2tlbmQud2hlbkRFTEVURSgnL3RvZG9zL2NvbXBsZXRlZCcpLnJlc3BvbmQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHRvZG9zID0gdG9kb3MuZmlsdGVyKGZ1bmN0aW9uKHRvZG8pe1xuICAgICAgICAgICAgcmV0dXJuICF0b2RvLmNvbXBsZXRlZDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBbMjAwLCB0b2Rvc107XG4gICAgfSk7ICAgXG4gICAgXG4gICAgLy8gZGVsZXRlIGl0ZW0gYnkgaWRcbiAgICAkaHR0cEJhY2tlbmQud2hlbkRFTEVURSgvXFwvdG9kb3NcXC8uKi8pLnJlc3BvbmQoZnVuY3Rpb24obWV0aG9kLCB1cmwpIHtcbiAgICAgICAgdmFyIGlkID0gdXJsLm1hdGNoKC9cXC90b2Rvc1xcLyguKikvKVsxXTtcbiAgICAgICAgdG9kb3MgPSB0b2Rvcy5maWx0ZXIoZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgICAgICByZXR1cm4gaWQgIT09IGl0ZW0uaWQ7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFsyMDAsIHRvZG9zXTsgXG4gICAgfSk7XG4gICAgXG59XSk7XG4iLCIvKiFcbiAqIEV2ZW50RW1pdHRlcjJcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9oaWoxbngvRXZlbnRFbWl0dGVyMlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMyBoaWoxbnhcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuOyFmdW5jdGlvbih1bmRlZmluZWQpIHtcblxuICB2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgPyBBcnJheS5pc0FycmF5IDogZnVuY3Rpb24gX2lzQXJyYXkob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSBcIltvYmplY3QgQXJyYXldXCI7XG4gIH07XG4gIHZhciBkZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbiAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBpZiAodGhpcy5fY29uZikge1xuICAgICAgY29uZmlndXJlLmNhbGwodGhpcywgdGhpcy5fY29uZik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY29uZmlndXJlKGNvbmYpIHtcbiAgICBpZiAoY29uZikge1xuXG4gICAgICB0aGlzLl9jb25mID0gY29uZjtcblxuICAgICAgY29uZi5kZWxpbWl0ZXIgJiYgKHRoaXMuZGVsaW1pdGVyID0gY29uZi5kZWxpbWl0ZXIpO1xuICAgICAgY29uZi5tYXhMaXN0ZW5lcnMgJiYgKHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgPSBjb25mLm1heExpc3RlbmVycyk7XG4gICAgICBjb25mLndpbGRjYXJkICYmICh0aGlzLndpbGRjYXJkID0gY29uZi53aWxkY2FyZCk7XG4gICAgICBjb25mLm5ld0xpc3RlbmVyICYmICh0aGlzLm5ld0xpc3RlbmVyID0gY29uZi5uZXdMaXN0ZW5lcik7XG5cbiAgICAgIGlmICh0aGlzLndpbGRjYXJkKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJUcmVlID0ge307XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gRXZlbnRFbWl0dGVyKGNvbmYpIHtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICB0aGlzLm5ld0xpc3RlbmVyID0gZmFsc2U7XG4gICAgY29uZmlndXJlLmNhbGwodGhpcywgY29uZik7XG4gIH1cblxuICAvL1xuICAvLyBBdHRlbnRpb24sIGZ1bmN0aW9uIHJldHVybiB0eXBlIG5vdyBpcyBhcnJheSwgYWx3YXlzICFcbiAgLy8gSXQgaGFzIHplcm8gZWxlbWVudHMgaWYgbm8gYW55IG1hdGNoZXMgZm91bmQgYW5kIG9uZSBvciBtb3JlXG4gIC8vIGVsZW1lbnRzIChsZWFmcykgaWYgdGhlcmUgYXJlIG1hdGNoZXNcbiAgLy9cbiAgZnVuY3Rpb24gc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlLCBpKSB7XG4gICAgaWYgKCF0cmVlKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHZhciBsaXN0ZW5lcnM9W10sIGxlYWYsIGxlbiwgYnJhbmNoLCB4VHJlZSwgeHhUcmVlLCBpc29sYXRlZEJyYW5jaCwgZW5kUmVhY2hlZCxcbiAgICAgICAgdHlwZUxlbmd0aCA9IHR5cGUubGVuZ3RoLCBjdXJyZW50VHlwZSA9IHR5cGVbaV0sIG5leHRUeXBlID0gdHlwZVtpKzFdO1xuICAgIGlmIChpID09PSB0eXBlTGVuZ3RoICYmIHRyZWUuX2xpc3RlbmVycykge1xuICAgICAgLy9cbiAgICAgIC8vIElmIGF0IHRoZSBlbmQgb2YgdGhlIGV2ZW50KHMpIGxpc3QgYW5kIHRoZSB0cmVlIGhhcyBsaXN0ZW5lcnNcbiAgICAgIC8vIGludm9rZSB0aG9zZSBsaXN0ZW5lcnMuXG4gICAgICAvL1xuICAgICAgaWYgKHR5cGVvZiB0cmVlLl9saXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaGFuZGxlcnMgJiYgaGFuZGxlcnMucHVzaCh0cmVlLl9saXN0ZW5lcnMpO1xuICAgICAgICByZXR1cm4gW3RyZWVdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChsZWFmID0gMCwgbGVuID0gdHJlZS5fbGlzdGVuZXJzLmxlbmd0aDsgbGVhZiA8IGxlbjsgbGVhZisrKSB7XG4gICAgICAgICAgaGFuZGxlcnMgJiYgaGFuZGxlcnMucHVzaCh0cmVlLl9saXN0ZW5lcnNbbGVhZl0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbdHJlZV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKChjdXJyZW50VHlwZSA9PT0gJyonIHx8IGN1cnJlbnRUeXBlID09PSAnKionKSB8fCB0cmVlW2N1cnJlbnRUeXBlXSkge1xuICAgICAgLy9cbiAgICAgIC8vIElmIHRoZSBldmVudCBlbWl0dGVkIGlzICcqJyBhdCB0aGlzIHBhcnRcbiAgICAgIC8vIG9yIHRoZXJlIGlzIGEgY29uY3JldGUgbWF0Y2ggYXQgdGhpcyBwYXRjaFxuICAgICAgLy9cbiAgICAgIGlmIChjdXJyZW50VHlwZSA9PT0gJyonKSB7XG4gICAgICAgIGZvciAoYnJhbmNoIGluIHRyZWUpIHtcbiAgICAgICAgICBpZiAoYnJhbmNoICE9PSAnX2xpc3RlbmVycycgJiYgdHJlZS5oYXNPd25Qcm9wZXJ0eShicmFuY2gpKSB7XG4gICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKzEpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpc3RlbmVycztcbiAgICAgIH0gZWxzZSBpZihjdXJyZW50VHlwZSA9PT0gJyoqJykge1xuICAgICAgICBlbmRSZWFjaGVkID0gKGkrMSA9PT0gdHlwZUxlbmd0aCB8fCAoaSsyID09PSB0eXBlTGVuZ3RoICYmIG5leHRUeXBlID09PSAnKicpKTtcbiAgICAgICAgaWYoZW5kUmVhY2hlZCAmJiB0cmVlLl9saXN0ZW5lcnMpIHtcbiAgICAgICAgICAvLyBUaGUgbmV4dCBlbGVtZW50IGhhcyBhIF9saXN0ZW5lcnMsIGFkZCBpdCB0byB0aGUgaGFuZGxlcnMuXG4gICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWUsIHR5cGVMZW5ndGgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoYnJhbmNoIGluIHRyZWUpIHtcbiAgICAgICAgICBpZiAoYnJhbmNoICE9PSAnX2xpc3RlbmVycycgJiYgdHJlZS5oYXNPd25Qcm9wZXJ0eShicmFuY2gpKSB7XG4gICAgICAgICAgICBpZihicmFuY2ggPT09ICcqJyB8fCBicmFuY2ggPT09ICcqKicpIHtcbiAgICAgICAgICAgICAgaWYodHJlZVticmFuY2hdLl9saXN0ZW5lcnMgJiYgIWVuZFJlYWNoZWQpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCB0eXBlTGVuZ3RoKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWVbYnJhbmNoXSwgaSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKGJyYW5jaCA9PT0gbmV4dFR5cGUpIHtcbiAgICAgICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWVbYnJhbmNoXSwgaSsyKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBObyBtYXRjaCBvbiB0aGlzIG9uZSwgc2hpZnQgaW50byB0aGUgdHJlZSBidXQgbm90IGluIHRoZSB0eXBlIGFycmF5LlxuICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsaXN0ZW5lcnM7XG4gICAgICB9XG5cbiAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2N1cnJlbnRUeXBlXSwgaSsxKSk7XG4gICAgfVxuXG4gICAgeFRyZWUgPSB0cmVlWycqJ107XG4gICAgaWYgKHhUcmVlKSB7XG4gICAgICAvL1xuICAgICAgLy8gSWYgdGhlIGxpc3RlbmVyIHRyZWUgd2lsbCBhbGxvdyBhbnkgbWF0Y2ggZm9yIHRoaXMgcGFydCxcbiAgICAgIC8vIHRoZW4gcmVjdXJzaXZlbHkgZXhwbG9yZSBhbGwgYnJhbmNoZXMgb2YgdGhlIHRyZWVcbiAgICAgIC8vXG4gICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHhUcmVlLCBpKzEpO1xuICAgIH1cblxuICAgIHh4VHJlZSA9IHRyZWVbJyoqJ107XG4gICAgaWYoeHhUcmVlKSB7XG4gICAgICBpZihpIDwgdHlwZUxlbmd0aCkge1xuICAgICAgICBpZih4eFRyZWUuX2xpc3RlbmVycykge1xuICAgICAgICAgIC8vIElmIHdlIGhhdmUgYSBsaXN0ZW5lciBvbiBhICcqKicsIGl0IHdpbGwgY2F0Y2ggYWxsLCBzbyBhZGQgaXRzIGhhbmRsZXIuXG4gICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWUsIHR5cGVMZW5ndGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQnVpbGQgYXJyYXlzIG9mIG1hdGNoaW5nIG5leHQgYnJhbmNoZXMgYW5kIG90aGVycy5cbiAgICAgICAgZm9yKGJyYW5jaCBpbiB4eFRyZWUpIHtcbiAgICAgICAgICBpZihicmFuY2ggIT09ICdfbGlzdGVuZXJzJyAmJiB4eFRyZWUuaGFzT3duUHJvcGVydHkoYnJhbmNoKSkge1xuICAgICAgICAgICAgaWYoYnJhbmNoID09PSBuZXh0VHlwZSkge1xuICAgICAgICAgICAgICAvLyBXZSBrbm93IHRoZSBuZXh0IGVsZW1lbnQgd2lsbCBtYXRjaCwgc28ganVtcCB0d2ljZS5cbiAgICAgICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWVbYnJhbmNoXSwgaSsyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZihicmFuY2ggPT09IGN1cnJlbnRUeXBlKSB7XG4gICAgICAgICAgICAgIC8vIEN1cnJlbnQgbm9kZSBtYXRjaGVzLCBtb3ZlIGludG8gdGhlIHRyZWUuXG4gICAgICAgICAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeHhUcmVlW2JyYW5jaF0sIGkrMSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpc29sYXRlZEJyYW5jaCA9IHt9O1xuICAgICAgICAgICAgICBpc29sYXRlZEJyYW5jaFticmFuY2hdID0geHhUcmVlW2JyYW5jaF07XG4gICAgICAgICAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeyAnKionOiBpc29sYXRlZEJyYW5jaCB9LCBpKzEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKHh4VHJlZS5fbGlzdGVuZXJzKSB7XG4gICAgICAgIC8vIFdlIGhhdmUgcmVhY2hlZCB0aGUgZW5kIGFuZCBzdGlsbCBvbiBhICcqKidcbiAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWUsIHR5cGVMZW5ndGgpO1xuICAgICAgfSBlbHNlIGlmKHh4VHJlZVsnKiddICYmIHh4VHJlZVsnKiddLl9saXN0ZW5lcnMpIHtcbiAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWVbJyonXSwgdHlwZUxlbmd0aCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGxpc3RlbmVycztcbiAgfVxuXG4gIGZ1bmN0aW9uIGdyb3dMaXN0ZW5lclRyZWUodHlwZSwgbGlzdGVuZXIpIHtcblxuICAgIHR5cGUgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcblxuICAgIC8vXG4gICAgLy8gTG9va3MgZm9yIHR3byBjb25zZWN1dGl2ZSAnKionLCBpZiBzbywgZG9uJ3QgYWRkIHRoZSBldmVudCBhdCBhbGwuXG4gICAgLy9cbiAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0eXBlLmxlbmd0aDsgaSsxIDwgbGVuOyBpKyspIHtcbiAgICAgIGlmKHR5cGVbaV0gPT09ICcqKicgJiYgdHlwZVtpKzFdID09PSAnKionKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgdHJlZSA9IHRoaXMubGlzdGVuZXJUcmVlO1xuICAgIHZhciBuYW1lID0gdHlwZS5zaGlmdCgpO1xuXG4gICAgd2hpbGUgKG5hbWUpIHtcblxuICAgICAgaWYgKCF0cmVlW25hbWVdKSB7XG4gICAgICAgIHRyZWVbbmFtZV0gPSB7fTtcbiAgICAgIH1cblxuICAgICAgdHJlZSA9IHRyZWVbbmFtZV07XG5cbiAgICAgIGlmICh0eXBlLmxlbmd0aCA9PT0gMCkge1xuXG4gICAgICAgIGlmICghdHJlZS5fbGlzdGVuZXJzKSB7XG4gICAgICAgICAgdHJlZS5fbGlzdGVuZXJzID0gbGlzdGVuZXI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih0eXBlb2YgdHJlZS5fbGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdHJlZS5fbGlzdGVuZXJzID0gW3RyZWUuX2xpc3RlbmVycywgbGlzdGVuZXJdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzQXJyYXkodHJlZS5fbGlzdGVuZXJzKSkge1xuXG4gICAgICAgICAgdHJlZS5fbGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuXG4gICAgICAgICAgaWYgKCF0cmVlLl9saXN0ZW5lcnMud2FybmVkKSB7XG5cbiAgICAgICAgICAgIHZhciBtID0gZGVmYXVsdE1heExpc3RlbmVycztcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBtID0gdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG0gPiAwICYmIHRyZWUuX2xpc3RlbmVycy5sZW5ndGggPiBtKSB7XG5cbiAgICAgICAgICAgICAgdHJlZS5fbGlzdGVuZXJzLndhcm5lZCA9IHRydWU7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyZWUuX2xpc3RlbmVycy5sZW5ndGgpO1xuICAgICAgICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgbmFtZSA9IHR5cGUuc2hpZnQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuXG4gIC8vIDEwIGxpc3RlbmVycyBhcmUgYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaFxuICAvLyBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbiAgLy9cbiAgLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4gIC8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZGVsaW1pdGVyID0gJy4nO1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XG4gICAgdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyA9IG47XG4gICAgaWYgKCF0aGlzLl9jb25mKSB0aGlzLl9jb25mID0ge307XG4gICAgdGhpcy5fY29uZi5tYXhMaXN0ZW5lcnMgPSBuO1xuICB9O1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnQgPSAnJztcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbihldmVudCwgZm4pIHtcbiAgICB0aGlzLm1hbnkoZXZlbnQsIDEsIGZuKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm1hbnkgPSBmdW5jdGlvbihldmVudCwgdHRsLCBmbikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWFueSBvbmx5IGFjY2VwdHMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGlzdGVuZXIoKSB7XG4gICAgICBpZiAoLS10dGwgPT09IDApIHtcbiAgICAgICAgc2VsZi5vZmYoZXZlbnQsIGxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgbGlzdGVuZXIuX29yaWdpbiA9IGZuO1xuXG4gICAgdGhpcy5vbihldmVudCwgbGlzdGVuZXIpO1xuXG4gICAgcmV0dXJuIHNlbGY7XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICB0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xuXG4gICAgdmFyIHR5cGUgPSBhcmd1bWVudHNbMF07XG5cbiAgICBpZiAodHlwZSA9PT0gJ25ld0xpc3RlbmVyJyAmJiAhdGhpcy5uZXdMaXN0ZW5lcikge1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgfVxuXG4gICAgLy8gTG9vcCB0aHJvdWdoIHRoZSAqX2FsbCogZnVuY3Rpb25zIGFuZCBpbnZva2UgdGhlbS5cbiAgICBpZiAodGhpcy5fYWxsKSB7XG4gICAgICB2YXIgbCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICB2YXIgYXJncyA9IG5ldyBBcnJheShsIC0gMSk7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGw7IGkrKykgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICBmb3IgKGkgPSAwLCBsID0gdGhpcy5fYWxsLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcbiAgICAgICAgdGhpcy5fYWxsW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuXG4gICAgICBpZiAoIXRoaXMuX2FsbCAmJlxuICAgICAgICAhdGhpcy5fZXZlbnRzLmVycm9yICYmXG4gICAgICAgICEodGhpcy53aWxkY2FyZCAmJiB0aGlzLmxpc3RlbmVyVHJlZS5lcnJvcikpIHtcblxuICAgICAgICBpZiAoYXJndW1lbnRzWzFdIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICB0aHJvdyBhcmd1bWVudHNbMV07IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5jYXVnaHQsIHVuc3BlY2lmaWVkICdlcnJvcicgZXZlbnQuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgaGFuZGxlcjtcblxuICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgIGhhbmRsZXIgPSBbXTtcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xuICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgaGFuZGxlciwgbnMsIHRoaXMubGlzdGVuZXJUcmVlLCAwKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSlcbiAgICAgICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgLy8gc2xvd2VyXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGwgLSAxKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbDsgaSsrKSBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNlIGlmIChoYW5kbGVyKSB7XG4gICAgICB2YXIgbCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICB2YXIgYXJncyA9IG5ldyBBcnJheShsIC0gMSk7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGw7IGkrKykgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICAgIHZhciBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XG4gICAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAobGlzdGVuZXJzLmxlbmd0aCA+IDApIHx8ICEhdGhpcy5fYWxsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiAhIXRoaXMuX2FsbDtcbiAgICB9XG5cbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcblxuICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5vbkFueSh0eXBlKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignb24gb25seSBhY2NlcHRzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xuICAgIH1cbiAgICB0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xuXG4gICAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PSBcIm5ld0xpc3RlbmVyc1wiISBCZWZvcmVcbiAgICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyc1wiLlxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgICBpZih0aGlzLndpbGRjYXJkKSB7XG4gICAgICBncm93TGlzdGVuZXJUcmVlLmNhbGwodGhpcywgdHlwZSwgbGlzdGVuZXIpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHtcbiAgICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gICAgfVxuICAgIGVsc2UgaWYodHlwZW9mIHRoaXMuX2V2ZW50c1t0eXBlXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG4gICAgfVxuICAgIGVsc2UgaWYgKGlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuICAgICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuXG4gICAgICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG5cbiAgICAgICAgdmFyIG0gPSBkZWZhdWx0TWF4TGlzdGVuZXJzO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBtID0gdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuXG4gICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub25BbnkgPSBmdW5jdGlvbihmbikge1xuXG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdvbkFueSBvbmx5IGFjY2VwdHMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gICAgfVxuXG4gICAgaWYoIXRoaXMuX2FsbCkge1xuICAgICAgdGhpcy5fYWxsID0gW107XG4gICAgfVxuXG4gICAgLy8gQWRkIHRoZSBmdW5jdGlvbiB0byB0aGUgZXZlbnQgbGlzdGVuZXIgY29sbGVjdGlvbi5cbiAgICB0aGlzLl9hbGwucHVzaChmbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncmVtb3ZlTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgICB9XG5cbiAgICB2YXIgaGFuZGxlcnMsbGVhZnM9W107XG5cbiAgICBpZih0aGlzLndpbGRjYXJkKSB7XG4gICAgICB2YXIgbnMgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcbiAgICAgIGxlYWZzID0gc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgbnVsbCwgbnMsIHRoaXMubGlzdGVuZXJUcmVlLCAwKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBkb2VzIG5vdCB1c2UgbGlzdGVuZXJzKCksIHNvIG5vIHNpZGUgZWZmZWN0IG9mIGNyZWF0aW5nIF9ldmVudHNbdHlwZV1cbiAgICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSByZXR1cm4gdGhpcztcbiAgICAgIGhhbmRsZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgICAgbGVhZnMucHVzaCh7X2xpc3RlbmVyczpoYW5kbGVyc30pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGlMZWFmPTA7IGlMZWFmPGxlYWZzLmxlbmd0aDsgaUxlYWYrKykge1xuICAgICAgdmFyIGxlYWYgPSBsZWFmc1tpTGVhZl07XG4gICAgICBoYW5kbGVycyA9IGxlYWYuX2xpc3RlbmVycztcbiAgICAgIGlmIChpc0FycmF5KGhhbmRsZXJzKSkge1xuXG4gICAgICAgIHZhciBwb3NpdGlvbiA9IC0xO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBoYW5kbGVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChoYW5kbGVyc1tpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAgIChoYW5kbGVyc1tpXS5saXN0ZW5lciAmJiBoYW5kbGVyc1tpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHx8XG4gICAgICAgICAgICAoaGFuZGxlcnNbaV0uX29yaWdpbiAmJiBoYW5kbGVyc1tpXS5fb3JpZ2luID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwb3NpdGlvbiA8IDApIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgICAgICBsZWFmLl9saXN0ZW5lcnMuc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0uc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYW5kbGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBpZih0aGlzLndpbGRjYXJkKSB7XG4gICAgICAgICAgICBkZWxldGUgbGVhZi5fbGlzdGVuZXJzO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoaGFuZGxlcnMgPT09IGxpc3RlbmVyIHx8XG4gICAgICAgIChoYW5kbGVycy5saXN0ZW5lciAmJiBoYW5kbGVycy5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHx8XG4gICAgICAgIChoYW5kbGVycy5fb3JpZ2luICYmIGhhbmRsZXJzLl9vcmlnaW4gPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBpZih0aGlzLndpbGRjYXJkKSB7XG4gICAgICAgICAgZGVsZXRlIGxlYWYuX2xpc3RlbmVycztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmZBbnkgPSBmdW5jdGlvbihmbikge1xuICAgIHZhciBpID0gMCwgbCA9IDAsIGZucztcbiAgICBpZiAoZm4gJiYgdGhpcy5fYWxsICYmIHRoaXMuX2FsbC5sZW5ndGggPiAwKSB7XG4gICAgICBmbnMgPSB0aGlzLl9hbGw7XG4gICAgICBmb3IoaSA9IDAsIGwgPSBmbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmKGZuID09PSBmbnNbaV0pIHtcbiAgICAgICAgICBmbnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2FsbCA9IFtdO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmY7XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICF0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaWYodGhpcy53aWxkY2FyZCkge1xuICAgICAgdmFyIG5zID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8gdHlwZS5zcGxpdCh0aGlzLmRlbGltaXRlcikgOiB0eXBlLnNsaWNlKCk7XG4gICAgICB2YXIgbGVhZnMgPSBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBudWxsLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xuXG4gICAgICBmb3IgKHZhciBpTGVhZj0wOyBpTGVhZjxsZWFmcy5sZW5ndGg7IGlMZWFmKyspIHtcbiAgICAgICAgdmFyIGxlYWYgPSBsZWFmc1tpTGVhZl07XG4gICAgICAgIGxlYWYuX2xpc3RlbmVycyA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHJldHVybiB0aGlzO1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgaWYodGhpcy53aWxkY2FyZCkge1xuICAgICAgdmFyIGhhbmRsZXJzID0gW107XG4gICAgICB2YXIgbnMgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcbiAgICAgIHNlYXJjaExpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIGhhbmRsZXJzLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xuICAgICAgcmV0dXJuIGhhbmRsZXJzO1xuICAgIH1cblxuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XG5cbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gW107XG4gICAgaWYgKCFpc0FycmF5KHRoaXMuX2V2ZW50c1t0eXBlXSkpIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICB9O1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzQW55ID0gZnVuY3Rpb24oKSB7XG5cbiAgICBpZih0aGlzLl9hbGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9hbGw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICB9O1xuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBFdmVudEVtaXR0ZXI7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBleHBvcnRzLkV2ZW50RW1pdHRlcjIgPSBFdmVudEVtaXR0ZXI7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gQnJvd3NlciBnbG9iYWwuXG4gICAgd2luZG93LkV2ZW50RW1pdHRlcjIgPSBFdmVudEVtaXR0ZXI7XG4gIH1cbn0oKTtcbiIsIlxuXG4vL1xuLy8gVGhlIHNoaW1zIGluIHRoaXMgZmlsZSBhcmUgbm90IGZ1bGx5IGltcGxlbWVudGVkIHNoaW1zIGZvciB0aGUgRVM1XG4vLyBmZWF0dXJlcywgYnV0IGRvIHdvcmsgZm9yIHRoZSBwYXJ0aWN1bGFyIHVzZWNhc2VzIHRoZXJlIGlzIGluXG4vLyB0aGUgb3RoZXIgbW9kdWxlcy5cbi8vXG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyBBcnJheS5pc0FycmF5IGlzIHN1cHBvcnRlZCBpbiBJRTlcbmZ1bmN0aW9uIGlzQXJyYXkoeHMpIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwoeHMpID09PSAnW29iamVjdCBBcnJheV0nO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gdHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbicgPyBBcnJheS5pc0FycmF5IDogaXNBcnJheTtcblxuLy8gQXJyYXkucHJvdG90eXBlLmluZGV4T2YgaXMgc3VwcG9ydGVkIGluIElFOVxuZXhwb3J0cy5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZih4cywgeCkge1xuICBpZiAoeHMuaW5kZXhPZikgcmV0dXJuIHhzLmluZGV4T2YoeCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoeCA9PT0geHNbaV0pIHJldHVybiBpO1xuICB9XG4gIHJldHVybiAtMTtcbn07XG5cbi8vIEFycmF5LnByb3RvdHlwZS5maWx0ZXIgaXMgc3VwcG9ydGVkIGluIElFOVxuZXhwb3J0cy5maWx0ZXIgPSBmdW5jdGlvbiBmaWx0ZXIoeHMsIGZuKSB7XG4gIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZm4pO1xuICB2YXIgcmVzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZm4oeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICB9XG4gIHJldHVybiByZXM7XG59O1xuXG4vLyBBcnJheS5wcm90b3R5cGUuZm9yRWFjaCBpcyBzdXBwb3J0ZWQgaW4gSUU5XG5leHBvcnRzLmZvckVhY2ggPSBmdW5jdGlvbiBmb3JFYWNoKHhzLCBmbiwgc2VsZikge1xuICBpZiAoeHMuZm9yRWFjaCkgcmV0dXJuIHhzLmZvckVhY2goZm4sIHNlbGYpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgZm4uY2FsbChzZWxmLCB4c1tpXSwgaSwgeHMpO1xuICB9XG59O1xuXG4vLyBBcnJheS5wcm90b3R5cGUubWFwIGlzIHN1cHBvcnRlZCBpbiBJRTlcbmV4cG9ydHMubWFwID0gZnVuY3Rpb24gbWFwKHhzLCBmbikge1xuICBpZiAoeHMubWFwKSByZXR1cm4geHMubWFwKGZuKTtcbiAgdmFyIG91dCA9IG5ldyBBcnJheSh4cy5sZW5ndGgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0W2ldID0gZm4oeHNbaV0sIGksIHhzKTtcbiAgfVxuICByZXR1cm4gb3V0O1xufTtcblxuLy8gQXJyYXkucHJvdG90eXBlLnJlZHVjZSBpcyBzdXBwb3J0ZWQgaW4gSUU5XG5leHBvcnRzLnJlZHVjZSA9IGZ1bmN0aW9uIHJlZHVjZShhcnJheSwgY2FsbGJhY2ssIG9wdF9pbml0aWFsVmFsdWUpIHtcbiAgaWYgKGFycmF5LnJlZHVjZSkgcmV0dXJuIGFycmF5LnJlZHVjZShjYWxsYmFjaywgb3B0X2luaXRpYWxWYWx1ZSk7XG4gIHZhciB2YWx1ZSwgaXNWYWx1ZVNldCA9IGZhbHNlO1xuXG4gIGlmICgyIDwgYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHZhbHVlID0gb3B0X2luaXRpYWxWYWx1ZTtcbiAgICBpc1ZhbHVlU2V0ID0gdHJ1ZTtcbiAgfVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGFycmF5Lmxlbmd0aDsgbCA+IGk7ICsraSkge1xuICAgIGlmIChhcnJheS5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgaWYgKGlzVmFsdWVTZXQpIHtcbiAgICAgICAgdmFsdWUgPSBjYWxsYmFjayh2YWx1ZSwgYXJyYXlbaV0sIGksIGFycmF5KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IGFycmF5W2ldO1xuICAgICAgICBpc1ZhbHVlU2V0ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59O1xuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG5pZiAoJ2FiJy5zdWJzdHIoLTEpICE9PSAnYicpIHtcbiAgZXhwb3J0cy5zdWJzdHIgPSBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuZ3RoKSB7XG4gICAgLy8gZGlkIHdlIGdldCBhIG5lZ2F0aXZlIHN0YXJ0LCBjYWxjdWxhdGUgaG93IG11Y2ggaXQgaXMgZnJvbSB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzdHJpbmdcbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcblxuICAgIC8vIGNhbGwgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uXG4gICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbmd0aCk7XG4gIH07XG59IGVsc2Uge1xuICBleHBvcnRzLnN1YnN0ciA9IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW5ndGgpIHtcbiAgICByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuZ3RoKTtcbiAgfTtcbn1cblxuLy8gU3RyaW5nLnByb3RvdHlwZS50cmltIGlzIHN1cHBvcnRlZCBpbiBJRTlcbmV4cG9ydHMudHJpbSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKTtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG59O1xuXG4vLyBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCBpcyBzdXBwb3J0ZWQgaW4gSUU5XG5leHBvcnRzLmJpbmQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgdmFyIGZuID0gYXJncy5zaGlmdCgpO1xuICBpZiAoZm4uYmluZCkgcmV0dXJuIGZuLmJpbmQuYXBwbHkoZm4sIGFyZ3MpO1xuICB2YXIgc2VsZiA9IGFyZ3Muc2hpZnQoKTtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBmbi5hcHBseShzZWxmLCBhcmdzLmNvbmNhdChbQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKV0pKTtcbiAgfTtcbn07XG5cbi8vIE9iamVjdC5jcmVhdGUgaXMgc3VwcG9ydGVkIGluIElFOVxuZnVuY3Rpb24gY3JlYXRlKHByb3RvdHlwZSwgcHJvcGVydGllcykge1xuICB2YXIgb2JqZWN0O1xuICBpZiAocHJvdG90eXBlID09PSBudWxsKSB7XG4gICAgb2JqZWN0ID0geyAnX19wcm90b19fJyA6IG51bGwgfTtcbiAgfVxuICBlbHNlIHtcbiAgICBpZiAodHlwZW9mIHByb3RvdHlwZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICd0eXBlb2YgcHJvdG90eXBlWycgKyAodHlwZW9mIHByb3RvdHlwZSkgKyAnXSAhPSBcXCdvYmplY3RcXCcnXG4gICAgICApO1xuICAgIH1cbiAgICB2YXIgVHlwZSA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIFR5cGUucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgIG9iamVjdCA9IG5ldyBUeXBlKCk7XG4gICAgb2JqZWN0Ll9fcHJvdG9fXyA9IHByb3RvdHlwZTtcbiAgfVxuICBpZiAodHlwZW9mIHByb3BlcnRpZXMgIT09ICd1bmRlZmluZWQnICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMob2JqZWN0LCBwcm9wZXJ0aWVzKTtcbiAgfVxuICByZXR1cm4gb2JqZWN0O1xufVxuZXhwb3J0cy5jcmVhdGUgPSB0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJyA/IE9iamVjdC5jcmVhdGUgOiBjcmVhdGU7XG5cbi8vIE9iamVjdC5rZXlzIGFuZCBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyBpcyBzdXBwb3J0ZWQgaW4gSUU5IGhvd2V2ZXJcbi8vIHRoZXkgZG8gc2hvdyBhIGRlc2NyaXB0aW9uIGFuZCBudW1iZXIgcHJvcGVydHkgb24gRXJyb3Igb2JqZWN0c1xuZnVuY3Rpb24gbm90T2JqZWN0KG9iamVjdCkge1xuICByZXR1cm4gKCh0eXBlb2Ygb2JqZWN0ICE9IFwib2JqZWN0XCIgJiYgdHlwZW9mIG9iamVjdCAhPSBcImZ1bmN0aW9uXCIpIHx8IG9iamVjdCA9PT0gbnVsbCk7XG59XG5cbmZ1bmN0aW9uIGtleXNTaGltKG9iamVjdCkge1xuICBpZiAobm90T2JqZWN0KG9iamVjdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0LmtleXMgY2FsbGVkIG9uIGEgbm9uLW9iamVjdFwiKTtcbiAgfVxuXG4gIHZhciByZXN1bHQgPSBbXTtcbiAgZm9yICh2YXIgbmFtZSBpbiBvYmplY3QpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIG5hbWUpKSB7XG4gICAgICByZXN1bHQucHVzaChuYW1lKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gZ2V0T3duUHJvcGVydHlOYW1lcyBpcyBhbG1vc3QgdGhlIHNhbWUgYXMgT2JqZWN0LmtleXMgb25lIGtleSBmZWF0dXJlXG4vLyAgaXMgdGhhdCBpdCByZXR1cm5zIGhpZGRlbiBwcm9wZXJ0aWVzLCBzaW5jZSB0aGF0IGNhbid0IGJlIGltcGxlbWVudGVkLFxuLy8gIHRoaXMgZmVhdHVyZSBnZXRzIHJlZHVjZWQgc28gaXQganVzdCBzaG93cyB0aGUgbGVuZ3RoIHByb3BlcnR5IG9uIGFycmF5c1xuZnVuY3Rpb24gcHJvcGVydHlTaGltKG9iamVjdCkge1xuICBpZiAobm90T2JqZWN0KG9iamVjdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgY2FsbGVkIG9uIGEgbm9uLW9iamVjdFwiKTtcbiAgfVxuXG4gIHZhciByZXN1bHQgPSBrZXlzU2hpbShvYmplY3QpO1xuICBpZiAoZXhwb3J0cy5pc0FycmF5KG9iamVjdCkgJiYgZXhwb3J0cy5pbmRleE9mKG9iamVjdCwgJ2xlbmd0aCcpID09PSAtMSkge1xuICAgIHJlc3VsdC5wdXNoKCdsZW5ndGgnKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG52YXIga2V5cyA9IHR5cGVvZiBPYmplY3Qua2V5cyA9PT0gJ2Z1bmN0aW9uJyA/IE9iamVjdC5rZXlzIDoga2V5c1NoaW07XG52YXIgZ2V0T3duUHJvcGVydHlOYW1lcyA9IHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyA9PT0gJ2Z1bmN0aW9uJyA/XG4gIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzIDogcHJvcGVydHlTaGltO1xuXG5pZiAobmV3IEVycm9yKCkuaGFzT3duUHJvcGVydHkoJ2Rlc2NyaXB0aW9uJykpIHtcbiAgdmFyIEVSUk9SX1BST1BFUlRZX0ZJTFRFUiA9IGZ1bmN0aW9uIChvYmosIGFycmF5KSB7XG4gICAgaWYgKHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRXJyb3JdJykge1xuICAgICAgYXJyYXkgPSBleHBvcnRzLmZpbHRlcihhcnJheSwgZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIG5hbWUgIT09ICdkZXNjcmlwdGlvbicgJiYgbmFtZSAhPT0gJ251bWJlcicgJiYgbmFtZSAhPT0gJ21lc3NhZ2UnO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbiAgfTtcblxuICBleHBvcnRzLmtleXMgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgcmV0dXJuIEVSUk9SX1BST1BFUlRZX0ZJTFRFUihvYmplY3QsIGtleXMob2JqZWN0KSk7XG4gIH07XG4gIGV4cG9ydHMuZ2V0T3duUHJvcGVydHlOYW1lcyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICByZXR1cm4gRVJST1JfUFJPUEVSVFlfRklMVEVSKG9iamVjdCwgZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpKTtcbiAgfTtcbn0gZWxzZSB7XG4gIGV4cG9ydHMua2V5cyA9IGtleXM7XG4gIGV4cG9ydHMuZ2V0T3duUHJvcGVydHlOYW1lcyA9IGdldE93blByb3BlcnR5TmFtZXM7XG59XG5cbi8vIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgLSBzdXBwb3J0ZWQgaW4gSUU4IGJ1dCBvbmx5IG9uIGRvbSBlbGVtZW50c1xuZnVuY3Rpb24gdmFsdWVPYmplY3QodmFsdWUsIGtleSkge1xuICByZXR1cm4geyB2YWx1ZTogdmFsdWVba2V5XSB9O1xufVxuXG5pZiAodHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgdHJ5IHtcbiAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHsnYSc6IDF9LCAnYScpO1xuICAgIGV4cG9ydHMuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcjtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIElFOCBkb20gZWxlbWVudCBpc3N1ZSAtIHVzZSBhIHRyeSBjYXRjaCBhbmQgZGVmYXVsdCB0byB2YWx1ZU9iamVjdFxuICAgIGV4cG9ydHMuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gdmFsdWVPYmplY3QodmFsdWUsIGtleSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufSBlbHNlIHtcbiAgZXhwb3J0cy5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPSB2YWx1ZU9iamVjdDtcbn1cbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCF1dGlsLmlzTnVtYmVyKG4pIHx8IG4gPCAwKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAodXRpbC5pc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmICh1dGlsLmlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodXRpbC5pc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodXRpbC5pc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghdXRpbC5pc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgdXRpbC5pc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmICh1dGlsLmlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAodXRpbC5pc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCF1dGlsLmlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIXV0aWwuaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG4gICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCF1dGlsLmlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICh1dGlsLmlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKHV0aWwuaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmICh1dGlsLmlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAodXRpbC5pc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKHV0aWwuaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTsiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIHNoaW1zID0gcmVxdWlyZSgnX3NoaW1zJyk7XG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgc2hpbXMuZm9yRWFjaChhcnJheSwgZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcyk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IHNoaW1zLmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gc2hpbXMuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cblxuICBzaGltcy5mb3JFYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IHNoaW1zLmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChzaGltcy5pbmRleE9mKGN0eC5zZWVuLCBkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gc2hpbXMucmVkdWNlKG91dHB1dCwgZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIHNoaW1zLmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmIG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmJpbmFyeVNsaWNlID09PSAnZnVuY3Rpb24nXG4gIDtcbn1cbmV4cG9ydHMuaXNCdWZmZXIgPSBpc0J1ZmZlcjtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gZnVuY3Rpb24oY3Rvciwgc3VwZXJDdG9yKSB7XG4gIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yO1xuICBjdG9yLnByb3RvdHlwZSA9IHNoaW1zLmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgY29uc3RydWN0b3I6IHtcbiAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH1cbiAgfSk7XG59O1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gc2hpbXMua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIiwiLy8gICAgIHV1aWQuanNcbi8vXG4vLyAgICAgQ29weXJpZ2h0IChjKSAyMDEwLTIwMTIgUm9iZXJ0IEtpZWZmZXJcbi8vICAgICBNSVQgTGljZW5zZSAtIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcblxuKGZ1bmN0aW9uKCkge1xuICB2YXIgX2dsb2JhbCA9IHRoaXM7XG5cbiAgLy8gVW5pcXVlIElEIGNyZWF0aW9uIHJlcXVpcmVzIGEgaGlnaCBxdWFsaXR5IHJhbmRvbSAjIGdlbmVyYXRvci4gIFdlIGZlYXR1cmVcbiAgLy8gZGV0ZWN0IHRvIGRldGVybWluZSB0aGUgYmVzdCBSTkcgc291cmNlLCBub3JtYWxpemluZyB0byBhIGZ1bmN0aW9uIHRoYXRcbiAgLy8gcmV0dXJucyAxMjgtYml0cyBvZiByYW5kb21uZXNzLCBzaW5jZSB0aGF0J3Mgd2hhdCdzIHVzdWFsbHkgcmVxdWlyZWRcbiAgdmFyIF9ybmc7XG5cbiAgLy8gTm9kZS5qcyBjcnlwdG8tYmFzZWQgUk5HIC0gaHR0cDovL25vZGVqcy5vcmcvZG9jcy92MC42LjIvYXBpL2NyeXB0by5odG1sXG4gIC8vXG4gIC8vIE1vZGVyYXRlbHkgZmFzdCwgaGlnaCBxdWFsaXR5XG4gIGlmICh0eXBlb2YoX2dsb2JhbC5yZXF1aXJlKSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBfcmIgPSBfZ2xvYmFsLnJlcXVpcmUoJ2NyeXB0bycpLnJhbmRvbUJ5dGVzO1xuICAgICAgX3JuZyA9IF9yYiAmJiBmdW5jdGlvbigpIHtyZXR1cm4gX3JiKDE2KTt9O1xuICAgIH0gY2F0Y2goZSkge31cbiAgfVxuXG4gIGlmICghX3JuZyAmJiBfZ2xvYmFsLmNyeXB0byAmJiBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKSB7XG4gICAgLy8gV0hBVFdHIGNyeXB0by1iYXNlZCBSTkcgLSBodHRwOi8vd2lraS53aGF0d2cub3JnL3dpa2kvQ3J5cHRvXG4gICAgLy9cbiAgICAvLyBNb2RlcmF0ZWx5IGZhc3QsIGhpZ2ggcXVhbGl0eVxuICAgIHZhciBfcm5kczggPSBuZXcgVWludDhBcnJheSgxNik7XG4gICAgX3JuZyA9IGZ1bmN0aW9uIHdoYXR3Z1JORygpIHtcbiAgICAgIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMoX3JuZHM4KTtcbiAgICAgIHJldHVybiBfcm5kczg7XG4gICAgfTtcbiAgfVxuXG4gIGlmICghX3JuZykge1xuICAgIC8vIE1hdGgucmFuZG9tKCktYmFzZWQgKFJORylcbiAgICAvL1xuICAgIC8vIElmIGFsbCBlbHNlIGZhaWxzLCB1c2UgTWF0aC5yYW5kb20oKS4gIEl0J3MgZmFzdCwgYnV0IGlzIG9mIHVuc3BlY2lmaWVkXG4gICAgLy8gcXVhbGl0eS5cbiAgICB2YXIgIF9ybmRzID0gbmV3IEFycmF5KDE2KTtcbiAgICBfcm5nID0gZnVuY3Rpb24oKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgcjsgaSA8IDE2OyBpKyspIHtcbiAgICAgICAgaWYgKChpICYgMHgwMykgPT09IDApIHIgPSBNYXRoLnJhbmRvbSgpICogMHgxMDAwMDAwMDA7XG4gICAgICAgIF9ybmRzW2ldID0gciA+Pj4gKChpICYgMHgwMykgPDwgMykgJiAweGZmO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gX3JuZHM7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEJ1ZmZlciBjbGFzcyB0byB1c2VcbiAgdmFyIEJ1ZmZlckNsYXNzID0gdHlwZW9mKF9nbG9iYWwuQnVmZmVyKSA9PSAnZnVuY3Rpb24nID8gX2dsb2JhbC5CdWZmZXIgOiBBcnJheTtcblxuICAvLyBNYXBzIGZvciBudW1iZXIgPC0+IGhleCBzdHJpbmcgY29udmVyc2lvblxuICB2YXIgX2J5dGVUb0hleCA9IFtdO1xuICB2YXIgX2hleFRvQnl0ZSA9IHt9O1xuICBmb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gICAgX2J5dGVUb0hleFtpXSA9IChpICsgMHgxMDApLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSk7XG4gICAgX2hleFRvQnl0ZVtfYnl0ZVRvSGV4W2ldXSA9IGk7XG4gIH1cblxuICAvLyAqKmBwYXJzZSgpYCAtIFBhcnNlIGEgVVVJRCBpbnRvIGl0J3MgY29tcG9uZW50IGJ5dGVzKipcbiAgZnVuY3Rpb24gcGFyc2UocywgYnVmLCBvZmZzZXQpIHtcbiAgICB2YXIgaSA9IChidWYgJiYgb2Zmc2V0KSB8fCAwLCBpaSA9IDA7XG5cbiAgICBidWYgPSBidWYgfHwgW107XG4gICAgcy50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1swLTlhLWZdezJ9L2csIGZ1bmN0aW9uKG9jdCkge1xuICAgICAgaWYgKGlpIDwgMTYpIHsgLy8gRG9uJ3Qgb3ZlcmZsb3chXG4gICAgICAgIGJ1ZltpICsgaWkrK10gPSBfaGV4VG9CeXRlW29jdF07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBaZXJvIG91dCByZW1haW5pbmcgYnl0ZXMgaWYgc3RyaW5nIHdhcyBzaG9ydFxuICAgIHdoaWxlIChpaSA8IDE2KSB7XG4gICAgICBidWZbaSArIGlpKytdID0gMDtcbiAgICB9XG5cbiAgICByZXR1cm4gYnVmO1xuICB9XG5cbiAgLy8gKipgdW5wYXJzZSgpYCAtIENvbnZlcnQgVVVJRCBieXRlIGFycmF5IChhbGEgcGFyc2UoKSkgaW50byBhIHN0cmluZyoqXG4gIGZ1bmN0aW9uIHVucGFyc2UoYnVmLCBvZmZzZXQpIHtcbiAgICB2YXIgaSA9IG9mZnNldCB8fCAwLCBidGggPSBfYnl0ZVRvSGV4O1xuICAgIHJldHVybiAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV07XG4gIH1cblxuICAvLyAqKmB2MSgpYCAtIEdlbmVyYXRlIHRpbWUtYmFzZWQgVVVJRCoqXG4gIC8vXG4gIC8vIEluc3BpcmVkIGJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9MaW9zSy9VVUlELmpzXG4gIC8vIGFuZCBodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvdXVpZC5odG1sXG5cbiAgLy8gcmFuZG9tICMncyB3ZSBuZWVkIHRvIGluaXQgbm9kZSBhbmQgY2xvY2tzZXFcbiAgdmFyIF9zZWVkQnl0ZXMgPSBfcm5nKCk7XG5cbiAgLy8gUGVyIDQuNSwgY3JlYXRlIGFuZCA0OC1iaXQgbm9kZSBpZCwgKDQ3IHJhbmRvbSBiaXRzICsgbXVsdGljYXN0IGJpdCA9IDEpXG4gIHZhciBfbm9kZUlkID0gW1xuICAgIF9zZWVkQnl0ZXNbMF0gfCAweDAxLFxuICAgIF9zZWVkQnl0ZXNbMV0sIF9zZWVkQnl0ZXNbMl0sIF9zZWVkQnl0ZXNbM10sIF9zZWVkQnl0ZXNbNF0sIF9zZWVkQnl0ZXNbNV1cbiAgXTtcblxuICAvLyBQZXIgNC4yLjIsIHJhbmRvbWl6ZSAoMTQgYml0KSBjbG9ja3NlcVxuICB2YXIgX2Nsb2Nrc2VxID0gKF9zZWVkQnl0ZXNbNl0gPDwgOCB8IF9zZWVkQnl0ZXNbN10pICYgMHgzZmZmO1xuXG4gIC8vIFByZXZpb3VzIHV1aWQgY3JlYXRpb24gdGltZVxuICB2YXIgX2xhc3RNU2VjcyA9IDAsIF9sYXN0TlNlY3MgPSAwO1xuXG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYnJvb2ZhL25vZGUtdXVpZCBmb3IgQVBJIGRldGFpbHNcbiAgZnVuY3Rpb24gdjEob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcbiAgICB2YXIgYiA9IGJ1ZiB8fCBbXTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgdmFyIGNsb2Nrc2VxID0gb3B0aW9ucy5jbG9ja3NlcSAhPSBudWxsID8gb3B0aW9ucy5jbG9ja3NlcSA6IF9jbG9ja3NlcTtcblxuICAgIC8vIFVVSUQgdGltZXN0YW1wcyBhcmUgMTAwIG5hbm8tc2Vjb25kIHVuaXRzIHNpbmNlIHRoZSBHcmVnb3JpYW4gZXBvY2gsXG4gICAgLy8gKDE1ODItMTAtMTUgMDA6MDApLiAgSlNOdW1iZXJzIGFyZW4ndCBwcmVjaXNlIGVub3VnaCBmb3IgdGhpcywgc29cbiAgICAvLyB0aW1lIGlzIGhhbmRsZWQgaW50ZXJuYWxseSBhcyAnbXNlY3MnIChpbnRlZ2VyIG1pbGxpc2Vjb25kcykgYW5kICduc2VjcydcbiAgICAvLyAoMTAwLW5hbm9zZWNvbmRzIG9mZnNldCBmcm9tIG1zZWNzKSBzaW5jZSB1bml4IGVwb2NoLCAxOTcwLTAxLTAxIDAwOjAwLlxuICAgIHZhciBtc2VjcyA9IG9wdGlvbnMubXNlY3MgIT0gbnVsbCA/IG9wdGlvbnMubXNlY3MgOiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAgIC8vIFBlciA0LjIuMS4yLCB1c2UgY291bnQgb2YgdXVpZCdzIGdlbmVyYXRlZCBkdXJpbmcgdGhlIGN1cnJlbnQgY2xvY2tcbiAgICAvLyBjeWNsZSB0byBzaW11bGF0ZSBoaWdoZXIgcmVzb2x1dGlvbiBjbG9ja1xuICAgIHZhciBuc2VjcyA9IG9wdGlvbnMubnNlY3MgIT0gbnVsbCA/IG9wdGlvbnMubnNlY3MgOiBfbGFzdE5TZWNzICsgMTtcblxuICAgIC8vIFRpbWUgc2luY2UgbGFzdCB1dWlkIGNyZWF0aW9uIChpbiBtc2VjcylcbiAgICB2YXIgZHQgPSAobXNlY3MgLSBfbGFzdE1TZWNzKSArIChuc2VjcyAtIF9sYXN0TlNlY3MpLzEwMDAwO1xuXG4gICAgLy8gUGVyIDQuMi4xLjIsIEJ1bXAgY2xvY2tzZXEgb24gY2xvY2sgcmVncmVzc2lvblxuICAgIGlmIChkdCA8IDAgJiYgb3B0aW9ucy5jbG9ja3NlcSA9PSBudWxsKSB7XG4gICAgICBjbG9ja3NlcSA9IGNsb2Nrc2VxICsgMSAmIDB4M2ZmZjtcbiAgICB9XG5cbiAgICAvLyBSZXNldCBuc2VjcyBpZiBjbG9jayByZWdyZXNzZXMgKG5ldyBjbG9ja3NlcSkgb3Igd2UndmUgbW92ZWQgb250byBhIG5ld1xuICAgIC8vIHRpbWUgaW50ZXJ2YWxcbiAgICBpZiAoKGR0IDwgMCB8fCBtc2VjcyA+IF9sYXN0TVNlY3MpICYmIG9wdGlvbnMubnNlY3MgPT0gbnVsbCkge1xuICAgICAgbnNlY3MgPSAwO1xuICAgIH1cblxuICAgIC8vIFBlciA0LjIuMS4yIFRocm93IGVycm9yIGlmIHRvbyBtYW55IHV1aWRzIGFyZSByZXF1ZXN0ZWRcbiAgICBpZiAobnNlY3MgPj0gMTAwMDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigndXVpZC52MSgpOiBDYW5cXCd0IGNyZWF0ZSBtb3JlIHRoYW4gMTBNIHV1aWRzL3NlYycpO1xuICAgIH1cblxuICAgIF9sYXN0TVNlY3MgPSBtc2VjcztcbiAgICBfbGFzdE5TZWNzID0gbnNlY3M7XG4gICAgX2Nsb2Nrc2VxID0gY2xvY2tzZXE7XG5cbiAgICAvLyBQZXIgNC4xLjQgLSBDb252ZXJ0IGZyb20gdW5peCBlcG9jaCB0byBHcmVnb3JpYW4gZXBvY2hcbiAgICBtc2VjcyArPSAxMjIxOTI5MjgwMDAwMDtcblxuICAgIC8vIGB0aW1lX2xvd2BcbiAgICB2YXIgdGwgPSAoKG1zZWNzICYgMHhmZmZmZmZmKSAqIDEwMDAwICsgbnNlY3MpICUgMHgxMDAwMDAwMDA7XG4gICAgYltpKytdID0gdGwgPj4+IDI0ICYgMHhmZjtcbiAgICBiW2krK10gPSB0bCA+Pj4gMTYgJiAweGZmO1xuICAgIGJbaSsrXSA9IHRsID4+PiA4ICYgMHhmZjtcbiAgICBiW2krK10gPSB0bCAmIDB4ZmY7XG5cbiAgICAvLyBgdGltZV9taWRgXG4gICAgdmFyIHRtaCA9IChtc2VjcyAvIDB4MTAwMDAwMDAwICogMTAwMDApICYgMHhmZmZmZmZmO1xuICAgIGJbaSsrXSA9IHRtaCA+Pj4gOCAmIDB4ZmY7XG4gICAgYltpKytdID0gdG1oICYgMHhmZjtcblxuICAgIC8vIGB0aW1lX2hpZ2hfYW5kX3ZlcnNpb25gXG4gICAgYltpKytdID0gdG1oID4+PiAyNCAmIDB4ZiB8IDB4MTA7IC8vIGluY2x1ZGUgdmVyc2lvblxuICAgIGJbaSsrXSA9IHRtaCA+Pj4gMTYgJiAweGZmO1xuXG4gICAgLy8gYGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWRgIChQZXIgNC4yLjIgLSBpbmNsdWRlIHZhcmlhbnQpXG4gICAgYltpKytdID0gY2xvY2tzZXEgPj4+IDggfCAweDgwO1xuXG4gICAgLy8gYGNsb2NrX3NlcV9sb3dgXG4gICAgYltpKytdID0gY2xvY2tzZXEgJiAweGZmO1xuXG4gICAgLy8gYG5vZGVgXG4gICAgdmFyIG5vZGUgPSBvcHRpb25zLm5vZGUgfHwgX25vZGVJZDtcbiAgICBmb3IgKHZhciBuID0gMDsgbiA8IDY7IG4rKykge1xuICAgICAgYltpICsgbl0gPSBub2RlW25dO1xuICAgIH1cblxuICAgIHJldHVybiBidWYgPyBidWYgOiB1bnBhcnNlKGIpO1xuICB9XG5cbiAgLy8gKipgdjQoKWAgLSBHZW5lcmF0ZSByYW5kb20gVVVJRCoqXG5cbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9icm9vZmEvbm9kZS11dWlkIGZvciBBUEkgZGV0YWlsc1xuICBmdW5jdGlvbiB2NChvcHRpb25zLCBidWYsIG9mZnNldCkge1xuICAgIC8vIERlcHJlY2F0ZWQgLSAnZm9ybWF0JyBhcmd1bWVudCwgYXMgc3VwcG9ydGVkIGluIHYxLjJcbiAgICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcblxuICAgIGlmICh0eXBlb2Yob3B0aW9ucykgPT0gJ3N0cmluZycpIHtcbiAgICAgIGJ1ZiA9IG9wdGlvbnMgPT0gJ2JpbmFyeScgPyBuZXcgQnVmZmVyQ2xhc3MoMTYpIDogbnVsbDtcbiAgICAgIG9wdGlvbnMgPSBudWxsO1xuICAgIH1cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHZhciBybmRzID0gb3B0aW9ucy5yYW5kb20gfHwgKG9wdGlvbnMucm5nIHx8IF9ybmcpKCk7XG5cbiAgICAvLyBQZXIgNC40LCBzZXQgYml0cyBmb3IgdmVyc2lvbiBhbmQgYGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWRgXG4gICAgcm5kc1s2XSA9IChybmRzWzZdICYgMHgwZikgfCAweDQwO1xuICAgIHJuZHNbOF0gPSAocm5kc1s4XSAmIDB4M2YpIHwgMHg4MDtcblxuICAgIC8vIENvcHkgYnl0ZXMgdG8gYnVmZmVyLCBpZiBwcm92aWRlZFxuICAgIGlmIChidWYpIHtcbiAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCAxNjsgaWkrKykge1xuICAgICAgICBidWZbaSArIGlpXSA9IHJuZHNbaWldO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBidWYgfHwgdW5wYXJzZShybmRzKTtcbiAgfVxuXG4gIC8vIEV4cG9ydCBwdWJsaWMgQVBJXG4gIHZhciB1dWlkID0gdjQ7XG4gIHV1aWQudjEgPSB2MTtcbiAgdXVpZC52NCA9IHY0O1xuICB1dWlkLnBhcnNlID0gcGFyc2U7XG4gIHV1aWQudW5wYXJzZSA9IHVucGFyc2U7XG4gIHV1aWQuQnVmZmVyQ2xhc3MgPSBCdWZmZXJDbGFzcztcblxuICBpZiAodHlwZW9mKG1vZHVsZSkgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAvLyBQdWJsaXNoIGFzIG5vZGUuanMgbW9kdWxlXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB1dWlkO1xuICB9IGVsc2UgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBQdWJsaXNoIGFzIEFNRCBtb2R1bGVcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7cmV0dXJuIHV1aWQ7fSk7XG4gXG5cbiAgfSBlbHNlIHtcbiAgICAvLyBQdWJsaXNoIGFzIGdsb2JhbCAoaW4gYnJvd3NlcnMpXG4gICAgdmFyIF9wcmV2aW91c1Jvb3QgPSBfZ2xvYmFsLnV1aWQ7XG5cbiAgICAvLyAqKmBub0NvbmZsaWN0KClgIC0gKGJyb3dzZXIgb25seSkgdG8gcmVzZXQgZ2xvYmFsICd1dWlkJyB2YXIqKlxuICAgIHV1aWQubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgX2dsb2JhbC51dWlkID0gX3ByZXZpb3VzUm9vdDtcbiAgICAgIHJldHVybiB1dWlkO1xuICAgIH07XG5cbiAgICBfZ2xvYmFsLnV1aWQgPSB1dWlkO1xuICB9XG59KS5jYWxsKHRoaXMpO1xuIl19
;