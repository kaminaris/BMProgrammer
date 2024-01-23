import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageNotFoundComponent } from './Component/PageNotFound/PageNotFoundComponent';
import { FormsModule }           from '@angular/forms';

@NgModule({
	declarations: [PageNotFoundComponent],
	imports: [CommonModule, FormsModule],
	exports: [FormsModule]
})
export class SharedModule {
}
