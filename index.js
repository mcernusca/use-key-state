import React from 'react'

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
