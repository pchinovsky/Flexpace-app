import { Injectable } from '@angular/core';
import { TaskService } from './task.service';
import { Task } from '../types/task';

@Injectable({
  providedIn: 'root',
})
export class PointService {
  private coordinates: { x: number; y: number } | null = null;
  gridPoints = this.generateGridPoints(27, 27, 50, 50, 50, 50);

  // constructor(private taskService: TaskService) {}

  snapThreshold = 100;

  setCoordinates(coords: { x: number; y: number }) {
    this.coordinates = coords;
  }

  getCoordinates(): { x: number; y: number } | null {
    return this.coordinates;
  }

  clearCoordinates() {
    this.coordinates = null;
  }

  generateGridPoints(
    rows: number,
    cols: number,
    startX: number,
    startY: number,
    spacingX: number,
    spacingY: number
  ): { x: number; y: number }[] {
    const points = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * spacingX;
        const y = startY + row * spacingY;
        points.push({ x, y });
      }
    }
    return points;
  }

  findClosestSnapPointDrag(
    newLeft: number,
    newTop: number
  ): { x: number; y: number } | null {
    let closestPoint: { x: number; y: number } | null = null;
    let minDistance = this.snapThreshold;

    this.gridPoints.forEach((point) => {
      const distance = Math.sqrt(
        Math.pow(point.x - newLeft, 2) + Math.pow(point.y - newTop, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });
    return closestPoint;
  }

  findClosestSnapPointNew(box: { left: number; top: number }) {
    const boxX = box.left;
    const boxY = box.top;

    // let closestPoint = null;
    let closestPoint: { x: number; y: number } | null = null;

    let minDistance = this.snapThreshold;

    this.gridPoints.forEach((point) => {
      const distance = Math.sqrt(
        Math.pow(point.x - boxX, 2) + Math.pow(point.y - boxY, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });

    return closestPoint;
  }

  findAvailableSnapPoint(
    clickX: number,
    clickY: number,
    taskWidth: number,
    taskHeight: number,
    tasks: Task[]
  ): { x: number; y: number } | null {
    // let closestPoint = this.findClosestSnapPoint({ left: clickX, top: clickY });
    let closestPoint: { x: number; y: number } | null =
      this.findClosestSnapPointNew({ left: clickX, top: clickY });

    console.log('board closest point returned', closestPoint);

    if (!closestPoint) {
      console.log('No available snap point found.');
      return null;
    }

    let isPositionAvailable = this.checkIfPositionIsAvailable(
      closestPoint,
      taskWidth,
      taskHeight,
      tasks
    );

    // this.openModal('not enough space for a new task');

    if (!isPositionAvailable) {
      return null;
    } else {
      return closestPoint;
    }
  }

  checkIfPositionIsAvailableDrag(
    closestPoint: { x: number; y: number },
    taskWidth: number,
    taskHeight: number,
    tasks: Task[],
    draggedTaskId: string
  ): boolean {
    for (const task of tasks) {
      if (task.id === draggedTaskId) {
        // console.log(`Skipping dragged task with id: ${task.id}`);
        continue;
      }

      if (
        closestPoint.x < task.coordinates.x + task.size.width &&
        closestPoint.x + taskWidth > task.coordinates.x &&
        closestPoint.y < task.coordinates.y + task.size.height &&
        closestPoint.y + taskHeight > task.coordinates.y
      ) {
        console.log(
          `overlap detected with task at (${task.coordinates.x}, ${task.coordinates.y})`
        );
        return false;
      }
    }

    // console.log(`no overlap`);
    return true;
  }

  // working with new task form onBoardClick -
  checkIfPositionIsAvailable(
    closestPoint: { x: number; y: number },
    taskWidth: number,
    taskHeight: number,
    tasks: Task[]
  ): boolean {
    console.log(
      `checking availability for point: (${closestPoint.x}, ${closestPoint.y}) with width ${taskWidth} and height ${taskHeight}`
    );

    for (const task of tasks) {
      console.log(
        `comparing with task titled "${task.title}" at (${task.coordinates.x}, ${task.coordinates.y}) with width ${task.size.width} and height ${task.size.height}`
      );

      const newTaskLeft = closestPoint.x;
      const newTaskRight = closestPoint.x + taskWidth;
      const newTaskTop = closestPoint.y;
      const newTaskBottom = closestPoint.y + taskHeight;

      const taskLeft = task.coordinates.x;
      const taskRight = task.coordinates.x + task.size.width;
      const taskTop = task.coordinates.y;
      const taskBottom = task.coordinates.y + task.size.height;

      const overlapsX = newTaskRight > taskLeft && newTaskLeft < taskRight;
      const overlapsY = newTaskBottom > taskTop && newTaskTop < taskBottom;

      // console.log(`checking overlap on X: ${overlapsX}`);
      // console.log(`checking overlap on Y: ${overlapsY}`);

      if (overlapsX && overlapsY) {
        console.log(
          `overlap detected with task titled "${task.title}" at (${task.coordinates.x}, ${task.coordinates.y})`
        );
        return false;
      }
    }

    // console.log(`No overlap detected, position is available.`);
    return true;
  }
}
