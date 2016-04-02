var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var log = {
    'info': function(text){
        console.log(text); 
    }
};

var ChannelManager = (function(){
    var channels = {
        'General': []
    };
    
    return {
        'addMessage': function(msgData){
            channels[msgData.channel].push(msgData);
        },
        'addChannel': function(channelName){
            if (channelName in channels){
                throw "channel " + channelName + " already exists";
            }
            channels[channelName] = [];
        },
        'generateSystemMessage': function(msg){
            return JSON.stringify({
                'username': 'system',
                'date_recieved': Date.now(),
                'message': msg
            });
        },
        'getChannel': function(channelName){
            if (!(channelName in channels)){
                return [];
            }
            return channels[channelName];
        }
    }
})();


/******************* http handlers ********************/
app.get('/', function(request, response){
    response.sendFile(__dirname + '/index.html');
});
app.get('/client.js', function(request, response) {
   response.sendFile(__dirname + '/client.js'); 
});

/******************* socket handlers ********************/
io.on('connection', function(socket) {
    var username = 'lurker';
    socket.broadcast.emit('chat', ChannelManager.generateSystemMessage('beware! a lurker has joined!'));
    console.log('a user connected');
    var existingMsgs = ChannelManager.getChannel('General');
    for (var i = 0; i < existingMsgs.length; i++){
        //sending old chat messages to new client
        socket.emit('chat', JSON.stringify(existingMsgs[i]));
    }
    
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
    socket.on('chat', function(data){
        var msgData = JSON.parse(data);
        if (username != msgData['username']){
            socket.broadcast.emit('chat',
                ChannelManager.generateSystemMessage(
                'a lurker has identified themselves as ' + msgData['username']
            ));
            username = msgData['username'];
        }
        
        msgData['date_recieved'] = Date.now();
        ChannelManager.addMessage(msgData);
        
        console.log('chat recieved: ' + data);
        //sending to all 
        io.emit('chat', JSON.stringify(msgData));
    });
    //tracking if the user is typing or not
    socket.on('meta:typing', function(data){
        //metadata includes user who is or is not typing
        // looks like {'username': 'blah', 'isTyping': false}
        //only telling other sockets
        socket.broadcast.emit('meta:typing', data);
    });
    
});


// TODO: code written to run in Cloud9 IDE. need to create wrapper for 
// could 9 ide configuration settings (e.g: process.env.PORT)
http.listen(process.env.PORT, function(){
   console.log('listening on *:' + process.env.PORT); 
});