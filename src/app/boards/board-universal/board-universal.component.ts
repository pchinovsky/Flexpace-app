import { Component, OnInit } from '@angular/core';
import { Task } from 'src/app/types/task';
import { TaskService } from 'src/app/task/task.service';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { ToastService } from 'src/app/toast.service';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-board-universal',
  templateUrl: './board-universal.component.html',
  styleUrls: ['./board-universal.component.css'],
})
export class BoardUniversalComponent implements OnInit {
  showTaskOpen = false;

  searchControl: FormControl = new FormControl('');
  searchTerm: string = '';

  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  boardName = 'filter';
  activeTask: string | null = null;

  toggleFilters: { [key: string]: boolean } = {
    public: false,
    today: false,
    fav: false,
    saved: false,
  };

  colors: string[] = [
    '#63cdda',
    '#f7d794',
    '#f8a5c2',
    '#f3a683',
    '#45aaf2',
    '#26de81',
    '#fc5c65',
  ];
  selectedColor: string | null = null;
  currentUserId: string | null = '' as string;

  constructor(
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
    public toastService: ToastService
  ) {}

  // ngOnInit(): void {
  //   // this.taskService.getAllTasks().subscribe((tasks: Task[]) => {
  //   //   // draggable to false for tasks in uni board -
  //   //   this.tasks = tasks.map((task) => ({ ...task, draggable: false }));
  //   //   this.filteredTasks = [...this.tasks];
  //   // });

  //   this.currentUserId = this.auth.getCurrentUserId();

  //   this.taskService.getAllTasks().subscribe((tasks: Task[]) => {
  //     this.tasks = tasks
  //       .filter((task) => {
  //         if (!this.currentUserId) {
  //           return false;
  //         }
  //         return (
  //           task.owner === this.currentUserId ||
  //           (task.savedBy && task.savedBy.includes(this.currentUserId))
  //         );
  //       })
  //       .map((task) => ({ ...task, draggable: false }));

  //     this.filteredTasks = [...this.tasks];
  //   });
  // }

  ngOnInit(): void {
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

    this.searchControl.valueChanges
      .pipe(debounceTime(300))
      .subscribe((value: string) => {
        this.searchTerm = value.toLowerCase();
        this.filterTasks();
      });
  }

  filterTasks(): void {
    if (!this.searchTerm) {
      this.filteredTasks = [...this.tasks];
    } else {
      this.filteredTasks = this.tasks.filter((task) => {
        return (
          task.title.toLowerCase().includes(this.searchTerm) ||
          (task.content && task.content.toLowerCase().includes(this.searchTerm))
        );
      });
    }
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

  onTaskClick(eventData: { taskId: string; e: MouseEvent }): void {
    this.showTaskOpen = true;
    this.activeTask = eventData.taskId;
  }

  onCloseNewTask(): void {
    setTimeout(() => {
      this.showTaskOpen = false;
      this.cdr.detectChanges();
    }, 0);
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }
}
