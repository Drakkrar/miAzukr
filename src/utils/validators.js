import { ValidationError } from './errors.js'

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @throws {ValidationError} If email is invalid
 * @returns {boolean} True if valid
 */
export function validateEmail(email) {
  if (!email) {
    throw new ValidationError('Email es requerido', 'email')
  }
  
  if (typeof email !== 'string') {
    throw new ValidationError('Email debe ser una cadena de texto', 'email')
  }
  
  // Trim whitespace
  email = email.trim()
  
  if (email.length === 0) {
    throw new ValidationError('Email no puede estar vacío', 'email')
  }
  
  if (email.length > 254) {
    throw new ValidationError('Email es demasiado largo', 'email')
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError('Formato de email inválido', 'email')
  }
  
  return true
}

/**
 * Validate password for authentication
 * @param {string} password - Password to validate
 * @throws {ValidationError} If password is invalid
 * @returns {boolean} True if valid
 */
export function validatePassword(password) {
  if (!password) {
    throw new ValidationError('Contraseña es requerida', 'password')
  }
  
  if (typeof password !== 'string') {
    throw new ValidationError('Contraseña debe ser una cadena de texto', 'password')
  }
  
  if (password.length < 6) {
    throw new ValidationError('Contraseña debe tener al menos 6 caracteres', 'password')
  }
  
  if (password.length > 128) {
    throw new ValidationError('Contraseña es demasiado larga', 'password')
  }
  
  return true
}

/**
 * Validate user profile object
 * @param {Object} profile - Profile to validate
 * @throws {ValidationError} If profile is invalid
 * @returns {boolean} True if valid
 */
export function validateProfile(profile) {
  if (!profile) {
    throw new ValidationError('Perfil es requerido', 'profile')
  }
  
  if (typeof profile !== 'object' || Array.isArray(profile)) {
    throw new ValidationError('Perfil debe ser un objeto', 'profile')
  }
  
  // Optional: validate specific profile fields
  if (profile.nombre !== undefined && typeof profile.nombre !== 'string') {
    throw new ValidationError('Nombre debe ser una cadena de texto', 'nombre')
  }
  
  if (profile.email !== undefined) {
    validateEmail(profile.email)
  }
  
  return true
}

/**
 * Validate a glucose record object
 * @param {Object} record - Record to validate
 * @throws {ValidationError} If record is invalid
 * @returns {boolean} True if valid
 */
export function validateRecord(record) {
  if (!record) {
    throw new ValidationError('Registro es requerido', 'record')
  }
  
  if (typeof record !== 'object' || Array.isArray(record)) {
    throw new ValidationError('Registro debe ser un objeto', 'record')
  }
  
  // Validate timestamp if present
  if (record.ts !== undefined && record.ts !== null) {
    if (!(record.ts instanceof Date) && 
        typeof record.ts !== 'string' && 
        typeof record.ts !== 'number' &&
        !record.ts.toDate) { // Firebase Timestamp
      throw new ValidationError('Timestamp inválido', 'ts')
    }
  }
  
  // Validate glucose level if present
  if (record.glucosa !== undefined && record.glucosa !== null) {
    const glucosa = Number(record.glucosa)
    if (isNaN(glucosa)) {
      throw new ValidationError('Nivel de glucosa debe ser un número', 'glucosa')
    }
    if (glucosa < 0) {
      throw new ValidationError('Nivel de glucosa no puede ser negativo', 'glucosa')
    }
    if (glucosa > 1000) {
      throw new ValidationError('Nivel de glucosa parece inválido (demasiado alto)', 'glucosa')
    }
  }
  
  // Validate blood pressure if present
  if (record.presionSistolica !== undefined && record.presionSistolica !== null) {
    const sistolica = Number(record.presionSistolica)
    if (isNaN(sistolica)) {
      throw new ValidationError('Presión sistólica debe ser un número', 'presionSistolica')
    }
    if (sistolica < 0 || sistolica > 300) {
      throw new ValidationError('Presión sistólica fuera de rango válido', 'presionSistolica')
    }
  }
  
  if (record.presionDiastolica !== undefined && record.presionDiastolica !== null) {
    const diastolica = Number(record.presionDiastolica)
    if (isNaN(diastolica)) {
      throw new ValidationError('Presión diastólica debe ser un número', 'presionDiastolica')
    }
    if (diastolica < 0 || diastolica > 200) {
      throw new ValidationError('Presión diastólica fuera de rango válido', 'presionDiastolica')
    }
  }
  
  return true
}

/**
 * Validate record ID
 * @param {string} id - Record ID to validate
 * @throws {ValidationError} If ID is invalid
 * @returns {boolean} True if valid
 */
export function validateRecordId(id) {
  if (!id) {
    throw new ValidationError('ID de registro es requerido', 'id')
  }
  
  if (typeof id !== 'string') {
    throw new ValidationError('ID de registro debe ser una cadena de texto', 'id')
  }
  
  if (id.trim().length === 0) {
    throw new ValidationError('ID de registro no puede estar vacío', 'id')
  }
  
  return true
}

/**
 * Validate date object
 * @param {Date} date - Date to validate
 * @param {string} fieldName - Name of the field for error messages
 * @throws {ValidationError} If date is invalid
 * @returns {boolean} True if valid
 */
export function validateDate(date, fieldName = 'fecha') {
  if (!date) {
    throw new ValidationError(`${fieldName} es requerida`, fieldName)
  }
  
  if (!(date instanceof Date)) {
    throw new ValidationError(`${fieldName} debe ser un objeto Date`, fieldName)
  }
  
  if (isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} es inválida`, fieldName)
  }
  
  return true
}