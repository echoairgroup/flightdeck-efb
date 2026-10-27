import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1") ? false : { rejectUnauthorized: false },
      max: Number(process.env.PG_POOL_SIZE || 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    })
  : null;

export async function initDb() {
  if (!pool) {
    console.warn("DATABASE_URL is not set. Cloud accounts and sync are unavailable.");
    return false;
  }

  await pool.query(
    "CREATE TABLE IF NOT EXISTS users (" +
    "id BIGSERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE, display_name TEXT, " +
    "password_hash TEXT NOT NULL, preferences JSONB NOT NULL DEFAULT '{}'::jsonb, " +
    "scratchpad TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())"
  );
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb");
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS scratchpad TEXT NOT NULL DEFAULT ''");

  await pool.query(
    "CREATE TABLE IF NOT EXISTS flights (" +
    "id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, " +
    "flight TEXT, dep TEXT, arr TEXT, aircraft TEXT, duration TEXT, notes TEXT, flight_date DATE, " +
    "distance_nm NUMERIC, source TEXT NOT NULL DEFAULT 'manual', simbrief_id TEXT, " +
    "created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())"
  );
  await pool.query("ALTER TABLE flights ADD COLUMN IF NOT EXISTS flight_date DATE");
  await pool.query("ALTER TABLE flights ADD COLUMN IF NOT EXISTS distance_nm NUMERIC");
  await pool.query("ALTER TABLE flights ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'");
  await pool.query("ALTER TABLE flights ADD COLUMN IF NOT EXISTS simbrief_id TEXT");
  await pool.query("CREATE INDEX IF NOT EXISTS flights_user_created_idx ON flights(user_id, created_at DESC)");

  await pool.query(
    "CREATE TABLE IF NOT EXISTS flight_plans (" +
    "id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT, " +
    "source TEXT NOT NULL DEFAULT 'SimBrief', simbrief_id TEXT, flight_number TEXT, dep TEXT, arr TEXT, " +
    "aircraft TEXT, flight_date DATE, etd TEXT, ete INTEGER, distance_nm NUMERIC, cruise_altitude TEXT, " +
    "fuel TEXT, route TEXT, raw_data JSONB NOT NULL DEFAULT '{}'::jsonb, " +
    "created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())"
  );
  await pool.query("CREATE INDEX IF NOT EXISTS flight_plans_user_created_idx ON flight_plans(user_id, created_at DESC)");

  await pool.query(
    "CREATE TABLE IF NOT EXISTS bridge_pairings (" +
    "id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, " +
    "code_hash TEXT UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ, " +
    "created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())"
  );
  await pool.query("CREATE INDEX IF NOT EXISTS bridge_pairings_user_created_idx ON bridge_pairings(user_id, created_at DESC)");

  await pool.query(
    "CREATE TABLE IF NOT EXISTS bridge_devices (" +
    "id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, " +
    "token_hash TEXT UNIQUE NOT NULL, name TEXT NOT NULL DEFAULT 'FlightDeck MSFS Companion', " +
    "last_seen_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())"
  );
  await pool.query("CREATE INDEX IF NOT EXISTS bridge_devices_user_idx ON bridge_devices(user_id, revoked_at)");

  await pool.query(
    "CREATE TABLE IF NOT EXISTS telemetry_snapshots (" +
    "user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, " +
    "device_id BIGINT REFERENCES bridge_devices(id) ON DELETE SET NULL, payload JSONB NOT NULL, " +
    "updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())"
  );
  return true;
}

export async function query(sql, params = []) {
  if (!pool) throw new Error("Cloud database is not configured. Add DATABASE_URL to the server environment.");
  return pool.query(sql, params);
}
