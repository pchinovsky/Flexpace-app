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
        this.setLastEditedTask(task as Task, userId); // Pass the user ID here
      })
      .catch((error) => console.error('Error updating task:', error));
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
}
