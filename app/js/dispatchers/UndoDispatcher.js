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
