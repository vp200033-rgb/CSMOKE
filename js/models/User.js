/**
 * Klasa User zgodna z diagramem UML
 */
import { Role } from './enums.js';

export class User {
  /**
   * @param {Object} params
   * @param {number} params.id
   * @param {string} params.email
   * @param {string} [params.nickname]
   * @param {string} [params.passwordHash]
   * @param {number} [params.role] Role enum (0: GUEST, 1: USER, 2: ADMIN)
   * @param {string|Date} [params.createdAt]
   */
  constructor({
    id,
    email,
    nickname,
    passwordHash = '',
    role = Role.USER,
    createdAt = new Date().toISOString()
  }) {
    this.id = id;
    this.email = email;
    this.nickname = nickname || (email ? email.split('@')[0] : 'Gracz CS2');
    this.passwordHash = passwordHash;
    this.role = Number(role !== undefined ? role : Role.USER);
    this.createdAt = typeof createdAt === 'string' ? createdAt : createdAt.toISOString();
  }

  /**
   * Sprawdza czy użytkownik posiada rolę Administratora (Role.ADMIN: 2)
   * @returns {boolean}
   */
  isAdmin() {
    return this.role === Role.ADMIN;
  }

  /**
   * Sprawdza czy użytkownik jest zalogowanym Graczem (Role.USER: 1 lub ADMIN: 2)
   * @returns {boolean}
   */
  isUser() {
    return this.role >= Role.USER;
  }

  /**
   * Sprawdza czy użytkownik jest Gościem (Role.GUEST: 0 lub brak ID)
   * @returns {boolean}
   */
  isGuest() {
    return this.role === Role.GUEST || !this.id;
  }
}
