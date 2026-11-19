/**
 * Klasa Lineup zgodna z diagramem UML projektu CS2 Lineups
 */
import { TrowType, Status } from './enums.js';

export const BLACK_PLACEHOLDER = 'assets/images/black_placeholder.png';

export class Lineup {
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
