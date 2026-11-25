---
id: slurm-basics
title: Les bases de Slurm
sidebar_label: "Les bases de Slurm"
sidebar_position: 1
---

Le cluster HPC de l'IGH utilise **Slurm** pour partager ses nœuds de calcul entre les utilisateurs. Vous ne lancez jamais d'analyse sur le nœud de connexion : vous décrivez votre job dans un script, vous le soumettez, et Slurm l'exécute sur un nœud de calcul dès que les ressources demandées sont libres.

## Qu'est-ce que Slurm ? {#what-is-slurm}

Slurm est l'ordonnanceur de jobs. Il :

- reçoit vos jobs et les place dans une file d'attente ;
- réserve sur un nœud de calcul les CPU, la mémoire et le temps demandés par chaque job ;
- lance le job, fait respecter ses limites (temps, mémoire) et enregistre ce qu'il a consommé.

---

## Partition, QOS et compte projet {#partition-qos-and-project-account}

Chaque job sur le cluster de l'IGH est défini par trois éléments.

### Une seule partition : normal {#one-partition-normal}

Il n'y a qu'une partition, `normal`, qui regroupe tous les nœuds de calcul. C'est la partition par défaut : inutile de préciser `--partition`.

### Choisir une QOS {#choosing-a-qos}

La **QOS** (qualité de service) fixe la durée maximale et les limites de votre job. Choisissez-la avec `#SBATCH --qos=...` ; sinon, votre job utilise `normal`.

| QOS | Qui peut l'utiliser | Durée maximale | Limites |
|-----|---------------------|----------------|---------|
| `normal` | Tout le monde (par défaut) | <Var name="qosNormalMaxDays" /> jours | <Var name="qosNormalMaxCpusPerUser" /> CPU au maximum par utilisateur |
| `debug` | Tout le monde, pour des tests rapides | <Var name="qosDebugMaxHours" /> heure | <Var name="qosDebugMaxCpus" /> CPU, <Var name="qosDebugMaxRunning" /> jobs en cours, <Var name="qosDebugMaxQueued" /> jobs en file ; démarre plus vite |
| `long` | Sur demande (ticket au support) | <Var name="qosLongMaxDays" /> jours | <Var name="qosLongMaxCpusTotal" /> CPU au total, <Var name="qosLongMaxJobsPerUser" /> jobs par utilisateur |
| `urgent` | Accordée temporairement, pour une échéance | <Var name="qosUrgentMaxDays" /> jours | Priorité haute ; consommation comptée double |

:::info Ces limites peuvent évoluer
Les valeurs de QOS ci-dessus ne sont pas définitives et peuvent être ajustées. Cette page affiche toujours les valeurs en vigueur.
:::

Un job qui dépasse une limite de sa QOS est **refusé à la soumission** avec un message d'erreur. Indiquez toujours un `--time` réaliste : un job est arrêté quand il l'atteint.

Pour obtenir la QOS `long` ou `urgent`, ouvrez un ticket sur <Var name="supportPortal" link /> en expliquant pourquoi.

### Le compte projet est obligatoire {#the-project-account-is-required}

Chaque job s'exécute sur le compte Slurm d'un projet ou sous-projet dont vous êtes membre. Indiquez-le dans chaque job :

```bash
#SBATCH --account=malaria                  # ou malaria_<sub-project>
```

Pour voir les comptes et QOS auxquels vous avez droit :

```bash
sacctmgr show assoc user=$USER format=account,qos
```

Si vous n'êtes pas membre du projet, le job est refusé (`Invalid account`). Voir [Projets, sous-projets et rôles](../../getting-started/projects.md).

---

## Commandes principales {#key-commands}

| Action | Commande | Description |
|--------|----------|-------------|
| Soumettre un job | `sbatch script.sh` | Soumet un script batch ; affiche le numéro du job |
| Voir ses jobs | `squeue --me` | Vos jobs en cours et en attente |
| Démarrage estimé | `squeue --me --start` | Quand Slurm prévoit de lancer vos jobs en attente |
| Annuler un job | `scancel <jobid>` | Annule le job |
| Détails d'un job | `scontrol show job <jobid>` | Tout sur un job, y compris la raison de l'attente |
| Historique | `sacct -j <jobid>` | Données de comptabilité, même après la fin du job |
| Efficacité | `seff <jobid>` | CPU et mémoire réellement utilisés, une fois le job terminé |
| État des nœuds | `sinfo` | État des nœuds de calcul |

Vous ne voyez que vos propres jobs. Les admins d'un projet voient aussi les jobs de leur projet, et peuvent les suspendre ou les annuler.

---

## Un premier script de job {#a-first-job-script}

```bash
#!/bin/bash
#SBATCH --job-name=myjob
#SBATCH --account=malaria                  # votre projet (obligatoire)
#SBATCH --qos=debug                        # test rapide
#SBATCH --time=00:10:00                    # 10 minutes
#SBATCH --cpus-per-task=2
#SBATCH --mem=4G                           # TOUJOURS préciser la mémoire
#SBATCH --output=%x_%j.out                 # %x = nom du job, %j = numéro du job

module load gnu12 R/4.2.1
Rscript -e 'print(sessionInfo())'
```

Soumettez-le depuis le dossier où vous voulez obtenir le fichier de sortie :

```bash
sbatch myjob.sh
squeue --me
```

### Explication {#explanation}

| Directive | Signification |
|-----------|---------------|
| `--job-name` | Nom affiché dans `squeue` et utilisé par `%x` |
| `--account` | Compte Slurm de votre projet (obligatoire) |
| `--qos` | `normal`, `debug`, `long` ou `urgent` (voir plus haut) |
| `--time` | Durée maximale : `MM:SS`, `HH:MM:SS` ou `J-HH:MM:SS` |
| `--cpus-per-task` (`-c`) | Nombre de CPU pour les threads de votre programme |
| `--mem` | Mémoire du job, sur le nœud |
| `--output` | Fichier de sortie du job (`%j` = numéro du job) |

:::warning Toujours préciser la mémoire
Sans `--mem` (ou `--mem-per-cpu`), un job réserve toute la mémoire d'un nœud et le bloque pour tout le monde. Voir [Nos nœuds](nodes.md).
:::

---

## Bonnes pratiques {#best-practices}

- Testez sur une petite entrée avec la QOS `debug` avant de lancer l'analyse complète.
- Demandez ce dont vous avez besoin : un `--time` réaliste, une `--mem` mesurée et un `--cpus-per-task` réellement utilisé par votre programme.
- Indiquez à votre programme combien de threads il peut utiliser, par exemple `bwa mem -t $SLURM_CPUS_PER_TASK`.
- Après chaque job, vérifiez sa consommation réelle avec `seff <jobid>` et ajustez le suivant.
- Annulez avec `scancel` les jobs dont vous n'avez plus besoin.

Pour la suite : [Écrire des scripts de job](job-scripts.md), [hpcsub](hpcsub.md) et [Soumettre ses jobs de façon responsable](../../good-conduct/job-submission.md).
