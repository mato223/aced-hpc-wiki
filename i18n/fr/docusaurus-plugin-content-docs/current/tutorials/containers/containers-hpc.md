---
id: containers-hpc
title: Conteneurs sur les clusters HPC
sidebar_label: "Conteneurs sur les clusters HPC"
sidebar_position: 3
---

# Conteneurs sur les clusters HPC

Ce tutoriel montre comment exécuter des conteneurs sur <Var name="clusterName" /> avec **Charliecloud** et Slurm : récupérer des images Docker, les convertir en images-dossiers, les exécuter dans des jobs batch, accéder aux données de votre projet et lancer des programmes MPI dans des conteneurs.

:::info Moteur de conteneurs disponible
- **Charliecloud 0.44** est disponible : `module load charliecloud/0.44`.
- **Apptainer (Singularity) : pas encore disponible.**
- Le cluster n'a pas de GPU : les conteneurs GPU ne s'appliquent pas.
:::

:::warning Rien de lourd sur le nœud de connexion
Récupérez, convertissez et exécutez les conteneurs **dans un job** sur un nœud de calcul (`srun` pour le travail interactif, `sbatch` pour les jobs batch). Jamais sur le nœud de connexion <Var name="loginHost" code />. Voir [Bon usage du nœud de connexion](../../good-conduct/login-nodes.md).
:::

## Différences entre Charliecloud et Docker {#how-charliecloud-differs-from-docker}

Si vous avez suivi les tutoriels précédents, vous avez utilisé Docker sur votre poste. Charliecloud fonctionne différemment sur quelques points importants :

| | Docker | Charliecloud |
|-|--------|--------------|
| **Privilèges** | Nécessite les droits root (administrateur) | S'exécute avec votre utilisateur normal |
| **Format d'image** | Images en couches gérées par un démon | Un simple dossier (un dossier par image) |
| **Commandes principales** | `docker pull`, `docker run` | `ch-image pull`, `ch-convert`, `ch-run` |
| **Montage de dossiers** | Explicite, avec `-v` | Votre home et `/tmp` automatiquement ; les autres avec `-b` |
| **Identité** | Root dans le conteneur par défaut | *Vous* — même utilisateur, mêmes droits |
| **Où construire** | Sur votre poste | Récupérer des images toutes prêtes (construites sur votre poste) |

L'idée clé : vous **construisez** les images avec Docker sur votre poste, puis vous les **exécutez** avec Charliecloud sur le cluster.

## Les bases de Charliecloud {#introduction-to-charliecloud}

### Charger le module {#loading-the-module}

Ouvrez un job interactif sur un nœud de calcul, puis chargez Charliecloud :

```bash
# Interactive job on a compute node
srun --account=malaria --qos=debug --cpus-per-task=2 --mem=8G --time=01:00:00 --pty bash

# Load Charliecloud
module load charliecloud/0.44

# Check
ch-run --version
```

### Où sont stockées les images {#where-images-are-stored}

Charliecloud utilise deux emplacements :

- **Le cache de téléchargement** de `ch-image` (par défaut `/var/tmp/$USER.ch` sur le nœud). Les nœuds de calcul sont « stateless » : `/var/tmp` est en mémoire sur le nœud et ne se retrouve pas sur un autre nœud. Considérez-le comme temporaire et videz-le après avoir converti votre image.
- **Vos images-dossiers**, créées avec `ch-convert`. Gardez-les dans votre scratch, par exemple `/scratch/malaria/$USER/images/`. Les fichiers du scratch non utilisés depuis <Var name="scratchPurgeDays" /> jours sont supprimés, mais une image peut toujours être récupérée à nouveau depuis son registre.

```bash
mkdir -p /scratch/malaria/$USER/images
```

Ne gardez pas d'images dans votre home, et ne stockez pas de copies d'images publiques dans le dossier du projet.

### Récupérer une image {#pulling-an-image}

Récupérez l'image Monte-Carlo construite dans le tutoriel précédent, puis convertissez-la en image-dossier :

```bash
# Download the image into the ch-image cache
ch-image pull yourusername/monte-carlo:0.1

# Convert it to a directory image in your scratch
ch-convert yourusername/monte-carlo:0.1 /scratch/malaria/$USER/images/monte-carlo-0.1

# Free the cache on the node (it uses the node's memory)
ch-image reset
```

Le dossier `/scratch/malaria/$USER/images/monte-carlo-0.1` contient maintenant tout le système de fichiers du conteneur. Vous pouvez le réutiliser dans tous vos jobs.

:::caution À confirmer
On ne sait pas encore si les nœuds de calcul peuvent accéder à Docker Hub et aux autres registres. Si `ch-image pull` échoue avec une erreur réseau, utilisez la méthode ci-dessous.
:::

### Importer une image sans accès Internet {#importing-an-image-without-internet-access}

Vous pouvez aussi exporter l'image sur votre poste, copier le fichier sur le cluster et l'y convertir. Sur votre poste :

```bash
docker create --name mc-export monte-carlo:0.1
docker export mc-export | gzip > monte-carlo-0.1.tar.gz
docker rm mc-export
```

Copiez `monte-carlo-0.1.tar.gz` dans votre scratch (voir [Transferts de fichiers](../../good-conduct/file-transfers.md)), puis, dans un job sur le cluster :

```bash
module load charliecloud/0.44
ch-convert /scratch/malaria/$USER/monte-carlo-0.1.tar.gz /scratch/malaria/$USER/images/monte-carlo-0.1
```

`docker export` produit un système de fichiers « aplati », ce qu'attend `ch-convert` (`docker save` ne fonctionne **pas**). Une image exportée ne conserve pas les réglages `ENV` du Dockerfile : indiquez le chemin complet des programmes ou définissez les variables avec `--set-env=VAR=VALUE`.

### Exécuter un conteneur {#running-containers}

`ch-run` exécute une commande dans une image-dossier. Tout ce qui suit `--` constitue la commande :

```bash
IMG=/scratch/malaria/$USER/images/monte-carlo-0.1

# Run the Monte Carlo simulation
ch-run --set-env "$IMG" -- python /app/estimate_pi.py 5000000

# Check the Python version inside the container
ch-run "$IMG" -- python --version

# Open a shell inside the container
ch-run "$IMG" -- /bin/bash
```

- `--set-env` (sans valeur) applique les variables d'environnement définies dans l'image (les lignes `ENV` du Dockerfile).
- Contrairement à Docker, `ch-run` n'exécute pas la commande par défaut de l'image (`CMD`) : indiquez toujours la commande.
- Dans le conteneur, vous restez *vous-même* : même utilisateur, mêmes droits. Votre home est accessible dans `/home/$USER`.
- L'image est en lecture seule. Écrivez vos résultats dans un dossier monté (voir ci-dessous), pas dans l'image.

### Accéder aux données de votre projet {#accessing-project-data}

Seuls votre home et `/tmp` sont montés automatiquement. Pour utiliser `/projects`, `/scratch` ou `/references` dans le conteneur, montez-les avec `-b`. Le point de montage doit exister dans l'image ; avec une image-dossier, il suffit de le créer une fois :

```bash
IMG=/scratch/malaria/$USER/images/monte-carlo-0.1
mkdir -p "$IMG/projects" "$IMG/scratch" "$IMG/references"

ch-run -b /projects -b /scratch -b /references --set-env "$IMG" -- \
    python /app/estimate_pi.py 5000000 --output /projects/malaria/results/$USER/pi.json
```

Les chemins sont alors identiques dans et hors du conteneur, et vos droits habituels s'appliquent. Les fichiers que vous créez dans le projet appartiennent toujours au projet.

### Sessions interactives avec srun {#interactive-shell-sessions-with-srun}

Pour explorer un conteneur, tester des commandes ou déboguer un job qui échoue, ouvrez un job interactif sur un nœud de calcul, puis un shell dans le conteneur :

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

## Jobs batch Slurm {#slurm-batch-jobs}

Pour le vrai travail, écrivez un script batch qui demande les ressources et lance le conteneur, puis soumettez-le avec `sbatch`.

### Exemple : job batch Monte-Carlo {#the-example-monte-carlo-batch-job}

Créez `monte-carlo.slurm` :

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

Points clés :

- **`--account=malaria`** impute le job à votre projet ; **`--mem`**, **`--time`** et **`--cpus-per-task`** doivent toujours être indiqués.
- **`module load charliecloud/0.44`** doit figurer dans le script : les modules de votre session interactive ne sont pas hérités de façon fiable.
- **`-b /projects`** rend le dossier du projet visible dans le conteneur (le point de montage a été créé dans l'image, voir [Accéder aux données de votre projet](#accessing-project-data)).
- **`OMP_NUM_THREADS=$SLURM_CPUS_PER_TASK`** fait utiliser aux bibliothèques multithreadées exactement les CPU réservés. Pour un outil qui a une option de threads, passez-lui `$SLURM_CPUS_PER_TASK` (par exemple `-t $SLURM_CPUS_PER_TASK`).

Soumettre et suivre :

```bash
sbatch monte-carlo.slurm
squeue --me
seff <jobid>
```

## Conteneurs MPI {#mpi-containers}

MPI (Message Passing Interface) exécute un même programme sur plusieurs processus, éventuellement sur plusieurs nœuds. Les conteneurs MPI demandent de l'attention : la bibliothèque MPI du conteneur doit être compatible avec celle de l'hôte.

### Le principe {#the-concept}

L'approche habituelle est le **modèle hybride** : le conteneur contient une bibliothèque MPI, et c'est le lanceur MPI de l'*hôte* qui démarre les processus. L'hôte gère le placement des processus et le réseau ; le conteneur fournit l'environnement de l'application.

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

La version de MPI du conteneur doit être compatible avec celle de l'hôte : sur <Var name="clusterName" />, l'hôte fournit `openmpi4/4.1.6` (`module load gnu12 openmpi4`), utilisez donc OpenMPI 4.x dans le conteneur.

:::caution À confirmer
L'exécution de programmes MPI multi-nœuds dans des conteneurs Charliecloud n'a pas encore été validée sur <Var name="clusterName" />. Testez d'abord sur un petit cas, et contactez le support si les processus ne démarrent pas ou ne communiquent pas.
:::

### Exemple : estimation de Pi en parallèle {#the-example-parallel-pi-estimation}

Chaque processus MPI estime Pi avec une partie des tirages, puis les résultats sont combinés. Sur votre poste, créez le projet :

```bash
mkdir ~/monte-carlo-mpi && cd ~/monte-carlo-mpi
```

Créez `estimate_pi_mpi.py` :

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

Créez le `Dockerfile` (Ubuntu 22.04 fournit OpenMPI 4.1) :

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

Construisez et poussez l'image :

```bash
docker build --platform linux/amd64 -t yourusername/monte-carlo-mpi:0.1 .
docker push yourusername/monte-carlo-mpi:0.1
```

Testez-la localement avec Docker avant de passer au cluster :

```bash
# Single process
$ docker run --rm yourusername/monte-carlo-mpi:0.1 \
    mpirun -n 1 python3 /app/estimate_pi_mpi.py 5000000

# Two processes (if Docker has access to multiple cores)
$ docker run --rm yourusername/monte-carlo-mpi:0.1 \
    mpirun -n 2 python3 /app/estimate_pi_mpi.py 5000000
```

Sur le cluster, récupérez et convertissez l'image dans un job (voir [Récupérer une image](#pulling-an-image)) vers `/scratch/malaria/$USER/images/monte-carlo-mpi-0.1`, puis créez `mpi-pi.slurm` :

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

Soumettez-le avec `sbatch mpi-pi.slurm`. Dans le fichier de sortie, chaque rang indique son nom d'hôte : les rangs d'un même nœud partagent un nom, ceux de nœuds différents (`acegid-cpu-01`, `acegid-cpu-02`…) en affichent des différents. Cela confirme que MPI communique entre les nœuds.

## Conteneurs pour les outils de bio-informatique {#bioinformatics-containers}

[BioContainers](https://biocontainers.pro/) publie sur `quay.io` des images prêtes à l'emploi pour la plupart des outils bioconda. Choisissez le tag exact sur la page de l'outil, puis récupérez et convertissez l'image dans un job :

```bash
module load charliecloud/0.44
ch-image pull quay.io/biocontainers/samtools:<tag>
ch-convert quay.io/biocontainers/samtools:<tag> /scratch/malaria/$USER/images/samtools-<tag>
ch-image reset
```

Pour beaucoup d'outils de bio-informatique, un environnement conda est plus simple : voir [Installations personnalisées](../../software/custom-install.md#conda-environments).

:::info Pas encore disponibles
**Apptainer/Singularity** et **Nextflow** ne sont pas encore disponibles sur le cluster. Les flux de travail qui en dépendent ne peuvent pas tourner tels quels. Pour les demander, ouvrez un ticket sur <Var name="supportPortal" link />.
:::

## Dépannage {#troubleshooting}

| Problème | Cause | Solution |
|----------|-------|----------|
| `ch-run: command not found` | Module non chargé | Ajoutez `module load charliecloud/0.44` (aussi dans le script de job) |
| `command not found` dans le conteneur | Programme absent du `PATH` du conteneur | Ajoutez `--set-env`, ou utilisez le chemin complet (`ch-run "$IMG" -- which python`) |
| Échec du montage (`can't mkdir`, `No such file`) | Point de montage absent de l'image | `mkdir -p "$IMG/projects"` (et les autres), voir [Accéder aux données de votre projet](#accessing-project-data) |
| `Read-only file system` | Écriture dans l'image | Écrivez dans un dossier monté (`/projects/...`, `/scratch/...`) ou dans votre home |
| `ch-image pull` n'arrive pas à se connecter | Pas d'accès au registre | Voir [Importer une image sans accès Internet](#importing-an-image-without-internet-access) |
| `exec format error` | Image construite pour ARM (Mac Apple Silicon) | Reconstruisez avec `--platform linux/amd64`, voir [Construction avancée](advanced-builds.md#multi-architecture-builds) |
| Tous les processus MPI sur le même nœud | Lanceur de l'hôte non utilisé | Utilisez `mpirun -np $SLURM_NTASKS ch-run ...`, pas `ch-run ... mpirun` |
| L'environnement de l'hôte interfère | `PATH` ou variables Python de l'hôte | Retirez-les avec `--unset-env=PYTHONPATH` (ou un autre nom de variable) |

## Aide-mémoire {#quick-reference}

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

**Voir aussi :** [Les bases de Slurm](../running-jobs/slurm-basics.md) | [Écrire des scripts de job](../running-jobs/job-scripts.md) | [Documentation Charliecloud](https://charliecloud.io/)

**Suite :** [Construction avancée](advanced-builds.md) — réduire la taille des images avec les constructions multi-étapes et prendre en charge plusieurs architectures de processeur.
