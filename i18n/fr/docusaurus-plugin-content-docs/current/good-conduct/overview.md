---
title: Bonnes pratiques sur le HPC IGH
sidebar_position: 1
sidebar_label: "Vue d'ensemble"
---

Le cluster <Var name="clusterName" /> est partagé par de nombreux chercheurs en même temps. Ce que vous faites a un impact sur le travail de tous. Respecter ces consignes permet de garder le cluster rapide et disponible pour chacun.

## Principes essentiels {#core-principles}

1. **Ne jamais calculer sur le nœud de connexion** : <Var name="loginHost" code /> est une passerelle partagée pour éditer et soumettre des jobs, pas une ressource de calcul. Voir [Consignes pour le nœud de connexion](login-nodes.md).
2. **Soumettre ses jobs de façon responsable** : toujours indiquer `--account`, `--mem` et un `--time` réaliste, et donner au logiciel exactement le nombre de threads réservé. Voir [Conseils de soumission de jobs](job-submission.md).
3. **Utiliser chaque espace de stockage pour ce qu'il est** : calculer dans le scratch, garder les résultats dans le projet, ne jamais dupliquer les données brutes ni les références. Voir [Pratiques du système de fichiers](file-system.md).
4. **Transférer efficacement** : archiver les nombreux petits fichiers avant de les transférer. Voir [Guide de transfert de fichiers](file-transfers.md).

## Aide-mémoire {#quick-reference}

| À faire | À éviter |
|---|---|
| Soumettre ses jobs avec Slurm (`sbatch`, `srun`) | Lancer des calculs ou des pipelines sur le nœud de connexion |
| Toujours indiquer `--mem` (ou `--mem-per-cpu`) | Soumettre un job sans mémoire : il bloque un nœud entier |
| Utiliser `$SLURM_CPUS_PER_TASK` pour les threads du logiciel | Laisser un outil utiliser les 128 CPU d'un nœud |
| Calculer dans le scratch, garder les résultats dans `/projects/<project>/results` | Laisser la seule copie de ses résultats dans le scratch |
| Copier dans un projet avec `cp -r` ou `rsync -rlt` | Utiliser `cp -a`, `rsync -a` ou `mv` vers un projet |
| Lire les données brutes et les références là où elles sont | Dupliquer `data/raw/` ou `/references` |
| Archiver les petits fichiers avant de les transférer | Transférer des milliers de petits fichiers un par un |

## Pourquoi c'est important {#why-this-matters}

Le cluster compte huit nœuds de calcul partagés par toutes les équipes de l'IGH. Un seul job sans limite de mémoire peut bloquer un nœud entier ; un seul processus lourd sur le nœud de connexion peut ralentir les sessions de tout le monde. Un usage responsable garantit :

- **L'accès pour tous** : chaque chercheur peut travailler efficacement ;
- **Un système stable** : le nœud de connexion et le stockage restent réactifs ;
- **Des attentes plus courtes** : les ressources ne sont pas réservées pour rien.

## Conséquences d'un mauvais usage {#consequences-of-misuse}

Des manquements répétés à ces consignes peuvent entraîner :

- l'arrêt de processus ou l'annulation de jobs ;
- la suspension du compte ;
- un échange obligatoire avec l'équipe support avant le rétablissement de l'accès.

Voir aussi la [Politique d'utilisation](../policies/usage-policy.md).

## Obtenir de l'aide {#getting-help}

En cas de doute sur votre façon de travailler, contactez l'équipe IT **avant** de lancer de gros jobs :

- Ticket : <Var name="supportPortal" link />
- E-mail : <Var name="supportEmail" link />
- Consultez la [FAQ](../support/faq.md) et la page [Contact](../support/contact.md).
