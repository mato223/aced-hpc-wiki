---
id: overview
title: Présentation des tutoriels
sidebar_label: "Présentation des tutoriels"
sidebar_position: 1
---

# Tutoriels du HPC IGH

Ces guides pratiques vous accompagnent de votre première connexion jusqu'à l'exécution de jobs bien dimensionnés sur le cluster HPC de l'IGH. Si vous débutez en HPC, suivez-les dans l'ordre.

Avant de commencer, vérifiez que vous avez un compte et que vous êtes membre d'au moins un projet : voir [Comptes](../getting-started/accounts.md) et [Projets, sous-projets et rôles](../getting-started/projects.md). Chaque job s'exécute sur le compte Slurm d'un projet et travaille dans les dossiers du projet.

---

## Bases de Linux {#linux-basics}

Le cluster fonctionne sous Linux et s'utilise depuis un terminal texte. Il n'y a pas de bureau graphique.

### Introduction à Linux {#introduction-to-linux}

[Introduction à Linux pour les utilisateurs du HPC](linux-basics/intro.md) s'adresse aux chercheurs habitués à Windows ou macOS. Au programme :

- l'invite de commande et vos premières commandes ;
- les espaces de stockage de l'IGH : `$HOME`, `/projects/malaria`, `/scratch/malaria/<login>` et `/references` ;
- se déplacer, créer, copier et supprimer des fichiers et des dossiers ;
- afficher et rechercher dans des fichiers (`less`, `head`, `tail -f`, `grep`) ;
- les droits, vos projets (`id`, `groups`) et le partage de fichiers avec votre équipe (`chmod g+rwX`) ;
- les variables d'environnement et un premier script Bash.

---

## Lancer des jobs Slurm {#running-slurm-jobs}

Aucun calcul ne tourne sur le nœud de connexion : vous soumettez des jobs à **Slurm**, qui les exécute sur les nœuds de calcul.

### Les bases de Slurm {#slurm-basics}

[Les bases de Slurm](running-jobs/slurm-basics.md) : les commandes du quotidien (`sbatch`, `squeue --me`, `scancel`, `sacct`, `seff`), l'unique partition `normal`, les QOS (`normal`, `debug`, `long`, `urgent`) et le compte projet obligatoire (`--account=malaria`).

### Écrire des scripts de job {#writing-job-scripts}

[Écrire des scripts de job](running-jobs/job-scripts.md) : le modèle de script de l'IGH ligne par ligne, un exemple complet en bio-informatique, et comment découper les longues analyses en étapes.

### Soumettre avec hpcsub {#submitting-with-hpcsub}

[hpcsub](running-jobs/hpcsub.md) : la commande de soumission de l'IGH. Elle vérifie que vous êtes membre du projet et que vos fichiers sont lisibles, crée vos dossiers de résultats et de travail, puis appelle `sbatch` avec le bon compte et les bons chemins de journaux.

### Exemples de scripts de job {#sample-job-scripts}

[Exemples de scripts](running-jobs/sample-scripts.md) : de petits scripts prêts à soumettre pour tester votre environnement (modules, stockage, R avec `module load gnu12 R/4.2.1`).

### Nos nœuds : cœurs, threads et mémoire {#our-nodes-cores-threads-and-memory}

[Nos nœuds](running-jobs/nodes.md) : ce que contient un nœud de calcul (64 cœurs, 128 CPU, 512 Go), comment choisir `--cpus-per-task` et `--mem`, et pourquoi un code compilé sur le nœud de connexion peut échouer sur les nœuds de calcul.

### Dépannage des jobs {#troubleshooting-jobs}

[Dépannage](running-jobs/troubleshooting.md) : jobs en attente, soumissions refusées (`Invalid account`, limites de QOS), `Permission denied` dans un projet, `command not found`, `Illegal instruction`, manque de mémoire, et quoi envoyer au support.

---

## Conteneurs {#containers}

Un conteneur regroupe une application et toutes ses dépendances pour qu'elle s'exécute de la même façon sur votre ordinateur et sur le cluster.

- [Qu'est-ce qu'un conteneur ?](containers/intro.md) : les notions, conteneurs et machines virtuelles.
- [Conteneuriser votre code](containers/containerize-code.md) : construire une image Docker sur votre ordinateur.
- [Conteneurs sur un cluster HPC](containers/containers-hpc.md) : exécuter des conteneurs dans des jobs Slurm avec Charliecloud (`module load charliecloud/0.44`).
- [Constructions avancées](containers/advanced-builds.md) : des images plus légères et plus portables.

---

## Par où commencer {#where-to-start}

Si vous débutez en HPC, suivez ces pages dans l'ordre :

1. [Introduction à Linux](linux-basics/intro.md) : prendre en main le terminal.
2. [Projets, sous-projets et rôles](../getting-started/projects.md) : comprendre où se trouvent vos données et vos résultats.
3. [Les bases de Slurm](running-jobs/slurm-basics.md) : soumettre vos premiers jobs.
4. [Écrire des scripts de job](running-jobs/job-scripts.md) et [hpcsub](running-jobs/hpcsub.md) : lancer vos propres analyses.
5. [Nos nœuds](running-jobs/nodes.md) : bien dimensionner vos jobs.
