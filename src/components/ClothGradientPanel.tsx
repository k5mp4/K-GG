import { useState, type ReactNode } from 'react';
import { InputColor } from 'tweeq';
import { useGradientStore } from '../store/gradientStore';
import { Collapsible } from './Collapsible';
import { CustomSelect } from './CustomSelect';
import { SliderField } from './SliderField';
import { Toggle } from './Toggle';
import type { ClothGradientQuality } from '../types/clothGradient';

type ControlGroupProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

function ClothControlGroup({ title, defaultOpen = true, children }: ControlGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-cream/35 bg-k-surface/45">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-3 py-2 text-left font-display text-xs uppercase tracking-wider text-deep hover:bg-k-muted/40"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <span className="text-[10px] opacity-60">{isOpen ? '−' : '+'}</span>
      </button>
      <Collapsible isOpen={isOpen}>
        <div className="border-t border-cream/20 p-3">{children}</div>
      </Collapsible>
    </div>
  );
}

export function ClothGradientPanel() {
  const { clothGradient, setClothGradient } = useGradientStore();

  return (
    <div className="space-y-3 text-[11px]" data-cloth-panel>
      {/* Quality */}
      <div className="space-y-2 border-b border-cream/10 pb-3">
        <CustomSelect
          label="Quality"
          value={clothGradient.quality}
          options={[
            { value: 'low', label: 'Low (40×40)' },
            { value: 'medium', label: 'Medium (72×72)' },
            { value: 'high', label: 'High (128×128)' },
          ]}
          onChange={(val) => setClothGradient({ quality: val as ClothGradientQuality })}
        />
      </div>

      {/* Surface Wave */}
      <ClothControlGroup title="Surface Wave" defaultOpen>
        <div className="space-y-3">
          <div className="flex items-center justify-between border border-cream/20 bg-k-surface/40 px-2.5 py-2">
            <span className="text-[10px] uppercase tracking-wider text-cream/70">Seamless Loop</span>
            <Toggle
              variant="switch"
              size="xs"
              checked={clothGradient.loopEnabled}
              ariaLabel="Cloth seamless loop"
              onChange={(enabled) => setClothGradient({ loopEnabled: enabled })}
            />
          </div>
          <SliderField
            label="Amplitude 1"
            value={clothGradient.amplitude1}
            min={0}
            max={2}
            step={0.01}
            onChange={(v) => setClothGradient({ amplitude1: v })}
          />
          <SliderField
            label="Amplitude 2"
            value={clothGradient.amplitude2}
            min={0}
            max={2}
            step={0.01}
            onChange={(v) => setClothGradient({ amplitude2: v })}
          />
          <SliderField
            label="Frequency 1"
            value={clothGradient.frequency1}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(v) => setClothGradient({ frequency1: v })}
          />
          <SliderField
            label="Frequency 2"
            value={clothGradient.frequency2}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(v) => setClothGradient({ frequency2: v })}
          />
          <SliderField
            label="Speed 1"
            value={clothGradient.speed1}
            min={-5}
            max={5}
            step={0.1}
            onChange={(v) => setClothGradient({ speed1: v })}
          />
          <SliderField
            label="Speed 2"
            value={clothGradient.speed2}
            min={-5}
            max={5}
            step={0.1}
            onChange={(v) => setClothGradient({ speed2: v })}
          />
          <SliderField
            label="Normal Strength"
            value={clothGradient.normalStrength}
            min={0}
            max={3}
            step={0.05}
            onChange={(v) => setClothGradient({ normalStrength: v })}
          />
        </div>
      </ClothControlGroup>

      {/* Organic Motion */}
      <ClothControlGroup title="Organic Motion" defaultOpen={false}>
        <div className="space-y-3">
          <SliderField
            label="Warp Strength"
            value={clothGradient.warpStrength}
            min={0}
            max={2}
            step={0.05}
            onChange={(v) => setClothGradient({ warpStrength: v })}
          />
          <SliderField
            label="Noise Scale"
            value={clothGradient.noiseScale}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(v) => setClothGradient({ noiseScale: v })}
          />
          <SliderField
            label="Noise Amplitude"
            value={clothGradient.noiseAmplitude}
            min={0}
            max={1.5}
            step={0.01}
            onChange={(v) => setClothGradient({ noiseAmplitude: v })}
          />
          <SliderField
            label="Noise Speed"
            value={clothGradient.noiseSpeed}
            min={-5}
            max={5}
            step={0.1}
            onChange={(v) => setClothGradient({ noiseSpeed: v })}
          />
        </div>
      </ClothControlGroup>

      {/* Lighting */}
      <ClothControlGroup title="Lighting" defaultOpen={false}>
        <div className="space-y-3">
          <SliderField
            label="Ambient Intensity"
            value={clothGradient.ambientIntensity}
            min={0}
            max={2}
            step={0.05}
            onChange={(v) => setClothGradient({ ambientIntensity: v })}
          />
          <SliderField
            label="Light Intensity"
            value={clothGradient.lightIntensity}
            min={0}
            max={5}
            step={0.1}
            onChange={(v) => setClothGradient({ lightIntensity: v })}
          />
          <SliderField
            label="Light Azimuth (°)"
            value={clothGradient.lightAzimuth}
            min={-180}
            max={180}
            step={1}
            onChange={(v) => setClothGradient({ lightAzimuth: v })}
          />
          <SliderField
            label="Light Elevation (°)"
            value={clothGradient.lightElevation}
            min={-90}
            max={90}
            step={1}
            onChange={(v) => setClothGradient({ lightElevation: v })}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-cream/60">Sky Color</label>
              <div className="tq-color-input">
                <InputColor
                  value={clothGradient.skyLightColor}
                  onChange={(value) => setClothGradient({ skyLightColor: value.toUpperCase() })}
                  alpha={false}
                  aria-label="Cloth Sky Color"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[9px] uppercase tracking-wider text-cream/60">Ground Color</label>
              <div className="tq-color-input">
                <InputColor
                  value={clothGradient.groundLightColor}
                  onChange={(value) => setClothGradient({ groundLightColor: value.toUpperCase() })}
                  alpha={false}
                  aria-label="Cloth Ground Color"
                />
              </div>
            </div>
          </div>
        </div>
      </ClothControlGroup>

      {/* Specular */}
      <ClothControlGroup title="Specular" defaultOpen={false}>
        <div className="space-y-3">
          <SliderField
            label="Specular Strength"
            value={clothGradient.specularStrength}
            min={0}
            max={3}
            step={0.05}
            onChange={(v) => setClothGradient({ specularStrength: v })}
          />
          <SliderField
            label="Specular Power"
            value={clothGradient.specularPower}
            min={1}
            max={128}
            step={1}
            onChange={(v) => setClothGradient({ specularPower: v })}
          />
          <div>
            <label className="mb-1 block text-[9px] uppercase tracking-wider text-cream/60">Specular Color</label>
            <div className="tq-color-input">
              <InputColor
                value={clothGradient.specularColor}
                onChange={(value) => setClothGradient({ specularColor: value.toUpperCase() })}
                alpha={false}
                aria-label="Cloth Specular Color"
              />
            </div>
          </div>
        </div>
      </ClothControlGroup>

      {/* Fresnel */}
      <ClothControlGroup title="Fresnel" defaultOpen={false}>
        <div className="space-y-3">
          <SliderField
            label="Fresnel Power"
            value={clothGradient.fresnelPower}
            min={0.5}
            max={10}
            step={0.1}
            onChange={(v) => setClothGradient({ fresnelPower: v })}
          />
          <SliderField
            label="Color Strength"
            value={clothGradient.fresnelColorStrength}
            min={0}
            max={2}
            step={0.05}
            onChange={(v) => setClothGradient({ fresnelColorStrength: v })}
          />
          <div>
            <label className="mb-1 block text-[9px] uppercase tracking-wider text-cream/60">Fresnel Color</label>
            <div className="tq-color-input">
              <InputColor
                value={clothGradient.fresnelColor}
                onChange={(value) => setClothGradient({ fresnelColor: value.toUpperCase() })}
                alpha={false}
                aria-label="Cloth Fresnel Color"
              />
            </div>
          </div>
        </div>
      </ClothControlGroup>

      {/* Ramp */}
      <ClothControlGroup title="Ramp" defaultOpen={false}>
        <div className="space-y-3">
          <SliderField
            label="Ramp Offset"
            value={clothGradient.rampOffset}
            min={-1}
            max={1}
            step={0.01}
            onChange={(v) => setClothGradient({ rampOffset: v })}
          />
        </div>
      </ClothControlGroup>
    </div>
  );
}
