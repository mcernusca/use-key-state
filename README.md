# use-immediate-key

Immediate mode pressed key status hook. It keeps track of what keys are down and you can query it at any time. It currently binds to window.

A bad idea?

```js
const key = useKey()

// later in your drag handler for instance

const handleDrag = (e) => {
  if (key.space()) {
    // pan canvas
  }
}
```

Demo: https://codesandbox.io/s/n4o5z6yk3l
