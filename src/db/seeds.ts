/**
 * Übungsdatenbanken (SQLite).
 *
 * Jede Datenbank besteht aus CREATE-TABLE-Anweisungen und Beispieldaten.
 * Die Daten enthalten absichtlich NULL-Werte, leere Zeichenketten, doppelte Werte,
 * unsaubere Texte und fehlende Zuordnungen – genau die Stolperfallen aus der Praxis.
 */

export type DbId = 'vertrieb' | 'forschung' | 'support' | 'lieferdb';

type Val = string | number | null;

/** Erzeugt INSERT-Anweisungen aus Zeilen-Arrays. */
function insert(table: string, columns: string[], rows: Val[][]): string {
  const lit = (v: Val) =>
    v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${v.replace(/'/g, "''")}'`;
  return rows
    .map((r) => `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${r.map(lit).join(', ')});`)
    .join('\n');
}

/* ------------------------------------------------------------------ */
/* A. Unternehmen und Vertrieb                                         */
/* ------------------------------------------------------------------ */

const vertriebSchema = `
CREATE TABLE mitarbeitende (
  mitarbeiter_id  INTEGER PRIMARY KEY,
  vorname         TEXT NOT NULL,
  nachname        TEXT NOT NULL,
  abteilung       TEXT NOT NULL,
  eintrittsdatum  TEXT NOT NULL,          -- Datum im Format JJJJ-MM-TT
  gehalt          REAL,
  vorgesetzter_id INTEGER REFERENCES mitarbeitende(mitarbeiter_id)
);

CREATE TABLE kunden (
  kunde_id       INTEGER PRIMARY KEY,
  vorname        TEXT NOT NULL,
  nachname       TEXT NOT NULL,
  stadt          TEXT,
  email          TEXT,
  registriert_am TEXT NOT NULL,           -- JJJJ-MM-TT
  betreuer_id    INTEGER REFERENCES mitarbeitende(mitarbeiter_id)
);

CREATE TABLE produkte (
  produkt_id   INTEGER PRIMARY KEY,
  name         TEXT NOT NULL,
  kategorie    TEXT,
  preis        REAL NOT NULL,
  lagerbestand INTEGER                    -- NULL = kein Lagerartikel (z. B. Software)
);

CREATE TABLE bestellungen (
  bestellung_id  INTEGER PRIMARY KEY,
  kunde_id       INTEGER NOT NULL REFERENCES kunden(kunde_id),
  mitarbeiter_id INTEGER REFERENCES mitarbeitende(mitarbeiter_id),
  bestelldatum   TEXT NOT NULL,           -- JJJJ-MM-TT
  status         TEXT NOT NULL,           -- offen | versendet | geliefert | storniert
  lieferdatum    TEXT                     -- NULL, solange nicht geliefert
);

CREATE TABLE bestellpositionen (
  position_id   INTEGER PRIMARY KEY,
  bestellung_id INTEGER NOT NULL REFERENCES bestellungen(bestellung_id),
  produkt_id    INTEGER NOT NULL REFERENCES produkte(produkt_id),
  menge         INTEGER NOT NULL,
  einzelpreis   REAL NOT NULL             -- Preis zum Bestellzeitpunkt
);
`;

const vertriebData = [
  insert(
    'mitarbeitende',
    ['mitarbeiter_id', 'vorname', 'nachname', 'abteilung', 'eintrittsdatum', 'gehalt', 'vorgesetzter_id'],
    [
      [1, 'Sabine', 'Keller', 'Vertrieb', '2015-03-01', 5200, null],
      [2, 'Murat', 'Yilmaz', 'Vertrieb', '2018-07-15', 4100, 1],
      [3, 'Julia', 'Brandt', 'Vertrieb', '2021-01-10', 3800, 1],
      [4, 'Thomas', 'Wagner', 'Einkauf', '2016-09-01', 4500, null],
      [5, 'Lena', 'Hoffmann', 'Marketing', '2022-04-01', 3600, null],
      [6, 'Felix', 'Braun', 'Vertrieb', '2023-10-01', 3400, 1],
    ],
  ),
  insert(
    'kunden',
    ['kunde_id', 'vorname', 'nachname', 'stadt', 'email', 'registriert_am', 'betreuer_id'],
    [
      [1, 'Anna', 'Schmidt', 'Berlin', 'anna.schmidt@example.de', '2023-01-15', 2],
      [2, 'Ben', 'Müller', 'Hamburg', 'ben.mueller@example.de', '2023-02-03', 2],
      [3, 'Clara', 'Fischer', 'München', null, '2023-02-20', 3],
      [4, 'David', 'Weber', 'Köln', 'david.weber@example.de', '2023-04-11', 2],
      [5, 'Emma', 'Schneider', 'Berlin', 'emma@example.de', '2023-05-30', 3],
      [6, 'Finn', 'Becker', 'Hamburg', '', '2023-07-07', null],
      [7, 'Greta', 'Wolf', 'berlin ', 'greta.wolf@example.de', '2023-09-12', 3],
      [8, 'Hannah', 'Schulz', 'Leipzig', null, '2024-01-08', null],
      [9, 'Ilias', 'Neumann', 'München', 'ilias.n@example.de', '2024-02-14', 2],
      [10, 'Jana', 'Krüger', 'Köln', 'jana.krueger@example.de', '2024-03-01', 3],
      [11, 'Karl', 'Zimmermann', 'Dresden', 'karl.z@example.de', '2024-05-19', 2],
      [12, 'Lea', 'Hartmann', 'Hamburg', 'lea.h@example.de', '2024-06-02', null],
    ],
  ),
  insert(
    'produkte',
    ['produkt_id', 'name', 'kategorie', 'preis', 'lagerbestand'],
    [
      [1, 'Laptop Pro 14', 'Hardware', 1299.0, 8],
      [2, 'Laptop Basic 15', 'Hardware', 749.0, 15],
      [3, 'Monitor 27 Zoll', 'Hardware', 289.9, 22],
      [4, 'Tastatur kabellos', 'Zubehör', 49.9, 60],
      [5, 'Maus ergonomisch', 'Zubehör', 34.5, 75],
      [6, 'USB-C Dockingstation', 'Zubehör', 129.0, 0],
      [7, 'Office-Paket Jahreslizenz', 'Software', 99.0, null],
      [8, 'Antivirus Plus', 'Software', 39.9, null],
      [9, 'Headset Komfort', 'Zubehör', 79.0, 12],
      [10, 'Webcam HD', 'Zubehör', 59.0, 5],
      [11, 'Schulung SQL Grundlagen', 'Dienstleistung', 450.0, null],
      [12, 'Druckerpapier A4 (500 Blatt)', null, 5.99, 200],
    ],
  ),
  insert(
    'bestellungen',
    ['bestellung_id', 'kunde_id', 'mitarbeiter_id', 'bestelldatum', 'status', 'lieferdatum'],
    [
      [1, 1, 2, '2024-01-10', 'geliefert', '2024-01-13'],
      [2, 2, 2, '2024-01-22', 'geliefert', '2024-01-26'],
      [3, 1, 3, '2024-02-05', 'geliefert', '2024-02-08'],
      [4, 3, 3, '2024-02-14', 'geliefert', '2024-02-20'],
      [5, 4, 2, '2024-02-28', 'geliefert', '2024-03-04'],
      [6, 5, 3, '2024-03-03', 'geliefert', '2024-03-06'],
      [7, 6, null, '2024-03-15', 'storniert', null],
      [8, 7, 3, '2024-03-29', 'geliefert', '2024-04-03'],
      [9, 2, 2, '2024-04-09', 'geliefert', '2024-04-12'],
      [10, 9, 2, '2024-04-21', 'geliefert', '2024-04-25'],
      [11, 1, 2, '2024-05-06', 'geliefert', '2024-05-09'],
      [12, 10, 3, '2024-05-18', 'versendet', null],
      [13, 4, null, '2024-05-27', 'geliefert', '2024-06-03'],
      [14, 5, 3, '2024-06-02', 'versendet', null],
      [15, 9, 2, '2024-06-11', 'offen', null],
      [16, 3, 3, '2024-06-14', 'offen', null],
      [17, 1, 2, '2024-06-20', 'storniert', null],
      [18, 2, 1, '2024-06-25', 'offen', null],
    ],
  ),
  insert(
    'bestellpositionen',
    ['position_id', 'bestellung_id', 'produkt_id', 'menge', 'einzelpreis'],
    [
      [1, 1, 1, 1, 1299.0],
      [2, 1, 5, 2, 34.5],
      [3, 2, 3, 2, 289.9],
      [4, 2, 4, 1, 49.9],
      [5, 3, 7, 1, 99.0],
      [6, 4, 2, 1, 749.0],
      [7, 4, 5, 1, 34.5],
      [8, 4, 8, 1, 39.9],
      [9, 5, 6, 1, 129.0],
      [10, 5, 9, 2, 79.0],
      [11, 6, 1, 1, 1249.0],
      [12, 6, 3, 1, 289.9],
      [13, 7, 2, 1, 749.0],
      [14, 8, 4, 3, 49.9],
      [15, 9, 11, 2, 450.0],
      [16, 10, 3, 1, 279.0],
      [17, 10, 4, 1, 49.9],
      [18, 10, 5, 1, 34.5],
      [19, 11, 9, 1, 79.0],
      [20, 11, 7, 3, 99.0],
      [21, 12, 2, 1, 749.0],
      [22, 13, 1, 2, 1299.0],
      [23, 13, 6, 2, 129.0],
      [24, 14, 4, 1, 49.9],
      [25, 14, 5, 1, 34.5],
      [26, 15, 8, 5, 39.9],
      [27, 16, 11, 1, 450.0],
      [28, 17, 3, 1, 289.9],
      [29, 18, 9, 1, 79.0],
      [30, 18, 4, 2, 49.9],
    ],
  ),
].join('\n');

/* ------------------------------------------------------------------ */
/* B. Forschung und Geodaten                                           */
/* ------------------------------------------------------------------ */

const forschungSchema = `
CREATE TABLE inseln (
  insel_id     INTEGER PRIMARY KEY,
  name         TEXT NOT NULL,
  region       TEXT NOT NULL,             -- Nordsee | Ostsee
  flaeche_km2  REAL,
  breitengrad  REAL,                      -- Dezimalgrad (WGS84), Nord positiv
  laengengrad  REAL                       -- Dezimalgrad (WGS84), Ost positiv
);

CREATE TABLE stationen (
  station_id  INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  insel_id    INTEGER NOT NULL REFERENCES inseln(insel_id),
  gegruendet  INTEGER,                    -- Gründungsjahr
  hoehe_m     REAL,                       -- Höhe über Normalnull
  aktiv       INTEGER NOT NULL            -- 1 = aktiv, 0 = stillgelegt
);

CREATE TABLE forschende (
  forscher_id INTEGER PRIMARY KEY,
  vorname     TEXT NOT NULL,
  nachname    TEXT NOT NULL,
  fachgebiet  TEXT NOT NULL,
  email       TEXT,
  station_id  INTEGER REFERENCES stationen(station_id)   -- Heimatstation, NULL = keine
);

CREATE TABLE beobachtungen (
  beobachtung_id INTEGER PRIMARY KEY,
  station_id     INTEGER NOT NULL REFERENCES stationen(station_id),
  forscher_id    INTEGER REFERENCES forschende(forscher_id), -- NULL = nicht erfasst
  datum          TEXT NOT NULL,           -- JJJJ-MM-TT
  art            TEXT NOT NULL,           -- beobachtete Tier- oder Pflanzenart
  anzahl         INTEGER,                 -- NULL = nicht gezählt
  notiz          TEXT
);

CREATE TABLE messwerte (
  messwert_id INTEGER PRIMARY KEY,
  station_id  INTEGER NOT NULL REFERENCES stationen(station_id),
  zeitpunkt   TEXT NOT NULL,              -- JJJJ-MM-TT HH:MM
  messgroesse TEXT NOT NULL,              -- Lufttemperatur | Windgeschwindigkeit | Niederschlag
  wert        REAL,                       -- NULL = Sensorausfall
  einheit     TEXT NOT NULL
);
`;

const forschungData = [
  insert(
    'inseln',
    ['insel_id', 'name', 'region', 'flaeche_km2', 'breitengrad', 'laengengrad'],
    [
      [1, 'Helgoland', 'Nordsee', 1.7, 54.18, 7.89],
      [2, 'Sylt', 'Nordsee', 99.1, 54.91, 8.32],
      [3, 'Rügen', 'Ostsee', 926.4, 54.43, 13.43],
      [4, 'Fehmarn', 'Ostsee', 185.4, 54.47, 11.13],
      [5, 'Amrum', 'Nordsee', 20.5, 54.65, 8.35],
      [6, 'Hiddensee', 'Ostsee', 18.6, 54.55, 13.1],
      [7, 'Spiekeroog', 'Nordsee', 18.3, 53.77, 7.71],
      [8, 'Neuwerk', 'Nordsee', 3.0, 53.92, 8.5],
    ],
  ),
  insert(
    'stationen',
    ['station_id', 'name', 'insel_id', 'gegruendet', 'hoehe_m', 'aktiv'],
    [
      [1, 'Station Lange Anna', 1, 1992, 40, 1],
      [2, 'Vogelwarte Helgoland', 1, 1910, 5, 1],
      [3, 'Wattstation List', 2, 1988, 3, 1],
      [4, 'Küstenlabor Kap Arkona', 3, 2004, 45, 1],
      [5, 'Boddenstation Ralswiek', 3, 2011, 8, 0],
      [6, 'Messpunkt Fehmarnsund', 4, 2015, 2, 1],
      [7, 'Dünenstation Amrum', 5, 2019, 12, 1],
      [8, 'Biologische Station Vitte', 6, 1997, null, 1],
    ],
  ),
  insert(
    'forschende',
    ['forscher_id', 'vorname', 'nachname', 'fachgebiet', 'email', 'station_id'],
    [
      [1, 'Mara', 'Jensen', 'Ornithologie', 'm.jensen@meeresinstitut.de', 2],
      [2, 'Paul', 'Hansen', 'Ornithologie', null, 2],
      [3, 'Svenja', 'Petersen', 'Meeresbiologie', 's.petersen@meeresinstitut.de', 3],
      [4, 'Jonas', 'Lorenz', 'Klimatologie', 'j.lorenz@meeresinstitut.de', 4],
      [5, 'Aylin', 'Demir', 'Meeresbiologie', 'a.demir@meeresinstitut.de', 6],
      [6, 'Tim', 'Albers', 'Ornithologie', 't.albers@meeresinstitut.de', 7],
      [7, 'Ronja', 'Weiß', 'Botanik', '', 8],
      [8, 'Nils', 'Carstens', 'Klimatologie', 'n.carstens@meeresinstitut.de', null],
      [9, 'Ida', 'Vogt', 'Botanik', 'i.vogt@meeresinstitut.de', null],
    ],
  ),
  insert(
    'beobachtungen',
    ['beobachtung_id', 'station_id', 'forscher_id', 'datum', 'art', 'anzahl', 'notiz'],
    [
      [1, 2, 1, '2024-03-02', 'Basstölpel', 120, null],
      [2, 2, 1, '2024-03-02', 'Trottellumme', 340, 'Brutfelsen'],
      [3, 1, 2, '2024-03-15', 'Kegelrobbe', 45, null],
      [4, 2, 2, '2024-04-01', 'Basstölpel', 150, null],
      [5, 3, 3, '2024-04-03', 'Seehund', 62, 'Sandbank'],
      [6, 3, 3, '2024-04-03', 'Austernfischer', 18, null],
      [7, 4, 4, '2024-04-10', 'Eiderente', 25, null],
      [8, 6, 5, '2024-04-12', 'Schweinswal', 3, 'Sichtung vom Boot'],
      [9, 7, 6, '2024-04-20', 'Austernfischer', 30, null],
      [10, 2, 1, '2024-05-05', 'Basstölpel', 180, null],
      [11, 1, 2, '2024-05-06', 'Kegelrobbe', 52, null],
      [12, 3, 3, '2024-05-10', 'Seehund', 70, null],
      [13, 8, 7, '2024-05-12', 'Strandhafer', null, 'Bestand flächig, nicht gezählt'],
      [14, 7, 6, '2024-05-21', 'Eiderente', 14, null],
      [15, 6, 5, '2024-06-01', 'Schweinswal', 5, null],
      [16, 2, 1, '2024-06-03', 'Trottellumme', 410, null],
      [17, 4, null, '2024-06-08', 'Eiderente', 31, 'Forscher nicht erfasst'],
      [18, 3, 3, '2024-06-15', 'Kegelrobbe', 9, null],
      [19, 1, 1, '2024-06-20', 'Basstölpel', 95, null],
      [20, 7, 6, '2024-07-02', 'Austernfischer', 26, null],
      [21, 2, 2, '2024-07-04', 'Basstölpel', 160, null],
      [22, 8, 7, '2024-07-15', 'Strandhafer', null, null],
      [23, 6, 5, '2024-07-20', 'Seehund', 12, null],
      [24, 3, 8, '2024-08-01', 'Seehund', 66, null],
    ],
  ),
  insert(
    'messwerte',
    ['messwert_id', 'station_id', 'zeitpunkt', 'messgroesse', 'wert', 'einheit'],
    [
      [1, 1, '2024-06-01 12:00', 'Lufttemperatur', 16.4, '°C'],
      [2, 1, '2024-06-01 12:00', 'Windgeschwindigkeit', 9.8, 'm/s'],
      [3, 2, '2024-06-01 12:00', 'Lufttemperatur', 16.1, '°C'],
      [4, 3, '2024-06-01 12:00', 'Lufttemperatur', 18.2, '°C'],
      [5, 3, '2024-06-01 12:00', 'Windgeschwindigkeit', 7.5, 'm/s'],
      [6, 4, '2024-06-01 12:00', 'Lufttemperatur', 19.0, '°C'],
      [7, 6, '2024-06-01 12:00', 'Lufttemperatur', 18.7, '°C'],
      [8, 7, '2024-06-01 12:00', 'Lufttemperatur', 17.5, '°C'],
      [9, 1, '2024-06-15 12:00', 'Lufttemperatur', 19.3, '°C'],
      [10, 1, '2024-06-15 12:00', 'Windgeschwindigkeit', 14.2, 'm/s'],
      [11, 2, '2024-06-15 12:00', 'Lufttemperatur', 18.8, '°C'],
      [12, 3, '2024-06-15 12:00', 'Lufttemperatur', 21.4, '°C'],
      [13, 3, '2024-06-15 12:00', 'Windgeschwindigkeit', 11.0, 'm/s'],
      [14, 4, '2024-06-15 12:00', 'Lufttemperatur', 22.6, '°C'],
      [15, 4, '2024-06-15 12:00', 'Windgeschwindigkeit', 6.1, 'm/s'],
      [16, 6, '2024-06-15 12:00', 'Lufttemperatur', 21.9, '°C'],
      [17, 7, '2024-06-15 12:00', 'Lufttemperatur', null, '°C'],
      [18, 8, '2024-06-15 12:00', 'Lufttemperatur', 22.1, '°C'],
      [19, 1, '2024-07-01 12:00', 'Lufttemperatur', 20.5, '°C'],
      [20, 3, '2024-07-01 12:00', 'Lufttemperatur', 23.8, '°C'],
      [21, 4, '2024-07-01 12:00', 'Lufttemperatur', 24.9, '°C'],
      [22, 6, '2024-07-01 12:00', 'Windgeschwindigkeit', 15.3, 'm/s'],
      [23, 7, '2024-07-01 12:00', 'Windgeschwindigkeit', 12.7, 'm/s'],
      [24, 8, '2024-07-01 12:00', 'Lufttemperatur', 23.1, '°C'],
      [25, 3, '2024-07-01 12:00', 'Niederschlag', 4.2, 'mm'],
      [26, 4, '2024-07-01 12:00', 'Niederschlag', 0.0, 'mm'],
    ],
  ),
].join('\n');

/* ------------------------------------------------------------------ */
/* C. Prozesse und Support                                             */
/* ------------------------------------------------------------------ */

const supportSchema = `
CREATE TABLE kategorien (
  kategorie_id INTEGER PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  ziel_stunden INTEGER NOT NULL           -- Zielzeit (SLA) bis zur Lösung in Stunden
);

CREATE TABLE bearbeitende (
  bearbeiter_id INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  team          TEXT NOT NULL,
  aktiv         INTEGER NOT NULL          -- 1 = aktiv, 0 = ausgeschieden
);

CREATE TABLE tickets (
  ticket_id     INTEGER PRIMARY KEY,
  titel         TEXT NOT NULL,
  kategorie_id  INTEGER REFERENCES kategorien(kategorie_id),     -- NULL = nicht kategorisiert
  bearbeiter_id INTEGER REFERENCES bearbeitende(bearbeiter_id),  -- NULL = noch niemand zugewiesen
  prioritaet    TEXT NOT NULL,            -- niedrig | mittel | hoch
  status        TEXT NOT NULL,            -- offen | in Bearbeitung | gelöst | geschlossen
  erstellt_am   TEXT NOT NULL,            -- JJJJ-MM-TT HH:MM
  geloest_am    TEXT                      -- NULL = noch nicht gelöst
);

CREATE TABLE statusereignisse (
  ereignis_id   INTEGER PRIMARY KEY,
  ticket_id     INTEGER NOT NULL REFERENCES tickets(ticket_id),
  status        TEXT NOT NULL,
  zeitpunkt     TEXT NOT NULL,            -- JJJJ-MM-TT HH:MM
  bearbeiter_id INTEGER REFERENCES bearbeitende(bearbeiter_id)
);
`;

const supportData = [
  insert(
    'kategorien',
    ['kategorie_id', 'name', 'ziel_stunden'],
    [
      [1, 'Hardware', 48],
      [2, 'Software', 24],
      [3, 'Netzwerk', 8],
      [4, 'Zugang & Konten', 4],
      [5, 'Sonstiges', 72],
    ],
  ),
  insert(
    'bearbeitende',
    ['bearbeiter_id', 'name', 'team', 'aktiv'],
    [
      [1, 'Kim Richter', '1st Level', 1],
      [2, 'Ole Brandt', '1st Level', 1],
      [3, 'Mia Schwarz', '2nd Level', 1],
      [4, 'Deniz Kaya', '2nd Level', 1],
      [5, 'Lars Engel', '2nd Level', 0],
    ],
  ),
  insert(
    'tickets',
    ['ticket_id', 'titel', 'kategorie_id', 'bearbeiter_id', 'prioritaet', 'status', 'erstellt_am', 'geloest_am'],
    [
      [1, 'Drucker druckt nicht', 1, 1, 'mittel', 'geschlossen', '2024-09-02 08:15', '2024-09-02 15:45'],
      [2, 'VPN-Verbindung bricht ab', 3, 3, 'hoch', 'geschlossen', '2024-09-02 09:30', '2024-09-03 11:30'],
      [3, 'Passwort zurücksetzen', 4, 2, 'mittel', 'geschlossen', '2024-09-03 07:50', '2024-09-03 08:20'],
      [4, 'Excel stürzt beim Start ab', 2, 4, 'mittel', 'gelöst', '2024-09-04 10:00', '2024-09-05 16:00'],
      [5, 'Neuer Laptop für Mitarbeiterin', 1, 1, 'niedrig', 'geschlossen', '2024-09-05 13:00', '2024-09-10 13:00'],
      [6, 'WLAN im 3. OG langsam', 3, 3, 'mittel', 'gelöst', '2024-09-09 09:00', '2024-09-09 21:00'],
      [7, 'Zugang zum CRM fehlt', 4, 2, 'hoch', 'geschlossen', '2024-09-10 08:00', '2024-09-10 10:30'],
      [8, 'Monitor flackert', 1, null, 'niedrig', 'offen', '2024-09-12 14:20', null],
      [9, 'Lizenz für Grafiksoftware', 2, 4, 'niedrig', 'in Bearbeitung', '2024-09-16 11:00', null],
      [10, 'E-Mail-Postfach voll', 2, 1, 'mittel', 'gelöst', '2024-09-17 08:30', '2024-09-17 12:30'],
      [11, 'Server nicht erreichbar', 3, 3, 'hoch', 'gelöst', '2024-09-18 06:45', '2024-09-18 09:15'],
      [12, 'Headset ohne Ton', 1, 2, 'niedrig', 'gelöst', '2024-09-19 10:10', '2024-09-23 10:10'],
      [13, 'Konto gesperrt', 4, 1, 'hoch', 'gelöst', '2024-09-23 07:30', '2024-09-23 13:30'],
      [14, 'Software-Update schlägt fehl', 2, 3, 'mittel', 'in Bearbeitung', '2024-09-25 15:00', null],
      [15, 'Anfrage ohne Kategorie', null, null, 'niedrig', 'offen', '2024-09-26 09:00', null],
      [16, 'Netzwerkdrucker offline', 3, 4, 'mittel', 'gelöst', '2024-09-27 08:00', '2024-09-27 18:00'],
      [17, 'Teams-Anrufe brechen ab', 2, 4, 'hoch', 'offen', '2024-09-30 16:00', null],
      [18, 'Tastatur defekt', 1, 2, 'niedrig', 'geschlossen', '2024-10-01 09:00', '2024-10-02 09:00'],
    ],
  ),
  insert(
    'statusereignisse',
    ['ereignis_id', 'ticket_id', 'status', 'zeitpunkt', 'bearbeiter_id'],
    [
      [1, 1, 'offen', '2024-09-02 08:15', null],
      [2, 1, 'in Bearbeitung', '2024-09-02 08:40', 1],
      [3, 1, 'gelöst', '2024-09-02 15:45', 1],
      [4, 1, 'geschlossen', '2024-09-03 09:00', 1],
      [5, 2, 'offen', '2024-09-02 09:30', null],
      [6, 2, 'in Bearbeitung', '2024-09-02 10:15', 3],
      [7, 2, 'gelöst', '2024-09-03 11:30', 3],
      [8, 2, 'geschlossen', '2024-09-04 08:00', 3],
      [9, 3, 'offen', '2024-09-03 07:50', null],
      [10, 3, 'gelöst', '2024-09-03 08:20', 2],
      [11, 3, 'geschlossen', '2024-09-03 12:00', 2],
      [12, 4, 'offen', '2024-09-04 10:00', null],
      [13, 4, 'in Bearbeitung', '2024-09-04 13:00', 4],
      [14, 4, 'gelöst', '2024-09-05 16:00', 4],
      [15, 5, 'offen', '2024-09-05 13:00', null],
      [16, 5, 'in Bearbeitung', '2024-09-06 09:00', 1],
      [17, 5, 'gelöst', '2024-09-10 13:00', 1],
      [18, 5, 'geschlossen', '2024-09-11 10:00', 1],
      [19, 6, 'offen', '2024-09-09 09:00', null],
      [20, 6, 'gelöst', '2024-09-09 21:00', 3],
      [21, 7, 'offen', '2024-09-10 08:00', null],
      [22, 7, 'gelöst', '2024-09-10 10:30', 2],
      [23, 7, 'geschlossen', '2024-09-10 16:00', 2],
      [24, 8, 'offen', '2024-09-12 14:20', null],
      [25, 9, 'offen', '2024-09-16 11:00', null],
      [26, 9, 'in Bearbeitung', '2024-09-17 09:30', 4],
      [27, 10, 'offen', '2024-09-17 08:30', null],
      [28, 10, 'gelöst', '2024-09-17 12:30', 1],
      [29, 11, 'offen', '2024-09-18 06:45', null],
      [30, 11, 'in Bearbeitung', '2024-09-18 07:00', 3],
      [31, 11, 'gelöst', '2024-09-18 09:15', 3],
      [32, 12, 'offen', '2024-09-19 10:10', null],
      [33, 12, 'gelöst', '2024-09-23 10:10', 2],
      [34, 13, 'offen', '2024-09-23 07:30', null],
      [35, 13, 'gelöst', '2024-09-23 13:30', 1],
      [36, 14, 'offen', '2024-09-25 15:00', null],
      [37, 14, 'in Bearbeitung', '2024-09-26 08:00', 3],
      [38, 15, 'offen', '2024-09-26 09:00', null],
      [39, 16, 'offen', '2024-09-27 08:00', null],
      [40, 16, 'in Bearbeitung', '2024-09-27 08:30', 4],
      [41, 16, 'gelöst', '2024-09-27 18:00', 4],
      [42, 17, 'offen', '2024-09-30 16:00', null],
      [43, 18, 'offen', '2024-10-01 09:00', null],
      [44, 18, 'gelöst', '2024-10-02 09:00', 2],
      [45, 18, 'geschlossen', '2024-10-02 11:00', 2],
    ],
  ),
].join('\n');

/* ------------------------------------------------------------------ */
/* D. Lieferdatenbank des E.I.S. (Unterricht, Einsatz 512-003/-004)     */
/* Stand nach Einsatz 512-003: Lieferung 5 (MS FIG 512) ohne Positionen */
/* ------------------------------------------------------------------ */

const lieferdbSchema = `
CREATE TABLE schiffe (
  schiff_id INTEGER PRIMARY KEY,
  name      TEXT    NOT NULL UNIQUE,
  flagge    TEXT    NOT NULL CHECK (length(flagge) = 2),
  kapitaen  TEXT
) STRICT;

CREATE TABLE stationen (
  station_id INTEGER PRIMARY KEY,
  name       TEXT    NOT NULL UNIQUE,
  region     TEXT    NOT NULL
) STRICT;

CREATE TABLE waren (
  ware_id     INTEGER PRIMARY KEY,
  bezeichnung TEXT    NOT NULL UNIQUE,
  einheit     TEXT    NOT NULL DEFAULT 'kg'
                      CHECK (einheit IN ('kg', 'Liter', 'Stück'))
) STRICT;

CREATE TABLE lieferungen (
  lieferung_id INTEGER PRIMARY KEY,
  ankunft      TEXT    NOT NULL CHECK (ankunft LIKE '____-__-__'),
  schiff_id    INTEGER NOT NULL REFERENCES schiffe(schiff_id),
  station_id   INTEGER NOT NULL REFERENCES stationen(station_id)
) STRICT;

CREATE TABLE positionen (
  lieferung_id INTEGER NOT NULL REFERENCES lieferungen(lieferung_id),
  ware_id      INTEGER NOT NULL REFERENCES waren(ware_id),
  menge_kisten INTEGER NOT NULL CHECK (menge_kisten > 0),
  PRIMARY KEY (lieferung_id, ware_id)
) STRICT;

CREATE INDEX idx_positionen_ware ON positionen(ware_id);
`;

const lieferdbData = [
  insert(
    'schiffe',
    ['schiff_id', 'name', 'flagge', 'kapitaen'],
    [
      [1, 'MS Albatros', 'DE', 'Imke Harms'],
      [2, 'MS Estrella Austral', 'CL', 'Ana Riquelme'],
      [3, 'MS FIG 512', 'NO', 'Oddvar Hvalross'],
    ],
  ),
  insert(
    'stationen',
    ['station_id', 'name', 'region'],
    [
      [1, 'Station CBW', 'Palmer-Archipel'],
      [2, 'Station Eisvogel', 'Weddellmeer'],
      [3, 'Station Sturmvogel', 'Rossmeer'],
    ],
  ),
  insert(
    'waren',
    ['ware_id', 'bezeichnung', 'einheit'],
    [
      [1, 'Diesel', 'Liter'],
      [2, 'Mehl', 'kg'],
      [3, 'Kaffee', 'kg'],
      [4, 'Tiefkühlware', 'kg'],
      [5, 'Ersatzteile', 'Stück'],
    ],
  ),
  insert(
    'lieferungen',
    ['lieferung_id', 'ankunft', 'schiff_id', 'station_id'],
    [
      [1, '2025-11-20', 1, 1],
      [2, '2025-12-02', 2, 3],
      [3, '2025-12-18', 1, 2],
      [4, '2026-01-14', 2, 1],
      [5, '2026-02-03', 3, 1],
      [6, '2026-02-26', 1, 1],
    ],
  ),
  insert(
    'positionen',
    ['lieferung_id', 'ware_id', 'menge_kisten'],
    [
      [1, 1, 40], [1, 2, 12], [1, 3, 6],
      [2, 1, 55], [2, 4, 20],
      [3, 1, 30], [3, 2, 8], [3, 5, 4],
      [4, 2, 10], [4, 3, 4], [4, 4, 15],
      [6, 1, 35], [6, 3, 5], [6, 5, 2],
    ],
  ),
].join('\n');

export interface DatabaseInfo {
  id: DbId;
  title: string;
  description: string;
  seedSql: string;
  /** Kurze fachliche Beschreibung je Tabelle (Spalten kommen live aus der Datenbank). */
  tableDescriptions: Record<string, string>;
}

export const DATABASES: Record<DbId, DatabaseInfo> = {
  vertrieb: {
    id: 'vertrieb',
    title: 'Unternehmen & Vertrieb',
    description: 'Kunden, Bestellungen, Bestellpositionen, Produkte und Mitarbeitende eines kleinen IT-Händlers.',
    seedSql: vertriebSchema + vertriebData,
    tableDescriptions: {
      kunden: 'Kundinnen und Kunden. email kann NULL oder leer sein, stadt ist nicht immer sauber erfasst.',
      bestellungen: 'Eine Zeile pro Bestellung. lieferdatum ist NULL, solange nicht geliefert wurde.',
      bestellpositionen: 'Eine Zeile pro Produkt in einer Bestellung (Menge und Preis zum Bestellzeitpunkt).',
      produkte: 'Produktkatalog. lagerbestand NULL = kein Lagerartikel.',
      mitarbeitende: 'Beschäftigte. vorgesetzter_id verweist auf dieselbe Tabelle.',
    },
  },
  forschung: {
    id: 'forschung',
    title: 'Forschung & Geodaten',
    description: 'Inseln in Nord- und Ostsee, Forschungsstationen, Forschende, Beobachtungen und Messwerte.',
    seedSql: forschungSchema + forschungData,
    tableDescriptions: {
      inseln: 'Inseln mit Region, Fläche und Koordinaten (Dezimalgrad).',
      stationen: 'Forschungsstationen; jede Station liegt auf genau einer Insel.',
      forschende: 'Forschende mit Heimatstation (NULL = keine feste Station).',
      beobachtungen: 'Tier- und Pflanzensichtungen. anzahl NULL = nicht gezählt.',
      messwerte: 'Messungen je Station und Zeitpunkt. wert NULL = Sensorausfall.',
    },
  },
  support: {
    id: 'support',
    title: 'Prozesse & Support',
    description: 'IT-Support-Tickets mit Kategorien, Bearbeitenden und Statusverlauf.',
    seedSql: supportSchema + supportData,
    tableDescriptions: {
      tickets: 'Support-Anfragen. geloest_am NULL = noch nicht gelöst.',
      kategorien: 'Ticket-Kategorien mit Zielzeit (ziel_stunden) bis zur Lösung.',
      bearbeitende: 'Personen im Support-Team.',
      statusereignisse: 'Protokoll jeder Statusänderung eines Tickets.',
    },
  },
  lieferdb: {
    id: 'lieferdb',
    title: 'Lieferdatenbank (E.I.S.)',
    description:
      'Versorgungslieferungen an antarktische Stationen aus dem Unterricht (Einsatz 512-003/-004). STRICT-Tabellen mit Constraints; Lieferung 5 der MS FIG 512 hat noch keine Positionen.',
    seedSql: lieferdbSchema + lieferdbData,
    tableDescriptions: {
      schiffe: 'Schiffe mit Flagge (Länderkürzel) und Kapitän/in (optional).',
      stationen: 'Forschungsstationen mit Region.',
      waren: 'Warenstamm. einheit: kg, Liter oder Stück (Standard kg).',
      lieferungen: 'Eine Zeile pro Lieferung: Ankunft, Schiff, Station.',
      positionen: 'Zwischentabelle Lieferung ↔ Ware mit Menge in Kisten. Schlüssel: (lieferung_id, ware_id).',
    },
  },
};

export const DB_IDS: DbId[] = ['vertrieb', 'forschung', 'support', 'lieferdb'];
