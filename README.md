# usefulKeys

Keyboard events as values for React. An alternative to callback based APIs.

```js
const {selectAll, space} = usefulKeys({ selectAll: "meta+a", space: "space" })

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

Demo: https://codesandbox.io/s/n4o5z6yk3l
