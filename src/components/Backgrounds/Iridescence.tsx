import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import { useEffect, useRef } from 'react';

interface IridescenceProps {
  color?: [number, number, number];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
  className?: string;
}

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec3 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uAmplitude;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    float time = uTime * 0.2;
    
    vec2 p = -1.0 + 2.0 * uv;
    p.x *= uResolution.x / uResolution.y;
    
    float d = length(p - uMouse);
    float f = 0.0;
    
    f += 0.5 * sin(10.0 * uv.x + time);
    f += 0.2 * sin(20.0 * uv.y - time);
    
    vec3 col = 0.5 + 0.5 * cos(time + uv.xyx + vec3(0, 2, 4) + uColor);
    col *= 1.0 - exp(-10.0 * abs(f));
    
    col += uAmplitude * (1.0 - smoothstep(0.0, 0.5, d));

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Iridescence({
  color = [0.3, 0.2, 0.5],
  speed = 1.0,
  amplitude = 0.1,
  mouseReact = true,
  className = ""
}: IridescenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    containerRef.current.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(...color) },
        uResolution: { value: [0, 0] },
        uMouse: { value: [0, 0] },
        uAmplitude: { value: amplitude },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseReact || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mousePos.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mousePos.current.y = (1 - (e.clientY - rect.top) / rect.height) * 2 - 1;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    resize();

    let request: number;
    const update = (t: number) => {
      request = requestAnimationFrame(update);
      program.uniforms.uTime.value = t * 0.001 * speed;
      program.uniforms.uMouse.value = [mousePos.current.x, mousePos.current.y];
      renderer.render({ scene: mesh });
    };
    request = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(request);
      if (gl.canvas.parentElement) {
        gl.canvas.remove();
      }
    };
  }, [color, speed, amplitude, mouseReact]);

  return <div ref={containerRef} className={`absolute inset-0 -z-10 pointer-events-none ${className}`} />;
}
