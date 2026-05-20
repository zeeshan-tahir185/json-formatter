// Web Worker: runs heavy JSON work off the main thread so the UI stays
// responsive even for ~1MB inputs.
import { formatJson, minifyJson, validateJson } from '../lib/jsonTools';
import { buildSideBySideDiff } from '../lib/diff';

self.onmessage = (e) => {
  const { id, type, payload } = e.data || {};
  try {
    let result;
    switch (type) {
      case 'format':
        result = formatJson(payload.text, payload.indent);
        break;
      case 'minify':
        result = minifyJson(payload.text);
        break;
      case 'validate':
        result = validateJson(payload.text);
        break;
      case 'diff':
        result = buildSideBySideDiff(JSON.parse(payload.left), JSON.parse(payload.right), payload.options);
        break;
      default:
        throw new Error(`Unknown worker task: ${type}`);
    }
    self.postMessage({ id, ok: true, result });
  } catch (err) {
    self.postMessage({ id, ok: false, error: { message: err.message, name: err.name } });
  }
};
