import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Task } from '../types/task';
import { Observable, of } from 'rxjs';

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

  updateTask(task: Partial<Task>) {
    this.firestore
      .collection('tasks')
      .doc(task.id)
      // update only the modified -
      // .set() with { merge: true } alternative - when you don't know what should be updated
      .update(task)
      .then(() => {
        console.log('Task updated successfully');
        this.setLastEditedTask(task as Task);
      })
      .catch((error) => console.error('Error updating task: ', error));
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

  toggleFav(task: Task): void {
    task.fav = !task.fav;
    this.updateTask(task);
  }

  togglePin(task: Task): void {
    task.draggable = !task.draggable;
    this.updateTask(task);
  }

  toggleToday(task: Task): void {
    task.today = !task.today;
    this.updateTask(task);
  }

  togglePublish(task: Task): void {
    task.public = !task.public;
    this.updateTask(task);
  }

  //

  setLastEditedTask(task: Task): void {
    this.lastEditedTaskDoc.doc('current').set(task);
  }

  getLastEditedTask(): Promise<Task | null> {
    const docRef = this.firestore.doc('lastEditedTask/current');
    return (
      docRef
        .get()
        // .get not returning obs, so toPromise needed
        .toPromise()
        .then((docSnapshot: any) => {
          if (docSnapshot.exists) {
            console.log('Last Edited Task Retrieved:', docSnapshot.data());
            return docSnapshot.data() as Task;
          } else {
            console.warn('No last edited task found in Firestore');
            return null;
          }
        })
        .catch((error) => {
          console.error('Error retrieving last edited task:', error);
          return null;
        })
    );
  }
}
