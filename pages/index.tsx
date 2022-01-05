import React, { useState, useEffect } from 'react';

import { Main } from 'components/Layout';
import Login from 'components/Panels/Login';
import AllPanels from 'components/Panels/All';
import Loading from 'components/Loading';
import { isLoggedIn } from 'lib/utils';
import {
  defaultTitle,
  defaultDescription,
  defaultKeywords,
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

export default IndexPage;
