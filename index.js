import React from 'react'

export const useKey = function() {
  const keyMap = React.useRef({})

  const handleDown = event => {
    keyMap.current[event.which] = true
  }

  const handleUp = event => {
    delete keyMap.current[event.which]
  }

  React.useEffect(() => {
    window.document.addEventListener('keydown', handleDown)
    window.document.addEventListener('keyup', handleUp)
    return () => {
      window.document.removeEventListener('keydown', handleDown)
      window.document.removeEventListener('keyup', handleUp)
    }
  }, [])

  const down = code => {
    return keyMap.current[code] || false
  }

  const shift = () => {
    return down(16)
  }

  const ctrl = () => {
    return down(17)
  }

  const alt = () => {
    return down(18)
  }

  const option = () => {
    return alt()
  }

  const meta = () => {
    return down(91)
  }

  const esc = () => {
    return down(27)
  }

  const space = () => {
    return down(32)
  }

  const char = input => {
    let needsShift = false
    let code = input
    if (typeof input === 'string') {
      needsShift = input === input.toUpperCase()
      code = input.toUpperCase().charCodeAt(0)
    }
    const isDown = down(code)
    return needsShift ? isDown && shift() : isDown
  }

  return { down, char, shift, ctrl, alt, option, meta, esc, space }
}

