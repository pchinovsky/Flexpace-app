export interface Task {
  id: string;
  title: string;
  content: string;
  subtasks?: Subtask[];
  createdAt: Date;
  dueDate: Date | null;
  owner: string | null;
  ownerName: string | null | undefined;
  public: boolean;
  board: string | null;
  today: boolean;
  type: string;
  priority: number;
  fav: boolean;
  tags: string[];
  comments?: Comment[];
  color: string;
  resizable: boolean;
  draggable: boolean;
  editable: boolean;
  coordinates: { x: number; y: number };
  size: { width: number; height: number };
  savedBy: string[];
  selectable: boolean;
  selected: boolean;
  done: boolean;
}

export interface Subtask {
  id: string;
  content: string;
  editable: boolean;
  done: boolean;
}

export interface Comment {
  id?: string;
  owner: string;
  ownerName: string;
  content: string;
  timestamp: number;
}

export interface LastEditedTask {
  taskId: string;
  userId: string;
}
