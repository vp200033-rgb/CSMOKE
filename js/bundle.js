/**
 * CS2 TACTICAL LINEUPS - STANDALONE BUNDLE
 * Zawiera pełny kod aplikacji zgodny z UML.
 * Działa zarówno na serwerze (http://localhost:8000), jak i bezpośrednio z dysku (file:///).
 */
(function() {
  'use strict';

/* --- SOURCE: js/models/enums.js --- */
/**
 * Enums zgodne z diagramem UML projektu CS2 Lineups
 */

// Sposób rzutu granatu (TrowType z diagramu UML)
const TrowType = Object.freeze({
  STAND: 0,
  JUMPTHROW: 1,
  RUN_JUMPTHROW: 2
});

// Alias dla zachowania poprawności językowej
const ThrowType = TrowType;

// Etykiety i ikony dla typów rzutu
const ThrowTypeLabels = Object.freeze({
  [TrowType.STAND]: {
    label: 'Rzut ze stania (Stand)',
    short: 'STAND',
    icon: '🧍',
    description: 'Rzut z miejsca, bez skoku. Najprostszy i 100% powtarzalny.'
  },
  [TrowType.JUMPTHROW]: {
    label: 'Jumpthrow',
    short: 'JUMPTHROW',
    icon: '🦘',
    description: 'Rzut w najwyższym punkcie skoku (Sub-tick w CS2 zapewnia idealną powtarzalność).'
  },
  [TrowType.RUN_JUMPTHROW]: {
    label: 'Run + Jumpthrow',
    short: 'RUN JUMP',
    icon: '🏃💨',
    description: 'Krótki bieg w przód (zwykle 1-2 kroki) połączony z jumpthrowem.'
  }
});

// Status weryfikacji lineupu (Status z diagramu UML)
const Status = Object.freeze({
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2
});

const StatusLabels = Object.freeze({
  [Status.PENDING]: {
    label: 'Oczekujący (Pending)',
    badgeClass: 'badge-pending',
    icon: '⏳'
  },
  [Status.APPROVED]: {
    label: 'Zatwierdzony (Approved)',
    badgeClass: 'badge-approved',
    icon: '✅'
  },
  [Status.REJECTED]: {
    label: 'Odrzucony (Rejected)',
    badgeClass: 'badge-rejected',
    icon: '❌'
  }
});

// Role użytkowników (Role z diagramu UML)
const Role = Object.freeze({
  GUEST: 0,
  USER: 1,
  ADMIN: 2
});

const RoleLabels = Object.freeze({
  [Role.GUEST]: {
    label: 'Gość (Guest)',
    badgeClass: 'role-guest',
    permissions: 'Przeglądanie lineupów'
  },
  [Role.USER]: {
    label: 'Użytkownik (User)',
    badgeClass: 'role-user',
    permissions: 'Przeglądanie, dodawanie własnych lineupów'
  },
  [Role.ADMIN]: {
    label: 'Administrator (Admin)',
    badgeClass: 'role-admin',
    permissions: 'Pełne uprawnienia, weryfikacja i moderacja lineupów'
  }
});


/* --- SOURCE: js/models/Lineup.js --- */
/**
 * Klasa Lineup zgodna z diagramem UML projektu CS2 Lineups
 */

const BLACK_PLACEHOLDER = 'assets/images/black_placeholder.png';

class Lineup {
  /**
   * @param {Object} params
   * @param {number} params.id
   * @param {number} params.mapId Id mapy (relacja z klasą Mapa)
   * @param {number} [params.userId] Id twórcy (relacja z klasą User)
   * @param {string} params.title Tytuł lineupu
   * @param {number} params.startX Pozycja X gracza na radarze (wartość 0 - 100%)
   * @param {number} params.startY Pozycja Y gracza na radarze (wartość 0 - 100%)
   * @param {number} params.endX Pozycja X lądowania smoke'a (wartość 0 - 100%)
   * @param {number} params.endY Pozycja Y lądowania smoke'a (wartość 0 - 100%)
   * @param {string} [params.videoURL] Opcjonalny link do wideo (np. YouTube/Streamable)
   * @param {string} [params.crosshairImageUrl] Zrzut ekranu celownika
   * @param {string} [params.standingImageUrl] Zrzut ekranu pozycji stania
   * @param {string} [params.landingImageUrl] Zrzut ekranu miejsca lądowania
   * @param {number} [params.throwType] TrowType enum (0: STAND, 1: JUMPTHROW, 2: RUN_JUMPTHROW)
   * @param {string} [params.description] Szczegółowy opis wykonania rzutu
   * @param {number} [params.status] Status enum (0: PENDING, 1: APPROVED, 2: REJECTED)
   * @param {string|Date} [params.createdAt]
   * @param {string} [params.side] 'T' lub 'CT'
   * @param {string} [params.site] 'A', 'B' lub 'MID'
   * @param {string[]} [params.steps] Lista kroków wykonania
   * @param {string} [params.bindRecommendation] Zalecany bind CS2
   */
  constructor({
    id,
    mapId,
    userId = 1,
    title,
    startX,
    startY,
    endX,
    endY,
    videoURL = '',
    crosshairImageUrl = BLACK_PLACEHOLDER,
    standingImageUrl = BLACK_PLACEHOLDER,
    landingImageUrl = BLACK_PLACEHOLDER,
    throwType = TrowType.STAND,
    description = '',
    status = Status.APPROVED,
    createdAt = new Date().toISOString(),
    side = 'T',
    site = 'MID',
    steps = [],
    bindRecommendation = 'bind "c" "+jump; -attack; -attack2"'
  }) {
    this.id = id;
    this.mapId = mapId;
    this.userId = userId;
    this.title = title;
    this.startX = Number(startX);
    this.startY = Number(startY);
    this.endX = Number(endX);
    this.endY = Number(endY);
    this.videoURL = videoURL;
    
    // Zgodnie z wytycznymi: jeśli brak zdjęcia, wstawiane jest czarne zdjęcie zastępcze
    this.crosshairImageUrl = crosshairImageUrl || BLACK_PLACEHOLDER;
    this.standingImageUrl = standingImageUrl || BLACK_PLACEHOLDER;
    this.landingImageUrl = landingImageUrl || BLACK_PLACEHOLDER;
    
    this.throwType = Number(throwType);
    this.description = description;
    this.status = Number(status);
    this.createdAt = typeof createdAt === 'string' ? createdAt : createdAt.toISOString();
    
    // Dodatkowe metadane taktyczne
    this.side = side;
    this.site = site;
    this.steps = Array.isArray(steps) ? steps : [];
    this.bindRecommendation = bindRecommendation;
  }

  /**
   * Sprawdza, czy którekolwiek ze zdjęć korzysta z czarnego placeholderu
   * @returns {boolean}
   */
  isUsingBlackPlaceholder(imageType = 'crosshair') {
    const url = imageType === 'standing' 
      ? this.standingImageUrl 
      : imageType === 'landing' 
        ? this.landingImageUrl 
        : this.crosshairImageUrl;
    return !url || url.includes('black_placeholder') || url.includes('data:image/svg') || url.startsWith('black');
  }

  /**
   * Zapisanie / aktualizacja lineupu (zgodnie z UML save(): void)
   */
  save() {
    try {
      const storedLineups = JSON.parse(localStorage.getItem('cs2_custom_lineups') || '[]');
      const index = storedLineups.findIndex(l => l.id === this.id);
      if (index >= 0) {
        storedLineups[index] = this;
      } else {
        storedLineups.push(this);
      }
      localStorage.setItem('cs2_custom_lineups', JSON.stringify(storedLineups));
    } catch (e) {
      console.warn('Błąd zapisu w localStorage:', e);
    }
  }

  /**
   * Aktualizacja statusu moderacji (zgodnie z UML updateSatus(status: Status): void)
   * @param {number} newStatus Status enum
   */
  updateSatus(newStatus) {
    this.status = newStatus;
    this.save();
  }

  /**
   * Alias dla poprawnej pisowni angielskiej
   * @param {number} newStatus
   */
  updateStatus(newStatus) {
    this.updateSatus(newStatus);
  }

  /**
   * Usunięcie lineupu (zgodnie z UML delete(): void)
   */
  delete() {
    try {
      const storedLineups = JSON.parse(localStorage.getItem('cs2_custom_lineups') || '[]');
      const filtered = storedLineups.filter(l => l.id !== this.id);
      localStorage.setItem('cs2_custom_lineups', JSON.stringify(filtered));
    } catch (e) {
      console.warn('Błąd usuwania z localStorage:', e);
    }
  }
}


/* --- SOURCE: js/models/Mapa.js --- */
/**
 * Klasa Mapa zgodna z diagramem UML
 */

class Mapa {
  /**
   * @param {Object} params
   * @param {number} params.id
   * @param {string} params.name
   * @param {string} params.radarImageUrl
   * @param {string} [params.displayName]
   * @param {boolean} [params.activePool]
   * @param {string} [params.description]
   */
  constructor({ id, name, radarImageUrl, logoImageUrl, displayName, activePool = true, description = '' }) {
    this.id = id;
    this.name = name; // np. 'de_mirage'
    this.radarImageUrl = radarImageUrl; // np. 'mapy/mirage.png' (widok z góry po kliknięciu)
    this.logoImageUrl = logoImageUrl; // np. 'mapy/mirage_logo.png' (logo mapy na karcie w menu)
    this.displayName = displayName || name.replace('de_', '').toUpperCase();
    this.activePool = activePool;
    this.description = description;
  }

  /**
   * Statyczna metoda pobierająca listę wszystkich zdefiniowanych map (zgodnie z UML getRadars(): List<Map>)
   * @returns {Mapa[]}
   */
  static getRadars() {
    return [
      new Mapa({
        id: 1,
        name: 'de_mirage',
        displayName: 'Mirage',
        radarImageUrl: 'mapy/mirage.png',
        logoImageUrl: 'mapy/mirage_logo.png',
        activePool: true,
        description: 'Klasyczna mapa turniejowa osadzona na Bliskim Wschodzie. Kluczowa kontrola środka (Mid) i A ramp.'
      }),
      new Mapa({
        id: 2,
        name: 'de_dust2',
        displayName: 'Dust II',
        radarImageUrl: 'mapy/dust2.png',
        logoImageUrl: 'mapy/dust2_logo.png',
        activePool: true,
        description: 'Najbardziej kultowa mapa Counter-Strike. Prosty układ czterech alei z legendarną bramą na środku i długą A.'
      }),
      new Mapa({
        id: 3,
        name: 'de_ancient',
        displayName: 'Ancient',
        radarImageUrl: 'mapy/ancient.png',
        logoImageUrl: 'mapy/ancient_logo.png',
        activePool: true,
        description: 'Ruiny Azteków w bujnym lesie deszczowym. Szybkie starcia o kontrolę Donuta i B Cave.'
      }),
      new Mapa({
        id: 4,
        name: 'de_anubis',
        displayName: 'Anubis',
        radarImageUrl: 'mapy/anubis.png',
        logoImageUrl: 'mapy/anubis_logo.png',
        activePool: true,
        description: 'Egipska lokacja nad kanałem wodnym. Wiele poziomów i dynamiczna kontrola Mid Bridge.'
      }),
      new Mapa({
        id: 5,
        name: 'de_nuke',
        displayName: 'Nuke (Upper)',
        radarImageUrl: 'mapy/nukeuper.png',
        logoImageUrl: 'mapy/nuke_logo.png',
        activePool: true,
        description: 'Dwupoziomowy kompleks elektrowni atomowej. Ważne ściany smoke\'ów na Outside i A Site.'
      }),
      new Mapa({
        id: 6,
        name: 'de_overpass',
        displayName: 'Overpass',
        radarImageUrl: 'mapy/overpas.png',
        logoImageUrl: 'mapy/overpass_logo.png',
        activePool: false,
        description: 'Berliński park, kanały i wiadukt kolejowy. Trudne do skoordynowania egzekucje na B Short i Monster.'
      }),
      new Mapa({
        id: 7,
        name: 'de_cache',
        displayName: 'Cache',
        radarImageUrl: 'mapy/cashe.png',
        logoImageUrl: 'mapy/cache_logo.png',
        activePool: false,
        description: 'Opuszczona strefa Czarnobyla. Klasyczna mapa wymagająca precyzyjnych smoke\'ów na Mid i Checkers.'
      })
    ];
  }
}


/* --- SOURCE: js/models/User.js --- */
/**
 * Klasa User zgodna z diagramem UML
 */

class User {
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


/* --- SOURCE: js/models/LineupManager.js --- */
/**
 * Klasa Lineup_Manager (LineupManager) zgodna z diagramem UML
 */


class Lineup_Manager {
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


/* --- SOURCE: js/data/seedLineups.js --- */
/**
 * Baza zweryfikowanych lineupów granatów dymnych dla CS2
 * 
 * Zgodnie z poleceniem:
 * - Znajdują się tu wyłącznie rzuty, do których dostarczono autentyczne zrzuty ekranu z gry
 * - Usunięto strzałki i wpisy, dla których nie ma jeszcze dostarczonych zrzutów z gry
 * - Kolejne lineupy można dodawać przez formularz lub wrzucając kolejne screeny do folderu mapy
 */


const SEED_LINEUPS = [
  // ==========================================
  // DE_ANCIENT (ID: 3) - 4 ZWERYFIKOWANE LINEUPY OD UŻYTKOWNIKA
  // ==========================================
  {
    id: 301,
    mapId: 3,
    userId: 1,
    title: 'Ancient: Smoke Drzwi na Mid z T-Spawn (T-Start)',
    startX: 48.0,
    startY: 86.0,
    endX: 49.5,
    endY: 55.0,
    videoURL: '',
    crosshairImageUrl: 'mapy/jumphtrow-drzwi-na-mid-z-t.png',
    standingImageUrl: 'mapy/jumphtrow-drzwi-na-mid-z-t.png',
    landingImageUrl: BLACK_PLACEHOLDER,
    throwType: TrowType.JUMPTHROW,
    description: 'Rzut ze strefy T-Start (schodki na spawnie T). Granat leci nad kamiennymi łukami i ląduje idealnie w drewnianych wrotach na środku (Mid Doors), odcinając snajpera CT i ułatwiając przejęcie Midu.',
    status: Status.APPROVED,
    createdAt: '2026-10-15T11:26:00Z',
    side: 'T',
    site: 'MID',
    steps: [
      '1. Ustaw się na schodach w strefie T-Start (spawn Terrorystów).',
      '2. Wyjmij Smoke i wyceluj dokładnie w środek drewnianych drzwi w kamiennej bramie na wprost.',
      '3. Wykonaj Jumpthrow (rzut ze skokiem).'
    ],
    bindRecommendation: 'bind "c" "+jump; -attack; -attack2"'
  },
  {
    id: 302,
    mapId: 3,
    userId: 1,
    title: 'Ancient: Smoke na Cave z Ruins (Wejście na B)',
    startX: 21.0,
    startY: 59.0,
    endX: 25.5,
    endY: 36.5,
    videoURL: '',
    crosshairImageUrl: 'mapy/jumpthrow-na-cave-z-t.png',
    standingImageUrl: 'mapy/jumpthrow-na-cave-z-t.png',
    landingImageUrl: BLACK_PLACEHOLDER,
    throwType: TrowType.JUMPTHROW,
    description: 'Rzut ze strefy Ruins (przed wejściem na B). Zablokuj się przy skrzyni z plandeką i rzuć Jumpthrow w płaskorzeźbę nad wejściem B. Granat wpada do korytarza Cave (Cheetah), uniemożliwiając obrońcom CT kontrolę rampy B.',
    status: Status.APPROVED,
    createdAt: '2026-10-15T11:28:00Z',
    side: 'T',
    site: 'B',
    steps: [
      '1. Podejdź do skrzyni przykrytej plandeką w strefie Ruins.',
      '2. Wyceluj w kamienną płaskorzeźbę nad wejściem do przejścia B.',
      '3. Naciśnij bind Jumpthrow.'
    ],
    bindRecommendation: 'bind "c" "+jump; -attack; -attack2"'
  },
  {
    id: 303,
    mapId: 3,
    userId: 1,
    title: 'Ancient: Smoke na B Elbow ze spawnu CT (Pozycja 1)',
    startX: 49.5,
    startY: 18.0,
    endX: 37.0,
    endY: 25.0,
    videoURL: '',
    crosshairImageUrl: 'mapy/jumpthrow-na-elbow-z-ct.png',
    standingImageUrl: 'mapy/jumpthrow-na-elbow-z-ct.png',
    landingImageUrl: BLACK_PLACEHOLDER,
    throwType: TrowType.JUMPTHROW,
    description: 'Szybki smoke ze spawnu Antyterrorystów (CT Start). Rzucony w dach budynku świątynnego w ułamku sekundy gasi przejście B Elbow / B Short, zatrzymując szybki rush Terrorystów na bombside B.',
    status: Status.APPROVED,
    createdAt: '2026-10-15T11:35:00Z',
    side: 'CT',
    site: 'B',
    steps: [
      '1. Stań w strefie CT Start na wprost budynku z oznaczeniami Plaza B i Plaza A.',
      '2. Wyceluj w środek spadzistego dachu nad filarem rozdzielającym wejścia.',
      '3. Wykonaj Jumpthrow natychmiast po spawnie rundy.'
    ],
    bindRecommendation: 'bind "c" "+jump; -attack; -attack2"'
  },
  {
    id: 304,
    mapId: 3,
    userId: 1,
    title: 'Ancient: Smoke na Głębokie Elbow (Elbow 2) ze spawnu CT',
    startX: 52.0,
    startY: 18.5,
    endX: 32.0,
    endY: 28.5,
    videoURL: '',
    crosshairImageUrl: 'mapy/jumphtow-na-elbow2-z-ct.png',
    standingImageUrl: 'mapy/jumphtow-na-elbow2-z-ct.png',
    landingImageUrl: BLACK_PLACEHOLDER,
    throwType: TrowType.JUMPTHROW,
    description: 'Alternatywny, głęboki smoke na Elbow ze spawnu CT. Gracz stoi przy prawej ścianie pokrytej pnączami i celuje w samą kalenicę (szczyt dachu). Dym odcina głębszą część korytarza Elbow w stronę Bombsitu B.',
    status: Status.APPROVED,
    createdAt: '2026-10-15T11:36:00Z',
    side: 'CT',
    site: 'B',
    steps: [
      '1. Ustaw się przy prawej kamiennej ścianie porośniętej pnączami w CT Start.',
      '2. Wyceluj w szczyt krawędzi (kalenicę) dachu świątyni.',
      '3. Wykonaj Jumpthrow z lewego przycisku myszy.'
    ],
    bindRecommendation: 'bind "c" "+jump; -attack; -attack2"'
  }
];


/* --- SOURCE: js/services/audioService.js --- */
/**
 * Syntetyzator efektów dźwiękowych interfejsu CS2 (Web Audio API)
 * Działa bez potrzeby zewnętrznych plików audio mp3/wav
 */

class AudioService {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    try {
      this.isMuted = localStorage.getItem('cs2_audio_muted') === 'true';
    } catch (e) {}
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('cs2_audio_muted', this.isMuted.toString());
    } catch (e) {}
    return this.isMuted;
  }

  // Dźwięk najechania myszą na przycisk / kartę mapy
  playHover() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  }

  // Dźwięk kliknięcia i wyboru mapy w stylu CS2 Premier
  playSelect() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  // Dźwięk kliknięcia w znacznik granatu (wyciągnięcie zawleczki smoke'a)
  playSmokeClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  // Dźwięk zamknięcia modala / powrotu do menu
  playBack() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }
}

const sound = new AudioService();


/* --- SOURCE: js/services/storageService.js --- */
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






// Flaga konfiguracyjna do podłączenia zewnętrznego API / Bazy danych
const CONFIG = {
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

class StorageService {
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


/* --- SOURCE: js/app.js --- */
/**
 * GŁÓWNY KONTROLER APLIKACJI CS2 LINEUPS
 * Zgodny z diagramem UML (Lineup, Mapa, User, Lineup_Manager, TrowType, Status, Role)
 */








// Słownik grafik logo map (zgodnie z plikami _logo w folderze mapy)
const MAP_LOGOS = Object.freeze({
  'de_mirage': 'mapy/mirage_logo.png',
  'de_dust2': 'mapy/dust2_logo.png',
  'de_ancient': 'mapy/ancient_logo.png',
  'de_anubis': 'mapy/anubis_logo.png',
  'de_nuke': 'mapy/nuke_logo.png',
  'de_overpass': 'mapy/overpass_logo.png',
  'de_cache': 'mapy/cache_logo.png',
  1: 'mapy/mirage_logo.png',
  2: 'mapy/dust2_logo.png',
  3: 'mapy/ancient_logo.png',
  4: 'mapy/anubis_logo.png',
  5: 'mapy/nuke_logo.png',
  6: 'mapy/overpass_logo.png',
  7: 'mapy/cache_logo.png'
});

function getMapLogo(mapItem) {
  if (mapItem) {
    const rawName = (mapItem.name || '').toLowerCase();
    if (MAP_LOGOS[rawName]) return MAP_LOGOS[rawName];
    if (mapItem.id && MAP_LOGOS[mapItem.id]) return MAP_LOGOS[mapItem.id];
    if (mapItem.logoImageUrl) return mapItem.logoImageUrl;
    if (rawName) {
      const cleanName = rawName.replace('de_', '');
      return `mapy/${cleanName}_logo.png`;
    }
  }
  return 'mapy/dust2_logo.png';
}

class CS2LineupApp {
  constructor() {
    this.maps = [];
    this.lineupManager = new Lineup_Manager();
    this.currentUser = null;
    this.currentMap = null;
    this.activeLineup = null;
    this.currentScreenTab = 'crosshair'; // 'crosshair' | 'landing'

    // Filtry radaru
    this.filters = {
      side: 'ALL',
      site: 'ALL',
      throwType: 'ALL'
    };

    // Stan przybliżenia radaru (Zoom & Pan)
    this.zoomState = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      isPanning: false,
      startX: 0,
      startY: 0
    };

    // Stan interaktywnego wskazywania punktów na radarze
    this.pickingState = {
      active: false,
      step: 0, // 0: nieaktywny, 1: wybór pozycji startowej, 2: wybór lądowania
      startX: null,
      startY: null,
      endX: null,
      endY: null
    };
  }

  async init() {
    // 1. Inicjalizacja aktywnego użytkownika
    this.currentUser = StorageService.getCurrentUser();
    this.renderUserAuthPanel();

    // 2. Pobranie map i lineupów
    this.maps = StorageService.getMaps();
    const loadedLineups = await StorageService.loadLineups();
    this.lineupManager = new Lineup_Manager(loadedLineups);

    // 3. Renderowanie widoku głównego CS2
    this.renderMapsGrid();
    this.populateAddLineupMapSelect();

    // 4. Podpięcie zdarzeń nawigacji i interakcji
    this.setupEventListeners();
    this.setupAuthModal();

    console.log('CS2 Lineups zainicjalizowane pomyślnie. Załadowano map:', this.maps.length, 'lineupów:', loadedLineups.length);
  }

  // =========================================================================
  // NAWIGACJA & PRZEŁĄCZANIE WIDOKÓW
  // =========================================================================
  setupEventListeners() {
    // Nawigacja górnego paska
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        sound.playSelect();
        const targetViewId = btn.getAttribute('data-target-view');
        this.switchView(targetViewId);
      });
      btn.addEventListener('mouseenter', () => sound.playHover());
    });

    // Logo powrót do strony głównej
    document.getElementById('navBrandLogo').addEventListener('click', () => {
      sound.playBack();
      this.switchView('main-menu-view');
    });

    // Przycisk powrotu z radaru do menu
    document.getElementById('backToMenuBtn').addEventListener('click', () => {
      sound.playBack();
      this.switchView('main-menu-view');
    });

    // Dźwięk interfejsu (Mute / Unmute)
    const audioBtn = document.getElementById('audioToggleBtn');
    const audioIcon = document.getElementById('audioIcon');
    audioBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      audioIcon.textContent = isMuted ? '🔇' : '🔊';
      audioBtn.style.opacity = isMuted ? '0.6' : '1';
    });

    // Wyszukiwarka globalna w menu głównym
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleGlobalSearch(e.target.value);
      });
    }

    // Filtry radaru
    this.setupFilterButtons('sideFilterGroup', 'data-side', (val) => {
      this.filters.side = val;
      this.renderRadarMarkers();
      this.renderSidebarList();
    });

    this.setupFilterButtons('siteFilterGroup', 'data-site', (val) => {
      this.filters.site = val;
      this.renderRadarMarkers();
      this.renderSidebarList();
    });

    this.setupFilterButtons('throwTypeFilterGroup', 'data-throw', (val) => {
      this.filters.throwType = val;
      this.renderRadarMarkers();
      this.renderSidebarList();
    });

    // Kontrolki powiększenia radaru
    document.getElementById('zoomInBtn').addEventListener('click', () => this.adjustZoom(0.2));
    document.getElementById('zoomOutBtn').addEventListener('click', () => this.adjustZoom(-0.2));
    document.getElementById('zoomResetBtn').addEventListener('click', () => this.resetZoom());

    // Obsługa przesuwania myszą radaru (Pan)
    const viewport = document.getElementById('radarViewport');
    viewport.addEventListener('mousedown', (e) => {
      if (e.target.closest('.radar-pin')) return;
      this.zoomState.isPanning = true;
      this.zoomState.startX = e.clientX - this.zoomState.translateX;
      this.zoomState.startY = e.clientY - this.zoomState.translateY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.zoomState.isPanning) return;
      this.zoomState.translateX = e.clientX - this.zoomState.startX;
      this.zoomState.translateY = e.clientY - this.zoomState.startY;
      this.updateRadarTransform();
    });

    window.addEventListener('mouseup', () => {
      this.zoomState.isPanning = false;
    });

    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      this.adjustZoom(delta);
    }, { passive: false });

    // Obsługa zamykania modali
    document.getElementById('closeDetailModalBtn').addEventListener('click', () => this.closeLineupModal());
    document.getElementById('closeAddModalBtn').addEventListener('click', () => this.closeAddLineupModal());
    document.getElementById('cancelAddLineupBtn').addEventListener('click', () => this.closeAddLineupModal());

    // Przycisk "Dodaj lineup" - weryfikuje czy użytkownik jest zalogowany
    document.getElementById('openAddLineupModalBtn').addEventListener('click', () => {
      sound.playSelect();
      if (!this.currentUser || this.currentUser.role === Role.GUEST) {
        this.openAuthModal('login', 'Musisz być zalogowany, aby dodać nowy lineup smoke\'a. Zaloguj się lub utwórz konto!');
        return;
      }
      this.openAddLineupModal();
    });

    // Kopiowanie bindu jumpthrow
    document.getElementById('copyBindBtn').addEventListener('click', () => {
      const code = document.getElementById('modalBindCode').innerText;
      navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('copyBindBtn');
        btn.innerText = 'SKOPIOWANO!';
        setTimeout(() => { btn.innerText = 'KOPIUJ'; }, 1500);
      });
    });

    // Obsługa zakładek zdjęć w modalu (1. Jak wycelować -> 2. Gdzie spada smoke)
    const screenTabs = document.querySelectorAll('.screen-tab-btn[data-screen-type]');
    screenTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        sound.playHover();
        const tabType = tab.getAttribute('data-screen-type');
        this.setScreenTab(tabType);
      });
    });

    // Przyciski Poprzedni / Następny krok w oknie zrzutów
    const stepOrder = ['crosshair', 'landing'];
    document.getElementById('prevStepBtn').addEventListener('click', () => {
      sound.playHover();
      const currentIdx = stepOrder.indexOf(this.currentScreenTab);
      if (currentIdx > 0) {
        this.setScreenTab(stepOrder[currentIdx - 1]);
      }
    });

    document.getElementById('nextStepBtn').addEventListener('click', () => {
      sound.playHover();
      const currentIdx = stepOrder.indexOf(this.currentScreenTab);
      if (currentIdx < stepOrder.length - 1) {
        this.setScreenTab(stepOrder[currentIdx + 1]);
      }
    });

    // Obsługa uploadu własnego zrzutu ekranu
    const dropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('screenshotFileInput');
    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleScreenshotUpload(e.target.files[0]);
      }
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--cs2-gold)';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'var(--cs2-border-light)';
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--cs2-border-light)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleScreenshotUpload(e.dataTransfer.files[0]);
      }
    });

    // Przyciski akcji Moderacji w modalu
    document.getElementById('modalApproveBtn').addEventListener('click', () => {
      if (this.activeLineup) {
        this.lineupManager.verifyLineup(this.activeLineup.id, Status.APPROVED, this.currentUser);
        StorageService.persistLineup(this.activeLineup);
        sound.playSelect();
        this.renderLineupModal(this.activeLineup);
        this.renderAdminTable();
        this.updateAdminVisibility();
        if (this.currentMap) {
          this.renderRadarMarkers();
          this.renderSidebarList();
        }
      }
    });

    document.getElementById('modalRejectBtn').addEventListener('click', () => {
      if (this.activeLineup) {
        this.lineupManager.verifyLineup(this.activeLineup.id, Status.REJECTED, this.currentUser);
        StorageService.persistLineup(this.activeLineup);
        sound.playBack();
        this.renderLineupModal(this.activeLineup);
        this.renderAdminTable();
        this.updateAdminVisibility();
        if (this.currentMap) {
          this.renderRadarMarkers();
          this.renderSidebarList();
        }
      }
    });

    // Przycisk usuwania lineupu w oknie szczegółów
    document.getElementById('modalDeleteBtn').addEventListener('click', async () => {
      if (!this.activeLineup) return;
      const title = this.activeLineup.title;
      const id = this.activeLineup.id;

      if (confirm(`Czy na pewno chcesz bezpowrotnie usunąć lineup:\n"${title}"?`)) {
        await StorageService.deleteLineup(id);
        this.lineupManager.deleteLineup(id);
        sound.playBack();
        this.closeLineupModal();
        if (this.currentMap) {
          this.renderRadarMarkers();
          this.renderSidebarList();
        }
        this.renderAdminTable();
        this.updateAdminVisibility();
        alert(`Lineup "${title}" został pomyślnie usunięty.`);
      }
    });

    // Przycisk "Otwórz mapę i wskaż pozycje"
    const pickBtn = document.getElementById('pickCoordsOnRadarBtn');
    if (pickBtn) {
      pickBtn.addEventListener('click', () => {
        sound.playSelect();
        const mapSelect = document.getElementById('newLineupMapSelect');
        const selectedMapId = Number(mapSelect.value);
        const mapObj = this.maps.find(m => m.id === selectedMapId);
        
        if (mapObj && (!this.currentMap || this.currentMap.id !== mapObj.id)) {
          this.openMapRadar(mapObj);
        } else if (!this.currentMap) {
          if (this.maps.length > 0) this.openMapRadar(this.maps[0]);
        }

        // Ukryj modal i włącz tryb wskazywania
        document.getElementById('addLineupModal').classList.remove('active');
        this.pickingState.active = true;
        this.pickingState.step = 1;
        this.pickingState.startX = null;
        this.pickingState.startY = null;
        this.pickingState.endX = null;
        this.pickingState.endY = null;

        const banner = document.getElementById('radarPickingBanner');
        const text = document.getElementById('radarPickingText');
        if (banner && text) {
          text.textContent = 'KROK 1/2: Kliknij gdzie gracz STOI przy rzucie (pozycja startowa)';
          banner.style.display = 'flex';
        }
      });
    }

    // Przycisk Anuluj wskazywanie
    const cancelPickBtn = document.getElementById('cancelPickingBtn');
    if (cancelPickBtn) {
      cancelPickBtn.addEventListener('click', () => {
        this.pickingState.active = false;
        this.pickingState.step = 0;
        const banner = document.getElementById('radarPickingBanner');
        if (banner) banner.style.display = 'none';
        document.getElementById('addLineupModal').classList.add('active');
      });
    }

    // Kliknięcie w radarStage podczas trybu wskazywania punktów rzutu
    const stage = document.getElementById('radarStage');
    if (stage) {
      stage.addEventListener('click', (e) => {
        if (!this.pickingState.active) return;
        e.stopPropagation();

        const rect = stage.getBoundingClientRect();
        const x = Math.min(Math.max(0, ((e.clientX - rect.left) / rect.width) * 100), 100);
        const y = Math.min(Math.max(0, ((e.clientY - rect.top) / rect.height) * 100), 100);
        const roundedX = Math.round(x * 10) / 10;
        const roundedY = Math.round(y * 10) / 10;

        if (this.pickingState.step === 1) {
          this.pickingState.startX = roundedX;
          this.pickingState.startY = roundedY;
          this.pickingState.step = 2;
          sound.playSelect();

          const text = document.getElementById('radarPickingText');
          if (text) {
            text.textContent = `✅ START: (${roundedX}%, ${roundedY}%) | KROK 2/2: Kliknij gdzie LĄDUJE smoke (cel)`;
          }
        } else if (this.pickingState.step === 2) {
          this.pickingState.endX = roundedX;
          this.pickingState.endY = roundedY;
          this.pickingState.active = false;
          this.pickingState.step = 0;
          sound.playSmokeClick();

          const banner = document.getElementById('radarPickingBanner');
          if (banner) banner.style.display = 'none';

          // Zaktualizuj podgląd statusu współrzędnych w formularzu
          const statusText = document.getElementById('coordsStatusText');
          if (statusText) {
            statusText.innerHTML = `<span style="color:#2ecc71;font-weight:bold;">✅ Pozycje wybrane na mapie:</span><br>START (gracz): ${this.pickingState.startX}%, ${this.pickingState.startY}% &nbsp;|&nbsp; CEL (dym): ${roundedX}%, ${roundedY}%`;
          }

          // Odblokuj przycisk zapisu
          const submitBtn = document.getElementById('submitAddLineupBtn');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
          }

          // Przywróć modal dodawania
          document.getElementById('addLineupModal').classList.add('active');
        }
      });
    }

    // Formularz dodawania nowego lineupu
    document.getElementById('addLineupForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddNewLineup();
    });
  }

  setupFilterButtons(containerId, attrName, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const buttons = container.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playSelect();
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const val = btn.getAttribute(attrName);
        callback(val);
      });
      btn.addEventListener('mouseenter', () => sound.playHover());
    });
  }

  // =========================================================================
  // SYSTEM AUTENTYKACJI I ZARZĄDZANIA KONTAMI (USER & ADMIN)
  // =========================================================================
  renderUserAuthPanel() {
    const container = document.getElementById('userAuthContainer');
    if (!container) return;
    container.innerHTML = '';

    if (this.currentUser && this.currentUser.role > Role.GUEST) {
      // Zalogowany gracz lub administrator
      const isAdmin = this.currentUser.isAdmin();
      const badgeText = isAdmin ? '👑 ADMIN (Pełny dostęp)' : '🎖️ GRACZ (USER)';

      const card = document.createElement('div');
      card.className = 'cs2-player-card';
      card.innerHTML = `
        <div class="player-avatar">${isAdmin ? '👑' : '🪖'}</div>
        <div class="player-info">
          <span class="player-nickname">${this.currentUser.nickname}</span>
          <span class="player-rating-badge">${badgeText}</span>
        </div>
        <button class="auth-logout-btn" id="logoutBtn" title="Wyloguj się">🚪 Wyloguj</button>
      `;

      card.querySelector('#logoutBtn').addEventListener('click', async () => {
        sound.playBack();
        await StorageService.logout();
        this.currentUser = null;
        this.renderUserAuthPanel();
        this.updateAdminVisibility();
        if (this.currentMap) {
          this.renderRadarMarkers();
          this.renderSidebarList();
        }
        this.renderAdminTable();
        alert('Zostałeś wylogowany. Przełączono w tryb Gościa (tylko przeglądanie).');
      });

      container.appendChild(card);
    } else {
      // Gość (niezalogowany)
      const guestBox = document.createElement('div');
      guestBox.style.display = 'flex';
      guestBox.style.alignItems = 'center';
      guestBox.style.gap = '8px';

      guestBox.innerHTML = `
        <span style="font-family: var(--cs2-font-tactical); color: var(--cs2-text-dim); font-size: 11px;">TRYB GOŚCIA</span>
        <button class="auth-header-btn" id="openLoginBtn">🔑 Zaloguj</button>
        <button class="auth-header-btn" id="openRegisterBtn" style="background: transparent; border-color: var(--cs2-border-light); color: #fff;">📝 Rejestracja</button>
      `;

      guestBox.querySelector('#openLoginBtn').addEventListener('click', () => {
        sound.playSelect();
        this.openAuthModal('login');
      });

      guestBox.querySelector('#openRegisterBtn').addEventListener('click', () => {
        sound.playSelect();
        this.openAuthModal('register');
      });

      container.appendChild(guestBox);
    }

    this.updateAdminVisibility();
  }

  setupAuthModal() {
    const authModal = document.getElementById('authModal');
    const closeBtn = document.getElementById('closeAuthModalBtn');
    const tabLogin = document.getElementById('authTabLogin');
    const tabRegister = document.getElementById('authTabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const alertBox = document.getElementById('authAlertBox');

    closeBtn.addEventListener('click', () => {
      sound.playBack();
      authModal.classList.remove('active');
    });

    tabLogin.addEventListener('click', () => {
      sound.playHover();
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginForm.style.display = 'flex';
      registerForm.style.display = 'none';
      alertBox.style.display = 'none';
      document.getElementById('authModalTitle').innerHTML = 'LOGOWANIE <span>CS2</span>';
    });

    tabRegister.addEventListener('click', () => {
      sound.playHover();
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      loginForm.style.display = 'none';
      registerForm.style.display = 'flex';
      alertBox.style.display = 'none';
      document.getElementById('authModalTitle').innerHTML = 'REJESTRACJA KONTA <span>CS2</span>';
    });

    // Szybkie logowanie kontami demo
    document.getElementById('quickLoginAdminBtn').addEventListener('click', () => {
      document.getElementById('loginEmail').value = 'admin@cs2lineups.local';
      document.getElementById('loginPassword').value = 'admin123';
      sound.playSelect();
    });

    document.getElementById('quickLoginPlayerBtn').addEventListener('click', () => {
      document.getElementById('loginEmail').value = 'player@cs2lineups.local';
      document.getElementById('loginPassword').value = 'player123';
      sound.playSelect();
    });

    // Obsługa logowania
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const pass = document.getElementById('loginPassword').value;

      const result = await StorageService.login(email, pass);
      if (result.success) {
        sound.playSelect();
        this.currentUser = result.user;
        authModal.classList.remove('active');
        this.renderUserAuthPanel();
        if (this.currentMap) {
          this.renderRadarMarkers();
          this.renderSidebarList();
        }
        this.renderAdminTable();
        alert(`Zalogowano pomyślnie jako: ${result.user.nickname} (${result.user.isAdmin() ? 'Administrator' : 'Użytkownik'})!`);
      } else {
        sound.playBack();
        alertBox.textContent = result.error || 'Błąd logowania.';
        alertBox.style.background = 'rgba(231, 76, 60, 0.2)';
        alertBox.style.border = '1px solid #e74c3c';
        alertBox.style.color = '#ff6b6b';
        alertBox.style.display = 'block';
      }
    });

    // Obsługa rejestracji
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nick = document.getElementById('registerNick').value;
      const email = document.getElementById('registerEmail').value;
      const pass = document.getElementById('registerPassword').value;
      const passConfirm = document.getElementById('registerPasswordConfirm').value;

      if (pass !== passConfirm) {
        sound.playBack();
        alertBox.textContent = 'Hasła nie są identyczne!';
        alertBox.style.background = 'rgba(231, 76, 60, 0.2)';
        alertBox.style.border = '1px solid #e74c3c';
        alertBox.style.color = '#ff6b6b';
        alertBox.style.display = 'block';
        return;
      }

      const result = await StorageService.register({ email, password: pass, nickname: nick });
      if (result.success) {
        sound.playSelect();
        this.currentUser = result.user;
        authModal.classList.remove('active');
        this.renderUserAuthPanel();
        if (this.currentMap) {
          this.renderRadarMarkers();
          this.renderSidebarList();
        }
        this.renderAdminTable();
        alert(`Gratulacje ${result.user.nickname}! Twoje konto zostało utworzone i jesteś zalogowany. Możesz teraz dodawać i zarządzać własnymi lineupami!`);
      } else {
        sound.playBack();
        alertBox.textContent = result.error || 'Błąd rejestracji.';
        alertBox.style.background = 'rgba(231, 76, 60, 0.2)';
        alertBox.style.border = '1px solid #e74c3c';
        alertBox.style.color = '#ff6b6b';
        alertBox.style.display = 'block';
      }
    });
  }

  openAuthModal(mode = 'login', notice = '') {
    const authModal = document.getElementById('authModal');
    const tabLogin = document.getElementById('authTabLogin');
    const tabRegister = document.getElementById('authTabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const alertBox = document.getElementById('authAlertBox');

    if (notice) {
      alertBox.textContent = notice;
      alertBox.style.background = 'rgba(222, 155, 53, 0.15)';
      alertBox.style.border = '1px solid var(--cs2-gold)';
      alertBox.style.color = 'var(--cs2-gold-light)';
      alertBox.style.display = 'block';
    } else {
      alertBox.style.display = 'none';
    }

    if (mode === 'register') {
      tabRegister.click();
    } else {
      tabLogin.click();
    }

    authModal.classList.add('active');
  }

  updateAdminVisibility() {
    const isAdmin = this.currentUser && this.currentUser.isAdmin();
    const adminTab = document.getElementById('tabModeration');
    const pendingCount = this.lineupManager.lineups.filter(l => l.status === Status.PENDING).length;

    if (adminTab) {
      adminTab.innerHTML = `<span>🛡️</span> MODERACJA (ADMIN)${pendingCount > 0 ? `<span class="pending-count-badge">${pendingCount}</span>` : ''}`;
      adminTab.style.display = isAdmin ? 'inline-flex' : 'none';
    }
  }

  switchView(viewId) {
    const views = document.querySelectorAll('.view-section');
    views.forEach(v => v.classList.remove('active'));

    const targetView = document.getElementById(viewId);
    if (targetView) {
      targetView.classList.add('active');
    }

    const navButtons = document.querySelectorAll('.nav-tab-btn');
    navButtons.forEach(btn => {
      if (btn.getAttribute('data-target-view') === viewId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (viewId === 'admin-view') {
      this.renderAdminTable();
    }
  }

  // =========================================================================
  // WIDOK 1: MENU GŁÓWNE CS2 - KARTY MAP
  // =========================================================================
  renderMapsGrid(filteredLineups = null) {
    const container = document.getElementById('mapsGridContainer');
    container.innerHTML = '';

    this.maps.forEach(mapItem => {
      const mapLineups = this.lineupManager.getLineupsByMap(mapItem.id);
      const logoUrl = getMapLogo(mapItem);
      
      const card = document.createElement('div');
      card.className = 'map-card-cs2';
      card.innerHTML = `
        <div class="map-card-preview" title="Kliknij na logo mapy, aby otworzyć widok z góry i interaktywne lineupy">
          <div class="map-card-bg-blur" style="background-image: url('${logoUrl}')"></div>
          <img src="${logoUrl}" alt="${mapItem.displayName} Logo" class="map-logo-img" onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='mapy/${mapItem.name.replace('de_','')}_logo.png';}">
          <span class="map-card-count">💨 ${mapLineups.length} Smoke'ów</span>
        </div>
        <div class="map-card-content">
          <div class="map-codename">${mapItem.name.toUpperCase()}</div>
          <h3 class="map-card-name">${mapItem.displayName}</h3>
          <p class="map-card-desc">${mapItem.description}</p>
          <div class="map-card-footer">
            <span style="font-family: var(--cs2-font-tactical); color: var(--cs2-text-dim); font-size: 11px;">RADAR OVERVIEW</span>
            <button class="map-action-btn">INTERAKTYWNA MAPA <span>▶</span></button>
          </div>
        </div>
      `;

      card.addEventListener('mouseenter', () => sound.playHover());
      card.addEventListener('click', () => {
        sound.playSelect();
        this.openMapRadar(mapItem);
      });

      container.appendChild(card);
    });
  }

  handleGlobalSearch(query) {
    if (!query || !query.trim()) {
      this.renderMapsGrid();
      return;
    }
    const results = this.lineupManager.searchLineups(query);
    console.log(`Wyniki wyszukiwania dla "${query}":`, results.length);
  }

  // =========================================================================
  // WIDOK 2: RADAR MAPY Z GÓRY (OVERHEAD VIEW)
  // =========================================================================
  openMapRadar(mapItem) {
    this.currentMap = mapItem;
    this.resetZoom();

    // Ustaw tytuł i obraz mapy
    document.getElementById('radarCurrentMapTitle').textContent = `${mapItem.name.toUpperCase()} // ${mapItem.displayName.toUpperCase()}`;
    const radarImg = document.getElementById('radarImage');
    radarImg.src = mapItem.radarImageUrl;

    // Przełącz widok
    this.switchView('radar-view');

    // Renderuj znaczniki i listę
    this.renderRadarMarkers();
    this.renderSidebarList();
  }

  renderRadarMarkers() {
    const markersContainer = document.getElementById('radarMarkersContainer');
    const svgOverlay = document.getElementById('radarSvgOverlay');
    markersContainer.innerHTML = '';

    // Zachowaj definicje SVG (defs)
    const defs = svgOverlay.querySelector('defs');
    svgOverlay.innerHTML = '';
    if (defs) svgOverlay.appendChild(defs);

    if (!this.currentMap) return;

    // Pobierz przefiltrowane lineupy dla danej mapy
    const lineups = this.lineupManager.getLineupsByMap(this.currentMap.id, this.filters, this.currentUser);
    document.getElementById('lineupCountBadge').textContent = lineups.length.toString();

    lineups.forEach(lineup => {
      const isPending = lineup.status === Status.PENDING;

      // 1. Ścieżka lotu granatu w SVG (Trajektoria)
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const startX = lineup.startX;
      const startY = lineup.startY;
      const endX = lineup.endX;
      const endY = lineup.endY;

      // Łuk trajektorii z punktem kontrolnym
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2 - 4; // zakrzywienie w górę

      path.setAttribute('d', `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`);
      path.setAttribute('class', `trajectory-path ${isPending ? 'is-pending' : ''}`);
      path.setAttribute('stroke', isPending ? '#f39c12' : (lineup.side === 'CT' ? 'url(#trajGradientCT)' : 'url(#trajGradientT)'));
      path.setAttribute('marker-end', lineup.side === 'CT' ? 'url(#arrowCT)' : 'url(#arrowT)');
      path.id = `traj-${lineup.id}`;
      svgOverlay.appendChild(path);

      // 2. Znacznik pozycji rzutu (START)
      const startPin = document.createElement('div');
      startPin.className = `radar-pin pin-thrower ${lineup.side === 'CT' ? 'ct-side' : ''} ${isPending ? 'is-pending' : ''}`;
      startPin.style.left = `${startX}%`;
      startPin.style.top = `${startY}%`;
      startPin.setAttribute('title', `Pozycja stania: ${lineup.title}`);
      
      const statusSuffix = isPending ? '<br><span style="color:#f39c12; font-weight:bold; font-size:10px;">⏳ [OCZEKUJE NA ZATWIERDZENIE ADMINA]</span>' : '';
      const startTooltip = document.createElement('div');
      startTooltip.className = 'pin-tooltip';
      startTooltip.innerHTML = `<strong>${lineup.title}</strong>${statusSuffix}<br><span style="color:var(--cs2-gold); font-size:10px;">Miejsce rzutu (Stój tutaj)</span>`;
      startPin.appendChild(startTooltip);

      // 3. Znacznik lądowania smoke'a (END)
      const endPin = document.createElement('div');
      endPin.className = `radar-pin pin-smoke ${isPending ? 'is-pending' : ''}`;
      endPin.style.left = `${endX}%`;
      endPin.style.top = `${endY}%`;
      endPin.innerHTML = '💨';

      const endTooltip = document.createElement('div');
      endTooltip.className = 'pin-tooltip';
      endTooltip.innerHTML = `<strong>${lineup.title}</strong>${statusSuffix}<br><span style="color:#58a6ff; font-size:10px;">Lądowanie dymu (Kliknij aby otworzyć)</span>`;
      endPin.appendChild(endTooltip);

      // Zdarzenia najechania myszą - podświetlanie trajektorii
      const highlight = () => {
        path.classList.add('highlighted');
        startPin.style.transform = 'translate(-50%, -50%) scale(1.4)';
        endPin.style.transform = 'translate(-50%, -50%) scale(1.4)';
      };

      const unhighlight = () => {
        path.classList.remove('highlighted');
        startPin.style.transform = '';
        endPin.style.transform = '';
      };

      startPin.addEventListener('mouseenter', () => { sound.playHover(); highlight(); });
      path.addEventListener('mouseenter', () => { sound.playHover(); highlight(); });
      path.addEventListener('mouseleave', unhighlight);

      // Zdarzenie kliknięcia - Otwarcie zrzutu ekranu z gry
      const openModalHandler = () => {
        sound.playSmokeClick();
        this.openLineupModal(lineup);
      };

      path.addEventListener('click', openModalHandler);
      startPin.addEventListener('click', openModalHandler);
      endPin.addEventListener('click', openModalHandler);

      markersContainer.appendChild(startPin);
      markersContainer.appendChild(endPin);
    });
  }

  renderSidebarList() {
    const listContainer = document.getElementById('sidebarLineupsList');
    listContainer.innerHTML = '';

    if (!this.currentMap) return;

    const lineups = this.lineupManager.getLineupsByMap(this.currentMap.id, this.filters, this.currentUser);

    if (lineups.length === 0) {
      listContainer.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--cs2-text-dim);">
          Brak lineupów spełniających wybrane filtry.
        </div>
      `;
      return;
    }

    lineups.forEach(lineup => {
      const throwInfo = ThrowTypeLabels[lineup.throwType] || ThrowTypeLabels[0];
      const isPending = lineup.status === Status.PENDING;
      const item = document.createElement('div');
      item.className = `lineup-sidebar-item ${isPending ? 'item-pending' : ''}`;
      item.innerHTML = `
        <div class="lineup-item-badges">
          <span class="badge-tag ${lineup.side === 'CT' ? 'badge-side-ct' : 'badge-side-t'}">${lineup.side}</span>
          <span class="badge-tag badge-throw">${lineup.site}</span>
          <span class="badge-tag badge-throw">${throwInfo.icon} ${throwInfo.short}</span>
          ${isPending ? '<span class="badge-tag badge-pending" style="background:rgba(243,156,18,0.2);color:#f39c12;border:1px solid #f39c12;font-size:10px;">⏳ OCZEKUJE NA AKCEPTACJĘ</span>' : ''}
        </div>
        <div class="lineup-item-title">${lineup.title}</div>
        <div class="lineup-item-desc">${lineup.description}</div>
      `;

      item.addEventListener('mouseenter', () => {
        sound.playHover();
        const path = document.getElementById(`traj-${lineup.id}`);
        if (path) path.classList.add('highlighted');
      });

      item.addEventListener('mouseleave', () => {
        const path = document.getElementById(`traj-${lineup.id}`);
        if (path) path.classList.remove('highlighted');
      });

      item.addEventListener('click', () => {
        sound.playSmokeClick();
        this.openLineupModal(lineup);
      });

      listContainer.appendChild(item);
    });
  }

  // =========================================================================
  // KONTROLA POWIĘKSZENIA I PRZESUWANIA RADARU (ZOOM & PAN)
  // =========================================================================
  adjustZoom(delta) {
    this.zoomState.scale = Math.min(Math.max(0.8, this.zoomState.scale + delta), 3.0);
    this.updateRadarTransform();
  }

  resetZoom() {
    this.zoomState.scale = 1;
    this.zoomState.translateX = 0;
    this.zoomState.translateY = 0;
    this.updateRadarTransform();
  }

  updateRadarTransform() {
    const stage = document.getElementById('radarStage');
    if (stage) {
      stage.style.transform = `translate(${this.zoomState.translateX}px, ${this.zoomState.translateY}px) scale(${this.zoomState.scale})`;
    }
  }

  // =========================================================================
  // MODAL SZCZEGÓŁÓW LINEUPU & SCREEN Z GRY (2 KROKI: AIM + LĄDOWANIE)
  // =========================================================================
  openLineupModal(lineup) {
    this.activeLineup = lineup;
    this.renderLineupModal(lineup);
    this.setScreenTab('crosshair'); // Domyślna zakładka: jak wycelować

    const modal = document.getElementById('lineupDetailModal');
    modal.classList.add('active');
  }

  closeLineupModal() {
    sound.playBack();
    const modal = document.getElementById('lineupDetailModal');
    modal.classList.remove('active');
    this.activeLineup = null;
  }

  setScreenTab(tabType) {
    this.currentScreenTab = tabType;
    const tabs = document.querySelectorAll('.screen-tab-btn[data-screen-type]');
    tabs.forEach(t => {
      if (t.getAttribute('data-screen-type') === tabType) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    const stepOrder = ['crosshair', 'landing'];
    const idx = stepOrder.indexOf(tabType);
    const prevBtn = document.getElementById('prevStepBtn');
    const nextBtn = document.getElementById('nextStepBtn');
    if (prevBtn) prevBtn.style.opacity = idx === 0 ? '0.4' : '1';
    if (nextBtn) nextBtn.style.opacity = idx === stepOrder.length - 1 ? '0.4' : '1';

    const stepBadge = document.getElementById('screenStepBadge');
    const stepLabel = document.getElementById('screenCurrentStepLabel');

    if (tabType === 'crosshair') {
      if (stepBadge) stepBadge.textContent = 'KROK 1/2: CELOWNIK I PUNKT RZUTU (JAK WYCELOWAĆ)';
      if (stepLabel) stepLabel.textContent = '1. JAK WYCELOWAĆ';
    } else if (tabType === 'landing') {
      if (stepBadge) stepBadge.textContent = 'KROK 2/2: GDZIE SPADA SMOKE (LĄDOWANIE)';
      if (stepLabel) stepLabel.textContent = '2. GDZIE SPADA SMOKE';
    }

    this.updateModalScreenImage();
  }

  renderLineupModal(lineup) {
    document.getElementById('modalLineupTitle').textContent = lineup.title;

    // Badges nagłówka
    const badgesRow = document.getElementById('modalBadgesRow');
    const throwInfo = ThrowTypeLabels[lineup.throwType] || ThrowTypeLabels[0];
    const statusInfo = StatusLabels[lineup.status] || StatusLabels[0];

    badgesRow.innerHTML = `
      <span class="badge-tag ${lineup.side === 'CT' ? 'badge-side-ct' : 'badge-side-t'}">${lineup.side} SIDE</span>
      <span class="badge-tag badge-throw">BOMBSITE: ${lineup.site}</span>
      <span class="badge-tag badge-throw">${throwInfo.icon} ${throwInfo.short}</span>
      <span class="badge-tag ${statusInfo.badgeClass}">${statusInfo.icon} ${statusInfo.label}</span>
    `;

    // Typ rzutu
    document.getElementById('modalThrowTypeName').textContent = throwInfo.label;
    document.getElementById('modalThrowTypeDesc').textContent = throwInfo.description;
    document.getElementById('modalThrowTypeCard').querySelector('.throwtype-icon').textContent = throwInfo.icon;

    // Kroki rzutu
    const stepsList = document.getElementById('modalStepsList');
    stepsList.innerHTML = '';
    if (lineup.steps && lineup.steps.length > 0) {
      lineup.steps.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        stepsList.appendChild(li);
      });
    } else {
      stepsList.innerHTML = '<li>Podstawowy rzut na pozycję referencyjną ze zrzutu ekranu.</li>';
    }

    // Opis taktyczny
    document.getElementById('modalDescription').textContent = lineup.description || 'Brak dodatkowego opisu taktycznego.';

    // Bind do konsoli
    document.getElementById('modalBindCode').textContent = lineup.bindRecommendation || 'bind "c" "+jump; -attack; -attack2"';

    // Panel moderacji Admina (UML: verifyLineup)
    const adminBox = document.getElementById('modalAdminBox');
    const isAdmin = this.currentUser && this.currentUser.isAdmin();
    adminBox.style.display = isAdmin ? 'flex' : 'none';
    document.getElementById('modalStatusBadge').innerHTML = `
      <span class="badge-tag ${statusInfo.badgeClass}">${statusInfo.icon} ${statusInfo.label}</span>
    `;

    // Przycisk usuwania: dostępny dla Administratora LUB Autora tego lineupu
    const canDelete = this.currentUser && (isAdmin || (lineup.userId && lineup.userId === this.currentUser.id));
    const deleteBtn = document.getElementById('modalDeleteBtn');
    if (deleteBtn) {
      deleteBtn.style.display = canDelete ? 'inline-block' : 'none';
    }
  }

  /**
   * Logika renderowania zrzutu ekranu i czarnego zdjęcia zastępczego
   */
  updateModalScreenImage() {
    if (!this.activeLineup) return;

    const imgEl = document.getElementById('modalScreenImg');
    const noticeBox = document.getElementById('placeholderNoticeBox');

    let currentUrl = '';
    let stepTitle = '';
    if (this.currentScreenTab === 'landing') {
      currentUrl = this.activeLineup.landingImageUrl;
      stepTitle = '2. GDZIE SPADA SMOKE (LĄDOWANIE)';
    } else {
      currentUrl = this.activeLineup.crosshairImageUrl;
      stepTitle = '1. JAK WYCELOWAĆ (CELOWNIK / AIM)';
    }

    const isPlaceholder = !currentUrl || currentUrl.includes('black_placeholder') || currentUrl.startsWith('black');

    if (isPlaceholder) {
      // Wyświetlenie czarnego zdjęcia zastępczego
      imgEl.src = 'assets/images/black_placeholder.png';
      noticeBox.style.display = 'flex';
      noticeBox.style.borderColor = 'var(--cs2-gold)';
      noticeBox.style.background = 'rgba(30, 22, 10, 0.85)';
      noticeBox.querySelector('h4').textContent = '⚠️ INFORMACJA O ZRZUCIE EKRANU Z GRY (CS2)';
      noticeBox.querySelector('h4').style.color = 'var(--cs2-gold-light)';
      noticeBox.querySelector('p').innerHTML = `
        Brak autentycznego zrzutu ekranu z gry dla kroku: <strong>${stepTitle}</strong>. 
        Zgodnie z wytycznymi projektu, <em>nie wygenerowano sztucznego obrazu</em>, lecz wstawiono <strong>czarne zdjęcie zastępcze</strong> (<code>assets/images/black_placeholder.png</code>). 
        Możesz wgrać autentyczny screenshot z gry przeciągając plik w pole poniżej.
      `;
    } else {
      // Wyświetlenie wgranego autentycznego zrzutu
      imgEl.src = currentUrl;
      noticeBox.style.display = 'flex';
      noticeBox.style.borderColor = '#27ae60';
      noticeBox.style.background = 'rgba(39, 174, 96, 0.1)';
      noticeBox.querySelector('h4').textContent = '✅ AUTENTYCZNY ZRZUT EKRANU Z GRY ZAŁADOWANY';
      noticeBox.querySelector('h4').style.color = '#2ecc71';
      noticeBox.querySelector('p').textContent = `Wyświetlono zrzut ekranu dla: ${stepTitle}.`;
    }
  }

  handleScreenshotUpload(file) {
    if (!this.activeLineup) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      if (this.currentScreenTab === 'landing') {
        this.activeLineup.landingImageUrl = dataUrl;
      } else {
        this.activeLineup.crosshairImageUrl = dataUrl;
      }

      // Zapis w pamięci i bazie
      this.activeLineup.save();
      await StorageService.persistLineup(this.activeLineup);
      sound.playSelect();
      this.updateModalScreenImage();
      console.log('Zapisano nowy zrzut ekranu dla lineupu ID:', this.activeLineup.id);
    };
    reader.readAsDataURL(file);
  }

  // =========================================================================
  // MODAL DODAWANIA LINEUPU (UML: save())
  // =========================================================================
  populateAddLineupMapSelect() {
    const select = document.getElementById('newLineupMapSelect');
    select.innerHTML = '';
    this.maps.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.displayName} (${m.name})`;
      select.appendChild(opt);
    });
  }

  openAddLineupModal() {
    const modal = document.getElementById('addLineupModal');
    if (this.currentMap) {
      document.getElementById('newLineupMapSelect').value = this.currentMap.id;
    }
    modal.classList.add('active');
  }

  closeAddLineupModal() {
    sound.playBack();
    document.getElementById('addLineupModal').classList.remove('active');
  }

  async handleAddNewLineup() {
    const title = document.getElementById('newLineupTitle').value;
    const mapId = Number(document.getElementById('newLineupMapSelect').value);
    const throwType = Number(document.getElementById('newLineupThrowType').value);
    const side = document.getElementById('newLineupSide').value;
    const site = document.getElementById('newLineupSite').value;
    const startX = this.pickingState.startX != null ? this.pickingState.startX : 25.0;
    const startY = this.pickingState.startY != null ? this.pickingState.startY : 75.0;
    const endX = this.pickingState.endX != null ? this.pickingState.endX : 50.0;
    const endY = this.pickingState.endY != null ? this.pickingState.endY : 50.0;
    const desc = document.getElementById('newLineupDesc').value || '';

    // Odczyt 2 opcjonalnych zrzutów ekranu przesłanych przez użytkownika
    const readFile = (fileInput) => {
      return new Promise((resolve) => {
        if (fileInput && fileInput.files && fileInput.files[0]) {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => resolve(BLACK_PLACEHOLDER);
          reader.readAsDataURL(fileInput.files[0]);
        } else {
          resolve(BLACK_PLACEHOLDER);
        }
      });
    };

    const crosshairImg = await readFile(document.getElementById('newLineupCrosshairFile'));
    const landingImg = await readFile(document.getElementById('newLineupLandingFile'));

    const isUserAdmin = this.currentUser && this.currentUser.isAdmin();
    const initialStatus = isUserAdmin ? Status.APPROVED : Status.PENDING;
    const authorId = this.currentUser ? this.currentUser.id : 1;

    const newLineup = new Lineup({
      id: Date.now(),
      mapId,
      userId: authorId,
      title,
      startX,
      startY,
      endX,
      endY,
      crosshairImageUrl: crosshairImg,
      standingImageUrl: crosshairImg,
      landingImageUrl: landingImg,
      throwType,
      description: desc,
      status: initialStatus,
      side,
      site,
      steps: [
        '1. Ustaw się na pozycji startowej wskazanej na mapie.',
        '2. Wyceluj w wybrany punkt referencyjny ze zrzutu ekranu.',
        `3. Wykonaj ${ThrowTypeLabels[throwType]?.short || 'rzut'}.`
      ],
      bindRecommendation: 'bind "c" "+jump; -attack; -attack2"'
    });

    // Zapis w pamięci aplikacji i serwisie bazy danych
    this.lineupManager.addLineup(newLineup);
    await StorageService.persistLineup(newLineup);
    sound.playSelect();

    // Reset stanu wskazywania dla następnego lineupu
    this.pickingState.startX = null;
    this.pickingState.startY = null;
    this.pickingState.endX = null;
    this.pickingState.endY = null;

    // Reset submit button
    const sb = document.getElementById('submitAddLineupBtn');
    if (sb) { sb.disabled = true; sb.style.opacity = '0.5'; sb.style.cursor = 'not-allowed'; }
    const st = document.getElementById('coordsStatusText');
    if (st) st.textContent = 'Kliknij przycisk poniżej, aby otworzyć mapę i wskazać punkt rzutu oraz lądowania smoke\'a.';
    document.getElementById('newLineupTitle').value = '';
    document.getElementById('newLineupDesc').value = '';

    this.closeAddLineupModal();

    if (this.currentMap && this.currentMap.id === mapId) {
      this.renderRadarMarkers();
      this.renderSidebarList();
    }
    this.renderAdminTable();
    this.updateAdminVisibility();

    if (isUserAdmin) {
      alert(`Lineup "${title}" został pomyślnie dodany i ZATWIERDZONY jako Administrator!`);
    } else {
      alert(`Lineup "${title}" został pomyślnie zgłoszony!\n\nStatus: OCZEKUJE NA WERYFIKACJĘ (PENDING).\nJako autor widzisz go na radarze ze statusem "PENDING". Gdy Administrator zatwierdzi go w panelu moderacji, rzut stanie się publicznie widoczny dla wszystkich.`);
    }
  }

  // =========================================================================
  // WIDOK 3: PANEL MODERACJI & WERYFIKACJI (ADMIN)
  // =========================================================================
  renderAdminTable() {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const allLineups = this.lineupManager.lineups;

    if (allLineups.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px; color: var(--cs2-text-dim);">Brak zarejestrowanych lineupów w bazie danych.</td></tr>';
      return;
    }

    allLineups.forEach(l => {
      const mapItem = this.maps.find(m => m.id === l.mapId);
      const throwInfo = ThrowTypeLabels[l.throwType] || ThrowTypeLabels[0];
      const statusInfo = StatusLabels[l.status] || StatusLabels[0];

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family: monospace; color: var(--cs2-gold);">${l.id}</td>
        <td><strong>${l.title}</strong></td>
        <td>${mapItem ? mapItem.displayName : l.mapId}</td>
        <td>${throwInfo.icon} ${throwInfo.short}</td>
        <td><span class="badge-tag ${l.side === 'CT' ? 'badge-side-ct' : 'badge-side-t'}">${l.side}</span> ${l.site}</td>
        <td><span class="badge-tag ${statusInfo.badgeClass}">${statusInfo.icon} ${statusInfo.label}</span></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn-approve" data-action="approve" data-id="${l.id}">✓ Zatwierdź</button>
            <button class="btn-reject" data-action="reject" data-id="${l.id}">✕ Odrzuć</button>
            <button class="btn-delete" data-action="delete" data-id="${l.id}">🗑️ Usuń</button>
          </div>
        </td>
      `;

      tr.querySelector('[data-action="approve"]').addEventListener('click', async () => {
        this.lineupManager.verifyLineup(l.id, Status.APPROVED, this.currentUser);
        await StorageService.persistLineup(l);
        sound.playSelect();
        this.renderAdminTable();
        this.updateAdminVisibility();
        if (this.currentMap) {
          this.renderRadarMarkers();
          this.renderSidebarList();
        }
      });

      tr.querySelector('[data-action="reject"]').addEventListener('click', async () => {
        this.lineupManager.verifyLineup(l.id, Status.REJECTED, this.currentUser);
        await StorageService.persistLineup(l);
        sound.playBack();
        this.renderAdminTable();
        this.updateAdminVisibility();
        if (this.currentMap) {
          this.renderRadarMarkers();
          this.renderSidebarList();
        }
      });

      tr.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        if (confirm(`Czy na pewno chcesz usunąć lineup ID ${l.id} ("${l.title}") z bazy danych?`)) {
          await StorageService.deleteLineup(l.id);
          this.lineupManager.deleteLineup(l.id);
          sound.playBack();
          this.renderAdminTable();
          this.updateAdminVisibility();
          if (this.currentMap) {
            this.renderRadarMarkers();
            this.renderSidebarList();
          }
        }
      });

      tbody.appendChild(tr);
    });
  }
}

// Inicjalizacja aplikacji po załadowaniu drzewa DOM
window.addEventListener('DOMContentLoaded', () => {
  const app = new CS2LineupApp();
  app.init();
});


  // Eksport do obiektu globalnego window dla łatwego debugowania w konsoli F12
  window.CS2 = {
    TrowType,
    Status,
    Role,
    Lineup,
    Mapa,
    User,
    Lineup_Manager,
    StorageService,
    sound,
    MAP_LOGOS,
    getMapLogo,
    app: window.cs2App
  };
})();
