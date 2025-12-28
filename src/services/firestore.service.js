import { getFirestore, doc, getDoc, setDoc, collection, 
         query, where, orderBy, limit, getDocs, addDoc, 
         deleteDoc } from 'firebase/firestore'
import { initFirebase } from './firebase.service.js'
import { emailToId, normalizeTimestamp } from '../utils/transformers.js'
import { validateEmail, validateProfile, validateRecord, validateRecordId } from '../utils/validators.js'
import { FirebaseNotInitializedError, DatabaseError, OfflineError } from '../utils/errors.js'
import offlineQueue from '../offlineQueue.js'

/**
 * Check if the app is online
 */
function isOnline() {
  return navigator.onLine
}

/**
 * Get user profile from Firestore
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User profile or null if not found
 * @throws {FirebaseNotInitializedError} If Firebase is not initialized
 * @throws {DatabaseError} If database operation fails
 */
export async function getUserProfile(email) {
  validateEmail(email)
  
  const { app } = await initFirebase()
  if (!app) throw new FirebaseNotInitializedError()
  
  try {
    const db = getFirestore(app)
    const id = emailToId(email)
    const ref = doc(db, 'usuarios', id)
    const snap = await getDoc(ref)
    
    if (!snap.exists()) return null
    
    return snap.data() || {}
  } catch (error) {
    throw new DatabaseError('Error al obtener perfil de usuario', 'getUserProfile', error)
  }
}

/**
 * Save user profile to Firestore
 * @param {string} email - User email
 * @param {Object} profile - User profile data
 * @returns {Promise<void>}
 * @throws {ValidationError} If validation fails
 * @throws {FirebaseNotInitializedError} If Firebase is not initialized
 * @throws {OfflineError} If offline (queues the operation)
 */
export async function saveUserProfile(email, profile) {
  validateEmail(email)
  validateProfile(profile)
  
  const { app } = await initFirebase()
  
  // Queue operation if offline or Firebase not initialized
  if (!app || !isOnline()) {
    offlineQueue.enqueue('saveProfile', { email, profile })
    throw new OfflineError('Perfil guardado localmente. Se sincronizará cuando vuelvas a estar en línea.')
  }
  
  try {
    const db = getFirestore(app)
    const id = emailToId(email)
    const ref = doc(db, 'usuarios', id)
    
    await setDoc(ref, profile, { merge: true })
  } catch (error) {
    // If operation fails, queue it
    offlineQueue.enqueue('saveProfile', { email, profile })
    throw new DatabaseError('Error al guardar perfil. Se reintentará automáticamente.', 'saveUserProfile', error)
  }
}

/**
 * Get user records from Firestore with optional date filtering
 * @param {string} email - User email
 * @param {Date} [fromDate] - Start date filter
 * @param {Date} [toDate] - End date filter
 * @returns {Promise<Array>} Array of records
 * @throws {FirebaseNotInitializedError} If Firebase is not initialized
 */
export async function getUserRecords(email, fromDate, toDate) {
  validateEmail(email)
  
  const { app } = await initFirebase()
  if (!app) throw new FirebaseNotInitializedError()
  
  try {
    const db = getFirestore(app)
    const id = emailToId(email)
    const col = collection(db, 'usuarios', id, 'registros')
    
    const constraints = []
    if (fromDate instanceof Date) {
      constraints.push(where('ts', '>=', normalizeTimestamp(fromDate)))
    }
    if (toDate instanceof Date) {
      constraints.push(where('ts', '<=', normalizeTimestamp(toDate)))
    }
    
    const q = constraints.length 
      ? query(col, ...constraints, orderBy('ts', 'desc'))
      : query(col, orderBy('ts', 'desc'))
    
    const snaps = await getDocs(q)
    const items = []
    snaps.forEach(s => items.push({ id: s.id, ...s.data() }))
    
    return items
  } catch (error) {
    throw new DatabaseError('Error al obtener registros', 'getUserRecords', error)
  }
}

/**
 * Get oldest or newest user record
 * @param {string} email - User email
 * @param {string} [order='asc'] - 'asc' for oldest, 'desc' for newest
 * @returns {Promise<Object|null>} Record or null
 */
export async function getUserRecordExtreme(email, order = 'asc') {
  validateEmail(email)
  
  const { app } = await initFirebase()
  if (!app) throw new FirebaseNotInitializedError()
  
  try {
    const db = getFirestore(app)
    const id = emailToId(email)
    const col = collection(db, 'usuarios', id, 'registros')
    const q = query(col, orderBy('ts', order), limit(1))
    const snaps = await getDocs(q)
    
    let item = null
    snaps.forEach(s => {
      item = { id: s.id, ...s.data() }
    })
    
    return item
  } catch (error) {
    throw new DatabaseError('Error al obtener registro extremo', 'getUserRecordExtreme', error)
  }
}

/**
 * Save a new user record to Firestore
 * @param {string} email - User email
 * @param {Object} record - Record data
 * @returns {Promise<Object>} Created record with ID
 * @throws {ValidationError} If validation fails
 * @throws {OfflineError} If offline (queues the operation)
 */
export async function saveUserRecord(email, record) {
  validateEmail(email)
  validateRecord(record)
  
  const { app } = await initFirebase()
  
  // Queue operation if offline or Firebase not initialized
  if (!app || !isOnline()) {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    offlineQueue.enqueue('saveRecord', { email, record: { ...record, id: tempId } })
    throw new OfflineError('Registro guardado localmente. Se sincronizará cuando vuelvas a estar en línea.')
  }
  
  try {
    const db = getFirestore(app)
    const id = emailToId(email)
    const col = collection(db, 'usuarios', id, 'registros')
    
    const rec = {
      ...record,
      ts: normalizeTimestamp(record.ts)
    }
    
    const docRef = await addDoc(col, rec)
    return { id: docRef.id, ...rec }
  } catch (error) {
    // If operation fails, queue it
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    offlineQueue.enqueue('saveRecord', { email, record: { ...record, id: tempId } })
    throw new DatabaseError('Error al guardar registro. Se reintentará automáticamente.', 'saveUserRecord', error)
  }
}

/**
 * Update an existing user record
 * @param {string} email - User email
 * @param {string} idRecord - Record ID
 * @param {Object} record - Updated record data
 * @returns {Promise<void>}
 */
export async function updateUserRecord(email, idRecord, record) {
  validateEmail(email)
  validateRecordId(idRecord)
  validateRecord(record)
  
  const { app } = await initFirebase()
  
  // Queue operation if offline or Firebase not initialized
  if (!app || !isOnline()) {
    offlineQueue.enqueue('updateRecord', { email, idRecord, record })
    throw new OfflineError('Actualización guardada localmente. Se sincronizará cuando vuelvas a estar en línea.')
  }
  
  try {
    const db = getFirestore(app)
    const ref = doc(db, 'usuarios', emailToId(email), 'registros', idRecord)
    
    const rec = {
      ...record,
      ts: normalizeTimestamp(record.ts)
    }
    
    await setDoc(ref, rec, { merge: true })
  } catch (error) {
    // If operation fails, queue it
    offlineQueue.enqueue('updateRecord', { email, idRecord, record })
    throw new DatabaseError('Error al actualizar registro. Se reintentará automáticamente.', 'updateUserRecord', error)
  }
}

/**
 * Delete a user record
 * @param {string} email - User email
 * @param {string} idRecord - Record ID
 * @returns {Promise<void>}
 */
export async function deleteUserRecord(email, idRecord) {
  validateEmail(email)
  validateRecordId(idRecord)
  
  const { app } = await initFirebase()
  
  // Queue operation if offline or Firebase not initialized
  if (!app || !isOnline()) {
    offlineQueue.enqueue('deleteRecord', { email, idRecord })
    throw new OfflineError('Eliminación guardada localmente. Se sincronizará cuando vuelvas a estar en línea.')
  }
  
  try {
    const db = getFirestore(app)
    const ref = doc(db, 'usuarios', emailToId(email), 'registros', idRecord)
    
    await deleteDoc(ref)
  } catch (error) {
    // If operation fails, queue it
    offlineQueue.enqueue('deleteRecord', { email, idRecord })
    throw new DatabaseError('Error al eliminar registro. Se reintentará automáticamente.', 'deleteUserRecord', error)
  }
}