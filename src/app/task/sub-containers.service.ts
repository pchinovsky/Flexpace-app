import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SubContainerService {
  private openSubContainers: Set<string> = new Set();

  add(taskId: string): void {
    this.openSubContainers.add(taskId);
  }

  delete(taskId: string): void {
    this.openSubContainers.delete(taskId);
  }

  isOpen(taskId: string): boolean {
    return this.openSubContainers.has(taskId);
  }

  areAllClosed(): boolean {
    return this.openSubContainers.size === 0;
  }

  getOpenSubContainers(): Set<string> {
    return this.openSubContainers;
  }
}
