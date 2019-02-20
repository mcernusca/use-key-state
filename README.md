use-key-state
========================

Keyboard events as values

Introduction
------------

Read this first: https://use-key-state.mihaicernusca.com

Example: https://codesandbox.io/s/n4o5z6yk3l

Install
-------

```text
copypasta (for now)
```

Usage
-----

Pass it a map of hotkey rules and it hands back one of the same shape:

```javascript
const { asd } = useKeyState({ asd: 'a+s+d' })
```

The values are state objects with three boolean properties: `pressed`, `down` and `up`. Your component will re-render only when a rule starts or stops matching.

Use `pressed` if you want to know if the keys are currently down. This is always true while the rule associated to it matches.

Use `down` or `up` if you want to know when the `keydown` and `keyup` events that caused the rule to match triggered. These values will be false after you read the value so be sure to capture it if you need it in multiple places!

This is the equivalent of an event callback - *you read it, consider yourself notified.*

This behavior is also what makes it safe to use inside your render method because it is guaranted to return false at next render.

useKeyState monitors key presses and when a rule matches, your component re-renders. To respond, in your render methods you simply check the key state property:

```javascript
if (asd.down) {
  dispatch({type:'do-the-down-thing'})
} else if (asd.up) {
  dispatch({type:'do-the-up-thing'})
}
```

The pressed property is appropriate to use if you have your own render loop or inside other event handlers such as a drag handler:

```javascript
handleDrag = (e) => {
  if(asd.pressed) {
    doThePressedThing(e)
  }
}``
```

### Capture events

By default useKeyState doesn't capture events. To do so, simply pass a configuration object as the second parameter:

```javascript
const { asd } = useKeyState({ asd: 'a+s+d' }, { preventDefault: true })
```

That's it!

**Not feature complete! See below:**

Goals
--------

- simple key bindings w/o callbacks (immediate mode key events)

- have ability to query the state of the keyboard (`{ query } = useKeyState()`)

- capture events (pass `{ preventDefault: true }` as a configuration parameter)

- basic configuration (`{ keyRepeat: true }` by default)

- singleton document event handler shared between all the keyState hooks

- support multiple rules per key (`{ copy: ['meta+c', 'ctrl+c'] }`)

- `TODO` be able to bind to a particular subtree (return bind methods)

- `TODO` filter events that originate from input accepting elements

- enable a different way to program with key events

Non-Goals
--------

- to fit every possible need

- legacy browsers support

- key sequences, although that could be a specific form of the keyState hook at some point


Think carefully about what you need, it might be smarter to write your own hook abstraction over something else.

Notes
-----------

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
