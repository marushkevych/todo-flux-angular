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

