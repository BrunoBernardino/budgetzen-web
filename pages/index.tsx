import React, { useState, useEffect } from 'react';

import { Main } from 'components/Layout';
import Login from 'components/Panels/Login';
import AllPanels from 'components/Panels/All';
import { isLoggedIn } from 'lib/utils';
import {
  defaultTitle,
  defaultDescription,
  defaultKeywords,
} from 'lib/constants';

const IndexPage = () => {
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    const isUserLoggedIn = isLoggedIn();

    setHasValidSession(isUserLoggedIn);
  }, []);

  return (
    <Main
      title={defaultTitle}
      description={defaultDescription}
      keywords={defaultKeywords}
    >
      <div className="index common">
        {!hasValidSession ? <Login /> : <AllPanels />}
      </div>
    </Main>
  );
};

export default IndexPage;
