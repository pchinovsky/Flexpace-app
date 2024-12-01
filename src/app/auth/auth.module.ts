import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ProfileComponent } from './profile/profile.component';
import { AuthService } from './auth.service';
import { AuthRoutingModule } from './auth-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { HeaderBoardsNavComponent } from '../header-boards-nav/header-boards-nav.component';
import { TaskModule } from '../task/task.module';

@NgModule({
  declarations: [LoginComponent, RegisterComponent, ProfileComponent],
  imports: [CommonModule, AuthRoutingModule, ReactiveFormsModule, TaskModule],
  exports: [LoginComponent, RegisterComponent, ProfileComponent],
})
export class AuthModule {}
