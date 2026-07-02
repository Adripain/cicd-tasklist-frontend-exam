import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { useTasks } from '../hooks/useTasks';
import type { Task } from '../types/task';

vi.mock('../hooks/useTasks', () => ({
  useTasks: vi.fn(),
}));

const tasks: Task[] = [
  {
    id: 1,
    title: 'Première tâche',
    description: null,
    completed: false,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 2,
    title: 'Deuxième tâche',
    description: null,
    completed: true,
    createdAt: '2026-01-16T10:00:00Z',
    updatedAt: '2026-01-16T10:00:00Z',
  },
];

function mockUseTasks(overrides = {}) {
  vi.mocked(useTasks).mockReturnValue({
    tasks,
    loading: false,
    error: null,
    loadTasks: vi.fn(),
    addTask: vi.fn(),
    editTask: vi.fn(),
    removeTask: vi.fn(),
    toggleComplete: vi.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('App', () => {
  it('renders task statistics and forwards list actions', async () => {
    const toggleComplete = vi.fn();
    mockUseTasks({ toggleComplete });

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Mes Tâches' })).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Terminées')).toBeInTheDocument();
    expect(screen.getByText('En cours')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('1')).toHaveLength(2);

    fireEvent.click(screen.getByLabelText('Marquer "Première tâche" comme terminée'));

    expect(toggleComplete).toHaveBeenCalledWith(1);
  });

  it('calls addTask from the form', async () => {
    const addTask = vi.fn().mockResolvedValue(undefined);
    mockUseTasks({ tasks: [], addTask });

    render(<App />);

    fireEvent.change(screen.getByLabelText('Titre'), {
      target: { value: 'Nouvelle tâche' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));

    await waitFor(() => {
      expect(addTask).toHaveBeenCalledWith({
        title: 'Nouvelle tâche',
        description: undefined,
      });
    });
  });

  it('swallows addTask errors because the hook owns the error state', async () => {
    const addTask = vi.fn().mockRejectedValue(new Error('Erreur API'));
    mockUseTasks({ tasks: [], addTask });

    render(<App />);

    fireEvent.change(screen.getByLabelText('Titre'), {
      target: { value: 'Nouvelle tâche' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));

    await waitFor(() => {
      expect(addTask).toHaveBeenCalled();
    });
  });
});
