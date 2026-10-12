import { LegalPage, ToComplete } from "@/components/layout/LegalPage";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Mentions légales | Muriel Calas, préparatrice mentale",
  description: "Mentions légales du site de Muriel Calas, préparatrice mentale à Narbonne (Aude).",
  path: "/mentions-legales",
});

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" path="/mentions-legales" updated="octobre 2026">
      <h2>Éditrice du site</h2>
      <p>
        Muriel Calas — Préparatrice mentale
        <br />
        Adresse professionnelle : <ToComplete>adresse</ToComplete>, {site.location.postalCode} {site.location.locality}
        <br />
        SIRET : <ToComplete>numéro SIRET</ToComplete>
        <br />
        Téléphone : <a href={site.phone.href}>{site.phone.display}</a>
        <br />
        Responsable de la publication : Muriel Calas
      </p>

      <h2>Hébergement</h2>
      <p>
        OVH SAS
        <br />
        2 rue Kellermann, 59100 Roubaix, France
        <br />
        Téléphone : 1007
      </p>

      <h2>Conception et réalisation</h2>
      <p>
        Noctalis — <a href="https://noctalis.digital">noctalis.digital</a>
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L’ensemble des contenus de ce site (textes, logo, éléments graphiques) est la propriété de Muriel Calas, sauf
        mention contraire. Toute reproduction, même partielle, est soumise à autorisation préalable.
      </p>
      <p>
        Crédits photos : portrait © Muriel Calas. Photographies d’illustration issues de banques d’images libres de
        droits (StockSnap, Rawpixel — licence CC0) et du site précédent.
      </p>

      <h2>Nature de l’activité</h2>
      <p>
        La préparation mentale est une démarche d’accompagnement et d’entraînement. Elle ne constitue ni un acte
        médical, ni une psychothérapie, et ne remplace pas un avis ou un suivi médical.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données transmises via le formulaire de contact est décrit dans la{" "}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>
    </LegalPage>
  );
}
