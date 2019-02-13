import React from 'react'

// API:
// You pass useKeys a map of keys to hotkey rules:
//
// {selectAllKey: "shift+a", spaceKey: "space"}
//
// It returns an object with the same shape.
//
// { selectAllKeys, spaceKey } = useKeys({selectAllKey: "shift+a", spaceKey: "space"})
//
// For every key you gave it - it associates a KeyState object that
// has three properties: pressed, down and up.
//
// Use pressed if you want to know if the keys are currently down. This
// is always true while the rule associated to it matches.
//
// Use down or up if you want to know when the keydown and keyup events
// that caused the rule to match triggered. These values will be false
// after you read the value so be sure to capture it if you need it in multiple
// places!
// This is the equivalent of an event callback - you read it, consider yourself notified.
//
// useKeys monitors key presses and when a rule matches your component
// re-renders. To respond, in your render methods you simply check the
// key state property:
//
// if (selectAllKey.down) {
//  dispatch({type:'SELECT_ALL})
// }
//
// The pressed property is appropriate to use if you have your own render
// loop or inside other event handlers such as a drag handler:
//
// onDrag =(e) => {
//  if(spaceKey.pressed) {
//      panCanvas(e)
//   }
// }
//
// That's it!

// Goals:
// - simple key bindings w/o callbacks - immediate mode events:
// See: https://docs.unity3d.com/ScriptReference/Input.GetKeyDown.html
// - add ability to query the state of the keyboard (does bookeeping)
// - TODO: be able to bind to a particular subtree
// - TODO: basic configuration {keyRepeat, preventDefault}
//
// Non-goals:
// - to be a better Mousetrap or react-hotkeys - rather enable a different
// way to program with events (more: https://www.are.na/mihai-cernusca/immediate-mode-guis )
//
// Other key hooks I'm aware of:
// https://github.com/haldarmahesh/use-key-hook
//

// --

const KeyState = function(isDown = false, justReset = false) {
  this.pressed = isDown //current (live) combo pressed state
  this.down = isDown //only true for one read after combo becomes valid
  this.up = justReset //only true for one read after combo is no longer valid
}

const _get = function(context, key) {
  const expiredKey = `_${key}Expired`
  const valueKey = `_${key}`
  if (context[expiredKey]) {
    return false
  }
  context[expiredKey] = true
  return context[valueKey]
}

const _set = function(context, key, value) {
  const expiredKey = `_${key}Expired`
  const valueKey = `_${key}`
  context[expiredKey] = false
  context[valueKey] = value
}

Object.defineProperty(KeyState.prototype, 'down', {
  get: function() {
    return _get(this, 'down')
  },
  set: function(value) {
    return _set(this, 'down', value)
  }
})

Object.defineProperty(KeyState.prototype, 'up', {
  get: function() {
    return _get(this, 'up')
  },
  set: function(value) {
    return _set(this, 'up', value)
  }
})

// --

const toCode = str => {
  switch (str.toLowerCase()) {
    case 'enter':
      return 13
    case 'shift':
      return 16
    case 'ctrl':
    case 'cntrl':
      return 18
    case 'option':
      return 19
    case 'opt':
      return 19
    case 'alt':
      return 19
    case 'esc':
    case 'escape':
      return 27
    case 'space':
      return 32
    case 'left':
      return 37
    case 'up':
      return 38
    case 'right':
      return 39
    case 'down':
      return 40
    case 'cmd':
    case 'meta':
      return 91
    case 'plus':
      return 187
    case 'minus':
      return 189
    default:
      return null
  }
}

const char = (input, down) => {
  let needsShift = false
  let code = input
  code = toCode(input)
  if (!code) {
    needsShift = input === input.toUpperCase()
    code = input.toUpperCase().charCodeAt(0)
  }
  const isDown = down(code)
  return needsShift ? isDown && down(toCode('shift')) : isDown
}

const rule = (rule, down) => {
  if (typeof rule === 'string') {
    const parts = rule.split('+')
    const results = parts.map(str => char(str.trim(), down))
    return results.every(r => r === true)
  }
  return down(rule)
}

function initState(rulesMap) {
  const keysToStatus = {}
  Object.entries(rulesMap).forEach(([key, value]) => {
    keysToStatus[key] = new KeyState(false)
  })
  return keysToStatus
}

// --

export const useKeys = function(rulesMap) {
  // Query live key state and some common key utility fns:
  const query = React.useMemo(
    () => ({
      pressed: input => {
        return rule(input, down)
      },
      space: () => {
        return down(toCode('space'))
      },
      shift: () => {
        return down(toCode('shift'))
      },
      ctrl: () => {
        return down(toCode('ctrl'))
      },
      alt: () => {
        return down(toCode('alt'))
      },
      option: () => {
        return down(toCode('option'))
      },
      meta: () => {
        return down(toCode('meta'))
      },
      esc: () => {
        return down(toCode('esc'))
      }
    }),
    []
  )

  // This gets passed back to the caller and is updated
  // once any hotkey rule matches or stops matching
  const [state, setState] = React.useState(() => {
    return { ...initState(rulesMap), ...query }
  })

  // Keep track of what keys are down, currently bound to window
  const keyMap = React.useRef({})

  const down = code => {
    return keyMap.current[code] || false
  }

  const updateState = () => {
    setState(prevState => {
      const tempState = { ...prevState }
      Object.entries(rulesMap).forEach(([key, value]) => {
        const matched = rule(value, down)
        if (prevState[key].pressed !== matched) {
          const up = prevState[key].pressed && !matched
          tempState[key] = new KeyState(matched, up)
        }
      })
      return JSON.stringify(prevState) === JSON.stringify(tempState)
        ? prevState
        : tempState
    })
  }

  const handleDown = event => {
    // TODO Ignore key repeat - conf?
    if (keyMap.current[event.which]) {
      // Tricky one.. hack for now:
      // handle it as a key up (drop a frame)
      handleUp(event)
      return
    }
    keyMap.current[event.which] = true
    updateState()
  }

  const handleUp = event => {
    delete keyMap.current[event.which]
    updateState()
  }

  React.useEffect(() => {
    window.document.addEventListener('keydown', handleDown)
    window.document.addEventListener('keyup', handleUp)
    return () => {
      window.document.removeEventListener('keydown', handleDown)
      window.document.removeEventListener('keyup', handleUp)
    }
  }, [])

  return state
}
