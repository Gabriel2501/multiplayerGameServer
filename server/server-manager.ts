import { IUser } from './interfaces/user';
import { IRoom } from './interfaces/room';

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
        this.rooms.push({ name: roomName, users: [] });
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

    getUsers(roomName: string): IUser[] {
        return this.rooms[this._getRoomIndex(roomName)]?.users;
    }

    setAdminUser(roomName: string, isRandom?: boolean): void {
        let roomIndex = this._getRoomIndex(roomName);

        if (isRandom) {
            let randomUserIndex = Math.floor(Math.random() * this.rooms[roomIndex].users.length);
            this.rooms[roomIndex].users[randomUserIndex].isAdmin = true;
        }
        else {
            this.rooms[roomIndex].users[0].isAdmin = true;
        }
    }

    getAdminUser(roomName: string): IUser {
        return this.rooms[this._getRoomIndex(roomName)].users.find((user: IUser) => user.isAdmin);
    }

    addUser(socketID: string, roomName: string, username: string): void {
        this.rooms[this._getRoomIndex(roomName)].users.push({ name: username, socketID: socketID });
    }

    deleteUser(roomName: string, username: string): void {
        let roomIndex = this._getRoomIndex(roomName);
        this.rooms[roomIndex].users.splice(this._getUserIndex(roomIndex, username), 1);
    }

    deleteRoom(roomName: string): void {
        this.rooms.splice(this._getRoomIndex(roomName), 1);
    }

}