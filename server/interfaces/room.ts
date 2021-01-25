import { IUser } from './user';

export interface IRoom {
    name: string,
    users: IUser[]
}