import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Subtask, Task } from '../types/task';
import { Observable } from 'rxjs';
import { combineLatest } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Comment } from '../types/task';
import { switchMap } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ErrorService } from '../shared/error.service';
import { DragDropService } from '../drag-drop.service';
import { arrayUnion, arrayRemove, updateDoc, doc } from 'firebase/firestore';
import { of } from 'rxjs';
import { LastEditedTask } from '../types/task';
import { tap } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private errorService: ErrorService,
    private dragDrop: DragDropService
  ) {}

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
      map(([ownerTasks, savedByTasks]) => [...ownerTasks, ...savedByTasks]),
      this.errorService.errorFeedback('Failed to load tasks. Please try again.')
    );
  }

  getPublicTasks(): Observable<Task[]> {
    return this.firestore
      .collection<Task>('tasks', (ref) => ref.where('public', '==', true))
      .valueChanges()
      .pipe(
        this.errorService.errorFeedback('Failed to load tasks. Please refresh.')
      );
  }

  getTasks(board: string): Observable<Task[]> {
    return this.afAuth.user.pipe(
      switchMap((user) => {
        if (!user) return [];
        return this.firestore
          .collection<Task>('tasks', (ref) =>
            ref.where('board', '==', board).where('owner', '==', user.uid)
          )
          .valueChanges()
          .pipe(
            this.errorService.errorFeedback(
              'Failed to load tasks for this board. Please refresh.'
            )
          );
      })
    );
  }

  getTaskById(taskId: string): Observable<Task> {
    return this.firestore
      .collection<Task>('tasks')
      .doc(taskId)
      .valueChanges()
      .pipe(
        filter((task): task is Task => !!task),
        this.errorService.errorFeedback<Task>(
          'Failed to load the task. Please try again.'
        )
      );
  }

  updateTask(task: Partial<Task>, userId: string) {
    this.firestore
      .collection('tasks')
      .doc(task.id)
      .update(task)
      .then(() => {
        console.log('Task updated');
        this.setLastEditedTask(task.id as string, userId);
      })
      .catch((error) => {
        this.errorService.openErrorModal(
          `Failed to update task ${task.title}.`
        );
        throw error;
      });
  }

  async updateTaskObs(task: Partial<Task>, userId: string): Promise<void> {
    return this.firestore
      .collection('tasks')
      .doc(task.id)
      .update(task)
      .then(() => {
        console.log('Task updated successfully');
        this.setLastEditedTask(task.id as string, userId);
      })
      .catch((error) => {
        console.error('Error updating task:', error);
        throw error;
      });
  }

  async updateSavedBy(
    taskId: string,
    userId: string,
    action: 'add' | 'remove'
  ): Promise<void> {
    const update =
      action === 'add'
        ? { savedBy: arrayUnion(userId) }
        : { savedBy: arrayRemove(userId) };

    return this.firestore
      .collection('tasks')
      .doc(taskId)
      .update(update)
      .then(() => {
        console.log(
          `task ${action === 'add' ? 'saved' : 'unsaved'} successfully.`
        );
      })
      .catch((error) => {
        const errorMessage =
          action === 'add'
            ? 'failed to save task. Please try again.'
            : 'failed to unsave task. Please try again.';

        if (this.errorService.isCriticalError(error)) {
          this.errorService.openErrorModal(errorMessage);
        }
        console.error(
          `failed to ${action === 'add' ? 'save' : 'unsave'} task:`,
          error
        );
        throw error;
      });
  }

  async deleteTask(taskId: string): Promise<void> {
    const commentsRef = this.firestore.collection(`tasks/${taskId}/comments`);

    return commentsRef
      .get()
      .toPromise()
      .then((snapshot) => {
        if (!snapshot!.empty) {
          const batch = this.firestore.firestore.batch();
          snapshot!.forEach((doc) => {
            batch.delete(doc.ref);
          });

          console.log('Deleting all comments for task:', taskId);
          return batch.commit();
        }
        console.log('No comments found for task:', taskId);
        return Promise.resolve();
      })
      .then(() => {
        console.log('Deleting task:', taskId);
        return this.firestore.collection('tasks').doc(taskId).delete();
      })
      .then(() => {
        console.log('Task and associated comments successfully deleted!');
        this.dragDrop.clearDragData();
      })
      .catch((error) => {
        console.error('Error deleting task and/or comments:', error);
        this.errorService.openErrorModal(
          'Failed to delete the task and its comments. Please try again.'
        );
        throw error;
      });
  }

  //

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

  // last edited fn versions without keeping full task in db -

  async setLastEditedTask(taskId: string, userId: string): Promise<void> {
    return this.firestore
      .collection('lastEditedTasks')
      .doc(userId)
      .set({ taskId, userId })
      .then(() => console.log('Last edited task set successfully:', taskId))
      .catch((error) => {
        console.error('Error setting last edited task:', error);
        throw error;
      });
  }

  getLastEditedTask(userId: string): Observable<Task | null> {
    return this.firestore
      .collection<LastEditedTask>('lastEditedTasks')
      .doc(userId)
      .valueChanges()
      .pipe(
        filter((doc): doc is LastEditedTask => !!doc && !!doc.taskId),
        switchMap((doc) =>
          this.firestore
            .collection<Task>('tasks')
            .doc(doc.taskId)
            .valueChanges()
            .pipe(
              filter((task): task is Task => !!task),
              catchError((error) => {
                console.error('Error fetching last edited task:', error);
                return of(null);
              })
            )
        )
      );
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
