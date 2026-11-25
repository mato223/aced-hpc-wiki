---
id: linux-intro
title: Introduction à Linux pour les utilisateurs du HPC
sidebar_label: "Introduction à Linux"
sidebar_position: 1
---

# Introduction à Linux pour les utilisateurs du HPC

Ce tutoriel s'adresse aux chercheurs à l'aise avec un ordinateur personnel (Windows ou macOS) mais qui découvrent le cluster HPC de l'IGH. Sur votre ordinateur, vous cliquez sur des icônes et parcourez des dossiers ; sur le cluster, vous tapez des commandes. Ce guide vous accompagne pas à pas dans ce changement.

À la fin, vous saurez vous déplacer dans le stockage du cluster, gérer fichiers et dossiers, partager des fichiers avec l'équipe de votre projet et écrire un script Bash simple.

:::info Prérequis
Il vous faut un compte IGH, être membre d'au moins un projet et pouvoir vous connecter en SSH depuis le réseau de l'institut. Voir [Comptes](../../getting-started/accounts.md) et [Se connecter au cluster](../../getting-started/connecting.md).
:::

---

## 1. Pourquoi le cluster tourne sous Linux {#1-why-the-cluster-runs-linux}

Le cluster HPC de l'IGH fonctionne sous **Linux**, comme presque tous les supercalculateurs et serveurs du monde :

- **Stabilité et performances** : Linux gère bien de nombreux utilisateurs simultanés et des traitements longs.
- **La ligne de commande** : vous décrivez précisément ce que l'ordinateur doit faire. Les commandes peuvent être enregistrées dans des scripts, rejouées et partagées, ce qui rend vos analyses reproductibles.
- **Les logiciels** : la plupart des outils scientifiques et bio-informatiques sont d'abord écrits pour Linux.

Quand vous vous connectez en SSH, vous arrivez dans un **terminal** : une fenêtre texte où vous tapez des commandes et lisez leur résultat. Il n'y a ni bureau ni explorateur de fichiers.

---

## 2. L'invite de commande {#2-the-terminal-prompt}

Vous vous connectez au nœud de connexion, <Var name="loginHost" code />, depuis le réseau de l'institut :

```bash
ssh <login>@acegid-hpc-01
```

Une fois connecté, vous voyez une **invite** de ce type :

```
[<login>@acegid-hpc-01 ~]$
```

| Élément | Signification |
|---------|---------------|
| `<login>` | Votre identifiant IGH |
| <Var name="loginHost" code /> | La machine sur laquelle vous êtes : le nœud de connexion |
| `~` | Votre dossier courant (`~` désigne votre dossier personnel) |
| `$` | Vous êtes un utilisateur normal |

Ce que vous tapez s'affiche après le `$`. Quand vous appuyez sur **Entrée**, le shell exécute votre commande.

:::warning Le nœud de connexion ne sert pas à calculer
Le nœud de connexion est partagé par tous. Servez-vous-en pour éditer des fichiers, organiser vos données et soumettre des jobs. Toute analyse s'exécute sur les nœuds de calcul via Slurm : voir [Les bases de Slurm](../running-jobs/slurm-basics.md) et [Utiliser le nœud de connexion](../../good-conduct/login-nodes.md).
:::

### Vos premières commandes {#your-first-commands}

```bash
whoami      # votre identifiant
id          # votre identifiant et les groupes (projets) dont vous êtes membre
groups      # uniquement la liste de vos groupes
```

Sur le cluster de l'IGH, chaque projet (et sous-projet) est un groupe. Si un projet auquel vous venez d'être ajouté n'apparaît pas dans `groups`, déconnectez-vous puis reconnectez-vous.

---

## 3. Le système de fichiers Linux {#3-the-linux-filesystem}

Sous Windows, les fichiers sont sur des lecteurs comme `C:\`. Sous Linux, tout est rangé dans une seule arborescence qui commence à la **racine**, notée `/`. Les espaces de stockage que vous utiliserez sur le cluster sont :

```
$HOME                          # votre dossier personnel privé
/projects/malaria/             # dossier partagé du projet "malaria"
├── data/raw/                  # données de séquençage brutes (liens, lecture seule)
├── data/ref/                  # références propres au projet
├── scripts/                   # scripts et pipelines
├── results/                   # résultats (un sous-dossier par personne)
├── shared/                    # échanges entre membres
└── work/                      # fichiers intermédiaires (non sauvegardé)
/scratch/malaria/<login>/      # votre espace temporaire rapide pour le projet
/references/                   # génomes et bases partagés (lecture seule)
```

### Les dossiers importants sur le cluster de l'IGH {#the-directories-that-matter-on-the-igh-cluster}

| Emplacement | Contenu | Sauvegardé |
|-------------|---------|------------|
| `$HOME` | Vos scripts, fichiers de configuration, environnements conda. Pas de gros jeux de données. | Oui |
| `/projects/malaria` (ou `/projects/malaria/<sub-project>`) | Les données et résultats du projet, partagés avec l'équipe | Oui, sauf `work/` |
| `/scratch/malaria/<login>` | Calculs en cours et gros fichiers temporaires | Non |
| `/references` | Génomes et bases de référence, versionnés (par exemple `/references/kraken2/2026-11`) | Lecture seule |

:::caution Le scratch est nettoyé automatiquement
Les fichiers du scratch non utilisés depuis <Var name="scratchPurgeDays" /> jours sont supprimés, avec un préavis de <Var name="scratchNoticeDays" /> jours. Un fichier effacé est irrécupérable : copiez ce que vous voulez garder dans `/projects/malaria/results`.
:::

L'espace occupé est suivi par utilisateur et par projet : nettoyez `work/` et votre scratch, et ne dupliquez pas les données. Voir [Stockage](../../hardware/storage.md) et [Bonnes pratiques du système de fichiers](../../good-conduct/file-system.md) pour les détails, et [Projets, sous-projets et rôles](../../getting-started/projects.md) pour l'organisation des projets.

---

## 4. Se déplacer dans le système de fichiers {#4-navigating-the-filesystem}

### Où suis-je ? {#where-am-i}

```bash
pwd
```

`pwd` (**print working directory**) affiche le chemin complet du dossier où vous êtes. Juste après la connexion, c'est votre dossier personnel.

### Que contient ce dossier ? {#what-is-in-this-directory}

```bash
ls          # lister le dossier courant
ls -l       # format long : droits, propriétaire, groupe, taille, date
ls -lh      # idem, avec des tailles lisibles (K, M, G)
ls -a       # afficher aussi les fichiers cachés (commençant par un point)
ls -lh /projects/malaria   # lister un autre dossier sans s'y rendre
```

### Se déplacer {#moving-around}

```bash
cd /projects/malaria       # aller dans le dossier du projet
cd results                 # entrer dans un sous-dossier
cd ..                      # remonter d'un niveau
cd -                       # revenir au dossier précédent
cd                         # revenir dans votre dossier personnel (comme cd ~)
```

### Chemins absolus et relatifs {#paths-absolute-vs-relative}

Un **chemin absolu** commence par `/` et fonctionne depuis n'importe où :

```
/projects/malaria/data/raw/run01/sample01.fastq.gz
```

Un **chemin relatif** part de votre dossier courant :

```
data/raw/run01/sample01.fastq.gz    # ne fonctionne que depuis /projects/malaria
```

`.` désigne « le dossier courant » et `..` « le niveau au-dessus ». Dans les scripts de job, préférez les chemins absolus : le job peut démarrer dans un autre dossier que celui où vous êtes.

---

## 5. Créer et gérer fichiers et dossiers {#5-creating-and-managing-files-and-directories}

### Créer des dossiers {#creating-directories}

```bash
mkdir analysis                        # créer un dossier ici
mkdir -p analysis/run1/output         # créer des dossiers imbriqués en une fois
```

`-p` crée les dossiers parents manquants.

### Créer des fichiers {#creating-files}

```bash
touch notes.txt       # créer un fichier vide (ou mettre à jour sa date)
nano notes.txt        # l'éditer dans un éditeur simple (Ctrl+O pour enregistrer, Ctrl+X pour quitter)
```

### Copier fichiers et dossiers {#copying-files-and-directories}

```bash
cp notes.txt notes_backup.txt         # copier un fichier
cp -r analysis/ analysis_backup/      # copier un dossier (-r : récursif)
```

### Déplacer et renommer {#moving-and-renaming}

```bash
mv notes.txt archive/notes.txt        # déplacer un fichier dans un dossier
mv old_name.txt new_name.txt          # renommer un fichier
```

### Supprimer fichiers et dossiers {#deleting-files-and-directories}

```bash
rm notes.txt                          # supprimer un fichier
rm -r analysis_backup/                # supprimer un dossier et tout son contenu
```

:::danger rm est définitif
Linux n'a pas de corbeille. Un fichier supprimé avec `rm` disparaît immédiatement. Vérifiez ce que vous supprimez avant d'appuyer sur Entrée.
:::

### Exercice pratique : préparer vos dossiers {#practical-exercise-prepare-your-folders}

Créez votre dossier de résultats personnel dans le projet, et votre dossier de scratch :

```bash
mkdir -p /projects/malaria/results/$USER/{qc,alignment,logs}
mkdir -p /scratch/malaria/$USER
ls /projects/malaria/results/$USER
```

`{qc,alignment,logs}` est une **expansion d'accolades** : Bash la transforme en trois noms de dossiers, créés en une seule fois. `$USER` est remplacé par votre identifiant.

---

## 6. Afficher et rechercher dans les fichiers {#6-viewing-and-searching-file-contents}

### Afficher un fichier {#displaying-file-contents}

```bash
cat samples.txt           # afficher tout le fichier
head -20 samples.txt      # les 20 premières lignes
tail -20 samples.txt      # les 20 dernières lignes
tail -f job.out           # suivre un fichier qui grossit (pratique pour les journaux de job)
```

### Parcourir un gros fichier {#scrolling-through-a-large-file}

```bash
less samples.txt
zless sample01.fastq.gz   # idem pour un fichier compressé
```

Utilisez les flèches ou Page préc./suiv. pour défiler, `/` pour chercher, `q` pour quitter.

### Compter lignes et mots {#counting-lines-and-words}

```bash
wc -l samples.txt         # compter les lignes
wc -w samples.txt         # compter les mots
```

### Rechercher dans des fichiers {#searching-inside-files}

```bash
grep "ERROR" job.out                       # lignes contenant "ERROR"
grep -i "warning" job.out                  # recherche sans tenir compte de la casse
grep -r "sample01" /projects/malaria/scripts/   # chercher dans tout un dossier
```

---

## 7. Les droits sur les fichiers {#7-file-permissions}

Chaque fichier et dossier a un **propriétaire**, un **groupe** et des droits qui disent qui peut le lire, le modifier ou l'exécuter. `ls -l` les affiche :

```
-rw-rw-r-- 1 <login> malaria 4.2K Nov 20 10:23 notes.txt
drwxrws--- 3 <login> malaria 4.0K Nov 20 10:30 results/
```

```
- rw- rw- r--
│  │   │   └── others: read only
│  │   └────── group (the project): read and write
│  └────────── owner: read and write
└───────────── type (- = file, d = folder)
```

Ci-dessus : propriétaire (owner) en lecture/écriture, groupe du projet (group) en lecture/écriture, autres (others) en lecture seule ; le premier caractère indique le type (`-` = fichier, `d` = dossier). **r** = lecture, **w** = écriture, **x** = exécution (pour un dossier : y entrer). `-` signifie « non accordé ».

### Projets et groupes {#projects-and-groups}

Sur le cluster de l'IGH, l'accès aux dossiers d'un projet passe par son groupe : quand vous êtes ajouté au projet `malaria`, vous devenez membre de son groupe et pouvez travailler dans `/projects/malaria`. Vérifiez vos projets avec :

```bash
id
groups
```

Dans un dossier de projet, les nouveaux fichiers appartiennent automatiquement au projet et sont modifiables par toute l'équipe. Certaines commandes de copie conservent les droits d'origine de vos fichiers et cassent cette règle :

| À utiliser | À éviter |
|------------|----------|
| `cp -r my_folder /projects/malaria/...` | `cp -p`, `cp -a` |
| `rsync -rlt my_folder /projects/malaria/...` | `rsync -a` |
| | `mv` depuis votre dossier personnel |

Si un collègue obtient `Permission denied` sur des fichiers que vous avez mis dans le projet, donnez au groupe les droits de lecture et d'écriture :

```bash
chmod -R g+rwX /projects/malaria/my_folder
```

`g+rwX` ajoute la lecture et l'écriture pour le groupe, et l'exécution seulement sur les dossiers (et les fichiers déjà exécutables).

### Rendre un script exécutable {#making-a-script-executable}

```bash
chmod +x myscript.sh      # ajouter le droit d'exécution
./myscript.sh             # le lancer
```

---

## 8. Les variables d'environnement {#8-environment-variables}

Le shell garde des réglages dans des **variables d'environnement**, écrites en MAJUSCULES et lues avec un `$` :

```bash
echo $HOME       # votre dossier personnel
echo $USER       # votre identifiant
echo $PATH       # dossiers où le shell cherche les programmes
```

Vous pouvez définir les vôtres :

```bash
export PROJECT=/projects/malaria
export MYSCRATCH=/scratch/malaria/$USER
ls $PROJECT
cd $MYSCRATCH
```

Ces variables ne durent que le temps de la session. Pour les conserver, ajoutez les lignes `export` à votre fichier `~/.bashrc`.

---

## 9. Scripts Bash : un exemple pratique {#9-bash-scripting-a-practical-example}

Un **script Bash** est un fichier texte contenant une suite de commandes. Vous les écrivez une fois et les relancez autant de fois que nécessaire : c'est la base d'un travail HPC reproductible.

### Le problème {#the-practical-problem}

Un pipeline produit un fichier journal par échantillon. À la fin d'un run, vous voulez :

1. lister chaque échantillon et indiquer s'il a réussi ou échoué ;
2. déplacer les journaux en échec dans un dossier à part ;
3. compter les réussites et les échecs.

### Écrire le script {#writing-the-script}

Créez un dossier d'exercice dans votre scratch :

```bash
mkdir -p /scratch/malaria/$USER/bash_tutorial/logs
cd /scratch/malaria/$USER/bash_tutorial
```

Générez quelques journaux fictifs :

```bash
for sample in sample_001 sample_002 sample_003 sample_004 sample_005; do
    echo "Processing $sample..." > logs/${sample}.log
done

# Simuler deux échecs
echo "ERROR: alignment failed" >> logs/sample_003.log
echo "ERROR: out of memory"    >> logs/sample_005.log
```

Ouvrez un nouveau fichier avec `nano` :

```bash
nano summarize_run.sh
```

Collez le script ci-dessous, puis appuyez sur `Ctrl+O` pour enregistrer et `Ctrl+X` pour quitter.

```bash
#!/usr/bin/env bash
# summarize_run.sh
# Vérifie chaque journal d'échantillon et produit un rapport de synthèse.

# --- Configuration ---
LOG_DIR="logs"
FAILED_DIR="failed_logs"
REPORT="run_summary.txt"

# --- Préparation ---
mkdir -p "$FAILED_DIR"
> "$REPORT"   # vider le rapport s'il existe déjà

passed=0
failed=0

echo "============================" >> "$REPORT"
echo "  Run Summary Report"        >> "$REPORT"
echo "  $(date)"                   >> "$REPORT"
echo "============================" >> "$REPORT"
echo ""                            >> "$REPORT"

# --- Traiter chaque journal ---
for logfile in "$LOG_DIR"/*.log; do
    # Nom de l'échantillon = nom du fichier sans dossier ni .log
    sample=$(basename "$logfile" .log)

    if grep -q "ERROR" "$logfile"; then
        echo "FAILED  $sample" >> "$REPORT"
        mv "$logfile" "$FAILED_DIR/"
        ((failed++))
    else
        echo "PASSED  $sample" >> "$REPORT"
        ((passed++))
    fi
done

# --- Afficher les totaux ---
echo ""                                      >> "$REPORT"
echo "----------------------------"          >> "$REPORT"
echo "Total passed: $passed"                 >> "$REPORT"
echo "Total failed: $failed"                 >> "$REPORT"
echo "Total samples: $((passed + failed))"   >> "$REPORT"

# Afficher aussi le rapport à l'écran
cat "$REPORT"
```

### Comprendre le script {#understanding-the-script}

- **`#!/usr/bin/env bash`** : la ligne **shebang**. Elle doit être la toute première ligne et indique au système d'exécuter le fichier avec Bash.
- **Variables** : `LOG_DIR="logs"` définit une variable. Écrivez `"$LOG_DIR"` (avec les guillemets) pour l'utiliser sans risque.
- **`> "$REPORT"`** : `>` écrit dans un fichier en l'écrasant ; seul, il vide le fichier. `>>` ajoute à la fin du fichier.
- **`for logfile in "$LOG_DIR"/*.log`** : une boucle sur chaque fichier `.log` du dossier.
- **`if grep -q "ERROR" "$logfile"`** : `grep -q` cherche sans rien afficher et renvoie un succès si le mot est trouvé.
- **`basename "$logfile" .log`** : retire le dossier et le suffixe `.log`, il reste le nom de l'échantillon.
- **`((failed++))`** : calcul en Bash ; ajoute 1 à `failed`.

### Rendre le script exécutable et le lancer {#making-the-script-executable-and-running-it}

```bash
chmod +x summarize_run.sh
./summarize_run.sh
```

Vous devriez obtenir quelque chose comme :

```
============================
  Run Summary Report
  Thu Nov 20 14:32:01 WAT 2026
============================

PASSED  sample_001
PASSED  sample_002
FAILED  sample_003
PASSED  sample_004
FAILED  sample_005

----------------------------
Total passed: 3
Total failed: 2
Total samples: 5
```

Vérifiez que les journaux en échec ont été déplacés :

```bash
ls failed_logs/
```

C'est le schéma de base des scripts HPC : parcourir les entrées, vérifier ou transformer chacune, rassembler les résultats et faire un rapport. La même structure fonctionne pour des centaines d'échantillons, et vous pouvez la lancer comme job Slurm.

---

## 10. De bonnes habitudes au terminal {#10-helpful-terminal-habits}

### Complétion avec Tab {#tab-completion}

Appuyez sur **Tab** pour compléter les noms de commandes, de fichiers et de dossiers. S'il y a plusieurs possibilités, appuyez deux fois sur Tab pour les afficher.

```bash
cd /scratch/mal<Tab>       # complète en /scratch/malaria/
ls /references/kr<Tab>     # complète en /references/kraken2/
```

### Historique des commandes {#command-history}

```bash
history              # lister vos commandes précédentes, numérotées
!42                  # relancer la commande numéro 42
!!                   # relancer la dernière commande
```

La **flèche haut** fait défiler les commandes précédentes ; **Ctrl+R** cherche dans l'historique au fil de la frappe.

### Arrêter une commande {#stopping-a-command}

Appuyez sur **Ctrl+C** pour arrêter une commande en cours.

### Obtenir de l'aide {#getting-help}

```bash
man ls              # page de manuel de la commande ls
ls --help           # aide courte pour la plupart des commandes
```

---

## Aide-mémoire {#quick-reference}

| Tâche | Commande |
|-------|----------|
| Afficher le dossier courant | `pwd` |
| Lister les fichiers | `ls -lh` |
| Aller dans son dossier personnel | `cd` |
| Remonter d'un niveau | `cd ..` |
| Créer un dossier | `mkdir -p nom` |
| Copier dans un projet | `cp -r source /projects/malaria/...` |
| Déplacer ou renommer | `mv source dest` |
| Supprimer un fichier | `rm fichier` |
| Supprimer un dossier | `rm -r dossier` |
| Afficher un fichier | `less fichier` |
| Chercher dans un fichier | `grep "motif" fichier` |
| Voir mes projets | `id` ou `groups` |
| Donner l'accès à l'équipe | `chmod -R g+rwX dossier` |
| Rendre un script exécutable | `chmod +x script.sh` |
| Afficher une variable | `echo $VARIABLE` |

---

## Et ensuite ? {#whats-next}

- [Les bases de Slurm](../running-jobs/slurm-basics.md) : envoyer vos calculs sur les nœuds de calcul au lieu de les lancer sur le nœud de connexion.
- [Écrire des scripts de job](../running-jobs/job-scripts.md) : combiner vos connaissances en Bash et les directives Slurm pour lancer de vraies analyses.

---

## Références {#references}

- [Manuel de référence de GNU Bash](https://www.gnu.org/software/bash/manual/)
- [The Linux Command Line (livre gratuit)](https://linuxcommand.org/tlcl.php) de William Shotts
- [Aide-mémoire des scripts Bash](https://devhints.io/bash)
