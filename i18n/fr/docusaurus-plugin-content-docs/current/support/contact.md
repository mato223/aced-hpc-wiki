---
id: contact
title: Obtenir de l'aide
sidebar_label: "Obtenir de l'aide"
sidebar_position: 2
---

# Obtenir de l'aide {#getting-help}

L'équipe IT de l'IGH accompagne les chercheurs qui utilisent le cluster : accès, jobs, logiciels et données. Une demande claire nous aide à résoudre votre problème plus vite.

## Qui contacter ? {#who-to-contact}

| Votre question | Contact |
|---|---|
| Accès à un projet, ses règles ou ses données | **L'admin de projet** d'abord (indiqué dans le `README.md` du projet). Voir [Projets, sous-projets et rôles](../getting-started/projects.md). |
| Accès au HPC, nouveau projet, logiciels, problèmes de jobs, tout le reste | **Le support IT** (ci-dessous). |

## Contacter le support IT {#how-to-contact-it-support}

| Canal | Détails |
|---|---|
| **Ticket de support** (à privilégier) | <Var name="supportPortal" link /> |
| **E-mail** | <Var name="supportEmail" link /> |
| **Horaires** | <Var name="supportHoursFr" /> |

Passez par un ticket pour les demandes d'accès au HPC, les nouveaux projets, les nouveaux logiciels ou bases de référence, et l'accès à la QOS `long`.

## Avant de demander {#before-you-ask}

- **Consultez la documentation :** la [FAQ](faq.md), le [Dépannage](../tutorials/running-jobs/troubleshooting.md) et les [règles de bonne conduite](../good-conduct/overview.md).
- **Lisez le message d'erreur.** Il indique souvent précisément ce qui ne va pas.
- **Regardez les journaux de votre job** (fichiers `.out` et `.err`) et lancez `sacct -j <jobid> --format=JobID,State,ExitCode,MaxRSS,Elapsed` ou `seff <jobid>`.
- **Vérifiez votre environnement :** `module list`, vos projets avec `groups`, et les chemins de votre script.

## Rédiger une bonne demande {#writing-a-good-request}

Indiquez :

1. **Votre identifiant** sur le cluster et le **projet** (et sous-projet) dans lequel vous travaillez.
2. **Ce que vous cherchiez à faire.**
3. **Ce que vous avez fait :** les commandes exactes.
4. **Ce qui s'est passé :** le **message d'erreur complet**, copié tel quel.
5. **Les détails du job**, le cas échéant : numéro du job, dossier du script, le script lui-même, les modules chargés.
6. **Ce que vous avez déjà essayé.**

### Exemple de bonne demande {#example-of-a-good-request}

> **Sujet :** Job 485210 tué pour manque de mémoire (projet malaria)
>
> Bonjour, j'ai soumis le job 485210 sur le compte `malaria` avec le script `/projects/malaria/scripts/run_assembly.sh`. Il s'est arrêté au bout de 20 minutes avec :
>
> `slurmstepd: error: Detected 1 oom_kill event in StepId=485210.0.`
>
> J'avais demandé `--mem=16G`. Mes données d'entrée font environ 40 Go de lectures. J'ai essayé 32G et cela échoue encore. Combien de mémoire dois-je demander ?

### Exemple de demande insuffisante {#example-of-a-poor-request}

> **Sujet :** Le job ne marche pas
>
> Mon job a échoué. Pouvez-vous m'aider ?

## Ce que nous pouvons faire pour vous {#what-we-can-help-with}

- **Accès :** accès au HPC, création de projet, problèmes d'appartenance à un projet.
- **Jobs :** erreurs Slurm, choix des ressources (CPU, mémoire, durée, QOS), jobs tués par manque de mémoire.
- **Logiciels :** modules installés, conda, nouveaux logiciels ou bases de référence.
- **Données :** transferts de fichiers, organisation des dossiers de projet, droits d'accès.

## Hors de notre périmètre {#outside-our-scope}

- Déboguer la logique scientifique de votre propre code.
- Enseigner des langages de programmation : utilisez les cours en ligne et les formations.
- Questions scientifiques sur des outils tiers : consultez leur documentation ou leur communauté d'utilisateurs.
