import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from './modal/modal.component';
import { MatDialogModule } from '@angular/material/dialog';
import { TimestampPipe } from './timestamp.pipe';

@NgModule({
  declarations: [ModalComponent, TimestampPipe],
  imports: [CommonModule, MatDialogModule],
  exports: [ModalComponent, TimestampPipe],
})
export class SharedModule {}
