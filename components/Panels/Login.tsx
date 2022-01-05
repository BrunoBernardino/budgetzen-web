import React from 'react';
import styled from 'styled-components';

import { Title, Subtitle, Paragraph } from 'components';
import { Header } from 'components/Layout';
import LoginButton from 'modules/auth/LoginButton';

const Hero = styled.section`
  @media only screen and (min-width: 600px) {
    display: flex;
    align-items: center;
  }
`;

const HeroText = styled.section`
  margin-right: 1em;
`;

const Login = () => {
  return (
    <>
      <Header />
      <Title>Simple + Encrypted Budget Management</Title>
      <Hero>
        <HeroText>
          <Paragraph>
            Budget Zen is a simple and <strong>encrypted</strong> budget
            management app. You can{' '}
            <a href="https://budgetzen.net">learn more about it here</a>, as
            this is the app.
          </Paragraph>
          <Paragraph>
            Currently it's available on every device via web browser, and you
            can browse its source code.
          </Paragraph>
          <Paragraph>
            You have a <strong>30-day free trial</strong> (no credit card
            required), and at the end, you can pay <strong>€18 / year</strong>,
            or <strong>€2 / month</strong>, no limits.
          </Paragraph>
          <LoginButton />
          <Paragraph>
            Note that logging in will take up a few seconds. This is
            intentional, in order to generate a safer assymetric encryption key.
            After logging in, the app should be blazing fast in any device.
          </Paragraph>
        </HeroText>
      </Hero>
      <Subtitle>Need help?</Subtitle>
      <Paragraph>
        If you're having any issues or have any questions,{' '}
        <strong>
          <a href="mailto:me@brunobernardino.com">please reach out</a>
        </strong>
        .
      </Paragraph>
    </>
  );
};

export default Login;
