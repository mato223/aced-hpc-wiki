/**
 * Single source of truth for institute- and cluster-specific values.
 *
 * Change a value here and it updates everywhere: the site config, the
 * homepage, and any doc that uses <Var name="..." /> in Markdown/MDX
 * or {key} inside <SiteCode code="..." />.
 *
 * Values marked TODO are placeholders until the real details are confirmed.
 */
export const site = {
  // Institute
  instituteShort: 'IGH',
  instituteFormer: 'ACEGID',
  instituteName: 'Institute of Genomics and Global Health',
  instituteUrl: 'https://ighresearch.org',
  hostUniversity: "Redeemer's University",
  hostUniversityShort: 'RUN',
  hostUniversityUrl: 'https://run.edu.ng',
  location: 'Ede, Osun State, Nigeria',
  timezone: 'WAT (UTC+1)',

  // Cluster
  clusterName: 'IGH HPC',
  loginHost: 'acegid-hpc-01', // reachable from the institute network only (no public DNS name)
  computeNodes: 'acegid-cpu-01 … acegid-cpu-08',
  scheduler: 'Slurm',
  partition: 'normal',

  // Slurm QOS limits — NOT FINAL, may change: edit here only.
  // Numbers only, so pages can write the unit in their own language.
  qosNormalMaxDays: 7,
  qosNormalMaxCpusPerUser: 384,
  qosDebugMaxHours: 1,
  qosDebugMaxCpus: 16,
  qosDebugMaxRunning: 2,
  qosDebugMaxQueued: 4,
  qosLongMaxDays: 30,
  qosLongMaxCpusTotal: 256,
  qosLongMaxJobsPerUser: 4,
  qosUrgentMaxDays: 3,

  // Storage
  scratchPurgeDays: 30,
  scratchNoticeDays: 7,

  // Support
  supportEmail: 'it.acegid@run.edu.ng',
  supportHours: 'Mon–Fri, 08:00–17:00 WAT',
  supportHoursFr: 'du lundi au vendredi, 8 h – 17 h (WAT)',
  supportPortal: 'https://staff.ighresearch.org',
  accountRequestUrl: 'https://staff.ighresearch.org', // support ticket: "HPC access request"

  // Repository (used for "Edit this page" links)
  githubOrg: 'TODO-org', // TODO
  githubRepo: 'igh-hpc-wiki', // TODO
};

export default site;
