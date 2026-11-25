---
id: slurm-basics
title: Slurm basics
sidebar_label: "Slurm basics"
sidebar_position: 1
---

The IGH HPC cluster uses **Slurm** to share its compute nodes between users. You never run analyses on the login node: you describe your job in a script, submit it, and Slurm runs it on a compute node as soon as the resources you asked for are free.

## What is Slurm? {#what-is-slurm}

Slurm is the job scheduler. It:

- receives your jobs and puts them in a queue;
- reserves the CPUs, memory and time each job asks for, on a compute node;
- starts the job, enforces its limits (time, memory) and records what it used.

---

## Partition, QOS and project account {#partition-qos-and-project-account}

Every job on the IGH cluster is defined by three things.

### One partition: normal {#one-partition-normal}

There is a single partition, `normal`, which contains all the compute nodes. It is the default: you do not need to set `--partition`.

### Choosing a QOS {#choosing-a-qos}

The **QOS** (quality of service) sets the maximum run time and the limits of your job. Choose it with `#SBATCH --qos=...`; if you do not, your job uses `normal`.

| QOS | Who can use it | Maximum run time | Limits |
|-----|----------------|------------------|--------|
| `normal` | Everyone (default) | <Var name="qosNormalMaxDays" /> days | <Var name="qosNormalMaxCpusPerUser" /> CPUs at most per user |
| `debug` | Everyone, for quick tests | <Var name="qosDebugMaxHours" /> hour | <Var name="qosDebugMaxCpus" /> CPUs, <Var name="qosDebugMaxRunning" /> running jobs, <Var name="qosDebugMaxQueued" /> queued jobs; starts faster |
| `long` | On request (support ticket) | <Var name="qosLongMaxDays" /> days | <Var name="qosLongMaxCpusTotal" /> CPUs in total, <Var name="qosLongMaxJobsPerUser" /> jobs per user |
| `urgent` | Granted temporarily, for a deadline | <Var name="qosUrgentMaxDays" /> days | High priority; usage counted double |

:::info These limits may change
The QOS values above are not final and may be adjusted. This page always shows the current values.
:::

A job that exceeds a limit of its QOS is **refused at submission** with an error message. Always give a realistic `--time`: a job is stopped when it reaches it.

To request the `long` or `urgent` QOS, open a ticket on <Var name="supportPortal" link /> explaining why.

### The project account is required {#the-project-account-is-required}

Each job runs on the Slurm account of a project or sub-project you belong to. Set it in every job:

```bash
#SBATCH --account=malaria                  # or malaria_<sub-project>
```

To see the accounts and QOS you can use:

```bash
sacctmgr show assoc user=$USER format=account,qos
```

If you are not a member of the project, the job is refused (`Invalid account`). See [Projects, sub-projects and roles](../../getting-started/projects.md).

---

## Key commands {#key-commands}

| Action | Command | Description |
|--------|---------|-------------|
| Submit a job | `sbatch script.sh` | Submits a batch script; prints the job ID |
| See your jobs | `squeue --me` | Your running and pending jobs |
| Estimated start | `squeue --me --start` | When Slurm expects pending jobs to start |
| Cancel a job | `scancel <jobid>` | Cancels the job |
| Job details | `scontrol show job <jobid>` | Everything about a job, including why it is pending |
| Job history | `sacct -j <jobid>` | Accounting data, also after the job has ended |
| Efficiency | `seff <jobid>` | CPU and memory actually used, after the job has ended |
| Node status | `sinfo` | State of the compute nodes |

You only see your own jobs. The admins of a project also see, and can suspend or cancel, the jobs of their project.

---

## A first job script {#a-first-job-script}

```bash
#!/bin/bash
#SBATCH --job-name=myjob
#SBATCH --account=malaria                  # your project (required)
#SBATCH --qos=debug                        # quick test
#SBATCH --time=00:10:00                    # 10 minutes
#SBATCH --cpus-per-task=2
#SBATCH --mem=4G                           # ALWAYS set memory
#SBATCH --output=%x_%j.out                 # %x = job name, %j = job ID

module load gnu12 R/4.2.1
Rscript -e 'print(sessionInfo())'
```

Submit it from the folder where you want the output file:

```bash
sbatch myjob.sh
squeue --me
```

### Explanation {#explanation}

| Directive | Meaning |
|-----------|---------|
| `--job-name` | Name shown in `squeue` and used by `%x` |
| `--account` | Slurm account of your project (required) |
| `--qos` | `normal`, `debug`, `long` or `urgent` (see above) |
| `--time` | Maximum run time: `MM:SS`, `HH:MM:SS` or `D-HH:MM:SS` |
| `--cpus-per-task` (`-c`) | Number of CPUs for your program's threads |
| `--mem` | Memory for the job, on the node |
| `--output` | File for the job's output (`%j` = job ID) |

:::warning Always set the memory
Without `--mem` (or `--mem-per-cpu`), a job reserves all the memory of a node and blocks it for everyone. See [Our nodes](nodes.md).
:::

---

## Best practices {#best-practices}

- Test on a small input with the `debug` QOS before launching the full analysis.
- Ask for what you need: a realistic `--time`, a measured `--mem`, and a `--cpus-per-task` that your program really uses.
- Tell your program how many threads it may use, for example `bwa mem -t $SLURM_CPUS_PER_TASK`.
- After each job, check its real usage with `seff <jobid>` and adjust the next one.
- Cancel the jobs you no longer need with `scancel`.

Next: [Writing job scripts](job-scripts.md), [hpcsub](hpcsub.md) and [Submitting jobs responsibly](../../good-conduct/job-submission.md).
