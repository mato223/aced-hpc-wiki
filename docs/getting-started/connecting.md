---
id: connecting
title: "Connecting to the cluster"
sidebar_label: "Connecting"
sidebar_position: 2
---

Replace `username` with your cluster username:

<Tabs groupId="os">
<TabItem value="unix" label="Linux / macOS" default>

<SiteCode language="bash" code="ssh username@{loginHost}" />

</TabItem>
<TabItem value="windows" label="Windows">

Use Windows Terminal / PowerShell (OpenSSH is built in on Windows 10+), or MobaXterm.

<SiteCode language="powershell" code="ssh username@{loginHost}" />

</TabItem>
</Tabs>

:::info[Content coming soon]

- Setting up SSH keys
- SSH config shortcuts
- VPN / off-campus access (if required)

:::
