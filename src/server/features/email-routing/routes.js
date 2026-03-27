import { getPanelDomain } from '../../config/domain-env.js';
import { getPanelAuthCredentials } from '../../config/panel-auth-env.js';
import { asyncHandler } from '../../bootstrap/async-handler.js';
import { addressSchema, cloudflareResourceIdSchema, ruleSchema } from './validation.js';

function buildRuleUpdatePayload(rule, enabled) {
  const payload = {
    name: rule.name,
    enabled,
    matchers: rule.matchers,
    actions: rule.actions,
  };

  if (typeof rule.priority !== 'undefined') {
    payload.priority = rule.priority;
  }

  return payload;
}

export function registerApiRoutes(app, {
  env = process.env,
  requireAuth,
  cloudflareClient,
} = {}) {
  const { fetchCloudflare, fetchAllCloudflare } = cloudflareClient;
  const updateRuleEnabledState = async (req, res, enabled) => {
    const ruleId = cloudflareResourceIdSchema.parse(req.params.id);
    const rule = await fetchCloudflare(`/zones/${env.CF_ZONE_ID}/email/routing/rules/${ruleId}`);
    const payload = buildRuleUpdatePayload(rule, enabled);
    const apiRes = await fetchCloudflare(`/zones/${env.CF_ZONE_ID}/email/routing/rules/${ruleId}`, 'PUT', payload);

    res.json({ result: apiRes });
  };

  app.get('/api/me', requireAuth, (req, res) => {
    const { authUser } = getPanelAuthCredentials(env);
    res.json({
      email: authUser || 'admin',
      rootDomain: getPanelDomain(env),
    });
  });

  app.get('/api/addresses', requireAuth, asyncHandler(async (req, res) => {
    const result = await fetchAllCloudflare(`/accounts/${env.CF_ACCOUNT_ID}/email/routing/addresses`);
    const mapped = result.map((address) => ({
      email: address.email,
      id: address.id,
      verified: address.verified,
    }));

    res.json({ result: mapped });
  }));

  app.post('/api/addresses', requireAuth, asyncHandler(async (req, res) => {
    const body = addressSchema.parse(req.body);
    const apiRes = await fetchCloudflare(`/accounts/${env.CF_ACCOUNT_ID}/email/routing/addresses`, 'POST', {
      email: body.email,
    });

    res.json({ ok: true, result: apiRes });
  }));

  app.delete('/api/addresses/:id', requireAuth, asyncHandler(async (req, res) => {
    const addressId = cloudflareResourceIdSchema.parse(req.params.id);
    await fetchCloudflare(`/accounts/${env.CF_ACCOUNT_ID}/email/routing/addresses/${addressId}`, 'DELETE');
    res.json({ success: true });
  }));

  app.get('/api/rules', requireAuth, asyncHandler(async (req, res) => {
    const rules = await fetchAllCloudflare(`/zones/${env.CF_ZONE_ID}/email/routing/rules`);
    res.json({ result: rules });
  }));

  app.post('/api/rules', requireAuth, asyncHandler(async (req, res) => {
    const { localPart, destEmail } = ruleSchema.parse(req.body);
    const aliasEmail = `${localPart}@${getPanelDomain(env)}`;
    const payload = {
      name: aliasEmail,
      enabled: true,
      matchers: [{ type: 'literal', field: 'to', value: aliasEmail }],
      actions: [{ type: 'forward', value: [destEmail] }],
    };

    const apiRes = await fetchCloudflare(`/zones/${env.CF_ZONE_ID}/email/routing/rules`, 'POST', payload);
    res.json({ ok: true, result: apiRes });
  }));

  app.post('/api/rules/:id/enable', requireAuth, asyncHandler(async (req, res) => {
    await updateRuleEnabledState(req, res, true);
  }));

  app.post('/api/rules/:id/disable', requireAuth, asyncHandler(async (req, res) => {
    await updateRuleEnabledState(req, res, false);
  }));

  app.delete('/api/rules/:id', requireAuth, asyncHandler(async (req, res) => {
    const ruleId = cloudflareResourceIdSchema.parse(req.params.id);
    await fetchCloudflare(`/zones/${env.CF_ZONE_ID}/email/routing/rules/${ruleId}`, 'DELETE');
    res.json({ success: true });
  }));
}
