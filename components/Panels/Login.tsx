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
      <Title>Simple Budget Management</Title>
      <Hero>
        <HeroText>
          <Paragraph>Budget Zen is a simple budget management app.</Paragraph>
          <Paragraph>
            Currently it's available on every device via web browser, and you
            can browse its source code.
          </Paragraph>
          <LoginButton />
          <Paragraph>
            Note that logging in can take up to 30 seconds. This is because the
            encryption logic is intentionally slow, in order to generate a safer
            assymetric encryption key.
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
