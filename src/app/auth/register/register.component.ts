import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { AbstractControl } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  regForm = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(5)]],
      email: ['', [Validators.required, Validators.email]],
      pass: ['', [Validators.required, Validators.minLength(6)]],
      repass: ['', [Validators.required]],
    },
    { validators: this.passwordsMatch }
  );

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  onReg() {
    if (this.regForm.invalid) {
      return;
    }

    // const username = this.regForm.get('name')?.value || '';
    const username = this.regForm.get('name')?.value as string;
    const email = this.regForm.get('email')?.value;
    const password = this.regForm.get('pass')?.value;

    if (!email || !password) {
      console.error('Email or Password is missing');
      return;
    }

    this.authService.reg(username, email, password).subscribe({
      next: () => {
        this.router.navigate(['/default']);
      },
      error: (error) => {
        console.error('Register failed', error);
      },
    });
  }

  passwordsMatch(control: AbstractControl) {
    const pass = control.get('pass')?.value;
    const repass = control.get('repass')?.value;

    // console.log('Password:', pass, 'Repassword:', repass); // Debugging passwords

    return pass === repass ? null : { passwordsNotMatching: true };
  }

  closeModal() {
    // console.log('Emitting close event from RegComponent');

    this.router.navigate(['/wall']);
  }
}
