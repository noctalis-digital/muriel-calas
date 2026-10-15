"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { isEmail, readContact, sendContact } from "@/lib/contact-email";

const profiles = ["Sportif·ve", "Parent d’un sportif", "Étudiant·e", "Entraîneur·e / coach", "Autre"];
const subjects = [
  "Appel découverte",
  "Accompagnement sportif",
  "Stress des examens",
  "Cycle menstruel",
  "Intervention en club / équipe",
  "Demande de devis",
  "Autre demande",
];

type Errors = Partial<Record<"firstName" | "lastName" | "email" | "message" | "consent", string>>;

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [serverMessage, setServerMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const validate = (data: FormData): Errors => {
    const e: Errors = {};
    if (!String(data.get("firstName") || "").trim()) e.firstName = "Indiquez votre prénom.";
    if (!String(data.get("lastName") || "").trim()) e.lastName = "Indiquez votre nom.";
    const email = String(data.get("email") || "").trim();
    if (!email) e.email = "Indiquez votre adresse e-mail.";
    else if (!isEmail(email)) e.email = "Cette adresse e-mail ne semble pas valide.";
    if (String(data.get("message") || "").trim().length < 10) e.message = "Quelques mots sur votre situation (10 caractères minimum).";
    if (!data.get("consent")) e.consent = "Merci d’accepter le traitement de vos données pour que je puisse vous répondre.";
    return e;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    if (status === "sending") return; // évite les doubles envois
    if (data.get("website")) {
      // Piège à robots rempli : succès simulé, rien n’est envoyé
      setStatus("sent");
      return;
    }
    setStatus("sending");
    setServerMessage("");
    try {
      await sendContact(readContact(data));
      setStatus("sent");
      form.reset();
    } catch {
      setServerMessage("L’envoi n’a pas abouti.");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div role="status" className="rounded-[var(--radius-card)] border border-line bg-paper p-8 md:p-12">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-navy text-paper">
          <Check size={22} />
        </span>
        <h3 className="display-sm mt-6 text-ink">Merci, votre message est bien parti.</h3>
        <p className="mt-4 max-w-md text-muted">
          Je vous réponds personnellement dans les meilleurs délais. Si c’est urgent, n’hésitez pas à m’appeler.
        </p>
        <button type="button" onClick={() => setStatus("idle")} className="link-line mt-8 text-ink">
          Envoyer un autre message
        </button>
      </div>
    );
  }

  const field = (name: keyof Errors) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form data-contact-form ref={formRef} noValidate onSubmit={onSubmit} className="grid gap-6" aria-describedby="form-note">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="firstName" className="field-label">
            Prénom <span aria-hidden="true" className="text-clay">*</span>
          </label>
          <input id="firstName" name="firstName" autoComplete="given-name" className="field-input" required {...field("firstName")} />
          {errors.firstName && <p id="firstName-error" className="field-error">{errors.firstName}</p>}
        </div>
        <div className="field">
          <label htmlFor="lastName" className="field-label">
            Nom <span aria-hidden="true" className="text-clay">*</span>
          </label>
          <input id="lastName" name="lastName" autoComplete="family-name" className="field-input" required {...field("lastName")} />
          {errors.lastName && <p id="lastName-error" className="field-error">{errors.lastName}</p>}
        </div>
        <div className="field">
          <label htmlFor="email" className="field-label">
            E-mail <span aria-hidden="true" className="text-clay">*</span>
          </label>
          <input id="email" name="email" type="email" autoComplete="email" inputMode="email" className="field-input" required {...field("email")} />
          {errors.email && <p id="email-error" className="field-error">{errors.email}</p>}
        </div>
        <div className="field">
          <label htmlFor="phone" className="field-label">
            Téléphone <span className="font-normal text-muted">(pour être rappelé·e)</span>
          </label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" className="field-input" />
        </div>
      </div>

      <fieldset className="grid gap-3">
        <legend className="field-label mb-3">Je suis…</legend>
        <div className="flex flex-wrap gap-2">
          {profiles.map((p, i) => (
            <label key={p} className="cursor-pointer">
              <input type="radio" name="profile" value={p} defaultChecked={i === 0} className="peer sr-only" />
              <span className="inline-flex min-h-11 items-center rounded-full border border-ink/20 bg-paper px-4 text-[0.95rem] text-ink transition-[color,background-color,border-color,transform] duration-300 ease-[var(--ease-out)] hover:border-ink/50 active:scale-[0.97] peer-checked:border-navy peer-checked:bg-navy peer-checked:text-paper peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-clay">
                {p}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="subject" className="field-label">
          Sujet
        </label>
        <div className="relative">
          <select id="subject" name="subject" className="field-input appearance-none pr-11">
            {subjects.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-navy">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      <div className="field">
        <label htmlFor="message" className="field-label">
          Message <span aria-hidden="true" className="text-clay">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Votre situation, votre discipline ou vos échéances, ce que vous aimeriez travailler…"
          className="field-input min-h-40 resize-y"
          required
          {...field("message")}
        />
        {errors.message && <p id="message-error" className="field-error">{errors.message}</p>}
      </div>

      {/* Piège à robots : invisible pour les humains */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Ne pas remplir</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="field">
        <label className="flex cursor-pointer items-start gap-3 text-[0.95rem] text-muted">
          <input
            type="checkbox"
            name="consent"
            value="oui"
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-navy"
            {...field("consent")}
          />
          <span>
            J’accepte que mes données soient utilisées pour répondre à ma demande. Elles ne sont ni cédées ni
            utilisées à d’autres fins. <Link href="/confidentialite" className="text-link text-ink">En savoir plus</Link>.
            <span aria-hidden="true" className="text-clay"> *</span>
          </span>
        </label>
        {errors.consent && <p id="consent-error" className="field-error">{errors.consent}</p>}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p id="form-note" className="text-sm text-muted">
          <span aria-hidden="true" className="text-clay">*</span> Champs obligatoires
        </p>
        <button type="submit" disabled={status === "sending"} className={cn("btn btn-primary", status === "sending" && "opacity-70")}>
          <span>{status === "sending" ? "Envoi en cours…" : "Envoyer mon message"}</span>
          <span className="btn-icon">
            <ArrowRight size={15} />
            <ArrowRight size={15} />
          </span>
        </button>
      </div>

      <p aria-live="polite" className="text-sm">
        {status === "error" && (
          <span className="field-error">
            {serverMessage} Vous pouvez aussi appeler le 06 22 06 44 59.
          </span>
        )}
      </p>
    </form>
  );
}
