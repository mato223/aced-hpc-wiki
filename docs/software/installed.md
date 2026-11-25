---
id: installed
title: Installed Software
sidebar_label: "Installed Software"
sidebar_position: 1
---

Software on <Var name="clusterName" /> is provided as **modules** (managed by Lmod, see [Using modules](modules.md)). The lists below come from `module -t avail` on the cluster. Modules are organised in a hierarchy: some only appear once a compiler (`gnu12`) or an MPI library (`openmpi4`) is loaded.

## Finding software {#finding-software}

```bash
module avail                 # modules you can load right now
module spider                # every module, including those hidden behind gnu12 / openmpi4
module spider netcdf         # all versions of one package
module spider fftw/3.3.10    # what to load first to make fftw/3.3.10 available
```

:::tip
If `module avail` does not show a package, try `module spider <name>`: it searches the whole hierarchy and tells you which modules to load first.
:::

## Tools and compilers (always available) {#tools-and-compilers}

| Module | Version | Purpose |
|--------|---------|---------|
| `EasyBuild` | 5.3.1 | Build and install software yourself |
| `anaconda` | 2025.06 | Conda / Python distribution |
| `autotools` | — | autoconf, automake, libtool |
| `charliecloud` | 0.44 | Unprivileged containers |
| `cmake` | 3.24.2, 4.3.4 | Build system |
| `gnu12` | 12.4.0 | GNU compilers (gcc, g++, gfortran) |
| `hwloc` | 2.14.0 | Hardware topology |
| `libfabric` | 1.19.0 | Network communication library |
| `papi` | 6.0.0 | Hardware performance counters |
| `pmix` | 4.2.9 | Process management interface |
| `prun` | 2.2 | Parallel job launcher |
| `spack` | 0.22.2 | Package manager to build software yourself |
| `ucx` | 1.15.0 | Network communication library |
| `valgrind` | 3.27.1 | Memory debugging and profiling |

## After `module load gnu12` {#after-loading-gnu12}

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

## After `module load gnu12 openmpi4` {#after-loading-gnu12-openmpi4}

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

## Bioinformatics tools {#bioinformatics-tools}

There are **no bioinformatics modules yet** (no samtools, bwa, kraken2… modules). Until they are added, you have two options:

1. **Install them with conda** from the `anaconda/2025.06` module: in your home for personal use, or in `/projects/malaria/` so the whole project team shares the same environment. See [Custom installations](custom-install.md#conda-environments).
2. **Ask the cluster administrators** to install a tool: open a ticket on <Var name="supportPortal" link />.

```bash
module load anaconda/2025.06
conda create -p /projects/malaria/shared/envs/mapping -c conda-forge -c bioconda samtools bwa
eval "$(conda shell.bash hook)"
conda activate /projects/malaria/shared/envs/mapping
```

Containers are another option for complex tools: see [Containers on HPC clusters](../tutorials/containers/containers-hpc.md) (Charliecloud).

## Requesting software {#requesting-software}

Need a tool or a version that is not listed? Open a ticket on <Var name="supportPortal" link /> (or write to <Var name="supportEmail" link />) with the name, version and a link to the software. You can also install it yourself: see [Custom installations](custom-install.md).
