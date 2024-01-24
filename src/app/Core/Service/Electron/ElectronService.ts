import { EventEmitter, Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame }    from 'electron';
import * as childProcess            from 'child_process';
import * as fs                      from 'fs';

@Injectable({
	providedIn: 'root'
})
export class ElectronService {
	ipcRenderer!: typeof ipcRenderer;
	webFrame!: typeof webFrame;
	childProcess!: typeof childProcess;
	fs!: typeof fs;

	gdbStdErr = new EventEmitter<string>();
	gdbStdOut = new EventEmitter<string>();

	constructor() {
		// Conditional imports
		if (this.isElectron) {
			this.ipcRenderer = (window as any).require('electron').ipcRenderer;
			this.webFrame = (window as any).require('electron').webFrame;

			this.fs = (window as any).require('fs');

			this.childProcess = (window as any).require('child_process');
			this.childProcess.exec('node -v', (error, stdout, stderr) => {
				if (error) {
					console.error(`error: ${ error.message }`);
					return;
				}
				if (stderr) {
					console.error(`stderr: ${ stderr }`);
					return;
				}
				console.log(`stdout:\n${ stdout }`);
			});

			// Notes :
			// * A NodeJS's dependency imported with 'window.require' MUST BE present in `dependencies` of both
			// `app/package.json` and `package.json (root folder)` in order to make it work here in Electron's Renderer
			// process (src folder) because it will loaded at runtime by Electron. * A NodeJS's dependency imported
			// with TS module import (ex: import { Dropbox } from 'dropbox') CAN only be present in `dependencies` of
			// `package.json (root folder)` because it is loaded during build phase and does not need to be in the
			// final bundle. Reminder : only if not used in Electron's Main process (app folder)

			// If you want to use a NodeJS 3rd party deps in Renderer process,
			// ipcRenderer.invoke can serve many common use cases.
			// https://www.electronjs.org/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args
		}

		this.ipcRenderer.on('gdb-stdout', (l: any, data: string) => {
			this.gdbStdOut.emit(data);
		});

		this.ipcRenderer.on('gdb-stderr', (l: any, data: string) => {
			this.gdbStdErr.emit(data);
		});
	}

	get isElectron(): boolean {
		return !!(window && window.process && window.process.type);
	}

	async listComPorts() {
		return await this.ipcRenderer.sendSync('list-com-ports');
	}

	async openFileDialog() {
		return await this.ipcRenderer.sendSync('open-file-dialog');
	}

	async saveFileDialog() {
		return await this.ipcRenderer.sendSync('save-file-dialog');
	}

	async connectGdb(path: string) {
		return await this.ipcRenderer.sendSync('connect-gdb', path);
	}

	async writeGdb(command: string) {
		return await this.ipcRenderer.sendSync('write-gdb', command);
	}
}
