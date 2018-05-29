react-differ
======

A react component for code diff.

### Sample

[Demo](http://differ.nighca.me/)

[Sample Code](https://github.com/nighca/differ/blob/master/sample/src/App.js)

### Usage

```shell
npm i react-differ --save

# Or

yarn add react-differ
```

```javascript
import React, { Component } from 'react'
import Differ from 'react-differ'

const from = `import React, { Component } from 'react'
import Differ from 'react-differ'`

const to = `import React from 'react'
import Differ from 'react-differ'`

class App extends Component {
  render() {
    return (
      <Differ from={from} to={to} />
    )
  }
}
```
