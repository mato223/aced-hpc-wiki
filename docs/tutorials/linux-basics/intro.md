---
id: linux-intro
title: Introduction to Linux for HPC users
sidebar_label: "Introduction to Linux"
sidebar_position: 1
---

# Introduction to Linux for HPC users

This tutorial is for researchers who are comfortable with a personal computer (Windows or macOS) but new to the IGH HPC cluster. On your computer you click icons and browse folders; on the cluster you type commands. This guide walks you through that change step by step.

By the end you will know how to move around the cluster's storage, manage files and folders, share files with your project team, and write a simple Bash script.

:::info Prerequisites
You need an IGH account, membership of at least one project, and to be able to log in with SSH from the institute network. See [Accounts](../../getting-started/accounts.md) and [Connecting to the cluster](../../getting-started/connecting.md).
:::

---

## 1. Why the cluster runs Linux {#1-why-the-cluster-runs-linux}

The IGH HPC cluster runs **Linux**, like almost all the world's supercomputers and servers:

- **Stability and performance**: Linux handles many simultaneous users and long-running work well.
- **The command line**: you describe exactly what you want the computer to do. Commands can be saved in scripts, repeated and shared, which makes your analyses reproducible.
- **Software**: most scientific and bioinformatics tools are written for Linux first.

When you connect over SSH you land in a **terminal**: a text window where you type commands and read their output. There is no desktop and no file explorer.

---

## 2. The terminal prompt {#2-the-terminal-prompt}

You connect to the login node, <Var name="loginHost" code />, from the institute network:

```bash
ssh <login>@acegid-hpc-01
```

Once logged in, you see a **prompt** similar to this one:

```
[<login>@acegid-hpc-01 ~]$
```

| Part | Meaning |
|------|---------|
| `<login>` | Your IGH login |
| <Var name="loginHost" code /> | The machine you are on: the login node |
| `~` | Your current folder (`~` is short for your home directory) |
| `$` | You are a regular user |

Everything you type appears after the `$`. When you press **Enter**, the shell runs your command.

:::warning The login node is not for computing
The login node is shared by everyone. Use it to edit files, organise data and submit jobs. Every analysis runs on the compute nodes through Slurm: see [Slurm basics](../running-jobs/slurm-basics.md) and [Using the login node](../../good-conduct/login-nodes.md).
:::

### Your first commands {#your-first-commands}

```bash
whoami      # your login
id          # your login and the groups (projects) you belong to
groups      # only the list of your groups
```

On the IGH cluster each project (and sub-project) is a group. If a project you were just added to does not appear in `groups`, log out and log in again.

---

## 3. The Linux filesystem {#3-the-linux-filesystem}

On Windows, files live on drives such as `C:\`. On Linux, everything is in a single tree that starts at the **root**, written `/`. The storage spaces you will use on the cluster are:

```
$HOME                          # your private home directory
/projects/malaria/             # shared folder of the "malaria" project
├── data/raw/                  # raw sequencing data (read-only links)
├── data/ref/                  # project-specific references
├── scripts/                   # scripts and pipelines
├── results/                   # results (one sub-folder per person)
├── shared/                    # exchanges between members
└── work/                      # intermediate files (not backed up)
/scratch/malaria/<login>/      # your fast temporary space for the project
/references/                   # shared genomes and databases (read-only)
```

### The directories that matter on the IGH cluster {#the-directories-that-matter-on-the-igh-cluster}

| Location | What to put there | Backed up |
|----------|-------------------|-----------|
| `$HOME` | Your scripts, configuration files, conda environments. No large datasets. | Yes |
| `/projects/malaria` (or `/projects/malaria/<sub-project>`) | The project's data and results, shared with the team | Yes, except `work/` |
| `/scratch/malaria/<login>` | Running computations and large temporary files | No |
| `/references` | Reference genomes and databases, versioned (for example `/references/kraken2/2026-11`) | Read-only |

:::caution Scratch is cleaned automatically
Files in the scratch space that have not been used for <Var name="scratchPurgeDays" /> days are deleted, with <Var name="scratchNoticeDays" /> days' notice. Deleted files cannot be recovered: copy what you want to keep into `/projects/malaria/results`.
:::

Storage space is monitored per user and per project: clean up `work/` and your scratch, and do not duplicate data. See [Storage](../../hardware/storage.md) and [File system practices](../../good-conduct/file-system.md) for details, and [Projects, sub-projects and roles](../../getting-started/projects.md) for the project structure.

---

## 4. Navigating the filesystem {#4-navigating-the-filesystem}

### Where am I? {#where-am-i}

```bash
pwd
```

`pwd` (**print working directory**) prints the full path of the folder you are in. Just after logging in, this is your home directory.

### What is in this directory? {#what-is-in-this-directory}

```bash
ls          # list the current folder
ls -l       # long format: permissions, owner, group, size, date
ls -lh      # same, with readable sizes (K, M, G)
ls -a       # also show hidden files (names starting with a dot)
ls -lh /projects/malaria   # list another folder without going there
```

### Moving around {#moving-around}

```bash
cd /projects/malaria       # go to the project folder
cd results                 # go into a sub-folder
cd ..                      # go up one level
cd -                       # go back to the previous folder
cd                         # go back to your home directory (same as cd ~)
```

### Paths: absolute vs. relative {#paths-absolute-vs-relative}

An **absolute path** starts at `/` and works from anywhere:

```
/projects/malaria/data/raw/run01/sample01.fastq.gz
```

A **relative path** starts from your current folder:

```
data/raw/run01/sample01.fastq.gz    # only works from /projects/malaria
```

`.` means "the current folder" and `..` means "one level up". In job scripts, prefer absolute paths: the job may start in a different folder from the one you are in.

---

## 5. Creating and managing files and directories {#5-creating-and-managing-files-and-directories}

### Creating directories {#creating-directories}

```bash
mkdir analysis                        # create a folder here
mkdir -p analysis/run1/output         # create nested folders in one step
```

`-p` creates any missing parent folders.

### Creating files {#creating-files}

```bash
touch notes.txt       # create an empty file (or update its date)
nano notes.txt        # edit it in a simple text editor (Ctrl+O to save, Ctrl+X to quit)
```

### Copying files and directories {#copying-files-and-directories}

```bash
cp notes.txt notes_backup.txt         # copy a file
cp -r analysis/ analysis_backup/      # copy a folder (-r: recursive)
```

### Moving and renaming {#moving-and-renaming}

```bash
mv notes.txt archive/notes.txt        # move a file into a folder
mv old_name.txt new_name.txt          # rename a file
```

### Deleting files and directories {#deleting-files-and-directories}

```bash
rm notes.txt                          # delete a file
rm -r analysis_backup/                # delete a folder and everything in it
```

:::danger rm is permanent
Linux has no recycle bin. A file deleted with `rm` is gone immediately. Check what you are deleting before pressing Enter.
:::

### Practical exercise: prepare your folders {#practical-exercise-prepare-your-folders}

Create your personal results folder in the project, and your scratch folder:

```bash
mkdir -p /projects/malaria/results/$USER/{qc,alignment,logs}
mkdir -p /scratch/malaria/$USER
ls /projects/malaria/results/$USER
```

`{qc,alignment,logs}` is **brace expansion**: Bash turns it into three folder names, so the three folders are created at once. `$USER` is replaced by your login.

---

## 6. Viewing and searching file contents {#6-viewing-and-searching-file-contents}

### Displaying file contents {#displaying-file-contents}

```bash
cat samples.txt           # print the whole file
head -20 samples.txt      # first 20 lines
tail -20 samples.txt      # last 20 lines
tail -f job.out           # follow a file as it grows (useful for job logs)
```

### Scrolling through a large file {#scrolling-through-a-large-file}

```bash
less samples.txt
zless sample01.fastq.gz   # same for a compressed file
```

Use the arrow keys or Page Up/Down to scroll, `/` to search, `q` to quit.

### Counting lines and words {#counting-lines-and-words}

```bash
wc -l samples.txt         # count lines
wc -w samples.txt         # count words
```

### Searching inside files {#searching-inside-files}

```bash
grep "ERROR" job.out                       # lines containing "ERROR"
grep -i "warning" job.out                  # case-insensitive search
grep -r "sample01" /projects/malaria/scripts/   # search a whole folder
```

---

## 7. File permissions {#7-file-permissions}

Every file and folder has an **owner**, a **group** and permissions that say who can read, write or execute it. `ls -l` shows them:

```
-rw-rw-r-- 1 <login> malaria 4.2K Nov 20 10:23 notes.txt
drwxrws--- 3 <login> malaria 4.0K Nov 20 10:30 results/
```

```
- rw- rw- r--
│  │   │   └── others: read only
│  │   └────── group (the project): read and write
│  └────────── owner: read and write
└───────────── type (- = file, d = folder)
```

**r** = read, **w** = write, **x** = execute (for a folder: enter it). `-` means not granted.

### Projects and groups {#projects-and-groups}

On the IGH cluster, access to a project's folders comes from its group: when you are added to the `malaria` project you become a member of its group, and you can work in `/projects/malaria`. Check your projects with:

```bash
id
groups
```

In a project folder, new files automatically belong to the project and can be modified by the whole team. Some copy commands keep the original permissions of your files and break this rule:

| Use | Avoid |
|-----|-------|
| `cp -r my_folder /projects/malaria/...` | `cp -p`, `cp -a` |
| `rsync -rlt my_folder /projects/malaria/...` | `rsync -a` |
| | `mv` from your home directory |

If a colleague gets `Permission denied` on files you put in the project, give the group read and write access:

```bash
chmod -R g+rwX /projects/malaria/my_folder
```

`g+rwX` adds read and write for the group, and execute only on folders (and files that were already executable).

### Making a script executable {#making-a-script-executable}

```bash
chmod +x myscript.sh      # add execute permission
./myscript.sh             # run it
```

---

## 8. Environment variables {#8-environment-variables}

The shell stores settings in **environment variables**, written in UPPERCASE and read with a `$`:

```bash
echo $HOME       # your home directory
echo $USER       # your login
echo $PATH       # folders where the shell looks for programs
```

You can define your own:

```bash
export PROJECT=/projects/malaria
export MYSCRATCH=/scratch/malaria/$USER
ls $PROJECT
cd $MYSCRATCH
```

These variables only last for the current session. To keep them, add the `export` lines to your `~/.bashrc` file.

---

## 9. Bash scripting: a practical example {#9-bash-scripting-a-practical-example}

A **Bash script** is a text file containing a series of commands. You write them once and run them as many times as you need: this is the basis of reproducible HPC work.

### The practical problem {#the-practical-problem}

A pipeline produces one log file per sample. At the end of a run you want to:

1. list each sample and whether it succeeded or failed;
2. move the failed logs to a separate folder;
3. count the successes and failures.

### Writing the script {#writing-the-script}

Create a practice folder in your scratch space:

```bash
mkdir -p /scratch/malaria/$USER/bash_tutorial/logs
cd /scratch/malaria/$USER/bash_tutorial
```

Generate some dummy log files:

```bash
for sample in sample_001 sample_002 sample_003 sample_004 sample_005; do
    echo "Processing $sample..." > logs/${sample}.log
done

# Simulate two failures
echo "ERROR: alignment failed" >> logs/sample_003.log
echo "ERROR: out of memory"    >> logs/sample_005.log
```

Open a new file with `nano`:

```bash
nano summarize_run.sh
```

Paste the script below, then press `Ctrl+O` to save and `Ctrl+X` to quit.

```bash
#!/usr/bin/env bash
# summarize_run.sh
# Checks each sample log for errors and produces a summary report.

# --- Configuration ---
LOG_DIR="logs"
FAILED_DIR="failed_logs"
REPORT="run_summary.txt"

# --- Setup ---
mkdir -p "$FAILED_DIR"
> "$REPORT"   # empty the report file if it already exists

passed=0
failed=0

echo "============================" >> "$REPORT"
echo "  Run Summary Report"        >> "$REPORT"
echo "  $(date)"                   >> "$REPORT"
echo "============================" >> "$REPORT"
echo ""                            >> "$REPORT"

# --- Process each log file ---
for logfile in "$LOG_DIR"/*.log; do
    # Sample name = file name without folder and without .log
    sample=$(basename "$logfile" .log)

    if grep -q "ERROR" "$logfile"; then
        echo "FAILED  $sample" >> "$REPORT"
        mv "$logfile" "$FAILED_DIR/"
        ((failed++))
    else
        echo "PASSED  $sample" >> "$REPORT"
        ((passed++))
    fi
done

# --- Print totals ---
echo ""                                      >> "$REPORT"
echo "----------------------------"          >> "$REPORT"
echo "Total passed: $passed"                 >> "$REPORT"
echo "Total failed: $failed"                 >> "$REPORT"
echo "Total samples: $((passed + failed))"   >> "$REPORT"

# Also print the report on screen
cat "$REPORT"
```

### Understanding the script {#understanding-the-script}

- **`#!/usr/bin/env bash`**: the **shebang** line. It must be the very first line and tells the system to run the file with Bash.
- **Variables**: `LOG_DIR="logs"` defines a variable. Write `"$LOG_DIR"` (with quotes) to use it safely.
- **`> "$REPORT"`**: `>` writes into a file and overwrites it; alone, it empties the file. `>>` appends to the end of the file.
- **`for logfile in "$LOG_DIR"/*.log`**: a loop over every `.log` file in the folder.
- **`if grep -q "ERROR" "$logfile"`**: `grep -q` searches silently and returns success if the word is found.
- **`basename "$logfile" .log`**: removes the folder and the `.log` suffix, leaving the sample name.
- **`((failed++))`**: arithmetic in Bash; adds 1 to `failed`.

### Making the script executable and running it {#making-the-script-executable-and-running-it}

```bash
chmod +x summarize_run.sh
./summarize_run.sh
```

You should see something like:

```
============================
  Run Summary Report
  Thu Nov 20 14:32:01 WAT 2026
============================

PASSED  sample_001
PASSED  sample_002
FAILED  sample_003
PASSED  sample_004
FAILED  sample_005

----------------------------
Total passed: 3
Total failed: 2
Total samples: 5
```

Check that the failed logs were moved:

```bash
ls failed_logs/
```

This is the core pattern of HPC scripting: loop over the inputs, check or transform each one, collect the results and report. The same structure works for hundreds of samples, and you can run it as a Slurm job.

---

## 10. Helpful terminal habits {#10-helpful-terminal-habits}

### Tab completion {#tab-completion}

Press **Tab** to complete command names, file and folder names. If there are several matches, press Tab twice to list them.

```bash
cd /scratch/mal<Tab>       # completes to /scratch/malaria/
ls /references/kr<Tab>     # completes to /references/kraken2/
```

### Command history {#command-history}

```bash
history              # list your previous commands with numbers
!42                  # run command number 42 again
!!                   # run the last command again
```

The **Up arrow** goes through previous commands; **Ctrl+R** searches your history as you type.

### Stopping a command {#stopping-a-command}

Press **Ctrl+C** to stop a running command.

### Getting help {#getting-help}

```bash
man ls              # manual page of the ls command
ls --help           # short help for most commands
```

---

## Quick reference {#quick-reference}

| Task | Command |
|------|---------|
| Show current folder | `pwd` |
| List files | `ls -lh` |
| Go to home directory | `cd` |
| Go up one level | `cd ..` |
| Create a folder | `mkdir -p name` |
| Copy into a project | `cp -r source /projects/malaria/...` |
| Move or rename | `mv source dest` |
| Delete a file | `rm file` |
| Delete a folder | `rm -r folder` |
| View a file | `less file` |
| Search in a file | `grep "pattern" file` |
| Show my projects | `id` or `groups` |
| Give the team access | `chmod -R g+rwX folder` |
| Make a script executable | `chmod +x script.sh` |
| Show a variable | `echo $VARIABLE` |

---

## What's next? {#whats-next}

- [Slurm basics](../running-jobs/slurm-basics.md): submit your computations to the compute nodes instead of running them on the login node.
- [Writing job scripts](../running-jobs/job-scripts.md): combine your Bash skills with Slurm directives to run real analyses.

---

## References {#references}

- [GNU Bash reference manual](https://www.gnu.org/software/bash/manual/)
- [The Linux Command Line (free book)](https://linuxcommand.org/tlcl.php) by William Shotts
- [Bash scripting cheatsheet](https://devhints.io/bash)
