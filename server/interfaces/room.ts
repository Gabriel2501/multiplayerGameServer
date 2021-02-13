import { IUser } from './user';

export interface IRoom {
    name: string,
    users: IUser[],
    inactivityTime?: number,
    interval?: NodeJS.Timeout,
    active?: boolean
}