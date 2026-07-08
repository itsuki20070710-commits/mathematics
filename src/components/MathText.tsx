import { useMemo } from 'react'
import katex from 'katex'

// テキスト中の $$...$$（ディスプレイ）と $...$（インライン）を KaTeX で描画する。
// 数式以外はプレーンテキストとして扱い、改行を保持する。

// $$...$$ を先に、次に $...$ を拾う。数式部は最短一致。
const MATH_RE = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
}

function renderMath(value: string, displayMode: boolean): string {
  return katex.renderToString(value, {
    displayMode,
    throwOnError: false,
    output: 'html',
  })
}

function toHtml(input: string): string {
  let html = ''
  let lastIndex = 0
  for (const m of input.matchAll(MATH_RE)) {
    const idx = m.index ?? 0
    if (idx > lastIndex) html += escapeText(input.slice(lastIndex, idx))
    if (m[1] !== undefined) {
      html += renderMath(m[1], true) // $$...$$
    } else if (m[2] !== undefined) {
      html += renderMath(m[2], false) // $...$
    }
    lastIndex = idx + m[0].length
  }
  if (lastIndex < input.length) html += escapeText(input.slice(lastIndex))
  return html
}

interface MathTextProps {
  children: string
  className?: string
}

export default function MathText({ children, className }: MathTextProps) {
  const html = useMemo(() => toHtml(children ?? ''), [children])

  return (
    <span
      className={className}
      // KaTeX 出力とエスケープ済みテキストのみ。ユーザー入力の生 HTML は流し込まない。
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
