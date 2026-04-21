// src/lib/auth.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

/**
 * Hashea una contraseña.
 * @param {string} password 
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Compara una contraseña con su hash.
 * @param {string} password 
 * @param {string} hash 
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Genera un token JWT.
 * @param {object} payload 
 * @returns {string}
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

/**
 * Verifica un token JWT.
 * @param {string} token 
 * @returns {object|null}
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
