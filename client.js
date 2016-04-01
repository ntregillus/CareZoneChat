
//var socket = io();
var app = angular.module('CareZoneChat', []);

/*************** angular socket wrapper **********/
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
function CareZoneChatController($scope, $http, $socket){
    $scope.messages = [];
    $scope.username = '';
    $scope.currentChannel = 'General';
    $scope.sendMessage = function(){
        if ($scope.message.length > 0) {
            var data = JSON.stringify({
                'message': $scope.message,
                'channel': $scope.currentChannel,
                'username': $scope.username
            });
            $socket.emit('chat', data);
            $scope.message = '';
        }
    };
    $socket.on('chat', function(data){
        var msgData = JSON.parse(data);
        $scope.messages.push(msgData);
    });
}