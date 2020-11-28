import { useCallback, useState } from 'react';
import Swal from 'sweetalert2';

import Loading from 'components/Loading';
import Button from 'components/Button';
import TextInput from 'components/TextInput';
import { doLogin } from 'lib/utils';

const LoginButton = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncToken, setSyncToken] = useState('');
  const handleLogin = useCallback(() => {
    setIsSubmitting(true);

    const success = doLogin(syncToken);

    if (success) {
      Swal.fire(
        'Alright!',
        "That looks like a valid Sync Token. Let's get on to it!",
        'success',
      );

      window.location.reload();
    }
  }, [isSubmitting, syncToken]);

  return (
    <>
      <Loading isShowing={isSubmitting} />
      <TextInput
        type="password"
        label="Sync Token"
        name="syncToken"
        value={syncToken}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setSyncToken(event.target.value)
        }
      />
      <Button onClick={handleLogin} width="large">
        Login
      </Button>
    </>
  );
};

export default LoginButton;
