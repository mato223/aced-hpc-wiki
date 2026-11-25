---
id: custom-install
title: Custom Installations
sidebar_label: "Custom Install"
sidebar_position: 3
---

# Custom Installations

You will not always find the software you need among the [installed modules](installed.md). You can install it yourself, without root access, in your home directory (personal use) or in your project directory (shared with your team). This page covers four methods:

| Method | Best for | Module |
|--------|----------|--------|
| [Conda](#conda-environments) | Bioinformatics and Python/R tools packaged on bioconda / conda-forge | `anaconda/2025.06` |
| [EasyBuild](#easybuild) | Scientific software with an existing EasyBuild recipe | `EasyBuild/5.3.1` |
| [Spack](#spack) | Scientific software with an existing Spack package | `spack/0.22.2` |
| [Compiling from source](#compiling-from-source) | Anything else | `gnu12` |

If a tool is useful to many people, you can also ask for it to be installed: open a ticket on <Var name="supportPortal" link />.

## Where to install {#where-to-install}

- **Personal tools**: in your home (`$HOME`), which is backed up.
- **Tools shared by a team**: in the project, for example `/projects/malaria/shared/` or `/projects/malaria/scripts/`. Files created in a project directory belong to the project and can be used by the whole team (see [Projects](../getting-started/projects.md)).
- **Not** in the scratch: it is not backed up and unused files are deleted automatically.

:::warning Login node and compute nodes have different CPUs
The login node <Var name="loginHost" code /> has Intel CPUs with AVX-512; the compute nodes have AMD EPYC CPUs **without** AVX-512. Software compiled on the login node with `-march=native` (or auto-detected by Spack/EasyBuild) can crash on the compute nodes with `Illegal instruction`. Build inside a job on a compute node, or compile with `-march=znver3` (or `-mavx2`). See [Hardware](../hardware/overview.md).
:::

Large builds (EasyBuild, Spack, big compilations) must also run inside a job, not on the login node: see [Login node etiquette](../good-conduct/login-nodes.md).

## Conda environments {#conda-environments}

Conda is the easiest way to install bioinformatics tools (from the **bioconda** channel) while there are no bioinformatics modules yet.

```bash
module load anaconda/2025.06
eval "$(conda shell.bash hook)"     # enables "conda activate" in this shell
```

### Keep environments and the package cache in the right place {#conda-locations}

By default conda puts environments and its download cache in `~/.conda`. Keep them in your home, or in your project for environments shared by the team. Never put them in the scratch.

```bash
# Personal environments and cache, in your home
conda config --add envs_dirs $HOME/conda/envs
conda config --add pkgs_dirs $HOME/conda/pkgs
```

### Personal environment {#conda-personal-environment}

```bash
conda create -n mapping -c conda-forge -c bioconda samtools=1.21 bwa
conda activate mapping
samtools --version
conda deactivate
```

### Environment shared by a project {#conda-project-environment}

Create it with a full path (`-p`) inside the project so every member can activate it:

```bash
conda create -p /projects/malaria/shared/envs/mapping -c conda-forge -c bioconda samtools=1.21 bwa
conda activate /projects/malaria/shared/envs/mapping
```

Document it in the project `README.md` (who created it, what it is for). Export the exact list of packages so the environment can be rebuilt:

```bash
conda env export -p /projects/malaria/shared/envs/mapping > /projects/malaria/scripts/mapping-env.yml
```

### Using a conda environment in a job {#conda-in-a-job}

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

:::tip Save space
Clean the package cache from time to time with `conda clean --all`, and remove environments you no longer use (`conda env remove -n <name>`).
:::

## EasyBuild {#easybuild}

[EasyBuild](https://docs.easybuild.io/) builds software from ready-made recipes (*easyconfigs*) and generates a module for it. Install into your home (or your project) with `--prefix`:

```bash
module load EasyBuild/5.3.1
eb --search SAMtools                      # find available recipes
```

Run the build itself inside a job on a compute node (it can take a long time and compiles its own toolchain if needed):

```bash
srun --account=malaria --cpus-per-task=8 --mem=16G --time=04:00:00 --pty bash
module load EasyBuild/5.3.1
eb --prefix=$HOME/easybuild --parallel=$SLURM_CPUS_PER_TASK --robot <recipe>.eb
```

Then make the new modules visible and load them:

```bash
module use $HOME/easybuild/modules/all
module avail
```

## Spack {#spack}

[Spack](https://spack.readthedocs.io/) is a package manager for scientific software. Point its installation tree at your home (or your project) once:

```bash
module load spack/0.22.2
spack config add "config:install_tree:root:$HOME/spack/opt"
spack list samtools        # search packages
spack info samtools        # versions and options
```

Build inside a job on a compute node, so Spack detects the right CPU (AMD, no AVX-512):

```bash
srun --account=malaria --cpus-per-task=8 --mem=16G --time=04:00:00 --pty bash
module load spack/0.22.2
spack install -j $SLURM_CPUS_PER_TASK samtools
```

Use it afterwards (in a session or a job script):

```bash
module load spack/0.22.2
spack load samtools
```

:::caution To be confirmed
How the shared `spack/0.22.2` module is configured for users (default installation location, shared package tree) is not documented yet. If `spack config add` or `spack install` reports a permission error, contact support.
:::

## Compiling from source {#compiling-from-source}

Specialist research tools are sometimes only available as source code. This section walks through a complete example with **HipSTR** (Haplotype inference and phasing for Short Tandem Repeats), a C++ application with a dependency (HTSlib) that itself must be compiled. It covers every technique you need to install most open-source software without root access:

- Setting up a personal install prefix
- Managing `PATH` and `LD_LIBRARY_PATH`
- Loading a compiler module
- Resolving and building missing dependencies
- Compiling and installing the target software

### Prerequisites {#prerequisites-and-assumptions}

- You do not have root access: this guide never uses `sudo`
- `git` and `wget` are available on the login node
- Basic familiarity with the Linux terminal (see [Introduction to Linux](../tutorials/linux-basics/intro.md) if not)

Small compilations like this one are acceptable on the login node. For anything larger, or to optimise for the compute nodes, run the same steps inside an interactive job (`srun ... --pty bash`).

### Choose a personal install location {#choose-a-personal-install-location}

A standard convention is `$HOME/.local/` as your personal prefix. Create the directories that will hold binaries, libraries, headers and source trees:

```bash
mkdir -p ~/.local/src
mkdir -p ~/.local/bin
mkdir -p ~/.local/lib
mkdir -p ~/.local/include
```

Make these directories visible to your shell. Open `~/.bashrc` with `nano`:

```bash
nano ~/.bashrc
```

Add these two lines at the bottom of the file:

```bash
export PATH="$HOME/.local/bin:$PATH"
export LD_LIBRARY_PATH="$HOME/.local/lib:$LD_LIBRARY_PATH"
```

Save and exit (`Ctrl+O`, then `Ctrl+X`), then reload the shell:

```bash
source ~/.bashrc
```

Any binary installed in `~/.local/bin` is now found automatically.

### Load the compiler toolchain {#load-the-compiler-toolchain}

HipSTR is written in C++11 and needs `g++`. Load the GNU 12 compilers:

```bash
module load gnu12
```

Check the compiler:

```bash
g++ --version
```

You should see `g++ (GCC) 12.4.0`.

### Download the HipSTR source {#download-the-hipstr-source}

```bash
cd ~/.local/src
git clone https://github.com/HipSTR-Tool/HipSTR.git
cd HipSTR
```

HipSTR's `Makefile` expects HTSlib in a subdirectory named `htslib` inside the HipSTR source tree. Do not move or rename it once created.

### Build HTSlib {#build-htslib}

HTSlib provides the functions HipSTR uses to read and write BAM, SAM and CRAM files. Download the HTSlib 1.21 release into the HipSTR directory, extract it and rename it `htslib`:

```bash
wget https://github.com/samtools/htslib/releases/download/1.21/htslib-1.21.tar.bz2
tar -xjf htslib-1.21.tar.bz2
mv htslib-1.21 htslib
cd htslib
```

Configure HTSlib to install into your personal prefix:

```bash
./configure --prefix=$HOME/.local
```

If configure succeeds, go to [Build and install HTSlib](#build-and-install-htslib). Otherwise, apply the relevant fix below.

#### If configure fails: missing libbz2 {#if-configure-fails-missing-libbz2}

```
configure: error: libbz2 development files not found
```

Install bzip2 locally:

```bash
cd ~/.local/src
wget https://sourceware.org/pub/bzip2/bzip2-1.0.8.tar.gz
tar -xzf bzip2-1.0.8.tar.gz
cd bzip2-1.0.8

make -f Makefile-libbz2_so
make install PREFIX=$HOME/.local
```

Return to HTSlib and re-run configure with your local headers and libraries:

```bash
cd ~/.local/src/HipSTR/htslib
./configure --prefix=$HOME/.local \
    CPPFLAGS="-I$HOME/.local/include" \
    LDFLAGS="-L$HOME/.local/lib"
```

#### If configure fails: missing liblzma {#if-configure-fails-missing-liblzma}

```
configure: error: liblzma development files not found
```

Install XZ utils locally:

```bash
cd ~/.local/src
wget https://tukaani.org/xz/xz-5.4.5.tar.gz
tar -xzf xz-5.4.5.tar.gz
cd xz-5.4.5

./configure --prefix=$HOME/.local
make -j4
make install
```

Return to HTSlib and re-run configure:

```bash
cd ~/.local/src/HipSTR/htslib
./configure --prefix=$HOME/.local \
    CPPFLAGS="-I$HOME/.local/include" \
    LDFLAGS="-L$HOME/.local/lib"
```

#### Build and install HTSlib {#build-and-install-htslib}

```bash
make -j4
make install
```

This installs:
- `libhts.so` and `libhts.a` into `~/.local/lib`
- the HTSlib headers (`hts.h`, `sam.h`, etc.) into `~/.local/include/htslib`

The shared library also stays in the `htslib/` build directory; HipSTR links against this copy (this is what the `-Wl,-rpath` flag in its Makefile is for).

### Build HipSTR {#build-hipstr}

```bash
cd ~/.local/src/HipSTR
```

Build HipSTR, giving the **absolute** path to the htslib directory. It is embedded in the binary as a runtime library search path (`rpath`), so the binary keeps finding `libhts.so` after you copy it:

```bash
make HTSLIB=$HOME/.local/src/HipSTR/htslib
```

`-j4` is not used here: HipSTR's Makefile is not safe for parallel builds. The build is fast anyway.

#### If make fails: `uint32_t` has not been declared {#if-make-fails-uint32_t-has-not-been-declared}

```
src/region.h:62:49: error: 'uint32_t' has not been declared
make: *** [Makefile:106: src/region.o] Error 1
```

Recent GCC versions require the `<cstdint>` header to be included explicitly. Patch the file:

```bash
sed -i '1s/^/#include <cstdint>\n/' src/region.h
```

Then re-run `make`:

```bash
make HTSLIB=$HOME/.local/src/HipSTR/htslib
```

#### If make fails: missing `-lcurl` or `-lcrypto` {#if-make-fails-missing--lcurl-or--lcrypto}

These are optional HTSlib dependencies for reading remote files over HTTP. You can disable them. Rebuild HTSlib:

```bash
cd htslib
./configure --prefix=$HOME/.local --disable-libcurl
make -j4
make install
cd ..
```

Then rebuild HipSTR without curl and crypto:

```bash
make HTSLIB=$HOME/.local/src/HipSTR/htslib \
     LIBS="-L$HOME/.local/src/HipSTR/htslib \
           -Wl,-rpath,$HOME/.local/src/HipSTR/htslib \
           -lhts -lz -lbz2 -llzma -lpthread"
```

### Install the binary {#install-the-binary}

```bash
cp HipSTR ~/.local/bin/
which HipSTR
```

### Test the installation {#test-the-installation}

```bash
HipSTR --help
```

You should see HipSTR's usage information, starting with something like:

```
Usage: HipSTR --bams <list_of_bams> --fasta <genome.fa> --regions <region_file.bed> --str-vcf <output.vcf.gz> [OPTIONS]
```

If instead you see:

```
HipSTR: error while loading shared libraries: libhts.so.3: cannot open shared object file
```

the runtime linker cannot find `libhts.so`. This should not happen if you used the absolute path for `HTSLIB`; if it does, add the htslib directory to your library path:

```bash
echo 'export LD_LIBRARY_PATH="$HOME/.local/src/HipSTR/htslib:$LD_LIBRARY_PATH"' >> ~/.bashrc
source ~/.bashrc
```

Test it once inside a short job as well, to make sure it runs on the compute nodes (see [Your first job](../getting-started/first-job.md)).
