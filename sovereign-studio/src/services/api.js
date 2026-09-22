// src/services/api.js
//
// Client for the MRPL Workbench FastAPI backend (backend/main.py).
//
// API base resolution (runtime):
//   - VITE_API_BASE_URL set to a URL       -> used as-is (e.g. http://192.168.1.50:8000)
//   - dev mode (`vite` / `npm run dev`)    -> http://127.0.0.1:8000
//   - production build served by FastAPI   -> "" (same origin) — so the workbench
//                                             works from any laptop on the Wi‑Fi
//                                             with no rebuild when the IP changes.

const _configured = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL =
  typeof _configured === 'string' && _configured.length > 0
    ? _configured.replace(/\/+$/, '')
    : import.meta.env.DEV
      ? 'http://127.0.0.1:8000'
      : '';

async function handleResponse(response, fallback) {
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  try {
    return await response.json();
  } catch {
    return fallback;
  }
}

export const apiService = {
  // 1. Fetch uploaded documents (GET /files)
  getDocuments: async () => {
    try {
      const data = await fetch(`${API_BASE_URL}/files`).then((r) => handleResponse(r, { files: [] }));
      return (data.files || []).map((f, i) => ({
        id: f.file_id || i + 1,
        file_id: f.file_id || null,
        name: f.name,
        path: f.path,
        size: (f.size_bytes / 1024).toFixed(1) + ' KB',
        type: 'Uploaded Document',
        ingest_status: f.ingest_status || null,
      }));
    } catch (error) {
      console.error('API Error [getDocuments]:', error);
      return [];
    }
  },

  // 2. Upload a file → returns backend record incl. absolute `path`
  uploadDocument: async (file, department = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('department', department);
    formData.append('auto_ingest', 'true');

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await handleResponse(response, {});
    return {
      id: Date.now(),
      name: file.name,
      path: data.path,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: 'Uploaded Document',
      file_id: data.file_id,
      chunks_ingested: data.chunks_ingested || 0,
      ingest_error: data.ingest_error || null,
    };
  },

  // 2b. Poll ingest status for an uploaded file (GET /ingest/status/{file_id})
  getIngestStatus: async (fileId) => {
    try {
      const r = await fetch(`${API_BASE_URL}/ingest/status/${encodeURIComponent(fileId)}`);
      if (!r.ok) return { file_id: fileId, status: 'unknown', chunks_ingested: 0 };
      return await r.json();
    } catch (error) {
      console.error('API Error [getIngestStatus]:', error);
      return { file_id: fileId, status: 'unknown', chunks_ingested: 0 };
    }
  },

  // 2c. All ingest jobs (GET /ingest)
  getIngestStatuses: async () => {
    try {
      const data = await fetch(`${API_BASE_URL}/ingest`).then((r) => handleResponse(r, { ingests: [] }));
      return data.ingests || [];
    } catch (error) {
      console.error('API Error [getIngestStatuses]:', error);
      return [];
    }
  },

  // 3. Send a prompt to the agent (POST /chat)
  sendAgentQuery: async (query, options = {}) => {
    const payload = {
      query,
      department: options.department || null,
      attached_file: options.attached_file || null,
      max_iterations: options.max_iterations || 5,
    };
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response, {});
  },

  // 4. Stream agent steps via Server-Sent Events (POST /chat/stream)
  //    `onEvent(nodeName, data)` is called for every step; the final node is "final".
  streamAgentQuery: async (query, options = {}, onEvent, onError) => {
    const payload = {
      query,
      department: options.department || null,
      attached_file: options.attached_file || null,
      max_iterations: options.max_iterations || 5,
    };
    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
          const line = part.trim().startsWith('data:') ? part.trim().slice(5).trim() : part.trim();
          if (!line) continue;
          try {
            const event = JSON.parse(line);
            onEvent(event.node, event.data || {});
          } catch {
            /* ignore malformed frame */
          }
        }
      }
    } catch (error) {
      if (onError) onError(error);
    }
  },

  // 5. Fetch generated deliverables (GET /outputs)
  getDeliverables: async () => {
    try {
      const data = await fetch(`${API_BASE_URL}/outputs`).then((r) => handleResponse(r, { outputs: [] }));
      return (data.outputs || []).map((f) => ({
        name: f.filename,
        relative_path: f.relative_path,
        size: (f.size_bytes / 1024).toFixed(1) + ' KB',
      }));
    } catch (error) {
      console.error('API Error [getDeliverables]:', error);
      return [];
    }
  },

  // 6. Download a deliverable file
  getDownloadUrl: (filename) => `${API_BASE_URL}/download/${encodeURIComponent(filename)}`,

  // 7. Backend health (GET /health)
  getHealth: async () => {
    try {
      return await fetch(`${API_BASE_URL}/health`).then((r) => handleResponse(r, { status: 'unknown' }));
    } catch (error) {
      console.error('API Error [getHealth]:', error);
      return { status: 'offline' };
    }
  },

  // 8. Fetch recent audit log entries (GET /audit)
  getAudit: async (limit = 50) => {
    try {
      const data = await fetch(`${API_BASE_URL}/audit?limit=${limit}`).then((r) => handleResponse(r, { entries: [] }));
      return data.entries || [];
    } catch (error) {
      console.error('API Error [getAudit]:', error);
      return [];
    }
  },
};