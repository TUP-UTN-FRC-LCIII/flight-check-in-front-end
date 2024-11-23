
// environment.prod.ts producción con nginx segun backend
const API_URL = 'http://flights:8081/';

export const environment = {
  production: true,
  apis: {
    // URLs a través del nginx reverse proxy según backend
    be: `${API_URL}`
  }
};
