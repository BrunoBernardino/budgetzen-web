import userbase from 'userbase-js';
import Swal from 'sweetalert2';

import { sessionNamespace } from 'lib/constants';
import { AuthToken, Currency, Theme } from 'lib/types';

const USERBASE_APP_ID = process.env.NEXT_PUBLIC_USERBASE_APP_ID;
const sessionLengthInHours = 90 * 24;

export const formatNumber = (currency: Currency, number: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);

type SortableByDate = { date: string };
export const sortByDate = (
  objectA: SortableByDate,
  objectB: SortableByDate,
) => {
  if (objectA.date < objectB.date) {
    return -1;
  }
  if (objectA.date > objectB.date) {
    return 1;
  }
  return 0;
};

type SortableByName = { name: string };
export const sortByName = (
  objectA: SortableByName,
  objectB: SortableByName,
) => {
  const nameA = objectA.name.toUpperCase();
  const nameB = objectB.name.toUpperCase();
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  return 0;
};

type SortableByMissingBudget = { expensesCost: number; value: number };
export const sortByMissingBudget = (
  objectA: SortableByMissingBudget,
  objectB: SortableByMissingBudget,
) => {
  const valueA = objectA.value - objectA.expensesCost;
  const valueB = objectB.value - objectB.expensesCost;
  return valueB - valueA;
};

export const splitArrayInChunks = (array: any[], chunkLength: number) => {
  const chunks = [];
  let chunkIndex = 0;
  const arrayLength = array.length;

  while (chunkIndex < arrayLength) {
    chunks.push(array.slice(chunkIndex, (chunkIndex += chunkLength)));
  }

  return chunks;
};

export const uniqBy = (
  array: any[],
  predicate: string | ((item: any) => any),
) => {
  const filter =
    typeof predicate === 'function'
      ? predicate
      : (object: any) => object[predicate];

  return [
    ...array
      .reduce((map, item) => {
        const key = item === null || item === undefined ? item : filter(item);

        // eslint-disable-next-line
        map.has(key) || map.set(key, item);

        return map;
      }, new Map())
      .values(),
  ];
};

export const showNotification = (
  message: string,
  type: 'success' | 'error' = 'success',
) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: type === 'success' ? 2500 : 0,
    timerProgressBar: type === 'success',
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon: type,
    title: message,
  });
};

export const updatePreferences = (
  currency: Currency = 'USD',
  theme: Theme = 'light',
) => {
  const authToken: AuthToken = {
    currency,
    theme,
  };

  try {
    localStorage.setItem(
      `${sessionNamespace}:userInfo`,
      JSON.stringify(authToken),
    );
    return true;
  } catch (error) {
    Swal.fire(
      'Something went wrong!',
      `Uh oh! Something wrong happened: ${error && error.message}`,
      'error',
    );
  }

  return false;
};

export const doLogout = async () => {
  try {
    localStorage.removeItem(`${sessionNamespace}:userInfo`);
    await userbase.signOut();
    return true;
  } catch (error) {
    Swal.fire(
      'Something went wrong!',
      `Uh oh! Something wrong happened: ${error && error.message}`,
      'error',
    );
  }

  return false;
};

export const isLoggedIn = async () => {
  try {
    const session = await userbase.init({
      appId: USERBASE_APP_ID,
      sessionLength: sessionLengthInHours,
    });
    if (session.user) {
      return true;
    }
  } catch (error) {
    // Do nothing
  }

  return false;
};

export const getUserSession = async () => {
  try {
    const session = await userbase.init({
      appId: USERBASE_APP_ID,
      sessionLength: sessionLengthInHours,
    });
    return session.user;
  } catch (error) {
    // Do nothing
  }

  return null;
};

type GetUserInfo = () => AuthToken;
export const getUserInfo: GetUserInfo = () => {
  const defaultAuthToken: AuthToken = {
    currency: 'USD',
    theme: 'light',
  };

  try {
    const userInfo: AuthToken = JSON.parse(
      localStorage.getItem(`${sessionNamespace}:userInfo`),
    );
    return userInfo || defaultAuthToken;
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong getting user info.',
    });
  }

  return defaultAuthToken;
};
