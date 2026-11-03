# Secure Supabase verification setup

This project is currently a static GitHub Pages app. The SQL migration in `supabase/migrations/20261103000000_secure_verification.sql` creates a Supabase schema with Row Level Security (RLS) and an admin-only verification review function. Adding this migration does **not** connect the existing browser-only demo to a Supabase project by itself.

## What the migration protects

- Public profile records contain no email address. Visitors can read public profiles.
- Authenticated users can create and edit only their own profile's public fields.
- Client grants exclude `profiles.is_verified`; users cannot award themselves a verified badge.
- A signed-in user can submit a pending verification request and read only their own request. Admins can read all requests.
- Client grants exclude verification status and review fields. Users cannot approve/reject, edit, or delete requests.
- Only an administrator can execute `review_anash_verification_request`; it approves/rejects a pending request and updates the linked profile badge in one transaction.
- The admin registry has RLS enabled, no client policies, and no anon/authenticated table grants.

## Setup

1. Create a Supabase project and enable the authentication providers you plan to support.
2. Run the SQL migration using the Supabase CLI (`supabase db push`) or paste it into the project's SQL Editor. Back up the project before applying schema changes to a live database.
3. Create/sign up the account that will be the first administrator.
4. In the Supabase SQL Editor, assign that existing user as admin, replacing the email below with the administrator's exact account email:

   ```sql
   insert into public.app_admins (user_id)
   select id from auth.users where email = 'admin@example.com'
   on conflict (user_id) do nothing;
   ```

   Verify that exactly the intended account was selected before running the insert. Add/remove admins only through the trusted SQL Editor or a protected server-side operation; never expose service-role credentials in frontend code.
5. The migration creates a public profile automatically for new Auth users. For users created before the migration, backfill profiles from `auth.users` in the SQL Editor if needed.
6. Configure the frontend later with the Supabase project URL and **anon/publishable key only**. Never put the service-role key in the browser or commit it to this repository.
7. Replace the current localStorage-only verification demo with Supabase Auth and calls to `verification_requests` and `review_anash_verification_request`. Until that integration is completed, demo submissions and badges are not protected by these database rules.

## Admin review call

After sign-in, an authorized administrator can call the RPC with the request UUID and a decision:

```js
const { error } = await supabase.rpc('review_anash_verification_request', {
  p_request_id: requestId,
  p_status: 'approved', // or 'rejected'
  p_review_note: 'Reviewed public professional profile.'
});
```

The database verifies the caller's admin role; hiding an admin button in the UI is not a security control. Configure Auth redirect URLs, password/reset flows, storage policies for profile images, moderation, and privacy/legal requirements before a public launch. The verification form should not request identity documents until a secure, reviewed collection and retention process is in place.
