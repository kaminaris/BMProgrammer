import { BrowserModule }    from '@angular/platform-browser';
import { NgModule }         from '@angular/core';
import { FormsModule }      from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HomeModule }       from 'app/Home/HomeModule';
import { CoreModule }       from './Core/CoreModule';
import { SharedModule }     from './Shared/SharedModule';

import { AppRoutingModule } from './AppRoutingModule';

import { AppComponent } from './AppComponent';

@NgModule({
	declarations: [AppComponent],
	imports: [
		BrowserModule,
		FormsModule,
		HttpClientModule,
		CoreModule,
		SharedModule,
		HomeModule,
		AppRoutingModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule {
}
