// CS2 Smoke Lineups Frontend Orchestrator
document.addEventListener('DOMContentLoaded', () => {
  let activeMapId = 1;
  let maps = [];
  let lineups = [];
  let currentUser = null;
  let selectedLineup = null;
  let isRegisterMode = false;

  // DOM Elements
  const mapsListEl = document.getElementById('mapsList');
  const lineupsListEl = document.getElementById('lineupsList');
  const searchInput = document.getElementById('searchInput');
  const radarImg = document.getElementById('radarImg');
  const radarSvgOverlay = document.getElementById('radarSvgOverlay');
  const lineupCountLabel = document.getElementById('lineupCountLabel');
  
  const activeDetailCard = document.getElementById('activeDetailCard');
  const detailTitle = document.getElementById('detailTitle');
  const detailDesc = document.getElementById('detailDesc');
  const detailThrowType = document.getElementById('detailThrowType');
  const detailStatus = document.getElementById('detailStatus');
  const adminActionGroup = document.getElementById('adminActionGroup');
  const btnApprove = document.getElementById('btnApprove');
  const btnReject = document.getElementById('btnReject');

  const submitModal = document.getElementById('submitModal');
  const btnOpenSubmitModal = document.getElementById('btnOpenSubmitModal');
  const btnCloseSubmitModal = document.getElementById('btnCloseSubmitModal');
  const submitLineupForm = document.getElementById('submitLineupForm');

  const authModal = document.getElementById('authModal');
  const btnOpenAuthModal = document.getElementById('btnOpenAuthModal');
  const btnCloseAuthModal = document.getElementById('btnCloseAuthModal');
  const authForm = document.getElementById('authForm');
  const authModalTitle = document.getElementById('authModalTitle');
  const btnSubmitAuth = document.getElementById('btnSubmitAuth');
  const toggleAuthMode = document.getElementById('toggleAuthMode');
  const userProfileArea = document.getElementById('userProfileArea');

  // Initialize
  initApp();

  async function initApp() {
    await checkSession();
    await fetchMaps();
    await fetchLineups(activeMapId);
    setupEventListeners();
  }

  async function checkSession() {
    try {
      const res = await fetch('api.php?action=session');
      const data = await res.json();
      if (data.success && data.user) {
        currentUser = data.user;
        renderUserProfile();
      }
    } catch (e) {
      console.warn('Session check failed', e);
    }
  }

  function renderUserProfile() {
    if (currentUser) {
      userProfileArea.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <span style="font-size: 0.8rem; font-weight: 600; color: #f59e0b;">${currentUser.email} (${currentUser.roleLabel})</span>
          <button id="btnLogout" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">Logout</button>
        </div>
      `;
      document.getElementById('btnLogout').addEventListener('click', async () => {
        await fetch('api.php?action=logout');
        currentUser = null;
        renderUserProfile();
        fetchLineups(activeMapId);
      });
    } else {
      userProfileArea.innerHTML = `<button id="btnOpenAuthModal" class="btn btn-secondary">Login / Register</button>`;
      document.getElementById('btnOpenAuthModal').addEventListener('click', () => {
        authModal.classList.remove('hidden');
      });
    }
  }

  async function fetchMaps() {
    try {
      const res = await fetch('api.php?action=get_maps');
      const data = await res.json();
      if (data.success) {
        maps = data.data;
        renderMaps();
      }
    } catch (e) {
      console.error('Failed to fetch maps', e);
    }
  }

  function renderMaps() {
    mapsListEl.innerHTML = maps.map(m => `
      <button class="map-pill ${m.id === activeMapId ? 'active' : ''}" data-id="${m.id}">
        ${m.name.replace('de_', '')}
      </button>
    `).join('');

    mapsListEl.querySelectorAll('.map-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        activeMapId = parseInt(btn.dataset.id);
        renderMaps();
        const activeMap = maps.find(m => m.id === activeMapId);
        if (activeMap) {
          radarImg.src = activeMap.radarImageUrl;
        }
        fetchLineups(activeMapId);
      });
    });
  }

  async function fetchLineups(mapId) {
    try {
      const res = await fetch(`api.php?action=get_lineups&mapId=${mapId}`);
      const data = await res.json();
      if (data.success) {
        lineups = data.data;
        renderLineups();
        renderRadarTrajectory();
      }
    } catch (e) {
      console.error('Failed to fetch lineups', e);
    }
  }

  function renderLineups() {
    lineupCountLabel.textContent = `Available Lineups (${lineups.length})`;
    if (lineups.length === 0) {
      lineupsListEl.innerHTML = `<div style="color: #64748b; font-size: 0.8rem; text-align: center; padding: 1rem;">No lineups found for this map.</div>`;
      return;
    }

    lineupsListEl.innerHTML = lineups.map(l => {
      const throwBadgeClass = l.throwType === 1 ? 'badge-jump' : (l.throwType === 2 ? 'badge-run' : 'badge-stand');
      const statusBadgeClass = l.status === 1 ? 'badge-approved' : (l.status === 2 ? 'badge-rejected' : 'badge-pending');

      return `
        <div class="lineup-card ${selectedLineup && selectedLineup.id === l.id ? 'active' : ''}" data-id="${l.id}">
          <div class="card-title">${escapeHtml(l.title)}</div>
          <div class="card-meta">
            <span class="badge ${throwBadgeClass}">${l.throwTypeLabel}</span>
            <span class="badge ${statusBadgeClass}">${l.statusLabel}</span>
          </div>
        </div>
      `;
    }).join('');

    lineupsListEl.querySelectorAll('.lineup-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id);
        selectLineup(id);
      });
    });
  }

  function selectLineup(id) {
    selectedLineup = lineups.find(l => l.id === id);
    renderLineups();
    renderRadarTrajectory();

    if (selectedLineup) {
      activeDetailCard.style.display = 'block';
      detailTitle.textContent = selectedLineup.title;
      detailDesc.textContent = selectedLineup.description || 'No detailed instructions provided.';
      detailThrowType.textContent = selectedLineup.throwTypeLabel;
      detailStatus.textContent = selectedLineup.statusLabel;

      if (currentUser && currentUser.role === 2) {
        adminActionGroup.style.display = 'flex';
      } else {
        adminActionGroup.style.display = 'none';
      }
    } else {
      activeDetailCard.style.display = 'none';
    }
  }

  function renderRadarTrajectory() {
    radarSvgOverlay.innerHTML = '';

    lineups.forEach(l => {
      const isSelected = selectedLineup && selectedLineup.id === l.id;
      const opacity = selectedLineup ? (isSelected ? '1.0' : '0.25') : '0.85';

      // Start Player Marker (Amber)
      const startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      startCircle.setAttribute('cx', l.startX);
      startCircle.setAttribute('cy', l.startY);
      startCircle.setAttribute('r', isSelected ? '12' : '8');
      startCircle.setAttribute('fill', '#f59e0b');
      startCircle.setAttribute('stroke', '#000');
      startCircle.setAttribute('stroke-width', '2');
      startCircle.setAttribute('opacity', opacity);
      startCircle.style.cursor = 'pointer';
      startCircle.addEventListener('click', () => selectLineup(l.id));
      radarSvgOverlay.appendChild(startCircle);

      // Trajectory Line
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const dx = l.endX - l.startX;
      const dy = l.endY - l.startY;
      const cx = (l.startX + l.endX) / 2 - dy * 0.15;
      const cy = (l.startY + l.endY) / 2 + dx * 0.15;

      path.setAttribute('d', `M ${l.startX} ${l.startY} Q ${cx} ${cy} ${l.endX} ${l.endY}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', isSelected ? '#f59e0b' : '#3b82f6');
      path.setAttribute('stroke-width', isSelected ? '4' : '2');
      path.setAttribute('stroke-dasharray', isSelected ? 'none' : '4 4');
      path.setAttribute('opacity', opacity);
      radarSvgOverlay.appendChild(path);

      // Smoke Landing Marker (Cloud / Grey circle)
      const endCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      endCircle.setAttribute('cx', l.endX);
      endCircle.setAttribute('cy', l.endY);
      endCircle.setAttribute('r', isSelected ? '26' : '16');
      endCircle.setAttribute('fill', 'rgba(148, 163, 184, 0.4)');
      endCircle.setAttribute('stroke', isSelected ? '#38bdf8' : '#94a3b8');
      endCircle.setAttribute('stroke-width', isSelected ? '3' : '1.5');
      endCircle.setAttribute('opacity', opacity);
      radarSvgOverlay.appendChild(endCircle);
    });
  }

  function setupEventListeners() {
    // Search
    let searchTimeout = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        const q = searchInput.value.trim();
        if (q.length > 0) {
          const res = await fetch(`api.php?action=search_lineups&query=${encodeURIComponent(q)}&mapId=${activeMapId}`);
          const data = await res.json();
          if (data.success) {
            lineups = data.data;
            renderLineups();
            renderRadarTrajectory();
          }
        } else {
          fetchLineups(activeMapId);
        }
      }, 250);
    });

    // Modals
    btnOpenSubmitModal.addEventListener('click', () => submitModal.classList.remove('hidden'));
    btnCloseSubmitModal.addEventListener('click', () => submitModal.classList.add('hidden'));

    if (btnOpenAuthModal) {
      btnOpenAuthModal.addEventListener('click', () => authModal.classList.remove('hidden'));
    }
    btnCloseAuthModal.addEventListener('click', () => authModal.classList.add('hidden'));

    toggleAuthMode.addEventListener('click', (e) => {
      e.preventDefault();
      isRegisterMode = !isRegisterMode;
      authModalTitle.textContent = isRegisterMode ? 'Create CS2 Lineups Account' : 'Account Login';
      btnSubmitAuth.textContent = isRegisterMode ? 'Register' : 'Login';
      toggleAuthMode.textContent = isRegisterMode ? 'Already have an account? Login' : 'Need an account? Register';
    });

    // Submit Lineup form
    submitLineupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const startParts = document.getElementById('lineupStartCoords').value.split(',').map(n => parseFloat(n.trim()));
      const endParts = document.getElementById('lineupEndCoords').value.split(',').map(n => parseFloat(n.trim()));

      const payload = {
        mapId: activeMapId,
        title: document.getElementById('lineupTitle').value.trim(),
        throwType: parseInt(document.getElementById('lineupThrowType').value),
        startX: startParts[0] || 200,
        startY: startParts[1] || 800,
        endX: endParts[0] || 540,
        endY: endParts[1] || 480,
        videoUrl: document.getElementById('lineupVideoUrl').value.trim(),
        crosshairImageUrl: document.getElementById('lineupCrosshairUrl').value.trim(),
        description: document.getElementById('lineupDesc').value.trim(),
      };

      try {
        const res = await fetch('api.php?action=save_lineup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          alert(data.message || 'Lineup saved!');
          submitModal.classList.add('hidden');
          submitLineupForm.reset();
          fetchLineups(activeMapId);
        } else {
          alert(data.error || 'Failed to submit lineup');
        }
      } catch (err) {
        alert('Network error submitting lineup');
      }
    });

    // Auth form submit
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const endpoint = isRegisterMode ? 'register' : 'login';

      try {
        const res = await fetch(`api.php?action=${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
          currentUser = data.user;
          renderUserProfile();
          authModal.classList.add('hidden');
          authForm.reset();
          fetchLineups(activeMapId);
        } else {
          alert(data.error || 'Authentication error');
        }
      } catch (err) {
        alert('Network error during authentication');
      }
    });

    // Admin verify actions
    btnApprove.addEventListener('click', async () => {
      if (!selectedLineup) return;
      await verifyCurrentLineup(1); // 1 = APPROVED
    });

    btnReject.addEventListener('click', async () => {
      if (!selectedLineup) return;
      await verifyCurrentLineup(2); // 2 = REJECTED
    });
  }

  async function verifyCurrentLineup(newStatus) {
    try {
      const res = await fetch('api.php?action=verify_lineup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineupId: selectedLineup.id, newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchLineups(activeMapId);
        activeDetailCard.style.display = 'none';
        selectedLineup = null;
      }
    } catch (e) {
      alert('Failed to update status');
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
