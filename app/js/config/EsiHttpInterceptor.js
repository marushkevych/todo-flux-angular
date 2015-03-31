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