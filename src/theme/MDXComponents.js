// Makes custom components available in every .md/.mdx file without imports.
import MDXComponents from '@theme-original/MDXComponents';
import Var from '@site/src/components/Var';
import SiteCode from '@site/src/components/SiteCode';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

export default {
  ...MDXComponents,
  Var,
  SiteCode,
  Tabs,
  TabItem,
};
