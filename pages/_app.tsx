import React from 'react';
import Head from 'next/head';
import { AppProps } from 'next/app';

import {
  defaultTitle,
  defaultDescription,
  defaultKeywords,
} from 'lib/constants';

import 'rodal/lib/rodal.css';
import 'react-toggle-switch/dist/css/switch.min.css';
import 'styles/main.scss';
import 'styles/_common.scss';

try {
  // @ts-ignore this is to prevent a problem with react-svg-ionicons
  global.navigator = global.navigator || {};
} catch (error) {
  // Do nothing
}

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>{defaultTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={defaultTitle} />
        <meta name="description" content={defaultDescription} />
        <meta name="keywords" content={defaultKeywords} />
      </Head>
      <Component {...pageProps} />
    </>
  );
};

export default MyApp;
