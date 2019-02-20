# use-key-state

Keyboard events as values

## Introduction

Keyboard events as data for React. useKeyState monitors key presses and when a rule matches, your component re-renders.

Read this first: https://use-key-state.mihaicernusca.com

Example: https://codesandbox.io/s/n4o5z6yk3l

## Install

```text
copypasta (for now)
```

## Usage

Pass it a map of hotkey rules as strings and it hands back one of the same shape:

```javascript
const { asd } = useKeyState({ asd: 'a+s+d' })
```

Or pass it an array of rules per key:

```javascript
const { asd, copy } = useKeyState({ asd: 'a+s+d', copy: ['meta+c', 'ctrl+c'] })
```

The values are state objects with three boolean properties: `pressed`, `down` and `up`.

Use `pressed` if you want to know if the keys are currently down. This is always true while the rule associated with it matches.

Use `down` or `up` if you want to know when the `keydown` and `keyup` events that caused the rule to match trigger. These values will be false after you read the value so be sure to capture it if you need it in multiple places! This is the equivalent of an event callback - *you read it, consider yourself notified.*

This behavior is also what makes it safe to use because it is guaranteed to return false at the next render:

```javascript
useEffect(() => {
  if (asd.down) {
    dispatch({type:'do-the-down-thing'})
  } else if (asd.up) {
    dispatch({type:'do-the-up-thing'})
  }
)
```

The pressed property is appropriate to use if you need to base your render logic on the pressed state:

```jsx
<div className={ asd.pressed ? "is-active" : "is-not-active"} />
```

or inside an event handler or other form of render loop:

```javascript
handleDrag = (e) => {
  if(asd.pressed) {
    // do things differently while key is pressed
  }
}
```

### Document Events 

While useKeyState hooks maintain their own internal state, they share one singleton document event listener making them relatively cheap. There might also be room for a useLocalKeyState hook that returns key bindings in the future.

### Configuration

useKeyState accepts a second parameter for configuration which will be merged in with the default configuration

```javascript
const defaultConfig = {
  captureEvents: false, // call event.preventDefault()
  ignoreRepeatEvents: true, // filter out repeat key events (whos event.repeat property is true)
  ignoreCapturedEvents: true, // respect the defaultPrevented event flag
  ignoreInputAcceptingElements: true // filter out events from all forms of inputs
}
```

Configuration is at the hook level - feel free to use multiple hooks in the same component where needed.

### Dynamic Rules and Configuration

Both the rules map and the configuration objects can be updated dynamically. For example, only capture if we're in editing mode:

```javascript
const { asd } = useKeyState({ asd: 'a+s+d' }, { preventDefault: isEditing })
```

### Query

If you just need a way to query the pressed keys the hook returns a `query` object with a few helper methods on it:

```javascript
const { query } = useKeyState()

if (query.pressed('space') {
  // true while space key is pressed
}

// also comes with some helper methods. Above is equivalent to:

if (query.space() {
  // true while space key is pressed
}
```

That's it!


## Goals

- enable a different way to program with key events

## Non-Goals

- legacy browsers support

- support multiple rule syntaxes

- key sequences, although that could be a specific form of the keyState hook at some point


Think carefully about what you need, it might be smarter to write your own hook abstraction over something else.

## Quirks

useKeyState maintains a map of `event.key` values that it's watching for. These values include all modifiers like the Shift key. A rule like `"shift+a"` will not match reliably and you should use `"A"` instead. Because of this whenever the Shift key is pressed the map is emptied so shift essentially acts as an interrupt for any hotkey. This is an implementation detail which might change but this is the current behavior. Generally, avoid hotkey rules that involve the Shift key is what I'm saying.

## Notes

If you're still confused, this is essentially hook sugar over a callback API like: 

```javascript
// not real code
KeyState.on("a+s+d", (down) => {
  this.setState({ "asdPressed": down }, () => {
    if (down) {
      // do the down thing
    } else {
     // do the up thing
    }
  })
})
```

