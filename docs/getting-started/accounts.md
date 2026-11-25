---
id: accounts
title: Getting access
sidebar_label: "Getting access"
sidebar_position: 1
---

# Getting access {#getting-access}

## Your account {#your-account}

You log in to the cluster with your **IGH institutional account**: the same login and credentials you already use for the other services of the institute. There is no separate HPC account to create.

Having an institutional account is not enough to compute, though: **you must be a member of at least one project or sub-project**. Your project memberships decide which folders you can see and which Slurm accounts you can charge your jobs to. See [Projects, sub-projects and roles](projects.md).

## Request access {#request-access}

Open a ticket in the support portal at <Var name="supportPortal" link />:

- **Subject:** HPC access request (or *HPC project creation* if you need a new project).
- **Description:**
  - why you are going to use the HPC (type of analysis, data, tools);
  - the project(s) or sub-project(s) you work on.

If you ask to join an **existing project**, your request is validated by the **project admin** of that project. If you ask for a **new project**, the IT team creates it and sets up its project admins; see [the project life cycle](projects.md#life-cycle).

:::tip
If you already know who the project admin is, let them know about your request: it speeds up validation.
:::

## Once you have been added {#once-you-have-been-added}

1. If you were already connected, **log out and log in again**: a new project membership only takes effect in a new session.
2. Check your projects:

   ```bash
   groups
   sacctmgr show assoc user=$USER format=account,qos
   ```

   The first command lists your projects (as groups), the second the Slurm accounts and QOS you can use.

3. [Connect to the cluster](connecting.md) and [run your first job](first-job.md).

## Joining or leaving a project {#joining-or-leaving-a-project}

- To join another project or sub-project, open a new ticket in the same way. The project admin validates it.
- When you leave a project, you are removed from it and lose access to its folders and Slurm account. Make sure what you need is handed over to the team before you go.
- Access is only granted through project membership: the IT team does not open individual folders "by hand".

## Before you start {#before-you-start}

- Read the [usage policy](../policies/usage-policy.md) and the [good conduct guidelines](../good-conduct/overview.md).
- New to the command line? Follow [Linux basics](../tutorials/linux-basics/intro.md) and [Slurm basics](../tutorials/running-jobs/slurm-basics.md).
- Questions? See [Getting help](../support/contact.md).
