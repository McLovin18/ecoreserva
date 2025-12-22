/**
 * 🔒 CONFIGURACIÓN DE SEGURIDAD CENTRALIZADA
 * Configuraciones y constantes de seguridad para toda la aplicación
 */

// ✅ CONFIGURACIÓN DE RATE LIMITING
export const RATE_LIMITS = {
  LOGIN: {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000, // 15 minutos
  },
  REGISTER: {
    maxAttempts: 2,
    windowMs: 30 * 60 * 1000, // 30 minutos
  },
  COMMENT: {
    maxAttempts: 5,
    windowMs: 60 * 1000, // 1 minuto
  },
  ADD_TO_CART: {
    maxAttempts: 20,
    windowMs: 60 * 1000, // 1 minuto
  },
  PURCHASE: {
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000, // 5 minutos
  }
} as const;




export const AUTH_REQUIREMENTS = {
  EMAIL_VERIFICATION_REQUIRED: true,
  MIN_PASSWORD_STRENGTH: 'MEDIUM', // puedes mapear con SECURITY_PATTERNS.PASSWORD_STRENGTH
  // En EcoReserva solo usamos roles de administrador, anfitrión y turista (cliente)
  ALLOWED_ROLES: ['ADMIN', 'OWNER', 'CLIENT'],
};






// ✅ VALIDACIONES DE ENTRADA
export const VALIDATION_RULES = {
  USER: {
    EMAIL: {
      minLength: 5,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    PASSWORD: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    },
    NAME: {
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-ZÀ-ÿ\s]+$/
    },
    PHONE: {
      minLength: 10,
      maxLength: 15,
      pattern: /^[+]?[\d\s\-\(\)]{10,15}$/
    }
  },
  PRODUCT: {
    NAME: {
      minLength: 3,
      maxLength: 100
    },
    DESCRIPTION: {
      minLength: 10,
      maxLength: 1000
    },
    PRICE: {
      min: 0.01,
      max: 999999.99
    }
  },
  COMMENT: {
    TEXT: {
      minLength: 10,
      maxLength: 500
    },
    RATING: {
      min: 1,
      max: 5
    }
  },
  ORDER: {
    TOTAL: {
      min: 0.01,
      max: 50000
    },
    ITEMS: {
      minQuantity: 1,
      maxQuantity: 99,
      maxItems: 50
    }
  }
} as const;

// ✅ ROLES Y PERMISOS
export const SECURITY_ROLES = {
  ADMIN: {
    emails: ['hectorcobea03@gmail.com', "lucilaaquino79@gmail.com", "tiffanysvariedades@gmail.com"],
    uid: 'byRByEqdFOYxXOmUu9clvujvIUg1',
    permissions: [
      'read_all_users',
      'manage_products',
      'manage_orders',
      'view_analytics',
      'manage_system'
    ]
  },
  USER: {
    permissions: [
      'view_products',
      'manage_own_profile',
      'place_orders',
      'add_comments',
      'manage_cart',
      'view_own_orders'
    ]
  }
} as const;

// ✅ CONFIGURACIÓN DE LOGS DE SEGURIDAD
export const SECURITY_EVENTS = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  REGISTER_SUCCESS: 'register_success',
  REGISTER_FAILED: 'register_failed',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_INPUT: 'invalid_input',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  PASSWORD_CHANGE: 'password_change',
  PROFILE_UPDATE: 'profile_update',
  ORDER_PLACED: 'order_placed',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed'
} as const;

// ✅ CONFIGURACIÓN DE SANITIZACIÓN
export const SANITIZATION_CONFIG = {
  ALLOWED_HTML_TAGS: [],
  DANGEROUS_PATTERNS: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onerror=/gi,
    /onclick=/gi
  ],
  MAX_INPUT_LENGTH: {
    SHORT: 50,
    MEDIUM: 255,
    LONG: 1000,
    VERY_LONG: 5000
  }
} as const;

// ✅ CONFIGURACIÓN DE ENCRIPTACIÓN
export const ENCRYPTION_CONFIG = {
  ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256,
  IV_LENGTH: 12,
  SALT_LENGTH: 16,
  ITERATIONS: 100000
} as const;

// ✅ CONFIGURACIÓN DE SESIONES
export const SESSION_CONFIG = {
  MAX_AGE: 24 * 60 * 60 * 1000, // 24 horas
  CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutos
  WARNING_TIME: 5 * 60 * 1000, // 5 minutos antes de expirar
  MAX_CONCURRENT_SESSIONS: 3
} as const;

// ✅ CONFIGURACIÓN DE HEADERS DE SEGURIDAD
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.paypal.com https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.paypal.com https://api.stripe.com"
} as const;

// ✅ CONFIGURACIÓN DE FIREBASE SECURITY
export const FIREBASE_SECURITY = {
  MAX_RETRIES: 3,
  TIMEOUT: 10000, // 10 segundos
  BATCH_SIZE: 500,
  MAX_RESULTS: 1000
} as const;

// ✅ PATRONES DE VALIDACIÓN AVANZADA
export const SECURITY_PATTERNS = {
  SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  XSS_BASIC: /<[^>]*>/g,
  SUSPICIOUS_CHARS: /[<>\"'&]/g,
  PHONE_FORMATS: {
    INTERNATIONAL: /^\+?[1-9]\d{1,14}$/,
    LOCAL: /^[\d\s\-\(\)]{10,15}$/
  },
  PASSWORD_STRENGTH: {
    WEAK: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
    MEDIUM: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
    STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,}$/
  }
} as const;

// ✅ MENSAJES DE ERROR SEGUROS
export const SECURITY_MESSAGES = {
  GENERIC_ERROR: 'Ha ocurrido un error. Intenta nuevamente.',
  INVALID_CREDENTIALS: 'Credenciales inválidas.',
  RATE_LIMIT: 'Demasiados intentos. Intenta más tarde.',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción.',
  SESSION_EXPIRED: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
  INVALID_INPUT: 'Los datos proporcionados no son válidos.',
  ACCOUNT_LOCKED: 'Cuenta temporalmente bloqueada por seguridad.',
  MAINTENANCE: 'Sistema en mantenimiento. Intenta más tarde.',
  CONNECTION_ERROR: 'Error de conexión. Verifica tu internet.'
} as const;

// ✅ CONFIGURACIÓN DE MONITOREO
export const MONITORING_CONFIG = {
  ERROR_THRESHOLD: 10, // máximo 10 errores por minuto
  WARNING_THRESHOLD: 5,
  ALERT_COOLDOWN: 5 * 60 * 1000, // 5 minutos entre alertas
  LOG_RETENTION: 30 * 24 * 60 * 60 * 1000, // 30 días
  METRICS_INTERVAL: 60 * 1000 // 1 minuto
} as const;

// ✅ FUNCIÓN PARA VERIFICAR CONFIGURACIÓN
export const validateSecurityConfig = (): boolean => {
  try {
    // Verificar que las configuraciones críticas estén definidas
    if (!SECURITY_ROLES.ADMIN.emails.length) {
      console.error('❌ No hay emails de admin configurados');
      return false;
    }

    if (!RATE_LIMITS.LOGIN.maxAttempts) {
      console.error('❌ Rate limiting no configurado');
      return false;
    }

    // Configuración válida
    return true;
  } catch (error) {
    console.error('❌ Error validando configuración de seguridad:', error);
    return false;
  }
};

// Validar configuración al importar
if (process.env.NODE_ENV === 'development') {
  validateSecurityConfig();
}
