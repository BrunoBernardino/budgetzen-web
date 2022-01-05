import Link from 'next/link';

import styles from './Header.module.scss';

const Header = () => {
  return (
    <header className={styles.Header}>
      <h1 className={styles.Header__logo}>
        <Link href="/">
          <a>
            <img
              alt="Logo: stylized letters Budget Zen"
              src="/images/logo.svg"
            />
          </a>
        </Link>
      </h1>
    </header>
  );
};

export default Header;
