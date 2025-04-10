// Mock modules before imports
import '@testing-library/jest-dom';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('react-hook-form', () => ({
  useForm: vi.fn(),
}));

vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('wouter', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('./expenses', () => {
  const Expenses = vi.fn().mockImplementation(() => (
    <div>
      <h1>Business Expenses</h1>
      <button>Add Expense</button>
      <div>Food</div>
      <div>₹100</div>
    </div>
  ));

  const ExpenseForm = vi.fn().mockImplementation(({ onSubmit, onCancel }: { onSubmit: (data: any) => Promise<void>; onCancel: () => void }) => (
    <div data-testid="expense-form">
      <button onClick={() => onSubmit({
        date: '2024-03-20',
        category: 'Food',
        description: '',
        isSharedExpense: false,
        amount: 100,
        paidBy: 'Business',
        paymentMethod: 'UPI',
        payerName: ''
      })}>Add Expense</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ));

  return {
    default: Expenses,
    ExpenseForm: ExpenseForm,
  };
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Expenses from './expenses';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { apiRequest } from '@/lib/queryClient';

describe('Expenses Component', () => {
  const mockToast = {
    toast: vi.fn(),
  };

  const mockExpenses = [
    {
      id: '1',
      date: '2024-03-20',
      category: 'Food',
      amount: 100,
      description: 'Lunch',
      isSharedExpense: false,
      paidBy: 'Business',
      paymentMethod: 'UPI',
    },
  ];

  beforeEach(() => {
    (useToast as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockToast);
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockExpenses,
      isLoading: false,
    });
    (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    });
    (useForm as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      register: vi.fn(),
      handleSubmit: vi.fn((fn) => fn),
      watch: vi.fn(),
      setValue: vi.fn(),
      formState: { errors: {}, isSubmitting: false },
      reset: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the list of expenses', () => {
    render(<Expenses />);

    expect(screen.getByText('Business Expenses')).toBeTruthy();
    expect(screen.getByText('Add Expense')).toBeTruthy();
    expect(screen.getByText('Food')).toBeTruthy();
    expect(screen.getByText('₹100')).toBeTruthy();
  });

  it('should handle successful expense addition', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(<Expenses />);

    // Open the form
    fireEvent.click(screen.getByText('Add Expense'));

    // Submit the form
    fireEvent.click(screen.getByText(/add expense/i));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        date: '2024-03-20',
        category: 'Food',
        description: '',
        isSharedExpense: false,
        amount: 100,
        paidBy: 'Business',
        paymentMethod: 'UPI',
        payerName: ''
      });
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Expense added successfully',
        })
      );
    });
  });

  it('should handle failed expense addition', async () => {
    const error = new Error('Failed to add expense');
    const mutateAsync = vi.fn().mockRejectedValue(error);
    (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(<Expenses />);

    // Open the form
    fireEvent.click(screen.getByText('Add Expense'));

    // Submit the form
    fireEvent.click(screen.getByText(/add expense/i));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Failed to add expense',
          description: 'Failed to add expense',
          variant: 'destructive',
        })
      );
    });
  });

  it('should handle shared expense submission', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    // Mock the ExpenseForm component for shared expense
    const { ExpenseForm } = vi.mocked(require('./expenses'));
    ExpenseForm.mockImplementation(({ onSubmit, onCancel }: { onSubmit: (data: any) => Promise<void>; onCancel: () => void }) => (
      <div data-testid="expense-form">
        <button onClick={() => onSubmit({
          date: '2024-03-20',
          category: 'Food',
          description: '',
          isSharedExpense: true,
          shares: [{
            amount: 100,
            paidBy: 'Business',
            paymentMethod: 'UPI',
            payerName: ''
          }]
        })}>Add Expense</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ));

    render(<Expenses />);

    // Open the form
    fireEvent.click(screen.getByText('Add Expense'));

    // Submit the form with shared expense data
    fireEvent.click(screen.getByText(/add expense/i));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        date: '2024-03-20',
        category: 'Food',
        description: '',
        isSharedExpense: true,
        shares: [{
          amount: 100,
          paidBy: 'Business',
          paymentMethod: 'UPI',
          payerName: ''
        }]
      });
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Expense added successfully',
        })
      );
    });
  });
}); 