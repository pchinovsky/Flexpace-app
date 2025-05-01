import { Component, OnInit } from '@angular/core';
import { BoardService } from '../boards/board.service';
import { Board } from '../types/board';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { filter } from 'rxjs';
import { NavigationEnd } from '@angular/router';
import { DragDropService } from '../drag-drop.service';
import { TaskService } from '../task/task.service';
import { take } from 'rxjs';
import { PointService } from '../task/point.service';

@Component({
  selector: 'app-header-boards-nav',
  templateUrl: './header-boards-nav.component.html',
  styleUrls: ['./header-boards-nav.component.css'],
})
export class HeaderBoardsNavComponent implements OnInit {
  boards: Board[] = [];
  currentUserId: string | null = '';
  selectedBoardId: string | null = null;
  currentRoute: string = '';

  isHovered = false;
  private isUpdating: boolean = false;

  constructor(
    private boardService: BoardService,
    private router: Router,
    private auth: AuthService,
    private dragDrop: DragDropService,
    private taskService: TaskService,
    private point: PointService
  ) {}

  ngOnInit() {
    this.currentUserId = this.auth.getCurrentUserId();

    if (this.currentUserId) {
      this.boardService.getBoards().subscribe((data) => {
        this.boards = data.filter(
          (board) => board.owner === this.currentUserId
        );

        console.log('Filtered boards - ', this.boards);
      });
    } else {
      console.log(
        'No user ID available. Unable to fetch user-specific boards.'
      );
    }

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentRoute = this.router.url;
        this.selectedBoardId = null;
      });
  }

  onSelectBoard(boardId: string): void {
    this.selectedBoardId = boardId;
  }

  isStaticRouteSelected(route: string): boolean {
    return this.currentRoute === route;
  }

  onDeleteBoard(boardId: string, boardName: string): void {
    console.log('onDeleteBoard id - ', boardId);

    this.boardService.deleteBoard(boardId, boardName).then(() => {
      console.log('Board and tasks deleted successfully');
      this.router.navigate(['/default']);
    });
  }

  //

  // initial, fixed -
  updateTaskBoard(taskId: string, board: string): void {
    if (!this.currentUserId) {
      console.warn('user ID is not available for task update.');
      return;
    }
    this.point.findAvailableSnapPointForBoard(board).then((newCoordinates) => {
      if (newCoordinates) {
        this.taskService.updateTask(
          { id: taskId, board: board, coordinates: newCoordinates },
          this.currentUserId as string
        );
      } else {
        console.warn(`no available position in board ${board}`);
      }
    });
  }

  //

  onMouseOver(event: MouseEvent, boardTitle: string, boardId: string): void {
    console.log('mouse over on! ');

    const target = event.target as HTMLElement;

    this.dragDrop.dragData$.pipe(take(1)).subscribe((taskId) => {
      console.log('task data?', taskId);

      if (taskId) {
        console.log(`hover on board: ${boardTitle} with task: ${taskId}`);
        this.dragDrop.setHovered(true);
        this.dragDrop.setHoveredBoardId(boardId);
      }
    });
  }

  onMouseOut(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    this.dragDrop.hoveredBoardId$.pipe(take(1)).subscribe((id) => {
      if (id !== null) {
        this.dragDrop.setHovered(false);
        this.dragDrop.setHoveredBoardId(null);
      }
    });
  }

  // fixed flicker, but rerouts, and doesn't revert to initial, if same board -
  onMouseUp(event: MouseEvent, boardTitle: string, boardId?: string): void {
    this.dragDrop.dragData$.pipe(take(1)).subscribe((taskId) => {
      if (taskId) {
        this.updateTaskBoard(taskId, boardTitle);
        this.dragDrop.clearDragData();
      }
    });
  }

  isBoardHovered(boardId: string): boolean {
    let isHovered = false;
    this.dragDrop.hoveredBoardId$.subscribe((id) => {
      isHovered = id === boardId;
    });
    return isHovered;
  }
}
