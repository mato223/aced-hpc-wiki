---
id: overview
title: Tutorials overview
sidebar_label: "Tutorials overview"
sidebar_position: 1
---

# IGH HPC tutorials

These hands-on guides take you from your first login to running well-sized jobs on the IGH HPC cluster. If you are new to HPC, follow them in order.

Before you start, make sure you have an account and belong to at least one project: see [Accounts](../getting-started/accounts.md) and [Projects, sub-projects and roles](../getting-started/projects.md). Every job runs on a project's Slurm account and works in the project's folders.

---

## Linux basics {#linux-basics}

The cluster runs Linux and is used through a text terminal. There is no graphical desktop.

### Introduction to Linux {#introduction-to-linux}

[Introduction to Linux for HPC users](linux-basics/intro.md) is for researchers used to Windows or macOS. It covers:

- the shell prompt and your first commands;
- the IGH storage spaces: `$HOME`, `/projects/malaria`, `/scratch/malaria/<login>` and `/references`;
- navigating, creating, copying and deleting files and folders;
- viewing and searching files (`less`, `head`, `tail -f`, `grep`);
- permissions, your projects (`id`, `groups`) and sharing files with your team (`chmod g+rwX`);
- environment variables and a first Bash script.

---

## Running Slurm jobs {#running-slurm-jobs}

Computation never runs on the login node: you submit jobs to **Slurm**, which runs them on the compute nodes.

### Slurm basics {#slurm-basics}

[Slurm basics](running-jobs/slurm-basics.md): the everyday commands (`sbatch`, `squeue --me`, `scancel`, `sacct`, `seff`), the single `normal` partition, the QOS (`normal`, `debug`, `long`, `urgent`) and the mandatory project account (`--account=malaria`).

### Writing job scripts {#writing-job-scripts}

[Writing job scripts](running-jobs/job-scripts.md): the IGH job script template, line by line, with a complete bioinformatics example, and how to split long analyses into steps.

### Submitting with hpcsub {#submitting-with-hpcsub}

[hpcsub](running-jobs/hpcsub.md): the IGH submission command. It checks your project membership and your files, creates your results and work folders, and calls `sbatch` with the right account and log paths.

### Sample job scripts {#sample-job-scripts}

[Sample job scripts](running-jobs/sample-scripts.md): small, ready-to-submit scripts to test your environment (modules, storage, R with `module load gnu12 R/4.2.1`).

### Our nodes: cores, threads and memory {#our-nodes-cores-threads-and-memory}

[Our nodes](running-jobs/nodes.md): what a compute node contains (64 cores, 128 CPUs, 512 GB), how to choose `--cpus-per-task` and `--mem`, and why code compiled on the login node can fail on the compute nodes.

### Troubleshooting jobs {#troubleshooting-jobs}

[Troubleshooting](running-jobs/troubleshooting.md): pending jobs, rejected submissions (`Invalid account`, QOS limits), `Permission denied` in a project, `command not found`, `Illegal instruction`, out-of-memory errors, and what to send to support.

---

## Containers {#containers}

Containers package an application with all its dependencies so that it runs the same way on your computer and on the cluster.

- [What are containers?](containers/intro.md): the concepts, containers versus virtual machines.
- [Containerize your code](containers/containerize-code.md): build a Docker image on your own computer.
- [Containers on HPC clusters](containers/containers-hpc.md): run containers in Slurm jobs with Charliecloud (`module load charliecloud/0.44`).
- [Advanced build topics](containers/advanced-builds.md): smaller and more portable images.

---

## Where to start {#where-to-start}

If you are new to HPC, work through these pages in order:

1. [Introduction to Linux](linux-basics/intro.md): get comfortable with the terminal.
2. [Projects, sub-projects and roles](../getting-started/projects.md): understand where your data and results live.
3. [Slurm basics](running-jobs/slurm-basics.md): submit your first jobs.
4. [Writing job scripts](running-jobs/job-scripts.md) and [hpcsub](running-jobs/hpcsub.md): run your own analyses.
5. [Our nodes](running-jobs/nodes.md): size your jobs correctly.
