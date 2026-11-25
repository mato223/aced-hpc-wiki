---
id: intro
title: Introduction aux conteneurs
sidebar_label: "Bienvenue dans les conteneurs"
sidebar_position: 1
---

# Introduction aux conteneurs

## Qu'est-ce qu'un conteneur ? {#what-is-a-container}

Un conteneur est un paquet léger et portable qui regroupe une application et tout ce dont elle a besoin pour fonctionner — bibliothèques, outils, paquets système et configuration — en une seule unité qui se comporte de la même façon sur n'importe quelle machine.

Sans conteneur, faire fonctionner un logiciel sur une nouvelle machine implique d'installer la bonne version de chaque dépendance en espérant qu'aucune n'entre en conflit avec ce qui est déjà installé. Avec un conteneur, vous empaquetez l'environnement une fois et l'exécutez partout.

```
┌─────────────────────────────────────┐
│         Your Container              │
│  ┌───────────────────────────────┐  │
│  │     Your Application          │  │
│  │  ┌─────────┐ ┌─────────┐      │  │
│  │  │ Python  │ │ NumPy   │      │  │
│  │  │ 3.11    │ │ 1.24    │ ...  │  │
│  │  └─────────┘ └─────────┘      │  │
│  └───────────────────────────────┘  │
│       Operating System Layer        │
│         (Ubuntu 22.04)              │
└─────────────────────────────────────┘
       Runs the same everywhere:
       laptop, cloud, HPC cluster
```

Une **image** de conteneur est un modèle en lecture seule. Quand vous exécutez une image, vous créez un **conteneur**, une instance vivante de ce modèle. Vous pouvez lancer plusieurs conteneurs à partir de la même image, chacun isolé des autres.

:::info Pourquoi s'y intéresser ?
Si vous avez déjà dit « ça marche sur ma machine » avant de passer des heures à le faire marcher sur le cluster, les conteneurs règlent ce problème. L'environnement qui fonctionne sur votre portable est le même que celui qui tourne sur <Var name="clusterName" />.
:::

## Conteneurs et machines virtuelles {#containers-vs-virtual-machines}

Machines virtuelles (VM) et conteneurs isolent tous deux les applications, mais différemment :

- Une **machine virtuelle** embarque tout un système d'exploitation invité au-dessus d'un hyperviseur. Les VM sont lourdes (plusieurs gigaoctets), lentes à démarrer (minutes) et gourmandes en ressources.
- Un **conteneur** partage le noyau de l'hôte et n'embarque que l'application et ses dépendances. Les conteneurs sont légers (mégaoctets), démarrent en quelques secondes et sont presque aussi rapides qu'un logiciel natif.

Pour le calcul HPC, le surcoût d'un conteneur est négligeable par rapport à une exécution directe sur l'hôte.

## Docker et Charliecloud {#docker-and-charliecloud}

Deux outils comptent pour cette série de tutoriels.

### Docker {#docker}

[Docker](https://www.docker.com/) est la référence pour construire et distribuer des images de conteneurs. Il offre :

- une syntaxe de construction simple (le **Dockerfile**)
- un immense catalogue d'images prêtes à l'emploi sur [Docker Hub](https://hub.docker.com/)
- de bons outils pour les développeurs

Docker nécessite les droits administrateur (root) : il **ne peut pas être utilisé sur le cluster**. Utilisez-le sur votre propre poste pour construire vos images.

### Charliecloud {#charliecloud}

[Charliecloud](https://charliecloud.io/) est un moteur de conteneurs conçu pour les centres HPC. Sur <Var name="clusterName" />, c'est le moteur disponible (module `charliecloud/0.44`) :

- **S'exécute avec votre utilisateur normal** : pas besoin de root
- **Fonctionne dans les jobs Slurm** : un conteneur se lance comme n'importe quel programme dans un script de job
- **Utilise les images Docker** : récupérez une image sur Docker Hub (ou importez-en une exportée depuis Docker) et exécutez-la
- **Performances quasi natives** : très peu de surcoût

:::info Apptainer : pas encore disponible
Apptainer (anciennement Singularity) n'est **pas encore disponible** sur <Var name="clusterName" />. Utilisez Charliecloud. Si votre flux de travail dépend d'Apptainer, contactez le support : <Var name="supportPortal" link />.
:::

## Le flux de travail des conteneurs sur IGH HPC {#the-container-workflow-on-igh-hpc}

```
  Your workstation (Docker)              IGH HPC (Charliecloud + Slurm)
 ┌──────────────────────────┐          ┌──────────────────────────────┐
 │ 1. Write a Dockerfile    │          │ 4. Pull the image (in a job) │
 │ 2. Build the image       │  ──────> │ 5. Convert it to a directory │
 │ 3. Push it to a registry │          │ 6. Run it with ch-run        │
 └──────────────────────────┘          └──────────────────────────────┘
                    │
              Docker Hub or
              GitHub Container
              Registry
```

1. **Écrire** un Dockerfile décrivant votre environnement logiciel
2. **Construire** l'image sur votre poste (où Docker est installé)
3. **Pousser** l'image vers un registre (Docker Hub, GitHub Container Registry)
4. **Récupérer** l'image sur le cluster avec `ch-image pull`, dans un job
5. **Convertir** l'image en dossier dans votre scratch avec `ch-convert`
6. **Exécuter** votre application avec `ch-run` dans un script de job Slurm

:::warning Rien de lourd sur le nœud de connexion
Récupérer, convertir et exécuter des conteneurs consomme du CPU, de la mémoire et du disque. Faites-le dans un job sur un nœud de calcul (`srun` interactif ou `sbatch`), jamais sur le nœud de connexion <Var name="loginHost" code />.
:::

## Démarrage rapide : votre premier conteneur {#quick-start-run-your-first-container}

Connectez-vous au cluster, ouvrez un job interactif sur un nœud de calcul, puis :

```bash
# Job interactif sur un nœud de calcul
srun --account=malaria --qos=debug --cpus-per-task=2 --mem=4G --time=00:30:00 --pty bash

# Charger Charliecloud
module load charliecloud/0.44

# Récupérer une image Python sur Docker Hub
ch-image pull python:3.11-slim

# La convertir en image-dossier dans votre scratch
mkdir -p /scratch/malaria/$USER/images
ch-convert python:3.11-slim /scratch/malaria/$USER/images/python-3.11-slim

# Exécuter Python dans le conteneur
ch-run /scratch/malaria/$USER/images/python-3.11-slim -- python3 -c "
import sys, os
print('Hello from inside a container!')
print(f'Python version: {sys.version}')
print(f'User: {os.environ.get(\"USER\", \"unknown\")}')
print(f'Hostname: {os.uname().nodename}')
"
```

Remarquez deux choses : vous n'avez pas installé Python — il vient du conteneur — et vous restez *vous-même* dans le conteneur (même utilisateur, votre home est accessible).

:::caution À confirmer
On ne sait pas encore si les nœuds de calcul peuvent télécharger des images directement depuis Docker Hub. Si `ch-image pull` n'atteint pas le registre, utilisez la méthode hors ligne décrite dans [Conteneurs sur les clusters HPC](containers-hpc.md#importing-an-image-without-internet-access).
:::

## Prérequis {#prerequisites}

Pour suivre ces tutoriels, il vous faut :

- **Des bases de la ligne de commande Linux** : naviguer dans les dossiers, éditer des fichiers, lancer des commandes (voir [Introduction à Linux](../linux-basics/intro.md))
- **Un langage de programmation** : les exemples utilisent Python, mais les concepts valent pour tout langage

Pour construire des conteneurs (section suivante), il vous faut aussi, sur votre propre poste :

- [Docker Desktop](https://docs.docker.com/get-docker/)
- un compte [Docker Hub](https://hub.docker.com/signup) gratuit

## Plan des tutoriels {#tutorial-roadmap}

| Section | Ce que vous apprendrez |
|---------|------------------------|
| [Conteneuriser votre code](containerize-code.md) | Écrire un Dockerfile, construire une image, la pousser vers un registre |
| [Conteneurs sur les clusters HPC](containers-hpc.md) | Charliecloud sur <Var name="clusterName" />, scripts de job Slurm, conteneurs MPI |
| [Construction avancée](advanced-builds.md) | Constructions multi-étapes et multi-architectures |

## Références {#references}

- [Documentation Charliecloud](https://charliecloud.io/)
- [Documentation Docker](https://docs.docker.com/)
- [Docker Hub](https://hub.docker.com/) — registre public d'images de conteneurs
- [BioContainers](https://biocontainers.pro/) — conteneurs prêts à l'emploi pour les outils de bio-informatique
