import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTask, deleteTask, getTask, getTasks, updateTask } from '../api/taskApi';

const mockTask = {
  id: 1,
  title: 'Test',
  description: null,
  completed: false,
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
};

function mockFetch(response: Partial<Response>) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('taskApi', () => {
  it('getTasks returns tasks from the API', async () => {
    const fetchMock = mockFetch({
      ok: true,
      json: () => Promise.resolve([mockTask]),
    });

    await expect(getTasks()).resolves.toEqual([mockTask]);
    expect(fetchMock).toHaveBeenCalledWith('/api/tasks');
  });

  it('getTask returns one task by id', async () => {
    const fetchMock = mockFetch({
      ok: true,
      json: () => Promise.resolve(mockTask),
    });

    await expect(getTask(1)).resolves.toEqual(mockTask);
    expect(fetchMock).toHaveBeenCalledWith('/api/tasks/1');
  });

  it('createTask posts the new task payload', async () => {
    const fetchMock = mockFetch({
      ok: true,
      json: () => Promise.resolve(mockTask),
    });

    await expect(createTask({ title: 'Test' })).resolves.toEqual(mockTask);
    expect(fetchMock).toHaveBeenCalledWith('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test' }),
    });
  });

  it('updateTask sends partial task updates', async () => {
    const updatedTask = { ...mockTask, completed: true };
    const fetchMock = mockFetch({
      ok: true,
      json: () => Promise.resolve(updatedTask),
    });

    await expect(updateTask(1, { completed: true })).resolves.toEqual(updatedTask);
    expect(fetchMock).toHaveBeenCalledWith('/api/tasks/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
  });

  it('deleteTask resolves when the API accepts deletion', async () => {
    const fetchMock = mockFetch({ ok: true });

    await expect(deleteTask(1)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/api/tasks/1', {
      method: 'DELETE',
    });
  });

  it('throws a readable error when a JSON endpoint fails', async () => {
    mockFetch({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Server down'),
    });

    await expect(getTasks()).rejects.toThrow('HTTP 500: Server down');
  });

  it('throws a readable error when delete fails', async () => {
    mockFetch({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not found'),
    });

    await expect(deleteTask(9)).rejects.toThrow('HTTP 404: Not found');
  });
});
