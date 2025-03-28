import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {copy} from 'fs-extra';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const require = createRequire(import.meta.url);
const packagePath = path.parse(require.resolve('gelectron/package.json')).dir;
const install = spawn('yarn', ['install'], {
    cwd: packagePath,
    env: process.env,
    shell: true,
});

install.stdout.on('data', function (data) {
    console.log('stdout: ' + data.toString());
});

install.stderr.on('data', function (data) {
    console.log('stderr: ' + data.toString());
});

console.log(__dirname)
install.on('exit', function (code) {
    console.log('child process exited with code ' + code.toString());

    const ls = spawn('yarn', ['run', 'build:addon:x64'], {
        cwd: packagePath,
        env: process.env,
        shell: true,
    });

    ls.stdout.on('data', function (data) {
        console.log('stdout: ' + data.toString());
    });

    ls.stderr.on('data', function (data) {
        console.log('stderr: ' + data.toString());
    });

    ls.on('exit', function (code) {
        console.log('child process exited with code ' + code.toString());

        copy(`${packagePath}/electron-overlay`, path.resolve(__dirname, `../dist`))
        copy(`${packagePath}/electron-overlay/index.js`, path.resolve(__dirname, `../dist/index.cjs`))
        copy(`${packagePath}/game-overlay/prebuilt/injector_helper.exe`, path.resolve(__dirname, `../dist/injector_helper.exe`))
        copy(`${packagePath}/game-overlay/prebuilt/injector_helper.x64.exe`, path.resolve(__dirname, `../dist/injector_helper.x64.exe`))
        copy(`${packagePath}/game-overlay/prebuilt/n_overlay.dll`, path.resolve(__dirname, `../dist/n_overlay.dll`))
        copy(`${packagePath}/game-overlay/prebuilt/n_overlay.x64.dll`, path.resolve(__dirname, `../dist/n_overlay.x64.dll`))
    });

});
