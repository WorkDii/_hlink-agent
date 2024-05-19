"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const env_1 = require("./env");
// Create the connection pool. The pool-specific settings are the defaults
exports.pool = promise_1.default.createPool({
    host: env_1.env.JHCIS_DB_SERVER,
    user: env_1.env.JHCIS_DB_USER,
    database: env_1.env.JHCIS_DB,
    password: env_1.env.JHCIS_DB_PASSWORD,
    port: parseInt(env_1.env.JHCIS_DB_PORT),
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});
