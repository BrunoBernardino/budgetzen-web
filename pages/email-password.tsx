import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { Main } from 'components/Layout';
import EmailPassword from 'components/Panels/EmailPassword';
import Loading from 'components/Loading';
import { getUserSession } from 'lib/utils';
import {
  defaultTitle,
  defaultDescription,
  defaultKeywords,
  baseUrl,
} from 'lib/constants';

const EmailPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const userSession = await getUserSession();
      if (userSession) {
        setHasValidSession(true);
        setCurrentEmail(userSession.email);
      }

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
      <div className="email-password common">
        <EmailPassword
          hasValidSession={hasValidSession}
          currentEmail={currentEmail}
        />
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

export default EmailPasswordPage;
