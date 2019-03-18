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

export type KeyStates = {
  [x: string]: KeyState
  keyStateQuery: KeyStateQuery
}

export function useKeyState(
  rulesMap?: KeyRules,
  configOverrides?: KeyStateOptions
): KeyStates
