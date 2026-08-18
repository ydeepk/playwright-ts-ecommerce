// src/constants/messages.constants.ts
export const APP_MESSAGES = {
  ERRORS: {
    SESSION_EXPIRED: 'Session expired. Please regenerate auth state.',
    INVALID_CREDENTIALS: 'Invalid credentials',
  },
  SUCCESS: {
    EMPLOYEE_ADDED: 'Successfully Saved',
  },
} as const;