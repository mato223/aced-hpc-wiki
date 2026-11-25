---
title: File System Best Practices
sidebar_position: 3
sidebar_label: "File System Practices"
---

All users share the same storage. Putting files in the wrong place, copying them the wrong way or duplicating data slows everyone down and can make your colleagues lose access to your files. The storage spaces themselves are described in [Storage systems](../hardware/storage.md).

## Where to put what {#where-to-put-what}

| What | Where | Why |
|------|-------|-----|
| Scripts, configuration files | `$HOME` or `/projects/<project>/scripts` | Backed up; `scripts/` is shared with the team (git recommended) |
| Running computations, large temporary files | `/scratch/<project>/<login>` | Fast SSDs; **not backed up**, purged after <Var name="scratchPurgeDays" /> days without use |
| Intermediate files you may need again | `/projects/<project>/work/` | Shared, but **not backed up** |
| Results to keep | `/projects/<project>/results/<login>/` | Backed up, visible to the team |
| Job logs | `/projects/<project>/results/slurm_logs/` | Visible to the team for troubleshooting |
| Files to share with other members | `/projects/<project>/shared/` | Writable by project and sub-project members |
| Raw sequencing data | `/projects/<project>/data/raw/` (shortcuts) | Read-only: read them in place |
| Reference genomes and databases | `/references/<tool>/<version>` | Read-only: never copy them |

For sub-projects, replace `/projects/<project>` with `/projects/<project>/<sub-project>` and `/scratch/<project>/<login>` with `/scratch/<project>/<sub-project>/<login>`. See [Projects, sub-projects and roles](../getting-started/projects.md).

## Copying files into a project {#copying-into-a-project}

In a project directory, new files automatically belong to the project and can be modified by the whole team. **Copying while keeping the original permissions cancels this rule**: your colleagues may then get `Permission denied` on your files.

```bash
# USE: these commands apply the project's permissions
cp -r my_folder /projects/malaria/results/<login>/
rsync -rlt my_folder /projects/malaria/results/<login>/

# AVOID: these keep the original owner group and permissions
cp -p ...
cp -a ...
rsync -a ...
mv ~/my_folder /projects/malaria/...  # moving from your home keeps the old permissions
```

If a colleague gets `Permission denied` on files you copied, give the group back its rights:

```bash
chmod -R g+rwX /projects/malaria/my_folder
```

### Check your projects {#check-your-projects}

```bash
# The projects (groups) you belong to
groups
id
```

After being added to a project, **log out and log in again** so that the new access is taken into account.

## Raw data and references {#raw-data-and-references}

- **Never copy or modify raw data.** `data/raw/` contains shortcuts (links) to the sequencer runs: read the files directly from there. Note that `cp -a` or `rsync -a` on a shortcut copies the link, not the data.
- **Never download your own copy of a shared database.** Use the versioned copy under `/references`, for example:

```bash
kraken2 --db /references/kraken2/2026-11 --threads $SLURM_CPUS_PER_TASK sample.fastq
```

If a database or version is missing, ask for it through a ticket on <Var name="supportPortal" link />.

## Working in scratch {#scratch}

A typical analysis:

1. reads its input from `data/raw/` or `/references`;
2. writes its large temporary files to `/scratch/<project>/<login>`;
3. copies the final results to `/projects/<project>/results/<login>/`;
4. deletes what is no longer needed in scratch.

:::warning Scratch is purged
Files not used for <Var name="scratchPurgeDays" /> days are deleted automatically (with <Var name="scratchNoticeDays" /> days' notice) and **cannot be recovered**. Never leave your only copy of a result in scratch.
:::

Do not use `/tmp` on the compute nodes for large files: it lives in memory (see [Node-local /tmp](../hardware/storage.md#node-tmp)).

## Keeping usage reasonable {#keeping-usage-reasonable}

Space used is monitored per user and per project. Please:

- clean up `work/` and your scratch space regularly;
- avoid keeping several copies of the same data;
- compress or archive results you no longer use actively.

```bash
# Size of your directories
du -sh /projects/malaria/results/<login> /scratch/malaria/<login>

# Your 20 largest files and folders in scratch
du -ah /scratch/malaria/<login> | sort -rh | head -20

# Archive a finished analysis
tar -czf old_analysis.tar.gz old_analysis/ && rm -rf old_analysis/
```

Old or inactive data may be cleaned up.

## Avoid many small files {#avoid-small-file-accumulation}

Thousands of small files in one directory slow down the shared file system for everyone:

```bash
# BAD: thousands of small files in one directory
output/
├── result_0001.txt
├── ... (10,000 files)
└── result_9999.txt

# BETTER: organised in subdirectories
output/
├── batch_001/
│   └── ... (100 files)
└── batch_100/
```

Where possible, use formats that group data (compressed FASTQ/BAM/CRAM, HDF5, tar archives) rather than many small text files.

## I/O tips {#io-optimization-tips}

### Minimise file operations {#minimize-file-operations}

```python
# BAD: opening the file in a loop
for i in range(10000):
    with open('output.txt', 'a') as f:
        f.write(f"Result {i}\n")

# GOOD: open once, write many times
with open('output.txt', 'w') as f:
    for i in range(10000):
        f.write(f"Result {i}\n")
```

### Limit checkpoint files {#batch-checkpoint-files}

```bash
# BAD: one checkpoint file per step
checkpoint_001.dat
checkpoint_002.dat
... (thousands of files)

# GOOD: checkpoint at intervals, overwrite the previous one
checkpoint_latest.dat
checkpoint_backup.dat
```

### Heavy I/O workloads {#avoid-simultaneous-large-io-jobs}

If you plan to run many I/O-intensive jobs at the same time, contact support first (<Var name="supportEmail" link />) to discuss your workflow.
