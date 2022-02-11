import React, { useCallback } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import userbase from 'userbase-js';

import { Title, Subtitle, Paragraph } from 'components';
import { Header } from 'components/Layout';
import Button from 'components/Button';

interface PricingProps {
  hasValidSession: boolean;
  hasValidSubscription: boolean;
  trialDaysLeft: number;
}

const Hero = styled.section`
  @media only screen and (min-width: 600px) {
    display: flex;
    align-items: center;
  }
`;

const HeroText = styled.section`
  margin-right: 1em;
`;

const Pricing = ({
  hasValidSession,
  hasValidSubscription,
  trialDaysLeft,
}: PricingProps) => {
  const handleMonthlySubscriptionClick = useCallback(async () => {
    await userbase.purchaseSubscription({
      successUrl: window.location.href,
      cancelUrl: window.location.href,
      priceId: 'budget-zen-v2-monthly',
    });
  }, []);

  const handleYearlySubscriptionClick = useCallback(async () => {
    await userbase.purchaseSubscription({
      successUrl: window.location.href,
      cancelUrl: window.location.href,
      priceId: 'budget-zen-v2-annual',
    });
  }, []);

  return (
    <>
      <Header />
      <Title>Pricing</Title>
      <Hero>
        <HeroText>
          <Paragraph>Pricing is simple.</Paragraph>
          <Paragraph>
            You have a <strong>30-day free trial</strong> (no credit card
            required), and at the end, you can pay <strong>€18 / year</strong>,
            or <strong>€2 / month</strong>, no limits.
          </Paragraph>
        </HeroText>
      </Hero>
      {hasValidSession ? (
        hasValidSubscription ? (
          <>
            <Subtitle>You're already a customer!</Subtitle>
            <Paragraph>
              You probably want to check out the{' '}
              <Link href="/billing">
                <a>billing section</a>
              </Link>{' '}
              instead.
            </Paragraph>
          </>
        ) : (
          <>
            <Paragraph isBold>
              Your trial{' '}
              {trialDaysLeft > 0
                ? `will expire in ${trialDaysLeft} day${
                    trialDaysLeft !== 1 ? 's' : ''
                  }`
                : 'has expired'}
              .
            </Paragraph>
            <Button
              onClick={handleMonthlySubscriptionClick}
              type="secondary"
              style={{ margin: '3rem auto 1.5rem' }}
            >
              Pay €2 / month
            </Button>
            <Button
              onClick={handleYearlySubscriptionClick}
              type="primary"
              width="large"
            >
              Pay €18 / year
            </Button>
          </>
        )
      ) : (
        <>
          <Subtitle>Signup or Login first</Subtitle>
          <Paragraph>
            Before you can pay, you need to{' '}
            <Link href="/">
              <a>Signup or Login</a>
            </Link>{' '}
            first.
          </Paragraph>
        </>
      )}
    </>
  );
};

export default Pricing;
