const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
require('dotenv/config')

const { addUser, removeUser, getUser, getUsersInRoom, getAllUsers } = require('./users')
const { newPuzzle, getPuzzle, checkPuzzle, removePuzzle, endTurn, guessWord, newGame, newMessage, selectWord } = require('./puzzle')

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

const server = http.createServer(app);
const io = socketio(server);


io.on('connection', (socket) => {
  console.log('We have a new connection!');

  socket.on('join', async ({name, room, spymaster}, callback) => {

  	const { error, user } = addUser({id:socket.id, name, room, spymaster});
  	const puzzle = await checkPuzzle(room)

  	if(error) return callback({error})

  	socket.join(user.room);

  	// console.log('puzzle',puzzle)
  	// console.log( 'all users: ', getAllUsers() )

  	io.to(user.room).emit('onlineUsers', {room: user.room, users: getUsersInRoom(user.room)})
  	io.to(user.room).emit('getPuzzle', getPuzzle(room) )
  	io.to(user.room).emit('getPuzzle', newMessage(room, `${user.name} has joined the room ${user.room}`))

  	callback({name:user.name, spymaster:user.spymaster});
  })

  socket.on('endTurn', (prop) => {
  	const user = getUser(socket.id);
  	io.to(user.room).emit('getPuzzle', endTurn(user.room) )
  })

  socket.on('newGame', async (prop) => {
  	const user = getUser(socket.id);
  	const game = await newGame(user.room)
  	io.to(user.room).emit('getPuzzle', game )
  })

  socket.on('selectWord', (word) => {
  	const user = getUser(socket.id);
  	io.to(user.room).emit('getPuzzle', selectWord(user.room, word, user.name) )
  })

  socket.on('guessWord', (word) => {
  	const user = getUser(socket.id);
  	io.to(user.room).emit('getPuzzle', guessWord(user.room, word, user.name) )
  })

  socket.on('disconnect', () => {

    const user = removeUser(socket.id);

    if(user) {
    	const UsersInRoom = getUsersInRoom(user.room);
    	if(UsersInRoom.length === 0) {
    		removePuzzle(user.room)
    	}
    	io.to(user.room).emit('getPuzzle', newMessage(user.room, `${user.name} has left the room`))
    	io.to(user.room).emit('onlineUsers', {room: user.room, users: UsersInRoom})
    }
  });
});

app.use(router);


mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true }, () => {
	console.log('connected')
})

mongoose.set('useCreateIndex', true);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));