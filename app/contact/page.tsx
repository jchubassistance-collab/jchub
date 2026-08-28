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
  { value: 'billing', label: 'Question sur un paiement' },
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
    <div className="contact-page overflow-hidden bg-[#f5f7f5]">
      {/* HERO */}
      <section className="contact-hero relative overflow-hidden bg-[#f7f8fa] py-20 text-slate-900">
        <div className="contact-grid absolute inset-0 opacity-25" />
        <div className="contact-glow contact-glow-one" />
        <div className="contact-glow contact-glow-two" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-orange-300/30 rounded-full px-4 py-1.5 text-sm font-semibold text-orange-700 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            On te répond vite 🚀
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
            Une question ?
            <br />
            <span className="text-orange-600">Parlons-en ensemble.</span>
          </h1>
          <p className="text-lg leading-relaxed text-slate-600 max-w-2xl mx-auto">
            Notre équipe est basée à <strong className="text-slate-900">Brazzaville</strong> et répond à tous
            tes messages. Que ce soit pour un bug, un partenariat, ou juste dire bonjour.
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-6 max-w-5xl px-4 sm:px-6 lg:px-8"><div className="contact-image-box relative overflow-hidden rounded-3xl border-4 border-white shadow-2xl"><img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85" alt="Une équipe qui échange" className="h-64 w-full object-cover sm:h-80" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" /><p className="absolute bottom-5 left-6 text-sm font-bold text-white">Une équipe disponible pour t'accompagner</p></div></div>

      {/* CONTACT METHODS */}
      <section className="contact-methods-section py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="contact-methods-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactMethods.map((method, index) => (
              <a
                key={method.title}
                href={method.link}
                style={{ animationDelay: `${index * 65}ms` }}
                className="contact-method-card group relative bg-white border border-gray-100 rounded-2xl p-6 hover:-translate-y-1.5 hover:shadow-xl transition-all overflow-hidden"
              >
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${method.gradient} opacity-10 group-hover:opacity-20 transition blur-2xl`} />
                <div className="relative">
                  <div className={`contact-method-icon w-12 h-12 rounded-xl bg-gradient-to-br ${method.gradient} flex items-center justify-center mb-3 shadow-lg transition`}>
                    <method.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{method.title}</h3>
                  <p className="text-sm font-semibold text-brand-600 mb-1">{method.value}</p>
                  <p className="text-xs text-gray-500">{method.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FORM + SIDEBAR */}
      <section className="contact-form-section py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="contact-form-card bg-white border border-gray-100 rounded-3xl p-8 shadow-sm backdrop-blur-sm">
                {sent ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-lg">
                      <Check className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-black mb-3">Message envoyé ! 🎉</h2>
                    <p className="text-gray-600 mb-6">On revient vers toi sous 24h ouvrées maximum.</p>
                    {error && <p className="mb-6 text-sm font-medium text-amber-700" role="status">{error}</p>}
                    <button
                      onClick={() => {
                        setSent(false);
                        setForm({ name: '', email: '', subject: 'support', message: '' });
                      }}
                      className="text-brand-600 font-semibold hover:underline"
                    >
                      Envoyer un autre message →
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-black mb-2">Envoie-nous un message</h2>
                    <p className="text-gray-600 mb-6">Tous les champs marqués * sont obligatoires.</p>

                    <form onSubmit={handleSubmit} className="contact-form-content space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="contact-form-group">
                          <label className="block text-sm font-semibold mb-1.5 text-slate-700">Nom complet *</label>
                          <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Jessy Ngnambongo"
                            className="contact-form-input w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                          />
                        </div>
                        <div className="contact-form-group">
                          <label className="block text-sm font-semibold mb-1.5 text-slate-700">Email *</label>
                          <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="toi@email.com"
                            className="contact-form-input w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                          />
                        </div>
                      </div>

                      <div className="contact-form-group">
                        <label className="block text-sm font-semibold mb-1.5 text-slate-700">Sujet *</label>
                        <select
                          required
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="contact-form-select w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition"
                        >
                          {subjects.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="contact-form-group">
                        <label className="block text-sm font-semibold mb-1.5 text-slate-700">Message *</label>
                        <textarea
                          required
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          rows={6}
                          placeholder="Décris ta question ou ton projet..."
                          className="contact-form-textarea w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none transition"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="contact-submit-btn w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>Envoi en cours...</>
                        ) : (
                          <>
                            Envoyer le message
                            <Send className="w-4 h-4" />
                          </>
                        )}
                      </button>
                      {error && <p className="text-sm font-medium text-red-600" role="alert">{error}</p>}
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="contact-sidebar space-y-5">
              {/* FAQ Card */}
              <div className="contact-faq-card bg-gradient-to-br from-orange-600 via-orange-700 to-orange-800 rounded-3xl p-6 text-white">
                <Sparkles className="w-8 h-8 mb-3" />
                <h3 className="font-black text-xl mb-2">Besoin d'une réponse rapide ?</h3>
                <p className="text-white/90 text-sm mb-4">Consulte notre centre d'aide, tu y trouveras peut-être ta réponse.</p>
                <a
                  href="/aide"
                  className="inline-flex items-center gap-1 text-sm font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition"
                >
                  Centre d'aide
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Hours */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-brand-600" />
                  <h3 className="font-bold">Heures de support</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-gray-600">Lundi - Vendredi</span>
                    <span className="font-semibold">9h - 18h</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Samedi</span>
                    <span className="font-semibold">10h - 15h</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Dimanche</span>
                    <span className="text-gray-400">Fermé</span>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                  ⏰ Réponse email sous 24h ouvrées
                </div>
              </div>

              {/* Localisation */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-pink-500" />
                  <h3 className="font-bold">On est où ?</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  JcHub est une startup 100% <strong>Made in Congo Brazzaville 🇨🇬</strong>.
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
