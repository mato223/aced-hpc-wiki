---
id: intro
title: Welcome to the IGH HPC
sidebar_label: "Introduction"
sidebar_position: 1
---

# Welcome to the IGH HPC {#welcome}

The **Institute of Genomics and Global Health (IGH)**, formerly ACEGID, at Redeemer's University (RUN), Ede, Osun State, Nigeria, runs a high-performance computing (HPC) cluster for its research in genomics and global health: sequencing data analysis, bioinformatics, phylogenetics and related work.

This wiki explains how to get access, organise your data in projects, run jobs with Slurm and use the cluster responsibly.

:::info
The project-based organisation (`/projects`, `/scratch`, `/references`, project accounts in Slurm) is being rolled out project by project. If your project does not have its space yet, [contact support](support/contact.md).
:::

## What the cluster offers {#what-the-cluster-offers}

- **One login node**, <Var name="loginHost" code />, to connect, edit files and submit jobs. No computing happens there.
- **Eight compute nodes** (<Var name="computeNodes" />) with 512 physical cores and about 4 TB of memory in total, managed by the **Slurm** scheduler.
- **Shared storage** visible from every node: your home directory, project folders, a fast scratch space and shared reference databases.
- **Software** through environment modules, plus conda, EasyBuild and Spack for your own tools.

See [Hardware overview](hardware/overview.md) and [Storage](hardware/storage.md) for details.

## How work is organised {#how-work-is-organised}

All work on the cluster belongs to a **project** (for example `malaria`), which may have **sub-projects**. Each project has a shared folder, a scratch space and a Slurm account that you charge your jobs to. You get access by being added to a project. Read [Projects, sub-projects and roles](getting-started/projects.md) before you start: it is the key to everything else.

## Getting started {#getting-started}

1. [Request access](getting-started/accounts.md) with a support ticket.
2. Understand [projects, sub-projects and roles](getting-started/projects.md).
3. [Connect to the cluster](getting-started/connecting.md) from the institute network.
4. [Run your first job](getting-started/first-job.md).
5. Read the [good conduct guidelines](good-conduct/overview.md) and the [usage policy](policies/usage-policy.md).

## Key facts {#key-facts}

| | |
|---|---|
| Login node | <Var name="loginHost" code /> (institute network only) |
| Scheduler | Slurm, single partition `normal` |
| Time zone | WAT (UTC+1) |
| Support | <Var name="supportEmail" link />, ticket on <Var name="supportPortal" link /> |
| Support hours | <Var name="supportHours" /> |

## Need help? {#need-help}

- Browse the [FAQ](support/faq.md) and the [glossary](support/glossary.md).
- Follow the [tutorials](tutorials/overview.md), starting with [Linux basics](tutorials/linux-basics/intro.md) if you are new to the command line.
- [Contact support](support/contact.md) if you are stuck.
