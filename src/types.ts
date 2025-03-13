export enum ACTION {
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export type TimeRecord = {
  action: ACTION;
  time: string;
};
