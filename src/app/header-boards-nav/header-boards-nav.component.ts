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
      // this.boardService.getBoards().subscribe((data) => {
      //   this.boards = data.filter((board) => {
      //     // console.log('Board Owner:', board.owner);
      //     // console.log('Current User ID:', this.currentUserId);

      //     return board.owner === this.currentUserId;
      //   });

      //   console.log('Filtered boards - ', this.boards);
      // });

      // this.boardService.getBoards().subscribe((data) => {
      //   this.boards = data;

      //   console.log('Filtered boards - ', this.boards);
      // });

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

    // this.router.events.subscribe(() => {
    //   this.currentRoute = this.router.url;
    // });
    //
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentRoute = this.router.url;
        this.selectedBoardId = null;
      });
  }

  onSelectBoard(boardId: string): void {
    this.selectedBoardId = boardId;

    // if (this.selectedBoardId === boardId) {
    //   this.selectedBoardId = null;
    // } else {
    //   this.selectedBoardId = boardId;
    // }
  }

  // isSelected(boardId: string): boolean {
  //   console.log(this.selectedBoardId);
  //   console.log(boardId);

  //   return this.selectedBoardId === boardId;
  // }

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

  // // -------------

  // onDrop(event: DragEvent, boardTitle: string): void {
  //   event.preventDefault();
  //   console.log('onDrop on');

  //   const target = event.target as HTMLElement;
  //   if (target && target.classList.contains('hovered')) {
  //     target.classList.remove('hovered');
  //   }

  //   this.dragDrop.dragData$.subscribe((taskId) => {
  //     if (taskId) {
  //       this.updateTaskBoard(taskId, boardTitle);
  //       this.dragDrop.clearDragData();
  //     }
  //   });
  // }

  // onDragOver(event: DragEvent): void {
  //   event.preventDefault();
  //   console.log('onDragOver triggered');
  // }

  //

  // initial, flickers -
  updateTaskBoard(taskId: string, board: string): void {
    if (!this.currentUserId) {
      console.warn('User ID is not available for task update.');
      return;
    }
    this.point.findAvailableSnapPointForBoard(board).then((newCoordinates) => {
      if (newCoordinates) {
        this.taskService.updateTask(
          { id: taskId, board: board, coordinates: newCoordinates },
          this.currentUserId as string
        );
        console.log(
          `task ${taskId} moved to board ${board} at coordinates`,
          newCoordinates
        );
      } else {
        console.warn(`No available position in board ${board}`);
      }
    });
  }

  // not solving the flicker -
  // updateTaskBoard(taskId: string, board: string): void {
  //   if (!this.currentUserId || this.isUpdating) {
  //     console.warn(
  //       'Update skipped: User ID missing or update already in progress.'
  //     );
  //     return;
  //   }

  //   this.isUpdating = true;

  //   this.point
  //     .findAvailableSnapPointForBoard(board)
  //     .then((newCoordinates) => {
  //       if (newCoordinates) {
  //         this.taskService.updateTask(
  //           { id: taskId, board: board, coordinates: newCoordinates },
  //           this.currentUserId as string
  //         );
  //         console.log(
  //           `Task ${taskId} moved to board ${board} at`,
  //           newCoordinates
  //         );
  //       } else {
  //         console.warn(`No available position in board ${board}`);
  //       }

  //       this.isUpdating = false;
  //     })
  //     .catch((error) => {
  //       console.error('Error updating task board:', error);
  //       this.isUpdating = false;
  //     });
  // }

  //

  onMouseOver(event: MouseEvent, boardTitle: string, boardId: string): void {
    console.log('mouse over on! ');

    const target = event.target as HTMLElement;

    // needs dragData to not be private
    // if (!this.dragDrop.dragData.getValue()) {
    //   return;
    // }

    this.dragDrop.dragData$.pipe(take(1)).subscribe((taskId) => {
      console.log('task data?', taskId);

      if (taskId) {
        console.log(`hover on board: ${boardTitle} with task: ${taskId}`);
        // this.isHovered = true;
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

  // onMouseUp(event: MouseEvent, boardTitle: string, boardId?: string): void {
  // const target = event.target as HTMLElement;

  //   this.dragDrop.dragData$.pipe(take(1)).subscribe((taskId) => {
  //     if (taskId) {
  //       const task = this.taskService.getTaskById(taskId).subscribe((task) => {
  //         if (task.board !== boardTitle) {
  //           console.log(
  //             `mouse up for board: ${boardTitle} with task: ${taskId}`
  //           );
  //           this.updateTaskBoard(taskId, boardTitle);
  //           this.dragDrop.clearDragData();
  //         } else {
  //           return;
  //         }
  //       });
  //     }
  //   });
  // }

  // onMouseUp(event: MouseEvent, boardTitle: string, boardId: string): void {
  //   const target = event.target as HTMLElement;
  //   this.dragDrop.dragData$.pipe(take(1)).subscribe((taskId) => {
  //     if (taskId) {
  //       // if  current board is the hovered one -
  //       this.dragDrop.hoveredBoardId$.pipe(take(1)).subscribe((id) => {
  //         if (id === boardId) {
  //           this.taskService.getTaskById(taskId).subscribe((task) => {
  //             if (task.board !== boardTitle) {
  //               console.log(
  //                 `mouse up on board: ${boardTitle} with task: ${taskId}`
  //               );
  //               this.updateTaskBoard(taskId, boardTitle);
  //               this.dragDrop.clearDragData();
  //             } else {
  //               console.log('task already on this board, no update needed.');
  //             }
  //           });
  //         } else {
  //           console.log('mouse up not on hovered board, ignoring.');
  //         }
  //       });
  //     }
  //   });
  // }

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
