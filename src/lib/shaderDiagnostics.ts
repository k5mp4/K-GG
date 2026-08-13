import type { ShaderError } from '../../packages/kgg-control/src/index';

const MAX_SHADER_ERRORS = 64;
const shaderErrors: ShaderError[] = [];

export function recordShaderError(
  stage: ShaderError['stage'],
  program: string,
  message: string,
): void {
  shaderErrors.push({
    timestamp: new Date().toISOString(),
    stage,
    program,
    message: message.slice(0, 8_000),
  });
  if (shaderErrors.length > MAX_SHADER_ERRORS) shaderErrors.splice(0, shaderErrors.length - MAX_SHADER_ERRORS);
}

export function getShaderErrors(): ShaderError[] {
  return shaderErrors.map(error => ({ ...error }));
}

export function clearShaderErrors(): void {
  shaderErrors.length = 0;
}
