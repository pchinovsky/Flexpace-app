import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DragDropService {
  // to hold task id -
  dragData = new BehaviorSubject<string | null>(null);
  dragData$ = this.dragData.asObservable();

  private hoveredState = new BehaviorSubject<boolean>(false);
  isHovered$ = this.hoveredState.asObservable();

  private hoveredBoardId = new BehaviorSubject<string | null>(null);
  hoveredBoardId$ = this.hoveredBoardId.asObservable();

  setDragData(data: string) {
    this.dragData.next(data);
    console.log('drag data set', data);
  }

  clearDragData() {
    this.dragData.next(null);
    console.log('drag data cleaned');
  }

  setHovered(state: boolean): void {
    this.hoveredState.next(state);
    console.log('hovered set to', state);
  }

  setHoveredBoardId(boardId: string | null): void {
    this.hoveredBoardId.next(boardId);
    console.log('hovered board id set to:', boardId);
  }
}
