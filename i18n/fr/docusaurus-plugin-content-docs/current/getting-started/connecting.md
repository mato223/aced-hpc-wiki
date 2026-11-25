---
id: connecting
title: Se connecter au cluster
sidebar_label: "Se connecter au cluster"
sidebar_position: 3
---

# Se connecter au cluster {#connecting-to-the-cluster}

Vous vous connectez au HPC de l'IGH en **SSH** sur le nœud de connexion, <Var name="loginHost" code />.

## Avant de vous connecter {#before-you-connect}

- Votre compte institutionnel IGH a accès au cluster et vous êtes membre d'au moins un projet. Voir [Obtenir un accès](accounts.md).
- Un client SSH :
  - **Linux et macOS :** la commande `ssh` dans un terminal.
  - **Windows 10/11 :** la commande `ssh` dans PowerShell ou Windows Terminal (OpenSSH est inclus), ou un client comme PuTTY ou MobaXterm.
- Vous êtes sur le **réseau de l'institut**.

:::warning[Réseau de l'institut uniquement]
Le cluster n'est joignable **que depuis le réseau de l'IGH**. Il n'y a pour l'instant aucun accès depuis l'extérieur de l'institut.
:::

## Se connecter en SSH {#connect-with-ssh}

Remplacez `<login>` par votre identifiant IGH :

```bash
ssh <login>@acegid-hpc-01
```

Saisissez ensuite vos informations de connexion institutionnelles quand elles sont demandées. Lors de la première connexion, SSH vous demande de confirmer la clé de l'hôte : répondez `yes`.

Avec PuTTY ou MobaXterm, indiquez <Var name="loginHost" code /> comme nom d'hôte, le port 22 et votre identifiant IGH comme nom d'utilisateur.

### Facultatif : un raccourci {#ssh-shortcut}

Sous Linux, macOS ou Windows (OpenSSH), vous pouvez ajouter une entrée dans `~/.ssh/config` pour qu'il suffise de taper `ssh igh` :

```text
Host igh
    HostName acegid-hpc-01
    User <login>
```

## Que faire sur le nœud de connexion ? {#what-to-do-on-the-login-node}

Le nœud de connexion est partagé par tous. Utilisez-le pour éditer des fichiers, transférer des données, faire de petites compilations et soumettre des jobs. **N'y lancez aucun calcul** : envoyez-le sur les nœuds de calcul avec Slurm. Voir [Bonnes pratiques sur le nœud de connexion](../good-conduct/login-nodes.md).

## Après l'ajout à un projet {#after-being-added-to-a-project}

Un nouvel accès à un projet n'est pris en compte que dans une **nouvelle session**. Si vous étiez connecté au moment de l'ajout, déconnectez-vous (`exit`) puis reconnectez-vous, et vérifiez avec `groups`.

## Transférer des fichiers {#transferring-files}

Utilisez `scp`, `rsync` ou `sftp` vers le nœud de connexion, depuis le réseau de l'institut. Voir [Transferts de fichiers](../good-conduct/file-transfers.md).

## Problèmes de connexion {#connection-problems}

| Symptôme | Cause probable |
|---|---|
| `Connection timed out` ou `Could not resolve hostname` | Vous n'êtes pas sur le réseau de l'institut. |
| `Permission denied` à la connexion | Identifiant ou informations de connexion incorrects, ou accès pas encore accordé. |
| `Permission denied` sur un dossier de projet après connexion | Votre nouvel accès au projet n'est pas encore actif : déconnectez-vous puis reconnectez-vous. |

Pour voir où la connexion échoue, lancez `ssh -v <login>@acegid-hpc-01` et joignez la sortie à votre [demande de support](../support/contact.md).

## Étape suivante {#next-step}

[Lancez votre premier job](first-job.md).
