import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { Task, Subtask } from 'src/app/types/task';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from 'src/app/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PointService } from 'src/app/task/point.service';
import { Board } from 'src/app/types/board';
import { BoardService } from '../board.service';
import { Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { take } from 'rxjs';

@Component({
  selector: 'app-board-new',
  templateUrl: './board-new.component.html',
  styleUrls: ['./board-new.component.css'],
})
export class BoardNewComponent {
  @Output() closeBoardModalEvent = new EventEmitter<void>();

  userId = '';
  colors: string[] = ['#FF5733', '#33FF57', '#3357FF', '#FF33A5', '#FFCC33'];
  selectedColor: string = this.colors[0];

  isCreatingBoard = false;

  newBoard = this.fb.group({
    title: ['', Validators.required],
    color: [''],
  });

  constructor(
    private fb: FormBuilder,
    private firestore: AngularFirestore,
    private authService: AuthService,
    private boardService: BoardService,
    private router: Router,
    private point: PointService
  ) {
    console.log('Board NEW Instance created');
  }

  ngOnInit() {
    console.log('Board NEW initialized!');
  }

  newBoardSubmit() {
    // prevent multi submissions -
    // if (this.isCreatingBoard) return;

    // this.isCreatingBoard = true;

    // using take to ensure subscr is done once and fn is not triggered again on login -
    if (this.newBoard.valid) {
      this.authService
        .getUserId()
        .pipe(take(1))
        .subscribe((userId) => {
          if (userId) {
            this.userId = userId;
            const board: Omit<Board, 'id'> = {
              owner: this.userId,
              title: this.newBoard.value.title!,
              color: this.newBoard.value.color!,
              backgroundImage: '',
            };
            this.boardService
              .createBoard(board as Board)
              .then(() => (this.isCreatingBoard = false))
              .catch(() => (this.isCreatingBoard = false));
          } else {
            // this.isCreatingBoard = false;
            console.log('No user is logged in.');
          }
        });
    } else {
      // this.isCreatingBoard = false;
      console.log('Form is invalid!');
    }
  }

  closeBoardModal(): void {
    console.log('closeBoardModal');

    this.closeBoardModalEvent.emit();
  }
}
