import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Subtask, Task } from '../types/task';
import { Observable } from 'rxjs';
import { combineLatest } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Comment } from '../types/task';
import { arrayUnion } from '@angular/fire/firestore';
import { switchMap } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { tap } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  // private lastEditedTask: any;
  private lastEditedTaskDoc: any = this.firestore.collection('lastEditedTask');

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {}

  // real fn -

  // getAllTasks(): Observable<Task[]> {
  //   return this.firestore.collection<Task>('tasks').valueChanges();
  // }

  getAllTasks(userId: string): Observable<Task[]> {
    const ownerTasks$ = this.firestore
      .collection<Task>('tasks', (ref) => ref.where('owner', '==', userId))
      .valueChanges();

    const savedByTasks$ = this.firestore
      .collection<Task>('tasks', (ref) =>
        ref.where('savedBy', 'array-contains', userId)
      )
      .valueChanges();

    return combineLatest([ownerTasks$, savedByTasks$]).pipe(
      map(([ownerTasks, savedByTasks]) => [...ownerTasks, ...savedByTasks])
    );
  }

  getPublicTasks(): Observable<Task[]> {
    return this.firestore
      .collection<Task>('tasks', (ref) => ref.where('public', '==', true))
      .valueChanges();
  }

  // getTasks(board: string | null): Observable<Task[]> {
  //   return this.firestore
  //     .collection<Task>('tasks', (ref) => ref.where('board', '==', board))
  //     .valueChanges();
  // }

  getTasks(board: string): Observable<Task[]> {
    return this.afAuth.user.pipe(
      switchMap((user) => {
        if (!user) return [];
        return this.firestore
          .collection<Task>('tasks', (ref) =>
            ref.where('board', '==', board).where('owner', '==', user.uid)
          )
          .valueChanges();
      })
    );
  }

  getTaskById(taskId: string): Observable<Task> {
    return this.firestore
      .collection<Task>('tasks')
      .doc(taskId)
      .valueChanges() as Observable<Task>;
  }

  // updateTask(task: Partial<Task>) {
  //   this.firestore
  //     .collection('tasks')
  //     .doc(task.id)
  //     // update only the modified -
  //     // .set() with { merge: true } alternative - when you don't know what should be updated
  //     .update(task)
  //     .then(() => {
  //       console.log('Task updated successfully');
  //       this.setLastEditedTask(task as Task);
  //     })
  //     .catch((error) => console.error('Error updating task: ', error));
  // }

  updateTask(task: Partial<Task>, userId: string) {
    this.firestore
      .collection('tasks')
      .doc(task.id)
      .update(task)
      .then(() => {
        console.log('Task updated successfully');
        this.setLastEditedTask(task as Task, userId);
      })
      .catch((error) => console.error('Error updating task:', error));
  }

  updateTaskObs(task: Partial<Task>, userId: string): Promise<void> {
    return this.firestore
      .collection('tasks')
      .doc(task.id)
      .update(task)
      .then(() => {
        console.log('Task updated successfully');
        this.setLastEditedTask(task as Task, userId);
      })
      .catch((error) => {
        console.error('Error updating task:', error);
        throw error;
      });
  }

  deleteTask(taskId: string): Promise<void> {
    return this.firestore
      .collection('tasks')
      .doc(taskId)
      .delete()
      .then(() => {
        console.log('Task successfully deleted!');
      })
      .catch((error) => {
        console.error('Error removing task: ', error);
      });
  }

  toggleFav(task: Task, userId: string): void {
    task.fav = !task.fav;
    this.updateTask(task, userId);
  }

  togglePin(task: Task, userId: string): void {
    task.draggable = !task.draggable;
    this.updateTask(task, userId);
  }

  toggleToday(task: Task, userId: string): void {
    task.today = !task.today;
    this.updateTask(task, userId);
  }

  togglePublish(task: Task, userId: string): void {
    task.public = !task.public;
    this.updateTask(task, userId);
  }

  //

  setLastEditedTask(task: Task, userId: string): Promise<void> {
    return this.firestore
      .collection('lastEditedTasks')
      .doc(userId)
      .set({ ...task, userId })
      .then(() => console.log('last edited set'))
      .catch((error) => console.error('error setting last edited:', error));
  }

  getLastEditedTask(userId: string): Observable<Task | null> {
    return this.firestore
      .collection<Task>('lastEditedTasks')
      .doc(userId)
      .valueChanges()
      .pipe(filter((task): task is Task => !!task));
  }

  //

  getTaskWithComments(
    taskId: string
  ): Observable<{ task: Task; comments: Comment[] }> {
    const task$ = this.firestore
      .doc<Task>(`tasks/${taskId}`)
      .valueChanges()
      .pipe(filter((task): task is Task => !!task));

    const comments$ = this.firestore
      .collection<Comment>(`tasks/${taskId}/comments`, (ref) =>
        ref.orderBy('timestamp', 'asc')
      )
      .valueChanges();

    return combineLatest([task$, comments$]).pipe(
      map(([task, comments]) => ({ task, comments }))
    );
  }

  //

  addSubtask(taskId: string, subtask: Subtask): Promise<void> {
    return this.firestore
      .collection('tasks')
      .doc(taskId)
      .update({
        subtasks: arrayUnion(subtask),
      });
  }
}
