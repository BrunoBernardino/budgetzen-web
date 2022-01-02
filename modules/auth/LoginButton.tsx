import { useCallback, useState } from 'react';
import Swal from 'sweetalert2';

import Loading from 'components/Loading';
import Button from 'components/Button';
import TextInput from 'components/TextInput';
import { validateLogin, createAccount } from 'lib/data-utils';
import { showNotification } from 'lib/utils';

const LoginButton = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [syncToken, setSyncToken] = useState('');
  const handleLogin = useCallback(async () => {
    if (!email || !syncToken) {
      return;
    }

    setIsSubmitting(true);

    const { success, error } = await validateLogin(email, syncToken);

    if (success) {
      Swal.fire(
        'Alright!',
        "That looks alright. Let's get on with it!",
        'success',
      );

      window.location.reload();
    } else {
      if (error) {
        const errorMessage = error.toString();
        if (errorMessage.includes('User not found')) {
          showNotification(
            'User does not exist. Will create an account and login.',
            'error',
          );
          await createAccount(email, syncToken);
        } else {
          showNotification(error, 'error');
        }
      }

      setIsSubmitting(false);
    }
  }, [isSubmitting, email, syncToken]);

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
        label="Sync Token"
        name="syncToken"
        value={syncToken}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setSyncToken(event.target.value)
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
        style={{ margin: '20px auto' }}
      >
        Login
      </Button>
    </>
  );
};

export default LoginButton;
