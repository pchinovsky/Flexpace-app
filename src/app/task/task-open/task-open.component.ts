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
import { Observable } from 'rxjs';
import { ErrorService } from 'src/app/shared/error.service';

@Component({
  selector: 'app-task-open',
  templateUrl: './task-open.component.html',
  styleUrls: ['./task-open.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskOpenComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<void>();

  userProfilePicture$: Observable<string | null> | undefined;

  task: Task;
  taskColor: string = '';
  own: boolean = false;
  userId: string = '';
  board: string = '';

  loading: boolean = false;

  newComment: string = '';
  comments: Comment[] = [];

  selectColorOn = false;

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
    private errorService: ErrorService,
    public dialogRef: MatDialogRef<TaskOpenComponent>
  ) {
    this.task = data.task;
    this.taskColor = data.task.color;
    this.own = data.own;
    this.board = data.board;
    console.log('Task Details:', data);

    this.titleControl = new FormControl(data.task.title);
    this.contentControl = new FormControl(data.task.content);

    // for reactive forms and form control [disable] wasn't enough
    if (!this.own) {
      this.titleControl.disable();
      this.contentControl.disable();
    }

    this.userId = this.auth.getCurrentUserId() as string;

    this.dialogRef.beforeClosed().subscribe(() => {
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
    // updating global css var -
    document.documentElement.style.setProperty('--task-color', this.taskColor);

    // subscr to content control changes -
    this.contentControl.valueChanges.subscribe((value: string) => {
      this.task.content = value;
    });

    // title control changes -
    this.titleControl.valueChanges.subscribe((value: string) => {
      console.log('title changed:', value);
      this.task.title = value;
    });

    this.loadTaskAndComments();

    if (this.task && this.task.owner) {
      this.userProfilePicture$ = this.auth.getUserProfilePic(
        this.task.owner as string
      );
    }
  }

  onContentChange(event: Event): void {
    event.stopPropagation();
    const target = event.target as HTMLTextAreaElement;
    if (target) {
      this.task.content = target.value;
    }
  }

  // working without content change and with form control and ng on init -
  saveContent(): void {
    const updatedTask = {
      ...this.task,
      title: this.titleControl.value,
      content: this.contentControl.value,
    };

    this.taskService.updateTask(updatedTask, this.userId as string);
  }

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

  addComment(): void {
    console.log('Add Comment function triggered');

    if (!this.newComment.trim()) {
      console.warn('New comment is empty or only whitespace');
      return;
    }

    if (!this.userId) {
      console.error('User ID is missing, unable to fetch user data');
      return;
    }

    this.auth
      .getUserDataById(this.userId)
      .pipe(take(1))
      .subscribe({
        next: (userData) => {
          console.log('User data retrieved:', userData);

          if (!userData?.displayName) {
            console.warn(
              'User displayName is missing, aborting comment submission'
            );
            return;
          }

          this.loading = true;
          const comment: Comment = {
            owner: this.userId,
            ownerName: userData.displayName,
            content: this.newComment,
            timestamp: Date.now(),
          };

          console.log('Comment object prepared:', comment);

          this.comment
            .addComment(this.task.id, comment)
            .then(() => {
              console.log('Comment successfully added to Firestore');

              this.newComment = '';
              this.loading = false;
            })
            .catch((error) => {
              console.error('Error adding comment to Firestore:', error);
              this.loading = false;
            });
        },
        error: (error) => {
          console.error('Error fetching user data:', error);
        },
      });
  }

  //

  loadTaskAndComments(): void {
    this.taskService.getTaskWithComments(this.task.id).subscribe({
      next: ({ task, comments }) => {
        this.task = task;
        this.comments = comments;
        this.cdr.detectChanges();
        this.loading = false;
      },
      error: (error) => {
        console.error('error loading task and comments - ', error);
        this.loading = false;
      },
    });
  }

  closeTask(): void {
    this.closeEvent.emit();
  }
}
