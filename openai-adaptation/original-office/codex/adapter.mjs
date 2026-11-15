// Offline adapter core. No process spawn, network, credentials or upstream imports.
import {TEXT_ONLY_CONFIG} from './text-only-config.mjs';
import { EventEmitter } from 'node:events';
import path from 'node:path';
export class AppServerClient extends EventEmitter {
  constructor(send, { timeoutMs = 10000 } = {}) {
    super(); this.send = send; this.timeoutMs = timeoutMs; this.pending = new Map(); this.nextId = 1; this.closed = false;
  }
  request(method, params = {}) {
    if (this.closed) return Promise.reject(new Error('TRANSPORT_CLOSED'));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('RPC_TIMEOUT')); }, this.timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      try { this.send({ id, method, params }); } catch { clearTimeout(timer); this.pending.delete(id); reject(new Error('TRANSPORT_SEND_FAILED')); }
    });
  }
  receive(message) {
    if (this.closed) return;
    if (!message || typeof message !== 'object') throw new Error('INVALID_PROTOCOL_MESSAGE');
    if (message.method && message.id !== undefined) {
      if (message.method === 'item/tool/call' && this.readOnlyToolBridge) {
        this.send({ id:message.id, result:this.readOnlyToolBridge.handle(message) }); return;
      }
      // No silent permission escalation or tool execution. A future UI must map
      // each request and return an explicit, scoped approval; currently fail closed.
      this.send({ id: message.id, error: { code: -32601, message: 'External action and approval bridge not enabled' } });
      this.emit('blockedRequest', { method: message.method }); return;
    }
    if (message.method) { this.emit('notification', message); return; }
    const p = this.pending.get(message.id); if (!p) return;
    clearTimeout(p.timer); this.pending.delete(message.id);
    if (message.error) p.reject(new Error('RPC_REMOTE_ERROR')); // do not leak credentials in remote errors
    else p.resolve(message.result);
  }
  close() { this.closed = true; this.emit('closed'); for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(new Error('TRANSPORT_CLOSED')); } this.pending.clear(); }
}
export class OfficeAdapter {
  constructor(client, { workspace, model, env = {}, readOnlyToolBridge = null }) {
    if (!path.isAbsolute(workspace || '')) throw new Error('ABSOLUTE_WORKSPACE_REQUIRED');
    if (!model || /^claude/i.test(model)) throw new Error('EXPLICIT_CODEX_MODEL_REQUIRED');
    for (const key of ['OPENAI_API_KEY','ANTHROPIC_API_KEY','OPENROUTER_API_KEY','AZURE_OPENAI_API_KEY']) {
      if (env[key]) throw new Error('PAID_CREDENTIAL_NOT_ALLOWED');
    }
    this.readOnlyToolBridge=readOnlyToolBridge; client.readOnlyToolBridge=readOnlyToolBridge;
    this.client = client; this.workspace = workspace; this.model = model; this.ready = false; this.threads = new Set();
  }
  async initialize() {
    await this.client.request('initialize', { clientInfo: { name: 'oficina-openai-adapter', version: '0.1.0' }, ...(this.readOnlyToolBridge ? {capabilities:{experimentalApi:true}} : {}) });
    this.client.send({ method: 'initialized' });
    await this.checkAccount(); this.ready = true;
  }
  async checkAccount() {
    const result = await this.client.request('account/read', { refreshToken: false });
    if (result?.account?.type !== 'chatgpt') { this.ready = false; throw new Error('CHATGPT_LOGIN_REQUIRED_NO_API_FALLBACK'); }
  }
  async startThread({ instructions = '', ...unsupported } = {}) {
    if (Object.keys(unsupported).length) throw new Error('UNSUPPORTED_THREAD_OPTIONS');
    if (!this.ready) throw new Error('NOT_INITIALIZED');
    await this.checkAccount();
    const r = await this.client.request('thread/start', {
      ...(this.readOnlyToolBridge ? {dynamicTools:this.readOnlyToolBridge.specs()} : {}),
      cwd: this.workspace, model: this.model, modelProvider: 'openai',
      approvalPolicy: 'untrusted', sandbox: 'read-only',
      developerInstructions: instructions, ephemeral: true,
      config: TEXT_ONLY_CONFIG
    });
    if (!r?.thread?.id) throw new Error('INVALID_THREAD_RESPONSE');
    this.threads.add(r.thread.id); return r.thread.id;
  }
  async startTurn(threadId, text, { outputSchema } = {}) {
    if (!this.ready || !this.threads.has(threadId)) throw new Error('UNKNOWN_THREAD');
    if (typeof text !== 'string' || !text.trim()) throw new Error('TEXT_REQUIRED');
    await this.checkAccount();
    // Never infer included usage from remaining credits or percentage snapshots.
    const usage = await this.client.request('account/rateLimits/read', { excludeResetCreditDetails: true, supportsLunaReserve: false });
    if (usage?.ordinaryUsageAllowed !== true) throw new Error('INCLUDED_USAGE_NOT_CONFIRMED');
    return this.client.request('turn/start', { threadId, input: [{ type: 'text', text }], ...(outputSchema ? {outputSchema} : {}) });
  }
  async interrupt(threadId, turnId) {
    if (!this.threads.has(threadId) || !turnId) throw new Error('UNKNOWN_TURN');
    return this.client.request('turn/interrupt', { threadId, turnId });
  }
}
export function checkResources({ hostCpu, hostMemoryBytes, cpu, memoryBytes }) {
  const values = [hostCpu, hostMemoryBytes, cpu, memoryBytes];
  if (values.some(v => !Number.isFinite(v) || v <= 0)) throw new Error('INVALID_RESOURCE_LIMIT');
  if (cpu > 5 || cpu > hostCpu * .7 || memoryBytes > hostMemoryBytes * .7 || memoryBytes > 20 * 1024 ** 3) throw new Error('RESOURCE_LIMIT_EXCEEDED');
  return true;
}
