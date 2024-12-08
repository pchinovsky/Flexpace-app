import { Component } from '@angular/core';
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
import { Board } from 'src/app/types/board';
import { BoardService } from '../board.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import firebase from 'firebase/compat/app';
import { DragDropService } from 'src/app/drag-drop.service';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css'],
})
export class BoardComponent {
  boardId: string | null = null;
  boardData: Board | undefined;
  backgroundImage: string | null = null;

  @ViewChildren(TaskComponent) taskComponents!: QueryList<TaskComponent>;

  openSubContainers: Map<string, boolean> = new Map();

  predefinedImages: string[] = [];

  boardName: string | null = '';
  tempBoardName: string = '';
  activeTask: string | null = null;

  showNewTaskForm = false;
  showTaskOpen = false;
  showModal = false;
  isDragging = false;
  // disableDrag = true;
  isResizing = false;
  editMode = false;
  taskOpen = false;
  private dragStart = false;
  private startX = 0;
  private startY = 0;

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
    private route: ActivatedRoute,
    private boardService: BoardService,
    private point: PointService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private taskService: TaskService,
    private matDialog: MatDialog,
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private auth: AuthService,
    private dragDrop: DragDropService
  ) {}

  ngOnInit(): void {
    // subscribe to route changes to handle boardId changes, to re-run load tasks when
    // custom board is rerouted -
    this.route.paramMap.subscribe((params) => {
      this.boardId = params.get('boardId');

      if (this.boardId) {
        this.loadBoardData(this.boardId);
        this.loadBackgroundImage();
      }
    });

    this.predefinedImages = this.getPredefinedImages();

    this.currentUserId = this.auth.getCurrentUserId();

    const resizeHandle = document.querySelector(
      '.resize-handle'
    ) as HTMLElement;

    if (resizeHandle) {
      resizeHandle.addEventListener('pointerdown', (e: PointerEvent) => {
        // prevent drag on pointerdown in r handle
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

    this.boardService.taskOpen$.subscribe((isOpen) => {
      console.log('-- BOARD - taskOpen? - ', isOpen);
      this.taskOpen = isOpen;
    });
  }

  loadBoardData(boardId: string): void {
    this.boardService.getBoardById(boardId).subscribe((data) => {
      this.boardData = data;

      if (this.boardData && this.boardData.title) {
        this.boardName = this.boardData.title;
      } else {
        this.boardName = 'Default Board';
      }

      if (this.boardData && this.boardData.backgroundImage) {
        this.backgroundImage = this.boardData.backgroundImage;
      } else {
        this.backgroundImage = null;
      }

      if (this.boardData && this.boardData.title) {
        this.loadTasks(this.boardData.title);
      }
    });
  }

  //

  // loadTasks(board: string | null) {
  //   // console.log('load tasks on');
  //   console.log('load tasks - ', board);

  //   if (!board) return;
  //   // if (this.tasks && this.tasks.length > 0) return;
  //   this.taskService.getTasks(board).subscribe((tasks: Task[]) => {
  //     this.tasks = tasks;
  //     // console.log(tasks);
  //     this.cdr.markForCheck();
  //   });
  // }

  loadTasks(board: string | null): void {
    // console.log('load tasks - ', board);

    // fails to prevent reloading when board change -
    // if (!board || this.dragDrop.dragData.getValue()) {
    //   console.log('Skipping load tasks due to drag operation');
    //   return;
    // }

    // if (!board || board === this.boardName) {
    //   console.log('no changes in board, skipping task reload.');
    //   return;
    // }

    // works! moving board without reload ---
    this.taskService.getTasks(board).subscribe((tasks: Task[]) => {
      // console.log('load tasks - ', board);
      // console.log('load tasks - ', this.boardName);

      if (board !== this.boardName) {
        // console.log(`current board mismatch: ${board} vs ${this.boardName}`);
        return;
      }
      this.tasks = tasks;
      // console.log('Tasks loaded for board:', board, tasks);
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
    const target = event.target as HTMLElement;
    // console.log('Event target:', event.target);
    // console.log('Event target:', target);

    if (target.id !== 'grid-container') {
      return;
    }

    //
    // if (
    //   target.id === 'sub-input' ||
    //   target.closest('.sub-task-cre-input')
    // ) {
    //   console.log('if cond true');

    //   return;
    // }

    // if (target.id === 'img-modal') {
    //   return;
    // }
    // if (target.id === 'bgr') {
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

  // findAvailableSnapPoint(
  //   clickX: number,
  //   clickY: number,
  //   taskWidth: number,
  //   taskHeight: number,
  //   tasks: Task[]
  // ) {
  //   // let closestPoint = this.findClosestSnapPoint({ left: clickX, top: clickY });
  //   let closestPoint: { x: number; y: number } | null =
  //     this.point.findClosestSnapPointNew({ left: clickX, top: clickY });

  //   console.log('board closest point returned', closestPoint);

  //   if (!closestPoint) {
  //     console.log('No available snap point found.');
  //     return null;
  //   }

  //   let isPositionAvailable = this.checkIfPositionIsAvailable(
  //     closestPoint,
  //     taskWidth,
  //     taskHeight,
  //     tasks
  //   );

  //   // this.openModal('not enough space for a new task');

  //   if (!isPositionAvailable) {
  //     return null;
  //   } else {
  //     return closestPoint;
  //   }

  //   // If the closest point is occupied, keep searching nearby points
  //   // if (!isPositionAvailable) {
  //   //   for (const point of this.gridPoints) {
  //   //     isPositionAvailable = this.checkIfPositionIsAvailable(
  //   //       point,
  //   //       taskWidth,
  //   //       taskHeight,
  //   //       tasks
  //   //     );
  //   //     if (isPositionAvailable) {
  //   //       closestPoint = point;
  //   //       break;
  //   //     } else {
  //   //       this.openModal('not enough space for a new task');
  //   //     }
  //   //   }
  //   // }

  //   // return closestPoint;
  // }

  // checkIfPositionIsAvailable(
  //   point: { x: number; y: number },
  //   taskWidth: number,
  //   taskHeight: number,
  //   tasks: Task[]
  // ) {
  //   const newLeft = point.x;
  //   const newTop = point.y;
  //   const newRight = newLeft + taskWidth;
  //   const newBottom = newTop + taskHeight;

  //   // FIX REDS -
  //   for (const task of tasks) {
  //     const taskLeft = task.coordinates.x;
  //     const taskTop = task.coordinates.y;
  //     const taskRight = taskLeft + task.size.width;
  //     const taskBottom = taskTop + task.size.height;

  //     if (
  //       newLeft < taskRight &&
  //       newRight > taskLeft &&
  //       newTop < taskBottom &&
  //       newBottom > taskTop
  //     ) {
  //       return false;
  //     }
  //   }

  //   return true;
  // }

  // findClosestSnapPoint(box: { left: number; top: number }) {
  //   const boxX = box.left;
  //   const boxY = box.top;

  //   // let closestPoint = null;
  //   let closestPoint: { x: number; y: number } | null = null;

  //   let minDistance = this.snapThreshold;

  //   this.gridPoints.forEach((point) => {
  //     const distance = Math.sqrt(
  //       Math.pow(point.x - boxX, 2) + Math.pow(point.y - boxY, 2)
  //     );
  //     if (distance < minDistance) {
  //       minDistance = distance;
  //       closestPoint = point;
  //     }
  //   });

  //   return closestPoint;
  // }

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
      if (task.id === currentTaskId) continue;

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

    // if (this.isOverlapping(newLeft, newTop, newWidth, newHeight, taskId)) {
    //   console.log('Overlap detected for task:', taskId);
    // } else {
    //   const task = this.tasks.find((task) => task.id === taskId);
    //   if (task) {
    //     task.size.width = newWidth;
    //     task.size.height = newHeight;
    //     task.coordinates = newCoordinates;
    //   }
    // }

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
    console.log('task dragged - custom board');

    const task: Task | undefined = this.tasks.find(
      (task) => task.id === event.taskId
    );

    if (task) {
      task.coordinates = {
        x: event.newCoordinates.x,
        y: event.newCoordinates.y,
      };

      this.taskService.updateTask(task, this.currentUserId as string);
    } else {
      console.warn(`Task with ID ${event.taskId} not found.`);
    }
  }

  // onDragStarted() {
  //   this.isDragging = true;
  // }

  // onDragStarted(event: CdkDragStart): void {
  //   const targetElement = event.source.element.nativeElement as HTMLElement;

  //   const isResizeHandle = targetElement.querySelector('.resize-handle')?.contains(event.source._dragRef._pointerDownEvent.target as HTMLElement);

  //   if (isResizeHandle) {
  //     return;
  //   }

  //   this.isDragging = true;
  // }

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
    console.log('custom b mod on');

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

  // fails to close form -

  // onCloseNewTask(): void {
  //   // console.log('close event received');
  //   this.showNewTaskForm = false;
  //   console.log('showNewTaskForm:', this.showNewTaskForm);
  //   this.cdr.detectChanges();
  //   // this.cdr.markForCheck();
  // }

  onTaskClosed() {
    console.log('BOARD - CLOSED ev - taskOpen? - ', this.taskOpen);
  }

  onCloseNewTask(): void {
    // this.taskOpen = false;
    console.log('BOARD - CLOSED ev - taskOpen? - ', this.taskOpen);

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
        if (this.boardId) {
          if (selectedBackground === '') {
            // no-img option
            this.setBackgroundImage(null);
          } else if (selectedBackground) {
            this.setBackgroundImage(selectedBackground);
          }
        }
      });
  }

  setBackgroundImage(imageUrl: string | null): void {
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
          console.log(`Upload is ${percentage}% done.`);
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
    if (this.boardId) {
      this.firestore
        .collection('boards')
        .doc(this.boardId)
        .valueChanges()
        .subscribe((boardData: any) => {
          if (boardData?.backgroundImage) {
            this.backgroundImage = boardData.backgroundImage;
            this.cdr.markForCheck();
          } else {
            this.backgroundImage = null;
          }
        });
    }
  }

  deleteBackgroundImage(): void {
    if (this.boardId && this.backgroundImage) {
      const storageRef = this.storage.refFromURL(this.backgroundImage);
      storageRef.delete().subscribe(() => {
        console.log('background image deleted from storage.');

        if (this.boardId) {
          this.firestore.collection('boards').doc(this.boardId).update({
            backgroundImage: firebase.firestore.FieldValue.delete(),
          });
        }

        this.backgroundImage = null;
        this.cdr.markForCheck();
      });
    }
  }

  enableEdit(): void {
    this.editMode = true;
  }

  // updateBoardName(): void {
  //   this.editMode = false;

  //   this.boardService
  //     .updateBoardName(this.boardId as string, this.boardName as string)
  //     .subscribe(() => {
  //       console.log('board name updated');
  //     });
  // }

  updateBoardName(): void {
    this.editMode = false;

    if (this.tempBoardName && this.tempBoardName !== this.boardName) {
      const oldBoardName = this.boardName;
      const newBoardName = this.tempBoardName;

      // board name -
      this.boardService
        .updateBoardName(this.boardId as string, newBoardName)
        .subscribe(
          () => {
            // board tasks board prop -
            this.boardService
              .updateTasksBoardName(oldBoardName as string, newBoardName)
              .then(() => {
                this.boardName = newBoardName;
                this.tempBoardName = '';
              })
              .catch((error) =>
                console.error('error updating tasks with new board -', error)
              );
          },
          (error) => console.error('error updating board - ', error)
        );
    }
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.tempBoardName = target.value;
  }

  //

  toggleSubContainer(taskId: string): void {
    const currentState = this.openSubContainers.get(taskId) ?? false;
    this.openSubContainers.set(taskId, !currentState);
  }

  isSubContainerOpen(taskId: string): boolean {
    return this.openSubContainers.get(taskId) ?? false;
  }

  //

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  trackByTaskKey(index: number, task: Task): string {
    return `${task.id}-${task.coordinates?.x}-${task.coordinates?.y}`;
  }
}
