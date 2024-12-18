import { Component, ViewChild, ElementRef, Input, Output } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { Task } from 'src/app/types/task';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';
import { PointService } from '../point.service';
import { EventEmitter } from '@angular/core';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-new-task',
  templateUrl: './new-task.component.html',
  styleUrls: ['./new-task.component.css'],
})
export class NewTaskComponent {
  @ViewChild('draggable') draggable!: ElementRef;
  // @Input() defaultSize: { x: number; y: number } | null = null;
  coordinates: { x: number; y: number } | null = null;
  @Input() board: string | null = '';
  @Output() closeModalEvent = new EventEmitter<void>();

  userId: string | null = '';
  // boardName: string | null = '';
  ownerName: string | null | undefined = '';

  type = '';

  colors: string[] = [
    '#63cdda',
    '#f7d794',
    '#f8a5c2',
    '#f3a683',
    '#45aaf2',
    '#26de81',
    '#fc5c65',
  ];
  selectedColor: string = this.colors[0];
  defaultHeight = 240;
  defaultWidth = 190;

  newTask = this.fb.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
    public: [false],
    today: [false],
    note: [false],
    color: [''],
    dueDate: [null],
  });

  constructor(
    private fb: FormBuilder,
    private firestore: AngularFirestore,
    private authService: AuthService,
    private router: Router,
    private point: PointService
  ) {}

  ngOnInit() {
    // const fullPath = this.router.url;
    // const segments = fullPath.split('/');
    // this.board = segments.pop() || null;
    // console.log('Board Name:', this.board);

    this.type = this.newTask.get('note')?.value ? 'task' : 'note';

    this.newTask.get('note')?.valueChanges.subscribe((value) => {
      this.type = value ? 'task' : 'note';
      this.defaultHeight = value ? 140 : 240;

      if (value) {
        this.newTask.get('content')?.disable();
      } else {
        this.newTask.get('content')?.enable();
      }
    });

    // if (!this.coordinates) {
    //   this.coordinates = this.point.getCoordinates();
    // }
    this.coordinates = this.point.getCoordinates();

    console.log('Task initialized at coordinates:', this.coordinates);

    this.point.clearCoordinates();
  }

  newTaskSubmit() {
    console.log(this.newTask.get('color')?.value);
    console.log(this.newTask.get('color')?.valid);
    console.log(this.newTask.get('color')?.errors);

    if (!this.coordinates) {
      return;
    }

    if (this.newTask.valid) {
      const dueDateString = this.newTask.value.dueDate;
      const dueDate = dueDateString ? new Date(dueDateString) : null;

      this.userId = this.authService.getCurrentUserId();
      if (this.userId) {
        this.authService
          .getUserDataById(this.userId)
          .pipe(
            switchMap((data) => {
              this.ownerName = data?.displayName ?? 'Unknown';

              const task: Task = {
                id: this.firestore.createId(),
                title: this.newTask.value.title!,
                content: this.newTask.value.content! || '',
                subtasks: [],
                createdAt: new Date(),
                dueDate: dueDate,
                owner: this.userId,
                ownerName: this.ownerName,
                public: this.newTask.value.public || false,
                board: this.board,
                today: this.newTask.value.today || false,
                type: this.type,
                priority: 1,
                fav: false,
                tags: [],
                comments: [],
                color: this.newTask.value.color!,
                resizable: true,
                draggable: true,
                editable: true,
                coordinates: this.coordinates!,
                size: { width: this.defaultWidth, height: this.defaultHeight },
                savedBy: [],
                selectable: false,
                selected: false,
                done: false,
              };

              return this.firestore.collection('tasks').doc(task.id).set(task);
            })
          )
          .subscribe({
            next: () => {
              console.log('Task successfully created!');
              this.newTask.reset();
              this.closeModal();
            },
            error: (error) => {
              console.error('Error creating task: ', error);
            },
          });
      }
    } else {
      console.log('Form is invalid!');
    }
  }

  adjustTextareaHeight(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  closeModal(): void {
    // console.log('close modal triggered');

    this.closeModalEvent.emit();
  }
}
