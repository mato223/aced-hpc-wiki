---
id: troubleshooting
title: Troubleshooting jobs
sidebar_label: "Troubleshooting jobs"
sidebar_position: 6
---

When a job is refused, stays pending or fails, the cause is almost always in one of three places: the message printed by `sbatch`, the job's state in Slurm, or the job's `.out`/`.err` files. This page goes through the most common cases on the IGH cluster.

---

## First reflexes {#first-reflexes}

```bash
squeue --me                                   # pending (PD) or running (R), and the reason
scontrol show job <jobid>                     # full details, including Reason=...
sacct -j <jobid> --format=JobID,JobName,State,Elapsed,ReqMem,MaxRSS,ExitCode
seff <jobid>                                  # CPU and memory really used (finished jobs)
less /projects/malaria/results/slurm_logs/<name>_<jobid>.err
```

The `State` column of `sacct` already tells you a lot: `COMPLETED` (success), `FAILED` (your program returned an error), `TIMEOUT` (`--time` reached), `OUT_OF_MEMORY` (`--mem` exceeded), `CANCELLED`.

---

## The job is refused at submission {#the-job-is-refused-at-submission}

### Invalid account {#invalid-account}

```
sbatch: error: Batch job submission failed: Invalid account or account/partition combination specified
```

**Cause**: the `--account` is missing or wrong, or you are not (yet) a member of that project or sub-project.

**What to do**:

1. Check the accounts you can use:

   ```bash
   sacctmgr show assoc user=$USER format=account,qos
   ```

2. Fix `#SBATCH --account=...` (for example `malaria`, or `malaria_<sub-project>`).
3. If the project is missing, ask the project admin to have you added (see [Projects, sub-projects and roles](../../getting-started/projects.md)). After you have been added, log out and log in again.

### A QOS limit is exceeded {#a-qos-limit-is-exceeded}

A job that asks for more than its QOS allows is refused at submission, with a message that mentions the QOS or a limit, for example:

```
sbatch: error: Batch job submission failed: Job violates accounting/QOS policy (job submit limit, user's size and/or time limits)
```

**Cause**: `--time`, the number of CPUs or the number of jobs is above the limit of the QOS (for example more than <Var name="qosDebugMaxHours" /> hour or <Var name="qosDebugMaxCpus" /> CPUs in `debug`, more than <Var name="qosNormalMaxDays" /> days in `normal`), or you asked for a QOS you do not have access to (`long`, `urgent`; the message is then `Invalid qos specification`).

**What to do**: reduce the request, choose another QOS, or, for `long`, open a ticket on <Var name="supportPortal" link />. The limits are listed in [Slurm basics](slurm-basics.md#choosing-a-qos).

### Requested node configuration is not available {#requested-node-configuration-is-not-available}

**Cause**: the job asks for more than a node has, for example `--mem=600G` (a node has about 503 GB for jobs) or more than 128 CPUs per task. There is only one partition, `normal`: do not set another one. See [Our nodes](nodes.md).

---

## The job stays pending {#the-job-stays-pending}

`squeue --me` shows `PD` and a reason in the last column:

| Reason | Meaning | What to do |
|--------|---------|------------|
| `Resources` | No node has enough free CPUs or memory yet | Wait, or ask for less (especially `--mem`) |
| `Priority` | Other jobs are ahead of yours | Wait |
| `QOSMax...` / `...PerUser...` | You have reached a limit of your QOS (CPUs or jobs at the same time) | Wait for your other jobs to finish |
| `Dependency` | The job waits for another job (`--dependency`) | Normal |
| `DependencyNeverSatisfied` | The job it depends on failed | Cancel it with `scancel` and fix the earlier step |

`squeue --me --start` shows an estimated start time. A job asking for a whole node's memory waits for a whole node to be free: ask only for what you have measured.

---

## The job fails immediately {#the-job-fails-immediately}

### No output file at all {#no-output-file-at-all}

**Cause**: the folder given to `--output`, `--error` or `--chdir` does not exist, or you cannot write in it. Slurm cannot create the log and the job ends at once.

**What to do**: create the folder before submitting (`mkdir -p /projects/malaria/work/$USER`), and remember that `$USER` is not replaced in `#SBATCH` lines: write your login in full. [hpcsub](hpcsub.md) creates these folders for you.

### command not found {#command-not-found}

```
slurm_script: line 12: Rscript: command not found
```

**Cause**: the software is not loaded in the job. A job does not reuse what you loaded in your terminal.

**What to do**:

- Load the module in the script. Some modules only appear after loading the compiler: `module load gnu12 R/4.2.1`. Use `module spider <name>` to find how to load a module.
- For tools installed with conda, load and activate the environment in the script:

  ```bash
  module load anaconda/2025.06
  eval "$(conda shell.bash hook)"
  conda activate my_env
  ```

See [Modules](../../software/modules.md) and [Installed software](../../software/installed.md).

### Permission denied in a project {#permission-denied-in-a-project}

**Possible causes**:

1. **You were just added to the project** and your session does not know it yet. Log out, log in again, then check with `groups` or `id` that the project appears.
2. **Files were copied with their original permissions** (`cp -p`, `cp -a`, `rsync -a`, or `mv` from a home directory), so the team cannot read or modify them. The owner of the files fixes it with:

   ```bash
   chmod -R g+rwX /projects/malaria/my_folder
   ```

   In the future, copy into projects with `cp -r` or `rsync -rlt`.
3. **You are not a member of the sub-project** whose folder you are trying to use. Ask its project admin.
4. **You are writing to a read-only area**: `data/raw/` and `/references` are read-only for everyone. Write your outputs to `results/`, `work/` or your scratch.

See [File system practices](../../good-conduct/file-system.md).

### Illegal instruction {#illegal-instruction}

**Cause**: the program was compiled on the login node with `-march=native`. The login node (Intel) supports AVX-512 but the compute nodes (AMD) do not.

**What to do**: recompile inside a job on a compute node, or on the login node with `-march=znver3` or `-mavx2`. See [Our nodes](nodes.md#login-node-avx-512-vs-compute-nodes-avx2).

### Script errors {#script-errors}

| Symptom | What to do |
|---------|------------|
| `No such file or directory` | Check the paths: use absolute paths, and remember the job starts in the `--chdir` folder (or the folder you submitted from) |
| `$'\r': command not found` | The script was edited on Windows. Convert it: `sed -i 's/\r$//' script.sh` |
| Syntax error | Test the script with `bash -n script.sh` before submitting |
| Segmentation fault | Often a bug or a wrong module combination; reproduce on a small input in an interactive session |

---

## The job stops during the run {#the-job-stops-during-the-run}

### Out of memory {#out-of-memory}

`sacct` shows `OUT_OF_MEMORY`, or the `.err` file mentions `oom-kill`.

**What to do**: compare `MaxRSS` (in `sacct`) or "Memory Utilized" (in `seff`) with your request, and increase `--mem` with a margin. Check also that the program does not write large temporary files to `/tmp`, which is in memory on the nodes: send them to your scratch space.

### Time limit reached {#time-limit-reached}

`sacct` shows `TIMEOUT`, and the log contains `DUE TO TIME LIMIT`.

**What to do**: increase `--time` within the limit of your QOS, check that your program really uses the CPUs you reserved (`seff`), and split long analyses into steps (job arrays, `--dependency`) so that a step that is already done is not computed again. See [Writing job scripts](job-scripts.md#splitting-long-analyses-into-steps).

---

## My job blocks a whole node {#my-job-blocks-a-whole-node}

If you forgot `--mem`, your job reserves all the memory of a node (512 GB), even if it uses a few gigabytes: no other job can start on that node. Check with:

```bash
sacct -j <jobid> --format=JobID,ReqMem,MaxRSS,AllocCPUS
```

If `ReqMem` is huge compared with `MaxRSS`, cancel the job if it has just started (`scancel <jobid>`) and resubmit it with a measured `--mem`. Also check that your program uses only the threads you reserved (`$SLURM_CPUS_PER_TASK`): a program that starts 128 threads on 8 reserved CPUs slows down its neighbours. See [Our nodes](nodes.md).

---

## Debugging tips {#debugging-tips}

Add information to your script:

```bash
set -euo pipefail                 # stop at the first error
set -x                            # print each command before running it
echo "Start: $(date) on $(hostname)"
module list
```

Test interactively on a compute node, with the `debug` QOS:

```bash
srun --account=malaria --qos=debug --time=00:30:00 --cpus-per-task=2 --mem=4G --pty bash
```

---

## Still stuck? {#still-stuck}

If you work in a project, first ask your project admin: they can see the project's jobs. Otherwise contact support, <Var name="supportEmail" link /> or a ticket on <Var name="supportPortal" link />, with:

- the job ID and the output of `sacct -j <jobid>`;
- the path of your job script;
- the content of the `.err` file (or its path);
- what you have already tried.

### Resources {#resources}

- [Slurm job exit codes](https://slurm.schedmd.com/job_exit_code.html)
- [Frequently asked questions](../../support/faq.md)
