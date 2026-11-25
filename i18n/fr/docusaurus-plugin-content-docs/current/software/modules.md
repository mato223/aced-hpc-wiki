---
id: modules
title: Utiliser les modules d'environnement
sidebar_label: "Modules"
sidebar_position: 2
---

<Var name="clusterName" /> utilise **Lmod** pour gérer les environnements logiciels. Un module définit les variables (`PATH`, `LD_LIBRARY_PATH`…) nécessaires pour utiliser une version donnée d'un logiciel. Rien n'est chargé par défaut en dehors des réglages système : chargez ce dont vous avez besoin, dans votre session et dans chaque script de job.

La liste complète des modules se trouve sur [Logiciels installés](installed.md).

## Trouver un module {#finding-a-module}

```bash
module avail              # modules chargeables maintenant
module spider             # tous les modules, y compris ceux qui demandent gnu12 / openmpi4
module spider R           # versions de R et comment les charger
```

## Charger un module {#loading-a-module}

```bash
module load anaconda/2025.06    # conda / Python
module load gnu12               # compilateurs GNU 12
module load gnu12 R/4.2.1       # R demande de charger d'abord le compilateur gnu12
module load gnu12 openmpi4 fftw/3.3.10
```

Indiquez toujours la version (`R/4.2.1` plutôt que `R`) : vos résultats restent reproductibles si une version plus récente est installée plus tard.

## Lister, décharger et réinitialiser {#listing-unloading-and-resetting}

```bash
module list                 # modules actuellement chargés
module unload R/4.2.1       # décharger un module
module purge                # tout décharger
module show R/4.2.1         # ce que le module modifie dans votre environnement
```

## Modules dans un script de job {#modules-in-a-job-script}

Un job n'hérite pas de façon fiable des modules de votre session interactive. Chargez-les explicitement dans le script :

```bash
#!/bin/bash
#SBATCH --job-name=r_analysis
#SBATCH --account=malaria
#SBATCH --time=02:00:00
#SBATCH --cpus-per-task=4
#SBATCH --mem=16G

module purge
module load gnu12 R/4.2.1
export OMP_NUM_THREADS=$SLURM_CPUS_PER_TASK

Rscript analysis.R
```

Voir [Écrire des scripts de job](../tutorials/running-jobs/job-scripts.md) pour un modèle complet.

## Conseils {#tips}

- Si une commande répond `command not found`, le module n'est probablement pas chargé (ou pas chargé dans le script de job).
- Les outils de bio-informatique ne sont pas encore disponibles en modules : utilisez conda (`module load anaconda/2025.06`) ou demandez-les, voir [Logiciels installés](installed.md#bioinformatics-tools).
- Pour installer vos propres logiciels, voir [Installations personnalisées](custom-install.md).
