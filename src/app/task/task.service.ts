import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Task } from '../types/task';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  // mockTasks: Task[] = [
  //   {
  //     id: '1',
  //     title: 'Complete Angular Project',
  //     content: 'Finish the Angular project for the final assessment.',
  //     subtasks: [],
  //     createdAt: new Date('2023-11-10'),
  //     dueDate: new Date('2023-11-20'),
  //     owner: 'user123',
  //     public: true,
  //     board: 'default',
  //     today: true,
  //     type: 'task',
  //     priority: 1,
  //     fav: false,
  //     tags: ['Angular', 'Project'],
  //     color: '#ff6347',
  //     resizable: true,
  //     draggable: true,
  //     editable: true,
  //     coordinates: { x: 100, y: 150 },
  //     size: { width: 150, height: 200 },
  //     savedBy: ['user456'],
  //     selectable: true,
  //     selected: false,
  //     done: false,
  //   },
  //   {
  //     id: '2',
  //     title: 'Grocery Shopping',
  //     content: 'Buy groceries for the week.',
  //     subtasks: [],
  //     createdAt: new Date('2023-11-12'),
  //     dueDate: new Date('2023-11-15'),
  //     owner: 'user123',
  //     public: false,
  //     board: 'default',
  //     today: false,
  //     type: 'task',
  //     priority: 2,
  //     fav: true,
  //     tags: ['Shopping', 'Weekly'],
  //     color: '#87cefa',
  //     resizable: true,
  //     draggable: true,
  //     editable: true,
  //     coordinates: { x: 400, y: 250 },
  //     size: { width: 120, height: 200 },
  //     savedBy: ['user789'],
  //     selectable: true,
  //     selected: false,
  //     done: false,
  //   },
  // ];

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

  // mock fn -

  // getTasks(board: string | null): Observable<Task[]> {
  //   return of(
  //     this.mockTasks.filter((task) => task.board === board || board === null)
  //   );
  // }

  updateTask(task: Partial<Task>) {
    this.firestore
      .collection('tasks')
      .doc(task.id)
      // update only the modified -
      // .set() with { merge: true } alternative - when you don't know what should be updated
      .update(task)
      .then(() => console.log('Task updated successfully'))
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
}
