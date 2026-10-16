/**
 * Hilfsskript für Autorinnen und Autoren: führt SQL auf einer frischen Übungsdatenbank aus.
 * Nützlich, um beim Schreiben neuer Aufgaben die erwarteten Ergebnisse zu sehen.
 *
 *   npx vite-node scripts/abfrage.ts vertrieb "SELECT * FROM kunden"
 */
import initSqlJs from 'sql.js';
import { SqlCore } from '../src/db/sqlCore';
import { DATABASES } from '../src/db/seeds';

const SQL = await initSqlJs();
const core = new SqlCore(SQL);
core.setSeeds(Object.fromEntries(Object.values(DATABASES).map((d) => [d.id, d.seedSql])));
const [db, ...queries] = process.argv.slice(2);
if (!db || !(db in DATABASES) || queries.length === 0) {
  console.log('Aufruf: npx vite-node scripts/abfrage.ts <vertrieb|forschung|support> "<SQL>" ["<SQL>" …]');
  process.exit(1);
}
for (const q of queries) {
  const r = core.isolated(db, q).main;
  console.log(`\n>> ${q}`);
  if (!r.ok) console.log('FEHLER:', r.error);
  else for (const rs of r.results) console.table(rs.rows.map((row) => Object.fromEntries(rs.columns.map((c, i) => [c, row[i]]))));
}
