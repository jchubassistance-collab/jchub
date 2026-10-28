# Espace rédaction

Espace des rédacteurs et rédactrices invités : ils écrivent et publient leurs propres articles, signés de leur nom, sans accès au reste de l'administration.

## Donner l'accès

Dans **Administration > Utilisateurs > Ajouter un utilisateur**, choisir la fonction **Rédacteur ou rédactrice**, saisir le nom signé sur les articles et l'adresse e-mail.

- La création renvoie un lien pour choisir le mot de passe. Aucun e-mail n'est envoyé : le transmettre par un canal privé. Il expire au bout d'une heure environ ; « Forgot Password » sur `/admin/login` en renvoie un.
- « Ce compte existe déjà » donne seulement la fonction à un compte Firebase existant (refusé pour un administrateur). Le compte doit se reconnecter pour l'obtenir.
- Le menu de chaque compte permet de le renommer (ses articles sont re-signés, fichiers compris), de le déconnecter partout, de le désactiver ou de lui retirer sa fonction. Ses articles restent en place.

La même fenêtre crée aussi les comptes Community manager (`role: "cm"`).

## Rôle et sécurité

- Claim Firebase `role: "writer"` et `authorName` (nom signé). Le claim n'est modifiable que par `POST /api/admin/users` : le compte peut changer son nom Firebase ou son profil Firestore, pas sa signature.
- `/admin/redaction` est protégé par son layout serveur (`writerFromSession`) ; chaque route `/api/redaction/*` vérifie la session (`requireWriter`) et l'origine des écritures. Un administrateur n'y a pas accès : il gère tous les articles depuis **Contenu**.
- Les articles portent `authorUid`. Un rédacteur ne lit et ne modifie que les siens : l'article d'un autre répond 404.
- Le Markdown est rendu par `react-markdown` sans HTML brut : un rédacteur ne peut pas injecter de script dans le blog.

## Ce qu'un rédacteur peut faire

- Créer un brouillon (éditeur ou idée du calendrier éditorial). Les brouillons s'enregistrent seuls pendant la frappe.
- Publier directement, si l'article passe les contrôles de `lib/writer-rules.ts` (titre, résumé, 300 mots, catégorie traduite). La publication choisit une photo de couverture Unsplash, crée la version anglaise, écrit les fichiers de `content/articles` (commit GitHub, puis déploiement) et prévient l'administrateur par e-mail (Brevo, `CONTACT_NOTIFICATION_EMAIL`).
- Modifier un article publié avec « Mettre à jour l'article » : chaque mise à jour est redéployée. Limite de 30 publications ou mises à jour par heure.
- Supprimer un brouillon jamais publié.

Il ne peut pas retirer un article publié, ni modifier un article archivé ou programmé, ni changer l'adresse d'un article déjà publié. Pour retirer un article : **Contenu > Déplacer en brouillon** (le rédacteur pourra le republier) ou **Archiver** (il ne pourra plus le modifier).
