import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Task } from 'src/app/types/task';
import { TaskService } from 'src/app/task/task.service';
import { AuthService } from 'src/app/auth/auth.service';
import { Output } from '@angular/core';
import { EventEmitter } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
})
export class ModalComponent {
  @Output() closeEvent = new EventEmitter<void>();

  private initialTask: Task;
  userId: string | null = '';

  constructor(
    public dialogRef: MatDialogRef<ModalComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      task: Task;
      message?: string;
      predefinedImages?: string[];
      type: 'error' | 'backgroundSelection' | 'taskEdit';
    },
    private taskService: TaskService,
    private auth: AuthService
  ) {
    this.initialTask = structuredClone(data.task);

    // subscr to before closed to save content on modal closure -
    this.dialogRef.beforeClosed().subscribe(() => {
      this.saveTask();
    });

    this.userId = this.auth.getCurrentUserId();
  }

  // private saveTaskIfChanged(): void {
  //   if (JSON.stringify(this.initialTask) !== JSON.stringify(this.data.task)) {
  //     console.log('Changes detected. Saving task...');
  //     this.taskService.updateTask(this.data.task);
  //   }
  // }

  close(): void {
    this.dialogRef.close();
  }

  saveTask(): void {
    if (!this.data.task || !this.data.task.coordinates) {
      return;
    }

    console.log('modal save - ', this.data.task.coordinates);
    if (this.data.task) {
      console.log('saving task on modal close:', this.data.task);
      this.taskService.updateTask(this.data.task, this.userId as string);
    }
  }

  selectBackground(background: string): void {
    this.dialogRef.close(background);
  }
}
