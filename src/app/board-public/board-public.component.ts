import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute, UrlSegment } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Task } from '../types/task';
import { TaskService } from '../task/task.service';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-board-public',
  templateUrl: './board-public.component.html',
  styleUrls: ['./board-public.component.css'],
})
export class BoardPublicComponent implements OnInit {
  showLoginModal = false;
  showRegModal = false;
  showTaskOpen = false;
  owner: string | null | undefined = '';
  boardName = 'wall';
  activeTask: string | null = null;

  tasks: Task[] = [];
  gridPoints: { x: number; y: number }[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private taskService: TaskService,
    public toastService: ToastService
  ) {}

  ngOnInit() {
    this.route.url.subscribe((segments: UrlSegment[]) => {
      const fullPath = segments.map((segment) => segment.path).join('/');
      this.showLoginModal = fullPath === 'auth/login';
      this.showRegModal = fullPath === 'auth/register';
      this.cdr.detectChanges();
    });

    this.loadTasks();

    console.log(this.showLoginModal);
  }

  ngOnChanges() {
    console.log('Changes detected in BoardPublicComponent');
  }

  ngAfterViewInit(): void {
    console.log('BoardPublicComponent view initialized');
  }

  loadTasks() {
    this.taskService.getPublicTasks().subscribe((tasks: Task[]) => {
      this.tasks = tasks.map((task) => ({
        ...task,
        draggable: false,
      }));
      console.log('board pub - ', this.tasks);

      this.cdr.markForCheck();
    });
  }

  closeModal(): void {
    console.log('close event received in board public');

    // setTimeout(() => {
    //   console.log('close event received in board public');
    //   this.showLoginModal = false;
    //   this.showRegModal = false;
    // }, 0);
    this.showLoginModal = false;
    this.showRegModal = false;
    this.cdr.markForCheck();
  }

  onTaskClick(eventData: { taskId: string; e: MouseEvent }): void {
    eventData.e.stopPropagation();
    this.showTaskOpen = true;
    this.activeTask = eventData.taskId;
    this.cdr.detectChanges();
  }

  onCloseNewTask(): void {
    setTimeout(() => {
      this.showTaskOpen = false;
      this.cdr.detectChanges();
    }, 0);
  }

  goWild() {
    console.log('WILD');
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }
}
