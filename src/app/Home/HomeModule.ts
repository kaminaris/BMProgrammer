import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { AlertModal }    from 'app/Home/Component/AlertModal';
import { HomeComponent } from 'app/Home/HomeComponent';

import { HomeRoutingModule } from './HomeRoutingModule';

import { SharedModule } from '../Shared/SharedModule';
import { ModalModule } from 'ngx-bootstrap/modal';

@NgModule({
	declarations: [HomeComponent, AlertModal],
	imports: [CommonModule, SharedModule, HomeRoutingModule, ModalModule.forRoot()]
})
export class HomeModule {
}
