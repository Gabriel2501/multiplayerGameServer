const http = require('http');
const express = require('express');
const cors = require('cors');
const socketio = require('socket.io');
const userManager = require('./user-manager');
const port = 8080;

const app = express();

const { clear, getUsers, addUser, removeUser, setAdminUser, getAdminUser } = userManager();

app.get("/users", cors(), (req, res) => {
  res.send(getUsers());
});

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const newUser = (username) => {
  let users = getUsers();
  if (users.length == 0) {
    setAdminUser(username);
  }
  addUser(username);
  updateUsers();

  //Registro de log
  io.emit('log_event', username + " entrou na sala.");
};

const deleteUser = (username) => {
  removeUser(username);
  updateUsers();

  //Registro de log
  io.emit('log_event', username + " foi removido da sala.");
};

const userLogout = (username) => {
  removeUser(username);
  updateUsers();

  //Registro de log
  io.emit('log_event', username + " saiu da sala.");
};

const startGame = () => {
  //implementar jogo
};

const updateUsers = () => {
  io.emit('update_users', {users: getUsers(), admin: getAdminUser()});
}

io.on('connection', (sock) => {
  console.log("Novo usuário conectado.");

  sock.on('new_user', newUser);
  sock.on('remove_user', deleteUser);
  sock.on('user_logout', userLogout);
  sock.on('start_game', startGame);
  sock.on('message', (text, username) => io.emit('message', text, username));

  updateUsers();

  // Quando o admin desconecta, um outro usuario aleatorio assume posição de admin
  sock.on('disconnect', () => {
    if (!getUsers().includes(getAdminUser())) {
      setAdminUser(getUsers()[Math.floor(Math.random() * getUsers().length)]);
    }
    updateUsers();
  });
});

server.on('error', (err) => {
  console.error(err);
});

server.listen(port, () => {
  console.log('Servidor disponível na porta '+ port);
});
