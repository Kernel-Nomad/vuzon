import { interpretAddDestError } from './utils/error.js';
import { isVerifiedStatus } from './utils/verification.js';

document.addEventListener('alpine:init', () => {
  Alpine.data('vuzonApp', () => ({
    profile: { rootDomain: '' },
    rules: [],
    dests: [],
    loading: false,
    
    search: '',
    newAlias: { local: '', dest: '' },
    newDestInput: '',
    
    statusMsg: '',
    errors: { alias: '', dest: '' },
    copied: false,
    statusTimer: null,

    get verifiedDests() {
      return this.dests.filter(d => isVerifiedStatus(d.verified));
    },
    get filteredRules() {
      const validRules = this.rules.filter(r => r.name && r.name.trim() !== '');

      if (!this.search) return validRules;
      const q = this.search.toLowerCase();
      return validRules.filter(r => r.name.toLowerCase().includes(q));
    },
    get previewText() {
      const local = this.newAlias.local.trim().toLowerCase() || 'alias';
      const domain = this.profile?.rootDomain || '...';
      return `${local}@${domain}`;
    },
    get canCreateAlias() {
      return this.newAlias.local.trim() && this.newAlias.dest && this.profile?.rootDomain;
    },

    init() {
      this.refreshAll();
    },

    async api(path, method = 'GET', body = null) {
      const opts = { 
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' 
      };
      if (method !== 'GET') {
        opts.method = method;
        if (body) opts.body = JSON.stringify(body);
      }
      
      const res = await fetch(path, opts);

      if (res.status === 401) {
        window.location.href = '/login.html';
        throw new Error('Sesión expirada');
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || `Error ${res.status}`);
      return data;
    },

    async refreshAll() {
      this.loading = true;
      try {
        const [meData, rulesData, destsData] = await Promise.all([
          this.api('/api/me'),
          this.api('/api/rules'),
          this.api('/api/addresses')
        ]);

        this.profile = meData || { rootDomain: '' };
        this.rules = rulesData?.result || [];
        this.dests = destsData?.result || [];
        
        if (!this.newAlias.dest && this.verifiedDests.length > 0) {
          this.newAlias.dest = this.verifiedDests[0].email;
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
        this.setStatus(`Error de carga: ${err.message}`);
        this.profile = this.profile || { rootDomain: '' };
        this.rules = this.rules || [];
        this.dests = this.dests || [];
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await this.api('/api/logout', 'POST');
        window.location.href = '/login.html';
      } catch (err) {
        console.error(err);
        window.location.href = '/login.html';
      }
    },

    async createAlias() {
      if (!this.canCreateAlias) return;
      this.clearErrors();
      this.loading = true;
      try {
        await this.api('/api/rules', 'POST', {
          localPart: this.newAlias.local.trim(),
          destEmail: this.newAlias.dest
        });
        this.setStatus('Alias creado');
        this.newAlias.local = '';
        this.refreshAll();
      } catch (err) {
        this.errors.alias = err.message;
      } finally {
        this.loading = false;
      }
    },

    async addDest() {
      if (!this.newDestInput) return;
      this.clearErrors();
      this.loading = true;
      try {
        await this.api('/api/addresses', 'POST', { email: this.newDestInput });
        this.setStatus('Añadido. Revisa tu correo para verificar.');
        this.newDestInput = '';
        this.refreshAll();
      } catch (err) {
        const interpretation = interpretAddDestError(err);
        this.errors.dest = interpretation.message;
      } finally {
        this.loading = false;
      }
    },

    async toggleRule(rule) {
      const originalState = rule.enabled;
      rule.enabled = !originalState; 
      try {
        const action = !originalState ? 'enable' : 'disable';
        await this.api(`/api/rules/${rule.id}/${action}`, 'POST');
      } catch (err) {
        rule.enabled = originalState; 
        this.setStatus(`Error: ${err.message}`);
      }
    },

    async deleteRule(id) {
      if (!confirm('¿Eliminar alias permanentemente?')) return;
      try {
        await this.api(`/api/rules/${id}`, 'DELETE');
        this.rules = this.rules.filter(r => r.id !== id);
        this.setStatus('Alias eliminado');
      } catch (err) {
        this.setStatus(err.message);
        this.refreshAll();
      }
    },

    async deleteDest(id) {
      if (!confirm('¿Eliminar destinatario? Si hay reglas usándolo, dejarán de funcionar.')) return;
      try {
        await this.api(`/api/addresses/${id}`, 'DELETE');
        this.dests = this.dests.filter(d => d.id !== id);
        this.setStatus('Destinatario eliminado');
      } catch (err) {
        this.setStatus(err.message);
      }
    },

    generateLocalPart() {
      const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
      let result = '';
      for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
      this.newAlias.local = result;
      this.clearErrors();
    },

    async copyPreview() {
      if (!this.profile.rootDomain) return;
      const text = this.previewText;
      
      try {
        await navigator.clipboard.writeText(text);
        this.copied = true;
        setTimeout(() => this.copied = false, 2000);
      } catch (err) {
        console.error('Error al copiar:', err);
        this.setStatus('No se pudo copiar (¿Usas HTTPS?)');
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            this.copied = true;
            setTimeout(() => this.copied = false, 2000);
            this.setStatus('');
        } catch (e) {
            prompt("Copia tu alias manualmente:", text);
        }
        document.body.removeChild(textArea);
      }
    },

    setStatus(msg) {
      this.statusMsg = msg;
      if (this.statusTimer) clearTimeout(this.statusTimer);
      this.statusTimer = setTimeout(() => this.statusMsg = '', 5000);
    },

    clearErrors() { this.errors.alias = ''; this.errors.dest = ''; },
    isVerified(dest) { return isVerifiedStatus(dest.verified); },
    getRuleDest(rule) {
      const dests = rule.actions?.[0]?.value || [];
      return Array.isArray(dests) ? dests.join(', ') : dests;
    }
  }));
});
