---
id: overview
title: Hardware Overview
sidebar_position: 1
sidebar_label: "Cluster Overview"
---

The <Var name="clusterName" /> cluster is a CPU cluster built for genomics and bioinformatics: one login node and eight compute nodes, all connected to the shared storage over a 100 Gb/s InfiniBand network.

## At a glance {#at-a-glance}

| Component | Name | Count | Main figures |
|-----------|------|-------|--------------|
| Login node | <Var name="loginHost" code /> | 1 | 32 cores / 64 threads, ~250 GB RAM |
| Compute nodes | `acegid-cpu-01` … `acegid-cpu-08` | 8 | 64 cores / 128 Slurm CPUs and 512 GB RAM each |
| **Total compute** | | | **512 cores / 1,024 Slurm CPUs / ~4 TB RAM** |
| GPU | — | 0 | The cluster has **no GPU** |

## Login node {#login-node}

<Var name="loginHost" code /> is the machine you connect to with SSH (see [Connecting](../getting-started/connecting.md)).

| Property | Value |
|----------|-------|
| Server | Dell PowerEdge R750 |
| Processors | 2 × Intel Xeon Gold 6326 (2.9 GHz, 16 cores each) |
| Cores / threads | 32 cores / 64 threads |
| Memory | ~250 GB |
| Instruction sets | AVX-512 |
| Operating system | RHEL 8.10 |

It is used for SSH access, editing files, small compilations and submitting jobs. **No computation runs on the login node**: see [Login node guidelines](../good-conduct/login-nodes.md).

## Compute nodes {#compute-nodes}

The eight compute nodes, `acegid-cpu-01` to `acegid-cpu-08`, run all jobs submitted through Slurm.

| Property | Per node |
|----------|----------|
| Server | Dell PowerEdge C6525 |
| Processors | 2 × AMD EPYC 7543 (32 cores each, up to 3.7 GHz) |
| Physical cores | 64 |
| Logical CPUs (Slurm CPUs) | 128 (hyperthreading) |
| NUMA domains | 2 |
| Memory | 512 GB (~503 GB allocatable by Slurm) |
| Instruction sets | AVX2 (no AVX-512) |

### Cores, threads and Slurm CPUs {#cores-threads-and-slurm-cpus}

Hyperthreading is enabled: each physical core appears as **2 CPUs** to Slurm. A node therefore offers 128 Slurm CPUs, and `--cpus-per-task=8` gives you 4 physical cores. How to choose `-c` and `--mem` for these nodes is explained in [Our nodes: cores, threads and memory](../tutorials/running-jobs/nodes.md).

### Stateless nodes {#stateless-nodes}

The compute nodes are *stateless*: their operating system is loaded into memory at boot.

- There is **no local disk** for users on the compute nodes.
- `/tmp` on a compute node lives **in RAM**: do not write large files there, use your [scratch space](storage.md#scratch) instead.
- Your files are always on the shared storage, visible in the same way from the login node and from every compute node (see [Storage](storage.md)).

## Compiling for the compute nodes {#compiling-for-the-compute-nodes}

The login node has Intel processors with AVX-512; the compute nodes have AMD processors **without** AVX-512. A program compiled on the login node with `-march=native` may crash on the compute nodes with an `Illegal instruction` error.

Either compile inside a job on a compute node, or target the compute nodes explicitly:

```bash
# Portable build for the AMD compute nodes
gcc -O2 -march=znver3 -o my_tool my_tool.c

# Or, more generic
gcc -O2 -mavx2 -o my_tool my_tool.c
```

See also [Installing your own software](../software/custom-install.md).

## Network and software stack {#network-and-software-stack}

| Component | Details |
|-----------|---------|
| Interconnect | InfiniBand 100 Gb/s (nodes ↔ storage) |
| Cluster stack | OpenHPC 2.10 |
| Scheduler | Slurm, single partition `normal` (see [Slurm basics](../tutorials/running-jobs/slurm-basics.md)) |
| Software modules | Lmod (see [Modules](../software/modules.md)) |
| Accounts | IGH institutional directory (see [Accounts](../getting-started/accounts.md)) |

## What the cluster does not have {#what-the-cluster-does-not-have}

- **No GPU**: all computation runs on CPUs.
- **No large-memory node**: a node offers at most ~503 GB of memory to jobs.
- **One partition only** (`normal`); job limits are set by QOS, not by partition.
