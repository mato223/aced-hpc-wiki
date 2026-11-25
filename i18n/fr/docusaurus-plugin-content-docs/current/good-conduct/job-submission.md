---
title: Conseils de soumission de jobs
sidebar_position: 4
sidebar_label: "Conseils de soumission de jobs"
---

Soumettre ses jobs de façon responsable garde le cluster disponible pour tous les utilisateurs de l'IGH. Ne demandez que ce dont vous avez besoin, testez avant de passer à l'échelle, et vérifiez comment vos jobs ont réellement utilisé leurs ressources.

## Les deux règles d'or {#golden-rules}

:::danger À lire avant votre premier job
Ces deux règles évitent la plupart des problèmes rencontrés sur le cluster.
:::

### 1. Toujours préciser la mémoire {#always-set-memory}

Demandez toujours la mémoire avec `--mem` (par nœud) ou `--mem-per-cpu`. **Sans `--mem`, un job réserve toute la mémoire d'un nœud (512 Go) et bloque le nœud entier** pour tous les autres, même s'il n'utilise qu'un seul CPU.

```bash
#SBATCH --mem=32G            # mémoire totale du job (un nœud)
# ou
#SBATCH --mem-per-cpu=4G     # mémoire par CPU Slurm
```

### 2. Donner au logiciel le nombre de threads réservé {#match-threads}

Indiquez à votre logiciel d'utiliser exactement le nombre de CPU que Slurm vous a attribué, via `$SLURM_CPUS_PER_TASK` :

```bash
#SBATCH --cpus-per-task=10

bwa mem -t $SLURM_CPUS_PER_TASK ref.fa reads_1.fq reads_2.fq > aln.sam
```

Il en va de même pour `samtools -@`, `minimap2 -t`, `kraken2 --threads`, `BEAST -threads`, etc. Sinon, beaucoup d'outils lancent un thread par CPU visible, soit **128 threads** sur un nœud : ils entrent en concurrence avec les autres jobs du nœud et ralentissent tout le monde, vous compris.

## 1 cœur = 2 CPU Slurm {#one-core-two-cpus}

L'hyperthreading est activé sur les nœuds de calcul : chaque cœur physique exécute 2 threads matériels, et **Slurm compte chaque thread comme un CPU**. Un nœud de calcul a 64 cœurs physiques, soit **128 CPU Slurm**.

- `--cpus-per-task=8` vous donne 8 CPU Slurm, c'est-à-dire 4 cœurs physiques.
- Certains outils très gourmands en calcul gagnent peu au second thread d'un cœur : pour trouver la bonne valeur pour votre outil, comparez le temps d'exécution avec différentes valeurs de `-c` à l'aide de `seff`.

Plus de détails : [Nos nœuds : cœurs, threads et mémoire](../tutorials/running-jobs/nodes.md).

## Toujours imputer le bon projet {#project-account}

Chaque job doit être imputé au compte d'un projet avec `--account` :

```bash
#SBATCH --account=malaria                 # ou malaria_<sub-project>

# Lister les comptes et QOS que vous pouvez utiliser
sacctmgr show assoc user=$USER format=account,qos
```

Si vous n'êtes pas membre du projet, le job est refusé. Voir [Projets, sous-projets et rôles](../getting-started/projects.md).

## Ne demander que le nécessaire {#request-only-what-you-need}

Surestimer ses besoins gaspille la capacité du cluster et fait attendre plus longtemps vos propres jobs.

### Nœuds et CPU {#nodes-and-tasks}

La plupart des outils de bio-informatique sont multi-threadés sur un seul nœud :

```bash
# MAUVAIS : plusieurs nœuds pour un outil qui n'en utilise qu'un
#SBATCH --nodes=4
#SBATCH --ntasks-per-node=32

# BON : un nœud, une tâche, plusieurs threads
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
```

### Durée limite {#time-limits}

Indiquez toujours un `--time` réaliste. Un job qui demande plus que ce que permet sa QOS (<Var name="qosNormalMaxDays" /> jours pour `normal`) est refusé à la soumission avec un message.

```bash
# MAUVAIS : toujours demander le maximum « au cas où »
#SBATCH --time=7-00:00:00

# BON : durée mesurée + une marge
#SBATCH --time=04:00:00  # mesuré : 3 heures + 1 heure de marge
```

**Pourquoi c'est important :**

- les jobs plus courts peuvent se glisser dans les trous du planning et démarrer plus tôt ;
- un temps surestimé bloque des ressources dont d'autres pourraient profiter.

Les QOS et leurs limites sont décrites dans [Les bases de Slurm](../tutorials/running-jobs/slurm-basics.md).

### Mémoire {#memory}

Réserver beaucoup de mémoire revient aussi à occuper des CPU : un nœud a ~503 Go pour 128 CPU. Un job qui demande 500 Go avec 8 CPU **occupe un nœud entier**. Demandez la mémoire mesurée (avec `seff`) plus une marge, pas le maximum.

## Tester avant de passer à l'échelle {#test-before-scaling}

Vérifiez que votre job fonctionne sur une petite entrée avant de demander de grosses ressources.

### Test interactif {#interactive-testing}

```bash
# Session interactive sur un nœud de calcul (QOS debug : 1 heure maximum)
srun --account=malaria --qos=debug --cpus-per-task=2 --mem=4G --time=00:30:00 --pty bash

# Tester la commande sur une petite entrée
./my_program --small-input
```

### Petit job de test {#small-batch-test}

La QOS `debug` démarre plus vite et est prévue pour les tests rapides (<Var name="qosDebugMaxHours" /> heure maximum, <Var name="qosDebugMaxCpus" /> CPU) :

```bash
#SBATCH --account=malaria
#SBATCH --qos=debug
#SBATCH --cpus-per-task=2
#SBATCH --mem=4G
#SBATCH --time=00:30:00

./my_program --small-input
```

### Monter en charge progressivement {#scale-up-gradually}

```bash
# Une fois le petit test réussi, augmentez par étapes
# 1 échantillon -> 10 échantillons -> tous les échantillons

# Vérifiez l'efficacité de chaque étape avec seff avant d'aller plus loin
```

## Découper les longues analyses {#split-long-analyses}

Découpez les longues analyses en étapes plutôt qu'en un seul job énorme :

- utilisez des **job arrays** pour les échantillons indépendants et **`--dependency`** pour enchaîner les étapes ;
- écrivez la sortie de chaque étape dans un fichier, et faites en sorte que vos scripts **sautent les étapes déjà terminées**.

Ainsi, un job qui échoue ou dépasse son `--time` ne vous fait pas perdre tout le travail : vous ne relancez que l'étape manquante.

```bash
# Sauter une étape dont la sortie existe déjà
if [ ! -s results/sample1.bam ]; then
    bwa mem -t $SLURM_CPUS_PER_TASK ref.fa sample1_1.fq sample1_2.fq | samtools sort -o results/sample1.bam
fi
```

## Suivre l'utilisation des ressources {#monitor-resource-usage}

Savoir comment vos jobs utilisent les ressources vous aide à demander la bonne quantité.

### Pendant l'exécution {#during-job-execution}

```bash
# Vos jobs dans la file
squeue --me

# Informations détaillées sur un job
scontrol show job <jobid>
```

### Après la fin du job {#after-job-completion}

```bash
# Efficacité du job
seff <jobid>

# Exemple de sortie :
# CPU Efficiency: 85.2%
# Memory Efficiency: 62.3% of 16.00 GB
```

Si l'efficacité est faible, réduisez vos demandes pour la prochaine exécution.

### Utiliser sacct {#using-sacct}

```bash
# Statistiques d'un job terminé
sacct -j <jobid> --format=JobID,Elapsed,MaxRSS,CPUTime,State

# Vos jobs récents
sacct -u $USER --starttime=now-7days --format=JobID,JobName,Elapsed,State
```

Les admins de projet reçoivent aussi des rapports de consommation pour leur projet (voir [Projets, sous-projets et rôles](../getting-started/projects.md)).

## Bonnes pratiques pour les job arrays {#job-array-best-practices}

Les job arrays sont idéaux pour traiter de nombreux échantillons, mais demandent un peu de soin :

```bash
# BON : taille raisonnable avec limitation
#SBATCH --array=1-100%10  # 100 tâches, au plus 10 en même temps

# MAUVAIS : des milliers de petites tâches qui saturent l'ordonnanceur
#SBATCH --array=1-10000
```

### Limiter les grands arrays {#throttle-large-arrays}

```bash
# Limiter le nombre de tâches simultanées
#SBATCH --array=1-1000%50
```

### Regrouper les petites tâches {#combine-small-tasks}

Si chaque tâche ne dure que quelques secondes, regroupez-les :

```bash
# Au lieu de 10 000 tâches d'une seconde,
# créez 100 tâches qui traitent chacune 100 éléments
```

## Éviter les erreurs courantes {#avoid-common-mistakes}

### Ne pas inonder la file d'attente {#dont-flood-the-queue}

```bash
# MAUVAIS : soumettre des milliers de jobs dans une boucle
for i in {1..5000}; do
    sbatch job_$i.sh
done

# BON : utiliser un job array
#SBATCH --array=1-5000%100
```

### Ne pas ignorer les jobs en échec {#dont-ignore-failed-jobs}

```bash
# Retrouver vos jobs en échec
sacct -u $USER --state=FAILED --starttime=now-7days

# Lire le journal avant de resoumettre
cat /projects/malaria/results/slurm_logs/<jobname>_<jobid>.err
```

Voir [Dépannage](../tutorials/running-jobs/troubleshooting.md) pour les erreurs courantes.

### Ne pas coder les chemins en dur {#dont-hardcode-paths}

```bash
# MAUVAIS : chemin lié à une personne et à un essai
cd /projects/malaria/results/<login>/test_run
./run.sh

# BON : utiliser des variables
cd "$SLURM_SUBMIT_DIR"
./run.sh
```

## Chaînes de dépendances {#dependency-chains}

Utilisez les dépendances entre jobs plutôt que des boucles d'attente :

```bash
# Soumettre le premier job
JOB1=$(sbatch --parsable preprocess.sh)

# Soumettre le job suivant, qui ne démarre que si le premier a réussi
sbatch --dependency=afterok:$JOB1 analysis.sh
```
