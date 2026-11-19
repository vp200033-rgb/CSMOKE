/**
 * Klasa Lineup_Manager (LineupManager) zgodna z diagramem UML
 */
import { Lineup } from './Lineup.js';
import { Status, Role } from './enums.js';

export class Lineup_Manager {
  /**
   * @param {Lineup[]} [initialLineups]
   */
  constructor(initialLineups = []) {
    this.lineups = initialLineups;
  }

  /**
   * Pobiera wszystkie lineupy dla danej mapy (zgodnie z UML getLineupsByMap(mapId: int): List<Lineup>)
   * @param {number} mapId
   * @param {Object} [filterOptions] opcjonalne filtry (side, site, throwType, status)
   * @param {Object} [currentUser] zalogowany użytkownik (do filtracji zatwierdzonych / oczekujących)
   * @returns {Lineup[]}
   */
  getLineupsByMap(mapId, filterOptions = {}, currentUser = null) {
    return this.lineups.filter(lineup => {
      if (lineup.mapId !== Number(mapId)) return false;
      if (filterOptions.side && filterOptions.side !== 'ALL' && lineup.side !== filterOptions.side) return false;
      if (filterOptions.site && filterOptions.site !== 'ALL' && lineup.site !== filterOptions.site) return false;
      if (filterOptions.throwType !== undefined && filterOptions.throwType !== 'ALL' && lineup.throwType !== Number(filterOptions.throwType)) return false;
      
      // Filtrowanie statusu weryfikacji przez administratora:
      if (filterOptions.status !== undefined && filterOptions.status !== 'ALL') {
        if (lineup.status !== Number(filterOptions.status)) return false;
      } else {
        // Domyślny widok radaru:
        // - Zwykły użytkownik / Gość widzi wszystkie ZATWIERDZONE (APPROVED: 1) oraz swoje własne oczekujące (PENDING: 0)
        // - Administrator (ADMIN: 2) widzi wszystkie ZATWIERDZONE oraz OCZEKUJĄCE na weryfikację
        // - Odrzucone (REJECTED: 2) są ukryte z radaru
        const isAdmin = currentUser && (currentUser.role === Role.ADMIN || (typeof currentUser.isAdmin === 'function' && currentUser.isAdmin()));
        if (!isAdmin) {
          const isOwn = currentUser && lineup.userId === currentUser.id;
          if (lineup.status !== Status.APPROVED && !(isOwn && lineup.status === Status.PENDING)) {
            return false;
          }
        } else {
          if (lineup.status === Status.REJECTED) return false;
        }
      }
      return true;
    });
  }

  /**
   * Wyszukuje lineupy na podstawie frazy (zgodnie z UML searchLineups(query: string): List<Lineup>)
   * @param {string} query
   * @returns {Lineup[]}
   */
  searchLineups(query) {
    if (!query || !query.trim()) return this.lineups;
    const q = query.toLowerCase().trim();
    return this.lineups.filter(lineup => {
      return (
        lineup.title.toLowerCase().includes(q) ||
        (lineup.description && lineup.description.toLowerCase().includes(q)) ||
        (lineup.site && lineup.site.toLowerCase().includes(q)) ||
        (lineup.side && lineup.side.toLowerCase().includes(q))
      );
    });
  }

  /**
   * Weryfikacja lineupu przez Administratora (zgodnie z UML verifyLineup(lineupId: int, newStatus: Status): void)
   * @param {number} lineupId
   * @param {number} newStatus Status enum (0: PENDING, 1: APPROVED, 2: REJECTED)
   * @param {Object} [actingUser] Użytkownik wykonujący akcję (do weryfikacji uprawnień wg UML)
   */
  verifyLineup(lineupId, newStatus, actingUser = null) {
    // Weryfikacja uprawnień (wg relacji 'verifies_permissions' z diagramu UML)
    if (actingUser && actingUser.role !== Role.ADMIN) {
      console.warn('Odmowa dostępu: Tylko użytkownik z rolą ADMIN może weryfikować lineupy.');
      return false;
    }

    const lineup = this.lineups.find(l => l.id === Number(lineupId));
    if (lineup) {
      lineup.updateSatus(newStatus);
      return true;
    }
    return false;
  }

  /**
   * Pobiera pojedynczy lineup po ID
   * @param {number} id
   * @returns {Lineup|undefined}
   */
  getLineupById(id) {
    return this.lineups.find(l => l.id === Number(id));
  }

  /**
   * Dodaje nowy lineup do managera
   * @param {Lineup} lineup
   */
  addLineup(lineup) {
    this.lineups.push(lineup);
    lineup.save();
  }

  /**
   * Usuwa lineup po ID
   * @param {number} id
   */
  deleteLineup(id) {
    const idx = this.lineups.findIndex(l => l.id === Number(id));
    if (idx >= 0) {
      const removed = this.lineups.splice(idx, 1)[0];
      removed.delete();
      return true;
    }
    return false;
  }
}
