import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'app-page-not-found',
	templateUrl: './PageNotFoundComponent.html',
})
export class PageNotFoundComponent implements OnInit {
	constructor() {}

	ngOnInit(): void {
		console.log('PageNotFoundComponent INIT');
	}
}
