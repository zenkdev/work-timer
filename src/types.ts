export enum ACTION {
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export interface TimeRecord {
  action: ACTION;
  time: string;
}

export interface ConvertedTimeRecord {
  action: ACTION;
  time: Date;
}

export type LocalStorage = Partial<{ records: TimeRecord[] }>;

export type SyncStorage = Partial<{ notify: boolean; workTime: number; restTime: number; lastLogin: string }>;

export enum SORT_ORDER {
  ASC = 'asc',
  DESC = 'desc',
}
