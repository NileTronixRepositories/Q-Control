export interface Environment {
  production: boolean;
  apiBaseUrl: string;
}

export const environment: Environment = {
  production: false,
  apiBaseUrl: 'http://192.168.1.10:8040/',
};
