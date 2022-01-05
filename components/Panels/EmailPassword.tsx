import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import userbase from 'userbase-js';
import Swal from 'sweetalert2';

import { Title, Subtitle, Paragraph } from 'components';
import { Header } from 'components/Layout';
import Button from 'components/Button';
import TextInput from 'components/TextInput';
import Loading from 'components/Loading';
import { showNotification } from 'lib/utils';

interface EmailPasswordProps {
  hasValidSession: boolean;
  currentEmail: string;
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

const EmailPassword = ({
  hasValidSession,
  currentEmail,
}: EmailPasswordProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState(currentEmail);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleEmailChangeClick = useCallback(async () => {
    setIsSubmitting(true);

    try {
      await userbase.updateUser({
        username: email,
        email,
      });

      window.location.reload();
    } catch (error) {
      showNotification(error, 'error');
    }

    setIsSubmitting(false);
  }, [email]);

  const handlePasswordChangeClick = useCallback(async () => {
    setIsSubmitting(true);

    try {
      await userbase.updateUser({
        currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      showNotification(error, 'error');
    }

    setIsSubmitting(false);

    Swal.fire(
      'Alright!',
      "If your current password matched, it changed successfully and you'll need to login in other devices again.",
      'success',
    );
  }, [currentPassword, newPassword]);

  useEffect(() => {
    setEmail(currentEmail);
  }, [currentEmail]);

  return (
    <>
      <Loading isShowing={isSubmitting} />
      <Header />
      <Title>Email and Password</Title>
      <Hero>
        <HeroText>
          <Paragraph>Change your email or password.</Paragraph>
          <Paragraph>
            When you change either, you'll need to login in other devices again.
          </Paragraph>
        </HeroText>
      </Hero>
      {hasValidSession ? (
        <>
          <Paragraph>Change your email</Paragraph>
          <TextInput
            type="email"
            label="Email"
            name="email"
            value={email}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(event.target.value)
            }
          />
          <Button
            onClick={handleEmailChangeClick}
            width="large"
            type="secondary"
            style={{ margin: '5rem auto' }}
          >
            Change Email
          </Button>
          <Paragraph>Change your password / encryption key</Paragraph>
          <TextInput
            type="password"
            label="Current Password / Encryption Key"
            name="currentPassword"
            value={currentPassword}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setCurrentPassword(event.target.value)
            }
          />
          <TextInput
            type="password"
            label="New Password / Encryption Key"
            name="newPassword"
            value={newPassword}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setNewPassword(event.target.value)
            }
          />
          <Button
            onClick={handlePasswordChangeClick}
            width="large"
            type="secondary"
            style={{ margin: '5rem auto' }}
          >
            Change Password / Encryption Key
          </Button>
        </>
      ) : (
        <>
          <Subtitle>Signup or Login first</Subtitle>
          <Paragraph>
            Before you can change your email or password, you need to{' '}
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

export default EmailPassword;
