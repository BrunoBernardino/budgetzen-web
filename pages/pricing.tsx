import React, { useState, useEffect } from 'react';
import moment from 'moment';

import { Main } from 'components/Layout';
import Pricing from 'components/Panels/Pricing';
import Loading from 'components/Loading';
import { getUserSession } from 'lib/utils';
import {
  defaultTitle,
  defaultDescription,
  defaultKeywords,
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

export default PricingPage;
