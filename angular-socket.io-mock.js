/* global angular: false */
var ng = angular.module("btford.socket-io",[]);
ng.provider("socketFactory",function() {
  this.$get = function($rootScope) {
    
    return function socketFactory(options) {

      var obj = {}
      obj.events = {}
      obj.emits = {}
      
      var prefix = options.prefix || "socket:";
  
      // intercept 'on' calls and capture the callbacks
      obj.on = function(eventName, callback) {
        var events = this.events[eventName];
        if(!events) {
          events = this.events[eventName] = [];
        }
        events.push(callback);
      };
  
      // intercept 'emit' calls from the client and record them to assert against in the test
      obj.emit = function(eventName) {
        var args = Array.prototype.slice.call(arguments,1);
  
        if(!this.emits[eventName]) {
          this.emits[eventName] = [];
        }
        this.emits[eventName].push(args);
      };
  
      //simulate an inbound message to the socket from the server (only called from the test)
      obj.receive = function(eventName) {
        var args = Array.prototype.slice.call(arguments,1);
        
        var events = this.events[eventName];
        if(events) {
          angular.forEach(events, function(callback) {
            $rootScope.$apply(function() {
              callback.apply(this, args);
            });
          });
        }
      };
      
      //simulate forward call
      obj.forward = function (events, scope) {
        if(events instanceof Array === false) {
          events = [events];
        }
        if(!scope) {
          scope = defaultScope;
        }
        events.forEach(function(eventName) {
          var prefixedEvent = prefix + eventName;
          var forwardBroadcast = function() {
            scope.$broadcast(prefixedEvent)
          });
          scope.$on('$destroy', function () {
            var objEvents = obj.events[eventName];
            if(objEvents) {
              angular.forEach(objEvents, function(fn, i) {
                if(fn === forwardBroadcast) {
                  objEvents.splice(i, 1)
                  return;
                }
              });
            }
          });
          obj.on(eventName, forwardBroadcast);
        });
      };
      
      return obj;
    };
  };
});
