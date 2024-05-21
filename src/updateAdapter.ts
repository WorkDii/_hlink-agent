import AutoGitUpdate from "auto-git-update";
import { tmpdir } from "os";
import corn from "node-cron";

const config = {
  repository: "https://github.com/WorkDii/hlink-client",
  // fromReleases: true,
  tempLocation: tmpdir(),
  // executeOnComplete: "/startTest.bat",
  exitOnComplete: true,
  branch: "main",
};

const updater = new AutoGitUpdate(config);

export function startUpdateAdapter() {
  console.log("starting update adapter", new Date());
  // will change after development phase
  corn.schedule("* * * * *", () => {
    console.log("refetching hlink-client update...");
    updater.autoUpdate();
  });
}
startUpdateAdapter();
