import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import Rodal from 'rodal';
import Swal from 'sweetalert2';
import { RxDatabase } from 'rxdb';

import Button from 'components/Button';
import { showNotification } from 'lib/utils';
import { saveBudget, deleteBudget } from 'lib/data-utils';
import { colors, fontSizes } from 'lib/constants';
import * as T from 'lib/types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  id: string;
  name: string;
  month: string;
  value: number;
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

const StyledButton = styled(Button)`
  margin: 20px 0;
`;

const BudgetModal = (props: BudgetModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(props.name);
  const [month, setMonth] = useState(`${props.month}-01`);
  const [value, setValue] = useState(props.value.toString());

  const { id, isOpen, reloadData, db } = props;

  const onClose = useCallback(() => {
    const { onClose: closeModal } = props;
    setName('');
    setMonth('');
    setValue('');
    closeModal();
  }, []);

  const addBudget = async () => {
    if (isSubmitting) {
      // Ignore sequential clicks
      return;
    }

    setIsSubmitting(true);

    const parsedBudget: T.Budget = {
      id: id || 'newBudget',
      value: Number.parseFloat(value.replace(',', '.')),
      name,
      month: month ? month.substr(0, 7) : '',
    };

    const success = await saveBudget(db, parsedBudget);

    setIsSubmitting(false);

    if (success) {
      showNotification(`Budget ${id ? 'updated' : 'added'} successfully.`);
      onClose();
    }

    await reloadData();
  };

  const removeBudget = async () => {
    if (isSubmitting) {
      // Ignore sequential clicks
      return;
    }

    const confirmationResult = await Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text:
        'Are you sure you want to delete this budget?\n\nThis action is irreversible.',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Yes!',
      denyButtonText: 'Nope, cancel.',
    });

    if (!confirmationResult || !confirmationResult.isConfirmed) {
      return;
    }

    setIsSubmitting(true);

    const success = await deleteBudget(db, id);

    setIsSubmitting(false);

    if (success) {
      showNotification('Budget deleted successfully.');
      onClose();
    }

    await reloadData();
  };

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        addBudget();
      }
    },
    [],
  );

  return (
    <Rodal visible={isOpen} onClose={onClose} animation="slideDown">
      <Container>
        <Label>Name</Label>
        <Input
          placeholder="Food"
          onChange={(event) => setName(event.target.value)}
          value={name}
          autoComplete="off"
          type="text"
          onKeyDown={onKeyDown}
        />

        <Label>Value</Label>
        <Input
          placeholder="100"
          onChange={(event) => setValue(event.target.value)}
          value={value}
          autoComplete="off"
          type="number"
          inputMode="decimal"
          onKeyDown={onKeyDown}
        />

        <Label>Month</Label>
        <Input
          onChange={(event) => setMonth(event.target.value)}
          value={month}
          autoComplete="off"
          type="date"
          onKeyDown={onKeyDown}
        />

        <StyledButton onClick={() => addBudget()} type="primary">
          {id ? 'Save Budget' : 'Add Budget'}
        </StyledButton>

        {Boolean(id) && (
          <StyledButton onClick={() => removeBudget()} type="delete">
            Delete Budget
          </StyledButton>
        )}
      </Container>
    </Rodal>
  );
};

export default BudgetModal;
