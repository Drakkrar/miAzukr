import { GoogleAuthProvider, signInWithPopup, 
         signInWithEmailAndPassword, signOut as fbSignOut, 
         onAuthStateChanged } from 'firebase/auth'
import { initFirebase } from './firebase.service.js'
import { validateEmail, validatePassword } from '../utils/validators.js'
import { FirebaseNotInitializedError, AuthenticationError } from '../utils/errors.js'

/**
 * Sign in with Google provider
 * @returns {Promise<Object>} User credentials
 * @throws {FirebaseNotInitializedError} If Firebase is not initialized
 * @throws {AuthenticationError} If sign in fails
 */
export async function signInWithGoogle() {
  try {
    const { auth } = await initFirebase()
    if (!auth) throw new FirebaseNotInitializedError()
    
    const provider = new GoogleAuthProvider()
    return await signInWithPopup(auth, provider)
  } catch (error) {
    if (error instanceof FirebaseNotInitializedError) throw error
    throw new AuthenticationError('Error al iniciar sesión con Google', error)
  }
}

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User credentials
 * @throws {ValidationError} If email or password are invalid
 * @throws {FirebaseNotInitializedError} If Firebase is not initialized
 * @throws {AuthenticationError} If sign in fails
 */
export async function signInWithEmail(email, password) {
  validateEmail(email)
  validatePassword(password)
  
  try {
    const { auth } = await initFirebase()
    if (!auth) throw new FirebaseNotInitializedError()
    
    return await signInWithEmailAndPassword(auth, email, password)
  } catch (error) {
    if (error instanceof FirebaseNotInitializedError) throw error
    throw new AuthenticationError('Error al iniciar sesión', error)
  }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 * @throws {AuthenticationError} If sign out fails
 */
export async function signOut() {
  try {
    const { auth } = await initFirebase()
    if (!auth) return
    
    await fbSignOut(auth)
  } catch (error) {
    throw new AuthenticationError('Error al cerrar sesión', error)
  }
}

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function to receive auth state updates
 * @returns {Function} Unsubscribe function
 */
export async function onAuthChanged(callback) {
  const { auth } = await initFirebase()
  
  if (!auth) {
    // If Firebase is not initialized, call callback with null user
    callback(null)
    return () => {} // Return empty unsubscribe function
  }
  
  return onAuthStateChanged(auth, callback)
}