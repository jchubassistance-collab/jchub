import type { Locale } from '../i18n/routing';

/**
 * Downloadable resources of the /ressources page. Cheat sheets and checklists are free: their
 * whole content is here, shown on their page and turned into a PDF in the browser. Templates
 * ask for an email: only their outline is here, the full text stays on the server
 * (lib/resource-templates.ts) and is sent as a Word file from a link mailed to the visitor.
 *
 * Only relative imports here: the tests load this file with plain Node.
 */

export type ResourceKind = 'cheatsheet' | 'checklist' | 'template';
export const RESOURCE_KINDS: ResourceKind[] = ['cheatsheet', 'checklist', 'template'];

export type ResourceRow = { term: string; text: string };
export type ResourceSection = { title: string; rows: ResourceRow[] };

type ResourceText = {
  slug: string;
  title: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
  /** Whole content of a free resource. */
  sections?: ResourceSection[];
  /** Section titles of a template, shown before the email is asked. */
  outline?: string[];
  /** Warning shown next to the download, e.g. that a contract must be reviewed. */
  notice?: string;
};

export type Resource = {
  id: string;
  kind: ResourceKind;
  /** True when the file is sent by email. */
  gated: boolean;
  format: 'pdf' | 'docx';
  /** Terms are code, shown in a monospace font. */
  code?: boolean;
  /** Date of the last review of the content, shown on the page. */
  updated: string;
  fr: ResourceText;
  en: ResourceText;
};

export const resources: Resource[] = [
  {
    id: 'sql',
    kind: 'cheatsheet',
    gated: false,
    format: 'pdf',
    code: true,
    updated: '2026-11-04',
    fr: {
      slug: 'aide-memoire-sql',
      title: 'Aide-mémoire SQL',
      summary: 'Les requêtes SQL du quotidien sur une page : lire, filtrer, regrouper, joindre et modifier des données.',
      seoTitle: 'Aide-mémoire SQL gratuit (PDF) : les requêtes essentielles',
      seoDescription: 'SELECT, WHERE, GROUP BY, JOIN, INSERT, UPDATE : l’aide-mémoire SQL de JcHub avec des exemples simples, à lire en ligne ou à télécharger en PDF.',
      sections: [
        { title: 'Lire des données', rows: [
          { term: 'SELECT nom, ville FROM clients;', text: 'Affiche les colonnes nom et ville de la table clients.' },
          { term: 'SELECT * FROM clients;', text: 'Affiche toutes les colonnes. Pratique pour explorer, à éviter dans une application.' },
          { term: 'SELECT DISTINCT ville FROM clients;', text: 'Chaque ville une seule fois, sans doublon.' },
          { term: 'SELECT nom AS client FROM clients;', text: 'Renomme la colonne dans le résultat.' },
          { term: 'ORDER BY nom ASC, inscrit_le DESC', text: 'Trie par nom (A à Z), puis du plus récent au plus ancien.' },
          { term: 'LIMIT 10 OFFSET 20', text: 'Garde 10 lignes à partir de la 21e (MySQL, PostgreSQL, SQLite). SQL Server : OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY.' },
        ] },
        { title: 'Filtrer', rows: [
          { term: 'WHERE prix > 1000 AND stock > 0', text: 'Les deux conditions doivent être vraies. OR : au moins une des deux.' },
          { term: 'WHERE ville IN (\'Brazzaville\', \'Pointe-Noire\')', text: 'La valeur fait partie de la liste.' },
          { term: 'WHERE nom LIKE \'Jo%\'', text: 'Commence par « Jo ». % remplace n’importe quelle suite de caractères, _ un seul caractère.' },
          { term: 'WHERE date_cmd BETWEEN \'2026-01-01\' AND \'2026-06-30\'', text: 'Entre deux valeurs, bornes comprises.' },
          { term: 'WHERE email IS NULL', text: 'La valeur est absente. « = NULL » ne marche jamais : utilise IS NULL ou IS NOT NULL.' },
        ] },
        { title: 'Regrouper et calculer', rows: [
          { term: 'SELECT COUNT(*) FROM commandes;', text: 'Nombre de lignes. COUNT(colonne) ignore les valeurs NULL.' },
          { term: 'SUM(montant), AVG(montant)', text: 'Total et moyenne d’une colonne de nombres.' },
          { term: 'MIN(prix), MAX(prix)', text: 'Plus petite et plus grande valeur.' },
          { term: 'SELECT ville, COUNT(*) FROM clients GROUP BY ville;', text: 'Un résultat par ville : le nombre de clients de chacune.' },
          { term: 'HAVING COUNT(*) > 5', text: 'Filtre les groupes, après GROUP BY. WHERE filtre les lignes, avant.' },
        ] },
        { title: 'Joindre des tables', rows: [
          { term: 'FROM commandes c JOIN clients k ON k.id = c.client_id', text: 'INNER JOIN : seulement les commandes qui ont un client.' },
          { term: 'FROM clients k LEFT JOIN commandes c ON c.client_id = k.id', text: 'Tous les clients, même sans commande (colonnes de commandes à NULL).' },
          { term: 'WHERE c.id IS NULL', text: 'Avec un LEFT JOIN : les clients qui n’ont jamais commandé.' },
          { term: 'FULL OUTER JOIN', text: 'Toutes les lignes des deux tables, reliées quand c’est possible (absent de MySQL).' },
        ] },
        { title: 'Ajouter, modifier, supprimer', rows: [
          { term: 'INSERT INTO clients (nom, ville) VALUES (\'Awa\', \'Dolisie\');', text: 'Ajoute une ligne.' },
          { term: 'UPDATE produits SET prix = 2500 WHERE id = 12;', text: 'Modifie les lignes choisies. Sans WHERE, toute la table change.' },
          { term: 'DELETE FROM paniers WHERE cree_le < \'2026-01-01\';', text: 'Supprime les lignes choisies. Lance d’abord un SELECT avec le même WHERE pour vérifier.' },
        ] },
        { title: 'Structure des tables', rows: [
          { term: 'CREATE TABLE clients (id INT PRIMARY KEY, nom VARCHAR(100) NOT NULL);', text: 'Crée une table avec une clé primaire et une colonne obligatoire.' },
          { term: 'ALTER TABLE clients ADD COLUMN telephone VARCHAR(20);', text: 'Ajoute une colonne à une table existante.' },
          { term: 'CREATE INDEX idx_clients_ville ON clients (ville);', text: 'Accélère les recherches et les tris sur cette colonne.' },
          { term: 'DROP TABLE paniers;', text: 'Supprime la table et toutes ses données, sans retour possible.' },
        ] },
        { title: 'Aller plus loin', rows: [
          { term: 'WITH ventes AS (SELECT client_id, SUM(montant) AS total FROM commandes GROUP BY client_id) SELECT * FROM ventes WHERE total > 100000;', text: 'Une requête nommée (CTE), réutilisée dans la suivante : plus lisible qu’une sous-requête.' },
          { term: 'WHERE id IN (SELECT client_id FROM commandes)', text: 'Sous-requête : les clients qui ont au moins une commande.' },
          { term: 'BEGIN; … COMMIT;', text: 'Transaction : tout est enregistré ensemble, ou rien avec ROLLBACK.' },
          { term: 'FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT', text: 'L’ordre dans lequel la base exécute une requête. C’est pour ça qu’un alias du SELECT n’existe pas encore dans le WHERE.' },
        ] },
      ],
    },
    en: {
      slug: 'sql-cheat-sheet',
      title: 'SQL cheat sheet',
      summary: 'Everyday SQL queries on one page: read, filter, group, join and change data.',
      seoTitle: 'Free SQL cheat sheet (PDF): the essential queries',
      seoDescription: 'SELECT, WHERE, GROUP BY, JOIN, INSERT, UPDATE: JcHub’s SQL cheat sheet with simple examples, to read online or download as a PDF.',
      sections: [
        { title: 'Read data', rows: [
          { term: 'SELECT name, city FROM customers;', text: 'Shows the name and city columns of the customers table.' },
          { term: 'SELECT * FROM customers;', text: 'Shows every column. Handy to explore, best avoided in an application.' },
          { term: 'SELECT DISTINCT city FROM customers;', text: 'Each city once, without duplicates.' },
          { term: 'SELECT name AS customer FROM customers;', text: 'Renames the column in the result.' },
          { term: 'ORDER BY name ASC, signed_up DESC', text: 'Sorts by name (A to Z), then from newest to oldest.' },
          { term: 'LIMIT 10 OFFSET 20', text: 'Keeps 10 rows starting from the 21st (MySQL, PostgreSQL, SQLite). SQL Server: OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY.' },
        ] },
        { title: 'Filter', rows: [
          { term: 'WHERE price > 1000 AND stock > 0', text: 'Both conditions must be true. OR: at least one of them.' },
          { term: 'WHERE city IN (\'Lagos\', \'Nairobi\')', text: 'The value is in the list.' },
          { term: 'WHERE name LIKE \'Jo%\'', text: 'Starts with “Jo”. % stands for any run of characters, _ for a single one.' },
          { term: 'WHERE order_date BETWEEN \'2026-01-01\' AND \'2026-06-30\'', text: 'Between two values, both included.' },
          { term: 'WHERE email IS NULL', text: 'The value is missing. “= NULL” never works: use IS NULL or IS NOT NULL.' },
        ] },
        { title: 'Group and compute', rows: [
          { term: 'SELECT COUNT(*) FROM orders;', text: 'Number of rows. COUNT(column) skips NULL values.' },
          { term: 'SUM(amount), AVG(amount)', text: 'Total and average of a numeric column.' },
          { term: 'MIN(price), MAX(price)', text: 'Smallest and largest value.' },
          { term: 'SELECT city, COUNT(*) FROM customers GROUP BY city;', text: 'One result per city: how many customers each has.' },
          { term: 'HAVING COUNT(*) > 5', text: 'Filters groups, after GROUP BY. WHERE filters rows, before.' },
        ] },
        { title: 'Join tables', rows: [
          { term: 'FROM orders o JOIN customers c ON c.id = o.customer_id', text: 'INNER JOIN: only the orders that have a customer.' },
          { term: 'FROM customers c LEFT JOIN orders o ON o.customer_id = c.id', text: 'Every customer, even without orders (order columns are NULL).' },
          { term: 'WHERE o.id IS NULL', text: 'With a LEFT JOIN: the customers who never ordered.' },
          { term: 'FULL OUTER JOIN', text: 'Every row of both tables, matched when possible (not in MySQL).' },
        ] },
        { title: 'Insert, update, delete', rows: [
          { term: 'INSERT INTO customers (name, city) VALUES (\'Awa\', \'Dakar\');', text: 'Adds a row.' },
          { term: 'UPDATE products SET price = 2500 WHERE id = 12;', text: 'Changes the chosen rows. Without WHERE, the whole table changes.' },
          { term: 'DELETE FROM carts WHERE created_at < \'2026-01-01\';', text: 'Deletes the chosen rows. Run a SELECT with the same WHERE first to check.' },
        ] },
        { title: 'Table structure', rows: [
          { term: 'CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(100) NOT NULL);', text: 'Creates a table with a primary key and a required column.' },
          { term: 'ALTER TABLE customers ADD COLUMN phone VARCHAR(20);', text: 'Adds a column to an existing table.' },
          { term: 'CREATE INDEX idx_customers_city ON customers (city);', text: 'Speeds up searches and sorts on this column.' },
          { term: 'DROP TABLE carts;', text: 'Deletes the table and all its data, for good.' },
        ] },
        { title: 'Going further', rows: [
          { term: 'WITH sales AS (SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id) SELECT * FROM sales WHERE total > 100000;', text: 'A named query (CTE) reused by the next one: easier to read than a subquery.' },
          { term: 'WHERE id IN (SELECT customer_id FROM orders)', text: 'Subquery: the customers with at least one order.' },
          { term: 'BEGIN; … COMMIT;', text: 'Transaction: everything is saved together, or nothing with ROLLBACK.' },
          { term: 'FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT', text: 'The order in which the database runs a query. That is why a SELECT alias does not exist yet in WHERE.' },
        ] },
      ],
    },
  },
  {
    id: 'http',
    kind: 'cheatsheet',
    gated: false,
    format: 'pdf',
    code: true,
    updated: '2026-11-04',
    fr: {
      slug: 'codes-http',
      title: 'Codes HTTP',
      summary: 'Les codes de réponse HTTP les plus courants, ce qu’ils veulent dire et lequel renvoyer selon la situation.',
      seoTitle: 'Codes HTTP : la liste des codes de statut expliqués (PDF)',
      seoDescription: '200, 301, 404, 429, 500… Les codes de statut HTTP expliqués simplement, avec le bon code à renvoyer selon le cas. À lire en ligne ou en PDF.',
      sections: [
        { title: '2xx : la demande a réussi', rows: [
          { term: '200 OK', text: 'Réponse normale, avec un contenu.' },
          { term: '201 Created', text: 'Une ressource a été créée (après un POST). Indique son adresse dans l’en-tête Location.' },
          { term: '202 Accepted', text: 'Demande acceptée, traitement en arrière-plan pas encore fini.' },
          { term: '204 No Content', text: 'Réussi, sans contenu à renvoyer (après un DELETE, par exemple).' },
          { term: '206 Partial Content', text: 'Une partie du fichier seulement, pour la lecture d’une vidéo ou la reprise d’un téléchargement.' },
        ] },
        { title: '3xx : redirections', rows: [
          { term: '301 Moved Permanently', text: 'L’adresse a changé pour de bon. Les moteurs de recherche transfèrent le référencement.' },
          { term: '302 Found', text: 'Redirection temporaire. L’ancienne adresse reste celle qui est indexée.' },
          { term: '303 See Other', text: 'Après l’envoi d’un formulaire, renvoie vers une page à ouvrir en GET.' },
          { term: '304 Not Modified', text: 'Le navigateur peut réutiliser sa copie en cache.' },
          { term: '307 / 308', text: 'Comme 302 et 301, mais la méthode (POST, PUT…) et le corps de la requête sont conservés.' },
        ] },
        { title: '4xx : erreur du côté du client', rows: [
          { term: '400 Bad Request', text: 'Requête mal formée : JSON invalide, paramètre manquant.' },
          { term: '401 Unauthorized', text: 'Il faut se connecter : identifiants absents ou invalides.' },
          { term: '403 Forbidden', text: 'Connecté, mais sans le droit d’accéder à cette ressource.' },
          { term: '404 Not Found', text: 'Rien à cette adresse.' },
          { term: '405 Method Not Allowed', text: 'L’adresse existe, mais pas pour cette méthode (un POST sur une page en lecture seule).' },
          { term: '409 Conflict', text: 'Conflit avec l’état actuel : adresse e-mail déjà utilisée, modification simultanée.' },
          { term: '410 Gone', text: 'Supprimé définitivement. Les moteurs de recherche désindexent plus vite qu’avec un 404.' },
          { term: '413 Content Too Large', text: 'Fichier ou corps de requête trop lourd.' },
          { term: '415 Unsupported Media Type', text: 'Format envoyé non accepté (un .png là où on attend un PDF).' },
          { term: '422 Unprocessable Content', text: 'Requête bien formée mais données invalides : e-mail incorrect, date passée.' },
          { term: '429 Too Many Requests', text: 'Trop de demandes. Ajoute l’en-tête Retry-After pour dire quand réessayer.' },
        ] },
        { title: '5xx : erreur du côté du serveur', rows: [
          { term: '500 Internal Server Error', text: 'Erreur imprévue dans le code du serveur. Consulte les journaux.' },
          { term: '501 Not Implemented', text: 'Le serveur ne sait pas traiter cette méthode.' },
          { term: '502 Bad Gateway', text: 'Un serveur intermédiaire a reçu une réponse invalide du serveur suivant.' },
          { term: '503 Service Unavailable', text: 'Serveur en maintenance ou surchargé. Retry-After est conseillé.' },
          { term: '504 Gateway Timeout', text: 'Le serveur suivant a mis trop de temps à répondre.' },
        ] },
        { title: 'Quel code renvoyer ?', rows: [
          { term: 'Page déplacée', text: '301 (ou 308 pour une API). Jamais une redirection vers l’accueil pour toutes les anciennes pages.' },
          { term: 'Utilisateur non connecté', text: '401. Connecté mais sans droit : 403. Pour cacher qu’une ressource existe : 404.' },
          { term: 'Formulaire invalide', text: '422 avec la liste des champs en erreur, ou 400 si la requête elle-même est cassée.' },
          { term: 'Page d’erreur personnalisée', text: 'Elle doit garder son code 404 ou 500. Une page d’erreur en 200 trompe les moteurs de recherche.' },
          { term: '1xx', text: 'Codes d’information (100 Continue, 101 Switching Protocols) gérés par le serveur : on ne les renvoie presque jamais soi-même.' },
        ] },
      ],
    },
    en: {
      slug: 'http-status-codes',
      title: 'HTTP status codes',
      summary: 'The most common HTTP status codes, what they mean and which one to send in each situation.',
      seoTitle: 'HTTP status codes: the list explained (PDF)',
      seoDescription: '200, 301, 404, 429, 500… HTTP status codes explained simply, with the right code to send in each case. Read online or as a PDF.',
      sections: [
        { title: '2xx: the request succeeded', rows: [
          { term: '200 OK', text: 'Normal response, with content.' },
          { term: '201 Created', text: 'A resource was created (after a POST). Give its address in the Location header.' },
          { term: '202 Accepted', text: 'Request accepted, background processing not finished yet.' },
          { term: '204 No Content', text: 'Succeeded, with nothing to send back (after a DELETE, for example).' },
          { term: '206 Partial Content', text: 'Only part of the file, to play a video or resume a download.' },
        ] },
        { title: '3xx: redirects', rows: [
          { term: '301 Moved Permanently', text: 'The address changed for good. Search engines move the ranking over.' },
          { term: '302 Found', text: 'Temporary redirect. The old address stays the indexed one.' },
          { term: '303 See Other', text: 'After a form is sent, points to a page to open with GET.' },
          { term: '304 Not Modified', text: 'The browser can reuse its cached copy.' },
          { term: '307 / 308', text: 'Like 302 and 301, but the method (POST, PUT…) and the request body are kept.' },
        ] },
        { title: '4xx: client-side error', rows: [
          { term: '400 Bad Request', text: 'Malformed request: invalid JSON, missing parameter.' },
          { term: '401 Unauthorized', text: 'Sign-in needed: credentials missing or invalid.' },
          { term: '403 Forbidden', text: 'Signed in, but not allowed to access this resource.' },
          { term: '404 Not Found', text: 'Nothing at this address.' },
          { term: '405 Method Not Allowed', text: 'The address exists, but not for this method (a POST on a read-only page).' },
          { term: '409 Conflict', text: 'Conflicts with the current state: email already used, simultaneous edit.' },
          { term: '410 Gone', text: 'Deleted for good. Search engines drop it faster than with a 404.' },
          { term: '413 Content Too Large', text: 'File or request body too large.' },
          { term: '415 Unsupported Media Type', text: 'Format not accepted (a .png where a PDF is expected).' },
          { term: '422 Unprocessable Content', text: 'Well-formed request but invalid data: wrong email, past date.' },
          { term: '429 Too Many Requests', text: 'Too many requests. Add a Retry-After header to say when to try again.' },
        ] },
        { title: '5xx: server-side error', rows: [
          { term: '500 Internal Server Error', text: 'Unexpected error in the server code. Check the logs.' },
          { term: '501 Not Implemented', text: 'The server cannot handle this method.' },
          { term: '502 Bad Gateway', text: 'A server in between got an invalid response from the next one.' },
          { term: '503 Service Unavailable', text: 'Server under maintenance or overloaded. Retry-After is recommended.' },
          { term: '504 Gateway Timeout', text: 'The next server took too long to answer.' },
        ] },
        { title: 'Which code to send?', rows: [
          { term: 'Page moved', text: '301 (or 308 for an API). Never send every old page to the home page.' },
          { term: 'User not signed in', text: '401. Signed in but not allowed: 403. To hide that a resource exists: 404.' },
          { term: 'Invalid form', text: '422 with the list of fields in error, or 400 if the request itself is broken.' },
          { term: 'Custom error page', text: 'It must keep its 404 or 500 code. An error page sent as 200 misleads search engines.' },
          { term: '1xx', text: 'Informational codes (100 Continue, 101 Switching Protocols) handled by the server: you almost never send them yourself.' },
        ] },
      ],
    },
  },
  {
    id: 'launch-checklist',
    kind: 'checklist',
    gated: false,
    format: 'pdf',
    updated: '2026-11-04',
    fr: {
      slug: 'checklist-lancement-site',
      title: 'Checklist de lancement de site',
      summary: 'Tout ce qu’il faut vérifier avant et juste après la mise en ligne d’un site : contenu, référencement, vitesse, sécurité, mesure.',
      seoTitle: 'Checklist de mise en ligne d’un site web (PDF gratuit)',
      seoDescription: 'Contenu, SEO, vitesse, sécurité, formulaires, mobile : la checklist de JcHub pour lancer un site sans rien oublier. À cocher en ligne ou à imprimer.',
      sections: [
        { title: 'Contenu', rows: [
          { term: 'Textes relus', text: 'Fautes, informations à jour, numéros de téléphone et horaires vérifiés.' },
          { term: 'Faux contenus retirés', text: 'Aucun « Lorem ipsum », aucune image de démonstration du thème.' },
          { term: 'Pages légales', text: 'Mentions légales, politique de confidentialité et, si tu vends, conditions de vente.' },
          { term: 'Page 404', text: 'Une page d’erreur utile, avec un lien vers l’accueil et la recherche.' },
          { term: 'Icône du site', text: 'Favicon visible dans l’onglet et sur l’écran d’accueil du téléphone.' },
        ] },
        { title: 'Référencement', rows: [
          { term: 'Titre et description', text: 'Uniques sur chaque page, avec les mots que tes clients tapent dans Google.' },
          { term: 'Sitemap', text: 'sitemap.xml en ligne et envoyé dans Google Search Console.' },
          { term: 'robots.txt', text: 'Il n’empêche plus l’indexation (vérifie s’il reste un « Disallow: / » de la phase de test).' },
          { term: 'Redirections', text: 'Les adresses de l’ancien site redirigent en 301 vers leurs nouvelles pages.' },
          { term: 'Aperçus de partage', text: 'Image et titre corrects quand on partage le lien sur WhatsApp ou Facebook.' },
        ] },
        { title: 'Vitesse', rows: [
          { term: 'Images compressées', text: 'Au format WebP et à la bonne taille : une photo de 5 Mo ne doit pas servir de vignette.' },
          { term: 'Test mobile', text: 'PageSpeed Insights sur la version mobile, en visant au moins 90.' },
          { term: 'Cache', text: 'Fichiers statiques mis en cache, compression activée sur le serveur.' },
        ] },
        { title: 'Sécurité', rows: [
          { term: 'HTTPS partout', text: 'Certificat valide, et http:// redirige vers https://.' },
          { term: 'Accès administrateur', text: 'Mots de passe longs et uniques, comptes de test supprimés, double authentification si possible.' },
          { term: 'Mises à jour', text: 'CMS, thème et extensions à jour. Les extensions inutiles sont supprimées.' },
          { term: 'Sauvegardes', text: 'Automatiques, stockées ailleurs que sur le serveur, et une restauration déjà testée.' },
        ] },
        { title: 'Formulaires et e-mails', rows: [
          { term: 'Formulaires testés', text: 'Chaque formulaire envoyé pour de vrai : le message arrive, la confirmation s’affiche.' },
          { term: 'Anti-spam', text: 'Une protection contre les robots, sans gêner les vrais visiteurs.' },
          { term: 'E-mails du domaine', text: 'SPF, DKIM et DMARC configurés, pour que tes e-mails n’arrivent pas en spam.' },
        ] },
        { title: 'Mobile et accessibilité', rows: [
          { term: 'Vrai téléphone', text: 'Testé sur un téléphone d’entrée de gamme, en 3G ou 4G, pas seulement sur ordinateur.' },
          { term: 'Lisibilité', text: 'Texte assez grand, contrastes suffisants, boutons faciles à toucher.' },
          { term: 'Images décrites', text: 'Un texte alternatif sur chaque image qui porte une information.' },
          { term: 'Clavier', text: 'Le menu et les formulaires s’utilisent avec la touche Tab.' },
        ] },
        { title: 'Mesure et suivi', rows: [
          { term: 'Statistiques', text: 'Outil d’audience installé, avec le bandeau de consentement si des cookies sont déposés.' },
          { term: 'Search Console', text: 'Site validé, pour suivre l’indexation et les erreurs.' },
          { term: 'Surveillance', text: 'Une alerte si le site tombe, et un œil sur les erreurs 404 la première semaine.' },
          { term: 'Plan de mise à jour', text: 'Qui met à jour le contenu et le site, et à quel rythme.' },
        ] },
      ],
    },
    en: {
      slug: 'website-launch-checklist',
      title: 'Website launch checklist',
      summary: 'Everything to check before and right after a website goes live: content, SEO, speed, security, analytics.',
      seoTitle: 'Website launch checklist (free PDF)',
      seoDescription: 'Content, SEO, speed, security, forms, mobile: JcHub’s checklist to launch a website without forgetting anything. Tick it online or print it.',
      sections: [
        { title: 'Content', rows: [
          { term: 'Proofread texts', text: 'Typos, up-to-date information, phone numbers and opening hours checked.' },
          { term: 'Placeholder content removed', text: 'No “Lorem ipsum”, no demo images from the theme.' },
          { term: 'Legal pages', text: 'Legal notice, privacy policy and, if you sell, terms of sale.' },
          { term: '404 page', text: 'A helpful error page, with a link to the home page and the search.' },
          { term: 'Site icon', text: 'Favicon visible in the tab and on the phone’s home screen.' },
        ] },
        { title: 'SEO', rows: [
          { term: 'Title and description', text: 'Unique on every page, with the words your customers type into Google.' },
          { term: 'Sitemap', text: 'sitemap.xml online and submitted in Google Search Console.' },
          { term: 'robots.txt', text: 'It no longer blocks indexing (check for a leftover “Disallow: /” from testing).' },
          { term: 'Redirects', text: 'The old site’s addresses redirect with a 301 to their new pages.' },
          { term: 'Share previews', text: 'Correct image and title when the link is shared on WhatsApp or Facebook.' },
        ] },
        { title: 'Speed', rows: [
          { term: 'Compressed images', text: 'In WebP and at the right size: a 5 MB photo should not be used as a thumbnail.' },
          { term: 'Mobile test', text: 'PageSpeed Insights on the mobile version, aiming for at least 90.' },
          { term: 'Caching', text: 'Static files cached, compression turned on on the server.' },
        ] },
        { title: 'Security', rows: [
          { term: 'HTTPS everywhere', text: 'Valid certificate, and http:// redirects to https://.' },
          { term: 'Admin access', text: 'Long, unique passwords, test accounts removed, two-factor authentication if possible.' },
          { term: 'Updates', text: 'CMS, theme and plugins up to date. Unused plugins removed.' },
          { term: 'Backups', text: 'Automatic, stored somewhere other than the server, and a restore already tested.' },
        ] },
        { title: 'Forms and email', rows: [
          { term: 'Forms tested', text: 'Each form sent for real: the message arrives, the confirmation shows.' },
          { term: 'Anti-spam', text: 'Protection against bots that does not get in the way of real visitors.' },
          { term: 'Domain email', text: 'SPF, DKIM and DMARC set up, so your emails do not land in spam.' },
        ] },
        { title: 'Mobile and accessibility', rows: [
          { term: 'Real phone', text: 'Tested on an entry-level phone on 3G or 4G, not only on a computer.' },
          { term: 'Readability', text: 'Large enough text, enough contrast, buttons easy to tap.' },
          { term: 'Described images', text: 'Alt text on every image that carries information.' },
          { term: 'Keyboard', text: 'The menu and forms work with the Tab key.' },
        ] },
        { title: 'Analytics and follow-up', rows: [
          { term: 'Statistics', text: 'Analytics installed, with the consent banner if cookies are set.' },
          { term: 'Search Console', text: 'Site verified, to follow indexing and errors.' },
          { term: 'Monitoring', text: 'An alert if the site goes down, and an eye on 404 errors in the first week.' },
          { term: 'Update plan', text: 'Who updates the content and the site, and how often.' },
        ] },
      ],
    },
  },
  {
    id: 'website-contract',
    kind: 'template',
    gated: true,
    format: 'docx',
    updated: '2026-11-04',
    fr: {
      slug: 'modele-contrat-creation-site-web',
      title: 'Modèle de contrat de création de site web',
      summary: 'Un contrat de prestation entre un freelance ou une agence et son client, pour les pays de l’espace OHADA. À compléter dans Word.',
      notice: 'Modèle indicatif : il ne remplace pas le conseil d’un avocat ou d’un juriste. Fais-le relire avant de le signer, surtout pour un projet important.',
      seoTitle: 'Modèle de contrat de création de site web (OHADA, Word)',
      seoDescription: 'Contrat de prestation pour la création d’un site web, adapté aux pays de l’OHADA : prix en FCFA, acompte, recette, propriété du code, litiges. Fichier Word gratuit.',
      outline: [
        'Parties au contrat',
        'Objet et description des prestations',
        'Délais et planning',
        'Prix, acompte et paiement',
        'Obligations du prestataire et du client',
        'Validation (recette) et livraison',
        'Propriété intellectuelle',
        'Hébergement, nom de domaine et maintenance',
        'Confidentialité et données personnelles',
        'Responsabilité et force majeure',
        'Durée et résiliation',
        'Droit applicable et règlement des litiges (OHADA)',
        'Signatures',
      ],
    },
    en: {
      slug: 'website-development-contract-template',
      title: 'Website development contract template',
      summary: 'A services agreement between a freelancer or agency and their client, for OHADA member countries. Ready to fill in with Word.',
      notice: 'Template for information only: it does not replace advice from a lawyer. Have it reviewed before signing, especially for a large project.',
      seoTitle: 'Website development contract template (OHADA, Word)',
      seoDescription: 'Services agreement for building a website, suited to OHADA countries: price, deposit, acceptance, code ownership, disputes. Free Word file.',
      outline: [
        'Parties',
        'Purpose and description of the services',
        'Timeline',
        'Price, deposit and payment',
        'Obligations of the provider and the client',
        'Acceptance and delivery',
        'Intellectual property',
        'Hosting, domain name and maintenance',
        'Confidentiality and personal data',
        'Liability and force majeure',
        'Term and termination',
        'Governing law and disputes (OHADA)',
        'Signatures',
      ],
    },
  },
  {
    id: 'website-brief',
    kind: 'template',
    gated: true,
    format: 'docx',
    updated: '2026-11-04',
    fr: {
      slug: 'modele-cahier-des-charges-site-web',
      title: 'Modèle de cahier des charges de site web',
      summary: 'Le document qui décrit le site à créer : objectifs, pages, fonctionnalités, contenus, budget et planning. Pour demander des devis comparables.',
      seoTitle: 'Modèle de cahier des charges pour un site web (Word gratuit)',
      seoDescription: 'Objectifs, arborescence, fonctionnalités, Mobile Money, contenus, budget : un modèle de cahier des charges de site web à remplir, avec des exemples. Fichier Word.',
      outline: [
        'Présentation de l’entreprise',
        'Objectifs du site',
        'Public visé',
        'L’existant : site, nom de domaine, hébergement',
        'Pages du site (arborescence)',
        'Fonctionnalités',
        'Contenus : textes, photos, traductions',
        'Identité visuelle et sites de référence',
        'Contraintes techniques',
        'Référencement',
        'Maintenance et formation',
        'Budget et planning',
        'Critères de validation',
      ],
    },
    en: {
      slug: 'website-requirements-template',
      title: 'Website requirements template',
      summary: 'The document that describes the website to build: goals, pages, features, content, budget and timeline. To get quotes you can compare.',
      seoTitle: 'Website requirements document template (free Word file)',
      seoDescription: 'Goals, site map, features, mobile payments, content, budget: a website requirements template to fill in, with examples. Word file.',
      outline: [
        'About the business',
        'Goals of the website',
        'Target audience',
        'What exists: website, domain name, hosting',
        'Pages of the website (site map)',
        'Features',
        'Content: texts, photos, translations',
        'Visual identity and reference websites',
        'Technical constraints',
        'SEO',
        'Maintenance and training',
        'Budget and timeline',
        'Acceptance criteria',
      ],
    },
  },
];

export function findResource(slug: string, locale: Locale): Resource | undefined {
  return resources.find((resource) => resource[locale].slug === slug);
}

/** The resource behind a slug of the other language, to send the visitor to the right address. */
export function findResourceInAnyLanguage(slug: string): Resource | undefined {
  return resources.find((resource) => resource.fr.slug === slug || resource.en.slug === slug);
}

export function findResourceById(id: string): Resource | undefined {
  return resources.find((resource) => resource.id === id);
}
