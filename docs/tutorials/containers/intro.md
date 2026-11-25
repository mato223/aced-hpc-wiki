---
id: intro
title: Introduction to Containers
sidebar_label: "Welcome to Containers"
sidebar_position: 1
---

# Introduction to Containers

## What is a container? {#what-is-a-container}

A container is a lightweight, portable package that bundles an application together with everything it needs to run — libraries, tools, system packages and configuration — into a single unit that behaves the same way on any machine.

Without containers, getting software to run on a new machine means installing the right version of every dependency and hoping nothing conflicts with what is already installed. With containers, you package the environment once and run it anywhere.

```
┌─────────────────────────────────────┐
│         Your Container              │
│  ┌───────────────────────────────┐  │
│  │     Your Application          │  │
│  │  ┌─────────┐ ┌─────────┐      │  │
│  │  │ Python  │ │ NumPy   │      │  │
│  │  │ 3.11    │ │ 1.24    │ ...  │  │
│  │  └─────────┘ └─────────┘      │  │
│  └───────────────────────────────┘  │
│       Operating System Layer        │
│         (Ubuntu 22.04)              │
└─────────────────────────────────────┘
       Runs the same everywhere:
       laptop, cloud, HPC cluster
```

A container **image** is a read-only template. When you run an image, you create a **container**, a live instance of that template. You can run many containers from the same image, each isolated from the others.

:::info Why should you care?
If you have ever said "it works on my machine" and then spent hours making it work on the cluster, containers solve that problem. The environment that works on your laptop is the same one that runs on <Var name="clusterName" />.
:::

## Containers vs. virtual machines {#containers-vs-virtual-machines}

Both virtual machines (VMs) and containers provide isolation, but they work differently:

- A **virtual machine** includes a whole guest operating system on top of a hypervisor. VMs are heavy (gigabytes), slow to start (minutes) and resource-intensive.
- A **container** shares the host's kernel and only packages the application and its dependencies. Containers are light (megabytes), start in seconds and run almost as fast as native software.

For HPC work, containers add negligible overhead compared to running software directly on the host.

## Docker and Charliecloud {#docker-and-charliecloud}

Two tools matter for this tutorial series.

### Docker {#docker}

[Docker](https://www.docker.com/) is the standard for building and distributing container images. It provides:

- a simple build syntax (the **Dockerfile**)
- a huge ecosystem of ready-made images on [Docker Hub](https://hub.docker.com/)
- good developer tooling

Docker needs administrator (root) privileges, so it **cannot be used on the cluster**. Use it on your own workstation to build images.

### Charliecloud {#charliecloud}

[Charliecloud](https://charliecloud.io/) is a container runtime built for HPC centres. On <Var name="clusterName" /> it is the available runtime (module `charliecloud/0.44`):

- **Runs as your normal user**: no root needed
- **Works inside Slurm jobs**: containers run like any other program in a job script
- **Uses Docker images**: pull an image from Docker Hub (or import one exported from Docker) and run it
- **Near-native performance**: very little overhead

:::info Apptainer: not yet available
Apptainer (formerly Singularity) is **not yet available** on <Var name="clusterName" />. Use Charliecloud. If your workflow depends on Apptainer, contact support: <Var name="supportPortal" link />.
:::

## The container workflow on IGH HPC {#the-container-workflow-on-igh-hpc}

```
  Your workstation (Docker)              IGH HPC (Charliecloud + Slurm)
 ┌──────────────────────────┐          ┌──────────────────────────────┐
 │ 1. Write a Dockerfile    │          │ 4. Pull the image (in a job) │
 │ 2. Build the image       │  ──────> │ 5. Convert it to a directory │
 │ 3. Push it to a registry │          │ 6. Run it with ch-run        │
 └──────────────────────────┘          └──────────────────────────────┘
                    │
              Docker Hub or
              GitHub Container
              Registry
```

1. **Write** a Dockerfile describing your software environment
2. **Build** the image on your workstation (where you have Docker)
3. **Push** the image to a registry (Docker Hub, GitHub Container Registry)
4. **Pull** the image on the cluster with `ch-image pull`, inside a job
5. **Convert** it to a directory image in your scratch with `ch-convert`
6. **Run** your application with `ch-run` in a Slurm job script

:::warning Nothing heavy on the login node
Pulling, converting and running containers uses CPU, memory and disk. Do it inside a job on a compute node (interactive `srun` or `sbatch`), never on the login node <Var name="loginHost" code />.
:::

## Quick start: run your first container {#quick-start-run-your-first-container}

Log in to the cluster, open an interactive job on a compute node, then:

```bash
# Interactive job on a compute node
srun --account=malaria --qos=debug --cpus-per-task=2 --mem=4G --time=00:30:00 --pty bash

# Load Charliecloud
module load charliecloud/0.44

# Pull a Python image from Docker Hub
ch-image pull python:3.11-slim

# Convert it to a directory image in your scratch
mkdir -p /scratch/malaria/$USER/images
ch-convert python:3.11-slim /scratch/malaria/$USER/images/python-3.11-slim

# Run Python inside the container
ch-run /scratch/malaria/$USER/images/python-3.11-slim -- python3 -c "
import sys, os
print('Hello from inside a container!')
print(f'Python version: {sys.version}')
print(f'User: {os.environ.get(\"USER\", \"unknown\")}')
print(f'Hostname: {os.uname().nodename}')
"
```

Notice two things: you did not install Python — it came from the container — and you are still *you* inside the container (same user, your home directory is available).

:::caution To be confirmed
Whether the compute nodes can download images directly from Docker Hub has not been confirmed yet. If `ch-image pull` cannot reach the registry, use the offline method described in [Containers on HPC clusters](containers-hpc.md#importing-an-image-without-internet-access).
:::

## Prerequisites {#prerequisites}

To follow these tutorials you need:

- **Basic Linux command-line skills**: navigating directories, editing files, running commands (see [Introduction to Linux](../linux-basics/intro.md))
- **A programming language**: the examples use Python, but the concepts apply to any language

To build containers (next section), you also need on your own workstation:

- [Docker Desktop](https://docs.docker.com/get-docker/)
- a free [Docker Hub](https://hub.docker.com/signup) account

## Tutorial roadmap {#tutorial-roadmap}

| Section | What you will learn |
|---------|---------------------|
| [Containerize your code](containerize-code.md) | Write a Dockerfile, build an image, push it to a registry |
| [Containers on HPC clusters](containers-hpc.md) | Charliecloud on <Var name="clusterName" />, Slurm job scripts, MPI containers |
| [Advanced build topics](advanced-builds.md) | Multi-stage builds, multi-architecture builds |

## References {#references}

- [Charliecloud documentation](https://charliecloud.io/)
- [Docker documentation](https://docs.docker.com/)
- [Docker Hub](https://hub.docker.com/) — public registry of container images
- [BioContainers](https://biocontainers.pro/) — ready-made containers for bioinformatics tools
