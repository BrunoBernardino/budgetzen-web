import { useCallback, useState } from 'react';
import Swal from 'sweetalert2';

import Loading from 'components/Loading';
import Button from 'components/Button';
import TextInput from 'components/TextInput';
import Paragraph from 'components/Paragraph';
import { validateLogin, createAccount } from 'lib/data-utils';
import { showNotification, updatePreferences } from 'lib/utils';

const LoginButton = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      return;
    }

    setIsSubmitting(true);

    const { success, error } = await validateLogin(email, password);

    if (success) {
      Swal.fire(
        'Alright!',
        "That looks alright. Let's get on with it!",
        'success',
      );

      updatePreferences();

      window.location.reload();
    } else {
      if (error) {
        showNotification(error, 'error');
      }

      setIsSubmitting(false);
    }
  }, [isSubmitting, email, password]);

  const handleSignup = useCallback(async () => {
    if (!email || !password) {
      return;
    }

    setIsSubmitting(true);

    const { success, error } = await createAccount(email, password);

    if (success) {
      Swal.fire(
        'Alright!',
        "That looks alright. Let's get on with it!",
        'success',
      );

      window.location.reload();
    } else {
      if (error) {
        showNotification(error, 'error');
      }

      setIsSubmitting(false);
    }
  }, [isSubmitting, email, password]);

  return (
    <>
      <Loading isShowing={isSubmitting} />
      <TextInput
        type="email"
        label="Email"
        name="email"
        value={email}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setEmail(event.target.value)
        }
        onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter') {
            handleLogin();
          }
        }}
      />
      <TextInput
        type="password"
        label="Password / Encryption Key"
        name="password"
        value={password}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setPassword(event.target.value)
        }
        onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter') {
            handleLogin();
          }
        }}
      />
      <Button
        onClick={handleLogin}
        width="large"
        type="primary"
        style={{ margin: '20px auto' }}
      >
        Login
      </Button>
      <Paragraph style={{ textAlign: 'center' }}>or</Paragraph>
      <Button
        onClick={handleSignup}
        width="large"
        type="secondary"
        style={{ margin: '20px auto' }}
      >
        Signup
      </Button>
    </>
  );
};

export default LoginButton;
