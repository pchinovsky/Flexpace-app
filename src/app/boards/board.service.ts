import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Board } from '../types/board';
import { of } from 'rxjs';
import { Observable } from 'rxjs';
import { from } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

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

  constructor(private firestore: AngularFirestore) {}

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

  getBoards() {
    console.log('getting boards');

    return this.firestore.collection<Board>('boards').valueChanges();
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

  deleteBoard(boardId: string): Promise<void> {
    console.log('Deleting board with ID:', boardId);
    return this.firestore
      .collection('boards')
      .doc(boardId)
      .delete()
      .then(() => console.log('Board deleted successfully'))
      .catch((error) => console.error('Error deleting board:', error));
  }

  updateBoard(boardId: string, updatedFields: Partial<Board>): Promise<void> {
    console.log('Updating board with ID:', boardId);
    return this.firestore
      .collection('boards')
      .doc(boardId)
      .update(updatedFields)
      .then(() => console.log('Board updated successfully'))
      .catch((error) => console.error('Error updating board:', error));
  }

  updateBoardName(boardId: string, newName: string): Observable<void> {
    return from(
      this.firestore
        .collection('boards')
        .doc(boardId)
        .update({ title: newName })
    );
  }

  //

  updateTasksBoardName(
    oldBoardName: string,
    newBoardName: string
  ): Promise<void> {
    return this.firestore
      .collection('tasks', (ref) => ref.where('board', '==', oldBoardName))
      .get()
      .toPromise()
      .then((snapshot) => {
        const promises = snapshot!.docs.map((doc) => {
          return this.firestore
            .collection('tasks')
            .doc(doc.id)
            .update({ board: newBoardName });
        });

        return Promise.all(promises);
      })
      .then(() => {
        console.log('all task board prop updated');
      })
      .catch((error) => {
        console.error('error updating tasks -', error);
      });
  }

  //

  setTaskOpen(isOpen: boolean): void {
    this.taskOpenSubject.next(isOpen);
  }
}
