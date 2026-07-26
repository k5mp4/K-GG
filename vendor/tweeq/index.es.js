var Ry = Object.defineProperty;
var qd = (e) => {
  throw TypeError(e);
};
var Oy = (e, t, r) => t in e ? Ry(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r;
var Oo = (e, t, r) => Oy(e, typeof t != "symbol" ? t + "" : t, r), oc = (e, t, r) => t.has(e) || qd("Cannot " + r);
var ct = (e, t, r) => (oc(e, t, "read from private field"), r ? r.call(e) : t.get(e)), lr = (e, t, r) => t.has(e) ? qd("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), tr = (e, t, r, n) => (oc(e, t, "write to private field"), n ? n.call(e, r) : t.set(e, r), r), Sr = (e, t, r) => (oc(e, t, "access private method"), r);
var wi = (e, t, r, n) => ({
  set _(o) {
    tr(e, t, o, r);
  },
  get _() {
    return ct(e, t, n);
  }
});
import { jsx as j, jsxs as vt, Fragment as An } from "react/jsx-runtime";
import V0, { useSyncExternalStore as Py, useCallback as Jr, useRef as me, useEffect as Vt, useLayoutEffect as Yr, useState as lt, useMemo as Yt, useContext as i2, createContext as s2, forwardRef as Yo, useImperativeHandle as Ha, useId as Ns, isValidElement as Gc, cloneElement as Iy, Children as By, Fragment as Ny } from "react";
import { createPortal as Gy } from "react-dom";
const qy = 14, yn = 7, bn = 2;
function $y(e, t, { arrowSide: r = null, arrowOffset: n = 0, radius: o = 13 } = {}) {
  const a = (B) => r === B ? yn + bn : 0, i = e + a("left") + a("right"), s = t + a("top") + a("bottom"), l = `${n}px`, c = (() => {
    switch (r) {
      case "top":
        return `${l} ${bn}px`;
      case "bottom":
        return `${l} calc(100% - ${bn}px)`;
      case "left":
        return `${bn}px ${l}`;
      case "right":
        return `calc(100% - ${bn}px) ${l}`;
      default:
        return "50% 50%";
    }
  })(), u = {
    paddingTop: r === "top" ? `${yn + bn}px` : void 0,
    paddingRight: r === "right" ? `${yn + bn}px` : void 0,
    paddingBottom: r === "bottom" ? `${yn + bn}px` : void 0,
    paddingLeft: r === "left" ? `${yn + bn}px` : void 0
  };
  if (e === 0 || t === 0)
    return {
      path: "",
      layerWidth: i,
      layerHeight: s,
      transformOrigin: c,
      wrapperPadding: u
    };
  const f = Math.min(o, e / 2, t / 2), p = qy / 2, h = r === "left" ? yn + bn : 0, m = r === "top" ? yn + bn : 0, w = (B) => Math.max(h + f + p, Math.min(h + e - f - p, B)), A = (B) => Math.max(m + f + p, Math.min(m + t - f - p, B)), T = [`M ${h + f},${m}`];
  if (r === "top") {
    const B = w(h + n);
    T.push(`H ${B - p}`, `L ${B},${m - yn}`, `L ${B + p},${m}`);
  }
  if (T.push(`H ${h + e - f}`, `A ${f} ${f} 0 0 1 ${h + e},${m + f}`), r === "right") {
    const B = A(m + n);
    T.push(`V ${B - p}`, `L ${h + e + yn},${B}`, `L ${h + e},${B + p}`);
  }
  if (T.push(`V ${m + t - f}`, `A ${f} ${f} 0 0 1 ${h + e - f},${m + t}`), r === "bottom") {
    const B = w(h + n);
    T.push(`H ${B + p}`, `L ${B},${m + t + yn}`, `L ${B - p},${m + t}`);
  }
  if (T.push(`H ${h + f}`, `A ${f} ${f} 0 0 1 ${h},${m + t - f}`), r === "left") {
    const B = A(m + n);
    T.push(`V ${B + p}`, `L ${h - yn},${B}`, `L ${h},${B - p}`);
  }
  return T.push(`V ${m + f}`, `A ${f} ${f} 0 0 1 ${h + f},${m}`, "Z"), {
    path: T.join(" "),
    layerWidth: i,
    layerHeight: s,
    transformOrigin: c,
    wrapperPadding: u
  };
}
const { min: zy, max: jy } = Math, qo = (e, t = 0, r = 1) => zy(jy(t, e), r), bu = (e) => {
  e._clipped = !1, e._unclipped = e.slice(0);
  for (let t = 0; t <= 3; t++)
    t < 3 ? ((e[t] < 0 || e[t] > 255) && (e._clipped = !0), e[t] = qo(e[t], 0, 255)) : t === 3 && (e[t] = qo(e[t], 0, 1));
  return e;
}, l2 = {};
for (let e of [
  "Boolean",
  "Number",
  "String",
  "Function",
  "Array",
  "Date",
  "RegExp",
  "Undefined",
  "Null"
])
  l2[`[object ${e}]`] = e.toLowerCase();
function jt(e) {
  return l2[Object.prototype.toString.call(e)] || "object";
}
const Gt = (e, t = null) => e.length >= 3 ? Array.prototype.slice.call(e) : jt(e[0]) == "object" && t ? t.split("").filter((r) => e[0][r] !== void 0).map((r) => e[0][r]) : e[0].slice(0), Ua = (e) => {
  if (e.length < 2) return null;
  const t = e.length - 1;
  return jt(e[t]) == "string" ? e[t].toLowerCase() : null;
}, { PI: Gs, min: c2, max: u2 } = Math, un = (e) => Math.round(e * 100) / 100, qc = (e) => Math.round(e * 100) / 100, Un = Gs * 2, ac = Gs / 3, Hy = Gs / 180, Uy = 180 / Gs;
function f2(e) {
  return [...e.slice(0, 3).reverse(), ...e.slice(3)];
}
const Nt = {
  format: {},
  autodetect: []
};
let Ue = class {
  constructor(...t) {
    const r = this;
    if (jt(t[0]) === "object" && t[0].constructor && t[0].constructor === this.constructor)
      return t[0];
    let n = Ua(t), o = !1;
    if (!n) {
      o = !0, Nt.sorted || (Nt.autodetect = Nt.autodetect.sort((a, i) => i.p - a.p), Nt.sorted = !0);
      for (let a of Nt.autodetect)
        if (n = a.test(...t), n) break;
    }
    if (Nt.format[n]) {
      const a = Nt.format[n].apply(
        null,
        o ? t : t.slice(0, -1)
      );
      r._rgb = bu(a);
    } else
      throw new Error("unknown format: " + t);
    r._rgb.length === 3 && r._rgb.push(1);
  }
  toString() {
    return jt(this.hex) == "function" ? this.hex() : `[${this._rgb.join(",")}]`;
  }
};
const Vy = "3.2.0", Bt = (...e) => new Ue(...e);
Bt.version = Vy;
const Ra = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkgrey: "#a9a9a9",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  grey: "#808080",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  laserlemon: "#ffff54",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrod: "#fafad2",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#d3d3d3",
  lightgreen: "#90ee90",
  lightgrey: "#d3d3d3",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  maroon2: "#7f0000",
  maroon3: "#b03060",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  purple2: "#7f007f",
  purple3: "#a020f0",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32"
}, Wy = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, Xy = /^#?([A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/, d2 = (e) => {
  if (e.match(Wy)) {
    (e.length === 4 || e.length === 7) && (e = e.substr(1)), e.length === 3 && (e = e.split(""), e = e[0] + e[0] + e[1] + e[1] + e[2] + e[2]);
    const t = parseInt(e, 16), r = t >> 16, n = t >> 8 & 255, o = t & 255;
    return [r, n, o, 1];
  }
  if (e.match(Xy)) {
    (e.length === 5 || e.length === 9) && (e = e.substr(1)), e.length === 4 && (e = e.split(""), e = e[0] + e[0] + e[1] + e[1] + e[2] + e[2] + e[3] + e[3]);
    const t = parseInt(e, 16), r = t >> 24 & 255, n = t >> 16 & 255, o = t >> 8 & 255, a = Math.round((t & 255) / 255 * 100) / 100;
    return [r, n, o, a];
  }
  throw new Error(`unknown hex color: ${e}`);
}, { round: W0 } = Math, p2 = (...e) => {
  let [t, r, n, o] = Gt(e, "rgba"), a = Ua(e) || "auto";
  o === void 0 && (o = 1), a === "auto" && (a = o < 1 ? "rgba" : "rgb"), t = W0(t), r = W0(r), n = W0(n);
  let s = "000000" + (t << 16 | r << 8 | n).toString(16);
  s = s.substr(s.length - 6);
  let l = "0" + W0(o * 255).toString(16);
  switch (l = l.substr(l.length - 2), a.toLowerCase()) {
    case "rgba":
      return `#${s}${l}`;
    case "argb":
      return `#${l}${s}`;
    default:
      return `#${s}`;
  }
};
Ue.prototype.name = function() {
  const e = p2(this._rgb, "rgb");
  for (let t of Object.keys(Ra))
    if (Ra[t] === e) return t.toLowerCase();
  return e;
};
Nt.format.named = (e) => {
  if (e = e.toLowerCase(), Ra[e]) return d2(Ra[e]);
  throw new Error("unknown color name: " + e);
};
Nt.autodetect.push({
  p: 5,
  test: (e, ...t) => {
    if (!t.length && jt(e) === "string" && Ra[e.toLowerCase()])
      return "named";
  }
});
Ue.prototype.alpha = function(e, t = !1) {
  return e !== void 0 && jt(e) === "number" ? t ? (this._rgb[3] = e, this) : new Ue([this._rgb[0], this._rgb[1], this._rgb[2], e], "rgb") : this._rgb[3];
};
Ue.prototype.clipped = function() {
  return this._rgb._clipped || !1;
};
const Ln = {
  // Corresponds roughly to RGB brighter/darker
  Kn: 18,
  // D65 standard referent
  labWhitePoint: "d65",
  Xn: 0.95047,
  Yn: 1,
  Zn: 1.08883,
  kE: 216 / 24389,
  kKE: 8,
  kK: 24389 / 27,
  RefWhiteRGB: {
    // sRGB
    X: 0.95047,
    Y: 1,
    Z: 1.08883
  },
  MtxRGB2XYZ: {
    m00: 0.4124564390896922,
    m01: 0.21267285140562253,
    m02: 0.0193338955823293,
    m10: 0.357576077643909,
    m11: 0.715152155287818,
    m12: 0.11919202588130297,
    m20: 0.18043748326639894,
    m21: 0.07217499330655958,
    m22: 0.9503040785363679
  },
  MtxXYZ2RGB: {
    m00: 3.2404541621141045,
    m01: -0.9692660305051868,
    m02: 0.055643430959114726,
    m10: -1.5371385127977166,
    m11: 1.8760108454466942,
    m12: -0.2040259135167538,
    m20: -0.498531409556016,
    m21: 0.041556017530349834,
    m22: 1.0572251882231791
  },
  // used in rgb2xyz
  As: 0.9414285350000001,
  Bs: 1.040417467,
  Cs: 1.089532651,
  MtxAdaptMa: {
    m00: 0.8951,
    m01: -0.7502,
    m02: 0.0389,
    m10: 0.2664,
    m11: 1.7135,
    m12: -0.0685,
    m20: -0.1614,
    m21: 0.0367,
    m22: 1.0296
  },
  MtxAdaptMaI: {
    m00: 0.9869929054667123,
    m01: 0.43230526972339456,
    m02: -0.008528664575177328,
    m10: -0.14705425642099013,
    m11: 0.5183602715367776,
    m12: 0.04004282165408487,
    m20: 0.15996265166373125,
    m21: 0.0492912282128556,
    m22: 0.9684866957875502
  }
}, Yy = /* @__PURE__ */ new Map([
  // ASTM E308-01
  ["a", [1.0985, 0.35585]],
  // Wyszecki & Stiles, p. 769
  ["b", [1.0985, 0.35585]],
  // C ASTM E308-01
  ["c", [0.98074, 1.18232]],
  // D50 (ASTM E308-01)
  ["d50", [0.96422, 0.82521]],
  // D55 (ASTM E308-01)
  ["d55", [0.95682, 0.92149]],
  // D65 (ASTM E308-01)
  ["d65", [0.95047, 1.08883]],
  // E (ASTM E308-01)
  ["e", [1, 1, 1]],
  // F2 (ASTM E308-01)
  ["f2", [0.99186, 0.67393]],
  // F7 (ASTM E308-01)
  ["f7", [0.95041, 1.08747]],
  // F11 (ASTM E308-01)
  ["f11", [1.00962, 0.6435]],
  ["icc", [0.96422, 0.82521]]
]);
function Wn(e) {
  const t = Yy.get(String(e).toLowerCase());
  if (!t)
    throw new Error("unknown Lab illuminant " + e);
  Ln.labWhitePoint = e, Ln.Xn = t[0], Ln.Zn = t[1];
}
function Bi() {
  return Ln.labWhitePoint;
}
const gu = (...e) => {
  e = Gt(e, "lab");
  const [t, r, n] = e, [o, a, i] = Ky(t, r, n), [s, l, c] = h2(o, a, i);
  return [s, l, c, e.length > 3 ? e[3] : 1];
}, Ky = (e, t, r) => {
  const { kE: n, kK: o, kKE: a, Xn: i, Yn: s, Zn: l } = Ln, c = (e + 16) / 116, u = 2e-3 * t + c, f = c - 5e-3 * r, p = u * u * u, h = f * f * f, m = p > n ? p : (116 * u - 16) / o, w = e > a ? Math.pow((e + 16) / 116, 3) : e / o, A = h > n ? h : (116 * f - 16) / o, T = m * i, B = w * s, N = A * l;
  return [T, B, N];
}, ic = (e) => {
  const t = Math.sign(e);
  return e = Math.abs(e), (e <= 31308e-7 ? e * 12.92 : 1.055 * Math.pow(e, 1 / 2.4) - 0.055) * t;
}, h2 = (e, t, r) => {
  const { MtxAdaptMa: n, MtxAdaptMaI: o, MtxXYZ2RGB: a, RefWhiteRGB: i, Xn: s, Yn: l, Zn: c } = Ln, u = s * n.m00 + l * n.m10 + c * n.m20, f = s * n.m01 + l * n.m11 + c * n.m21, p = s * n.m02 + l * n.m12 + c * n.m22, h = i.X * n.m00 + i.Y * n.m10 + i.Z * n.m20, m = i.X * n.m01 + i.Y * n.m11 + i.Z * n.m21, w = i.X * n.m02 + i.Y * n.m12 + i.Z * n.m22, A = (e * n.m00 + t * n.m10 + r * n.m20) * (h / u), T = (e * n.m01 + t * n.m11 + r * n.m21) * (m / f), B = (e * n.m02 + t * n.m12 + r * n.m22) * (w / p), N = A * o.m00 + T * o.m10 + B * o.m20, Q = A * o.m01 + T * o.m11 + B * o.m21, O = A * o.m02 + T * o.m12 + B * o.m22, M = ic(
    N * a.m00 + Q * a.m10 + O * a.m20
  ), X = ic(
    N * a.m01 + Q * a.m11 + O * a.m21
  ), G = ic(
    N * a.m02 + Q * a.m12 + O * a.m22
  );
  return [M * 255, X * 255, G * 255];
}, Au = (...e) => {
  const [t, r, n, ...o] = Gt(e, "rgb"), [a, i, s] = m2(t, r, n), [l, c, u] = Zy(a, i, s);
  return [l, c, u, ...o.length > 0 && o[0] < 1 ? [o[0]] : []];
};
function Zy(e, t, r) {
  const { Xn: n, Yn: o, Zn: a, kE: i, kK: s } = Ln, l = e / n, c = t / o, u = r / a, f = l > i ? Math.pow(l, 1 / 3) : (s * l + 16) / 116, p = c > i ? Math.pow(c, 1 / 3) : (s * c + 16) / 116, h = u > i ? Math.pow(u, 1 / 3) : (s * u + 16) / 116;
  return [116 * p - 16, 500 * (f - p), 200 * (p - h)];
}
function sc(e) {
  const t = Math.sign(e);
  return e = Math.abs(e), (e <= 0.04045 ? e / 12.92 : Math.pow((e + 0.055) / 1.055, 2.4)) * t;
}
const m2 = (e, t, r) => {
  e = sc(e / 255), t = sc(t / 255), r = sc(r / 255);
  const { MtxRGB2XYZ: n, MtxAdaptMa: o, MtxAdaptMaI: a, Xn: i, Yn: s, Zn: l, As: c, Bs: u, Cs: f } = Ln;
  let p = e * n.m00 + t * n.m10 + r * n.m20, h = e * n.m01 + t * n.m11 + r * n.m21, m = e * n.m02 + t * n.m12 + r * n.m22;
  const w = i * o.m00 + s * o.m10 + l * o.m20, A = i * o.m01 + s * o.m11 + l * o.m21, T = i * o.m02 + s * o.m12 + l * o.m22;
  let B = p * o.m00 + h * o.m10 + m * o.m20, N = p * o.m01 + h * o.m11 + m * o.m21, Q = p * o.m02 + h * o.m12 + m * o.m22;
  return B *= w / c, N *= A / u, Q *= T / f, p = B * a.m00 + N * a.m10 + Q * a.m20, h = B * a.m01 + N * a.m11 + Q * a.m21, m = B * a.m02 + N * a.m12 + Q * a.m22, [p, h, m];
};
Ue.prototype.lab = function() {
  return Au(this._rgb);
};
const Qy = (...e) => new Ue(...e, "lab");
Object.assign(Bt, { lab: Qy, getLabWhitePoint: Bi, setLabWhitePoint: Wn });
Nt.format.lab = gu;
Nt.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Gt(e, "lab"), jt(e) === "array" && e.length === 3)
      return "lab";
  }
});
Ue.prototype.darken = function(e = 1) {
  const t = this, r = t.lab();
  return r[0] -= Ln.Kn * e, new Ue(r, "lab").alpha(t.alpha(), !0);
};
Ue.prototype.brighten = function(e = 1) {
  return this.darken(-e);
};
Ue.prototype.darker = Ue.prototype.darken;
Ue.prototype.brighter = Ue.prototype.brighten;
Ue.prototype.get = function(e) {
  const [t, r] = e.split("."), n = this[t]();
  if (r) {
    const o = t.indexOf(r) - (t.substr(0, 2) === "ok" ? 2 : 0);
    if (o > -1) return n[o];
    throw new Error(`unknown channel ${r} in mode ${t}`);
  } else
    return n;
};
const { pow: Jy } = Math, eb = 1e-7, tb = 20;
Ue.prototype.luminance = function(e, t = "rgb") {
  if (e !== void 0 && jt(e) === "number") {
    if (e === 0)
      return new Ue([0, 0, 0, this._rgb[3]], "rgb");
    if (e === 1)
      return new Ue([255, 255, 255, this._rgb[3]], "rgb");
    let r = this.luminance(), n = tb;
    const o = (i, s) => {
      const l = i.interpolate(s, 0.5, t), c = l.luminance();
      return Math.abs(e - c) < eb || !n-- ? l : c > e ? o(i, l) : o(l, s);
    }, a = (r > e ? o(new Ue([0, 0, 0]), this) : o(this, new Ue([255, 255, 255]))).rgb();
    return new Ue([...a, this._rgb[3]]);
  }
  return rb(...this._rgb.slice(0, 3));
};
const rb = (e, t, r) => (e = lc(e), t = lc(t), r = lc(r), 0.2126 * e + 0.7152 * t + 0.0722 * r), lc = (e) => (e /= 255, e <= 0.03928 ? e / 12.92 : Jy((e + 0.055) / 1.055, 2.4)), zr = {}, Oa = (e, t, r = 0.5, ...n) => {
  let o = n[0] || "lrgb";
  if (!zr[o] && !n.length && (o = Object.keys(zr)[0]), !zr[o])
    throw new Error(`interpolation mode ${o} is not defined`);
  return jt(e) !== "object" && (e = new Ue(e)), jt(t) !== "object" && (t = new Ue(t)), zr[o](e, t, r).alpha(
    e.alpha() + r * (t.alpha() - e.alpha())
  );
};
Ue.prototype.mix = Ue.prototype.interpolate = function(e, t = 0.5, ...r) {
  return Oa(this, e, t, ...r);
};
Ue.prototype.premultiply = function(e = !1) {
  const t = this._rgb, r = t[3];
  return e ? (this._rgb = [t[0] * r, t[1] * r, t[2] * r, r], this) : new Ue([t[0] * r, t[1] * r, t[2] * r, r], "rgb");
};
const { sin: nb, cos: ob } = Math, y2 = (...e) => {
  let [t, r, n] = Gt(e, "lch");
  return isNaN(n) && (n = 0), n = n * Hy, [t, ob(n) * r, nb(n) * r];
}, vu = (...e) => {
  e = Gt(e, "lch");
  const [t, r, n] = e, [o, a, i] = y2(t, r, n), [s, l, c] = gu(o, a, i);
  return [s, l, c, e.length > 3 ? e[3] : 1];
}, ab = (...e) => {
  const t = f2(Gt(e, "hcl"));
  return vu(...t);
}, { sqrt: ib, atan2: sb, round: lb } = Math, b2 = (...e) => {
  const [t, r, n] = Gt(e, "lab"), o = ib(r * r + n * n);
  let a = (sb(n, r) * Uy + 360) % 360;
  return lb(o * 1e4) === 0 && (a = Number.NaN), [t, o, a];
}, wu = (...e) => {
  const [t, r, n, ...o] = Gt(e, "rgb"), [a, i, s] = Au(t, r, n), [l, c, u] = b2(a, i, s);
  return [l, c, u, ...o.length > 0 && o[0] < 1 ? [o[0]] : []];
};
Ue.prototype.lch = function() {
  return wu(this._rgb);
};
Ue.prototype.hcl = function() {
  return f2(wu(this._rgb));
};
const cb = (...e) => new Ue(...e, "lch"), ub = (...e) => new Ue(...e, "hcl");
Object.assign(Bt, { lch: cb, hcl: ub });
Nt.format.lch = vu;
Nt.format.hcl = ab;
["lch", "hcl"].forEach(
  (e) => Nt.autodetect.push({
    p: 2,
    test: (...t) => {
      if (t = Gt(t, e), jt(t) === "array" && t.length === 3)
        return e;
    }
  })
);
Ue.prototype.saturate = function(e = 1) {
  const t = this, r = t.lch();
  return r[1] += Ln.Kn * e, r[1] < 0 && (r[1] = 0), new Ue(r, "lch").alpha(t.alpha(), !0);
};
Ue.prototype.desaturate = function(e = 1) {
  return this.saturate(-e);
};
Ue.prototype.set = function(e, t, r = !1) {
  const [n, o] = e.split("."), a = this[n]();
  if (o) {
    const i = n.indexOf(o) - (n.substr(0, 2) === "ok" ? 2 : 0);
    if (i > -1) {
      if (jt(t) == "string")
        switch (t.charAt(0)) {
          case "+":
            a[i] += +t;
            break;
          case "-":
            a[i] += +t;
            break;
          case "*":
            a[i] *= +t.substr(1);
            break;
          case "/":
            a[i] /= +t.substr(1);
            break;
          default:
            a[i] = +t;
        }
      else if (jt(t) === "number")
        a[i] = t;
      else
        throw new Error("unsupported value for Color.set");
      const s = new Ue(a, n);
      return r ? (this._rgb = s._rgb, this) : s;
    }
    throw new Error(`unknown channel ${o} in mode ${n}`);
  } else
    return a;
};
Ue.prototype.tint = function(e = 0.5, ...t) {
  return Oa(this, "white", e, ...t);
};
Ue.prototype.shade = function(e = 0.5, ...t) {
  return Oa(this, "black", e, ...t);
};
const fb = (e, t, r) => {
  const n = e._rgb, o = t._rgb;
  return new Ue(
    n[0] + r * (o[0] - n[0]),
    n[1] + r * (o[1] - n[1]),
    n[2] + r * (o[2] - n[2]),
    "rgb"
  );
};
zr.rgb = fb;
const { sqrt: cc, pow: ya } = Math, db = (e, t, r) => {
  const [n, o, a] = e._rgb, [i, s, l] = t._rgb;
  return new Ue(
    cc(ya(n, 2) * (1 - r) + ya(i, 2) * r),
    cc(ya(o, 2) * (1 - r) + ya(s, 2) * r),
    cc(ya(a, 2) * (1 - r) + ya(l, 2) * r),
    "rgb"
  );
};
zr.lrgb = db;
const pb = (e, t, r) => {
  const n = e.lab(), o = t.lab();
  return new Ue(
    n[0] + r * (o[0] - n[0]),
    n[1] + r * (o[1] - n[1]),
    n[2] + r * (o[2] - n[2]),
    "lab"
  );
};
zr.lab = pb;
const Va = (e, t, r, n) => {
  let o, a;
  n === "hsl" ? (o = e.hsl(), a = t.hsl()) : n === "hsv" ? (o = e.hsv(), a = t.hsv()) : n === "hcg" ? (o = e.hcg(), a = t.hcg()) : n === "hsi" ? (o = e.hsi(), a = t.hsi()) : n === "lch" || n === "hcl" ? (n = "hcl", o = e.hcl(), a = t.hcl()) : n === "oklch" && (o = e.oklch().reverse(), a = t.oklch().reverse());
  let i, s, l, c, u, f;
  (n.substr(0, 1) === "h" || n === "oklch") && ([i, l, u] = o, [s, c, f] = a);
  let p, h, m, w;
  return !isNaN(i) && !isNaN(s) ? (s > i && s - i > 180 ? w = s - (i + 360) : s < i && i - s > 180 ? w = s + 360 - i : w = s - i, h = i + r * w) : isNaN(i) ? isNaN(s) ? h = Number.NaN : (h = s, (u == 1 || u == 0) && n != "hsv" && (p = c)) : (h = i, (f == 1 || f == 0) && n != "hsv" && (p = l)), p === void 0 && (p = l + r * (c - l)), m = u + r * (f - u), n === "oklch" ? new Ue([m, p, h], n) : new Ue([h, p, m], n);
}, g2 = (e, t, r) => Va(e, t, r, "lch");
zr.lch = g2;
zr.hcl = g2;
const hb = (e) => {
  if (jt(e) == "number" && e >= 0 && e <= 16777215) {
    const t = e >> 16, r = e >> 8 & 255, n = e & 255;
    return [t, r, n, 1];
  }
  throw new Error("unknown num color: " + e);
}, mb = (...e) => {
  const [t, r, n] = Gt(e, "rgb");
  return (t << 16) + (r << 8) + n;
};
Ue.prototype.num = function() {
  return mb(this._rgb);
};
const yb = (...e) => new Ue(...e, "num");
Object.assign(Bt, { num: yb });
Nt.format.num = hb;
Nt.autodetect.push({
  p: 5,
  test: (...e) => {
    if (e.length === 1 && jt(e[0]) === "number" && e[0] >= 0 && e[0] <= 16777215)
      return "num";
  }
});
const bb = (e, t, r) => {
  const n = e.num(), o = t.num();
  return new Ue(n + r * (o - n), "num");
};
zr.num = bb;
const { floor: gb } = Math, Ab = (...e) => {
  e = Gt(e, "hcg");
  let [t, r, n] = e, o, a, i;
  n = n * 255;
  const s = r * 255;
  if (r === 0)
    o = a = i = n;
  else {
    t === 360 && (t = 0), t > 360 && (t -= 360), t < 0 && (t += 360), t /= 60;
    const l = gb(t), c = t - l, u = n * (1 - r), f = u + s * (1 - c), p = u + s * c, h = u + s;
    switch (l) {
      case 0:
        [o, a, i] = [h, p, u];
        break;
      case 1:
        [o, a, i] = [f, h, u];
        break;
      case 2:
        [o, a, i] = [u, h, p];
        break;
      case 3:
        [o, a, i] = [u, f, h];
        break;
      case 4:
        [o, a, i] = [p, u, h];
        break;
      case 5:
        [o, a, i] = [h, u, f];
        break;
    }
  }
  return [o, a, i, e.length > 3 ? e[3] : 1];
}, vb = (...e) => {
  const [t, r, n] = Gt(e, "rgb"), o = c2(t, r, n), a = u2(t, r, n), i = a - o, s = i * 100 / 255, l = o / (255 - i) * 100;
  let c;
  return i === 0 ? c = Number.NaN : (t === a && (c = (r - n) / i), r === a && (c = 2 + (n - t) / i), n === a && (c = 4 + (t - r) / i), c *= 60, c < 0 && (c += 360)), [c, s, l];
};
Ue.prototype.hcg = function() {
  return vb(this._rgb);
};
const wb = (...e) => new Ue(...e, "hcg");
Bt.hcg = wb;
Nt.format.hcg = Ab;
Nt.autodetect.push({
  p: 1,
  test: (...e) => {
    if (e = Gt(e, "hcg"), jt(e) === "array" && e.length === 3)
      return "hcg";
  }
});
const xb = (e, t, r) => Va(e, t, r, "hcg");
zr.hcg = xb;
const { cos: ba } = Math, _b = (...e) => {
  e = Gt(e, "hsi");
  let [t, r, n] = e, o, a, i;
  return isNaN(t) && (t = 0), isNaN(r) && (r = 0), t > 360 && (t -= 360), t < 0 && (t += 360), t /= 360, t < 1 / 3 ? (i = (1 - r) / 3, o = (1 + r * ba(Un * t) / ba(ac - Un * t)) / 3, a = 1 - (i + o)) : t < 2 / 3 ? (t -= 1 / 3, o = (1 - r) / 3, a = (1 + r * ba(Un * t) / ba(ac - Un * t)) / 3, i = 1 - (o + a)) : (t -= 2 / 3, a = (1 - r) / 3, i = (1 + r * ba(Un * t) / ba(ac - Un * t)) / 3, o = 1 - (a + i)), o = qo(n * o * 3), a = qo(n * a * 3), i = qo(n * i * 3), [o * 255, a * 255, i * 255, e.length > 3 ? e[3] : 1];
}, { min: Eb, sqrt: Sb, acos: kb } = Math, Tb = (...e) => {
  let [t, r, n] = Gt(e, "rgb");
  t /= 255, r /= 255, n /= 255;
  let o;
  const a = Eb(t, r, n), i = (t + r + n) / 3, s = i > 0 ? 1 - a / i : 0;
  return s === 0 ? o = NaN : (o = (t - r + (t - n)) / 2, o /= Sb((t - r) * (t - r) + (t - n) * (r - n)), o = kb(o), n > r && (o = Un - o), o /= Un), [o * 360, s, i];
};
Ue.prototype.hsi = function() {
  return Tb(this._rgb);
};
const Db = (...e) => new Ue(...e, "hsi");
Bt.hsi = Db;
Nt.format.hsi = _b;
Nt.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Gt(e, "hsi"), jt(e) === "array" && e.length === 3)
      return "hsi";
  }
});
const Mb = (e, t, r) => Va(e, t, r, "hsi");
zr.hsi = Mb;
const $c = (...e) => {
  e = Gt(e, "hsl");
  const [t, r, n] = e;
  let o, a, i;
  if (r === 0)
    o = a = i = n * 255;
  else {
    const s = [0, 0, 0], l = [0, 0, 0], c = n < 0.5 ? n * (1 + r) : n + r - n * r, u = 2 * n - c, f = t / 360;
    s[0] = f + 1 / 3, s[1] = f, s[2] = f - 1 / 3;
    for (let p = 0; p < 3; p++)
      s[p] < 0 && (s[p] += 1), s[p] > 1 && (s[p] -= 1), 6 * s[p] < 1 ? l[p] = u + (c - u) * 6 * s[p] : 2 * s[p] < 1 ? l[p] = c : 3 * s[p] < 2 ? l[p] = u + (c - u) * (2 / 3 - s[p]) * 6 : l[p] = u;
    [o, a, i] = [l[0] * 255, l[1] * 255, l[2] * 255];
  }
  return e.length > 3 ? [o, a, i, e[3]] : [o, a, i, 1];
}, A2 = (...e) => {
  e = Gt(e, "rgba");
  let [t, r, n] = e;
  t /= 255, r /= 255, n /= 255;
  const o = c2(t, r, n), a = u2(t, r, n), i = (a + o) / 2;
  let s, l;
  return a === o ? (s = 0, l = Number.NaN) : s = i < 0.5 ? (a - o) / (a + o) : (a - o) / (2 - a - o), t == a ? l = (r - n) / (a - o) : r == a ? l = 2 + (n - t) / (a - o) : n == a && (l = 4 + (t - r) / (a - o)), l *= 60, l < 0 && (l += 360), e.length > 3 && e[3] !== void 0 ? [l, s, i, e[3]] : [l, s, i];
};
Ue.prototype.hsl = function() {
  return A2(this._rgb);
};
const Cb = (...e) => new Ue(...e, "hsl");
Bt.hsl = Cb;
Nt.format.hsl = $c;
Nt.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Gt(e, "hsl"), jt(e) === "array" && e.length === 3)
      return "hsl";
  }
});
const Lb = (e, t, r) => Va(e, t, r, "hsl");
zr.hsl = Lb;
const { floor: Fb } = Math, Rb = (...e) => {
  e = Gt(e, "hsv");
  let [t, r, n] = e, o, a, i;
  if (n *= 255, r === 0)
    o = a = i = n;
  else {
    t === 360 && (t = 0), t > 360 && (t -= 360), t < 0 && (t += 360), t /= 60;
    const s = Fb(t), l = t - s, c = n * (1 - r), u = n * (1 - r * l), f = n * (1 - r * (1 - l));
    switch (s) {
      case 0:
        [o, a, i] = [n, f, c];
        break;
      case 1:
        [o, a, i] = [u, n, c];
        break;
      case 2:
        [o, a, i] = [c, n, f];
        break;
      case 3:
        [o, a, i] = [c, u, n];
        break;
      case 4:
        [o, a, i] = [f, c, n];
        break;
      case 5:
        [o, a, i] = [n, c, u];
        break;
    }
  }
  return [o, a, i, e.length > 3 ? e[3] : 1];
}, { min: Ob, max: Pb } = Math, Ib = (...e) => {
  e = Gt(e, "rgb");
  let [t, r, n] = e;
  const o = Ob(t, r, n), a = Pb(t, r, n), i = a - o;
  let s, l, c;
  return c = a / 255, a === 0 ? (s = Number.NaN, l = 0) : (l = i / a, t === a && (s = (r - n) / i), r === a && (s = 2 + (n - t) / i), n === a && (s = 4 + (t - r) / i), s *= 60, s < 0 && (s += 360)), [s, l, c];
};
Ue.prototype.hsv = function() {
  return Ib(this._rgb);
};
const Bb = (...e) => new Ue(...e, "hsv");
Bt.hsv = Bb;
Nt.format.hsv = Rb;
Nt.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Gt(e, "hsv"), jt(e) === "array" && e.length === 3)
      return "hsv";
  }
});
const Nb = (e, t, r) => Va(e, t, r, "hsv");
zr.hsv = Nb;
function vs(e, t) {
  let r = e.length;
  Array.isArray(e[0]) || (e = [e]), Array.isArray(t[0]) || (t = t.map((i) => [i]));
  let n = t[0].length, o = t[0].map((i, s) => t.map((l) => l[s])), a = e.map(
    (i) => o.map((s) => Array.isArray(i) ? i.reduce((l, c, u) => l + c * (s[u] || 0), 0) : s.reduce((l, c) => l + c * i, 0))
  );
  return r === 1 && (a = a[0]), n === 1 ? a.map((i) => i[0]) : a;
}
const xu = (...e) => {
  e = Gt(e, "lab");
  const [t, r, n, ...o] = e, [a, i, s] = Gb([t, r, n]), [l, c, u] = h2(a, i, s);
  return [l, c, u, ...o.length > 0 && o[0] < 1 ? [o[0]] : []];
};
function Gb(e) {
  var t = [
    [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
    [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
    [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816]
  ], r = [
    [1, 0.3963377773761749, 0.2158037573099136],
    [1, -0.1055613458156586, -0.0638541728258133],
    [1, -0.0894841775298119, -1.2914855480194092]
  ], n = vs(r, e);
  return vs(
    t,
    n.map((o) => o ** 3)
  );
}
const _u = (...e) => {
  const [t, r, n, ...o] = Gt(e, "rgb"), a = m2(t, r, n);
  return [...qb(a), ...o.length > 0 && o[0] < 1 ? [o[0]] : []];
};
function qb(e) {
  const t = [
    [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
    [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
    [0.0481771893596242, 0.2642395317527308, 0.6335478284694309]
  ], r = [
    [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
    [1.9779985324311684, -2.42859224204858, 0.450593709617411],
    [0.0259040424655478, 0.7827717124575296, -0.8086757549230774]
  ], n = vs(t, e);
  return vs(
    r,
    n.map((o) => Math.cbrt(o))
  );
}
Ue.prototype.oklab = function() {
  return _u(this._rgb);
};
const $b = (...e) => new Ue(...e, "oklab");
Object.assign(Bt, { oklab: $b });
Nt.format.oklab = xu;
Nt.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Gt(e, "oklab"), jt(e) === "array" && e.length === 3)
      return "oklab";
  }
});
const zb = (e, t, r) => {
  const n = e.oklab(), o = t.oklab();
  return new Ue(
    n[0] + r * (o[0] - n[0]),
    n[1] + r * (o[1] - n[1]),
    n[2] + r * (o[2] - n[2]),
    "oklab"
  );
};
zr.oklab = zb;
const jb = (e, t, r) => Va(e, t, r, "oklch");
zr.oklch = jb;
const { pow: uc, sqrt: fc, PI: dc, cos: $d, sin: zd, atan2: Hb } = Math, Ub = (e, t = "lrgb", r = null) => {
  const n = e.length;
  r || (r = Array.from(new Array(n)).map(() => 1));
  const o = n / r.reduce(function(f, p) {
    return f + p;
  });
  if (r.forEach((f, p) => {
    r[p] *= o;
  }), e = e.map((f) => new Ue(f)), t === "lrgb")
    return Vb(e, r);
  const a = e.shift(), i = a.get(t), s = [];
  let l = 0, c = 0;
  for (let f = 0; f < i.length; f++)
    if (i[f] = (i[f] || 0) * r[0], s.push(isNaN(i[f]) ? 0 : r[0]), t.charAt(f) === "h" && !isNaN(i[f])) {
      const p = i[f] / 180 * dc;
      l += $d(p) * r[0], c += zd(p) * r[0];
    }
  let u = a.alpha() * r[0];
  e.forEach((f, p) => {
    const h = f.get(t);
    u += f.alpha() * r[p + 1];
    for (let m = 0; m < i.length; m++)
      if (!isNaN(h[m]))
        if (s[m] += r[p + 1], t.charAt(m) === "h") {
          const w = h[m] / 180 * dc;
          l += $d(w) * r[p + 1], c += zd(w) * r[p + 1];
        } else
          i[m] += h[m] * r[p + 1];
  });
  for (let f = 0; f < i.length; f++)
    if (t.charAt(f) === "h") {
      let p = Hb(c / s[f], l / s[f]) / dc * 180;
      for (; p < 0; ) p += 360;
      for (; p >= 360; ) p -= 360;
      i[f] = p;
    } else
      i[f] = i[f] / s[f];
  return u /= n, new Ue(i, t).alpha(u > 0.99999 ? 1 : u, !0);
}, Vb = (e, t) => {
  const r = e.length, n = [0, 0, 0, 0];
  for (let o = 0; o < e.length; o++) {
    const a = e[o], i = t[o] / r, s = a._rgb;
    n[0] += uc(s[0], 2) * i, n[1] += uc(s[1], 2) * i, n[2] += uc(s[2], 2) * i, n[3] += s[3] * i;
  }
  return n[0] = fc(n[0]), n[1] = fc(n[1]), n[2] = fc(n[2]), n[3] > 0.9999999 && (n[3] = 1), new Ue(bu(n));
}, { pow: Wb } = Math;
function ws(e) {
  let t = "rgb", r = Bt("#ccc"), n = 0, o = [0, 1], a = [0, 1], i = [], s = [0, 0], l = !1, c = [], u = !1, f = 0, p = 1, h = !1, m = {}, w = !0, A = 1;
  const T = function(G) {
    if (G = G || ["#fff", "#000"], G && jt(G) === "string" && Bt.brewer && Bt.brewer[G.toLowerCase()] && (G = Bt.brewer[G.toLowerCase()]), jt(G) === "array") {
      G.length === 1 && (G = [G[0], G[0]]), G = G.slice(0);
      for (let oe = 0; oe < G.length; oe++)
        G[oe] = Bt(G[oe]);
      i.length = 0;
      for (let oe = 0; oe < G.length; oe++)
        i.push(oe / (G.length - 1));
    }
    return M(), c = G;
  }, B = function(G) {
    if (l != null) {
      const oe = l.length - 1;
      let ue = 0;
      for (; ue < oe && G >= l[ue]; )
        ue++;
      return ue - 1;
    }
    return 0;
  };
  let N = (G) => G, Q = (G) => G;
  const O = function(G, oe) {
    let ue, K;
    if (oe == null && (oe = !1), isNaN(G) || G === null)
      return r;
    oe ? K = G : l && l.length > 2 ? K = B(G) / (l.length - 2) : p !== f ? K = (G - f) / (p - f) : K = 1, K = Q(K), oe || (K = N(K)), A !== 1 && (K = Wb(K, A)), K = s[0] + K * (1 - s[0] - s[1]), K = qo(K, 0, 1);
    const pe = Math.floor(K * 1e4);
    if (w && m[pe])
      ue = m[pe];
    else {
      if (jt(c) === "array")
        for (let be = 0; be < i.length; be++) {
          const Ce = i[be];
          if (K <= Ce) {
            ue = c[be];
            break;
          }
          if (K >= Ce && be === i.length - 1) {
            ue = c[be];
            break;
          }
          if (K > Ce && K < i[be + 1]) {
            K = (K - Ce) / (i[be + 1] - Ce), ue = Bt.interpolate(
              c[be],
              c[be + 1],
              K,
              t
            );
            break;
          }
        }
      else jt(c) === "function" && (ue = c(K));
      w && (m[pe] = ue);
    }
    return ue;
  };
  var M = () => m = {};
  T(e);
  const X = function(G) {
    const oe = Bt(O(G));
    return u && oe[u] ? oe[u]() : oe;
  };
  return X.classes = function(G) {
    if (G != null) {
      if (jt(G) === "array")
        l = G, o = [G[0], G[G.length - 1]];
      else {
        const oe = Bt.analyze(o);
        G === 0 ? l = [oe.min, oe.max] : l = Bt.limits(oe, "e", G);
      }
      return X;
    }
    return l;
  }, X.domain = function(G) {
    if (!arguments.length)
      return a;
    a = G.slice(0), f = G[0], p = G[G.length - 1], i = [];
    const oe = c.length;
    if (G.length === oe && f !== p)
      for (let ue of Array.from(G))
        i.push((ue - f) / (p - f));
    else {
      for (let ue = 0; ue < oe; ue++)
        i.push(ue / (oe - 1));
      if (G.length > 2) {
        const ue = G.map((pe, be) => be / (G.length - 1)), K = G.map((pe) => (pe - f) / (p - f));
        K.every((pe, be) => ue[be] === pe) || (Q = (pe) => {
          if (pe <= 0 || pe >= 1) return pe;
          let be = 0;
          for (; pe >= K[be + 1]; ) be++;
          const Ce = (pe - K[be]) / (K[be + 1] - K[be]);
          return ue[be] + Ce * (ue[be + 1] - ue[be]);
        });
      }
    }
    return o = [f, p], X;
  }, X.mode = function(G) {
    return arguments.length ? (t = G, M(), X) : t;
  }, X.range = function(G, oe) {
    return T(G), X;
  }, X.out = function(G) {
    return u = G, X;
  }, X.spread = function(G) {
    return arguments.length ? (n = G, X) : n;
  }, X.correctLightness = function(G) {
    return G == null && (G = !0), h = G, M(), h ? N = function(oe) {
      const ue = O(0, !0).lab()[0], K = O(1, !0).lab()[0], pe = ue > K;
      let be = O(oe, !0).lab()[0];
      const Ce = ue + (K - ue) * oe;
      let We = be - Ce, re = 0, F = 1, z = 20;
      for (; Math.abs(We) > 0.01 && z-- > 0; )
        (function() {
          return pe && (We *= -1), We < 0 ? (re = oe, oe += (F - oe) * 0.5) : (F = oe, oe += (re - oe) * 0.5), be = O(oe, !0).lab()[0], We = be - Ce;
        })();
      return oe;
    } : N = (oe) => oe, X;
  }, X.padding = function(G) {
    return G != null ? (jt(G) === "number" && (G = [G, G]), s = G, X) : s;
  }, X.colors = function(G, oe) {
    arguments.length < 2 && (oe = "hex");
    let ue = [];
    if (arguments.length === 0)
      ue = c.slice(0);
    else if (G === 1)
      ue = [X(0.5)];
    else if (G > 1) {
      const K = o[0], pe = o[1] - K;
      ue = Xb(0, G).map(
        (be) => X(K + be / (G - 1) * pe)
      );
    } else {
      e = [];
      let K = [];
      if (l && l.length > 2)
        for (let pe = 1, be = l.length, Ce = 1 <= be; Ce ? pe < be : pe > be; Ce ? pe++ : pe--)
          K.push((l[pe - 1] + l[pe]) * 0.5);
      else
        K = o;
      ue = K.map((pe) => X(pe));
    }
    return Bt[oe] && (ue = ue.map((K) => K[oe]())), ue;
  }, X.cache = function(G) {
    return G != null ? (w = G, X) : w;
  }, X.gamma = function(G) {
    return G != null ? (A = G, X) : A;
  }, X.nodata = function(G) {
    return G != null ? (r = Bt(G), X) : r;
  }, X;
}
function Xb(e, t, r) {
  let n = [], o = e < t, a = t;
  for (let i = e; o ? i < a : i > a; o ? i++ : i--)
    n.push(i);
  return n;
}
const Yb = function(e) {
  let t = [1, 1];
  for (let r = 1; r < e; r++) {
    let n = [1];
    for (let o = 1; o <= t.length; o++)
      n[o] = (t[o] || 0) + t[o - 1];
    t = n;
  }
  return t;
}, Kb = function(e) {
  let t, r, n, o;
  if (e = e.map((a) => new Ue(a)), e.length === 2)
    [r, n] = e.map((a) => a.lab()), t = function(a) {
      const i = [0, 1, 2].map((s) => r[s] + a * (n[s] - r[s]));
      return new Ue(i, "lab");
    };
  else if (e.length === 3)
    [r, n, o] = e.map((a) => a.lab()), t = function(a) {
      const i = [0, 1, 2].map(
        (s) => (1 - a) * (1 - a) * r[s] + 2 * (1 - a) * a * n[s] + a * a * o[s]
      );
      return new Ue(i, "lab");
    };
  else if (e.length === 4) {
    let a;
    [r, n, o, a] = e.map((i) => i.lab()), t = function(i) {
      const s = [0, 1, 2].map(
        (l) => (1 - i) * (1 - i) * (1 - i) * r[l] + 3 * (1 - i) * (1 - i) * i * n[l] + 3 * (1 - i) * i * i * o[l] + i * i * i * a[l]
      );
      return new Ue(s, "lab");
    };
  } else if (e.length >= 5) {
    let a, i, s;
    a = e.map((l) => l.lab()), s = e.length - 1, i = Yb(s), t = function(l) {
      const c = 1 - l, u = [0, 1, 2].map(
        (f) => a.reduce(
          (p, h, m) => p + i[m] * c ** (s - m) * l ** m * h[f],
          0
        )
      );
      return new Ue(u, "lab");
    };
  } else
    throw new RangeError("No point in running bezier with only one color.");
  return t;
}, Zb = (e) => {
  const t = Kb(e);
  return t.scale = () => ws(t), t;
}, { round: v2 } = Math;
Ue.prototype.rgb = function(e = !0) {
  return e === !1 ? this._rgb.slice(0, 3) : this._rgb.slice(0, 3).map(v2);
};
Ue.prototype.rgba = function(e = !0) {
  return this._rgb.slice(0, 4).map((t, r) => r < 3 ? e === !1 ? t : v2(t) : t);
};
const Qb = (...e) => new Ue(...e, "rgb");
Object.assign(Bt, { rgb: Qb });
Nt.format.rgb = (...e) => {
  const t = Gt(e, "rgba");
  return t[3] === void 0 && (t[3] = 1), t;
};
Nt.autodetect.push({
  p: 3,
  test: (...e) => {
    if (e = Gt(e, "rgba"), jt(e) === "array" && (e.length === 3 || e.length === 4 && jt(e[3]) == "number" && e[3] >= 0 && e[3] <= 1))
      return "rgb";
  }
});
const wn = (e, t, r) => {
  if (!wn[r])
    throw new Error("unknown blend mode " + r);
  return wn[r](e, t);
}, vo = (e) => (t, r) => {
  const n = Bt(r).rgb(), o = Bt(t).rgb();
  return Bt.rgb(e(n, o));
}, wo = (e) => (t, r) => {
  const n = [];
  return n[0] = e(t[0], r[0]), n[1] = e(t[1], r[1]), n[2] = e(t[2], r[2]), n;
}, Jb = (e) => e, eg = (e, t) => e * t / 255, tg = (e, t) => e > t ? t : e, rg = (e, t) => e > t ? e : t, ng = (e, t) => 255 * (1 - (1 - e / 255) * (1 - t / 255)), og = (e, t) => t < 128 ? 2 * e * t / 255 : 255 * (1 - 2 * (1 - e / 255) * (1 - t / 255)), ag = (e, t) => 255 * (1 - (1 - t / 255) / (e / 255)), ig = (e, t) => e === 255 ? 255 : (e = 255 * (t / 255) / (1 - e / 255), e > 255 ? 255 : e);
wn.normal = vo(wo(Jb));
wn.multiply = vo(wo(eg));
wn.screen = vo(wo(ng));
wn.overlay = vo(wo(og));
wn.darken = vo(wo(tg));
wn.lighten = vo(wo(rg));
wn.dodge = vo(wo(ig));
wn.burn = vo(wo(ag));
const { pow: sg, sin: lg, cos: cg } = Math;
function ug(e = 300, t = -1.5, r = 1, n = 1, o = [0, 1]) {
  let a = 0, i;
  jt(o) === "array" ? i = o[1] - o[0] : (i = 0, o = [o, o]);
  const s = function(l) {
    const c = Un * ((e + 120) / 360 + t * l), u = sg(o[0] + i * l, n), p = (a !== 0 ? r[0] + l * a : r) * u * (1 - u) / 2, h = cg(c), m = lg(c), w = u + p * (-0.14861 * h + 1.78277 * m), A = u + p * (-0.29227 * h - 0.90649 * m), T = u + p * (1.97294 * h);
    return Bt(bu([w * 255, A * 255, T * 255, 1]));
  };
  return s.start = function(l) {
    return l == null ? e : (e = l, s);
  }, s.rotations = function(l) {
    return l == null ? t : (t = l, s);
  }, s.gamma = function(l) {
    return l == null ? n : (n = l, s);
  }, s.hue = function(l) {
    return l == null ? r : (r = l, jt(r) === "array" ? (a = r[1] - r[0], a === 0 && (r = r[1])) : a = 0, s);
  }, s.lightness = function(l) {
    return l == null ? o : (jt(l) === "array" ? (o = l, i = l[1] - l[0]) : (o = [l, l], i = 0), s);
  }, s.scale = () => Bt.scale(s), s.hue(r), s;
}
const fg = "0123456789abcdef", { floor: dg, random: pg } = Math, hg = (e = pg) => {
  let t = "#";
  for (let r = 0; r < 6; r++)
    t += fg.charAt(dg(e() * 16));
  return new Ue(t, "hex");
}, { log: jd, pow: mg, floor: yg, abs: bg } = Math;
function w2(e, t = null) {
  const r = {
    min: Number.MAX_VALUE,
    max: Number.MAX_VALUE * -1,
    sum: 0,
    values: [],
    count: 0
  };
  return jt(e) === "object" && (e = Object.values(e)), e.forEach((n) => {
    t && jt(n) === "object" && (n = n[t]), n != null && !isNaN(n) && (r.values.push(n), r.sum += n, n < r.min && (r.min = n), n > r.max && (r.max = n), r.count += 1);
  }), r.domain = [r.min, r.max], r.limits = (n, o) => x2(r, n, o), r;
}
function x2(e, t = "equal", r = 7) {
  jt(e) == "array" && (e = w2(e));
  const { min: n, max: o } = e, a = e.values.sort((s, l) => s - l);
  if (r === 1)
    return [n, o];
  const i = [];
  if (t.substr(0, 1) === "c" && (i.push(n), i.push(o)), t.substr(0, 1) === "e") {
    i.push(n);
    for (let s = 1; s < r; s++)
      i.push(n + s / r * (o - n));
    i.push(o);
  } else if (t.substr(0, 1) === "l") {
    if (n <= 0)
      throw new Error(
        "Logarithmic scales are only possible for values > 0"
      );
    const s = Math.LOG10E * jd(n), l = Math.LOG10E * jd(o);
    i.push(n);
    for (let c = 1; c < r; c++)
      i.push(mg(10, s + c / r * (l - s)));
    i.push(o);
  } else if (t.substr(0, 1) === "q") {
    i.push(n);
    for (let s = 1; s < r; s++) {
      const l = (a.length - 1) * s / r, c = yg(l);
      if (c === l)
        i.push(a[c]);
      else {
        const u = l - c;
        i.push(a[c] * (1 - u) + a[c + 1] * u);
      }
    }
    i.push(o);
  } else if (t.substr(0, 1) === "k") {
    let s;
    const l = a.length, c = new Array(l), u = new Array(r);
    let f = !0, p = 0, h = null;
    h = [], h.push(n);
    for (let A = 1; A < r; A++)
      h.push(n + A / r * (o - n));
    for (h.push(o); f; ) {
      for (let T = 0; T < r; T++)
        u[T] = 0;
      for (let T = 0; T < l; T++) {
        const B = a[T];
        let N = Number.MAX_VALUE, Q;
        for (let O = 0; O < r; O++) {
          const M = bg(h[O] - B);
          M < N && (N = M, Q = O), u[Q]++, c[T] = Q;
        }
      }
      const A = new Array(r);
      for (let T = 0; T < r; T++)
        A[T] = null;
      for (let T = 0; T < l; T++)
        s = c[T], A[s] === null ? A[s] = a[T] : A[s] += a[T];
      for (let T = 0; T < r; T++)
        A[T] *= 1 / u[T];
      f = !1;
      for (let T = 0; T < r; T++)
        if (A[T] !== h[T]) {
          f = !0;
          break;
        }
      h = A, p++, p > 200 && (f = !1);
    }
    const m = {};
    for (let A = 0; A < r; A++)
      m[A] = [];
    for (let A = 0; A < l; A++)
      s = c[A], m[s].push(a[A]);
    let w = [];
    for (let A = 0; A < r; A++)
      w.push(m[A][0]), w.push(m[A][m[A].length - 1]);
    w = w.sort((A, T) => A - T), i.push(w[0]);
    for (let A = 1; A < w.length; A += 2) {
      const T = w[A];
      !isNaN(T) && i.indexOf(T) === -1 && i.push(T);
    }
  }
  return i;
}
const gg = (e, t) => {
  e = new Ue(e), t = new Ue(t);
  const r = e.luminance(), n = t.luminance();
  return r > n ? (r + 0.05) / (n + 0.05) : (n + 0.05) / (r + 0.05);
};
/**
 * @license
 *
 * The APCA contrast prediction algorithm is based of the formulas published
 * in the APCA-1.0.98G specification by Myndex. The specification is available at:
 * https://raw.githubusercontent.com/Myndex/apca-w3/master/images/APCAw3_0.1.17_APCA0.0.98G.svg
 *
 * Note that the APCA implementation is still beta, so please update to
 * future versions of chroma.js when they become available.
 *
 * You can read more about the APCA Readability Criterion at
 * https://readtech.org/ARC/
 */
const Hd = 0.027, Ag = 5e-4, vg = 0.1, Ud = 1.14, X0 = 0.022, Vd = 1.414, wg = (e, t) => {
  e = new Ue(e), t = new Ue(t), e.alpha() < 1 && (e = Oa(t, e, e.alpha(), "rgb"));
  const r = Wd(...e.rgb()), n = Wd(...t.rgb()), o = r >= X0 ? r : r + Math.pow(X0 - r, Vd), a = n >= X0 ? n : n + Math.pow(X0 - n, Vd), i = Math.pow(a, 0.56) - Math.pow(o, 0.57), s = Math.pow(a, 0.65) - Math.pow(o, 0.62), l = Math.abs(a - o) < Ag ? 0 : o < a ? i * Ud : s * Ud;
  return (Math.abs(l) < vg ? 0 : l > 0 ? l - Hd : l + Hd) * 100;
};
function Wd(e, t, r) {
  return 0.2126729 * Math.pow(e / 255, 2.4) + 0.7151522 * Math.pow(t / 255, 2.4) + 0.072175 * Math.pow(r / 255, 2.4);
}
const { sqrt: jn, pow: kr, min: xg, max: _g, atan2: Xd, abs: Yd, cos: Y0, sin: Kd, exp: Eg, PI: Zd } = Math;
function Sg(e, t, r = 1, n = 1, o = 1) {
  var a = function(wt) {
    return 360 * wt / (2 * Zd);
  }, i = function(wt) {
    return 2 * Zd * wt / 360;
  };
  e = new Ue(e), t = new Ue(t);
  const [s, l, c] = Array.from(e.lab()), [u, f, p] = Array.from(t.lab()), h = (s + u) / 2, m = jn(kr(l, 2) + kr(c, 2)), w = jn(kr(f, 2) + kr(p, 2)), A = (m + w) / 2, T = 0.5 * (1 - jn(kr(A, 7) / (kr(A, 7) + kr(25, 7)))), B = l * (1 + T), N = f * (1 + T), Q = jn(kr(B, 2) + kr(c, 2)), O = jn(kr(N, 2) + kr(p, 2)), M = (Q + O) / 2, X = a(Xd(c, B)), G = a(Xd(p, N)), oe = X >= 0 ? X : X + 360, ue = G >= 0 ? G : G + 360, K = Yd(oe - ue) > 180 ? (oe + ue + 360) / 2 : (oe + ue) / 2, pe = 1 - 0.17 * Y0(i(K - 30)) + 0.24 * Y0(i(2 * K)) + 0.32 * Y0(i(3 * K + 6)) - 0.2 * Y0(i(4 * K - 63));
  let be = ue - oe;
  be = Yd(be) <= 180 ? be : ue <= oe ? be + 360 : be - 360, be = 2 * jn(Q * O) * Kd(i(be) / 2);
  const Ce = u - s, We = O - Q, re = 1 + 0.015 * kr(h - 50, 2) / jn(20 + kr(h - 50, 2)), F = 1 + 0.045 * M, z = 1 + 0.015 * M * pe, we = 30 * Eg(-kr((K - 275) / 25, 2)), ot = -(2 * jn(kr(M, 7) / (kr(M, 7) + kr(25, 7)))) * Kd(2 * i(we)), st = jn(
    kr(Ce / (r * re), 2) + kr(We / (n * F), 2) + kr(be / (o * z), 2) + ot * (We / (n * F)) * (be / (o * z))
  );
  return _g(0, xg(100, st));
}
function kg(e, t, r = "lab") {
  e = new Ue(e), t = new Ue(t);
  const n = e.get(r), o = t.get(r);
  let a = 0;
  for (let i in n) {
    const s = (n[i] || 0) - (o[i] || 0);
    a += s * s;
  }
  return Math.sqrt(a);
}
const Tg = (...e) => {
  try {
    return new Ue(...e), !0;
  } catch {
    return !1;
  }
}, Dg = {
  cool() {
    return ws([Bt.hsl(180, 1, 0.9), Bt.hsl(250, 0.7, 0.4)]);
  },
  hot() {
    return ws(["#000", "#f00", "#ff0", "#fff"]).mode(
      "rgb"
    );
  }
}, zc = {
  // sequential
  OrRd: ["#fff7ec", "#fee8c8", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#b30000", "#7f0000"],
  PuBu: ["#fff7fb", "#ece7f2", "#d0d1e6", "#a6bddb", "#74a9cf", "#3690c0", "#0570b0", "#045a8d", "#023858"],
  BuPu: ["#f7fcfd", "#e0ecf4", "#bfd3e6", "#9ebcda", "#8c96c6", "#8c6bb1", "#88419d", "#810f7c", "#4d004b"],
  Oranges: ["#fff5eb", "#fee6ce", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#a63603", "#7f2704"],
  BuGn: ["#f7fcfd", "#e5f5f9", "#ccece6", "#99d8c9", "#66c2a4", "#41ae76", "#238b45", "#006d2c", "#00441b"],
  YlOrBr: ["#ffffe5", "#fff7bc", "#fee391", "#fec44f", "#fe9929", "#ec7014", "#cc4c02", "#993404", "#662506"],
  YlGn: ["#ffffe5", "#f7fcb9", "#d9f0a3", "#addd8e", "#78c679", "#41ab5d", "#238443", "#006837", "#004529"],
  Reds: ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"],
  RdPu: ["#fff7f3", "#fde0dd", "#fcc5c0", "#fa9fb5", "#f768a1", "#dd3497", "#ae017e", "#7a0177", "#49006a"],
  Greens: ["#f7fcf5", "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#006d2c", "#00441b"],
  YlGnBu: ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"],
  Purples: ["#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#54278f", "#3f007d"],
  GnBu: ["#f7fcf0", "#e0f3db", "#ccebc5", "#a8ddb5", "#7bccc4", "#4eb3d3", "#2b8cbe", "#0868ac", "#084081"],
  Greys: ["#ffffff", "#f0f0f0", "#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252", "#252525", "#000000"],
  YlOrRd: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#bd0026", "#800026"],
  PuRd: ["#f7f4f9", "#e7e1ef", "#d4b9da", "#c994c7", "#df65b0", "#e7298a", "#ce1256", "#980043", "#67001f"],
  Blues: ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"],
  PuBuGn: ["#fff7fb", "#ece2f0", "#d0d1e6", "#a6bddb", "#67a9cf", "#3690c0", "#02818a", "#016c59", "#014636"],
  Viridis: ["#440154", "#482777", "#3f4a8a", "#31678e", "#26838f", "#1f9d8a", "#6cce5a", "#b6de2b", "#fee825"],
  // diverging
  Spectral: ["#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"],
  RdYlGn: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"],
  RdBu: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"],
  PiYG: ["#8e0152", "#c51b7d", "#de77ae", "#f1b6da", "#fde0ef", "#f7f7f7", "#e6f5d0", "#b8e186", "#7fbc41", "#4d9221", "#276419"],
  PRGn: ["#40004b", "#762a83", "#9970ab", "#c2a5cf", "#e7d4e8", "#f7f7f7", "#d9f0d3", "#a6dba0", "#5aae61", "#1b7837", "#00441b"],
  RdYlBu: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#ffffbf", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"],
  BrBG: ["#543005", "#8c510a", "#bf812d", "#dfc27d", "#f6e8c3", "#f5f5f5", "#c7eae5", "#80cdc1", "#35978f", "#01665e", "#003c30"],
  RdGy: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#ffffff", "#e0e0e0", "#bababa", "#878787", "#4d4d4d", "#1a1a1a"],
  PuOr: ["#7f3b08", "#b35806", "#e08214", "#fdb863", "#fee0b6", "#f7f7f7", "#d8daeb", "#b2abd2", "#8073ac", "#542788", "#2d004b"],
  // qualitative
  Set2: ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494", "#b3b3b3"],
  Accent: ["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f", "#bf5b17", "#666666"],
  Set1: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf", "#999999"],
  Set3: ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f"],
  Dark2: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"],
  Paired: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928"],
  Pastel2: ["#b3e2cd", "#fdcdac", "#cbd5e8", "#f4cae4", "#e6f5c9", "#fff2ae", "#f1e2cc", "#cccccc"],
  Pastel1: ["#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc", "#e5d8bd", "#fddaec", "#f2f2f2"]
}, _2 = Object.keys(zc), Qd = new Map(_2.map((e) => [e.toLowerCase(), e])), Mg = typeof Proxy == "function" ? new Proxy(zc, {
  get(e, t) {
    const r = t.toLowerCase();
    if (Qd.has(r))
      return e[Qd.get(r)];
  },
  getOwnPropertyNames() {
    return Object.getOwnPropertyNames(_2);
  }
}) : zc, Cg = (...e) => {
  e = Gt(e, "cmyk");
  const [t, r, n, o] = e, a = e.length > 4 ? e[4] : 1;
  return o === 1 ? [0, 0, 0, a] : [
    t >= 1 ? 0 : 255 * (1 - t) * (1 - o),
    // r
    r >= 1 ? 0 : 255 * (1 - r) * (1 - o),
    // g
    n >= 1 ? 0 : 255 * (1 - n) * (1 - o),
    // b
    a
  ];
}, { max: Jd } = Math, Lg = (...e) => {
  let [t, r, n] = Gt(e, "rgb");
  t = t / 255, r = r / 255, n = n / 255;
  const o = 1 - Jd(t, Jd(r, n)), a = o < 1 ? 1 / (1 - o) : 0, i = (1 - t - o) * a, s = (1 - r - o) * a, l = (1 - n - o) * a;
  return [i, s, l, o];
};
Ue.prototype.cmyk = function() {
  return Lg(this._rgb);
};
const Fg = (...e) => new Ue(...e, "cmyk");
Object.assign(Bt, { cmyk: Fg });
Nt.format.cmyk = Cg;
Nt.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Gt(e, "cmyk"), jt(e) === "array" && e.length === 4)
      return "cmyk";
  }
});
const Rg = (...e) => {
  const t = Gt(e, "hsla");
  let r = Ua(e) || "lsa";
  return t[0] = un(t[0] || 0) + "deg", t[1] = un(t[1] * 100) + "%", t[2] = un(t[2] * 100) + "%", r === "hsla" || t.length > 3 && t[3] < 1 ? (t[3] = "/ " + (t.length > 3 ? t[3] : 1), r = "hsla") : t.length = 3, `${r.substr(0, 3)}(${t.join(" ")})`;
}, Og = (...e) => {
  const t = Gt(e, "lab");
  let r = Ua(e) || "lab";
  return t[0] = un(t[0]) + "%", t[1] = un(t[1]), t[2] = un(t[2]), r === "laba" || t.length > 3 && t[3] < 1 ? t[3] = "/ " + (t.length > 3 ? t[3] : 1) : t.length = 3, `lab(${t.join(" ")})`;
}, Pg = (...e) => {
  const t = Gt(e, "lch");
  let r = Ua(e) || "lab";
  return t[0] = un(t[0]) + "%", t[1] = un(t[1]), t[2] = isNaN(t[2]) ? "none" : un(t[2]) + "deg", r === "lcha" || t.length > 3 && t[3] < 1 ? t[3] = "/ " + (t.length > 3 ? t[3] : 1) : t.length = 3, `lch(${t.join(" ")})`;
}, Ig = (...e) => {
  const t = Gt(e, "lab");
  return t[0] = un(t[0] * 100) + "%", t[1] = qc(t[1]), t[2] = qc(t[2]), t.length > 3 && t[3] < 1 ? t[3] = "/ " + (t.length > 3 ? t[3] : 1) : t.length = 3, `oklab(${t.join(" ")})`;
}, E2 = (...e) => {
  const [t, r, n, ...o] = Gt(e, "rgb"), [a, i, s] = _u(t, r, n), [l, c, u] = b2(a, i, s);
  return [l, c, u, ...o.length > 0 && o[0] < 1 ? [o[0]] : []];
}, Bg = (...e) => {
  const t = Gt(e, "lch");
  return t[0] = un(t[0] * 100) + "%", t[1] = qc(t[1]), t[2] = isNaN(t[2]) ? "none" : un(t[2]) + "deg", t.length > 3 && t[3] < 1 ? t[3] = "/ " + (t.length > 3 ? t[3] : 1) : t.length = 3, `oklch(${t.join(" ")})`;
}, { round: pc } = Math, Ng = (...e) => {
  const t = Gt(e, "rgba");
  let r = Ua(e) || "rgb";
  if (r.substr(0, 3) === "hsl")
    return Rg(A2(t), r);
  if (r.substr(0, 3) === "lab") {
    const n = Bi();
    Wn("d50");
    const o = Og(Au(t), r);
    return Wn(n), o;
  }
  if (r.substr(0, 3) === "lch") {
    const n = Bi();
    Wn("d50");
    const o = Pg(wu(t), r);
    return Wn(n), o;
  }
  return r.substr(0, 5) === "oklab" ? Ig(_u(t)) : r.substr(0, 5) === "oklch" ? Bg(E2(t)) : (t[0] = pc(t[0]), t[1] = pc(t[1]), t[2] = pc(t[2]), (r === "rgba" || t.length > 3 && t[3] < 1) && (t[3] = "/ " + (t.length > 3 ? t[3] : 1), r = "rgba"), `${r.substr(0, 3)}(${t.slice(0, r === "rgb" ? 3 : 4).join(" ")})`);
}, S2 = (...e) => {
  e = Gt(e, "lch");
  const [t, r, n, ...o] = e, [a, i, s] = y2(t, r, n), [l, c, u] = xu(a, i, s);
  return [l, c, u, ...o.length > 0 && o[0] < 1 ? [o[0]] : []];
}, Yn = /((?:-?\d+)|(?:-?\d+(?:\.\d+)?)%|none)/.source, vn = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)%?)|none)/.source, xs = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)%)|none)/.source, fn = /\s*/.source, Wa = /\s+/.source, Eu = /\s*,\s*/.source, qs = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)(?:deg)?)|none)/.source, Xa = /\s*(?:\/\s*((?:[01]|[01]?\.\d+)|\d+(?:\.\d+)?%))?/.source, k2 = new RegExp(
  "^rgba?\\(" + fn + [Yn, Yn, Yn].join(Wa) + Xa + "\\)$"
), T2 = new RegExp(
  "^rgb\\(" + fn + [Yn, Yn, Yn].join(Eu) + fn + "\\)$"
), D2 = new RegExp(
  "^rgba\\(" + fn + [Yn, Yn, Yn, vn].join(Eu) + fn + "\\)$"
), M2 = new RegExp(
  "^hsla?\\(" + fn + [qs, xs, xs].join(Wa) + Xa + "\\)$"
), C2 = new RegExp(
  "^hsl?\\(" + fn + [qs, xs, xs].join(Eu) + fn + "\\)$"
), L2 = /^hsla\(\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)$/, F2 = new RegExp(
  "^lab\\(" + fn + [vn, vn, vn].join(Wa) + Xa + "\\)$"
), R2 = new RegExp(
  "^lch\\(" + fn + [vn, vn, qs].join(Wa) + Xa + "\\)$"
), O2 = new RegExp(
  "^oklab\\(" + fn + [vn, vn, vn].join(Wa) + Xa + "\\)$"
), P2 = new RegExp(
  "^oklch\\(" + fn + [vn, vn, qs].join(Wa) + Xa + "\\)$"
), { round: I2 } = Math, ga = (e) => e.map((t, r) => r <= 2 ? qo(I2(t), 0, 255) : t), Tr = (e, t = 0, r = 100, n = !1) => (typeof e == "string" && e.endsWith("%") && (e = parseFloat(e.substring(0, e.length - 1)) / 100, n ? e = t + (e + 1) * 0.5 * (r - t) : e = t + e * (r - t)), +e), jr = (e, t) => e === "none" ? t : e, Su = (e) => {
  if (e = e.toLowerCase().trim(), e === "transparent")
    return [0, 0, 0, 0];
  let t;
  if (Nt.format.named)
    try {
      return Nt.format.named(e);
    } catch {
    }
  if ((t = e.match(k2)) || (t = e.match(T2))) {
    let r = t.slice(1, 4);
    for (let o = 0; o < 3; o++)
      r[o] = +Tr(jr(r[o], 0), 0, 255);
    r = ga(r);
    const n = t[4] !== void 0 ? +Tr(t[4], 0, 1) : 1;
    return r[3] = n, r;
  }
  if (t = e.match(D2)) {
    const r = t.slice(1, 5);
    for (let n = 0; n < 4; n++)
      r[n] = +Tr(r[n], 0, 255);
    return r;
  }
  if ((t = e.match(M2)) || (t = e.match(C2))) {
    const r = t.slice(1, 4);
    r[0] = +jr(r[0].replace("deg", ""), 0), r[1] = +Tr(jr(r[1], 0), 0, 100) * 0.01, r[2] = +Tr(jr(r[2], 0), 0, 100) * 0.01;
    const n = ga($c(r)), o = t[4] !== void 0 ? +Tr(t[4], 0, 1) : 1;
    return n[3] = o, n;
  }
  if (t = e.match(L2)) {
    const r = t.slice(1, 4);
    r[1] *= 0.01, r[2] *= 0.01;
    const n = $c(r);
    for (let o = 0; o < 3; o++)
      n[o] = I2(n[o]);
    return n[3] = +t[4], n;
  }
  if (t = e.match(F2)) {
    const r = t.slice(1, 4);
    r[0] = Tr(jr(r[0], 0), 0, 100), r[1] = Tr(jr(r[1], 0), -125, 125, !0), r[2] = Tr(jr(r[2], 0), -125, 125, !0);
    const n = Bi();
    Wn("d50");
    const o = ga(gu(r));
    Wn(n);
    const a = t[4] !== void 0 ? +Tr(t[4], 0, 1) : 1;
    return o[3] = a, o;
  }
  if (t = e.match(R2)) {
    const r = t.slice(1, 4);
    r[0] = Tr(r[0], 0, 100), r[1] = Tr(jr(r[1], 0), 0, 150, !1), r[2] = +jr(r[2].replace("deg", ""), 0);
    const n = Bi();
    Wn("d50");
    const o = ga(vu(r));
    Wn(n);
    const a = t[4] !== void 0 ? +Tr(t[4], 0, 1) : 1;
    return o[3] = a, o;
  }
  if (t = e.match(O2)) {
    const r = t.slice(1, 4);
    r[0] = Tr(jr(r[0], 0), 0, 1), r[1] = Tr(jr(r[1], 0), -0.4, 0.4, !0), r[2] = Tr(jr(r[2], 0), -0.4, 0.4, !0);
    const n = ga(xu(r)), o = t[4] !== void 0 ? +Tr(t[4], 0, 1) : 1;
    return n[3] = o, n;
  }
  if (t = e.match(P2)) {
    const r = t.slice(1, 4);
    r[0] = Tr(jr(r[0], 0), 0, 1), r[1] = Tr(jr(r[1], 0), 0, 0.4, !1), r[2] = +jr(r[2].replace("deg", ""), 0);
    const n = ga(S2(r)), o = t[4] !== void 0 ? +Tr(t[4], 0, 1) : 1;
    return n[3] = o, n;
  }
};
Su.test = (e) => (
  // modern
  k2.test(e) || M2.test(e) || F2.test(e) || R2.test(e) || O2.test(e) || P2.test(e) || // legacy
  T2.test(e) || D2.test(e) || C2.test(e) || L2.test(e) || e === "transparent"
);
Ue.prototype.css = function(e) {
  return Ng(this._rgb, e);
};
const Gg = (...e) => new Ue(...e, "css");
Bt.css = Gg;
Nt.format.css = Su;
Nt.autodetect.push({
  p: 5,
  test: (e, ...t) => {
    if (!t.length && jt(e) === "string" && Su.test(e))
      return "css";
  }
});
Nt.format.gl = (...e) => {
  const t = Gt(e, "rgba");
  return t[0] *= 255, t[1] *= 255, t[2] *= 255, t;
};
const qg = (...e) => new Ue(...e, "gl");
Bt.gl = qg;
Ue.prototype.gl = function() {
  const e = this._rgb;
  return [e[0] / 255, e[1] / 255, e[2] / 255, e[3]];
};
Ue.prototype.hex = function(e) {
  return p2(this._rgb, e);
};
const $g = (...e) => new Ue(...e, "hex");
Bt.hex = $g;
Nt.format.hex = d2;
Nt.autodetect.push({
  p: 4,
  test: (e, ...t) => {
    if (!t.length && jt(e) === "string" && [3, 4, 5, 6, 7, 8, 9].indexOf(e.length) >= 0)
      return "hex";
  }
});
const { log: K0 } = Math, B2 = (e) => {
  const t = e / 100;
  let r, n, o;
  return t < 66 ? (r = 255, n = t < 6 ? 0 : -155.25485562709179 - 0.44596950469579133 * (n = t - 2) + 104.49216199393888 * K0(n), o = t < 20 ? 0 : -254.76935184120902 + 0.8274096064007395 * (o = t - 10) + 115.67994401066147 * K0(o)) : (r = 351.97690566805693 + 0.114206453784165 * (r = t - 55) - 40.25366309332127 * K0(r), n = 325.4494125711974 + 0.07943456536662342 * (n = t - 50) - 28.0852963507957 * K0(n), o = 255), [r, n, o, 1];
}, { round: zg } = Math, jg = (...e) => {
  const t = Gt(e, "rgb"), r = t[0], n = t[2];
  let o = 1e3, a = 4e4;
  const i = 0.4;
  let s;
  for (; a - o > i; ) {
    s = (a + o) * 0.5;
    const l = B2(s);
    l[2] / l[0] >= n / r ? a = s : o = s;
  }
  return zg(s);
};
Ue.prototype.temp = Ue.prototype.kelvin = Ue.prototype.temperature = function() {
  return jg(this._rgb);
};
const hc = (...e) => new Ue(...e, "temp");
Object.assign(Bt, { temp: hc, kelvin: hc, temperature: hc });
Nt.format.temp = Nt.format.kelvin = Nt.format.temperature = B2;
Ue.prototype.oklch = function() {
  return E2(this._rgb);
};
const Hg = (...e) => new Ue(...e, "oklch");
Object.assign(Bt, { oklch: Hg });
Nt.format.oklch = S2;
Nt.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Gt(e, "oklch"), jt(e) === "array" && e.length === 3)
      return "oklch";
  }
});
Object.assign(Bt, {
  analyze: w2,
  average: Ub,
  bezier: Zb,
  blend: wn,
  brewer: Mg,
  Color: Ue,
  colors: Ra,
  contrast: gg,
  contrastAPCA: wg,
  cubehelix: ug,
  deltaE: Sg,
  distance: kg,
  input: Nt,
  interpolate: Oa,
  limits: x2,
  mix: Oa,
  random: hg,
  scale: ws,
  scales: Dg,
  valid: Tg
});
function Di(e) {
  return e === 0 ? 0 : Math.max(0, Math.ceil(-Math.log10(e)));
}
function Ug(e, t) {
  if (typeof e != "number")
    throw new TypeError(`Expected a number, received ${typeof e}`);
  return e.toFixed(t).replace(/\.(.*?)[0]+$/, ".$1").replace(/\.$/, "");
}
function Vg(e) {
  const t = /\.[0-9]*$/.exec(e);
  return t ? t[0].length - 1 : 0;
}
const _s = (e, t) => (e % t + t) % t;
function Ni(e) {
  return `${e * 100}%`;
}
const Wg = [
  ["pad", ["s", "v"]],
  ["slider", "h"],
  ["slider", "a"],
  ["values"]
];
function Mi(e) {
  return { r: 0, g: 1, b: 2, a: 3, h: 4, s: 5, v: 6 }[e];
}
function N2({ r: e, g: t, b: r }) {
  const n = Math.max(e, t, r), o = Math.min(e, t, r), a = n - o, i = n === 0 ? Number.NaN : a / n;
  let s = Number.NaN;
  return n !== o && (n === e ? s = (t - r) / a + (t < r ? 6 : 0) : n === t ? s = (r - e) / a + 2 : s = (e - t) / a + 4, s /= 6), { h: s, s: i, v: n };
}
function Ji({ h: e, s: t, v: r }) {
  const n = Math.floor(e * 6), o = e * 6 - n, a = r * (1 - t), i = r * (1 - o * t), s = r * (1 - (1 - o) * t);
  switch (n % 6) {
    case 0:
      return { r, g: s, b: a };
    case 1:
      return { r: i, g: r, b: a };
    case 2:
      return { r: a, g: r, b: s };
    case 3:
      return { r: a, g: i, b: r };
    case 4:
      return { r: s, g: a, b: r };
    default:
      return { r, g: a, b: i };
  }
}
function Uo(e, t, r) {
  const n = typeof r == "number" ? () => r : r, o = (s) => Math.max(0, Math.min(1, s));
  if (t === "h")
    return { ...e, h: _s(n(e.h), 1) };
  if (t === "s" || t === "v" || t === "a")
    return { ...e, [t]: o(n(e[t])) };
  const a = Ji(e);
  a[t] = o(n(a[t]));
  const i = N2(a);
  return {
    h: Number.isNaN(i.h) ? e.h : i.h,
    s: Number.isNaN(i.s) ? e.s : i.s,
    v: i.v,
    a: e.a
  };
}
function Xn(e, t, r) {
  return Uo(e, t, (n) => n + r);
}
function $o(e, t) {
  return t === "h" || t === "s" || t === "v" || t === "a" ? e[t] : Ji(e)[t];
}
function Ea(e) {
  const { r: t, g: r, b: n } = Ji(e);
  return Bt(t * 255, r * 255, n * 255, e.a).hex();
}
function No(e) {
  if (!Bt.valid(e))
    return { h: 0, s: 0, v: 0, a: 1 };
  const [t, r, n, o] = Bt(e).rgba(), a = N2({ r: t / 255, g: r / 255, b: n / 255 });
  return {
    h: Number.isNaN(a.h) ? 0 : a.h,
    s: Number.isNaN(a.s) ? 0 : a.s,
    v: a.v,
    a: o
  };
}
function Xg(e, t = {}) {
  let r = No(e), n = null, o = t;
  const a = () => {
    var s;
    return (s = o.onUpdate) == null ? void 0 : s.call(o, r);
  }, i = (s) => {
    var l;
    n = s, (l = o.onChange) == null || l.call(o, s);
  };
  return {
    get value() {
      return r;
    },
    setCallbacks(s) {
      o = s;
    },
    sync(s) {
      s !== n && (r = No(s), a());
    },
    updateHSVA(s) {
      r = s, a(), i(Ea(s));
    },
    updateCode(s) {
      r = No(s), a(), i(s);
    }
  };
}
function Yg(e, t, r, n, o) {
  if (r === "pad") {
    let l = Xn(e, "s", n);
    return l = Xn(l, "v", o), {
      value: l,
      updateRelated(c) {
        let u = c;
        for (const f of ["s", "v"]) {
          const p = t[f], h = l[f];
          h !== p && (u = Uo(u, f, (m) => h < p ? p === 0 ? h : m * (h / p) : m + (1 - m) * ((h - p) / (1 - p))));
        }
        return u;
      }
    };
  }
  const a = Xn(e, r, r === "v" ? o : n), i = $o(t, r), s = $o(a, r);
  return {
    value: a,
    updateRelated(l) {
      return r === "h" || i === 0 ? Xn(l, r, s - i) : Uo(l, r, $o(l, r) * (s / i));
    }
  };
}
function G2(e) {
  const [t, r, n, o] = e;
  return `M 0,0 C ${t},${r} ${n},${o} 1,1`;
}
function Kg(e, t, r, n) {
  const o = (i) => Math.max(0, Math.min(1, i)), a = [...e];
  return a[t * 2] = o(r), a[t * 2 + 1] = o(n), a;
}
function Zg({ triggerTop: e, selectedIndex: t, itemHeight: r, listHeight: n, viewportHeight: o, viewportMargin: a = 6, selectChrome: i = 2 }) {
  const s = Math.max(0, t), l = e - 2 - i - s * r, c = o - a * 2, u = n <= c ? o - a - n : o - a - r;
  return Math.max(a, Math.min(Math.max(a, u), l));
}
function Qg(e, t, r) {
  if (e.length === 0)
    return;
  const o = ((e.indexOf(t) + r) % e.length + e.length) % e.length;
  return e[o];
}
function mc(e) {
  return [
    (e[0][0] + e[1][0]) / 2,
    (e[0][1] + e[1][1]) / 2
  ];
}
function Jg(e, t) {
  return [
    [Math.min(e[0][0], t[0][0]), Math.min(e[0][1], t[0][1])],
    [Math.max(e[1][0], t[1][0]), Math.max(e[1][1], t[1][1])]
  ];
}
function e9(e, t) {
  return !(e[1][0] < t[0][0] || e[0][0] > t[1][0] || e[1][1] < t[0][1] || e[0][1] > t[1][1]);
}
function t9(e) {
  return e.startsWith("char:") ? { type: "char", value: e.slice(5) } : e.startsWith("fill:") ? { type: "fill", value: e.slice(5) } : { type: "iconify", value: e };
}
const q2 = 40, r9 = 24;
function $2(e, t) {
  return Math.max(0, Math.min(t - 1, e));
}
function n9(e, t, r, n = q2) {
  return $2(e - t / n, r);
}
function o9(e, t, r) {
  return Math.round((e - t / 2) / r);
}
function a9(e, t, r = r9) {
  const n = e + t, o = Math.trunc(n / r);
  return { steps: o, remainder: n - o * r };
}
function i9(e, t) {
  const r = t.toLowerCase();
  return e.findIndex((n) => n.toLowerCase().startsWith(r));
}
function s9({ cellWidth: e, measuredLabelWidth: t, viewportWidth: r, emPx: n, maxGapEm: o = 2 }) {
  if (e)
    return Math.max(e, 1);
  if (!t || !r)
    return Math.max(t, 1);
  let a = Math.floor(r / t);
  return a % 2 === 1 && (a -= 1), a < 2 && (a = 2), Math.min(r / a, t + o * n);
}
const jc = 1e-6, Hr = Math.PI / 180, Fr = 180 / Math.PI;
function Hc(e) {
  return e >= 0 ? Math.round(e) : e % 0.5 === 0 ? Math.floor(e) : Math.round(e);
}
function l9(e, t = 2) {
  return "[" + e.map((n) => c9(n, t)).join(", ") + "]";
}
function c9(e, t = 2) {
  return e.toFixed(t).replace(/\.([\d]*?)(0+)$/g, ".$1").replace(/\.$/g, "");
}
var Ut;
(function(e) {
  function t(..._) {
    return _.reduce((J, Le) => J + Le, 0);
  }
  e.add = t;
  function r(..._) {
    return _.length === 0 ? 0 : _.length === 1 ? -_[0] : _.reduce((J, Le) => J - Le);
  }
  e.subtract = r, e.sub = r;
  function n(..._) {
    return _.reduce((J, Le) => J * Le, 1);
  }
  e.multiply = n, e.mul = n;
  function o(..._) {
    return _.length === 0 ? 1 : _.length === 1 ? 1 / _[0] : _.reduce((J, Le) => J / Le);
  }
  e.divide = o, e.div = o, e.round = Hc, e.ceil = Math.ceil, e.floor = Math.floor, e.sign = Math.sign, e.abs = Math.abs;
  function a(_) {
    return _ < 0 ? Math.ceil(_) : Math.floor(_);
  }
  e.trunc = a;
  function i(_) {
    return _ - e.floor(_);
  }
  e.fract = i;
  function s(_, J) {
    return _ - J * e.floor(_ / J);
  }
  e.mod = s;
  function l(_, J, Le = 0) {
    return J === 0 ? _ : Math.round((_ - Le) / J) * J + Le;
  }
  e.quantize = l, e.min = Math.min, e.max = Math.max;
  function c(_, J, Le) {
    return Math.max(J, Math.min(Le, _));
  }
  e.clamp = c;
  function u(_, J) {
    return _ * J;
  }
  e.scale = u;
  function f(..._) {
    let J = 0;
    const Le = 1 / (_.length || 1);
    for (const at of _)
      J += at;
    return J / Le;
  }
  e.average = f, e.avg = f;
  function p(_, J, Le) {
    return _ + J * Le;
  }
  e.scaleAndAdd = p;
  function h(_, J) {
    return Math.abs(_ - J);
  }
  e.distance = h, e.dist = h;
  function m(_, J) {
    return (_ - J) ** 2;
  }
  e.squaredDistance = m, e.sqrDist = m, e.length = Math.abs, e.len = e.length;
  function w(_) {
    return _ ** 2;
  }
  e.squaredLength = w, e.sqrLen = w;
  function A(_) {
    return -_;
  }
  e.negate = A;
  function T(_) {
    return 1 / _;
  }
  e.invert = T;
  function B(_) {
    return 1 - _;
  }
  e.oneMinus = B, e.normalize = Math.sign;
  function N(_, J, Le) {
    return _ + (J - _) * Le;
  }
  e.lerp = N, e.mix = N;
  function Q(_, J, Le) {
    return _ === J ? 0.5 : (Le - _) / (J - _);
  }
  e.inverseLerp = Q, e.invlerp = Q;
  function O(_, J, Le, at, Ft) {
    if (Le === J)
      return N(at, Ft, 0.5);
    const St = c((_ - J) / (Le - J), 0, 1);
    return N(at, Ft, St);
  }
  e.fit = O;
  function M(_, J, Le, at, Ft) {
    if (Le === J)
      return N(at, Ft, 0.5);
    const St = (_ - J) / (Le - J);
    return N(at, Ft, St);
  }
  e.efit = M;
  function X(_, J) {
    return J < _ ? 0 : 1;
  }
  e.step = X;
  function G(_, J, Le) {
    const at = c((Le - _) / (J - _), 0, 1);
    return at * at * (3 - 2 * at);
  }
  e.smoothstep = G;
  function oe(_) {
    return _ * 180 / Math.PI;
  }
  e.degrees = oe, e.deg = oe;
  function ue(_) {
    return _ * Math.PI / 180;
  }
  e.radians = ue, e.rad = ue;
  function K(_) {
    return Math.sin(_ * Hr);
  }
  e.sin = K;
  function pe(_) {
    return Math.cos(_ * Hr);
  }
  e.cos = pe;
  function be(_) {
    return Math.tan(_ * Hr);
  }
  e.tan = be;
  function Ce(_) {
    return Math.asin(_) * Fr;
  }
  e.asin = Ce;
  function We(_) {
    return Math.acos(_) * Fr;
  }
  e.acos = We;
  function re(_, J) {
    return J === void 0 ? Math.atan(_) * Fr : Math.atan2(_, J) * Fr;
  }
  e.atan = re;
  function F(_, J) {
    return Math.atan2(_, J) * Fr;
  }
  e.atan2 = F, e.pow = Math.exp, e.exp = Math.exp, e.log = Math.log;
  function z(_) {
    return 2 ** _;
  }
  e.exp2 = z, e.log2 = Math.log2, e.sqrt = Math.sqrt;
  function we(_) {
    return 1 / Math.sqrt(_);
  }
  e.inverseSqrt = we, e.invsqrt = we;
  function Oe(_, J = 1) {
    return _ /= J, _ === 1 ? 1 : _ < 0 ? (1 + _ % 1) % 1 : _ % 1;
  }
  e.sawtooth = Oe, e.ramp = Oe;
  function ot(_, J = 1) {
    return _ /= J, 1 - Math.abs(1 - 2 * (Math.abs(_) % 1));
  }
  e.triangle = ot;
  function st(_, J = 1) {
    return _ = _ * Math.PI * 2 / J, (-Math.cos(_) + 1) / 2;
  }
  e.coswave = st;
  function wt(_, J = 1) {
    return _ = _ * Math.PI * 2 / J, (-Math.sin(_) + 1) / 2;
  }
  e.sinwave = wt;
  function ae(_, J) {
    return Math.abs(_ - J) <= jc * Math.max(1, Math.abs(_), Math.abs(J));
  }
  e.approxEquals = ae, e.approx = ae, e.equals = ae;
})(Ut || (Ut = {}));
var Xt;
(function(e) {
  function t(E, V = E) {
    return [E, V];
  }
  e.of = t;
  function r(E) {
    return [...E];
  }
  e.clone = r, e.zero = Object.freeze([0, 0]), e.one = Object.freeze([1, 1]), e.unitX = Object.freeze([1, 0]), e.unitY = Object.freeze([0, 1]);
  function n(...E) {
    let V = 0, Se = 0;
    for (const ft of E)
      V += ft[0], Se += ft[1];
    return [V, Se];
  }
  e.add = n;
  function o(...E) {
    if (E.length === 0)
      return e.zero;
    if (E.length === 1)
      return [-E[0][0], -E[0][1]];
    const [V, ...Se] = E;
    let [ft, Mt] = typeof V == "number" ? [V, V] : [...V];
    for (const or of Se)
      ft -= or[0], Mt -= or[1];
    return [ft, Mt];
  }
  e.subtract = o, e.sub = o;
  function a(E, V) {
    return [V[0] - E[0], V[1] - E[1]];
  }
  e.delta = a;
  function i(...E) {
    let V = 1, Se = 1;
    for (const ft of E)
      V *= ft[0], Se *= ft[1];
    return [V, Se];
  }
  e.multiply = i, e.mul = i;
  function s(...E) {
    if (E.length === 0)
      return e.one;
    if (E.length === 1)
      return [1 / E[0][0], 1 / E[0][1]];
    const [V, ...Se] = E;
    let [ft, Mt] = V;
    for (const or of Se)
      ft /= or[0], Mt /= or[1];
    return [ft, Mt];
  }
  e.divide = s, e.div = s;
  function l(...E) {
    if (E.length === 0)
      return [1 / 0, 1 / 0];
    if (E.length === 1)
      return E[0];
    if (E.length > 2) {
      const [ft, Mt, ...or] = E;
      return l(l(ft, Mt), ...or);
    }
    const [V, Se] = E;
    return [Math.min(V[0], Se[0]), Math.min(V[1], Se[1])];
  }
  e.min = l;
  function c(...E) {
    if (E.length === 0)
      return [-1 / 0, -1 / 0];
    if (E.length === 1)
      return E[0];
    if (E.length > 2) {
      const [ft, Mt, ...or] = E;
      return c(c(ft, Mt), ...or);
    }
    const [V, Se] = E;
    return [Math.max(V[0], Se[0]), Math.max(V[1], Se[1])];
  }
  e.max = c;
  function u(E, V, Se) {
    return typeof V == "number" && (V = [V, V]), typeof Se == "number" && (Se = [Se, Se]), [
      Math.min(Math.max(E[0], V[0]), Se[0]),
      Math.min(Math.max(E[1], V[1]), Se[1])
    ];
  }
  e.clamp = u;
  function f(E) {
    return [Math.abs(E[0]), Math.abs(E[1])];
  }
  e.abs = f;
  function p(E) {
    return [Hc(E[0]), Hc(E[1])];
  }
  e.round = p;
  function h(E) {
    return [Math.ceil(E[0]), Math.ceil(E[1])];
  }
  e.ceil = h;
  function m(E) {
    return [Math.floor(E[0]), Math.floor(E[1])];
  }
  e.floor = m;
  function w(E) {
    return [Math.sign(E[0]), Math.sign(E[1])];
  }
  e.sign = w;
  function A(E) {
    return [
      E[0] < 0 ? Math.ceil(E[0]) : Math.floor(E[0]),
      E[1] < 0 ? Math.ceil(E[1]) : Math.floor(E[1])
    ];
  }
  e.trunc = A;
  function T(E) {
    return e.sub(E, m(E));
  }
  e.fract = T;
  function B(E, V) {
    return typeof V == "number" && (V = [V, V]), [
      E[0] - V[0] * Math.floor(E[0] / V[0]),
      E[1] - V[1] * Math.floor(E[1] / V[1])
    ];
  }
  e.mod = B;
  function N(E, V, Se = e.zero) {
    return typeof V == "number" && (V = [V, V]), typeof Se == "number" && (Se = [Se, Se]), [
      Ut.quantize(E[0], V[0], Se[0]),
      Ut.quantize(E[1], V[1], Se[1])
    ];
  }
  e.quantize = N;
  function Q(E, V) {
    return [E[0] * V, E[1] * V];
  }
  e.scale = Q;
  function O(...E) {
    let V = 0, Se = 0;
    const ft = E.length || 1;
    for (const Mt of E)
      V += Mt[0], Se += Mt[1];
    return [V / ft, Se / ft];
  }
  e.average = O, e.avg = O;
  function M(E, V, Se) {
    return [E[0] + V[0] * Se, E[1] + V[1] * Se];
  }
  e.scaleAndAdd = M;
  function X(E, V) {
    const Se = V[0] - E[0], ft = V[1] - E[1];
    return Math.hypot(Se, ft);
  }
  e.distance = X, e.dist = X;
  function G(E, V) {
    const Se = V[0] - E[0], ft = V[1] - E[1];
    return Se * Se + ft * ft;
  }
  e.squaredDistance = G, e.sqrDist = G;
  function oe(E) {
    return Math.hypot(E[0], E[1]);
  }
  e.length = oe, e.len = oe;
  function ue(E) {
    return E[0] ** 2 + E[1] ** 2;
  }
  e.squaredLength = ue, e.sqrLen = ue;
  function K(E) {
    return [-E[0], -E[1]];
  }
  e.negate = K, e.neg = K;
  function pe(E) {
    return [1 / E[0], 1 / E[1]];
  }
  e.invert = pe, e.inv = pe;
  function be(E) {
    return o(e.one, E);
  }
  e.oneMinus = be;
  function Ce(E) {
    const Se = E[0] === 0 && E[1] === 0 ? 0 : 1 / Math.hypot(E[0], E[1]);
    return [E[0] * Se, E[1] * Se];
  }
  e.normalize = Ce;
  function We(E, V) {
    return E[0] * V[0] + E[1] * V[1];
  }
  e.dot = We;
  function re(E, V) {
    return [0, 0, E[0] * V[1] - E[1] * V[0]];
  }
  e.cross = re;
  function F(E, V, Se) {
    return typeof Se == "number" && (Se = [Se, Se]), [E[0] + Se[0] * (V[0] - E[0]), E[1] + Se[1] * (V[1] - E[1])];
  }
  e.lerp = F, e.mix = F;
  function z(E, V, Se) {
    return [
      E[0] === V[0] ? 0.5 : (Se[0] - E[0]) / (V[0] - E[0]),
      E[1] === V[1] ? 0.5 : (Se[1] - E[1]) / (V[1] - E[1])
    ];
  }
  e.inverseLerp = z, e.invlerp = z;
  function we(E, V, Se, ft, Mt) {
    return [
      Ut.fit(E[0], V[0], Se[0], ft[0], Mt[0]),
      Ut.fit(E[1], V[1], Se[1], ft[1], Mt[1])
    ];
  }
  e.fit = we;
  function Oe(E, V, Se, ft, Mt) {
    return [
      Ut.efit(E[0], V[0], Se[0], ft[0], Mt[0]),
      Ut.efit(E[1], V[1], Se[1], ft[1], Mt[1])
    ];
  }
  e.efit = Oe;
  function ot(E, V) {
    const [Se, ft] = E;
    return [
      V[0] * Se + V[2] * ft,
      //
      V[1] * Se + V[3] * ft
    ];
  }
  e.transformMat2 = ot;
  function st(E, V) {
    const [Se, ft] = E;
    return [
      V[0] * Se + V[2] * ft + V[4],
      //
      V[1] * Se + V[3] * ft + V[5]
    ];
  }
  e.transformMat2d = st;
  function wt(E, V) {
    const [Se, ft] = E;
    return [
      V[0] * Se + V[3] * ft + V[6],
      //
      V[1] * Se + V[4] * ft + V[7]
    ];
  }
  e.transformMat3 = wt;
  function ae(E, V, Se = e.zero) {
    const ft = E[0] - Se[0], Mt = E[1] - Se[1], or = Math.sin(V * Hr), Gr = Math.cos(V * Hr);
    return [
      ft * Gr - Mt * or + Se[0],
      //
      ft * or + Mt * Gr + Se[1]
      //
    ];
  }
  e.rotate = ae;
  function _(E, V = !0, Se) {
    if (Se) {
      const [ft, Mt] = o(E, Se);
      return V ? n(Se, [-Mt, ft]) : n(Se, [Mt, -ft]);
    } else
      return V ? [-E[1], E[0]] : [E[1], -E[0]];
  }
  e.rotate90 = _;
  function J(E, V) {
    if (!V)
      return Math.atan2(E[1], E[0]) * Fr;
    if (e.eq(E, V))
      return 0;
    const [Se, ft] = E, [Mt, or] = V, Gr = Math.hypot(Se, ft) * Math.hypot(Mt, or);
    if (Gr === 0)
      return 0;
    const _r = Se * or - ft * Mt >= 0 ? 1 : -1, In = Math.acos(Ut.clamp(We(E, V) / Gr, -1, 1)), Zr = _r * In * Fr;
    return Zr <= -180 ? Zr + 360 : Zr;
  }
  e.angle = J;
  function Le(E, V = 1, Se = e.zero) {
    return [
      Math.cos(E * Hr) * V + Se[0],
      Math.sin(E * Hr) * V + Se[1]
    ];
  }
  e.direction = Le, e.dir = Le;
  function at(E, V) {
    return typeof E == "number" && (E = [E, E]), [V[0] < E[0] ? 0 : 1, V[1] < E[1] ? 0 : 1];
  }
  e.step = at;
  function Ft(E, V, Se) {
    const ft = Ut.clamp((Se[0] - E[0]) / (V[0] - E[0]), 0, 1), Mt = Ut.clamp((Se[1] - V[1]) / (V[1] - V[1]), 0, 1);
    return [
      ft * ft * (3 - 2 * ft),
      //
      Mt * Mt * (3 - 2 * Mt)
    ];
  }
  e.smoothstep = Ft;
  function St(E) {
    return [
      E[0] * Fr,
      //
      E[1] * Fr
    ];
  }
  e.degrees = St, e.deg = St;
  function Wt(E) {
    return [
      E[0] * Hr,
      //
      E[1] * Hr
    ];
  }
  e.radians = Wt, e.rad = Wt;
  function it(E) {
    return [
      Math.sin(E[0] * Hr),
      //
      Math.sin(E[1] * Hr)
    ];
  }
  e.sin = it;
  function Ve(E) {
    return [
      Math.cos(E[0] * Hr),
      //
      Math.cos(E[1] * Hr)
    ];
  }
  e.cos = Ve;
  function pt(E) {
    return [
      Math.tan(E[0] * Hr),
      //
      Math.tan(E[1] * Hr)
    ];
  }
  e.tan = pt;
  function bt(E) {
    return [
      Math.asin(E[0]) * Fr,
      //
      Math.asin(E[1]) * Fr
    ];
  }
  e.asin = bt;
  function $t(E) {
    return [
      Math.acos(E[0] * Fr),
      //
      Math.acos(E[1] * Fr)
    ];
  }
  e.acos = $t;
  function br(E, V) {
    return V === void 0 ? [
      Math.atan(E[0]) * Fr,
      //
      Math.atan(E[1]) * Fr
    ] : [
      Math.atan2(E[0], V[0]) * Fr,
      //
      Math.atan2(E[1], V[1]) * Fr
    ];
  }
  e.atan = br;
  function Qt(E, V) {
    return [
      Math.atan2(E[0], V[0]) * Fr,
      //
      Math.atan2(E[1], V[1]) * Fr
    ];
  }
  e.atan2 = Qt;
  function ur(E, V) {
    return [Math.pow(E[0], V[0]), Math.pow(E[1], V[1])];
  }
  e.pow = ur;
  function _e(E) {
    return [Math.exp(E[0]), Math.exp(E[1])];
  }
  e.exp = _e;
  function ut(E) {
    return [Math.log(E[0]), Math.log(E[1])];
  }
  e.log = ut;
  function kt(E) {
    return [2 ** E[0], 2 ** E[1]];
  }
  e.exp2 = kt;
  function b(E) {
    return [Math.log2(E[0]), Math.log2(E[1])];
  }
  e.log2 = b;
  function R(E) {
    return [Math.sqrt(E[0]), Math.sqrt(E[1])];
  }
  e.sqrt = R;
  function le(E) {
    return [1 / Math.sqrt(E[0]), 1 / Math.sqrt(E[1])];
  }
  e.inverseSqrt = le, e.invsqrt = le;
  function ie(E, V) {
    return E[0] === V[0] && E[1] === V[1];
  }
  e.exactEquals = ie, e.eq = ie;
  function Be(E, V) {
    const [Se, ft] = E, [Mt, or] = V;
    return Math.abs(Se - Mt) <= jc * Math.max(1, Math.abs(Se), Math.abs(Mt)) && Math.abs(ft - or) <= jc * Math.max(1, Math.abs(ft), Math.abs(or));
  }
  e.approxEquals = Be, e.approx = Be, e.equals = Be, e.toString = l9;
})(Xt || (Xt = {}));
const u9 = 20;
function f9({ step: e, display: t, width: r, min: n, max: o, tweaking: a, speed: i, precision: s }) {
  if (e)
    return Di(e);
  const l = Vg(t), c = n !== Number.MIN_SAFE_INTEGER && o !== Number.MAX_SAFE_INTEGER && r > 0 ? Di(Math.abs(o - n) / r) : 0;
  return a ? Math.max(l, c, Di(i)) : Math.min(s, Math.max(l, c));
}
function d9({ state: e, delta: t, barVisible: r, min: n, max: o, width: a, step: i, speed: s, minSpeed: l, maxSpeed: c }) {
  const [u, f] = t, p = p9([
    Ut.lerp(e.directionAverage[0], Math.abs(u), 0.1),
    Ut.lerp(e.directionAverage[1], Math.abs(f), 0.1)
  ]), h = Ut.smoothstep(0.4, 0.6, Math.abs(p[0])), m = r ? (o - n) / a : i ? i / u9 : 1, w = u * m * s * h;
  let A = e.local + w;
  r || (A = Ut.clamp(A, n, o));
  const T = Ut.clamp(Ut.lerp(e.gestureSpeed * 0.98 ** f, e.gestureSpeed, h), l, c);
  return {
    local: A,
    directionAverage: p,
    offsetWeight: h,
    gestureSpeed: T,
    deltaValue: w
  };
}
function p9(e) {
  const t = Math.hypot(e[0], e[1]);
  return t === 0 ? [1, 0] : [e[0] / t, e[1] / t];
}
function h9(e) {
  const t = e.trim();
  if (t === "")
    throw new Error("Value is not a number");
  const r = Number(t);
  if (!Number.isFinite(r))
    throw new Error("Value is not a finite number");
  return () => r;
}
var m9 = $s("colinear"), y9 = $s("parallel"), b9 = $s("none");
function g9(e, t, r, n, o, a, i, s) {
  var l = (s - a) * (r - e) - (i - o) * (n - t), c = (i - o) * (t - a) - (s - a) * (e - o), u = (r - e) * (t - a) - (n - t) * (e - o);
  if (l == 0)
    return c == 0 && u == 0 ? m9 : y9;
  var f = c / l, p = u / l;
  return f >= 0 && f <= 1 && p >= 0 && p <= 1 ? A9({
    x: e + f * (r - e),
    y: t + f * (n - t)
  }) : b9;
}
function A9(e) {
  var t = $s("intersecting");
  return t.point = e, t;
}
function $s(e) {
  return {
    type: e
  };
}
function v9(e, t, r, n) {
  const o = e + t;
  return !n || !Number.isFinite(r) || r === 0 ? { local: o, output: o } : {
    local: o,
    output: Math.round(o / r) * r
  };
}
function e1(e, t) {
  return _s(e - t + 180, 360) - 180;
}
function w9(e, t, r) {
  const [[n, o], [a, i]] = r;
  for (const [s, l, c, u] of [
    [n, o, a, o],
    [a, o, a, i],
    [a, i, n, i],
    [n, i, n, o]
  ]) {
    const f = g9(e[0], e[1], t[0], t[1], s, l, c, u);
    if (f.type === "intersecting")
      return [f.point.x, f.point.y];
  }
  return t;
}
var z2 = typeof global == "object" && global && global.Object === Object && global, x9 = typeof self == "object" && self && self.Object === Object && self, Fn = z2 || x9 || Function("return this")(), Pa = Fn.Symbol, j2 = Object.prototype, _9 = j2.hasOwnProperty, E9 = j2.toString, xi = Pa ? Pa.toStringTag : void 0;
function S9(e) {
  var t = _9.call(e, xi), r = e[xi];
  try {
    e[xi] = void 0;
    var n = !0;
  } catch {
  }
  var o = E9.call(e);
  return n && (t ? e[xi] = r : delete e[xi]), o;
}
var k9 = Object.prototype, T9 = k9.toString;
function D9(e) {
  return T9.call(e);
}
var M9 = "[object Null]", C9 = "[object Undefined]", t1 = Pa ? Pa.toStringTag : void 0;
function Ya(e) {
  return e == null ? e === void 0 ? C9 : M9 : t1 && t1 in Object(e) ? S9(e) : D9(e);
}
function Ia(e) {
  return e != null && typeof e == "object";
}
var L9 = "[object Symbol]";
function F9(e) {
  return typeof e == "symbol" || Ia(e) && Ya(e) == L9;
}
var Es = Array.isArray, R9 = /\s/;
function O9(e) {
  for (var t = e.length; t-- && R9.test(e.charAt(t)); )
    ;
  return t;
}
var P9 = /^\s+/;
function I9(e) {
  return e && e.slice(0, O9(e) + 1).replace(P9, "");
}
function mo(e) {
  var t = typeof e;
  return e != null && (t == "object" || t == "function");
}
var r1 = NaN, B9 = /^[-+]0x[0-9a-f]+$/i, N9 = /^0b[01]+$/i, G9 = /^0o[0-7]+$/i, q9 = parseInt;
function Uc(e) {
  if (typeof e == "number")
    return e;
  if (F9(e))
    return r1;
  if (mo(e)) {
    var t = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = mo(t) ? t + "" : t;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = I9(e);
  var r = N9.test(e);
  return r || G9.test(e) ? q9(e.slice(2), r ? 2 : 8) : B9.test(e) ? r1 : +e;
}
var n1 = 1 / 0, $9 = 17976931348623157e292;
function Ci(e) {
  if (!e)
    return e === 0 ? e : 0;
  if (e = Uc(e), e === n1 || e === -n1) {
    var t = e < 0 ? -1 : 1;
    return t * $9;
  }
  return e === e ? e : 0;
}
function o1(e) {
  return e;
}
var z9 = "[object AsyncFunction]", j9 = "[object Function]", H9 = "[object GeneratorFunction]", U9 = "[object Proxy]";
function H2(e) {
  if (!mo(e))
    return !1;
  var t = Ya(e);
  return t == j9 || t == H9 || t == z9 || t == U9;
}
var yc = Fn["__core-js_shared__"], a1 = function() {
  var e = /[^.]+$/.exec(yc && yc.keys && yc.keys.IE_PROTO || "");
  return e ? "Symbol(src)_1." + e : "";
}();
function V9(e) {
  return !!a1 && a1 in e;
}
var W9 = Function.prototype, X9 = W9.toString;
function Ko(e) {
  if (e != null) {
    try {
      return X9.call(e);
    } catch {
    }
    try {
      return e + "";
    } catch {
    }
  }
  return "";
}
var Y9 = /[\\^$.*+?()[\]{}|]/g, K9 = /^\[object .+?Constructor\]$/, Z9 = Function.prototype, Q9 = Object.prototype, J9 = Z9.toString, e4 = Q9.hasOwnProperty, t4 = RegExp(
  "^" + J9.call(e4).replace(Y9, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function r4(e) {
  if (!mo(e) || V9(e))
    return !1;
  var t = H2(e) ? t4 : K9;
  return t.test(Ko(e));
}
function n4(e, t) {
  return e == null ? void 0 : e[t];
}
function Ka(e, t) {
  var r = n4(e, t);
  return r4(r) ? r : void 0;
}
var Vc = Ka(Fn, "WeakMap"), o4 = 9007199254740991, a4 = /^(?:0|[1-9]\d*)$/;
function U2(e, t) {
  var r = typeof e;
  return t = t ?? o4, !!t && (r == "number" || r != "symbol" && a4.test(e)) && e > -1 && e % 1 == 0 && e < t;
}
function ku(e, t) {
  return e === t || e !== e && t !== t;
}
var i4 = 9007199254740991;
function V2(e) {
  return typeof e == "number" && e > -1 && e % 1 == 0 && e <= i4;
}
function W2(e) {
  return e != null && V2(e.length) && !H2(e);
}
function X2(e, t, r) {
  if (!mo(r))
    return !1;
  var n = typeof t;
  return (n == "number" ? W2(r) && U2(t, r.length) : n == "string" && t in r) ? ku(r[t], e) : !1;
}
var s4 = Object.prototype;
function l4(e) {
  var t = e && e.constructor, r = typeof t == "function" && t.prototype || s4;
  return e === r;
}
function c4(e, t) {
  for (var r = -1, n = Array(e); ++r < e; )
    n[r] = t(r);
  return n;
}
var u4 = "[object Arguments]";
function i1(e) {
  return Ia(e) && Ya(e) == u4;
}
var Y2 = Object.prototype, f4 = Y2.hasOwnProperty, d4 = Y2.propertyIsEnumerable, p4 = i1(/* @__PURE__ */ function() {
  return arguments;
}()) ? i1 : function(e) {
  return Ia(e) && f4.call(e, "callee") && !d4.call(e, "callee");
};
function h4() {
  return !1;
}
var K2 = typeof exports == "object" && exports && !exports.nodeType && exports, s1 = K2 && typeof module == "object" && module && !module.nodeType && module, m4 = s1 && s1.exports === K2, l1 = m4 ? Fn.Buffer : void 0, y4 = l1 ? l1.isBuffer : void 0, Wc = y4 || h4, b4 = "[object Arguments]", g4 = "[object Array]", A4 = "[object Boolean]", v4 = "[object Date]", w4 = "[object Error]", x4 = "[object Function]", _4 = "[object Map]", E4 = "[object Number]", S4 = "[object Object]", k4 = "[object RegExp]", T4 = "[object Set]", D4 = "[object String]", M4 = "[object WeakMap]", C4 = "[object ArrayBuffer]", L4 = "[object DataView]", F4 = "[object Float32Array]", R4 = "[object Float64Array]", O4 = "[object Int8Array]", P4 = "[object Int16Array]", I4 = "[object Int32Array]", B4 = "[object Uint8Array]", N4 = "[object Uint8ClampedArray]", G4 = "[object Uint16Array]", q4 = "[object Uint32Array]", cr = {};
cr[F4] = cr[R4] = cr[O4] = cr[P4] = cr[I4] = cr[B4] = cr[N4] = cr[G4] = cr[q4] = !0;
cr[b4] = cr[g4] = cr[C4] = cr[A4] = cr[L4] = cr[v4] = cr[w4] = cr[x4] = cr[_4] = cr[E4] = cr[S4] = cr[k4] = cr[T4] = cr[D4] = cr[M4] = !1;
function $4(e) {
  return Ia(e) && V2(e.length) && !!cr[Ya(e)];
}
function z4(e) {
  return function(t) {
    return e(t);
  };
}
var Z2 = typeof exports == "object" && exports && !exports.nodeType && exports, Li = Z2 && typeof module == "object" && module && !module.nodeType && module, j4 = Li && Li.exports === Z2, bc = j4 && z2.process, c1 = function() {
  try {
    var e = Li && Li.require && Li.require("util").types;
    return e || bc && bc.binding && bc.binding("util");
  } catch {
  }
}(), u1 = c1 && c1.isTypedArray, Q2 = u1 ? z4(u1) : $4, H4 = Object.prototype, U4 = H4.hasOwnProperty;
function V4(e, t) {
  var r = Es(e), n = !r && p4(e), o = !r && !n && Wc(e), a = !r && !n && !o && Q2(e), i = r || n || o || a, s = i ? c4(e.length, String) : [], l = s.length;
  for (var c in e)
    U4.call(e, c) && !(i && // Safari 9 has enumerable `arguments.length` in strict mode.
    (c == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
    o && (c == "offset" || c == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
    a && (c == "buffer" || c == "byteLength" || c == "byteOffset") || // Skip index properties.
    U2(c, l))) && s.push(c);
  return s;
}
function W4(e, t) {
  return function(r) {
    return e(t(r));
  };
}
var X4 = W4(Object.keys, Object), Y4 = Object.prototype, K4 = Y4.hasOwnProperty;
function Z4(e) {
  if (!l4(e))
    return X4(e);
  var t = [];
  for (var r in Object(e))
    K4.call(e, r) && r != "constructor" && t.push(r);
  return t;
}
function Q4(e) {
  return W2(e) ? V4(e) : Z4(e);
}
var Gi = Ka(Object, "create");
function J4() {
  this.__data__ = Gi ? Gi(null) : {}, this.size = 0;
}
function e8(e) {
  var t = this.has(e) && delete this.__data__[e];
  return this.size -= t ? 1 : 0, t;
}
var t8 = "__lodash_hash_undefined__", r8 = Object.prototype, n8 = r8.hasOwnProperty;
function o8(e) {
  var t = this.__data__;
  if (Gi) {
    var r = t[e];
    return r === t8 ? void 0 : r;
  }
  return n8.call(t, e) ? t[e] : void 0;
}
var a8 = Object.prototype, i8 = a8.hasOwnProperty;
function s8(e) {
  var t = this.__data__;
  return Gi ? t[e] !== void 0 : i8.call(t, e);
}
var l8 = "__lodash_hash_undefined__";
function c8(e, t) {
  var r = this.__data__;
  return this.size += this.has(e) ? 0 : 1, r[e] = Gi && t === void 0 ? l8 : t, this;
}
function Vo(e) {
  var t = -1, r = e == null ? 0 : e.length;
  for (this.clear(); ++t < r; ) {
    var n = e[t];
    this.set(n[0], n[1]);
  }
}
Vo.prototype.clear = J4;
Vo.prototype.delete = e8;
Vo.prototype.get = o8;
Vo.prototype.has = s8;
Vo.prototype.set = c8;
function u8() {
  this.__data__ = [], this.size = 0;
}
function zs(e, t) {
  for (var r = e.length; r--; )
    if (ku(e[r][0], t))
      return r;
  return -1;
}
var f8 = Array.prototype, d8 = f8.splice;
function p8(e) {
  var t = this.__data__, r = zs(t, e);
  if (r < 0)
    return !1;
  var n = t.length - 1;
  return r == n ? t.pop() : d8.call(t, r, 1), --this.size, !0;
}
function h8(e) {
  var t = this.__data__, r = zs(t, e);
  return r < 0 ? void 0 : t[r][1];
}
function m8(e) {
  return zs(this.__data__, e) > -1;
}
function y8(e, t) {
  var r = this.__data__, n = zs(r, e);
  return n < 0 ? (++this.size, r.push([e, t])) : r[n][1] = t, this;
}
function Zn(e) {
  var t = -1, r = e == null ? 0 : e.length;
  for (this.clear(); ++t < r; ) {
    var n = e[t];
    this.set(n[0], n[1]);
  }
}
Zn.prototype.clear = u8;
Zn.prototype.delete = p8;
Zn.prototype.get = h8;
Zn.prototype.has = m8;
Zn.prototype.set = y8;
var qi = Ka(Fn, "Map");
function b8() {
  this.size = 0, this.__data__ = {
    hash: new Vo(),
    map: new (qi || Zn)(),
    string: new Vo()
  };
}
function g8(e) {
  var t = typeof e;
  return t == "string" || t == "number" || t == "symbol" || t == "boolean" ? e !== "__proto__" : e === null;
}
function js(e, t) {
  var r = e.__data__;
  return g8(t) ? r[typeof t == "string" ? "string" : "hash"] : r.map;
}
function A8(e) {
  var t = js(this, e).delete(e);
  return this.size -= t ? 1 : 0, t;
}
function v8(e) {
  return js(this, e).get(e);
}
function w8(e) {
  return js(this, e).has(e);
}
function x8(e, t) {
  var r = js(this, e), n = r.size;
  return r.set(e, t), this.size += r.size == n ? 0 : 1, this;
}
function Zo(e) {
  var t = -1, r = e == null ? 0 : e.length;
  for (this.clear(); ++t < r; ) {
    var n = e[t];
    this.set(n[0], n[1]);
  }
}
Zo.prototype.clear = b8;
Zo.prototype.delete = A8;
Zo.prototype.get = v8;
Zo.prototype.has = w8;
Zo.prototype.set = x8;
function _8(e) {
  return "";
}
function E8(e, t) {
  for (var r = -1, n = t.length, o = e.length; ++r < n; )
    e[o + r] = t[r];
  return e;
}
function S8() {
  this.__data__ = new Zn(), this.size = 0;
}
function k8(e) {
  var t = this.__data__, r = t.delete(e);
  return this.size = t.size, r;
}
function T8(e) {
  return this.__data__.get(e);
}
function D8(e) {
  return this.__data__.has(e);
}
var M8 = 200;
function C8(e, t) {
  var r = this.__data__;
  if (r instanceof Zn) {
    var n = r.__data__;
    if (!qi || n.length < M8 - 1)
      return n.push([e, t]), this.size = ++r.size, this;
    r = this.__data__ = new Zo(n);
  }
  return r.set(e, t), this.size = r.size, this;
}
function po(e) {
  var t = this.__data__ = new Zn(e);
  this.size = t.size;
}
po.prototype.clear = S8;
po.prototype.delete = k8;
po.prototype.get = T8;
po.prototype.has = D8;
po.prototype.set = C8;
function L8(e, t) {
  for (var r = -1, n = e == null ? 0 : e.length, o = 0, a = []; ++r < n; ) {
    var i = e[r];
    t(i, r, e) && (a[o++] = i);
  }
  return a;
}
function F8() {
  return [];
}
var R8 = Object.prototype, O8 = R8.propertyIsEnumerable, f1 = Object.getOwnPropertySymbols, P8 = f1 ? function(e) {
  return e == null ? [] : (e = Object(e), L8(f1(e), function(t) {
    return O8.call(e, t);
  }));
} : F8;
function I8(e, t, r) {
  var n = t(e);
  return Es(e) ? n : E8(n, r(e));
}
function d1(e) {
  return I8(e, Q4, P8);
}
var Xc = Ka(Fn, "DataView"), Yc = Ka(Fn, "Promise"), Kc = Ka(Fn, "Set"), p1 = "[object Map]", B8 = "[object Object]", h1 = "[object Promise]", m1 = "[object Set]", y1 = "[object WeakMap]", b1 = "[object DataView]", N8 = Ko(Xc), G8 = Ko(qi), q8 = Ko(Yc), $8 = Ko(Kc), z8 = Ko(Vc), lo = Ya;
(Xc && lo(new Xc(new ArrayBuffer(1))) != b1 || qi && lo(new qi()) != p1 || Yc && lo(Yc.resolve()) != h1 || Kc && lo(new Kc()) != m1 || Vc && lo(new Vc()) != y1) && (lo = function(e) {
  var t = Ya(e), r = t == B8 ? e.constructor : void 0, n = r ? Ko(r) : "";
  if (n)
    switch (n) {
      case N8:
        return b1;
      case G8:
        return p1;
      case q8:
        return h1;
      case $8:
        return m1;
      case z8:
        return y1;
    }
  return t;
});
var g1 = Fn.Uint8Array, j8 = "__lodash_hash_undefined__";
function H8(e) {
  return this.__data__.set(e, j8), this;
}
function U8(e) {
  return this.__data__.has(e);
}
function Ss(e) {
  var t = -1, r = e == null ? 0 : e.length;
  for (this.__data__ = new Zo(); ++t < r; )
    this.add(e[t]);
}
Ss.prototype.add = Ss.prototype.push = H8;
Ss.prototype.has = U8;
function V8(e, t) {
  for (var r = -1, n = e == null ? 0 : e.length; ++r < n; )
    if (t(e[r], r, e))
      return !0;
  return !1;
}
function W8(e, t) {
  return e.has(t);
}
var X8 = 1, Y8 = 2;
function J2(e, t, r, n, o, a) {
  var i = r & X8, s = e.length, l = t.length;
  if (s != l && !(i && l > s))
    return !1;
  var c = a.get(e), u = a.get(t);
  if (c && u)
    return c == t && u == e;
  var f = -1, p = !0, h = r & Y8 ? new Ss() : void 0;
  for (a.set(e, t), a.set(t, e); ++f < s; ) {
    var m = e[f], w = t[f];
    if (n)
      var A = i ? n(w, m, f, t, e, a) : n(m, w, f, e, t, a);
    if (A !== void 0) {
      if (A)
        continue;
      p = !1;
      break;
    }
    if (h) {
      if (!V8(t, function(T, B) {
        if (!W8(h, B) && (m === T || o(m, T, r, n, a)))
          return h.push(B);
      })) {
        p = !1;
        break;
      }
    } else if (!(m === w || o(m, w, r, n, a))) {
      p = !1;
      break;
    }
  }
  return a.delete(e), a.delete(t), p;
}
function K8(e) {
  var t = -1, r = Array(e.size);
  return e.forEach(function(n, o) {
    r[++t] = [o, n];
  }), r;
}
function Z8(e) {
  var t = -1, r = Array(e.size);
  return e.forEach(function(n) {
    r[++t] = n;
  }), r;
}
var Q8 = 1, J8 = 2, e6 = "[object Boolean]", t6 = "[object Date]", r6 = "[object Error]", n6 = "[object Map]", o6 = "[object Number]", a6 = "[object RegExp]", i6 = "[object Set]", s6 = "[object String]", l6 = "[object Symbol]", c6 = "[object ArrayBuffer]", u6 = "[object DataView]", A1 = Pa ? Pa.prototype : void 0, gc = A1 ? A1.valueOf : void 0;
function f6(e, t, r, n, o, a, i) {
  switch (r) {
    case u6:
      if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset)
        return !1;
      e = e.buffer, t = t.buffer;
    case c6:
      return !(e.byteLength != t.byteLength || !a(new g1(e), new g1(t)));
    case e6:
    case t6:
    case o6:
      return ku(+e, +t);
    case r6:
      return e.name == t.name && e.message == t.message;
    case a6:
    case s6:
      return e == t + "";
    case n6:
      var s = K8;
    case i6:
      var l = n & Q8;
      if (s || (s = Z8), e.size != t.size && !l)
        return !1;
      var c = i.get(e);
      if (c)
        return c == t;
      n |= J8, i.set(e, t);
      var u = J2(s(e), s(t), n, o, a, i);
      return i.delete(e), u;
    case l6:
      if (gc)
        return gc.call(e) == gc.call(t);
  }
  return !1;
}
var d6 = 1, p6 = Object.prototype, h6 = p6.hasOwnProperty;
function m6(e, t, r, n, o, a) {
  var i = r & d6, s = d1(e), l = s.length, c = d1(t), u = c.length;
  if (l != u && !i)
    return !1;
  for (var f = l; f--; ) {
    var p = s[f];
    if (!(i ? p in t : h6.call(t, p)))
      return !1;
  }
  var h = a.get(e), m = a.get(t);
  if (h && m)
    return h == t && m == e;
  var w = !0;
  a.set(e, t), a.set(t, e);
  for (var A = i; ++f < l; ) {
    p = s[f];
    var T = e[p], B = t[p];
    if (n)
      var N = i ? n(B, T, p, t, e, a) : n(T, B, p, e, t, a);
    if (!(N === void 0 ? T === B || o(T, B, r, n, a) : N)) {
      w = !1;
      break;
    }
    A || (A = p == "constructor");
  }
  if (w && !A) {
    var Q = e.constructor, O = t.constructor;
    Q != O && "constructor" in e && "constructor" in t && !(typeof Q == "function" && Q instanceof Q && typeof O == "function" && O instanceof O) && (w = !1);
  }
  return a.delete(e), a.delete(t), w;
}
var y6 = 1, v1 = "[object Arguments]", w1 = "[object Array]", Z0 = "[object Object]", b6 = Object.prototype, x1 = b6.hasOwnProperty;
function g6(e, t, r, n, o, a) {
  var i = Es(e), s = Es(t), l = i ? w1 : lo(e), c = s ? w1 : lo(t);
  l = l == v1 ? Z0 : l, c = c == v1 ? Z0 : c;
  var u = l == Z0, f = c == Z0, p = l == c;
  if (p && Wc(e)) {
    if (!Wc(t))
      return !1;
    i = !0, u = !1;
  }
  if (p && !u)
    return a || (a = new po()), i || Q2(e) ? J2(e, t, r, n, o, a) : f6(e, t, l, r, n, o, a);
  if (!(r & y6)) {
    var h = u && x1.call(e, "__wrapped__"), m = f && x1.call(t, "__wrapped__");
    if (h || m) {
      var w = h ? e.value() : e, A = m ? t.value() : t;
      return a || (a = new po()), o(w, A, r, n, a);
    }
  }
  return p ? (a || (a = new po()), m6(e, t, r, n, o, a)) : !1;
}
function e3(e, t, r, n, o) {
  return e === t ? !0 : e == null || t == null || !Ia(e) && !Ia(t) ? e !== e && t !== t : g6(e, t, r, n, e3, o);
}
var Ac = function() {
  return Fn.Date.now();
}, A6 = "Expected a function", v6 = Math.max, w6 = Math.min;
function Tu(e, t, r) {
  var n, o, a, i, s, l, c = 0, u = !1, f = !1, p = !0;
  if (typeof e != "function")
    throw new TypeError(A6);
  t = Uc(t) || 0, mo(r) && (u = !!r.leading, f = "maxWait" in r, a = f ? v6(Uc(r.maxWait) || 0, t) : a, p = "trailing" in r ? !!r.trailing : p);
  function h(M) {
    var X = n, G = o;
    return n = o = void 0, c = M, i = e.apply(G, X), i;
  }
  function m(M) {
    return c = M, s = setTimeout(T, t), u ? h(M) : i;
  }
  function w(M) {
    var X = M - l, G = M - c, oe = t - X;
    return f ? w6(oe, a - G) : oe;
  }
  function A(M) {
    var X = M - l, G = M - c;
    return l === void 0 || X >= t || X < 0 || f && G >= a;
  }
  function T() {
    var M = Ac();
    if (A(M))
      return B(M);
    s = setTimeout(T, w(M));
  }
  function B(M) {
    return s = void 0, p && n ? h(M) : (n = o = void 0, i);
  }
  function N() {
    s !== void 0 && clearTimeout(s), c = 0, n = l = o = s = void 0;
  }
  function Q() {
    return s === void 0 ? i : B(Ac());
  }
  function O() {
    var M = Ac(), X = A(M);
    if (n = arguments, o = this, l = M, X) {
      if (s === void 0)
        return m(l);
      if (f)
        return clearTimeout(s), s = setTimeout(T, t), h(l);
    }
    return s === void 0 && (s = setTimeout(T, t)), i;
  }
  return O.cancel = N, O.flush = Q, O;
}
function t3(e, t) {
  return e3(e, t);
}
var x6 = Math.floor, _6 = Math.random;
function E6(e, t) {
  return e + x6(_6() * (t - e + 1));
}
var S6 = parseFloat, k6 = Math.min, T6 = Math.random;
function Du(e, t, r) {
  if (r && typeof r != "boolean" && X2(e, t, r) && (t = r = void 0), r === void 0 && (typeof t == "boolean" ? (r = t, t = void 0) : typeof e == "boolean" && (r = e, e = void 0)), e === void 0 && t === void 0 ? (e = 0, t = 1) : (e = Ci(e), t === void 0 ? (t = e, e = 0) : t = Ci(t)), e > t) {
    var n = e;
    e = t, t = n;
  }
  if (r || e % 1 || t % 1) {
    var o = T6();
    return k6(e + o * (t - e + S6("1e-" + ((o + "").length - 1))), t);
  }
  return E6(e, t);
}
var D6 = Math.ceil, M6 = Math.max;
function C6(e, t, r, n) {
  for (var o = -1, a = M6(D6((t - e) / (r || 1)), 0), i = Array(a); a--; )
    i[++o] = e, e += r;
  return i;
}
function L6(e) {
  return function(t, r, n) {
    return n && typeof n != "number" && X2(t, r, n) && (r = n = void 0), t = Ci(t), r === void 0 ? (r = t, t = 0) : r = Ci(r), n = n === void 0 ? t < r ? 1 : -1 : Ci(n), C6(t, r, n);
  };
}
var $i = L6(), F6 = "Expected a function";
function R6(e, t, r) {
  var n = !0, o = !0;
  if (typeof e != "function")
    throw new TypeError(F6);
  return mo(r) && (n = "leading" in r ? !!r.leading : n, o = "trailing" in r ? !!r.trailing : o), Tu(e, t, {
    leading: n,
    maxWait: t,
    trailing: o
  });
}
var O6 = 0;
function P6(e) {
  var t = ++O6;
  return _8() + t;
}
function ks(e, t, r = 10) {
  let n = t();
  for (let o = 0; o < r && n === e; o++)
    n = t();
  return n;
}
function MD(e, t, r = 1) {
  if (r <= 0)
    return (o) => ks(o, () => e + Math.random() * (t - e));
  const n = Math.max(1, Math.ceil((t - e) / r));
  return (o) => ks(o, () => e + Du(0, n - 1) * r);
}
function CD(e) {
  return (t) => e.length === 0 ? t : ks(t, () => e[Du(0, e.length - 1)]);
}
const I6 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function LD(e = {}) {
  const t = e.length ?? 12, r = e.charset ?? I6, n = () => {
    let o = "";
    for (let a = 0; a < t; a++)
      o += r[Du(0, r.length - 1)];
    return o;
  };
  return (o) => ks(o, n);
}
function B6({ previous: e, next: t, valueOnEdit: r, keepRatio: n }) {
  if (e[0] !== t[0] && e[1] !== t[1]) {
    const s = e[0] / e[1], l = t[0] / t[1];
    Ut.approx(s, l) || (n = !1);
  }
  const a = e[0] !== t[0] ? 0 : 1;
  if (!n)
    return { value: t, keepRatio: n };
  let i = t[a] / r[a];
  return Number.isFinite(i) || (i = 1), {
    value: r.map((s, l) => l === a ? t[a] : s * i),
    keepRatio: n
  };
}
function N6({ dragging: e, initialX: t, currentX: r, valueOnTweak: n, threshold: o = 3 }) {
  if (!e)
    return null;
  const a = r - t;
  return Math.abs(a) <= o ? !n : a > 0;
}
function G6(e, t) {
  switch (e.toLowerCase()) {
    case " ":
      return !t;
    case "t":
    case "1":
    case "y":
    case "p":
      return !0;
    case "f":
    case "0":
    case "n":
    case "m":
      return !1;
    default:
      return;
  }
}
function q6(e, t, r, n, o) {
  const a = r <= 0 ? 1 : r === 1 ? t : r === 2 ? t * 60 : t * 3600, i = n ? a : 1, s = n ? o % i : 0;
  return Ut.quantize(e, i, s);
}
function $6(e, t) {
  let r = "";
  e < 0 && (r = "-", e = -e);
  const n = Math.floor(e / (t * 3600)), o = Math.floor(e % (t * 3600) / (t * 60)), a = Math.floor(e % (t * 60) / t), i = e % t, s = (l) => l.toString().padStart(2, "0");
  return r + (n > 0 ? [n, s(o), s(a), s(i)] : [s(o), s(a), s(i)]).join(":");
}
function _1(e, t) {
  e = e.trim().toLowerCase();
  let r = 1;
  if (e.startsWith("-") && (r = -1, e = e.slice(1)), e.includes(":")) {
    const o = e.split(":").map(Number).reverse();
    let a = 0;
    for (let i = 0; i < o.length; i++) {
      const s = i === 0 ? 1 : i === 1 ? t : t * 60 ** (i - 1);
      a += o[i] * s;
    }
    return r * a;
  }
  if (/[0-9+\-.]s(ec(ond)?s?)?$/.test(e)) {
    const o = parseFloat(e);
    return Number.isNaN(o) ? null : r * Math.round(o * t);
  }
  if (/[0-9+\-.]m(in(ute)?s?)?$/.test(e)) {
    const o = parseFloat(e);
    return Number.isNaN(o) ? null : r * Math.round(o * t * 60);
  }
  if (/[0-9+\-.]h((ou)?r)?s?$/.test(e)) {
    const o = parseFloat(e);
    return Number.isNaN(o) ? null : r * Math.round(o * t * 3600);
  }
  const n = parseInt(e);
  return Number.isNaN(n) ? null : r * n;
}
function z6(e, t) {
  e = e.replaceAll(/([0-9+\-.]+:)+[0-9+\-.]+/gi, (r) => {
    var n;
    return ((n = _1(r, t)) == null ? void 0 : n.toString()) ?? "0";
  });
  for (const [r] of [
    [/[0-9+\-.]+f(rames?)?/gi],
    [/[0-9+\-.]+s(ec(ond)?s?)?/gi],
    [/[0-9+\-.]+m(in(ute)?s?)?/gi],
    [/[0-9+\-.]+h((ou)?r)?s?/gi]
  ])
    e = e.replaceAll(r, (n) => {
      var o;
      return ((o = _1(n, t)) == null ? void 0 : o.toString()) ?? "0";
    });
  return e;
}
function j6(e, t) {
  const r = z6(e, t), n = Number(r.trim());
  return Number.isFinite(n) ? () => ({ value: n, log: [] }) : () => ({ value: void 0, log: ["Value is not a finite number"] });
}
function E1(e) {
  if (e !== void 0)
    return typeof e == "number" ? [e, e] : e;
}
function H6({ value: e, min: t, max: r, scale: n, center: o = [150, 150] }) {
  const a = [
    o[0] - e[0] * n,
    o[1] - e[1] * n
  ], i = [
    o[0] - (e[0] - ((t == null ? void 0 : t[0]) ?? -9999)) * n,
    o[1] - (e[1] - ((t == null ? void 0 : t[1]) ?? -9999)) * n
  ], s = [
    o[0] - (e[0] - ((r == null ? void 0 : r[0]) ?? 9999)) * n,
    o[1] - (e[1] - ((r == null ? void 0 : r[1]) ?? 9999)) * n
  ];
  return {
    grid: {
      backgroundSize: `${10 * n}px ${10 * n}px`,
      backgroundPosition: `${a[0] - 1}px ${a[1] - 1}px`
    },
    zero: {
      left: `${i[0]}px`,
      top: `${i[1]}px`,
      width: `${s[0] - i[0]}px`,
      height: `${s[1] - i[1]}px`
    }
  };
}
function vc(e, t, r) {
  const n = e.map((s, l) => ({ item: s, index: l })).filter(({ item: s }) => !("separator" in s) && !s.disabled).map(({ index: s }) => s);
  if (!n.length)
    return;
  if (r === "Home")
    return n[0];
  if (r === "End")
    return n.at(-1);
  if (r !== "ArrowDown" && r !== "ArrowUp")
    return;
  const o = n.indexOf(t), a = o < 0 ? 0 : o;
  return n[(a + (r === "ArrowDown" ? 1 : -1) + n.length) % n.length];
}
function U6(e, t, r, n) {
  const o = (u, f, p) => (u.x - p.x) * (f.y - p.y) - (f.x - p.x) * (u.y - p.y), a = o(e, t, r), i = o(e, r, n), s = o(e, n, t), l = a < 0 || i < 0 || s < 0, c = a > 0 || i > 0 || s > 0;
  return !(l && c);
}
const V6 = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/, W6 = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/;
function X6(e) {
  if (e > 65535) {
    e -= 65536;
    const t = 55296 + (e >> 10), r = 56320 + (e & 1023);
    return String.fromCharCode(t, r);
  }
  return String.fromCharCode(e);
}
function Hs(e) {
  switch (e) {
    case 9:
    case 32:
      return !0;
  }
  return !1;
}
function S1(e) {
  if (e >= 8192 && e <= 8202)
    return !0;
  switch (e) {
    case 9:
    case 10:
    case 11:
    case 12:
    case 13:
    case 32:
    case 160:
    case 5760:
    case 8239:
    case 8287:
    case 12288:
      return !0;
  }
  return !1;
}
function Y6(e) {
  return V6.test(e) || W6.test(e);
}
function k1(e) {
  return Y6(X6(e));
}
function T1(e) {
  switch (e) {
    case 33:
    case 34:
    case 35:
    case 36:
    case 37:
    case 38:
    case 39:
    case 40:
    case 41:
    case 42:
    case 43:
    case 44:
    case 45:
    case 46:
    case 47:
    case 58:
    case 59:
    case 60:
    case 61:
    case 62:
    case 63:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 124:
    case 125:
    case 126:
      return !0;
    default:
      return !1;
  }
}
function xn(e, t, r) {
  this.type = e, this.tag = t, this.attrs = null, this.map = null, this.nesting = r, this.level = 0, this.children = null, this.content = "", this.markup = "", this.info = "", this.meta = null, this.block = !1, this.hidden = !1;
}
xn.prototype.attrIndex = function(t) {
  if (!this.attrs)
    return -1;
  const r = this.attrs;
  for (let n = 0, o = r.length; n < o; n++)
    if (r[n][0] === t)
      return n;
  return -1;
};
xn.prototype.attrPush = function(t) {
  this.attrs ? this.attrs.push(t) : this.attrs = [t];
};
xn.prototype.attrSet = function(t, r) {
  const n = this.attrIndex(t), o = [t, r];
  n < 0 ? this.attrPush(o) : this.attrs[n] = o;
};
xn.prototype.attrGet = function(t) {
  const r = this.attrIndex(t);
  let n = null;
  return r >= 0 && (n = this.attrs[r][1]), n;
};
xn.prototype.attrJoin = function(t, r) {
  const n = this.attrIndex(t);
  n < 0 ? this.attrPush([t, r]) : this.attrs[n][1] = this.attrs[n][1] + " " + r;
};
function K6(e, t, r) {
  this.src = e, this.env = r, this.tokens = [], this.inlineMode = !1, this.md = t;
}
K6.prototype.Token = xn;
function Qn(e, t, r, n) {
  this.src = e, this.md = t, this.env = r, this.tokens = n, this.bMarks = [], this.eMarks = [], this.tShift = [], this.sCount = [], this.bsCount = [], this.blkIndent = 0, this.line = 0, this.lineMax = 0, this.tight = !1, this.ddIndent = -1, this.listIndent = -1, this.parentType = "root", this.level = 0;
  const o = this.src;
  for (let a = 0, i = 0, s = 0, l = 0, c = o.length, u = !1; i < c; i++) {
    const f = o.charCodeAt(i);
    if (!u)
      if (Hs(f)) {
        s++, f === 9 ? l += 4 - l % 4 : l++;
        continue;
      } else
        u = !0;
    (f === 10 || i === c - 1) && (f !== 10 && i++, this.bMarks.push(a), this.eMarks.push(i), this.tShift.push(s), this.sCount.push(l), this.bsCount.push(0), u = !1, s = 0, l = 0, a = i + 1);
  }
  this.bMarks.push(o.length), this.eMarks.push(o.length), this.tShift.push(0), this.sCount.push(0), this.bsCount.push(0), this.lineMax = this.bMarks.length - 1;
}
Qn.prototype.push = function(e, t, r) {
  const n = new xn(e, t, r);
  return n.block = !0, r < 0 && this.level--, n.level = this.level, r > 0 && this.level++, this.tokens.push(n), n;
};
Qn.prototype.isEmpty = function(t) {
  return this.bMarks[t] + this.tShift[t] >= this.eMarks[t];
};
Qn.prototype.skipEmptyLines = function(t) {
  for (let r = this.lineMax; t < r && !(this.bMarks[t] + this.tShift[t] < this.eMarks[t]); t++)
    ;
  return t;
};
Qn.prototype.skipSpaces = function(t) {
  for (let r = this.src.length; t < r; t++) {
    const n = this.src.charCodeAt(t);
    if (!Hs(n))
      break;
  }
  return t;
};
Qn.prototype.skipSpacesBack = function(t, r) {
  if (t <= r)
    return t;
  for (; t > r; )
    if (!Hs(this.src.charCodeAt(--t)))
      return t + 1;
  return t;
};
Qn.prototype.skipChars = function(t, r) {
  for (let n = this.src.length; t < n && this.src.charCodeAt(t) === r; t++)
    ;
  return t;
};
Qn.prototype.skipCharsBack = function(t, r, n) {
  if (t <= n)
    return t;
  for (; t > n; )
    if (r !== this.src.charCodeAt(--t))
      return t + 1;
  return t;
};
Qn.prototype.getLines = function(t, r, n, o) {
  if (t >= r)
    return "";
  const a = new Array(r - t);
  for (let i = 0, s = t; s < r; s++, i++) {
    let l = 0;
    const c = this.bMarks[s];
    let u = c, f;
    for (s + 1 < r || o ? f = this.eMarks[s] + 1 : f = this.eMarks[s]; u < f && l < n; ) {
      const p = this.src.charCodeAt(u);
      if (Hs(p))
        p === 9 ? l += 4 - (l + this.bsCount[s]) % 4 : l++;
      else if (u - c < this.tShift[s])
        l++;
      else
        break;
      u++;
    }
    l > n ? a[i] = new Array(l - n + 1).join(" ") + this.src.slice(u, f) : a[i] = this.src.slice(u, f);
  }
  return a.join("");
};
Qn.prototype.Token = xn;
const Z6 = [
  "address",
  "article",
  "aside",
  "base",
  "basefont",
  "blockquote",
  "body",
  "caption",
  "center",
  "col",
  "colgroup",
  "dd",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "frame",
  "frameset",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hr",
  "html",
  "iframe",
  "legend",
  "li",
  "link",
  "main",
  "menu",
  "menuitem",
  "nav",
  "noframes",
  "ol",
  "optgroup",
  "option",
  "p",
  "param",
  "search",
  "section",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "title",
  "tr",
  "track",
  "ul"
], Q6 = "[a-zA-Z_:][a-zA-Z0-9:._-]*", J6 = "[^\"'=<>`\\x00-\\x20]+", eA = "'[^']*'", tA = '"[^"]*"', rA = "(?:" + J6 + "|" + eA + "|" + tA + ")", nA = "(?:\\s+" + Q6 + "(?:\\s*=\\s*" + rA + ")?)", oA = "<[A-Za-z][A-Za-z0-9\\-]*" + nA + "*\\s*\\/?>", aA = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>", iA = new RegExp("^(?:" + oA + "|" + aA + ")");
new RegExp("^</?(" + Z6.join("|") + ")(?=(\\s|/?>|$))", "i"), new RegExp(iA.source + "\\s*$");
function Us(e, t, r, n) {
  this.src = e, this.env = r, this.md = t, this.tokens = n, this.tokens_meta = Array(n.length), this.pos = 0, this.posMax = this.src.length, this.level = 0, this.pending = "", this.pendingLevel = 0, this.cache = {}, this.delimiters = [], this._prev_delimiters = [], this.backticks = {}, this.backticksScanned = !1, this.linkLevel = 0;
}
Us.prototype.pushPending = function() {
  const e = new xn("text", "", 0);
  return e.content = this.pending, e.level = this.pendingLevel, this.tokens.push(e), this.pending = "", e;
};
Us.prototype.push = function(e, t, r) {
  this.pending && this.pushPending();
  const n = new xn(e, t, r);
  let o = null;
  return r < 0 && (this.level--, this.delimiters = this._prev_delimiters.pop()), n.level = this.level, r > 0 && (this.level++, this._prev_delimiters.push(this.delimiters), this.delimiters = [], o = { delimiters: this.delimiters }), this.pendingLevel = this.level, this.tokens.push(n), this.tokens_meta.push(o), n;
};
Us.prototype.scanDelims = function(e, t) {
  const r = this.posMax, n = this.src.charCodeAt(e);
  let o;
  if (e === 0)
    o = 32;
  else if (e === 1)
    o = this.src.charCodeAt(0), (o & 63488) === 55296 && (o = 65533);
  else if (o = this.src.charCodeAt(e - 1), (o & 64512) === 56320) {
    const A = this.src.charCodeAt(e - 2);
    o = (A & 64512) === 55296 ? 65536 + (A - 55296 << 10) + (o - 56320) : 65533;
  } else (o & 64512) === 55296 && (o = 65533);
  let a = e;
  for (; a < r && this.src.charCodeAt(a) === n; )
    a++;
  const i = a - e;
  let s = a < r ? this.src.charCodeAt(a) : 32;
  if ((s & 64512) === 55296) {
    const A = this.src.charCodeAt(a + 1);
    s = (A & 64512) === 56320 ? 65536 + (s - 55296 << 10) + (A - 56320) : 65533;
  } else (s & 64512) === 56320 && (s = 65533);
  const l = T1(o) || k1(o), c = T1(s) || k1(s), u = S1(o), f = S1(s), p = !f && (!c || u || l), h = !u && (!l || f || c);
  return { can_open: p && (t || !h || l), can_close: h && (t || !p || c), length: i };
};
Us.prototype.Token = xn;
const r3 = [];
for (let e = 0; e < 256; e++)
  r3.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(e) {
  r3[e.charCodeAt(0)] = 1;
});
var D1 = !1, Ba = { false: "push", true: "unshift", after: "push", before: "unshift" }, Ts = { isPermalinkSymbol: !0 };
function Zc(e, t, r, n) {
  var o;
  if (!D1) {
    var a = "Using deprecated markdown-it-anchor permalink option, see https://github.com/valeriangalliat/markdown-it-anchor#permalinks";
    typeof process == "object" && process && process.emitWarning ? process.emitWarning(a) : console.warn(a), D1 = !0;
  }
  var i = [Object.assign(new r.Token("link_open", "a", 1), { attrs: [].concat(t.permalinkClass ? [["class", t.permalinkClass]] : [], [["href", t.permalinkHref(e, r)]], Object.entries(t.permalinkAttrs(e, r))) }), Object.assign(new r.Token("html_block", "", 0), { content: t.permalinkSymbol, meta: Ts }), new r.Token("link_close", "a", -1)];
  t.permalinkSpace && r.tokens[n + 1].children[Ba[t.permalinkBefore]](Object.assign(new r.Token("text", "", 0), { content: " " })), (o = r.tokens[n + 1].children)[Ba[t.permalinkBefore]].apply(o, i);
}
function n3(e) {
  return "#" + e;
}
function o3(e) {
  return {};
}
var sA = { class: "header-anchor", symbol: "#", renderHref: n3, renderAttrs: o3 };
function e0(e) {
  function t(r) {
    return r = Object.assign({}, t.defaults, r), function(n, o, a, i) {
      return e(n, r, o, a, i);
    };
  }
  return t.defaults = Object.assign({}, sA), t.renderPermalinkImpl = e, t;
}
function Mu(e) {
  var t = [], r = e.filter(function(n) {
    if (n[0] !== "class") return !0;
    t.push(n[1]);
  });
  return t.length > 0 && r.unshift(["class", t.join(" ")]), r;
}
var Vs = e0(function(e, t, r, n, o) {
  var a, i = [Object.assign(new n.Token("link_open", "a", 1), { attrs: Mu([].concat(t.class ? [["class", t.class]] : [], [["href", t.renderHref(e, n)]], t.ariaHidden ? [["aria-hidden", "true"]] : [], Object.entries(t.renderAttrs(e, n)))) }), Object.assign(new n.Token("html_inline", "", 0), { content: t.symbol, meta: Ts }), new n.Token("link_close", "a", -1)];
  if (t.space) {
    var s = typeof t.space == "string" ? t.space : " ";
    n.tokens[o + 1].children[Ba[t.placement]](Object.assign(new n.Token(typeof t.space == "string" ? "html_inline" : "text", "", 0), { content: s }));
  }
  (a = n.tokens[o + 1].children)[Ba[t.placement]].apply(a, i);
});
Object.assign(Vs.defaults, { space: !0, placement: "after", ariaHidden: !1 });
var Io = e0(Vs.renderPermalinkImpl);
Io.defaults = Object.assign({}, Vs.defaults, { ariaHidden: !0 });
var a3 = e0(function(e, t, r, n, o) {
  var a = [Object.assign(new n.Token("link_open", "a", 1), { attrs: Mu([].concat(t.class ? [["class", t.class]] : [], [["href", t.renderHref(e, n)]], Object.entries(t.renderAttrs(e, n)))) })].concat(t.safariReaderFix ? [new n.Token("span_open", "span", 1)] : [], n.tokens[o + 1].children, t.safariReaderFix ? [new n.Token("span_close", "span", -1)] : [], [new n.Token("link_close", "a", -1)]);
  n.tokens[o + 1].children = a;
});
Object.assign(a3.defaults, { safariReaderFix: !1 });
var M1 = e0(function(e, t, r, n, o) {
  var a;
  if (!["visually-hidden", "aria-label", "aria-describedby", "aria-labelledby"].includes(t.style)) throw new Error("`permalink.linkAfterHeader` called with unknown style option `" + t.style + "`");
  if (!["aria-describedby", "aria-labelledby"].includes(t.style) && !t.assistiveText) throw new Error("`permalink.linkAfterHeader` called without the `assistiveText` option in `" + t.style + "` style");
  if (t.style === "visually-hidden" && !t.visuallyHiddenClass) throw new Error("`permalink.linkAfterHeader` called without the `visuallyHiddenClass` option in `visually-hidden` style");
  var i = n.tokens[o + 1].children.filter(function(f) {
    return f.type === "text" || f.type === "code_inline";
  }).reduce(function(f, p) {
    return f + p.content;
  }, ""), s = [], l = [];
  if (t.class && l.push(["class", t.class]), l.push(["href", t.renderHref(e, n)]), l.push.apply(l, Object.entries(t.renderAttrs(e, n))), t.style === "visually-hidden") {
    if (s.push(Object.assign(new n.Token("span_open", "span", 1), { attrs: [["class", t.visuallyHiddenClass]] }), Object.assign(new n.Token("text", "", 0), { content: t.assistiveText(i) }), new n.Token("span_close", "span", -1)), t.space) {
      var c = typeof t.space == "string" ? t.space : " ";
      s[Ba[t.placement]](Object.assign(new n.Token(typeof t.space == "string" ? "html_inline" : "text", "", 0), { content: c }));
    }
    s[Ba[t.placement]](Object.assign(new n.Token("span_open", "span", 1), { attrs: [["aria-hidden", "true"]] }), Object.assign(new n.Token("html_inline", "", 0), { content: t.symbol, meta: Ts }), new n.Token("span_close", "span", -1));
  } else s.push(Object.assign(new n.Token("html_inline", "", 0), { content: t.symbol, meta: Ts }));
  t.style === "aria-label" ? l.push(["aria-label", t.assistiveText(i)]) : ["aria-describedby", "aria-labelledby"].includes(t.style) && l.push([t.style, e]);
  var u = [Object.assign(new n.Token("link_open", "a", 1), { attrs: Mu(l) })].concat(s, [new n.Token("link_close", "a", -1)]);
  (a = n.tokens).splice.apply(a, [o + 3, 0].concat(u)), t.wrapper && (n.tokens.splice(o, 0, Object.assign(new n.Token("html_block", "", 0), { content: t.wrapper[0] + `
` })), n.tokens.splice(o + 3 + u.length + 1, 0, Object.assign(new n.Token("html_block", "", 0), { content: t.wrapper[1] + `
` })));
});
function C1(e, t, r, n) {
  var o = e, a = n;
  if (r && Object.prototype.hasOwnProperty.call(t, o)) throw new Error("User defined `id` attribute `" + e + "` is not unique. Please fix it in your Markdown to continue.");
  for (; Object.prototype.hasOwnProperty.call(t, o); ) o = e + "-" + a, a += 1;
  return t[o] = !0, o;
}
function Si(e, t) {
  t = Object.assign({}, Si.defaults, t), e.core.ruler.push("anchor", function(r) {
    for (var n, o = {}, a = r.tokens, i = Array.isArray(t.level) ? (n = t.level, function(f) {
      return n.includes(f);
    }) : /* @__PURE__ */ function(f) {
      return function(p) {
        return p >= f;
      };
    }(t.level), s = 0; s < a.length; s++) {
      var l = a[s];
      if (l.type === "heading_open" && i(Number(l.tag.substr(1)))) {
        var c = t.getTokensText(a[s + 1].children), u = l.attrGet("id");
        u = u == null ? C1(u = t.slugifyWithState ? t.slugifyWithState(c, r) : t.slugify(c), o, !1, t.uniqueSlugStartIndex) : C1(u, o, !0, t.uniqueSlugStartIndex), l.attrSet("id", u), t.tabIndex !== !1 && l.attrSet("tabindex", "" + t.tabIndex), typeof t.permalink == "function" ? t.permalink(u, t, r, s) : (t.permalink || t.renderPermalink && t.renderPermalink !== Zc) && t.renderPermalink(u, t, r, s), s = a.indexOf(l), t.callback && t.callback(l, { slug: u, title: c });
      }
    }
  });
}
Object.assign(M1.defaults, { style: "visually-hidden", space: !0, placement: "after", wrapper: null }), Si.permalink = { __proto__: null, legacy: Zc, renderHref: n3, renderAttrs: o3, makePermalink: e0, linkInsideHeader: Vs, ariaHidden: Io, headerLink: a3, linkAfterHeader: M1 }, Si.defaults = { level: 1, slugify: function(e) {
  return encodeURIComponent(String(e).trim().toLowerCase().replace(/\s+/g, "-"));
}, uniqueSlugStartIndex: 1, tabIndex: "-1", getTokensText: function(e) {
  return e.filter(function(t) {
    return ["text", "code_inline"].includes(t.type);
  }).map(function(t) {
    return t.content;
  }).join("");
}, permalink: !1, renderPermalink: Zc, permalinkClass: Io.defaults.class, permalinkSpace: Io.defaults.space, permalinkSymbol: "¶", permalinkBefore: Io.defaults.placement === "before", permalinkHref: Io.defaults.renderHref, permalinkAttrs: Io.defaults.renderAttrs }, Si.default = Si;
function lA(e, t, r) {
  if (typeof e != "string")
    return { left: `${e[0]}px`, top: `${e[1]}px` };
  const [n, o] = e.split("-"), a = typeof t == "number" ? { mainAxis: t, crossAxis: 0 } : { mainAxis: t.mainAxis ?? 0, crossAxis: t.crossAxis ?? 0 }, i = `${a.mainAxis}px`, s = `${a.crossAxis}px`, l = n === "top" || n === "bottom", c = {
    positionAnchor: r,
    positionTryFallbacks: "flip-block, flip-inline, flip-block flip-inline"
  };
  return n === "top" ? (c.bottom = "anchor(top)", c.marginBottom = i) : n === "bottom" ? (c.top = "anchor(bottom)", c.marginTop = i) : n === "left" ? (c.right = "anchor(left)", c.marginRight = i) : (c.left = "anchor(right)", c.marginLeft = i), o === "start" ? l ? (c.left = "anchor(left)", c.marginLeft = s) : (c.top = "anchor(top)", c.marginTop = s) : o === "end" ? l ? (c.right = "anchor(right)", c.marginRight = s) : (c.bottom = "anchor(bottom)", c.marginBottom = s) : l ? (c.left = "anchor(center)", c.translate = "-50% 0") : (c.top = "anchor(center)", c.translate = "0 -50%"), c;
}
function cA({ reference: e, popover: t, placement: r, currentShiftX: n, currentShiftY: o, viewportWidth: a, viewportHeight: i, arrow: s, viewportMargin: l = 8 }) {
  const [c] = r.split("-");
  let u = 0, f = 0;
  const p = t.left - n, h = t.right - n, m = t.top - o, w = t.bottom - o;
  if (h > a - l && (u = a - l - h), p + u < l && (u = l - p), w > i - l && (f = i - l - w), m + f < l && (f = l - m), !s)
    return { shiftX: u, shiftY: f, arrowOffset: 0 };
  const A = t.left - n + u, T = t.top - o + f, B = {
    left: A,
    top: T,
    right: A + t.width,
    bottom: T + t.height
  };
  let N;
  B.top >= e.bottom - 1 ? N = "top" : B.bottom <= e.top + 1 ? N = "bottom" : B.left >= e.right - 1 ? N = "left" : N = c === "bottom" ? "top" : c === "top" ? "bottom" : c === "right" ? "left" : "right";
  const Q = N === "top" || N === "bottom" ? e.left + e.width / 2 - B.left : e.top + e.height / 2 - B.top;
  return { shiftX: u, shiftY: f, arrowSide: N, arrowOffset: Q };
}
function uA(e) {
  let t = e;
  try {
    const r = JSON.parse(e);
    (typeof r == "string" || typeof r == "number") && (t = String(r));
  } catch {
  }
  return () => t;
}
const Ds = (e) => `${e[0]} ${e[1]}`;
function i3(e, t) {
  return `M ${Ds(e)} L ${Ds(t)}`;
}
function s3(e, t) {
  return `M ${e[0] + t} ${e[1]} A ${t} ${t} 0 1 0 ${e[0] - t} ${e[1]} A ${t} ${t} 0 1 0 ${e[0] + t} ${e[1]}`;
}
function fA(e, t, r, n) {
  const o = n - r;
  if (Math.abs(o) >= 359.999)
    return s3(e, t);
  const a = Xt.dir(r, t, e), i = Xt.dir(n, t, e);
  return `M ${Ds(a)} A ${t} ${t} 0 ${Math.abs(o) > 180 ? 1 : 0} ${o >= 0 ? 1 : 0} ${Ds(i)}`;
}
function Qc(e) {
  return e.filter(Boolean).join(" ");
}
function dr(e, t) {
  let r = e.length;
  Array.isArray(e[0]) || (e = [e]), Array.isArray(t[0]) || (t = t.map((i) => [i]));
  let n = t[0].length, o = t[0].map((i, s) => t.map((l) => l[s])), a = e.map((i) => o.map((s) => {
    let l = 0;
    if (!Array.isArray(i)) {
      for (let c of s)
        l += i * c;
      return l;
    }
    for (let c = 0; c < i.length; c++)
      l += i[c] * (s[c] || 0);
    return l;
  }));
  return r === 1 && (a = a[0]), n === 1 ? a.map((i) => i[0]) : a;
}
function t0(e) {
  return ho(e) === "string";
}
function ho(e) {
  return (Object.prototype.toString.call(e).match(/^\[object\s+(.*?)\]$/)[1] || "").toLowerCase();
}
function Ms(e, { precision: t, unit: r }) {
  return yo(e) ? "none" : l3(e, t) + (r ?? "");
}
function yo(e) {
  return Number.isNaN(e) || e instanceof Number && (e == null ? void 0 : e.none);
}
function Dr(e) {
  return yo(e) ? 0 : e;
}
function l3(e, t) {
  if (e === 0)
    return 0;
  let r = ~~e, n = 0;
  r && t && (n = ~~Math.log10(Math.abs(r)) + 1);
  const o = 10 ** (t - n);
  return Math.floor(e * o + 0.5) / o;
}
const dA = {
  deg: 1,
  grad: 0.9,
  rad: 180 / Math.PI,
  turn: 360
};
function c3(e) {
  if (!e)
    return;
  e = e.trim();
  const t = /^([a-z]+)\((.+?)\)$/i, r = /^-?[\d.]+$/, n = /%|deg|g?rad|turn$/, o = /\/?\s*(none|[-\w.]+(?:%|deg|g?rad|turn)?)/g;
  let a = e.match(t);
  if (a) {
    let i = [];
    return a[2].replace(o, (s, l) => {
      let c = l.match(n), u = l;
      if (c) {
        let f = c[0], p = u.slice(0, -f.length);
        f === "%" ? (u = new Number(p / 100), u.type = "<percentage>") : (u = new Number(p * dA[f]), u.type = "<angle>", u.unit = f);
      } else r.test(u) ? (u = new Number(u), u.type = "<number>") : u === "none" && (u = new Number(NaN), u.none = !0);
      s.startsWith("/") && (u = u instanceof Number ? u : new Number(u), u.alpha = !0), typeof u == "object" && u instanceof Number && (u.raw = l), i.push(u);
    }), {
      name: a[1].toLowerCase(),
      rawName: a[1],
      rawArgs: a[2],
      // An argument could be (as of css-color-4):
      // a number, percentage, degrees (hue), ident (in color())
      args: i
    };
  }
}
function u3(e) {
  return e[e.length - 1];
}
function zi(e, t, r) {
  return isNaN(e) ? t : isNaN(t) ? e : e + (t - e) * r;
}
function f3(e, t, r) {
  return (r - e) / (t - e);
}
function Cu(e, t, r) {
  return zi(t[0], t[1], f3(e[0], e[1], r));
}
function d3(e) {
  return e.map((t) => t.split("|").map((r) => {
    r = r.trim();
    let n = r.match(/^(<[a-z]+>)\[(-?[.\d]+),\s*(-?[.\d]+)\]?$/);
    if (n) {
      let o = new String(n[1]);
      return o.range = [+n[2], +n[3]], o;
    }
    return r;
  }));
}
function p3(e, t, r) {
  return Math.max(Math.min(r, t), e);
}
function Ws(e, t) {
  return Math.sign(e) === Math.sign(t) ? e : -e;
}
function Cn(e, t) {
  return Ws(Math.abs(e) ** t, e);
}
function Lu(e, t) {
  return t === 0 ? 0 : e / t;
}
function h3(e, t, r = 0, n = e.length) {
  for (; r < n; ) {
    const o = r + n >> 1;
    e[o] < t ? r = o + 1 : n = o;
  }
  return r;
}
var pA = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  bisectLeft: h3,
  clamp: p3,
  copySign: Ws,
  interpolate: zi,
  interpolateInv: f3,
  isNone: yo,
  isString: t0,
  last: u3,
  mapRange: Cu,
  multiplyMatrices: dr,
  parseCoordGrammar: d3,
  parseFunction: c3,
  serializeNumber: Ms,
  skipNone: Dr,
  spow: Cn,
  toPrecision: l3,
  type: ho,
  zdiv: Lu
});
class hA {
  add(t, r, n) {
    if (typeof arguments[0] != "string") {
      for (var t in arguments[0])
        this.add(t, arguments[0][t], arguments[1]);
      return;
    }
    (Array.isArray(t) ? t : [t]).forEach(function(o) {
      this[o] = this[o] || [], r && this[o][n ? "unshift" : "push"](r);
    }, this);
  }
  run(t, r) {
    this[t] = this[t] || [], this[t].forEach(function(n) {
      n.call(r && r.context ? r.context : r, r);
    });
  }
}
const bo = new hA();
var n2, o2, a2, rn = {
  gamut_mapping: "css",
  precision: 5,
  deltaE: "76",
  // Default deltaE method
  verbose: ((a2 = (o2 = (n2 = globalThis == null ? void 0 : globalThis.process) == null ? void 0 : n2.env) == null ? void 0 : o2.NODE_ENV) == null ? void 0 : a2.toLowerCase()) !== "test",
  warn: function(t) {
    var r, n;
    this.verbose && ((n = (r = globalThis == null ? void 0 : globalThis.console) == null ? void 0 : r.warn) == null || n.call(r, t));
  }
};
const Vr = {
  // for compatibility, the four-digit chromaticity-derived ones everyone else uses
  D50: [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585],
  D65: [0.3127 / 0.329, 1, (1 - 0.3127 - 0.329) / 0.329]
};
function Jc(e) {
  return Array.isArray(e) ? e : Vr[e];
}
function Cs(e, t, r, n = {}) {
  if (e = Jc(e), t = Jc(t), !e || !t)
    throw new TypeError(`Missing white point to convert ${e ? "" : "from"}${!e && !t ? "/" : ""}${t ? "" : "to"}`);
  if (e === t)
    return r;
  let o = { W1: e, W2: t, XYZ: r, options: n };
  if (bo.run("chromatic-adaptation-start", o), o.M || (o.W1 === Vr.D65 && o.W2 === Vr.D50 ? o.M = [
    [1.0479297925449969, 0.022946870601609652, -0.05019226628920524],
    [0.02962780877005599, 0.9904344267538799, -0.017073799063418826],
    [-0.009243040646204504, 0.015055191490298152, 0.7518742814281371]
  ] : o.W1 === Vr.D50 && o.W2 === Vr.D65 && (o.M = [
    [0.955473421488075, -0.02309845494876471, 0.06325924320057072],
    [-0.0283697093338637, 1.0099953980813041, 0.021041441191917323],
    [0.012314014864481998, -0.020507649298898964, 1.330365926242124]
  ])), bo.run("chromatic-adaptation-end", o), o.M)
    return dr(o.M, o.XYZ);
  throw new TypeError("Only Bradford CAT with white points D50 and D65 supported for now.");
}
const mA = /* @__PURE__ */ new Set(["<number>", "<percentage>", "<angle>"]);
function L1(e, t, r, n) {
  return Object.entries(e.coords).map(([a, i], s) => {
    let l = t.coordGrammar[s], c = n[s], u = c == null ? void 0 : c.type, f;
    if (c.none ? f = l.find((m) => mA.has(m)) : f = l.find((m) => m == u), !f) {
      let m = i.name || a;
      throw new TypeError(`${u ?? c.raw} not allowed for ${m} in ${r}()`);
    }
    let p = f.range;
    u === "<percentage>" && (p || (p = [0, 1]));
    let h = i.range || i.refRange;
    return p && h && (n[s] = Cu(p, h, n[s])), f;
  });
}
function m3(e, { meta: t } = {}) {
  var n, o, a, i;
  let r = { str: (n = String(e)) == null ? void 0 : n.trim() };
  if (bo.run("parse-start", r), r.color)
    return r.color;
  if (r.parsed = c3(r.str), r.parsed) {
    let s = r.parsed.name;
    if (s === "color") {
      let l = r.parsed.args.shift(), c = l.startsWith("--") ? l.substring(2) : `--${l}`, u = [l, c], f = r.parsed.rawArgs.indexOf("/") > 0 ? r.parsed.args.pop() : 1;
      for (let m of At.all) {
        let w = m.getFormat("color");
        if (w && (u.includes(w.id) || (o = w.ids) != null && o.filter((A) => u.includes(A)).length)) {
          const A = Object.keys(m.coords).map((B, N) => r.parsed.args[N] || 0);
          let T;
          return w.coordGrammar && (T = L1(m, w, "color", A)), t && Object.assign(t, { formatId: "color", types: T }), w.id.startsWith("--") && !l.startsWith("--") && rn.warn(`${m.name} is a non-standard space and not currently supported in the CSS spec. Use prefixed color(${w.id}) instead of color(${l}).`), l.startsWith("--") && !w.id.startsWith("--") && rn.warn(`${m.name} is a standard space and supported in the CSS spec. Use color(${w.id}) instead of prefixed color(${l}).`), { spaceId: m.id, coords: A, alpha: f };
        }
      }
      let p = "", h = l in At.registry ? l : c;
      if (h in At.registry) {
        let m = (i = (a = At.registry[h].formats) == null ? void 0 : a.color) == null ? void 0 : i.id;
        m && (p = `Did you mean color(${m})?`);
      }
      throw new TypeError(`Cannot parse color(${l}). ` + (p || "Missing a plugin?"));
    } else
      for (let l of At.all) {
        let c = l.getFormat(s);
        if (c && c.type === "function") {
          let u = 1;
          (c.lastAlpha || u3(r.parsed.args).alpha) && (u = r.parsed.args.pop());
          let f = r.parsed.args, p;
          return c.coordGrammar && (p = L1(l, c, s, f)), t && Object.assign(t, { formatId: c.name, types: p }), {
            spaceId: l.id,
            coords: f,
            alpha: u
          };
        }
      }
  } else
    for (let s of At.all)
      for (let l in s.formats) {
        let c = s.formats[l];
        if (c.type !== "custom" || c.test && !c.test(r.str))
          continue;
        let u = c.parse(r.str);
        if (u)
          return u.alpha ?? (u.alpha = 1), t && (t.formatId = l), u;
      }
  throw new TypeError(`Could not parse ${e} as a color. Missing a plugin?`);
}
function qt(e) {
  if (Array.isArray(e))
    return e.map(qt);
  if (!e)
    throw new TypeError("Empty color reference");
  t0(e) && (e = m3(e));
  let t = e.space || e.spaceId;
  return t instanceof At || (e.space = At.get(t)), e.alpha === void 0 && (e.alpha = 1), e;
}
const yA = 75e-6, Xr = class Xr {
  constructor(t) {
    var o;
    this.id = t.id, this.name = t.name, this.base = t.base ? Xr.get(t.base) : null, this.aliases = t.aliases, this.base && (this.fromBase = t.fromBase, this.toBase = t.toBase);
    let r = t.coords ?? this.base.coords;
    for (let a in r)
      "name" in r[a] || (r[a].name = a);
    this.coords = r;
    let n = t.white ?? this.base.white ?? "D65";
    this.white = Jc(n), this.formats = t.formats ?? {};
    for (let a in this.formats) {
      let i = this.formats[a];
      i.type || (i.type = "function"), i.name || (i.name = a);
    }
    (o = this.formats.color) != null && o.id || (this.formats.color = {
      ...this.formats.color ?? {},
      id: t.cssId || this.id
    }), t.gamutSpace ? this.gamutSpace = t.gamutSpace === "self" ? this : Xr.get(t.gamutSpace) : this.isPolar ? this.gamutSpace = this.base : this.gamutSpace = this, this.gamutSpace.isUnbounded && (this.inGamut = (a, i) => !0), this.referred = t.referred, Object.defineProperty(this, "path", {
      value: bA(this).reverse(),
      writable: !1,
      enumerable: !0,
      configurable: !0
    }), bo.run("colorspace-init-end", this);
  }
  inGamut(t, { epsilon: r = yA } = {}) {
    if (!this.equals(this.gamutSpace))
      return t = this.to(this.gamutSpace, t), this.gamutSpace.inGamut(t, { epsilon: r });
    let n = Object.values(this.coords);
    return t.every((o, a) => {
      let i = n[a];
      if (i.type !== "angle" && i.range) {
        if (Number.isNaN(o))
          return !0;
        let [s, l] = i.range;
        return (s === void 0 || o >= s - r) && (l === void 0 || o <= l + r);
      }
      return !0;
    });
  }
  get isUnbounded() {
    return Object.values(this.coords).every((t) => !("range" in t));
  }
  get cssId() {
    var t, r;
    return ((r = (t = this.formats) == null ? void 0 : t.color) == null ? void 0 : r.id) || this.id;
  }
  get isPolar() {
    for (let t in this.coords)
      if (this.coords[t].type === "angle")
        return !0;
    return !1;
  }
  getFormat(t) {
    if (typeof t == "object")
      return t = F1(t, this), t;
    let r;
    return t === "default" ? r = Object.values(this.formats)[0] : r = this.formats[t], r ? (r = F1(r, this), r) : null;
  }
  /**
   * Check if this color space is the same as another color space reference.
   * Allows proxying color space objects and comparing color spaces with ids.
   * @param {string | ColorSpace} space ColorSpace object or id to compare to
   * @returns {boolean}
   */
  equals(t) {
    return t ? this === t || this.id === t || this.id === t.id : !1;
  }
  to(t, r) {
    if (arguments.length === 1) {
      const s = qt(t);
      [t, r] = [s.space, s.coords];
    }
    if (t = Xr.get(t), this.equals(t))
      return r;
    r = r.map((s) => Number.isNaN(s) ? 0 : s);
    let n = this.path, o = t.path, a, i;
    for (let s = 0; s < n.length && n[s].equals(o[s]); s++)
      a = n[s], i = s;
    if (!a)
      throw new Error(`Cannot convert between color spaces ${this} and ${t}: no connection space was found`);
    for (let s = n.length - 1; s > i; s--)
      r = n[s].toBase(r);
    for (let s = i + 1; s < o.length; s++)
      r = o[s].fromBase(r);
    return r;
  }
  from(t, r) {
    if (arguments.length === 1) {
      const n = qt(t);
      [t, r] = [n.space, n.coords];
    }
    return t = Xr.get(t), t.to(this, r);
  }
  toString() {
    return `${this.name} (${this.id})`;
  }
  getMinCoords() {
    let t = [];
    for (let r in this.coords) {
      let n = this.coords[r], o = n.range || n.refRange;
      t.push((o == null ? void 0 : o.min) ?? 0);
    }
    return t;
  }
  // Returns array of unique color spaces
  static get all() {
    return [...new Set(Object.values(Xr.registry))];
  }
  static register(t, r) {
    if (arguments.length === 1 && (r = arguments[0], t = r.id), r = this.get(r), this.registry[t] && this.registry[t] !== r)
      throw new Error(`Duplicate color space registration: '${t}'`);
    if (this.registry[t] = r, arguments.length === 1 && r.aliases)
      for (let n of r.aliases)
        this.register(n, r);
    return r;
  }
  /**
   * Lookup ColorSpace object by name
   * @param {ColorSpace | string} name
   */
  static get(t, ...r) {
    if (!t || t instanceof Xr)
      return t;
    if (ho(t) === "string") {
      let o = Xr.registry[t.toLowerCase()];
      if (!o)
        throw new TypeError(`No color space found with id = "${t}"`);
      return o;
    }
    if (r.length)
      return Xr.get(...r);
    throw new TypeError(`${t} is not a valid color space`);
  }
  /**
   * Get metadata about a coordinate of a color space
   *
   * @static
   * @param {Array | string} ref
   * @param {ColorSpace | string} [workingSpace]
   * @return {Object}
   */
  static resolveCoord(t, r) {
    var l;
    let n = ho(t), o, a;
    if (n === "string" ? t.includes(".") ? [o, a] = t.split(".") : [o, a] = [, t] : Array.isArray(t) ? [o, a] = t : (o = t.space, a = t.coordId), o = Xr.get(o), o || (o = r), !o)
      throw new TypeError(`Cannot resolve coordinate reference ${t}: No color space specified and relative references are not allowed here`);
    if (n = ho(a), n === "number" || n === "string" && a >= 0) {
      let c = Object.entries(o.coords)[a];
      if (c)
        return { space: o, id: c[0], index: a, ...c[1] };
    }
    o = Xr.get(o);
    let i = a.toLowerCase(), s = 0;
    for (let c in o.coords) {
      let u = o.coords[c];
      if (c.toLowerCase() === i || ((l = u.name) == null ? void 0 : l.toLowerCase()) === i)
        return { space: o, id: c, index: s, ...u };
      s++;
    }
    throw new TypeError(`No "${a}" coordinate found in ${o.name}. Its coordinates are: ${Object.keys(o.coords).join(", ")}`);
  }
};
Oo(Xr, "registry", {}), Oo(Xr, "DEFAULT_FORMAT", {
  type: "functions",
  name: "color"
});
let At = Xr;
function bA(e) {
  let t = [e];
  for (let r = e; r = r.base; )
    t.push(r);
  return t;
}
function F1(e, { coords: t } = {}) {
  if (e.coords && !e.coordGrammar) {
    e.type || (e.type = "function"), e.name || (e.name = "color"), e.coordGrammar = d3(e.coords);
    let r = Object.entries(t).map(([n, o], a) => {
      let i = e.coordGrammar[a][0], s = o.range || o.refRange, l = i.range, c = "";
      return i == "<percentage>" ? (l = [0, 100], c = "%") : i == "<angle>" && (c = "deg"), { fromRange: s, toRange: l, suffix: c };
    });
    e.serializeCoords = (n, o) => n.map((a, i) => {
      let { fromRange: s, toRange: l, suffix: c } = r[i];
      return s && l && (a = Cu(s, l, a)), a = Ms(a, { precision: o, unit: c }), a;
    });
  }
  return e;
}
var Nr = new At({
  id: "xyz-d65",
  name: "XYZ D65",
  coords: {
    x: { name: "X" },
    y: { name: "Y" },
    z: { name: "Z" }
  },
  white: "D65",
  formats: {
    color: {
      ids: ["xyz-d65", "xyz"]
    }
  },
  aliases: ["xyz"]
});
class Kr extends At {
  /**
   * Creates a new RGB ColorSpace.
   * If coords are not specified, they will use the default RGB coords.
   * Instead of `fromBase()` and `toBase()` functions,
   * you can specify to/from XYZ matrices and have `toBase()` and `fromBase()` automatically generated.
   * @param {*} options - Same options as {@link ColorSpace} plus:
   * @param {number[][]} options.toXYZ_M - Matrix to convert to XYZ
   * @param {number[][]} options.fromXYZ_M - Matrix to convert from XYZ
   */
  constructor(t) {
    t.coords || (t.coords = {
      r: {
        range: [0, 1],
        name: "Red"
      },
      g: {
        range: [0, 1],
        name: "Green"
      },
      b: {
        range: [0, 1],
        name: "Blue"
      }
    }), t.base || (t.base = Nr), t.toXYZ_M && t.fromXYZ_M && (t.toBase ?? (t.toBase = (r) => {
      let n = dr(t.toXYZ_M, r);
      return this.white !== this.base.white && (n = Cs(this.white, this.base.white, n)), n;
    }), t.fromBase ?? (t.fromBase = (r) => (r = Cs(this.base.white, this.white, r), dr(t.fromXYZ_M, r)))), t.referred ?? (t.referred = "display"), super(t);
  }
}
function r0(e, t) {
  return e = qt(e), !t || e.space.equals(t) ? e.coords.slice() : (t = At.get(t), t.from(e));
}
function en(e, t) {
  e = qt(e);
  let { space: r, index: n } = At.resolveCoord(t, e.space);
  return r0(e, r)[n];
}
function Fu(e, t, r) {
  return e = qt(e), t = At.get(t), e.coords = t.to(e.space, r), e;
}
Fu.returns = "color";
function Kn(e, t, r) {
  if (e = qt(e), arguments.length === 2 && ho(arguments[1]) === "object") {
    let n = arguments[1];
    for (let o in n)
      Kn(e, o, n[o]);
  } else {
    typeof r == "function" && (r = r(en(e, t)));
    let { space: n, index: o } = At.resolveCoord(t, e.space), a = r0(e, n);
    a[o] = r, Fu(e, n, a);
  }
  return e;
}
Kn.returns = "color";
var Ru = new At({
  id: "xyz-d50",
  name: "XYZ D50",
  white: "D50",
  base: Nr,
  fromBase: (e) => Cs(Nr.white, "D50", e),
  toBase: (e) => Cs("D50", Nr.white, e)
});
const gA = 216 / 24389, R1 = 24 / 116, Q0 = 24389 / 27;
let wc = Vr.D50;
var tn = new At({
  id: "lab",
  name: "Lab",
  coords: {
    l: {
      refRange: [0, 100],
      name: "Lightness"
    },
    a: {
      refRange: [-125, 125]
    },
    b: {
      refRange: [-125, 125]
    }
  },
  // Assuming XYZ is relative to D50, convert to CIE Lab
  // from CIE standard, which now defines these as a rational fraction
  white: wc,
  base: Ru,
  // Convert D50-adapted XYX to Lab
  //  CIE 15.3:2004 section 8.2.1.1
  fromBase(e) {
    let r = e.map((n, o) => n / wc[o]).map((n) => n > gA ? Math.cbrt(n) : (Q0 * n + 16) / 116);
    return [
      116 * r[1] - 16,
      // L
      500 * (r[0] - r[1]),
      // a
      200 * (r[1] - r[2])
      // b
    ];
  },
  // Convert Lab to D50-adapted XYZ
  // Same result as CIE 15.3:2004 Appendix D although the derivation is different
  // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
  toBase(e) {
    let t = [];
    return t[1] = (e[0] + 16) / 116, t[0] = e[1] / 500 + t[1], t[2] = t[1] - e[2] / 200, [
      t[0] > R1 ? Math.pow(t[0], 3) : (116 * t[0] - 16) / Q0,
      e[0] > 8 ? Math.pow((e[0] + 16) / 116, 3) : e[0] / Q0,
      t[2] > R1 ? Math.pow(t[2], 3) : (116 * t[2] - 16) / Q0
    ].map((n, o) => n * wc[o]);
  },
  formats: {
    lab: {
      coords: ["<number> | <percentage>", "<number> | <percentage>[-1,1]", "<number> | <percentage>[-1,1]"]
    }
  }
});
function Rn(e) {
  return (e % 360 + 360) % 360;
}
function AA(e, t) {
  if (e === "raw")
    return t;
  let [r, n] = t.map(Rn), o = n - r;
  return e === "increasing" ? o < 0 && (n += 360) : e === "decreasing" ? o > 0 && (r += 360) : e === "longer" ? -180 < o && o < 180 && (o > 0 ? r += 360 : n += 360) : e === "shorter" && (o > 180 ? r += 360 : o < -180 && (n += 360)), [r, n];
}
var ji = new At({
  id: "lch",
  name: "LCH",
  coords: {
    l: {
      refRange: [0, 100],
      name: "Lightness"
    },
    c: {
      refRange: [0, 150],
      name: "Chroma"
    },
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    }
  },
  base: tn,
  fromBase(e) {
    let [t, r, n] = e, o;
    const a = 0.02;
    return Math.abs(r) < a && Math.abs(n) < a ? o = NaN : o = Math.atan2(n, r) * 180 / Math.PI, [
      t,
      // L is still L
      Math.sqrt(r ** 2 + n ** 2),
      // Chroma
      Rn(o)
      // Hue, in degrees [0 to 360)
    ];
  },
  toBase(e) {
    let [t, r, n] = e;
    return r < 0 && (r = 0), isNaN(n) && (n = 0), [
      t,
      // L is still L
      r * Math.cos(n * Math.PI / 180),
      // a
      r * Math.sin(n * Math.PI / 180)
      // b
    ];
  },
  formats: {
    lch: {
      coords: ["<number> | <percentage>", "<number> | <percentage>", "<number> | <angle>"]
    }
  }
});
const O1 = 25 ** 7, Ls = Math.PI, P1 = 180 / Ls, Aa = Ls / 180;
function I1(e) {
  const t = e * e;
  return t * t * t * e;
}
function y3(e, t, { kL: r = 1, kC: n = 1, kH: o = 1 } = {}) {
  [e, t] = qt([e, t]);
  let [a, i, s] = tn.from(e), l = ji.from(tn, [a, i, s])[1], [c, u, f] = tn.from(t), p = ji.from(tn, [c, u, f])[1];
  l < 0 && (l = 0), p < 0 && (p = 0);
  let h = (l + p) / 2, m = I1(h), w = 0.5 * (1 - Math.sqrt(m / (m + O1))), A = (1 + w) * i, T = (1 + w) * u, B = Math.sqrt(A ** 2 + s ** 2), N = Math.sqrt(T ** 2 + f ** 2), Q = A === 0 && s === 0 ? 0 : Math.atan2(s, A), O = T === 0 && f === 0 ? 0 : Math.atan2(f, T);
  Q < 0 && (Q += 2 * Ls), O < 0 && (O += 2 * Ls), Q *= P1, O *= P1;
  let M = c - a, X = N - B, G = O - Q, oe = Q + O, ue = Math.abs(G), K;
  B * N === 0 ? K = 0 : ue <= 180 ? K = G : G > 180 ? K = G - 360 : G < -180 ? K = G + 360 : rn.warn("the unthinkable has happened");
  let pe = 2 * Math.sqrt(N * B) * Math.sin(K * Aa / 2), be = (a + c) / 2, Ce = (B + N) / 2, We = I1(Ce), re;
  B * N === 0 ? re = oe : ue <= 180 ? re = oe / 2 : oe < 360 ? re = (oe + 360) / 2 : re = (oe - 360) / 2;
  let F = (be - 50) ** 2, z = 1 + 0.015 * F / Math.sqrt(20 + F), we = 1 + 0.045 * Ce, Oe = 1;
  Oe -= 0.17 * Math.cos((re - 30) * Aa), Oe += 0.24 * Math.cos(2 * re * Aa), Oe += 0.32 * Math.cos((3 * re + 6) * Aa), Oe -= 0.2 * Math.cos((4 * re - 63) * Aa);
  let ot = 1 + 0.015 * Ce * Oe, st = 30 * Math.exp(-1 * ((re - 275) / 25) ** 2), wt = 2 * Math.sqrt(We / (We + O1)), ae = -1 * Math.sin(2 * st * Aa) * wt, _ = (M / (r * z)) ** 2;
  return _ += (X / (n * we)) ** 2, _ += (pe / (o * ot)) ** 2, _ += ae * (X / (n * we)) * (pe / (o * ot)), Math.sqrt(_);
}
const vA = [
  [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
  [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
  [0.0481771893596242, 0.2642395317527308, 0.6335478284694309]
], wA = [
  [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
  [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
  [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816]
], xA = [
  [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
  [1.9779985324311684, -2.42859224204858, 0.450593709617411],
  [0.0259040424655478, 0.7827717124575296, -0.8086757549230774]
], _A = [
  [1, 0.3963377773761749, 0.2158037573099136],
  [1, -0.1055613458156586, -0.0638541728258133],
  [1, -0.0894841775298119, -1.2914855480194092]
];
var Na = new At({
  id: "oklab",
  name: "Oklab",
  coords: {
    l: {
      refRange: [0, 1],
      name: "Lightness"
    },
    a: {
      refRange: [-0.4, 0.4]
    },
    b: {
      refRange: [-0.4, 0.4]
    }
  },
  // Note that XYZ is relative to D65
  white: "D65",
  base: Nr,
  fromBase(e) {
    let r = dr(vA, e).map((n) => Math.cbrt(n));
    return dr(xA, r);
  },
  toBase(e) {
    let r = dr(_A, e).map((n) => n ** 3);
    return dr(wA, r);
  },
  formats: {
    oklab: {
      coords: ["<percentage> | <number>", "<number> | <percentage>[-1,1]", "<number> | <percentage>[-1,1]"]
    }
  }
});
function eu(e, t) {
  [e, t] = qt([e, t]);
  let [r, n, o] = Na.from(e), [a, i, s] = Na.from(t), l = r - a, c = n - i, u = o - s;
  return Math.sqrt(l ** 2 + c ** 2 + u ** 2);
}
const EA = 75e-6;
function zo(e, t, { epsilon: r = EA } = {}) {
  e = qt(e), t || (t = e.space), t = At.get(t);
  let n = e.coords;
  return t !== e.space && (n = t.from(e)), t.inGamut(n, { epsilon: r });
}
function Ga(e) {
  return {
    space: e.space,
    coords: e.coords.slice(),
    alpha: e.alpha
  };
}
function b3(e, t, r = "lab") {
  r = At.get(r);
  let n = r.from(e), o = r.from(t);
  return Math.sqrt(n.reduce((a, i, s) => {
    let l = o[s];
    return isNaN(i) || isNaN(l) ? a : a + (l - i) ** 2;
  }, 0));
}
function SA(e, t) {
  return b3(e, t, "lab");
}
const kA = Math.PI, B1 = kA / 180;
function TA(e, t, { l: r = 2, c: n = 1 } = {}) {
  [e, t] = qt([e, t]);
  let [o, a, i] = tn.from(e), [, s, l] = ji.from(tn, [o, a, i]), [c, u, f] = tn.from(t), p = ji.from(tn, [c, u, f])[1];
  s < 0 && (s = 0), p < 0 && (p = 0);
  let h = o - c, m = s - p, w = a - u, A = i - f, T = w ** 2 + A ** 2 - m ** 2, B = 0.511;
  o >= 16 && (B = 0.040975 * o / (1 + 0.01765 * o));
  let N = 0.0638 * s / (1 + 0.0131 * s) + 0.638, Q;
  Number.isNaN(l) && (l = 0), l >= 164 && l <= 345 ? Q = 0.56 + Math.abs(0.2 * Math.cos((l + 168) * B1)) : Q = 0.36 + Math.abs(0.4 * Math.cos((l + 35) * B1));
  let O = Math.pow(s, 4), M = Math.sqrt(O / (O + 1900)), X = N * (M * Q + 1 - M), G = (h / (r * B)) ** 2;
  return G += (m / (n * N)) ** 2, G += T / X ** 2, Math.sqrt(G);
}
const N1 = 203;
var Ou = new At({
  // Absolute CIE XYZ, with a D65 whitepoint,
  // as used in most HDR colorspaces as a starting point.
  // SDR spaces are converted per BT.2048
  // so that diffuse, media white is 203 cd/m²
  id: "xyz-abs-d65",
  cssId: "--xyz-abs-d65",
  name: "Absolute XYZ D65",
  coords: {
    x: {
      refRange: [0, 9504.7],
      name: "Xa"
    },
    y: {
      refRange: [0, 1e4],
      name: "Ya"
    },
    z: {
      refRange: [0, 10888.3],
      name: "Za"
    }
  },
  base: Nr,
  fromBase(e) {
    return e.map((t) => Math.max(t * N1, 0));
  },
  toBase(e) {
    return e.map((t) => Math.max(t / N1, 0));
  }
});
const J0 = 1.15, es = 0.66, G1 = 2610 / 2 ** 14, DA = 2 ** 14 / 2610, q1 = 3424 / 2 ** 12, $1 = 2413 / 2 ** 7, z1 = 2392 / 2 ** 7, MA = 1.7 * 2523 / 2 ** 5, j1 = 2 ** 5 / (1.7 * 2523), ts = -0.56, xc = 16295499532821565e-27, CA = [
  [0.41478972, 0.579999, 0.014648],
  [-0.20151, 1.120649, 0.0531008],
  [-0.0166008, 0.2648, 0.6684799]
], LA = [
  [1.9242264357876067, -1.0047923125953657, 0.037651404030618],
  [0.35031676209499907, 0.7264811939316552, -0.06538442294808501],
  [-0.09098281098284752, -0.3127282905230739, 1.5227665613052603]
], FA = [
  [0.5, 0.5, 0],
  [3.524, -4.066708, 0.542708],
  [0.199076, 1.096799, -1.295875]
], RA = [
  [1, 0.1386050432715393, 0.05804731615611886],
  [0.9999999999999999, -0.1386050432715393, -0.05804731615611886],
  [0.9999999999999998, -0.09601924202631895, -0.8118918960560388]
];
var g3 = new At({
  id: "jzazbz",
  name: "Jzazbz",
  coords: {
    jz: {
      refRange: [0, 1],
      name: "Jz"
    },
    az: {
      refRange: [-0.5, 0.5]
    },
    bz: {
      refRange: [-0.5, 0.5]
    }
  },
  base: Ou,
  fromBase(e) {
    let [t, r, n] = e, o = J0 * t - (J0 - 1) * n, a = es * r - (es - 1) * t, s = dr(CA, [o, a, n]).map(function(p) {
      let h = q1 + $1 * (p / 1e4) ** G1, m = 1 + z1 * (p / 1e4) ** G1;
      return (h / m) ** MA;
    }), [l, c, u] = dr(FA, s);
    return [(1 + ts) * l / (1 + ts * l) - xc, c, u];
  },
  toBase(e) {
    let [t, r, n] = e, o = (t + xc) / (1 + ts - ts * (t + xc)), i = dr(RA, [o, r, n]).map(function(p) {
      let h = q1 - p ** j1, m = z1 * p ** j1 - $1;
      return 1e4 * (h / m) ** DA;
    }), [s, l, c] = dr(LA, i), u = (s + (J0 - 1) * c) / J0, f = (l + (es - 1) * u) / es;
    return [u, f, c];
  },
  formats: {
    // https://drafts.csswg.org/css-color-hdr/#Jzazbz
    color: {
      coords: ["<number> | <percentage>", "<number> | <percentage>[-1,1]", "<number> | <percentage>[-1,1]"]
    }
  }
}), tu = new At({
  id: "jzczhz",
  name: "JzCzHz",
  coords: {
    jz: {
      refRange: [0, 1],
      name: "Jz"
    },
    cz: {
      refRange: [0, 1],
      name: "Chroma"
    },
    hz: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    }
  },
  base: g3,
  fromBase(e) {
    let [t, r, n] = e, o;
    const a = 2e-4;
    return Math.abs(r) < a && Math.abs(n) < a ? o = NaN : o = Math.atan2(n, r) * 180 / Math.PI, [
      t,
      // Jz is still Jz
      Math.sqrt(r ** 2 + n ** 2),
      // Chroma
      Rn(o)
      // Hue, in degrees [0 to 360)
    ];
  },
  toBase(e) {
    return [
      e[0],
      // Jz is still Jz
      e[1] * Math.cos(e[2] * Math.PI / 180),
      // az
      e[1] * Math.sin(e[2] * Math.PI / 180)
      // bz
    ];
  }
});
function OA(e, t) {
  [e, t] = qt([e, t]);
  let [r, n, o] = tu.from(e), [a, i, s] = tu.from(t), l = r - a, c = n - i;
  Number.isNaN(o) && Number.isNaN(s) ? (o = 0, s = 0) : Number.isNaN(o) ? o = s : Number.isNaN(s) && (s = o);
  let u = o - s, f = 2 * Math.sqrt(n * i) * Math.sin(u / 2 * (Math.PI / 180));
  return Math.sqrt(l ** 2 + c ** 2 + f ** 2);
}
const A3 = 3424 / 4096, v3 = 2413 / 128, w3 = 2392 / 128, H1 = 2610 / 16384, PA = 2523 / 32, IA = 16384 / 2610, U1 = 32 / 2523, BA = [
  [0.3592832590121217, 0.6976051147779502, -0.035891593232029],
  [-0.1920808463704993, 1.100476797037432, 0.0753748658519118],
  [0.0070797844607479, 0.0748396662186362, 0.8433265453898765]
], NA = [
  [2048 / 4096, 2048 / 4096, 0],
  [6610 / 4096, -13613 / 4096, 7003 / 4096],
  [17933 / 4096, -17390 / 4096, -543 / 4096]
], GA = [
  [0.9999999999999998, 0.0086090370379328, 0.111029625003026],
  [0.9999999999999998, -0.0086090370379328, -0.1110296250030259],
  [0.9999999999999998, 0.5600313357106791, -0.3206271749873188]
], qA = [
  [2.0701522183894223, -1.3263473389671563, 0.2066510476294053],
  [0.3647385209748072, 0.6805660249472273, -0.0453045459220347],
  [-0.0497472075358123, -0.0492609666966131, 1.1880659249923042]
];
var ru = new At({
  id: "ictcp",
  name: "ICTCP",
  // From BT.2100-2 page 7:
  // During production, signal values are expected to exceed the
  // range E′ = [0.0 : 1.0]. This provides processing headroom and avoids
  // signal degradation during cascaded processing. Such values of E′,
  // below 0.0 or exceeding 1.0, should not be clipped during production
  // and exchange.
  // Values below 0.0 should not be clipped in reference displays (even
  // though they represent “negative” light) to allow the black level of
  // the signal (LB) to be properly set using test signals known as “PLUGE”
  coords: {
    i: {
      refRange: [0, 1],
      // Constant luminance,
      name: "I"
    },
    ct: {
      refRange: [-0.5, 0.5],
      // Full BT.2020 gamut in range [-0.5, 0.5]
      name: "CT"
    },
    cp: {
      refRange: [-0.5, 0.5],
      name: "CP"
    }
  },
  base: Ou,
  fromBase(e) {
    let t = dr(BA, e);
    return $A(t);
  },
  toBase(e) {
    let t = zA(e);
    return dr(qA, t);
  }
});
function $A(e) {
  let t = e.map(function(r) {
    let n = A3 + v3 * (r / 1e4) ** H1, o = 1 + w3 * (r / 1e4) ** H1;
    return (n / o) ** PA;
  });
  return dr(NA, t);
}
function zA(e) {
  return dr(GA, e).map(function(n) {
    let o = Math.max(n ** U1 - A3, 0), a = v3 - w3 * n ** U1;
    return 1e4 * (o / a) ** IA;
  });
}
function jA(e, t) {
  [e, t] = qt([e, t]);
  let [r, n, o] = ru.from(e), [a, i, s] = ru.from(t);
  return 720 * Math.sqrt((r - a) ** 2 + 0.25 * (n - i) ** 2 + (o - s) ** 2);
}
const HA = Vr.D65, x3 = 0.42, V1 = 1 / x3, _c = 2 * Math.PI, _3 = [
  [0.401288, 0.650173, -0.051461],
  [-0.250268, 1.204414, 0.045854],
  [-2079e-6, 0.048952, 0.953127]
], UA = [
  [1.8620678550872327, -1.0112546305316843, 0.14918677544445175],
  [0.38752654323613717, 0.6214474419314753, -0.008973985167612518],
  [-0.015841498849333856, -0.03412293802851557, 1.0499644368778496]
], VA = [
  [460, 451, 288],
  [460, -891, -261],
  [460, -220, -6300]
], WA = {
  dark: [0.8, 0.525, 0.8],
  dim: [0.9, 0.59, 0.9],
  average: [1, 0.69, 1]
}, Bo = {
  // Red, Yellow, Green, Blue, Red
  h: [20.14, 90, 164.25, 237.53, 380.14],
  e: [0.8, 0.7, 1, 1.2, 0.8],
  H: [0, 100, 200, 300, 400]
}, XA = 180 / Math.PI, W1 = Math.PI / 180;
function E3(e, t) {
  return e.map((n) => {
    const o = Cn(t * Math.abs(n) * 0.01, x3);
    return 400 * Ws(o, n) / (o + 27.13);
  });
}
function YA(e, t) {
  const r = 100 / t * 27.13 ** V1;
  return e.map((n) => {
    const o = Math.abs(n);
    return Ws(r * Cn(o / (400 - o), V1), n);
  });
}
function KA(e) {
  let t = Rn(e);
  t <= Bo.h[0] && (t += 360);
  const r = h3(Bo.h, t) - 1, [n, o] = Bo.h.slice(r, r + 2), [a, i] = Bo.e.slice(r, r + 2), s = Bo.H[r], l = (t - n) / a;
  return s + 100 * l / (l + (o - t) / i);
}
function ZA(e) {
  let t = (e % 400 + 400) % 400;
  const r = Math.floor(0.01 * t);
  t = t % 100;
  const [n, o] = Bo.h.slice(r, r + 2), [a, i] = Bo.e.slice(r, r + 2);
  return Rn(
    (t * (i * n - a * o) - 100 * n * i) / (t * (i - a) - 100 * i)
  );
}
function S3(e, t, r, n, o) {
  const a = {};
  a.discounting = o, a.refWhite = e, a.surround = n;
  const i = e.map((w) => w * 100);
  a.la = t, a.yb = r;
  const s = i[1], l = dr(_3, i);
  n = WA[a.surround];
  const c = n[0];
  a.c = n[1], a.nc = n[2];
  const f = (1 / (5 * a.la + 1)) ** 4;
  a.fl = f * a.la + 0.1 * (1 - f) * (1 - f) * Math.cbrt(5 * a.la), a.flRoot = a.fl ** 0.25, a.n = a.yb / s, a.z = 1.48 + Math.sqrt(a.n), a.nbb = 0.725 * a.n ** -0.2, a.ncb = a.nbb;
  const p = Math.max(
    Math.min(c * (1 - 1 / 3.6 * Math.exp((-a.la - 42) / 92)), 1),
    0
  );
  a.dRgb = l.map((w) => zi(1, s / w, p)), a.dRgbInv = a.dRgb.map((w) => 1 / w);
  const h = l.map((w, A) => w * a.dRgb[A]), m = E3(h, a.fl);
  return a.aW = a.nbb * (2 * m[0] + m[1] + 0.05 * m[2]), a;
}
const X1 = S3(
  HA,
  64 / Math.PI * 0.2,
  20,
  "average",
  !1
);
function nu(e, t) {
  if (!(e.J !== void 0 ^ e.Q !== void 0))
    throw new Error("Conversion requires one and only one: 'J' or 'Q'");
  if (!(e.C !== void 0 ^ e.M !== void 0 ^ e.s !== void 0))
    throw new Error("Conversion requires one and only one: 'C', 'M' or 's'");
  if (!(e.h !== void 0 ^ e.H !== void 0))
    throw new Error("Conversion requires one and only one: 'h' or 'H'");
  if (e.J === 0 || e.Q === 0)
    return [0, 0, 0];
  let r = 0;
  e.h !== void 0 ? r = Rn(e.h) * W1 : r = ZA(e.H) * W1;
  const n = Math.cos(r), o = Math.sin(r);
  let a = 0;
  e.J !== void 0 ? a = Cn(e.J, 1 / 2) * 0.1 : e.Q !== void 0 && (a = 0.25 * t.c * e.Q / ((t.aW + 4) * t.flRoot));
  let i = 0;
  e.C !== void 0 ? i = e.C / a : e.M !== void 0 ? i = e.M / t.flRoot / a : e.s !== void 0 && (i = 4e-4 * e.s ** 2 * (t.aW + 4) / t.c);
  const s = Cn(
    i * Math.pow(1.64 - Math.pow(0.29, t.n), -0.73),
    10 / 9
  ), l = 0.25 * (Math.cos(r + 2) + 3.8), c = t.aW * Cn(a, 2 / t.c / t.z), u = 5e4 / 13 * t.nc * t.ncb * l, f = c / t.nbb, p = 23 * (f + 0.305) * Lu(s, 23 * u + s * (11 * n + 108 * o)), h = p * n, m = p * o, w = YA(
    dr(VA, [f, h, m]).map((A) => A * 1 / 1403),
    t.fl
  );
  return dr(
    UA,
    w.map((A, T) => A * t.dRgbInv[T])
  ).map((A) => A / 100);
}
function k3(e, t) {
  const r = e.map((N) => N * 100), n = E3(
    dr(_3, r).map((N, Q) => N * t.dRgb[Q]),
    t.fl
  ), o = n[0] + (-12 * n[1] + n[2]) / 11, a = (n[0] + n[1] - 2 * n[2]) / 9, i = (Math.atan2(a, o) % _c + _c) % _c, s = 0.25 * (Math.cos(i + 2) + 3.8), l = 5e4 / 13 * t.nc * t.ncb * Lu(
    s * Math.sqrt(o ** 2 + a ** 2),
    n[0] + n[1] + 1.05 * n[2] + 0.305
  ), c = Cn(l, 0.9) * Math.pow(1.64 - Math.pow(0.29, t.n), 0.73), u = t.nbb * (2 * n[0] + n[1] + 0.05 * n[2]), f = Cn(u / t.aW, 0.5 * t.c * t.z), p = 100 * Cn(f, 2), h = 4 / t.c * f * (t.aW + 4) * t.flRoot, m = c * f, w = m * t.flRoot, A = Rn(i * XA), T = KA(A), B = 50 * Cn(t.c * c / (t.aW + 4), 1 / 2);
  return { J: p, C: m, h: A, s: B, Q: h, M: w, H: T };
}
var QA = new At({
  id: "cam16-jmh",
  cssId: "--cam16-jmh",
  name: "CAM16-JMh",
  coords: {
    j: {
      refRange: [0, 100],
      name: "J"
    },
    m: {
      refRange: [0, 105],
      name: "Colorfulness"
    },
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    }
  },
  base: Nr,
  fromBase(e) {
    const t = k3(e, X1);
    return [t.J, t.M, t.h];
  },
  toBase(e) {
    return nu(
      { J: e[0], M: e[1], h: e[2] },
      X1
    );
  }
});
const JA = Vr.D65, e7 = 216 / 24389, T3 = 24389 / 27;
function t7(e) {
  return 116 * (e > e7 ? Math.cbrt(e) : (T3 * e + 16) / 116) - 16;
}
function ou(e) {
  return e > 8 ? Math.pow((e + 16) / 116, 3) : e / T3;
}
function r7(e, t) {
  let [r, n, o] = e, a = [], i = 0;
  if (o === 0)
    return [0, 0, 0];
  let s = ou(o);
  o > 0 ? i = 0.00379058511492914 * o ** 2 + 0.608983189401032 * o + 0.9155088574762233 : i = 9514440756550361e-21 * o ** 2 + 0.08693057439788597 * o - 21.928975842194614;
  const l = 2e-12, c = 15;
  let u = 0, f = 1 / 0;
  for (; u <= c; ) {
    a = nu({ J: i, C: n, h: r }, t);
    const p = Math.abs(a[1] - s);
    if (p < f) {
      if (p <= l)
        return a;
      f = p;
    }
    i = i - (a[1] - s) * i / (2 * a[1]), u += 1;
  }
  return nu({ J: i, C: n, h: r }, t);
}
function n7(e, t) {
  const r = t7(e[1]);
  if (r === 0)
    return [0, 0, 0];
  const n = k3(e, Pu);
  return [Rn(n.h), n.C, r];
}
const Pu = S3(
  JA,
  200 / Math.PI * ou(50),
  ou(50) * 100,
  "average",
  !1
);
var Hi = new At({
  id: "hct",
  name: "HCT",
  coords: {
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    },
    c: {
      refRange: [0, 145],
      name: "Colorfulness"
    },
    t: {
      refRange: [0, 100],
      name: "Tone"
    }
  },
  base: Nr,
  fromBase(e) {
    return n7(e);
  },
  toBase(e) {
    return r7(e, Pu);
  },
  formats: {
    color: {
      id: "--hct",
      coords: ["<number> | <angle>", "<percentage> | <number>", "<percentage> | <number>"]
    }
  }
});
const o7 = Math.PI / 180, Y1 = [1, 7e-3, 0.0228];
function K1(e) {
  e[1] < 0 && (e = Hi.fromBase(Hi.toBase(e)));
  const t = Math.log(Math.max(1 + Y1[2] * e[1] * Pu.flRoot, 1)) / Y1[2], r = e[0] * o7, n = t * Math.cos(r), o = t * Math.sin(r);
  return [e[2], n, o];
}
function a7(e, t) {
  [e, t] = qt([e, t]);
  let [r, n, o] = K1(Hi.from(e)), [a, i, s] = K1(Hi.from(t));
  return Math.sqrt((r - a) ** 2 + (n - i) ** 2 + (o - s) ** 2);
}
var qa = {
  deltaE76: SA,
  deltaECMC: TA,
  deltaE2000: y3,
  deltaEJz: OA,
  deltaEITP: jA,
  deltaEOK: eu,
  deltaEHCT: a7
};
function i7(e) {
  const t = e ? Math.floor(Math.log10(Math.abs(e))) : 0;
  return Math.max(parseFloat(`1e${t - 2}`), 1e-6);
}
const Z1 = {
  hct: {
    method: "hct.c",
    jnd: 2,
    deltaEMethod: "hct",
    blackWhiteClamp: {}
  },
  "hct-tonal": {
    method: "hct.c",
    jnd: 0,
    deltaEMethod: "hct",
    blackWhiteClamp: { channel: "hct.t", min: 0, max: 100 }
  }
};
function go(e, {
  method: t = rn.gamut_mapping,
  space: r = void 0,
  deltaEMethod: n = "",
  jnd: o = 2,
  blackWhiteClamp: a = {}
} = {}) {
  if (e = qt(e), t0(arguments[1]) ? r = arguments[1] : r || (r = e.space), r = At.get(r), zo(e, r, { epsilon: 0 }))
    return e;
  let i;
  if (t === "css")
    i = s7(e, { space: r });
  else {
    if (t !== "clip" && !zo(e, r)) {
      Object.prototype.hasOwnProperty.call(Z1, t) && ({ method: t, jnd: o, deltaEMethod: n, blackWhiteClamp: a } = Z1[t]);
      let s = y3;
      if (n !== "") {
        for (let c in qa)
          if ("deltae" + n.toLowerCase() === c.toLowerCase()) {
            s = qa[c];
            break;
          }
      }
      let l = go(fr(e, r), { method: "clip", space: r });
      if (s(e, l) > o) {
        if (Object.keys(a).length === 3) {
          let B = At.resolveCoord(a.channel), N = en(fr(e, B.space), B.id);
          if (yo(N) && (N = 0), N >= a.max)
            return fr({ space: "xyz-d65", coords: Vr.D65 }, e.space);
          if (N <= a.min)
            return fr({ space: "xyz-d65", coords: [0, 0, 0] }, e.space);
        }
        let c = At.resolveCoord(t), u = c.space, f = c.id, p = fr(e, u);
        p.coords.forEach((B, N) => {
          yo(B) && (p.coords[N] = 0);
        });
        let m = (c.range || c.refRange)[0], w = i7(o), A = m, T = en(p, f);
        for (; T - A > w; ) {
          let B = Ga(p);
          B = go(B, { space: r, method: "clip" }), s(p, B) - o < w ? A = en(p, f) : T = en(p, f), Kn(p, f, (A + T) / 2);
        }
        i = fr(p, r);
      } else
        i = l;
    } else
      i = fr(e, r);
    if (t === "clip" || !zo(i, r, { epsilon: 0 })) {
      let s = Object.values(r.coords).map((l) => l.range || []);
      i.coords = i.coords.map((l, c) => {
        let [u, f] = s[c];
        return u !== void 0 && (l = Math.max(u, l)), f !== void 0 && (l = Math.min(l, f)), l;
      });
    }
  }
  return r !== e.space && (i = fr(i, e.space)), e.coords = i.coords, e;
}
go.returns = "color";
const Q1 = {
  WHITE: { space: Na, coords: [1, 0, 0] },
  BLACK: { space: Na, coords: [0, 0, 0] }
};
function s7(e, { space: t } = {}) {
  e = qt(e), t || (t = e.space), t = At.get(t);
  const o = At.get("oklch");
  if (t.isUnbounded)
    return fr(e, t);
  const a = fr(e, o);
  let i = a.coords[0];
  if (i >= 1) {
    const m = fr(Q1.WHITE, t);
    return m.alpha = e.alpha, fr(m, t);
  }
  if (i <= 0) {
    const m = fr(Q1.BLACK, t);
    return m.alpha = e.alpha, fr(m, t);
  }
  if (zo(a, t, { epsilon: 0 }))
    return fr(a, t);
  function s(m) {
    const w = fr(m, t), A = Object.values(t.coords);
    return w.coords = w.coords.map((T, B) => {
      if ("range" in A[B]) {
        const [N, Q] = A[B].range;
        return p3(N, T, Q);
      }
      return T;
    }), w;
  }
  let l = 0, c = a.coords[1], u = !0, f = Ga(a), p = s(f), h = eu(p, f);
  if (h < 0.02)
    return p;
  for (; c - l > 1e-4; ) {
    const m = (l + c) / 2;
    if (f.coords[1] = m, u && zo(f, t, { epsilon: 0 }))
      l = m;
    else if (p = s(f), h = eu(p, f), h < 0.02) {
      if (0.02 - h < 1e-4)
        break;
      u = !1, l = m;
    } else
      c = m;
  }
  return p;
}
function fr(e, t, { inGamut: r } = {}) {
  e = qt(e), t = At.get(t);
  let n = t.from(e), o = { space: t, coords: n, alpha: e.alpha };
  return r && (o = go(o, r === !0 ? void 0 : r)), o;
}
fr.returns = "color";
function Fi(e, {
  precision: t = rn.precision,
  format: r = "default",
  inGamut: n = !0,
  ...o
} = {}) {
  var l;
  let a;
  e = qt(e);
  let i = r;
  r = e.space.getFormat(r) ?? e.space.getFormat("default") ?? At.DEFAULT_FORMAT;
  let s = e.coords.slice();
  if (n || (n = r.toGamut), n && !zo(e) && (s = go(Ga(e), n === !0 ? void 0 : n).coords), r.type === "custom")
    if (o.precision = t, r.serialize)
      a = r.serialize(s, e.alpha, o);
    else
      throw new TypeError(`format ${i} can only be used to parse colors, not for serialization`);
  else {
    let c = r.name || "color";
    r.serializeCoords ? s = r.serializeCoords(s, t) : t !== null && (s = s.map((h) => Ms(h, { precision: t })));
    let u = [...s];
    if (c === "color") {
      let h = r.id || ((l = r.ids) == null ? void 0 : l[0]) || e.space.id;
      u.unshift(h);
    }
    let f = e.alpha;
    t !== null && (f = Ms(f, { precision: t }));
    let p = e.alpha >= 1 || r.noAlpha ? "" : `${r.commas ? "," : " /"} ${f}`;
    a = `${c}(${u.join(r.commas ? ", " : " ")}${p})`;
  }
  return a;
}
const l7 = [
  [0.6369580483012914, 0.14461690358620832, 0.1688809751641721],
  [0.2627002120112671, 0.6779980715188708, 0.05930171646986196],
  [0, 0.028072693049087428, 1.060985057710791]
], c7 = [
  [1.716651187971268, -0.355670783776392, -0.25336628137366],
  [-0.666684351832489, 1.616481236634939, 0.0157685458139111],
  [0.017639857445311, -0.042770613257809, 0.942103121235474]
];
var Xs = new Kr({
  id: "rec2020-linear",
  cssId: "--rec2020-linear",
  name: "Linear REC.2020",
  white: "D65",
  toXYZ_M: l7,
  fromXYZ_M: c7
});
const rs = 1.09929682680944, J1 = 0.018053968510807;
var D3 = new Kr({
  id: "rec2020",
  name: "REC.2020",
  base: Xs,
  // Non-linear transfer function from Rec. ITU-R BT.2020-2 table 4
  toBase(e) {
    return e.map(function(t) {
      return t < J1 * 4.5 ? t / 4.5 : Math.pow((t + rs - 1) / rs, 1 / 0.45);
    });
  },
  fromBase(e) {
    return e.map(function(t) {
      return t >= J1 ? rs * Math.pow(t, 0.45) - (rs - 1) : 4.5 * t;
    });
  }
});
const u7 = [
  [0.4865709486482162, 0.26566769316909306, 0.1982172852343625],
  [0.2289745640697488, 0.6917385218365064, 0.079286914093745],
  [0, 0.04511338185890264, 1.043944368900976]
], f7 = [
  [2.493496911941425, -0.9313836179191239, -0.40271078445071684],
  [-0.8294889695615747, 1.7626640603183463, 0.023624685841943577],
  [0.03584583024378447, -0.07617238926804182, 0.9568845240076872]
];
var M3 = new Kr({
  id: "p3-linear",
  cssId: "--display-p3-linear",
  name: "Linear P3",
  white: "D65",
  toXYZ_M: u7,
  fromXYZ_M: f7
});
const d7 = [
  [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
  [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
  [0.01933081871559182, 0.11919477979462598, 0.9505321522496607]
], Rr = [
  [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
  [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
  [0.05563007969699366, -0.20397695888897652, 1.0569715142428786]
];
var C3 = new Kr({
  id: "srgb-linear",
  name: "Linear sRGB",
  white: "D65",
  toXYZ_M: d7,
  fromXYZ_M: Rr
}), ep = {
  aliceblue: [240 / 255, 248 / 255, 1],
  antiquewhite: [250 / 255, 235 / 255, 215 / 255],
  aqua: [0, 1, 1],
  aquamarine: [127 / 255, 1, 212 / 255],
  azure: [240 / 255, 1, 1],
  beige: [245 / 255, 245 / 255, 220 / 255],
  bisque: [1, 228 / 255, 196 / 255],
  black: [0, 0, 0],
  blanchedalmond: [1, 235 / 255, 205 / 255],
  blue: [0, 0, 1],
  blueviolet: [138 / 255, 43 / 255, 226 / 255],
  brown: [165 / 255, 42 / 255, 42 / 255],
  burlywood: [222 / 255, 184 / 255, 135 / 255],
  cadetblue: [95 / 255, 158 / 255, 160 / 255],
  chartreuse: [127 / 255, 1, 0],
  chocolate: [210 / 255, 105 / 255, 30 / 255],
  coral: [1, 127 / 255, 80 / 255],
  cornflowerblue: [100 / 255, 149 / 255, 237 / 255],
  cornsilk: [1, 248 / 255, 220 / 255],
  crimson: [220 / 255, 20 / 255, 60 / 255],
  cyan: [0, 1, 1],
  darkblue: [0, 0, 139 / 255],
  darkcyan: [0, 139 / 255, 139 / 255],
  darkgoldenrod: [184 / 255, 134 / 255, 11 / 255],
  darkgray: [169 / 255, 169 / 255, 169 / 255],
  darkgreen: [0, 100 / 255, 0],
  darkgrey: [169 / 255, 169 / 255, 169 / 255],
  darkkhaki: [189 / 255, 183 / 255, 107 / 255],
  darkmagenta: [139 / 255, 0, 139 / 255],
  darkolivegreen: [85 / 255, 107 / 255, 47 / 255],
  darkorange: [1, 140 / 255, 0],
  darkorchid: [153 / 255, 50 / 255, 204 / 255],
  darkred: [139 / 255, 0, 0],
  darksalmon: [233 / 255, 150 / 255, 122 / 255],
  darkseagreen: [143 / 255, 188 / 255, 143 / 255],
  darkslateblue: [72 / 255, 61 / 255, 139 / 255],
  darkslategray: [47 / 255, 79 / 255, 79 / 255],
  darkslategrey: [47 / 255, 79 / 255, 79 / 255],
  darkturquoise: [0, 206 / 255, 209 / 255],
  darkviolet: [148 / 255, 0, 211 / 255],
  deeppink: [1, 20 / 255, 147 / 255],
  deepskyblue: [0, 191 / 255, 1],
  dimgray: [105 / 255, 105 / 255, 105 / 255],
  dimgrey: [105 / 255, 105 / 255, 105 / 255],
  dodgerblue: [30 / 255, 144 / 255, 1],
  firebrick: [178 / 255, 34 / 255, 34 / 255],
  floralwhite: [1, 250 / 255, 240 / 255],
  forestgreen: [34 / 255, 139 / 255, 34 / 255],
  fuchsia: [1, 0, 1],
  gainsboro: [220 / 255, 220 / 255, 220 / 255],
  ghostwhite: [248 / 255, 248 / 255, 1],
  gold: [1, 215 / 255, 0],
  goldenrod: [218 / 255, 165 / 255, 32 / 255],
  gray: [128 / 255, 128 / 255, 128 / 255],
  green: [0, 128 / 255, 0],
  greenyellow: [173 / 255, 1, 47 / 255],
  grey: [128 / 255, 128 / 255, 128 / 255],
  honeydew: [240 / 255, 1, 240 / 255],
  hotpink: [1, 105 / 255, 180 / 255],
  indianred: [205 / 255, 92 / 255, 92 / 255],
  indigo: [75 / 255, 0, 130 / 255],
  ivory: [1, 1, 240 / 255],
  khaki: [240 / 255, 230 / 255, 140 / 255],
  lavender: [230 / 255, 230 / 255, 250 / 255],
  lavenderblush: [1, 240 / 255, 245 / 255],
  lawngreen: [124 / 255, 252 / 255, 0],
  lemonchiffon: [1, 250 / 255, 205 / 255],
  lightblue: [173 / 255, 216 / 255, 230 / 255],
  lightcoral: [240 / 255, 128 / 255, 128 / 255],
  lightcyan: [224 / 255, 1, 1],
  lightgoldenrodyellow: [250 / 255, 250 / 255, 210 / 255],
  lightgray: [211 / 255, 211 / 255, 211 / 255],
  lightgreen: [144 / 255, 238 / 255, 144 / 255],
  lightgrey: [211 / 255, 211 / 255, 211 / 255],
  lightpink: [1, 182 / 255, 193 / 255],
  lightsalmon: [1, 160 / 255, 122 / 255],
  lightseagreen: [32 / 255, 178 / 255, 170 / 255],
  lightskyblue: [135 / 255, 206 / 255, 250 / 255],
  lightslategray: [119 / 255, 136 / 255, 153 / 255],
  lightslategrey: [119 / 255, 136 / 255, 153 / 255],
  lightsteelblue: [176 / 255, 196 / 255, 222 / 255],
  lightyellow: [1, 1, 224 / 255],
  lime: [0, 1, 0],
  limegreen: [50 / 255, 205 / 255, 50 / 255],
  linen: [250 / 255, 240 / 255, 230 / 255],
  magenta: [1, 0, 1],
  maroon: [128 / 255, 0, 0],
  mediumaquamarine: [102 / 255, 205 / 255, 170 / 255],
  mediumblue: [0, 0, 205 / 255],
  mediumorchid: [186 / 255, 85 / 255, 211 / 255],
  mediumpurple: [147 / 255, 112 / 255, 219 / 255],
  mediumseagreen: [60 / 255, 179 / 255, 113 / 255],
  mediumslateblue: [123 / 255, 104 / 255, 238 / 255],
  mediumspringgreen: [0, 250 / 255, 154 / 255],
  mediumturquoise: [72 / 255, 209 / 255, 204 / 255],
  mediumvioletred: [199 / 255, 21 / 255, 133 / 255],
  midnightblue: [25 / 255, 25 / 255, 112 / 255],
  mintcream: [245 / 255, 1, 250 / 255],
  mistyrose: [1, 228 / 255, 225 / 255],
  moccasin: [1, 228 / 255, 181 / 255],
  navajowhite: [1, 222 / 255, 173 / 255],
  navy: [0, 0, 128 / 255],
  oldlace: [253 / 255, 245 / 255, 230 / 255],
  olive: [128 / 255, 128 / 255, 0],
  olivedrab: [107 / 255, 142 / 255, 35 / 255],
  orange: [1, 165 / 255, 0],
  orangered: [1, 69 / 255, 0],
  orchid: [218 / 255, 112 / 255, 214 / 255],
  palegoldenrod: [238 / 255, 232 / 255, 170 / 255],
  palegreen: [152 / 255, 251 / 255, 152 / 255],
  paleturquoise: [175 / 255, 238 / 255, 238 / 255],
  palevioletred: [219 / 255, 112 / 255, 147 / 255],
  papayawhip: [1, 239 / 255, 213 / 255],
  peachpuff: [1, 218 / 255, 185 / 255],
  peru: [205 / 255, 133 / 255, 63 / 255],
  pink: [1, 192 / 255, 203 / 255],
  plum: [221 / 255, 160 / 255, 221 / 255],
  powderblue: [176 / 255, 224 / 255, 230 / 255],
  purple: [128 / 255, 0, 128 / 255],
  rebeccapurple: [102 / 255, 51 / 255, 153 / 255],
  red: [1, 0, 0],
  rosybrown: [188 / 255, 143 / 255, 143 / 255],
  royalblue: [65 / 255, 105 / 255, 225 / 255],
  saddlebrown: [139 / 255, 69 / 255, 19 / 255],
  salmon: [250 / 255, 128 / 255, 114 / 255],
  sandybrown: [244 / 255, 164 / 255, 96 / 255],
  seagreen: [46 / 255, 139 / 255, 87 / 255],
  seashell: [1, 245 / 255, 238 / 255],
  sienna: [160 / 255, 82 / 255, 45 / 255],
  silver: [192 / 255, 192 / 255, 192 / 255],
  skyblue: [135 / 255, 206 / 255, 235 / 255],
  slateblue: [106 / 255, 90 / 255, 205 / 255],
  slategray: [112 / 255, 128 / 255, 144 / 255],
  slategrey: [112 / 255, 128 / 255, 144 / 255],
  snow: [1, 250 / 255, 250 / 255],
  springgreen: [0, 1, 127 / 255],
  steelblue: [70 / 255, 130 / 255, 180 / 255],
  tan: [210 / 255, 180 / 255, 140 / 255],
  teal: [0, 128 / 255, 128 / 255],
  thistle: [216 / 255, 191 / 255, 216 / 255],
  tomato: [1, 99 / 255, 71 / 255],
  turquoise: [64 / 255, 224 / 255, 208 / 255],
  violet: [238 / 255, 130 / 255, 238 / 255],
  wheat: [245 / 255, 222 / 255, 179 / 255],
  white: [1, 1, 1],
  whitesmoke: [245 / 255, 245 / 255, 245 / 255],
  yellow: [1, 1, 0],
  yellowgreen: [154 / 255, 205 / 255, 50 / 255]
};
let tp = Array(3).fill("<percentage> | <number>[0, 255]"), rp = Array(3).fill("<number>[0, 255]");
var $a = new Kr({
  id: "srgb",
  name: "sRGB",
  base: C3,
  fromBase: (e) => e.map((t) => {
    let r = t < 0 ? -1 : 1, n = t * r;
    return n > 31308e-7 ? r * (1.055 * n ** (1 / 2.4) - 0.055) : 12.92 * t;
  }),
  toBase: (e) => e.map((t) => {
    let r = t < 0 ? -1 : 1, n = t * r;
    return n <= 0.04045 ? t / 12.92 : r * ((n + 0.055) / 1.055) ** 2.4;
  }),
  formats: {
    rgb: {
      coords: tp
    },
    rgb_number: {
      name: "rgb",
      commas: !0,
      coords: rp,
      noAlpha: !0
    },
    color: {
      /* use defaults */
    },
    rgba: {
      coords: tp,
      commas: !0,
      lastAlpha: !0
    },
    rgba_number: {
      name: "rgba",
      commas: !0,
      coords: rp
    },
    hex: {
      type: "custom",
      toGamut: !0,
      test: (e) => /^#([a-f0-9]{3,4}){1,2}$/i.test(e),
      parse(e) {
        e.length <= 5 && (e = e.replace(/[a-f0-9]/gi, "$&$&"));
        let t = [];
        return e.replace(/[a-f0-9]{2}/gi, (r) => {
          t.push(parseInt(r, 16) / 255);
        }), {
          spaceId: "srgb",
          coords: t.slice(0, 3),
          alpha: t.slice(3)[0]
        };
      },
      serialize: (e, t, {
        collapse: r = !0
        // collapse to 3-4 digit hex when possible?
      } = {}) => {
        t < 1 && e.push(t), e = e.map((a) => Math.round(a * 255));
        let n = r && e.every((a) => a % 17 === 0);
        return "#" + e.map((a) => n ? (a / 17).toString(16) : a.toString(16).padStart(2, "0")).join("");
      }
    },
    keyword: {
      type: "custom",
      test: (e) => /^[a-z]+$/i.test(e),
      parse(e) {
        e = e.toLowerCase();
        let t = { spaceId: "srgb", coords: null, alpha: 1 };
        if (e === "transparent" ? (t.coords = ep.black, t.alpha = 0) : t.coords = ep[e], t.coords)
          return t;
      }
    }
  }
}), L3 = new Kr({
  id: "p3",
  cssId: "display-p3",
  name: "P3",
  base: M3,
  // Gamma encoding/decoding is the same as sRGB
  fromBase: $a.fromBase,
  toBase: $a.toBase
});
rn.display_space = $a;
let p7;
if (typeof CSS < "u" && CSS.supports)
  for (let e of [tn, D3, L3]) {
    let t = e.getMinCoords(), n = Fi({ space: e, coords: t, alpha: 1 });
    if (CSS.supports("color", n)) {
      rn.display_space = e;
      break;
    }
  }
function h7(e, { space: t = rn.display_space, ...r } = {}) {
  let n = Fi(e, r);
  if (typeof CSS > "u" || CSS.supports("color", n) || !rn.display_space)
    n = new String(n), n.color = e;
  else {
    let o = e;
    if ((e.coords.some(yo) || yo(e.alpha)) && !(p7 ?? (p7 = CSS.supports("color", "hsl(none 50% 50%)"))) && (o = Ga(e), o.coords = o.coords.map(Dr), o.alpha = Dr(o.alpha), n = Fi(o, r), CSS.supports("color", n)))
      return n = new String(n), n.color = o, n;
    o = fr(o, t), n = new String(Fi(o, r)), n.color = o;
  }
  return n;
}
function m7(e, t) {
  return e = qt(e), t = qt(t), e.space === t.space && e.alpha === t.alpha && e.coords.every((r, n) => r === t.coords[n]);
}
function Ao(e) {
  return en(e, [Nr, "y"]);
}
function F3(e, t) {
  Kn(e, [Nr, "y"], t);
}
function y7(e) {
  Object.defineProperty(e.prototype, "luminance", {
    get() {
      return Ao(this);
    },
    set(t) {
      F3(this, t);
    }
  });
}
var b7 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  getLuminance: Ao,
  register: y7,
  setLuminance: F3
});
function g7(e, t) {
  e = qt(e), t = qt(t);
  let r = Math.max(Ao(e), 0), n = Math.max(Ao(t), 0);
  return n > r && ([r, n] = [n, r]), (r + 0.05) / (n + 0.05);
}
const A7 = 0.56, v7 = 0.57, w7 = 0.62, x7 = 0.65, np = 0.022, _7 = 1.414, E7 = 0.1, S7 = 5e-4, k7 = 1.14, op = 0.027, T7 = 1.14;
function ap(e) {
  return e >= np ? e : e + (np - e) ** _7;
}
function va(e) {
  let t = e < 0 ? -1 : 1, r = Math.abs(e);
  return t * Math.pow(r, 2.4);
}
function D7(e, t) {
  t = qt(t), e = qt(e);
  let r, n, o, a, i, s;
  t = fr(t, "srgb"), [a, i, s] = t.coords;
  let l = va(a) * 0.2126729 + va(i) * 0.7151522 + va(s) * 0.072175;
  e = fr(e, "srgb"), [a, i, s] = e.coords;
  let c = va(a) * 0.2126729 + va(i) * 0.7151522 + va(s) * 0.072175, u = ap(l), f = ap(c), p = f > u;
  return Math.abs(f - u) < S7 ? n = 0 : p ? (r = f ** A7 - u ** v7, n = r * k7) : (r = f ** x7 - u ** w7, n = r * T7), Math.abs(n) < E7 ? o = 0 : n > 0 ? o = n - op : o = n + op, o * 100;
}
function M7(e, t) {
  e = qt(e), t = qt(t);
  let r = Math.max(Ao(e), 0), n = Math.max(Ao(t), 0);
  n > r && ([r, n] = [n, r]);
  let o = r + n;
  return o === 0 ? 0 : (r - n) / o;
}
const C7 = 5e4;
function L7(e, t) {
  e = qt(e), t = qt(t);
  let r = Math.max(Ao(e), 0), n = Math.max(Ao(t), 0);
  return n > r && ([r, n] = [n, r]), n === 0 ? C7 : (r - n) / n;
}
function F7(e, t) {
  e = qt(e), t = qt(t);
  let r = en(e, [tn, "l"]), n = en(t, [tn, "l"]);
  return Math.abs(r - n);
}
const R7 = 216 / 24389, ip = 24 / 116, ns = 24389 / 27;
let Ec = Vr.D65;
var au = new At({
  id: "lab-d65",
  name: "Lab D65",
  coords: {
    l: {
      refRange: [0, 100],
      name: "Lightness"
    },
    a: {
      refRange: [-125, 125]
    },
    b: {
      refRange: [-125, 125]
    }
  },
  // Assuming XYZ is relative to D65, convert to CIE Lab
  // from CIE standard, which now defines these as a rational fraction
  white: Ec,
  base: Nr,
  // Convert D65-adapted XYZ to Lab
  //  CIE 15.3:2004 section 8.2.1.1
  fromBase(e) {
    let r = e.map((n, o) => n / Ec[o]).map((n) => n > R7 ? Math.cbrt(n) : (ns * n + 16) / 116);
    return [
      116 * r[1] - 16,
      // L
      500 * (r[0] - r[1]),
      // a
      200 * (r[1] - r[2])
      // b
    ];
  },
  // Convert Lab to D65-adapted XYZ
  // Same result as CIE 15.3:2004 Appendix D although the derivation is different
  // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
  toBase(e) {
    let t = [];
    return t[1] = (e[0] + 16) / 116, t[0] = e[1] / 500 + t[1], t[2] = t[1] - e[2] / 200, [
      t[0] > ip ? Math.pow(t[0], 3) : (116 * t[0] - 16) / ns,
      e[0] > 8 ? Math.pow((e[0] + 16) / 116, 3) : e[0] / ns,
      t[2] > ip ? Math.pow(t[2], 3) : (116 * t[2] - 16) / ns
    ].map((n, o) => n * Ec[o]);
  },
  formats: {
    "lab-d65": {
      coords: ["<number> | <percentage>", "<number> | <percentage>[-1,1]", "<number> | <percentage>[-1,1]"]
    }
  }
});
const Sc = Math.pow(5, 0.5) * 0.5 + 0.5;
function O7(e, t) {
  e = qt(e), t = qt(t);
  let r = en(e, [au, "l"]), n = en(t, [au, "l"]), o = Math.abs(Math.pow(r, Sc) - Math.pow(n, Sc)), a = Math.pow(o, 1 / Sc) * Math.SQRT2 - 40;
  return a < 7.5 ? 0 : a;
}
var ds = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  contrastAPCA: D7,
  contrastDeltaPhi: O7,
  contrastLstar: F7,
  contrastMichelson: M7,
  contrastWCAG21: g7,
  contrastWeber: L7
});
function P7(e, t, r = {}) {
  t0(r) && (r = { algorithm: r });
  let { algorithm: n, ...o } = r;
  if (!n) {
    let a = Object.keys(ds).map((i) => i.replace(/^contrast/, "")).join(", ");
    throw new TypeError(`contrast() function needs a contrast algorithm. Please specify one of: ${a}`);
  }
  e = qt(e), t = qt(t);
  for (let a in ds)
    if ("contrast" + n.toLowerCase() === a.toLowerCase())
      return ds[a](e, t, o);
  throw new TypeError(`Unknown contrast algorithm: ${n}`);
}
function Ys(e) {
  let [t, r, n] = r0(e, Nr), o = t + 15 * r + 3 * n;
  return [4 * t / o, 9 * r / o];
}
function R3(e) {
  let [t, r, n] = r0(e, Nr), o = t + r + n;
  return [t / o, r / o];
}
function I7(e) {
  Object.defineProperty(e.prototype, "uv", {
    get() {
      return Ys(this);
    }
  }), Object.defineProperty(e.prototype, "xy", {
    get() {
      return R3(this);
    }
  });
}
var B7 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  register: I7,
  uv: Ys,
  xy: R3
});
function ki(e, t, r = {}) {
  t0(r) && (r = { method: r });
  let { method: n = rn.deltaE, ...o } = r;
  for (let a in qa)
    if ("deltae" + n.toLowerCase() === a.toLowerCase())
      return qa[a](e, t, o);
  throw new TypeError(`Unknown deltaE method: ${n}`);
}
function N7(e, t = 0.25) {
  let n = [At.get("oklch", "lch"), "l"];
  return Kn(e, n, (o) => o * (1 + t));
}
function G7(e, t = 0.25) {
  let n = [At.get("oklch", "lch"), "l"];
  return Kn(e, n, (o) => o * (1 - t));
}
var q7 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  darken: G7,
  lighten: N7
});
function O3(e, t, r = 0.5, n = {}) {
  return [e, t] = [qt(e), qt(t)], ho(r) === "object" && ([r, n] = [0.5, r]), n0(e, t, n)(r);
}
function P3(e, t, r = {}) {
  let n;
  Iu(e) && ([n, r] = [e, t], [e, t] = n.rangeArgs.colors);
  let {
    maxDeltaE: o,
    deltaEMethod: a,
    steps: i = 2,
    maxSteps: s = 1e3,
    ...l
  } = r;
  n || ([e, t] = [qt(e), qt(t)], n = n0(e, t, l));
  let c = ki(e, t), u = o > 0 ? Math.max(i, Math.ceil(c / o) + 1) : i, f = [];
  if (s !== void 0 && (u = Math.min(u, s)), u === 1)
    f = [{ p: 0.5, color: n(0.5) }];
  else {
    let p = 1 / (u - 1);
    f = Array.from({ length: u }, (h, m) => {
      let w = m * p;
      return { p: w, color: n(w) };
    });
  }
  if (o > 0) {
    let p = f.reduce((h, m, w) => {
      if (w === 0)
        return 0;
      let A = ki(m.color, f[w - 1].color, a);
      return Math.max(h, A);
    }, 0);
    for (; p > o; ) {
      p = 0;
      for (let h = 1; h < f.length && f.length < s; h++) {
        let m = f[h - 1], w = f[h], A = (w.p + m.p) / 2, T = n(A);
        p = Math.max(p, ki(T, m.color), ki(T, w.color)), f.splice(h, 0, { p: A, color: n(A) }), h++;
      }
    }
  }
  return f = f.map((p) => p.color), f;
}
function n0(e, t, r = {}) {
  if (Iu(e)) {
    let [l, c] = [e, t];
    return n0(...l.rangeArgs.colors, { ...l.rangeArgs.options, ...c });
  }
  let { space: n, outputSpace: o, progression: a, premultiplied: i } = r;
  e = qt(e), t = qt(t), e = Ga(e), t = Ga(t);
  let s = { colors: [e, t], options: r };
  if (n ? n = At.get(n) : n = At.registry[rn.interpolationSpace] || e.space, o = o ? At.get(o) : n, e = fr(e, n), t = fr(t, n), e = go(e), t = go(t), n.coords.h && n.coords.h.type === "angle") {
    let l = r.hue = r.hue || "shorter", c = [n, "h"], [u, f] = [en(e, c), en(t, c)];
    isNaN(u) && !isNaN(f) ? u = f : isNaN(f) && !isNaN(u) && (f = u), [u, f] = AA(l, [u, f]), Kn(e, c, u), Kn(t, c, f);
  }
  return i && (e.coords = e.coords.map((l) => l * e.alpha), t.coords = t.coords.map((l) => l * t.alpha)), Object.assign((l) => {
    l = a ? a(l) : l;
    let c = e.coords.map((p, h) => {
      let m = t.coords[h];
      return zi(p, m, l);
    }), u = zi(e.alpha, t.alpha, l), f = { space: n, coords: c, alpha: u };
    return i && (f.coords = f.coords.map((p) => p / u)), o !== n && (f = fr(f, o)), f;
  }, {
    rangeArgs: s
  });
}
function Iu(e) {
  return ho(e) === "function" && !!e.rangeArgs;
}
rn.interpolationSpace = "lab";
function $7(e) {
  e.defineFunction("mix", O3, { returns: "color" }), e.defineFunction("range", n0, { returns: "function<color>" }), e.defineFunction("steps", P3, { returns: "array<color>" });
}
var z7 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  isRange: Iu,
  mix: O3,
  range: n0,
  register: $7,
  steps: P3
}), I3 = new At({
  id: "hsl",
  name: "HSL",
  coords: {
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    },
    s: {
      range: [0, 100],
      name: "Saturation"
    },
    l: {
      range: [0, 100],
      name: "Lightness"
    }
  },
  base: $a,
  // Adapted from https://drafts.csswg.org/css-color-4/better-rgbToHsl.js
  fromBase: (e) => {
    let t = Math.max(...e), r = Math.min(...e), [n, o, a] = e, [i, s, l] = [NaN, 0, (r + t) / 2], c = t - r;
    if (c !== 0) {
      switch (s = l === 0 || l === 1 ? 0 : (t - l) / Math.min(l, 1 - l), t) {
        case n:
          i = (o - a) / c + (o < a ? 6 : 0);
          break;
        case o:
          i = (a - n) / c + 2;
          break;
        case a:
          i = (n - o) / c + 4;
      }
      i = i * 60;
    }
    return s < 0 && (i += 180, s = Math.abs(s)), i >= 360 && (i -= 360), [i, s * 100, l * 100];
  },
  // Adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative
  toBase: (e) => {
    let [t, r, n] = e;
    t = t % 360, t < 0 && (t += 360), r /= 100, n /= 100;
    function o(a) {
      let i = (a + t / 30) % 12, s = r * Math.min(n, 1 - n);
      return n - s * Math.max(-1, Math.min(i - 3, 9 - i, 1));
    }
    return [o(0), o(8), o(4)];
  },
  formats: {
    hsl: {
      coords: ["<number> | <angle>", "<percentage>", "<percentage>"]
    },
    hsla: {
      coords: ["<number> | <angle>", "<percentage>", "<percentage>"],
      commas: !0,
      lastAlpha: !0
    }
  }
}), B3 = new At({
  id: "hsv",
  name: "HSV",
  coords: {
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    },
    s: {
      range: [0, 100],
      name: "Saturation"
    },
    v: {
      range: [0, 100],
      name: "Value"
    }
  },
  base: I3,
  // https://en.wikipedia.org/wiki/HSL_and_HSV#Interconversion
  fromBase(e) {
    let [t, r, n] = e;
    r /= 100, n /= 100;
    let o = n + r * Math.min(n, 1 - n);
    return [
      t,
      // h is the same
      o === 0 ? 0 : 200 * (1 - n / o),
      // s
      100 * o
    ];
  },
  // https://en.wikipedia.org/wiki/HSL_and_HSV#Interconversion
  toBase(e) {
    let [t, r, n] = e;
    r /= 100, n /= 100;
    let o = n * (1 - r / 2);
    return [
      t,
      // h is the same
      o === 0 || o === 1 ? 0 : (n - o) / Math.min(o, 1 - o) * 100,
      o * 100
    ];
  },
  formats: {
    color: {
      id: "--hsv",
      coords: ["<number> | <angle>", "<percentage> | <number>", "<percentage> | <number>"]
    }
  }
}), j7 = new At({
  id: "hwb",
  name: "HWB",
  coords: {
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    },
    w: {
      range: [0, 100],
      name: "Whiteness"
    },
    b: {
      range: [0, 100],
      name: "Blackness"
    }
  },
  base: B3,
  fromBase(e) {
    let [t, r, n] = e;
    return [t, n * (100 - r) / 100, 100 - n];
  },
  toBase(e) {
    let [t, r, n] = e;
    r /= 100, n /= 100;
    let o = r + n;
    if (o >= 1) {
      let s = r / o;
      return [t, 0, s * 100];
    }
    let a = 1 - n, i = a === 0 ? 0 : 1 - r / a;
    return [t, i * 100, a * 100];
  },
  formats: {
    hwb: {
      coords: ["<number> | <angle>", "<percentage> | <number>", "<percentage> | <number>"]
    }
  }
});
const H7 = [
  [0.5766690429101305, 0.1855582379065463, 0.1882286462349947],
  [0.29734497525053605, 0.6273635662554661, 0.07529145849399788],
  [0.02703136138641234, 0.07068885253582723, 0.9913375368376388]
], U7 = [
  [2.0415879038107465, -0.5650069742788596, -0.34473135077832956],
  [-0.9692436362808795, 1.8759675015077202, 0.04155505740717557],
  [0.013444280632031142, -0.11836239223101838, 1.0151749943912054]
];
var N3 = new Kr({
  id: "a98rgb-linear",
  cssId: "--a98-rgb-linear",
  name: "Linear Adobe® 98 RGB compatible",
  white: "D65",
  toXYZ_M: H7,
  fromXYZ_M: U7
}), V7 = new Kr({
  id: "a98rgb",
  cssId: "a98-rgb",
  name: "Adobe® 98 RGB compatible",
  base: N3,
  toBase: (e) => e.map((t) => Math.pow(Math.abs(t), 563 / 256) * Math.sign(t)),
  fromBase: (e) => e.map((t) => Math.pow(Math.abs(t), 256 / 563) * Math.sign(t))
});
const W7 = [
  [0.7977666449006423, 0.13518129740053308, 0.0313477341283922],
  [0.2880748288194013, 0.711835234241873, 8993693872564e-17],
  [0, 0, 0.8251046025104602]
], X7 = [
  [1.3457868816471583, -0.25557208737979464, -0.05110186497554526],
  [-0.5446307051249019, 1.5082477428451468, 0.02052744743642139],
  [0, 0, 1.2119675456389452]
];
var G3 = new Kr({
  id: "prophoto-linear",
  cssId: "--prophoto-rgb-linear",
  name: "Linear ProPhoto",
  white: "D50",
  base: Ru,
  toXYZ_M: W7,
  fromXYZ_M: X7
});
const Y7 = 1 / 512, K7 = 16 / 512;
var Z7 = new Kr({
  id: "prophoto",
  cssId: "prophoto-rgb",
  name: "ProPhoto",
  base: G3,
  toBase(e) {
    return e.map((t) => t < K7 ? t / 16 : t ** 1.8);
  },
  fromBase(e) {
    return e.map((t) => t >= Y7 ? t ** (1 / 1.8) : 16 * t);
  }
}), Q7 = new At({
  id: "oklch",
  name: "Oklch",
  coords: {
    l: {
      refRange: [0, 1],
      name: "Lightness"
    },
    c: {
      refRange: [0, 0.4],
      name: "Chroma"
    },
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    }
  },
  white: "D65",
  base: Na,
  fromBase(e) {
    let [t, r, n] = e, o;
    const a = 2e-4;
    return Math.abs(r) < a && Math.abs(n) < a ? o = NaN : o = Math.atan2(n, r) * 180 / Math.PI, [
      t,
      // OKLab L is still L
      Math.sqrt(r ** 2 + n ** 2),
      // Chroma
      Rn(o)
      // Hue, in degrees [0 to 360)
    ];
  },
  // Convert from polar form
  toBase(e) {
    let [t, r, n] = e, o, a;
    return isNaN(n) ? (o = 0, a = 0) : (o = r * Math.cos(n * Math.PI / 180), a = r * Math.sin(n * Math.PI / 180)), [t, o, a];
  },
  formats: {
    oklch: {
      coords: ["<percentage> | <number>", "<number> | <percentage>[0,1]", "<number> | <angle>"]
    }
  }
});
let q3 = Vr.D65;
const J7 = 216 / 24389, sp = 24389 / 27, [lp, cp] = Ys({ space: Nr, coords: q3 });
var $3 = new At({
  id: "luv",
  name: "Luv",
  coords: {
    l: {
      refRange: [0, 100],
      name: "Lightness"
    },
    // Reference ranges from https://facelessuser.github.io/coloraide/colors/luv/
    u: {
      refRange: [-215, 215]
    },
    v: {
      refRange: [-215, 215]
    }
  },
  white: q3,
  base: Nr,
  // Convert D65-adapted XYZ to Luv
  // https://en.wikipedia.org/wiki/CIELUV#The_forward_transformation
  fromBase(e) {
    let t = [Dr(e[0]), Dr(e[1]), Dr(e[2])], r = t[1], [n, o] = Ys({ space: Nr, coords: t });
    if (!Number.isFinite(n) || !Number.isFinite(o))
      return [0, 0, 0];
    let a = r <= J7 ? sp * r : 116 * Math.cbrt(r) - 16;
    return [
      a,
      13 * a * (n - lp),
      13 * a * (o - cp)
    ];
  },
  // Convert Luv to D65-adapted XYZ
  // https://en.wikipedia.org/wiki/CIELUV#The_reverse_transformation
  toBase(e) {
    let [t, r, n] = e;
    if (t === 0 || yo(t))
      return [0, 0, 0];
    r = Dr(r), n = Dr(n);
    let o = r / (13 * t) + lp, a = n / (13 * t) + cp, i = t <= 8 ? t / sp : Math.pow((t + 16) / 116, 3);
    return [
      i * (9 * o / (4 * a)),
      i,
      i * ((12 - 3 * o - 20 * a) / (4 * a))
    ];
  },
  formats: {
    color: {
      id: "--luv",
      coords: ["<number> | <percentage>", "<number> | <percentage>[-1,1]", "<number> | <percentage>[-1,1]"]
    }
  }
}), Bu = new At({
  id: "lchuv",
  name: "LChuv",
  coords: {
    l: {
      refRange: [0, 100],
      name: "Lightness"
    },
    c: {
      refRange: [0, 220],
      name: "Chroma"
    },
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    }
  },
  base: $3,
  fromBase(e) {
    let [t, r, n] = e, o;
    const a = 0.02;
    return Math.abs(r) < a && Math.abs(n) < a ? o = NaN : o = Math.atan2(n, r) * 180 / Math.PI, [
      t,
      // L is still L
      Math.sqrt(r ** 2 + n ** 2),
      // Chroma
      Rn(o)
      // Hue, in degrees [0 to 360)
    ];
  },
  toBase(e) {
    let [t, r, n] = e;
    return r < 0 && (r = 0), isNaN(n) && (n = 0), [
      t,
      // L is still L
      r * Math.cos(n * Math.PI / 180),
      // u
      r * Math.sin(n * Math.PI / 180)
      // v
    ];
  },
  formats: {
    color: {
      id: "--lchuv",
      coords: ["<number> | <percentage>", "<number> | <percentage>", "<number> | <angle>"]
    }
  }
});
const ev = 216 / 24389, tv = 24389 / 27, up = Rr[0][0], fp = Rr[0][1], kc = Rr[0][2], dp = Rr[1][0], pp = Rr[1][1], Tc = Rr[1][2], hp = Rr[2][0], mp = Rr[2][1], Dc = Rr[2][2];
function wa(e, t, r) {
  const n = t / (Math.sin(r) - e * Math.cos(r));
  return n < 0 ? 1 / 0 : n;
}
function Fs(e) {
  const t = Math.pow(e + 16, 3) / 1560896, r = t > ev ? t : e / tv, n = r * (284517 * up - 94839 * kc), o = r * (838422 * kc + 769860 * fp + 731718 * up), a = r * (632260 * kc - 126452 * fp), i = r * (284517 * dp - 94839 * Tc), s = r * (838422 * Tc + 769860 * pp + 731718 * dp), l = r * (632260 * Tc - 126452 * pp), c = r * (284517 * hp - 94839 * Dc), u = r * (838422 * Dc + 769860 * mp + 731718 * hp), f = r * (632260 * Dc - 126452 * mp);
  return {
    r0s: n / a,
    r0i: o * e / a,
    r1s: n / (a + 126452),
    r1i: (o - 769860) * e / (a + 126452),
    g0s: i / l,
    g0i: s * e / l,
    g1s: i / (l + 126452),
    g1i: (s - 769860) * e / (l + 126452),
    b0s: c / f,
    b0i: u * e / f,
    b1s: c / (f + 126452),
    b1i: (u - 769860) * e / (f + 126452)
  };
}
function yp(e, t) {
  const r = t / 360 * Math.PI * 2, n = wa(e.r0s, e.r0i, r), o = wa(e.r1s, e.r1i, r), a = wa(e.g0s, e.g0i, r), i = wa(e.g1s, e.g1i, r), s = wa(e.b0s, e.b0i, r), l = wa(e.b1s, e.b1i, r);
  return Math.min(n, o, a, i, s, l);
}
var rv = new At({
  id: "hsluv",
  name: "HSLuv",
  coords: {
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    },
    s: {
      range: [0, 100],
      name: "Saturation"
    },
    l: {
      range: [0, 100],
      name: "Lightness"
    }
  },
  base: Bu,
  gamutSpace: $a,
  // Convert LCHuv to HSLuv
  fromBase(e) {
    let [t, r, n] = [Dr(e[0]), Dr(e[1]), Dr(e[2])], o;
    if (t > 99.9999999)
      o = 0, t = 100;
    else if (t < 1e-8)
      o = 0, t = 0;
    else {
      let a = Fs(t), i = yp(a, n);
      o = r / i * 100;
    }
    return [n, o, t];
  },
  // Convert HSLuv to LCHuv
  toBase(e) {
    let [t, r, n] = [Dr(e[0]), Dr(e[1]), Dr(e[2])], o;
    if (n > 99.9999999)
      n = 100, o = 0;
    else if (n < 1e-8)
      n = 0, o = 0;
    else {
      let a = Fs(n);
      o = yp(a, t) / 100 * r;
    }
    return [n, o, t];
  },
  formats: {
    color: {
      id: "--hsluv",
      coords: ["<number> | <angle>", "<percentage> | <number>", "<percentage> | <number>"]
    }
  }
});
Rr[0][0];
Rr[0][1];
Rr[0][2];
Rr[1][0];
Rr[1][1];
Rr[1][2];
Rr[2][0];
Rr[2][1];
Rr[2][2];
function xa(e, t) {
  return Math.abs(t) / Math.sqrt(Math.pow(e, 2) + 1);
}
function bp(e) {
  let t = xa(e.r0s, e.r0i), r = xa(e.r1s, e.r1i), n = xa(e.g0s, e.g0i), o = xa(e.g1s, e.g1i), a = xa(e.b0s, e.b0i), i = xa(e.b1s, e.b1i);
  return Math.min(t, r, n, o, a, i);
}
var nv = new At({
  id: "hpluv",
  name: "HPLuv",
  coords: {
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    },
    s: {
      range: [0, 100],
      name: "Saturation"
    },
    l: {
      range: [0, 100],
      name: "Lightness"
    }
  },
  base: Bu,
  gamutSpace: "self",
  // Convert LCHuv to HPLuv
  fromBase(e) {
    let [t, r, n] = [Dr(e[0]), Dr(e[1]), Dr(e[2])], o;
    if (t > 99.9999999)
      o = 0, t = 100;
    else if (t < 1e-8)
      o = 0, t = 0;
    else {
      let a = Fs(t), i = bp(a);
      o = r / i * 100;
    }
    return [n, o, t];
  },
  // Convert HPLuv to LCHuv
  toBase(e) {
    let [t, r, n] = [Dr(e[0]), Dr(e[1]), Dr(e[2])], o;
    if (n > 99.9999999)
      n = 100, o = 0;
    else if (n < 1e-8)
      n = 0, o = 0;
    else {
      let a = Fs(n);
      o = bp(a) / 100 * r;
    }
    return [n, o, t];
  },
  formats: {
    color: {
      id: "--hpluv",
      coords: ["<number> | <angle>", "<percentage> | <number>", "<percentage> | <number>"]
    }
  }
});
const gp = 203, Ap = 2610 / 2 ** 14, ov = 2 ** 14 / 2610, av = 2523 / 2 ** 5, vp = 2 ** 5 / 2523, wp = 3424 / 2 ** 12, xp = 2413 / 2 ** 7, _p = 2392 / 2 ** 7;
var iv = new Kr({
  id: "rec2100pq",
  cssId: "rec2100-pq",
  name: "REC.2100-PQ",
  base: Xs,
  toBase(e) {
    return e.map(function(t) {
      return (Math.max(t ** vp - wp, 0) / (xp - _p * t ** vp)) ** ov * 1e4 / gp;
    });
  },
  fromBase(e) {
    return e.map(function(t) {
      let r = Math.max(t * gp / 1e4, 0), n = wp + xp * r ** Ap, o = 1 + _p * r ** Ap;
      return (n / o) ** av;
    });
  }
});
const Ep = 0.17883277, Sp = 0.28466892, kp = 0.55991073, Mc = 3.7743;
var sv = new Kr({
  id: "rec2100hlg",
  cssId: "rec2100-hlg",
  name: "REC.2100-HLG",
  referred: "scene",
  base: Xs,
  toBase(e) {
    return e.map(function(t) {
      return t <= 0.5 ? t ** 2 / 3 * Mc : (Math.exp((t - kp) / Ep) + Sp) / 12 * Mc;
    });
  },
  fromBase(e) {
    return e.map(function(t) {
      return t /= Mc, t <= 1 / 12 ? Math.sqrt(3 * t) : Ep * Math.log(12 * t - Sp) + kp;
    });
  }
});
const z3 = {};
bo.add("chromatic-adaptation-start", (e) => {
  e.options.method && (e.M = j3(e.W1, e.W2, e.options.method));
});
bo.add("chromatic-adaptation-end", (e) => {
  e.M || (e.M = j3(e.W1, e.W2, e.options.method));
});
function Ks({ id: e, toCone_M: t, fromCone_M: r }) {
  z3[e] = arguments[0];
}
function j3(e, t, r = "Bradford") {
  let n = z3[r], [o, a, i] = dr(n.toCone_M, e), [s, l, c] = dr(n.toCone_M, t), u = [
    [s / o, 0, 0],
    [0, l / a, 0],
    [0, 0, c / i]
  ], f = dr(u, n.toCone_M);
  return dr(n.fromCone_M, f);
}
Ks({
  id: "von Kries",
  toCone_M: [
    [0.40024, 0.7076, -0.08081],
    [-0.2263, 1.16532, 0.0457],
    [0, 0, 0.91822]
  ],
  fromCone_M: [
    [1.8599363874558397, -1.1293816185800916, 0.21989740959619328],
    [0.3611914362417676, 0.6388124632850422, -6370596838649899e-21],
    [0, 0, 1.0890636230968613]
  ]
});
Ks({
  id: "Bradford",
  // Convert an array of XYZ values in the range 0.0 - 1.0
  // to cone fundamentals
  toCone_M: [
    [0.8951, 0.2664, -0.1614],
    [-0.7502, 1.7135, 0.0367],
    [0.0389, -0.0685, 1.0296]
  ],
  // and back
  fromCone_M: [
    [0.9869929054667121, -0.14705425642099013, 0.15996265166373122],
    [0.4323052697233945, 0.5183602715367774, 0.049291228212855594],
    [-0.00852866457517732, 0.04004282165408486, 0.96848669578755]
  ]
});
Ks({
  id: "CAT02",
  // with complete chromatic adaptation to W2, so D = 1.0
  toCone_M: [
    [0.7328, 0.4296, -0.1624],
    [-0.7036, 1.6975, 61e-4],
    [3e-3, 0.0136, 0.9834]
  ],
  fromCone_M: [
    [1.0961238208355142, -0.27886900021828726, 0.18274517938277307],
    [0.4543690419753592, 0.4735331543074117, 0.07209780371722911],
    [-0.009627608738429355, -0.00569803121611342, 1.0153256399545427]
  ]
});
Ks({
  id: "CAT16",
  toCone_M: [
    [0.401288, 0.650173, -0.051461],
    [-0.250268, 1.204414, 0.045854],
    [-2079e-6, 0.048952, 0.953127]
  ],
  // the extra precision is needed to avoid roundtripping errors
  fromCone_M: [
    [1.862067855087233, -1.0112546305316845, 0.14918677544445172],
    [0.3875265432361372, 0.6214474419314753, -0.008973985167612521],
    [-0.01584149884933386, -0.03412293802851557, 1.0499644368778496]
  ]
});
Object.assign(Vr, {
  // whitepoint values from ASTM E308-01 with 10nm spacing, 1931 2 degree observer
  // all normalized to Y (luminance) = 1.00000
  // Illuminant A is a tungsten electric light, giving a very warm, orange light.
  A: [1.0985, 1, 0.35585],
  // Illuminant C was an early approximation to daylight: illuminant A with a blue filter.
  C: [0.98074, 1, 1.18232],
  // The daylight series of illuminants simulate natural daylight.
  // The color temperature (in degrees Kelvin/100) ranges from
  // cool, overcast daylight (D50) to bright, direct sunlight (D65).
  D55: [0.95682, 1, 0.92149],
  D75: [0.94972, 1, 1.22638],
  // Equal-energy illuminant, used in two-stage CAT16
  E: [1, 1, 1],
  // The F series of illuminants represent fluorescent lights
  F2: [0.99186, 1, 0.67393],
  F7: [0.95041, 1, 1.08747],
  F11: [1.00962, 1, 0.6435]
});
Vr.ACES = [0.32168 / 0.33767, 1, (1 - 0.32168 - 0.33767) / 0.33767];
const lv = [
  [0.6624541811085053, 0.13400420645643313, 0.1561876870049078],
  [0.27222871678091454, 0.6740817658111484, 0.05368951740793705],
  [-0.005574649490394108, 0.004060733528982826, 1.0103391003129971]
], cv = [
  [1.6410233796943257, -0.32480329418479, -0.23642469523761225],
  [-0.6636628587229829, 1.6153315916573379, 0.016756347685530137],
  [0.011721894328375376, -0.008284441996237409, 0.9883948585390215]
];
var H3 = new Kr({
  id: "acescg",
  cssId: "--acescg",
  name: "ACEScg",
  // ACEScg – A scene-referred, linear-light encoding of ACES Data
  // https://docs.acescentral.com/specifications/acescg/
  // uses the AP1 primaries, see section 4.3.1 Color primaries
  coords: {
    r: {
      range: [0, 65504],
      name: "Red"
    },
    g: {
      range: [0, 65504],
      name: "Green"
    },
    b: {
      range: [0, 65504],
      name: "Blue"
    }
  },
  referred: "scene",
  white: Vr.ACES,
  toXYZ_M: lv,
  fromXYZ_M: cv
});
const os = 2 ** -16, Cc = -0.35828683, as = (Math.log2(65504) + 9.72) / 17.52;
var uv = new Kr({
  id: "acescc",
  cssId: "--acescc",
  name: "ACEScc",
  // see S-2014-003 ACEScc – A Logarithmic Encoding of ACES Data
  // https://docs.acescentral.com/specifications/acescc/
  // uses the AP1 primaries, see section 4.3.1 Color primaries
  // Appendix A: "Very small ACES scene referred values below 7 1/4 stops
  // below 18% middle gray are encoded as negative ACEScc values.
  // These values should be preserved per the encoding in Section 4.4
  // so that all positive ACES values are maintained."
  coords: {
    r: {
      range: [Cc, as],
      name: "Red"
    },
    g: {
      range: [Cc, as],
      name: "Green"
    },
    b: {
      range: [Cc, as],
      name: "Blue"
    }
  },
  referred: "scene",
  base: H3,
  // from section 4.4.2 Decoding Function
  toBase(e) {
    const t = -0.3013698630136986;
    return e.map(function(r) {
      return r <= t ? (2 ** (r * 17.52 - 9.72) - os) * 2 : r < as ? 2 ** (r * 17.52 - 9.72) : 65504;
    });
  },
  // Non-linear encoding function from S-2014-003, section 4.4.1 Encoding Function
  fromBase(e) {
    return e.map(function(t) {
      return t <= 0 ? (Math.log2(os) + 9.72) / 17.52 : t < os ? (Math.log2(os + t * 0.5) + 9.72) / 17.52 : (Math.log2(t) + 9.72) / 17.52;
    });
  }
  // encoded media white (rgb 1,1,1) => linear  [ 222.861, 222.861, 222.861 ]
  // encoded media black (rgb 0,0,0) => linear [ 0.0011857, 0.0011857, 0.0011857]
}), Tp = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  A98RGB: V7,
  A98RGB_Linear: N3,
  ACEScc: uv,
  ACEScg: H3,
  CAM16_JMh: QA,
  HCT: Hi,
  HPLuv: nv,
  HSL: I3,
  HSLuv: rv,
  HSV: B3,
  HWB: j7,
  ICTCP: ru,
  JzCzHz: tu,
  Jzazbz: g3,
  LCH: ji,
  LCHuv: Bu,
  Lab: tn,
  Lab_D65: au,
  Luv: $3,
  OKLCH: Q7,
  OKLab: Na,
  P3: L3,
  P3_Linear: M3,
  ProPhoto: Z7,
  ProPhoto_Linear: G3,
  REC_2020: D3,
  REC_2020_Linear: Xs,
  REC_2100_HLG: sv,
  REC_2100_PQ: iv,
  XYZ_ABS_D65: Ou,
  XYZ_D50: Ru,
  XYZ_D65: Nr,
  sRGB: $a,
  sRGB_Linear: C3
});
class Et {
  /**
   * Creates an instance of Color.
   * Signatures:
   * - `new Color(stringToParse)`
   * - `new Color(otherColor)`
   * - `new Color({space, coords, alpha})`
   * - `new Color(space, coords, alpha)`
   * - `new Color(spaceId, coords, alpha)`
   */
  constructor(...t) {
    let r;
    t.length === 1 && (r = qt(t[0]));
    let n, o, a;
    r ? (n = r.space || r.spaceId, o = r.coords, a = r.alpha) : [n, o, a] = t, Object.defineProperty(this, "space", {
      value: At.get(n),
      writable: !1,
      enumerable: !0,
      configurable: !0
      // see note in https://262.ecma-international.org/8.0/#sec-proxy-object-internal-methods-and-internal-slots-get-p-receiver
    }), this.coords = o ? o.slice() : [0, 0, 0], this.alpha = a > 1 || a === void 0 ? 1 : a < 0 ? 0 : a;
    for (let i = 0; i < this.coords.length; i++)
      this.coords[i] === "NaN" && (this.coords[i] = NaN);
    for (let i in this.space.coords)
      Object.defineProperty(this, i, {
        get: () => this.get(i),
        set: (s) => this.set(i, s)
      });
  }
  get spaceId() {
    return this.space.id;
  }
  clone() {
    return new Et(this.space, this.coords, this.alpha);
  }
  toJSON() {
    return {
      spaceId: this.spaceId,
      coords: this.coords,
      alpha: this.alpha
    };
  }
  display(...t) {
    let r = h7(this, ...t);
    return r.color = new Et(r.color), r;
  }
  /**
   * Get a color from the argument passed
   * Basically gets us the same result as new Color(color) but doesn't clone an existing color object
   */
  static get(t, ...r) {
    return t instanceof Et ? t : new Et(t, ...r);
  }
  static defineFunction(t, r, n = r) {
    let { instance: o = !0, returns: a } = n, i = function(...s) {
      let l = r(...s);
      if (a === "color")
        l = Et.get(l);
      else if (a === "function<color>") {
        let c = l;
        l = function(...u) {
          let f = c(...u);
          return Et.get(f);
        }, Object.assign(l, c);
      } else a === "array<color>" && (l = l.map((c) => Et.get(c)));
      return l;
    };
    t in Et || (Et[t] = i), o && (Et.prototype[t] = function(...s) {
      return i(this, ...s);
    });
  }
  static defineFunctions(t) {
    for (let r in t)
      Et.defineFunction(r, t[r], t[r]);
  }
  static extend(t) {
    if (t.register)
      t.register(Et);
    else
      for (let r in t)
        Et.defineFunction(r, t[r]);
  }
}
Et.defineFunctions({
  get: en,
  getAll: r0,
  set: Kn,
  setAll: Fu,
  to: fr,
  equals: m7,
  inGamut: zo,
  toGamut: go,
  distance: b3,
  toString: Fi
});
Object.assign(Et, {
  util: pA,
  hooks: bo,
  WHITES: Vr,
  Space: At,
  spaces: At.registry,
  parse: m3,
  // Global defaults one may want to configure
  defaults: rn
});
for (let e of Object.keys(Tp))
  At.register(Tp[e]);
for (let e in At.registry)
  iu(e, At.registry[e]);
bo.add("colorspace-init-end", (e) => {
  var t;
  iu(e.id, e), (t = e.aliases) == null || t.forEach((r) => {
    iu(r, e);
  });
});
function iu(e, t) {
  let r = e.replace(/-/g, "_");
  Object.defineProperty(Et.prototype, r, {
    // Convert coords to coords in another colorspace and return them
    // Source colorspace: this.spaceId
    // Target colorspace: id
    get() {
      let n = this.getAll(e);
      return typeof Proxy > "u" ? n : new Proxy(n, {
        has: (o, a) => {
          try {
            return At.resolveCoord([t, a]), !0;
          } catch {
          }
          return Reflect.has(o, a);
        },
        get: (o, a, i) => {
          if (a && typeof a != "symbol" && !(a in o)) {
            let { index: s } = At.resolveCoord([t, a]);
            if (s >= 0)
              return o[s];
          }
          return Reflect.get(o, a, i);
        },
        set: (o, a, i, s) => {
          if (a && typeof a != "symbol" && !(a in o) || a >= 0) {
            let { index: l } = At.resolveCoord([t, a]);
            if (l >= 0)
              return o[l] = i, this.setAll(e, o), !0;
          }
          return Reflect.set(o, a, i, s);
        }
      });
    },
    // Convert coords in another colorspace to internal coords and set them
    // Target colorspace: this.spaceId
    // Source colorspace: id
    set(n) {
      this.setAll(e, n);
    },
    configurable: !0,
    enumerable: !0
  });
}
Et.extend(qa);
Et.extend({ deltaE: ki });
Object.assign(Et, { deltaEMethods: qa });
Et.extend(q7);
Et.extend({ contrast: P7 });
Et.extend(B7);
Et.extend(b7);
Et.extend(z7);
Et.extend(ds);
const fv = {
  gray1: "#111111",
  gray2: "#191919",
  gray3: "#222222",
  gray4: "#2a2a2a",
  gray5: "#313131",
  gray6: "#3a3a3a",
  gray7: "#484848",
  gray8: "#606060",
  gray9: "#6e6e6e",
  gray10: "#7b7b7b",
  gray11: "#b4b4b4",
  gray12: "#eeeeee"
}, dv = {
  grayA1: "#00000000",
  grayA2: "#ffffff09",
  grayA3: "#ffffff12",
  grayA4: "#ffffff1b",
  grayA5: "#ffffff22",
  grayA6: "#ffffff2c",
  grayA7: "#ffffff3b",
  grayA8: "#ffffff55",
  grayA9: "#ffffff64",
  grayA10: "#ffffff72",
  grayA11: "#ffffffaf",
  grayA12: "#ffffffed"
}, pv = {
  gray1: "color(display-p3 0.067 0.067 0.067)",
  gray2: "color(display-p3 0.098 0.098 0.098)",
  gray3: "color(display-p3 0.135 0.135 0.135)",
  gray4: "color(display-p3 0.163 0.163 0.163)",
  gray5: "color(display-p3 0.192 0.192 0.192)",
  gray6: "color(display-p3 0.228 0.228 0.228)",
  gray7: "color(display-p3 0.283 0.283 0.283)",
  gray8: "color(display-p3 0.375 0.375 0.375)",
  gray9: "color(display-p3 0.431 0.431 0.431)",
  gray10: "color(display-p3 0.484 0.484 0.484)",
  gray11: "color(display-p3 0.706 0.706 0.706)",
  gray12: "color(display-p3 0.933 0.933 0.933)"
}, hv = {
  grayA1: "color(display-p3 0 0 0 / 0)",
  grayA2: "color(display-p3 1 1 1 / 0.034)",
  grayA3: "color(display-p3 1 1 1 / 0.071)",
  grayA4: "color(display-p3 1 1 1 / 0.105)",
  grayA5: "color(display-p3 1 1 1 / 0.134)",
  grayA6: "color(display-p3 1 1 1 / 0.172)",
  grayA7: "color(display-p3 1 1 1 / 0.231)",
  grayA8: "color(display-p3 1 1 1 / 0.332)",
  grayA9: "color(display-p3 1 1 1 / 0.391)",
  grayA10: "color(display-p3 1 1 1 / 0.445)",
  grayA11: "color(display-p3 1 1 1 / 0.685)",
  grayA12: "color(display-p3 1 1 1 / 0.929)"
}, mv = {
  mauve1: "#121113",
  mauve2: "#1a191b",
  mauve3: "#232225",
  mauve4: "#2b292d",
  mauve5: "#323035",
  mauve6: "#3c393f",
  mauve7: "#49474e",
  mauve8: "#625f69",
  mauve9: "#6f6d78",
  mauve10: "#7c7a85",
  mauve11: "#b5b2bc",
  mauve12: "#eeeef0"
}, yv = {
  mauveA1: "#00000000",
  mauveA2: "#f5f4f609",
  mauveA3: "#ebeaf814",
  mauveA4: "#eee5f81d",
  mauveA5: "#efe6fe25",
  mauveA6: "#f1e6fd30",
  mauveA7: "#eee9ff40",
  mauveA8: "#eee7ff5d",
  mauveA9: "#eae6fd6e",
  mauveA10: "#ece9fd7c",
  mauveA11: "#f5f1ffb7",
  mauveA12: "#fdfdffef"
}, bv = {
  mauve1: "color(display-p3 0.07 0.067 0.074)",
  mauve2: "color(display-p3 0.101 0.098 0.105)",
  mauve3: "color(display-p3 0.138 0.134 0.144)",
  mauve4: "color(display-p3 0.167 0.161 0.175)",
  mauve5: "color(display-p3 0.196 0.189 0.206)",
  mauve6: "color(display-p3 0.232 0.225 0.245)",
  mauve7: "color(display-p3 0.286 0.277 0.302)",
  mauve8: "color(display-p3 0.383 0.373 0.408)",
  mauve9: "color(display-p3 0.434 0.428 0.467)",
  mauve10: "color(display-p3 0.487 0.48 0.519)",
  mauve11: "color(display-p3 0.707 0.7 0.735)",
  mauve12: "color(display-p3 0.933 0.933 0.94)"
}, gv = {
  mauveA1: "color(display-p3 0 0 0 / 0)",
  mauveA2: "color(display-p3 0.996 0.992 1 / 0.034)",
  mauveA3: "color(display-p3 0.937 0.933 0.992 / 0.077)",
  mauveA4: "color(display-p3 0.957 0.918 0.996 / 0.111)",
  mauveA5: "color(display-p3 0.937 0.906 0.996 / 0.145)",
  mauveA6: "color(display-p3 0.953 0.925 0.996 / 0.183)",
  mauveA7: "color(display-p3 0.945 0.929 1 / 0.246)",
  mauveA8: "color(display-p3 0.937 0.918 1 / 0.361)",
  mauveA9: "color(display-p3 0.933 0.918 1 / 0.424)",
  mauveA10: "color(display-p3 0.941 0.925 1 / 0.479)",
  mauveA11: "color(display-p3 0.965 0.961 1 / 0.712)",
  mauveA12: "color(display-p3 0.992 0.992 1 / 0.937)"
}, Av = {
  slate1: "#111113",
  slate2: "#18191b",
  slate3: "#212225",
  slate4: "#272a2d",
  slate5: "#2e3135",
  slate6: "#363a3f",
  slate7: "#43484e",
  slate8: "#5a6169",
  slate9: "#696e77",
  slate10: "#777b84",
  slate11: "#b0b4ba",
  slate12: "#edeef0"
}, vv = {
  slateA1: "#00000000",
  slateA2: "#d8f4f609",
  slateA3: "#ddeaf814",
  slateA4: "#d3edf81d",
  slateA5: "#d9edfe25",
  slateA6: "#d6ebfd30",
  slateA7: "#d9edff40",
  slateA8: "#d9edff5d",
  slateA9: "#dfebfd6d",
  slateA10: "#e5edfd7b",
  slateA11: "#f1f7feb5",
  slateA12: "#fcfdffef"
}, wv = {
  slate1: "color(display-p3 0.067 0.067 0.074)",
  slate2: "color(display-p3 0.095 0.098 0.105)",
  slate3: "color(display-p3 0.13 0.135 0.145)",
  slate4: "color(display-p3 0.156 0.163 0.176)",
  slate5: "color(display-p3 0.183 0.191 0.206)",
  slate6: "color(display-p3 0.215 0.226 0.244)",
  slate7: "color(display-p3 0.265 0.28 0.302)",
  slate8: "color(display-p3 0.357 0.381 0.409)",
  slate9: "color(display-p3 0.415 0.431 0.463)",
  slate10: "color(display-p3 0.469 0.483 0.514)",
  slate11: "color(display-p3 0.692 0.704 0.728)",
  slate12: "color(display-p3 0.93 0.933 0.94)"
}, xv = {
  slateA1: "color(display-p3 0 0 0 / 0)",
  slateA2: "color(display-p3 0.875 0.992 1 / 0.034)",
  slateA3: "color(display-p3 0.882 0.933 0.992 / 0.077)",
  slateA4: "color(display-p3 0.882 0.953 0.996 / 0.111)",
  slateA5: "color(display-p3 0.878 0.929 0.996 / 0.145)",
  slateA6: "color(display-p3 0.882 0.949 0.996 / 0.183)",
  slateA7: "color(display-p3 0.882 0.929 1 / 0.246)",
  slateA8: "color(display-p3 0.871 0.937 1 / 0.361)",
  slateA9: "color(display-p3 0.898 0.937 1 / 0.42)",
  slateA10: "color(display-p3 0.918 0.945 1 / 0.475)",
  slateA11: "color(display-p3 0.949 0.969 0.996 / 0.708)",
  slateA12: "color(display-p3 0.988 0.992 1 / 0.937)"
}, _v = {
  sage1: "#101211",
  sage2: "#171918",
  sage3: "#202221",
  sage4: "#272a29",
  sage5: "#2e3130",
  sage6: "#373b39",
  sage7: "#444947",
  sage8: "#5b625f",
  sage9: "#63706b",
  sage10: "#717d79",
  sage11: "#adb5b2",
  sage12: "#eceeed"
}, Ev = {
  sageA1: "#00000000",
  sageA2: "#f0f2f108",
  sageA3: "#f3f5f412",
  sageA4: "#f2fefd1a",
  sageA5: "#f1fbfa22",
  sageA6: "#edfbf42d",
  sageA7: "#edfcf73c",
  sageA8: "#ebfdf657",
  sageA9: "#dffdf266",
  sageA10: "#e5fdf674",
  sageA11: "#f4fefbb0",
  sageA12: "#fdfffeed"
}, Sv = {
  sage1: "color(display-p3 0.064 0.07 0.067)",
  sage2: "color(display-p3 0.092 0.098 0.094)",
  sage3: "color(display-p3 0.128 0.135 0.131)",
  sage4: "color(display-p3 0.155 0.164 0.159)",
  sage5: "color(display-p3 0.183 0.193 0.188)",
  sage6: "color(display-p3 0.218 0.23 0.224)",
  sage7: "color(display-p3 0.269 0.285 0.277)",
  sage8: "color(display-p3 0.362 0.382 0.373)",
  sage9: "color(display-p3 0.398 0.438 0.421)",
  sage10: "color(display-p3 0.453 0.49 0.474)",
  sage11: "color(display-p3 0.685 0.709 0.697)",
  sage12: "color(display-p3 0.927 0.933 0.93)"
}, kv = {
  sageA1: "color(display-p3 0 0 0 / 0)",
  sageA2: "color(display-p3 0.976 0.988 0.984 / 0.03)",
  sageA3: "color(display-p3 0.992 0.945 0.941 / 0.072)",
  sageA4: "color(display-p3 0.988 0.996 0.992 / 0.102)",
  sageA5: "color(display-p3 0.992 1 0.996 / 0.131)",
  sageA6: "color(display-p3 0.973 1 0.976 / 0.173)",
  sageA7: "color(display-p3 0.957 1 0.976 / 0.233)",
  sageA8: "color(display-p3 0.957 1 0.984 / 0.334)",
  sageA9: "color(display-p3 0.902 1 0.957 / 0.397)",
  sageA10: "color(display-p3 0.929 1 0.973 / 0.452)",
  sageA11: "color(display-p3 0.969 1 0.988 / 0.688)",
  sageA12: "color(display-p3 0.992 1 0.996 / 0.929)"
}, Tv = {
  olive1: "#111210",
  olive2: "#181917",
  olive3: "#212220",
  olive4: "#282a27",
  olive5: "#2f312e",
  olive6: "#383a36",
  olive7: "#454843",
  olive8: "#5c625b",
  olive9: "#687066",
  olive10: "#767d74",
  olive11: "#afb5ad",
  olive12: "#eceeec"
}, Dv = {
  oliveA1: "#00000000",
  oliveA2: "#f1f2f008",
  oliveA3: "#f4f5f312",
  oliveA4: "#f3fef21a",
  oliveA5: "#f2fbf122",
  oliveA6: "#f4faed2c",
  oliveA7: "#f2fced3b",
  oliveA8: "#edfdeb57",
  oliveA9: "#ebfde766",
  oliveA10: "#f0fdec74",
  oliveA11: "#f6fef4b0",
  oliveA12: "#fdfffded"
}, Mv = {
  olive1: "color(display-p3 0.067 0.07 0.063)",
  olive2: "color(display-p3 0.095 0.098 0.091)",
  olive3: "color(display-p3 0.131 0.135 0.126)",
  olive4: "color(display-p3 0.158 0.163 0.153)",
  olive5: "color(display-p3 0.186 0.192 0.18)",
  olive6: "color(display-p3 0.221 0.229 0.215)",
  olive7: "color(display-p3 0.273 0.284 0.266)",
  olive8: "color(display-p3 0.365 0.382 0.359)",
  olive9: "color(display-p3 0.414 0.438 0.404)",
  olive10: "color(display-p3 0.467 0.49 0.458)",
  olive11: "color(display-p3 0.69 0.709 0.682)",
  olive12: "color(display-p3 0.927 0.933 0.926)"
}, Cv = {
  oliveA1: "color(display-p3 0 0 0 / 0)",
  oliveA2: "color(display-p3 0.984 0.988 0.976 / 0.03)",
  oliveA3: "color(display-p3 0.992 0.996 0.988 / 0.068)",
  oliveA4: "color(display-p3 0.953 0.996 0.949 / 0.102)",
  oliveA5: "color(display-p3 0.969 1 0.965 / 0.131)",
  oliveA6: "color(display-p3 0.973 1 0.969 / 0.169)",
  oliveA7: "color(display-p3 0.98 1 0.961 / 0.228)",
  oliveA8: "color(display-p3 0.961 1 0.957 / 0.334)",
  oliveA9: "color(display-p3 0.949 1 0.922 / 0.397)",
  oliveA10: "color(display-p3 0.953 1 0.941 / 0.452)",
  oliveA11: "color(display-p3 0.976 1 0.965 / 0.688)",
  oliveA12: "color(display-p3 0.992 1 0.992 / 0.929)"
}, Lv = {
  sand1: "#111110",
  sand2: "#191918",
  sand3: "#222221",
  sand4: "#2a2a28",
  sand5: "#31312e",
  sand6: "#3b3a37",
  sand7: "#494844",
  sand8: "#62605b",
  sand9: "#6f6d66",
  sand10: "#7c7b74",
  sand11: "#b5b3ad",
  sand12: "#eeeeec"
}, Fv = {
  sandA1: "#00000000",
  sandA2: "#f4f4f309",
  sandA3: "#f6f6f513",
  sandA4: "#fefef31b",
  sandA5: "#fbfbeb23",
  sandA6: "#fffaed2d",
  sandA7: "#fffbed3c",
  sandA8: "#fff9eb57",
  sandA9: "#fffae965",
  sandA10: "#fffdee73",
  sandA11: "#fffcf4b0",
  sandA12: "#fffffded"
}, Rv = {
  sand1: "color(display-p3 0.067 0.067 0.063)",
  sand2: "color(display-p3 0.098 0.098 0.094)",
  sand3: "color(display-p3 0.135 0.135 0.129)",
  sand4: "color(display-p3 0.164 0.163 0.156)",
  sand5: "color(display-p3 0.193 0.192 0.183)",
  sand6: "color(display-p3 0.23 0.229 0.217)",
  sand7: "color(display-p3 0.285 0.282 0.267)",
  sand8: "color(display-p3 0.384 0.378 0.357)",
  sand9: "color(display-p3 0.434 0.428 0.403)",
  sand10: "color(display-p3 0.487 0.481 0.456)",
  sand11: "color(display-p3 0.707 0.703 0.68)",
  sand12: "color(display-p3 0.933 0.933 0.926)"
}, Ov = {
  sandA1: "color(display-p3 0 0 0 / 0)",
  sandA2: "color(display-p3 0.992 0.992 0.988 / 0.034)",
  sandA3: "color(display-p3 0.996 0.996 0.992 / 0.072)",
  sandA4: "color(display-p3 0.992 0.992 0.953 / 0.106)",
  sandA5: "color(display-p3 1 1 0.965 / 0.135)",
  sandA6: "color(display-p3 1 0.976 0.929 / 0.177)",
  sandA7: "color(display-p3 1 0.984 0.929 / 0.236)",
  sandA8: "color(display-p3 1 0.976 0.925 / 0.341)",
  sandA9: "color(display-p3 1 0.98 0.925 / 0.395)",
  sandA10: "color(display-p3 1 0.992 0.933 / 0.45)",
  sandA11: "color(display-p3 1 0.996 0.961 / 0.685)",
  sandA12: "color(display-p3 1 1 0.992 / 0.929)"
}, Pv = {
  tomato1: "#181111",
  tomato2: "#1f1513",
  tomato3: "#391714",
  tomato4: "#4e1511",
  tomato5: "#5e1c16",
  tomato6: "#6e2920",
  tomato7: "#853a2d",
  tomato8: "#ac4d39",
  tomato9: "#e54d2e",
  tomato10: "#ec6142",
  tomato11: "#ff977d",
  tomato12: "#fbd3cb"
}, Iv = {
  tomatoA1: "#f1121208",
  tomatoA2: "#ff55330f",
  tomatoA3: "#ff35232b",
  tomatoA4: "#fd201142",
  tomatoA5: "#fe332153",
  tomatoA6: "#ff4f3864",
  tomatoA7: "#fd644a7d",
  tomatoA8: "#fe6d4ea7",
  tomatoA9: "#fe5431e4",
  tomatoA10: "#ff6847eb",
  tomatoA11: "#ff977d",
  tomatoA12: "#ffd6cefb"
}, Bv = {
  tomato1: "color(display-p3 0.09 0.068 0.067)",
  tomato2: "color(display-p3 0.115 0.084 0.076)",
  tomato3: "color(display-p3 0.205 0.097 0.083)",
  tomato4: "color(display-p3 0.282 0.099 0.077)",
  tomato5: "color(display-p3 0.339 0.129 0.101)",
  tomato6: "color(display-p3 0.398 0.179 0.141)",
  tomato7: "color(display-p3 0.487 0.245 0.194)",
  tomato8: "color(display-p3 0.629 0.322 0.248)",
  tomato9: "color(display-p3 0.831 0.345 0.231)",
  tomato10: "color(display-p3 0.862 0.415 0.298)",
  tomato11: "color(display-p3 1 0.585 0.455)",
  tomato12: "color(display-p3 0.959 0.833 0.802)"
}, Nv = {
  tomatoA1: "color(display-p3 0.973 0.071 0.071 / 0.026)",
  tomatoA2: "color(display-p3 0.992 0.376 0.224 / 0.051)",
  tomatoA3: "color(display-p3 0.996 0.282 0.176 / 0.148)",
  tomatoA4: "color(display-p3 1 0.204 0.118 / 0.232)",
  tomatoA5: "color(display-p3 1 0.286 0.192 / 0.29)",
  tomatoA6: "color(display-p3 1 0.392 0.278 / 0.353)",
  tomatoA7: "color(display-p3 1 0.459 0.349 / 0.45)",
  tomatoA8: "color(display-p3 1 0.49 0.369 / 0.601)",
  tomatoA9: "color(display-p3 1 0.408 0.267 / 0.82)",
  tomatoA10: "color(display-p3 1 0.478 0.341 / 0.853)",
  tomatoA11: "color(display-p3 1 0.585 0.455)",
  tomatoA12: "color(display-p3 0.959 0.833 0.802)"
}, Gv = {
  red1: "#191111",
  red2: "#201314",
  red3: "#3b1219",
  red4: "#500f1c",
  red5: "#611623",
  red6: "#72232d",
  red7: "#8c333a",
  red8: "#b54548",
  red9: "#e5484d",
  red10: "#ec5d5e",
  red11: "#ff9592",
  red12: "#ffd1d9"
}, qv = {
  redA1: "#f4121209",
  redA2: "#f22f3e11",
  redA3: "#ff173f2d",
  redA4: "#fe0a3b44",
  redA5: "#ff204756",
  redA6: "#ff3e5668",
  redA7: "#ff536184",
  redA8: "#ff5d61b0",
  redA9: "#fe4e54e4",
  redA10: "#ff6465eb",
  redA11: "#ff9592",
  redA12: "#ffd1d9"
}, $v = {
  red1: "color(display-p3 0.093 0.068 0.067)",
  red2: "color(display-p3 0.118 0.077 0.079)",
  red3: "color(display-p3 0.211 0.081 0.099)",
  red4: "color(display-p3 0.287 0.079 0.113)",
  red5: "color(display-p3 0.348 0.11 0.142)",
  red6: "color(display-p3 0.414 0.16 0.183)",
  red7: "color(display-p3 0.508 0.224 0.236)",
  red8: "color(display-p3 0.659 0.298 0.297)",
  red9: "color(display-p3 0.83 0.329 0.324)",
  red10: "color(display-p3 0.861 0.403 0.387)",
  red11: "color(display-p3 1 0.57 0.55)",
  red12: "color(display-p3 0.971 0.826 0.852)"
}, zv = {
  redA1: "color(display-p3 0.984 0.071 0.071 / 0.03)",
  redA2: "color(display-p3 0.996 0.282 0.282 / 0.055)",
  redA3: "color(display-p3 1 0.169 0.271 / 0.156)",
  redA4: "color(display-p3 1 0.118 0.267 / 0.236)",
  redA5: "color(display-p3 1 0.212 0.314 / 0.303)",
  redA6: "color(display-p3 1 0.318 0.38 / 0.374)",
  redA7: "color(display-p3 1 0.4 0.424 / 0.475)",
  redA8: "color(display-p3 1 0.431 0.431 / 0.635)",
  redA9: "color(display-p3 1 0.388 0.384 / 0.82)",
  redA10: "color(display-p3 1 0.463 0.447 / 0.853)",
  redA11: "color(display-p3 1 0.57 0.55)",
  redA12: "color(display-p3 0.971 0.826 0.852)"
}, jv = {
  ruby1: "#191113",
  ruby2: "#1e1517",
  ruby3: "#3a141e",
  ruby4: "#4e1325",
  ruby5: "#5e1a2e",
  ruby6: "#6f2539",
  ruby7: "#883447",
  ruby8: "#b3445a",
  ruby9: "#e54666",
  ruby10: "#ec5a72",
  ruby11: "#ff949d",
  ruby12: "#fed2e1"
}, Hv = {
  rubyA1: "#f4124a09",
  rubyA2: "#fe5a7f0e",
  rubyA3: "#ff235d2c",
  rubyA4: "#fd195e42",
  rubyA5: "#fe2d6b53",
  rubyA6: "#ff447665",
  rubyA7: "#ff577d80",
  rubyA8: "#ff5c7cae",
  rubyA9: "#fe4c70e4",
  rubyA10: "#ff617beb",
  rubyA11: "#ff949d",
  rubyA12: "#ffd3e2fe"
}, Uv = {
  ruby1: "color(display-p3 0.093 0.068 0.074)",
  ruby2: "color(display-p3 0.113 0.083 0.089)",
  ruby3: "color(display-p3 0.208 0.088 0.117)",
  ruby4: "color(display-p3 0.279 0.092 0.147)",
  ruby5: "color(display-p3 0.337 0.12 0.18)",
  ruby6: "color(display-p3 0.401 0.166 0.223)",
  ruby7: "color(display-p3 0.495 0.224 0.281)",
  ruby8: "color(display-p3 0.652 0.295 0.359)",
  ruby9: "color(display-p3 0.83 0.323 0.408)",
  ruby10: "color(display-p3 0.857 0.392 0.455)",
  ruby11: "color(display-p3 1 0.57 0.59)",
  ruby12: "color(display-p3 0.968 0.83 0.88)"
}, Vv = {
  rubyA1: "color(display-p3 0.984 0.071 0.329 / 0.03)",
  rubyA2: "color(display-p3 0.992 0.376 0.529 / 0.051)",
  rubyA3: "color(display-p3 0.996 0.196 0.404 / 0.152)",
  rubyA4: "color(display-p3 1 0.173 0.416 / 0.227)",
  rubyA5: "color(display-p3 1 0.259 0.459 / 0.29)",
  rubyA6: "color(display-p3 1 0.341 0.506 / 0.358)",
  rubyA7: "color(display-p3 1 0.412 0.541 / 0.458)",
  rubyA8: "color(display-p3 1 0.431 0.537 / 0.627)",
  rubyA9: "color(display-p3 1 0.376 0.482 / 0.82)",
  rubyA10: "color(display-p3 1 0.447 0.522 / 0.849)",
  rubyA11: "color(display-p3 1 0.57 0.59)",
  rubyA12: "color(display-p3 0.968 0.83 0.88)"
}, Wv = {
  crimson1: "#191114",
  crimson2: "#201318",
  crimson3: "#381525",
  crimson4: "#4d122f",
  crimson5: "#5c1839",
  crimson6: "#6d2545",
  crimson7: "#873356",
  crimson8: "#b0436e",
  crimson9: "#e93d82",
  crimson10: "#ee518a",
  crimson11: "#ff92ad",
  crimson12: "#fdd3e8"
}, Xv = {
  crimsonA1: "#f4126709",
  crimsonA2: "#f22f7a11",
  crimsonA3: "#fe2a8b2a",
  crimsonA4: "#fd158741",
  crimsonA5: "#fd278f51",
  crimsonA6: "#fe459763",
  crimsonA7: "#fd559b7f",
  crimsonA8: "#fe5b9bab",
  crimsonA9: "#fe418de8",
  crimsonA10: "#ff5693ed",
  crimsonA11: "#ff92ad",
  crimsonA12: "#ffd5eafd"
}, Yv = {
  crimson1: "color(display-p3 0.093 0.068 0.078)",
  crimson2: "color(display-p3 0.117 0.078 0.095)",
  crimson3: "color(display-p3 0.203 0.091 0.143)",
  crimson4: "color(display-p3 0.277 0.087 0.182)",
  crimson5: "color(display-p3 0.332 0.115 0.22)",
  crimson6: "color(display-p3 0.394 0.162 0.268)",
  crimson7: "color(display-p3 0.489 0.222 0.336)",
  crimson8: "color(display-p3 0.638 0.289 0.429)",
  crimson9: "color(display-p3 0.843 0.298 0.507)",
  crimson10: "color(display-p3 0.864 0.364 0.539)",
  crimson11: "color(display-p3 1 0.56 0.66)",
  crimson12: "color(display-p3 0.966 0.834 0.906)"
}, Kv = {
  crimsonA1: "color(display-p3 0.984 0.071 0.463 / 0.03)",
  crimsonA2: "color(display-p3 0.996 0.282 0.569 / 0.055)",
  crimsonA3: "color(display-p3 0.996 0.227 0.573 / 0.148)",
  crimsonA4: "color(display-p3 1 0.157 0.569 / 0.227)",
  crimsonA5: "color(display-p3 1 0.231 0.604 / 0.286)",
  crimsonA6: "color(display-p3 1 0.337 0.643 / 0.349)",
  crimsonA7: "color(display-p3 1 0.416 0.663 / 0.454)",
  crimsonA8: "color(display-p3 0.996 0.427 0.651 / 0.614)",
  crimsonA9: "color(display-p3 1 0.345 0.596 / 0.832)",
  crimsonA10: "color(display-p3 1 0.42 0.62 / 0.853)",
  crimsonA11: "color(display-p3 1 0.56 0.66)",
  crimsonA12: "color(display-p3 0.966 0.834 0.906)"
}, Zv = {
  pink1: "#191117",
  pink2: "#21121d",
  pink3: "#37172f",
  pink4: "#4b143d",
  pink5: "#591c47",
  pink6: "#692955",
  pink7: "#833869",
  pink8: "#a84885",
  pink9: "#d6409f",
  pink10: "#de51a8",
  pink11: "#ff8dcc",
  pink12: "#fdd1ea"
}, Qv = {
  pinkA1: "#f412bc09",
  pinkA2: "#f420bb12",
  pinkA3: "#fe37cc29",
  pinkA4: "#fc1ec43f",
  pinkA5: "#fd35c24e",
  pinkA6: "#fd51c75f",
  pinkA7: "#fd62c87b",
  pinkA8: "#ff68c8a2",
  pinkA9: "#fe49bcd4",
  pinkA10: "#ff5cc0dc",
  pinkA11: "#ff8dcc",
  pinkA12: "#ffd3ecfd"
}, Jv = {
  pink1: "color(display-p3 0.093 0.068 0.089)",
  pink2: "color(display-p3 0.121 0.073 0.11)",
  pink3: "color(display-p3 0.198 0.098 0.179)",
  pink4: "color(display-p3 0.271 0.095 0.231)",
  pink5: "color(display-p3 0.32 0.127 0.273)",
  pink6: "color(display-p3 0.382 0.177 0.326)",
  pink7: "color(display-p3 0.477 0.238 0.405)",
  pink8: "color(display-p3 0.612 0.304 0.51)",
  pink9: "color(display-p3 0.775 0.297 0.61)",
  pink10: "color(display-p3 0.808 0.356 0.645)",
  pink11: "color(display-p3 1 0.535 0.78)",
  pink12: "color(display-p3 0.964 0.826 0.912)"
}, ew = {
  pinkA1: "color(display-p3 0.984 0.071 0.855 / 0.03)",
  pinkA2: "color(display-p3 1 0.2 0.8 / 0.059)",
  pinkA3: "color(display-p3 1 0.294 0.886 / 0.139)",
  pinkA4: "color(display-p3 1 0.192 0.82 / 0.219)",
  pinkA5: "color(display-p3 1 0.282 0.827 / 0.274)",
  pinkA6: "color(display-p3 1 0.396 0.835 / 0.337)",
  pinkA7: "color(display-p3 1 0.459 0.831 / 0.442)",
  pinkA8: "color(display-p3 1 0.478 0.827 / 0.585)",
  pinkA9: "color(display-p3 1 0.373 0.784 / 0.761)",
  pinkA10: "color(display-p3 1 0.435 0.792 / 0.795)",
  pinkA11: "color(display-p3 1 0.535 0.78)",
  pinkA12: "color(display-p3 0.964 0.826 0.912)"
}, tw = {
  plum1: "#181118",
  plum2: "#201320",
  plum3: "#351a35",
  plum4: "#451d47",
  plum5: "#512454",
  plum6: "#5e3061",
  plum7: "#734079",
  plum8: "#92549c",
  plum9: "#ab4aba",
  plum10: "#b658c4",
  plum11: "#e796f3",
  plum12: "#f4d4f4"
}, rw = {
  plumA1: "#f112f108",
  plumA2: "#f22ff211",
  plumA3: "#fd4cfd27",
  plumA4: "#f646ff3a",
  plumA5: "#f455ff48",
  plumA6: "#f66dff56",
  plumA7: "#f07cfd70",
  plumA8: "#ee84ff95",
  plumA9: "#e961feb6",
  plumA10: "#ed70ffc0",
  plumA11: "#f19cfef3",
  plumA12: "#feddfef4"
}, nw = {
  plum1: "color(display-p3 0.09 0.068 0.092)",
  plum2: "color(display-p3 0.118 0.077 0.121)",
  plum3: "color(display-p3 0.192 0.105 0.202)",
  plum4: "color(display-p3 0.25 0.121 0.271)",
  plum5: "color(display-p3 0.293 0.152 0.319)",
  plum6: "color(display-p3 0.343 0.198 0.372)",
  plum7: "color(display-p3 0.424 0.262 0.461)",
  plum8: "color(display-p3 0.54 0.341 0.595)",
  plum9: "color(display-p3 0.624 0.313 0.708)",
  plum10: "color(display-p3 0.666 0.365 0.748)",
  plum11: "color(display-p3 0.86 0.602 0.933)",
  plum12: "color(display-p3 0.936 0.836 0.949)"
}, ow = {
  plumA1: "color(display-p3 0.973 0.071 0.973 / 0.026)",
  plumA2: "color(display-p3 0.933 0.267 1 / 0.059)",
  plumA3: "color(display-p3 0.918 0.333 0.996 / 0.148)",
  plumA4: "color(display-p3 0.91 0.318 1 / 0.219)",
  plumA5: "color(display-p3 0.914 0.388 1 / 0.269)",
  plumA6: "color(display-p3 0.906 0.463 1 / 0.328)",
  plumA7: "color(display-p3 0.906 0.529 1 / 0.425)",
  plumA8: "color(display-p3 0.906 0.553 1 / 0.568)",
  plumA9: "color(display-p3 0.875 0.427 1 / 0.69)",
  plumA10: "color(display-p3 0.886 0.471 0.996 / 0.732)",
  plumA11: "color(display-p3 0.86 0.602 0.933)",
  plumA12: "color(display-p3 0.936 0.836 0.949)"
}, aw = {
  purple1: "#18111b",
  purple2: "#1e1523",
  purple3: "#301c3b",
  purple4: "#3d224e",
  purple5: "#48295c",
  purple6: "#54346b",
  purple7: "#664282",
  purple8: "#8457aa",
  purple9: "#8e4ec6",
  purple10: "#9a5cd0",
  purple11: "#d19dff",
  purple12: "#ecd9fa"
}, iw = {
  purpleA1: "#b412f90b",
  purpleA2: "#b744f714",
  purpleA3: "#c150ff2d",
  purpleA4: "#bb53fd42",
  purpleA5: "#be5cfd51",
  purpleA6: "#c16dfd61",
  purpleA7: "#c378fd7a",
  purpleA8: "#c47effa4",
  purpleA9: "#b661ffc2",
  purpleA10: "#bc6fffcd",
  purpleA11: "#d19dff",
  purpleA12: "#f1ddfffa"
}, sw = {
  purple1: "color(display-p3 0.09 0.068 0.103)",
  purple2: "color(display-p3 0.113 0.082 0.134)",
  purple3: "color(display-p3 0.175 0.112 0.224)",
  purple4: "color(display-p3 0.224 0.137 0.297)",
  purple5: "color(display-p3 0.264 0.167 0.349)",
  purple6: "color(display-p3 0.311 0.208 0.406)",
  purple7: "color(display-p3 0.381 0.266 0.496)",
  purple8: "color(display-p3 0.49 0.349 0.649)",
  purple9: "color(display-p3 0.523 0.318 0.751)",
  purple10: "color(display-p3 0.57 0.373 0.791)",
  purple11: "color(display-p3 0.8 0.62 1)",
  purple12: "color(display-p3 0.913 0.854 0.971)"
}, lw = {
  purpleA1: "color(display-p3 0.686 0.071 0.996 / 0.038)",
  purpleA2: "color(display-p3 0.722 0.286 0.996 / 0.072)",
  purpleA3: "color(display-p3 0.718 0.349 0.996 / 0.169)",
  purpleA4: "color(display-p3 0.702 0.353 1 / 0.248)",
  purpleA5: "color(display-p3 0.718 0.404 1 / 0.303)",
  purpleA6: "color(display-p3 0.733 0.455 1 / 0.366)",
  purpleA7: "color(display-p3 0.753 0.506 1 / 0.458)",
  purpleA8: "color(display-p3 0.749 0.522 1 / 0.622)",
  purpleA9: "color(display-p3 0.686 0.408 1 / 0.736)",
  purpleA10: "color(display-p3 0.71 0.459 1 / 0.778)",
  purpleA11: "color(display-p3 0.8 0.62 1)",
  purpleA12: "color(display-p3 0.913 0.854 0.971)"
}, cw = {
  violet1: "#14121f",
  violet2: "#1b1525",
  violet3: "#291f43",
  violet4: "#33255b",
  violet5: "#3c2e69",
  violet6: "#473876",
  violet7: "#56468b",
  violet8: "#6958ad",
  violet9: "#6e56cf",
  violet10: "#7d66d9",
  violet11: "#baa7ff",
  violet12: "#e2ddfe"
}, uw = {
  violetA1: "#4422ff0f",
  violetA2: "#853ff916",
  violetA3: "#8354fe36",
  violetA4: "#7d51fd50",
  violetA5: "#845ffd5f",
  violetA6: "#8f6cfd6d",
  violetA7: "#9879ff83",
  violetA8: "#977dfea8",
  violetA9: "#8668ffcc",
  violetA10: "#9176fed7",
  violetA11: "#baa7ff",
  violetA12: "#e3defffe"
}, fw = {
  violet1: "color(display-p3 0.077 0.071 0.118)",
  violet2: "color(display-p3 0.101 0.084 0.141)",
  violet3: "color(display-p3 0.154 0.123 0.256)",
  violet4: "color(display-p3 0.191 0.148 0.345)",
  violet5: "color(display-p3 0.226 0.182 0.396)",
  violet6: "color(display-p3 0.269 0.223 0.449)",
  violet7: "color(display-p3 0.326 0.277 0.53)",
  violet8: "color(display-p3 0.399 0.346 0.656)",
  violet9: "color(display-p3 0.417 0.341 0.784)",
  violet10: "color(display-p3 0.477 0.402 0.823)",
  violet11: "color(display-p3 0.72 0.65 1)",
  violet12: "color(display-p3 0.883 0.867 0.986)"
}, dw = {
  violetA1: "color(display-p3 0.282 0.141 0.996 / 0.055)",
  violetA2: "color(display-p3 0.51 0.263 1 / 0.08)",
  violetA3: "color(display-p3 0.494 0.337 0.996 / 0.202)",
  violetA4: "color(display-p3 0.49 0.345 1 / 0.299)",
  violetA5: "color(display-p3 0.525 0.392 1 / 0.353)",
  violetA6: "color(display-p3 0.569 0.455 1 / 0.408)",
  violetA7: "color(display-p3 0.588 0.494 1 / 0.496)",
  violetA8: "color(display-p3 0.596 0.51 1 / 0.631)",
  violetA9: "color(display-p3 0.522 0.424 1 / 0.769)",
  violetA10: "color(display-p3 0.576 0.482 1 / 0.811)",
  violetA11: "color(display-p3 0.72 0.65 1)",
  violetA12: "color(display-p3 0.883 0.867 0.986)"
}, pw = {
  iris1: "#13131e",
  iris2: "#171625",
  iris3: "#202248",
  iris4: "#262a65",
  iris5: "#303374",
  iris6: "#3d3e82",
  iris7: "#4a4a95",
  iris8: "#5958b1",
  iris9: "#5b5bd6",
  iris10: "#6e6ade",
  iris11: "#b1a9ff",
  iris12: "#e0dffe"
}, hw = {
  irisA1: "#3636fe0e",
  irisA2: "#564bf916",
  irisA3: "#525bff3b",
  irisA4: "#4d58ff5a",
  irisA5: "#5b62fd6b",
  irisA6: "#6d6ffd7a",
  irisA7: "#7777fe8e",
  irisA8: "#7b7afeac",
  irisA9: "#6a6afed4",
  irisA10: "#7d79ffdc",
  irisA11: "#b1a9ff",
  irisA12: "#e1e0fffe"
}, mw = {
  iris1: "color(display-p3 0.075 0.075 0.114)",
  iris2: "color(display-p3 0.089 0.086 0.14)",
  iris3: "color(display-p3 0.128 0.134 0.272)",
  iris4: "color(display-p3 0.153 0.165 0.382)",
  iris5: "color(display-p3 0.192 0.201 0.44)",
  iris6: "color(display-p3 0.239 0.241 0.491)",
  iris7: "color(display-p3 0.291 0.289 0.565)",
  iris8: "color(display-p3 0.35 0.345 0.673)",
  iris9: "color(display-p3 0.357 0.357 0.81)",
  iris10: "color(display-p3 0.428 0.416 0.843)",
  iris11: "color(display-p3 0.685 0.662 1)",
  iris12: "color(display-p3 0.878 0.875 0.986)"
}, yw = {
  irisA1: "color(display-p3 0.224 0.224 0.992 / 0.051)",
  irisA2: "color(display-p3 0.361 0.314 1 / 0.08)",
  irisA3: "color(display-p3 0.357 0.373 1 / 0.219)",
  irisA4: "color(display-p3 0.325 0.361 1 / 0.337)",
  irisA5: "color(display-p3 0.38 0.4 1 / 0.4)",
  irisA6: "color(display-p3 0.447 0.447 1 / 0.454)",
  irisA7: "color(display-p3 0.486 0.486 1 / 0.534)",
  irisA8: "color(display-p3 0.502 0.494 1 / 0.652)",
  irisA9: "color(display-p3 0.431 0.431 1 / 0.799)",
  irisA10: "color(display-p3 0.502 0.486 1 / 0.832)",
  irisA11: "color(display-p3 0.685 0.662 1)",
  irisA12: "color(display-p3 0.878 0.875 0.986)"
}, bw = {
  indigo1: "#11131f",
  indigo2: "#141726",
  indigo3: "#182449",
  indigo4: "#1d2e62",
  indigo5: "#253974",
  indigo6: "#304384",
  indigo7: "#3a4f97",
  indigo8: "#435db1",
  indigo9: "#3e63dd",
  indigo10: "#5472e4",
  indigo11: "#9eb1ff",
  indigo12: "#d6e1ff"
}, gw = {
  indigoA1: "#1133ff0f",
  indigoA2: "#3354fa17",
  indigoA3: "#2f62ff3c",
  indigoA4: "#3566ff57",
  indigoA5: "#4171fd6b",
  indigoA6: "#5178fd7c",
  indigoA7: "#5a7fff90",
  indigoA8: "#5b81feac",
  indigoA9: "#4671ffdb",
  indigoA10: "#5c7efee3",
  indigoA11: "#9eb1ff",
  indigoA12: "#d6e1ff"
}, Aw = {
  indigo1: "color(display-p3 0.068 0.074 0.118)",
  indigo2: "color(display-p3 0.081 0.089 0.144)",
  indigo3: "color(display-p3 0.105 0.141 0.275)",
  indigo4: "color(display-p3 0.129 0.18 0.369)",
  indigo5: "color(display-p3 0.163 0.22 0.439)",
  indigo6: "color(display-p3 0.203 0.262 0.5)",
  indigo7: "color(display-p3 0.245 0.309 0.575)",
  indigo8: "color(display-p3 0.285 0.362 0.674)",
  indigo9: "color(display-p3 0.276 0.384 0.837)",
  indigo10: "color(display-p3 0.354 0.445 0.866)",
  indigo11: "color(display-p3 0.63 0.69 1)",
  indigo12: "color(display-p3 0.848 0.881 0.99)"
}, vw = {
  indigoA1: "color(display-p3 0.071 0.212 0.996 / 0.055)",
  indigoA2: "color(display-p3 0.251 0.345 0.988 / 0.085)",
  indigoA3: "color(display-p3 0.243 0.404 1 / 0.223)",
  indigoA4: "color(display-p3 0.263 0.42 1 / 0.324)",
  indigoA5: "color(display-p3 0.314 0.451 1 / 0.4)",
  indigoA6: "color(display-p3 0.361 0.49 1 / 0.467)",
  indigoA7: "color(display-p3 0.388 0.51 1 / 0.547)",
  indigoA8: "color(display-p3 0.404 0.518 1 / 0.652)",
  indigoA9: "color(display-p3 0.318 0.451 1 / 0.824)",
  indigoA10: "color(display-p3 0.404 0.506 1 / 0.858)",
  indigoA11: "color(display-p3 0.63 0.69 1)",
  indigoA12: "color(display-p3 0.848 0.881 0.99)"
}, ww = {
  blue1: "#0d1520",
  blue2: "#111927",
  blue3: "#0d2847",
  blue4: "#003362",
  blue5: "#004074",
  blue6: "#104d87",
  blue7: "#205d9e",
  blue8: "#2870bd",
  blue9: "#0090ff",
  blue10: "#3b9eff",
  blue11: "#70b8ff",
  blue12: "#c2e6ff"
}, xw = {
  blueA1: "#004df211",
  blueA2: "#1166fb18",
  blueA3: "#0077ff3a",
  blueA4: "#0075ff57",
  blueA5: "#0081fd6b",
  blueA6: "#0f89fd7f",
  blueA7: "#2a91fe98",
  blueA8: "#3094feb9",
  blueA9: "#0090ff",
  blueA10: "#3b9eff",
  blueA11: "#70b8ff",
  blueA12: "#c2e6ff"
}, _w = {
  blue1: "color(display-p3 0.057 0.081 0.122)",
  blue2: "color(display-p3 0.072 0.098 0.147)",
  blue3: "color(display-p3 0.078 0.154 0.27)",
  blue4: "color(display-p3 0.033 0.197 0.37)",
  blue5: "color(display-p3 0.08 0.245 0.441)",
  blue6: "color(display-p3 0.14 0.298 0.511)",
  blue7: "color(display-p3 0.195 0.361 0.6)",
  blue8: "color(display-p3 0.239 0.434 0.72)",
  blue9: "color(display-p3 0.247 0.556 0.969)",
  blue10: "color(display-p3 0.344 0.612 0.973)",
  blue11: "color(display-p3 0.49 0.72 1)",
  blue12: "color(display-p3 0.788 0.898 0.99)"
}, Ew = {
  blueA1: "color(display-p3 0 0.333 1 / 0.059)",
  blueA2: "color(display-p3 0.114 0.435 0.988 / 0.085)",
  blueA3: "color(display-p3 0.122 0.463 1 / 0.219)",
  blueA4: "color(display-p3 0 0.467 1 / 0.324)",
  blueA5: "color(display-p3 0.098 0.51 1 / 0.4)",
  blueA6: "color(display-p3 0.224 0.557 1 / 0.475)",
  blueA7: "color(display-p3 0.294 0.584 1 / 0.572)",
  blueA8: "color(display-p3 0.314 0.592 1 / 0.702)",
  blueA9: "color(display-p3 0.251 0.573 0.996 / 0.967)",
  blueA10: "color(display-p3 0.357 0.631 1 / 0.971)",
  blueA11: "color(display-p3 0.49 0.72 1)",
  blueA12: "color(display-p3 0.788 0.898 0.99)"
}, Sw = {
  cyan1: "#0b161a",
  cyan2: "#101b20",
  cyan3: "#082c36",
  cyan4: "#003848",
  cyan5: "#004558",
  cyan6: "#045468",
  cyan7: "#12677e",
  cyan8: "#11809c",
  cyan9: "#00a2c7",
  cyan10: "#23afd0",
  cyan11: "#4ccce6",
  cyan12: "#b6ecf7"
}, kw = {
  cyanA1: "#0091f70a",
  cyanA2: "#02a7f211",
  cyanA3: "#00befd28",
  cyanA4: "#00baff3b",
  cyanA5: "#00befd4d",
  cyanA6: "#00c7fd5e",
  cyanA7: "#14cdff75",
  cyanA8: "#11cfff95",
  cyanA9: "#00cfffc3",
  cyanA10: "#28d6ffcd",
  cyanA11: "#52e1fee5",
  cyanA12: "#bbf3fef7"
}, Tw = {
  cyan1: "color(display-p3 0.053 0.085 0.098)",
  cyan2: "color(display-p3 0.072 0.105 0.122)",
  cyan3: "color(display-p3 0.073 0.168 0.209)",
  cyan4: "color(display-p3 0.063 0.216 0.277)",
  cyan5: "color(display-p3 0.091 0.267 0.336)",
  cyan6: "color(display-p3 0.137 0.324 0.4)",
  cyan7: "color(display-p3 0.186 0.398 0.484)",
  cyan8: "color(display-p3 0.23 0.496 0.6)",
  cyan9: "color(display-p3 0.282 0.627 0.765)",
  cyan10: "color(display-p3 0.331 0.675 0.801)",
  cyan11: "color(display-p3 0.446 0.79 0.887)",
  cyan12: "color(display-p3 0.757 0.919 0.962)"
}, Dw = {
  cyanA1: "color(display-p3 0 0.647 0.992 / 0.034)",
  cyanA2: "color(display-p3 0.133 0.733 1 / 0.059)",
  cyanA3: "color(display-p3 0.122 0.741 0.996 / 0.152)",
  cyanA4: "color(display-p3 0.051 0.725 1 / 0.227)",
  cyanA5: "color(display-p3 0.149 0.757 1 / 0.29)",
  cyanA6: "color(display-p3 0.267 0.792 1 / 0.358)",
  cyanA7: "color(display-p3 0.333 0.808 1 / 0.446)",
  cyanA8: "color(display-p3 0.357 0.816 1 / 0.572)",
  cyanA9: "color(display-p3 0.357 0.82 1 / 0.748)",
  cyanA10: "color(display-p3 0.4 0.839 1 / 0.786)",
  cyanA11: "color(display-p3 0.446 0.79 0.887)",
  cyanA12: "color(display-p3 0.757 0.919 0.962)"
}, Mw = {
  teal1: "#0d1514",
  teal2: "#111c1b",
  teal3: "#0d2d2a",
  teal4: "#023b37",
  teal5: "#084843",
  teal6: "#145750",
  teal7: "#1c6961",
  teal8: "#207e73",
  teal9: "#12a594",
  teal10: "#0eb39e",
  teal11: "#0bd8b6",
  teal12: "#adf0dd"
}, Cw = {
  tealA1: "#00deab05",
  tealA2: "#12fbe60c",
  tealA3: "#00ffe61e",
  tealA4: "#00ffe92d",
  tealA5: "#00ffea3b",
  tealA6: "#1cffe84b",
  tealA7: "#2efde85f",
  tealA8: "#32ffe775",
  tealA9: "#13ffe49f",
  tealA10: "#0dffe0ae",
  tealA11: "#0afed5d6",
  tealA12: "#b8ffebef"
}, Lw = {
  teal1: "color(display-p3 0.059 0.083 0.079)",
  teal2: "color(display-p3 0.075 0.11 0.107)",
  teal3: "color(display-p3 0.087 0.175 0.165)",
  teal4: "color(display-p3 0.087 0.227 0.214)",
  teal5: "color(display-p3 0.12 0.277 0.261)",
  teal6: "color(display-p3 0.162 0.335 0.314)",
  teal7: "color(display-p3 0.205 0.406 0.379)",
  teal8: "color(display-p3 0.245 0.489 0.453)",
  teal9: "color(display-p3 0.297 0.637 0.581)",
  teal10: "color(display-p3 0.319 0.69 0.62)",
  teal11: "color(display-p3 0.388 0.835 0.719)",
  teal12: "color(display-p3 0.734 0.934 0.87)"
}, Fw = {
  tealA1: "color(display-p3 0 0.992 0.761 / 0.017)",
  tealA2: "color(display-p3 0.235 0.988 0.902 / 0.047)",
  tealA3: "color(display-p3 0.235 1 0.898 / 0.118)",
  tealA4: "color(display-p3 0.18 0.996 0.929 / 0.173)",
  tealA5: "color(display-p3 0.31 1 0.933 / 0.227)",
  tealA6: "color(display-p3 0.396 1 0.933 / 0.286)",
  tealA7: "color(display-p3 0.443 1 0.925 / 0.366)",
  tealA8: "color(display-p3 0.459 1 0.925 / 0.454)",
  tealA9: "color(display-p3 0.443 0.996 0.906 / 0.61)",
  tealA10: "color(display-p3 0.439 0.996 0.89 / 0.669)",
  tealA11: "color(display-p3 0.388 0.835 0.719)",
  tealA12: "color(display-p3 0.734 0.934 0.87)"
}, Rw = {
  jade1: "#0d1512",
  jade2: "#121c18",
  jade3: "#0f2e22",
  jade4: "#0b3b2c",
  jade5: "#114837",
  jade6: "#1b5745",
  jade7: "#246854",
  jade8: "#2a7e68",
  jade9: "#29a383",
  jade10: "#27b08b",
  jade11: "#1fd8a4",
  jade12: "#adf0d4"
}, Ow = {
  jadeA1: "#00de4505",
  jadeA2: "#27fba60c",
  jadeA3: "#02f99920",
  jadeA4: "#00ffaa2d",
  jadeA5: "#11ffb63b",
  jadeA6: "#34ffc24b",
  jadeA7: "#45fdc75e",
  jadeA8: "#48ffcf75",
  jadeA9: "#38feca9d",
  jadeA10: "#31fec7ab",
  jadeA11: "#21fec0d6",
  jadeA12: "#b8ffe1ef"
}, Pw = {
  jade1: "color(display-p3 0.059 0.083 0.071)",
  jade2: "color(display-p3 0.078 0.11 0.094)",
  jade3: "color(display-p3 0.091 0.176 0.138)",
  jade4: "color(display-p3 0.102 0.228 0.177)",
  jade5: "color(display-p3 0.133 0.279 0.221)",
  jade6: "color(display-p3 0.174 0.334 0.273)",
  jade7: "color(display-p3 0.219 0.402 0.335)",
  jade8: "color(display-p3 0.263 0.488 0.411)",
  jade9: "color(display-p3 0.319 0.63 0.521)",
  jade10: "color(display-p3 0.338 0.68 0.555)",
  jade11: "color(display-p3 0.4 0.835 0.656)",
  jade12: "color(display-p3 0.734 0.934 0.838)"
}, Iw = {
  jadeA1: "color(display-p3 0 0.992 0.298 / 0.017)",
  jadeA2: "color(display-p3 0.318 0.988 0.651 / 0.047)",
  jadeA3: "color(display-p3 0.267 1 0.667 / 0.118)",
  jadeA4: "color(display-p3 0.275 0.996 0.702 / 0.173)",
  jadeA5: "color(display-p3 0.361 1 0.741 / 0.227)",
  jadeA6: "color(display-p3 0.439 1 0.796 / 0.286)",
  jadeA7: "color(display-p3 0.49 1 0.804 / 0.362)",
  jadeA8: "color(display-p3 0.506 1 0.835 / 0.45)",
  jadeA9: "color(display-p3 0.478 0.996 0.816 / 0.606)",
  jadeA10: "color(display-p3 0.478 1 0.816 / 0.656)",
  jadeA11: "color(display-p3 0.4 0.835 0.656)",
  jadeA12: "color(display-p3 0.734 0.934 0.838)"
}, Bw = {
  green1: "#0e1512",
  green2: "#121b17",
  green3: "#132d21",
  green4: "#113b29",
  green5: "#174933",
  green6: "#20573e",
  green7: "#28684a",
  green8: "#2f7c57",
  green9: "#30a46c",
  green10: "#33b074",
  green11: "#3dd68c",
  green12: "#b1f1cb"
}, Nw = {
  greenA1: "#00de4505",
  greenA2: "#29f99d0b",
  greenA3: "#22ff991e",
  greenA4: "#11ff992d",
  greenA5: "#2bffa23c",
  greenA6: "#44ffaa4b",
  greenA7: "#50fdac5e",
  greenA8: "#54ffad73",
  greenA9: "#44ffa49e",
  greenA10: "#43fea4ab",
  greenA11: "#46fea5d4",
  greenA12: "#bbffd7f0"
}, Gw = {
  green1: "color(display-p3 0.062 0.083 0.071)",
  green2: "color(display-p3 0.079 0.106 0.09)",
  green3: "color(display-p3 0.1 0.173 0.133)",
  green4: "color(display-p3 0.115 0.229 0.166)",
  green5: "color(display-p3 0.147 0.282 0.206)",
  green6: "color(display-p3 0.185 0.338 0.25)",
  green7: "color(display-p3 0.227 0.403 0.298)",
  green8: "color(display-p3 0.27 0.479 0.351)",
  green9: "color(display-p3 0.332 0.634 0.442)",
  green10: "color(display-p3 0.357 0.682 0.474)",
  green11: "color(display-p3 0.434 0.828 0.573)",
  green12: "color(display-p3 0.747 0.938 0.807)"
}, qw = {
  greenA1: "color(display-p3 0 0.992 0.298 / 0.017)",
  greenA2: "color(display-p3 0.341 0.98 0.616 / 0.043)",
  greenA3: "color(display-p3 0.376 0.996 0.655 / 0.114)",
  greenA4: "color(display-p3 0.341 0.996 0.635 / 0.173)",
  greenA5: "color(display-p3 0.408 1 0.678 / 0.232)",
  greenA6: "color(display-p3 0.475 1 0.706 / 0.29)",
  greenA7: "color(display-p3 0.514 1 0.706 / 0.362)",
  greenA8: "color(display-p3 0.529 1 0.718 / 0.442)",
  greenA9: "color(display-p3 0.502 0.996 0.682 / 0.61)",
  greenA10: "color(display-p3 0.506 1 0.682 / 0.66)",
  greenA11: "color(display-p3 0.434 0.828 0.573)",
  greenA12: "color(display-p3 0.747 0.938 0.807)"
}, $w = {
  grass1: "#0e1511",
  grass2: "#141a15",
  grass3: "#1b2a1e",
  grass4: "#1d3a24",
  grass5: "#25482d",
  grass6: "#2d5736",
  grass7: "#366740",
  grass8: "#3e7949",
  grass9: "#46a758",
  grass10: "#53b365",
  grass11: "#71d083",
  grass12: "#c2f0c2"
}, zw = {
  grassA1: "#00de1205",
  grassA2: "#5ef7780a",
  grassA3: "#70fe8c1b",
  grassA4: "#57ff802c",
  grassA5: "#68ff8b3b",
  grassA6: "#71ff8f4b",
  grassA7: "#77fd925d",
  grassA8: "#77fd9070",
  grassA9: "#65ff82a1",
  grassA10: "#72ff8dae",
  grassA11: "#89ff9fcd",
  grassA12: "#ceffceef"
}, jw = {
  grass1: "color(display-p3 0.062 0.083 0.067)",
  grass2: "color(display-p3 0.083 0.103 0.085)",
  grass3: "color(display-p3 0.118 0.163 0.122)",
  grass4: "color(display-p3 0.142 0.225 0.15)",
  grass5: "color(display-p3 0.178 0.279 0.186)",
  grass6: "color(display-p3 0.217 0.337 0.224)",
  grass7: "color(display-p3 0.258 0.4 0.264)",
  grass8: "color(display-p3 0.302 0.47 0.305)",
  grass9: "color(display-p3 0.38 0.647 0.378)",
  grass10: "color(display-p3 0.426 0.694 0.426)",
  grass11: "color(display-p3 0.535 0.807 0.542)",
  grass12: "color(display-p3 0.797 0.936 0.776)"
}, Hw = {
  grassA1: "color(display-p3 0 0.992 0.071 / 0.017)",
  grassA2: "color(display-p3 0.482 0.996 0.584 / 0.038)",
  grassA3: "color(display-p3 0.549 0.992 0.588 / 0.106)",
  grassA4: "color(display-p3 0.51 0.996 0.557 / 0.169)",
  grassA5: "color(display-p3 0.553 1 0.588 / 0.227)",
  grassA6: "color(display-p3 0.584 1 0.608 / 0.29)",
  grassA7: "color(display-p3 0.604 1 0.616 / 0.358)",
  grassA8: "color(display-p3 0.608 1 0.62 / 0.433)",
  grassA9: "color(display-p3 0.573 1 0.569 / 0.622)",
  grassA10: "color(display-p3 0.6 0.996 0.6 / 0.673)",
  grassA11: "color(display-p3 0.535 0.807 0.542)",
  grassA12: "color(display-p3 0.797 0.936 0.776)"
}, Uw = {
  brown1: "#12110f",
  brown2: "#1c1816",
  brown3: "#28211d",
  brown4: "#322922",
  brown5: "#3e3128",
  brown6: "#4d3c2f",
  brown7: "#614a39",
  brown8: "#7c5f46",
  brown9: "#ad7f58",
  brown10: "#b88c67",
  brown11: "#dbb594",
  brown12: "#f2e1ca"
}, Vw = {
  brownA1: "#91110002",
  brownA2: "#fba67c0c",
  brownA3: "#fcb58c19",
  brownA4: "#fbbb8a24",
  brownA5: "#fcb88931",
  brownA6: "#fdba8741",
  brownA7: "#ffbb8856",
  brownA8: "#ffbe8773",
  brownA9: "#feb87da8",
  brownA10: "#ffc18cb3",
  brownA11: "#fed1aad9",
  brownA12: "#feecd4f2"
}, Ww = {
  brown1: "color(display-p3 0.071 0.067 0.059)",
  brown2: "color(display-p3 0.107 0.095 0.087)",
  brown3: "color(display-p3 0.151 0.13 0.115)",
  brown4: "color(display-p3 0.191 0.161 0.138)",
  brown5: "color(display-p3 0.235 0.194 0.162)",
  brown6: "color(display-p3 0.291 0.237 0.192)",
  brown7: "color(display-p3 0.365 0.295 0.232)",
  brown8: "color(display-p3 0.469 0.377 0.287)",
  brown9: "color(display-p3 0.651 0.505 0.368)",
  brown10: "color(display-p3 0.697 0.557 0.423)",
  brown11: "color(display-p3 0.835 0.715 0.597)",
  brown12: "color(display-p3 0.938 0.885 0.802)"
}, Xw = {
  brownA1: "color(display-p3 0.855 0.071 0 / 0.005)",
  brownA2: "color(display-p3 0.98 0.706 0.525 / 0.043)",
  brownA3: "color(display-p3 0.996 0.745 0.576 / 0.093)",
  brownA4: "color(display-p3 1 0.765 0.592 / 0.135)",
  brownA5: "color(display-p3 1 0.761 0.588 / 0.181)",
  brownA6: "color(display-p3 1 0.773 0.592 / 0.24)",
  brownA7: "color(display-p3 0.996 0.776 0.58 / 0.32)",
  brownA8: "color(display-p3 1 0.78 0.573 / 0.433)",
  brownA9: "color(display-p3 1 0.769 0.549 / 0.627)",
  brownA10: "color(display-p3 1 0.792 0.596 / 0.677)",
  brownA11: "color(display-p3 0.835 0.715 0.597)",
  brownA12: "color(display-p3 0.938 0.885 0.802)"
}, Yw = {
  bronze1: "#141110",
  bronze2: "#1c1917",
  bronze3: "#262220",
  bronze4: "#302a27",
  bronze5: "#3b3330",
  bronze6: "#493e3a",
  bronze7: "#5a4c47",
  bronze8: "#6f5f58",
  bronze9: "#a18072",
  bronze10: "#ae8c7e",
  bronze11: "#d4b3a5",
  bronze12: "#ede0d9"
}, Kw = {
  bronzeA1: "#d1110004",
  bronzeA2: "#fbbc910c",
  bronzeA3: "#faceb817",
  bronzeA4: "#facdb622",
  bronzeA5: "#ffd2c12d",
  bronzeA6: "#ffd1c03c",
  bronzeA7: "#fdd0c04f",
  bronzeA8: "#ffd6c565",
  bronzeA9: "#fec7b09b",
  bronzeA10: "#fecab5a9",
  bronzeA11: "#ffd7c6d1",
  bronzeA12: "#fff1e9ec"
}, Zw = {
  bronze1: "color(display-p3 0.076 0.067 0.063)",
  bronze2: "color(display-p3 0.106 0.097 0.093)",
  bronze3: "color(display-p3 0.147 0.132 0.125)",
  bronze4: "color(display-p3 0.185 0.166 0.156)",
  bronze5: "color(display-p3 0.227 0.202 0.19)",
  bronze6: "color(display-p3 0.278 0.246 0.23)",
  bronze7: "color(display-p3 0.343 0.302 0.281)",
  bronze8: "color(display-p3 0.426 0.374 0.347)",
  bronze9: "color(display-p3 0.611 0.507 0.455)",
  bronze10: "color(display-p3 0.66 0.556 0.504)",
  bronze11: "color(display-p3 0.81 0.707 0.655)",
  bronze12: "color(display-p3 0.921 0.88 0.854)"
}, Qw = {
  bronzeA1: "color(display-p3 0.941 0.067 0 / 0.009)",
  bronzeA2: "color(display-p3 0.98 0.8 0.706 / 0.043)",
  bronzeA3: "color(display-p3 0.988 0.851 0.761 / 0.085)",
  bronzeA4: "color(display-p3 0.996 0.839 0.78 / 0.127)",
  bronzeA5: "color(display-p3 0.996 0.863 0.773 / 0.173)",
  bronzeA6: "color(display-p3 1 0.863 0.796 / 0.227)",
  bronzeA7: "color(display-p3 1 0.867 0.8 / 0.295)",
  bronzeA8: "color(display-p3 1 0.859 0.788 / 0.387)",
  bronzeA9: "color(display-p3 1 0.82 0.733 / 0.585)",
  bronzeA10: "color(display-p3 1 0.839 0.761 / 0.635)",
  bronzeA11: "color(display-p3 0.81 0.707 0.655)",
  bronzeA12: "color(display-p3 0.921 0.88 0.854)"
}, Jw = {
  gold1: "#121211",
  gold2: "#1b1a17",
  gold3: "#24231f",
  gold4: "#2d2b26",
  gold5: "#38352e",
  gold6: "#444039",
  gold7: "#544f46",
  gold8: "#696256",
  gold9: "#978365",
  gold10: "#a39073",
  gold11: "#cbb99f",
  gold12: "#e8e2d9"
}, ex = {
  goldA1: "#91911102",
  goldA2: "#f9e29d0b",
  goldA3: "#f8ecbb15",
  goldA4: "#ffeec41e",
  goldA5: "#feecc22a",
  goldA6: "#feebcb37",
  goldA7: "#ffedcd48",
  goldA8: "#fdeaca5f",
  goldA9: "#ffdba690",
  goldA10: "#fedfb09d",
  goldA11: "#fee7c6c8",
  goldA12: "#fef7ede7"
}, tx = {
  gold1: "color(display-p3 0.071 0.071 0.067)",
  gold2: "color(display-p3 0.104 0.101 0.09)",
  gold3: "color(display-p3 0.141 0.136 0.122)",
  gold4: "color(display-p3 0.177 0.17 0.152)",
  gold5: "color(display-p3 0.217 0.207 0.185)",
  gold6: "color(display-p3 0.265 0.252 0.225)",
  gold7: "color(display-p3 0.327 0.31 0.277)",
  gold8: "color(display-p3 0.407 0.384 0.342)",
  gold9: "color(display-p3 0.579 0.517 0.41)",
  gold10: "color(display-p3 0.628 0.566 0.463)",
  gold11: "color(display-p3 0.784 0.728 0.635)",
  gold12: "color(display-p3 0.906 0.887 0.855)"
}, rx = {
  goldA1: "color(display-p3 0.855 0.855 0.071 / 0.005)",
  goldA2: "color(display-p3 0.98 0.89 0.616 / 0.043)",
  goldA3: "color(display-p3 1 0.949 0.753 / 0.08)",
  goldA4: "color(display-p3 1 0.933 0.8 / 0.118)",
  goldA5: "color(display-p3 1 0.949 0.804 / 0.16)",
  goldA6: "color(display-p3 1 0.925 0.8 / 0.215)",
  goldA7: "color(display-p3 1 0.945 0.831 / 0.278)",
  goldA8: "color(display-p3 1 0.937 0.82 / 0.366)",
  goldA9: "color(display-p3 0.996 0.882 0.69 / 0.551)",
  goldA10: "color(display-p3 1 0.894 0.725 / 0.601)",
  goldA11: "color(display-p3 0.784 0.728 0.635)",
  goldA12: "color(display-p3 0.906 0.887 0.855)"
}, nx = {
  sky1: "#0d141f",
  sky2: "#111a27",
  sky3: "#112840",
  sky4: "#113555",
  sky5: "#154467",
  sky6: "#1b537b",
  sky7: "#1f6692",
  sky8: "#197cae",
  sky9: "#7ce2fe",
  sky10: "#a8eeff",
  sky11: "#75c7f0",
  sky12: "#c2f3ff"
}, ox = {
  skyA1: "#0044ff0f",
  skyA2: "#1171fb18",
  skyA3: "#1184fc33",
  skyA4: "#128fff49",
  skyA5: "#1c9dfd5d",
  skyA6: "#28a5ff72",
  skyA7: "#2badfe8b",
  skyA8: "#1db2fea9",
  skyA9: "#7ce3fffe",
  skyA10: "#a8eeff",
  skyA11: "#7cd3ffef",
  skyA12: "#c2f3ff"
}, ax = {
  sky1: "color(display-p3 0.056 0.078 0.116)",
  sky2: "color(display-p3 0.075 0.101 0.149)",
  sky3: "color(display-p3 0.089 0.154 0.244)",
  sky4: "color(display-p3 0.106 0.207 0.323)",
  sky5: "color(display-p3 0.135 0.261 0.394)",
  sky6: "color(display-p3 0.17 0.322 0.469)",
  sky7: "color(display-p3 0.205 0.394 0.557)",
  sky8: "color(display-p3 0.232 0.48 0.665)",
  sky9: "color(display-p3 0.585 0.877 0.983)",
  sky10: "color(display-p3 0.718 0.925 0.991)",
  sky11: "color(display-p3 0.536 0.772 0.924)",
  sky12: "color(display-p3 0.799 0.947 0.993)"
}, ix = {
  skyA1: "color(display-p3 0 0.282 0.996 / 0.055)",
  skyA2: "color(display-p3 0.157 0.467 0.992 / 0.089)",
  skyA3: "color(display-p3 0.192 0.522 0.996 / 0.19)",
  skyA4: "color(display-p3 0.212 0.584 1 / 0.274)",
  skyA5: "color(display-p3 0.259 0.631 1 / 0.349)",
  skyA6: "color(display-p3 0.302 0.655 1 / 0.433)",
  skyA7: "color(display-p3 0.329 0.686 1 / 0.526)",
  skyA8: "color(display-p3 0.325 0.71 1 / 0.643)",
  skyA9: "color(display-p3 0.592 0.894 1 / 0.984)",
  skyA10: "color(display-p3 0.722 0.933 1 / 0.992)",
  skyA11: "color(display-p3 0.536 0.772 0.924)",
  skyA12: "color(display-p3 0.799 0.947 0.993)"
}, sx = {
  mint1: "#0e1515",
  mint2: "#0f1b1b",
  mint3: "#092c2b",
  mint4: "#003a38",
  mint5: "#004744",
  mint6: "#105650",
  mint7: "#1e685f",
  mint8: "#277f70",
  mint9: "#86ead4",
  mint10: "#a8f5e5",
  mint11: "#58d5ba",
  mint12: "#c4f5e1"
}, lx = {
  mintA1: "#00dede05",
  mintA2: "#00f9f90b",
  mintA3: "#00fff61d",
  mintA4: "#00fff42c",
  mintA5: "#00fff23a",
  mintA6: "#0effeb4a",
  mintA7: "#34fde55e",
  mintA8: "#41ffdf76",
  mintA9: "#92ffe7e9",
  mintA10: "#aefeedf5",
  mintA11: "#67ffded2",
  mintA12: "#cbfee9f5"
}, cx = {
  mint1: "color(display-p3 0.059 0.082 0.081)",
  mint2: "color(display-p3 0.068 0.104 0.105)",
  mint3: "color(display-p3 0.077 0.17 0.168)",
  mint4: "color(display-p3 0.068 0.224 0.22)",
  mint5: "color(display-p3 0.104 0.275 0.264)",
  mint6: "color(display-p3 0.154 0.332 0.313)",
  mint7: "color(display-p3 0.207 0.403 0.373)",
  mint8: "color(display-p3 0.258 0.49 0.441)",
  mint9: "color(display-p3 0.62 0.908 0.834)",
  mint10: "color(display-p3 0.725 0.954 0.898)",
  mint11: "color(display-p3 0.482 0.825 0.733)",
  mint12: "color(display-p3 0.807 0.955 0.887)"
}, ux = {
  mintA1: "color(display-p3 0 0.992 0.992 / 0.017)",
  mintA2: "color(display-p3 0.071 0.98 0.98 / 0.043)",
  mintA3: "color(display-p3 0.176 0.996 0.996 / 0.11)",
  mintA4: "color(display-p3 0.071 0.996 0.973 / 0.169)",
  mintA5: "color(display-p3 0.243 1 0.949 / 0.223)",
  mintA6: "color(display-p3 0.369 1 0.933 / 0.286)",
  mintA7: "color(display-p3 0.459 1 0.914 / 0.362)",
  mintA8: "color(display-p3 0.49 1 0.89 / 0.454)",
  mintA9: "color(display-p3 0.678 0.996 0.914 / 0.904)",
  mintA10: "color(display-p3 0.761 1 0.941 / 0.95)",
  mintA11: "color(display-p3 0.482 0.825 0.733)",
  mintA12: "color(display-p3 0.807 0.955 0.887)"
}, fx = {
  lime1: "#11130c",
  lime2: "#151a10",
  lime3: "#1f2917",
  lime4: "#29371d",
  lime5: "#334423",
  lime6: "#3d522a",
  lime7: "#496231",
  lime8: "#577538",
  lime9: "#bdee63",
  lime10: "#d4ff70",
  lime11: "#bde56c",
  lime12: "#e3f7ba"
}, dx = {
  limeA1: "#11bb0003",
  limeA2: "#78f7000a",
  limeA3: "#9bfd4c1a",
  limeA4: "#a7fe5c29",
  limeA5: "#affe6537",
  limeA6: "#b2fe6d46",
  limeA7: "#b6ff6f57",
  limeA8: "#b6fd6d6c",
  limeA9: "#caff69ed",
  limeA10: "#d4ff70",
  limeA11: "#d1fe77e4",
  limeA12: "#e9febff7"
}, px = {
  lime1: "color(display-p3 0.067 0.073 0.048)",
  lime2: "color(display-p3 0.086 0.1 0.067)",
  lime3: "color(display-p3 0.13 0.16 0.099)",
  lime4: "color(display-p3 0.172 0.214 0.126)",
  lime5: "color(display-p3 0.213 0.266 0.153)",
  lime6: "color(display-p3 0.257 0.321 0.182)",
  lime7: "color(display-p3 0.307 0.383 0.215)",
  lime8: "color(display-p3 0.365 0.456 0.25)",
  lime9: "color(display-p3 0.78 0.928 0.466)",
  lime10: "color(display-p3 0.865 0.995 0.519)",
  lime11: "color(display-p3 0.771 0.893 0.485)",
  lime12: "color(display-p3 0.905 0.966 0.753)"
}, hx = {
  limeA1: "color(display-p3 0.067 0.941 0 / 0.009)",
  limeA2: "color(display-p3 0.584 0.996 0.071 / 0.038)",
  limeA3: "color(display-p3 0.69 1 0.38 / 0.101)",
  limeA4: "color(display-p3 0.729 1 0.435 / 0.16)",
  limeA5: "color(display-p3 0.745 1 0.471 / 0.215)",
  limeA6: "color(display-p3 0.769 1 0.482 / 0.274)",
  limeA7: "color(display-p3 0.769 1 0.506 / 0.341)",
  limeA8: "color(display-p3 0.784 1 0.51 / 0.416)",
  limeA9: "color(display-p3 0.839 1 0.502 / 0.925)",
  limeA10: "color(display-p3 0.871 1 0.522 / 0.996)",
  limeA11: "color(display-p3 0.771 0.893 0.485)",
  limeA12: "color(display-p3 0.905 0.966 0.753)"
}, mx = {
  yellow1: "#14120b",
  yellow2: "#1b180f",
  yellow3: "#2d2305",
  yellow4: "#362b00",
  yellow5: "#433500",
  yellow6: "#524202",
  yellow7: "#665417",
  yellow8: "#836a21",
  yellow9: "#ffe629",
  yellow10: "#ffff57",
  yellow11: "#f5e147",
  yellow12: "#f6eeb4"
}, yx = {
  yellowA1: "#d1510004",
  yellowA2: "#f9b4000b",
  yellowA3: "#ffaa001e",
  yellowA4: "#fdb70028",
  yellowA5: "#febb0036",
  yellowA6: "#fec40046",
  yellowA7: "#fdcb225c",
  yellowA8: "#fdca327b",
  yellowA9: "#ffe629",
  yellowA10: "#ffff57",
  yellowA11: "#fee949f5",
  yellowA12: "#fef6baf6"
}, bx = {
  yellow1: "color(display-p3 0.078 0.069 0.047)",
  yellow2: "color(display-p3 0.103 0.094 0.063)",
  yellow3: "color(display-p3 0.168 0.137 0.039)",
  yellow4: "color(display-p3 0.209 0.169 0)",
  yellow5: "color(display-p3 0.255 0.209 0)",
  yellow6: "color(display-p3 0.31 0.261 0.07)",
  yellow7: "color(display-p3 0.389 0.331 0.135)",
  yellow8: "color(display-p3 0.497 0.42 0.182)",
  yellow9: "color(display-p3 1 0.92 0.22)",
  yellow10: "color(display-p3 1 1 0.456)",
  yellow11: "color(display-p3 0.948 0.885 0.392)",
  yellow12: "color(display-p3 0.959 0.934 0.731)"
}, gx = {
  yellowA1: "color(display-p3 0.973 0.369 0 / 0.013)",
  yellowA2: "color(display-p3 0.996 0.792 0 / 0.038)",
  yellowA3: "color(display-p3 0.996 0.71 0 / 0.11)",
  yellowA4: "color(display-p3 0.996 0.741 0 / 0.152)",
  yellowA5: "color(display-p3 0.996 0.765 0 / 0.202)",
  yellowA6: "color(display-p3 0.996 0.816 0.082 / 0.261)",
  yellowA7: "color(display-p3 1 0.831 0.263 / 0.345)",
  yellowA8: "color(display-p3 1 0.831 0.314 / 0.463)",
  yellowA9: "color(display-p3 1 0.922 0.22)",
  yellowA10: "color(display-p3 1 1 0.455)",
  yellowA11: "color(display-p3 0.948 0.885 0.392)",
  yellowA12: "color(display-p3 0.959 0.934 0.731)"
}, Ax = {
  amber1: "#16120c",
  amber2: "#1d180f",
  amber3: "#302008",
  amber4: "#3f2700",
  amber5: "#4d3000",
  amber6: "#5c3d05",
  amber7: "#714f19",
  amber8: "#8f6424",
  amber9: "#ffc53d",
  amber10: "#ffd60a",
  amber11: "#ffca16",
  amber12: "#ffe7b3"
}, vx = {
  amberA1: "#e63c0006",
  amberA2: "#fd9b000d",
  amberA3: "#fa820022",
  amberA4: "#fc820032",
  amberA5: "#fd8b0041",
  amberA6: "#fd9b0051",
  amberA7: "#ffab2567",
  amberA8: "#ffae3587",
  amberA9: "#ffc53d",
  amberA10: "#ffd60a",
  amberA11: "#ffca16",
  amberA12: "#ffe7b3"
}, wx = {
  amber1: "color(display-p3 0.082 0.07 0.05)",
  amber2: "color(display-p3 0.111 0.094 0.064)",
  amber3: "color(display-p3 0.178 0.128 0.049)",
  amber4: "color(display-p3 0.239 0.156 0)",
  amber5: "color(display-p3 0.29 0.193 0)",
  amber6: "color(display-p3 0.344 0.245 0.076)",
  amber7: "color(display-p3 0.422 0.314 0.141)",
  amber8: "color(display-p3 0.535 0.399 0.189)",
  amber9: "color(display-p3 1 0.77 0.26)",
  amber10: "color(display-p3 1 0.87 0.15)",
  amber11: "color(display-p3 1 0.8 0.29)",
  amber12: "color(display-p3 0.984 0.909 0.726)"
}, xx = {
  amberA1: "color(display-p3 0.992 0.298 0 / 0.017)",
  amberA2: "color(display-p3 0.988 0.651 0 / 0.047)",
  amberA3: "color(display-p3 1 0.6 0 / 0.118)",
  amberA4: "color(display-p3 1 0.557 0 / 0.185)",
  amberA5: "color(display-p3 1 0.592 0 / 0.24)",
  amberA6: "color(display-p3 1 0.659 0.094 / 0.299)",
  amberA7: "color(display-p3 1 0.714 0.263 / 0.383)",
  amberA8: "color(display-p3 0.996 0.729 0.306 / 0.5)",
  amberA9: "color(display-p3 1 0.769 0.259)",
  amberA10: "color(display-p3 1 0.871 0.149)",
  amberA11: "color(display-p3 1 0.8 0.29)",
  amberA12: "color(display-p3 0.984 0.909 0.726)"
}, _x = {
  orange1: "#17120e",
  orange2: "#1e160f",
  orange3: "#331e0b",
  orange4: "#462100",
  orange5: "#562800",
  orange6: "#66350c",
  orange7: "#7e451d",
  orange8: "#a35829",
  orange9: "#f76b15",
  orange10: "#ff801f",
  orange11: "#ffa057",
  orange12: "#ffe0c2"
}, Ex = {
  orangeA1: "#ec360007",
  orangeA2: "#fe6d000e",
  orangeA3: "#fb6a0025",
  orangeA4: "#ff590039",
  orangeA5: "#ff61004a",
  orangeA6: "#fd75045c",
  orangeA7: "#ff832c75",
  orangeA8: "#fe84389d",
  orangeA9: "#fe6d15f7",
  orangeA10: "#ff801f",
  orangeA11: "#ffa057",
  orangeA12: "#ffe0c2"
}, Sx = {
  orange1: "color(display-p3 0.088 0.07 0.057)",
  orange2: "color(display-p3 0.113 0.089 0.061)",
  orange3: "color(display-p3 0.189 0.12 0.056)",
  orange4: "color(display-p3 0.262 0.132 0)",
  orange5: "color(display-p3 0.315 0.168 0.016)",
  orange6: "color(display-p3 0.376 0.219 0.088)",
  orange7: "color(display-p3 0.465 0.283 0.147)",
  orange8: "color(display-p3 0.601 0.359 0.201)",
  orange9: "color(display-p3 0.9 0.45 0.2)",
  orange10: "color(display-p3 0.98 0.51 0.23)",
  orange11: "color(display-p3 1 0.63 0.38)",
  orange12: "color(display-p3 0.98 0.883 0.775)"
}, kx = {
  orangeA1: "color(display-p3 0.961 0.247 0 / 0.022)",
  orangeA2: "color(display-p3 0.992 0.529 0 / 0.051)",
  orangeA3: "color(display-p3 0.996 0.486 0 / 0.131)",
  orangeA4: "color(display-p3 0.996 0.384 0 / 0.211)",
  orangeA5: "color(display-p3 1 0.455 0 / 0.265)",
  orangeA6: "color(display-p3 1 0.529 0.129 / 0.332)",
  orangeA7: "color(display-p3 1 0.569 0.251 / 0.429)",
  orangeA8: "color(display-p3 1 0.584 0.302 / 0.572)",
  orangeA9: "color(display-p3 1 0.494 0.216 / 0.895)",
  orangeA10: "color(display-p3 1 0.522 0.235 / 0.979)",
  orangeA11: "color(display-p3 1 0.63 0.38)",
  orangeA12: "color(display-p3 0.98 0.883 0.775)"
}, Tx = {
  gray1: "#fcfcfc",
  gray2: "#f9f9f9",
  gray3: "#f0f0f0",
  gray4: "#e8e8e8",
  gray5: "#e0e0e0",
  gray6: "#d9d9d9",
  gray7: "#cecece",
  gray8: "#bbbbbb",
  gray9: "#8d8d8d",
  gray10: "#838383",
  gray11: "#646464",
  gray12: "#202020"
}, Dx = {
  grayA1: "#00000003",
  grayA2: "#00000006",
  grayA3: "#0000000f",
  grayA4: "#00000017",
  grayA5: "#0000001f",
  grayA6: "#00000026",
  grayA7: "#00000031",
  grayA8: "#00000044",
  grayA9: "#00000072",
  grayA10: "#0000007c",
  grayA11: "#0000009b",
  grayA12: "#000000df"
}, Mx = {
  gray1: "color(display-p3 0.988 0.988 0.988)",
  gray2: "color(display-p3 0.975 0.975 0.975)",
  gray3: "color(display-p3 0.939 0.939 0.939)",
  gray4: "color(display-p3 0.908 0.908 0.908)",
  gray5: "color(display-p3 0.88 0.88 0.88)",
  gray6: "color(display-p3 0.849 0.849 0.849)",
  gray7: "color(display-p3 0.807 0.807 0.807)",
  gray8: "color(display-p3 0.732 0.732 0.732)",
  gray9: "color(display-p3 0.553 0.553 0.553)",
  gray10: "color(display-p3 0.512 0.512 0.512)",
  gray11: "color(display-p3 0.392 0.392 0.392)",
  gray12: "color(display-p3 0.125 0.125 0.125)"
}, Cx = {
  grayA1: "color(display-p3 0 0 0 / 0.012)",
  grayA2: "color(display-p3 0 0 0 / 0.024)",
  grayA3: "color(display-p3 0 0 0 / 0.063)",
  grayA4: "color(display-p3 0 0 0 / 0.09)",
  grayA5: "color(display-p3 0 0 0 / 0.122)",
  grayA6: "color(display-p3 0 0 0 / 0.153)",
  grayA7: "color(display-p3 0 0 0 / 0.192)",
  grayA8: "color(display-p3 0 0 0 / 0.267)",
  grayA9: "color(display-p3 0 0 0 / 0.447)",
  grayA10: "color(display-p3 0 0 0 / 0.486)",
  grayA11: "color(display-p3 0 0 0 / 0.608)",
  grayA12: "color(display-p3 0 0 0 / 0.875)"
}, Lx = {
  mauve1: "#fdfcfd",
  mauve2: "#faf9fb",
  mauve3: "#f2eff3",
  mauve4: "#eae7ec",
  mauve5: "#e3dfe6",
  mauve6: "#dbd8e0",
  mauve7: "#d0cdd7",
  mauve8: "#bcbac7",
  mauve9: "#8e8c99",
  mauve10: "#84828e",
  mauve11: "#65636d",
  mauve12: "#211f26"
}, Fx = {
  mauveA1: "#55005503",
  mauveA2: "#2b005506",
  mauveA3: "#30004010",
  mauveA4: "#20003618",
  mauveA5: "#20003820",
  mauveA6: "#14003527",
  mauveA7: "#10003332",
  mauveA8: "#08003145",
  mauveA9: "#05001d73",
  mauveA10: "#0500197d",
  mauveA11: "#0400119c",
  mauveA12: "#020008e0"
}, Rx = {
  mauve1: "color(display-p3 0.991 0.988 0.992)",
  mauve2: "color(display-p3 0.98 0.976 0.984)",
  mauve3: "color(display-p3 0.946 0.938 0.952)",
  mauve4: "color(display-p3 0.915 0.906 0.925)",
  mauve5: "color(display-p3 0.886 0.876 0.901)",
  mauve6: "color(display-p3 0.856 0.846 0.875)",
  mauve7: "color(display-p3 0.814 0.804 0.84)",
  mauve8: "color(display-p3 0.735 0.728 0.777)",
  mauve9: "color(display-p3 0.555 0.549 0.596)",
  mauve10: "color(display-p3 0.514 0.508 0.552)",
  mauve11: "color(display-p3 0.395 0.388 0.424)",
  mauve12: "color(display-p3 0.128 0.122 0.147)"
}, Ox = {
  mauveA1: "color(display-p3 0.349 0.024 0.349 / 0.012)",
  mauveA2: "color(display-p3 0.184 0.024 0.349 / 0.024)",
  mauveA3: "color(display-p3 0.129 0.008 0.255 / 0.063)",
  mauveA4: "color(display-p3 0.094 0.012 0.216 / 0.095)",
  mauveA5: "color(display-p3 0.098 0.008 0.224 / 0.126)",
  mauveA6: "color(display-p3 0.055 0.004 0.18 / 0.153)",
  mauveA7: "color(display-p3 0.067 0.008 0.184 / 0.197)",
  mauveA8: "color(display-p3 0.02 0.004 0.176 / 0.271)",
  mauveA9: "color(display-p3 0.02 0.004 0.106 / 0.451)",
  mauveA10: "color(display-p3 0.012 0.004 0.09 / 0.491)",
  mauveA11: "color(display-p3 0.016 0 0.059 / 0.612)",
  mauveA12: "color(display-p3 0.008 0 0.027 / 0.879)"
}, Px = {
  slate1: "#fcfcfd",
  slate2: "#f9f9fb",
  slate3: "#f0f0f3",
  slate4: "#e8e8ec",
  slate5: "#e0e1e6",
  slate6: "#d9d9e0",
  slate7: "#cdced6",
  slate8: "#b9bbc6",
  slate9: "#8b8d98",
  slate10: "#80838d",
  slate11: "#60646c",
  slate12: "#1c2024"
}, Ix = {
  slateA1: "#00005503",
  slateA2: "#00005506",
  slateA3: "#0000330f",
  slateA4: "#00002d17",
  slateA5: "#0009321f",
  slateA6: "#00002f26",
  slateA7: "#00062e32",
  slateA8: "#00083046",
  slateA9: "#00051d74",
  slateA10: "#00071b7f",
  slateA11: "#0007149f",
  slateA12: "#000509e3"
}, Bx = {
  slate1: "color(display-p3 0.988 0.988 0.992)",
  slate2: "color(display-p3 0.976 0.976 0.984)",
  slate3: "color(display-p3 0.94 0.941 0.953)",
  slate4: "color(display-p3 0.908 0.909 0.925)",
  slate5: "color(display-p3 0.88 0.881 0.901)",
  slate6: "color(display-p3 0.85 0.852 0.876)",
  slate7: "color(display-p3 0.805 0.808 0.838)",
  slate8: "color(display-p3 0.727 0.733 0.773)",
  slate9: "color(display-p3 0.547 0.553 0.592)",
  slate10: "color(display-p3 0.503 0.512 0.549)",
  slate11: "color(display-p3 0.379 0.392 0.421)",
  slate12: "color(display-p3 0.113 0.125 0.14)"
}, Nx = {
  slateA1: "color(display-p3 0.024 0.024 0.349 / 0.012)",
  slateA2: "color(display-p3 0.024 0.024 0.349 / 0.024)",
  slateA3: "color(display-p3 0.004 0.004 0.204 / 0.059)",
  slateA4: "color(display-p3 0.012 0.012 0.184 / 0.091)",
  slateA5: "color(display-p3 0.004 0.039 0.2 / 0.122)",
  slateA6: "color(display-p3 0.008 0.008 0.165 / 0.15)",
  slateA7: "color(display-p3 0.008 0.027 0.184 / 0.197)",
  slateA8: "color(display-p3 0.004 0.031 0.176 / 0.275)",
  slateA9: "color(display-p3 0.004 0.02 0.106 / 0.455)",
  slateA10: "color(display-p3 0.004 0.027 0.098 / 0.499)",
  slateA11: "color(display-p3 0 0.02 0.063 / 0.62)",
  slateA12: "color(display-p3 0 0.012 0.031 / 0.887)"
}, Gx = {
  sage1: "#fbfdfc",
  sage2: "#f7f9f8",
  sage3: "#eef1f0",
  sage4: "#e6e9e8",
  sage5: "#dfe2e0",
  sage6: "#d7dad9",
  sage7: "#cbcfcd",
  sage8: "#b8bcba",
  sage9: "#868e8b",
  sage10: "#7c8481",
  sage11: "#5f6563",
  sage12: "#1a211e"
}, qx = {
  sageA1: "#00804004",
  sageA2: "#00402008",
  sageA3: "#002d1e11",
  sageA4: "#001f1519",
  sageA5: "#00180820",
  sageA6: "#00140d28",
  sageA7: "#00140a34",
  sageA8: "#000f0847",
  sageA9: "#00110b79",
  sageA10: "#00100a83",
  sageA11: "#000a07a0",
  sageA12: "#000805e5"
}, $x = {
  sage1: "color(display-p3 0.986 0.992 0.988)",
  sage2: "color(display-p3 0.97 0.977 0.974)",
  sage3: "color(display-p3 0.935 0.944 0.94)",
  sage4: "color(display-p3 0.904 0.913 0.909)",
  sage5: "color(display-p3 0.875 0.885 0.88)",
  sage6: "color(display-p3 0.844 0.854 0.849)",
  sage7: "color(display-p3 0.8 0.811 0.806)",
  sage8: "color(display-p3 0.725 0.738 0.732)",
  sage9: "color(display-p3 0.531 0.556 0.546)",
  sage10: "color(display-p3 0.492 0.515 0.506)",
  sage11: "color(display-p3 0.377 0.395 0.389)",
  sage12: "color(display-p3 0.107 0.129 0.118)"
}, zx = {
  sageA1: "color(display-p3 0.024 0.514 0.267 / 0.016)",
  sageA2: "color(display-p3 0.02 0.267 0.145 / 0.032)",
  sageA3: "color(display-p3 0.008 0.184 0.125 / 0.067)",
  sageA4: "color(display-p3 0.012 0.094 0.051 / 0.095)",
  sageA5: "color(display-p3 0.008 0.098 0.035 / 0.126)",
  sageA6: "color(display-p3 0.004 0.078 0.027 / 0.157)",
  sageA7: "color(display-p3 0 0.059 0.039 / 0.2)",
  sageA8: "color(display-p3 0.004 0.047 0.031 / 0.275)",
  sageA9: "color(display-p3 0.004 0.059 0.035 / 0.471)",
  sageA10: "color(display-p3 0 0.047 0.031 / 0.51)",
  sageA11: "color(display-p3 0 0.031 0.02 / 0.624)",
  sageA12: "color(display-p3 0 0.027 0.012 / 0.895)"
}, jx = {
  olive1: "#fcfdfc",
  olive2: "#f8faf8",
  olive3: "#eff1ef",
  olive4: "#e7e9e7",
  olive5: "#dfe2df",
  olive6: "#d7dad7",
  olive7: "#cccfcc",
  olive8: "#b9bcb8",
  olive9: "#898e87",
  olive10: "#7f847d",
  olive11: "#60655f",
  olive12: "#1d211c"
}, Hx = {
  oliveA1: "#00550003",
  oliveA2: "#00490007",
  oliveA3: "#00200010",
  oliveA4: "#00160018",
  oliveA5: "#00180020",
  oliveA6: "#00140028",
  oliveA7: "#000f0033",
  oliveA8: "#040f0047",
  oliveA9: "#050f0078",
  oliveA10: "#040e0082",
  oliveA11: "#020a00a0",
  oliveA12: "#010600e3"
}, Ux = {
  olive1: "color(display-p3 0.989 0.992 0.989)",
  olive2: "color(display-p3 0.974 0.98 0.973)",
  olive3: "color(display-p3 0.939 0.945 0.937)",
  olive4: "color(display-p3 0.907 0.914 0.905)",
  olive5: "color(display-p3 0.878 0.885 0.875)",
  olive6: "color(display-p3 0.846 0.855 0.843)",
  olive7: "color(display-p3 0.803 0.812 0.8)",
  olive8: "color(display-p3 0.727 0.738 0.723)",
  olive9: "color(display-p3 0.541 0.556 0.532)",
  olive10: "color(display-p3 0.5 0.515 0.491)",
  olive11: "color(display-p3 0.38 0.395 0.374)",
  olive12: "color(display-p3 0.117 0.129 0.111)"
}, Vx = {
  oliveA1: "color(display-p3 0.024 0.349 0.024 / 0.012)",
  oliveA2: "color(display-p3 0.024 0.302 0.024 / 0.028)",
  oliveA3: "color(display-p3 0.008 0.129 0.008 / 0.063)",
  oliveA4: "color(display-p3 0.012 0.094 0.012 / 0.095)",
  oliveA5: "color(display-p3 0.035 0.098 0.008 / 0.126)",
  oliveA6: "color(display-p3 0.027 0.078 0.004 / 0.157)",
  oliveA7: "color(display-p3 0.02 0.059 0 / 0.2)",
  oliveA8: "color(display-p3 0.02 0.059 0.004 / 0.279)",
  oliveA9: "color(display-p3 0.02 0.051 0.004 / 0.467)",
  oliveA10: "color(display-p3 0.024 0.047 0 / 0.51)",
  oliveA11: "color(display-p3 0.012 0.039 0 / 0.628)",
  oliveA12: "color(display-p3 0.008 0.024 0 / 0.891)"
}, Wx = {
  sand1: "#fdfdfc",
  sand2: "#f9f9f8",
  sand3: "#f1f0ef",
  sand4: "#e9e8e6",
  sand5: "#e2e1de",
  sand6: "#dad9d6",
  sand7: "#cfceca",
  sand8: "#bcbbb5",
  sand9: "#8d8d86",
  sand10: "#82827c",
  sand11: "#63635e",
  sand12: "#21201c"
}, Xx = {
  sandA1: "#55550003",
  sandA2: "#25250007",
  sandA3: "#20100010",
  sandA4: "#1f150019",
  sandA5: "#1f180021",
  sandA6: "#19130029",
  sandA7: "#19140035",
  sandA8: "#1915014a",
  sandA9: "#0f0f0079",
  sandA10: "#0c0c0083",
  sandA11: "#080800a1",
  sandA12: "#060500e3"
}, Yx = {
  sand1: "color(display-p3 0.992 0.992 0.989)",
  sand2: "color(display-p3 0.977 0.977 0.973)",
  sand3: "color(display-p3 0.943 0.942 0.936)",
  sand4: "color(display-p3 0.913 0.912 0.903)",
  sand5: "color(display-p3 0.885 0.883 0.873)",
  sand6: "color(display-p3 0.854 0.852 0.839)",
  sand7: "color(display-p3 0.813 0.81 0.794)",
  sand8: "color(display-p3 0.738 0.734 0.713)",
  sand9: "color(display-p3 0.553 0.553 0.528)",
  sand10: "color(display-p3 0.511 0.511 0.488)",
  sand11: "color(display-p3 0.388 0.388 0.37)",
  sand12: "color(display-p3 0.129 0.126 0.111)"
}, Kx = {
  sandA1: "color(display-p3 0.349 0.349 0.024 / 0.012)",
  sandA2: "color(display-p3 0.161 0.161 0.024 / 0.028)",
  sandA3: "color(display-p3 0.067 0.067 0.008 / 0.063)",
  sandA4: "color(display-p3 0.129 0.129 0.012 / 0.099)",
  sandA5: "color(display-p3 0.098 0.067 0.008 / 0.126)",
  sandA6: "color(display-p3 0.102 0.075 0.004 / 0.161)",
  sandA7: "color(display-p3 0.098 0.098 0.004 / 0.208)",
  sandA8: "color(display-p3 0.086 0.075 0.004 / 0.287)",
  sandA9: "color(display-p3 0.051 0.051 0.004 / 0.471)",
  sandA10: "color(display-p3 0.047 0.047 0 / 0.514)",
  sandA11: "color(display-p3 0.031 0.031 0 / 0.632)",
  sandA12: "color(display-p3 0.024 0.02 0 / 0.891)"
}, Zx = {
  tomato1: "#fffcfc",
  tomato2: "#fff8f7",
  tomato3: "#feebe7",
  tomato4: "#ffdcd3",
  tomato5: "#ffcdc2",
  tomato6: "#fdbdaf",
  tomato7: "#f5a898",
  tomato8: "#ec8e7b",
  tomato9: "#e54d2e",
  tomato10: "#dd4425",
  tomato11: "#d13415",
  tomato12: "#5c271f"
}, Qx = {
  tomatoA1: "#ff000003",
  tomatoA2: "#ff200008",
  tomatoA3: "#f52b0018",
  tomatoA4: "#ff35002c",
  tomatoA5: "#ff2e003d",
  tomatoA6: "#f92d0050",
  tomatoA7: "#e7280067",
  tomatoA8: "#db250084",
  tomatoA9: "#df2600d1",
  tomatoA10: "#d72400da",
  tomatoA11: "#cd2200ea",
  tomatoA12: "#460900e0"
}, Jx = {
  tomato1: "color(display-p3 0.998 0.989 0.988)",
  tomato2: "color(display-p3 0.994 0.974 0.969)",
  tomato3: "color(display-p3 0.985 0.924 0.909)",
  tomato4: "color(display-p3 0.996 0.868 0.835)",
  tomato5: "color(display-p3 0.98 0.812 0.77)",
  tomato6: "color(display-p3 0.953 0.75 0.698)",
  tomato7: "color(display-p3 0.917 0.673 0.611)",
  tomato8: "color(display-p3 0.875 0.575 0.502)",
  tomato9: "color(display-p3 0.831 0.345 0.231)",
  tomato10: "color(display-p3 0.802 0.313 0.2)",
  tomato11: "color(display-p3 0.755 0.259 0.152)",
  tomato12: "color(display-p3 0.335 0.165 0.132)"
}, e_ = {
  tomatoA1: "color(display-p3 0.675 0.024 0.024 / 0.012)",
  tomatoA2: "color(display-p3 0.757 0.145 0.02 / 0.032)",
  tomatoA3: "color(display-p3 0.831 0.184 0.012 / 0.091)",
  tomatoA4: "color(display-p3 0.976 0.192 0.004 / 0.165)",
  tomatoA5: "color(display-p3 0.918 0.192 0.004 / 0.232)",
  tomatoA6: "color(display-p3 0.847 0.173 0.004 / 0.302)",
  tomatoA7: "color(display-p3 0.788 0.165 0.004 / 0.389)",
  tomatoA8: "color(display-p3 0.749 0.153 0.004 / 0.499)",
  tomatoA9: "color(display-p3 0.78 0.149 0 / 0.769)",
  tomatoA10: "color(display-p3 0.757 0.141 0 / 0.8)",
  tomatoA11: "color(display-p3 0.755 0.259 0.152)",
  tomatoA12: "color(display-p3 0.335 0.165 0.132)"
}, t_ = {
  red1: "#fffcfc",
  red2: "#fff7f7",
  red3: "#feebec",
  red4: "#ffdbdc",
  red5: "#ffcdce",
  red6: "#fdbdbe",
  red7: "#f4a9aa",
  red8: "#eb8e90",
  red9: "#e5484d",
  red10: "#dc3e42",
  red11: "#ce2c31",
  red12: "#641723"
}, r_ = {
  redA1: "#ff000003",
  redA2: "#ff000008",
  redA3: "#f3000d14",
  redA4: "#ff000824",
  redA5: "#ff000632",
  redA6: "#f8000442",
  redA7: "#df000356",
  redA8: "#d2000571",
  redA9: "#db0007b7",
  redA10: "#d10005c1",
  redA11: "#c40006d3",
  redA12: "#55000de8"
}, n_ = {
  red1: "color(display-p3 0.998 0.989 0.988)",
  red2: "color(display-p3 0.995 0.971 0.971)",
  red3: "color(display-p3 0.985 0.925 0.925)",
  red4: "color(display-p3 0.999 0.866 0.866)",
  red5: "color(display-p3 0.984 0.812 0.811)",
  red6: "color(display-p3 0.955 0.751 0.749)",
  red7: "color(display-p3 0.915 0.675 0.672)",
  red8: "color(display-p3 0.872 0.575 0.572)",
  red9: "color(display-p3 0.83 0.329 0.324)",
  red10: "color(display-p3 0.798 0.294 0.285)",
  red11: "color(display-p3 0.744 0.234 0.222)",
  red12: "color(display-p3 0.36 0.115 0.143)"
}, o_ = {
  redA1: "color(display-p3 0.675 0.024 0.024 / 0.012)",
  redA2: "color(display-p3 0.863 0.024 0.024 / 0.028)",
  redA3: "color(display-p3 0.792 0.008 0.008 / 0.075)",
  redA4: "color(display-p3 1 0.008 0.008 / 0.134)",
  redA5: "color(display-p3 0.918 0.008 0.008 / 0.189)",
  redA6: "color(display-p3 0.831 0.02 0.004 / 0.251)",
  redA7: "color(display-p3 0.741 0.016 0.004 / 0.33)",
  redA8: "color(display-p3 0.698 0.012 0.004 / 0.428)",
  redA9: "color(display-p3 0.749 0.008 0 / 0.675)",
  redA10: "color(display-p3 0.714 0.012 0 / 0.714)",
  redA11: "color(display-p3 0.744 0.234 0.222)",
  redA12: "color(display-p3 0.36 0.115 0.143)"
}, a_ = {
  ruby1: "#fffcfd",
  ruby2: "#fff7f8",
  ruby3: "#feeaed",
  ruby4: "#ffdce1",
  ruby5: "#ffced6",
  ruby6: "#f8bfc8",
  ruby7: "#efacb8",
  ruby8: "#e592a3",
  ruby9: "#e54666",
  ruby10: "#dc3b5d",
  ruby11: "#ca244d",
  ruby12: "#64172b"
}, i_ = {
  rubyA1: "#ff005503",
  rubyA2: "#ff002008",
  rubyA3: "#f3002515",
  rubyA4: "#ff002523",
  rubyA5: "#ff002a31",
  rubyA6: "#e4002440",
  rubyA7: "#ce002553",
  rubyA8: "#c300286d",
  rubyA9: "#db002cb9",
  rubyA10: "#d2002cc4",
  rubyA11: "#c10030db",
  rubyA12: "#550016e8"
}, s_ = {
  ruby1: "color(display-p3 0.998 0.989 0.992)",
  ruby2: "color(display-p3 0.995 0.971 0.974)",
  ruby3: "color(display-p3 0.983 0.92 0.928)",
  ruby4: "color(display-p3 0.987 0.869 0.885)",
  ruby5: "color(display-p3 0.968 0.817 0.839)",
  ruby6: "color(display-p3 0.937 0.758 0.786)",
  ruby7: "color(display-p3 0.897 0.685 0.721)",
  ruby8: "color(display-p3 0.851 0.588 0.639)",
  ruby9: "color(display-p3 0.83 0.323 0.408)",
  ruby10: "color(display-p3 0.795 0.286 0.375)",
  ruby11: "color(display-p3 0.728 0.211 0.311)",
  ruby12: "color(display-p3 0.36 0.115 0.171)"
}, l_ = {
  rubyA1: "color(display-p3 0.675 0.024 0.349 / 0.012)",
  rubyA2: "color(display-p3 0.863 0.024 0.024 / 0.028)",
  rubyA3: "color(display-p3 0.804 0.008 0.11 / 0.079)",
  rubyA4: "color(display-p3 0.91 0.008 0.125 / 0.13)",
  rubyA5: "color(display-p3 0.831 0.004 0.133 / 0.185)",
  rubyA6: "color(display-p3 0.745 0.004 0.118 / 0.244)",
  rubyA7: "color(display-p3 0.678 0.004 0.114 / 0.314)",
  rubyA8: "color(display-p3 0.639 0.004 0.125 / 0.412)",
  rubyA9: "color(display-p3 0.753 0 0.129 / 0.679)",
  rubyA10: "color(display-p3 0.714 0 0.125 / 0.714)",
  rubyA11: "color(display-p3 0.728 0.211 0.311)",
  rubyA12: "color(display-p3 0.36 0.115 0.171)"
}, c_ = {
  crimson1: "#fffcfd",
  crimson2: "#fef7f9",
  crimson3: "#ffe9f0",
  crimson4: "#fedce7",
  crimson5: "#facedd",
  crimson6: "#f3bed1",
  crimson7: "#eaacc3",
  crimson8: "#e093b2",
  crimson9: "#e93d82",
  crimson10: "#df3478",
  crimson11: "#cb1d63",
  crimson12: "#621639"
}, u_ = {
  crimsonA1: "#ff005503",
  crimsonA2: "#e0004008",
  crimsonA3: "#ff005216",
  crimsonA4: "#f8005123",
  crimsonA5: "#e5004f31",
  crimsonA6: "#d0004b41",
  crimsonA7: "#bf004753",
  crimsonA8: "#b6004a6c",
  crimsonA9: "#e2005bc2",
  crimsonA10: "#d70056cb",
  crimsonA11: "#c4004fe2",
  crimsonA12: "#530026e9"
}, f_ = {
  crimson1: "color(display-p3 0.998 0.989 0.992)",
  crimson2: "color(display-p3 0.991 0.969 0.976)",
  crimson3: "color(display-p3 0.987 0.917 0.941)",
  crimson4: "color(display-p3 0.975 0.866 0.904)",
  crimson5: "color(display-p3 0.953 0.813 0.864)",
  crimson6: "color(display-p3 0.921 0.755 0.817)",
  crimson7: "color(display-p3 0.88 0.683 0.761)",
  crimson8: "color(display-p3 0.834 0.592 0.694)",
  crimson9: "color(display-p3 0.843 0.298 0.507)",
  crimson10: "color(display-p3 0.807 0.266 0.468)",
  crimson11: "color(display-p3 0.731 0.195 0.388)",
  crimson12: "color(display-p3 0.352 0.111 0.221)"
}, d_ = {
  crimsonA1: "color(display-p3 0.675 0.024 0.349 / 0.012)",
  crimsonA2: "color(display-p3 0.757 0.02 0.267 / 0.032)",
  crimsonA3: "color(display-p3 0.859 0.008 0.294 / 0.083)",
  crimsonA4: "color(display-p3 0.827 0.008 0.298 / 0.134)",
  crimsonA5: "color(display-p3 0.753 0.008 0.275 / 0.189)",
  crimsonA6: "color(display-p3 0.682 0.004 0.247 / 0.244)",
  crimsonA7: "color(display-p3 0.62 0.004 0.251 / 0.318)",
  crimsonA8: "color(display-p3 0.6 0.004 0.251 / 0.408)",
  crimsonA9: "color(display-p3 0.776 0 0.298 / 0.702)",
  crimsonA10: "color(display-p3 0.737 0 0.275 / 0.734)",
  crimsonA11: "color(display-p3 0.731 0.195 0.388)",
  crimsonA12: "color(display-p3 0.352 0.111 0.221)"
}, p_ = {
  pink1: "#fffcfe",
  pink2: "#fef7fb",
  pink3: "#fee9f5",
  pink4: "#fbdcef",
  pink5: "#f6cee7",
  pink6: "#efbfdd",
  pink7: "#e7acd0",
  pink8: "#dd93c2",
  pink9: "#d6409f",
  pink10: "#cf3897",
  pink11: "#c2298a",
  pink12: "#651249"
}, h_ = {
  pinkA1: "#ff00aa03",
  pinkA2: "#e0008008",
  pinkA3: "#f4008c16",
  pinkA4: "#e2008b23",
  pinkA5: "#d1008331",
  pinkA6: "#c0007840",
  pinkA7: "#b6006f53",
  pinkA8: "#af006f6c",
  pinkA9: "#c8007fbf",
  pinkA10: "#c2007ac7",
  pinkA11: "#b60074d6",
  pinkA12: "#59003bed"
}, m_ = {
  pink1: "color(display-p3 0.998 0.989 0.996)",
  pink2: "color(display-p3 0.992 0.97 0.985)",
  pink3: "color(display-p3 0.981 0.917 0.96)",
  pink4: "color(display-p3 0.963 0.867 0.932)",
  pink5: "color(display-p3 0.939 0.815 0.899)",
  pink6: "color(display-p3 0.907 0.756 0.859)",
  pink7: "color(display-p3 0.869 0.683 0.81)",
  pink8: "color(display-p3 0.825 0.59 0.751)",
  pink9: "color(display-p3 0.775 0.297 0.61)",
  pink10: "color(display-p3 0.748 0.27 0.581)",
  pink11: "color(display-p3 0.698 0.219 0.528)",
  pink12: "color(display-p3 0.363 0.101 0.279)"
}, y_ = {
  pinkA1: "color(display-p3 0.675 0.024 0.675 / 0.012)",
  pinkA2: "color(display-p3 0.757 0.02 0.51 / 0.032)",
  pinkA3: "color(display-p3 0.765 0.008 0.529 / 0.083)",
  pinkA4: "color(display-p3 0.737 0.008 0.506 / 0.134)",
  pinkA5: "color(display-p3 0.663 0.004 0.451 / 0.185)",
  pinkA6: "color(display-p3 0.616 0.004 0.424 / 0.244)",
  pinkA7: "color(display-p3 0.596 0.004 0.412 / 0.318)",
  pinkA8: "color(display-p3 0.573 0.004 0.404 / 0.412)",
  pinkA9: "color(display-p3 0.682 0 0.447 / 0.702)",
  pinkA10: "color(display-p3 0.655 0 0.424 / 0.73)",
  pinkA11: "color(display-p3 0.698 0.219 0.528)",
  pinkA12: "color(display-p3 0.363 0.101 0.279)"
}, b_ = {
  plum1: "#fefcff",
  plum2: "#fdf7fd",
  plum3: "#fbebfb",
  plum4: "#f7def8",
  plum5: "#f2d1f3",
  plum6: "#e9c2ec",
  plum7: "#deade3",
  plum8: "#cf91d8",
  plum9: "#ab4aba",
  plum10: "#a144af",
  plum11: "#953ea3",
  plum12: "#53195d"
}, g_ = {
  plumA1: "#aa00ff03",
  plumA2: "#c000c008",
  plumA3: "#cc00cc14",
  plumA4: "#c200c921",
  plumA5: "#b700bd2e",
  plumA6: "#a400b03d",
  plumA7: "#9900a852",
  plumA8: "#9000a56e",
  plumA9: "#89009eb5",
  plumA10: "#7f0092bb",
  plumA11: "#730086c1",
  plumA12: "#40004be6"
}, A_ = {
  plum1: "color(display-p3 0.995 0.988 0.999)",
  plum2: "color(display-p3 0.988 0.971 0.99)",
  plum3: "color(display-p3 0.973 0.923 0.98)",
  plum4: "color(display-p3 0.953 0.875 0.966)",
  plum5: "color(display-p3 0.926 0.825 0.945)",
  plum6: "color(display-p3 0.89 0.765 0.916)",
  plum7: "color(display-p3 0.84 0.686 0.877)",
  plum8: "color(display-p3 0.775 0.58 0.832)",
  plum9: "color(display-p3 0.624 0.313 0.708)",
  plum10: "color(display-p3 0.587 0.29 0.667)",
  plum11: "color(display-p3 0.543 0.263 0.619)",
  plum12: "color(display-p3 0.299 0.114 0.352)"
}, v_ = {
  plumA1: "color(display-p3 0.675 0.024 1 / 0.012)",
  plumA2: "color(display-p3 0.58 0.024 0.58 / 0.028)",
  plumA3: "color(display-p3 0.655 0.008 0.753 / 0.079)",
  plumA4: "color(display-p3 0.627 0.008 0.722 / 0.126)",
  plumA5: "color(display-p3 0.58 0.004 0.69 / 0.177)",
  plumA6: "color(display-p3 0.537 0.004 0.655 / 0.236)",
  plumA7: "color(display-p3 0.49 0.004 0.616 / 0.314)",
  plumA8: "color(display-p3 0.471 0.004 0.6 / 0.42)",
  plumA9: "color(display-p3 0.451 0 0.576 / 0.687)",
  plumA10: "color(display-p3 0.42 0 0.529 / 0.71)",
  plumA11: "color(display-p3 0.543 0.263 0.619)",
  plumA12: "color(display-p3 0.299 0.114 0.352)"
}, w_ = {
  purple1: "#fefcfe",
  purple2: "#fbf7fe",
  purple3: "#f7edfe",
  purple4: "#f2e2fc",
  purple5: "#ead5f9",
  purple6: "#e0c4f4",
  purple7: "#d1afec",
  purple8: "#be93e4",
  purple9: "#8e4ec6",
  purple10: "#8347b9",
  purple11: "#8145b5",
  purple12: "#402060"
}, x_ = {
  purpleA1: "#aa00aa03",
  purpleA2: "#8000e008",
  purpleA3: "#8e00f112",
  purpleA4: "#8d00e51d",
  purpleA5: "#8000db2a",
  purpleA6: "#7a01d03b",
  purpleA7: "#6d00c350",
  purpleA8: "#6600c06c",
  purpleA9: "#5c00adb1",
  purpleA10: "#53009eb8",
  purpleA11: "#52009aba",
  purpleA12: "#250049df"
}, __ = {
  purple1: "color(display-p3 0.995 0.988 0.996)",
  purple2: "color(display-p3 0.983 0.971 0.993)",
  purple3: "color(display-p3 0.963 0.931 0.989)",
  purple4: "color(display-p3 0.937 0.888 0.981)",
  purple5: "color(display-p3 0.904 0.837 0.966)",
  purple6: "color(display-p3 0.86 0.774 0.942)",
  purple7: "color(display-p3 0.799 0.69 0.91)",
  purple8: "color(display-p3 0.719 0.583 0.874)",
  purple9: "color(display-p3 0.523 0.318 0.751)",
  purple10: "color(display-p3 0.483 0.289 0.7)",
  purple11: "color(display-p3 0.473 0.281 0.687)",
  purple12: "color(display-p3 0.234 0.132 0.363)"
}, E_ = {
  purpleA1: "color(display-p3 0.675 0.024 0.675 / 0.012)",
  purpleA2: "color(display-p3 0.443 0.024 0.722 / 0.028)",
  purpleA3: "color(display-p3 0.506 0.008 0.835 / 0.071)",
  purpleA4: "color(display-p3 0.451 0.004 0.831 / 0.114)",
  purpleA5: "color(display-p3 0.431 0.004 0.788 / 0.165)",
  purpleA6: "color(display-p3 0.384 0.004 0.745 / 0.228)",
  purpleA7: "color(display-p3 0.357 0.004 0.71 / 0.31)",
  purpleA8: "color(display-p3 0.322 0.004 0.702 / 0.416)",
  purpleA9: "color(display-p3 0.298 0 0.639 / 0.683)",
  purpleA10: "color(display-p3 0.271 0 0.58 / 0.71)",
  purpleA11: "color(display-p3 0.473 0.281 0.687)",
  purpleA12: "color(display-p3 0.234 0.132 0.363)"
}, S_ = {
  violet1: "#fdfcfe",
  violet2: "#faf8ff",
  violet3: "#f4f0fe",
  violet4: "#ebe4ff",
  violet5: "#e1d9ff",
  violet6: "#d4cafe",
  violet7: "#c2b5f5",
  violet8: "#aa99ec",
  violet9: "#6e56cf",
  violet10: "#654dc4",
  violet11: "#6550b9",
  violet12: "#2f265f"
}, k_ = {
  violetA1: "#5500aa03",
  violetA2: "#4900ff07",
  violetA3: "#4400ee0f",
  violetA4: "#4300ff1b",
  violetA5: "#3600ff26",
  violetA6: "#3100fb35",
  violetA7: "#2d01dd4a",
  violetA8: "#2b00d066",
  violetA9: "#2400b7a9",
  violetA10: "#2300abb2",
  violetA11: "#1f0099af",
  violetA12: "#0b0043d9"
}, T_ = {
  violet1: "color(display-p3 0.991 0.988 0.995)",
  violet2: "color(display-p3 0.978 0.974 0.998)",
  violet3: "color(display-p3 0.953 0.943 0.993)",
  violet4: "color(display-p3 0.916 0.897 1)",
  violet5: "color(display-p3 0.876 0.851 1)",
  violet6: "color(display-p3 0.825 0.793 0.981)",
  violet7: "color(display-p3 0.752 0.712 0.943)",
  violet8: "color(display-p3 0.654 0.602 0.902)",
  violet9: "color(display-p3 0.417 0.341 0.784)",
  violet10: "color(display-p3 0.381 0.306 0.741)",
  violet11: "color(display-p3 0.383 0.317 0.702)",
  violet12: "color(display-p3 0.179 0.15 0.359)"
}, D_ = {
  violetA1: "color(display-p3 0.349 0.024 0.675 / 0.012)",
  violetA2: "color(display-p3 0.161 0.024 0.863 / 0.028)",
  violetA3: "color(display-p3 0.204 0.004 0.871 / 0.059)",
  violetA4: "color(display-p3 0.196 0.004 1 / 0.102)",
  violetA5: "color(display-p3 0.165 0.008 1 / 0.15)",
  violetA6: "color(display-p3 0.153 0.004 0.906 / 0.208)",
  violetA7: "color(display-p3 0.141 0.004 0.796 / 0.287)",
  violetA8: "color(display-p3 0.133 0.004 0.753 / 0.397)",
  violetA9: "color(display-p3 0.114 0 0.675 / 0.659)",
  violetA10: "color(display-p3 0.11 0 0.627 / 0.695)",
  violetA11: "color(display-p3 0.383 0.317 0.702)",
  violetA12: "color(display-p3 0.179 0.15 0.359)"
}, M_ = {
  iris1: "#fdfdff",
  iris2: "#f8f8ff",
  iris3: "#f0f1fe",
  iris4: "#e6e7ff",
  iris5: "#dadcff",
  iris6: "#cbcdff",
  iris7: "#b8baf8",
  iris8: "#9b9ef0",
  iris9: "#5b5bd6",
  iris10: "#5151cd",
  iris11: "#5753c6",
  iris12: "#272962"
}, C_ = {
  irisA1: "#0000ff02",
  irisA2: "#0000ff07",
  irisA3: "#0011ee0f",
  irisA4: "#000bff19",
  irisA5: "#000eff25",
  irisA6: "#000aff34",
  irisA7: "#0008e647",
  irisA8: "#0008d964",
  irisA9: "#0000c0a4",
  irisA10: "#0000b6ae",
  irisA11: "#0600abac",
  irisA12: "#000246d8"
}, L_ = {
  iris1: "color(display-p3 0.992 0.992 0.999)",
  iris2: "color(display-p3 0.972 0.973 0.998)",
  iris3: "color(display-p3 0.943 0.945 0.992)",
  iris4: "color(display-p3 0.902 0.906 1)",
  iris5: "color(display-p3 0.857 0.861 1)",
  iris6: "color(display-p3 0.799 0.805 0.987)",
  iris7: "color(display-p3 0.721 0.727 0.955)",
  iris8: "color(display-p3 0.61 0.619 0.918)",
  iris9: "color(display-p3 0.357 0.357 0.81)",
  iris10: "color(display-p3 0.318 0.318 0.774)",
  iris11: "color(display-p3 0.337 0.326 0.748)",
  iris12: "color(display-p3 0.154 0.161 0.371)"
}, F_ = {
  irisA1: "color(display-p3 0.02 0.02 1 / 0.008)",
  irisA2: "color(display-p3 0.024 0.024 0.863 / 0.028)",
  irisA3: "color(display-p3 0.004 0.071 0.871 / 0.059)",
  irisA4: "color(display-p3 0.012 0.051 1 / 0.099)",
  irisA5: "color(display-p3 0.008 0.035 1 / 0.142)",
  irisA6: "color(display-p3 0 0.02 0.941 / 0.2)",
  irisA7: "color(display-p3 0.004 0.02 0.847 / 0.279)",
  irisA8: "color(display-p3 0.004 0.024 0.788 / 0.389)",
  irisA9: "color(display-p3 0 0 0.706 / 0.644)",
  irisA10: "color(display-p3 0 0 0.667 / 0.683)",
  irisA11: "color(display-p3 0.337 0.326 0.748)",
  irisA12: "color(display-p3 0.154 0.161 0.371)"
}, R_ = {
  indigo1: "#fdfdfe",
  indigo2: "#f7f9ff",
  indigo3: "#edf2fe",
  indigo4: "#e1e9ff",
  indigo5: "#d2deff",
  indigo6: "#c1d0ff",
  indigo7: "#abbdf9",
  indigo8: "#8da4ef",
  indigo9: "#3e63dd",
  indigo10: "#3358d4",
  indigo11: "#3a5bc7",
  indigo12: "#1f2d5c"
}, O_ = {
  indigoA1: "#00008002",
  indigoA2: "#0040ff08",
  indigoA3: "#0047f112",
  indigoA4: "#0044ff1e",
  indigoA5: "#0044ff2d",
  indigoA6: "#003eff3e",
  indigoA7: "#0037ed54",
  indigoA8: "#0034dc72",
  indigoA9: "#0031d2c1",
  indigoA10: "#002ec9cc",
  indigoA11: "#002bb7c5",
  indigoA12: "#001046e0"
}, P_ = {
  indigo1: "color(display-p3 0.992 0.992 0.996)",
  indigo2: "color(display-p3 0.971 0.977 0.998)",
  indigo3: "color(display-p3 0.933 0.948 0.992)",
  indigo4: "color(display-p3 0.885 0.914 1)",
  indigo5: "color(display-p3 0.831 0.87 1)",
  indigo6: "color(display-p3 0.767 0.814 0.995)",
  indigo7: "color(display-p3 0.685 0.74 0.957)",
  indigo8: "color(display-p3 0.569 0.639 0.916)",
  indigo9: "color(display-p3 0.276 0.384 0.837)",
  indigo10: "color(display-p3 0.234 0.343 0.801)",
  indigo11: "color(display-p3 0.256 0.354 0.755)",
  indigo12: "color(display-p3 0.133 0.175 0.348)"
}, I_ = {
  indigoA1: "color(display-p3 0.02 0.02 0.51 / 0.008)",
  indigoA2: "color(display-p3 0.024 0.161 0.863 / 0.028)",
  indigoA3: "color(display-p3 0.008 0.239 0.886 / 0.067)",
  indigoA4: "color(display-p3 0.004 0.247 1 / 0.114)",
  indigoA5: "color(display-p3 0.004 0.235 1 / 0.169)",
  indigoA6: "color(display-p3 0.004 0.208 0.984 / 0.232)",
  indigoA7: "color(display-p3 0.004 0.176 0.863 / 0.314)",
  indigoA8: "color(display-p3 0.004 0.165 0.812 / 0.432)",
  indigoA9: "color(display-p3 0 0.153 0.773 / 0.726)",
  indigoA10: "color(display-p3 0 0.137 0.737 / 0.765)",
  indigoA11: "color(display-p3 0.256 0.354 0.755)",
  indigoA12: "color(display-p3 0.133 0.175 0.348)"
}, B_ = {
  blue1: "#fbfdff",
  blue2: "#f4faff",
  blue3: "#e6f4fe",
  blue4: "#d5efff",
  blue5: "#c2e5ff",
  blue6: "#acd8fc",
  blue7: "#8ec8f6",
  blue8: "#5eb1ef",
  blue9: "#0090ff",
  blue10: "#0588f0",
  blue11: "#0d74ce",
  blue12: "#113264"
}, N_ = {
  blueA1: "#0080ff04",
  blueA2: "#008cff0b",
  blueA3: "#008ff519",
  blueA4: "#009eff2a",
  blueA5: "#0093ff3d",
  blueA6: "#0088f653",
  blueA7: "#0083eb71",
  blueA8: "#0084e6a1",
  blueA9: "#0090ff",
  blueA10: "#0086f0fa",
  blueA11: "#006dcbf2",
  blueA12: "#002359ee"
}, G_ = {
  blue1: "color(display-p3 0.986 0.992 0.999)",
  blue2: "color(display-p3 0.96 0.979 0.998)",
  blue3: "color(display-p3 0.912 0.956 0.991)",
  blue4: "color(display-p3 0.853 0.932 1)",
  blue5: "color(display-p3 0.788 0.894 0.998)",
  blue6: "color(display-p3 0.709 0.843 0.976)",
  blue7: "color(display-p3 0.606 0.777 0.947)",
  blue8: "color(display-p3 0.451 0.688 0.917)",
  blue9: "color(display-p3 0.247 0.556 0.969)",
  blue10: "color(display-p3 0.234 0.523 0.912)",
  blue11: "color(display-p3 0.15 0.44 0.84)",
  blue12: "color(display-p3 0.102 0.193 0.379)"
}, q_ = {
  blueA1: "color(display-p3 0.024 0.514 1 / 0.016)",
  blueA2: "color(display-p3 0.024 0.514 0.906 / 0.04)",
  blueA3: "color(display-p3 0.012 0.506 0.914 / 0.087)",
  blueA4: "color(display-p3 0.008 0.545 1 / 0.146)",
  blueA5: "color(display-p3 0.004 0.502 0.984 / 0.212)",
  blueA6: "color(display-p3 0.004 0.463 0.922 / 0.291)",
  blueA7: "color(display-p3 0.004 0.431 0.863 / 0.393)",
  blueA8: "color(display-p3 0 0.427 0.851 / 0.55)",
  blueA9: "color(display-p3 0 0.412 0.961 / 0.753)",
  blueA10: "color(display-p3 0 0.376 0.886 / 0.765)",
  blueA11: "color(display-p3 0.15 0.44 0.84)",
  blueA12: "color(display-p3 0.102 0.193 0.379)"
}, $_ = {
  cyan1: "#fafdfe",
  cyan2: "#f2fafb",
  cyan3: "#def7f9",
  cyan4: "#caf1f6",
  cyan5: "#b5e9f0",
  cyan6: "#9ddde7",
  cyan7: "#7dcedc",
  cyan8: "#3db9cf",
  cyan9: "#00a2c7",
  cyan10: "#0797b9",
  cyan11: "#107d98",
  cyan12: "#0d3c48"
}, z_ = {
  cyanA1: "#0099cc05",
  cyanA2: "#009db10d",
  cyanA3: "#00c2d121",
  cyanA4: "#00bcd435",
  cyanA5: "#01b4cc4a",
  cyanA6: "#00a7c162",
  cyanA7: "#009fbb82",
  cyanA8: "#00a3c0c2",
  cyanA9: "#00a2c7",
  cyanA10: "#0094b7f8",
  cyanA11: "#007491ef",
  cyanA12: "#00323ef2"
}, j_ = {
  cyan1: "color(display-p3 0.982 0.992 0.996)",
  cyan2: "color(display-p3 0.955 0.981 0.984)",
  cyan3: "color(display-p3 0.888 0.965 0.975)",
  cyan4: "color(display-p3 0.821 0.941 0.959)",
  cyan5: "color(display-p3 0.751 0.907 0.935)",
  cyan6: "color(display-p3 0.671 0.862 0.9)",
  cyan7: "color(display-p3 0.564 0.8 0.854)",
  cyan8: "color(display-p3 0.388 0.715 0.798)",
  cyan9: "color(display-p3 0.282 0.627 0.765)",
  cyan10: "color(display-p3 0.264 0.583 0.71)",
  cyan11: "color(display-p3 0.08 0.48 0.63)",
  cyan12: "color(display-p3 0.108 0.232 0.277)"
}, H_ = {
  cyanA1: "color(display-p3 0.02 0.608 0.804 / 0.02)",
  cyanA2: "color(display-p3 0.02 0.557 0.647 / 0.044)",
  cyanA3: "color(display-p3 0.004 0.694 0.796 / 0.114)",
  cyanA4: "color(display-p3 0.004 0.678 0.784 / 0.181)",
  cyanA5: "color(display-p3 0.004 0.624 0.733 / 0.248)",
  cyanA6: "color(display-p3 0.004 0.584 0.706 / 0.33)",
  cyanA7: "color(display-p3 0.004 0.541 0.667 / 0.436)",
  cyanA8: "color(display-p3 0 0.533 0.667 / 0.612)",
  cyanA9: "color(display-p3 0 0.482 0.675 / 0.718)",
  cyanA10: "color(display-p3 0 0.435 0.608 / 0.738)",
  cyanA11: "color(display-p3 0.08 0.48 0.63)",
  cyanA12: "color(display-p3 0.108 0.232 0.277)"
}, U_ = {
  teal1: "#fafefd",
  teal2: "#f3fbf9",
  teal3: "#e0f8f3",
  teal4: "#ccf3ea",
  teal5: "#b8eae0",
  teal6: "#a1ded2",
  teal7: "#83cdc1",
  teal8: "#53b9ab",
  teal9: "#12a594",
  teal10: "#0d9b8a",
  teal11: "#008573",
  teal12: "#0d3d38"
}, V_ = {
  tealA1: "#00cc9905",
  tealA2: "#00aa800c",
  tealA3: "#00c69d1f",
  tealA4: "#00c39633",
  tealA5: "#00b49047",
  tealA6: "#00a6855e",
  tealA7: "#0099807c",
  tealA8: "#009783ac",
  tealA9: "#009e8ced",
  tealA10: "#009684f2",
  tealA11: "#008573",
  tealA12: "#00332df2"
}, W_ = {
  teal1: "color(display-p3 0.983 0.996 0.992)",
  teal2: "color(display-p3 0.958 0.983 0.976)",
  teal3: "color(display-p3 0.895 0.971 0.952)",
  teal4: "color(display-p3 0.831 0.949 0.92)",
  teal5: "color(display-p3 0.761 0.914 0.878)",
  teal6: "color(display-p3 0.682 0.864 0.825)",
  teal7: "color(display-p3 0.581 0.798 0.756)",
  teal8: "color(display-p3 0.433 0.716 0.671)",
  teal9: "color(display-p3 0.297 0.637 0.581)",
  teal10: "color(display-p3 0.275 0.599 0.542)",
  teal11: "color(display-p3 0.08 0.5 0.43)",
  teal12: "color(display-p3 0.11 0.235 0.219)"
}, X_ = {
  tealA1: "color(display-p3 0.024 0.757 0.514 / 0.016)",
  tealA2: "color(display-p3 0.02 0.647 0.467 / 0.044)",
  tealA3: "color(display-p3 0.004 0.741 0.557 / 0.106)",
  tealA4: "color(display-p3 0.004 0.702 0.537 / 0.169)",
  tealA5: "color(display-p3 0.004 0.643 0.494 / 0.24)",
  tealA6: "color(display-p3 0.004 0.569 0.447 / 0.318)",
  tealA7: "color(display-p3 0.004 0.518 0.424 / 0.42)",
  tealA8: "color(display-p3 0 0.506 0.424 / 0.569)",
  tealA9: "color(display-p3 0 0.482 0.404 / 0.702)",
  tealA10: "color(display-p3 0 0.451 0.369 / 0.726)",
  tealA11: "color(display-p3 0.08 0.5 0.43)",
  tealA12: "color(display-p3 0.11 0.235 0.219)"
}, Y_ = {
  jade1: "#fbfefd",
  jade2: "#f4fbf7",
  jade3: "#e6f7ed",
  jade4: "#d6f1e3",
  jade5: "#c3e9d7",
  jade6: "#acdec8",
  jade7: "#8bceb6",
  jade8: "#56ba9f",
  jade9: "#29a383",
  jade10: "#26997b",
  jade11: "#208368",
  jade12: "#1d3b31"
}, K_ = {
  jadeA1: "#00c08004",
  jadeA2: "#00a3460b",
  jadeA3: "#00ae4819",
  jadeA4: "#00a85129",
  jadeA5: "#00a2553c",
  jadeA6: "#009a5753",
  jadeA7: "#00945f74",
  jadeA8: "#00976ea9",
  jadeA9: "#00916bd6",
  jadeA10: "#008764d9",
  jadeA11: "#007152df",
  jadeA12: "#002217e2"
}, Z_ = {
  jade1: "color(display-p3 0.986 0.996 0.992)",
  jade2: "color(display-p3 0.962 0.983 0.969)",
  jade3: "color(display-p3 0.912 0.965 0.932)",
  jade4: "color(display-p3 0.858 0.941 0.893)",
  jade5: "color(display-p3 0.795 0.909 0.847)",
  jade6: "color(display-p3 0.715 0.864 0.791)",
  jade7: "color(display-p3 0.603 0.802 0.718)",
  jade8: "color(display-p3 0.44 0.72 0.629)",
  jade9: "color(display-p3 0.319 0.63 0.521)",
  jade10: "color(display-p3 0.299 0.592 0.488)",
  jade11: "color(display-p3 0.15 0.5 0.37)",
  jade12: "color(display-p3 0.142 0.229 0.194)"
}, Q_ = {
  jadeA1: "color(display-p3 0.024 0.757 0.514 / 0.016)",
  jadeA2: "color(display-p3 0.024 0.612 0.22 / 0.04)",
  jadeA3: "color(display-p3 0.012 0.596 0.235 / 0.087)",
  jadeA4: "color(display-p3 0.008 0.588 0.255 / 0.142)",
  jadeA5: "color(display-p3 0.004 0.561 0.251 / 0.204)",
  jadeA6: "color(display-p3 0.004 0.525 0.278 / 0.287)",
  jadeA7: "color(display-p3 0.004 0.506 0.29 / 0.397)",
  jadeA8: "color(display-p3 0 0.506 0.337 / 0.561)",
  jadeA9: "color(display-p3 0 0.459 0.298 / 0.683)",
  jadeA10: "color(display-p3 0 0.42 0.271 / 0.702)",
  jadeA11: "color(display-p3 0.15 0.5 0.37)",
  jadeA12: "color(display-p3 0.142 0.229 0.194)"
}, J_ = {
  green1: "#fbfefc",
  green2: "#f4fbf6",
  green3: "#e6f6eb",
  green4: "#d6f1df",
  green5: "#c4e8d1",
  green6: "#adddc0",
  green7: "#8eceaa",
  green8: "#5bb98b",
  green9: "#30a46c",
  green10: "#2b9a66",
  green11: "#218358",
  green12: "#193b2d"
}, eE = {
  greenA1: "#00c04004",
  greenA2: "#00a32f0b",
  greenA3: "#00a43319",
  greenA4: "#00a83829",
  greenA5: "#019c393b",
  greenA6: "#00963c52",
  greenA7: "#00914071",
  greenA8: "#00924ba4",
  greenA9: "#008f4acf",
  greenA10: "#008647d4",
  greenA11: "#00713fde",
  greenA12: "#002616e6"
}, tE = {
  green1: "color(display-p3 0.986 0.996 0.989)",
  green2: "color(display-p3 0.963 0.983 0.967)",
  green3: "color(display-p3 0.913 0.964 0.925)",
  green4: "color(display-p3 0.859 0.94 0.879)",
  green5: "color(display-p3 0.796 0.907 0.826)",
  green6: "color(display-p3 0.718 0.863 0.761)",
  green7: "color(display-p3 0.61 0.801 0.675)",
  green8: "color(display-p3 0.451 0.715 0.559)",
  green9: "color(display-p3 0.332 0.634 0.442)",
  green10: "color(display-p3 0.308 0.595 0.417)",
  green11: "color(display-p3 0.19 0.5 0.32)",
  green12: "color(display-p3 0.132 0.228 0.18)"
}, rE = {
  greenA1: "color(display-p3 0.024 0.757 0.267 / 0.016)",
  greenA2: "color(display-p3 0.024 0.565 0.129 / 0.036)",
  greenA3: "color(display-p3 0.012 0.596 0.145 / 0.087)",
  greenA4: "color(display-p3 0.008 0.588 0.145 / 0.142)",
  greenA5: "color(display-p3 0.004 0.541 0.157 / 0.204)",
  greenA6: "color(display-p3 0.004 0.518 0.157 / 0.283)",
  greenA7: "color(display-p3 0.004 0.486 0.165 / 0.389)",
  greenA8: "color(display-p3 0 0.478 0.2 / 0.55)",
  greenA9: "color(display-p3 0 0.455 0.165 / 0.667)",
  greenA10: "color(display-p3 0 0.416 0.153 / 0.691)",
  greenA11: "color(display-p3 0.19 0.5 0.32)",
  greenA12: "color(display-p3 0.132 0.228 0.18)"
}, nE = {
  grass1: "#fbfefb",
  grass2: "#f5fbf5",
  grass3: "#e9f6e9",
  grass4: "#daf1db",
  grass5: "#c9e8ca",
  grass6: "#b2ddb5",
  grass7: "#94ce9a",
  grass8: "#65ba74",
  grass9: "#46a758",
  grass10: "#3e9b4f",
  grass11: "#2a7e3b",
  grass12: "#203c25"
}, oE = {
  grassA1: "#00c00004",
  grassA2: "#0099000a",
  grassA3: "#00970016",
  grassA4: "#009f0725",
  grassA5: "#00930536",
  grassA6: "#008f0a4d",
  grassA7: "#018b0f6b",
  grassA8: "#008d199a",
  grassA9: "#008619b9",
  grassA10: "#007b17c1",
  grassA11: "#006514d5",
  grassA12: "#002006df"
}, aE = {
  grass1: "color(display-p3 0.986 0.996 0.985)",
  grass2: "color(display-p3 0.966 0.983 0.964)",
  grass3: "color(display-p3 0.923 0.965 0.917)",
  grass4: "color(display-p3 0.872 0.94 0.865)",
  grass5: "color(display-p3 0.811 0.908 0.802)",
  grass6: "color(display-p3 0.733 0.864 0.724)",
  grass7: "color(display-p3 0.628 0.803 0.622)",
  grass8: "color(display-p3 0.477 0.72 0.482)",
  grass9: "color(display-p3 0.38 0.647 0.378)",
  grass10: "color(display-p3 0.344 0.598 0.342)",
  grass11: "color(display-p3 0.263 0.488 0.261)",
  grass12: "color(display-p3 0.151 0.233 0.153)"
}, iE = {
  grassA1: "color(display-p3 0.024 0.757 0.024 / 0.016)",
  grassA2: "color(display-p3 0.024 0.565 0.024 / 0.036)",
  grassA3: "color(display-p3 0.059 0.576 0.008 / 0.083)",
  grassA4: "color(display-p3 0.035 0.565 0.008 / 0.134)",
  grassA5: "color(display-p3 0.047 0.545 0.008 / 0.197)",
  grassA6: "color(display-p3 0.031 0.502 0.004 / 0.275)",
  grassA7: "color(display-p3 0.012 0.482 0.004 / 0.377)",
  grassA8: "color(display-p3 0 0.467 0.008 / 0.522)",
  grassA9: "color(display-p3 0.008 0.435 0 / 0.624)",
  grassA10: "color(display-p3 0.008 0.388 0 / 0.659)",
  grassA11: "color(display-p3 0.263 0.488 0.261)",
  grassA12: "color(display-p3 0.151 0.233 0.153)"
}, sE = {
  brown1: "#fefdfc",
  brown2: "#fcf9f6",
  brown3: "#f6eee7",
  brown4: "#f0e4d9",
  brown5: "#ebdaca",
  brown6: "#e4cdb7",
  brown7: "#dcbc9f",
  brown8: "#cea37e",
  brown9: "#ad7f58",
  brown10: "#a07553",
  brown11: "#815e46",
  brown12: "#3e332e"
}, lE = {
  brownA1: "#aa550003",
  brownA2: "#aa550009",
  brownA3: "#a04b0018",
  brownA4: "#9b4a0026",
  brownA5: "#9f4d0035",
  brownA6: "#a04e0048",
  brownA7: "#a34e0060",
  brownA8: "#9f4a0081",
  brownA9: "#823c00a7",
  brownA10: "#723300ac",
  brownA11: "#522100b9",
  brownA12: "#140600d1"
}, cE = {
  brown1: "color(display-p3 0.995 0.992 0.989)",
  brown2: "color(display-p3 0.987 0.976 0.964)",
  brown3: "color(display-p3 0.959 0.936 0.909)",
  brown4: "color(display-p3 0.934 0.897 0.855)",
  brown5: "color(display-p3 0.909 0.856 0.798)",
  brown6: "color(display-p3 0.88 0.808 0.73)",
  brown7: "color(display-p3 0.841 0.742 0.639)",
  brown8: "color(display-p3 0.782 0.647 0.514)",
  brown9: "color(display-p3 0.651 0.505 0.368)",
  brown10: "color(display-p3 0.601 0.465 0.344)",
  brown11: "color(display-p3 0.485 0.374 0.288)",
  brown12: "color(display-p3 0.236 0.202 0.183)"
}, uE = {
  brownA1: "color(display-p3 0.675 0.349 0.024 / 0.012)",
  brownA2: "color(display-p3 0.675 0.349 0.024 / 0.036)",
  brownA3: "color(display-p3 0.573 0.314 0.012 / 0.091)",
  brownA4: "color(display-p3 0.545 0.302 0.008 / 0.146)",
  brownA5: "color(display-p3 0.561 0.29 0.004 / 0.204)",
  brownA6: "color(display-p3 0.553 0.294 0.004 / 0.271)",
  brownA7: "color(display-p3 0.557 0.286 0.004 / 0.361)",
  brownA8: "color(display-p3 0.549 0.275 0.004 / 0.487)",
  brownA9: "color(display-p3 0.447 0.22 0 / 0.632)",
  brownA10: "color(display-p3 0.388 0.188 0 / 0.655)",
  brownA11: "color(display-p3 0.485 0.374 0.288)",
  brownA12: "color(display-p3 0.236 0.202 0.183)"
}, fE = {
  bronze1: "#fdfcfc",
  bronze2: "#fdf7f5",
  bronze3: "#f6edea",
  bronze4: "#efe4df",
  bronze5: "#e7d9d3",
  bronze6: "#dfcdc5",
  bronze7: "#d3bcb3",
  bronze8: "#c2a499",
  bronze9: "#a18072",
  bronze10: "#957468",
  bronze11: "#7d5e54",
  bronze12: "#43302b"
}, dE = {
  bronzeA1: "#55000003",
  bronzeA2: "#cc33000a",
  bronzeA3: "#92250015",
  bronzeA4: "#80280020",
  bronzeA5: "#7423002c",
  bronzeA6: "#7324003a",
  bronzeA7: "#6c1f004c",
  bronzeA8: "#671c0066",
  bronzeA9: "#551a008d",
  bronzeA10: "#4c150097",
  bronzeA11: "#3d0f00ab",
  bronzeA12: "#1d0600d4"
}, pE = {
  bronze1: "color(display-p3 0.991 0.988 0.988)",
  bronze2: "color(display-p3 0.989 0.97 0.961)",
  bronze3: "color(display-p3 0.958 0.932 0.919)",
  bronze4: "color(display-p3 0.929 0.894 0.877)",
  bronze5: "color(display-p3 0.898 0.853 0.832)",
  bronze6: "color(display-p3 0.861 0.805 0.778)",
  bronze7: "color(display-p3 0.812 0.739 0.706)",
  bronze8: "color(display-p3 0.741 0.647 0.606)",
  bronze9: "color(display-p3 0.611 0.507 0.455)",
  bronze10: "color(display-p3 0.563 0.461 0.414)",
  bronze11: "color(display-p3 0.471 0.373 0.336)",
  bronze12: "color(display-p3 0.251 0.191 0.172)"
}, hE = {
  bronzeA1: "color(display-p3 0.349 0.024 0.024 / 0.012)",
  bronzeA2: "color(display-p3 0.71 0.22 0.024 / 0.04)",
  bronzeA3: "color(display-p3 0.482 0.2 0.008 / 0.083)",
  bronzeA4: "color(display-p3 0.424 0.133 0.004 / 0.122)",
  bronzeA5: "color(display-p3 0.4 0.145 0.004 / 0.169)",
  bronzeA6: "color(display-p3 0.388 0.125 0.004 / 0.224)",
  bronzeA7: "color(display-p3 0.365 0.11 0.004 / 0.295)",
  bronzeA8: "color(display-p3 0.341 0.102 0.004 / 0.393)",
  bronzeA9: "color(display-p3 0.29 0.094 0 / 0.546)",
  bronzeA10: "color(display-p3 0.255 0.082 0 / 0.585)",
  bronzeA11: "color(display-p3 0.471 0.373 0.336)",
  bronzeA12: "color(display-p3 0.251 0.191 0.172)"
}, mE = {
  gold1: "#fdfdfc",
  gold2: "#faf9f2",
  gold3: "#f2f0e7",
  gold4: "#eae6db",
  gold5: "#e1dccf",
  gold6: "#d8d0bf",
  gold7: "#cbc0aa",
  gold8: "#b9a88d",
  gold9: "#978365",
  gold10: "#8c7a5e",
  gold11: "#71624b",
  gold12: "#3b352b"
}, yE = {
  goldA1: "#55550003",
  goldA2: "#9d8a000d",
  goldA3: "#75600018",
  goldA4: "#6b4e0024",
  goldA5: "#60460030",
  goldA6: "#64440040",
  goldA7: "#63420055",
  goldA8: "#633d0072",
  goldA9: "#5332009a",
  goldA10: "#492d00a1",
  goldA11: "#362100b4",
  goldA12: "#130c00d4"
}, bE = {
  gold1: "color(display-p3 0.992 0.992 0.989)",
  gold2: "color(display-p3 0.98 0.976 0.953)",
  gold3: "color(display-p3 0.947 0.94 0.909)",
  gold4: "color(display-p3 0.914 0.904 0.865)",
  gold5: "color(display-p3 0.88 0.865 0.816)",
  gold6: "color(display-p3 0.84 0.818 0.756)",
  gold7: "color(display-p3 0.788 0.753 0.677)",
  gold8: "color(display-p3 0.715 0.66 0.565)",
  gold9: "color(display-p3 0.579 0.517 0.41)",
  gold10: "color(display-p3 0.538 0.479 0.38)",
  gold11: "color(display-p3 0.433 0.386 0.305)",
  gold12: "color(display-p3 0.227 0.209 0.173)"
}, gE = {
  goldA1: "color(display-p3 0.349 0.349 0.024 / 0.012)",
  goldA2: "color(display-p3 0.592 0.514 0.024 / 0.048)",
  goldA3: "color(display-p3 0.4 0.357 0.012 / 0.091)",
  goldA4: "color(display-p3 0.357 0.298 0.008 / 0.134)",
  goldA5: "color(display-p3 0.345 0.282 0.004 / 0.185)",
  goldA6: "color(display-p3 0.341 0.263 0.004 / 0.244)",
  goldA7: "color(display-p3 0.345 0.235 0.004 / 0.322)",
  goldA8: "color(display-p3 0.345 0.22 0.004 / 0.436)",
  goldA9: "color(display-p3 0.286 0.18 0 / 0.589)",
  goldA10: "color(display-p3 0.255 0.161 0 / 0.62)",
  goldA11: "color(display-p3 0.433 0.386 0.305)",
  goldA12: "color(display-p3 0.227 0.209 0.173)"
}, AE = {
  sky1: "#f9feff",
  sky2: "#f1fafd",
  sky3: "#e1f6fd",
  sky4: "#d1f0fa",
  sky5: "#bee7f5",
  sky6: "#a9daed",
  sky7: "#8dcae3",
  sky8: "#60b3d7",
  sky9: "#7ce2fe",
  sky10: "#74daf8",
  sky11: "#00749e",
  sky12: "#1d3e56"
}, vE = {
  skyA1: "#00d5ff06",
  skyA2: "#00a4db0e",
  skyA3: "#00b3ee1e",
  skyA4: "#00ace42e",
  skyA5: "#00a1d841",
  skyA6: "#0092ca56",
  skyA7: "#0089c172",
  skyA8: "#0085bf9f",
  skyA9: "#00c7fe83",
  skyA10: "#00bcf38b",
  skyA11: "#00749e",
  skyA12: "#002540e2"
}, wE = {
  sky1: "color(display-p3 0.98 0.995 0.999)",
  sky2: "color(display-p3 0.953 0.98 0.99)",
  sky3: "color(display-p3 0.899 0.963 0.989)",
  sky4: "color(display-p3 0.842 0.937 0.977)",
  sky5: "color(display-p3 0.777 0.9 0.954)",
  sky6: "color(display-p3 0.701 0.851 0.921)",
  sky7: "color(display-p3 0.604 0.785 0.879)",
  sky8: "color(display-p3 0.457 0.696 0.829)",
  sky9: "color(display-p3 0.585 0.877 0.983)",
  sky10: "color(display-p3 0.555 0.845 0.959)",
  sky11: "color(display-p3 0.193 0.448 0.605)",
  sky12: "color(display-p3 0.145 0.241 0.329)"
}, xE = {
  skyA1: "color(display-p3 0.02 0.804 1 / 0.02)",
  skyA2: "color(display-p3 0.024 0.592 0.757 / 0.048)",
  skyA3: "color(display-p3 0.004 0.655 0.886 / 0.102)",
  skyA4: "color(display-p3 0.004 0.604 0.851 / 0.157)",
  skyA5: "color(display-p3 0.004 0.565 0.792 / 0.224)",
  skyA6: "color(display-p3 0.004 0.502 0.737 / 0.299)",
  skyA7: "color(display-p3 0.004 0.459 0.694 / 0.397)",
  skyA8: "color(display-p3 0 0.435 0.682 / 0.542)",
  skyA9: "color(display-p3 0.004 0.71 0.965 / 0.416)",
  skyA10: "color(display-p3 0.004 0.647 0.914 / 0.444)",
  skyA11: "color(display-p3 0.193 0.448 0.605)",
  skyA12: "color(display-p3 0.145 0.241 0.329)"
}, _E = {
  mint1: "#f9fefd",
  mint2: "#f2fbf9",
  mint3: "#ddf9f2",
  mint4: "#c8f4e9",
  mint5: "#b3ecde",
  mint6: "#9ce0d0",
  mint7: "#7ecfbd",
  mint8: "#4cbba5",
  mint9: "#86ead4",
  mint10: "#7de0cb",
  mint11: "#027864",
  mint12: "#16433c"
}, EE = {
  mintA1: "#00d5aa06",
  mintA2: "#00b18a0d",
  mintA3: "#00d29e22",
  mintA4: "#00cc9937",
  mintA5: "#00c0914c",
  mintA6: "#00b08663",
  mintA7: "#00a17d81",
  mintA8: "#009e7fb3",
  mintA9: "#00d3a579",
  mintA10: "#00c39982",
  mintA11: "#007763fd",
  mintA12: "#00312ae9"
}, SE = {
  mint1: "color(display-p3 0.98 0.995 0.992)",
  mint2: "color(display-p3 0.957 0.985 0.977)",
  mint3: "color(display-p3 0.888 0.972 0.95)",
  mint4: "color(display-p3 0.819 0.951 0.916)",
  mint5: "color(display-p3 0.747 0.918 0.873)",
  mint6: "color(display-p3 0.668 0.87 0.818)",
  mint7: "color(display-p3 0.567 0.805 0.744)",
  mint8: "color(display-p3 0.42 0.724 0.649)",
  mint9: "color(display-p3 0.62 0.908 0.834)",
  mint10: "color(display-p3 0.585 0.871 0.797)",
  mint11: "color(display-p3 0.203 0.463 0.397)",
  mint12: "color(display-p3 0.136 0.259 0.236)"
}, kE = {
  mintA1: "color(display-p3 0.02 0.804 0.608 / 0.02)",
  mintA2: "color(display-p3 0.02 0.647 0.467 / 0.044)",
  mintA3: "color(display-p3 0.004 0.761 0.553 / 0.114)",
  mintA4: "color(display-p3 0.004 0.741 0.545 / 0.181)",
  mintA5: "color(display-p3 0.004 0.678 0.51 / 0.255)",
  mintA6: "color(display-p3 0.004 0.616 0.463 / 0.334)",
  mintA7: "color(display-p3 0.004 0.549 0.412 / 0.432)",
  mintA8: "color(display-p3 0 0.529 0.392 / 0.581)",
  mintA9: "color(display-p3 0.004 0.765 0.569 / 0.381)",
  mintA10: "color(display-p3 0.004 0.69 0.51 / 0.416)",
  mintA11: "color(display-p3 0.203 0.463 0.397)",
  mintA12: "color(display-p3 0.136 0.259 0.236)"
}, TE = {
  lime1: "#fcfdfa",
  lime2: "#f8faf3",
  lime3: "#eef6d6",
  lime4: "#e2f0bd",
  lime5: "#d3e7a6",
  lime6: "#c2da91",
  lime7: "#abc978",
  lime8: "#8db654",
  lime9: "#bdee63",
  lime10: "#b0e64c",
  lime11: "#5c7c2f",
  lime12: "#37401c"
}, DE = {
  limeA1: "#66990005",
  limeA2: "#6b95000c",
  limeA3: "#96c80029",
  limeA4: "#8fc60042",
  limeA5: "#81bb0059",
  limeA6: "#72aa006e",
  limeA7: "#61990087",
  limeA8: "#559200ab",
  limeA9: "#93e4009c",
  limeA10: "#8fdc00b3",
  limeA11: "#375f00d0",
  limeA12: "#1e2900e3"
}, ME = {
  lime1: "color(display-p3 0.989 0.992 0.981)",
  lime2: "color(display-p3 0.975 0.98 0.954)",
  lime3: "color(display-p3 0.939 0.965 0.851)",
  lime4: "color(display-p3 0.896 0.94 0.76)",
  lime5: "color(display-p3 0.843 0.903 0.678)",
  lime6: "color(display-p3 0.778 0.852 0.599)",
  lime7: "color(display-p3 0.694 0.784 0.508)",
  lime8: "color(display-p3 0.585 0.707 0.378)",
  lime9: "color(display-p3 0.78 0.928 0.466)",
  lime10: "color(display-p3 0.734 0.896 0.397)",
  lime11: "color(display-p3 0.386 0.482 0.227)",
  lime12: "color(display-p3 0.222 0.25 0.128)"
}, CE = {
  limeA1: "color(display-p3 0.412 0.608 0.02 / 0.02)",
  limeA2: "color(display-p3 0.514 0.592 0.024 / 0.048)",
  limeA3: "color(display-p3 0.584 0.765 0.008 / 0.15)",
  limeA4: "color(display-p3 0.561 0.757 0.004 / 0.24)",
  limeA5: "color(display-p3 0.514 0.698 0.004 / 0.322)",
  limeA6: "color(display-p3 0.443 0.627 0 / 0.4)",
  limeA7: "color(display-p3 0.376 0.561 0.004 / 0.491)",
  limeA8: "color(display-p3 0.333 0.529 0 / 0.624)",
  limeA9: "color(display-p3 0.588 0.867 0 / 0.534)",
  limeA10: "color(display-p3 0.561 0.827 0 / 0.604)",
  limeA11: "color(display-p3 0.386 0.482 0.227)",
  limeA12: "color(display-p3 0.222 0.25 0.128)"
}, LE = {
  yellow1: "#fdfdf9",
  yellow2: "#fefce9",
  yellow3: "#fffab8",
  yellow4: "#fff394",
  yellow5: "#ffe770",
  yellow6: "#f3d768",
  yellow7: "#e4c767",
  yellow8: "#d5ae39",
  yellow9: "#ffe629",
  yellow10: "#ffdc00",
  yellow11: "#9e6c00",
  yellow12: "#473b1f"
}, FE = {
  yellowA1: "#aaaa0006",
  yellowA2: "#f4dd0016",
  yellowA3: "#ffee0047",
  yellowA4: "#ffe3016b",
  yellowA5: "#ffd5008f",
  yellowA6: "#ebbc0097",
  yellowA7: "#d2a10098",
  yellowA8: "#c99700c6",
  yellowA9: "#ffe100d6",
  yellowA10: "#ffdc00",
  yellowA11: "#9e6c00",
  yellowA12: "#2e2000e0"
}, RE = {
  yellow1: "color(display-p3 0.992 0.992 0.978)",
  yellow2: "color(display-p3 0.995 0.99 0.922)",
  yellow3: "color(display-p3 0.997 0.982 0.749)",
  yellow4: "color(display-p3 0.992 0.953 0.627)",
  yellow5: "color(display-p3 0.984 0.91 0.51)",
  yellow6: "color(display-p3 0.934 0.847 0.474)",
  yellow7: "color(display-p3 0.876 0.785 0.46)",
  yellow8: "color(display-p3 0.811 0.689 0.313)",
  yellow9: "color(display-p3 1 0.92 0.22)",
  yellow10: "color(display-p3 0.977 0.868 0.291)",
  yellow11: "color(display-p3 0.6 0.44 0)",
  yellow12: "color(display-p3 0.271 0.233 0.137)"
}, OE = {
  yellowA1: "color(display-p3 0.675 0.675 0.024 / 0.024)",
  yellowA2: "color(display-p3 0.953 0.855 0.008 / 0.079)",
  yellowA3: "color(display-p3 0.988 0.925 0.004 / 0.251)",
  yellowA4: "color(display-p3 0.98 0.875 0.004 / 0.373)",
  yellowA5: "color(display-p3 0.969 0.816 0.004 / 0.491)",
  yellowA6: "color(display-p3 0.875 0.71 0 / 0.526)",
  yellowA7: "color(display-p3 0.769 0.604 0 / 0.542)",
  yellowA8: "color(display-p3 0.725 0.549 0 / 0.687)",
  yellowA9: "color(display-p3 1 0.898 0 / 0.781)",
  yellowA10: "color(display-p3 0.969 0.812 0 / 0.71)",
  yellowA11: "color(display-p3 0.6 0.44 0)",
  yellowA12: "color(display-p3 0.271 0.233 0.137)"
}, PE = {
  amber1: "#fefdfb",
  amber2: "#fefbe9",
  amber3: "#fff7c2",
  amber4: "#ffee9c",
  amber5: "#fbe577",
  amber6: "#f3d673",
  amber7: "#e9c162",
  amber8: "#e2a336",
  amber9: "#ffc53d",
  amber10: "#ffba18",
  amber11: "#ab6400",
  amber12: "#4f3422"
}, IE = {
  amberA1: "#c0800004",
  amberA2: "#f4d10016",
  amberA3: "#ffde003d",
  amberA4: "#ffd40063",
  amberA5: "#f8cf0088",
  amberA6: "#eab5008c",
  amberA7: "#dc9b009d",
  amberA8: "#da8a00c9",
  amberA9: "#ffb300c2",
  amberA10: "#ffb300e7",
  amberA11: "#ab6400",
  amberA12: "#341500dd"
}, BE = {
  amber1: "color(display-p3 0.995 0.992 0.985)",
  amber2: "color(display-p3 0.994 0.986 0.921)",
  amber3: "color(display-p3 0.994 0.969 0.782)",
  amber4: "color(display-p3 0.989 0.937 0.65)",
  amber5: "color(display-p3 0.97 0.902 0.527)",
  amber6: "color(display-p3 0.936 0.844 0.506)",
  amber7: "color(display-p3 0.89 0.762 0.443)",
  amber8: "color(display-p3 0.85 0.65 0.3)",
  amber9: "color(display-p3 1 0.77 0.26)",
  amber10: "color(display-p3 0.959 0.741 0.274)",
  amber11: "color(display-p3 0.64 0.4 0)",
  amber12: "color(display-p3 0.294 0.208 0.145)"
}, NE = {
  amberA1: "color(display-p3 0.757 0.514 0.024 / 0.016)",
  amberA2: "color(display-p3 0.902 0.804 0.008 / 0.079)",
  amberA3: "color(display-p3 0.965 0.859 0.004 / 0.22)",
  amberA4: "color(display-p3 0.969 0.82 0.004 / 0.35)",
  amberA5: "color(display-p3 0.933 0.796 0.004 / 0.475)",
  amberA6: "color(display-p3 0.875 0.682 0.004 / 0.495)",
  amberA7: "color(display-p3 0.804 0.573 0 / 0.557)",
  amberA8: "color(display-p3 0.788 0.502 0 / 0.699)",
  amberA9: "color(display-p3 1 0.686 0 / 0.742)",
  amberA10: "color(display-p3 0.945 0.643 0 / 0.726)",
  amberA11: "color(display-p3 0.64 0.4 0)",
  amberA12: "color(display-p3 0.294 0.208 0.145)"
}, GE = {
  orange1: "#fefcfb",
  orange2: "#fff7ed",
  orange3: "#ffefd6",
  orange4: "#ffdfb5",
  orange5: "#ffd19a",
  orange6: "#ffc182",
  orange7: "#f5ae73",
  orange8: "#ec9455",
  orange9: "#f76b15",
  orange10: "#ef5f00",
  orange11: "#cc4e00",
  orange12: "#582d1d"
}, qE = {
  orangeA1: "#c0400004",
  orangeA2: "#ff8e0012",
  orangeA3: "#ff9c0029",
  orangeA4: "#ff91014a",
  orangeA5: "#ff8b0065",
  orangeA6: "#ff81007d",
  orangeA7: "#ed6c008c",
  orangeA8: "#e35f00aa",
  orangeA9: "#f65e00ea",
  orangeA10: "#ef5f00",
  orangeA11: "#cc4e00",
  orangeA12: "#431200e2"
}, $E = {
  orange1: "color(display-p3 0.995 0.988 0.985)",
  orange2: "color(display-p3 0.994 0.968 0.934)",
  orange3: "color(display-p3 0.989 0.938 0.85)",
  orange4: "color(display-p3 1 0.874 0.687)",
  orange5: "color(display-p3 1 0.821 0.583)",
  orange6: "color(display-p3 0.975 0.767 0.545)",
  orange7: "color(display-p3 0.919 0.693 0.486)",
  orange8: "color(display-p3 0.877 0.597 0.379)",
  orange9: "color(display-p3 0.9 0.45 0.2)",
  orange10: "color(display-p3 0.87 0.409 0.164)",
  orange11: "color(display-p3 0.76 0.34 0)",
  orange12: "color(display-p3 0.323 0.185 0.127)"
}, zE = {
  orangeA1: "color(display-p3 0.757 0.267 0.024 / 0.016)",
  orangeA2: "color(display-p3 0.886 0.533 0.008 / 0.067)",
  orangeA3: "color(display-p3 0.922 0.584 0.008 / 0.15)",
  orangeA4: "color(display-p3 1 0.604 0.004 / 0.314)",
  orangeA5: "color(display-p3 1 0.569 0.004 / 0.416)",
  orangeA6: "color(display-p3 0.949 0.494 0.004 / 0.455)",
  orangeA7: "color(display-p3 0.839 0.408 0 / 0.514)",
  orangeA8: "color(display-p3 0.804 0.349 0 / 0.62)",
  orangeA9: "color(display-p3 0.878 0.314 0 / 0.8)",
  orangeA10: "color(display-p3 0.843 0.29 0 / 0.836)",
  orangeA11: "color(display-p3 0.76 0.34 0)",
  orangeA12: "color(display-p3 0.323 0.185 0.127)"
}, jE = {
  blackA1: "rgba(0, 0, 0, 0.05)",
  blackA2: "rgba(0, 0, 0, 0.1)",
  blackA3: "rgba(0, 0, 0, 0.15)",
  blackA4: "rgba(0, 0, 0, 0.2)",
  blackA5: "rgba(0, 0, 0, 0.3)",
  blackA6: "rgba(0, 0, 0, 0.4)",
  blackA7: "rgba(0, 0, 0, 0.5)",
  blackA8: "rgba(0, 0, 0, 0.6)",
  blackA9: "rgba(0, 0, 0, 0.7)",
  blackA10: "rgba(0, 0, 0, 0.8)",
  blackA11: "rgba(0, 0, 0, 0.9)",
  blackA12: "rgba(0, 0, 0, 0.95)"
}, HE = {
  blackA1: "color(display-p3 0 0 0 / 0.05)",
  blackA2: "color(display-p3 0 0 0 / 0.1)",
  blackA3: "color(display-p3 0 0 0 / 0.15)",
  blackA4: "color(display-p3 0 0 0 / 0.2)",
  blackA5: "color(display-p3 0 0 0 / 0.3)",
  blackA6: "color(display-p3 0 0 0 / 0.4)",
  blackA7: "color(display-p3 0 0 0 / 0.5)",
  blackA8: "color(display-p3 0 0 0 / 0.6)",
  blackA9: "color(display-p3 0 0 0 / 0.7)",
  blackA10: "color(display-p3 0 0 0 / 0.8)",
  blackA11: "color(display-p3 0 0 0 / 0.9)",
  blackA12: "color(display-p3 0 0 0 / 0.95)"
}, UE = {
  whiteA1: "rgba(255, 255, 255, 0.05)",
  whiteA2: "rgba(255, 255, 255, 0.1)",
  whiteA3: "rgba(255, 255, 255, 0.15)",
  whiteA4: "rgba(255, 255, 255, 0.2)",
  whiteA5: "rgba(255, 255, 255, 0.3)",
  whiteA6: "rgba(255, 255, 255, 0.4)",
  whiteA7: "rgba(255, 255, 255, 0.5)",
  whiteA8: "rgba(255, 255, 255, 0.6)",
  whiteA9: "rgba(255, 255, 255, 0.7)",
  whiteA10: "rgba(255, 255, 255, 0.8)",
  whiteA11: "rgba(255, 255, 255, 0.9)",
  whiteA12: "rgba(255, 255, 255, 0.95)"
}, VE = {
  whiteA1: "color(display-p3 1 1 1 / 0.05)",
  whiteA2: "color(display-p3 1 1 1 / 0.1)",
  whiteA3: "color(display-p3 1 1 1 / 0.15)",
  whiteA4: "color(display-p3 1 1 1 / 0.2)",
  whiteA5: "color(display-p3 1 1 1 / 0.3)",
  whiteA6: "color(display-p3 1 1 1 / 0.4)",
  whiteA7: "color(display-p3 1 1 1 / 0.5)",
  whiteA8: "color(display-p3 1 1 1 / 0.6)",
  whiteA9: "color(display-p3 1 1 1 / 0.7)",
  whiteA10: "color(display-p3 1 1 1 / 0.8)",
  whiteA11: "color(display-p3 1 1 1 / 0.9)",
  whiteA12: "color(display-p3 1 1 1 / 0.95)"
}, Zs = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  amber: PE,
  amberA: IE,
  amberDark: Ax,
  amberDarkA: vx,
  amberDarkP3: wx,
  amberDarkP3A: xx,
  amberP3: BE,
  amberP3A: NE,
  blackA: jE,
  blackP3A: HE,
  blue: B_,
  blueA: N_,
  blueDark: ww,
  blueDarkA: xw,
  blueDarkP3: _w,
  blueDarkP3A: Ew,
  blueP3: G_,
  blueP3A: q_,
  bronze: fE,
  bronzeA: dE,
  bronzeDark: Yw,
  bronzeDarkA: Kw,
  bronzeDarkP3: Zw,
  bronzeDarkP3A: Qw,
  bronzeP3: pE,
  bronzeP3A: hE,
  brown: sE,
  brownA: lE,
  brownDark: Uw,
  brownDarkA: Vw,
  brownDarkP3: Ww,
  brownDarkP3A: Xw,
  brownP3: cE,
  brownP3A: uE,
  crimson: c_,
  crimsonA: u_,
  crimsonDark: Wv,
  crimsonDarkA: Xv,
  crimsonDarkP3: Yv,
  crimsonDarkP3A: Kv,
  crimsonP3: f_,
  crimsonP3A: d_,
  cyan: $_,
  cyanA: z_,
  cyanDark: Sw,
  cyanDarkA: kw,
  cyanDarkP3: Tw,
  cyanDarkP3A: Dw,
  cyanP3: j_,
  cyanP3A: H_,
  gold: mE,
  goldA: yE,
  goldDark: Jw,
  goldDarkA: ex,
  goldDarkP3: tx,
  goldDarkP3A: rx,
  goldP3: bE,
  goldP3A: gE,
  grass: nE,
  grassA: oE,
  grassDark: $w,
  grassDarkA: zw,
  grassDarkP3: jw,
  grassDarkP3A: Hw,
  grassP3: aE,
  grassP3A: iE,
  gray: Tx,
  grayA: Dx,
  grayDark: fv,
  grayDarkA: dv,
  grayDarkP3: pv,
  grayDarkP3A: hv,
  grayP3: Mx,
  grayP3A: Cx,
  green: J_,
  greenA: eE,
  greenDark: Bw,
  greenDarkA: Nw,
  greenDarkP3: Gw,
  greenDarkP3A: qw,
  greenP3: tE,
  greenP3A: rE,
  indigo: R_,
  indigoA: O_,
  indigoDark: bw,
  indigoDarkA: gw,
  indigoDarkP3: Aw,
  indigoDarkP3A: vw,
  indigoP3: P_,
  indigoP3A: I_,
  iris: M_,
  irisA: C_,
  irisDark: pw,
  irisDarkA: hw,
  irisDarkP3: mw,
  irisDarkP3A: yw,
  irisP3: L_,
  irisP3A: F_,
  jade: Y_,
  jadeA: K_,
  jadeDark: Rw,
  jadeDarkA: Ow,
  jadeDarkP3: Pw,
  jadeDarkP3A: Iw,
  jadeP3: Z_,
  jadeP3A: Q_,
  lime: TE,
  limeA: DE,
  limeDark: fx,
  limeDarkA: dx,
  limeDarkP3: px,
  limeDarkP3A: hx,
  limeP3: ME,
  limeP3A: CE,
  mauve: Lx,
  mauveA: Fx,
  mauveDark: mv,
  mauveDarkA: yv,
  mauveDarkP3: bv,
  mauveDarkP3A: gv,
  mauveP3: Rx,
  mauveP3A: Ox,
  mint: _E,
  mintA: EE,
  mintDark: sx,
  mintDarkA: lx,
  mintDarkP3: cx,
  mintDarkP3A: ux,
  mintP3: SE,
  mintP3A: kE,
  olive: jx,
  oliveA: Hx,
  oliveDark: Tv,
  oliveDarkA: Dv,
  oliveDarkP3: Mv,
  oliveDarkP3A: Cv,
  oliveP3: Ux,
  oliveP3A: Vx,
  orange: GE,
  orangeA: qE,
  orangeDark: _x,
  orangeDarkA: Ex,
  orangeDarkP3: Sx,
  orangeDarkP3A: kx,
  orangeP3: $E,
  orangeP3A: zE,
  pink: p_,
  pinkA: h_,
  pinkDark: Zv,
  pinkDarkA: Qv,
  pinkDarkP3: Jv,
  pinkDarkP3A: ew,
  pinkP3: m_,
  pinkP3A: y_,
  plum: b_,
  plumA: g_,
  plumDark: tw,
  plumDarkA: rw,
  plumDarkP3: nw,
  plumDarkP3A: ow,
  plumP3: A_,
  plumP3A: v_,
  purple: w_,
  purpleA: x_,
  purpleDark: aw,
  purpleDarkA: iw,
  purpleDarkP3: sw,
  purpleDarkP3A: lw,
  purpleP3: __,
  purpleP3A: E_,
  red: t_,
  redA: r_,
  redDark: Gv,
  redDarkA: qv,
  redDarkP3: $v,
  redDarkP3A: zv,
  redP3: n_,
  redP3A: o_,
  ruby: a_,
  rubyA: i_,
  rubyDark: jv,
  rubyDarkA: Hv,
  rubyDarkP3: Uv,
  rubyDarkP3A: Vv,
  rubyP3: s_,
  rubyP3A: l_,
  sage: Gx,
  sageA: qx,
  sageDark: _v,
  sageDarkA: Ev,
  sageDarkP3: Sv,
  sageDarkP3A: kv,
  sageP3: $x,
  sageP3A: zx,
  sand: Wx,
  sandA: Xx,
  sandDark: Lv,
  sandDarkA: Fv,
  sandDarkP3: Rv,
  sandDarkP3A: Ov,
  sandP3: Yx,
  sandP3A: Kx,
  sky: AE,
  skyA: vE,
  skyDark: nx,
  skyDarkA: ox,
  skyDarkP3: ax,
  skyDarkP3A: ix,
  skyP3: wE,
  skyP3A: xE,
  slate: Px,
  slateA: Ix,
  slateDark: Av,
  slateDarkA: vv,
  slateDarkP3: wv,
  slateDarkP3A: xv,
  slateP3: Bx,
  slateP3A: Nx,
  teal: U_,
  tealA: V_,
  tealDark: Mw,
  tealDarkA: Cw,
  tealDarkP3: Lw,
  tealDarkP3A: Fw,
  tealP3: W_,
  tealP3A: X_,
  tomato: Zx,
  tomatoA: Qx,
  tomatoDark: Pv,
  tomatoDarkA: Iv,
  tomatoDarkP3: Bv,
  tomatoDarkP3A: Nv,
  tomatoP3: Jx,
  tomatoP3A: e_,
  violet: S_,
  violetA: k_,
  violetDark: cw,
  violetDarkA: uw,
  violetDarkP3: fw,
  violetDarkP3A: dw,
  violetP3: T_,
  violetP3A: D_,
  whiteA: UE,
  whiteP3A: VE,
  yellow: LE,
  yellowA: FE,
  yellowDark: mx,
  yellowDarkA: yx,
  yellowDarkP3: bx,
  yellowDarkP3A: gx,
  yellowP3: RE,
  yellowP3A: OE
}, Symbol.toStringTag, { value: "Module" }));
var Ri = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Za(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var WE = 4, XE = 1e-3, YE = 1e-7, KE = 10, Ti = 11, is = 1 / (Ti - 1), ZE = typeof Float32Array == "function";
function U3(e, t) {
  return 1 - 3 * t + 3 * e;
}
function V3(e, t) {
  return 3 * t - 6 * e;
}
function W3(e) {
  return 3 * e;
}
function Rs(e, t, r) {
  return ((U3(t, r) * e + V3(t, r)) * e + W3(t)) * e;
}
function X3(e, t, r) {
  return 3 * U3(t, r) * e * e + 2 * V3(t, r) * e + W3(t);
}
function QE(e, t, r, n, o) {
  var a, i, s = 0;
  do
    i = t + (r - t) / 2, a = Rs(i, n, o) - e, a > 0 ? r = i : t = i;
  while (Math.abs(a) > YE && ++s < KE);
  return i;
}
function JE(e, t, r, n) {
  for (var o = 0; o < WE; ++o) {
    var a = X3(t, r, n);
    if (a === 0)
      return t;
    var i = Rs(t, r, n) - e;
    t -= i / a;
  }
  return t;
}
function eS(e) {
  return e;
}
var tS = function(t, r, n, o) {
  if (!(0 <= t && t <= 1 && 0 <= n && n <= 1))
    throw new Error("bezier x values must be in [0, 1] range");
  if (t === r && n === o)
    return eS;
  for (var a = ZE ? new Float32Array(Ti) : new Array(Ti), i = 0; i < Ti; ++i)
    a[i] = Rs(i * is, t, n);
  function s(l) {
    for (var c = 0, u = 1, f = Ti - 1; u !== f && a[u] <= l; ++u)
      c += is;
    --u;
    var p = (l - a[u]) / (a[u + 1] - a[u]), h = c + p * is, m = X3(h, t, n);
    return m >= XE ? JE(l, h, t, n) : m === 0 ? h : QE(l, c, c + is, t, n);
  }
  return function(c) {
    return c === 0 ? 0 : c === 1 ? 1 : Rs(s(c), r, o);
  };
};
const rS = /* @__PURE__ */ Za(tS), nS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], Qs = [
  "gray",
  "mauve",
  "slate",
  "sage",
  "olive",
  "sand"
], Y3 = [
  ...Qs,
  "tomato",
  "red",
  "ruby",
  "crimson",
  "pink",
  "plum",
  "purple",
  "violet",
  "iris",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "jade",
  "green",
  "grass",
  "brown",
  "orange",
  "sky",
  "mint",
  "lime",
  "yellow",
  "amber"
], K3 = Object.fromEntries(Y3.map((e) => [
  e,
  Object.values(Zs[`${e}P3`]).map((t) => new Et(t).to("oklch"))
])), Z3 = Object.fromEntries(Y3.map((e) => [
  e,
  Object.values(Zs[`${e}DarkP3`]).map((t) => new Et(t).to("oklch"))
])), oS = Object.fromEntries(Qs.map((e) => [
  e,
  Object.values(Zs[`${e}P3`]).map((t) => new Et(t).to("oklch"))
])), aS = Object.fromEntries(Qs.map((e) => [
  e,
  Object.values(Zs[`${e}DarkP3`]).map((t) => new Et(t).to("oklch"))
])), iS = ({ appearance: e, ...t }) => {
  const r = e === "light" ? K3 : Z3, n = e === "light" ? oS : aS, o = new Et(t.background).to("oklch"), a = new Et(t.gray).to("oklch"), i = J3(a, n, o), s = o.to("srgb").toString({ format: "hex", collapse: !1 }), l = new Et(t.accent).to("oklch"), c = Q3(l, r, o, s, i), u = c.scale, f = c.scaleWideGamut, p = c.scaleAlpha, h = c.scaleAlphaWideGamut, m = c.contrast, w = i.map((O) => O.to("srgb").toString({ format: "hex" })), A = i.map(th), T = w.map((O) => ps(O, s)), B = w.map((O) => hs(O, s)), N = e === "light" ? ps(u[1], s, 0.8) : ps(u[1], s, 0.5), Q = e === "light" ? hs(f[1], s, 0.8) : hs(f[1], s, 0.5);
  return {
    accentScale: u,
    accentScaleAlpha: p,
    accentScaleWideGamut: f,
    accentScaleAlphaWideGamut: h,
    accentContrast: m,
    grayScale: w,
    grayScaleAlpha: T,
    grayScaleWideGamut: A,
    grayScaleAlphaWideGamut: B,
    graySurface: e === "light" ? "#ffffffcc" : "rgba(0, 0, 0, 0.05)",
    graySurfaceWideGamut: e === "light" ? "color(display-p3 1 1 1 / 80%)" : "color(display-p3 0 0 0 / 5%)",
    accentSurface: N,
    accentSurfaceWideGamut: Q,
    background: s
  };
};
function Q3(e, t, r, n, o) {
  let a = J3(e, t, r);
  const i = e.to("srgb").toString({ format: "hex" });
  (i === "#000" || i === "#fff") && o && (a = o.map((m) => m.clone()));
  const [s, l] = lS(a, e);
  a[8] = s, a[9] = cS(s, [a]), a[10].coords[1] = Math.min(Math.max(a[8].coords[1], a[7].coords[1]), a[10].coords[1]), a[11].coords[1] = Math.min(Math.max(a[8].coords[1], a[7].coords[1]), a[11].coords[1]);
  const c = a.map((m) => m.to("srgb").toString({ format: "hex" })), u = a.map(th), f = c.map((m) => ps(m, n)), p = c.map((m) => hs(m, n)), h = l.to("srgb").toString({ format: "hex" });
  return { scale: c, scaleAlpha: f, scaleWideGamut: u, scaleAlphaWideGamut: p, contrast: h };
}
const sS = ({ appearance: e, background: t, seed: r }) => {
  const n = e === "light" ? K3 : Z3, o = new Et(t).to("oklch"), a = o.to("srgb").toString({ format: "hex" }), i = new Et(r).to("oklch");
  return Q3(i, n, o, a);
};
function lS(e, t) {
  const r = e[0];
  return t.deltaEOK(r) * 100 < 25 ? [e[8], Dp(e[8])] : [t, Dp(t)];
}
function cS(e, t) {
  const [r, n, o] = e.coords, a = r > 0.4 ? r - 0.03 / (r + 0.1) : r + 0.03 / (r + 0.1), i = r > 0.4 && !isNaN(o) ? n * 0.93 + 0 : n, s = new Et("oklch", [a, i, o]);
  let l = s, c = 1 / 0;
  return t.forEach((u) => {
    for (const f of u) {
      const p = s.deltaEOK(f);
      p < c && (c = p, l = f);
    }
  }), s.coords[1] = l.coords[1], s.coords[2] = l.coords[2], s;
}
function J3(e, t, r) {
  const n = [];
  Object.entries(t).forEach(([F, z]) => {
    for (const we of z) {
      const Oe = e.deltaEOK(we);
      n.push({ scale: F, distance: Oe, color: we });
    }
  }), n.sort((F, z) => F.distance - z.distance);
  const o = n.filter((F, z, we) => z === we.findIndex((Oe) => Oe.scale === F.scale)), a = Qs;
  if (!o.every((F) => a.includes(F.scale)) && a.includes(o[0].scale))
    for (; a.includes(o[1].scale); )
      o.splice(1, 1);
  const s = o[0], l = o[1], c = l.distance, u = s.distance, f = s.color.deltaEOK(l.color), p = (u ** 2 + f ** 2 - c ** 2) / (2 * u * f), h = Math.acos(p), m = Math.sin(h), w = (c ** 2 + f ** 2 - u ** 2) / (2 * c * f), A = Math.acos(w), T = Math.sin(A), B = p / m, N = w / T, Q = Math.max(0, B / N) * 0.5, O = t[s.scale], M = t[l.scale], X = nS.map((F) => new Et(Et.mix(O[F], M[F], Q)).to("oklch")), G = X.slice().sort((F, z) => e.deltaEOK(F) - e.deltaEOK(z))[0], oe = e.coords[1] / G.coords[1];
  if (X.forEach((F) => {
    F.coords[1] = Math.min(e.coords[1] * 1.5, F.coords[1] * oe), F.coords[2] = e.coords[2];
  }), X[0].coords[0] > 0.5) {
    const F = X.map(({ coords: Oe }) => Oe[0]), z = Math.max(0, Math.min(1, r.coords[0])), we = Mp(
      z,
      // Add white as the first "step" of the light scale
      [1, ...F],
      dS
    );
    return we.shift(), we.forEach((Oe, ot) => {
      X[ot].coords[0] = Oe;
    }), X;
  }
  const ue = [...fS], K = X[0].coords[0], be = Math.max(0, Math.min(1, r.coords[0])) / K;
  if (be > 1)
    for (let z = 0; z < ue.length; z++) {
      const we = (be - 1) * 3;
      ue[z] = be > 1.5 ? 0 : Math.max(0, ue[z] * (1 - we));
    }
  const Ce = X.map(({ coords: F }) => F[0]), We = r.coords[0];
  return Mp(We, Ce, ue).forEach((F, z) => {
    X[z].coords[0] = F;
  }), X;
}
function Dp(e) {
  const t = new Et("oklch", [1, 0, 0]);
  if (Math.abs(t.contrastAPCA(e)) < 40) {
    const [, r, n] = e.coords;
    return new Et("oklch", [0.25, Math.max(0.08 * r, 0.04), n]);
  }
  return t;
}
function eh(e, t, r, n, o) {
  const [a, i, s] = e.map((ue) => Math.round(ue * r)), [l, c, u] = t.map((ue) => Math.round(ue * r));
  if (a === void 0 || i === void 0 || s === void 0 || l === void 0 || c === void 0 || u === void 0)
    throw Error("Color is undefined");
  let f = 0;
  (a > l || i > c || s > u) && (f = r);
  const p = (a - l) / (f - l), h = (i - c) / (f - c), m = (s - u) / (f - u), w = [p, h, m].every((ue) => ue === p);
  if (!o && w) {
    const ue = f / r;
    return [ue, ue, ue, p];
  }
  const A = (ue) => isNaN(ue) ? 0 : Math.min(r, Math.max(0, ue)), T = (ue) => isNaN(ue) ? 0 : Math.min(n, Math.max(0, ue)), B = o ?? Math.max(p, h, m), N = T(Math.ceil(B * n)) / n;
  let Q = A((l * (1 - N) - a) / N * -1), O = A((c * (1 - N) - i) / N * -1), M = A((u * (1 - N) - s) / N * -1);
  Q = Math.ceil(Q), O = Math.ceil(O), M = Math.ceil(M);
  const X = Lc(Q, N, l), G = Lc(O, N, c), oe = Lc(M, N, u);
  return f === 0 && (a <= l && a !== X && (Q = a > X ? Q + 1 : Q - 1), i <= c && i !== G && (O = i > G ? O + 1 : O - 1), s <= u && s !== oe && (M = s > oe ? M + 1 : M - 1)), f === r && (a >= l && a !== X && (Q = a > X ? Q + 1 : Q - 1), i >= c && i !== G && (O = i > G ? O + 1 : O - 1), s >= u && s !== oe && (M = s > oe ? M + 1 : M - 1)), Q = Q / r, O = O / r, M = M / r, [Q, O, M, N];
}
function Lc(e, t, r, n = !0) {
  return n ? Math.round(r * (1 - t)) + Math.round(e * t) : r * (1 - t) + e * t;
}
function ps(e, t, r) {
  const [n, o, a, i] = eh(new Et(e).to("srgb").coords, new Et(t).to("srgb").coords, 255, 255, r);
  return uS(new Et("srgb", [n, o, a], i).toString({ format: "hex" }));
}
function hs(e, t, r) {
  const [n, o, a, i] = eh(
    new Et(e).to("p3").coords,
    new Et(t).to("p3").coords,
    // Not sure why, but the resulting P3 alpha colors are blended in the browser most precisely when
    // rounded to 255 integers too. Is the browser using 0-255 rather than 0-1 under the hood for P3 too?
    255,
    1e3,
    r
  );
  return new Et("p3", [n, o, a], i).toString({ precision: 4 }).replace("color(p3 ", "color(display-p3 ");
}
function uS(e) {
  if (!e.startsWith("#"))
    return e;
  if (e.length === 4) {
    const t = e.charAt(0), r = e.charAt(1), n = e.charAt(2), o = e.charAt(3);
    return t + r + r + n + n + o + o;
  }
  if (e.length === 5) {
    const t = e.charAt(0), r = e.charAt(1), n = e.charAt(2), o = e.charAt(3), a = e.charAt(4);
    return t + r + r + n + n + o + o + a + a;
  }
  return e;
}
const fS = [1, 0, 1, 0], dS = [0, 2, 0, 2];
function Mp(e, t, r) {
  return t.map((n, o, a) => {
    const i = a.length - 1, s = a[0] - e, l = rS(...r);
    return n - s * l(1 - o / i);
  });
}
function th(e) {
  const t = +(e.coords[0] * 100).toFixed(1);
  return e.to("oklch").toString({ precision: 4 }).replace(/(\S+)(.+)/, `oklch(${t}%$2`);
}
const Nu = {
  red: "#e5484d",
  orange: "#f76b15",
  yellow: "#ffc53d",
  // amber
  green: "#46a758",
  // grass
  cyan: "#00a2c7",
  blue: "#3e63dd",
  purple: "#8e4ec6"
}, pS = 0.3, Cp = 24, hS = 0.5, mS = 0.5;
function rh(e, t) {
  if (Number.isNaN(e) || Number.isNaN(t))
    return e;
  const r = (t - e + 540) % 360 - 180;
  return (bS(e + r * pS, e - Cp, e + Cp) % 360 + 360) % 360;
}
function yS(e, t) {
  const r = new Et(e).to("oklch"), n = new Et(t).to("oklch"), [o, a, i] = r.coords, s = n.coords[1], l = n.coords[2];
  if (Number.isNaN(i) || Number.isNaN(l))
    return e;
  const c = Math.max(a + (s - a) * hS, a * mS);
  return new Et("oklch", [o, c, rh(i, l)]).to("srgb").toString({ format: "hex" });
}
function bS(e, t, r) {
  return Math.max(t, Math.min(r, e));
}
const Po = 10;
function gS(e, t) {
  const r = new Et(e).to("oklch").coords[2], [n, o, a] = new Et(t).to("oklch").coords, i = rh(r, a);
  return new Et("oklch", [n, o, Number.isNaN(i) ? r : i]).to("srgb").toString({ format: "hex" });
}
function AS(e) {
  return Object.fromEntries(Object.entries(Nu).map(([t, r]) => [
    t,
    gS(r, e)
  ]));
}
function ss(e, t) {
  return new Et(Et.mix(e, t, 0.15, { space: "oklch" })).to("srgb").toString({ format: "hex" });
}
function vS({ background: e, accent: t }) {
  const r = AS(t);
  return {
    colorError: r.red,
    colorErrorSoft: ss(e, r.red),
    colorWarning: r.yellow,
    colorWarningSoft: ss(e, r.yellow),
    colorSuccess: r.green,
    colorSuccessSoft: ss(e, r.green),
    colorRec: r.red,
    // identical to error / alert
    colorInfo: r.blue,
    colorInfoSoft: ss(e, r.blue),
    colorAffirmative: r.green
  };
}
function wS(e) {
  return Object.fromEntries(Object.entries(Nu).map(([t, r]) => [
    t,
    yS(r, e)
  ]));
}
function xS(e, t, r) {
  return Object.fromEntries(Object.entries(e).map(([n, o]) => [
    n,
    sS({ appearance: t, background: r, seed: o })
  ]));
}
function _a(e) {
  const t = e.replace("#", "");
  return "#" + (t.length === 3 || t.length === 4 ? t.split("").map((n) => n + n).join("") : t);
}
const Hn = (e) => _a(e).slice(1);
function _S({ appearance: e, background: t, accent: r, foreground: n, comment: o, cursor: a, selection: i }) {
  const s = xS(wS(r), e, t), l = Hn(s.red.scale[Po]), c = Hn(s.orange.scale[Po]), u = Hn(s.yellow.scale[Po]), f = Hn(s.green.scale[Po]), p = Hn(s.cyan.scale[Po]), h = Hn(s.blue.scale[Po]), m = Hn(s.purple.scale[Po]), w = Hn(n), A = Hn(o);
  return {
    base: e === "dark" ? "vs-dark" : "vs",
    inherit: !1,
    // base16 token conventions mapped onto the palette hues.
    rules: [
      { token: "", foreground: w },
      { token: "comment", foreground: A, fontStyle: "italic" },
      { token: "keyword", foreground: m },
      { token: "storage", foreground: m },
      { token: "string", foreground: f },
      { token: "string.escape", foreground: p },
      { token: "regexp", foreground: p },
      { token: "number", foreground: c },
      { token: "constant", foreground: c },
      { token: "constant.language", foreground: c },
      { token: "type", foreground: u },
      { token: "type.identifier", foreground: u },
      { token: "attribute.name", foreground: u },
      { token: "function", foreground: h },
      { token: "variable", foreground: l },
      { token: "variable.predefined", foreground: l },
      { token: "tag", foreground: l },
      { token: "delimiter", foreground: w },
      { token: "operator", foreground: w },
      { token: "invalid", foreground: l }
    ],
    colors: {
      "editor.background": _a(t),
      "editor.foreground": _a(n),
      "editorCursor.foreground": _a(a),
      "editor.selectionBackground": _a(i),
      "editorLineNumber.foreground": _a(o),
      "editor.lineHighlightBackground": "#00000000"
    }
  };
}
function ES({ colorMode: e, accentColor: t, grayColor: r, backgroundColor: n }) {
  const o = iS({
    appearance: e,
    background: n,
    accent: t,
    gray: r
  }), a = vS({
    background: n,
    accent: t
  }), i = e === "dark", s = {
    // Accent
    colorAccent: o.accentScale[8],
    colorOnAccent: o.accentContrast,
    colorAccentHover: o.accentScale[10],
    colorAccentSoft: o.accentScale[4],
    colorAccentSoftHover: o.accentScale[5],
    // Background
    colorBackground: o.background,
    colorText: o.grayScale[11],
    colorTextMute: o.grayScale[10],
    colorTextSubtle: o.grayScale[9],
    // Surface
    colorSurface: `color-mix(in srgb, transparent, ${o.grayScale[0]} 80%)`,
    colorBorder: o.grayScaleAlpha[3],
    colorBorderSubtle: o.grayScaleAlpha[2],
    colorShadow: i ? "#000000aa" : `color-mix(in srgb, transparent, ${o.grayScale[11]} 20%)`,
    // Input
    colorInput: o.grayScale[2],
    colorInputHover: o.grayScale[3],
    // Neutral: an achromatic filled-button tone. More present than the
    // input/checkbox-off background (grayScale[2]) so it reads as a real
    // button, but without borrowing the accent color.
    colorNeutral: o.grayScale[4],
    colorNeutralHover: o.grayScale[5],
    // Selection
    colorSelection: o.accentScale[10],
    colorOnSelection: o.background,
    // Semantic Colors (curated palette → see theme/palette.ts)
    ...a,
    fontCode: "'Geist Mono', monospace",
    fontHeading: "Geist, sans-serif",
    fontUi: "system-ui, sans-serif",
    fontNumeric: "Geist, system-ui, sans-serif",
    rem: 12,
    radiusInput: 4,
    // Concentric with the content: inner control radius (4) + popup padding
    // (9), so a popup's corners stay parallel to the controls inside it.
    radiusPopup: 13,
    radiusPane: 12,
    popupWidth: 240,
    popupPadding: 9,
    // Shared backdrop blur for popup surfaces (menus, dropdowns, balloons,
    // tooltips) so they read as the same frosted glass.
    popupBlur: 6,
    iconSize: 18,
    inputHeight: 24,
    // Width at which every input renders its full (non-compact) form
    // comfortably — sized for the most demanding ones (InputColor's hex
    // code, InputVec's side-by-side fields). Hosts that size to content
    // (e.g. a modal form) use it as a min width.
    inputComfortableWidth: 224,
    // Gap scale, named by how related the two things being separated are
    // (tightest → loosest): segments of one control, items that read as a
    // unit (icon + label, a parameter's inputs), independent controls, and
    // whole sections.
    gapGroup: 2,
    gapRelated: 6,
    gapControl: 9,
    gapSection: 18,
    panePadding: 12,
    // Gutter kept between a top-layer pane/modal and the viewport edge
    // when its content would otherwise reach (or overflow) the screen.
    paneMargin: 48,
    scrollbarWidth: 6,
    hoverTransitionDuration: "0.15s",
    activeTransitionDuration: "64ms"
  }, l = _S({
    appearance: e,
    background: o.background,
    accent: t,
    foreground: o.grayScale[11],
    comment: o.grayScale[9],
    cursor: o.accentScale[8],
    selection: o.accentScale[4]
  });
  return { theme: s, monacoTheme: l };
}
var nh = { exports: {} };
/*! Case - v1.6.2 - 2020-03-24
* Copyright (c) 2020 Nathan Bubna; Licensed MIT, GPL */
(function(e) {
  (function() {
    var t = function(h, m) {
      return m = m || "", h.replace(/(^|-)/g, "$1\\u" + m).replace(/,/g, "\\u" + m);
    }, r = t("20-26,28-2F,3A-40,5B-60,7B-7E,A0-BF,D7,F7", "00"), n = "a-z" + t("DF-F6,F8-FF", "00"), o = "A-Z" + t("C0-D6,D8-DE", "00"), a = "A|An|And|As|At|But|By|En|For|If|In|Of|On|Or|The|To|Vs?\\.?|Via", i = function(h, m, w, A) {
      return h = h || r, m = m || n, w = w || o, A = A || a, {
        capitalize: new RegExp("(^|[" + h + "])([" + m + "])", "g"),
        pascal: new RegExp("(^|[" + h + "])+([" + m + w + "])", "g"),
        fill: new RegExp("[" + h + "]+(.|$)", "g"),
        sentence: new RegExp('(^\\s*|[\\?\\!\\.]+"?\\s+"?|,\\s+")([' + m + "])", "g"),
        improper: new RegExp("\\b(" + A + ")\\b", "g"),
        relax: new RegExp("([^" + w + "])([" + w + "]*)([" + w + "])(?=[^" + w + "]|$)", "g"),
        upper: new RegExp("^[^" + m + "]+$"),
        hole: /[^\s]\s[^\s]/,
        apostrophe: /'/g,
        room: new RegExp("[" + h + "]")
      };
    }, s = i(), l = {
      re: s,
      unicodes: t,
      regexps: i,
      types: [],
      up: String.prototype.toUpperCase,
      low: String.prototype.toLowerCase,
      cap: function(h) {
        return l.up.call(h.charAt(0)) + h.slice(1);
      },
      decap: function(h) {
        return l.low.call(h.charAt(0)) + h.slice(1);
      },
      deapostrophe: function(h) {
        return h.replace(s.apostrophe, "");
      },
      fill: function(h, m, w) {
        return m != null && (h = h.replace(s.fill, function(A, T) {
          return T ? m + T : "";
        })), w && (h = l.deapostrophe(h)), h;
      },
      prep: function(h, m, w, A) {
        if (h = h == null ? "" : h + "", !A && s.upper.test(h) && (h = l.low.call(h)), !m && !s.hole.test(h)) {
          var T = l.fill(h, " ");
          s.hole.test(T) && (h = T);
        }
        return !w && !s.room.test(h) && (h = h.replace(s.relax, l.relax)), h;
      },
      relax: function(h, m, w, A) {
        return m + " " + (w ? w + " " : "") + A;
      }
    }, c = {
      _: l,
      of: function(h) {
        for (var m = 0, w = l.types.length; m < w; m++)
          if (c[l.types[m]].apply(c, arguments) === h)
            return l.types[m];
      },
      flip: function(h) {
        return h.replace(/\w/g, function(m) {
          return (m == l.up.call(m) ? l.low : l.up).call(m);
        });
      },
      random: function(h) {
        return h.replace(/\w/g, function(m) {
          return (Math.round(Math.random()) ? l.up : l.low).call(m);
        });
      },
      type: function(h, m) {
        c[h] = m, l.types.push(h);
      }
    }, u = {
      lower: function(h, m, w) {
        return l.fill(l.low.call(l.prep(h, m)), m, w);
      },
      snake: function(h) {
        return c.lower(h, "_", !0);
      },
      constant: function(h) {
        return c.upper(h, "_", !0);
      },
      camel: function(h) {
        return l.decap(c.pascal(h));
      },
      kebab: function(h) {
        return c.lower(h, "-", !0);
      },
      upper: function(h, m, w) {
        return l.fill(l.up.call(l.prep(h, m, !1, !0)), m, w);
      },
      capital: function(h, m, w) {
        return l.fill(l.prep(h).replace(s.capitalize, function(A, T, B) {
          return T + l.up.call(B);
        }), m, w);
      },
      header: function(h) {
        return c.capital(h, "-", !0);
      },
      pascal: function(h) {
        return l.fill(l.prep(h, !1, !0).replace(s.pascal, function(m, w, A) {
          return l.up.call(A);
        }), "", !0);
      },
      title: function(h) {
        return c.capital(h).replace(s.improper, function(m, w, A, T) {
          return A > 0 && A < T.lastIndexOf(" ") ? l.low.call(m) : m;
        });
      },
      sentence: function(h, m, w) {
        return h = c.lower(h).replace(s.sentence, function(A, T, B) {
          return T + l.up.call(B);
        }), m && m.forEach(function(A) {
          h = h.replace(new RegExp("\\b" + c.lower(A) + "\\b", "g"), l.cap);
        }), w && w.forEach(function(A) {
          h = h.replace(new RegExp("(\\b" + c.lower(A) + "\\. +)(\\w)"), function(T, B, N) {
            return B + l.low.call(N);
          });
        }), h;
      }
    };
    u.squish = u.pascal, c.default = c;
    for (var f in u)
      c.type(f, u[f]);
    var p = typeof p == "function" ? p : function() {
    };
    p(e.exports ? e.exports = c : this.Case = c);
  }).call(Ri);
})(nh);
var SS = nh.exports;
const za = /* @__PURE__ */ Za(SS);
function Gu(e) {
  if (e.labelizer)
    return e.labelizer;
  const t = e.prefix || "", r = e.suffix || "";
  if (!e.labels)
    return (o) => t + za.capital(String(o)) + r;
  const n = e.labels;
  if (n.length !== e.options.length)
    throw new Error("the length of labels must be the same as the length of options");
  return (o) => {
    const a = e.options.findIndex((i) => Object.is(i, o));
    return t + n[a] + r;
  };
}
var kS = function(e) {
  var t = {};
  function r(n) {
    if (t[n]) return t[n].exports;
    var o = t[n] = { i: n, l: !1, exports: {} };
    return e[n].call(o.exports, o, o.exports, r), o.l = !0, o.exports;
  }
  return r.m = e, r.c = t, r.d = function(n, o, a) {
    r.o(n, o) || Object.defineProperty(n, o, { enumerable: !0, get: a });
  }, r.r = function(n) {
    typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(n, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(n, "__esModule", { value: !0 });
  }, r.t = function(n, o) {
    if (1 & o && (n = r(n)), 8 & o || 4 & o && typeof n == "object" && n && n.__esModule) return n;
    var a = /* @__PURE__ */ Object.create(null);
    if (r.r(a), Object.defineProperty(a, "default", { enumerable: !0, value: n }), 2 & o && typeof n != "string") for (var i in n) r.d(a, i, (function(s) {
      return n[s];
    }).bind(null, i));
    return a;
  }, r.n = function(n) {
    var o = n && n.__esModule ? function() {
      return n.default;
    } : function() {
      return n;
    };
    return r.d(o, "a", o), o;
  }, r.o = function(n, o) {
    return Object.prototype.hasOwnProperty.call(n, o);
  }, r.p = "", r(r.s = 0);
}([function(e, t, r) {
  r.r(t), r.d(t, "validateHTMLColorName", function() {
    return i;
  }), r.d(t, "validateHTMLColorSpecialName", function() {
    return s;
  }), r.d(t, "validateHTMLColorHex", function() {
    return l;
  }), r.d(t, "validateHTMLColorRgb", function() {
    return w;
  }), r.d(t, "validateHTMLColorHsl", function() {
    return A;
  }), r.d(t, "validateHTMLColorHwb", function() {
    return T;
  }), r.d(t, "validateHTMLColorLab", function() {
    return B;
  }), r.d(t, "validateHTMLColorLch", function() {
    return N;
  }), r.d(t, "validateHTMLColor", function() {
    return Q;
  });
  const n = (O) => O && typeof O == "string", o = ["AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "Black", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenrod", "DarkGray", "DarkGrey", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "DarkOrange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "Goldenrod", "Gray", "Grey", "Green", "GreenYellow", "HoneyDew", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenrodYellow", "LightGray", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "Maroon", "MediumAquamarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenrod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "RebeccaPurple", "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen"], a = ["currentColor", "inherit", "transparent"], i = (O) => {
    let M = !1;
    return n(O) && o.map((X) => (O.toLowerCase() === X.toLowerCase() && (M = !0), null)), M;
  }, s = (O) => {
    let M = !1;
    return n(O) && a.map((X) => (O.toLowerCase() === X.toLowerCase() && (M = !0), null)), M;
  }, l = (O) => n(O) ? O && /^#([\da-f]{3}){1,2}$|^#([\da-f]{4}){1,2}$/i.test(O) : !1, c = "(([\\d]{0,5})((\\.([\\d]{1,5}))?))", u = `(${c}%)`, f = "(([0-9]|[1-9][0-9]|100)%)", p = `(${f}|(0?((\\.([\\d]{1,5}))?))|1)`, h = `([\\s]{0,5})\\)?)(([\\s]{0,5})(\\/?)([\\s]{1,5})${`(((${f}))|(0?((\\.([\\d]{1,5}))?))|1))?`}([\\s]{0,5})\\)`, m = "(-?(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-9][0-9]|3[0-5][0-9])((\\.([\\d]{1,5}))?)|360)(deg)?)", w = (O) => {
    if (n(O)) {
      const M = "([\\s]{0,5})([\\d]{1,5})%?([\\s]{0,5}),?", X = "((([\\s]{0,5}),?([\\s]{0,5}))|(([\\s]{1,5})))", G = new RegExp(`^(rgb)a?\\(${`${M}${X}`}${`${M}${X}`}${`${M}${X}`}((\\/?([\\s]{0,5})(0?\\.?([\\d]{1,5})%?([\\s]{0,5}))?|1|0))?\\)$`);
      return O && G.test(O);
    }
    return !1;
  }, A = (O) => {
    if (n(O)) {
      const M = new RegExp(`^(hsl)a?\\((([\\s]{0,5})(${m}|(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-9][0-9]|3[0-9][0-9]|400)grad)|((([0-5])?\\.([\\d]{1,5})|6\\.([0-9]|1[0-9]|2[0-8])|[0-6])rad)|((0?((\\.([\\d]{1,5}))?)|1)turn))((([\\s]{0,5}),([\\s]{0,5}))|(([\\s]{1,5}))))(([\\s]{0,5})(0|${f})((([\\s]{0,5}),([\\s]{0,5}))|(([\\s]{1,5}))))(([\\s]{0,5})(0|${f})([\\s]{0,5})\\)?)(([\\s]{0,5})(\\/?|,?)([\\s]{0,5})(((${f}))|(0?((\\.([\\d]{1,5}))?))|1))?\\)$`);
      return O && M.test(O);
    }
    return !1;
  }, T = (O) => {
    if (n(O)) {
      const M = new RegExp(`^(hwb\\(([\\s]{0,5})${m}([\\s]{1,5}))((0|${f})([\\s]{1,5}))((0|${f})${h}$`);
      return O && M.test(O);
    }
    return !1;
  }, B = (O) => {
    if (n(O)) {
      const M = "(-?(([0-9]|[1-9][0-9]|1[0-5][0-9])((\\.([\\d]{1,5}))?)?|160))", X = new RegExp(`^(lab\\(([\\s]{0,5})${u}([\\s]{1,5})${M}([\\s]{1,5})${M}${h}$`);
      return O && X.test(O);
    }
    return !1;
  }, N = (O) => {
    if (n(O)) {
      const M = "((([0-9]|[1-9][0-9])?((\\.([\\d]{1,5}))?)|100)(%)?)", X = "" + c, G = `((${m})|(0|${p})|(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-9][0-9]|3[0-5][0-9])((\\.([\\d]{1,5}))?)|360))`, oe = `(\\/([\\s]{0,5})${p})`, ue = new RegExp(`^lch\\(${`(([\\s]{0,5})${M}([\\s]{1,5})${X}([\\s]{1,5})${G}([\\s]{0,5})(${oe})?)`}\\)$`);
      return O && ue.test(O);
    }
    return !1;
  }, Q = (O) => !!(O && l(O) || w(O) || A(O) || T(O) || B(O) || N(O));
  t.default = (O) => !!(O && l(O) || i(O) || s(O) || w(O) || A(O) || T(O) || B(O) || N(O));
}]);
const TS = /* @__PURE__ */ Za(kS);
function DS(e, t) {
  return (r) => r < e ? { value: Math.max(r, e), log: [`should be >= ${e}`] } : r > t ? { value: Math.min(r, t), log: [`should be <= ${t}`] } : { value: r, log: [] };
}
function Lp(e) {
  return (t) => {
    if (e === 0)
      return { value: t, log: [] };
    const r = Ut.quantize(t, e);
    return Ut.approx(t, r) ? { value: t, log: [] } : { value: r, log: [`should be a multiple of ${e}`] };
  };
}
const oh = (e) => TS(e) ? { value: e, log: [] } : { value: void 0, log: ["Invalid color code"] }, MS = (e) => ({ value: e, log: [] });
function CS(...e) {
  return (t) => {
    let r = { value: t, log: [] };
    for (const n of e) {
      if (!n || !r.value)
        continue;
      const { value: o, log: a } = r;
      r = n(o), r.log.unshift(...a);
    }
    return r;
  };
}
function LS(e) {
  FS.add(e), RS.forEach((t) => t(e));
}
const FS = /* @__PURE__ */ new Set(), RS = /* @__PURE__ */ new Set(), Fc = /* @__PURE__ */ new WeakMap();
function OS(e, t) {
  return t instanceof Element || t instanceof Window || t instanceof dn ? (Fc.has(t) || Fc.set(t, "__object_" + P6()), Fc.get(t)) : t;
}
function On() {
  return (e, t, r) => {
    if (r.value)
      r.value = su(r.value);
    else if (r.get)
      r.get = su(r.get);
    else
      throw new Error("Memoize can only be applied to methods");
  };
}
function su(e) {
  const t = /* @__PURE__ */ new WeakMap(), r = {};
  return function(...n) {
    const o = mo(this) ? this : r;
    let a = t.get(o);
    a || (a = /* @__PURE__ */ new Map(), t.set(o, a));
    const i = JSON.stringify(n, OS), s = a.get(i);
    if (s === void 0 || s instanceof dn && s.disposed) {
      const l = e.apply(this, n);
      return a.set(i, l), l;
    } else
      return s;
  };
}
function Fp(e, t) {
  if (e !== void 0)
    return t(e);
}
function Rp(...e) {
  return e.find((t) => t !== void 0);
}
function Op(e, t) {
  t != null && t.preventDefault && e.preventDefault(), t != null && t.stopPropagation && e.stopPropagation();
}
var o0 = function(e, t, r, n) {
  var o = arguments.length, a = o < 3 ? t : n === null ? n = Object.getOwnPropertyDescriptor(t, r) : n, i;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") a = Reflect.decorate(e, t, r, n);
  else for (var s = e.length - 1; s >= 0; s--) (i = e[s]) && (a = (o < 3 ? i(a) : o > 3 ? i(t, r, a) : i(t, r)) || a);
  return o > 3 && a && Object.defineProperty(t, r, a), a;
}, Go, Wi, Xi, ka, Mn;
const Ii = class Ii {
  constructor(t = {}) {
    lr(this, Go, /* @__PURE__ */ new Set());
    Oo(this, "icon");
    /**
     * Stores all emitters that are upstream of the current emitter.
     */
    lr(this, Wi);
    /**
     * Stores all deviced events and their listeners. They will not be unregistered by `removeAllListeners`.
     */
    Oo(this, "derivedEmitters", /* @__PURE__ */ new Map());
    Oo(this, "_disposed", !1);
    lr(this, Xi);
    lr(this, ka);
    /**
     * Stores the last emitted value.
     */
    lr(this, Mn);
    tr(this, Wi, new Set([t.sources ?? []].flat())), tr(this, Xi, t.onDispose), tr(this, ka, t.onReset), tr(this, Mn, t.value), this.icon = t.icon, LS(this);
  }
  get disposed() {
    return this._disposed;
  }
  /**
   * @internal
   */
  registerDerived(t, r) {
    this.on(r), this.derivedEmitters.set(t, r);
  }
  /**
   * @internal
   */
  createDerived(t) {
    const r = new Ii({
      ...t,
      sources: this
    }), n = r.emit.bind(r), o = (a) => {
      t.propagate(a, n);
    };
    return this.on(o), this.derivedEmitters.set(r, o), r;
  }
  /**
   * @internal
   */
  removeDerivedEmitter(t) {
    const r = this.derivedEmitters.get(t);
    r && this.off(r), this.derivedEmitters.delete(t);
  }
  /**
   * Disposes the emitter immediately and prevent to emit any value in the future
   * @group Event Handlers
   */
  dispose() {
    var t;
    this.removeAllListeners(), (t = ct(this, Xi)) == null || t.call(this);
    for (const r of ct(this, Wi))
      r.removeDerivedEmitter(this);
    this._disposed = !0;
  }
  /**
   * Returns `true` if the emitter has a state and can be reset.
   * @group Properties
   */
  get stateful() {
    return !!ct(this, ka);
  }
  /**
   * Resets the state of the emitter.
   * @group Event Handlers
   */
  reset() {
    var t;
    (t = ct(this, ka)) == null || t.call(this);
    for (const r of this.derivedEmitters.keys())
      r.reset();
  }
  /**
   * The latest value emitted from the emitter. If the emitter has never fired before, it just returns `undefined`.
   * @group Properties
   */
  get value() {
    return ct(this, Mn);
  }
  /**
   * Adds the `listener` function for the event.
   * @param listener The callback function
   * @group Event Handlers
   */
  on(t) {
    return ct(this, Go).add(t), this;
  }
  /**
   * Removes the `listener` function from the event.
   * @param listener
   * @group Event Handlers
   */
  off(t) {
    ct(this, Go).delete(t);
  }
  /**
   * Manually emits the event.
   * @param value
   * @group Event Handlers
   */
  emit(t) {
    tr(this, Mn, t);
    for (const r of ct(this, Go))
      try {
        const n = r(t);
        n && typeof n.then == "function" && n.then(void 0, (o) => console.error(o));
      } catch (n) {
        console.error(n);
      }
  }
  /**
   * Adds a *one-time* `listener` function for the event
   * @param listener
   * @group Event Handlers
   */
  once(t) {
    const r = (n) => {
      this.off(r), t(n);
    };
    this.on(r);
  }
  /**
   * Removes all listeners.
   * @group Event Handlers
   */
  removeAllListeners() {
    ct(this, Go).forEach((t) => this.off(t));
  }
  /**
   * Transforms the payload of event with the given function.
   * @param fn A function to transform the payload
   * @returns A new emitter
   * @group Common Filters
   */
  map(t, r) {
    return this.createDerived({
      value: Rp(r, Fp(ct(this, Mn), t)),
      propagate: (n, o) => o(t(n))
    });
  }
  /**
   * Filters events with the given predicate function
   * @param fn Return truthy value to pass events
   * @returns A new emitter
   * @group Common Filters
   */
  filter(t) {
    return this.createDerived({
      propagate(r, n) {
        t(r) && n(r);
      }
    });
  }
  /**
   * Maps the current value to another type of value, and emits the mapped value only when the mapped value is not `undefined`.
   * @param fn A function to map the current value. Return `undefined` to skip emitting.
   * @group Common Filters
   */
  filterMap(t, r) {
    return this.createDerived({
      value: Rp(r, Fp(ct(this, Mn), t)),
      propagate(n, o) {
        const a = t(n);
        a !== void 0 && o(a);
      }
    });
  }
  /**
   * Creates an emitter that emits at the moment the current value changes from falsy to truthy.
   * @group Common Filters
   */
  down() {
    const t = this.fold((r, n) => !r && !!n, !1).filter(o1).constant(!0);
    return t.icon = this.icon, t;
  }
  /**
   * Creates an emitter that emits at the moment the current value changes from falsy to truthy.
   * @group Common Filters
   */
  up() {
    const t = this.fold((r, n) => !!r && !n, !0).filter(o1).constant(!0);
    return t.icon = this.icon, t;
  }
  /**
   * Creates an emitter whose payload is negated.
   * @group Common Filters
   */
  not() {
    return this.map((t) => !t, !ct(this, Mn));
  }
  /**
   * Emits only when the value is changed
   * @param equalFn A comparator function. The event will be emitted when the function returns falsy value.
   * @returns
   * @group Common Filters
   */
  change(t = t3) {
    return this.fold((r, n) => {
      if (r === void 0 || !t(r, n))
        return n;
    }, ct(this, Mn));
  }
  /**
   * Emits while the given event is truthy. The event will be also emitted when the given emitter is changed from falsy to truthy when the `resetOnDown` flag is set to true.
   * @param emitter An emitter to filter the events
   * @param resetOnDown If set to `true`, the returned emitter will be reset when the given emitter is down.
   * @returns
   * @group Common Filters
   */
  while(t, r = !0) {
    const n = this.createDerived({
      propagate(o, a) {
        t.value && a(o);
      }
    });
    return r && t.down().on(() => {
      n.reset(), this.value !== void 0 && n.emit(this.value);
    }), n;
  }
  /**
   * Splits the current emitter into multiple emitters. Each emitter emits only when the given emitter is changed to the corresponding index.
   * @param emitter An emitter to filter the current event
   * @param count The number of emitters to be created.
   * @param resetOnSwitch If set to `true`, the corresponding emitter will be reset when the index of current emitter is switched.
   * @returns
   * @group Commom Filters
   */
  split(t, r, n = !0) {
    const o = $i(0, r).map((a) => this.createDerived({
      propagate(i, s) {
        (typeof t.value == "number" ? t.value : t.value ? 1 : 0) === a && s(i);
      }
    }));
    return n && t.map((a) => typeof a == "number" ? a : a ? 1 : 0).change().on((a) => {
      this.value !== void 0 && (o[a].reset(), o[a].emit(this.value));
    }), o;
  }
  /**
   * Creates an emitter that emits a constant value every time the current emitter is emitted.
   * @see {@link https://lodash.com/docs/4.17.15#throttle}
   * @group Common Filters
   */
  constant(t) {
    return this.createDerived({
      value: t,
      propagate(r, n) {
        n(t);
      }
    });
  }
  /**
   * Creates throttled version of the current emitter.
   * @param wait Milliseconds to wait.
   * @param options
   * @see {@link https://lodash.com/docs/4.17.15#debounced}
   * @group Common Filters
   */
  throttle(t, r) {
    const n = R6((o, a) => {
      this._disposed || a(o);
    }, t, r);
    return this.createDerived({
      onDispose() {
        n.cancel();
      },
      propagate: n
    });
  }
  /**
   * Creates debounced version of the current emitter.
   * @param wait Milliseconds to wait.
   * @param options
   * @returns A new emitter
   * @group Common Filters
   */
  debounce(t, r) {
    const n = Tu((o, a) => {
      this._disposed || a(o);
    }, t, r);
    return this.createDerived({
      onDispose() {
        n.cancel();
      },
      propagate: n
    });
  }
  /**
   * Creates delayed version of the current emitter.
   * @param wait Milliseconds to wait.
   * @param options
   * @returns A new emitter
   * @group Common Filters
   */
  delay(t) {
    let r;
    return this.createDerived({
      onDispose() {
        clearTimeout(r);
      },
      propagate(n, o) {
        r = setTimeout(() => o(n), t);
      }
    });
  }
  /**
   * @group Common Filters
   */
  longPress(t) {
    let r;
    return { pressed: this.createDerived({
      onDispose() {
        clearTimeout(r);
      },
      propagate(o, a) {
        o ? r || (r = setTimeout(() => a(o), t)) : (clearTimeout(r), r = void 0);
      }
    }) };
  }
  /**
   * Smoothen the change rate of the input value.
   * @param lerp A function to interpolate the current value and the target value.
   * @param rate The ratio of linear interpolation from the current value to the target value with each update.
   * @param threshold The threshold to determine whether the current value is close enough to the target value. If the difference between the current value and the target value is less than this value, the target value will be used as the current value and the interpolation will be stopped.
   * @returns A new emitter
   * @group Common Filters
   */
  lerp(t, r, n = 1e-4) {
    let o = 1, a, i, s;
    const l = () => {
      a === void 0 || i === void 0 || (o = 1 - (1 - o) * (1 - r), s = t(a, i, o), o < 1 - n ? (c.emit(s), requestAnimationFrame(l)) : (c.emit(i), o = 1, a = i = void 0));
    }, c = this.createDerived({
      onDispose() {
        a = i = void 0;
      },
      onReset: () => {
        s = i, a = i = void 0;
      },
      propagate(u) {
        const f = a !== void 0 && i !== void 0;
        s === void 0 && (s = u), o = 0, a = s, i = u, f || l();
      }
    });
    return c;
  }
  tween(t, r) {
    let n = 0, o, a;
    const i = () => {
      if (o === null || a === null)
        return;
      const c = (Date.now() - n) / r;
      c < 1 ? (s.emit(t(o, a, c)), requestAnimationFrame(i)) : (s.emit(a), o = a = void 0);
    }, s = this.createDerived({
      onDispose() {
        o = a = void 0;
      },
      onReset: () => {
        o = a = void 0;
      },
      propagate(l) {
        const c = o !== void 0 && a !== void 0;
        n = Date.now(), o = s.value ?? l, a = l, c || i();
      }
    });
    return s;
  }
  /**
   * Reset the state of current emitter emitter when the given event is fired.
   * @param emitter The emitter that triggers the current emitter to be reset.
   * @param emitOnReset If set to `true`, the current emitter will be triggered when it is reset.
   * @returns The current emitter emitter
   * @group Common Filters
   */
  resetBy(t, r = !0) {
    const n = this.createDerived({
      propagate: (o, a) => a(o)
    });
    return t.on((o) => {
      o && (n.reset(), r && this.value !== void 0 && n.emit(this.value));
    }), n;
  }
  /**
   * Initializes with an `initialState` value. On each emitted event, calculates a new state based on the previous state and the current value, and emits this new state.
   * @param fn A function to calculate a new state
   * @param initialState An initial state value
   * @returns A new emitter
   * @group Common Filters
   */
  fold(t, r) {
    let n = r;
    return this.createDerived({
      onReset() {
        n = r;
      },
      propagate(o, a) {
        const i = t(n, o);
        i !== void 0 && (a(i), n = i);
      }
    });
  }
  /**
   *  Creates an emitter that emits the current value when one of the given events is fired.
   * @param triggers Emitters to trigger the current emitter to emit.
   * @returns A new emitter
   * @group Common Filters
   */
  stash(...t) {
    const r = new Ii({
      sources: this
    });
    return t.forEach((n) => {
      n.on(() => {
        r.emit(this.value);
      });
    }), r;
  }
  /**
   * Creates an emitter that emits the ‘difference’ between the current value and the previous value.
   * @param fn A function to calculate the difference
   * @returns A new emitter
   * @group Common Filters
   */
  delta(t) {
    let r;
    return this.createDerived({
      onReset() {
        r = void 0;
      },
      propagate(n, o) {
        r !== void 0 && o(t(r, n)), r = n;
      }
    });
  }
  /**
   * Creates an emitter that keeps to emit the last value of the current emitter at the specified interval.
   * @param ms The interval in milliseconds. Set `0` to use `requestAnimationFrame`.
   * @param immediate If set to `false`, the new emitter waits to emit until the current emitter emits any value.
   * @returns A new emitter.
   * @group Common Filters
   */
  interval(t = 0, r = !1) {
    const n = new Ii({
      sources: this
    }), o = () => {
      this._disposed || (n.emit(this.value), t <= 0 ? requestAnimationFrame(o) : setTimeout(o, t));
    };
    return r || this.value !== void 0 ? o() : this.once(o), n;
  }
  /**
   * Emits an array caching a specified number of values that were emitted in the past.
   * @param count The number of cache frames. Set `0` to store caches infinitely.
   * @param emitAtCount When set to `true`, events will not be emitted until the count of cache reaches to `count`.
   * @returns
   * @group Common Filters
   */
  trail(t = 2, r = !0) {
    let n = this.fold((o, a) => {
      const i = [a, ...o];
      return t === 0 ? i : i.slice(0, t);
    }, []);
    return r && (n = n.filter((o) => o.length === t)), n;
  }
  /**
   * @group Event Handlers
   */
  log(t = "Bndr") {
    return this.on((r) => {
      console.log(`[${t}]`, "Value=", r);
    }), this;
  }
};
Go = new WeakMap(), Wi = new WeakMap(), Xi = new WeakMap(), ka = new WeakMap(), Mn = new WeakMap();
let dn = Ii;
o0([
  On()
], dn.prototype, "down", null);
o0([
  On()
], dn.prototype, "up", null);
o0([
  On()
], dn.prototype, "not", null);
o0([
  On()
], dn.prototype, "change", null);
o0([
  On()
], dn.prototype, "constant", null);
function PS(...e) {
  if (e.length === 0)
    throw new Error("Zero-length emitters");
  const t = new dn({
    sources: e
  }), r = Tu((n) => t.emit(n), 0);
  return e.forEach((n) => n.registerDerived(t, r)), t.icon = e.map((n) => n.icon).filter((n) => !!n).reduce((n, o) => n.length === 0 ? o : [...n, ", ", ...o], []), t;
}
const lu = 1e-6;
function cu(e) {
  return e >= 0 ? Math.round(e) : e % 0.5 === 0 ? Math.floor(e) : Math.round(e);
}
var ja;
(function(e) {
  function t(...re) {
    return re.reduce((F, z) => F + z, 0);
  }
  e.add = t;
  function r(...re) {
    return re.length === 0 ? 0 : re.length === 1 ? -re[0] : re.reduce((F, z) => F - z);
  }
  e.subtract = r;
  function n(...re) {
    return re.reduce((F, z) => F * z, 1);
  }
  e.multiply = n;
  function o(...re) {
    return re.length === 0 ? 1 : re.length === 1 ? 1 / re[0] : re.reduce((F, z) => F / z);
  }
  e.divide = o, e.round = cu, e.ceil = Math.ceil, e.floor = Math.floor;
  function a(re) {
    return re < 0 ? Math.ceil(re) : Math.floor(re);
  }
  e.trunc = a;
  function i(re) {
    return re - e.floor(re);
  }
  e.fract = i;
  function s(re, F) {
    return re - F * e.floor(re / F);
  }
  e.mod = s;
  function l(re, F, z = 0) {
    return Math.round((re - z) / F) * F + z;
  }
  e.quantize = l, e.min = Math.min, e.max = Math.max;
  function c(re, F, z) {
    return Math.max(F, Math.min(z, re));
  }
  e.clamp = c;
  function u(re, F) {
    return re * F;
  }
  e.scale = u;
  function f(...re) {
    let F = 0;
    const z = 1 / (re.length || 1);
    for (const we of re)
      F += we;
    return F / z;
  }
  e.average = f;
  function p(re, F, z) {
    return re + F * z;
  }
  e.scaleAndAdd = p;
  function h(re, F) {
    return Math.abs(re - F);
  }
  e.distance = h;
  function m(re, F) {
    return (re - F) ** 2;
  }
  e.squaredDistance = m, e.length = Math.abs;
  function w(re) {
    return re ** 2;
  }
  e.squaredLength = w;
  function A(re) {
    return -re;
  }
  e.negate = A;
  function T(re) {
    return 1 / re;
  }
  e.inverse = T;
  function B(re) {
    return 1 - re;
  }
  e.oneMinus = B, e.normalize = Math.sign;
  function N(re, F, z) {
    return re + (F - re) * z;
  }
  e.lerp = N;
  function Q(re, F, z) {
    return re === F ? 0.5 : (z - re) / (F - re);
  }
  e.inverseLerp = Q;
  function O(re, F, z, we, Oe) {
    const ot = c((re - F) / (z - F), 0, 1);
    return N(we, Oe, ot);
  }
  e.fit = O;
  function M(re, F, z, we, Oe) {
    const ot = (re - F) / (z - F);
    return N(we, Oe, ot);
  }
  e.efit = M;
  function X(re, F) {
    return F < re ? 0 : 1;
  }
  e.step = X;
  function G(re, F, z) {
    const we = c((z - re) / (F - re), 0, 1);
    return we * we * (3 - 2 * we);
  }
  e.smoothstep = G;
  function oe(re) {
    return re * 180 / Math.PI;
  }
  e.degrees = oe;
  function ue(re) {
    return re * Math.PI / 180;
  }
  e.radians = ue, e.sin = Math.sin, e.cos = Math.cos, e.tan = Math.tan, e.asin = Math.asin, e.acos = Math.acos;
  function K(re, F) {
    return F === void 0 ? Math.atan(re) : Math.atan2(re, F);
  }
  e.atan = K, e.pow = Math.exp, e.exp = Math.exp, e.log = Math.log;
  function pe(re) {
    return 2 ** re;
  }
  e.exp2 = pe, e.log2 = Math.log2, e.sqrt = Math.sqrt;
  function be(re) {
    return 1 / Math.sqrt(re);
  }
  e.inverseSqrt = be;
  function Ce(re, F) {
    return re === F;
  }
  e.exactEquals = Ce;
  function We(re, F) {
    return Math.abs(re - F) <= lu * Math.max(1, Math.abs(re), Math.abs(F));
  }
  e.equals = We, e.sub = r, e.mul = n, e.div = o, e.avg = f, e.dist = h, e.len = e.length, e.sqrDist = m, e.sqrLen = w, e.mix = N, e.invlerp = Q, e.rad = ue, e.deg = oe, e.invsqrt = be;
})(ja || (ja = {}));
var uu;
(function(e) {
  function t(R, le = R) {
    return [R, le];
  }
  e.of = t;
  function r(R) {
    return [...R];
  }
  e.clone = r, e.zero = Object.freeze([0, 0]), e.one = Object.freeze([1, 1]), e.unitX = Object.freeze([1, 0]), e.unitY = Object.freeze([0, 1]);
  function n(...R) {
    if (R.length === 0)
      return e.zero;
    if (R.length === 1)
      return R[0];
    if (R.length > 2) {
      const [Be, E, ...V] = R;
      return n(n(Be, E), ...V);
    }
    const [le, ie] = R;
    return [le[0] + ie[0], le[1] + ie[1]];
  }
  e.add = n;
  function o(...R) {
    if (R.length === 0)
      return e.zero;
    if (R.length === 1)
      return [-R[0], -R[1]];
    if (R.length > 2) {
      const [Be, E, ...V] = R;
      return o(o(Be, E), ...V);
    }
    const [le, ie] = R;
    return [le[0] - ie[0], le[1] - ie[1]];
  }
  e.subtract = o;
  function a(R, le) {
    return [le[0] - R[0], le[1] - R[1]];
  }
  e.delta = a;
  function i(...R) {
    if (R.length === 0)
      return e.one;
    if (R.length === 1)
      return R[0];
    if (R.length > 2) {
      const [Be, E, ...V] = R;
      return i(i(Be, E), ...V);
    }
    const [le, ie] = R;
    return [le[0] * ie[0], le[1] * ie[1]];
  }
  e.multiply = i;
  function s(...R) {
    if (R.length === 0)
      return e.one;
    if (R.length === 1)
      return s(e.one, R[0]);
    if (R.length > 2) {
      const [Be, E, ...V] = R;
      return s(s(Be, E), ...V);
    }
    const [le, ie] = R;
    return [le[0] / ie[0], le[1] / ie[1]];
  }
  e.divide = s;
  function l(...R) {
    if (R.length === 0)
      return [1 / 0, 1 / 0];
    if (R.length === 1)
      return R[0];
    if (R.length > 2) {
      const [Be, E, ...V] = R;
      return l(l(Be, E), ...V);
    }
    const [le, ie] = R;
    return [Math.min(le[0], ie[0]), Math.min(le[1], ie[1])];
  }
  e.min = l;
  function c(...R) {
    if (R.length === 0)
      return [-1 / 0, -1 / 0];
    if (R.length === 1)
      return R[0];
    if (R.length > 2) {
      const [Be, E, ...V] = R;
      return c(c(Be, E), ...V);
    }
    const [le, ie] = R;
    return [Math.max(le[0], ie[0]), Math.max(le[1], ie[1])];
  }
  e.max = c;
  function u(R, le, ie) {
    return typeof le == "number" && (le = [le, le]), typeof ie == "number" && (ie = [ie, ie]), [
      Math.min(Math.max(R[0], le[0]), ie[0]),
      Math.min(Math.max(R[1], le[1]), ie[1])
    ];
  }
  e.clamp = u;
  function f(R) {
    return [cu(R[0]), cu(R[1])];
  }
  e.round = f;
  function p(R) {
    return [Math.ceil(R[0]), Math.ceil(R[1])];
  }
  e.ceil = p;
  function h(R) {
    return [Math.floor(R[0]), Math.floor(R[1])];
  }
  e.floor = h;
  function m(R) {
    return [
      R[0] < 0 ? Math.ceil(R[0]) : Math.floor(R[0]),
      R[1] < 0 ? Math.ceil(R[1]) : Math.floor(R[1])
    ];
  }
  e.trunc = m;
  function w(R) {
    return e.sub(R, h(R));
  }
  e.fract = w;
  function A(R, le) {
    return typeof le == "number" && (le = [le, le]), [
      R[0] - le[0] * Math.floor(R[0] / le[0]),
      R[1] - le[1] * Math.floor(R[1] / le[1])
    ];
  }
  e.mod = A;
  function T(R, le, ie = e.zero) {
    return typeof le == "number" && (le = [le, le]), typeof ie == "number" && (ie = [ie, ie]), [
      Math.round((R[0] - ie[0]) / le[0]) * le[0] + ie[0],
      Math.round((R[1] - ie[1]) / le[1]) * le[1] + ie[1]
    ];
  }
  e.quantize = T;
  function B(R, le) {
    return [R[0] * le, R[1] * le];
  }
  e.scale = B;
  function N(...R) {
    let le = 0, ie = 0;
    const Be = R.length || 1;
    for (const E of R)
      le += E[0], ie += E[1];
    return [le / Be, ie / Be];
  }
  e.average = N;
  function Q(R, le, ie) {
    return [R[0] + le[0] * ie, R[1] + le[1] * ie];
  }
  e.scaleAndAdd = Q;
  function O(R, le) {
    const ie = le[0] - R[0], Be = le[1] - R[1];
    return Math.sqrt(ie * ie + Be * Be);
  }
  e.distance = O;
  function M(R, le) {
    const ie = le[0] - R[0], Be = le[1] - R[1];
    return ie * ie + Be * Be;
  }
  e.squaredDistance = M;
  function X(R) {
    return Math.sqrt(R[0] ** 2 + R[1] ** 2);
  }
  e.length = X;
  function G(R) {
    return R[0] ** 2 + R[1] ** 2;
  }
  e.squaredLength = G;
  function oe(R) {
    return [-R[0], -R[1]];
  }
  e.negate = oe;
  function ue(R) {
    return [1 / R[0], 1 / R[1]];
  }
  e.inverse = ue;
  function K(R) {
    return o(e.one, R);
  }
  e.oneMinus = K;
  function pe(R) {
    const le = R[0] ** 2 + R[1] ** 2, ie = le === 0 ? 0 : 1 / Math.sqrt(le);
    return [R[0] * ie, R[1] * ie];
  }
  e.normalize = pe;
  function be(R, le) {
    return R[0] * le[0] + R[1] * le[1];
  }
  e.dot = be;
  function Ce(R, le) {
    return [0, 0, R[0] * le[1] - R[1] * le[0]];
  }
  e.cross = Ce;
  function We(R, le, ie) {
    return typeof ie == "number" && (ie = [ie, ie]), [R[0] + ie[0] * (le[0] - R[0]), R[1] + ie[1] * (le[1] - R[1])];
  }
  e.lerp = We;
  function re(R, le, ie) {
    return [
      R[0] === le[0] ? 0.5 : (ie[0] - R[0]) / (le[0] - R[0]),
      R[1] === le[1] ? 0.5 : (ie[1] - R[1]) / (le[1] - R[1])
    ];
  }
  e.inverseLerp = re;
  function F(R, le, ie, Be, E) {
    const V = u([
      (R[0] - le[0]) / (ie[0] - le[0]),
      (R[0] - le[0]) / (ie[0] - le[0])
    ], 0, 1);
    return We(Be, E, V);
  }
  e.fit = F;
  function z(R, le, ie, Be, E) {
    const V = [
      (R[0] - le[0]) / (ie[0] - le[0]),
      (R[0] - le[0]) / (ie[0] - le[0])
    ];
    return We(Be, E, V);
  }
  e.efit = z;
  function we(R, le) {
    const [ie, Be] = R;
    return [le[0] * ie + le[2] * Be, le[1] * ie + le[3] * Be];
  }
  e.transformMat2 = we;
  function Oe(R, le) {
    const [ie, Be] = R;
    return [le[0] * ie + le[2] * Be + le[4], le[1] * ie + le[3] * Be + le[5]];
  }
  e.transformMat2d = Oe;
  function ot(R, le) {
    const [ie, Be] = R;
    return [le[0] * ie + le[3] * Be + le[6], le[1] * ie + le[4] * Be + le[7]];
  }
  e.transformMat3 = ot;
  function st(R, le, ie = e.zero) {
    const Be = R[0] - ie[0], E = R[1] - ie[1], V = Math.sin(le), Se = Math.cos(le);
    return [
      Be * Se - E * V + ie[0],
      Be * V + E * Se + ie[1]
    ];
  }
  e.rotate = st;
  function wt(R, le) {
    if (!le)
      return Math.atan2(R[1], R[0]);
    const [ie, Be] = R, [E, V] = le, Se = Math.sqrt((ie * ie + Be * Be) * (E * E + V * V)), ft = Se && (ie * E + Be * V) / Se;
    return Math.acos(Math.min(Math.max(ft, -1), 1));
  }
  e.angle = wt;
  function ae(R, le = 1) {
    return [Math.cos(R) * le, Math.sin(R) * le];
  }
  e.direction = ae;
  function _(R, le) {
    return R[0] === le[0] && R[1] === le[1];
  }
  e.exactEquals = _;
  function J(R, le) {
    const [ie, Be] = R, [E, V] = le;
    return Math.abs(ie - E) <= lu * Math.max(1, Math.abs(ie), Math.abs(E)) && Math.abs(Be - V) <= lu * Math.max(1, Math.abs(Be), Math.abs(V));
  }
  e.equals = J;
  function Le(R, le) {
    return typeof R == "number" && (R = [R, R]), [le[0] < R[0] ? 0 : 1, le[1] < R[1] ? 0 : 1];
  }
  e.step = Le;
  function at(R, le, ie) {
    const Be = ja.clamp((ie[0] - R[0]) / (le[0] - R[0]), 0, 1), E = ja.clamp((ie[1] - le[1]) / (le[1] - le[1]), 0, 1);
    return [Be * Be * (3 - 2 * Be), E * E * (3 - 2 * E)];
  }
  e.smoothstep = at;
  function Ft(R) {
    return [R[0] * 180 / Math.PI, R[1] * 180 / Math.PI];
  }
  e.degrees = Ft;
  function St(R) {
    return [R[0] * Math.PI / 180, R[1] * Math.PI / 180];
  }
  e.radians = St;
  function Wt(R) {
    return [Math.sin(R[0]), Math.sin(R[1])];
  }
  e.sin = Wt;
  function it(R) {
    return [Math.cos(R[0]), Math.cos(R[1])];
  }
  e.cos = it;
  function Ve(R) {
    return [Math.tan(R[0]), Math.tan(R[1])];
  }
  e.tan = Ve;
  function pt(R) {
    return [Math.asin(R[0]), Math.asin(R[1])];
  }
  e.asin = pt;
  function bt(R) {
    return [Math.acos(R[0]), Math.acos(R[1])];
  }
  e.acos = bt;
  function $t(R, le) {
    return le === void 0 ? [Math.atan(R[0]), Math.atan(R[1])] : [Math.atan2(R[0], le[0]), Math.atan2(R[1], le[1])];
  }
  e.atan = $t;
  function br(R, le) {
    return [Math.pow(R[0], le[0]), Math.pow(R[1], le[1])];
  }
  e.pow = br;
  function Qt(R) {
    return [Math.exp(R[0]), Math.exp(R[1])];
  }
  e.exp = Qt;
  function ur(R) {
    return [Math.log(R[0]), Math.log(R[1])];
  }
  e.log = ur;
  function _e(R) {
    return [2 ** R[0], 2 ** R[1]];
  }
  e.exp2 = _e;
  function ut(R) {
    return [Math.log2(R[0]), Math.log2(R[1])];
  }
  e.log2 = ut;
  function kt(R) {
    return [Math.sqrt(R[0]), Math.sqrt(R[1])];
  }
  e.sqrt = kt;
  function b(R) {
    return [1 / Math.sqrt(R[0]), 1 / Math.sqrt(R[1])];
  }
  e.inverseSqrt = b, e.sub = o, e.mul = i, e.div = s, e.avg = N, e.dist = O, e.len = X, e.sqrDist = M, e.sqrLen = G, e.neg = oe, e.mix = We, e.invlerp = re, e.rad = St, e.deg = Ft, e.invsqrt = b;
})(uu || (uu = {}));
var a0 = function(e, t, r, n) {
  var o = arguments.length, a = o < 3 ? t : n === null ? n = Object.getOwnPropertyDescriptor(t, r) : n, i;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") a = Reflect.decorate(e, t, r, n);
  else for (var s = e.length - 1; s >= 0; s--) (i = e[s]) && (a = (o < 3 ? i(a) : o > 3 ? i(t, r, a) : i(t, r)) || a);
  return o > 3 && a && Object.defineProperty(t, r, a), a;
};
const IS = [
  "b",
  "a",
  "y",
  "x",
  "l",
  "r",
  "zl",
  "zr",
  "select",
  "start",
  "stick-left",
  "stick-right",
  "up",
  "down",
  "left",
  "right",
  "home"
  // buttons[16]	Center button in center cluster
];
var Ta, Xo, ah, fu;
class Qa extends dn {
  constructor() {
    super();
    lr(this, Xo);
    lr(this, Ta, /* @__PURE__ */ new Map());
    Sr(this, Xo, fu).call(this);
  }
  /**
   * @group Generators
   */
  devices() {
    return this.filterMap((r) => r.type === "device" ? r.devices : void 0);
  }
  /**
   * Emits `true` if there is at least one gamepad connected.
   * @returns `true` if there is at least one gamepad connected.
   */
  connected() {
    return this.devices().map((r) => r.length > 0).change();
  }
  /**
   * @group Generators
   */
  button(r) {
    const n = this.filterMap((a) => {
      if (a.type === "button" && a.name === r)
        return a.pressed;
    }), o = r.toString();
    return n.icon = [
      { type: "iconify", icon: "solar:gamepad-bold" },
      o.length > 3 ? za.title(r.toString()) : o.toUpperCase()
    ], n;
  }
  /**
   * @group Generators
   */
  axis(r) {
    return this.filterMap((n) => {
      if (n.type === "axis" && (!r || n.name === r))
        return n.value;
    });
  }
  /**
   * Emits the direction in which the axis is tilted. Each axis is quantized into -1, 0, or 1. If the axis is not tilted, it emits `null`.
   * @example
   * [1, 0] // right
   * [0, -1] // up
   * [-1, 1] // down-left
   *
   * @param name  If omitted, it will watch all axes.
   * @param options step: quantization step in degrees, threshold: minimum tilt value (0-1) to emit
   * @returns
   * @group Generators
   */
  axisDirection(r, { step: n = 90, threshold: o = 0.5 } = {}) {
    return this.axis(r).map((a) => {
      if (uu.length(a) < o)
        return null;
      const i = ja.degrees(Math.atan2(a[1], a[0]));
      switch (ja.quantize(i, n)) {
        case -180:
          return [-1, 0];
        case -135:
          return [-1, -1];
        case -90:
          return [0, -1];
        case -45:
          return [1, -1];
        case 0:
          return [1, 0];
        case 45:
          return [1, 1];
        case 90:
          return [0, 1];
        case 135:
          return [-1, 1];
        case 180:
          return [-1, 0];
        default:
          throw new Error(`Unexpected angle: ${i}`);
      }
    }).change();
  }
}
Ta = new WeakMap(), Xo = new WeakSet(), ah = function() {
  const r = navigator.getGamepads().filter((n) => n !== null).map((n) => [n.index, n]);
  return new Map(r);
}, fu = function() {
  var n;
  if (this.disposed)
    return;
  const r = Sr(this, Xo, ah).call(this);
  r.size !== ct(this, Ta).size && this.emit({ type: "device", devices: [...r.values()] });
  for (const [o, a] of r.entries()) {
    const i = BS.find((l) => l.match(a));
    if (i && "ignore" in i)
      continue;
    const s = ct(this, Ta).get(o);
    if (!(!s || s === a)) {
      for (const [l, { pressed: c }] of a.buttons.entries()) {
        const u = ((n = s.buttons[l]) == null ? void 0 : n.pressed) ?? !1;
        if (c === u)
          continue;
        const f = (i == null ? void 0 : i.buttons[l]) ?? IS[l] ?? l;
        this.emit({
          type: "button",
          name: f,
          pressed: c,
          id: a.id
        });
      }
      for (let l = 0; l * 2 < a.axes.length; l++) {
        const c = [s.axes[l * 2], s.axes[l * 2 + 1]], u = [a.axes[l * 2], a.axes[l * 2 + 1]];
        if (!t3(c, u)) {
          const f = (i == null ? void 0 : i.axes[l]) ?? l;
          this.emit({ type: "axis", name: f, value: u, id: a.id });
        }
      }
    }
  }
  tr(this, Ta, r), requestAnimationFrame(Sr(this, Xo, fu).bind(this));
};
a0([
  On()
], Qa.prototype, "devices", null);
a0([
  On()
], Qa.prototype, "connected", null);
a0([
  On()
], Qa.prototype, "button", null);
a0([
  On()
], Qa.prototype, "axis", null);
a0([
  On()
], Qa.prototype, "axisDirection", null);
const BS = [
  {
    match: (e) => e.id.includes("Joy-Con (R)"),
    buttons: [
      "a",
      "x",
      "b",
      "y",
      "rsl",
      "rsr",
      6,
      "zr",
      "r",
      "+",
      "stick-right",
      11,
      12,
      13,
      14,
      15,
      "home"
    ],
    axes: ["right"]
  },
  {
    match: (e) => e.id.startsWith("Joy-Con (L)"),
    buttons: [
      "left",
      "down",
      "up",
      "right",
      "lsl",
      "lsr",
      "zl",
      7,
      "l",
      "-",
      "stick-left",
      11,
      12,
      13,
      14,
      15,
      "capture"
    ],
    axes: ["left"]
  },
  {
    match: (e) => e.id.startsWith("Joy-Con L+R"),
    buttons: [
      "a",
      "b",
      "y",
      "x",
      "l",
      "r",
      "zl",
      "zr",
      "-",
      "+",
      "stick-left",
      "stick-right",
      "up",
      "down",
      "left",
      "right",
      "home",
      "capture",
      "lsl",
      "lsr",
      "rsl",
      "rsr"
    ],
    axes: ["left", "right"]
  },
  {
    // When you connect both JoyCon left and right to PC, it is recognized as double devices,
    // one of which is "Joy-Con L+R" and the other is "Joy-Con (L/R)".
    // But the latter is not actually usable, so we ignore it.
    match: (e) => e.id.startsWith("Joy-Con (L/R)"),
    ignore: !0
  },
  {
    match: (e) => e.id.startsWith("Pro Controller"),
    buttons: [
      "b",
      "a",
      "x",
      "y",
      "l",
      "r",
      "zl",
      "zr",
      "-",
      "+",
      "stick-left",
      "stick-right",
      "up",
      "down",
      "left",
      "right",
      "home",
      "capture"
    ],
    axes: ["left", "right"]
  },
  {
    match: (e) => e.id.startsWith("DualSense Wireless Controller"),
    buttons: [
      "x",
      "square",
      "circle",
      "triangle",
      "l1",
      "r1",
      "l2",
      "r2",
      "create",
      "option",
      "stick-left",
      "stick-right",
      "up",
      "down",
      "left",
      "right",
      "home",
      "touch-pad"
    ],
    axes: ["left", "right"]
  },
  {
    match: (e) => e.id.includes("Xbox"),
    buttons: [
      // Xbox places A at the bottom (buttons[0]) and B at the right
      // (buttons[1]) — the opposite of the Nintendo layout used by
      // GenericButtonName, so a/b are swapped here.
      "a",
      "b",
      "x",
      "y",
      "lb",
      "rb",
      "lt",
      "rt",
      "view",
      "menu",
      "stick-left",
      "stick-right",
      "up",
      "down",
      "left",
      "right",
      "home",
      "share"
    ],
    axes: ["left", "right"]
  }
], NS = su(() => new Qa()), Oi = /mac|ipod|iphone|ipad/i.test(navigator.userAgent), uo = Oi ? "command" : "ctrl", jo = Oi ? "option" : "alt", GS = /* @__PURE__ */ new Map([
  // Command / Meta / Ctrl
  ["⌘", uo],
  ["meta", uo],
  ["cmd", uo],
  ["ctrl", uo],
  // Option / Alt
  ["⌥", jo],
  ["option", jo],
  ["alt", jo],
  // Others
  ["⇧", "shift"],
  ["⌃", "control"],
  ["return", "enter"]
]), qS = /* @__PURE__ */ new Map([
  [
    "command",
    Oi ? { type: "iconify", icon: "mdi:apple-keyboard-command" } : "Ctrl"
  ],
  [
    "option",
    Oi ? { type: "iconify", icon: "mdi:apple-keyboard-option" } : "Alt"
  ],
  [
    "shift",
    Oi ? { type: "iconify", icon: "mdi:apple-keyboard-shift" } : "Shift"
  ],
  ["control", { type: "iconify", icon: "mdi:apple-keyboard-control" }],
  ["up", { type: "iconify", icon: "mdi:arrow-up" }],
  ["down", { type: "iconify", icon: "mdi:arrow-down" }],
  ["left", { type: "iconify", icon: "mdi:arrow-left" }],
  ["right", { type: "iconify", icon: "mdi:arrow-right" }]
]), $S = /* @__PURE__ */ new Map([
  // Symbols
  ["Minus", "-"],
  ["Equal", "="],
  ["Comma", ","],
  ["Perild", "."],
  ["Slash", "/"],
  ["Backquote", "`"],
  ["BracketLeft", "["],
  ["BracketRight", "]"],
  ["Backslash", "\\"],
  ["Semicolon", ";"],
  ["Quote", "'"],
  // Arrow keys
  ["ArrowUp", "up"],
  ["ArrowDown", "down"],
  ["ArrowLeft", "left"],
  ["ArrowRight", "right"],
  // Special keys
  ["MetaLeft", uo],
  ["MetaRight", uo],
  ["ShiftLeft", "shift"],
  ["ShiftRight", "shift"],
  ["ControlLeft", "ctrl"],
  ["AltLeft", jo],
  ["AltRight", jo],
  ["Escape", "esc"],
  ["Backspace", "backspace"]
]);
function zS(e) {
  const t = e.toLowerCase().replace(/ +?/g, "").split("+").filter((r) => r !== "").map((r) => GS.get(r) ?? r);
  return ih(t);
}
const jS = /* @__PURE__ */ new Set(["shift", uo, jo, "control"]), Pp = new Map([
  uo,
  jo,
  "shift",
  "control",
  "up",
  "down",
  "left",
  "right",
  "space",
  "enter",
  "backspace",
  "capslock",
  "esc"
].map((e, t) => [e, t]));
function Ip(e) {
  if (e.startsWith("Key"))
    return e.slice(3).toLowerCase();
  if (e.startsWith("Digit"))
    return e.slice(5);
  const t = $S.get(e);
  return t || e.toLowerCase();
}
function ih(e) {
  return [...e].sort((r, n) => {
    const o = Pp.get(r) ?? r.charCodeAt(0) + 255, a = Pp.get(n) ?? n.charCodeAt(0) + 255;
    return o - a;
  }).join("+");
}
function ls(e) {
  return e.split("+").reduce((t, r) => (r === "" && t.at(-1) === "" && (r = "+"), [...t, r]), []).filter((t) => t !== "").map((t) => qS.get(t) ?? za.title(t));
}
class HS extends dn {
  constructor(t = window) {
    let r;
    if (typeof t == "string") {
      const l = document.querySelector(t);
      if (!l)
        throw new Error("Invalid selector");
      r = l;
    } else
      r = t;
    const n = /* @__PURE__ */ new Set(), o = () => {
      const l = /* @__PURE__ */ new Set();
      for (const c of n)
        jS.has(c) || (n.delete(c), l.add(c));
      for (const c of l)
        this.emit({
          type: "keyup",
          key: c,
          repeat: !1,
          pressedKeys: new Set(n),
          preventDefault: () => {
          },
          stopPropagation: () => {
          }
        });
    }, a = (l) => {
      if (l.target instanceof HTMLInputElement)
        return;
      const c = Ip(l.code);
      n.add(c), this.emit({
        type: "keydown",
        key: c,
        repeat: l.repeat,
        pressedKeys: new Set(n),
        preventDefault: l.preventDefault.bind(l),
        stopPropagation: l.stopPropagation.bind(l)
      });
    }, i = (l) => {
      if (l.target instanceof HTMLInputElement)
        return;
      const c = Ip(l.code);
      n.delete(c), c === "command" && o(), this.emit({
        type: "keyup",
        key: c,
        repeat: !1,
        pressedKeys: new Set(n),
        preventDefault: l.preventDefault.bind(l),
        stopPropagation: l.stopPropagation.bind(l)
      });
    };
    r.addEventListener("keydown", a), r.addEventListener("keyup", i);
    const s = (l) => {
      n.has("command") && !l.metaKey && (n.delete("command"), o(), this.emit({
        type: "keyup",
        key: "command",
        repeat: !1,
        pressedKeys: new Set(n),
        preventDefault: () => {
        },
        stopPropagation: () => {
        }
      }));
    };
    window.addEventListener("pointermove", s), super({
      onDispose() {
        r.removeEventListener("keydown", a), r.removeEventListener("keyup", i), window.removeEventListener("pointermove", s);
      }
    });
  }
  /**
   * @group Generators
   */
  pressed(t, r) {
    const n = this.filter((o) => o.key === t && !o.repeat).on((o) => Op(o, r)).map((o) => o.type === "keydown");
    return n.icon = ls(t), n;
  }
  /**
   * @group Generators
   */
  keydown(t, r) {
    const n = this.pressed(t, r).filter((o) => o).constant(!0);
    return n.icon = ls(t), n;
  }
  /**
   * @group Generators
   */
  keyup(t, r) {
    const n = this.pressed(t, r).filter((o) => !o).constant(!0);
    return n.icon = ls(t), n;
  }
  /**
   * @group Generators
   */
  hotkey(t, r) {
    const n = zS(t), o = this.filter((a) => a.type === "keydown" && ih(a.pressedKeys) === n && (r != null && r.repeat ? !0 : !a.repeat)).on((a) => Op(a, r)).constant(!0);
    return o.icon = ls(n), o;
  }
}
function US(e = window) {
  return new HS(e);
}
function VS(e) {
  const t = Py(
    (n) => e.subscribe((o, { reload: a }) => {
      n();
    }),
    () => e.value,
    () => e.value
  ), r = Jr(
    (n) => {
      e.value = typeof n == "function" ? n(e.value) : n;
    },
    [e]
  );
  return [t, r];
}
function WS(e) {
  return e && "current" in e ? e.current : e ?? null;
}
function Mr(e, t, r, n) {
  const o = me(r);
  o.current = r;
  const a = me(void 0);
  Vt(() => {
    const i = WS(e), s = a.current;
    if ((s == null ? void 0 : s.target) === i && s.type === t && s.options === n || (s && s.target.removeEventListener(
      s.type,
      s.handler,
      s.options
    ), a.current = void 0, !i)) return;
    const l = (c) => o.current(c);
    i.addEventListener(t, l, n), a.current = { target: i, type: t, options: n, handler: l };
  }), Vt(() => () => {
    const i = a.current;
    i && (i.target.removeEventListener(
      i.type,
      i.handler,
      i.options
    ), a.current = void 0);
  }, []);
}
function sh({
  target: e,
  onCopy: t,
  onPaste: r
}) {
  Mr(
    typeof window > "u" ? null : window,
    "keydown",
    (n) => {
      var o;
      !n.metaKey && !n.ctrlKey || ((o = e.current) == null ? void 0 : o.ownerDocument.activeElement) === e.current && (n.key.toLowerCase() === "c" && (t == null || t()), n.key.toLowerCase() === "v" && (r == null || r()));
    }
  );
}
const du = /* @__PURE__ */ new Map();
function Bp() {
  if (typeof document > "u") return;
  const t = [...du.values()].findLast((r) => r !== null) ?? "inherit";
  document.documentElement.style.cursor = t;
}
function XS(e) {
  const t = me(Symbol()), r = typeof e == "function" ? e() : e;
  Yr(() => {
    du.set(t.current, r), Bp();
  }), Yr(() => () => {
    du.delete(t.current), Bp();
  }, []);
}
function YS(e, t, r = document.body) {
  for (const [a, i] of Object.entries(e)) {
    const s = "--tq-" + za.kebab(a), l = typeof i == "number" ? `${i}px` : i;
    r.style.setProperty(s, l);
  }
  r.dataset.colorMode = t;
  const n = r.ownerDocument;
  let o = n.querySelector("meta[name=theme-color]");
  o || (o = n.createElement("meta"), o.setAttribute("name", "theme-color"), n.head.appendChild(o)), o.setAttribute("content", e.colorBackground);
}
function Rc(e) {
  return [
    [e.left, e.top],
    [e.right, e.bottom]
  ];
}
function Np(e, t) {
  return e === t || e.contains(t);
}
const ms = /* @__PURE__ */ new WeakMap();
function Gp(e) {
  const t = ms.get(e);
  !t || t.size === 0 ? e.style.removeProperty("anchor-name") : e.style.setProperty("anchor-name", [...t.keys()].join(", "));
}
function lh(e, t) {
  let r = ms.get(e);
  r || ms.set(e, r = /* @__PURE__ */ new Map()), r.set(t, (r.get(t) ?? 0) + 1), Gp(e);
  let n = !1;
  return () => {
    if (n)
      return;
    n = !0;
    const o = ms.get(e);
    if (!o)
      return;
    const a = (o.get(t) ?? 0) - 1;
    a > 0 ? o.set(t, a) : o.delete(t), Gp(e);
  };
}
function qp(e, t) {
  return typeof e == "function" ? e() : e ?? t;
}
function KS(e, { disabled: t, lockPointer: r = !1, pointerType: n = ["mouse", "pen", "touch"], dragDelaySeconds: o = 0.5, shouldDrag: a, onClick: i, onDrag: s, onDragStart: l, onDragEnd: c } = {}) {
  const u = {
    // All coordinates are relative to the viewport
    xy: Xt.zero,
    previous: Xt.zero,
    initial: Xt.zero,
    delta: Xt.zero,
    origin: Xt.zero,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
    dragging: !1,
    pointerLocked: !1
  };
  let f, p = !1, h = null;
  const m = e.ownerDocument ?? e;
  function w() {
    const M = e.getBoundingClientRect();
    u.top = M.top, u.right = M.right, u.bottom = M.bottom, u.left = M.left, u.width = M.width, u.height = M.height, u.origin = Xt.lerp([u.left, u.top], [u.right, u.bottom], 0.5);
  }
  function A() {
    if ("requestPointerLock" in e) {
      try {
        Promise.resolve(e.requestPointerLock()).catch(() => {
        });
      } catch {
      }
      u.pointerLocked = !0;
    }
  }
  function T() {
    var M;
    (M = e.ownerDocument) == null || M.exitPointerLock();
  }
  function B(M) {
    qp(r, !1) && A(), u.dragging = !0, u.initial = u.previous, l == null || l(u, M);
  }
  function N(M) {
    qp(t, !1) || M.button !== 0 || !M.isPrimary || n.includes(M.pointerType) && (a && !a(M) || (p = !0, h = M.pointerId, u.xy = u.previous = u.initial = [M.clientX, M.clientY], w(), o === 0 ? B(M) : f = setTimeout(() => B(M), o * 1e3), e.setPointerCapture(M.pointerId)));
  }
  function Q(M) {
    if (!(!p || M.pointerId !== h)) {
      if (M.movementX !== void 0 && M.movementY !== void 0) {
        const X = window.outerWidth / window.innerWidth, G = Xt.scale([M.movementX, M.movementY], 1 / X);
        u.xy = Xt.add(u.xy, G);
      } else
        u.xy = [M.clientX, M.clientY];
      if (u.delta = Xt.sub(u.xy, u.previous), w(), Xt.squaredLength(u.delta) !== 0) {
        if (!u.dragging) {
          const X = Xt.dist(u.initial, u.xy), G = M.pointerType === "mouse" ? 3 : 5;
          X >= G && (clearTimeout(f), B(M));
        }
        u.dragging && (s == null || s(u, M)), u.previous = u.xy;
      }
    }
  }
  function O(M) {
    if (!(!p || M.pointerId !== h)) {
      u.pointerLocked && T(), u.pointerLocked = !1, p && (u.dragging ? c == null || c(u, M) : i == null || i(u, M)), clearTimeout(f), p = !1, h = null, u.dragging = !1, u.xy = u.initial = u.delta = Xt.zero;
      try {
        (!("hasPointerCapture" in e) || e.hasPointerCapture(M.pointerId)) && e.releasePointerCapture(M.pointerId);
      } catch {
      }
    }
  }
  return e.addEventListener("pointerdown", N), m.addEventListener("pointermove", Q), m.addEventListener("pointerup", O), m.addEventListener("pointercancel", O), w(), {
    state: u,
    measure: w,
    dispose() {
      clearTimeout(f), e.removeEventListener("pointerdown", N), m.removeEventListener("pointermove", Q), m.removeEventListener("pointerup", O), m.removeEventListener("pointercancel", O);
    }
  };
}
var ch = { exports: {} };
(function(e) {
  var t = Object.prototype.hasOwnProperty, r = "~";
  function n() {
  }
  Object.create && (n.prototype = /* @__PURE__ */ Object.create(null), new n().__proto__ || (r = !1));
  function o(l, c, u) {
    this.fn = l, this.context = c, this.once = u || !1;
  }
  function a(l, c, u, f, p) {
    if (typeof u != "function")
      throw new TypeError("The listener must be a function");
    var h = new o(u, f || l, p), m = r ? r + c : c;
    return l._events[m] ? l._events[m].fn ? l._events[m] = [l._events[m], h] : l._events[m].push(h) : (l._events[m] = h, l._eventsCount++), l;
  }
  function i(l, c) {
    --l._eventsCount === 0 ? l._events = new n() : delete l._events[c];
  }
  function s() {
    this._events = new n(), this._eventsCount = 0;
  }
  s.prototype.eventNames = function() {
    var c = [], u, f;
    if (this._eventsCount === 0) return c;
    for (f in u = this._events)
      t.call(u, f) && c.push(r ? f.slice(1) : f);
    return Object.getOwnPropertySymbols ? c.concat(Object.getOwnPropertySymbols(u)) : c;
  }, s.prototype.listeners = function(c) {
    var u = r ? r + c : c, f = this._events[u];
    if (!f) return [];
    if (f.fn) return [f.fn];
    for (var p = 0, h = f.length, m = new Array(h); p < h; p++)
      m[p] = f[p].fn;
    return m;
  }, s.prototype.listenerCount = function(c) {
    var u = r ? r + c : c, f = this._events[u];
    return f ? f.fn ? 1 : f.length : 0;
  }, s.prototype.emit = function(c, u, f, p, h, m) {
    var w = r ? r + c : c;
    if (!this._events[w]) return !1;
    var A = this._events[w], T = arguments.length, B, N;
    if (A.fn) {
      switch (A.once && this.removeListener(c, A.fn, void 0, !0), T) {
        case 1:
          return A.fn.call(A.context), !0;
        case 2:
          return A.fn.call(A.context, u), !0;
        case 3:
          return A.fn.call(A.context, u, f), !0;
        case 4:
          return A.fn.call(A.context, u, f, p), !0;
        case 5:
          return A.fn.call(A.context, u, f, p, h), !0;
        case 6:
          return A.fn.call(A.context, u, f, p, h, m), !0;
      }
      for (N = 1, B = new Array(T - 1); N < T; N++)
        B[N - 1] = arguments[N];
      A.fn.apply(A.context, B);
    } else {
      var Q = A.length, O;
      for (N = 0; N < Q; N++)
        switch (A[N].once && this.removeListener(c, A[N].fn, void 0, !0), T) {
          case 1:
            A[N].fn.call(A[N].context);
            break;
          case 2:
            A[N].fn.call(A[N].context, u);
            break;
          case 3:
            A[N].fn.call(A[N].context, u, f);
            break;
          case 4:
            A[N].fn.call(A[N].context, u, f, p);
            break;
          default:
            if (!B) for (O = 1, B = new Array(T - 1); O < T; O++)
              B[O - 1] = arguments[O];
            A[N].fn.apply(A[N].context, B);
        }
    }
    return !0;
  }, s.prototype.on = function(c, u, f) {
    return a(this, c, u, f, !1);
  }, s.prototype.once = function(c, u, f) {
    return a(this, c, u, f, !0);
  }, s.prototype.removeListener = function(c, u, f, p) {
    var h = r ? r + c : c;
    if (!this._events[h]) return this;
    if (!u)
      return i(this, h), this;
    var m = this._events[h];
    if (m.fn)
      m.fn === u && (!p || m.once) && (!f || m.context === f) && i(this, h);
    else {
      for (var w = 0, A = [], T = m.length; w < T; w++)
        (m[w].fn !== u || p && !m[w].once || f && m[w].context !== f) && A.push(m[w]);
      A.length ? this._events[h] = A.length === 1 ? A[0] : A : i(this, h);
    }
    return this;
  }, s.prototype.removeAllListeners = function(c) {
    var u;
    return c ? (u = r ? r + c : c, this._events[u] && i(this, u)) : (this._events = new n(), this._eventsCount = 0), this;
  }, s.prototype.off = s.prototype.removeListener, s.prototype.addListener = s.prototype.on, s.prefixed = r, s.EventEmitter = s, e.exports = s;
})(ch);
var ZS = ch.exports;
const QS = /* @__PURE__ */ Za(ZS);
class uh extends Error {
  constructor(t) {
    super(t), this.name = "TimeoutError";
  }
}
class JS extends Error {
  constructor(t) {
    super(), this.name = "AbortError", this.message = t;
  }
}
const $p = (e) => globalThis.DOMException === void 0 ? new JS(e) : new DOMException(e), zp = (e) => {
  const t = e.reason === void 0 ? $p("This operation was aborted.") : e.reason;
  return t instanceof Error ? t : $p(t);
};
function ek(e, t) {
  const {
    milliseconds: r,
    fallback: n,
    message: o,
    customTimers: a = { setTimeout, clearTimeout }
  } = t;
  let i, s;
  const c = new Promise((u, f) => {
    if (typeof r != "number" || Math.sign(r) !== 1)
      throw new TypeError(`Expected \`milliseconds\` to be a positive number, got \`${r}\``);
    if (t.signal) {
      const { signal: h } = t;
      h.aborted && f(zp(h)), s = () => {
        f(zp(h));
      }, h.addEventListener("abort", s, { once: !0 });
    }
    if (r === Number.POSITIVE_INFINITY) {
      e.then(u, f);
      return;
    }
    const p = new uh();
    i = a.setTimeout.call(void 0, () => {
      if (n) {
        try {
          u(n());
        } catch (h) {
          f(h);
        }
        return;
      }
      typeof e.cancel == "function" && e.cancel(), o === !1 ? u() : o instanceof Error ? f(o) : (p.message = o ?? `Promise timed out after ${r} milliseconds`, f(p));
    }, r), (async () => {
      try {
        u(await e);
      } catch (h) {
        f(h);
      }
    })();
  }).finally(() => {
    c.clear(), s && t.signal && t.signal.removeEventListener("abort", s);
  });
  return c.clear = () => {
    a.clearTimeout.call(void 0, i), i = void 0;
  }, c;
}
function tk(e, t, r) {
  let n = 0, o = e.length;
  for (; o > 0; ) {
    const a = Math.trunc(o / 2);
    let i = n + a;
    r(e[i], t) <= 0 ? (n = ++i, o -= a + 1) : o = a;
  }
  return n;
}
var sn;
class rk {
  constructor() {
    lr(this, sn, []);
  }
  enqueue(t, r) {
    r = {
      priority: 0,
      ...r
    };
    const n = {
      priority: r.priority,
      id: r.id,
      run: t
    };
    if (this.size === 0 || ct(this, sn)[this.size - 1].priority >= r.priority) {
      ct(this, sn).push(n);
      return;
    }
    const o = tk(ct(this, sn), n, (a, i) => i.priority - a.priority);
    ct(this, sn).splice(o, 0, n);
  }
  setPriority(t, r) {
    const n = ct(this, sn).findIndex((a) => a.id === t);
    if (n === -1)
      throw new ReferenceError(`No promise function with the id "${t}" exists in the queue.`);
    const [o] = ct(this, sn).splice(n, 1);
    this.enqueue(o.run, { priority: r, id: t });
  }
  dequeue() {
    const t = ct(this, sn).shift();
    return t == null ? void 0 : t.run;
  }
  filter(t) {
    return ct(this, sn).filter((r) => r.priority === t.priority).map((r) => r.run);
  }
  get size() {
    return ct(this, sn).length;
  }
}
sn = new WeakMap();
var Da, Ma, co, Yi, Ca, Ki, ln, La, Ur, Zi, cn, Fa, Vn, Qi, Bs, Zt, fh, dh, ph, hh, mh, ys, pu, hu, bs, yh, gs;
class nk extends QS {
  // TODO: The `throwOnTimeout` option should affect the return types of `add()` and `addAll()`
  constructor(r) {
    var n, o;
    super();
    lr(this, Zt);
    lr(this, Da);
    lr(this, Ma);
    lr(this, co, 0);
    lr(this, Yi);
    lr(this, Ca);
    lr(this, Ki, 0);
    lr(this, ln);
    lr(this, La);
    lr(this, Ur);
    lr(this, Zi);
    lr(this, cn, 0);
    // The `!` is needed because of https://github.com/microsoft/TypeScript/issues/32194
    lr(this, Fa);
    lr(this, Vn);
    lr(this, Qi);
    // Use to assign a unique identifier to a promise function, if not explicitly specified
    lr(this, Bs, 1n);
    /**
        Per-operation timeout in milliseconds. Operations fulfill once `timeout` elapses if they haven't already.

        Applies to each future operation.
        */
    Oo(this, "timeout");
    if (r = {
      carryoverConcurrencyCount: !1,
      intervalCap: Number.POSITIVE_INFINITY,
      interval: 0,
      concurrency: Number.POSITIVE_INFINITY,
      autoStart: !0,
      queueClass: rk,
      ...r
    }, !(typeof r.intervalCap == "number" && r.intervalCap >= 1))
      throw new TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${((n = r.intervalCap) == null ? void 0 : n.toString()) ?? ""}\` (${typeof r.intervalCap})`);
    if (r.interval === void 0 || !(Number.isFinite(r.interval) && r.interval >= 0))
      throw new TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${((o = r.interval) == null ? void 0 : o.toString()) ?? ""}\` (${typeof r.interval})`);
    tr(this, Da, r.carryoverConcurrencyCount), tr(this, Ma, r.intervalCap === Number.POSITIVE_INFINITY || r.interval === 0), tr(this, Yi, r.intervalCap), tr(this, Ca, r.interval), tr(this, Ur, new r.queueClass()), tr(this, Zi, r.queueClass), this.concurrency = r.concurrency, this.timeout = r.timeout, tr(this, Qi, r.throwOnTimeout === !0), tr(this, Vn, r.autoStart === !1);
  }
  get concurrency() {
    return ct(this, Fa);
  }
  set concurrency(r) {
    if (!(typeof r == "number" && r >= 1))
      throw new TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${r}\` (${typeof r})`);
    tr(this, Fa, r), Sr(this, Zt, bs).call(this);
  }
  /**
      Updates the priority of a promise function by its id, affecting its execution order. Requires a defined concurrency limit to take effect.

      For example, this can be used to prioritize a promise function to run earlier.

      ```js
      import PQueue from 'p-queue';

      const queue = new PQueue({concurrency: 1});

      queue.add(async () => '🦄', {priority: 1});
      queue.add(async () => '🦀', {priority: 0, id: '🦀'});
      queue.add(async () => '🦄', {priority: 1});
      queue.add(async () => '🦄', {priority: 1});

      queue.setPriority('🦀', 2);
      ```

      In this case, the promise function with `id: '🦀'` runs second.

      You can also deprioritize a promise function to delay its execution:

      ```js
      import PQueue from 'p-queue';

      const queue = new PQueue({concurrency: 1});

      queue.add(async () => '🦄', {priority: 1});
      queue.add(async () => '🦀', {priority: 1, id: '🦀'});
      queue.add(async () => '🦄');
      queue.add(async () => '🦄', {priority: 0});

      queue.setPriority('🦀', -1);
      ```
      Here, the promise function with `id: '🦀'` executes last.
      */
  setPriority(r, n) {
    ct(this, Ur).setPriority(r, n);
  }
  async add(r, n = {}) {
    return n.id ?? (n.id = (wi(this, Bs)._++).toString()), n = {
      timeout: this.timeout,
      throwOnTimeout: ct(this, Qi),
      ...n
    }, new Promise((o, a) => {
      ct(this, Ur).enqueue(async () => {
        var i;
        wi(this, cn)._++;
        try {
          (i = n.signal) == null || i.throwIfAborted(), wi(this, co)._++;
          let s = r({ signal: n.signal });
          n.timeout && (s = ek(Promise.resolve(s), { milliseconds: n.timeout })), n.signal && (s = Promise.race([s, Sr(this, Zt, yh).call(this, n.signal)]));
          const l = await s;
          o(l), this.emit("completed", l);
        } catch (s) {
          if (s instanceof uh && !n.throwOnTimeout) {
            o();
            return;
          }
          a(s), this.emit("error", s);
        } finally {
          Sr(this, Zt, ph).call(this);
        }
      }, n), this.emit("add"), Sr(this, Zt, ys).call(this);
    });
  }
  async addAll(r, n) {
    return Promise.all(r.map(async (o) => this.add(o, n)));
  }
  /**
  Start (or resume) executing enqueued tasks within concurrency limit. No need to call this if queue is not paused (via `options.autoStart = false` or by `.pause()` method.)
  */
  start() {
    return ct(this, Vn) ? (tr(this, Vn, !1), Sr(this, Zt, bs).call(this), this) : this;
  }
  /**
  Put queue execution on hold.
  */
  pause() {
    tr(this, Vn, !0);
  }
  /**
  Clear the queue.
  */
  clear() {
    tr(this, Ur, new (ct(this, Zi))());
  }
  /**
      Can be called multiple times. Useful if you for example add additional items at a later time.

      @returns A promise that settles when the queue becomes empty.
      */
  async onEmpty() {
    ct(this, Ur).size !== 0 && await Sr(this, Zt, gs).call(this, "empty");
  }
  /**
      @returns A promise that settles when the queue size is less than the given limit: `queue.size < limit`.

      If you want to avoid having the queue grow beyond a certain size you can `await queue.onSizeLessThan()` before adding a new item.

      Note that this only limits the number of items waiting to start. There could still be up to `concurrency` jobs already running that this call does not include in its calculation.
      */
  async onSizeLessThan(r) {
    ct(this, Ur).size < r || await Sr(this, Zt, gs).call(this, "next", () => ct(this, Ur).size < r);
  }
  /**
      The difference with `.onEmpty` is that `.onIdle` guarantees that all work from the queue has finished. `.onEmpty` merely signals that the queue is empty, but it could mean that some promises haven't completed yet.

      @returns A promise that settles when the queue becomes empty, and all promises have completed; `queue.size === 0 && queue.pending === 0`.
      */
  async onIdle() {
    ct(this, cn) === 0 && ct(this, Ur).size === 0 || await Sr(this, Zt, gs).call(this, "idle");
  }
  /**
  Size of the queue, the number of queued items waiting to run.
  */
  get size() {
    return ct(this, Ur).size;
  }
  /**
      Size of the queue, filtered by the given options.

      For example, this can be used to find the number of items remaining in the queue with a specific priority level.
      */
  sizeBy(r) {
    return ct(this, Ur).filter(r).length;
  }
  /**
  Number of running items (no longer in the queue).
  */
  get pending() {
    return ct(this, cn);
  }
  /**
  Whether the queue is currently paused.
  */
  get isPaused() {
    return ct(this, Vn);
  }
}
Da = new WeakMap(), Ma = new WeakMap(), co = new WeakMap(), Yi = new WeakMap(), Ca = new WeakMap(), Ki = new WeakMap(), ln = new WeakMap(), La = new WeakMap(), Ur = new WeakMap(), Zi = new WeakMap(), cn = new WeakMap(), Fa = new WeakMap(), Vn = new WeakMap(), Qi = new WeakMap(), Bs = new WeakMap(), Zt = new WeakSet(), fh = function() {
  return ct(this, Ma) || ct(this, co) < ct(this, Yi);
}, dh = function() {
  return ct(this, cn) < ct(this, Fa);
}, ph = function() {
  wi(this, cn)._--, Sr(this, Zt, ys).call(this), this.emit("next");
}, hh = function() {
  Sr(this, Zt, hu).call(this), Sr(this, Zt, pu).call(this), tr(this, La, void 0);
}, mh = function() {
  const r = Date.now();
  if (ct(this, ln) === void 0) {
    const n = ct(this, Ki) - r;
    if (n < 0)
      tr(this, co, ct(this, Da) ? ct(this, cn) : 0);
    else
      return ct(this, La) === void 0 && tr(this, La, setTimeout(() => {
        Sr(this, Zt, hh).call(this);
      }, n)), !0;
  }
  return !1;
}, ys = function() {
  if (ct(this, Ur).size === 0)
    return ct(this, ln) && clearInterval(ct(this, ln)), tr(this, ln, void 0), this.emit("empty"), ct(this, cn) === 0 && this.emit("idle"), !1;
  if (!ct(this, Vn)) {
    const r = !ct(this, Zt, mh);
    if (ct(this, Zt, fh) && ct(this, Zt, dh)) {
      const n = ct(this, Ur).dequeue();
      return n ? (this.emit("active"), n(), r && Sr(this, Zt, pu).call(this), !0) : !1;
    }
  }
  return !1;
}, pu = function() {
  ct(this, Ma) || ct(this, ln) !== void 0 || (tr(this, ln, setInterval(() => {
    Sr(this, Zt, hu).call(this);
  }, ct(this, Ca))), tr(this, Ki, Date.now() + ct(this, Ca)));
}, hu = function() {
  ct(this, co) === 0 && ct(this, cn) === 0 && ct(this, ln) && (clearInterval(ct(this, ln)), tr(this, ln, void 0)), tr(this, co, ct(this, Da) ? ct(this, cn) : 0), Sr(this, Zt, bs).call(this);
}, /**
Executes all queued functions until it reaches the limit.
*/
bs = function() {
  for (; Sr(this, Zt, ys).call(this); )
    ;
}, yh = async function(r) {
  return new Promise((n, o) => {
    r.addEventListener("abort", () => {
      o(r.reason);
    }, { once: !0 });
  });
}, gs = async function(r, n) {
  return new Promise((o) => {
    const a = () => {
      n && !n() || (this.off(r, a), o());
    };
    this.on(r, a);
  });
};
var bh = { exports: {} };
(function(e, t) {
  (function(r, n) {
    e.exports = n();
  })(Ri, function() {
    var r = function(d) {
      return d instanceof Uint8Array || d instanceof Uint16Array || d instanceof Uint32Array || d instanceof Int8Array || d instanceof Int16Array || d instanceof Int32Array || d instanceof Float32Array || d instanceof Float64Array || d instanceof Uint8ClampedArray;
    }, n = function(d, g) {
      for (var D = Object.keys(g), te = 0; te < D.length; ++te)
        d[D[te]] = g[D[te]];
      return d;
    }, o = `
`;
    function a(d) {
      return typeof atob < "u" ? atob(d) : "base64:" + d;
    }
    function i(d) {
      var g = new Error("(regl) " + d);
      throw console.error(g), g;
    }
    function s(d, g) {
      d || i(g);
    }
    function l(d) {
      return d ? ": " + d : "";
    }
    function c(d, g, D) {
      d in g || i("unknown parameter (" + d + ")" + l(D) + ". possible values: " + Object.keys(g).join());
    }
    function u(d, g) {
      r(d) || i(
        "invalid parameter type" + l(g) + ". must be a typed array"
      );
    }
    function f(d, g) {
      switch (g) {
        case "number":
          return typeof d == "number";
        case "object":
          return typeof d == "object";
        case "string":
          return typeof d == "string";
        case "boolean":
          return typeof d == "boolean";
        case "function":
          return typeof d == "function";
        case "undefined":
          return typeof d > "u";
        case "symbol":
          return typeof d == "symbol";
      }
    }
    function p(d, g, D) {
      f(d, g) || i(
        "invalid parameter type" + l(D) + ". expected " + g + ", got " + typeof d
      );
    }
    function h(d, g) {
      d >= 0 && (d | 0) === d || i("invalid parameter type, (" + d + ")" + l(g) + ". must be a nonnegative integer");
    }
    function m(d, g, D) {
      g.indexOf(d) < 0 && i("invalid value" + l(D) + ". must be one of: " + g);
    }
    var w = [
      "gl",
      "canvas",
      "container",
      "attributes",
      "pixelRatio",
      "extensions",
      "optionalExtensions",
      "profile",
      "onDone"
    ];
    function A(d) {
      Object.keys(d).forEach(function(g) {
        w.indexOf(g) < 0 && i('invalid regl constructor argument "' + g + '". must be one of ' + w);
      });
    }
    function T(d, g) {
      for (d = d + ""; d.length < g; )
        d = " " + d;
      return d;
    }
    function B() {
      this.name = "unknown", this.lines = [], this.index = {}, this.hasErrors = !1;
    }
    function N(d, g) {
      this.number = d, this.line = g, this.errors = [];
    }
    function Q(d, g, D) {
      this.file = d, this.line = g, this.message = D;
    }
    function O() {
      var d = new Error(), g = (d.stack || d).toString(), D = /compileProcedure.*\n\s*at.*\((.*)\)/.exec(g);
      if (D)
        return D[1];
      var te = /compileProcedure.*\n\s*at\s+(.*)(\n|$)/.exec(g);
      return te ? te[1] : "unknown";
    }
    function M() {
      var d = new Error(), g = (d.stack || d).toString(), D = /at REGLCommand.*\n\s+at.*\((.*)\)/.exec(g);
      if (D)
        return D[1];
      var te = /at REGLCommand.*\n\s+at\s+(.*)\n/.exec(g);
      return te ? te[1] : "unknown";
    }
    function X(d, g) {
      var D = d.split(`
`), te = 1, de = 0, ee = {
        unknown: new B(),
        0: new B()
      };
      ee.unknown.name = ee[0].name = g || O(), ee.unknown.lines.push(new N(0, ""));
      for (var ce = 0; ce < D.length; ++ce) {
        var ve = D[ce], Ae = /^\s*#\s*(\w+)\s+(.+)\s*$/.exec(ve);
        if (Ae)
          switch (Ae[1]) {
            case "line":
              var De = /(\d+)(\s+\d+)?/.exec(Ae[2]);
              De && (te = De[1] | 0, De[2] && (de = De[2] | 0, de in ee || (ee[de] = new B())));
              break;
            case "define":
              var Fe = /SHADER_NAME(_B64)?\s+(.*)$/.exec(Ae[2]);
              Fe && (ee[de].name = Fe[1] ? a(Fe[2]) : Fe[2]);
              break;
          }
        ee[de].lines.push(new N(te++, ve));
      }
      return Object.keys(ee).forEach(function(Me) {
        var Ne = ee[Me];
        Ne.lines.forEach(function(xe) {
          Ne.index[xe.number] = xe;
        });
      }), ee;
    }
    function G(d) {
      var g = [];
      return d.split(`
`).forEach(function(D) {
        if (!(D.length < 5)) {
          var te = /^ERROR:\s+(\d+):(\d+):\s*(.*)$/.exec(D);
          te ? g.push(new Q(
            te[1] | 0,
            te[2] | 0,
            te[3].trim()
          )) : D.length > 0 && g.push(new Q("unknown", 0, D));
        }
      }), g;
    }
    function oe(d, g) {
      g.forEach(function(D) {
        var te = d[D.file];
        if (te) {
          var de = te.index[D.line];
          if (de) {
            de.errors.push(D), te.hasErrors = !0;
            return;
          }
        }
        d.unknown.hasErrors = !0, d.unknown.lines[0].errors.push(D);
      });
    }
    function ue(d, g, D, te, de) {
      if (!d.getShaderParameter(g, d.COMPILE_STATUS)) {
        var ee = d.getShaderInfoLog(g), ce = te === d.FRAGMENT_SHADER ? "fragment" : "vertex";
        F(D, "string", ce + " shader source must be a string", de);
        var ve = X(D, de), Ae = G(ee);
        oe(ve, Ae), Object.keys(ve).forEach(function(De) {
          var Fe = ve[De];
          if (!Fe.hasErrors)
            return;
          var Me = [""], Ne = [""];
          function xe(Te, H) {
            Me.push(Te), Ne.push(H || "");
          }
          xe("file number " + De + ": " + Fe.name + `
`, "color:red;text-decoration:underline;font-weight:bold"), Fe.lines.forEach(function(Te) {
            if (Te.errors.length > 0) {
              xe(T(Te.number, 4) + "|  ", "background-color:yellow; font-weight:bold"), xe(Te.line + o, "color:red; background-color:yellow; font-weight:bold");
              var H = 0;
              Te.errors.forEach(function(se) {
                var ke = se.message, Ke = /^\s*'(.*)'\s*:\s*(.*)$/.exec(ke);
                if (Ke) {
                  var ge = Ke[1];
                  switch (ke = Ke[2], ge) {
                    case "assign":
                      ge = "=";
                      break;
                  }
                  H = Math.max(Te.line.indexOf(ge, H), 0);
                } else
                  H = 0;
                xe(T("| ", 6)), xe(T("^^^", H + 3) + o, "font-weight:bold"), xe(T("| ", 6)), xe(ke + o, "font-weight:bold");
              }), xe(T("| ", 6) + o);
            } else
              xe(T(Te.number, 4) + "|  "), xe(Te.line + o, "color:red");
          }), typeof document < "u" && !window.chrome ? (Ne[0] = Me.join("%c"), console.log.apply(console, Ne)) : console.log(Me.join(""));
        }), s.raise("Error compiling " + ce + " shader, " + ve[0].name);
      }
    }
    function K(d, g, D, te, de) {
      if (!d.getProgramParameter(g, d.LINK_STATUS)) {
        var ee = d.getProgramInfoLog(g), ce = X(D, de), ve = X(te, de), Ae = 'Error linking program with vertex shader, "' + ve[0].name + '", and fragment shader "' + ce[0].name + '"';
        typeof document < "u" ? console.log(
          "%c" + Ae + o + "%c" + ee,
          "color:red;text-decoration:underline;font-weight:bold",
          "color:red"
        ) : console.log(Ae + o + ee), s.raise(Ae);
      }
    }
    function pe(d) {
      d._commandRef = O();
    }
    function be(d, g, D, te) {
      pe(d);
      function de(Ae) {
        return Ae ? te.id(Ae) : 0;
      }
      d._fragId = de(d.static.frag), d._vertId = de(d.static.vert);
      function ee(Ae, De) {
        Object.keys(De).forEach(function(Fe) {
          Ae[te.id(Fe)] = !0;
        });
      }
      var ce = d._uniformSet = {};
      ee(ce, g.static), ee(ce, g.dynamic);
      var ve = d._attributeSet = {};
      ee(ve, D.static), ee(ve, D.dynamic), d._hasCount = "count" in d.static || "count" in d.dynamic || "elements" in d.static || "elements" in d.dynamic;
    }
    function Ce(d, g) {
      var D = M();
      i(d + " in command " + (g || O()) + (D === "unknown" ? "" : " called from " + D));
    }
    function We(d, g, D) {
      d || Ce(g, D || O());
    }
    function re(d, g, D, te) {
      d in g || Ce(
        "unknown parameter (" + d + ")" + l(D) + ". possible values: " + Object.keys(g).join(),
        te || O()
      );
    }
    function F(d, g, D, te) {
      f(d, g) || Ce(
        "invalid parameter type" + l(D) + ". expected " + g + ", got " + typeof d,
        te || O()
      );
    }
    function z(d) {
      d();
    }
    function we(d, g, D) {
      d.texture ? m(
        d.texture._texture.internalformat,
        g,
        "unsupported texture format for attachment"
      ) : m(
        d.renderbuffer._renderbuffer.format,
        D,
        "unsupported renderbuffer format for attachment"
      );
    }
    var Oe = 33071, ot = 9728, st = 9984, wt = 9985, ae = 9986, _ = 9987, J = 5120, Le = 5121, at = 5122, Ft = 5123, St = 5124, Wt = 5125, it = 5126, Ve = 32819, pt = 32820, bt = 33635, $t = 34042, br = 36193, Qt = {};
    Qt[J] = Qt[Le] = 1, Qt[at] = Qt[Ft] = Qt[br] = Qt[bt] = Qt[Ve] = Qt[pt] = 2, Qt[St] = Qt[Wt] = Qt[it] = Qt[$t] = 4;
    function ur(d, g) {
      return d === pt || d === Ve || d === bt ? 2 : d === $t ? 4 : Qt[d] * g;
    }
    function _e(d) {
      return !(d & d - 1) && !!d;
    }
    function ut(d, g, D) {
      var te, de = g.width, ee = g.height, ce = g.channels;
      s(
        de > 0 && de <= D.maxTextureSize && ee > 0 && ee <= D.maxTextureSize,
        "invalid texture shape"
      ), (d.wrapS !== Oe || d.wrapT !== Oe) && s(
        _e(de) && _e(ee),
        "incompatible wrap mode for texture, both width and height must be power of 2"
      ), g.mipmask === 1 ? de !== 1 && ee !== 1 && s(
        d.minFilter !== st && d.minFilter !== ae && d.minFilter !== wt && d.minFilter !== _,
        "min filter requires mipmap"
      ) : (s(
        _e(de) && _e(ee),
        "texture must be a square power of 2 to support mipmapping"
      ), s(
        g.mipmask === (de << 1) - 1,
        "missing or incomplete mipmap data"
      )), g.type === it && (D.extensions.indexOf("oes_texture_float_linear") < 0 && s(
        d.minFilter === ot && d.magFilter === ot,
        "filter not supported, must enable oes_texture_float_linear"
      ), s(
        !d.genMipmaps,
        "mipmap generation not supported with float textures"
      ));
      var ve = g.images;
      for (te = 0; te < 16; ++te)
        if (ve[te]) {
          var Ae = de >> te, De = ee >> te;
          s(g.mipmask & 1 << te, "missing mipmap data");
          var Fe = ve[te];
          if (s(
            Fe.width === Ae && Fe.height === De,
            "invalid shape for mip images"
          ), s(
            Fe.format === g.format && Fe.internalformat === g.internalformat && Fe.type === g.type,
            "incompatible type for mip image"
          ), !Fe.compressed) if (Fe.data) {
            var Me = Math.ceil(ur(Fe.type, ce) * Ae / Fe.unpackAlignment) * Fe.unpackAlignment;
            s(
              Fe.data.byteLength === Me * De,
              "invalid data for image, buffer size is inconsistent with image format"
            );
          } else Fe.element || Fe.copy;
        } else d.genMipmaps || s((g.mipmask & 1 << te) === 0, "extra mipmap data");
      g.compressed && s(
        !d.genMipmaps,
        "mipmap generation for compressed images not supported"
      );
    }
    function kt(d, g, D, te) {
      var de = d.width, ee = d.height, ce = d.channels;
      s(
        de > 0 && de <= te.maxTextureSize && ee > 0 && ee <= te.maxTextureSize,
        "invalid texture shape"
      ), s(
        de === ee,
        "cube map must be square"
      ), s(
        g.wrapS === Oe && g.wrapT === Oe,
        "wrap mode not supported by cube map"
      );
      for (var ve = 0; ve < D.length; ++ve) {
        var Ae = D[ve];
        s(
          Ae.width === de && Ae.height === ee,
          "inconsistent cube map face shape"
        ), g.genMipmaps && (s(
          !Ae.compressed,
          "can not generate mipmap for compressed textures"
        ), s(
          Ae.mipmask === 1,
          "can not specify mipmaps and generate mipmaps"
        ));
        for (var De = Ae.images, Fe = 0; Fe < 16; ++Fe) {
          var Me = De[Fe];
          if (Me) {
            var Ne = de >> Fe, xe = ee >> Fe;
            s(Ae.mipmask & 1 << Fe, "missing mipmap data"), s(
              Me.width === Ne && Me.height === xe,
              "invalid shape for mip images"
            ), s(
              Me.format === d.format && Me.internalformat === d.internalformat && Me.type === d.type,
              "incompatible type for mip image"
            ), Me.compressed || (Me.data ? s(
              Me.data.byteLength === Ne * xe * Math.max(ur(Me.type, ce), Me.unpackAlignment),
              "invalid data for image, buffer size is inconsistent with image format"
            ) : Me.element || Me.copy);
          }
        }
      }
    }
    var b = n(s, {
      optional: z,
      raise: i,
      commandRaise: Ce,
      command: We,
      parameter: c,
      commandParameter: re,
      constructor: A,
      type: p,
      commandType: F,
      isTypedArray: u,
      nni: h,
      oneOf: m,
      shaderError: ue,
      linkError: K,
      callSite: M,
      saveCommandRef: pe,
      saveDrawInfo: be,
      framebufferFormat: we,
      guessCommand: O,
      texture2D: ut,
      textureCube: kt
    }), R = 0, le = 0, ie = 5, Be = 6;
    function E(d, g) {
      this.id = R++, this.type = d, this.data = g;
    }
    function V(d) {
      return d.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }
    function Se(d) {
      if (d.length === 0)
        return [];
      var g = d.charAt(0), D = d.charAt(d.length - 1);
      if (d.length > 1 && g === D && (g === '"' || g === "'"))
        return ['"' + V(d.substr(1, d.length - 2)) + '"'];
      var te = /\[(false|true|null|\d+|'[^']*'|"[^"]*")\]/.exec(d);
      if (te)
        return Se(d.substr(0, te.index)).concat(Se(te[1])).concat(Se(d.substr(te.index + te[0].length)));
      var de = d.split(".");
      if (de.length === 1)
        return ['"' + V(d) + '"'];
      for (var ee = [], ce = 0; ce < de.length; ++ce)
        ee = ee.concat(Se(de[ce]));
      return ee;
    }
    function ft(d) {
      return "[" + Se(d).join("][") + "]";
    }
    function Mt(d, g) {
      return new E(d, ft(g + ""));
    }
    function or(d) {
      return typeof d == "function" && !d._reglType || d instanceof E;
    }
    function Gr(d, g) {
      if (typeof d == "function")
        return new E(le, d);
      if (typeof d == "number" || typeof d == "boolean")
        return new E(ie, d);
      if (Array.isArray(d))
        return new E(Be, d.map(function(D, te) {
          return Gr(D, g + "[" + te + "]");
        }));
      if (d instanceof E)
        return d;
      b(!1, "invalid option type in uniform " + g);
    }
    var _r = {
      DynamicVariable: E,
      define: Mt,
      isDynamic: or,
      unbox: Gr,
      accessor: ft
    }, In = {
      next: typeof requestAnimationFrame == "function" ? function(d) {
        return requestAnimationFrame(d);
      } : function(d) {
        return setTimeout(d, 16);
      },
      cancel: typeof cancelAnimationFrame == "function" ? function(d) {
        return cancelAnimationFrame(d);
      } : clearTimeout
    }, Zr = typeof performance < "u" && performance.now ? function() {
      return performance.now();
    } : function() {
      return +/* @__PURE__ */ new Date();
    };
    function nn() {
      var d = { "": 0 }, g = [""];
      return {
        id: function(D) {
          var te = d[D];
          return te || (te = d[D] = g.length, g.push(D), te);
        },
        str: function(D) {
          return g[D];
        }
      };
    }
    function eo(d, g, D) {
      var te = document.createElement("canvas");
      n(te.style, {
        border: 0,
        margin: 0,
        padding: 0,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%"
      }), d.appendChild(te), d === document.body && (te.style.position = "absolute", n(d.style, {
        margin: 0,
        padding: 0
      }));
      function de() {
        var ve = window.innerWidth, Ae = window.innerHeight;
        if (d !== document.body) {
          var De = te.getBoundingClientRect();
          ve = De.right - De.left, Ae = De.bottom - De.top;
        }
        te.width = D * ve, te.height = D * Ae;
      }
      var ee;
      d !== document.body && typeof ResizeObserver == "function" ? (ee = new ResizeObserver(function() {
        setTimeout(de);
      }), ee.observe(d)) : window.addEventListener("resize", de, !1);
      function ce() {
        ee ? ee.disconnect() : window.removeEventListener("resize", de), d.removeChild(te);
      }
      return de(), {
        canvas: te,
        onDestroy: ce
      };
    }
    function u0(d, g) {
      function D(te) {
        try {
          return d.getContext(te, g);
        } catch {
          return null;
        }
      }
      return D("webgl") || D("experimental-webgl") || D("webgl-experimental");
    }
    function ei(d) {
      return typeof d.nodeName == "string" && typeof d.appendChild == "function" && typeof d.getBoundingClientRect == "function";
    }
    function tl(d) {
      return typeof d.drawArrays == "function" || typeof d.drawElements == "function";
    }
    function ti(d) {
      return typeof d == "string" ? d.split() : (b(Array.isArray(d), "invalid extension array"), d);
    }
    function f0(d) {
      return typeof d == "string" ? (b(typeof document < "u", "not supported outside of DOM"), document.querySelector(d)) : d;
    }
    function rl(d) {
      var g = d || {}, D, te, de, ee, ce = {}, ve = [], Ae = [], De = typeof window > "u" ? 1 : window.devicePixelRatio, Fe = !1, Me = function(Te) {
        Te && b.raise(Te);
      }, Ne = function() {
      };
      if (typeof g == "string" ? (b(
        typeof document < "u",
        "selector queries only supported in DOM environments"
      ), D = document.querySelector(g), b(D, "invalid query string for element")) : typeof g == "object" ? ei(g) ? D = g : tl(g) ? (ee = g, de = ee.canvas) : (b.constructor(g), "gl" in g ? ee = g.gl : "canvas" in g ? de = f0(g.canvas) : "container" in g && (te = f0(g.container)), "attributes" in g && (ce = g.attributes, b.type(ce, "object", "invalid context attributes")), "extensions" in g && (ve = ti(g.extensions)), "optionalExtensions" in g && (Ae = ti(g.optionalExtensions)), "onDone" in g && (b.type(
        g.onDone,
        "function",
        "invalid or missing onDone callback"
      ), Me = g.onDone), "profile" in g && (Fe = !!g.profile), "pixelRatio" in g && (De = +g.pixelRatio, b(De > 0, "invalid pixel ratio"))) : b.raise("invalid arguments to regl"), D && (D.nodeName.toLowerCase() === "canvas" ? de = D : te = D), !ee) {
        if (!de) {
          b(
            typeof document < "u",
            "must manually specify webgl context outside of DOM environments"
          );
          var xe = eo(te || document.body, Me, De);
          if (!xe)
            return null;
          de = xe.canvas, Ne = xe.onDestroy;
        }
        ce.premultipliedAlpha === void 0 && (ce.premultipliedAlpha = !0), ee = u0(de, ce);
      }
      return ee ? {
        gl: ee,
        canvas: de,
        container: te,
        extensions: ve,
        optionalExtensions: Ae,
        pixelRatio: De,
        profile: Fe,
        onDone: Me,
        onDestroy: Ne
      } : (Ne(), Me("webgl not supported, try upgrading your browser or graphics drivers http://get.webgl.org"), null);
    }
    function nl(d, g) {
      var D = {};
      function te(ce) {
        b.type(ce, "string", "extension name must be string");
        var ve = ce.toLowerCase(), Ae;
        try {
          Ae = D[ve] = d.getExtension(ve);
        } catch {
        }
        return !!Ae;
      }
      for (var de = 0; de < g.extensions.length; ++de) {
        var ee = g.extensions[de];
        if (!te(ee))
          return g.onDestroy(), g.onDone('"' + ee + '" extension is not supported by the current WebGL context, try upgrading your system or a different browser'), null;
      }
      return g.optionalExtensions.forEach(te), {
        extensions: D,
        restore: function() {
          Object.keys(D).forEach(function(ce) {
            if (D[ce] && !te(ce))
              throw new Error("(regl): error restoring extension " + ce);
          });
        }
      };
    }
    function Or(d, g) {
      for (var D = Array(d), te = 0; te < d; ++te)
        D[te] = g(te);
      return D;
    }
    var ri = 5120, ol = 5121, d0 = 5122, al = 5123, il = 5124, sl = 5125, xt = 5126;
    function rr(d) {
      for (var g = 16; g <= 1 << 28; g *= 16)
        if (d <= g)
          return g;
      return 0;
    }
    function ar(d) {
      var g, D;
      return g = (d > 65535) << 4, d >>>= g, D = (d > 255) << 3, d >>>= D, g |= D, D = (d > 15) << 2, d >>>= D, g |= D, D = (d > 3) << 1, d >>>= D, g |= D, g | d >> 1;
    }
    function nr() {
      var d = Or(8, function() {
        return [];
      });
      function g(ee) {
        var ce = rr(ee), ve = d[ar(ce) >> 2];
        return ve.length > 0 ? ve.pop() : new ArrayBuffer(ce);
      }
      function D(ee) {
        d[ar(ee.byteLength) >> 2].push(ee);
      }
      function te(ee, ce) {
        var ve = null;
        switch (ee) {
          case ri:
            ve = new Int8Array(g(ce), 0, ce);
            break;
          case ol:
            ve = new Uint8Array(g(ce), 0, ce);
            break;
          case d0:
            ve = new Int16Array(g(2 * ce), 0, ce);
            break;
          case al:
            ve = new Uint16Array(g(2 * ce), 0, ce);
            break;
          case il:
            ve = new Int32Array(g(4 * ce), 0, ce);
            break;
          case sl:
            ve = new Uint32Array(g(4 * ce), 0, ce);
            break;
          case xt:
            ve = new Float32Array(g(4 * ce), 0, ce);
            break;
          default:
            return null;
        }
        return ve.length !== ce ? ve.subarray(0, ce) : ve;
      }
      function de(ee) {
        D(ee.buffer);
      }
      return {
        alloc: g,
        free: D,
        allocType: te,
        freeType: de
      };
    }
    var Ct = nr();
    Ct.zero = nr();
    var qr = 3408, Bn = 3410, ni = 3411, ea = 3412, to = 3413, p0 = 3414, h0 = 3415, m0 = 33901, Xh = 33902, Yh = 3379, Kh = 3386, Zh = 34921, Qh = 36347, Jh = 36348, em = 35661, tm = 35660, rm = 34930, nm = 36349, om = 34076, am = 34024, im = 7936, sm = 7937, lm = 7938, cm = 35724, um = 34047, fm = 36063, dm = 34852, y0 = 3553, Yu = 34067, pm = 34069, hm = 33984, oi = 6408, ll = 5126, Ku = 5121, cl = 36160, mm = 36053, ym = 36064, bm = 16384, gm = function(d, g) {
      var D = 1;
      g.ext_texture_filter_anisotropic && (D = d.getParameter(um));
      var te = 1, de = 1;
      g.webgl_draw_buffers && (te = d.getParameter(dm), de = d.getParameter(fm));
      var ee = !!g.oes_texture_float;
      if (ee) {
        var ce = d.createTexture();
        d.bindTexture(y0, ce), d.texImage2D(y0, 0, oi, 1, 1, 0, oi, ll, null);
        var ve = d.createFramebuffer();
        if (d.bindFramebuffer(cl, ve), d.framebufferTexture2D(cl, ym, y0, ce, 0), d.bindTexture(y0, null), d.checkFramebufferStatus(cl) !== mm) ee = !1;
        else {
          d.viewport(0, 0, 1, 1), d.clearColor(1, 0, 0, 1), d.clear(bm);
          var Ae = Ct.allocType(ll, 4);
          d.readPixels(0, 0, 1, 1, oi, ll, Ae), d.getError() ? ee = !1 : (d.deleteFramebuffer(ve), d.deleteTexture(ce), ee = Ae[0] === 1), Ct.freeType(Ae);
        }
      }
      var De = typeof navigator < "u" && (/MSIE/.test(navigator.userAgent) || /Trident\//.test(navigator.appVersion) || /Edge/.test(navigator.userAgent)), Fe = !0;
      if (!De) {
        var Me = d.createTexture(), Ne = Ct.allocType(Ku, 36);
        d.activeTexture(hm), d.bindTexture(Yu, Me), d.texImage2D(pm, 0, oi, 3, 3, 0, oi, Ku, Ne), Ct.freeType(Ne), d.bindTexture(Yu, null), d.deleteTexture(Me), Fe = !d.getError();
      }
      return {
        // drawing buffer bit depth
        colorBits: [
          d.getParameter(Bn),
          d.getParameter(ni),
          d.getParameter(ea),
          d.getParameter(to)
        ],
        depthBits: d.getParameter(p0),
        stencilBits: d.getParameter(h0),
        subpixelBits: d.getParameter(qr),
        // supported extensions
        extensions: Object.keys(g).filter(function(xe) {
          return !!g[xe];
        }),
        // max aniso samples
        maxAnisotropic: D,
        // max draw buffers
        maxDrawbuffers: te,
        maxColorAttachments: de,
        // point and line size ranges
        pointSizeDims: d.getParameter(m0),
        lineWidthDims: d.getParameter(Xh),
        maxViewportDims: d.getParameter(Kh),
        maxCombinedTextureUnits: d.getParameter(em),
        maxCubeMapSize: d.getParameter(om),
        maxRenderbufferSize: d.getParameter(am),
        maxTextureUnits: d.getParameter(rm),
        maxTextureSize: d.getParameter(Yh),
        maxAttributes: d.getParameter(Zh),
        maxVertexUniforms: d.getParameter(Qh),
        maxVertexTextureUnits: d.getParameter(tm),
        maxVaryingVectors: d.getParameter(Jh),
        maxFragmentUniforms: d.getParameter(nm),
        // vendor info
        glsl: d.getParameter(cm),
        renderer: d.getParameter(sm),
        vendor: d.getParameter(im),
        version: d.getParameter(lm),
        // quirks
        readFloat: ee,
        npotTextureCube: Fe
      };
    };
    function pn(d) {
      return !!d && typeof d == "object" && Array.isArray(d.shape) && Array.isArray(d.stride) && typeof d.offset == "number" && d.shape.length === d.stride.length && (Array.isArray(d.data) || r(d.data));
    }
    var Qr = function(d) {
      return Object.keys(d).map(function(g) {
        return d[g];
      });
    }, b0 = {
      shape: xm,
      flatten: wm
    };
    function Am(d, g, D) {
      for (var te = 0; te < g; ++te)
        D[te] = d[te];
    }
    function vm(d, g, D, te) {
      for (var de = 0, ee = 0; ee < g; ++ee)
        for (var ce = d[ee], ve = 0; ve < D; ++ve)
          te[de++] = ce[ve];
    }
    function Zu(d, g, D, te, de, ee) {
      for (var ce = ee, ve = 0; ve < g; ++ve)
        for (var Ae = d[ve], De = 0; De < D; ++De)
          for (var Fe = Ae[De], Me = 0; Me < te; ++Me)
            de[ce++] = Fe[Me];
    }
    function Qu(d, g, D, te, de) {
      for (var ee = 1, ce = D + 1; ce < g.length; ++ce)
        ee *= g[ce];
      var ve = g[D];
      if (g.length - D === 4) {
        var Ae = g[D + 1], De = g[D + 2], Fe = g[D + 3];
        for (ce = 0; ce < ve; ++ce)
          Zu(d[ce], Ae, De, Fe, te, de), de += ee;
      } else
        for (ce = 0; ce < ve; ++ce)
          Qu(d[ce], g, D + 1, te, de), de += ee;
    }
    function wm(d, g, D, te) {
      var de = 1;
      if (g.length)
        for (var ee = 0; ee < g.length; ++ee)
          de *= g[ee];
      else
        de = 0;
      var ce = te || Ct.allocType(D, de);
      switch (g.length) {
        case 0:
          break;
        case 1:
          Am(d, g[0], ce);
          break;
        case 2:
          vm(d, g[0], g[1], ce);
          break;
        case 3:
          Zu(d, g[0], g[1], g[2], ce, 0);
          break;
        default:
          Qu(d, g, 0, ce, 0);
      }
      return ce;
    }
    function xm(d) {
      for (var g = [], D = d; D.length; D = D[0])
        g.push(D.length);
      return g;
    }
    var ul = {
      "[object Int8Array]": 5120,
      "[object Int16Array]": 5122,
      "[object Int32Array]": 5124,
      "[object Uint8Array]": 5121,
      "[object Uint8ClampedArray]": 5121,
      "[object Uint16Array]": 5123,
      "[object Uint32Array]": 5125,
      "[object Float32Array]": 5126,
      "[object Float64Array]": 5121,
      "[object ArrayBuffer]": 5121
    }, _m = 5120, Em = 5122, Sm = 5124, km = 5121, Tm = 5123, Dm = 5125, Mm = 5126, Cm = 5126, _o = {
      int8: _m,
      int16: Em,
      int32: Sm,
      uint8: km,
      uint16: Tm,
      uint32: Dm,
      float: Mm,
      float32: Cm
    }, Lm = 35048, Fm = 35040, g0 = {
      dynamic: Lm,
      stream: Fm,
      static: 35044
    }, fl = b0.flatten, Ju = b0.shape, ef = 35044, Rm = 35040, dl = 5121, pl = 5126, ro = [];
    ro[5120] = 1, ro[5122] = 2, ro[5124] = 4, ro[5121] = 1, ro[5123] = 2, ro[5125] = 4, ro[5126] = 4;
    function A0(d) {
      return ul[Object.prototype.toString.call(d)] | 0;
    }
    function tf(d, g) {
      for (var D = 0; D < g.length; ++D)
        d[D] = g[D];
    }
    function rf(d, g, D, te, de, ee, ce) {
      for (var ve = 0, Ae = 0; Ae < D; ++Ae)
        for (var De = 0; De < te; ++De)
          d[ve++] = g[de * Ae + ee * De + ce];
    }
    function Om(d, g, D, te) {
      var de = 0, ee = {};
      function ce(H) {
        this.id = de++, this.buffer = d.createBuffer(), this.type = H, this.usage = ef, this.byteLength = 0, this.dimension = 1, this.dtype = dl, this.persistentData = null, D.profile && (this.stats = { size: 0 });
      }
      ce.prototype.bind = function() {
        d.bindBuffer(this.type, this.buffer);
      }, ce.prototype.destroy = function() {
        Ne(this);
      };
      var ve = [];
      function Ae(H, se) {
        var ke = ve.pop();
        return ke || (ke = new ce(H)), ke.bind(), Me(ke, se, Rm, 0, 1, !1), ke;
      }
      function De(H) {
        ve.push(H);
      }
      function Fe(H, se, ke) {
        H.byteLength = se.byteLength, d.bufferData(H.type, se, ke);
      }
      function Me(H, se, ke, Ke, ge, Xe) {
        var ze;
        if (H.usage = ke, Array.isArray(se)) {
          if (H.dtype = Ke || pl, se.length > 0) {
            var dt;
            if (Array.isArray(se[0])) {
              ze = Ju(se);
              for (var he = 1, fe = 1; fe < ze.length; ++fe)
                he *= ze[fe];
              H.dimension = he, dt = fl(se, ze, H.dtype), Fe(H, dt, ke), Xe ? H.persistentData = dt : Ct.freeType(dt);
            } else if (typeof se[0] == "number") {
              H.dimension = ge;
              var Je = Ct.allocType(H.dtype, se.length);
              tf(Je, se), Fe(H, Je, ke), Xe ? H.persistentData = Je : Ct.freeType(Je);
            } else r(se[0]) ? (H.dimension = se[0].length, H.dtype = Ke || A0(se[0]) || pl, dt = fl(
              se,
              [se.length, se[0].length],
              H.dtype
            ), Fe(H, dt, ke), Xe ? H.persistentData = dt : Ct.freeType(dt)) : b.raise("invalid buffer data");
          }
        } else if (r(se))
          H.dtype = Ke || A0(se), H.dimension = ge, Fe(H, se, ke), Xe && (H.persistentData = new Uint8Array(new Uint8Array(se.buffer)));
        else if (pn(se)) {
          ze = se.shape;
          var Ge = se.stride, Ee = se.offset, qe = 0, $e = 0, Tt = 0, gt = 0;
          ze.length === 1 ? (qe = ze[0], $e = 1, Tt = Ge[0], gt = 0) : ze.length === 2 ? (qe = ze[0], $e = ze[1], Tt = Ge[0], gt = Ge[1]) : b.raise("invalid shape"), H.dtype = Ke || A0(se.data) || pl, H.dimension = $e;
          var je = Ct.allocType(H.dtype, qe * $e);
          rf(
            je,
            se.data,
            qe,
            $e,
            Tt,
            gt,
            Ee
          ), Fe(H, je, ke), Xe ? H.persistentData = je : Ct.freeType(je);
        } else se instanceof ArrayBuffer ? (H.dtype = dl, H.dimension = ge, Fe(H, se, ke), Xe && (H.persistentData = new Uint8Array(new Uint8Array(se)))) : b.raise("invalid buffer data");
      }
      function Ne(H) {
        g.bufferCount--, te(H);
        var se = H.buffer;
        b(se, "buffer must not be deleted already"), d.deleteBuffer(se), H.buffer = null, delete ee[H.id];
      }
      function xe(H, se, ke, Ke) {
        g.bufferCount++;
        var ge = new ce(se);
        ee[ge.id] = ge;
        function Xe(he) {
          var fe = ef, Je = null, Ge = 0, Ee = 0, qe = 1;
          return Array.isArray(he) || r(he) || pn(he) || he instanceof ArrayBuffer ? Je = he : typeof he == "number" ? Ge = he | 0 : he && (b.type(
            he,
            "object",
            "buffer arguments must be an object, a number or an array"
          ), "data" in he && (b(
            Je === null || Array.isArray(Je) || r(Je) || pn(Je),
            "invalid data for buffer"
          ), Je = he.data), "usage" in he && (b.parameter(he.usage, g0, "invalid buffer usage"), fe = g0[he.usage]), "type" in he && (b.parameter(he.type, _o, "invalid buffer type"), Ee = _o[he.type]), "dimension" in he && (b.type(he.dimension, "number", "invalid dimension"), qe = he.dimension | 0), "length" in he && (b.nni(Ge, "buffer length must be a nonnegative integer"), Ge = he.length | 0)), ge.bind(), Je ? Me(ge, Je, fe, Ee, qe, Ke) : (Ge && d.bufferData(ge.type, Ge, fe), ge.dtype = Ee || dl, ge.usage = fe, ge.dimension = qe, ge.byteLength = Ge), D.profile && (ge.stats.size = ge.byteLength * ro[ge.dtype]), Xe;
        }
        function ze(he, fe) {
          b(
            fe + he.byteLength <= ge.byteLength,
            "invalid buffer subdata call, buffer is too small.  Can't write data of size " + he.byteLength + " starting from offset " + fe + " to a buffer of size " + ge.byteLength
          ), d.bufferSubData(ge.type, fe, he);
        }
        function dt(he, fe) {
          var Je = (fe || 0) | 0, Ge;
          if (ge.bind(), r(he) || he instanceof ArrayBuffer)
            ze(he, Je);
          else if (Array.isArray(he)) {
            if (he.length > 0)
              if (typeof he[0] == "number") {
                var Ee = Ct.allocType(ge.dtype, he.length);
                tf(Ee, he), ze(Ee, Je), Ct.freeType(Ee);
              } else if (Array.isArray(he[0]) || r(he[0])) {
                Ge = Ju(he);
                var qe = fl(he, Ge, ge.dtype);
                ze(qe, Je), Ct.freeType(qe);
              } else
                b.raise("invalid buffer data");
          } else if (pn(he)) {
            Ge = he.shape;
            var $e = he.stride, Tt = 0, gt = 0, je = 0, Ye = 0;
            Ge.length === 1 ? (Tt = Ge[0], gt = 1, je = $e[0], Ye = 0) : Ge.length === 2 ? (Tt = Ge[0], gt = Ge[1], je = $e[0], Ye = $e[1]) : b.raise("invalid shape");
            var mt = Array.isArray(he.data) ? ge.dtype : A0(he.data), _t = Ct.allocType(mt, Tt * gt);
            rf(
              _t,
              he.data,
              Tt,
              gt,
              je,
              Ye,
              he.offset
            ), ze(_t, Je), Ct.freeType(_t);
          } else
            b.raise("invalid data for buffer subdata");
          return Xe;
        }
        return ke || Xe(H), Xe._reglType = "buffer", Xe._buffer = ge, Xe.subdata = dt, D.profile && (Xe.stats = ge.stats), Xe.destroy = function() {
          Ne(ge);
        }, Xe;
      }
      function Te() {
        Qr(ee).forEach(function(H) {
          H.buffer = d.createBuffer(), d.bindBuffer(H.type, H.buffer), d.bufferData(
            H.type,
            H.persistentData || H.byteLength,
            H.usage
          );
        });
      }
      return D.profile && (g.getTotalBufferSize = function() {
        var H = 0;
        return Object.keys(ee).forEach(function(se) {
          H += ee[se].stats.size;
        }), H;
      }), {
        create: xe,
        createStream: Ae,
        destroyStream: De,
        clear: function() {
          Qr(ee).forEach(Ne), ve.forEach(Ne);
        },
        getBuffer: function(H) {
          return H && H._buffer instanceof ce ? H._buffer : null;
        },
        restore: Te,
        _initBuffer: Me
      };
    }
    var Pm = 0, Im = 0, Bm = 1, Nm = 1, Gm = 4, qm = 4, no = {
      points: Pm,
      point: Im,
      lines: Bm,
      line: Nm,
      triangles: Gm,
      triangle: qm,
      "line loop": 2,
      "line strip": 3,
      "triangle strip": 5,
      "triangle fan": 6
    }, $m = 0, zm = 1, ai = 4, jm = 5120, ta = 5121, nf = 5122, ra = 5123, of = 5124, Eo = 5125, hl = 34963, Hm = 35040, Um = 35044;
    function Vm(d, g, D, te) {
      var de = {}, ee = 0, ce = {
        uint8: ta,
        uint16: ra
      };
      g.oes_element_index_uint && (ce.uint32 = Eo);
      function ve(Te) {
        this.id = ee++, de[this.id] = this, this.buffer = Te, this.primType = ai, this.vertCount = 0, this.type = 0;
      }
      ve.prototype.bind = function() {
        this.buffer.bind();
      };
      var Ae = [];
      function De(Te) {
        var H = Ae.pop();
        return H || (H = new ve(D.create(
          null,
          hl,
          !0,
          !1
        )._buffer)), Me(H, Te, Hm, -1, -1, 0, 0), H;
      }
      function Fe(Te) {
        Ae.push(Te);
      }
      function Me(Te, H, se, ke, Ke, ge, Xe) {
        Te.buffer.bind();
        var ze;
        if (H) {
          var dt = Xe;
          !Xe && (!r(H) || pn(H) && !r(H.data)) && (dt = g.oes_element_index_uint ? Eo : ra), D._initBuffer(
            Te.buffer,
            H,
            se,
            dt,
            3
          );
        } else
          d.bufferData(hl, ge, se), Te.buffer.dtype = ze || ta, Te.buffer.usage = se, Te.buffer.dimension = 3, Te.buffer.byteLength = ge;
        if (ze = Xe, !Xe) {
          switch (Te.buffer.dtype) {
            case ta:
            case jm:
              ze = ta;
              break;
            case ra:
            case nf:
              ze = ra;
              break;
            case Eo:
            case of:
              ze = Eo;
              break;
            default:
              b.raise("unsupported type for element array");
          }
          Te.buffer.dtype = ze;
        }
        Te.type = ze, b(
          ze !== Eo || !!g.oes_element_index_uint,
          "32 bit element buffers not supported, enable oes_element_index_uint first"
        );
        var he = Ke;
        he < 0 && (he = Te.buffer.byteLength, ze === ra ? he >>= 1 : ze === Eo && (he >>= 2)), Te.vertCount = he;
        var fe = ke;
        if (ke < 0) {
          fe = ai;
          var Je = Te.buffer.dimension;
          Je === 1 && (fe = $m), Je === 2 && (fe = zm), Je === 3 && (fe = ai);
        }
        Te.primType = fe;
      }
      function Ne(Te) {
        te.elementsCount--, b(Te.buffer !== null, "must not double destroy elements"), delete de[Te.id], Te.buffer.destroy(), Te.buffer = null;
      }
      function xe(Te, H) {
        var se = D.create(null, hl, !0), ke = new ve(se._buffer);
        te.elementsCount++;
        function Ke(ge) {
          if (!ge)
            se(), ke.primType = ai, ke.vertCount = 0, ke.type = ta;
          else if (typeof ge == "number")
            se(ge), ke.primType = ai, ke.vertCount = ge | 0, ke.type = ta;
          else {
            var Xe = null, ze = Um, dt = -1, he = -1, fe = 0, Je = 0;
            Array.isArray(ge) || r(ge) || pn(ge) ? Xe = ge : (b.type(ge, "object", "invalid arguments for elements"), "data" in ge && (Xe = ge.data, b(
              Array.isArray(Xe) || r(Xe) || pn(Xe),
              "invalid data for element buffer"
            )), "usage" in ge && (b.parameter(
              ge.usage,
              g0,
              "invalid element buffer usage"
            ), ze = g0[ge.usage]), "primitive" in ge && (b.parameter(
              ge.primitive,
              no,
              "invalid element buffer primitive"
            ), dt = no[ge.primitive]), "count" in ge && (b(
              typeof ge.count == "number" && ge.count >= 0,
              "invalid vertex count for elements"
            ), he = ge.count | 0), "type" in ge && (b.parameter(
              ge.type,
              ce,
              "invalid buffer type"
            ), Je = ce[ge.type]), "length" in ge ? fe = ge.length | 0 : (fe = he, Je === ra || Je === nf ? fe *= 2 : (Je === Eo || Je === of) && (fe *= 4))), Me(
              ke,
              Xe,
              ze,
              dt,
              he,
              fe,
              Je
            );
          }
          return Ke;
        }
        return Ke(Te), Ke._reglType = "elements", Ke._elements = ke, Ke.subdata = function(ge, Xe) {
          return se.subdata(ge, Xe), Ke;
        }, Ke.destroy = function() {
          Ne(ke);
        }, Ke;
      }
      return {
        create: xe,
        createStream: De,
        destroyStream: Fe,
        getElements: function(Te) {
          return typeof Te == "function" && Te._elements instanceof ve ? Te._elements : null;
        },
        clear: function() {
          Qr(de).forEach(Ne);
        }
      };
    }
    var af = new Float32Array(1), Wm = new Uint32Array(af.buffer), Xm = 5123;
    function sf(d) {
      for (var g = Ct.allocType(Xm, d.length), D = 0; D < d.length; ++D)
        if (isNaN(d[D]))
          g[D] = 65535;
        else if (d[D] === 1 / 0)
          g[D] = 31744;
        else if (d[D] === -1 / 0)
          g[D] = 64512;
        else {
          af[0] = d[D];
          var te = Wm[0], de = te >>> 31 << 15, ee = (te << 1 >>> 24) - 127, ce = te >> 13 & 1023;
          if (ee < -24)
            g[D] = de;
          else if (ee < -14) {
            var ve = -14 - ee;
            g[D] = de + (ce + 1024 >> ve);
          } else ee > 15 ? g[D] = de + 31744 : g[D] = de + (ee + 15 << 10) + ce;
        }
      return g;
    }
    function pr(d) {
      return Array.isArray(d) || r(d);
    }
    var lf = function(d) {
      return !(d & d - 1) && !!d;
    }, Ym = 34467, _n = 3553, ml = 34067, v0 = 34069, So = 6408, yl = 6406, w0 = 6407, ii = 6409, x0 = 6410, cf = 32854, bl = 32855, uf = 36194, Km = 32819, Zm = 32820, Qm = 33635, Jm = 34042, gl = 6402, _0 = 34041, Al = 35904, vl = 35906, na = 36193, wl = 33776, xl = 33777, _l = 33778, El = 33779, ff = 35986, df = 35987, pf = 34798, hf = 35840, mf = 35841, yf = 35842, bf = 35843, gf = 36196, oa = 5121, Sl = 5123, kl = 5125, si = 5126, e5 = 10242, t5 = 10243, r5 = 10497, Tl = 33071, n5 = 33648, o5 = 10240, a5 = 10241, Dl = 9728, i5 = 9729, Ml = 9984, Af = 9985, vf = 9986, Cl = 9987, s5 = 33170, E0 = 4352, l5 = 4353, c5 = 4354, u5 = 34046, f5 = 3317, d5 = 37440, p5 = 37441, h5 = 37443, wf = 37444, li = 33984, m5 = [
      Ml,
      vf,
      Af,
      Cl
    ], S0 = [
      0,
      ii,
      x0,
      w0,
      So
    ], on = {};
    on[ii] = on[yl] = on[gl] = 1, on[_0] = on[x0] = 2, on[w0] = on[Al] = 3, on[So] = on[vl] = 4;
    function aa(d) {
      return "[object " + d + "]";
    }
    var xf = aa("HTMLCanvasElement"), _f = aa("OffscreenCanvas"), Ef = aa("CanvasRenderingContext2D"), Sf = aa("ImageBitmap"), kf = aa("HTMLImageElement"), Tf = aa("HTMLVideoElement"), y5 = Object.keys(ul).concat([
      xf,
      _f,
      Ef,
      Sf,
      kf,
      Tf
    ]), ia = [];
    ia[oa] = 1, ia[si] = 4, ia[na] = 2, ia[Sl] = 2, ia[kl] = 4;
    var Pr = [];
    Pr[cf] = 2, Pr[bl] = 2, Pr[uf] = 2, Pr[_0] = 4, Pr[wl] = 0.5, Pr[xl] = 0.5, Pr[_l] = 1, Pr[El] = 1, Pr[ff] = 0.5, Pr[df] = 1, Pr[pf] = 1, Pr[hf] = 0.5, Pr[mf] = 0.25, Pr[yf] = 0.5, Pr[bf] = 0.25, Pr[gf] = 0.5;
    function Df(d) {
      return Array.isArray(d) && (d.length === 0 || typeof d[0] == "number");
    }
    function Mf(d) {
      if (!Array.isArray(d))
        return !1;
      var g = d.length;
      return !(g === 0 || !pr(d[0]));
    }
    function ko(d) {
      return Object.prototype.toString.call(d);
    }
    function Cf(d) {
      return ko(d) === xf;
    }
    function Lf(d) {
      return ko(d) === _f;
    }
    function b5(d) {
      return ko(d) === Ef;
    }
    function g5(d) {
      return ko(d) === Sf;
    }
    function A5(d) {
      return ko(d) === kf;
    }
    function v5(d) {
      return ko(d) === Tf;
    }
    function Ll(d) {
      if (!d)
        return !1;
      var g = ko(d);
      return y5.indexOf(g) >= 0 ? !0 : Df(d) || Mf(d) || pn(d);
    }
    function Ff(d) {
      return ul[Object.prototype.toString.call(d)] | 0;
    }
    function w5(d, g) {
      var D = g.length;
      switch (d.type) {
        case oa:
        case Sl:
        case kl:
        case si:
          var te = Ct.allocType(d.type, D);
          te.set(g), d.data = te;
          break;
        case na:
          d.data = sf(g);
          break;
        default:
          b.raise("unsupported texture type, must specify a typed array");
      }
    }
    function Rf(d, g) {
      return Ct.allocType(
        d.type === na ? si : d.type,
        g
      );
    }
    function Of(d, g) {
      d.type === na ? (d.data = sf(g), Ct.freeType(g)) : d.data = g;
    }
    function x5(d, g, D, te, de, ee) {
      for (var ce = d.width, ve = d.height, Ae = d.channels, De = ce * ve * Ae, Fe = Rf(d, De), Me = 0, Ne = 0; Ne < ve; ++Ne)
        for (var xe = 0; xe < ce; ++xe)
          for (var Te = 0; Te < Ae; ++Te)
            Fe[Me++] = g[D * xe + te * Ne + de * Te + ee];
      Of(d, Fe);
    }
    function k0(d, g, D, te, de, ee) {
      var ce;
      if (typeof Pr[d] < "u" ? ce = Pr[d] : ce = on[d] * ia[g], ee && (ce *= 6), de) {
        for (var ve = 0, Ae = D; Ae >= 1; )
          ve += ce * Ae * Ae, Ae /= 2;
        return ve;
      } else
        return ce * D * te;
    }
    function _5(d, g, D, te, de, ee, ce) {
      var ve = {
        "don't care": E0,
        "dont care": E0,
        nice: c5,
        fast: l5
      }, Ae = {
        repeat: r5,
        clamp: Tl,
        mirror: n5
      }, De = {
        nearest: Dl,
        linear: i5
      }, Fe = n({
        mipmap: Cl,
        "nearest mipmap nearest": Ml,
        "linear mipmap nearest": Af,
        "nearest mipmap linear": vf,
        "linear mipmap linear": Cl
      }, De), Me = {
        none: 0,
        browser: wf
      }, Ne = {
        uint8: oa,
        rgba4: Km,
        rgb565: Qm,
        "rgb5 a1": Zm
      }, xe = {
        alpha: yl,
        luminance: ii,
        "luminance alpha": x0,
        rgb: w0,
        rgba: So,
        rgba4: cf,
        "rgb5 a1": bl,
        rgb565: uf
      }, Te = {};
      g.ext_srgb && (xe.srgb = Al, xe.srgba = vl), g.oes_texture_float && (Ne.float32 = Ne.float = si), g.oes_texture_half_float && (Ne.float16 = Ne["half float"] = na), g.webgl_depth_texture && (n(xe, {
        depth: gl,
        "depth stencil": _0
      }), n(Ne, {
        uint16: Sl,
        uint32: kl,
        "depth stencil": Jm
      })), g.webgl_compressed_texture_s3tc && n(Te, {
        "rgb s3tc dxt1": wl,
        "rgba s3tc dxt1": xl,
        "rgba s3tc dxt3": _l,
        "rgba s3tc dxt5": El
      }), g.webgl_compressed_texture_atc && n(Te, {
        "rgb atc": ff,
        "rgba atc explicit alpha": df,
        "rgba atc interpolated alpha": pf
      }), g.webgl_compressed_texture_pvrtc && n(Te, {
        "rgb pvrtc 4bppv1": hf,
        "rgb pvrtc 2bppv1": mf,
        "rgba pvrtc 4bppv1": yf,
        "rgba pvrtc 2bppv1": bf
      }), g.webgl_compressed_texture_etc1 && (Te["rgb etc1"] = gf);
      var H = Array.prototype.slice.call(
        d.getParameter(Ym)
      );
      Object.keys(Te).forEach(function(k) {
        var ne = Te[k];
        H.indexOf(ne) >= 0 && (xe[k] = ne);
      });
      var se = Object.keys(xe);
      D.textureFormats = se;
      var ke = [];
      Object.keys(xe).forEach(function(k) {
        var ne = xe[k];
        ke[ne] = k;
      });
      var Ke = [];
      Object.keys(Ne).forEach(function(k) {
        var ne = Ne[k];
        Ke[ne] = k;
      });
      var ge = [];
      Object.keys(De).forEach(function(k) {
        var ne = De[k];
        ge[ne] = k;
      });
      var Xe = [];
      Object.keys(Fe).forEach(function(k) {
        var ne = Fe[k];
        Xe[ne] = k;
      });
      var ze = [];
      Object.keys(Ae).forEach(function(k) {
        var ne = Ae[k];
        ze[ne] = k;
      });
      var dt = se.reduce(function(k, ne) {
        var Z = xe[ne];
        return Z === ii || Z === yl || Z === ii || Z === x0 || Z === gl || Z === _0 || g.ext_srgb && (Z === Al || Z === vl) ? k[Z] = Z : Z === bl || ne.indexOf("rgba") >= 0 ? k[Z] = So : k[Z] = w0, k;
      }, {});
      function he() {
        this.internalformat = So, this.format = So, this.type = oa, this.compressed = !1, this.premultiplyAlpha = !1, this.flipY = !1, this.unpackAlignment = 1, this.colorSpace = wf, this.width = 0, this.height = 0, this.channels = 0;
      }
      function fe(k, ne) {
        k.internalformat = ne.internalformat, k.format = ne.format, k.type = ne.type, k.compressed = ne.compressed, k.premultiplyAlpha = ne.premultiplyAlpha, k.flipY = ne.flipY, k.unpackAlignment = ne.unpackAlignment, k.colorSpace = ne.colorSpace, k.width = ne.width, k.height = ne.height, k.channels = ne.channels;
      }
      function Je(k, ne) {
        if (!(typeof ne != "object" || !ne)) {
          if ("premultiplyAlpha" in ne && (b.type(
            ne.premultiplyAlpha,
            "boolean",
            "invalid premultiplyAlpha"
          ), k.premultiplyAlpha = ne.premultiplyAlpha), "flipY" in ne && (b.type(
            ne.flipY,
            "boolean",
            "invalid texture flip"
          ), k.flipY = ne.flipY), "alignment" in ne && (b.oneOf(
            ne.alignment,
            [1, 2, 4, 8],
            "invalid texture unpack alignment"
          ), k.unpackAlignment = ne.alignment), "colorSpace" in ne && (b.parameter(
            ne.colorSpace,
            Me,
            "invalid colorSpace"
          ), k.colorSpace = Me[ne.colorSpace]), "type" in ne) {
            var Z = ne.type;
            b(
              g.oes_texture_float || !(Z === "float" || Z === "float32"),
              "you must enable the OES_texture_float extension in order to use floating point textures."
            ), b(
              g.oes_texture_half_float || !(Z === "half float" || Z === "float16"),
              "you must enable the OES_texture_half_float extension in order to use 16-bit floating point textures."
            ), b(
              g.webgl_depth_texture || !(Z === "uint16" || Z === "uint32" || Z === "depth stencil"),
              "you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures."
            ), b.parameter(
              Z,
              Ne,
              "invalid texture type"
            ), k.type = Ne[Z];
          }
          var Qe = k.width, Lt = k.height, x = k.channels, y = !1;
          "shape" in ne ? (b(
            Array.isArray(ne.shape) && ne.shape.length >= 2,
            "shape must be an array"
          ), Qe = ne.shape[0], Lt = ne.shape[1], ne.shape.length === 3 && (x = ne.shape[2], b(x > 0 && x <= 4, "invalid number of channels"), y = !0), b(Qe >= 0 && Qe <= D.maxTextureSize, "invalid width"), b(Lt >= 0 && Lt <= D.maxTextureSize, "invalid height")) : ("radius" in ne && (Qe = Lt = ne.radius, b(Qe >= 0 && Qe <= D.maxTextureSize, "invalid radius")), "width" in ne && (Qe = ne.width, b(Qe >= 0 && Qe <= D.maxTextureSize, "invalid width")), "height" in ne && (Lt = ne.height, b(Lt >= 0 && Lt <= D.maxTextureSize, "invalid height")), "channels" in ne && (x = ne.channels, b(x > 0 && x <= 4, "invalid number of channels"), y = !0)), k.width = Qe | 0, k.height = Lt | 0, k.channels = x | 0;
          var L = !1;
          if ("format" in ne) {
            var $ = ne.format;
            b(
              g.webgl_depth_texture || !($ === "depth" || $ === "depth stencil"),
              "you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures."
            ), b.parameter(
              $,
              xe,
              "invalid texture format"
            );
            var W = k.internalformat = xe[$];
            k.format = dt[W], $ in Ne && ("type" in ne || (k.type = Ne[$])), $ in Te && (k.compressed = !0), L = !0;
          }
          !y && L ? k.channels = on[k.format] : y && !L ? k.channels !== S0[k.format] && (k.format = k.internalformat = S0[k.channels]) : L && y && b(
            k.channels === on[k.format],
            "number of channels inconsistent with specified format"
          );
        }
      }
      function Ge(k) {
        d.pixelStorei(d5, k.flipY), d.pixelStorei(p5, k.premultiplyAlpha), d.pixelStorei(h5, k.colorSpace), d.pixelStorei(f5, k.unpackAlignment);
      }
      function Ee() {
        he.call(this), this.xOffset = 0, this.yOffset = 0, this.data = null, this.needsFree = !1, this.element = null, this.needsCopy = !1;
      }
      function qe(k, ne) {
        var Z = null;
        if (Ll(ne) ? Z = ne : ne && (b.type(ne, "object", "invalid pixel data type"), Je(k, ne), "x" in ne && (k.xOffset = ne.x | 0), "y" in ne && (k.yOffset = ne.y | 0), Ll(ne.data) && (Z = ne.data)), b(
          !k.compressed || Z instanceof Uint8Array,
          "compressed texture data must be stored in a uint8array"
        ), ne.copy) {
          b(!Z, "can not specify copy and data field for the same texture");
          var Qe = de.viewportWidth, Lt = de.viewportHeight;
          k.width = k.width || Qe - k.xOffset, k.height = k.height || Lt - k.yOffset, k.needsCopy = !0, b(
            k.xOffset >= 0 && k.xOffset < Qe && k.yOffset >= 0 && k.yOffset < Lt && k.width > 0 && k.width <= Qe && k.height > 0 && k.height <= Lt,
            "copy texture read out of bounds"
          );
        } else if (!Z)
          k.width = k.width || 1, k.height = k.height || 1, k.channels = k.channels || 4;
        else if (r(Z))
          k.channels = k.channels || 4, k.data = Z, !("type" in ne) && k.type === oa && (k.type = Ff(Z));
        else if (Df(Z))
          k.channels = k.channels || 4, w5(k, Z), k.alignment = 1, k.needsFree = !0;
        else if (pn(Z)) {
          var x = Z.data;
          !Array.isArray(x) && k.type === oa && (k.type = Ff(x));
          var y = Z.shape, L = Z.stride, $, W, I, P, q, v;
          y.length === 3 ? (I = y[2], v = L[2]) : (b(y.length === 2, "invalid ndarray pixel data, must be 2 or 3D"), I = 1, v = 1), $ = y[0], W = y[1], P = L[0], q = L[1], k.alignment = 1, k.width = $, k.height = W, k.channels = I, k.format = k.internalformat = S0[I], k.needsFree = !0, x5(k, x, P, q, v, Z.offset);
        } else if (Cf(Z) || Lf(Z) || b5(Z))
          Cf(Z) || Lf(Z) ? k.element = Z : k.element = Z.canvas, k.width = k.element.width, k.height = k.element.height, k.channels = 4;
        else if (g5(Z))
          k.element = Z, k.width = Z.width, k.height = Z.height, k.channels = 4;
        else if (A5(Z))
          k.element = Z, k.width = Z.naturalWidth, k.height = Z.naturalHeight, k.channels = 4;
        else if (v5(Z))
          k.element = Z, k.width = Z.videoWidth, k.height = Z.videoHeight, k.channels = 4;
        else if (Mf(Z)) {
          var C = k.width || Z[0].length, S = k.height || Z.length, U = k.channels;
          pr(Z[0][0]) ? U = U || Z[0][0].length : U = U || 1;
          for (var Y = b0.shape(Z), ye = 1, Pe = 0; Pe < Y.length; ++Pe)
            ye *= Y[Pe];
          var Ie = Rf(k, ye);
          b0.flatten(Z, Y, "", Ie), Of(k, Ie), k.alignment = 1, k.width = C, k.height = S, k.channels = U, k.format = k.internalformat = S0[U], k.needsFree = !0;
        }
        k.type === si ? b(
          D.extensions.indexOf("oes_texture_float") >= 0,
          "oes_texture_float extension not enabled"
        ) : k.type === na && b(
          D.extensions.indexOf("oes_texture_half_float") >= 0,
          "oes_texture_half_float extension not enabled"
        );
      }
      function $e(k, ne, Z) {
        var Qe = k.element, Lt = k.data, x = k.internalformat, y = k.format, L = k.type, $ = k.width, W = k.height;
        Ge(k), Qe ? d.texImage2D(ne, Z, y, y, L, Qe) : k.compressed ? d.compressedTexImage2D(ne, Z, x, $, W, 0, Lt) : k.needsCopy ? (te(), d.copyTexImage2D(
          ne,
          Z,
          y,
          k.xOffset,
          k.yOffset,
          $,
          W,
          0
        )) : d.texImage2D(ne, Z, y, $, W, 0, y, L, Lt || null);
      }
      function Tt(k, ne, Z, Qe, Lt) {
        var x = k.element, y = k.data, L = k.internalformat, $ = k.format, W = k.type, I = k.width, P = k.height;
        Ge(k), x ? d.texSubImage2D(
          ne,
          Lt,
          Z,
          Qe,
          $,
          W,
          x
        ) : k.compressed ? d.compressedTexSubImage2D(
          ne,
          Lt,
          Z,
          Qe,
          L,
          I,
          P,
          y
        ) : k.needsCopy ? (te(), d.copyTexSubImage2D(
          ne,
          Lt,
          Z,
          Qe,
          k.xOffset,
          k.yOffset,
          I,
          P
        )) : d.texSubImage2D(
          ne,
          Lt,
          Z,
          Qe,
          I,
          P,
          $,
          W,
          y
        );
      }
      var gt = [];
      function je() {
        return gt.pop() || new Ee();
      }
      function Ye(k) {
        k.needsFree && Ct.freeType(k.data), Ee.call(k), gt.push(k);
      }
      function mt() {
        he.call(this), this.genMipmaps = !1, this.mipmapHint = E0, this.mipmask = 0, this.images = Array(16);
      }
      function _t(k, ne, Z) {
        var Qe = k.images[0] = je();
        k.mipmask = 1, Qe.width = k.width = ne, Qe.height = k.height = Z, Qe.channels = k.channels = 4;
      }
      function Rt(k, ne) {
        var Z = null;
        if (Ll(ne))
          Z = k.images[0] = je(), fe(Z, k), qe(Z, ne), k.mipmask = 1;
        else if (Je(k, ne), Array.isArray(ne.mipmap))
          for (var Qe = ne.mipmap, Lt = 0; Lt < Qe.length; ++Lt)
            Z = k.images[Lt] = je(), fe(Z, k), Z.width >>= Lt, Z.height >>= Lt, qe(Z, Qe[Lt]), k.mipmask |= 1 << Lt;
        else
          Z = k.images[0] = je(), fe(Z, k), qe(Z, ne), k.mipmask = 1;
        fe(k, k.images[0]), k.compressed && (k.internalformat === wl || k.internalformat === xl || k.internalformat === _l || k.internalformat === El) && b(
          k.width % 4 === 0 && k.height % 4 === 0,
          "for compressed texture formats, mipmap level 0 must have width and height that are a multiple of 4"
        );
      }
      function ir(k, ne) {
        for (var Z = k.images, Qe = 0; Qe < Z.length; ++Qe) {
          if (!Z[Qe])
            return;
          $e(Z[Qe], ne, Qe);
        }
      }
      var sr = [];
      function Pt() {
        var k = sr.pop() || new mt();
        he.call(k), k.mipmask = 0;
        for (var ne = 0; ne < 16; ++ne)
          k.images[ne] = null;
        return k;
      }
      function vr(k) {
        for (var ne = k.images, Z = 0; Z < ne.length; ++Z)
          ne[Z] && Ye(ne[Z]), ne[Z] = null;
        sr.push(k);
      }
      function er() {
        this.minFilter = Dl, this.magFilter = Dl, this.wrapS = Tl, this.wrapT = Tl, this.anisotropic = 1, this.genMipmaps = !1, this.mipmapHint = E0;
      }
      function Ar(k, ne) {
        if ("min" in ne) {
          var Z = ne.min;
          b.parameter(Z, Fe), k.minFilter = Fe[Z], m5.indexOf(k.minFilter) >= 0 && !("faces" in ne) && (k.genMipmaps = !0);
        }
        if ("mag" in ne) {
          var Qe = ne.mag;
          b.parameter(Qe, De), k.magFilter = De[Qe];
        }
        var Lt = k.wrapS, x = k.wrapT;
        if ("wrap" in ne) {
          var y = ne.wrap;
          typeof y == "string" ? (b.parameter(y, Ae), Lt = x = Ae[y]) : Array.isArray(y) && (b.parameter(y[0], Ae), b.parameter(y[1], Ae), Lt = Ae[y[0]], x = Ae[y[1]]);
        } else {
          if ("wrapS" in ne) {
            var L = ne.wrapS;
            b.parameter(L, Ae), Lt = Ae[L];
          }
          if ("wrapT" in ne) {
            var $ = ne.wrapT;
            b.parameter($, Ae), x = Ae[$];
          }
        }
        if (k.wrapS = Lt, k.wrapT = x, "anisotropic" in ne) {
          var W = ne.anisotropic;
          b(
            typeof W == "number" && W >= 1 && W <= D.maxAnisotropic,
            "aniso samples must be between 1 and "
          ), k.anisotropic = ne.anisotropic;
        }
        if ("mipmap" in ne) {
          var I = !1;
          switch (typeof ne.mipmap) {
            case "string":
              b.parameter(
                ne.mipmap,
                ve,
                "invalid mipmap hint"
              ), k.mipmapHint = ve[ne.mipmap], k.genMipmaps = !0, I = !0;
              break;
            case "boolean":
              I = k.genMipmaps = ne.mipmap;
              break;
            case "object":
              b(Array.isArray(ne.mipmap), "invalid mipmap type"), k.genMipmaps = !1, I = !0;
              break;
            default:
              b.raise("invalid mipmap type");
          }
          I && !("min" in ne) && (k.minFilter = Ml);
        }
      }
      function wr(k, ne) {
        d.texParameteri(ne, a5, k.minFilter), d.texParameteri(ne, o5, k.magFilter), d.texParameteri(ne, e5, k.wrapS), d.texParameteri(ne, t5, k.wrapT), g.ext_texture_filter_anisotropic && d.texParameteri(ne, u5, k.anisotropic), k.genMipmaps && (d.hint(s5, k.mipmapHint), d.generateMipmap(ne));
      }
      var xr = 0, Cr = {}, Ir = D.maxTextureUnits, hr = Array(Ir).map(function() {
        return null;
      });
      function Dt(k) {
        he.call(this), this.mipmask = 0, this.internalformat = So, this.id = xr++, this.refCount = 1, this.target = k, this.texture = d.createTexture(), this.unit = -1, this.bindCount = 0, this.texInfo = new er(), ce.profile && (this.stats = { size: 0 });
      }
      function Br(k) {
        d.activeTexture(li), d.bindTexture(k.target, k.texture);
      }
      function Ht() {
        var k = hr[0];
        k ? d.bindTexture(k.target, k.texture) : d.bindTexture(_n, null);
      }
      function ht(k) {
        var ne = k.texture;
        b(ne, "must not double destroy texture");
        var Z = k.unit, Qe = k.target;
        Z >= 0 && (d.activeTexture(li + Z), d.bindTexture(Qe, null), hr[Z] = null), d.deleteTexture(ne), k.texture = null, k.params = null, k.pixels = null, k.refCount = 0, delete Cr[k.id], ee.textureCount--;
      }
      n(Dt.prototype, {
        bind: function() {
          var k = this;
          k.bindCount += 1;
          var ne = k.unit;
          if (ne < 0) {
            for (var Z = 0; Z < Ir; ++Z) {
              var Qe = hr[Z];
              if (Qe) {
                if (Qe.bindCount > 0)
                  continue;
                Qe.unit = -1;
              }
              hr[Z] = k, ne = Z;
              break;
            }
            ne >= Ir && b.raise("insufficient number of texture units"), ce.profile && ee.maxTextureUnits < ne + 1 && (ee.maxTextureUnits = ne + 1), k.unit = ne, d.activeTexture(li + ne), d.bindTexture(k.target, k.texture);
          }
          return ne;
        },
        unbind: function() {
          this.bindCount -= 1;
        },
        decRef: function() {
          --this.refCount <= 0 && ht(this);
        }
      });
      function Ot(k, ne) {
        var Z = new Dt(_n);
        Cr[Z.id] = Z, ee.textureCount++;
        function Qe(y, L) {
          var $ = Z.texInfo;
          er.call($);
          var W = Pt();
          return typeof y == "number" ? typeof L == "number" ? _t(W, y | 0, L | 0) : _t(W, y | 0, y | 0) : y ? (b.type(y, "object", "invalid arguments to regl.texture"), Ar($, y), Rt(W, y)) : _t(W, 1, 1), $.genMipmaps && (W.mipmask = (W.width << 1) - 1), Z.mipmask = W.mipmask, fe(Z, W), b.texture2D($, W, D), Z.internalformat = W.internalformat, Qe.width = W.width, Qe.height = W.height, Br(Z), ir(W, _n), wr($, _n), Ht(), vr(W), ce.profile && (Z.stats.size = k0(
            Z.internalformat,
            Z.type,
            W.width,
            W.height,
            $.genMipmaps,
            !1
          )), Qe.format = ke[Z.internalformat], Qe.type = Ke[Z.type], Qe.mag = ge[$.magFilter], Qe.min = Xe[$.minFilter], Qe.wrapS = ze[$.wrapS], Qe.wrapT = ze[$.wrapT], Qe;
        }
        function Lt(y, L, $, W) {
          b(!!y, "must specify image data");
          var I = L | 0, P = $ | 0, q = W | 0, v = je();
          return fe(v, Z), v.width = 0, v.height = 0, qe(v, y), v.width = v.width || (Z.width >> q) - I, v.height = v.height || (Z.height >> q) - P, b(
            Z.type === v.type && Z.format === v.format && Z.internalformat === v.internalformat,
            "incompatible format for texture.subimage"
          ), b(
            I >= 0 && P >= 0 && I + v.width <= Z.width && P + v.height <= Z.height,
            "texture.subimage write out of bounds"
          ), b(
            Z.mipmask & 1 << q,
            "missing mipmap data"
          ), b(
            v.data || v.element || v.needsCopy,
            "missing image data"
          ), Br(Z), Tt(v, _n, I, P, q), Ht(), Ye(v), Qe;
        }
        function x(y, L) {
          var $ = y | 0, W = L | 0 || $;
          if ($ === Z.width && W === Z.height)
            return Qe;
          Qe.width = Z.width = $, Qe.height = Z.height = W, Br(Z);
          for (var I = 0; Z.mipmask >> I; ++I) {
            var P = $ >> I, q = W >> I;
            if (!P || !q) break;
            d.texImage2D(
              _n,
              I,
              Z.format,
              P,
              q,
              0,
              Z.format,
              Z.type,
              null
            );
          }
          return Ht(), ce.profile && (Z.stats.size = k0(
            Z.internalformat,
            Z.type,
            $,
            W,
            !1,
            !1
          )), Qe;
        }
        return Qe(k, ne), Qe.subimage = Lt, Qe.resize = x, Qe._reglType = "texture2d", Qe._texture = Z, ce.profile && (Qe.stats = Z.stats), Qe.destroy = function() {
          Z.decRef();
        }, Qe;
      }
      function zt(k, ne, Z, Qe, Lt, x) {
        var y = new Dt(ml);
        Cr[y.id] = y, ee.cubeCount++;
        var L = new Array(6);
        function $(P, q, v, C, S, U) {
          var Y, ye = y.texInfo;
          for (er.call(ye), Y = 0; Y < 6; ++Y)
            L[Y] = Pt();
          if (typeof P == "number" || !P) {
            var Pe = P | 0 || 1;
            for (Y = 0; Y < 6; ++Y)
              _t(L[Y], Pe, Pe);
          } else if (typeof P == "object")
            if (q)
              Rt(L[0], P), Rt(L[1], q), Rt(L[2], v), Rt(L[3], C), Rt(L[4], S), Rt(L[5], U);
            else if (Ar(ye, P), Je(y, P), "faces" in P) {
              var Ie = P.faces;
              for (b(
                Array.isArray(Ie) && Ie.length === 6,
                "cube faces must be a length 6 array"
              ), Y = 0; Y < 6; ++Y)
                b(
                  typeof Ie[Y] == "object" && !!Ie[Y],
                  "invalid input for cube map face"
                ), fe(L[Y], y), Rt(L[Y], Ie[Y]);
            } else
              for (Y = 0; Y < 6; ++Y)
                Rt(L[Y], P);
          else
            b.raise("invalid arguments to cube map");
          for (fe(y, L[0]), b.optional(function() {
            D.npotTextureCube || b(lf(y.width) && lf(y.height), "your browser does not support non power or two texture dimensions");
          }), ye.genMipmaps ? y.mipmask = (L[0].width << 1) - 1 : y.mipmask = L[0].mipmask, b.textureCube(y, ye, L, D), y.internalformat = L[0].internalformat, $.width = L[0].width, $.height = L[0].height, Br(y), Y = 0; Y < 6; ++Y)
            ir(L[Y], v0 + Y);
          for (wr(ye, ml), Ht(), ce.profile && (y.stats.size = k0(
            y.internalformat,
            y.type,
            $.width,
            $.height,
            ye.genMipmaps,
            !0
          )), $.format = ke[y.internalformat], $.type = Ke[y.type], $.mag = ge[ye.magFilter], $.min = Xe[ye.minFilter], $.wrapS = ze[ye.wrapS], $.wrapT = ze[ye.wrapT], Y = 0; Y < 6; ++Y)
            vr(L[Y]);
          return $;
        }
        function W(P, q, v, C, S) {
          b(!!q, "must specify image data"), b(typeof P == "number" && P === (P | 0) && P >= 0 && P < 6, "invalid face");
          var U = v | 0, Y = C | 0, ye = S | 0, Pe = je();
          return fe(Pe, y), Pe.width = 0, Pe.height = 0, qe(Pe, q), Pe.width = Pe.width || (y.width >> ye) - U, Pe.height = Pe.height || (y.height >> ye) - Y, b(
            y.type === Pe.type && y.format === Pe.format && y.internalformat === Pe.internalformat,
            "incompatible format for texture.subimage"
          ), b(
            U >= 0 && Y >= 0 && U + Pe.width <= y.width && Y + Pe.height <= y.height,
            "texture.subimage write out of bounds"
          ), b(
            y.mipmask & 1 << ye,
            "missing mipmap data"
          ), b(
            Pe.data || Pe.element || Pe.needsCopy,
            "missing image data"
          ), Br(y), Tt(Pe, v0 + P, U, Y, ye), Ht(), Ye(Pe), $;
        }
        function I(P) {
          var q = P | 0;
          if (q !== y.width) {
            $.width = y.width = q, $.height = y.height = q, Br(y);
            for (var v = 0; v < 6; ++v)
              for (var C = 0; y.mipmask >> C; ++C)
                d.texImage2D(
                  v0 + v,
                  C,
                  y.format,
                  q >> C,
                  q >> C,
                  0,
                  y.format,
                  y.type,
                  null
                );
            return Ht(), ce.profile && (y.stats.size = k0(
              y.internalformat,
              y.type,
              $.width,
              $.height,
              !1,
              !0
            )), $;
          }
        }
        return $(k, ne, Z, Qe, Lt, x), $.subimage = W, $.resize = I, $._reglType = "textureCube", $._texture = y, ce.profile && ($.stats = y.stats), $.destroy = function() {
          y.decRef();
        }, $;
      }
      function mr() {
        for (var k = 0; k < Ir; ++k)
          d.activeTexture(li + k), d.bindTexture(_n, null), hr[k] = null;
        Qr(Cr).forEach(ht), ee.cubeCount = 0, ee.textureCount = 0;
      }
      ce.profile && (ee.getTotalTextureSize = function() {
        var k = 0;
        return Object.keys(Cr).forEach(function(ne) {
          k += Cr[ne].stats.size;
        }), k;
      });
      function Sn() {
        for (var k = 0; k < Ir; ++k) {
          var ne = hr[k];
          ne && (ne.bindCount = 0, ne.unit = -1, hr[k] = null);
        }
        Qr(Cr).forEach(function(Z) {
          Z.texture = d.createTexture(), d.bindTexture(Z.target, Z.texture);
          for (var Qe = 0; Qe < 32; ++Qe)
            if (Z.mipmask & 1 << Qe)
              if (Z.target === _n)
                d.texImage2D(
                  _n,
                  Qe,
                  Z.internalformat,
                  Z.width >> Qe,
                  Z.height >> Qe,
                  0,
                  Z.internalformat,
                  Z.type,
                  null
                );
              else
                for (var Lt = 0; Lt < 6; ++Lt)
                  d.texImage2D(
                    v0 + Lt,
                    Qe,
                    Z.internalformat,
                    Z.width >> Qe,
                    Z.height >> Qe,
                    0,
                    Z.internalformat,
                    Z.type,
                    null
                  );
          wr(Z.texInfo, Z.target);
        });
      }
      function Ro() {
        for (var k = 0; k < Ir; ++k) {
          var ne = hr[k];
          ne && (ne.bindCount = 0, ne.unit = -1, hr[k] = null), d.activeTexture(li + k), d.bindTexture(_n, null), d.bindTexture(ml, null);
        }
      }
      return {
        create2D: Ot,
        createCube: zt,
        clear: mr,
        getTexture: function(k) {
          return null;
        },
        restore: Sn,
        refresh: Ro
      };
    }
    var oo = 36161, T0 = 32854, Pf = 32855, If = 36194, Bf = 33189, Nf = 36168, Gf = 34041, qf = 35907, $f = 34836, zf = 34842, jf = 34843, hn = [];
    hn[T0] = 2, hn[Pf] = 2, hn[If] = 2, hn[Bf] = 2, hn[Nf] = 1, hn[Gf] = 4, hn[qf] = 4, hn[$f] = 16, hn[zf] = 8, hn[jf] = 6;
    function Hf(d, g, D) {
      return hn[d] * g * D;
    }
    var E5 = function(d, g, D, te, de) {
      var ee = {
        rgba4: T0,
        rgb565: If,
        "rgb5 a1": Pf,
        depth: Bf,
        stencil: Nf,
        "depth stencil": Gf
      };
      g.ext_srgb && (ee.srgba = qf), g.ext_color_buffer_half_float && (ee.rgba16f = zf, ee.rgb16f = jf), g.webgl_color_buffer_float && (ee.rgba32f = $f);
      var ce = [];
      Object.keys(ee).forEach(function(xe) {
        var Te = ee[xe];
        ce[Te] = xe;
      });
      var ve = 0, Ae = {};
      function De(xe) {
        this.id = ve++, this.refCount = 1, this.renderbuffer = xe, this.format = T0, this.width = 0, this.height = 0, de.profile && (this.stats = { size: 0 });
      }
      De.prototype.decRef = function() {
        --this.refCount <= 0 && Fe(this);
      };
      function Fe(xe) {
        var Te = xe.renderbuffer;
        b(Te, "must not double destroy renderbuffer"), d.bindRenderbuffer(oo, null), d.deleteRenderbuffer(Te), xe.renderbuffer = null, xe.refCount = 0, delete Ae[xe.id], te.renderbufferCount--;
      }
      function Me(xe, Te) {
        var H = new De(d.createRenderbuffer());
        Ae[H.id] = H, te.renderbufferCount++;
        function se(Ke, ge) {
          var Xe = 0, ze = 0, dt = T0;
          if (typeof Ke == "object" && Ke) {
            var he = Ke;
            if ("shape" in he) {
              var fe = he.shape;
              b(
                Array.isArray(fe) && fe.length >= 2,
                "invalid renderbuffer shape"
              ), Xe = fe[0] | 0, ze = fe[1] | 0;
            } else
              "radius" in he && (Xe = ze = he.radius | 0), "width" in he && (Xe = he.width | 0), "height" in he && (ze = he.height | 0);
            "format" in he && (b.parameter(
              he.format,
              ee,
              "invalid renderbuffer format"
            ), dt = ee[he.format]);
          } else typeof Ke == "number" ? (Xe = Ke | 0, typeof ge == "number" ? ze = ge | 0 : ze = Xe) : Ke ? b.raise("invalid arguments to renderbuffer constructor") : Xe = ze = 1;
          if (b(
            Xe > 0 && ze > 0 && Xe <= D.maxRenderbufferSize && ze <= D.maxRenderbufferSize,
            "invalid renderbuffer size"
          ), !(Xe === H.width && ze === H.height && dt === H.format))
            return se.width = H.width = Xe, se.height = H.height = ze, H.format = dt, d.bindRenderbuffer(oo, H.renderbuffer), d.renderbufferStorage(oo, dt, Xe, ze), b(
              d.getError() === 0,
              "invalid render buffer format"
            ), de.profile && (H.stats.size = Hf(H.format, H.width, H.height)), se.format = ce[H.format], se;
        }
        function ke(Ke, ge) {
          var Xe = Ke | 0, ze = ge | 0 || Xe;
          return Xe === H.width && ze === H.height || (b(
            Xe > 0 && ze > 0 && Xe <= D.maxRenderbufferSize && ze <= D.maxRenderbufferSize,
            "invalid renderbuffer size"
          ), se.width = H.width = Xe, se.height = H.height = ze, d.bindRenderbuffer(oo, H.renderbuffer), d.renderbufferStorage(oo, H.format, Xe, ze), b(
            d.getError() === 0,
            "invalid render buffer format"
          ), de.profile && (H.stats.size = Hf(
            H.format,
            H.width,
            H.height
          ))), se;
        }
        return se(xe, Te), se.resize = ke, se._reglType = "renderbuffer", se._renderbuffer = H, de.profile && (se.stats = H.stats), se.destroy = function() {
          H.decRef();
        }, se;
      }
      de.profile && (te.getTotalRenderbufferSize = function() {
        var xe = 0;
        return Object.keys(Ae).forEach(function(Te) {
          xe += Ae[Te].stats.size;
        }), xe;
      });
      function Ne() {
        Qr(Ae).forEach(function(xe) {
          xe.renderbuffer = d.createRenderbuffer(), d.bindRenderbuffer(oo, xe.renderbuffer), d.renderbufferStorage(oo, xe.format, xe.width, xe.height);
        }), d.bindRenderbuffer(oo, null);
      }
      return {
        create: Me,
        clear: function() {
          Qr(Ae).forEach(Fe);
        },
        restore: Ne
      };
    }, Nn = 36160, Fl = 36161, To = 3553, D0 = 34069, Uf = 36064, Vf = 36096, Wf = 36128, Xf = 33306, Yf = 36053, S5 = 36054, k5 = 36055, T5 = 36057, D5 = 36061, M5 = 36193, C5 = 5121, L5 = 5126, Kf = 6407, Zf = 6408, F5 = 6402, R5 = [
      Kf,
      Zf
    ], Rl = [];
    Rl[Zf] = 4, Rl[Kf] = 3;
    var M0 = [];
    M0[C5] = 1, M0[L5] = 4, M0[M5] = 2;
    var O5 = 32854, P5 = 32855, I5 = 36194, B5 = 33189, N5 = 36168, Qf = 34041, G5 = 35907, q5 = 34836, $5 = 34842, z5 = 34843, j5 = [
      O5,
      P5,
      I5,
      G5,
      $5,
      z5,
      q5
    ], sa = {};
    sa[Yf] = "complete", sa[S5] = "incomplete attachment", sa[T5] = "incomplete dimensions", sa[k5] = "incomplete, missing attachment", sa[D5] = "unsupported";
    function H5(d, g, D, te, de, ee) {
      var ce = {
        cur: null,
        next: null,
        dirty: !1,
        setFBO: null
      }, ve = ["rgba"], Ae = ["rgba4", "rgb565", "rgb5 a1"];
      g.ext_srgb && Ae.push("srgba"), g.ext_color_buffer_half_float && Ae.push("rgba16f", "rgb16f"), g.webgl_color_buffer_float && Ae.push("rgba32f");
      var De = ["uint8"];
      g.oes_texture_half_float && De.push("half float", "float16"), g.oes_texture_float && De.push("float", "float32");
      function Fe(Ee, qe, $e) {
        this.target = Ee, this.texture = qe, this.renderbuffer = $e;
        var Tt = 0, gt = 0;
        qe ? (Tt = qe.width, gt = qe.height) : $e && (Tt = $e.width, gt = $e.height), this.width = Tt, this.height = gt;
      }
      function Me(Ee) {
        Ee && (Ee.texture && Ee.texture._texture.decRef(), Ee.renderbuffer && Ee.renderbuffer._renderbuffer.decRef());
      }
      function Ne(Ee, qe, $e) {
        if (Ee)
          if (Ee.texture) {
            var Tt = Ee.texture._texture, gt = Math.max(1, Tt.width), je = Math.max(1, Tt.height);
            b(
              gt === qe && je === $e,
              "inconsistent width/height for supplied texture"
            ), Tt.refCount += 1;
          } else {
            var Ye = Ee.renderbuffer._renderbuffer;
            b(
              Ye.width === qe && Ye.height === $e,
              "inconsistent width/height for renderbuffer"
            ), Ye.refCount += 1;
          }
      }
      function xe(Ee, qe) {
        qe && (qe.texture ? d.framebufferTexture2D(
          Nn,
          Ee,
          qe.target,
          qe.texture._texture.texture,
          0
        ) : d.framebufferRenderbuffer(
          Nn,
          Ee,
          Fl,
          qe.renderbuffer._renderbuffer.renderbuffer
        ));
      }
      function Te(Ee) {
        var qe = To, $e = null, Tt = null, gt = Ee;
        typeof Ee == "object" && (gt = Ee.data, "target" in Ee && (qe = Ee.target | 0)), b.type(gt, "function", "invalid attachment data");
        var je = gt._reglType;
        return je === "texture2d" ? ($e = gt, b(qe === To)) : je === "textureCube" ? ($e = gt, b(
          qe >= D0 && qe < D0 + 6,
          "invalid cube map target"
        )) : je === "renderbuffer" ? (Tt = gt, qe = Fl) : b.raise("invalid regl object for attachment"), new Fe(qe, $e, Tt);
      }
      function H(Ee, qe, $e, Tt, gt) {
        if ($e) {
          var je = te.create2D({
            width: Ee,
            height: qe,
            format: Tt,
            type: gt
          });
          return je._texture.refCount = 0, new Fe(To, je, null);
        } else {
          var Ye = de.create({
            width: Ee,
            height: qe,
            format: Tt
          });
          return Ye._renderbuffer.refCount = 0, new Fe(Fl, null, Ye);
        }
      }
      function se(Ee) {
        return Ee && (Ee.texture || Ee.renderbuffer);
      }
      function ke(Ee, qe, $e) {
        Ee && (Ee.texture ? Ee.texture.resize(qe, $e) : Ee.renderbuffer && Ee.renderbuffer.resize(qe, $e), Ee.width = qe, Ee.height = $e);
      }
      var Ke = 0, ge = {};
      function Xe() {
        this.id = Ke++, ge[this.id] = this, this.framebuffer = d.createFramebuffer(), this.width = 0, this.height = 0, this.colorAttachments = [], this.depthAttachment = null, this.stencilAttachment = null, this.depthStencilAttachment = null;
      }
      function ze(Ee) {
        Ee.colorAttachments.forEach(Me), Me(Ee.depthAttachment), Me(Ee.stencilAttachment), Me(Ee.depthStencilAttachment);
      }
      function dt(Ee) {
        var qe = Ee.framebuffer;
        b(qe, "must not double destroy framebuffer"), d.deleteFramebuffer(qe), Ee.framebuffer = null, ee.framebufferCount--, delete ge[Ee.id];
      }
      function he(Ee) {
        var qe;
        d.bindFramebuffer(Nn, Ee.framebuffer);
        var $e = Ee.colorAttachments;
        for (qe = 0; qe < $e.length; ++qe)
          xe(Uf + qe, $e[qe]);
        for (qe = $e.length; qe < D.maxColorAttachments; ++qe)
          d.framebufferTexture2D(
            Nn,
            Uf + qe,
            To,
            null,
            0
          );
        d.framebufferTexture2D(
          Nn,
          Xf,
          To,
          null,
          0
        ), d.framebufferTexture2D(
          Nn,
          Vf,
          To,
          null,
          0
        ), d.framebufferTexture2D(
          Nn,
          Wf,
          To,
          null,
          0
        ), xe(Vf, Ee.depthAttachment), xe(Wf, Ee.stencilAttachment), xe(Xf, Ee.depthStencilAttachment);
        var Tt = d.checkFramebufferStatus(Nn);
        !d.isContextLost() && Tt !== Yf && b.raise("framebuffer configuration not supported, status = " + sa[Tt]), d.bindFramebuffer(Nn, ce.next ? ce.next.framebuffer : null), ce.cur = ce.next, d.getError();
      }
      function fe(Ee, qe) {
        var $e = new Xe();
        ee.framebufferCount++;
        function Tt(je, Ye) {
          var mt;
          b(
            ce.next !== $e,
            "can not update framebuffer which is currently in use"
          );
          var _t = 0, Rt = 0, ir = !0, sr = !0, Pt = null, vr = !0, er = "rgba", Ar = "uint8", wr = 1, xr = null, Cr = null, Ir = null, hr = !1;
          if (typeof je == "number")
            _t = je | 0, Rt = Ye | 0 || _t;
          else if (!je)
            _t = Rt = 1;
          else {
            b.type(je, "object", "invalid arguments for framebuffer");
            var Dt = je;
            if ("shape" in Dt) {
              var Br = Dt.shape;
              b(
                Array.isArray(Br) && Br.length >= 2,
                "invalid shape for framebuffer"
              ), _t = Br[0], Rt = Br[1];
            } else
              "radius" in Dt && (_t = Rt = Dt.radius), "width" in Dt && (_t = Dt.width), "height" in Dt && (Rt = Dt.height);
            ("color" in Dt || "colors" in Dt) && (Pt = Dt.color || Dt.colors, Array.isArray(Pt) && b(
              Pt.length === 1 || g.webgl_draw_buffers,
              "multiple render targets not supported"
            )), Pt || ("colorCount" in Dt && (wr = Dt.colorCount | 0, b(wr > 0, "invalid color buffer count")), "colorTexture" in Dt && (vr = !!Dt.colorTexture, er = "rgba4"), "colorType" in Dt && (Ar = Dt.colorType, vr ? (b(
              g.oes_texture_float || !(Ar === "float" || Ar === "float32"),
              "you must enable OES_texture_float in order to use floating point framebuffer objects"
            ), b(
              g.oes_texture_half_float || !(Ar === "half float" || Ar === "float16"),
              "you must enable OES_texture_half_float in order to use 16-bit floating point framebuffer objects"
            )) : Ar === "half float" || Ar === "float16" ? (b(
              g.ext_color_buffer_half_float,
              "you must enable EXT_color_buffer_half_float to use 16-bit render buffers"
            ), er = "rgba16f") : (Ar === "float" || Ar === "float32") && (b(
              g.webgl_color_buffer_float,
              "you must enable WEBGL_color_buffer_float in order to use 32-bit floating point renderbuffers"
            ), er = "rgba32f"), b.oneOf(Ar, De, "invalid color type")), "colorFormat" in Dt && (er = Dt.colorFormat, ve.indexOf(er) >= 0 ? vr = !0 : Ae.indexOf(er) >= 0 ? vr = !1 : b.optional(function() {
              vr ? b.oneOf(
                Dt.colorFormat,
                ve,
                "invalid color format for texture"
              ) : b.oneOf(
                Dt.colorFormat,
                Ae,
                "invalid color format for renderbuffer"
              );
            }))), ("depthTexture" in Dt || "depthStencilTexture" in Dt) && (hr = !!(Dt.depthTexture || Dt.depthStencilTexture), b(
              !hr || g.webgl_depth_texture,
              "webgl_depth_texture extension not supported"
            )), "depth" in Dt && (typeof Dt.depth == "boolean" ? ir = Dt.depth : (xr = Dt.depth, sr = !1)), "stencil" in Dt && (typeof Dt.stencil == "boolean" ? sr = Dt.stencil : (Cr = Dt.stencil, ir = !1)), "depthStencil" in Dt && (typeof Dt.depthStencil == "boolean" ? ir = sr = Dt.depthStencil : (Ir = Dt.depthStencil, ir = !1, sr = !1));
          }
          var Ht = null, ht = null, Ot = null, zt = null;
          if (Array.isArray(Pt))
            Ht = Pt.map(Te);
          else if (Pt)
            Ht = [Te(Pt)];
          else
            for (Ht = new Array(wr), mt = 0; mt < wr; ++mt)
              Ht[mt] = H(
                _t,
                Rt,
                vr,
                er,
                Ar
              );
          b(
            g.webgl_draw_buffers || Ht.length <= 1,
            "you must enable the WEBGL_draw_buffers extension in order to use multiple color buffers."
          ), b(
            Ht.length <= D.maxColorAttachments,
            "too many color attachments, not supported"
          ), _t = _t || Ht[0].width, Rt = Rt || Ht[0].height, xr ? ht = Te(xr) : ir && !sr && (ht = H(
            _t,
            Rt,
            hr,
            "depth",
            "uint32"
          )), Cr ? Ot = Te(Cr) : sr && !ir && (Ot = H(
            _t,
            Rt,
            !1,
            "stencil",
            "uint8"
          )), Ir ? zt = Te(Ir) : !xr && !Cr && sr && ir && (zt = H(
            _t,
            Rt,
            hr,
            "depth stencil",
            "depth stencil"
          )), b(
            !!xr + !!Cr + !!Ir <= 1,
            "invalid framebuffer configuration, can specify exactly one depth/stencil attachment"
          );
          var mr = null;
          for (mt = 0; mt < Ht.length; ++mt)
            if (Ne(Ht[mt], _t, Rt), b(
              !Ht[mt] || Ht[mt].texture && R5.indexOf(Ht[mt].texture._texture.format) >= 0 || Ht[mt].renderbuffer && j5.indexOf(Ht[mt].renderbuffer._renderbuffer.format) >= 0,
              "framebuffer color attachment " + mt + " is invalid"
            ), Ht[mt] && Ht[mt].texture) {
              var Sn = Rl[Ht[mt].texture._texture.format] * M0[Ht[mt].texture._texture.type];
              mr === null ? mr = Sn : b(
                mr === Sn,
                "all color attachments much have the same number of bits per pixel."
              );
            }
          return Ne(ht, _t, Rt), b(
            !ht || ht.texture && ht.texture._texture.format === F5 || ht.renderbuffer && ht.renderbuffer._renderbuffer.format === B5,
            "invalid depth attachment for framebuffer object"
          ), Ne(Ot, _t, Rt), b(
            !Ot || Ot.renderbuffer && Ot.renderbuffer._renderbuffer.format === N5,
            "invalid stencil attachment for framebuffer object"
          ), Ne(zt, _t, Rt), b(
            !zt || zt.texture && zt.texture._texture.format === Qf || zt.renderbuffer && zt.renderbuffer._renderbuffer.format === Qf,
            "invalid depth-stencil attachment for framebuffer object"
          ), ze($e), $e.width = _t, $e.height = Rt, $e.colorAttachments = Ht, $e.depthAttachment = ht, $e.stencilAttachment = Ot, $e.depthStencilAttachment = zt, Tt.color = Ht.map(se), Tt.depth = se(ht), Tt.stencil = se(Ot), Tt.depthStencil = se(zt), Tt.width = $e.width, Tt.height = $e.height, he($e), Tt;
        }
        function gt(je, Ye) {
          b(
            ce.next !== $e,
            "can not resize a framebuffer which is currently in use"
          );
          var mt = Math.max(je | 0, 1), _t = Math.max(Ye | 0 || mt, 1);
          if (mt === $e.width && _t === $e.height)
            return Tt;
          for (var Rt = $e.colorAttachments, ir = 0; ir < Rt.length; ++ir)
            ke(Rt[ir], mt, _t);
          return ke($e.depthAttachment, mt, _t), ke($e.stencilAttachment, mt, _t), ke($e.depthStencilAttachment, mt, _t), $e.width = Tt.width = mt, $e.height = Tt.height = _t, he($e), Tt;
        }
        return Tt(Ee, qe), n(Tt, {
          resize: gt,
          _reglType: "framebuffer",
          _framebuffer: $e,
          destroy: function() {
            dt($e), ze($e);
          },
          use: function(je) {
            ce.setFBO({
              framebuffer: Tt
            }, je);
          }
        });
      }
      function Je(Ee) {
        var qe = Array(6);
        function $e(gt) {
          var je;
          b(
            qe.indexOf(ce.next) < 0,
            "can not update framebuffer which is currently in use"
          );
          var Ye = {
            color: null
          }, mt = 0, _t = null, Rt = "rgba", ir = "uint8", sr = 1;
          if (typeof gt == "number")
            mt = gt | 0;
          else if (!gt)
            mt = 1;
          else {
            b.type(gt, "object", "invalid arguments for framebuffer");
            var Pt = gt;
            if ("shape" in Pt) {
              var vr = Pt.shape;
              b(
                Array.isArray(vr) && vr.length >= 2,
                "invalid shape for framebuffer"
              ), b(
                vr[0] === vr[1],
                "cube framebuffer must be square"
              ), mt = vr[0];
            } else
              "radius" in Pt && (mt = Pt.radius | 0), "width" in Pt ? (mt = Pt.width | 0, "height" in Pt && b(Pt.height === mt, "must be square")) : "height" in Pt && (mt = Pt.height | 0);
            ("color" in Pt || "colors" in Pt) && (_t = Pt.color || Pt.colors, Array.isArray(_t) && b(
              _t.length === 1 || g.webgl_draw_buffers,
              "multiple render targets not supported"
            )), _t || ("colorCount" in Pt && (sr = Pt.colorCount | 0, b(sr > 0, "invalid color buffer count")), "colorType" in Pt && (b.oneOf(
              Pt.colorType,
              De,
              "invalid color type"
            ), ir = Pt.colorType), "colorFormat" in Pt && (Rt = Pt.colorFormat, b.oneOf(
              Pt.colorFormat,
              ve,
              "invalid color format for texture"
            ))), "depth" in Pt && (Ye.depth = Pt.depth), "stencil" in Pt && (Ye.stencil = Pt.stencil), "depthStencil" in Pt && (Ye.depthStencil = Pt.depthStencil);
          }
          var er;
          if (_t)
            if (Array.isArray(_t))
              for (er = [], je = 0; je < _t.length; ++je)
                er[je] = _t[je];
            else
              er = [_t];
          else {
            er = Array(sr);
            var Ar = {
              radius: mt,
              format: Rt,
              type: ir
            };
            for (je = 0; je < sr; ++je)
              er[je] = te.createCube(Ar);
          }
          for (Ye.color = Array(er.length), je = 0; je < er.length; ++je) {
            var wr = er[je];
            b(
              typeof wr == "function" && wr._reglType === "textureCube",
              "invalid cube map"
            ), mt = mt || wr.width, b(
              wr.width === mt && wr.height === mt,
              "invalid cube map shape"
            ), Ye.color[je] = {
              target: D0,
              data: er[je]
            };
          }
          for (je = 0; je < 6; ++je) {
            for (var xr = 0; xr < er.length; ++xr)
              Ye.color[xr].target = D0 + je;
            je > 0 && (Ye.depth = qe[0].depth, Ye.stencil = qe[0].stencil, Ye.depthStencil = qe[0].depthStencil), qe[je] ? qe[je](Ye) : qe[je] = fe(Ye);
          }
          return n($e, {
            width: mt,
            height: mt,
            color: er
          });
        }
        function Tt(gt) {
          var je, Ye = gt | 0;
          if (b(
            Ye > 0 && Ye <= D.maxCubeMapSize,
            "invalid radius for cube fbo"
          ), Ye === $e.width)
            return $e;
          var mt = $e.color;
          for (je = 0; je < mt.length; ++je)
            mt[je].resize(Ye);
          for (je = 0; je < 6; ++je)
            qe[je].resize(Ye);
          return $e.width = $e.height = Ye, $e;
        }
        return $e(Ee), n($e, {
          faces: qe,
          resize: Tt,
          _reglType: "framebufferCube",
          destroy: function() {
            qe.forEach(function(gt) {
              gt.destroy();
            });
          }
        });
      }
      function Ge() {
        ce.cur = null, ce.next = null, ce.dirty = !0, Qr(ge).forEach(function(Ee) {
          Ee.framebuffer = d.createFramebuffer(), he(Ee);
        });
      }
      return n(ce, {
        getFramebuffer: function(Ee) {
          if (typeof Ee == "function" && Ee._reglType === "framebuffer") {
            var qe = Ee._framebuffer;
            if (qe instanceof Xe)
              return qe;
          }
          return null;
        },
        create: fe,
        createCube: Je,
        clear: function() {
          Qr(ge).forEach(dt);
        },
        restore: Ge
      });
    }
    var U5 = 5126, Jf = 34962, C0 = 34963, ed = [
      "attributes",
      "elements",
      "offset",
      "count",
      "primitive",
      "instances"
    ];
    function Ol() {
      this.state = 0, this.x = 0, this.y = 0, this.z = 0, this.w = 0, this.buffer = null, this.size = 0, this.normalized = !1, this.type = U5, this.offset = 0, this.stride = 0, this.divisor = 0;
    }
    function V5(d, g, D, te, de, ee, ce) {
      for (var ve = D.maxAttributes, Ae = new Array(ve), De = 0; De < ve; ++De)
        Ae[De] = new Ol();
      var Fe = 0, Me = {}, Ne = {
        Record: Ol,
        scope: {},
        state: Ae,
        currentVAO: null,
        targetVAO: null,
        restore: Te() ? ze : function() {
        },
        createVAO: dt,
        getVAO: se,
        destroyBuffer: xe,
        setVAO: Te() ? ke : Ke,
        clear: Te() ? ge : function() {
        }
      };
      function xe(he) {
        for (var fe = 0; fe < Ae.length; ++fe) {
          var Je = Ae[fe];
          Je.buffer === he && (d.disableVertexAttribArray(fe), Je.buffer = null);
        }
      }
      function Te() {
        return g.oes_vertex_array_object;
      }
      function H() {
        return g.angle_instanced_arrays;
      }
      function se(he) {
        return typeof he == "function" && he._vao ? he._vao : null;
      }
      function ke(he) {
        if (he !== Ne.currentVAO) {
          var fe = Te();
          he ? fe.bindVertexArrayOES(he.vao) : fe.bindVertexArrayOES(null), Ne.currentVAO = he;
        }
      }
      function Ke(he) {
        if (he !== Ne.currentVAO) {
          if (he)
            he.bindAttrs();
          else {
            for (var fe = H(), Je = 0; Je < Ae.length; ++Je) {
              var Ge = Ae[Je];
              Ge.buffer ? (d.enableVertexAttribArray(Je), Ge.buffer.bind(), d.vertexAttribPointer(Je, Ge.size, Ge.type, Ge.normalized, Ge.stride, Ge.offfset), fe && Ge.divisor && fe.vertexAttribDivisorANGLE(Je, Ge.divisor)) : (d.disableVertexAttribArray(Je), d.vertexAttrib4f(Je, Ge.x, Ge.y, Ge.z, Ge.w));
            }
            ce.elements ? d.bindBuffer(C0, ce.elements.buffer.buffer) : d.bindBuffer(C0, null);
          }
          Ne.currentVAO = he;
        }
      }
      function ge() {
        Qr(Me).forEach(function(he) {
          he.destroy();
        });
      }
      function Xe() {
        this.id = ++Fe, this.attributes = [], this.elements = null, this.ownsElements = !1, this.count = 0, this.offset = 0, this.instances = -1, this.primitive = 4;
        var he = Te();
        he ? this.vao = he.createVertexArrayOES() : this.vao = null, Me[this.id] = this, this.buffers = [];
      }
      Xe.prototype.bindAttrs = function() {
        for (var he = H(), fe = this.attributes, Je = 0; Je < fe.length; ++Je) {
          var Ge = fe[Je];
          Ge.buffer ? (d.enableVertexAttribArray(Je), d.bindBuffer(Jf, Ge.buffer.buffer), d.vertexAttribPointer(Je, Ge.size, Ge.type, Ge.normalized, Ge.stride, Ge.offset), he && Ge.divisor && he.vertexAttribDivisorANGLE(Je, Ge.divisor)) : (d.disableVertexAttribArray(Je), d.vertexAttrib4f(Je, Ge.x, Ge.y, Ge.z, Ge.w));
        }
        for (var Ee = fe.length; Ee < ve; ++Ee)
          d.disableVertexAttribArray(Ee);
        var qe = ee.getElements(this.elements);
        qe ? d.bindBuffer(C0, qe.buffer.buffer) : d.bindBuffer(C0, null);
      }, Xe.prototype.refresh = function() {
        var he = Te();
        he && (he.bindVertexArrayOES(this.vao), this.bindAttrs(), Ne.currentVAO = null, he.bindVertexArrayOES(null));
      }, Xe.prototype.destroy = function() {
        if (this.vao) {
          var he = Te();
          this === Ne.currentVAO && (Ne.currentVAO = null, he.bindVertexArrayOES(null)), he.deleteVertexArrayOES(this.vao), this.vao = null;
        }
        this.ownsElements && (this.elements.destroy(), this.elements = null, this.ownsElements = !1), Me[this.id] && (delete Me[this.id], te.vaoCount -= 1);
      };
      function ze() {
        var he = Te();
        he && Qr(Me).forEach(function(fe) {
          fe.refresh();
        });
      }
      function dt(he) {
        var fe = new Xe();
        te.vaoCount += 1;
        function Je(Ge) {
          var Ee;
          if (Array.isArray(Ge))
            Ee = Ge, fe.elements && fe.ownsElements && fe.elements.destroy(), fe.elements = null, fe.ownsElements = !1, fe.offset = 0, fe.count = 0, fe.instances = -1, fe.primitive = 4;
          else {
            if (b(typeof Ge == "object", "invalid arguments for create vao"), b("attributes" in Ge, "must specify attributes for vao"), Ge.elements) {
              var qe = Ge.elements;
              fe.ownsElements ? typeof qe == "function" && qe._reglType === "elements" ? (fe.elements.destroy(), fe.ownsElements = !1) : (fe.elements(qe), fe.ownsElements = !1) : ee.getElements(Ge.elements) ? (fe.elements = Ge.elements, fe.ownsElements = !1) : (fe.elements = ee.create(Ge.elements), fe.ownsElements = !0);
            } else
              fe.elements = null, fe.ownsElements = !1;
            Ee = Ge.attributes, fe.offset = 0, fe.count = -1, fe.instances = -1, fe.primitive = 4, fe.elements && (fe.count = fe.elements._elements.vertCount, fe.primitive = fe.elements._elements.primType), "offset" in Ge && (fe.offset = Ge.offset | 0), "count" in Ge && (fe.count = Ge.count | 0), "instances" in Ge && (fe.instances = Ge.instances | 0), "primitive" in Ge && (b(Ge.primitive in no, "bad primitive type: " + Ge.primitive), fe.primitive = no[Ge.primitive]), b.optional(() => {
              for (var ir = Object.keys(Ge), sr = 0; sr < ir.length; ++sr)
                b(ed.indexOf(ir[sr]) >= 0, 'invalid option for vao: "' + ir[sr] + '" valid options are ' + ed);
            }), b(Array.isArray(Ee), "attributes must be an array");
          }
          b(Ee.length < ve, "too many attributes"), b(Ee.length > 0, "must specify at least one attribute");
          var $e = {}, Tt = fe.attributes;
          Tt.length = Ee.length;
          for (var gt = 0; gt < Ee.length; ++gt) {
            var je = Ee[gt], Ye = Tt[gt] = new Ol(), mt = je.data || je;
            if (Array.isArray(mt) || r(mt) || pn(mt)) {
              var _t;
              fe.buffers[gt] && (_t = fe.buffers[gt], r(mt) && _t._buffer.byteLength >= mt.byteLength ? _t.subdata(mt) : (_t.destroy(), fe.buffers[gt] = null)), fe.buffers[gt] || (_t = fe.buffers[gt] = de.create(je, Jf, !1, !0)), Ye.buffer = de.getBuffer(_t), Ye.size = Ye.buffer.dimension | 0, Ye.normalized = !1, Ye.type = Ye.buffer.dtype, Ye.offset = 0, Ye.stride = 0, Ye.divisor = 0, Ye.state = 1, $e[gt] = 1;
            } else de.getBuffer(je) ? (Ye.buffer = de.getBuffer(je), Ye.size = Ye.buffer.dimension | 0, Ye.normalized = !1, Ye.type = Ye.buffer.dtype, Ye.offset = 0, Ye.stride = 0, Ye.divisor = 0, Ye.state = 1) : de.getBuffer(je.buffer) ? (Ye.buffer = de.getBuffer(je.buffer), Ye.size = (+je.size || Ye.buffer.dimension) | 0, Ye.normalized = !!je.normalized || !1, "type" in je ? (b.parameter(je.type, _o, "invalid buffer type"), Ye.type = _o[je.type]) : Ye.type = Ye.buffer.dtype, Ye.offset = (je.offset || 0) | 0, Ye.stride = (je.stride || 0) | 0, Ye.divisor = (je.divisor || 0) | 0, Ye.state = 1, b(Ye.size >= 1 && Ye.size <= 4, "size must be between 1 and 4"), b(Ye.offset >= 0, "invalid offset"), b(Ye.stride >= 0 && Ye.stride <= 255, "stride must be between 0 and 255"), b(Ye.divisor >= 0, "divisor must be positive"), b(!Ye.divisor || !!g.angle_instanced_arrays, "ANGLE_instanced_arrays must be enabled to use divisor")) : "x" in je ? (b(gt > 0, "first attribute must not be a constant"), Ye.x = +je.x || 0, Ye.y = +je.y || 0, Ye.z = +je.z || 0, Ye.w = +je.w || 0, Ye.state = 2) : b(!1, "invalid attribute spec for location " + gt);
          }
          for (var Rt = 0; Rt < fe.buffers.length; ++Rt)
            !$e[Rt] && fe.buffers[Rt] && (fe.buffers[Rt].destroy(), fe.buffers[Rt] = null);
          return fe.refresh(), Je;
        }
        return Je.destroy = function() {
          for (var Ge = 0; Ge < fe.buffers.length; ++Ge)
            fe.buffers[Ge] && fe.buffers[Ge].destroy();
          fe.buffers.length = 0, fe.ownsElements && (fe.elements.destroy(), fe.elements = null, fe.ownsElements = !1), fe.destroy();
        }, Je._vao = fe, Je._reglType = "vao", Je(he);
      }
      return Ne;
    }
    var td = 35632, W5 = 35633, X5 = 35718, Y5 = 35721;
    function K5(d, g, D, te) {
      var de = {}, ee = {};
      function ce(H, se, ke, Ke) {
        this.name = H, this.id = se, this.location = ke, this.info = Ke;
      }
      function ve(H, se) {
        for (var ke = 0; ke < H.length; ++ke)
          if (H[ke].id === se.id) {
            H[ke].location = se.location;
            return;
          }
        H.push(se);
      }
      function Ae(H, se, ke) {
        var Ke = H === td ? de : ee, ge = Ke[se];
        if (!ge) {
          var Xe = g.str(se);
          ge = d.createShader(H), d.shaderSource(ge, Xe), d.compileShader(ge), b.shaderError(d, ge, Xe, H, ke), Ke[se] = ge;
        }
        return ge;
      }
      var De = {}, Fe = [], Me = 0;
      function Ne(H, se) {
        this.id = Me++, this.fragId = H, this.vertId = se, this.program = null, this.uniforms = [], this.attributes = [], this.refCount = 1, te.profile && (this.stats = {
          uniformsCount: 0,
          attributesCount: 0
        });
      }
      function xe(H, se, ke) {
        var Ke, ge, Xe = Ae(td, H.fragId), ze = Ae(W5, H.vertId), dt = H.program = d.createProgram();
        if (d.attachShader(dt, Xe), d.attachShader(dt, ze), ke)
          for (Ke = 0; Ke < ke.length; ++Ke) {
            var he = ke[Ke];
            d.bindAttribLocation(dt, he[0], he[1]);
          }
        d.linkProgram(dt), b.linkError(
          d,
          dt,
          g.str(H.fragId),
          g.str(H.vertId),
          se
        );
        var fe = d.getProgramParameter(dt, X5);
        te.profile && (H.stats.uniformsCount = fe);
        var Je = H.uniforms;
        for (Ke = 0; Ke < fe; ++Ke)
          if (ge = d.getActiveUniform(dt, Ke), ge)
            if (ge.size > 1)
              for (var Ge = 0; Ge < ge.size; ++Ge) {
                var Ee = ge.name.replace("[0]", "[" + Ge + "]");
                ve(Je, new ce(
                  Ee,
                  g.id(Ee),
                  d.getUniformLocation(dt, Ee),
                  ge
                ));
              }
            else
              ve(Je, new ce(
                ge.name,
                g.id(ge.name),
                d.getUniformLocation(dt, ge.name),
                ge
              ));
        var qe = d.getProgramParameter(dt, Y5);
        te.profile && (H.stats.attributesCount = qe);
        var $e = H.attributes;
        for (Ke = 0; Ke < qe; ++Ke)
          ge = d.getActiveAttrib(dt, Ke), ge && ve($e, new ce(
            ge.name,
            g.id(ge.name),
            d.getAttribLocation(dt, ge.name),
            ge
          ));
      }
      te.profile && (D.getMaxUniformsCount = function() {
        var H = 0;
        return Fe.forEach(function(se) {
          se.stats.uniformsCount > H && (H = se.stats.uniformsCount);
        }), H;
      }, D.getMaxAttributesCount = function() {
        var H = 0;
        return Fe.forEach(function(se) {
          se.stats.attributesCount > H && (H = se.stats.attributesCount);
        }), H;
      });
      function Te() {
        de = {}, ee = {};
        for (var H = 0; H < Fe.length; ++H)
          xe(Fe[H], null, Fe[H].attributes.map(function(se) {
            return [se.location, se.name];
          }));
      }
      return {
        clear: function() {
          var H = d.deleteShader.bind(d);
          Qr(de).forEach(H), de = {}, Qr(ee).forEach(H), ee = {}, Fe.forEach(function(se) {
            d.deleteProgram(se.program);
          }), Fe.length = 0, De = {}, D.shaderCount = 0;
        },
        program: function(H, se, ke, Ke) {
          b.command(H >= 0, "missing vertex shader", ke), b.command(se >= 0, "missing fragment shader", ke);
          var ge = De[se];
          ge || (ge = De[se] = {});
          var Xe = ge[H];
          if (Xe && (Xe.refCount++, !Ke))
            return Xe;
          var ze = new Ne(se, H);
          return D.shaderCount++, xe(ze, ke, Ke), Xe || (ge[H] = ze), Fe.push(ze), n(ze, {
            destroy: function() {
              if (ze.refCount--, ze.refCount <= 0) {
                d.deleteProgram(ze.program);
                var dt = Fe.indexOf(ze);
                Fe.splice(dt, 1), D.shaderCount--;
              }
              ge[ze.vertId].refCount <= 0 && (d.deleteShader(ee[ze.vertId]), delete ee[ze.vertId], delete De[ze.fragId][ze.vertId]), Object.keys(De[ze.fragId]).length || (d.deleteShader(de[ze.fragId]), delete de[ze.fragId], delete De[ze.fragId]);
            }
          });
        },
        restore: Te,
        shader: Ae,
        frag: -1,
        vert: -1
      };
    }
    var Z5 = 6408, ci = 5121, Q5 = 3333, L0 = 5126;
    function J5(d, g, D, te, de, ee, ce) {
      function ve(Fe) {
        var Me;
        g.next === null ? (b(
          de.preserveDrawingBuffer,
          'you must create a webgl context with "preserveDrawingBuffer":true in order to read pixels from the drawing buffer'
        ), Me = ci) : (b(
          g.next.colorAttachments[0].texture !== null,
          "You cannot read from a renderbuffer"
        ), Me = g.next.colorAttachments[0].texture._texture.type, b.optional(function() {
          ee.oes_texture_float ? (b(
            Me === ci || Me === L0,
            "Reading from a framebuffer is only allowed for the types 'uint8' and 'float'"
          ), Me === L0 && b(ce.readFloat, "Reading 'float' values is not permitted in your browser. For a fallback, please see: https://www.npmjs.com/package/glsl-read-float")) : b(
            Me === ci,
            "Reading from a framebuffer is only allowed for the type 'uint8'"
          );
        }));
        var Ne = 0, xe = 0, Te = te.framebufferWidth, H = te.framebufferHeight, se = null;
        r(Fe) ? se = Fe : Fe && (b.type(Fe, "object", "invalid arguments to regl.read()"), Ne = Fe.x | 0, xe = Fe.y | 0, b(
          Ne >= 0 && Ne < te.framebufferWidth,
          "invalid x offset for regl.read"
        ), b(
          xe >= 0 && xe < te.framebufferHeight,
          "invalid y offset for regl.read"
        ), Te = (Fe.width || te.framebufferWidth - Ne) | 0, H = (Fe.height || te.framebufferHeight - xe) | 0, se = Fe.data || null), se && (Me === ci ? b(
          se instanceof Uint8Array,
          "buffer must be 'Uint8Array' when reading from a framebuffer of type 'uint8'"
        ) : Me === L0 && b(
          se instanceof Float32Array,
          "buffer must be 'Float32Array' when reading from a framebuffer of type 'float'"
        )), b(
          Te > 0 && Te + Ne <= te.framebufferWidth,
          "invalid width for read pixels"
        ), b(
          H > 0 && H + xe <= te.framebufferHeight,
          "invalid height for read pixels"
        ), D();
        var ke = Te * H * 4;
        return se || (Me === ci ? se = new Uint8Array(ke) : Me === L0 && (se = se || new Float32Array(ke))), b.isTypedArray(se, "data buffer for regl.read() must be a typedarray"), b(se.byteLength >= ke, "data buffer for regl.read() too small"), d.pixelStorei(Q5, 4), d.readPixels(
          Ne,
          xe,
          Te,
          H,
          Z5,
          Me,
          se
        ), se;
      }
      function Ae(Fe) {
        var Me;
        return g.setFBO({
          framebuffer: Fe.framebuffer
        }, function() {
          Me = ve(Fe);
        }), Me;
      }
      function De(Fe) {
        return !Fe || !("framebuffer" in Fe) ? ve(Fe) : Ae(Fe);
      }
      return De;
    }
    function la(d) {
      return Array.prototype.slice.call(d);
    }
    function ca(d) {
      return la(d).join("");
    }
    function ey() {
      var d = 0, g = [], D = [];
      function te(Me) {
        for (var Ne = 0; Ne < D.length; ++Ne)
          if (D[Ne] === Me)
            return g[Ne];
        var xe = "g" + d++;
        return g.push(xe), D.push(Me), xe;
      }
      function de() {
        var Me = [];
        function Ne() {
          Me.push.apply(Me, la(arguments));
        }
        var xe = [];
        function Te() {
          var H = "v" + d++;
          return xe.push(H), arguments.length > 0 && (Me.push(H, "="), Me.push.apply(Me, la(arguments)), Me.push(";")), H;
        }
        return n(Ne, {
          def: Te,
          toString: function() {
            return ca([
              xe.length > 0 ? "var " + xe.join(",") + ";" : "",
              ca(Me)
            ]);
          }
        });
      }
      function ee() {
        var Me = de(), Ne = de(), xe = Me.toString, Te = Ne.toString;
        function H(se, ke) {
          Ne(se, ke, "=", Me.def(se, ke), ";");
        }
        return n(function() {
          Me.apply(Me, la(arguments));
        }, {
          def: Me.def,
          entry: Me,
          exit: Ne,
          save: H,
          set: function(se, ke, Ke) {
            H(se, ke), Me(se, ke, "=", Ke, ";");
          },
          toString: function() {
            return xe() + Te();
          }
        });
      }
      function ce() {
        var Me = ca(arguments), Ne = ee(), xe = ee(), Te = Ne.toString, H = xe.toString;
        return n(Ne, {
          then: function() {
            return Ne.apply(Ne, la(arguments)), this;
          },
          else: function() {
            return xe.apply(xe, la(arguments)), this;
          },
          toString: function() {
            var se = H();
            return se && (se = "else{" + se + "}"), ca([
              "if(",
              Me,
              "){",
              Te(),
              "}",
              se
            ]);
          }
        });
      }
      var ve = de(), Ae = {};
      function De(Me, Ne) {
        var xe = [];
        function Te() {
          var ge = "a" + xe.length;
          return xe.push(ge), ge;
        }
        Ne = Ne || 0;
        for (var H = 0; H < Ne; ++H)
          Te();
        var se = ee(), ke = se.toString, Ke = Ae[Me] = n(se, {
          arg: Te,
          toString: function() {
            return ca([
              "function(",
              xe.join(),
              "){",
              ke(),
              "}"
            ]);
          }
        });
        return Ke;
      }
      function Fe() {
        var Me = [
          '"use strict";',
          ve,
          "return {"
        ];
        Object.keys(Ae).forEach(function(Te) {
          Me.push('"', Te, '":', Ae[Te].toString(), ",");
        }), Me.push("}");
        var Ne = ca(Me).replace(/;/g, `;
`).replace(/}/g, `}
`).replace(/{/g, `{
`), xe = Function.apply(null, g.concat(Ne));
        return xe.apply(null, D);
      }
      return {
        global: ve,
        link: te,
        block: de,
        proc: De,
        scope: ee,
        cond: ce,
        compile: Fe
      };
    }
    var ua = "xyzw".split(""), rd = 5121, fa = 1, Pl = 2, Il = 0, Bl = 1, Nl = 2, Gl = 3, F0 = 4, nd = 5, od = 6, ad = "dither", id = "blend.enable", sd = "blend.color", ql = "blend.equation", $l = "blend.func", ld = "depth.enable", cd = "depth.func", ud = "depth.range", fd = "depth.mask", zl = "colorMask", dd = "cull.enable", pd = "cull.face", jl = "frontFace", Hl = "lineWidth", hd = "polygonOffset.enable", Ul = "polygonOffset.offset", md = "sample.alpha", yd = "sample.enable", Vl = "sample.coverage", bd = "stencil.enable", gd = "stencil.mask", Wl = "stencil.func", Xl = "stencil.opFront", ui = "stencil.opBack", Ad = "scissor.enable", R0 = "scissor.box", Gn = "viewport", fi = "profile", Do = "framebuffer", di = "vert", pi = "frag", Mo = "elements", Co = "primitive", Lo = "count", O0 = "offset", P0 = "instances", hi = "vao", Yl = "Width", Kl = "Height", da = Do + Yl, pa = Do + Kl, ty = Gn + Yl, ry = Gn + Kl, vd = "drawingBuffer", wd = vd + Yl, xd = vd + Kl, ny = [
      $l,
      ql,
      Wl,
      Xl,
      ui,
      Vl,
      Gn,
      R0,
      Ul
    ], ha = 34962, Zl = 34963, oy = 35632, ay = 35633, _d = 3553, iy = 34067, sy = 2884, ly = 3042, cy = 3024, uy = 2960, fy = 2929, dy = 3089, py = 32823, hy = 32926, my = 32928, Ql = 5126, I0 = 35664, B0 = 35665, N0 = 35666, Jl = 5124, G0 = 35667, q0 = 35668, $0 = 35669, ec = 35670, z0 = 35671, j0 = 35672, H0 = 35673, mi = 35674, yi = 35675, bi = 35676, gi = 35678, Ai = 35680, tc = 4, vi = 1028, Fo = 1029, Ed = 2304, rc = 2305, yy = 32775, by = 32776, gy = 519, ao = 7680, Sd = 0, kd = 1, Td = 32774, Ay = 513, Dd = 36160, vy = 36064, En = {
      0: 0,
      1: 1,
      zero: 0,
      one: 1,
      "src color": 768,
      "one minus src color": 769,
      "src alpha": 770,
      "one minus src alpha": 771,
      "dst color": 774,
      "one minus dst color": 775,
      "dst alpha": 772,
      "one minus dst alpha": 773,
      "constant color": 32769,
      "one minus constant color": 32770,
      "constant alpha": 32771,
      "one minus constant alpha": 32772,
      "src alpha saturate": 776
    }, Md = [
      "constant color, constant alpha",
      "one minus constant color, constant alpha",
      "constant color, one minus constant alpha",
      "one minus constant color, one minus constant alpha",
      "constant alpha, constant color",
      "constant alpha, one minus constant color",
      "one minus constant alpha, constant color",
      "one minus constant alpha, one minus constant color"
    ], ma = {
      never: 512,
      less: 513,
      "<": 513,
      equal: 514,
      "=": 514,
      "==": 514,
      "===": 514,
      lequal: 515,
      "<=": 515,
      greater: 516,
      ">": 516,
      notequal: 517,
      "!=": 517,
      "!==": 517,
      gequal: 518,
      ">=": 518,
      always: 519
    }, io = {
      0: 0,
      zero: 0,
      keep: 7680,
      replace: 7681,
      increment: 7682,
      decrement: 7683,
      "increment wrap": 34055,
      "decrement wrap": 34056,
      invert: 5386
    }, Cd = {
      frag: oy,
      vert: ay
    }, nc = {
      cw: Ed,
      ccw: rc
    };
    function U0(d) {
      return Array.isArray(d) || r(d) || pn(d);
    }
    function Ld(d) {
      return d.sort(function(g, D) {
        return g === Gn ? -1 : D === Gn ? 1 : g < D ? -1 : 1;
      });
    }
    function Er(d, g, D, te) {
      this.thisDep = d, this.contextDep = g, this.propDep = D, this.append = te;
    }
    function so(d) {
      return d && !(d.thisDep || d.contextDep || d.propDep);
    }
    function gr(d) {
      return new Er(!1, !1, !1, d);
    }
    function Wr(d, g) {
      var D = d.type;
      if (D === Il) {
        var te = d.data.length;
        return new Er(
          !0,
          te >= 1,
          te >= 2,
          g
        );
      } else if (D === F0) {
        var de = d.data;
        return new Er(
          de.thisDep,
          de.contextDep,
          de.propDep,
          g
        );
      } else {
        if (D === nd)
          return new Er(
            !1,
            !1,
            !1,
            g
          );
        if (D === od) {
          for (var ee = !1, ce = !1, ve = !1, Ae = 0; Ae < d.data.length; ++Ae) {
            var De = d.data[Ae];
            if (De.type === Bl)
              ve = !0;
            else if (De.type === Nl)
              ce = !0;
            else if (De.type === Gl)
              ee = !0;
            else if (De.type === Il) {
              ee = !0;
              var Fe = De.data;
              Fe >= 1 && (ce = !0), Fe >= 2 && (ve = !0);
            } else De.type === F0 && (ee = ee || De.data.thisDep, ce = ce || De.data.contextDep, ve = ve || De.data.propDep);
          }
          return new Er(
            ee,
            ce,
            ve,
            g
          );
        } else
          return new Er(
            D === Gl,
            D === Nl,
            D === Bl,
            g
          );
      }
    }
    var Fd = new Er(!1, !1, !1, function() {
    });
    function wy(d, g, D, te, de, ee, ce, ve, Ae, De, Fe, Me, Ne, xe, Te) {
      var H = De.Record, se = {
        add: 32774,
        subtract: 32778,
        "reverse subtract": 32779
      };
      D.ext_blend_minmax && (se.min = yy, se.max = by);
      var ke = D.angle_instanced_arrays, Ke = D.webgl_draw_buffers, ge = D.oes_vertex_array_object, Xe = {
        dirty: !0,
        profile: Te.profile
      }, ze = {}, dt = [], he = {}, fe = {};
      function Je(x) {
        return x.replace(".", "_");
      }
      function Ge(x, y, L) {
        var $ = Je(x);
        dt.push(x), ze[$] = Xe[$] = !!L, he[$] = y;
      }
      function Ee(x, y, L) {
        var $ = Je(x);
        dt.push(x), Array.isArray(L) ? (Xe[$] = L.slice(), ze[$] = L.slice()) : Xe[$] = ze[$] = L, fe[$] = y;
      }
      Ge(ad, cy), Ge(id, ly), Ee(sd, "blendColor", [0, 0, 0, 0]), Ee(
        ql,
        "blendEquationSeparate",
        [Td, Td]
      ), Ee(
        $l,
        "blendFuncSeparate",
        [kd, Sd, kd, Sd]
      ), Ge(ld, fy, !0), Ee(cd, "depthFunc", Ay), Ee(ud, "depthRange", [0, 1]), Ee(fd, "depthMask", !0), Ee(zl, zl, [!0, !0, !0, !0]), Ge(dd, sy), Ee(pd, "cullFace", Fo), Ee(jl, jl, rc), Ee(Hl, Hl, 1), Ge(hd, py), Ee(Ul, "polygonOffset", [0, 0]), Ge(md, hy), Ge(yd, my), Ee(Vl, "sampleCoverage", [1, !1]), Ge(bd, uy), Ee(gd, "stencilMask", -1), Ee(Wl, "stencilFunc", [gy, 0, -1]), Ee(
        Xl,
        "stencilOpSeparate",
        [vi, ao, ao, ao]
      ), Ee(
        ui,
        "stencilOpSeparate",
        [Fo, ao, ao, ao]
      ), Ge(Ad, dy), Ee(
        R0,
        "scissor",
        [0, 0, d.drawingBufferWidth, d.drawingBufferHeight]
      ), Ee(
        Gn,
        Gn,
        [0, 0, d.drawingBufferWidth, d.drawingBufferHeight]
      );
      var qe = {
        gl: d,
        context: Ne,
        strings: g,
        next: ze,
        current: Xe,
        draw: Me,
        elements: ee,
        buffer: de,
        shader: Fe,
        attributes: De.state,
        vao: De,
        uniforms: Ae,
        framebuffer: ve,
        extensions: D,
        timer: xe,
        isBufferArgs: U0
      }, $e = {
        primTypes: no,
        compareFuncs: ma,
        blendFuncs: En,
        blendEquations: se,
        stencilOps: io,
        glTypes: _o,
        orientationType: nc
      };
      b.optional(function() {
        qe.isArrayLike = pr;
      }), Ke && ($e.backBuffer = [Fo], $e.drawBuffer = Or(te.maxDrawbuffers, function(x) {
        return x === 0 ? [0] : Or(x, function(y) {
          return vy + y;
        });
      }));
      var Tt = 0;
      function gt() {
        var x = ey(), y = x.link, L = x.global;
        x.id = Tt++, x.batchId = "0";
        var $ = y(qe), W = x.shared = {
          props: "a0"
        };
        Object.keys(qe).forEach(function(C) {
          W[C] = L.def($, ".", C);
        }), b.optional(function() {
          x.CHECK = y(b), x.commandStr = b.guessCommand(), x.command = y(x.commandStr), x.assert = function(C, S, U) {
            C(
              "if(!(",
              S,
              "))",
              this.CHECK,
              ".commandRaise(",
              y(U),
              ",",
              this.command,
              ");"
            );
          }, $e.invalidBlendCombinations = Md;
        });
        var I = x.next = {}, P = x.current = {};
        Object.keys(fe).forEach(function(C) {
          Array.isArray(Xe[C]) && (I[C] = L.def(W.next, ".", C), P[C] = L.def(W.current, ".", C));
        });
        var q = x.constants = {};
        Object.keys($e).forEach(function(C) {
          q[C] = L.def(JSON.stringify($e[C]));
        }), x.invoke = function(C, S) {
          switch (S.type) {
            case Il:
              var U = [
                "this",
                W.context,
                W.props,
                x.batchId
              ];
              return C.def(
                y(S.data),
                ".call(",
                U.slice(0, Math.max(S.data.length + 1, 4)),
                ")"
              );
            case Bl:
              return C.def(W.props, S.data);
            case Nl:
              return C.def(W.context, S.data);
            case Gl:
              return C.def("this", S.data);
            case F0:
              return S.data.append(x, C), S.data.ref;
            case nd:
              return S.data.toString();
            case od:
              return S.data.map(function(Y) {
                return x.invoke(C, Y);
              });
          }
        }, x.attribCache = {};
        var v = {};
        return x.scopeAttrib = function(C) {
          var S = g.id(C);
          if (S in v)
            return v[S];
          var U = De.scope[S];
          U || (U = De.scope[S] = new H());
          var Y = v[S] = y(U);
          return Y;
        }, x;
      }
      function je(x) {
        var y = x.static, L = x.dynamic, $;
        if (fi in y) {
          var W = !!y[fi];
          $ = gr(function(P, q) {
            return W;
          }), $.enable = W;
        } else if (fi in L) {
          var I = L[fi];
          $ = Wr(I, function(P, q) {
            return P.invoke(q, I);
          });
        }
        return $;
      }
      function Ye(x, y) {
        var L = x.static, $ = x.dynamic;
        if (Do in L) {
          var W = L[Do];
          return W ? (W = ve.getFramebuffer(W), b.command(W, "invalid framebuffer object"), gr(function(P, q) {
            var v = P.link(W), C = P.shared;
            q.set(
              C.framebuffer,
              ".next",
              v
            );
            var S = C.context;
            return q.set(
              S,
              "." + da,
              v + ".width"
            ), q.set(
              S,
              "." + pa,
              v + ".height"
            ), v;
          })) : gr(function(P, q) {
            var v = P.shared;
            q.set(
              v.framebuffer,
              ".next",
              "null"
            );
            var C = v.context;
            return q.set(
              C,
              "." + da,
              C + "." + wd
            ), q.set(
              C,
              "." + pa,
              C + "." + xd
            ), "null";
          });
        } else if (Do in $) {
          var I = $[Do];
          return Wr(I, function(P, q) {
            var v = P.invoke(q, I), C = P.shared, S = C.framebuffer, U = q.def(
              S,
              ".getFramebuffer(",
              v,
              ")"
            );
            b.optional(function() {
              P.assert(
                q,
                "!" + v + "||" + U,
                "invalid framebuffer object"
              );
            }), q.set(
              S,
              ".next",
              U
            );
            var Y = C.context;
            return q.set(
              Y,
              "." + da,
              U + "?" + U + ".width:" + Y + "." + wd
            ), q.set(
              Y,
              "." + pa,
              U + "?" + U + ".height:" + Y + "." + xd
            ), U;
          });
        } else
          return null;
      }
      function mt(x, y, L) {
        var $ = x.static, W = x.dynamic;
        function I(v) {
          if (v in $) {
            var C = $[v];
            b.commandType(C, "object", "invalid " + v, L.commandStr);
            var S = !0, U = C.x | 0, Y = C.y | 0, ye, Pe;
            return "width" in C ? (ye = C.width | 0, b.command(ye >= 0, "invalid " + v, L.commandStr)) : S = !1, "height" in C ? (Pe = C.height | 0, b.command(Pe >= 0, "invalid " + v, L.commandStr)) : S = !1, new Er(
              !S && y && y.thisDep,
              !S && y && y.contextDep,
              !S && y && y.propDep,
              function(Re, rt) {
                var Ze = Re.shared.context, et = ye;
                "width" in C || (et = rt.def(Ze, ".", da, "-", U));
                var tt = Pe;
                return "height" in C || (tt = rt.def(Ze, ".", pa, "-", Y)), [U, Y, et, tt];
              }
            );
          } else if (v in W) {
            var Ie = W[v], He = Wr(Ie, function(Re, rt) {
              var Ze = Re.invoke(rt, Ie);
              b.optional(function() {
                Re.assert(
                  rt,
                  Ze + "&&typeof " + Ze + '==="object"',
                  "invalid " + v
                );
              });
              var et = Re.shared.context, tt = rt.def(Ze, ".x|0"), nt = rt.def(Ze, ".y|0"), yt = rt.def(
                '"width" in ',
                Ze,
                "?",
                Ze,
                ".width|0:",
                "(",
                et,
                ".",
                da,
                "-",
                tt,
                ")"
              ), Jt = rt.def(
                '"height" in ',
                Ze,
                "?",
                Ze,
                ".height|0:",
                "(",
                et,
                ".",
                pa,
                "-",
                nt,
                ")"
              );
              return b.optional(function() {
                Re.assert(
                  rt,
                  yt + ">=0&&" + Jt + ">=0",
                  "invalid " + v
                );
              }), [tt, nt, yt, Jt];
            });
            return y && (He.thisDep = He.thisDep || y.thisDep, He.contextDep = He.contextDep || y.contextDep, He.propDep = He.propDep || y.propDep), He;
          } else return y ? new Er(
            y.thisDep,
            y.contextDep,
            y.propDep,
            function(Re, rt) {
              var Ze = Re.shared.context;
              return [
                0,
                0,
                rt.def(Ze, ".", da),
                rt.def(Ze, ".", pa)
              ];
            }
          ) : null;
        }
        var P = I(Gn);
        if (P) {
          var q = P;
          P = new Er(
            P.thisDep,
            P.contextDep,
            P.propDep,
            function(v, C) {
              var S = q.append(v, C), U = v.shared.context;
              return C.set(
                U,
                "." + ty,
                S[2]
              ), C.set(
                U,
                "." + ry,
                S[3]
              ), S;
            }
          );
        }
        return {
          viewport: P,
          scissor_box: I(R0)
        };
      }
      function _t(x, y) {
        var L = x.static, $ = typeof L[pi] == "string" && typeof L[di] == "string";
        if ($) {
          if (Object.keys(y.dynamic).length > 0)
            return null;
          var W = y.static, I = Object.keys(W);
          if (I.length > 0 && typeof W[I[0]] == "number") {
            for (var P = [], q = 0; q < I.length; ++q)
              b(typeof W[I[q]] == "number", "must specify all vertex attribute locations when using vaos"), P.push([W[I[q]] | 0, I[q]]);
            return P;
          }
        }
        return null;
      }
      function Rt(x, y, L) {
        var $ = x.static, W = x.dynamic;
        function I(S) {
          if (S in $) {
            var U = g.id($[S]);
            b.optional(function() {
              Fe.shader(Cd[S], U, b.guessCommand());
            });
            var Y = gr(function() {
              return U;
            });
            return Y.id = U, Y;
          } else if (S in W) {
            var ye = W[S];
            return Wr(ye, function(Pe, Ie) {
              var He = Pe.invoke(Ie, ye), Re = Ie.def(Pe.shared.strings, ".id(", He, ")");
              return b.optional(function() {
                Ie(
                  Pe.shared.shader,
                  ".shader(",
                  Cd[S],
                  ",",
                  Re,
                  ",",
                  Pe.command,
                  ");"
                );
              }), Re;
            });
          }
          return null;
        }
        var P = I(pi), q = I(di), v = null, C;
        return so(P) && so(q) ? (v = Fe.program(q.id, P.id, null, L), C = gr(function(S, U) {
          return S.link(v);
        })) : C = new Er(
          P && P.thisDep || q && q.thisDep,
          P && P.contextDep || q && q.contextDep,
          P && P.propDep || q && q.propDep,
          function(S, U) {
            var Y = S.shared.shader, ye;
            P ? ye = P.append(S, U) : ye = U.def(Y, ".", pi);
            var Pe;
            q ? Pe = q.append(S, U) : Pe = U.def(Y, ".", di);
            var Ie = Y + ".program(" + Pe + "," + ye;
            return b.optional(function() {
              Ie += "," + S.command;
            }), U.def(Ie + ")");
          }
        ), {
          frag: P,
          vert: q,
          progVar: C,
          program: v
        };
      }
      function ir(x, y) {
        var L = x.static, $ = x.dynamic, W = {}, I = !1;
        function P() {
          if (hi in L) {
            var rt = L[hi];
            return rt !== null && De.getVAO(rt) === null && (rt = De.createVAO(rt)), I = !0, W.vao = rt, gr(function(et) {
              var tt = De.getVAO(rt);
              return tt ? et.link(tt) : "null";
            });
          } else if (hi in $) {
            I = !0;
            var Ze = $[hi];
            return Wr(Ze, function(et, tt) {
              var nt = et.invoke(tt, Ze);
              return tt.def(et.shared.vao + ".getVAO(" + nt + ")");
            });
          }
          return null;
        }
        var q = P(), v = !1;
        function C() {
          if (Mo in L) {
            var rt = L[Mo];
            if (W.elements = rt, U0(rt)) {
              var Ze = W.elements = ee.create(rt, !0);
              rt = ee.getElements(Ze), v = !0;
            } else rt && (rt = ee.getElements(rt), v = !0, b.command(rt, "invalid elements", y.commandStr));
            var et = gr(function(nt, yt) {
              if (rt) {
                var Jt = nt.link(rt);
                return nt.ELEMENTS = Jt, Jt;
              }
              return nt.ELEMENTS = null, null;
            });
            return et.value = rt, et;
          } else if (Mo in $) {
            v = !0;
            var tt = $[Mo];
            return Wr(tt, function(nt, yt) {
              var Jt = nt.shared, Lr = Jt.isBufferArgs, qn = Jt.elements, $n = nt.invoke(yt, tt), zn = yt.def("null"), $r = yt.def(Lr, "(", $n, ")"), kn = nt.cond($r).then(zn, "=", qn, ".createStream(", $n, ");").else(zn, "=", qn, ".getElements(", $n, ");");
              return b.optional(function() {
                nt.assert(
                  kn.else,
                  "!" + $n + "||" + zn,
                  "invalid elements"
                );
              }), yt.entry(kn), yt.exit(
                nt.cond($r).then(qn, ".destroyStream(", zn, ");")
              ), nt.ELEMENTS = zn, zn;
            });
          } else if (I)
            return new Er(
              q.thisDep,
              q.contextDep,
              q.propDep,
              function(nt, yt) {
                return yt.def(nt.shared.vao + ".currentVAO?" + nt.shared.elements + ".getElements(" + nt.shared.vao + ".currentVAO.elements):null");
              }
            );
          return null;
        }
        var S = C();
        function U() {
          if (Co in L) {
            var rt = L[Co];
            return W.primitive = rt, b.commandParameter(rt, no, "invalid primitve", y.commandStr), gr(function(et, tt) {
              return no[rt];
            });
          } else if (Co in $) {
            var Ze = $[Co];
            return Wr(Ze, function(et, tt) {
              var nt = et.constants.primTypes, yt = et.invoke(tt, Ze);
              return b.optional(function() {
                et.assert(
                  tt,
                  yt + " in " + nt,
                  "invalid primitive, must be one of " + Object.keys(no)
                );
              }), tt.def(nt, "[", yt, "]");
            });
          } else {
            if (v)
              return so(S) ? S.value ? gr(function(et, tt) {
                return tt.def(et.ELEMENTS, ".primType");
              }) : gr(function() {
                return tc;
              }) : new Er(
                S.thisDep,
                S.contextDep,
                S.propDep,
                function(et, tt) {
                  var nt = et.ELEMENTS;
                  return tt.def(nt, "?", nt, ".primType:", tc);
                }
              );
            if (I)
              return new Er(
                q.thisDep,
                q.contextDep,
                q.propDep,
                function(et, tt) {
                  return tt.def(et.shared.vao + ".currentVAO?" + et.shared.vao + ".currentVAO.primitive:" + tc);
                }
              );
          }
          return null;
        }
        function Y(rt, Ze) {
          if (rt in L) {
            var et = L[rt] | 0;
            return Ze ? W.offset = et : W.instances = et, b.command(!Ze || et >= 0, "invalid " + rt, y.commandStr), gr(function(nt, yt) {
              return Ze && (nt.OFFSET = et), et;
            });
          } else if (rt in $) {
            var tt = $[rt];
            return Wr(tt, function(nt, yt) {
              var Jt = nt.invoke(yt, tt);
              return Ze && (nt.OFFSET = Jt, b.optional(function() {
                nt.assert(
                  yt,
                  Jt + ">=0",
                  "invalid " + rt
                );
              })), Jt;
            });
          } else if (Ze) {
            if (v)
              return gr(function(nt, yt) {
                return nt.OFFSET = 0, 0;
              });
            if (I)
              return new Er(
                q.thisDep,
                q.contextDep,
                q.propDep,
                function(nt, yt) {
                  return yt.def(nt.shared.vao + ".currentVAO?" + nt.shared.vao + ".currentVAO.offset:0");
                }
              );
          } else if (I)
            return new Er(
              q.thisDep,
              q.contextDep,
              q.propDep,
              function(nt, yt) {
                return yt.def(nt.shared.vao + ".currentVAO?" + nt.shared.vao + ".currentVAO.instances:-1");
              }
            );
          return null;
        }
        var ye = Y(O0, !0);
        function Pe() {
          if (Lo in L) {
            var rt = L[Lo] | 0;
            return W.count = rt, b.command(
              typeof rt == "number" && rt >= 0,
              "invalid vertex count",
              y.commandStr
            ), gr(function() {
              return rt;
            });
          } else if (Lo in $) {
            var Ze = $[Lo];
            return Wr(Ze, function(yt, Jt) {
              var Lr = yt.invoke(Jt, Ze);
              return b.optional(function() {
                yt.assert(
                  Jt,
                  "typeof " + Lr + '==="number"&&' + Lr + ">=0&&" + Lr + "===(" + Lr + "|0)",
                  "invalid vertex count"
                );
              }), Lr;
            });
          } else if (v)
            if (so(S)) {
              if (S)
                return ye ? new Er(
                  ye.thisDep,
                  ye.contextDep,
                  ye.propDep,
                  function(yt, Jt) {
                    var Lr = Jt.def(
                      yt.ELEMENTS,
                      ".vertCount-",
                      yt.OFFSET
                    );
                    return b.optional(function() {
                      yt.assert(
                        Jt,
                        Lr + ">=0",
                        "invalid vertex offset/element buffer too small"
                      );
                    }), Lr;
                  }
                ) : gr(function(yt, Jt) {
                  return Jt.def(yt.ELEMENTS, ".vertCount");
                });
              var et = gr(function() {
                return -1;
              });
              return b.optional(function() {
                et.MISSING = !0;
              }), et;
            } else {
              var tt = new Er(
                S.thisDep || ye.thisDep,
                S.contextDep || ye.contextDep,
                S.propDep || ye.propDep,
                function(yt, Jt) {
                  var Lr = yt.ELEMENTS;
                  return yt.OFFSET ? Jt.def(
                    Lr,
                    "?",
                    Lr,
                    ".vertCount-",
                    yt.OFFSET,
                    ":-1"
                  ) : Jt.def(Lr, "?", Lr, ".vertCount:-1");
                }
              );
              return b.optional(function() {
                tt.DYNAMIC = !0;
              }), tt;
            }
          else if (I) {
            var nt = new Er(
              q.thisDep,
              q.contextDep,
              q.propDep,
              function(yt, Jt) {
                return Jt.def(yt.shared.vao, ".currentVAO?", yt.shared.vao, ".currentVAO.count:-1");
              }
            );
            return nt;
          }
          return null;
        }
        var Ie = U(), He = Pe(), Re = Y(P0, !1);
        return {
          elements: S,
          primitive: Ie,
          count: He,
          instances: Re,
          offset: ye,
          vao: q,
          vaoActive: I,
          elementsActive: v,
          // static draw props
          static: W
        };
      }
      function sr(x, y) {
        var L = x.static, $ = x.dynamic, W = {};
        return dt.forEach(function(I) {
          var P = Je(I);
          function q(v, C) {
            if (I in L) {
              var S = v(L[I]);
              W[P] = gr(function() {
                return S;
              });
            } else if (I in $) {
              var U = $[I];
              W[P] = Wr(U, function(Y, ye) {
                return C(Y, ye, Y.invoke(ye, U));
              });
            }
          }
          switch (I) {
            case dd:
            case id:
            case ad:
            case bd:
            case ld:
            case Ad:
            case hd:
            case md:
            case yd:
            case fd:
              return q(
                function(v) {
                  return b.commandType(v, "boolean", I, y.commandStr), v;
                },
                function(v, C, S) {
                  return b.optional(function() {
                    v.assert(
                      C,
                      "typeof " + S + '==="boolean"',
                      "invalid flag " + I,
                      v.commandStr
                    );
                  }), S;
                }
              );
            case cd:
              return q(
                function(v) {
                  return b.commandParameter(v, ma, "invalid " + I, y.commandStr), ma[v];
                },
                function(v, C, S) {
                  var U = v.constants.compareFuncs;
                  return b.optional(function() {
                    v.assert(
                      C,
                      S + " in " + U,
                      "invalid " + I + ", must be one of " + Object.keys(ma)
                    );
                  }), C.def(U, "[", S, "]");
                }
              );
            case ud:
              return q(
                function(v) {
                  return b.command(
                    pr(v) && v.length === 2 && typeof v[0] == "number" && typeof v[1] == "number" && v[0] <= v[1],
                    "depth range is 2d array",
                    y.commandStr
                  ), v;
                },
                function(v, C, S) {
                  b.optional(function() {
                    v.assert(
                      C,
                      v.shared.isArrayLike + "(" + S + ")&&" + S + ".length===2&&typeof " + S + '[0]==="number"&&typeof ' + S + '[1]==="number"&&' + S + "[0]<=" + S + "[1]",
                      "depth range must be a 2d array"
                    );
                  });
                  var U = C.def("+", S, "[0]"), Y = C.def("+", S, "[1]");
                  return [U, Y];
                }
              );
            case $l:
              return q(
                function(v) {
                  b.commandType(v, "object", "blend.func", y.commandStr);
                  var C = "srcRGB" in v ? v.srcRGB : v.src, S = "srcAlpha" in v ? v.srcAlpha : v.src, U = "dstRGB" in v ? v.dstRGB : v.dst, Y = "dstAlpha" in v ? v.dstAlpha : v.dst;
                  return b.commandParameter(C, En, P + ".srcRGB", y.commandStr), b.commandParameter(S, En, P + ".srcAlpha", y.commandStr), b.commandParameter(U, En, P + ".dstRGB", y.commandStr), b.commandParameter(Y, En, P + ".dstAlpha", y.commandStr), b.command(
                    Md.indexOf(C + ", " + U) === -1,
                    "unallowed blending combination (srcRGB, dstRGB) = (" + C + ", " + U + ")",
                    y.commandStr
                  ), [
                    En[C],
                    En[U],
                    En[S],
                    En[Y]
                  ];
                },
                function(v, C, S) {
                  var U = v.constants.blendFuncs;
                  b.optional(function() {
                    v.assert(
                      C,
                      S + "&&typeof " + S + '==="object"',
                      "invalid blend func, must be an object"
                    );
                  });
                  function Y(Ze, et) {
                    var tt = C.def(
                      '"',
                      Ze,
                      et,
                      '" in ',
                      S,
                      "?",
                      S,
                      ".",
                      Ze,
                      et,
                      ":",
                      S,
                      ".",
                      Ze
                    );
                    return b.optional(function() {
                      v.assert(
                        C,
                        tt + " in " + U,
                        "invalid " + I + "." + Ze + et + ", must be one of " + Object.keys(En)
                      );
                    }), tt;
                  }
                  var ye = Y("src", "RGB"), Pe = Y("dst", "RGB");
                  b.optional(function() {
                    var Ze = v.constants.invalidBlendCombinations;
                    v.assert(
                      C,
                      Ze + ".indexOf(" + ye + '+", "+' + Pe + ") === -1 ",
                      "unallowed blending combination for (srcRGB, dstRGB)"
                    );
                  });
                  var Ie = C.def(U, "[", ye, "]"), He = C.def(U, "[", Y("src", "Alpha"), "]"), Re = C.def(U, "[", Pe, "]"), rt = C.def(U, "[", Y("dst", "Alpha"), "]");
                  return [Ie, Re, He, rt];
                }
              );
            case ql:
              return q(
                function(v) {
                  if (typeof v == "string")
                    return b.commandParameter(v, se, "invalid " + I, y.commandStr), [
                      se[v],
                      se[v]
                    ];
                  if (typeof v == "object")
                    return b.commandParameter(
                      v.rgb,
                      se,
                      I + ".rgb",
                      y.commandStr
                    ), b.commandParameter(
                      v.alpha,
                      se,
                      I + ".alpha",
                      y.commandStr
                    ), [
                      se[v.rgb],
                      se[v.alpha]
                    ];
                  b.commandRaise("invalid blend.equation", y.commandStr);
                },
                function(v, C, S) {
                  var U = v.constants.blendEquations, Y = C.def(), ye = C.def(), Pe = v.cond("typeof ", S, '==="string"');
                  return b.optional(function() {
                    function Ie(He, Re, rt) {
                      v.assert(
                        He,
                        rt + " in " + U,
                        "invalid " + Re + ", must be one of " + Object.keys(se)
                      );
                    }
                    Ie(Pe.then, I, S), v.assert(
                      Pe.else,
                      S + "&&typeof " + S + '==="object"',
                      "invalid " + I
                    ), Ie(Pe.else, I + ".rgb", S + ".rgb"), Ie(Pe.else, I + ".alpha", S + ".alpha");
                  }), Pe.then(
                    Y,
                    "=",
                    ye,
                    "=",
                    U,
                    "[",
                    S,
                    "];"
                  ), Pe.else(
                    Y,
                    "=",
                    U,
                    "[",
                    S,
                    ".rgb];",
                    ye,
                    "=",
                    U,
                    "[",
                    S,
                    ".alpha];"
                  ), C(Pe), [Y, ye];
                }
              );
            case sd:
              return q(
                function(v) {
                  return b.command(
                    pr(v) && v.length === 4,
                    "blend.color must be a 4d array",
                    y.commandStr
                  ), Or(4, function(C) {
                    return +v[C];
                  });
                },
                function(v, C, S) {
                  return b.optional(function() {
                    v.assert(
                      C,
                      v.shared.isArrayLike + "(" + S + ")&&" + S + ".length===4",
                      "blend.color must be a 4d array"
                    );
                  }), Or(4, function(U) {
                    return C.def("+", S, "[", U, "]");
                  });
                }
              );
            case gd:
              return q(
                function(v) {
                  return b.commandType(v, "number", P, y.commandStr), v | 0;
                },
                function(v, C, S) {
                  return b.optional(function() {
                    v.assert(
                      C,
                      "typeof " + S + '==="number"',
                      "invalid stencil.mask"
                    );
                  }), C.def(S, "|0");
                }
              );
            case Wl:
              return q(
                function(v) {
                  b.commandType(v, "object", P, y.commandStr);
                  var C = v.cmp || "keep", S = v.ref || 0, U = "mask" in v ? v.mask : -1;
                  return b.commandParameter(C, ma, I + ".cmp", y.commandStr), b.commandType(S, "number", I + ".ref", y.commandStr), b.commandType(U, "number", I + ".mask", y.commandStr), [
                    ma[C],
                    S,
                    U
                  ];
                },
                function(v, C, S) {
                  var U = v.constants.compareFuncs;
                  b.optional(function() {
                    function Ie() {
                      v.assert(
                        C,
                        Array.prototype.join.call(arguments, ""),
                        "invalid stencil.func"
                      );
                    }
                    Ie(S + "&&typeof ", S, '==="object"'), Ie(
                      '!("cmp" in ',
                      S,
                      ")||(",
                      S,
                      ".cmp in ",
                      U,
                      ")"
                    );
                  });
                  var Y = C.def(
                    '"cmp" in ',
                    S,
                    "?",
                    U,
                    "[",
                    S,
                    ".cmp]",
                    ":",
                    ao
                  ), ye = C.def(S, ".ref|0"), Pe = C.def(
                    '"mask" in ',
                    S,
                    "?",
                    S,
                    ".mask|0:-1"
                  );
                  return [Y, ye, Pe];
                }
              );
            case Xl:
            case ui:
              return q(
                function(v) {
                  b.commandType(v, "object", P, y.commandStr);
                  var C = v.fail || "keep", S = v.zfail || "keep", U = v.zpass || "keep";
                  return b.commandParameter(C, io, I + ".fail", y.commandStr), b.commandParameter(S, io, I + ".zfail", y.commandStr), b.commandParameter(U, io, I + ".zpass", y.commandStr), [
                    I === ui ? Fo : vi,
                    io[C],
                    io[S],
                    io[U]
                  ];
                },
                function(v, C, S) {
                  var U = v.constants.stencilOps;
                  b.optional(function() {
                    v.assert(
                      C,
                      S + "&&typeof " + S + '==="object"',
                      "invalid " + I
                    );
                  });
                  function Y(ye) {
                    return b.optional(function() {
                      v.assert(
                        C,
                        '!("' + ye + '" in ' + S + ")||(" + S + "." + ye + " in " + U + ")",
                        "invalid " + I + "." + ye + ", must be one of " + Object.keys(io)
                      );
                    }), C.def(
                      '"',
                      ye,
                      '" in ',
                      S,
                      "?",
                      U,
                      "[",
                      S,
                      ".",
                      ye,
                      "]:",
                      ao
                    );
                  }
                  return [
                    I === ui ? Fo : vi,
                    Y("fail"),
                    Y("zfail"),
                    Y("zpass")
                  ];
                }
              );
            case Ul:
              return q(
                function(v) {
                  b.commandType(v, "object", P, y.commandStr);
                  var C = v.factor | 0, S = v.units | 0;
                  return b.commandType(C, "number", P + ".factor", y.commandStr), b.commandType(S, "number", P + ".units", y.commandStr), [C, S];
                },
                function(v, C, S) {
                  b.optional(function() {
                    v.assert(
                      C,
                      S + "&&typeof " + S + '==="object"',
                      "invalid " + I
                    );
                  });
                  var U = C.def(S, ".factor|0"), Y = C.def(S, ".units|0");
                  return [U, Y];
                }
              );
            case pd:
              return q(
                function(v) {
                  var C = 0;
                  return v === "front" ? C = vi : v === "back" && (C = Fo), b.command(!!C, P, y.commandStr), C;
                },
                function(v, C, S) {
                  return b.optional(function() {
                    v.assert(
                      C,
                      S + '==="front"||' + S + '==="back"',
                      "invalid cull.face"
                    );
                  }), C.def(S, '==="front"?', vi, ":", Fo);
                }
              );
            case Hl:
              return q(
                function(v) {
                  return b.command(
                    typeof v == "number" && v >= te.lineWidthDims[0] && v <= te.lineWidthDims[1],
                    "invalid line width, must be a positive number between " + te.lineWidthDims[0] + " and " + te.lineWidthDims[1],
                    y.commandStr
                  ), v;
                },
                function(v, C, S) {
                  return b.optional(function() {
                    v.assert(
                      C,
                      "typeof " + S + '==="number"&&' + S + ">=" + te.lineWidthDims[0] + "&&" + S + "<=" + te.lineWidthDims[1],
                      "invalid line width"
                    );
                  }), S;
                }
              );
            case jl:
              return q(
                function(v) {
                  return b.commandParameter(v, nc, P, y.commandStr), nc[v];
                },
                function(v, C, S) {
                  return b.optional(function() {
                    v.assert(
                      C,
                      S + '==="cw"||' + S + '==="ccw"',
                      "invalid frontFace, must be one of cw,ccw"
                    );
                  }), C.def(S + '==="cw"?' + Ed + ":" + rc);
                }
              );
            case zl:
              return q(
                function(v) {
                  return b.command(
                    pr(v) && v.length === 4,
                    "color.mask must be length 4 array",
                    y.commandStr
                  ), v.map(function(C) {
                    return !!C;
                  });
                },
                function(v, C, S) {
                  return b.optional(function() {
                    v.assert(
                      C,
                      v.shared.isArrayLike + "(" + S + ")&&" + S + ".length===4",
                      "invalid color.mask"
                    );
                  }), Or(4, function(U) {
                    return "!!" + S + "[" + U + "]";
                  });
                }
              );
            case Vl:
              return q(
                function(v) {
                  b.command(typeof v == "object" && v, P, y.commandStr);
                  var C = "value" in v ? v.value : 1, S = !!v.invert;
                  return b.command(
                    typeof C == "number" && C >= 0 && C <= 1,
                    "sample.coverage.value must be a number between 0 and 1",
                    y.commandStr
                  ), [C, S];
                },
                function(v, C, S) {
                  b.optional(function() {
                    v.assert(
                      C,
                      S + "&&typeof " + S + '==="object"',
                      "invalid sample.coverage"
                    );
                  });
                  var U = C.def(
                    '"value" in ',
                    S,
                    "?+",
                    S,
                    ".value:1"
                  ), Y = C.def("!!", S, ".invert");
                  return [U, Y];
                }
              );
          }
        }), W;
      }
      function Pt(x, y) {
        var L = x.static, $ = x.dynamic, W = {};
        return Object.keys(L).forEach(function(I) {
          var P = L[I], q;
          if (typeof P == "number" || typeof P == "boolean")
            q = gr(function() {
              return P;
            });
          else if (typeof P == "function") {
            var v = P._reglType;
            v === "texture2d" || v === "textureCube" ? q = gr(function(C) {
              return C.link(P);
            }) : v === "framebuffer" || v === "framebufferCube" ? (b.command(
              P.color.length > 0,
              'missing color attachment for framebuffer sent to uniform "' + I + '"',
              y.commandStr
            ), q = gr(function(C) {
              return C.link(P.color[0]);
            })) : b.commandRaise('invalid data for uniform "' + I + '"', y.commandStr);
          } else pr(P) ? q = gr(function(C) {
            var S = C.global.def(
              "[",
              Or(P.length, function(U) {
                return b.command(
                  typeof P[U] == "number" || typeof P[U] == "boolean",
                  "invalid uniform " + I,
                  C.commandStr
                ), P[U];
              }),
              "]"
            );
            return S;
          }) : b.commandRaise('invalid or missing data for uniform "' + I + '"', y.commandStr);
          q.value = P, W[I] = q;
        }), Object.keys($).forEach(function(I) {
          var P = $[I];
          W[I] = Wr(P, function(q, v) {
            return q.invoke(v, P);
          });
        }), W;
      }
      function vr(x, y) {
        var L = x.static, $ = x.dynamic, W = {};
        return Object.keys(L).forEach(function(I) {
          var P = L[I], q = g.id(I), v = new H();
          if (U0(P))
            v.state = fa, v.buffer = de.getBuffer(
              de.create(P, ha, !1, !0)
            ), v.type = 0;
          else {
            var C = de.getBuffer(P);
            if (C)
              v.state = fa, v.buffer = C, v.type = 0;
            else if (b.command(
              typeof P == "object" && P,
              "invalid data for attribute " + I,
              y.commandStr
            ), "constant" in P) {
              var S = P.constant;
              v.buffer = "null", v.state = Pl, typeof S == "number" ? v.x = S : (b.command(
                pr(S) && S.length > 0 && S.length <= 4,
                "invalid constant for attribute " + I,
                y.commandStr
              ), ua.forEach(function(Re, rt) {
                rt < S.length && (v[Re] = S[rt]);
              }));
            } else {
              U0(P.buffer) ? C = de.getBuffer(
                de.create(P.buffer, ha, !1, !0)
              ) : C = de.getBuffer(P.buffer), b.command(!!C, 'missing buffer for attribute "' + I + '"', y.commandStr);
              var U = P.offset | 0;
              b.command(
                U >= 0,
                'invalid offset for attribute "' + I + '"',
                y.commandStr
              );
              var Y = P.stride | 0;
              b.command(
                Y >= 0 && Y < 256,
                'invalid stride for attribute "' + I + '", must be integer betweeen [0, 255]',
                y.commandStr
              );
              var ye = P.size | 0;
              b.command(
                !("size" in P) || ye > 0 && ye <= 4,
                'invalid size for attribute "' + I + '", must be 1,2,3,4',
                y.commandStr
              );
              var Pe = !!P.normalized, Ie = 0;
              "type" in P && (b.commandParameter(
                P.type,
                _o,
                "invalid type for attribute " + I,
                y.commandStr
              ), Ie = _o[P.type]);
              var He = P.divisor | 0;
              b.optional(function() {
                "divisor" in P && (b.command(
                  He === 0 || ke,
                  'cannot specify divisor for attribute "' + I + '", instancing not supported',
                  y.commandStr
                ), b.command(
                  He >= 0,
                  'invalid divisor for attribute "' + I + '"',
                  y.commandStr
                ));
                var Re = y.commandStr, rt = [
                  "buffer",
                  "offset",
                  "divisor",
                  "normalized",
                  "type",
                  "size",
                  "stride"
                ];
                Object.keys(P).forEach(function(Ze) {
                  b.command(
                    rt.indexOf(Ze) >= 0,
                    'unknown parameter "' + Ze + '" for attribute pointer "' + I + '" (valid parameters are ' + rt + ")",
                    Re
                  );
                });
              }), v.buffer = C, v.state = fa, v.size = ye, v.normalized = Pe, v.type = Ie || C.dtype, v.offset = U, v.stride = Y, v.divisor = He;
            }
          }
          W[I] = gr(function(Re, rt) {
            var Ze = Re.attribCache;
            if (q in Ze)
              return Ze[q];
            var et = {
              isStream: !1
            };
            return Object.keys(v).forEach(function(tt) {
              et[tt] = v[tt];
            }), v.buffer && (et.buffer = Re.link(v.buffer), et.type = et.type || et.buffer + ".dtype"), Ze[q] = et, et;
          });
        }), Object.keys($).forEach(function(I) {
          var P = $[I];
          function q(v, C) {
            var S = v.invoke(C, P), U = v.shared, Y = v.constants, ye = U.isBufferArgs, Pe = U.buffer;
            b.optional(function() {
              v.assert(
                C,
                S + "&&(typeof " + S + '==="object"||typeof ' + S + '==="function")&&(' + ye + "(" + S + ")||" + Pe + ".getBuffer(" + S + ")||" + Pe + ".getBuffer(" + S + ".buffer)||" + ye + "(" + S + '.buffer)||("constant" in ' + S + "&&(typeof " + S + '.constant==="number"||' + U.isArrayLike + "(" + S + ".constant))))",
                'invalid dynamic attribute "' + I + '"'
              );
            });
            var Ie = {
              isStream: C.def(!1)
            }, He = new H();
            He.state = fa, Object.keys(He).forEach(function(et) {
              Ie[et] = C.def("" + He[et]);
            });
            var Re = Ie.buffer, rt = Ie.type;
            C(
              "if(",
              ye,
              "(",
              S,
              ")){",
              Ie.isStream,
              "=true;",
              Re,
              "=",
              Pe,
              ".createStream(",
              ha,
              ",",
              S,
              ");",
              rt,
              "=",
              Re,
              ".dtype;",
              "}else{",
              Re,
              "=",
              Pe,
              ".getBuffer(",
              S,
              ");",
              "if(",
              Re,
              "){",
              rt,
              "=",
              Re,
              ".dtype;",
              '}else if("constant" in ',
              S,
              "){",
              Ie.state,
              "=",
              Pl,
              ";",
              "if(typeof " + S + '.constant === "number"){',
              Ie[ua[0]],
              "=",
              S,
              ".constant;",
              ua.slice(1).map(function(et) {
                return Ie[et];
              }).join("="),
              "=0;",
              "}else{",
              ua.map(function(et, tt) {
                return Ie[et] + "=" + S + ".constant.length>" + tt + "?" + S + ".constant[" + tt + "]:0;";
              }).join(""),
              "}}else{",
              "if(",
              ye,
              "(",
              S,
              ".buffer)){",
              Re,
              "=",
              Pe,
              ".createStream(",
              ha,
              ",",
              S,
              ".buffer);",
              "}else{",
              Re,
              "=",
              Pe,
              ".getBuffer(",
              S,
              ".buffer);",
              "}",
              rt,
              '="type" in ',
              S,
              "?",
              Y.glTypes,
              "[",
              S,
              ".type]:",
              Re,
              ".dtype;",
              Ie.normalized,
              "=!!",
              S,
              ".normalized;"
            );
            function Ze(et) {
              C(Ie[et], "=", S, ".", et, "|0;");
            }
            return Ze("size"), Ze("offset"), Ze("stride"), Ze("divisor"), C("}}"), C.exit(
              "if(",
              Ie.isStream,
              "){",
              Pe,
              ".destroyStream(",
              Re,
              ");",
              "}"
            ), Ie;
          }
          W[I] = Wr(P, q);
        }), W;
      }
      function er(x) {
        var y = x.static, L = x.dynamic, $ = {};
        return Object.keys(y).forEach(function(W) {
          var I = y[W];
          $[W] = gr(function(P, q) {
            return typeof I == "number" || typeof I == "boolean" ? "" + I : P.link(I);
          });
        }), Object.keys(L).forEach(function(W) {
          var I = L[W];
          $[W] = Wr(I, function(P, q) {
            return P.invoke(q, I);
          });
        }), $;
      }
      function Ar(x, y, L, $, W) {
        var I = x.static, P = x.dynamic;
        b.optional(function() {
          var Ze = [
            Do,
            di,
            pi,
            Mo,
            Co,
            O0,
            Lo,
            P0,
            fi,
            hi
          ].concat(dt);
          function et(tt) {
            Object.keys(tt).forEach(function(nt) {
              b.command(
                Ze.indexOf(nt) >= 0,
                'unknown parameter "' + nt + '"',
                W.commandStr
              );
            });
          }
          et(I), et(P);
        });
        var q = _t(x, y), v = Ye(x), C = mt(x, v, W), S = ir(x, W), U = sr(x, W), Y = Rt(x, W, q);
        function ye(Ze) {
          var et = C[Ze];
          et && (U[Ze] = et);
        }
        ye(Gn), ye(Je(R0));
        var Pe = Object.keys(U).length > 0, Ie = {
          framebuffer: v,
          draw: S,
          shader: Y,
          state: U,
          dirty: Pe,
          scopeVAO: null,
          drawVAO: null,
          useVAO: !1,
          attributes: {}
        };
        if (Ie.profile = je(x), Ie.uniforms = Pt(L, W), Ie.drawVAO = Ie.scopeVAO = S.vao, !Ie.drawVAO && Y.program && !q && D.angle_instanced_arrays && S.static.elements) {
          var He = !0, Re = Y.program.attributes.map(function(Ze) {
            var et = y.static[Ze];
            return He = He && !!et, et;
          });
          if (He && Re.length > 0) {
            var rt = De.getVAO(De.createVAO({
              attributes: Re,
              elements: S.static.elements
            }));
            Ie.drawVAO = new Er(null, null, null, function(Ze, et) {
              return Ze.link(rt);
            }), Ie.useVAO = !0;
          }
        }
        return q ? Ie.useVAO = !0 : Ie.attributes = vr(y, W), Ie.context = er($), Ie;
      }
      function wr(x, y, L) {
        var $ = x.shared, W = $.context, I = x.scope();
        Object.keys(L).forEach(function(P) {
          y.save(W, "." + P);
          var q = L[P], v = q.append(x, y);
          Array.isArray(v) ? I(W, ".", P, "=[", v.join(), "];") : I(W, ".", P, "=", v, ";");
        }), y(I);
      }
      function xr(x, y, L, $) {
        var W = x.shared, I = W.gl, P = W.framebuffer, q;
        Ke && (q = y.def(W.extensions, ".webgl_draw_buffers"));
        var v = x.constants, C = v.drawBuffer, S = v.backBuffer, U;
        L ? U = L.append(x, y) : U = y.def(P, ".next"), $ || y("if(", U, "!==", P, ".cur){"), y(
          "if(",
          U,
          "){",
          I,
          ".bindFramebuffer(",
          Dd,
          ",",
          U,
          ".framebuffer);"
        ), Ke && y(
          q,
          ".drawBuffersWEBGL(",
          C,
          "[",
          U,
          ".colorAttachments.length]);"
        ), y(
          "}else{",
          I,
          ".bindFramebuffer(",
          Dd,
          ",null);"
        ), Ke && y(q, ".drawBuffersWEBGL(", S, ");"), y(
          "}",
          P,
          ".cur=",
          U,
          ";"
        ), $ || y("}");
      }
      function Cr(x, y, L) {
        var $ = x.shared, W = $.gl, I = x.current, P = x.next, q = $.current, v = $.next, C = x.cond(q, ".dirty");
        dt.forEach(function(S) {
          var U = Je(S);
          if (!(U in L.state)) {
            var Y, ye;
            if (U in P) {
              Y = P[U], ye = I[U];
              var Pe = Or(Xe[U].length, function(He) {
                return C.def(Y, "[", He, "]");
              });
              C(x.cond(Pe.map(function(He, Re) {
                return He + "!==" + ye + "[" + Re + "]";
              }).join("||")).then(
                W,
                ".",
                fe[U],
                "(",
                Pe,
                ");",
                Pe.map(function(He, Re) {
                  return ye + "[" + Re + "]=" + He;
                }).join(";"),
                ";"
              ));
            } else {
              Y = C.def(v, ".", U);
              var Ie = x.cond(Y, "!==", q, ".", U);
              C(Ie), U in he ? Ie(
                x.cond(Y).then(W, ".enable(", he[U], ");").else(W, ".disable(", he[U], ");"),
                q,
                ".",
                U,
                "=",
                Y,
                ";"
              ) : Ie(
                W,
                ".",
                fe[U],
                "(",
                Y,
                ");",
                q,
                ".",
                U,
                "=",
                Y,
                ";"
              );
            }
          }
        }), Object.keys(L.state).length === 0 && C(q, ".dirty=false;"), y(C);
      }
      function Ir(x, y, L, $) {
        var W = x.shared, I = x.current, P = W.current, q = W.gl;
        Ld(Object.keys(L)).forEach(function(v) {
          var C = L[v];
          if (!($ && !$(C))) {
            var S = C.append(x, y);
            if (he[v]) {
              var U = he[v];
              so(C) ? S ? y(q, ".enable(", U, ");") : y(q, ".disable(", U, ");") : y(x.cond(S).then(q, ".enable(", U, ");").else(q, ".disable(", U, ");")), y(P, ".", v, "=", S, ";");
            } else if (pr(S)) {
              var Y = I[v];
              y(
                q,
                ".",
                fe[v],
                "(",
                S,
                ");",
                S.map(function(ye, Pe) {
                  return Y + "[" + Pe + "]=" + ye;
                }).join(";"),
                ";"
              );
            } else
              y(
                q,
                ".",
                fe[v],
                "(",
                S,
                ");",
                P,
                ".",
                v,
                "=",
                S,
                ";"
              );
          }
        });
      }
      function hr(x, y) {
        ke && (x.instancing = y.def(
          x.shared.extensions,
          ".angle_instanced_arrays"
        ));
      }
      function Dt(x, y, L, $, W) {
        var I = x.shared, P = x.stats, q = I.current, v = I.timer, C = L.profile;
        function S() {
          return typeof performance > "u" ? "Date.now()" : "performance.now()";
        }
        var U, Y;
        function ye(Ze) {
          U = y.def(), Ze(U, "=", S(), ";"), typeof W == "string" ? Ze(P, ".count+=", W, ";") : Ze(P, ".count++;"), xe && ($ ? (Y = y.def(), Ze(Y, "=", v, ".getNumPendingQueries();")) : Ze(v, ".beginQuery(", P, ");"));
        }
        function Pe(Ze) {
          Ze(P, ".cpuTime+=", S(), "-", U, ";"), xe && ($ ? Ze(
            v,
            ".pushScopeStats(",
            Y,
            ",",
            v,
            ".getNumPendingQueries(),",
            P,
            ");"
          ) : Ze(v, ".endQuery();"));
        }
        function Ie(Ze) {
          var et = y.def(q, ".profile");
          y(q, ".profile=", Ze, ";"), y.exit(q, ".profile=", et, ";");
        }
        var He;
        if (C) {
          if (so(C)) {
            C.enable ? (ye(y), Pe(y.exit), Ie("true")) : Ie("false");
            return;
          }
          He = C.append(x, y), Ie(He);
        } else
          He = y.def(q, ".profile");
        var Re = x.block();
        ye(Re), y("if(", He, "){", Re, "}");
        var rt = x.block();
        Pe(rt), y.exit("if(", He, "){", rt, "}");
      }
      function Br(x, y, L, $, W) {
        var I = x.shared;
        function P(v) {
          switch (v) {
            case I0:
            case G0:
            case z0:
              return 2;
            case B0:
            case q0:
            case j0:
              return 3;
            case N0:
            case $0:
            case H0:
              return 4;
            default:
              return 1;
          }
        }
        function q(v, C, S) {
          var U = I.gl, Y = y.def(v, ".location"), ye = y.def(I.attributes, "[", Y, "]"), Pe = S.state, Ie = S.buffer, He = [
            S.x,
            S.y,
            S.z,
            S.w
          ], Re = [
            "buffer",
            "normalized",
            "offset",
            "stride"
          ];
          function rt() {
            y(
              "if(!",
              ye,
              ".buffer){",
              U,
              ".enableVertexAttribArray(",
              Y,
              ");}"
            );
            var et = S.type, tt;
            if (S.size ? tt = y.def(S.size, "||", C) : tt = C, y(
              "if(",
              ye,
              ".type!==",
              et,
              "||",
              ye,
              ".size!==",
              tt,
              "||",
              Re.map(function(yt) {
                return ye + "." + yt + "!==" + S[yt];
              }).join("||"),
              "){",
              U,
              ".bindBuffer(",
              ha,
              ",",
              Ie,
              ".buffer);",
              U,
              ".vertexAttribPointer(",
              [
                Y,
                tt,
                et,
                S.normalized,
                S.stride,
                S.offset
              ],
              ");",
              ye,
              ".type=",
              et,
              ";",
              ye,
              ".size=",
              tt,
              ";",
              Re.map(function(yt) {
                return ye + "." + yt + "=" + S[yt] + ";";
              }).join(""),
              "}"
            ), ke) {
              var nt = S.divisor;
              y(
                "if(",
                ye,
                ".divisor!==",
                nt,
                "){",
                x.instancing,
                ".vertexAttribDivisorANGLE(",
                [Y, nt],
                ");",
                ye,
                ".divisor=",
                nt,
                ";}"
              );
            }
          }
          function Ze() {
            y(
              "if(",
              ye,
              ".buffer){",
              U,
              ".disableVertexAttribArray(",
              Y,
              ");",
              ye,
              ".buffer=null;",
              "}if(",
              ua.map(function(et, tt) {
                return ye + "." + et + "!==" + He[tt];
              }).join("||"),
              "){",
              U,
              ".vertexAttrib4f(",
              Y,
              ",",
              He,
              ");",
              ua.map(function(et, tt) {
                return ye + "." + et + "=" + He[tt] + ";";
              }).join(""),
              "}"
            );
          }
          Pe === fa ? rt() : Pe === Pl ? Ze() : (y("if(", Pe, "===", fa, "){"), rt(), y("}else{"), Ze(), y("}"));
        }
        $.forEach(function(v) {
          var C = v.name, S = L.attributes[C], U;
          if (S) {
            if (!W(S))
              return;
            U = S.append(x, y);
          } else {
            if (!W(Fd))
              return;
            var Y = x.scopeAttrib(C);
            b.optional(function() {
              x.assert(
                y,
                Y + ".state",
                "missing attribute " + C
              );
            }), U = {}, Object.keys(new H()).forEach(function(ye) {
              U[ye] = y.def(Y, ".", ye);
            });
          }
          q(
            x.link(v),
            P(v.info.type),
            U
          );
        });
      }
      function Ht(x, y, L, $, W, I) {
        for (var P = x.shared, q = P.gl, v, C = 0; C < $.length; ++C) {
          var S = $[C], U = S.name, Y = S.info.type, ye = L.uniforms[U], Pe = x.link(S), Ie = Pe + ".location", He;
          if (ye) {
            if (!W(ye))
              continue;
            if (so(ye)) {
              var Re = ye.value;
              if (b.command(
                Re !== null && typeof Re < "u",
                'missing uniform "' + U + '"',
                x.commandStr
              ), Y === gi || Y === Ai) {
                b.command(
                  typeof Re == "function" && (Y === gi && (Re._reglType === "texture2d" || Re._reglType === "framebuffer") || Y === Ai && (Re._reglType === "textureCube" || Re._reglType === "framebufferCube")),
                  "invalid texture for uniform " + U,
                  x.commandStr
                );
                var rt = x.link(Re._texture || Re.color[0]._texture);
                y(q, ".uniform1i(", Ie, ",", rt + ".bind());"), y.exit(rt, ".unbind();");
              } else if (Y === mi || Y === yi || Y === bi) {
                b.optional(function() {
                  b.command(
                    pr(Re),
                    "invalid matrix for uniform " + U,
                    x.commandStr
                  ), b.command(
                    Y === mi && Re.length === 4 || Y === yi && Re.length === 9 || Y === bi && Re.length === 16,
                    "invalid length for matrix uniform " + U,
                    x.commandStr
                  );
                });
                var Ze = x.global.def("new Float32Array([" + Array.prototype.slice.call(Re) + "])"), et = 2;
                Y === yi ? et = 3 : Y === bi && (et = 4), y(
                  q,
                  ".uniformMatrix",
                  et,
                  "fv(",
                  Ie,
                  ",false,",
                  Ze,
                  ");"
                );
              } else {
                switch (Y) {
                  case Ql:
                    b.commandType(Re, "number", "uniform " + U, x.commandStr), v = "1f";
                    break;
                  case I0:
                    b.command(
                      pr(Re) && Re.length === 2,
                      "uniform " + U,
                      x.commandStr
                    ), v = "2f";
                    break;
                  case B0:
                    b.command(
                      pr(Re) && Re.length === 3,
                      "uniform " + U,
                      x.commandStr
                    ), v = "3f";
                    break;
                  case N0:
                    b.command(
                      pr(Re) && Re.length === 4,
                      "uniform " + U,
                      x.commandStr
                    ), v = "4f";
                    break;
                  case ec:
                    b.commandType(Re, "boolean", "uniform " + U, x.commandStr), v = "1i";
                    break;
                  case Jl:
                    b.commandType(Re, "number", "uniform " + U, x.commandStr), v = "1i";
                    break;
                  case z0:
                    b.command(
                      pr(Re) && Re.length === 2,
                      "uniform " + U,
                      x.commandStr
                    ), v = "2i";
                    break;
                  case G0:
                    b.command(
                      pr(Re) && Re.length === 2,
                      "uniform " + U,
                      x.commandStr
                    ), v = "2i";
                    break;
                  case j0:
                    b.command(
                      pr(Re) && Re.length === 3,
                      "uniform " + U,
                      x.commandStr
                    ), v = "3i";
                    break;
                  case q0:
                    b.command(
                      pr(Re) && Re.length === 3,
                      "uniform " + U,
                      x.commandStr
                    ), v = "3i";
                    break;
                  case H0:
                    b.command(
                      pr(Re) && Re.length === 4,
                      "uniform " + U,
                      x.commandStr
                    ), v = "4i";
                    break;
                  case $0:
                    b.command(
                      pr(Re) && Re.length === 4,
                      "uniform " + U,
                      x.commandStr
                    ), v = "4i";
                    break;
                }
                y(
                  q,
                  ".uniform",
                  v,
                  "(",
                  Ie,
                  ",",
                  pr(Re) ? Array.prototype.slice.call(Re) : Re,
                  ");"
                );
              }
              continue;
            } else
              He = ye.append(x, y);
          } else {
            if (!W(Fd))
              continue;
            He = y.def(P.uniforms, "[", g.id(U), "]");
          }
          Y === gi ? (b(!Array.isArray(He), "must specify a scalar prop for textures"), y(
            "if(",
            He,
            "&&",
            He,
            '._reglType==="framebuffer"){',
            He,
            "=",
            He,
            ".color[0];",
            "}"
          )) : Y === Ai && (b(!Array.isArray(He), "must specify a scalar prop for cube maps"), y(
            "if(",
            He,
            "&&",
            He,
            '._reglType==="framebufferCube"){',
            He,
            "=",
            He,
            ".color[0];",
            "}"
          )), b.optional(function() {
            function $r(mn, Gd) {
              x.assert(
                y,
                mn,
                'bad data or missing for uniform "' + U + '".  ' + Gd
              );
            }
            function kn(mn) {
              b(!Array.isArray(He), "must not specify an array type for uniform"), $r(
                "typeof " + He + '==="' + mn + '"',
                "invalid type, expected " + mn
              );
            }
            function an(mn, Gd) {
              Array.isArray(He) ? b(He.length === mn, "must have length " + mn) : $r(
                P.isArrayLike + "(" + He + ")&&" + He + ".length===" + mn,
                "invalid vector, should have length " + mn,
                x.commandStr
              );
            }
            function Nd(mn) {
              b(!Array.isArray(He), "must not specify a value type"), $r(
                "typeof " + He + '==="function"&&' + He + '._reglType==="texture' + (mn === _d ? "2d" : "Cube") + '"',
                "invalid texture type",
                x.commandStr
              );
            }
            switch (Y) {
              case Jl:
                kn("number");
                break;
              case G0:
                an(2);
                break;
              case q0:
                an(3);
                break;
              case $0:
                an(4);
                break;
              case Ql:
                kn("number");
                break;
              case I0:
                an(2);
                break;
              case B0:
                an(3);
                break;
              case N0:
                an(4);
                break;
              case ec:
                kn("boolean");
                break;
              case z0:
                an(2);
                break;
              case j0:
                an(3);
                break;
              case H0:
                an(4);
                break;
              case mi:
                an(4);
                break;
              case yi:
                an(9);
                break;
              case bi:
                an(16);
                break;
              case gi:
                Nd(_d);
                break;
              case Ai:
                Nd(iy);
                break;
            }
          });
          var tt = 1;
          switch (Y) {
            case gi:
            case Ai:
              var nt = y.def(He, "._texture");
              y(q, ".uniform1i(", Ie, ",", nt, ".bind());"), y.exit(nt, ".unbind();");
              continue;
            case Jl:
            case ec:
              v = "1i";
              break;
            case G0:
            case z0:
              v = "2i", tt = 2;
              break;
            case q0:
            case j0:
              v = "3i", tt = 3;
              break;
            case $0:
            case H0:
              v = "4i", tt = 4;
              break;
            case Ql:
              v = "1f";
              break;
            case I0:
              v = "2f", tt = 2;
              break;
            case B0:
              v = "3f", tt = 3;
              break;
            case N0:
              v = "4f", tt = 4;
              break;
            case mi:
              v = "Matrix2fv";
              break;
            case yi:
              v = "Matrix3fv";
              break;
            case bi:
              v = "Matrix4fv";
              break;
          }
          if (v.charAt(0) === "M") {
            y(q, ".uniform", v, "(", Ie, ",");
            var yt = Math.pow(Y - mi + 2, 2), Jt = x.global.def("new Float32Array(", yt, ")");
            Array.isArray(He) ? y(
              "false,(",
              Or(yt, function($r) {
                return Jt + "[" + $r + "]=" + He[$r];
              }),
              ",",
              Jt,
              ")"
            ) : y(
              "false,(Array.isArray(",
              He,
              ")||",
              He,
              " instanceof Float32Array)?",
              He,
              ":(",
              Or(yt, function($r) {
                return Jt + "[" + $r + "]=" + He + "[" + $r + "]";
              }),
              ",",
              Jt,
              ")"
            ), y(");");
          } else if (tt > 1) {
            for (var Lr = [], qn = [], $n = 0; $n < tt; ++$n)
              Array.isArray(He) ? qn.push(He[$n]) : qn.push(y.def(He + "[" + $n + "]")), I && Lr.push(y.def());
            I && y("if(!", x.batchId, "||", Lr.map(function($r, kn) {
              return $r + "!==" + qn[kn];
            }).join("||"), "){", Lr.map(function($r, kn) {
              return $r + "=" + qn[kn] + ";";
            }).join("")), y(q, ".uniform", v, "(", Ie, ",", qn.join(","), ");"), I && y("}");
          } else {
            if (b(!Array.isArray(He), "uniform value must not be an array"), I) {
              var zn = y.def();
              y(
                "if(!",
                x.batchId,
                "||",
                zn,
                "!==",
                He,
                "){",
                zn,
                "=",
                He,
                ";"
              );
            }
            y(q, ".uniform", v, "(", Ie, ",", He, ");"), I && y("}");
          }
        }
      }
      function ht(x, y, L, $) {
        var W = x.shared, I = W.gl, P = W.draw, q = $.draw;
        function v() {
          var tt = q.elements, nt, yt = y;
          return tt ? ((tt.contextDep && $.contextDynamic || tt.propDep) && (yt = L), nt = tt.append(x, yt), q.elementsActive && yt(
            "if(" + nt + ")" + I + ".bindBuffer(" + Zl + "," + nt + ".buffer.buffer);"
          )) : (nt = yt.def(), yt(
            nt,
            "=",
            P,
            ".",
            Mo,
            ";",
            "if(",
            nt,
            "){",
            I,
            ".bindBuffer(",
            Zl,
            ",",
            nt,
            ".buffer.buffer);}",
            "else if(",
            W.vao,
            ".currentVAO){",
            nt,
            "=",
            x.shared.elements + ".getElements(" + W.vao,
            ".currentVAO.elements);",
            ge ? "" : "if(" + nt + ")" + I + ".bindBuffer(" + Zl + "," + nt + ".buffer.buffer);",
            "}"
          )), nt;
        }
        function C() {
          var tt = q.count, nt, yt = y;
          return tt ? ((tt.contextDep && $.contextDynamic || tt.propDep) && (yt = L), nt = tt.append(x, yt), b.optional(function() {
            tt.MISSING && x.assert(y, "false", "missing vertex count"), tt.DYNAMIC && x.assert(yt, nt + ">=0", "missing vertex count");
          })) : (nt = yt.def(P, ".", Lo), b.optional(function() {
            x.assert(yt, nt + ">=0", "missing vertex count");
          })), nt;
        }
        var S = v();
        function U(tt) {
          var nt = q[tt];
          return nt ? nt.contextDep && $.contextDynamic || nt.propDep ? nt.append(x, L) : nt.append(x, y) : y.def(P, ".", tt);
        }
        var Y = U(Co), ye = U(O0), Pe = C();
        if (typeof Pe == "number") {
          if (Pe === 0)
            return;
        } else
          L("if(", Pe, "){"), L.exit("}");
        var Ie, He;
        ke && (Ie = U(P0), He = x.instancing);
        var Re = S + ".type", rt = q.elements && so(q.elements) && !q.vaoActive;
        function Ze() {
          function tt() {
            L(He, ".drawElementsInstancedANGLE(", [
              Y,
              Pe,
              Re,
              ye + "<<((" + Re + "-" + rd + ")>>1)",
              Ie
            ], ");");
          }
          function nt() {
            L(
              He,
              ".drawArraysInstancedANGLE(",
              [Y, ye, Pe, Ie],
              ");"
            );
          }
          S && S !== "null" ? rt ? tt() : (L("if(", S, "){"), tt(), L("}else{"), nt(), L("}")) : nt();
        }
        function et() {
          function tt() {
            L(I + ".drawElements(" + [
              Y,
              Pe,
              Re,
              ye + "<<((" + Re + "-" + rd + ")>>1)"
            ] + ");");
          }
          function nt() {
            L(I + ".drawArrays(" + [Y, ye, Pe] + ");");
          }
          S && S !== "null" ? rt ? tt() : (L("if(", S, "){"), tt(), L("}else{"), nt(), L("}")) : nt();
        }
        ke && (typeof Ie != "number" || Ie >= 0) ? typeof Ie == "string" ? (L("if(", Ie, ">0){"), Ze(), L("}else if(", Ie, "<0){"), et(), L("}")) : Ze() : et();
      }
      function Ot(x, y, L, $, W) {
        var I = gt(), P = I.proc("body", W);
        return b.optional(function() {
          I.commandStr = y.commandStr, I.command = I.link(y.commandStr);
        }), ke && (I.instancing = P.def(
          I.shared.extensions,
          ".angle_instanced_arrays"
        )), x(I, P, L, $), I.compile().body;
      }
      function zt(x, y, L, $) {
        hr(x, y), L.useVAO ? L.drawVAO ? y(x.shared.vao, ".setVAO(", L.drawVAO.append(x, y), ");") : y(x.shared.vao, ".setVAO(", x.shared.vao, ".targetVAO);") : (y(x.shared.vao, ".setVAO(null);"), Br(x, y, L, $.attributes, function() {
          return !0;
        })), Ht(x, y, L, $.uniforms, function() {
          return !0;
        }, !1), ht(x, y, y, L);
      }
      function mr(x, y) {
        var L = x.proc("draw", 1);
        hr(x, L), wr(x, L, y.context), xr(x, L, y.framebuffer), Cr(x, L, y), Ir(x, L, y.state), Dt(x, L, y, !1, !0);
        var $ = y.shader.progVar.append(x, L);
        if (L(x.shared.gl, ".useProgram(", $, ".program);"), y.shader.program)
          zt(x, L, y, y.shader.program);
        else {
          L(x.shared.vao, ".setVAO(null);");
          var W = x.global.def("{}"), I = L.def($, ".id"), P = L.def(W, "[", I, "]");
          L(
            x.cond(P).then(P, ".call(this,a0);").else(
              P,
              "=",
              W,
              "[",
              I,
              "]=",
              x.link(function(q) {
                return Ot(zt, x, y, q, 1);
              }),
              "(",
              $,
              ");",
              P,
              ".call(this,a0);"
            )
          );
        }
        Object.keys(y.state).length > 0 && L(x.shared.current, ".dirty=true;"), x.shared.vao && L(x.shared.vao, ".setVAO(null);");
      }
      function Sn(x, y, L, $) {
        x.batchId = "a1", hr(x, y);
        function W() {
          return !0;
        }
        Br(x, y, L, $.attributes, W), Ht(x, y, L, $.uniforms, W, !1), ht(x, y, y, L);
      }
      function Ro(x, y, L, $) {
        hr(x, y);
        var W = L.contextDep, I = y.def(), P = "a0", q = "a1", v = y.def();
        x.shared.props = v, x.batchId = I;
        var C = x.scope(), S = x.scope();
        y(
          C.entry,
          "for(",
          I,
          "=0;",
          I,
          "<",
          q,
          ";++",
          I,
          "){",
          v,
          "=",
          P,
          "[",
          I,
          "];",
          S,
          "}",
          C.exit
        );
        function U(Re) {
          return Re.contextDep && W || Re.propDep;
        }
        function Y(Re) {
          return !U(Re);
        }
        if (L.needsContext && wr(x, S, L.context), L.needsFramebuffer && xr(x, S, L.framebuffer), Ir(x, S, L.state, U), L.profile && U(L.profile) && Dt(x, S, L, !1, !0), $)
          L.useVAO ? L.drawVAO ? U(L.drawVAO) ? S(x.shared.vao, ".setVAO(", L.drawVAO.append(x, S), ");") : C(x.shared.vao, ".setVAO(", L.drawVAO.append(x, C), ");") : C(x.shared.vao, ".setVAO(", x.shared.vao, ".targetVAO);") : (C(x.shared.vao, ".setVAO(null);"), Br(x, C, L, $.attributes, Y), Br(x, S, L, $.attributes, U)), Ht(x, C, L, $.uniforms, Y, !1), Ht(x, S, L, $.uniforms, U, !0), ht(x, C, S, L);
        else {
          var ye = x.global.def("{}"), Pe = L.shader.progVar.append(x, S), Ie = S.def(Pe, ".id"), He = S.def(ye, "[", Ie, "]");
          S(
            x.shared.gl,
            ".useProgram(",
            Pe,
            ".program);",
            "if(!",
            He,
            "){",
            He,
            "=",
            ye,
            "[",
            Ie,
            "]=",
            x.link(function(Re) {
              return Ot(
                Sn,
                x,
                L,
                Re,
                2
              );
            }),
            "(",
            Pe,
            ");}",
            He,
            ".call(this,a0[",
            I,
            "],",
            I,
            ");"
          );
        }
      }
      function k(x, y) {
        var L = x.proc("batch", 2);
        x.batchId = "0", hr(x, L);
        var $ = !1, W = !0;
        Object.keys(y.context).forEach(function(ye) {
          $ = $ || y.context[ye].propDep;
        }), $ || (wr(x, L, y.context), W = !1);
        var I = y.framebuffer, P = !1;
        I ? (I.propDep ? $ = P = !0 : I.contextDep && $ && (P = !0), P || xr(x, L, I)) : xr(x, L, null), y.state.viewport && y.state.viewport.propDep && ($ = !0);
        function q(ye) {
          return ye.contextDep && $ || ye.propDep;
        }
        Cr(x, L, y), Ir(x, L, y.state, function(ye) {
          return !q(ye);
        }), (!y.profile || !q(y.profile)) && Dt(x, L, y, !1, "a1"), y.contextDep = $, y.needsContext = W, y.needsFramebuffer = P;
        var v = y.shader.progVar;
        if (v.contextDep && $ || v.propDep)
          Ro(
            x,
            L,
            y,
            null
          );
        else {
          var C = v.append(x, L);
          if (L(x.shared.gl, ".useProgram(", C, ".program);"), y.shader.program)
            Ro(
              x,
              L,
              y,
              y.shader.program
            );
          else {
            L(x.shared.vao, ".setVAO(null);");
            var S = x.global.def("{}"), U = L.def(C, ".id"), Y = L.def(S, "[", U, "]");
            L(
              x.cond(Y).then(Y, ".call(this,a0,a1);").else(
                Y,
                "=",
                S,
                "[",
                U,
                "]=",
                x.link(function(ye) {
                  return Ot(Ro, x, y, ye, 2);
                }),
                "(",
                C,
                ");",
                Y,
                ".call(this,a0,a1);"
              )
            );
          }
        }
        Object.keys(y.state).length > 0 && L(x.shared.current, ".dirty=true;"), x.shared.vao && L(x.shared.vao, ".setVAO(null);");
      }
      function ne(x, y) {
        var L = x.proc("scope", 3);
        x.batchId = "a2";
        var $ = x.shared, W = $.current;
        wr(x, L, y.context), y.framebuffer && y.framebuffer.append(x, L), Ld(Object.keys(y.state)).forEach(function(P) {
          var q = y.state[P], v = q.append(x, L);
          pr(v) ? v.forEach(function(C, S) {
            L.set(x.next[P], "[" + S + "]", C);
          }) : L.set($.next, "." + P, v);
        }), Dt(x, L, y, !0, !0), [Mo, O0, Lo, P0, Co].forEach(
          function(P) {
            var q = y.draw[P];
            q && L.set($.draw, "." + P, "" + q.append(x, L));
          }
        ), Object.keys(y.uniforms).forEach(function(P) {
          var q = y.uniforms[P].append(x, L);
          Array.isArray(q) && (q = "[" + q.join() + "]"), L.set(
            $.uniforms,
            "[" + g.id(P) + "]",
            q
          );
        }), Object.keys(y.attributes).forEach(function(P) {
          var q = y.attributes[P].append(x, L), v = x.scopeAttrib(P);
          Object.keys(new H()).forEach(function(C) {
            L.set(v, "." + C, q[C]);
          });
        }), y.scopeVAO && L.set($.vao, ".targetVAO", y.scopeVAO.append(x, L));
        function I(P) {
          var q = y.shader[P];
          q && L.set($.shader, "." + P, q.append(x, L));
        }
        I(di), I(pi), Object.keys(y.state).length > 0 && (L(W, ".dirty=true;"), L.exit(W, ".dirty=true;")), L("a1(", x.shared.context, ",a0,", x.batchId, ");");
      }
      function Z(x) {
        if (!(typeof x != "object" || pr(x))) {
          for (var y = Object.keys(x), L = 0; L < y.length; ++L)
            if (_r.isDynamic(x[y[L]]))
              return !0;
          return !1;
        }
      }
      function Qe(x, y, L) {
        var $ = y.static[L];
        if (!$ || !Z($))
          return;
        var W = x.global, I = Object.keys($), P = !1, q = !1, v = !1, C = x.global.def("{}");
        I.forEach(function(U) {
          var Y = $[U];
          if (_r.isDynamic(Y)) {
            typeof Y == "function" && (Y = $[U] = _r.unbox(Y));
            var ye = Wr(Y, null);
            P = P || ye.thisDep, v = v || ye.propDep, q = q || ye.contextDep;
          } else {
            switch (W(C, ".", U, "="), typeof Y) {
              case "number":
                W(Y);
                break;
              case "string":
                W('"', Y, '"');
                break;
              case "object":
                Array.isArray(Y) && W("[", Y.join(), "]");
                break;
              default:
                W(x.link(Y));
                break;
            }
            W(";");
          }
        });
        function S(U, Y) {
          I.forEach(function(ye) {
            var Pe = $[ye];
            if (_r.isDynamic(Pe)) {
              var Ie = U.invoke(Y, Pe);
              Y(C, ".", ye, "=", Ie, ";");
            }
          });
        }
        y.dynamic[L] = new _r.DynamicVariable(F0, {
          thisDep: P,
          contextDep: q,
          propDep: v,
          ref: C,
          append: S
        }), delete y.static[L];
      }
      function Lt(x, y, L, $, W) {
        var I = gt();
        I.stats = I.link(W), Object.keys(y.static).forEach(function(q) {
          Qe(I, y, q);
        }), ny.forEach(function(q) {
          Qe(I, x, q);
        });
        var P = Ar(x, y, L, $, I);
        return mr(I, P), ne(I, P), k(I, P), n(I.compile(), {
          destroy: function() {
            P.shader.program.destroy();
          }
        });
      }
      return {
        next: ze,
        current: Xe,
        procs: function() {
          var x = gt(), y = x.proc("poll"), L = x.proc("refresh"), $ = x.block();
          y($), L($);
          var W = x.shared, I = W.gl, P = W.next, q = W.current;
          $(q, ".dirty=false;"), xr(x, y), xr(x, L, null, !0);
          var v;
          ke && (v = x.link(ke)), D.oes_vertex_array_object && L(x.link(D.oes_vertex_array_object), ".bindVertexArrayOES(null);");
          for (var C = 0; C < te.maxAttributes; ++C) {
            var S = L.def(W.attributes, "[", C, "]"), U = x.cond(S, ".buffer");
            U.then(
              I,
              ".enableVertexAttribArray(",
              C,
              ");",
              I,
              ".bindBuffer(",
              ha,
              ",",
              S,
              ".buffer.buffer);",
              I,
              ".vertexAttribPointer(",
              C,
              ",",
              S,
              ".size,",
              S,
              ".type,",
              S,
              ".normalized,",
              S,
              ".stride,",
              S,
              ".offset);"
            ).else(
              I,
              ".disableVertexAttribArray(",
              C,
              ");",
              I,
              ".vertexAttrib4f(",
              C,
              ",",
              S,
              ".x,",
              S,
              ".y,",
              S,
              ".z,",
              S,
              ".w);",
              S,
              ".buffer=null;"
            ), L(U), ke && L(
              v,
              ".vertexAttribDivisorANGLE(",
              C,
              ",",
              S,
              ".divisor);"
            );
          }
          return L(
            x.shared.vao,
            ".currentVAO=null;",
            x.shared.vao,
            ".setVAO(",
            x.shared.vao,
            ".targetVAO);"
          ), Object.keys(he).forEach(function(Y) {
            var ye = he[Y], Pe = $.def(P, ".", Y), Ie = x.block();
            Ie(
              "if(",
              Pe,
              "){",
              I,
              ".enable(",
              ye,
              ")}else{",
              I,
              ".disable(",
              ye,
              ")}",
              q,
              ".",
              Y,
              "=",
              Pe,
              ";"
            ), L(Ie), y(
              "if(",
              Pe,
              "!==",
              q,
              ".",
              Y,
              "){",
              Ie,
              "}"
            );
          }), Object.keys(fe).forEach(function(Y) {
            var ye = fe[Y], Pe = Xe[Y], Ie, He, Re = x.block();
            if (Re(I, ".", ye, "("), pr(Pe)) {
              var rt = Pe.length;
              Ie = x.global.def(P, ".", Y), He = x.global.def(q, ".", Y), Re(
                Or(rt, function(Ze) {
                  return Ie + "[" + Ze + "]";
                }),
                ");",
                Or(rt, function(Ze) {
                  return He + "[" + Ze + "]=" + Ie + "[" + Ze + "];";
                }).join("")
              ), y(
                "if(",
                Or(rt, function(Ze) {
                  return Ie + "[" + Ze + "]!==" + He + "[" + Ze + "]";
                }).join("||"),
                "){",
                Re,
                "}"
              );
            } else
              Ie = $.def(P, ".", Y), He = $.def(q, ".", Y), Re(
                Ie,
                ");",
                q,
                ".",
                Y,
                "=",
                Ie,
                ";"
              ), y(
                "if(",
                Ie,
                "!==",
                He,
                "){",
                Re,
                "}"
              );
            L(Re);
          }), x.compile();
        }(),
        compile: Lt
      };
    }
    function xy() {
      return {
        vaoCount: 0,
        bufferCount: 0,
        elementsCount: 0,
        framebufferCount: 0,
        shaderCount: 0,
        textureCount: 0,
        cubeCount: 0,
        renderbufferCount: 0,
        maxTextureUnits: 0
      };
    }
    var _y = 34918, Ey = 34919, Rd = 35007, Sy = function(d, g) {
      if (!g.ext_disjoint_timer_query)
        return null;
      var D = [];
      function te() {
        return D.pop() || g.ext_disjoint_timer_query.createQueryEXT();
      }
      function de(ke) {
        D.push(ke);
      }
      var ee = [];
      function ce(ke) {
        var Ke = te();
        g.ext_disjoint_timer_query.beginQueryEXT(Rd, Ke), ee.push(Ke), xe(ee.length - 1, ee.length, ke);
      }
      function ve() {
        g.ext_disjoint_timer_query.endQueryEXT(Rd);
      }
      function Ae() {
        this.startQueryIndex = -1, this.endQueryIndex = -1, this.sum = 0, this.stats = null;
      }
      var De = [];
      function Fe() {
        return De.pop() || new Ae();
      }
      function Me(ke) {
        De.push(ke);
      }
      var Ne = [];
      function xe(ke, Ke, ge) {
        var Xe = Fe();
        Xe.startQueryIndex = ke, Xe.endQueryIndex = Ke, Xe.sum = 0, Xe.stats = ge, Ne.push(Xe);
      }
      var Te = [], H = [];
      function se() {
        var ke, Ke, ge = ee.length;
        if (ge !== 0) {
          H.length = Math.max(H.length, ge + 1), Te.length = Math.max(Te.length, ge + 1), Te[0] = 0, H[0] = 0;
          var Xe = 0;
          for (ke = 0, Ke = 0; Ke < ee.length; ++Ke) {
            var ze = ee[Ke];
            g.ext_disjoint_timer_query.getQueryObjectEXT(ze, Ey) ? (Xe += g.ext_disjoint_timer_query.getQueryObjectEXT(ze, _y), de(ze)) : ee[ke++] = ze, Te[Ke + 1] = Xe, H[Ke + 1] = ke;
          }
          for (ee.length = ke, ke = 0, Ke = 0; Ke < Ne.length; ++Ke) {
            var dt = Ne[Ke], he = dt.startQueryIndex, fe = dt.endQueryIndex;
            dt.sum += Te[fe] - Te[he];
            var Je = H[he], Ge = H[fe];
            Ge === Je ? (dt.stats.gpuTime += dt.sum / 1e6, Me(dt)) : (dt.startQueryIndex = Je, dt.endQueryIndex = Ge, Ne[ke++] = dt);
          }
          Ne.length = ke;
        }
      }
      return {
        beginQuery: ce,
        endQuery: ve,
        pushScopeStats: xe,
        update: se,
        getNumPendingQueries: function() {
          return ee.length;
        },
        clear: function() {
          D.push.apply(D, ee);
          for (var ke = 0; ke < D.length; ke++)
            g.ext_disjoint_timer_query.deleteQueryEXT(D[ke]);
          ee.length = 0, D.length = 0;
        },
        restore: function() {
          ee.length = 0, D.length = 0;
        }
      };
    }, ky = 16384, Ty = 256, Dy = 1024, My = 34962, Od = "webglcontextlost", Pd = "webglcontextrestored", Id = 1, Cy = 2, Ly = 3;
    function Bd(d, g) {
      for (var D = 0; D < d.length; ++D)
        if (d[D] === g)
          return D;
      return -1;
    }
    function Fy(d) {
      var g = rl(d);
      if (!g)
        return null;
      var D = g.gl, te = D.getContextAttributes(), de = D.isContextLost(), ee = nl(D, g);
      if (!ee)
        return null;
      var ce = nn(), ve = xy(), Ae = ee.extensions, De = Sy(D, Ae), Fe = Zr(), Me = D.drawingBufferWidth, Ne = D.drawingBufferHeight, xe = {
        tick: 0,
        time: 0,
        viewportWidth: Me,
        viewportHeight: Ne,
        framebufferWidth: Me,
        framebufferHeight: Ne,
        drawingBufferWidth: Me,
        drawingBufferHeight: Ne,
        pixelRatio: g.pixelRatio
      }, Te = {}, H = {
        elements: null,
        primitive: 4,
        // GL_TRIANGLES
        count: -1,
        offset: 0,
        instances: -1
      }, se = gm(D, Ae), ke = Om(
        D,
        ve,
        g,
        Xe
      ), Ke = Vm(D, Ae, ke, ve), ge = V5(
        D,
        Ae,
        se,
        ve,
        ke,
        Ke,
        H
      );
      function Xe(ht) {
        return ge.destroyBuffer(ht);
      }
      var ze = K5(D, ce, ve, g), dt = _5(
        D,
        Ae,
        se,
        function() {
          Je.procs.poll();
        },
        xe,
        ve,
        g
      ), he = E5(D, Ae, se, ve, g), fe = H5(
        D,
        Ae,
        se,
        dt,
        he,
        ve
      ), Je = wy(
        D,
        ce,
        Ae,
        se,
        ke,
        Ke,
        dt,
        fe,
        Te,
        ge,
        ze,
        H,
        xe,
        De,
        g
      ), Ge = J5(
        D,
        fe,
        Je.procs.poll,
        xe,
        te,
        Ae,
        se
      ), Ee = Je.next, qe = D.canvas, $e = [], Tt = [], gt = [], je = [g.onDestroy], Ye = null;
      function mt() {
        if ($e.length === 0) {
          De && De.update(), Ye = null;
          return;
        }
        Ye = In.next(mt), Ir();
        for (var ht = $e.length - 1; ht >= 0; --ht) {
          var Ot = $e[ht];
          Ot && Ot(xe, null, 0);
        }
        D.flush(), De && De.update();
      }
      function _t() {
        !Ye && $e.length > 0 && (Ye = In.next(mt));
      }
      function Rt() {
        Ye && (In.cancel(mt), Ye = null);
      }
      function ir(ht) {
        ht.preventDefault(), de = !0, Rt(), Tt.forEach(function(Ot) {
          Ot();
        });
      }
      function sr(ht) {
        D.getError(), de = !1, ee.restore(), ze.restore(), ke.restore(), dt.restore(), he.restore(), fe.restore(), ge.restore(), De && De.restore(), Je.procs.refresh(), _t(), gt.forEach(function(Ot) {
          Ot();
        });
      }
      qe && (qe.addEventListener(Od, ir, !1), qe.addEventListener(Pd, sr, !1));
      function Pt() {
        $e.length = 0, Rt(), qe && (qe.removeEventListener(Od, ir), qe.removeEventListener(Pd, sr)), ze.clear(), fe.clear(), he.clear(), ge.clear(), dt.clear(), Ke.clear(), ke.clear(), De && De.clear(), je.forEach(function(ht) {
          ht();
        });
      }
      function vr(ht) {
        b(!!ht, "invalid args to regl({...})"), b.type(ht, "object", "invalid args to regl({...})");
        function Ot(W) {
          var I = n({}, W);
          delete I.uniforms, delete I.attributes, delete I.context, delete I.vao, "stencil" in I && I.stencil.op && (I.stencil.opBack = I.stencil.opFront = I.stencil.op, delete I.stencil.op);
          function P(q) {
            if (q in I) {
              var v = I[q];
              delete I[q], Object.keys(v).forEach(function(C) {
                I[q + "." + C] = v[C];
              });
            }
          }
          return P("blend"), P("depth"), P("cull"), P("stencil"), P("polygonOffset"), P("scissor"), P("sample"), "vao" in W && (I.vao = W.vao), I;
        }
        function zt(W, I) {
          var P = {}, q = {};
          return Object.keys(W).forEach(function(v) {
            var C = W[v];
            if (_r.isDynamic(C)) {
              q[v] = _r.unbox(C, v);
              return;
            } else if (I && Array.isArray(C)) {
              for (var S = 0; S < C.length; ++S)
                if (_r.isDynamic(C[S])) {
                  q[v] = _r.unbox(C, v);
                  return;
                }
            }
            P[v] = C;
          }), {
            dynamic: q,
            static: P
          };
        }
        var mr = zt(ht.context || {}, !0), Sn = zt(ht.uniforms || {}, !0), Ro = zt(ht.attributes || {}, !1), k = zt(Ot(ht), !1), ne = {
          gpuTime: 0,
          cpuTime: 0,
          count: 0
        }, Z = Je.compile(k, Ro, Sn, mr, ne), Qe = Z.draw, Lt = Z.batch, x = Z.scope, y = [];
        function L(W) {
          for (; y.length < W; )
            y.push(null);
          return y;
        }
        function $(W, I) {
          var P;
          if (de && b.raise("context lost"), typeof W == "function")
            return x.call(this, null, W, 0);
          if (typeof I == "function")
            if (typeof W == "number")
              for (P = 0; P < W; ++P)
                x.call(this, null, I, P);
            else if (Array.isArray(W))
              for (P = 0; P < W.length; ++P)
                x.call(this, W[P], I, P);
            else
              return x.call(this, W, I, 0);
          else if (typeof W == "number") {
            if (W > 0)
              return Lt.call(this, L(W | 0), W | 0);
          } else if (Array.isArray(W)) {
            if (W.length)
              return Lt.call(this, W, W.length);
          } else
            return Qe.call(this, W);
        }
        return n($, {
          stats: ne,
          destroy: function() {
            Z.destroy();
          }
        });
      }
      var er = fe.setFBO = vr({
        framebuffer: _r.define.call(null, Id, "framebuffer")
      });
      function Ar(ht, Ot) {
        var zt = 0;
        Je.procs.poll();
        var mr = Ot.color;
        mr && (D.clearColor(+mr[0] || 0, +mr[1] || 0, +mr[2] || 0, +mr[3] || 0), zt |= ky), "depth" in Ot && (D.clearDepth(+Ot.depth), zt |= Ty), "stencil" in Ot && (D.clearStencil(Ot.stencil | 0), zt |= Dy), b(!!zt, "called regl.clear with no buffer specified"), D.clear(zt);
      }
      function wr(ht) {
        if (b(
          typeof ht == "object" && ht,
          "regl.clear() takes an object as input"
        ), "framebuffer" in ht)
          if (ht.framebuffer && ht.framebuffer_reglType === "framebufferCube")
            for (var Ot = 0; Ot < 6; ++Ot)
              er(n({
                framebuffer: ht.framebuffer.faces[Ot]
              }, ht), Ar);
          else
            er(ht, Ar);
        else
          Ar(null, ht);
      }
      function xr(ht) {
        b.type(ht, "function", "regl.frame() callback must be a function"), $e.push(ht);
        function Ot() {
          var zt = Bd($e, ht);
          b(zt >= 0, "cannot cancel a frame twice");
          function mr() {
            var Sn = Bd($e, mr);
            $e[Sn] = $e[$e.length - 1], $e.length -= 1, $e.length <= 0 && Rt();
          }
          $e[zt] = mr;
        }
        return _t(), {
          cancel: Ot
        };
      }
      function Cr() {
        var ht = Ee.viewport, Ot = Ee.scissor_box;
        ht[0] = ht[1] = Ot[0] = Ot[1] = 0, xe.viewportWidth = xe.framebufferWidth = xe.drawingBufferWidth = ht[2] = Ot[2] = D.drawingBufferWidth, xe.viewportHeight = xe.framebufferHeight = xe.drawingBufferHeight = ht[3] = Ot[3] = D.drawingBufferHeight;
      }
      function Ir() {
        xe.tick += 1, xe.time = Dt(), Cr(), Je.procs.poll();
      }
      function hr() {
        dt.refresh(), Cr(), Je.procs.refresh(), De && De.update();
      }
      function Dt() {
        return (Zr() - Fe) / 1e3;
      }
      hr();
      function Br(ht, Ot) {
        b.type(Ot, "function", "listener callback must be a function");
        var zt;
        switch (ht) {
          case "frame":
            return xr(Ot);
          case "lost":
            zt = Tt;
            break;
          case "restore":
            zt = gt;
            break;
          case "destroy":
            zt = je;
            break;
          default:
            b.raise("invalid event, must be one of frame,lost,restore,destroy");
        }
        return zt.push(Ot), {
          cancel: function() {
            for (var mr = 0; mr < zt.length; ++mr)
              if (zt[mr] === Ot) {
                zt[mr] = zt[zt.length - 1], zt.pop();
                return;
              }
          }
        };
      }
      var Ht = n(vr, {
        // Clear current FBO
        clear: wr,
        // Short cuts for dynamic variables
        prop: _r.define.bind(null, Id),
        context: _r.define.bind(null, Cy),
        this: _r.define.bind(null, Ly),
        // executes an empty draw command
        draw: vr({}),
        // Resources
        buffer: function(ht) {
          return ke.create(ht, My, !1, !1);
        },
        elements: function(ht) {
          return Ke.create(ht, !1);
        },
        texture: dt.create2D,
        cube: dt.createCube,
        renderbuffer: he.create,
        framebuffer: fe.create,
        framebufferCube: fe.createCube,
        vao: ge.createVAO,
        // Expose context attributes
        attributes: te,
        // Frame rendering
        frame: xr,
        on: Br,
        // System limits
        limits: se,
        hasExtension: function(ht) {
          return se.extensions.indexOf(ht.toLowerCase()) >= 0;
        },
        // Read pixels
        read: Ge,
        // Destroy regl and all associated resources
        destroy: Pt,
        // Direct GL state manipulation
        _gl: D,
        _refresh: hr,
        poll: function() {
          Ir(), De && De.update();
        },
        // Current time
        now: Dt,
        // regl Statistics Information
        stats: ve
      });
      return g.onDone(null, Ht), Ht;
    }
    return Fy;
  });
})(bh);
var ok = bh.exports;
const ak = /* @__PURE__ */ Za(ok), ik = new nk({ concurrency: 1 }), _i = /* @__PURE__ */ new WeakMap();
let sk = 0, cs, Oc;
const lk = {
  vert: `
		precision mediump float;
		attribute vec2 position;
		varying vec2 uv;
		void main() {
			uv = position / 2.0 + 0.5;
			gl_Position = vec4(position, 0, 1);
		}`,
  attributes: { position: [-1, -1, 1, -1, -1, 1, 1, 1] },
  depth: { enable: !1 },
  count: 4,
  primitive: "triangle strip"
};
function ck() {
  if (!(typeof document > "u"))
    return cs || (cs = document.createElement("canvas")), Oc || (Oc = ak({
      canvas: cs,
      attributes: { depth: !1, premultipliedAlpha: !1 }
    })), { canvas: cs, regl: Oc };
}
function jp(e, t, r) {
  const n = ++sk;
  return _i.set(e, n), ik.add(async () => {
    if (_i.get(e) !== n || !e.isConnected)
      return;
    const o = ck();
    if (!o)
      return;
    const a = Math.max(1, Math.round(e.clientWidth)), i = Math.max(1, Math.round(e.clientHeight));
    o.canvas.width = a, o.canvas.height = i, o.regl({
      ...lk,
      frag: t,
      viewport: { x: 0, y: 0, width: a, height: i },
      uniforms: r
    })(), _i.get(e) === n && (e.src = o.canvas.toDataURL());
  }).catch(() => {
  }), () => {
    _i.get(e) === n && _i.delete(e);
  };
}
function uk(e) {
  return e.getState().group("inputTime").ref("format", "frames");
}
const Hp = (e) => {
  let t;
  const r = /* @__PURE__ */ new Set(), n = (c, u) => {
    const f = typeof c == "function" ? c(t) : c;
    if (!Object.is(f, t)) {
      const p = t;
      t = u ?? (typeof f != "object" || f === null) ? f : Object.assign({}, t, f), r.forEach((h) => h(t, p));
    }
  }, o = () => t, s = { setState: n, getState: o, getInitialState: () => l, subscribe: (c) => (r.add(c), () => r.delete(c)) }, l = t = e(n, o, s);
  return s;
}, i0 = (e) => e ? Hp(e) : Hp;
function gh(e, t) {
  return [...e].sort((n, o) => (n.order ?? Number.MAX_SAFE_INTEGER) - (o.order ?? Number.MAX_SAFE_INTEGER)).map((n) => {
    if (!("children" in n))
      return n;
    const o = gh(n.children, t), a = t[n.id];
    return a != null && a.length && o.push({ separator: !0 }, ...a), { ...n, children: o };
  });
}
function fk() {
  let e, t;
  const r = {}, n = [];
  let o = {};
  const a = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set();
  function s() {
    typeof window < "u" && (!e || !t) && (e = US(), t = NS());
  }
  function l(f) {
    if (typeof window > "u")
      return;
    s();
    const h = (Array.isArray(f) ? f : [f]).map((m) => {
      if (typeof m == "string") {
        if (m.startsWith("gamepad:")) {
          const A = m.split(":")[1];
          return t.button(A).down();
        }
        const w = m.endsWith("?repeat");
        return m = m.replace(/\?.+$/, ""), e.hotkey(m, {
          capture: !0,
          preventDefault: !0,
          repeat: w
        });
      }
      return m;
    });
    if (h.length === 1)
      return h[0];
    if (h.length > 1)
      return PS(...h);
  }
  function c(f) {
    for (const p of a)
      p(f);
  }
  const u = i0((f) => {
    function p() {
      f({
        allActions: { ...r },
        menu: gh(n, o)
      });
    }
    function h(T) {
      if (typeof window > "u")
        return () => {
        };
      const B = /* @__PURE__ */ new Set();
      for (const M of T)
        N(M, n);
      return p(), () => {
        for (const M of T)
          delete r[M.id];
        B.forEach((M) => {
          M.dispose(), i.delete(M);
        }), B.clear(), p();
      };
      function N(M, X) {
        "perform" in M ? O(M, X) : Q(M, X);
      }
      function Q(M, X) {
        const G = M.label ? M.label : za.title(M.id);
        let oe;
        const ue = X.find((K) => K.id === M.id);
        if (ue) {
          if ("perform" in ue)
            throw new Error(`Existing item with id=${M.id} is not a group`);
          oe = ue, oe.icon ?? (oe.icon = M.icon), oe.label ?? (oe.label = G), oe.order ?? (oe.order = M.order);
        } else
          oe = { ...M, label: G, children: [] }, X.push(oe);
        M.children.forEach((K) => N(K, oe.children));
      }
      function O(M, X) {
        var pe;
        M.id in r && ((pe = r[M.id].bind) == null || pe.dispose());
        const G = M.label ? M.label : za.title(M.id), oe = M.bind ? l(M.bind) : void 0, ue = { ...M, label: G, bind: oe };
        oe == null || oe.on(() => {
          c(ue), M.perform();
        }), r[M.id] = ue, oe && (B.add(oe), i.add(oe));
        const K = X.findIndex((be) => be.id === M.id);
        K !== -1 ? X[K] = ue : X.push(ue);
      }
    }
    async function m(T) {
      if (typeof window > "u")
        return;
      const B = r[T];
      if (!B)
        throw new Error(`Action ${T} is not registered`);
      c(B), await B.perform();
    }
    function w(T) {
      return a.add(T), () => {
        a.delete(T);
      };
    }
    function A(T, B) {
      o = { ...o, [T]: B }, p();
    }
    return {
      allActions: {},
      menu: [],
      register: h,
      perform: m,
      onBeforePerform: w,
      setMenuExtras: A
    };
  });
  return Object.assign(u, {
    dispose() {
      for (const f of i)
        f.dispose();
      i.clear(), e == null || e.dispose(), t == null || t.dispose(), e = void 0, t = void 0, a.clear();
      for (const f of Object.keys(r))
        delete r[f];
      n.length = 0, o = {}, u.setState({ allActions: {}, menu: [] });
    }
  });
}
function dk(e = {}) {
  const t = /* @__PURE__ */ new Map(), r = () => e.storage !== void 0 ? e.storage : typeof localStorage > "u" ? null : localStorage;
  return i0((n, o) => {
    function a(w) {
      return `${o().appId}.${w}`;
    }
    function i() {
      n((w) => ({ revision: w.revision + 1 }));
    }
    function s(w, A) {
      for (const T of w.listeners)
        T(w.value, A);
    }
    function l(w, A) {
      if (Object.is(w.value, A))
        return;
      w.value = A;
      const T = r();
      T && (A === w.defaultValue ? T.removeItem(a(w.relKey)) : T.setItem(a(w.relKey), JSON.stringify(A))), i(), s(w, { reload: !1 });
    }
    function c(w, A) {
      if (Object.is(w.defaultValue, A))
        return;
      w.defaultValue = A;
      const T = r(), B = JSON.parse((T == null ? void 0 : T.getItem(a(w.relKey))) ?? "null");
      B === null ? l(w, A) : B === A && (T == null || T.removeItem(a(w.relKey))), i();
    }
    function u(w, A) {
      var N;
      const T = {
        relKey: w,
        value: A,
        defaultValue: A,
        listeners: /* @__PURE__ */ new Set()
      }, B = ((N = r()) == null ? void 0 : N.getItem(a(w))) ?? null;
      return B !== null && (T.value = JSON.parse(B)), t.set(w, T), T;
    }
    function f(w) {
      return {
        get value() {
          return w.value;
        },
        set value(A) {
          l(w, A);
        },
        get default() {
          return w.defaultValue;
        },
        set default(A) {
          c(w, A);
        },
        get key() {
          return a(w.relKey);
        },
        subscribe(A) {
          return w.listeners.add(A), () => {
            w.listeners.delete(A);
          };
        }
      };
    }
    function p(w) {
      return {
        ref(A, T) {
          const B = w === "" ? A : `${w}.${A}`, N = t.get(B) ?? u(B, T);
          return f(N);
        },
        group(A) {
          return p(w === "" ? A : `${w}.${A}`);
        },
        reset() {
          const A = r();
          if (!A)
            return;
          const T = w === "" ? o().appId : `${o().appId}.${w}`;
          for (let B = A.length - 1; B >= 0; B--) {
            const N = A.key(B);
            N != null && N.startsWith(T) && A.removeItem(N);
          }
        }
      };
    }
    function h(w) {
      if (o().appId === w)
        return;
      n({ appId: w });
      const A = r(), T = [];
      for (const B of t.values()) {
        const N = (A == null ? void 0 : A.getItem(`${w}.${B.relKey}`)) ?? null, Q = N !== null ? JSON.parse(N) : B.defaultValue;
        Object.is(B.value, Q) || (B.value = Q, T.push(B));
      }
      for (const B of T)
        s(B, { reload: !0 });
      i();
    }
    const m = p("");
    return {
      appId: e.appId ?? "tweeq",
      revision: 0,
      setAppId: h,
      ...m
    };
  });
}
const Up = "No modal UI. Wrap your app with TweeqProvider once, or use the App / Viewport layout which includes it.";
function pk() {
  let e = null, t = null;
  const r = i0(() => ({
    prompt: async (n, o, a) => {
      if (typeof window > "u")
        throw new Error("modal.prompt is only available in the browser");
      const i = e;
      if (!i)
        throw new Error(Up);
      return i(n, o, a);
    },
    async promptTabs(n, o) {
      if (typeof window > "u")
        throw new Error("modal.promptTabs is only available in the browser");
      const a = t;
      if (!a)
        throw new Error(Up);
      return a(n, o);
    },
    registerPrompt(n) {
      e = n;
    },
    registerPromptTabs(n) {
      t = n;
    }
  }));
  return Object.assign(r, {
    dispose() {
      e = null, t = null;
    }
  });
}
function hk() {
  const e = /* @__PURE__ */ new Map();
  let t = null, r = !1, n = !1, o = !1, a = !1, i = () => {
  };
  const s = i0((l, c) => {
    function u() {
      l((K) => ({ revision: K.revision + 1 }));
    }
    function f() {
      return c().selectedIds.map((K) => e.get(K)).filter((K) => K !== void 0);
    }
    function p() {
      const K = c().selectedIds.at(-1);
      if (!K)
        return null;
      const pe = e.get(K);
      return pe ? pe.element : null;
    }
    function h(K) {
      l({ selectedIds: K, multiSelected: K.length > 1 });
    }
    function m(K) {
      h([...c().selectedIds.filter((pe) => pe !== K), K]);
    }
    function w() {
      h([]);
    }
    function A(K, pe) {
      const be = mc(K), Ce = mc(pe), We = Xt.sub(Ce, be), re = Jg(K, pe), F = [];
      e.forEach((z) => {
        const we = z.element;
        if (!we)
          return;
        const Oe = Rc(we.getBoundingClientRect());
        if (e9(re, Oe)) {
          const ot = mc(Oe), st = Xt.dot(Xt.sub(ot, be), We);
          F.push({ id: z.id, order: st });
        }
      }), F.sort((z, we) => z.order - we.order), F.forEach(({ id: z }) => m(z));
    }
    function T() {
      const K = r || n, pe = c();
      (pe.shift !== o || pe.ctrlOrCommand !== K) && l({ shift: o, ctrlOrCommand: K });
    }
    function B(K) {
      if (K.button !== 0)
        return;
      const pe = K.target, be = !f().some(({ element: z }) => z && Np(z, pe)), Ce = t && Np(t, pe), { shift: We, ctrlOrCommand: re } = c();
      be && !Ce && !(re || We) && w();
    }
    function N(K) {
      K.key === "Meta" && (r = !0), K.key === "Control" && (n = !0), K.key === "Shift" && (o = !0), T(), (K.key === "Escape" || K.key === "Tab") && w();
    }
    function Q(K) {
      K.key === "Meta" && (r = !1), K.key === "Control" && (n = !1), K.key === "Shift" && (o = !1), T();
    }
    function O() {
      r = n = o = !1, T();
    }
    function M() {
      a || typeof window > "u" || (a = !0, window.addEventListener("pointerdown", B), window.addEventListener("keydown", N), window.addEventListener("keyup", Q), window.addEventListener("blur", O));
    }
    i = () => {
      !a || typeof window > "u" || (window.removeEventListener("pointerdown", B), window.removeEventListener("keydown", N), window.removeEventListener("keyup", Q), window.removeEventListener("blur", O), a = !1);
    };
    function X(K) {
      M();
      const pe = Symbol(), be = {
        id: pe,
        type: K.type,
        get element() {
          return K.getElement();
        },
        get speed() {
          var Oe;
          return (Oe = K.getSpeed) == null ? void 0 : Oe.call(K);
        },
        focusing: !1,
        capturedValue: void 0,
        getValue: K.getValue,
        setValue: K.setValue,
        confirm: K.confirm
      };
      e.set(pe, be), u();
      const Ce = () => c().selectedIds.includes(pe), We = () => Ce() && !be.focusing;
      function re(Oe) {
        if (be.focusing === Oe || (be.focusing = Oe, u(), !Oe))
          return;
        const { shift: ot, ctrlOrCommand: st } = c(), wt = p(), ae = be.element;
        if (ot && wt && ae) {
          const _ = Rc(wt.getBoundingClientRect()), J = Rc(ae.getBoundingClientRect());
          A(_, J);
        }
        !We() && !st && !ot && w(), We() || m(pe);
      }
      function F(Oe) {
        f().forEach((ot, st) => {
          if (ot.id === pe || ot.type !== K.type)
            return;
          const wt = { i: st }, ae = Oe(ot.capturedValue ?? ot.getValue(), wt);
          ot.setValue(ae);
        });
      }
      function z() {
        f().forEach((Oe) => {
          Oe.id !== pe && Oe.confirm();
        });
      }
      function we() {
        e.delete(pe), Ce() && h(c().selectedIds.filter((Oe) => Oe !== pe)), u();
      }
      return {
        id: pe,
        get subfocus() {
          return We();
        },
        get index() {
          return f().findIndex((Oe) => Oe.id === pe);
        },
        get readyToBeSelected() {
          const { shift: Oe, ctrlOrCommand: ot } = c();
          return (ot || Oe) && !Ce();
        },
        get multiSelected() {
          return c().multiSelected;
        },
        setFocusing: re,
        capture: G,
        update: F,
        confirm: z,
        dispose: we
      };
    }
    function G() {
      f().forEach((K) => {
        K.capturedValue = K.getValue();
      }), u();
    }
    function oe(K) {
      const pe = f(), be = pe.map((We) => We.capturedValue ?? We.getValue()), Ce = K(be);
      pe.forEach((We, re) => {
        We.setValue(Ce[re]);
      });
    }
    function ue() {
      f().forEach((K) => {
        K.confirm(), K.capturedValue = void 0;
      }), u();
    }
    return {
      selectedIds: [],
      multiSelected: !1,
      shift: !1,
      ctrlOrCommand: !1,
      revision: 0,
      register: X,
      captureValues: G,
      updateValues: oe,
      confirmValues: ue,
      defocusAll: w,
      setPopupEl: (K) => {
        t = K;
      },
      getSelectedInputs: f,
      getFocusedElement: p
    };
  });
  return Object.assign(s, {
    dispose() {
      i(), e.clear(), t = null, r = n = o = !1, s.setState({
        selectedIds: [],
        multiSelected: !1,
        shift: !1,
        ctrlOrCommand: !1,
        revision: s.getState().revision + 1
      });
    }
  });
}
function mk(e) {
  const t = e.getState().group("theme"), r = t.ref("accentColor", "#0000ff"), n = t.ref("colorMode", "light"), o = t.ref("grayColor", "#8B8D98"), a = t.ref("backgroundColor", n.value === "light" ? "#ffffff" : "#111111");
  function i() {
    const u = {
      colorMode: n.value,
      accentColor: r.value,
      grayColor: o.value,
      backgroundColor: a.value
    }, { theme: f, monacoTheme: p } = ES(u);
    return { ...u, ...f, theme: f, monacoTheme: p };
  }
  const s = i0(() => ({
    ...i(),
    setAccentColor(u) {
      r.value = u;
    },
    setColorMode(u) {
      n.value = u;
    },
    setGrayColor(u) {
      o.value = u;
    },
    setBackgroundColor(u) {
      a.value = u;
    },
    setDefault(u) {
      u.colorMode && (n.default = u.colorMode), u.accentColor && (r.default = u.accentColor), u.backgroundColor && (a.default = u.backgroundColor), u.grayColor && (o.default = u.grayColor);
    }
  })), l = () => s.setState(i()), c = [
    r.subscribe(l),
    o.subscribe(l),
    a.subscribe(l),
    n.subscribe((u, { reload: f }) => {
      f || (a.value = u === "light" ? "#ffffff" : "#111111"), l();
    })
  ];
  return Object.assign(s, {
    dispose() {
      for (const u of c)
        u();
    }
  });
}
function yk(e, t) {
  const r = (t == null ? void 0 : t.ownerDocument) ?? (typeof document > "u" ? void 0 : document);
  if (!r)
    return () => {
    };
  let n, o = !1;
  const a = () => {
    const s = t ?? r.body;
    if (!s)
      return;
    const { theme: l, colorMode: c } = e.getState();
    YS(l, c, s);
  }, i = () => {
    o || n || (a(), n = e.subscribe((s, l) => {
      (s.theme !== l.theme || s.colorMode !== l.colorMode) && a();
    }));
  };
  return t || r.body ? i() : r.addEventListener("DOMContentLoaded", i, { once: !0 }), () => {
    o = !0, r.removeEventListener("DOMContentLoaded", i), n == null || n();
  };
}
function Ah(e = {}) {
  const t = dk({
    appId: e.appId,
    storage: e.storage
  }), r = fk(), n = pk(), o = hk(), a = mk(t), i = uk(t), s = /* @__PURE__ */ new Set();
  let l = !1;
  function c(u, f = {}) {
    if (l)
      throw new Error("Cannot configure a disposed Tweeq runtime");
    t.getState().setAppId(u), a.getState().setDefault(f);
  }
  return (e.colorMode || e.accentColor || e.backgroundColor || e.grayColor) && a.getState().setDefault(e), {
    actionsStore: r,
    appConfigStore: t,
    modalStore: n,
    multiSelectStore: o,
    themeStore: a,
    inputTimeFormatEntry: i,
    configure: c,
    bind(u) {
      if (l)
        throw new Error("Cannot bind a disposed Tweeq runtime");
      const f = yk(a, u);
      let p = !0;
      const h = () => {
        p && (p = !1, s.delete(h), f());
      };
      return s.add(h), h;
    },
    dispose() {
      if (!l) {
        l = !0;
        for (const u of [...s])
          u();
        r.dispose(), n.dispose(), o.dispose(), a.dispose();
      }
    }
  };
}
let Vp;
function Ui() {
  return Vp ?? (Vp = Ah()), Vp;
}
function s0(e) {
  return new Proxy({}, {
    get(t, r) {
      const n = Ui()[e], o = Reflect.get(n, r, n);
      return typeof o == "function" ? o.bind(n) : o;
    },
    set(t, r, n) {
      return Reflect.set(Ui()[e], r, n);
    }
  });
}
function bk(e) {
  return new Proxy({}, {
    get(t, r) {
      const n = e(Ui()), o = Reflect.get(n, r, n);
      return typeof o == "function" ? o.bind(n) : o;
    },
    set(t, r, n) {
      return Reflect.set(e(Ui()), r, n);
    }
  });
}
s0("actionsStore");
s0("appConfigStore");
s0("modalStore");
s0("multiSelectStore");
s0("themeStore");
bk((e) => e.inputTimeFormatEntry);
const gk = "--tq-tooltip";
function Ak(e) {
  return typeof e == "string" ? { content: e, html: !1, title: "", description: "" } : {
    content: (e == null ? void 0 : e.content) ?? "",
    html: (e == null ? void 0 : e.html) ?? !1,
    title: (e == null ? void 0 : e.title) ?? "",
    description: (e == null ? void 0 : e.description) ?? ""
  };
}
function vk(e) {
  return !e.content && !e.title && !e.description;
}
let Wo = {
  reference: null,
  content: "",
  html: !1,
  title: "",
  description: "",
  open: !1
};
const wk = /* @__PURE__ */ new Set();
function Js(e) {
  Wo = { ...Wo, ...e }, wk.forEach((t) => t());
}
let Os = null, fo = null;
function xk(e) {
  Os !== e && (fo == null || fo(), fo = lh(e, gk), Os = e);
}
function Wp(e) {
  Os === e && (fo == null || fo(), fo = null, Os = null);
}
let Ps, Is;
function _k(e, t, r = 200) {
  clearTimeout(Is), clearTimeout(Ps);
  const n = () => Js({ reference: e, ...t, open: !0 });
  Wo.open ? n() : Ps = setTimeout(n, r);
}
function Ek(e, t = 0) {
  clearTimeout(Ps), clearTimeout(Is), Is = setTimeout(() => {
    Wo.reference === e && Js({ open: !1 });
  }, t);
}
function Sk(e, t) {
  Wo.open && Wo.reference === e && Js(t);
}
function Xp(e) {
  clearTimeout(Ps), Wo.reference === e && (clearTimeout(Is), Js({ open: !1 }));
}
function Qo(e, t, r) {
  const n = me(t);
  n.current = t;
  const o = me(void 0);
  Vt(() => {
    const a = e.current, i = o.current;
    if ((i == null ? void 0 : i.element) === a && i.options === r || (i == null || i.observer.disconnect(), o.current = void 0, !a || typeof ResizeObserver > "u")) return;
    const s = new ResizeObserver((l, c) => {
      n.current(l, c);
    });
    s.observe(a, r), o.current = { element: a, options: r, observer: s };
  }), Vt(() => () => {
    var a;
    (a = o.current) == null || a.observer.disconnect(), o.current = void 0;
  }, []);
}
const kk = {}, Tk = {
  xy: [0, 0],
  previous: [0, 0],
  initial: [0, 0],
  delta: [0, 0],
  origin: [0, 0],
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 0,
  height: 0,
  dragging: !1,
  pointerLocked: !1
};
function Dk(e, t) {
  const r = (n, o) => n[0] === o[0] && n[1] === o[1];
  return r(e.xy, t.xy) && r(e.previous, t.previous) && r(e.initial, t.initial) && r(e.delta, t.delta) && r(e.origin, t.origin) && e.top === t.top && e.right === t.right && e.bottom === t.bottom && e.left === t.left && e.width === t.width && e.height === t.height && e.dragging === t.dragging && e.pointerLocked === t.pointerLocked;
}
function Pn(e, t = kk) {
  const [r, n] = lt(Tk), o = me(!0), a = me(void 0), i = Jr((l) => {
    if (!o.current) return;
    const c = { ...l };
    n((u) => Dk(u, c) ? u : c);
  }, []), s = Jr(() => {
    var c;
    const l = (c = a.current) == null ? void 0 : c.handler;
    l && (l.measure(), i(l.state));
  }, [i]);
  return Yr(() => {
    const l = e.current, c = a.current;
    if ((c == null ? void 0 : c.element) === l && c.options === t || (c == null || c.handler.dispose(), a.current = void 0, !l)) return;
    const u = () => {
      queueMicrotask(() => {
        var h;
        const p = (h = a.current) == null ? void 0 : h.handler;
        p && i(p.state);
      });
    }, f = KS(l, {
      ...t,
      onClick(p, h) {
        var m;
        (m = t.onClick) == null || m.call(t, p, h), u();
      },
      onDrag(p, h) {
        var m;
        (m = t.onDrag) == null || m.call(t, p, h), i(p);
      },
      onDragStart(p, h) {
        var m;
        (m = t.onDragStart) == null || m.call(t, p, h), i(p);
      },
      onDragEnd(p, h) {
        var m;
        (m = t.onDragEnd) == null || m.call(t, p, h), u();
      }
    });
    a.current = { element: l, options: t, handler: f }, i(f.state);
  }), Qo(e, s), Mr(
    typeof window > "u" ? null : window,
    "resize",
    s
  ), Mr(
    typeof document > "u" ? null : document,
    "scroll",
    s,
    !0
  ), Vt(() => (o.current = !0, () => {
    var l;
    o.current = !1, (l = a.current) == null || l.handler.dispose(), a.current = void 0;
  }), []), { ...r, measure: s };
}
const Mk = {
  x: 0,
  y: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 0,
  height: 0
};
function Ck(e, t) {
  return Object.keys(e).every(
    (r) => e[r] === t[r]
  );
}
function Jn(e) {
  const [t, r] = lt(Mk), n = Jr(() => {
    var i;
    const o = (i = e.current) == null ? void 0 : i.getBoundingClientRect();
    if (!o) return;
    const a = {
      x: o.x,
      y: o.y,
      top: o.top,
      right: o.right,
      bottom: o.bottom,
      left: o.left,
      width: o.width,
      height: o.height
    };
    r((s) => Ck(s, a) ? s : a);
  }, [e]);
  return Yr(n), Qo(e, n), Mr(
    typeof window > "u" ? null : window,
    "resize",
    n
  ), Mr(
    typeof document > "u" ? null : document,
    "scroll",
    n,
    !0
  ), { ...t, update: n };
}
function Lk(e) {
  const { left: t, top: r, right: n, bottom: o } = Jn(e);
  return Yt(
    () => [(t + n) / 2, (r + o) / 2],
    [o, t, n, r]
  );
}
function Fk(e = 1200) {
  const [t, r] = lt(!1), n = me(void 0), o = me(void 0), a = Jr(() => {
    r(!1), n.current !== void 0 && cancelAnimationFrame(n.current), clearTimeout(o.current), n.current = requestAnimationFrame(() => {
      r(!0), o.current = setTimeout(() => r(!1), e);
    });
  }, [e]);
  return Vt(() => () => {
    n.current !== void 0 && cancelAnimationFrame(n.current), clearTimeout(o.current);
  }, []), { flashing: t, flash: a };
}
function us(e) {
  return e.toLowerCase();
}
function l0(e) {
  const [, t] = lt(0), r = me(/* @__PURE__ */ new Set()), n = Yt(() => new Set(e.map(us)), [e]);
  function o(a) {
    a.size === r.current.size && [...a].every((i) => r.current.has(i)) || (r.current = a, t((i) => i + 1));
  }
  return Mr(
    typeof window > "u" ? null : window,
    "keydown",
    (a) => {
      const i = us(a.key);
      n.has(i) && o(/* @__PURE__ */ new Set([...r.current, i]));
    }
  ), Mr(
    typeof window > "u" ? null : window,
    "keyup",
    (a) => {
      const i = us(a.key);
      if (!r.current.has(i)) return;
      const s = new Set(r.current);
      s.delete(i), o(s);
    }
  ), Mr(
    typeof window > "u" ? null : window,
    "blur",
    () => o(/* @__PURE__ */ new Set())
  ), Yt(() => {
    const a = {};
    for (const i of e)
      Object.defineProperty(a, i, {
        enumerable: !0,
        get: () => r.current.has(us(i))
      });
    return a;
  }, [e, r.current]);
}
function Rk(e) {
  const t = me(e), [r, n] = lt();
  return Vt(() => {
    for (const o of Object.keys(e))
      e[o] && !t.current[o] && n(o);
    Object.keys(e).some((o) => e[o]) || n(void 0), t.current = e;
  }, [e]), r;
}
const Ok = (e) => e;
function Jo(e, t = Ok) {
  const r = V0.useSyncExternalStore(
    e.subscribe,
    V0.useCallback(() => t(e.getState()), [e, t]),
    V0.useCallback(() => t(e.getInitialState()), [e, t])
  );
  return V0.useDebugValue(r), r;
}
const vh = s2(void 0);
function wh() {
  return i2(vh);
}
function xo() {
  return wh() ?? Ui();
}
function Pk({
  runtime: e,
  bind: t = !1,
  disposeOnUnmount: r = !1,
  children: n
}) {
  const o = me(void 0);
  return Vt(() => {
    o.current = e;
    const a = t ? e.bind() : void 0;
    return () => {
      o.current === e && (o.current = void 0), a == null || a(), r && queueMicrotask(() => {
        o.current !== e && e.dispose();
      });
    };
  }, [t, r, e]), /* @__PURE__ */ j(vh.Provider, { value: e, children: n });
}
function Ik(e, t = {}, r) {
  const n = me(r ?? null);
  return n.current ?? (n.current = Ah({ ...t, appId: e })), n.current;
}
function Ja(e, t) {
  const { multiSelectStore: r } = xo(), n = me(e);
  n.current = e;
  const o = me(void 0);
  Jo(r), Yr(() => {
    const u = r.getState().register({
      type: e.type,
      getElement: () => n.current.getElement(),
      getSpeed: e.getSpeed ? () => n.current.getSpeed() : void 0,
      getValue: () => n.current.getValue(),
      setValue: (f) => n.current.setValue(f),
      confirm: () => n.current.confirm()
    });
    return o.current = u, () => {
      u.dispose(), o.current === u && (o.current = void 0);
    };
  }, [r, e.type]), Yr(() => {
  }, [t]);
  const a = Jr((u) => {
    var f;
    (f = o.current) == null || f.setFocusing(u);
  }, []), i = Jr(() => {
    var u;
    return (u = o.current) == null ? void 0 : u.capture();
  }, []), s = Jr(
    (u) => {
      var f;
      return (f = o.current) == null ? void 0 : f.update(u);
    },
    []
  ), l = Jr(() => {
    var u;
    return (u = o.current) == null ? void 0 : u.confirm();
  }, []), c = o.current;
  return {
    id: c == null ? void 0 : c.id,
    subfocus: (c == null ? void 0 : c.subfocus) ?? !1,
    index: (c == null ? void 0 : c.index) ?? -1,
    readyToBeSelected: (c == null ? void 0 : c.readyToBeSelected) ?? !1,
    multiSelected: (c == null ? void 0 : c.multiSelected) ?? !1,
    setFocusing: a,
    capture: i,
    update: s,
    confirm: l
  };
}
function xh(e, t) {
  const r = Yt(() => t(e), [e, t]), n = me(void 0);
  return r.value !== void 0 && (n.current = r.value), { validLocal: n.current, validateResult: r };
}
function Yp() {
  return typeof window > "u" ? { width: 0, height: 0 } : { width: window.innerWidth, height: window.innerHeight };
}
function _h() {
  const [e, t] = lt(Yp);
  return Mr(
    typeof window > "u" ? null : window,
    "resize",
    () => t(Yp())
  ), e;
}
const Bk = {
  "mdi:arrow-left-right": "M7.5 5 3 9.5 7.5 14V11H16.5V14L21 9.5 16.5 5V8H7.5V5Z",
  "mdi:chevron-down": "M7.4 8.6 12 13.2 16.6 8.6 18 10 12 16 6 10 7.4 8.6Z",
  "mdi:chevron-up": "M7.4 15.4 12 10.8 16.6 15.4 18 14 12 8 6 14 7.4 15.4Z",
  "mdi:chevron-right": "M8.6 7.4 13.2 12 8.6 16.6 10 18 16 12 10 6 8.6 7.4Z",
  "mdi:unfold-more-horizontal": "M7 5 2 10 7 15V12H17V15L22 10 17 5V8H7V5Z",
  "material-symbols:colorize": "M19.35 2.65 21.35 4.65 13 13H10L5 18 6 19 11 14V11L19.35 2.65ZM4 19 5 20 3 22H1V20L4 19Z",
  "material-symbols:search-rounded": "M9.5 3A6.5 6.5 0 1 0 13.6 14.55L19.05 20 20.5 18.55 15.05 13.1A6.5 6.5 0 0 0 9.5 3ZM9.5 5A4.5 4.5 0 1 1 9.5 14A4.5 4.5 0 0 1 9.5 5Z",
  "ic:baseline-check-circle": "M12 2A10 10 0 1 0 12 22A10 10 0 0 0 12 2ZM10 17 5 12 6.4 10.6 10 14.2 17.6 6.6 19 8 10 17Z",
  "ic:baseline-radio-button-unchecked": "M12 2A10 10 0 1 0 12 22A10 10 0 0 0 12 2ZM12 4A8 8 0 1 1 12 20A8 8 0 0 1 12 4Z",
  "mingcute:dot-grid-fill": "M5 4A1.5 1.5 0 1 0 5 7A1.5 1.5 0 0 0 5 4ZM12 4A1.5 1.5 0 1 0 12 7A1.5 1.5 0 0 0 12 4ZM19 4A1.5 1.5 0 1 0 19 7A1.5 1.5 0 0 0 19 4ZM5 10.5A1.5 1.5 0 1 0 5 13.5A1.5 1.5 0 0 0 5 10.5ZM12 10.5A1.5 1.5 0 1 0 12 13.5A1.5 1.5 0 0 0 12 10.5ZM19 10.5A1.5 1.5 0 1 0 19 13.5A1.5 1.5 0 0 0 19 10.5ZM5 17A1.5 1.5 0 1 0 5 20A1.5 1.5 0 0 0 5 17ZM12 17A1.5 1.5 0 1 0 12 20A1.5 1.5 0 0 0 12 17ZM19 17A1.5 1.5 0 1 0 19 20A1.5 1.5 0 0 0 19 17Z"
};
function yr({ icon: e, className: t, ...r }) {
  const n = t9(e);
  if (n.type === "char")
    return /* @__PURE__ */ j(
      "span",
      {
        ...r,
        className: t,
        "data-tq-component": "icon",
        "data-tq-variant": "char",
        children: n.value
      }
    );
  const o = n.type === "fill" ? n.value : Bk[n.value];
  return /* @__PURE__ */ j(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
      focusable: "false",
      ...r,
      className: t,
      "data-tq-component": "icon",
      "data-tq-variant": n.type === "fill" ? "fill" : "local",
      children: o ? /* @__PURE__ */ j("path", { fill: "currentColor", d: o }) : /* @__PURE__ */ j("circle", { cx: "12", cy: "12", r: "2", fill: "currentColor" })
    }
  );
}
function Nk({ icon: e, className: t, ...r }) {
  return /* @__PURE__ */ j(
    "div",
    {
      className: t,
      "data-tq-part": "root",
      ...r,
      "data-tq-component": "bind-icon",
      children: e.map(
        (n, o) => typeof n == "string" ? /* @__PURE__ */ j("span", { children: n }, o) : /* @__PURE__ */ j(yr, { icon: n.icon, "data-tq-part": "icon" }, o)
      )
    }
  );
}
function Gk({
  arrowSide: e = null,
  arrowOffset: t = 0,
  radius: r = 13,
  padding: n = "var(--tq-popup-padding)",
  flash: o = !1,
  className: a,
  style: i,
  children: s,
  ...l
}) {
  const c = me(null), { width: u, height: f } = Jn(c), p = Yt(
    () => $y(u, f, {
      arrowSide: e,
      arrowOffset: t,
      radius: r
    }),
    [t, e, f, r, u]
  );
  return /* @__PURE__ */ vt(
    "div",
    {
      ...l,
      className: a,
      "data-tq-component": "balloon",
      "data-tq-balloon": "",
      "data-tq-flash": o ? "" : void 0,
      style: {
        ...i,
        ...p.wrapperPadding,
        transformOrigin: p.transformOrigin
      },
      children: [
        /* @__PURE__ */ j(
          "div",
          {
            "data-tq-part": "fill",
            style: {
              clipPath: p.path ? `path('${p.path}')` : void 0
            }
          }
        ),
        /* @__PURE__ */ j(
          "svg",
          {
            "data-tq-part": "stroke",
            viewBox: `0 0 ${p.layerWidth} ${p.layerHeight}`,
            width: p.layerWidth,
            height: p.layerHeight,
            children: /* @__PURE__ */ j("path", { d: p.path })
          }
        ),
        /* @__PURE__ */ j("div", { ref: c, "data-tq-part": "content", style: { padding: n }, children: s })
      ]
    }
  );
}
let qk = 0;
const fs = {
  shiftX: 0,
  shiftY: 0,
  arrowOffset: 0
};
function c0({
  reference: e,
  open: t,
  placement: r = "bottom-start",
  offset: n = 0,
  lightDismiss: o = !0,
  arrow: a = !1,
  flash: i = !1,
  teleport: s,
  anchorName: l,
  exitTransition: c = !1,
  onChangeOpen: u,
  onClose: f,
  className: p,
  style: h,
  children: m,
  ...w
}) {
  const A = me(null), [T] = lt(
    () => `--tq-popover-${qk++}`
  ), B = l ?? T, [N, Q] = lt(fs), O = me(N);
  O.current = N, Yr(() => {
    if (!(l || !e))
      return lh(e, B);
  }, [B, l, e]);
  const M = Jr(
    (K = !1) => {
      const pe = A.current;
      if (!e || !pe || typeof r != "string") return;
      const be = K ? fs : O.current, Ce = cA({
        reference: e.getBoundingClientRect(),
        popover: pe.getBoundingClientRect(),
        placement: r,
        currentShiftX: be.shiftX,
        currentShiftY: be.shiftY,
        viewportWidth: document.documentElement.clientWidth,
        viewportHeight: document.documentElement.clientHeight,
        arrow: a
      });
      O.current = Ce, Q(
        (We) => We.shiftX === Ce.shiftX && We.shiftY === Ce.shiftY && We.arrowSide === Ce.arrowSide && We.arrowOffset === Ce.arrowOffset ? We : Ce
      );
    },
    [a, r, e]
  );
  Yr(() => {
    const K = A.current;
    if (!K) return;
    let pe;
    try {
      t ? (K.matches(":popover-open") || K.showPopover(), O.current = fs, Q(fs), M(!0), pe = requestAnimationFrame(() => M())) : K.matches(":popover-open") && K.hidePopover();
    } catch {
    }
    return () => {
      pe !== void 0 && cancelAnimationFrame(pe);
    };
  }, [t, M]), Mr(A, "toggle", (K) => {
    const pe = K.newState === "open";
    pe || f == null || f(), u == null || u(pe);
  }), Mr(
    typeof document > "u" ? null : document,
    "scroll",
    () => M(),
    { capture: !0, passive: !0 }
  ), Mr(
    typeof window > "u" ? null : window,
    "resize",
    () => M()
  ), Qo(A, () => M());
  const G = {
    ...Yt(
      () => lA(r, n, B),
      [B, n, r]
    ),
    ...N.shiftX || N.shiftY ? { transform: `translate(${N.shiftX}px, ${N.shiftY}px)` } : {},
    ...h
  };
  if (!t && !c) return null;
  const oe = /* @__PURE__ */ j(
    "div",
    {
      ...w,
      ref: A,
      className: p,
      popover: o ? "auto" : "manual",
      style: G,
      "data-tq-component": "popover",
      "data-tq-exit-transition": c ? "" : void 0,
      "data-tq-part": "root",
      children: a ? /* @__PURE__ */ j(
        Gk,
        {
          arrowSide: N.arrowSide,
          arrowOffset: N.arrowOffset,
          flash: i,
          children: m
        }
      ) : m
    }
  );
  if (!s || typeof document > "u") return oe;
  const ue = document.querySelector(s);
  return ue ? Gy(oe, ue) : oe;
}
const Eh = Yo(function({ items: t, onClose: r, autoFocus: n = !1, onReturnToParent: o }, a) {
  const { themeStore: i } = xo(), s = Jo(i, (F) => F.popupPadding), [l, c] = lt(-1), [u, f] = lt(-1), [p, h] = lt(
    () => vc(t, -1, "Home") ?? -1
  ), [m, w] = lt(-1), A = me(null), T = me([]), B = me(null), N = me({ x: 0, y: 0 }), Q = me({ x: 0, y: 0 });
  Ha(a, () => ({ getRoot: () => A.current }), []);
  const O = Jr((F) => {
    var z;
    h(F), (z = T.current[F]) == null || z.focus();
  }, []);
  Vt(() => {
    const F = t[p];
    F && !("separator" in F) && !F.disabled || h(vc(t, -1, "Home") ?? -1);
  }, [p, t]), Vt(() => {
    n && p !== -1 && O(p);
  }, [n, p, O]);
  const M = t[l], X = M && "children" in M ? M.children : void 0, G = l === -1 ? null : T.current[l], oe = () => !!X, ue = () => {
    var Oe;
    const F = (Oe = B.current) == null ? void 0 : Oe.getRoot();
    if (!F) return null;
    const z = F.getBoundingClientRect(), we = z.left >= N.current.x ? z.left : z.right;
    return {
      c1: { x: we, y: z.top },
      c2: { x: we, y: z.bottom }
    };
  }, K = (F) => {
    const z = ue();
    return !!(z && U6(F, Q.current, z.c1, z.c2));
  }, pe = (F, z) => {
    const we = t[F];
    !we || !("separator" in we) && we.disabled || (h(F), w(-1), f(F), N.current = { x: z.clientX, y: z.clientY }, (!oe() || !K(N.current)) && c(F));
  }, be = (F) => {
    const z = t[F];
    return !z || "separator" in z || !("children" in z) || z.disabled ? !1 : (c(F), f(F), w(F), !0);
  }, Ce = (F) => {
    "separator" in F || F.disabled || "perform" in F && F.perform && (F.perform(), r == null || r());
  }, We = (F, z) => {
    const we = vc(t, z, F.key);
    if (we !== void 0) {
      F.preventDefault(), F.stopPropagation(), O(we);
      return;
    }
    if (F.key === "ArrowRight") {
      be(z) && (F.preventDefault(), F.stopPropagation());
      return;
    }
    if (F.key === "ArrowLeft" && o) {
      F.preventDefault(), F.stopPropagation(), o();
      return;
    }
    if (F.key === "Escape") {
      F.preventDefault(), F.stopPropagation(), r == null || r();
      return;
    }
    (F.key === "Enter" || F.key === " ") && (F.preventDefault(), F.stopPropagation(), be(z) || Ce(t[z]));
  };
  return /* @__PURE__ */ vt(An, { children: [
    /* @__PURE__ */ j(
      "ul",
      {
        ref: A,
        role: "menu",
        "aria-orientation": "vertical",
        "data-tq-component": "menu",
        onPointerMove: (F) => {
          N.current = { x: F.clientX, y: F.clientY }, oe() && !K(N.current) && u !== -1 && u !== l && c(u), Q.current = N.current;
        },
        onPointerLeave: () => f(-1),
        "data-tq-part": "root",
        children: t.map(
          (F, z) => "separator" in F ? /* @__PURE__ */ j(
            "li",
            {
              ref: (we) => {
                T.current[z] = we;
              },
              "data-tq-part": "separator",
              role: "separator"
            },
            `${z}_separator`
          ) : /* @__PURE__ */ vt(
            "li",
            {
              ref: (we) => {
                T.current[z] = we;
              },
              "data-tq-active": z === l && u === z ? "" : void 0,
              "data-tq-submenu-open": z === l && u !== z && "children" in F ? "" : void 0,
              role: "menuitem",
              tabIndex: z === p && !F.disabled ? 0 : -1,
              "aria-disabled": F.disabled || void 0,
              "aria-haspopup": "children" in F ? "menu" : void 0,
              "aria-expanded": "children" in F ? z === l : void 0,
              "data-tq-disabled": F.disabled ? "" : void 0,
              onClick: () => Ce(F),
              onFocus: () => h(z),
              onKeyDown: (we) => We(we, z),
              onPointerEnter: (we) => pe(z, we),
              "data-tq-part": "item",
              children: [
                F.icon ? /* @__PURE__ */ j(yr, { "data-tq-part": "icon", icon: F.icon }) : /* @__PURE__ */ j("span", {}),
                /* @__PURE__ */ vt("div", { "data-tq-part": "label-container", children: [
                  /* @__PURE__ */ j("span", { "data-tq-part": "label", children: F.shortLabel ?? F.label }),
                  "bindIcon" in F && F.bindIcon && /* @__PURE__ */ j(Nk, { "data-tq-part": "bind-icon", icon: F.bindIcon }),
                  "children" in F && /* @__PURE__ */ j(
                    yr,
                    {
                      "data-tq-part": "group-chevron",
                      icon: "mdi:chevron-right"
                    }
                  )
                ] })
              ]
            },
            `${z}_item`
          )
        )
      }
    ),
    G && X && /* @__PURE__ */ j(
      c0,
      {
        reference: G,
        placement: "right-start",
        open: !0,
        offset: { crossAxis: -s },
        lightDismiss: !1,
        children: /* @__PURE__ */ j(
          Eh,
          {
            ref: B,
            items: X,
            onClose: r,
            autoFocus: m === l,
            onReturnToParent: () => {
              const F = l;
              c(-1), f(-1), w(-1), O(F);
            }
          }
        )
      }
    )
  ] });
}), qu = Yo(function({
  value: t,
  onChange: r,
  ignoreInput: n = !1,
  hover: o = !1,
  active: a = !1,
  theme: i,
  font: s,
  align: l,
  leftIcon: c,
  rightIcon: u,
  default: f,
  menuItems: p,
  disabled: h,
  invalid: m,
  inlinePosition: w,
  blockPosition: A,
  onFocus: T,
  onBlur: B,
  onKeyDown: N,
  onConfirm: Q,
  onReset: O,
  onChangeFocused: M,
  renderBack: X,
  renderFront: G,
  renderInactiveContent: oe,
  onContextMenu: ue,
  className: K,
  "data-tq-part": pe = "root",
  ...be
}, Ce) {
  const We = me(null), re = me(null), [F, z] = lt(!1), [we, Oe] = lt([0, 0]), ot = !!oe, st = Yt(() => {
    const ae = [];
    return f !== void 0 && ae.push({
      label: "Reset to Default",
      icon: "mdi:restore",
      perform: () => O == null ? void 0 : O()
    }), p != null && p.length && (ae.length && ae.push({ separator: !0 }), ae.push(...p)), ae;
  }, [f, p, O]);
  return Ha(
    Ce,
    () => ({
      select(ae, _) {
        var J, Le, at;
        ae === void 0 ? (J = re.current) == null || J.select() : ((Le = re.current) == null || Le.setSelectionRange(ae, _ ?? ae + 1), (at = re.current) == null || at.focus());
      },
      blur: () => {
        var ae;
        return (ae = re.current) == null ? void 0 : ae.blur();
      },
      getRoot: () => We.current,
      getInput: () => re.current
    }),
    []
  ), /* @__PURE__ */ vt(
    "div",
    {
      ...be,
      theme: i,
      font: s,
      align: l,
      "inline-position": w,
      "block-position": A,
      ref: We,
      className: K,
      "data-tq-component": "input-text-base",
      "data-tq-active": a ? "" : void 0,
      "data-tq-hover": o ? "" : void 0,
      "data-tq-invalid": m ? "" : void 0,
      onContextMenu: (ae) => {
        ue == null || ue(ae), !(ae.defaultPrevented || st.length === 0) && (ae.preventDefault(), Oe([ae.clientX, ae.clientY]), z(!0));
      },
      "data-tq-part": pe,
      children: [
        X == null ? void 0 : X(),
        /* @__PURE__ */ j(
          "input",
          {
            ref: re,
            type: "text",
            value: t,
            disabled: h || void 0,
            "aria-invalid": m || void 0,
            "data-tq-part": "input",
            "data-tq-ignore": n ? "" : void 0,
            "data-tq-has-inactive-content": ot ? "" : void 0,
            onFocus: (ae) => {
              M == null || M(!0), T == null || T(ae);
            },
            onBlur: (ae) => {
              M == null || M(!1), B == null || B(ae);
            },
            onChange: (ae) => r == null ? void 0 : r(ae.currentTarget.value),
            onKeyDown: (ae) => {
              !ae.metaKey && !ae.ctrlKey && ae.key !== "Escape" && ae.key !== "Enter" && ae.key !== "Tab" && ae.stopPropagation(), N == null || N(ae), ae.key === "Enter" && (Q == null || Q());
            }
          }
        ),
        ot && /* @__PURE__ */ j("div", { "data-tq-part": "inactive-content", children: oe == null ? void 0 : oe() }),
        c && /* @__PURE__ */ j(
          yr,
          {
            "data-tq-part": "left-icon",
            icon: c
          }
        ),
        u && /* @__PURE__ */ j(
          yr,
          {
            "data-tq-part": "right-icon",
            icon: u
          }
        ),
        G == null ? void 0 : G(),
        F && /* @__PURE__ */ j(
          c0,
          {
            reference: We.current,
            placement: we,
            open: F,
            teleport: ".TqViewport",
            onChangeOpen: z,
            children: /* @__PURE__ */ j(Eh, { items: st, onClose: () => z(!1) })
          }
        )
      ]
    }
  );
});
function $k({ min: e, max: t, step: r }) {
  const n = me(null), { width: o } = Jn(n), a = e === void 0 || t === void 0 || r === void 0 || o === 0 ? 0 : r / (t - e) * o, i = Yt(
    () => a >= 10 ? { backgroundSize: `${a}px 100%` } : void 0,
    [a]
  );
  return /* @__PURE__ */ j(
    "div",
    {
      ref: n,
      "data-tq-component": "input-number-scales",
      "data-tq-part": "root",
      style: i
    }
  );
}
const zk = ["Alt", "Shift", "q"], gn = Yo(
  function({
    value: t,
    onChange: r,
    min: n = Number.MIN_SAFE_INTEGER,
    max: o = Number.MAX_SAFE_INTEGER,
    step: a,
    snap: i = 10,
    bar: s = 0,
    clampMin: l = !0,
    clampMax: c = !0,
    precision: u = 4,
    prefix: f = "",
    suffix: p = "",
    leftIcon: h,
    rightIcon: m,
    default: w,
    disabled: A,
    invalid: T,
    inlinePosition: B,
    blockPosition: N,
    onFocus: Q,
    onBlur: O,
    onConfirm: M,
    className: X,
    ...G
  }, oe) {
    const ue = me(null), K = Yt(
      () => ({
        get current() {
          var xt;
          return ((xt = ue.current) == null ? void 0 : xt.getRoot()) ?? null;
        }
      }),
      []
    ), { left: pe, right: be, width: Ce } = Jn(K), [We, re] = lt(t), [F, z] = lt(""), [we, Oe] = lt(!1), [ot, st] = lt(!1), [wt, ae] = lt(), [_, J] = lt(!1), [Le, at] = lt(1), [Ft, St] = lt(1), [Wt, it] = lt(!1), Ve = l0(zk), pt = me(t);
    pt.current = t;
    const bt = me(We);
    bt.current = We;
    const $t = me(we);
    $t.current = we;
    const br = me(_);
    br.current = _;
    const Qt = me(Le);
    Qt.current = Le;
    const ur = me(Wt);
    ur.current = Wt;
    const _e = me(Ve);
    _e.current = Ve;
    const ut = me({ left: pe, right: be, width: Ce });
    ut.current = { left: pe, right: be, width: Ce };
    const kt = me({
      min: n,
      max: o,
      step: a,
      snap: i,
      bar: s,
      clampMin: l,
      clampMax: c,
      precisionLimit: u,
      disabled: A
    });
    kt.current = {
      min: n,
      max: o,
      step: a,
      snap: i,
      bar: s,
      clampMin: l,
      clampMax: c,
      precisionLimit: u,
      disabled: A
    };
    const b = me({ onChange: r, onFocus: Q, onBlur: O, onConfirm: M });
    b.current = { onChange: r, onFocus: Q, onBlur: O, onConfirm: M };
    const R = me(0), le = me(t), ie = l ? n : Number.MIN_SAFE_INTEGER, Be = c ? o : Number.MAX_SAFE_INTEGER, E = s !== !1 && n !== Number.MIN_SAFE_INTEGER && o !== Number.MAX_SAFE_INTEGER && Ce > 0, V = (Ve.Alt ? 0.1 : 1) * (Ve.Shift ? i : 1), Se = V * Le, ft = f9({
      step: a,
      display: F,
      width: Ce,
      min: n,
      max: o,
      tweaking: _,
      speed: Se,
      precision: u
    }), Mt = (xt) => _ ? xt.toFixed(ft) : Ug(xt, ft), or = me(Mt);
    or.current = Mt;
    const Gr = () => {
      const xt = kt.current;
      return CS(
        DS(
          xt.clampMin ? xt.min : Number.MIN_SAFE_INTEGER,
          xt.clampMax ? xt.max : Number.MAX_SAFE_INTEGER
        ),
        Lp(xt.step ?? 0),
        Lp(ur.current ? xt.snap : 0)
      );
    }, _r = Yt(
      () => Gr(),
      [c, l, o, n, i, Wt, a]
    ), { validateResult: In } = xh(We, _r), Zr = (xt, rr) => {
      var nr, Ct;
      re(xt), bt.current = xt, rr && z(Mt(xt));
      const ar = Gr()(xt);
      ar.value !== void 0 && ar.value !== pt.current && ((Ct = (nr = b.current).onChange) == null || Ct.call(nr, ar.value));
    }, nn = Ja({
      type: "number",
      getElement: () => K.current,
      getSpeed: () => E && ut.current.width > 0 ? (kt.current.max - kt.current.min) / ut.current.width : 1,
      getValue: () => bt.current,
      setValue: (xt) => {
        var ar, nr;
        const rr = Gr()(Number(xt));
        rr.value !== void 0 && (re(rr.value), bt.current = rr.value, (!$t.current || br.current) && z(Mt(rr.value)), (nr = (ar = b.current).onChange) == null || nr.call(ar, rr.value));
      },
      confirm: () => {
        var xt, rr;
        return (rr = (xt = b.current).onConfirm) == null ? void 0 : rr.call(xt);
      }
    }), eo = me(nn);
    eo.current = nn;
    const u0 = me(() => {
    }), ei = () => {
      M == null || M(), nn.confirm(), nn.capture(), st(!1), ae(void 0), queueMicrotask(() => {
        const xt = pt.current;
        re(xt), z(or.current(xt));
      });
    };
    u0.current = ei;
    const tl = Yt(() => {
      let xt = 0, rr = !1, ar = {
        local: bt.current,
        directionAverage: [1, 0],
        offsetWeight: 1,
        gestureSpeed: 1,
        deltaValue: 0
      };
      return {
        lockPointer: () => {
          const nr = kt.current;
          return !(nr.bar !== !1 && nr.min !== Number.MIN_SAFE_INTEGER && nr.max !== Number.MAX_SAFE_INTEGER && ut.current.width > 0);
        },
        disabled: () => !!kt.current.disabled,
        shouldDrag(nr) {
          var Ct;
          return $t.current ? !!((Ct = nr.target) != null && Ct.closest(
            "[data-tq-number-scrub]"
          )) : !0;
        },
        onClick() {
          var nr;
          (nr = ue.current) == null || nr.select();
        },
        onDragStart(nr, Ct) {
          var to, p0, h0;
          const qr = kt.current, Bn = ut.current, ni = qr.bar !== !1 && qr.min !== Number.MIN_SAFE_INTEGER && qr.max !== Number.MAX_SAFE_INTEGER && Bn.width > 0, ea = !!((to = Ct.target) != null && to.closest(
            "[data-tq-number-scrub]"
          ));
          if (rr = $t.current, ni && qr.min <= pt.current && pt.current <= qr.max && !ea) {
            const m0 = Ut.fit(
              nr.xy[0],
              Bn.left,
              Bn.right,
              qr.min,
              qr.max
            );
            Zr(m0, !0), eo.current.update(() => m0);
          }
          xt = 0, ar = {
            local: bt.current,
            directionAverage: [1, 0],
            offsetWeight: 1,
            gestureSpeed: 1,
            deltaValue: 0
          }, at(1), St(1), J(!0), br.current = !0, eo.current.setFocusing(!0), rr || (h0 = (p0 = b.current).onFocus) == null || h0.call(p0), eo.current.capture();
        },
        onDrag(nr) {
          const Ct = kt.current, qr = ut.current, Bn = Ct.bar !== !1 && Ct.min !== Number.MIN_SAFE_INTEGER && Ct.max !== Number.MAX_SAFE_INTEGER && qr.width > 0, ni = (_e.current.Alt ? 0.1 : 1) * (_e.current.Shift ? Ct.snap : 1);
          let ea = 10 ** -Ct.precisionLimit;
          if (Ct.step && Bn) {
            const to = (Ct.max - Ct.min) / Ct.step;
            ea = 10 ** -Di(qr.width / to);
          }
          ar = d9({
            state: ar,
            delta: nr.delta,
            barVisible: Bn,
            min: Ct.min,
            max: Ct.max,
            width: qr.width,
            step: Ct.step,
            speed: ni * ar.gestureSpeed,
            minSpeed: ea,
            maxSpeed: Bn ? 1 : 1e3
          }), at(ar.gestureSpeed), Qt.current = ar.gestureSpeed, St(ar.offsetWeight), it(_e.current.q), ur.current = _e.current.q, Zr(ar.local, !0), xt += ar.deltaValue, eo.current.update((to) => Number(to) + xt);
        },
        onDragEnd() {
          var nr, Ct;
          J(!1), br.current = !1, eo.current.setFocusing($t.current), u0.current(), rr ? queueMicrotask(() => {
            var qr;
            return (qr = ue.current) == null ? void 0 : qr.select();
          }) : (Ct = (nr = b.current).onBlur) == null || Ct.call(nr);
        }
      };
    }, []);
    Pn(K, tl), Vt(() => {
      _ && (it(Ve.q), ur.current = Ve.q);
    }, [Ve.q, _]), Yr(() => {
      Object.is(le.current, t) || (le.current = t, t !== Gr()(bt.current).value && (re(t), bt.current = t), (!$t.current || br.current) && z(Mt(t)));
    }, [t]), Yr(() => {
      F || z(Mt(t));
    }, []), Ha(
      oe,
      () => ({
        select: () => {
          var xt;
          return (xt = ue.current) == null ? void 0 : xt.select();
        },
        blur: () => {
          var xt;
          return (xt = ue.current) == null ? void 0 : xt.blur();
        }
      }),
      []
    );
    const ti = n <= t && t <= o, f0 = E && t < n, rl = E && t > o, nl = ti && (t <= n || t >= o), Or = Ut.invlerp(n, o, t), ri = Ut.clamp(Or, 0, 1), ol = typeof s == "number" ? s : 0, d0 = Ut.invlerp(n, o, ol), al = Math.min(d0, Or), il = 1 - Math.max(d0, Or), sl = !!a && l && c && n !== Number.MIN_SAFE_INTEGER && o !== Number.MAX_SAFE_INTEGER;
    return /* @__PURE__ */ j(
      qu,
      {
        ...G,
        ref: ue,
        className: X,
        "data-tq-input-number": "",
        "data-tq-range": f0 ? "below" : rl ? "above" : void 0,
        "data-tq-tweaking": _ ? "" : void 0,
        value: F,
        ignoreInput: !we,
        active: nn.subfocus,
        font: ot ? "monospace" : "numeric",
        align: "center",
        inlinePosition: B,
        blockPosition: N,
        disabled: A,
        invalid: T || !_ && (In.log.length > 0 || !!wt),
        leftIcon: h,
        rightIcon: m,
        default: w,
        onFocus: () => {
          Oe(!0), $t.current = !0, nn.setFocusing(!0), nn.capture(), Q == null || Q(), queueMicrotask(() => {
            var xt;
            return (xt = ue.current) == null ? void 0 : xt.select();
          });
        },
        onBlur: () => {
          ei(), Oe(!1), $t.current = !1, nn.setFocusing(!1), O == null || O();
        },
        onChange: (xt) => {
          z(xt), !/^[0-9.]*$/.test(xt) && !ot && (R.current = bt.current, st(!0));
          try {
            const rr = h9(xt), ar = rr(R.current, { i: nn.index });
            Zr(ar, !1), ae(void 0), nn.update(rr);
          } catch (rr) {
            ae(rr.message);
          }
        },
        onKeyDown: (xt) => {
          if (xt.metaKey && xt.key === "=")
            xt.preventDefault(), R.current = bt.current, st(!0);
          else if (xt.key === "ArrowUp" || xt.key === "ArrowDown") {
            xt.preventDefault();
            const rr = xt.key === "ArrowUp" ? 1 : -1;
            let ar = bt.current;
            if (a) ar += a * rr * Math.max(1, V);
            else {
              let nr = V;
              Be - ie <= 1 && (nr *= 0.1), ar = Ut.clamp(
                ar + rr * nr,
                ie,
                Be
              );
            }
            Zr(ar, !0);
          }
        },
        onConfirm: ei,
        onReset: () => {
          w !== void 0 && (r == null || r(w), M == null || M());
        },
        renderInactiveContent: () => /* @__PURE__ */ vt("div", { "data-tq-part": "number-display", children: [
          f && /* @__PURE__ */ j("span", { "data-tq-part": "prefix", children: f }),
          F,
          p && /* @__PURE__ */ j("span", { "data-tq-part": "suffix", children: p })
        ] }),
        renderBack: () => /* @__PURE__ */ vt(An, { children: [
          /* @__PURE__ */ j(
            "div",
            {
              "data-tq-part": "number-bar",
              style: E ? { left: Ni(al), right: Ni(il) } : { visibility: "hidden" }
            }
          ),
          /* @__PURE__ */ j($k, { min: n, max: o, step: a }),
          _ && !sl && /* @__PURE__ */ j("svg", { "data-tq-part": "scrub-scale-overlay", children: [0, 1, 2].map((xt) => {
            const rr = Ut.mod(
              -Math.log(Le) / Math.log(10) + xt,
              3
            );
            return /* @__PURE__ */ j(
              "line",
              {
                "data-tq-part": "scrub-scale",
                x1: -Ce / 2,
                x2: Ce / 2,
                style: {
                  "--offset-weight": Ft,
                  "--gesture-precision": rr,
                  strokeDashoffset: -(E ? Ut.efit(t, n, o, 0, Ce) : Ce / 2 - t / Le),
                  opacity: Math.pow(
                    Ut.smoothstep(1, 2, rr),
                    0.5
                  )
                }
              },
              xt
            );
          }) }),
          /* @__PURE__ */ j(
            "div",
            {
              "data-tq-number-scrub": "",
              "data-tq-part": "number-handle",
              style: E ? { left: `calc((100% - 1px) * ${Or})` } : { visibility: "hidden" }
            }
          )
        ] }),
        renderFront: () => /* @__PURE__ */ j(An, { children: E ? ti ? nl ? /* @__PURE__ */ j(Ei, { edge: !0, position: ri }) : /* @__PURE__ */ vt(An, { children: [
          /* @__PURE__ */ j(Ei, { top: !0, position: ri }),
          /* @__PURE__ */ j(Ei, { bottom: !0, position: ri })
        ] }) : /* @__PURE__ */ vt(An, { children: [
          /* @__PURE__ */ j(Ei, { top: !0, wide: !0 }),
          /* @__PURE__ */ j(Ei, { bottom: !0, wide: !0 })
        ] }) : /* @__PURE__ */ j(
          "div",
          {
            "data-tq-number-scrub": "",
            "data-tq-part": "scrub-grip",
            children: !h && /* @__PURE__ */ j(
              yr,
              {
                "data-tq-part": "scrub-grip-hint",
                icon: "mdi:arrow-left-right"
              }
            )
          }
        ) })
      }
    );
  }
);
function Ei({
  top: e,
  bottom: t,
  edge: r,
  wide: n,
  position: o
}) {
  return /* @__PURE__ */ j(
    "div",
    {
      "data-tq-number-scrub": "",
      "data-tq-part": "scrub-zone",
      "data-tq-zone": e ? "top" : t ? "bottom" : r ? "edge" : void 0,
      "data-tq-wide": n ? "" : void 0,
      style: o === void 0 ? void 0 : {
        left: `clamp(0px, calc((100% - 1px) * ${o} - var(--tq-input-height) / 2), calc(100% - var(--tq-input-height)))`
      }
    }
  );
}
function Sh({
  mode: e = "inline",
  strokeWidth: t,
  nonStrokeScaling: r = !1,
  className: n,
  children: o,
  style: a,
  ...i
}) {
  return /* @__PURE__ */ j(
    "svg",
    {
      className: n,
      "data-tq-component": "svg-icon",
      "data-tq-mode": e,
      "data-tq-non-stroke-scaling": r ? "" : void 0,
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 32 32",
      width: "32",
      height: "32",
      style: { ...a, strokeWidth: t },
      ...i,
      children: o
    }
  );
}
function el({ className: e, ...t }) {
  return /* @__PURE__ */ j("div", { ...t, className: e, "data-tq-component": "tooltip" });
}
const jk = Ak;
function kh(e, t) {
  const r = Yt(() => jk(t), [t]), n = me(r);
  n.current = r;
  const o = me(null), a = () => {
    const s = e.current;
    !s || vk(n.current) || (xk(s), _k(s, n.current));
  }, i = () => {
    const s = e.current;
    s && Ek(s);
  };
  Mr(e, "mouseenter", a), Mr(e, "mouseleave", i), Mr(e, "focus", a), Mr(e, "blur", i), Vt(() => {
    const s = e.current, l = o.current;
    l && l !== s && (Wp(l), Xp(l)), o.current = s, s && Sk(s, r);
  }), Vt(() => () => {
    const s = o.current;
    s && (Wp(s), Xp(s));
  }, []);
}
function $u({
  children: e,
  className: t,
  ...r
}) {
  const n = me(null);
  return Vt(() => {
    const o = n.current;
    try {
      o == null || o.showPopover();
    } catch {
    }
    return () => {
      try {
        o == null || o.hidePopover();
      } catch {
      }
    };
  }, []), /* @__PURE__ */ j(
    "div",
    {
      ...r,
      ref: n,
      className: t,
      "data-tq-component": "tweak-overlay",
      "data-tq-part": "root",
      popover: "manual",
      children: e
    }
  );
}
const Hk = ["Shift", "q", "a", "r"];
function Uk({
  value: e,
  onChange: t,
  snap: r = 45,
  angleOffset: n = -90,
  disabled: o,
  invalid: a,
  inlinePosition: i,
  blockPosition: s,
  onFocus: l,
  onBlur: c,
  onConfirm: u,
  className: f,
  ...p
}) {
  const { themeStore: h } = xo(), m = me(null), w = Lk(m), A = me(w);
  A.current = w;
  const T = l0(Hk), B = me(T);
  B.current = T;
  const N = Rk({ absolute: T.a, relative: T.r }), [Q, O] = lt(
    "relative"
  ), M = N ?? Q, X = me(M);
  X.current = M;
  const [G, oe] = lt(e), ue = me(G);
  ue.current = G;
  const K = me(e);
  K.current = e;
  const pe = me(e), be = Jo(h, (Ve) => Ve.inputHeight), Ce = [be * 4, 160], We = me(Ce);
  We.current = Ce;
  const re = me({
    onChange: t,
    onConfirm: u,
    onFocus: l,
    onBlur: c,
    disabled: o,
    snap: r,
    angleOffset: n
  });
  re.current = {
    onChange: t,
    onConfirm: u,
    onFocus: l,
    onBlur: c,
    disabled: o,
    snap: r,
    angleOffset: n
  };
  const F = me(null), z = Ja({
    type: "number",
    getElement: () => m.current,
    getValue: () => ue.current,
    setValue: (Ve) => {
      var bt, $t;
      const pt = Number(Ve);
      oe(pt), ue.current = pt, ($t = (bt = re.current).onChange) == null || $t.call(bt, pt);
    },
    confirm: () => {
      var Ve, pt;
      return (pt = (Ve = re.current).onConfirm) == null ? void 0 : pt.call(Ve);
    }
  }), we = me(z);
  we.current = z;
  const Oe = Yt(
    () => ({
      disabled: () => !!re.current.disabled,
      dragDelaySeconds: 0,
      onDragStart(Ve) {
        F.current = Ve, pe.current = K.current;
        let pt = K.current;
        if (X.current === "absolute") {
          const bt = Xt.sub(Ve.xy, A.current), $t = Xt.angle(bt) - re.current.angleOffset;
          pt += e1($t, pt);
        }
        oe(pt), ue.current = pt, we.current.capture();
      },
      onDrag(Ve) {
        var kt, b, R;
        F.current = Ve;
        const pt = (kt = m.current) == null ? void 0 : kt.getBoundingClientRect(), bt = pt ? [pt.left + pt.width / 2, pt.top + pt.height / 2] : A.current, $t = Xt.sub(Ve.xy, bt), br = Xt.sub(Ve.previous, bt), Qt = Xt.angle(br, $t), ur = Xt.dist(bt, Ve.xy), _e = B.current.Shift || B.current.q || We.current[0] <= ur && ur <= We.current[1], ut = v9(
          ue.current,
          Qt,
          re.current.snap,
          _e
        );
        if (oe(ut.local), ue.current = ut.local, (R = (b = re.current).onChange) == null || R.call(b, ut.output), X.current === "absolute")
          we.current.update(() => ut.output);
        else {
          const le = ut.output - pe.current;
          we.current.update((ie) => {
            const Be = Number(ie) + le;
            return _e ? Ut.quantize(Be, re.current.snap) : Be;
          });
        }
      },
      onDragEnd() {
        var Ve, pt;
        (pt = (Ve = re.current).onConfirm) == null || pt.call(Ve), we.current.confirm();
      }
    }),
    []
  ), ot = Pn(m, Oe);
  F.current = ot, Vt(() => {
    ot.dragging || (oe(e), ue.current = e);
  }, [ot.dragging, e]), XS(ot.dragging ? "none" : null), sh({
    target: m,
    onCopy: () => void navigator.clipboard.writeText(K.current.toString()),
    onPaste: async () => {
      var pt, bt;
      const Ve = parseFloat(await navigator.clipboard.readText());
      Number.isNaN(Ve) || ((bt = (pt = re.current).onChange) == null || bt.call(pt, Ve), we.current.update(() => Ve), we.current.confirm());
    }
  });
  const st = T.Shift || T.q || Ce[0] <= Xt.dist(w, ot.xy) && Xt.dist(w, ot.xy) <= Ce[1], wt = _h(), ae = [
    [40, 40],
    [wt.width - 40, wt.height - 40]
  ], _ = w9(ot.initial, ot.xy, ae), J = Xt.angle(Xt.sub(ot.xy, ot.origin)) + 90, Le = `${Math.trunc(e / 360) ? `${Math.trunc(e / 360)}x ` : ""}${(e - Math.trunc(e / 360) * 360).toFixed(1)}°`, at = Ns().replaceAll(":", ""), Ft = (Ve, pt, bt) => {
    const $t = Ve + n;
    return i3(
      Xt.dir($t, pt, w),
      Xt.dir($t, bt, w)
    );
  }, St = Qc(
    $i(0, 360, r).map((Ve) => Ft(Ve, ...Ce))
  ), Wt = (() => {
    if (M === "absolute")
      return Ft(e, be, Xt.dist(w, ot.xy));
    const Ve = be * 4, pt = be * 0.25, bt = pe.current + n, $t = e + n, br = Math.floor(Math.abs($t - bt) / 360) * Math.sign($t - bt), Qt = $i(0, br).map(
      (kt) => s3(w, Ve + kt * pt)
    );
    let ur = _s(e1($t, bt), 360);
    $t < bt && (ur -= 360);
    const _e = _s(bt, 360), ut = fA(
      w,
      Ve + br * pt,
      _e,
      _e + ur
    );
    return Qc([...Qt, ut]);
  })(), it = st && e % r === 0 ? Ft(e, ...Ce) : "";
  return /* @__PURE__ */ vt(An, { children: [
    /* @__PURE__ */ j(
      "button",
      {
        ...p,
        ref: m,
        className: f,
        type: "button",
        disabled: o,
        "aria-invalid": a || void 0,
        "inline-position": i,
        "block-position": s,
        "data-tq-component": "input-rotary",
        "data-tq-tweaking": ot.dragging ? "" : void 0,
        "data-tq-subfocus": z.subfocus ? "" : void 0,
        "data-tq-tweak-mode": M,
        "data-tq-part": "root",
        onFocus: () => {
          z.setFocusing(!0), l == null || l();
        },
        onBlur: () => {
          z.setFocusing(!1), c == null || c();
        },
        children: /* @__PURE__ */ vt(
          Sh,
          {
            mode: "block",
            "data-tq-part": "rotary",
            children: [
              /* @__PURE__ */ j("circle", { "data-tq-part": "circle", cx: "16", cy: "16", r: "16" }),
              /* @__PURE__ */ vt(
                "g",
                {
                  style: {
                    transformOrigin: "16px 16px",
                    transform: `rotate(${e + n}deg)`
                  },
                  "data-tq-part": "indicator",
                  onPointerEnter: () => O("absolute"),
                  onPointerLeave: () => !ot.dragging && O("relative"),
                  children: [
                    /* @__PURE__ */ j(
                      "path",
                      {
                        "data-tq-part": "absolute-mode-area",
                        d: "M 16 16 L 16 32 A 16 16 0 0 0 16 0 Z"
                      }
                    ),
                    /* @__PURE__ */ j("path", { "data-tq-part": "tip", d: "M20 16 L30 16" })
                  ]
                }
              ),
              /* @__PURE__ */ j(
                "circle",
                {
                  cx: "16",
                  cy: "16",
                  r: "7",
                  fill: "transparent",
                  stroke: "none",
                  "data-tq-part": "relative-mode-area"
                }
              )
            ]
          }
        )
      }
    ),
    ot.dragging && /* @__PURE__ */ j($u, { children: /* @__PURE__ */ vt(
      "div",
      {
        "data-tq-component": "input-rotary-overlay",
        "data-tq-part": "overlay",
        children: [
          /* @__PURE__ */ vt("svg", { children: [
            /* @__PURE__ */ j("defs", { children: /* @__PURE__ */ j(
              "marker",
              {
                id: at,
                markerWidth: "6",
                markerHeight: "6",
                refX: "3",
                refY: "3",
                orient: "auto",
                fill: "var(--tq-color-accent)",
                children: /* @__PURE__ */ j("path", { d: "M 0 0 L 6 3 L 0 6 Z" })
              }
            ) }),
            /* @__PURE__ */ j(
              "path",
              {
                "data-tq-part": "meter-path",
                "data-tq-snap": st ? "" : void 0,
                d: St
              }
            ),
            /* @__PURE__ */ j(
              "path",
              {
                "data-tq-part": "drag-path",
                d: Wt,
                markerEnd: M === "relative" ? `url(#${at})` : void 0
              }
            ),
            /* @__PURE__ */ j(
              "path",
              {
                "data-tq-part": "active-meter-path",
                d: it
              }
            )
          ] }),
          /* @__PURE__ */ vt(
            el,
            {
              "data-tq-part": "overlay-label",
              style: { left: _[0], top: _[1] },
              children: [
                Le,
                /* @__PURE__ */ j(
                  "span",
                  {
                    "data-tq-part": "arrows",
                    style: { transform: `rotate(${J}deg)` }
                  }
                )
              ]
            }
          )
        ]
      }
    ) })
  ] });
}
function FD(e) {
  const { themeStore: t } = xo(), r = me(null), { width: n } = Jn(r), o = Jo(t, (i) => i.inputHeight), a = {
    value: e.value,
    onChange: e.onChange,
    disabled: e.disabled,
    invalid: e.invalid,
    onFocus: e.onFocus,
    onBlur: e.onBlur,
    onConfirm: e.onConfirm
  };
  return /* @__PURE__ */ vt("div", { ref: r, "data-tq-component": "input-angle", "data-tq-part": "angle-root", children: [
    /* @__PURE__ */ j(
      Uk,
      {
        ...a,
        snap: e.snap,
        angleOffset: e.angleOffset
      }
    ),
    n > o * 4 && /* @__PURE__ */ j(gn, { ...a, suffix: "°" })
  ] });
}
function Th(...e) {
  return e.filter(Boolean).join(" ");
}
function Dh(e) {
  const t = [];
  return By.forEach(e, (r) => {
    if (!(typeof r == "string" && r.trim() === "")) {
      if (Gc(r) && r.type === Ny) {
        t.push(
          ...Dh(
            r.props.children
          )
        );
        return;
      }
      t.push(r);
    }
  }), t;
}
const Sa = Yo(
  function({
    direction: t = "horizontal",
    component: r = "input-group",
    children: n,
    className: o,
    ...a
  }, i) {
    const s = Dh(n), l = s.filter(Gc).length;
    let c = 0;
    const u = t === "vertical" ? "blockPosition" : "inlinePosition", f = s.map((p, h) => {
      if (!Gc(p) || l <= 1) return p;
      const m = c === 0 ? "start" : c === l - 1 ? "end" : "middle";
      return c += 1, Iy(p, {
        key: p.key ?? h,
        [u]: m
      });
    });
    return /* @__PURE__ */ j(
      "div",
      {
        ...a,
        ref: i,
        className: Th("TqInputGroup", o),
        "data-direction": t,
        "data-tq-component": r,
        "data-tq-layout": "input-group",
        "data-tq-part": "root",
        children: f
      }
    );
  }
), zu = Yo(
  function({
    value: t,
    onChange: r,
    theme: n,
    font: o,
    align: a,
    validator: i = MS,
    default: s,
    disabled: l,
    invalid: c,
    inlinePosition: u,
    blockPosition: f,
    onFocus: p,
    onBlur: h,
    onConfirm: m,
    onKeyDown: w,
    ...A
  }, T) {
    const [B, N] = lt(t), [Q, O] = lt(t), [M, X] = lt(!1), [G, oe] = lt(!1), [ue, K] = lt(), pe = me(null), be = me(t);
    be.current = t;
    const Ce = me(B);
    Ce.current = B;
    const We = me(M);
    We.current = M;
    const re = me(i);
    re.current = i;
    const F = me({ onChange: r, onConfirm: m });
    F.current = { onChange: r, onConfirm: m };
    const z = me(""), we = me(t), { validateResult: Oe } = xh(B, i);
    Yr(() => {
      Object.is(we.current, t) || (we.current = t, N(t), We.current || O(t));
    }, [t]);
    const ot = (ae, _) => {
      var Le, at;
      N(ae), Ce.current = ae, _ && O(ae);
      const J = re.current(ae);
      J.value !== void 0 && J.value !== be.current && ((at = (Le = F.current).onChange) == null || at.call(Le, J.value));
    }, st = Ja({
      type: "string",
      getElement: () => {
        var ae;
        return ((ae = pe.current) == null ? void 0 : ae.getRoot()) ?? null;
      },
      getValue: () => Ce.current,
      setValue: (ae) => ot(String(ae), !We.current),
      confirm: () => {
        var ae, _;
        return (_ = (ae = F.current).onConfirm) == null ? void 0 : _.call(ae);
      }
    }), wt = () => {
      m == null || m(), st.capture(), st.confirm(), oe(!1), K(void 0), queueMicrotask(() => {
        const ae = be.current;
        N(ae), O(ae);
      });
    };
    return Ha(
      T,
      () => ({
        select: () => {
          var ae;
          return (ae = pe.current) == null ? void 0 : ae.select();
        },
        blur: () => {
          var ae;
          return (ae = pe.current) == null ? void 0 : ae.blur();
        }
      }),
      []
    ), /* @__PURE__ */ j(
      qu,
      {
        ...A,
        ref: pe,
        value: Q,
        active: st.subfocus,
        theme: n,
        font: o ?? (G ? "monospace" : void 0),
        align: a,
        inlinePosition: u,
        blockPosition: f,
        disabled: l,
        invalid: c || Oe.log.length > 0 || !!ue,
        default: s,
        onFocus: () => {
          X(!0), We.current = !0, st.setFocusing(!0), st.capture(), p == null || p();
        },
        onBlur: () => {
          wt(), X(!1), We.current = !1, st.setFocusing(!1), h == null || h();
        },
        onChange: (ae) => {
          if (O(ae), G)
            try {
              const _ = uA(ae), J = _(z.current, { i: st.index });
              ot(J, !1), K(void 0), st.update(_);
            } catch (_) {
              K(_.message), st.update((J) => J);
            }
          else
            ot(ae, !1), st.update(() => ae);
        },
        onKeyDown: (ae) => {
          w == null || w(ae), !ae.defaultPrevented && ae.metaKey && ae.key === "=" && (ae.preventDefault(), oe(!0), O(`"${Ce.current}"`), z.current = Ce.current);
        },
        onConfirm: wt,
        onReset: () => {
          s !== void 0 && (r == null || r(s));
        }
      }
    );
  }
);
var Mh = `precision mediump float;

varying vec2 uv;

uniform vec4 hsva;
uniform ivec2 axes;

#define R 0
#define G 1
#define B 2
#define A 3
#define H 4
#define S 5
#define V 6

#define NONE -1.0

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
	vec3 hsv = hsva.rgb;

	vec3 rgb = hsv2rgb(hsv);
	vec4 outColor = vec4(rgb, 1.0);

	float hue = NONE;
	float sat = NONE;

	for (int i = 0; i < 2; i++) {
		int axis = axes[i];
		float t = uv[i];

		if (axis == R) {
			outColor.r = t;
		} else if (axis == G) {
			outColor.g = t;
		} else if (axis == B) {
			outColor.b = t;
		} else if (axis == A) {
			outColor.a = t;
		} else {
			vec3 hsv = rgb2hsv(outColor.rgb);

			if (hsv[1] == 0.0 || hsv[2] == 0.0) {
				hsv[0] = hue == NONE ? hsva[0] : hue;
				hsv[1] = sat == NONE ? hsva[1] : sat;
			}

			if (axis == H) {
				hsv[0] = t;
				hue = t;
			} else if (axis == S) {
				hsv[1] = t;
				sat = t;
			} else if (axis == V) {
				hsv[2] = t;
			}

			outColor.rgb = hsv2rgb(hsv);
		}
	}



	gl_FragColor = outColor;
}`, Ch = `precision mediump float;

varying vec2 uv;

uniform vec4 hsva;
uniform int axis;
uniform float offset;

#define R 0
#define G 1
#define B 2
#define A 3
#define H 4
#define S 5
#define V 6

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
	float t = uv.x + offset;

	vec4 outColor = vec4(hsv2rgb(hsva.xyz), 1.0);

	outColor.a = 1.0;

	if (axis == R) {
		outColor.r = t;
	} else if (axis == G) {
		outColor.g = t;
	} else if (axis == B) {
		outColor.b = t;
	} else if (axis == A) {
		outColor.a = t;
	} else {
		vec3 _hsv = hsva.xyz;
		if (axis == H) {
			_hsv = vec3(t, 1.0, 1.0);
		} else if (axis == S) {
			_hsv[1] = t;
		} else if (axis == V) {
			_hsv[2] = t;
		}
		outColor.rgb = hsv2rgb(_hsv);
	}

	gl_FragColor = outColor;
}`, Vk = `precision mediump float;

varying vec2 uv;

uniform vec4 hsva;

vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {

	vec2 pos = uv * 2.0 - 1.0;

	float hue = atan(pos.x, pos.y) / (2.0 * 3.14159265358979323846);
	float sat = 1.0;
	float val = 1.0;

	vec3 rgb = hsv2rgb(vec3(hue, sat, val));

	gl_FragColor = vec4(rgb, 1.0);
}`;
const Wk = `
	precision mediump float;
	varying vec2 uv;
	void main() { gl_FragColor = vec4(uv, 0, 1); }
`, Pi = Yo(
  function({
    fragmentString: t = Wk,
    uniforms: r = {},
    className: n,
    alt: o = "",
    "data-tq-component": a = "glsl-canvas",
    "data-tq-part": i = "image",
    ...s
  }, l) {
    const c = me(null);
    return Ha(l, () => c.current, []), Qo(c, () => {
      const u = c.current;
      u && jp(u, t, r);
    }), Vt(() => {
      const u = c.current;
      if (u)
        return jp(u, t, r);
    }, [t, r]), /* @__PURE__ */ j(
      "img",
      {
        ...s,
        ref: c,
        alt: o,
        className: n,
        "data-tq-component": a,
        "data-tq-part": i
      }
    );
  }
);
function Xk({
  value: e,
  onChange: t,
  axes: r,
  disabled: n
}) {
  const o = me(null), a = me(e), i = me({ value: e, onChange: t, axes: r });
  i.current = { value: e, onChange: t, axes: r };
  const s = Yt(
    () => ({
      disabled: () => !!n,
      dragDelaySeconds: 0,
      onDragStart: (h, m) => {
        var T, B;
        if (a.current = i.current.value, m.target !== o.current) return;
        const w = (h.xy[0] - h.left) / (h.right - h.left), A = (h.bottom - h.xy[1]) / (h.bottom - h.top);
        a.current = Uo(
          a.current,
          i.current.axes[0],
          w
        ), a.current = Uo(
          a.current,
          i.current.axes[1],
          A
        ), (B = (T = i.current).onChange) == null || B.call(T, a.current);
      },
      onDrag: (h) => {
        var w, A;
        let m = Xn(
          a.current,
          i.current.axes[0],
          (h.xy[0] - h.initial[0]) / h.width
        );
        m = Xn(
          m,
          i.current.axes[1],
          (h.initial[1] - h.xy[1]) / h.height
        ), (A = (w = i.current).onChange) == null || A.call(w, m);
      }
    }),
    [n]
  ), l = Pn(o, s), c = Yt(() => {
    const { h, s: m, v: w, a: A } = e;
    return { hsva: [h, m, w, A], axes: r.map(Mi) };
  }, [r, e]), u = $o(e, r[0]), f = $o(e, r[1]), p = l.dragging && l.left <= l.xy[0] && l.right >= l.xy[0] && l.top <= l.xy[1] && l.bottom >= l.xy[1];
  return /* @__PURE__ */ vt(
    "div",
    {
      ref: o,
      "data-tq-component": "input-color-channel-pad",
      "data-tq-part": "root",
      style: { cursor: p ? "none" : void 0 },
      children: [
        /* @__PURE__ */ j(
          Pi,
          {
            "data-tq-part": "canvas",
            fragmentString: Mh,
            uniforms: c
          }
        ),
        /* @__PURE__ */ j(
          "div",
          {
            "data-tq-part": "handle",
            "data-tq-tweaking": l.dragging ? "" : void 0,
            style: {
              left: Ni(u),
              bottom: Ni(f),
              background: Ea({ ...e, a: 1 })
            }
          }
        )
      ]
    }
  );
}
function Yk({
  value: e,
  onChange: t,
  axis: r,
  disabled: n
}) {
  const o = me(null), a = me(e), i = me({ value: e, onChange: t, axis: r });
  i.current = { value: e, onChange: t, axis: r };
  const s = Yt(
    () => ({
      disabled: () => !!n,
      dragDelaySeconds: 0,
      onDragStart: (f, p) => {
        var m, w;
        if (a.current = i.current.value, p.target !== o.current) return;
        const h = (f.xy[0] - f.left) / (f.right - f.left);
        a.current = Uo(a.current, i.current.axis, h), (w = (m = i.current).onChange) == null || w.call(m, a.current);
      },
      onDrag: (f) => {
        var p, h;
        (h = (p = i.current).onChange) == null || h.call(
          p,
          Xn(
            a.current,
            i.current.axis,
            (f.xy[0] - f.initial[0]) / f.width
          )
        );
      }
    }),
    [n]
  ), l = Pn(o, s), c = Yt(() => {
    const { h: f, s: p, v: h, a: m } = e;
    return { hsva: [f, p, h, m], axis: Mi(r), offset: 0 };
  }, [r, e]), u = l.dragging && l.left <= l.xy[0] && l.right >= l.xy[0] && l.top <= l.xy[1] && l.bottom >= l.xy[1];
  return /* @__PURE__ */ vt(
    "div",
    {
      ref: o,
      "data-tq-component": "input-color-channel-slider",
      "data-tq-part": "root",
      style: { cursor: u ? "none" : void 0 },
      children: [
        /* @__PURE__ */ j(
          Pi,
          {
            "data-tq-part": "canvas",
            fragmentString: Ch,
            uniforms: c
          }
        ),
        /* @__PURE__ */ j(
          "button",
          {
            type: "button",
            "aria-label": `${r.toUpperCase()} channel`,
            disabled: n,
            "data-tq-part": "handle",
            "data-tq-tweaking": l.dragging ? "" : void 0,
            style: {
              left: Ni($o(e, r)),
              background: Ea({ ...e, a: 1 })
            }
          }
        )
      ]
    }
  );
}
var Kk = {
  CR: 1,
  LF: 2,
  Control: 4,
  Extend: 8,
  ZWJ: 16,
  Regional_Indicator: 32,
  Prepend: 64,
  SpacingMark: 128,
  L: 256,
  V: 512,
  T: 1024,
  LV: 2048,
  LVT: 4096,
  Extended_Pictographic: 8192,
  InCB_Linker: 16384,
  InCB_Consonant: 32768,
  InCB_Extend: 65536
};
const Zk = "ABAOAAAAAADQjQAAAd4HIfjtnG2oFUUYxx/1nHu29OolvKRSZIIQghSSEFJwwj4YWdzoFcoQyriBHwz8YHDBiSKDLG9YKSEiUX4IFQ0FCaRLoFmUb9mLBqJ+EDOIsAgpjf7b7nCnOTO7M7szu8frPPBjZufleZ6ZeWZm73pwYALRk2ApGAQMvC6UlU2HwUbwDthk0P5DsC2jfifYC0bAQXAE/AhOgXNCu1/A7+ASoAZRD5gMekE/mAFmge1gN9jbSPrOSdPPkM4DX4AvwVFwApwBZ8EFcBH8Bf4GE5pEUXP0uQ/5ac2k/UyktzWT/ncgPYj0rmZip91M6hc1R/U/hPzj4BnwPBgECwT7cb8VKFsZJflVyK9O9cW8gvwb6fM6pO+l+c1It4Lt4Hah/R7k94H94BuhPGZDNMqWlK1gf4rYNovthu1c8x3G8xOYmhKXnUH6c5pf0/h/+8Uo/1Wagz+bev1X0rpGD9GkniS/FjRTvVNRdiO4BcwGc8H8tN3dabqwp1Pv/Sh7WFHOGU4pOz9vws/1qa+PCuXxGHZmjDtQAdL6n1DEgAs7NwnrvCQj5gKBQCAQCAQCgUAgEOgGnsPfrlOE7zlvG3y/WI4+K4W/eYciotVgCGWv8u85SNeDjVHyPXAj8tORbknrtyLdAT5Jnz9Fehnp5zl/S3+F+kPQeRgcAUfBMfAtOB6FulAX6kJdqHNdtwPsAQei+u+sQCAwdjnk+d9TNk0Y/Xd1mUFFmfh+vKHhxycbRnoTaDLR0t582mg3oGg7LJWN4JmmoD1YNSUp24b0NJjWR3QnGAT3TcT7Pzh7HdGt1xNF4xKeFvIiu9D25ER1nczqVMeMSUS7kX8M6bvgMKBeMx2BQCAQGJv8gXuhEd8nLaJ/cB+2cCdPaiW/E2ojvyi9oyOkN6B8Df5mmZbW34x0QLjDZ7eS707i/Rr/ZmRua/R3ZPORv6eV1C2MU/R/MP1O9gCeH2mN9n0K+Wdb+rt7EHUrhPpVreS7GH9mQt1ryL+VoWt9Rl3MEuhdJr2vvI8+H4CPwQuo25XqeLHAe81ewf4I8gckf77G80up3uM5voqcRNuX0e800vMW/XwyBH7rEl9EZiC2n6jQ3masyxzY/EHxnXjeVfptIP797rAAkxjO4KNGZ/trjTJz/33O33rTpXPpVBf+1u4cfLqg8Wuxo9+Dnk/1XzQc/6W03RWhrD+dSzI4x+K/eS914Xnnisvp2MY7OrP2ldAToe86MFnQ0X+VnqU2xOfnrCh5f3Oha0GUpPciXQQGrqY5hK9LBX+nK/aebaweS8+AZSXnIa9/v4MzTh7b2jH6O/rlJdfiZBeMoUFmjBfy4wz7mBCkPgnz7y6Oq4x/l+sWXeO4lKrsdJvUvYZF111MdfmxLm0NpmI7591853Tj+VJVDGaNoZ3TRtahautDRL/qkm6KlW6Wa2EeXI3N5Ry0SX+e26xJ27K9K5iijNJyjvwsnllZ4mKeZbuy72I5F5VvNr6o+hcVbredoVc3/y7vN/keke0ywS6T6tqOfOE2mQKS8rJ/3A8mpHWfZVl7qq0oV0lbQ9m9bOszt+lb5LWsU8TxN8j9+LnOPnL3Pc73tz4X31fy7mVdDObZcnHfdev3VNV86ebRtF1VUsSui7U0OQ/rEvE8Jsp+j1H5Lbfnecrpa+Nf1XEi2mZUz/qIe4b7oJtDXi8/m85bN69HJOXr2i9Z+0PVVuW36n5x6V8Z/Yw640s+t5nQlpGfOPAdX2XPI5d+iP6wDJ8YFdvfRc/bOkR31jKpXHx2eb7J91kd7yaMOseb9w6Vp7PO9YyFUWeMM6pvfC7mhBXoI78z1SnyfDPLvqoyRp1nmNieZeAqRlUxV+Ssz3vvdSWm/paJ87ruuipsyTGmssfI3X4zWSMVTFNOlD1PNjbK+OeKsmI6b/J4mdTWp+TZ8jkfRXXEwgz0lPXZx9z7PruqOhdNYlqMZR2qeHe1N33OQdYYVeWyiG3l/rKeKteS2/UhXDdP885CMaWcPqbzaBJTOt1ViqnPjOqJmSzxcbfWtQ6iMNLPv6tx5om8fxh1niUu/GA5mMalq3lQnQ+25PmtspnlDxdRrwupaw/7WCvb9VLpynrWlbkURp17zrcPjNT7rSopsr9cnX95+861PRN/bM8Y1/YZmd0//Fmnp0oxvRvk5yJ2TNqwArpdiY+Y4Kk8b1nzWGSOGZnFF29nK1ynHAuiraK6XUudPlRh2+ZM1d3xJnp9S9H3Op2OKu4Xn7qrfn9gVO+Za3oe6vrq7vWq3z24Py6Fkf59Qjd2VzZ0dnXC62x89iGi7xwuumebc8ZUZFum81BlvKoka+19+cLIPGZU7fizT3GlP29+xfEwKa864+oUk3OCkXp9maJtFeLaJqNisctTG9HFRh13XZaoxmd6T7sWRuZz5Ssus3zgIseI2F7WVbWYzFsVsWZzT5veHWVE1qWaj7w4cyWma6TyMW8cTJP37bvchqQ6Gx+YAlkfL/exPqIt0b5r4brz5lPVzqfo9GfZLRrTNmMx1cfIz5z5Pkd9ntfyvilCnv6y/tr2q+ouM/WhbPyX2UNFdPqSqs6pLLuucWXLZAw24/UlOt9dzqELn1z5Zrtv8uz6EF82ZlaEK2FU7vtpXcIsydJRhbCa+e8/D60bUcbXTMMzfRK24nKssvgYr+x71lh8iO/1tBl/LPGlIseAT6q2J8m/", Qk = {
  data: Zk
}, Jk = "AAACAAAAAACAOAAAAbYBSf7t2S1IBEEYBuDVDZ7FYrQMNsFiu3hgEYOI0SCXRIUrB8JhEZtgs5gEg1GMFk02m82oGI02m+9xezCOczv/uwv3fvAwc/PzfXOzcdqzWdaBDdiGPdiHdjE+DS3RNDuCfsn8idQ/g3OH3BdwKf0e96/gumTfYcncLdzBPTzAo+RZ+f0Cr/AG7/AJX4738x1wtz9FO5PX/50n6UXMNdfg/0lERERERERERERERETpdedHBvDRql4nq0cXtW9af98qdRby0Vvp8K4W0V+C5Xw0t4J2bfjeBp3cnEu1brnnCTYNa7eKdz91XP7WO9Lb4GqRb7cY6xbtAdqeVOsY/QGcevw/tb6OT85YhvfKYEx9CMuxKsKnrs+eJtVInVvHJ0eVYVvTZk2siFVLOCjb61PTZX3MdVWEyP7fjzpmMxdzTyq2Ebue6x61nXRGnzndWpf1an7dXmGYE4Y1ptqqKsK1nu26Ju0ty+maV2Rpvk+qnDZjKUIobUiesdAQE/jmCTmHmsskpFZsVYbtmXRcaoSGUPomunW2derQhDPFjtT1Q/eb8vnm990fq35oHVt11bU9m89c7DNI8Qs=", eT = {
  data: Jk
}, tT = "AAgOAAAAAABQfgAAAWMGnPntmm2IVUUYx+dyb2ezXXtBiSCLsKDIiKIIoYINciGwQHrRL2Ufii0qMsv7QVBuQkXhkmW5gksQRhRFSBslbkllHyy3L2XllkXrB3uhF0tQ0Kj+xzN3d3buzJx5PeesOw/8mDNvz/PMnOc8s/fs6asTcgu4A9wF+mjdV9kEa8FqsE5j/DPgeUX/JvASeBW8Bd4GO8CHYDcz7nPwFRgD4+An8Cf4AxwBx0G9QcjrYBt4p5HN/YDqGEF9F7gW3AC6wU1gCVgK5oDlYA8YBXvBGOgHD4FzwSo6fg24EDwBxsEB8Cu1N4ByI1gA/gbfo+0wyuO0vgW8DK5i+tN5tVOyMmUWrs9k6nNxPY/WL0B5Mb2+HOU14HrwY2Ny/CLUbwa3gzsZPT7ZGECnDvdiPQ+ARyhpWxPlWnr9JLfeAdS/43S8qNiTIdq3FeUb9HolOEj7h9H2LtgJPgHr0TZKx31Jy30C/T+g7aDCbpPiuj/fStrTNfQGioWIHr9z+z8iiAEfdg4zdo7Gex6JRCKRSCQSiUQikYrzL367HmLq8zV+yyYJIbOTzva5aJtH2y9CuYBebwdX4PoYyv107ELUe5PsPWBavzHJ3tMtFuhluTWnPxKJRCKRSCQy/TjQCKt/XX3y/+o6HPJs35XNszPO0WQf+FnQfsnpU+vLUN8MdgNyRtZ2Ncp7wBDYDn4D47MIOes0QpaADeDUWsYe5pql3k3IZd3iPp4H6bjnUI6Cf8B1PYQ0wWCPno5IJBKJnJx83eN2fi7NeYd0jKsvr+A7p3749KzkXd2Ap+9R7qfrflhz/ava45m2I7Rcw+lI3/WtAO+Bx5PsG6+nk+xbv7Q/fWe4gc7ZRPu3oNzK6Hktmfy2r036vc82On44yb4ZHKFzPkL5aZJ9f9hH7Y8y+nbheq9irWOpf0z/L8nUWPmL6TuK6/8Uuhpd6r3sRv8cbszZXZm981HOB5fS/itzdIlYyMzpTa85HYtRv422LTPQ/yjd+/SZudvCr1DcV5Iv6W+HFRXaB988Rte2ugJrHKTPW4vx5akK+MWzvoI++Sb9zvKFriy/m8wbwpxXQL/gDNs5Tb+zTPfiza6sHEa5A3w8jWLgM/j6BePvoOBcM33+v6Hj9zvuQ978lR5ihl/bedM0DvN4vwI+NOvy7/SbCkze51WVRfXaCaJEmdlSm+H4lKLsVE3Kvoe2950tZdcnu5T1rISQKuaHovZNZw26/aKxvn0tS6oUG1WWmbAPvtbGjzPU2WvgV4uoEc7PkQ77MhHoYu1K7YvOVhv7uuJ7/QpdLcKtX2ZPthc1A/tEcK/zbAW+/0rbnqRVAlPuk0gC5b5cv1Q+BbIp8kGnX2VjQmT7bLm/Hfp1RfZ3kAdpGZI3h2iMnZCC47ftj+351WJ06PTLxk6I7OxxWH8rd4RCRHHuKC1DbOaIdJyQAn4vuPpqS8d5HVJUfy+p2lXjihIbuya/L2wowkae3TJEZFfmjywnBshRSl9s9Je1v7z9kL7bPE9Fi+xMlf09Z3Ne2KxNFu8qf2x02ojMD9McrpOLivTX9j6F9l/HfmgbotKnfp9nJCHqffFho0hcxWRNhHTarUI8h94PGx28Pp2xrrZ8SehcFToPhvabvbZ5JkXx4etZd4lZfn0+pIz8oMoRunpsbPgUUZ4NaYu1qcr9vC+2MWsa8yHOPlOxfU7L9Fnkg0t+0dGdZ9O38PGr6nPxwzRWXUX0/JmSN09kU+WPyD8f4jM+ioo7lW1femzuv0iXqi5r8yGq/fBts+gca/M8+orLvOc0RJ7P88c0J/m2L/OFbzfVa5LrXc4WH2NsbJrulcsafa+T99lFVwgpwr7JMy47U3T0FiFF56uQuss4j3gfbOb68sUlB6vOjaLPtrbdkLp9nZmqffcpqnurk4NU+oq8rzIx2Xddv8tel+peydar+htBpIufH0J4O2XFCCu2z0GZayjyDMzLS6Z+yGK1Sjmk7RNbtq91zrXQfumeOb58MdGTtxdlngmyc09nTlmxqfMcmvij67OJXV3R3dOQsZznh6qfkOL80M3BuvtW1B7yY2R+FLG/MsnzVXd+aF9VuUk1xzWudPwy1edzz1x8t9UfyndbHTY2yxTdHOCa92zj3CR+Te6fjzX5Ftf9M/E1VC4yzVehROa77/h09cmXb6Zxm2c3pPjSH9bn/wE=", rT = {
  data: tT
};
var ju = 0, Lh = -3;
function Vi() {
  this.table = new Uint16Array(16), this.trans = new Uint16Array(288);
}
function nT(e, t) {
  this.source = e, this.sourceIndex = 0, this.tag = 0, this.bitcount = 0, this.dest = t, this.destLen = 0, this.ltree = new Vi(), this.dtree = new Vi();
}
var Fh = new Vi(), Rh = new Vi(), Hu = new Uint8Array(30), Uu = new Uint16Array(30), Oh = new Uint8Array(30), Ph = new Uint16Array(30), oT = new Uint8Array([
  16,
  17,
  18,
  0,
  8,
  7,
  9,
  6,
  10,
  5,
  11,
  4,
  12,
  3,
  13,
  2,
  14,
  1,
  15
]), Kp = new Vi(), Tn = new Uint8Array(320);
function Ih(e, t, r, n) {
  var o, a;
  for (o = 0; o < r; ++o) e[o] = 0;
  for (o = 0; o < 30 - r; ++o) e[o + r] = o / r | 0;
  for (a = n, o = 0; o < 30; ++o)
    t[o] = a, a += 1 << e[o];
}
function aT(e, t) {
  var r;
  for (r = 0; r < 7; ++r) e.table[r] = 0;
  for (e.table[7] = 24, e.table[8] = 152, e.table[9] = 112, r = 0; r < 24; ++r) e.trans[r] = 256 + r;
  for (r = 0; r < 144; ++r) e.trans[24 + r] = r;
  for (r = 0; r < 8; ++r) e.trans[168 + r] = 280 + r;
  for (r = 0; r < 112; ++r) e.trans[176 + r] = 144 + r;
  for (r = 0; r < 5; ++r) t.table[r] = 0;
  for (t.table[5] = 32, r = 0; r < 32; ++r) t.trans[r] = r;
}
var Zp = new Uint16Array(16);
function Pc(e, t, r, n) {
  var o, a;
  for (o = 0; o < 16; ++o) e.table[o] = 0;
  for (o = 0; o < n; ++o) e.table[t[r + o]]++;
  for (e.table[0] = 0, a = 0, o = 0; o < 16; ++o)
    Zp[o] = a, a += e.table[o];
  for (o = 0; o < n; ++o)
    t[r + o] && (e.trans[Zp[t[r + o]]++] = o);
}
function iT(e) {
  e.bitcount-- || (e.tag = e.source[e.sourceIndex++], e.bitcount = 7);
  var t = e.tag & 1;
  return e.tag >>>= 1, t;
}
function Dn(e, t, r) {
  if (!t)
    return r;
  for (; e.bitcount < 24; )
    e.tag |= e.source[e.sourceIndex++] << e.bitcount, e.bitcount += 8;
  var n = e.tag & 65535 >>> 16 - t;
  return e.tag >>>= t, e.bitcount -= t, n + r;
}
function mu(e, t) {
  for (; e.bitcount < 24; )
    e.tag |= e.source[e.sourceIndex++] << e.bitcount, e.bitcount += 8;
  var r = 0, n = 0, o = 0, a = e.tag;
  do
    n = 2 * n + (a & 1), a >>>= 1, ++o, r += t.table[o], n -= t.table[o];
  while (n >= 0);
  return e.tag = a, e.bitcount -= o, t.trans[r + n];
}
function sT(e, t, r) {
  var n, o, a, i, s, l;
  for (n = Dn(e, 5, 257), o = Dn(e, 5, 1), a = Dn(e, 4, 4), i = 0; i < 19; ++i) Tn[i] = 0;
  for (i = 0; i < a; ++i) {
    var c = Dn(e, 3, 0);
    Tn[oT[i]] = c;
  }
  for (Pc(Kp, Tn, 0, 19), s = 0; s < n + o; ) {
    var u = mu(e, Kp);
    switch (u) {
      case 16:
        var f = Tn[s - 1];
        for (l = Dn(e, 2, 3); l; --l)
          Tn[s++] = f;
        break;
      case 17:
        for (l = Dn(e, 3, 3); l; --l)
          Tn[s++] = 0;
        break;
      case 18:
        for (l = Dn(e, 7, 11); l; --l)
          Tn[s++] = 0;
        break;
      default:
        Tn[s++] = u;
        break;
    }
  }
  Pc(t, Tn, 0, n), Pc(r, Tn, n, o);
}
function Qp(e, t, r) {
  for (; ; ) {
    var n = mu(e, t);
    if (n === 256)
      return ju;
    if (n < 256)
      e.dest[e.destLen++] = n;
    else {
      var o, a, i, s;
      for (n -= 257, o = Dn(e, Hu[n], Uu[n]), a = mu(e, r), i = e.destLen - Dn(e, Oh[a], Ph[a]), s = i; s < i + o; ++s)
        e.dest[e.destLen++] = e.dest[s];
    }
  }
}
function lT(e) {
  for (var t, r, n; e.bitcount > 8; )
    e.sourceIndex--, e.bitcount -= 8;
  if (t = e.source[e.sourceIndex + 1], t = 256 * t + e.source[e.sourceIndex], r = e.source[e.sourceIndex + 3], r = 256 * r + e.source[e.sourceIndex + 2], t !== (~r & 65535))
    return Lh;
  for (e.sourceIndex += 4, n = t; n; --n)
    e.dest[e.destLen++] = e.source[e.sourceIndex++];
  return e.bitcount = 0, ju;
}
function cT(e, t) {
  var r = new nT(e, t), n, o, a;
  do {
    switch (n = iT(r), o = Dn(r, 2, 0), o) {
      case 0:
        a = lT(r);
        break;
      case 1:
        a = Qp(r, Fh, Rh);
        break;
      case 2:
        sT(r, r.ltree, r.dtree), a = Qp(r, r.ltree, r.dtree);
        break;
      default:
        a = Lh;
    }
    if (a !== ju)
      throw new Error("Data error");
  } while (!n);
  return r.destLen < r.dest.length ? typeof r.dest.slice == "function" ? r.dest.slice(0, r.destLen) : r.dest.subarray(0, r.destLen) : r.dest;
}
aT(Fh, Rh);
Ih(Hu, Uu, 4, 3);
Ih(Oh, Ph, 2, 1);
Hu[28] = 0;
Uu[28] = 258;
var uT = cT;
const fT = new Uint8Array(new Uint32Array([305419896]).buffer)[0] === 18, Jp = (e, t, r) => {
  let n = e[t];
  e[t] = e[r], e[r] = n;
}, dT = (e) => {
  const t = e.length;
  for (let r = 0; r < t; r += 4)
    Jp(e, r, r + 3), Jp(e, r + 1, r + 2);
}, pT = (e) => {
  fT && dT(e);
};
var hT = {
  swap32LE: pT
};
const e2 = uT, { swap32LE: mT } = hT, Vu = 11, Ho = 5, yT = Vu - Ho, bT = 65536 >> Vu, gT = 1 << yT, AT = gT - 1, As = 2, vT = 1 << Ho, Ic = vT - 1, Bh = 65536 >> Ho, wT = 1024 >> Ho, xT = Bh + wT, _T = xT, ET = 32, ST = _T + ET, kT = 1 << As;
let TT = class {
  constructor(t) {
    const r = typeof t.readUInt32BE == "function" && typeof t.slice == "function";
    if (r || t instanceof Uint8Array) {
      let n;
      if (r)
        this.highStart = t.readUInt32LE(0), this.errorValue = t.readUInt32LE(4), n = t.readUInt32LE(8), t = t.slice(12);
      else {
        const o = new DataView(t.buffer);
        this.highStart = o.getUint32(0, !0), this.errorValue = o.getUint32(4, !0), n = o.getUint32(8, !0), t = t.subarray(12);
      }
      t = e2(t, new Uint8Array(n)), t = e2(t, new Uint8Array(n)), mT(t), this.data = new Uint32Array(t.buffer);
    } else
      ({ data: this.data, highStart: this.highStart, errorValue: this.errorValue } = t);
  }
  get(t) {
    let r;
    return t < 0 || t > 1114111 ? this.errorValue : t < 55296 || t > 56319 && t <= 65535 ? (r = (this.data[t >> Ho] << As) + (t & Ic), this.data[r]) : t <= 65535 ? (r = (this.data[Bh + (t - 55296 >> Ho)] << As) + (t & Ic), this.data[r]) : t < this.highStart ? (r = this.data[ST - bT + (t >> Vu)], r = this.data[r + (t >> Ho & AT)], r = (r << As) + (t & Ic), this.data[r]) : this.data[this.data.length - kT];
  }
};
var DT = TT, Nh = { exports: {} };
(function(e, t) {
  (function(r, n) {
    e.exports = n();
  })(typeof self < "u" ? self : typeof window < "u" ? window : Ri, function() {
    var r = "3.8.1", n = r, o = typeof Buffer == "function", a = typeof TextDecoder == "function" ? new TextDecoder("utf-8", { ignoreBOM: !0 }) : void 0, i = typeof TextEncoder == "function" ? new TextEncoder() : void 0, s = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", l = Array.prototype.slice.call(s), c = function(_) {
      var J = {};
      return _.forEach(function(Le, at) {
        return J[Le] = at;
      }), J;
    }(l), u = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/, f = String.fromCharCode.bind(String), p = typeof Uint8Array.from == "function" ? Uint8Array.from.bind(Uint8Array) : function(_) {
      return new Uint8Array(Array.prototype.slice.call(_, 0));
    }, h = function(_) {
      return _.replace(/=/g, "").replace(/[+\/]/g, function(J) {
        return J == "+" ? "-" : "_";
      });
    }, m = function(_) {
      return _.replace(/[^A-Za-z0-9\+\/]/g, "");
    }, w = function(_) {
      for (var J, Le, at, Ft, St = "", Wt = _.length % 3, it = 0; it < _.length; ) {
        if ((Le = _.charCodeAt(it++)) > 255 || (at = _.charCodeAt(it++)) > 255 || (Ft = _.charCodeAt(it++)) > 255)
          throw new TypeError("invalid character found");
        J = Le << 16 | at << 8 | Ft, St += l[J >> 18 & 63] + l[J >> 12 & 63] + l[J >> 6 & 63] + l[J & 63];
      }
      return Wt ? St.slice(0, Wt - 3) + "===".substring(Wt) : St;
    }, A = typeof btoa == "function" ? function(_) {
      return btoa(_);
    } : o ? function(_) {
      if (/[^\x00-\xff]/.test(_))
        throw new TypeError("invalid character found");
      return Buffer.from(_, "binary").toString("base64");
    } : w, T = o ? function(_) {
      return Buffer.from(_).toString("base64");
    } : function(_) {
      for (var J = 4096, Le = [], at = 0, Ft = _.length; at < Ft; at += J)
        Le.push(f.apply(null, _.subarray(at, at + J)));
      return A(Le.join(""));
    }, B = function(_, J) {
      return J === void 0 && (J = !1), J ? h(T(_)) : T(_);
    }, N = function(_) {
      if (_.length < 2) {
        var J = _.charCodeAt(0);
        return J < 128 ? _ : J < 2048 ? f(192 | J >>> 6) + f(128 | J & 63) : f(224 | J >>> 12 & 15) + f(128 | J >>> 6 & 63) + f(128 | J & 63);
      } else {
        var J = 65536 + (_.charCodeAt(0) - 55296) * 1024 + (_.charCodeAt(1) - 56320);
        return f(240 | J >>> 18 & 7) + f(128 | J >>> 12 & 63) + f(128 | J >>> 6 & 63) + f(128 | J & 63);
      }
    }, Q = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g, O = function(_) {
      return _.replace(Q, N);
    }, M = o ? function(_) {
      return Buffer.from(_, "utf8").toString("base64");
    } : i ? function(_) {
      return T(i.encode(_));
    } : function(_) {
      return A(O(_));
    }, X = function(_, J) {
      return J === void 0 && (J = !1), J ? h(M(_)) : M(_);
    }, G = function(_) {
      return X(_, !0);
    }, oe = /[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/g, ue = function(_) {
      switch (_.length) {
        case 4:
          var J = (7 & _.charCodeAt(0)) << 18 | (63 & _.charCodeAt(1)) << 12 | (63 & _.charCodeAt(2)) << 6 | 63 & _.charCodeAt(3), Le = J - 65536;
          return f((Le >>> 10) + 55296) + f((Le & 1023) + 56320);
        case 3:
          return f((15 & _.charCodeAt(0)) << 12 | (63 & _.charCodeAt(1)) << 6 | 63 & _.charCodeAt(2));
        default:
          return f((31 & _.charCodeAt(0)) << 6 | 63 & _.charCodeAt(1));
      }
    }, K = function(_) {
      return _.replace(oe, ue);
    }, pe = function(_) {
      if (_ = _.replace(/\s+/g, ""), !u.test(_))
        throw new TypeError("malformed base64.");
      _ += "==".slice(2 - (_.length & 3));
      for (var J, Le, at, Ft = [], St = 0; St < _.length; )
        J = c[_.charAt(St++)] << 18 | c[_.charAt(St++)] << 12 | (Le = c[_.charAt(St++)]) << 6 | (at = c[_.charAt(St++)]), Le === 64 ? Ft.push(f(J >> 16 & 255)) : at === 64 ? Ft.push(f(J >> 16 & 255, J >> 8 & 255)) : Ft.push(f(J >> 16 & 255, J >> 8 & 255, J & 255));
      return Ft.join("");
    }, be = typeof atob == "function" ? function(_) {
      return atob(m(_));
    } : o ? function(_) {
      return Buffer.from(_, "base64").toString("binary");
    } : pe, Ce = o ? function(_) {
      return p(Buffer.from(_, "base64"));
    } : function(_) {
      return p(be(_).split("").map(function(J) {
        return J.charCodeAt(0);
      }));
    }, We = function(_) {
      return Ce(F(_));
    }, re = o ? function(_) {
      return Buffer.from(_, "base64").toString("utf8");
    } : a ? function(_) {
      return a.decode(Ce(_));
    } : function(_) {
      return K(be(_));
    }, F = function(_) {
      return m(_.replace(/[-_]/g, function(J) {
        return J == "-" ? "+" : "/";
      }));
    }, z = function(_) {
      return re(F(_));
    }, we = function(_) {
      if (typeof _ != "string")
        return !1;
      var J = _.replace(/\s+/g, "").replace(/={0,2}$/, "");
      return !/[^\s0-9a-zA-Z\+/]/.test(J) || !/[^\s0-9a-zA-Z\-_]/.test(J);
    }, Oe = function(_) {
      return {
        value: _,
        enumerable: !1,
        writable: !0,
        configurable: !0
      };
    }, ot = function() {
      var _ = function(J, Le) {
        return Object.defineProperty(String.prototype, J, Oe(Le));
      };
      _("fromBase64", function() {
        return z(this);
      }), _("toBase64", function(J) {
        return X(this, J);
      }), _("toBase64URI", function() {
        return X(this, !0);
      }), _("toBase64URL", function() {
        return X(this, !0);
      }), _("toUint8Array", function() {
        return We(this);
      });
    }, st = function() {
      var _ = function(J, Le) {
        return Object.defineProperty(Uint8Array.prototype, J, Oe(Le));
      };
      _("toBase64", function(J) {
        return B(this, J);
      }), _("toBase64URI", function() {
        return B(this, !0);
      }), _("toBase64URL", function() {
        return B(this, !0);
      });
    }, wt = function() {
      ot(), st();
    }, ae = {
      version: r,
      VERSION: n,
      atob: be,
      atobPolyfill: pe,
      btoa: A,
      btoaPolyfill: w,
      fromBase64: z,
      toBase64: X,
      encode: X,
      encodeURI: G,
      encodeURL: G,
      utob: O,
      btou: K,
      decode: z,
      isValid: we,
      fromUint8Array: B,
      toUint8Array: We,
      extendString: ot,
      extendUint8Array: st,
      extendBuiltins: wt
    };
    return ae.Base64 = {}, Object.keys(ae).forEach(function(_) {
      return ae.Base64[_] = ae[_];
    }), ae;
  });
})(Nh);
var MT = Nh.exports;
const It = Kk, CT = Qk.data, LT = eT.data, FT = rT.data, Wu = DT, Xu = MT.Base64, RT = new Wu(Xu.toUint8Array(CT)), OT = new Wu(Xu.toUint8Array(LT)), PT = new Wu(Xu.toUint8Array(FT));
function Kt(e, t) {
  return (e & t) !== 0;
}
function IT(e, t, r) {
  const n = t.length;
  for (let o = r; o + 1 < n; o++) {
    const a = t[o + 0], i = t[o + 1];
    switch (e.gb9c) {
      case 0:
        Kt(a, It.InCB_Consonant) && (e.gb9c = 1);
        break;
      case 1:
        Kt(a, It.InCB_Extend) ? e.gb9c = 1 : Kt(a, It.InCB_Linker) ? e.gb9c = 2 : e.gb9c = Kt(a, It.InCB_Consonant) ? 1 : 0;
        break;
      case 2:
        Kt(a, It.InCB_Extend | It.InCB_Linker) ? e.gb9c = 2 : e.gb9c = Kt(a, It.InCB_Consonant) ? 1 : 0;
        break;
    }
    switch (e.gb11) {
      case 0:
        Kt(a, It.Extended_Pictographic) && (e.gb11 = 1);
        break;
      case 1:
        Kt(a, It.Extend) ? e.gb11 = 1 : Kt(a, It.ZWJ) ? e.gb11 = 2 : e.gb11 = Kt(a, It.Extended_Pictographic) ? 1 : 0;
        break;
      case 2:
        e.gb11 = Kt(a, It.Extended_Pictographic) ? 1 : 0;
        break;
    }
    switch (e.gb12) {
      case 0:
        Kt(a, It.Regional_Indicator) ? e.gb12 = 1 : e.gb12 = -1;
        break;
      case 1:
        Kt(a, It.Regional_Indicator) ? e.gb12 = 0 : e.gb12 = -1;
        break;
    }
    switch (e.gb13) {
      case 0:
        Kt(a, It.Regional_Indicator) || (e.gb13 = 1);
        break;
      case 1:
        Kt(a, It.Regional_Indicator) ? e.gb13 = 2 : e.gb13 = 1;
        break;
      case 2:
        e.gb13 = 1;
        break;
    }
    if (!(Kt(a, It.CR) && Kt(i, It.LF))) {
      if (Kt(a, It.Control | It.CR | It.LF) || Kt(i, It.Control | It.CR | It.LF))
        return o + 1 - r;
      if (!(Kt(a, It.L) && Kt(i, It.L | It.V | It.LV | It.LVT)) && !(Kt(a, It.LV | It.V) && Kt(i, It.V | It.T)) && !(Kt(a, It.LVT | It.T) && Kt(i, It.T)) && !Kt(i, It.Extend | It.ZWJ) && !Kt(i, It.SpacingMark) && !Kt(a, It.Prepend) && !(Kt(i, It.InCB_Consonant) && e.gb9c === 2) && !(Kt(i, It.Extended_Pictographic) && e.gb11 === 2) && !(Kt(i, It.Regional_Indicator) && e.gb12 === 1) && !(Kt(i, It.Regional_Indicator) && e.gb13 === 2))
        return o + 1 - r;
    }
  }
  return n - r;
}
var BT = function(t) {
  const r = [], n = [0], o = [];
  for (let i = 0; i < t.length; ) {
    const s = t.codePointAt(i);
    o.push(RT.get(s) | OT.get(s) | PT.get(s)), i += s > 65535 ? 2 : 1, n.push(i);
  }
  const a = {
    gb9c: 0,
    gb11: 0,
    gb12: 0,
    gb13: 0
  };
  for (let i = 0; i < o.length; ) {
    const s = IT(a, o, i), l = n[i], c = n[i + s];
    r.push(t.slice(l, c)), i += s;
  }
  return r;
};
const NT = /* @__PURE__ */ Za(BT), GT = (e) => e.normalize("NFKD").split(""), t2 = /^\s+$/, r2 = /^[`~!@#$%^&*()\-=_+{}[\]\|\\;':",./<>?]+$/, yu = {
  insertOrder: "insertOrder",
  bestMatch: "bestMatch"
}, qT = {
  keySelector: (e) => e,
  threshold: 0.6,
  ignoreCase: !0,
  ignoreSymbols: !0,
  normalizeWhitespace: !0,
  returnMatchData: !1,
  useDamerau: !0,
  useSellers: !0,
  useSeparatedUnicode: !1,
  sortBy: yu.bestMatch
}, $T = () => {
}, zT = (e) => e instanceof Array ? e : [e];
function Gh(e, t) {
  const r = t.ignoreCase ? e.toLocaleLowerCase() : e, n = [], o = [];
  let a = !0, i = 0;
  const s = t.useSeparatedUnicode ? GT(r) : NT(r);
  for (const l of s)
    t2.lastIndex = 0, r2.lastIndex = 0, t.normalizeWhitespace && t2.test(l) ? a || (n.push(" "), o.push(i), a = !0) : t.ignoreSymbols && r2.test(l) || (t.useSeparatedUnicode ? n.push(l) : n.push(l.normalize()), o.push(i), a = !1), i += l.length;
  for (o.push(e.length); n[n.length - 1] === " "; )
    n.pop(), o.pop();
  return {
    original: e,
    normal: n,
    map: o
  };
}
function jT(e, t) {
  return {
    index: t[e.start],
    length: t[e.end + 1] - t[e.start]
  };
}
function qh(e, t) {
  if (t === 0)
    return {
      index: 0,
      length: 0
    };
  let r = t;
  for (let n = e.length - 2; n > 0 && r > 1; n--) {
    const o = e[n];
    r = o[r] < o[r - 1] ? r : r - 1;
  }
  return {
    start: r - 1,
    end: t - 1
  };
}
function HT() {
  return {
    start: 0,
    end: 0
  };
}
const UT = () => !0, VT = (e, t) => e < t;
function WT(e, t) {
  const r = new Array(e);
  for (let n = 0; n < e; n++)
    r[n] = new Array(t), r[n][0] = n;
  for (let n = 0; n < t; n++)
    r[0][n] = n;
  return r;
}
function XT(e, t) {
  const r = new Array(e);
  r[0] = new Array(t).fill(0);
  for (let n = 1; n < e; n++)
    r[n] = new Array(t), r[n][0] = n;
  return r;
}
function $h(e, t, r, n, o) {
  const a = r[n], i = r[n + 1], s = e[n] === t[o] ? 0 : 1;
  let l, c = i[o] + 1;
  (l = a[o + 1] + 1) < c && (c = l), (l = a[o] + s) < c && (c = l), i[o + 1] = c;
}
function zh(e, t, r, n) {
  for (let o = 0; o < e.length; o++)
    $h(e, t, r, o, n);
}
function YT(e, t, r, n) {
  if (n === 0) {
    zh(e, t, r, n);
    return;
  }
  e.length > 0 && $h(e, t, r, 0, n);
  for (let o = 1; o < e.length; o++) {
    const a = r[o - 1], i = r[o], s = r[o + 1], l = e[o] === t[n] ? 0 : 1;
    let c, u = s[n] + 1;
    (c = i[n + 1] + 1) < u && (u = c), (c = i[n] + l) < u && (u = c), e[o] === t[n - 1] && e[o - 1] === t[n] && (c = a[n - 1] + l) < u && (u = c), s[n + 1] = u;
  }
}
function KT(e, t, r) {
  let n = e;
  for (let o = 0; o < t.length; o++) {
    const a = t[o];
    n.children[a] == null && (n.children[a] = {
      children: {},
      candidates: [],
      depth: 0
    }), n.depth = Math.max(n.depth, t.length - o), n = n.children[a];
  }
  n.candidates.push(r);
}
function ZT(e, t, r, n) {
  for (const o of r) {
    const a = zT(n.keySelector(o)).map((i, s) => ({
      index: t,
      keyIndex: s,
      item: o,
      normalized: Gh(i, n)
    }));
    t++;
    for (const i of a)
      KT(e, i.normalized.normal, i);
  }
}
function QT(e, t) {
  const r = t.score - e.score;
  if (r !== 0)
    return r;
  const n = e.match.start - t.match.start;
  if (n !== 0)
    return n;
  const o = e.keyIndex - t.keyIndex;
  if (o !== 0)
    return o;
  const a = e.lengthDiff - t.lengthDiff;
  return a !== 0 ? a : jh(e, t);
}
function jh(e, t) {
  return e.index - t.index;
}
function JT(e) {
  switch (e) {
    case yu.bestMatch:
      return QT;
    case yu.insertOrder:
      return jh;
    default:
      throw new Error(`unknown sortBy method ${e}`);
  }
}
function Hh(e, t, r, n, o, a, i) {
  const s = {
    item: r.item,
    normalized: r.normalized,
    score: n,
    match: o,
    index: r.index,
    keyIndex: r.keyIndex,
    lengthDiff: a
  };
  t[r.index] == null ? (t[r.index] = e.length, e.push(s)) : i(s, e[t[r.index]]) < 0 && (e[t[r.index]] = s);
}
const eD = Math.max, tD = (e) => e;
function rD(e, t, r, n, o) {
  const a = t + o, i = Math.min(r.length, t + e.depth + 1), s = Math.ceil((a + i) / 2);
  return 1 - (s - i) / s >= n;
}
function nD(e, t, r, n, o, a) {
  return 1 - Math.min(o, a - (e.depth + 1)) / r.length >= n;
}
function oD(e, t, r, n, o, a, i) {
  const s = [];
  for (const c in e.children) {
    const u = e.children[c];
    s.push([u, 1, c, 0, t.length]);
  }
  const l = new Array(e.depth);
  for (; s.length !== 0; ) {
    const [c, u, f, p, h] = s.pop();
    l[u - 1] = f, r.score(t, l, n, u - 1);
    const m = u, w = n[n.length - 1][m];
    let A = p, T = h;
    if (r.shouldUpdateScore(w, h) && (A = m, T = w), c.candidates.length > 0) {
      const B = r.getLength(t.length, u), N = 1 - T / B;
      if (N >= i.threshold) {
        const Q = qh(n, A), O = Math.abs(u - t.length);
        for (const M of c.candidates)
          Hh(o, a, M, N, Q, O, r.compareItems);
      }
    }
    for (const B in c.children) {
      const N = c.children[B];
      r.shouldContinue(N, u, t, i.threshold, T, w) && s.push([N, u + 1, B, A, T]);
    }
  }
}
function aD(e, t, r) {
  const n = r.useSellers ? XT : WT, o = {
    score: r.useDamerau ? YT : zh,
    getLength: r.useSellers ? tD : eD,
    shouldUpdateScore: r.useSellers ? VT : UT,
    shouldContinue: r.useSellers ? nD : rD,
    walkBack: r.useSellers ? qh : HT,
    compareItems: JT(r.sortBy)
  }, a = {}, i = [], s = n(e.length + 1, t.depth + 1);
  if (r.threshold <= 0 || e.length === 0)
    for (const c of t.candidates)
      Hh(i, a, c, 0, {
        index: 0,
        length: 0
      }, e.length, o.compareItems);
  oD(t, e, o, s, i, a, r);
  const l = i.sort(o.compareItems);
  if (r.returnMatchData) {
    const c = r.useSellers ? jT : $T;
    return l.map((u) => ({
      item: u.item,
      original: u.normalized.original,
      key: u.normalized.normal.join(""),
      score: u.score,
      match: c(u.match, u.normalized.map)
    }));
  }
  return l.map((c) => c.item);
}
function iD(e, t, r) {
  r = {
    ...qT,
    ...r
  };
  const n = {
    children: {},
    candidates: [],
    depth: 0
  };
  return ZT(n, 0, t, r), aD(Gh(e, r).normal, n, r);
}
function sD({
  value: e,
  onChange: t,
  options: r,
  labels: n,
  labelizer: o,
  prefix: a = "",
  suffix: i = "",
  icons: s,
  theme: l,
  font: c,
  align: u = "center",
  disabled: f,
  invalid: p,
  inlinePosition: h,
  blockPosition: m,
  onFocus: w,
  onBlur: A,
  onConfirm: T,
  renderOption: B,
  className: N,
  ...Q
}) {
  const { themeStore: O } = xo(), M = me(null), X = me(null), G = me(null), oe = Jn(M), ue = _h(), K = Jo(O, (_e) => _e.inputHeight), [pe, be] = lt(!1), [Ce, We] = lt(!1), re = Yt(
    () => Gu({ options: r, labels: n, labelizer: o, prefix: a, suffix: i }),
    [o, n, r, a, i]
  ), [F, z] = lt(() => re(e)), [we, Oe] = lt(e), [ot, st] = lt(0), [wt, ae] = lt(6), [_, J] = lt({ up: !1, down: !1 }), Le = me(0), at = me(void 0), Ft = me(e);
  Ft.current = e;
  const St = Yt(
    () => F === "" || !Ce ? r : iD(
      F,
      r.map((_e) => ({ item: _e, label: re(_e) })),
      { keySelector: (_e) => _e.label }
    ).map((_e) => _e.item),
    [F, Ce, re, r]
  ), Wt = r.indexOf(e), it = Wt >= 0 ? s == null ? void 0 : s[Wt] : void 0, Ve = () => {
    var ut;
    const _e = ((ut = G.current) == null ? void 0 : ut.scrollHeight) ?? r.length * K + 4;
    st(_e), ae(
      Zg({
        triggerTop: oe.top,
        selectedIndex: r.indexOf(we),
        itemHeight: K,
        listHeight: _e,
        viewportHeight: ue.height
      })
    );
  }, pt = () => {
    const _e = G.current;
    if (!_e) return;
    const ut = _e.scrollHeight - _e.clientHeight > 2.5;
    J({
      up: ut && _e.scrollTop > 0.5,
      down: ut && _e.scrollTop + _e.clientHeight < _e.scrollHeight - 2.5
    });
  };
  Vt(() => {
    if (!pe) {
      z(re(e)), We(!1);
      return;
    }
    Oe(e), Le.current = performance.now(), Ve();
    const _e = requestAnimationFrame(() => {
      var b;
      Ve();
      const kt = (b = G.current) == null ? void 0 : b.querySelector("[data-current]");
      kt == null || kt.scrollIntoView({ block: "nearest" }), pt();
    }), ut = () => {
      var kt;
      performance.now() - Le.current > 500 ? (be(!1), T == null || T(), A == null || A()) : (kt = X.current) == null || kt.select();
    };
    return window.addEventListener("pointerup", ut), () => {
      cancelAnimationFrame(_e), window.removeEventListener("pointerup", ut);
    };
  }, [pe]), Vt(() => {
    pe || z(re(e));
  }, [re, pe, e]), Vt(() => {
    St.length && !St.includes(e) && (t == null || t(St[0]));
  }, [St]), Vt(
    () => () => {
      at.current !== void 0 && cancelAnimationFrame(at.current);
    },
    []
  );
  const bt = (_e) => {
    at.current !== void 0 && cancelAnimationFrame(at.current);
    const ut = () => {
      const kt = G.current;
      kt && (kt.scrollTop += _e * 8, pt(), at.current = requestAnimationFrame(ut));
    };
    at.current = requestAnimationFrame(ut);
  }, $t = () => {
    at.current !== void 0 && cancelAnimationFrame(at.current), at.current = void 0;
  }, br = (_e) => {
    const ut = Qg(St, e, _e);
    ut !== void 0 && (t == null || t(ut), requestAnimationFrame(
      () => {
        var kt, b;
        return (b = (kt = G.current) == null ? void 0 : kt.querySelector("[data-active]")) == null ? void 0 : b.scrollIntoView({ block: "nearest" });
      }
    ));
  }, Qt = Ce ? [oe.left - 2, oe.bottom] : [oe.left - 2, wt], ur = Math.min(
    ot ? ot + 2 : 1 / 0,
    ue.height - (Ce ? oe.bottom : wt) - 6
  );
  return /* @__PURE__ */ vt(
    "div",
    {
      ...Q,
      ref: M,
      className: N,
      align: u,
      "aria-disabled": f || void 0,
      "data-tq-component": "input-dropdown",
      "data-tq-open": pe ? "" : void 0,
      "data-tq-part": "root",
      children: [
        /* @__PURE__ */ j(
          zu,
          {
            ref: X,
            value: F,
            "data-tq-dropdown-field": "",
            "data-tq-hide-text": it && !Ce ? "" : void 0,
            theme: l,
            font: c,
            align: u,
            inlinePosition: h,
            blockPosition: m,
            disabled: f,
            invalid: p,
            onPointerDown: (_e) => {
              _e.isPrimary && be(!0);
            },
            onFocus: () => {
              be(!0), w == null || w();
            },
            onBlur: () => {
              pe || A == null || A();
            },
            onChange: (_e) => {
              z(_e), We(!0), be(!0);
            },
            onKeyDown: (_e) => {
              var ut;
              _e.key === "ArrowUp" || _e.key === "ArrowDown" ? (_e.preventDefault(), br(_e.key === "ArrowUp" ? -1 : 1)) : _e.key === "Enter" ? (_e.preventDefault(), pe ? (be(!1), T == null || T(), (ut = X.current) == null || ut.blur()) : be(!0)) : _e.key === "Escape" && (be(!1), t == null || t(we));
            }
          }
        ),
        it && !Ce && /* @__PURE__ */ vt(
          "div",
          {
            "data-tq-part": "value-display",
            "data-tq-numeric": c === "numeric" ? "" : void 0,
            children: [
              /* @__PURE__ */ j(yr, { "data-tq-part": "value-icon", icon: it }),
              /* @__PURE__ */ j("span", { "data-tq-part": "value-label", children: re(e) })
            ]
          }
        ),
        /* @__PURE__ */ j(yr, { "data-tq-part": "chevron", icon: "mdi:unfold-more-horizontal" }),
        /* @__PURE__ */ j(
          c0,
          {
            open: pe,
            reference: M.current,
            placement: Qt,
            lightDismiss: !1,
            onChangeOpen: (_e) => {
              !_e && pe && (be(!1), t == null || t(we));
            },
            children: /* @__PURE__ */ vt(
              "div",
              {
                "data-tq-component": "input-dropdown-list",
                "data-tq-part": "select-wrapper",
                style: { width: oe.width + 2 },
                children: [
                  /* @__PURE__ */ j(
                    "ul",
                    {
                      ref: G,
                      role: "listbox",
                      "data-tq-part": "listbox",
                      style: { maxHeight: ur },
                      font: c,
                      align: u,
                      onScroll: pt,
                      children: St.map((_e, ut) => /* @__PURE__ */ j(
                        "li",
                        {
                          role: "option",
                          "aria-selected": Object.is(_e, e),
                          "data-active": Object.is(_e, e) || void 0,
                          "data-current": Object.is(_e, we) || void 0,
                          "data-tq-option": "",
                          "data-tq-active": Object.is(_e, e) ? "" : void 0,
                          "data-tq-current": Object.is(_e, we) ? "" : void 0,
                          "data-tq-part": `option-${ut}`,
                          onPointerMove: () => t == null ? void 0 : t(_e),
                          onClick: () => {
                            t == null || t(_e), be(!1), T == null || T();
                          },
                          children: (B == null ? void 0 : B(_e, ut)) ?? /* @__PURE__ */ vt(An, { children: [
                            (s == null ? void 0 : s[r.indexOf(_e)]) && /* @__PURE__ */ j(yr, { icon: s[r.indexOf(_e)] }),
                            re(_e)
                          ] })
                        },
                        ut
                      ))
                    }
                  ),
                  _.up && /* @__PURE__ */ j(
                    "div",
                    {
                      "data-tq-part": "scroll-arrow",
                      "data-tq-direction": "top",
                      onPointerEnter: () => bt(-1),
                      onPointerLeave: $t,
                      children: /* @__PURE__ */ j(yr, { icon: "mdi:chevron-up" })
                    }
                  ),
                  _.down && /* @__PURE__ */ j(
                    "div",
                    {
                      "data-tq-part": "scroll-arrow",
                      "data-tq-direction": "bottom",
                      onPointerEnter: () => bt(1),
                      onPointerLeave: $t,
                      children: /* @__PURE__ */ j(yr, { icon: "mdi:chevron-down" })
                    }
                  )
                ]
              }
            )
          }
        )
      ]
    }
  );
}
const lD = Object.values(Nu), cD = s2(
  void 0
);
function Uh() {
  const e = i2(cD);
  return e || {
    presets: lD,
    colorSpace: "hsv",
    setColorSpace: () => {
    }
  };
}
const uD = ["rgb", "hsv", "hex"];
function fD({
  colorCode: e,
  onChangeColorCode: t,
  value: r,
  onChange: n,
  alpha: o = !0,
  disabled: a
}) {
  const { colorSpace: i, setColorSpace: s } = Uh(), l = Ji(r), c = (u, f) => n == null ? void 0 : n(Uo(r, u, f));
  return /* @__PURE__ */ vt(
    Sa,
    {
      component: "input-color-channel-values",
      "data-tq-part": "root",
      children: [
        /* @__PURE__ */ j(
          sD,
          {
            "data-tq-part": "color-space",
            theme: "minimal",
            disabled: a,
            value: i,
            onChange: s,
            options: uD,
            labelizer: (u) => u.toUpperCase()
          }
        ),
        i === "rgb" && /* @__PURE__ */ vt(Sa, { "data-tq-part": "channel", children: [
          /* @__PURE__ */ j(
            gn,
            {
              value: l.r * 255,
              min: 0,
              max: 255,
              precision: 0,
              bar: !1,
              disabled: a,
              onChange: (u) => c("r", u / 255)
            }
          ),
          /* @__PURE__ */ j(
            gn,
            {
              value: l.g * 255,
              min: 0,
              max: 255,
              precision: 0,
              bar: !1,
              disabled: a,
              onChange: (u) => c("g", u / 255)
            }
          ),
          /* @__PURE__ */ j(
            gn,
            {
              value: l.b * 255,
              min: 0,
              max: 255,
              precision: 0,
              bar: !1,
              disabled: a,
              onChange: (u) => c("b", u / 255)
            }
          ),
          o && /* @__PURE__ */ j(
            gn,
            {
              value: r.a * 100,
              min: 0,
              max: 100,
              precision: 0,
              bar: !1,
              disabled: a,
              suffix: "%",
              onChange: (u) => c("a", u / 100)
            }
          )
        ] }),
        i === "hsv" && /* @__PURE__ */ vt(Sa, { "data-tq-part": "channel", children: [
          /* @__PURE__ */ j(
            gn,
            {
              value: r.h * 360,
              min: 0,
              max: 360,
              precision: 0,
              bar: !1,
              disabled: a,
              suffix: "°",
              onChange: (u) => c("h", u / 360)
            }
          ),
          /* @__PURE__ */ j(
            gn,
            {
              value: r.s * 100,
              min: 0,
              max: 100,
              precision: 0,
              bar: !1,
              disabled: a,
              suffix: "%",
              onChange: (u) => c("s", u / 100)
            }
          ),
          /* @__PURE__ */ j(
            gn,
            {
              value: r.v * 100,
              min: 0,
              max: 100,
              precision: 0,
              bar: !1,
              disabled: a,
              suffix: "%",
              onChange: (u) => c("v", u / 100)
            }
          ),
          o && /* @__PURE__ */ j(
            gn,
            {
              value: r.a * 100,
              min: 0,
              max: 100,
              precision: 0,
              bar: !1,
              disabled: a,
              suffix: "%",
              onChange: (u) => c("a", u / 100)
            }
          )
        ] }),
        i === "hex" && /* @__PURE__ */ j(
          zu,
          {
            "data-tq-part": "channel",
            font: "monospace",
            value: e,
            validator: oh,
            disabled: a,
            onChange: t
          }
        )
      ]
    }
  );
}
function dD({
  presets: e = [],
  onChange: t,
  disabled: r,
  className: n,
  ...o
}) {
  const { presets: a } = Uh(), i = [...a, ...e];
  return /* @__PURE__ */ j(
    "div",
    {
      ...o,
      className: n,
      "data-tq-component": "input-color-presets",
      "data-tq-part": "presets",
      children: i.map((s, l) => /* @__PURE__ */ j(
        "button",
        {
          type: "button",
          disabled: r,
          "aria-label": `Use ${s}`,
          "data-tq-part": `preset-${l}`,
          style: { background: s },
          onClick: () => t == null ? void 0 : t(s)
        },
        `${s}-${l}`
      ))
    }
  );
}
function pD({
  value: e,
  onChange: t,
  onConfirm: r,
  alpha: n = !0,
  pickers: o = Wg,
  presets: a,
  disabled: i,
  className: s,
  ...l
}) {
  const [, c] = lt(), u = Yt(
    () => Xg(e),
    []
  );
  u.setCallbacks({ onChange: t, onUpdate: c });
  const f = u.value;
  Vt(() => {
    u.sync(e);
  }, [u, e]);
  const p = typeof window > "u" ? void 0 : window.EyeDropper;
  return /* @__PURE__ */ vt(
    "div",
    {
      ...l,
      className: s,
      "data-tq-component": "input-color-picker",
      "data-tq-part": "picker",
      children: [
        o.map((h, m) => h[0] === "pad" ? /* @__PURE__ */ j(
          Xk,
          {
            value: f,
            axes: h[1],
            disabled: i,
            onChange: u.updateHSVA
          },
          m
        ) : h[0] === "slider" ? !n && h[1] === "a" ? null : /* @__PURE__ */ j(
          Yk,
          {
            value: f,
            axis: h[1],
            disabled: i,
            onChange: u.updateHSVA
          },
          m
        ) : h[0] === "values" ? /* @__PURE__ */ j(
          fD,
          {
            colorCode: e,
            value: f,
            alpha: n,
            disabled: i,
            onChange: u.updateHSVA,
            onChangeColorCode: u.updateCode
          },
          m
        ) : null),
        /* @__PURE__ */ j(
          dD,
          {
            presets: a,
            disabled: i,
            onChange: (h) => {
              u.updateCode(h), r == null || r();
            }
          }
        ),
        p && /* @__PURE__ */ j(
          "button",
          {
            type: "button",
            disabled: i,
            "aria-label": "Pick a color from the screen",
            "data-tq-part": "eye-dropper",
            onClick: async () => {
              try {
                const h = await new p().open();
                u.updateCode(h.sRGBHex), r == null || r();
              } catch (h) {
                if (h instanceof DOMException && h.name === "AbortError") return;
                throw h;
              }
            },
            children: /* @__PURE__ */ j(yr, { icon: "material-symbols:colorize" })
          }
        )
      ]
    }
  );
}
const hD = [
  "Shift",
  "Meta",
  "Control",
  "Alt",
  "h",
  "f",
  "a",
  "s",
  "v",
  "r",
  "g",
  "b"
], mD = {};
function yD({
  value: e,
  onChange: t,
  alpha: r = !0,
  pickers: n,
  presets: o,
  onChangeTweaking: a,
  onFocus: i,
  onBlur: s,
  onConfirm: l,
  inlinePosition: c,
  blockPosition: u,
  disabled: f,
  invalid: p,
  children: h,
  className: m,
  ...w
}) {
  const { themeStore: A } = xo(), T = me(null), B = me(null), [N, Q] = lt(!1), [O, M] = lt(!1), [X, G] = lt(() => No(e)), [oe, ue] = lt(!1), [K, pe] = lt(!1), [be, Ce] = lt(!1), We = me(void 0), re = Jo(A), F = l0(hD), z = F.Shift || F.h || F.f ? "h" : F.s ? "s" : F.v ? "v" : F.r ? "r" : F.g ? "g" : F.b ? "b" : r && (F.Alt || F.a) ? "a" : "pad", we = me(X);
  we.current = X;
  const Oe = me(e);
  Oe.current = e;
  const ot = me(z);
  ot.current = z;
  const st = me(null), wt = me({
    onChange: t,
    onChangeTweaking: a,
    onFocus: i,
    onBlur: s,
    onConfirm: l
  });
  wt.current = { onChange: t, onChangeTweaking: a, onFocus: i, onBlur: s, onConfirm: l };
  const ae = me(null), _ = re.popupWidth, J = Yt(
    () => ({
      lockPointer: !0,
      disabled: () => f ?? !1,
      onClick: () => {
        var _e;
        (_e = ae.current) != null && _e.multiSelected || Q((ut) => !ut);
      },
      onDragStart: () => {
        var ut, kt, b;
        const _e = No(Oe.current);
        we.current = _e, G(_e), st.current = _e, (ut = ae.current) == null || ut.capture(), (b = (kt = wt.current).onChangeTweaking) == null || b.call(kt, !0);
      },
      onDrag: ({ delta: _e }) => {
        var Be, E, V;
        const [ut, kt] = [_e[0] / _, _e[1] / -_], b = ot.current, R = st.current;
        if (!R) return;
        const le = Yg(
          we.current,
          R,
          b,
          ut,
          kt
        ), ie = le.value;
        (Be = ae.current) == null || Be.update(le.updateRelated), we.current = ie, G(ie), (V = (E = wt.current).onChange) == null || V.call(E, Ea(ie));
      },
      onDragEnd: () => {
        var _e, ut, kt, b, R;
        (ut = (_e = wt.current).onConfirm) == null || ut.call(_e), (kt = ae.current) == null || kt.confirm(), (R = (b = wt.current).onChangeTweaking) == null || R.call(b, !1);
      }
    }),
    [f, _]
  ), Le = Pn(T, J), at = Ja({
    type: "color",
    getElement: () => T.current,
    getValue: () => we.current,
    setValue: (_e) => {
      var ut, kt;
      we.current = _e, G(_e), (kt = (ut = wt.current).onChange) == null || kt.call(ut, Ea(_e));
    },
    confirm: () => {
      var _e, ut;
      return (ut = (_e = wt.current).onConfirm) == null ? void 0 : ut.call(_e);
    }
  });
  ae.current = at, Vt(() => {
    if (!Le.dragging) {
      const _e = No(e);
      we.current = _e, G(_e);
    }
  }, [Le.dragging, e]), Vt(() => {
    Le.dragging && Q(!1);
  }, [Le.dragging]), Vt(() => {
    if (Le.dragging) {
      pe(!0), Ce(!1);
      return;
    }
    if (!K) return;
    Ce(!0);
    const _e = window.setTimeout(() => {
      pe(!1), Ce(!1);
    }, 200);
    return () => window.clearTimeout(_e);
  }, [Le.dragging, K]), Vt(
    () => () => {
      window.clearTimeout(We.current);
    },
    []
  ), Vt(() => {
    !Le.dragging || !st.current || (st.current = we.current, at.capture());
  }, [z]), Vt(() => {
    at.multiSelected && Q(!1);
  }, [at.multiSelected]), Mr(
    T,
    "wheel",
    (_e) => {
      var ut, kt;
      if (Le.dragging && st.current) {
        _e.preventDefault(), _e.stopPropagation();
        const b = Xn(
          we.current,
          "h",
          _e.deltaY / 360 * 0.5
        );
        we.current = b, G(b), (kt = (ut = wt.current).onChange) == null || kt.call(ut, Ea(b));
        const R = b.h - st.current.h;
        at.update((le) => Xn(le, "h", R));
      }
      Le.dragging && (ue(!0), window.clearTimeout(We.current), We.current = window.setTimeout(
        () => ue(!1),
        500
      ));
    },
    { passive: !1 }
  ), sh({
    target: T,
    onCopy: () => void navigator.clipboard.writeText(Oe.current),
    onPaste: () => {
      navigator.clipboard.readText().then((_e) => {
        var kt, b;
        if (!_e) return;
        const ut = No(_e);
        (b = (kt = wt.current).onChange) == null || b.call(kt, _e), at.update(() => ut), at.confirm();
      });
    }
  });
  const Ft = !O && (F.Shift || F.Meta || F.Control), St = Bt.valid(e) ? e : "black", Wt = Ji(X), it = z === "h" ? [["Hue", `${(X.h * 360).toFixed(1)}°`]] : z === "s" || z === "v" || z === "a" ? [
    [
      z === "s" ? "Sat" : z === "v" ? "Val" : "α",
      `${(X[z] * 100).toFixed(1)}%`
    ]
  ] : z === "r" || z === "g" || z === "b" ? [[z.toUpperCase(), (Wt[z] * 255).toFixed(0), !0]] : [
    ["Sat", `${(X.s * 100).toFixed(1)}%`],
    ["Val", `${(X.v * 100).toFixed(1)}%`]
  ], Ve = Et.contrastWCAG21(St, re.backgroundColor), pt = {
    color: St,
    "--outline": Ve > 1.1 ? "transparent" : "var(--tq-color-border)"
  }, bt = { left: Le.origin[0], top: Le.origin[1] }, $t = Yt(
    () => ({
      // The S/V axes replace those channels in the shader. Only hue/alpha
      // change the palette itself while an ordinary pad drag is in progress.
      hsva: [X.h, 0, 0, X.a],
      axes: [Mi("s"), Mi("v")]
    }),
    [X.a, X.h]
  ), br = Yt(
    () => ({
      hsva: [X.h, X.s, X.v, X.a],
      axis: Mi(z === "pad" ? "s" : z),
      offset: 0
    }),
    [X, z]
  ), Qt = z === "pad" ? 0.5 : $o(X, z), ur = z === "v" ? [0, -(Qt - 0.5) * _] : [-(Qt - 0.5) * _, 0];
  return /* @__PURE__ */ vt(An, { children: [
    /* @__PURE__ */ j(
      "button",
      {
        ...w,
        ref: T,
        type: w.type ?? "button",
        disabled: f,
        "aria-invalid": p || void 0,
        className: m,
        "data-tq-component": "input-color-pad",
        "data-tq-focus": N && Ft || at.subfocus ? "" : void 0,
        "data-tq-tweaking": Le.dragging ? "" : void 0,
        onFocus: () => {
          at.setFocusing(!0), i == null || i();
        },
        onBlur: () => {
          at.setFocusing(!1), s == null || s();
        },
        children: h ?? /* @__PURE__ */ j(
          "div",
          {
            style: pt,
            "inline-position": c,
            "block-position": u,
            "data-tq-part": "swatch"
          }
        )
      }
    ),
    /* @__PURE__ */ j(
      c0,
      {
        open: N && !Ft,
        reference: T.current,
        placement: "bottom-start",
        onChangeOpen: Q,
        children: /* @__PURE__ */ j(
          "div",
          {
            ref: B,
            "data-tq-component": "input-color-pad-popover",
            "data-tq-part": "floating",
            onFocusCapture: () => M(!0),
            onBlurCapture: (_e) => {
              _e.currentTarget.contains(_e.relatedTarget) || M(!1);
            },
            children: /* @__PURE__ */ j(
              pD,
              {
                value: e,
                onChange: t,
                onConfirm: l,
                alpha: r,
                pickers: n,
                presets: o
              }
            )
          }
        )
      }
    ),
    (Le.dragging || K) && /* @__PURE__ */ j($u, { children: /* @__PURE__ */ vt(
      "div",
      {
        className: be ? "tq-input-color-pad-overlay-hidden" : void 0,
        style: { transformOrigin: `${Le.origin[0]}px ${Le.origin[1]}px` },
        "data-tq-component": "input-color-pad-overlay",
        "data-tq-tweak-mode": z,
        "data-tq-part": "overlay",
        onTransitionEnd: (_e) => {
          be && _e.target === _e.currentTarget && (pe(!1), Ce(!1));
        },
        children: [
          (z === "pad" || z === "h" || z === "s" || z === "v") && /* @__PURE__ */ vt(An, { children: [
            /* @__PURE__ */ j(
              Pi,
              {
                "data-tq-part": "overlay-pad",
                fragmentString: Mh,
                uniforms: $t,
                style: {
                  opacity: z === "pad" ? 1 : 0.1,
                  left: Le.origin[0] - X.s * _,
                  top: Le.origin[1] - (1 - X.v) * _
                }
              }
            ),
            /* @__PURE__ */ j(
              Pi,
              {
                "data-tq-part": "wheel",
                fragmentString: Vk,
                uniforms: mD,
                style: {
                  ...bt,
                  opacity: z === "h" || oe ? 1 : 0.1,
                  rotate: `${X.h * -360}deg`
                }
              }
            )
          ] }),
          z !== "pad" && z !== "h" && /* @__PURE__ */ j(
            Pi,
            {
              "data-tq-part": "slider",
              "data-tq-vertical": z === "v" ? "" : void 0,
              fragmentString: Ch,
              uniforms: br,
              style: {
                left: Le.origin[0] + ur[0],
                top: Le.origin[1] - ur[1]
              }
            }
          ),
          /* @__PURE__ */ j(
            "div",
            {
              "data-tq-part": "tweak-preview",
              style: {
                ...bt,
                color: z === "a" ? St : Bt(St).alpha(1).css()
              }
            }
          ),
          /* @__PURE__ */ j(el, { "data-tq-part": "overlay-label", style: bt, children: it.map(([_e, ut, kt]) => /* @__PURE__ */ vt("span", { "data-tq-part": "label-pair", children: [
            /* @__PURE__ */ j("label", { children: _e }),
            " ",
            /* @__PURE__ */ j(
              "span",
              {
                "data-tq-part": "label-value",
                "data-tq-rgb": kt ? "" : void 0,
                children: ut
              }
            )
          ] }, _e)) })
        ]
      }
    ) })
  ] });
}
function OD({
  value: e,
  onChange: t,
  alpha: r = !0,
  pickers: n,
  presets: o,
  disabled: a,
  invalid: i,
  inlinePosition: s,
  blockPosition: l,
  onFocus: c,
  onBlur: u,
  onConfirm: f,
  className: p,
  ...h
}) {
  const { themeStore: m } = xo(), w = me(null), { width: A } = Jn(w), T = Jo(m, (G) => G.inputHeight), [B, N] = lt(!1), Q = Bt.valid(e) ? Bt(e) : Bt("black"), O = Q.alpha(1).hex(), M = Q.alpha() * 100, X = A > T * 3.5;
  return /* @__PURE__ */ vt(
    Sa,
    {
      ...h,
      ref: w,
      className: p,
      component: "input-color",
      "data-inline-position": s,
      "data-block-position": l,
      "data-tq-part": "root",
      children: [
        /* @__PURE__ */ j(
          yD,
          {
            "data-tq-layout": X ? void 0 : "only-pad",
            "data-tq-part": "pad",
            value: e,
            onChange: t,
            alpha: r,
            pickers: n,
            presets: o,
            disabled: a,
            invalid: i,
            onChangeTweaking: N,
            onFocus: c,
            onBlur: u,
            onConfirm: f
          }
        ),
        X && /* @__PURE__ */ j(
          zu,
          {
            "data-tq-pad-tweaking": B ? "" : void 0,
            "data-tq-part": "color-code",
            font: "monospace",
            value: O,
            validator: oh,
            disabled: a,
            invalid: i,
            onChange: (G) => {
              const oe = Bt(G);
              t == null || t(
                oe.alpha() * 100 !== M ? G : oe.alpha(M / 100).hex()
              );
            },
            onFocus: c,
            onBlur: u,
            onConfirm: f
          }
        ),
        r && X && /* @__PURE__ */ j(
          gn,
          {
            "data-tq-part": "alpha",
            value: M,
            min: 0,
            max: 100,
            suffix: "%",
            disabled: a,
            invalid: i,
            onChange: (G) => t == null ? void 0 : t(Q.alpha(G / 100).hex()),
            onFocus: c,
            onBlur: u,
            onConfirm: f
          }
        )
      ]
    }
  );
}
function bD({
  value: e,
  onChange: t,
  onConfirm: r,
  disabled: n,
  className: o,
  ...a
}) {
  const i = me(null), s = me(null), l = me({ value: e, onChange: t, onConfirm: r });
  l.current = { value: e, onChange: t, onConfirm: r };
  const c = Yt(
    () => ({
      disabled: () => !!n,
      dragDelaySeconds: 0,
      onDrag: ({
        xy: m,
        left: w,
        right: A,
        top: T,
        bottom: B
      }) => {
        var M, X;
        const N = s.current;
        if (N === null) return;
        const Q = (m[0] - w) / (A - w), O = (B - m[1]) / (B - T);
        (X = (M = l.current).onChange) == null || X.call(
          M,
          Kg(l.current.value, N, Q, O)
        );
      },
      onDragEnd: () => {
        var m, w;
        s.current = null, (w = (m = l.current).onConfirm) == null || w.call(m);
      }
    }),
    [n]
  );
  Pn(i, c);
  const [u, f, p, h] = e;
  return /* @__PURE__ */ j(
    "div",
    {
      ...a,
      className: o,
      "data-tq-component": "input-cubic-bezier-picker",
      "data-tq-part": "picker",
      children: /* @__PURE__ */ j(
        "svg",
        {
          ref: i,
          viewBox: "0 0 1 1",
          "data-tq-part": "pad",
          children: /* @__PURE__ */ vt("g", { children: [
            /* @__PURE__ */ j("line", { x1: 0, y1: 0, x2: u, y2: f }),
            /* @__PURE__ */ j("line", { x1: 1, y1: 1, x2: p, y2: h }),
            /* @__PURE__ */ j("path", { d: G2(e) }),
            /* @__PURE__ */ j(
              "circle",
              {
                cx: u,
                cy: f,
                r: ".035",
                onPointerDown: () => s.current = 0,
                "data-tq-part": "handle-0"
              }
            ),
            /* @__PURE__ */ j(
              "circle",
              {
                cx: p,
                cy: h,
                r: ".035",
                onPointerDown: () => s.current = 1,
                "data-tq-part": "handle-1"
              }
            )
          ] })
        }
      )
    }
  );
}
function PD({
  value: e,
  onChange: t,
  onConfirm: r,
  disabled: n,
  invalid: o,
  inlinePosition: a,
  blockPosition: i,
  className: s,
  ...l
}) {
  const [c, u] = lt(null), [f, p] = lt(!1);
  return /* @__PURE__ */ vt(An, { children: [
    /* @__PURE__ */ j(
      "button",
      {
        ...l,
        ref: u,
        type: l.type ?? "button",
        disabled: n,
        "aria-invalid": o || void 0,
        "aria-expanded": f,
        className: s,
        "data-inline-position": a,
        "data-block-position": i,
        "data-tq-component": "input-cubic-bezier",
        "data-tq-open": f ? "" : void 0,
        "data-tq-part": "root",
        onClick: () => p(!0),
        children: /* @__PURE__ */ j(
          "svg",
          {
            viewBox: "0 0 1 1",
            "aria-hidden": "true",
            "data-tq-part": "icon",
            children: /* @__PURE__ */ j("path", { d: G2(e), "data-tq-part": "path" })
          }
        )
      }
    ),
    /* @__PURE__ */ j(c0, { open: f, reference: c, onChangeOpen: p, children: /* @__PURE__ */ j(
      "div",
      {
        "data-tq-component": "input-cubic-bezier-floating",
        "data-tq-part": "floating",
        children: /* @__PURE__ */ j(
          bD,
          {
            value: e,
            onChange: t,
            onConfirm: r,
            disabled: n
          }
        )
      }
    ) })
  ] });
}
function ID({
  value: e,
  onChange: t,
  generate: r,
  icon: n,
  className: o,
  onClick: a,
  ...i
}) {
  const [s, l] = lt(0), [c, u] = lt(3);
  return /* @__PURE__ */ j(
    "button",
    {
      ...i,
      className: o,
      "data-tq-component": "input-shuffle",
      "data-tq-part": "root",
      onClick: (f) => {
        a == null || a(f), !f.defaultPrevented && (l((p) => p + 90), u(Math.floor(Math.random() * 6) + 1), t == null || t(r(e)));
      },
      children: n ? /* @__PURE__ */ j(
        yr,
        {
          icon: n,
          "data-tq-part": "icon",
          style: { transform: `rotate(${s}deg)` }
        }
      ) : /* @__PURE__ */ j(gD, { face: c, rotation: s })
    }
  );
}
function gD({ face: e, rotation: t }) {
  const r = {
    1: [[16, 16]],
    2: [
      [11, 21],
      [21, 11]
    ],
    3: [
      [16, 16],
      [10, 22],
      [22, 10]
    ],
    4: [
      [10, 22],
      [22, 10],
      [10, 10],
      [22, 22]
    ],
    5: [
      [16, 16],
      [10, 22],
      [22, 10],
      [10, 10],
      [22, 22]
    ],
    6: [
      [10, 10],
      [10, 16],
      [10, 22],
      [22, 10],
      [22, 16],
      [22, 22]
    ]
  };
  return /* @__PURE__ */ vt(
    Sh,
    {
      mode: "block",
      "data-tq-part": "icon",
      style: { transform: `rotate(${t}deg)` },
      children: [
        r[e].map(([n, o]) => /* @__PURE__ */ j("circle", { cx: n, cy: o, r: "1" }, `${n}-${o}`)),
        /* @__PURE__ */ j("path", { d: "M24,29H8c-2.8,0-5-2.2-5-5V8c0-2.8,2.2-5,5-5h16c2.8,0,5,2.2,5,5v16C29,26.8,26.8,29,24,29z" })
      ]
    }
  );
}
const BD = Yo(
  function({
    inlinePosition: t,
    blockPosition: r,
    invalid: n,
    icon: o,
    label: a,
    chevron: i = !1,
    tooltip: s,
    blink: l = !1,
    subtle: c = !1,
    narrow: u = !1,
    className: f,
    onMouseDown: p,
    ...h
  }, m) {
    const w = me(null), A = me(null), [T, B] = lt(!1), { flashing: N, flash: Q } = Fk(), O = () => {
      const M = A.current;
      B(
        !!(M && M.scrollWidth > M.clientWidth + 0.5)
      );
    };
    return Qo(A, O), Yr(O, [a]), kh(w, s ?? (T ? a : void 0)), Ha(
      m,
      () => ({ flash: Q, getElement: () => w.current }),
      [Q]
    ), /* @__PURE__ */ vt(
      "button",
      {
        ...h,
        ref: w,
        className: f,
        "inline-position": t,
        "block-position": r,
        "aria-invalid": n || void 0,
        "data-tq-component": "input-button",
        "data-blink": l || void 0,
        "data-subtle": c || void 0,
        "data-narrow": u || void 0,
        "data-flashing": N || void 0,
        "data-tq-part": "root",
        onMouseDown: (M) => {
          p == null || p(M), M.defaultPrevented || M.preventDefault();
        },
        children: [
          o && /* @__PURE__ */ j(yr, { icon: o, "data-tq-part": "icon" }),
          a && /* @__PURE__ */ j("span", { ref: A, "data-tq-part": "label", children: a }),
          i && /* @__PURE__ */ j("span", { "data-tq-part": "chevron", children: /* @__PURE__ */ j(yr, { icon: "mdi:chevron-down" }) })
        ]
      }
    );
  }
);
function ND({
  value: e,
  onChange: t,
  icon: r,
  label: n,
  inlinePosition: o,
  blockPosition: a,
  disabled: i,
  invalid: s,
  className: l,
  onMouseDown: c,
  onClick: u,
  ...f
}) {
  return /* @__PURE__ */ vt(
    "button",
    {
      ...f,
      className: l,
      "inline-position": o,
      "block-position": a,
      disabled: !!i,
      "aria-invalid": s || void 0,
      "aria-pressed": e,
      "data-tq-component": "input-button-toggle",
      "data-tq-part": "root",
      onMouseDown: (p) => {
        c == null || c(p), p.defaultPrevented || p.preventDefault();
      },
      onClick: (p) => {
        u == null || u(p), p.defaultPrevented || t == null || t(!e);
      },
      children: [
        r && /* @__PURE__ */ j(yr, { icon: r, "data-tq-part": "icon" }),
        n && /* @__PURE__ */ j("span", { "data-tq-part": "label", children: n })
      ]
    }
  );
}
function Vh({
  track: e,
  input: t,
  value: r,
  onChange: n,
  disabled: o = !1,
  onFocus: a,
  onBlur: i,
  onConfirm: s
}) {
  const [l, c] = lt(null), u = me(r);
  u.current = r;
  const f = me({ onChange: n, onFocus: a, onBlur: i, onConfirm: s, disabled: o });
  f.current = { onChange: n, onFocus: a, onBlur: i, onConfirm: s, disabled: o };
  const p = Ja({
    type: "boolean",
    getElement: () => e.current,
    getValue: () => u.current,
    setValue: (Q) => {
      var O, M;
      return (M = (O = f.current).onChange) == null ? void 0 : M.call(O, !!Q);
    },
    confirm: () => {
      var Q, O;
      return (O = (Q = f.current).onConfirm) == null ? void 0 : O.call(Q);
    }
  }), h = me(p);
  h.current = p;
  const m = me(!1), w = Yt(
    () => ({
      disabled: () => f.current.disabled,
      dragDelaySeconds: 0.2,
      onClick() {
        var O, M, X, G, oe;
        const Q = h.current;
        if (!Q.readyToBeSelected) {
          const ue = !u.current;
          (M = (O = f.current).onChange) == null || M.call(O, ue), Q.update((K) => !K);
        }
        (G = (X = f.current).onConfirm) == null || G.call(X), (oe = t.current) == null || oe.focus();
      },
      onDragStart() {
        var Q, O;
        m.current = u.current, c(!m.current), (O = (Q = f.current).onFocus) == null || O.call(Q);
      },
      onDrag(Q) {
        var M, X;
        const O = N6({
          dragging: Q.dragging,
          initialX: Q.initial[0],
          currentX: Q.xy[0],
          valueOnTweak: m.current
        });
        O !== null && (c(O), (X = (M = f.current).onChange) == null || X.call(M, O), h.current.update(() => O));
      },
      onDragEnd() {
        var Q, O, M;
        c(null), (O = (Q = f.current).onConfirm) == null || O.call(Q), (M = t.current) == null || M.focus();
      }
    }),
    [t]
  );
  Pn(e, w);
  const A = (Q) => {
    var M, X, G, oe;
    const O = G6(Q.key, u.current);
    O !== void 0 && (Q.preventDefault(), Q.stopPropagation(), (X = (M = f.current).onChange) == null || X.call(M, O), (oe = (G = f.current).onConfirm) == null || oe.call(G));
  }, T = (Q) => {
    var O, M, X, G;
    (M = (O = f.current).onChange) == null || M.call(O, Q.currentTarget.checked), (G = (X = f.current).onConfirm) == null || G.call(X);
  }, B = (Q) => {
    var O, M;
    h.current.setFocusing(!0), Q.relatedTarget !== null && ((M = (O = f.current).onFocus) == null || M.call(O));
  }, N = () => {
    var Q, O;
    h.current.setFocusing(!1), (O = (Q = f.current).onBlur) == null || O.call(Q);
  };
  return {
    tweakingValue: l,
    subfocus: p.subfocus,
    onKeyDown: A,
    onChangeInput: T,
    onFocusInput: B,
    onBlurInput: N
  };
}
function GD({
  value: e,
  onChange: t,
  label: r,
  disabled: n,
  invalid: o,
  onFocus: a,
  onBlur: i,
  onConfirm: s,
  inlinePosition: l,
  blockPosition: c,
  className: u,
  ...f
}) {
  const p = Ns(), h = me(null), m = me(null), w = Vh({
    track: h,
    input: m,
    value: e,
    onChange: t,
    disabled: n,
    onFocus: a,
    onBlur: i,
    onConfirm: s
  });
  return /* @__PURE__ */ vt(
    "div",
    {
      ...f,
      className: u,
      "aria-invalid": o || void 0,
      "data-tq-component": "input-switch",
      "data-tq-part": "root",
      children: [
        /* @__PURE__ */ vt(
          "div",
          {
            ref: h,
            "inline-position": l,
            "block-position": c,
            "data-subfocus": w.subfocus || void 0,
            "data-tq-part": "track",
            children: [
              /* @__PURE__ */ j(
                "input",
                {
                  id: p,
                  ref: m,
                  checked: e,
                  disabled: n,
                  "data-tq-part": "input",
                  type: "checkbox",
                  onChange: w.onChangeInput,
                  onKeyDown: w.onKeyDown,
                  onFocus: w.onFocusInput,
                  onBlur: w.onBlurInput
                }
              ),
              /* @__PURE__ */ j(
                "div",
                {
                  "data-tweaking": w.tweakingValue !== null || void 0,
                  "data-tq-part": "handle"
                }
              )
            ]
          }
        ),
        r && /* @__PURE__ */ j("label", { htmlFor: p, "data-tq-part": "label", children: r })
      ]
    }
  );
}
function AD({ value: e }) {
  const [t, r] = lt(e !== null), [n, o] = lt(e ?? !1), [a, i] = lt(!1);
  if (Vt(() => {
    if (e !== null) {
      r(!0), o(e), i(!1);
      return;
    }
    if (!t) return;
    i(!0);
    const l = window.setTimeout(() => {
      r(!1), i(!1);
    }, 200);
    return () => window.clearTimeout(l);
  }, [t, e]), !t) return null;
  const s = e ?? n;
  return /* @__PURE__ */ vt(
    "div",
    {
      className: a ? "tq-input-switch-overlay-hidden" : void 0,
      "data-tq-component": "input-switch-overlay",
      "data-tq-part": "switch-overlay",
      onTransitionEnd: (l) => {
        a && l.target === l.currentTarget && (r(!1), i(!1));
      },
      children: [
        /* @__PURE__ */ j(
          yr,
          {
            icon: "ic:baseline-radio-button-unchecked",
            "data-tq-part": "switch-state-icon",
            "data-tq-value": "off",
            "data-tq-active": s ? void 0 : ""
          }
        ),
        /* @__PURE__ */ j(
          yr,
          {
            icon: "ic:baseline-check-circle",
            "data-tq-part": "switch-state-icon",
            "data-tq-value": "on",
            "data-tq-active": s ? "" : void 0
          }
        )
      ]
    }
  );
}
function qD({
  value: e,
  onChange: t,
  label: r,
  icon: n,
  disabled: o,
  invalid: a,
  inlinePosition: i,
  blockPosition: s,
  onFocus: l,
  onBlur: c,
  onConfirm: u,
  className: f,
  ...p
}) {
  const h = Ns(), m = me(null), w = me(null), A = Vh({
    track: m,
    input: w,
    value: e,
    onChange: t,
    disabled: o,
    onFocus: l,
    onBlur: c,
    onConfirm: u
  });
  return /* @__PURE__ */ vt(
    "div",
    {
      ...p,
      className: f,
      "aria-invalid": a || void 0,
      "data-tq-component": "input-checkbox",
      "data-disabled": o || void 0,
      "data-tq-part": "root",
      children: [
        /* @__PURE__ */ vt(
          "div",
          {
            ref: m,
            "block-position": s,
            "inline-position": i,
            "data-subfocus": A.subfocus || void 0,
            "data-tq-part": "track",
            children: [
              /* @__PURE__ */ j(
                "input",
                {
                  id: h,
                  ref: w,
                  checked: e,
                  disabled: o,
                  "data-tq-part": "input",
                  type: "checkbox",
                  onChange: A.onChangeInput,
                  onKeyDown: A.onKeyDown,
                  onFocus: A.onFocusInput,
                  onBlur: A.onBlurInput
                }
              ),
              /* @__PURE__ */ j("span", { "data-tq-part": "mark", children: /* @__PURE__ */ j(yr, { icon: n || "mdi:check-bold" }) }),
              /* @__PURE__ */ j(AD, { value: A.tweakingValue })
            ]
          }
        ),
        r && /* @__PURE__ */ j("label", { htmlFor: h, "data-tq-part": "label", children: r })
      ]
    }
  );
}
function $D({
  value: e,
  onChange: t,
  options: r,
  labels: n,
  labelizer: o,
  prefix: a,
  suffix: i,
  font: s,
  cellWidth: l,
  disabled: c,
  invalid: u,
  inlinePosition: f,
  blockPosition: p,
  onFocus: h,
  onBlur: m,
  onConfirm: w,
  className: A,
  ...T
}) {
  const B = me(null), N = me(null), { width: Q } = Jn(B), [O, M] = lt(0), [X, G] = lt(16), [oe, ue] = lt(0), K = me(0), [pe, be] = lt(!1), Ce = me(
    void 0
  ), We = me(void 0), re = me(""), F = me(0), z = Yt(
    () => Gu({ options: r, labels: n, labelizer: o, prefix: a, suffix: i }),
    [o, n, r, a, i]
  ), we = Yt(
    () => r.map((it) => ({ value: it, label: z(it) })),
    [z, r]
  ), Oe = r.findIndex((it) => Object.is(it, e)), ot = s9({
    cellWidth: l,
    measuredLabelWidth: O,
    viewportWidth: Q,
    emPx: X
  }), st = me({
    value: e,
    options: r,
    activeIndex: Oe,
    viewportWidth: Q,
    cellWidth: ot,
    disabled: c,
    onChange: t,
    onConfirm: w
  });
  st.current = {
    value: e,
    options: r,
    activeIndex: Oe,
    viewportWidth: Q,
    cellWidth: ot,
    disabled: c,
    onChange: t,
    onConfirm: w
  };
  const wt = () => {
    const it = N.current;
    it && (G(parseFloat(getComputedStyle(it).fontSize) || 16), M(
      Math.max(
        0,
        ...Array.from(it.children).map(
          (Ve) => Ve.offsetWidth
        )
      )
    ));
  };
  Qo(N, wt), Vt(wt, [we]), Vt(
    () => () => {
      clearTimeout(Ce.current), clearTimeout(We.current);
    },
    []
  );
  const ae = () => {
    be(!0), clearTimeout(Ce.current), Ce.current = setTimeout(() => be(!1), 250);
  }, _ = (it) => {
    var $t;
    const Ve = st.current;
    if (Ve.options.length === 0) return;
    const pt = $2(it, Ve.options.length), bt = Ve.options[pt];
    Object.is(bt, Ve.value) || ($t = Ve.onChange) == null || $t.call(Ve, bt);
  }, J = Yt(
    () => ({
      disabled: () => !!st.current.disabled,
      lockPointer: !0,
      onDragStart() {
        const it = Math.max(0, st.current.activeIndex);
        K.current = it, ue(it);
      },
      onDrag(it) {
        const Ve = n9(
          K.current,
          it.delta[0],
          st.current.options.length,
          q2
        );
        K.current = Ve, ue(Ve), _(Math.round(Ve));
      },
      onDragEnd() {
        var it, Ve;
        ae(), (Ve = (it = st.current).onConfirm) == null || Ve.call(it);
      },
      onClick(it) {
        const Ve = B.current;
        if (!Ve) return;
        const pt = it.xy[0] - Ve.getBoundingClientRect().left, bt = o9(
          pt,
          st.current.viewportWidth,
          st.current.cellWidth
        );
        bt && _(st.current.activeIndex + bt);
      }
    }),
    []
  ), Le = Pn(B, J);
  Vt(() => {
    Le.dragging || ae();
  }, [e]);
  const at = Le.dragging ? oe : Math.max(0, Oe), Ft = Q / 2 - ot * (at + 0.5), St = (it) => {
    if (c) return;
    it.preventDefault();
    const Ve = a9(
      F.current,
      it.deltaX || it.deltaY
    );
    F.current = Ve.remainder, Ve.steps && _(st.current.activeIndex + Ve.steps);
  }, Wt = (it) => {
    if (!c) {
      if (it.key === "ArrowLeft" || it.key === "ArrowUp")
        it.preventDefault(), it.stopPropagation(), _(Oe - 1);
      else if (it.key === "ArrowRight" || it.key === "ArrowDown")
        it.preventDefault(), it.stopPropagation(), _(Oe + 1);
      else if (it.key.length === 1 && !it.metaKey && !it.ctrlKey && !it.altKey) {
        clearTimeout(We.current), We.current = setTimeout(() => re.current = "", 800), re.current += it.key.toLowerCase();
        const Ve = i9(
          we.map((pt) => pt.label),
          re.current
        );
        Ve >= 0 && (it.stopPropagation(), _(Ve));
      }
    }
  };
  return /* @__PURE__ */ vt(
    "div",
    {
      ...T,
      ref: B,
      className: A,
      style: {
        "--cell-width": `${ot}px`,
        "--label-width": `${O}px`
      },
      "inline-position": f,
      "block-position": p,
      "aria-invalid": u || void 0,
      tabIndex: c ? -1 : 0,
      "data-tq-component": "input-drum",
      "data-tq-disabled": c ? "" : void 0,
      "data-tq-part": "root",
      onKeyDown: Wt,
      onWheel: St,
      onFocus: h,
      onBlur: m,
      children: [
        /* @__PURE__ */ j("span", { "data-tq-part": "center-mark" }),
        /* @__PURE__ */ j("div", { "data-tq-part": "viewport", children: /* @__PURE__ */ j(
          "div",
          {
            "data-tq-part": "track",
            style: {
              transform: `translateX(${Ft}px)`,
              transition: Le.dragging || !pe ? "none" : void 0
            },
            children: we.map((it, Ve) => /* @__PURE__ */ vt(
              "div",
              {
                "data-tq-cell": "",
                "data-tq-active": Ve === Oe ? "" : void 0,
                "data-tq-numeric": s === "numeric" ? "" : void 0,
                "data-tq-part": Ve === Oe ? "active-cell" : "cell",
                children: [
                  it.label,
                  /* @__PURE__ */ j("span", { "data-tq-part": "tick" })
                ]
              },
              `${it.label}-${Ve}`
            ))
          }
        ) }),
        /* @__PURE__ */ j("div", { ref: N, "data-tq-part": "measure", "aria-hidden": "true", children: we.map((it, Ve) => /* @__PURE__ */ j(
          "span",
          {
            "data-tq-measure-item": "",
            "data-tq-numeric": s === "numeric" ? "" : void 0,
            children: it.label
          },
          `${it.label}-${Ve}`
        )) })
      ]
    }
  );
}
const vD = ["Shift", "Alt", "x", "y"];
function wD({
  value: e,
  onChange: t,
  min: r,
  max: n,
  showOverlayLabel: o = !0,
  disabled: a,
  invalid: i,
  inlinePosition: s,
  blockPosition: l,
  className: c,
  onFocus: u,
  onBlur: f,
  onConfirm: p,
  ...h
}) {
  const m = me(null), w = l0(vD), A = me(w);
  A.current = w;
  const T = me(e);
  T.current = e;
  const B = me({ onChange: t, onFocus: u, onBlur: f, onConfirm: p, disabled: a });
  B.current = { onChange: t, onFocus: u, onBlur: f, onConfirm: p, disabled: a };
  const N = E1(r), Q = E1(n), O = me({ min: N, max: Q });
  O.current = { min: N, max: Q };
  const M = w.Shift ? 0.5 : w.Alt ? 4 : 2, [X, G] = lt(1);
  Vt(() => {
    let F;
    const z = () => {
      G((we) => {
        const Oe = we + (M - we) * 0.4;
        return Math.abs(Oe - M) < 1e-3 ? M : (F = requestAnimationFrame(z), Oe);
      });
    };
    return F = requestAnimationFrame(z), () => cancelAnimationFrame(F);
  }, [M]);
  const oe = Yt(
    () => ({
      lockPointer: !0,
      disabled: () => !!B.current.disabled,
      dragDelaySeconds: 0,
      onDragStart() {
        var F, z;
        (z = (F = B.current).onFocus) == null || z.call(F);
      },
      onDrag({ delta: F }) {
        var ot, st, wt, ae, _, J;
        const z = A.current.Shift ? 5 : A.current.Alt ? 0.1 : 1, we = [
          F[0] * z,
          F[1] * z
        ];
        A.current.x && (we[1] = 0), A.current.y && (we[0] = 0);
        const Oe = O.current;
        (J = (_ = B.current).onChange) == null || J.call(_, [
          Math.max(
            ((ot = Oe.min) == null ? void 0 : ot[0]) ?? -1 / 0,
            Math.min(
              ((st = Oe.max) == null ? void 0 : st[0]) ?? 1 / 0,
              T.current[0] + we[0]
            )
          ),
          Math.max(
            ((wt = Oe.min) == null ? void 0 : wt[1]) ?? -1 / 0,
            Math.min(
              ((ae = Oe.max) == null ? void 0 : ae[1]) ?? 1 / 0,
              T.current[1] + we[1]
            )
          )
        ]);
      },
      onDragEnd() {
        var F, z, we, Oe;
        (z = (F = B.current).onConfirm) == null || z.call(F), (Oe = (we = B.current).onBlur) == null || Oe.call(we);
      }
    }),
    []
  ), ue = Pn(m, oe), [K, pe] = lt(!1), [be, Ce] = lt(!1);
  Vt(() => {
    if (ue.dragging) {
      pe(!0), Ce(!1);
      return;
    }
    if (!K) return;
    Ce(!0);
    const F = window.setTimeout(() => {
      pe(!1), Ce(!1);
    }, 200);
    return () => window.clearTimeout(F);
  }, [ue.dragging, K]);
  const We = H6({
    value: e,
    min: N,
    max: Q,
    scale: X
  }), re = Di(w.Shift ? 5 : w.Alt ? 0.1 : 1);
  return /* @__PURE__ */ vt(
    "button",
    {
      ...h,
      ref: m,
      className: c,
      type: "button",
      disabled: a,
      "aria-invalid": i || void 0,
      "inline-position": s,
      "block-position": l,
      "data-tq-component": "input-translate",
      "data-tq-part": "root",
      children: [
        /* @__PURE__ */ j(
          yr,
          {
            icon: "mingcute:dot-grid-fill",
            "data-tq-part": "icon"
          }
        ),
        (ue.dragging || K) && /* @__PURE__ */ vt(
          "div",
          {
            className: be ? "tq-input-translate-overlay-hidden" : void 0,
            "data-tq-part": "overlay",
            children: [
              /* @__PURE__ */ vt(
                "div",
                {
                  style: We.grid,
                  "data-tq-part": "overlay-grid",
                  onTransitionEnd: (F) => {
                    be && F.propertyName === "transform" && (pe(!1), Ce(!1));
                  },
                  children: [
                    w.x && /* @__PURE__ */ j("div", { "data-tq-part": "axis", "data-tq-axis": "x" }),
                    w.y && /* @__PURE__ */ j("div", { "data-tq-part": "axis", "data-tq-axis": "y" }),
                    /* @__PURE__ */ j(
                      "div",
                      {
                        style: We.zero,
                        "data-tq-part": "zero"
                      }
                    )
                  ]
                }
              ),
              o && /* @__PURE__ */ vt(el, { "data-tq-part": "overlay-label", children: [
                /* @__PURE__ */ j("label", { children: "X" }),
                " ",
                e[0].toFixed(re),
                " ",
                /* @__PURE__ */ j("label", { children: "Y" }),
                " ",
                e[1].toFixed(re)
              ] })
            ]
          }
        )
      ]
    }
  );
}
function Bc(e, t) {
  return Array.isArray(e) ? e[t] : e;
}
function Wh({
  value: e,
  onChange: t,
  min: r,
  max: n,
  step: o,
  icon: a,
  disabled: i,
  invalid: s,
  onFocus: l,
  onBlur: c,
  onConfirm: u
}) {
  let f, p = !1;
  const h = (w, A) => {
    f || (f = [...e], queueMicrotask(() => {
      f && (t == null || t(f)), f = void 0;
    })), f[w] = A;
  }, m = () => {
    p || (p = !0, queueMicrotask(() => {
      p = !1, u == null || u();
    }));
  };
  return /* @__PURE__ */ j(Sa, { children: e.map((w, A) => /* @__PURE__ */ j(
    gn,
    {
      "data-tq-vector-index": A,
      value: w,
      min: Bc(r, A),
      max: Bc(n, A),
      step: Bc(o, A),
      leftIcon: Array.isArray(a) ? a[A] : a,
      inlinePosition: A === 0 ? "start" : A === e.length - 1 ? "end" : "middle",
      disabled: i,
      invalid: s,
      onChange: (T) => h(A, T),
      onFocus: l,
      onBlur: c,
      onConfirm: m
    },
    A
  )) });
}
function zD({
  value: e,
  onChange: t,
  min: r,
  max: n,
  step: o,
  disabled: a,
  invalid: i,
  onFocus: s,
  onBlur: l,
  onConfirm: c
}) {
  return /* @__PURE__ */ vt(Sa, { "data-tq-variant": "input-position", children: [
    /* @__PURE__ */ j(
      wD,
      {
        value: e,
        min: r,
        max: n,
        step: o,
        disabled: a,
        invalid: i,
        onChange: t,
        onFocus: s,
        onBlur: l,
        onConfirm: c
      }
    ),
    /* @__PURE__ */ j(
      Wh,
      {
        value: e,
        min: r,
        max: n,
        step: o,
        icon: ["char:X", "char:Y"],
        disabled: a,
        invalid: i,
        onChange: t,
        onFocus: s,
        onBlur: l,
        onConfirm: c
      }
    )
  ] });
}
function jD({
  value: e,
  onChange: t,
  options: r,
  labels: n,
  labelizer: o,
  prefix: a,
  suffix: i,
  icons: s,
  tooltips: l,
  renderOption: c,
  onFocus: u,
  onBlur: f,
  onConfirm: p,
  className: h,
  ...m
}) {
  const w = Ns(), A = me(null), [T, B] = lt("rowFull"), [N, Q] = lt(null), [O, M] = lt(!1), [X, G] = lt(!1), oe = me(!1), ue = me(
    void 0
  ), K = Yt(
    () => Gu({ options: r, labels: n, labelizer: o, prefix: a, suffix: i }),
    [o, n, r, a, i]
  ), pe = Yt(
    () => r.map((ae) => ({ value: ae, label: K(ae) })),
    [K, r]
  ), be = pe.findIndex(
    (ae) => Object.is(ae.value, e)
  ), Ce = !!(s != null && s.length), We = T === "colFull" || T === "colIcon", re = T === "rowFull" || T === "colFull", F = me({ completeOptions: pe, value: e, vertical: We, activeIndex: be });
  F.current = { completeOptions: pe, value: e, vertical: We, activeIndex: be };
  const z = Jr(() => {
    const ae = A.current;
    if (!ae) return;
    const J = ae.querySelectorAll(
      "[data-tq-radio-label]"
    )[F.current.activeIndex];
    if (!J) {
      Q(null);
      return;
    }
    const Le = ae.getBoundingClientRect(), at = J.getBoundingClientRect();
    Q({
      left: at.left - Le.left,
      top: at.top - Le.top,
      width: at.width,
      height: at.height
    });
  }, []), we = Jr(() => {
    const ae = A.current;
    if (!ae || pe.length === 0) return;
    const _ = getComputedStyle(ae), J = parseFloat(_.getPropertyValue("--tq-input-height")) || 0, Le = parseFloat(_.gap) || 0, at = ae.querySelectorAll(
      "[data-tq-ruler-item]"
    );
    let Ft = 0, St = 0;
    if (at.forEach((pt) => {
      const bt = pt.getBoundingClientRect().width;
      Ft += bt, St = Math.max(St, bt);
    }), Ft === 0) return;
    const Wt = Le * (pe.length - 1), it = (pt) => ae.clientWidth + 1 >= pt;
    let Ve;
    Ce ? it(Ft + Wt) ? Ve = "rowFull" : it(J * pe.length + Wt) ? Ve = "rowIcon" : it(St) ? Ve = "colFull" : Ve = "colIcon" : Ve = it(Ft + Wt) ? "rowFull" : "colFull", B(Ve), requestAnimationFrame(z);
  }, [pe.length, Ce, z]);
  Qo(A, we), Yr(we, [we]), Yr(z, [be, T, z]), Vt(() => () => clearTimeout(ue.current), []);
  const Oe = (ae) => {
    Object.is(ae, F.current.value) || (M(!0), clearTimeout(ue.current), ue.current = setTimeout(() => M(!1), 250), t == null || t(ae), p == null || p());
  }, ot = (ae, _) => {
    const J = A.current;
    if (!J) return F.current.activeIndex;
    const Le = J.querySelectorAll(
      "[data-tq-radio-label]"
    );
    for (let at = 0; at < Le.length; at++) {
      const Ft = Le[at].getBoundingClientRect();
      if (F.current.vertical ? _ < Ft.bottom : ae < Ft.right)
        return at;
    }
    return Le.length - 1;
  }, st = (ae, _) => {
    const J = F.current.completeOptions[ot(ae, _)];
    J && Oe(J.value);
  };
  Mr(
    typeof window > "u" ? null : window,
    "pointermove",
    (ae) => {
      oe.current && st(ae.clientX, ae.clientY);
    }
  );
  const wt = () => {
    oe.current && (oe.current = !1, G(!1));
  };
  return Mr(
    typeof window > "u" ? null : window,
    "pointerup",
    wt
  ), Mr(
    typeof window > "u" ? null : window,
    "pointercancel",
    wt
  ), /* @__PURE__ */ vt(
    "ul",
    {
      ...m,
      ref: A,
      className: h,
      role: "radiogroup",
      "data-tq-component": "input-radio",
      "data-tq-part": "root",
      "data-tq-layout": T,
      "data-tq-vertical": We ? "" : void 0,
      "data-tq-icon-only": re ? void 0 : "",
      onPointerDown: (ae) => {
        ae.button === 0 && (ae.preventDefault(), oe.current = !0, G(!0), st(ae.clientX, ae.clientY));
      },
      children: [
        N && /* @__PURE__ */ j(
          "li",
          {
            "aria-hidden": "true",
            "data-tq-part": "indicator",
            "data-tq-animating": O ? "" : void 0,
            "data-tq-dragging": X ? "" : void 0,
            style: {
              transform: `translate(${N.left}px, ${N.top}px)`,
              width: N.width,
              height: N.height
            }
          }
        ),
        pe.map((ae, _) => {
          const J = Object.is(ae.value, e), Le = (l == null ? void 0 : l[_]) ?? (!re && (s != null && s[_]) ? ae.label : void 0);
          return /* @__PURE__ */ vt(
            "li",
            {
              "data-tq-part": `option-${_}`,
              children: [
                /* @__PURE__ */ j(
                  "input",
                  {
                    id: `${w}-${_}`,
                    type: "radio",
                    name: w,
                    checked: J,
                    "data-tq-part": `radio-${_}`,
                    onChange: () => Oe(ae.value),
                    onFocus: u,
                    onBlur: f
                  }
                ),
                /* @__PURE__ */ j(
                  xD,
                  {
                    htmlFor: `${w}-${_}`,
                    active: J,
                    tooltip: Le,
                    part: `label-${_}`,
                    children: (c == null ? void 0 : c({
                      label: ae.label,
                      value: ae.value,
                      isActive: J
                    })) ?? /* @__PURE__ */ vt(An, { children: [
                      (s == null ? void 0 : s[_]) && /* @__PURE__ */ j(yr, { "data-tq-part": "option-icon", icon: s[_] }),
                      (re || !(s != null && s[_])) && /* @__PURE__ */ j("span", { "data-tq-part": "option-label", children: ae.label })
                    ] })
                  }
                )
              ]
            },
            `${ae.label}-${_}`
          );
        }),
        /* @__PURE__ */ j("li", { "data-tq-part": "ruler", "aria-hidden": "true", children: pe.map((ae, _) => /* @__PURE__ */ vt(
          "div",
          {
            "data-tq-ruler-item": "",
            children: [
              (s == null ? void 0 : s[_]) && /* @__PURE__ */ j(yr, { "data-tq-part": "option-icon", icon: s[_] }),
              /* @__PURE__ */ j("span", { "data-tq-part": "option-label", children: ae.label })
            ]
          },
          `${ae.label}-${_}`
        )) })
      ]
    }
  );
}
function xD({
  htmlFor: e,
  active: t,
  tooltip: r,
  part: n,
  children: o
}) {
  const a = me(null);
  return kh(a, r), /* @__PURE__ */ j(
    "label",
    {
      ref: a,
      htmlFor: e,
      "data-tq-radio-label": "",
      "data-tq-part": n,
      "data-tq-active": t ? "" : void 0,
      children: o
    }
  );
}
function HD({
  value: e,
  onChange: t,
  disabled: r,
  invalid: n,
  onFocus: o,
  onBlur: a,
  onConfirm: i
}) {
  const [s, l] = lt(!0), c = me(e);
  return /* @__PURE__ */ vt("div", { "data-tq-component": "input-size", "data-tq-part": "root", children: [
    /* @__PURE__ */ j(
      Wh,
      {
        value: e,
        icon: ["mdi:arrow-left-right", "mdi:arrow-up-down"],
        disabled: r,
        invalid: n,
        onChange: (u) => {
          const f = B6({
            previous: e,
            next: u,
            valueOnEdit: c.current,
            keepRatio: s
          });
          l(f.keepRatio), t == null || t(f.value);
        },
        onFocus: () => {
          c.current = e, o == null || o();
        },
        onBlur: a,
        onConfirm: i
      }
    ),
    /* @__PURE__ */ j(
      "button",
      {
        type: "button",
        disabled: r,
        "aria-pressed": s,
        "data-tq-part": "ratio",
        onClick: () => l((u) => !u),
        children: /* @__PURE__ */ j(
          yr,
          {
            "data-tq-part": "ratio-icon",
            icon: s ? "radix-icons:link-1" : "radix-icons:link-none-1"
          }
        )
      }
    )
  ] });
}
const _D = ["q", "Shift", "Alt", "h", "m", "s", "t"];
function UD({
  value: e,
  onChange: t,
  frameRate: r = 24,
  min: n = -1 / 0,
  max: o = 1 / 0,
  default: a,
  disabled: i,
  invalid: s,
  inlinePosition: l,
  blockPosition: c,
  onFocus: u,
  onBlur: f,
  onConfirm: p,
  className: h,
  ...m
}) {
  const { inputTimeFormatEntry: w } = xo(), A = me(null), T = Yt(
    () => ({
      get current() {
        var ie;
        return ((ie = A.current) == null ? void 0 : ie.getRoot()) ?? null;
      }
    }),
    []
  ), B = Jn(T), [N, Q] = VS(w), [O, M] = lt(
    () => Nc(e, N, r)
  ), X = me(O);
  X.current = O;
  const [G, oe] = lt(!1), [ue, K] = lt(0), [pe, be] = lt([]), [Ce, We] = lt(!1), [re, F] = lt(!1), z = l0(_D), we = me(z);
  we.current = z;
  const Oe = me(e);
  Oe.current = e;
  const ot = me(e), st = me(e), wt = me(0), ae = me({ frameRate: r, min: n, max: o, disabled: i });
  ae.current = { frameRate: r, min: n, max: o, disabled: i };
  const _ = me({ onChange: t, onConfirm: p, onFocus: u, onBlur: f });
  _.current = { onChange: t, onConfirm: p, onFocus: u, onBlur: f };
  const J = me(ue);
  J.current = ue;
  const Le = () => {
    const ie = we.current;
    return ie.t ? 0 : ie.s ? 1 : ie.m ? 2 : ie.h ? 3 : Ut.clamp(
      J.current + (ie.Shift ? 1 : ie.Alt ? -1 : 0),
      0,
      3
    );
  }, at = () => {
    const ie = Le(), Be = ae.current.frameRate;
    return ie <= 0 ? 0.25 : ie === 1 ? Be / 10 : ie === 2 ? Be * 60 / 10 : Be * 3600 / 100;
  }, Ft = (ie) => {
    const { frameRate: Be, min: E, max: V } = ae.current;
    return ie = q6(
      ie,
      Be,
      Le(),
      we.current.q,
      Oe.current
    ), Ut.clamp(ie, E, V);
  }, St = Ja({
    type: "number",
    getElement: () => T.current,
    getValue: () => Oe.current,
    setValue: (ie) => {
      var Be, E;
      return (E = (Be = _.current).onChange) == null ? void 0 : E.call(
        Be,
        Ut.clamp(Number(ie), ae.current.min, ae.current.max)
      );
    },
    confirm: () => {
      var ie, Be;
      return (Be = (ie = _.current).onConfirm) == null ? void 0 : Be.call(ie);
    }
  }), Wt = me(St);
  Wt.current = St;
  const it = Yt(
    () => ({
      disabled: () => !!ae.current.disabled,
      lockPointer: !0,
      onClick(ie, Be) {
        var or, Gr, _r;
        const E = (or = Be.target) == null ? void 0 : or.closest(
          "[data-tq-time-digit]"
        ), V = Number(E == null ? void 0 : E.dataset.tqDigitIndex), Se = X.current.split(":"), ft = Se.length - V - 1;
        if (!E || !Number.isInteger(V) || ft < 0) {
          (Gr = A.current) == null || Gr.select();
          return;
        }
        const Mt = Se.slice(0, ft).reduce((In, Zr) => In + Zr.length + 1, 0);
        (_r = A.current) == null || _r.select(Mt, Mt + Se[ft].length);
      },
      onDragStart() {
        var ie, Be;
        st.current = Oe.current, wt.current = 0, Wt.current.setFocusing(!0), Wt.current.capture(), (Be = (ie = _.current).onFocus) == null || Be.call(ie);
      },
      onDrag(ie) {
        var E, V;
        st.current = Ut.clamp(
          st.current + ie.delta[0] * at(),
          ae.current.min,
          ae.current.max
        );
        const Be = Ft(st.current);
        (V = (E = _.current).onChange) == null || V.call(E, Be), wt.current += ie.delta[0], Wt.current.update((Se) => Number(Se) + wt.current);
      },
      onDragEnd() {
        var ie, Be, E, V;
        Wt.current.setFocusing(!1), (Be = (ie = _.current).onConfirm) == null || Be.call(ie), Wt.current.confirm(), (V = (E = _.current).onBlur) == null || V.call(E);
      }
    }),
    []
  ), Ve = Pn(T, it);
  Vt(() => {
    if (Ve.dragging) {
      We(!0), F(!1);
      return;
    }
    if (!Ce) return;
    F(!0);
    const ie = window.setTimeout(() => {
      We(!1), F(!1);
    }, 200);
    return () => window.clearTimeout(ie);
  }, [Ve.dragging, Ce]);
  const pt = Le(), bt = (ie, Be, E) => {
    const V = ie * 360 - 90;
    return i3(
      Xt.dir(V, Be, [50, 50]),
      Xt.dir(V, E, [50, 50])
    );
  }, $t = pt === 0 ? $i(0, 1, 1 / r) : $i(0, 1, 1 / 12), br = Qc(
    $t.map((ie) => bt(ie, 48, 49))
  ), Qt = bt(e % r / r, 48, 48), ur = bt(
    Math.floor(e / r) % 60 / 60,
    -15,
    45
  ), _e = bt(
    Math.floor(e / (r * 60)) % 60 / 60,
    0,
    40
  ), ut = Math.floor(e / (r * 3600)) % 24, kt = ut ? bt(ut / 12, 0, 20) : "";
  Vt(() => {
    G || M(Nc(e, N, r));
  }, [G, N, r, e]);
  const b = () => {
    p == null || p(), M(Nc(Oe.current, N, r));
  }, R = [
    {
      label: "Frames",
      icon: N === "frames" ? "mdi:check" : void 0,
      perform: () => Q("frames")
    },
    {
      label: "SMPTE Timecode",
      icon: N === "timecode" ? "mdi:check" : void 0,
      perform: () => Q("timecode")
    }
  ], le = N === "timecode" ? O.split(":").reverse() : null;
  return /* @__PURE__ */ j(
    qu,
    {
      ...m,
      ref: A,
      className: h,
      "data-tq-input-time": "",
      value: O,
      inlinePosition: l,
      blockPosition: c,
      ignoreInput: !G,
      active: St.subfocus,
      font: "numeric",
      leftIcon: "mdi:clock",
      align: "center",
      disabled: i,
      invalid: s || pe.length > 0,
      default: a,
      menuItems: R,
      onPointerEnter: () => K(0),
      onFocus: () => {
        oe(!0), ot.current = Oe.current, St.setFocusing(!0), St.capture(), u == null || u();
      },
      onBlur: () => {
        oe(!1), St.setFocusing(!1), b(), f == null || f();
      },
      onChange: (ie) => {
        M(ie);
        const Be = j6(ie, r), E = Be(ot.current, {
          i: St.index,
          fps: r
        });
        be(E.log), E.value !== void 0 && (t == null || t(Ut.clamp(E.value, n, o)), St.update((V, Se) => Be(Number(V), {
          ...Se,
          fps: r
        }).value ?? V));
      },
      onKeyDown: (ie) => {
        if (ie.key !== "ArrowUp" && ie.key !== "ArrowDown") return;
        ie.preventDefault();
        const Be = ie.key === "ArrowUp" ? 1 : -1, E = ie.altKey ? 1 : ie.shiftKey ? 60 * r : r;
        t == null || t(
          Ut.clamp(Oe.current + Be * E, n, o)
        ), b();
      },
      onConfirm: b,
      onReset: () => {
        a !== void 0 && (t == null || t(a), p == null || p());
      },
      renderInactiveContent: () => /* @__PURE__ */ j("div", { "data-tq-part": "time-digits", children: le ? le.map((ie, Be) => /* @__PURE__ */ vt("div", { "data-tq-part": "digit-group", children: [
        /* @__PURE__ */ vt(
          "div",
          {
            "data-tq-time-digit": "",
            "data-tq-digit-index": Be,
            "data-tq-active": Be === pt ? "" : void 0,
            "data-tq-part": "digit",
            onPointerEnter: () => K(Be),
            children: [
              ie,
              Be === pt && /* @__PURE__ */ j(el, { "data-tq-part": "digit-label", children: /* @__PURE__ */ j("label", { children: ["F", "Secs", "Mins", "Hrs"][Be] ?? "Hrs" }) })
            ]
          }
        ),
        Be !== le.length - 1 && /* @__PURE__ */ j("div", { "data-tq-part": "separator", children: ":" })
      ] }, `${ie}-${Be}`)) : /* @__PURE__ */ j("div", { "data-tq-part": "frame-display", children: O }) }),
      renderFront: () => Ve.dragging || Ce ? /* @__PURE__ */ j($u, { children: /* @__PURE__ */ j(
        "div",
        {
          style: {
            left: B.x + B.width / 2,
            top: B.y + B.height / 2
          },
          "data-tq-component": "input-time-overlay",
          "data-tq-leaving": re ? "" : void 0,
          "data-tq-part": "overlay",
          onTransitionEnd: (ie) => {
            re && ie.target === ie.currentTarget && (We(!1), F(!1));
          },
          children: /* @__PURE__ */ vt("svg", { viewBox: "0 0 100 100", "data-tq-part": "overlay-svg", children: [
            /* @__PURE__ */ j("path", { d: br, "data-tq-tick": "meters" }),
            /* @__PURE__ */ j(
              "path",
              {
                d: Qt,
                "data-tq-tick": "frame",
                "data-tq-active": pt === 0 ? "" : void 0
              }
            ),
            /* @__PURE__ */ j(
              "path",
              {
                d: ur,
                "data-tq-tick": "second",
                "data-tq-active": pt === 1 ? "" : void 0
              }
            ),
            /* @__PURE__ */ j(
              "path",
              {
                d: _e,
                "data-tq-tick": "minute",
                "data-tq-active": pt === 2 ? "" : void 0
              }
            ),
            /* @__PURE__ */ j(
              "path",
              {
                d: kt,
                "data-tq-tick": "hour",
                "data-tq-active": pt === 3 ? "" : void 0
              }
            )
          ] })
        }
      ) }) : null
    }
  );
}
function Nc(e, t, r) {
  return t === "frames" ? `${e}F` : $6(e, r);
}
function VD({
  appId: e = "viewport",
  className: t,
  children: r,
  ...n
}) {
  const o = wh(), a = Ik(e, {}, o), i = /* @__PURE__ */ j(
    "div",
    {
      ...n,
      className: Th("TqViewport", t),
      "data-tq-component": "viewport",
      "data-tq-part": "viewport",
      children: r
    }
  );
  return o ? i : /* @__PURE__ */ j(Pk, { runtime: a, bind: !0, disposeOnUnmount: !0, children: i });
}
export {
  FD as InputAngle,
  BD as InputButton,
  ND as InputButtonToggle,
  qD as InputCheckbox,
  OD as InputColor,
  PD as InputCubicBezier,
  bD as InputCubicBezierPicker,
  sD as InputDropdown,
  $D as InputDrum,
  gn as InputNumber,
  zD as InputPosition,
  jD as InputRadio,
  ID as InputShuffle,
  HD as InputSize,
  zu as InputString,
  GD as InputSwitch,
  UD as InputTime,
  wD as InputTranslate,
  Wh as InputVec,
  VD as Viewport,
  CD as fromEnum,
  MD as fromNumber,
  LD as fromString
};
//# sourceMappingURL=index.es.js.map
