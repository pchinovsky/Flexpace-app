import { Component, OnInit } from '@angular/core';
import { Task } from 'src/app/types/task';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { ChangeDetectorRef } from '@angular/core';
import { PointService } from 'src/app/task/point.service';
import { TaskService } from 'src/app/task/task.service';
import { MatDialog } from '@angular/material/dialog';
import { ModalComponent } from 'src/app/shared/modal/modal.component';
import { CdkDragStart, CdkDragMove, CdkDragEnd } from '@angular/cdk/drag-drop';
import { ViewChildren } from '@angular/core';
import { TaskComponent } from 'src/app/task/task/task.component';
import { QueryList } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { retry } from 'rxjs';
import { TaskOpenComponent } from 'src/app/task/task-open/task-open.component';

@Component({
  selector: 'app-board-default',
  templateUrl: './board-default.component.html',
  styleUrls: ['./board-default.component.css'],
})
export class BoardDefaultComponent implements OnInit {
  @ViewChildren(TaskComponent) taskComponents!: QueryList<TaskComponent>;

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

  defaultSize = { width: 185, height: 235 };
  // taskWidth = 185;
  // taskHeight = 235;
  // snapThreshold = 100;

  clickCoordinates: { x: number; y: number } | null = null;
  // gridPoints: { x: number; y: number }[] = []; // To hold grid points
  gridPoints = this.point.generateGridPoints(27, 27, 50, 50, 50, 50);
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
    private firestore: AngularFirestore
  ) {}

  ngOnInit(): void {
    const fullPath = this.router.url;
    const segments = fullPath.split('/');
    this.boardName = segments.pop() || null;
    console.log('Board Name:', this.boardName);

    this.currentUserId = this.auth.getCurrentUserId();
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

      console.log('Filtered tasks:', this.tasks);
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
      this.taskService.updateTask(task);
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

      this.taskService.updateTask(task);
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
    setTimeout(() => {
      this.showNewTaskForm = false;
      this.showTaskOpen = false;
      // console.log('showNewTaskForm:', this.showNewTaskForm);
      this.cdr.detectChanges();
    }, 0);
  }

  // onTaskClick(e: MouseEvent): void {
  //   this.showTaskOpen = true;

  //   // const el = event.currentTarget as HTMLElement;
  //   // console.log(el.id);

  //   // console.log('task clicked in board');
  //   // event.preventDefault();
  //   // event.stopImmediatePropagation();
  // }
}
