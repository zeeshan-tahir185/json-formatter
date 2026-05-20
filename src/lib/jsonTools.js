// Pure, DOM-free JSON utilities.
// Safe to import on the main thread or inside a Web Worker.

/**
 * Detailed syntax error with a 1-based line/column and a small text snippet.
 */
export class JsonSyntaxError extends Error {
  constructor(message, line, column, position, snippet) {
    super(message);
    this.name = 'JsonSyntaxError';
    this.line = line;
    this.column = column;
    this.position = position;
    this.snippet = snippet;
  }
}

const ESCAPES = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };

/**
 * A small, strict, hand-written JSON parser whose only job is to produce
 * high-quality diagnostics: the exact line/column of the first error, plus
 * non-fatal warnings (e.g. duplicate keys) and structural statistics.
 */
class DiagnosticParser {
  constructor(text) {
    this.text = text;
    this.len = text.length;
    this.i = 0;
    this.warnings = [];
    this.stats = { objects: 0, arrays: 0, keys: 0, values: 0, maxDepth: 0, nodes: 0 };
  }

  parse() {
    this.skipWhitespace();
    if (this.i >= this.len) {
      this.fail('Unexpected end of input: the document is empty.');
    }
    const value = this.parseValue(1);
    this.skipWhitespace();
    if (this.i < this.len) {
      this.fail(`Unexpected token "${this.text[this.i]}" after the top-level value.`);
    }
    return { value, warnings: this.warnings, stats: this.stats };
  }

  // ---- diagnostics helpers -------------------------------------------------

  locate(pos) {
    let line = 1;
    let lineStart = 0;
    for (let k = 0; k < pos && k < this.len; k++) {
      if (this.text[k] === '\n') {
        line++;
        lineStart = k + 1;
      }
    }
    return { line, column: pos - lineStart + 1, lineStart };
  }

  snippetAt(pos) {
    const { line, column, lineStart } = this.locate(pos);
    let lineEnd = this.text.indexOf('\n', lineStart);
    if (lineEnd === -1) lineEnd = this.len;
    const lineText = this.text.slice(lineStart, lineEnd).replace(/\t/g, ' ');
    const caret = ' '.repeat(Math.max(0, column - 1)) + '^';
    return { line, column, snippet: `${lineText}\n${caret}` };
  }

  fail(message, pos = this.i) {
    const { line, column, snippet } = this.snippetAt(Math.min(pos, this.len));
    throw new JsonSyntaxError(message, line, column, pos, snippet);
  }

  skipWhitespace() {
    while (this.i < this.len) {
      const c = this.text[this.i];
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') this.i++;
      else break;
    }
  }

  // ---- grammar -------------------------------------------------------------

  parseValue(depth) {
    if (depth > this.stats.maxDepth) this.stats.maxDepth = depth;
    this.skipWhitespace();
    if (this.i >= this.len) this.fail('Unexpected end of input: a value was expected.');
    const c = this.text[this.i];
    switch (c) {
      case '{':
        return this.parseObject(depth);
      case '[':
        return this.parseArray(depth);
      case '"':
        this.stats.values++;
        this.stats.nodes++;
        return this.parseString();
      case 't':
      case 'f':
        this.stats.values++;
        this.stats.nodes++;
        return this.parseBoolean();
      case 'n':
        this.stats.values++;
        this.stats.nodes++;
        return this.parseNull();
      default:
        if (c === '-' || (c >= '0' && c <= '9')) {
          this.stats.values++;
          this.stats.nodes++;
          return this.parseNumber();
        }
        if (c === '}' || c === ']') {
          this.fail(`Unexpected "${c}" — a value was expected here.`);
        }
        if (c === "'") {
          this.fail('Strings must use double quotes (") in JSON, not single quotes.');
        }
        this.fail(`Unexpected token "${c}" — a value was expected here.`);
        return undefined; // unreachable
    }
  }

  parseObject(depth) {
    this.stats.objects++;
    this.stats.nodes++;
    this.i++; // consume '{'
    const obj = {};
    const seen = new Set();
    this.skipWhitespace();
    if (this.text[this.i] === '}') {
      this.i++;
      return obj;
    }
    for (;;) {
      this.skipWhitespace();
      if (this.i >= this.len) this.fail('Unexpected end of input: expected a property name.');
      if (this.text[this.i] !== '"') {
        this.fail('Expected a property name enclosed in double quotes.');
      }
      const keyPos = this.i;
      const key = this.parseString();
      this.stats.keys++;
      if (seen.has(key)) {
        const { line, column } = this.locate(keyPos);
        this.warnings.push({
          type: 'duplicate-key',
          message: `Duplicate key "${key}" — the last occurrence wins.`,
          key,
          line,
          column,
        });
      }
      seen.add(key);
      this.skipWhitespace();
      if (this.text[this.i] !== ':') this.fail('Expected ":" after the property name.');
      this.i++; // consume ':'
      obj[key] = this.parseValue(depth + 1);
      this.skipWhitespace();
      const next = this.text[this.i];
      if (next === ',') {
        this.i++;
        this.skipWhitespace();
        if (this.text[this.i] === '}') this.fail('Trailing comma is not allowed in an object.');
        continue;
      }
      if (next === '}') {
        this.i++;
        return obj;
      }
      if (this.i >= this.len) this.fail('Unexpected end of input: expected "," or "}".');
      this.fail('Expected "," or "}" after a property value.');
    }
  }

  parseArray(depth) {
    this.stats.arrays++;
    this.stats.nodes++;
    this.i++; // consume '['
    const arr = [];
    this.skipWhitespace();
    if (this.text[this.i] === ']') {
      this.i++;
      return arr;
    }
    for (;;) {
      arr.push(this.parseValue(depth + 1));
      this.skipWhitespace();
      const next = this.text[this.i];
      if (next === ',') {
        this.i++;
        this.skipWhitespace();
        if (this.text[this.i] === ']') this.fail('Trailing comma is not allowed in an array.');
        continue;
      }
      if (next === ']') {
        this.i++;
        return arr;
      }
      if (this.i >= this.len) this.fail('Unexpected end of input: expected "," or "]".');
      this.fail('Expected "," or "]" after an array element.');
    }
  }

  parseString() {
    const start = this.i;
    this.i++; // consume opening quote
    let result = '';
    while (this.i < this.len) {
      const c = this.text[this.i];
      if (c === '"') {
        this.i++;
        return result;
      }
      if (c === '\\') {
        this.i++;
        const esc = this.text[this.i];
        if (esc === undefined) this.fail('Unexpected end of input inside a string escape.');
        if (esc === 'u') {
          const hex = this.text.slice(this.i + 1, this.i + 5);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
            this.fail('Invalid \\u escape: expected four hexadecimal digits.', this.i - 1);
          }
          result += String.fromCharCode(parseInt(hex, 16));
          this.i += 5;
          continue;
        }
        if (!(esc in ESCAPES)) {
          this.fail(`Invalid escape sequence "\\${esc}".`, this.i - 1);
        }
        result += ESCAPES[esc];
        this.i++;
        continue;
      }
      if (c < ' ') {
        this.fail('Unescaped control character in string — it must be escaped (e.g. \\n).');
      }
      result += c;
      this.i++;
    }
    this.fail('Unterminated string — the closing double quote is missing.', start);
    return ''; // unreachable
  }

  parseNumber() {
    const start = this.i;
    const re = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
    re.lastIndex = this.i;
    const m = re.exec(this.text);
    if (!m || m.index !== this.i || m[0].length === 0) {
      this.fail('Invalid number.', start);
    }
    this.i += m[0].length;
    // Catch a leading-zero / malformed remainder like "01" or "1." that the
    // regex stopped short on but is clearly part of a broken number token.
    const after = this.text[this.i];
    if (after !== undefined && /[0-9a-zA-Z._]/.test(after)) {
      this.fail(`Invalid number near "${this.text.slice(start, this.i + 1)}".`, start);
    }
    return Number(m[0]);
  }

  parseBoolean() {
    if (this.text.startsWith('true', this.i)) {
      this.i += 4;
      return true;
    }
    if (this.text.startsWith('false', this.i)) {
      this.i += 5;
      return false;
    }
    this.fail('Invalid literal — did you mean "true" or "false"?');
    return false; // unreachable
  }

  parseNull() {
    if (this.text.startsWith('null', this.i)) {
      this.i += 4;
      return null;
    }
    this.fail('Invalid literal — did you mean "null"?');
    return null; // unreachable
  }
}

function byteLength(text) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text).length;
  // Fallback approximation.
  return unescape(encodeURIComponent(text)).length;
}

/**
 * Validate JSON and return rich diagnostics.
 * @returns {{valid:boolean, value?:any, error:object|null, warnings:object[], stats:object|null}}
 */
export function validateJson(text) {
  const out = { valid: false, value: undefined, error: null, warnings: [], stats: null };
  if (text == null || text.trim() === '') {
    out.error = { message: 'Input is empty — paste or type some JSON to validate.', line: 1, column: 1, position: 0 };
    return out;
  }
  try {
    const { value, warnings, stats } = new DiagnosticParser(text).parse();
    out.valid = true;
    out.value = value;
    out.warnings = warnings;
    out.stats = { ...stats, bytes: byteLength(text), lines: text.split('\n').length };
  } catch (err) {
    if (err instanceof JsonSyntaxError) {
      out.error = {
        message: err.message,
        line: err.line,
        column: err.column,
        position: err.position,
        snippet: err.snippet,
      };
    } else {
      out.error = { message: err.message || 'Invalid JSON.', line: 1, column: 1, position: 0 };
    }
  }
  return out;
}

/** Pretty-print JSON. `indent` may be a number of spaces or the string "tab". */
export function formatJson(text, indent = 2) {
  const value = JSON.parse(text);
  const space = indent === 'tab' ? '\t' : Number(indent) || 2;
  return JSON.stringify(value, null, space);
}

/** Collapse JSON to a single line. */
export function minifyJson(text) {
  return JSON.stringify(JSON.parse(text));
}

/** Human-readable byte size. */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
