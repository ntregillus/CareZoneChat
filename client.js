
//var socket = io();
var app = angular.module('CareZoneChat', []);

/*************** angular socket wrapper **********/
// this is needed due to the angular processing pipeline.
// aka socket could return at an unfortunate time, and needs
// to be applied at the correct time for the controller to handle
app.factory('$socket', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});


/*************** controller *********************/
function CareZoneChatController($scope, $http, $socket, $timeout){
    $scope.messages = [];
    $scope.typing = false;
    $scope.typingUsers = [];
    $scope.username = '';
    $scope.currentChannel = 'General';
    // angular setup
    $scope.sendMessage = function(){
        if ($scope.message.length > 0) {
            var data = JSON.stringify({
                'message': $scope.message,
                'channel': $scope.currentChannel,
                'username': $scope.username
            });
            $socket.emit('chat', data);
            $scope.message = '';
            $scope.typing = false;
            $socket.emit('meta:typing', JSON.stringify({
                    'username': $scope.username,
                    'isTyping': false
            }));
        }
    };
    $scope.$watch('message', function(){
        var msgAsOfKeyUp = $scope.message;
        if (!msgAsOfKeyUp) {
            return; 
        }
        if ($scope.typing == false){
            $socket.emit('meta:typing', JSON.stringify({
                'username': $scope.username,
                'isTyping': true
            }));
            $scope.typing = true;
        }
        
        $timeout(function(){
            if (msgAsOfKeyUp == $scope.message && $scope.typing){
                $socket.emit('meta:typing', JSON.stringify({
                    'username': $scope.username,
                    'isTyping': false
                }));
                $scope.typing = false;
            }
        }, 10000);
    });
    
    // client sockets 
    $socket.on('chat', function(data){
        var msgData = JSON.parse(data);
        $scope.messages.push(msgData);
    });
    $socket.on('meta:typing', function(data) {
        var metaData = JSON.parse(data);
        var index = $scope.typingUsers.indexOf(metaData.username);
        if (metaData.isTyping && index == -1){
            $scope.typingUsers.push(metaData.username);
        }
        else if (index >= 0 && !metaData.isTyping){
            $scope.typingUsers.splice(index, 1);
        }
    });
    $socket.on('disconnect', function(){
        $scope.messages.push({
            'username': 'system',
            'date_recieved': Date.now(),
            'message': 'server disconnected'
        });
    });
    $socket.on('reconnect', function() {
         $scope.messages.push({
            'username': 'system',
            'date_recieved': Date.now(),
            'message': 'server reconnected'
        });       
    });
}