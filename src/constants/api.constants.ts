export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REFRESH: '/api/v1/auth/refresh',
  },
  CREATE: {
    NEW_EMPLOYEE: '/web/index.php/api/v2/pim/employees'
  },
  CART: {
    GET_ITEMS: '/api/v1/cart',
    ADD_ITEM: '/api/v1/cart/items',
    REMOVE_ITEM: (id: string) => `/api/v1/cart/items/${id}`,
  },
  PRODUCTS: {
    LIST: '/api/v1/products',
    DETAILS: (id: string) => `/api/v1/products/${id}`,
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;