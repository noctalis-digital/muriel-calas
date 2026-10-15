# Site Muriel Calas — préparatrice mentale

Site statique : `index.html` à la racine, une page `.html` par rubrique. Il s'ouvre en double-clic et
s'héberge sur n'importe quel serveur (le `.htaccess` gère les URL propres sur Apache).

## Organisation du dossier

| Élément | Contenu |
|---|---|
| `index.html` et les autres `.html` | Les pages du site |
| `blog/` | L'article de blog et le flux RSS |
| `assets/` | CSS, JavaScript natif et polices |
| `images/`, `brand/`, `og/` | Photos, logos et images de partage |
| `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, `.htaccess` | Fichiers techniques |
| `_source-nextjs/` | Le projet source qui génère le site |
| `_ressources/` | Sources non publiées : photos d'origine et logos fournis |

## Mettre le site en ligne

Envoyer tout le contenu de la racine **sauf** `_source-nextjs/`, `_ressources/` et `README.md`.

## Modifier le site

```bash
cd _source-nextjs
npm install        # la première fois seulement
npm run export:html
```

La commande régénère les pages à la racine, retire les images devenues inutiles et supprime les copies
créées par la synchronisation iCloud.

## Points ouverts

- Formulaire de contact : branché sur l’API Noctalis (`siteId` `muriel-calas`). En local (fichier ou localhost), rien n’est envoyé.
- Prise de rendez-vous : sans lien Calendly, les boutons mènent à `contact.html#rendez-vous`.
- Mentions légales et politique de confidentialité : champs marqués « À compléter ».
- `site.email` dans `_source-nextjs/src/content/site.ts` : vide, les devis passent donc par le formulaire.

## Aperçu en ligne

<https://noctalis-digital.github.io/muriel-calas/> — branche `gh-pages`, en `noindex` pour ne pas
concurrencer le site officiel sur Google.

Réalisé par [Noctalis](https://noctalis.digital).
