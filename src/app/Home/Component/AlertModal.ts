import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
	selector: 'modal-content',
	template: `
		<div class="modal-header">
			<h4 class="modal-title pull-left">{{ title }}</h4>
			<button type="button" class="btn-close close pull-right" aria-label="Close" (click)="bsModalRef.hide()">
				<span aria-hidden="true" class="visually-hidden">&times;</span>
			</button>
		</div>
		<div class="modal-body">
			{{ body }}
		</div>
		<div class="modal-footer">
			<button type="button" class="btn btn-default" (click)="bsModalRef.hide()">OK</button>
		</div>
	`
})
export class AlertModal {
	title = '';
	body = '';

	constructor(public bsModalRef: BsModalRef) {}
}