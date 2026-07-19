var gh = Object.defineProperty;
var Ju = (e) => {
  throw TypeError(e);
};
var Ah = (e, t, r) => t in e ? gh(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r;
var bi = (e, t, r) => Ah(e, typeof t != "symbol" ? t + "" : t, r), Il = (e, t, r) => t.has(e) || Ju("Cannot " + r);
var mt = (e, t, r) => (Il(e, t, "read from private field"), r ? r.call(e) : t.get(e)), Or = (e, t, r) => t.has(e) ? Ju("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), fr = (e, t, r, n) => (Il(e, t, "write to private field"), n ? n.call(e, r) : t.set(e, r), r), Pr = (e, t, r) => (Il(e, t, "access private method"), r);
var gi = (e, t, r, n) => ({
  set _(o) {
    fr(e, t, o, r);
  },
  get _() {
    return mt(e, t, n);
  }
});
import { jsx as fe, jsxs as Ht, Fragment as Xn } from "react/jsx-runtime";
import Ai, { useRef as ze, useEffect as ur, useLayoutEffect as vn, useState as Mt, useCallback as io, useMemo as dr, forwardRef as mo, isValidElement as fc, cloneElement as vh, Children as _h, Fragment as wh, createElement as uc, useImperativeHandle as T0, useContext as xh, createContext as Eh, useId as Sh } from "react";
import { createPortal as kh } from "react-dom";
const { min: Th, max: Mh } = Math, No = (e, t = 0, r = 1) => Th(Mh(t, e), r), Oc = (e) => {
  e._clipped = !1, e._unclipped = e.slice(0);
  for (let t = 0; t <= 3; t++)
    t < 3 ? ((e[t] < 0 || e[t] > 255) && (e._clipped = !0), e[t] = No(e[t], 0, 255)) : t === 3 && (e[t] = No(e[t], 0, 1));
  return e;
}, tp = {};
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
  tp[`[object ${e}]`] = e.toLowerCase();
function Dt(e) {
  return tp[Object.prototype.toString.call(e)] || "object";
}
const Ct = (e, t = null) => e.length >= 3 ? Array.prototype.slice.call(e) : Dt(e[0]) == "object" && t ? t.split("").filter((r) => e[0][r] !== void 0).map((r) => e[0][r]) : e[0].slice(0), _a = (e) => {
  if (e.length < 2) return null;
  const t = e.length - 1;
  return Dt(e[t]) == "string" ? e[t].toLowerCase() : null;
}, { PI: hs, min: rp, max: np } = Math, un = (e) => Math.round(e * 100) / 100, dc = (e) => Math.round(e * 100) / 100, Hn = hs * 2, Nl = hs / 3, Lh = hs / 180, Ch = 180 / hs;
function op(e) {
  return [...e.slice(0, 3).reverse(), ...e.slice(3)];
}
const Lt = {
  format: {},
  autodetect: []
};
let Ce = class {
  constructor(...t) {
    const r = this;
    if (Dt(t[0]) === "object" && t[0].constructor && t[0].constructor === this.constructor)
      return t[0];
    let n = _a(t), o = !1;
    if (!n) {
      o = !0, Lt.sorted || (Lt.autodetect = Lt.autodetect.sort((a, i) => i.p - a.p), Lt.sorted = !0);
      for (let a of Lt.autodetect)
        if (n = a.test(...t), n) break;
    }
    if (Lt.format[n]) {
      const a = Lt.format[n].apply(
        null,
        o ? t : t.slice(0, -1)
      );
      r._rgb = Oc(a);
    } else
      throw new Error("unknown format: " + t);
    r._rgb.length === 3 && r._rgb.push(1);
  }
  toString() {
    return Dt(this.hex) == "function" ? this.hex() : `[${this._rgb.join(",")}]`;
  }
};
const Rh = "3.1.2", kt = (...e) => new Ce(...e);
kt.version = Rh;
const ma = {
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
}, Ih = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, Nh = /^#?([A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/, ap = (e) => {
  if (e.match(Ih)) {
    (e.length === 4 || e.length === 7) && (e = e.substr(1)), e.length === 3 && (e = e.split(""), e = e[0] + e[0] + e[1] + e[1] + e[2] + e[2]);
    const t = parseInt(e, 16), r = t >> 16, n = t >> 8 & 255, o = t & 255;
    return [r, n, o, 1];
  }
  if (e.match(Nh)) {
    (e.length === 5 || e.length === 9) && (e = e.substr(1)), e.length === 4 && (e = e.split(""), e = e[0] + e[0] + e[1] + e[1] + e[2] + e[2] + e[3] + e[3]);
    const t = parseInt(e, 16), r = t >> 24 & 255, n = t >> 16 & 255, o = t >> 8 & 255, a = Math.round((t & 255) / 255 * 100) / 100;
    return [r, n, o, a];
  }
  throw new Error(`unknown hex color: ${e}`);
}, { round: vi } = Math, ip = (...e) => {
  let [t, r, n, o] = Ct(e, "rgba"), a = _a(e) || "auto";
  o === void 0 && (o = 1), a === "auto" && (a = o < 1 ? "rgba" : "rgb"), t = vi(t), r = vi(r), n = vi(n);
  let s = "000000" + (t << 16 | r << 8 | n).toString(16);
  s = s.substr(s.length - 6);
  let l = "0" + vi(o * 255).toString(16);
  switch (l = l.substr(l.length - 2), a.toLowerCase()) {
    case "rgba":
      return `#${s}${l}`;
    case "argb":
      return `#${l}${s}`;
    default:
      return `#${s}`;
  }
};
Ce.prototype.name = function() {
  const e = ip(this._rgb, "rgb");
  for (let t of Object.keys(ma))
    if (ma[t] === e) return t.toLowerCase();
  return e;
};
Lt.format.named = (e) => {
  if (e = e.toLowerCase(), ma[e]) return ap(ma[e]);
  throw new Error("unknown color name: " + e);
};
Lt.autodetect.push({
  p: 5,
  test: (e, ...t) => {
    if (!t.length && Dt(e) === "string" && ma[e.toLowerCase()])
      return "named";
  }
});
Ce.prototype.alpha = function(e, t = !1) {
  return e !== void 0 && Dt(e) === "number" ? t ? (this._rgb[3] = e, this) : new Ce([this._rgb[0], this._rgb[1], this._rgb[2], e], "rgb") : this._rgb[3];
};
Ce.prototype.clipped = function() {
  return this._rgb._clipped || !1;
};
const Nn = {
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
}, Oh = /* @__PURE__ */ new Map([
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
  const t = Oh.get(String(e).toLowerCase());
  if (!t)
    throw new Error("unknown Lab illuminant " + e);
  Nn.labWhitePoint = e, Nn.Xn = t[0], Nn.Zn = t[1];
}
function u0() {
  return Nn.labWhitePoint;
}
const Pc = (...e) => {
  e = Ct(e, "lab");
  const [t, r, n] = e, [o, a, i] = Ph(t, r, n), [s, l, c] = sp(o, a, i);
  return [s, l, c, e.length > 3 ? e[3] : 1];
}, Ph = (e, t, r) => {
  const { kE: n, kK: o, kKE: a, Xn: i, Yn: s, Zn: l } = Nn, c = (e + 16) / 116, u = 2e-3 * t + c, d = c - 5e-3 * r, p = u * u * u, m = d * d * d, y = p > n ? p : (116 * u - 16) / o, L = e > a ? Math.pow((e + 16) / 116, 3) : e / o, x = m > n ? m : (116 * d - 16) / o, O = y * i, Y = L * s, R = x * l;
  return [O, Y, R];
}, Ol = (e) => {
  const t = Math.sign(e);
  return e = Math.abs(e), (e <= 31308e-7 ? e * 12.92 : 1.055 * Math.pow(e, 1 / 2.4) - 0.055) * t;
}, sp = (e, t, r) => {
  const { MtxAdaptMa: n, MtxAdaptMaI: o, MtxXYZ2RGB: a, RefWhiteRGB: i, Xn: s, Yn: l, Zn: c } = Nn, u = s * n.m00 + l * n.m10 + c * n.m20, d = s * n.m01 + l * n.m11 + c * n.m21, p = s * n.m02 + l * n.m12 + c * n.m22, m = i.X * n.m00 + i.Y * n.m10 + i.Z * n.m20, y = i.X * n.m01 + i.Y * n.m11 + i.Z * n.m21, L = i.X * n.m02 + i.Y * n.m12 + i.Z * n.m22, x = (e * n.m00 + t * n.m10 + r * n.m20) * (m / u), O = (e * n.m01 + t * n.m11 + r * n.m21) * (y / d), Y = (e * n.m02 + t * n.m12 + r * n.m22) * (L / p), R = x * o.m00 + O * o.m10 + Y * o.m20, z = x * o.m01 + O * o.m11 + Y * o.m21, j = x * o.m02 + O * o.m12 + Y * o.m22, I = Ol(
    R * a.m00 + z * a.m10 + j * a.m20
  ), N = Ol(
    R * a.m01 + z * a.m11 + j * a.m21
  ), ne = Ol(
    R * a.m02 + z * a.m12 + j * a.m22
  );
  return [I * 255, N * 255, ne * 255];
}, Dc = (...e) => {
  const [t, r, n, ...o] = Ct(e, "rgb"), [a, i, s] = lp(t, r, n), [l, c, u] = Dh(a, i, s);
  return [l, c, u, ...o.length > 0 && o[0] < 1 ? [o[0]] : []];
};
function Dh(e, t, r) {
  const { Xn: n, Yn: o, Zn: a, kE: i, kK: s } = Nn, l = e / n, c = t / o, u = r / a, d = l > i ? Math.pow(l, 1 / 3) : (s * l + 16) / 116, p = c > i ? Math.pow(c, 1 / 3) : (s * c + 16) / 116, m = u > i ? Math.pow(u, 1 / 3) : (s * u + 16) / 116;
  return [116 * p - 16, 500 * (d - p), 200 * (p - m)];
}
function Pl(e) {
  const t = Math.sign(e);
  return e = Math.abs(e), (e <= 0.04045 ? e / 12.92 : Math.pow((e + 0.055) / 1.055, 2.4)) * t;
}
const lp = (e, t, r) => {
  e = Pl(e / 255), t = Pl(t / 255), r = Pl(r / 255);
  const { MtxRGB2XYZ: n, MtxAdaptMa: o, MtxAdaptMaI: a, Xn: i, Yn: s, Zn: l, As: c, Bs: u, Cs: d } = Nn;
  let p = e * n.m00 + t * n.m10 + r * n.m20, m = e * n.m01 + t * n.m11 + r * n.m21, y = e * n.m02 + t * n.m12 + r * n.m22;
  const L = i * o.m00 + s * o.m10 + l * o.m20, x = i * o.m01 + s * o.m11 + l * o.m21, O = i * o.m02 + s * o.m12 + l * o.m22;
  let Y = p * o.m00 + m * o.m10 + y * o.m20, R = p * o.m01 + m * o.m11 + y * o.m21, z = p * o.m02 + m * o.m12 + y * o.m22;
  return Y *= L / c, R *= x / u, z *= O / d, p = Y * a.m00 + R * a.m10 + z * a.m20, m = Y * a.m01 + R * a.m11 + z * a.m21, y = Y * a.m02 + R * a.m12 + z * a.m22, [p, m, y];
};
Ce.prototype.lab = function() {
  return Dc(this._rgb);
};
const Bh = (...e) => new Ce(...e, "lab");
Object.assign(kt, { lab: Bh, getLabWhitePoint: u0, setLabWhitePoint: Wn });
Lt.format.lab = Pc;
Lt.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Ct(e, "lab"), Dt(e) === "array" && e.length === 3)
      return "lab";
  }
});
Ce.prototype.darken = function(e = 1) {
  const t = this, r = t.lab();
  return r[0] -= Nn.Kn * e, new Ce(r, "lab").alpha(t.alpha(), !0);
};
Ce.prototype.brighten = function(e = 1) {
  return this.darken(-e);
};
Ce.prototype.darker = Ce.prototype.darken;
Ce.prototype.brighter = Ce.prototype.brighten;
Ce.prototype.get = function(e) {
  const [t, r] = e.split("."), n = this[t]();
  if (r) {
    const o = t.indexOf(r) - (t.substr(0, 2) === "ok" ? 2 : 0);
    if (o > -1) return n[o];
    throw new Error(`unknown channel ${r} in mode ${t}`);
  } else
    return n;
};
const { pow: Gh } = Math, Fh = 1e-7, $h = 20;
Ce.prototype.luminance = function(e, t = "rgb") {
  if (e !== void 0 && Dt(e) === "number") {
    if (e === 0)
      return new Ce([0, 0, 0, this._rgb[3]], "rgb");
    if (e === 1)
      return new Ce([255, 255, 255, this._rgb[3]], "rgb");
    let r = this.luminance(), n = $h;
    const o = (i, s) => {
      const l = i.interpolate(s, 0.5, t), c = l.luminance();
      return Math.abs(e - c) < Fh || !n-- ? l : c > e ? o(i, l) : o(l, s);
    }, a = (r > e ? o(new Ce([0, 0, 0]), this) : o(this, new Ce([255, 255, 255]))).rgb();
    return new Ce([...a, this._rgb[3]]);
  }
  return zh(...this._rgb.slice(0, 3));
};
const zh = (e, t, r) => (e = Dl(e), t = Dl(t), r = Dl(r), 0.2126 * e + 0.7152 * t + 0.0722 * r), Dl = (e) => (e /= 255, e <= 0.03928 ? e / 12.92 : Gh((e + 0.055) / 1.055, 2.4)), Fr = {}, ha = (e, t, r = 0.5, ...n) => {
  let o = n[0] || "lrgb";
  if (!Fr[o] && !n.length && (o = Object.keys(Fr)[0]), !Fr[o])
    throw new Error(`interpolation mode ${o} is not defined`);
  return Dt(e) !== "object" && (e = new Ce(e)), Dt(t) !== "object" && (t = new Ce(t)), Fr[o](e, t, r).alpha(
    e.alpha() + r * (t.alpha() - e.alpha())
  );
};
Ce.prototype.mix = Ce.prototype.interpolate = function(e, t = 0.5, ...r) {
  return ha(this, e, t, ...r);
};
Ce.prototype.premultiply = function(e = !1) {
  const t = this._rgb, r = t[3];
  return e ? (this._rgb = [t[0] * r, t[1] * r, t[2] * r, r], this) : new Ce([t[0] * r, t[1] * r, t[2] * r, r], "rgb");
};
const { sin: jh, cos: qh } = Math, cp = (...e) => {
  let [t, r, n] = Ct(e, "lch");
  return isNaN(n) && (n = 0), n = n * Lh, [t, qh(n) * r, jh(n) * r];
}, Bc = (...e) => {
  e = Ct(e, "lch");
  const [t, r, n] = e, [o, a, i] = cp(t, r, n), [s, l, c] = Pc(o, a, i);
  return [s, l, c, e.length > 3 ? e[3] : 1];
}, Hh = (...e) => {
  const t = op(Ct(e, "hcl"));
  return Bc(...t);
}, { sqrt: Uh, atan2: Vh, round: Xh } = Math, fp = (...e) => {
  const [t, r, n] = Ct(e, "lab"), o = Uh(r * r + n * n);
  let a = (Vh(n, r) * Ch + 360) % 360;
  return Xh(o * 1e4) === 0 && (a = Number.NaN), [t, o, a];
}, Gc = (...e) => {
  const [t, r, n, ...o] = Ct(e, "rgb"), [a, i, s] = Dc(t, r, n), [l, c, u] = fp(a, i, s);
  return [l, c, u, ...o.length > 0 && o[0] < 1 ? [o[0]] : []];
};
Ce.prototype.lch = function() {
  return Gc(this._rgb);
};
Ce.prototype.hcl = function() {
  return op(Gc(this._rgb));
};
const Wh = (...e) => new Ce(...e, "lch"), Yh = (...e) => new Ce(...e, "hcl");
Object.assign(kt, { lch: Wh, hcl: Yh });
Lt.format.lch = Bc;
Lt.format.hcl = Hh;
["lch", "hcl"].forEach(
  (e) => Lt.autodetect.push({
    p: 2,
    test: (...t) => {
      if (t = Ct(t, e), Dt(t) === "array" && t.length === 3)
        return e;
    }
  })
);
Ce.prototype.saturate = function(e = 1) {
  const t = this, r = t.lch();
  return r[1] += Nn.Kn * e, r[1] < 0 && (r[1] = 0), new Ce(r, "lch").alpha(t.alpha(), !0);
};
Ce.prototype.desaturate = function(e = 1) {
  return this.saturate(-e);
};
Ce.prototype.set = function(e, t, r = !1) {
  const [n, o] = e.split("."), a = this[n]();
  if (o) {
    const i = n.indexOf(o) - (n.substr(0, 2) === "ok" ? 2 : 0);
    if (i > -1) {
      if (Dt(t) == "string")
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
      else if (Dt(t) === "number")
        a[i] = t;
      else
        throw new Error("unsupported value for Color.set");
      const s = new Ce(a, n);
      return r ? (this._rgb = s._rgb, this) : s;
    }
    throw new Error(`unknown channel ${o} in mode ${n}`);
  } else
    return a;
};
Ce.prototype.tint = function(e = 0.5, ...t) {
  return ha(this, "white", e, ...t);
};
Ce.prototype.shade = function(e = 0.5, ...t) {
  return ha(this, "black", e, ...t);
};
const Zh = (e, t, r) => {
  const n = e._rgb, o = t._rgb;
  return new Ce(
    n[0] + r * (o[0] - n[0]),
    n[1] + r * (o[1] - n[1]),
    n[2] + r * (o[2] - n[2]),
    "rgb"
  );
};
Fr.rgb = Zh;
const { sqrt: Bl, pow: ea } = Math, Kh = (e, t, r) => {
  const [n, o, a] = e._rgb, [i, s, l] = t._rgb;
  return new Ce(
    Bl(ea(n, 2) * (1 - r) + ea(i, 2) * r),
    Bl(ea(o, 2) * (1 - r) + ea(s, 2) * r),
    Bl(ea(a, 2) * (1 - r) + ea(l, 2) * r),
    "rgb"
  );
};
Fr.lrgb = Kh;
const Qh = (e, t, r) => {
  const n = e.lab(), o = t.lab();
  return new Ce(
    n[0] + r * (o[0] - n[0]),
    n[1] + r * (o[1] - n[1]),
    n[2] + r * (o[2] - n[2]),
    "lab"
  );
};
Fr.lab = Qh;
const wa = (e, t, r, n) => {
  let o, a;
  n === "hsl" ? (o = e.hsl(), a = t.hsl()) : n === "hsv" ? (o = e.hsv(), a = t.hsv()) : n === "hcg" ? (o = e.hcg(), a = t.hcg()) : n === "hsi" ? (o = e.hsi(), a = t.hsi()) : n === "lch" || n === "hcl" ? (n = "hcl", o = e.hcl(), a = t.hcl()) : n === "oklch" && (o = e.oklch().reverse(), a = t.oklch().reverse());
  let i, s, l, c, u, d;
  (n.substr(0, 1) === "h" || n === "oklch") && ([i, l, u] = o, [s, c, d] = a);
  let p, m, y, L;
  return !isNaN(i) && !isNaN(s) ? (s > i && s - i > 180 ? L = s - (i + 360) : s < i && i - s > 180 ? L = s + 360 - i : L = s - i, m = i + r * L) : isNaN(i) ? isNaN(s) ? m = Number.NaN : (m = s, (u == 1 || u == 0) && n != "hsv" && (p = c)) : (m = i, (d == 1 || d == 0) && n != "hsv" && (p = l)), p === void 0 && (p = l + r * (c - l)), y = u + r * (d - u), n === "oklch" ? new Ce([y, p, m], n) : new Ce([m, p, y], n);
}, up = (e, t, r) => wa(e, t, r, "lch");
Fr.lch = up;
Fr.hcl = up;
const Jh = (e) => {
  if (Dt(e) == "number" && e >= 0 && e <= 16777215) {
    const t = e >> 16, r = e >> 8 & 255, n = e & 255;
    return [t, r, n, 1];
  }
  throw new Error("unknown num color: " + e);
}, ey = (...e) => {
  const [t, r, n] = Ct(e, "rgb");
  return (t << 16) + (r << 8) + n;
};
Ce.prototype.num = function() {
  return ey(this._rgb);
};
const ty = (...e) => new Ce(...e, "num");
Object.assign(kt, { num: ty });
Lt.format.num = Jh;
Lt.autodetect.push({
  p: 5,
  test: (...e) => {
    if (e.length === 1 && Dt(e[0]) === "number" && e[0] >= 0 && e[0] <= 16777215)
      return "num";
  }
});
const ry = (e, t, r) => {
  const n = e.num(), o = t.num();
  return new Ce(n + r * (o - n), "num");
};
Fr.num = ry;
const { floor: ny } = Math, oy = (...e) => {
  e = Ct(e, "hcg");
  let [t, r, n] = e, o, a, i;
  n = n * 255;
  const s = r * 255;
  if (r === 0)
    o = a = i = n;
  else {
    t === 360 && (t = 0), t > 360 && (t -= 360), t < 0 && (t += 360), t /= 60;
    const l = ny(t), c = t - l, u = n * (1 - r), d = u + s * (1 - c), p = u + s * c, m = u + s;
    switch (l) {
      case 0:
        [o, a, i] = [m, p, u];
        break;
      case 1:
        [o, a, i] = [d, m, u];
        break;
      case 2:
        [o, a, i] = [u, m, p];
        break;
      case 3:
        [o, a, i] = [u, d, m];
        break;
      case 4:
        [o, a, i] = [p, u, m];
        break;
      case 5:
        [o, a, i] = [m, u, d];
        break;
    }
  }
  return [o, a, i, e.length > 3 ? e[3] : 1];
}, ay = (...e) => {
  const [t, r, n] = Ct(e, "rgb"), o = rp(t, r, n), a = np(t, r, n), i = a - o, s = i * 100 / 255, l = o / (255 - i) * 100;
  let c;
  return i === 0 ? c = Number.NaN : (t === a && (c = (r - n) / i), r === a && (c = 2 + (n - t) / i), n === a && (c = 4 + (t - r) / i), c *= 60, c < 0 && (c += 360)), [c, s, l];
};
Ce.prototype.hcg = function() {
  return ay(this._rgb);
};
const iy = (...e) => new Ce(...e, "hcg");
kt.hcg = iy;
Lt.format.hcg = oy;
Lt.autodetect.push({
  p: 1,
  test: (...e) => {
    if (e = Ct(e, "hcg"), Dt(e) === "array" && e.length === 3)
      return "hcg";
  }
});
const sy = (e, t, r) => wa(e, t, r, "hcg");
Fr.hcg = sy;
const { cos: ta } = Math, ly = (...e) => {
  e = Ct(e, "hsi");
  let [t, r, n] = e, o, a, i;
  return isNaN(t) && (t = 0), isNaN(r) && (r = 0), t > 360 && (t -= 360), t < 0 && (t += 360), t /= 360, t < 1 / 3 ? (i = (1 - r) / 3, o = (1 + r * ta(Hn * t) / ta(Nl - Hn * t)) / 3, a = 1 - (i + o)) : t < 2 / 3 ? (t -= 1 / 3, o = (1 - r) / 3, a = (1 + r * ta(Hn * t) / ta(Nl - Hn * t)) / 3, i = 1 - (o + a)) : (t -= 2 / 3, a = (1 - r) / 3, i = (1 + r * ta(Hn * t) / ta(Nl - Hn * t)) / 3, o = 1 - (a + i)), o = No(n * o * 3), a = No(n * a * 3), i = No(n * i * 3), [o * 255, a * 255, i * 255, e.length > 3 ? e[3] : 1];
}, { min: cy, sqrt: fy, acos: uy } = Math, dy = (...e) => {
  let [t, r, n] = Ct(e, "rgb");
  t /= 255, r /= 255, n /= 255;
  let o;
  const a = cy(t, r, n), i = (t + r + n) / 3, s = i > 0 ? 1 - a / i : 0;
  return s === 0 ? o = NaN : (o = (t - r + (t - n)) / 2, o /= fy((t - r) * (t - r) + (t - n) * (r - n)), o = uy(o), n > r && (o = Hn - o), o /= Hn), [o * 360, s, i];
};
Ce.prototype.hsi = function() {
  return dy(this._rgb);
};
const py = (...e) => new Ce(...e, "hsi");
kt.hsi = py;
Lt.format.hsi = ly;
Lt.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Ct(e, "hsi"), Dt(e) === "array" && e.length === 3)
      return "hsi";
  }
});
const my = (e, t, r) => wa(e, t, r, "hsi");
Fr.hsi = my;
const pc = (...e) => {
  e = Ct(e, "hsl");
  const [t, r, n] = e;
  let o, a, i;
  if (r === 0)
    o = a = i = n * 255;
  else {
    const s = [0, 0, 0], l = [0, 0, 0], c = n < 0.5 ? n * (1 + r) : n + r - n * r, u = 2 * n - c, d = t / 360;
    s[0] = d + 1 / 3, s[1] = d, s[2] = d - 1 / 3;
    for (let p = 0; p < 3; p++)
      s[p] < 0 && (s[p] += 1), s[p] > 1 && (s[p] -= 1), 6 * s[p] < 1 ? l[p] = u + (c - u) * 6 * s[p] : 2 * s[p] < 1 ? l[p] = c : 3 * s[p] < 2 ? l[p] = u + (c - u) * (2 / 3 - s[p]) * 6 : l[p] = u;
    [o, a, i] = [l[0] * 255, l[1] * 255, l[2] * 255];
  }
  return e.length > 3 ? [o, a, i, e[3]] : [o, a, i, 1];
}, dp = (...e) => {
  e = Ct(e, "rgba");
  let [t, r, n] = e;
  t /= 255, r /= 255, n /= 255;
  const o = rp(t, r, n), a = np(t, r, n), i = (a + o) / 2;
  let s, l;
  return a === o ? (s = 0, l = Number.NaN) : s = i < 0.5 ? (a - o) / (a + o) : (a - o) / (2 - a - o), t == a ? l = (r - n) / (a - o) : r == a ? l = 2 + (n - t) / (a - o) : n == a && (l = 4 + (t - r) / (a - o)), l *= 60, l < 0 && (l += 360), e.length > 3 && e[3] !== void 0 ? [l, s, i, e[3]] : [l, s, i];
};
Ce.prototype.hsl = function() {
  return dp(this._rgb);
};
const hy = (...e) => new Ce(...e, "hsl");
kt.hsl = hy;
Lt.format.hsl = pc;
Lt.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Ct(e, "hsl"), Dt(e) === "array" && e.length === 3)
      return "hsl";
  }
});
const yy = (e, t, r) => wa(e, t, r, "hsl");
Fr.hsl = yy;
const { floor: by } = Math, gy = (...e) => {
  e = Ct(e, "hsv");
  let [t, r, n] = e, o, a, i;
  if (n *= 255, r === 0)
    o = a = i = n;
  else {
    t === 360 && (t = 0), t > 360 && (t -= 360), t < 0 && (t += 360), t /= 60;
    const s = by(t), l = t - s, c = n * (1 - r), u = n * (1 - r * l), d = n * (1 - r * (1 - l));
    switch (s) {
      case 0:
        [o, a, i] = [n, d, c];
        break;
      case 1:
        [o, a, i] = [u, n, c];
        break;
      case 2:
        [o, a, i] = [c, n, d];
        break;
      case 3:
        [o, a, i] = [c, u, n];
        break;
      case 4:
        [o, a, i] = [d, c, n];
        break;
      case 5:
        [o, a, i] = [n, c, u];
        break;
    }
  }
  return [o, a, i, e.length > 3 ? e[3] : 1];
}, { min: Ay, max: vy } = Math, _y = (...e) => {
  e = Ct(e, "rgb");
  let [t, r, n] = e;
  const o = Ay(t, r, n), a = vy(t, r, n), i = a - o;
  let s, l, c;
  return c = a / 255, a === 0 ? (s = Number.NaN, l = 0) : (l = i / a, t === a && (s = (r - n) / i), r === a && (s = 2 + (n - t) / i), n === a && (s = 4 + (t - r) / i), s *= 60, s < 0 && (s += 360)), [s, l, c];
};
Ce.prototype.hsv = function() {
  return _y(this._rgb);
};
const wy = (...e) => new Ce(...e, "hsv");
kt.hsv = wy;
Lt.format.hsv = gy;
Lt.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Ct(e, "hsv"), Dt(e) === "array" && e.length === 3)
      return "hsv";
  }
});
const xy = (e, t, r) => wa(e, t, r, "hsv");
Fr.hsv = xy;
function ts(e, t) {
  let r = e.length;
  Array.isArray(e[0]) || (e = [e]), Array.isArray(t[0]) || (t = t.map((i) => [i]));
  let n = t[0].length, o = t[0].map((i, s) => t.map((l) => l[s])), a = e.map(
    (i) => o.map((s) => Array.isArray(i) ? i.reduce((l, c, u) => l + c * (s[u] || 0), 0) : s.reduce((l, c) => l + c * i, 0))
  );
  return r === 1 && (a = a[0]), n === 1 ? a.map((i) => i[0]) : a;
}
const Fc = (...e) => {
  e = Ct(e, "lab");
  const [t, r, n, ...o] = e, [a, i, s] = Ey([t, r, n]), [l, c, u] = sp(a, i, s);
  return [l, c, u, ...o.length > 0 && o[0] < 1 ? [o[0]] : []];
};
function Ey(e) {
  var t = [
    [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
    [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
    [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816]
  ], r = [
    [1, 0.3963377773761749, 0.2158037573099136],
    [1, -0.1055613458156586, -0.0638541728258133],
    [1, -0.0894841775298119, -1.2914855480194092]
  ], n = ts(r, e);
  return ts(
    t,
    n.map((o) => o ** 3)
  );
}
const $c = (...e) => {
  const [t, r, n, ...o] = Ct(e, "rgb"), a = lp(t, r, n);
  return [...Sy(a), ...o.length > 0 && o[0] < 1 ? [o[0]] : []];
};
function Sy(e) {
  const t = [
    [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
    [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
    [0.0481771893596242, 0.2642395317527308, 0.6335478284694309]
  ], r = [
    [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
    [1.9779985324311684, -2.42859224204858, 0.450593709617411],
    [0.0259040424655478, 0.7827717124575296, -0.8086757549230774]
  ], n = ts(t, e);
  return ts(
    r,
    n.map((o) => Math.cbrt(o))
  );
}
Ce.prototype.oklab = function() {
  return $c(this._rgb);
};
const ky = (...e) => new Ce(...e, "oklab");
Object.assign(kt, { oklab: ky });
Lt.format.oklab = Fc;
Lt.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Ct(e, "oklab"), Dt(e) === "array" && e.length === 3)
      return "oklab";
  }
});
const Ty = (e, t, r) => {
  const n = e.oklab(), o = t.oklab();
  return new Ce(
    n[0] + r * (o[0] - n[0]),
    n[1] + r * (o[1] - n[1]),
    n[2] + r * (o[2] - n[2]),
    "oklab"
  );
};
Fr.oklab = Ty;
const My = (e, t, r) => wa(e, t, r, "oklch");
Fr.oklch = My;
const { pow: Gl, sqrt: Fl, PI: $l, cos: ed, sin: td, atan2: Ly } = Math, Cy = (e, t = "lrgb", r = null) => {
  const n = e.length;
  r || (r = Array.from(new Array(n)).map(() => 1));
  const o = n / r.reduce(function(d, p) {
    return d + p;
  });
  if (r.forEach((d, p) => {
    r[p] *= o;
  }), e = e.map((d) => new Ce(d)), t === "lrgb")
    return Ry(e, r);
  const a = e.shift(), i = a.get(t), s = [];
  let l = 0, c = 0;
  for (let d = 0; d < i.length; d++)
    if (i[d] = (i[d] || 0) * r[0], s.push(isNaN(i[d]) ? 0 : r[0]), t.charAt(d) === "h" && !isNaN(i[d])) {
      const p = i[d] / 180 * $l;
      l += ed(p) * r[0], c += td(p) * r[0];
    }
  let u = a.alpha() * r[0];
  e.forEach((d, p) => {
    const m = d.get(t);
    u += d.alpha() * r[p + 1];
    for (let y = 0; y < i.length; y++)
      if (!isNaN(m[y]))
        if (s[y] += r[p + 1], t.charAt(y) === "h") {
          const L = m[y] / 180 * $l;
          l += ed(L) * r[p + 1], c += td(L) * r[p + 1];
        } else
          i[y] += m[y] * r[p + 1];
  });
  for (let d = 0; d < i.length; d++)
    if (t.charAt(d) === "h") {
      let p = Ly(c / s[d], l / s[d]) / $l * 180;
      for (; p < 0; ) p += 360;
      for (; p >= 360; ) p -= 360;
      i[d] = p;
    } else
      i[d] = i[d] / s[d];
  return u /= n, new Ce(i, t).alpha(u > 0.99999 ? 1 : u, !0);
}, Ry = (e, t) => {
  const r = e.length, n = [0, 0, 0, 0];
  for (let o = 0; o < e.length; o++) {
    const a = e[o], i = t[o] / r, s = a._rgb;
    n[0] += Gl(s[0], 2) * i, n[1] += Gl(s[1], 2) * i, n[2] += Gl(s[2], 2) * i, n[3] += s[3] * i;
  }
  return n[0] = Fl(n[0]), n[1] = Fl(n[1]), n[2] = Fl(n[2]), n[3] > 0.9999999 && (n[3] = 1), new Ce(Oc(n));
}, { pow: Iy } = Math;
function rs(e) {
  let t = "rgb", r = kt("#ccc"), n = 0, o = [0, 1], a = [], i = [0, 0], s = !1, l = [], c = !1, u = 0, d = 1, p = !1, m = {}, y = !0, L = 1;
  const x = function(N) {
    if (N = N || ["#fff", "#000"], N && Dt(N) === "string" && kt.brewer && kt.brewer[N.toLowerCase()] && (N = kt.brewer[N.toLowerCase()]), Dt(N) === "array") {
      N.length === 1 && (N = [N[0], N[0]]), N = N.slice(0);
      for (let ne = 0; ne < N.length; ne++)
        N[ne] = kt(N[ne]);
      a.length = 0;
      for (let ne = 0; ne < N.length; ne++)
        a.push(ne / (N.length - 1));
    }
    return j(), l = N;
  }, O = function(N) {
    if (s != null) {
      const ne = s.length - 1;
      let de = 0;
      for (; de < ne && N >= s[de]; )
        de++;
      return de - 1;
    }
    return 0;
  };
  let Y = (N) => N, R = (N) => N;
  const z = function(N, ne) {
    let de, oe;
    if (ne == null && (ne = !1), isNaN(N) || N === null)
      return r;
    ne ? oe = N : s && s.length > 2 ? oe = O(N) / (s.length - 2) : d !== u ? oe = (N - u) / (d - u) : oe = 1, oe = R(oe), ne || (oe = Y(oe)), L !== 1 && (oe = Iy(oe, L)), oe = i[0] + oe * (1 - i[0] - i[1]), oe = No(oe, 0, 1);
    const ge = Math.floor(oe * 1e4);
    if (y && m[ge])
      de = m[ge];
    else {
      if (Dt(l) === "array")
        for (let te = 0; te < a.length; te++) {
          const Ie = a[te];
          if (oe <= Ie) {
            de = l[te];
            break;
          }
          if (oe >= Ie && te === a.length - 1) {
            de = l[te];
            break;
          }
          if (oe > Ie && oe < a[te + 1]) {
            oe = (oe - Ie) / (a[te + 1] - Ie), de = kt.interpolate(
              l[te],
              l[te + 1],
              oe,
              t
            );
            break;
          }
        }
      else Dt(l) === "function" && (de = l(oe));
      y && (m[ge] = de);
    }
    return de;
  };
  var j = () => m = {};
  x(e);
  const I = function(N) {
    const ne = kt(z(N));
    return c && ne[c] ? ne[c]() : ne;
  };
  return I.classes = function(N) {
    if (N != null) {
      if (Dt(N) === "array")
        s = N, o = [N[0], N[N.length - 1]];
      else {
        const ne = kt.analyze(o);
        N === 0 ? s = [ne.min, ne.max] : s = kt.limits(ne, "e", N);
      }
      return I;
    }
    return s;
  }, I.domain = function(N) {
    if (!arguments.length)
      return o;
    u = N[0], d = N[N.length - 1], a = [];
    const ne = l.length;
    if (N.length === ne && u !== d)
      for (let de of Array.from(N))
        a.push((de - u) / (d - u));
    else {
      for (let de = 0; de < ne; de++)
        a.push(de / (ne - 1));
      if (N.length > 2) {
        const de = N.map((ge, te) => te / (N.length - 1)), oe = N.map((ge) => (ge - u) / (d - u));
        oe.every((ge, te) => de[te] === ge) || (R = (ge) => {
          if (ge <= 0 || ge >= 1) return ge;
          let te = 0;
          for (; ge >= oe[te + 1]; ) te++;
          const Ie = (ge - oe[te]) / (oe[te + 1] - oe[te]);
          return de[te] + Ie * (de[te + 1] - de[te]);
        });
      }
    }
    return o = [u, d], I;
  }, I.mode = function(N) {
    return arguments.length ? (t = N, j(), I) : t;
  }, I.range = function(N, ne) {
    return x(N), I;
  }, I.out = function(N) {
    return c = N, I;
  }, I.spread = function(N) {
    return arguments.length ? (n = N, I) : n;
  }, I.correctLightness = function(N) {
    return N == null && (N = !0), p = N, j(), p ? Y = function(ne) {
      const de = z(0, !0).lab()[0], oe = z(1, !0).lab()[0], ge = de > oe;
      let te = z(ne, !0).lab()[0];
      const Ie = de + (oe - de) * ne;
      let Ke = te - Ie, Ye = 0, it = 1, Xe = 20;
      for (; Math.abs(Ke) > 0.01 && Xe-- > 0; )
        (function() {
          return ge && (Ke *= -1), Ke < 0 ? (Ye = ne, ne += (it - ne) * 0.5) : (it = ne, ne += (Ye - ne) * 0.5), te = z(ne, !0).lab()[0], Ke = te - Ie;
        })();
      return ne;
    } : Y = (ne) => ne, I;
  }, I.padding = function(N) {
    return N != null ? (Dt(N) === "number" && (N = [N, N]), i = N, I) : i;
  }, I.colors = function(N, ne) {
    arguments.length < 2 && (ne = "hex");
    let de = [];
    if (arguments.length === 0)
      de = l.slice(0);
    else if (N === 1)
      de = [I(0.5)];
    else if (N > 1) {
      const oe = o[0], ge = o[1] - oe;
      de = Ny(0, N).map(
        (te) => I(oe + te / (N - 1) * ge)
      );
    } else {
      e = [];
      let oe = [];
      if (s && s.length > 2)
        for (let ge = 1, te = s.length, Ie = 1 <= te; Ie ? ge < te : ge > te; Ie ? ge++ : ge--)
          oe.push((s[ge - 1] + s[ge]) * 0.5);
      else
        oe = o;
      de = oe.map((ge) => I(ge));
    }
    return kt[ne] && (de = de.map((oe) => oe[ne]())), de;
  }, I.cache = function(N) {
    return N != null ? (y = N, I) : y;
  }, I.gamma = function(N) {
    return N != null ? (L = N, I) : L;
  }, I.nodata = function(N) {
    return N != null ? (r = kt(N), I) : r;
  }, I;
}
function Ny(e, t, r) {
  let n = [], o = e < t, a = t;
  for (let i = e; o ? i < a : i > a; o ? i++ : i--)
    n.push(i);
  return n;
}
const Oy = function(e) {
  let t = [1, 1];
  for (let r = 1; r < e; r++) {
    let n = [1];
    for (let o = 1; o <= t.length; o++)
      n[o] = (t[o] || 0) + t[o - 1];
    t = n;
  }
  return t;
}, Py = function(e) {
  let t, r, n, o;
  if (e = e.map((a) => new Ce(a)), e.length === 2)
    [r, n] = e.map((a) => a.lab()), t = function(a) {
      const i = [0, 1, 2].map((s) => r[s] + a * (n[s] - r[s]));
      return new Ce(i, "lab");
    };
  else if (e.length === 3)
    [r, n, o] = e.map((a) => a.lab()), t = function(a) {
      const i = [0, 1, 2].map(
        (s) => (1 - a) * (1 - a) * r[s] + 2 * (1 - a) * a * n[s] + a * a * o[s]
      );
      return new Ce(i, "lab");
    };
  else if (e.length === 4) {
    let a;
    [r, n, o, a] = e.map((i) => i.lab()), t = function(i) {
      const s = [0, 1, 2].map(
        (l) => (1 - i) * (1 - i) * (1 - i) * r[l] + 3 * (1 - i) * (1 - i) * i * n[l] + 3 * (1 - i) * i * i * o[l] + i * i * i * a[l]
      );
      return new Ce(s, "lab");
    };
  } else if (e.length >= 5) {
    let a, i, s;
    a = e.map((l) => l.lab()), s = e.length - 1, i = Oy(s), t = function(l) {
      const c = 1 - l, u = [0, 1, 2].map(
        (d) => a.reduce(
          (p, m, y) => p + i[y] * c ** (s - y) * l ** y * m[d],
          0
        )
      );
      return new Ce(u, "lab");
    };
  } else
    throw new RangeError("No point in running bezier with only one color.");
  return t;
}, Dy = (e) => {
  const t = Py(e);
  return t.scale = () => rs(t), t;
}, { round: pp } = Math;
Ce.prototype.rgb = function(e = !0) {
  return e === !1 ? this._rgb.slice(0, 3) : this._rgb.slice(0, 3).map(pp);
};
Ce.prototype.rgba = function(e = !0) {
  return this._rgb.slice(0, 4).map((t, r) => r < 3 ? e === !1 ? t : pp(t) : t);
};
const By = (...e) => new Ce(...e, "rgb");
Object.assign(kt, { rgb: By });
Lt.format.rgb = (...e) => {
  const t = Ct(e, "rgba");
  return t[3] === void 0 && (t[3] = 1), t;
};
Lt.autodetect.push({
  p: 3,
  test: (...e) => {
    if (e = Ct(e, "rgba"), Dt(e) === "array" && (e.length === 3 || e.length === 4 && Dt(e[3]) == "number" && e[3] >= 0 && e[3] <= 1))
      return "rgb";
  }
});
const _n = (e, t, r) => {
  if (!_n[r])
    throw new Error("unknown blend mode " + r);
  return _n[r](e, t);
}, ho = (e) => (t, r) => {
  const n = kt(r).rgb(), o = kt(t).rgb();
  return kt.rgb(e(n, o));
}, yo = (e) => (t, r) => {
  const n = [];
  return n[0] = e(t[0], r[0]), n[1] = e(t[1], r[1]), n[2] = e(t[2], r[2]), n;
}, Gy = (e) => e, Fy = (e, t) => e * t / 255, $y = (e, t) => e > t ? t : e, zy = (e, t) => e > t ? e : t, jy = (e, t) => 255 * (1 - (1 - e / 255) * (1 - t / 255)), qy = (e, t) => t < 128 ? 2 * e * t / 255 : 255 * (1 - 2 * (1 - e / 255) * (1 - t / 255)), Hy = (e, t) => 255 * (1 - (1 - t / 255) / (e / 255)), Uy = (e, t) => e === 255 ? 255 : (e = 255 * (t / 255) / (1 - e / 255), e > 255 ? 255 : e);
_n.normal = ho(yo(Gy));
_n.multiply = ho(yo(Fy));
_n.screen = ho(yo(jy));
_n.overlay = ho(yo(qy));
_n.darken = ho(yo($y));
_n.lighten = ho(yo(zy));
_n.dodge = ho(yo(Uy));
_n.burn = ho(yo(Hy));
const { pow: Vy, sin: Xy, cos: Wy } = Math;
function Yy(e = 300, t = -1.5, r = 1, n = 1, o = [0, 1]) {
  let a = 0, i;
  Dt(o) === "array" ? i = o[1] - o[0] : (i = 0, o = [o, o]);
  const s = function(l) {
    const c = Hn * ((e + 120) / 360 + t * l), u = Vy(o[0] + i * l, n), p = (a !== 0 ? r[0] + l * a : r) * u * (1 - u) / 2, m = Wy(c), y = Xy(c), L = u + p * (-0.14861 * m + 1.78277 * y), x = u + p * (-0.29227 * m - 0.90649 * y), O = u + p * (1.97294 * m);
    return kt(Oc([L * 255, x * 255, O * 255, 1]));
  };
  return s.start = function(l) {
    return l == null ? e : (e = l, s);
  }, s.rotations = function(l) {
    return l == null ? t : (t = l, s);
  }, s.gamma = function(l) {
    return l == null ? n : (n = l, s);
  }, s.hue = function(l) {
    return l == null ? r : (r = l, Dt(r) === "array" ? (a = r[1] - r[0], a === 0 && (r = r[1])) : a = 0, s);
  }, s.lightness = function(l) {
    return l == null ? o : (Dt(l) === "array" ? (o = l, i = l[1] - l[0]) : (o = [l, l], i = 0), s);
  }, s.scale = () => kt.scale(s), s.hue(r), s;
}
const Zy = "0123456789abcdef", { floor: Ky, random: Qy } = Math, Jy = () => {
  let e = "#";
  for (let t = 0; t < 6; t++)
    e += Zy.charAt(Ky(Qy() * 16));
  return new Ce(e, "hex");
}, { log: rd, pow: eb, floor: tb, abs: rb } = Math;
function mp(e, t = null) {
  const r = {
    min: Number.MAX_VALUE,
    max: Number.MAX_VALUE * -1,
    sum: 0,
    values: [],
    count: 0
  };
  return Dt(e) === "object" && (e = Object.values(e)), e.forEach((n) => {
    t && Dt(n) === "object" && (n = n[t]), n != null && !isNaN(n) && (r.values.push(n), r.sum += n, n < r.min && (r.min = n), n > r.max && (r.max = n), r.count += 1);
  }), r.domain = [r.min, r.max], r.limits = (n, o) => hp(r, n, o), r;
}
function hp(e, t = "equal", r = 7) {
  Dt(e) == "array" && (e = mp(e));
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
    const s = Math.LOG10E * rd(n), l = Math.LOG10E * rd(o);
    i.push(n);
    for (let c = 1; c < r; c++)
      i.push(eb(10, s + c / r * (l - s)));
    i.push(o);
  } else if (t.substr(0, 1) === "q") {
    i.push(n);
    for (let s = 1; s < r; s++) {
      const l = (a.length - 1) * s / r, c = tb(l);
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
    let d = !0, p = 0, m = null;
    m = [], m.push(n);
    for (let x = 1; x < r; x++)
      m.push(n + x / r * (o - n));
    for (m.push(o); d; ) {
      for (let O = 0; O < r; O++)
        u[O] = 0;
      for (let O = 0; O < l; O++) {
        const Y = a[O];
        let R = Number.MAX_VALUE, z;
        for (let j = 0; j < r; j++) {
          const I = rb(m[j] - Y);
          I < R && (R = I, z = j), u[z]++, c[O] = z;
        }
      }
      const x = new Array(r);
      for (let O = 0; O < r; O++)
        x[O] = null;
      for (let O = 0; O < l; O++)
        s = c[O], x[s] === null ? x[s] = a[O] : x[s] += a[O];
      for (let O = 0; O < r; O++)
        x[O] *= 1 / u[O];
      d = !1;
      for (let O = 0; O < r; O++)
        if (x[O] !== m[O]) {
          d = !0;
          break;
        }
      m = x, p++, p > 200 && (d = !1);
    }
    const y = {};
    for (let x = 0; x < r; x++)
      y[x] = [];
    for (let x = 0; x < l; x++)
      s = c[x], y[s].push(a[x]);
    let L = [];
    for (let x = 0; x < r; x++)
      L.push(y[x][0]), L.push(y[x][y[x].length - 1]);
    L = L.sort((x, O) => x - O), i.push(L[0]);
    for (let x = 1; x < L.length; x += 2) {
      const O = L[x];
      !isNaN(O) && i.indexOf(O) === -1 && i.push(O);
    }
  }
  return i;
}
const nb = (e, t) => {
  e = new Ce(e), t = new Ce(t);
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
const nd = 0.027, ob = 5e-4, ab = 0.1, od = 1.14, _i = 0.022, ad = 1.414, ib = (e, t) => {
  e = new Ce(e), t = new Ce(t), e.alpha() < 1 && (e = ha(t, e, e.alpha(), "rgb"));
  const r = id(...e.rgb()), n = id(...t.rgb()), o = r >= _i ? r : r + Math.pow(_i - r, ad), a = n >= _i ? n : n + Math.pow(_i - n, ad), i = Math.pow(a, 0.56) - Math.pow(o, 0.57), s = Math.pow(a, 0.65) - Math.pow(o, 0.62), l = Math.abs(a - o) < ob ? 0 : o < a ? i * od : s * od;
  return (Math.abs(l) < ab ? 0 : l > 0 ? l - nd : l + nd) * 100;
};
function id(e, t, r) {
  return 0.2126729 * Math.pow(e / 255, 2.4) + 0.7151522 * Math.pow(t / 255, 2.4) + 0.072175 * Math.pow(r / 255, 2.4);
}
const { sqrt: jn, pow: gr, min: sb, max: lb, atan2: sd, abs: ld, cos: wi, sin: cd, exp: cb, PI: fd } = Math;
function fb(e, t, r = 1, n = 1, o = 1) {
  var a = function(Pe) {
    return 360 * Pe / (2 * fd);
  }, i = function(Pe) {
    return 2 * fd * Pe / 360;
  };
  e = new Ce(e), t = new Ce(t);
  const [s, l, c] = Array.from(e.lab()), [u, d, p] = Array.from(t.lab()), m = (s + u) / 2, y = jn(gr(l, 2) + gr(c, 2)), L = jn(gr(d, 2) + gr(p, 2)), x = (y + L) / 2, O = 0.5 * (1 - jn(gr(x, 7) / (gr(x, 7) + gr(25, 7)))), Y = l * (1 + O), R = d * (1 + O), z = jn(gr(Y, 2) + gr(c, 2)), j = jn(gr(R, 2) + gr(p, 2)), I = (z + j) / 2, N = a(sd(c, Y)), ne = a(sd(p, R)), de = N >= 0 ? N : N + 360, oe = ne >= 0 ? ne : ne + 360, ge = ld(de - oe) > 180 ? (de + oe + 360) / 2 : (de + oe) / 2, te = 1 - 0.17 * wi(i(ge - 30)) + 0.24 * wi(i(2 * ge)) + 0.32 * wi(i(3 * ge + 6)) - 0.2 * wi(i(4 * ge - 63));
  let Ie = oe - de;
  Ie = ld(Ie) <= 180 ? Ie : oe <= de ? Ie + 360 : Ie - 360, Ie = 2 * jn(z * j) * cd(i(Ie) / 2);
  const Ke = u - s, Ye = j - z, it = 1 + 0.015 * gr(m - 50, 2) / jn(20 + gr(m - 50, 2)), Xe = 1 + 0.045 * I, Qe = 1 + 0.015 * I * te, xt = 30 * cb(-gr((ge - 275) / 25, 2)), ut = -(2 * jn(gr(I, 7) / (gr(I, 7) + gr(25, 7)))) * cd(2 * i(xt)), Pt = jn(
    gr(Ke / (r * it), 2) + gr(Ye / (n * Xe), 2) + gr(Ie / (o * Qe), 2) + ut * (Ye / (n * Xe)) * (Ie / (o * Qe))
  );
  return lb(0, sb(100, Pt));
}
function ub(e, t, r = "lab") {
  e = new Ce(e), t = new Ce(t);
  const n = e.get(r), o = t.get(r);
  let a = 0;
  for (let i in n) {
    const s = (n[i] || 0) - (o[i] || 0);
    a += s * s;
  }
  return Math.sqrt(a);
}
const db = (...e) => {
  try {
    return new Ce(...e), !0;
  } catch {
    return !1;
  }
}, pb = {
  cool() {
    return rs([kt.hsl(180, 1, 0.9), kt.hsl(250, 0.7, 0.4)]);
  },
  hot() {
    return rs(["#000", "#f00", "#ff0", "#fff"]).mode(
      "rgb"
    );
  }
}, mc = {
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
}, yp = Object.keys(mc), ud = new Map(yp.map((e) => [e.toLowerCase(), e])), mb = typeof Proxy == "function" ? new Proxy(mc, {
  get(e, t) {
    const r = t.toLowerCase();
    if (ud.has(r))
      return e[ud.get(r)];
  },
  getOwnPropertyNames() {
    return Object.getOwnPropertyNames(yp);
  }
}) : mc, hb = (...e) => {
  e = Ct(e, "cmyk");
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
}, { max: dd } = Math, yb = (...e) => {
  let [t, r, n] = Ct(e, "rgb");
  t = t / 255, r = r / 255, n = n / 255;
  const o = 1 - dd(t, dd(r, n)), a = o < 1 ? 1 / (1 - o) : 0, i = (1 - t - o) * a, s = (1 - r - o) * a, l = (1 - n - o) * a;
  return [i, s, l, o];
};
Ce.prototype.cmyk = function() {
  return yb(this._rgb);
};
const bb = (...e) => new Ce(...e, "cmyk");
Object.assign(kt, { cmyk: bb });
Lt.format.cmyk = hb;
Lt.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Ct(e, "cmyk"), Dt(e) === "array" && e.length === 4)
      return "cmyk";
  }
});
const gb = (...e) => {
  const t = Ct(e, "hsla");
  let r = _a(e) || "lsa";
  return t[0] = un(t[0] || 0) + "deg", t[1] = un(t[1] * 100) + "%", t[2] = un(t[2] * 100) + "%", r === "hsla" || t.length > 3 && t[3] < 1 ? (t[3] = "/ " + (t.length > 3 ? t[3] : 1), r = "hsla") : t.length = 3, `${r.substr(0, 3)}(${t.join(" ")})`;
}, Ab = (...e) => {
  const t = Ct(e, "lab");
  let r = _a(e) || "lab";
  return t[0] = un(t[0]) + "%", t[1] = un(t[1]), t[2] = un(t[2]), r === "laba" || t.length > 3 && t[3] < 1 ? t[3] = "/ " + (t.length > 3 ? t[3] : 1) : t.length = 3, `lab(${t.join(" ")})`;
}, vb = (...e) => {
  const t = Ct(e, "lch");
  let r = _a(e) || "lab";
  return t[0] = un(t[0]) + "%", t[1] = un(t[1]), t[2] = isNaN(t[2]) ? "none" : un(t[2]) + "deg", r === "lcha" || t.length > 3 && t[3] < 1 ? t[3] = "/ " + (t.length > 3 ? t[3] : 1) : t.length = 3, `lch(${t.join(" ")})`;
}, _b = (...e) => {
  const t = Ct(e, "lab");
  return t[0] = un(t[0] * 100) + "%", t[1] = dc(t[1]), t[2] = dc(t[2]), t.length > 3 && t[3] < 1 ? t[3] = "/ " + (t.length > 3 ? t[3] : 1) : t.length = 3, `oklab(${t.join(" ")})`;
}, bp = (...e) => {
  const [t, r, n, ...o] = Ct(e, "rgb"), [a, i, s] = $c(t, r, n), [l, c, u] = fp(a, i, s);
  return [l, c, u, ...o.length > 0 && o[0] < 1 ? [o[0]] : []];
}, wb = (...e) => {
  const t = Ct(e, "lch");
  return t[0] = un(t[0] * 100) + "%", t[1] = dc(t[1]), t[2] = isNaN(t[2]) ? "none" : un(t[2]) + "deg", t.length > 3 && t[3] < 1 ? t[3] = "/ " + (t.length > 3 ? t[3] : 1) : t.length = 3, `oklch(${t.join(" ")})`;
}, { round: zl } = Math, xb = (...e) => {
  const t = Ct(e, "rgba");
  let r = _a(e) || "rgb";
  if (r.substr(0, 3) === "hsl")
    return gb(dp(t), r);
  if (r.substr(0, 3) === "lab") {
    const n = u0();
    Wn("d50");
    const o = Ab(Dc(t), r);
    return Wn(n), o;
  }
  if (r.substr(0, 3) === "lch") {
    const n = u0();
    Wn("d50");
    const o = vb(Gc(t), r);
    return Wn(n), o;
  }
  return r.substr(0, 5) === "oklab" ? _b($c(t)) : r.substr(0, 5) === "oklch" ? wb(bp(t)) : (t[0] = zl(t[0]), t[1] = zl(t[1]), t[2] = zl(t[2]), (r === "rgba" || t.length > 3 && t[3] < 1) && (t[3] = "/ " + (t.length > 3 ? t[3] : 1), r = "rgba"), `${r.substr(0, 3)}(${t.slice(0, r === "rgb" ? 3 : 4).join(" ")})`);
}, gp = (...e) => {
  e = Ct(e, "lch");
  const [t, r, n, ...o] = e, [a, i, s] = cp(t, r, n), [l, c, u] = Fc(a, i, s);
  return [l, c, u, ...o.length > 0 && o[0] < 1 ? [o[0]] : []];
}, Yn = /((?:-?\d+)|(?:-?\d+(?:\.\d+)?)%|none)/.source, An = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)%?)|none)/.source, ns = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)%)|none)/.source, dn = /\s*/.source, xa = /\s+/.source, zc = /\s*,\s*/.source, ys = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)(?:deg)?)|none)/.source, Ea = /\s*(?:\/\s*((?:[01]|[01]?\.\d+)|\d+(?:\.\d+)?%))?/.source, Ap = new RegExp(
  "^rgba?\\(" + dn + [Yn, Yn, Yn].join(xa) + Ea + "\\)$"
), vp = new RegExp(
  "^rgb\\(" + dn + [Yn, Yn, Yn].join(zc) + dn + "\\)$"
), _p = new RegExp(
  "^rgba\\(" + dn + [Yn, Yn, Yn, An].join(zc) + dn + "\\)$"
), wp = new RegExp(
  "^hsla?\\(" + dn + [ys, ns, ns].join(xa) + Ea + "\\)$"
), xp = new RegExp(
  "^hsl?\\(" + dn + [ys, ns, ns].join(zc) + dn + "\\)$"
), Ep = /^hsla\(\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)$/, Sp = new RegExp(
  "^lab\\(" + dn + [An, An, An].join(xa) + Ea + "\\)$"
), kp = new RegExp(
  "^lch\\(" + dn + [An, An, ys].join(xa) + Ea + "\\)$"
), Tp = new RegExp(
  "^oklab\\(" + dn + [An, An, An].join(xa) + Ea + "\\)$"
), Mp = new RegExp(
  "^oklch\\(" + dn + [An, An, ys].join(xa) + Ea + "\\)$"
), { round: Lp } = Math, ra = (e) => e.map((t, r) => r <= 2 ? No(Lp(t), 0, 255) : t), Ar = (e, t = 0, r = 100, n = !1) => (typeof e == "string" && e.endsWith("%") && (e = parseFloat(e.substring(0, e.length - 1)) / 100, n ? e = t + (e + 1) * 0.5 * (r - t) : e = t + e * (r - t)), +e), $r = (e, t) => e === "none" ? t : e, jc = (e) => {
  if (e = e.toLowerCase().trim(), e === "transparent")
    return [0, 0, 0, 0];
  let t;
  if (Lt.format.named)
    try {
      return Lt.format.named(e);
    } catch {
    }
  if ((t = e.match(Ap)) || (t = e.match(vp))) {
    let r = t.slice(1, 4);
    for (let o = 0; o < 3; o++)
      r[o] = +Ar($r(r[o], 0), 0, 255);
    r = ra(r);
    const n = t[4] !== void 0 ? +Ar(t[4], 0, 1) : 1;
    return r[3] = n, r;
  }
  if (t = e.match(_p)) {
    const r = t.slice(1, 5);
    for (let n = 0; n < 4; n++)
      r[n] = +Ar(r[n], 0, 255);
    return r;
  }
  if ((t = e.match(wp)) || (t = e.match(xp))) {
    const r = t.slice(1, 4);
    r[0] = +$r(r[0].replace("deg", ""), 0), r[1] = +Ar($r(r[1], 0), 0, 100) * 0.01, r[2] = +Ar($r(r[2], 0), 0, 100) * 0.01;
    const n = ra(pc(r)), o = t[4] !== void 0 ? +Ar(t[4], 0, 1) : 1;
    return n[3] = o, n;
  }
  if (t = e.match(Ep)) {
    const r = t.slice(1, 4);
    r[1] *= 0.01, r[2] *= 0.01;
    const n = pc(r);
    for (let o = 0; o < 3; o++)
      n[o] = Lp(n[o]);
    return n[3] = +t[4], n;
  }
  if (t = e.match(Sp)) {
    const r = t.slice(1, 4);
    r[0] = Ar($r(r[0], 0), 0, 100), r[1] = Ar($r(r[1], 0), -125, 125, !0), r[2] = Ar($r(r[2], 0), -125, 125, !0);
    const n = u0();
    Wn("d50");
    const o = ra(Pc(r));
    Wn(n);
    const a = t[4] !== void 0 ? +Ar(t[4], 0, 1) : 1;
    return o[3] = a, o;
  }
  if (t = e.match(kp)) {
    const r = t.slice(1, 4);
    r[0] = Ar(r[0], 0, 100), r[1] = Ar($r(r[1], 0), 0, 150, !1), r[2] = +$r(r[2].replace("deg", ""), 0);
    const n = u0();
    Wn("d50");
    const o = ra(Bc(r));
    Wn(n);
    const a = t[4] !== void 0 ? +Ar(t[4], 0, 1) : 1;
    return o[3] = a, o;
  }
  if (t = e.match(Tp)) {
    const r = t.slice(1, 4);
    r[0] = Ar($r(r[0], 0), 0, 1), r[1] = Ar($r(r[1], 0), -0.4, 0.4, !0), r[2] = Ar($r(r[2], 0), -0.4, 0.4, !0);
    const n = ra(Fc(r)), o = t[4] !== void 0 ? +Ar(t[4], 0, 1) : 1;
    return n[3] = o, n;
  }
  if (t = e.match(Mp)) {
    const r = t.slice(1, 4);
    r[0] = Ar($r(r[0], 0), 0, 1), r[1] = Ar($r(r[1], 0), 0, 0.4, !1), r[2] = +$r(r[2].replace("deg", ""), 0);
    const n = ra(gp(r)), o = t[4] !== void 0 ? +Ar(t[4], 0, 1) : 1;
    return n[3] = o, n;
  }
};
jc.test = (e) => (
  // modern
  Ap.test(e) || wp.test(e) || Sp.test(e) || kp.test(e) || Tp.test(e) || Mp.test(e) || // legacy
  vp.test(e) || _p.test(e) || xp.test(e) || Ep.test(e) || e === "transparent"
);
Ce.prototype.css = function(e) {
  return xb(this._rgb, e);
};
const Eb = (...e) => new Ce(...e, "css");
kt.css = Eb;
Lt.format.css = jc;
Lt.autodetect.push({
  p: 5,
  test: (e, ...t) => {
    if (!t.length && Dt(e) === "string" && jc.test(e))
      return "css";
  }
});
Lt.format.gl = (...e) => {
  const t = Ct(e, "rgba");
  return t[0] *= 255, t[1] *= 255, t[2] *= 255, t;
};
const Sb = (...e) => new Ce(...e, "gl");
kt.gl = Sb;
Ce.prototype.gl = function() {
  const e = this._rgb;
  return [e[0] / 255, e[1] / 255, e[2] / 255, e[3]];
};
Ce.prototype.hex = function(e) {
  return ip(this._rgb, e);
};
const kb = (...e) => new Ce(...e, "hex");
kt.hex = kb;
Lt.format.hex = ap;
Lt.autodetect.push({
  p: 4,
  test: (e, ...t) => {
    if (!t.length && Dt(e) === "string" && [3, 4, 5, 6, 7, 8, 9].indexOf(e.length) >= 0)
      return "hex";
  }
});
const { log: xi } = Math, Cp = (e) => {
  const t = e / 100;
  let r, n, o;
  return t < 66 ? (r = 255, n = t < 6 ? 0 : -155.25485562709179 - 0.44596950469579133 * (n = t - 2) + 104.49216199393888 * xi(n), o = t < 20 ? 0 : -254.76935184120902 + 0.8274096064007395 * (o = t - 10) + 115.67994401066147 * xi(o)) : (r = 351.97690566805693 + 0.114206453784165 * (r = t - 55) - 40.25366309332127 * xi(r), n = 325.4494125711974 + 0.07943456536662342 * (n = t - 50) - 28.0852963507957 * xi(n), o = 255), [r, n, o, 1];
}, { round: Tb } = Math, Mb = (...e) => {
  const t = Ct(e, "rgb"), r = t[0], n = t[2];
  let o = 1e3, a = 4e4;
  const i = 0.4;
  let s;
  for (; a - o > i; ) {
    s = (a + o) * 0.5;
    const l = Cp(s);
    l[2] / l[0] >= n / r ? a = s : o = s;
  }
  return Tb(s);
};
Ce.prototype.temp = Ce.prototype.kelvin = Ce.prototype.temperature = function() {
  return Mb(this._rgb);
};
const jl = (...e) => new Ce(...e, "temp");
Object.assign(kt, { temp: jl, kelvin: jl, temperature: jl });
Lt.format.temp = Lt.format.kelvin = Lt.format.temperature = Cp;
Ce.prototype.oklch = function() {
  return bp(this._rgb);
};
const Lb = (...e) => new Ce(...e, "oklch");
Object.assign(kt, { oklch: Lb });
Lt.format.oklch = gp;
Lt.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Ct(e, "oklch"), Dt(e) === "array" && e.length === 3)
      return "oklch";
  }
});
Object.assign(kt, {
  analyze: mp,
  average: Cy,
  bezier: Dy,
  blend: _n,
  brewer: mb,
  Color: Ce,
  colors: ma,
  contrast: nb,
  contrastAPCA: ib,
  cubehelix: Yy,
  deltaE: fb,
  distance: ub,
  input: Lt,
  interpolate: ha,
  limits: hp,
  mix: ha,
  random: Jy,
  scale: rs,
  scales: pb,
  valid: db
});
const pd = (e) => {
  let t;
  const r = /* @__PURE__ */ new Set(), n = (c, u) => {
    const d = typeof c == "function" ? c(t) : c;
    if (!Object.is(d, t)) {
      const p = t;
      t = u ?? (typeof d != "object" || d === null) ? d : Object.assign({}, t, d), r.forEach((m) => m(t, p));
    }
  }, o = () => t, s = { setState: n, getState: o, getInitialState: () => l, subscribe: (c) => (r.add(c), () => r.delete(c)) }, l = t = e(n, o, s);
  return s;
}, qc = (e) => e ? pd(e) : pd, Cb = (e) => e;
function Do(e, t = Cb) {
  const r = Ai.useSyncExternalStore(
    e.subscribe,
    Ai.useCallback(() => t(e.getState()), [e, t]),
    Ai.useCallback(() => t(e.getInitialState()), [e, t])
  );
  return Ai.useDebugValue(r), r;
}
const hc = 1e-6, jr = Math.PI / 180, Sr = 180 / Math.PI;
function yc(e) {
  return e >= 0 ? Math.round(e) : e % 0.5 === 0 ? Math.floor(e) : Math.round(e);
}
function Rb(e, t = 2) {
  return "[" + e.map((n) => Ib(n, t)).join(", ") + "]";
}
function Ib(e, t = 2) {
  return e.toFixed(t).replace(/\.([\d]*?)(0+)$/g, ".$1").replace(/\.$/g, "");
}
var Zt;
(function(e) {
  function t(...Q) {
    return Q.reduce((Be, V) => Be + V, 0);
  }
  e.add = t;
  function r(...Q) {
    return Q.length === 0 ? 0 : Q.length === 1 ? -Q[0] : Q.reduce((Be, V) => Be - V);
  }
  e.subtract = r, e.sub = r;
  function n(...Q) {
    return Q.reduce((Be, V) => Be * V, 1);
  }
  e.multiply = n, e.mul = n;
  function o(...Q) {
    return Q.length === 0 ? 1 : Q.length === 1 ? 1 / Q[0] : Q.reduce((Be, V) => Be / V);
  }
  e.divide = o, e.div = o, e.round = yc, e.ceil = Math.ceil, e.floor = Math.floor, e.sign = Math.sign, e.abs = Math.abs;
  function a(Q) {
    return Q < 0 ? Math.ceil(Q) : Math.floor(Q);
  }
  e.trunc = a;
  function i(Q) {
    return Q - e.floor(Q);
  }
  e.fract = i;
  function s(Q, Be) {
    return Q - Be * e.floor(Q / Be);
  }
  e.mod = s;
  function l(Q, Be, V = 0) {
    return Be === 0 ? Q : Math.round((Q - V) / Be) * Be + V;
  }
  e.quantize = l, e.min = Math.min, e.max = Math.max;
  function c(Q, Be, V) {
    return Math.max(Be, Math.min(V, Q));
  }
  e.clamp = c;
  function u(Q, Be) {
    return Q * Be;
  }
  e.scale = u;
  function d(...Q) {
    let Be = 0;
    const V = 1 / (Q.length || 1);
    for (const Ge of Q)
      Be += Ge;
    return Be / V;
  }
  e.average = d, e.avg = d;
  function p(Q, Be, V) {
    return Q + Be * V;
  }
  e.scaleAndAdd = p;
  function m(Q, Be) {
    return Math.abs(Q - Be);
  }
  e.distance = m, e.dist = m;
  function y(Q, Be) {
    return (Q - Be) ** 2;
  }
  e.squaredDistance = y, e.sqrDist = y, e.length = Math.abs, e.len = e.length;
  function L(Q) {
    return Q ** 2;
  }
  e.squaredLength = L, e.sqrLen = L;
  function x(Q) {
    return -Q;
  }
  e.negate = x;
  function O(Q) {
    return 1 / Q;
  }
  e.invert = O;
  function Y(Q) {
    return 1 - Q;
  }
  e.oneMinus = Y, e.normalize = Math.sign;
  function R(Q, Be, V) {
    return Q + (Be - Q) * V;
  }
  e.lerp = R, e.mix = R;
  function z(Q, Be, V) {
    return Q === Be ? 0.5 : (V - Q) / (Be - Q);
  }
  e.inverseLerp = z, e.invlerp = z;
  function j(Q, Be, V, Ge, vt) {
    if (V === Be)
      return R(Ge, vt, 0.5);
    const jt = c((Q - Be) / (V - Be), 0, 1);
    return R(Ge, vt, jt);
  }
  e.fit = j;
  function I(Q, Be, V, Ge, vt) {
    if (V === Be)
      return R(Ge, vt, 0.5);
    const jt = (Q - Be) / (V - Be);
    return R(Ge, vt, jt);
  }
  e.efit = I;
  function N(Q, Be) {
    return Be < Q ? 0 : 1;
  }
  e.step = N;
  function ne(Q, Be, V) {
    const Ge = c((V - Q) / (Be - Q), 0, 1);
    return Ge * Ge * (3 - 2 * Ge);
  }
  e.smoothstep = ne;
  function de(Q) {
    return Q * 180 / Math.PI;
  }
  e.degrees = de, e.deg = de;
  function oe(Q) {
    return Q * Math.PI / 180;
  }
  e.radians = oe, e.rad = oe;
  function ge(Q) {
    return Math.sin(Q * jr);
  }
  e.sin = ge;
  function te(Q) {
    return Math.cos(Q * jr);
  }
  e.cos = te;
  function Ie(Q) {
    return Math.tan(Q * jr);
  }
  e.tan = Ie;
  function Ke(Q) {
    return Math.asin(Q) * Sr;
  }
  e.asin = Ke;
  function Ye(Q) {
    return Math.acos(Q) * Sr;
  }
  e.acos = Ye;
  function it(Q, Be) {
    return Be === void 0 ? Math.atan(Q) * Sr : Math.atan2(Q, Be) * Sr;
  }
  e.atan = it;
  function Xe(Q, Be) {
    return Math.atan2(Q, Be) * Sr;
  }
  e.atan2 = Xe, e.pow = Math.exp, e.exp = Math.exp, e.log = Math.log;
  function Qe(Q) {
    return 2 ** Q;
  }
  e.exp2 = Qe, e.log2 = Math.log2, e.sqrt = Math.sqrt;
  function xt(Q) {
    return 1 / Math.sqrt(Q);
  }
  e.inverseSqrt = xt, e.invsqrt = xt;
  function nt(Q, Be = 1) {
    return Q /= Be, Q === 1 ? 1 : Q < 0 ? (1 + Q % 1) % 1 : Q % 1;
  }
  e.sawtooth = nt, e.ramp = nt;
  function ut(Q, Be = 1) {
    return Q /= Be, 1 - Math.abs(1 - 2 * (Math.abs(Q) % 1));
  }
  e.triangle = ut;
  function Pt(Q, Be = 1) {
    return Q = Q * Math.PI * 2 / Be, (-Math.cos(Q) + 1) / 2;
  }
  e.coswave = Pt;
  function Pe(Q, Be = 1) {
    return Q = Q * Math.PI * 2 / Be, (-Math.sin(Q) + 1) / 2;
  }
  e.sinwave = Pe;
  function Ot(Q, Be) {
    return Math.abs(Q - Be) <= hc * Math.max(1, Math.abs(Q), Math.abs(Be));
  }
  e.approxEquals = Ot, e.approx = Ot, e.equals = Ot;
})(Zt || (Zt = {}));
var $t;
(function(e) {
  function t(T, Z = T) {
    return [T, Z];
  }
  e.of = t;
  function r(T) {
    return [...T];
  }
  e.clone = r, e.zero = Object.freeze([0, 0]), e.one = Object.freeze([1, 1]), e.unitX = Object.freeze([1, 0]), e.unitY = Object.freeze([0, 1]);
  function n(...T) {
    let Z = 0, Ae = 0;
    for (const rt of T)
      Z += rt[0], Ae += rt[1];
    return [Z, Ae];
  }
  e.add = n;
  function o(...T) {
    if (T.length === 0)
      return e.zero;
    if (T.length === 1)
      return [-T[0][0], -T[0][1]];
    const [Z, ...Ae] = T;
    let [rt, Tt] = typeof Z == "number" ? [Z, Z] : [...Z];
    for (const or of Ae)
      rt -= or[0], Tt -= or[1];
    return [rt, Tt];
  }
  e.subtract = o, e.sub = o;
  function a(T, Z) {
    return [Z[0] - T[0], Z[1] - T[1]];
  }
  e.delta = a;
  function i(...T) {
    let Z = 1, Ae = 1;
    for (const rt of T)
      Z *= rt[0], Ae *= rt[1];
    return [Z, Ae];
  }
  e.multiply = i, e.mul = i;
  function s(...T) {
    if (T.length === 0)
      return e.one;
    if (T.length === 1)
      return [1 / T[0][0], 1 / T[0][1]];
    const [Z, ...Ae] = T;
    let [rt, Tt] = Z;
    for (const or of Ae)
      rt /= or[0], Tt /= or[1];
    return [rt, Tt];
  }
  e.divide = s, e.div = s;
  function l(...T) {
    if (T.length === 0)
      return [1 / 0, 1 / 0];
    if (T.length === 1)
      return T[0];
    if (T.length > 2) {
      const [rt, Tt, ...or] = T;
      return l(l(rt, Tt), ...or);
    }
    const [Z, Ae] = T;
    return [Math.min(Z[0], Ae[0]), Math.min(Z[1], Ae[1])];
  }
  e.min = l;
  function c(...T) {
    if (T.length === 0)
      return [-1 / 0, -1 / 0];
    if (T.length === 1)
      return T[0];
    if (T.length > 2) {
      const [rt, Tt, ...or] = T;
      return c(c(rt, Tt), ...or);
    }
    const [Z, Ae] = T;
    return [Math.max(Z[0], Ae[0]), Math.max(Z[1], Ae[1])];
  }
  e.max = c;
  function u(T, Z, Ae) {
    return typeof Z == "number" && (Z = [Z, Z]), typeof Ae == "number" && (Ae = [Ae, Ae]), [
      Math.min(Math.max(T[0], Z[0]), Ae[0]),
      Math.min(Math.max(T[1], Z[1]), Ae[1])
    ];
  }
  e.clamp = u;
  function d(T) {
    return [Math.abs(T[0]), Math.abs(T[1])];
  }
  e.abs = d;
  function p(T) {
    return [yc(T[0]), yc(T[1])];
  }
  e.round = p;
  function m(T) {
    return [Math.ceil(T[0]), Math.ceil(T[1])];
  }
  e.ceil = m;
  function y(T) {
    return [Math.floor(T[0]), Math.floor(T[1])];
  }
  e.floor = y;
  function L(T) {
    return [Math.sign(T[0]), Math.sign(T[1])];
  }
  e.sign = L;
  function x(T) {
    return [
      T[0] < 0 ? Math.ceil(T[0]) : Math.floor(T[0]),
      T[1] < 0 ? Math.ceil(T[1]) : Math.floor(T[1])
    ];
  }
  e.trunc = x;
  function O(T) {
    return e.sub(T, y(T));
  }
  e.fract = O;
  function Y(T, Z) {
    return typeof Z == "number" && (Z = [Z, Z]), [
      T[0] - Z[0] * Math.floor(T[0] / Z[0]),
      T[1] - Z[1] * Math.floor(T[1] / Z[1])
    ];
  }
  e.mod = Y;
  function R(T, Z, Ae = e.zero) {
    return typeof Z == "number" && (Z = [Z, Z]), typeof Ae == "number" && (Ae = [Ae, Ae]), [
      Zt.quantize(T[0], Z[0], Ae[0]),
      Zt.quantize(T[1], Z[1], Ae[1])
    ];
  }
  e.quantize = R;
  function z(T, Z) {
    return [T[0] * Z, T[1] * Z];
  }
  e.scale = z;
  function j(...T) {
    let Z = 0, Ae = 0;
    const rt = T.length || 1;
    for (const Tt of T)
      Z += Tt[0], Ae += Tt[1];
    return [Z / rt, Ae / rt];
  }
  e.average = j, e.avg = j;
  function I(T, Z, Ae) {
    return [T[0] + Z[0] * Ae, T[1] + Z[1] * Ae];
  }
  e.scaleAndAdd = I;
  function N(T, Z) {
    const Ae = Z[0] - T[0], rt = Z[1] - T[1];
    return Math.hypot(Ae, rt);
  }
  e.distance = N, e.dist = N;
  function ne(T, Z) {
    const Ae = Z[0] - T[0], rt = Z[1] - T[1];
    return Ae * Ae + rt * rt;
  }
  e.squaredDistance = ne, e.sqrDist = ne;
  function de(T) {
    return Math.hypot(T[0], T[1]);
  }
  e.length = de, e.len = de;
  function oe(T) {
    return T[0] ** 2 + T[1] ** 2;
  }
  e.squaredLength = oe, e.sqrLen = oe;
  function ge(T) {
    return [-T[0], -T[1]];
  }
  e.negate = ge, e.neg = ge;
  function te(T) {
    return [1 / T[0], 1 / T[1]];
  }
  e.invert = te, e.inv = te;
  function Ie(T) {
    return o(e.one, T);
  }
  e.oneMinus = Ie;
  function Ke(T) {
    const Ae = T[0] === 0 && T[1] === 0 ? 0 : 1 / Math.hypot(T[0], T[1]);
    return [T[0] * Ae, T[1] * Ae];
  }
  e.normalize = Ke;
  function Ye(T, Z) {
    return T[0] * Z[0] + T[1] * Z[1];
  }
  e.dot = Ye;
  function it(T, Z) {
    return [0, 0, T[0] * Z[1] - T[1] * Z[0]];
  }
  e.cross = it;
  function Xe(T, Z, Ae) {
    return typeof Ae == "number" && (Ae = [Ae, Ae]), [T[0] + Ae[0] * (Z[0] - T[0]), T[1] + Ae[1] * (Z[1] - T[1])];
  }
  e.lerp = Xe, e.mix = Xe;
  function Qe(T, Z, Ae) {
    return [
      T[0] === Z[0] ? 0.5 : (Ae[0] - T[0]) / (Z[0] - T[0]),
      T[1] === Z[1] ? 0.5 : (Ae[1] - T[1]) / (Z[1] - T[1])
    ];
  }
  e.inverseLerp = Qe, e.invlerp = Qe;
  function xt(T, Z, Ae, rt, Tt) {
    return [
      Zt.fit(T[0], Z[0], Ae[0], rt[0], Tt[0]),
      Zt.fit(T[1], Z[1], Ae[1], rt[1], Tt[1])
    ];
  }
  e.fit = xt;
  function nt(T, Z, Ae, rt, Tt) {
    return [
      Zt.efit(T[0], Z[0], Ae[0], rt[0], Tt[0]),
      Zt.efit(T[1], Z[1], Ae[1], rt[1], Tt[1])
    ];
  }
  e.efit = nt;
  function ut(T, Z) {
    const [Ae, rt] = T;
    return [
      Z[0] * Ae + Z[2] * rt,
      //
      Z[1] * Ae + Z[3] * rt
    ];
  }
  e.transformMat2 = ut;
  function Pt(T, Z) {
    const [Ae, rt] = T;
    return [
      Z[0] * Ae + Z[2] * rt + Z[4],
      //
      Z[1] * Ae + Z[3] * rt + Z[5]
    ];
  }
  e.transformMat2d = Pt;
  function Pe(T, Z) {
    const [Ae, rt] = T;
    return [
      Z[0] * Ae + Z[3] * rt + Z[6],
      //
      Z[1] * Ae + Z[4] * rt + Z[7]
    ];
  }
  e.transformMat3 = Pe;
  function Ot(T, Z, Ae = e.zero) {
    const rt = T[0] - Ae[0], Tt = T[1] - Ae[1], or = Math.sin(Z * jr), Zr = Math.cos(Z * jr);
    return [
      rt * Zr - Tt * or + Ae[0],
      //
      rt * or + Tt * Zr + Ae[1]
      //
    ];
  }
  e.rotate = Ot;
  function Q(T, Z = !0, Ae) {
    if (Ae) {
      const [rt, Tt] = o(T, Ae);
      return Z ? n(Ae, [-Tt, rt]) : n(Ae, [Tt, -rt]);
    } else
      return Z ? [-T[1], T[0]] : [T[1], -T[0]];
  }
  e.rotate90 = Q;
  function Be(T, Z) {
    if (!Z)
      return Math.atan2(T[1], T[0]) * Sr;
    if (e.eq(T, Z))
      return 0;
    const [Ae, rt] = T, [Tt, or] = Z, Zr = Math.hypot(Ae, rt) * Math.hypot(Tt, or);
    if (Zr === 0)
      return 0;
    const Nr = Ae * or - rt * Tt >= 0 ? 1 : -1, bo = Math.acos(Zt.clamp(Ye(T, Z) / Zr, -1, 1)), pn = Nr * bo * Sr;
    return pn <= -180 ? pn + 360 : pn;
  }
  e.angle = Be;
  function V(T, Z = 1, Ae = e.zero) {
    return [
      Math.cos(T * jr) * Z + Ae[0],
      Math.sin(T * jr) * Z + Ae[1]
    ];
  }
  e.direction = V, e.dir = V;
  function Ge(T, Z) {
    return typeof T == "number" && (T = [T, T]), [Z[0] < T[0] ? 0 : 1, Z[1] < T[1] ? 0 : 1];
  }
  e.step = Ge;
  function vt(T, Z, Ae) {
    const rt = Zt.clamp((Ae[0] - T[0]) / (Z[0] - T[0]), 0, 1), Tt = Zt.clamp((Ae[1] - Z[1]) / (Z[1] - Z[1]), 0, 1);
    return [
      rt * rt * (3 - 2 * rt),
      //
      Tt * Tt * (3 - 2 * Tt)
    ];
  }
  e.smoothstep = vt;
  function jt(T) {
    return [
      T[0] * Sr,
      //
      T[1] * Sr
    ];
  }
  e.degrees = jt, e.deg = jt;
  function er(T) {
    return [
      T[0] * jr,
      //
      T[1] * jr
    ];
  }
  e.radians = er, e.rad = er;
  function ht(T) {
    return [
      Math.sin(T[0] * jr),
      //
      Math.sin(T[1] * jr)
    ];
  }
  e.sin = ht;
  function pt(T) {
    return [
      Math.cos(T[0] * jr),
      //
      Math.cos(T[1] * jr)
    ];
  }
  e.cos = pt;
  function Rt(T) {
    return [
      Math.tan(T[0] * jr),
      //
      Math.tan(T[1] * jr)
    ];
  }
  e.tan = Rt;
  function We(T) {
    return [
      Math.asin(T[0]) * Sr,
      //
      Math.asin(T[1]) * Sr
    ];
  }
  e.asin = We;
  function Et(T) {
    return [
      Math.acos(T[0] * Sr),
      //
      Math.acos(T[1] * Sr)
    ];
  }
  e.acos = Et;
  function Gt(T, Z) {
    return Z === void 0 ? [
      Math.atan(T[0]) * Sr,
      //
      Math.atan(T[1]) * Sr
    ] : [
      Math.atan2(T[0], Z[0]) * Sr,
      //
      Math.atan2(T[1], Z[1]) * Sr
    ];
  }
  e.atan = Gt;
  function bt(T, Z) {
    return [
      Math.atan2(T[0], Z[0]) * Sr,
      //
      Math.atan2(T[1], Z[1]) * Sr
    ];
  }
  e.atan2 = bt;
  function Fe(T, Z) {
    return [Math.pow(T[0], Z[0]), Math.pow(T[1], Z[1])];
  }
  e.pow = Fe;
  function st(T) {
    return [Math.exp(T[0]), Math.exp(T[1])];
  }
  e.exp = st;
  function Ut(T) {
    return [Math.log(T[0]), Math.log(T[1])];
  }
  e.log = Ut;
  function tr(T) {
    return [2 ** T[0], 2 ** T[1]];
  }
  e.exp2 = tr;
  function g(T) {
    return [Math.log2(T[0]), Math.log2(T[1])];
  }
  e.log2 = g;
  function tn(T) {
    return [Math.sqrt(T[0]), Math.sqrt(T[1])];
  }
  e.sqrt = tn;
  function rn(T) {
    return [1 / Math.sqrt(T[0]), 1 / Math.sqrt(T[1])];
  }
  e.inverseSqrt = rn, e.invsqrt = rn;
  function wr(T, Z) {
    return T[0] === Z[0] && T[1] === Z[1];
  }
  e.exactEquals = wr, e.eq = wr;
  function Tr(T, Z) {
    const [Ae, rt] = T, [Tt, or] = Z;
    return Math.abs(Ae - Tt) <= hc * Math.max(1, Math.abs(Ae), Math.abs(Tt)) && Math.abs(rt - or) <= hc * Math.max(1, Math.abs(rt), Math.abs(or));
  }
  e.approxEquals = Tr, e.approx = Tr, e.equals = Tr, e.toString = Rb;
})($t || ($t = {}));
function md(e, t) {
  return typeof e == "function" ? e() : e ?? t;
}
function Nb(e, {
  disabled: t,
  lockPointer: r = !1,
  pointerType: n = ["mouse", "pen", "touch"],
  dragDelaySeconds: o = 0.5,
  shouldDrag: a,
  onClick: i,
  onDrag: s,
  onDragStart: l,
  onDragEnd: c
} = {}) {
  const u = {
    // All coordinates are relative to the viewport
    xy: $t.zero,
    previous: $t.zero,
    initial: $t.zero,
    delta: $t.zero,
    origin: $t.zero,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
    dragging: !1,
    pointerLocked: !1
  };
  let d, p = !1;
  function m() {
    const z = e.getBoundingClientRect();
    u.top = z.top, u.right = z.right, u.bottom = z.bottom, u.left = z.left, u.width = z.width, u.height = z.height, u.origin = $t.lerp(
      [u.left, u.top],
      [u.right, u.bottom],
      0.5
    );
  }
  function y() {
    if ("requestPointerLock" in e) {
      try {
        Promise.resolve(e.requestPointerLock()).catch(() => {
        });
      } catch {
      }
      u.pointerLocked = !0;
    }
  }
  function L() {
    var z;
    (z = e.ownerDocument) == null || z.exitPointerLock();
  }
  function x(z) {
    md(r, !1) && y(), u.dragging = !0, u.initial = u.previous, l == null || l(u, z);
  }
  function O(z) {
    md(t, !1) || z.button !== 0 || !z.isPrimary || n.includes(z.pointerType) && (a && !a(z) || (p = !0, u.xy = u.previous = u.initial = [z.clientX, z.clientY], m(), o === 0 ? x(z) : d = setTimeout(
      () => x(z),
      o * 1e3
    ), e.setPointerCapture(z.pointerId)));
  }
  function Y(z) {
    if (p) {
      if (z.movementX !== void 0 && z.movementY !== void 0) {
        const j = window.outerWidth / window.innerWidth, I = $t.scale(
          [z.movementX, z.movementY],
          1 / j
        );
        u.xy = $t.add(u.xy, I);
      } else
        u.xy = [z.clientX, z.clientY];
      if (u.delta = $t.sub(u.xy, u.previous), m(), $t.squaredLength(u.delta) !== 0) {
        if (!u.dragging) {
          const j = $t.dist(u.initial, u.xy), I = z.pointerType === "mouse" ? 3 : 5;
          j >= I && (clearTimeout(d), x(z));
        }
        u.dragging && (s == null || s(u, z)), u.previous = u.xy;
      }
    }
  }
  function R(z) {
    u.pointerLocked && L(), u.pointerLocked = !1, p && (u.dragging ? c == null || c(u, z) : i == null || i(u, z)), clearTimeout(d), p = !1, u.dragging = !1, u.xy = u.initial = u.delta = $t.zero, e.releasePointerCapture(z.pointerId);
  }
  return e.addEventListener("pointerdown", O), e.addEventListener("pointermove", Y), e.addEventListener("pointerup", R), e.addEventListener("pointercancel", R), e.addEventListener("pointerleave", R), m(), {
    state: u,
    measure: m,
    dispose() {
      clearTimeout(d), e.removeEventListener("pointerdown", O), e.removeEventListener("pointermove", Y), e.removeEventListener("pointerup", R), e.removeEventListener("pointercancel", R), e.removeEventListener("pointerleave", R);
    }
  };
}
function Ob({
  triggerTop: e,
  selectedIndex: t,
  itemHeight: r,
  listHeight: n,
  viewportHeight: o,
  viewportMargin: a = 6,
  selectChrome: i = 2
}) {
  const s = Math.max(0, t), l = e - 2 - i - s * r, c = o - a * 2, u = n <= c ? o - a - n : o - a - r;
  return Math.max(
    a,
    Math.min(Math.max(a, u), l)
  );
}
var i0 = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Sa(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Rp = { exports: {} };
(function(e) {
  var t = Object.prototype.hasOwnProperty, r = "~";
  function n() {
  }
  Object.create && (n.prototype = /* @__PURE__ */ Object.create(null), new n().__proto__ || (r = !1));
  function o(l, c, u) {
    this.fn = l, this.context = c, this.once = u || !1;
  }
  function a(l, c, u, d, p) {
    if (typeof u != "function")
      throw new TypeError("The listener must be a function");
    var m = new o(u, d || l, p), y = r ? r + c : c;
    return l._events[y] ? l._events[y].fn ? l._events[y] = [l._events[y], m] : l._events[y].push(m) : (l._events[y] = m, l._eventsCount++), l;
  }
  function i(l, c) {
    --l._eventsCount === 0 ? l._events = new n() : delete l._events[c];
  }
  function s() {
    this._events = new n(), this._eventsCount = 0;
  }
  s.prototype.eventNames = function() {
    var c = [], u, d;
    if (this._eventsCount === 0) return c;
    for (d in u = this._events)
      t.call(u, d) && c.push(r ? d.slice(1) : d);
    return Object.getOwnPropertySymbols ? c.concat(Object.getOwnPropertySymbols(u)) : c;
  }, s.prototype.listeners = function(c) {
    var u = r ? r + c : c, d = this._events[u];
    if (!d) return [];
    if (d.fn) return [d.fn];
    for (var p = 0, m = d.length, y = new Array(m); p < m; p++)
      y[p] = d[p].fn;
    return y;
  }, s.prototype.listenerCount = function(c) {
    var u = r ? r + c : c, d = this._events[u];
    return d ? d.fn ? 1 : d.length : 0;
  }, s.prototype.emit = function(c, u, d, p, m, y) {
    var L = r ? r + c : c;
    if (!this._events[L]) return !1;
    var x = this._events[L], O = arguments.length, Y, R;
    if (x.fn) {
      switch (x.once && this.removeListener(c, x.fn, void 0, !0), O) {
        case 1:
          return x.fn.call(x.context), !0;
        case 2:
          return x.fn.call(x.context, u), !0;
        case 3:
          return x.fn.call(x.context, u, d), !0;
        case 4:
          return x.fn.call(x.context, u, d, p), !0;
        case 5:
          return x.fn.call(x.context, u, d, p, m), !0;
        case 6:
          return x.fn.call(x.context, u, d, p, m, y), !0;
      }
      for (R = 1, Y = new Array(O - 1); R < O; R++)
        Y[R - 1] = arguments[R];
      x.fn.apply(x.context, Y);
    } else {
      var z = x.length, j;
      for (R = 0; R < z; R++)
        switch (x[R].once && this.removeListener(c, x[R].fn, void 0, !0), O) {
          case 1:
            x[R].fn.call(x[R].context);
            break;
          case 2:
            x[R].fn.call(x[R].context, u);
            break;
          case 3:
            x[R].fn.call(x[R].context, u, d);
            break;
          case 4:
            x[R].fn.call(x[R].context, u, d, p);
            break;
          default:
            if (!Y) for (j = 1, Y = new Array(O - 1); j < O; j++)
              Y[j - 1] = arguments[j];
            x[R].fn.apply(x[R].context, Y);
        }
    }
    return !0;
  }, s.prototype.on = function(c, u, d) {
    return a(this, c, u, d, !1);
  }, s.prototype.once = function(c, u, d) {
    return a(this, c, u, d, !0);
  }, s.prototype.removeListener = function(c, u, d, p) {
    var m = r ? r + c : c;
    if (!this._events[m]) return this;
    if (!u)
      return i(this, m), this;
    var y = this._events[m];
    if (y.fn)
      y.fn === u && (!p || y.once) && (!d || y.context === d) && i(this, m);
    else {
      for (var L = 0, x = [], O = y.length; L < O; L++)
        (y[L].fn !== u || p && !y[L].once || d && y[L].context !== d) && x.push(y[L]);
      x.length ? this._events[m] = x.length === 1 ? x[0] : x : i(this, m);
    }
    return this;
  }, s.prototype.removeAllListeners = function(c) {
    var u;
    return c ? (u = r ? r + c : c, this._events[u] && i(this, u)) : (this._events = new n(), this._eventsCount = 0), this;
  }, s.prototype.off = s.prototype.removeListener, s.prototype.addListener = s.prototype.on, s.prefixed = r, s.EventEmitter = s, e.exports = s;
})(Rp);
var Pb = Rp.exports;
const Db = /* @__PURE__ */ Sa(Pb);
class Ip extends Error {
  constructor(t) {
    super(t), this.name = "TimeoutError";
  }
}
class Bb extends Error {
  constructor(t) {
    super(), this.name = "AbortError", this.message = t;
  }
}
const hd = (e) => globalThis.DOMException === void 0 ? new Bb(e) : new DOMException(e), yd = (e) => {
  const t = e.reason === void 0 ? hd("This operation was aborted.") : e.reason;
  return t instanceof Error ? t : hd(t);
};
function Gb(e, t) {
  const {
    milliseconds: r,
    fallback: n,
    message: o,
    customTimers: a = { setTimeout, clearTimeout }
  } = t;
  let i, s;
  const c = new Promise((u, d) => {
    if (typeof r != "number" || Math.sign(r) !== 1)
      throw new TypeError(`Expected \`milliseconds\` to be a positive number, got \`${r}\``);
    if (t.signal) {
      const { signal: m } = t;
      m.aborted && d(yd(m)), s = () => {
        d(yd(m));
      }, m.addEventListener("abort", s, { once: !0 });
    }
    if (r === Number.POSITIVE_INFINITY) {
      e.then(u, d);
      return;
    }
    const p = new Ip();
    i = a.setTimeout.call(void 0, () => {
      if (n) {
        try {
          u(n());
        } catch (m) {
          d(m);
        }
        return;
      }
      typeof e.cancel == "function" && e.cancel(), o === !1 ? u() : o instanceof Error ? d(o) : (p.message = o ?? `Promise timed out after ${r} milliseconds`, d(p));
    }, r), (async () => {
      try {
        u(await e);
      } catch (m) {
        d(m);
      }
    })();
  }).finally(() => {
    c.clear(), s && t.signal && t.signal.removeEventListener("abort", s);
  });
  return c.clear = () => {
    a.clearTimeout.call(void 0, i), i = void 0;
  }, c;
}
function Fb(e, t, r) {
  let n = 0, o = e.length;
  for (; o > 0; ) {
    const a = Math.trunc(o / 2);
    let i = n + a;
    r(e[i], t) <= 0 ? (n = ++i, o -= a + 1) : o = a;
  }
  return n;
}
var Rn;
class $b {
  constructor() {
    Or(this, Rn, []);
  }
  enqueue(t, r) {
    r = {
      priority: 0,
      ...r
    };
    const n = {
      priority: r.priority,
      run: t
    };
    if (this.size && mt(this, Rn)[this.size - 1].priority >= r.priority) {
      mt(this, Rn).push(n);
      return;
    }
    const o = Fb(mt(this, Rn), n, (a, i) => i.priority - a.priority);
    mt(this, Rn).splice(o, 0, n);
  }
  dequeue() {
    const t = mt(this, Rn).shift();
    return t == null ? void 0 : t.run;
  }
  filter(t) {
    return mt(this, Rn).filter((r) => r.priority === t.priority).map((r) => r.run);
  }
  get size() {
    return mt(this, Rn).length;
  }
}
Rn = new WeakMap();
var ca, fa, ao, x0, ua, E0, ln, da, Xr, S0, cn, pa, Vn, k0, zt, Np, Op, Pp, Dp, Bp, qi, bc, gc, Hi, Gp, Ui;
class zb extends Db {
  // TODO: The `throwOnTimeout` option should affect the return types of `add()` and `addAll()`
  constructor(r) {
    var n, o;
    super();
    Or(this, zt);
    Or(this, ca);
    Or(this, fa);
    Or(this, ao, 0);
    Or(this, x0);
    Or(this, ua);
    Or(this, E0, 0);
    Or(this, ln);
    Or(this, da);
    Or(this, Xr);
    Or(this, S0);
    Or(this, cn, 0);
    // The `!` is needed because of https://github.com/microsoft/TypeScript/issues/32194
    Or(this, pa);
    Or(this, Vn);
    Or(this, k0);
    /**
        Per-operation timeout in milliseconds. Operations fulfill once `timeout` elapses if they haven't already.
    
        Applies to each future operation.
        */
    bi(this, "timeout");
    if (r = {
      carryoverConcurrencyCount: !1,
      intervalCap: Number.POSITIVE_INFINITY,
      interval: 0,
      concurrency: Number.POSITIVE_INFINITY,
      autoStart: !0,
      queueClass: $b,
      ...r
    }, !(typeof r.intervalCap == "number" && r.intervalCap >= 1))
      throw new TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${((n = r.intervalCap) == null ? void 0 : n.toString()) ?? ""}\` (${typeof r.intervalCap})`);
    if (r.interval === void 0 || !(Number.isFinite(r.interval) && r.interval >= 0))
      throw new TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${((o = r.interval) == null ? void 0 : o.toString()) ?? ""}\` (${typeof r.interval})`);
    fr(this, ca, r.carryoverConcurrencyCount), fr(this, fa, r.intervalCap === Number.POSITIVE_INFINITY || r.interval === 0), fr(this, x0, r.intervalCap), fr(this, ua, r.interval), fr(this, Xr, new r.queueClass()), fr(this, S0, r.queueClass), this.concurrency = r.concurrency, this.timeout = r.timeout, fr(this, k0, r.throwOnTimeout === !0), fr(this, Vn, r.autoStart === !1);
  }
  get concurrency() {
    return mt(this, pa);
  }
  set concurrency(r) {
    if (!(typeof r == "number" && r >= 1))
      throw new TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${r}\` (${typeof r})`);
    fr(this, pa, r), Pr(this, zt, Hi).call(this);
  }
  async add(r, n = {}) {
    return n = {
      timeout: this.timeout,
      throwOnTimeout: mt(this, k0),
      ...n
    }, new Promise((o, a) => {
      mt(this, Xr).enqueue(async () => {
        var i;
        gi(this, cn)._++, gi(this, ao)._++;
        try {
          (i = n.signal) == null || i.throwIfAborted();
          let s = r({ signal: n.signal });
          n.timeout && (s = Gb(Promise.resolve(s), { milliseconds: n.timeout })), n.signal && (s = Promise.race([s, Pr(this, zt, Gp).call(this, n.signal)]));
          const l = await s;
          o(l), this.emit("completed", l);
        } catch (s) {
          if (s instanceof Ip && !n.throwOnTimeout) {
            o();
            return;
          }
          a(s), this.emit("error", s);
        } finally {
          Pr(this, zt, Pp).call(this);
        }
      }, n), this.emit("add"), Pr(this, zt, qi).call(this);
    });
  }
  async addAll(r, n) {
    return Promise.all(r.map(async (o) => this.add(o, n)));
  }
  /**
  Start (or resume) executing enqueued tasks within concurrency limit. No need to call this if queue is not paused (via `options.autoStart = false` or by `.pause()` method.)
  */
  start() {
    return mt(this, Vn) ? (fr(this, Vn, !1), Pr(this, zt, Hi).call(this), this) : this;
  }
  /**
  Put queue execution on hold.
  */
  pause() {
    fr(this, Vn, !0);
  }
  /**
  Clear the queue.
  */
  clear() {
    fr(this, Xr, new (mt(this, S0))());
  }
  /**
      Can be called multiple times. Useful if you for example add additional items at a later time.
  
      @returns A promise that settles when the queue becomes empty.
      */
  async onEmpty() {
    mt(this, Xr).size !== 0 && await Pr(this, zt, Ui).call(this, "empty");
  }
  /**
      @returns A promise that settles when the queue size is less than the given limit: `queue.size < limit`.
  
      If you want to avoid having the queue grow beyond a certain size you can `await queue.onSizeLessThan()` before adding a new item.
  
      Note that this only limits the number of items waiting to start. There could still be up to `concurrency` jobs already running that this call does not include in its calculation.
      */
  async onSizeLessThan(r) {
    mt(this, Xr).size < r || await Pr(this, zt, Ui).call(this, "next", () => mt(this, Xr).size < r);
  }
  /**
      The difference with `.onEmpty` is that `.onIdle` guarantees that all work from the queue has finished. `.onEmpty` merely signals that the queue is empty, but it could mean that some promises haven't completed yet.
  
      @returns A promise that settles when the queue becomes empty, and all promises have completed; `queue.size === 0 && queue.pending === 0`.
      */
  async onIdle() {
    mt(this, cn) === 0 && mt(this, Xr).size === 0 || await Pr(this, zt, Ui).call(this, "idle");
  }
  /**
  Size of the queue, the number of queued items waiting to run.
  */
  get size() {
    return mt(this, Xr).size;
  }
  /**
      Size of the queue, filtered by the given options.
  
      For example, this can be used to find the number of items remaining in the queue with a specific priority level.
      */
  sizeBy(r) {
    return mt(this, Xr).filter(r).length;
  }
  /**
  Number of running items (no longer in the queue).
  */
  get pending() {
    return mt(this, cn);
  }
  /**
  Whether the queue is currently paused.
  */
  get isPaused() {
    return mt(this, Vn);
  }
}
ca = new WeakMap(), fa = new WeakMap(), ao = new WeakMap(), x0 = new WeakMap(), ua = new WeakMap(), E0 = new WeakMap(), ln = new WeakMap(), da = new WeakMap(), Xr = new WeakMap(), S0 = new WeakMap(), cn = new WeakMap(), pa = new WeakMap(), Vn = new WeakMap(), k0 = new WeakMap(), zt = new WeakSet(), Np = function() {
  return mt(this, fa) || mt(this, ao) < mt(this, x0);
}, Op = function() {
  return mt(this, cn) < mt(this, pa);
}, Pp = function() {
  gi(this, cn)._--, Pr(this, zt, qi).call(this), this.emit("next");
}, Dp = function() {
  Pr(this, zt, gc).call(this), Pr(this, zt, bc).call(this), fr(this, da, void 0);
}, Bp = function() {
  const r = Date.now();
  if (mt(this, ln) === void 0) {
    const n = mt(this, E0) - r;
    if (n < 0)
      fr(this, ao, mt(this, ca) ? mt(this, cn) : 0);
    else
      return mt(this, da) === void 0 && fr(this, da, setTimeout(() => {
        Pr(this, zt, Dp).call(this);
      }, n)), !0;
  }
  return !1;
}, qi = function() {
  if (mt(this, Xr).size === 0)
    return mt(this, ln) && clearInterval(mt(this, ln)), fr(this, ln, void 0), this.emit("empty"), mt(this, cn) === 0 && this.emit("idle"), !1;
  if (!mt(this, Vn)) {
    const r = !mt(this, zt, Bp);
    if (mt(this, zt, Np) && mt(this, zt, Op)) {
      const n = mt(this, Xr).dequeue();
      return n ? (this.emit("active"), n(), r && Pr(this, zt, bc).call(this), !0) : !1;
    }
  }
  return !1;
}, bc = function() {
  mt(this, fa) || mt(this, ln) !== void 0 || (fr(this, ln, setInterval(() => {
    Pr(this, zt, gc).call(this);
  }, mt(this, ua))), fr(this, E0, Date.now() + mt(this, ua)));
}, gc = function() {
  mt(this, ao) === 0 && mt(this, cn) === 0 && mt(this, ln) && (clearInterval(mt(this, ln)), fr(this, ln, void 0)), fr(this, ao, mt(this, ca) ? mt(this, cn) : 0), Pr(this, zt, Hi).call(this);
}, /**
Executes all queued functions until it reaches the limit.
*/
Hi = function() {
  for (; Pr(this, zt, qi).call(this); )
    ;
}, Gp = async function(r) {
  return new Promise((n, o) => {
    r.addEventListener("abort", () => {
      o(r.reason);
    }, { once: !0 });
  });
}, Ui = async function(r, n) {
  return new Promise((o) => {
    const a = () => {
      n && !n() || (this.off(r, a), o());
    };
    this.on(r, a);
  });
};
var Fp = { exports: {} };
(function(e, t) {
  (function(r, n) {
    e.exports = n();
  })(i0, function() {
    var r = function(f) {
      return f instanceof Uint8Array || f instanceof Uint16Array || f instanceof Uint32Array || f instanceof Int8Array || f instanceof Int16Array || f instanceof Int32Array || f instanceof Float32Array || f instanceof Float64Array || f instanceof Uint8ClampedArray;
    }, n = function(f, b) {
      for (var E = Object.keys(b), U = 0; U < E.length; ++U)
        f[E[U]] = b[E[U]];
      return f;
    }, o = `
`;
    function a(f) {
      return typeof atob < "u" ? atob(f) : "base64:" + f;
    }
    function i(f) {
      var b = new Error("(regl) " + f);
      throw console.error(b), b;
    }
    function s(f, b) {
      f || i(b);
    }
    function l(f) {
      return f ? ": " + f : "";
    }
    function c(f, b, E) {
      f in b || i("unknown parameter (" + f + ")" + l(E) + ". possible values: " + Object.keys(b).join());
    }
    function u(f, b) {
      r(f) || i(
        "invalid parameter type" + l(b) + ". must be a typed array"
      );
    }
    function d(f, b) {
      switch (b) {
        case "number":
          return typeof f == "number";
        case "object":
          return typeof f == "object";
        case "string":
          return typeof f == "string";
        case "boolean":
          return typeof f == "boolean";
        case "function":
          return typeof f == "function";
        case "undefined":
          return typeof f > "u";
        case "symbol":
          return typeof f == "symbol";
      }
    }
    function p(f, b, E) {
      d(f, b) || i(
        "invalid parameter type" + l(E) + ". expected " + b + ", got " + typeof f
      );
    }
    function m(f, b) {
      f >= 0 && (f | 0) === f || i("invalid parameter type, (" + f + ")" + l(b) + ". must be a nonnegative integer");
    }
    function y(f, b, E) {
      b.indexOf(f) < 0 && i("invalid value" + l(E) + ". must be one of: " + b);
    }
    var L = [
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
    function x(f) {
      Object.keys(f).forEach(function(b) {
        L.indexOf(b) < 0 && i('invalid regl constructor argument "' + b + '". must be one of ' + L);
      });
    }
    function O(f, b) {
      for (f = f + ""; f.length < b; )
        f = " " + f;
      return f;
    }
    function Y() {
      this.name = "unknown", this.lines = [], this.index = {}, this.hasErrors = !1;
    }
    function R(f, b) {
      this.number = f, this.line = b, this.errors = [];
    }
    function z(f, b, E) {
      this.file = f, this.line = b, this.message = E;
    }
    function j() {
      var f = new Error(), b = (f.stack || f).toString(), E = /compileProcedure.*\n\s*at.*\((.*)\)/.exec(b);
      if (E)
        return E[1];
      var U = /compileProcedure.*\n\s*at\s+(.*)(\n|$)/.exec(b);
      return U ? U[1] : "unknown";
    }
    function I() {
      var f = new Error(), b = (f.stack || f).toString(), E = /at REGLCommand.*\n\s+at.*\((.*)\)/.exec(b);
      if (E)
        return E[1];
      var U = /at REGLCommand.*\n\s+at\s+(.*)\n/.exec(b);
      return U ? U[1] : "unknown";
    }
    function N(f, b) {
      var E = f.split(`
`), U = 1, ee = 0, H = {
        unknown: new Y(),
        0: new Y()
      };
      H.unknown.name = H[0].name = b || j(), H.unknown.lines.push(new R(0, ""));
      for (var K = 0; K < E.length; ++K) {
        var le = E[K], se = /^\s*#\s*(\w+)\s+(.+)\s*$/.exec(le);
        if (se)
          switch (se[1]) {
            case "line":
              var he = /(\d+)(\s+\d+)?/.exec(se[2]);
              he && (U = he[1] | 0, he[2] && (ee = he[2] | 0, ee in H || (H[ee] = new Y())));
              break;
            case "define":
              var be = /SHADER_NAME(_B64)?\s+(.*)$/.exec(se[2]);
              be && (H[ee].name = be[1] ? a(be[2]) : be[2]);
              break;
          }
        H[ee].lines.push(new R(U++, le));
      }
      return Object.keys(H).forEach(function(ye) {
        var xe = H[ye];
        xe.lines.forEach(function(ce) {
          xe.index[ce.number] = ce;
        });
      }), H;
    }
    function ne(f) {
      var b = [];
      return f.split(`
`).forEach(function(E) {
        if (!(E.length < 5)) {
          var U = /^ERROR:\s+(\d+):(\d+):\s*(.*)$/.exec(E);
          U ? b.push(new z(
            U[1] | 0,
            U[2] | 0,
            U[3].trim()
          )) : E.length > 0 && b.push(new z("unknown", 0, E));
        }
      }), b;
    }
    function de(f, b) {
      b.forEach(function(E) {
        var U = f[E.file];
        if (U) {
          var ee = U.index[E.line];
          if (ee) {
            ee.errors.push(E), U.hasErrors = !0;
            return;
          }
        }
        f.unknown.hasErrors = !0, f.unknown.lines[0].errors.push(E);
      });
    }
    function oe(f, b, E, U, ee) {
      if (!f.getShaderParameter(b, f.COMPILE_STATUS)) {
        var H = f.getShaderInfoLog(b), K = U === f.FRAGMENT_SHADER ? "fragment" : "vertex";
        Xe(E, "string", K + " shader source must be a string", ee);
        var le = N(E, ee), se = ne(H);
        de(le, se), Object.keys(le).forEach(function(he) {
          var be = le[he];
          if (!be.hasErrors)
            return;
          var ye = [""], xe = [""];
          function ce(me, B) {
            ye.push(me), xe.push(B || "");
          }
          ce("file number " + he + ": " + be.name + `
`, "color:red;text-decoration:underline;font-weight:bold"), be.lines.forEach(function(me) {
            if (me.errors.length > 0) {
              ce(O(me.number, 4) + "|  ", "background-color:yellow; font-weight:bold"), ce(me.line + o, "color:red; background-color:yellow; font-weight:bold");
              var B = 0;
              me.errors.forEach(function(W) {
                var pe = W.message, Oe = /^\s*'(.*)'\s*:\s*(.*)$/.exec(pe);
                if (Oe) {
                  var ie = Oe[1];
                  switch (pe = Oe[2], ie) {
                    case "assign":
                      ie = "=";
                      break;
                  }
                  B = Math.max(me.line.indexOf(ie, B), 0);
                } else
                  B = 0;
                ce(O("| ", 6)), ce(O("^^^", B + 3) + o, "font-weight:bold"), ce(O("| ", 6)), ce(pe + o, "font-weight:bold");
              }), ce(O("| ", 6) + o);
            } else
              ce(O(me.number, 4) + "|  "), ce(me.line + o, "color:red");
          }), typeof document < "u" && !window.chrome ? (xe[0] = ye.join("%c"), console.log.apply(console, xe)) : console.log(ye.join(""));
        }), s.raise("Error compiling " + K + " shader, " + le[0].name);
      }
    }
    function ge(f, b, E, U, ee) {
      if (!f.getProgramParameter(b, f.LINK_STATUS)) {
        var H = f.getProgramInfoLog(b), K = N(E, ee), le = N(U, ee), se = 'Error linking program with vertex shader, "' + le[0].name + '", and fragment shader "' + K[0].name + '"';
        typeof document < "u" ? console.log(
          "%c" + se + o + "%c" + H,
          "color:red;text-decoration:underline;font-weight:bold",
          "color:red"
        ) : console.log(se + o + H), s.raise(se);
      }
    }
    function te(f) {
      f._commandRef = j();
    }
    function Ie(f, b, E, U) {
      te(f);
      function ee(se) {
        return se ? U.id(se) : 0;
      }
      f._fragId = ee(f.static.frag), f._vertId = ee(f.static.vert);
      function H(se, he) {
        Object.keys(he).forEach(function(be) {
          se[U.id(be)] = !0;
        });
      }
      var K = f._uniformSet = {};
      H(K, b.static), H(K, b.dynamic);
      var le = f._attributeSet = {};
      H(le, E.static), H(le, E.dynamic), f._hasCount = "count" in f.static || "count" in f.dynamic || "elements" in f.static || "elements" in f.dynamic;
    }
    function Ke(f, b) {
      var E = I();
      i(f + " in command " + (b || j()) + (E === "unknown" ? "" : " called from " + E));
    }
    function Ye(f, b, E) {
      f || Ke(b, E || j());
    }
    function it(f, b, E, U) {
      f in b || Ke(
        "unknown parameter (" + f + ")" + l(E) + ". possible values: " + Object.keys(b).join(),
        U || j()
      );
    }
    function Xe(f, b, E, U) {
      d(f, b) || Ke(
        "invalid parameter type" + l(E) + ". expected " + b + ", got " + typeof f,
        U || j()
      );
    }
    function Qe(f) {
      f();
    }
    function xt(f, b, E) {
      f.texture ? y(
        f.texture._texture.internalformat,
        b,
        "unsupported texture format for attachment"
      ) : y(
        f.renderbuffer._renderbuffer.format,
        E,
        "unsupported renderbuffer format for attachment"
      );
    }
    var nt = 33071, ut = 9728, Pt = 9984, Pe = 9985, Ot = 9986, Q = 9987, Be = 5120, V = 5121, Ge = 5122, vt = 5123, jt = 5124, er = 5125, ht = 5126, pt = 32819, Rt = 32820, We = 33635, Et = 34042, Gt = 36193, bt = {};
    bt[Be] = bt[V] = 1, bt[Ge] = bt[vt] = bt[Gt] = bt[We] = bt[pt] = bt[Rt] = 2, bt[jt] = bt[er] = bt[ht] = bt[Et] = 4;
    function Fe(f, b) {
      return f === Rt || f === pt || f === We ? 2 : f === Et ? 4 : bt[f] * b;
    }
    function st(f) {
      return !(f & f - 1) && !!f;
    }
    function Ut(f, b, E) {
      var U, ee = b.width, H = b.height, K = b.channels;
      s(
        ee > 0 && ee <= E.maxTextureSize && H > 0 && H <= E.maxTextureSize,
        "invalid texture shape"
      ), (f.wrapS !== nt || f.wrapT !== nt) && s(
        st(ee) && st(H),
        "incompatible wrap mode for texture, both width and height must be power of 2"
      ), b.mipmask === 1 ? ee !== 1 && H !== 1 && s(
        f.minFilter !== Pt && f.minFilter !== Ot && f.minFilter !== Pe && f.minFilter !== Q,
        "min filter requires mipmap"
      ) : (s(
        st(ee) && st(H),
        "texture must be a square power of 2 to support mipmapping"
      ), s(
        b.mipmask === (ee << 1) - 1,
        "missing or incomplete mipmap data"
      )), b.type === ht && (E.extensions.indexOf("oes_texture_float_linear") < 0 && s(
        f.minFilter === ut && f.magFilter === ut,
        "filter not supported, must enable oes_texture_float_linear"
      ), s(
        !f.genMipmaps,
        "mipmap generation not supported with float textures"
      ));
      var le = b.images;
      for (U = 0; U < 16; ++U)
        if (le[U]) {
          var se = ee >> U, he = H >> U;
          s(b.mipmask & 1 << U, "missing mipmap data");
          var be = le[U];
          if (s(
            be.width === se && be.height === he,
            "invalid shape for mip images"
          ), s(
            be.format === b.format && be.internalformat === b.internalformat && be.type === b.type,
            "incompatible type for mip image"
          ), !be.compressed) if (be.data) {
            var ye = Math.ceil(Fe(be.type, K) * se / be.unpackAlignment) * be.unpackAlignment;
            s(
              be.data.byteLength === ye * he,
              "invalid data for image, buffer size is inconsistent with image format"
            );
          } else be.element || be.copy;
        } else f.genMipmaps || s((b.mipmask & 1 << U) === 0, "extra mipmap data");
      b.compressed && s(
        !f.genMipmaps,
        "mipmap generation for compressed images not supported"
      );
    }
    function tr(f, b, E, U) {
      var ee = f.width, H = f.height, K = f.channels;
      s(
        ee > 0 && ee <= U.maxTextureSize && H > 0 && H <= U.maxTextureSize,
        "invalid texture shape"
      ), s(
        ee === H,
        "cube map must be square"
      ), s(
        b.wrapS === nt && b.wrapT === nt,
        "wrap mode not supported by cube map"
      );
      for (var le = 0; le < E.length; ++le) {
        var se = E[le];
        s(
          se.width === ee && se.height === H,
          "inconsistent cube map face shape"
        ), b.genMipmaps && (s(
          !se.compressed,
          "can not generate mipmap for compressed textures"
        ), s(
          se.mipmask === 1,
          "can not specify mipmaps and generate mipmaps"
        ));
        for (var he = se.images, be = 0; be < 16; ++be) {
          var ye = he[be];
          if (ye) {
            var xe = ee >> be, ce = H >> be;
            s(se.mipmask & 1 << be, "missing mipmap data"), s(
              ye.width === xe && ye.height === ce,
              "invalid shape for mip images"
            ), s(
              ye.format === f.format && ye.internalformat === f.internalformat && ye.type === f.type,
              "incompatible type for mip image"
            ), ye.compressed || (ye.data ? s(
              ye.data.byteLength === xe * ce * Math.max(Fe(ye.type, K), ye.unpackAlignment),
              "invalid data for image, buffer size is inconsistent with image format"
            ) : ye.element || ye.copy);
          }
        }
      }
    }
    var g = n(s, {
      optional: Qe,
      raise: i,
      commandRaise: Ke,
      command: Ye,
      parameter: c,
      commandParameter: it,
      constructor: x,
      type: p,
      commandType: Xe,
      isTypedArray: u,
      nni: m,
      oneOf: y,
      shaderError: oe,
      linkError: ge,
      callSite: I,
      saveCommandRef: te,
      saveDrawInfo: Ie,
      framebufferFormat: xt,
      guessCommand: j,
      texture2D: Ut,
      textureCube: tr
    }), tn = 0, rn = 0, wr = 5, Tr = 6;
    function T(f, b) {
      this.id = tn++, this.type = f, this.data = b;
    }
    function Z(f) {
      return f.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }
    function Ae(f) {
      if (f.length === 0)
        return [];
      var b = f.charAt(0), E = f.charAt(f.length - 1);
      if (f.length > 1 && b === E && (b === '"' || b === "'"))
        return ['"' + Z(f.substr(1, f.length - 2)) + '"'];
      var U = /\[(false|true|null|\d+|'[^']*'|"[^"]*")\]/.exec(f);
      if (U)
        return Ae(f.substr(0, U.index)).concat(Ae(U[1])).concat(Ae(f.substr(U.index + U[0].length)));
      var ee = f.split(".");
      if (ee.length === 1)
        return ['"' + Z(f) + '"'];
      for (var H = [], K = 0; K < ee.length; ++K)
        H = H.concat(Ae(ee[K]));
      return H;
    }
    function rt(f) {
      return "[" + Ae(f).join("][") + "]";
    }
    function Tt(f, b) {
      return new T(f, rt(b + ""));
    }
    function or(f) {
      return typeof f == "function" && !f._reglType || f instanceof T;
    }
    function Zr(f, b) {
      if (typeof f == "function")
        return new T(rn, f);
      if (typeof f == "number" || typeof f == "boolean")
        return new T(wr, f);
      if (Array.isArray(f))
        return new T(Tr, f.map(function(E, U) {
          return Zr(E, b + "[" + U + "]");
        }));
      if (f instanceof T)
        return f;
      g(!1, "invalid option type in uniform " + b);
    }
    var Nr = {
      DynamicVariable: T,
      define: Tt,
      isDynamic: or,
      unbox: Zr,
      accessor: rt
    }, bo = {
      next: typeof requestAnimationFrame == "function" ? function(f) {
        return requestAnimationFrame(f);
      } : function(f) {
        return setTimeout(f, 16);
      },
      cancel: typeof cancelAnimationFrame == "function" ? function(f) {
        return cancelAnimationFrame(f);
      } : clearTimeout
    }, pn = typeof performance < "u" && performance.now ? function() {
      return performance.now();
    } : function() {
      return +/* @__PURE__ */ new Date();
    };
    function nn() {
      var f = { "": 0 }, b = [""];
      return {
        id: function(E) {
          var U = f[E];
          return U || (U = f[E] = b.length, b.push(E), U);
        },
        str: function(E) {
          return b[E];
        }
      };
    }
    function Kn(f, b, E) {
      var U = document.createElement("canvas");
      n(U.style, {
        border: 0,
        margin: 0,
        padding: 0,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%"
      }), f.appendChild(U), f === document.body && (U.style.position = "absolute", n(f.style, {
        margin: 0,
        padding: 0
      }));
      function ee() {
        var le = window.innerWidth, se = window.innerHeight;
        if (f !== document.body) {
          var he = U.getBoundingClientRect();
          le = he.right - he.left, se = he.bottom - he.top;
        }
        U.width = E * le, U.height = E * se;
      }
      var H;
      f !== document.body && typeof ResizeObserver == "function" ? (H = new ResizeObserver(function() {
        setTimeout(ee);
      }), H.observe(f)) : window.addEventListener("resize", ee, !1);
      function K() {
        H ? H.disconnect() : window.removeEventListener("resize", ee), f.removeChild(U);
      }
      return ee(), {
        canvas: U,
        onDestroy: K
      };
    }
    function P0(f, b) {
      function E(U) {
        try {
          return f.getContext(U, b);
        } catch {
          return null;
        }
      }
      return E("webgl") || E("experimental-webgl") || E("webgl-experimental");
    }
    function ka(f) {
      return typeof f.nodeName == "string" && typeof f.appendChild == "function" && typeof f.getBoundingClientRect == "function";
    }
    function Ls(f) {
      return typeof f.drawArrays == "function" || typeof f.drawElements == "function";
    }
    function Ta(f) {
      return typeof f == "string" ? f.split() : (g(Array.isArray(f), "invalid extension array"), f);
    }
    function D0(f) {
      return typeof f == "string" ? (g(typeof document < "u", "not supported outside of DOM"), document.querySelector(f)) : f;
    }
    function Cs(f) {
      var b = f || {}, E, U, ee, H, K = {}, le = [], se = [], he = typeof window > "u" ? 1 : window.devicePixelRatio, be = !1, ye = function(me) {
        me && g.raise(me);
      }, xe = function() {
      };
      if (typeof b == "string" ? (g(
        typeof document < "u",
        "selector queries only supported in DOM environments"
      ), E = document.querySelector(b), g(E, "invalid query string for element")) : typeof b == "object" ? ka(b) ? E = b : Ls(b) ? (H = b, ee = H.canvas) : (g.constructor(b), "gl" in b ? H = b.gl : "canvas" in b ? ee = D0(b.canvas) : "container" in b && (U = D0(b.container)), "attributes" in b && (K = b.attributes, g.type(K, "object", "invalid context attributes")), "extensions" in b && (le = Ta(b.extensions)), "optionalExtensions" in b && (se = Ta(b.optionalExtensions)), "onDone" in b && (g.type(
        b.onDone,
        "function",
        "invalid or missing onDone callback"
      ), ye = b.onDone), "profile" in b && (be = !!b.profile), "pixelRatio" in b && (he = +b.pixelRatio, g(he > 0, "invalid pixel ratio"))) : g.raise("invalid arguments to regl"), E && (E.nodeName.toLowerCase() === "canvas" ? ee = E : U = E), !H) {
        if (!ee) {
          g(
            typeof document < "u",
            "must manually specify webgl context outside of DOM environments"
          );
          var ce = Kn(U || document.body, ye, he);
          if (!ce)
            return null;
          ee = ce.canvas, xe = ce.onDestroy;
        }
        K.premultipliedAlpha === void 0 && (K.premultipliedAlpha = !0), H = P0(ee, K);
      }
      return H ? {
        gl: H,
        canvas: ee,
        container: U,
        extensions: le,
        optionalExtensions: se,
        pixelRatio: he,
        profile: be,
        onDone: ye,
        onDestroy: xe
      } : (xe(), ye("webgl not supported, try upgrading your browser or graphics drivers http://get.webgl.org"), null);
    }
    function Rs(f, b) {
      var E = {};
      function U(K) {
        g.type(K, "string", "extension name must be string");
        var le = K.toLowerCase(), se;
        try {
          se = E[le] = f.getExtension(le);
        } catch {
        }
        return !!se;
      }
      for (var ee = 0; ee < b.extensions.length; ++ee) {
        var H = b.extensions[ee];
        if (!U(H))
          return b.onDestroy(), b.onDone('"' + H + '" extension is not supported by the current WebGL context, try upgrading your system or a different browser'), null;
      }
      return b.optionalExtensions.forEach(U), {
        extensions: E,
        restore: function() {
          Object.keys(E).forEach(function(K) {
            if (E[K] && !U(K))
              throw new Error("(regl): error restoring extension " + K);
          });
        }
      };
    }
    function Mr(f, b) {
      for (var E = Array(f), U = 0; U < f; ++U)
        E[U] = b(U);
      return E;
    }
    var Ma = 5120, Is = 5121, B0 = 5122, Ns = 5123, Os = 5124, Ps = 5125, lt = 5126;
    function Wt(f) {
      for (var b = 16; b <= 1 << 28; b *= 16)
        if (f <= b)
          return b;
      return 0;
    }
    function Kt(f) {
      var b, E;
      return b = (f > 65535) << 4, f >>>= b, E = (f > 255) << 3, f >>>= E, b |= E, E = (f > 15) << 2, f >>>= E, b |= E, E = (f > 3) << 1, f >>>= E, b |= E, b | f >> 1;
    }
    function Yt() {
      var f = Mr(8, function() {
        return [];
      });
      function b(H) {
        var K = Wt(H), le = f[Kt(K) >> 2];
        return le.length > 0 ? le.pop() : new ArrayBuffer(K);
      }
      function E(H) {
        f[Kt(H.byteLength) >> 2].push(H);
      }
      function U(H, K) {
        var le = null;
        switch (H) {
          case Ma:
            le = new Int8Array(b(K), 0, K);
            break;
          case Is:
            le = new Uint8Array(b(K), 0, K);
            break;
          case B0:
            le = new Int16Array(b(2 * K), 0, K);
            break;
          case Ns:
            le = new Uint16Array(b(2 * K), 0, K);
            break;
          case Os:
            le = new Int32Array(b(4 * K), 0, K);
            break;
          case Ps:
            le = new Uint32Array(b(4 * K), 0, K);
            break;
          case lt:
            le = new Float32Array(b(4 * K), 0, K);
            break;
          default:
            return null;
        }
        return le.length !== K ? le.subarray(0, K) : le;
      }
      function ee(H) {
        E(H.buffer);
      }
      return {
        alloc: b,
        free: E,
        allocType: U,
        freeType: ee
      };
    }
    var gt = Yt();
    gt.zero = Yt();
    var Br = 3408, Dn = 3410, La = 3411, Go = 3412, Qn = 3413, G0 = 3414, F0 = 3415, $0 = 33901, N3 = 33902, O3 = 3379, P3 = 3386, D3 = 34921, B3 = 36347, G3 = 36348, F3 = 35661, $3 = 35660, z3 = 34930, j3 = 36349, q3 = 34076, H3 = 34024, U3 = 7936, V3 = 7937, X3 = 7938, W3 = 35724, Y3 = 34047, Z3 = 36063, K3 = 34852, z0 = 3553, cf = 34067, Q3 = 34069, J3 = 33984, Ca = 6408, Ds = 5126, ff = 5121, Bs = 36160, e5 = 36053, t5 = 36064, r5 = 16384, n5 = function(f, b) {
      var E = 1;
      b.ext_texture_filter_anisotropic && (E = f.getParameter(Y3));
      var U = 1, ee = 1;
      b.webgl_draw_buffers && (U = f.getParameter(K3), ee = f.getParameter(Z3));
      var H = !!b.oes_texture_float;
      if (H) {
        var K = f.createTexture();
        f.bindTexture(z0, K), f.texImage2D(z0, 0, Ca, 1, 1, 0, Ca, Ds, null);
        var le = f.createFramebuffer();
        if (f.bindFramebuffer(Bs, le), f.framebufferTexture2D(Bs, t5, z0, K, 0), f.bindTexture(z0, null), f.checkFramebufferStatus(Bs) !== e5) H = !1;
        else {
          f.viewport(0, 0, 1, 1), f.clearColor(1, 0, 0, 1), f.clear(r5);
          var se = gt.allocType(Ds, 4);
          f.readPixels(0, 0, 1, 1, Ca, Ds, se), f.getError() ? H = !1 : (f.deleteFramebuffer(le), f.deleteTexture(K), H = se[0] === 1), gt.freeType(se);
        }
      }
      var he = typeof navigator < "u" && (/MSIE/.test(navigator.userAgent) || /Trident\//.test(navigator.appVersion) || /Edge/.test(navigator.userAgent)), be = !0;
      if (!he) {
        var ye = f.createTexture(), xe = gt.allocType(ff, 36);
        f.activeTexture(J3), f.bindTexture(cf, ye), f.texImage2D(Q3, 0, Ca, 3, 3, 0, Ca, ff, xe), gt.freeType(xe), f.bindTexture(cf, null), f.deleteTexture(ye), be = !f.getError();
      }
      return {
        // drawing buffer bit depth
        colorBits: [
          f.getParameter(Dn),
          f.getParameter(La),
          f.getParameter(Go),
          f.getParameter(Qn)
        ],
        depthBits: f.getParameter(G0),
        stencilBits: f.getParameter(F0),
        subpixelBits: f.getParameter(Br),
        // supported extensions
        extensions: Object.keys(b).filter(function(ce) {
          return !!b[ce];
        }),
        // max aniso samples
        maxAnisotropic: E,
        // max draw buffers
        maxDrawbuffers: U,
        maxColorAttachments: ee,
        // point and line size ranges
        pointSizeDims: f.getParameter($0),
        lineWidthDims: f.getParameter(N3),
        maxViewportDims: f.getParameter(P3),
        maxCombinedTextureUnits: f.getParameter(F3),
        maxCubeMapSize: f.getParameter(q3),
        maxRenderbufferSize: f.getParameter(H3),
        maxTextureUnits: f.getParameter(z3),
        maxTextureSize: f.getParameter(O3),
        maxAttributes: f.getParameter(D3),
        maxVertexUniforms: f.getParameter(B3),
        maxVertexTextureUnits: f.getParameter($3),
        maxVaryingVectors: f.getParameter(G3),
        maxFragmentUniforms: f.getParameter(j3),
        // vendor info
        glsl: f.getParameter(W3),
        renderer: f.getParameter(V3),
        vendor: f.getParameter(U3),
        version: f.getParameter(X3),
        // quirks
        readFloat: H,
        npotTextureCube: be
      };
    };
    function mn(f) {
      return !!f && typeof f == "object" && Array.isArray(f.shape) && Array.isArray(f.stride) && typeof f.offset == "number" && f.shape.length === f.stride.length && (Array.isArray(f.data) || r(f.data));
    }
    var Kr = function(f) {
      return Object.keys(f).map(function(b) {
        return f[b];
      });
    }, j0 = {
      shape: s5,
      flatten: i5
    };
    function o5(f, b, E) {
      for (var U = 0; U < b; ++U)
        E[U] = f[U];
    }
    function a5(f, b, E, U) {
      for (var ee = 0, H = 0; H < b; ++H)
        for (var K = f[H], le = 0; le < E; ++le)
          U[ee++] = K[le];
    }
    function uf(f, b, E, U, ee, H) {
      for (var K = H, le = 0; le < b; ++le)
        for (var se = f[le], he = 0; he < E; ++he)
          for (var be = se[he], ye = 0; ye < U; ++ye)
            ee[K++] = be[ye];
    }
    function df(f, b, E, U, ee) {
      for (var H = 1, K = E + 1; K < b.length; ++K)
        H *= b[K];
      var le = b[E];
      if (b.length - E === 4) {
        var se = b[E + 1], he = b[E + 2], be = b[E + 3];
        for (K = 0; K < le; ++K)
          uf(f[K], se, he, be, U, ee), ee += H;
      } else
        for (K = 0; K < le; ++K)
          df(f[K], b, E + 1, U, ee), ee += H;
    }
    function i5(f, b, E, U) {
      var ee = 1;
      if (b.length)
        for (var H = 0; H < b.length; ++H)
          ee *= b[H];
      else
        ee = 0;
      var K = U || gt.allocType(E, ee);
      switch (b.length) {
        case 0:
          break;
        case 1:
          o5(f, b[0], K);
          break;
        case 2:
          a5(f, b[0], b[1], K);
          break;
        case 3:
          uf(f, b[0], b[1], b[2], K, 0);
          break;
        default:
          df(f, b, 0, K, 0);
      }
      return K;
    }
    function s5(f) {
      for (var b = [], E = f; E.length; E = E[0])
        b.push(E.length);
      return b;
    }
    var Gs = {
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
    }, l5 = 5120, c5 = 5122, f5 = 5124, u5 = 5121, d5 = 5123, p5 = 5125, m5 = 5126, h5 = 5126, go = {
      int8: l5,
      int16: c5,
      int32: f5,
      uint8: u5,
      uint16: d5,
      uint32: p5,
      float: m5,
      float32: h5
    }, y5 = 35048, b5 = 35040, q0 = {
      dynamic: y5,
      stream: b5,
      static: 35044
    }, Fs = j0.flatten, pf = j0.shape, mf = 35044, g5 = 35040, $s = 5121, zs = 5126, Jn = [];
    Jn[5120] = 1, Jn[5122] = 2, Jn[5124] = 4, Jn[5121] = 1, Jn[5123] = 2, Jn[5125] = 4, Jn[5126] = 4;
    function H0(f) {
      return Gs[Object.prototype.toString.call(f)] | 0;
    }
    function hf(f, b) {
      for (var E = 0; E < b.length; ++E)
        f[E] = b[E];
    }
    function yf(f, b, E, U, ee, H, K) {
      for (var le = 0, se = 0; se < E; ++se)
        for (var he = 0; he < U; ++he)
          f[le++] = b[ee * se + H * he + K];
    }
    function A5(f, b, E, U) {
      var ee = 0, H = {};
      function K(B) {
        this.id = ee++, this.buffer = f.createBuffer(), this.type = B, this.usage = mf, this.byteLength = 0, this.dimension = 1, this.dtype = $s, this.persistentData = null, E.profile && (this.stats = { size: 0 });
      }
      K.prototype.bind = function() {
        f.bindBuffer(this.type, this.buffer);
      }, K.prototype.destroy = function() {
        xe(this);
      };
      var le = [];
      function se(B, W) {
        var pe = le.pop();
        return pe || (pe = new K(B)), pe.bind(), ye(pe, W, g5, 0, 1, !1), pe;
      }
      function he(B) {
        le.push(B);
      }
      function be(B, W, pe) {
        B.byteLength = W.byteLength, f.bufferData(B.type, W, pe);
      }
      function ye(B, W, pe, Oe, ie, Re) {
        var Te;
        if (B.usage = pe, Array.isArray(W)) {
          if (B.dtype = Oe || zs, W.length > 0) {
            var Ze;
            if (Array.isArray(W[0])) {
              Te = pf(W);
              for (var re = 1, J = 1; J < Te.length; ++J)
                re *= Te[J];
              B.dimension = re, Ze = Fs(W, Te, B.dtype), be(B, Ze, pe), Re ? B.persistentData = Ze : gt.freeType(Ze);
            } else if (typeof W[0] == "number") {
              B.dimension = ie;
              var je = gt.allocType(B.dtype, W.length);
              hf(je, W), be(B, je, pe), Re ? B.persistentData = je : gt.freeType(je);
            } else r(W[0]) ? (B.dimension = W[0].length, B.dtype = Oe || H0(W[0]) || zs, Ze = Fs(
              W,
              [W.length, W[0].length],
              B.dtype
            ), be(B, Ze, pe), Re ? B.persistentData = Ze : gt.freeType(Ze)) : g.raise("invalid buffer data");
          }
        } else if (r(W))
          B.dtype = Oe || H0(W), B.dimension = ie, be(B, W, pe), Re && (B.persistentData = new Uint8Array(new Uint8Array(W.buffer)));
        else if (mn(W)) {
          Te = W.shape;
          var Ee = W.stride, ue = W.offset, Se = 0, ke = 0, dt = 0, ot = 0;
          Te.length === 1 ? (Se = Te[0], ke = 1, dt = Ee[0], ot = 0) : Te.length === 2 ? (Se = Te[0], ke = Te[1], dt = Ee[0], ot = Ee[1]) : g.raise("invalid shape"), B.dtype = Oe || H0(W.data) || zs, B.dimension = ke;
          var Me = gt.allocType(B.dtype, Se * ke);
          yf(
            Me,
            W.data,
            Se,
            ke,
            dt,
            ot,
            ue
          ), be(B, Me, pe), Re ? B.persistentData = Me : gt.freeType(Me);
        } else W instanceof ArrayBuffer ? (B.dtype = $s, B.dimension = ie, be(B, W, pe), Re && (B.persistentData = new Uint8Array(new Uint8Array(W)))) : g.raise("invalid buffer data");
      }
      function xe(B) {
        b.bufferCount--, U(B);
        var W = B.buffer;
        g(W, "buffer must not be deleted already"), f.deleteBuffer(W), B.buffer = null, delete H[B.id];
      }
      function ce(B, W, pe, Oe) {
        b.bufferCount++;
        var ie = new K(W);
        H[ie.id] = ie;
        function Re(re) {
          var J = mf, je = null, Ee = 0, ue = 0, Se = 1;
          return Array.isArray(re) || r(re) || mn(re) || re instanceof ArrayBuffer ? je = re : typeof re == "number" ? Ee = re | 0 : re && (g.type(
            re,
            "object",
            "buffer arguments must be an object, a number or an array"
          ), "data" in re && (g(
            je === null || Array.isArray(je) || r(je) || mn(je),
            "invalid data for buffer"
          ), je = re.data), "usage" in re && (g.parameter(re.usage, q0, "invalid buffer usage"), J = q0[re.usage]), "type" in re && (g.parameter(re.type, go, "invalid buffer type"), ue = go[re.type]), "dimension" in re && (g.type(re.dimension, "number", "invalid dimension"), Se = re.dimension | 0), "length" in re && (g.nni(Ee, "buffer length must be a nonnegative integer"), Ee = re.length | 0)), ie.bind(), je ? ye(ie, je, J, ue, Se, Oe) : (Ee && f.bufferData(ie.type, Ee, J), ie.dtype = ue || $s, ie.usage = J, ie.dimension = Se, ie.byteLength = Ee), E.profile && (ie.stats.size = ie.byteLength * Jn[ie.dtype]), Re;
        }
        function Te(re, J) {
          g(
            J + re.byteLength <= ie.byteLength,
            "invalid buffer subdata call, buffer is too small.  Can't write data of size " + re.byteLength + " starting from offset " + J + " to a buffer of size " + ie.byteLength
          ), f.bufferSubData(ie.type, J, re);
        }
        function Ze(re, J) {
          var je = (J || 0) | 0, Ee;
          if (ie.bind(), r(re) || re instanceof ArrayBuffer)
            Te(re, je);
          else if (Array.isArray(re)) {
            if (re.length > 0)
              if (typeof re[0] == "number") {
                var ue = gt.allocType(ie.dtype, re.length);
                hf(ue, re), Te(ue, je), gt.freeType(ue);
              } else if (Array.isArray(re[0]) || r(re[0])) {
                Ee = pf(re);
                var Se = Fs(re, Ee, ie.dtype);
                Te(Se, je), gt.freeType(Se);
              } else
                g.raise("invalid buffer data");
          } else if (mn(re)) {
            Ee = re.shape;
            var ke = re.stride, dt = 0, ot = 0, Me = 0, Ne = 0;
            Ee.length === 1 ? (dt = Ee[0], ot = 1, Me = ke[0], Ne = 0) : Ee.length === 2 ? (dt = Ee[0], ot = Ee[1], Me = ke[0], Ne = ke[1]) : g.raise("invalid shape");
            var et = Array.isArray(re.data) ? ie.dtype : H0(re.data), ct = gt.allocType(et, dt * ot);
            yf(
              ct,
              re.data,
              dt,
              ot,
              Me,
              Ne,
              re.offset
            ), Te(ct, je), gt.freeType(ct);
          } else
            g.raise("invalid data for buffer subdata");
          return Re;
        }
        return pe || Re(B), Re._reglType = "buffer", Re._buffer = ie, Re.subdata = Ze, E.profile && (Re.stats = ie.stats), Re.destroy = function() {
          xe(ie);
        }, Re;
      }
      function me() {
        Kr(H).forEach(function(B) {
          B.buffer = f.createBuffer(), f.bindBuffer(B.type, B.buffer), f.bufferData(
            B.type,
            B.persistentData || B.byteLength,
            B.usage
          );
        });
      }
      return E.profile && (b.getTotalBufferSize = function() {
        var B = 0;
        return Object.keys(H).forEach(function(W) {
          B += H[W].stats.size;
        }), B;
      }), {
        create: ce,
        createStream: se,
        destroyStream: he,
        clear: function() {
          Kr(H).forEach(xe), le.forEach(xe);
        },
        getBuffer: function(B) {
          return B && B._buffer instanceof K ? B._buffer : null;
        },
        restore: me,
        _initBuffer: ye
      };
    }
    var v5 = 0, _5 = 0, w5 = 1, x5 = 1, E5 = 4, S5 = 4, eo = {
      points: v5,
      point: _5,
      lines: w5,
      line: x5,
      triangles: E5,
      triangle: S5,
      "line loop": 2,
      "line strip": 3,
      "triangle strip": 5,
      "triangle fan": 6
    }, k5 = 0, T5 = 1, Ra = 4, M5 = 5120, Fo = 5121, bf = 5122, $o = 5123, gf = 5124, Ao = 5125, js = 34963, L5 = 35040, C5 = 35044;
    function R5(f, b, E, U) {
      var ee = {}, H = 0, K = {
        uint8: Fo,
        uint16: $o
      };
      b.oes_element_index_uint && (K.uint32 = Ao);
      function le(me) {
        this.id = H++, ee[this.id] = this, this.buffer = me, this.primType = Ra, this.vertCount = 0, this.type = 0;
      }
      le.prototype.bind = function() {
        this.buffer.bind();
      };
      var se = [];
      function he(me) {
        var B = se.pop();
        return B || (B = new le(E.create(
          null,
          js,
          !0,
          !1
        )._buffer)), ye(B, me, L5, -1, -1, 0, 0), B;
      }
      function be(me) {
        se.push(me);
      }
      function ye(me, B, W, pe, Oe, ie, Re) {
        me.buffer.bind();
        var Te;
        if (B) {
          var Ze = Re;
          !Re && (!r(B) || mn(B) && !r(B.data)) && (Ze = b.oes_element_index_uint ? Ao : $o), E._initBuffer(
            me.buffer,
            B,
            W,
            Ze,
            3
          );
        } else
          f.bufferData(js, ie, W), me.buffer.dtype = Te || Fo, me.buffer.usage = W, me.buffer.dimension = 3, me.buffer.byteLength = ie;
        if (Te = Re, !Re) {
          switch (me.buffer.dtype) {
            case Fo:
            case M5:
              Te = Fo;
              break;
            case $o:
            case bf:
              Te = $o;
              break;
            case Ao:
            case gf:
              Te = Ao;
              break;
            default:
              g.raise("unsupported type for element array");
          }
          me.buffer.dtype = Te;
        }
        me.type = Te, g(
          Te !== Ao || !!b.oes_element_index_uint,
          "32 bit element buffers not supported, enable oes_element_index_uint first"
        );
        var re = Oe;
        re < 0 && (re = me.buffer.byteLength, Te === $o ? re >>= 1 : Te === Ao && (re >>= 2)), me.vertCount = re;
        var J = pe;
        if (pe < 0) {
          J = Ra;
          var je = me.buffer.dimension;
          je === 1 && (J = k5), je === 2 && (J = T5), je === 3 && (J = Ra);
        }
        me.primType = J;
      }
      function xe(me) {
        U.elementsCount--, g(me.buffer !== null, "must not double destroy elements"), delete ee[me.id], me.buffer.destroy(), me.buffer = null;
      }
      function ce(me, B) {
        var W = E.create(null, js, !0), pe = new le(W._buffer);
        U.elementsCount++;
        function Oe(ie) {
          if (!ie)
            W(), pe.primType = Ra, pe.vertCount = 0, pe.type = Fo;
          else if (typeof ie == "number")
            W(ie), pe.primType = Ra, pe.vertCount = ie | 0, pe.type = Fo;
          else {
            var Re = null, Te = C5, Ze = -1, re = -1, J = 0, je = 0;
            Array.isArray(ie) || r(ie) || mn(ie) ? Re = ie : (g.type(ie, "object", "invalid arguments for elements"), "data" in ie && (Re = ie.data, g(
              Array.isArray(Re) || r(Re) || mn(Re),
              "invalid data for element buffer"
            )), "usage" in ie && (g.parameter(
              ie.usage,
              q0,
              "invalid element buffer usage"
            ), Te = q0[ie.usage]), "primitive" in ie && (g.parameter(
              ie.primitive,
              eo,
              "invalid element buffer primitive"
            ), Ze = eo[ie.primitive]), "count" in ie && (g(
              typeof ie.count == "number" && ie.count >= 0,
              "invalid vertex count for elements"
            ), re = ie.count | 0), "type" in ie && (g.parameter(
              ie.type,
              K,
              "invalid buffer type"
            ), je = K[ie.type]), "length" in ie ? J = ie.length | 0 : (J = re, je === $o || je === bf ? J *= 2 : (je === Ao || je === gf) && (J *= 4))), ye(
              pe,
              Re,
              Te,
              Ze,
              re,
              J,
              je
            );
          }
          return Oe;
        }
        return Oe(me), Oe._reglType = "elements", Oe._elements = pe, Oe.subdata = function(ie, Re) {
          return W.subdata(ie, Re), Oe;
        }, Oe.destroy = function() {
          xe(pe);
        }, Oe;
      }
      return {
        create: ce,
        createStream: he,
        destroyStream: be,
        getElements: function(me) {
          return typeof me == "function" && me._elements instanceof le ? me._elements : null;
        },
        clear: function() {
          Kr(ee).forEach(xe);
        }
      };
    }
    var Af = new Float32Array(1), I5 = new Uint32Array(Af.buffer), N5 = 5123;
    function vf(f) {
      for (var b = gt.allocType(N5, f.length), E = 0; E < f.length; ++E)
        if (isNaN(f[E]))
          b[E] = 65535;
        else if (f[E] === 1 / 0)
          b[E] = 31744;
        else if (f[E] === -1 / 0)
          b[E] = 64512;
        else {
          Af[0] = f[E];
          var U = I5[0], ee = U >>> 31 << 15, H = (U << 1 >>> 24) - 127, K = U >> 13 & 1023;
          if (H < -24)
            b[E] = ee;
          else if (H < -14) {
            var le = -14 - H;
            b[E] = ee + (K + 1024 >> le);
          } else H > 15 ? b[E] = ee + 31744 : b[E] = ee + (H + 15 << 10) + K;
        }
      return b;
    }
    function ar(f) {
      return Array.isArray(f) || r(f);
    }
    var _f = function(f) {
      return !(f & f - 1) && !!f;
    }, O5 = 34467, wn = 3553, qs = 34067, U0 = 34069, vo = 6408, Hs = 6406, V0 = 6407, Ia = 6409, X0 = 6410, wf = 32854, Us = 32855, xf = 36194, P5 = 32819, D5 = 32820, B5 = 33635, G5 = 34042, Vs = 6402, W0 = 34041, Xs = 35904, Ws = 35906, zo = 36193, Ys = 33776, Zs = 33777, Ks = 33778, Qs = 33779, Ef = 35986, Sf = 35987, kf = 34798, Tf = 35840, Mf = 35841, Lf = 35842, Cf = 35843, Rf = 36196, jo = 5121, Js = 5123, el = 5125, Na = 5126, F5 = 10242, $5 = 10243, z5 = 10497, tl = 33071, j5 = 33648, q5 = 10240, H5 = 10241, rl = 9728, U5 = 9729, nl = 9984, If = 9985, Nf = 9986, ol = 9987, V5 = 33170, Y0 = 4352, X5 = 4353, W5 = 4354, Y5 = 34046, Z5 = 3317, K5 = 37440, Q5 = 37441, J5 = 37443, Of = 37444, Oa = 33984, em = [
      nl,
      Nf,
      If,
      ol
    ], Z0 = [
      0,
      Ia,
      X0,
      V0,
      vo
    ], on = {};
    on[Ia] = on[Hs] = on[Vs] = 1, on[W0] = on[X0] = 2, on[V0] = on[Xs] = 3, on[vo] = on[Ws] = 4;
    function qo(f) {
      return "[object " + f + "]";
    }
    var Pf = qo("HTMLCanvasElement"), Df = qo("OffscreenCanvas"), Bf = qo("CanvasRenderingContext2D"), Gf = qo("ImageBitmap"), Ff = qo("HTMLImageElement"), $f = qo("HTMLVideoElement"), tm = Object.keys(Gs).concat([
      Pf,
      Df,
      Bf,
      Gf,
      Ff,
      $f
    ]), Ho = [];
    Ho[jo] = 1, Ho[Na] = 4, Ho[zo] = 2, Ho[Js] = 2, Ho[el] = 4;
    var Lr = [];
    Lr[wf] = 2, Lr[Us] = 2, Lr[xf] = 2, Lr[W0] = 4, Lr[Ys] = 0.5, Lr[Zs] = 0.5, Lr[Ks] = 1, Lr[Qs] = 1, Lr[Ef] = 0.5, Lr[Sf] = 1, Lr[kf] = 1, Lr[Tf] = 0.5, Lr[Mf] = 0.25, Lr[Lf] = 0.5, Lr[Cf] = 0.25, Lr[Rf] = 0.5;
    function zf(f) {
      return Array.isArray(f) && (f.length === 0 || typeof f[0] == "number");
    }
    function jf(f) {
      if (!Array.isArray(f))
        return !1;
      var b = f.length;
      return !(b === 0 || !ar(f[0]));
    }
    function _o(f) {
      return Object.prototype.toString.call(f);
    }
    function qf(f) {
      return _o(f) === Pf;
    }
    function Hf(f) {
      return _o(f) === Df;
    }
    function rm(f) {
      return _o(f) === Bf;
    }
    function nm(f) {
      return _o(f) === Gf;
    }
    function om(f) {
      return _o(f) === Ff;
    }
    function am(f) {
      return _o(f) === $f;
    }
    function al(f) {
      if (!f)
        return !1;
      var b = _o(f);
      return tm.indexOf(b) >= 0 ? !0 : zf(f) || jf(f) || mn(f);
    }
    function Uf(f) {
      return Gs[Object.prototype.toString.call(f)] | 0;
    }
    function im(f, b) {
      var E = b.length;
      switch (f.type) {
        case jo:
        case Js:
        case el:
        case Na:
          var U = gt.allocType(f.type, E);
          U.set(b), f.data = U;
          break;
        case zo:
          f.data = vf(b);
          break;
        default:
          g.raise("unsupported texture type, must specify a typed array");
      }
    }
    function Vf(f, b) {
      return gt.allocType(
        f.type === zo ? Na : f.type,
        b
      );
    }
    function Xf(f, b) {
      f.type === zo ? (f.data = vf(b), gt.freeType(b)) : f.data = b;
    }
    function sm(f, b, E, U, ee, H) {
      for (var K = f.width, le = f.height, se = f.channels, he = K * le * se, be = Vf(f, he), ye = 0, xe = 0; xe < le; ++xe)
        for (var ce = 0; ce < K; ++ce)
          for (var me = 0; me < se; ++me)
            be[ye++] = b[E * ce + U * xe + ee * me + H];
      Xf(f, be);
    }
    function K0(f, b, E, U, ee, H) {
      var K;
      if (typeof Lr[f] < "u" ? K = Lr[f] : K = on[f] * Ho[b], H && (K *= 6), ee) {
        for (var le = 0, se = E; se >= 1; )
          le += K * se * se, se /= 2;
        return le;
      } else
        return K * E * U;
    }
    function lm(f, b, E, U, ee, H, K) {
      var le = {
        "don't care": Y0,
        "dont care": Y0,
        nice: W5,
        fast: X5
      }, se = {
        repeat: z5,
        clamp: tl,
        mirror: j5
      }, he = {
        nearest: rl,
        linear: U5
      }, be = n({
        mipmap: ol,
        "nearest mipmap nearest": nl,
        "linear mipmap nearest": If,
        "nearest mipmap linear": Nf,
        "linear mipmap linear": ol
      }, he), ye = {
        none: 0,
        browser: Of
      }, xe = {
        uint8: jo,
        rgba4: P5,
        rgb565: B5,
        "rgb5 a1": D5
      }, ce = {
        alpha: Hs,
        luminance: Ia,
        "luminance alpha": X0,
        rgb: V0,
        rgba: vo,
        rgba4: wf,
        "rgb5 a1": Us,
        rgb565: xf
      }, me = {};
      b.ext_srgb && (ce.srgb = Xs, ce.srgba = Ws), b.oes_texture_float && (xe.float32 = xe.float = Na), b.oes_texture_half_float && (xe.float16 = xe["half float"] = zo), b.webgl_depth_texture && (n(ce, {
        depth: Vs,
        "depth stencil": W0
      }), n(xe, {
        uint16: Js,
        uint32: el,
        "depth stencil": G5
      })), b.webgl_compressed_texture_s3tc && n(me, {
        "rgb s3tc dxt1": Ys,
        "rgba s3tc dxt1": Zs,
        "rgba s3tc dxt3": Ks,
        "rgba s3tc dxt5": Qs
      }), b.webgl_compressed_texture_atc && n(me, {
        "rgb atc": Ef,
        "rgba atc explicit alpha": Sf,
        "rgba atc interpolated alpha": kf
      }), b.webgl_compressed_texture_pvrtc && n(me, {
        "rgb pvrtc 4bppv1": Tf,
        "rgb pvrtc 2bppv1": Mf,
        "rgba pvrtc 4bppv1": Lf,
        "rgba pvrtc 2bppv1": Cf
      }), b.webgl_compressed_texture_etc1 && (me["rgb etc1"] = Rf);
      var B = Array.prototype.slice.call(
        f.getParameter(O5)
      );
      Object.keys(me).forEach(function(w) {
        var X = me[w];
        B.indexOf(X) >= 0 && (ce[w] = X);
      });
      var W = Object.keys(ce);
      E.textureFormats = W;
      var pe = [];
      Object.keys(ce).forEach(function(w) {
        var X = ce[w];
        pe[X] = w;
      });
      var Oe = [];
      Object.keys(xe).forEach(function(w) {
        var X = xe[w];
        Oe[X] = w;
      });
      var ie = [];
      Object.keys(he).forEach(function(w) {
        var X = he[w];
        ie[X] = w;
      });
      var Re = [];
      Object.keys(be).forEach(function(w) {
        var X = be[w];
        Re[X] = w;
      });
      var Te = [];
      Object.keys(se).forEach(function(w) {
        var X = se[w];
        Te[X] = w;
      });
      var Ze = W.reduce(function(w, X) {
        var q = ce[X];
        return q === Ia || q === Hs || q === Ia || q === X0 || q === Vs || q === W0 || b.ext_srgb && (q === Xs || q === Ws) ? w[q] = q : q === Us || X.indexOf("rgba") >= 0 ? w[q] = vo : w[q] = V0, w;
      }, {});
      function re() {
        this.internalformat = vo, this.format = vo, this.type = jo, this.compressed = !1, this.premultiplyAlpha = !1, this.flipY = !1, this.unpackAlignment = 1, this.colorSpace = Of, this.width = 0, this.height = 0, this.channels = 0;
      }
      function J(w, X) {
        w.internalformat = X.internalformat, w.format = X.format, w.type = X.type, w.compressed = X.compressed, w.premultiplyAlpha = X.premultiplyAlpha, w.flipY = X.flipY, w.unpackAlignment = X.unpackAlignment, w.colorSpace = X.colorSpace, w.width = X.width, w.height = X.height, w.channels = X.channels;
      }
      function je(w, X) {
        if (!(typeof X != "object" || !X)) {
          if ("premultiplyAlpha" in X && (g.type(
            X.premultiplyAlpha,
            "boolean",
            "invalid premultiplyAlpha"
          ), w.premultiplyAlpha = X.premultiplyAlpha), "flipY" in X && (g.type(
            X.flipY,
            "boolean",
            "invalid texture flip"
          ), w.flipY = X.flipY), "alignment" in X && (g.oneOf(
            X.alignment,
            [1, 2, 4, 8],
            "invalid texture unpack alignment"
          ), w.unpackAlignment = X.alignment), "colorSpace" in X && (g.parameter(
            X.colorSpace,
            ye,
            "invalid colorSpace"
          ), w.colorSpace = ye[X.colorSpace]), "type" in X) {
            var q = X.type;
            g(
              b.oes_texture_float || !(q === "float" || q === "float32"),
              "you must enable the OES_texture_float extension in order to use floating point textures."
            ), g(
              b.oes_texture_half_float || !(q === "half float" || q === "float16"),
              "you must enable the OES_texture_half_float extension in order to use 16-bit floating point textures."
            ), g(
              b.webgl_depth_texture || !(q === "uint16" || q === "uint32" || q === "depth stencil"),
              "you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures."
            ), g.parameter(
              q,
              xe,
              "invalid texture type"
            ), w.type = xe[q];
          }
          var $e = w.width, At = w.height, v = w.channels, h = !1;
          "shape" in X ? (g(
            Array.isArray(X.shape) && X.shape.length >= 2,
            "shape must be an array"
          ), $e = X.shape[0], At = X.shape[1], X.shape.length === 3 && (v = X.shape[2], g(v > 0 && v <= 4, "invalid number of channels"), h = !0), g($e >= 0 && $e <= E.maxTextureSize, "invalid width"), g(At >= 0 && At <= E.maxTextureSize, "invalid height")) : ("radius" in X && ($e = At = X.radius, g($e >= 0 && $e <= E.maxTextureSize, "invalid radius")), "width" in X && ($e = X.width, g($e >= 0 && $e <= E.maxTextureSize, "invalid width")), "height" in X && (At = X.height, g(At >= 0 && At <= E.maxTextureSize, "invalid height")), "channels" in X && (v = X.channels, g(v > 0 && v <= 4, "invalid number of channels"), h = !0)), w.width = $e | 0, w.height = At | 0, w.channels = v | 0;
          var k = !1;
          if ("format" in X) {
            var D = X.format;
            g(
              b.webgl_depth_texture || !(D === "depth" || D === "depth stencil"),
              "you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures."
            ), g.parameter(
              D,
              ce,
              "invalid texture format"
            );
            var F = w.internalformat = ce[D];
            w.format = Ze[F], D in xe && ("type" in X || (w.type = xe[D])), D in me && (w.compressed = !0), k = !0;
          }
          !h && k ? w.channels = on[w.format] : h && !k ? w.channels !== Z0[w.format] && (w.format = w.internalformat = Z0[w.channels]) : k && h && g(
            w.channels === on[w.format],
            "number of channels inconsistent with specified format"
          );
        }
      }
      function Ee(w) {
        f.pixelStorei(K5, w.flipY), f.pixelStorei(Q5, w.premultiplyAlpha), f.pixelStorei(J5, w.colorSpace), f.pixelStorei(Z5, w.unpackAlignment);
      }
      function ue() {
        re.call(this), this.xOffset = 0, this.yOffset = 0, this.data = null, this.needsFree = !1, this.element = null, this.needsCopy = !1;
      }
      function Se(w, X) {
        var q = null;
        if (al(X) ? q = X : X && (g.type(X, "object", "invalid pixel data type"), je(w, X), "x" in X && (w.xOffset = X.x | 0), "y" in X && (w.yOffset = X.y | 0), al(X.data) && (q = X.data)), g(
          !w.compressed || q instanceof Uint8Array,
          "compressed texture data must be stored in a uint8array"
        ), X.copy) {
          g(!q, "can not specify copy and data field for the same texture");
          var $e = ee.viewportWidth, At = ee.viewportHeight;
          w.width = w.width || $e - w.xOffset, w.height = w.height || At - w.yOffset, w.needsCopy = !0, g(
            w.xOffset >= 0 && w.xOffset < $e && w.yOffset >= 0 && w.yOffset < At && w.width > 0 && w.width <= $e && w.height > 0 && w.height <= At,
            "copy texture read out of bounds"
          );
        } else if (!q)
          w.width = w.width || 1, w.height = w.height || 1, w.channels = w.channels || 4;
        else if (r(q))
          w.channels = w.channels || 4, w.data = q, !("type" in X) && w.type === jo && (w.type = Uf(q));
        else if (zf(q))
          w.channels = w.channels || 4, im(w, q), w.alignment = 1, w.needsFree = !0;
        else if (mn(q)) {
          var v = q.data;
          !Array.isArray(v) && w.type === jo && (w.type = Uf(v));
          var h = q.shape, k = q.stride, D, F, C, M, P, A;
          h.length === 3 ? (C = h[2], A = k[2]) : (g(h.length === 2, "invalid ndarray pixel data, must be 2 or 3D"), C = 1, A = 1), D = h[0], F = h[1], M = k[0], P = k[1], w.alignment = 1, w.width = D, w.height = F, w.channels = C, w.format = w.internalformat = Z0[C], w.needsFree = !0, sm(w, v, M, P, A, q.offset);
        } else if (qf(q) || Hf(q) || rm(q))
          qf(q) || Hf(q) ? w.element = q : w.element = q.canvas, w.width = w.element.width, w.height = w.element.height, w.channels = 4;
        else if (nm(q))
          w.element = q, w.width = q.width, w.height = q.height, w.channels = 4;
        else if (om(q))
          w.element = q, w.width = q.naturalWidth, w.height = q.naturalHeight, w.channels = 4;
        else if (am(q))
          w.element = q, w.width = q.videoWidth, w.height = q.videoHeight, w.channels = 4;
        else if (jf(q)) {
          var S = w.width || q[0].length, _ = w.height || q.length, G = w.channels;
          ar(q[0][0]) ? G = G || q[0][0].length : G = G || 1;
          for (var $ = j0.shape(q), ae = 1, _e = 0; _e < $.length; ++_e)
            ae *= $[_e];
          var we = Vf(w, ae);
          j0.flatten(q, $, "", we), Xf(w, we), w.alignment = 1, w.width = S, w.height = _, w.channels = G, w.format = w.internalformat = Z0[G], w.needsFree = !0;
        }
        w.type === Na ? g(
          E.extensions.indexOf("oes_texture_float") >= 0,
          "oes_texture_float extension not enabled"
        ) : w.type === zo && g(
          E.extensions.indexOf("oes_texture_half_float") >= 0,
          "oes_texture_half_float extension not enabled"
        );
      }
      function ke(w, X, q) {
        var $e = w.element, At = w.data, v = w.internalformat, h = w.format, k = w.type, D = w.width, F = w.height;
        Ee(w), $e ? f.texImage2D(X, q, h, h, k, $e) : w.compressed ? f.compressedTexImage2D(X, q, v, D, F, 0, At) : w.needsCopy ? (U(), f.copyTexImage2D(
          X,
          q,
          h,
          w.xOffset,
          w.yOffset,
          D,
          F,
          0
        )) : f.texImage2D(X, q, h, D, F, 0, h, k, At || null);
      }
      function dt(w, X, q, $e, At) {
        var v = w.element, h = w.data, k = w.internalformat, D = w.format, F = w.type, C = w.width, M = w.height;
        Ee(w), v ? f.texSubImage2D(
          X,
          At,
          q,
          $e,
          D,
          F,
          v
        ) : w.compressed ? f.compressedTexSubImage2D(
          X,
          At,
          q,
          $e,
          k,
          C,
          M,
          h
        ) : w.needsCopy ? (U(), f.copyTexSubImage2D(
          X,
          At,
          q,
          $e,
          w.xOffset,
          w.yOffset,
          C,
          M
        )) : f.texSubImage2D(
          X,
          At,
          q,
          $e,
          C,
          M,
          D,
          F,
          h
        );
      }
      var ot = [];
      function Me() {
        return ot.pop() || new ue();
      }
      function Ne(w) {
        w.needsFree && gt.freeType(w.data), ue.call(w), ot.push(w);
      }
      function et() {
        re.call(this), this.genMipmaps = !1, this.mipmapHint = Y0, this.mipmask = 0, this.images = Array(16);
      }
      function ct(w, X, q) {
        var $e = w.images[0] = Me();
        w.mipmask = 1, $e.width = w.width = X, $e.height = w.height = q, $e.channels = w.channels = 4;
      }
      function _t(w, X) {
        var q = null;
        if (al(X))
          q = w.images[0] = Me(), J(q, w), Se(q, X), w.mipmask = 1;
        else if (je(w, X), Array.isArray(X.mipmap))
          for (var $e = X.mipmap, At = 0; At < $e.length; ++At)
            q = w.images[At] = Me(), J(q, w), q.width >>= At, q.height >>= At, Se(q, $e[At]), w.mipmask |= 1 << At;
        else
          q = w.images[0] = Me(), J(q, w), Se(q, X), w.mipmask = 1;
        J(w, w.images[0]), w.compressed && (w.internalformat === Ys || w.internalformat === Zs || w.internalformat === Ks || w.internalformat === Qs) && g(
          w.width % 4 === 0 && w.height % 4 === 0,
          "for compressed texture formats, mipmap level 0 must have width and height that are a multiple of 4"
        );
      }
      function Qt(w, X) {
        for (var q = w.images, $e = 0; $e < q.length; ++$e) {
          if (!q[$e])
            return;
          ke(q[$e], X, $e);
        }
      }
      var Jt = [];
      function St() {
        var w = Jt.pop() || new et();
        re.call(w), w.mipmask = 0;
        for (var X = 0; X < 16; ++X)
          w.images[X] = null;
        return w;
      }
      function pr(w) {
        for (var X = w.images, q = 0; q < X.length; ++q)
          X[q] && Ne(X[q]), X[q] = null;
        Jt.push(w);
      }
      function Xt() {
        this.minFilter = rl, this.magFilter = rl, this.wrapS = tl, this.wrapT = tl, this.anisotropic = 1, this.genMipmaps = !1, this.mipmapHint = Y0;
      }
      function cr(w, X) {
        if ("min" in X) {
          var q = X.min;
          g.parameter(q, be), w.minFilter = be[q], em.indexOf(w.minFilter) >= 0 && !("faces" in X) && (w.genMipmaps = !0);
        }
        if ("mag" in X) {
          var $e = X.mag;
          g.parameter($e, he), w.magFilter = he[$e];
        }
        var At = w.wrapS, v = w.wrapT;
        if ("wrap" in X) {
          var h = X.wrap;
          typeof h == "string" ? (g.parameter(h, se), At = v = se[h]) : Array.isArray(h) && (g.parameter(h[0], se), g.parameter(h[1], se), At = se[h[0]], v = se[h[1]]);
        } else {
          if ("wrapS" in X) {
            var k = X.wrapS;
            g.parameter(k, se), At = se[k];
          }
          if ("wrapT" in X) {
            var D = X.wrapT;
            g.parameter(D, se), v = se[D];
          }
        }
        if (w.wrapS = At, w.wrapT = v, "anisotropic" in X) {
          var F = X.anisotropic;
          g(
            typeof F == "number" && F >= 1 && F <= E.maxAnisotropic,
            "aniso samples must be between 1 and "
          ), w.anisotropic = X.anisotropic;
        }
        if ("mipmap" in X) {
          var C = !1;
          switch (typeof X.mipmap) {
            case "string":
              g.parameter(
                X.mipmap,
                le,
                "invalid mipmap hint"
              ), w.mipmapHint = le[X.mipmap], w.genMipmaps = !0, C = !0;
              break;
            case "boolean":
              C = w.genMipmaps = X.mipmap;
              break;
            case "object":
              g(Array.isArray(X.mipmap), "invalid mipmap type"), w.genMipmaps = !1, C = !0;
              break;
            default:
              g.raise("invalid mipmap type");
          }
          C && !("min" in X) && (w.minFilter = nl);
        }
      }
      function mr(w, X) {
        f.texParameteri(X, H5, w.minFilter), f.texParameteri(X, q5, w.magFilter), f.texParameteri(X, F5, w.wrapS), f.texParameteri(X, $5, w.wrapT), b.ext_texture_filter_anisotropic && f.texParameteri(X, Y5, w.anisotropic), w.genMipmaps && (f.hint(V5, w.mipmapHint), f.generateMipmap(X));
      }
      var hr = 0, xr = {}, Cr = E.maxTextureUnits, ir = Array(Cr).map(function() {
        return null;
      });
      function yt(w) {
        re.call(this), this.mipmask = 0, this.internalformat = vo, this.id = hr++, this.refCount = 1, this.target = w, this.texture = f.createTexture(), this.unit = -1, this.bindCount = 0, this.texInfo = new Xt(), K.profile && (this.stats = { size: 0 });
      }
      function Rr(w) {
        f.activeTexture(Oa), f.bindTexture(w.target, w.texture);
      }
      function Bt() {
        var w = ir[0];
        w ? f.bindTexture(w.target, w.texture) : f.bindTexture(wn, null);
      }
      function Je(w) {
        var X = w.texture;
        g(X, "must not double destroy texture");
        var q = w.unit, $e = w.target;
        q >= 0 && (f.activeTexture(Oa + q), f.bindTexture($e, null), ir[q] = null), f.deleteTexture(X), w.texture = null, w.params = null, w.pixels = null, w.refCount = 0, delete xr[w.id], H.textureCount--;
      }
      n(yt.prototype, {
        bind: function() {
          var w = this;
          w.bindCount += 1;
          var X = w.unit;
          if (X < 0) {
            for (var q = 0; q < Cr; ++q) {
              var $e = ir[q];
              if ($e) {
                if ($e.bindCount > 0)
                  continue;
                $e.unit = -1;
              }
              ir[q] = w, X = q;
              break;
            }
            X >= Cr && g.raise("insufficient number of texture units"), K.profile && H.maxTextureUnits < X + 1 && (H.maxTextureUnits = X + 1), w.unit = X, f.activeTexture(Oa + X), f.bindTexture(w.target, w.texture);
          }
          return X;
        },
        unbind: function() {
          this.bindCount -= 1;
        },
        decRef: function() {
          --this.refCount <= 0 && Je(this);
        }
      });
      function wt(w, X) {
        var q = new yt(wn);
        xr[q.id] = q, H.textureCount++;
        function $e(h, k) {
          var D = q.texInfo;
          Xt.call(D);
          var F = St();
          return typeof h == "number" ? typeof k == "number" ? ct(F, h | 0, k | 0) : ct(F, h | 0, h | 0) : h ? (g.type(h, "object", "invalid arguments to regl.texture"), cr(D, h), _t(F, h)) : ct(F, 1, 1), D.genMipmaps && (F.mipmask = (F.width << 1) - 1), q.mipmask = F.mipmask, J(q, F), g.texture2D(D, F, E), q.internalformat = F.internalformat, $e.width = F.width, $e.height = F.height, Rr(q), Qt(F, wn), mr(D, wn), Bt(), pr(F), K.profile && (q.stats.size = K0(
            q.internalformat,
            q.type,
            F.width,
            F.height,
            D.genMipmaps,
            !1
          )), $e.format = pe[q.internalformat], $e.type = Oe[q.type], $e.mag = ie[D.magFilter], $e.min = Re[D.minFilter], $e.wrapS = Te[D.wrapS], $e.wrapT = Te[D.wrapT], $e;
        }
        function At(h, k, D, F) {
          g(!!h, "must specify image data");
          var C = k | 0, M = D | 0, P = F | 0, A = Me();
          return J(A, q), A.width = 0, A.height = 0, Se(A, h), A.width = A.width || (q.width >> P) - C, A.height = A.height || (q.height >> P) - M, g(
            q.type === A.type && q.format === A.format && q.internalformat === A.internalformat,
            "incompatible format for texture.subimage"
          ), g(
            C >= 0 && M >= 0 && C + A.width <= q.width && M + A.height <= q.height,
            "texture.subimage write out of bounds"
          ), g(
            q.mipmask & 1 << P,
            "missing mipmap data"
          ), g(
            A.data || A.element || A.needsCopy,
            "missing image data"
          ), Rr(q), dt(A, wn, C, M, P), Bt(), Ne(A), $e;
        }
        function v(h, k) {
          var D = h | 0, F = k | 0 || D;
          if (D === q.width && F === q.height)
            return $e;
          $e.width = q.width = D, $e.height = q.height = F, Rr(q);
          for (var C = 0; q.mipmask >> C; ++C) {
            var M = D >> C, P = F >> C;
            if (!M || !P) break;
            f.texImage2D(
              wn,
              C,
              q.format,
              M,
              P,
              0,
              q.format,
              q.type,
              null
            );
          }
          return Bt(), K.profile && (q.stats.size = K0(
            q.internalformat,
            q.type,
            D,
            F,
            !1,
            !1
          )), $e;
        }
        return $e(w, X), $e.subimage = At, $e.resize = v, $e._reglType = "texture2d", $e._texture = q, K.profile && ($e.stats = q.stats), $e.destroy = function() {
          q.decRef();
        }, $e;
      }
      function Nt(w, X, q, $e, At, v) {
        var h = new yt(qs);
        xr[h.id] = h, H.cubeCount++;
        var k = new Array(6);
        function D(M, P, A, S, _, G) {
          var $, ae = h.texInfo;
          for (Xt.call(ae), $ = 0; $ < 6; ++$)
            k[$] = St();
          if (typeof M == "number" || !M) {
            var _e = M | 0 || 1;
            for ($ = 0; $ < 6; ++$)
              ct(k[$], _e, _e);
          } else if (typeof M == "object")
            if (P)
              _t(k[0], M), _t(k[1], P), _t(k[2], A), _t(k[3], S), _t(k[4], _), _t(k[5], G);
            else if (cr(ae, M), je(h, M), "faces" in M) {
              var we = M.faces;
              for (g(
                Array.isArray(we) && we.length === 6,
                "cube faces must be a length 6 array"
              ), $ = 0; $ < 6; ++$)
                g(
                  typeof we[$] == "object" && !!we[$],
                  "invalid input for cube map face"
                ), J(k[$], h), _t(k[$], we[$]);
            } else
              for ($ = 0; $ < 6; ++$)
                _t(k[$], M);
          else
            g.raise("invalid arguments to cube map");
          for (J(h, k[0]), g.optional(function() {
            E.npotTextureCube || g(_f(h.width) && _f(h.height), "your browser does not support non power or two texture dimensions");
          }), ae.genMipmaps ? h.mipmask = (k[0].width << 1) - 1 : h.mipmask = k[0].mipmask, g.textureCube(h, ae, k, E), h.internalformat = k[0].internalformat, D.width = k[0].width, D.height = k[0].height, Rr(h), $ = 0; $ < 6; ++$)
            Qt(k[$], U0 + $);
          for (mr(ae, qs), Bt(), K.profile && (h.stats.size = K0(
            h.internalformat,
            h.type,
            D.width,
            D.height,
            ae.genMipmaps,
            !0
          )), D.format = pe[h.internalformat], D.type = Oe[h.type], D.mag = ie[ae.magFilter], D.min = Re[ae.minFilter], D.wrapS = Te[ae.wrapS], D.wrapT = Te[ae.wrapT], $ = 0; $ < 6; ++$)
            pr(k[$]);
          return D;
        }
        function F(M, P, A, S, _) {
          g(!!P, "must specify image data"), g(typeof M == "number" && M === (M | 0) && M >= 0 && M < 6, "invalid face");
          var G = A | 0, $ = S | 0, ae = _ | 0, _e = Me();
          return J(_e, h), _e.width = 0, _e.height = 0, Se(_e, P), _e.width = _e.width || (h.width >> ae) - G, _e.height = _e.height || (h.height >> ae) - $, g(
            h.type === _e.type && h.format === _e.format && h.internalformat === _e.internalformat,
            "incompatible format for texture.subimage"
          ), g(
            G >= 0 && $ >= 0 && G + _e.width <= h.width && $ + _e.height <= h.height,
            "texture.subimage write out of bounds"
          ), g(
            h.mipmask & 1 << ae,
            "missing mipmap data"
          ), g(
            _e.data || _e.element || _e.needsCopy,
            "missing image data"
          ), Rr(h), dt(_e, U0 + M, G, $, ae), Bt(), Ne(_e), D;
        }
        function C(M) {
          var P = M | 0;
          if (P !== h.width) {
            D.width = h.width = P, D.height = h.height = P, Rr(h);
            for (var A = 0; A < 6; ++A)
              for (var S = 0; h.mipmask >> S; ++S)
                f.texImage2D(
                  U0 + A,
                  S,
                  h.format,
                  P >> S,
                  P >> S,
                  0,
                  h.format,
                  h.type,
                  null
                );
            return Bt(), K.profile && (h.stats.size = K0(
              h.internalformat,
              h.type,
              D.width,
              D.height,
              !1,
              !0
            )), D;
          }
        }
        return D(w, X, q, $e, At, v), D.subimage = F, D.resize = C, D._reglType = "textureCube", D._texture = h, K.profile && (D.stats = h.stats), D.destroy = function() {
          h.decRef();
        }, D;
      }
      function sr() {
        for (var w = 0; w < Cr; ++w)
          f.activeTexture(Oa + w), f.bindTexture(wn, null), ir[w] = null;
        Kr(xr).forEach(Je), H.cubeCount = 0, H.textureCount = 0;
      }
      K.profile && (H.getTotalTextureSize = function() {
        var w = 0;
        return Object.keys(xr).forEach(function(X) {
          w += xr[X].stats.size;
        }), w;
      });
      function En() {
        for (var w = 0; w < Cr; ++w) {
          var X = ir[w];
          X && (X.bindCount = 0, X.unit = -1, ir[w] = null);
        }
        Kr(xr).forEach(function(q) {
          q.texture = f.createTexture(), f.bindTexture(q.target, q.texture);
          for (var $e = 0; $e < 32; ++$e)
            if (q.mipmask & 1 << $e)
              if (q.target === wn)
                f.texImage2D(
                  wn,
                  $e,
                  q.internalformat,
                  q.width >> $e,
                  q.height >> $e,
                  0,
                  q.internalformat,
                  q.type,
                  null
                );
              else
                for (var At = 0; At < 6; ++At)
                  f.texImage2D(
                    U0 + At,
                    $e,
                    q.internalformat,
                    q.width >> $e,
                    q.height >> $e,
                    0,
                    q.internalformat,
                    q.type,
                    null
                  );
          mr(q.texInfo, q.target);
        });
      }
      function Mo() {
        for (var w = 0; w < Cr; ++w) {
          var X = ir[w];
          X && (X.bindCount = 0, X.unit = -1, ir[w] = null), f.activeTexture(Oa + w), f.bindTexture(wn, null), f.bindTexture(qs, null);
        }
      }
      return {
        create2D: wt,
        createCube: Nt,
        clear: sr,
        getTexture: function(w) {
          return null;
        },
        restore: En,
        refresh: Mo
      };
    }
    var to = 36161, Q0 = 32854, Wf = 32855, Yf = 36194, Zf = 33189, Kf = 36168, Qf = 34041, Jf = 35907, eu = 34836, tu = 34842, ru = 34843, hn = [];
    hn[Q0] = 2, hn[Wf] = 2, hn[Yf] = 2, hn[Zf] = 2, hn[Kf] = 1, hn[Qf] = 4, hn[Jf] = 4, hn[eu] = 16, hn[tu] = 8, hn[ru] = 6;
    function nu(f, b, E) {
      return hn[f] * b * E;
    }
    var cm = function(f, b, E, U, ee) {
      var H = {
        rgba4: Q0,
        rgb565: Yf,
        "rgb5 a1": Wf,
        depth: Zf,
        stencil: Kf,
        "depth stencil": Qf
      };
      b.ext_srgb && (H.srgba = Jf), b.ext_color_buffer_half_float && (H.rgba16f = tu, H.rgb16f = ru), b.webgl_color_buffer_float && (H.rgba32f = eu);
      var K = [];
      Object.keys(H).forEach(function(ce) {
        var me = H[ce];
        K[me] = ce;
      });
      var le = 0, se = {};
      function he(ce) {
        this.id = le++, this.refCount = 1, this.renderbuffer = ce, this.format = Q0, this.width = 0, this.height = 0, ee.profile && (this.stats = { size: 0 });
      }
      he.prototype.decRef = function() {
        --this.refCount <= 0 && be(this);
      };
      function be(ce) {
        var me = ce.renderbuffer;
        g(me, "must not double destroy renderbuffer"), f.bindRenderbuffer(to, null), f.deleteRenderbuffer(me), ce.renderbuffer = null, ce.refCount = 0, delete se[ce.id], U.renderbufferCount--;
      }
      function ye(ce, me) {
        var B = new he(f.createRenderbuffer());
        se[B.id] = B, U.renderbufferCount++;
        function W(Oe, ie) {
          var Re = 0, Te = 0, Ze = Q0;
          if (typeof Oe == "object" && Oe) {
            var re = Oe;
            if ("shape" in re) {
              var J = re.shape;
              g(
                Array.isArray(J) && J.length >= 2,
                "invalid renderbuffer shape"
              ), Re = J[0] | 0, Te = J[1] | 0;
            } else
              "radius" in re && (Re = Te = re.radius | 0), "width" in re && (Re = re.width | 0), "height" in re && (Te = re.height | 0);
            "format" in re && (g.parameter(
              re.format,
              H,
              "invalid renderbuffer format"
            ), Ze = H[re.format]);
          } else typeof Oe == "number" ? (Re = Oe | 0, typeof ie == "number" ? Te = ie | 0 : Te = Re) : Oe ? g.raise("invalid arguments to renderbuffer constructor") : Re = Te = 1;
          if (g(
            Re > 0 && Te > 0 && Re <= E.maxRenderbufferSize && Te <= E.maxRenderbufferSize,
            "invalid renderbuffer size"
          ), !(Re === B.width && Te === B.height && Ze === B.format))
            return W.width = B.width = Re, W.height = B.height = Te, B.format = Ze, f.bindRenderbuffer(to, B.renderbuffer), f.renderbufferStorage(to, Ze, Re, Te), g(
              f.getError() === 0,
              "invalid render buffer format"
            ), ee.profile && (B.stats.size = nu(B.format, B.width, B.height)), W.format = K[B.format], W;
        }
        function pe(Oe, ie) {
          var Re = Oe | 0, Te = ie | 0 || Re;
          return Re === B.width && Te === B.height || (g(
            Re > 0 && Te > 0 && Re <= E.maxRenderbufferSize && Te <= E.maxRenderbufferSize,
            "invalid renderbuffer size"
          ), W.width = B.width = Re, W.height = B.height = Te, f.bindRenderbuffer(to, B.renderbuffer), f.renderbufferStorage(to, B.format, Re, Te), g(
            f.getError() === 0,
            "invalid render buffer format"
          ), ee.profile && (B.stats.size = nu(
            B.format,
            B.width,
            B.height
          ))), W;
        }
        return W(ce, me), W.resize = pe, W._reglType = "renderbuffer", W._renderbuffer = B, ee.profile && (W.stats = B.stats), W.destroy = function() {
          B.decRef();
        }, W;
      }
      ee.profile && (U.getTotalRenderbufferSize = function() {
        var ce = 0;
        return Object.keys(se).forEach(function(me) {
          ce += se[me].stats.size;
        }), ce;
      });
      function xe() {
        Kr(se).forEach(function(ce) {
          ce.renderbuffer = f.createRenderbuffer(), f.bindRenderbuffer(to, ce.renderbuffer), f.renderbufferStorage(to, ce.format, ce.width, ce.height);
        }), f.bindRenderbuffer(to, null);
      }
      return {
        create: ye,
        clear: function() {
          Kr(se).forEach(be);
        },
        restore: xe
      };
    }, Bn = 36160, il = 36161, wo = 3553, J0 = 34069, ou = 36064, au = 36096, iu = 36128, su = 33306, lu = 36053, fm = 36054, um = 36055, dm = 36057, pm = 36061, mm = 36193, hm = 5121, ym = 5126, cu = 6407, fu = 6408, bm = 6402, gm = [
      cu,
      fu
    ], sl = [];
    sl[fu] = 4, sl[cu] = 3;
    var ei = [];
    ei[hm] = 1, ei[ym] = 4, ei[mm] = 2;
    var Am = 32854, vm = 32855, _m = 36194, wm = 33189, xm = 36168, uu = 34041, Em = 35907, Sm = 34836, km = 34842, Tm = 34843, Mm = [
      Am,
      vm,
      _m,
      Em,
      km,
      Tm,
      Sm
    ], Uo = {};
    Uo[lu] = "complete", Uo[fm] = "incomplete attachment", Uo[dm] = "incomplete dimensions", Uo[um] = "incomplete, missing attachment", Uo[pm] = "unsupported";
    function Lm(f, b, E, U, ee, H) {
      var K = {
        cur: null,
        next: null,
        dirty: !1,
        setFBO: null
      }, le = ["rgba"], se = ["rgba4", "rgb565", "rgb5 a1"];
      b.ext_srgb && se.push("srgba"), b.ext_color_buffer_half_float && se.push("rgba16f", "rgb16f"), b.webgl_color_buffer_float && se.push("rgba32f");
      var he = ["uint8"];
      b.oes_texture_half_float && he.push("half float", "float16"), b.oes_texture_float && he.push("float", "float32");
      function be(ue, Se, ke) {
        this.target = ue, this.texture = Se, this.renderbuffer = ke;
        var dt = 0, ot = 0;
        Se ? (dt = Se.width, ot = Se.height) : ke && (dt = ke.width, ot = ke.height), this.width = dt, this.height = ot;
      }
      function ye(ue) {
        ue && (ue.texture && ue.texture._texture.decRef(), ue.renderbuffer && ue.renderbuffer._renderbuffer.decRef());
      }
      function xe(ue, Se, ke) {
        if (ue)
          if (ue.texture) {
            var dt = ue.texture._texture, ot = Math.max(1, dt.width), Me = Math.max(1, dt.height);
            g(
              ot === Se && Me === ke,
              "inconsistent width/height for supplied texture"
            ), dt.refCount += 1;
          } else {
            var Ne = ue.renderbuffer._renderbuffer;
            g(
              Ne.width === Se && Ne.height === ke,
              "inconsistent width/height for renderbuffer"
            ), Ne.refCount += 1;
          }
      }
      function ce(ue, Se) {
        Se && (Se.texture ? f.framebufferTexture2D(
          Bn,
          ue,
          Se.target,
          Se.texture._texture.texture,
          0
        ) : f.framebufferRenderbuffer(
          Bn,
          ue,
          il,
          Se.renderbuffer._renderbuffer.renderbuffer
        ));
      }
      function me(ue) {
        var Se = wo, ke = null, dt = null, ot = ue;
        typeof ue == "object" && (ot = ue.data, "target" in ue && (Se = ue.target | 0)), g.type(ot, "function", "invalid attachment data");
        var Me = ot._reglType;
        return Me === "texture2d" ? (ke = ot, g(Se === wo)) : Me === "textureCube" ? (ke = ot, g(
          Se >= J0 && Se < J0 + 6,
          "invalid cube map target"
        )) : Me === "renderbuffer" ? (dt = ot, Se = il) : g.raise("invalid regl object for attachment"), new be(Se, ke, dt);
      }
      function B(ue, Se, ke, dt, ot) {
        if (ke) {
          var Me = U.create2D({
            width: ue,
            height: Se,
            format: dt,
            type: ot
          });
          return Me._texture.refCount = 0, new be(wo, Me, null);
        } else {
          var Ne = ee.create({
            width: ue,
            height: Se,
            format: dt
          });
          return Ne._renderbuffer.refCount = 0, new be(il, null, Ne);
        }
      }
      function W(ue) {
        return ue && (ue.texture || ue.renderbuffer);
      }
      function pe(ue, Se, ke) {
        ue && (ue.texture ? ue.texture.resize(Se, ke) : ue.renderbuffer && ue.renderbuffer.resize(Se, ke), ue.width = Se, ue.height = ke);
      }
      var Oe = 0, ie = {};
      function Re() {
        this.id = Oe++, ie[this.id] = this, this.framebuffer = f.createFramebuffer(), this.width = 0, this.height = 0, this.colorAttachments = [], this.depthAttachment = null, this.stencilAttachment = null, this.depthStencilAttachment = null;
      }
      function Te(ue) {
        ue.colorAttachments.forEach(ye), ye(ue.depthAttachment), ye(ue.stencilAttachment), ye(ue.depthStencilAttachment);
      }
      function Ze(ue) {
        var Se = ue.framebuffer;
        g(Se, "must not double destroy framebuffer"), f.deleteFramebuffer(Se), ue.framebuffer = null, H.framebufferCount--, delete ie[ue.id];
      }
      function re(ue) {
        var Se;
        f.bindFramebuffer(Bn, ue.framebuffer);
        var ke = ue.colorAttachments;
        for (Se = 0; Se < ke.length; ++Se)
          ce(ou + Se, ke[Se]);
        for (Se = ke.length; Se < E.maxColorAttachments; ++Se)
          f.framebufferTexture2D(
            Bn,
            ou + Se,
            wo,
            null,
            0
          );
        f.framebufferTexture2D(
          Bn,
          su,
          wo,
          null,
          0
        ), f.framebufferTexture2D(
          Bn,
          au,
          wo,
          null,
          0
        ), f.framebufferTexture2D(
          Bn,
          iu,
          wo,
          null,
          0
        ), ce(au, ue.depthAttachment), ce(iu, ue.stencilAttachment), ce(su, ue.depthStencilAttachment);
        var dt = f.checkFramebufferStatus(Bn);
        !f.isContextLost() && dt !== lu && g.raise("framebuffer configuration not supported, status = " + Uo[dt]), f.bindFramebuffer(Bn, K.next ? K.next.framebuffer : null), K.cur = K.next, f.getError();
      }
      function J(ue, Se) {
        var ke = new Re();
        H.framebufferCount++;
        function dt(Me, Ne) {
          var et;
          g(
            K.next !== ke,
            "can not update framebuffer which is currently in use"
          );
          var ct = 0, _t = 0, Qt = !0, Jt = !0, St = null, pr = !0, Xt = "rgba", cr = "uint8", mr = 1, hr = null, xr = null, Cr = null, ir = !1;
          if (typeof Me == "number")
            ct = Me | 0, _t = Ne | 0 || ct;
          else if (!Me)
            ct = _t = 1;
          else {
            g.type(Me, "object", "invalid arguments for framebuffer");
            var yt = Me;
            if ("shape" in yt) {
              var Rr = yt.shape;
              g(
                Array.isArray(Rr) && Rr.length >= 2,
                "invalid shape for framebuffer"
              ), ct = Rr[0], _t = Rr[1];
            } else
              "radius" in yt && (ct = _t = yt.radius), "width" in yt && (ct = yt.width), "height" in yt && (_t = yt.height);
            ("color" in yt || "colors" in yt) && (St = yt.color || yt.colors, Array.isArray(St) && g(
              St.length === 1 || b.webgl_draw_buffers,
              "multiple render targets not supported"
            )), St || ("colorCount" in yt && (mr = yt.colorCount | 0, g(mr > 0, "invalid color buffer count")), "colorTexture" in yt && (pr = !!yt.colorTexture, Xt = "rgba4"), "colorType" in yt && (cr = yt.colorType, pr ? (g(
              b.oes_texture_float || !(cr === "float" || cr === "float32"),
              "you must enable OES_texture_float in order to use floating point framebuffer objects"
            ), g(
              b.oes_texture_half_float || !(cr === "half float" || cr === "float16"),
              "you must enable OES_texture_half_float in order to use 16-bit floating point framebuffer objects"
            )) : cr === "half float" || cr === "float16" ? (g(
              b.ext_color_buffer_half_float,
              "you must enable EXT_color_buffer_half_float to use 16-bit render buffers"
            ), Xt = "rgba16f") : (cr === "float" || cr === "float32") && (g(
              b.webgl_color_buffer_float,
              "you must enable WEBGL_color_buffer_float in order to use 32-bit floating point renderbuffers"
            ), Xt = "rgba32f"), g.oneOf(cr, he, "invalid color type")), "colorFormat" in yt && (Xt = yt.colorFormat, le.indexOf(Xt) >= 0 ? pr = !0 : se.indexOf(Xt) >= 0 ? pr = !1 : g.optional(function() {
              pr ? g.oneOf(
                yt.colorFormat,
                le,
                "invalid color format for texture"
              ) : g.oneOf(
                yt.colorFormat,
                se,
                "invalid color format for renderbuffer"
              );
            }))), ("depthTexture" in yt || "depthStencilTexture" in yt) && (ir = !!(yt.depthTexture || yt.depthStencilTexture), g(
              !ir || b.webgl_depth_texture,
              "webgl_depth_texture extension not supported"
            )), "depth" in yt && (typeof yt.depth == "boolean" ? Qt = yt.depth : (hr = yt.depth, Jt = !1)), "stencil" in yt && (typeof yt.stencil == "boolean" ? Jt = yt.stencil : (xr = yt.stencil, Qt = !1)), "depthStencil" in yt && (typeof yt.depthStencil == "boolean" ? Qt = Jt = yt.depthStencil : (Cr = yt.depthStencil, Qt = !1, Jt = !1));
          }
          var Bt = null, Je = null, wt = null, Nt = null;
          if (Array.isArray(St))
            Bt = St.map(me);
          else if (St)
            Bt = [me(St)];
          else
            for (Bt = new Array(mr), et = 0; et < mr; ++et)
              Bt[et] = B(
                ct,
                _t,
                pr,
                Xt,
                cr
              );
          g(
            b.webgl_draw_buffers || Bt.length <= 1,
            "you must enable the WEBGL_draw_buffers extension in order to use multiple color buffers."
          ), g(
            Bt.length <= E.maxColorAttachments,
            "too many color attachments, not supported"
          ), ct = ct || Bt[0].width, _t = _t || Bt[0].height, hr ? Je = me(hr) : Qt && !Jt && (Je = B(
            ct,
            _t,
            ir,
            "depth",
            "uint32"
          )), xr ? wt = me(xr) : Jt && !Qt && (wt = B(
            ct,
            _t,
            !1,
            "stencil",
            "uint8"
          )), Cr ? Nt = me(Cr) : !hr && !xr && Jt && Qt && (Nt = B(
            ct,
            _t,
            ir,
            "depth stencil",
            "depth stencil"
          )), g(
            !!hr + !!xr + !!Cr <= 1,
            "invalid framebuffer configuration, can specify exactly one depth/stencil attachment"
          );
          var sr = null;
          for (et = 0; et < Bt.length; ++et)
            if (xe(Bt[et], ct, _t), g(
              !Bt[et] || Bt[et].texture && gm.indexOf(Bt[et].texture._texture.format) >= 0 || Bt[et].renderbuffer && Mm.indexOf(Bt[et].renderbuffer._renderbuffer.format) >= 0,
              "framebuffer color attachment " + et + " is invalid"
            ), Bt[et] && Bt[et].texture) {
              var En = sl[Bt[et].texture._texture.format] * ei[Bt[et].texture._texture.type];
              sr === null ? sr = En : g(
                sr === En,
                "all color attachments much have the same number of bits per pixel."
              );
            }
          return xe(Je, ct, _t), g(
            !Je || Je.texture && Je.texture._texture.format === bm || Je.renderbuffer && Je.renderbuffer._renderbuffer.format === wm,
            "invalid depth attachment for framebuffer object"
          ), xe(wt, ct, _t), g(
            !wt || wt.renderbuffer && wt.renderbuffer._renderbuffer.format === xm,
            "invalid stencil attachment for framebuffer object"
          ), xe(Nt, ct, _t), g(
            !Nt || Nt.texture && Nt.texture._texture.format === uu || Nt.renderbuffer && Nt.renderbuffer._renderbuffer.format === uu,
            "invalid depth-stencil attachment for framebuffer object"
          ), Te(ke), ke.width = ct, ke.height = _t, ke.colorAttachments = Bt, ke.depthAttachment = Je, ke.stencilAttachment = wt, ke.depthStencilAttachment = Nt, dt.color = Bt.map(W), dt.depth = W(Je), dt.stencil = W(wt), dt.depthStencil = W(Nt), dt.width = ke.width, dt.height = ke.height, re(ke), dt;
        }
        function ot(Me, Ne) {
          g(
            K.next !== ke,
            "can not resize a framebuffer which is currently in use"
          );
          var et = Math.max(Me | 0, 1), ct = Math.max(Ne | 0 || et, 1);
          if (et === ke.width && ct === ke.height)
            return dt;
          for (var _t = ke.colorAttachments, Qt = 0; Qt < _t.length; ++Qt)
            pe(_t[Qt], et, ct);
          return pe(ke.depthAttachment, et, ct), pe(ke.stencilAttachment, et, ct), pe(ke.depthStencilAttachment, et, ct), ke.width = dt.width = et, ke.height = dt.height = ct, re(ke), dt;
        }
        return dt(ue, Se), n(dt, {
          resize: ot,
          _reglType: "framebuffer",
          _framebuffer: ke,
          destroy: function() {
            Ze(ke), Te(ke);
          },
          use: function(Me) {
            K.setFBO({
              framebuffer: dt
            }, Me);
          }
        });
      }
      function je(ue) {
        var Se = Array(6);
        function ke(ot) {
          var Me;
          g(
            Se.indexOf(K.next) < 0,
            "can not update framebuffer which is currently in use"
          );
          var Ne = {
            color: null
          }, et = 0, ct = null, _t = "rgba", Qt = "uint8", Jt = 1;
          if (typeof ot == "number")
            et = ot | 0;
          else if (!ot)
            et = 1;
          else {
            g.type(ot, "object", "invalid arguments for framebuffer");
            var St = ot;
            if ("shape" in St) {
              var pr = St.shape;
              g(
                Array.isArray(pr) && pr.length >= 2,
                "invalid shape for framebuffer"
              ), g(
                pr[0] === pr[1],
                "cube framebuffer must be square"
              ), et = pr[0];
            } else
              "radius" in St && (et = St.radius | 0), "width" in St ? (et = St.width | 0, "height" in St && g(St.height === et, "must be square")) : "height" in St && (et = St.height | 0);
            ("color" in St || "colors" in St) && (ct = St.color || St.colors, Array.isArray(ct) && g(
              ct.length === 1 || b.webgl_draw_buffers,
              "multiple render targets not supported"
            )), ct || ("colorCount" in St && (Jt = St.colorCount | 0, g(Jt > 0, "invalid color buffer count")), "colorType" in St && (g.oneOf(
              St.colorType,
              he,
              "invalid color type"
            ), Qt = St.colorType), "colorFormat" in St && (_t = St.colorFormat, g.oneOf(
              St.colorFormat,
              le,
              "invalid color format for texture"
            ))), "depth" in St && (Ne.depth = St.depth), "stencil" in St && (Ne.stencil = St.stencil), "depthStencil" in St && (Ne.depthStencil = St.depthStencil);
          }
          var Xt;
          if (ct)
            if (Array.isArray(ct))
              for (Xt = [], Me = 0; Me < ct.length; ++Me)
                Xt[Me] = ct[Me];
            else
              Xt = [ct];
          else {
            Xt = Array(Jt);
            var cr = {
              radius: et,
              format: _t,
              type: Qt
            };
            for (Me = 0; Me < Jt; ++Me)
              Xt[Me] = U.createCube(cr);
          }
          for (Ne.color = Array(Xt.length), Me = 0; Me < Xt.length; ++Me) {
            var mr = Xt[Me];
            g(
              typeof mr == "function" && mr._reglType === "textureCube",
              "invalid cube map"
            ), et = et || mr.width, g(
              mr.width === et && mr.height === et,
              "invalid cube map shape"
            ), Ne.color[Me] = {
              target: J0,
              data: Xt[Me]
            };
          }
          for (Me = 0; Me < 6; ++Me) {
            for (var hr = 0; hr < Xt.length; ++hr)
              Ne.color[hr].target = J0 + Me;
            Me > 0 && (Ne.depth = Se[0].depth, Ne.stencil = Se[0].stencil, Ne.depthStencil = Se[0].depthStencil), Se[Me] ? Se[Me](Ne) : Se[Me] = J(Ne);
          }
          return n(ke, {
            width: et,
            height: et,
            color: Xt
          });
        }
        function dt(ot) {
          var Me, Ne = ot | 0;
          if (g(
            Ne > 0 && Ne <= E.maxCubeMapSize,
            "invalid radius for cube fbo"
          ), Ne === ke.width)
            return ke;
          var et = ke.color;
          for (Me = 0; Me < et.length; ++Me)
            et[Me].resize(Ne);
          for (Me = 0; Me < 6; ++Me)
            Se[Me].resize(Ne);
          return ke.width = ke.height = Ne, ke;
        }
        return ke(ue), n(ke, {
          faces: Se,
          resize: dt,
          _reglType: "framebufferCube",
          destroy: function() {
            Se.forEach(function(ot) {
              ot.destroy();
            });
          }
        });
      }
      function Ee() {
        K.cur = null, K.next = null, K.dirty = !0, Kr(ie).forEach(function(ue) {
          ue.framebuffer = f.createFramebuffer(), re(ue);
        });
      }
      return n(K, {
        getFramebuffer: function(ue) {
          if (typeof ue == "function" && ue._reglType === "framebuffer") {
            var Se = ue._framebuffer;
            if (Se instanceof Re)
              return Se;
          }
          return null;
        },
        create: J,
        createCube: je,
        clear: function() {
          Kr(ie).forEach(Ze);
        },
        restore: Ee
      });
    }
    var Cm = 5126, du = 34962, ti = 34963, pu = [
      "attributes",
      "elements",
      "offset",
      "count",
      "primitive",
      "instances"
    ];
    function ll() {
      this.state = 0, this.x = 0, this.y = 0, this.z = 0, this.w = 0, this.buffer = null, this.size = 0, this.normalized = !1, this.type = Cm, this.offset = 0, this.stride = 0, this.divisor = 0;
    }
    function Rm(f, b, E, U, ee, H, K) {
      for (var le = E.maxAttributes, se = new Array(le), he = 0; he < le; ++he)
        se[he] = new ll();
      var be = 0, ye = {}, xe = {
        Record: ll,
        scope: {},
        state: se,
        currentVAO: null,
        targetVAO: null,
        restore: me() ? Te : function() {
        },
        createVAO: Ze,
        getVAO: W,
        destroyBuffer: ce,
        setVAO: me() ? pe : Oe,
        clear: me() ? ie : function() {
        }
      };
      function ce(re) {
        for (var J = 0; J < se.length; ++J) {
          var je = se[J];
          je.buffer === re && (f.disableVertexAttribArray(J), je.buffer = null);
        }
      }
      function me() {
        return b.oes_vertex_array_object;
      }
      function B() {
        return b.angle_instanced_arrays;
      }
      function W(re) {
        return typeof re == "function" && re._vao ? re._vao : null;
      }
      function pe(re) {
        if (re !== xe.currentVAO) {
          var J = me();
          re ? J.bindVertexArrayOES(re.vao) : J.bindVertexArrayOES(null), xe.currentVAO = re;
        }
      }
      function Oe(re) {
        if (re !== xe.currentVAO) {
          if (re)
            re.bindAttrs();
          else {
            for (var J = B(), je = 0; je < se.length; ++je) {
              var Ee = se[je];
              Ee.buffer ? (f.enableVertexAttribArray(je), Ee.buffer.bind(), f.vertexAttribPointer(je, Ee.size, Ee.type, Ee.normalized, Ee.stride, Ee.offfset), J && Ee.divisor && J.vertexAttribDivisorANGLE(je, Ee.divisor)) : (f.disableVertexAttribArray(je), f.vertexAttrib4f(je, Ee.x, Ee.y, Ee.z, Ee.w));
            }
            K.elements ? f.bindBuffer(ti, K.elements.buffer.buffer) : f.bindBuffer(ti, null);
          }
          xe.currentVAO = re;
        }
      }
      function ie() {
        Kr(ye).forEach(function(re) {
          re.destroy();
        });
      }
      function Re() {
        this.id = ++be, this.attributes = [], this.elements = null, this.ownsElements = !1, this.count = 0, this.offset = 0, this.instances = -1, this.primitive = 4;
        var re = me();
        re ? this.vao = re.createVertexArrayOES() : this.vao = null, ye[this.id] = this, this.buffers = [];
      }
      Re.prototype.bindAttrs = function() {
        for (var re = B(), J = this.attributes, je = 0; je < J.length; ++je) {
          var Ee = J[je];
          Ee.buffer ? (f.enableVertexAttribArray(je), f.bindBuffer(du, Ee.buffer.buffer), f.vertexAttribPointer(je, Ee.size, Ee.type, Ee.normalized, Ee.stride, Ee.offset), re && Ee.divisor && re.vertexAttribDivisorANGLE(je, Ee.divisor)) : (f.disableVertexAttribArray(je), f.vertexAttrib4f(je, Ee.x, Ee.y, Ee.z, Ee.w));
        }
        for (var ue = J.length; ue < le; ++ue)
          f.disableVertexAttribArray(ue);
        var Se = H.getElements(this.elements);
        Se ? f.bindBuffer(ti, Se.buffer.buffer) : f.bindBuffer(ti, null);
      }, Re.prototype.refresh = function() {
        var re = me();
        re && (re.bindVertexArrayOES(this.vao), this.bindAttrs(), xe.currentVAO = null, re.bindVertexArrayOES(null));
      }, Re.prototype.destroy = function() {
        if (this.vao) {
          var re = me();
          this === xe.currentVAO && (xe.currentVAO = null, re.bindVertexArrayOES(null)), re.deleteVertexArrayOES(this.vao), this.vao = null;
        }
        this.ownsElements && (this.elements.destroy(), this.elements = null, this.ownsElements = !1), ye[this.id] && (delete ye[this.id], U.vaoCount -= 1);
      };
      function Te() {
        var re = me();
        re && Kr(ye).forEach(function(J) {
          J.refresh();
        });
      }
      function Ze(re) {
        var J = new Re();
        U.vaoCount += 1;
        function je(Ee) {
          var ue;
          if (Array.isArray(Ee))
            ue = Ee, J.elements && J.ownsElements && J.elements.destroy(), J.elements = null, J.ownsElements = !1, J.offset = 0, J.count = 0, J.instances = -1, J.primitive = 4;
          else {
            if (g(typeof Ee == "object", "invalid arguments for create vao"), g("attributes" in Ee, "must specify attributes for vao"), Ee.elements) {
              var Se = Ee.elements;
              J.ownsElements ? typeof Se == "function" && Se._reglType === "elements" ? (J.elements.destroy(), J.ownsElements = !1) : (J.elements(Se), J.ownsElements = !1) : H.getElements(Ee.elements) ? (J.elements = Ee.elements, J.ownsElements = !1) : (J.elements = H.create(Ee.elements), J.ownsElements = !0);
            } else
              J.elements = null, J.ownsElements = !1;
            ue = Ee.attributes, J.offset = 0, J.count = -1, J.instances = -1, J.primitive = 4, J.elements && (J.count = J.elements._elements.vertCount, J.primitive = J.elements._elements.primType), "offset" in Ee && (J.offset = Ee.offset | 0), "count" in Ee && (J.count = Ee.count | 0), "instances" in Ee && (J.instances = Ee.instances | 0), "primitive" in Ee && (g(Ee.primitive in eo, "bad primitive type: " + Ee.primitive), J.primitive = eo[Ee.primitive]), g.optional(() => {
              for (var Qt = Object.keys(Ee), Jt = 0; Jt < Qt.length; ++Jt)
                g(pu.indexOf(Qt[Jt]) >= 0, 'invalid option for vao: "' + Qt[Jt] + '" valid options are ' + pu);
            }), g(Array.isArray(ue), "attributes must be an array");
          }
          g(ue.length < le, "too many attributes"), g(ue.length > 0, "must specify at least one attribute");
          var ke = {}, dt = J.attributes;
          dt.length = ue.length;
          for (var ot = 0; ot < ue.length; ++ot) {
            var Me = ue[ot], Ne = dt[ot] = new ll(), et = Me.data || Me;
            if (Array.isArray(et) || r(et) || mn(et)) {
              var ct;
              J.buffers[ot] && (ct = J.buffers[ot], r(et) && ct._buffer.byteLength >= et.byteLength ? ct.subdata(et) : (ct.destroy(), J.buffers[ot] = null)), J.buffers[ot] || (ct = J.buffers[ot] = ee.create(Me, du, !1, !0)), Ne.buffer = ee.getBuffer(ct), Ne.size = Ne.buffer.dimension | 0, Ne.normalized = !1, Ne.type = Ne.buffer.dtype, Ne.offset = 0, Ne.stride = 0, Ne.divisor = 0, Ne.state = 1, ke[ot] = 1;
            } else ee.getBuffer(Me) ? (Ne.buffer = ee.getBuffer(Me), Ne.size = Ne.buffer.dimension | 0, Ne.normalized = !1, Ne.type = Ne.buffer.dtype, Ne.offset = 0, Ne.stride = 0, Ne.divisor = 0, Ne.state = 1) : ee.getBuffer(Me.buffer) ? (Ne.buffer = ee.getBuffer(Me.buffer), Ne.size = (+Me.size || Ne.buffer.dimension) | 0, Ne.normalized = !!Me.normalized || !1, "type" in Me ? (g.parameter(Me.type, go, "invalid buffer type"), Ne.type = go[Me.type]) : Ne.type = Ne.buffer.dtype, Ne.offset = (Me.offset || 0) | 0, Ne.stride = (Me.stride || 0) | 0, Ne.divisor = (Me.divisor || 0) | 0, Ne.state = 1, g(Ne.size >= 1 && Ne.size <= 4, "size must be between 1 and 4"), g(Ne.offset >= 0, "invalid offset"), g(Ne.stride >= 0 && Ne.stride <= 255, "stride must be between 0 and 255"), g(Ne.divisor >= 0, "divisor must be positive"), g(!Ne.divisor || !!b.angle_instanced_arrays, "ANGLE_instanced_arrays must be enabled to use divisor")) : "x" in Me ? (g(ot > 0, "first attribute must not be a constant"), Ne.x = +Me.x || 0, Ne.y = +Me.y || 0, Ne.z = +Me.z || 0, Ne.w = +Me.w || 0, Ne.state = 2) : g(!1, "invalid attribute spec for location " + ot);
          }
          for (var _t = 0; _t < J.buffers.length; ++_t)
            !ke[_t] && J.buffers[_t] && (J.buffers[_t].destroy(), J.buffers[_t] = null);
          return J.refresh(), je;
        }
        return je.destroy = function() {
          for (var Ee = 0; Ee < J.buffers.length; ++Ee)
            J.buffers[Ee] && J.buffers[Ee].destroy();
          J.buffers.length = 0, J.ownsElements && (J.elements.destroy(), J.elements = null, J.ownsElements = !1), J.destroy();
        }, je._vao = J, je._reglType = "vao", je(re);
      }
      return xe;
    }
    var mu = 35632, Im = 35633, Nm = 35718, Om = 35721;
    function Pm(f, b, E, U) {
      var ee = {}, H = {};
      function K(B, W, pe, Oe) {
        this.name = B, this.id = W, this.location = pe, this.info = Oe;
      }
      function le(B, W) {
        for (var pe = 0; pe < B.length; ++pe)
          if (B[pe].id === W.id) {
            B[pe].location = W.location;
            return;
          }
        B.push(W);
      }
      function se(B, W, pe) {
        var Oe = B === mu ? ee : H, ie = Oe[W];
        if (!ie) {
          var Re = b.str(W);
          ie = f.createShader(B), f.shaderSource(ie, Re), f.compileShader(ie), g.shaderError(f, ie, Re, B, pe), Oe[W] = ie;
        }
        return ie;
      }
      var he = {}, be = [], ye = 0;
      function xe(B, W) {
        this.id = ye++, this.fragId = B, this.vertId = W, this.program = null, this.uniforms = [], this.attributes = [], this.refCount = 1, U.profile && (this.stats = {
          uniformsCount: 0,
          attributesCount: 0
        });
      }
      function ce(B, W, pe) {
        var Oe, ie, Re = se(mu, B.fragId), Te = se(Im, B.vertId), Ze = B.program = f.createProgram();
        if (f.attachShader(Ze, Re), f.attachShader(Ze, Te), pe)
          for (Oe = 0; Oe < pe.length; ++Oe) {
            var re = pe[Oe];
            f.bindAttribLocation(Ze, re[0], re[1]);
          }
        f.linkProgram(Ze), g.linkError(
          f,
          Ze,
          b.str(B.fragId),
          b.str(B.vertId),
          W
        );
        var J = f.getProgramParameter(Ze, Nm);
        U.profile && (B.stats.uniformsCount = J);
        var je = B.uniforms;
        for (Oe = 0; Oe < J; ++Oe)
          if (ie = f.getActiveUniform(Ze, Oe), ie)
            if (ie.size > 1)
              for (var Ee = 0; Ee < ie.size; ++Ee) {
                var ue = ie.name.replace("[0]", "[" + Ee + "]");
                le(je, new K(
                  ue,
                  b.id(ue),
                  f.getUniformLocation(Ze, ue),
                  ie
                ));
              }
            else
              le(je, new K(
                ie.name,
                b.id(ie.name),
                f.getUniformLocation(Ze, ie.name),
                ie
              ));
        var Se = f.getProgramParameter(Ze, Om);
        U.profile && (B.stats.attributesCount = Se);
        var ke = B.attributes;
        for (Oe = 0; Oe < Se; ++Oe)
          ie = f.getActiveAttrib(Ze, Oe), ie && le(ke, new K(
            ie.name,
            b.id(ie.name),
            f.getAttribLocation(Ze, ie.name),
            ie
          ));
      }
      U.profile && (E.getMaxUniformsCount = function() {
        var B = 0;
        return be.forEach(function(W) {
          W.stats.uniformsCount > B && (B = W.stats.uniformsCount);
        }), B;
      }, E.getMaxAttributesCount = function() {
        var B = 0;
        return be.forEach(function(W) {
          W.stats.attributesCount > B && (B = W.stats.attributesCount);
        }), B;
      });
      function me() {
        ee = {}, H = {};
        for (var B = 0; B < be.length; ++B)
          ce(be[B], null, be[B].attributes.map(function(W) {
            return [W.location, W.name];
          }));
      }
      return {
        clear: function() {
          var B = f.deleteShader.bind(f);
          Kr(ee).forEach(B), ee = {}, Kr(H).forEach(B), H = {}, be.forEach(function(W) {
            f.deleteProgram(W.program);
          }), be.length = 0, he = {}, E.shaderCount = 0;
        },
        program: function(B, W, pe, Oe) {
          g.command(B >= 0, "missing vertex shader", pe), g.command(W >= 0, "missing fragment shader", pe);
          var ie = he[W];
          ie || (ie = he[W] = {});
          var Re = ie[B];
          if (Re && (Re.refCount++, !Oe))
            return Re;
          var Te = new xe(W, B);
          return E.shaderCount++, ce(Te, pe, Oe), Re || (ie[B] = Te), be.push(Te), n(Te, {
            destroy: function() {
              if (Te.refCount--, Te.refCount <= 0) {
                f.deleteProgram(Te.program);
                var Ze = be.indexOf(Te);
                be.splice(Ze, 1), E.shaderCount--;
              }
              ie[Te.vertId].refCount <= 0 && (f.deleteShader(H[Te.vertId]), delete H[Te.vertId], delete he[Te.fragId][Te.vertId]), Object.keys(he[Te.fragId]).length || (f.deleteShader(ee[Te.fragId]), delete ee[Te.fragId], delete he[Te.fragId]);
            }
          });
        },
        restore: me,
        shader: se,
        frag: -1,
        vert: -1
      };
    }
    var Dm = 6408, Pa = 5121, Bm = 3333, ri = 5126;
    function Gm(f, b, E, U, ee, H, K) {
      function le(be) {
        var ye;
        b.next === null ? (g(
          ee.preserveDrawingBuffer,
          'you must create a webgl context with "preserveDrawingBuffer":true in order to read pixels from the drawing buffer'
        ), ye = Pa) : (g(
          b.next.colorAttachments[0].texture !== null,
          "You cannot read from a renderbuffer"
        ), ye = b.next.colorAttachments[0].texture._texture.type, g.optional(function() {
          H.oes_texture_float ? (g(
            ye === Pa || ye === ri,
            "Reading from a framebuffer is only allowed for the types 'uint8' and 'float'"
          ), ye === ri && g(K.readFloat, "Reading 'float' values is not permitted in your browser. For a fallback, please see: https://www.npmjs.com/package/glsl-read-float")) : g(
            ye === Pa,
            "Reading from a framebuffer is only allowed for the type 'uint8'"
          );
        }));
        var xe = 0, ce = 0, me = U.framebufferWidth, B = U.framebufferHeight, W = null;
        r(be) ? W = be : be && (g.type(be, "object", "invalid arguments to regl.read()"), xe = be.x | 0, ce = be.y | 0, g(
          xe >= 0 && xe < U.framebufferWidth,
          "invalid x offset for regl.read"
        ), g(
          ce >= 0 && ce < U.framebufferHeight,
          "invalid y offset for regl.read"
        ), me = (be.width || U.framebufferWidth - xe) | 0, B = (be.height || U.framebufferHeight - ce) | 0, W = be.data || null), W && (ye === Pa ? g(
          W instanceof Uint8Array,
          "buffer must be 'Uint8Array' when reading from a framebuffer of type 'uint8'"
        ) : ye === ri && g(
          W instanceof Float32Array,
          "buffer must be 'Float32Array' when reading from a framebuffer of type 'float'"
        )), g(
          me > 0 && me + xe <= U.framebufferWidth,
          "invalid width for read pixels"
        ), g(
          B > 0 && B + ce <= U.framebufferHeight,
          "invalid height for read pixels"
        ), E();
        var pe = me * B * 4;
        return W || (ye === Pa ? W = new Uint8Array(pe) : ye === ri && (W = W || new Float32Array(pe))), g.isTypedArray(W, "data buffer for regl.read() must be a typedarray"), g(W.byteLength >= pe, "data buffer for regl.read() too small"), f.pixelStorei(Bm, 4), f.readPixels(
          xe,
          ce,
          me,
          B,
          Dm,
          ye,
          W
        ), W;
      }
      function se(be) {
        var ye;
        return b.setFBO({
          framebuffer: be.framebuffer
        }, function() {
          ye = le(be);
        }), ye;
      }
      function he(be) {
        return !be || !("framebuffer" in be) ? le(be) : se(be);
      }
      return he;
    }
    function Vo(f) {
      return Array.prototype.slice.call(f);
    }
    function Xo(f) {
      return Vo(f).join("");
    }
    function Fm() {
      var f = 0, b = [], E = [];
      function U(ye) {
        for (var xe = 0; xe < E.length; ++xe)
          if (E[xe] === ye)
            return b[xe];
        var ce = "g" + f++;
        return b.push(ce), E.push(ye), ce;
      }
      function ee() {
        var ye = [];
        function xe() {
          ye.push.apply(ye, Vo(arguments));
        }
        var ce = [];
        function me() {
          var B = "v" + f++;
          return ce.push(B), arguments.length > 0 && (ye.push(B, "="), ye.push.apply(ye, Vo(arguments)), ye.push(";")), B;
        }
        return n(xe, {
          def: me,
          toString: function() {
            return Xo([
              ce.length > 0 ? "var " + ce.join(",") + ";" : "",
              Xo(ye)
            ]);
          }
        });
      }
      function H() {
        var ye = ee(), xe = ee(), ce = ye.toString, me = xe.toString;
        function B(W, pe) {
          xe(W, pe, "=", ye.def(W, pe), ";");
        }
        return n(function() {
          ye.apply(ye, Vo(arguments));
        }, {
          def: ye.def,
          entry: ye,
          exit: xe,
          save: B,
          set: function(W, pe, Oe) {
            B(W, pe), ye(W, pe, "=", Oe, ";");
          },
          toString: function() {
            return ce() + me();
          }
        });
      }
      function K() {
        var ye = Xo(arguments), xe = H(), ce = H(), me = xe.toString, B = ce.toString;
        return n(xe, {
          then: function() {
            return xe.apply(xe, Vo(arguments)), this;
          },
          else: function() {
            return ce.apply(ce, Vo(arguments)), this;
          },
          toString: function() {
            var W = B();
            return W && (W = "else{" + W + "}"), Xo([
              "if(",
              ye,
              "){",
              me(),
              "}",
              W
            ]);
          }
        });
      }
      var le = ee(), se = {};
      function he(ye, xe) {
        var ce = [];
        function me() {
          var ie = "a" + ce.length;
          return ce.push(ie), ie;
        }
        xe = xe || 0;
        for (var B = 0; B < xe; ++B)
          me();
        var W = H(), pe = W.toString, Oe = se[ye] = n(W, {
          arg: me,
          toString: function() {
            return Xo([
              "function(",
              ce.join(),
              "){",
              pe(),
              "}"
            ]);
          }
        });
        return Oe;
      }
      function be() {
        var ye = [
          '"use strict";',
          le,
          "return {"
        ];
        Object.keys(se).forEach(function(me) {
          ye.push('"', me, '":', se[me].toString(), ",");
        }), ye.push("}");
        var xe = Xo(ye).replace(/;/g, `;
`).replace(/}/g, `}
`).replace(/{/g, `{
`), ce = Function.apply(null, b.concat(xe));
        return ce.apply(null, E);
      }
      return {
        global: le,
        link: U,
        block: ee,
        proc: he,
        scope: H,
        cond: K,
        compile: be
      };
    }
    var Wo = "xyzw".split(""), hu = 5121, Yo = 1, cl = 2, fl = 0, ul = 1, dl = 2, pl = 3, ni = 4, yu = 5, bu = 6, gu = "dither", Au = "blend.enable", vu = "blend.color", ml = "blend.equation", hl = "blend.func", _u = "depth.enable", wu = "depth.func", xu = "depth.range", Eu = "depth.mask", yl = "colorMask", Su = "cull.enable", ku = "cull.face", bl = "frontFace", gl = "lineWidth", Tu = "polygonOffset.enable", Al = "polygonOffset.offset", Mu = "sample.alpha", Lu = "sample.enable", vl = "sample.coverage", Cu = "stencil.enable", Ru = "stencil.mask", _l = "stencil.func", wl = "stencil.opFront", Da = "stencil.opBack", Iu = "scissor.enable", oi = "scissor.box", Gn = "viewport", Ba = "profile", xo = "framebuffer", Ga = "vert", Fa = "frag", Eo = "elements", So = "primitive", ko = "count", ai = "offset", ii = "instances", $a = "vao", xl = "Width", El = "Height", Zo = xo + xl, Ko = xo + El, $m = Gn + xl, zm = Gn + El, Nu = "drawingBuffer", Ou = Nu + xl, Pu = Nu + El, jm = [
      hl,
      ml,
      _l,
      wl,
      Da,
      vl,
      Gn,
      oi,
      Al
    ], Qo = 34962, Sl = 34963, qm = 35632, Hm = 35633, Du = 3553, Um = 34067, Vm = 2884, Xm = 3042, Wm = 3024, Ym = 2960, Zm = 2929, Km = 3089, Qm = 32823, Jm = 32926, eh = 32928, kl = 5126, si = 35664, li = 35665, ci = 35666, Tl = 5124, fi = 35667, ui = 35668, di = 35669, Ml = 35670, pi = 35671, mi = 35672, hi = 35673, za = 35674, ja = 35675, qa = 35676, Ha = 35678, Ua = 35680, Ll = 4, Va = 1028, To = 1029, Bu = 2304, Cl = 2305, th = 32775, rh = 32776, nh = 519, ro = 7680, Gu = 0, Fu = 1, $u = 32774, oh = 513, zu = 36160, ah = 36064, xn = {
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
    }, ju = [
      "constant color, constant alpha",
      "one minus constant color, constant alpha",
      "constant color, one minus constant alpha",
      "one minus constant color, one minus constant alpha",
      "constant alpha, constant color",
      "constant alpha, one minus constant color",
      "one minus constant alpha, constant color",
      "one minus constant alpha, one minus constant color"
    ], Jo = {
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
    }, no = {
      0: 0,
      zero: 0,
      keep: 7680,
      replace: 7681,
      increment: 7682,
      decrement: 7683,
      "increment wrap": 34055,
      "decrement wrap": 34056,
      invert: 5386
    }, qu = {
      frag: qm,
      vert: Hm
    }, Rl = {
      cw: Bu,
      ccw: Cl
    };
    function yi(f) {
      return Array.isArray(f) || r(f) || mn(f);
    }
    function Hu(f) {
      return f.sort(function(b, E) {
        return b === Gn ? -1 : E === Gn ? 1 : b < E ? -1 : 1;
      });
    }
    function br(f, b, E, U) {
      this.thisDep = f, this.contextDep = b, this.propDep = E, this.append = U;
    }
    function oo(f) {
      return f && !(f.thisDep || f.contextDep || f.propDep);
    }
    function lr(f) {
      return new br(!1, !1, !1, f);
    }
    function Hr(f, b) {
      var E = f.type;
      if (E === fl) {
        var U = f.data.length;
        return new br(
          !0,
          U >= 1,
          U >= 2,
          b
        );
      } else if (E === ni) {
        var ee = f.data;
        return new br(
          ee.thisDep,
          ee.contextDep,
          ee.propDep,
          b
        );
      } else {
        if (E === yu)
          return new br(
            !1,
            !1,
            !1,
            b
          );
        if (E === bu) {
          for (var H = !1, K = !1, le = !1, se = 0; se < f.data.length; ++se) {
            var he = f.data[se];
            if (he.type === ul)
              le = !0;
            else if (he.type === dl)
              K = !0;
            else if (he.type === pl)
              H = !0;
            else if (he.type === fl) {
              H = !0;
              var be = he.data;
              be >= 1 && (K = !0), be >= 2 && (le = !0);
            } else he.type === ni && (H = H || he.data.thisDep, K = K || he.data.contextDep, le = le || he.data.propDep);
          }
          return new br(
            H,
            K,
            le,
            b
          );
        } else
          return new br(
            E === pl,
            E === dl,
            E === ul,
            b
          );
      }
    }
    var Uu = new br(!1, !1, !1, function() {
    });
    function ih(f, b, E, U, ee, H, K, le, se, he, be, ye, xe, ce, me) {
      var B = he.Record, W = {
        add: 32774,
        subtract: 32778,
        "reverse subtract": 32779
      };
      E.ext_blend_minmax && (W.min = th, W.max = rh);
      var pe = E.angle_instanced_arrays, Oe = E.webgl_draw_buffers, ie = E.oes_vertex_array_object, Re = {
        dirty: !0,
        profile: me.profile
      }, Te = {}, Ze = [], re = {}, J = {};
      function je(v) {
        return v.replace(".", "_");
      }
      function Ee(v, h, k) {
        var D = je(v);
        Ze.push(v), Te[D] = Re[D] = !!k, re[D] = h;
      }
      function ue(v, h, k) {
        var D = je(v);
        Ze.push(v), Array.isArray(k) ? (Re[D] = k.slice(), Te[D] = k.slice()) : Re[D] = Te[D] = k, J[D] = h;
      }
      Ee(gu, Wm), Ee(Au, Xm), ue(vu, "blendColor", [0, 0, 0, 0]), ue(
        ml,
        "blendEquationSeparate",
        [$u, $u]
      ), ue(
        hl,
        "blendFuncSeparate",
        [Fu, Gu, Fu, Gu]
      ), Ee(_u, Zm, !0), ue(wu, "depthFunc", oh), ue(xu, "depthRange", [0, 1]), ue(Eu, "depthMask", !0), ue(yl, yl, [!0, !0, !0, !0]), Ee(Su, Vm), ue(ku, "cullFace", To), ue(bl, bl, Cl), ue(gl, gl, 1), Ee(Tu, Qm), ue(Al, "polygonOffset", [0, 0]), Ee(Mu, Jm), Ee(Lu, eh), ue(vl, "sampleCoverage", [1, !1]), Ee(Cu, Ym), ue(Ru, "stencilMask", -1), ue(_l, "stencilFunc", [nh, 0, -1]), ue(
        wl,
        "stencilOpSeparate",
        [Va, ro, ro, ro]
      ), ue(
        Da,
        "stencilOpSeparate",
        [To, ro, ro, ro]
      ), Ee(Iu, Km), ue(
        oi,
        "scissor",
        [0, 0, f.drawingBufferWidth, f.drawingBufferHeight]
      ), ue(
        Gn,
        Gn,
        [0, 0, f.drawingBufferWidth, f.drawingBufferHeight]
      );
      var Se = {
        gl: f,
        context: xe,
        strings: b,
        next: Te,
        current: Re,
        draw: ye,
        elements: H,
        buffer: ee,
        shader: be,
        attributes: he.state,
        vao: he,
        uniforms: se,
        framebuffer: le,
        extensions: E,
        timer: ce,
        isBufferArgs: yi
      }, ke = {
        primTypes: eo,
        compareFuncs: Jo,
        blendFuncs: xn,
        blendEquations: W,
        stencilOps: no,
        glTypes: go,
        orientationType: Rl
      };
      g.optional(function() {
        Se.isArrayLike = ar;
      }), Oe && (ke.backBuffer = [To], ke.drawBuffer = Mr(U.maxDrawbuffers, function(v) {
        return v === 0 ? [0] : Mr(v, function(h) {
          return ah + h;
        });
      }));
      var dt = 0;
      function ot() {
        var v = Fm(), h = v.link, k = v.global;
        v.id = dt++, v.batchId = "0";
        var D = h(Se), F = v.shared = {
          props: "a0"
        };
        Object.keys(Se).forEach(function(S) {
          F[S] = k.def(D, ".", S);
        }), g.optional(function() {
          v.CHECK = h(g), v.commandStr = g.guessCommand(), v.command = h(v.commandStr), v.assert = function(S, _, G) {
            S(
              "if(!(",
              _,
              "))",
              this.CHECK,
              ".commandRaise(",
              h(G),
              ",",
              this.command,
              ");"
            );
          }, ke.invalidBlendCombinations = ju;
        });
        var C = v.next = {}, M = v.current = {};
        Object.keys(J).forEach(function(S) {
          Array.isArray(Re[S]) && (C[S] = k.def(F.next, ".", S), M[S] = k.def(F.current, ".", S));
        });
        var P = v.constants = {};
        Object.keys(ke).forEach(function(S) {
          P[S] = k.def(JSON.stringify(ke[S]));
        }), v.invoke = function(S, _) {
          switch (_.type) {
            case fl:
              var G = [
                "this",
                F.context,
                F.props,
                v.batchId
              ];
              return S.def(
                h(_.data),
                ".call(",
                G.slice(0, Math.max(_.data.length + 1, 4)),
                ")"
              );
            case ul:
              return S.def(F.props, _.data);
            case dl:
              return S.def(F.context, _.data);
            case pl:
              return S.def("this", _.data);
            case ni:
              return _.data.append(v, S), _.data.ref;
            case yu:
              return _.data.toString();
            case bu:
              return _.data.map(function($) {
                return v.invoke(S, $);
              });
          }
        }, v.attribCache = {};
        var A = {};
        return v.scopeAttrib = function(S) {
          var _ = b.id(S);
          if (_ in A)
            return A[_];
          var G = he.scope[_];
          G || (G = he.scope[_] = new B());
          var $ = A[_] = h(G);
          return $;
        }, v;
      }
      function Me(v) {
        var h = v.static, k = v.dynamic, D;
        if (Ba in h) {
          var F = !!h[Ba];
          D = lr(function(M, P) {
            return F;
          }), D.enable = F;
        } else if (Ba in k) {
          var C = k[Ba];
          D = Hr(C, function(M, P) {
            return M.invoke(P, C);
          });
        }
        return D;
      }
      function Ne(v, h) {
        var k = v.static, D = v.dynamic;
        if (xo in k) {
          var F = k[xo];
          return F ? (F = le.getFramebuffer(F), g.command(F, "invalid framebuffer object"), lr(function(M, P) {
            var A = M.link(F), S = M.shared;
            P.set(
              S.framebuffer,
              ".next",
              A
            );
            var _ = S.context;
            return P.set(
              _,
              "." + Zo,
              A + ".width"
            ), P.set(
              _,
              "." + Ko,
              A + ".height"
            ), A;
          })) : lr(function(M, P) {
            var A = M.shared;
            P.set(
              A.framebuffer,
              ".next",
              "null"
            );
            var S = A.context;
            return P.set(
              S,
              "." + Zo,
              S + "." + Ou
            ), P.set(
              S,
              "." + Ko,
              S + "." + Pu
            ), "null";
          });
        } else if (xo in D) {
          var C = D[xo];
          return Hr(C, function(M, P) {
            var A = M.invoke(P, C), S = M.shared, _ = S.framebuffer, G = P.def(
              _,
              ".getFramebuffer(",
              A,
              ")"
            );
            g.optional(function() {
              M.assert(
                P,
                "!" + A + "||" + G,
                "invalid framebuffer object"
              );
            }), P.set(
              _,
              ".next",
              G
            );
            var $ = S.context;
            return P.set(
              $,
              "." + Zo,
              G + "?" + G + ".width:" + $ + "." + Ou
            ), P.set(
              $,
              "." + Ko,
              G + "?" + G + ".height:" + $ + "." + Pu
            ), G;
          });
        } else
          return null;
      }
      function et(v, h, k) {
        var D = v.static, F = v.dynamic;
        function C(A) {
          if (A in D) {
            var S = D[A];
            g.commandType(S, "object", "invalid " + A, k.commandStr);
            var _ = !0, G = S.x | 0, $ = S.y | 0, ae, _e;
            return "width" in S ? (ae = S.width | 0, g.command(ae >= 0, "invalid " + A, k.commandStr)) : _ = !1, "height" in S ? (_e = S.height | 0, g.command(_e >= 0, "invalid " + A, k.commandStr)) : _ = !1, new br(
              !_ && h && h.thisDep,
              !_ && h && h.contextDep,
              !_ && h && h.propDep,
              function(ve, Ue) {
                var De = ve.shared.context, qe = ae;
                "width" in S || (qe = Ue.def(De, ".", Zo, "-", G));
                var He = _e;
                return "height" in S || (He = Ue.def(De, ".", Ko, "-", $)), [G, $, qe, He];
              }
            );
          } else if (A in F) {
            var we = F[A], Le = Hr(we, function(ve, Ue) {
              var De = ve.invoke(Ue, we);
              g.optional(function() {
                ve.assert(
                  Ue,
                  De + "&&typeof " + De + '==="object"',
                  "invalid " + A
                );
              });
              var qe = ve.shared.context, He = Ue.def(De, ".x|0"), Ve = Ue.def(De, ".y|0"), tt = Ue.def(
                '"width" in ',
                De,
                "?",
                De,
                ".width|0:",
                "(",
                qe,
                ".",
                Zo,
                "-",
                He,
                ")"
              ), Vt = Ue.def(
                '"height" in ',
                De,
                "?",
                De,
                ".height|0:",
                "(",
                qe,
                ".",
                Ko,
                "-",
                Ve,
                ")"
              );
              return g.optional(function() {
                ve.assert(
                  Ue,
                  tt + ">=0&&" + Vt + ">=0",
                  "invalid " + A
                );
              }), [He, Ve, tt, Vt];
            });
            return h && (Le.thisDep = Le.thisDep || h.thisDep, Le.contextDep = Le.contextDep || h.contextDep, Le.propDep = Le.propDep || h.propDep), Le;
          } else return h ? new br(
            h.thisDep,
            h.contextDep,
            h.propDep,
            function(ve, Ue) {
              var De = ve.shared.context;
              return [
                0,
                0,
                Ue.def(De, ".", Zo),
                Ue.def(De, ".", Ko)
              ];
            }
          ) : null;
        }
        var M = C(Gn);
        if (M) {
          var P = M;
          M = new br(
            M.thisDep,
            M.contextDep,
            M.propDep,
            function(A, S) {
              var _ = P.append(A, S), G = A.shared.context;
              return S.set(
                G,
                "." + $m,
                _[2]
              ), S.set(
                G,
                "." + zm,
                _[3]
              ), _;
            }
          );
        }
        return {
          viewport: M,
          scissor_box: C(oi)
        };
      }
      function ct(v, h) {
        var k = v.static, D = typeof k[Fa] == "string" && typeof k[Ga] == "string";
        if (D) {
          if (Object.keys(h.dynamic).length > 0)
            return null;
          var F = h.static, C = Object.keys(F);
          if (C.length > 0 && typeof F[C[0]] == "number") {
            for (var M = [], P = 0; P < C.length; ++P)
              g(typeof F[C[P]] == "number", "must specify all vertex attribute locations when using vaos"), M.push([F[C[P]] | 0, C[P]]);
            return M;
          }
        }
        return null;
      }
      function _t(v, h, k) {
        var D = v.static, F = v.dynamic;
        function C(_) {
          if (_ in D) {
            var G = b.id(D[_]);
            g.optional(function() {
              be.shader(qu[_], G, g.guessCommand());
            });
            var $ = lr(function() {
              return G;
            });
            return $.id = G, $;
          } else if (_ in F) {
            var ae = F[_];
            return Hr(ae, function(_e, we) {
              var Le = _e.invoke(we, ae), ve = we.def(_e.shared.strings, ".id(", Le, ")");
              return g.optional(function() {
                we(
                  _e.shared.shader,
                  ".shader(",
                  qu[_],
                  ",",
                  ve,
                  ",",
                  _e.command,
                  ");"
                );
              }), ve;
            });
          }
          return null;
        }
        var M = C(Fa), P = C(Ga), A = null, S;
        return oo(M) && oo(P) ? (A = be.program(P.id, M.id, null, k), S = lr(function(_, G) {
          return _.link(A);
        })) : S = new br(
          M && M.thisDep || P && P.thisDep,
          M && M.contextDep || P && P.contextDep,
          M && M.propDep || P && P.propDep,
          function(_, G) {
            var $ = _.shared.shader, ae;
            M ? ae = M.append(_, G) : ae = G.def($, ".", Fa);
            var _e;
            P ? _e = P.append(_, G) : _e = G.def($, ".", Ga);
            var we = $ + ".program(" + _e + "," + ae;
            return g.optional(function() {
              we += "," + _.command;
            }), G.def(we + ")");
          }
        ), {
          frag: M,
          vert: P,
          progVar: S,
          program: A
        };
      }
      function Qt(v, h) {
        var k = v.static, D = v.dynamic, F = {}, C = !1;
        function M() {
          if ($a in k) {
            var Ue = k[$a];
            return Ue !== null && he.getVAO(Ue) === null && (Ue = he.createVAO(Ue)), C = !0, F.vao = Ue, lr(function(qe) {
              var He = he.getVAO(Ue);
              return He ? qe.link(He) : "null";
            });
          } else if ($a in D) {
            C = !0;
            var De = D[$a];
            return Hr(De, function(qe, He) {
              var Ve = qe.invoke(He, De);
              return He.def(qe.shared.vao + ".getVAO(" + Ve + ")");
            });
          }
          return null;
        }
        var P = M(), A = !1;
        function S() {
          if (Eo in k) {
            var Ue = k[Eo];
            if (F.elements = Ue, yi(Ue)) {
              var De = F.elements = H.create(Ue, !0);
              Ue = H.getElements(De), A = !0;
            } else Ue && (Ue = H.getElements(Ue), A = !0, g.command(Ue, "invalid elements", h.commandStr));
            var qe = lr(function(Ve, tt) {
              if (Ue) {
                var Vt = Ve.link(Ue);
                return Ve.ELEMENTS = Vt, Vt;
              }
              return Ve.ELEMENTS = null, null;
            });
            return qe.value = Ue, qe;
          } else if (Eo in D) {
            A = !0;
            var He = D[Eo];
            return Hr(He, function(Ve, tt) {
              var Vt = Ve.shared, Er = Vt.isBufferArgs, Fn = Vt.elements, $n = Ve.invoke(tt, He), zn = tt.def("null"), Gr = tt.def(Er, "(", $n, ")"), Sn = Ve.cond(Gr).then(zn, "=", Fn, ".createStream(", $n, ");").else(zn, "=", Fn, ".getElements(", $n, ");");
              return g.optional(function() {
                Ve.assert(
                  Sn.else,
                  "!" + $n + "||" + zn,
                  "invalid elements"
                );
              }), tt.entry(Sn), tt.exit(
                Ve.cond(Gr).then(Fn, ".destroyStream(", zn, ");")
              ), Ve.ELEMENTS = zn, zn;
            });
          } else if (C)
            return new br(
              P.thisDep,
              P.contextDep,
              P.propDep,
              function(Ve, tt) {
                return tt.def(Ve.shared.vao + ".currentVAO?" + Ve.shared.elements + ".getElements(" + Ve.shared.vao + ".currentVAO.elements):null");
              }
            );
          return null;
        }
        var _ = S();
        function G() {
          if (So in k) {
            var Ue = k[So];
            return F.primitive = Ue, g.commandParameter(Ue, eo, "invalid primitve", h.commandStr), lr(function(qe, He) {
              return eo[Ue];
            });
          } else if (So in D) {
            var De = D[So];
            return Hr(De, function(qe, He) {
              var Ve = qe.constants.primTypes, tt = qe.invoke(He, De);
              return g.optional(function() {
                qe.assert(
                  He,
                  tt + " in " + Ve,
                  "invalid primitive, must be one of " + Object.keys(eo)
                );
              }), He.def(Ve, "[", tt, "]");
            });
          } else {
            if (A)
              return oo(_) ? _.value ? lr(function(qe, He) {
                return He.def(qe.ELEMENTS, ".primType");
              }) : lr(function() {
                return Ll;
              }) : new br(
                _.thisDep,
                _.contextDep,
                _.propDep,
                function(qe, He) {
                  var Ve = qe.ELEMENTS;
                  return He.def(Ve, "?", Ve, ".primType:", Ll);
                }
              );
            if (C)
              return new br(
                P.thisDep,
                P.contextDep,
                P.propDep,
                function(qe, He) {
                  return He.def(qe.shared.vao + ".currentVAO?" + qe.shared.vao + ".currentVAO.primitive:" + Ll);
                }
              );
          }
          return null;
        }
        function $(Ue, De) {
          if (Ue in k) {
            var qe = k[Ue] | 0;
            return De ? F.offset = qe : F.instances = qe, g.command(!De || qe >= 0, "invalid " + Ue, h.commandStr), lr(function(Ve, tt) {
              return De && (Ve.OFFSET = qe), qe;
            });
          } else if (Ue in D) {
            var He = D[Ue];
            return Hr(He, function(Ve, tt) {
              var Vt = Ve.invoke(tt, He);
              return De && (Ve.OFFSET = Vt, g.optional(function() {
                Ve.assert(
                  tt,
                  Vt + ">=0",
                  "invalid " + Ue
                );
              })), Vt;
            });
          } else if (De) {
            if (A)
              return lr(function(Ve, tt) {
                return Ve.OFFSET = 0, 0;
              });
            if (C)
              return new br(
                P.thisDep,
                P.contextDep,
                P.propDep,
                function(Ve, tt) {
                  return tt.def(Ve.shared.vao + ".currentVAO?" + Ve.shared.vao + ".currentVAO.offset:0");
                }
              );
          } else if (C)
            return new br(
              P.thisDep,
              P.contextDep,
              P.propDep,
              function(Ve, tt) {
                return tt.def(Ve.shared.vao + ".currentVAO?" + Ve.shared.vao + ".currentVAO.instances:-1");
              }
            );
          return null;
        }
        var ae = $(ai, !0);
        function _e() {
          if (ko in k) {
            var Ue = k[ko] | 0;
            return F.count = Ue, g.command(
              typeof Ue == "number" && Ue >= 0,
              "invalid vertex count",
              h.commandStr
            ), lr(function() {
              return Ue;
            });
          } else if (ko in D) {
            var De = D[ko];
            return Hr(De, function(tt, Vt) {
              var Er = tt.invoke(Vt, De);
              return g.optional(function() {
                tt.assert(
                  Vt,
                  "typeof " + Er + '==="number"&&' + Er + ">=0&&" + Er + "===(" + Er + "|0)",
                  "invalid vertex count"
                );
              }), Er;
            });
          } else if (A)
            if (oo(_)) {
              if (_)
                return ae ? new br(
                  ae.thisDep,
                  ae.contextDep,
                  ae.propDep,
                  function(tt, Vt) {
                    var Er = Vt.def(
                      tt.ELEMENTS,
                      ".vertCount-",
                      tt.OFFSET
                    );
                    return g.optional(function() {
                      tt.assert(
                        Vt,
                        Er + ">=0",
                        "invalid vertex offset/element buffer too small"
                      );
                    }), Er;
                  }
                ) : lr(function(tt, Vt) {
                  return Vt.def(tt.ELEMENTS, ".vertCount");
                });
              var qe = lr(function() {
                return -1;
              });
              return g.optional(function() {
                qe.MISSING = !0;
              }), qe;
            } else {
              var He = new br(
                _.thisDep || ae.thisDep,
                _.contextDep || ae.contextDep,
                _.propDep || ae.propDep,
                function(tt, Vt) {
                  var Er = tt.ELEMENTS;
                  return tt.OFFSET ? Vt.def(
                    Er,
                    "?",
                    Er,
                    ".vertCount-",
                    tt.OFFSET,
                    ":-1"
                  ) : Vt.def(Er, "?", Er, ".vertCount:-1");
                }
              );
              return g.optional(function() {
                He.DYNAMIC = !0;
              }), He;
            }
          else if (C) {
            var Ve = new br(
              P.thisDep,
              P.contextDep,
              P.propDep,
              function(tt, Vt) {
                return Vt.def(tt.shared.vao, ".currentVAO?", tt.shared.vao, ".currentVAO.count:-1");
              }
            );
            return Ve;
          }
          return null;
        }
        var we = G(), Le = _e(), ve = $(ii, !1);
        return {
          elements: _,
          primitive: we,
          count: Le,
          instances: ve,
          offset: ae,
          vao: P,
          vaoActive: C,
          elementsActive: A,
          // static draw props
          static: F
        };
      }
      function Jt(v, h) {
        var k = v.static, D = v.dynamic, F = {};
        return Ze.forEach(function(C) {
          var M = je(C);
          function P(A, S) {
            if (C in k) {
              var _ = A(k[C]);
              F[M] = lr(function() {
                return _;
              });
            } else if (C in D) {
              var G = D[C];
              F[M] = Hr(G, function($, ae) {
                return S($, ae, $.invoke(ae, G));
              });
            }
          }
          switch (C) {
            case Su:
            case Au:
            case gu:
            case Cu:
            case _u:
            case Iu:
            case Tu:
            case Mu:
            case Lu:
            case Eu:
              return P(
                function(A) {
                  return g.commandType(A, "boolean", C, h.commandStr), A;
                },
                function(A, S, _) {
                  return g.optional(function() {
                    A.assert(
                      S,
                      "typeof " + _ + '==="boolean"',
                      "invalid flag " + C,
                      A.commandStr
                    );
                  }), _;
                }
              );
            case wu:
              return P(
                function(A) {
                  return g.commandParameter(A, Jo, "invalid " + C, h.commandStr), Jo[A];
                },
                function(A, S, _) {
                  var G = A.constants.compareFuncs;
                  return g.optional(function() {
                    A.assert(
                      S,
                      _ + " in " + G,
                      "invalid " + C + ", must be one of " + Object.keys(Jo)
                    );
                  }), S.def(G, "[", _, "]");
                }
              );
            case xu:
              return P(
                function(A) {
                  return g.command(
                    ar(A) && A.length === 2 && typeof A[0] == "number" && typeof A[1] == "number" && A[0] <= A[1],
                    "depth range is 2d array",
                    h.commandStr
                  ), A;
                },
                function(A, S, _) {
                  g.optional(function() {
                    A.assert(
                      S,
                      A.shared.isArrayLike + "(" + _ + ")&&" + _ + ".length===2&&typeof " + _ + '[0]==="number"&&typeof ' + _ + '[1]==="number"&&' + _ + "[0]<=" + _ + "[1]",
                      "depth range must be a 2d array"
                    );
                  });
                  var G = S.def("+", _, "[0]"), $ = S.def("+", _, "[1]");
                  return [G, $];
                }
              );
            case hl:
              return P(
                function(A) {
                  g.commandType(A, "object", "blend.func", h.commandStr);
                  var S = "srcRGB" in A ? A.srcRGB : A.src, _ = "srcAlpha" in A ? A.srcAlpha : A.src, G = "dstRGB" in A ? A.dstRGB : A.dst, $ = "dstAlpha" in A ? A.dstAlpha : A.dst;
                  return g.commandParameter(S, xn, M + ".srcRGB", h.commandStr), g.commandParameter(_, xn, M + ".srcAlpha", h.commandStr), g.commandParameter(G, xn, M + ".dstRGB", h.commandStr), g.commandParameter($, xn, M + ".dstAlpha", h.commandStr), g.command(
                    ju.indexOf(S + ", " + G) === -1,
                    "unallowed blending combination (srcRGB, dstRGB) = (" + S + ", " + G + ")",
                    h.commandStr
                  ), [
                    xn[S],
                    xn[G],
                    xn[_],
                    xn[$]
                  ];
                },
                function(A, S, _) {
                  var G = A.constants.blendFuncs;
                  g.optional(function() {
                    A.assert(
                      S,
                      _ + "&&typeof " + _ + '==="object"',
                      "invalid blend func, must be an object"
                    );
                  });
                  function $(De, qe) {
                    var He = S.def(
                      '"',
                      De,
                      qe,
                      '" in ',
                      _,
                      "?",
                      _,
                      ".",
                      De,
                      qe,
                      ":",
                      _,
                      ".",
                      De
                    );
                    return g.optional(function() {
                      A.assert(
                        S,
                        He + " in " + G,
                        "invalid " + C + "." + De + qe + ", must be one of " + Object.keys(xn)
                      );
                    }), He;
                  }
                  var ae = $("src", "RGB"), _e = $("dst", "RGB");
                  g.optional(function() {
                    var De = A.constants.invalidBlendCombinations;
                    A.assert(
                      S,
                      De + ".indexOf(" + ae + '+", "+' + _e + ") === -1 ",
                      "unallowed blending combination for (srcRGB, dstRGB)"
                    );
                  });
                  var we = S.def(G, "[", ae, "]"), Le = S.def(G, "[", $("src", "Alpha"), "]"), ve = S.def(G, "[", _e, "]"), Ue = S.def(G, "[", $("dst", "Alpha"), "]");
                  return [we, ve, Le, Ue];
                }
              );
            case ml:
              return P(
                function(A) {
                  if (typeof A == "string")
                    return g.commandParameter(A, W, "invalid " + C, h.commandStr), [
                      W[A],
                      W[A]
                    ];
                  if (typeof A == "object")
                    return g.commandParameter(
                      A.rgb,
                      W,
                      C + ".rgb",
                      h.commandStr
                    ), g.commandParameter(
                      A.alpha,
                      W,
                      C + ".alpha",
                      h.commandStr
                    ), [
                      W[A.rgb],
                      W[A.alpha]
                    ];
                  g.commandRaise("invalid blend.equation", h.commandStr);
                },
                function(A, S, _) {
                  var G = A.constants.blendEquations, $ = S.def(), ae = S.def(), _e = A.cond("typeof ", _, '==="string"');
                  return g.optional(function() {
                    function we(Le, ve, Ue) {
                      A.assert(
                        Le,
                        Ue + " in " + G,
                        "invalid " + ve + ", must be one of " + Object.keys(W)
                      );
                    }
                    we(_e.then, C, _), A.assert(
                      _e.else,
                      _ + "&&typeof " + _ + '==="object"',
                      "invalid " + C
                    ), we(_e.else, C + ".rgb", _ + ".rgb"), we(_e.else, C + ".alpha", _ + ".alpha");
                  }), _e.then(
                    $,
                    "=",
                    ae,
                    "=",
                    G,
                    "[",
                    _,
                    "];"
                  ), _e.else(
                    $,
                    "=",
                    G,
                    "[",
                    _,
                    ".rgb];",
                    ae,
                    "=",
                    G,
                    "[",
                    _,
                    ".alpha];"
                  ), S(_e), [$, ae];
                }
              );
            case vu:
              return P(
                function(A) {
                  return g.command(
                    ar(A) && A.length === 4,
                    "blend.color must be a 4d array",
                    h.commandStr
                  ), Mr(4, function(S) {
                    return +A[S];
                  });
                },
                function(A, S, _) {
                  return g.optional(function() {
                    A.assert(
                      S,
                      A.shared.isArrayLike + "(" + _ + ")&&" + _ + ".length===4",
                      "blend.color must be a 4d array"
                    );
                  }), Mr(4, function(G) {
                    return S.def("+", _, "[", G, "]");
                  });
                }
              );
            case Ru:
              return P(
                function(A) {
                  return g.commandType(A, "number", M, h.commandStr), A | 0;
                },
                function(A, S, _) {
                  return g.optional(function() {
                    A.assert(
                      S,
                      "typeof " + _ + '==="number"',
                      "invalid stencil.mask"
                    );
                  }), S.def(_, "|0");
                }
              );
            case _l:
              return P(
                function(A) {
                  g.commandType(A, "object", M, h.commandStr);
                  var S = A.cmp || "keep", _ = A.ref || 0, G = "mask" in A ? A.mask : -1;
                  return g.commandParameter(S, Jo, C + ".cmp", h.commandStr), g.commandType(_, "number", C + ".ref", h.commandStr), g.commandType(G, "number", C + ".mask", h.commandStr), [
                    Jo[S],
                    _,
                    G
                  ];
                },
                function(A, S, _) {
                  var G = A.constants.compareFuncs;
                  g.optional(function() {
                    function we() {
                      A.assert(
                        S,
                        Array.prototype.join.call(arguments, ""),
                        "invalid stencil.func"
                      );
                    }
                    we(_ + "&&typeof ", _, '==="object"'), we(
                      '!("cmp" in ',
                      _,
                      ")||(",
                      _,
                      ".cmp in ",
                      G,
                      ")"
                    );
                  });
                  var $ = S.def(
                    '"cmp" in ',
                    _,
                    "?",
                    G,
                    "[",
                    _,
                    ".cmp]",
                    ":",
                    ro
                  ), ae = S.def(_, ".ref|0"), _e = S.def(
                    '"mask" in ',
                    _,
                    "?",
                    _,
                    ".mask|0:-1"
                  );
                  return [$, ae, _e];
                }
              );
            case wl:
            case Da:
              return P(
                function(A) {
                  g.commandType(A, "object", M, h.commandStr);
                  var S = A.fail || "keep", _ = A.zfail || "keep", G = A.zpass || "keep";
                  return g.commandParameter(S, no, C + ".fail", h.commandStr), g.commandParameter(_, no, C + ".zfail", h.commandStr), g.commandParameter(G, no, C + ".zpass", h.commandStr), [
                    C === Da ? To : Va,
                    no[S],
                    no[_],
                    no[G]
                  ];
                },
                function(A, S, _) {
                  var G = A.constants.stencilOps;
                  g.optional(function() {
                    A.assert(
                      S,
                      _ + "&&typeof " + _ + '==="object"',
                      "invalid " + C
                    );
                  });
                  function $(ae) {
                    return g.optional(function() {
                      A.assert(
                        S,
                        '!("' + ae + '" in ' + _ + ")||(" + _ + "." + ae + " in " + G + ")",
                        "invalid " + C + "." + ae + ", must be one of " + Object.keys(no)
                      );
                    }), S.def(
                      '"',
                      ae,
                      '" in ',
                      _,
                      "?",
                      G,
                      "[",
                      _,
                      ".",
                      ae,
                      "]:",
                      ro
                    );
                  }
                  return [
                    C === Da ? To : Va,
                    $("fail"),
                    $("zfail"),
                    $("zpass")
                  ];
                }
              );
            case Al:
              return P(
                function(A) {
                  g.commandType(A, "object", M, h.commandStr);
                  var S = A.factor | 0, _ = A.units | 0;
                  return g.commandType(S, "number", M + ".factor", h.commandStr), g.commandType(_, "number", M + ".units", h.commandStr), [S, _];
                },
                function(A, S, _) {
                  g.optional(function() {
                    A.assert(
                      S,
                      _ + "&&typeof " + _ + '==="object"',
                      "invalid " + C
                    );
                  });
                  var G = S.def(_, ".factor|0"), $ = S.def(_, ".units|0");
                  return [G, $];
                }
              );
            case ku:
              return P(
                function(A) {
                  var S = 0;
                  return A === "front" ? S = Va : A === "back" && (S = To), g.command(!!S, M, h.commandStr), S;
                },
                function(A, S, _) {
                  return g.optional(function() {
                    A.assert(
                      S,
                      _ + '==="front"||' + _ + '==="back"',
                      "invalid cull.face"
                    );
                  }), S.def(_, '==="front"?', Va, ":", To);
                }
              );
            case gl:
              return P(
                function(A) {
                  return g.command(
                    typeof A == "number" && A >= U.lineWidthDims[0] && A <= U.lineWidthDims[1],
                    "invalid line width, must be a positive number between " + U.lineWidthDims[0] + " and " + U.lineWidthDims[1],
                    h.commandStr
                  ), A;
                },
                function(A, S, _) {
                  return g.optional(function() {
                    A.assert(
                      S,
                      "typeof " + _ + '==="number"&&' + _ + ">=" + U.lineWidthDims[0] + "&&" + _ + "<=" + U.lineWidthDims[1],
                      "invalid line width"
                    );
                  }), _;
                }
              );
            case bl:
              return P(
                function(A) {
                  return g.commandParameter(A, Rl, M, h.commandStr), Rl[A];
                },
                function(A, S, _) {
                  return g.optional(function() {
                    A.assert(
                      S,
                      _ + '==="cw"||' + _ + '==="ccw"',
                      "invalid frontFace, must be one of cw,ccw"
                    );
                  }), S.def(_ + '==="cw"?' + Bu + ":" + Cl);
                }
              );
            case yl:
              return P(
                function(A) {
                  return g.command(
                    ar(A) && A.length === 4,
                    "color.mask must be length 4 array",
                    h.commandStr
                  ), A.map(function(S) {
                    return !!S;
                  });
                },
                function(A, S, _) {
                  return g.optional(function() {
                    A.assert(
                      S,
                      A.shared.isArrayLike + "(" + _ + ")&&" + _ + ".length===4",
                      "invalid color.mask"
                    );
                  }), Mr(4, function(G) {
                    return "!!" + _ + "[" + G + "]";
                  });
                }
              );
            case vl:
              return P(
                function(A) {
                  g.command(typeof A == "object" && A, M, h.commandStr);
                  var S = "value" in A ? A.value : 1, _ = !!A.invert;
                  return g.command(
                    typeof S == "number" && S >= 0 && S <= 1,
                    "sample.coverage.value must be a number between 0 and 1",
                    h.commandStr
                  ), [S, _];
                },
                function(A, S, _) {
                  g.optional(function() {
                    A.assert(
                      S,
                      _ + "&&typeof " + _ + '==="object"',
                      "invalid sample.coverage"
                    );
                  });
                  var G = S.def(
                    '"value" in ',
                    _,
                    "?+",
                    _,
                    ".value:1"
                  ), $ = S.def("!!", _, ".invert");
                  return [G, $];
                }
              );
          }
        }), F;
      }
      function St(v, h) {
        var k = v.static, D = v.dynamic, F = {};
        return Object.keys(k).forEach(function(C) {
          var M = k[C], P;
          if (typeof M == "number" || typeof M == "boolean")
            P = lr(function() {
              return M;
            });
          else if (typeof M == "function") {
            var A = M._reglType;
            A === "texture2d" || A === "textureCube" ? P = lr(function(S) {
              return S.link(M);
            }) : A === "framebuffer" || A === "framebufferCube" ? (g.command(
              M.color.length > 0,
              'missing color attachment for framebuffer sent to uniform "' + C + '"',
              h.commandStr
            ), P = lr(function(S) {
              return S.link(M.color[0]);
            })) : g.commandRaise('invalid data for uniform "' + C + '"', h.commandStr);
          } else ar(M) ? P = lr(function(S) {
            var _ = S.global.def(
              "[",
              Mr(M.length, function(G) {
                return g.command(
                  typeof M[G] == "number" || typeof M[G] == "boolean",
                  "invalid uniform " + C,
                  S.commandStr
                ), M[G];
              }),
              "]"
            );
            return _;
          }) : g.commandRaise('invalid or missing data for uniform "' + C + '"', h.commandStr);
          P.value = M, F[C] = P;
        }), Object.keys(D).forEach(function(C) {
          var M = D[C];
          F[C] = Hr(M, function(P, A) {
            return P.invoke(A, M);
          });
        }), F;
      }
      function pr(v, h) {
        var k = v.static, D = v.dynamic, F = {};
        return Object.keys(k).forEach(function(C) {
          var M = k[C], P = b.id(C), A = new B();
          if (yi(M))
            A.state = Yo, A.buffer = ee.getBuffer(
              ee.create(M, Qo, !1, !0)
            ), A.type = 0;
          else {
            var S = ee.getBuffer(M);
            if (S)
              A.state = Yo, A.buffer = S, A.type = 0;
            else if (g.command(
              typeof M == "object" && M,
              "invalid data for attribute " + C,
              h.commandStr
            ), "constant" in M) {
              var _ = M.constant;
              A.buffer = "null", A.state = cl, typeof _ == "number" ? A.x = _ : (g.command(
                ar(_) && _.length > 0 && _.length <= 4,
                "invalid constant for attribute " + C,
                h.commandStr
              ), Wo.forEach(function(ve, Ue) {
                Ue < _.length && (A[ve] = _[Ue]);
              }));
            } else {
              yi(M.buffer) ? S = ee.getBuffer(
                ee.create(M.buffer, Qo, !1, !0)
              ) : S = ee.getBuffer(M.buffer), g.command(!!S, 'missing buffer for attribute "' + C + '"', h.commandStr);
              var G = M.offset | 0;
              g.command(
                G >= 0,
                'invalid offset for attribute "' + C + '"',
                h.commandStr
              );
              var $ = M.stride | 0;
              g.command(
                $ >= 0 && $ < 256,
                'invalid stride for attribute "' + C + '", must be integer betweeen [0, 255]',
                h.commandStr
              );
              var ae = M.size | 0;
              g.command(
                !("size" in M) || ae > 0 && ae <= 4,
                'invalid size for attribute "' + C + '", must be 1,2,3,4',
                h.commandStr
              );
              var _e = !!M.normalized, we = 0;
              "type" in M && (g.commandParameter(
                M.type,
                go,
                "invalid type for attribute " + C,
                h.commandStr
              ), we = go[M.type]);
              var Le = M.divisor | 0;
              g.optional(function() {
                "divisor" in M && (g.command(
                  Le === 0 || pe,
                  'cannot specify divisor for attribute "' + C + '", instancing not supported',
                  h.commandStr
                ), g.command(
                  Le >= 0,
                  'invalid divisor for attribute "' + C + '"',
                  h.commandStr
                ));
                var ve = h.commandStr, Ue = [
                  "buffer",
                  "offset",
                  "divisor",
                  "normalized",
                  "type",
                  "size",
                  "stride"
                ];
                Object.keys(M).forEach(function(De) {
                  g.command(
                    Ue.indexOf(De) >= 0,
                    'unknown parameter "' + De + '" for attribute pointer "' + C + '" (valid parameters are ' + Ue + ")",
                    ve
                  );
                });
              }), A.buffer = S, A.state = Yo, A.size = ae, A.normalized = _e, A.type = we || S.dtype, A.offset = G, A.stride = $, A.divisor = Le;
            }
          }
          F[C] = lr(function(ve, Ue) {
            var De = ve.attribCache;
            if (P in De)
              return De[P];
            var qe = {
              isStream: !1
            };
            return Object.keys(A).forEach(function(He) {
              qe[He] = A[He];
            }), A.buffer && (qe.buffer = ve.link(A.buffer), qe.type = qe.type || qe.buffer + ".dtype"), De[P] = qe, qe;
          });
        }), Object.keys(D).forEach(function(C) {
          var M = D[C];
          function P(A, S) {
            var _ = A.invoke(S, M), G = A.shared, $ = A.constants, ae = G.isBufferArgs, _e = G.buffer;
            g.optional(function() {
              A.assert(
                S,
                _ + "&&(typeof " + _ + '==="object"||typeof ' + _ + '==="function")&&(' + ae + "(" + _ + ")||" + _e + ".getBuffer(" + _ + ")||" + _e + ".getBuffer(" + _ + ".buffer)||" + ae + "(" + _ + '.buffer)||("constant" in ' + _ + "&&(typeof " + _ + '.constant==="number"||' + G.isArrayLike + "(" + _ + ".constant))))",
                'invalid dynamic attribute "' + C + '"'
              );
            });
            var we = {
              isStream: S.def(!1)
            }, Le = new B();
            Le.state = Yo, Object.keys(Le).forEach(function(qe) {
              we[qe] = S.def("" + Le[qe]);
            });
            var ve = we.buffer, Ue = we.type;
            S(
              "if(",
              ae,
              "(",
              _,
              ")){",
              we.isStream,
              "=true;",
              ve,
              "=",
              _e,
              ".createStream(",
              Qo,
              ",",
              _,
              ");",
              Ue,
              "=",
              ve,
              ".dtype;",
              "}else{",
              ve,
              "=",
              _e,
              ".getBuffer(",
              _,
              ");",
              "if(",
              ve,
              "){",
              Ue,
              "=",
              ve,
              ".dtype;",
              '}else if("constant" in ',
              _,
              "){",
              we.state,
              "=",
              cl,
              ";",
              "if(typeof " + _ + '.constant === "number"){',
              we[Wo[0]],
              "=",
              _,
              ".constant;",
              Wo.slice(1).map(function(qe) {
                return we[qe];
              }).join("="),
              "=0;",
              "}else{",
              Wo.map(function(qe, He) {
                return we[qe] + "=" + _ + ".constant.length>" + He + "?" + _ + ".constant[" + He + "]:0;";
              }).join(""),
              "}}else{",
              "if(",
              ae,
              "(",
              _,
              ".buffer)){",
              ve,
              "=",
              _e,
              ".createStream(",
              Qo,
              ",",
              _,
              ".buffer);",
              "}else{",
              ve,
              "=",
              _e,
              ".getBuffer(",
              _,
              ".buffer);",
              "}",
              Ue,
              '="type" in ',
              _,
              "?",
              $.glTypes,
              "[",
              _,
              ".type]:",
              ve,
              ".dtype;",
              we.normalized,
              "=!!",
              _,
              ".normalized;"
            );
            function De(qe) {
              S(we[qe], "=", _, ".", qe, "|0;");
            }
            return De("size"), De("offset"), De("stride"), De("divisor"), S("}}"), S.exit(
              "if(",
              we.isStream,
              "){",
              _e,
              ".destroyStream(",
              ve,
              ");",
              "}"
            ), we;
          }
          F[C] = Hr(M, P);
        }), F;
      }
      function Xt(v) {
        var h = v.static, k = v.dynamic, D = {};
        return Object.keys(h).forEach(function(F) {
          var C = h[F];
          D[F] = lr(function(M, P) {
            return typeof C == "number" || typeof C == "boolean" ? "" + C : M.link(C);
          });
        }), Object.keys(k).forEach(function(F) {
          var C = k[F];
          D[F] = Hr(C, function(M, P) {
            return M.invoke(P, C);
          });
        }), D;
      }
      function cr(v, h, k, D, F) {
        var C = v.static, M = v.dynamic;
        g.optional(function() {
          var De = [
            xo,
            Ga,
            Fa,
            Eo,
            So,
            ai,
            ko,
            ii,
            Ba,
            $a
          ].concat(Ze);
          function qe(He) {
            Object.keys(He).forEach(function(Ve) {
              g.command(
                De.indexOf(Ve) >= 0,
                'unknown parameter "' + Ve + '"',
                F.commandStr
              );
            });
          }
          qe(C), qe(M);
        });
        var P = ct(v, h), A = Ne(v), S = et(v, A, F), _ = Qt(v, F), G = Jt(v, F), $ = _t(v, F, P);
        function ae(De) {
          var qe = S[De];
          qe && (G[De] = qe);
        }
        ae(Gn), ae(je(oi));
        var _e = Object.keys(G).length > 0, we = {
          framebuffer: A,
          draw: _,
          shader: $,
          state: G,
          dirty: _e,
          scopeVAO: null,
          drawVAO: null,
          useVAO: !1,
          attributes: {}
        };
        if (we.profile = Me(v), we.uniforms = St(k, F), we.drawVAO = we.scopeVAO = _.vao, !we.drawVAO && $.program && !P && E.angle_instanced_arrays && _.static.elements) {
          var Le = !0, ve = $.program.attributes.map(function(De) {
            var qe = h.static[De];
            return Le = Le && !!qe, qe;
          });
          if (Le && ve.length > 0) {
            var Ue = he.getVAO(he.createVAO({
              attributes: ve,
              elements: _.static.elements
            }));
            we.drawVAO = new br(null, null, null, function(De, qe) {
              return De.link(Ue);
            }), we.useVAO = !0;
          }
        }
        return P ? we.useVAO = !0 : we.attributes = pr(h, F), we.context = Xt(D), we;
      }
      function mr(v, h, k) {
        var D = v.shared, F = D.context, C = v.scope();
        Object.keys(k).forEach(function(M) {
          h.save(F, "." + M);
          var P = k[M], A = P.append(v, h);
          Array.isArray(A) ? C(F, ".", M, "=[", A.join(), "];") : C(F, ".", M, "=", A, ";");
        }), h(C);
      }
      function hr(v, h, k, D) {
        var F = v.shared, C = F.gl, M = F.framebuffer, P;
        Oe && (P = h.def(F.extensions, ".webgl_draw_buffers"));
        var A = v.constants, S = A.drawBuffer, _ = A.backBuffer, G;
        k ? G = k.append(v, h) : G = h.def(M, ".next"), D || h("if(", G, "!==", M, ".cur){"), h(
          "if(",
          G,
          "){",
          C,
          ".bindFramebuffer(",
          zu,
          ",",
          G,
          ".framebuffer);"
        ), Oe && h(
          P,
          ".drawBuffersWEBGL(",
          S,
          "[",
          G,
          ".colorAttachments.length]);"
        ), h(
          "}else{",
          C,
          ".bindFramebuffer(",
          zu,
          ",null);"
        ), Oe && h(P, ".drawBuffersWEBGL(", _, ");"), h(
          "}",
          M,
          ".cur=",
          G,
          ";"
        ), D || h("}");
      }
      function xr(v, h, k) {
        var D = v.shared, F = D.gl, C = v.current, M = v.next, P = D.current, A = D.next, S = v.cond(P, ".dirty");
        Ze.forEach(function(_) {
          var G = je(_);
          if (!(G in k.state)) {
            var $, ae;
            if (G in M) {
              $ = M[G], ae = C[G];
              var _e = Mr(Re[G].length, function(Le) {
                return S.def($, "[", Le, "]");
              });
              S(v.cond(_e.map(function(Le, ve) {
                return Le + "!==" + ae + "[" + ve + "]";
              }).join("||")).then(
                F,
                ".",
                J[G],
                "(",
                _e,
                ");",
                _e.map(function(Le, ve) {
                  return ae + "[" + ve + "]=" + Le;
                }).join(";"),
                ";"
              ));
            } else {
              $ = S.def(A, ".", G);
              var we = v.cond($, "!==", P, ".", G);
              S(we), G in re ? we(
                v.cond($).then(F, ".enable(", re[G], ");").else(F, ".disable(", re[G], ");"),
                P,
                ".",
                G,
                "=",
                $,
                ";"
              ) : we(
                F,
                ".",
                J[G],
                "(",
                $,
                ");",
                P,
                ".",
                G,
                "=",
                $,
                ";"
              );
            }
          }
        }), Object.keys(k.state).length === 0 && S(P, ".dirty=false;"), h(S);
      }
      function Cr(v, h, k, D) {
        var F = v.shared, C = v.current, M = F.current, P = F.gl;
        Hu(Object.keys(k)).forEach(function(A) {
          var S = k[A];
          if (!(D && !D(S))) {
            var _ = S.append(v, h);
            if (re[A]) {
              var G = re[A];
              oo(S) ? _ ? h(P, ".enable(", G, ");") : h(P, ".disable(", G, ");") : h(v.cond(_).then(P, ".enable(", G, ");").else(P, ".disable(", G, ");")), h(M, ".", A, "=", _, ";");
            } else if (ar(_)) {
              var $ = C[A];
              h(
                P,
                ".",
                J[A],
                "(",
                _,
                ");",
                _.map(function(ae, _e) {
                  return $ + "[" + _e + "]=" + ae;
                }).join(";"),
                ";"
              );
            } else
              h(
                P,
                ".",
                J[A],
                "(",
                _,
                ");",
                M,
                ".",
                A,
                "=",
                _,
                ";"
              );
          }
        });
      }
      function ir(v, h) {
        pe && (v.instancing = h.def(
          v.shared.extensions,
          ".angle_instanced_arrays"
        ));
      }
      function yt(v, h, k, D, F) {
        var C = v.shared, M = v.stats, P = C.current, A = C.timer, S = k.profile;
        function _() {
          return typeof performance > "u" ? "Date.now()" : "performance.now()";
        }
        var G, $;
        function ae(De) {
          G = h.def(), De(G, "=", _(), ";"), typeof F == "string" ? De(M, ".count+=", F, ";") : De(M, ".count++;"), ce && (D ? ($ = h.def(), De($, "=", A, ".getNumPendingQueries();")) : De(A, ".beginQuery(", M, ");"));
        }
        function _e(De) {
          De(M, ".cpuTime+=", _(), "-", G, ";"), ce && (D ? De(
            A,
            ".pushScopeStats(",
            $,
            ",",
            A,
            ".getNumPendingQueries(),",
            M,
            ");"
          ) : De(A, ".endQuery();"));
        }
        function we(De) {
          var qe = h.def(P, ".profile");
          h(P, ".profile=", De, ";"), h.exit(P, ".profile=", qe, ";");
        }
        var Le;
        if (S) {
          if (oo(S)) {
            S.enable ? (ae(h), _e(h.exit), we("true")) : we("false");
            return;
          }
          Le = S.append(v, h), we(Le);
        } else
          Le = h.def(P, ".profile");
        var ve = v.block();
        ae(ve), h("if(", Le, "){", ve, "}");
        var Ue = v.block();
        _e(Ue), h.exit("if(", Le, "){", Ue, "}");
      }
      function Rr(v, h, k, D, F) {
        var C = v.shared;
        function M(A) {
          switch (A) {
            case si:
            case fi:
            case pi:
              return 2;
            case li:
            case ui:
            case mi:
              return 3;
            case ci:
            case di:
            case hi:
              return 4;
            default:
              return 1;
          }
        }
        function P(A, S, _) {
          var G = C.gl, $ = h.def(A, ".location"), ae = h.def(C.attributes, "[", $, "]"), _e = _.state, we = _.buffer, Le = [
            _.x,
            _.y,
            _.z,
            _.w
          ], ve = [
            "buffer",
            "normalized",
            "offset",
            "stride"
          ];
          function Ue() {
            h(
              "if(!",
              ae,
              ".buffer){",
              G,
              ".enableVertexAttribArray(",
              $,
              ");}"
            );
            var qe = _.type, He;
            if (_.size ? He = h.def(_.size, "||", S) : He = S, h(
              "if(",
              ae,
              ".type!==",
              qe,
              "||",
              ae,
              ".size!==",
              He,
              "||",
              ve.map(function(tt) {
                return ae + "." + tt + "!==" + _[tt];
              }).join("||"),
              "){",
              G,
              ".bindBuffer(",
              Qo,
              ",",
              we,
              ".buffer);",
              G,
              ".vertexAttribPointer(",
              [
                $,
                He,
                qe,
                _.normalized,
                _.stride,
                _.offset
              ],
              ");",
              ae,
              ".type=",
              qe,
              ";",
              ae,
              ".size=",
              He,
              ";",
              ve.map(function(tt) {
                return ae + "." + tt + "=" + _[tt] + ";";
              }).join(""),
              "}"
            ), pe) {
              var Ve = _.divisor;
              h(
                "if(",
                ae,
                ".divisor!==",
                Ve,
                "){",
                v.instancing,
                ".vertexAttribDivisorANGLE(",
                [$, Ve],
                ");",
                ae,
                ".divisor=",
                Ve,
                ";}"
              );
            }
          }
          function De() {
            h(
              "if(",
              ae,
              ".buffer){",
              G,
              ".disableVertexAttribArray(",
              $,
              ");",
              ae,
              ".buffer=null;",
              "}if(",
              Wo.map(function(qe, He) {
                return ae + "." + qe + "!==" + Le[He];
              }).join("||"),
              "){",
              G,
              ".vertexAttrib4f(",
              $,
              ",",
              Le,
              ");",
              Wo.map(function(qe, He) {
                return ae + "." + qe + "=" + Le[He] + ";";
              }).join(""),
              "}"
            );
          }
          _e === Yo ? Ue() : _e === cl ? De() : (h("if(", _e, "===", Yo, "){"), Ue(), h("}else{"), De(), h("}"));
        }
        D.forEach(function(A) {
          var S = A.name, _ = k.attributes[S], G;
          if (_) {
            if (!F(_))
              return;
            G = _.append(v, h);
          } else {
            if (!F(Uu))
              return;
            var $ = v.scopeAttrib(S);
            g.optional(function() {
              v.assert(
                h,
                $ + ".state",
                "missing attribute " + S
              );
            }), G = {}, Object.keys(new B()).forEach(function(ae) {
              G[ae] = h.def($, ".", ae);
            });
          }
          P(
            v.link(A),
            M(A.info.type),
            G
          );
        });
      }
      function Bt(v, h, k, D, F, C) {
        for (var M = v.shared, P = M.gl, A, S = 0; S < D.length; ++S) {
          var _ = D[S], G = _.name, $ = _.info.type, ae = k.uniforms[G], _e = v.link(_), we = _e + ".location", Le;
          if (ae) {
            if (!F(ae))
              continue;
            if (oo(ae)) {
              var ve = ae.value;
              if (g.command(
                ve !== null && typeof ve < "u",
                'missing uniform "' + G + '"',
                v.commandStr
              ), $ === Ha || $ === Ua) {
                g.command(
                  typeof ve == "function" && ($ === Ha && (ve._reglType === "texture2d" || ve._reglType === "framebuffer") || $ === Ua && (ve._reglType === "textureCube" || ve._reglType === "framebufferCube")),
                  "invalid texture for uniform " + G,
                  v.commandStr
                );
                var Ue = v.link(ve._texture || ve.color[0]._texture);
                h(P, ".uniform1i(", we, ",", Ue + ".bind());"), h.exit(Ue, ".unbind();");
              } else if ($ === za || $ === ja || $ === qa) {
                g.optional(function() {
                  g.command(
                    ar(ve),
                    "invalid matrix for uniform " + G,
                    v.commandStr
                  ), g.command(
                    $ === za && ve.length === 4 || $ === ja && ve.length === 9 || $ === qa && ve.length === 16,
                    "invalid length for matrix uniform " + G,
                    v.commandStr
                  );
                });
                var De = v.global.def("new Float32Array([" + Array.prototype.slice.call(ve) + "])"), qe = 2;
                $ === ja ? qe = 3 : $ === qa && (qe = 4), h(
                  P,
                  ".uniformMatrix",
                  qe,
                  "fv(",
                  we,
                  ",false,",
                  De,
                  ");"
                );
              } else {
                switch ($) {
                  case kl:
                    g.commandType(ve, "number", "uniform " + G, v.commandStr), A = "1f";
                    break;
                  case si:
                    g.command(
                      ar(ve) && ve.length === 2,
                      "uniform " + G,
                      v.commandStr
                    ), A = "2f";
                    break;
                  case li:
                    g.command(
                      ar(ve) && ve.length === 3,
                      "uniform " + G,
                      v.commandStr
                    ), A = "3f";
                    break;
                  case ci:
                    g.command(
                      ar(ve) && ve.length === 4,
                      "uniform " + G,
                      v.commandStr
                    ), A = "4f";
                    break;
                  case Ml:
                    g.commandType(ve, "boolean", "uniform " + G, v.commandStr), A = "1i";
                    break;
                  case Tl:
                    g.commandType(ve, "number", "uniform " + G, v.commandStr), A = "1i";
                    break;
                  case pi:
                    g.command(
                      ar(ve) && ve.length === 2,
                      "uniform " + G,
                      v.commandStr
                    ), A = "2i";
                    break;
                  case fi:
                    g.command(
                      ar(ve) && ve.length === 2,
                      "uniform " + G,
                      v.commandStr
                    ), A = "2i";
                    break;
                  case mi:
                    g.command(
                      ar(ve) && ve.length === 3,
                      "uniform " + G,
                      v.commandStr
                    ), A = "3i";
                    break;
                  case ui:
                    g.command(
                      ar(ve) && ve.length === 3,
                      "uniform " + G,
                      v.commandStr
                    ), A = "3i";
                    break;
                  case hi:
                    g.command(
                      ar(ve) && ve.length === 4,
                      "uniform " + G,
                      v.commandStr
                    ), A = "4i";
                    break;
                  case di:
                    g.command(
                      ar(ve) && ve.length === 4,
                      "uniform " + G,
                      v.commandStr
                    ), A = "4i";
                    break;
                }
                h(
                  P,
                  ".uniform",
                  A,
                  "(",
                  we,
                  ",",
                  ar(ve) ? Array.prototype.slice.call(ve) : ve,
                  ");"
                );
              }
              continue;
            } else
              Le = ae.append(v, h);
          } else {
            if (!F(Uu))
              continue;
            Le = h.def(M.uniforms, "[", b.id(G), "]");
          }
          $ === Ha ? (g(!Array.isArray(Le), "must specify a scalar prop for textures"), h(
            "if(",
            Le,
            "&&",
            Le,
            '._reglType==="framebuffer"){',
            Le,
            "=",
            Le,
            ".color[0];",
            "}"
          )) : $ === Ua && (g(!Array.isArray(Le), "must specify a scalar prop for cube maps"), h(
            "if(",
            Le,
            "&&",
            Le,
            '._reglType==="framebufferCube"){',
            Le,
            "=",
            Le,
            ".color[0];",
            "}"
          )), g.optional(function() {
            function Gr(yn, Qu) {
              v.assert(
                h,
                yn,
                'bad data or missing for uniform "' + G + '".  ' + Qu
              );
            }
            function Sn(yn) {
              g(!Array.isArray(Le), "must not specify an array type for uniform"), Gr(
                "typeof " + Le + '==="' + yn + '"',
                "invalid type, expected " + yn
              );
            }
            function an(yn, Qu) {
              Array.isArray(Le) ? g(Le.length === yn, "must have length " + yn) : Gr(
                M.isArrayLike + "(" + Le + ")&&" + Le + ".length===" + yn,
                "invalid vector, should have length " + yn,
                v.commandStr
              );
            }
            function Ku(yn) {
              g(!Array.isArray(Le), "must not specify a value type"), Gr(
                "typeof " + Le + '==="function"&&' + Le + '._reglType==="texture' + (yn === Du ? "2d" : "Cube") + '"',
                "invalid texture type",
                v.commandStr
              );
            }
            switch ($) {
              case Tl:
                Sn("number");
                break;
              case fi:
                an(2);
                break;
              case ui:
                an(3);
                break;
              case di:
                an(4);
                break;
              case kl:
                Sn("number");
                break;
              case si:
                an(2);
                break;
              case li:
                an(3);
                break;
              case ci:
                an(4);
                break;
              case Ml:
                Sn("boolean");
                break;
              case pi:
                an(2);
                break;
              case mi:
                an(3);
                break;
              case hi:
                an(4);
                break;
              case za:
                an(4);
                break;
              case ja:
                an(9);
                break;
              case qa:
                an(16);
                break;
              case Ha:
                Ku(Du);
                break;
              case Ua:
                Ku(Um);
                break;
            }
          });
          var He = 1;
          switch ($) {
            case Ha:
            case Ua:
              var Ve = h.def(Le, "._texture");
              h(P, ".uniform1i(", we, ",", Ve, ".bind());"), h.exit(Ve, ".unbind();");
              continue;
            case Tl:
            case Ml:
              A = "1i";
              break;
            case fi:
            case pi:
              A = "2i", He = 2;
              break;
            case ui:
            case mi:
              A = "3i", He = 3;
              break;
            case di:
            case hi:
              A = "4i", He = 4;
              break;
            case kl:
              A = "1f";
              break;
            case si:
              A = "2f", He = 2;
              break;
            case li:
              A = "3f", He = 3;
              break;
            case ci:
              A = "4f", He = 4;
              break;
            case za:
              A = "Matrix2fv";
              break;
            case ja:
              A = "Matrix3fv";
              break;
            case qa:
              A = "Matrix4fv";
              break;
          }
          if (A.charAt(0) === "M") {
            h(P, ".uniform", A, "(", we, ",");
            var tt = Math.pow($ - za + 2, 2), Vt = v.global.def("new Float32Array(", tt, ")");
            Array.isArray(Le) ? h(
              "false,(",
              Mr(tt, function(Gr) {
                return Vt + "[" + Gr + "]=" + Le[Gr];
              }),
              ",",
              Vt,
              ")"
            ) : h(
              "false,(Array.isArray(",
              Le,
              ")||",
              Le,
              " instanceof Float32Array)?",
              Le,
              ":(",
              Mr(tt, function(Gr) {
                return Vt + "[" + Gr + "]=" + Le + "[" + Gr + "]";
              }),
              ",",
              Vt,
              ")"
            ), h(");");
          } else if (He > 1) {
            for (var Er = [], Fn = [], $n = 0; $n < He; ++$n)
              Array.isArray(Le) ? Fn.push(Le[$n]) : Fn.push(h.def(Le + "[" + $n + "]")), C && Er.push(h.def());
            C && h("if(!", v.batchId, "||", Er.map(function(Gr, Sn) {
              return Gr + "!==" + Fn[Sn];
            }).join("||"), "){", Er.map(function(Gr, Sn) {
              return Gr + "=" + Fn[Sn] + ";";
            }).join("")), h(P, ".uniform", A, "(", we, ",", Fn.join(","), ");"), C && h("}");
          } else {
            if (g(!Array.isArray(Le), "uniform value must not be an array"), C) {
              var zn = h.def();
              h(
                "if(!",
                v.batchId,
                "||",
                zn,
                "!==",
                Le,
                "){",
                zn,
                "=",
                Le,
                ";"
              );
            }
            h(P, ".uniform", A, "(", we, ",", Le, ");"), C && h("}");
          }
        }
      }
      function Je(v, h, k, D) {
        var F = v.shared, C = F.gl, M = F.draw, P = D.draw;
        function A() {
          var He = P.elements, Ve, tt = h;
          return He ? ((He.contextDep && D.contextDynamic || He.propDep) && (tt = k), Ve = He.append(v, tt), P.elementsActive && tt(
            "if(" + Ve + ")" + C + ".bindBuffer(" + Sl + "," + Ve + ".buffer.buffer);"
          )) : (Ve = tt.def(), tt(
            Ve,
            "=",
            M,
            ".",
            Eo,
            ";",
            "if(",
            Ve,
            "){",
            C,
            ".bindBuffer(",
            Sl,
            ",",
            Ve,
            ".buffer.buffer);}",
            "else if(",
            F.vao,
            ".currentVAO){",
            Ve,
            "=",
            v.shared.elements + ".getElements(" + F.vao,
            ".currentVAO.elements);",
            ie ? "" : "if(" + Ve + ")" + C + ".bindBuffer(" + Sl + "," + Ve + ".buffer.buffer);",
            "}"
          )), Ve;
        }
        function S() {
          var He = P.count, Ve, tt = h;
          return He ? ((He.contextDep && D.contextDynamic || He.propDep) && (tt = k), Ve = He.append(v, tt), g.optional(function() {
            He.MISSING && v.assert(h, "false", "missing vertex count"), He.DYNAMIC && v.assert(tt, Ve + ">=0", "missing vertex count");
          })) : (Ve = tt.def(M, ".", ko), g.optional(function() {
            v.assert(tt, Ve + ">=0", "missing vertex count");
          })), Ve;
        }
        var _ = A();
        function G(He) {
          var Ve = P[He];
          return Ve ? Ve.contextDep && D.contextDynamic || Ve.propDep ? Ve.append(v, k) : Ve.append(v, h) : h.def(M, ".", He);
        }
        var $ = G(So), ae = G(ai), _e = S();
        if (typeof _e == "number") {
          if (_e === 0)
            return;
        } else
          k("if(", _e, "){"), k.exit("}");
        var we, Le;
        pe && (we = G(ii), Le = v.instancing);
        var ve = _ + ".type", Ue = P.elements && oo(P.elements) && !P.vaoActive;
        function De() {
          function He() {
            k(Le, ".drawElementsInstancedANGLE(", [
              $,
              _e,
              ve,
              ae + "<<((" + ve + "-" + hu + ")>>1)",
              we
            ], ");");
          }
          function Ve() {
            k(
              Le,
              ".drawArraysInstancedANGLE(",
              [$, ae, _e, we],
              ");"
            );
          }
          _ && _ !== "null" ? Ue ? He() : (k("if(", _, "){"), He(), k("}else{"), Ve(), k("}")) : Ve();
        }
        function qe() {
          function He() {
            k(C + ".drawElements(" + [
              $,
              _e,
              ve,
              ae + "<<((" + ve + "-" + hu + ")>>1)"
            ] + ");");
          }
          function Ve() {
            k(C + ".drawArrays(" + [$, ae, _e] + ");");
          }
          _ && _ !== "null" ? Ue ? He() : (k("if(", _, "){"), He(), k("}else{"), Ve(), k("}")) : Ve();
        }
        pe && (typeof we != "number" || we >= 0) ? typeof we == "string" ? (k("if(", we, ">0){"), De(), k("}else if(", we, "<0){"), qe(), k("}")) : De() : qe();
      }
      function wt(v, h, k, D, F) {
        var C = ot(), M = C.proc("body", F);
        return g.optional(function() {
          C.commandStr = h.commandStr, C.command = C.link(h.commandStr);
        }), pe && (C.instancing = M.def(
          C.shared.extensions,
          ".angle_instanced_arrays"
        )), v(C, M, k, D), C.compile().body;
      }
      function Nt(v, h, k, D) {
        ir(v, h), k.useVAO ? k.drawVAO ? h(v.shared.vao, ".setVAO(", k.drawVAO.append(v, h), ");") : h(v.shared.vao, ".setVAO(", v.shared.vao, ".targetVAO);") : (h(v.shared.vao, ".setVAO(null);"), Rr(v, h, k, D.attributes, function() {
          return !0;
        })), Bt(v, h, k, D.uniforms, function() {
          return !0;
        }, !1), Je(v, h, h, k);
      }
      function sr(v, h) {
        var k = v.proc("draw", 1);
        ir(v, k), mr(v, k, h.context), hr(v, k, h.framebuffer), xr(v, k, h), Cr(v, k, h.state), yt(v, k, h, !1, !0);
        var D = h.shader.progVar.append(v, k);
        if (k(v.shared.gl, ".useProgram(", D, ".program);"), h.shader.program)
          Nt(v, k, h, h.shader.program);
        else {
          k(v.shared.vao, ".setVAO(null);");
          var F = v.global.def("{}"), C = k.def(D, ".id"), M = k.def(F, "[", C, "]");
          k(
            v.cond(M).then(M, ".call(this,a0);").else(
              M,
              "=",
              F,
              "[",
              C,
              "]=",
              v.link(function(P) {
                return wt(Nt, v, h, P, 1);
              }),
              "(",
              D,
              ");",
              M,
              ".call(this,a0);"
            )
          );
        }
        Object.keys(h.state).length > 0 && k(v.shared.current, ".dirty=true;"), v.shared.vao && k(v.shared.vao, ".setVAO(null);");
      }
      function En(v, h, k, D) {
        v.batchId = "a1", ir(v, h);
        function F() {
          return !0;
        }
        Rr(v, h, k, D.attributes, F), Bt(v, h, k, D.uniforms, F, !1), Je(v, h, h, k);
      }
      function Mo(v, h, k, D) {
        ir(v, h);
        var F = k.contextDep, C = h.def(), M = "a0", P = "a1", A = h.def();
        v.shared.props = A, v.batchId = C;
        var S = v.scope(), _ = v.scope();
        h(
          S.entry,
          "for(",
          C,
          "=0;",
          C,
          "<",
          P,
          ";++",
          C,
          "){",
          A,
          "=",
          M,
          "[",
          C,
          "];",
          _,
          "}",
          S.exit
        );
        function G(ve) {
          return ve.contextDep && F || ve.propDep;
        }
        function $(ve) {
          return !G(ve);
        }
        if (k.needsContext && mr(v, _, k.context), k.needsFramebuffer && hr(v, _, k.framebuffer), Cr(v, _, k.state, G), k.profile && G(k.profile) && yt(v, _, k, !1, !0), D)
          k.useVAO ? k.drawVAO ? G(k.drawVAO) ? _(v.shared.vao, ".setVAO(", k.drawVAO.append(v, _), ");") : S(v.shared.vao, ".setVAO(", k.drawVAO.append(v, S), ");") : S(v.shared.vao, ".setVAO(", v.shared.vao, ".targetVAO);") : (S(v.shared.vao, ".setVAO(null);"), Rr(v, S, k, D.attributes, $), Rr(v, _, k, D.attributes, G)), Bt(v, S, k, D.uniforms, $, !1), Bt(v, _, k, D.uniforms, G, !0), Je(v, S, _, k);
        else {
          var ae = v.global.def("{}"), _e = k.shader.progVar.append(v, _), we = _.def(_e, ".id"), Le = _.def(ae, "[", we, "]");
          _(
            v.shared.gl,
            ".useProgram(",
            _e,
            ".program);",
            "if(!",
            Le,
            "){",
            Le,
            "=",
            ae,
            "[",
            we,
            "]=",
            v.link(function(ve) {
              return wt(
                En,
                v,
                k,
                ve,
                2
              );
            }),
            "(",
            _e,
            ");}",
            Le,
            ".call(this,a0[",
            C,
            "],",
            C,
            ");"
          );
        }
      }
      function w(v, h) {
        var k = v.proc("batch", 2);
        v.batchId = "0", ir(v, k);
        var D = !1, F = !0;
        Object.keys(h.context).forEach(function(ae) {
          D = D || h.context[ae].propDep;
        }), D || (mr(v, k, h.context), F = !1);
        var C = h.framebuffer, M = !1;
        C ? (C.propDep ? D = M = !0 : C.contextDep && D && (M = !0), M || hr(v, k, C)) : hr(v, k, null), h.state.viewport && h.state.viewport.propDep && (D = !0);
        function P(ae) {
          return ae.contextDep && D || ae.propDep;
        }
        xr(v, k, h), Cr(v, k, h.state, function(ae) {
          return !P(ae);
        }), (!h.profile || !P(h.profile)) && yt(v, k, h, !1, "a1"), h.contextDep = D, h.needsContext = F, h.needsFramebuffer = M;
        var A = h.shader.progVar;
        if (A.contextDep && D || A.propDep)
          Mo(
            v,
            k,
            h,
            null
          );
        else {
          var S = A.append(v, k);
          if (k(v.shared.gl, ".useProgram(", S, ".program);"), h.shader.program)
            Mo(
              v,
              k,
              h,
              h.shader.program
            );
          else {
            k(v.shared.vao, ".setVAO(null);");
            var _ = v.global.def("{}"), G = k.def(S, ".id"), $ = k.def(_, "[", G, "]");
            k(
              v.cond($).then($, ".call(this,a0,a1);").else(
                $,
                "=",
                _,
                "[",
                G,
                "]=",
                v.link(function(ae) {
                  return wt(Mo, v, h, ae, 2);
                }),
                "(",
                S,
                ");",
                $,
                ".call(this,a0,a1);"
              )
            );
          }
        }
        Object.keys(h.state).length > 0 && k(v.shared.current, ".dirty=true;"), v.shared.vao && k(v.shared.vao, ".setVAO(null);");
      }
      function X(v, h) {
        var k = v.proc("scope", 3);
        v.batchId = "a2";
        var D = v.shared, F = D.current;
        mr(v, k, h.context), h.framebuffer && h.framebuffer.append(v, k), Hu(Object.keys(h.state)).forEach(function(M) {
          var P = h.state[M], A = P.append(v, k);
          ar(A) ? A.forEach(function(S, _) {
            k.set(v.next[M], "[" + _ + "]", S);
          }) : k.set(D.next, "." + M, A);
        }), yt(v, k, h, !0, !0), [Eo, ai, ko, ii, So].forEach(
          function(M) {
            var P = h.draw[M];
            P && k.set(D.draw, "." + M, "" + P.append(v, k));
          }
        ), Object.keys(h.uniforms).forEach(function(M) {
          var P = h.uniforms[M].append(v, k);
          Array.isArray(P) && (P = "[" + P.join() + "]"), k.set(
            D.uniforms,
            "[" + b.id(M) + "]",
            P
          );
        }), Object.keys(h.attributes).forEach(function(M) {
          var P = h.attributes[M].append(v, k), A = v.scopeAttrib(M);
          Object.keys(new B()).forEach(function(S) {
            k.set(A, "." + S, P[S]);
          });
        }), h.scopeVAO && k.set(D.vao, ".targetVAO", h.scopeVAO.append(v, k));
        function C(M) {
          var P = h.shader[M];
          P && k.set(D.shader, "." + M, P.append(v, k));
        }
        C(Ga), C(Fa), Object.keys(h.state).length > 0 && (k(F, ".dirty=true;"), k.exit(F, ".dirty=true;")), k("a1(", v.shared.context, ",a0,", v.batchId, ");");
      }
      function q(v) {
        if (!(typeof v != "object" || ar(v))) {
          for (var h = Object.keys(v), k = 0; k < h.length; ++k)
            if (Nr.isDynamic(v[h[k]]))
              return !0;
          return !1;
        }
      }
      function $e(v, h, k) {
        var D = h.static[k];
        if (!D || !q(D))
          return;
        var F = v.global, C = Object.keys(D), M = !1, P = !1, A = !1, S = v.global.def("{}");
        C.forEach(function(G) {
          var $ = D[G];
          if (Nr.isDynamic($)) {
            typeof $ == "function" && ($ = D[G] = Nr.unbox($));
            var ae = Hr($, null);
            M = M || ae.thisDep, A = A || ae.propDep, P = P || ae.contextDep;
          } else {
            switch (F(S, ".", G, "="), typeof $) {
              case "number":
                F($);
                break;
              case "string":
                F('"', $, '"');
                break;
              case "object":
                Array.isArray($) && F("[", $.join(), "]");
                break;
              default:
                F(v.link($));
                break;
            }
            F(";");
          }
        });
        function _(G, $) {
          C.forEach(function(ae) {
            var _e = D[ae];
            if (Nr.isDynamic(_e)) {
              var we = G.invoke($, _e);
              $(S, ".", ae, "=", we, ";");
            }
          });
        }
        h.dynamic[k] = new Nr.DynamicVariable(ni, {
          thisDep: M,
          contextDep: P,
          propDep: A,
          ref: S,
          append: _
        }), delete h.static[k];
      }
      function At(v, h, k, D, F) {
        var C = ot();
        C.stats = C.link(F), Object.keys(h.static).forEach(function(P) {
          $e(C, h, P);
        }), jm.forEach(function(P) {
          $e(C, v, P);
        });
        var M = cr(v, h, k, D, C);
        return sr(C, M), X(C, M), w(C, M), n(C.compile(), {
          destroy: function() {
            M.shader.program.destroy();
          }
        });
      }
      return {
        next: Te,
        current: Re,
        procs: function() {
          var v = ot(), h = v.proc("poll"), k = v.proc("refresh"), D = v.block();
          h(D), k(D);
          var F = v.shared, C = F.gl, M = F.next, P = F.current;
          D(P, ".dirty=false;"), hr(v, h), hr(v, k, null, !0);
          var A;
          pe && (A = v.link(pe)), E.oes_vertex_array_object && k(v.link(E.oes_vertex_array_object), ".bindVertexArrayOES(null);");
          for (var S = 0; S < U.maxAttributes; ++S) {
            var _ = k.def(F.attributes, "[", S, "]"), G = v.cond(_, ".buffer");
            G.then(
              C,
              ".enableVertexAttribArray(",
              S,
              ");",
              C,
              ".bindBuffer(",
              Qo,
              ",",
              _,
              ".buffer.buffer);",
              C,
              ".vertexAttribPointer(",
              S,
              ",",
              _,
              ".size,",
              _,
              ".type,",
              _,
              ".normalized,",
              _,
              ".stride,",
              _,
              ".offset);"
            ).else(
              C,
              ".disableVertexAttribArray(",
              S,
              ");",
              C,
              ".vertexAttrib4f(",
              S,
              ",",
              _,
              ".x,",
              _,
              ".y,",
              _,
              ".z,",
              _,
              ".w);",
              _,
              ".buffer=null;"
            ), k(G), pe && k(
              A,
              ".vertexAttribDivisorANGLE(",
              S,
              ",",
              _,
              ".divisor);"
            );
          }
          return k(
            v.shared.vao,
            ".currentVAO=null;",
            v.shared.vao,
            ".setVAO(",
            v.shared.vao,
            ".targetVAO);"
          ), Object.keys(re).forEach(function($) {
            var ae = re[$], _e = D.def(M, ".", $), we = v.block();
            we(
              "if(",
              _e,
              "){",
              C,
              ".enable(",
              ae,
              ")}else{",
              C,
              ".disable(",
              ae,
              ")}",
              P,
              ".",
              $,
              "=",
              _e,
              ";"
            ), k(we), h(
              "if(",
              _e,
              "!==",
              P,
              ".",
              $,
              "){",
              we,
              "}"
            );
          }), Object.keys(J).forEach(function($) {
            var ae = J[$], _e = Re[$], we, Le, ve = v.block();
            if (ve(C, ".", ae, "("), ar(_e)) {
              var Ue = _e.length;
              we = v.global.def(M, ".", $), Le = v.global.def(P, ".", $), ve(
                Mr(Ue, function(De) {
                  return we + "[" + De + "]";
                }),
                ");",
                Mr(Ue, function(De) {
                  return Le + "[" + De + "]=" + we + "[" + De + "];";
                }).join("")
              ), h(
                "if(",
                Mr(Ue, function(De) {
                  return we + "[" + De + "]!==" + Le + "[" + De + "]";
                }).join("||"),
                "){",
                ve,
                "}"
              );
            } else
              we = D.def(M, ".", $), Le = D.def(P, ".", $), ve(
                we,
                ");",
                P,
                ".",
                $,
                "=",
                we,
                ";"
              ), h(
                "if(",
                we,
                "!==",
                Le,
                "){",
                ve,
                "}"
              );
            k(ve);
          }), v.compile();
        }(),
        compile: At
      };
    }
    function sh() {
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
    var lh = 34918, ch = 34919, Vu = 35007, fh = function(f, b) {
      if (!b.ext_disjoint_timer_query)
        return null;
      var E = [];
      function U() {
        return E.pop() || b.ext_disjoint_timer_query.createQueryEXT();
      }
      function ee(pe) {
        E.push(pe);
      }
      var H = [];
      function K(pe) {
        var Oe = U();
        b.ext_disjoint_timer_query.beginQueryEXT(Vu, Oe), H.push(Oe), ce(H.length - 1, H.length, pe);
      }
      function le() {
        b.ext_disjoint_timer_query.endQueryEXT(Vu);
      }
      function se() {
        this.startQueryIndex = -1, this.endQueryIndex = -1, this.sum = 0, this.stats = null;
      }
      var he = [];
      function be() {
        return he.pop() || new se();
      }
      function ye(pe) {
        he.push(pe);
      }
      var xe = [];
      function ce(pe, Oe, ie) {
        var Re = be();
        Re.startQueryIndex = pe, Re.endQueryIndex = Oe, Re.sum = 0, Re.stats = ie, xe.push(Re);
      }
      var me = [], B = [];
      function W() {
        var pe, Oe, ie = H.length;
        if (ie !== 0) {
          B.length = Math.max(B.length, ie + 1), me.length = Math.max(me.length, ie + 1), me[0] = 0, B[0] = 0;
          var Re = 0;
          for (pe = 0, Oe = 0; Oe < H.length; ++Oe) {
            var Te = H[Oe];
            b.ext_disjoint_timer_query.getQueryObjectEXT(Te, ch) ? (Re += b.ext_disjoint_timer_query.getQueryObjectEXT(Te, lh), ee(Te)) : H[pe++] = Te, me[Oe + 1] = Re, B[Oe + 1] = pe;
          }
          for (H.length = pe, pe = 0, Oe = 0; Oe < xe.length; ++Oe) {
            var Ze = xe[Oe], re = Ze.startQueryIndex, J = Ze.endQueryIndex;
            Ze.sum += me[J] - me[re];
            var je = B[re], Ee = B[J];
            Ee === je ? (Ze.stats.gpuTime += Ze.sum / 1e6, ye(Ze)) : (Ze.startQueryIndex = je, Ze.endQueryIndex = Ee, xe[pe++] = Ze);
          }
          xe.length = pe;
        }
      }
      return {
        beginQuery: K,
        endQuery: le,
        pushScopeStats: ce,
        update: W,
        getNumPendingQueries: function() {
          return H.length;
        },
        clear: function() {
          E.push.apply(E, H);
          for (var pe = 0; pe < E.length; pe++)
            b.ext_disjoint_timer_query.deleteQueryEXT(E[pe]);
          H.length = 0, E.length = 0;
        },
        restore: function() {
          H.length = 0, E.length = 0;
        }
      };
    }, uh = 16384, dh = 256, ph = 1024, mh = 34962, Xu = "webglcontextlost", Wu = "webglcontextrestored", Yu = 1, hh = 2, yh = 3;
    function Zu(f, b) {
      for (var E = 0; E < f.length; ++E)
        if (f[E] === b)
          return E;
      return -1;
    }
    function bh(f) {
      var b = Cs(f);
      if (!b)
        return null;
      var E = b.gl, U = E.getContextAttributes(), ee = E.isContextLost(), H = Rs(E, b);
      if (!H)
        return null;
      var K = nn(), le = sh(), se = H.extensions, he = fh(E, se), be = pn(), ye = E.drawingBufferWidth, xe = E.drawingBufferHeight, ce = {
        tick: 0,
        time: 0,
        viewportWidth: ye,
        viewportHeight: xe,
        framebufferWidth: ye,
        framebufferHeight: xe,
        drawingBufferWidth: ye,
        drawingBufferHeight: xe,
        pixelRatio: b.pixelRatio
      }, me = {}, B = {
        elements: null,
        primitive: 4,
        // GL_TRIANGLES
        count: -1,
        offset: 0,
        instances: -1
      }, W = n5(E, se), pe = A5(
        E,
        le,
        b,
        Re
      ), Oe = R5(E, se, pe, le), ie = Rm(
        E,
        se,
        W,
        le,
        pe,
        Oe,
        B
      );
      function Re(Je) {
        return ie.destroyBuffer(Je);
      }
      var Te = Pm(E, K, le, b), Ze = lm(
        E,
        se,
        W,
        function() {
          je.procs.poll();
        },
        ce,
        le,
        b
      ), re = cm(E, se, W, le, b), J = Lm(
        E,
        se,
        W,
        Ze,
        re,
        le
      ), je = ih(
        E,
        K,
        se,
        W,
        pe,
        Oe,
        Ze,
        J,
        me,
        ie,
        Te,
        B,
        ce,
        he,
        b
      ), Ee = Gm(
        E,
        J,
        je.procs.poll,
        ce,
        U,
        se,
        W
      ), ue = je.next, Se = E.canvas, ke = [], dt = [], ot = [], Me = [b.onDestroy], Ne = null;
      function et() {
        if (ke.length === 0) {
          he && he.update(), Ne = null;
          return;
        }
        Ne = bo.next(et), Cr();
        for (var Je = ke.length - 1; Je >= 0; --Je) {
          var wt = ke[Je];
          wt && wt(ce, null, 0);
        }
        E.flush(), he && he.update();
      }
      function ct() {
        !Ne && ke.length > 0 && (Ne = bo.next(et));
      }
      function _t() {
        Ne && (bo.cancel(et), Ne = null);
      }
      function Qt(Je) {
        Je.preventDefault(), ee = !0, _t(), dt.forEach(function(wt) {
          wt();
        });
      }
      function Jt(Je) {
        E.getError(), ee = !1, H.restore(), Te.restore(), pe.restore(), Ze.restore(), re.restore(), J.restore(), ie.restore(), he && he.restore(), je.procs.refresh(), ct(), ot.forEach(function(wt) {
          wt();
        });
      }
      Se && (Se.addEventListener(Xu, Qt, !1), Se.addEventListener(Wu, Jt, !1));
      function St() {
        ke.length = 0, _t(), Se && (Se.removeEventListener(Xu, Qt), Se.removeEventListener(Wu, Jt)), Te.clear(), J.clear(), re.clear(), ie.clear(), Ze.clear(), Oe.clear(), pe.clear(), he && he.clear(), Me.forEach(function(Je) {
          Je();
        });
      }
      function pr(Je) {
        g(!!Je, "invalid args to regl({...})"), g.type(Je, "object", "invalid args to regl({...})");
        function wt(F) {
          var C = n({}, F);
          delete C.uniforms, delete C.attributes, delete C.context, delete C.vao, "stencil" in C && C.stencil.op && (C.stencil.opBack = C.stencil.opFront = C.stencil.op, delete C.stencil.op);
          function M(P) {
            if (P in C) {
              var A = C[P];
              delete C[P], Object.keys(A).forEach(function(S) {
                C[P + "." + S] = A[S];
              });
            }
          }
          return M("blend"), M("depth"), M("cull"), M("stencil"), M("polygonOffset"), M("scissor"), M("sample"), "vao" in F && (C.vao = F.vao), C;
        }
        function Nt(F, C) {
          var M = {}, P = {};
          return Object.keys(F).forEach(function(A) {
            var S = F[A];
            if (Nr.isDynamic(S)) {
              P[A] = Nr.unbox(S, A);
              return;
            } else if (C && Array.isArray(S)) {
              for (var _ = 0; _ < S.length; ++_)
                if (Nr.isDynamic(S[_])) {
                  P[A] = Nr.unbox(S, A);
                  return;
                }
            }
            M[A] = S;
          }), {
            dynamic: P,
            static: M
          };
        }
        var sr = Nt(Je.context || {}, !0), En = Nt(Je.uniforms || {}, !0), Mo = Nt(Je.attributes || {}, !1), w = Nt(wt(Je), !1), X = {
          gpuTime: 0,
          cpuTime: 0,
          count: 0
        }, q = je.compile(w, Mo, En, sr, X), $e = q.draw, At = q.batch, v = q.scope, h = [];
        function k(F) {
          for (; h.length < F; )
            h.push(null);
          return h;
        }
        function D(F, C) {
          var M;
          if (ee && g.raise("context lost"), typeof F == "function")
            return v.call(this, null, F, 0);
          if (typeof C == "function")
            if (typeof F == "number")
              for (M = 0; M < F; ++M)
                v.call(this, null, C, M);
            else if (Array.isArray(F))
              for (M = 0; M < F.length; ++M)
                v.call(this, F[M], C, M);
            else
              return v.call(this, F, C, 0);
          else if (typeof F == "number") {
            if (F > 0)
              return At.call(this, k(F | 0), F | 0);
          } else if (Array.isArray(F)) {
            if (F.length)
              return At.call(this, F, F.length);
          } else
            return $e.call(this, F);
        }
        return n(D, {
          stats: X,
          destroy: function() {
            q.destroy();
          }
        });
      }
      var Xt = J.setFBO = pr({
        framebuffer: Nr.define.call(null, Yu, "framebuffer")
      });
      function cr(Je, wt) {
        var Nt = 0;
        je.procs.poll();
        var sr = wt.color;
        sr && (E.clearColor(+sr[0] || 0, +sr[1] || 0, +sr[2] || 0, +sr[3] || 0), Nt |= uh), "depth" in wt && (E.clearDepth(+wt.depth), Nt |= dh), "stencil" in wt && (E.clearStencil(wt.stencil | 0), Nt |= ph), g(!!Nt, "called regl.clear with no buffer specified"), E.clear(Nt);
      }
      function mr(Je) {
        if (g(
          typeof Je == "object" && Je,
          "regl.clear() takes an object as input"
        ), "framebuffer" in Je)
          if (Je.framebuffer && Je.framebuffer_reglType === "framebufferCube")
            for (var wt = 0; wt < 6; ++wt)
              Xt(n({
                framebuffer: Je.framebuffer.faces[wt]
              }, Je), cr);
          else
            Xt(Je, cr);
        else
          cr(null, Je);
      }
      function hr(Je) {
        g.type(Je, "function", "regl.frame() callback must be a function"), ke.push(Je);
        function wt() {
          var Nt = Zu(ke, Je);
          g(Nt >= 0, "cannot cancel a frame twice");
          function sr() {
            var En = Zu(ke, sr);
            ke[En] = ke[ke.length - 1], ke.length -= 1, ke.length <= 0 && _t();
          }
          ke[Nt] = sr;
        }
        return ct(), {
          cancel: wt
        };
      }
      function xr() {
        var Je = ue.viewport, wt = ue.scissor_box;
        Je[0] = Je[1] = wt[0] = wt[1] = 0, ce.viewportWidth = ce.framebufferWidth = ce.drawingBufferWidth = Je[2] = wt[2] = E.drawingBufferWidth, ce.viewportHeight = ce.framebufferHeight = ce.drawingBufferHeight = Je[3] = wt[3] = E.drawingBufferHeight;
      }
      function Cr() {
        ce.tick += 1, ce.time = yt(), xr(), je.procs.poll();
      }
      function ir() {
        Ze.refresh(), xr(), je.procs.refresh(), he && he.update();
      }
      function yt() {
        return (pn() - be) / 1e3;
      }
      ir();
      function Rr(Je, wt) {
        g.type(wt, "function", "listener callback must be a function");
        var Nt;
        switch (Je) {
          case "frame":
            return hr(wt);
          case "lost":
            Nt = dt;
            break;
          case "restore":
            Nt = ot;
            break;
          case "destroy":
            Nt = Me;
            break;
          default:
            g.raise("invalid event, must be one of frame,lost,restore,destroy");
        }
        return Nt.push(wt), {
          cancel: function() {
            for (var sr = 0; sr < Nt.length; ++sr)
              if (Nt[sr] === wt) {
                Nt[sr] = Nt[Nt.length - 1], Nt.pop();
                return;
              }
          }
        };
      }
      var Bt = n(pr, {
        // Clear current FBO
        clear: mr,
        // Short cuts for dynamic variables
        prop: Nr.define.bind(null, Yu),
        context: Nr.define.bind(null, hh),
        this: Nr.define.bind(null, yh),
        // executes an empty draw command
        draw: pr({}),
        // Resources
        buffer: function(Je) {
          return pe.create(Je, mh, !1, !1);
        },
        elements: function(Je) {
          return Oe.create(Je, !1);
        },
        texture: Ze.create2D,
        cube: Ze.createCube,
        renderbuffer: re.create,
        framebuffer: J.create,
        framebufferCube: J.createCube,
        vao: ie.createVAO,
        // Expose context attributes
        attributes: U,
        // Frame rendering
        frame: hr,
        on: Rr,
        // System limits
        limits: W,
        hasExtension: function(Je) {
          return W.extensions.indexOf(Je.toLowerCase()) >= 0;
        },
        // Read pixels
        read: Ee,
        // Destroy regl and all associated resources
        destroy: St,
        // Direct GL state manipulation
        _gl: E,
        _refresh: ir,
        poll: function() {
          Cr(), he && he.update();
        },
        // Current time
        now: yt,
        // regl Statistics Information
        stats: le
      });
      return b.onDone(null, Bt), Bt;
    }
    return bh;
  });
})(Fp);
var jb = Fp.exports;
const qb = /* @__PURE__ */ Sa(jb), Hb = new zb({ concurrency: 1 }), Xa = /* @__PURE__ */ new WeakMap();
let Ub = 0, Ei, ql;
const Vb = {
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
function Xb() {
  if (!(typeof document > "u"))
    return Ei || (Ei = document.createElement("canvas")), ql || (ql = qb({
      canvas: Ei,
      attributes: { depth: !1, premultipliedAlpha: !1 }
    })), { canvas: Ei, regl: ql };
}
function bd(e, t, r) {
  const n = ++Ub;
  return Xa.set(e, n), Hb.add(async () => {
    if (Xa.get(e) !== n || !e.isConnected) return;
    const o = Xb();
    if (!o) return;
    const a = Math.max(1, Math.round(e.clientWidth)), i = Math.max(1, Math.round(e.clientHeight));
    o.canvas.width = a, o.canvas.height = i, o.regl({
      ...Vb,
      frag: t,
      viewport: { x: 0, y: 0, width: a, height: i },
      uniforms: r
    })(), Xa.get(e) === n && (e.src = o.canvas.toDataURL());
  }).catch(() => {
  }), () => {
    Xa.get(e) === n && Xa.delete(e);
  };
}
function Hl(e) {
  return [
    [e.left, e.top],
    [e.right, e.bottom]
  ];
}
function Ul(e) {
  return [
    (e[0][0] + e[1][0]) / 2,
    (e[0][1] + e[1][1]) / 2
  ];
}
function Wb(e, t) {
  return [
    [Math.min(e[0][0], t[0][0]), Math.min(e[0][1], t[0][1])],
    [Math.max(e[1][0], t[1][0]), Math.max(e[1][1], t[1][1])]
  ];
}
function Yb(e, t) {
  return !(e[1][0] < t[0][0] || e[0][0] > t[1][0] || e[1][1] < t[0][1] || e[0][1] > t[1][1]);
}
const Zb = 14, bn = 7, gn = 2;
function Kb(e, t, { arrowSide: r = null, arrowOffset: n = 0, radius: o = 13 } = {}) {
  const a = (Y) => r === Y ? bn + gn : 0, i = e + a("left") + a("right"), s = t + a("top") + a("bottom"), l = `${n}px`, c = (() => {
    switch (r) {
      case "top":
        return `${l} ${gn}px`;
      case "bottom":
        return `${l} calc(100% - ${gn}px)`;
      case "left":
        return `${gn}px ${l}`;
      case "right":
        return `calc(100% - ${gn}px) ${l}`;
      default:
        return "50% 50%";
    }
  })(), u = {
    paddingTop: r === "top" ? `${bn + gn}px` : void 0,
    paddingRight: r === "right" ? `${bn + gn}px` : void 0,
    paddingBottom: r === "bottom" ? `${bn + gn}px` : void 0,
    paddingLeft: r === "left" ? `${bn + gn}px` : void 0
  };
  if (e === 0 || t === 0)
    return {
      path: "",
      layerWidth: i,
      layerHeight: s,
      transformOrigin: c,
      wrapperPadding: u
    };
  const d = Math.min(o, e / 2, t / 2), p = Zb / 2, m = r === "left" ? bn + gn : 0, y = r === "top" ? bn + gn : 0, L = (Y) => Math.max(m + d + p, Math.min(m + e - d - p, Y)), x = (Y) => Math.max(y + d + p, Math.min(y + t - d - p, Y)), O = [`M ${m + d},${y}`];
  if (r === "top") {
    const Y = L(m + n);
    O.push(
      `H ${Y - p}`,
      `L ${Y},${y - bn}`,
      `L ${Y + p},${y}`
    );
  }
  if (O.push(`H ${m + e - d}`, `A ${d} ${d} 0 0 1 ${m + e},${y + d}`), r === "right") {
    const Y = x(y + n);
    O.push(
      `V ${Y - p}`,
      `L ${m + e + bn},${Y}`,
      `L ${m + e},${Y + p}`
    );
  }
  if (O.push(
    `V ${y + t - d}`,
    `A ${d} ${d} 0 0 1 ${m + e - d},${y + t}`
  ), r === "bottom") {
    const Y = L(m + n);
    O.push(
      `H ${Y + p}`,
      `L ${Y},${y + t + bn}`,
      `L ${Y - p},${y + t}`
    );
  }
  if (O.push(`H ${m + d}`, `A ${d} ${d} 0 0 1 ${m},${y + t - d}`), r === "left") {
    const Y = x(y + n);
    O.push(
      `V ${Y + p}`,
      `L ${m - bn},${Y}`,
      `L ${m},${Y - p}`
    );
  }
  return O.push(`V ${y + d}`, `A ${d} ${d} 0 0 1 ${m + d},${y}`, "Z"), {
    path: O.join(" "),
    layerWidth: i,
    layerHeight: s,
    transformOrigin: c,
    wrapperPadding: u
  };
}
function Vi(e) {
  return e === 0 ? 0 : Math.max(0, Math.ceil(-Math.log10(e)));
}
function Qb(e, t) {
  if (typeof e != "number")
    throw console.error("Error", e), new Error("Error");
  return e.toFixed(t).replace(/\.(.*?)[0]+$/, ".$1").replace(/\.$/, "");
}
function Jb(e) {
  const t = /\.[0-9]*$/.exec(e);
  return t ? t[0].length - 1 : 0;
}
const d0 = (e, t) => (e % t + t) % t;
function p0(e) {
  return `${e * 100}%`;
}
function gd(e, t) {
  return e === t || e.contains(t);
}
const Xi = /* @__PURE__ */ new WeakMap();
function Ad(e) {
  const t = Xi.get(e);
  !t || t.size === 0 ? e.style.removeProperty("anchor-name") : e.style.setProperty("anchor-name", [...t.keys()].join(", "));
}
function e9(e, t) {
  let r = Xi.get(e);
  r || Xi.set(e, r = /* @__PURE__ */ new Map()), r.set(t, (r.get(t) ?? 0) + 1), Ad(e);
  let n = !1;
  return () => {
    if (n) return;
    n = !0;
    const o = Xi.get(e);
    if (!o) return;
    const a = (o.get(t) ?? 0) - 1;
    a > 0 ? o.set(t, a) : o.delete(t), Ad(e);
  };
}
const t9 = [
  ["pad", ["s", "v"]],
  ["slider", "h"],
  ["slider", "a"],
  ["values"]
];
function s0(e) {
  return { r: 0, g: 1, b: 2, a: 3, h: 4, s: 5, v: 6 }[e];
}
function $p({ r: e, g: t, b: r }) {
  const n = Math.max(e, t, r), o = Math.min(e, t, r), a = n - o, i = n === 0 ? Number.NaN : a / n;
  let s = Number.NaN;
  return n !== o && (n === e ? s = (t - r) / a + (t < r ? 6 : 0) : n === t ? s = (r - e) / a + 2 : s = (e - t) / a + 4, s /= 6), { h: s, s: i, v: n };
}
function M0({ h: e, s: t, v: r }) {
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
function so(e, t, r) {
  const n = typeof r == "number" ? () => r : r, o = (s) => Math.max(0, Math.min(1, s));
  if (t === "h") return { ...e, h: d0(n(e.h), 1) };
  if (t === "s" || t === "v" || t === "a")
    return { ...e, [t]: o(n(e[t])) };
  const a = M0(e);
  a[t] = o(n(a[t]));
  const i = $p(a);
  return {
    h: Number.isNaN(i.h) ? e.h : i.h,
    s: Number.isNaN(i.s) ? e.s : i.s,
    v: i.v,
    a: e.a
  };
}
function Un(e, t, r) {
  return so(e, t, (n) => n + r);
}
function Ro(e, t) {
  return t === "h" || t === "s" || t === "v" || t === "a" ? e[t] : M0(e)[t];
}
function la(e) {
  const { r: t, g: r, b: n } = M0(e);
  return kt(t * 255, r * 255, n * 255, e.a).hex();
}
function Io(e) {
  if (!kt.valid(e)) return { h: 0, s: 0, v: 0, a: 1 };
  const [t, r, n, o] = kt(e).rgba(), a = $p({ r: t / 255, g: r / 255, b: n / 255 });
  return {
    h: Number.isNaN(a.h) ? 0 : a.h,
    s: Number.isNaN(a.s) ? 0 : a.s,
    v: a.v,
    a: o
  };
}
var r9 = typeof global == "object" && global && global.Object === Object && global, n9 = typeof self == "object" && self && self.Object === Object && self, o9 = r9 || n9 || Function("return this")(), os = o9.Symbol, zp = Object.prototype, a9 = zp.hasOwnProperty, i9 = zp.toString, Wa = os ? os.toStringTag : void 0;
function s9(e) {
  var t = a9.call(e, Wa), r = e[Wa];
  try {
    e[Wa] = void 0;
    var n = !0;
  } catch {
  }
  var o = i9.call(e);
  return n && (t ? e[Wa] = r : delete e[Wa]), o;
}
var l9 = Object.prototype, c9 = l9.toString;
function f9(e) {
  return c9.call(e);
}
var u9 = "[object Null]", d9 = "[object Undefined]", vd = os ? os.toStringTag : void 0;
function jp(e) {
  return e == null ? e === void 0 ? d9 : u9 : vd && vd in Object(e) ? s9(e) : f9(e);
}
function p9(e) {
  return e != null && typeof e == "object";
}
var m9 = "[object Symbol]";
function h9(e) {
  return typeof e == "symbol" || p9(e) && jp(e) == m9;
}
var y9 = /\s/;
function b9(e) {
  for (var t = e.length; t-- && y9.test(e.charAt(t)); )
    ;
  return t;
}
var g9 = /^\s+/;
function A9(e) {
  return e && e.slice(0, b9(e) + 1).replace(g9, "");
}
function as(e) {
  var t = typeof e;
  return e != null && (t == "object" || t == "function");
}
var _d = NaN, v9 = /^[-+]0x[0-9a-f]+$/i, _9 = /^0b[01]+$/i, w9 = /^0o[0-7]+$/i, x9 = parseInt;
function E9(e) {
  if (typeof e == "number")
    return e;
  if (h9(e))
    return _d;
  if (as(e)) {
    var t = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = as(t) ? t + "" : t;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = A9(e);
  var r = _9.test(e);
  return r || w9.test(e) ? x9(e.slice(2), r ? 2 : 8) : v9.test(e) ? _d : +e;
}
var S9 = 1 / 0, k9 = 17976931348623157e292;
function Vl(e) {
  if (!e)
    return e === 0 ? e : 0;
  if (e = E9(e), e === S9 || e === -1 / 0) {
    var t = e < 0 ? -1 : 1;
    return t * k9;
  }
  return e === e ? e : 0;
}
var T9 = "[object AsyncFunction]", M9 = "[object Function]", L9 = "[object GeneratorFunction]", C9 = "[object Proxy]";
function R9(e) {
  if (!as(e))
    return !1;
  var t = jp(e);
  return t == M9 || t == L9 || t == T9 || t == C9;
}
var I9 = 9007199254740991, N9 = /^(?:0|[1-9]\d*)$/;
function O9(e, t) {
  var r = typeof e;
  return t = t ?? I9, !!t && (r == "number" || r != "symbol" && N9.test(e)) && e > -1 && e % 1 == 0 && e < t;
}
function P9(e, t) {
  return e === t || e !== e && t !== t;
}
var D9 = 9007199254740991;
function B9(e) {
  return typeof e == "number" && e > -1 && e % 1 == 0 && e <= D9;
}
function G9(e) {
  return e != null && B9(e.length) && !R9(e);
}
function F9(e, t, r) {
  if (!as(r))
    return !1;
  var n = typeof t;
  return (n == "number" ? G9(r) && O9(t, r.length) : n == "string" && t in r) ? P9(r[t], e) : !1;
}
var $9 = Math.ceil, z9 = Math.max;
function j9(e, t, r, n) {
  for (var o = -1, a = z9($9((t - e) / (r || 1)), 0), i = Array(a); a--; )
    i[++o] = e, e += r;
  return i;
}
function q9(e) {
  return function(t, r, n) {
    return n && typeof n != "number" && F9(t, r, n) && (r = n = void 0), t = Vl(t), r === void 0 ? (r = t, t = 0) : r = Vl(r), n = n === void 0 ? t < r ? 1 : -1 : Vl(n), j9(t, r, n);
  };
}
var wd = q9();
const H9 = 20;
function U9({
  step: e,
  display: t,
  width: r,
  min: n,
  max: o,
  tweaking: a,
  speed: i,
  precision: s
}) {
  if (e) return Vi(e);
  const l = Jb(t), c = n !== Number.MIN_SAFE_INTEGER && o !== Number.MAX_SAFE_INTEGER && r > 0 ? Vi(Math.abs(o - n) / r) : 0;
  return a ? Math.max(l, c, Vi(i)) : Math.min(s, Math.max(l, c));
}
function V9({
  state: e,
  delta: t,
  barVisible: r,
  min: n,
  max: o,
  width: a,
  step: i,
  speed: s,
  minSpeed: l,
  maxSpeed: c
}) {
  const [u, d] = t, p = X9([
    Zt.lerp(e.directionAverage[0], Math.abs(u), 0.1),
    Zt.lerp(e.directionAverage[1], Math.abs(d), 0.1)
  ]), m = Zt.smoothstep(
    0.4,
    0.6,
    Math.abs(p[0])
  ), y = r ? (o - n) / a : i ? i / H9 : 1, L = u * y * s * m;
  let x = e.local + L;
  r || (x = Zt.clamp(x, n, o));
  const O = Zt.clamp(
    Zt.lerp(
      e.gestureSpeed * 0.98 ** d,
      e.gestureSpeed,
      m
    ),
    l,
    c
  );
  return {
    local: x,
    directionAverage: p,
    offsetWeight: m,
    gestureSpeed: O,
    deltaValue: L
  };
}
function X9(e) {
  const t = Math.hypot(e[0], e[1]);
  return t === 0 ? [1, 0] : [e[0] / t, e[1] / t];
}
function W9(e) {
  return new Function(
    "x",
    "context",
    `const {i} = context;
		const result = (${e});
		if (typeof result === 'number') return result;
		throw new Error('Value is not a number');`
  );
}
var Y9 = bs("colinear"), Z9 = bs("parallel"), K9 = bs("none");
function Q9(e, t, r, n, o, a, i, s) {
  var l = (s - a) * (r - e) - (i - o) * (n - t), c = (i - o) * (t - a) - (s - a) * (e - o), u = (r - e) * (t - a) - (n - t) * (e - o);
  if (l == 0)
    return c == 0 && u == 0 ? Y9 : Z9;
  var d = c / l, p = u / l;
  return d >= 0 && d <= 1 && p >= 0 && p <= 1 ? J9({
    x: e + d * (r - e),
    y: t + d * (n - t)
  }) : K9;
}
function J9(e) {
  var t = bs("intersecting");
  return t.point = e, t;
}
function bs(e) {
  return {
    type: e
  };
}
function eg(e, t, r, n) {
  const o = e + t;
  return !n || !Number.isFinite(r) || r === 0 ? { local: o, output: o } : {
    local: o,
    output: Math.round(o / r) * r
  };
}
function xd(e, t) {
  return d0(e - t + 180, 360) - 180;
}
function tg(e, t, r) {
  const [[n, o], [a, i]] = r;
  for (const [s, l, c, u] of [
    [n, o, a, o],
    [a, o, a, i],
    [a, i, n, i],
    [n, i, n, o]
  ]) {
    const d = Q9(
      e[0],
      e[1],
      t[0],
      t[1],
      s,
      l,
      c,
      u
    );
    if (d.type === "intersecting") return [d.point.x, d.point.y];
  }
  return t;
}
const Xl = /* @__PURE__ */ new Map();
function Ya() {
  return typeof localStorage > "u" ? null : localStorage;
}
const qp = qc((e, t) => {
  function r(p) {
    return `${t().appId}.${p}`;
  }
  function n() {
    e((p) => ({ revision: p.revision + 1 }));
  }
  function o(p, m) {
    for (const y of p.listeners) y(p.value, m);
  }
  function a(p, m) {
    if (Object.is(p.value, m)) return;
    p.value = m;
    const y = Ya();
    y && (m === p.defaultValue ? y.removeItem(r(p.relKey)) : y.setItem(r(p.relKey), JSON.stringify(m))), n(), o(p, { reload: !1 });
  }
  function i(p, m) {
    if (Object.is(p.defaultValue, m)) return;
    p.defaultValue = m;
    const y = Ya(), L = JSON.parse((y == null ? void 0 : y.getItem(r(p.relKey))) ?? "null");
    L === null ? a(p, m) : L === m && (y == null || y.removeItem(r(p.relKey))), n();
  }
  function s(p, m) {
    var x;
    const y = {
      relKey: p,
      value: m,
      defaultValue: m,
      listeners: /* @__PURE__ */ new Set()
    }, L = ((x = Ya()) == null ? void 0 : x.getItem(r(p))) ?? null;
    return L !== null && (y.value = JSON.parse(L)), Xl.set(p, y), y;
  }
  function l(p) {
    return {
      get value() {
        return p.value;
      },
      set value(m) {
        a(p, m);
      },
      get default() {
        return p.defaultValue;
      },
      set default(m) {
        i(p, m);
      },
      get key() {
        return r(p.relKey);
      },
      subscribe(m) {
        return p.listeners.add(m), () => {
          p.listeners.delete(m);
        };
      }
    };
  }
  function c(p) {
    return {
      ref(m, y) {
        const L = p === "" ? m : `${p}.${m}`, x = Xl.get(L) ?? s(L, y);
        return l(x);
      },
      group(m) {
        return c(p === "" ? m : `${p}.${m}`);
      },
      reset() {
        const m = Ya();
        if (!m) return;
        const y = p === "" ? t().appId : `${t().appId}.${p}`;
        for (let L = m.length - 1; L >= 0; L--) {
          const x = m.key(L);
          x != null && x.startsWith(y) && m.removeItem(x);
        }
      }
    };
  }
  function u(p) {
    if (t().appId === p) return;
    e({ appId: p });
    const m = Ya(), y = [];
    for (const L of Xl.values()) {
      const x = (m == null ? void 0 : m.getItem(`${p}.${L.relKey}`)) ?? null, O = x !== null ? JSON.parse(x) : L.defaultValue;
      Object.is(L.value, O) || (L.value = O, y.push(L));
    }
    for (const L of y)
      o(L, { reload: !0 });
    n();
  }
  const d = c("");
  return {
    appId: "tweeq",
    revision: 0,
    setAppId: u,
    ...d
  };
});
function rg(e, t, r, n) {
  const o = (u, d, p) => (u.x - p.x) * (d.y - p.y) - (d.x - p.x) * (u.y - p.y), a = o(e, t, r), i = o(e, r, n), s = o(e, n, t), l = a < 0 || i < 0 || s < 0, c = a > 0 || i > 0 || s > 0;
  return !(l && c);
}
function ng(e, t, r) {
  if (typeof e != "string")
    return { left: `${e[0]}px`, top: `${e[1]}px` };
  const [n, o] = e.split("-"), a = typeof t == "number" ? { mainAxis: t, crossAxis: 0 } : { mainAxis: t.mainAxis ?? 0, crossAxis: t.crossAxis ?? 0 }, i = `${a.mainAxis}px`, s = `${a.crossAxis}px`, l = n === "top" || n === "bottom", c = {
    positionAnchor: r,
    positionTryFallbacks: "flip-block, flip-inline, flip-block flip-inline"
  };
  return n === "top" ? (c.bottom = "anchor(top)", c.marginBottom = i) : n === "bottom" ? (c.top = "anchor(bottom)", c.marginTop = i) : n === "left" ? (c.right = "anchor(left)", c.marginRight = i) : (c.left = "anchor(right)", c.marginLeft = i), o === "start" ? l ? (c.left = "anchor(left)", c.marginLeft = s) : (c.top = "anchor(top)", c.marginTop = s) : o === "end" ? l ? (c.right = "anchor(right)", c.marginRight = s) : (c.bottom = "anchor(bottom)", c.marginBottom = s) : l ? (c.left = "anchor(center)", c.translate = "-50% 0") : (c.top = "anchor(center)", c.translate = "0 -50%"), c;
}
function og({
  reference: e,
  popover: t,
  placement: r,
  currentShiftX: n,
  currentShiftY: o,
  viewportWidth: a,
  viewportHeight: i,
  arrow: s,
  viewportMargin: l = 8
}) {
  const [c] = r.split("-");
  let u = 0, d = 0;
  const p = t.left - n, m = t.right - n, y = t.top - o, L = t.bottom - o;
  if (m > a - l && (u = a - l - m), p + u < l && (u = l - p), L > i - l && (d = i - l - L), y + d < l && (d = l - y), !s) return { shiftX: u, shiftY: d, arrowOffset: 0 };
  const x = t.left - n + u, O = t.top - o + d, Y = {
    left: x,
    top: O,
    right: x + t.width,
    bottom: O + t.height
  };
  let R;
  Y.top >= e.bottom - 1 ? R = "top" : Y.bottom <= e.top + 1 ? R = "bottom" : Y.left >= e.right - 1 ? R = "left" : R = c === "bottom" ? "top" : c === "top" ? "bottom" : c === "right" ? "left" : "right";
  const z = R === "top" || R === "bottom" ? e.left + e.width / 2 - Y.left : e.top + e.height / 2 - Y.top;
  return { shiftX: u, shiftY: d, arrowSide: R, arrowOffset: z };
}
var Hp = { exports: {} };
/*! Case - v1.6.2 - 2020-03-24
* Copyright (c) 2020 Nathan Bubna; Licensed MIT, GPL */
(function(e) {
  (function() {
    var t = function(m, y) {
      return y = y || "", m.replace(/(^|-)/g, "$1\\u" + y).replace(/,/g, "\\u" + y);
    }, r = t("20-26,28-2F,3A-40,5B-60,7B-7E,A0-BF,D7,F7", "00"), n = "a-z" + t("DF-F6,F8-FF", "00"), o = "A-Z" + t("C0-D6,D8-DE", "00"), a = "A|An|And|As|At|But|By|En|For|If|In|Of|On|Or|The|To|Vs?\\.?|Via", i = function(m, y, L, x) {
      return m = m || r, y = y || n, L = L || o, x = x || a, {
        capitalize: new RegExp("(^|[" + m + "])([" + y + "])", "g"),
        pascal: new RegExp("(^|[" + m + "])+([" + y + L + "])", "g"),
        fill: new RegExp("[" + m + "]+(.|$)", "g"),
        sentence: new RegExp('(^\\s*|[\\?\\!\\.]+"?\\s+"?|,\\s+")([' + y + "])", "g"),
        improper: new RegExp("\\b(" + x + ")\\b", "g"),
        relax: new RegExp("([^" + L + "])([" + L + "]*)([" + L + "])(?=[^" + L + "]|$)", "g"),
        upper: new RegExp("^[^" + y + "]+$"),
        hole: /[^\s]\s[^\s]/,
        apostrophe: /'/g,
        room: new RegExp("[" + m + "]")
      };
    }, s = i(), l = {
      re: s,
      unicodes: t,
      regexps: i,
      types: [],
      up: String.prototype.toUpperCase,
      low: String.prototype.toLowerCase,
      cap: function(m) {
        return l.up.call(m.charAt(0)) + m.slice(1);
      },
      decap: function(m) {
        return l.low.call(m.charAt(0)) + m.slice(1);
      },
      deapostrophe: function(m) {
        return m.replace(s.apostrophe, "");
      },
      fill: function(m, y, L) {
        return y != null && (m = m.replace(s.fill, function(x, O) {
          return O ? y + O : "";
        })), L && (m = l.deapostrophe(m)), m;
      },
      prep: function(m, y, L, x) {
        if (m = m == null ? "" : m + "", !x && s.upper.test(m) && (m = l.low.call(m)), !y && !s.hole.test(m)) {
          var O = l.fill(m, " ");
          s.hole.test(O) && (m = O);
        }
        return !L && !s.room.test(m) && (m = m.replace(s.relax, l.relax)), m;
      },
      relax: function(m, y, L, x) {
        return y + " " + (L ? L + " " : "") + x;
      }
    }, c = {
      _: l,
      of: function(m) {
        for (var y = 0, L = l.types.length; y < L; y++)
          if (c[l.types[y]].apply(c, arguments) === m)
            return l.types[y];
      },
      flip: function(m) {
        return m.replace(/\w/g, function(y) {
          return (y == l.up.call(y) ? l.low : l.up).call(y);
        });
      },
      random: function(m) {
        return m.replace(/\w/g, function(y) {
          return (Math.round(Math.random()) ? l.up : l.low).call(y);
        });
      },
      type: function(m, y) {
        c[m] = y, l.types.push(m);
      }
    }, u = {
      lower: function(m, y, L) {
        return l.fill(l.low.call(l.prep(m, y)), y, L);
      },
      snake: function(m) {
        return c.lower(m, "_", !0);
      },
      constant: function(m) {
        return c.upper(m, "_", !0);
      },
      camel: function(m) {
        return l.decap(c.pascal(m));
      },
      kebab: function(m) {
        return c.lower(m, "-", !0);
      },
      upper: function(m, y, L) {
        return l.fill(l.up.call(l.prep(m, y, !1, !0)), y, L);
      },
      capital: function(m, y, L) {
        return l.fill(l.prep(m).replace(s.capitalize, function(x, O, Y) {
          return O + l.up.call(Y);
        }), y, L);
      },
      header: function(m) {
        return c.capital(m, "-", !0);
      },
      pascal: function(m) {
        return l.fill(l.prep(m, !1, !0).replace(s.pascal, function(y, L, x) {
          return l.up.call(x);
        }), "", !0);
      },
      title: function(m) {
        return c.capital(m).replace(s.improper, function(y, L, x, O) {
          return x > 0 && x < O.lastIndexOf(" ") ? l.low.call(y) : y;
        });
      },
      sentence: function(m, y, L) {
        return m = c.lower(m).replace(s.sentence, function(x, O, Y) {
          return O + l.up.call(Y);
        }), y && y.forEach(function(x) {
          m = m.replace(new RegExp("\\b" + c.lower(x) + "\\b", "g"), l.cap);
        }), L && L.forEach(function(x) {
          m = m.replace(new RegExp("(\\b" + c.lower(x) + "\\. +)(\\w)"), function(O, Y, R) {
            return Y + l.low.call(R);
          });
        }), m;
      }
    };
    u.squish = u.pascal, c.default = c;
    for (var d in u)
      c.type(d, u[d]);
    var p = typeof p == "function" ? p : function() {
    };
    p(e.exports ? e.exports = c : this.Case = c);
  }).call(i0);
})(Hp);
var ag = Hp.exports;
const Up = /* @__PURE__ */ Sa(ag), Za = /* @__PURE__ */ new Map();
let Wl = null, Si = !1, ki = !1, Ka = !1, Ed = !1;
const Sd = qc((e, t) => {
  function r() {
    e((R) => ({ revision: R.revision + 1 }));
  }
  function n() {
    return t().selectedIds.map((R) => Za.get(R)).filter((R) => R !== void 0);
  }
  function o() {
    const R = t().selectedIds.at(-1);
    if (!R) return null;
    const z = Za.get(R);
    return z ? z.element : null;
  }
  function a(R) {
    e({ selectedIds: R, multiSelected: R.length > 1 });
  }
  function i(R) {
    a([...t().selectedIds.filter((z) => z !== R), R]);
  }
  function s() {
    a([]);
  }
  function l(R, z) {
    const j = Ul(R), I = Ul(z), N = $t.sub(I, j), ne = Wb(R, z), de = [];
    Za.forEach((oe) => {
      const ge = oe.element;
      if (!ge) return;
      const te = Hl(ge.getBoundingClientRect());
      if (Yb(ne, te)) {
        const Ie = Ul(te), Ke = $t.dot($t.sub(Ie, j), N);
        de.push({ id: oe.id, order: Ke });
      }
    }), de.sort((oe, ge) => oe.order - ge.order), de.forEach(({ id: oe }) => i(oe));
  }
  function c() {
    const R = Si || ki, z = t();
    (z.shift !== Ka || z.ctrlOrCommand !== R) && e({ shift: Ka, ctrlOrCommand: R });
  }
  function u(R) {
    if (R.button !== 0) return;
    const z = R.target, j = !n().some(({ element: oe }) => oe && gd(oe, z)), I = Wl && gd(Wl, z), { shift: N, ctrlOrCommand: ne } = t();
    j && !I && !(ne || N) && s();
  }
  function d(R) {
    R.key === "Meta" && (Si = !0), R.key === "Control" && (ki = !0), R.key === "Shift" && (Ka = !0), c(), (R.key === "Escape" || R.key === "Tab") && s();
  }
  function p(R) {
    R.key === "Meta" && (Si = !1), R.key === "Control" && (ki = !1), R.key === "Shift" && (Ka = !1), c();
  }
  function m() {
    Si = ki = Ka = !1, c();
  }
  function y() {
    Ed || typeof window > "u" || (Ed = !0, window.addEventListener("pointerdown", u), window.addEventListener("keydown", d), window.addEventListener("keyup", p), window.addEventListener("blur", m));
  }
  function L(R) {
    y();
    const z = Symbol(), j = {
      id: z,
      type: R.type,
      get element() {
        return R.getElement();
      },
      get speed() {
        var te;
        return (te = R.getSpeed) == null ? void 0 : te.call(R);
      },
      focusing: !1,
      capturedValue: void 0,
      getValue: R.getValue,
      setValue: R.setValue,
      confirm: R.confirm
    };
    Za.set(z, j), r();
    const I = () => t().selectedIds.includes(z), N = () => I() && !j.focusing;
    function ne(te) {
      if (j.focusing === te || (j.focusing = te, r(), !te)) return;
      const { shift: Ie, ctrlOrCommand: Ke } = t(), Ye = o(), it = j.element;
      if (Ie && Ye && it) {
        const Xe = Hl(
          Ye.getBoundingClientRect()
        ), Qe = Hl(it.getBoundingClientRect());
        l(Xe, Qe);
      }
      !N() && !Ke && !Ie && s(), N() || i(z);
    }
    function de(te) {
      n().forEach((Ie, Ke) => {
        if (Ie.id === z || Ie.type !== R.type) return;
        const Ye = { i: Ke }, it = te(
          Ie.capturedValue ?? Ie.getValue(),
          Ye
        );
        Ie.setValue(it);
      });
    }
    function oe() {
      n().forEach((te) => {
        te.id !== z && te.confirm();
      });
    }
    function ge() {
      Za.delete(z), I() && a(t().selectedIds.filter((te) => te !== z)), r();
    }
    return {
      id: z,
      get subfocus() {
        return N();
      },
      get index() {
        return n().findIndex((te) => te.id === z);
      },
      get readyToBeSelected() {
        const { shift: te, ctrlOrCommand: Ie } = t();
        return (Ie || te) && !I();
      },
      get multiSelected() {
        return t().multiSelected;
      },
      setFocusing: ne,
      capture: x,
      update: de,
      confirm: oe,
      dispose: ge
    };
  }
  function x() {
    n().forEach((R) => {
      R.capturedValue = R.getValue();
    }), r();
  }
  function O(R) {
    const z = n(), j = z.map(
      (N) => N.capturedValue ?? N.getValue()
    ), I = R(j);
    z.forEach((N, ne) => {
      N.setValue(I[ne]);
    });
  }
  function Y() {
    n().forEach((R) => {
      R.confirm(), R.capturedValue = void 0;
    }), r();
  }
  return {
    selectedIds: [],
    multiSelected: !1,
    shift: !1,
    ctrlOrCommand: !1,
    revision: 0,
    register: L,
    captureValues: x,
    updateValues: O,
    confirmValues: Y,
    defocusAll: s,
    setPopupEl: (R) => {
      Wl = R;
    },
    getSelectedInputs: n,
    getFocusedElement: o
  };
});
function ig(e, t, r = document.body) {
  for (const [a, i] of Object.entries(e)) {
    const s = "--tq-" + Up.kebab(a), l = typeof i == "number" ? `${i}px` : i;
    r.style.setProperty(s, l);
  }
  r.dataset.colorMode = t;
  const n = r.ownerDocument;
  let o = n.querySelector("meta[name=theme-color]");
  o || (o = n.createElement("meta"), o.setAttribute("name", "theme-color"), n.head.appendChild(o)), o.setAttribute("content", e.colorBackground);
}
function nr(e, t) {
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
function L0(e) {
  return lo(e) === "string";
}
function lo(e) {
  return (Object.prototype.toString.call(e).match(/^\[object\s+(.*?)\]$/)[1] || "").toLowerCase();
}
function is(e, { precision: t, unit: r }) {
  return co(e) ? "none" : Vp(e, t) + (r ?? "");
}
function co(e) {
  return Number.isNaN(e) || e instanceof Number && (e == null ? void 0 : e.none);
}
function _r(e) {
  return co(e) ? 0 : e;
}
function Vp(e, t) {
  if (e === 0)
    return 0;
  let r = ~~e, n = 0;
  r && t && (n = ~~Math.log10(Math.abs(r)) + 1);
  const o = 10 ** (t - n);
  return Math.floor(e * o + 0.5) / o;
}
const sg = {
  deg: 1,
  grad: 0.9,
  rad: 180 / Math.PI,
  turn: 360
};
function Xp(e) {
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
        let d = c[0], p = u.slice(0, -d.length);
        d === "%" ? (u = new Number(p / 100), u.type = "<percentage>") : (u = new Number(p * sg[d]), u.type = "<angle>", u.unit = d);
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
function Wp(e) {
  return e[e.length - 1];
}
function m0(e, t, r) {
  return isNaN(e) ? t : isNaN(t) ? e : e + (t - e) * r;
}
function Yp(e, t, r) {
  return (r - e) / (t - e);
}
function Hc(e, t, r) {
  return m0(t[0], t[1], Yp(e[0], e[1], r));
}
function Zp(e) {
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
function Kp(e, t, r) {
  return Math.max(Math.min(r, t), e);
}
function gs(e, t) {
  return Math.sign(e) === Math.sign(t) ? e : -e;
}
function In(e, t) {
  return gs(Math.abs(e) ** t, e);
}
function Uc(e, t) {
  return t === 0 ? 0 : e / t;
}
function Qp(e, t, r = 0, n = e.length) {
  for (; r < n; ) {
    const o = r + n >> 1;
    e[o] < t ? r = o + 1 : n = o;
  }
  return r;
}
var lg = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  bisectLeft: Qp,
  clamp: Kp,
  copySign: gs,
  interpolate: m0,
  interpolateInv: Yp,
  isNone: co,
  isString: L0,
  last: Wp,
  mapRange: Hc,
  multiplyMatrices: nr,
  parseCoordGrammar: Zp,
  parseFunction: Xp,
  serializeNumber: is,
  skipNone: _r,
  spow: In,
  toPrecision: Vp,
  type: lo,
  zdiv: Uc
});
class cg {
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
const fo = new cg();
var Q1, J1, ep, en = {
  gamut_mapping: "css",
  precision: 5,
  deltaE: "76",
  // Default deltaE method
  verbose: ((ep = (J1 = (Q1 = globalThis == null ? void 0 : globalThis.process) == null ? void 0 : Q1.env) == null ? void 0 : J1.NODE_ENV) == null ? void 0 : ep.toLowerCase()) !== "test",
  warn: function(t) {
    var r, n;
    this.verbose && ((n = (r = globalThis == null ? void 0 : globalThis.console) == null ? void 0 : r.warn) == null || n.call(r, t));
  }
};
const qr = {
  // for compatibility, the four-digit chromaticity-derived ones everyone else uses
  D50: [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585],
  D65: [0.3127 / 0.329, 1, (1 - 0.3127 - 0.329) / 0.329]
};
function Ac(e) {
  return Array.isArray(e) ? e : qr[e];
}
function ss(e, t, r, n = {}) {
  if (e = Ac(e), t = Ac(t), !e || !t)
    throw new TypeError(`Missing white point to convert ${e ? "" : "from"}${!e && !t ? "/" : ""}${t ? "" : "to"}`);
  if (e === t)
    return r;
  let o = { W1: e, W2: t, XYZ: r, options: n };
  if (fo.run("chromatic-adaptation-start", o), o.M || (o.W1 === qr.D65 && o.W2 === qr.D50 ? o.M = [
    [1.0479297925449969, 0.022946870601609652, -0.05019226628920524],
    [0.02962780877005599, 0.9904344267538799, -0.017073799063418826],
    [-0.009243040646204504, 0.015055191490298152, 0.7518742814281371]
  ] : o.W1 === qr.D50 && o.W2 === qr.D65 && (o.M = [
    [0.955473421488075, -0.02309845494876471, 0.06325924320057072],
    [-0.0283697093338637, 1.0099953980813041, 0.021041441191917323],
    [0.012314014864481998, -0.020507649298898964, 1.330365926242124]
  ])), fo.run("chromatic-adaptation-end", o), o.M)
    return nr(o.M, o.XYZ);
  throw new TypeError("Only Bradford CAT with white points D50 and D65 supported for now.");
}
const fg = /* @__PURE__ */ new Set(["<number>", "<percentage>", "<angle>"]);
function kd(e, t, r, n) {
  return Object.entries(e.coords).map(([a, i], s) => {
    let l = t.coordGrammar[s], c = n[s], u = c == null ? void 0 : c.type, d;
    if (c.none ? d = l.find((y) => fg.has(y)) : d = l.find((y) => y == u), !d) {
      let y = i.name || a;
      throw new TypeError(`${u ?? c.raw} not allowed for ${y} in ${r}()`);
    }
    let p = d.range;
    u === "<percentage>" && (p || (p = [0, 1]));
    let m = i.range || i.refRange;
    return p && m && (n[s] = Hc(p, m, n[s])), d;
  });
}
function Jp(e, { meta: t } = {}) {
  var n, o, a, i;
  let r = { str: (n = String(e)) == null ? void 0 : n.trim() };
  if (fo.run("parse-start", r), r.color)
    return r.color;
  if (r.parsed = Xp(r.str), r.parsed) {
    let s = r.parsed.name;
    if (s === "color") {
      let l = r.parsed.args.shift(), c = l.startsWith("--") ? l.substring(2) : `--${l}`, u = [l, c], d = r.parsed.rawArgs.indexOf("/") > 0 ? r.parsed.args.pop() : 1;
      for (let y of at.all) {
        let L = y.getFormat("color");
        if (L && (u.includes(L.id) || (o = L.ids) != null && o.filter((x) => u.includes(x)).length)) {
          const x = Object.keys(y.coords).map((Y, R) => r.parsed.args[R] || 0);
          let O;
          return L.coordGrammar && (O = kd(y, L, "color", x)), t && Object.assign(t, { formatId: "color", types: O }), L.id.startsWith("--") && !l.startsWith("--") && en.warn(`${y.name} is a non-standard space and not currently supported in the CSS spec. Use prefixed color(${L.id}) instead of color(${l}).`), l.startsWith("--") && !L.id.startsWith("--") && en.warn(`${y.name} is a standard space and supported in the CSS spec. Use color(${L.id}) instead of prefixed color(${l}).`), { spaceId: y.id, coords: x, alpha: d };
        }
      }
      let p = "", m = l in at.registry ? l : c;
      if (m in at.registry) {
        let y = (i = (a = at.registry[m].formats) == null ? void 0 : a.color) == null ? void 0 : i.id;
        y && (p = `Did you mean color(${y})?`);
      }
      throw new TypeError(`Cannot parse color(${l}). ` + (p || "Missing a plugin?"));
    } else
      for (let l of at.all) {
        let c = l.getFormat(s);
        if (c && c.type === "function") {
          let u = 1;
          (c.lastAlpha || Wp(r.parsed.args).alpha) && (u = r.parsed.args.pop());
          let d = r.parsed.args, p;
          return c.coordGrammar && (p = kd(l, c, s, d)), t && Object.assign(t, { formatId: c.name, types: p }), {
            spaceId: l.id,
            coords: d,
            alpha: u
          };
        }
      }
  } else
    for (let s of at.all)
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
function It(e) {
  if (Array.isArray(e))
    return e.map(It);
  if (!e)
    throw new TypeError("Empty color reference");
  L0(e) && (e = Jp(e));
  let t = e.space || e.spaceId;
  return t instanceof at || (e.space = at.get(t)), e.alpha === void 0 && (e.alpha = 1), e;
}
const ug = 75e-6, Vr = class Vr {
  constructor(t) {
    var o;
    this.id = t.id, this.name = t.name, this.base = t.base ? Vr.get(t.base) : null, this.aliases = t.aliases, this.base && (this.fromBase = t.fromBase, this.toBase = t.toBase);
    let r = t.coords ?? this.base.coords;
    for (let a in r)
      "name" in r[a] || (r[a].name = a);
    this.coords = r;
    let n = t.white ?? this.base.white ?? "D65";
    this.white = Ac(n), this.formats = t.formats ?? {};
    for (let a in this.formats) {
      let i = this.formats[a];
      i.type || (i.type = "function"), i.name || (i.name = a);
    }
    (o = this.formats.color) != null && o.id || (this.formats.color = {
      ...this.formats.color ?? {},
      id: t.cssId || this.id
    }), t.gamutSpace ? this.gamutSpace = t.gamutSpace === "self" ? this : Vr.get(t.gamutSpace) : this.isPolar ? this.gamutSpace = this.base : this.gamutSpace = this, this.gamutSpace.isUnbounded && (this.inGamut = (a, i) => !0), this.referred = t.referred, Object.defineProperty(this, "path", {
      value: dg(this).reverse(),
      writable: !1,
      enumerable: !0,
      configurable: !0
    }), fo.run("colorspace-init-end", this);
  }
  inGamut(t, { epsilon: r = ug } = {}) {
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
      return t = Td(t, this), t;
    let r;
    return t === "default" ? r = Object.values(this.formats)[0] : r = this.formats[t], r ? (r = Td(r, this), r) : null;
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
      const s = It(t);
      [t, r] = [s.space, s.coords];
    }
    if (t = Vr.get(t), this.equals(t))
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
      const n = It(t);
      [t, r] = [n.space, n.coords];
    }
    return t = Vr.get(t), t.to(this, r);
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
    return [...new Set(Object.values(Vr.registry))];
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
    if (!t || t instanceof Vr)
      return t;
    if (lo(t) === "string") {
      let o = Vr.registry[t.toLowerCase()];
      if (!o)
        throw new TypeError(`No color space found with id = "${t}"`);
      return o;
    }
    if (r.length)
      return Vr.get(...r);
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
    let n = lo(t), o, a;
    if (n === "string" ? t.includes(".") ? [o, a] = t.split(".") : [o, a] = [, t] : Array.isArray(t) ? [o, a] = t : (o = t.space, a = t.coordId), o = Vr.get(o), o || (o = r), !o)
      throw new TypeError(`Cannot resolve coordinate reference ${t}: No color space specified and relative references are not allowed here`);
    if (n = lo(a), n === "number" || n === "string" && a >= 0) {
      let c = Object.entries(o.coords)[a];
      if (c)
        return { space: o, id: c[0], index: a, ...c[1] };
    }
    o = Vr.get(o);
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
bi(Vr, "registry", {}), bi(Vr, "DEFAULT_FORMAT", {
  type: "functions",
  name: "color"
});
let at = Vr;
function dg(e) {
  let t = [e];
  for (let r = e; r = r.base; )
    t.push(r);
  return t;
}
function Td(e, { coords: t } = {}) {
  if (e.coords && !e.coordGrammar) {
    e.type || (e.type = "function"), e.name || (e.name = "color"), e.coordGrammar = Zp(e.coords);
    let r = Object.entries(t).map(([n, o], a) => {
      let i = e.coordGrammar[a][0], s = o.range || o.refRange, l = i.range, c = "";
      return i == "<percentage>" ? (l = [0, 100], c = "%") : i == "<angle>" && (c = "deg"), { fromRange: s, toRange: l, suffix: c };
    });
    e.serializeCoords = (n, o) => n.map((a, i) => {
      let { fromRange: s, toRange: l, suffix: c } = r[i];
      return s && l && (a = Hc(s, l, a)), a = is(a, { precision: o, unit: c }), a;
    });
  }
  return e;
}
var Dr = new at({
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
class Yr extends at {
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
    }), t.base || (t.base = Dr), t.toXYZ_M && t.fromXYZ_M && (t.toBase ?? (t.toBase = (r) => {
      let n = nr(t.toXYZ_M, r);
      return this.white !== this.base.white && (n = ss(this.white, this.base.white, n)), n;
    }), t.fromBase ?? (t.fromBase = (r) => (r = ss(this.base.white, this.white, r), nr(t.fromXYZ_M, r)))), t.referred ?? (t.referred = "display"), super(t);
  }
}
function C0(e, t) {
  return e = It(e), !t || e.space.equals(t) ? e.coords.slice() : (t = at.get(t), t.from(e));
}
function Qr(e, t) {
  e = It(e);
  let { space: r, index: n } = at.resolveCoord(t, e.space);
  return C0(e, r)[n];
}
function Vc(e, t, r) {
  return e = It(e), t = at.get(t), e.coords = t.to(e.space, r), e;
}
Vc.returns = "color";
function Zn(e, t, r) {
  if (e = It(e), arguments.length === 2 && lo(arguments[1]) === "object") {
    let n = arguments[1];
    for (let o in n)
      Zn(e, o, n[o]);
  } else {
    typeof r == "function" && (r = r(Qr(e, t)));
    let { space: n, index: o } = at.resolveCoord(t, e.space), a = C0(e, n);
    a[o] = r, Vc(e, n, a);
  }
  return e;
}
Zn.returns = "color";
var Xc = new at({
  id: "xyz-d50",
  name: "XYZ D50",
  white: "D50",
  base: Dr,
  fromBase: (e) => ss(Dr.white, "D50", e),
  toBase: (e) => ss("D50", Dr.white, e)
});
const pg = 216 / 24389, Md = 24 / 116, Ti = 24389 / 27;
let Yl = qr.D50;
var Jr = new at({
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
  white: Yl,
  base: Xc,
  // Convert D50-adapted XYX to Lab
  //  CIE 15.3:2004 section 8.2.1.1
  fromBase(e) {
    let r = e.map((n, o) => n / Yl[o]).map((n) => n > pg ? Math.cbrt(n) : (Ti * n + 16) / 116);
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
      t[0] > Md ? Math.pow(t[0], 3) : (116 * t[0] - 16) / Ti,
      e[0] > 8 ? Math.pow((e[0] + 16) / 116, 3) : e[0] / Ti,
      t[2] > Md ? Math.pow(t[2], 3) : (116 * t[2] - 16) / Ti
    ].map((n, o) => n * Yl[o]);
  },
  formats: {
    lab: {
      coords: ["<number> | <percentage>", "<number> | <percentage>[-1,1]", "<number> | <percentage>[-1,1]"]
    }
  }
});
function Pn(e) {
  return (e % 360 + 360) % 360;
}
function mg(e, t) {
  if (e === "raw")
    return t;
  let [r, n] = t.map(Pn), o = n - r;
  return e === "increasing" ? o < 0 && (n += 360) : e === "decreasing" ? o > 0 && (r += 360) : e === "longer" ? -180 < o && o < 180 && (o > 0 ? r += 360 : n += 360) : e === "shorter" && (o > 180 ? r += 360 : o < -180 && (n += 360)), [r, n];
}
var h0 = new at({
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
  base: Jr,
  fromBase(e) {
    let [t, r, n] = e, o;
    const a = 0.02;
    return Math.abs(r) < a && Math.abs(n) < a ? o = NaN : o = Math.atan2(n, r) * 180 / Math.PI, [
      t,
      // L is still L
      Math.sqrt(r ** 2 + n ** 2),
      // Chroma
      Pn(o)
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
const Ld = 25 ** 7, ls = Math.PI, Cd = 180 / ls, na = ls / 180;
function Rd(e) {
  const t = e * e;
  return t * t * t * e;
}
function e2(e, t, { kL: r = 1, kC: n = 1, kH: o = 1 } = {}) {
  [e, t] = It([e, t]);
  let [a, i, s] = Jr.from(e), l = h0.from(Jr, [a, i, s])[1], [c, u, d] = Jr.from(t), p = h0.from(Jr, [c, u, d])[1];
  l < 0 && (l = 0), p < 0 && (p = 0);
  let m = (l + p) / 2, y = Rd(m), L = 0.5 * (1 - Math.sqrt(y / (y + Ld))), x = (1 + L) * i, O = (1 + L) * u, Y = Math.sqrt(x ** 2 + s ** 2), R = Math.sqrt(O ** 2 + d ** 2), z = x === 0 && s === 0 ? 0 : Math.atan2(s, x), j = O === 0 && d === 0 ? 0 : Math.atan2(d, O);
  z < 0 && (z += 2 * ls), j < 0 && (j += 2 * ls), z *= Cd, j *= Cd;
  let I = c - a, N = R - Y, ne = j - z, de = z + j, oe = Math.abs(ne), ge;
  Y * R === 0 ? ge = 0 : oe <= 180 ? ge = ne : ne > 180 ? ge = ne - 360 : ne < -180 ? ge = ne + 360 : en.warn("the unthinkable has happened");
  let te = 2 * Math.sqrt(R * Y) * Math.sin(ge * na / 2), Ie = (a + c) / 2, Ke = (Y + R) / 2, Ye = Rd(Ke), it;
  Y * R === 0 ? it = de : oe <= 180 ? it = de / 2 : de < 360 ? it = (de + 360) / 2 : it = (de - 360) / 2;
  let Xe = (Ie - 50) ** 2, Qe = 1 + 0.015 * Xe / Math.sqrt(20 + Xe), xt = 1 + 0.045 * Ke, nt = 1;
  nt -= 0.17 * Math.cos((it - 30) * na), nt += 0.24 * Math.cos(2 * it * na), nt += 0.32 * Math.cos((3 * it + 6) * na), nt -= 0.2 * Math.cos((4 * it - 63) * na);
  let ut = 1 + 0.015 * Ke * nt, Pt = 30 * Math.exp(-1 * ((it - 275) / 25) ** 2), Pe = 2 * Math.sqrt(Ye / (Ye + Ld)), Ot = -1 * Math.sin(2 * Pt * na) * Pe, Q = (I / (r * Qe)) ** 2;
  return Q += (N / (n * xt)) ** 2, Q += (te / (o * ut)) ** 2, Q += Ot * (N / (n * xt)) * (te / (o * ut)), Math.sqrt(Q);
}
const hg = [
  [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
  [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
  [0.0481771893596242, 0.2642395317527308, 0.6335478284694309]
], yg = [
  [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
  [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
  [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816]
], bg = [
  [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
  [1.9779985324311684, -2.42859224204858, 0.450593709617411],
  [0.0259040424655478, 0.7827717124575296, -0.8086757549230774]
], gg = [
  [1, 0.3963377773761749, 0.2158037573099136],
  [1, -0.1055613458156586, -0.0638541728258133],
  [1, -0.0894841775298119, -1.2914855480194092]
];
var ya = new at({
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
  base: Dr,
  fromBase(e) {
    let r = nr(hg, e).map((n) => Math.cbrt(n));
    return nr(bg, r);
  },
  toBase(e) {
    let r = nr(gg, e).map((n) => n ** 3);
    return nr(yg, r);
  },
  formats: {
    oklab: {
      coords: ["<percentage> | <number>", "<number> | <percentage>[-1,1]", "<number> | <percentage>[-1,1]"]
    }
  }
});
function vc(e, t) {
  [e, t] = It([e, t]);
  let [r, n, o] = ya.from(e), [a, i, s] = ya.from(t), l = r - a, c = n - i, u = o - s;
  return Math.sqrt(l ** 2 + c ** 2 + u ** 2);
}
const Ag = 75e-6;
function Oo(e, t, { epsilon: r = Ag } = {}) {
  e = It(e), t || (t = e.space), t = at.get(t);
  let n = e.coords;
  return t !== e.space && (n = t.from(e)), t.inGamut(n, { epsilon: r });
}
function ba(e) {
  return {
    space: e.space,
    coords: e.coords.slice(),
    alpha: e.alpha
  };
}
function t2(e, t, r = "lab") {
  r = at.get(r);
  let n = r.from(e), o = r.from(t);
  return Math.sqrt(n.reduce((a, i, s) => {
    let l = o[s];
    return isNaN(i) || isNaN(l) ? a : a + (l - i) ** 2;
  }, 0));
}
function vg(e, t) {
  return t2(e, t, "lab");
}
const _g = Math.PI, Id = _g / 180;
function wg(e, t, { l: r = 2, c: n = 1 } = {}) {
  [e, t] = It([e, t]);
  let [o, a, i] = Jr.from(e), [, s, l] = h0.from(Jr, [o, a, i]), [c, u, d] = Jr.from(t), p = h0.from(Jr, [c, u, d])[1];
  s < 0 && (s = 0), p < 0 && (p = 0);
  let m = o - c, y = s - p, L = a - u, x = i - d, O = L ** 2 + x ** 2 - y ** 2, Y = 0.511;
  o >= 16 && (Y = 0.040975 * o / (1 + 0.01765 * o));
  let R = 0.0638 * s / (1 + 0.0131 * s) + 0.638, z;
  Number.isNaN(l) && (l = 0), l >= 164 && l <= 345 ? z = 0.56 + Math.abs(0.2 * Math.cos((l + 168) * Id)) : z = 0.36 + Math.abs(0.4 * Math.cos((l + 35) * Id));
  let j = Math.pow(s, 4), I = Math.sqrt(j / (j + 1900)), N = R * (I * z + 1 - I), ne = (m / (r * Y)) ** 2;
  return ne += (y / (n * R)) ** 2, ne += O / N ** 2, Math.sqrt(ne);
}
const Nd = 203;
var Wc = new at({
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
  base: Dr,
  fromBase(e) {
    return e.map((t) => Math.max(t * Nd, 0));
  },
  toBase(e) {
    return e.map((t) => Math.max(t / Nd, 0));
  }
});
const Mi = 1.15, Li = 0.66, Od = 2610 / 2 ** 14, xg = 2 ** 14 / 2610, Pd = 3424 / 2 ** 12, Dd = 2413 / 2 ** 7, Bd = 2392 / 2 ** 7, Eg = 1.7 * 2523 / 2 ** 5, Gd = 2 ** 5 / (1.7 * 2523), Ci = -0.56, Zl = 16295499532821565e-27, Sg = [
  [0.41478972, 0.579999, 0.014648],
  [-0.20151, 1.120649, 0.0531008],
  [-0.0166008, 0.2648, 0.6684799]
], kg = [
  [1.9242264357876067, -1.0047923125953657, 0.037651404030618],
  [0.35031676209499907, 0.7264811939316552, -0.06538442294808501],
  [-0.09098281098284752, -0.3127282905230739, 1.5227665613052603]
], Tg = [
  [0.5, 0.5, 0],
  [3.524, -4.066708, 0.542708],
  [0.199076, 1.096799, -1.295875]
], Mg = [
  [1, 0.1386050432715393, 0.05804731615611886],
  [0.9999999999999999, -0.1386050432715393, -0.05804731615611886],
  [0.9999999999999998, -0.09601924202631895, -0.8118918960560388]
];
var r2 = new at({
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
  base: Wc,
  fromBase(e) {
    let [t, r, n] = e, o = Mi * t - (Mi - 1) * n, a = Li * r - (Li - 1) * t, s = nr(Sg, [o, a, n]).map(function(p) {
      let m = Pd + Dd * (p / 1e4) ** Od, y = 1 + Bd * (p / 1e4) ** Od;
      return (m / y) ** Eg;
    }), [l, c, u] = nr(Tg, s);
    return [(1 + Ci) * l / (1 + Ci * l) - Zl, c, u];
  },
  toBase(e) {
    let [t, r, n] = e, o = (t + Zl) / (1 + Ci - Ci * (t + Zl)), i = nr(Mg, [o, r, n]).map(function(p) {
      let m = Pd - p ** Gd, y = Bd * p ** Gd - Dd;
      return 1e4 * (m / y) ** xg;
    }), [s, l, c] = nr(kg, i), u = (s + (Mi - 1) * c) / Mi, d = (l + (Li - 1) * u) / Li;
    return [u, d, c];
  },
  formats: {
    // https://drafts.csswg.org/css-color-hdr/#Jzazbz
    color: {
      coords: ["<number> | <percentage>", "<number> | <percentage>[-1,1]", "<number> | <percentage>[-1,1]"]
    }
  }
}), _c = new at({
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
  base: r2,
  fromBase(e) {
    let [t, r, n] = e, o;
    const a = 2e-4;
    return Math.abs(r) < a && Math.abs(n) < a ? o = NaN : o = Math.atan2(n, r) * 180 / Math.PI, [
      t,
      // Jz is still Jz
      Math.sqrt(r ** 2 + n ** 2),
      // Chroma
      Pn(o)
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
function Lg(e, t) {
  [e, t] = It([e, t]);
  let [r, n, o] = _c.from(e), [a, i, s] = _c.from(t), l = r - a, c = n - i;
  Number.isNaN(o) && Number.isNaN(s) ? (o = 0, s = 0) : Number.isNaN(o) ? o = s : Number.isNaN(s) && (s = o);
  let u = o - s, d = 2 * Math.sqrt(n * i) * Math.sin(u / 2 * (Math.PI / 180));
  return Math.sqrt(l ** 2 + c ** 2 + d ** 2);
}
const n2 = 3424 / 4096, o2 = 2413 / 128, a2 = 2392 / 128, Fd = 2610 / 16384, Cg = 2523 / 32, Rg = 16384 / 2610, $d = 32 / 2523, Ig = [
  [0.3592832590121217, 0.6976051147779502, -0.035891593232029],
  [-0.1920808463704993, 1.100476797037432, 0.0753748658519118],
  [0.0070797844607479, 0.0748396662186362, 0.8433265453898765]
], Ng = [
  [2048 / 4096, 2048 / 4096, 0],
  [6610 / 4096, -13613 / 4096, 7003 / 4096],
  [17933 / 4096, -17390 / 4096, -543 / 4096]
], Og = [
  [0.9999999999999998, 0.0086090370379328, 0.111029625003026],
  [0.9999999999999998, -0.0086090370379328, -0.1110296250030259],
  [0.9999999999999998, 0.5600313357106791, -0.3206271749873188]
], Pg = [
  [2.0701522183894223, -1.3263473389671563, 0.2066510476294053],
  [0.3647385209748072, 0.6805660249472273, -0.0453045459220347],
  [-0.0497472075358123, -0.0492609666966131, 1.1880659249923042]
];
var wc = new at({
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
  base: Wc,
  fromBase(e) {
    let t = nr(Ig, e);
    return Dg(t);
  },
  toBase(e) {
    let t = Bg(e);
    return nr(Pg, t);
  }
});
function Dg(e) {
  let t = e.map(function(r) {
    let n = n2 + o2 * (r / 1e4) ** Fd, o = 1 + a2 * (r / 1e4) ** Fd;
    return (n / o) ** Cg;
  });
  return nr(Ng, t);
}
function Bg(e) {
  return nr(Og, e).map(function(n) {
    let o = Math.max(n ** $d - n2, 0), a = o2 - a2 * n ** $d;
    return 1e4 * (o / a) ** Rg;
  });
}
function Gg(e, t) {
  [e, t] = It([e, t]);
  let [r, n, o] = wc.from(e), [a, i, s] = wc.from(t);
  return 720 * Math.sqrt((r - a) ** 2 + 0.25 * (n - i) ** 2 + (o - s) ** 2);
}
const Fg = qr.D65, i2 = 0.42, zd = 1 / i2, Kl = 2 * Math.PI, s2 = [
  [0.401288, 0.650173, -0.051461],
  [-0.250268, 1.204414, 0.045854],
  [-2079e-6, 0.048952, 0.953127]
], $g = [
  [1.8620678550872327, -1.0112546305316843, 0.14918677544445175],
  [0.38752654323613717, 0.6214474419314753, -0.008973985167612518],
  [-0.015841498849333856, -0.03412293802851557, 1.0499644368778496]
], zg = [
  [460, 451, 288],
  [460, -891, -261],
  [460, -220, -6300]
], jg = {
  dark: [0.8, 0.525, 0.8],
  dim: [0.9, 0.59, 0.9],
  average: [1, 0.69, 1]
}, Co = {
  // Red, Yellow, Green, Blue, Red
  h: [20.14, 90, 164.25, 237.53, 380.14],
  e: [0.8, 0.7, 1, 1.2, 0.8],
  H: [0, 100, 200, 300, 400]
}, qg = 180 / Math.PI, jd = Math.PI / 180;
function l2(e, t) {
  return e.map((n) => {
    const o = In(t * Math.abs(n) * 0.01, i2);
    return 400 * gs(o, n) / (o + 27.13);
  });
}
function Hg(e, t) {
  const r = 100 / t * 27.13 ** zd;
  return e.map((n) => {
    const o = Math.abs(n);
    return gs(r * In(o / (400 - o), zd), n);
  });
}
function Ug(e) {
  let t = Pn(e);
  t <= Co.h[0] && (t += 360);
  const r = Qp(Co.h, t) - 1, [n, o] = Co.h.slice(r, r + 2), [a, i] = Co.e.slice(r, r + 2), s = Co.H[r], l = (t - n) / a;
  return s + 100 * l / (l + (o - t) / i);
}
function Vg(e) {
  let t = (e % 400 + 400) % 400;
  const r = Math.floor(0.01 * t);
  t = t % 100;
  const [n, o] = Co.h.slice(r, r + 2), [a, i] = Co.e.slice(r, r + 2);
  return Pn(
    (t * (i * n - a * o) - 100 * n * i) / (t * (i - a) - 100 * i)
  );
}
function c2(e, t, r, n, o) {
  const a = {};
  a.discounting = o, a.refWhite = e, a.surround = n;
  const i = e.map((L) => L * 100);
  a.la = t, a.yb = r;
  const s = i[1], l = nr(s2, i);
  n = jg[a.surround];
  const c = n[0];
  a.c = n[1], a.nc = n[2];
  const d = (1 / (5 * a.la + 1)) ** 4;
  a.fl = d * a.la + 0.1 * (1 - d) * (1 - d) * Math.cbrt(5 * a.la), a.flRoot = a.fl ** 0.25, a.n = a.yb / s, a.z = 1.48 + Math.sqrt(a.n), a.nbb = 0.725 * a.n ** -0.2, a.ncb = a.nbb;
  const p = Math.max(
    Math.min(c * (1 - 1 / 3.6 * Math.exp((-a.la - 42) / 92)), 1),
    0
  );
  a.dRgb = l.map((L) => m0(1, s / L, p)), a.dRgbInv = a.dRgb.map((L) => 1 / L);
  const m = l.map((L, x) => L * a.dRgb[x]), y = l2(m, a.fl);
  return a.aW = a.nbb * (2 * y[0] + y[1] + 0.05 * y[2]), a;
}
const qd = c2(
  Fg,
  64 / Math.PI * 0.2,
  20,
  "average",
  !1
);
function xc(e, t) {
  if (!(e.J !== void 0 ^ e.Q !== void 0))
    throw new Error("Conversion requires one and only one: 'J' or 'Q'");
  if (!(e.C !== void 0 ^ e.M !== void 0 ^ e.s !== void 0))
    throw new Error("Conversion requires one and only one: 'C', 'M' or 's'");
  if (!(e.h !== void 0 ^ e.H !== void 0))
    throw new Error("Conversion requires one and only one: 'h' or 'H'");
  if (e.J === 0 || e.Q === 0)
    return [0, 0, 0];
  let r = 0;
  e.h !== void 0 ? r = Pn(e.h) * jd : r = Vg(e.H) * jd;
  const n = Math.cos(r), o = Math.sin(r);
  let a = 0;
  e.J !== void 0 ? a = In(e.J, 1 / 2) * 0.1 : e.Q !== void 0 && (a = 0.25 * t.c * e.Q / ((t.aW + 4) * t.flRoot));
  let i = 0;
  e.C !== void 0 ? i = e.C / a : e.M !== void 0 ? i = e.M / t.flRoot / a : e.s !== void 0 && (i = 4e-4 * e.s ** 2 * (t.aW + 4) / t.c);
  const s = In(
    i * Math.pow(1.64 - Math.pow(0.29, t.n), -0.73),
    10 / 9
  ), l = 0.25 * (Math.cos(r + 2) + 3.8), c = t.aW * In(a, 2 / t.c / t.z), u = 5e4 / 13 * t.nc * t.ncb * l, d = c / t.nbb, p = 23 * (d + 0.305) * Uc(s, 23 * u + s * (11 * n + 108 * o)), m = p * n, y = p * o, L = Hg(
    nr(zg, [d, m, y]).map((x) => x * 1 / 1403),
    t.fl
  );
  return nr(
    $g,
    L.map((x, O) => x * t.dRgbInv[O])
  ).map((x) => x / 100);
}
function f2(e, t) {
  const r = e.map((R) => R * 100), n = l2(
    nr(s2, r).map((R, z) => R * t.dRgb[z]),
    t.fl
  ), o = n[0] + (-12 * n[1] + n[2]) / 11, a = (n[0] + n[1] - 2 * n[2]) / 9, i = (Math.atan2(a, o) % Kl + Kl) % Kl, s = 0.25 * (Math.cos(i + 2) + 3.8), l = 5e4 / 13 * t.nc * t.ncb * Uc(
    s * Math.sqrt(o ** 2 + a ** 2),
    n[0] + n[1] + 1.05 * n[2] + 0.305
  ), c = In(l, 0.9) * Math.pow(1.64 - Math.pow(0.29, t.n), 0.73), u = t.nbb * (2 * n[0] + n[1] + 0.05 * n[2]), d = In(u / t.aW, 0.5 * t.c * t.z), p = 100 * In(d, 2), m = 4 / t.c * d * (t.aW + 4) * t.flRoot, y = c * d, L = y * t.flRoot, x = Pn(i * qg), O = Ug(x), Y = 50 * In(t.c * c / (t.aW + 4), 1 / 2);
  return { J: p, C: y, h: x, s: Y, Q: m, M: L, H: O };
}
var Xg = new at({
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
  base: Dr,
  fromBase(e) {
    const t = f2(e, qd);
    return [t.J, t.M, t.h];
  },
  toBase(e) {
    return xc(
      { J: e[0], M: e[1], h: e[2] },
      qd
    );
  }
});
const Wg = qr.D65, Yg = 216 / 24389, u2 = 24389 / 27;
function Zg(e) {
  return 116 * (e > Yg ? Math.cbrt(e) : (u2 * e + 16) / 116) - 16;
}
function Ec(e) {
  return e > 8 ? Math.pow((e + 16) / 116, 3) : e / u2;
}
function Kg(e, t) {
  let [r, n, o] = e, a = [], i = 0;
  if (o === 0)
    return [0, 0, 0];
  let s = Ec(o);
  o > 0 ? i = 0.00379058511492914 * o ** 2 + 0.608983189401032 * o + 0.9155088574762233 : i = 9514440756550361e-21 * o ** 2 + 0.08693057439788597 * o - 21.928975842194614;
  const l = 2e-12, c = 15;
  let u = 0, d = 1 / 0;
  for (; u <= c; ) {
    a = xc({ J: i, C: n, h: r }, t);
    const p = Math.abs(a[1] - s);
    if (p < d) {
      if (p <= l)
        return a;
      d = p;
    }
    i = i - (a[1] - s) * i / (2 * a[1]), u += 1;
  }
  return xc({ J: i, C: n, h: r }, t);
}
function Qg(e, t) {
  const r = Zg(e[1]);
  if (r === 0)
    return [0, 0, 0];
  const n = f2(e, Yc);
  return [Pn(n.h), n.C, r];
}
const Yc = c2(
  Wg,
  200 / Math.PI * Ec(50),
  Ec(50) * 100,
  "average",
  !1
);
var y0 = new at({
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
  base: Dr,
  fromBase(e) {
    return Qg(e);
  },
  toBase(e) {
    return Kg(e, Yc);
  },
  formats: {
    color: {
      id: "--hct",
      coords: ["<number> | <angle>", "<percentage> | <number>", "<percentage> | <number>"]
    }
  }
});
const Jg = Math.PI / 180, Hd = [1, 7e-3, 0.0228];
function Ud(e) {
  e[1] < 0 && (e = y0.fromBase(y0.toBase(e)));
  const t = Math.log(Math.max(1 + Hd[2] * e[1] * Yc.flRoot, 1)) / Hd[2], r = e[0] * Jg, n = t * Math.cos(r), o = t * Math.sin(r);
  return [e[2], n, o];
}
function e4(e, t) {
  [e, t] = It([e, t]);
  let [r, n, o] = Ud(y0.from(e)), [a, i, s] = Ud(y0.from(t));
  return Math.sqrt((r - a) ** 2 + (n - i) ** 2 + (o - s) ** 2);
}
var ga = {
  deltaE76: vg,
  deltaECMC: wg,
  deltaE2000: e2,
  deltaEJz: Lg,
  deltaEITP: Gg,
  deltaEOK: vc,
  deltaEHCT: e4
};
function t4(e) {
  const t = e ? Math.floor(Math.log10(Math.abs(e))) : 0;
  return Math.max(parseFloat(`1e${t - 2}`), 1e-6);
}
const Vd = {
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
function uo(e, {
  method: t = en.gamut_mapping,
  space: r = void 0,
  deltaEMethod: n = "",
  jnd: o = 2,
  blackWhiteClamp: a = {}
} = {}) {
  if (e = It(e), L0(arguments[1]) ? r = arguments[1] : r || (r = e.space), r = at.get(r), Oo(e, r, { epsilon: 0 }))
    return e;
  let i;
  if (t === "css")
    i = r4(e, { space: r });
  else {
    if (t !== "clip" && !Oo(e, r)) {
      Object.prototype.hasOwnProperty.call(Vd, t) && ({ method: t, jnd: o, deltaEMethod: n, blackWhiteClamp: a } = Vd[t]);
      let s = e2;
      if (n !== "") {
        for (let c in ga)
          if ("deltae" + n.toLowerCase() === c.toLowerCase()) {
            s = ga[c];
            break;
          }
      }
      let l = uo(rr(e, r), { method: "clip", space: r });
      if (s(e, l) > o) {
        if (Object.keys(a).length === 3) {
          let Y = at.resolveCoord(a.channel), R = Qr(rr(e, Y.space), Y.id);
          if (co(R) && (R = 0), R >= a.max)
            return rr({ space: "xyz-d65", coords: qr.D65 }, e.space);
          if (R <= a.min)
            return rr({ space: "xyz-d65", coords: [0, 0, 0] }, e.space);
        }
        let c = at.resolveCoord(t), u = c.space, d = c.id, p = rr(e, u);
        p.coords.forEach((Y, R) => {
          co(Y) && (p.coords[R] = 0);
        });
        let y = (c.range || c.refRange)[0], L = t4(o), x = y, O = Qr(p, d);
        for (; O - x > L; ) {
          let Y = ba(p);
          Y = uo(Y, { space: r, method: "clip" }), s(p, Y) - o < L ? x = Qr(p, d) : O = Qr(p, d), Zn(p, d, (x + O) / 2);
        }
        i = rr(p, r);
      } else
        i = l;
    } else
      i = rr(e, r);
    if (t === "clip" || !Oo(i, r, { epsilon: 0 })) {
      let s = Object.values(r.coords).map((l) => l.range || []);
      i.coords = i.coords.map((l, c) => {
        let [u, d] = s[c];
        return u !== void 0 && (l = Math.max(u, l)), d !== void 0 && (l = Math.min(l, d)), l;
      });
    }
  }
  return r !== e.space && (i = rr(i, e.space)), e.coords = i.coords, e;
}
uo.returns = "color";
const Xd = {
  WHITE: { space: ya, coords: [1, 0, 0] },
  BLACK: { space: ya, coords: [0, 0, 0] }
};
function r4(e, { space: t } = {}) {
  e = It(e), t || (t = e.space), t = at.get(t);
  const o = at.get("oklch");
  if (t.isUnbounded)
    return rr(e, t);
  const a = rr(e, o);
  let i = a.coords[0];
  if (i >= 1) {
    const y = rr(Xd.WHITE, t);
    return y.alpha = e.alpha, rr(y, t);
  }
  if (i <= 0) {
    const y = rr(Xd.BLACK, t);
    return y.alpha = e.alpha, rr(y, t);
  }
  if (Oo(a, t, { epsilon: 0 }))
    return rr(a, t);
  function s(y) {
    const L = rr(y, t), x = Object.values(t.coords);
    return L.coords = L.coords.map((O, Y) => {
      if ("range" in x[Y]) {
        const [R, z] = x[Y].range;
        return Kp(R, O, z);
      }
      return O;
    }), L;
  }
  let l = 0, c = a.coords[1], u = !0, d = ba(a), p = s(d), m = vc(p, d);
  if (m < 0.02)
    return p;
  for (; c - l > 1e-4; ) {
    const y = (l + c) / 2;
    if (d.coords[1] = y, u && Oo(d, t, { epsilon: 0 }))
      l = y;
    else if (p = s(d), m = vc(p, d), m < 0.02) {
      if (0.02 - m < 1e-4)
        break;
      u = !1, l = y;
    } else
      c = y;
  }
  return p;
}
function rr(e, t, { inGamut: r } = {}) {
  e = It(e), t = at.get(t);
  let n = t.from(e), o = { space: t, coords: n, alpha: e.alpha };
  return r && (o = uo(o, r === !0 ? void 0 : r)), o;
}
rr.returns = "color";
function l0(e, {
  precision: t = en.precision,
  format: r = "default",
  inGamut: n = !0,
  ...o
} = {}) {
  var l;
  let a;
  e = It(e);
  let i = r;
  r = e.space.getFormat(r) ?? e.space.getFormat("default") ?? at.DEFAULT_FORMAT;
  let s = e.coords.slice();
  if (n || (n = r.toGamut), n && !Oo(e) && (s = uo(ba(e), n === !0 ? void 0 : n).coords), r.type === "custom")
    if (o.precision = t, r.serialize)
      a = r.serialize(s, e.alpha, o);
    else
      throw new TypeError(`format ${i} can only be used to parse colors, not for serialization`);
  else {
    let c = r.name || "color";
    r.serializeCoords ? s = r.serializeCoords(s, t) : t !== null && (s = s.map((m) => is(m, { precision: t })));
    let u = [...s];
    if (c === "color") {
      let m = r.id || ((l = r.ids) == null ? void 0 : l[0]) || e.space.id;
      u.unshift(m);
    }
    let d = e.alpha;
    t !== null && (d = is(d, { precision: t }));
    let p = e.alpha >= 1 || r.noAlpha ? "" : `${r.commas ? "," : " /"} ${d}`;
    a = `${c}(${u.join(r.commas ? ", " : " ")}${p})`;
  }
  return a;
}
const n4 = [
  [0.6369580483012914, 0.14461690358620832, 0.1688809751641721],
  [0.2627002120112671, 0.6779980715188708, 0.05930171646986196],
  [0, 0.028072693049087428, 1.060985057710791]
], o4 = [
  [1.716651187971268, -0.355670783776392, -0.25336628137366],
  [-0.666684351832489, 1.616481236634939, 0.0157685458139111],
  [0.017639857445311, -0.042770613257809, 0.942103121235474]
];
var As = new Yr({
  id: "rec2020-linear",
  cssId: "--rec2020-linear",
  name: "Linear REC.2020",
  white: "D65",
  toXYZ_M: n4,
  fromXYZ_M: o4
});
const Ri = 1.09929682680944, Wd = 0.018053968510807;
var d2 = new Yr({
  id: "rec2020",
  name: "REC.2020",
  base: As,
  // Non-linear transfer function from Rec. ITU-R BT.2020-2 table 4
  toBase(e) {
    return e.map(function(t) {
      return t < Wd * 4.5 ? t / 4.5 : Math.pow((t + Ri - 1) / Ri, 1 / 0.45);
    });
  },
  fromBase(e) {
    return e.map(function(t) {
      return t >= Wd ? Ri * Math.pow(t, 0.45) - (Ri - 1) : 4.5 * t;
    });
  }
});
const a4 = [
  [0.4865709486482162, 0.26566769316909306, 0.1982172852343625],
  [0.2289745640697488, 0.6917385218365064, 0.079286914093745],
  [0, 0.04511338185890264, 1.043944368900976]
], i4 = [
  [2.493496911941425, -0.9313836179191239, -0.40271078445071684],
  [-0.8294889695615747, 1.7626640603183463, 0.023624685841943577],
  [0.03584583024378447, -0.07617238926804182, 0.9568845240076872]
];
var p2 = new Yr({
  id: "p3-linear",
  cssId: "--display-p3-linear",
  name: "Linear P3",
  white: "D65",
  toXYZ_M: a4,
  fromXYZ_M: i4
});
const s4 = [
  [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
  [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
  [0.01933081871559182, 0.11919477979462598, 0.9505321522496607]
], kr = [
  [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
  [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
  [0.05563007969699366, -0.20397695888897652, 1.0569715142428786]
];
var m2 = new Yr({
  id: "srgb-linear",
  name: "Linear sRGB",
  white: "D65",
  toXYZ_M: s4,
  fromXYZ_M: kr
}), Yd = {
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
let Zd = Array(3).fill("<percentage> | <number>[0, 255]"), Kd = Array(3).fill("<number>[0, 255]");
var Aa = new Yr({
  id: "srgb",
  name: "sRGB",
  base: m2,
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
      coords: Zd
    },
    rgb_number: {
      name: "rgb",
      commas: !0,
      coords: Kd,
      noAlpha: !0
    },
    color: {
      /* use defaults */
    },
    rgba: {
      coords: Zd,
      commas: !0,
      lastAlpha: !0
    },
    rgba_number: {
      name: "rgba",
      commas: !0,
      coords: Kd
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
        if (e === "transparent" ? (t.coords = Yd.black, t.alpha = 0) : t.coords = Yd[e], t.coords)
          return t;
      }
    }
  }
}), h2 = new Yr({
  id: "p3",
  cssId: "display-p3",
  name: "P3",
  base: p2,
  // Gamma encoding/decoding is the same as sRGB
  fromBase: Aa.fromBase,
  toBase: Aa.toBase
});
en.display_space = Aa;
let l4;
if (typeof CSS < "u" && CSS.supports)
  for (let e of [Jr, d2, h2]) {
    let t = e.getMinCoords(), n = l0({ space: e, coords: t, alpha: 1 });
    if (CSS.supports("color", n)) {
      en.display_space = e;
      break;
    }
  }
function c4(e, { space: t = en.display_space, ...r } = {}) {
  let n = l0(e, r);
  if (typeof CSS > "u" || CSS.supports("color", n) || !en.display_space)
    n = new String(n), n.color = e;
  else {
    let o = e;
    if ((e.coords.some(co) || co(e.alpha)) && !(l4 ?? (l4 = CSS.supports("color", "hsl(none 50% 50%)"))) && (o = ba(e), o.coords = o.coords.map(_r), o.alpha = _r(o.alpha), n = l0(o, r), CSS.supports("color", n)))
      return n = new String(n), n.color = o, n;
    o = rr(o, t), n = new String(l0(o, r)), n.color = o;
  }
  return n;
}
function f4(e, t) {
  return e = It(e), t = It(t), e.space === t.space && e.alpha === t.alpha && e.coords.every((r, n) => r === t.coords[n]);
}
function po(e) {
  return Qr(e, [Dr, "y"]);
}
function y2(e, t) {
  Zn(e, [Dr, "y"], t);
}
function u4(e) {
  Object.defineProperty(e.prototype, "luminance", {
    get() {
      return po(this);
    },
    set(t) {
      y2(this, t);
    }
  });
}
var d4 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  getLuminance: po,
  register: u4,
  setLuminance: y2
});
function p4(e, t) {
  e = It(e), t = It(t);
  let r = Math.max(po(e), 0), n = Math.max(po(t), 0);
  return n > r && ([r, n] = [n, r]), (r + 0.05) / (n + 0.05);
}
const m4 = 0.56, h4 = 0.57, y4 = 0.62, b4 = 0.65, Qd = 0.022, g4 = 1.414, A4 = 0.1, v4 = 5e-4, _4 = 1.14, Jd = 0.027, w4 = 1.14;
function e1(e) {
  return e >= Qd ? e : e + (Qd - e) ** g4;
}
function oa(e) {
  let t = e < 0 ? -1 : 1, r = Math.abs(e);
  return t * Math.pow(r, 2.4);
}
function x4(e, t) {
  t = It(t), e = It(e);
  let r, n, o, a, i, s;
  t = rr(t, "srgb"), [a, i, s] = t.coords;
  let l = oa(a) * 0.2126729 + oa(i) * 0.7151522 + oa(s) * 0.072175;
  e = rr(e, "srgb"), [a, i, s] = e.coords;
  let c = oa(a) * 0.2126729 + oa(i) * 0.7151522 + oa(s) * 0.072175, u = e1(l), d = e1(c), p = d > u;
  return Math.abs(d - u) < v4 ? n = 0 : p ? (r = d ** m4 - u ** h4, n = r * _4) : (r = d ** b4 - u ** y4, n = r * w4), Math.abs(n) < A4 ? o = 0 : n > 0 ? o = n - Jd : o = n + Jd, o * 100;
}
function E4(e, t) {
  e = It(e), t = It(t);
  let r = Math.max(po(e), 0), n = Math.max(po(t), 0);
  n > r && ([r, n] = [n, r]);
  let o = r + n;
  return o === 0 ? 0 : (r - n) / o;
}
const S4 = 5e4;
function k4(e, t) {
  e = It(e), t = It(t);
  let r = Math.max(po(e), 0), n = Math.max(po(t), 0);
  return n > r && ([r, n] = [n, r]), n === 0 ? S4 : (r - n) / n;
}
function T4(e, t) {
  e = It(e), t = It(t);
  let r = Qr(e, [Jr, "l"]), n = Qr(t, [Jr, "l"]);
  return Math.abs(r - n);
}
const M4 = 216 / 24389, t1 = 24 / 116, Ii = 24389 / 27;
let Ql = qr.D65;
var Sc = new at({
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
  white: Ql,
  base: Dr,
  // Convert D65-adapted XYZ to Lab
  //  CIE 15.3:2004 section 8.2.1.1
  fromBase(e) {
    let r = e.map((n, o) => n / Ql[o]).map((n) => n > M4 ? Math.cbrt(n) : (Ii * n + 16) / 116);
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
      t[0] > t1 ? Math.pow(t[0], 3) : (116 * t[0] - 16) / Ii,
      e[0] > 8 ? Math.pow((e[0] + 16) / 116, 3) : e[0] / Ii,
      t[2] > t1 ? Math.pow(t[2], 3) : (116 * t[2] - 16) / Ii
    ].map((n, o) => n * Ql[o]);
  },
  formats: {
    "lab-d65": {
      coords: ["<number> | <percentage>", "<number> | <percentage>[-1,1]", "<number> | <percentage>[-1,1]"]
    }
  }
});
const Jl = Math.pow(5, 0.5) * 0.5 + 0.5;
function L4(e, t) {
  e = It(e), t = It(t);
  let r = Qr(e, [Sc, "l"]), n = Qr(t, [Sc, "l"]), o = Math.abs(Math.pow(r, Jl) - Math.pow(n, Jl)), a = Math.pow(o, 1 / Jl) * Math.SQRT2 - 40;
  return a < 7.5 ? 0 : a;
}
var Wi = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  contrastAPCA: x4,
  contrastDeltaPhi: L4,
  contrastLstar: T4,
  contrastMichelson: E4,
  contrastWCAG21: p4,
  contrastWeber: k4
});
function C4(e, t, r = {}) {
  L0(r) && (r = { algorithm: r });
  let { algorithm: n, ...o } = r;
  if (!n) {
    let a = Object.keys(Wi).map((i) => i.replace(/^contrast/, "")).join(", ");
    throw new TypeError(`contrast() function needs a contrast algorithm. Please specify one of: ${a}`);
  }
  e = It(e), t = It(t);
  for (let a in Wi)
    if ("contrast" + n.toLowerCase() === a.toLowerCase())
      return Wi[a](e, t, o);
  throw new TypeError(`Unknown contrast algorithm: ${n}`);
}
function vs(e) {
  let [t, r, n] = C0(e, Dr), o = t + 15 * r + 3 * n;
  return [4 * t / o, 9 * r / o];
}
function b2(e) {
  let [t, r, n] = C0(e, Dr), o = t + r + n;
  return [t / o, r / o];
}
function R4(e) {
  Object.defineProperty(e.prototype, "uv", {
    get() {
      return vs(this);
    }
  }), Object.defineProperty(e.prototype, "xy", {
    get() {
      return b2(this);
    }
  });
}
var I4 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  register: R4,
  uv: vs,
  xy: b2
});
function o0(e, t, r = {}) {
  L0(r) && (r = { method: r });
  let { method: n = en.deltaE, ...o } = r;
  for (let a in ga)
    if ("deltae" + n.toLowerCase() === a.toLowerCase())
      return ga[a](e, t, o);
  throw new TypeError(`Unknown deltaE method: ${n}`);
}
function N4(e, t = 0.25) {
  let n = [at.get("oklch", "lch"), "l"];
  return Zn(e, n, (o) => o * (1 + t));
}
function O4(e, t = 0.25) {
  let n = [at.get("oklch", "lch"), "l"];
  return Zn(e, n, (o) => o * (1 - t));
}
var P4 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  darken: O4,
  lighten: N4
});
function g2(e, t, r = 0.5, n = {}) {
  return [e, t] = [It(e), It(t)], lo(r) === "object" && ([r, n] = [0.5, r]), R0(e, t, n)(r);
}
function A2(e, t, r = {}) {
  let n;
  Zc(e) && ([n, r] = [e, t], [e, t] = n.rangeArgs.colors);
  let {
    maxDeltaE: o,
    deltaEMethod: a,
    steps: i = 2,
    maxSteps: s = 1e3,
    ...l
  } = r;
  n || ([e, t] = [It(e), It(t)], n = R0(e, t, l));
  let c = o0(e, t), u = o > 0 ? Math.max(i, Math.ceil(c / o) + 1) : i, d = [];
  if (s !== void 0 && (u = Math.min(u, s)), u === 1)
    d = [{ p: 0.5, color: n(0.5) }];
  else {
    let p = 1 / (u - 1);
    d = Array.from({ length: u }, (m, y) => {
      let L = y * p;
      return { p: L, color: n(L) };
    });
  }
  if (o > 0) {
    let p = d.reduce((m, y, L) => {
      if (L === 0)
        return 0;
      let x = o0(y.color, d[L - 1].color, a);
      return Math.max(m, x);
    }, 0);
    for (; p > o; ) {
      p = 0;
      for (let m = 1; m < d.length && d.length < s; m++) {
        let y = d[m - 1], L = d[m], x = (L.p + y.p) / 2, O = n(x);
        p = Math.max(p, o0(O, y.color), o0(O, L.color)), d.splice(m, 0, { p: x, color: n(x) }), m++;
      }
    }
  }
  return d = d.map((p) => p.color), d;
}
function R0(e, t, r = {}) {
  if (Zc(e)) {
    let [l, c] = [e, t];
    return R0(...l.rangeArgs.colors, { ...l.rangeArgs.options, ...c });
  }
  let { space: n, outputSpace: o, progression: a, premultiplied: i } = r;
  e = It(e), t = It(t), e = ba(e), t = ba(t);
  let s = { colors: [e, t], options: r };
  if (n ? n = at.get(n) : n = at.registry[en.interpolationSpace] || e.space, o = o ? at.get(o) : n, e = rr(e, n), t = rr(t, n), e = uo(e), t = uo(t), n.coords.h && n.coords.h.type === "angle") {
    let l = r.hue = r.hue || "shorter", c = [n, "h"], [u, d] = [Qr(e, c), Qr(t, c)];
    isNaN(u) && !isNaN(d) ? u = d : isNaN(d) && !isNaN(u) && (d = u), [u, d] = mg(l, [u, d]), Zn(e, c, u), Zn(t, c, d);
  }
  return i && (e.coords = e.coords.map((l) => l * e.alpha), t.coords = t.coords.map((l) => l * t.alpha)), Object.assign((l) => {
    l = a ? a(l) : l;
    let c = e.coords.map((p, m) => {
      let y = t.coords[m];
      return m0(p, y, l);
    }), u = m0(e.alpha, t.alpha, l), d = { space: n, coords: c, alpha: u };
    return i && (d.coords = d.coords.map((p) => p / u)), o !== n && (d = rr(d, o)), d;
  }, {
    rangeArgs: s
  });
}
function Zc(e) {
  return lo(e) === "function" && !!e.rangeArgs;
}
en.interpolationSpace = "lab";
function D4(e) {
  e.defineFunction("mix", g2, { returns: "color" }), e.defineFunction("range", R0, { returns: "function<color>" }), e.defineFunction("steps", A2, { returns: "array<color>" });
}
var B4 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  isRange: Zc,
  mix: g2,
  range: R0,
  register: D4,
  steps: A2
}), v2 = new at({
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
  base: Aa,
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
}), _2 = new at({
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
  base: v2,
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
}), G4 = new at({
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
  base: _2,
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
const F4 = [
  [0.5766690429101305, 0.1855582379065463, 0.1882286462349947],
  [0.29734497525053605, 0.6273635662554661, 0.07529145849399788],
  [0.02703136138641234, 0.07068885253582723, 0.9913375368376388]
], $4 = [
  [2.0415879038107465, -0.5650069742788596, -0.34473135077832956],
  [-0.9692436362808795, 1.8759675015077202, 0.04155505740717557],
  [0.013444280632031142, -0.11836239223101838, 1.0151749943912054]
];
var w2 = new Yr({
  id: "a98rgb-linear",
  cssId: "--a98-rgb-linear",
  name: "Linear Adobe® 98 RGB compatible",
  white: "D65",
  toXYZ_M: F4,
  fromXYZ_M: $4
}), z4 = new Yr({
  id: "a98rgb",
  cssId: "a98-rgb",
  name: "Adobe® 98 RGB compatible",
  base: w2,
  toBase: (e) => e.map((t) => Math.pow(Math.abs(t), 563 / 256) * Math.sign(t)),
  fromBase: (e) => e.map((t) => Math.pow(Math.abs(t), 256 / 563) * Math.sign(t))
});
const j4 = [
  [0.7977666449006423, 0.13518129740053308, 0.0313477341283922],
  [0.2880748288194013, 0.711835234241873, 8993693872564e-17],
  [0, 0, 0.8251046025104602]
], q4 = [
  [1.3457868816471583, -0.25557208737979464, -0.05110186497554526],
  [-0.5446307051249019, 1.5082477428451468, 0.02052744743642139],
  [0, 0, 1.2119675456389452]
];
var x2 = new Yr({
  id: "prophoto-linear",
  cssId: "--prophoto-rgb-linear",
  name: "Linear ProPhoto",
  white: "D50",
  base: Xc,
  toXYZ_M: j4,
  fromXYZ_M: q4
});
const H4 = 1 / 512, U4 = 16 / 512;
var V4 = new Yr({
  id: "prophoto",
  cssId: "prophoto-rgb",
  name: "ProPhoto",
  base: x2,
  toBase(e) {
    return e.map((t) => t < U4 ? t / 16 : t ** 1.8);
  },
  fromBase(e) {
    return e.map((t) => t >= H4 ? t ** (1 / 1.8) : 16 * t);
  }
}), X4 = new at({
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
  base: ya,
  fromBase(e) {
    let [t, r, n] = e, o;
    const a = 2e-4;
    return Math.abs(r) < a && Math.abs(n) < a ? o = NaN : o = Math.atan2(n, r) * 180 / Math.PI, [
      t,
      // OKLab L is still L
      Math.sqrt(r ** 2 + n ** 2),
      // Chroma
      Pn(o)
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
let E2 = qr.D65;
const W4 = 216 / 24389, r1 = 24389 / 27, [n1, o1] = vs({ space: Dr, coords: E2 });
var S2 = new at({
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
  white: E2,
  base: Dr,
  // Convert D65-adapted XYZ to Luv
  // https://en.wikipedia.org/wiki/CIELUV#The_forward_transformation
  fromBase(e) {
    let t = [_r(e[0]), _r(e[1]), _r(e[2])], r = t[1], [n, o] = vs({ space: Dr, coords: t });
    if (!Number.isFinite(n) || !Number.isFinite(o))
      return [0, 0, 0];
    let a = r <= W4 ? r1 * r : 116 * Math.cbrt(r) - 16;
    return [
      a,
      13 * a * (n - n1),
      13 * a * (o - o1)
    ];
  },
  // Convert Luv to D65-adapted XYZ
  // https://en.wikipedia.org/wiki/CIELUV#The_reverse_transformation
  toBase(e) {
    let [t, r, n] = e;
    if (t === 0 || co(t))
      return [0, 0, 0];
    r = _r(r), n = _r(n);
    let o = r / (13 * t) + n1, a = n / (13 * t) + o1, i = t <= 8 ? t / r1 : Math.pow((t + 16) / 116, 3);
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
}), Kc = new at({
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
  base: S2,
  fromBase(e) {
    let [t, r, n] = e, o;
    const a = 0.02;
    return Math.abs(r) < a && Math.abs(n) < a ? o = NaN : o = Math.atan2(n, r) * 180 / Math.PI, [
      t,
      // L is still L
      Math.sqrt(r ** 2 + n ** 2),
      // Chroma
      Pn(o)
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
const Y4 = 216 / 24389, Z4 = 24389 / 27, a1 = kr[0][0], i1 = kr[0][1], ec = kr[0][2], s1 = kr[1][0], l1 = kr[1][1], tc = kr[1][2], c1 = kr[2][0], f1 = kr[2][1], rc = kr[2][2];
function aa(e, t, r) {
  const n = t / (Math.sin(r) - e * Math.cos(r));
  return n < 0 ? 1 / 0 : n;
}
function cs(e) {
  const t = Math.pow(e + 16, 3) / 1560896, r = t > Y4 ? t : e / Z4, n = r * (284517 * a1 - 94839 * ec), o = r * (838422 * ec + 769860 * i1 + 731718 * a1), a = r * (632260 * ec - 126452 * i1), i = r * (284517 * s1 - 94839 * tc), s = r * (838422 * tc + 769860 * l1 + 731718 * s1), l = r * (632260 * tc - 126452 * l1), c = r * (284517 * c1 - 94839 * rc), u = r * (838422 * rc + 769860 * f1 + 731718 * c1), d = r * (632260 * rc - 126452 * f1);
  return {
    r0s: n / a,
    r0i: o * e / a,
    r1s: n / (a + 126452),
    r1i: (o - 769860) * e / (a + 126452),
    g0s: i / l,
    g0i: s * e / l,
    g1s: i / (l + 126452),
    g1i: (s - 769860) * e / (l + 126452),
    b0s: c / d,
    b0i: u * e / d,
    b1s: c / (d + 126452),
    b1i: (u - 769860) * e / (d + 126452)
  };
}
function u1(e, t) {
  const r = t / 360 * Math.PI * 2, n = aa(e.r0s, e.r0i, r), o = aa(e.r1s, e.r1i, r), a = aa(e.g0s, e.g0i, r), i = aa(e.g1s, e.g1i, r), s = aa(e.b0s, e.b0i, r), l = aa(e.b1s, e.b1i, r);
  return Math.min(n, o, a, i, s, l);
}
var K4 = new at({
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
  base: Kc,
  gamutSpace: Aa,
  // Convert LCHuv to HSLuv
  fromBase(e) {
    let [t, r, n] = [_r(e[0]), _r(e[1]), _r(e[2])], o;
    if (t > 99.9999999)
      o = 0, t = 100;
    else if (t < 1e-8)
      o = 0, t = 0;
    else {
      let a = cs(t), i = u1(a, n);
      o = r / i * 100;
    }
    return [n, o, t];
  },
  // Convert HSLuv to LCHuv
  toBase(e) {
    let [t, r, n] = [_r(e[0]), _r(e[1]), _r(e[2])], o;
    if (n > 99.9999999)
      n = 100, o = 0;
    else if (n < 1e-8)
      n = 0, o = 0;
    else {
      let a = cs(n);
      o = u1(a, t) / 100 * r;
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
kr[0][0];
kr[0][1];
kr[0][2];
kr[1][0];
kr[1][1];
kr[1][2];
kr[2][0];
kr[2][1];
kr[2][2];
function ia(e, t) {
  return Math.abs(t) / Math.sqrt(Math.pow(e, 2) + 1);
}
function d1(e) {
  let t = ia(e.r0s, e.r0i), r = ia(e.r1s, e.r1i), n = ia(e.g0s, e.g0i), o = ia(e.g1s, e.g1i), a = ia(e.b0s, e.b0i), i = ia(e.b1s, e.b1i);
  return Math.min(t, r, n, o, a, i);
}
var Q4 = new at({
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
  base: Kc,
  gamutSpace: "self",
  // Convert LCHuv to HPLuv
  fromBase(e) {
    let [t, r, n] = [_r(e[0]), _r(e[1]), _r(e[2])], o;
    if (t > 99.9999999)
      o = 0, t = 100;
    else if (t < 1e-8)
      o = 0, t = 0;
    else {
      let a = cs(t), i = d1(a);
      o = r / i * 100;
    }
    return [n, o, t];
  },
  // Convert HPLuv to LCHuv
  toBase(e) {
    let [t, r, n] = [_r(e[0]), _r(e[1]), _r(e[2])], o;
    if (n > 99.9999999)
      n = 100, o = 0;
    else if (n < 1e-8)
      n = 0, o = 0;
    else {
      let a = cs(n);
      o = d1(a) / 100 * r;
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
const p1 = 203, m1 = 2610 / 2 ** 14, J4 = 2 ** 14 / 2610, e8 = 2523 / 2 ** 5, h1 = 2 ** 5 / 2523, y1 = 3424 / 2 ** 12, b1 = 2413 / 2 ** 7, g1 = 2392 / 2 ** 7;
var t8 = new Yr({
  id: "rec2100pq",
  cssId: "rec2100-pq",
  name: "REC.2100-PQ",
  base: As,
  toBase(e) {
    return e.map(function(t) {
      return (Math.max(t ** h1 - y1, 0) / (b1 - g1 * t ** h1)) ** J4 * 1e4 / p1;
    });
  },
  fromBase(e) {
    return e.map(function(t) {
      let r = Math.max(t * p1 / 1e4, 0), n = y1 + b1 * r ** m1, o = 1 + g1 * r ** m1;
      return (n / o) ** e8;
    });
  }
});
const A1 = 0.17883277, v1 = 0.28466892, _1 = 0.55991073, nc = 3.7743;
var r8 = new Yr({
  id: "rec2100hlg",
  cssId: "rec2100-hlg",
  name: "REC.2100-HLG",
  referred: "scene",
  base: As,
  toBase(e) {
    return e.map(function(t) {
      return t <= 0.5 ? t ** 2 / 3 * nc : (Math.exp((t - _1) / A1) + v1) / 12 * nc;
    });
  },
  fromBase(e) {
    return e.map(function(t) {
      return t /= nc, t <= 1 / 12 ? Math.sqrt(3 * t) : A1 * Math.log(12 * t - v1) + _1;
    });
  }
});
const k2 = {};
fo.add("chromatic-adaptation-start", (e) => {
  e.options.method && (e.M = T2(e.W1, e.W2, e.options.method));
});
fo.add("chromatic-adaptation-end", (e) => {
  e.M || (e.M = T2(e.W1, e.W2, e.options.method));
});
function _s({ id: e, toCone_M: t, fromCone_M: r }) {
  k2[e] = arguments[0];
}
function T2(e, t, r = "Bradford") {
  let n = k2[r], [o, a, i] = nr(n.toCone_M, e), [s, l, c] = nr(n.toCone_M, t), u = [
    [s / o, 0, 0],
    [0, l / a, 0],
    [0, 0, c / i]
  ], d = nr(u, n.toCone_M);
  return nr(n.fromCone_M, d);
}
_s({
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
_s({
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
_s({
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
_s({
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
Object.assign(qr, {
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
qr.ACES = [0.32168 / 0.33767, 1, (1 - 0.32168 - 0.33767) / 0.33767];
const n8 = [
  [0.6624541811085053, 0.13400420645643313, 0.1561876870049078],
  [0.27222871678091454, 0.6740817658111484, 0.05368951740793705],
  [-0.005574649490394108, 0.004060733528982826, 1.0103391003129971]
], o8 = [
  [1.6410233796943257, -0.32480329418479, -0.23642469523761225],
  [-0.6636628587229829, 1.6153315916573379, 0.016756347685530137],
  [0.011721894328375376, -0.008284441996237409, 0.9883948585390215]
];
var M2 = new Yr({
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
  white: qr.ACES,
  toXYZ_M: n8,
  fromXYZ_M: o8
});
const Ni = 2 ** -16, oc = -0.35828683, Oi = (Math.log2(65504) + 9.72) / 17.52;
var a8 = new Yr({
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
      range: [oc, Oi],
      name: "Red"
    },
    g: {
      range: [oc, Oi],
      name: "Green"
    },
    b: {
      range: [oc, Oi],
      name: "Blue"
    }
  },
  referred: "scene",
  base: M2,
  // from section 4.4.2 Decoding Function
  toBase(e) {
    const t = -0.3013698630136986;
    return e.map(function(r) {
      return r <= t ? (2 ** (r * 17.52 - 9.72) - Ni) * 2 : r < Oi ? 2 ** (r * 17.52 - 9.72) : 65504;
    });
  },
  // Non-linear encoding function from S-2014-003, section 4.4.1 Encoding Function
  fromBase(e) {
    return e.map(function(t) {
      return t <= 0 ? (Math.log2(Ni) + 9.72) / 17.52 : t < Ni ? (Math.log2(Ni + t * 0.5) + 9.72) / 17.52 : (Math.log2(t) + 9.72) / 17.52;
    });
  }
  // encoded media white (rgb 1,1,1) => linear  [ 222.861, 222.861, 222.861 ]
  // encoded media black (rgb 0,0,0) => linear [ 0.0011857, 0.0011857, 0.0011857]
}), w1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  A98RGB: z4,
  A98RGB_Linear: w2,
  ACEScc: a8,
  ACEScg: M2,
  CAM16_JMh: Xg,
  HCT: y0,
  HPLuv: Q4,
  HSL: v2,
  HSLuv: K4,
  HSV: _2,
  HWB: G4,
  ICTCP: wc,
  JzCzHz: _c,
  Jzazbz: r2,
  LCH: h0,
  LCHuv: Kc,
  Lab: Jr,
  Lab_D65: Sc,
  Luv: S2,
  OKLCH: X4,
  OKLab: ya,
  P3: h2,
  P3_Linear: p2,
  ProPhoto: V4,
  ProPhoto_Linear: x2,
  REC_2020: d2,
  REC_2020_Linear: As,
  REC_2100_HLG: r8,
  REC_2100_PQ: t8,
  XYZ_ABS_D65: Wc,
  XYZ_D50: Xc,
  XYZ_D65: Dr,
  sRGB: Aa,
  sRGB_Linear: m2
});
class ft {
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
    t.length === 1 && (r = It(t[0]));
    let n, o, a;
    r ? (n = r.space || r.spaceId, o = r.coords, a = r.alpha) : [n, o, a] = t, Object.defineProperty(this, "space", {
      value: at.get(n),
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
    return new ft(this.space, this.coords, this.alpha);
  }
  toJSON() {
    return {
      spaceId: this.spaceId,
      coords: this.coords,
      alpha: this.alpha
    };
  }
  display(...t) {
    let r = c4(this, ...t);
    return r.color = new ft(r.color), r;
  }
  /**
   * Get a color from the argument passed
   * Basically gets us the same result as new Color(color) but doesn't clone an existing color object
   */
  static get(t, ...r) {
    return t instanceof ft ? t : new ft(t, ...r);
  }
  static defineFunction(t, r, n = r) {
    let { instance: o = !0, returns: a } = n, i = function(...s) {
      let l = r(...s);
      if (a === "color")
        l = ft.get(l);
      else if (a === "function<color>") {
        let c = l;
        l = function(...u) {
          let d = c(...u);
          return ft.get(d);
        }, Object.assign(l, c);
      } else a === "array<color>" && (l = l.map((c) => ft.get(c)));
      return l;
    };
    t in ft || (ft[t] = i), o && (ft.prototype[t] = function(...s) {
      return i(this, ...s);
    });
  }
  static defineFunctions(t) {
    for (let r in t)
      ft.defineFunction(r, t[r], t[r]);
  }
  static extend(t) {
    if (t.register)
      t.register(ft);
    else
      for (let r in t)
        ft.defineFunction(r, t[r]);
  }
}
ft.defineFunctions({
  get: Qr,
  getAll: C0,
  set: Zn,
  setAll: Vc,
  to: rr,
  equals: f4,
  inGamut: Oo,
  toGamut: uo,
  distance: t2,
  toString: l0
});
Object.assign(ft, {
  util: lg,
  hooks: fo,
  WHITES: qr,
  Space: at,
  spaces: at.registry,
  parse: Jp,
  // Global defaults one may want to configure
  defaults: en
});
for (let e of Object.keys(w1))
  at.register(w1[e]);
for (let e in at.registry)
  kc(e, at.registry[e]);
fo.add("colorspace-init-end", (e) => {
  var t;
  kc(e.id, e), (t = e.aliases) == null || t.forEach((r) => {
    kc(r, e);
  });
});
function kc(e, t) {
  let r = e.replace(/-/g, "_");
  Object.defineProperty(ft.prototype, r, {
    // Convert coords to coords in another colorspace and return them
    // Source colorspace: this.spaceId
    // Target colorspace: id
    get() {
      let n = this.getAll(e);
      return typeof Proxy > "u" ? n : new Proxy(n, {
        has: (o, a) => {
          try {
            return at.resolveCoord([t, a]), !0;
          } catch {
          }
          return Reflect.has(o, a);
        },
        get: (o, a, i) => {
          if (a && typeof a != "symbol" && !(a in o)) {
            let { index: s } = at.resolveCoord([t, a]);
            if (s >= 0)
              return o[s];
          }
          return Reflect.get(o, a, i);
        },
        set: (o, a, i, s) => {
          if (a && typeof a != "symbol" && !(a in o) || a >= 0) {
            let { index: l } = at.resolveCoord([t, a]);
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
ft.extend(ga);
ft.extend({ deltaE: o0 });
Object.assign(ft, { deltaEMethods: ga });
ft.extend(P4);
ft.extend({ contrast: C4 });
ft.extend(I4);
ft.extend(d4);
ft.extend(B4);
ft.extend(Wi);
const i8 = {
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
}, s8 = {
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
}, l8 = {
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
}, c8 = {
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
}, f8 = {
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
}, u8 = {
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
}, d8 = {
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
}, p8 = {
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
}, m8 = {
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
}, h8 = {
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
}, y8 = {
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
}, b8 = {
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
}, g8 = {
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
}, A8 = {
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
}, v8 = {
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
}, _8 = {
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
}, w8 = {
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
}, x8 = {
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
}, E8 = {
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
}, S8 = {
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
}, k8 = {
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
}, T8 = {
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
}, M8 = {
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
}, L8 = {
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
}, C8 = {
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
}, R8 = {
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
}, I8 = {
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
}, N8 = {
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
}, O8 = {
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
}, P8 = {
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
}, D8 = {
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
}, B8 = {
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
}, G8 = {
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
}, F8 = {
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
}, $8 = {
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
}, z8 = {
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
}, j8 = {
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
}, q8 = {
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
}, H8 = {
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
}, U8 = {
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
}, V8 = {
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
}, X8 = {
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
}, W8 = {
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
}, Y8 = {
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
}, Z8 = {
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
}, K8 = {
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
}, Q8 = {
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
}, J8 = {
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
}, e6 = {
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
}, t6 = {
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
}, r6 = {
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
}, n6 = {
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
}, o6 = {
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
}, a6 = {
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
}, i6 = {
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
}, s6 = {
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
}, l6 = {
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
}, c6 = {
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
}, f6 = {
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
}, u6 = {
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
}, d6 = {
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
}, p6 = {
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
}, m6 = {
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
}, h6 = {
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
}, y6 = {
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
}, b6 = {
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
}, g6 = {
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
}, A6 = {
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
}, v6 = {
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
}, _6 = {
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
}, w6 = {
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
}, x6 = {
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
}, E6 = {
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
}, S6 = {
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
}, k6 = {
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
}, T6 = {
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
}, M6 = {
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
}, L6 = {
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
}, C6 = {
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
}, R6 = {
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
}, I6 = {
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
}, N6 = {
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
}, O6 = {
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
}, P6 = {
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
}, D6 = {
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
}, B6 = {
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
}, G6 = {
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
}, F6 = {
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
}, $6 = {
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
}, z6 = {
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
}, j6 = {
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
}, q6 = {
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
}, H6 = {
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
}, U6 = {
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
}, V6 = {
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
}, X6 = {
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
}, W6 = {
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
}, Y6 = {
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
}, Z6 = {
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
}, K6 = {
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
}, Q6 = {
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
}, J6 = {
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
}, eA = {
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
}, tA = {
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
}, rA = {
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
}, nA = {
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
}, oA = {
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
}, aA = {
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
}, iA = {
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
}, sA = {
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
}, lA = {
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
}, cA = {
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
}, fA = {
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
}, uA = {
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
}, dA = {
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
}, pA = {
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
}, mA = {
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
}, hA = {
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
}, yA = {
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
}, bA = {
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
}, gA = {
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
}, AA = {
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
}, vA = {
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
}, _A = {
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
}, wA = {
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
}, xA = {
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
}, EA = {
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
}, SA = {
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
}, kA = {
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
}, TA = {
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
}, MA = {
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
}, LA = {
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
}, CA = {
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
}, RA = {
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
}, IA = {
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
}, NA = {
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
}, OA = {
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
}, PA = {
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
}, DA = {
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
}, BA = {
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
}, GA = {
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
}, FA = {
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
}, $A = {
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
}, zA = {
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
}, jA = {
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
}, qA = {
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
}, HA = {
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
}, UA = {
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
}, VA = {
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
}, XA = {
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
}, WA = {
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
}, YA = {
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
}, ZA = {
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
}, KA = {
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
}, QA = {
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
}, JA = {
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
}, e7 = {
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
}, t7 = {
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
}, r7 = {
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
}, n7 = {
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
}, o7 = {
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
}, a7 = {
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
}, i7 = {
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
}, s7 = {
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
}, l7 = {
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
}, c7 = {
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
}, f7 = {
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
}, u7 = {
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
}, d7 = {
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
}, p7 = {
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
}, m7 = {
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
}, h7 = {
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
}, y7 = {
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
}, b7 = {
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
}, g7 = {
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
}, A7 = {
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
}, v7 = {
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
}, _7 = {
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
}, w7 = {
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
}, x7 = {
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
}, E7 = {
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
}, S7 = {
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
}, k7 = {
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
}, T7 = {
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
}, M7 = {
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
}, L7 = {
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
}, C7 = {
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
}, R7 = {
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
}, I7 = {
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
}, N7 = {
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
}, O7 = {
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
}, P7 = {
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
}, D7 = {
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
}, B7 = {
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
}, G7 = {
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
}, F7 = {
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
}, $7 = {
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
}, z7 = {
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
}, j7 = {
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
}, q7 = {
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
}, H7 = {
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
}, U7 = {
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
}, V7 = {
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
}, X7 = {
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
}, W7 = {
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
}, Y7 = {
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
}, Z7 = {
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
}, K7 = {
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
}, Q7 = {
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
}, J7 = {
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
}, ev = {
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
}, tv = {
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
}, rv = {
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
}, nv = {
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
}, ov = {
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
}, av = {
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
}, iv = {
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
}, sv = {
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
}, lv = {
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
}, cv = {
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
}, fv = {
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
}, uv = {
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
}, dv = {
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
}, pv = {
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
}, mv = {
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
}, hv = {
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
}, yv = {
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
}, bv = {
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
}, gv = {
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
}, Av = {
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
}, vv = {
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
}, _v = {
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
}, wv = {
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
}, xv = {
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
}, Ev = {
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
}, Sv = {
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
}, kv = {
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
}, Tv = {
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
}, Mv = {
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
}, Lv = {
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
}, Cv = {
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
}, Rv = {
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
}, Iv = {
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
}, Nv = {
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
}, Ov = {
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
}, Pv = {
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
}, Dv = {
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
}, Bv = {
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
}, Gv = {
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
}, Fv = {
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
}, $v = {
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
}, zv = {
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
}, ws = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  amber: Cv,
  amberA: Rv,
  amberDark: mA,
  amberDarkA: hA,
  amberDarkP3: yA,
  amberDarkP3A: bA,
  amberP3: Iv,
  amberP3A: Nv,
  blackA: Gv,
  blackP3A: Fv,
  blue: I7,
  blueA: N7,
  blueDark: y6,
  blueDarkA: b6,
  blueDarkP3: g6,
  blueDarkP3A: A6,
  blueP3: O7,
  blueP3A: P7,
  bronze: iv,
  bronzeA: sv,
  bronzeDark: H6,
  bronzeDarkA: U6,
  bronzeDarkP3: V6,
  bronzeDarkP3A: X6,
  bronzeP3: lv,
  bronzeP3A: cv,
  brown: rv,
  brownA: nv,
  brownDark: $6,
  brownDarkA: z6,
  brownDarkP3: j6,
  brownDarkP3A: q6,
  brownP3: ov,
  brownP3A: av,
  crimson: o7,
  crimsonA: a7,
  crimsonDark: j8,
  crimsonDarkA: q8,
  crimsonDarkP3: H8,
  crimsonDarkP3A: U8,
  crimsonP3: i7,
  crimsonP3A: s7,
  cyan: D7,
  cyanA: B7,
  cyanDark: v6,
  cyanDarkA: _6,
  cyanDarkP3: w6,
  cyanDarkP3A: x6,
  cyanP3: G7,
  cyanP3A: F7,
  gold: fv,
  goldA: uv,
  goldDark: W6,
  goldDarkA: Y6,
  goldDarkP3: Z6,
  goldDarkP3A: K6,
  goldP3: dv,
  goldP3A: pv,
  grass: Q7,
  grassA: J7,
  grassDark: D6,
  grassDarkA: B6,
  grassDarkP3: G6,
  grassDarkP3A: F6,
  grassP3: ev,
  grassP3A: tv,
  gray: wA,
  grayA: xA,
  grayDark: i8,
  grayDarkA: s8,
  grayDarkP3: l8,
  grayDarkP3A: c8,
  grayP3: EA,
  grayP3A: SA,
  green: W7,
  greenA: Y7,
  greenDark: I6,
  greenDarkA: N6,
  greenDarkP3: O6,
  greenDarkP3A: P6,
  greenP3: Z7,
  greenP3A: K7,
  indigo: M7,
  indigoA: L7,
  indigoDark: d6,
  indigoDarkA: p6,
  indigoDarkP3: m6,
  indigoDarkP3A: h6,
  indigoP3: C7,
  indigoP3A: R7,
  iris: E7,
  irisA: S7,
  irisDark: l6,
  irisDarkA: c6,
  irisDarkP3: f6,
  irisDarkP3A: u6,
  irisP3: k7,
  irisP3A: T7,
  jade: H7,
  jadeA: U7,
  jadeDark: M6,
  jadeDarkA: L6,
  jadeDarkP3: C6,
  jadeDarkP3A: R6,
  jadeP3: V7,
  jadeP3A: X7,
  lime: wv,
  limeA: xv,
  limeDark: iA,
  limeDarkA: sA,
  limeDarkP3: lA,
  limeDarkP3A: cA,
  limeP3: Ev,
  limeP3A: Sv,
  mauve: kA,
  mauveA: TA,
  mauveDark: f8,
  mauveDarkA: u8,
  mauveDarkP3: d8,
  mauveDarkP3A: p8,
  mauveP3: MA,
  mauveP3A: LA,
  mint: gv,
  mintA: Av,
  mintDark: rA,
  mintDarkA: nA,
  mintDarkP3: oA,
  mintDarkP3A: aA,
  mintP3: vv,
  mintP3A: _v,
  olive: GA,
  oliveA: FA,
  oliveDark: w8,
  oliveDarkA: x8,
  oliveDarkP3: E8,
  oliveDarkP3A: S8,
  oliveP3: $A,
  oliveP3A: zA,
  orange: Ov,
  orangeA: Pv,
  orangeDark: gA,
  orangeDarkA: AA,
  orangeDarkP3: vA,
  orangeDarkP3A: _A,
  orangeP3: Dv,
  orangeP3A: Bv,
  pink: l7,
  pinkA: c7,
  pinkDark: V8,
  pinkDarkA: X8,
  pinkDarkP3: W8,
  pinkDarkP3A: Y8,
  pinkP3: f7,
  pinkP3A: u7,
  plum: d7,
  plumA: p7,
  plumDark: Z8,
  plumDarkA: K8,
  plumDarkP3: Q8,
  plumDarkP3A: J8,
  plumP3: m7,
  plumP3A: h7,
  purple: y7,
  purpleA: b7,
  purpleDark: e6,
  purpleDarkA: t6,
  purpleDarkP3: r6,
  purpleDarkP3A: n6,
  purpleP3: g7,
  purpleP3A: A7,
  red: ZA,
  redA: KA,
  redDark: O8,
  redDarkA: P8,
  redDarkP3: D8,
  redDarkP3A: B8,
  redP3: QA,
  redP3A: JA,
  ruby: e7,
  rubyA: t7,
  rubyDark: G8,
  rubyDarkA: F8,
  rubyDarkP3: $8,
  rubyDarkP3A: z8,
  rubyP3: r7,
  rubyP3A: n7,
  sage: OA,
  sageA: PA,
  sageDark: g8,
  sageDarkA: A8,
  sageDarkP3: v8,
  sageDarkP3A: _8,
  sageP3: DA,
  sageP3A: BA,
  sand: jA,
  sandA: qA,
  sandDark: k8,
  sandDarkA: T8,
  sandDarkP3: M8,
  sandDarkP3A: L8,
  sandP3: HA,
  sandP3A: UA,
  sky: mv,
  skyA: hv,
  skyDark: Q6,
  skyDarkA: J6,
  skyDarkP3: eA,
  skyDarkP3A: tA,
  skyP3: yv,
  skyP3A: bv,
  slate: CA,
  slateA: RA,
  slateDark: m8,
  slateDarkA: h8,
  slateDarkP3: y8,
  slateDarkP3A: b8,
  slateP3: IA,
  slateP3A: NA,
  teal: $7,
  tealA: z7,
  tealDark: E6,
  tealDarkA: S6,
  tealDarkP3: k6,
  tealDarkP3A: T6,
  tealP3: j7,
  tealP3A: q7,
  tomato: VA,
  tomatoA: XA,
  tomatoDark: C8,
  tomatoDarkA: R8,
  tomatoDarkP3: I8,
  tomatoDarkP3A: N8,
  tomatoP3: WA,
  tomatoP3A: YA,
  violet: v7,
  violetA: _7,
  violetDark: o6,
  violetDarkA: a6,
  violetDarkP3: i6,
  violetDarkP3A: s6,
  violetP3: w7,
  violetP3A: x7,
  whiteA: $v,
  whiteP3A: zv,
  yellow: kv,
  yellowA: Tv,
  yellowDark: fA,
  yellowDarkA: uA,
  yellowDarkP3: dA,
  yellowDarkP3A: pA,
  yellowP3: Mv,
  yellowP3A: Lv
}, Symbol.toStringTag, { value: "Module" }));
var jv = 4, qv = 1e-3, Hv = 1e-7, Uv = 10, a0 = 11, Pi = 1 / (a0 - 1), Vv = typeof Float32Array == "function";
function L2(e, t) {
  return 1 - 3 * t + 3 * e;
}
function C2(e, t) {
  return 3 * t - 6 * e;
}
function R2(e) {
  return 3 * e;
}
function fs(e, t, r) {
  return ((L2(t, r) * e + C2(t, r)) * e + R2(t)) * e;
}
function I2(e, t, r) {
  return 3 * L2(t, r) * e * e + 2 * C2(t, r) * e + R2(t);
}
function Xv(e, t, r, n, o) {
  var a, i, s = 0;
  do
    i = t + (r - t) / 2, a = fs(i, n, o) - e, a > 0 ? r = i : t = i;
  while (Math.abs(a) > Hv && ++s < Uv);
  return i;
}
function Wv(e, t, r, n) {
  for (var o = 0; o < jv; ++o) {
    var a = I2(t, r, n);
    if (a === 0)
      return t;
    var i = fs(t, r, n) - e;
    t -= i / a;
  }
  return t;
}
function Yv(e) {
  return e;
}
var Zv = function(t, r, n, o) {
  if (!(0 <= t && t <= 1 && 0 <= n && n <= 1))
    throw new Error("bezier x values must be in [0, 1] range");
  if (t === r && n === o)
    return Yv;
  for (var a = Vv ? new Float32Array(a0) : new Array(a0), i = 0; i < a0; ++i)
    a[i] = fs(i * Pi, t, n);
  function s(l) {
    for (var c = 0, u = 1, d = a0 - 1; u !== d && a[u] <= l; ++u)
      c += Pi;
    --u;
    var p = (l - a[u]) / (a[u + 1] - a[u]), m = c + p * Pi, y = I2(m, t, n);
    return y >= qv ? Wv(l, m, t, n) : y === 0 ? m : Xv(l, c, c + Pi, t, n);
  }
  return function(c) {
    return c === 0 ? 0 : c === 1 ? 1 : fs(s(c), r, o);
  };
};
const Kv = /* @__PURE__ */ Sa(Zv), Qv = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], xs = [
  "gray",
  "mauve",
  "slate",
  "sage",
  "olive",
  "sand"
], N2 = [
  ...xs,
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
], O2 = Object.fromEntries(
  N2.map((e) => [
    e,
    Object.values(ws[`${e}P3`]).map(
      (t) => new ft(t).to("oklch")
    )
  ])
), P2 = Object.fromEntries(
  N2.map((e) => [
    e,
    Object.values(ws[`${e}DarkP3`]).map(
      (t) => new ft(t).to("oklch")
    )
  ])
), Jv = Object.fromEntries(
  xs.map((e) => [
    e,
    Object.values(ws[`${e}P3`]).map(
      (t) => new ft(t).to("oklch")
    )
  ])
), e_ = Object.fromEntries(
  xs.map((e) => [
    e,
    Object.values(ws[`${e}DarkP3`]).map(
      (t) => new ft(t).to("oklch")
    )
  ])
), t_ = ({
  appearance: e,
  ...t
}) => {
  const r = e === "light" ? O2 : P2, n = e === "light" ? Jv : e_, o = new ft(t.background).to("oklch"), a = new ft(t.gray).to("oklch"), i = B2(
    a,
    n,
    o
  ), s = o.to("srgb").toString({ format: "hex", collapse: !1 }), l = new ft(t.accent).to("oklch"), c = D2(
    l,
    r,
    o,
    s,
    i
  ), u = c.scale, d = c.scaleWideGamut, p = c.scaleAlpha, m = c.scaleAlphaWideGamut, y = c.contrast, L = i.map(
    (j) => j.to("srgb").toString({ format: "hex" })
  ), x = i.map(
    F2
  ), O = L.map(
    (j) => Yi(j, s)
  ), Y = L.map(
    (j) => Zi(j, s)
  ), R = e === "light" ? Yi(u[1], s, 0.8) : Yi(u[1], s, 0.5), z = e === "light" ? Zi(d[1], s, 0.8) : Zi(d[1], s, 0.5);
  return {
    accentScale: u,
    accentScaleAlpha: p,
    accentScaleWideGamut: d,
    accentScaleAlphaWideGamut: m,
    accentContrast: y,
    grayScale: L,
    grayScaleAlpha: O,
    grayScaleWideGamut: x,
    grayScaleAlphaWideGamut: Y,
    graySurface: e === "light" ? "#ffffffcc" : "rgba(0, 0, 0, 0.05)",
    graySurfaceWideGamut: e === "light" ? "color(display-p3 1 1 1 / 80%)" : "color(display-p3 0 0 0 / 5%)",
    accentSurface: R,
    accentSurfaceWideGamut: z,
    background: s
  };
};
function D2(e, t, r, n, o) {
  let a = B2(e, t, r);
  const i = e.to("srgb").toString({ format: "hex" });
  (i === "#000" || i === "#fff") && o && (a = o.map(
    (y) => y.clone()
  ));
  const [s, l] = n_(a, e);
  a[8] = s, a[9] = o_(s, [a]), a[10].coords[1] = Math.min(
    Math.max(a[8].coords[1], a[7].coords[1]),
    a[10].coords[1]
  ), a[11].coords[1] = Math.min(
    Math.max(a[8].coords[1], a[7].coords[1]),
    a[11].coords[1]
  );
  const c = a.map(
    (y) => y.to("srgb").toString({ format: "hex" })
  ), u = a.map(F2), d = c.map(
    (y) => Yi(y, n)
  ), p = c.map(
    (y) => Zi(y, n)
  ), m = l.to("srgb").toString({ format: "hex" });
  return { scale: c, scaleAlpha: d, scaleWideGamut: u, scaleAlphaWideGamut: p, contrast: m };
}
const r_ = ({
  appearance: e,
  background: t,
  seed: r
}) => {
  const n = e === "light" ? O2 : P2, o = new ft(t).to("oklch"), a = o.to("srgb").toString({ format: "hex" }), i = new ft(r).to("oklch");
  return D2(i, n, o, a);
};
function n_(e, t) {
  const r = e[0];
  return t.deltaEOK(r) * 100 < 25 ? [e[8], x1(e[8])] : [t, x1(t)];
}
function o_(e, t) {
  const [r, n, o] = e.coords, a = r > 0.4 ? r - 0.03 / (r + 0.1) : r + 0.03 / (r + 0.1), i = r > 0.4 && !isNaN(o) ? n * 0.93 + 0 : n, s = new ft("oklch", [a, i, o]);
  let l = s, c = 1 / 0;
  return t.forEach((u) => {
    for (const d of u) {
      const p = s.deltaEOK(d);
      p < c && (c = p, l = d);
    }
  }), s.coords[1] = l.coords[1], s.coords[2] = l.coords[2], s;
}
function B2(e, t, r) {
  const n = [];
  Object.entries(t).forEach(([Xe, Qe]) => {
    for (const xt of Qe) {
      const nt = e.deltaEOK(xt);
      n.push({ scale: Xe, distance: nt, color: xt });
    }
  }), n.sort((Xe, Qe) => Xe.distance - Qe.distance);
  const o = n.filter(
    (Xe, Qe, xt) => Qe === xt.findIndex((nt) => nt.scale === Xe.scale)
  ), a = xs;
  if (!o.every(
    (Xe) => a.includes(Xe.scale)
  ) && a.includes(o[0].scale))
    for (; a.includes(o[1].scale); )
      o.splice(1, 1);
  const s = o[0], l = o[1], c = l.distance, u = s.distance, d = s.color.deltaEOK(l.color), p = (u ** 2 + d ** 2 - c ** 2) / (2 * u * d), m = Math.acos(p), y = Math.sin(m), L = (c ** 2 + d ** 2 - u ** 2) / (2 * c * d), x = Math.acos(L), O = Math.sin(x), Y = p / y, R = L / O, z = Math.max(0, Y / R) * 0.5, j = t[s.scale], I = t[l.scale], N = Qv.map(
    (Xe) => new ft(ft.mix(j[Xe], I[Xe], z)).to("oklch")
  ), ne = N.slice().sort((Xe, Qe) => e.deltaEOK(Xe) - e.deltaEOK(Qe))[0], de = e.coords[1] / ne.coords[1];
  if (N.forEach((Xe) => {
    Xe.coords[1] = Math.min(e.coords[1] * 1.5, Xe.coords[1] * de), Xe.coords[2] = e.coords[2];
  }), N[0].coords[0] > 0.5) {
    const Xe = N.map(({ coords: nt }) => nt[0]), Qe = Math.max(0, Math.min(1, r.coords[0])), xt = E1(
      Qe,
      // Add white as the first "step" of the light scale
      [1, ...Xe],
      s_
    );
    return xt.shift(), xt.forEach((nt, ut) => {
      N[ut].coords[0] = nt;
    }), N;
  }
  const oe = [...i_], ge = N[0].coords[0], Ie = Math.max(0, Math.min(1, r.coords[0])) / ge;
  if (Ie > 1)
    for (let Qe = 0; Qe < oe.length; Qe++) {
      const xt = (Ie - 1) * 3;
      oe[Qe] = Ie > 1.5 ? 0 : Math.max(0, oe[Qe] * (1 - xt));
    }
  const Ke = N.map(({ coords: Xe }) => Xe[0]), Ye = r.coords[0];
  return E1(
    Ye,
    Ke,
    oe
  ).forEach((Xe, Qe) => {
    N[Qe].coords[0] = Xe;
  }), N;
}
function x1(e) {
  const t = new ft("oklch", [1, 0, 0]);
  if (Math.abs(t.contrastAPCA(e)) < 40) {
    const [, r, n] = e.coords;
    return new ft("oklch", [0.25, Math.max(0.08 * r, 0.04), n]);
  }
  return t;
}
function G2(e, t, r, n, o) {
  const [a, i, s] = e.map((oe) => Math.round(oe * r)), [l, c, u] = t.map((oe) => Math.round(oe * r));
  if (a === void 0 || i === void 0 || s === void 0 || l === void 0 || c === void 0 || u === void 0)
    throw Error("Color is undefined");
  let d = 0;
  (a > l || i > c || s > u) && (d = r);
  const p = (a - l) / (d - l), m = (i - c) / (d - c), y = (s - u) / (d - u), L = [p, m, y].every((oe) => oe === p);
  if (!o && L) {
    const oe = d / r;
    return [oe, oe, oe, p];
  }
  const x = (oe) => isNaN(oe) ? 0 : Math.min(r, Math.max(0, oe)), O = (oe) => isNaN(oe) ? 0 : Math.min(n, Math.max(0, oe)), Y = o ?? Math.max(p, m, y), R = O(Math.ceil(Y * n)) / n;
  let z = x((l * (1 - R) - a) / R * -1), j = x((c * (1 - R) - i) / R * -1), I = x((u * (1 - R) - s) / R * -1);
  z = Math.ceil(z), j = Math.ceil(j), I = Math.ceil(I);
  const N = ac(z, R, l), ne = ac(j, R, c), de = ac(I, R, u);
  return d === 0 && (a <= l && a !== N && (z = a > N ? z + 1 : z - 1), i <= c && i !== ne && (j = i > ne ? j + 1 : j - 1), s <= u && s !== de && (I = s > de ? I + 1 : I - 1)), d === r && (a >= l && a !== N && (z = a > N ? z + 1 : z - 1), i >= c && i !== ne && (j = i > ne ? j + 1 : j - 1), s >= u && s !== de && (I = s > de ? I + 1 : I - 1)), z = z / r, j = j / r, I = I / r, [z, j, I, R];
}
function ac(e, t, r, n = !0) {
  return n ? Math.round(r * (1 - t)) + Math.round(e * t) : r * (1 - t) + e * t;
}
function Yi(e, t, r) {
  const [n, o, a, i] = G2(
    new ft(e).to("srgb").coords,
    new ft(t).to("srgb").coords,
    255,
    255,
    r
  );
  return a_(new ft("srgb", [n, o, a], i).toString({ format: "hex" }));
}
function Zi(e, t, r) {
  const [n, o, a, i] = G2(
    new ft(e).to("p3").coords,
    new ft(t).to("p3").coords,
    // Not sure why, but the resulting P3 alpha colors are blended in the browser most precisely when
    // rounded to 255 integers too. Is the browser using 0-255 rather than 0-1 under the hood for P3 too?
    255,
    1e3,
    r
  );
  return new ft("p3", [n, o, a], i).toString({ precision: 4 }).replace("color(p3 ", "color(display-p3 ");
}
function a_(e) {
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
const i_ = [1, 0, 1, 0], s_ = [0, 2, 0, 2];
function E1(e, t, r) {
  return t.map((n, o, a) => {
    const i = a.length - 1, s = a[0] - e, l = Kv(...r);
    return n - s * l(1 - o / i);
  });
}
function F2(e) {
  const t = +(e.coords[0] * 100).toFixed(1);
  return e.to("oklch").toString({ precision: 4 }).replace(/(\S+)(.+)/, `oklch(${t}%$2`);
}
const Qc = {
  red: "#e5484d",
  orange: "#f76b15",
  yellow: "#ffc53d",
  // amber
  green: "#46a758",
  // grass
  cyan: "#00a2c7",
  blue: "#3e63dd",
  purple: "#8e4ec6"
}, l_ = 0.3, S1 = 24, c_ = 0.5, f_ = 0.5;
function $2(e, t) {
  if (Number.isNaN(e) || Number.isNaN(t)) return e;
  const r = (t - e + 540) % 360 - 180;
  return (d_(
    e + r * l_,
    e - S1,
    e + S1
  ) % 360 + 360) % 360;
}
function u_(e, t) {
  const r = new ft(e).to("oklch"), n = new ft(t).to("oklch"), [o, a, i] = r.coords, s = n.coords[1], l = n.coords[2];
  if (Number.isNaN(i) || Number.isNaN(l)) return e;
  const c = Math.max(a + (s - a) * c_, a * f_);
  return new ft("oklch", [o, c, $2(i, l)]).to("srgb").toString({ format: "hex" });
}
function d_(e, t, r) {
  return Math.max(t, Math.min(r, e));
}
const Lo = 10;
function p_(e, t) {
  const r = new ft(e).to("oklch").coords[2], [n, o, a] = new ft(t).to("oklch").coords, i = $2(r, a);
  return new ft("oklch", [n, o, Number.isNaN(i) ? r : i]).to("srgb").toString({ format: "hex" });
}
function m_(e) {
  return Object.fromEntries(
    Object.entries(Qc).map(([t, r]) => [
      t,
      p_(r, e)
    ])
  );
}
function Di(e, t) {
  return new ft(ft.mix(e, t, 0.15, { space: "oklch" })).to("srgb").toString({ format: "hex" });
}
function h_({
  background: e,
  accent: t
}) {
  const r = m_(t);
  return {
    colorError: r.red,
    colorErrorSoft: Di(e, r.red),
    colorWarning: r.yellow,
    colorWarningSoft: Di(e, r.yellow),
    colorSuccess: r.green,
    colorSuccessSoft: Di(e, r.green),
    colorRec: r.red,
    // identical to error / alert
    colorInfo: r.blue,
    colorInfoSoft: Di(e, r.blue),
    colorAffirmative: r.green
  };
}
function y_(e) {
  return Object.fromEntries(
    Object.entries(Qc).map(([t, r]) => [
      t,
      u_(r, e)
    ])
  );
}
function b_(e, t, r) {
  return Object.fromEntries(
    Object.entries(e).map(([n, o]) => [
      n,
      r_({ appearance: t, background: r, seed: o })
    ])
  );
}
function sa(e) {
  const t = e.replace("#", "");
  return "#" + (t.length === 3 || t.length === 4 ? t.split("").map((n) => n + n).join("") : t);
}
const qn = (e) => sa(e).slice(1);
function g_({
  appearance: e,
  background: t,
  accent: r,
  foreground: n,
  comment: o,
  cursor: a,
  selection: i
}) {
  const s = b_(y_(r), e, t), l = qn(s.red.scale[Lo]), c = qn(s.orange.scale[Lo]), u = qn(s.yellow.scale[Lo]), d = qn(s.green.scale[Lo]), p = qn(s.cyan.scale[Lo]), m = qn(s.blue.scale[Lo]), y = qn(s.purple.scale[Lo]), L = qn(n), x = qn(o);
  return {
    base: e === "dark" ? "vs-dark" : "vs",
    inherit: !1,
    // base16 token conventions mapped onto the palette hues.
    rules: [
      { token: "", foreground: L },
      { token: "comment", foreground: x, fontStyle: "italic" },
      { token: "keyword", foreground: y },
      { token: "storage", foreground: y },
      { token: "string", foreground: d },
      { token: "string.escape", foreground: p },
      { token: "regexp", foreground: p },
      { token: "number", foreground: c },
      { token: "constant", foreground: c },
      { token: "constant.language", foreground: c },
      { token: "type", foreground: u },
      { token: "type.identifier", foreground: u },
      { token: "attribute.name", foreground: u },
      { token: "function", foreground: m },
      { token: "variable", foreground: l },
      { token: "variable.predefined", foreground: l },
      { token: "tag", foreground: l },
      { token: "delimiter", foreground: L },
      { token: "operator", foreground: L },
      { token: "invalid", foreground: l }
    ],
    colors: {
      "editor.background": sa(t),
      "editor.foreground": sa(n),
      "editorCursor.foreground": sa(a),
      "editor.selectionBackground": sa(i),
      "editorLineNumber.foreground": sa(o),
      "editor.lineHighlightBackground": "#00000000"
    }
  };
}
function A_({
  colorMode: e,
  accentColor: t,
  grayColor: r,
  backgroundColor: n
}) {
  const o = t_({
    appearance: e,
    background: n,
    accent: t,
    gray: r
  }), a = h_({
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
  }, l = g_({
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
const Es = qp.getState().group("theme"), us = Es.ref("accentColor", "#0000ff"), b0 = Es.ref("colorMode", "light"), ds = Es.ref("grayColor", "#8B8D98"), g0 = Es.ref(
  "backgroundColor",
  b0.value === "light" ? "#ffffff" : "#111111"
);
function z2() {
  const e = {
    colorMode: b0.value,
    accentColor: us.value,
    grayColor: ds.value,
    backgroundColor: g0.value
  }, { theme: t, monacoTheme: r } = A_(e);
  return { ...e, ...t, theme: t, monacoTheme: r };
}
const On = qc(() => ({
  ...z2(),
  setAccentColor(e) {
    us.value = e;
  },
  setColorMode(e) {
    b0.value = e;
  },
  setGrayColor(e) {
    ds.value = e;
  },
  setBackgroundColor(e) {
    g0.value = e;
  },
  setDefault(e) {
    e.colorMode && (b0.default = e.colorMode), e.accentColor && (us.default = e.accentColor), e.backgroundColor && (g0.default = e.backgroundColor), e.grayColor && (ds.default = e.grayColor);
  }
}));
function Ss() {
  On.setState(z2());
}
us.subscribe(Ss);
ds.subscribe(Ss);
g0.subscribe(Ss);
b0.subscribe((e, { reload: t }) => {
  t || (g0.value = e === "light" ? "#ffffff" : "#111111"), Ss();
});
if (typeof document < "u") {
  const e = () => {
    const { theme: r, colorMode: n } = On.getState();
    ig(r, n);
  }, t = () => {
    e(), On.subscribe((r, n) => {
      (r.theme !== n.theme || r.colorMode !== n.colorMode) && e();
    });
  };
  document.body ? t() : document.addEventListener("DOMContentLoaded", t, { once: !0 });
}
function v_(e) {
  return new Function(
    "x",
    "context",
    `const {i} = context;
		const result = (${e});
		if (typeof result === 'string') return result;
		if (typeof result === 'number') return result.toString();
		throw new Error('Value is not a string or number');`
  );
}
const ps = (e) => `${e[0]} ${e[1]}`;
function __(e, t) {
  return `M ${ps(e)} L ${ps(t)}`;
}
function j2(e, t) {
  return `M ${e[0] + t} ${e[1]} A ${t} ${t} 0 1 0 ${e[0] - t} ${e[1]} A ${t} ${t} 0 1 0 ${e[0] + t} ${e[1]}`;
}
function w_(e, t, r, n) {
  const o = n - r;
  if (Math.abs(o) >= 359.999) return j2(e, t);
  const a = $t.dir(r, t, e), i = $t.dir(n, t, e);
  return `M ${ps(a)} A ${t} ${t} 0 ${Math.abs(o) > 180 ? 1 : 0} ${o >= 0 ? 1 : 0} ${ps(i)}`;
}
function k1(e) {
  return e.filter(Boolean).join(" ");
}
function x_(e) {
  if (e.labelizer) return e.labelizer;
  const t = e.prefix || "", r = e.suffix || "";
  if (!e.labels)
    return (o) => t + Up.capital(String(o)) + r;
  const n = e.labels;
  if (n.length !== e.options.length)
    throw new Error(
      "the length of labels must be the same as the length of options"
    );
  return (o) => {
    const a = e.options.indexOf(o);
    return t + n[a] + r;
  };
}
var E_ = function(e) {
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
    return L;
  }), r.d(t, "validateHTMLColorHsl", function() {
    return x;
  }), r.d(t, "validateHTMLColorHwb", function() {
    return O;
  }), r.d(t, "validateHTMLColorLab", function() {
    return Y;
  }), r.d(t, "validateHTMLColorLch", function() {
    return R;
  }), r.d(t, "validateHTMLColor", function() {
    return z;
  });
  const n = (j) => j && typeof j == "string", o = ["AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "Black", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenrod", "DarkGray", "DarkGrey", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "DarkOrange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "Goldenrod", "Gray", "Grey", "Green", "GreenYellow", "HoneyDew", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenrodYellow", "LightGray", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "Maroon", "MediumAquamarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenrod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "RebeccaPurple", "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen"], a = ["currentColor", "inherit", "transparent"], i = (j) => {
    let I = !1;
    return n(j) && o.map((N) => (j.toLowerCase() === N.toLowerCase() && (I = !0), null)), I;
  }, s = (j) => {
    let I = !1;
    return n(j) && a.map((N) => (j.toLowerCase() === N.toLowerCase() && (I = !0), null)), I;
  }, l = (j) => n(j) ? j && /^#([\da-f]{3}){1,2}$|^#([\da-f]{4}){1,2}$/i.test(j) : !1, c = "(([\\d]{0,5})((\\.([\\d]{1,5}))?))", u = `(${c}%)`, d = "(([0-9]|[1-9][0-9]|100)%)", p = `(${d}|(0?((\\.([\\d]{1,5}))?))|1)`, m = `([\\s]{0,5})\\)?)(([\\s]{0,5})(\\/?)([\\s]{1,5})${`(((${d}))|(0?((\\.([\\d]{1,5}))?))|1))?`}([\\s]{0,5})\\)`, y = "(-?(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-9][0-9]|3[0-5][0-9])((\\.([\\d]{1,5}))?)|360)(deg)?)", L = (j) => {
    if (n(j)) {
      const I = "([\\s]{0,5})([\\d]{1,5})%?([\\s]{0,5}),?", N = "((([\\s]{0,5}),?([\\s]{0,5}))|(([\\s]{1,5})))", ne = new RegExp(`^(rgb)a?\\(${`${I}${N}`}${`${I}${N}`}${`${I}${N}`}((\\/?([\\s]{0,5})(0?\\.?([\\d]{1,5})%?([\\s]{0,5}))?|1|0))?\\)$`);
      return j && ne.test(j);
    }
    return !1;
  }, x = (j) => {
    if (n(j)) {
      const I = new RegExp(`^(hsl)a?\\((([\\s]{0,5})(${y}|(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-9][0-9]|3[0-9][0-9]|400)grad)|((([0-5])?\\.([\\d]{1,5})|6\\.([0-9]|1[0-9]|2[0-8])|[0-6])rad)|((0?((\\.([\\d]{1,5}))?)|1)turn))((([\\s]{0,5}),([\\s]{0,5}))|(([\\s]{1,5}))))(([\\s]{0,5})(0|${d})((([\\s]{0,5}),([\\s]{0,5}))|(([\\s]{1,5}))))(([\\s]{0,5})(0|${d})([\\s]{0,5})\\)?)(([\\s]{0,5})(\\/?|,?)([\\s]{0,5})(((${d}))|(0?((\\.([\\d]{1,5}))?))|1))?\\)$`);
      return j && I.test(j);
    }
    return !1;
  }, O = (j) => {
    if (n(j)) {
      const I = new RegExp(`^(hwb\\(([\\s]{0,5})${y}([\\s]{1,5}))((0|${d})([\\s]{1,5}))((0|${d})${m}$`);
      return j && I.test(j);
    }
    return !1;
  }, Y = (j) => {
    if (n(j)) {
      const I = "(-?(([0-9]|[1-9][0-9]|1[0-5][0-9])((\\.([\\d]{1,5}))?)?|160))", N = new RegExp(`^(lab\\(([\\s]{0,5})${u}([\\s]{1,5})${I}([\\s]{1,5})${I}${m}$`);
      return j && N.test(j);
    }
    return !1;
  }, R = (j) => {
    if (n(j)) {
      const I = "((([0-9]|[1-9][0-9])?((\\.([\\d]{1,5}))?)|100)(%)?)", N = "" + c, ne = `((${y})|(0|${p})|(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-9][0-9]|3[0-5][0-9])((\\.([\\d]{1,5}))?)|360))`, de = `(\\/([\\s]{0,5})${p})`, oe = new RegExp(`^lch\\(${`(([\\s]{0,5})${I}([\\s]{1,5})${N}([\\s]{1,5})${ne}([\\s]{0,5})(${de})?)`}\\)$`);
      return j && oe.test(j);
    }
    return !1;
  }, z = (j) => !!(j && l(j) || L(j) || x(j) || O(j) || Y(j) || R(j));
  t.default = (j) => !!(j && l(j) || i(j) || s(j) || L(j) || x(j) || O(j) || Y(j) || R(j));
}]);
const S_ = /* @__PURE__ */ Sa(E_);
function k_(e, t) {
  return (r) => r < e ? { value: Math.max(r, e), log: [`should be >= ${e}`] } : r > t ? { value: Math.min(r, t), log: [`should be <= ${t}`] } : { value: r, log: [] };
}
function T1(e) {
  return (t) => {
    if (e === 0) return { value: t, log: [] };
    const r = Zt.quantize(t, e);
    return Zt.approx(t, r) ? { value: t, log: [] } : { value: r, log: [`should be a multiple of ${e}`] };
  };
}
const q2 = (e) => S_(e) ? { value: e, log: [] } : { value: void 0, log: ["Invalid color code"] }, T_ = (e) => ({ value: e, log: [] });
function M_(...e) {
  return (t) => {
    let r = { value: t, log: [] };
    for (const n of e) {
      if (!n || !r.value) continue;
      const { value: o, log: a } = r;
      r = n(o), r.log.unshift(...a);
    }
    return r;
  };
}
function Ft(...e) {
  return e.filter(Boolean).join(" ");
}
function L_(e) {
  return e && "current" in e ? e.current : e ?? null;
}
function Wr(e, t, r, n) {
  const o = ze(r);
  o.current = r;
  const a = ze(void 0);
  ur(() => {
    const i = L_(e), s = a.current;
    if ((s == null ? void 0 : s.target) === i && s.type === t && s.options === n || (s && s.target.removeEventListener(
      s.type,
      s.handler,
      s.options
    ), a.current = void 0, !i)) return;
    const l = (c) => o.current(c);
    i.addEventListener(t, l, n), a.current = { target: i, type: t, options: n, handler: l };
  }), ur(() => () => {
    const i = a.current;
    i && (i.target.removeEventListener(
      i.type,
      i.handler,
      i.options
    ), a.current = void 0);
  }, []);
}
function H2({
  target: e,
  onCopy: t,
  onPaste: r
}) {
  Wr(
    typeof window > "u" ? null : window,
    "keydown",
    (n) => {
      var o;
      !n.metaKey && !n.ctrlKey || ((o = e.current) == null ? void 0 : o.ownerDocument.activeElement) === e.current && (n.key.toLowerCase() === "c" && (t == null || t()), n.key.toLowerCase() === "v" && (r == null || r()));
    }
  );
}
const Tc = /* @__PURE__ */ new Map();
function M1() {
  if (typeof document > "u") return;
  const t = [...Tc.values()].findLast((r) => r !== null) ?? "inherit";
  document.documentElement.style.cursor = t;
}
function C_(e) {
  const t = ze(Symbol()), r = typeof e == "function" ? e() : e;
  vn(() => {
    Tc.set(t.current, r), M1();
  }), vn(() => () => {
    Tc.delete(t.current), M1();
  }, []);
}
function ks(e, t, r) {
  const n = ze(t);
  n.current = t;
  const o = ze(void 0);
  ur(() => {
    const a = e.current, i = o.current;
    if ((i == null ? void 0 : i.element) === a && i.options === r || (i == null || i.observer.disconnect(), o.current = void 0, !a || typeof ResizeObserver > "u")) return;
    const s = new ResizeObserver((l, c) => {
      n.current(l, c);
    });
    s.observe(a, r), o.current = { element: a, options: r, observer: s };
  }), ur(() => () => {
    var a;
    (a = o.current) == null || a.observer.disconnect(), o.current = void 0;
  }, []);
}
const R_ = {}, I_ = {
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
function N_(e, t) {
  const r = (n, o) => n[0] === o[0] && n[1] === o[1];
  return r(e.xy, t.xy) && r(e.previous, t.previous) && r(e.initial, t.initial) && r(e.delta, t.delta) && r(e.origin, t.origin) && e.top === t.top && e.right === t.right && e.bottom === t.bottom && e.left === t.left && e.width === t.width && e.height === t.height && e.dragging === t.dragging && e.pointerLocked === t.pointerLocked;
}
function I0(e, t = R_) {
  const [r, n] = Mt(I_), o = ze(!0), a = ze(void 0), i = io((l) => {
    if (!o.current) return;
    const c = { ...l };
    n((u) => N_(u, c) ? u : c);
  }, []), s = io(() => {
    var c;
    const l = (c = a.current) == null ? void 0 : c.handler;
    l && (l.measure(), i(l.state));
  }, [i]);
  return vn(() => {
    const l = e.current, c = a.current;
    if ((c == null ? void 0 : c.element) === l && c.options === t || (c == null || c.handler.dispose(), a.current = void 0, !l)) return;
    const u = () => {
      queueMicrotask(() => {
        var m;
        const p = (m = a.current) == null ? void 0 : m.handler;
        p && i(p.state);
      });
    }, d = Nb(l, {
      ...t,
      onClick(p, m) {
        var y;
        (y = t.onClick) == null || y.call(t, p, m), u();
      },
      onDrag(p, m) {
        var y;
        (y = t.onDrag) == null || y.call(t, p, m), i(p);
      },
      onDragStart(p, m) {
        var y;
        (y = t.onDragStart) == null || y.call(t, p, m), i(p);
      },
      onDragEnd(p, m) {
        var y;
        (y = t.onDragEnd) == null || y.call(t, p, m), u();
      }
    });
    a.current = { element: l, options: t, handler: d }, i(d.state);
  }), ks(e, s), Wr(
    typeof window > "u" ? null : window,
    "resize",
    s
  ), Wr(
    typeof document > "u" ? null : document,
    "scroll",
    s,
    !0
  ), ur(() => (o.current = !0, () => {
    var l;
    o.current = !1, (l = a.current) == null || l.handler.dispose(), a.current = void 0;
  }), []), { ...r, measure: s };
}
const O_ = {
  x: 0,
  y: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 0,
  height: 0
};
function P_(e, t) {
  return Object.keys(e).every(
    (r) => e[r] === t[r]
  );
}
function Bo(e) {
  const [t, r] = Mt(O_), n = io(() => {
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
    r((s) => P_(s, a) ? s : a);
  }, [e]);
  return vn(n), ks(e, n), Wr(
    typeof window > "u" ? null : window,
    "resize",
    n
  ), Wr(
    typeof document > "u" ? null : document,
    "scroll",
    n,
    !0
  ), { ...t, update: n };
}
function D_(e) {
  const { left: t, top: r, right: n, bottom: o } = Bo(e);
  return dr(
    () => [(t + n) / 2, (r + o) / 2],
    [o, t, n, r]
  );
}
function Bi(e) {
  return e.toLowerCase();
}
function Jc(e) {
  const [, t] = Mt(0), r = ze(/* @__PURE__ */ new Set()), n = dr(() => new Set(e.map(Bi)), [e]);
  function o(a) {
    a.size === r.current.size && [...a].every((i) => r.current.has(i)) || (r.current = a, t((i) => i + 1));
  }
  return Wr(
    typeof window > "u" ? null : window,
    "keydown",
    (a) => {
      const i = Bi(a.key);
      n.has(i) && o(/* @__PURE__ */ new Set([...r.current, i]));
    }
  ), Wr(
    typeof window > "u" ? null : window,
    "keyup",
    (a) => {
      const i = Bi(a.key);
      if (!r.current.has(i)) return;
      const s = new Set(r.current);
      s.delete(i), o(s);
    }
  ), Wr(
    typeof window > "u" ? null : window,
    "blur",
    () => o(/* @__PURE__ */ new Set())
  ), dr(() => {
    const a = {};
    for (const i of e)
      Object.defineProperty(a, i, {
        enumerable: !0,
        get: () => r.current.has(Bi(i))
      });
    return a;
  }, [e, r.current]);
}
function B_(e) {
  const t = ze(e), [r, n] = Mt();
  return ur(() => {
    for (const o of Object.keys(e))
      e[o] && !t.current[o] && n(o);
    Object.keys(e).some((o) => e[o]) || n(void 0), t.current = e;
  }, [e]), r;
}
function Ts(e, t) {
  const r = ze(e);
  r.current = e;
  const n = ze(void 0);
  Do(Sd), vn(() => {
    const c = Sd.getState().register({
      type: e.type,
      getElement: () => r.current.getElement(),
      getSpeed: e.getSpeed ? () => r.current.getSpeed() : void 0,
      getValue: () => r.current.getValue(),
      setValue: (u) => r.current.setValue(u),
      confirm: () => r.current.confirm()
    });
    return n.current = c, () => {
      c.dispose(), n.current === c && (n.current = void 0);
    };
  }, [e.type]), vn(() => {
  }, [t]);
  const o = io((c) => {
    var u;
    (u = n.current) == null || u.setFocusing(c);
  }, []), a = io(() => {
    var c;
    return (c = n.current) == null ? void 0 : c.capture();
  }, []), i = io(
    (c) => {
      var u;
      return (u = n.current) == null ? void 0 : u.update(c);
    },
    []
  ), s = io(() => {
    var c;
    return (c = n.current) == null ? void 0 : c.confirm();
  }, []), l = n.current;
  return {
    id: l == null ? void 0 : l.id,
    subfocus: (l == null ? void 0 : l.subfocus) ?? !1,
    index: (l == null ? void 0 : l.index) ?? -1,
    readyToBeSelected: (l == null ? void 0 : l.readyToBeSelected) ?? !1,
    multiSelected: (l == null ? void 0 : l.multiSelected) ?? !1,
    setFocusing: o,
    capture: a,
    update: i,
    confirm: s
  };
}
function U2(e, t) {
  const r = dr(() => t(e), [e, t]), n = ze(void 0);
  return r.value !== void 0 && (n.current = r.value), { validLocal: n.current, validateResult: r };
}
function L1() {
  return typeof window > "u" ? { width: 0, height: 0 } : { width: window.innerWidth, height: window.innerHeight };
}
function V2() {
  const [e, t] = Mt(L1);
  return Wr(
    typeof window > "u" ? null : window,
    "resize",
    () => t(L1())
  ), e;
}
const G_ = "_tqInputGroup_1vivn_1", F_ = {
  tqInputGroup: G_
};
function X2(e) {
  const t = [];
  return _h.forEach(e, (r) => {
    if (!(typeof r == "string" && r.trim() === "")) {
      if (fc(r) && r.type === wh) {
        t.push(
          ...X2(
            r.props.children
          )
        );
        return;
      }
      t.push(r);
    }
  }), t;
}
const Ki = mo(
  function({ direction: t = "horizontal", children: r, className: n, ...o }, a) {
    const i = X2(r), s = i.filter(fc).length;
    let l = 0;
    const c = t === "vertical" ? "blockPosition" : "inlinePosition", u = i.map((d, p) => {
      if (!fc(d) || s <= 1) return d;
      const m = l === 0 ? "start" : l === s - 1 ? "end" : "middle";
      return l += 1, vh(d, {
        key: d.key ?? p,
        [c]: m
      });
    });
    return /* @__PURE__ */ fe(
      "div",
      {
        ...o,
        ref: a,
        className: Ft(F_.tqInputGroup, n),
        "data-direction": t,
        children: u
      }
    );
  }
);
function $_(e, t) {
  const r = e.icons, n = e.aliases || /* @__PURE__ */ Object.create(null), o = /* @__PURE__ */ Object.create(null);
  function a(i) {
    if (r[i]) return o[i] = [];
    if (!(i in o)) {
      o[i] = null;
      const s = n[i] && n[i].parent, l = s && a(s);
      l && (o[i] = [s].concat(l));
    }
    return o[i];
  }
  return Object.keys(r).concat(Object.keys(n)).forEach(a), o;
}
const W2 = Object.freeze({
  left: 0,
  top: 0,
  width: 16,
  height: 16
}), ms = Object.freeze({
  rotate: 0,
  vFlip: !1,
  hFlip: !1
}), N0 = Object.freeze({
  ...W2,
  ...ms
}), Mc = Object.freeze({
  ...N0,
  body: "",
  hidden: !1
});
function z_(e, t) {
  const r = {};
  !e.hFlip != !t.hFlip && (r.hFlip = !0), !e.vFlip != !t.vFlip && (r.vFlip = !0);
  const n = ((e.rotate || 0) + (t.rotate || 0)) % 4;
  return n && (r.rotate = n), r;
}
function C1(e, t) {
  const r = z_(e, t);
  for (const n in Mc) n in ms ? n in e && !(n in r) && (r[n] = ms[n]) : n in t ? r[n] = t[n] : n in e && (r[n] = e[n]);
  return r;
}
function j_(e, t, r) {
  const n = e.icons, o = e.aliases || /* @__PURE__ */ Object.create(null);
  let a = {};
  function i(s) {
    a = C1(n[s] || o[s], a);
  }
  return i(t), r.forEach(i), C1(e, a);
}
function Y2(e, t) {
  const r = [];
  if (typeof e != "object" || typeof e.icons != "object") return r;
  e.not_found instanceof Array && e.not_found.forEach((o) => {
    t(o, null), r.push(o);
  });
  const n = $_(e);
  for (const o in n) {
    const a = n[o];
    a && (t(o, j_(e, o, a)), r.push(o));
  }
  return r;
}
const q_ = {
  provider: "",
  aliases: {},
  not_found: {},
  ...W2
};
function ic(e, t) {
  for (const r in t) if (r in e && typeof e[r] != typeof t[r]) return !1;
  return !0;
}
function Z2(e) {
  if (typeof e != "object" || e === null) return null;
  const t = e;
  if (typeof t.prefix != "string" || !e.icons || typeof e.icons != "object" || !ic(e, q_)) return null;
  const r = t.icons;
  for (const o in r) {
    const a = r[o];
    if (!o || typeof a.body != "string" || !ic(a, Mc)) return null;
  }
  const n = t.aliases || /* @__PURE__ */ Object.create(null);
  for (const o in n) {
    const a = n[o], i = a.parent;
    if (!o || typeof i != "string" || !r[i] && !n[i] || !ic(a, Mc)) return null;
  }
  return t;
}
const R1 = /* @__PURE__ */ Object.create(null);
function H_(e, t) {
  return {
    provider: e,
    prefix: t,
    icons: /* @__PURE__ */ Object.create(null),
    missing: /* @__PURE__ */ new Set()
  };
}
function va(e, t) {
  const r = R1[e] || (R1[e] = /* @__PURE__ */ Object.create(null));
  return r[t] || (r[t] = H_(e, t));
}
function K2(e, t) {
  return Z2(t) ? Y2(t, (r, n) => {
    n ? e.icons[r] = n : e.missing.add(r);
  }) : [];
}
function U_(e, t, r) {
  try {
    if (typeof r.body == "string")
      return e.icons[t] = { ...r }, !0;
  } catch {
  }
  return !1;
}
const Q2 = /^[a-z0-9]+(-[a-z0-9]+)*$/, O0 = (e, t, r, n = "") => {
  const o = e.split(":");
  if (e.slice(0, 1) === "@") {
    if (o.length < 2 || o.length > 3) return null;
    n = o.shift().slice(1);
  }
  if (o.length > 3 || !o.length) return null;
  if (o.length > 1) {
    const s = o.pop(), l = o.pop(), c = {
      provider: o.length > 0 ? o[0] : n,
      prefix: l,
      name: s
    };
    return t && !Qi(c) ? null : c;
  }
  const a = o[0], i = a.split("-");
  if (i.length > 1) {
    const s = {
      provider: n,
      prefix: i.shift(),
      name: i.join("-")
    };
    return t && !Qi(s) ? null : s;
  }
  if (r && n === "") {
    const s = {
      provider: n,
      prefix: "",
      name: a
    };
    return t && !Qi(s, r) ? null : s;
  }
  return null;
}, Qi = (e, t) => e ? !!((t && e.prefix === "" || e.prefix) && e.name) : !1;
let A0 = !1;
function J2(e) {
  return typeof e == "boolean" && (A0 = e), A0;
}
function v0(e) {
  const t = typeof e == "string" ? O0(e, !0, A0) : e;
  if (t) {
    const r = va(t.provider, t.prefix), n = t.name;
    return r.icons[n] || (r.missing.has(n) ? null : void 0);
  }
}
function e3(e, t) {
  const r = O0(e, !0, A0);
  if (!r) return !1;
  const n = va(r.provider, r.prefix);
  return t ? U_(n, r.name, t) : (n.missing.add(r.name), !0);
}
function V_(e, t) {
  if (typeof e != "object") return !1;
  if (typeof t != "string" && (t = e.provider || ""), A0 && !t && !e.prefix) {
    let o = !1;
    return Z2(e) && (e.prefix = "", Y2(e, (a, i) => {
      e3(a, i) && (o = !0);
    })), o;
  }
  const r = e.prefix;
  if (!Qi({
    prefix: r,
    name: "a"
  })) return !1;
  const n = va(t, r);
  return !!K2(n, e);
}
function X_(e) {
  return !!v0(e);
}
function W_(e) {
  const t = v0(e);
  return t && {
    ...N0,
    ...t
  };
}
const t3 = Object.freeze({
  width: null,
  height: null
}), r3 = Object.freeze({
  ...t3,
  ...ms
}), Y_ = /(-?[0-9.]*[0-9]+[0-9.]*)/g, Z_ = /^-?[0-9.]*[0-9]+[0-9.]*$/g;
function I1(e, t, r) {
  if (t === 1) return e;
  if (r = r || 100, typeof e == "number") return Math.ceil(e * t * r) / r;
  if (typeof e != "string") return e;
  const n = e.split(Y_);
  if (n === null || !n.length) return e;
  const o = [];
  let a = n.shift(), i = Z_.test(a);
  for (; ; ) {
    if (i) {
      const s = parseFloat(a);
      isNaN(s) ? o.push(a) : o.push(Math.ceil(s * t * r) / r);
    } else o.push(a);
    if (a = n.shift(), a === void 0) return o.join("");
    i = !i;
  }
}
function K_(e, t = "defs") {
  let r = "";
  const n = e.indexOf("<" + t);
  for (; n >= 0; ) {
    const o = e.indexOf(">", n), a = e.indexOf("</" + t);
    if (o === -1 || a === -1) break;
    const i = e.indexOf(">", a);
    if (i === -1) break;
    r += e.slice(o + 1, a).trim(), e = e.slice(0, n).trim() + e.slice(i + 1);
  }
  return {
    defs: r,
    content: e
  };
}
function Q_(e, t) {
  return e ? "<defs>" + e + "</defs>" + t : t;
}
function J_(e, t, r) {
  const n = K_(e);
  return Q_(n.defs, t + n.content + r);
}
const ew = (e) => e === "unset" || e === "undefined" || e === "none";
function tw(e, t) {
  const r = {
    ...N0,
    ...e
  }, n = {
    ...r3,
    ...t
  }, o = {
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height
  };
  let a = r.body;
  [r, n].forEach((L) => {
    const x = [], O = L.hFlip, Y = L.vFlip;
    let R = L.rotate;
    O ? Y ? R += 2 : (x.push("translate(" + (o.width + o.left).toString() + " " + (0 - o.top).toString() + ")"), x.push("scale(-1 1)"), o.top = o.left = 0) : Y && (x.push("translate(" + (0 - o.left).toString() + " " + (o.height + o.top).toString() + ")"), x.push("scale(1 -1)"), o.top = o.left = 0);
    let z;
    switch (R < 0 && (R -= Math.floor(R / 4) * 4), R = R % 4, R) {
      case 1:
        z = o.height / 2 + o.top, x.unshift("rotate(90 " + z.toString() + " " + z.toString() + ")");
        break;
      case 2:
        x.unshift("rotate(180 " + (o.width / 2 + o.left).toString() + " " + (o.height / 2 + o.top).toString() + ")");
        break;
      case 3:
        z = o.width / 2 + o.left, x.unshift("rotate(-90 " + z.toString() + " " + z.toString() + ")");
        break;
    }
    R % 2 === 1 && (o.left !== o.top && (z = o.left, o.left = o.top, o.top = z), o.width !== o.height && (z = o.width, o.width = o.height, o.height = z)), x.length && (a = J_(a, '<g transform="' + x.join(" ") + '">', "</g>"));
  });
  const i = n.width, s = n.height, l = o.width, c = o.height;
  let u, d;
  i === null ? (d = s === null ? "1em" : s === "auto" ? c : s, u = I1(d, l / c)) : (u = i === "auto" ? l : i, d = s === null ? I1(u, c / l) : s === "auto" ? c : s);
  const p = {}, m = (L, x) => {
    ew(x) || (p[L] = x.toString());
  };
  m("width", u), m("height", d);
  const y = [
    o.left,
    o.top,
    l,
    c
  ];
  return p.viewBox = y.join(" "), {
    attributes: p,
    viewBox: y,
    body: a
  };
}
const rw = /\sid="(\S+)"/g, nw = "IconifyId" + Date.now().toString(16) + (Math.random() * 16777216 | 0).toString(16);
let ow = 0;
function aw(e, t = nw) {
  const r = [];
  let n;
  for (; n = rw.exec(e); ) r.push(n[1]);
  if (!r.length) return e;
  const o = "suffix" + (Math.random() * 16777216 | Date.now()).toString(16);
  return r.forEach((a) => {
    const i = typeof t == "function" ? t(a) : t + (ow++).toString(), s = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    e = e.replace(new RegExp('([#;"])(' + s + ')([")]|\\.[a-z])', "g"), "$1" + i + o + "$3");
  }), e = e.replace(new RegExp(o, "g"), ""), e;
}
const Lc = /* @__PURE__ */ Object.create(null);
function iw(e, t) {
  Lc[e] = t;
}
function Cc(e) {
  return Lc[e] || Lc[""];
}
function ef(e) {
  let t;
  if (typeof e.resources == "string") t = [e.resources];
  else if (t = e.resources, !(t instanceof Array) || !t.length) return null;
  return {
    resources: t,
    path: e.path || "/",
    maxURL: e.maxURL || 500,
    rotate: e.rotate || 750,
    timeout: e.timeout || 5e3,
    random: e.random === !0,
    index: e.index || 0,
    dataAfterTimeout: e.dataAfterTimeout !== !1
  };
}
const tf = /* @__PURE__ */ Object.create(null), Qa = ["https://api.simplesvg.com", "https://api.unisvg.com"], Ji = [];
for (; Qa.length > 0; ) Qa.length === 1 || Math.random() > 0.5 ? Ji.push(Qa.shift()) : Ji.push(Qa.pop());
tf[""] = ef({ resources: ["https://api.iconify.design"].concat(Ji) });
function sw(e, t) {
  const r = ef(t);
  return r === null ? !1 : (tf[e] = r, !0);
}
function rf(e) {
  return tf[e];
}
const lw = () => {
  let e;
  try {
    if (e = fetch, typeof e == "function") return e;
  } catch {
  }
};
let N1 = lw();
function cw(e, t) {
  const r = rf(e);
  if (!r) return 0;
  let n;
  if (!r.maxURL) n = 0;
  else {
    let o = 0;
    r.resources.forEach((i) => {
      o = Math.max(o, i.length);
    });
    const a = t + ".json?icons=";
    n = r.maxURL - o - r.path.length - a.length;
  }
  return n;
}
function fw(e) {
  return e === 404;
}
const uw = (e, t, r) => {
  const n = [], o = cw(e, t), a = "icons";
  let i = {
    type: a,
    provider: e,
    prefix: t,
    icons: []
  }, s = 0;
  return r.forEach((l, c) => {
    s += l.length + 1, s >= o && c > 0 && (n.push(i), i = {
      type: a,
      provider: e,
      prefix: t,
      icons: []
    }, s = l.length), i.icons.push(l);
  }), n.push(i), n;
};
function dw(e) {
  if (typeof e == "string") {
    const t = rf(e);
    if (t) return t.path;
  }
  return "/";
}
const pw = (e, t, r) => {
  if (!N1) {
    r("abort", 424);
    return;
  }
  let n = dw(t.provider);
  switch (t.type) {
    case "icons": {
      const a = t.prefix, s = t.icons.join(","), l = new URLSearchParams({ icons: s });
      n += a + ".json?" + l.toString();
      break;
    }
    case "custom": {
      const a = t.uri;
      n += a.slice(0, 1) === "/" ? a.slice(1) : a;
      break;
    }
    default:
      r("abort", 400);
      return;
  }
  let o = 503;
  N1(e + n).then((a) => {
    const i = a.status;
    if (i !== 200) {
      setTimeout(() => {
        r(fw(i) ? "abort" : "next", i);
      });
      return;
    }
    return o = 501, a.json();
  }).then((a) => {
    if (typeof a != "object" || a === null) {
      setTimeout(() => {
        a === 404 ? r("abort", a) : r("next", o);
      });
      return;
    }
    setTimeout(() => {
      r("success", a);
    });
  }).catch(() => {
    r("next", o);
  });
}, mw = {
  prepare: uw,
  send: pw
};
function n3(e, t) {
  e.forEach((r) => {
    const n = r.loaderCallbacks;
    n && (r.loaderCallbacks = n.filter((o) => o.id !== t));
  });
}
function hw(e) {
  e.pendingCallbacksFlag || (e.pendingCallbacksFlag = !0, setTimeout(() => {
    e.pendingCallbacksFlag = !1;
    const t = e.loaderCallbacks ? e.loaderCallbacks.slice(0) : [];
    if (!t.length) return;
    let r = !1;
    const n = e.provider, o = e.prefix;
    t.forEach((a) => {
      const i = a.icons, s = i.pending.length;
      i.pending = i.pending.filter((l) => {
        if (l.prefix !== o) return !0;
        const c = l.name;
        if (e.icons[c]) i.loaded.push({
          provider: n,
          prefix: o,
          name: c
        });
        else if (e.missing.has(c)) i.missing.push({
          provider: n,
          prefix: o,
          name: c
        });
        else
          return r = !0, !0;
        return !1;
      }), i.pending.length !== s && (r || n3([e], a.id), a.callback(i.loaded.slice(0), i.missing.slice(0), i.pending.slice(0), a.abort));
    });
  }));
}
let yw = 0;
function bw(e, t, r) {
  const n = yw++, o = n3.bind(null, r, n);
  if (!t.pending.length) return o;
  const a = {
    id: n,
    icons: t,
    callback: e,
    abort: o
  };
  return r.forEach((i) => {
    (i.loaderCallbacks || (i.loaderCallbacks = [])).push(a);
  }), o;
}
function gw(e) {
  const t = {
    loaded: [],
    missing: [],
    pending: []
  }, r = /* @__PURE__ */ Object.create(null);
  e.sort((o, a) => o.provider !== a.provider ? o.provider.localeCompare(a.provider) : o.prefix !== a.prefix ? o.prefix.localeCompare(a.prefix) : o.name.localeCompare(a.name));
  let n = {
    provider: "",
    prefix: "",
    name: ""
  };
  return e.forEach((o) => {
    if (n.name === o.name && n.prefix === o.prefix && n.provider === o.provider) return;
    n = o;
    const a = o.provider, i = o.prefix, s = o.name, l = r[a] || (r[a] = /* @__PURE__ */ Object.create(null)), c = l[i] || (l[i] = va(a, i));
    let u;
    s in c.icons ? u = t.loaded : i === "" || c.missing.has(s) ? u = t.missing : u = t.pending;
    const d = {
      provider: a,
      prefix: i,
      name: s
    };
    u.push(d);
  }), t;
}
function Aw(e, t = !0, r = !1) {
  const n = [];
  return e.forEach((o) => {
    const a = typeof o == "string" ? O0(o, t, r) : o;
    a && n.push(a);
  }), n;
}
const vw = {
  resources: [],
  index: 0,
  timeout: 2e3,
  rotate: 750,
  random: !1,
  dataAfterTimeout: !1
};
function _w(e, t, r, n) {
  const o = e.resources.length, a = e.random ? Math.floor(Math.random() * o) : e.index;
  let i;
  if (e.random) {
    let I = e.resources.slice(0);
    for (i = []; I.length > 1; ) {
      const N = Math.floor(Math.random() * I.length);
      i.push(I[N]), I = I.slice(0, N).concat(I.slice(N + 1));
    }
    i = i.concat(I);
  } else i = e.resources.slice(a).concat(e.resources.slice(0, a));
  const s = Date.now();
  let l = "pending", c = 0, u, d = null, p = [], m = [];
  typeof n == "function" && m.push(n);
  function y() {
    d && (clearTimeout(d), d = null);
  }
  function L() {
    l === "pending" && (l = "aborted"), y(), p.forEach((I) => {
      I.status === "pending" && (I.status = "aborted");
    }), p = [];
  }
  function x(I, N) {
    N && (m = []), typeof I == "function" && m.push(I);
  }
  function O() {
    return {
      startTime: s,
      payload: t,
      status: l,
      queriesSent: c,
      queriesPending: p.length,
      subscribe: x,
      abort: L
    };
  }
  function Y() {
    l = "failed", m.forEach((I) => {
      I(void 0, u);
    });
  }
  function R() {
    p.forEach((I) => {
      I.status === "pending" && (I.status = "aborted");
    }), p = [];
  }
  function z(I, N, ne) {
    const de = N !== "success";
    switch (p = p.filter((oe) => oe !== I), l) {
      case "pending":
        break;
      case "failed":
        if (de || !e.dataAfterTimeout) return;
        break;
      default:
        return;
    }
    if (N === "abort") {
      u = ne, Y();
      return;
    }
    if (de) {
      u = ne, p.length || (i.length ? j() : Y());
      return;
    }
    if (y(), R(), !e.random) {
      const oe = e.resources.indexOf(I.resource);
      oe !== -1 && oe !== e.index && (e.index = oe);
    }
    l = "completed", m.forEach((oe) => {
      oe(ne);
    });
  }
  function j() {
    if (l !== "pending") return;
    y();
    const I = i.shift();
    if (I === void 0) {
      if (p.length) {
        d = setTimeout(() => {
          y(), l === "pending" && (R(), Y());
        }, e.timeout);
        return;
      }
      Y();
      return;
    }
    const N = {
      status: "pending",
      resource: I,
      callback: (ne, de) => {
        z(N, ne, de);
      }
    };
    p.push(N), c++, d = setTimeout(j, e.rotate), r(I, t, N.callback);
  }
  return setTimeout(j), O;
}
function o3(e) {
  const t = {
    ...vw,
    ...e
  };
  let r = [];
  function n() {
    r = r.filter((s) => s().status === "pending");
  }
  function o(s, l, c) {
    const u = _w(t, s, l, (d, p) => {
      n(), c && c(d, p);
    });
    return r.push(u), u;
  }
  function a(s) {
    return r.find((l) => s(l)) || null;
  }
  return {
    query: o,
    find: a,
    setIndex: (s) => {
      t.index = s;
    },
    getIndex: () => t.index,
    cleanup: n
  };
}
function O1() {
}
const sc = /* @__PURE__ */ Object.create(null);
function ww(e) {
  if (!sc[e]) {
    const t = rf(e);
    if (!t) return;
    const r = o3(t), n = {
      config: t,
      redundancy: r
    };
    sc[e] = n;
  }
  return sc[e];
}
function xw(e, t, r) {
  let n, o;
  if (typeof e == "string") {
    const a = Cc(e);
    if (!a)
      return r(void 0, 424), O1;
    o = a.send;
    const i = ww(e);
    i && (n = i.redundancy);
  } else {
    const a = ef(e);
    if (a) {
      n = o3(a);
      const i = e.resources ? e.resources[0] : "", s = Cc(i);
      s && (o = s.send);
    }
  }
  return !n || !o ? (r(void 0, 424), O1) : n.query(t, o, r)().abort;
}
function P1() {
}
function Ew(e) {
  e.iconsLoaderFlag || (e.iconsLoaderFlag = !0, setTimeout(() => {
    e.iconsLoaderFlag = !1, hw(e);
  }));
}
function Sw(e) {
  const t = [], r = [];
  return e.forEach((n) => {
    (n.match(Q2) ? t : r).push(n);
  }), {
    valid: t,
    invalid: r
  };
}
function Ja(e, t, r) {
  function n() {
    const o = e.pendingIcons;
    t.forEach((a) => {
      o && o.delete(a), e.icons[a] || e.missing.add(a);
    });
  }
  if (r && typeof r == "object") try {
    if (!K2(e, r).length) {
      n();
      return;
    }
  } catch (o) {
    console.error(o);
  }
  n(), Ew(e);
}
function D1(e, t) {
  e instanceof Promise ? e.then((r) => {
    t(r);
  }).catch(() => {
    t(null);
  }) : t(e);
}
function kw(e, t) {
  e.iconsToLoad ? e.iconsToLoad = e.iconsToLoad.concat(t).sort() : e.iconsToLoad = t, e.iconsQueueFlag || (e.iconsQueueFlag = !0, setTimeout(() => {
    e.iconsQueueFlag = !1;
    const { provider: r, prefix: n } = e, o = e.iconsToLoad;
    if (delete e.iconsToLoad, !o || !o.length) return;
    const a = e.loadIcon;
    if (e.loadIcons && (o.length > 1 || !a)) {
      D1(e.loadIcons(o, n, r), (u) => {
        Ja(e, o, u);
      });
      return;
    }
    if (a) {
      o.forEach((u) => {
        const d = a(u, n, r);
        D1(d, (p) => {
          const m = p ? {
            prefix: n,
            icons: { [u]: p }
          } : null;
          Ja(e, [u], m);
        });
      });
      return;
    }
    const { valid: i, invalid: s } = Sw(o);
    if (s.length && Ja(e, s, null), !i.length) return;
    const l = n.match(Q2) ? Cc(r) : null;
    if (!l) {
      Ja(e, i, null);
      return;
    }
    l.prepare(r, n, i).forEach((u) => {
      xw(r, u, (d) => {
        Ja(e, u.icons, d);
      });
    });
  }));
}
const a3 = (e, t) => {
  const r = Aw(e, !0, J2()), n = gw(r);
  if (!n.pending.length) {
    let l = !0;
    return t && setTimeout(() => {
      l && t(n.loaded, n.missing, n.pending, P1);
    }), () => {
      l = !1;
    };
  }
  const o = /* @__PURE__ */ Object.create(null), a = [];
  let i, s;
  return n.pending.forEach((l) => {
    const { provider: c, prefix: u } = l;
    if (u === s && c === i) return;
    i = c, s = u, a.push(va(c, u));
    const d = o[c] || (o[c] = /* @__PURE__ */ Object.create(null));
    d[u] || (d[u] = []);
  }), n.pending.forEach((l) => {
    const { provider: c, prefix: u, name: d } = l, p = va(c, u), m = p.pendingIcons || (p.pendingIcons = /* @__PURE__ */ new Set());
    m.has(d) || (m.add(d), o[c][u].push(d));
  }), a.forEach((l) => {
    const c = o[l.provider][l.prefix];
    c.length && kw(l, c);
  }), t ? bw(t, n, a) : P1;
}, Tw = (e) => new Promise((t, r) => {
  const n = typeof e == "string" ? O0(e, !0) : e;
  if (!n) {
    r(e);
    return;
  }
  a3([n || e], (o) => {
    if (o.length && n) {
      const a = v0(n);
      if (a) {
        t({
          ...N0,
          ...a
        });
        return;
      }
    }
    r(e);
  });
});
function Mw(e, t) {
  const r = { ...e };
  for (const n in t) {
    const o = t[n], a = typeof o;
    n in t3 ? (o === null || o && (a === "string" || a === "number")) && (r[n] = o) : a === typeof r[n] && (r[n] = n === "rotate" ? o % 4 : o);
  }
  return r;
}
const Lw = /[\s,]+/;
function Cw(e, t) {
  t.split(Lw).forEach((r) => {
    switch (r.trim()) {
      case "horizontal":
        e.hFlip = !0;
        break;
      case "vertical":
        e.vFlip = !0;
        break;
    }
  });
}
function Rw(e, t = 0) {
  const r = e.replace(/^-?[0-9.]*/, "");
  function n(o) {
    for (; o < 0; ) o += 4;
    return o % 4;
  }
  if (r === "") {
    const o = parseInt(e);
    return isNaN(o) ? 0 : n(o);
  } else if (r !== e) {
    let o = 0;
    switch (r) {
      case "%":
        o = 25;
        break;
      case "deg":
        o = 90;
    }
    if (o) {
      let a = parseFloat(e.slice(0, e.length - r.length));
      return isNaN(a) ? 0 : (a = a / o, a % 1 === 0 ? n(a) : 0);
    }
  }
  return t;
}
function Iw(e, t) {
  let r = e.indexOf("xlink:") === -1 ? "" : ' xmlns:xlink="http://www.w3.org/1999/xlink"';
  for (const n in t) r += " " + n + '="' + t[n] + '"';
  return '<svg xmlns="http://www.w3.org/2000/svg"' + r + ">" + e + "</svg>";
}
function Nw(e) {
  return e.replace(/"/g, "'").replace(/%/g, "%25").replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/\s+/g, " ");
}
function Ow(e) {
  return "data:image/svg+xml," + Nw(e);
}
function Pw(e) {
  return 'url("' + Ow(e) + '")';
}
let c0;
function Dw() {
  try {
    c0 = window.trustedTypes.createPolicy("iconify", { createHTML: (e) => e });
  } catch {
    c0 = null;
  }
}
function Bw(e) {
  return c0 === void 0 && Dw(), c0 ? c0.createHTML(e) : e;
}
const i3 = {
  ...r3,
  inline: !1
}, Gw = {
  xmlns: "http://www.w3.org/2000/svg",
  xmlnsXlink: "http://www.w3.org/1999/xlink",
  "aria-hidden": !0,
  role: "img"
}, Fw = {
  display: "inline-block"
}, Rc = {
  backgroundColor: "currentColor"
}, s3 = {
  backgroundColor: "transparent"
}, B1 = {
  Image: "var(--svg)",
  Repeat: "no-repeat",
  Size: "100% 100%"
}, G1 = {
  WebkitMask: Rc,
  mask: Rc,
  background: s3
};
for (const e in G1) {
  const t = G1[e];
  for (const r in B1)
    t[e + r] = B1[r];
}
const $w = {
  ...i3,
  inline: !0
};
function F1(e) {
  return e + (e.match(/^[-0-9.]+$/) ? "px" : "");
}
const zw = (e, t, r) => {
  const n = t.inline ? $w : i3, o = Mw(n, t), a = t.mode || "svg", i = {}, s = t.style || {}, l = {
    ...a === "svg" ? Gw : {}
  };
  if (r) {
    const x = O0(r, !1, !0);
    if (x) {
      const O = ["iconify"], Y = [
        "provider",
        "prefix"
      ];
      for (const R of Y)
        x[R] && O.push("iconify--" + x[R]);
      l.className = O.join(" ");
    }
  }
  for (let x in t) {
    const O = t[x];
    if (O !== void 0)
      switch (x) {
        case "icon":
        case "style":
        case "children":
        case "onLoad":
        case "mode":
        case "ssr":
        case "fallback":
          break;
        case "_ref":
          l.ref = O;
          break;
        case "className":
          l[x] = (l[x] ? l[x] + " " : "") + O;
          break;
        case "inline":
        case "hFlip":
        case "vFlip":
          o[x] = O === !0 || O === "true" || O === 1;
          break;
        case "flip":
          typeof O == "string" && Cw(o, O);
          break;
        case "color":
          i.color = O;
          break;
        case "rotate":
          typeof O == "string" ? o[x] = Rw(O) : typeof O == "number" && (o[x] = O);
          break;
        case "ariaHidden":
        case "aria-hidden":
          O !== !0 && O !== "true" && delete l["aria-hidden"];
          break;
        default:
          n[x] === void 0 && (l[x] = O);
      }
  }
  const c = tw(e, o), u = c.attributes;
  if (o.inline && (i.verticalAlign = "-0.125em"), a === "svg") {
    l.style = {
      ...i,
      ...s
    }, Object.assign(l, u);
    let x = 0, O = t.id;
    return typeof O == "string" && (O = O.replace(/-/g, "_")), l.dangerouslySetInnerHTML = {
      __html: Bw(aw(c.body, O ? () => O + "ID" + x++ : "iconifyReact"))
    }, uc("svg", l);
  }
  const { body: d, width: p, height: m } = e, y = a === "mask" || (a === "bg" ? !1 : d.indexOf("currentColor") !== -1), L = Iw(d, {
    ...u,
    width: p + "",
    height: m + ""
  });
  return l.style = {
    ...i,
    "--svg": Pw(L),
    width: F1(u.width),
    height: F1(u.height),
    ...Fw,
    ...y ? Rc : s3,
    ...s
  }, uc("span", l);
};
J2(!0);
iw("", mw);
if (typeof document < "u" && typeof window < "u") {
  const e = window;
  if (e.IconifyPreload !== void 0) {
    const t = e.IconifyPreload, r = "Invalid IconifyPreload syntax.";
    typeof t == "object" && t !== null && (t instanceof Array ? t : [t]).forEach((n) => {
      try {
        // Check if item is an object and not null/array
        (typeof n != "object" || n === null || n instanceof Array || // Check for 'icons' and 'prefix'
        typeof n.icons != "object" || typeof n.prefix != "string" || // Add icon set
        !V_(n)) && console.error(r);
      } catch {
        console.error(r);
      }
    });
  }
  if (e.IconifyProviders !== void 0) {
    const t = e.IconifyProviders;
    if (typeof t == "object" && t !== null)
      for (let r in t) {
        const n = "IconifyProviders[" + r + "] is invalid.";
        try {
          const o = t[r];
          if (typeof o != "object" || !o || o.resources === void 0)
            continue;
          sw(r, o) || console.error(n);
        } catch {
          console.error(n);
        }
      }
  }
}
function l3(e) {
  const [t, r] = Mt(!!e.ssr), [n, o] = Mt({});
  function a(m) {
    if (m) {
      const y = e.icon;
      if (typeof y == "object")
        return {
          name: "",
          data: y
        };
      const L = v0(y);
      if (L)
        return {
          name: y,
          data: L
        };
    }
    return {
      name: ""
    };
  }
  const [i, s] = Mt(a(!!e.ssr));
  function l() {
    const m = n.callback;
    m && (m(), o({}));
  }
  function c(m) {
    if (JSON.stringify(i) !== JSON.stringify(m))
      return l(), s(m), !0;
  }
  function u() {
    var m;
    const y = e.icon;
    if (typeof y == "object") {
      c({
        name: "",
        data: y
      });
      return;
    }
    const L = v0(y);
    if (c({
      name: y,
      data: L
    }))
      if (L === void 0) {
        const x = a3([y], u);
        o({
          callback: x
        });
      } else L && ((m = e.onLoad) === null || m === void 0 || m.call(e, y));
  }
  ur(() => (r(!0), l), []), ur(() => {
    t && u();
  }, [e.icon, t]);
  const { name: d, data: p } = i;
  return p ? zw({
    ...N0,
    ...p
  }, e, d) : e.children ? e.children : e.fallback ? e.fallback : uc("span", {});
}
const jw = mo((e, t) => l3({
  ...e,
  _ref: t
}));
mo((e, t) => l3({
  inline: !0,
  ...e,
  _ref: t
}));
const qw = "_tqIcon_j6cb8_1", Hw = "_char_j6cb8_5", Gi = {
  tqIcon: qw,
  char: Hw
}, c3 = "tq-icon-cache";
function Uw() {
  try {
    return typeof localStorage > "u" ? {} : JSON.parse(localStorage.getItem(c3) || "{}");
  } catch {
    return {};
  }
}
const _0 = Uw();
for (const [e, t] of Object.entries(_0))
  e3(e, t);
let $1;
function Vw() {
  clearTimeout($1), $1 = setTimeout(() => {
    try {
      localStorage.setItem(c3, JSON.stringify(_0));
    } catch {
    }
  }, 500);
}
function z1(e) {
  if (_0[e]) return;
  const t = W_(e);
  t && (_0[e] = t, Vw());
}
function Xw(e) {
  if (!_0[e]) {
    if (X_(e)) {
      z1(e);
      return;
    }
    Tw(e).then(() => z1(e)).catch(() => {
    });
  }
}
function Ww(e) {
  return e.startsWith("char:") ? { type: "char", value: e.slice(5) } : e.startsWith("fill:") ? { type: "fill", value: e.slice(5) } : { type: "iconify", value: e };
}
function fn({ icon: e, className: t, ...r }) {
  const n = Ww(e);
  ur(() => {
    n.type === "iconify" && Xw(n.value);
  }, [n.type, n.value]);
  const o = Ft(
    Gi.tqIcon,
    n.type === "iconify" && Gi.iconify,
    n.type === "char" && Gi.char,
    n.type === "fill" && Gi.fill,
    t
  );
  return n.type === "char" ? /* @__PURE__ */ fe(
    "div",
    {
      ...r,
      className: o,
      children: n.value
    }
  ) : n.type === "fill" ? /* @__PURE__ */ fe(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      ...r,
      className: o,
      children: /* @__PURE__ */ fe("path", { fill: "currentColor", d: n.value })
    }
  ) : /* @__PURE__ */ fe(jw, { icon: n.value, ...r, className: o });
}
const Yw = "_bindIcon_14hrl_1", Zw = "_icon_14hrl_6", j1 = {
  bindIcon: Yw,
  icon: Zw
};
function Kw({ icon: e, className: t, ...r }) {
  return /* @__PURE__ */ fe("div", { ...r, className: Ft(j1.bindIcon, t), children: e.map(
    (n, o) => typeof n == "string" ? /* @__PURE__ */ fe("span", { children: n }, o) : /* @__PURE__ */ fe(fn, { className: j1.icon, icon: n.icon }, o)
  ) });
}
const Qw = "_tqBalloon_178gz_1", Jw = "_fill_178gz_12", ex = "_stroke_178gz_19", tx = "_content_178gz_30", rx = "_flash_178gz_34", e0 = {
  tqBalloon: Qw,
  fill: Jw,
  stroke: ex,
  content: tx,
  flash: rx
};
function nx({
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
  const c = ze(null), { width: u, height: d } = Bo(c), p = dr(
    () => Kb(u, d, {
      arrowSide: e,
      arrowOffset: t,
      radius: r
    }),
    [t, e, d, r, u]
  );
  return /* @__PURE__ */ Ht(
    "div",
    {
      ...l,
      className: Ft(e0.tqBalloon, o && e0.flash, a),
      "data-tq-balloon": "",
      style: {
        ...i,
        ...p.wrapperPadding,
        transformOrigin: p.transformOrigin
      },
      children: [
        /* @__PURE__ */ fe(
          "div",
          {
            className: e0.fill,
            style: {
              clipPath: p.path ? `path('${p.path}')` : void 0
            }
          }
        ),
        /* @__PURE__ */ fe(
          "svg",
          {
            className: e0.stroke,
            viewBox: `0 0 ${p.layerWidth} ${p.layerHeight}`,
            width: p.layerWidth,
            height: p.layerHeight,
            children: /* @__PURE__ */ fe("path", { d: p.path })
          }
        ),
        /* @__PURE__ */ fe("div", { ref: c, className: e0.content, style: { padding: n }, children: s })
      ]
    }
  );
}
const ox = "_popover_1064f_1", ax = "_animateExit_1064f_13", q1 = {
  popover: ox,
  animateExit: ax
};
let ix = 0;
const Fi = {
  shiftX: 0,
  shiftY: 0,
  arrowOffset: 0
};
function Ms({
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
  onClose: d,
  className: p,
  style: m,
  children: y,
  ...L
}) {
  const x = ze(null), [O] = Mt(
    () => `--tq-popover-${ix++}`
  ), Y = l ?? O, [R, z] = Mt(Fi), j = ze(R);
  j.current = R, vn(() => {
    if (!(l || !e))
      return e9(e, Y);
  }, [Y, l, e]);
  const I = io(
    (ge = !1) => {
      const te = x.current;
      if (!e || !te || typeof r != "string") return;
      const Ie = ge ? Fi : j.current, Ke = og({
        reference: e.getBoundingClientRect(),
        popover: te.getBoundingClientRect(),
        placement: r,
        currentShiftX: Ie.shiftX,
        currentShiftY: Ie.shiftY,
        viewportWidth: document.documentElement.clientWidth,
        viewportHeight: document.documentElement.clientHeight,
        arrow: a
      });
      j.current = Ke, z(
        (Ye) => Ye.shiftX === Ke.shiftX && Ye.shiftY === Ke.shiftY && Ye.arrowSide === Ke.arrowSide && Ye.arrowOffset === Ke.arrowOffset ? Ye : Ke
      );
    },
    [a, r, e]
  );
  vn(() => {
    const ge = x.current;
    if (!ge) return;
    let te;
    try {
      t ? (ge.matches(":popover-open") || ge.showPopover(), j.current = Fi, z(Fi), I(!0), te = requestAnimationFrame(() => I())) : ge.matches(":popover-open") && ge.hidePopover();
    } catch {
    }
    return () => {
      te !== void 0 && cancelAnimationFrame(te);
    };
  }, [t, I]), Wr(x, "toggle", (ge) => {
    const te = ge.newState === "open";
    te || d == null || d(), u == null || u(te);
  }), Wr(
    typeof window > "u" ? null : window,
    "keydown",
    (ge) => {
      ge.key === "Escape" && t && o && (d == null || d(), u == null || u(!1));
    }
  ), Wr(
    typeof document > "u" ? null : document,
    "scroll",
    () => I(),
    { capture: !0, passive: !0 }
  ), Wr(
    typeof window > "u" ? null : window,
    "resize",
    () => I()
  ), ks(x, () => I());
  const ne = {
    ...dr(
      () => ng(r, n, Y),
      [Y, n, r]
    ),
    ...R.shiftX || R.shiftY ? { transform: `translate(${R.shiftX}px, ${R.shiftY}px)` } : {},
    ...m
  };
  if (!t && !c) return null;
  const de = /* @__PURE__ */ fe(
    "div",
    {
      ...L,
      ref: x,
      className: Ft(
        q1.popover,
        c && q1.animateExit,
        p
      ),
      popover: o ? "auto" : "manual",
      style: ne,
      children: a ? /* @__PURE__ */ fe(
        nx,
        {
          arrowSide: R.arrowSide,
          arrowOffset: R.arrowOffset,
          flash: i,
          children: y
        }
      ) : y
    }
  );
  if (!s || typeof document > "u") return de;
  const oe = document.querySelector(s);
  return oe ? kh(de, oe) : de;
}
const sx = "_tqMenu_1fo58_1", lx = "_separator_1fo58_14", cx = "_menu_1fo58_20", fx = "_submenuOpen_1fo58_30", ux = "_active_1fo58_33", dx = "_icon_1fo58_37", px = "_labelContainer_1fo58_40", mx = "_label_1fo58_40", hx = "_bindIcon_1fo58_49", yx = "_groupChevron_1fo58_52", kn = {
  tqMenu: sx,
  separator: lx,
  menu: cx,
  submenuOpen: fx,
  active: ux,
  icon: dx,
  labelContainer: px,
  label: mx,
  bindIcon: hx,
  groupChevron: yx
}, f3 = mo(function({ items: t, onClose: r }, n) {
  const o = Do(On, (I) => I.popupPadding), [a, i] = Mt(-1), [s, l] = Mt(-1), c = ze(null), u = ze([]), d = ze(null), p = ze({ x: 0, y: 0 }), m = ze({ x: 0, y: 0 });
  T0(n, () => ({ getRoot: () => c.current }), []);
  const y = t[a], L = y && "children" in y ? y.children : void 0, x = a === -1 ? null : u.current[a], O = () => !!L, Y = () => {
    var de;
    const I = (de = d.current) == null ? void 0 : de.getRoot();
    if (!I) return null;
    const N = I.getBoundingClientRect(), ne = N.left >= p.current.x ? N.left : N.right;
    return {
      c1: { x: ne, y: N.top },
      c2: { x: ne, y: N.bottom }
    };
  }, R = (I) => {
    const N = Y();
    return !!(N && rg(I, m.current, N.c1, N.c2));
  }, z = (I, N) => {
    l(I), p.current = { x: N.clientX, y: N.clientY }, (!O() || !R(p.current)) && i(I);
  }, j = (I) => {
    p.current = { x: I.clientX, y: I.clientY }, O() && !R(p.current) && s !== -1 && s !== a && i(s), m.current = p.current;
  };
  return /* @__PURE__ */ Ht(Xn, { children: [
    /* @__PURE__ */ fe(
      "ul",
      {
        ref: c,
        className: kn.tqMenu,
        onPointerMove: j,
        onPointerLeave: () => l(-1),
        children: t.map(
          (I, N) => "separator" in I ? /* @__PURE__ */ fe(
            "li",
            {
              ref: (ne) => {
                u.current[N] = ne;
              },
              className: kn.separator
            },
            `${N}_separator`
          ) : /* @__PURE__ */ Ht(
            "li",
            {
              ref: (ne) => {
                u.current[N] = ne;
              },
              className: Ft(
                kn.menu,
                N === a && s === N && kn.active,
                N === a && s !== N && "children" in I && kn.submenuOpen
              ),
              onClick: () => {
                "perform" in I && I.perform && (I.perform(), r == null || r());
              },
              onPointerEnter: (ne) => z(N, ne),
              children: [
                I.icon ? /* @__PURE__ */ fe(fn, { className: kn.icon, icon: I.icon }) : /* @__PURE__ */ fe("span", {}),
                /* @__PURE__ */ Ht("div", { className: kn.labelContainer, children: [
                  /* @__PURE__ */ fe("span", { className: kn.label, children: I.shortLabel ?? I.label }),
                  "bindIcon" in I && I.bindIcon && /* @__PURE__ */ fe(Kw, { className: kn.bindIcon, icon: I.bindIcon }),
                  "children" in I && /* @__PURE__ */ fe(
                    fn,
                    {
                      className: kn.groupChevron,
                      icon: "mdi:chevron-right"
                    }
                  )
                ] })
              ]
            },
            `${N}_item`
          )
        )
      }
    ),
    x && L && /* @__PURE__ */ fe(
      Ms,
      {
        reference: x,
        placement: "right-start",
        open: !0,
        offset: { crossAxis: -o },
        lightDismiss: !1,
        children: /* @__PURE__ */ fe(f3, { ref: d, items: L, onClose: r })
      }
    )
  ] });
}), bx = "_tqInputTextBase_pzar5_1", gx = "_hover_pzar5_58", Ax = "_active_pzar5_62", vx = "_input_pzar5_66", _x = "_invalid_pzar5_73", wx = "_inactiveContent_pzar5_77", xx = "_icon_pzar5_82", Ex = "_left_pzar5_82", Sx = "_right_pzar5_86", kx = "_hasInactiveContent_pzar5_98", Tx = "_ignore_pzar5_101", sn = {
  tqInputTextBase: bx,
  hover: gx,
  active: Ax,
  input: vx,
  invalid: _x,
  inactiveContent: wx,
  icon: xx,
  left: Ex,
  right: Sx,
  hasInactiveContent: kx,
  ignore: Tx
}, u3 = mo(function({
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
  default: d,
  menuItems: p,
  disabled: m,
  invalid: y,
  inlinePosition: L,
  blockPosition: x,
  onFocus: O,
  onBlur: Y,
  onKeyDown: R,
  onConfirm: z,
  onReset: j,
  onChangeFocused: I,
  renderBack: N,
  renderFront: ne,
  renderInactiveContent: de,
  onContextMenu: oe,
  className: ge,
  ...te
}, Ie) {
  const Ke = ze(null), Ye = ze(null), [it, Xe] = Mt(!1), [Qe, xt] = Mt([0, 0]), nt = !!de, ut = dr(() => {
    const Pe = [];
    return d !== void 0 && Pe.push({
      label: "Reset to Default",
      icon: "mdi:restore",
      perform: () => j == null ? void 0 : j()
    }), p != null && p.length && (Pe.length && Pe.push({ separator: !0 }), Pe.push(...p)), Pe;
  }, [d, p, j]);
  T0(
    Ie,
    () => ({
      select(Pe, Ot) {
        var Q, Be, V;
        Pe === void 0 ? (Q = Ye.current) == null || Q.select() : ((Be = Ye.current) == null || Be.setSelectionRange(Pe, Ot ?? Pe + 1), (V = Ye.current) == null || V.focus());
      },
      blur: () => {
        var Pe;
        return (Pe = Ye.current) == null ? void 0 : Pe.blur();
      },
      getRoot: () => Ke.current,
      getInput: () => Ye.current
    }),
    []
  );
  const Pt = (Pe) => {
    oe == null || oe(Pe), !(Pe.defaultPrevented || ut.length === 0) && (Pe.preventDefault(), xt([Pe.clientX, Pe.clientY]), Xe(!0));
  };
  return /* @__PURE__ */ Ht(
    "div",
    {
      ...te,
      theme: i,
      font: s,
      align: l,
      "inline-position": L,
      "block-position": x,
      ref: Ke,
      className: Ft(
        sn.tqInputTextBase,
        a && sn.active,
        y && sn.invalid,
        o && sn.hover,
        ge
      ),
      onContextMenu: Pt,
      children: [
        N == null ? void 0 : N(),
        /* @__PURE__ */ fe(
          "input",
          {
            ref: Ye,
            className: Ft(
              sn.input,
              n && sn.ignore,
              nt && sn.hasInactiveContent
            ),
            type: "text",
            value: t,
            disabled: m || void 0,
            onFocus: (Pe) => {
              I == null || I(!0), O == null || O(Pe);
            },
            onBlur: (Pe) => {
              I == null || I(!1), Y == null || Y(Pe);
            },
            onChange: (Pe) => r == null ? void 0 : r(Pe.currentTarget.value),
            onKeyDown: (Pe) => {
              !Pe.metaKey && !Pe.ctrlKey && Pe.key !== "Escape" && Pe.key !== "Enter" && Pe.key !== "Tab" && Pe.stopPropagation(), R == null || R(Pe), Pe.key === "Enter" && (z == null || z());
            }
          }
        ),
        nt && /* @__PURE__ */ fe("div", { className: sn.inactiveContent, children: de == null ? void 0 : de() }),
        c && /* @__PURE__ */ fe(
          fn,
          {
            className: Ft(sn.icon, sn.left),
            icon: c
          }
        ),
        u && /* @__PURE__ */ fe(
          fn,
          {
            className: Ft(sn.icon, sn.right),
            icon: u
          }
        ),
        ne == null ? void 0 : ne(),
        it && /* @__PURE__ */ fe(
          Ms,
          {
            reference: Ke.current,
            placement: Qe,
            open: it,
            teleport: ".TqViewport",
            onChangeOpen: Xe,
            children: /* @__PURE__ */ fe(f3, { items: ut, onClose: () => Xe(!1) })
          }
        )
      ]
    }
  );
}), Mx = "_tqInputNumber_qhtzy_1", Lx = "_belowRange_qhtzy_18", Cx = "_aboveRange_qhtzy_23", Rx = "_tweaking_qhtzy_28", Ix = "_displayAtInactive_qhtzy_32", Nx = "_prefix_qhtzy_40", Ox = "_suffix_qhtzy_41", Px = "_bar_qhtzy_50", Dx = "_handle_qhtzy_51", Bx = "_scrubZone_qhtzy_85", Gx = "_top_qhtzy_90", Fx = "_bottom_qhtzy_93", $x = "_edge_qhtzy_100", zx = "_wide_qhtzy_104", jx = "_grip_qhtzy_113", qx = "_gripHint_qhtzy_128", Hx = "_overlay_qhtzy_136", Ux = "_scale_qhtzy_143", yr = {
  tqInputNumber: Mx,
  belowRange: Lx,
  aboveRange: Cx,
  tweaking: Rx,
  displayAtInactive: Ix,
  prefix: Nx,
  suffix: Ox,
  bar: Px,
  handle: Dx,
  scrubZone: Bx,
  top: Gx,
  bottom: Fx,
  edge: $x,
  wide: zx,
  grip: jx,
  gripHint: qx,
  overlay: Hx,
  scale: Ux
}, Vx = "_scales_12fuz_1", Xx = {
  scales: Vx
};
function Wx({ min: e, max: t, step: r }) {
  const n = ze(null), { width: o } = Bo(n), a = e === void 0 || t === void 0 || r === void 0 || o === 0 ? 0 : r / (t - e) * o, i = dr(
    () => a >= 10 ? { backgroundSize: `${a}px 100%` } : void 0,
    [a]
  );
  return /* @__PURE__ */ fe("div", { ref: n, className: Xx.scales, style: i });
}
const Yx = ["Alt", "Shift", "q"], Ln = mo(
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
    prefix: d = "",
    suffix: p = "",
    leftIcon: m,
    rightIcon: y,
    default: L,
    disabled: x,
    invalid: O,
    inlinePosition: Y,
    blockPosition: R,
    onFocus: z,
    onBlur: j,
    onConfirm: I,
    className: N,
    ...ne
  }, de) {
    const oe = ze(null), ge = dr(
      () => ({
        get current() {
          var lt;
          return ((lt = oe.current) == null ? void 0 : lt.getRoot()) ?? null;
        }
      }),
      []
    ), { left: te, right: Ie, width: Ke } = Bo(ge), [Ye, it] = Mt(t), [Xe, Qe] = Mt(""), [xt, nt] = Mt(!1), [ut, Pt] = Mt(!1), [Pe, Ot] = Mt(), [Q, Be] = Mt(!1), [V, Ge] = Mt(1), [vt, jt] = Mt(1), [er, ht] = Mt(!1), pt = Jc(Yx), Rt = ze(t);
    Rt.current = t;
    const We = ze(Ye);
    We.current = Ye;
    const Et = ze(xt);
    Et.current = xt;
    const Gt = ze(Q);
    Gt.current = Q;
    const bt = ze(V);
    bt.current = V;
    const Fe = ze(er);
    Fe.current = er;
    const st = ze(pt);
    st.current = pt;
    const Ut = ze({ left: te, right: Ie, width: Ke });
    Ut.current = { left: te, right: Ie, width: Ke };
    const tr = ze({
      min: n,
      max: o,
      step: a,
      snap: i,
      bar: s,
      clampMin: l,
      clampMax: c,
      precisionLimit: u,
      disabled: x
    });
    tr.current = {
      min: n,
      max: o,
      step: a,
      snap: i,
      bar: s,
      clampMin: l,
      clampMax: c,
      precisionLimit: u,
      disabled: x
    };
    const g = ze({ onChange: r, onFocus: z, onBlur: j, onConfirm: I });
    g.current = { onChange: r, onFocus: z, onBlur: j, onConfirm: I };
    const tn = ze(0), rn = ze(t), wr = l ? n : Number.MIN_SAFE_INTEGER, Tr = c ? o : Number.MAX_SAFE_INTEGER, T = s !== !1 && n !== Number.MIN_SAFE_INTEGER && o !== Number.MAX_SAFE_INTEGER && Ke > 0, Z = (pt.Alt ? 0.1 : 1) * (pt.Shift ? i : 1), Ae = Z * V, rt = U9({
      step: a,
      display: Xe,
      width: Ke,
      min: n,
      max: o,
      tweaking: Q,
      speed: Ae,
      precision: u
    }), Tt = (lt) => Q ? lt.toFixed(rt) : Qb(lt, rt), or = ze(Tt);
    or.current = Tt;
    const Zr = () => {
      const lt = tr.current;
      return M_(
        k_(
          lt.clampMin ? lt.min : Number.MIN_SAFE_INTEGER,
          lt.clampMax ? lt.max : Number.MAX_SAFE_INTEGER
        ),
        T1(lt.step ?? 0),
        T1(Fe.current ? lt.snap : 0)
      );
    }, Nr = dr(
      () => Zr(),
      [c, l, o, n, i, er, a]
    ), { validateResult: bo } = U2(Ye, Nr), pn = (lt, Wt) => {
      var Yt, gt;
      it(lt), We.current = lt, Wt && Qe(Tt(lt));
      const Kt = Zr()(lt);
      Kt.value !== void 0 && Kt.value !== Rt.current && ((gt = (Yt = g.current).onChange) == null || gt.call(Yt, Kt.value));
    }, nn = Ts({
      type: "number",
      getElement: () => ge.current,
      getSpeed: () => T && Ut.current.width > 0 ? (tr.current.max - tr.current.min) / Ut.current.width : 1,
      getValue: () => We.current,
      setValue: (lt) => {
        var Kt, Yt;
        const Wt = Zr()(Number(lt));
        Wt.value !== void 0 && (it(Wt.value), We.current = Wt.value, (!Et.current || Gt.current) && Qe(Tt(Wt.value)), (Yt = (Kt = g.current).onChange) == null || Yt.call(Kt, Wt.value));
      },
      confirm: () => {
        var lt, Wt;
        return (Wt = (lt = g.current).onConfirm) == null ? void 0 : Wt.call(lt);
      }
    }), Kn = ze(nn);
    Kn.current = nn;
    const P0 = ze(() => {
    }), ka = () => {
      I == null || I(), nn.confirm(), nn.capture(), Pt(!1), Ot(void 0), queueMicrotask(() => {
        const lt = Rt.current;
        it(lt), Qe(or.current(lt));
      });
    };
    P0.current = ka;
    const Ls = dr(() => {
      let lt = 0, Wt = !1, Kt = {
        local: We.current,
        directionAverage: [1, 0],
        offsetWeight: 1,
        gestureSpeed: 1,
        deltaValue: 0
      };
      return {
        lockPointer: () => {
          const Yt = tr.current;
          return !(Yt.bar !== !1 && Yt.min !== Number.MIN_SAFE_INTEGER && Yt.max !== Number.MAX_SAFE_INTEGER && Ut.current.width > 0);
        },
        disabled: () => !!tr.current.disabled,
        shouldDrag(Yt) {
          var gt;
          return Et.current ? !!((gt = Yt.target) != null && gt.closest("[data-number-scrub]")) : !0;
        },
        onClick() {
          var Yt;
          (Yt = oe.current) == null || Yt.select();
        },
        onDragStart(Yt, gt) {
          var Qn, G0, F0;
          const Br = tr.current, Dn = Ut.current, La = Br.bar !== !1 && Br.min !== Number.MIN_SAFE_INTEGER && Br.max !== Number.MAX_SAFE_INTEGER && Dn.width > 0, Go = !!((Qn = gt.target) != null && Qn.closest("[data-number-scrub]"));
          if (Wt = Et.current, La && Br.min <= Rt.current && Rt.current <= Br.max && !Go) {
            const $0 = Zt.fit(
              Yt.xy[0],
              Dn.left,
              Dn.right,
              Br.min,
              Br.max
            );
            pn($0, !0), Kn.current.update(() => $0);
          }
          lt = 0, Kt = {
            local: We.current,
            directionAverage: [1, 0],
            offsetWeight: 1,
            gestureSpeed: 1,
            deltaValue: 0
          }, Ge(1), jt(1), Be(!0), Gt.current = !0, Kn.current.setFocusing(!0), Wt || (F0 = (G0 = g.current).onFocus) == null || F0.call(G0), Kn.current.capture();
        },
        onDrag(Yt) {
          const gt = tr.current, Br = Ut.current, Dn = gt.bar !== !1 && gt.min !== Number.MIN_SAFE_INTEGER && gt.max !== Number.MAX_SAFE_INTEGER && Br.width > 0, La = (st.current.Alt ? 0.1 : 1) * (st.current.Shift ? gt.snap : 1);
          let Go = 10 ** -gt.precisionLimit;
          if (gt.step && Dn) {
            const Qn = (gt.max - gt.min) / gt.step;
            Go = 10 ** -Vi(Br.width / Qn);
          }
          Kt = V9({
            state: Kt,
            delta: Yt.delta,
            barVisible: Dn,
            min: gt.min,
            max: gt.max,
            width: Br.width,
            step: gt.step,
            speed: La * Kt.gestureSpeed,
            minSpeed: Go,
            maxSpeed: Dn ? 1 : 1e3
          }), Ge(Kt.gestureSpeed), bt.current = Kt.gestureSpeed, jt(Kt.offsetWeight), ht(st.current.q), Fe.current = st.current.q, pn(Kt.local, !0), lt += Kt.deltaValue, Kn.current.update((Qn) => Number(Qn) + lt);
        },
        onDragEnd() {
          var Yt, gt;
          Be(!1), Gt.current = !1, Kn.current.setFocusing(Et.current), P0.current(), Wt ? queueMicrotask(() => {
            var Br;
            return (Br = oe.current) == null ? void 0 : Br.select();
          }) : (gt = (Yt = g.current).onBlur) == null || gt.call(Yt);
        }
      };
    }, []);
    I0(ge, Ls), ur(() => {
      Q && (ht(pt.q), Fe.current = pt.q);
    }, [pt.q, Q]), vn(() => {
      Object.is(rn.current, t) || (rn.current = t, t !== Zr()(We.current).value && (it(t), We.current = t), (!Et.current || Gt.current) && Qe(Tt(t)));
    }, [t]), vn(() => {
      Xe || Qe(Tt(t));
    }, []), T0(
      de,
      () => ({
        select: () => {
          var lt;
          return (lt = oe.current) == null ? void 0 : lt.select();
        },
        blur: () => {
          var lt;
          return (lt = oe.current) == null ? void 0 : lt.blur();
        }
      }),
      []
    );
    const Ta = n <= t && t <= o, D0 = T && t < n, Cs = T && t > o, Rs = Ta && (t <= n || t >= o), Mr = Zt.invlerp(n, o, t), Ma = Zt.clamp(Mr, 0, 1), Is = typeof s == "number" ? s : 0, B0 = Zt.invlerp(n, o, Is), Ns = Math.min(B0, Mr), Os = 1 - Math.max(B0, Mr), Ps = !!a && l && c && n !== Number.MIN_SAFE_INTEGER && o !== Number.MAX_SAFE_INTEGER;
    return /* @__PURE__ */ fe(
      u3,
      {
        ...ne,
        ref: oe,
        className: Ft(
          yr.tqInputNumber,
          D0 && yr.belowRange,
          Cs && yr.aboveRange,
          Q && yr.tweaking,
          N
        ),
        value: Xe,
        ignoreInput: !xt,
        active: nn.subfocus,
        font: ut ? "monospace" : "numeric",
        align: "center",
        inlinePosition: Y,
        blockPosition: R,
        disabled: x,
        invalid: O || !Q && (bo.log.length > 0 || !!Pe),
        leftIcon: m,
        rightIcon: y,
        default: L,
        onFocus: () => {
          nt(!0), Et.current = !0, nn.setFocusing(!0), nn.capture(), z == null || z(), queueMicrotask(() => {
            var lt;
            return (lt = oe.current) == null ? void 0 : lt.select();
          });
        },
        onBlur: () => {
          ka(), nt(!1), Et.current = !1, nn.setFocusing(!1), j == null || j();
        },
        onChange: (lt) => {
          Qe(lt), !/^[0-9.]*$/.test(lt) && !ut && (tn.current = We.current, Pt(!0));
          try {
            const Wt = W9(lt), Kt = Wt(tn.current, { i: nn.index });
            pn(Kt, !1), Ot(void 0), nn.update(Wt);
          } catch (Wt) {
            Ot(Wt.message);
          }
        },
        onKeyDown: (lt) => {
          if (lt.metaKey && lt.key === "=")
            lt.preventDefault(), tn.current = We.current, Pt(!0);
          else if (lt.key === "ArrowUp" || lt.key === "ArrowDown") {
            lt.preventDefault();
            const Wt = lt.key === "ArrowUp" ? 1 : -1;
            let Kt = We.current;
            if (a) Kt += a * Wt * Math.max(1, Z);
            else {
              let Yt = Z;
              Tr - wr <= 1 && (Yt *= 0.1), Kt = Zt.clamp(
                Kt + Wt * Yt,
                wr,
                Tr
              );
            }
            pn(Kt, !0);
          }
        },
        onConfirm: ka,
        onReset: () => {
          L !== void 0 && (r == null || r(L), I == null || I());
        },
        renderInactiveContent: () => /* @__PURE__ */ Ht("div", { className: yr.displayAtInactive, children: [
          d && /* @__PURE__ */ fe("span", { className: yr.prefix, children: d }),
          Xe,
          p && /* @__PURE__ */ fe("span", { className: yr.suffix, children: p })
        ] }),
        renderBack: () => /* @__PURE__ */ Ht(Xn, { children: [
          /* @__PURE__ */ fe(
            "div",
            {
              className: yr.bar,
              style: T ? { left: p0(Ns), right: p0(Os) } : { visibility: "hidden" }
            }
          ),
          /* @__PURE__ */ fe(Wx, { min: n, max: o, step: a }),
          Q && !Ps && /* @__PURE__ */ fe("svg", { className: yr.overlay, children: [0, 1, 2].map((lt) => {
            const Wt = Zt.mod(
              -Math.log(V) / Math.log(10) + lt,
              3
            );
            return /* @__PURE__ */ fe(
              "line",
              {
                className: yr.scale,
                x1: -Ke / 2,
                x2: Ke / 2,
                style: {
                  "--offset-weight": vt,
                  "--gesture-precision": Wt,
                  opacity: Math.pow(
                    Zt.smoothstep(1, 2, Wt),
                    0.5
                  )
                }
              },
              lt
            );
          }) }),
          /* @__PURE__ */ fe(
            "div",
            {
              className: Ft(yr.handle, yr.scrub),
              "data-number-scrub": "",
              style: T ? { left: `calc((100% - 1px) * ${Mr})` } : { visibility: "hidden" }
            }
          )
        ] }),
        renderFront: () => /* @__PURE__ */ fe(Xn, { children: T ? Ta ? Rs ? /* @__PURE__ */ fe(t0, { edge: !0, position: Ma }) : /* @__PURE__ */ Ht(Xn, { children: [
          /* @__PURE__ */ fe(t0, { top: !0, position: Ma }),
          /* @__PURE__ */ fe(t0, { bottom: !0, position: Ma })
        ] }) : /* @__PURE__ */ Ht(Xn, { children: [
          /* @__PURE__ */ fe(t0, { top: !0, wide: !0 }),
          /* @__PURE__ */ fe(t0, { bottom: !0, wide: !0 })
        ] }) : /* @__PURE__ */ fe(
          "div",
          {
            className: Ft(yr.scrub, yr.grip),
            "data-number-scrub": "",
            children: !m && /* @__PURE__ */ fe(
              fn,
              {
                className: yr.gripHint,
                icon: "mdi:arrow-left-right"
              }
            )
          }
        ) })
      }
    );
  }
);
function t0({
  top: e,
  bottom: t,
  edge: r,
  wide: n,
  position: o
}) {
  return /* @__PURE__ */ fe(
    "div",
    {
      className: Ft(
        yr.scrubZone,
        yr.scrub,
        e && yr.top,
        t && yr.bottom,
        r && yr.edge,
        n && yr.wide
      ),
      "data-number-scrub": "",
      style: o === void 0 ? void 0 : {
        left: `clamp(0px, calc((100% - 1px) * ${o} - var(--tq-input-height) / 2), calc(100% - var(--tq-input-height)))`
      }
    }
  );
}
const nf = mo(
  function({
    value: t,
    onChange: r,
    theme: n,
    font: o,
    align: a,
    validator: i = T_,
    default: s,
    disabled: l,
    invalid: c,
    inlinePosition: u,
    blockPosition: d,
    onFocus: p,
    onBlur: m,
    onConfirm: y,
    ...L
  }, x) {
    const [O, Y] = Mt(t), [R, z] = Mt(t), [j, I] = Mt(!1), [N, ne] = Mt(!1), [de, oe] = Mt(), ge = ze(null), te = ze(t);
    te.current = t;
    const Ie = ze(O);
    Ie.current = O;
    const Ke = ze(j);
    Ke.current = j;
    const Ye = ze(i);
    Ye.current = i;
    const it = ze({ onChange: r, onConfirm: y });
    it.current = { onChange: r, onConfirm: y };
    const Xe = ze(""), Qe = ze(t), { validateResult: xt } = U2(O, i);
    vn(() => {
      Object.is(Qe.current, t) || (Qe.current = t, Y(t), Ke.current || z(t));
    }, [t]);
    const nt = (Pe, Ot) => {
      var Be, V;
      Y(Pe), Ie.current = Pe, Ot && z(Pe);
      const Q = Ye.current(Pe);
      Q.value !== void 0 && Q.value !== te.current && ((V = (Be = it.current).onChange) == null || V.call(Be, Q.value));
    }, ut = Ts({
      type: "string",
      getElement: () => {
        var Pe;
        return ((Pe = ge.current) == null ? void 0 : Pe.getRoot()) ?? null;
      },
      getValue: () => Ie.current,
      setValue: (Pe) => nt(String(Pe), !Ke.current),
      confirm: () => {
        var Pe, Ot;
        return (Ot = (Pe = it.current).onConfirm) == null ? void 0 : Ot.call(Pe);
      }
    }), Pt = () => {
      y == null || y(), ut.capture(), ut.confirm(), ne(!1), oe(void 0), queueMicrotask(() => {
        const Pe = te.current;
        Y(Pe), z(Pe);
      });
    };
    return T0(
      x,
      () => ({
        select: () => {
          var Pe;
          return (Pe = ge.current) == null ? void 0 : Pe.select();
        },
        blur: () => {
          var Pe;
          return (Pe = ge.current) == null ? void 0 : Pe.blur();
        }
      }),
      []
    ), /* @__PURE__ */ fe(
      u3,
      {
        ...L,
        ref: ge,
        value: R,
        active: ut.subfocus,
        theme: n,
        font: o ?? (N ? "monospace" : void 0),
        align: a,
        inlinePosition: u,
        blockPosition: d,
        disabled: l,
        invalid: c || xt.log.length > 0 || !!de,
        default: s,
        onFocus: () => {
          I(!0), Ke.current = !0, ut.setFocusing(!0), ut.capture(), p == null || p();
        },
        onBlur: () => {
          Pt(), I(!1), Ke.current = !1, ut.setFocusing(!1), m == null || m();
        },
        onChange: (Pe) => {
          if (z(Pe), N)
            try {
              const Ot = v_(Pe), Q = Ot(Xe.current, { i: ut.index });
              nt(Q, !1), oe(void 0), ut.update(Ot);
            } catch (Ot) {
              oe(Ot.message), ut.update((Q) => Q);
            }
          else
            nt(Pe, !1), ut.update(() => Pe);
        },
        onKeyDown: (Pe) => {
          Pe.metaKey && Pe.key === "=" && (Pe.preventDefault(), ne(!0), z(`"${Ie.current}"`), Xe.current = Ie.current);
        },
        onConfirm: Pt,
        onReset: () => {
          s !== void 0 && (r == null || r(s));
        }
      }
    );
  }
), Zx = "_inputColor_2lt1e_1", Kx = "_onlyPad_2lt1e_4", Qx = "_colorCode_2lt1e_11", Jx = "_padTweaking_2lt1e_14", eE = "_alpha_2lt1e_17", r0 = {
  inputColor: Zx,
  onlyPad: Kx,
  colorCode: Qx,
  padTweaking: Jx,
  alpha: eE
};
var d3 = `precision mediump float;

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
}`, p3 = `precision mediump float;

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
}`, tE = `precision mediump float;

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
const rE = "_glslCanvas_1jm9o_1", nE = {
  glslCanvas: rE
}, oE = `
	precision mediump float;
	varying vec2 uv;
	void main() { gl_FragColor = vec4(uv, 0, 1); }
`, f0 = mo(
  function({
    fragmentString: t = oE,
    uniforms: r = {},
    className: n,
    alt: o = "",
    ...a
  }, i) {
    const s = ze(null);
    return T0(i, () => s.current, []), ks(s, () => {
      const l = s.current;
      l && bd(l, t, r);
    }), ur(() => {
      const l = s.current;
      if (l)
        return bd(l, t, r);
    }, [t, r]), /* @__PURE__ */ fe(
      "img",
      {
        ...a,
        ref: s,
        alt: o,
        className: Ft(nE.glslCanvas, n)
      }
    );
  }
), aE = "_tqTooltip_rl3hb_1", iE = {
  tqTooltip: aE
};
function m3({ className: e, ...t }) {
  return /* @__PURE__ */ fe("div", { ...t, className: Ft(iE.tqTooltip, e) });
}
const sE = "_tqTweakOverlay_ngyk5_1", lE = {
  tqTweakOverlay: sE
};
function h3({
  children: e,
  className: t,
  ...r
}) {
  const n = ze(null);
  return ur(() => {
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
  }, []), /* @__PURE__ */ fe(
    "div",
    {
      ...r,
      ref: n,
      className: Ft(lE.tqTweakOverlay, t),
      popover: "manual",
      children: e
    }
  );
}
const cE = "_padButton_w9man_1", fE = "_defaultButton_w9man_7", uE = "_focus_w9man_41", dE = "_tweaking_w9man_43", pE = "_floating_w9man_47", mE = "_overlay_w9man_60", hE = "_overlayPad_w9man_99", yE = "_wheel_w9man_100", bE = "_overlaySlider_w9man_101", gE = "_verticalSlider_w9man_129", AE = "_tweakPreview_w9man_132", vE = "_overlayLabel_w9man_147", _E = "_labelValue_w9man_154", Ur = {
  padButton: cE,
  defaultButton: fE,
  focus: uE,
  tweaking: dE,
  floating: pE,
  overlay: mE,
  overlayPad: hE,
  wheel: yE,
  overlaySlider: bE,
  verticalSlider: gE,
  tweakPreview: AE,
  overlayLabel: vE,
  labelValue: _E
}, wE = "_pad_yz1op_1", xE = "_canvas_yz1op_6", EE = "_circle_yz1op_16", SE = "_tweaking_yz1op_30", $i = {
  pad: wE,
  canvas: xE,
  circle: EE,
  tweaking: SE
};
function kE({
  value: e,
  onChange: t,
  axes: r
}) {
  const n = ze(null), o = ze(e), a = ze({ value: e, onChange: t, axes: r });
  a.current = { value: e, onChange: t, axes: r };
  const i = dr(
    () => ({
      dragDelaySeconds: 0,
      onDragStart: (p, m) => {
        var x, O;
        if (o.current = a.current.value, m.target !== n.current) return;
        const y = (p.xy[0] - p.left) / (p.right - p.left), L = (p.bottom - p.xy[1]) / (p.bottom - p.top);
        o.current = so(
          o.current,
          a.current.axes[0],
          y
        ), o.current = so(
          o.current,
          a.current.axes[1],
          L
        ), (O = (x = a.current).onChange) == null || O.call(x, o.current);
      },
      onDrag: (p) => {
        var y, L;
        let m = Un(
          o.current,
          a.current.axes[0],
          (p.xy[0] - p.initial[0]) / p.width
        );
        m = Un(
          m,
          a.current.axes[1],
          (p.initial[1] - p.xy[1]) / p.height
        ), (L = (y = a.current).onChange) == null || L.call(y, m);
      }
    }),
    []
  ), s = I0(n, i), l = dr(() => {
    const { h: p, s: m, v: y, a: L } = e;
    return { hsva: [p, m, y, L], axes: r.map(s0) };
  }, [r, e]), c = Ro(e, r[0]), u = Ro(e, r[1]), d = s.dragging && s.left <= s.xy[0] && s.right >= s.xy[0] && s.top <= s.xy[1] && s.bottom >= s.xy[1];
  return /* @__PURE__ */ Ht(
    "div",
    {
      ref: n,
      className: $i.pad,
      style: { cursor: d ? "none" : void 0 },
      children: [
        /* @__PURE__ */ fe(
          f0,
          {
            className: $i.canvas,
            fragmentString: d3,
            uniforms: l
          }
        ),
        /* @__PURE__ */ fe(
          "div",
          {
            className: `${$i.circle} ${s.dragging ? $i.tweaking : ""}`,
            style: {
              left: p0(c),
              bottom: p0(u),
              background: la({ ...e, a: 1 })
            }
          }
        )
      ]
    }
  );
}
const TE = "_slider_9lc6m_1", ME = "_canvas_9lc6m_6", LE = "_circle_9lc6m_16", CE = "_tweaking_9lc6m_30", zi = {
  slider: TE,
  canvas: ME,
  circle: LE,
  tweaking: CE
};
function RE({
  value: e,
  onChange: t,
  axis: r
}) {
  const n = ze(null), o = ze(e), a = ze({ value: e, onChange: t, axis: r });
  a.current = { value: e, onChange: t, axis: r };
  const i = dr(
    () => ({
      dragDelaySeconds: 0,
      onDragStart: (u, d) => {
        var m, y;
        if (o.current = a.current.value, d.target !== n.current) return;
        const p = (u.xy[0] - u.left) / (u.right - u.left);
        o.current = so(o.current, a.current.axis, p), (y = (m = a.current).onChange) == null || y.call(m, o.current);
      },
      onDrag: (u) => {
        var d, p;
        (p = (d = a.current).onChange) == null || p.call(
          d,
          Un(
            o.current,
            a.current.axis,
            (u.xy[0] - u.initial[0]) / u.width
          )
        );
      }
    }),
    []
  ), s = I0(n, i), l = dr(() => {
    const { h: u, s: d, v: p, a: m } = e;
    return { hsva: [u, d, p, m], axis: s0(r), offset: 0 };
  }, [r, e]), c = s.dragging && s.left <= s.xy[0] && s.right >= s.xy[0] && s.top <= s.xy[1] && s.bottom >= s.xy[1];
  return /* @__PURE__ */ Ht(
    "div",
    {
      ref: n,
      className: zi.slider,
      style: { cursor: c ? "none" : void 0 },
      children: [
        /* @__PURE__ */ fe(
          f0,
          {
            className: zi.canvas,
            fragmentString: p3,
            uniforms: l
          }
        ),
        /* @__PURE__ */ fe(
          "button",
          {
            type: "button",
            "aria-label": `${r.toUpperCase()} channel`,
            className: `${zi.circle} ${s.dragging ? zi.tweaking : ""}`,
            style: {
              left: p0(Ro(e, r)),
              background: la({ ...e, a: 1 })
            }
          }
        )
      ]
    }
  );
}
var IE = {
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
  Extended_Pictographic: 8192
};
const NE = "ABAOAAAAAACwiAAAAYkHdvjtnH+IFkUYxx/v3vPe7uw8UkjsD43ChKICDQsT3iIJy4gSiZAjkn5JUFlaiFmjccT9ESkpGBGVIlQgWSkY/QDBoMgrQv0jRJDAfkCXhUmgRX23d4ebnndmd3Z3ZnfVeeDDzM7MPs8zv57Zd2+5hd1Ed4ClYAisBuuUsqLpMHgJjIBNFu1fBW8l1O8AO8Ee8Cn4HIyCg+CI0u4Y+AmMgVPgDOhuEHWBPjAZXAy2gjfA9kb73hlx+i7SK8AHYDf4BOwHB8AoOAyOguPgB/ArOKlcnwHdPe32/Uin9LTvvwTph0gv62nbubKnXT+nZ1z/DcjfFF8vQno7uEaxH923BGVXN9v5Zcgvj/VFPIT8Y/H1k0jXxPn1SEfARjBdab8V+TfB22CXUh5xd3OcZTH3g6di1LZJbLNs55q96M9n4J9Gm6hsfzQvcT8fbfy//TyUf8vG4Lses/5jcd2PSE/IcQan4/o/UXYadE0kaoJBMG1ivNbidNbETr1XoWyuplwyHFN0fFai/8/EY7BIKY/68EpCvwP+mc/m/2vNGnBhp1eZ51bCmgsEAoFAIBAIBAKBQKAO3Irfrg3lfc4qi/cXd+Kee5TfvAd6ieY0ie5D2cNx+eNInwZLmu33gWuRn4/8C3H9CNJNYEt8/TrS35HuSPktvRP1z0LPOvAceB4IsB5saIa6UBfqQl2oc123AjwBVjWrP7MCgcC5y/ue/56yqXv87+qcIU2Z+ny8tuHHpyxsvrDNITDXgqkDRJcPdJY/wMo24/oQmDqZaPHkdplAuhv8ApqDRDeCVj/OAvD9BUSX9qF8Qpt7lTxnZ7+5TmVtrGMM7XchP3sS0SNgGzg4yU5HIBAIBM5NfsO5QDgfjuM54STOw7/Az/F3QtfhfF4Qn9F/gxMouxm/WU7F9afBQuUM7+rtPF+jb0b6ese/I7sI+emadhEzUT5bqbsW+esNbSMWoG6hWo/8gOLPUqUu+v5rKEHX8oS6iEXQexd7XlmBe1aCNWAp6kSsYyjHc82Liv2Xkd/C/HkN1w/Geren+KryToa2PtlQg2c9zijGZnGJ9kaibzZh84jmmfx4TeYpK9H3usMKqxnDCWxsdLY/3ygy9h+l/LYbYHtuXw2/rfsSPo0a/Jrn6PvPrzL2+7CmfV88lkc9j+F7cRzYU4N48DF8uA3n/T7Fly9q4Jdvoth0uLf9LORC11hvO/0D6RnQfRa99+2Hr1NS/M26VvfEe2jaWTAOvG8zzgKf8zCrYL++qUEfbumeQAjTVnQp+QmW99gQpDoJ4+9uHZe5/l3OW/M8x6WUZaduUvUc5p13NTXlz3VpGbCVrGNe5zOnjvGlrDWY1IdWShuuQ9fWh6h+VSV1Wit1lvNhHFz1zeUYtCg5ntvOSStDW5cITRnF5RJ+rcasJHExztwu910tl6LzLYsvuvvzilB0mvSaxt/V+SY0EMurfkjbrTjfInf+FJGkNdzSlOukZaDo3snqs7RZpqj2Gx7sS52D5O79k+93W2W/T3NhQxe3VeF16pwn4eI8qev7Sl1s0PnPy5PalSV57Pp6XuDxrypR9wBR8nOCzm/eXuYp5d4s/lV1XvL+lG2b+2AaQ1nPr23Hrc7z0WT5qvZL0v7QtdX5zdu6HMei+gV1ri8et4XSVpCfdeB7fRWNRy79UP0RCT4Jyre/88bbKsQUawUrV69dxjd+nlXxbCKos79pz1BpOqucz0gEdZ5hMk+aa7Wdy/7xZ5Yqhc+nyHivrkyQ/reM7tziuFojfM7zxtq0505XYutvHrtVnzNl2ONrTGdPkLv9ZjNHOoShnCh5nLLYKOKfK4qK7bjx/gqyj9lFJc2Wz/HIqyMSYaGnqM8+xp6vB1/6feg22UmLFUno1rurvelz7yT1UVfORW3L7+d6fMcAXdzxIVK3TNNioZpSyj2242izpky6y5S0fpr6q5ZXJT7O1qrmQRVB+rkQ1Dk3vvYttyGoc+51/mUVkYLtXvTx7MCvbUnzW2czyR8pql4XUlbcN9l1pSfPfOl0JV2bylyKoM4959sHQfr9Vpbk2V8u4ry0ndcvH5I1xggP9qVem/PHZL+qeGLrc945tLnHtG/LEtdjr4urxMpM92X1RZDd+pLtsorUydeCaiuvbtdSpQ9l2M4SU01nvI1e35L3uS5Jlw8pe1ykCKo2JtrGK9O9ujOlimcD6Y9LEWQ+7019d2VDLVPrTCLrsvjsQ1TfJVJM12pZmm5b4Xptx6HM9SpFkP2c6drJa5/iSr+pD7r+CNLvATVfpST1RYog/fwKTdsyxLVNQfnWrkyziGltJK2hLLptzjHXIsh+/HytmyQfpPA5VNtzXWWLzbiVsc9sbWSJ7UWE69KNh6v9kya2c6TzMa0fwpD37TtvQ6wuiw9CA9cny33Mj2pLte9Kp6996HO/83HPQ5r+ov5mvU9Qte/fIrGJP7axPO/9eXX6kjLPKZNd17iyZdOHLP31JSbfXY6hC59c+ZZ136TZ9SFlj6cvmVkSrkSQn3NG5KBqEVSeH6Ji/vvnhFWjSlfFNDwzyMgqLvvKxXffbeASBWo+Zj4p2x6TfwE=", OE = {
  data: NE
}, PE = "AAACAAAAAACAOAAAAbYBSf7t2S1IBEEYBuDVDZ7FYrQMNsFiu3hgEYOI0SCXRIUrB8JhEZtgs5gEg1GMFk02m82oGI02m+9xezCOczv/uwv3fvAwc/PzfXOzcdqzWdaBDdiGPdiHdjE+DS3RNDuCfsn8idQ/g3OH3BdwKf0e96/gumTfYcncLdzBPTzAo+RZ+f0Cr/AG7/AJX4738x1wtz9FO5PX/50n6UXMNdfg/0lERERERERERERERETpdedHBvDRql4nq0cXtW9af98qdRby0Vvp8K4W0V+C5Xw0t4J2bfjeBp3cnEu1brnnCTYNa7eKdz91XP7WO9Lb4GqRb7cY6xbtAdqeVOsY/QGcevw/tb6OT85YhvfKYEx9CMuxKsKnrs+eJtVInVvHJ0eVYVvTZk2siFVLOCjb61PTZX3MdVWEyP7fjzpmMxdzTyq2Ebue6x61nXRGnzndWpf1an7dXmGYE4Y1ptqqKsK1nu26Ju0ty+maV2Rpvk+qnDZjKUIobUiesdAQE/jmCTmHmsskpFZsVYbtmXRcaoSGUPomunW2derQhDPFjtT1Q/eb8vnm990fq35oHVt11bU9m89c7DNI8Qs=", DE = {
  data: PE
};
var of = 0, y3 = -3;
function w0() {
  this.table = new Uint16Array(16), this.trans = new Uint16Array(288);
}
function BE(e, t) {
  this.source = e, this.sourceIndex = 0, this.tag = 0, this.bitcount = 0, this.dest = t, this.destLen = 0, this.ltree = new w0(), this.dtree = new w0();
}
var b3 = new w0(), g3 = new w0(), af = new Uint8Array(30), sf = new Uint16Array(30), A3 = new Uint8Array(30), v3 = new Uint16Array(30), GE = new Uint8Array([
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
]), H1 = new w0(), Tn = new Uint8Array(320);
function _3(e, t, r, n) {
  var o, a;
  for (o = 0; o < r; ++o) e[o] = 0;
  for (o = 0; o < 30 - r; ++o) e[o + r] = o / r | 0;
  for (a = n, o = 0; o < 30; ++o)
    t[o] = a, a += 1 << e[o];
}
function FE(e, t) {
  var r;
  for (r = 0; r < 7; ++r) e.table[r] = 0;
  for (e.table[7] = 24, e.table[8] = 152, e.table[9] = 112, r = 0; r < 24; ++r) e.trans[r] = 256 + r;
  for (r = 0; r < 144; ++r) e.trans[24 + r] = r;
  for (r = 0; r < 8; ++r) e.trans[168 + r] = 280 + r;
  for (r = 0; r < 112; ++r) e.trans[176 + r] = 144 + r;
  for (r = 0; r < 5; ++r) t.table[r] = 0;
  for (t.table[5] = 32, r = 0; r < 32; ++r) t.trans[r] = r;
}
var U1 = new Uint16Array(16);
function lc(e, t, r, n) {
  var o, a;
  for (o = 0; o < 16; ++o) e.table[o] = 0;
  for (o = 0; o < n; ++o) e.table[t[r + o]]++;
  for (e.table[0] = 0, a = 0, o = 0; o < 16; ++o)
    U1[o] = a, a += e.table[o];
  for (o = 0; o < n; ++o)
    t[r + o] && (e.trans[U1[t[r + o]]++] = o);
}
function $E(e) {
  e.bitcount-- || (e.tag = e.source[e.sourceIndex++], e.bitcount = 7);
  var t = e.tag & 1;
  return e.tag >>>= 1, t;
}
function Cn(e, t, r) {
  if (!t)
    return r;
  for (; e.bitcount < 24; )
    e.tag |= e.source[e.sourceIndex++] << e.bitcount, e.bitcount += 8;
  var n = e.tag & 65535 >>> 16 - t;
  return e.tag >>>= t, e.bitcount -= t, n + r;
}
function Ic(e, t) {
  for (; e.bitcount < 24; )
    e.tag |= e.source[e.sourceIndex++] << e.bitcount, e.bitcount += 8;
  var r = 0, n = 0, o = 0, a = e.tag;
  do
    n = 2 * n + (a & 1), a >>>= 1, ++o, r += t.table[o], n -= t.table[o];
  while (n >= 0);
  return e.tag = a, e.bitcount -= o, t.trans[r + n];
}
function zE(e, t, r) {
  var n, o, a, i, s, l;
  for (n = Cn(e, 5, 257), o = Cn(e, 5, 1), a = Cn(e, 4, 4), i = 0; i < 19; ++i) Tn[i] = 0;
  for (i = 0; i < a; ++i) {
    var c = Cn(e, 3, 0);
    Tn[GE[i]] = c;
  }
  for (lc(H1, Tn, 0, 19), s = 0; s < n + o; ) {
    var u = Ic(e, H1);
    switch (u) {
      case 16:
        var d = Tn[s - 1];
        for (l = Cn(e, 2, 3); l; --l)
          Tn[s++] = d;
        break;
      case 17:
        for (l = Cn(e, 3, 3); l; --l)
          Tn[s++] = 0;
        break;
      case 18:
        for (l = Cn(e, 7, 11); l; --l)
          Tn[s++] = 0;
        break;
      default:
        Tn[s++] = u;
        break;
    }
  }
  lc(t, Tn, 0, n), lc(r, Tn, n, o);
}
function V1(e, t, r) {
  for (; ; ) {
    var n = Ic(e, t);
    if (n === 256)
      return of;
    if (n < 256)
      e.dest[e.destLen++] = n;
    else {
      var o, a, i, s;
      for (n -= 257, o = Cn(e, af[n], sf[n]), a = Ic(e, r), i = e.destLen - Cn(e, A3[a], v3[a]), s = i; s < i + o; ++s)
        e.dest[e.destLen++] = e.dest[s];
    }
  }
}
function jE(e) {
  for (var t, r, n; e.bitcount > 8; )
    e.sourceIndex--, e.bitcount -= 8;
  if (t = e.source[e.sourceIndex + 1], t = 256 * t + e.source[e.sourceIndex], r = e.source[e.sourceIndex + 3], r = 256 * r + e.source[e.sourceIndex + 2], t !== (~r & 65535))
    return y3;
  for (e.sourceIndex += 4, n = t; n; --n)
    e.dest[e.destLen++] = e.source[e.sourceIndex++];
  return e.bitcount = 0, of;
}
function qE(e, t) {
  var r = new BE(e, t), n, o, a;
  do {
    switch (n = $E(r), o = Cn(r, 2, 0), o) {
      case 0:
        a = jE(r);
        break;
      case 1:
        a = V1(r, b3, g3);
        break;
      case 2:
        zE(r, r.ltree, r.dtree), a = V1(r, r.ltree, r.dtree);
        break;
      default:
        a = y3;
    }
    if (a !== of)
      throw new Error("Data error");
  } while (!n);
  return r.destLen < r.dest.length ? typeof r.dest.slice == "function" ? r.dest.slice(0, r.destLen) : r.dest.subarray(0, r.destLen) : r.dest;
}
FE(b3, g3);
_3(af, sf, 4, 3);
_3(A3, v3, 2, 1);
af[28] = 0;
sf[28] = 258;
var HE = qE;
const UE = new Uint8Array(new Uint32Array([305419896]).buffer)[0] === 18, X1 = (e, t, r) => {
  let n = e[t];
  e[t] = e[r], e[r] = n;
}, VE = (e) => {
  const t = e.length;
  for (let r = 0; r < t; r += 4)
    X1(e, r, r + 3), X1(e, r + 1, r + 2);
}, XE = (e) => {
  UE && VE(e);
};
var WE = {
  swap32LE: XE
};
const W1 = HE, { swap32LE: YE } = WE, lf = 11, Po = 5, ZE = lf - Po, KE = 65536 >> lf, QE = 1 << ZE, JE = QE - 1, es = 2, eS = 1 << Po, cc = eS - 1, w3 = 65536 >> Po, tS = 1024 >> Po, rS = w3 + tS, nS = rS, oS = 32, aS = nS + oS, iS = 1 << es;
let sS = class {
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
      t = W1(t, new Uint8Array(n)), t = W1(t, new Uint8Array(n)), YE(t), this.data = new Uint32Array(t.buffer);
    } else
      ({ data: this.data, highStart: this.highStart, errorValue: this.errorValue } = t);
  }
  get(t) {
    let r;
    return t < 0 || t > 1114111 ? this.errorValue : t < 55296 || t > 56319 && t <= 65535 ? (r = (this.data[t >> Po] << es) + (t & cc), this.data[r]) : t <= 65535 ? (r = (this.data[w3 + (t - 55296 >> Po)] << es) + (t & cc), this.data[r]) : t < this.highStart ? (r = this.data[aS - KE + (t >> lf)], r = this.data[r + (t >> Po & JE)], r = (r << es) + (t & cc), this.data[r]) : this.data[this.data.length - iS];
  }
};
var lS = sS, x3 = { exports: {} };
(function(e, t) {
  (function(r, n) {
    e.exports = n();
  })(typeof self < "u" ? self : typeof window < "u" ? window : i0, function() {
    var r = "3.7.6", n = r, o = typeof atob == "function", a = typeof btoa == "function", i = typeof Buffer == "function", s = typeof TextDecoder == "function" ? new TextDecoder() : void 0, l = typeof TextEncoder == "function" ? new TextEncoder() : void 0, c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", u = Array.prototype.slice.call(c), d = function(V) {
      var Ge = {};
      return V.forEach(function(vt, jt) {
        return Ge[vt] = jt;
      }), Ge;
    }(u), p = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/, m = String.fromCharCode.bind(String), y = typeof Uint8Array.from == "function" ? Uint8Array.from.bind(Uint8Array) : function(V) {
      return new Uint8Array(Array.prototype.slice.call(V, 0));
    }, L = function(V) {
      return V.replace(/=/g, "").replace(/[+\/]/g, function(Ge) {
        return Ge == "+" ? "-" : "_";
      });
    }, x = function(V) {
      return V.replace(/[^A-Za-z0-9\+\/]/g, "");
    }, O = function(V) {
      for (var Ge, vt, jt, er, ht = "", pt = V.length % 3, Rt = 0; Rt < V.length; ) {
        if ((vt = V.charCodeAt(Rt++)) > 255 || (jt = V.charCodeAt(Rt++)) > 255 || (er = V.charCodeAt(Rt++)) > 255)
          throw new TypeError("invalid character found");
        Ge = vt << 16 | jt << 8 | er, ht += u[Ge >> 18 & 63] + u[Ge >> 12 & 63] + u[Ge >> 6 & 63] + u[Ge & 63];
      }
      return pt ? ht.slice(0, pt - 3) + "===".substring(pt) : ht;
    }, Y = a ? function(V) {
      return btoa(V);
    } : i ? function(V) {
      return Buffer.from(V, "binary").toString("base64");
    } : O, R = i ? function(V) {
      return Buffer.from(V).toString("base64");
    } : function(V) {
      for (var Ge = 4096, vt = [], jt = 0, er = V.length; jt < er; jt += Ge)
        vt.push(m.apply(null, V.subarray(jt, jt + Ge)));
      return Y(vt.join(""));
    }, z = function(V, Ge) {
      return Ge === void 0 && (Ge = !1), Ge ? L(R(V)) : R(V);
    }, j = function(V) {
      if (V.length < 2) {
        var Ge = V.charCodeAt(0);
        return Ge < 128 ? V : Ge < 2048 ? m(192 | Ge >>> 6) + m(128 | Ge & 63) : m(224 | Ge >>> 12 & 15) + m(128 | Ge >>> 6 & 63) + m(128 | Ge & 63);
      } else {
        var Ge = 65536 + (V.charCodeAt(0) - 55296) * 1024 + (V.charCodeAt(1) - 56320);
        return m(240 | Ge >>> 18 & 7) + m(128 | Ge >>> 12 & 63) + m(128 | Ge >>> 6 & 63) + m(128 | Ge & 63);
      }
    }, I = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g, N = function(V) {
      return V.replace(I, j);
    }, ne = i ? function(V) {
      return Buffer.from(V, "utf8").toString("base64");
    } : l ? function(V) {
      return R(l.encode(V));
    } : function(V) {
      return Y(N(V));
    }, de = function(V, Ge) {
      return Ge === void 0 && (Ge = !1), Ge ? L(ne(V)) : ne(V);
    }, oe = function(V) {
      return de(V, !0);
    }, ge = /[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/g, te = function(V) {
      switch (V.length) {
        case 4:
          var Ge = (7 & V.charCodeAt(0)) << 18 | (63 & V.charCodeAt(1)) << 12 | (63 & V.charCodeAt(2)) << 6 | 63 & V.charCodeAt(3), vt = Ge - 65536;
          return m((vt >>> 10) + 55296) + m((vt & 1023) + 56320);
        case 3:
          return m((15 & V.charCodeAt(0)) << 12 | (63 & V.charCodeAt(1)) << 6 | 63 & V.charCodeAt(2));
        default:
          return m((31 & V.charCodeAt(0)) << 6 | 63 & V.charCodeAt(1));
      }
    }, Ie = function(V) {
      return V.replace(ge, te);
    }, Ke = function(V) {
      if (V = V.replace(/\s+/g, ""), !p.test(V))
        throw new TypeError("malformed base64.");
      V += "==".slice(2 - (V.length & 3));
      for (var Ge, vt = "", jt, er, ht = 0; ht < V.length; )
        Ge = d[V.charAt(ht++)] << 18 | d[V.charAt(ht++)] << 12 | (jt = d[V.charAt(ht++)]) << 6 | (er = d[V.charAt(ht++)]), vt += jt === 64 ? m(Ge >> 16 & 255) : er === 64 ? m(Ge >> 16 & 255, Ge >> 8 & 255) : m(Ge >> 16 & 255, Ge >> 8 & 255, Ge & 255);
      return vt;
    }, Ye = o ? function(V) {
      return atob(x(V));
    } : i ? function(V) {
      return Buffer.from(V, "base64").toString("binary");
    } : Ke, it = i ? function(V) {
      return y(Buffer.from(V, "base64"));
    } : function(V) {
      return y(Ye(V).split("").map(function(Ge) {
        return Ge.charCodeAt(0);
      }));
    }, Xe = function(V) {
      return it(xt(V));
    }, Qe = i ? function(V) {
      return Buffer.from(V, "base64").toString("utf8");
    } : s ? function(V) {
      return s.decode(it(V));
    } : function(V) {
      return Ie(Ye(V));
    }, xt = function(V) {
      return x(V.replace(/[-_]/g, function(Ge) {
        return Ge == "-" ? "+" : "/";
      }));
    }, nt = function(V) {
      return Qe(xt(V));
    }, ut = function(V) {
      if (typeof V != "string")
        return !1;
      var Ge = V.replace(/\s+/g, "").replace(/={0,2}$/, "");
      return !/[^\s0-9a-zA-Z\+/]/.test(Ge) || !/[^\s0-9a-zA-Z\-_]/.test(Ge);
    }, Pt = function(V) {
      return {
        value: V,
        enumerable: !1,
        writable: !0,
        configurable: !0
      };
    }, Pe = function() {
      var V = function(Ge, vt) {
        return Object.defineProperty(String.prototype, Ge, Pt(vt));
      };
      V("fromBase64", function() {
        return nt(this);
      }), V("toBase64", function(Ge) {
        return de(this, Ge);
      }), V("toBase64URI", function() {
        return de(this, !0);
      }), V("toBase64URL", function() {
        return de(this, !0);
      }), V("toUint8Array", function() {
        return Xe(this);
      });
    }, Ot = function() {
      var V = function(Ge, vt) {
        return Object.defineProperty(Uint8Array.prototype, Ge, Pt(vt));
      };
      V("toBase64", function(Ge) {
        return z(this, Ge);
      }), V("toBase64URI", function() {
        return z(this, !0);
      }), V("toBase64URL", function() {
        return z(this, !0);
      });
    }, Q = function() {
      Pe(), Ot();
    }, Be = {
      version: r,
      VERSION: n,
      atob: Ye,
      atobPolyfill: Ke,
      btoa: Y,
      btoaPolyfill: O,
      fromBase64: nt,
      toBase64: de,
      encode: de,
      encodeURI: oe,
      encodeURL: oe,
      utob: N,
      btou: Ie,
      decode: nt,
      isValid: ut,
      fromUint8Array: z,
      toUint8Array: Xe,
      extendString: Pe,
      extendUint8Array: Ot,
      extendBuiltins: Q
    };
    return Be.Base64 = {}, Object.keys(Be).forEach(function(V) {
      return Be.Base64[V] = Be[V];
    }), Be;
  });
})(x3);
var cS = x3.exports;
const qt = IE, fS = OE.data, uS = DE.data, E3 = lS, S3 = cS.Base64, dS = new E3(S3.toUint8Array(fS)), pS = new E3(S3.toUint8Array(uS));
function vr(e, t) {
  return (e & t) !== 0;
}
const Mn = {
  Initial: 0,
  ExtendOrZWJ: 1,
  NotBoundary: 2
};
function mS(e, t) {
  const r = e.length;
  let n = 0, o = Mn.Initial;
  for (let a = t; a + 1 < r; a++) {
    const i = e[a + 0], s = e[a + 1];
    switch (vr(i, qt.Regional_Indicator) || (n = 0), o) {
      case Mn.NotBoundary:
      case Mn.Initial:
        vr(i, qt.Extended_Pictographic) ? o = Mn.ExtendOrZWJ : o = Mn.Initial;
        break;
      case Mn.ExtendOrZWJ:
        vr(i, qt.Extend) ? o = Mn.ExtendOrZWJ : vr(i, qt.ZWJ) && vr(s, qt.Extended_Pictographic) ? o = Mn.NotBoundary : o = Mn.Initial;
        break;
    }
    if (!(vr(i, qt.CR) && vr(s, qt.LF))) {
      if (vr(i, qt.Control | qt.CR | qt.LF) || vr(s, qt.Control | qt.CR | qt.LF))
        return a + 1 - t;
      if (!(vr(i, qt.L) && vr(s, qt.L | qt.V | qt.LV | qt.LVT)) && !(vr(i, qt.LV | qt.V) && vr(s, qt.V | qt.T)) && !(vr(i, qt.LVT | qt.T) && vr(s, qt.T)) && !vr(s, qt.Extend | qt.ZWJ) && !vr(s, qt.SpacingMark) && !vr(i, qt.Prepend) && o !== Mn.NotBoundary) {
        if (vr(i, qt.Regional_Indicator) && vr(s, qt.Regional_Indicator) && n % 2 === 0) {
          n++;
          continue;
        }
        return a + 1 - t;
      }
    }
  }
  return r - t;
}
var hS = function(t) {
  const r = [], n = [0], o = [];
  for (let a = 0; a < t.length; ) {
    const i = t.codePointAt(a);
    o.push(dS.get(i) | pS.get(i)), a += i > 65535 ? 2 : 1, n.push(a);
  }
  for (let a = 0; a < o.length; ) {
    const i = mS(o, a), s = n[a], l = n[a + i];
    r.push(t.slice(s, l)), a += i;
  }
  return r;
};
const yS = /* @__PURE__ */ Sa(hS), bS = (e) => e.normalize("NFKD").split(""), Y1 = /^\s+$/, Z1 = /^[`~!@#$%^&*()\-=_+{}[\]\|\\;':",./<>?]+$/, Nc = {
  insertOrder: "insertOrder",
  bestMatch: "bestMatch"
}, gS = {
  keySelector: (e) => e,
  threshold: 0.6,
  ignoreCase: !0,
  ignoreSymbols: !0,
  normalizeWhitespace: !0,
  returnMatchData: !1,
  useDamerau: !0,
  useSellers: !0,
  useSeparatedUnicode: !1,
  sortBy: Nc.bestMatch
}, AS = () => {
}, vS = (e) => e instanceof Array ? e : [e];
function k3(e, t) {
  const r = t.ignoreCase ? e.toLocaleLowerCase() : e, n = [], o = [];
  let a = !0, i = 0;
  const s = t.useSeparatedUnicode ? bS(r) : yS(r);
  for (const l of s)
    Y1.lastIndex = 0, Z1.lastIndex = 0, t.normalizeWhitespace && Y1.test(l) ? a || (n.push(" "), o.push(i), a = !0) : t.ignoreSymbols && Z1.test(l) || (t.useSeparatedUnicode ? n.push(l) : n.push(l.normalize()), o.push(i), a = !1), i += l.length;
  for (o.push(e.length); n[n.length - 1] === " "; )
    n.pop(), o.pop();
  return {
    original: e,
    normal: n,
    map: o
  };
}
function _S(e, t) {
  return {
    index: t[e.start],
    length: t[e.end + 1] - t[e.start]
  };
}
function T3(e, t) {
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
function wS() {
  return {
    start: 0,
    end: 0
  };
}
const xS = () => !0, ES = (e, t) => e < t;
function SS(e, t) {
  const r = new Array(e);
  for (let n = 0; n < e; n++)
    r[n] = new Array(t), r[n][0] = n;
  for (let n = 0; n < t; n++)
    r[0][n] = n;
  return r;
}
function kS(e, t) {
  const r = new Array(e);
  r[0] = new Array(t).fill(0);
  for (let n = 1; n < e; n++)
    r[n] = new Array(t), r[n][0] = n;
  return r;
}
function M3(e, t, r, n, o) {
  const a = r[n], i = r[n + 1], s = e[n] === t[o] ? 0 : 1;
  let l, c = i[o] + 1;
  (l = a[o + 1] + 1) < c && (c = l), (l = a[o] + s) < c && (c = l), i[o + 1] = c;
}
function L3(e, t, r, n) {
  for (let o = 0; o < e.length; o++)
    M3(e, t, r, o, n);
}
function TS(e, t, r, n) {
  if (n === 0) {
    L3(e, t, r, n);
    return;
  }
  e.length > 0 && M3(e, t, r, 0, n);
  for (let o = 1; o < e.length; o++) {
    const a = r[o - 1], i = r[o], s = r[o + 1], l = e[o] === t[n] ? 0 : 1;
    let c, u = s[n] + 1;
    (c = i[n + 1] + 1) < u && (u = c), (c = i[n] + l) < u && (u = c), e[o] === t[n - 1] && e[o - 1] === t[n] && (c = a[n - 1] + l) < u && (u = c), s[n + 1] = u;
  }
}
function MS(e, t, r) {
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
function LS(e, t, r, n) {
  for (const o of r) {
    const a = vS(n.keySelector(o)).map((i, s) => ({
      index: t,
      keyIndex: s,
      item: o,
      normalized: k3(i, n)
    }));
    t++;
    for (const i of a)
      MS(e, i.normalized.normal, i);
  }
}
function CS(e, t) {
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
  return a !== 0 ? a : C3(e, t);
}
function C3(e, t) {
  return e.index - t.index;
}
function RS(e) {
  switch (e) {
    case Nc.bestMatch:
      return CS;
    case Nc.insertOrder:
      return C3;
    default:
      throw new Error(`unknown sortBy method ${e}`);
  }
}
function R3(e, t, r, n, o, a, i) {
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
const IS = Math.max, NS = (e) => e;
function OS(e, t, r, n, o) {
  const a = t + o, i = Math.min(r.length, t + e.depth + 1), s = Math.ceil((a + i) / 2);
  return 1 - (s - i) / s >= n;
}
function PS(e, t, r, n, o, a) {
  return 1 - Math.min(o, a - (e.depth + 1)) / r.length >= n;
}
function DS(e, t, r, n, o, a, i) {
  const s = [];
  for (const c in e.children) {
    const u = e.children[c];
    s.push([u, 1, c, 0, t.length]);
  }
  const l = new Array(e.depth);
  for (; s.length !== 0; ) {
    const [c, u, d, p, m] = s.pop();
    l[u - 1] = d, r.score(t, l, n, u - 1);
    const y = u, L = n[n.length - 1][y];
    let x = p, O = m;
    if (r.shouldUpdateScore(L, m) && (x = y, O = L), c.candidates.length > 0) {
      const Y = r.getLength(t.length, u), R = 1 - O / Y;
      if (R >= i.threshold) {
        const z = T3(n, x), j = Math.abs(u - t.length);
        for (const I of c.candidates)
          R3(o, a, I, R, z, j, r.compareItems);
      }
    }
    for (const Y in c.children) {
      const R = c.children[Y];
      r.shouldContinue(R, u, t, i.threshold, O, L) && s.push([R, u + 1, Y, x, O]);
    }
  }
}
function BS(e, t, r) {
  const n = r.useSellers ? kS : SS, o = {
    score: r.useDamerau ? TS : L3,
    getLength: r.useSellers ? NS : IS,
    shouldUpdateScore: r.useSellers ? ES : xS,
    shouldContinue: r.useSellers ? PS : OS,
    walkBack: r.useSellers ? T3 : wS,
    compareItems: RS(r.sortBy)
  }, a = {}, i = [], s = n(e.length + 1, t.depth + 1);
  if (r.threshold <= 0 || e.length === 0)
    for (const c of t.candidates)
      R3(i, a, c, 0, {
        index: 0,
        length: 0
      }, e.length, o.compareItems);
  DS(t, e, o, s, i, a, r);
  const l = i.sort(o.compareItems);
  if (r.returnMatchData) {
    const c = r.useSellers ? _S : AS;
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
function GS(e, t, r) {
  r = {
    ...gS,
    ...r
  };
  const n = {
    children: {},
    candidates: [],
    depth: 0
  };
  return LS(n, 0, t, r), BS(k3(e, r).normal, n, r);
}
const FS = "_tqInputDropdown_1lfk1_1", $S = "_field_1lfk1_7", zS = "_hideText_1lfk1_12", jS = "_valueDisplay_1lfk1_15", qS = "_numeric_1lfk1_26", HS = "_valueIcon_1lfk1_30", US = "_valueLabel_1lfk1_35", VS = "_chevron_1lfk1_40", XS = "_selectWrapper_1lfk1_51", WS = "_select_1lfk1_51", YS = "_option_1lfk1_83", ZS = "_current_1lfk1_93", KS = "_active_1lfk1_96", QS = "_scrollArrow_1lfk1_100", JS = "_top_1lfk1_113", ek = "_bottom_1lfk1_118", Ir = {
  tqInputDropdown: FS,
  field: $S,
  hideText: zS,
  valueDisplay: jS,
  numeric: qS,
  valueIcon: HS,
  valueLabel: US,
  chevron: VS,
  selectWrapper: XS,
  select: WS,
  option: YS,
  current: ZS,
  active: KS,
  scrollArrow: QS,
  top: JS,
  bottom: ek
};
function tk({
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
  disabled: d,
  invalid: p,
  inlinePosition: m,
  blockPosition: y,
  onFocus: L,
  onBlur: x,
  onConfirm: O,
  renderOption: Y,
  className: R,
  ...z
}) {
  const j = ze(null), I = ze(null), N = ze(null), ne = Bo(j), de = V2(), oe = Do(On, (Fe) => Fe.inputHeight), [ge, te] = Mt(!1), [Ie, Ke] = Mt(!1), Ye = dr(
    () => x_({ options: r, labels: n, labelizer: o, prefix: a, suffix: i }),
    [o, n, r, a, i]
  ), [it, Xe] = Mt(() => Ye(e)), [Qe, xt] = Mt(e), [nt, ut] = Mt(0), [Pt, Pe] = Mt(6), [Ot, Q] = Mt({ up: !1, down: !1 }), Be = ze(0), V = ze(void 0), Ge = ze(e);
  Ge.current = e;
  const vt = dr(
    () => it === "" || !Ie ? r : GS(
      it,
      r.map((Fe) => ({ item: Fe, label: Ye(Fe) })),
      { keySelector: (Fe) => Fe.label }
    ).map((Fe) => Fe.item),
    [it, Ie, Ye, r]
  ), jt = r.indexOf(e), er = jt >= 0 ? s == null ? void 0 : s[jt] : void 0, ht = () => {
    var st;
    const Fe = ((st = N.current) == null ? void 0 : st.scrollHeight) ?? r.length * oe + 4;
    ut(Fe), Pe(
      Ob({
        triggerTop: ne.top,
        selectedIndex: r.indexOf(Qe),
        itemHeight: oe,
        listHeight: Fe,
        viewportHeight: de.height
      })
    );
  }, pt = () => {
    const Fe = N.current;
    if (!Fe) return;
    const st = Fe.scrollHeight - Fe.clientHeight > 2.5;
    Q({
      up: st && Fe.scrollTop > 0.5,
      down: st && Fe.scrollTop + Fe.clientHeight < Fe.scrollHeight - 2.5
    });
  };
  ur(() => {
    if (!ge) {
      Xe(Ye(e)), Ke(!1);
      return;
    }
    xt(e), Be.current = performance.now(), ht();
    const Fe = requestAnimationFrame(() => {
      var tr;
      ht();
      const Ut = (tr = N.current) == null ? void 0 : tr.querySelector("[data-current]");
      Ut == null || Ut.scrollIntoView({ block: "nearest" }), pt();
    }), st = () => {
      var Ut;
      performance.now() - Be.current > 500 ? (te(!1), O == null || O(), x == null || x()) : (Ut = I.current) == null || Ut.select();
    };
    return window.addEventListener("pointerup", st), () => {
      cancelAnimationFrame(Fe), window.removeEventListener("pointerup", st);
    };
  }, [ge]), ur(() => {
    ge || Xe(Ye(e));
  }, [Ye, ge, e]), ur(() => {
    vt.length && !vt.includes(e) && (t == null || t(vt[0]));
  }, [vt]), ur(
    () => () => {
      V.current !== void 0 && cancelAnimationFrame(V.current);
    },
    []
  );
  const Rt = (Fe) => {
    V.current !== void 0 && cancelAnimationFrame(V.current);
    const st = () => {
      const Ut = N.current;
      Ut && (Ut.scrollTop += Fe * 8, pt(), V.current = requestAnimationFrame(st));
    };
    V.current = requestAnimationFrame(st);
  }, We = () => {
    V.current !== void 0 && cancelAnimationFrame(V.current), V.current = void 0;
  }, Et = (Fe) => {
    if (!vt.length) return;
    const st = vt.indexOf(e), Ut = vt[d0(st + Fe, vt.length)];
    t == null || t(Ut), requestAnimationFrame(
      () => {
        var tr, g;
        return (g = (tr = N.current) == null ? void 0 : tr.querySelector("[data-active]")) == null ? void 0 : g.scrollIntoView({ block: "nearest" });
      }
    );
  }, Gt = Ie ? [ne.left - 2, ne.bottom] : [ne.left - 2, Pt], bt = Math.min(
    nt ? nt + 2 : 1 / 0,
    de.height - (Ie ? ne.bottom : Pt) - 6
  );
  return /* @__PURE__ */ Ht(
    "div",
    {
      ...z,
      ref: j,
      className: Ft(
        Ir.tqInputDropdown,
        ge && Ir.open,
        R
      ),
      align: u,
      "aria-disabled": d || void 0,
      children: [
        /* @__PURE__ */ fe(
          nf,
          {
            ref: I,
            value: it,
            className: Ft(
              Ir.field,
              er && !Ie && Ir.hideText
            ),
            theme: l,
            font: c,
            align: u,
            inlinePosition: m,
            blockPosition: y,
            disabled: d,
            invalid: p,
            onPointerDown: (Fe) => {
              Fe.isPrimary && te(!0);
            },
            onFocus: () => {
              te(!0), L == null || L();
            },
            onBlur: () => {
              ge || x == null || x();
            },
            onChange: (Fe) => {
              Xe(Fe), Ke(!0), te(!0);
            },
            onKeyDown: (Fe) => {
              var st;
              Fe.key === "ArrowUp" || Fe.key === "ArrowDown" ? (Fe.preventDefault(), Et(Fe.key === "ArrowUp" ? -1 : 1)) : Fe.key === "Enter" ? (Fe.preventDefault(), ge ? (te(!1), O == null || O(), (st = I.current) == null || st.blur()) : te(!0)) : Fe.key === "Escape" && (te(!1), t == null || t(Qe));
            }
          }
        ),
        er && !Ie && /* @__PURE__ */ Ht(
          "div",
          {
            className: Ft(
              Ir.valueDisplay,
              c === "numeric" && Ir.numeric
            ),
            children: [
              /* @__PURE__ */ fe(fn, { className: Ir.valueIcon, icon: er }),
              /* @__PURE__ */ fe("span", { className: Ir.valueLabel, children: Ye(e) })
            ]
          }
        ),
        /* @__PURE__ */ fe(fn, { className: Ir.chevron, icon: "mdi:unfold-more-horizontal" }),
        /* @__PURE__ */ fe(
          Ms,
          {
            open: ge,
            reference: j.current,
            placement: Gt,
            lightDismiss: !1,
            onChangeOpen: (Fe) => {
              !Fe && ge && (te(!1), t == null || t(Qe));
            },
            children: /* @__PURE__ */ Ht("div", { className: Ir.selectWrapper, style: { width: ne.width + 2 }, children: [
              /* @__PURE__ */ fe(
                "ul",
                {
                  ref: N,
                  className: Ir.select,
                  role: "listbox",
                  style: { maxHeight: bt },
                  font: c,
                  align: u,
                  onScroll: pt,
                  children: vt.map((Fe, st) => /* @__PURE__ */ fe(
                    "li",
                    {
                      role: "option",
                      "aria-selected": Object.is(Fe, e),
                      className: Ft(
                        Ir.option,
                        Object.is(Fe, e) && Ir.active,
                        Object.is(Fe, Qe) && Ir.current
                      ),
                      "data-active": Object.is(Fe, e) || void 0,
                      "data-current": Object.is(Fe, Qe) || void 0,
                      onPointerEnter: () => t == null ? void 0 : t(Fe),
                      onClick: () => {
                        t == null || t(Fe), te(!1), O == null || O();
                      },
                      children: (Y == null ? void 0 : Y(Fe, st)) ?? /* @__PURE__ */ Ht(Xn, { children: [
                        (s == null ? void 0 : s[r.indexOf(Fe)]) && /* @__PURE__ */ fe(fn, { icon: s[r.indexOf(Fe)] }),
                        Ye(Fe)
                      ] })
                    },
                    st
                  ))
                }
              ),
              Ot.up && /* @__PURE__ */ fe(
                "div",
                {
                  className: `${Ir.scrollArrow} ${Ir.top}`,
                  onPointerEnter: () => Rt(-1),
                  onPointerLeave: We,
                  children: /* @__PURE__ */ fe(fn, { icon: "mdi:chevron-up" })
                }
              ),
              Ot.down && /* @__PURE__ */ fe(
                "div",
                {
                  className: `${Ir.scrollArrow} ${Ir.bottom}`,
                  onPointerEnter: () => Rt(1),
                  onPointerLeave: We,
                  children: /* @__PURE__ */ fe(fn, { icon: "mdi:chevron-down" })
                }
              )
            ] })
          }
        )
      ]
    }
  );
}
const rk = "_values_s2y9j_1", nk = "_colorSpace_s2y9j_4", ok = "_channel_s2y9j_7", n0 = {
  values: rk,
  colorSpace: nk,
  channel: ok
}, ak = Object.values(Qc), ik = Eh(
  void 0
);
function I3() {
  const e = xh(ik);
  return e || {
    presets: ak,
    colorSpace: "hsv",
    setColorSpace: () => {
    }
  };
}
const sk = ["rgb", "hsv", "hex"];
function lk({
  colorCode: e,
  onChangeColorCode: t,
  value: r,
  onChange: n,
  alpha: o = !0
}) {
  const { colorSpace: a, setColorSpace: i } = I3(), s = M0(r), l = (c, u) => n == null ? void 0 : n(so(r, c, u));
  return /* @__PURE__ */ Ht(Ki, { className: n0.values, children: [
    /* @__PURE__ */ fe(
      tk,
      {
        className: n0.colorSpace,
        theme: "minimal",
        value: a,
        onChange: i,
        options: sk,
        labelizer: (c) => c.toUpperCase()
      }
    ),
    a === "rgb" && /* @__PURE__ */ Ht(Ki, { className: n0.channel, children: [
      /* @__PURE__ */ fe(
        Ln,
        {
          value: s.r * 255,
          min: 0,
          max: 255,
          precision: 0,
          bar: !1,
          onChange: (c) => l("r", c / 255)
        }
      ),
      /* @__PURE__ */ fe(
        Ln,
        {
          value: s.g * 255,
          min: 0,
          max: 255,
          precision: 0,
          bar: !1,
          onChange: (c) => l("g", c / 255)
        }
      ),
      /* @__PURE__ */ fe(
        Ln,
        {
          value: s.b * 255,
          min: 0,
          max: 255,
          precision: 0,
          bar: !1,
          onChange: (c) => l("b", c / 255)
        }
      ),
      o && /* @__PURE__ */ fe(
        Ln,
        {
          value: r.a * 100,
          min: 0,
          max: 100,
          precision: 0,
          bar: !1,
          suffix: "%",
          onChange: (c) => l("a", c / 100)
        }
      )
    ] }),
    a === "hsv" && /* @__PURE__ */ Ht(Ki, { className: n0.channel, children: [
      /* @__PURE__ */ fe(
        Ln,
        {
          value: r.h * 360,
          min: 0,
          max: 360,
          precision: 0,
          bar: !1,
          suffix: "°",
          onChange: (c) => l("h", c / 360)
        }
      ),
      /* @__PURE__ */ fe(
        Ln,
        {
          value: r.s * 100,
          min: 0,
          max: 100,
          precision: 0,
          bar: !1,
          suffix: "%",
          onChange: (c) => l("s", c / 100)
        }
      ),
      /* @__PURE__ */ fe(
        Ln,
        {
          value: r.v * 100,
          min: 0,
          max: 100,
          precision: 0,
          bar: !1,
          suffix: "%",
          onChange: (c) => l("v", c / 100)
        }
      ),
      o && /* @__PURE__ */ fe(
        Ln,
        {
          value: r.a * 100,
          min: 0,
          max: 100,
          precision: 0,
          bar: !1,
          suffix: "%",
          onChange: (c) => l("a", c / 100)
        }
      )
    ] }),
    a === "hex" && /* @__PURE__ */ fe(
      nf,
      {
        className: n0.channel,
        font: "monospace",
        value: e,
        validator: q2,
        onChange: t
      }
    )
  ] });
}
const ck = "_picker_78bpz_1", fk = "_eyeDropper_78bpz_6", K1 = {
  picker: ck,
  eyeDropper: fk
}, uk = "_presets_1uaq0_1", dk = {
  presets: uk
};
function pk({
  presets: e = [],
  onChange: t,
  className: r,
  ...n
}) {
  const { presets: o } = I3(), a = [...o, ...e];
  return /* @__PURE__ */ fe("div", { ...n, className: Ft(dk.presets, r), children: a.map((i, s) => /* @__PURE__ */ fe(
    "button",
    {
      type: "button",
      "aria-label": `Use ${i}`,
      style: { background: i },
      onClick: () => t == null ? void 0 : t(i)
    },
    `${i}-${s}`
  )) });
}
function mk({
  value: e,
  onChange: t,
  onConfirm: r,
  alpha: n = !0,
  pickers: o = t9,
  presets: a,
  className: i,
  ...s
}) {
  const [l, c] = Mt(() => Io(e)), u = ze(null);
  ur(() => {
    e !== u.current && c(Io(e));
  }, [e]);
  const d = (y) => {
    c(y), u.current = la(y), t == null || t(u.current);
  }, p = (y) => {
    c(Io(y)), u.current = y, t == null || t(y);
  }, m = typeof window > "u" ? void 0 : window.EyeDropper;
  return /* @__PURE__ */ Ht("div", { ...s, className: Ft(K1.picker, i), children: [
    o.map((y, L) => y[0] === "pad" ? /* @__PURE__ */ fe(
      kE,
      {
        value: l,
        axes: y[1],
        onChange: d
      },
      L
    ) : y[0] === "slider" ? !n && y[1] === "a" ? null : /* @__PURE__ */ fe(
      RE,
      {
        value: l,
        axis: y[1],
        onChange: d
      },
      L
    ) : y[0] === "values" ? /* @__PURE__ */ fe(
      lk,
      {
        colorCode: e,
        value: l,
        alpha: n,
        onChange: d,
        onChangeColorCode: p
      },
      L
    ) : null),
    /* @__PURE__ */ fe(
      pk,
      {
        presets: a,
        onChange: (y) => {
          p(y), r == null || r();
        }
      }
    ),
    m && /* @__PURE__ */ fe(
      "button",
      {
        type: "button",
        className: K1.eyeDropper,
        "aria-label": "Pick a color from the screen",
        onClick: async () => {
          const y = await new m().open();
          p(y.sRGBHex), r == null || r();
        },
        children: /* @__PURE__ */ fe(fn, { icon: "material-symbols:colorize" })
      }
    )
  ] });
}
const hk = [
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
];
function yk({
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
  disabled: d,
  invalid: p,
  children: m,
  className: y,
  ...L
}) {
  const x = ze(null), O = ze(null), [Y, R] = Mt(!1), [z, j] = Mt(!1), [I, N] = Mt(() => Io(e)), [ne, de] = Mt(!1), oe = Do(On), ge = Jc(hk), te = ge.Shift || ge.h || ge.f ? "h" : ge.s ? "s" : ge.v ? "v" : ge.r ? "r" : ge.g ? "g" : ge.b ? "b" : r && (ge.Alt || ge.a) ? "a" : "pad", Ie = ze(I);
  Ie.current = I;
  const Ke = ze(e);
  Ke.current = e;
  const Ye = ze(te);
  Ye.current = te;
  const it = ze(null), Xe = ze({
    onChange: t,
    onChangeTweaking: a,
    onFocus: i,
    onBlur: s,
    onConfirm: l
  });
  Xe.current = { onChange: t, onChangeTweaking: a, onFocus: i, onBlur: s, onConfirm: l };
  const Qe = ze(null), xt = oe.popupWidth, nt = dr(
    () => ({
      lockPointer: !0,
      disabled: () => d ?? !1,
      onClick: () => {
        var We;
        (We = Qe.current) != null && We.multiSelected || R((Et) => !Et);
      },
      onDragStart: () => {
        var Et, Gt, bt;
        const We = Io(Ke.current);
        Ie.current = We, N(We), it.current = We, (Et = Qe.current) == null || Et.capture(), (bt = (Gt = Xe.current).onChangeTweaking) == null || bt.call(Gt, !0);
      },
      onDrag: ({ delta: We }) => {
        var Ut, tr, g, tn, rn;
        const [Et, Gt] = [We[0] / xt, We[1] / -xt], bt = Ye.current;
        let Fe = Ie.current;
        const st = it.current;
        if (st) {
          if (bt === "pad") {
            Fe = Un(Fe, "s", Et), Fe = Un(Fe, "v", Gt);
            const wr = Fe.s, Tr = Fe.v;
            (Ut = Qe.current) == null || Ut.update((T) => {
              let Z = T;
              return wr !== st.s && (Z = so(
                Z,
                "s",
                (Ae) => wr < st.s ? st.s === 0 ? wr : Ae * (wr / st.s) : Ae + (1 - Ae) * ((wr - st.s) / (1 - st.s))
              )), Tr !== st.v && (Z = so(
                Z,
                "v",
                (Ae) => Tr < st.v ? st.v === 0 ? Tr : Ae * (Tr / st.v) : Ae + (1 - Ae) * ((Tr - st.v) / (1 - st.v))
              )), Z;
            });
          } else {
            Fe = Un(Fe, bt, bt === "v" ? Gt : Et);
            const wr = Ro(Fe, bt), Tr = Ro(st, bt);
            if (bt === "h" || Tr === 0) {
              const T = wr - Tr;
              (tr = Qe.current) == null || tr.update(
                (Z) => Un(Z, "h", T)
              );
            } else {
              const T = wr / Tr;
              (g = Qe.current) == null || g.update(
                (Z) => so(Z, bt, Ro(Z, bt) * T)
              );
            }
          }
          Ie.current = Fe, N(Fe), (rn = (tn = Xe.current).onChange) == null || rn.call(tn, la(Fe));
        }
      },
      onDragEnd: () => {
        var We, Et, Gt, bt, Fe;
        (Et = (We = Xe.current).onConfirm) == null || Et.call(We), (Gt = Qe.current) == null || Gt.confirm(), (Fe = (bt = Xe.current).onChangeTweaking) == null || Fe.call(bt, !1);
      }
    }),
    [d, xt]
  ), ut = I0(x, nt), Pt = Ts({
    type: "color",
    getElement: () => x.current,
    getValue: () => Ie.current,
    setValue: (We) => {
      var Et, Gt;
      Ie.current = We, N(We), (Gt = (Et = Xe.current).onChange) == null || Gt.call(Et, la(We));
    },
    confirm: () => {
      var We, Et;
      return (Et = (We = Xe.current).onConfirm) == null ? void 0 : Et.call(We);
    }
  });
  Qe.current = Pt, ur(() => {
    if (!ut.dragging) {
      const We = Io(e);
      Ie.current = We, N(We);
    }
  }, [ut.dragging, e]), ur(() => {
    ut.dragging && R(!1);
  }, [ut.dragging]), ur(() => {
    !ut.dragging || !it.current || (it.current = Ie.current, Pt.capture());
  }, [te]), ur(() => {
    Pt.multiSelected && R(!1);
  }, [Pt.multiSelected]), Wr(
    x,
    "wheel",
    (We) => {
      var Et, Gt;
      if (ut.dragging && it.current) {
        We.preventDefault(), We.stopPropagation();
        const bt = Un(
          Ie.current,
          "h",
          We.deltaY / 360 * 0.5
        );
        Ie.current = bt, N(bt), (Gt = (Et = Xe.current).onChange) == null || Gt.call(Et, la(bt));
        const Fe = bt.h - it.current.h;
        Pt.update((st) => Un(st, "h", Fe));
      }
      de(!0), window.setTimeout(() => de(!1), 500);
    },
    { passive: !1 }
  ), H2({
    target: x,
    onCopy: () => void navigator.clipboard.writeText(Ke.current),
    onPaste: () => {
      navigator.clipboard.readText().then((We) => {
        var Gt, bt;
        if (!We) return;
        const Et = Io(We);
        (bt = (Gt = Xe.current).onChange) == null || bt.call(Gt, We), Pt.update(() => Et), Pt.confirm();
      });
    }
  });
  const Pe = !z && (ge.Shift || ge.Meta || ge.Control), Ot = kt.valid(e) ? e : "black", Q = M0(I), Be = te === "h" ? [["Hue", `${(I.h * 360).toFixed(1)}°`]] : te === "s" || te === "v" || te === "a" ? [
    [
      te === "s" ? "Sat" : te === "v" ? "Val" : "α",
      `${(I[te] * 100).toFixed(1)}%`
    ]
  ] : te === "r" || te === "g" || te === "b" ? [[te.toUpperCase(), (Q[te] * 255).toFixed(0), !0]] : [
    ["Sat", `${(I.s * 100).toFixed(1)}%`],
    ["Val", `${(I.v * 100).toFixed(1)}%`]
  ], V = ft.contrastWCAG21(Ot, oe.backgroundColor), Ge = {
    color: Ot,
    "--outline": V > 1.1 ? "transparent" : "var(--tq-color-border)"
  }, vt = { left: ut.origin[0], top: ut.origin[1] }, jt = dr(
    () => ({
      hsva: [I.h, I.s, I.v, I.a],
      axes: [s0("s"), s0("v")]
    }),
    [I]
  ), er = dr(
    () => ({ hsva: [I.h, I.s, I.v, I.a] }),
    [I]
  ), ht = dr(
    () => ({
      hsva: [I.h, I.s, I.v, I.a],
      axis: s0(te === "pad" ? "s" : te),
      offset: 0
    }),
    [I, te]
  ), pt = te === "pad" ? 0.5 : Ro(I, te), Rt = te === "v" ? [0, -(pt - 0.5) * xt] : [-(pt - 0.5) * xt, 0];
  return /* @__PURE__ */ Ht(Xn, { children: [
    /* @__PURE__ */ fe(
      "button",
      {
        ...L,
        ref: x,
        type: L.type ?? "button",
        disabled: d,
        "aria-invalid": p || void 0,
        className: Ft(
          Ur.padButton,
          Y && Pe || Pt.subfocus ? Ur.focus : void 0,
          y
        ),
        onFocus: () => {
          Pt.setFocusing(!0), i == null || i();
        },
        onBlur: () => {
          Pt.setFocusing(!1), s == null || s();
        },
        children: m ?? /* @__PURE__ */ fe(
          "div",
          {
            className: Ft(
              Ur.defaultButton,
              Y && Ur.open,
              ut.dragging && Ur.tweaking
            ),
            style: Ge,
            "data-inline-position": c,
            "data-block-position": u
          }
        )
      }
    ),
    /* @__PURE__ */ fe(
      Ms,
      {
        open: Y && !Pe,
        reference: x.current,
        placement: "bottom-start",
        onChangeOpen: R,
        children: /* @__PURE__ */ fe(
          "div",
          {
            ref: O,
            className: Ur.floating,
            onFocusCapture: () => j(!0),
            onBlurCapture: (We) => {
              We.currentTarget.contains(We.relatedTarget) || j(!1);
            },
            children: /* @__PURE__ */ fe(
              mk,
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
    ut.dragging && /* @__PURE__ */ fe(h3, { children: /* @__PURE__ */ Ht(
      "div",
      {
        className: Ur.overlay,
        style: { transformOrigin: `${ut.origin[0]}px ${ut.origin[1]}px` },
        children: [
          (te === "pad" || te === "h" || te === "s" || te === "v") && /* @__PURE__ */ Ht(Xn, { children: [
            /* @__PURE__ */ fe(
              f0,
              {
                className: Ur.overlayPad,
                fragmentString: d3,
                uniforms: jt,
                style: {
                  opacity: te === "pad" ? 1 : 0.1,
                  left: ut.origin[0] - I.s * xt,
                  top: ut.origin[1] - (1 - I.v) * xt
                }
              }
            ),
            /* @__PURE__ */ fe(
              f0,
              {
                className: Ur.wheel,
                fragmentString: tE,
                uniforms: er,
                style: {
                  ...vt,
                  opacity: te === "h" || ne ? 1 : 0.1,
                  rotate: `${I.h * -360}deg`
                }
              }
            )
          ] }),
          te !== "pad" && te !== "h" && /* @__PURE__ */ fe(
            f0,
            {
              className: Ft(
                Ur.overlaySlider,
                te === "v" && Ur.verticalSlider
              ),
              fragmentString: p3,
              uniforms: ht,
              style: {
                left: ut.origin[0] + Rt[0],
                top: ut.origin[1] - Rt[1]
              }
            }
          ),
          /* @__PURE__ */ fe(
            "div",
            {
              className: Ur.tweakPreview,
              style: {
                ...vt,
                color: te === "a" ? Ot : kt(Ot).alpha(1).css()
              }
            }
          ),
          /* @__PURE__ */ fe(m3, { className: Ur.overlayLabel, style: vt, children: Be.map(([We, Et, Gt]) => /* @__PURE__ */ Ht("span", { children: [
            /* @__PURE__ */ fe("label", { children: We }),
            " ",
            /* @__PURE__ */ fe(
              "span",
              {
                className: Ur.labelValue,
                "data-rgb": Gt || void 0,
                children: Et
              }
            )
          ] }, We)) })
        ]
      }
    ) })
  ] });
}
function Yk({
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
  onConfirm: d,
  className: p,
  ...m
}) {
  const y = ze(null), { width: L } = Bo(y), x = Do(On, (N) => N.inputHeight), [O, Y] = Mt(!1), R = kt.valid(e) ? kt(e) : kt("black"), z = R.alpha(1).hex(), j = R.alpha() * 100, I = L > x * 3.5;
  return /* @__PURE__ */ Ht(
    Ki,
    {
      ...m,
      ref: y,
      className: Ft(r0.inputColor, p),
      "data-inline-position": s,
      "data-block-position": l,
      children: [
        /* @__PURE__ */ fe(
          yk,
          {
            className: Ft(!I && r0.onlyPad),
            value: e,
            onChange: t,
            alpha: r,
            pickers: n,
            presets: o,
            disabled: a,
            invalid: i,
            onChangeTweaking: Y,
            onFocus: c,
            onBlur: u,
            onConfirm: d
          }
        ),
        I && /* @__PURE__ */ fe(
          nf,
          {
            className: Ft(
              r0.colorCode,
              O && r0.padTweaking
            ),
            font: "monospace",
            value: z,
            validator: q2,
            disabled: a,
            invalid: i,
            onChange: (N) => {
              const ne = kt(N);
              t == null || t(
                ne.alpha() * 100 !== j ? N : ne.alpha(j / 100).hex()
              );
            },
            onFocus: c,
            onBlur: u,
            onConfirm: d
          }
        ),
        r && I && /* @__PURE__ */ fe(
          Ln,
          {
            className: r0.alpha,
            value: j,
            min: 0,
            max: 100,
            suffix: "%",
            disabled: a,
            invalid: i,
            onChange: (N) => t == null ? void 0 : t(R.alpha(N / 100).hex()),
            onConfirm: d
          }
        )
      ]
    }
  );
}
const bk = "_tqSvgIcon_1a6vr_1", gk = "_inline_1a6vr_8", Ak = "_block_1a6vr_14", vk = "_nonStrokeScaling_1a6vr_17", ji = {
  tqSvgIcon: bk,
  inline: gk,
  block: Ak,
  nonStrokeScaling: vk
};
function _k({
  mode: e = "inline",
  strokeWidth: t,
  nonStrokeScaling: r = !1,
  className: n,
  children: o,
  style: a,
  ...i
}) {
  return /* @__PURE__ */ fe(
    "svg",
    {
      className: Ft(
        ji.tqSvgIcon,
        e === "inline" && ji.inline,
        e === "block" && ji.block,
        r && ji.nonStrokeScaling,
        n
      ),
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
const wk = "_tqInputRotary_13lk8_1", xk = "_tweaking_13lk8_29", Ek = "_rotary_13lk8_32", Sk = "_subfocus_13lk8_37", kk = "_circle_13lk8_49", Tk = "_absoluteModeArea_13lk8_61", Mk = "_tip_13lk8_65", Lk = "_overlay_13lk8_74", Ck = "_thin_13lk8_88", Rk = "_bold_13lk8_89", Ik = "_gray_13lk8_94", Nk = "_snap_13lk8_126", Ok = "_overlayLabel_13lk8_130", Pk = "_arrows_13lk8_135", zr = {
  tqInputRotary: wk,
  tweaking: xk,
  rotary: Ek,
  subfocus: Sk,
  circle: kk,
  absoluteModeArea: Tk,
  tip: Mk,
  overlay: Lk,
  thin: Ck,
  bold: Rk,
  gray: Ik,
  snap: Nk,
  overlayLabel: Ok,
  arrows: Pk
}, Dk = ["Shift", "q", "a", "r"];
function Bk({
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
  className: d,
  ...p
}) {
  const m = ze(null), y = D_(m), L = ze(y);
  L.current = y;
  const x = Jc(Dk), O = ze(x);
  O.current = x;
  const Y = B_({ absolute: x.a, relative: x.r }), [R, z] = Mt(
    "relative"
  ), j = Y ?? R, I = ze(j);
  I.current = j;
  const [N, ne] = Mt(e), de = ze(N);
  de.current = N;
  const oe = ze(e);
  oe.current = e;
  const ge = ze(e), te = Do(On, (ht) => ht.inputHeight), Ie = [te * 4, 160], Ke = ze(Ie);
  Ke.current = Ie;
  const Ye = ze({
    onChange: t,
    onConfirm: u,
    onFocus: l,
    onBlur: c,
    disabled: o,
    snap: r,
    angleOffset: n
  });
  Ye.current = {
    onChange: t,
    onConfirm: u,
    onFocus: l,
    onBlur: c,
    disabled: o,
    snap: r,
    angleOffset: n
  };
  const it = ze(null), Xe = Ts({
    type: "number",
    getElement: () => m.current,
    getValue: () => de.current,
    setValue: (ht) => {
      var Rt, We;
      const pt = Number(ht);
      ne(pt), de.current = pt, (We = (Rt = Ye.current).onChange) == null || We.call(Rt, pt);
    },
    confirm: () => {
      var ht, pt;
      return (pt = (ht = Ye.current).onConfirm) == null ? void 0 : pt.call(ht);
    }
  }), Qe = ze(Xe);
  Qe.current = Xe;
  const xt = dr(
    () => ({
      disabled: () => !!Ye.current.disabled,
      dragDelaySeconds: 0,
      onDragStart(ht) {
        it.current = ht, ge.current = oe.current;
        let pt = oe.current;
        if (I.current === "absolute") {
          const Rt = $t.sub(ht.xy, L.current), We = $t.angle(Rt) - Ye.current.angleOffset;
          pt += xd(We, pt);
        }
        ne(pt), de.current = pt, Qe.current.capture();
      },
      onDrag(ht) {
        var Ut, tr, g;
        it.current = ht;
        const pt = (Ut = m.current) == null ? void 0 : Ut.getBoundingClientRect(), Rt = pt ? [pt.left + pt.width / 2, pt.top + pt.height / 2] : L.current, We = $t.sub(ht.xy, Rt), Et = $t.sub(ht.previous, Rt), Gt = $t.angle(Et, We), bt = $t.dist(Rt, ht.xy), Fe = O.current.Shift || O.current.q || Ke.current[0] <= bt && bt <= Ke.current[1], st = eg(
          de.current,
          Gt,
          Ye.current.snap,
          Fe
        );
        if (ne(st.local), de.current = st.local, (g = (tr = Ye.current).onChange) == null || g.call(tr, st.output), I.current === "absolute")
          Qe.current.update(() => st.output);
        else {
          const tn = st.output - ge.current;
          Qe.current.update((rn) => {
            const wr = Number(rn) + tn;
            return Fe ? Zt.quantize(wr, Ye.current.snap) : wr;
          });
        }
      },
      onDragEnd() {
        var ht, pt;
        (pt = (ht = Ye.current).onConfirm) == null || pt.call(ht), Qe.current.confirm();
      }
    }),
    []
  ), nt = I0(m, xt);
  it.current = nt, ur(() => {
    nt.dragging || (ne(e), de.current = e);
  }, [nt.dragging, e]), C_(nt.dragging ? "none" : null), H2({
    target: m,
    onCopy: () => void navigator.clipboard.writeText(oe.current.toString()),
    onPaste: async () => {
      var pt, Rt;
      const ht = parseFloat(await navigator.clipboard.readText());
      Number.isNaN(ht) || ((Rt = (pt = Ye.current).onChange) == null || Rt.call(pt, ht), Qe.current.update(() => ht), Qe.current.confirm());
    }
  });
  const ut = x.Shift || x.q || Ie[0] <= $t.dist(y, nt.xy) && $t.dist(y, nt.xy) <= Ie[1], Pt = V2(), Pe = [
    [40, 40],
    [Pt.width - 40, Pt.height - 40]
  ], Ot = tg(nt.initial, nt.xy, Pe), Q = $t.angle($t.sub(nt.xy, nt.origin)) + 90, Be = `${Math.trunc(e / 360) ? `${Math.trunc(e / 360)}x ` : ""}${(e - Math.trunc(e / 360) * 360).toFixed(1)}°`, V = Sh().replaceAll(":", ""), Ge = (ht, pt, Rt) => {
    const We = ht + n;
    return __(
      $t.dir(We, pt, y),
      $t.dir(We, Rt, y)
    );
  }, vt = k1(
    wd(0, 360, r).map((ht) => Ge(ht, ...Ie))
  ), jt = (() => {
    if (j === "absolute")
      return Ge(e, te, $t.dist(y, nt.xy));
    const ht = te * 4, pt = te * 0.25, Rt = ge.current + n, We = e + n, Et = Math.floor(Math.abs(We - Rt) / 360) * Math.sign(We - Rt), Gt = wd(0, Et).map(
      (Ut) => j2(y, ht + Ut * pt)
    );
    let bt = d0(xd(We, Rt), 360);
    We < Rt && (bt -= 360);
    const Fe = d0(Rt, 360), st = w_(
      y,
      ht + Et * pt,
      Fe,
      Fe + bt
    );
    return k1([...Gt, st]);
  })(), er = ut && e % r === 0 ? Ge(e, ...Ie) : "";
  return /* @__PURE__ */ Ht(Xn, { children: [
    /* @__PURE__ */ fe(
      "button",
      {
        ...p,
        ref: m,
        className: Ft(
          zr.tqInputRotary,
          nt.dragging && zr.tweaking,
          Xe.subfocus && zr.subfocus,
          d
        ),
        type: "button",
        disabled: o,
        "aria-invalid": a || void 0,
        "inline-position": i,
        "block-position": s,
        "tweak-mode": j,
        onFocus: () => {
          Xe.setFocusing(!0), l == null || l();
        },
        onBlur: () => {
          Xe.setFocusing(!1), c == null || c();
        },
        children: /* @__PURE__ */ Ht(_k, { mode: "block", className: zr.rotary, children: [
          /* @__PURE__ */ fe("circle", { className: zr.circle, cx: "16", cy: "16", r: "16" }),
          /* @__PURE__ */ Ht(
            "g",
            {
              style: {
                transformOrigin: "16px 16px",
                transform: `rotate(${e + n}deg)`
              },
              onPointerEnter: () => z("absolute"),
              onPointerLeave: () => !nt.dragging && z("relative"),
              children: [
                /* @__PURE__ */ fe(
                  "path",
                  {
                    className: zr.absoluteModeArea,
                    d: "M 16 16 L 16 32 A 16 16 0 0 0 16 0 Z"
                  }
                ),
                /* @__PURE__ */ fe("path", { className: zr.tip, d: "M20 16 L30 16" })
              ]
            }
          )
        ] })
      }
    ),
    nt.dragging && /* @__PURE__ */ fe(h3, { children: /* @__PURE__ */ Ht("div", { className: zr.overlay, children: [
      /* @__PURE__ */ Ht("svg", { children: [
        /* @__PURE__ */ fe("defs", { children: /* @__PURE__ */ fe(
          "marker",
          {
            id: V,
            markerWidth: "6",
            markerHeight: "6",
            refX: "3",
            refY: "3",
            orient: "auto",
            fill: "var(--tq-color-accent)",
            children: /* @__PURE__ */ fe("path", { d: "M 0 0 L 6 3 L 0 6 Z" })
          }
        ) }),
        /* @__PURE__ */ fe(
          "path",
          {
            className: Ft(
              zr.thin,
              zr.gray,
              ut && zr.snap
            ),
            d: vt
          }
        ),
        /* @__PURE__ */ fe(
          "path",
          {
            className: zr.bold,
            d: jt,
            markerEnd: j === "relative" ? `url(#${V})` : void 0
          }
        ),
        /* @__PURE__ */ fe("path", { className: zr.bold, d: er })
      ] }),
      /* @__PURE__ */ Ht(
        m3,
        {
          className: zr.overlayLabel,
          style: { left: Ot[0], top: Ot[1] },
          children: [
            Be,
            /* @__PURE__ */ fe(
              "span",
              {
                className: zr.arrows,
                style: { transform: `rotate(${Q}deg)` }
              }
            )
          ]
        }
      )
    ] }) })
  ] });
}
const Gk = "_tqInputAngle_zb47l_1", Fk = {
  tqInputAngle: Gk
};
function Zk(e) {
  const t = ze(null), { width: r } = Bo(t), n = Do(On, (a) => a.inputHeight), o = {
    value: e.value,
    onChange: e.onChange,
    disabled: e.disabled,
    invalid: e.invalid,
    onFocus: e.onFocus,
    onBlur: e.onBlur,
    onConfirm: e.onConfirm
  };
  return /* @__PURE__ */ Ht("div", { ref: t, className: Fk.tqInputAngle, children: [
    /* @__PURE__ */ fe(
      Bk,
      {
        ...o,
        snap: e.snap,
        angleOffset: e.angleOffset
      }
    ),
    r > n * 4 && /* @__PURE__ */ fe(Ln, { ...o, suffix: "°" })
  ] });
}
function $k(e, t = {}) {
  qp.getState().setAppId(e), On.getState().setDefault({
    colorMode: t.colorMode,
    accentColor: t.accentColor,
    backgroundColor: t.backgroundColor,
    grayColor: t.grayColor
  });
}
const zk = "_tqViewport_1h81w_6", jk = {
  tqViewport: zk
};
function Kk({
  appId: e = "viewport",
  className: t,
  children: r,
  ...n
}) {
  const o = ze(!1);
  return o.current || ($k(e), o.current = !0), /* @__PURE__ */ fe(
    "div",
    {
      ...n,
      className: Ft("TqViewport", jk.tqViewport, t),
      children: r
    }
  );
}
export {
  Zk as InputAngle,
  Yk as InputColor,
  Ln as InputNumber,
  Kk as Viewport
};
