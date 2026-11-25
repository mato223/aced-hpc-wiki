---
title: Consignes pour le nœud de connexion
sidebar_position: 2
sidebar_label: "Consignes pour le nœud de connexion"
---

Le nœud de connexion, <Var name="loginHost" code />, est le point d'entrée du cluster. Il est **partagé par tous les utilisateurs** en même temps. Y lancer des calculs ralentit tout le monde et peut entraîner l'arrêt de vos processus ou la suspension de votre compte.

:::danger Aucun calcul sur le nœud de connexion
Tous les calculs, pipelines compris, tournent sur les nœuds de calcul via Slurm. Le nœud de connexion sert uniquement à préparer et soumettre votre travail.
:::

## À quoi sert le nœud de connexion {#what-login-nodes-are-for}

Le nœud de connexion est fait pour des tâches légères de préparation :

- **Éditer des fichiers** : avec `vim`, `nano` ou `emacs` ;
- **Petites compilations** : compilations courtes, non parallèles (voir [Compiler pour les nœuds de calcul](../hardware/overview.md#compiling-for-the-compute-nodes)) ;
- **Gérer ses fichiers** : organiser ses dossiers, copier des fichiers dans son projet ;
- **Soumettre des jobs** : `sbatch`, `hpcsub`, `srun`, `scancel` ;
- **Suivre ses jobs** : `squeue --me`, `sacct`, `seff`, lecture des journaux ;
- **Transférer des fichiers** : `scp`, `rsync` ou `sftp` (voir [Guide de transfert de fichiers](file-transfers.md)).

## Ce qu'il ne faut pas faire sur le nœud de connexion {#what-not-to-do-on-login-nodes}

:::danger Activités interdites
Les activités suivantes sont **interdites** sur le nœud de connexion.
:::

### Lancer des applications de recherche {#running-research-applications}

Ne lancez pas de logiciel d'analyse directement sur le nœud de connexion :

```bash
# À NE PAS faire sur le nœud de connexion
bwa mem -t 16 ref.fa reads_1.fq reads_2.fq > aln.sam
python my_analysis.py
Rscript analysis.R
./my_program
```

**À la place**, soumettez-les comme jobs Slurm (voir [Scripts de job](../tutorials/running-jobs/job-scripts.md) et [hpcsub](../tutorials/running-jobs/hpcsub.md)) ou demandez une session interactive (ci-dessous).

### Lancer des pipelines {#running-pipelines}

Les gestionnaires de workflows et les scripts de pipeline ne doivent pas tourner sur le nœud de connexion, même si chaque étape « ne fait que soumettre des jobs » : ils gardent des processus actifs pendant des heures et exécutent souvent certaines étapes localement. Lancez le pipeline entier dans un job Slurm.

### Compilation parallèle {#parallel-compilation}

Évitez les compilations gourmandes :

```bash
# À NE PAS faire sur le nœud de connexion
make -j 32
ninja -j 16
```

**À la place**, compilez modestement sur le nœud de connexion ou compilez dans un job :

```bash
# Acceptable sur le nœud de connexion
make -j 2

# Mieux pour les grosses compilations : compiler dans un job, sur un nœud de calcul
sbatch compile_job.sh
```

### Processus de longue durée {#long-running-processes}

Ne laissez pas de processus lourds tourner en arrière-plan :

```bash
# Ne laissez PAS de calculs tourner sur le nœud de connexion
nohup long_process &
screen -S mysession  # pour du calcul
```

### Surveillance excessive des jobs {#excessive-resource-monitoring}

Évitez d'interroger l'état de vos jobs trop souvent :

```bash
# À NE PAS faire
watch -n 1 squeue --me  # toutes les secondes, c'est trop fréquent

# Correct - vérifier de temps en temps
squeue --me
```

## Utiliser des sessions interactives {#using-interactive-sessions}

Pour tester des commandes de façon interactive, demandez à Slurm une session sur un nœud de calcul :

```bash
# Shell interactif sur un nœud de calcul (QOS debug : 1 heure maximum)
srun --account=malaria --qos=debug --cpus-per-task=2 --mem=4G --time=01:00:00 --pty bash

# Quitter la session une fois terminé
exit
```

Remplacez `malaria` par le compte de votre projet. Vous travaillez alors sur des ressources dédiées, sans gêner les autres utilisateurs.

## VS Code et autres IDE {#vscode-and-ides}

:::warning Pas d'IDE lourd sur le nœud de connexion
VS Code Remote SSH, Jupyter, RStudio et les outils similaires démarrent des serveurs et des processus en arrière-plan qui consomment beaucoup de ressources sur le nœud de connexion et ralentissent les autres utilisateurs. Ne les lancez pas sur <Var name="loginHost" code />.
:::

**Alternatives recommandées :**

1. **Éditer en local** sur votre ordinateur, puis copier vos scripts sur le cluster avec `rsync` (voir [Guide de transfert de fichiers](file-transfers.md)).
2. **Utiliser un éditeur en terminal** sur le nœud de connexion : `vim`, `nano` ou `emacs`.

## Comment l'usage du nœud de connexion est surveillé {#how-we-monitor-login-node-usage}

L'équipe IT surveille l'usage des ressources du nœud de connexion. Les utilisateurs qui se livrent à des activités interdites peuvent recevoir :

1. un avertissement ;
2. l'arrêt de leurs processus ;
3. une suspension temporaire du compte en cas de récidive.
