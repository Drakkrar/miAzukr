import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { ConfigurationError } from '../utils/errors.js'
import offlineQueue from '../offlineQueue.js'

let app = null
let auth = null

/**
 * Initialize Firebase app and auth
 * Attempts to process offline queue after successful initialization
 * @returns {Promise<Object>} Object with app and auth instances
 * @throws {ConfigurationError} If configuration is invalid
 */
export async function initFirebase() {
  if (app && auth) return { app, auth }
  
  try {
    const mod = await import('../config/firebaseConfig.js')
    const firebaseConfig = mod.default || mod.firebaseConfig || mod
    
    if (!firebaseConfig?.apiKey || firebaseConfig.apiKey.startsWith('<')) {
      console.warn('Firebase: configuración inválida o de ejemplo detectada')
      return { app: null, auth: null }
    }
    
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    
    // Process offline queue when Firebase is ready
    try {
      // Import firestore handlers for offline queue processing
      const { 
        saveUserProfile, 
        saveUserRecord, 
        updateUserRecord, 
        deleteUserRecord 
      } = await import('./firestore.service.js')
      
      // Process queued operations
      offlineQueue.processQueue({
        remoteSaveUserProfile: async ({ email, profile }) => {
          await saveUserProfile(email, profile)
        },
        remoteSaveRecord: async ({ email, record }) => {
          await saveUserRecord(email, record)
        },
        remoteUpdateRecord: async ({ email, idRecord, record }) => {
          await updateUserRecord(email, idRecord, record)
        },
        remoteDeleteRecord: async ({ email, idRecord }) => {
          await deleteUserRecord(email, idRecord)
        }
      })
    } catch (e) {
      console.warn('Error procesando cola offline:', e)
    }
    
    // Also process queue when browser goes back online
    window.addEventListener('online', () => {
      import('./firestore.service.js').then(({ 
        saveUserProfile, 
        saveUserRecord, 
        updateUserRecord, 
        deleteUserRecord 
      }) => {
        offlineQueue.processQueue({
          remoteSaveUserProfile: async ({ email, profile }) => {
            await saveUserProfile(email, profile)
          },
          remoteSaveRecord: async ({ email, record }) => {
            await saveUserRecord(email, record)
          },
          remoteUpdateRecord: async ({ email, idRecord, record }) => {
            await updateUserRecord(email, idRecord, record)
          },
          remoteDeleteRecord: async ({ email, idRecord }) => {
            await deleteUserRecord(email, idRecord)
          }
        })
      })
    })
    
    return { app, auth }
  } catch (err) {
    console.warn('Firebase config not found. Skipping Firebase init.')
    return { app: null, auth: null }
  }
}

/**
 * Get the Firebase app instance
 * @returns {Object|null} Firebase app instance or null if not initialized
 */
export function getFirebaseApp() {
  return app
}

/**
 * Get the Firebase auth instance
 * @returns {Object|null} Firebase auth instance or null if not initialized
 */
export function getFirebaseAuth() {
  return auth
}