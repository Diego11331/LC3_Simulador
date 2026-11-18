class LC3XCPU {
  static NM = ['BR', 'ADD', 'LD', 'ST', 'JSR', 'AND', 'LDR', 'STR', 'RTI', 'NOT', 'LDBL', 'STBL', 'JMP', '?', 'LEA', 'TRAP',
    'LDBH', 'STBH', 'LDX', 'PUSHM', 'POPM', 'MOVI', 'MOVH', 'SHL', 'SHR', 'SUB', 'ADC', 'MUL', 'MULQ', 'DIV', 'DIVQ', '?'];
  static UNN = { 31: 'NOT', 30: 'NEG', 29: 'ABS', 28: 'SXT', 27: 'SWAB', 26: 'CLZ' };
  static STACK = 0xFE00;

  constructor() { this.mem = new Uint8Array(65536); this.reset(); }

  reset() {
    this.mem.fill(0); this.r = new Uint16Array(8);
    this.pc = 0x3000; this.n = 0; this.z = 1; this.p = 0; this.c = 0;
    this.halted = false; this.waiting = false; this.err = null;
    this.count = 0; this.hist = {}; this.out = ''; this.input = []; this.size = 0;
  }

  load(org, bytes) {
    if (org + bytes.length > 0x10000) throw Error('el programa no entra en memoria');
    this.mem.set(bytes, org); this.pc = org; this.size = bytes.length; this.r[6] = LC3XCPU.STACK;
  }

  rd(a) { if (a & 1) throw Error('acceso de 16 bits en dirección impar x' + a.toString(16).toUpperCase()); return this.mem[a] | (this.mem[a + 1] << 8); }
  wr(a, v) { if (a & 1) throw Error('acceso de 16 bits en dirección impar x' + a.toString(16).toUpperCase()); this.mem[a] = v & 255; this.mem[a + 1] = (v >> 8) & 255; }
  cc(v) { this.n = (v >> 15) & 1; this.z = +(v === 0); this.p = +(!this.n && v !== 0); }

  step() {
    if (this.halted || this.waiting) return false;
    const M = 0xFFFF, R = this.r, sx = (v, b) => (v << (32 - b)) >> (32 - b), s16 = v => (v << 16) >> 16;
    const put = (d, v) => { R[d] = v & M; this.cc(R[d]); };
    let name = '', counted = true;
    try {
      const ir = this.rd(this.pc); this.pc = (this.pc + 2) & M;
      const op = ir >> 11, d = (ir >> 8) & 7, s = (ir >> 5) & 7, lo3 = ir & 7;
      name = LC3XCPU.NM[op];
      const imm4 = () => (ir >> 4) & 1 ? sx(ir & 15, 4) & M : R[lo3];
      const pcrel = b => (this.pc + (sx(ir & ((1 << b) - 1), b) << 1)) & M;
      switch (op) {
        case 0: if ((d & 4 && this.n) || (d & 2 && this.z) || (d & 1 && this.p)) this.pc = pcrel(8); break;
        case 1: { const t = R[s] + imm4(); this.c = t >> 16 & 1; put(d, t); break; }
        case 5: put(d, R[s] & imm4()); break;
        case 25: { const b = imm4(), a = R[s]; this.c = +(a < b); put(d, a - b); break; }
        case 2: put(d, this.rd(pcrel(8))); break;
        case 3: this.wr(pcrel(8), R[d]); break;
        case 14: R[d] = pcrel(8); break;
        case 4: { const t = (ir >> 10) & 1 ? pcrel(10) : R[s]; R[7] = this.pc; this.pc = t; break; }
        case 12: this.pc = R[s]; if (s === 7) name = 'RET'; break;
        case 6: put(d, this.rd((R[s] + (sx(ir & 31, 5) << 1)) & M)); break;
        case 7: this.wr((R[s] + (sx(ir & 31, 5) << 1)) & M, R[d]); break;
        case 10: put(d, this.mem[(R[s] + sx(ir & 31, 5)) & M]); break;
        case 16: put(d, (this.mem[(R[s] + sx(ir & 31, 5)) & M] << 8) | (R[d] & 255)); break;
        case 11: this.mem[(R[s] + sx(ir & 31, 5)) & M] = R[d] & 255; break;
        case 17: this.mem[(R[s] + sx(ir & 31, 5)) & M] = R[d] >> 8; break;
        case 18: {
          const t = (ir >> 3) & 3, i = R[lo3];
          if (t === 0) put(d, this.rd((R[s] + 2 * i) & M));
          else if (t < 3) put(d, t === 1 ? this.mem[(R[s] + i) & M] : sx(this.mem[(R[s] + i) & M], 8));
          else throw Error('LDX con T=11 reservado');
          break;
        }
        case 19: for (let i = 7; i >= 0; i--) if (ir >> i & 1 && i !== 6) { R[6] = (R[6] - 2) & M; this.wr(R[6], R[i]); } break;
        case 20: for (let i = 0; i < 8; i++) if (ir >> i & 1 && i !== 6) { R[i] = this.rd(R[6]); R[6] = (R[6] + 2) & M; } break;
        case 21: put(d, sx(ir & 255, 8)); break;
        case 22: put(d, ((ir & 255) << 8) | (R[d] & 255)); break;
        case 23: case 24: this.shift(op, ir, d, s, put); break;
        case 26: {
          const o = (ir >> 4) & 1 ? lo3 : R[lo3], t = (ir >> 3) & 1 ? R[s] - o - this.c : R[s] + o + this.c;
          this.c = (ir >> 3) & 1 ? +(t < 0) : +(t > M); put(d, t); break;
        }
        case 27: {
          const k = (ir >> 3) & 3, a = R[s], b = R[lo3];
          if (k === 3) throw Error('MUL con sel=11 reservado');
          put(d, k === 0 ? s16(a) * s16(b) : k === 1 ? Math.floor(s16(a) * s16(b) / 65536) : Math.floor(a * b / 65536)); break;
        }
        case 28: {
          const n = [8, 12, 14, 15][(ir >> 3) & 3], v = Math.floor((s16(R[s]) * s16(R[lo3]) + 2 ** (n - 1)) / 2 ** n);
          this.c = +(v > 32767 || v < -32768); put(d, Math.max(-32768, Math.min(32767, v))); break;
        }
        case 29: this.div(ir, d, s, lo3, put); break;
        case 30: {
          const n = [8, 12, 14, 15][(ir >> 3) & 3], a = s16(R[s]), b = s16(R[lo3]);
          if (b === 0) { this.c = 1; put(d, a >= 0 ? 0x7FFF : 0x8000); break; }
          let q = Math.floor((2 * Math.abs(a) * 2 ** n + Math.abs(b)) / (2 * Math.abs(b)));
          if ((a < 0) !== (b < 0)) q = -q;
          this.c = +(q > 32767 || q < -32768); put(d, Math.max(-32768, Math.min(32767, q))); break;
        }
        case 9: this.unary(ir, d, s, put); name = LC3XCPU.UNN[ir & 31]; break;
        case 15: counted = this.trap(ir & 127); break;
        case 8: throw Error('RTI no está implementada (no hay modo supervisor)');
        default: throw Error('opcode reservado ' + op.toString(2).padStart(5, '0'));
      }
      if (counted) { this.count++; this.hist[name] = (this.hist[name] || 0) + 1; }
    } catch (e) { this.halted = true; this.err = e.message; }
    return !this.halted;
  }

  shift(op, ir, d, s, put) {
    const v = this.r[s], t = (ir >> 3) & 1, n = (ir >> 4) & 1 ? (ir & 7) + 1 : this.r[ir & 7] & 15;
    if (n === 0) return put(d, v);
    let res;
    if (op === 23 && !t) { res = (v << n) & 0xFFFF; this.c = (v >> (16 - n)) & 1; }
    else if (op === 23) { res = ((v << n) | (v >> (16 - n))) & 0xFFFF; this.c = res & 1; }
    else { res = t ? ((v << 16) >> 16) >> n : v >>> n; this.c = (((t ? (v << 16) >> 16 : v) >> (n - 1))) & 1; }
    put(d, res);
  }

  unary(ir, d, s, put) {
    const v = this.r[s], sv = (v << 16) >> 16;
    switch (ir & 31) {
      case 31: return put(d, ~v);
      case 30: this.c = +(v === 0x8000); return put(d, -sv);
      case 29: this.c = +(v === 0x8000); return put(d, Math.abs(sv));
      case 28: return put(d, (v << 24) >> 24);
      case 27: return put(d, ((v & 255) << 8) | (v >> 8));
      case 26: return put(d, Math.clz32(v) - 16);
    }
    throw Error('función unaria reservada');
  }

  div(ir, d, s, x, put) {
    const k = (ir >> 3) & 3, uns = k >= 2, a = uns ? this.r[s] : (this.r[s] << 16) >> 16, b = uns ? this.r[x] : (this.r[x] << 16) >> 16;
    if (b === 0) { this.c = 1; return put(d, uns || a >= 0 ? 0x7FFF : 0x8000); }
    let q = Math.floor(Math.abs(a) / Math.abs(b)), r = Math.abs(a) % Math.abs(b);
    if (!uns) { if ((a < 0) !== (b < 0)) q = -q; if (a < 0) r = -r; }
    const v = k & 1 ? r : q;
    this.c = +(!(k & 1) && !uns && v === 32768);
    put(d, this.c ? 0x7FFF : v);
  }

  trap(v) {
    const R = this.r;
    switch (v) {
      case 0x20: case 0x23:
        if (!this.input.length) { this.waiting = true; this.pc = (this.pc - 2) & 0xFFFF; return false; }
        R[0] = this.input.shift(); if (v === 0x23) this.out += String.fromCharCode(R[0] & 255); return true;
      case 0x21: this.out += String.fromCharCode(R[0] & 255); return true;
      case 0x22: for (let a = R[0], k = 0; this.mem[a] && k < 65536; a = (a + 1) & 0xFFFF, k++) this.out += String.fromCharCode(this.mem[a]); return true;
      case 0x25: this.halted = true; return true;
    }
    R[7] = this.pc; this.pc = this.rd(v << 1);
    if (!this.pc) throw Error('vector de TRAP x' + v.toString(16) + ' sin inicializar');
    return true;
  }

  feed(text) { for (const ch of text) this.input.push(ch.charCodeAt(0) & 255); this.input.push(10); this.waiting = false; }
}
if (typeof module !== 'undefined') module.exports = LC3XCPU;
