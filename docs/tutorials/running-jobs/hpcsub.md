---
id: hpcsub
title: Submitting jobs with hpcsub
sidebar_label: "Submitting with hpcsub"
sidebar_position: 3
---

`hpcsub` is the IGH submission command. It is a wrapper around `sbatch`, available on the login node, that prepares your project folders and fills in the Slurm options that are easy to get wrong (account, working folder, log files).

You can always use `sbatch` directly with the [IGH template](job-scripts.md); `hpcsub` simply does the bookkeeping for you.

---

## What hpcsub does {#what-hpcsub-does}

When you run `hpcsub`, it:

1. **checks** that you are a member of the project, and that your input data and your script are readable;
2. **creates** your results folder `results/<login>/<analysis>` and your working folder `work/<login>` in the project;
3. **copies** the script you submitted next to the results, so you always know exactly what produced them;
4. **calls `sbatch`** with the right `--account`, `--chdir` and `--output`.

If one of the checks fails, nothing is submitted and `hpcsub` tells you why.

---

## Syntax {#syntax}

```bash
hpcsub -p <project> -i <input_data> [-r <subdir>] \
       [-t 1-00:00:00] [-c 8] [-m 32G] [-q normal] [-n name] [--dry-run] \
       script.sh [arguments]
```

| Option | Meaning |
|--------|---------|
| `-p <project>` | Project to work in and to charge (for example `malaria`). Required. |
| `-i <input_data>` | Input data of the analysis; `hpcsub` checks that it is readable. Required. |
| `-r <subdir>` | Optional sub-folder (see the note below). |
| `-t` | Maximum run time, same format as `--time` (here 1 day). |
| `-c` | Number of CPUs, same as `--cpus-per-task`. |
| `-m` | Memory, same as `--mem`. |
| `-q` | QOS: `normal`, `debug` or `long`. See [Slurm basics](slurm-basics.md#choosing-a-qos). |
| `-n` | Name of the job. |
| `--dry-run` | Shows what would be done and submitted, without submitting anything. |
| `script.sh [arguments]` | Your job script, followed by the arguments passed to it. |

:::caution To be confirmed
The following details are still to be confirmed and will be added to this page: the exact role of `-r`, the default values used when `-t`, `-c`, `-m` or `-q` are not given, how the `<analysis>` folder is named, which of the two folders the job starts in (`--chdir`), where the log file is written, and whether the `-i` path is made available to your script other than through its arguments. Until then, always give `-t`, `-c` and `-m` explicitly, and pass the input path to your script as an argument.
:::

---

## Example {#example}

A script that runs Kraken2 on one sample, taking the input file as its first argument. It does not need `--account`, `--chdir` or `--output` lines: `hpcsub` provides them.

```bash
#!/bin/bash
# kraken2_one.sh: classify one FASTQ file
set -euo pipefail

READS=$1
OUT=/projects/malaria/results/$USER/kraken2
mkdir -p "$OUT"
module load anaconda/2025.06
eval "$(conda shell.bash hook)"
conda activate kraken2

srun kraken2 --db /references/kraken2/2026-11 \
     --threads "$SLURM_CPUS_PER_TASK" \
     --gzip-compressed \
     --report "$OUT/sample01.report" \
     --output "$OUT/sample01.kraken" \
     "$READS"
```

First check what `hpcsub` would do:

```bash
hpcsub -p malaria -i /projects/malaria/data/raw/<run>/sample01.fastq.gz \
       -t 06:00:00 -c 8 -m 64G -q normal -n kraken2_sample01 --dry-run \
       kraken2_one.sh /projects/malaria/data/raw/<run>/sample01.fastq.gz
```

If everything looks right, run the same command without `--dry-run` to submit. Then follow the job as usual:

```bash
squeue --me
seff <jobid>                # after the job has ended
```

:::tip Where are my files?
Your results folder and the copy of the submitted script are under `/projects/malaria/results/<login>/`; intermediate files go in `/projects/malaria/work/<login>/`. Remember that `work/` is not backed up: keep what matters in `results/`.
:::

---

## Good practice {#good-practice}

- Always run with `--dry-run` first when you try a new script or new options.
- Write the outputs of your script inside the project folders, and run `--dry-run` to see the folders `hpcsub` uses.
- Size `-c` and `-m` from the real usage of earlier jobs (`seff`). See [Our nodes](nodes.md).
- In your script, pass `$SLURM_CPUS_PER_TASK` to your program's threads option.
- For a sub-project, you must be a member of that sub-project. See [Projects, sub-projects and roles](../../getting-started/projects.md).

If `hpcsub` refuses to submit and you do not understand why, see [Troubleshooting](troubleshooting.md) or contact support.
