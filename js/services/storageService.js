/**
 * Serwis zarządzania danymi (Storage & Database Adapter)
 * 
 * Zapewnia pełną obsługę:
 * 1. Kont użytkowników (Rejestracja, Logowanie, Wylogowanie, Sesja).
 * 2. Zapisywania, pobierania i usuwania lineupów smoke'ów.
 * 3. Hybrydowego działania:
 *    - Jeśli backend API jest uruchomiony na http://localhost:3000/api -> łączy się z bazą danych (SQLite / PostgreSQL).
 *    - Jeśli backend nie jest jeszcze podpięty przez zespół -> działa w 100% lokalnie w pamięci przeglądarki (localStorage).
 */

import { Lineup } from '../models/Lineup.js?v=20261119_01';
import { Mapa } from '../models/Mapa.js?v=20261119_01';
import { User } from '../models/User.js?v=20261119_01';
import { Role, Status } from '../models/enums.js?v=20261119_01';
import { SEED_LINEUPS } from '../data/seedLineups.js?v=20261119_01';

// Flaga konfiguracyjna do podłączenia zewnętrznego API / Bazy danych
export const CONFIG = {
  USE_REMOTE_API: false, // Zmień na true po podpięciu serwera przez zespół (lub auto-wykrywanie)
  API_BASE_URL: 'http://localhost:3000/api'
};

const STORAGE_KEY_CUSTOM_LINEUPS = 'cs2_custom_lineups';
const STORAGE_KEY_CURRENT_USER = 'cs2_session_user';
const STORAGE_KEY_AUTH_TOKEN = 'cs2_session_token';
const STORAGE_KEY_USERS_DB = 'cs2_users_database';

// Początkowe konta demonstracyjne (zgodne z bazą danych backendu)
const SEED_USERS = [
  {
    id: 1,
    email: 'admin@cs2lineups.local',
    nickname: 'CS2_Admin',
    password: 'admin123',
    role: Role.ADMIN,
    createdAt: '2026-11-01T12:00:00.000Z'
  },
  {
    id: 2,
    email: 'player@cs2lineups.local',
    nickname: 'CS2_Player',
    password: 'player123',
    role: Role.USER,
    createdAt: '2026-11-05T14:30:00.000Z'
  }
];

export class StorageService {
  /**
   * Inicjalizuje lokalną bazę użytkowników jeśli pusta
   */
  static initUsersDb() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS_DB);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(SEED_USERS));
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  /**
   * Pobiera listę wszystkich zarejestrowanych użytkowników
   * @returns {Array}
   */
  static getAllUsers() {
    this.initUsersDb();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS_DB) || '[]');
    } catch (e) {
      return SEED_USERS;
    }
  }

  /**
   * Pobiera aktualnie zalogowanego użytkownika (lub null / Gość)
   * @returns {User|null}
   */
  static getCurrentUser() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (stored) {
        const data = JSON.parse(stored);
        return new User(data);
      }
    } catch (e) {
      console.warn('Błąd odczytu sesji użytkownika:', e);
    }
    
    // Domyślnie zalogowany jako Administrator (dla wygody prezentacji i testowania strony)
    const defaultAdmin = new User({
      id: 1,
      email: 'admin@cs2lineups.local',
      nickname: 'CS2_Admin',
      role: Role.ADMIN
    });
    this.setCurrentUser(defaultAdmin);
    return defaultAdmin;
  }

  /**
   * Zapisuje aktywnego użytkownika w sesji
   * @param {User|null} user
   */
  static setCurrentUser(user) {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify({
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          role: user.role
        }));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
        localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
      }
    } catch (e) {}
  }

  /**
   * Logowanie użytkownika
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{success: boolean, user?: User, error?: string}>}
   */
  static async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Podaj adres e-mail oraz hasło.' };
    }

    // 1. Próba logowania przez Backend API (jeśli podpięty)
    if (CONFIG.USE_REMOTE_API) {
      try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPass })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const userObj = new User(data.user);
          localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, data.token);
          this.setCurrentUser(userObj);
          return { success: true, user: userObj };
        } else {
          return { success: false, error: data.error || 'Nieprawidłowe dane logowania.' };
        }
      } catch (err) {
        console.warn('[StorageService] Backend offline, przełączanie na autoryzację lokalną:', err);
      }
    }

    // 2. Logowanie lokalne (baza w localStorage)
    const users = this.getAllUsers();
    const found = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === cleanPass);

    if (found) {
      const userObj = new User({
        id: found.id,
        email: found.email,
        nickname: found.nickname,
        role: found.role
      });
      const token = 'token_local_' + Date.now();
      localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
      this.setCurrentUser(userObj);
      return { success: true, user: userObj };
    } else {
      return { success: false, error: 'Nieprawidłowy e-mail lub hasło. Sprawdź wprowadzone dane.' };
    }
  }

  /**
   * Rejestracja nowego konta gracza (zawsze z rolą USER: 1)
   * @param {Object} userData { email, password, nickname }
   * @returns {Promise<{success: boolean, user?: User, error?: string}>}
   */
  static async register({ email, password, nickname }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const cleanNick = (nickname || '').trim() || cleanEmail.split('@')[0];

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'E-mail oraz hasło są wymagane.' };
    }

    if (cleanPass.length < 4) {
      return { success: false, error: 'Hasło musi mieć co najmniej 4 znaki.' };
    }

    // 1. Próba rejestracji przez Backend API
    if (CONFIG.USE_REMOTE_API) {
      try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPass, nickname: cleanNick })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const userObj = new User(data.user);
          localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, data.token);
          this.setCurrentUser(userObj);
          return { success: true, user: userObj };
        } else {
          return { success: false, error: data.error || 'Błąd rejestracji konta.' };
        }
      } catch (err) {
        console.warn('[StorageService] Backend offline, rejestracja w lokalnej bazie:', err);
      }
    }

    // 2. Rejestracja lokalna w localStorage
    const users = this.getAllUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Użytkownik o takim adresie e-mail już istnieje!' };
    }

    const newUserRecord = {
      id: Date.now(),
      email: cleanEmail,
      nickname: cleanNick,
      password: cleanPass,
      role: Role.USER, // Rejestrowany użytkownik otrzymuje rolę USER
      createdAt: new Date().toISOString()
    };

    users.push(newUserRecord);
    try {
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
    } catch (e) {}

    const userObj = new User(newUserRecord);
    const token = 'token_local_' + Date.now();
    localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
    this.setCurrentUser(userObj);

    return { success: true, user: userObj };
  }

  /**
   * Wylogowanie aktywnego użytkownika (przejście w tryb GOŚĆ)
   */
  static async logout() {
    if (CONFIG.USE_REMOTE_API) {
      const token = localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
      if (token) {
        try {
          await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (e) {}
      }
    }
    this.setCurrentUser(null);
  }

  /**
   * Pobiera wszystkie lineupy (z bazy danych lub localStorage + seed)
   * @returns {Promise<Lineup[]>}
   */
  static async loadLineups() {
    if (CONFIG.USE_REMOTE_API) {
      try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/lineups`);
        if (!response.ok) throw new Error('Błąd sieci podczas pobierania lineupów');
        const remoteData = await response.json();
        return remoteData.map(item => new Lineup(item));
      } catch (err) {
        console.warn('Błąd połączenia z backendem API, przełączanie na dane lokalne:', err);
      }
    }

    // Tryb lokalny (Offline / LocalStorage):
    let customLineups = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_LINEUPS);
      if (stored) {
        const parsed = JSON.parse(stored);
        customLineups = parsed.map(item => new Lineup(item));
      }
    } catch (e) {
      console.warn('Nie udało się odczytać z localStorage:', e);
    }

    // Połączenie seedLineups z dodanymi przez użytkownika
    const allSeeds = SEED_LINEUPS.map(item => new Lineup(item));
    
    // Nadpisanie seedów, jeśli użytkownik je zmodyfikował
    const customMap = new Map(customLineups.map(l => [l.id, l]));
    const merged = allSeeds.map(seed => customMap.get(seed.id) || seed);
    
    // Dodanie zupełnie nowych lineupów stworzonych przez gracza
    customLineups.forEach(custom => {
      if (!allSeeds.some(s => s.id === custom.id)) {
        merged.push(custom);
      }
    });

    // Usunięcie tych, które użytkownik usunął (zapisanych w czarnej liście usuniętych)
    try {
      const deletedIds = JSON.parse(localStorage.getItem('cs2_deleted_lineup_ids') || '[]');
      return merged.filter(l => !deletedIds.includes(l.id));
    } catch (e) {
      return merged;
    }
  }

  /**
   * Zapisuje nowy lub zaktualizowany lineup
   * @param {Lineup} lineup
   * @returns {Promise<boolean>}
   */
  static async persistLineup(lineup) {
    if (CONFIG.USE_REMOTE_API) {
      try {
        const token = localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const method = lineup.id && lineup.id < 100000 ? 'PUT' : 'POST';
        const url = method === 'PUT' ? `${CONFIG.API_BASE_URL}/lineups/${lineup.id}` : `${CONFIG.API_BASE_URL}/lineups`;
        const res = await fetch(url, {
          method,
          headers,
          body: JSON.stringify(lineup)
        });
        if (res.ok) return true;
      } catch (err) {
        console.warn('Błąd zapisu do backendu API, zapisywanie lokalnie:', err);
      }
    }

    // Zapis w localStorage
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM_LINEUPS) || '[]');
      const index = stored.findIndex(l => l.id === lineup.id);
      if (index >= 0) {
        stored[index] = lineup;
      } else {
        stored.push(lineup);
      }
      localStorage.setItem(STORAGE_KEY_CUSTOM_LINEUPS, JSON.stringify(stored));

      // Jeśli był na liście usuniętych, usuń go stamtąd
      const deletedIds = JSON.parse(localStorage.getItem('cs2_deleted_lineup_ids') || '[]');
      const newDeleted = deletedIds.filter(id => id !== lineup.id);
      localStorage.setItem('cs2_deleted_lineup_ids', JSON.stringify(newDeleted));

      return true;
    } catch (e) {
      console.error('Błąd zapisu w localStorage:', e);
      return false;
    }
  }

  /**
   * Usuwa lineup (z bazy danych lub localStorage)
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async deleteLineup(id) {
    const numId = Number(id);

    if (CONFIG.USE_REMOTE_API) {
      try {
        const token = localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${CONFIG.API_BASE_URL}/lineups/${numId}`, {
          method: 'DELETE',
          headers
        });
        if (res.ok) return true;
      } catch (err) {
        console.warn('Błąd usuwania z backendu API, usuwanie lokalnie:', err);
      }
    }

    try {
      // 1. Usuń z custom_lineups
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM_LINEUPS) || '[]');
      const filtered = stored.filter(l => l.id !== numId);
      localStorage.setItem(STORAGE_KEY_CUSTOM_LINEUPS, JSON.stringify(filtered));

      // 2. Dodaj do cs2_deleted_lineup_ids (aby ukryć również seed jeśli to był seed)
      const deletedIds = JSON.parse(localStorage.getItem('cs2_deleted_lineup_ids') || '[]');
      if (!deletedIds.includes(numId)) {
        deletedIds.push(numId);
        localStorage.setItem('cs2_deleted_lineup_ids', JSON.stringify(deletedIds));
      }

      return true;
    } catch (e) {
      console.error('Błąd usuwania z localStorage:', e);
      return false;
    }
  }

  /**
   * Pobiera listę map
   * @returns {Mapa[]}
   */
  static getMaps() {
    return Mapa.getRadars();
  }
}
