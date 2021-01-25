import { ServerManager } from './server-manager';
const express = require('express');
const cors = require('cors');
import { createServer } from 'http';
import bodyParser = require('body-parser');
const socketio = require('socket.io');

class App {
    public app;
    public server;
    public io;
    public serverManager;

    constructor() {
        this.app = express();
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.server = createServer(this.app);
        this.io = socketio(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true
            }
        });
        this.serverManager = new ServerManager();

        this.defineServerMethods();

        this.app.get("/users", cors(), (req, res) => {
            res.json(this.serverManager.getUsers());
        });

    }

    defineServerMethods() {
        this.io.on('connect', (sock) => {
            console.log("Novo usuário conectado.");

            sock.on('new_user', (room, username) => this.newUser(sock, room, username));
            sock.on('delete_user', this.deleteUser);
            sock.on('user_logout', this.userLogout);
            sock.on('start_game', this.startGame);
            sock.on('message', (room, text, username) => {
                this.io.in(room).emit('message', text, username)
            });

            // Quando o admin desconecta, um outro usuario aleatorio assume posição de admin
            sock.on('disconnect', () => {
                let roomName = this.serverManager.getRoom(sock.id);
                if (!this.serverManager.getUsers(roomName).includes(this.serverManager.getAdminUser(roomName))) {
                    this.serverManager.setAdminUser(roomName, true);
                }
                this.updateUsers(roomName);
            });
        });
    }

    newUser(socket, room, username) {
        socket.join(room);
        let users = this.serverManager.getUsers();
        if (users.length == 0) {
            this.serverManager.setAdminUser(username);
        }
        this.serverManager.addUser(socket.id, room, username);
        this.updateUsers(room);

        //Registro de log
        this.io.emit('log_event', username + " entrou na sala.");
    }

    deleteUser(room, username) {
        this.serverManager.deleteUser(room, username);
        this.updateUsers(room);

        //Registro de log
        this.io.emit('log_event', username + " foi removido da sala.");
    };

    userLogout = (room, username) => {
        this.serverManager.deleteUser(room, username);
        this.updateUsers(room);

        //Registro de log
        this.io.emit('log_event', username + " saiu da sala.");
    };

    startGame = () => {
        //implementar jogo
    };

    updateUsers(room: string) {
        this.io.emit('update_users', { users: this.serverManager.getUsers(room), admin: this.serverManager.getAdminUser(room) });
    }
}
export default new App();