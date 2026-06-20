import type { BezierPath, BezierAnchor } from '../types/distortion';

// SVG アフィン変換行列 [a, b, c, d, e, f]
// x' = a*x + c*y + e,  y' = b*x + d*y + f
type Matrix = [number, number, number, number, number, number];

function matMul(m1: Matrix, m2: Matrix): Matrix {
  const [a1,b1,c1,d1,e1,f1] = m1, [a2,b2,c2,d2,e2,f2] = m2;
  return [a1*a2+c1*b2, b1*a2+d1*b2, a1*c2+c1*d2, b1*c2+d1*d2,
          a1*e2+c1*f2+e1, b1*e2+d1*f2+f1];
}

function applyMatrix(m: Matrix, x: number, y: number): [number, number] {
  return [m[0]*x + m[2]*y + m[4], m[1]*x + m[3]*y + m[5]];
}

function parseTransform(attr: string | null): Matrix {
  const ID: Matrix = [1,0,0,1,0,0];
  if (!attr) return [...ID];
  let r: Matrix = [...ID];
  const re = /(matrix|translate|scale|rotate|skewX|skewY)\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(attr)) !== null) {
    const args = match[2].trim().split(/[\s,]+/).map(Number);
    const [a0=0, a1=0, a2=0, a3=0, a4=0, a5=0] = args;
    let t: Matrix;
    switch (match[1]) {
      case 'matrix':    t = [a0,a1,a2,a3,a4,a5]; break;
      case 'translate': t = [1,0,0,1,a0,a1]; break;
      case 'scale':     t = [a0,0,0,args.length>1?a1:a0,0,0]; break;
      case 'rotate': {
        const rad = a0*Math.PI/180, c = Math.cos(rad), s = Math.sin(rad);
        t = (a1||a2)
          ? matMul(matMul([1,0,0,1,a1,a2],[c,s,-s,c,0,0]),[1,0,0,1,-a1,-a2])
          : [c,s,-s,c,0,0];
        break;
      }
      case 'skewX': { const tk=Math.tan(a0*Math.PI/180); t=[1,0,tk,1,0,0]; break; }
      case 'skewY': { const tk=Math.tan(a0*Math.PI/180); t=[1,tk,0,1,0,0]; break; }
      default: continue;
    }
    r = matMul(r, t);
  }
  return r;
}

function getElementTransform(el: Element, svgEl: Element): Matrix {
  const chain: Matrix[] = [];
  let node: Element | null = el;
  while (node && node !== svgEl) {
    chain.unshift(parseTransform(node.getAttribute('transform')));
    node = node.parentElement;
  }
  let r: Matrix = [1,0,0,1,0,0];
  for (const t of chain) r = matMul(r, t);
  return r;
}

/**
 * SVG アーク → 三次ベジエ変換 (SVG Spec F.6 準拠)
 * 戻り値: [cp1x, cp1y, cp2x, cp2y, ex, ey][] (SVG座標系)
 */
function arcToCubic(
  x1: number, y1: number,
  rx: number, ry: number, phiDeg: number,
  fA: boolean, fS: boolean,
  x2: number, y2: number
): [number,number,number,number,number,number][] {
  if (x1===x2 && y1===y2) return [];
  if (rx===0 || ry===0) return [[(x1+x2)/2,(y1+y2)/2,(x1+x2)/2,(y1+y2)/2,x2,y2]];
  rx=Math.abs(rx); ry=Math.abs(ry);
  const phi=phiDeg*Math.PI/180, cp=Math.cos(phi), sp=Math.sin(phi);

  const dx2=(x1-x2)/2, dy2=(y1-y2)/2;
  const x1p= cp*dx2+sp*dy2, y1p=-sp*dx2+cp*dy2;
  const x1p2=x1p*x1p, y1p2=y1p*y1p;
  let rx2=rx*rx, ry2=ry*ry;
  const lam=x1p2/rx2+y1p2/ry2;
  if (lam>1) { const s=Math.sqrt(lam); rx*=s; ry*=s; rx2=rx*rx; ry2=ry*ry; }

  const sign=(fA!==fS)?1:-1;
  const sq=Math.sqrt(Math.max(0,(rx2*ry2-rx2*y1p2-ry2*x1p2)/(rx2*y1p2+ry2*x1p2)));
  const cxp=sign*sq*rx*y1p/ry, cyp=-sign*sq*ry*x1p/rx;
  const cx=cp*cxp-sp*cyp+(x1+x2)/2, cy=sp*cxp+cp*cyp+(y1+y2)/2;

  const va=(ux:number,uy:number,vx:number,vy:number)=>{
    const n=Math.sqrt((ux*ux+uy*uy)*(vx*vx+vy*vy));
    const c=Math.max(-1,Math.min(1,(ux*vx+uy*vy)/n));
    return (ux*vy-uy*vx<0?-1:1)*Math.acos(c);
  };
  const ux=(x1p-cxp)/rx, uy=(y1p-cyp)/ry;
  const vx=(-x1p-cxp)/rx, vy=(-y1p-cyp)/ry;
  const theta1=va(1,0,ux,uy); let dtheta=va(ux,uy,vx,vy);
  if (!fS&&dtheta>0) dtheta-=2*Math.PI;
  if (fS&&dtheta<0) dtheta+=2*Math.PI;

  const n=Math.max(1,Math.ceil(Math.abs(dtheta)/(Math.PI/2)));
  const dt=dtheta/n;
  const u2s=(ux:number,uy:number):[number,number]=>[cp*rx*ux-sp*ry*uy+cx, sp*rx*ux+cp*ry*uy+cy];
  const d2s=(dx:number,dy:number):[number,number]=>[cp*rx*dx-sp*ry*dy, sp*rx*dx+cp*ry*dy];

  const result:[number,number,number,number,number,number][]=[];
  for (let k=0;k<n;k++) {
    const t1=theta1+k*dt, t2=theta1+(k+1)*dt;
    const a=Math.sin(t2-t1)*(Math.sqrt(4+3*Math.tan((t2-t1)/2)**2)-1)/3;
    const [p1x,p1y]=u2s(Math.cos(t1),Math.sin(t1));
    const [p2x,p2y]=u2s(Math.cos(t2),Math.sin(t2));
    const [d1x,d1y]=d2s(-Math.sin(t1),Math.cos(t1));
    const [d2x,d2y]=d2s(-Math.sin(t2),Math.cos(t2));
    result.push([p1x+a*d1x,p1y+a*d1y, p2x-a*d2x,p2y-a*d2y, p2x,p2y]);
  }
  return result;
}

/**
 * path の d 属性をパースして BezierPath[] を返す。
 * 1つの d 文字列に複数サブパス (複数M) が含まれる場合は複数パスを返す。
 * 対応コマンド: M L H V C S Q T A Z (大文字/小文字)
 */
function parseD(
  d: string,
  transform: Matrix,
  norm: (x:number, y:number)=>[number,number]
): BezierPath[] {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  const paths: BezierPath[] = [];
  let anchors: BezierAnchor[] = [];
  let cx=0,cy=0,sx=0,sy=0;
  let prevCubCp2x=0,prevCubCp2y=0;
  let prevQuadCpx=0,prevQuadCpy=0;
  let lastCurveCmd='';
  let prevCmd='', i=0;

  const nextNum=():number=>parseFloat(tokens[i++]??'0');
  const pt=(x:number,y:number):[number,number]=>{ const [tx,ty]=applyMatrix(transform,x,y); return norm(tx,ty); };

  const flushPath=(closed:boolean)=>{
    if (anchors.length>=2) paths.push({id:crypto.randomUUID(),anchors,closed});
    anchors=[];
  };

  const straightenLastCp2=()=>{
    if (anchors.length>0){const a=anchors[anchors.length-1];a.cp2=[a.x,a.y];}
  };

  const addCubic=(cp1x:number,cp1y:number,cp2x:number,cp2y:number,ex:number,ey:number)=>{
    if (anchors.length>0) anchors[anchors.length-1].cp2=pt(cp1x,cp1y);
    const [nx,ny]=pt(ex,ey);
    anchors.push({x:nx,y:ny,cp1:pt(cp2x,cp2y),cp2:[nx,ny]});
    prevCubCp2x=cp2x; prevCubCp2y=cp2y;
    cx=ex; cy=ey; lastCurveCmd='C';
  };

  while (i<tokens.length) {
    let cmd=tokens[i];
    if (/[a-zA-Z]/.test(cmd)){i++;prevCmd=cmd;}
    else{cmd=prevCmd==='M'?'L':prevCmd==='m'?'l':prevCmd;}
    const rel=cmd!=='Z'&&cmd!=='z'&&cmd===cmd.toLowerCase();
    const uc=cmd.toUpperCase();
    const ax=(v:number)=>rel?cx+v:v;
    const ay=(v:number)=>rel?cy+v:v;

    switch(uc){
      case 'M':{
        flushPath(false);
        const x=ax(nextNum()),y=ay(nextNum());
        sx=x;sy=y;cx=x;cy=y;
        const [nx,ny]=pt(x,y);
        anchors=[{x:nx,y:ny,cp1:[nx,ny],cp2:[nx,ny]}];
        prevCubCp2x=x;prevCubCp2y=y;prevQuadCpx=x;prevQuadCpy=y;lastCurveCmd='';
        break;
      }
      case 'L':{
        const x=ax(nextNum()),y=ay(nextNum());
        straightenLastCp2();
        const [nx,ny]=pt(x,y);
        anchors.push({x:nx,y:ny,cp1:[nx,ny],cp2:[nx,ny]});
        cx=x;cy=y;prevCubCp2x=x;prevCubCp2y=y;prevQuadCpx=x;prevQuadCpy=y;lastCurveCmd='';
        break;
      }
      case 'H':{
        const x=ax(nextNum());
        straightenLastCp2();
        const [nx,ny]=pt(x,cy);
        anchors.push({x:nx,y:ny,cp1:[nx,ny],cp2:[nx,ny]});
        cx=x;prevCubCp2x=x;prevCubCp2y=cy;prevQuadCpx=x;prevQuadCpy=cy;lastCurveCmd='';
        break;
      }
      case 'V':{
        const y=ay(nextNum());
        straightenLastCp2();
        const [nx,ny]=pt(cx,y);
        anchors.push({x:nx,y:ny,cp1:[nx,ny],cp2:[nx,ny]});
        cy=y;prevCubCp2x=cx;prevCubCp2y=y;prevQuadCpx=cx;prevQuadCpy=y;lastCurveCmd='';
        break;
      }
      case 'C':{
        const cp1x=ax(nextNum()),cp1y=ay(nextNum());
        const cp2x=ax(nextNum()),cp2y=ay(nextNum());
        const x=ax(nextNum()),y=ay(nextNum());
        addCubic(cp1x,cp1y,cp2x,cp2y,x,y);
        prevQuadCpx=x;prevQuadCpy=y;
        break;
      }
      case 'S':{
        const cp1x=(lastCurveCmd==='C'||lastCurveCmd==='S')?2*cx-prevCubCp2x:cx;
        const cp1y=(lastCurveCmd==='C'||lastCurveCmd==='S')?2*cy-prevCubCp2y:cy;
        const cp2x=ax(nextNum()),cp2y=ay(nextNum());
        const x=ax(nextNum()),y=ay(nextNum());
        addCubic(cp1x,cp1y,cp2x,cp2y,x,y);
        prevQuadCpx=x;prevQuadCpy=y;
        break;
      }
      case 'Q':{
        const qcpx=ax(nextNum()),qcpy=ay(nextNum());
        const x=ax(nextNum()),y=ay(nextNum());
        addCubic(cx+2/3*(qcpx-cx),cy+2/3*(qcpy-cy),x+2/3*(qcpx-x),y+2/3*(qcpy-y),x,y);
        prevCubCp2x=x;prevCubCp2y=y;prevQuadCpx=qcpx;prevQuadCpy=qcpy;lastCurveCmd='Q';
        break;
      }
      case 'T':{
        const qcpx=(lastCurveCmd==='Q'||lastCurveCmd==='T')?2*cx-prevQuadCpx:cx;
        const qcpy=(lastCurveCmd==='Q'||lastCurveCmd==='T')?2*cy-prevQuadCpy:cy;
        const x=ax(nextNum()),y=ay(nextNum());
        addCubic(cx+2/3*(qcpx-cx),cy+2/3*(qcpy-cy),x+2/3*(qcpx-x),y+2/3*(qcpy-y),x,y);
        prevCubCp2x=x;prevCubCp2y=y;prevQuadCpx=qcpx;prevQuadCpy=qcpy;lastCurveCmd='T';
        break;
      }
      case 'A':{
        const rx=nextNum(),ry=nextNum(),phiDeg=nextNum();
        const fA=nextNum()!==0,fS=nextNum()!==0;
        const ex=ax(nextNum()),ey=ay(nextNum());
        for (const [cp1x,cp1y,cp2x,cp2y,epx,epy] of arcToCubic(cx,cy,rx,ry,phiDeg,fA,fS,ex,ey)){
          addCubic(cp1x,cp1y,cp2x,cp2y,epx,epy);
        }
        prevQuadCpx=ex;prevQuadCpy=ey;
        break;
      }
      case 'Z':{
        flushPath(true);
        cx=sx;cy=sy;prevCubCp2x=sx;prevCubCp2y=sy;prevQuadCpx=sx;prevQuadCpy=sy;lastCurveCmd='';
        break;
      }
    }
  }
  flushPath(false);
  return paths;
}

/**
 * SVG ファイルからパス情報を抽出して BezierPath 配列に変換する。
 * canvasWidth/canvasHeight を指定することで、SVGのアスペクト比をキャンバスのピクセル空間で保持する。
 */
export async function parseSvgPaths(file: File, canvasWidth = 1, canvasHeight = 1): Promise<BezierPath[]> {
  const text = await file.text();
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) throw new Error('SVG element not found');

  const vb = svg.viewBox.baseVal;
  let minX: number, minY: number, svgW: number, svgH: number;
  if (vb && vb.width > 0 && vb.height > 0) {
    minX = vb.x; minY = vb.y; svgW = vb.width; svgH = vb.height;
  } else {
    minX = 0; minY = 0;
    svgW = parseFloat(svg.getAttribute('width') || '100');
    svgH = parseFloat(svg.getAttribute('height') || '100');
  }

  // SVGをキャンバスに "contain" (アスペクト比保持) でフィットさせるスケール
  const scale = Math.min(canvasWidth / svgW, canvasHeight / svgH);
  const offsetPxX = (canvasWidth - svgW * scale) / 2;
  const offsetPxY = (canvasHeight - svgH * scale) / 2;
  const norm = (x: number, y: number): [number, number] => [
    ((x - minX) * scale + offsetPxX) / canvasWidth,
    ((y - minY) * scale + offsetPxY) / canvasHeight,
  ];

  const allPaths: BezierPath[] = [];
  doc.querySelectorAll('path').forEach(el => {
    if (el.closest('defs')) return;
    const d = el.getAttribute('d');
    if (!d) return;
    const transform = getElementTransform(el, svg);
    allPaths.push(...parseD(d, transform, norm));
  });

  return allPaths;
}
