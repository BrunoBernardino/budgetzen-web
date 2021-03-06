import Swal from 'sweetalert2';

import { sessionNamespace } from 'lib/constants';
import { AuthToken, Currency } from 'lib/types';

export const formatNumber = (currency: Currency = 'USD', number: number) =>
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

export const showNotification = (
  message: string,
  type: 'success' | 'error' = 'success',
) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
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

export const doLogin = (syncToken: string, currency: Currency = 'USD') => {
  const authToken: AuthToken = {
    syncToken,
    currency,
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

export const doLogout = () => {
  try {
    localStorage.removeItem(`${sessionNamespace}:userInfo`);
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

type GetUserInfo = () => AuthToken;
export const getUserInfo: GetUserInfo = () => {
  try {
    const userInfo: AuthToken = JSON.parse(
      localStorage.getItem(`${sessionNamespace}:userInfo`),
    );
    return userInfo;
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong getting user info.',
    });
  }

  return {
    syncToken: null,
    currency: 'USD',
  };
};

export const isLoggedIn = () => {
  try {
    const userInfo = getUserInfo();
    return Boolean(userInfo.syncToken);
  } catch (error) {
    // Do nothing
  }

  return false;
};
