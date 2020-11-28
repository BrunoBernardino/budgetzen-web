import React from 'react';
import styled from 'styled-components';
import Rodal from 'rodal';
import Switch from 'react-toggle-switch';

import { colors, fontSizes } from 'lib/constants';

import * as T from 'lib/types';

interface FilterBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterBudgetToggle: (budgetName: string, newValue: boolean) => void;
  budgets: T.Budget[];
  filterBudgets: Set<string>;
}

const Container = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  background-color: ${colors().background};
  padding: 0 16px;
`;

const IntroText = styled.p`
  color: ${colors().secondaryText};
  font-size: ${fontSizes.mediumText};
  margin-bottom: 20px;
`;

const Budget = styled.section<{ isOdd: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ isOdd }) =>
    isOdd ? colors().alternateBackground : colors().background};
  padding: 8px;
  border-radius: 10px;
`;

const BudgetName = styled.span`
  font-size: ${fontSizes.label};
`;

const FilterBudgetModal = (props: FilterBudgetModalProps) => {
  const {
    isOpen,
    onClose,
    budgets,
    onFilterBudgetToggle,
    filterBudgets,
  } = props;
  return (
    <Rodal visible={isOpen} onClose={onClose} animation="slideDown">
      <Container>
        <IntroText>Choose which budgets to filter by:</IntroText>
        {budgets.map((budget, index) => (
          <Budget key={budget.name} isOdd={index % 2 !== 0}>
            <BudgetName>{budget.name}</BudgetName>
            <Switch
              on={filterBudgets.has(budget.name)}
              onClick={() =>
                onFilterBudgetToggle(
                  budget.name,
                  !filterBudgets.has(budget.name),
                )
              }
            />
          </Budget>
        ))}
      </Container>
    </Rodal>
  );
};

export default FilterBudgetModal;
