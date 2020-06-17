const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
    // console.log("We have a new connection");

    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });

        if(error) return callback(error);

        socket.join(user.room);

        socket.emit('message', {user: 'admin', text: `Welcome, ${user.name}`});
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined the chat`});

        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)})

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('message', {user: user.name, text: message});

        callback();
    })


    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        
        if (user) {
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left the chat`});
            io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});
        }

    });


});

app.use(router);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));






// Possible TODOs
// pass info with props instead of url query
// update css
// move placheolderrs on join page
// add onKeyPress jor join page, chaneg below
//  onKeyPress={(event) => event.key === 'Enter' ? sendMessage(event) : null }
