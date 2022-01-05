import { getUserInfo } from 'lib/utils';

export const defaultTitle =
  'Budget Zen — Simple and Encrypted Budget Management';
export const defaultDescription = 'Simple and encryped budget management.';
export const defaultKeywords =
  'budget, zen, encrypted, e2ee, end-to-end, simple, app, web, android, linux, ios, macos';

export const sessionNamespace = 'BudgetZen_v2_appSession';

type Theme = 'dark' | 'light';

export const colors = (theme: Theme = 'light') => {
  const userInfo = getUserInfo();

  if (typeof window !== 'undefined') {
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      theme = 'dark';
    }
  }

  if (
    typeof document !== 'undefined' &&
    typeof document.getElementsByTagName === 'function' &&
    document.getElementsByTagName('body')[0].classList.contains('theme-dark')
  ) {
    theme = 'dark';
  }

  if (userInfo && userInfo.theme === 'dark') {
    theme = 'dark';
  }

  return {
    inputLabel: theme === 'dark' ? '#fff' : '#000',
    inputField: theme === 'dark' ? '#666' : '#666',
    inputPlaceholder: theme === 'dark' ? '#333' : '#ccc',
    text: theme === 'dark' ? '#efefef' : '#333',
    secondaryText: theme === 'dark' ? '#666' : '#999',
    background: theme === 'dark' ? '#222' : '#fff',
    secondaryBackground: theme === 'dark' ? '#333' : '#efefef',
    alternateBackground: theme === 'dark' ? '#2f2f2f' : '#f9f9f9',
    primaryButtonText: theme === 'dark' ? '#000' : '#fff',
    primaryButtonBackground: theme === 'dark' ? '#fff' : '#000',
    secondaryButtonText: theme === 'dark' ? '#000' : '#fff',
    secondaryButtonBackground: theme === 'dark' ? '#999' : '#666',
  };
};

export const fontSizes = {
  inputLabel: 24,
  inputField: 18,
  label: 18,
  text: 14,
  mediumText: 15,
  largeText: 18,
  smallText: 12,
  button: 18,
};
