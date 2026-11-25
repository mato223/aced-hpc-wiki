import Link from '@docusaurus/Link';
import site from '@site/src/data/site';

/**
 * Inserts a value from src/data/site.js into a doc.
 *
 *   <Var name="loginHost" />          -> plain text (inline code style)
 *   <Var name="supportEmail" link />  -> mailto: link
 *   <Var name="supportPortal" link /> -> external link
 */
export default function Var({name, link = false, code = false}) {
  const value = site[name];
  if (value === undefined) {
    return <span style={{color: 'var(--ifm-color-danger)'}}>[unknown var: {name}]</span>;
  }
  if (link) {
    const href = String(value).includes('@') && !String(value).startsWith('http')
      ? `mailto:${value}`
      : value;
    return <Link href={href}>{value}</Link>;
  }
  return code ? <code>{value}</code> : <>{value}</>;
}
