import React from 'react'

// Essentially sugar over:
// useKey.on("esc", (down) => {
//   this.setState({ "escPressed": down }, () => {
//     if (down) {
//       // handle esc key down here
//     }
//   })
// })

// API:
// You pass usefulKeys a map of keys to hotkey rules:
//
// {selectAll: "shift+a", space: "space"}
//
// It returns an object with the same shape.
//
// { selectAlls, space } = usefulKeys({selectAll: "shift+a", space: "space"})
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
// usefulKeys monitors key presses and when a rule matches, your component
// re-renders. To respond, in your render methods you simply check the
// key state property:
//
// if (selectAll.down) {
//  dispatch({type:'SELECT_ALL'})
// }
//
// The pressed property is appropriate to use if you have your own render
// loop or inside other event handlers such as a drag handler:
//
// onDrag =(e) => {
//  if(space.pressed) {
//      panCanvas(e)
//   }
// }
//
// That's it!

// Goals:
// - simple key bindings w/o callbacks (immediate mode key events)
// - add ability to query the state of the keyboard (bypass react state)
// - capture events (pass ,capture at the end of the rule)
// - basic configuration ({ keyRepeat: true } by default)
// - TODO: be able to bind to a particular subtree (return bind methods)
// - TODO: filter events that originate from interative elements (inputs)
// - TODO: accept an array of rules for same key ['meta+c', 'ctrl+c'] or 'meta+c, ctrl+c'
// - TODO: investigate the performance costs of not having a singleton event handler (applicable to global bindings only)

// Non-goals:
// - to necessarily be a better mousetrap, hotkeys.js  or react-hotkeys - rather enable a different
// way to program with key events
//
// Other key hooks I'm aware of:
// https://github.com/haldarmahesh/use-key-hook
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
    case 'tab':
      return 9
    case 'enter':
    case 'return':
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
  const { code, needsShift } = convertChar(input)
  const isDown = down(code)
  return needsShift ? isDown && down(toCode('shift')) : isDown
}

const convertChar = input => {
  let needsShift = false
  let code = input
  code = toCode(input)
  if (!code) {
    needsShift = input === input.toUpperCase()
    code = input.toUpperCase().charCodeAt(0)
  }
  return { code: code, needsShift: needsShift }
}

const parseRule = rule => {
  return rule.split('+').map(str => str.trim())
}

const matchRule = (rule, down) => {
  if (typeof rule === 'string') {
    const parts = parseRule(rule)
    const results = parts.map(str => char(str, down))
    return results.every(r => r === true)
  }
  return down(rule)
}

function extractCaptureFlag(rule) {
  if (typeof rule === 'string') {
    const parts = rule.split(',')
    if (parts[1] && parts[1].trim() === 'capture') {
      return { rule: parts[0].trim(), needsCapture: true }
    }
  }
  return { rule: rule, needsCapture: false }
}

function initRulesMap(rulesMap, captureSet) {
  // extract capture set from rules
  const cleanMap = {}
  Object.entries(rulesMap).forEach(([key, value]) => {
    const { rule, needsCapture } = extractCaptureFlag(value)
    if (needsCapture) {
      const parts = parseRule(rule)
      parts.forEach(str => {
        const { code } = convertChar(str)
        captureSet.add(code)
      })
    }
    cleanMap[key] = rule
  })
  return cleanMap
}

function initState(rulesMap) {
  const keysToStatus = {}
  Object.entries(rulesMap).forEach(([key, value]) => {
    keysToStatus[key] = new KeyState(false)
  })
  return keysToStatus
}

// --

const defaultConfig = {
  keyRepeat: true
}

export const usefulKeys = function(rulesMap, config = defaultConfig) {
  // Query live key state and some common key utility fns:
  const query = React.useMemo(
    () => ({
      pressed: input => {
        return matchRule(input, down)
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

  // Set of key codes to capture
  const captureSet = React.useRef(new Set([]))
  // Maintain a clean copy of the rules map passed in
  const cleanRulesMap = React.useRef({})
  // Keep track of what keys are down, currently bound to window
  const keyMap = React.useRef({})

  // This gets passed back to the caller and is updated
  // once any hotkey rule matches or stops matching
  const [state, setState] = React.useState(() => {
    cleanRulesMap.current = initRulesMap(rulesMap, captureSet.current)
    return {
      ...initState(cleanRulesMap.current),
      ...query
    }
  })

  const down = code => {
    return keyMap.current[code] || false
  }

  const updateState = () => {
    setState(prevState => {
      const tempState = { ...prevState }
      Object.entries(cleanRulesMap.current).forEach(([key, value]) => {
        const matched = matchRule(value, down)
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
    if (captureSet.current.has(event.which)) {
      event.preventDefault()
    }

    if (config.keyRepeat && keyMap.current[event.which]) {
      // handle it as a key up (drop every other frame, hack)
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
