import { app, BrowserWindow, ipcMain, screen, dialog, ipcRenderer } from 'electron';
import * as fs                                                      from 'fs';
import { ChildProcessWithoutNullStreams }              from 'node:child_process';
import * as path                                       from 'path';
import { SerialPort }                                  from 'serialport';
import { spawn }                                       from 'child_process';

let win: BrowserWindow | null = null;
const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');
let gdbProcess: ChildProcessWithoutNullStreams;

function createWindow(): BrowserWindow {

	const size = screen.getPrimaryDisplay().workAreaSize;

	// Create the browser window.
	win = new BrowserWindow({
		x: 0,
		y: 0,
		width: size.width,
		height: size.height,
		webPreferences: {
			nodeIntegration: true,
			allowRunningInsecureContent: (serve),
			contextIsolation: false
		}
	});

	ipcMain.on('connect-gdb', async (event, path: string) => {
		if (gdbProcess) {
			gdbProcess.kill();
		}

		gdbProcess = spawn(path, ['-q'], { shell: true });
		gdbProcess.stderr.on('data', (data: Buffer) => {
			const str = data.toString();
			console.log(str);
			win!.webContents.send('gdb-stderr', str);
		});

		gdbProcess.stdout.on('data', (data: Buffer) => {
			const str = data.toString();
			console.log(str);
			win!.webContents.send('gdb-stdout', str);
		});

		event.returnValue = true;
	});

	ipcMain.on('write-gdb', async (event, command: string) => {
		if (!gdbProcess) {
			event.returnValue = false;
			return;
		}

		console.log('sending command', command);
		gdbProcess.stdin.write(command);
		event.returnValue = true;
	});

	ipcMain.on('list-com-ports', async (event) => {
		event.returnValue = await SerialPort.list();
	});

	ipcMain.on('open-file-dialog', async (event) => {
		const resp = await dialog.showOpenDialog({ properties: ['openFile'] });
		if (resp.canceled) {
			event.returnValue = false;
		}
		else {
			event.returnValue = resp.filePaths;
		}
	});

	ipcMain.on('save-file-dialog', async (event) => {
		const resp = await dialog.showSaveDialog({ properties: [] });
		if (resp.canceled) {
			event.returnValue = false;
		}
		else {
			event.returnValue = resp.filePath;
		}
	});

	if (serve) {
		const debug = require('electron-debug');
		debug();

		require('electron-reloader')(module);
		win.loadURL('http://localhost:4200');
	}
	else {
		// Path when running electron executable
		let pathIndex = './index.html';

		if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
			// Path when running electron in local folder
			pathIndex = '../dist/index.html';
		}

		const url = new URL(path.join('file:', __dirname, pathIndex));
		win.loadURL(url.href);
	}

	// Emitted when the window is closed.
	win.on('closed', () => {
		// Dereference the window object, usually you would store window
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		win = null;
	});

	return win;
}

try {
	// This method will be called when Electron has finished
	// initialization and is ready to create browser windows.
	// Some APIs can only be used after this event occurs.
	// Added 400 ms to fix the black background issue while using transparent window. More detais at
	// https://github.com/electron/electron/issues/15947
	app.on('ready', () => setTimeout(createWindow, 400));

	// Quit when all windows are closed.
	app.on('window-all-closed', () => {
		// On OS X it is common for applications and their menu bar
		// to stay active until the user quits explicitly with Cmd + Q
		if (process.platform !== 'darwin') {
			app.quit();
		}
	});

	app.on('activate', () => {
		// On OS X it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (win === null) {
			createWindow();
		}
	});

}
catch (e) {
	// Catch Error
	// throw e;
}
