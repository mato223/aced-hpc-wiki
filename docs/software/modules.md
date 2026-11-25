---
id: modules
title: Using Environment Modules
sidebar_label: "Modules"
sidebar_position: 2
---

<Var name="clusterName" /> uses **Lmod** to manage software environments. A module sets the variables (`PATH`, `LD_LIBRARY_PATH`…) needed to use a given software version. Nothing is loaded by default beyond the system defaults: load what you need, in your session and in each job script.

The full list of modules is on [Installed software](installed.md).

## Finding a module {#finding-a-module}

```bash
module avail              # modules you can load now
module spider             # all modules, including those that need gnu12 / openmpi4
module spider R           # versions of R and how to load them
```

## Loading a module {#loading-a-module}

```bash
module load anaconda/2025.06    # conda / Python
module load gnu12               # GNU 12 compilers
module load gnu12 R/4.2.1       # R needs the gnu12 compiler loaded first
module load gnu12 openmpi4 fftw/3.3.10
```

Always give the version (`R/4.2.1` rather than `R`): your results stay reproducible if a newer version is installed later.

## Listing, unloading and resetting {#listing-unloading-and-resetting}

```bash
module list                 # modules currently loaded
module unload R/4.2.1       # unload one module
module purge                # unload everything
module show R/4.2.1         # what the module changes in your environment
```

## Modules in a job script {#modules-in-a-job-script}

A job does not reliably inherit the modules of your interactive session. Load them explicitly in the script:

```bash
#!/bin/bash
#SBATCH --job-name=r_analysis
#SBATCH --account=malaria
#SBATCH --time=02:00:00
#SBATCH --cpus-per-task=4
#SBATCH --mem=16G

module purge
module load gnu12 R/4.2.1
export OMP_NUM_THREADS=$SLURM_CPUS_PER_TASK

Rscript analysis.R
```

See [Writing job scripts](../tutorials/running-jobs/job-scripts.md) for a complete template.

## Tips {#tips}

- If a command answers `command not found`, the module is probably not loaded (or not loaded in the job script).
- Bioinformatics tools are not available as modules yet: use conda (`module load anaconda/2025.06`) or ask for them, see [Installed software](installed.md#bioinformatics-tools).
- To install your own software, see [Custom installations](custom-install.md).
