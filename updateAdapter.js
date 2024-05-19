import AutoGitUpdate from "auto-git-update";
import {tmpdir} from 'os';

const config = {
  repository: "https://github.com/WorkDii/hlink-client",
  // fromReleases: true,
  tempLocation: tmpdir(),
  // executeOnComplete:
  //   "/startTest.bat",
  exitOnComplete: true,
  branch: 'main',
};

const updater = new AutoGitUpdate(config);

updater.autoUpdate();