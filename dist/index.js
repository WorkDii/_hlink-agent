"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_server_1 = require("@hono/node-server");
const hono_1 = require("hono");
const sync_visitdrug_1 = require("./sync_visitdrug");
const app = new hono_1.Hono();
app.get("/", (c) => {
    return c.json({ message: "Hello World 3" });
});
(0, node_server_1.serve)({
    fetch: app.fetch,
    port: 8989,
});
(0, sync_visitdrug_1.startSync)();
