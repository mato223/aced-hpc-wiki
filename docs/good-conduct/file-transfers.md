---
title: File Transfer Guide
sidebar_position: 5
sidebar_label: "File Transfer Guide"
---

Files are transferred to and from the cluster through the login node, <Var name="loginHost" code />, with `scp`, `rsync` or `sftp`. Follow these guidelines to transfer efficiently without overloading the login node and the shared storage.

:::info From the institute network only
The cluster can only be reached from the IGH institute network (see [Connecting](../getting-started/connecting.md)). Run the commands below from a computer connected to that network. In the examples, replace `<login>` with your IGH username.
:::

## Transfer methods {#transfer-methods}

| Method | Best for | Example |
|--------|----------|---------|
| `scp` | Single files, small directories | `scp file.txt <login>@acegid-hpc-01:~/` |
| `rsync` | Large directories, resumable transfers, synchronisation | `rsync -rltvz dir/ <login>@acegid-hpc-01:/projects/malaria/shared/dir/` |
| `sftp` | Interactive transfers | `sftp <login>@acegid-hpc-01` |

## Transferring into a project {#transferring-into-a-project}

Files in a project directory must keep the project's permissions so that your whole team can use them. **Into a project, use `rsync -rlt`, not `rsync -a`**: `-a` also copies the permissions and group of your own computer, and your colleagues may then get `Permission denied`.

```bash
# GOOD: into a project directory
rsync -rltvz my_data/ <login>@acegid-hpc-01:/projects/malaria/shared/my_data/

# AVOID into a project: keeps your local permissions and group
rsync -avz my_data/ <login>@acegid-hpc-01:/projects/malaria/shared/my_data/
```

If this already happened, see [Copying files into a project](file-system.md#copying-into-a-project) to fix the permissions.

:::tip Sequencing runs
Raw sequencing runs do not need to be uploaded into your project: they are made available in the project's `data/raw/` directory (see [Raw sequencing data](../hardware/storage.md#raw-data)).
:::

## Many small files: archive first {#small-file-transfer-best-practices}

### Archive before transferring {#archive-before-transferring}

Transferring thousands of small files one by one is very slow and stresses the shared storage. Archive them first:

```bash
# On your computer, before transferring
tar -czf my_data.tar.gz my_data_directory/

# Transfer the single archive
scp my_data.tar.gz <login>@acegid-hpc-01:/scratch/malaria/<login>/

# On the cluster, extract the archive
cd /scratch/malaria/<login>
tar -xzf my_data.tar.gz
```

### Why archives are better {#why-archives-are-better}

| Approach | 10,000 files of 1 KB | Speed |
|----------|----------------------|-------|
| Individual transfers | 10,000 operations | Very slow |
| One tar archive | 1 operation | Fast |

Each file has a fixed overhead (metadata, permissions, network round trips). An archive removes most of it.

## Large file transfers {#large-file-transfers}

### Using rsync (recommended) {#using-rsync-recommended}

`rsync` is the best tool for large transfers because it:

- resumes interrupted transfers;
- only transfers what has changed;
- can compress data during transfer.

```bash
# Upload a directory into your project
rsync -rltvz local_dir/ <login>@acegid-hpc-01:/projects/malaria/shared/local_dir/

# Resume an interrupted transfer
rsync -rltvz --partial local_dir/ <login>@acegid-hpc-01:/projects/malaria/shared/local_dir/

# Show progress for a large file
rsync -rltvz --progress large_file.dat <login>@acegid-hpc-01:/scratch/malaria/<login>/
```

### rsync options explained {#rsync-options-explained}

| Option | Meaning |
|--------|---------|
| `-r` | Recursive (directories) |
| `-l` | Copy symbolic links as links |
| `-t` | Keep modification times |
| `-v` | Verbose output |
| `-z` | Compress during transfer |
| `--partial` | Keep partially transferred files |
| `--progress` | Show transfer progress |
| `-a` | Archive mode: `-rlt` **plus** permissions, group and owner. Do not use it into a project |

### Using scp {#using-scp}

For simple, one-off transfers:

```bash
# A single file to your home directory
scp myfile.txt <login>@acegid-hpc-01:~/

# A directory (recursive)
scp -r my_directory/ <login>@acegid-hpc-01:/scratch/malaria/<login>/

# With compression
scp -C large_file.dat <login>@acegid-hpc-01:/scratch/malaria/<login>/
```

Do not use `scp -p` into a project: like `rsync -a`, it keeps your local permissions.

### Using sftp {#using-sftp}

```bash
sftp <login>@acegid-hpc-01
sftp> cd /projects/malaria/shared
sftp> put my_file.txt
sftp> get results.tar.gz
sftp> exit
```

## Parallel transfers {#concurrent-transfer-limits}

:::warning Few transfers at a time
All transfers go through the login node. Do not launch many transfers in parallel: a few at a time is enough.
:::

```bash
# BAD: many parallel transfers
for i in {1..10}; do
    scp file_$i.dat <login>@acegid-hpc-01:/scratch/malaria/<login>/ &
done

# GOOD: archive everything, then transfer once
tar -cf data.tar *.dat
scp data.tar <login>@acegid-hpc-01:/scratch/malaria/<login>/
```

## Transferring results back {#transferring-results-back}

### Archive results before downloading {#archive-results-before-downloading}

```bash
# On the cluster, prepare the results
cd /projects/malaria/results/<login>
tar -czf run42_results.tar.gz run42/

# From your computer
scp <login>@acegid-hpc-01:/projects/malaria/results/<login>/run42_results.tar.gz ./
```

### Selective sync with rsync {#selective-sync-with-rsync}

Only download new or changed files:

```bash
# Sync results to your computer
rsync -rltvz <login>@acegid-hpc-01:/projects/malaria/results/<login>/ ./local_results/
```

## Transfer tips by scenario {#transfer-tips-by-scenario}

### Upload your scripts {#scenario-upload-code-repository}

```bash
# rsync with exclusions
rsync -rltvz --exclude='.git' --exclude='__pycache__' \
    my_scripts/ <login>@acegid-hpc-01:/projects/malaria/scripts/my_scripts/
```

Better still: keep your scripts in a git repository and `git clone` / `git pull` it in `/projects/malaria/scripts`.

### Upload a large dataset {#scenario-upload-large-dataset}

```bash
rsync -rltvz --partial --progress large_dataset.tar.gz \
    <login>@acegid-hpc-01:/scratch/malaria/<login>/
```

### Many small output files {#scenario-many-small-output-files}

```bash
# On the cluster, archive the outputs
cd /scratch/malaria/<login>/simulation
tar -czf outputs.tar.gz output_dir/

# From your computer, download and extract
scp <login>@acegid-hpc-01:/scratch/malaria/<login>/simulation/outputs.tar.gz ./
tar -xzf outputs.tar.gz
```

## What to avoid {#what-to-avoid}

| Don't | Do instead |
|-------|------------|
| Transfer 10,000+ small files individually | Archive first, then transfer |
| Use `rsync -a` or `scp -p` into a project | Use `rsync -rlt` |
| Upload raw sequencing data or reference databases | Use `data/raw/` and `/references` |
| Run many transfers in parallel | A few transfers at a time |
| Leave transferred data in scratch as your only copy | Keep what matters in `/projects/<project>/results` |

## Checking transfer success {#checking-transfer-success}

```bash
# On your computer: compute a checksum
md5sum large_file.dat > large_file.dat.md5

# Transfer both files
scp large_file.dat large_file.dat.md5 <login>@acegid-hpc-01:/scratch/malaria/<login>/

# On the cluster: verify
cd /scratch/malaria/<login>
md5sum -c large_file.dat.md5
```
