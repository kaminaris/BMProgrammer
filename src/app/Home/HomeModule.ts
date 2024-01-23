import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './HomeRoutingModule';

import { HomeComponent } from './HomeComponent';
import { SharedModule }  from '../Shared/SharedModule';

@NgModule({
	declarations: [HomeComponent],
	imports: [CommonModule, SharedModule, HomeRoutingModule]
})
export class HomeModule {
}
