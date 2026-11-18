// Maps a subset of app-server events to the office's consumed SDK shape.
// No tool execution, reconnect, persisted session resume or external side effects.
export class OfficeEventStream {
  constructor(adapter, { instructions = '', timeoutMs = 60000 } = {}) {
    this.adapter = adapter; this.instructions = instructions; this.timeoutMs = timeoutMs;
  }
  async *stream(prompt, { signal, outputSchema, images } = {}) {
    if (signal?.aborted) throw new Error('ABORTED');
    const rpc = this.adapter.client;
    const queue = []; let wake, failure, done = false; let activeTurn;
    const notify = () => { wake?.(); wake = null; };
    const receive = message => {
      const p = message.params || {};
      if (p.threadId !== this.threadId) return;
      queue.push(message); notify();
    };
    const abort = () => { failure = new Error('ABORTED'); this.interrupt().catch(() => {}); notify(); };
    const closed = () => { failure = new Error('TRANSPORT_CLOSED'); notify(); };
    this.threadId = await this.adapter.startThread({ instructions: this.instructions });
    rpc.on('notification', receive); rpc.on('closed', closed);
    signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => { failure = new Error('TURN_TIMEOUT'); this.interrupt().catch(() => {}); notify(); }, this.timeoutMs);
    try {
      if (signal?.aborted) throw new Error('ABORTED');
      const started = await this.adapter.startTurn(this.threadId, prompt, {outputSchema,images});
      this.turnId = activeTurn = started?.turn?.id;
      if (!activeTurn) throw new Error('INVALID_TURN_RESPONSE');
      this.adapter.readOnlyToolBridge?.bind(this.threadId,activeTurn);
      let text = ''; const finalItems = new Map();
      while (!done) {
        if (failure) throw failure;
        if (!queue.length) { await new Promise(resolve => { wake = resolve; }); continue; }
        const event = queue.shift(); const p = event.params;
        if (p.turnId && p.turnId !== activeTurn) continue;
        if (event.method === 'item/agentMessage/delta') {
          if (typeof p.delta !== 'string') throw new Error('INVALID_TEXT_DELTA');
          text += p.delta; if(text.length > 100000) throw new Error('OUTPUT_TOO_LARGE');
          yield { type: 'assistant', session_id: this.threadId, message: { content: [{ type: 'text', text: p.delta }] } };
        } else if (event.method === 'item/completed' && p.item?.type === 'agentMessage') {
          if(typeof p.item.text !== 'string') throw new Error('INVALID_FINAL_TEXT');
          finalItems.set(p.item.id, {text:p.item.text, phase:p.item.phase});
        } else if (event.method === 'turn/completed') {
          if (p.turn?.id !== activeTurn) continue;
          done = true;
          const success = p.turn.status === 'completed';
          yield { type: 'result', session_id: this.threadId, subtype: success ? 'success' : 'error_during_execution', result: finalItems.size ? [...finalItems.values()].filter(x => x.phase !== 'commentary').map(x=>x.text).join('\n') : text };
        }
      }
    } finally {
      this.adapter.readOnlyToolBridge?.clear();
      clearTimeout(timer); rpc.off('notification', receive); rpc.off('closed', closed); signal?.removeEventListener('abort', abort);
      if (!done) await this.interrupt().catch(() => {});
    }
  }
  async interrupt() { if (this.threadId && this.turnId) await this.adapter.interrupt(this.threadId, this.turnId); }
  async close() { this.adapter.client.close(); }
}
