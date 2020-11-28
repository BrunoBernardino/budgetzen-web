import React, { useState } from 'react';
import styled from 'styled-components';
import moment from 'moment';

import Expense from 'components/Expense';
import ExpenseModal from 'components/ExpenseModal';
import FilterBudgetModal from 'components/FilterBudgetModal';
import IconButton from 'components/IconButton';
import { colors, fontSizes } from 'lib/constants';
import * as T from 'lib/types';

interface ExpensesProps extends T.PanelProps {}

const Container = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const FiltersContainer = styled.section`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin: 20px auto 40px;
`;

const SearchInput = styled.input`
  color: ${colors().inputField};
  font-size: ${fontSizes.text}px;
  font-weight: normal;
  text-align: left;
  border: 1px solid ${colors().secondaryBackground};
  border-radius: 50px;
  padding: 10px 10px 10px 15px;
  flex: 1;
  min-width: 75%;
  outline: none;
  &::-webkit-input-placeholder {
    color: ${colors().inputPlaceholder};
  }
  &:hover,
  &:focus,
  &:active {
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.2);
  }
`;

const NoExpensesFoundText = styled.p`
  color: ${colors().secondaryText};
  text-align: center;
  align-items: center;
  flex: 1;
  display: flex;
  font-size: ${fontSizes.text}px;
`;

type NoExpensesFoundProps = {
  hasFiltersOrSearch: boolean;
};

const NoExpensesFound = (props: NoExpensesFoundProps) => {
  return (
    <>
      {props.hasFiltersOrSearch ? (
        <NoExpensesFoundText>
          No expenses found matching those filters.{'\n'}Try changing them!
        </NoExpensesFoundText>
      ) : (
        <NoExpensesFoundText>
          No expenses found for this month.{'\n'}Go add one!
        </NoExpensesFoundText>
      )}
    </>
  );
};

const defaultExpense = {
  id: '',
  cost: 0,
  description: '',
  budget: '',
  date: moment().format('YYYY-MM-DD'),
};

const Expenses = ({
  expenses,
  budgets,
  currency,
  reloadData,
  db,
}: ExpensesProps) => {
  const [filterExpenseDescription, setFilterExpenseDescription] = useState('');
  const [filterBudgets, setFilterBudgets] = useState<Set<string>>(new Set());
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isFilterBudgetsModalOpen, setIsFilterBudgetsModalOpen] = useState(
    false,
  );
  const [chosenExpense, setChosenExpense] = useState({ ...defaultExpense });

  const openExpenseModal = (expense: T.Expense) => {
    setIsExpenseModalOpen(true);
    setChosenExpense({ ...expense });
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setChosenExpense({ ...defaultExpense });
  };

  let expensesToShow = expenses;

  if (filterExpenseDescription) {
    expensesToShow = expensesToShow.filter((expense) =>
      expense.description
        .toLowerCase()
        .includes(filterExpenseDescription.toLowerCase()),
    );
  }

  if (filterBudgets.size > 0) {
    expensesToShow = expensesToShow.filter((expense) =>
      filterBudgets.has(expense.budget),
    );
  }

  return (
    <Container>
      <FiltersContainer>
        <SearchInput
          type="search"
          placeholder="Search for an expense"
          onChange={(event) => setFilterExpenseDescription(event.target.value)}
          value={filterExpenseDescription}
          autoComplete="off"
        />
        <IconButton
          icon="options"
          size={32}
          color={
            filterBudgets.size > 0
              ? colors().primaryButtonBackground
              : colors().secondaryButtonBackground
          }
          onClick={() => setIsFilterBudgetsModalOpen(true)}
        />
      </FiltersContainer>
      {expensesToShow.map((expense) => (
        <Expense
          key={expense.id}
          {...expense}
          currency={currency}
          onClick={() => openExpenseModal(expense)}
        />
      ))}
      {expensesToShow.length === 0 && (
        <NoExpensesFound
          hasFiltersOrSearch={
            filterExpenseDescription.length > 0 || filterBudgets.size > 0
          }
        />
      )}
      <ExpenseModal
        key={chosenExpense.id}
        isOpen={isExpenseModalOpen}
        onClose={() => closeExpenseModal()}
        budgets={budgets}
        reloadData={reloadData}
        db={db}
        {...chosenExpense}
      />
      <FilterBudgetModal
        isOpen={isFilterBudgetsModalOpen}
        onClose={() => setIsFilterBudgetsModalOpen(false)}
        onFilterBudgetToggle={(budgetName, newValue) => {
          const newFilterBudgets = new Set(filterBudgets);
          if (newValue) {
            newFilterBudgets.add(budgetName);
          } else {
            newFilterBudgets.delete(budgetName);
          }

          setFilterBudgets(newFilterBudgets);
        }}
        budgets={budgets}
        filterBudgets={filterBudgets}
      />
    </Container>
  );
};

export default Expenses;
