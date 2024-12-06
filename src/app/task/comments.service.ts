import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Comment } from '../types/task';

@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  constructor(private firestore: AngularFirestore) {}

  getComments(taskId: string): Observable<Comment[]> {
    return this.firestore
      .collection<Comment>(`tasks/${taskId}/comments`, (ref) =>
        ref.orderBy('timestamp', 'asc')
      )
      .valueChanges();
  }

  addComment(taskId: string, comment: Comment): Promise<void> {
    const commentId = this.firestore.createId();
    return this.firestore
      .collection(`tasks/${taskId}/comments`)
      .doc(commentId)
      .set({ ...comment, id: commentId });
  }
}
