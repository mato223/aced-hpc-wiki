---
id: hpcsub
title: Soumettre des jobs avec hpcsub
sidebar_label: "Soumettre avec hpcsub"
sidebar_position: 3
---

`hpcsub` est la commande de soumission de l'IGH. C'est une enveloppe de `sbatch`, disponible sur le nœud de connexion, qui prépare vos dossiers de projet et renseigne les options Slurm sur lesquelles on se trompe facilement (compte, dossier de travail, fichiers journaux).

Vous pouvez toujours utiliser `sbatch` directement avec le [modèle de l'IGH](job-scripts.md) ; `hpcsub` se charge simplement de l'intendance à votre place.

---

## Ce que fait hpcsub {#what-hpcsub-does}

Quand vous lancez `hpcsub`, la commande :

1. **vérifie** que vous êtes membre du projet, et que vos données d'entrée et votre script sont lisibles ;
2. **crée** votre dossier de résultats `results/<login>/<analysis>` et votre dossier de travail `work/<login>` dans le projet ;
3. **copie** le script soumis à côté des résultats, pour que vous sachiez toujours exactement ce qui les a produits ;
4. **appelle `sbatch`** avec les bons `--account`, `--chdir` et `--output`.

Si une vérification échoue, rien n'est soumis et `hpcsub` vous indique pourquoi.

---

## Syntaxe {#syntax}

```bash
hpcsub -p <project> -i <input_data> [-r <subdir>] \
       [-t 1-00:00:00] [-c 8] [-m 32G] [-q normal] [-n name] [--dry-run] \
       script.sh [arguments]
```

| Option | Signification |
|--------|---------------|
| `-p <project>` | Projet dans lequel travailler et à imputer (par exemple `malaria`). Obligatoire. |
| `-i <input_data>` | Données d'entrée de l'analyse ; `hpcsub` vérifie qu'elles sont lisibles. Obligatoire. |
| `-r <subdir>` | Sous-dossier facultatif (voir la note ci-dessous). |
| `-t` | Durée maximale, même format que `--time` (ici 1 jour). |
| `-c` | Nombre de CPU, comme `--cpus-per-task`. |
| `-m` | Mémoire, comme `--mem`. |
| `-q` | QOS : `normal`, `debug` ou `long`. Voir [Les bases de Slurm](slurm-basics.md#choosing-a-qos). |
| `-n` | Nom du job. |
| `--dry-run` | Montre ce qui serait fait et soumis, sans rien soumettre. |
| `script.sh [arguments]` | Votre script de job, suivi des arguments qui lui sont transmis. |

:::caution À confirmer
Les points suivants restent à confirmer et seront ajoutés à cette page : le rôle exact de `-r`, les valeurs par défaut quand `-t`, `-c`, `-m` ou `-q` ne sont pas donnés, la façon dont le dossier `<analysis>` est nommé, lequel des deux dossiers sert de dossier de départ au job (`--chdir`), où est écrit le fichier journal, et si le chemin donné à `-i` est transmis à votre script autrement que par ses arguments. En attendant, donnez toujours `-t`, `-c` et `-m` explicitement, et passez le chemin d'entrée à votre script en argument.
:::

---

## Exemple {#example}

Un script qui lance Kraken2 sur un échantillon et reçoit le fichier d'entrée en premier argument. Il n'a pas besoin de lignes `--account`, `--chdir` ou `--output` : `hpcsub` les fournit.

```bash
#!/bin/bash
# kraken2_one.sh : classer un fichier FASTQ
set -euo pipefail

READS=$1
OUT=/projects/malaria/results/$USER/kraken2
mkdir -p "$OUT"
module load anaconda/2025.06
eval "$(conda shell.bash hook)"
conda activate kraken2

srun kraken2 --db /references/kraken2/2026-11 \
     --threads "$SLURM_CPUS_PER_TASK" \
     --gzip-compressed \
     --report "$OUT/sample01.report" \
     --output "$OUT/sample01.kraken" \
     "$READS"
```

Vérifiez d'abord ce que `hpcsub` ferait :

```bash
hpcsub -p malaria -i /projects/malaria/data/raw/<run>/sample01.fastq.gz \
       -t 06:00:00 -c 8 -m 64G -q normal -n kraken2_sample01 --dry-run \
       kraken2_one.sh /projects/malaria/data/raw/<run>/sample01.fastq.gz
```

Si tout est correct, relancez la même commande sans `--dry-run` pour soumettre. Suivez ensuite le job comme d'habitude :

```bash
squeue --me
seff <jobid>                # une fois le job terminé
```

:::tip Où sont mes fichiers ?
Votre dossier de résultats et la copie du script soumis se trouvent sous `/projects/malaria/results/<login>/` ; les fichiers intermédiaires vont dans `/projects/malaria/work/<login>/`. N'oubliez pas que `work/` n'est pas sauvegardé : gardez ce qui compte dans `results/`.
:::

---

## Bonnes pratiques {#good-practice}

- Lancez toujours d'abord avec `--dry-run` quand vous essayez un nouveau script ou de nouvelles options.
- Écrivez les sorties de votre script dans les dossiers du projet, et utilisez `--dry-run` pour voir les dossiers utilisés par `hpcsub`.
- Dimensionnez `-c` et `-m` d'après la consommation réelle des jobs précédents (`seff`). Voir [Nos nœuds](nodes.md).
- Dans votre script, passez `$SLURM_CPUS_PER_TASK` à l'option de threads de votre programme.
- Pour un sous-projet, vous devez être membre de ce sous-projet. Voir [Projets, sous-projets et rôles](../../getting-started/projects.md).

Si `hpcsub` refuse de soumettre et que vous ne comprenez pas pourquoi, consultez [Dépannage](troubleshooting.md) ou contactez le support.
