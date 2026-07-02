import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
  it('validates the required title and clears the message when typing', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<TaskForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Le titre est requis');
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Titre'), 'Nouvelle tâche');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('submits trimmed values and resets the create form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<TaskForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Titre'), '  Nouvelle tâche  ');
    await user.type(screen.getByLabelText('Description'), '  Important  ');
    await user.click(screen.getByRole('button', { name: 'Ajouter' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Nouvelle tâche',
      description: 'Important',
    });
    expect(screen.getByLabelText('Titre')).toHaveValue('');
    expect(screen.getByLabelText('Description')).toHaveValue('');
  });

  it('keeps edit values visible and calls cancel when provided', async () => {
    const user = userEvent.setup();
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
    await user.clear(screen.getByLabelText('Titre'));
    await user.type(screen.getByLabelText('Titre'), '  Titre modifié  ');
    await user.clear(screen.getByLabelText('Description'));
    await user.click(screen.getByRole('button', { name: 'Modifier' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Titre modifié',
      description: undefined,
    });
    expect(screen.getByLabelText('Titre')).toHaveValue('  Titre modifié  ');

    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
