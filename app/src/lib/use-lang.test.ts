import { describe, it, expect, afterEach } from 'vitest'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { LangProvider } from './lang-context'
import { useLang } from './use-lang'
import { useLangStore } from './lang-store'
import { t } from './translations'

function Probe() {
  const { lang, tr } = useLang()
  return createElement('span', { 'data-lang': lang }, tr.fruits)
}

function serverHtml(initialLang?: 'en' | 'ar') {
  const probe = createElement(Probe)
  return renderToString(initialLang ? createElement(LangProvider, { initialLang }, probe) : probe)
}

afterEach(() => {
  useLangStore.setState({ lang: 'en' })
})

describe('useLang server render', () => {
  it('renders Arabic labels when the cookie language is ar', () => {
    const html = serverHtml('ar')
    expect(html).toContain(t.ar.fruits)
    expect(html).not.toContain(t.en.fruits)
    expect(html).toContain('data-lang="ar"')
  })

  it('renders English labels when the cookie language is en', () => {
    const html = serverHtml('en')
    expect(html).toContain(t.en.fruits)
    expect(html).not.toContain(t.ar.fruits)
  })

  it('uses the cookie language, not the store, before mount', () => {
    useLangStore.setState({ lang: 'ar' })
    const html = serverHtml('en')
    expect(html).toContain('data-lang="en"')
  })

  it('falls back to the store without a provider', () => {
    const html = serverHtml()
    expect(html).toContain(t.en.fruits)
  })
})
