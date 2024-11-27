import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  authModalType: 'login' | 'register' | null = null;

  isAuthModalVisible = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        // this.isAuthModalVisible = ['/auth/login', '/auth/register'].includes(
        //   event.urlAfterRedirects
        // );

        if (event.urlAfterRedirects === '/auth/login') {
          this.isAuthModalVisible = true;
          this.authModalType = 'login';
        } else if (event.urlAfterRedirects === '/auth/register') {
          this.isAuthModalVisible = true;
          this.authModalType = 'register';
        } else {
          this.isAuthModalVisible = false;
          this.authModalType = null;
        }
      });
  }

  closeModal() {
    this.isAuthModalVisible = false;

    this.router.navigate(['/wall']);
  }
}
