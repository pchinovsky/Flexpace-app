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

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskComponent implements AfterViewInit {
  newSubtaskContent: string = '';
  userId: string | null = '';
  // owner: string | null | undefined = '';
  // userId: string = '';

  @Input() task!: Task;
  @Input() tasks!: Task[];
  @Input() owner!: string | null | undefined;

  // @Input() gridPoints: { x: number; y: number }[] = [];
  @Input() boardElement!: HTMLElement;
  @Input() draggable: boolean = true;
  // @Input() resizable: boolean = true;
  @Input() fixedLayout: boolean = false;

  @Output() resizeEvent = new EventEmitter<any>();
  @Output() dragEndEvent = new EventEmitter<any>();

  @ViewChild('taskBox', { static: false }) taskBox!: ElementRef;

  private isResizing = false;
  private isDragging = false;
  private isClicked = false;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private stepSize = 50;
  private offsetX = 0;
  private offsetY = 0;
  private initialLeft = 0;
  private initialTop = 0;
  private openHeight = '400px';
  private openWidth = '400px';

  isSubContainerOpen = false;
  isControlsOpen = false;
  isSubtaskInputOpen = false;
  isFav = false;
  isPinned = false;
  isDueToday = false;
  isPublished = false;
  selectColorOn = false;
  isOwn = false;

  constructor(
    private renderer: Renderer2,
    public taskService: TaskService,
    private cdr: ChangeDetectorRef,
    private point: PointService,
    private dialog: MatDialog,
    public auth: AuthService,
    private toastService: ToastService
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

    this.userId = this.auth.getCurrentUserId();
    if (this.userId) {
      this.isOwn = this.task.owner === this.userId;
      this.auth.getUserDataById(this.userId).subscribe((data) => {
        this.owner = data?.displayName;
        // console.log(this.owner);
      });
    } else {
      this.isOwn = false;
    }

    if (this.task.type === 'task') {
      this.openHeight = '300px';
      this.openWidth = '300px';
    }

    // this.isOwn = this.task.owner === this.userId ? true : false;
    // console.log(this.isOwn);
    this.cdr.detectChanges();

    // this.auth.getUserId().subscribe((userId) => {
    //   console.log(userId);
    //   console.log(this.task.owner);

    //   this.userId = userId;
    //   console.log(this.userId);
    //   this.isOwn = this.task.owner === this.userId ? true : false;
    //   console.log(this.isOwn);
    // });

    // this.updateDraggable();

    // document.addEventListener('click', (event) => {
    //   console.log('Clicked element:', event.target);
    // });

    // document.addEventListener('pointerdown', (event) => {
    //   console.log('Pointer event target:', event.target);
    // });

    // document.addEventListener('focusin', (event) => {
    //   console.log('Global focus event:', event.target);
    // });

    // console.log(this.isOwn);
    // console.log(this.userId);
    // console.log(this.task.owner);
  }

  // private updateDraggable(): void {}

  onPointerUp(event: PointerEvent): void {
    // const distanceMoved = Math.sqrt(
    //   Math.pow(event.clientX - this.startX, 2) +
    //     Math.pow(event.clientY - this.startY, 2)
    // );
    // if (distanceMoved < 5) {
    //   // this.newTask();
    //   this.onTaskClick(event);
    // }
    // this.startX = 0;
    // this.startY = 0;
  }

  onTaskClick(e: MouseEvent): void {
    // this.isClicked = true;
    if ((e.target as HTMLElement).id === 'rev') return;
    if ((e.target as HTMLElement).id === 'hid') return;
    if ((e.target as HTMLElement).id === 'static') return;
    if ((e.target as HTMLElement).id === 'sub-task-cre') return;
    if (
      (e.target as HTMLElement).id === 'static' ||
      (e.target as HTMLElement).closest('#static')
    )
      return;
    if (
      (e.target as HTMLElement).id === 'sub-input' ||
      (e.target as HTMLElement).closest('.sub-task-cre-input')
    )
      return;
    if (
      (e.target as HTMLElement).id === 'sub-task-cre' ||
      (e.target as HTMLElement).closest('#sub-task-cre')
    ) {
      return;
    }
    if (
      (e.target as HTMLElement).id === 'sub-del' ||
      (e.target as HTMLElement).closest('#sub-del')
    ) {
      return;
    }
    if ((e.target as HTMLElement).classList.contains('resizeHandle')) return;
    if (this.isDragging || this.isResizing || this.isControlsOpen) return;
    console.log('target - ', e.target as HTMLElement);

    // console.log(this.isDragging, this.isResizing);

    const target = e.currentTarget as HTMLElement;
    const taskId = target.getAttribute('data-task-id')!;

    console.log('task clicked now! ', taskId);
    if (target) this.openTaskDetails(taskId);
  }

  openTaskDetails(taskId: string): void {
    // console.log('open task details', this.task.coordinates); // fine here

    this.dialog.open(TaskOpenComponent, {
      data: {
        id: taskId,
        task: structuredClone(this.task),
        own: this.isOwn,
      },
      width: this.openWidth,
      height: this.openHeight,
      panelClass: 'modal',
    });
  }

  focusInput(e: FocusEvent): void {
    const target = e.target as HTMLInputElement;
    target.focus();
    console.log('Input focused progra  mmatically:', target);
  }

  addSubtask(): void {
    // e.stopPropagation();
    // const target = event.target as HTMLElement;

    // if (target.id === 'sub-input' || target.closest('.sub-task-cre-input')) {
    //   console.log('Ignoring click from sub-task input');
    //   return;
    // }

    // if (event) {
    //   // console.log('evebt there');

    //   event.stopPropagation();
    //   event.preventDefault();
    // }

    // event.stopPropagation();
    // event.preventDefault();

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

    this.taskService.updateTask(this.task);

    this.newSubtaskContent = '';

    // this.task.subtasks = [...this.task.subtasks];

    // this.cdr.detectChanges();
  }

  // toggleSubtaskEditable(subtask: Subtask): void {
  //   subtask.editable = !subtask.editable;
  // }

  updateSubtask(subtask: Subtask): void {
    subtask.editable = false;
    this.taskService.updateTask(this.task);
  }

  deleteSubtask(subtask: Subtask): void {
    this.task.subtasks = (this.task.subtasks ?? []).filter(
      (t) => t.id !== subtask.id
    );

    this.taskService.updateTask(this.task);
  }

  //

  // toggleSubtaskInput(): void {
  //   // console.log('input before -', this.isSubtaskInputOpen);

  //   this.isSubtaskInputOpen = !this.isSubtaskInputOpen;
  //   console.log('input after -', this.isSubtaskInputOpen);
  // }

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

  toggleSubContainer(e: MouseEvent): void {
    e.stopPropagation();

    const target = e.target as HTMLElement;

    if (target.id === 'sub-input' || target.closest('.sub-task-cre-input')) {
      console.log('Ignoring click from sub-task input');
      return;
    }

    if (this.isSubContainerOpen) this.addSubtask();

    // console.log('before toggle:', this.isSubContainerOpen);

    this.isSubContainerOpen = !this.isSubContainerOpen;

    // console.log('toggled:', this.isSubContainerOpen);
  }

  toggleControls(e: MouseEvent): void {
    console.log('toggle controls');

    e.stopPropagation();
    this.isControlsOpen = !this.isControlsOpen;
    // console.log('controls - ', this.isControlsOpen);
  }

  selectColor(e: MouseEvent): void {
    this.selectColorOn = !this.selectColorOn;
    console.log('colors on!');
    const color = (e.target as HTMLElement).getAttribute('data-color');
    if (color) {
      this.task.color = color;
      this.taskService.updateTask(this.task);
    }
  }

  // selectBorder(): void {}

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
      // this.isResizing = true;
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
        // console.log(`overlap detected with task titled "${task.title}"`);
        return true;
      }
    }

    // console.log('no overlap detected.');
    return false;
  }

  makeDraggable(box: HTMLElement): void {
    // if (this.isClicked) return;
    if (!this.task.draggable) return;
    box.addEventListener('mousedown', (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
      if (target.classList.contains('text')) return;
      console.log(target.classList.contains('text'));

      // if ((e.target as HTMLElement).id === 'hid') return;
      e.preventDefault();
      // to prevent triggering task details -
      e.stopPropagation();

      this.isDragging = false;
      document.body.style.userSelect = 'none';

      this.offsetX = e.clientX - box.offsetLeft;
      this.offsetY = e.clientY - box.offsetTop;
      this.initialLeft = box.offsetLeft;
      this.initialTop = box.offsetTop;

      // const target = e.target as HTMLElement;

      // key conditions to prevent dragging from single click
      // so dragging isn't triggering a click, but a click is still triggering dragging
      if (target.id === 'rev') return;
      if (target.id === 'hid') return;
      if (target.id === 'task-open') return;
      if (target.id === 'sub-task-cre' || target.closest('#sub-task-cre')) {
        return;
      }
      if (target.id === 'hid' || target.closest('#hid')) {
        return;
      }
      if (this.isControlsOpen) return;
      // if (target.id === 'grid-container') {
      //   return;
      // }
      document.addEventListener('mousemove', this.onDragMove.bind(this, box));
      document.addEventListener('mouseup', this.onDragEnd.bind(this, box));
    });
  }

  onDragMove(box: HTMLElement, e: MouseEvent): void {
    this.isDragging = true;
    const newLeft = e.clientX - this.offsetX;
    const newTop = e.clientY - this.offsetY;

    box.style.left = `${newLeft}px`;
    box.style.top = `${newTop}px`;
  }

  // only dragEnd changed from the working state -
  onDragEnd(box: HTMLElement, e: MouseEvent): void {
    document.body.style.userSelect = 'auto';

    // if ((e.target as HTMLElement).id === 'rev') return;

    const movementX = Math.abs(e.clientX - this.startX);
    const movementY = Math.abs(e.clientY - this.startY);

    const hasMoved = movementX > 15 || movementY > 15;
    if (!hasMoved) {
      this.isDragging = false;
      document.removeEventListener(
        'mousemove',
        this.onDragMove.bind(this, box)
      );
      document.removeEventListener('mouseup', this.onDragEnd.bind(this, box));
      return;
    }

    const newLeft = box.offsetLeft;
    const newTop = box.offsetTop;
    const newWidth = box.offsetWidth;
    const newHeight = box.offsetHeight;

    const closestPoint = this.point.findClosestSnapPointDrag(newLeft, newTop);

    if (closestPoint) {
      const isPositionAvailable = this.point.checkIfPositionIsAvailableDrag(
        closestPoint,
        newWidth,
        newHeight,
        this.tasks,
        this.task.id
      );

      if (isPositionAvailable) {
        box.style.left = `${closestPoint.x}px`;
        box.style.top = `${closestPoint.y}px`;
      } else {
        box.style.left = `${this.initialLeft}px`;
        box.style.top = `${this.initialTop}px`;
      }
    } else {
      box.style.left = `${this.initialLeft}px`;
      box.style.top = `${this.initialTop}px`;
    }

    const snappedPosition = {
      x: parseInt(box.style.left, 10),
      y: parseInt(box.style.top, 10),
    };
    this.task.coordinates = snappedPosition;

    this.dragEndEvent.emit({
      taskId: this.task.id,
      newCoordinates: snappedPosition,
    });

    document.removeEventListener('mousemove', this.onDragMove.bind(this, box));
    document.removeEventListener('mouseup', this.onDragEnd.bind(this, box));

    this.cdr.detectChanges();
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

  onDelete() {
    // console.log('task del on');

    this.taskService.deleteTask(this.task.id);
  }

  // sending toast to uni board
  onSave() {
    if (this.userId) {
      if (!this.task.savedBy.includes(this.userId)) {
        this.task.savedBy.push(this.userId);
        this.taskService.updateTask(this.task);
        this.toastService.show('Task saved!');
      } else {
        this.task.savedBy = this.task.savedBy.filter(
          (id) => id !== this.userId
        );
        this.taskService.updateTask(this.task);
        this.toastService.show('Task unsaved!');
      }
    }
  }

  onDueDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectedDate = new Date(input.value);
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

    this.taskService.updateTask(this.task);
  }
}
