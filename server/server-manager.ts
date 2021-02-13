import { IUser } from './interfaces/user';
import { IRoom } from './interfaces/room';
import { Server } from 'socket.io';

export class ServerManager {
    rooms: IRoom[];

    constructor() {
        this.rooms = [];
    }

    private _getRoomIndex(roomName: string): number {
        let roomIndex = this.rooms?.findIndex((room: IRoom) => room.name === roomName);
        if (roomIndex !== -1) {
            return roomIndex;
        }
        this.rooms.push({ name: roomName, users: [], active: true });
        return this.rooms.length - 1;
    }

    private _getUserIndex(roomIndex: number, username: string) {
        return this.rooms[roomIndex]?.users?.findIndex((user: IUser) => user.name === username);
    }

    getRoom(socketID: string): string {
        return this.rooms.find((room: IRoom) => {
            if (room.users.find((user: IUser) => user.socketID === socketID)) return room;
        })?.name;
    }

    getUsers(roomName: string, newUser?: boolean): IUser[] {
        if (newUser || this.doRoomExist(roomName)) {
            return this.rooms[this._getRoomIndex(roomName)]?.users;
        }
        return undefined;
    }

    setAdminUser(roomName: string, isRandom?: boolean): void {
        let roomIndex = this._getRoomIndex(roomName);

        if (isRandom) {
            let randomUserIndex = Math.floor(Math.random() * this.rooms[roomIndex].users.length);
            if (this.rooms[roomIndex].users[randomUserIndex]) {
                this.rooms[roomIndex].users[randomUserIndex].isAdmin = true;
            }
        }
        else {
            if (this.rooms[roomIndex].users[0]) {
                this.rooms[roomIndex].users[0].isAdmin = true;
            }
        }
    }

    getAdminUser(roomName: string): IUser {
        if (this.doRoomExist(roomName)) {
            return this.rooms[this._getRoomIndex(roomName)].users?.find((user: IUser) => user.isAdmin);
        }
        return undefined;
    }

    addUser(socketID: string, roomName: string, username: string): void {
        this.rooms[this._getRoomIndex(roomName)].users.push({ name: username, socketID: socketID });
    }

    deleteUser(roomName: string, username: string): void {
        let roomIndex = this._getRoomIndex(roomName);

        this.rooms[roomIndex].users.splice(this._getUserIndex(roomIndex, username), 1);
        if (this.rooms[roomIndex].users.length == 0) this.deleteRoom(roomName);
    }

    deleteRoom(roomName: string): void {
        this.rooms.splice(this._getRoomIndex(roomName), 1);
    }

    doRoomExist(roomName: string): boolean {
        return this.rooms?.findIndex((room: IRoom) => room.name === roomName) !== -1;
    }

    newActivity(roomName: string, io: Server): void {
        let roomIndex = this._getRoomIndex(roomName);
        let room = this.rooms[roomIndex];

        if (this.doRoomExist(roomName) && room.active) {
            room.inactivityTime = 0;
            room.active = true;

            if (room.interval) clearInterval(room.interval);

            room.interval = setInterval(() => {
                room.inactivityTime++;
                if (room.inactivityTime >= 30) {
                    console.log(`Sala ${roomName} removida por inatividade.`);
                    room.active = false;
                    clearInterval(room.interval);
                    while (room.users.length > 0) {
                        io.in(roomName).emit("force_disconnect", room.users[0].name);
                        this.deleteUser(roomName, room.users[0].name);
                    }
                }
            }, 60000);
        }
    }

}