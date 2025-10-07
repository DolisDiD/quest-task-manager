import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockQuest, mockUser } from '../../utils/testUtils';
import QuestCard from '../OptimizedQuestCard';

// Мокаем framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }) => children
}));

describe('QuestCard', () => {
  const defaultProps = {
    quest: mockQuest,
    onToggle: jest.fn(),
    onExpand: jest.fn(),
    onSubtaskToggle: jest.fn(),
    isExpanded: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders quest information correctly', () => {
    renderWithProviders(<QuestCard {...defaultProps} />);
    
    expect(screen.getByText(mockQuest.title)).toBeInTheDocument();
    expect(screen.getByText(mockQuest.description)).toBeInTheDocument();
    expect(screen.getByText(`${mockQuest.xp} XP`)).toBeInTheDocument();
    expect(screen.getByText(mockQuest.reward)).toBeInTheDocument();
  });

  it('shows correct difficulty styling', () => {
    renderWithProviders(<QuestCard {...defaultProps} />);
    
    const questCard = screen.getByText(mockQuest.title).closest('div');
    expect(questCard).toHaveClass('border-blue-500'); // rare difficulty
  });

  it('calls onToggle when quest is clicked and has no subtasks', () => {
    const questWithoutSubtasks = { ...mockQuest, subtasks: [] };
    
    renderWithProviders(
      <QuestCard 
        {...defaultProps} 
        quest={questWithoutSubtasks}
      />
    );
    
    const toggleButton = screen.getByText('Отметить как выполненное');
    fireEvent.click(toggleButton);
    
    expect(defaultProps.onToggle).toHaveBeenCalledWith(mockQuest.id);
  });

  it('calls onExpand when quest with subtasks is clicked', () => {
    renderWithProviders(<QuestCard {...defaultProps} />);
    
    const expandButton = screen.getByText('Развернуть');
    fireEvent.click(expandButton);
    
    expect(defaultProps.onExpand).toHaveBeenCalledWith(mockQuest.id);
  });

  it('shows subtasks when expanded', () => {
    renderWithProviders(
      <QuestCard 
        {...defaultProps} 
        isExpanded={true}
      />
    );
    
    expect(screen.getByText('Подзадачи:')).toBeInTheDocument();
    expect(screen.getByText('Subtask 1')).toBeInTheDocument();
    expect(screen.getByText('Subtask 2')).toBeInTheDocument();
  });

  it('calls onSubtaskToggle when subtask is clicked', () => {
    renderWithProviders(
      <QuestCard 
        {...defaultProps} 
        isExpanded={true}
      />
    );
    
    const subtask = screen.getByText('Subtask 1').closest('div');
    fireEvent.click(subtask);
    
    expect(defaultProps.onSubtaskToggle).toHaveBeenCalledWith(
      mockQuest.id, 
      'subtask-1'
    );
  });

  it('shows progress bar for multi-step quests', () => {
    renderWithProviders(<QuestCard {...defaultProps} />);
    
    expect(screen.getByText('Прогресс: 0/3')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows completed status for completed quests', () => {
    const completedQuest = { ...mockQuest, completed: true };
    
    renderWithProviders(
      <QuestCard 
        {...defaultProps} 
        quest={completedQuest}
      />
    );
    
    expect(screen.getByText('Выполнено')).toBeInTheDocument();
  });

  it('shows due date correctly', () => {
    renderWithProviders(<QuestCard {...defaultProps} />);
    
    expect(screen.getByText('31 дн.')).toBeInTheDocument();
  });

  it('shows overdue status for overdue quests', () => {
    const overdueQuest = {
      ...mockQuest,
      dueDate: '2020-01-01'
    };
    
    renderWithProviders(
      <QuestCard 
        {...defaultProps} 
        quest={overdueQuest}
      />
    );
    
    const dueDateElement = screen.getByText(/Просрочено/);
    expect(dueDateElement).toBeInTheDocument();
  });

  it('handles quests without due date', () => {
    const questWithoutDueDate = { ...mockQuest, dueDate: null };
    
    renderWithProviders(
      <QuestCard 
        {...defaultProps} 
        quest={questWithoutDueDate}
      />
    );
    
    expect(screen.getByText('Без срока')).toBeInTheDocument();
  });

  it('applies correct styling for different quest types', () => {
    const mainQuest = { ...mockQuest, type: 'main' };
    const sideQuest = { ...mockQuest, type: 'side' };
    
    const { rerender } = renderWithProviders(
      <QuestCard {...defaultProps} quest={mainQuest} />
    );
    
    expect(screen.getByTestId('quest-type-icon')).toBeInTheDocument();
    
    rerender(<QuestCard {...defaultProps} quest={sideQuest} />);
    
    expect(screen.getByTestId('quest-type-icon')).toBeInTheDocument();
  });

  it('handles quests without description', () => {
    const questWithoutDescription = { ...mockQuest, description: null };
    
    renderWithProviders(
      <QuestCard 
        {...defaultProps} 
        quest={questWithoutDescription}
      />
    );
    
    expect(screen.getByText(mockQuest.title)).toBeInTheDocument();
    expect(screen.queryByText(mockQuest.description)).not.toBeInTheDocument();
  });

  it('handles quests without bonus', () => {
    const questWithoutBonus = { ...mockQuest, bonus: null };
    
    renderWithProviders(
      <QuestCard 
        {...defaultProps} 
        quest={questWithoutBonus}
      />
    );
    
    expect(screen.getByText(mockQuest.reward)).toBeInTheDocument();
    expect(screen.queryByText(mockQuest.bonus)).not.toBeInTheDocument();
  });
});








