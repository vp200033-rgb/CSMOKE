/**
 * GŁÓWNY KONTROLER APLIKACJI CS2 LINEUPS
 * Zgodny z diagramem UML (Lineup, Mapa, User, Lineup_Manager, TrowType, Status, Role)
 */

import { Lineup, BLACK_PLACEHOLDER } from './models/Lineup.js?v=20261119_02';
import { Mapa } from './models/Mapa.js?v=20261119_02';
import { User } from './models/User.js?v=20261119_02';
import { Lineup_Manager } from './models/LineupManager.js?v=20261119_02';
import { 
  TrowType, 
  Status, 
  Role, 
  ThrowTypeLabels, 
  StatusLabels, 
  RoleLabels 
} from './models/enums.js?v=20261119_02';
import { StorageService } from './services/storageService.js?v=20261119_02';
import { sound } from './services/audioService.js?v=20261119_02';

// Słownik grafik logo map (zgodnie z plikami _logo w folderze mapy)
export const MAP_LOGOS = Object.freeze({
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

export function getMapLogo(mapItem) {
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
