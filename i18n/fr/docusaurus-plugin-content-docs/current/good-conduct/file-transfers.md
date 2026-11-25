---
title: Guide de transfert de fichiers
sidebar_position: 5
sidebar_label: "Guide de transfert de fichiers"
---

Les fichiers sont transférés vers et depuis le cluster via le nœud de connexion, <Var name="loginHost" code />, avec `scp`, `rsync` ou `sftp`. Suivez ces consignes pour transférer efficacement sans surcharger le nœud de connexion ni le stockage partagé.

:::info Depuis le réseau de l'institut uniquement
Le cluster n'est joignable que depuis le réseau de l'institut IGH (voir [Se connecter](../getting-started/connecting.md)). Lancez les commandes ci-dessous depuis un ordinateur connecté à ce réseau. Dans les exemples, remplacez `<login>` par votre identifiant IGH.
:::

## Méthodes de transfert {#transfer-methods}

| Méthode | Idéale pour | Exemple |
|---------|-------------|---------|
| `scp` | Fichiers isolés, petits dossiers | `scp file.txt <login>@acegid-hpc-01:~/` |
| `rsync` | Gros dossiers, transferts reprenables, synchronisation | `rsync -rltvz dir/ <login>@acegid-hpc-01:/projects/malaria/shared/dir/` |
| `sftp` | Transferts interactifs | `sftp <login>@acegid-hpc-01` |

## Transférer vers un projet {#transferring-into-a-project}

Les fichiers d'un dossier de projet doivent garder les droits du projet pour que toute l'équipe puisse les utiliser. **Vers un projet, utilisez `rsync -rlt`, pas `rsync -a`** : `-a` copie aussi les droits et le groupe de votre propre ordinateur, et vos collègues risquent alors d'obtenir `Permission denied`.

```bash
# BON : vers un dossier de projet
rsync -rltvz my_data/ <login>@acegid-hpc-01:/projects/malaria/shared/my_data/

# À ÉVITER vers un projet : conserve vos droits et votre groupe locaux
rsync -avz my_data/ <login>@acegid-hpc-01:/projects/malaria/shared/my_data/
```

Si c'est déjà arrivé, voir [Copier des fichiers dans un projet](file-system.md#copying-into-a-project) pour corriger les droits.

:::tip Runs de séquençage
Inutile de téléverser les runs de séquençage bruts dans votre projet : ils sont mis à disposition dans le dossier `data/raw/` du projet (voir [Données de séquençage brutes](../hardware/storage.md#raw-data)).
:::

## Nombreux petits fichiers : archiver d'abord {#small-file-transfer-best-practices}

### Archiver avant de transférer {#archive-before-transferring}

Transférer des milliers de petits fichiers un par un est très lent et sollicite fortement le stockage partagé. Archivez-les d'abord :

```bash
# Sur votre ordinateur, avant le transfert
tar -czf my_data.tar.gz my_data_directory/

# Transférer l'archive unique
scp my_data.tar.gz <login>@acegid-hpc-01:/scratch/malaria/<login>/

# Sur le cluster, extraire l'archive
cd /scratch/malaria/<login>
tar -xzf my_data.tar.gz
```

### Pourquoi les archives sont préférables {#why-archives-are-better}

| Approche | 10 000 fichiers de 1 Ko | Vitesse |
|----------|-------------------------|---------|
| Transferts individuels | 10 000 opérations | Très lent |
| Une archive tar | 1 opération | Rapide |

Chaque fichier a un coût fixe (métadonnées, droits, allers-retours réseau). Une archive en supprime l'essentiel.

## Transferts de gros fichiers {#large-file-transfers}

### Utiliser rsync (recommandé) {#using-rsync-recommended}

`rsync` est le meilleur outil pour les gros transferts car il :

- reprend les transferts interrompus ;
- ne transfère que ce qui a changé ;
- peut compresser les données pendant le transfert.

```bash
# Téléverser un dossier dans votre projet
rsync -rltvz local_dir/ <login>@acegid-hpc-01:/projects/malaria/shared/local_dir/

# Reprendre un transfert interrompu
rsync -rltvz --partial local_dir/ <login>@acegid-hpc-01:/projects/malaria/shared/local_dir/

# Afficher la progression pour un gros fichier
rsync -rltvz --progress large_file.dat <login>@acegid-hpc-01:/scratch/malaria/<login>/
```

### Les options de rsync {#rsync-options-explained}

| Option | Signification |
|--------|---------------|
| `-r` | Récursif (dossiers) |
| `-l` | Copier les liens symboliques comme des liens |
| `-t` | Conserver les dates de modification |
| `-v` | Affichage détaillé |
| `-z` | Compresser pendant le transfert |
| `--partial` | Garder les fichiers partiellement transférés |
| `--progress` | Afficher la progression |
| `-a` | Mode archive : `-rlt` **plus** droits, groupe et propriétaire. À ne pas utiliser vers un projet |

### Utiliser scp {#using-scp}

Pour des transferts simples et ponctuels :

```bash
# Un fichier vers votre dossier personnel
scp myfile.txt <login>@acegid-hpc-01:~/

# Un dossier (récursif)
scp -r my_directory/ <login>@acegid-hpc-01:/scratch/malaria/<login>/

# Avec compression
scp -C large_file.dat <login>@acegid-hpc-01:/scratch/malaria/<login>/
```

N'utilisez pas `scp -p` vers un projet : comme `rsync -a`, il conserve vos droits locaux.

### Utiliser sftp {#using-sftp}

```bash
sftp <login>@acegid-hpc-01
sftp> cd /projects/malaria/shared
sftp> put my_file.txt
sftp> get results.tar.gz
sftp> exit
```

## Transferts en parallèle {#concurrent-transfer-limits}

:::warning Peu de transferts à la fois
Tous les transferts passent par le nœud de connexion. Ne lancez pas de nombreux transferts en parallèle : quelques-uns à la fois suffisent.
:::

```bash
# MAUVAIS : de nombreux transferts en parallèle
for i in {1..10}; do
    scp file_$i.dat <login>@acegid-hpc-01:/scratch/malaria/<login>/ &
done

# BON : tout archiver, puis transférer une seule fois
tar -cf data.tar *.dat
scp data.tar <login>@acegid-hpc-01:/scratch/malaria/<login>/
```

## Rapatrier ses résultats {#transferring-results-back}

### Archiver les résultats avant de les télécharger {#archive-results-before-downloading}

```bash
# Sur le cluster, préparer les résultats
cd /projects/malaria/results/<login>
tar -czf run42_results.tar.gz run42/

# Depuis votre ordinateur
scp <login>@acegid-hpc-01:/projects/malaria/results/<login>/run42_results.tar.gz ./
```

### Synchronisation sélective avec rsync {#selective-sync-with-rsync}

Ne télécharger que les fichiers nouveaux ou modifiés :

```bash
# Synchroniser les résultats vers votre ordinateur
rsync -rltvz <login>@acegid-hpc-01:/projects/malaria/results/<login>/ ./local_results/
```

## Conseils par situation {#transfer-tips-by-scenario}

### Téléverser vos scripts {#scenario-upload-code-repository}

```bash
# rsync avec exclusions
rsync -rltvz --exclude='.git' --exclude='__pycache__' \
    my_scripts/ <login>@acegid-hpc-01:/projects/malaria/scripts/my_scripts/
```

Mieux encore : gardez vos scripts dans un dépôt git et faites `git clone` / `git pull` dans `/projects/malaria/scripts`.

### Téléverser un gros jeu de données {#scenario-upload-large-dataset}

```bash
rsync -rltvz --partial --progress large_dataset.tar.gz \
    <login>@acegid-hpc-01:/scratch/malaria/<login>/
```

### Nombreux petits fichiers de sortie {#scenario-many-small-output-files}

```bash
# Sur le cluster, archiver les sorties
cd /scratch/malaria/<login>/simulation
tar -czf outputs.tar.gz output_dir/

# Depuis votre ordinateur, télécharger et extraire
scp <login>@acegid-hpc-01:/scratch/malaria/<login>/simulation/outputs.tar.gz ./
tar -xzf outputs.tar.gz
```

## À éviter {#what-to-avoid}

| À éviter | À faire plutôt |
|----------|----------------|
| Transférer plus de 10 000 petits fichiers un par un | Archiver d'abord, puis transférer |
| Utiliser `rsync -a` ou `scp -p` vers un projet | Utiliser `rsync -rlt` |
| Téléverser des données de séquençage brutes ou des bases de référence | Utiliser `data/raw/` et `/references` |
| Lancer de nombreux transferts en parallèle | Quelques transferts à la fois |
| Laisser dans le scratch la seule copie des données transférées | Garder l'important dans `/projects/<project>/results` |

## Vérifier un transfert {#checking-transfer-success}

```bash
# Sur votre ordinateur : calculer une somme de contrôle
md5sum large_file.dat > large_file.dat.md5

# Transférer les deux fichiers
scp large_file.dat large_file.dat.md5 <login>@acegid-hpc-01:/scratch/malaria/<login>/

# Sur le cluster : vérifier
cd /scratch/malaria/<login>
md5sum -c large_file.dat.md5
```
