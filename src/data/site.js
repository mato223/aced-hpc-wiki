/**
 * Single source of truth for institute- and cluster-specific values.
 *
 * Change a value here and it updates everywhere: the site config, the
 * homepage, and any doc that uses <Var name="..." /> in Markdown/MDX.
 *
 * Values marked TODO are placeholders until the real details are confirmed.
 */
export const site = {
  // Institute
  instituteShort: 'IGH',
  instituteFormer: 'ACEGID',
  instituteName: 'Institute of Genomics and Global Health',
  instituteUrl: 'https://acegid.org', // TODO: confirm IGH website
  hostUniversity: "Redeemer's University",
  hostUniversityUrl: 'https://run.edu.ng',

  // Cluster
  clusterName: 'IGH HPC', // TODO: official cluster name
  loginHost: 'login.hpc.example.org', // TODO: real login node hostname
  ondemandUrl: 'https://ondemand.hpc.example.org', // TODO: or remove if no OOD
  scheduler: 'Slurm',

  // Support
  supportEmail: 'hpc-support@example.org', // TODO: real support address
  supportHours: 'Mon–Fri, 09:00–17:00 WAT', // West Africa Time (UTC+1)
  accountRequestUrl: '#', // TODO: account request form link

  // Repository (used for "Edit this page" links)
  githubOrg: 'TODO-org',
  githubRepo: 'igh-hpc-wiki',
};

export default site;
