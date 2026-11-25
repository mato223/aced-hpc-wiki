---
id: sample-scripts
title: Sample job scripts
sidebar_label: "Sample job scripts"
sidebar_position: 4
---

Small, ready-to-submit scripts to check that your environment works and to get used to the job cycle (submit, wait, read the output) before launching a real analysis.

All of them use the `debug` QOS (short tests that start faster), the `malaria` project account and a small amount of memory. Replace `malaria` with your own project. The output file (`%x_%j.out`: job name and job ID) is written in the folder you submit from, for example `/projects/malaria/work/<login>`.

---

## Printing loaded modules {#printing-loaded-modules}

Shows which modules are loaded by default on a compute node, and which ones are available.

### Script: `list_modules.sh` {#script-list_modulessh}

```bash
#!/bin/bash
#SBATCH --job-name=list_modules
#SBATCH --account=malaria                  # your project (required)
#SBATCH --qos=debug
#SBATCH --time=00:05:00
#SBATCH --cpus-per-task=1
#SBATCH --mem=1G
#SBATCH --output=%x_%j.out

module list
module -t avail
```

### How to use {#how-to-use}

- Save the script as `list_modules.sh`.
- Submit it with `sbatch list_modules.sh`.
- Read `list_modules_<jobid>.out`. Module lists are written to the error stream, so they appear in the same file here.

---

## Checking the storage spaces {#checking-the-storage-spaces}

Checks that the job sees your home directory, the project, your scratch and the shared references, as the login node does.

### Script: `check_storage.sh` {#script-check_storagesh}

```bash
#!/bin/bash
#SBATCH --job-name=check_storage
#SBATCH --account=malaria                  # your project (required)
#SBATCH --qos=debug
#SBATCH --time=00:05:00
#SBATCH --cpus-per-task=1
#SBATCH --mem=1G
#SBATCH --output=%x_%j.out

echo "Node: $(hostname)"
df -h $HOME /projects/malaria /scratch/malaria /references
ls -ld /projects/malaria /scratch/malaria/$USER
```

### How to use {#how-to-use-1}

- Save the script as `check_storage.sh` and submit it with `sbatch check_storage.sh`.
- In `check_storage_<jobid>.out`, check that every space is listed. If your scratch folder does not exist yet, create it with `mkdir -p /scratch/malaria/$USER`.

---

## Printing the date and the job's resources {#printing-the-date-and-the-jobs-resources}

Prints when the job started, on which node, and what Slurm gave it.

### Script: `job_info.sh` {#script-job_infosh}

```bash
#!/bin/bash
#SBATCH --job-name=job_info
#SBATCH --account=malaria                  # your project (required)
#SBATCH --qos=debug
#SBATCH --time=00:05:00
#SBATCH --cpus-per-task=4
#SBATCH --mem=2G
#SBATCH --output=%x_%j.out

date
echo "Job ID:        $SLURM_JOB_ID"
echo "Node:          $(hostname)"
echo "Account:       $SLURM_JOB_ACCOUNT"
echo "CPUs per task: $SLURM_CPUS_PER_TASK"
echo "Memory (MB):   $SLURM_MEM_PER_NODE"
```

### How to use {#how-to-use-2}

- Save the script as `job_info.sh` and submit it with `sbatch job_info.sh`.
- Compare the values in `job_info_<jobid>.out` with what you requested.

---

## Running a simple R script {#running-a-simple-r-script}

R 4.2.1 is available after loading the GNU 12 compiler module: `module load gnu12 R/4.2.1`.

### Script: `run_r_demo.sh` {#script-run_r_demosh}

```bash
#!/bin/bash
#SBATCH --job-name=r_demo
#SBATCH --account=malaria                  # your project (required)
#SBATCH --qos=debug
#SBATCH --time=00:10:00
#SBATCH --cpus-per-task=1
#SBATCH --mem=2G
#SBATCH --output=%x_%j.out

module load gnu12 R/4.2.1

Rscript -e 'cat("Hello from R", R.version.string, "\n")'
```

To run your own R script, replace the last line with `Rscript /projects/malaria/scripts/my_analysis.R`.

### How to use {#how-to-use-3}

- Save the script as `run_r_demo.sh` and submit it with `sbatch run_r_demo.sh`.
- `r_demo_<jobid>.out` should contain `Hello from R` and the R version.

---

## Running a simple shell command {#running-a-simple-shell-command}

The simplest possible job, to check that you can submit and that the output is written.

### Script: `echo_message.sh` {#script-echo_messagesh}

```bash
#!/bin/bash
#SBATCH --job-name=echo_message
#SBATCH --account=malaria                  # your project (required)
#SBATCH --qos=debug
#SBATCH --time=00:02:00
#SBATCH --cpus-per-task=1
#SBATCH --mem=500M
#SBATCH --output=%x_%j.out

echo "This is a demo job running on $(hostname)"
```

### How to use {#how-to-use-4}

- Save the script as `echo_message.sh` and submit it with `sbatch echo_message.sh`.
- The message appears in `echo_message_<jobid>.out`.

---

## Next steps {#next-steps}

Once these work, move on to a real analysis with the [IGH job script template](job-scripts.md) or [hpcsub](hpcsub.md). If a job fails, see [Troubleshooting](troubleshooting.md). The full list of software is in [Installed software](../../software/installed.md).
