---
id: first-job
title: "Votre premier job"
sidebar_label: "Votre premier job"
sidebar_position: 4
---

# Votre premier job {#your-first-job}

Cette page vous guide pour lancer un petit job de test sur la QOS `debug`, imputé au projet `malaria`. Remplacez `malaria` par votre propre projet (ou `malaria_<sub-project>` pour un sous-projet).

## Avant de commencer {#before-you-start}

- Vous êtes membre d'un projet : voir [Obtenir un accès](accounts.md) et [Projets, sous-projets et rôles](projects.md).
- Vous êtes connecté à <Var name="loginHost" code /> : voir [Se connecter au cluster](connecting.md).
- Vérifiez les comptes Slurm et les QOS que vous pouvez utiliser :

```bash
sacctmgr show assoc user=$USER format=account,qos
```

## 1. Aller dans votre espace scratch {#go-to-scratch}

```bash
mkdir -p /scratch/malaria/$USER/first-job
cd /scratch/malaria/$USER/first-job
```

## 2. Écrire le script du job {#write-the-script}

Créez un fichier `first-job.sh` (par exemple avec `nano first-job.sh`) :

```bash
#!/bin/bash
#SBATCH --job-name=first-job
#SBATCH --account=malaria          # votre projet (obligatoire)
#SBATCH --qos=debug                # job de test court
#SBATCH --time=00:10:00            # 10 minutes maximum
#SBATCH --cpus-per-task=2
#SBATCH --mem=2G                   # TOUJOURS préciser la mémoire
#SBATCH --output=%x_%j.out

set -euo pipefail

echo "Job $SLURM_JOB_ID running on $(hostname)"
echo "CPUs allocated: $SLURM_CPUS_PER_TASK"

module load gnu12
module list

sleep 30
echo "Done"
```

Ce que signifient les principales options :

| Option | Signification |
|---|---|
| `--account=malaria` | Le projet auquel le job est imputé. **Obligatoire** : un job sans compte de projet valide est refusé. |
| `--qos=debug` | Tests rapides : au plus <Var name="qosDebugMaxHours" /> heure et <Var name="qosDebugMaxCpus" /> CPU, démarre en général plus vite. Utilisez `normal` (par défaut) pour le vrai travail. |
| `--time` | Durée maximale d'exécution. Le job est arrêté quand elle est atteinte : donnez une valeur réaliste. |
| `--mem` | Mémoire du job. **Précisez-la toujours** : sans elle, le job réserve toute la mémoire d'un nœud et le bloque pour tout le monde. |
| `--cpus-per-task` | Nombre de CPU. Indiquez à votre logiciel d'utiliser exactement ce nombre (`$SLURM_CPUS_PER_TASK`). |

## 3. Le soumettre {#submit}

```bash
sbatch first-job.sh
```

Slurm répond avec le numéro du job, par exemple `Submitted batch job 123456`. Si le job dépasse une limite (mauvais compte, durée trop longue pour la QOS…), il est refusé immédiatement avec un message explicatif.

## 4. Le suivre {#monitor}

```bash
squeue --me                  # vos jobs en attente (PD) et en cours (R)
sacct -j 123456              # état du job, y compris une fois terminé
```

## 5. Lire le résultat {#read-the-result}

```bash
cat first-job_123456.out
seff 123456                  # efficacité CPU et mémoire une fois le job terminé
```

`seff` indique quelle part des CPU et de la mémoire demandés le job a réellement utilisée : servez-vous-en pour dimensionner vos prochains jobs.

## Erreurs fréquentes au premier job {#common-errors}

| Message | Que faire |
|---|---|
| `Invalid account or account/partition combination specified` | Vous n'êtes pas membre de ce projet, ou `--account` contient une faute de frappe. Vérifiez avec `sacctmgr show assoc user=$USER`. Si vous venez d'être ajouté, déconnectez-vous puis reconnectez-vous. |
| Job refusé pour une limite de QOS | Réduisez `--time` ou `--cpus-per-task`, ou utilisez `--qos=normal`. |
| `module: command not found` ou `<tool>: command not found` | Chargez le bon module dans le script. Voir [Modules](../software/modules.md). |

D'autres cas dans [Dépannage](../tutorials/running-jobs/troubleshooting.md).

## Étapes suivantes {#next-steps}

- [Bases de Slurm](../tutorials/running-jobs/slurm-basics.md) et [écrire un script de job](../tutorials/running-jobs/job-scripts.md).
- [hpcsub](../tutorials/running-jobs/hpcsub.md), la commande de l'IGH qui soumet un job dans les bons dossiers du projet à votre place.
- [Bonnes pratiques de soumission](../good-conduct/job-submission.md).
