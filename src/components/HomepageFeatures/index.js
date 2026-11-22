import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

// Simple stroke icons (inherit currentColor, so they follow light/dark mode).
const icon = (d) => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const CARDS = [
  {
    to: '/docs/getting-started/accounts',
    icon: icon('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6'),
    title: <Translate id="home.card.account.title">Get an account</Translate>,
    text: <Translate id="home.card.account.text">Who is eligible, how to apply and what happens next.</Translate>,
  },
  {
    to: '/docs/getting-started/connecting',
    icon: icon('M4 17l6-6-6-6M12 19h8'),
    title: <Translate id="home.card.connect.title">Connect</Translate>,
    text: <Translate id="home.card.connect.text">SSH from Linux, macOS or Windows, keys and file transfers.</Translate>,
  },
  {
    to: '/docs/tutorials/running-jobs/slurm-basics',
    icon: icon('M5 3l14 9-14 9V3z'),
    title: <Translate id="home.card.jobs.title">Run jobs</Translate>,
    text: <Translate id="home.card.jobs.text">Submit, monitor and troubleshoot Slurm jobs, including on GPUs.</Translate>,
  },
  {
    to: '/docs/software/installed',
    icon: icon('M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.3 7L12 12l8.7-5M12 22V12'),
    title: <Translate id="home.card.software.title">Software</Translate>,
    text: <Translate id="home.card.software.text">Modules, containers and installing your own tools.</Translate>,
  },
  {
    to: '/docs/hardware/overview',
    icon: icon('M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01'),
    title: <Translate id="home.card.hardware.title">Hardware & storage</Translate>,
    text: <Translate id="home.card.hardware.text">Compute nodes, GPUs, file systems and quotas.</Translate>,
  },
  {
    to: '/docs/support/contact',
    icon: icon('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'),
    title: <Translate id="home.card.support.title">Get help</Translate>,
    text: <Translate id="home.card.support.text">FAQ, how to write a good support request, and contacts.</Translate>,
  },
];

export default function HomepageFeatures() {
  return (
    <section className={styles.section}>
      <div className="container">
        <Heading as="h2" className={styles.heading}>
          <Translate id="home.cards.heading">Where do you want to start?</Translate>
        </Heading>
        <div className={styles.grid}>
          {CARDS.map((c) => (
            <Link key={c.to} to={c.to} className={styles.card}>
              <span className={styles.icon}>{c.icon}</span>
              <Heading as="h3" className={styles.cardTitle}>{c.title}</Heading>
              <p className={styles.cardText}>{c.text}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
