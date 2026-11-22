import Content from '@theme-original/NotFound/Content';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useLocation} from '@docusaurus/router';

/**
 * In dev mode (`npm run dev`) Docusaurus serves ONE language only, so the
 * language switcher leads to a 404. Explain that instead of a bare 404.
 * In production (`npm start` / build) this never shows.
 */
export default function ContentWrapper(props) {
  const {i18n} = useDocusaurusContext();
  const {pathname} = useLocation();
  const otherLocale = i18n.locales.find(
    (l) => l !== i18n.currentLocale && l !== i18n.defaultLocale && pathname.startsWith(`/${l}/`),
  ) || (i18n.currentLocale !== i18n.defaultLocale && !pathname.startsWith(`/${i18n.currentLocale}/`) ? i18n.defaultLocale : null);

  if (process.env.NODE_ENV === 'development' && otherLocale) {
    return (
      <main className="container margin-vert--xl">
        <div className="alert alert--warning" role="alert">
          <h2>Dev mode: one language at a time / Mode dev : une langue à la fois</h2>
          <p>
            The development server only serves <b>{i18n.currentLocale}</b>. To test the
            language switch, run <code>npm start</code> (full site, both languages).
            To edit the <b>{otherLocale}</b> pages with live reload, run{' '}
            <code>npm run dev{otherLocale === i18n.defaultLocale ? '' : `:${otherLocale}`}</code>.
          </p>
          <p>
            Le serveur de développement ne sert que <b>{i18n.currentLocale}</b>. Pour tester
            le changement de langue, lancez <code>npm start</code>.
          </p>
          <Link to="/">← Home</Link>
        </div>
      </main>
    );
  }
  return <Content {...props} />;
}
