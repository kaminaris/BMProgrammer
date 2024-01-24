import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ElectronService }                                             from 'app/Core/Service/Electron/ElectronService';
import { AlertModal }                                                  from 'app/Home/Component/AlertModal';
import { LoadingModal }                                                from 'app/Home/Component/LoadingModal';
import { DebugTarget }                                                 from 'app/Home/Interface/DebugTarget';
import { MemoryRegion }                                                from 'app/Home/Interface/MemoryRegion';
import { BsModalRef, BsModalService }                                  from 'ngx-bootstrap/modal';
import { Subscription }                                                from 'rxjs';

@Component({
	selector: 'app-home',
	templateUrl: './HomeComponent.html'
})
export class HomeComponent implements OnInit {
	settings = {
		gdbPath: '',
		selectedComPort: '',
		savePath: '',
		restoreAddress: '0x0',
		restoreFile: ''
	};

	comPorts: any[] = [];
	consoleOutput = '';
	customCommand = '';

	targets: DebugTarget[] = [];
	memoryRegions: MemoryRegion[] = [];

	@ViewChild('consoleRef', { read: ElementRef })
	consoleRef!: ElementRef<HTMLElement>;
	isDebug = false;
	modal?: BsModalRef<{ title: string; body: string }>;

	constructor(
		protected e: ElectronService,
		protected cd: ChangeDetectorRef,
		protected modalService: BsModalService
	) {
		this.e.gdbStdErr.subscribe((d: string) => {
			this.appendToConsole(d);
		});

		this.e.gdbStdOut.subscribe((d: string) => {
			this.appendToConsole(d);
		});
	}

	appendToConsole(s: string) {
		this.consoleOutput += s;
		this.cd.detectChanges();
		this.consoleRef.nativeElement.scrollTo(0, this.consoleRef.nativeElement.scrollHeight);
	}

	ngOnInit(): void {
		console.log('HomeComponent INIT');
		const s = localStorage.getItem('settings');
		console.log('s', s);
		if (s) {
			console.log('s', s);
			this.settings = JSON.parse(s);
		}
		this.loadComPorts().catch(console.error);
	}

	async loadComPorts() {
		const r = await this.e.listComPorts();
		console.log(r);
		this.comPorts = r;
		this.settings.selectedComPort = r[0].friendlyName;
	}

	async browseForGdb() {
		const r = await this.e.openFileDialog();
		if (r && r.length > 0) {
			this.settings.gdbPath = r[0];
		}
		console.log(r);
		this.saveSettings();
	}

	saveSettings() {
		localStorage.setItem('settings', JSON.stringify(this.settings));
	}

	async sendCustomCommand() {
		const r = await this.execCommand(this.customCommand);

	}

	async connectToGdb() {
		const r = await this.e.connectGdb(this.settings.gdbPath);
		const comPort = this.comPorts.find(c => c.friendlyName === this.settings.selectedComPort);
		if (!comPort) {
			console.log('Com port not selected');
			return;
		}

		await new Promise(r => setTimeout(r, 200));
		let path = comPort.path;
		if (path.startsWith('COM')) {
			path = '\\\\.\\' + path;
		}
		await this.execCommand('target extended-remote ' + path);

		await new Promise(r => setTimeout(r, 200));
		await this.listTargets();
	}

	async attachToTarget(t: DebugTarget) {
		await this.execCommand(`attach ${ t.index }`);
		await this.scanMemory();
	}

	async scanMemory() {
		let sub: Subscription | undefined = undefined;
		let sub2: Subscription | undefined = undefined;
		const regions: MemoryRegion[] = [];
		// gdb sends it in std err
		const listener = (d: string) => {
			if (d.trim() === '(gdb)') {
				// skip the gdb
				return;
			}
			const lines = d.split('\n');
			for (const line of lines) {
				const matches = /(\d+) {3}([yn]) {2}\t(0x\d+) (0x\d+) ([\w ]+)/gm.exec(line);
				console.log('matches', matches, 'str', d);
				if (matches) {
					regions.push({
						index: +matches[1],
						enb: matches[2] === 'y',
						lowAddress: matches[3],
						highAddress: matches[4],
						attrs: matches[5].trim().split(' ')
					});
				}
			}
		};

		sub = this.e.gdbStdErr.subscribe(listener);
		sub2 = this.e.gdbStdOut.subscribe(listener);

		await this.execCommand('info mem');

		await new Promise(r => setTimeout(r, 200));
		sub2.unsubscribe();
		sub.unsubscribe();
		this.memoryRegions = regions;
	}

	async listTargets() {
		let sub: Subscription | undefined = undefined;
		let sub2: Subscription | undefined = undefined;
		const targets: DebugTarget[] = [];
		// gdb sends it in std err
		const listener = (d: string) => {
			if (d.trim() === '(gdb)') {
				// skip the gdb
				console.log('skip');
				return;
			}
			const matches = /(\d+)\s+([a-zA-Z0-9_ ]+)/gm.exec(d);
			if (matches) {
				targets.push({
					index: +matches[1],
					name: matches[2]
				});
			}
		};

		sub = this.e.gdbStdErr.subscribe(listener);
		sub2 = this.e.gdbStdOut.subscribe(listener);

		await this.execCommand('mon swd');

		await new Promise(r => setTimeout(r, 200));
		sub2.unsubscribe();
		sub.unsubscribe();
		this.targets = targets;
	}

	async browseDump() {
		const r = await this.e.saveFileDialog();
		if (!r) {
			return;
		}

		this.settings.savePath = r;
		this.saveSettings();
	}

	async dumpRegion(r: MemoryRegion) {
		if (!this.settings.savePath) {
			return;
		}

		let format = this.detectFormat(this.settings.savePath.toLowerCase());

		// Cannot dump elf
		if (!format || format === 'elf') {
			await this.alertModal('Dump error', 'Unrecognized format, please use "bin" or "hex"');
			return;
		}

		let sub: Subscription | undefined = undefined;
		const listener = async (d: string) => {
			await this.loadingStop();
			await new Promise(r => setTimeout(r, 100));
			await this.alertModal('Dump complete', 'Memory has been dumped at ' + this.settings.savePath);
			sub?.unsubscribe();
		};
		sub = this.e.gdbStdOut.subscribe(listener);
		await this.loadingModal('Dumping', 'Dump in progress please wait');
		await this.execCommand(
			`dump ${ format } memory ${ this.settings.savePath } ${ r.lowAddress } ${ r.highAddress }`
		);
	}

	async restore() {
		if (!this.settings.restoreFile) {
			return;
		}

		let format = this.detectFormat(this.settings.restoreFile.toLowerCase());

		if (!format) {
			await this.alertModal('Dump error', 'Unrecognized format, please use "bin" or "hex"');
			return;
		}

		let sub: Subscription | undefined = undefined;
		const listener = async (d: string) => {
			await this.loadingStop();
			await new Promise(r => setTimeout(r, 100));

			await this.alertModal(
				'Restore complete',
				'File has been restored at ' + this.settings.restoreAddress + ' ' + this.settings.restoreFile
			);

			sub?.unsubscribe();
		};

		sub = this.e.gdbStdOut.subscribe(listener);
		await this.loadingModal('Restoring', 'Restore/load in progress please wait');
		if (format === 'binary') {
			await this.execCommand(`restore ${ this.settings.restoreFile } binary ${ this.settings.restoreAddress }`);
		}
		else {
			// ihex or elf
			await this.execCommand(`load ${ this.settings.restoreFile }`);
		}
	}

	detectFormat(path: string) {
		let format: string | undefined = undefined;
		if (path.endsWith('.bin')) {
			format = 'binary';
		}
		else if (path.endsWith('.hex')) {
			format = 'ihex';
		}
		else if (path.endsWith('.elf')) {
			format = 'elf';
		}

		return format;
	}

	async alertModal(title: string, body: string) {
		this.modalService.show(AlertModal, {
			initialState: {
				title,
				body
			}
		});
	}

	async loadingModal(title: string, body: string) {
		if (this.modal) {
			return;
		}

		this.modal = this.modalService.show(LoadingModal, {
			backdrop: 'static',
			initialState: {
				title,
				body
			}
		});
	}

	async loadingStop() {
		if (!this.modal) {
			return;
		}

		this.modal.hide();
		this.modal = undefined;
	}

	test() {
		this.modalService.show(AlertModal, {
			initialState: {
				title: 'Test title',
				body: 'some body'
			}
		});
	}

	async browseForRestore() {
		const r = await this.e.openFileDialog();
		if (r && r.length > 0) {
			this.settings.restoreFile = r[0];
		}
		console.log(r);
		this.saveSettings();
	}

	async execCommand(s: string) {
		const cmd = s + '\n';
		await this.e.writeGdb(cmd);
		this.appendToConsole(cmd);
	}
}
