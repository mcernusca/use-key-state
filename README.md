usefulKeys (hook)
========================

Keyboard events as values

Introduction
------------

Read this first: https://useful-keys.mihaicernusca.com

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
const { asd } = usefulKeys({ asd: 'a+s+d' })
```

The values are state objects with three boolean properties: `pressed`, `down` and `up`. Your component will re-render only when a rule starts or stops matching.

Use `pressed` if you want to know if the keys are currently down. This is always true while the rule associated to it matches.

Use `down` or `up` if you want to know when the `keydown` and `keyup` events that caused the rule to match triggered. These values will be false after you read the value so be sure to capture it if you need it in multiple places!

This is the equivalent of an event callback - *you read it, consider yourself notified.*

This behavior is also what makes it safe to use inside your render method because it is guaranted to return false at next render.

usefulKeys monitors key presses and when a rule matches, your component re-renders. To respond, in your render methods you simply check the key state property:

```javascript
if (asd.down) {
  dispatch({type:'do-the-down-thing'})
} else if (asd.up) {
  displatch({type:'do-the-up-thing'})
}
```

The pressed property is appropriate to use if you have your own render loop or inside other event handlers such as a drag handler:

```javascript
onDrag = (e) => {
  if(asd.pressed) {
    doThePressedThing(e)
  }
}
```

### Capture events

By default usefulKeys doesn't capture events. To do so, simply append `,capture` at the end of your rule:

```javascript
const { asd } = usefulKeys({ asd: 'a+s+d,capture' })
```

That's it!

**Not feature complete! See below:**

Goals
--------

- simple key bindings w/o callbacks (immediate mode key events)

- have ability to query the state of the keyboard (bypass react state)

- capture events (pass `,capture` at the end of the rule)

- basic configuration (`{ keyRepeat: true }` by default)

- `TODO` support multiple rules per key (`{ copy: 'meta+c,ctrl+c' }`)

- `TODO` be able to bind to a particular subtree (return bind methods)

- `TODO` filter events that originate from interactive elements (inputs)

- `TODO` investigate the performance costs of having each hook bind globally

Non-Goals
--------

- to necessarily be a better mousetrap, hotkeys.js or react-hotkeys - rather enable a different way to program with key events. Think carefully about what you need, it might be smarter to write your own hook abstraction over something else.

Notes
-----------

If you're still confused, this is essentially hook sugar over a callback API like: 

```javascript
usefulKeys.on("a+s+d", (down) => {
  this.setState({ "asdPressed": down }, () => {
    if (down) {
      // do the down thing
    } else {
     // do the up thing
    }
  })
})
```
