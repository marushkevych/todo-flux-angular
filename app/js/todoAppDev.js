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
