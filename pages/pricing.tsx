import React, { useState, useEffect } from 'react';
import moment from 'moment';
import axios from 'axios';

import { Main } from 'components/Layout';
import Pricing from 'components/Panels/Pricing';
import Loading from 'components/Loading';
import { getUserSession } from 'lib/utils';
import {
  defaultTitle,
  defaultDescription,
  defaultKeywords,
  baseUrl,
} from 'lib/constants';

const PricingPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [hasValidSubscription, setHasValidSubscription] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(30);

  useEffect(() => {
    const checkSession = async () => {
      const userSession = await getUserSession();
      if (userSession) {
        setHasValidSession(true);
        setHasValidSubscription(userSession.subscriptionStatus === 'active');
        if (userSession.subscriptionStatus !== 'trialing') {
          const daysLeft = moment(userSession.trialExpirationDate).diff(
            moment(),
            'days',
          );
          setTrialDaysLeft(daysLeft < 0 ? 0 : daysLeft);
        }
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
      <div className="pricing common">
        <Pricing
          hasValidSession={hasValidSession}
          hasValidSubscription={hasValidSubscription}
          trialDaysLeft={trialDaysLeft}
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
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
        body: {
          domain: baseUrl.replace('https://', ''),
          name: 'pageview',
          url: `${baseUrl}${pathname}`,
        },
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

export default PricingPage;
