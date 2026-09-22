// src/services/websocket.js
//
// The MRPL backend streams agent steps over Server-Sent Events
// (POST /chat/stream), not a raw WebSocket. This module exposes an SSE-based
// client so the UI can consume the live pipeline without a WS server.

import { API_BASE_URL } from './api';

export class StreamService {
  constructor(endpoint = '/chat/stream') {
    this.endpoint = endpoint;
    this.controller = null;
    this.onMessage = null;
    this.onError = null;
    this.onClose = null;
  }

  // onMessage(data) receives { node, data } per SSE event.
  connect(onMessage, onError, onClose) {
    this.onMessage = onMessage || this.onMessage;
    this.onError = onError || this.onError;
    this.onClose = onClose || this.onClose;
  }

  send(request) {
    if (this.controller) this.disconnect();

    this.controller = new AbortController();
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}${this.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: this.controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!response.body) throw new Error('Streaming not supported by browser');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split('\n\n');
          buffer = parts.pop();
          for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed.startsWith('data:')) continue;
            try {
              const event = JSON.parse(trimmed.slice(5).trim());
              if (this.onMessage) this.onMessage(event);
            } catch {
              /* ignore malformed frame */
            }
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (this.onError) this.onError(error);
      } finally {
        if (this.onClose) this.onClose();
        this.controller = null;
      }
    })();
  }

  disconnect() {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }
}