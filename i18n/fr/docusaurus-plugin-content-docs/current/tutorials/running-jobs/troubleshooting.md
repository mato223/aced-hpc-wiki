---
id: troubleshooting
title: Dépannage des jobs
sidebar_label: "Dépannage des jobs"
sidebar_position: 6
---

Quand un job est refusé, reste en attente ou échoue, la cause se trouve presque toujours à l'un de ces trois endroits : le message affiché par `sbatch`, l'état du job dans Slurm, ou les fichiers `.out`/`.err` du job. Cette page passe en revue les cas les plus fréquents sur le cluster de l'IGH.

---

## Premiers réflexes {#first-reflexes}

```bash
squeue --me                                   # en attente (PD) ou en cours (R), et la raison
scontrol show job <jobid>                     # tous les détails, dont Reason=...
sacct -j <jobid> --format=JobID,JobName,State,Elapsed,ReqMem,MaxRSS,ExitCode
seff <jobid>                                  # CPU et mémoire réellement utilisés (jobs terminés)
less /projects/malaria/results/slurm_logs/<name>_<jobid>.err
```

La colonne `State` de `sacct` en dit déjà beaucoup : `COMPLETED` (succès), `FAILED` (votre programme a renvoyé une erreur), `TIMEOUT` (`--time` atteint), `OUT_OF_MEMORY` (`--mem` dépassée), `CANCELLED`.

---

## Le job est refusé à la soumission {#the-job-is-refused-at-submission}

### Invalid account {#invalid-account}

```
sbatch: error: Batch job submission failed: Invalid account or account/partition combination specified
```

**Cause** : le `--account` est absent ou erroné, ou vous n'êtes pas (encore) membre de ce projet ou sous-projet.

**Que faire** :

1. Vérifiez les comptes que vous pouvez utiliser :

   ```bash
   sacctmgr show assoc user=$USER format=account,qos
   ```

2. Corrigez `#SBATCH --account=...` (par exemple `malaria`, ou `malaria_<sub-project>`).
3. S'il manque le projet, demandez à l'admin du projet de vous faire ajouter (voir [Projets, sous-projets et rôles](../../getting-started/projects.md)). Une fois ajouté, déconnectez-vous puis reconnectez-vous.

### Une limite de QOS est dépassée {#a-qos-limit-is-exceeded}

Un job qui demande plus que ce que sa QOS autorise est refusé à la soumission, avec un message qui mentionne la QOS ou une limite, par exemple :

```
sbatch: error: Batch job submission failed: Job violates accounting/QOS policy (job submit limit, user's size and/or time limits)
```

**Cause** : `--time`, le nombre de CPU ou le nombre de jobs dépasse la limite de la QOS (par exemple plus de <Var name="qosDebugMaxHours" /> heure ou de <Var name="qosDebugMaxCpus" /> CPU en `debug`, plus de <Var name="qosNormalMaxDays" /> jours en `normal`), ou vous avez demandé une QOS à laquelle vous n'avez pas accès (`long`, `urgent` ; le message est alors `Invalid qos specification`).

**Que faire** : réduisez la demande, choisissez une autre QOS ou, pour `long`, ouvrez un ticket sur <Var name="supportPortal" link />. Les limites sont indiquées dans [Les bases de Slurm](slurm-basics.md#choosing-a-qos).

### Requested node configuration is not available {#requested-node-configuration-is-not-available}

**Cause** : le job demande plus que ce qu'a un nœud, par exemple `--mem=600G` (un nœud a environ 503 Go pour les jobs) ou plus de 128 CPU par tâche. Il n'y a qu'une partition, `normal` : n'en indiquez pas d'autre. Voir [Nos nœuds](nodes.md).

---

## Le job reste en attente {#the-job-stays-pending}

`squeue --me` affiche `PD` et une raison dans la dernière colonne :

| Raison | Signification | Que faire |
|--------|---------------|-----------|
| `Resources` | Aucun nœud n'a encore assez de CPU ou de mémoire libres | Attendre, ou demander moins (surtout `--mem`) |
| `Priority` | D'autres jobs passent avant le vôtre | Attendre |
| `QOSMax...` / `...PerUser...` | Vous avez atteint une limite de votre QOS (CPU ou jobs simultanés) | Attendre la fin de vos autres jobs |
| `Dependency` | Le job attend un autre job (`--dependency`) | Normal |
| `DependencyNeverSatisfied` | Le job dont il dépend a échoué | L'annuler avec `scancel` et corriger l'étape précédente |

`squeue --me --start` affiche une heure de démarrage estimée. Un job qui demande la mémoire d'un nœud entier attend qu'un nœud entier se libère : ne demandez que ce que vous avez mesuré.

---

## Le job échoue immédiatement {#the-job-fails-immediately}

### Aucun fichier de sortie {#no-output-file-at-all}

**Cause** : le dossier indiqué dans `--output`, `--error` ou `--chdir` n'existe pas, ou vous ne pouvez pas y écrire. Slurm ne peut pas créer le journal et le job s'arrête aussitôt.

**Que faire** : créez le dossier avant de soumettre (`mkdir -p /projects/malaria/work/$USER`), et rappelez-vous que `$USER` n'est pas remplacé dans les lignes `#SBATCH` : écrivez votre identifiant en entier. [hpcsub](hpcsub.md) crée ces dossiers pour vous.

### command not found {#command-not-found}

```
slurm_script: line 12: Rscript: command not found
```

**Cause** : le logiciel n'est pas chargé dans le job. Un job ne reprend pas ce que vous avez chargé dans votre terminal.

**Que faire** :

- Chargez le module dans le script. Certains modules n'apparaissent qu'après le chargement du compilateur : `module load gnu12 R/4.2.1`. Utilisez `module spider <name>` pour savoir comment charger un module.
- Pour les outils installés avec conda, chargez et activez l'environnement dans le script :

  ```bash
  module load anaconda/2025.06
  eval "$(conda shell.bash hook)"
  conda activate my_env
  ```

Voir [Modules](../../software/modules.md) et [Logiciels installés](../../software/installed.md).

### Permission denied dans un projet {#permission-denied-in-a-project}

**Causes possibles** :

1. **Vous venez d'être ajouté au projet** et votre session ne le sait pas encore. Déconnectez-vous, reconnectez-vous, puis vérifiez avec `groups` ou `id` que le projet apparaît.
2. **Des fichiers ont été copiés avec leurs droits d'origine** (`cp -p`, `cp -a`, `rsync -a`, ou `mv` depuis un dossier personnel) : l'équipe ne peut ni les lire ni les modifier. Le propriétaire des fichiers corrige avec :

   ```bash
   chmod -R g+rwX /projects/malaria/my_folder
   ```

   À l'avenir, copiez dans les projets avec `cp -r` ou `rsync -rlt`.
3. **Vous n'êtes pas membre du sous-projet** dont vous essayez d'utiliser le dossier. Demandez à l'admin du projet.
4. **Vous écrivez dans une zone en lecture seule** : `data/raw/` et `/references` sont en lecture seule pour tous. Écrivez vos sorties dans `results/`, `work/` ou votre scratch.

Voir [Bonnes pratiques du système de fichiers](../../good-conduct/file-system.md).

### Illegal instruction {#illegal-instruction}

**Cause** : le programme a été compilé sur le nœud de connexion avec `-march=native`. Le nœud de connexion (Intel) gère l'AVX-512, mais pas les nœuds de calcul (AMD).

**Que faire** : recompilez dans un job sur un nœud de calcul, ou sur le nœud de connexion avec `-march=znver3` ou `-mavx2`. Voir [Nos nœuds](nodes.md#login-node-avx-512-vs-compute-nodes-avx2).

### Erreurs dans le script {#script-errors}

| Symptôme | Que faire |
|----------|-----------|
| `No such file or directory` | Vérifiez les chemins : utilisez des chemins absolus, et rappelez-vous que le job démarre dans le dossier `--chdir` (ou celui d'où vous avez soumis) |
| `$'\r': command not found` | Le script a été édité sous Windows. Convertissez-le : `sed -i 's/\r$//' script.sh` |
| Erreur de syntaxe | Testez le script avec `bash -n script.sh` avant de le soumettre |
| Segmentation fault | Souvent un bogue ou une mauvaise combinaison de modules ; reproduisez sur une petite entrée en session interactive |

---

## Le job s'arrête en cours de route {#the-job-stops-during-the-run}

### Manque de mémoire {#out-of-memory}

`sacct` affiche `OUT_OF_MEMORY`, ou le fichier `.err` mentionne `oom-kill`.

**Que faire** : comparez `MaxRSS` (dans `sacct`) ou « Memory Utilized » (dans `seff`) à votre demande, et augmentez `--mem` avec une marge. Vérifiez aussi que le programme n'écrit pas de gros fichiers temporaires dans `/tmp`, qui est en mémoire sur les nœuds : envoyez-les dans votre scratch.

### Durée maximale atteinte {#time-limit-reached}

`sacct` affiche `TIMEOUT`, et le journal contient `DUE TO TIME LIMIT`.

**Que faire** : augmentez `--time` dans la limite de votre QOS, vérifiez que votre programme utilise réellement les CPU réservés (`seff`), et découpez les longues analyses en étapes (job arrays, `--dependency`) pour ne pas recalculer une étape déjà terminée. Voir [Écrire des scripts de job](job-scripts.md#splitting-long-analyses-into-steps).

---

## Mon job bloque un nœud entier {#my-job-blocks-a-whole-node}

Si vous avez oublié `--mem`, votre job réserve toute la mémoire d'un nœud (512 Go), même s'il n'utilise que quelques gigaoctets : aucun autre job ne peut démarrer sur ce nœud. Vérifiez avec :

```bash
sacct -j <jobid> --format=JobID,ReqMem,MaxRSS,AllocCPUS
```

Si `ReqMem` est énorme par rapport à `MaxRSS`, annulez le job s'il vient de démarrer (`scancel <jobid>`) et soumettez-le à nouveau avec une `--mem` mesurée. Vérifiez aussi que votre programme n'utilise que les threads réservés (`$SLURM_CPUS_PER_TASK`) : un programme qui lance 128 threads sur 8 CPU réservés ralentit ses voisins. Voir [Nos nœuds](nodes.md).

---

## Astuces de débogage {#debugging-tips}

Ajoutez des informations à votre script :

```bash
set -euo pipefail                 # s'arrêter à la première erreur
set -x                            # afficher chaque commande avant de l'exécuter
echo "Start: $(date) on $(hostname)"
module list
```

Testez en interactif sur un nœud de calcul, avec la QOS `debug` :

```bash
srun --account=malaria --qos=debug --time=00:30:00 --cpus-per-task=2 --mem=4G --pty bash
```

---

## Toujours bloqué ? {#still-stuck}

Si vous travaillez dans un projet, demandez d'abord à l'admin de votre projet : il voit les jobs du projet. Sinon, contactez le support, <Var name="supportEmail" link /> ou un ticket sur <Var name="supportPortal" link />, avec :

- le numéro du job et la sortie de `sacct -j <jobid>` ;
- le chemin de votre script de job ;
- le contenu du fichier `.err` (ou son chemin) ;
- ce que vous avez déjà essayé.

### Ressources {#resources}

- [Codes de sortie des jobs Slurm](https://slurm.schedmd.com/job_exit_code.html)
- [Questions fréquentes](../../support/faq.md)
