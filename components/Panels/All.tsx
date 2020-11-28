import React, { useState, useRef } from 'react';
import moment from 'moment';
import styled from 'styled-components';
import { useAsync } from 'react-use';
import { RxDatabase } from 'rxdb';

import LogoutLink from 'modules/auth/LogoutLink';
import { Loading } from 'components';
import { getUserInfo, showNotification } from 'lib/utils';
import { initializeDb, fetchBudgets, fetchExpenses } from 'lib/data-utils';
import * as T from 'lib/types';

import Navigation from './Navigation';
import Expenses from './Expenses';
import Budgets from './Budgets';
import AddExpense from './AddExpense';
import Settings from './Settings';

const Wrapper = styled.main`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: flex-start;
  flex-direction: row;
`;

const LeftSide = styled.section`
  display: flex;
  flex: 1;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
`;

const All = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [monthInView, setMonthInView] = useState(moment().format('YYYY-MM'));
  const [currency, setCurrency] = useState<T.Currency>('USD');
  const [syncToken, setSyncToken] = useState('');
  const [budgets, setBudgets] = useState<T.Budget[]>([]);
  const [expenses, setExpenses] = useState<T.Expense[]>([]);
  const db = useRef<RxDatabase>(null);

  const reloadData = async () => {
    setIsLoading(true);

    const fetchedBudgets = await fetchBudgets(db.current, monthInView);
    setBudgets(fetchedBudgets);

    const fetchedExpenses = await fetchExpenses(db.current, monthInView);
    setExpenses(fetchedExpenses);

    showNotification(
      'Data is continuously synchronizing in the background. Navigate between months to see the latest data.',
    );

    setIsLoading(false);
  };

  const changeMonthInView = async (month: string) => {
    setIsLoading(true);

    setMonthInView(month);

    const fetchedBudgets = await fetchBudgets(db.current, month);
    setBudgets(fetchedBudgets);

    const fetchedExpenses = await fetchExpenses(db.current, month);
    setExpenses(fetchedExpenses);

    setIsLoading(false);
  };

  useAsync(async () => {
    if (typeof window !== 'undefined') {
      const userInfo = getUserInfo();
      setCurrency(userInfo.currency);
      setSyncToken(userInfo.syncToken);

      const initializedDb = await initializeDb(userInfo.syncToken);
      db.current = initializedDb;

      await reloadData();
    }
  }, []);

  return (
    <Wrapper className="wrapper">
      <Loading isShowing={isLoading} />
      <LeftSide>
        <Navigation
          changeMonthInView={changeMonthInView}
          monthInView={monthInView}
        />
        <Wrapper>
          <Expenses
            monthInView={monthInView}
            currency={currency}
            budgets={budgets}
            expenses={expenses}
            reloadData={reloadData}
            db={db.current}
          />
          <Budgets
            monthInView={monthInView}
            currency={currency}
            budgets={budgets}
            expenses={expenses}
            reloadData={reloadData}
            db={db.current}
          />
        </Wrapper>
      </LeftSide>
      <AddExpense budgets={budgets} reloadData={reloadData} db={db.current} />
      <Settings
        currentCurrency={currency}
        updateCurrency={setCurrency}
        syncToken={syncToken}
        db={db.current}
      />
      <LogoutLink />
    </Wrapper>
  );
};

export default All;
