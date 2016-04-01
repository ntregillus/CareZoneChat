
var socket = io();
var carezonechat = angular.module('carezonechat', []);

function mainController($scope, $http){
    $scope.messages = [];
    $scope.currentChannel = 'General';
    $scope.sendMessage = function(){
        if ($scope.message.length > 0) {
            var data = JSON.stringify({
                'message': $scope.message,
                'channel': $scope.currentChannel
            });
            socket.emit('chat', data);
            $scope.message = '';
        }
    };
}