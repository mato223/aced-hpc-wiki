import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import site from '@site/src/data/site';
import styles from './index.module.css';

function Hero() {
  return (
    <header className={styles.hero}>
      <div className={`container ${styles.heroInner}`}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>
            <Translate
              id="home.hero.eyebrow"
              values={{former: site.instituteFormer}}>
              {'Institute of Genomics and Global Health · formerly {former}'}
            </Translate>
          </p>
          <Heading as="h1" className={styles.title}>
            <Translate id="home.hero.title">
              High Performance Computing for genomics research
            </Translate>
          </Heading>
          <p className={styles.subtitle}>
            <Translate id="home.hero.subtitle">
              Everything you need to get an account, connect to the cluster,
              run your analyses and get help.
            </Translate>
          </p>
          <div className={styles.buttons}>
            <Link className="button button--primary button--lg" to="/docs/getting-started/first-job">
              <Translate id="home.hero.cta.start">Get started</Translate>
            </Link>
            <Link className="button button--outline button--lg" to="/docs/intro">
              <Translate id="home.hero.cta.docs">Browse the docs</Translate>
            </Link>
          </div>
        </div>

        <div className={styles.terminal} aria-hidden="true">
          <div className={styles.terminalBar}>
            <span /><span /><span />
          </div>
          <pre className={styles.terminalBody}>
            <span className={styles.prompt}>$</span> ssh username@{site.loginHost}{'\n'}
            <span className={styles.prompt}>$</span> module load samtools{'\n'}
            <span className={styles.prompt}>$</span> sbatch my_job.sh{'\n'}
            <span className={styles.muted}>Submitted batch job 123456</span>{'\n'}
            <span className={styles.prompt}>$</span> squeue --me
          </pre>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={translate({id: 'home.meta.title', message: 'Home'})}
      description={siteConfig.tagline}>
      <Hero />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
