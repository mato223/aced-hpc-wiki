---
id: custom-install
title: Installations personnalisées
sidebar_label: "Installations personnalisées"
sidebar_position: 3
---

# Installations personnalisées

Vous ne trouverez pas toujours le logiciel dont vous avez besoin parmi les [modules installés](installed.md). Vous pouvez l'installer vous-même, sans droits root, dans votre home (usage personnel) ou dans le dossier de votre projet (partagé avec votre équipe). Cette page présente quatre méthodes :

| Méthode | Idéale pour | Module |
|---------|-------------|--------|
| [Conda](#conda-environments) | Outils de bio-informatique et outils Python/R disponibles sur bioconda / conda-forge | `anaconda/2025.06` |
| [EasyBuild](#easybuild) | Logiciels scientifiques ayant une recette EasyBuild | `EasyBuild/5.3.1` |
| [Spack](#spack) | Logiciels scientifiques ayant un paquet Spack | `spack/0.22.2` |
| [Compilation depuis les sources](#compiling-from-source) | Tout le reste | `gnu12` |

Si un outil est utile à beaucoup de monde, vous pouvez aussi demander son installation : ouvrez un ticket sur <Var name="supportPortal" link />.

## Où installer {#where-to-install}

- **Outils personnels** : dans votre home (`$HOME`), qui est sauvegardé.
- **Outils partagés par une équipe** : dans le projet, par exemple `/projects/malaria/shared/` ou `/projects/malaria/scripts/`. Les fichiers créés dans un dossier de projet appartiennent au projet et sont utilisables par toute l'équipe (voir [Projets](../getting-started/projects.md)).
- **Pas** dans le scratch : il n'est pas sauvegardé et les fichiers non utilisés sont supprimés automatiquement.

:::warning Le nœud de connexion et les nœuds de calcul n'ont pas les mêmes processeurs
Le nœud de connexion <Var name="loginHost" code /> a des processeurs Intel avec AVX-512 ; les nœuds de calcul ont des processeurs AMD EPYC **sans** AVX-512. Un logiciel compilé sur le nœud de connexion avec `-march=native` (ou détecté automatiquement par Spack/EasyBuild) peut planter sur les nœuds de calcul avec `Illegal instruction`. Compilez dans un job sur un nœud de calcul, ou avec `-march=znver3` (ou `-mavx2`). Voir [Matériel](../hardware/overview.md).
:::

Les grosses compilations (EasyBuild, Spack, gros logiciels) doivent aussi se faire dans un job, pas sur le nœud de connexion : voir [Bon usage du nœud de connexion](../good-conduct/login-nodes.md).

## Environnements conda {#conda-environments}

Conda est le moyen le plus simple d'installer des outils de bio-informatique (canal **bioconda**) tant qu'il n'existe pas de modules de bio-informatique.

```bash
module load anaconda/2025.06
eval "$(conda shell.bash hook)"     # active "conda activate" dans ce shell
```

### Placer les environnements et le cache au bon endroit {#conda-locations}

Par défaut, conda place les environnements et son cache de téléchargement dans `~/.conda`. Gardez-les dans votre home, ou dans votre projet pour les environnements partagés par l'équipe. Jamais dans le scratch.

```bash
# Environnements et cache personnels, dans votre home
conda config --add envs_dirs $HOME/conda/envs
conda config --add pkgs_dirs $HOME/conda/pkgs
```

### Environnement personnel {#conda-personal-environment}

```bash
conda create -n mapping -c conda-forge -c bioconda samtools=1.21 bwa
conda activate mapping
samtools --version
conda deactivate
```

### Environnement partagé par un projet {#conda-project-environment}

Créez-le avec un chemin complet (`-p`) dans le projet pour que chaque membre puisse l'activer :

```bash
conda create -p /projects/malaria/shared/envs/mapping -c conda-forge -c bioconda samtools=1.21 bwa
conda activate /projects/malaria/shared/envs/mapping
```

Décrivez-le dans le `README.md` du projet (qui l'a créé, à quoi il sert). Exportez la liste exacte des paquets pour pouvoir le reconstruire :

```bash
conda env export -p /projects/malaria/shared/envs/mapping > /projects/malaria/scripts/mapping-env.yml
```

### Utiliser un environnement conda dans un job {#conda-in-a-job}

```bash
#!/bin/bash
#SBATCH --job-name=bwa_map
#SBATCH --account=malaria
#SBATCH --time=04:00:00
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G

module load anaconda/2025.06
eval "$(conda shell.bash hook)"
conda activate /projects/malaria/shared/envs/mapping

bwa mem -t $SLURM_CPUS_PER_TASK ref.fa reads_R1.fastq.gz reads_R2.fastq.gz > sample.sam
```

:::tip Économiser de l'espace
Nettoyez de temps en temps le cache avec `conda clean --all`, et supprimez les environnements que vous n'utilisez plus (`conda env remove -n <name>`).
:::

## EasyBuild {#easybuild}

[EasyBuild](https://docs.easybuild.io/) compile des logiciels à partir de recettes toutes prêtes (*easyconfigs*) et génère le module correspondant. Installez dans votre home (ou votre projet) avec `--prefix` :

```bash
module load EasyBuild/5.3.1
eb --search SAMtools                      # chercher les recettes disponibles
```

Lancez la compilation elle-même dans un job sur un nœud de calcul (elle peut être longue et compile au besoin sa propre chaîne de compilation) :

```bash
srun --account=malaria --cpus-per-task=8 --mem=16G --time=04:00:00 --pty bash
module load EasyBuild/5.3.1
eb --prefix=$HOME/easybuild --parallel=$SLURM_CPUS_PER_TASK --robot <recipe>.eb
```

Rendez ensuite les nouveaux modules visibles et chargez-les :

```bash
module use $HOME/easybuild/modules/all
module avail
```

## Spack {#spack}

[Spack](https://spack.readthedocs.io/) est un gestionnaire de paquets pour logiciels scientifiques. Indiquez une seule fois son arborescence d'installation dans votre home (ou votre projet) :

```bash
module load spack/0.22.2
spack config add "config:install_tree:root:$HOME/spack/opt"
spack list samtools        # chercher des paquets
spack info samtools        # versions et options
```

Compilez dans un job sur un nœud de calcul, pour que Spack détecte le bon processeur (AMD, sans AVX-512) :

```bash
srun --account=malaria --cpus-per-task=8 --mem=16G --time=04:00:00 --pty bash
module load spack/0.22.2
spack install -j $SLURM_CPUS_PER_TASK samtools
```

Utilisation ensuite (dans une session ou un script de job) :

```bash
module load spack/0.22.2
spack load samtools
```

:::caution À confirmer
La configuration du module partagé `spack/0.22.2` pour les utilisateurs (emplacement d'installation par défaut, arborescence de paquets partagée) n'est pas encore documentée. Si `spack config add` ou `spack install` signale une erreur de permission, contactez le support.
:::

## Compiler depuis les sources {#compiling-from-source}

Certains outils de recherche spécialisés ne sont disponibles que sous forme de code source. Cette section détaille un exemple complet avec **HipSTR** (Haplotype inference and phasing for Short Tandem Repeats), une application C++ dont une dépendance (HTSlib) doit elle-même être compilée. Elle couvre toutes les techniques nécessaires pour installer la plupart des logiciels libres sans droits root :

- Définir un préfixe d'installation personnel
- Gérer `PATH` et `LD_LIBRARY_PATH`
- Charger un module de compilateur
- Identifier et compiler les dépendances manquantes
- Compiler et installer le logiciel visé

### Prérequis {#prerequisites-and-assumptions}

- Vous n'avez pas les droits root : ce guide n'utilise jamais `sudo`
- `git` et `wget` sont disponibles sur le nœud de connexion
- Notions de base du terminal Linux (sinon, voir [Introduction à Linux](../tutorials/linux-basics/intro.md))

Les petites compilations comme celle-ci sont acceptées sur le nœud de connexion. Pour tout ce qui est plus gros, ou pour optimiser pour les nœuds de calcul, suivez les mêmes étapes dans un job interactif (`srun ... --pty bash`).

### Choisir un emplacement d'installation personnel {#choose-a-personal-install-location}

Une convention courante est d'utiliser `$HOME/.local/` comme préfixe personnel. Créez les dossiers qui contiendront les binaires, bibliothèques, en-têtes et sources :

```bash
mkdir -p ~/.local/src
mkdir -p ~/.local/bin
mkdir -p ~/.local/lib
mkdir -p ~/.local/include
```

Rendez ces dossiers visibles pour votre shell. Ouvrez `~/.bashrc` avec `nano` :

```bash
nano ~/.bashrc
```

Ajoutez ces deux lignes à la fin du fichier :

```bash
export PATH="$HOME/.local/bin:$PATH"
export LD_LIBRARY_PATH="$HOME/.local/lib:$LD_LIBRARY_PATH"
```

Enregistrez et quittez (`Ctrl+O`, puis `Ctrl+X`), puis rechargez le shell :

```bash
source ~/.bashrc
```

Tout binaire installé dans `~/.local/bin` est désormais trouvé automatiquement.

### Charger le compilateur {#load-the-compiler-toolchain}

HipSTR est écrit en C++11 et nécessite `g++`. Chargez les compilateurs GNU 12 :

```bash
module load gnu12
```

Vérifiez le compilateur :

```bash
g++ --version
```

Vous devez voir `g++ (GCC) 12.4.0`.

### Télécharger les sources de HipSTR {#download-the-hipstr-source}

```bash
cd ~/.local/src
git clone https://github.com/HipSTR-Tool/HipSTR.git
cd HipSTR
```

Le `Makefile` de HipSTR s'attend à trouver HTSlib dans un sous-dossier nommé `htslib` à l'intérieur des sources de HipSTR. Ne le déplacez pas et ne le renommez pas une fois créé.

### Compiler HTSlib {#build-htslib}

HTSlib fournit les fonctions utilisées par HipSTR pour lire et écrire les fichiers BAM, SAM et CRAM. Téléchargez HTSlib 1.21 dans le dossier HipSTR, décompressez-le et renommez-le `htslib` :

```bash
wget https://github.com/samtools/htslib/releases/download/1.21/htslib-1.21.tar.bz2
tar -xjf htslib-1.21.tar.bz2
mv htslib-1.21 htslib
cd htslib
```

Configurez HTSlib pour une installation dans votre préfixe personnel :

```bash
./configure --prefix=$HOME/.local
```

Si configure réussit, passez à [Compiler et installer HTSlib](#build-and-install-htslib). Sinon, appliquez la correction correspondante ci-dessous.

#### Si configure échoue : libbz2 manquante {#if-configure-fails-missing-libbz2}

```
configure: error: libbz2 development files not found
```

Installez bzip2 localement :

```bash
cd ~/.local/src
wget https://sourceware.org/pub/bzip2/bzip2-1.0.8.tar.gz
tar -xzf bzip2-1.0.8.tar.gz
cd bzip2-1.0.8

make -f Makefile-libbz2_so
make install PREFIX=$HOME/.local
```

Revenez dans HTSlib et relancez configure en indiquant vos en-têtes et bibliothèques locaux :

```bash
cd ~/.local/src/HipSTR/htslib
./configure --prefix=$HOME/.local \
    CPPFLAGS="-I$HOME/.local/include" \
    LDFLAGS="-L$HOME/.local/lib"
```

#### Si configure échoue : liblzma manquante {#if-configure-fails-missing-liblzma}

```
configure: error: liblzma development files not found
```

Installez XZ utils localement :

```bash
cd ~/.local/src
wget https://tukaani.org/xz/xz-5.4.5.tar.gz
tar -xzf xz-5.4.5.tar.gz
cd xz-5.4.5

./configure --prefix=$HOME/.local
make -j4
make install
```

Revenez dans HTSlib et relancez configure :

```bash
cd ~/.local/src/HipSTR/htslib
./configure --prefix=$HOME/.local \
    CPPFLAGS="-I$HOME/.local/include" \
    LDFLAGS="-L$HOME/.local/lib"
```

#### Compiler et installer HTSlib {#build-and-install-htslib}

```bash
make -j4
make install
```

Cela installe :
- `libhts.so` et `libhts.a` dans `~/.local/lib`
- les en-têtes HTSlib (`hts.h`, `sam.h`, etc.) dans `~/.local/include/htslib`

La bibliothèque partagée reste aussi dans le dossier de compilation `htslib/` ; HipSTR se lie à cette copie (c'est le rôle de l'option `-Wl,-rpath` de son Makefile).

### Compiler HipSTR {#build-hipstr}

```bash
cd ~/.local/src/HipSTR
```

Compilez HipSTR en indiquant le chemin **absolu** du dossier htslib. Il est inscrit dans le binaire comme chemin de recherche des bibliothèques (`rpath`), si bien que le binaire trouve toujours `libhts.so` après avoir été copié :

```bash
make HTSLIB=$HOME/.local/src/HipSTR/htslib
```

`-j4` n'est pas utilisé ici : le Makefile de HipSTR ne supporte pas bien la compilation parallèle. La compilation est rapide de toute façon.

#### Si make échoue : `uint32_t` has not been declared {#if-make-fails-uint32_t-has-not-been-declared}

```
src/region.h:62:49: error: 'uint32_t' has not been declared
make: *** [Makefile:106: src/region.o] Error 1
```

Les versions récentes de GCC exigent que l'en-tête `<cstdint>` soit inclus explicitement. Corrigez le fichier :

```bash
sed -i '1s/^/#include <cstdint>\n/' src/region.h
```

Puis relancez `make` :

```bash
make HTSLIB=$HOME/.local/src/HipSTR/htslib
```

#### Si make échoue : `-lcurl` ou `-lcrypto` manquant {#if-make-fails-missing--lcurl-or--lcrypto}

Ce sont des dépendances optionnelles de HTSlib pour lire des fichiers distants en HTTP. Vous pouvez les désactiver. Recompilez HTSlib :

```bash
cd htslib
./configure --prefix=$HOME/.local --disable-libcurl
make -j4
make install
cd ..
```

Puis recompilez HipSTR sans curl ni crypto :

```bash
make HTSLIB=$HOME/.local/src/HipSTR/htslib \
     LIBS="-L$HOME/.local/src/HipSTR/htslib \
           -Wl,-rpath,$HOME/.local/src/HipSTR/htslib \
           -lhts -lz -lbz2 -llzma -lpthread"
```

### Installer le binaire {#install-the-binary}

```bash
cp HipSTR ~/.local/bin/
which HipSTR
```

### Tester l'installation {#test-the-installation}

```bash
HipSTR --help
```

L'aide de HipSTR doit s'afficher, en commençant par quelque chose comme :

```
Usage: HipSTR --bams <list_of_bams> --fasta <genome.fa> --regions <region_file.bed> --str-vcf <output.vcf.gz> [OPTIONS]
```

Si vous voyez plutôt :

```
HipSTR: error while loading shared libraries: libhts.so.3: cannot open shared object file
```

l'éditeur de liens ne trouve pas `libhts.so`. Cela ne devrait pas arriver si vous avez utilisé le chemin absolu pour `HTSLIB` ; si c'est le cas, ajoutez le dossier htslib à votre chemin de bibliothèques :

```bash
echo 'export LD_LIBRARY_PATH="$HOME/.local/src/HipSTR/htslib:$LD_LIBRARY_PATH"' >> ~/.bashrc
source ~/.bashrc
```

Testez-le aussi une fois dans un court job, pour vérifier qu'il fonctionne sur les nœuds de calcul (voir [Votre premier job](../getting-started/first-job.md)).
