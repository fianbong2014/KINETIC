// Throwaway local Postgres for development — no system install needed.
// Usage: node scripts/local-db.mjs   (keep it running; Ctrl+C to stop)
// Requires: npm install --no-save embedded-postgres
// Data persists in .pgdata/ (gitignored).
import EmbeddedPostgres from "embedded-postgres";

const pg = new EmbeddedPostgres({
  databaseDir: "./.pgdata",
  user: "kinetic",
  password: "kinetic",
  port: 5432,
  persistent: true,
});

const fresh = !(await import("node:fs")).existsSync("./.pgdata/PG_VERSION");
if (fresh) await pg.initialise();
await pg.start();
if (fresh) await pg.createDatabase("kinetic");
console.log("READY postgresql://kinetic:kinetic@localhost:5432/kinetic");

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, async () => {
    await pg.stop();
    process.exit(0);
  });
}
