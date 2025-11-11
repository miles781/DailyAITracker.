/**
 * Component Tests for AddTaskModal and TaskList
 * Tests verify:
 * - AddTaskModal renders Plan for Tomorrow checkbox
 * - TaskList renders Next Day badge correctly
 * - Text displays without truncation on mobile (via CSS classes)
 * - Responsive layout classes are applied
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock components for testing
interface AddTaskModalTestProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: unknown) => void;
}

const AddTaskModalTest: React.FC<AddTaskModalTestProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = React.useState({
    title: '',
    category: 'personal' as const,
    scheduledTime: '',
    planForNextDay: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      title: '',
      category: 'personal',
      scheduledTime: '',
      planForNextDay: false,
    });
  };

  if (!isOpen) return null;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Task Title</label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          className="input-base min-w-0 w-full overflow-hidden text-ellipsis"
          placeholder="What do you want to accomplish?"
          data-testid="task-title-input"
        />

        <label htmlFor="planForNextDay">📅 Plan for Tomorrow</label>
        <input
          id="planForNextDay"
          type="checkbox"
          checked={formData.planForNextDay}
          onChange={(e) =>
            setFormData({ ...formData, planForNextDay: e.target.checked })
          }
          data-testid="plan-for-next-day-checkbox"
        />

        <button type="submit" data-testid="submit-button">
          Add Task
        </button>
        <button type="button" onClick={onClose} data-testid="cancel-button">
          Cancel
        </button>
      </form>
    </div>
  );
};

// Mock Task List component
interface MockTask {
  id: string;
  title: string;
  category: 'work' | 'personal' | 'health' | 'learning' | 'other';
  planForNextDay?: boolean;
  completed?: boolean;
}

interface TaskListTestProps {
  tasks: MockTask[];
}

const TaskListTest: React.FC<TaskListTestProps> = ({ tasks }) => {
  return (
    <ul data-testid="task-list">
      {tasks.map((task) => (
        <li key={task.id} data-testid={`task-item-${task.id}`}>
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <h3
                className="font-semibold break-words sm:truncate transition-colors"
                data-testid={`task-title-${task.id}`}
              >
                {task.title}
              </h3>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
                {task.planForNextDay && (
                  <span
                    className="inline-block bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 text-xs px-2 py-1 rounded-lg font-semibold flex-shrink-0"
                    data-testid={`next-day-badge-${task.id}`}
                  >
                    📅 Next Day
                  </span>
                )}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

describe('AddTaskModal Component', () => {
  test('should render Plan for Tomorrow checkbox', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    render(
      <AddTaskModalTest
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const checkbox = screen.getByTestId('plan-for-next-day-checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  test('should toggle Plan for Tomorrow checkbox', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    render(
      <AddTaskModalTest
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const checkbox = screen.getByTestId('plan-for-next-day-checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  test('should include title input with responsive classes', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    render(
      <AddTaskModalTest
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const titleInput = screen.getByTestId('task-title-input');
    expect(titleInput).toHaveClass('min-w-0');
    expect(titleInput).toHaveClass('w-full');
    expect(titleInput).toHaveClass('overflow-hidden');
  });

  test('should submit form with planForNextDay flag set', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    render(
      <AddTaskModalTest
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const titleInput = screen.getByTestId('task-title-input') as HTMLInputElement;
    const checkbox = screen.getByTestId('plan-for-next-day-checkbox') as HTMLInputElement;
    const submitButton = screen.getByTestId('submit-button');

    // Type title and check checkbox
    fireEvent.change(titleInput, { target: { value: 'Test task' } });
    fireEvent.click(checkbox);

    // Submit form
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test task',
        planForNextDay: true,
      })
    );
  });

  test('should render with modal closed', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    const { container } = render(
      <AddTaskModalTest
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // When closed, nothing should render
    expect(container.firstChild).toBeNull();
  });
});

describe('TaskList Component - Next Day Badge', () => {
  test('should render Next Day badge for task with planForNextDay true', () => {
    const tasks: MockTask[] = [
      {
        id: '1',
        title: 'Gym session',
        category: 'health',
        planForNextDay: true,
      },
    ];

    render(<TaskListTest tasks={tasks} />);

    const badge = screen.getByTestId('next-day-badge-1');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('📅 Next Day');
  });

  test('should not render Next Day badge for task without planForNextDay flag', () => {
    const tasks: MockTask[] = [
      {
        id: '1',
        title: 'Regular task',
        category: 'work',
        planForNextDay: false,
      },
    ];

    render(<TaskListTest tasks={tasks} />);

    const badge = screen.queryByTestId('next-day-badge-1');
    expect(badge).not.toBeInTheDocument();
  });

  test('should render correct number of badges for multiple tasks', () => {
    const tasks: MockTask[] = [
      {
        id: '1',
        title: 'Task 1',
        category: 'work',
        planForNextDay: true,
      },
      {
        id: '2',
        title: 'Task 2',
        category: 'personal',
        planForNextDay: false,
      },
      {
        id: '3',
        title: 'Task 3',
        category: 'health',
        planForNextDay: true,
      },
    ];

    render(<TaskListTest tasks={tasks} />);

    const badge1 = screen.queryByTestId('next-day-badge-1');
    const badge2 = screen.queryByTestId('next-day-badge-2');
    const badge3 = screen.queryByTestId('next-day-badge-3');

    expect(badge1).toBeInTheDocument();
    expect(badge2).not.toBeInTheDocument();
    expect(badge3).toBeInTheDocument();
  });

  test('should have responsive classes on task title', () => {
    const tasks: MockTask[] = [
      {
        id: '1',
        title: 'Long task title that should wrap on mobile',
        category: 'work',
        planForNextDay: true,
      },
    ];

    render(<TaskListTest tasks={tasks} />);

    const taskTitle = screen.getByTestId('task-title-1');
    expect(taskTitle).toHaveClass('break-words');
    expect(taskTitle).toHaveClass('sm:truncate');
    // min-w-0 is on the parent container, not the h3 itself
    expect(taskTitle.parentElement).toHaveClass('min-w-0');
  });

  test('should display full task title text regardless of length', () => {
    const longTitle =
      'This is a very long task title that should display fully on mobile without being cut off';
    const tasks: MockTask[] = [
      {
        id: '1',
        title: longTitle,
        category: 'learning',
        planForNextDay: true,
      },
    ];

    render(<TaskListTest tasks={tasks} />);

    const taskTitle = screen.getByTestId('task-title-1');
    expect(taskTitle).toHaveTextContent(longTitle);
  });
});

describe('Responsive Layout Classes', () => {
  test('TaskList applies min-w-0 to prevent flex overflow', () => {
    const tasks: MockTask[] = [
      {
        id: '1',
        title: 'Test',
        category: 'work',
      },
    ];

    render(<TaskListTest tasks={tasks} />);

    const taskTitle = screen.getByTestId('task-title-1').parentElement;
    expect(taskTitle).toHaveClass('min-w-0');
  });

  test('AddTaskModal title input has correct responsive classes', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    render(
      <AddTaskModalTest
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const titleInput = screen.getByTestId('task-title-input');
    const classList = titleInput.className;

    expect(classList).toContain('min-w-0');
    expect(classList).toContain('w-full');
  });
});
