import React, { Component } from 'react'
import Differ from 'react-differ'

class App extends Component {
  componentDidMount() {
    for (let node of document.querySelectorAll('span')) {
      const namePattern = /\bnighca\b/
      if (node.children.length === 0 && namePattern.test(node.innerText)) {
        node.innerHTML = node.innerHTML.replace(namePattern, '<a target="_blank" href="https://nighca.me">nighca</a>')
      }
      const differPattern = /\breact\-differ\b/
      if (node.children.length === 0 && differPattern.test(node.innerText)) {
        node.innerHTML = node.innerHTML.replace(differPattern, '<a target="_blank" href="https://github.com/nighca/differ">react-differ</a>')
      }
    }
  }
  render() {
    return (
      <Differ from={from} to={to} />
    )
  }
}

export default App;

const from = `/*
 * @file react-differ
 * @author nighca <nighca@live.cn>
 */

import React from 'react'
import { compare } from 'universal-diff'

export default function Differ(props) {
  const { from, to } = props
  const [ fromLines, toLines ] = [ from, to ].map(str => str.split('\n'))

  const lines = getUnifiedDiffList(
    fromLines,
    toLines,
    (_, linesToRemove, linesToInsert) => {
      if (linesToRemove.length !== linesToInsert.length) return
      linesToRemove.forEach((fromLine, index) => {
        const toLine = linesToInsert[index]
        const [ fromParts, toParts ] = [ fromLine, toLine ].map(line => line.content.split(/\b/))
        const [ fromPartsForDisplay, toPartsForDisplay ] = getSplitDiffLists(fromParts, toParts)

        fromLine.parts = fromPartsForDisplay
        toLine.parts = toPartsForDisplay
      })
    }
  )

  const lineComponents = lines.map(createLine)

  return (
    <div>
      <table style={{ width: '100%', borderSpacing: 0 }}>
        <tbody>
          {lineComponents}
        </tbody>
      </table>
    </div>
  )
}

function createLine(line, index) {
  const LineComponentMap = {
    keep: KeepLine,
    remove: RemoveLine,
    insert: InsertLine,
  }
  const LineComponent = LineComponentMap[line.type]
  return (
    <LineComponent key={index} {...line} />
  )
}

function Line(props) {
  const style = Object.assign({
    color: '#333',
    fontSize: '12px',
    lineHeight: '22px'
  }, props.style)
  return (
    <tr style={style}>{props.children}</tr>
  )
}

function KeepLine(props) {
  return (
    <Line style={{ backgroundColor: '#fff' }}>
      <LineIndex>{props.fromIndex + 1}</LineIndex>
      <LineIndex>{props.toIndex + 1}</LineIndex>
      <LineBody>&nbsp;<LineContent {...props} /></LineBody>
    </Line>
  )
}

function RemoveLine(props) {
  return (
    <Line style={{ backgroundColor: '#ffecec' }}>
      <RemoveLineIndex>{props.fromIndex + 1}</RemoveLineIndex>
      <RemoveLineIndex></RemoveLineIndex>
      <LineBody>-<LineContent {...props} /></LineBody>
    </Line>
  )
}

function InsertLine(props) {
  return (
    <Line style={{ backgroundColor: '#eaffea' }}>
      <InsertLineIndex></InsertLineIndex>
      <InsertLineIndex>{props.toIndex + 1}</InsertLineIndex>
      <LineBody>+<LineContent {...props} /></LineBody>
    </Line>
  )
}

function createPart(part, index) {
  const PartComponentMap = {
    keep: KeepPart,
    remove: RemovePart,
    insert: InsertPart
  }
  const PartComponent = PartComponentMap[part.type]
  return (
    <PartComponent key={index} {...part} />
  )
}

function KeepPart(props) {
  return (<span>{props.content}</span>)
}

function RemovePart(props) {
  return (<span style={{ backgroundColor: '#f8cbcb' }}>{props.content}</span>)
}

function InsertPart(props) {
  return (<span style={{ backgroundColor: '#a6f3a6' }}>{props.content}</span>)
}

function LineIndex(props) {
  const style = Object.assign({
    width: '4em',
    padding: '0 10px',
    color: 'rgba(27,31,35,.3)',
    borderRight: 'rgba(255,255,255,.1)',
    userSelect: 'none',
  }, props.style)
  return (
    <td style={style}>
      <Code>{props.children}</Code>
    </td>
  )
}

const RemoveLineIndex = addStyle({ backgroundColor: '#ffdddd' })(LineIndex)
const InsertLineIndex = addStyle({ backgroundColor: '#dbffdb' })(LineIndex)

function LineBody(props) {
  return (
    <td style={{ paddingLeft: '10px' }}>
      <Code>{props.children}</Code>
    </td>
  )
}

function LineContent(props) {
  return (<span>{props.parts ? props.parts.map(createPart) : props.content}</span>)
}

function Code(props) {
  const styleForCode = {
    whiteSpace: 'pre',
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace'
  }
  return (
    <span style={styleForCode}>{props.children}</span>
  )
}

function markItemWithIndex(type, fromIndex, toIndex) {
  return (content, index) => ({
    type,
    content,
    fromIndex: fromIndex + index,
    toIndex: toIndex + index,
  })
}

function markItem(type) {
  return content => ({
    type,
    content
  })
}

// add style for component
function addStyle(style) {
  return Component => props => {
    props = Object.assign({}, props, { style })
    return (
      <Component {...props} />
    )
  }
}

function getUnifiedDiffList(fromList, toList, handler) {
  const diffs = compare(fromList, toList)

  let unitedItems = []

  for (
    let prevFromEnd = 0, prevToEnd = 0, diffIndex = 0;
    diffIndex < diffs.length;
    diffIndex++
  ) {
    const [ start, len, to = [] ] = diffs[diffIndex]
    const end = start + len

    const itemsToKeep = fromList.slice(prevFromEnd, start).map(markItemWithIndex('keep', prevFromEnd, prevToEnd))
    const itemsToRemove = fromList.slice(start, end).map(markItemWithIndex('remove', start, prevToEnd))
    const itemsToInsert = to.map(markItemWithIndex('insert', start, prevToEnd + itemsToKeep.length))

    handler && handler(itemsToKeep, itemsToRemove, itemsToInsert)

    unitedItems = unitedItems.concat(itemsToKeep, itemsToRemove, itemsToInsert)

    if (diffIndex === diffs.length - 1) {
      unitedItems = unitedItems.concat(fromList.slice(end).map(
        markItemWithIndex('keep', end, prevToEnd + itemsToKeep.length + itemsToInsert.length)
      ))
    } else {
      prevFromEnd = end
      prevToEnd = prevToEnd + itemsToKeep.length + itemsToInsert.length
    }
  }

  return unitedItems
}

function getSplitDiffLists(fromList, toList, handler) {
  const diffs = compare(fromList, toList)

  let fromItems = []
  let toItems = []

  for (
    let prevFromEnd = 0, prevToEnd = 0, diffIndex = 0;
    diffIndex < diffs.length;
    diffIndex++
  ) {
    const [ start, len, to = [] ] = diffs[diffIndex]
    const end = start + len

    const itemsToKeep = fromList.slice(prevFromEnd, start).map(markItem('keep'))
    const itemsToRemove = fromList.slice(start, end).map(markItem('remove'))
    const itemsToInsert = to.map(markItem('insert'))

    handler && handler(itemsToKeep, itemsToRemove, itemsToInsert)

    fromItems = fromItems.concat(itemsToKeep, itemsToRemove)
    toItems = toItems.concat(itemsToKeep, itemsToInsert)

    if (diffIndex === diffs.length - 1) {
      fromItems = fromItems.concat(fromList.slice(end).map(markItem('keep')))
      toItems = toItems.concat(toList.slice(prevToEnd + itemsToKeep.length + itemsToInsert.length).map(markItem('keep')))
    } else {
      prevFromEnd = end
      prevToEnd = prevToEnd + itemsToKeep.length + itemsToInsert.length
    }
  }

  return [ fromItems, toItems ]
}
`

const to = `/*
 * @file react-differ
 * @author nighca <nighca@live.cn>
 */

import React from 'react'
import { compare } from 'universal-diff'

export default function Differ(props) {
  const { from, to } = props
  const [ fromLines, toLines ] = [ from, to ].map(str => str.split('\n'))

  const [ ,, unitedLines] = getDiffLists(
    fromLines,
    toLines,
    (_, linesToRemove, linesToInsert) => {
      if (linesToRemove.length !== linesToInsert.length) return
      linesToRemove.forEach((fromLine, index) => {
        const toLine = linesToInsert[index]
        const [ fromParts, toParts ] = [ fromLine, toLine ].map(line => line.content.split(/\b/))
        const [ fromPartsForDisplay, toPartsForDisplay ] = getDiffLists(fromParts, toParts)

        fromLine.parts = fromPartsForDisplay
        toLine.parts = toPartsForDisplay
      })
    }
  )

  return (
    <div>
      <table style={{ width: '100%', borderSpacing: 0 }}>
        <tbody>
          {unitedLines.map(createLine)}
        </tbody>
      </table>
    </div>
  )
}

function createLine(line, index) {
  const LineComponentMap = {
    keep: KeepLine,
    remove: RemoveLine,
    insert: InsertLine,
  }
  const LineComponent = LineComponentMap[line.type]
  return (
    <LineComponent key={index} {...line} />
  )
}

function Line(props) {
  const style = Object.assign({
    color: '#333',
    fontSize: '12px',
    lineHeight: '22px'
  }, props.style)
  return (
    <tr style={style}>{props.children}</tr>
  )
}

function KeepLine(props) {
  return (
    <Line style={{ backgroundColor: '#fff' }}>
      <LineIndex>{props.fromIndex + 1}</LineIndex>
      <LineIndex>{props.toIndex + 1}</LineIndex>
      <LineBody>&nbsp;<LineContent {...props} /></LineBody>
    </Line>
  )
}

function RemoveLine(props) {
  return (
    <Line style={{ backgroundColor: '#ffecec' }}>
      <RemoveLineIndex>{props.fromIndex + 1}</RemoveLineIndex>
      <RemoveLineIndex></RemoveLineIndex>
      <LineBody>-<LineContent {...props} /></LineBody>
    </Line>
  )
}

function InsertLine(props) {
  return (
    <Line style={{ backgroundColor: '#eaffea' }}>
      <InsertLineIndex></InsertLineIndex>
      <InsertLineIndex>{props.toIndex + 1}</InsertLineIndex>
      <LineBody>+<LineContent {...props} /></LineBody>
    </Line>
  )
}

function createPart(part, index) {
  const PartComponentMap = {
    keep: KeepPart,
    remove: RemovePart,
    insert: InsertPart
  }
  const PartComponent = PartComponentMap[part.type]
  return (
    <PartComponent key={index} {...part} />
  )
}

function Part(props) {
  const style = {}
  if (props.first) {
    Object.assign(style, {
      borderTopLeftRadius: '2px',
      borderBottomLeftRadius: '2px',
    })
  }
  if (props.last) {
    Object.assign(style, {
      borderTopRightRadius: '2px',
      borderBottomRightRadius: '2px',
    })
  }
  Object.assign(style, props.style)
  return (<span style={style}>{props.content}</span>)
}

const KeepPart = addStyle({})(Part)
const RemovePart = addStyle({ backgroundColor: '#f8cbcb' })(Part)
const InsertPart = addStyle({ backgroundColor: '#a6f3a6' })(Part)

function LineIndex(props) {
  const style = Object.assign({
    width: '4em',
    padding: '0 10px',
    color: 'rgba(27,31,35,.3)',
    borderRight: 'rgba(255,255,255,.1)',
    textAlign: 'right',
    userSelect: 'none',
  }, props.style)
  return (
    <td style={style}>
      <Code>{props.children}</Code>
    </td>
  )
}

const RemoveLineIndex = addStyle({ backgroundColor: '#ffdddd' })(LineIndex)

const InsertLineIndex = addStyle({ backgroundColor: '#dbffdb' })(LineIndex)

function LineBody(props) {
  return (
    <td style={{ paddingLeft: '10px' }}>
      <Code>{props.children}</Code>
    </td>
  )
}

function LineContent(props) {
  return (<span>{props.parts ? props.parts.map(createPart) : props.content}</span>)
}

function Code(props) {
  const styleForCode = {
    whiteSpace: 'pre',
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace'
  }
  return (
    <span style={styleForCode}>{props.children}</span>
  )
}

function markItem(type, fromIndex, toIndex) {
  return (content, index, list) => ({
    type,
    content,
    fromIndex: fromIndex + index,
    toIndex: toIndex + index,
    first: index === 0,
    last: index === list.length - 1
  })
}

// add style for component
function addStyle(style) {
  return Component => props => {
    props = Object.assign({}, props, { style })
    return (
      <Component {...props} />
    )
  }
}

function getDiffLists(fromList, toList, handler) {
  const diffs = compare(fromList, toList)

  let fromItems = []
  let toItems = []
  let unitedItems = []

  for (
    let prevFromEnd = 0, prevToEnd = 0, diffIndex = 0;
    diffIndex < diffs.length;
    diffIndex++
  ) {
    const [ start, len, to = [] ] = diffs[diffIndex]
    const end = start + len

    const itemsToKeep = fromList.slice(prevFromEnd, start).map(markItem('keep', prevFromEnd, prevToEnd))
    const itemsToRemove = fromList.slice(start, end).map(markItem('remove', start, prevToEnd))
    const itemsToInsert = to.map(markItem('insert', start, prevToEnd + itemsToKeep.length))

    handler && handler(itemsToKeep, itemsToRemove, itemsToInsert)

    fromItems = fromItems.concat(itemsToKeep, itemsToRemove)
    toItems = toItems.concat(itemsToKeep, itemsToInsert)
    unitedItems = unitedItems.concat(itemsToKeep, itemsToRemove, itemsToInsert)

    if (diffIndex === diffs.length - 1) {
      const lastItems = fromList.slice(end).map(
        markItem('keep', end, prevToEnd + itemsToKeep.length + itemsToInsert.length)
      )
      fromItems = fromItems.concat(lastItems)
      toItems = toItems.concat(lastItems)
      unitedItems = unitedItems.concat(lastItems)
    } else {
      prevFromEnd = end
      prevToEnd = prevToEnd + itemsToKeep.length + itemsToInsert.length
    }
  }

  return [ fromItems, toItems, unitedItems ]
}
`
