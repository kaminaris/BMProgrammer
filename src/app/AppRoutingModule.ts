import { NgModule }              from '@angular/core';
import { Routes, RouterModule }  from '@angular/router';
import { HomeRoutingModule }     from 'app/Home/HomeRoutingModule';
import { PageNotFoundComponent } from 'app/Shared/Component/PageNotFound/PageNotFoundComponent';

const routes: Routes = [
	{
		path: '',
		redirectTo: 'home',
		pathMatch: 'full'
	},
	{
		path: '**',
		component: PageNotFoundComponent
	}
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, {}),
		HomeRoutingModule,
	],
	exports: [RouterModule]
})
export class AppRoutingModule {
}
