/**
 * 🔒 UTILIDADES DE SEGURIDAD (SIN FIREBASE)
 * Validación y sanitización reutilizable en el frontend.
 */

// ✅ VALIDACIÓN DE ENTRADA
export class InputValidator {
  static isValidEmail(email: string): boolean {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValidPassword(password: string): boolean {
    if (!password) return false;
    return password.length >= 6;
  }

  static isValidName(name: string): boolean {
    if (!name) return false;
    return name.trim().length >= 2;
  }
}

// ✅ SANITIZACIÓN DE DATOS BÁSICA (compatibilidad con SecureLogin)
export class DataSanitizer {
  // Normaliza y recorta texto de formularios para evitar espacios raros
  static sanitizeText(value: string): string {
    if (!value) return "";
    // Eliminar caracteres de control y recortar espacios extra
    const withoutControl = value.replace(/[\u0000-\u001F\u007F]/g, "");
    return withoutControl.trim();
  }
}

// ✅ RATE LIMITING (Cliente)
export class RateLimiter {
  private static attempts: Map<string, { count: number; lastAttempt: number }> = new Map();

  // Verificar rate limit para una acción
  static checkRateLimit(action: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = `${action}_anonymous`;
    
    const attempt = this.attempts.get(key);
    
    if (!attempt) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }

    // Resetear ventana de tiempo
    if (now - attempt.lastAttempt > windowMs) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }

    // Verificar límite
    if (attempt.count >= maxAttempts) {
      return false;
    }

    // Incrementar contador
    attempt.count++;
    attempt.lastAttempt = now;
    this.attempts.set(key, attempt);
    
    return true;
  }

  // Limpiar intentos antiguos
  static cleanup(): void {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    for (const [key, attempt] of this.attempts) {
      if (now - attempt.lastAttempt > oneHour) {
        this.attempts.delete(key);
      }
    }
  }
}

// ✅ LOGGING SEGURO
export class SecureLogger {
  // Solo loggear en desarrollo
  static log(message: string, data?: any): void {
    // Logs deshabilitados en producción
    if (process.env.NODE_ENV === 'development' && false) {
      console.log(`🔍 [${new Date().toISOString()}] ${message}`, data);
    }
  }

  // Loggear errores (siempre)
  static error(message: string, error?: any): void {
    const sanitizedError = error ? {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    } : null;
    
    console.error(`❌ [${new Date().toISOString()}] ${message}`, sanitizedError);
  }

  // Loggear eventos de seguridad
  static security(event: string, details?: any): void {
    const securityLog = {
      event,
      timestamp: new Date().toISOString(),
      user: 'anonymous',
      details: details || {}
    };
    
    console.warn(`🔒 [SECURITY] ${event}`, securityLog);
  }
}

// ✅ VALIDACIÓN DE PAYPAL
export class PayPalValidator {
  // Validar datos de transacción PayPal
  static validateTransaction(transactionData: any): boolean {
    if (!transactionData) return false;
    
    const required = ['id', 'status', 'amount', 'payer'];
    return required.every(field => transactionData[field] !== undefined);
  }

  // Verificar que el monto coincida
  static verifyAmount(paypalAmount: number, cartTotal: number): boolean {
    const tolerance = 0.01; // Tolerancia de 1 centavo
    return Math.abs(paypalAmount - cartTotal) <= tolerance;
  }
}

// ✅ ENCRIPTACIÓN BÁSICA (para datos no críticos)
export class BasicEncryption {
  private static key = 'tiendaonline_2025_secure';

  // Encriptar texto simple (base64 + rotación)
  static encrypt(text: string): string {
    try {
      const shifted = text.split('').map(char => 
        String.fromCharCode(char.charCodeAt(0) + 3)
      ).join('');
      return btoa(shifted);
    } catch {
      return text;
    }
  }

  // Desencriptar texto simple
  static decrypt(encrypted: string): string {
    try {
      const decoded = atob(encrypted);
      return decoded.split('').map(char => 
        String.fromCharCode(char.charCodeAt(0) - 3)
      ).join('');
    } catch {
      return encrypted;
    }
  }
}

// ✅ VALIDADOR DE SESIÓN
export class SessionValidator {
  // Verificar que la sesión sea válida (stub sin Firebase)
  static async validateSession(): Promise<boolean> {
    // En EcoReserva la validación de sesión se maneja en el backend
    // mediante JWT, así que este método solo se mantiene como stub.
    return true;
  }

  // Verificar integridad de datos del usuario
  static validateUserData(userData: any): boolean {
    if (!userData) return false;
    const required = ['uid', 'email'];
    return required.every(field => userData[field]);
  }
}
