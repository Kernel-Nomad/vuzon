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

export function createVuzonApp() {
  return {
    profile: { rootDomain: '' },
    rules: [],
    dests: [],
    loading: false,

    search: '',
    newAlias: { local: '', dest: '' },
    newDestInput: '',
    pendingRuleIds: [],

    statusMsg: '',
    errors: { alias: '', dest: '' },
    copied: false,
    statusTimer: null,

    get verifiedDests() {
      return getVerifiedDests(this);
    },

    get filteredRules() {
      const validRules = this.rules.filter((rule) => rule.name && rule.name.trim() !== '');

      if (!this.search) {
        return validRules;
      }

      const query = this.search.toLowerCase();
      return validRules.filter((rule) => rule.name.toLowerCase().includes(query));
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
      this.refreshAll();
    },

    async api(path, method = 'GET', body = null) {
      return apiRequest(path, method, body);
    },

    async refreshAll() {
      return refreshAll(this, {
        apiRequest: this.api.bind(this),
        setStatus,
      });
    },

    async logout() {
      return logout({ apiRequest: this.api.bind(this) });
    },

    async createAlias() {
      return createAlias(this, {
        apiRequest: this.api.bind(this),
        clearErrors,
        refreshAll: this.refreshAll.bind(this),
        setStatus,
      });
    },

    async addDest() {
      return addDest(this, {
        apiRequest: this.api.bind(this),
        clearErrors,
        refreshAll: this.refreshAll.bind(this),
        setStatus,
      });
    },

    async toggleRule(rule) {
      return toggleRule(this, rule, {
        apiRequest: this.api.bind(this),
        refreshAll: this.refreshAll.bind(this),
        setStatus,
      });
    },

    async deleteRule(id) {
      return deleteRule(this, id, {
        apiRequest: this.api.bind(this),
        refreshAll: this.refreshAll.bind(this),
        setStatus,
      });
    },

    async deleteDest(id) {
      return deleteDest(this, id, {
        apiRequest: this.api.bind(this),
        refreshAll: this.refreshAll.bind(this),
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
