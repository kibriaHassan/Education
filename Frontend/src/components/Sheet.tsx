import type { Block, SheetPage } from '../lib/sheets'
import { bn } from '../lib/format'
import { RichText } from './RichText'

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.kind === 'lead') {
          return (
            <p key={index} className="sheet-lead">
              <RichText text={block.text} />
            </p>
          )
        }
        if (block.kind === 'h2') return <h2 key={index}>{block.text}</h2>
        if (block.kind === 'p') {
          return (
            <p key={index} className="sheet-p">
              <RichText text={block.text} />
            </p>
          )
        }
        if (block.kind === 'bullets') {
          return (
            <ul key={index}>
              {block.items.map((item) => (
                <li key={item}>
                  <RichText text={item} />
                </li>
              ))}
            </ul>
          )
        }
        if (block.kind === 'formulas') {
          return (
            <div key={index} className="formula-grid">
              {block.items.map((item) => (
                <div key={item.name} className="formula">
                  <span>{item.name}</span>
                  <strong>
                    <RichText text={item.expr} />
                  </strong>
                  {item.note ? (
                    <em>
                      <RichText text={item.note} />
                    </em>
                  ) : null}
                </div>
              ))}
            </div>
          )
        }
        if (block.kind === 'worked') {
          return (
            <section key={index} className="worked">
              <p className="worked-label">
                {bn(block.index)}. {block.title}
              </p>
              <div className="worked-q">
                <RichText text={block.prompt} />
              </div>
              <ol>
                {block.steps.map((step) => (
                  <li key={step}>
                    <RichText text={step} />
                  </li>
                ))}
              </ol>
              <p className="answer">
                উত্তর: <RichText text={block.answer} />
              </p>
            </section>
          )
        }
        if (block.kind === 'callout') {
          return (
            <aside key={index} className="callout">
              <strong>{block.title}</strong>
              <RichText text={block.text} />
            </aside>
          )
        }
        if (block.kind === 'meta') {
          return (
            <div key={index} className="meta-row">
              {block.items.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          )
        }
        if (block.kind === 'mcq') {
          return (
            <article key={index} className="paper-q">
              <p>
                <b>{bn(block.index)}.</b> <RichText text={block.question} />
              </p>
              <small>{block.chapter}</small>
              <div className="paper-options">
                {block.options.map((option, optionIndex) => (
                  <span key={option}>
                    {['ক', 'খ', 'গ', 'ঘ'][optionIndex]}. <RichText text={option} />
                  </span>
                ))}
              </div>
            </article>
          )
        }
        if (block.kind === 'cq') {
          return (
            <article key={index} className="paper-cq">
              <p className="worked-label">
                প্রশ্ন {bn(block.index)} · {block.chapter}
              </p>
              <div className="stimulus">
                <RichText text={block.stimulus} />
              </div>
              {block.parts.map((part) => (
                <div key={part.key} className="paper-part">
                  <p>
                    <b>{part.key}.</b> <RichText text={part.prompt} /> <em>({bn(part.marks)})</em>
                  </p>
                  {block.showSolution ? (
                    <div className="paper-solution">
                      <RichText text={part.solution} />
                    </div>
                  ) : null}
                </div>
              ))}
            </article>
          )
        }
        return (
          <div key={index} className="key-grid">
            {block.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        )
      })}
    </>
  )
}

export function Sheet({
  page,
  pageNo,
  total,
  flow = false,
}: {
  page: SheetPage
  pageNo: number
  total: number
  flow?: boolean
}) {
  return (
    <article className={flow ? 'sheet flow' : 'sheet'}>
      <header className="sheet-top">
        <span>অঙ্কশালা</span>
        <span>{page.running}</span>
      </header>
      <p className="sheet-kicker">{page.kicker}</p>
      <h2 className="sheet-title">{page.title}</h2>
      <div className="sheet-body">
        <Blocks blocks={page.blocks} />
      </div>
      <footer className="sheet-foot">
        <span>নবম–দশম · গণিত</span>
        <span>
          {bn(pageNo)} / {bn(total)}
        </span>
      </footer>
    </article>
  )
}
