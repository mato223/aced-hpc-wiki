---
id: glossary
title: "Glossaire"
sidebar_label: "Glossaire"
sidebar_position: 3
---

# Glossaire {#glossary}

Définitions courtes des termes utilisés dans ce wiki.

## Projets et accès {#projects-and-access}

- **Projet :** l'unité à laquelle tout est rattaché sur le cluster (par exemple `malaria`). Un projet dispose d'un dossier partagé (`/projects/malaria`), d'un espace scratch (`/scratch/malaria/<login>`) et d'un compte Slurm (`malaria`). Voir [Projets, sous-projets et rôles](../getting-started/projects.md).
- **Sous-projet :** une équipe ou un volet de travail à l'intérieur d'un projet, avec son propre dossier (`/projects/malaria/<sub-project>`), son espace scratch et son compte Slurm (`malaria_<sub-project>`). Ses membres ne voient pas les autres sous-projets.
- **Membre :** une personne qui lit et écrit dans un projet (ou un sous-projet) et lance des jobs sur son compte Slurm.
- **Lecteur :** une personne qui peut consulter les données d'un projet sans calculer dessus.
- **Admin de projet :** l'une des 1 ou 2 personnes qui gèrent un projet : elles demandent l'ajout ou le retrait de membres, tiennent à jour le `README.md` du projet, peuvent gérer les jobs du projet et reçoivent ses rapports de consommation.
- **Compte institutionnel :** votre identifiant IGH, utilisé pour le cluster et pour les autres services de l'institut.

## Cluster et matériel {#cluster-and-hardware}

- **Cluster :** un ensemble d'ordinateurs (nœuds) qui travaillent ensemble et sont partagés par de nombreux utilisateurs.
- **Nœud de connexion :** la machine sur laquelle vous vous connectez (<Var name="loginHost" code />). Pour l'édition, les transferts et la soumission de jobs, jamais pour calculer.
- **Nœud de calcul :** une machine qui exécute les jobs. Le HPC de l'IGH en compte huit (<Var name="computeNodes" />). Voir la [présentation du matériel](../hardware/overview.md).
- **Nœud « stateless » :** un nœud de calcul dont le système est chargé en mémoire au démarrage. Il n'a pas de disque local pour les utilisateurs et son `/tmp` est en mémoire : n'y écrivez pas de gros fichiers.
- **Cœur / CPU :** un cœur physique peut exécuter deux threads à la fois (hyperthreading). Slurm compte chaque thread comme un CPU : 1 cœur = 2 CPU Slurm.
- **InfiniBand :** le réseau rapide (100 Gb/s) qui relie les nœuds et le stockage.

## Jobs et Slurm {#jobs-and-slurm}

- **Slurm :** l'ordonnanceur qui répartit les nœuds de calcul entre les utilisateurs et exécute les jobs.
- **Job :** un travail soumis à Slurm, généralement un script lancé avec `sbatch`.
- **Script de job :** un script shell dont les lignes `#SBATCH` décrivent les ressources nécessaires au job.
- **Compte Slurm :** le projet auquel un job est imputé, indiqué avec `--account` (par exemple `--account=malaria`). Obligatoire.
- **Partition :** un groupe de nœuds vers lequel les jobs sont envoyés. Le HPC de l'IGH n'a qu'une partition, `normal`.
- **QOS (Quality of Service) :** un ensemble de limites et de priorité appliqué à un job : `normal` (par défaut), `debug` (tests rapides), `long` (sur demande), `urgent` (temporaire). Voir les [bases de Slurm](../tutorials/running-jobs/slurm-basics.md).
- **Durée limite (wall time) :** la durée maximale d'un job, indiquée avec `--time`.
- **Job array :** de nombreux jobs similaires soumis en une fois, chacun avec son propre indice (`$SLURM_ARRAY_TASK_ID`).
- **hpcsub :** la commande de l'IGH qui enveloppe `sbatch` et soumet un job dans les bons dossiers du projet. Voir [hpcsub](../tutorials/running-jobs/hpcsub.md).

## Stockage et logiciels {#storage-and-software}

- **NFS :** le système de fichiers réseau qui rend les mêmes dossiers (home, projets, scratch, références) visibles depuis le nœud de connexion et tous les nœuds de calcul.
- **Home (`$HOME`) :** votre dossier personnel, privé et sauvegardé, pour les scripts et la configuration.
- **Scratch :** espace rapide pour les calculs en cours et les gros fichiers temporaires. Non sauvegardé ; les fichiers non utilisés depuis <Var name="scratchPurgeDays" /> jours sont supprimés. Voir [Stockage](../hardware/storage.md).
- **`/references` :** génomes et bases de référence partagés et versionnés (par exemple `/references/kraken2/2026-11`), en lecture seule.
- **Module :** un moyen de charger un logiciel et son environnement avec `module load`. Voir [Modules](../software/modules.md).
- **Conda :** un gestionnaire de paquets pour installer des outils (y compris de bio-informatique) dans votre home ou dans le dossier du projet.
- **Conteneur :** une application empaquetée avec toutes ses dépendances. Sur le HPC de l'IGH, les conteneurs se lancent avec Charliecloud. Voir [Conteneurs](../tutorials/containers/intro.md).
