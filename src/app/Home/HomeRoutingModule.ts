import { NgModule }             from '@angular/core';
import { CommonModule }         from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent }        from './HomeComponent';

const routes: Routes = [
	{
		path: 'home',
		component: HomeComponent
	}
];

@NgModule({
	declarations: [],
	imports: [CommonModule, RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class HomeRoutingModule {
}
