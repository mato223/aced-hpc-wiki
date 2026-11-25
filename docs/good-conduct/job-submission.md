---
title: Job Submission Tips
sidebar_position: 4
sidebar_label: "Job Submission Tips"
---

Submitting jobs responsibly keeps the cluster available for all IGH users. Request only what you need, test before scaling up, and check how your jobs actually used their resources.

## The two golden rules {#golden-rules}

:::danger Read this before your first job
These two rules prevent most of the problems seen on the cluster.
:::

### 1. Always set the memory {#always-set-memory}

Always request memory with `--mem` (per node) or `--mem-per-cpu`. **Without `--mem`, a job reserves all the memory of a node (512 GB) and blocks the whole node** for everyone else, even if it uses a single CPU.

```bash
#SBATCH --mem=32G            # total memory for the job (one node)
# or
#SBATCH --mem-per-cpu=4G     # memory per Slurm CPU
```

### 2. Give your software the threads you reserved {#match-threads}

Tell your software to use exactly the number of CPUs Slurm gave you, through `$SLURM_CPUS_PER_TASK`:

```bash
#SBATCH --cpus-per-task=10

bwa mem -t $SLURM_CPUS_PER_TASK ref.fa reads_1.fq reads_2.fq > aln.sam
```

The same applies to `samtools -@`, `minimap2 -t`, `kraken2 --threads`, `BEAST -threads`, etc. Otherwise many tools start one thread per CPU they can see, i.e. **128 threads** on a node: they compete with the other jobs on that node and slow everyone down, including you.

## One core = two Slurm CPUs {#one-core-two-cpus}

Hyperthreading is enabled on the compute nodes: each physical core runs 2 hardware threads, and **Slurm counts each thread as one CPU**. A compute node has 64 physical cores, i.e. **128 Slurm CPUs**.

- `--cpus-per-task=8` gives you 8 Slurm CPUs, i.e. 4 physical cores.
- Some CPU-intensive tools may gain little from the second thread of a core: to find the right value for your tool, compare the run time with different `-c` values using `seff`.

More details: [Our nodes: cores, threads and memory](../tutorials/running-jobs/nodes.md).

## Always charge the right project {#project-account}

Every job must be charged to a project account with `--account`:

```bash
#SBATCH --account=malaria                 # or malaria_<sub-project>

# List the accounts and QOS you can use
sacctmgr show assoc user=$USER format=account,qos
```

If you are not a member of the project, the job is refused. See [Projects, sub-projects and roles](../getting-started/projects.md).

## Request only what you need {#request-only-what-you-need}

Over-requesting wastes cluster capacity and makes your own jobs wait longer.

### Nodes and CPUs {#nodes-and-tasks}

Most bioinformatics tools are multi-threaded on a single node:

```bash
# BAD: several nodes for a tool that only runs on one
#SBATCH --nodes=4
#SBATCH --ntasks-per-node=32

# GOOD: one node, one task, several threads
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
```

### Time limits {#time-limits}

Always set a realistic `--time`. A job that asks for more than its QOS allows (<Var name="qosNormalMaxDays" /> days for `normal`) is refused at submission with a message.

```bash
# BAD: always asking for the maximum "just in case"
#SBATCH --time=7-00:00:00

# GOOD: tested runtime + a margin
#SBATCH --time=04:00:00  # tested: 3 hours + 1 hour margin
```

**Why this matters:**

- shorter jobs can fill gaps in the schedule and start sooner;
- over-requested time blocks resources others could use.

The QOS and their limits are described in [Slurm basics](../tutorials/running-jobs/slurm-basics.md).

### Memory {#memory}

Reserving a lot of memory also means occupying CPUs: a node has ~503 GB for 128 CPUs. A job asking for 500 GB with 8 CPUs **occupies a whole node**. Request the memory you measured (with `seff`) plus a margin, not the maximum.

## Test before scaling {#test-before-scaling}

Check that your job works on a small input before requesting large resources.

### Interactive testing {#interactive-testing}

```bash
# Interactive session on a compute node (QOS debug: up to 1 hour)
srun --account=malaria --qos=debug --cpus-per-task=2 --mem=4G --time=00:30:00 --pty bash

# Test your command on a small input
./my_program --small-input
```

### Small batch test {#small-batch-test}

The `debug` QOS starts faster and is meant for quick tests (up to <Var name="qosDebugMaxHours" /> hour, <Var name="qosDebugMaxCpus" /> CPUs):

```bash
#SBATCH --account=malaria
#SBATCH --qos=debug
#SBATCH --cpus-per-task=2
#SBATCH --mem=4G
#SBATCH --time=00:30:00

./my_program --small-input
```

### Scale up gradually {#scale-up-gradually}

```bash
# After a small test succeeds, increase step by step
# 1 sample -> 10 samples -> all samples

# Check the efficiency of each step with seff before going further
```

## Split long analyses {#split-long-analyses}

Cut long analyses into steps instead of one huge job:

- use **job arrays** for independent samples and **`--dependency`** to chain steps;
- write each step's output to a file, and make your scripts **skip steps that are already finished**.

This way, a job that fails or exceeds its `--time` does not make you lose all the work: you only rerun the missing step.

```bash
# Skip a step whose output already exists
if [ ! -s results/sample1.bam ]; then
    bwa mem -t $SLURM_CPUS_PER_TASK ref.fa sample1_1.fq sample1_2.fq | samtools sort -o results/sample1.bam
fi
```

## Monitor resource usage {#monitor-resource-usage}

Knowing how your jobs use resources helps you request the right amount.

### During job execution {#during-job-execution}

```bash
# Your jobs in the queue
squeue --me

# Detailed information about one job
scontrol show job <jobid>
```

### After job completion {#after-job-completion}

```bash
# Job efficiency
seff <jobid>

# Example output:
# CPU Efficiency: 85.2%
# Memory Efficiency: 62.3% of 16.00 GB
```

If the efficiency is low, reduce your requests for the next run.

### Using sacct {#using-sacct}

```bash
# Statistics of a finished job
sacct -j <jobid> --format=JobID,Elapsed,MaxRSS,CPUTime,State

# Your recent jobs
sacct -u $USER --starttime=now-7days --format=JobID,JobName,Elapsed,State
```

Project admins also receive consumption reports for their project (see [Projects, sub-projects and roles](../getting-started/projects.md)).

## Job array best practices {#job-array-best-practices}

Job arrays are ideal for processing many samples, but require some care:

```bash
# GOOD: reasonable array size with throttling
#SBATCH --array=1-100%10  # 100 tasks, at most 10 running at once

# BAD: thousands of tiny tasks flooding the scheduler
#SBATCH --array=1-10000
```

### Throttle large arrays {#throttle-large-arrays}

```bash
# Limit the number of tasks running at the same time
#SBATCH --array=1-1000%50
```

### Combine small tasks {#combine-small-tasks}

If each task only runs for a few seconds, group them:

```bash
# Instead of 10,000 one-second tasks,
# create 100 tasks that each process 100 items
```

## Avoid common mistakes {#avoid-common-mistakes}

### Don't flood the queue {#dont-flood-the-queue}

```bash
# BAD: submitting thousands of jobs in a loop
for i in {1..5000}; do
    sbatch job_$i.sh
done

# GOOD: use a job array
#SBATCH --array=1-5000%100
```

### Don't ignore failed jobs {#dont-ignore-failed-jobs}

```bash
# Find your failed jobs
sacct -u $USER --state=FAILED --starttime=now-7days

# Read the log before resubmitting
cat /projects/malaria/results/slurm_logs/<jobname>_<jobid>.err
```

See [Troubleshooting](../tutorials/running-jobs/troubleshooting.md) for common errors.

### Don't hardcode paths {#dont-hardcode-paths}

```bash
# BAD: path tied to one person and one run
cd /projects/malaria/results/<login>/test_run
./run.sh

# GOOD: use variables
cd "$SLURM_SUBMIT_DIR"
./run.sh
```

## Dependency chains {#dependency-chains}

Use job dependencies instead of waiting loops:

```bash
# Submit the first job
JOB1=$(sbatch --parsable preprocess.sh)

# Submit the next job, which starts only if the first one succeeded
sbatch --dependency=afterok:$JOB1 analysis.sh
```
