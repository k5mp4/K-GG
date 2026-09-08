import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { ClothGradientRenderer } from './clothGradientRenderer';

describe('Cloth ramp texture lifecycle', () => {
  it('keeps the texture and skips GPU updates until bytes change', () => {
    const texture = new THREE.DataTexture(new Uint8Array([1, 2, 3, 255]), 1, 1, THREE.RGBAFormat);
    const dispose = vi.spyOn(texture, 'dispose');
    const owner = { rampTexture: texture, material: { uniforms: { uGradientRamp: { value: texture } } } };
    const update = (data: Uint8Array) => ClothGradientRenderer.prototype.updateRampData.call(owner as unknown as ClothGradientRenderer, data);
    update(new Uint8Array([1, 2, 3, 255]));
    expect(owner.rampTexture).toBe(texture);
    expect(texture.version).toBe(0);
    update(new Uint8Array([4, 5, 6, 255]));
    expect(owner.rampTexture).toBe(texture);
    expect(texture.image.data).toEqual(new Uint8Array([4, 5, 6, 255]));
    expect(texture.version).toBe(1);
    expect(dispose).not.toHaveBeenCalled();
    update(new Uint8Array([1, 2, 3, 255, 4, 5, 6, 255]));
    expect(owner.rampTexture).not.toBe(texture);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(owner.material.uniforms.uGradientRamp.value).toBe(owner.rampTexture);
    expect(owner.rampTexture.minFilter).toBe(THREE.LinearFilter);
  });
});
