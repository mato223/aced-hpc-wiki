---
id: installed
title: Logiciels installés
sidebar_label: "Logiciels installés"
sidebar_position: 1
---

Les logiciels de <Var name="clusterName" /> sont fournis sous forme de **modules** (gérés par Lmod, voir [Utiliser les modules](modules.md)). Les listes ci-dessous proviennent de `module -t avail` sur le cluster. Les modules sont organisés en hiérarchie : certains n'apparaissent qu'après le chargement d'un compilateur (`gnu12`) ou d'une bibliothèque MPI (`openmpi4`).

## Trouver un logiciel {#finding-software}

```bash
module avail                 # modules chargeables maintenant
module spider                # tous les modules, y compris ceux cachés derrière gnu12 / openmpi4
module spider netcdf         # toutes les versions d'un logiciel
module spider fftw/3.3.10    # ce qu'il faut charger avant fftw/3.3.10
```

:::tip
Si `module avail` n'affiche pas un logiciel, essayez `module spider <name>` : il parcourt toute la hiérarchie et indique les modules à charger au préalable.
:::

## Outils et compilateurs (toujours disponibles) {#tools-and-compilers}

| Module | Version | Rôle |
|--------|---------|------|
| `EasyBuild` | 5.3.1 | Compiler et installer des logiciels soi-même |
| `anaconda` | 2025.06 | Distribution conda / Python |
| `autotools` | — | autoconf, automake, libtool |
| `charliecloud` | 0.44 | Conteneurs sans privilèges |
| `cmake` | 3.24.2, 4.3.4 | Système de compilation |
| `gnu12` | 12.4.0 | Compilateurs GNU (gcc, g++, gfortran) |
| `hwloc` | 2.14.0 | Topologie matérielle |
| `libfabric` | 1.19.0 | Bibliothèque de communication réseau |
| `papi` | 6.0.0 | Compteurs de performance matériels |
| `pmix` | 4.2.9 | Interface de gestion des processus |
| `prun` | 2.2 | Lanceur de jobs parallèles |
| `spack` | 0.22.2 | Gestionnaire de paquets pour compiler soi-même |
| `ucx` | 1.15.0 | Bibliothèque de communication réseau |
| `valgrind` | 3.27.1 | Débogage mémoire et profilage |

## Après `module load gnu12` {#after-loading-gnu12}

| Module | Version |
|--------|---------|
| `R` | 4.2.1 |
| `gsl` | 2.7.1 |
| `hdf5` | 1.10.8 |
| `likwid` | 5.2.2 |
| `metis` | 5.1.0 |
| `mpich` | 3.4.3-ofi, 3.4.3-ucx |
| `mvapich2` | 2.3.7 |
| `netcdf` | 4.9.0 |
| `netcdf-cxx` | 4.3.1 |
| `netcdf-fortran` | 4.6.0 |
| `openblas` | 0.3.21 |
| `openmpi4` | 4.1.6 |
| `pdtoolkit` | 3.25.1 |
| `plasma` | 21.8.29 |
| `py3-numpy` | 1.19.5 |
| `scotch` | 6.0.6 |
| `superlu` | 5.2.1 |

## Après `module load gnu12 openmpi4` {#after-loading-gnu12-openmpi4}

| Module | Version |
|--------|---------|
| `adios` | 1.13.1 |
| `boost` | 1.81.0 |
| `dimemas` | 5.4.2 |
| `extrae` | 3.8.3 |
| `fftw` | 3.3.10 |
| `hypre` | 2.18.1 |
| `imb` | 2021.3 |
| `mfem` | 4.4 |
| `mumps` | 5.2.1 |
| `netcdf` | 4.9.0 |
| `netcdf-cxx` | 4.3.1 |
| `netcdf-fortran` | 4.6.0 |
| `omb` | 6.1 |
| `opencoarrays` | 2.10.1 |
| `petsc` | 3.18.1 |
| `phdf5` | 1.10.8 |
| `pnetcdf` | 1.12.3 |
| `ptscotch` | 7.0.1 |
| `py3-mpi4py` | 3.1.3 |
| `py3-scipy` | 1.5.4 |
| `scalapack` | 2.2.0 |
| `scalasca` | 2.5 |
| `scorep` | 7.1 |
| `sionlib` | 1.7.7 |
| `slepc` | 3.18.0 |
| `superlu_dist` | 6.4.0 |
| `tau` | 2.31.1 |
| `trilinos` | 13.4.0 |

## Outils de bio-informatique {#bioinformatics-tools}

Il n'y a **pas encore de modules de bio-informatique** (pas de module samtools, bwa, kraken2…). En attendant, deux solutions :

1. **Les installer avec conda** via le module `anaconda/2025.06` : dans votre home pour un usage personnel, ou dans `/projects/malaria/` pour que toute l'équipe du projet partage le même environnement. Voir [Installations personnalisées](custom-install.md#conda-environments).
2. **Demander l'installation aux administrateurs du cluster** : ouvrez un ticket sur <Var name="supportPortal" link />.

```bash
module load anaconda/2025.06
conda create -p /projects/malaria/shared/envs/mapping -c conda-forge -c bioconda samtools bwa
eval "$(conda shell.bash hook)"
conda activate /projects/malaria/shared/envs/mapping
```

Les conteneurs sont une autre solution pour les outils complexes : voir [Conteneurs sur les clusters HPC](../tutorials/containers/containers-hpc.md) (Charliecloud).

## Demander un logiciel {#requesting-software}

Il vous manque un outil ou une version ? Ouvrez un ticket sur <Var name="supportPortal" link /> (ou écrivez à <Var name="supportEmail" link />) en indiquant le nom, la version et un lien vers le logiciel. Vous pouvez aussi l'installer vous-même : voir [Installations personnalisées](custom-install.md).
