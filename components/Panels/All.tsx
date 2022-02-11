import React, { useState, useEffect } from 'react';
import moment from 'moment';
import styled from 'styled-components';
import { useAsync } from 'react-use';
import { useRouter } from 'next/router';

import LogoutLink from 'modules/auth/LogoutLink';
import { Loading } from 'components';
import { getUserInfo, showNotification, getUserSession } from 'lib/utils';
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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [monthInView, setMonthInView] = useState(moment().format('YYYY-MM'));
  const [currency, setCurrency] = useState<T.Currency>('USD');
  const [theme, setTheme] = useState<T.Theme>('light');
  const [budgets, setBudgets] = useState<T.Budget[]>([]);
  const [expenses, setExpenses] = useState<T.Expense[]>([]);

  type ReloadData = (options?: {
    monthToLoad?: string;
    isComingFromEmptyState?: boolean;
  }) => Promise<void>;
  const reloadData: ReloadData = async ({
    monthToLoad,
    isComingFromEmptyState = false,
  } = {}) => {
    setIsLoading(true);

    const fetchedBudgets = await fetchBudgets(monthToLoad || monthInView);
    setBudgets(fetchedBudgets);

    const fetchedExpenses = await fetchExpenses(monthToLoad || monthInView);
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
        await copyBudgets(currentMonth, nextMonth);
        await reloadData({ monthToLoad, isComingFromEmptyState: true });
        return;
      }

      if (
        (monthToLoad && monthToLoad === currentMonth) ||
        (!monthToLoad && monthInView === currentMonth)
      ) {
        await copyBudgets(previousMonth, currentMonth);
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

      await initializeDb();

      await reloadData();

      const userSession = await getUserSession();

      const trialDaysLeft = moment(userSession.trialExpirationDate).diff(
        moment(),
        'days',
      );
      if (userSession.subscriptionStatus !== 'active' && trialDaysLeft < 0) {
        showNotification('Your trial has expired!', 'error');
        // Give people some time to logout or export
        setTimeout(() => {
          router.push('/pricing');
        }, 10000);
      }
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
          />
          <Budgets
            monthInView={monthInView}
            currency={currency}
            budgets={budgets}
            expenses={expenses}
            reloadData={reloadData}
          />
        </Wrapper>
      </LeftSide>
      <AddExpense budgets={budgets} reloadData={reloadData} />
      <Settings
        currentCurrency={currency}
        updateCurrency={setCurrency}
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
