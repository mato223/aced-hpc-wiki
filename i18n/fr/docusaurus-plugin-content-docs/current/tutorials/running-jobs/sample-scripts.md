---
id: sample-scripts
title: Exemples de scripts de job
sidebar_label: "Exemples de scripts de job"
sidebar_position: 4
---

De petits scripts prêts à soumettre pour vérifier que votre environnement fonctionne et vous habituer au cycle d'un job (soumettre, attendre, lire la sortie) avant de lancer une vraie analyse.

Ils utilisent tous la QOS `debug` (tests courts qui démarrent plus vite), le compte du projet `malaria` et peu de mémoire. Remplacez `malaria` par votre projet. Le fichier de sortie (`%x_%j.out` : nom du job et numéro du job) est écrit dans le dossier depuis lequel vous soumettez, par exemple `/projects/malaria/work/<login>`.

---

## Afficher les modules chargés {#printing-loaded-modules}

Montre quels modules sont chargés par défaut sur un nœud de calcul, et lesquels sont disponibles.

### Script : `list_modules.sh` {#script-list_modulessh}

```bash
#!/bin/bash
#SBATCH --job-name=list_modules
#SBATCH --account=malaria                  # votre projet (obligatoire)
#SBATCH --qos=debug
#SBATCH --time=00:05:00
#SBATCH --cpus-per-task=1
#SBATCH --mem=1G
#SBATCH --output=%x_%j.out

module list
module -t avail
```

### Utilisation {#how-to-use}

- Enregistrez le script sous `list_modules.sh`.
- Soumettez-le avec `sbatch list_modules.sh`.
- Lisez `list_modules_<jobid>.out`. Les listes de modules sont écrites sur la sortie d'erreur ; ici, elles apparaissent dans le même fichier.

---

## Vérifier les espaces de stockage {#checking-the-storage-spaces}

Vérifie que le job voit votre dossier personnel, le projet, votre scratch et les références partagées, comme le nœud de connexion.

### Script : `check_storage.sh` {#script-check_storagesh}

```bash
#!/bin/bash
#SBATCH --job-name=check_storage
#SBATCH --account=malaria                  # votre projet (obligatoire)
#SBATCH --qos=debug
#SBATCH --time=00:05:00
#SBATCH --cpus-per-task=1
#SBATCH --mem=1G
#SBATCH --output=%x_%j.out

echo "Node: $(hostname)"
df -h $HOME /projects/malaria /scratch/malaria /references
ls -ld /projects/malaria /scratch/malaria/$USER
```

### Utilisation {#how-to-use-1}

- Enregistrez le script sous `check_storage.sh` et soumettez-le avec `sbatch check_storage.sh`.
- Dans `check_storage_<jobid>.out`, vérifiez que chaque espace apparaît. Si votre dossier de scratch n'existe pas encore, créez-le avec `mkdir -p /scratch/malaria/$USER`.

---

## Afficher la date et les ressources du job {#printing-the-date-and-the-jobs-resources}

Affiche quand le job a démarré, sur quel nœud, et ce que Slurm lui a attribué.

### Script : `job_info.sh` {#script-job_infosh}

```bash
#!/bin/bash
#SBATCH --job-name=job_info
#SBATCH --account=malaria                  # votre projet (obligatoire)
#SBATCH --qos=debug
#SBATCH --time=00:05:00
#SBATCH --cpus-per-task=4
#SBATCH --mem=2G
#SBATCH --output=%x_%j.out

date
echo "Job ID:        $SLURM_JOB_ID"
echo "Node:          $(hostname)"
echo "Account:       $SLURM_JOB_ACCOUNT"
echo "CPUs per task: $SLURM_CPUS_PER_TASK"
echo "Memory (MB):   $SLURM_MEM_PER_NODE"
```

### Utilisation {#how-to-use-2}

- Enregistrez le script sous `job_info.sh` et soumettez-le avec `sbatch job_info.sh`.
- Comparez les valeurs de `job_info_<jobid>.out` avec ce que vous avez demandé.

---

## Lancer un script R simple {#running-a-simple-r-script}

R 4.2.1 est disponible après le chargement du module du compilateur GNU 12 : `module load gnu12 R/4.2.1`.

### Script : `run_r_demo.sh` {#script-run_r_demosh}

```bash
#!/bin/bash
#SBATCH --job-name=r_demo
#SBATCH --account=malaria                  # votre projet (obligatoire)
#SBATCH --qos=debug
#SBATCH --time=00:10:00
#SBATCH --cpus-per-task=1
#SBATCH --mem=2G
#SBATCH --output=%x_%j.out

module load gnu12 R/4.2.1

Rscript -e 'cat("Hello from R", R.version.string, "\n")'
```

Pour lancer votre propre script R, remplacez la dernière ligne par `Rscript /projects/malaria/scripts/my_analysis.R`.

### Utilisation {#how-to-use-3}

- Enregistrez le script sous `run_r_demo.sh` et soumettez-le avec `sbatch run_r_demo.sh`.
- `r_demo_<jobid>.out` doit contenir `Hello from R` et la version de R.

---

## Lancer une simple commande shell {#running-a-simple-shell-command}

Le job le plus simple possible, pour vérifier que vous pouvez soumettre et que la sortie est bien écrite.

### Script : `echo_message.sh` {#script-echo_messagesh}

```bash
#!/bin/bash
#SBATCH --job-name=echo_message
#SBATCH --account=malaria                  # votre projet (obligatoire)
#SBATCH --qos=debug
#SBATCH --time=00:02:00
#SBATCH --cpus-per-task=1
#SBATCH --mem=500M
#SBATCH --output=%x_%j.out

echo "This is a demo job running on $(hostname)"
```

### Utilisation {#how-to-use-4}

- Enregistrez le script sous `echo_message.sh` et soumettez-le avec `sbatch echo_message.sh`.
- Le message apparaît dans `echo_message_<jobid>.out`.

---

## Pour aller plus loin {#next-steps}

Une fois ces tests réussis, passez à une vraie analyse avec le [modèle de script de l'IGH](job-scripts.md) ou [hpcsub](hpcsub.md). Si un job échoue, voir [Dépannage](troubleshooting.md). La liste complète des logiciels se trouve dans [Logiciels installés](../../software/installed.md).
