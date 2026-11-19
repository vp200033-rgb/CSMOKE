/**
 * Baza zweryfikowanych lineupów granatów dymnych dla CS2
 * 
 * Zgodnie z poleceniem:
 * - Znajdują się tu wyłącznie rzuty, do których dostarczono autentyczne zrzuty ekranu z gry
 * - Usunięto strzałki i wpisy, dla których nie ma jeszcze dostarczonych zrzutów z gry
 * - Kolejne lineupy można dodawać przez formularz lub wrzucając kolejne screeny do folderu mapy
 */
import { TrowType, Status } from '../models/enums.js';
import { BLACK_PLACEHOLDER } from '../models/Lineup.js';

export const SEED_LINEUPS = [
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
