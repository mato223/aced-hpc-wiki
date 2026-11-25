---
id: nodes
title: "Nos nœuds : cœurs, threads et mémoire"
sidebar_label: "Nos nœuds"
sidebar_position: 5
---

Pour bien dimensionner un job, il faut savoir ce que contient un nœud de calcul et comment Slurm le compte. Cette page l'explique et donne des règles simples pour choisir `--cpus-per-task` (`-c`) et `--mem`.

---

## Un nœud de calcul en bref {#a-compute-node-at-a-glance}

Le cluster compte 8 nœuds de calcul identiques, <Var name="computeNodes" code /> (Dell PowerEdge C6525).

| | Par nœud | Cluster entier (8 nœuds) |
|---|---|---|
| Processeurs | 2 × AMD EPYC 7543 (32 cœurs chacun, jusqu'à 3,7 GHz) | 16 processeurs |
| Cœurs physiques | 64 | 512 |
| CPU pour Slurm (CPU logiques) | 128 | 1 024 |
| Mémoire | 512 Go, dont environ 503 Go allouables par Slurm | environ 4 To |
| Domaines NUMA | 2 | |
| Jeu d'instructions | AVX2 (pas d'AVX-512) | |
| Disque local pour les utilisateurs | Aucun (`/tmp` est en mémoire) | |

Il n'y a pas de GPU ni de nœud spécial à grande mémoire : chaque job s'exécute sur l'un de ces nœuds. Le détail du matériel se trouve dans [Présentation du matériel](../../hardware/overview.md).

---

## Cœurs, threads et CPU Slurm {#cores-threads-and-slurm-cpus}

Chaque cœur physique exécute deux threads matériels (hyperthreading). Slurm compte chaque thread comme un **CPU** :

- **1 cœur = 2 CPU Slurm** : un nœud a donc 64 cœurs mais 128 CPU.
- `--cpus-per-task=8` vous donne 8 CPU, soit 4 cœurs physiques.
- Les limites de QOS (par exemple <Var name="qosNormalMaxCpusPerUser" /> CPU par utilisateur en `normal`) sont comptées en CPU Slurm.

Deux threads sur le même cœur se partagent ses unités de calcul. Pour des calculs lourds, 16 CPU vont donc plus vite que 8, mais pas deux fois plus vite. C'est normal : mesurez plutôt que de supposer.

---

## NUMA : deux moitiés par nœud {#numa-two-halves-per-node}

Chaque nœud a 2 **domaines NUMA** : la mémoire est divisée en deux moitiés, chacune plus proche de l'un des deux processeurs. Un thread qui lit la mémoire rattachée à l'autre processeur est un peu plus lent.

En pratique :

- Les petits et moyens jobs (jusqu'à quelques dizaines de CPU) n'ont pas à s'en soucier.
- Un programme qui utilise le nœud entier (128 CPU) s'étend sur les deux domaines. S'il passe mal à l'échelle, plusieurs jobs plus petits (par exemple un par échantillon) finissent souvent plus tôt qu'un seul énorme job.

---

## Choisir --cpus-per-task {#choosing-cpus-per-task}

`--cpus-per-task` sert aux programmes **multithreadés** (un processus, plusieurs threads), ce qui est le cas de la plupart des outils de bio-informatique. N'utilisez `--ntasks` que pour les programmes MPI.

1. **Vérifiez que votre programme sait utiliser plusieurs threads.** Sinon (beaucoup de scripts R et Python), demandez `-c 1` ou `-c 2` : des CPU en plus resteraient inactifs.
2. **Donnez au programme exactement ce que vous avez réservé**, via son option de threads :

   ```bash
   #SBATCH --cpus-per-task=8
   bwa mem -t $SLURM_CPUS_PER_TASK ref.fa reads_1.fq.gz reads_2.fq.gz > out.sam
   ```

   Autres exemples : `samtools -@`, `minimap2 -t`, `kraken2 --threads`, `BEAST -threads`. Sans cela, certains programmes lancent un thread par CPU du nœud (128) et ralentissent tous les jobs qui s'y trouvent.
3. **Commencez modestement** (4 à 16 CPU), puis regardez l'efficacité CPU avec `seff <jobid>`. Si elle est faible, réduisez `-c` ; si elle est proche de 100 % et que le job est long, essayez davantage.

---

## Choisir --mem {#choosing-mem}

**Précisez toujours la mémoire**, avec `--mem` (pour le job) ou `--mem-per-cpu` (par CPU). Sans cela, le job réserve toute la mémoire du nœud et personne d'autre ne peut utiliser ce nœud.

1. **Mesurez** : lancez un test, puis lisez le pic de mémoire utilisée :

   ```bash
   seff <jobid>                                   # "Memory Utilized"
   sacct -j <jobid> --format=JobID,ReqMem,MaxRSS,State
   ```

2. **Ajoutez une marge** d'environ 20 % au pic mesuré pour le vrai calcul.
3. **Restez sous la limite du nœud** : un job ne peut pas obtenir plus d'environ 503 Go.
4. Si le job se termine en `OUT_OF_MEMORY`, augmentez `--mem` (voir [Dépannage](troubleshooting.md)).

Certains outils ont besoin d'une mémoire proportionnelle à leurs données : Kraken2, par exemple, charge toute sa base en mémoire.

---

## Réserver de la mémoire, c'est réserver des CPU {#reserving-memory-reserves-cpus}

Un nœud a environ 503 Go pour 128 CPU, soit **environ 4 Go par CPU**. Quand un job prend beaucoup plus de mémoire par CPU que cela, les CPU restants du nœud ne peuvent servir à personne, faute de mémoire disponible.

| Demande | Ce qu'elle occupe réellement |
|---------|------------------------------|
| `-c 8 --mem=32G` | 8 CPU, 32 Go : équilibré |
| `-c 8 --mem=250G` | Environ la moitié d'un nœud |
| `-c 8 --mem=500G` | Un nœud entier : les 120 autres CPU sont perdus pour tout le monde |

Demandez donc la mémoire que vous avez mesurée, pas « le plus possible ». Si votre analyse a réellement besoin de la mémoire d'un nœud entier, c'est légitime, mais utilisez alors aussi les CPU (`-c` adapté) si votre programme le permet.

---

## Pas de disque local : /tmp est en mémoire {#no-local-disk-tmp-is-in-memory}

Les nœuds de calcul sont **sans état** (« stateless ») : leur système est chargé en mémoire au démarrage et ils n'ont pas de disque local pour les utilisateurs. Le `/tmp` d'un nœud est en mémoire : les gros fichiers qu'on y écrit consomment la RAM du nœud.

Écrivez les gros fichiers temporaires dans votre scratch, `/scratch/malaria/<login>`, jamais dans `/tmp`. Beaucoup d'outils ont une option pour leur dossier temporaire, par exemple `samtools sort -T /scratch/malaria/$USER/tmp`. Voir [Stockage](../../hardware/storage.md).

---

## Nœud de connexion AVX-512, nœuds de calcul AVX2 {#login-node-avx-512-vs-compute-nodes-avx2}

Le nœud de connexion, <Var name="loginHost" code />, a des processeurs **Intel** qui gèrent l'AVX-512. Les nœuds de calcul ont des processeurs **AMD** qui gèrent l'AVX2 mais **pas l'AVX-512**.

Un programme compilé sur le nœud de connexion avec `-march=native` peut utiliser des instructions AVX-512 et planter ensuite sur les nœuds de calcul avec `Illegal instruction`. Pour l'éviter :

- **compilez dans un job, sur un nœud de calcul** (le mieux : le programme est optimisé pour la machine qui l'exécute), ou
- compilez sur le nœud de connexion pour les processeurs des nœuds de calcul :

  ```bash
  module load gnu12
  gcc -O2 -march=znver3 -o my_program my_program.c     # optimisé pour les nœuds AMD EPYC
  gcc -O2 -mavx2 -o my_program my_program.c            # ou : AVX2 uniquement
  ```

Les logiciels déjà compilés (modules, paquets conda) ne sont pas concernés.

---

## En résumé {#summary}

- 1 nœud = 64 cœurs = 128 CPU Slurm = 512 Go (environ 503 Go pour les jobs).
- Demandez les threads que votre programme utilise vraiment, et passez-lui `$SLURM_CPUS_PER_TASK`.
- Précisez toujours `--mem`, mesurée avec `seff`, plus une marge.
- Environ 4 Go par CPU : davantage de mémoire par CPU bloque des CPU pour les autres.
- Les gros fichiers temporaires vont dans le scratch, pas dans `/tmp`.
- N'exécutez pas sur les nœuds de calcul un code compilé avec `-march=native` sur le nœud de connexion.
