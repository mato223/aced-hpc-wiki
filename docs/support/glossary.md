---
id: glossary
title: "Glossary"
sidebar_label: "Glossary"
sidebar_position: 3
---

# Glossary {#glossary}

Short definitions of the terms used in this wiki.

## Projects and access {#projects-and-access}

- **Project:** the unit everything on the cluster belongs to (for example `malaria`). A project has a shared folder (`/projects/malaria`), a scratch space (`/scratch/malaria/<login>`) and a Slurm account (`malaria`). See [Projects, sub-projects and roles](../getting-started/projects.md).
- **Sub-project:** a smaller team or work package inside a project, with its own folder (`/projects/malaria/<sub-project>`), scratch space and Slurm account (`malaria_<sub-project>`). Its members do not see the other sub-projects.
- **Member:** a person who reads and writes in a project (or sub-project) and runs jobs on its Slurm account.
- **Reader:** a person who can consult a project's data but does not compute on it.
- **Project admin:** one of the 1 or 2 people who manage a project: they ask for members to be added or removed, keep the project `README.md` up to date, can manage the project's jobs and receive its usage reports.
- **Institutional account:** your IGH login, used for the cluster and the other services of the institute.

## Cluster and hardware {#cluster-and-hardware}

- **Cluster:** a group of computers (nodes) working together and shared by many users.
- **Login node:** the machine you connect to (<Var name="loginHost" code />). For editing, transfers and submitting jobs, never for computing.
- **Compute node:** a machine that runs jobs. The IGH HPC has eight (<Var name="computeNodes" />). See [Hardware overview](../hardware/overview.md).
- **Stateless node:** a compute node whose system is loaded into memory at boot. It has no local disk for users, and its `/tmp` is in memory, so do not write big files there.
- **Core / CPU:** a physical core can run two threads at once (hyperthreading). Slurm counts each thread as one CPU: 1 core = 2 Slurm CPUs.
- **InfiniBand:** the fast network (100 Gb/s) linking the nodes and the storage.

## Jobs and Slurm {#jobs-and-slurm}

- **Slurm:** the scheduler that shares the compute nodes between users and runs jobs.
- **Job:** a piece of work submitted to Slurm, usually a script started with `sbatch`.
- **Job script:** a shell script whose `#SBATCH` lines describe the resources the job needs.
- **Slurm account:** the project a job is charged to, set with `--account` (for example `--account=malaria`). Required.
- **Partition:** a group of nodes jobs are sent to. The IGH HPC has a single partition, `normal`.
- **QOS (Quality of Service):** a set of limits and priority applied to a job: `normal` (default), `debug` (quick tests), `long` (on request), `urgent` (temporary). See [Slurm basics](../tutorials/running-jobs/slurm-basics.md).
- **Wall time:** the maximum duration of a job, set with `--time`.
- **Job array:** many similar jobs submitted at once, each with its own index (`$SLURM_ARRAY_TASK_ID`).
- **hpcsub:** the IGH command that wraps `sbatch` and submits a job in the right project folders. See [hpcsub](../tutorials/running-jobs/hpcsub.md).

## Storage and software {#storage-and-software}

- **NFS:** the network file system that makes the same folders (home, projects, scratch, references) visible from the login node and every compute node.
- **Home (`$HOME`):** your private folder, backed up, for scripts and configuration.
- **Scratch:** fast space for running computations and big temporary files. Not backed up; files not used for <Var name="scratchPurgeDays" /> days are deleted. See [Storage](../hardware/storage.md).
- **`/references`:** shared, versioned reference genomes and databases (for example `/references/kraken2/2026-11`), read-only.
- **Module:** a way to load a piece of software and its environment with `module load`. See [Modules](../software/modules.md).
- **Conda:** a package manager used to install tools (including bioinformatics tools) in your home or project folder.
- **Container:** a packaged application with all its dependencies. On the IGH HPC, containers run with Charliecloud. See [Containers](../tutorials/containers/intro.md).
