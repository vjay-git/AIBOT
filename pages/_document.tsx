import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        {/* Custom favicon for the app */}
        <link rel="icon" type="image/png" href="/assets/icons/Logo.png" />
    
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
