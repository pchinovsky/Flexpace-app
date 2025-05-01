import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toastMessage = '';
  toastClass = '';

  show(message: string) {
    this.toastMessage = message;
    this.toastClass = 'slide-in';

    setTimeout(() => {
      this.toastClass = 'slide-out';
    }, 3000);
  }
}
