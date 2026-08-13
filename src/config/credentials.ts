// fail-fast validation
function requireEnv(value: string | undefined, name: string): string {
    if (!value) {
        throw new Error(
            `[Configuration Error] Missing required environment variable: "${name}". ` +
            `Ensure it is set in your .env file locally or mapped under 'env:' in your GitHub Actions workflow.`
        );
    }
    return value;
}

export const USERS = {
    // Employee Self Service (ESS) account credentials
    ESS: {
        username: requireEnv(process.env.ESS_USER,'ESS_USER'), // ESS username from .env
        password: requireEnv(process.env.ESS_PASS,'ESS_PASS'), // ESS password from .env
    },

    // Admin panel account credentials
    ADMIN: {
        username: requireEnv(process.env.ADMIN_USER,'ADMIN_USER'), // Admin username from .env
        password: requireEnv(process.env.ADMIN_PASS,'ADMIN_PASS'), // Admin password from .env
    }
};