import initSqlJs from 'sql.js';
import { SqlCore } from '../src/db/sqlCore';
import { DATABASES } from '../src/db/seeds';
import type { SqlBackend } from '../src/db/sqlClient';

/** Backend für Tests: derselbe SqlCore wie im Worker, nur direkt unter Node. */
export async function createNodeBackend(): Promise<SqlBackend & { core: SqlCore }> {
  const SQL = await initSqlJs();
  const core = new SqlCore(SQL);
  core.setSeeds(Object.fromEntries(Object.values(DATABASES).map((d) => [d.id, d.seedSql])));
  return {
    core,
    exec: async (k, id, sql) => core.exec(k, id, sql),
    reset: async (k) => core.reset(k),
    isolated: async (id, sql, setup, after) => core.isolated(id, sql, setup, after),
    schema: async (id) => core.schema(id),
    workingSchema: async (k, id) => core.workingSchema(k, id),
    probe: async (id, sql, probes, setup) => core.probe(id, sql, probes, setup),
  };
}
