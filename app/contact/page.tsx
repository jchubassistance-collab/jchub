'use client';

import { useState } from 'react';
import { Mail, MessageCircle, MapPin, Phone, Send, Sparkles, ArrowRight, Check, Clock } from 'lucide-react';
import { TurnstileWidget } from '@/components/TurnstileWidget';

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
  const [turnstileToken, setTurnstileToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, turnstileToken }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Envoi impossible.');
      if (result.warning) setError(result.warning);
      setSent(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Envoi impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#020b1a] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(89,126,255,0.30),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(94,138,230,0.20),_transparent_35%),linear-gradient(135deg,_#020b1a_0%,_#091b3d_32%,_#123f8c_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),_transparent_55%)]" />
        <div className="absolute -left-28 bottom-[-80px] h-80 w-80 rounded-full border border-white/10 bg-[#3a68d9]/15 blur-3xl" />
        <div className="absolute right-[-60px] top-[-40px] h-72 w-72 rounded-full border border-white/10 bg-[#96c7ff]/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8 lg:min-h-[920px] lg:pb-28 lg:pt-10">
          <div className="flex items-center justify-end" aria-hidden="true" />

          <div className="mt-5 grid items-center gap-6 lg:mt-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10" style={{ transform: 'perspective(1200px) rotateX(1.5deg) rotateY(-2deg)' }}>
            <div className="order-last max-w-xl lg:order-first">
              <p className="mb-4 hidden text-sm font-semibold uppercase tracking-[0.28em] text-[#b6d6ff] sm:block">On te répond vite</p>
              <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Une question ?
                <span className="mt-2 block text-[#9ccbff]">Parlons-en ensemble.</span>
              </h1>
              <p className="mt-4 hidden max-w-lg text-base leading-relaxed text-slate-200 sm:mt-5 sm:block sm:text-lg">
                Notre équipe est basée à <strong className="text-white">Brazzaville</strong> et répond à tous
                tes messages. Que ce soit pour un bug, un partenariat ou juste dire bonjour.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-4 sm:mt-8">
                <a
                  href="#contact-form"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#0b1730] transition hover:scale-[1.02] hover:bg-[#eaf3ff]"
                >
                  Écrire à JcHub <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="mailto:hello@jchub.dev"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  hello@jchub.dev
                </a>
              </div>

              <div className="mt-8 hidden flex-wrap gap-5 text-sm text-slate-200 sm:flex">
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#9ccbff]" /> Réponse sous 24h</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#9ccbff]" /> Support local</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#9ccbff]" /> Équipe disponible</span>
              </div>
            </div>

            <div className="relative order-first mx-auto ml-auto w-full max-w-[560px] lg:order-last">
              <div className="absolute -left-8 top-10 h-36 w-36 rounded-full bg-[#a9d0ff]/20 blur-3xl" />
              <div className="absolute -right-8 bottom-6 h-32 w-32 rounded-full bg-[#dfeeff]/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-[#9ccbff]/20 bg-white/5 p-3 shadow-[0_35px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm" style={{ transform: 'perspective(1200px) rotateX(4deg) rotateY(-5deg)' }}>
                <img
                  src="/contact-abstract.svg"
                  alt="Une équipe qui échange"
                  className="h-[340px] w-full rounded-[1.5rem] object-contain bg-[#0d1c38] sm:h-[560px] lg:h-[640px]"
                />
              </div>

              <div className="absolute -left-4 bottom-8 hidden rounded-2xl border border-white/10 bg-[#0d1c38]/90 px-4 py-3 shadow-[0_20px_40px_rgba(5,12,25,0.4)] backdrop-blur-md sm:block">
                <div className="text-xs uppercase tracking-[0.2em] text-[#9ccbff]">Support</div>
                <div className="mt-2 text-2xl font-black text-white">24h</div>
                <div className="text-xs text-slate-300">réponse max</div>
              </div>

              <div className="absolute -right-3 top-8 hidden rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-[0_20px_40px_rgba(11,20,40,0.35)] backdrop-blur-md sm:block">
                <div className="text-xs uppercase tracking-[0.2em] text-[#dfeeff]">Local</div>
                <div className="mt-2 text-sm font-semibold text-white">Brazzaville, Congo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT METHODS */}
      <section className="py-16 bg-[#020b1a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {contactMethods.map((method, index) => (
              <a
                key={method.title}
                href={method.link}
                style={{ animationDelay: `${index * 65}ms`, transform: 'perspective(1200px) rotateX(4deg) rotateY(-4deg)' }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(13,28,52,0.72)] p-6 shadow-[0_18px_40px_rgba(7,19,40,0.24)] backdrop-blur-sm transition-all hover:-translate-y-1.5 hover:border-[#9ccbff]/40 hover:shadow-[0_20px_50px_rgba(70,103,182,0.24)]"
              >
                <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${method.gradient} opacity-10 transition blur-2xl group-hover:opacity-20`} />
                <div className="relative">
                  <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${method.gradient} shadow-lg`}>
                    <method.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-1 font-bold text-white">{method.title}</h3>
                  <p className="mb-1 text-sm font-semibold text-[#9ccbff]">{method.value}</p>
                  <p className="text-xs text-slate-300">{method.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FORM + SIDEBAR */}
      <section className="py-20 bg-[#020b1a]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-[#9ccbff]/20 bg-[rgba(13,28,52,0.8)] p-8 shadow-[0_18px_40px_rgba(7,19,40,0.24)] backdrop-blur-sm" style={{ transform: 'perspective(1200px) rotateX(3deg) rotateY(-3deg)' }}>
                {sent ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg">
                      <Check className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="mb-3 text-3xl font-black text-white">Message envoyé ! 🎉</h2>
                    <p className="mb-6 text-slate-300">On revient vers toi sous 24h ouvrées maximum.</p>
                    {error && <p className="mb-6 text-sm font-medium text-amber-300" role="status">{error}</p>}
                    <button
                      onClick={() => {
                        setSent(false);
                        setForm({ name: '', email: '', subject: 'support', message: '' });
                      }}
                      className="font-semibold text-[#9ccbff] hover:underline"
                    >
                      Envoyer un autre message →
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="mb-2 text-2xl font-black text-white">Envoie-nous un message</h2>
                    <p className="mb-6 text-slate-300">Tous les champs marqués * sont obligatoires.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-slate-200">Nom complet *</label>
                          <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Jessy Ngnambongo"
                            className="w-full rounded-xl border border-white/10 bg-[#071427] px-4 py-3 text-white placeholder:text-slate-400 focus:border-[#9ccbff] focus:outline-none focus:ring-2 focus:ring-[#9ccbff]/30 transition"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-slate-200">Email *</label>
                          <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="toi@email.com"
                            className="w-full rounded-xl border border-white/10 bg-[#071427] px-4 py-3 text-white placeholder:text-slate-400 focus:border-[#9ccbff] focus:outline-none focus:ring-2 focus:ring-[#9ccbff]/30 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-200">Sujet *</label>
                        <select
                          required
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-[#071427] px-4 py-3 text-white focus:border-[#9ccbff] focus:outline-none focus:ring-2 focus:ring-[#9ccbff]/30 transition"
                        >
                          {subjects.map((s) => (
                            <option key={s.value} value={s.value} className="bg-[#071427] text-white">
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-200">Message *</label>
                        <textarea
                          required
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          rows={6}
                          placeholder="Décris ta question ou ton projet..."
                          className="w-full resize-none rounded-xl border border-white/10 bg-[#071427] px-4 py-3 text-white placeholder:text-slate-400 focus:border-[#9ccbff] focus:outline-none focus:ring-2 focus:ring-[#9ccbff]/30 transition"
                        />
                      </div>

                      <TurnstileWidget onToken={setTurnstileToken} />
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
              <div className="rounded-3xl bg-gradient-to-br from-[#4a74d6] via-[#3c60b4] to-[#2d4a8f] p-6 text-white shadow-[0_22px_55px_rgba(10,20,40,0.45)] ring-1 ring-white/10" style={{ transform: 'perspective(1200px) rotateX(4deg) rotateY(-4deg)' }}>
                <Sparkles className="mb-3 h-8 w-8" />
                <h3 className="mb-2 text-xl font-black">Besoin d'une réponse rapide ?</h3>
                <p className="mb-4 text-sm text-slate-100">Consulte notre centre d'aide, tu y trouveras peut-être ta réponse.</p>
                <a
                  href="/aide"
                  className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/30"
                >
                  Centre d'aide
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[rgba(13,28,52,0.8)] p-6 shadow-[0_18px_40px_rgba(7,19,40,0.24)] backdrop-blur-sm" style={{ transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}>
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#9ccbff]" />
                  <h3 className="font-bold text-white">Heures de support</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex justify-between">
                    <span>Lundi - Vendredi</span>
                    <span className="font-semibold text-white">9h - 18h</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Samedi</span>
                    <span className="font-semibold text-white">10h - 15h</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Dimanche</span>
                    <span className="text-slate-400">Fermé</span>
                  </li>
                </ul>
                <div className="mt-4 border-t border-white/10 pt-4 text-xs text-slate-400">
                  ⏰ Réponse email sous 24h ouvrées
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[rgba(13,28,52,0.8)] p-6 shadow-[0_18px_40px_rgba(7,19,40,0.24)] backdrop-blur-sm" style={{ transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}>
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-pink-400" />
                  <h3 className="font-bold text-white">On est où ?</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                  JcHub est une startup 100% <strong className="text-white">Made in Congo Brazzaville 🇨🇬</strong>.
                  Notre équipe travaille depuis Brazzaville.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
