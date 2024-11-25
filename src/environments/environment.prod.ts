declare global {
  interface Window {
    env: {
      API_URL: string;
      ENVIRONMENT: string;
    }
  }
}

export const environment = {
  production: true,
  apis: {
    be: window?.env?.API_URL
  }
};