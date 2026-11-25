---
title: Good Conduct on the IGH HPC
sidebar_position: 1
sidebar_label: "Overview"
---

The <Var name="clusterName" /> cluster is shared by many researchers at the same time. What you do affects everyone else's work. Following these guidelines keeps the cluster fast and available for all.

## Core principles {#core-principles}

1. **Never compute on the login node**: <Var name="loginHost" code /> is a shared gateway for editing and submitting jobs, not a compute resource. See [Login node guidelines](login-nodes.md).
2. **Submit jobs responsibly**: always set `--account`, `--mem` and a realistic `--time`, and give your software exactly the threads you reserved. See [Job submission tips](job-submission.md).
3. **Use each storage space for what it is for**: compute in scratch, keep results in your project, never duplicate raw data or references. See [File system practices](file-system.md).
4. **Transfer files efficiently**: archive many small files before transferring them. See [File transfer guide](file-transfers.md).

## Quick reference {#quick-reference}

| Do | Don't |
|---|---|
| Submit jobs with Slurm (`sbatch`, `srun`) | Run computations or pipelines on the login node |
| Always set `--mem` (or `--mem-per-cpu`) | Submit a job without memory: it blocks a whole node |
| Use `$SLURM_CPUS_PER_TASK` for your software's threads | Let a tool use all 128 CPUs of a node |
| Work in scratch, keep results in `/projects/<project>/results` | Leave your only copy of results in scratch |
| Copy into a project with `cp -r` or `rsync -rlt` | Use `cp -a`, `rsync -a` or `mv` into a project |
| Read raw data and references where they are | Duplicate `data/raw/` or `/references` |
| Archive small files before transferring | Transfer thousands of tiny files one by one |

## Why this matters {#why-this-matters}

The cluster has eight compute nodes shared by all IGH teams. A single job without a memory limit can block a whole node; a single heavy process on the login node can slow down everyone's sessions. Responsible use means:

- **Access for everyone**: all researchers can work effectively;
- **A stable system**: the login node and storage stay responsive;
- **Shorter waiting times**: resources are not reserved for nothing.

## Consequences of misuse {#consequences-of-misuse}

Repeated violations of these guidelines may result in:

- processes being stopped or jobs being cancelled;
- account suspension;
- a required discussion with the support team before access is restored.

See also the [Usage policy](../policies/usage-policy.md).

## Getting help {#getting-help}

If you are unsure whether your workflow follows these guidelines, contact the IT team **before** running large jobs:

- Ticket: <Var name="supportPortal" link />
- Email: <Var name="supportEmail" link />
- See the [FAQ](../support/faq.md) and the [Contact](../support/contact.md) page.
