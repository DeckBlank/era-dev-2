export default async function handler(request, response) {
  const authHeader = request.headers.authorization || (request.headers.get && request.headers.get('authorization')) || (request.headers.get && request.headers.get('Authorization'));
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ error: 'Acceso no autorizado' });
  }

  const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
  
  if (!deployHookUrl) {
    return response.status(500).json({ error: 'VERCEL_DEPLOY_HOOK_URL no configurado en entorno' });
  }

  try {
    const res = await fetch(deployHookUrl, { method: 'POST' });
    if (!res.ok) {
      throw new Error(`Error llamando al hook: ${res.status}`);
    }
    return response.status(200).json({ message: 'Re-build programado correctamente. Los nuevos datos se mostrarán en unos instantes.' });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
