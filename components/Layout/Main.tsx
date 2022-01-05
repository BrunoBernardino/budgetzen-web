import { ReactNode } from 'react';
import Head from 'next/head';
import Helmet from 'react-helmet';

import { Footer } from 'components/Layout';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
  hasValidSession?: boolean;
}

const MainLayout = ({
  children,
  title,
  description,
  keywords,
  hasValidSession,
}: MainLayoutProps) => {
  const metaTags = [
    { property: 'og:title', content: title },
    {
      name: 'description',
      content: description,
    },
    {
      name: 'keywords',
      content: keywords,
    },
  ];

  const SEOOverride: JSX.Element =
    title && description ? <Helmet title={title} meta={metaTags} /> : null;

  return (
    <>
      <Head>
        {title && <title>{title}</title>}
        {title && <meta property="og:title" content={title} />}
        {description && <meta name="description" content={description} />}
        {keywords && <meta name="keywords" content={keywords} />}
      </Head>
      {SEOOverride}
      <div className="wrapper">{children}</div>
      <Footer hasValidSession={Boolean(hasValidSession)} />
    </>
  );
};

export default MainLayout;
