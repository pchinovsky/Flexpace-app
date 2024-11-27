import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskComponent } from './task/task.component';
import { NewTaskComponent } from './new-task/new-task.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TaskOpenComponent } from './task-open/task-open.component';

@NgModule({
  declarations: [TaskComponent, NewTaskComponent, TaskOpenComponent],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    DragDropModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  exports: [TaskComponent, NewTaskComponent, TaskOpenComponent],
})
export class TaskModule {}
