// @ts-check
// Runs in Node.js — no browser APIs or JSX here.
import {execSync} from 'node:child_process';
import {themes as prismThemes} from 'prism-react-renderer';
import site from './src/data/site.js';

const repoUrl = `https://github.com/${site.githubOrg}/${site.githubRepo}`;

// "Last updated on…" needs git history; skip it until the repo has a commit.
let hasGitHistory = false;
try {
  execSync('git rev-parse --verify HEAD', {stdio: 'ignore'});
  hasGitHistory = true;
} catch {}

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: `${site.instituteShort} HPC Wiki`,
  tagline:
    'Documentation for the High Performance Computing cluster of the Institute of Genomics and Global Health',
  favicon: 'img/igh-favicon.png',

  // TODO: set to the production URL once hosting is decided.
  url: 'https://hpc-wiki.example.org',
  baseUrl: '/',

  organizationName: site.githubOrg,
  projectName: site.githubRepo,

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'warn',

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // English is the default (served at /), French is served at /fr/.
  // Any page not yet translated falls back to the English version automatically.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr'],
    localeConfigs: {
      en: {label: 'English', htmlLang: 'en-GB'},
      fr: {label: 'Français', htmlLang: 'fr-FR'},
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: `${repoUrl}/tree/main/`,
          editLocalizedFiles: true,
          showLastUpdateTime: hasGitHistory,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      /** @type {import('@easyops-cn/docusaurus-search-local').PluginOptions} */
      ({
        hashed: true,
        language: ['en', 'fr'],
        indexBlog: false,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.png',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
      navbar: {
        title: `${site.instituteShort} HPC Wiki`,
        logo: {
          alt: `${site.instituteShort} logo`,
          src: 'img/igh-logo.png',
        },
        hideOnScroll: false,
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docs',
            position: 'left',
            label: 'Documentation',
          },
          {
            to: '/docs/getting-started/first-job',
            label: 'Quick start',
            position: 'left',
          },
          {
            to: '/docs/support/contact',
            label: 'Support',
            position: 'left',
          },
          {type: 'localeDropdown', position: 'right'},
          {
            href: repoUrl,
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {label: 'Introduction', to: '/docs/intro'},
              {label: 'Getting an account', to: '/docs/getting-started/accounts'},
              {label: 'Running jobs', to: '/docs/tutorials/running-jobs/slurm-basics'},
            ],
          },
          {
            title: 'Support',
            items: [
              {label: 'FAQ', to: '/docs/support/faq'},
              {label: 'Getting help', to: '/docs/support/contact'},
              {label: 'Usage policy', to: '/docs/policies/usage-policy'},
            ],
          },
          {
            title: 'Institute',
            items: [
              {label: `${site.instituteShort} website`, href: site.instituteUrl},
              {label: site.hostUniversity, href: site.hostUniversityUrl},
              {label: 'GitHub', href: repoUrl},
            ],
          },
        ],
        copyright: `© ${new Date().getFullYear()} ${site.instituteName} (${site.instituteShort}), formerly ${site.instituteFormer}.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'python', 'r', 'yaml', 'docker'],
      },
    }),
};

export default config;
