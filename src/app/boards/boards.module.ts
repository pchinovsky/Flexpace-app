import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardDefaultComponent } from './board-default/board-default.component';
import { TaskModule } from '../task/task.module';
import { BoardNewComponent } from './board-new/board-new.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BoardComponent } from './board/board.component';
import { BoardUniversalComponent } from './board-universal/board-universal.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { BoardTodayComponent } from './board-today/board-today.component';

@NgModule({
  declarations: [
    BoardDefaultComponent,
    BoardNewComponent,
    BoardComponent,
    BoardUniversalComponent,
    BoardTodayComponent,
  ],
  imports: [
    CommonModule,
    TaskModule,
    SharedModule,
    ReactiveFormsModule,
    DragDropModule,
    FormsModule,
  ],
  exports: [BoardNewComponent, BoardComponent],
})
export class BoardsModule {}
