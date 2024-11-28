import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { AuthModule } from './auth/auth.module';
import { BoardPublicComponent } from './board-public/board-public.component';
import { ReactiveFormsModule } from '@angular/forms';
import { TaskModule } from './task/task.module';
import { AuthService } from './auth/auth.service';
import { environment } from './environments/environment';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { BoardsModule } from './boards/boards.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button'; // Optional, if you need buttons in your form
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { SharedModule } from './shared/shared.module';
import { HeaderBoardsNavComponent } from './header-boards-nav/header-boards-nav.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TimestampPipe } from './shared/timestamp.pipe';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    BoardPublicComponent,
    HeaderBoardsNavComponent,
    // TimestampPipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AuthModule,
    ReactiveFormsModule,
    TaskModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    BoardsModule,
    BrowserAnimationsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    SharedModule,
    DragDropModule,
  ],
  providers: [AuthService],
  bootstrap: [AppComponent],
})
export class AppModule {}
