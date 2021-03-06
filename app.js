const express = require('express')
const app = express()
var http = require('http').Server(app);
var io = require('socket.io')(http);
const process = require('process');

app.use(express.static('public/'+process.argv[3]))
app.use(express.static('public'))

app.get('/', function(req, res) {
   res.sendFile(__dirname + '/public/'+process.argv[3]+'/index.html');
   res.redirect('http://localhost:'+process.argv[2]+'/');
});

var angleToGo;
const separation = 0.1
var noUsers = 0;
var activeUser = 1;
var angleNext = 0;
var lookingRight = 1; 
var startRight = true;
var receivedConfirmation = [];
var projectsReloaded = 0;
var noUsersReloaded = null;
var actuallyReloaded = 0;
io.on('connection', function(socket) {
   var id;
   var isATablet = false;
   console.log('New Connection');
   
   socket.emit('getWindowSize');

   socket.on('windowSize', function(data) {

      noUsers++;
      id = noUsers;

      
      socket.join('Window');

      var aspect = data.width/data.height;
      angleToGo=-18.7339*(aspect*aspect)+93.5448*aspect+0.0208;
      var angleThisSocket = Math.floor((id/2))*angleToGo;
      if(id%2 == 0){
         angleThisSocket = -angleThisSocket;
      }
      console.log('Screen number ' + noUsers + ' connected with id ' + id);
      socket.emit('idSet', {id: id, active: id==activeUser, angle: angleThisSocket, 
                           x: separation * (-(angleThisSocket)/angleToGo),
                           z: 0});
      io.sockets.to('Window').emit('newWindow', noUsers);
      
      const interval = setInterval(function() {
         // console.log("synchronising")
         io.sockets.to('Window').emit('whatTime');
      }, 5000);
   })

   socket.on('windowResize', function(data) {
      var aspect = data.width/data.height;
      angleToGo=-18.7339*(aspect*aspect)+93.5448*aspect+0.0208;

      var angleThisSocket = Math.floor((id/2))*angleToGo;
      if(id%2 == 0){
         angleThisSocket = -angleThisSocket;
      }
      // console.log(lookingRight)
      console.log(angleToGo + " " + (id%2) + " " + Math.floor((id/2)) + " " +angleThisSocket);
      socket.emit('idReset', {id: id, active: id==activeUser, angle: angleThisSocket, 
                           x: separation * (-(angleThisSocket)/angleToGo),
                           z: 0});

   })

   socket.on('currentTime', function(data) {
      // console.log("receive one " + receivedConfirmation)
      io.sockets.to('Window').emit('setCube', data);
   })

   socket.on('confirmation', function(data) {
      // console.log("confirmation " + receivedConfirmation + " " + data)
      if(receivedConfirmation.indexOf(data) == -1){
         receivedConfirmation.push(data);
         if(receivedConfirmation.length >= noUsers){
            receivedConfirmation = []
            io.sockets.to('Window').emit('start', data);
         }
      }
   })

   socket.on('moveKeySend', function(data) {
      io.sockets.to('Window').emit('moveKeySock', data);
   })

   socket.on('serverMoveUp', function() {
      io.sockets.to('Window').emit('moveUp');
   })
   socket.on('serverMoveDown', function() {
      io.sockets.to('Window').emit('moveDown');
   })
   socket.on('serverMoveLeft', function() {
      io.sockets.to('Window').emit('moveLeft');
   })
   socket.on('serverMoveRight', function() {
      io.sockets.to('Window').emit('moveRight');
   })
   socket.on('serverMoveBackwards', function() {
      io.sockets.to('Window').emit('moveBackwards');
   })
   socket.on('serverMoveForward', function() {
      io.sockets.to('Window').emit('moveForward');
   })

   socket.on('serverRotateZPos', function() {
      io.sockets.to('Window').emit('rotateZPos');
   })
   socket.on('serverRotateZNeg', function() {
      io.sockets.to('Window').emit('rotateZNeg');
   })
   socket.on('serverRotateYPos', function() {
      io.sockets.to('Window').emit('rotateYPos');
   })
   socket.on('serverRotateYNeg', function() {
      io.sockets.to('Window').emit('rotateYNeg');
   })
   socket.on('serverRotateXPos', function() {
      io.sockets.to('Window').emit('rotateXPos');
   })
   socket.on('serverRotateXNeg', function() {
      io.sockets.to('Window').emit('rotateXNeg');
   })

   socket.on('serverResetCamera', function() {
      io.sockets.to('Window').emit('resetCamera');
   })

   socket.on('serverSwitchCamera', function() {
      io.sockets.to('Window').emit('switchCamera');
   })

   socket.on('updateIDReorganise', function(data) {
      console.log("reorganise " + id)
      if(id==2){id = 1;}
      else if(id%2 == 0){
         id = id-2;
      }else{
         if(data > id){
            id += 2;
         }
      }
      console.log("reorganise " + id)
   })

   socket.on('updateIDMove', function(data) {
      console.log("move " + id)
      if(data%2 == id%2 && id > data){id -=2;}
      console.log("move " + id)
   })

   socket.on('updateIDMirror', function() {
      console.log("mirror " + id)
      if(id > 1){
         if(id%2==1){
            id--;
         }else{
            id++;
         }
      }
      console.log("mirror " + id)
   })

   socket.on('signalTablet', function() {
      isATablet = true;
      console.log("It's a tablet")
      socket.join('Tablet');
   })

   
   socket.on('newProjectServer', function(idSocket) {
      console.log("reloading " + id + "  and " + idSocket);
      noUsersReloaded = idSocket
      projectsReloaded++;
      if(projectsReloaded == idSocket){
         angleToGo = null;
         noUsers = 0;
         activeUser = 1;
         angleNext = 0;
         lookingRight = 1; 
         startRight = true;
         receivedConfirmation = [];
         projectsReloaded = 0;
         sendReload();
      }
   })

   socket.on('serverReload', function() {
      console.log("reloading " + id);
      sendReload();
   })

   function sendReload(){
      console.log("send reloading " + id + " to " + (projectsReloaded+1));
      projectsReloaded++;
      io.sockets.to('Window').emit('reload', projectsReloaded);
   }

   socket.on('disconnect', (reason) => {
      console.log('Disconnection')
      if(projectsReloaded != 0){
         actuallyReloaded++;
      }
      if(!isATablet && projectsReloaded == 0){
         console.log('Screen number ' + id + ' disconnected and there are ' + noUsers + ' users');
      
         // console.log(noUsers + " " + angleNext + " " + lookingRight);
         noUsers--;
         if(noUsers%2 ==0){ 
            angleNext-=angleToGo; 
            if(id%2 == 1){
               lookingRight = -lookingRight;
            }
         }else{
            lookingRight = -lookingRight;
         }
         console.log(noUsers + " " + angleNext + " " + lookingRight);
   
         if(noUsers %2 == 1 && id%2 ==1){
            io.sockets.emit('updateIDReorganise', id);
            io.sockets.emit('updateIDReorganiseSock', {noUser:id, startRight:startRight});
         }else{
            io.sockets.emit('updateIDMove', id);
            io.sockets.emit('updateIDMoveSock', id);
   
            if(id%2==0 && noUsers%2==0){
               io.sockets.emit('updateIDMirror');
               io.sockets.emit('updateIDMirrorSock');
               startRight = !startRight
            }
         }
         // io.sockets.emit('whatTime');
      
      }

      console.log('Number users reloaded ' + noUsersReloaded + ' ' + actuallyReloaded)
      if(actuallyReloaded == noUsersReloaded){
            projectsReloaded=0;
            noUsersReloaded=null;
            actuallyReloaded=0;
            console.log('Number users reloaded reassignment ' + noUsersReloaded + ' ' + projectsReloaded);
      }
   });
});

http.listen(process.argv[2], function() {
   console.log('listening on localhost:'+process.argv[2]);
});