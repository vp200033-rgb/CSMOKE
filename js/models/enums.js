/**
 * Enums zgodne z diagramem UML projektu CS2 Lineups
 */

// Sposób rzutu granatu (TrowType z diagramu UML)
export const TrowType = Object.freeze({
  STAND: 0,
  JUMPTHROW: 1,
  RUN_JUMPTHROW: 2
});

// Alias dla zachowania poprawności językowej
export const ThrowType = TrowType;

// Etykiety i ikony dla typów rzutu
export const ThrowTypeLabels = Object.freeze({
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
export const Status = Object.freeze({
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2
});

export const StatusLabels = Object.freeze({
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
export const Role = Object.freeze({
  GUEST: 0,
  USER: 1,
  ADMIN: 2
});

export const RoleLabels = Object.freeze({
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
