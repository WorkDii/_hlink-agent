"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startUpdateAdapter = void 0;
const auto_git_update_1 = __importDefault(require("auto-git-update"));
const os_1 = require("os");
const node_cron_1 = __importDefault(require("node-cron"));
const config = {
    repository: "https://github.com/WorkDii/hlink-client",
    // fromReleases: true,
    tempLocation: (0, os_1.tmpdir)(),
    // executeOnComplete: "/startTest.bat",
    exitOnComplete: true,
    branch: "main",
};
const updater = new auto_git_update_1.default(config);
function startUpdateAdapter() {
    console.log("starting update adapter", new Date());
    // will change after development phase
    node_cron_1.default.schedule("* * * * *", () => {
        console.log("refetching hlink-client update...");
        updater.autoUpdate();
    });
}
exports.startUpdateAdapter = startUpdateAdapter;
