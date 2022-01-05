import React, { useCallback } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import userbase from 'userbase-js';

import { Title, Subtitle, Paragraph } from 'components';
import { Header } from 'components/Layout';
import Button from 'components/Button';

interface BillingProps {
  hasValidSession: boolean;
  hasValidSubscription: boolean;
  isTrialing: boolean;
  isSubscriptionCanceled: boolean;
  isSubscriptionMonthly: boolean;
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

const Billing = ({
  hasValidSession,
  hasValidSubscription,
  isTrialing,
  isSubscriptionCanceled,
  isSubscriptionMonthly,
}: BillingProps) => {
  const handleSubscriptionCancelClick = useCallback(async () => {
    await userbase.cancelSubscription();
    window.location.reload();
  }, []);

  const handleSubscriptionResumeClick = useCallback(async () => {
    await userbase.resumeSubscription();
    window.location.reload();
  }, []);

  const handlePaymentDetailsUpdateClick = useCallback(async () => {
    await userbase.updatePaymentMethod({
      successUrl: window.location.href,
      cancelUrl: window.location.href,
    });
  }, []);

  return (
    <>
      <Header />
      <Title>Billing</Title>
      <Hero>
        <HeroText>
          <Paragraph>Billing is simple.</Paragraph>
          <Paragraph>
            Below, you can easily cancel your subscription anytime and email me
            to ask for a refund. You can also update your payment details.
          </Paragraph>
        </HeroText>
      </Hero>
      {hasValidSession ? (
        hasValidSubscription ? (
          <>
            <Subtitle>Thank you so much for your support!</Subtitle>
            <Paragraph>
              You're currently paying{' '}
              <strong>
                {isSubscriptionMonthly ? '€2 / month' : '€18 / year'}
              </strong>
              .
            </Paragraph>
            <Button
              onClick={handlePaymentDetailsUpdateClick}
              type="primary"
              width="large"
              style={{ margin: '2rem auto 1rem' }}
            >
              Update payment details
            </Button>
            {!isSubscriptionCanceled ? (
              <>
                <Button
                  onClick={handleSubscriptionCancelClick}
                  type="delete"
                  style={{ margin: '5rem auto 1rem' }}
                >
                  Cancel subscription
                </Button>
                <Paragraph isCentered>
                  The subscription will be canceled at the end of the current
                  billing period.
                </Paragraph>
              </>
            ) : null}
            {isSubscriptionCanceled ? (
              <>
                <Paragraph style={{ marginTop: '5rem' }}>
                  Your subscription is currently set to be canceled at the end
                  of the current billing period.
                </Paragraph>
                <Button
                  onClick={handleSubscriptionResumeClick}
                  type="secondary"
                  width="large"
                  style={{ margin: '2rem auto 1rem' }}
                >
                  Resume subscription
                </Button>
              </>
            ) : null}
          </>
        ) : isTrialing ? (
          <>
            <Subtitle>Your are on an active trial!</Subtitle>
            <Paragraph>
              If you're ready to pay, you probably want to check out the{' '}
              <Link href="/pricing">
                <a>pricing section</a>
              </Link>{' '}
              instead.
            </Paragraph>
          </>
        ) : (
          <>
            <Subtitle>Your subscription has expired!</Subtitle>
            <Paragraph>
              You probably want to check out the{' '}
              <Link href="/pricing">
                <a>pricing section</a>
              </Link>{' '}
              instead.
            </Paragraph>
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

export default Billing;
