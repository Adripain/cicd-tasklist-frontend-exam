import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as taskApi from '../api/taskApi';
import { useTasks } from '../hooks/useTasks';
import type { Task, UpdateTaskPayload } from '../types/task';

vi.mock('../api/taskApi', () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

const firstTask: Task = {
  id: 1,
  title: 'Première tâche',
  description: null,
  completed: false,
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
};

const secondTask: Task = {
  id: 2,
  title: 'Deuxième tâche',
  description: 'Déjà faite',
  completed: true,
  createdAt: '2026-01-16T10:00:00Z',
  updatedAt: '2026-01-16T10:00:00Z',
};

function HookHarness() {
  const { tasks, loading, error, loadTasks, addTask, editTask, removeTask, toggleComplete } = useTasks();

  return (
    <div>
      <p data-testid="loading">{loading ? 'loading' : 'ready'}</p>
      <p data-testid="error">{error ?? 'no-error'}</p>
      <p data-testid="count">{tasks.length}</p>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            {task.title} - {task.completed ? 'done' : 'todo'}
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => void loadTasks()}>reload</button>
      <button type="button" onClick={() => void addTask({ title: 'Ajoutée', description: 'Depuis le test' })}>add</button>
      <button type="button" onClick={() => void editTask(1, { title: 'Modifiée' })}>edit</button>
      <button type="button" onClick={() => void removeTask(2)}>remove</button>
      <button type="button" onClick={() => void toggleComplete(1)}>toggle</button>
      <button type="button" onClick={() => void toggleComplete(999)}>toggle missing</button>
    </div>
  );
}

function updatedTask(id: number, data: UpdateTaskPayload): Task {
  return {
    ...firstTask,
    id,
    title: data.title ?? firstTask.title,
    description: data.description ?? firstTask.description,
    completed: data.completed ?? firstTask.completed,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useTasks', () => {
  it('loads tasks and updates local state after create, edit, toggle and delete', async () => {
    vi.mocked(taskApi.getTasks).mockResolvedValue([firstTask, secondTask]);
    vi.mocked(taskApi.createTask).mockResolvedValue({ ...firstTask, id: 3, title: 'Ajoutée', description: 'Depuis le test' });
    vi.mocked(taskApi.updateTask).mockImplementation((id, data) => Promise.resolve(updatedTask(id, data)));
    vi.mocked(taskApi.deleteTask).mockResolvedValue();

    render(<HookHarness />);

    await screen.findByText('Première tâche - todo');
    expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    expect(screen.getByTestId('count')).toHaveTextContent('2');

    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    await screen.findByText('Ajoutée - todo');
    expect(taskApi.createTask).toHaveBeenCalledWith({ title: 'Ajoutée', description: 'Depuis le test' });

    fireEvent.click(screen.getByRole('button', { name: 'edit' }));
    await screen.findByText('Modifiée - todo');
    expect(taskApi.updateTask).toHaveBeenCalledWith(1, { title: 'Modifiée' });

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    await screen.findByText('Première tâche - done');
    expect(taskApi.updateTask).toHaveBeenCalledWith(1, { completed: true });

    fireEvent.click(screen.getByRole('button', { name: 'remove' }));
    await waitFor(() => {
      expect(screen.queryByText('Deuxième tâche - done')).not.toBeInTheDocument();
    });
    expect(taskApi.deleteTask).toHaveBeenCalledWith(2);
  });

  it('does not call the API when toggling an unknown task', async () => {
    vi.mocked(taskApi.getTasks).mockResolvedValue([]);

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });
    fireEvent.click(screen.getByRole('button', { name: 'toggle missing' }));

    expect(taskApi.updateTask).not.toHaveBeenCalled();
  });

  it('stores API error messages from Error instances', async () => {
    vi.mocked(taskApi.getTasks).mockRejectedValue(new Error('API indisponible'));

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('API indisponible');
    });
    expect(screen.getByTestId('loading')).toHaveTextContent('ready');
  });

  it('stores a generic message for unknown errors and clears it on reload', async () => {
    vi.mocked(taskApi.getTasks)
      .mockRejectedValueOnce('erreur brute')
      .mockResolvedValueOnce([secondTask]);

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Une erreur est survenue');
    });

    fireEvent.click(screen.getByRole('button', { name: 'reload' }));
    await screen.findByText('Deuxième tâche - done');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });
});
