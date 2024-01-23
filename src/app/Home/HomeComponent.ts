import { Component, OnInit } from '@angular/core';
import { Router }            from '@angular/router';

@Component({
	selector: 'app-home',
	templateUrl: './HomeComponent.html'
})
export class HomeComponent implements OnInit {

	ngOnInit(): void {
		console.log('HomeComponent INIT');
	}

}
