export async function ensureCloudflareIdentifiers({
  env = process.env,
  cloudflareClient,
} = {}) {
  if (env.CF_ZONE_ID && env.CF_ACCOUNT_ID) {
    return;
  }

  console.log('⚙️ Faltan IDs de configuración. Detectando automáticamente...');

  if (!env.DOMAIN || !env.CF_API_TOKEN) {
    throw new Error('Imposible autoconfigurar: Faltan DOMAIN o CF_API_TOKEN');
  }

  const domain = env.DOMAIN.trim();
  const zones = await cloudflareClient.fetchCloudflare(`/zones?name=${encodeURIComponent(domain)}`);

  if (!Array.isArray(zones) || zones.length === 0) {
    throw new Error(`Dominio ${domain} no encontrado en esta cuenta de Cloudflare.`);
  }

  if (zones.length > 1) {
    throw new Error(`Autoconfiguración ambigua para ${domain}: se encontraron ${zones.length} zonas.`);
  }

  const [zone] = zones;

  env.CF_ZONE_ID = zone.id;
  env.CF_ACCOUNT_ID = zone.account.id;

  console.log(`✅ Autoconfiguración exitosa para ${domain}`);
}
