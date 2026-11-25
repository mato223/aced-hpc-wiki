---
id: contact
title: Getting help
sidebar_label: "Getting help"
sidebar_position: 2
---

# Getting help {#getting-help}

The IGH IT team supports researchers using the cluster: access, jobs, software and data. A clear request helps us solve your problem faster.

## Who to contact {#who-to-contact}

| Your question | Contact |
|---|---|
| Access to a project, its rules or its data | **The project admin** first (listed in the project `README.md`). See [Projects, sub-projects and roles](../getting-started/projects.md). |
| HPC access, new project, software, job problems, anything else | **IT support** (below). |

## How to contact IT support {#how-to-contact-it-support}

| Channel | Details |
|---|---|
| **Support ticket** (preferred) | <Var name="supportPortal" link /> |
| **Email** | <Var name="supportEmail" link /> |
| **Hours** | <Var name="supportHours" /> |

Use a ticket for HPC access requests, new projects, new software or reference databases, and access to the `long` QOS.

## Before you ask {#before-you-ask}

- **Check the documentation:** the [FAQ](faq.md), [Troubleshooting](../tutorials/running-jobs/troubleshooting.md) and the [good conduct guidelines](../good-conduct/overview.md).
- **Read the error message.** It often says exactly what went wrong.
- **Look at your job logs** (`.out` and `.err` files) and run `sacct -j <jobid> --format=JobID,State,ExitCode,MaxRSS,Elapsed` or `seff <jobid>`.
- **Check your environment:** `module list`, your projects with `groups`, and the paths in your script.

## Writing a good request {#writing-a-good-request}

Include:

1. **Your login** on the cluster and the **project** (and sub-project) you work in.
2. **What you were trying to do.**
3. **What you did:** the exact commands.
4. **What happened:** the **complete error message**, copied as is.
5. **Job details**, if relevant: job ID, the folder of your job script, the script itself, the modules loaded.
6. **What you already tried.**

### Example of a good request {#example-of-a-good-request}

> **Subject:** Job 485210 killed for out-of-memory (project malaria)
>
> Hello, I submitted job 485210 on the `malaria` account with the script `/projects/malaria/scripts/run_assembly.sh`. It stopped after 20 minutes with:
>
> `slurmstepd: error: Detected 1 oom_kill event in StepId=485210.0.`
>
> I requested `--mem=16G`. My input is about 40 GB of reads. I tried 32G and it still failed. How much memory should I ask for?

### Example of a poor request {#example-of-a-poor-request}

> **Subject:** Job not working
>
> My job failed. Can you help?

## What we can help with {#what-we-can-help-with}

- **Access:** HPC access, project creation, membership problems.
- **Jobs:** Slurm errors, choosing resources (CPUs, memory, time, QOS), out-of-memory kills.
- **Software:** installed modules, conda, new software or reference databases.
- **Data:** file transfers, organisation of project folders, permissions.

## Outside our scope {#outside-our-scope}

- Debugging the scientific logic of your own code.
- Teaching programming languages: use online courses and training programmes.
- Scientific questions about third-party tools: see their documentation or user community.
