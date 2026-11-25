---
id: containers-hpc
title: Containers on HPC Clusters
sidebar_label: "Containers on HPC Clusters"
sidebar_position: 3
---

# Containers on HPC Clusters

This tutorial shows how to run containers on <Var name="clusterName" /> with **Charliecloud** and Slurm: pulling Docker images, converting them to directory images, running them in batch jobs, accessing your project data, and running MPI programs in containers.

:::info Available container runtime
- **Charliecloud 0.44** is available: `module load charliecloud/0.44`.
- **Apptainer (Singularity): not yet available.**
- The cluster has no GPUs, so GPU containers do not apply.
:::

:::warning Nothing heavy on the login node
Pull, convert and run containers **inside a job** on a compute node (`srun` for interactive work, `sbatch` for batch jobs). Never on the login node <Var name="loginHost" code />. See [Login node etiquette](../../good-conduct/login-nodes.md).
:::

## How Charliecloud differs from Docker {#how-charliecloud-differs-from-docker}

If you followed the previous tutorials, you used Docker on your workstation. Charliecloud works differently in a few important ways:

| | Docker | Charliecloud |
|-|--------|--------------|
| **Privileges** | Requires root (admin) access | Runs as your normal user |
| **Image format** | Layered images stored by a daemon | A plain directory (one folder per image) |
| **Main commands** | `docker pull`, `docker run` | `ch-image pull`, `ch-convert`, `ch-run` |
| **Directory mounts** | Explicit, with `-v` | Your home and `/tmp` automatically; others with `-b` |
| **User identity** | Root inside the container by default | *You* — same user, same permissions |
| **Where to build** | On your workstation | Pull ready-made images (build on your workstation) |

The key idea: you **build** images with Docker on your workstation, then **run** them with Charliecloud on the cluster.

## Charliecloud basics {#introduction-to-charliecloud}

### Loading the module {#loading-the-module}

Start an interactive job on a compute node, then load Charliecloud:

```bash
# Interactive job on a compute node
srun --account=malaria --qos=debug --cpus-per-task=2 --mem=8G --time=01:00:00 --pty bash

# Load Charliecloud
module load charliecloud/0.44

# Check
ch-run --version
```

### Where images are stored {#where-images-are-stored}

Charliecloud uses two places:

- **The download cache** of `ch-image` (by default `/var/tmp/$USER.ch` on the node). The compute nodes are stateless: `/var/tmp` lives in the node's memory and does not survive on another node. Treat it as temporary and clean it after converting your image.
- **Your directory images**, created with `ch-convert`. Keep them in your scratch, for example `/scratch/malaria/$USER/images/`. Scratch files unused for <Var name="scratchPurgeDays" /> days are deleted, but an image can always be pulled again from its registry.

```bash
mkdir -p /scratch/malaria/$USER/images
```

Do not keep images in your home, and do not store copies of public images in the project directory.

### Pulling an image {#pulling-an-image}

Pull the Monte Carlo image built in the previous tutorial, then convert it to a directory image:

```bash
# Download the image into the ch-image cache
ch-image pull yourusername/monte-carlo:0.1

# Convert it to a directory image in your scratch
ch-convert yourusername/monte-carlo:0.1 /scratch/malaria/$USER/images/monte-carlo-0.1

# Free the cache on the node (it uses the node's memory)
ch-image reset
```

The directory `/scratch/malaria/$USER/images/monte-carlo-0.1` now contains the whole container filesystem. You can reuse it in all your jobs.

:::caution To be confirmed
Whether the compute nodes can reach Docker Hub and other registries has not been confirmed yet. If `ch-image pull` fails with a network error, use the method below.
:::

### Importing an image without internet access {#importing-an-image-without-internet-access}

You can also export the image on your workstation, copy the file to the cluster and convert it there. On your workstation:

```bash
docker create --name mc-export monte-carlo:0.1
docker export mc-export | gzip > monte-carlo-0.1.tar.gz
docker rm mc-export
```

Copy `monte-carlo-0.1.tar.gz` to your scratch (see [File transfers](../../good-conduct/file-transfers.md)), then, in a job on the cluster:

```bash
module load charliecloud/0.44
ch-convert /scratch/malaria/$USER/monte-carlo-0.1.tar.gz /scratch/malaria/$USER/images/monte-carlo-0.1
```

`docker export` produces a flattened filesystem, which is what `ch-convert` expects (`docker save` does **not** work). An exported image does not keep the `ENV` settings of the Dockerfile, so give full paths to programs or set variables with `--set-env=VAR=VALUE`.

### Running containers {#running-containers}

`ch-run` runs a command inside a directory image. Everything after `--` is the command:

```bash
IMG=/scratch/malaria/$USER/images/monte-carlo-0.1

# Run the Monte Carlo simulation
ch-run --set-env "$IMG" -- python /app/estimate_pi.py 5000000

# Check the Python version inside the container
ch-run "$IMG" -- python --version

# Open a shell inside the container
ch-run "$IMG" -- /bin/bash
```

- `--set-env` (without a value) applies the environment variables defined in the image (the `ENV` lines of the Dockerfile).
- Unlike Docker, `ch-run` does not run the image's default command (`CMD`): always give the command explicitly.
- Inside the container you are still *you*: same user, same permissions. Your home directory is available at `/home/$USER`.
- The image is read-only. Write your results to a mounted directory (see below), not inside the image.

### Accessing your project data {#accessing-project-data}

Only your home and `/tmp` are mounted automatically. To use `/projects`, `/scratch` or `/references` inside the container, bind them with `-b`. The mount point must exist in the image; with a directory image, simply create it once:

```bash
IMG=/scratch/malaria/$USER/images/monte-carlo-0.1
mkdir -p "$IMG/projects" "$IMG/scratch" "$IMG/references"

ch-run -b /projects -b /scratch -b /references --set-env "$IMG" -- \
    python /app/estimate_pi.py 5000000 --output /projects/malaria/results/$USER/pi.json
```

Paths are then the same inside and outside the container, and your usual permissions apply. The files you create in the project still belong to the project.

### Interactive sessions with srun {#interactive-shell-sessions-with-srun}

To explore a container, test commands or debug a failing job, open an interactive job on a compute node, then a shell inside the container:

```bash
srun --account=malaria --qos=debug --cpus-per-task=2 --mem=4G --time=01:00:00 --pty bash
module load charliecloud/0.44
ch-run --set-env /scratch/malaria/$USER/images/monte-carlo-0.1 -- /bin/bash
```

```
$ python --version
$ pip list
$ ls /app/
$ python /app/estimate_pi.py 100000
$ exit
```

## Slurm batch jobs {#slurm-batch-jobs}

For real work, write a batch script that requests resources and runs the container, then submit it with `sbatch`.

### Example: Monte Carlo batch job {#the-example-monte-carlo-batch-job}

Create `monte-carlo.slurm`:

```bash
#!/bin/bash
#SBATCH --job-name=monte-carlo
#SBATCH --account=malaria
#SBATCH --qos=normal
#SBATCH --time=00:30:00
#SBATCH --cpus-per-task=4
#SBATCH --mem=8G
#SBATCH --output=/projects/malaria/results/slurm_logs/%x_%j.out
#SBATCH --error=/projects/malaria/results/slurm_logs/%x_%j.err

set -euo pipefail
module load charliecloud/0.44

IMG=/scratch/malaria/$USER/images/monte-carlo-0.1
OUTPUT_DIR=/projects/malaria/results/$USER/monte-carlo_$SLURM_JOB_ID
mkdir -p "$OUTPUT_DIR"

# Give the program the number of CPUs reserved for the job
export OMP_NUM_THREADS=$SLURM_CPUS_PER_TASK

echo "Job $SLURM_JOB_ID started on $(hostname) at $(date)"

ch-run -b /projects --set-env "$IMG" -- \
    python /app/estimate_pi.py 50000000 --output "$OUTPUT_DIR/results.json"

echo "Job completed at $(date)"
cat "$OUTPUT_DIR/results.json"
```

Key points:

- **`--account=malaria`** charges the job to your project; **`--mem`**, **`--time`** and **`--cpus-per-task`** must always be set.
- **`module load charliecloud/0.44`** must be in the script: modules from your interactive session are not reliably inherited.
- **`-b /projects`** makes the project directory visible inside the container (the mount point was created in the image, see [Accessing your project data](#accessing-project-data)).
- **`OMP_NUM_THREADS=$SLURM_CPUS_PER_TASK`** makes multithreaded libraries use exactly the CPUs you reserved. For a tool with a threads option, pass `$SLURM_CPUS_PER_TASK` to it (for example `-t $SLURM_CPUS_PER_TASK`).

Submit and monitor:

```bash
sbatch monte-carlo.slurm
squeue --me
seff <jobid>
```

## MPI containers {#mpi-containers}

MPI (Message Passing Interface) runs one program across several processes, possibly on several nodes. MPI containers need care: the MPI library inside the container must be compatible with the host's MPI.

### The concept {#the-concept}

The usual approach is the **hybrid model**: the container includes an MPI library, and the *host* MPI launcher starts the processes. The host handles process placement and the network; the container provides the application environment.

```
  Host System                    Container
┌─────────────────┐          ┌──────────────────┐
│  mpirun / ibrun │ launches │  Your app + MPI  │
│  (host MPI)     │ ───────> │  (container MPI) │
│                 │          │                  │
│  Manages:       │          │  Provides:       │
│  - Network      │          │  - Application   │
│  - Process      │          │  - Dependencies  │
│    placement    │          │  - Compatible MPI│
└─────────────────┘          └──────────────────┘
```

The MPI version inside the container should be compatible with the host's: on <Var name="clusterName" /> the host provides `openmpi4/4.1.6` (`module load gnu12 openmpi4`), so use OpenMPI 4.x in the container.

:::caution To be confirmed
Running multi-node MPI programs inside Charliecloud containers has not been validated on <Var name="clusterName" /> yet. Test on a small case first, and contact support if processes fail to start or communicate.
:::

### Example: parallel Pi estimation {#the-example-parallel-pi-estimation}

Each MPI process estimates Pi with part of the samples, and the results are combined. On your workstation, create the project:

```bash
mkdir ~/monte-carlo-mpi && cd ~/monte-carlo-mpi
```

Create `estimate_pi_mpi.py`:

```python
#!/usr/bin/env python3
"""Parallel Monte Carlo Pi estimation using MPI."""

from mpi4py import MPI
import numpy as np
import time
import socket
import argparse

def monte_carlo_pi(num_samples):
    x = np.random.uniform(0, 1, num_samples)
    y = np.random.uniform(0, 1, num_samples)
    inside = np.sum(x**2 + y**2 <= 1)
    return inside

def main():
    comm = MPI.COMM_WORLD
    rank = comm.Get_rank()
    size = comm.Get_size()

    parser = argparse.ArgumentParser()
    parser.add_argument("samples", type=int, nargs="?", default=10_000_000)
    args = parser.parse_args()

    # Each process handles an equal share of the samples
    samples_per_rank = args.samples // size
    np.random.seed(rank * 1000 + 42)

    if rank == 0:
        print(f"Estimating Pi with {args.samples:,} total samples across {size} processes")
        start = time.time()

    # Each rank computes its portion
    local_inside = monte_carlo_pi(samples_per_rank)

    # Combine results across all ranks
    total_inside = comm.reduce(local_inside, op=MPI.SUM, root=0)

    if rank == 0:
        pi_estimate = 4 * total_inside / (samples_per_rank * size)
        elapsed = time.time() - start
        print(f"  Estimate: {pi_estimate:.8f}")
        print(f"  Error:    {abs(pi_estimate - np.pi):.8f}")
        print(f"  Time:     {elapsed:.3f}s")
        print(f"  Speedup:  {size} processes")

    # Every rank reports its hostname for verification
    print(f"  Rank {rank}/{size} on {socket.gethostname()}: {local_inside:,} hits "
          f"from {samples_per_rank:,} samples")

if __name__ == "__main__":
    main()
```

Create the `Dockerfile` (Ubuntu 22.04 provides OpenMPI 4.1):

```dockerfile
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        openmpi-bin \
        libopenmpi-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir mpi4py numpy

WORKDIR /app
COPY estimate_pi_mpi.py .
RUN chmod +x estimate_pi_mpi.py

CMD ["python3", "estimate_pi_mpi.py"]
```

Build and push the image:

```bash
docker build --platform linux/amd64 -t yourusername/monte-carlo-mpi:0.1 .
docker push yourusername/monte-carlo-mpi:0.1
```

Test it locally with Docker before using the cluster:

```bash
# Single process
$ docker run --rm yourusername/monte-carlo-mpi:0.1 \
    mpirun -n 1 python3 /app/estimate_pi_mpi.py 5000000

# Two processes (if Docker has access to multiple cores)
$ docker run --rm yourusername/monte-carlo-mpi:0.1 \
    mpirun -n 2 python3 /app/estimate_pi_mpi.py 5000000
```

On the cluster, pull and convert the image in a job (see [Pulling an image](#pulling-an-image)) to `/scratch/malaria/$USER/images/monte-carlo-mpi-0.1`, then create `mpi-pi.slurm`:

```bash
#!/bin/bash
#SBATCH --job-name=mpi-pi
#SBATCH --account=malaria
#SBATCH --time=00:30:00
#SBATCH --nodes=2
#SBATCH --ntasks-per-node=8
#SBATCH --cpus-per-task=1
#SBATCH --mem=16G
#SBATCH --output=mpi-pi_%j.out
#SBATCH --error=mpi-pi_%j.err

module load gnu12 openmpi4 charliecloud/0.44

IMG=/scratch/malaria/$USER/images/monte-carlo-mpi-0.1

echo "MPI Pi estimation: $SLURM_NTASKS tasks across $SLURM_NNODES nodes"

# Use the HOST mpirun to launch the container processes.
mpirun -np $SLURM_NTASKS ch-run --set-env "$IMG" -- \
    python3 /app/estimate_pi_mpi.py 100000000
```

Submit it with `sbatch mpi-pi.slurm`. In the output file, each rank reports its hostname: ranks on the same node share a hostname, ranks on different nodes (`acegid-cpu-01`, `acegid-cpu-02`…) report different ones. This confirms that MPI communicates across nodes.

## Containers for bioinformatics tools {#bioinformatics-containers}

[BioContainers](https://biocontainers.pro/) publishes ready-made images for most bioconda tools on `quay.io`. Pick the exact tag on the tool's page, then pull and convert it in a job:

```bash
module load charliecloud/0.44
ch-image pull quay.io/biocontainers/samtools:<tag>
ch-convert quay.io/biocontainers/samtools:<tag> /scratch/malaria/$USER/images/samtools-<tag>
ch-image reset
```

For many bioinformatics tools, a conda environment is simpler: see [Custom installations](../../software/custom-install.md#conda-environments).

:::info Not available yet
**Apptainer/Singularity** and **Nextflow** are not available on the cluster yet. Workflows that require them cannot run as is. To request them, open a ticket on <Var name="supportPortal" link />.
:::

## Troubleshooting {#troubleshooting}

| Problem | Cause | Solution |
|---------|-------|----------|
| `ch-run: command not found` | Module not loaded | Add `module load charliecloud/0.44` (also in the job script) |
| `command not found` inside the container | Program not in the container's `PATH` | Add `--set-env`, or use the full path (`ch-run "$IMG" -- which python`) |
| Bind mount fails (`can't mkdir`, `No such file`) | Mount point missing in the image | `mkdir -p "$IMG/projects"` (and the others), see [Accessing your project data](#accessing-project-data) |
| `Read-only file system` | Writing inside the image | Write to a mounted directory (`/projects/...`, `/scratch/...`) or your home |
| `ch-image pull` cannot connect | No access to the registry | Use [Importing an image without internet access](#importing-an-image-without-internet-access) |
| `exec format error` | Image built for ARM (Apple Silicon Mac) | Rebuild with `--platform linux/amd64`, see [Advanced build topics](advanced-builds.md#multi-architecture-builds) |
| MPI processes all on the same node | Not using the host launcher | Use `mpirun -np $SLURM_NTASKS ch-run ...`, not `ch-run ... mpirun` |
| Host environment leaking in | Host `PATH` or Python variables interfere | Remove them with `--unset-env=PYTHONPATH` (or another variable name) |

## Quick reference {#quick-reference}

```bash
# Load the module
module load charliecloud/0.44

# Pull an image into the ch-image cache, then convert it to a directory
ch-image pull image:tag
ch-convert image:tag /scratch/malaria/$USER/images/name

# Convert a tarball made with "docker export"
ch-convert image.tar.gz /scratch/malaria/$USER/images/name

# Run a command in a container (with the image's ENV variables)
ch-run --set-env /scratch/malaria/$USER/images/name -- command args

# Interactive shell
ch-run /scratch/malaria/$USER/images/name -- /bin/bash

# Bind project, scratch and reference directories
ch-run -b /projects -b /scratch -b /references /scratch/malaria/$USER/images/name -- command

# Images in the ch-image cache, and cleanup
ch-image list
ch-image delete image:tag
ch-image reset
```

---

**See also:** [Slurm basics](../running-jobs/slurm-basics.md) | [Writing job scripts](../running-jobs/job-scripts.md) | [Charliecloud documentation](https://charliecloud.io/)

**Next:** [Advanced build topics](advanced-builds.md) — reduce image size with multi-stage builds and support several CPU architectures.
