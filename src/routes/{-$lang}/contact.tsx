import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import contactImage from "@/assets/contact-machine.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n/context";

// Owner contact details (location is still a placeholder).
const CONTACT = {
  email: "abdullahadil2425@gmail.com",
  phone: "+93 773 099 691",
  location: "Kabul, Afghanistan",
};

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact PDF ADIL — Questions, ideas and support" },
      { name: "description", content: "Get in touch with the PDF ADIL team by email, phone or WhatsApp." },
      { property: "og:title", content: "Contact PDF ADIL" },
      { property: "og:description", content: "Questions, ideas or a tool you need? Get in touch." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`PDF ADIL — ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n${form.name}\n${form.email}`);
    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
  };

  const info = [
    { icon: Mail, label: t("c_email"), value: CONTACT.email, href: `mailto:${CONTACT.email}`, tone: "bg-fmt-pdf/15 text-fmt-pdf" },
    { icon: Phone, label: t("c_phone"), value: CONTACT.phone, href: `https://wa.me/${CONTACT.phone.replace(/\D/g, "")}`, tone: "bg-fmt-excel/15 text-fmt-excel" },
    { icon: MapPin, label: t("c_location"), value: CONTACT.location, href: undefined, tone: "bg-fmt-word/15 text-fmt-word" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold sm:text-5xl">{t("contact_title")}</h1>
          <p className="text-lg text-muted-foreground">{t("contact_sub")}</p>
          <img
            src={contactImage}
            alt="A friendly robot sending messages"
            width={1024}
            height={1024}
            loading="lazy"
            className="mx-auto w-full max-w-sm rounded-[2.5rem] border border-border shadow-soft"
          />
        </div>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {info.map(({ icon: Icon, label, value, href, tone }) => {
              const content = (
                <>
                  <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
                    <Icon className="size-5" />
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                  <span dir="ltr" className="text-sm font-semibold break-all text-foreground">{value}</span>
                </>
              );
              const cls = "flex flex-col gap-2 rounded-3xl border border-border bg-card p-4 shadow-soft";
              return href ? (
                <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={`${cls} transition-colors hover:border-primary/40`}>
                  {content}
                </a>
              ) : (
                <div key={label} className={cls}>{content}</div>
              );
            })}
          </div>

          <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("f_name")}</Label>
                <Input id="name" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("f_email")}</Label>
                <Input id="email" type="email" dir="ltr" required maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl bg-background" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">{t("f_message")}</Label>
              <Textarea id="message" required rows={6} maxLength={2000} dir="auto" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="rounded-xl bg-background" />
            </div>
            <Button type="submit" size="lg" className="w-full gap-2 rounded-full">
              <Send className="size-4 rtl:-scale-x-100" /> {t("f_send")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
