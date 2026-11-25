---
id: nodes
title: "Our nodes: cores, threads and memory"
sidebar_label: "Our nodes"
sidebar_position: 5
---

To size a job well, you need to know what a compute node contains and how Slurm counts it. This page explains it and gives simple rules for choosing `--cpus-per-task` (`-c`) and `--mem`.

---

## A compute node at a glance {#a-compute-node-at-a-glance}

The cluster has 8 identical compute nodes, <Var name="computeNodes" code /> (Dell PowerEdge C6525).

| | Per node | Whole cluster (8 nodes) |
|---|---|---|
| Processors | 2 × AMD EPYC 7543 (32 cores each, up to 3.7 GHz) | 16 processors |
| Physical cores | 64 | 512 |
| CPUs for Slurm (logical CPUs) | 128 | 1,024 |
| Memory | 512 GB, about 503 GB allocatable by Slurm | about 4 TB |
| NUMA domains | 2 | |
| Instruction set | AVX2 (no AVX-512) | |
| Local disk for users | None (`/tmp` is in memory) | |

There are no GPUs and no special large-memory nodes: every job runs on one of these nodes. Details of the hardware are in [Hardware overview](../../hardware/overview.md).

---

## Cores, threads and Slurm CPUs {#cores-threads-and-slurm-cpus}

Each physical core runs two hardware threads (hyperthreading). Slurm counts each thread as one **CPU**:

- **1 core = 2 Slurm CPUs**, so a node has 64 cores but 128 CPUs.
- `--cpus-per-task=8` gives you 8 CPUs, that is 4 physical cores.
- The QOS limits (for example <Var name="qosNormalMaxCpusPerUser" /> CPUs per user in `normal`) are counted in Slurm CPUs.

Two threads on the same core share that core's computing units. For heavy calculations, 16 CPUs are therefore faster than 8, but not twice as fast. This is normal: measure, do not assume.

---

## NUMA: two halves per node {#numa-two-halves-per-node}

Each node has 2 **NUMA domains**: the memory is split into two halves, and each half is closer to one of the two processors. A thread reading memory attached to the other processor is a little slower.

In practice:

- Small and medium jobs (up to a few dozen CPUs) do not need to worry about it.
- A program that uses the whole node (128 CPUs) spans both domains. If it scales poorly, several smaller jobs (for example one per sample) often finish sooner than one huge job.

---

## Choosing --cpus-per-task {#choosing-cpus-per-task}

`--cpus-per-task` is for **multithreaded** programs (one process, several threads), which is the case of most bioinformatics tools. Use `--ntasks` only for MPI programs.

1. **Check that your program can use several threads.** If it cannot (many R and Python scripts), ask for `-c 1` or `-c 2`: extra CPUs would stay idle.
2. **Give the program exactly what you reserved**, through its threads option:

   ```bash
   #SBATCH --cpus-per-task=8
   bwa mem -t $SLURM_CPUS_PER_TASK ref.fa reads_1.fq.gz reads_2.fq.gz > out.sam
   ```

   Other examples: `samtools -@`, `minimap2 -t`, `kraken2 --threads`, `BEAST -threads`. Without this, some programs start one thread per CPU of the node (128) and slow down every job on it.
3. **Start modestly** (4 to 16 CPUs), then look at the CPU efficiency with `seff <jobid>`. If it is low, reduce `-c`; if it is close to 100% and the job is long, try more.

---

## Choosing --mem {#choosing-mem}

**Always set the memory**, with `--mem` (for the job) or `--mem-per-cpu` (per CPU). Without it, the job reserves the whole memory of the node and nobody else can use that node.

1. **Measure**: run a test, then read the peak memory used:

   ```bash
   seff <jobid>                                   # "Memory Utilized"
   sacct -j <jobid> --format=JobID,ReqMem,MaxRSS,State
   ```

2. **Add a margin** of about 20% to the measured peak for the real run.
3. **Stay below the node's limit**: a single job cannot get more than about 503 GB.
4. If the job ends with `OUT_OF_MEMORY`, increase `--mem` (see [Troubleshooting](troubleshooting.md)).

Some tools need memory in proportion to their input: Kraken2, for example, loads its whole database into memory.

---

## Reserving memory reserves CPUs {#reserving-memory-reserves-cpus}

A node has about 503 GB for 128 CPUs, that is **about 4 GB per CPU**. When a job takes much more memory per CPU than that, the CPUs left on the node cannot be used by anyone, because there is no memory left for them.

| Request | What it really occupies |
|---------|-------------------------|
| `-c 8 --mem=32G` | 8 CPUs, 32 GB: balanced |
| `-c 8 --mem=250G` | About half a node |
| `-c 8 --mem=500G` | A whole node: the other 120 CPUs are lost for everyone |

So ask for the memory you have measured, not "as much as possible". If your analysis truly needs a whole node's memory, it is legitimate, but then use the CPUs too (`-c` adapted) if your program can.

---

## No local disk: /tmp is in memory {#no-local-disk-tmp-is-in-memory}

The compute nodes are **stateless**: their system is loaded into memory at start-up and they have no local disk for users. `/tmp` on a node is in memory, so large files written there use the node's RAM.

Write large temporary files to your scratch space, `/scratch/malaria/<login>`, never to `/tmp`. Many tools have an option for their temporary folder, for example `samtools sort -T /scratch/malaria/$USER/tmp`. See [Storage](../../hardware/storage.md).

---

## Login node AVX-512 vs. compute nodes AVX2 {#login-node-avx-512-vs-compute-nodes-avx2}

The login node, <Var name="loginHost" code />, has **Intel** processors that support AVX-512. The compute nodes have **AMD** processors that support AVX2 but **not AVX-512**.

A program compiled on the login node with `-march=native` may use AVX-512 instructions and then crash on the compute nodes with `Illegal instruction`. To avoid this:

- **compile inside a job, on a compute node** (best: the program is optimised for the machine it runs on), or
- compile on the login node for the compute nodes' processors:

  ```bash
  module load gnu12
  gcc -O2 -march=znver3 -o my_program my_program.c     # optimised for the AMD EPYC nodes
  gcc -O2 -mavx2 -o my_program my_program.c            # or: AVX2 only
  ```

Pre-built software (modules, conda packages) is not affected.

---

## Summary {#summary}

- 1 node = 64 cores = 128 Slurm CPUs = 512 GB (about 503 GB for jobs).
- Ask for the threads your program really uses, and pass `$SLURM_CPUS_PER_TASK` to it.
- Always set `--mem`, measured with `seff`, plus a margin.
- About 4 GB per CPU: more memory per CPU blocks CPUs for others.
- Large temporary files go to the scratch space, not `/tmp`.
- Do not run on the compute nodes code compiled with `-march=native` on the login node.
