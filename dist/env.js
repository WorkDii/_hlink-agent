"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = __importDefault(require("zod"));
const dotenv_1 = require("dotenv");
const fs_1 = require("fs");
(0, dotenv_1.config)({
    path: (0, fs_1.existsSync)(".env") ? ".env" : ".env.development",
});
const envSchema = zod_1.default.object({
    HLINK_TOKEN: zod_1.default.string(),
    HLINK_URL: zod_1.default.string(),
    PCU_CODE: zod_1.default.string().length(5),
    HCODE: zod_1.default.string().length(5),
    JHCIS_DB_SERVER: zod_1.default.string(),
    JHCIS_DB_USER: zod_1.default.string(),
    JHCIS_DB_PASSWORD: zod_1.default.string(),
    JHCIS_DB_PORT: zod_1.default.string(),
    JHCIS_DB: zod_1.default.string(),
    DRUG_SYNC_START_DATE: zod_1.default.string(),
    DRUG_SYNC_SCHEDULE: zod_1.default.string().optional(),
});
exports.env = envSchema.parse(process.env);
