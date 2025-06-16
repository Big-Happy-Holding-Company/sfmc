import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Task, InsertTask } from '../../shared/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TaskLoader {
  private tasksCache: Map<string, Task> = new Map();
  private tasksDirectory = path.join(__dirname, '../data/tasks');

  async loadAllTasks(): Promise<Task[]> {
    try {
      const files = await fs.readdir(this.tasksDirectory);
      const taskFiles = files.filter(file => file.endsWith('.json'));
      
      const tasks: Task[] = [];
      
      for (const file of taskFiles) {
        const task = await this.loadTask(file);
        if (task) {
          tasks.push(task);
        }
      }
      
      return tasks.sort((a, b) => a.id.localeCompare(b.id));
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  }

  async loadTask(filename: string): Promise<Task | null> {
    try {
      const taskId = filename.replace('.json', '');
      
      if (this.tasksCache.has(taskId)) {
        return this.tasksCache.get(taskId)!;
      }

      const filePath = path.join(this.tasksDirectory, filename);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const taskData = JSON.parse(fileContent) as InsertTask;
      
      // Validate required fields
      if (!taskData.id || !taskData.title || !taskData.emojiSet) {
        console.error(`Invalid task data in ${filename}:`, taskData);
        return null;
      }

      const task: Task = {
        ...taskData,
        timeLimit: taskData.timeLimit || null,
        requiredRankLevel: taskData.requiredRankLevel || 1,
        emojiSet: taskData.emojiSet || 'status_main',
        hints: taskData.hints || []
      };

      this.tasksCache.set(taskId, task);
      return task;
    } catch (error) {
      console.error(`Error loading task ${filename}:`, error);
      return null;
    }
  }

  async getTask(taskId: string): Promise<Task | null> {
    return await this.loadTask(`${taskId}.json`);
  }

  clearCache(): void {
    this.tasksCache.clear();
  }
}

export const taskLoader = new TaskLoader();