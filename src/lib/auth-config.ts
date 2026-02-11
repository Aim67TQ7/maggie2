import { Configuration, LogLevel } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID || 'common'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : '',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error(message);
      },
      logLevel: LogLevel.Error,
      piiLoggingEnabled: false,
    },
  },
};

export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphPhotoEndpoint: 'https://graph.microsoft.com/v1.0/me/photo/$value',
};

// Map Entra ID security groups to Maggie roles
export const ROLE_GROUP_MAP: Record<string, string> = {
  [process.env.NEXT_PUBLIC_ADMIN_GROUP_ID || 'admin']: 'admin',
  [process.env.NEXT_PUBLIC_MANAGEMENT_GROUP_ID || 'management']: 'management',
  [process.env.NEXT_PUBLIC_SALES_GROUP_ID || 'sales']: 'sales',
  [process.env.NEXT_PUBLIC_OPERATIONS_GROUP_ID || 'operations']: 'operations',
};
