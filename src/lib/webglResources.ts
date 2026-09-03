/**
 * Small WebGL resource constructors shared by renderer owners.
 *
 * Each constructor either returns a fully initialized object or releases the
 * object it created before rethrowing the original error.  Higher-level owners
 * remain responsible for registering successful resources and for disposing
 * their complete graph.
 */
export function createWebGLTexture2D(
  gl: WebGL2RenderingContext,
  errorMessage: string,
): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) throw new Error(errorMessage);
  try {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  } catch (error) {
    gl.deleteTexture(texture);
    throw error;
  }
}

export function createWebGLFramebufferWithTexture(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  errorMessage: string,
): WebGLFramebuffer {
  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) throw new Error(errorMessage);
  try {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return framebuffer;
  } catch (error) {
    gl.deleteFramebuffer(framebuffer);
    throw error;
  }
}
