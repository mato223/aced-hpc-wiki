---
id: faq
title: Foire aux questions
sidebar_label: "FAQ"
sidebar_position: 1
---

# Foire aux questions {#frequently-asked-questions}

## Accès et projets {#access-and-projects}

**Comment obtenir un accès au cluster ?**
Ouvrez un ticket sur <Var name="supportPortal" link /> en expliquant pourquoi vous avez besoin du HPC et sur quel(s) projet(s) vous travaillez. Vous vous connectez avec votre compte institutionnel IGH. Voir [Obtenir un accès](../getting-started/accounts.md).

**Je n'arrive pas à me connecter en SSH. Que vérifier ?**

1. Vous êtes sur le **réseau de l'institut** : le cluster n'est pas joignable de l'extérieur.
2. Vous utilisez le bon nom d'hôte, <Var name="loginHost" code />, et votre identifiant IGH.
3. Votre accès a été accordé (vous avez reçu une réponse à votre ticket).
4. Lancez `ssh -v <login>@acegid-hpc-01` et envoyez la sortie au support si cela échoue encore.

**J'ai été ajouté à un projet mais j'obtiens `Permission denied` sur son dossier.**
Déconnectez-vous puis reconnectez-vous : un nouvel accès à un projet n'est pris en compte que dans une nouvelle session. Vérifiez ensuite avec `groups`.

**Comment rejoindre un autre projet ou sous-projet ?**
Ouvrez un ticket en indiquant le projet. L'admin de projet valide la demande. Voir [Projets, sous-projets et rôles](../getting-started/projects.md).

**Un collègue ne peut pas modifier des fichiers que j'ai copiés dans le projet.**
Les fichiers ont gardé leurs droits d'origine (`cp -a`, `cp -p`, `rsync -a` ou `mv` depuis votre home). Corrigez avec `chmod -R g+rwX` sur le dossier, et copiez avec `cp -r` ou `rsync -rlt` la prochaine fois. Voir [Droits sur les fichiers d'un projet](../getting-started/projects.md#file-permissions).

---

## Jobs et Slurm {#jobs-and-slurm}

**Quel compte indiquer dans mon job ?**
Le compte Slurm de votre projet, par exemple `#SBATCH --account=malaria`, ou `malaria_<sub-project>` pour un sous-projet. Il est obligatoire. Listez les vôtres avec :

```bash
sacctmgr show assoc user=$USER format=account,qos
```

**Quelle QOS utiliser ?**

| QOS | Pour | Durée maximale |
|---|---|---|
| `normal` (par défaut) | La plupart des jobs | <Var name="qosNormalMaxDays" /> jours |
| `debug` | Tests rapides, démarre plus vite | <Var name="qosDebugMaxHours" /> heure |
| `long` | Jobs longs, sur demande (ticket) | <Var name="qosLongMaxDays" /> jours |
| `urgent` | Accordée temporairement pour une échéance | <Var name="qosUrgentMaxDays" /> jours |

Ces limites peuvent évoluer. Un job qui dépasse une limite est refusé dès la soumission, avec un message. Voir [Bases de Slurm](../tutorials/running-jobs/slurm-basics.md).

**Pourquoi mon job reste-t-il en attente ?**
Regardez la dernière colonne (`NODELIST(REASON)`) :

```bash
squeue --me
```

`Resources` signifie que les nœuds sont occupés ; `Priority`, que d'autres jobs passent avant le vôtre ; une raison `QOS...Limit`, que vous avez atteint une limite de votre QOS (par exemple le nombre de jobs en cours sur `debug`). Des demandes plus petites et réalistes (`--time`, `--mem`, `--cpus-per-task`) démarrent plus tôt.

**Mon job s'est arrêté. Comment savoir pourquoi ?**

```bash
sacct -j <jobid> --format=JobID,JobName,State,ExitCode,MaxRSS,Elapsed,Timelimit
seff <jobid>
```

- `OUT_OF_MEMORY` ou `oom_kill` dans le journal : le job avait besoin de plus que `--mem`. Augmentez-la.
- `TIMEOUT` : le job a atteint son `--time`. Demandez plus de temps, ou découpez le travail en étapes.
- `FAILED` : lisez le fichier `.err` du job.

**Combien de mémoire demander ?**
Faites un test sur un petit jeu de données, regardez `MaxRSS` dans `sacct` ou la sortie de `seff <jobid>`, puis demandez environ 20 % de plus. **Précisez toujours `--mem`** : sans elle, le job réserve toute la mémoire d'un nœud. Réserver beaucoup de mémoire prive aussi les autres de CPU : 500 Go avec 8 CPU occupent un nœud entier.

**Comment utiliser plusieurs CPU ?**
Demandez-les avec `--cpus-per-task` et **indiquez le même nombre à votre logiciel** :

```bash
#SBATCH --cpus-per-task=8
bwa mem -t $SLURM_CPUS_PER_TASK ...
```

Sur nos nœuds, 1 cœur physique = 2 CPU Slurm (hyperthreading). Voir [Bonnes pratiques de soumission](../good-conduct/job-submission.md).

**Puis-je lancer des choses sur le nœud de connexion ?**
Seulement des tâches légères : édition, transferts de fichiers, petites compilations, soumission et suivi des jobs. Tout le reste passe par Slurm. Voir [Bonnes pratiques sur le nœud de connexion](../good-conduct/login-nodes.md).

**Comment obtenir une session interactive ?**

```bash
salloc --account=malaria --qos=debug --cpus-per-task=2 --mem=4G --time=00:30:00
```

Tapez `exit` quand vous avez fini pour libérer les ressources.

**Comment annuler un job ?**

```bash
scancel <jobid>            # un job
scancel -u $USER           # tous vos jobs
```

---

## Logiciels {#software}

**Comment trouver et charger un logiciel ?**

```bash
module avail               # modules disponibles maintenant
module spider <name>       # rechercher parmi tous les modules
module load gnu12 R/4.2.1  # charger R (nécessite le module de compilateur gnu12)
module list                # modules chargés
```

Voir [Logiciels installés](../software/installed.md) et [Modules](../software/modules.md).

**Où sont les outils de bio-informatique ?**
Il n'y a pas encore de modules de bio-informatique. Installez-les avec conda (`module load anaconda/2025.06`) dans votre home, ou dans `/projects/<project>/` pour les partager avec votre équipe, ou demandez-les par ticket. Voir [Installer vos propres logiciels](../software/custom-install.md).

**Puis-je utiliser des conteneurs ?**
Charliecloud est disponible en module. Apptainer/Singularity n'est pas encore disponible. Voir [Conteneurs sur le HPC](../tutorials/containers/containers-hpc.md).

**Mon programme plante avec `Illegal instruction`.**
Il a probablement été compilé sur le nœud de connexion avec `-march=native`. Le nœud de connexion (Intel) possède des instructions que les nœuds de calcul (AMD) n'ont pas. Compilez dans un job sur un nœud de calcul, ou utilisez `-march=znver3`. Voir [Dépannage](../tutorials/running-jobs/troubleshooting.md).

---

## Fichiers et stockage {#files-and-storage}

**Où mettre mes données ?**

| Emplacement | Usage | Sauvegardé |
|---|---|---|
| `$HOME` | Scripts, configuration | Oui |
| `/projects/<project>` | Données et résultats du projet | Oui, sauf `work/` |
| `/scratch/<project>/<login>` | Calculs en cours, gros fichiers temporaires | Non |
| `/references` | Génomes et bases de référence partagés (lecture seule) | — |

Voir [Stockage](../hardware/storage.md).

**Mes fichiers sont-ils sauvegardés ?**
Le home, les dossiers de projet (sauf `work/`) et les données brutes de séquençage sont sauvegardés. **Le scratch n'est jamais sauvegardé.** Gardez votre propre copie de tout ce qui est irremplaçable.

**Que deviennent les fichiers du scratch ?**
Les fichiers non utilisés depuis <Var name="scratchPurgeDays" /> jours sont supprimés automatiquement, avec un préavis de <Var name="scratchNoticeDays" /> jours. Les fichiers supprimés **ne peuvent pas être récupérés** : copiez ce que vous voulez garder dans `/projects/<project>/results`.

**Comment copier des données vers le cluster ?**
Depuis le réseau de l'institut, avec `scp`, `rsync` ou `sftp`. Vers un dossier de projet, utilisez `rsync -rlt` (pas `-a`) :

```bash
rsync -rlt --progress my_data/ <login>@acegid-hpc-01:/projects/malaria/results/<login>/
```

Voir [Transferts de fichiers](../good-conduct/file-transfers.md).

**J'ai besoin d'une base de référence (Kraken2, BLAST…).**
Regardez d'abord dans `/references`. Si elle n'y est pas, demandez-la par ticket plutôt que d'en télécharger votre propre copie.

**Comment voir l'espace que j'utilise ?**
L'espace occupé est suivi par utilisateur et par projet. Restez raisonnable : nettoyez `work/` et votre scratch, et ne dupliquez pas les données. Pour repérer les gros dossiers :

```bash
du -sh ~/* | sort -rh | head -20
```
