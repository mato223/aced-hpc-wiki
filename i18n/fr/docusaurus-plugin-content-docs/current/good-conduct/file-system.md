---
title: Bonnes pratiques pour le système de fichiers
sidebar_position: 3
sidebar_label: "Pratiques du système de fichiers"
---

Tous les utilisateurs partagent le même stockage. Ranger ses fichiers au mauvais endroit, les copier de la mauvaise façon ou dupliquer des données ralentit tout le monde et peut priver vos collègues de l'accès à vos fichiers. Les espaces de stockage eux-mêmes sont décrits dans [Systèmes de stockage](../hardware/storage.md).

## Quoi mettre où {#where-to-put-what}

| Quoi | Où | Pourquoi |
|------|----|----------|
| Scripts, fichiers de configuration | `$HOME` ou `/projects/<project>/scripts` | Sauvegardés ; `scripts/` est partagé avec l'équipe (git conseillé) |
| Calculs en cours, gros fichiers temporaires | `/scratch/<project>/<login>` | SSD rapides ; **non sauvegardé**, nettoyé après <Var name="scratchPurgeDays" /> jours sans utilisation |
| Fichiers intermédiaires dont vous aurez encore besoin | `/projects/<project>/work/` | Partagé, mais **non sauvegardé** |
| Résultats à conserver | `/projects/<project>/results/<login>/` | Sauvegardés, visibles par l'équipe |
| Journaux des jobs | `/projects/<project>/results/slurm_logs/` | Visibles par l'équipe pour le dépannage |
| Fichiers à partager avec les autres membres | `/projects/<project>/shared/` | Accessible en écriture aux membres du projet et des sous-projets |
| Données de séquençage brutes | `/projects/<project>/data/raw/` (raccourcis) | Lecture seule : lisez-les sur place |
| Génomes et bases de référence | `/references/<tool>/<version>` | Lecture seule : ne les copiez jamais |

Pour un sous-projet, remplacez `/projects/<project>` par `/projects/<project>/<sub-project>` et `/scratch/<project>/<login>` par `/scratch/<project>/<sub-project>/<login>`. Voir [Projets, sous-projets et rôles](../getting-started/projects.md).

## Copier des fichiers dans un projet {#copying-into-a-project}

Dans un dossier de projet, les nouveaux fichiers appartiennent automatiquement au projet et sont modifiables par toute l'équipe. **Copier en gardant les droits d'origine annule cette règle** : vos collègues risquent alors d'obtenir `Permission denied` sur vos fichiers.

```bash
# À UTILISER : ces commandes appliquent les droits du projet
cp -r my_folder /projects/malaria/results/<login>/
rsync -rlt my_folder /projects/malaria/results/<login>/

# À ÉVITER : elles conservent le groupe et les droits d'origine
cp -p ...
cp -a ...
rsync -a ...
mv ~/my_folder /projects/malaria/...  # déplacer depuis son home conserve les anciens droits
```

Si un collègue obtient `Permission denied` sur des fichiers que vous avez copiés, rendez ses droits au groupe :

```bash
chmod -R g+rwX /projects/malaria/my_folder
```

### Vérifier ses projets {#check-your-projects}

```bash
# Les projets (groupes) dont vous êtes membre
groups
id
```

Après avoir été ajouté à un projet, **déconnectez-vous puis reconnectez-vous** pour que le nouvel accès soit pris en compte.

## Données brutes et références {#raw-data-and-references}

- **Ne copiez ni ne modifiez jamais les données brutes.** `data/raw/` contient des raccourcis (liens) vers les runs des séquenceurs : lisez les fichiers directement depuis cet endroit. Attention, `cp -a` ou `rsync -a` sur un raccourci copient le lien, pas les données.
- **Ne téléchargez jamais votre propre copie d'une base partagée.** Utilisez la copie versionnée sous `/references`, par exemple :

```bash
kraken2 --db /references/kraken2/2026-11 --threads $SLURM_CPUS_PER_TASK sample.fastq
```

S'il manque une base ou une version, demandez-la par ticket sur <Var name="supportPortal" link />.

## Travailler dans le scratch {#scratch}

Une analyse type :

1. lit ses entrées dans `data/raw/` ou `/references` ;
2. écrit ses gros fichiers temporaires dans `/scratch/<project>/<login>` ;
3. copie les résultats finaux dans `/projects/<project>/results/<login>/` ;
4. supprime ce qui ne sert plus dans le scratch.

:::warning Le scratch est nettoyé
Les fichiers non utilisés depuis <Var name="scratchPurgeDays" /> jours sont supprimés automatiquement (avec un préavis de <Var name="scratchNoticeDays" /> jours) et sont **irrécupérables**. Ne laissez jamais la seule copie d'un résultat dans le scratch.
:::

N'utilisez pas `/tmp` sur les nœuds de calcul pour de gros fichiers : il est en mémoire (voir [/tmp des nœuds](../hardware/storage.md#node-tmp)).

## Garder un usage raisonnable {#keeping-usage-reasonable}

L'espace occupé est suivi par utilisateur et par projet. Merci de :

- nettoyer régulièrement `work/` et votre scratch ;
- éviter de garder plusieurs copies des mêmes données ;
- compresser ou archiver les résultats que vous n'utilisez plus activement.

```bash
# Taille de vos dossiers
du -sh /projects/malaria/results/<login> /scratch/malaria/<login>

# Vos 20 plus gros fichiers et dossiers dans le scratch
du -ah /scratch/malaria/<login> | sort -rh | head -20

# Archiver une analyse terminée
tar -czf old_analysis.tar.gz old_analysis/ && rm -rf old_analysis/
```

Les données anciennes ou inactives sont susceptibles d'être nettoyées.

## Éviter les nombreux petits fichiers {#avoid-small-file-accumulation}

Des milliers de petits fichiers dans un même dossier ralentissent le système de fichiers partagé pour tout le monde :

```bash
# MAUVAIS : des milliers de petits fichiers dans un seul dossier
output/
├── result_0001.txt
├── ... (10,000 files)
└── result_9999.txt

# MIEUX : organisés en sous-dossiers
output/
├── batch_001/
│   └── ... (100 files)
└── batch_100/
```

Autant que possible, utilisez des formats qui regroupent les données (FASTQ/BAM/CRAM compressés, HDF5, archives tar) plutôt que de nombreux petits fichiers texte.

## Conseils d'entrées/sorties {#io-optimization-tips}

### Réduire les opérations sur les fichiers {#minimize-file-operations}

```python
# MAUVAIS : ouvrir le fichier dans une boucle
for i in range(10000):
    with open('output.txt', 'a') as f:
        f.write(f"Result {i}\n")

# BON : ouvrir une fois, écrire plusieurs fois
with open('output.txt', 'w') as f:
    for i in range(10000):
        f.write(f"Result {i}\n")
```

### Limiter les fichiers de checkpoint {#batch-checkpoint-files}

```bash
# MAUVAIS : un fichier de checkpoint par étape
checkpoint_001.dat
checkpoint_002.dat
... (thousands of files)

# BON : checkpoint à intervalles, en écrasant le précédent
checkpoint_latest.dat
checkpoint_backup.dat
```

### Charges d'E/S importantes {#avoid-simultaneous-large-io-jobs}

Si vous prévoyez de lancer en même temps de nombreux jobs gourmands en entrées/sorties, contactez d'abord le support (<Var name="supportEmail" link />) pour en discuter.
