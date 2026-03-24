import { z } from 'zod';
import { getPanelDomain } from '../../config/domain-env.js';
import { getPanelAuthCredentials } from '../../config/panel-auth-env.js';
import { CloudflareApiError } from '../../platform/cloudflare/client.js';
import { addressSchema, cloudflareResourceIdSchema, ruleSchema } from './validation.js';
import { formatZodError } from './format-zod-error.js';

function resolveRouteError(err) {
  if (err instanceof z.ZodError) {
    return {
      status: 400,
      message: formatZodError(err),
    };
  }

  if (err instanceof CloudflareApiError) {
    return {
      status: err.status,
      message: err.message,
    };
  }

  console.error('Error en ruta API de email routing:', err);
  return {
    status: 500,
    message: 'Error interno del servidor',
  };
}

function sendRouteError(res, err) {
  const { status, message } = resolveRouteError(err);
  return res.status(status).json({ error: message });
}

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
    try {
      const ruleId = cloudflareResourceIdSchema.parse(req.params.id);
      const rule = await fetchCloudflare(`/zones/${env.CF_ZONE_ID}/email/routing/rules/${ruleId}`);
      const payload = buildRuleUpdatePayload(rule, enabled);
      const apiRes = await fetchCloudflare(`/zones/${env.CF_ZONE_ID}/email/routing/rules/${ruleId}`, 'PUT', payload);

      res.json({ result: apiRes });
    } catch (err) {
      sendRouteError(res, err);
    }
  };

  app.get('/api/me', requireAuth, (req, res) => {
    const { authUser } = getPanelAuthCredentials(env);
    res.json({
      email: authUser || 'admin',
      rootDomain: getPanelDomain(env),
    });
  });

  app.get('/api/addresses', requireAuth, async (req, res) => {
    try {
      const result = await fetchAllCloudflare(`/accounts/${env.CF_ACCOUNT_ID}/email/routing/addresses`);
      const mapped = result.map((address) => ({
        email: address.email,
        id: address.id,
        verified: address.verified,
      }));

      res.json({ result: mapped });
    } catch (err) {
      sendRouteError(res, err);
    }
  });

  app.post('/api/addresses', requireAuth, async (req, res) => {
    try {
      const body = addressSchema.parse(req.body);
      const apiRes = await fetchCloudflare(`/accounts/${env.CF_ACCOUNT_ID}/email/routing/addresses`, 'POST', {
        email: body.email,
      });

      res.json({ ok: true, result: apiRes });
    } catch (err) {
      sendRouteError(res, err);
    }
  });

  app.delete('/api/addresses/:id', requireAuth, async (req, res) => {
    try {
      const addressId = cloudflareResourceIdSchema.parse(req.params.id);
      await fetchCloudflare(`/accounts/${env.CF_ACCOUNT_ID}/email/routing/addresses/${addressId}`, 'DELETE');
      res.json({ success: true });
    } catch (err) {
      sendRouteError(res, err);
    }
  });

  app.get('/api/rules', requireAuth, async (req, res) => {
    try {
      const rules = await fetchAllCloudflare(`/zones/${env.CF_ZONE_ID}/email/routing/rules`);
      res.json({ result: rules });
    } catch (err) {
      sendRouteError(res, err);
    }
  });

  app.post('/api/rules', requireAuth, async (req, res) => {
    try {
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
    } catch (err) {
      sendRouteError(res, err);
    }
  });

  app.post('/api/rules/:id/enable', requireAuth, async (req, res) => updateRuleEnabledState(req, res, true));

  app.post('/api/rules/:id/disable', requireAuth, async (req, res) => updateRuleEnabledState(req, res, false));

  app.delete('/api/rules/:id', requireAuth, async (req, res) => {
    try {
      const ruleId = cloudflareResourceIdSchema.parse(req.params.id);
      await fetchCloudflare(`/zones/${env.CF_ZONE_ID}/email/routing/rules/${ruleId}`, 'DELETE');
      res.json({ success: true });
    } catch (err) {
      sendRouteError(res, err);
    }
  });
}
