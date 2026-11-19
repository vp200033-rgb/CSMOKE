/**
 * Klasa Mapa zgodna z diagramem UML
 */

export class Mapa {
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
