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
    console.log('a user connected');
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
    socket.on('chat', function(data){
        var msgData = JSON.parse(data);
        msgData['date_recieved'] = Date.now();
        ChannelManager.addMessage(msgData);
        
        console.log('chat recieved: ' + data);
        //sending to all 
        io.emit('chat', JSON.stringify(msgData));
    });
});


// TODO: code written to run in Cloud9 IDE. need to create wrapper for 
// could 9 ide configuration settings (e.g: process.env.PORT)
http.listen(process.env.PORT, function(){
   console.log('listening on *:' + process.env.PORT); 
});