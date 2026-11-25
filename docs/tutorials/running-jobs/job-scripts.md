---
id: job-scripts
title: Writing job scripts
sidebar_label: "Writing job scripts"
sidebar_position: 2
---

A Slurm job script is a Bash script with `#SBATCH` lines at the top. These lines tell Slurm which project to charge, how much time, CPU and memory to reserve, and where to write the logs. The commands below them are what runs on the compute node.

This page gives the IGH template, explains each line, and shows a complete example. If you prefer not to write the account and log paths yourself, use [hpcsub](hpcsub.md).

---

## The IGH job script template {#the-igh-job-script-template}

```bash
#!/bin/bash
#SBATCH --job-name=my_analysis
#SBATCH --account=malaria                   # your project (required)
#SBATCH --qos=normal                        # normal | debug | long
#SBATCH --time=1-00:00:00
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G                           # ALWAYS set memory
#SBATCH --chdir=/projects/malaria/work/<login>
#SBATCH --output=/projects/malaria/results/slurm_logs/%x_%j.out
#SBATCH --error=/projects/malaria/results/slurm_logs/%x_%j.err
set -euo pipefail
module load <tool>/<version>
srun <tool> --threads "$SLURM_CPUS_PER_TASK" \
     -i /projects/malaria/data/raw/<run> -o ...
```

Replace `malaria` with your project (or `malaria_<sub-project>` for a sub-project account, and the matching `/projects/malaria/<sub-project>` paths), `<login>` with your login, and `<tool>` with your software.

### Line by line {#line-by-line}

| Line | What it does |
|------|--------------|
| `#!/bin/bash` | Runs the script with Bash. Must be the first line. |
| `--job-name` | Name shown in `squeue`; `%x` in the log names is replaced by it. |
| `--account` | Slurm account of your project. **Required**: without it, or with a project you do not belong to, the job is refused. |
| `--qos` | `normal` by default, `debug` for tests, `long` on request. See [Slurm basics](slurm-basics.md#choosing-a-qos). |
| `--time` | Maximum run time, here 1 day (`D-HH:MM:SS`). The job is stopped when it is reached. |
| `--cpus-per-task` | Number of CPUs reserved for your program. Pass the same number to the program. |
| `--mem` | Memory reserved on the node. **Always set it.** |
| `--chdir` | Folder the job starts in: your working folder in the project's `work/`. |
| `--output`, `--error` | Log files, in the project's `results/slurm_logs/`. `%j` is the job ID. |
| `set -euo pipefail` | Stops the script at the first error instead of carrying on with missing files. |
| `module load` | Loads the software. See [Modules](../../software/modules.md). |
| `srun ... "$SLURM_CPUS_PER_TASK"` | Runs the program with exactly the number of threads you reserved. |

:::warning Two rules that protect everyone
1. **Always set the memory** (`--mem` or `--mem-per-cpu`). Without it, the job reserves the whole memory of a node (512 GB) and blocks it.
2. **Give your program the number of threads you reserved**: `bwa mem -t $SLURM_CPUS_PER_TASK`, `samtools -@`, `minimap2 -t`, `kraken2 --threads`, `BEAST -threads`... Otherwise the program may start one thread per CPU of the node (128) and slow down everyone.

See [Our nodes](nodes.md) to choose good values.
:::

### Before the first submission {#before-the-first-submission}

`#SBATCH` lines are read by Slurm, not by Bash: variables such as `$USER` are **not** replaced in them. Write your login in full. The folders given to `--chdir`, `--output` and `--error` must exist, otherwise the job fails at once without writing a log:

```bash
mkdir -p /projects/malaria/work/$USER
ls -d /projects/malaria/results/slurm_logs
```

---

## A complete example: Kraken2 classification {#a-complete-example-kraken2-classification}

There are no bioinformatics modules yet: tools such as Kraken2 are installed with conda (`module load anaconda/2025.06`) in your home directory or in the project. See [Installing your own software](../../software/custom-install.md). This example assumes you have created a conda environment called `kraken2` that contains Kraken2.

```bash
#!/bin/bash
#SBATCH --job-name=kraken2_sample01
#SBATCH --account=malaria                   # your project (required)
#SBATCH --qos=normal
#SBATCH --time=06:00:00
#SBATCH --cpus-per-task=8
#SBATCH --mem=64G                           # ALWAYS set memory
#SBATCH --chdir=/projects/malaria/work/<login>
#SBATCH --output=/projects/malaria/results/slurm_logs/%x_%j.out
#SBATCH --error=/projects/malaria/results/slurm_logs/%x_%j.err
set -euo pipefail

# Software: conda environment created beforehand
module load anaconda/2025.06
eval "$(conda shell.bash hook)"
conda activate kraken2

# Inputs and outputs
DB=/references/kraken2/2026-11
READS=/projects/malaria/data/raw/<run>/sample01.fastq.gz
OUT=/projects/malaria/results/$USER/kraken2
mkdir -p "$OUT"

echo "Start: $(date) on $(hostname)"
srun kraken2 --db "$DB" \
     --threads "$SLURM_CPUS_PER_TASK" \
     --gzip-compressed \
     --report "$OUT/sample01.report" \
     --output "$OUT/sample01.kraken" \
     "$READS"
echo "End: $(date)"
```

Notes:

- Kraken2 loads its database into memory: set `--mem` a little above the size of the database you use, then adjust with `seff`.
- Reference databases are shared and versioned under `/references`. Use them instead of downloading your own copy, and cite the version (here `2026-11`) in your publications.
- Raw data in `data/raw/` is read-only: read it directly, never copy or modify it.
- Inside the script (after the `#SBATCH` lines) `$USER` works normally.

---

## Submitting and monitoring {#submitting-and-monitoring}

```bash
sbatch kraken2_sample01.sh             # prints: Submitted batch job <jobid>
squeue --me                            # PD = pending, R = running
scontrol show job <jobid>              # details, including the pending reason
tail -f /projects/malaria/results/slurm_logs/kraken2_sample01_<jobid>.out
```

After the job:

```bash
sacct -j <jobid> --format=JobID,JobName,State,Elapsed,MaxRSS,ExitCode
seff <jobid>                           # CPU and memory efficiency
```

If `seff` shows that the job used much less memory or CPU than requested, lower `--mem` or `--cpus-per-task` next time: your jobs will start sooner and leave room for others.

---

## Splitting long analyses into steps {#splitting-long-analyses-into-steps}

A long pipeline in a single job is fragile: if it fails or reaches its `--time`, all the work is lost. Split it into steps, and skip a step whose output already exists.

**Job arrays** run the same script on many samples. `$SLURM_ARRAY_TASK_ID` gives the number of the task:

```bash
#!/bin/bash
#SBATCH --job-name=qc
#SBATCH --account=malaria
#SBATCH --time=02:00:00
#SBATCH --cpus-per-task=4
#SBATCH --mem=8G
#SBATCH --array=1-24                        # one task per sample
#SBATCH --output=/projects/malaria/results/slurm_logs/%x_%A_%a.out
set -euo pipefail

SAMPLE=$(sed -n "${SLURM_ARRAY_TASK_ID}p" /projects/malaria/scripts/samples.txt)
OUT=/projects/malaria/results/$USER/qc/$SAMPLE
if [ -e "$OUT/done" ]; then echo "$SAMPLE already done"; exit 0; fi
mkdir -p "$OUT"
# ... run the step for $SAMPLE here ...
touch "$OUT/done"
```

**Dependencies** start a step only when the previous one has succeeded:

```bash
jid=$(sbatch --parsable step1_qc.sh)
sbatch --dependency=afterok:$jid step2_align.sh
```

---

## Testing interactively {#testing-interactively}

To try commands on a compute node before writing the script, ask for a short interactive session with the `debug` QOS:

```bash
srun --account=malaria --qos=debug --time=00:30:00 --cpus-per-task=2 --mem=4G --pty bash
```

Type `exit` when you are done to release the resources.

Next: [hpcsub](hpcsub.md), [Sample job scripts](sample-scripts.md) and [Troubleshooting](troubleshooting.md).
