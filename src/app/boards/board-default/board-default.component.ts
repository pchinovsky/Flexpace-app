import { Component, OnInit } from '@angular/core';
import { Task } from 'src/app/types/task';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { ChangeDetectorRef } from '@angular/core';
import { PointService } from 'src/app/task/point.service';
import { TaskService } from 'src/app/task/task.service';
import { MatDialog } from '@angular/material/dialog';
import { ModalComponent } from 'src/app/shared/modal/modal.component';
import { ViewChildren } from '@angular/core';
import { TaskComponent } from 'src/app/task/task/task.component';
import { QueryList } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { finalize } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Component({
  selector: 'app-board-default',
  templateUrl: './board-default.component.html',
  styleUrls: ['./board-default.component.css'],
})
export class BoardDefaultComponent implements OnInit {
  @ViewChildren(TaskComponent) taskComponents!: QueryList<TaskComponent>;

  boardId: string | null = null;
  boardName: string | null = '';
  showNewTaskForm = false;
  showTaskOpen = false;
  showModal = false;
  isDragging = false;
  // disableDrag = true;
  isResizing = false;
  private dragStart = false;
  private startX = 0;
  private startY = 0;

  backgroundImage: string | null = null;
  predefinedImages: string[] = [];
  activeTask: string | null = null;

  defaultSize = { width: 185, height: 235 };
  // taskWidth = 185;
  // taskHeight = 235;
  // snapThreshold = 100;

  clickCoordinates: { x: number; y: number } | null = null;
  // gridPoints: { x: number; y: number }[] = []; // To hold grid points
  gridPoints = this.point.generateGridPoints(12, 25, 50, 50, 50, 50);
  tasks: Task[] = [];

  currentUserId: string | null = '' as string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private point: PointService,
    private taskService: TaskService,
    private matDialog: MatDialog,
    private firestore: AngularFirestore,
    private storage: AngularFireStorage
  ) {}

  ngOnInit(): void {
    const fullPath = this.router.url;
    const segments = fullPath.split('/');
    this.boardName = segments.pop() || null;
    console.log('Board Name:', this.boardName);

    this.predefinedImages = this.getPredefinedImages();
    console.log('backgrounds - ', this.predefinedImages);

    this.currentUserId = this.auth.getCurrentUserId();
    this.loadBackgroundImage();
    // this.gridPoints = this.generateGridPoints(27, 27, 50, 50, 50, 50);
    this.loadTasks(this.boardName);

    const resizeHandle = document.querySelector(
      '.resize-handle'
    ) as HTMLElement;

    resizeHandle.addEventListener('pointerdown', (e: PointerEvent) => {
      e.stopPropagation();
      this.isResizing = true;

      document.addEventListener(
        'pointerup',
        () => {
          this.isResizing = false;
        },
        { once: true }
      );
    });
  }

  // FIX - see only own tasks for def board
  loadTasks(board: string | null) {
    if (!board) return;
    if (this.tasks && this.tasks.length > 0) return;

    this.taskService.getTasks(board).subscribe((tasks: Task[]) => {
      this.tasks = tasks.filter((task: Task) => {
        return task.owner === this.currentUserId;
      });

      console.log('filtered tasks default:', this.tasks);
      this.cdr.markForCheck();
    });
  }

  onBoardPointerDown(event: PointerEvent) {
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.dragStart = false;
  }

  onBoardPointerUp(event: PointerEvent) {
    const distanceMoved = Math.sqrt(
      Math.pow(event.clientX - this.startX, 2) +
        Math.pow(event.clientY - this.startY, 2)
    );

    if (distanceMoved < 5) {
      // this.newTask();
      this.onBoardClick(event);
    }

    this.startX = 0;
    this.startY = 0;
  }

  onBoardClick(event: MouseEvent) {
    console.log('board CLICKED - default');

    const target = event.target as HTMLElement;
    // console.log('Event target:', event.target);
    console.log('Event target:', target);

    if (target.id !== 'grid-container') {
      return;
    }

    // if (target.id === 'sub-input' || target.closest('.sub-task-cre-input')) {
    //   // console.log('if cond true');

    //   return;
    // }

    const boardElement = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect();

    const clickX = event.clientX - boardElement.left;
    const clickY = event.clientY - boardElement.top;

    console.log('Click position relative to board:', { x: clickX, y: clickY });

    // closest looks for an ancestor, not parent.
    if ((event.target as HTMLElement).closest('.box')) {
      // console.log('Click originated from a task, preventing new task form.');
      return;
    }
    // const clickX = event.clientX;
    // const clickY = event.clientY - window.scrollY;

    // console.log(window.scrollY);

    // console.log('board def click coords', clickX, clickY);

    const available = this.point.findAvailableSnapPoint(
      clickX,
      clickY,
      this.defaultSize.width,
      this.defaultSize.height,
      this.tasks
    );

    if (available) {
      // console.log('board def avail coords', available);

      if (!this.showNewTaskForm) {
        this.point.setCoordinates(available);
      }
      this.showNewTaskForm = true;
      // console.log('Coordinates set for new task:', available);
    } else {
      // console.log('Not enough space to add a new task at this location.');
      if (!this.showNewTaskForm)
        this.openModal('Not enough space for a new task');
    }
  }

  isOverlapping(
    newLeft: number,
    newTop: number,
    newWidth: number,
    newHeight: number,
    currentTaskId: string
  ): boolean {
    const newRight = newLeft + newWidth;
    const newBottom = newTop + newHeight;

    for (const task of this.tasks) {
      if (task.id === currentTaskId) continue; // Skip the current task

      const taskLeft = task.coordinates.x;
      const taskTop = task.coordinates.y;
      const taskRight = taskLeft + task.size.width;
      const taskBottom = taskTop + task.size.height;

      if (
        newLeft < taskRight &&
        newRight > taskLeft &&
        newTop < taskBottom &&
        newBottom > taskTop
      ) {
        return true;
      }
    }
    return false;
  }

  onTaskResized(event: any) {
    // console.log('resize event received');

    const { taskId, finalWidth, finalHeight } = event;
    // console.log(id, idd, iddd);

    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.size = { width: finalWidth, height: finalHeight };
      this.taskService.updateTask(task, this.currentUserId as string);
    }
  }

  onTaskDragged(event: {
    taskId: string;
    newCoordinates: { x: number; y: number };
  }) {
    // if (this.showTaskOpen) return;

    console.log('task dragged - default board');
    // console.log(event.newCoordinates);

    const task: Task | undefined = this.tasks.find(
      (task) => task.id === event.taskId
    );

    if (task) {
      task.coordinates = {
        x: event.newCoordinates.x,
        y: event.newCoordinates.y,
      };

      this.taskService.updateTask(task, this.currentUserId as string);
      this.cdr.detectChanges();
    } else {
      console.warn(`Task with ID ${event.taskId} not found.`);
    }
  }

  onDragStarted(): void {
    if (this.isResizing) {
      return;
    }
    // this.isDragging = false;
    this.isDragging = true;
  }

  // onDragMoved(event: CdkDragMove, taskId: string) {
  //   const task = this.tasks.find(t => t.id === taskId);
  //   if (task) {
  //     task.coordinates = event.pointerPosition;
  //   }
  // }

  onDragEnded() {
    // setTimeout(() => {
    //   this.isDragging = false;
    // }, 50);
    this.isDragging = false;
    // this.cdr.detectChanges();
  }

  // newTask() {
  //   console.log('1', this.isDragging);
  //   setTimeout(() => {
  //     console.log('2', this.isDragging);

  //     if (!this.isDragging) {
  //       this.showNewTaskForm = true;
  //     }
  //   }, 0);
  // }

  newTask() {
    if (!this.isDragging) {
      this.showNewTaskForm = true;
    }
  }

  openModal(message: string): void {
    console.log('def mod on');

    if (this.matDialog.openDialogs.length > 0) {
      this.matDialog.closeAll();
    }
    this.matDialog.open(ModalComponent, {
      data: {
        type: 'error',
        message: message,
      },
      width: '300px',
      panelClass: 'error-modal',
    });
  }

  onCloseNewTask(): void {
    console.log('DEFAULT - event received! ');

    setTimeout(() => {
      this.showNewTaskForm = false;
      this.showTaskOpen = false;
      // console.log('showNewTaskForm:', this.showNewTaskForm);
      this.cdr.detectChanges();
    }, 0);
  }

  onTaskClick(eventData: { taskId: string; e: MouseEvent }): void {
    eventData.e.stopPropagation();
    // eventData.e.preventDefault();

    // console.log('BOARD TASK CL ON');

    // this.showTaskOpen = true;
    // this.taskOpen = true;
    this.activeTask = eventData.taskId;
    this.cdr.detectChanges();

    // console.log('ACTIVE -', this.activeTask);
    // console.log('BOARD - taskOpen? - ', this.taskOpen);

    // const el = event.currentTarget as HTMLElement;
    // console.log(el.id);

    // console.log('task clicked in board');
    // event.preventDefault();
    // event.stopImmediatePropagation();
  }

  openBackgroundSelectionModal(): void {
    this.matDialog
      .open(ModalComponent, {
        data: {
          type: 'backgroundSelection',
          predefinedImages: this.predefinedImages,
        },
        width: '500px',
        panelClass: 'background-selection-modal',
      })
      .afterClosed()
      .subscribe((selectedBackground: string | null) => {
        if (selectedBackground === '') {
          // No image selected
          this.setBackgroundImage(null);
        } else if (selectedBackground) {
          this.setBackgroundImage(selectedBackground);
        }
      });
  }

  setBackgroundImage(imageUrl: string | null): void {
    if (this.currentUserId) {
      this.auth
        .updateDefaultBoardImage(this.currentUserId, imageUrl)
        .then(() => {
          this.backgroundImage = imageUrl;
          this.cdr.markForCheck();
          console.log('default board image saved successfully.');
          console.log(this.backgroundImage);
        })
        .catch((error) => {
          console.error('error saving default board image:', error);
        });
    }
  }

  selectBackgroundImage(imageUrl: string): void {
    if (this.boardId) {
      this.firestore
        .collection('boards')
        .doc(this.boardId)
        .update({
          backgroundImage: imageUrl,
        })
        .then(() => {
          this.backgroundImage = imageUrl;
          this.cdr.markForCheck();
          console.log('background image updated successfully.');
        })
        .catch((error) => {
          console.error('error updating background image:', error);
        });
    }
  }

  getPredefinedImages(): string[] {
    const folderPath = 'backgrounds';
    const images: string[] = [];
    const imageNames = [
      'B1.jpg',
      'B2.jpg',
      'B3.jpg',
      'B4.jpg',
      'B5.jpg',
      'B6.jpg',
      'B7.jpg',
      'B8.jpg',
    ];

    imageNames.forEach((imageName) => {
      const fileRef = this.storage.ref(`${folderPath}/${imageName}`);
      fileRef.getDownloadURL().subscribe((url) => {
        images.push(url);
        console.log();
        console.log('fetched image url:', url);
      });
    });

    return images;
  }

  addBackgroundImage(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file && this.boardId) {
        const filePath = `backgrounds/${this.boardId}/${file.name}`;
        const fileRef = this.storage.ref(filePath);
        const task = this.storage.upload(filePath, file);

        task.percentageChanges().subscribe((percentage) => {
          console.log(`upload is ${percentage}% done.`);
        });

        task
          .snapshotChanges()
          .pipe(
            finalize(() => {
              fileRef.getDownloadURL().subscribe((url) => {
                this.backgroundImage = url;
                this.cdr.markForCheck();

                if (this.boardId) {
                  this.firestore.collection('boards').doc(this.boardId).update({
                    backgroundImage: url,
                  });
                }
              });
            })
          )
          .subscribe();
      }
    };
    input.click();
  }

  loadBackgroundImage(): void {
    if (this.currentUserId) {
      this.auth
        .getDefaultBoardImage(this.currentUserId)
        .subscribe((imageUrl) => {
          if (imageUrl) {
            this.backgroundImage = imageUrl;
            this.cdr.markForCheck();
          } else {
            this.backgroundImage = null;
          }
        });
    }
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  trackByTaskKey(index: number, task: Task): string {
    return `${task.id}-${task.coordinates?.x}-${task.coordinates?.y}`;
  }
}
