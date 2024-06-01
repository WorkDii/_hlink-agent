var rimraf = require("rimraf");
const join = require('path').join;

function execShellCommand(cmd) {
  const exec = require('child_process').exec;
  return new Promise((resolve, reject) => {
   exec(cmd, (error, stdout, stderr) => {
    if (error) {
     console.warn(error);
     }
    resolve(stdout? stdout : stderr);
   });
  });
 }
async function main(params) {
  const rootProject = process.cwd()
  rimraf.sync(join(rootProject, 'dist'));
  console.log('remove dist');
  rimraf.sync(join(rootProject,'out'));
  console.log('remove out');
  await execShellCommand('tsc')
  console.log('build tsc');
  await execShellCommand(`esbuild dist/index.js --bundle --platform=node --outfile=out/out.js --minify`)
  console.log('pack to one file');
  await execShellCommand('node --experimental-sea-config build/sea-config.json')
  await execShellCommand(`node -e "require('fs').copyFileSync(process.execPath, 'out/hlink-client.exe')"`)
  console.log('copy node to hlink-client.exe');
  await execShellCommand(`npx postject out/hlink-client.exe NODE_SEA_BLOB out/sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`)
  console.log('inject sea-prep.blob to hlink-client.exe');
}
main().then(() => {
  console.log('Build completed')
})