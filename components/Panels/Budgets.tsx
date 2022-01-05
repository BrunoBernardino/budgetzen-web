import React, { useState } from 'react';
import styled from 'styled-components';
import moment from 'moment';

import Budget from 'components/Budget';
import Button from 'components/Button';
import BudgetModal from 'components/BudgetModal';
import { sortByMissingBudget, showNotification } from 'lib/utils';
import { colors, fontSizes } from 'lib/constants';
import * as T from 'lib/types';

interface BudgetsProps extends T.PanelProps {}

interface BudgetsToShow extends T.Budget {
  expensesCost: number;
}

// user-agent sniffing sucks, but I couldn't figure out why this problem only happens on Safari (macOS and iOS)
const safariFix =
  typeof navigator !== 'undefined' &&
  navigator.userAgent &&
  navigator.userAgent.includes('Safari')
    ? 'max-block-size: 100%;'
    : '';

const Container = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  margin: 20px 10px;
  max-height: 80vh;
  overflow: auto;
  ${safariFix}
  width: 90vw;

  @media only screen and (min-width: 800px) {
    width: auto;
    margin: 0 10px;
  }
`;

const NoBudgetsFoundText = styled.p`
  color: ${colors().secondaryText};
  text-align: center;
  align-items: center;
  flex: 1;
  display: flex;
  font-size: ${fontSizes.text}px;
`;

const NoBudgetsFound = () => {
  return (
    <NoBudgetsFoundText>
      No budgets found for this month.{'\n'}Add one below!
    </NoBudgetsFoundText>
  );
};

const defaultBudget = {
  id: '',
  name: '',
  month: moment().startOf('month').format('YYYY-MM'),
  value: 100,
};

const Budgets = ({
  currency,
  monthInView,
  budgets,
  expenses,
  reloadData,
}: BudgetsProps) => {
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [chosenBudget, setChosenBudget] = useState({
    ...defaultBudget,
  });

  const openBudgetModal = (budget?: T.Budget) => {
    if (budget && budget.id === 'total') {
      showNotification("Can't edit the budget Total", 'error');
      return;
    }

    setIsBudgetModalOpen(true);
    setChosenBudget({ ...(budget || defaultBudget) });
  };

  const closeBudgetModal = () => {
    setIsBudgetModalOpen(false);
    setChosenBudget({ ...defaultBudget });
  };

  let totalCost = 0;
  let totalBudget = 0;

  const budgetsToShow: BudgetsToShow[] = [...budgets]
    .map((budget) => {
      const budgetToShow = {
        expensesCost: 0,
        ...budget,
      };

      // Calculate expenses cost
      expenses.forEach((expense) => {
        if (expense.budget === budget.name) {
          budgetToShow.expensesCost += expense.cost;
        }
      });

      totalCost += budgetToShow.expensesCost;
      totalBudget += budgetToShow.value;

      return budgetToShow;
    })
    .sort(sortByMissingBudget);

  // Add Total budget
  if (budgetsToShow.length > 0) {
    budgetsToShow.unshift({
      id: 'total',
      name: 'Total',
      value: totalBudget,
      expensesCost: totalCost,
      month: monthInView,
    });
  }

  return (
    <Container>
      {budgetsToShow.map((budget) => (
        <Budget
          key={budget.id}
          {...budget}
          currency={currency}
          onClick={() => openBudgetModal(budget)}
        />
      ))}
      {budgetsToShow.length === 0 && <NoBudgetsFound />}
      <Button
        onClick={() => openBudgetModal()}
        type="primary"
        style={{ margin: '20px 10px' }}
      >
        Add Budget
      </Button>
      <BudgetModal
        key={chosenBudget.id}
        isOpen={isBudgetModalOpen}
        onClose={() => closeBudgetModal()}
        reloadData={reloadData}
        {...chosenBudget}
      />
    </Container>
  );
};

export default Budgets;
