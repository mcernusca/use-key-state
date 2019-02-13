# use-keys (WIP)

Immediate mode hotkey hook

```js
const {selectAll, space} = useKeys({ selectAll: "meta+a", space: "space" })

// later in your render method

if (selectAll.down) {
  dispatch({ type: 'select-all' })
}

// or in a drag handler

const handleDrag = (e) => {
  if (space.pressed) {
    // pan canvas while the space bar is pressed
  }
}
```

See source for more details.

Demo: https://codesandbox.io/s/n4o5z6yk3l
