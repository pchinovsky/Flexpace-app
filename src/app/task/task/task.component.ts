import {
  Component,
  Input,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Renderer2,
} from '@angular/core';
import { Subtask, Task } from 'src/app/types/task';
import { EventEmitter } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { TaskService } from '../task.service';
import { PointService } from '../point.service';
import { MatDialog } from '@angular/material/dialog';
import { ModalComponent } from 'src/app/shared/modal/modal.component';
import { TaskOpenComponent } from '../task-open/task-open.component';
import { ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { ToastService } from 'src/app/toast.service';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { DragDropService } from 'src/app/drag-drop.service';
import { take } from 'rxjs';
import { BoardService } from 'src/app/boards/board.service';
import { BehaviorSubject } from 'rxjs';
import { SubContainerService } from '../sub-containers.service';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskComponent implements AfterViewInit {
  newSubtaskContent: string = '';
  userId: string = '';
  activeTaskId: string = '';

  @Input() task!: Task;
  @Input() tasks!: Task[];
  @Input() owner!: string | null | undefined;

  @Input() boardElement!: HTMLElement;
  @Input() draggable: boolean = true;
  @Input() fixedLayout: boolean = false;
  @Input() readonly: boolean = false;
  @Input() board: string = '';
  @Input() taskOpen!: boolean;

  @Output() resizeEvent = new EventEmitter<any>();
  @Output() dragEndEvent = new EventEmitter<any>();
  @Output() taskClicked = new EventEmitter<{
    taskId: string;
    e: MouseEvent;
  }>();

  @ViewChild('taskBox', { static: false }) taskBox!: ElementRef;
  @ViewChild('picker') datePicker!: any;

  colors: string[] = [
    '#63cdda',
    '#f7d794',
    '#f8a5c2',
    '#f3a683',
    '#45aaf2',
    '#26de81',
    '#fc5c65',
  ];

  private isResizing = false;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private stepSize = 50;
  private offsetX = 0;
  private offsetY = 0;
  private initialLeft = 0;
  private initialTop = 0;
  private openHeight = '550px';
  private openWidth = '800px';

  openSubContainers: Set<string> = new Set();
  openSubContainers$ = new BehaviorSubject<Set<string>>(new Set<string>());

  isSubContainerOpen = false;
  isControlsOpen = false;
  isSubtaskInputOpen = false;
  isFav = false;
  isPinned = false;
  isDueToday = false;
  isPublished = false;
  selectColorOn = false;
  isOwn = false;
  isDatePickerOpen = false;
  canResize = true;
  taskOpenTemp: boolean = false;

  constructor(
    private renderer: Renderer2,
    public taskService: TaskService,
    private cdr: ChangeDetectorRef,
    private point: PointService,
    private dialog: MatDialog,
    public auth: AuthService,
    private toastService: ToastService,
    private dragDrop: DragDropService,
    private boardService: BoardService,
    private subContainerService: SubContainerService
  ) {}

  ngAfterViewInit() {
    const taskElement = this.taskBox?.nativeElement;
    if (taskElement) {
      this.makeDraggable(taskElement);
      this.makeResizable(taskElement);
    }

    this.isFav = this.task.fav;
    this.isPinned = !this.task.draggable;
    this.isDueToday = this.task.today;
    this.isPublished = this.task.public;

    this.userId = this.auth.getCurrentUserId() as string;

    if (this.userId) {
      this.isOwn = this.task.owner === this.userId;
    } else {
      this.isOwn = false;
    }
    this.cdr.detectChanges();

    if (this.task.type === 'task') {
      this.openHeight = '300px';
      this.openWidth = '300px';
    }

    if (this.board === 'filter' || this.board === 'wall')
      this.canResize = false;

    this.cdr.detectChanges();
  }

  onTaskClick(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();

    if ((e.target as HTMLElement).id === 'rev') return;
    if ((e.target as HTMLElement).id === 'hid') return;
    if ((e.target as HTMLElement).id === 'static') return;
    if ((e.target as HTMLElement).id === 'sub-task-cre') return;
    if (
      (e.target as HTMLElement).id === 'static' ||
      (e.target as HTMLElement).closest('#static')
    ) {
      console.log('NOW DEL BIG');
      return;
    }
    if (
      (e.target as HTMLElement).id === 'sub-input' ||
      (e.target as HTMLElement).closest('.sub-task-cre-input')
    )
      return;
    if (
      (e.target as HTMLElement).id === 'sub-task-cre' ||
      (e.target as HTMLElement).closest('#sub-task-cre')
    ) {
      console.log('NOW ADD');

      return;
    }
    if (
      (e.target as HTMLElement).id === 'sub-del' ||
      (e.target as HTMLElement).closest('#sub-del')
    ) {
      console.log('NOW DEL');

      return;
    }
    if ((e.target as HTMLElement).classList.contains('resizeHandle')) return;
    if (this.isDragging || this.isResizing || this.isControlsOpen) return;

    this.boardService.setTaskOpen(true);
    this.taskOpenTemp = true;
    console.log('TASK CLICK - taskOpenTemp? -', this.taskOpenTemp);

    setTimeout(() => {
      this.taskOpenTemp = false;
    }, 1000);

    this.taskClicked.emit({ taskId: this.task.id, e });

    const target = e.currentTarget as HTMLElement;
    const taskId = target.getAttribute('data-task-id')!;

    console.log('task clicked now! ', taskId);
    if (target) {
      this.openTaskDetails(taskId);
    }
  }

  openTaskDetails(taskId: string): void {
    this.dialog.open(TaskOpenComponent, {
      data: {
        id: taskId,
        task: structuredClone(this.task),
        own: this.isOwn,
        board: this.board,
      },
      minWidth: this.openWidth,
      height: this.openHeight,
      panelClass: 'modal',
    });
  }

  focusInput(e: FocusEvent): void {
    const target = e.target as HTMLInputElement;
    target.focus();
    console.log('Input focused programmatically:', target);
  }

  // initial -
  addSubtask(e: Event): void {
    e.stopPropagation();
    e.preventDefault();

    if (!this.newSubtaskContent.trim()) {
      return;
    }

    const newSubtask: Subtask = {
      id: Date.now().toString(),
      content: this.newSubtaskContent.trim(),
      editable: false,
      done: false,
    };

    this.task.subtasks = this.task.subtasks || [];
    this.task.subtasks.push(newSubtask);

    this.newSubtaskContent = '';
  }

  //

  reloadTaskData(): void {
    this.taskService.getTaskById(this.task.id).subscribe((task) => {
      this.task = task;
      console.log('task data reloaded:', this.task);
    });
  }

  updateSubtask(subtask: Subtask): void {
    subtask.editable = false;
    this.taskService.updateTask(this.task, this.userId as string);
    this.cdr.detectChanges();
  }

  deleteSubtask(subtask: Subtask, e: Event): void {
    e.stopPropagation();
    e.preventDefault();

    this.task.subtasks = (this.task.subtasks ?? []).filter(
      (t) => t.id !== subtask.id
    );
  }

  //

  toggleSubtaskInput() {
    this.isSubtaskInputOpen = !this.isSubtaskInputOpen;

    if (this.isSubtaskInputOpen) {
      setTimeout(() => {
        const input = document.getElementById('sub-input') as HTMLInputElement;
        if (input) {
          input.focus();
          console.log('Input focused programmatically:', input);
        } else {
          console.warn('Input element not found.');
        }
      }, 0);
    }
  }

  toggleSubContainer(e: MouseEvent, taskId: string): void {
    e.stopPropagation();

    if (this.subContainerService.isOpen(taskId)) {
      console.log(`closing sub cont for task: ${taskId}`);
      this.subContainerService.delete(taskId);
    } else {
      console.log(`opening sub cont for task: ${taskId}`);
      this.subContainerService.add(taskId);
    }

    this.logOpenSubContainers();

    if (this.subContainerService.areAllClosed()) {
      // check to prevent auth errors for guests on wall -
      if (this.auth.isLogged && this.userId === this.task.owner) {
        this.taskService.updateTask(this.task, this.userId as string);
      }
    }

    this.taskClicked.emit({ taskId: this.task.id, e });
  }

  isOpen(taskId: string): boolean {
    return this.subContainerService.isOpen(taskId);
  }

  logOpenSubContainers(): void {
    console.log(
      'Current open sub-containers:',
      Array.from(this.subContainerService.getOpenSubContainers())
    );
  }

  toggleControls(e: MouseEvent): void {
    e.stopPropagation();
    this.isControlsOpen = !this.isControlsOpen;
  }

  openDatePicker(): void {
    setTimeout(() => {
      const btn = document.querySelector('.due-date-button') as HTMLElement;

      if (btn) {
        const btnPos = btn.getBoundingClientRect().top;
        const relativeTop = this.task.coordinates.y + btnPos;

        const calendarElement = document.querySelector(
          '.mat-calendar'
        ) as HTMLElement;
        if (calendarElement) {
          calendarElement.classList.add(
            relativeTop > 700 ? 'mat-calendar-up' : 'mat-calendar'
          );
        }
      }
    }, 0);

    this.datePicker.open();
  }

  selectColor(e: MouseEvent): void {
    this.selectColorOn = !this.selectColorOn;
    console.log('colors on!');
    const color = (e.target as HTMLElement).getAttribute('data-color');
    if (color) {
      this.task.color = color;
      this.taskService.updateTask(this.task, this.userId as string);
    }
  }

  makeResizable(box: HTMLElement): void {
    if (!this.task.resizable) return;
    const resizeHandle = box.querySelector('.resize-handle') as HTMLElement;
    this.isResizing = false;
    let startX = 0,
      startY = 0,
      startWidth = 0,
      startHeight = 0,
      finalWidth = 0,
      finalHeight = 0;

    resizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      // to prevent triggering task details -
      e.stopPropagation();
      this.isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = box.offsetWidth;
      startHeight = box.offsetHeight;

      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup', onResizeEnd);
    });

    const onResizeMove = (e: MouseEvent) => {
      if (!this.isResizing) return;

      let deltaWidth = e.clientX - startX;
      let deltaHeight = e.clientY - startY;

      deltaWidth = Math.round(deltaWidth / this.stepSize) * this.stepSize;
      deltaHeight = Math.round(deltaHeight / this.stepSize) * this.stepSize;

      let newWidth = startWidth + deltaWidth;
      let newHeight = startHeight + deltaHeight;

      const isOverlapping = this.isOverlappingWhileResizing(
        box,
        box.offsetLeft,
        box.offsetTop,
        newWidth,
        newHeight
      );

      if (!isOverlapping) {
        this.renderer.setStyle(box, 'width', `${newWidth}px`);
        this.renderer.setStyle(box, 'height', `${newHeight}px`);
        finalWidth = newWidth;
        finalHeight = newHeight;
      } else {
        console.log('resizing overlap');
      }
    };

    const onResizeEnd = () => {
      if (finalWidth !== 0 && finalHeight !== 0) {
        this.resizeEvent.emit({
          taskId: this.task.id,
          finalWidth,
          finalHeight,
        });
      }
      this.isResizing = true;
      document.removeEventListener('mousemove', onResizeMove);
      document.removeEventListener('mouseup', onResizeEnd);
    };
  }

  isOverlappingWhileResizing(
    el: HTMLElement,
    newLeft: number,
    newTop: number,
    newWidth: number,
    newHeight: number
  ): boolean {
    const newRight = newLeft + newWidth;
    const newBottom = newTop + newHeight;

    for (const task of this.tasks) {
      if (task.id === this.task.id) continue;

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

  makeDraggable(box: HTMLElement): void {
    if (!this.task.draggable || !this.draggable) return;

    box.addEventListener('mousedown', (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      console.log('DRAG FN - taskOpen? - ', this.taskOpen);
      console.log('DRAG FN - taskOpenTemp? - ', this.taskOpenTemp);
      if (this.taskOpen || this.taskOpenTemp) return;

      if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
      e.preventDefault();
      e.stopPropagation();

      this.isDragging = false;
      document.body.style.userSelect = 'none';

      this.offsetX = e.clientX - box.offsetLeft;
      this.offsetY = e.clientY - box.offsetTop;
      this.initialLeft = box.offsetLeft;
      this.initialTop = box.offsetTop;

      if (target.id === 'rev') return;
      if (target.id === 'hid') return;
      if (target.id === 'sub-task-cre' || target.closest('#sub-task-cre')) {
        return;
      }
      // causing issues? -
      if (target.id === 'sub-del' || target.closest('#sub-del')) {
        return;
      }
      if (target.id === 'hid' || target.closest('#hid')) {
        return;
      }
      if (this.isControlsOpen) return;
      document.addEventListener('mousemove', this.onDragMove.bind(this, box));
      document.addEventListener('mouseup', this.onDragEnd.bind(this, box));
    });
  }

  onDragMove(box: HTMLElement, e: MouseEvent): void {
    // added for box move to new board ---

    if (this.task.done) {
      console.log('task del, no task data.');
      return;
    }

    const movementX = Math.abs(e.clientX - this.startX);
    const movementY = Math.abs(e.clientY - this.startY);

    if (!this.isDragging && (movementX > 5 || movementY > 5)) {
      this.isDragging = true;
      this.dragDrop.setDragData(this.task.id);
      console.log('drag initiated for task:', this.task.id);
    }

    // ---

    const newLeft = e.clientX - this.offsetX;
    const newTop = e.clientY - this.offsetY;

    box.style.left = `${newLeft}px`;
    box.style.top = `${newTop}px`;

    //
  }

  // 3 - adaptation without detecting drop on nav, if it's dropped on a diff board -
  onDragEnd(box: HTMLElement, e: MouseEvent): void {
    document.body.style.userSelect = 'auto';

    const movementX = Math.abs(e.clientX - this.startX);
    const movementY = Math.abs(e.clientY - this.startY);
    const hasMoved = movementX > 15 || movementY > 15;

    document.removeEventListener('mousemove', this.onDragMove.bind(this, box));
    document.removeEventListener('mouseup', this.onDragEnd.bind(this, box));

    if (!hasMoved) {
      console.log('Drag ended without movement');
      this.dragEndEvent.emit({
        taskId: this.task.id,
        newCoordinates: this.task.coordinates,
      });
      return;
    }

    this.dragDrop.isHovered$.pipe(take(1)).subscribe((isHovered) => {
      this.dragDrop.hoveredBoardId$
        .pipe(take(1))
        .subscribe((hoveredBoardId) => {
          if (isHovered && hoveredBoardId) {
            if (this.task.board === hoveredBoardId) {
              // task dropped on the same board
              console.log(
                'Task dropped on the same board, reverting position.'
              );
              box.style.left = `${this.initialLeft}px`;
              box.style.top = `${this.initialTop}px`;
              this.task.coordinates = {
                x: this.initialLeft,
                y: this.initialTop,
              };
            } else {
              // task dropped different board
              console.log('task dropped on a different board:', hoveredBoardId);
              this.task.board = hoveredBoardId;
            }
          } else {
            // drop outside nav
            console.log(
              'dropped outside nav, updating position within the board.'
            );
            const newLeft = box.offsetLeft;
            const newTop = box.offsetTop;

            const closestPoint = this.point.findClosestSnapPointDrag(
              newLeft,
              newTop
            );

            if (closestPoint) {
              const isPositionAvailable =
                this.point.checkIfPositionIsAvailableDrag(
                  closestPoint,
                  this.task.size.width,
                  this.task.size.height,
                  this.tasks,
                  this.task.id
                );

              if (isPositionAvailable) {
                box.style.left = `${closestPoint.x}px`;
                box.style.top = `${closestPoint.y}px`;
                this.task.coordinates = closestPoint;
              } else {
                box.style.left = `${this.initialLeft}px`;
                box.style.top = `${this.initialTop}px`;
                this.task.coordinates = {
                  x: this.initialLeft,
                  y: this.initialTop,
                };
              }
            } else {
              box.style.left = `${this.initialLeft}px`;
              box.style.top = `${this.initialTop}px`;
              this.task.coordinates = {
                x: this.initialLeft,
                y: this.initialTop,
              };
            }
          }

          this.dragEndEvent.emit({
            taskId: this.task.id,
            newCoordinates: this.task.coordinates,
          });

          this.dragDrop.clearDragData();
          this.cdr.detectChanges();
        });
    });
  }

  openModal(message: string): void {
    this.dialog.open(ModalComponent, {
      data: { message },
      width: '300px',
    });
  }

  isOverlapping(
    newLeft: number,
    newTop: number,
    newWidth: number,
    newHeight: number
  ): boolean {
    const newRight = newLeft + newWidth;
    const newBottom = newTop + newHeight;

    for (const task of this.tasks) {
      if (task.id === this.task.id) continue;

      const taskEl = document.getElementById(task.id);
      if (taskEl) {
        const taskRect = taskEl.getBoundingClientRect();

        const boardRect = this.boardElement.getBoundingClientRect();
        const taskLeft =
          taskRect.left - boardRect.left + this.boardElement.scrollLeft;
        const taskTop =
          taskRect.top - boardRect.top + this.boardElement.scrollTop;
        const taskRight = taskLeft + taskRect.width;
        const taskBottom = taskTop + taskRect.height;

        if (
          newLeft < taskRight &&
          newRight > taskLeft &&
          newTop < taskBottom &&
          newBottom > taskTop
        ) {
          return true;
        }
      }
    }

    return false;
  }

  onDelete(e: Event, taskId: string): void {
    e.preventDefault();
    e.stopPropagation();

    this.taskService.deleteTask(taskId).then(() => {
      this.task.done = true;
      console.log('Task cleared from component after deletion.');
    });
  }

  onSave() {
    if (this.userId) {
      if (!this.task.savedBy.includes(this.userId)) {
        this.taskService.updateSavedBy(this.task.id, this.userId, 'add');
        this.toastService.show('Task saved!');
      } else {
        this.taskService.updateSavedBy(this.task.id, this.userId, 'remove');
        this.toastService.show('Task unsaved!');
      }
    }
  }

  //

  onDueDateChange(event: MatDatepickerInputEvent<Date>): void {
    const selectedDate = event.value;

    if (selectedDate) {
      this.task.dueDate = selectedDate;

      const currentDate = new Date();
      const isToday =
        selectedDate.getFullYear() === currentDate.getFullYear() &&
        selectedDate.getMonth() === currentDate.getMonth() &&
        selectedDate.getDate() === currentDate.getDate();

      this.task.today = isToday;

      console.log(
        'due date updated -',
        this.task.dueDate,
        'is today -',
        this.task.today
      );

      this.taskService.updateTask(this.task, this.userId as string);
      this.isDatePickerOpen = false;
    }
  }
}
