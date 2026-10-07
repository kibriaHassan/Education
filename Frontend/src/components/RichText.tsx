import katex from 'katex'
import type { ReactNode } from 'react'

const pattern = /\$([^$]+)\$/g

export function MathText({ text }: { text: string }) {
  const nodes: ReactNode[] = []
  let last = 0
  let key = 0

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > last) nodes.push(text.slice(last, index))
    const source = match[1] ?? ''
    const html = katex.renderToString(source, { throwOnError: false })
    nodes.push(<span key={key} dangerouslySetInnerHTML={{ __html: html }} />)
    key += 1
    last = index + match[0].length
  }

  if (last < text.length) nodes.push(text.slice(last))
  return <>{nodes}</>
}

export function RichText({ text }: { text: string }) {
  const lines = text.split('\n')
  if (lines.length === 1) return <MathText text={text} />
  return (
    <div className="rich">
      {lines.map((line, index) => (
        <p key={index}>{line ? <MathText text={line} /> : '\u00a0'}</p>
      ))}
    </div>
  )
}
