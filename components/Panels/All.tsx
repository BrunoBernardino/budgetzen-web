import React, { useState, useRef, useEffect } from 'react';
import moment from 'moment';
import styled from 'styled-components';
import { useAsync } from 'react-use';
import * as Etebase from 'etebase';

import LogoutLink from 'modules/auth/LogoutLink';
import { Loading } from 'components';
import { getUserInfo, showNotification } from 'lib/utils';
import {
  initializeDb,
  fetchBudgets,
  fetchExpenses,
  copyBudgets,
} from 'lib/data-utils';
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
  flex-direction: column-reverse;
  max-width: 100vw;

  @media only screen and (min-width: 800px) {
    flex-direction: row;
  }
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
  const [session, setSession] = useState('');
  const [theme, setTheme] = useState<T.Theme>('light');
  const [budgets, setBudgets] = useState<T.Budget[]>([]);
  const [expenses, setExpenses] = useState<T.Expense[]>([]);
  const etebase = useRef<Etebase.Account>(null);

  type ReloadData = (options?: {
    monthToLoad?: string;
    isComingFromEmptyState?: boolean;
  }) => Promise<void>;
  const reloadData: ReloadData = async ({
    monthToLoad,
    isComingFromEmptyState = false,
  } = {}) => {
    setIsLoading(true);

    const fetchedBudgets = await fetchBudgets(
      etebase.current,
      monthToLoad || monthInView,
    );
    setBudgets(fetchedBudgets);

    const fetchedExpenses = await fetchExpenses(
      etebase.current,
      monthToLoad || monthInView,
    );
    setExpenses(fetchedExpenses);

    // If this is for the current or next month and there are no budgets, create budgets based on the previous/current month.
    if (fetchedBudgets.length === 0 && !isComingFromEmptyState) {
      const currentMonth = moment().format('YYYY-MM');
      const nextMonth = moment().add(1, 'month').format('YYYY-MM');
      const previousMonth = moment().subtract(1, 'month').format('YYYY-MM');

      if (
        (monthToLoad && monthToLoad === nextMonth) ||
        (!monthToLoad && monthInView === nextMonth)
      ) {
        await copyBudgets(etebase.current, currentMonth, nextMonth);
        await reloadData({ monthToLoad, isComingFromEmptyState: true });
        return;
      }

      if (
        (monthToLoad && monthToLoad === currentMonth) ||
        (!monthToLoad && monthInView === currentMonth)
      ) {
        await copyBudgets(etebase.current, previousMonth, currentMonth);
        await reloadData({ monthToLoad, isComingFromEmptyState: true });
        return;
      }
    }

    setIsLoading(false);
  };

  const changeMonthInView = async (month: string) => {
    const nextMonth = moment().add(1, 'month').format('YYYY-MM');

    if (month > nextMonth) {
      showNotification('Cannot travel further into the future!', 'error');
      return;
    }

    setMonthInView(month);

    await reloadData({ monthToLoad: month });
  };

  useAsync(async () => {
    if (typeof window !== 'undefined') {
      const userInfo = getUserInfo();
      setCurrency(userInfo.currency);
      setTheme(userInfo.theme || 'light');
      setSession(userInfo.session);

      const initializedDb = await initializeDb(userInfo.session);
      etebase.current = initializedDb;

      await reloadData();

      showNotification(
        'Data is continuously synchronizing in the background. Navigate between months to see the latest data.',
      );
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.getElementsByTagName('html')[0].classList.add('theme-dark');
      document.getElementsByTagName('body')[0].classList.add('theme-dark');
    }
  }, [theme]);

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
            etebase={etebase.current}
          />
          <Budgets
            monthInView={monthInView}
            currency={currency}
            budgets={budgets}
            expenses={expenses}
            reloadData={reloadData}
            etebase={etebase.current}
          />
        </Wrapper>
      </LeftSide>
      <AddExpense
        budgets={budgets}
        reloadData={reloadData}
        etebase={etebase.current}
      />
      <Settings
        currentCurrency={currency}
        updateCurrency={setCurrency}
        session={session}
        etebase={etebase.current}
        currentTheme={theme}
        updateTheme={setTheme}
        setIsLoading={setIsLoading}
        reloadData={reloadData}
      />
      <LogoutLink />
    </Wrapper>
  );
};

export default All;
