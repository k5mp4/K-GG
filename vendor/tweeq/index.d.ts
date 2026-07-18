import type {HTMLAttributes, ReactElement} from 'react'

export interface InputNumberProps extends Omit<HTMLAttributes<HTMLDivElement>, 'default' | 'onChange'> {
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

export interface InputAngleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'onFocus' | 'onBlur'> {
  value: number
  onChange?: (value: number) => void
  snap?: number
  angleOffset?: number
  disabled?: boolean
  invalid?: boolean
  onFocus?: () => void
  onBlur?: () => void
  onConfirm?: () => void
}

export declare function InputAngle(props: InputAngleProps): ReactElement

export interface InputColorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: string
  onChange?: (value: string) => void
  alpha?: boolean
  presets?: readonly string[]
}

export declare function InputColor(props: InputColorProps): ReactElement

export interface ViewportProps extends HTMLAttributes<HTMLDivElement> {
  appId?: string
}

export declare function Viewport(props: ViewportProps): ReactElement
