import { Timestamp } from 'firebase/firestore'

/**
 * Convert email to Firestore document ID
 * Currently returns email as-is, but can be modified to sanitize or hash
 * @param {string} email - User email
 * @returns {string} Document ID
 */
export function emailToId(email) {
  return email
}

/**
 * Normalize various timestamp formats to Firestore Timestamp
 * @param {Date|string|number|Timestamp} ts - Timestamp to normalize
 * @returns {Timestamp} Firestore Timestamp
 */
export function normalizeTimestamp(ts) {
  if (!ts) return Timestamp.now()
  
  if (ts instanceof Timestamp) return ts
  if (ts instanceof Date) return Timestamp.fromDate(ts)
  if (typeof ts === 'string') return Timestamp.fromDate(new Date(ts))
  if (typeof ts === 'number') return Timestamp.fromDate(new Date(ts))
  
  return Timestamp.now()
}

/**
 * Convert Firestore Timestamp to JavaScript Date
 * @param {Timestamp|Date|string|number} ts - Timestamp to convert
 * @returns {Date} JavaScript Date object
 */
export function timestampToDate(ts) {
  if (ts instanceof Timestamp) return ts.toDate()
  if (ts instanceof Date) return ts
  if (typeof ts === 'string') return new Date(ts)
  if (typeof ts === 'number') return new Date(ts)
  
  return new Date()
}

/**
 * Sanitize record data before saving to Firestore
 * Removes undefined values and normalizes timestamps
 * @param {Object} record - Record to sanitize
 * @returns {Object} Sanitized record
 */
export function sanitizeRecord(record) {
  const sanitized = {}
  
  for (const [key, value] of Object.entries(record)) {
    // Skip undefined values
    if (value === undefined) continue
    
    // Normalize timestamps
    if (key === 'ts' || key.endsWith('Timestamp')) {
      sanitized[key] = normalizeTimestamp(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * Convert Firestore record to display format
 * Converts timestamps to Date objects for easier manipulation
 * @param {Object} record - Firestore record
 * @returns {Object} Display-ready record
 */
export function recordToDisplay(record) {
  const display = { ...record }
  
  // Convert timestamp fields to Date
  if (display.ts) {
    display.ts = timestampToDate(display.ts)
  }
  
  // Convert any other timestamp fields
  for (const [key, value] of Object.entries(display)) {
    if (value instanceof Timestamp) {
      display[key] = timestampToDate(value)
    }
  }
  
  return display
}