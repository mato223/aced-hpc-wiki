---
title: Login Node Guidelines
sidebar_position: 2
sidebar_label: "Login Node Guidelines"
---

The login node, <Var name="loginHost" code />, is the entry point to the cluster. It is **shared by all users** at the same time. Running computations on it slows everyone down and may lead to your processes being stopped or your account being suspended.

:::danger No computing on the login node
All computation, pipelines included, runs on the compute nodes through Slurm. The login node is only for preparing and submitting your work.
:::

## What the login node is for {#what-login-nodes-are-for}

The login node is for light, preparatory tasks:

- **Editing files**: with `vim`, `nano` or `emacs`;
- **Small compilations**: short, non-parallel builds (see [Compiling for the compute nodes](../hardware/overview.md#compiling-for-the-compute-nodes));
- **Managing files**: organising directories, copying files into your project;
- **Submitting jobs**: `sbatch`, `hpcsub`, `srun`, `scancel`;
- **Monitoring jobs**: `squeue --me`, `sacct`, `seff`, reading log files;
- **File transfers**: `scp`, `rsync` or `sftp` (see [File transfer guide](file-transfers.md)).

## What not to do on the login node {#what-not-to-do-on-login-nodes}

:::danger Prohibited activities
The following activities are **not allowed** on the login node.
:::

### Running research applications {#running-research-applications}

Do not launch analysis software directly on the login node:

```bash
# DON'T do this on the login node
bwa mem -t 16 ref.fa reads_1.fq reads_2.fq > aln.sam
python my_analysis.py
Rscript analysis.R
./my_program
```

**Instead**, submit them as Slurm batch jobs (see [Job scripts](../tutorials/running-jobs/job-scripts.md) and [hpcsub](../tutorials/running-jobs/hpcsub.md)) or request an interactive session (below).

### Running pipelines {#running-pipelines}

Workflow managers and pipeline scripts must not run on the login node, even if each step "only submits jobs": they keep processes running for hours and often run some steps locally. Run the whole pipeline inside a Slurm job.

### Parallel compilation {#parallel-compilation}

Avoid resource-intensive builds:

```bash
# DON'T do this on the login node
make -j 32
ninja -j 16
```

**Instead**, use a small build on the login node or compile in a job:

```bash
# OK on the login node
make -j 2

# Better for large builds: compile in a job, on a compute node
sbatch compile_job.sh
```

### Long-running processes {#long-running-processes}

Do not leave heavy processes running in the background:

```bash
# DON'T leave computations running on the login node
nohup long_process &
screen -S mysession  # for computational work
```

### Excessive job monitoring {#excessive-resource-monitoring}

Avoid polling job status too often:

```bash
# DON'T do this
watch -n 1 squeue --me  # every second is too frequent

# OK - check from time to time
squeue --me
```

## Using interactive sessions {#using-interactive-sessions}

If you need to test commands interactively, ask Slurm for a session on a compute node:

```bash
# Interactive shell on a compute node (QOS debug: up to 1 hour)
srun --account=malaria --qos=debug --cpus-per-task=2 --mem=4G --time=01:00:00 --pty bash

# Leave the session when you are done
exit
```

Replace `malaria` with your own project account. You then work on dedicated resources without affecting other users.

## VS Code and other IDEs {#vscode-and-ides}

:::warning No heavy IDE on the login node
VS Code Remote SSH, Jupyter, RStudio and similar tools start servers and background processes that consume a lot of resources on the login node and slow down other users. Do not run them on <Var name="loginHost" code />.
:::

**Recommended alternatives:**

1. **Edit locally** on your own computer, then copy your scripts to the cluster with `rsync` (see [File transfer guide](file-transfers.md)).
2. **Use terminal editors** on the login node: `vim`, `nano` or `emacs`.

## How login node usage is monitored {#how-we-monitor-login-node-usage}

The IT team monitors resource usage on the login node. Users running prohibited activities may receive:

1. a warning;
2. termination of their processes;
3. a temporary account suspension for repeated violations.
