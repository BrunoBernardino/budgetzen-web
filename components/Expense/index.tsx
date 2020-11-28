import React from 'react';
import moment from 'moment';
import styled from 'styled-components';

import { formatNumber } from 'lib/utils';
import { colors, fontSizes } from 'lib/constants';

import * as T from 'lib/types';

interface ExpenseProps extends T.Expense {
  currency: T.Currency;
  onClick: () => void;
}

const Container = styled.section`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px 16px;
  border-radius: 12px;
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.1);
  background-color: ${colors().background};
  margin: 8px;
  cursor: pointer;
  min-width: 200px;
`;

const LeftColumn = styled.div`
  display: flex;
  flex: 0.5;
  flex-direction: column;
`;
const Cost = styled.span`
  color: ${colors().text};
  font-size: ${fontSizes.label}px;
  font-weight: bold;
  text-align: left;
`;
const Budget = styled.span`
  color: ${colors().secondaryText};
  font-size: ${fontSizes.text}px;
  font-weight: normal;
  text-align: left;
  margin-top: 6px;
`;
const Description = styled.div`
  color: ${colors().text};
  font-size: ${fontSizes.mediumText}px;
  font-weight: normal;
  text-align: left;
  padding: 0 6px;
`;
const Date = styled.div`
  color: ${colors().secondaryText};
  font-size: ${fontSizes.largeText}px;
  font-weight: normal;
  text-align: right;
  text-transform: uppercase;
`;

const Expense = (props: ExpenseProps) => {
  const expenseDate = moment(props.date, 'YYYY-MM-DD');
  return (
    <Container onClick={props.onClick}>
      <LeftColumn>
        <Cost>{formatNumber(props.currency, props.cost)}</Cost>
        <Budget>{props.budget}</Budget>
      </LeftColumn>
      <Description>{props.description}</Description>
      <Date>
        {expenseDate.format('DD')}
        {'\n'}
        {expenseDate.format('MMM')}
      </Date>
    </Container>
  );
};

export default Expense;
