---
id: connecting
title: "Se connecter au cluster"
sidebar_label: "Se connecter"
sidebar_position: 2
---

Remplacez `username` par votre identifiant sur le cluster :

<Tabs groupId="os">
<TabItem value="unix" label="Linux / macOS" default>

<SiteCode language="bash" code="ssh username@{loginHost}" />

</TabItem>
<TabItem value="windows" label="Windows">

Utilisez Windows Terminal / PowerShell (OpenSSH est intégré depuis Windows 10), ou MobaXterm.

<SiteCode language="powershell" code="ssh username@{loginHost}" />

</TabItem>
</Tabs>

:::info[Contenu à venir]

- Configurer des clés SSH
- Raccourcis dans la config SSH
- VPN / accès hors campus (si nécessaire)

:::
