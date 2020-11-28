import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import Rodal from 'rodal';
import Swal from 'sweetalert2';
import { RxDatabase } from 'rxdb';

import Button from 'components/Button';
import { showNotification } from 'lib/utils';
import { saveExpense, deleteExpense } from 'lib/data-utils';
import { colors, fontSizes } from 'lib/constants';
import * as T from 'lib/types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  id: string;
  cost: number;
  description: string;
  budget: string;
  date: string;
  budgets: T.Budget[];
  reloadData: () => Promise<void>;
  db: RxDatabase;
}

const Container = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  background-color: ${colors().background};
  padding: 0 16px;
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

const StyledButton = styled(Button)`
  margin: 20px 0;
`;

const ExpenseModal = (props: ExpenseModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState(props.description);
  const [cost, setCost] = useState(props.cost.toString());
  const [budget, setBudget] = useState(props.budget);
  const [date, setDate] = useState(props.date);

  const { id, isOpen, budgets, reloadData, db } = props;

  const onClose = useCallback(() => {
    const { onClose: closeModal } = props;
    setDescription('');
    setCost('');
    setBudget('');
    setDate('');
    closeModal();
  }, []);

  const addExpense = async () => {
    if (isSubmitting) {
      // Ignore sequential clicks
      return;
    }

    setIsSubmitting(true);

    const parsedExpense: T.Expense = {
      id: id || 'newExpense',
      description,
      cost: Number.parseFloat(cost.replace(',', '.')),
      budget,
      date,
    };

    const success = await saveExpense(db, parsedExpense);

    setIsSubmitting(false);

    if (success) {
      showNotification(`Expense ${id ? 'updated' : 'added'} successfully.`);
      onClose();
    }

    await reloadData();
  };

  const removeExpense = async () => {
    if (isSubmitting) {
      // Ignore sequential clicks
      return;
    }

    const confirmationResult = await Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text:
        'Are you sure you want to delete this expense?\n\nThis action is irreversible.',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Yes!',
      denyButtonText: 'Nope, cancel.',
    });

    if (!confirmationResult || !confirmationResult.isConfirmed) {
      return;
    }

    setIsSubmitting(true);

    const success = await deleteExpense(db, id);

    setIsSubmitting(false);

    if (success) {
      showNotification('Expense deleted successfully.');
      onClose();
    }

    await reloadData();
  };

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        addExpense();
      }
    },
    [],
  );

  return (
    <Rodal visible={isOpen} onClose={onClose} animation="slideDown">
      <Container>
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
          {budgets.map((budgetOption: T.Budget) => (
            <option key={budgetOption.name} value={budgetOption.name}>
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

        <StyledButton onClick={() => addExpense()} type="primary">
          {id ? 'Save Expense' : 'Add Expense'}
        </StyledButton>

        {Boolean(id) && (
          <StyledButton onClick={() => removeExpense()} type="delete">
            Delete Expense
          </StyledButton>
        )}
      </Container>
    </Rodal>
  );
};

export default ExpenseModal;
