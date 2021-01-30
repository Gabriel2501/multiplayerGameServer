import http from "http";
import cors from "cors";
import express, {Response} from "express";
import {Request} from "express";
import {createServer} from "http";
import bodyParser from "body-parser";
import {Server, Socket} from "socket.io";


// Local files
import {ServerManager} from "./server-manager";
import {IUser} from "./interfaces/user";
class App {
    // Third-parties class instances
    public app: express.Application;
    public server: http.Server;
    public io: Server

    // Local class instances
    public serverManager: ServerManager;
    constructor() {
        this.app = express();
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: "http://localhost:4200",
                methods: ["GET", "POST"],
                credentials: true
            },
        });
        this.serverManager = new ServerManager();

        this.defineServerMethods();

        this.app.get("/users", cors(), (req: Request, res) => {
            res.json(this.serverManager.getUsers(req.query.room));
        });

    }

    defineServerMethods() {
        this.io.on('connect', (sock) => {
            console.log("Novo usuário conectado.");

            sock.on('new_user', (room, username) => this.newUser(sock, room, username));
            sock.on('delete_user', this.deleteUser);
            sock.on('user_logout', this.userLogout);
            sock.on('start_game', this.startGame);
            sock.on('message', (data) => {
                this.io.in(data.room).emit('message', { user: data.username, text: data.text })
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
        this.io.in(room).emit('log_event', username + " entrou na sala.");
    }

    deleteUser(room, username) {
        this.serverManager.deleteUser(room, username);
        this.updateUsers(room);

        //Registro de log
        this.io.in(room).emit('log_event', username + " foi removido da sala.");
    };

    userLogout = (room, username) => {
        this.serverManager.deleteUser(room, username);
        this.updateUsers(room);

        //Registro de log
        this.io.in(room).emit('log_event', username + " saiu da sala.");
    };

    startGame = () => {
        //implementar jogo
    };

    updateUsers(room: string) {
        this.io.in(room).emit('update_users', { users: this.serverManager.getUsers(room), admin: this.serverManager.getAdminUser(room) });
    }
}
export default new App().server;