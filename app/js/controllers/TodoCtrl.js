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