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


var module = angular.module('app', ['angularSpinner',
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

