import { Component, OnInit } from '@angular/core';
import { Task } from 'src/app/types/task';
import { TaskService } from 'src/app/task/task.service';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { ToastService } from 'src/app/toast.service';

@Component({
  selector: 'app-board-universal',
  templateUrl: './board-universal.component.html',
  styleUrls: ['./board-universal.component.css'],
})
export class BoardUniversalComponent implements OnInit {
  showTaskOpen = false;

  tasks: Task[] = [];
  filteredTasks: Task[] = [];

  toggleFilters: { [key: string]: boolean } = {
    public: false,
    today: false,
    fav: false,
    done: false,
    saved: false,
  };

  colors: string[] = ['#FF5733', '#33FF57', '#3357FF', '#FF33A5', '#FFCC33'];
  selectedColor: string | null = null;
  currentUserId: string | null = '' as string;

  constructor(
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
    public toastService: ToastService
  ) {}

  ngOnInit(): void {
    // this.taskService.getAllTasks().subscribe((tasks: Task[]) => {
    //   // Set draggable to false for all tasks on this board
    //   this.tasks = tasks.map((task) => ({ ...task, draggable: false }));
    //   this.filteredTasks = [...this.tasks];
    // });

    this.currentUserId = this.auth.getCurrentUserId();

    this.taskService.getAllTasks().subscribe((tasks: Task[]) => {
      this.tasks = tasks
        .filter((task) => {
          if (!this.currentUserId) {
            return false;
          }
          return (
            task.owner === this.currentUserId ||
            (task.savedBy && task.savedBy.includes(this.currentUserId))
          );
        })
        .map((task) => ({ ...task, draggable: false }));

      this.filteredTasks = [...this.tasks];
    });
  }

  getToggleRules(): string[] {
    return Object.keys(this.toggleFilters);
  }

  onToggleFilter(rule: string): void {
    this.toggleFilters[rule] = !this.toggleFilters[rule];
    this.applyFilters();
  }

  onColorFilterChange(color: string): void {
    if (this.selectedColor === color) {
      this.selectedColor = null;
    } else {
      this.selectedColor = color;
    }
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredTasks = this.tasks.filter((task) => {
      let match = true;

      for (const rule in this.toggleFilters) {
        if (this.toggleFilters[rule]) {
          if (rule === 'saved') {
            if (this.currentUserId) {
              match =
                match &&
                task.owner !== this.currentUserId &&
                task.savedBy?.includes(this.currentUserId);
            } else {
              match = false;
            }
          } else if (task.hasOwnProperty(rule)) {
            match = match && task[rule as keyof Task] === true;
          }
        }
      }

      if (this.selectedColor) {
        match = match && task.color === this.selectedColor;
      }

      return match;
    });
  }

  onTaskClick(e: MouseEvent): void {
    this.showTaskOpen = true;
  }

  onCloseNewTask(): void {
    setTimeout(() => {
      this.showTaskOpen = false;
      this.cdr.detectChanges();
    }, 0);
  }
}
