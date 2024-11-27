import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from './modal/modal.component';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  declarations: [ModalComponent],
  imports: [CommonModule, MatDialogModule],
  exports: [ModalComponent],
})
export class SharedModule {}
