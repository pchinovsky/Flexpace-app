import { Injectable } from '@angular/core';
import { TaskService } from '../task/task.service';
import { AuthService } from '../auth/auth.service';
import { Observable, map } from 'rxjs';
import { Task } from '../types/task';

@Injectable({
  providedIn: 'root',
})
export class UserStatsService {
  constructor(
    private taskService: TaskService,
    private authService: AuthService
  ) {}

  getUserOwnedTasks(): Observable<Task[]> {
    const userId = this.authService.getCurrentUserId();

    return this.taskService
      .getAllTasks()
      .pipe(map((tasks) => tasks.filter((task) => task.owner === userId)));
  }

  getUserOwnedTaskCount(): Observable<number> {
    return this.getUserOwnedTasks().pipe(map((tasks) => tasks.length));
  }

  //

  getUserSavedTasks(): Observable<Task[]> {
    const userId = this.authService.getCurrentUserId();

    return this.taskService
      .getAllTasks()
      .pipe(
        map((tasks) =>
          tasks.filter((task) => task.savedBy.includes(userId as string))
        )
      );
  }

  getUserSavedTaskCount(): Observable<number> {
    return this.getUserSavedTasks().pipe(map((tasks) => tasks.length));
  }

  //

  getUserTasksSavedByOthers(): Observable<Task[]> {
    const userId = this.authService.getCurrentUserId();

    return this.taskService
      .getAllTasks()
      .pipe(
        map((tasks) =>
          tasks.filter(
            (task) =>
              task.owner === userId &&
              task.savedBy &&
              task.savedBy.length > 0 &&
              task.savedBy.some((savedUserId) => savedUserId !== userId)
          )
        )
      );
  }

  getUserTasksSavedByOthersCount(): Observable<number> {
    return this.getUserTasksSavedByOthers().pipe(map((tasks) => tasks.length));
  }

  //

  getUserPublishedTasks(): Observable<Task[]> {
    const userId = this.authService.getCurrentUserId();

    return this.taskService
      .getAllTasks()
      .pipe(
        map((tasks) =>
          tasks.filter((task) => task.owner === userId && task.public === true)
        )
      );
  }

  getUserPublishedTasksCount(): Observable<number> {
    return this.getUserPublishedTasks().pipe(map((tasks) => tasks.length));
  }
}
