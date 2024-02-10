export type KeyState = {
  pressed: boolean
  down: boolean
  up: boolean
}

export type KeyStateOptions = {
  captureEvents?: boolean
  ignoreRepeatEvents?: boolean
  ignoreCapturedEvents?: boolean
  ignoreInputAcceptingElements?: boolean
  priority?: number
  debug?: boolean
}

export type KeyRules = {
  [x: string]: string | string[]
}

export type KeyStateQuery = {
  pressed: (input: string) => boolean
  space: () => boolean
  shift: () => boolean
  ctrl: () => boolean
  alt: () => boolean
  option: () => boolean
  meta: () => boolean
  esc: () => boolean
}

type KeyStateProps<T> = {[P in keyof T]: KeyState}

type KeyStateQueryObject = {
  keyStateQuery: KeyStateQuery
}

export type KeyStates<T> = KeyStateProps<T> & KeyStateQueryObject

export function useKeyState<T extends KeyRules>(
  rulesMap?: T,
  configOverrides?: KeyStateOptions
): KeyStates<T>

export const DepthContext: React.Context<number>

export interface KeyStateLayerProps {
  children: ReactNode
}

export function KeyStateLayer(props: KeyStateLayerProps): React.JSX.Element
