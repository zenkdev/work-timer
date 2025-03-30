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
