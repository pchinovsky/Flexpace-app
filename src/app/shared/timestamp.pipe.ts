import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timestampToDate',
})
export class TimestampPipe implements PipeTransform {
  transform(value: any): string | null {
    if (!value || !value.seconds) {
      return null;
    }

    const date = new Date(value.seconds * 1000);
    return date.toISOString().split('T')[0];
  }
}
