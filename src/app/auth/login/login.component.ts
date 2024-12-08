import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    pass: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  onLogin() {
    if (this.loginForm.invalid) {
      return;
    }

    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('pass')?.value;

    if (!email || !password) {
      console.error('Email or Password is missing');
      return;
    }

    this.authService
      .log(email, password)
      .then((userCredential) => {
        // console.log('Logged in as', userCredential.user);
        // redirection?? -
        // this.logged.emit();
        this.router.navigate(['/default']);
      })
      .catch((error) => {
        console.error('Login failed', error);
      });
  }

  closeModal() {
    // console.log('Emitting close event from LoginComponent');

    // console.log('emitting brake event from login');
    this.router.navigate(['/wall']);
  }
}
