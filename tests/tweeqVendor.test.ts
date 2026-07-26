import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {describe, expect, it} from 'vitest'

const vendorRoot = resolve(process.cwd(), 'vendor/tweeq')
const readVendor = (name: string) => readFileSync(resolve(vendorRoot, name), 'utf8')

describe('Tweeq vendor contract', () => {
  it('contains only the approved runtime exports', () => {
    const esm = readVendor('index.es.js')
    const exportBlock = esm.match(/export \{([^}]+)\};/s)?.[1] ?? ''
    const exports = exportBlock
      .split(',')
      .map((part: string) => part.trim().replace(/^.*\s+as\s+/, ''))
      .filter(Boolean)
      .sort()

    expect(exports).toEqual([
      'InputAngle',
      'InputButton',
      'InputButtonToggle',
      'InputCheckbox',
      'InputColor',
      'InputCubicBezier',
      'InputCubicBezierPicker',
      'InputDropdown',
      'InputDrum',
      'InputNumber',
      'InputPosition',
      'InputRadio',
      'InputShuffle',
      'InputSize',
      'InputString',
      'InputSwitch',
      'InputTime',
      'InputTranslate',
      'InputVec',
      'Viewport',
      'fromEnum',
      'fromNumber',
      'fromString',
    ])
  })

  it('does not ship dynamic expression execution or an external icon loader', () => {
    for (const name of ['index.es.js', 'index.cjs']) {
      const artifact = readVendor(name)
      expect(artifact).not.toContain('new Function')
      expect(artifact).not.toContain('api.iconify.design')
      expect(artifact).not.toContain('dangerouslySetInnerHTML')
      expect(artifact).not.toContain('@iconify/react')
    }
  })

  it('keeps runtime externals limited to React', () => {
    const esm = readVendor('index.es.js')
    const imports = [...esm.matchAll(/^import .*? from ["']([^"']+)["'];?$/gm)].map(
      match => match[1],
    )
    expect(imports.sort()).toEqual(['react', 'react-dom', 'react/jsx-runtime'])
  })

  it('records the fixed upstream source', () => {
    const metadata = JSON.parse(readVendor('package.json')) as {
      gitHead: string
      repository: string
    }
    expect(metadata.gitHead).toBe('75542380032f3429b737cea3840d719cdbc5f7f8')
    expect(metadata.repository).toBe('https://github.com/arcatdmz/tweeq')
  })
})
