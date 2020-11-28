import React from 'react';
import styled from 'styled-components';

import { formatNumber } from 'lib/utils';
import { colors, fontSizes } from 'lib/constants';

import * as T from 'lib/types';

interface BudgetProps extends T.Budget {
  currency: T.Currency;
  onClick: () => void;
  expensesCost: number;
}

type ContainerProps = {
  isTotal: boolean;
};

const Container = styled.section<ContainerProps>`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px 16px;
  border-radius: 12px;
  box-shadow: 0px 0px 4px
    rgba(0, 0, 0, ${({ isTotal }) => (isTotal ? '0.2' : '0.1')});
  background-color: ${({ isTotal }) =>
    isTotal ? colors().secondaryBackground : colors().background};
  margin: 8px;
  cursor: pointer;
  min-width: 200px;
  &:hover {
    box-shadow: 0px 0px 4px
      rgba(0, 0, 0, ${({ isTotal }) => (isTotal ? '0.5' : '0.3')});
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const Cost = styled.span`
  color: ${colors().text};
  font-size: ${fontSizes.label}px;
  font-weight: bold;
  text-align: left;
`;

const Name = styled.span`
  color: ${colors().text};
  font-size: ${fontSizes.text}px;
  font-weight: normal;
  text-align: left;
  margin-top: 6px;
`;

const BudgetMissing = styled.div`
  color: ${colors().secondaryText};
  font-size: ${fontSizes.largeText}px;
  font-weight: normal;
  text-align: right;
`;

const Budget = (props: BudgetProps) => {
  const budgetMissing = props.value - props.expensesCost;
  return (
    <Container isTotal={props.name === 'Total'} onClick={props.onClick}>
      <LeftColumn>
        <Cost>
          {formatNumber(props.currency, props.expensesCost)} of{' '}
          {formatNumber(props.currency, props.value)}
        </Cost>
        <Name>{props.name}</Name>
      </LeftColumn>
      <BudgetMissing>
        {formatNumber(props.currency, budgetMissing)}
      </BudgetMissing>
    </Container>
  );
};

export default Budget;
