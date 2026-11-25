---
id: accounts
title: Obtenir un accès
sidebar_label: "Obtenir un accès"
sidebar_position: 1
---

# Obtenir un accès {#getting-access}

## Votre compte {#your-account}

Vous vous connectez au cluster avec votre **compte institutionnel IGH** : le même identifiant et les mêmes informations de connexion que pour les autres services de l'institut. Il n'y a pas de compte HPC séparé à créer.

Avoir un compte institutionnel ne suffit cependant pas pour calculer : **vous devez être membre d'au moins un projet ou sous-projet**. Vos projets déterminent les dossiers que vous voyez et les comptes Slurm sur lesquels vous pouvez imputer vos jobs. Voir [Projets, sous-projets et rôles](projects.md).

## Demander l'accès {#request-access}

Ouvrez un ticket dans le portail du support, sur <Var name="supportPortal" link /> :

- **Sujet :** demande d'accès au HPC (ou *création de projet HPC* si vous avez besoin d'un nouveau projet).
- **Description :**
  - pourquoi vous allez utiliser le HPC (type d'analyse, données, outils) ;
  - le ou les projets ou sous-projets sur lesquels vous travaillez.

Si vous demandez à rejoindre un **projet existant**, la demande est validée par l'**admin de projet** concerné. Si vous demandez un **nouveau projet**, l'équipe IT le crée et désigne ses admins de projet ; voir [le cycle de vie d'un projet](projects.md#life-cycle).

:::tip
Si vous savez qui est l'admin du projet, prévenez-le de votre demande : la validation sera plus rapide.
:::

## Une fois ajouté au projet {#once-you-have-been-added}

1. Si vous étiez déjà connecté, **déconnectez-vous puis reconnectez-vous** : un nouvel accès à un projet n'est pris en compte que dans une nouvelle session.
2. Vérifiez vos projets :

   ```bash
   groups
   sacctmgr show assoc user=$USER format=account,qos
   ```

   La première commande liste vos projets (sous forme de groupes), la seconde les comptes Slurm et les QOS que vous pouvez utiliser.

3. [Connectez-vous au cluster](connecting.md) et [lancez votre premier job](first-job.md).

## Rejoindre ou quitter un projet {#joining-or-leaving-a-project}

- Pour rejoindre un autre projet ou sous-projet, ouvrez un nouveau ticket de la même façon. L'admin de projet le valide.
- Quand vous quittez un projet, vous en êtes retiré et perdez l'accès à ses dossiers et à son compte Slurm. Assurez-vous de transmettre à l'équipe ce dont elle a besoin avant de partir.
- L'accès passe uniquement par l'appartenance aux projets : l'équipe IT n'ouvre pas de dossiers individuels « à la main ».

## Avant de commencer {#before-you-start}

- Lisez la [politique d'utilisation](../policies/usage-policy.md) et les [règles de bonne conduite](../good-conduct/overview.md).
- La ligne de commande est nouvelle pour vous ? Suivez les [bases de Linux](../tutorials/linux-basics/intro.md) et les [bases de Slurm](../tutorials/running-jobs/slurm-basics.md).
- Des questions ? Voir [Obtenir de l'aide](../support/contact.md).
