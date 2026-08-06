// JSDoc type definitions for Merkato Protocol

/**
 * @typedef {'admin' | 'buyer'} UserRole
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {UserRole} role
 * @property {string} name
 * @property {string} [companyName]
 * @property {number} [balance]
 * @property {boolean} [approved]
 */

export const DEFAULT_USER = null;
