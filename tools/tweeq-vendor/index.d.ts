import type {ButtonHTMLAttributes, HTMLAttributes, ReactElement, ReactNode} from 'react'

export type CubicBezierValue = readonly [number, number, number, number]
export type InputPosition = 'start' | 'middle' | 'end'
export type ColorChannel = 'r' | 'g' | 'b' | 'a' | 'h' | 's' | 'v'
export type ColorPickerComponent =
  | readonly ['slider', ColorChannel]
  | readonly ['pad', readonly [ColorChannel, ColorChannel]]
  | readonly ['values']
  | readonly ['presets']

export interface InputEvents {
  onFocus?: () => void
  onBlur?: () => void
  onConfirm?: () => void
}

export interface InputBoxProps {
  invalid?: boolean
  disabled?: boolean
  inlinePosition?: InputPosition
  blockPosition?: InputPosition
}

export interface InputNumberProps
  extends InputBoxProps,
    InputEvents,
    Omit<HTMLAttributes<HTMLDivElement>, 'default' | 'onBlur' | 'onChange' | 'onFocus'> {
  value: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  snap?: number
  bar?: number | boolean
  clampMin?: boolean
  clampMax?: boolean
  precision?: number
  prefix?: string
  suffix?: string
  leftIcon?: string
  rightIcon?: string
  default?: number
}

export declare function InputNumber(props: InputNumberProps): ReactElement

export interface InputAngleProps
  extends InputBoxProps,
    InputEvents,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onBlur' | 'onChange' | 'onFocus' | 'value'> {
  value: number
  onChange?: (value: number) => void
  snap?: number
  angleOffset?: number
}

export declare function InputAngle(props: InputAngleProps): ReactElement

export interface InputColorProps
  extends InputBoxProps,
    InputEvents,
    Omit<HTMLAttributes<HTMLDivElement>, 'onBlur' | 'onChange' | 'onFocus'> {
  value: string
  onChange?: (value: string) => void
  alpha?: boolean
  pickers?: readonly ColorPickerComponent[]
  presets?: readonly string[]
}

export declare function InputColor(props: InputColorProps): ReactElement

export interface InputButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  inlinePosition?: InputPosition
  blockPosition?: InputPosition
  invalid?: boolean
  icon?: string
  label?: string
  chevron?: boolean
  tooltip?: string
  blink?: boolean
  subtle?: boolean
  narrow?: boolean
}

export declare function InputButton(props: InputButtonProps): ReactElement

export interface InputButtonToggleProps
  extends InputBoxProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'> {
  value: boolean
  onChange?: (value: boolean) => void
  icon?: string
  label?: string
}

export declare function InputButtonToggle(props: InputButtonToggleProps): ReactElement

export interface InputCheckboxProps
  extends InputBoxProps,
    InputEvents,
    Omit<HTMLAttributes<HTMLDivElement>, 'onBlur' | 'onChange' | 'onFocus'> {
  value: boolean
  onChange?: (value: boolean) => void
  label?: string
  icon?: string
}

export declare function InputCheckbox(props: InputCheckboxProps): ReactElement

export interface LabelizerProps<T> {
  options: readonly T[]
  labels?: readonly string[]
  labelizer?: (value: T) => string
  prefix?: string
  suffix?: string
}

export interface InputDropdownProps<T>
  extends LabelizerProps<T>,
    InputBoxProps,
    InputEvents,
    Omit<HTMLAttributes<HTMLDivElement>, 'onBlur' | 'onChange' | 'onFocus'> {
  value: T
  onChange?: (value: T) => void
  icons?: readonly string[]
  theme?: string
  font?: string
  align?: string
  renderOption?: (item: T, index: number) => ReactNode
}

export declare function InputDropdown<T>(props: InputDropdownProps<T>): ReactElement

export interface InputDrumProps<T>
  extends LabelizerProps<T>,
    InputBoxProps,
    InputEvents,
    Omit<HTMLAttributes<HTMLDivElement>, 'onBlur' | 'onChange' | 'onFocus'> {
  value: T
  onChange?: (value: T) => void
  font?: string
  cellWidth?: number
}

export declare function InputDrum<T>(props: InputDrumProps<T>): ReactElement

export type Vec2 = readonly [number, number]

export interface InputVecProps<T extends readonly number[] = readonly number[]>
  extends InputEvents,
    Omit<HTMLAttributes<HTMLDivElement>, 'onBlur' | 'onChange' | 'onFocus'> {
  value: T
  onChange?: (value: T) => void
  min?: T | number
  max?: T | number
  step?: T | number
  icon?: readonly string[] | string
  disabled?: boolean
  invalid?: boolean
}

export declare function InputVec<T extends readonly number[]>(props: InputVecProps<T>): ReactElement

export interface InputTranslateProps
  extends InputEvents,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onBlur' | 'onChange' | 'onFocus' | 'value'> {
  value: Vec2
  onChange?: (value: Vec2) => void
  min?: Vec2 | number
  max?: Vec2 | number
  step?: Vec2 | number
  showOverlayLabel?: boolean
}

export declare function InputTranslate(props: InputTranslateProps): ReactElement

export interface InputPositionProps extends InputEvents {
  value: Vec2
  onChange?: (value: Vec2) => void
  min?: Vec2 | number
  max?: Vec2 | number
  step?: Vec2 | number
  disabled?: boolean
  invalid?: boolean
}

export declare function InputPosition(props: InputPositionProps): ReactElement

export interface InputRadioProps<T>
  extends LabelizerProps<T>,
    InputEvents,
    Omit<HTMLAttributes<HTMLUListElement>, 'onBlur' | 'onChange' | 'onFocus'> {
  value: T
  onChange?: (value: T) => void
  icons?: readonly string[]
  tooltips?: readonly string[]
  renderOption?: (option: { label: string; value: T; isActive: boolean }) => ReactNode
}

export declare function InputRadio<T>(props: InputRadioProps<T>): ReactElement

export interface InputSizeProps extends InputEvents {
  value: Vec2
  onChange?: (value: Vec2) => void
  disabled?: boolean
  invalid?: boolean
}

export declare function InputSize(props: InputSizeProps): ReactElement

export interface InputStringProps
  extends InputBoxProps,
    InputEvents,
    Omit<HTMLAttributes<HTMLDivElement>, 'default' | 'onBlur' | 'onChange' | 'onFocus'> {
  value: string
  onChange?: (value: string) => void
  theme?: string
  font?: string
  align?: string
  validator?: (value: string) => unknown
  default?: string
}

export declare function InputString(props: InputStringProps): ReactElement

export interface InputSwitchProps
  extends InputBoxProps,
    InputEvents,
    Omit<HTMLAttributes<HTMLDivElement>, 'onBlur' | 'onChange' | 'onFocus'> {
  value: boolean
  onChange?: (value: boolean) => void
  label?: string
}

export declare function InputSwitch(props: InputSwitchProps): ReactElement

export interface InputTimeProps
  extends InputBoxProps,
    InputEvents,
    Omit<HTMLAttributes<HTMLDivElement>, 'default' | 'onBlur' | 'onChange' | 'onFocus'> {
  value: number
  onChange?: (value: number) => void
  frameRate?: number
  min?: number
  max?: number
  default?: number
}

export declare function InputTime(props: InputTimeProps): ReactElement

export interface InputCubicBezierProps
  extends InputBoxProps,
    InputEvents,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onBlur' | 'onChange' | 'onFocus' | 'value'> {
  value: CubicBezierValue
  onChange?: (value: CubicBezierValue) => void
}

export declare function InputCubicBezier(props: InputCubicBezierProps): ReactElement

export interface InputCubicBezierPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: CubicBezierValue
  onChange?: (value: CubicBezierValue) => void
  onConfirm?: () => void
  disabled?: boolean
}

export declare function InputCubicBezierPicker(props: InputCubicBezierPickerProps): ReactElement

export interface InputShuffleProps<T> extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'> {
  value: T
  onChange?: (value: T) => void
  generate: (previous: T) => T
  icon?: string
}

export declare function InputShuffle<T>(props: InputShuffleProps<T>): ReactElement

export declare function fromNumber(min: number, max: number, step?: number): (previous: number) => number
export declare function fromEnum<T>(options: readonly T[]): (previous: T) => T
export declare function fromString(options?: { length?: number; charset?: string }): (previous: string) => string

export interface ViewportProps extends HTMLAttributes<HTMLDivElement> {
  appId?: string
}

export declare function Viewport(props: ViewportProps): ReactElement
