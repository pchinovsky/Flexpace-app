import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Board } from '../types/board';
import { Observable } from 'rxjs';
import { from } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthService } from '../auth/auth.service';
import { ErrorService } from '../shared/error.service';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private taskOpenSubject = new BehaviorSubject<boolean>(false);
  taskOpen$ = this.taskOpenSubject.asObservable();

  private mockBoards = [
    { id: '1', title: 'Mock Board 1', color: 'This is a mock board.' },
    { id: '2', title: 'Mock Board 2', color: 'Another mock board.' },
  ];

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private authService: AuthService,
    private errorService: ErrorService
  ) {}

  createBoard(board: Omit<Board, 'id'>): Promise<void> {
    console.log('create board in');
    console.log('board in cre b - ', board);

    const boardId = this.firestore.createId();
    return this.firestore
      .collection('boards')
      .doc(boardId)
      .set({
        id: boardId,
        ...board,
      });
  }

  // real fns -

  // getBoards() {
  //   console.log('getting boards');

  //   return this.firestore.collection<Board>('boards').valueChanges();
  // }

  getBoards(): Observable<Board[]> {
    return this.afAuth.user.pipe(
      switchMap((user) => {
        if (!user) return [];
        return this.firestore
          .collection<Board>('boards', (ref) =>
            ref.where('owner', '==', user.uid)
          )
          .valueChanges();
      }),
      this.errorService.errorFeedback(
        'Failed to load boards. Please try again.'
      )
    );
  }

  getBoardById(boardId: string) {
    return this.firestore
      .collection<Board>('boards')
      .doc(boardId)
      .valueChanges();
  }

  // mock fns -

  // getBoards() {
  //   return of(this.mockBoards);
  // }

  // getBoardById(boardId: string) {
  //   const board = this.mockBoards.find((b) => b.id === boardId);
  //   return of(board);
  // }

  //

  // deleteBoard(boardId: string, boardName: string): Promise<void> {
  //   console.log('Deleting board with ID:', boardId);
  //   const userId = this.authService.getCurrentUserId();
  //   return this.firestore
  //     .collection('boards')
  //     .doc(boardId)
  //     .delete()
  //     .then(() => console.log('Board deleted successfully'))
  //     .catch((error) => {
  //       this.errorService.openErrorModal(
  //         'Failed to delete the board. Please try again.'
  //       );
  //       throw error;
  //     });
  // }

  deleteBoard(boardId: string, boardName: string): Promise<void> {
    console.log('deleting board with ID:', boardId);

    const userId = this.authService.getCurrentUserId();

    if (!userId) {
      console.error('user not authenticated.');
      return Promise.reject(new Error('user not authenticated'));
    }

    return this.firestore
      .collection('boards')
      .doc(boardId)
      .delete()
      .then(() => {
        console.log('board deleted successfully');

        return this.firestore
          .collection('tasks', (ref) =>
            ref.where('board', '==', boardName).where('owner', '==', userId)
          )
          .get()
          .toPromise()
          .then((snapshot) => {
            const deleteTasksPromises = snapshot!.docs.map((doc) =>
              this.firestore.collection('tasks').doc(doc.id).delete()
            );

            return Promise.all(deleteTasksPromises);
          });
      })
      .then(() => console.log('all tasks associated with the board deleted'))
      .catch((error) => {
        console.error('failed to delete board or tasks:', error);
        this.errorService.openErrorModal(
          'Failed to delete the board and its tasks. Please try again.'
        );
        throw error;
      });
  }

  //

  // updateBoard(boardId: string, updatedFields: Partial<Board>): Promise<void> {
  //   console.log('Updating board with ID:', boardId);
  //   return this.firestore
  //     .collection('boards')
  //     .doc(boardId)
  //     .update(updatedFields)
  //     .then(() => console.log('Board updated successfully'))
  //     .catch((error) => console.error('Error updating board:', error));
  // }

  updateBoardName(boardId: string, newName: string): Observable<void> {
    return from(
      this.firestore
        .collection('boards')
        .doc(boardId)
        .update({ title: newName })
    ).pipe(
      this.errorService.errorFeedback(
        'Failed to update board name. Please try again.'
      )
    );
  }

  //

  updateTasksBoardName(
    oldBoardName: string,
    newBoardName: string
  ): Promise<void> {
    const currentUserId = this.authService.getCurrentUserId();

    if (!currentUserId) {
      console.error('user is not authenticated??');
      return Promise.reject(new Error('user not authenticated'));
    }

    return this.firestore
      .collection('tasks', (ref) =>
        ref
          .where('board', '==', oldBoardName)
          .where('owner', '==', currentUserId)
      )
      .get()
      .toPromise()
      .then((snapshot) => {
        if (!snapshot || snapshot.empty) {
          console.warn(
            `no tasks for board: ${oldBoardName} and user: ${currentUserId}`
          );
          return;
        }

        const promises = snapshot.docs.map((doc) => {
          console.log(
            `updating task id: ${doc.id} to new board: ${newBoardName}`
          );
          return this.firestore
            .collection('tasks')
            .doc(doc.id)
            .update({ board: newBoardName });
        });

        return Promise.all(promises);
      })
      .then(() => {
        console.log('all task board props updated');
      })
      .catch((error) => {
        this.errorService.openErrorModal(
          'Failed to update tasks for the board. Please try again.'
        );
        throw error;
      });
  }

  //

  setTaskOpen(isOpen: boolean): void {
    this.taskOpenSubject.next(isOpen);
  }
}
