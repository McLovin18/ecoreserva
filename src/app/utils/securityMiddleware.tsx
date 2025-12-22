/**
 * 🔒 UTILIDADES DE FORMULARIO Y RATE LIMITING (sin Firebase)
 */

import React, { useState } from 'react';

// ✅ HOOK DE VALIDACIÓN DE FORMULARIOS
export const useSecureForm = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name: string, value: string, rules: any = {}) => {
    const newErrors = { ...errors };

    // Limpiar error previo
    delete newErrors[name];

    // Validaciones comunes
    if (rules.required && !value.trim()) {
      newErrors[name] = 'Este campo es obligatorio';
    } else if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      newErrors[name] = 'Email inválido';
    } else if (rules.minLength && value.length < rules.minLength) {
      newErrors[name] = `Mínimo ${rules.minLength} caracteres`;
    } else if (rules.maxLength && value.length > rules.maxLength) {
      newErrors[name] = `Máximo ${rules.maxLength} caracteres`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearErrors = () => setErrors({});

  return {
    errors,
    isSubmitting,
    setIsSubmitting,
    validateField,
    clearErrors,
    hasErrors: Object.keys(errors).length > 0
  };
};

// ✅ COMPONENTE DE INPUT SEGURO
interface SecureInputProps {
  name: string;
  label: string;
  type?: string;
  value: string;
  onChange: (name: string, value: string) => void;
  rules?: any;
  placeholder?: string;
  required?: boolean;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  rules = {},
  placeholder,
  required = false
}) => {
  const [localError, setLocalError] = useState('');
  const [touched, setTouched] = useState(false);

  const handleBlur = () => {
    setTouched(true);
    validateInput();
  };

  const validateInput = () => {
    let error = '';

    if (required && !value.trim()) {
      error = 'Este campo es obligatorio';
    } else if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = 'Formato de email inválido';
    } else if (rules.minLength && value.length < rules.minLength) {
      error = `Mínimo ${rules.minLength} caracteres`;
    } else if (rules.pattern && !rules.pattern.test(value)) {
      error = rules.patternMessage || 'Formato inválido';
    }

    setLocalError(error);
    return !error;
  };

  return React.createElement('div', {
    className: 'mb-3'
  }, [
    React.createElement('label', {
      htmlFor: name,
      className: 'form-label',
      key: 'label'
    }, [
      label,
      required && React.createElement('span', {
        className: 'text-danger',
        key: 'required'
      }, ' *')
    ]),
    React.createElement('input', {
      type,
      className: `form-control ${touched && localError ? 'is-invalid' : ''}`,
      id: name,
      name,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(name, e.target.value),
      onBlur: handleBlur,
      placeholder,
      maxLength: rules.maxLength || 255,
      key: 'input'
    }),
    touched && localError && React.createElement('div', {
      className: 'invalid-feedback',
      key: 'error'
    }, localError)
  ]);
};

// ✅ HOOK DE RATE LIMITING
export const useRateLimit = (action: string, maxAttempts: number = 5) => {
  const [blocked, setBlocked] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(maxAttempts);

  const checkRateLimit = () => {
    // Simular rate limiting del lado del cliente
    const key = `rate_limit_${action}`;
    const data = localStorage.getItem(key);
    
    if (data) {
      const { count, timestamp } = JSON.parse(data);
      const now = Date.now();
      const windowMs = 60000; // 1 minuto

      if (now - timestamp < windowMs) {
        if (count >= maxAttempts) {
          setBlocked(true);
          setAttemptsLeft(0);
          return false;
        }
        
        const newCount = count + 1;
        localStorage.setItem(key, JSON.stringify({ count: newCount, timestamp }));
        setAttemptsLeft(maxAttempts - newCount);
        return true;
      }
    }

    // Reiniciar contador
    localStorage.setItem(key, JSON.stringify({ count: 1, timestamp: Date.now() }));
    setAttemptsLeft(maxAttempts - 1);
    setBlocked(false);
    return true;
  };

  const resetRateLimit = () => {
    const key = `rate_limit_${action}`;
    localStorage.removeItem(key);
    setBlocked(false);
    setAttemptsLeft(maxAttempts);
  };

  return { blocked, attemptsLeft, checkRateLimit, resetRateLimit };
};
