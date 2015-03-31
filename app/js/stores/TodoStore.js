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

