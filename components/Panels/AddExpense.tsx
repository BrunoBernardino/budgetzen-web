import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

import Button from 'components/Button';
import { colors, fontSizes } from 'lib/constants';
import { showNotification } from 'lib/utils';
import { saveExpense } from 'lib/data-utils';
import * as T from 'lib/types';

interface AddExpenseProps {
  budgets: T.Budget[];
  reloadData: () => Promise<void>;
}

const Container = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  background-color: ${colors().background};
  padding: 0 16px;
  width: 90vw;
  border-radius: 5px;
  margin-top: -10px;
  margin-right: -2px;

  @media only screen and (min-width: 800px) {
    max-width: 280px;
  }
`;

const Logo = styled.img`
  margin-top: 10px;
  margin-bottom: -20px;
  height: 50px;
  resize-mode: contain;
  align-self: center;
`;

const Label = styled.label`
  color: ${colors().inputLabel};
  font-size: ${fontSizes.inputLabel}px;
  font-weight: bold;
  text-align: left;
  margin-top: 38px;
`;

const Input = styled.input`
  font-family: inherit;
  color: ${colors().inputField};
  font-size: ${fontSizes.inputField}px;
  font-weight: normal;
  text-align: left;
  margin-top: 8px;
  background-color: ${colors().background};
  padding: 5px 8px;
  border: 1px solid ${colors().secondaryBackground};
  border-radius: 5px;
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

const Select = styled.select`
  color: ${colors().inputField};
  font-size: ${fontSizes.inputField}px;
  font-weight: normal;
  text-align: left;
  margin-top: 8px;
  background-color: ${colors().background};
  padding: 5px 8px;
  border: 1px solid ${colors().secondaryBackground};
  border-radius: 5px;
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

const AddExpense = ({ budgets, reloadData }: AddExpenseProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [budget, setBudget] = useState('');
  const [date, setDate] = useState('');

  const addExpense = async () => {
    if (isSubmitting) {
      // Ignore sequential clicks
      return;
    }

    setIsSubmitting(true);

    const parsedExpense: T.Expense = {
      id: 'newExpense',
      cost: Number.parseFloat(cost.replace(',', '.')),
      description,
      budget,
      date,
    };

    const success = await saveExpense(parsedExpense);

    setIsSubmitting(false);

    if (success) {
      setDescription('');
      setCost('');
      setBudget('');
      setDate('');
      showNotification('Expense added successfully.');
    }

    await reloadData();
  };

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      // @ts-ignore: Convert comma to dot
      if (event.key === ',' && event.target.type === 'number') {
        event.preventDefault();
        event.stopPropagation();
        setCost(`${cost}.`);
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        addExpense();
      }
    },
    [cost, description, budget, date],
  );

  const budgetsToShow = [...budgets];

  if (budgetsToShow.length === 0) {
    // Only the name matters/is used below
    budgetsToShow.push({
      id: 'fake',
      name: 'Misc',
      month: '',
      value: 0,
    });
  }

  return (
    <Container>
      <Logo
        alt="Logo: stylized letters Budget Zen"
        src="/images/logomark.png"
      />
      <Label>Cost</Label>
      <Input
        placeholder="10.99"
        onChange={(event) => setCost(event.target.value)}
        value={cost}
        autoComplete="off"
        type="number"
        inputMode="decimal"
        onKeyDown={onKeyDown}
      />

      <Label>Description</Label>
      <Input
        placeholder="Lunch"
        onChange={(event) => setDescription(event.target.value)}
        value={description}
        autoComplete="off"
        type="text"
        onKeyDown={onKeyDown}
      />

      <Label>Budget</Label>
      <Select
        placeholder="Misc"
        onChange={(event) =>
          setBudget(budgets[event.target.selectedIndex].name)
        }
        value={budget || 'Misc'}
      >
        {budgetsToShow.map((budgetOption: T.Budget) => (
          <option key={budgetOption.id} value={budgetOption.name}>
            {budgetOption.name}
          </option>
        ))}
      </Select>

      <Label>Date</Label>
      <Input
        placeholder="Today"
        onChange={(event) => setDate(event.target.value)}
        value={date}
        autoComplete="off"
        type="date"
        onKeyDown={onKeyDown}
      />
      <Button
        isDisabled={isSubmitting}
        onClick={() => addExpense()}
        type="primary"
        style={{ margin: '20px 0' }}
      >
        {isSubmitting ? 'Adding...' : 'Add Expense'}
      </Button>
    </Container>
  );
};

export default AddExpense;
