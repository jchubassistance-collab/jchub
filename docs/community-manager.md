# Espace Community Manager

## Architecture

- `/admin/cm` is server-gated by the Firebase Admin session cookie. It accepts the `cm` custom claim and administrators.
- `/api/cm/*` checks the session and role on each request. Writes also require a same-origin `Origin` header.
- Editorial content and reports are stored in `cmEditorial` and `cmReports`. Activity events are written by the server to `cmActivity` and generated drafts in `cmKits`.
- CM access uses Firebase Admin SDK only. No CM client Firestore calls are made.
- Reports use `<platform>_<weekStart>` as their document ID, so submitting the same week and platform updates the existing report.
- The admin-only `POST /api/admin/cm-accounts` endpoint supports `create`, `grant-role`, `disable`, `enable`, `revoke`, and `remove-role`. Account creation creates a reset link but does not email it; the authorized admin must deliver it through an approved channel. `grant-role` assigns a `cm` custom claim to an existing Firebase account by email.

## Firebase rules deployment

`firestore.rules` versions the existing rules supplied for this project: users can access only their own user document and read their own purchased books; all other client access is denied. User creation is limited to role `user` or no role, and client updates must preserve the existing role. This closes self-promotion through the user profile while preserving profile updates. The CM collections, including `cmKits`, are explicitly denied to client SDKs. CM role changes use the admin-only server endpoint; CM API access checks the `cm` custom claim.

Deploy the file only after confirming that the supplied rules still match the rules currently active in Firebase Console. Firestore grants are ORed across matching rule blocks, so check for broader overlapping matches if the console version has changed.

## Setup

1. Confirm Firebase Admin server credentials are configured in the deployment environment using the existing `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` variables.
2. Sign in as an existing administrator and call `POST /api/admin/cm-accounts` with `{ "action": "create", "email": "…", "displayName": "…" }` from the JcHub origin. Keep the returned password reset link private and provide it to the new CM through an approved channel. The endpoint sends no email.
3. Once the account has set its password, its Firebase token receives the `role: "cm"` claim at sign-in. The user signs in through `/admin/login` and is routed to `/admin/cm`.
4. Merge and deploy the Firestore restrictions above only after comparing them with the currently deployed rules.

The account-management endpoint has no dedicated admin screen yet. The Firestore emulator configuration is not present, so rule and session-revocation integration scenarios still need to be exercised in the configured Firebase environment.

## Publication kits

The **Kits de publication** tab is where the CM prepares and publishes posts for the JcHub Facebook Page and Instagram account. The CM selects a published article or tool; the server asks the configured AI provider (Gemini first, OpenRouter as fallback) for French Instagram and Facebook copy and for the diagram of the visual, and stores the kit in `cmKits` as a draft. The CM can edit and save the copy, preview and download the visual (Instagram 4:5 or Facebook 1200×630), then click **Publier sur Facebook et Instagram**: the kit is saved and posted through the site's own Meta connection, and the status of each network (in progress, published with a link, failed, to verify) appears on the kit. The CM does not need access to the Facebook account. Administrators also see the publishing settings (active networks, dry-run, automatic publishing, Meta connection) at the top of the tab. The visual is drawn by a branded JcHub template (`lib/social-card.tsx`), not by an image-generation model. Kit APIs require a CM or admin session, and Firestore client access is denied. See `docs/social-publishing.md`.