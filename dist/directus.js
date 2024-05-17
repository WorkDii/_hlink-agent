"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.directusClient = void 0;
const sdk_1 = require("@directus/sdk");
const env_1 = require("./env");
exports.directusClient = (0, sdk_1.createDirectus)(env_1.env.HLINK_URL)
    .with((0, sdk_1.staticToken)(env_1.env.HLINK_TOKEN))
    .with((0, sdk_1.rest)());
