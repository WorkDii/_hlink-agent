import mysql from "mysql2/promise";
import { env } from "./env";

// Create the connection pool. The pool-specific settings are the defaults
export const pool = mysql.createPool({
  host: env.data?.JHCIS_DB_SERVER,
  user: env.data?.JHCIS_DB_USER,
  database: env.data?.JHCIS_DB,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});
