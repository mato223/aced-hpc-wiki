---
id: job-scripts
title: Écrire des scripts de job
sidebar_label: "Écrire des scripts de job"
sidebar_position: 2
---

Un script de job Slurm est un script Bash qui commence par des lignes `#SBATCH`. Ces lignes indiquent à Slurm quel projet imputer, combien de temps, de CPU et de mémoire réserver, et où écrire les journaux. Les commandes qui suivent sont ce qui s'exécute sur le nœud de calcul.

Cette page présente le modèle de l'IGH, explique chaque ligne et donne un exemple complet. Si vous préférez ne pas écrire vous-même le compte et les chemins des journaux, utilisez [hpcsub](hpcsub.md).

---

## Le modèle de script de l'IGH {#the-igh-job-script-template}

```bash
#!/bin/bash
#SBATCH --job-name=my_analysis
#SBATCH --account=malaria                   # votre projet (obligatoire)
#SBATCH --qos=normal                        # normal | debug | long
#SBATCH --time=1-00:00:00
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G                           # TOUJOURS préciser la mémoire
#SBATCH --chdir=/projects/malaria/work/<login>
#SBATCH --output=/projects/malaria/results/slurm_logs/%x_%j.out
#SBATCH --error=/projects/malaria/results/slurm_logs/%x_%j.err
set -euo pipefail
module load <tool>/<version>
srun <tool> --threads "$SLURM_CPUS_PER_TASK" \
     -i /projects/malaria/data/raw/<run> -o ...
```

Remplacez `malaria` par votre projet (ou `malaria_<sub-project>` pour le compte d'un sous-projet, avec les chemins `/projects/malaria/<sub-project>` correspondants), `<login>` par votre identifiant et `<tool>` par votre logiciel.

### Ligne par ligne {#line-by-line}

| Ligne | Rôle |
|-------|------|
| `#!/bin/bash` | Exécute le script avec Bash. Doit être la première ligne. |
| `--job-name` | Nom affiché dans `squeue` ; `%x` dans le nom des journaux est remplacé par ce nom. |
| `--account` | Compte Slurm de votre projet. **Obligatoire** : sans lui, ou avec un projet dont vous n'êtes pas membre, le job est refusé. |
| `--qos` | `normal` par défaut, `debug` pour les tests, `long` sur demande. Voir [Les bases de Slurm](slurm-basics.md#choosing-a-qos). |
| `--time` | Durée maximale, ici 1 jour (`J-HH:MM:SS`). Le job est arrêté quand elle est atteinte. |
| `--cpus-per-task` | Nombre de CPU réservés pour votre programme. Donnez le même nombre au programme. |
| `--mem` | Mémoire réservée sur le nœud. **Toujours la préciser.** |
| `--chdir` | Dossier de départ du job : votre dossier de travail dans le `work/` du projet. |
| `--output`, `--error` | Fichiers journaux, dans le `results/slurm_logs/` du projet. `%j` est le numéro du job. |
| `set -euo pipefail` | Arrête le script à la première erreur au lieu de continuer avec des fichiers manquants. |
| `module load` | Charge le logiciel. Voir [Modules](../../software/modules.md). |
| `srun ... "$SLURM_CPUS_PER_TASK"` | Lance le programme avec exactement le nombre de threads réservés. |

:::warning Deux règles qui protègent tout le monde
1. **Toujours préciser la mémoire** (`--mem` ou `--mem-per-cpu`). Sans elle, le job réserve toute la mémoire d'un nœud (512 Go) et le bloque.
2. **Donner à votre programme le nombre de threads réservés** : `bwa mem -t $SLURM_CPUS_PER_TASK`, `samtools -@`, `minimap2 -t`, `kraken2 --threads`, `BEAST -threads`... Sinon le programme peut lancer un thread par CPU du nœud (128) et ralentir tout le monde.

Voir [Nos nœuds](nodes.md) pour choisir de bonnes valeurs.
:::

### Avant la première soumission {#before-the-first-submission}

Les lignes `#SBATCH` sont lues par Slurm, pas par Bash : les variables comme `$USER` n'y sont **pas** remplacées. Écrivez votre identifiant en entier. Les dossiers indiqués dans `--chdir`, `--output` et `--error` doivent exister, sinon le job échoue immédiatement sans écrire de journal :

```bash
mkdir -p /projects/malaria/work/$USER
ls -d /projects/malaria/results/slurm_logs
```

---

## Un exemple complet : classification avec Kraken2 {#a-complete-example-kraken2-classification}

Il n'y a pas encore de modules de bio-informatique : les outils comme Kraken2 s'installent avec conda (`module load anaconda/2025.06`) dans votre dossier personnel ou dans le projet. Voir [Installer ses propres logiciels](../../software/custom-install.md). Cet exemple suppose que vous avez créé un environnement conda nommé `kraken2` qui contient Kraken2.

```bash
#!/bin/bash
#SBATCH --job-name=kraken2_sample01
#SBATCH --account=malaria                   # votre projet (obligatoire)
#SBATCH --qos=normal
#SBATCH --time=06:00:00
#SBATCH --cpus-per-task=8
#SBATCH --mem=64G                           # TOUJOURS préciser la mémoire
#SBATCH --chdir=/projects/malaria/work/<login>
#SBATCH --output=/projects/malaria/results/slurm_logs/%x_%j.out
#SBATCH --error=/projects/malaria/results/slurm_logs/%x_%j.err
set -euo pipefail

# Logiciel : environnement conda créé au préalable
module load anaconda/2025.06
eval "$(conda shell.bash hook)"
conda activate kraken2

# Entrées et sorties
DB=/references/kraken2/2026-11
READS=/projects/malaria/data/raw/<run>/sample01.fastq.gz
OUT=/projects/malaria/results/$USER/kraken2
mkdir -p "$OUT"

echo "Start: $(date) on $(hostname)"
srun kraken2 --db "$DB" \
     --threads "$SLURM_CPUS_PER_TASK" \
     --gzip-compressed \
     --report "$OUT/sample01.report" \
     --output "$OUT/sample01.kraken" \
     "$READS"
echo "End: $(date)"
```

À noter :

- Kraken2 charge sa base en mémoire : réglez `--mem` un peu au-dessus de la taille de la base utilisée, puis ajustez avec `seff`.
- Les bases de référence sont partagées et versionnées dans `/references`. Utilisez-les au lieu de télécharger votre propre copie, et citez la version (ici `2026-11`) dans vos publications.
- Les données brutes de `data/raw/` sont en lecture seule : lisez-les directement, ne les copiez ni ne les modifiez jamais.
- Dans le script (après les lignes `#SBATCH`), `$USER` fonctionne normalement.

---

## Soumettre et suivre {#submitting-and-monitoring}

```bash
sbatch kraken2_sample01.sh             # affiche : Submitted batch job <jobid>
squeue --me                            # PD = en attente, R = en cours
scontrol show job <jobid>              # détails, dont la raison de l'attente
tail -f /projects/malaria/results/slurm_logs/kraken2_sample01_<jobid>.out
```

Après le job :

```bash
sacct -j <jobid> --format=JobID,JobName,State,Elapsed,MaxRSS,ExitCode
seff <jobid>                           # efficacité CPU et mémoire
```

Si `seff` montre que le job a utilisé beaucoup moins de mémoire ou de CPU que demandé, diminuez `--mem` ou `--cpus-per-task` la fois suivante : vos jobs démarreront plus tôt et laisseront de la place aux autres.

---

## Découper les longues analyses en étapes {#splitting-long-analyses-into-steps}

Un long pipeline dans un seul job est fragile : s'il échoue ou atteint son `--time`, tout le travail est perdu. Découpez-le en étapes, et sautez une étape dont le résultat existe déjà.

Les **job arrays** lancent le même script sur de nombreux échantillons. `$SLURM_ARRAY_TASK_ID` donne le numéro de la tâche :

```bash
#!/bin/bash
#SBATCH --job-name=qc
#SBATCH --account=malaria
#SBATCH --time=02:00:00
#SBATCH --cpus-per-task=4
#SBATCH --mem=8G
#SBATCH --array=1-24                        # une tâche par échantillon
#SBATCH --output=/projects/malaria/results/slurm_logs/%x_%A_%a.out
set -euo pipefail

SAMPLE=$(sed -n "${SLURM_ARRAY_TASK_ID}p" /projects/malaria/scripts/samples.txt)
OUT=/projects/malaria/results/$USER/qc/$SAMPLE
if [ -e "$OUT/done" ]; then echo "$SAMPLE already done"; exit 0; fi
mkdir -p "$OUT"
# ... lancer ici l'étape pour $SAMPLE ...
touch "$OUT/done"
```

Les **dépendances** ne lancent une étape que lorsque la précédente a réussi :

```bash
jid=$(sbatch --parsable step1_qc.sh)
sbatch --dependency=afterok:$jid step2_align.sh
```

---

## Tester en interactif {#testing-interactively}

Pour essayer des commandes sur un nœud de calcul avant d'écrire le script, demandez une courte session interactive avec la QOS `debug` :

```bash
srun --account=malaria --qos=debug --time=00:30:00 --cpus-per-task=2 --mem=4G --pty bash
```

Tapez `exit` quand vous avez fini pour libérer les ressources.

Pour la suite : [hpcsub](hpcsub.md), [Exemples de scripts](sample-scripts.md) et [Dépannage](troubleshooting.md).
