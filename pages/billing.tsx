import React, { useState, useEffect } from 'react';

import { Main } from 'components/Layout';
import Billing from 'components/Panels/Billing';
import Loading from 'components/Loading';
import { getUserSession } from 'lib/utils';
import {
  defaultTitle,
  defaultDescription,
  defaultKeywords,
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
        setHasValidSession(true);
        setHasValidSubscription(userSession.subscriptionStatus === 'active');
        setIsTrialing(
          userSession.subscriptionStatus !== 'active' &&
            Boolean(userSession.trialExpirationDate),
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

export default BillingPage;
