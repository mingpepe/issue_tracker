export type Level = 1 | 2 | 3;

export interface Issue {
  id: string;
  title: string;
  description?: string;
  importance: Level;
  urgency: Level;
  pendingReason?: string;
  children: Issue[];
  createdAt: number;
  completed: boolean;
  order: number;
}

export interface Tab {
  id: string;
  name: string;
  issues: Issue[];
}
