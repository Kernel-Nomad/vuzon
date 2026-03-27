import { createAlias, deleteRule, generateLocalPart, getRuleDest, toggleRule } from '../features/aliases/index.js';
import { refreshAll } from '../features/dashboard/refresh-all.js';
import { addDest, deleteDest } from '../features/destinations/index.js';
import { logout } from '../features/session/logout.js';
import { apiRequest } from '../shared/api-client.js';
import { copyPreviewToClipboard } from '../shared/clipboard.js';
import { clearErrors, setStatus } from '../shared/status.js';
import { isVerifiedStatus } from '../shared/verification.js';

function getVerifiedDests(state) {
  return state.dests.filter((dest) => isVerifiedStatus(dest.verified));
}

/** Regla catch-all de Email Routing (listada aparte en la API dedicada). */
function ruleMatchesCatchAllSlot(rule, catchAll) {
  if (!catchAll) {
    return false;
  }
  if (catchAll.id && rule.id === catchAll.id) {
    return true;
  }
  return Array.isArray(rule.matchers) && rule.matchers.some((m) => m && m.type === 'all');
}

export function createVuzonApp() {
  return {
    profile: { rootDomain: '' },
    rules: [],
    dests: [],
    catchAll: null,
    loading: false,

    search: '',
    newAlias: { local: '', dest: '' },
    newDestInput: '',
    pendingRuleIds: [],

    statusMsg: '',
    errors: { alias: '', dest: '' },
    copied: false,
    copiedTimer: null,
    statusTimer: null,

    get verifiedDests() {
      return getVerifiedDests(this);
    },

    get filteredRules() {
      const validRules = this.rules.filter((rule) => rule.name && rule.name.trim() !== '');
      const withoutCatchAllDup = this.catchAll
        ? validRules.filter((rule) => !ruleMatchesCatchAllSlot(rule, this.catchAll))
        : validRules;

      if (!this.search) {
        return withoutCatchAllDup;
      }

      const query = this.search.toLowerCase();
      return withoutCatchAllDup.filter((rule) => rule.name.toLowerCase().includes(query));
    },

    get aliasListEmptyMessage() {
      if (this.filteredRules.length > 0) {
        return '';
      }
      if (this.search) {
        return 'No se encontraron alias.';
      }
      if (this.catchAll) {
        return 'No hay alias personalizados; solo aplica el catch-all.';
      }
      if (this.rules.length === 0) {
        return 'No hay alias creados.';
      }
      return 'No se encontraron alias.';
    },

    get normalizedLocalPart() {
      return this.newAlias.local.trim().toLowerCase();
    },

    get previewText() {
      const local = this.normalizedLocalPart || 'alias';
      const domain = this.profile?.rootDomain || '...';
      return `${local}@${domain}`;
    },

    get canCreateAlias() {
      const hasVerifiedSelectedDest = this.verifiedDests.some((dest) => dest.email === this.newAlias.dest);
      return Boolean(this.normalizedLocalPart && this.profile?.rootDomain && hasVerifiedSelectedDest);
    },

    init() {
      this._api = this.api.bind(this);
      this._refreshAll = this.refreshAll.bind(this);
      this._refreshAll();
    },

    async api(path, method = 'GET', body = null) {
      return apiRequest(path, method, body);
    },

    async refreshAll() {
      return refreshAll(this, {
        apiRequest: this._api,
        setStatus,
      });
    },

    async logout() {
      return logout({ apiRequest: this._api });
    },

    async createAlias() {
      return createAlias(this, {
        apiRequest: this._api,
        clearErrors,
        refreshAll: this._refreshAll,
        setStatus,
      });
    },

    async addDest() {
      return addDest(this, {
        apiRequest: this._api,
        clearErrors,
        refreshAll: this._refreshAll,
        setStatus,
      });
    },

    async toggleRule(rule) {
      return toggleRule(this, rule, {
        apiRequest: this._api,
        refreshAll: this._refreshAll,
        setStatus,
      });
    },

    async deleteRule(id) {
      return deleteRule(this, id, {
        apiRequest: this._api,
        refreshAll: this._refreshAll,
        setStatus,
      });
    },

    async deleteDest(id) {
      return deleteDest(this, id, {
        apiRequest: this._api,
        refreshAll: this._refreshAll,
        setStatus,
      });
    },

    generateLocalPart() {
      return generateLocalPart(this, { clearErrors });
    },

    normalizeAliasInput() {
      this.newAlias.local = this.normalizedLocalPart;
      return clearErrors(this);
    },

    async copyPreview() {
      return copyPreviewToClipboard(this, { setStatus });
    },

    setStatus(message) {
      return setStatus(this, message);
    },

    clearErrors() {
      return clearErrors(this);
    },

    isVerified(dest) {
      return isVerifiedStatus(dest.verified);
    },

    getRuleDest(rule) {
      return getRuleDest(rule);
    },

    isRulePending(id) {
      return this.pendingRuleIds.includes(id);
    },
  };
}
