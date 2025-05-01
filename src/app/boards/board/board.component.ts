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
  isResizing = false;
  editMode = false;
  taskOpen = false;
  private dragStart = false;
  private startX = 0;
  private startY = 0;

  defaultSize = { width: 185, height: 235 };

  clickCoordinates: { x: number; y: number } | null = null;
  gridPoints = this.point.generateGridPoints(12, 25, 50, 50, 50, 50);
  tasks: Task[] = [];

  currentUserId: string | null = '' as string;

  constructor(
    private route: ActivatedRoute,
    private boardService: BoardService,
    private point: PointService,
    private cdr: ChangeDetectorRef,
    private taskService: TaskService,
    private matDialog: MatDialog,
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private auth: AuthService
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

  loadTasks(board: string | null): void {
    this.taskService.getTasks(board as string).subscribe((tasks: Task[]) => {
      if (board !== this.boardName) {
        return;
      }
      this.tasks = tasks;
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
      this.onBoardClick(event);
    }

    this.startX = 0;
    this.startY = 0;
  }

  onBoardClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.id !== 'grid-container') {
      return;
    }

    const boardElement = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect();

    const clickX = event.clientX - boardElement.left;
    const clickY = event.clientY - boardElement.top;

    console.log('Click position relative to board:', { x: clickX, y: clickY });

    if ((event.target as HTMLElement).closest('.box')) {
      return;
    }

    const available = this.point.findAvailableSnapPoint(
      clickX,
      clickY,
      this.defaultSize.width,
      this.defaultSize.height,
      this.tasks
    );

    if (available) {
      if (!this.showNewTaskForm) {
        this.point.setCoordinates(available);
      }
      this.showNewTaskForm = true;
    } else {
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
    const { taskId, finalWidth, finalHeight } = event;

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

  onDragStarted(): void {
    if (this.isResizing) {
      return;
    }
    this.isDragging = true;
  }

  onDragEnded() {
    this.isDragging = false;
  }

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

  onTaskClosed() {
    console.log('BOARD - CLOSED ev - taskOpen? - ', this.taskOpen);
  }

  onCloseNewTask(): void {
    console.log('BOARD - CLOSED ev - taskOpen? - ', this.taskOpen);

    setTimeout(() => {
      this.showNewTaskForm = false;
      this.showTaskOpen = false;
      this.cdr.detectChanges();
    }, 0);
  }

  onTaskClick(eventData: { taskId: string; e: MouseEvent }): void {
    eventData.e.stopPropagation();
    this.activeTask = eventData.taskId;
    this.cdr.detectChanges();
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
