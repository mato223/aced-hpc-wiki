---
id: intro
title: Bienvenue sur le HPC de l'IGH
sidebar_label: "Introduction"
sidebar_position: 1
---

# Bienvenue sur le HPC de l'IGH {#welcome}

L'**Institute of Genomics and Global Health (IGH)**, anciennement ACEGID, à la Redeemer's University (RUN), Ede, État d'Osun, Nigeria, exploite un cluster de calcul haute performance (HPC) pour ses recherches en génomique et en santé globale : analyse de données de séquençage, bio-informatique, phylogénie et travaux associés.

Ce wiki explique comment obtenir un accès, organiser vos données en projets, lancer des jobs avec Slurm et utiliser le cluster de façon responsable.

:::info
L'organisation par projets (`/projects`, `/scratch`, `/references`, comptes de projet dans Slurm) est déployée progressivement, projet par projet. Si votre projet n'a pas encore son espace, [contactez le support](support/contact.md).
:::

## Ce que propose le cluster {#what-the-cluster-offers}

- **Un nœud de connexion**, <Var name="loginHost" code />, pour se connecter, éditer des fichiers et soumettre des jobs. Aucun calcul ne s'y fait.
- **Huit nœuds de calcul** (<Var name="computeNodes" />) totalisant 512 cœurs physiques et environ 4 To de mémoire, gérés par l'ordonnanceur **Slurm**.
- **Un stockage partagé** visible depuis tous les nœuds : votre répertoire personnel, les dossiers de projet, un espace scratch rapide et des bases de référence communes.
- **Des logiciels** disponibles sous forme de modules, ainsi que conda, EasyBuild et Spack pour installer vos propres outils.

Voir la [présentation du matériel](hardware/overview.md) et la page [Stockage](hardware/storage.md) pour plus de détails.

## Organisation du travail {#how-work-is-organised}

Tout travail sur le cluster est rattaché à un **projet** (par exemple `malaria`), qui peut comporter des **sous-projets**. Chaque projet dispose d'un dossier partagé, d'un espace scratch et d'un compte Slurm sur lequel vos jobs sont imputés. Vous obtenez l'accès en étant ajouté à un projet. Lisez [Projets, sous-projets et rôles](getting-started/projects.md) avant de commencer : tout le reste en découle.

## Premiers pas {#getting-started}

1. [Demandez un accès](getting-started/accounts.md) en ouvrant un ticket.
2. Comprenez les [projets, sous-projets et rôles](getting-started/projects.md).
3. [Connectez-vous au cluster](getting-started/connecting.md) depuis le réseau de l'institut.
4. [Lancez votre premier job](getting-started/first-job.md).
5. Lisez les [règles de bonne conduite](good-conduct/overview.md) et la [politique d'utilisation](policies/usage-policy.md).

## L'essentiel {#key-facts}

| | |
|---|---|
| Nœud de connexion | <Var name="loginHost" code /> (réseau de l'institut uniquement) |
| Ordonnanceur | Slurm, une seule partition `normal` |
| Fuseau horaire | WAT (UTC+1) |
| Support | <Var name="supportEmail" link />, ticket sur <Var name="supportPortal" link /> |
| Horaires du support | <Var name="supportHoursFr" /> |

## Besoin d'aide ? {#need-help}

- Consultez la [FAQ](support/faq.md) et le [glossaire](support/glossary.md).
- Suivez les [tutoriels](tutorials/overview.md), en commençant par les [bases de Linux](tutorials/linux-basics/intro.md) si la ligne de commande est nouvelle pour vous.
- [Contactez le support](support/contact.md) si vous êtes bloqué.
