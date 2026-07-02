import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
  it('validates the required title and clears the message when typing', () => {
    const onSubmit = vi.fn();

    render(<TaskForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Le titre est requis');
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Titre'), {
      target: { value: 'Nouvelle tâche' },
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('submits trimmed values and resets the create form', () => {
    const onSubmit = vi.fn();

    render(<TaskForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Titre'), {
      target: { value: '  Nouvelle tâche  ' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: '  Important  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Nouvelle tâche',
      description: 'Important',
    });
    expect(screen.getByLabelText('Titre')).toHaveValue('');
    expect(screen.getByLabelText('Description')).toHaveValue('');
  });

  it('keeps edit values visible and calls cancel when provided', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <TaskForm
        mode="edit"
        initialValues={{ title: 'Ancien titre', description: 'Ancienne description' }}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    expect(screen.getByRole('heading', { name: 'Modifier la tâche' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Titre'), {
      target: { value: '  Titre modifié  ' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Titre modifié',
      description: undefined,
    });
    expect(screen.getByLabelText('Titre')).toHaveValue('  Titre modifié  ');

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
