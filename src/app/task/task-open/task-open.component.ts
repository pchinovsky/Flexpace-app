import { Component, OnInit } from '@angular/core';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Task } from 'src/app/types/task';
import { TaskService } from '../task.service';
import { AuthService } from 'src/app/auth/auth.service';
import { ChangeDetectionStrategy } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-task-open',
  templateUrl: './task-open.component.html',
  styleUrls: ['./task-open.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskOpenComponent implements OnInit {
  task: Task;
  taskColor: string = '';
  own: boolean = false;

  selectColorOn = false;
  // contentControl: FormControl;

  titleControl: FormControl;
  contentControl: FormControl;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { id: string; task: Task; own: boolean },
    public taskService: TaskService,
    public auth: AuthService
  ) {
    this.task = data.task;
    this.taskColor = data.task.color;
    this.own = data.own;
    console.log('Task Details:', data);
    // this.contentControl = new FormControl(this.task.content);

    this.titleControl = new FormControl(data.task.title);
    this.contentControl = new FormControl(data.task.content);
  }

  ngOnInit(): void {
    // updating global css var -
    document.documentElement.style.setProperty('--task-color', this.taskColor);
    console.log('ng on init - ', this.task.coordinates);

    // subscr to content control changes -
    this.contentControl.valueChanges.subscribe((value: string) => {
      console.log('Content changed:', value);
      this.task.content = value;
    });

    // title control changes -
    this.titleControl.valueChanges.subscribe((value: string) => {
      console.log('title changed:', value);
      this.task.title = value;
    });
  }

  // text format -
  // onContentChange(event: Event): void {
  //   const target = event.target as HTMLDivElement;
  //   this.task.content = target.innerHTML;
  // }

  onContentChange(event: Event): void {
    console.log('content change - ', this.task.coordinates);

    event.stopPropagation();
    const target = event.target as HTMLTextAreaElement;
    if (target) {
      this.task.content = target.value;
      // console.log('content change after value - ', this.task.coordinates);
    }
  }

  // onContentChange(event: Event): void {
  //   const target = event.target as HTMLDivElement;

  //   target.addEventListener('input', () => {
  //   });

  //   target.addEventListener('blur', () => {
  //     this.task.content = target.innerHTML;
  //   });
  // }

  //

  // --- issue with jumping is here -
  // saveContent(e: Event): void {
  //   console.log(e);

  //   console.log(this.task.coordinates);
  //   // console.log(this.task);

  //   this.taskService.updateTask(this.task);
  // }

  // --- original -
  // saveContent(event: Event): void {
  //   const updatedTask = {
  //     ...this.task,
  //     content: this.task.content,
  //   };

  //   console.log('before update -', updatedTask);

  //   this.taskService.updateTask(updatedTask);
  // }

  // working without content change and with form control and ng on init -
  saveContent(): void {
    const updatedTask = {
      ...this.task,
      title: this.titleControl.value,
      content: this.contentControl.value,
    };

    console.log('before update -', updatedTask);

    this.taskService.updateTask(updatedTask);
  }

  // saveContent(): void {
  //   const updatedTask = {
  //     ...this.task,
  //     content: this.task.content,
  //   };

  //   this.taskService.updateTask(updatedTask);
  // }

  onTitleChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.task.title = target.value;
  }

  saveTitle(): void {
    this.taskService.updateTask(this.task);
  }

  selectColor(e: MouseEvent): void {
    this.selectColorOn = !this.selectColorOn;
    const color = (e.target as HTMLElement).getAttribute('data-color');
    if (color) {
      this.task.color = color;
      this.taskService.updateTask(this.task);
    }
  }

  formatText(command: string): void {
    document.execCommand(command);
  }
}
