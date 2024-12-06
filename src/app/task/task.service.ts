import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Task } from '../types/task';
import { Observable, of } from 'rxjs';
import { combineLatest } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Comment } from '../types/task';
import firebase from 'firebase/compat/app';
import { arrayUnion } from '@angular/fire/firestore';
import { from } from 'rxjs';
import { tap } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  // private lastEditedTask: any;
  private lastEditedTaskDoc: any = this.firestore.collection('lastEditedTask');

  constructor(private firestore: AngularFirestore) {}

  // real fn -

  getAllTasks(): Observable<Task[]> {
    return this.firestore.collection<Task>('tasks').valueChanges();
  }

  getTasks(board: string | null): Observable<Task[]> {
    return this.firestore
      .collection<Task>('tasks', (ref) => ref.where('board', '==', board))
      .valueChanges();
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

  // setLastEditedTask(task: Task): void {
  //   this.lastEditedTaskDoc.doc('current').set(task);
  // }

  setLastEditedTask(task: Task, userId: string): void {
    this.firestore
      .doc('lastEditedTask/current')
      .set({ ...task, userId })
      .then(() => console.log('last edited task set successfully.'))
      .catch((error) =>
        console.error('error setting last edited task:', error)
      );
  }

  getLastEditedTask(userId: string): Promise<Task | null> {
    const docRef = this.firestore.doc('lastEditedTask/current');

    return docRef
      .get()
      .toPromise()
      .then((docSnapshot: any) => {
        if (docSnapshot.exists) {
          const task = docSnapshot.data();
          if (task.userId === userId) {
            console.log('last edited task retrieved for current user:', task);
            return task as Task;
          } else {
            console.warn('no task edited by the current user.');
            return null;
          }
        } else {
          console.warn('no last edited task found in firestore');
          return null;
        }
      })
      .catch((error) => {
        console.error('rrror retrieving last edited task:', error);
        return null;
      });
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

  addSubtask(taskId: string, subtask: any): Promise<void> {
    return this.firestore
      .collection('tasks')
      .doc(taskId)
      .update({
        subtasks: arrayUnion(subtask),
      });
  }
}
