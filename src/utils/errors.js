/**
 * Custom error classes for the application
 */

export class FirebaseNotInitializedError extends Error {
  constructor(message = 'Firebase no está inicializado') {
    super(message)
    this.name = 'FirebaseNotInitializedError'
    this.code = 'FIREBASE_NOT_INITIALIZED'
  }
}

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message)
    this.name = 'ValidationError'
    this.code = 'VALIDATION_ERROR'
    this.field = field
  }
}

export class OfflineError extends Error {
  constructor(message = 'La aplicación está en modo offline') {
    super(message)
    this.name = 'OfflineError'
    this.code = 'OFFLINE_ERROR'
  }
}

export class AuthenticationError extends Error {
  constructor(message, originalError = null) {
    super(message)
    this.name = 'AuthenticationError'
    this.code = 'AUTH_ERROR'
    this.originalError = originalError
  }
}

export class DatabaseError extends Error {
  constructor(message, operation = null, originalError = null) {
    super(message)
    this.name = 'DatabaseError'
    this.code = 'DATABASE_ERROR'
    this.operation = operation
    this.originalError = originalError
  }
}

export class ConfigurationError extends Error {
  constructor(message = 'Error de configuración de Firebase') {
    super(message)
    this.name = 'ConfigurationError'
    this.code = 'CONFIG_ERROR'
  }
}

/**
 * Check if error is a Firebase auth error
 */
export function isFirebaseAuthError(error) {
  return error?.code?.startsWith('auth/')
}

/**
 * Check if error is a Firebase Firestore error
 */
export function isFirestoreError(error) {
  return error?.code?.startsWith('firestore/') || error?.code?.startsWith('permission-denied')
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error) {
  if (!error) return 'Ha ocurrido un error desconocido'
  
  // Firebase Auth errors
  const authMessages = {
    'auth/user-not-found': 'Usuario no encontrado',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/email-already-in-use': 'El email ya está en uso',
    'auth/weak-password': 'La contraseña es demasiado débil',
    'auth/invalid-email': 'Email inválido',
    'auth/user-disabled': 'Usuario deshabilitado',
    'auth/operation-not-allowed': 'Operación no permitida',
    'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este email',
    'auth/popup-closed-by-user': 'Ventana de inicio de sesión cerrada',
    'auth/configuration-not-found': 'Configuración de Firebase no encontrada. Verifica la consola de Firebase.',
  }
  
  // Firestore errors
  const firestoreMessages = {
    'permission-denied': 'No tienes permisos para realizar esta operación',
    'firestore/unavailable': 'Firestore no está disponible. Verifica tu conexión.',
    'firestore/not-found': 'Documento no encontrado',
  }
  
  // Check custom errors
  if (error instanceof FirebaseNotInitializedError) {
    return 'Firebase no está inicializado. Verifica la configuración.'
  }
  
  if (error instanceof ValidationError) {
    return error.message
  }
  
  if (error instanceof OfflineError) {
    return 'Sin conexión. Los cambios se guardarán cuando vuelvas a estar en línea.'
  }
  
  // Check Firebase errors
  if (error.code && authMessages[error.code]) {
    return authMessages[error.code]
  }
  
  if (error.code && firestoreMessages[error.code]) {
    return firestoreMessages[error.code]
  }
  
  // Default
  return error.message || 'Ha ocurrido un error inesperado'
}
