---
id: faq
title: Frequently asked questions
sidebar_label: "FAQ"
sidebar_position: 1
---

# Frequently asked questions {#frequently-asked-questions}

## Access and projects {#access-and-projects}

**How do I get access to the cluster?**
Open a ticket on <Var name="supportPortal" link /> explaining why you need the HPC and which project(s) you work on. You log in with your IGH institutional account. See [Getting access](../getting-started/accounts.md).

**I cannot connect with SSH. What should I check?**

1. You are on the **institute network**: the cluster is not reachable from outside.
2. You use the right host name, <Var name="loginHost" code />, and your IGH login.
3. Your access has been granted (you received an answer to your ticket).
4. Run `ssh -v <login>@acegid-hpc-01` and send the output to support if it still fails.

**I was added to a project but I get `Permission denied` on its folder.**
Log out and log in again: a new project membership only takes effect in a new session. Then check with `groups`.

**How do I join another project or sub-project?**
Open a ticket naming the project. The project admin validates the request. See [Projects, sub-projects and roles](../getting-started/projects.md).

**A colleague cannot modify files I copied into the project.**
The files kept their original permissions (`cp -a`, `cp -p`, `rsync -a` or `mv` from your home). Fix them with `chmod -R g+rwX` on the folder, and copy with `cp -r` or `rsync -rlt` next time. See [File permissions in a project](../getting-started/projects.md#file-permissions).

---

## Jobs and Slurm {#jobs-and-slurm}

**Which account should I put in my job?**
Your project's Slurm account, for example `#SBATCH --account=malaria`, or `malaria_<sub-project>` for a sub-project. It is required. List yours with:

```bash
sacctmgr show assoc user=$USER format=account,qos
```

**Which QOS should I use?**

| QOS | For | Maximum time |
|---|---|---|
| `normal` (default) | Most jobs | <Var name="qosNormalMaxDays" /> days |
| `debug` | Quick tests, starts faster | <Var name="qosDebugMaxHours" /> hour |
| `long` | Long jobs, on request (ticket) | <Var name="qosLongMaxDays" /> days |
| `urgent` | Granted temporarily for a deadline | <Var name="qosUrgentMaxDays" /> days |

These limits may change. A job that exceeds a limit is refused at submission with a message. See [Slurm basics](../tutorials/running-jobs/slurm-basics.md).

**Why is my job pending?**
Look at the last column (`NODELIST(REASON)`):

```bash
squeue --me
```

`Resources` means the nodes are busy; `Priority` means other jobs are ahead of yours; a `QOS...Limit` reason means you have reached a limit of your QOS (for example the number of running jobs on `debug`). Smaller, realistic requests (`--time`, `--mem`, `--cpus-per-task`) start sooner.

**My job stopped. How do I find out why?**

```bash
sacct -j <jobid> --format=JobID,JobName,State,ExitCode,MaxRSS,Elapsed,Timelimit
seff <jobid>
```

- `OUT_OF_MEMORY` or `oom_kill` in the log: the job needed more than `--mem`. Increase it.
- `TIMEOUT`: the job reached its `--time`. Ask for more time, or split the work into steps.
- `FAILED`: read the `.err` file of the job.

**How much memory should I ask for?**
Run a test on a small dataset, then look at `MaxRSS` in `sacct` or at `seff <jobid>`, and ask for about 20% more. **Always set `--mem`**: without it, the job reserves a whole node's memory. Remember that reserving a lot of memory also takes CPUs away from others: 500 GB with 8 CPUs occupies a whole node.

**How do I use several CPUs?**
Ask for them with `--cpus-per-task` and **tell your software to use the same number**:

```bash
#SBATCH --cpus-per-task=8
bwa mem -t $SLURM_CPUS_PER_TASK ...
```

On our nodes, 1 physical core = 2 Slurm CPUs (hyperthreading). See [Job submission good practice](../good-conduct/job-submission.md).

**Can I run things on the login node?**
Only light work: editing, file transfers, small compilations, submitting and monitoring jobs. Everything else goes through Slurm. See [Login node good practice](../good-conduct/login-nodes.md).

**How do I get an interactive session?**

```bash
salloc --account=malaria --qos=debug --cpus-per-task=2 --mem=4G --time=00:30:00
```

Type `exit` when you are done to release the resources.

**How do I cancel a job?**

```bash
scancel <jobid>            # one job
scancel -u $USER           # all your jobs
```

---

## Software {#software}

**How do I find and load software?**

```bash
module avail               # modules available now
module spider <name>       # search all modules
module load gnu12 R/4.2.1  # load R (needs the gnu12 compiler module)
module list                # loaded modules
```

See [Installed software](../software/installed.md) and [Modules](../software/modules.md).

**Where are the bioinformatics tools?**
There are no bioinformatics modules yet. Install them with conda (`module load anaconda/2025.06`) in your home, or in `/projects/<project>/` to share them with your team, or ask for them by ticket. See [Installing your own software](../software/custom-install.md).

**Can I use containers?**
Charliecloud is available as a module. Apptainer/Singularity is not available yet. See [Containers on the HPC](../tutorials/containers/containers-hpc.md).

**My program crashes with `Illegal instruction`.**
It was probably compiled on the login node with `-march=native`. The login node (Intel) has instructions that the compute nodes (AMD) do not have. Compile inside a job on a compute node, or use `-march=znver3`. See [Troubleshooting](../tutorials/running-jobs/troubleshooting.md).

---

## Files and storage {#files-and-storage}

**Where should I put my data?**

| Location | Use | Backed up |
|---|---|---|
| `$HOME` | Scripts, configuration | Yes |
| `/projects/<project>` | Project data and results | Yes, except `work/` |
| `/scratch/<project>/<login>` | Running computations, big temporary files | No |
| `/references` | Shared reference genomes and databases (read-only) | — |

See [Storage](../hardware/storage.md).

**Are my files backed up?**
Home, project folders (except `work/`) and raw sequencing data are backed up. **Scratch is never backed up.** Keep your own copy of anything irreplaceable.

**What happens to files in scratch?**
Files not used for <Var name="scratchPurgeDays" /> days are deleted automatically, with <Var name="scratchNoticeDays" /> days' notice. Deleted files **cannot be recovered**: copy what you want to keep to `/projects/<project>/results`.

**How do I copy data to the cluster?**
From the institute network, with `scp`, `rsync` or `sftp`. Into a project folder, use `rsync -rlt` (not `-a`):

```bash
rsync -rlt --progress my_data/ <login>@acegid-hpc-01:/projects/malaria/results/<login>/
```

See [File transfers](../good-conduct/file-transfers.md).

**I need a reference database (Kraken2, BLAST...).**
Look in `/references` first. If it is missing, ask for it by ticket rather than downloading your own copy.

**How do I see how much space I use?**
Storage use is tracked per user and per project. Keep it reasonable: clean `work/` and your scratch, and do not duplicate data. To find large folders:

```bash
du -sh ~/* | sort -rh | head -20
```
