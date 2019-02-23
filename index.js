import React from 'react'

//  Event Emitter

class EventEmitter {
  constructor() {
    this.events = {}
  }
  _getEventListByName(eventName) {
    if (typeof this.events[eventName] === 'undefined') {
      this.events[eventName] = new Set()
    }
    return this.events[eventName]
  }
  on(eventName, fn) {
    this._getEventListByName(eventName).add(fn)
  }
  once(eventName, fn) {
    const self = this
    const onceFn = function(...args) {
      self.removeListener(eventName, onceFn)
      fn.apply(self, args)
    }
    this.on(eventName, onceFn)
  }
  emit(eventName, ...args) {
    this._getEventListByName(eventName).forEach(
      function(fn) {
        fn.apply(this, args)
      }.bind(this)
    )
  }
  removeListener(eventName, fn) {
    this._getEventListByName(eventName).delete(fn)
  }
}

// Document Event Listener

const eventEmitter = new EventEmitter()
const boundEvents = {}
function emitDomEvent(event) {
  eventEmitter.emit(event.type, event)
}

const DocumentEventListener = {
  addEventListener(eventName, listener) {
    if (!boundEvents[eventName]) {
      document.addEventListener(eventName, emitDomEvent, true)
    }
    eventEmitter.on(eventName, listener)
  },
  removeEventListener(eventName, listener) {
    eventEmitter.removeListener(eventName, listener)
  }
}

// Key State

function KeyState(isDown = false, justReset = false) {
  this.pressed = isDown //current (live) combo pressed state
  this.down = isDown //only true for one read after combo becomes valid
  this.up = justReset //only true for one read after combo is no longer valid
}

function _get(context, key) {
  const expiredKey = `_${key}Expired`
  const valueKey = `_${key}`
  if (context[expiredKey]) {
    return false
  }
  context[expiredKey] = true
  return context[valueKey]
}

function _set(context, key, value) {
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

// Utils

function toKey(str) {
  switch (str.toLowerCase()) {
    case 'tab':
      return 'Tab'
    case 'enter':
    case 'return':
      return 'Enter'
    case 'shift':
      return 'Shift'
    case 'ctrl':
    case 'cntrl':
    case 'control':
      return 'Control'
    case 'option':
    case 'opt':
    case 'alt':
      return 'Alt'
    case 'esc':
    case 'escape':
      return 'Escape'
    case 'space':
      return ' '
    case 'left':
      return 'ArrowLeft'
    case 'up':
      return 'ArrowUp'
    case 'right':
      return 'ArrowRight'
    case 'down':
      return 'ArrowDown'
    case 'cmd':
    case 'command':
    case 'win':
    case 'meta':
      return 'Meta'
    case 'plus':
      return '+'
    case 'minus':
      return '-'
    case 'f1':
    case 'f2':
    case 'f3':
    case 'f4':
    case 'f5':
    case 'f6':
    case 'f8':
    case 'f9':
    case 'f10':
    case 'f11':
    case 'f12':
      return str.toUpperCase()
    default:
      return str
  }
}

function matchRule(rule, isDown) {
  function matchRuleStr(ruleStr) {
    const parts = parseRuleStr(ruleStr)
    const results = parts.map(str => isDown(toKey(str)))
    return results.every(r => r === true)
  }

  if (Array.isArray(rule)) {
    return rule.some(ruleStr => matchRuleStr(ruleStr, isDown) === true)
  }
  return matchRuleStr(rule, isDown)
}

function extractCaptureSet(rulesMap) {
  const captureSet = new Set()
  Object.entries(rulesMap).forEach(([_, value]) => {
    const rules = Array.isArray(value) ? value : [value]
    rules.forEach(rule => {
      const parts = parseRuleStr(rule)
      parts.forEach(part => {
        captureSet.add(toKey(part))
      })
    })
  })
  return captureSet
}

function parseRuleStr(rule) {
  return rule.split('+').map(str => str.trim())
}

function mapRulesToState(rulesMap, prevState = {}, isDown = () => false) {
  const keysToState = { ...prevState }
  Object.entries(rulesMap).forEach(([key, rule]) => {
    const matched = matchRule(rule, isDown)
    const prevKeyState = keysToState[key]
    if (prevKeyState) {
      if (prevKeyState.pressed !== matched) {
        const up = prevKeyState.pressed && !matched
        keysToState[key] = new KeyState(matched, up)
      }
    } else {
      keysToState[key] = new KeyState()
    }
  })
  return keysToState
}

function validateRulesMap(map) {
  // Expecting an object
  if (!map || typeof map !== 'object') {
    throw new Error(
      `useKeyState: expecting an object {key:value<String|Array>} as first parameter.`
    )
  }
  // Expecting string or array values for each key
  Object.entries(map).forEach(([key, value]) => {
    const isArray = Array.isArray(value)
    const isString = typeof value === 'string'
    if (!isString && !isArray) {
      throw new Error(
        `useKeyState: expecting string or array value for key ${key}.`
      )
    }
    if (isArray) {
      value.forEach(rule => {
        if (typeof rule !== 'string') {
          throw new Error(
            `useKeyState: expecting array of strings for key ${key}`
          )
        }
      })
    }
  })
}

// Utils

function deepEqual(o1, o2) {
  return JSON.stringify(o1) === JSON.stringify(o2)
}

function isInputAcceptingTarget(event) {
  // content editable
  if (event.target.isContentEditable) {
    return true
  }
  // form elements
  var tagName = (event.target || event.srcElement).tagName
  return tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA'
}

// Config

const defaultConfig = {
  captureEvents: false, // call event.preventDefault()
  ignoreRepeatEvents: true, // filter out repeat key events (whos event.repeat property is true)
  ignoreCapturedEvents: true, // respect the defaultPrevented event flag
  ignoreInputAcceptingElements: true // filter out events from all forms of inputs
}

// useKeyState ¿

export const useKeyState = function(rulesMap, configOverrides) {
  const configRef = React.useRef({ ...defaultConfig, ...configOverrides })
  React.useEffect(
    () => {
      // configOverrides is likely to always be different:
      if (!deepEqual(configOverrides, configRef.current)) {
        configRef.current = { ...defaultConfig, ...configOverrides }
      }
    },
    [configOverrides]
  )
  // Maintain a copy of the rules map passed in
  const rulesMapRef = React.useRef({})
  // Validate and update rulesMap when it changes to enable dynamic rules
  React.useEffect(
    () => {
      // rulesMap is likely to always be different:
      if (!deepEqual(rulesMap, rulesMapRef.current)) {
        validateRulesMap(rulesMap)
        rulesMapRef.current = rulesMap
      }
    },
    [rulesMap]
  )
  // Keep track of what keys are down
  const keyMapRef = React.useRef({})
  // This gets passed back to the caller and is updated
  // once any hotkey rule matches or stops matching
  const [state, setState] = React.useState(() => mapRulesToState(rulesMap))
  // Query live key state and some common key utility fns:
  // This object gets merged into return object
  const query = React.useMemo(
    () => ({
      pressed: input => {
        return matchRule(input, isDown)
      },
      space: () => {
        return isDown(toKey('space'))
      },
      shift: () => {
        return isDown(toKey('shift'))
      },
      ctrl: () => {
        return isDown(toKey('ctrl'))
      },
      alt: () => {
        return isDown(toKey('alt'))
      },
      option: () => {
        return isDown(toKey('option'))
      },
      meta: () => {
        return isDown(toKey('meta'))
      },
      esc: () => {
        return isDown(toKey('esc'))
      }
    }),
    []
  )

  // Re-render the component if the key states have changed.
  // Must capture state value in a ref because the actual
  // updateKeyState function captures the initial value:
  const stateRef = React.useRef(state)
  React.useLayoutEffect(() => {
    stateRef.current = state
  })

  function updateKeyState() {
    const nextState = mapRulesToState(
      rulesMapRef.current,
      stateRef.current,
      isDown
    )
    const isEquivalentState = deepEqual(stateRef.current, nextState)
    if (!isEquivalentState) {
      setState(nextState)
    }
  }

  function isDown(key) {
    return keyMapRef.current[key] || false
  }

  // Event handlers

  function handleDown(event) {
    // Ignore events from input accepting elements (inputs etc)
    if (
      configRef.current.ignoreInputAcceptingElements &&
      isInputAcceptingTarget(event)
    ) {
      return
    }
    // If Shift goes down, throw everything away
    if (event.key === toKey('shift')) {
      keyMapRef.current = {}
    }
    // Ignore handled event
    if (event.defaultPrevented && configRef.current.ignoreCapturedEvents) {
      return
    }
    // Capture event if it is part of our rules and hook is configured to do so:
    if (configRef.current.captureEvents) {
      const captureSet = extractCaptureSet(rulesMapRef.current)
      if (captureSet.has(event.key)) {
        event.preventDefault()
      }
    }
    // Handle key repeat
    if (
      configRef.current.ignoreRepeatEvents === false &&
      event.repeat &&
      keyMapRef.current[event.key]
    ) {
      // handle it as a key up (drop every other frame, hack)
      handleUp(event)
      return
    }

    if (!keyMapRef.current[event.key]) {
      keyMapRef.current[event.key] = true
      updateKeyState()
    }
  }

  function handleUp(event) {
    // Ignore events from input accepting elements (inputs etc)
    if (
      configRef.current.ignoreInputAcceptingElements &&
      isInputAcceptingTarget(event)
    ) {
      return
    }
    // If Shift goes up, throw everything away
    if (event.key === toKey('shift')) {
      keyMapRef.current = {}
    }

    delete keyMapRef.current[event.key]
    updateKeyState()
  }

  React.useEffect(() => {
    DocumentEventListener.addEventListener('keydown', handleDown)
    DocumentEventListener.addEventListener('keyup', handleUp)
    return () => {
      DocumentEventListener.removeEventListener('keydown', handleDown)
      DocumentEventListener.removeEventListener('keyup', handleUp)
    }
  }, [])

  return {
    ...state,
    query
  }
}

export default { useKeyState: useKeyState }
