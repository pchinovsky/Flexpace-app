import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Observable, of } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { UrlSegment } from '@angular/router';
import { UserProfile } from '../types/user';
import { tap } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  // taking the obs var from auth, but still has to be obs -
  isLoggedIn$: Observable<boolean> = of(false);
  userData$: Observable<UserProfile | undefined> | undefined;
  currentUserId: string | null = '' as string;

  newBoardForm = false;
  showRegModal = false;
  showLoginModal = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // directly assigned, and isLoggedIn$ returns an obs as well; so templ needs async pipe;
    // otherwise need to subscr here to the auth var and isLoggedIn$ will be static -
    this.isLoggedIn$ = this.authService.isLogged$;

    // this.currentUserId = this.authService.getCurrentUserId();
    // console.log('user - ', this.currentUserId);

    this.authService.getUserId().subscribe((userId) => {
      this.currentUserId = userId;
      console.log('Current User ID:', this.currentUserId);

      if (this.currentUserId) {
        this.userData$ = this.authService
          .getUserDataById(this.currentUserId)
          .pipe(
            tap((data) => {
              console.log('Data received from Firestore:', data);
            })
          );
      } else {
        console.warn('No user logged in');
      }
    });

    this.userData$ = this.authService
      .getUserDataById(this.currentUserId as string)
      .pipe(
        tap((data) => {
          console.log('Data received from Firestore:', data);
        }),
        tap(() => {
          console.log('Fetching user data for ID:', this.currentUserId);
        })
      );

    //

    this.route.url.subscribe((segments: UrlSegment[]) => {
      const fullPath = segments.map((segment) => segment.path).join('/');
      // console.log(`Current path: ${fullPath}`);

      // checking the path -
      this.showLoginModal = fullPath === 'auth/login';
      this.showRegModal = fullPath === 'auth/register';
      console.log(`modal to be shown - ${this.showLoginModal}`);

      // this.authService.logged.subscribe(() => {
      //   this.closeModal('logged');
      // });

      this.cdr.detectChanges();
    });
  }
  openLoginModal() {
    // this.router.navigate(['/auth/login'], { skipLocationChange: true });
    console.log('open triggered');

    this.router.navigate(['/auth/login']);
    // this.showLoginModal = true;

    // this.router.navigate([], {
    //   relativeTo: this.route,
    //   queryParams: { modal: 'login' },
    //   queryParamsHandling: 'merge',
    // });
  }

  openRegModal() {
    this.router.navigate(['auth/register']);
  }

  newBoard() {
    console.log('new board called');

    this.newBoardForm = true;
  }

  onCloseNewBoard() {
    console.log('onCloseNewBoard');

    setTimeout(() => {
      this.newBoardForm = false;
      // console.log('showNewTaskForm:', this.showNewTaskForm);
      this.cdr.detectChanges();
    }, 0);
  }

  onLogout() {
    // this.authService.logout();
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigateByUrl('/wall').then(() => {
          window.location.reload();
        });
        console.log('logged out successfully');
      },
      error: (err) => {
        console.error('logout failed:', err);
      },
    });
  }
}
