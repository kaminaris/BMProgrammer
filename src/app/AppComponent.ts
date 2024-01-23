import { Component }       from '@angular/core';
import { ElectronService } from './Core/Service/Electron/ElectronService';
import { APP_CONFIG }      from 'environments/environment';

@Component({
	selector: 'app-root',
	templateUrl: './AppComponent.html'
})
export class AppComponent {
	constructor(
		protected electronService: ElectronService
	) {
		console.log('APP_CONFIG', APP_CONFIG);

		if (electronService.isElectron) {
			console.log(process.env);
			console.log('Run in electron');
			console.log('Electron ipcRenderer', this.electronService.ipcRenderer);
			console.log('NodeJS childProcess', this.electronService.childProcess);
		}
		else {
			console.log('Run in browser');
		}
	}
}
