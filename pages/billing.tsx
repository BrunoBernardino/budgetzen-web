import React, { useState, useEffect } from 'react';
import moment from 'moment';
import axios from 'axios';

import { Main } from 'components/Layout';
import Billing from 'components/Panels/Billing';
import Loading from 'components/Loading';
import { getUserSession } from 'lib/utils';
import {
  defaultTitle,
  defaultDescription,
  defaultKeywords,
  baseUrl,
} from 'lib/constants';

const BillingPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [hasValidSubscription, setHasValidSubscription] = useState(false);
  const [isTrialing, setIsTrialing] = useState(false);
  const [isSubscriptionCanceled, setIsSubscriptionCanceled] = useState(false);
  const [isSubscriptionMonthly, setIsSubscriptionMonthly] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const userSession = await getUserSession();
      if (userSession) {
        const trialDaysLeft = moment(userSession.trialExpirationDate).diff(
          moment(),
          'days',
        );
        setHasValidSession(true);
        setHasValidSubscription(userSession.subscriptionStatus === 'active');
        setIsTrialing(
          userSession.subscriptionStatus !== 'active' && trialDaysLeft > 0,
        );
        setIsSubscriptionCanceled(Boolean(userSession.cancelSubscriptionAt));
        setIsSubscriptionMonthly(
          userSession.subscriptionPlanId === 'budget-zen-v2-monthly',
        );
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
      <div className="billing common">
        <Billing
          hasValidSession={hasValidSession}
          hasValidSubscription={hasValidSubscription}
          isTrialing={isTrialing}
          isSubscriptionCanceled={isSubscriptionCanceled}
          isSubscriptionMonthly={isSubscriptionMonthly}
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

export default BillingPage;
