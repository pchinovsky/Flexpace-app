import { Component, OnInit } from '@angular/core';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Task } from 'src/app/types/task';
import { TaskService } from '../task.service';
import { AuthService } from 'src/app/auth/auth.service';
import { ChangeDetectionStrategy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CommentsService } from '../comments.service';
import { take } from 'rxjs';
import { Comment } from 'src/app/types/task';
import { ChangeDetectorRef } from '@angular/core';
import { HostListener } from '@angular/core';
import { Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { BoardService } from 'src/app/boards/board.service';
import { Input } from '@angular/core';

@Component({
  selector: 'app-task-open',
  templateUrl: './task-open.component.html',
  styleUrls: ['./task-open.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskOpenComponent implements OnInit {
  // @Input() board: string = '';

  @Output() closeEvent = new EventEmitter<void>();

  task: Task;
  taskColor: string = '';
  own: boolean = false;
  userId: string = '';
  // userId: string | null = '';
  board: string = '';

  loading: boolean = false;

  newComment: string = '';
  // comments: { owner: string; ownerName: string; content: string }[] = [];
  comments: Comment[] = [];

  selectColorOn = false;
  // contentControl: FormControl;

  colors: string[] = [
    '#63cdda',
    '#f7d794',
    '#f8a5c2',
    '#f3a683',
    '#45aaf2',
    '#26de81',
    '#fc5c65',
  ];

  titleControl: FormControl;
  contentControl: FormControl;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { id: string; task: Task; own: boolean; board: string },
    public taskService: TaskService,
    public auth: AuthService,
    private comment: CommentsService,
    private cdr: ChangeDetectorRef,
    private boardService: BoardService,
    public dialogRef: MatDialogRef<TaskOpenComponent>
  ) {
    this.task = data.task;
    this.taskColor = data.task.color;
    this.own = data.own;
    this.board = data.board;
    console.log('Task Details:', data);
    // this.contentControl = new FormControl(this.task.content);

    this.titleControl = new FormControl(data.task.title);
    this.contentControl = new FormControl(data.task.content);

    // for reactive forms and form control [disable] wasn't enough
    if (!this.own) {
      this.titleControl.disable();
      this.contentControl.disable();
    }

    this.userId = this.auth.getCurrentUserId() as string;

    this.dialogRef.beforeClosed().subscribe(() => {
      console.log('TASK OPEN DIALOG REF');
      // this.closeEvent.emit();
      this.boardService.setTaskOpen(false);
    });
  }

  @HostListener('document:click', ['$event'])
  onBackgroundClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (target.classList.contains('task-open-background')) {
      this.closeTask();
    }
  }

  ngOnInit(): void {
    console.log('FILTER - BOARD INPUT - ', this.board);

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

    console.log('own?', this.own);

    // this.loadComments();
    this.loadTaskAndComments();
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
    // console.log('OPEN - SAVE CONTENT ON');
    // this.closeEvent.emit();
    const updatedTask = {
      ...this.task,
      title: this.titleControl.value,
      content: this.contentControl.value,
    };

    console.log('before update -', updatedTask);

    this.taskService.updateTask(updatedTask, this.userId as string);
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
    this.taskService.updateTask(this.task, this.userId as string);
  }

  selectColor(e: MouseEvent): void {
    this.selectColorOn = !this.selectColorOn;
    const color = (e.target as HTMLElement).getAttribute('data-color');
    if (color) {
      this.task.color = color;
      this.taskService.updateTask(this.task, this.userId as string);
    }
  }

  formatText(command: string): void {
    document.execCommand(command);
  }

  //

  loadComments(): void {
    this.loading = true;

    this.comment.getComments(this.task.id).subscribe((comments) => {
      this.comments = comments;
      this.loading = false;
    });
  }

  // addComment(): void {
  //   if (!this.newComment.trim()) return;

  //   const comment: Comment = {
  //     owner: this.userId,
  //     content: this.newComment,
  //     timestamp: Date.now(),
  //   };

  //   this.comment
  //     .addComment(this.task.id, comment)
  //     .then(() => {
  //       this.newComment = '';
  //     })
  //     .catch((error) => console.error('error adding comment:', error));
  // }

  addComment(): void {
    if (!this.newComment.trim()) return;

    this.auth
      .getUser()
      .pipe(take(1))
      .subscribe((user) => {
        if (!user?.displayName) return;

        this.loading = true;
        const comment: Comment = {
          owner: this.userId,
          ownerName: user.displayName,
          content: this.newComment,
          timestamp: Date.now(),
        };

        this.comment
          .addComment(this.task.id, comment)
          .then(() => {
            this.newComment = '';
            this.loading = false;
          })
          .catch((error) => console.error('error adding comment -', error));
      });
  }

  //

  loadTaskAndComments(): void {
    this.taskService.getTaskWithComments(this.task.id).subscribe({
      next: ({ task, comments }) => {
        this.task = task;
        this.comments = comments;
        console.log('task and comments loaded - ', task, this.comments);
        this.cdr.detectChanges();
        this.loading = false;
      },
      error: (error) => {
        console.error('error loading task and comments - ', error);
        this.loading = false;
      },
    });
  }

  //

  closeTask(): void {
    this.closeEvent.emit();
  }
}
