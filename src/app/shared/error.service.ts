import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModalComponent } from './modal/modal.component';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  constructor(private matDialog: MatDialog) {}

  openErrorModal(message: string): void {
    if (this.matDialog.openDialogs.length > 0) {
      this.matDialog.closeAll();
    }
    this.matDialog.open(ModalComponent, {
      data: {
        type: 'error',
        message: message,
      },
      width: '300px',
      panelClass: 'error-modal',
    });
  }

  // errorFeedback<T>(message: string): (source: Observable<T>) => Observable<T> {
  //   return (source: Observable<T>) =>
  //     source.pipe(
  //       catchError((error) => {
  //         this.openErrorModal(message);
  //         return throwError(() => error);
  //       })
  //     );
  // }

  errorFeedback<T>(message: string): (source: Observable<T>) => Observable<T> {
    return (source: Observable<T>) =>
      source.pipe(
        catchError((error) => {
          if (this.isCriticalError(error)) {
            this.openErrorModal(message);
          }
          return throwError(() => error);
        })
      );
  }

  isCriticalError(error: any): boolean {
    if (!error || typeof error !== 'object') return true;

    const benignErrors = ['PERMISSION_DENIED', 'RESOURCE_EXHAUSTED'];
    if (error.code && benignErrors.includes(error.code)) {
      console.warn('Non-critical error:', error.code);
      return false;
    }

    return true;
  }
}
