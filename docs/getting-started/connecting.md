---
id: connecting
title: Connecting to the cluster
sidebar_label: "Connecting to the cluster"
sidebar_position: 3
---

# Connecting to the cluster {#connecting-to-the-cluster}

You connect to the IGH HPC with **SSH** to the login node, <Var name="loginHost" code />.

## Before you connect {#before-you-connect}

- Your IGH institutional account has access to the cluster and you are a member of at least one project. See [Getting access](accounts.md).
- An SSH client:
  - **Linux and macOS:** the `ssh` command in a terminal.
  - **Windows 10/11:** the `ssh` command in PowerShell or Windows Terminal (OpenSSH is included), or a client such as PuTTY or MobaXterm.
- You are on the **institute network**.

:::warning[Institute network only]
The cluster can only be reached **from the IGH institute network**. There is currently no access from outside the institute.
:::

## Connect with SSH {#connect-with-ssh}

Replace `<login>` with your IGH login:

```bash
ssh <login>@acegid-hpc-01
```

Then enter your institutional credentials when prompted. The first time you connect, SSH asks you to confirm the host key: answer `yes`.

With PuTTY or MobaXterm, use <Var name="loginHost" code /> as host name, port 22, and your IGH login as user name.

### Optional: a shortcut {#ssh-shortcut}

On Linux, macOS or Windows (OpenSSH), you can add an entry to `~/.ssh/config` so that `ssh igh` is enough:

```text
Host igh
    HostName acegid-hpc-01
    User <login>
```

## What to do on the login node {#what-to-do-on-the-login-node}

The login node is shared by everyone. Use it to edit files, transfer data, do small compilations and submit jobs. **Do not run any computation on it**: send it to the compute nodes with Slurm. See [Login node good practice](../good-conduct/login-nodes.md).

## After being added to a project {#after-being-added-to-a-project}

A new project membership only takes effect in a **new session**. If you were connected when you were added, log out (`exit`) and connect again, then check with `groups`.

## Transferring files {#transferring-files}

Use `scp`, `rsync` or `sftp` to the login node, from the institute network. See [File transfers](../good-conduct/file-transfers.md).

## Connection problems {#connection-problems}

| Symptom | Likely cause |
|---|---|
| `Connection timed out` or `Could not resolve hostname` | You are not on the institute network. |
| `Permission denied` at login | Wrong login or credentials, or your access has not been granted yet. |
| `Permission denied` on a project folder after login | Your new project membership is not active yet: log out and log in again. |

To see where the connection fails, run `ssh -v <login>@acegid-hpc-01` and include its output in your [support request](../support/contact.md).

## Next step {#next-step}

[Run your first job](first-job.md).
