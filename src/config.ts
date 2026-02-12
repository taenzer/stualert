export interface Config {
  husqvarna: {
    tokenUrl: string;
    apiBaseUrl: string;
    websocketUrl: string;
    clientId: string;
    clientSecret: string;
  };
}

export function loadConfig(): Config {
  return {
    husqvarna: {
        tokenUrl: process.env.HUSQVARNA_TOKEN_URL || '',
        clientId: process.env.HUSQVARNA_CLIENT_ID || '',
        clientSecret: process.env.HUSQVARNA_CLIENT_SECRET || '',
        apiBaseUrl: process.env.HUSQVARNA_API_BASE_URL || '',
        websocketUrl: process.env.HUSQVARNA_WEBSOCKET_URL || ''
    }
  };
}