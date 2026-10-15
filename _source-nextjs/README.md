# Muriel Calas — Préparatrice mentale

Refonte du site [muriel-calas.fr](https://www.muriel-calas.fr) : Next.js 16 (App Router), TypeScript, Tailwind CSS 4.
Aucune librairie d’animation : un petit orchestrateur maison (`src/components/motion/Motion.tsx`) gère les apparitions, la parallaxe légère et les tracés, et respecte `prefers-reduced-motion`.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de production (toutes les pages sont pré-rendues)
npm run check      # typographie + types + lint
npm run export:html  # régénère le site HTML autonome dans le dossier parent
```

**Livrable : le site HTML** (dossier parent : `index.html`, pages `.html`, `assets/`, `images/`).
Ce dossier `_source-nextjs` n’est que l’atelier : on y modifie les contenus, puis `npm run export:html`
reconstruit les pages HTML. Les interactions du site HTML sont dans `scripts/html/site.js` (JavaScript natif).
Le formulaire du site HTML s’active en renseignant `CONTACT_ENDPOINT` en tête de `assets/js/site.js`
(ex. un formulaire Formspree).

Copier `.env.example` en `.env.local` et renseigner les valeurs (voir plus bas).

## Où modifier quoi

| Besoin | Fichier |
| --- | --- |
| Téléphone, horaires, lien Calendly, communes, navigation | `src/content/site.ts` |
| Offres et tarifs | `src/content/offers.ts` |
| Témoignages | `src/content/testimonials.ts` |
| FAQ | `src/content/faq.ts` |
| Publics (sportifs, étudiants, encadrants) | `src/content/audiences.ts` |
| Étapes, engagements, outils, déroulé de séance | `src/content/approach.ts` |
| Articles du blog | `content/blog/*.md` (voir `content/blog/README.md`) |
| Couleurs, typographie, boutons, animations | `src/app/globals.css` |

Après une modification de texte : `npm run typo` ajoute automatiquement les espaces insécables françaises (avant `? ! : ;`, dans les guillemets, entre un nombre et son unité). Le script ne touche que les textes, jamais le code.

## Variables d’environnement

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_CALENDLY_URL` | Lien Calendly de Muriel. Tant qu’il est vide, « Prendre rendez-vous » mène à `/contact#rendez-vous` (appel téléphonique + formulaire). Une fois renseigné, l’agenda s’affiche dans la page contact au clic (pas de script tiers ni de popup au chargement). |
| — | Formulaire de contact : envoi par l’API Noctalis (`siteId` `muriel-calas`, voir `src/lib/contact-email.ts` et `scripts/html/site.js`, à garder synchronisés). Le destinataire est configuré côté API, jamais dans le site. |

## Architecture

```
content/blog/            Articles Markdown (1 fichier = 1 article)
public/brand/            Logo (symbole en masque, wordmark SVG), favicons
public/images/           Photos optimisées (servies en AVIF/WebP par next/image)
public/og/               Image de partage réseaux sociaux
scripts/typo-fr.mjs      Typographie française automatique
src/app/                 Pages (URL identiques à l’ancien site) + sitemap, robots, RSS, API contact
src/components/          layout/, sections/, ui/, blog/, contact/, motion/, seo/
src/content/             Contenus structurés
src/lib/                 SEO (métadonnées + JSON-LD), blog, utilitaires
```

URL conservées : `/`, `/a-propos`, `/accompagnement`, `/public`, `/tarifs`, `/temoignages`, `/cycle-menstruel`, `/contact`, `/publications-presse`. Redirections 301 : `/cgu` → `/mentions-legales`, `/blog.rss` → `/blog/rss.xml`.

## SEO

- `title`, `description`, canonical, Open Graph et Twitter Card uniques par page (`pageMetadata` dans `src/lib/seo.ts`)
- JSON-LD : `ProfessionalService` (commune + code postal uniquement, zone desservie, horaires, offres), `Person`, `WebSite`, `FAQPage` (accueil), `BreadcrumbList` (pages intérieures), `Blog` et `BlogPosting`
- `sitemap.xml`, `robots.txt`, flux RSS `/blog/rss.xml`

## Avant la mise en ligne

- [ ] Renseigner `NEXT_PUBLIC_CALENDLY_URL` (introuvable sur l’ancien site)
- [ ] Configurer l’envoi du formulaire (Resend ou équivalent)
- [ ] Compléter les mentions légales et la politique de confidentialité (adresse professionnelle, SIRET, hébergeur, e-mail RGPD, durée de conservation) : les champs sont surlignés `[À compléter]`
- [ ] Si une adresse professionnelle peut être publiée : l’ajouter dans `site.location` pour renforcer la cohérence NAP (Google Business Profile)
- [ ] Faire valider par Muriel les textes nouveaux (récit « À propos », situations types, page cycle menstruel)
- [ ] Idéalement : de nouvelles photos de Muriel en situation (séance, bord de terrain) pour remplacer une partie des photos d’illustration

## Crédits photos

Portrait : © Muriel Calas. Photos d’Ilan et visuels repris de l’ancien site. Illustrations complémentaires : StockSnap et Rawpixel (licence CC0).
