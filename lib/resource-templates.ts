import { AlignmentType, Document, Footer, HeadingLevel, Packer, Paragraph, ShadingType, TextRun } from 'docx';
import type { Locale } from '../i18n/routing';

/**
 * Full text of the templates that are sent by email (see lib/resources.ts), and the Word file
 * built from it. Only the API routes import this file: if a page or a client component did,
 * the text would ship to every visitor and the email would no longer be needed (a test checks it).
 *
 * In the text, [brackets] mark what the reader fills in: they are highlighted in the file.
 * A paragraph starting with "- " is a bullet.
 */

type TemplateSection = { title: string; paragraphs: string[]; hint?: string };
type TemplateText = { title: string; subtitle: string; notice: string; sections: TemplateSection[]; footer: string };

const CONTRACT: Record<Locale, TemplateText> = {
  fr: {
    title: 'Contrat de prestation de services',
    subtitle: 'Conception et réalisation d’un site web (pays de l’espace OHADA)',
    notice: 'Modèle fourni à titre indicatif par JcHub. Il ne remplace pas le conseil d’un avocat ou d’un juriste : adapte-le à ta situation et fais-le relire avant de le signer, surtout pour un projet important. Remplace tout le texte surligné entre crochets [ ] et supprime les clauses qui ne te concernent pas, ainsi que ce paragraphe.',
    sections: [
      { title: 'Article 1 – Parties', paragraphs: [
        'Entre : [nom ou raison sociale du prestataire], [forme juridique : entreprise individuelle, SARL, SAS…], immatriculé(e) au Registre du commerce et du crédit mobilier (RCCM) de [ville] sous le numéro [numéro RCCM], numéro d’identification fiscale [NIU, IFU…], dont le siège est situé [adresse], représenté(e) par [nom et fonction], ci-après « le Prestataire » ;',
        'Et : [nom ou raison sociale du client], [forme juridique], immatriculé(e) au RCCM de [ville] sous le numéro [numéro RCCM], dont le siège est situé [adresse], représenté(e) par [nom et fonction], ci-après « le Client ».',
      ] },
      { title: 'Article 2 – Objet', paragraphs: [
        'Le présent contrat a pour objet la conception et la réalisation par le Prestataire d’un site web [vitrine / boutique en ligne / application web] pour le Client, accessible à l’adresse [nom de domaine].',
        'Les pages, fonctionnalités et contenus attendus sont décrits dans le cahier des charges joint en annexe 1, qui fait partie du contrat. En cas de contradiction, le présent contrat prévaut sur ses annexes.',
        'Toute prestation non prévue au cahier des charges fait l’objet d’un devis complémentaire, accepté par écrit par le Client avant sa réalisation.',
      ] },
      { title: 'Article 3 – Délais', paragraphs: [
        'Le Prestataire s’engage à respecter le planning suivant : maquettes le [date], version de test le [date], mise en ligne au plus tard le [date].',
        'Ces délais courent à compter de la réception de l’acompte et des contenus fournis par le Client. Tout retard du Client dans la remise des contenus ou dans ses validations décale la livraison d’autant.',
      ] },
      { title: 'Article 4 – Prix et paiement', paragraphs: [
        'Le prix total des prestations est de [montant] FCFA [HT / TTC], détaillé dans le devis n° [numéro] du [date] joint en annexe 2.',
        'Il est payé ainsi :',
        '- [40] % à la signature du contrat, à titre d’acompte ;',
        '- [30] % à la validation des maquettes ;',
        '- le solde à la mise en ligne du site.',
        'Les paiements se font par [virement bancaire / Mobile Money au numéro … / chèque], dans un délai de [15] jours à réception de la facture.',
        'Tout retard de paiement, après une relance restée sans effet pendant [8] jours, entraîne des pénalités de [taux] % du montant dû par mois de retard et permet au Prestataire de suspendre ses travaux jusqu’au paiement.',
        'Les frais de nom de domaine, d’hébergement, de licences et de services tiers sont [inclus dans le prix / à la charge du Client].',
      ] },
      { title: 'Article 5 – Obligations des parties', paragraphs: [
        'Le Prestataire réalise les prestations avec soin et selon les règles de l’art. Il est tenu d’une obligation de moyens. Il informe le Client de l’avancement du projet, le conseille sur les choix techniques et l’alerte sans attendre sur les difficultés qu’il rencontre.',
        'Le Client fournit les textes, images, logos et accès nécessaires avant le [date] et garantit qu’il détient les droits sur ces contenus. Il désigne un interlocuteur unique, [nom], qui valide chaque étape dans un délai de [5] jours ouvrés. Passé ce délai et après une relance écrite, l’étape est considérée comme validée.',
      ] },
      { title: 'Article 6 – Validation et livraison', paragraphs: [
        'Le Prestataire met une version de test à la disposition du Client. Le Client dispose de [10] jours pour signaler par écrit les anomalies, c’est-à-dire les écarts avec le cahier des charges, que le Prestataire corrige sans frais. Une demande de nouvelle fonctionnalité n’est pas une anomalie.',
        'Sans réserve écrite dans ce délai, ou dès la mise en ligne du site à la demande du Client, le site est réputé accepté.',
        'Le Prestataire corrige gratuitement les anomalies signalées dans les [3] mois suivant la mise en ligne (période de garantie).',
      ] },
      { title: 'Article 7 – Propriété intellectuelle', paragraphs: [
        'Après paiement complet du prix, le Prestataire cède au Client, dans le respect de la législation applicable au droit d’auteur (notamment l’Accord de Bangui pour les États membres de l’OAPI), les droits patrimoniaux sur les éléments créés spécifiquement pour lui : graphismes, textes rédigés et code développé pour le projet. Cette cession porte sur les droits de reproduction, de représentation et d’adaptation, pour le monde entier et pour toute la durée légale des droits. Jusqu’au paiement complet, le Prestataire reste titulaire de ces droits.',
        'Les logiciels libres, bibliothèques, thèmes et outils utilisés restent soumis à leurs propres licences. Le Prestataire conserve ses savoir-faire et ses composants génériques, qu’il peut réutiliser.',
        'Sauf refus écrit du Client, le Prestataire peut citer le site dans ses références et son portfolio.',
      ] },
      { title: 'Article 8 – Hébergement, nom de domaine et maintenance', paragraphs: [
        'Le nom de domaine est enregistré au nom du Client, qui en reste titulaire. L’hébergement est souscrit par [le Prestataire / le Client] auprès de [hébergeur].',
        'Tous les identifiants d’accès (hébergement, nom de domaine, administration du site) sont remis au Client à la livraison.',
        'Après la période de garantie, la maintenance (mises à jour, sauvegardes, petites évolutions) fait l’objet [d’un contrat séparé / d’un forfait de [montant] FCFA par mois].',
      ] },
      { title: 'Article 9 – Confidentialité et données personnelles', paragraphs: [
        'Chaque partie garde confidentielles les informations de l’autre dont elle a connaissance pendant le contrat, et pendant [2] ans après sa fin.',
        'Le Client est responsable des données personnelles collectées par son site (formulaires, comptes clients, commandes) et du respect de la loi sur la protection des données de son pays. Le Prestataire l’aide à mettre en place les mentions et les moyens techniques nécessaires : politique de confidentialité, recueil du consentement, sécurité des données.',
      ] },
      { title: 'Article 10 – Responsabilité et force majeure', paragraphs: [
        'La responsabilité du Prestataire est limitée aux dommages directs et prouvés, dans la limite des sommes payées par le Client au titre du contrat. Il n’est pas responsable des interruptions dues à l’hébergeur, aux opérateurs de télécommunication ou aux services tiers, ni des contenus fournis par le Client.',
        'Aucune partie n’est responsable d’un manquement dû à un cas de force majeure, c’est-à-dire un événement imprévisible, irrésistible et extérieur. Si la force majeure dure plus de [30] jours, chaque partie peut résilier le contrat par écrit.',
      ] },
      { title: 'Article 11 – Durée et résiliation', paragraphs: [
        'Le contrat prend effet à sa signature et prend fin à l’issue de la période de garantie.',
        'En cas de manquement grave d’une partie, non corrigé [15] jours après une mise en demeure écrite (lettre recommandée ou e-mail avec accusé de réception), l’autre partie peut résilier le contrat. Les travaux réalisés jusqu’à la résiliation restent dus. Si la résiliation est due au Client, l’acompte reste acquis au Prestataire.',
      ] },
      { title: 'Article 12 – Droit applicable et litiges', hint: 'Garde une seule des deux options du dernier paragraphe. L’arbitrage est confidentiel mais coûteux : pour un petit projet, le tribunal est souvent plus adapté.', paragraphs: [
        'Le contrat est soumis au droit de [pays], État partie au Traité relatif à l’harmonisation du droit des affaires en Afrique (OHADA), y compris les Actes uniformes applicables.',
        'En cas de désaccord, les parties recherchent d’abord une solution amiable pendant [30] jours à compter de la notification écrite du litige.',
        'À défaut d’accord, le litige est soumis [à la juridiction compétente de [ville]] [OU : à un arbitrage selon le Règlement d’arbitrage de la Cour commune de justice et d’arbitrage (CCJA) de l’OHADA, par un arbitre unique, siège de l’arbitrage : [ville], langue : français].',
      ] },
      { title: 'Article 13 – Signatures', paragraphs: [
        'Fait à [ville], le [date], en deux exemplaires originaux.',
        'Annexe 1 : cahier des charges. Annexe 2 : devis n° [numéro].',
        'Le Prestataire : [nom], signature précédée de la mention « Lu et approuvé »',
        'Le Client : [nom], signature précédée de la mention « Lu et approuvé »',
      ] },
    ],
    footer: 'Modèle JcHub · jchub.dev/fr/ressources',
  },
  en: {
    title: 'Services agreement',
    subtitle: 'Design and development of a website (OHADA member countries)',
    notice: 'Template provided for information by JcHub. It does not replace advice from a lawyer: adapt it to your situation and have it reviewed before signing, especially for a large project. Replace all the highlighted text in brackets [ ], delete the clauses that do not apply to you, and delete this paragraph.',
    sections: [
      { title: 'Article 1 – Parties', paragraphs: [
        'Between: [name or company name of the provider], [legal form: sole proprietorship, LLC…], registered with the Trade and Personal Property Credit Register (RCCM) of [city] under number [RCCM number], tax identification number [number], with its registered office at [address], represented by [name and title], hereinafter “the Provider”;',
        'And: [name or company name of the client], [legal form], registered with the RCCM of [city] under number [RCCM number], with its registered office at [address], represented by [name and title], hereinafter “the Client”.',
      ] },
      { title: 'Article 2 – Purpose', paragraphs: [
        'The purpose of this agreement is the design and development by the Provider of a [showcase website / online shop / web application] for the Client, available at [domain name].',
        'The expected pages, features and content are described in the requirements document attached as appendix 1, which forms part of the agreement. In case of contradiction, this agreement prevails over its appendices.',
        'Any service not provided for in the requirements document is subject to an additional quote, accepted in writing by the Client before it is carried out.',
      ] },
      { title: 'Article 3 – Timeline', paragraphs: [
        'The Provider undertakes to follow this timeline: mock-ups on [date], test version on [date], launch no later than [date].',
        'These deadlines run from receipt of the deposit and of the content provided by the Client. Any delay by the Client in providing content or approvals postpones delivery by the same amount of time.',
      ] },
      { title: 'Article 4 – Price and payment', paragraphs: [
        'The total price of the services is [amount] [currency, e.g. XAF / XOF] [excluding / including tax], as detailed in quote no. [number] dated [date] attached as appendix 2.',
        'It is paid as follows:',
        '- [40]% when the agreement is signed, as a deposit;',
        '- [30]% when the mock-ups are approved;',
        '- the balance when the website goes live.',
        'Payments are made by [bank transfer / mobile money to number … / cheque] within [15] days of receipt of the invoice.',
        'Any late payment, after a reminder left unanswered for [8] days, incurs penalties of [rate]% of the amount due per month of delay and allows the Provider to suspend work until payment.',
        'Domain name, hosting, licence and third-party service fees are [included in the price / paid by the Client].',
      ] },
      { title: 'Article 5 – Obligations of the parties', paragraphs: [
        'The Provider performs the services with care and in line with professional standards, under an obligation of means. The Provider keeps the Client informed of progress, advises on technical choices and promptly reports any difficulty.',
        'The Client provides the texts, images, logos and access needed before [date] and warrants that it holds the rights to this content. The Client appoints a single contact, [name], who approves each stage within [5] business days. After this period and a written reminder, the stage is deemed approved.',
      ] },
      { title: 'Article 6 – Acceptance and delivery', paragraphs: [
        'The Provider makes a test version available to the Client. The Client has [10] days to report defects in writing, meaning differences from the requirements document, which the Provider fixes free of charge. A request for a new feature is not a defect.',
        'Without written reservations within this period, or as soon as the website goes live at the Client’s request, the website is deemed accepted.',
        'The Provider fixes free of charge any defect reported within [3] months after launch (warranty period).',
      ] },
      { title: 'Article 7 – Intellectual property', paragraphs: [
        'Once the price is paid in full, the Provider assigns to the Client, in accordance with the copyright law that applies (in particular the Bangui Agreement for OAPI member states), the economic rights to the elements created specifically for the Client: graphics, written texts and code developed for the project. This assignment covers the rights of reproduction, performance and adaptation, worldwide and for the full legal term of the rights. Until full payment, the Provider remains the owner of these rights.',
        'Open-source software, libraries, themes and tools used remain subject to their own licences. The Provider keeps its know-how and generic components, which it may reuse.',
        'Unless the Client refuses in writing, the Provider may list the website in its references and portfolio.',
      ] },
      { title: 'Article 8 – Hosting, domain name and maintenance', paragraphs: [
        'The domain name is registered in the Client’s name, and the Client remains its holder. Hosting is purchased by [the Provider / the Client] from [hosting provider].',
        'All access credentials (hosting, domain name, website administration) are handed over to the Client on delivery.',
        'After the warranty period, maintenance (updates, backups, small changes) is covered by [a separate agreement / a monthly fee of [amount]].',
      ] },
      { title: 'Article 9 – Confidentiality and personal data', paragraphs: [
        'Each party keeps confidential the information about the other that it learns during the agreement, and for [2] years after it ends.',
        'The Client is responsible for the personal data collected by its website (forms, customer accounts, orders) and for complying with the data protection law of its country. The Provider helps set up the notices and technical means needed: privacy policy, consent collection, data security.',
      ] },
      { title: 'Article 10 – Liability and force majeure', paragraphs: [
        'The Provider’s liability is limited to direct and proven damage, up to the amounts paid by the Client under the agreement. The Provider is not liable for outages caused by the host, telecom operators or third-party services, nor for content provided by the Client.',
        'Neither party is liable for a failure caused by force majeure, meaning an unforeseeable, irresistible and external event. If force majeure lasts more than [30] days, either party may terminate the agreement in writing.',
      ] },
      { title: 'Article 11 – Term and termination', paragraphs: [
        'The agreement takes effect when signed and ends at the end of the warranty period.',
        'In case of a serious breach by one party, not remedied [15] days after a formal written notice (registered letter or email with acknowledgement of receipt), the other party may terminate the agreement. Work carried out until termination remains payable. If termination is caused by the Client, the Provider keeps the deposit.',
      ] },
      { title: 'Article 12 – Governing law and disputes', hint: 'Keep only one of the two options in the last paragraph. Arbitration is confidential but expensive: for a small project, the court is often the better choice.', paragraphs: [
        'This agreement is governed by the law of [country], a party to the Treaty on the Harmonization of Business Law in Africa (OHADA), including the applicable Uniform Acts.',
        'In case of disagreement, the parties first seek an amicable solution for [30] days from the written notice of the dispute.',
        'Failing agreement, the dispute is submitted [to the competent court of [city]] [OR: to arbitration under the Arbitration Rules of the OHADA Common Court of Justice and Arbitration (CCJA), by a sole arbitrator, seat of arbitration: [city], language: English].',
      ] },
      { title: 'Article 13 – Signatures', paragraphs: [
        'Made in [city], on [date], in two original copies.',
        'Appendix 1: requirements document. Appendix 2: quote no. [number].',
        'The Provider: [name], signature preceded by “Read and approved”',
        'The Client: [name], signature preceded by “Read and approved”',
      ] },
    ],
    footer: 'JcHub template · jchub.dev/en/resources',
  },
};

const BRIEF: Record<Locale, TemplateText> = {
  fr: {
    title: 'Cahier des charges',
    subtitle: 'Création de site web pour [nom de l’entreprise] · version du [date]',
    notice: 'Modèle JcHub. Remplis chaque partie avec tes mots : un prestataire comprend mieux un exemple concret qu’un long texte. Remplace le texte surligné entre crochets [ ], supprime ce qui ne te concerne pas, puis envoie le même document à chaque prestataire pour recevoir des devis comparables.',
    sections: [
      { title: '1. Présentation de l’entreprise', hint: 'En quelques lignes : qui tu es, ce que tu vends, depuis quand, où.', paragraphs: [
        'Nom : [nom de l’entreprise]',
        'Activité : [ex. restaurant, boutique de vêtements, cabinet de conseil]',
        'Ville et pays : [ville, pays]',
        'Contact pour ce projet : [nom, téléphone, e-mail]',
      ] },
      { title: '2. Objectifs du site', hint: 'Ce que le site doit t’apporter. Classe-les du plus important au moins important.', paragraphs: [
        '- [ex. recevoir des demandes de devis]',
        '- [ex. vendre en ligne avec paiement Mobile Money]',
        '- [ex. rassurer les clients avant qu’ils appellent]',
        'Comment saura-t-on que le site fonctionne ? [ex. 20 demandes de contact par mois]',
      ] },
      { title: '3. Public visé', hint: 'Qui va visiter le site, sur quel appareil, dans quelle langue.', paragraphs: [
        'Clients principaux : [ex. particuliers de 25 à 45 ans à Brazzaville]',
        'Appareils : [ex. surtout des téléphones Android, parfois en connexion lente]',
        'Langues du site : [français / anglais / autre]',
      ] },
      { title: '4. L’existant', paragraphs: [
        'Site actuel : [adresse, ou « aucun »]. Ce qui ne va pas : [ex. lent, pas adapté au téléphone]',
        'Nom de domaine : [déjà réservé : lequel, chez qui / à réserver]',
        'Hébergement : [déjà payé : chez qui / à choisir]',
        'Réseaux sociaux : [liens des pages Facebook, Instagram, WhatsApp Business…]',
      ] },
      { title: '5. Pages du site', hint: 'La liste des pages, avec une phrase sur le rôle de chacune. Ajoute ou retire des lignes.', paragraphs: [
        '- Accueil : [ce que le visiteur doit comprendre en 5 secondes]',
        '- À propos : [ton histoire, ton équipe]',
        '- Produits ou services : [nombre approximatif de produits ou services]',
        '- Contact : [formulaire, carte, WhatsApp, horaires]',
        '- [autre page]',
      ] },
      { title: '6. Fonctionnalités', hint: 'Indique pour chacune si elle est indispensable ou souhaitable : ça aide le prestataire à proposer des options de prix.', paragraphs: [
        '- Formulaire de contact : [indispensable / souhaitable]',
        '- Bouton WhatsApp : [indispensable / souhaitable]',
        '- Boutique en ligne et paiement (Mobile Money, carte) : [indispensable / souhaitable / non]',
        '- Prise de rendez-vous ou réservation : [indispensable / souhaitable / non]',
        '- Espace client avec compte : [indispensable / souhaitable / non]',
        '- Blog ou actualités : [indispensable / souhaitable / non]',
        '- Plusieurs langues : [indispensable / souhaitable / non]',
        '- Autre : [à décrire]',
      ] },
      { title: '7. Contenus', hint: 'Qui fournit quoi, et pour quand. C’est la cause de retard la plus fréquente.', paragraphs: [
        'Textes : [fournis par moi / à rédiger par le prestataire]',
        'Photos : [fournies par moi / séance photo à prévoir / banque d’images]',
        'Logo : [existant, au format vectoriel / à créer]',
        'Date de remise des contenus : [date]',
      ] },
      { title: '8. Identité visuelle et sites de référence', paragraphs: [
        'Couleurs et polices imposées : [ou « libre »]',
        'Ambiance recherchée : [ex. sobre et professionnelle, chaleureuse, moderne]',
        'Sites que j’aime, et pourquoi : [adresse : ce qui plaît]',
        'Sites que je n’aime pas, et pourquoi : [adresse : ce qui ne plaît pas]',
      ] },
      { title: '9. Contraintes techniques', paragraphs: [
        'Je veux pouvoir modifier moi-même : [les textes, les prix, les photos, les articles]',
        'Outil souhaité : [WordPress, sur mesure, sans préférence]',
        'Autres contraintes : [ex. lien avec un logiciel de caisse, connexion lente des visiteurs]',
      ] },
      { title: '10. Référencement', paragraphs: [
        'Ce que tes clients tapent dans Google pour te trouver : [ex. « traiteur Pointe-Noire »]',
        'Fiche Google Business Profile : [existe déjà / à créer]',
      ] },
      { title: '11. Maintenance et formation', paragraphs: [
        'Après la mise en ligne, je souhaite : [une formation pour gérer le site / un contrat de maintenance / rien]',
        'Qui fera les mises à jour du site : [moi / un employé / le prestataire]',
      ] },
      { title: '12. Budget et planning', paragraphs: [
        'Budget prévu : entre [montant] et [montant] FCFA, [hébergement compris / hors hébergement]',
        'Date de mise en ligne souhaitée : [date], parce que [ex. ouverture de la boutique, salon]',
        'Date limite pour recevoir les devis : [date]',
      ] },
      { title: '13. Critères de validation', hint: 'Ce que tu vérifieras avant d’accepter le site.', paragraphs: [
        '- Le site s’affiche correctement sur téléphone et sur ordinateur',
        '- Chaque formulaire envoie bien son message',
        '- [autre critère]',
        'Je choisirai le prestataire selon : [prix, délais, exemples de réalisations, suivi après la livraison]',
      ] },
    ],
    footer: 'Modèle JcHub · jchub.dev/fr/ressources',
  },
  en: {
    title: 'Website requirements',
    subtitle: 'Website project for [business name] · version of [date]',
    notice: 'JcHub template. Fill in each part in your own words: a concrete example helps a provider more than a long text. Replace the highlighted text in brackets [ ], delete what does not apply, then send the same document to each provider to get quotes you can compare.',
    sections: [
      { title: '1. About the business', hint: 'A few lines: who you are, what you sell, since when, where.', paragraphs: [
        'Name: [business name]',
        'Activity: [e.g. restaurant, clothing shop, consulting firm]',
        'City and country: [city, country]',
        'Contact for this project: [name, phone, email]',
      ] },
      { title: '2. Goals of the website', hint: 'What the website should bring you. Rank them from most to least important.', paragraphs: [
        '- [e.g. receive quote requests]',
        '- [e.g. sell online with mobile money payments]',
        '- [e.g. reassure customers before they call]',
        'How will we know the website works? [e.g. 20 contact requests a month]',
      ] },
      { title: '3. Target audience', hint: 'Who will visit the website, on which device, in which language.', paragraphs: [
        'Main customers: [e.g. people aged 25 to 45 in Lagos]',
        'Devices: [e.g. mostly Android phones, sometimes on a slow connection]',
        'Website languages: [English / French / other]',
      ] },
      { title: '4. What exists', paragraphs: [
        'Current website: [address, or “none”]. What is wrong with it: [e.g. slow, not suited to phones]',
        'Domain name: [already registered: which one, where / to register]',
        'Hosting: [already paid: where / to choose]',
        'Social networks: [links to Facebook, Instagram, WhatsApp Business pages…]',
      ] },
      { title: '5. Pages of the website', hint: 'The list of pages, with one sentence on the role of each. Add or remove lines.', paragraphs: [
        '- Home: [what visitors must understand within 5 seconds]',
        '- About: [your story, your team]',
        '- Products or services: [approximate number of products or services]',
        '- Contact: [form, map, WhatsApp, opening hours]',
        '- [other page]',
      ] },
      { title: '6. Features', hint: 'Say for each one whether it is essential or nice to have: it helps the provider offer price options.', paragraphs: [
        '- Contact form: [essential / nice to have]',
        '- WhatsApp button: [essential / nice to have]',
        '- Online shop and payment (mobile money, card): [essential / nice to have / no]',
        '- Appointments or bookings: [essential / nice to have / no]',
        '- Customer accounts: [essential / nice to have / no]',
        '- Blog or news: [essential / nice to have / no]',
        '- Several languages: [essential / nice to have / no]',
        '- Other: [describe]',
      ] },
      { title: '7. Content', hint: 'Who provides what, and by when. It is the most common cause of delays.', paragraphs: [
        'Texts: [provided by me / to be written by the provider]',
        'Photos: [provided by me / photo shoot needed / stock images]',
        'Logo: [existing, in vector format / to be created]',
        'Date the content will be provided: [date]',
      ] },
      { title: '8. Visual identity and reference websites', paragraphs: [
        'Required colors and fonts: [or “free choice”]',
        'Desired feel: [e.g. clean and professional, warm, modern]',
        'Websites I like, and why: [address: what I like]',
        'Websites I do not like, and why: [address: what I dislike]',
      ] },
      { title: '9. Technical constraints', paragraphs: [
        'I want to be able to change myself: [texts, prices, photos, articles]',
        'Preferred tool: [WordPress, custom-built, no preference]',
        'Other constraints: [e.g. link with a point-of-sale system, visitors on slow connections]',
      ] },
      { title: '10. SEO', paragraphs: [
        'What your customers type into Google to find you: [e.g. “caterer Lagos”]',
        'Google Business Profile: [already exists / to be created]',
      ] },
      { title: '11. Maintenance and training', paragraphs: [
        'After launch, I would like: [training to manage the website / a maintenance contract / nothing]',
        'Who will update the website: [me / an employee / the provider]',
      ] },
      { title: '12. Budget and timeline', paragraphs: [
        'Planned budget: between [amount] and [amount], [hosting included / hosting not included]',
        'Desired launch date: [date], because [e.g. shop opening, trade fair]',
        'Deadline to receive quotes: [date]',
      ] },
      { title: '13. Acceptance criteria', hint: 'What you will check before accepting the website.', paragraphs: [
        '- The website displays correctly on phones and computers',
        '- Every form sends its message',
        '- [other criterion]',
        'I will choose the provider based on: [price, timeline, past work, support after delivery]',
      ] },
    ],
    footer: 'JcHub template · jchub.dev/en/resources',
  },
};

const TEMPLATES: Record<string, Record<Locale, TemplateText>> = {
  'website-contract': CONTRACT,
  'website-brief': BRIEF,
};

export function hasTemplate(id: string): boolean {
  return id in TEMPLATES;
}

/** Section titles of a template, to check they match the outline shown on its page. */
export function templateSectionTitles(id: string, locale: Locale): string[] {
  return TEMPLATES[id]?.[locale].sections.map((section) => section.title) ?? [];
}

const BLUE = '1D4ED8';
const INK = '0F172A';
const MUTED = '475569';

/** Text runs of a line, with each [placeholder] highlighted. */
function runs(text: string, options: { bold?: boolean; italics?: boolean; color?: string } = {}): TextRun[] {
  return text.split(/(\[[^\]]*\])/).filter(Boolean).map((part) => new TextRun({
    text: part,
    ...options,
    ...(part.startsWith('[') ? { highlight: 'yellow' } : {}),
  }));
}

export async function buildTemplateDocx(id: string, locale: Locale): Promise<Buffer> {
  const template = TEMPLATES[id]?.[locale];
  if (!template) throw new Error(`Modèle inconnu : ${id}`);
  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun({ text: template.title, bold: true, color: INK })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: runs(template.subtitle, { color: MUTED }) }),
    new Paragraph({
      shading: { type: ShadingType.CLEAR, fill: 'EFF6FF', color: 'auto' },
      spacing: { after: 300 },
      children: runs(template.notice, { italics: true, color: MUTED }),
    }),
  ];
  for (const section of template.sections) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 }, children: [new TextRun({ text: section.title, bold: true, color: BLUE })] }));
    if (section.hint) children.push(new Paragraph({ spacing: { after: 120 }, children: runs(section.hint, { italics: true, color: MUTED }) }));
    for (const paragraph of section.paragraphs) {
      const bullet = paragraph.startsWith('- ');
      children.push(new Paragraph({
        ...(bullet ? { bullet: { level: 0 } } : {}),
        spacing: { after: 120 },
        children: runs(bullet ? paragraph.slice(2) : paragraph),
      }));
    }
  }
  const document = new Document({
    creator: 'JcHub',
    title: template.title,
    styles: { default: { document: { run: { font: 'Calibri', size: 22, color: INK } } } },
    sections: [{
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: template.footer, size: 16, color: MUTED })] })] }) },
      children,
    }],
  });
  return Buffer.from(await Packer.toBuffer(document));
}
