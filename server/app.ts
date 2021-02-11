// Third-Parties
import http from "http";
import cors from "cors";
import express, { Response } from "express";
import { Request } from "express";
import { createServer } from "http";
import bodyParser from "body-parser";
import { Server, Socket } from "socket.io";


// Local files
import { ServerManager } from "./server-manager";
import { IUser } from "./interfaces/user";

/**
 *
 */
class App {
  // Third-parties class instances
  public app: express.Application;
  public server: http.Server;
  public io: Server

  // Local class instances
  public serverManager: ServerManager;

  // eslint-disable-next-line require-jsdoc
  constructor() {
    // express configs
    this.app = express();
    this._initExpressOptions();

    // webSocket configs
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: { origin: "http://localhost:4200", methods: ["GET", "POST"], credentials: true },
    });
    this._webSocketConnection();

    this.serverManager = new ServerManager();

    this.app.get("/users", cors(), (req: Request, res: Response) => {
      return res.json(this.serverManager.getUsers(req.query.room.toString(), true));
    });
  }

  /**
   *
   */
  private _initExpressOptions(): void {
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
  }

  /**
   *
   */
  private _webSocketConnection(): void {
    this.io.on("connect", (sock: Socket) => {
      console.log("Novo usuário conectado.");

      /**
       * Para todos os métodos de sock.on, sempre existirão:
       * data.room
       * data.emitter
       * 
       * Mais o que for passado como objeto para o emitEvent do client
       */
      sock.on("new_user", (room, username) => {
        this.newUser(sock, room, username);
      });
      sock.on("delete_user", (data) => {
        this.deleteUser(data.room, data.username);
      });
      sock.on("user_logout", (data) => {
        this.deleteUser(data.room, data.emitter);
      });
      sock.on("start_game", (data) => {
        this.startGame(data.room);
      });
      sock.on("message", (data) => {
        const obj = { user: data.emitter, text: data.text };
        this.io.in(data.room).emit("message", obj);
      });

      // Quando o admin desconecta, um outro usuario aleatorio assume posição de admin
      sock.on("disconnect", () => {
        const roomName = this.serverManager.getRoom(sock.id);
        const users = this.serverManager.getUsers(roomName);
        if (roomName && users) {
          if (!users.includes(this.serverManager.getAdminUser(roomName))) {
            this.serverManager.setAdminUser(roomName, true);
          }
        }
        this.updateUsers(roomName);
      });
    });
  }

  /**
   *
   * @param {Socket} socket
   * @param {string} room
   * @param {username} username
   */
  newUser(socket: Socket, room: string, username: string): void {
    socket.join(room);
    const users = this.serverManager.getUsers(room, true);
    if (users.length == 0) {
      this.serverManager.setAdminUser(username);
    }
    this.serverManager.addUser(socket.id, room, username);
    this.updateUsers(room);

    // Registro de log
    this.io.in(room).emit("log_event", {username: username, logKey: "JoinRoom"});
  }

  /**
   *
   * @param {string} room
   * @param {string} username
   */
  deleteUser(room: string, username: string): void {
    this.serverManager.deleteUser(room, username);
    this.updateUsers(room);

    this.io.in(room).emit("force_disconnect", username);

    // Registro de log
    this.io.in(room).emit("log_event", {username: username, logKey: "LeaveRoom"});
  }


  /**
   *
   */
  startGame(room: string): void {
    console.log(`Jogo iniciado na sala ${room}`);
  }

  /**
   *
   * @param {string}room
   */
  updateUsers(room: string): void {
    const users: IUser[] = this.serverManager.getUsers(room, false);
    const adminUser: IUser = this.serverManager.getAdminUser(room);

    if (users) {
      if (adminUser) {
        this.io.in(room).emit("update_users", { users: users, admin: adminUser });
      }
      else {
        this.serverManager.setAdminUser(room, true);
        this.updateUsers(room);
      }
    }
  }
}
export default new App().server;
