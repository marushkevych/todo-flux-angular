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