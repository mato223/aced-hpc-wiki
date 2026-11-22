import CodeBlock from '@theme/CodeBlock';
import site from '@site/src/data/site';

/**
 * A code block that can contain values from src/data/site.js.
 * Markdown code fences can't contain components, so use this instead:
 *
 *   <SiteCode language="bash" code="ssh username@{loginHost}" />
 */
export default function SiteCode({code, language = 'bash', title}) {
  const text = code.replace(/\{(\w+)\}/g, (m, key) => (key in site ? site[key] : m));
  return (
    <CodeBlock language={language} title={title}>
      {text}
    </CodeBlock>
  );
}
