export type Level = 1 | 2 | 3 | 4;

export interface Issue {
  id: string;
  title: string;
  description?: string;
  importance: Level;
  urgency: Level;
  children: Issue[];
  createdAt: number;
  completed: boolean;
  order: number;
}
