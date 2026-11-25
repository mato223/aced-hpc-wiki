---
id: overview
title: Présentation du matériel
sidebar_position: 1
sidebar_label: "Présentation du cluster"
---

Le cluster <Var name="clusterName" /> est un cluster CPU conçu pour la génomique et la bio-informatique : un nœud de connexion et huit nœuds de calcul, tous reliés au stockage partagé par un réseau InfiniBand à 100 Gb/s.

## En bref {#at-a-glance}

| Élément | Nom | Nombre | Chiffres clés |
|---------|-----|--------|---------------|
| Nœud de connexion | <Var name="loginHost" code /> | 1 | 32 cœurs / 64 threads, ~250 Go de RAM |
| Nœuds de calcul | `acegid-cpu-01` … `acegid-cpu-08` | 8 | 64 cœurs / 128 CPU Slurm et 512 Go de RAM chacun |
| **Total calcul** | | | **512 cœurs / 1 024 CPU Slurm / ~4 To de RAM** |
| GPU | — | 0 | Le cluster n'a **aucun GPU** |

## Nœud de connexion {#login-node}

<Var name="loginHost" code /> est la machine à laquelle vous vous connectez en SSH (voir [Se connecter](../getting-started/connecting.md)).

| Caractéristique | Valeur |
|-----------------|--------|
| Serveur | Dell PowerEdge R750 |
| Processeurs | 2 × Intel Xeon Gold 6326 (2,9 GHz, 16 cœurs chacun) |
| Cœurs / threads | 32 cœurs / 64 threads |
| Mémoire | ~250 Go |
| Jeux d'instructions | AVX-512 |
| Système d'exploitation | RHEL 8.10 |

Il sert à la connexion SSH, à l'édition de fichiers, aux petites compilations et à la soumission des jobs. **Aucun calcul ne tourne sur le nœud de connexion** : voir [Consignes pour le nœud de connexion](../good-conduct/login-nodes.md).

## Nœuds de calcul {#compute-nodes}

Les huit nœuds de calcul, `acegid-cpu-01` à `acegid-cpu-08`, exécutent tous les jobs soumis via Slurm.

| Caractéristique | Par nœud |
|-----------------|----------|
| Serveur | Dell PowerEdge C6525 |
| Processeurs | 2 × AMD EPYC 7543 (32 cœurs chacun, jusqu'à 3,7 GHz) |
| Cœurs physiques | 64 |
| CPU logiques (CPU Slurm) | 128 (hyperthreading) |
| Domaines NUMA | 2 |
| Mémoire | 512 Go (~503 Go allouables par Slurm) |
| Jeux d'instructions | AVX2 (pas d'AVX-512) |

### Cœurs, threads et CPU Slurm {#cores-threads-and-slurm-cpus}

L'hyperthreading est activé : chaque cœur physique apparaît comme **2 CPU** pour Slurm. Un nœud offre donc 128 CPU Slurm, et `--cpus-per-task=8` vous donne 4 cœurs physiques. Le choix de `-c` et `--mem` sur ces nœuds est expliqué dans [Nos nœuds : cœurs, threads et mémoire](../tutorials/running-jobs/nodes.md).

### Nœuds « stateless » {#stateless-nodes}

Les nœuds de calcul sont *stateless* : leur système est chargé en mémoire au démarrage.

- Il n'y a **pas de disque local** pour les utilisateurs sur les nœuds de calcul.
- `/tmp` sur un nœud de calcul est **en RAM** : n'y écrivez pas de gros fichiers, utilisez plutôt votre [espace scratch](storage.md#scratch).
- Vos fichiers sont toujours sur le stockage partagé, visibles de la même façon depuis le nœud de connexion et depuis chaque nœud de calcul (voir [Stockage](storage.md)).

## Compiler pour les nœuds de calcul {#compiling-for-the-compute-nodes}

Le nœud de connexion a des processeurs Intel avec AVX-512 ; les nœuds de calcul ont des processeurs AMD **sans** AVX-512. Un programme compilé sur le nœud de connexion avec `-march=native` peut planter sur les nœuds de calcul avec l'erreur `Illegal instruction`.

Compilez donc dans un job sur un nœud de calcul, ou ciblez explicitement les nœuds de calcul :

```bash
# Compilation portable pour les nœuds de calcul AMD
gcc -O2 -march=znver3 -o my_tool my_tool.c

# Ou, plus générique
gcc -O2 -mavx2 -o my_tool my_tool.c
```

Voir aussi [Installer ses propres logiciels](../software/custom-install.md).

## Réseau et pile logicielle {#network-and-software-stack}

| Élément | Détails |
|---------|---------|
| Interconnexion | InfiniBand 100 Gb/s (nœuds ↔ stockage) |
| Pile du cluster | OpenHPC 2.10 |
| Ordonnanceur | Slurm, une seule partition `normal` (voir [Les bases de Slurm](../tutorials/running-jobs/slurm-basics.md)) |
| Modules logiciels | Lmod (voir [Modules](../software/modules.md)) |
| Comptes | Annuaire institutionnel IGH (voir [Comptes](../getting-started/accounts.md)) |

## Ce que le cluster n'a pas {#what-the-cluster-does-not-have}

- **Pas de GPU** : tous les calculs tournent sur CPU.
- **Pas de nœud à grande mémoire** : un nœud offre au maximum ~503 Go de mémoire aux jobs.
- **Une seule partition** (`normal`) ; les limites des jobs sont fixées par les QOS, pas par partition.
