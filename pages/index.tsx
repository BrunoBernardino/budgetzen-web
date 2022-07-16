import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { Main } from 'components/Layout';
import Login from 'components/Panels/Login';
import AllPanels from 'components/Panels/All';
import Loading from 'components/Loading';
import { isLoggedIn } from 'lib/utils';
import {
  defaultTitle,
  defaultDescription,
  defaultKeywords,
  baseUrl,
} from 'lib/constants';

const IndexPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const isUserLoggedIn = await isLoggedIn();
      setHasValidSession(isUserLoggedIn);
      setIsLoading(false);
    };

    checkSession();
  }, []);

  return (
    <Main
      title={defaultTitle}
      description={defaultDescription}
      keywords={defaultKeywords}
      hasValidSession={hasValidSession}
    >
      <div className="index common">
        {!hasValidSession ? <Login /> : <AllPanels />}
      </div>
      <Loading isShowing={isLoading} />
    </Main>
  );
};

export const getServerSideProps = async ({ req }: { req: Request }) => {
  // @ts-ignore it does exist
  if (req && req.headers && !req.headers.host.startsWith('localhost')) {
    const pathname = req.url;

    try {
      await axios.post('https://stats.onbrn.com/api/event', {
        domain: baseUrl.replace('https://', ''),
        name: 'pageview',
        url: `${baseUrl}${pathname}`,
      });
    } catch (error) {
      console.log('Failed to log pageview');
      console.error(error);
    }
  }

  return {
    props: {},
  };
};

export default IndexPage;
