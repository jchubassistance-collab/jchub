'use client';

import { useState } from 'react';
import { Mail, MessageCircle, MapPin, Phone, Send, Sparkles, ArrowRight, Check, Clock } from 'lucide-react';

const contactMethods = [
  {
    icon: Mail,
    title: 'Email',
    value: 'hello@jchub.dev',
    description: 'Réponse sous 24h ouvrées',
    gradient: 'from-brand-500 to-purple-600',
    link: 'mailto:hello@jchub.dev',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    value: '+242 06 955 06 25',
    description: 'Réponse rapide en journée',
    gradient: 'from-emerald-500 to-teal-600',
    link: 'https://wa.me/242069550625',
  },
  {
    icon: Phone,
    title: 'Téléphone',
    value: '+242 06 955 06 25',
    description: 'Lun-Ven, 9h-18h (GMT+1)',
    gradient: 'from-amber-500 to-orange-600',
    link: 'tel:+242069550625',
  },
  {
    icon: MapPin,
    title: 'Localisation',
    value: 'Brazzaville, Congo 🇨🇬',
    description: 'Équipe 100% locale',
    gradient: 'from-pink-500 to-rose-600',
    link: '#',
  },
];

const subjects = [
  { value: 'support', label: 'Support technique' },
  { value: 'partnership', label: 'Partenariat / Auteur' },
  { value: 'press', label: 'Presse / Média' },
  { value: 'feedback', label: 'Suggestion / Feedback' },
  { value: 'other', label: 'Autre' },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: 'support',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Envoi impossible.');
      }
      if (result.warning) setError(result.warning);
      setSent(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Envoi impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="template-home overflow-hidden bg-[#eff6ff] text-[#0f172a]" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      {/* HERO */}
      <section className="template-home__hero relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff]">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(rgba(37,99,235,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.045) 1px,transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse at center,black 20%,transparent 76%)' }} />
        <div className="pointer-events-none absolute -left-36 top-32 h-80 w-80 rounded-full bg-blue-200/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-sky-200/70 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-20 lg:min-h-[690px] lg:grid-cols-[1.05fr_.95fr] lg:gap-8 lg:px-10 lg:pb-24 lg:pt-16">
          <div className="template-home__intro order-2 max-w-2xl lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm shadow-blue-900/5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" /> On te répond vite
            </div>
            <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#0f172a] sm:text-5xl lg:text-[4.25rem]" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>
              Une question ?
              <span className="mt-2 block text-blue-700">Parlons-en ensemble.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Notre équipe est basée à <strong className="text-[#0f172a]">Brazzaville</strong> et répond à tous
              tes messages. Que ce soit pour un bug, un partenariat ou juste dire bonjour.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#contact-form" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#93c5fd] px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#60a5fa] hover:shadow-lg hover:shadow-blue-900/10">
                Écrire à JcHub <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a href="mailto:hello@jchub.dev" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/10">
                hello@jchub.dev
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-blue-600" /> Réponse sous 24h</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-blue-600" /> Support local</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-blue-600" /> Équipe disponible</span>
            </div>
          </div>

          <div className="template-home__visual relative order-1 mx-auto flex w-full max-w-[510px] items-center justify-center lg:order-2 lg:justify-end">
            <div className="absolute inset-5 rounded-full bg-gradient-to-br from-blue-200 via-sky-100 to-blue-300 opacity-80 blur-2xl" />
            <span className="template-home__orbit template-home__orbit--one" aria-hidden="true" />
            <span className="template-home__orbit template-home__orbit--two" aria-hidden="true" />
            <span className="template-home__tech-dot template-home__tech-dot--one" aria-hidden="true" />
            <span className="template-home__tech-dot template-home__tech-dot--two" aria-hidden="true" />
            <span className="template-home__tech-dot template-home__tech-dot--three" aria-hidden="true" />
            <div className="template-home__circle relative aspect-square w-[min(82vw,400px)] rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] p-[18px] shadow-[40px_40px_80px_rgba(37,99,235,.2),-15px_-15px_40px_rgba(255,255,255,.9)] ring-1 ring-white/60 sm:w-[440px] lg:w-[480px]">
              <div className="template-home__circle-image relative h-full w-full overflow-hidden rounded-full border-[10px] border-white bg-white shadow-inner">
                <img src="/contact-abstract.svg" alt="Une équipe qui échange" className="absolute inset-0 h-full w-full object-contain p-8" />
              </div>
              <div className="template-home__badge template-home__badge--bottom absolute -bottom-1 left-0 flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-[0_16px_35px_rgba(15,23,42,.12)] sm:-left-8">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Mail className="h-5 w-5" /></span>
                <span><span className="block text-xs font-medium text-slate-500">Support réactif</span><strong className="mt-0.5 block text-sm text-[#0f172a]">Réponse sous 24h</strong></span>
              </div>
              <div className="template-home__badge template-home__badge--top absolute -right-1 top-7 hidden items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-[0_16px_35px_rgba(15,23,42,.12)] sm:flex">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><MapPin className="h-5 w-5" /></span>
                <span><span className="block text-xs font-medium text-slate-500">Équipe locale</span><strong className="mt-0.5 block text-sm text-[#0f172a]">Brazzaville</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT METHODS */}
      <section className="py-16 bg-[#eff6ff]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {contactMethods.map((method, index) => (
              <a
                key={method.title}
                href={method.link}
                style={{ animationDelay: `${index * 65}ms`, transform: 'perspective(1200px) rotateX(4deg) rotateY(-4deg)' }}
                className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_18px_40px_rgba(7,19,40,0.24)] backdrop-blur-sm transition-all hover:-translate-y-1.5 hover:border-[#9ccbff]/40 hover:shadow-[0_20px_50px_rgba(70,103,182,0.24)]"
              >
                <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${method.gradient} opacity-10 transition blur-2xl group-hover:opacity-20`} />
                <div className="relative">
                  <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${method.gradient} shadow-lg`}>
                    <method.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-1 font-bold text-[#0f172a]">{method.title}</h3>
                  <p className="mb-1 text-sm font-semibold text-blue-700">{method.value}</p>
                  <p className="text-xs text-slate-600">{method.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FORM + SIDEBAR */}
      <section id="contact-form" className="py-20 bg-[#eff6ff]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-[0_18px_40px_rgba(7,19,40,0.24)] backdrop-blur-sm" style={{ transform: 'perspective(1200px) rotateX(3deg) rotateY(-3deg)' }}>
                {sent ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg">
                      <Check className="h-10 w-10 text-[#0f172a]" />
                    </div>
                    <h2 className="mb-3 text-3xl font-black text-[#0f172a]">Message envoyé ! 🎉</h2>
                    <p className="mb-6 text-slate-600">On revient vers toi sous 24h ouvrées maximum.</p>
                    {error && <p className="mb-6 text-sm font-medium text-amber-300" role="status">{error}</p>}
                    <button
                      onClick={() => {
                        setSent(false);
                        setForm({ name: '', email: '', subject: 'support', message: '' });
                      }}
                      className="font-semibold text-blue-700 hover:underline"
                    >
                      Envoyer un autre message →
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="mb-2 text-2xl font-black text-[#0f172a]">Envoie-nous un message</h2>
                    <p className="mb-6 text-slate-600">Tous les champs marqués * sont obligatoires.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-slate-600">Nom complet *</label>
                          <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Jessy Ngnambongo"
                            className="w-full rounded-xl border border-blue-100 bg-[#f5f9ff] px-4 py-3 text-[#0f172a] placeholder:text-slate-500 focus:border-[#9ccbff] focus:outline-none focus:ring-2 focus:ring-[#9ccbff]/30 transition"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-slate-600">Email *</label>
                          <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="toi@email.com"
                            className="w-full rounded-xl border border-blue-100 bg-[#f5f9ff] px-4 py-3 text-[#0f172a] placeholder:text-slate-500 focus:border-[#9ccbff] focus:outline-none focus:ring-2 focus:ring-[#9ccbff]/30 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-600">Sujet *</label>
                        <select
                          required
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="w-full rounded-xl border border-blue-100 bg-[#f5f9ff] px-4 py-3 text-[#0f172a] focus:border-[#9ccbff] focus:outline-none focus:ring-2 focus:ring-[#9ccbff]/30 transition"
                        >
                          {subjects.map((s) => (
                            <option key={s.value} value={s.value} className="bg-[#f5f9ff] text-[#0f172a]">
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-600">Message *</label>
                        <textarea
                          required
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          rows={6}
                          placeholder="Décris ta question ou ton projet..."
                          className="w-full resize-none rounded-xl border border-blue-100 bg-[#f5f9ff] px-4 py-3 text-[#0f172a] placeholder:text-slate-500 focus:border-[#9ccbff] focus:outline-none focus:ring-2 focus:ring-[#9ccbff]/30 transition"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4a74d6] py-3.5 font-semibold text-white transition hover:bg-[#6fa3ff] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? (
                          <>Envoi en cours...</>
                        ) : (
                          <>
                            Envoyer le message
                            <Send className="h-4 w-4" />
                          </>
                        )}
                      </button>
                      {error && <p className="text-sm font-medium text-red-300" role="alert">{error}</p>}
                    </form>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl bg-gradient-to-br from-[#4a74d6] via-[#3c60b4] to-[#2d4a8f] p-6 text-white shadow-[0_22px_55px_rgba(10,20,40,0.45)] ring-1 ring-blue-100" style={{ transform: 'perspective(1200px) rotateX(4deg) rotateY(-4deg)' }}>
                <Sparkles className="mb-3 h-8 w-8" />
                <h3 className="mb-2 text-xl font-black">Besoin d&apos;une réponse rapide ?</h3>
                <p className="mb-4 text-sm text-slate-100">Consulte notre centre d&apos;aide, tu y trouveras peut-être ta réponse.</p>
                <a
                  href="/aide"
                  className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/30"
                >
                  Centre d&apos;aide
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(7,19,40,0.12)]" style={{ transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}>
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900">Horaires du support</h3>
                </div>
                <p className="mb-3 text-sm text-slate-600">Notre équipe est disponible :</p>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex justify-between">
                    <span>Du lundi au vendredi</span>
                    <span className="font-semibold text-slate-900">9h–18h</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Samedi</span>
                    <span className="font-semibold text-rose-700">Fermé</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Dimanche</span>
                    <span className="font-semibold text-slate-900">10h–15h</span>
                  </li>
                </ul>
                <div className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-500">
                  Réponse par e-mail sous 24 h ouvrées.
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(7,19,40,0.12)]" style={{ transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}>
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-pink-600" />
                  <h3 className="font-bold text-slate-900">Où se trouve notre équipe ?</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-700">
                  JcHub est une startup congolaise. <strong className="text-slate-900">Notre équipe est basée à Brazzaville, en République du Congo 🇨🇬.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
