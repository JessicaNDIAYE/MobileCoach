// Edge Function : suppression définitive du compte de l'utilisateur connecté (exigence App Store 5.1.1(v)).
// Les tables liées à auth.users sont supprimées en cascade ; les fichiers Storage sont effacés ici.
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKETS = ['meals', 'receipts'];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;

  // 1. Identifier l'utilisateur à partir de SON jeton (jamais d'un id envoyé par le client).
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data } = await userClient.auth.getUser();
  const user = data.user;
  if (!user) return json({ error: 'Non connecté' }, 401);

  // 2. Client administrateur : la clé service_role ne quitte jamais le serveur.
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 3. Effacer les fichiers de l'utilisateur (dossier <user_id>/ de chaque bucket).
  for (const bucket of BUCKETS) {
    for (;;) {
      const { data: files, error } = await admin.storage.from(bucket).list(user.id, { limit: 100 });
      if (error) {
        console.error('Storage list', bucket, error);
        return json({ error: 'Suppression impossible pour le moment, réessaie.' }, 500);
      }
      if (!files?.length) break;
      const { error: rmError } = await admin.storage.from(bucket).remove(files.map((f) => `${user.id}/${f.name}`));
      if (rmError) {
        console.error('Storage remove', bucket, rmError);
        return json({ error: 'Suppression impossible pour le moment, réessaie.' }, 500);
      }
    }
  }

  // 4. Supprimer le compte : profil, pesées, achats, défis, check-ins… partent en cascade.
  try {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
  } catch (e) {
    console.error('deleteUser', e);
    return json({ error: 'Suppression impossible pour le moment, réessaie.' }, 500);
  }

  return json({ deleted: true });
});
