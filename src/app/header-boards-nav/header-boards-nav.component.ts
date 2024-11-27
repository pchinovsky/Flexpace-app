import { Component, OnInit } from '@angular/core';
import { BoardService } from '../boards/board.service';
import { Board } from '../types/board';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { filter } from 'rxjs';
import { NavigationEnd } from '@angular/router';

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

  // isSelected = false;

  constructor(
    private boardService: BoardService,
    private router: Router,
    private auth: AuthService
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

  onDeleteBoard(boardId: string): void {
    console.log('onDeleteBoard id - ', boardId);

    this.boardService.deleteBoard(boardId).then(() => {
      console.log('Board deleted successfully');
      this.router.navigate(['/wall']);
    });
  }
}
