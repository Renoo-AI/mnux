'use client';

import { useState, useCallback, useMemo } from 'react';

export interface ValidationRule<T> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | undefined;
}

export interface FieldConfig {
  rules: ValidationRule<unknown>;
  label?: string;
}

export interface FormConfig {
  [fieldName: string]: FieldConfig;
}

export interface FormErrors {
  [fieldName: string]: string;
}

export interface FormTouched {
  [fieldName: string]: boolean;
}

export function useFormValidation<T extends object = Record<string, unknown>>(
  initialValues: T,
  config: FormConfig
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = useCallback(
    (name: string, value: unknown): string => {
      const fieldConfig = config[name];
      if (!fieldConfig) return '';

      const { rules, label } = fieldConfig;
      const fieldName = label || name;

      if (rules.required && (value === '' || value === null || value === undefined)) {
        return `${fieldName} is required`;
      }

      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          return `${fieldName} must be at least ${rules.minLength} characters`;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          return `${fieldName} must be no more than ${rules.maxLength} characters`;
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          return `${fieldName} format is invalid`;
        }
      }

      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          return `${fieldName} must be at least ${rules.min}`;
        }

        if (rules.max !== undefined && value > rules.max) {
          return `${fieldName} must be no more than ${rules.max}`;
        }
      }

      if (rules.custom) {
        const customError = rules.custom(value);
        if (customError) return customError;
      }

      return '';
    },
    [config]
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(config).forEach((name) => {
      const error = validateField(name, (values as Record<string, unknown>)[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [config, values, validateField]);

  // Handle field change
  const handleChange = useCallback(
    (name: string, value: unknown) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Clear error when user starts typing
      if (errors[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [errors, validateField]
  );

  // Handle field blur
  const handleBlur = useCallback(
    (name: string) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, (values as Record<string, unknown>)[name]);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [values, validateField]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (onSubmit: (values: T) => Promise<void> | void) => {
      setIsSubmitting(true);

      // Mark all fields as touched
      const allTouched: FormTouched = {};
      Object.keys(config).forEach((name) => {
        allTouched[name] = true;
      });
      setTouched(allTouched);

      // Validate all fields
      const isValid = validateForm();

      if (isValid) {
        try {
          await onSubmit(values);
        } catch (error) {
          console.error('Form submission error:', error);
        }
      }

      setIsSubmitting(false);
    },
    [config, values, validateForm]
  );

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Check if form has errors
  const hasErrors = useMemo(() => Object.values(errors).some((error) => error !== ''), [errors]);

  // Check if form is valid
  const isValid = useMemo(() => !hasErrors, [hasErrors]);

  // Check if form is dirty (values changed from initial)
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    hasErrors,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    validateField,
    validateForm,
    resetForm,
    setValues,
    setErrors,
  };
}

// Common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-+()]{10,}$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  name: /^[a-zA-Z\s'-]+$/,
  price: /^\d+(\.\d{1,2})?$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};

// Helper function to create field config
export function createFieldConfig(
  rules: ValidationRule<unknown>,
  label?: string
): FieldConfig {
  return { rules, label };
}

// Predefined validation rules
export const commonRules = {
  required: { required: true },
  email: {
    required: true,
    pattern: validationPatterns.email,
  },
  phone: {
    required: true,
    pattern: validationPatterns.phone,
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: validationPatterns.name,
  },
  price: {
    required: true,
    pattern: validationPatterns.price,
    custom: (value: unknown) => {
      const num = parseFloat(String(value));
      if (isNaN(num) || num < 0) return 'Price must be a positive number';
      if (num > 99999.99) return 'Price cannot exceed $99,999.99';
      return undefined;
    },
  },
  description: {
    maxLength: 500,
  },
  tableSeats: {
    required: true,
    min: 1,
    max: 20,
  },
};

export default useFormValidation;
