---
id: containerize-code
title: Containerize Your Code
sidebar_position: 2
sidebar_label: "Containerize Your Code"
---

# Containerize Your Code

In this tutorial, you will write a Dockerfile, build a container image, test it locally, and push it to Docker Hub so it can be used on <Var name="clusterName" />. We'll work through a single example from start to finish.

## What is a Dockerfile? {#what-is-a-dockerfile}

A Dockerfile is a plain text file that contains a sequence of instructions for building a container image. Each instruction creates a **layer** in the image. Docker reads the Dockerfile top-to-bottom, executing each instruction in order, and the result is an image you can run anywhere.

Here are the core instructions:

| Instruction | What it does |
|-------------|-------------|
| `FROM` | Sets the base image — your starting point |
| `RUN` | Executes a command during the build (install packages, compile code, etc.) |
| `COPY` | Copies files from your machine into the image |
| `ENV` | Sets an environment variable that persists when the container runs |
| `WORKDIR` | Sets the working directory for subsequent instructions |
| `CMD` | Defines the default command when the container starts |
| `ENTRYPOINT` | Configures the container to run as an executable |

Let's see how these work together in practice.

## The Example: A Monte Carlo Simulation {#the-example-a-monte-carlo-simulation}

We'll containerize a Python script that estimates the value of Pi using a Monte Carlo method. This is a common computational technique — generate random points in a square, count how many fall inside a circle, and use the ratio to estimate Pi.

### Project Setup {#project-setup}

On your local workstation (where Docker is installed), create a project directory:

```bash
$ mkdir ~/monte-carlo && cd ~/monte-carlo
```

### The Application Code {#the-application-code}

Create a file called `estimate_pi.py`:

```python
#!/usr/bin/env python3
"""Estimate Pi using a Monte Carlo method."""

import argparse
import numpy as np
import time
import json
import os

def estimate_pi(num_samples):
    """Generate random points in a unit square, count those inside the unit circle."""
    x = np.random.uniform(0, 1, num_samples)
    y = np.random.uniform(0, 1, num_samples)
    inside_circle = np.sum(x**2 + y**2 <= 1)
    return 4 * inside_circle / num_samples

def main():
    parser = argparse.ArgumentParser(description="Estimate Pi using Monte Carlo simulation")
    parser.add_argument("samples", type=int, nargs="?", default=1_000_000,
                        help="Number of random samples (default: 1,000,000)")
    parser.add_argument("--output", "-o", type=str, default=None,
                        help="Path to write JSON results")
    parser.add_argument("--seed", type=int, default=None,
                        help="Random seed for reproducibility")
    args = parser.parse_args()

    if args.seed is not None:
        np.random.seed(args.seed)

    print(f"Estimating Pi with {args.samples:,} samples...")
    start = time.time()
    pi_estimate = estimate_pi(args.samples)
    elapsed = time.time() - start

    error = abs(pi_estimate - np.pi)
    print(f"  Estimate: {pi_estimate:.8f}")
    print(f"  Actual:   {np.pi:.8f}")
    print(f"  Error:    {error:.8f}")
    print(f"  Time:     {elapsed:.3f}s")

    if args.output:
        results = {
            "samples": args.samples,
            "estimate": pi_estimate,
            "error": error,
            "elapsed_seconds": elapsed,
        }
        with open(args.output, "w") as f:
            json.dump(results, f, indent=2)
        print(f"  Results written to {args.output}")

if __name__ == "__main__":
    main()
```

Test it locally to make sure it works:

```bash
$ python estimate_pi.py 100000
```

### The Requirements File {#the-requirements-file}

Create `requirements.txt` with pinned versions for reproducibility:

```
numpy==1.24.3
```

:::tip Why pin versions?
Using `numpy==1.24.3` instead of just `numpy` ensures that anyone building this container — today or six months from now — gets the exact same version. Without pinning, `pip install numpy` installs whatever the latest version is at build time, which can break your code if the API changes.
:::

### Writing the Dockerfile {#writing-the-dockerfile}

Now we translate the manual setup steps into a Dockerfile. Create a file called `Dockerfile` (no extension):

```dockerfile
FROM python:3.11-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY estimate_pi.py /app/estimate_pi.py
RUN chmod +x /app/estimate_pi.py

ENV PATH="/app:$PATH"

WORKDIR /app

CMD ["python", "estimate_pi.py"]
```

Let's walk through each instruction:

**`FROM python:3.11-slim`** — We start from the official Python 3.11 image, using the `-slim` variant which strips out compilers and docs we don't need. This is ~125 MB instead of ~1 GB for the full image. Avoid `python:latest` — the meaning of "latest" changes over time, making your builds non-reproducible.

**`RUN apt-get update && apt-get install ...`** — Installs system-level build tools that numpy needs for compilation. The `--no-install-recommends` flag skips optional packages, and `rm -rf /var/lib/apt/lists/*` cleans up the package cache. These are combined into a single `RUN` instruction because each `RUN` creates a new image layer — combining them keeps the image smaller.

**`COPY requirements.txt ...` then `RUN pip install ...`** — We copy the requirements file *before* the application code. This is intentional: Docker caches each layer, and layers only rebuild when their inputs change. If you change `estimate_pi.py` but not `requirements.txt`, Docker reuses the cached pip install layer instead of reinstalling all dependencies. This can save minutes on every rebuild.

**`COPY estimate_pi.py ...` then `RUN chmod +x ...`** — Copies the application code and makes it executable.

**`ENV PATH="/app:$PATH"`** — Adds `/app` to the system PATH so you can run `estimate_pi.py` directly without specifying the full path.

**`WORKDIR /app`** — Sets the working directory. Any subsequent commands (and the default command when the container starts) run from this directory.

**`CMD ["python", "estimate_pi.py"]`** — The default command. When you run the container without specifying a command, it executes this. You can override it at runtime by appending a different command.

### Building the image {#building-the-image}

From the `~/monte-carlo` directory (where your Dockerfile lives), run:

```bash
$ docker build --platform linux/amd64 -t monte-carlo:0.1 .
```

- `--platform linux/amd64` builds the image for Intel/AMD 64-bit Linux, the architecture of the cluster nodes. This matters if your workstation is an Apple Silicon Mac (see [Advanced build topics](advanced-builds.md#multi-architecture-builds)).
- `-t monte-carlo:0.1` gives the image a name and a version (tag).
- `.` tells Docker to use the current directory as the build context (it looks for a file named `Dockerfile` here).

Docker prints each step of the Dockerfile as it runs it. Later builds are much faster thanks to layer caching: Docker skips unchanged layers.

Check that the image was created:

```bash
$ docker images monte-carlo
```

```
REPOSITORY    TAG    IMAGE ID       CREATED          SIZE
monte-carlo   0.1    a1b2c3d4e5f6   30 seconds ago   198MB
```

### Testing the Container {#testing-the-container}

Run the container with the default command:

```bash
$ docker run --rm monte-carlo:0.1
```

The `--rm` flag removes the container after it exits (otherwise stopped containers accumulate). You should see output like:

```
Estimating Pi with 1,000,000 samples...
  Estimate: 3.14132400
  Actual:   3.14159265
  Error:    0.00026865
  Time:     0.024s
```

Override the default to pass arguments:

```bash
$ docker run --rm monte-carlo:0.1 python estimate_pi.py 10000000 --seed 42
```

Write output to a file using a **bind mount** — this maps a directory on your host into the container so data persists after the container exits:

```bash
$ mkdir -p ~/monte-carlo/output

$ docker run --rm \
    -v ~/monte-carlo/output:/output \
    monte-carlo:0.1 \
    python estimate_pi.py 5000000 --output /output/results.json

$ cat ~/monte-carlo/output/results.json
```

Start an interactive shell inside the container to explore:

```bash
$ docker run --rm -it monte-carlo:0.1 /bin/bash
```

From inside the container, you can run `python`, check installed packages with `pip list`, inspect the filesystem, and so on. Type `exit` to leave.

### Using .dockerignore {#using-dockerignore}

When Docker builds an image, it sends the entire build context (the `.` directory) to the Docker daemon. If your project directory contains large data files, `.git` history, or output files, these are unnecessarily copied and slow down the build.

Create a `.dockerignore` file to exclude them:

```
.git
__pycache__
*.pyc
output/
*.log
```

This works exactly like `.gitignore` — any matching files are excluded from the build context.

### Pushing to a container registry {#pushing-to-a-container-registry}

Your image only exists on your workstation. To use it on <Var name="clusterName" />, push it to a container registry (or export it to a file, see [Importing an image without internet access](containers-hpc.md#importing-an-image-without-internet-access)).

### Docker Hub {#docker-hub}

```bash
# Log in (you will be prompted for your Docker Hub credentials)
$ docker login

# Tag the image with your Docker Hub username
$ docker tag monte-carlo:0.1 yourusername/monte-carlo:0.1

# Push
$ docker push yourusername/monte-carlo:0.1
```

```
The push refers to repository [docker.io/yourusername/monte-carlo]
b73415306fae: Pushed
66a4bbbfab88: Pushed
3fc31d9c7e98: Pushed
0.1: digest: sha256:7e702eccde1d6c730f65a47d45ce7078a54519a232dd6b84137ba14f2f4705f4 size: 856
```

Open [Docker Hub](https://hub.docker.com/repositories) in your browser and go to your repositories: `yourusername/monte-carlo` is listed with the tag `0.1`.

You can also use the GitHub Container Registry (GHCR).

### GitHub Container Registry {#github-container-registry}

```bash
# Log in using a personal access token
$ echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag for GHCR
$ docker tag monte-carlo:0.1 ghcr.io/yourusername/monte-carlo:0.1

# Push
$ docker push ghcr.io/yourusername/monte-carlo:0.1
```

:::warning Do not put secrets or data in images
A public image can be downloaded by anyone. Never copy passwords, tokens, or research data (sequencing data, patient information) into an image. Keep data in your project directory and mount it when the container runs.
:::

### Running it on IGH HPC {#running-it-on-igh-hpc}

On the cluster, Charliecloud pulls the image and converts it to a directory that `ch-run` can execute. Do this inside a job, never on the login node. Here is a complete job script for the Monte Carlo container:

```bash
#!/bin/bash
#SBATCH --job-name=monte-carlo
#SBATCH --account=malaria
#SBATCH --time=01:00:00
#SBATCH --cpus-per-task=4
#SBATCH --mem=8G
#SBATCH --output=monte-carlo-%j.out
#SBATCH --error=monte-carlo-%j.err

set -euo pipefail
module load charliecloud/0.44

IMG=/scratch/malaria/$USER/images/monte-carlo-0.1

# Pull and convert the image (only needed once)
if [ ! -d "$IMG" ]; then
    mkdir -p /scratch/malaria/$USER/images
    ch-image pull yourusername/monte-carlo:0.1
    ch-convert yourusername/monte-carlo:0.1 "$IMG"
fi

# Run the simulation inside the container
export OMP_NUM_THREADS=$SLURM_CPUS_PER_TASK
ch-run --set-env "$IMG" -- python /app/estimate_pi.py 1000000 --output /home/$USER/results.json
```

Submit it with:

```bash
$ sbatch monte-carlo.sh
```

The full workflow (directory images, bind mounts, MPI) is covered in [Containers on HPC clusters](containers-hpc.md).

---
**Next:** [Containers on HPC clusters](containers-hpc.md) — run your images on <Var name="clusterName" /> with Charliecloud and Slurm.
