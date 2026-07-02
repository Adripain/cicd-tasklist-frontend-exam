import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TaskItem } from '../components/TaskItem';
import type { Task } from '../types/task';

const baseTask: Task = {
  id: 1,
  title: 'Lire le cahier des charges',
  description: 'Préparer les tests',
  completed: false,
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
};

function renderTaskItem(task: Task = baseTask) {
  const props = {
    task,
    onToggle: vi.fn(),
    onDelete: vi.fn(),
    onEdit: vi.fn(),
  };

  render(<TaskItem {...props} />);
  return props;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('TaskItem', () => {
  it('renders a task and toggles completion', () => {
    const props = renderTaskItem();

    expect(screen.getByText('Lire le cahier des charges')).toBeInTheDocument();
    expect(screen.getByText('Préparer les tests')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Marquer "Lire le cahier des charges" comme terminée'));
    expect(props.onToggle).toHaveBeenCalledWith(1);
  });

  it('renders completed tasks without a description', () => {
    renderTaskItem({
      ...baseTask,
      completed: true,
      description: null,
    });

    expect(screen.getByTestId('task-item')).toHaveClass('task-completed');
    expect(screen.getByLabelText('Marquer "Lire le cahier des charges" comme non terminée')).toBeChecked();
    expect(screen.queryByText('Préparer les tests')).not.toBeInTheDocument();
  });

  it('edits a task with trimmed values', () => {
    const props = renderTaskItem();

    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    fireEvent.change(screen.getByLabelText('Modifier le titre'), {
      target: { value: '  Tests frontend  ' },
    });
    fireEvent.change(screen.getByLabelText('Modifier la description'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(props.onEdit).toHaveBeenCalledWith(1, {
      title: 'Tests frontend',
      description: undefined,
    });
    expect(screen.queryByLabelText('Modifier le titre')).not.toBeInTheDocument();
  });

  it('does not save an empty edit title', () => {
    const props = renderTaskItem();

    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    fireEvent.change(screen.getByLabelText('Modifier le titre'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(props.onEdit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Modifier le titre')).toBeInTheDocument();
  });

  it('cancels edits and restores initial values', () => {
    renderTaskItem();

    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    fireEvent.change(screen.getByLabelText('Modifier le titre'), {
      target: { value: 'Titre temporaire' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    expect(screen.getByLabelText('Modifier le titre')).toHaveValue('Lire le cahier des charges');
  });

  it('asks for delete confirmation before deleting', () => {
    vi.useFakeTimers();
    const props = renderTaskItem();
    const deleteButton = screen.getByRole('button', { name: 'Supprimer' });

    fireEvent.click(deleteButton);
    expect(deleteButton).toHaveTextContent('⚠️');
    expect(props.onDelete).not.toHaveBeenCalled();

    fireEvent.click(deleteButton);
    expect(props.onDelete).toHaveBeenCalledWith(1);
  });

  it('clears delete confirmation after a delay', () => {
    vi.useFakeTimers();
    renderTaskItem();
    const deleteButton = screen.getByRole('button', { name: 'Supprimer' });

    fireEvent.click(deleteButton);
    expect(deleteButton).toHaveTextContent('⚠️');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(deleteButton).toHaveTextContent('🗑️');
  });
});
