---
id: first-job
title: "Your first job"
sidebar_label: "Your first job"
sidebar_position: 4
---

# Your first job {#your-first-job}

This page walks you through a small test job on the `debug` QOS, charged to the `malaria` project. Replace `malaria` with your own project (or `malaria_<sub-project>` for a sub-project).

## Before you start {#before-you-start}

- You are a member of a project: see [Getting access](accounts.md) and [Projects, sub-projects and roles](projects.md).
- You are connected to <Var name="loginHost" code />: see [Connecting to the cluster](connecting.md).
- Check which Slurm accounts and QOS you can use:

```bash
sacctmgr show assoc user=$USER format=account,qos
```

## 1. Go to your scratch space {#go-to-scratch}

```bash
mkdir -p /scratch/malaria/$USER/first-job
cd /scratch/malaria/$USER/first-job
```

## 2. Write the job script {#write-the-script}

Create a file called `first-job.sh` (for example with `nano first-job.sh`):

```bash
#!/bin/bash
#SBATCH --job-name=first-job
#SBATCH --account=malaria          # your project (required)
#SBATCH --qos=debug                # short test job
#SBATCH --time=00:10:00            # 10 minutes maximum
#SBATCH --cpus-per-task=2
#SBATCH --mem=2G                   # ALWAYS set memory
#SBATCH --output=%x_%j.out

set -euo pipefail

echo "Job $SLURM_JOB_ID running on $(hostname)"
echo "CPUs allocated: $SLURM_CPUS_PER_TASK"

module load gnu12
module list

sleep 30
echo "Done"
```

What the main options mean:

| Option | Meaning |
|---|---|
| `--account=malaria` | The project the job is charged to. **Required**: a job without a valid project account is refused. |
| `--qos=debug` | Quick tests: at most <Var name="qosDebugMaxHours" /> hour and <Var name="qosDebugMaxCpus" /> CPUs, usually starts faster. Use `normal` (the default) for real work. |
| `--time` | Maximum run time. The job is stopped when it is reached, so give a realistic value. |
| `--mem` | Memory for the job. **Always set it**: without it, the job reserves the whole memory of a node and blocks it for everyone. |
| `--cpus-per-task` | Number of CPUs. Tell your software to use exactly this number (`$SLURM_CPUS_PER_TASK`). |

## 3. Submit it {#submit}

```bash
sbatch first-job.sh
```

Slurm answers with the job ID, for example `Submitted batch job 123456`. If the job breaks a limit (wrong account, too much time for the QOS...), it is refused straight away with an explanatory message.

## 4. Follow it {#monitor}

```bash
squeue --me                  # your pending (PD) and running (R) jobs
sacct -j 123456              # state of the job, also after it finished
```

## 5. Read the result {#read-the-result}

```bash
cat first-job_123456.out
seff 123456                  # CPU and memory efficiency once the job has finished
```

`seff` tells you how much of the requested CPU and memory the job really used: use it to size your next jobs.

## Common first-job errors {#common-errors}

| Message | What to do |
|---|---|
| `Invalid account or account/partition combination specified` | You are not a member of that project, or you made a typo in `--account`. Check with `sacctmgr show assoc user=$USER`. If you were just added, log out and log in again. |
| Job refused for a QOS limit | Lower `--time` or `--cpus-per-task`, or use `--qos=normal`. |
| `module: command not found` or `<tool>: command not found` | Load the right module in the script. See [Modules](../software/modules.md). |

More cases in [Troubleshooting](../tutorials/running-jobs/troubleshooting.md).

## Next steps {#next-steps}

- [Slurm basics](../tutorials/running-jobs/slurm-basics.md) and [writing job scripts](../tutorials/running-jobs/job-scripts.md).
- [hpcsub](../tutorials/running-jobs/hpcsub.md), the IGH command that submits a job in the right project folders for you.
- [Job submission good practice](../good-conduct/job-submission.md).
