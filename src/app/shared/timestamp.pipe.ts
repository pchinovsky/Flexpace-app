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
    const year = date.getFullYear();
    // 0-based month -
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);

    return `${year} ${month} ${day}`;
  }
}
