---
id: containerize-code
title: Conteneuriser votre code
sidebar_position: 2
sidebar_label: "Conteneuriser votre code"
---

# Conteneuriser votre code

Dans ce tutoriel, vous allez écrire un Dockerfile, construire une image de conteneur, la tester localement et la pousser sur Docker Hub pour l'utiliser sur <Var name="clusterName" />. Nous suivons un seul exemple du début à la fin.

## Qu'est-ce qu'un Dockerfile ? {#what-is-a-dockerfile}

Un Dockerfile est un fichier texte qui contient une suite d'instructions pour construire une image de conteneur. Chaque instruction crée une **couche** (*layer*) de l'image. Docker lit le Dockerfile de haut en bas, exécute chaque instruction dans l'ordre, et le résultat est une image exécutable partout.

Voici les instructions principales :

| Instruction | Rôle |
|-------------|------|
| `FROM` | Définit l'image de base — votre point de départ |
| `RUN` | Exécute une commande pendant la construction (installer des paquets, compiler du code, etc.) |
| `COPY` | Copie des fichiers de votre machine dans l'image |
| `ENV` | Définit une variable d'environnement conservée à l'exécution du conteneur |
| `WORKDIR` | Définit le dossier de travail pour les instructions suivantes |
| `CMD` | Définit la commande par défaut au démarrage du conteneur |
| `ENTRYPOINT` | Configure le conteneur pour qu'il s'exécute comme un programme |

Voyons comment elles s'articulent en pratique.

## L'exemple : une simulation de Monte-Carlo {#the-example-a-monte-carlo-simulation}

Nous allons conteneuriser un script Python qui estime la valeur de Pi par une méthode de Monte-Carlo. C'est une technique de calcul classique : on tire des points au hasard dans un carré, on compte ceux qui tombent dans un cercle, et le rapport permet d'estimer Pi.

### Préparer le projet {#project-setup}

Sur votre poste (où Docker est installé), créez un dossier de projet :

```bash
$ mkdir ~/monte-carlo && cd ~/monte-carlo
```

### Le code de l'application {#the-application-code}

Créez un fichier `estimate_pi.py` :

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

Testez-le localement pour vérifier qu'il fonctionne :

```bash
$ python estimate_pi.py 100000
```

### Le fichier de dépendances {#the-requirements-file}

Créez `requirements.txt` avec des versions figées, pour la reproductibilité :

```
numpy==1.24.3
```

:::tip Pourquoi figer les versions ?
Écrire `numpy==1.24.3` plutôt que `numpy` garantit que toute personne qui construit ce conteneur — aujourd'hui ou dans six mois — obtient exactement la même version. Sans cela, `pip install numpy` installe la dernière version disponible au moment de la construction, ce qui peut casser votre code si l'API change.
:::

### Écrire le Dockerfile {#writing-the-dockerfile}

Traduisons maintenant les étapes d'installation en Dockerfile. Créez un fichier nommé `Dockerfile` (sans extension) :

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

Détaillons chaque instruction :

**`FROM python:3.11-slim`** — On part de l'image officielle Python 3.11, variante `-slim` débarrassée des compilateurs et de la documentation inutiles : environ 125 Mo au lieu d'environ 1 Go pour l'image complète. Évitez `python:latest` : le sens de « latest » change avec le temps, ce qui rend vos constructions non reproductibles.

**`RUN apt-get update && apt-get install ...`** — Installe les outils de compilation système dont numpy a besoin. L'option `--no-install-recommends` évite les paquets optionnels, et `rm -rf /var/lib/apt/lists/*` vide le cache des paquets. Tout est regroupé dans une seule instruction `RUN` car chaque `RUN` crée une nouvelle couche : les regrouper garde l'image plus petite.

**`COPY requirements.txt ...` puis `RUN pip install ...`** — On copie le fichier de dépendances *avant* le code de l'application. C'est volontaire : Docker met chaque couche en cache et ne la reconstruit que si ses entrées changent. Si vous modifiez `estimate_pi.py` sans toucher `requirements.txt`, Docker réutilise la couche pip en cache au lieu de tout réinstaller. Cela peut faire gagner plusieurs minutes à chaque reconstruction.

**`COPY estimate_pi.py ...` puis `RUN chmod +x ...`** — Copie le code de l'application et le rend exécutable.

**`ENV PATH="/app:$PATH"`** — Ajoute `/app` au PATH pour pouvoir lancer `estimate_pi.py` sans indiquer son chemin complet.

**`WORKDIR /app`** — Définit le dossier de travail. Les commandes suivantes (et la commande par défaut au démarrage du conteneur) s'exécutent depuis ce dossier.

**`CMD ["python", "estimate_pi.py"]`** — La commande par défaut, exécutée quand vous lancez le conteneur sans préciser de commande. Vous pouvez la remplacer en ajoutant une autre commande au lancement.

### Construire l'image {#building-the-image}

Depuis le dossier `~/monte-carlo` (où se trouve votre Dockerfile), lancez :

```bash
$ docker build --platform linux/amd64 -t monte-carlo:0.1 .
```

- `--platform linux/amd64` construit l'image pour Linux 64 bits Intel/AMD, l'architecture des nœuds du cluster. C'est important si votre poste est un Mac Apple Silicon (voir [Construction avancée](advanced-builds.md#multi-architecture-builds)).
- `-t monte-carlo:0.1` donne un nom et une version (tag) à l'image.
- `.` indique à Docker d'utiliser le dossier courant comme contexte de construction (il y cherche un fichier nommé `Dockerfile`).

Docker affiche chaque étape du Dockerfile au fur et à mesure. Les constructions suivantes sont bien plus rapides grâce au cache des couches : Docker saute les couches inchangées.

Vérifiez que l'image a été créée :

```bash
$ docker images monte-carlo
```

```
REPOSITORY    TAG    IMAGE ID       CREATED          SIZE
monte-carlo   0.1    a1b2c3d4e5f6   30 seconds ago   198MB
```

### Tester le conteneur {#testing-the-container}

Lancez le conteneur avec sa commande par défaut :

```bash
$ docker run --rm monte-carlo:0.1
```

L'option `--rm` supprime le conteneur à la fin de son exécution (sinon les conteneurs arrêtés s'accumulent). Vous devez obtenir une sortie de ce type :

```
Estimating Pi with 1,000,000 samples...
  Estimate: 3.14132400
  Actual:   3.14159265
  Error:    0.00026865
  Time:     0.024s
```

Remplacez la commande par défaut pour passer des arguments :

```bash
$ docker run --rm monte-carlo:0.1 python estimate_pi.py 10000000 --seed 42
```

Écrivez le résultat dans un fichier grâce à un **montage** (*bind mount*) : un dossier de votre machine est rendu visible dans le conteneur, et les données restent après l'arrêt du conteneur :

```bash
$ mkdir -p ~/monte-carlo/output

$ docker run --rm \
    -v ~/monte-carlo/output:/output \
    monte-carlo:0.1 \
    python estimate_pi.py 5000000 --output /output/results.json

$ cat ~/monte-carlo/output/results.json
```

Ouvrez un shell interactif dans le conteneur pour l'explorer :

```bash
$ docker run --rm -it monte-carlo:0.1 /bin/bash
```

Depuis le conteneur, vous pouvez lancer `python`, lister les paquets installés avec `pip list`, explorer le système de fichiers, etc. Tapez `exit` pour sortir.

### Utiliser .dockerignore {#using-dockerignore}

Lors de la construction, Docker envoie tout le contexte (le dossier `.`) au démon Docker. Si votre dossier contient de gros fichiers de données, l'historique `.git` ou des fichiers de sortie, ils sont copiés inutilement et ralentissent la construction.

Créez un fichier `.dockerignore` pour les exclure :

```
.git
__pycache__
*.pyc
output/
*.log
```

Il fonctionne exactement comme `.gitignore` : les fichiers correspondants sont exclus du contexte de construction.

### Pousser l'image vers un registre {#pushing-to-a-container-registry}

Votre image n'existe que sur votre poste. Pour l'utiliser sur <Var name="clusterName" />, poussez-la vers un registre de conteneurs (ou exportez-la dans un fichier, voir [Importer une image sans accès Internet](containers-hpc.md#importing-an-image-without-internet-access)).

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

Ouvrez [Docker Hub](https://hub.docker.com/repositories) dans votre navigateur et allez dans vos dépôts : `yourusername/monte-carlo` apparaît avec le tag `0.1`.

Vous pouvez aussi utiliser le GitHub Container Registry (GHCR).

### GitHub Container Registry {#github-container-registry}

```bash
# Log in using a personal access token
$ echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag for GHCR
$ docker tag monte-carlo:0.1 ghcr.io/yourusername/monte-carlo:0.1

# Push
$ docker push ghcr.io/yourusername/monte-carlo:0.1
```

:::warning Pas de secrets ni de données dans les images
Une image publique peut être téléchargée par n'importe qui. Ne copiez jamais de mots de passe, de jetons ou de données de recherche (données de séquençage, informations de patients) dans une image. Laissez les données dans le dossier de votre projet et montez-les à l'exécution du conteneur.
:::

### L'exécuter sur IGH HPC {#running-it-on-igh-hpc}

Sur le cluster, Charliecloud récupère l'image et la convertit en dossier que `ch-run` peut exécuter. Faites-le dans un job, jamais sur le nœud de connexion. Voici un script de job complet pour le conteneur Monte-Carlo :

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

Soumettez-le avec :

```bash
$ sbatch monte-carlo.sh
```

Le flux complet (images-dossiers, montages, MPI) est détaillé dans [Conteneurs sur les clusters HPC](containers-hpc.md).

---
**Suite :** [Conteneurs sur les clusters HPC](containers-hpc.md) — exécuter vos images sur <Var name="clusterName" /> avec Charliecloud et Slurm.
