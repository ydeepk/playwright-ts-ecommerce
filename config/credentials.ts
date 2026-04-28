export const USERS = {
    // Employee Self Service (ESS) account credentials
    ESS: {
        username: process.env.ESS_USER!, // ESS username from .env
        password: process.env.ESS_PASS!, // ESS password from .env
    },

    // Admin panel account credentials
    ADMIN: {
        username: process.env.ADMIN_USER!, // Admin username from .env
        password: process.env.ADMIN_PASS!, // Admin password from .env
    }
};