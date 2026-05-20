// Structural, recursive JSON diff that produces aligned side-by-side rows,
// GitHub-style. Objects are matched by key, arrays are matched by index, and
// nesting is followed to any depth. Pure / DOM-free.

const INDENT_UNIT = '  ';

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
function isPrimitive(v) {
  return v === null || (typeof v !== 'object');
}
function indent(depth) {
  return INDENT_UNIT.repeat(depth);
}
function quoteKey(key) {
  return `${JSON.stringify(key)}: `;
}
function render(value) {
  return JSON.stringify(value);
}
function primitivesEqual(a, b) {
  // Both are primitives here. Strict equality is correct for JSON scalars
  // (string/number/boolean/null); JSON has no NaN/-0 concerns.
  return a === b;
}

/**
 * @returns {{rows: Array, summary: {added:number, removed:number, changed:number, equal:number}, identical: boolean}}
 * Each row: { type:'equal'|'changed'|'added'|'removed', l:{text}|null, r:{text}|null, leftNo:number|null, rightNo:number|null }
 */
export function buildSideBySideDiff(left, right, options = {}) {
  const sortKeys = !!options.ignoreKeyOrder;
  const rows = [];
  const summary = { added: 0, removed: 0, changed: 0, equal: 0 };

  function keysOf(obj) {
    const ks = Object.keys(obj);
    return sortKeys ? ks.slice().sort() : ks;
  }

  function addRow(type, lText, rText) {
    rows.push({ type, l: lText == null ? null : { text: lText }, r: rText == null ? null : { text: rText } });
    summary[type] = (summary[type] || 0) + 1;
  }

  // Emit a value that exists on only one side (wholly added or removed).
  function emitSingle(side, value, depth, keyPrefix, comma) {
    const pre = keyPrefix != null ? quoteKey(keyPrefix) : '';
    const tail = comma ? ',' : '';
    const put = (content) => {
      const text = indent(depth) + content;
      if (side === 'left') addRow('removed', text, null);
      else addRow('added', null, text);
    };
    if (isPlainObject(value)) {
      const ks = keysOf(value);
      if (ks.length === 0) {
        put(pre + '{}' + tail);
        return;
      }
      put(pre + '{');
      ks.forEach((k, i) => emitSingle(side, value[k], depth + 1, k, i < ks.length - 1));
      put('}' + tail);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        put(pre + '[]' + tail);
        return;
      }
      put(pre + '[');
      value.forEach((v, i) => emitSingle(side, v, depth + 1, null, i < value.length - 1));
      put(']' + tail);
    } else {
      put(pre + render(value) + tail);
    }
  }

  // Backward pass to decide which entries still need a trailing comma per side.
  function commaFlags(items) {
    const n = items.length;
    const leftComma = new Array(n).fill(false);
    const rightComma = new Array(n).fill(false);
    let laterLeft = false;
    let laterRight = false;
    for (let i = n - 1; i >= 0; i--) {
      leftComma[i] = laterLeft;
      rightComma[i] = laterRight;
      if (items[i].inL) laterLeft = true;
      if (items[i].inR) laterRight = true;
    }
    return { leftComma, rightComma };
  }

  function diffObject(l, r, depth) {
    const lKeys = keysOf(l);
    const rKeys = keysOf(r);
    const rSet = new Set(rKeys);
    const lSet = new Set(lKeys);
    const items = [];
    lKeys.forEach((k) => items.push({ key: k, inL: true, inR: rSet.has(k) }));
    rKeys.forEach((k) => {
      if (!lSet.has(k)) items.push({ key: k, inL: false, inR: true });
    });
    const { leftComma, rightComma } = commaFlags(items);
    items.forEach((it, i) => {
      if (it.inL && it.inR) diffValue(l[it.key], r[it.key], depth, it.key, leftComma[i], rightComma[i]);
      else if (it.inL) emitSingle('left', l[it.key], depth, it.key, leftComma[i]);
      else emitSingle('right', r[it.key], depth, it.key, rightComma[i]);
    });
  }

  function diffArray(l, r, depth) {
    const max = Math.max(l.length, r.length);
    const items = [];
    for (let i = 0; i < max; i++) items.push({ idx: i, inL: i < l.length, inR: i < r.length });
    const { leftComma, rightComma } = commaFlags(items);
    items.forEach((it, i) => {
      if (it.inL && it.inR) diffValue(l[it.idx], r[it.idx], depth, null, leftComma[i], rightComma[i]);
      else if (it.inL) emitSingle('left', l[it.idx], depth, null, leftComma[i]);
      else emitSingle('right', r[it.idx], depth, null, rightComma[i]);
    });
  }

  function diffValue(l, r, depth, keyPrefix, leftComma, rightComma) {
    const pre = keyPrefix != null ? quoteKey(keyPrefix) : '';
    const lComma = leftComma ? ',' : '';
    const rComma = rightComma ? ',' : '';

    if (isPlainObject(l) && isPlainObject(r)) {
      const lEmpty = Object.keys(l).length === 0;
      const rEmpty = Object.keys(r).length === 0;
      if (lEmpty && rEmpty) {
        addRow('equal', indent(depth) + pre + '{}' + lComma, indent(depth) + pre + '{}' + rComma);
        return;
      }
      addRow('equal', indent(depth) + pre + '{', indent(depth) + pre + '{');
      diffObject(l, r, depth + 1);
      addRow('equal', indent(depth) + '}' + lComma, indent(depth) + '}' + rComma);
      return;
    }

    if (Array.isArray(l) && Array.isArray(r)) {
      if (l.length === 0 && r.length === 0) {
        addRow('equal', indent(depth) + pre + '[]' + lComma, indent(depth) + pre + '[]' + rComma);
        return;
      }
      addRow('equal', indent(depth) + pre + '[', indent(depth) + pre + '[');
      diffArray(l, r, depth + 1);
      addRow('equal', indent(depth) + ']' + lComma, indent(depth) + ']' + rComma);
      return;
    }

    if (isPrimitive(l) && isPrimitive(r)) {
      if (primitivesEqual(l, r)) {
        addRow('equal', indent(depth) + pre + render(l) + lComma, indent(depth) + pre + render(r) + rComma);
      } else {
        addRow('changed', indent(depth) + pre + render(l) + lComma, indent(depth) + pre + render(r) + rComma);
      }
      return;
    }

    // Type mismatch (e.g. object vs array, array vs primitive): show the left
    // value as removed and the right value as added, keeping the key prefix.
    emitSingle('left', l, depth, keyPrefix, leftComma);
    emitSingle('right', r, depth, keyPrefix, rightComma);
  }

  diffValue(left, right, 0, null, false, false);

  // Assign per-side line numbers (skipping filler cells), like a real diff.
  let ln = 0;
  let rn = 0;
  for (const row of rows) {
    row.leftNo = row.l ? ++ln : null;
    row.rightNo = row.r ? ++rn : null;
  }

  const identical = summary.added === 0 && summary.removed === 0 && summary.changed === 0;
  return { rows, summary, identical };
}
