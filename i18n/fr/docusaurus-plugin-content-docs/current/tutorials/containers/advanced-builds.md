---
id: advanced-builds
title: Construction avancée d'images
sidebar_position: 4
sidebar_label: "Construction avancée"
---

# Construction avancée d'images

Ce tutoriel présente deux techniques qui deviennent utiles dès que l'on dépasse les Dockerfiles simples : les **constructions multi-étapes** (*multi-stage builds*) pour produire des images plus petites, et les **constructions multi-architectures** pour prendre en charge différentes architectures de processeur.

## Constructions multi-étapes {#multi-stage-builds}

### Le problème {#the-problem}

Quand vous construisez un conteneur qui compile du code ou installe des paquets depuis les sources, les outils de compilation (compilateurs, en-têtes, bibliothèques de développement) se retrouvent dans l'image finale alors qu'ils ne servent qu'à la construction. L'image grossit inutilement.

Reprenons l'exemple Monte-Carlo du tutoriel précédent. L'image de base `python:3.11-slim` pèse environ 125 Mo, mais l'ajout de `build-essential` pour compiler numpy la fait nettement grossir. Ces compilateurs ne servent à rien à l'exécution : ils occupent de l'espace disque et allongent le temps de récupération de l'image sur le cluster.

### Le principe {#the-concept}

Les constructions multi-étapes (apparues avec Docker 17.06) règlent ce problème en autorisant plusieurs instructions `FROM` dans un même Dockerfile. Chaque `FROM` démarre une nouvelle étape. Vous pouvez copier des éléments d'une étape précédente dans une étape suivante, en laissant les outils de compilation derrière vous.

```
┌──────────────────────┐       ┌──────────────────────┐
│    Stage 1: builder  │       │   Stage 2: runtime   │
│                      │       │                      │
│  Base: python:3.11   │       │  Base: python:3.11-  │
│  + build-essential   │ COPY  │        slim           │
│  + gfortran          │ ───>  │  + /opt/venv (from   │
│  + libopenblas-dev   │       │    builder stage)     │
│  + /opt/venv with    │       │  + app code           │
│    compiled packages │       │                      │
│                      │       │  No compilers!        │
│  Size: ~1.5 GB       │       │  Size: ~300 MB        │
└──────────────────────┘       └──────────────────────┘
```

L'instruction clé est `COPY --from=<stage>`, qui copie des fichiers depuis une étape nommée au lieu du contexte de construction.

### L'exemple {#the-example}

Reconstruisons notre simulation Monte-Carlo avec une approche multi-étapes. Nous ajoutons `scipy` aux dépendances pour avoir une quantité significative de code compilé à séparer.

Créez le projet :

```bash
$ mkdir ~/monte-carlo-multistage && cd ~/monte-carlo-multistage
```

Créez `requirements.txt` :

```
numpy==1.24.3
scipy==1.11.1
```

Créez `estimate_pi.py` (comme avant, mais en utilisant maintenant scipy pour les statistiques) :

```python
#!/usr/bin/env python3
"""Estimate Pi using Monte Carlo and scipy's statistical tools."""

import argparse
import numpy as np
from scipy import stats
import time
import json

def monte_carlo_pi(num_samples):
    """Estimate Pi via random sampling."""
    x = np.random.uniform(0, 1, num_samples)
    y = np.random.uniform(0, 1, num_samples)
    inside = np.sum(x**2 + y**2 <= 1)
    return 4 * inside / num_samples

def main():
    parser = argparse.ArgumentParser(description="Monte Carlo Pi estimation with statistics")
    parser.add_argument("samples", type=int, nargs="?", default=1_000_000)
    parser.add_argument("--trials", type=int, default=10,
                        help="Number of independent trials")
    parser.add_argument("--output", "-o", type=str, default=None)
    args = parser.parse_args()

    print(f"Running {args.trials} trials of {args.samples:,} samples each...")
    start = time.time()

    estimates = [monte_carlo_pi(args.samples) for _ in range(args.trials)]
    elapsed = time.time() - start

    mean = np.mean(estimates)
    ci = stats.t.interval(0.95, df=len(estimates)-1,
                          loc=mean, scale=stats.sem(estimates))

    print(f"  Mean estimate: {mean:.8f}")
    print(f"  95% CI:        [{ci[0]:.8f}, {ci[1]:.8f}]")
    print(f"  Actual Pi:     {np.pi:.8f}")
    print(f"  Total time:    {elapsed:.3f}s")

    if args.output:
        results = {
            "trials": args.trials,
            "samples_per_trial": args.samples,
            "mean": mean,
            "ci_lower": ci[0],
            "ci_upper": ci[1],
            "elapsed_seconds": elapsed,
        }
        with open(args.output, "w") as f:
            json.dump(results, f, indent=2)
        print(f"  Results written to {args.output}")

if __name__ == "__main__":
    main()
```

Créez maintenant un `Dockerfile` en deux étapes :

```dockerfile
# ---- Stage 1: Builder ----
# This stage installs compilers and builds all Python packages.
FROM python:3.11 AS builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        gfortran \
        libopenblas-dev \
    && rm -rf /var/lib/apt/lists/*

# Install packages into a virtual environment so we can copy it cleanly.
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# ---- Stage 2: Runtime ----
# This stage starts fresh and copies only the compiled packages.
FROM python:3.11-slim

# Install only the runtime libraries (no compilers, no headers).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libopenblas0 \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy the virtual environment from the builder stage.
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
COPY estimate_pi.py .
RUN chmod +x estimate_pi.py

CMD ["python", "estimate_pi.py"]
```

**Ce qui se passe :**

- **L'étape 1** (`AS builder`) part de l'image complète `python:3.11` (environ 1 Go), installe les compilateurs et les en-têtes de développement, crée un environnement virtuel et y compile numpy et scipy. Cette étape est un outil de construction : elle produit `/opt/venv` avec tous les paquets compilés.

- **L'étape 2** repart de zéro avec `python:3.11-slim` (environ 125 Mo). Elle installe uniquement les bibliothèques *d'exécution* (les fichiers `.so` partagés utilisés par numpy/scipy, sans en-têtes ni compilateurs). Puis `COPY --from=builder /opt/venv /opt/venv` récupère l'environnement virtuel compilé de l'étape 1 dans l'image propre.

Les compilateurs, les en-têtes de développement et tout le reste de l'étape 1 sont abandonnés. Ils existent pendant la construction mais pas dans l'image finale.

Construisez les deux versions et comparez :

```bash
# Multi-stage build
$ docker build -t monte-carlo-ms:0.1 .

# For comparison, build a single-stage version
$ cat > Dockerfile.single << 'EOF'
FROM python:3.11
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gfortran libopenblas-dev \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir numpy==1.24.3 scipy==1.11.1
WORKDIR /app
COPY estimate_pi.py .
CMD ["python", "estimate_pi.py"]
EOF

$ docker build -f Dockerfile.single -t monte-carlo-single:0.1 .

# Compare image sizes
$ docker images | grep monte-carlo
```

```
monte-carlo-single   0.1    ...   1.41GB
monte-carlo-ms       0.1    ...   327MB
```

L'image multi-étapes est environ **4 fois plus petite**, avec exactement les mêmes fonctionnalités.


Vérifiez que l'image multi-étapes fonctionne :

```bash
$ docker run --rm monte-carlo-ms:0.1 python estimate_pi.py 1000000 --trials 5
```

:::tip Déboguer les étapes de construction
Vous pouvez construire jusqu'à une étape donnée avec `--target` :
```bash
docker build --target builder -t monte-carlo-debug:0.1 .
docker run --rm -it monte-carlo-debug:0.1 /bin/bash
```
Vous obtenez un shell dans l'étape de construction pour inspecter ce qui a été installé, vérifier les chemins des bibliothèques et résoudre les problèmes de compilation.
:::

---

## Constructions multi-architectures {#multi-architecture-builds}

### Le problème {#the-problem-1}

Les images de conteneurs sont construites pour une architecture de processeur précise. Une image construite sur un portable Intel/AMD (linux/amd64) ne fonctionne pas sur un Mac ARM (linux/arm64), ni sur d'autres architectures présentes dans certains clusters HPC.

Si vous construisez sur un Mac Apple Silicon, l'image est par défaut en `linux/arm64`. Les nœuds de calcul de <Var name="clusterName" /> (processeurs AMD EPYC) sont en `linux/amd64` : une image `arm64` ne peut pas s'y exécuter (`exec format error`).

### Le principe {#the-concept-1}

Une construction multi-architectures crée un seul tag d'image contenant des variantes pour plusieurs architectures. Quand quelqu'un récupère l'image, Docker ou Charliecloud choisit automatiquement la variante adaptée à sa plateforme. C'est le rôle de `docker buildx`, qui utilise l'émulation QEMU pour construire pour d'autres architectures que celle de votre machine.

```
                     yourusername/monte-carlo:0.2
                              │
               ┌──────────────┼──────────────┐
               │              │              │
          linux/amd64    linux/arm64    linux/ppc64le
           (Intel)     (Apple M-series)   (POWER)
```

### Prérequis {#prerequisites}

- **Docker Desktop** (Mac/Windows) : inclut `buildx` et l'émulation QEMU d'origine.
- **Docker Engine sous Linux** : il peut être nécessaire d'installer QEMU séparément :
  ```bash
  $ docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
  ```

### L'exemple {#the-example-1}

Nous reprenons la même simulation Monte-Carlo et la construisons pour `linux/amd64` et `linux/arm64`.

Commencez par créer un nouveau constructeur (*builder*) capable de construire pour plusieurs plateformes :

```bash
# List existing builders
$ docker buildx ls

# Create a new builder with multi-platform support
$ docker buildx create --name multiplatform --bootstrap --use
```

Construisez d'abord pour une seule plateforme, pour tester :

```bash
$ cd ~/monte-carlo-multistage

# Build for amd64 only and load into local Docker
$ docker buildx build --platform linux/amd64 -t monte-carlo-ms:0.2-amd64 --load .

# Verify the architecture
$ docker inspect monte-carlo-ms:0.2-amd64 | grep Architecture
```

```json
"Architecture": "amd64"
```

Une fois la construction mono-plateforme validée, construisez pour plusieurs architectures. Les images multi-architectures **doivent être poussées directement vers un registre** : elles ne peuvent pas être chargées dans le Docker local, qui ne gère qu'une architecture à la fois :

```bash
$ docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t yourusername/monte-carlo:0.2 \
    --push \
    .
```

Le Dockerfile est construit deux fois — une fois en `linux/amd64`, une fois en `linux/arm64` (avec émulation QEMU pour l'architecture non native). Les deux images sont poussées sur Docker Hub sous le même tag. Quand quelqu'un récupère `yourusername/monte-carlo:0.2`, Docker choisit automatiquement la variante correspondant à sa plateforme.

Vérifiez le manifeste :

```bash
$ docker buildx imagetools inspect yourusername/monte-carlo:0.2
```

La commande affiche les plateformes disponibles pour ce tag.

### Points d'attention {#considerations}

**Durée de construction :** construire pour une architecture non native est plus lent, car cela passe par l'émulation QEMU. Une construction de 2 minutes en natif peut en prendre 10 à 15 en émulation.

**Image de base :** votre image de base doit exister pour toutes les architectures visées. La plupart des images officielles (`python`, `ubuntu`, `alpine`) existent en `amd64` et en `arm64`. Vérifiez les architectures disponibles sur la page de l'image sur Docker Hub.

**Charliecloud sur IGH HPC :** quand vous récupérez une image multi-architectures avec `ch-image`, il choisit la variante correspondant au matériel du nœud (`linux/amd64`). Comme toujours, faites-le dans un job, pas sur le nœud de connexion (voir [Conteneurs sur les clusters HPC](containers-hpc.md#pulling-an-image)) :

```bash
module load charliecloud/0.44
ch-image pull yourusername/monte-carlo:0.2       # pulls the linux/amd64 variant
```

### Automatiser avec GitHub Actions {#automating-with-github-actions}

Pour un usage régulier, vous pouvez automatiser les constructions multi-architectures avec GitHub Actions : chaque publication dans votre dépôt construit et pousse les images pour toutes les plateformes :

```yaml
name: Build and Push Container

on:
  push:
    tags:
      - "v*"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-qemu-action@v3

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/monte-carlo:${{ github.ref_name }}
```

Ce workflow se déclenche sur les tags de version (par ex. `git tag v0.3 && git push --tags`). Il installe QEMU et buildx, se connecte à Docker Hub avec des secrets stockés dans le dépôt, puis construit et pousse l'image pour les deux architectures.

Enregistrez vos identifiants Docker Hub comme secrets du dépôt GitHub (`DOCKERHUB_USERNAME` et `DOCKERHUB_TOKEN`) dans **Settings > Secrets and variables > Actions**.

---

**Voir aussi :** [Conteneurs sur les clusters HPC](containers-hpc.md) — exécuter vos images sur <Var name="clusterName" /> avec Charliecloud et Slurm.

**Références :** [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/) | [Docker Buildx](https://docs.docker.com/build/building/multi-platform/) | [QEMU User Emulation](https://github.com/multiarch/qemu-user-static)
