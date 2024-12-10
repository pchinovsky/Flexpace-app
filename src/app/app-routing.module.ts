import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { BoardPublicComponent } from './board-public/board-public.component';
import { BoardDefaultComponent } from './boards/board-default/board-default.component';
import { authGuard } from './guards/auth.guard';
import { BoardComponent } from './boards/board/board.component';
import { BoardUniversalComponent } from './boards/board-universal/board-universal.component';
import { BoardTodayComponent } from './boards/board-today/board-today.component';
import { RegisterComponent } from './auth/register/register.component';
import { NotFoundComponent } from './not-found/not-found.component';

const routes: Routes = [
  // {
  //   path: 'auth',
  //   loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  // },
  { path: 'auth/login', component: BoardPublicComponent },
  { path: 'auth/register', component: BoardPublicComponent },
  // { path: 'auth/login', component: LoginComponent },
  // { path: 'auth/register', component: RegisterComponent },
  { path: '', pathMatch: 'full', redirectTo: '/wall' },
  { path: 'wall', component: BoardPublicComponent },
  {
    path: 'default',
    component: BoardDefaultComponent,
    canActivate: [authGuard],
  },
  {
    path: 'universal',
    component: BoardUniversalComponent,
    canActivate: [authGuard],
  },
  {
    path: 'today',
    component: BoardTodayComponent,
    canActivate: [authGuard],
  },
  {
    path: 'board/:boardId',
    component: BoardComponent,
    canActivate: [authGuard],
  },
  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: '/404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
