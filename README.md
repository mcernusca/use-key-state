# useKeyState

Keyboard events as values for React

## Introduction

useKeyState monitors key presses and when a rule matches, your component re-renders.

Read this first: https://use-key-state.mihaicernusca.com

Example: https://codesandbox.io/s/n4o5z6yk3l

## Install

```text
npm install use-key-state --save-dev
```

## Usage

Pass it a map of hotkey rules as strings and it hands back one of the same shape:

```javascript
const {asd} = useKeyState({asd: 'a+s+d'})
```

Or pass it an array of rules per key:

```javascript
const {asd, copy} = useKeyState({asd: 'a+s+d', copy: ['meta+c', 'ctrl+c']})
```

The values are state objects with three boolean properties: `pressed`, `down` and `up`.

Use `pressed` if you want to know if the keys are currently down. This is always true while the rule associated with it matches.

Use `down` or `up` if you want to know when the `keydown` and `keyup` events that caused the rule to match trigger. These values will be false after you read the value so be sure to capture it if you need it in multiple places! This is the equivalent of an event callback - _you read it, consider yourself notified._

This behavior is also what makes it safe to use because if it returns true in one render it is guaranteed to return false at the next:

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
<div className={asd.pressed ? 'is-active' : 'is-not-active'} />
```

or inside an event handler or other form of render loop:

```javascript
handleDrag = e => {
  if (asd.pressed) {
    // do things differently while key is pressed
  }
}
```

### Document Events

While useKeyState hooks maintain their own internal state, they share one singleton document event listener making them relatively cheap. Events are called in a last-in-first-out order giving your deeper components a chance to handle the event first. If you use multiple instances of the useKeyState hook in one component the same rule applies.

### Configuration

useKeyState accepts a second parameter for configuration which will be merged in with the default:

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
const {asd} = useKeyState({asd: 'a+s+d'}, {captureEvents: isEditing})
```

or, don't bind at all unless we're editing:

```javascript
const {asd} = useKeyState({asd: isEditing ? 'a+s+d' : ''})
```

### Query

If you just need a way to query the pressed keys and not re-render your component you can instantiate the hook with no parameters and get a query object with a few helper methods on it:

```javascript
const query = useKeyState().keyStateQuery

if (query.pressed('space') {
  // true while space key is pressed
}

// also comes with some helper methods. Equivalent to above:

if (query.space() {
  // true while space key is pressed
}
```

This object gets merged into all returns under the key `keyStateQuery` in case you need access to the query object but don't want to create another instance:

```javascript
const { asd, keyStateQuery } = useKeyState({ "a+s+d"});
```

### Rule syntax

useKeyState keeps track of keyboard [event.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) values between key up and down events. A valid rule is a plus sign separated string of keyboard event codes.

Codes map to the physical key not the key value. To test the key code of a particular key I recommend this tool: [keycode.info](https://keycode.info/). This is a valid rule:

```javascript
const { shiftA } = useKeyState({ ["ShiftLeft + KeyA", "ShiftRight + KeyA"]});
```

For convenience we map a few common codes to more sensible alternatives. This is also an equivalent rule:

```javascript
const { shiftA } = useKeyState({"shift + a"});
```

Much better!

We map `a-Z`, `0-9`, `f1-f12`, `[`, `]`, `shift`,`meta|cmd|command|win`,`ctrl|cntrl|control`,`tab`,`esc|escape`,`plus|equal|equals|=`,`minus`,`delete|backspace`,`space`,`alt|opt`,`period|.`,`up`,`down`,`right`,`left`,`enter|return`,`slash|/`,`backslash|\`. This list may fall out of sync, check the source (toCodes function) if not sure!

### Overlapping rules

Consider the example:

```javascript
const {forward, backward, backspace, tab, undo, redo} = useKeyState({
  undo: 'meta+z', 'ctrl+z',
  redo: 'shift+meta+z', 'shift+ctrl+z'
})
```

If you have rules that are a subset of another rule they will both match when the more specific rule fires (although they'll both only match once - it won't reset). Because of this you have to be careful to check the specific rule first:

```javascript
// If undo (meta+z) matches, make sure it isn't a redo (shift+meta+z)
if (undo.down) {
  if (redo.down) {
    return void onRedo()
  }
  return void onUndo()
}
```

Avoid separate instances of the useKeyState hook that contain overlapping rules as your component will re-render twice. A good reason to use separate instances of this hook in one component is because you want a to pass a different configuration object in the 2nd parameter. Here is a real-life example:

```javascript
// We want to capture and support key repeat for arrow keys while editing:
const {upArrow, downArrow, leftArrow, rightArrow} = useKeyState(
  {
    upArrow: isEditing ? 'up' : '',
    downArrow: isEditing ? 'down' : '',
    leftArrow: isEditing ? 'left' : '',
    rightArrow: isEditing ? 'right' : ''
  },
  {
    ignoreRepeatEvents: false,
    captureEvents: isEdit && focusKey
  }
)
// But we don't want to support key repeat for the undo and redo key bindings
const {forward, backward, backspace, tab, undo, redo} = useKeyState(
  {
    undo: isEdit ? ['meta+z', 'ctrl+z'] : '',
    redo: isEdit ? ['shift+meta+z', 'shift+ctrl+z'] : ''
  },
  {
    captureEvents: isEditing
  }
)
```

That's it!

## Goals

- enable a different way to program with key events

## Non-Goals

- legacy browsers support

- support multiple rule syntaxes

- key sequences, although that could be a specific form of the keyState hook at some point

Think carefully about what you need!

## Quirks

Meta key clears the map when it goes up as we don't get key up events after the meta key is pressed. That means while meta is down all further key presses will return `pressed` until meta goes up.

These are implementation details which might change but this is the current behavior.

## Notes

If you're still confused, this is essentially hook sugar over a callback API like:

```javascript
// not real code
KeyState.on('a+s+d', down => {
  this.setState({asdPressed: down}, () => {
    if (down) {
      // do the down thing
    } else {
      // do the up thing
    }
  })
})
```
