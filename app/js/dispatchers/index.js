'use strict';
var EventEmitter = require('eventemitter2').EventEmitter2;

var module = angular.module('esi.dispatchers', []);

module.value('Dispatcher', new EventEmitter());
module.factory("UndoDispatcher", require("./UndoDispatcher"));

