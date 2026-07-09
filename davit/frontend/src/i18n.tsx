import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { fr, en } from './translations'

export type Language = 'fr' | 'en'

type TranslationTree = { [key: string]: string | TranslationTree }

const TRANSLATIONS: Record<Language, TranslationTree> = { fr, en }

const STORAGE_KEY = 'davit-language'

function readStoredLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'fr' || stored === 'en' ? stored : 'fr'
}

function getPath(tree: TranslationTree, path: string): string | undefined {
  const parts = path.split('.')
  let node: string | TranslationTree = tree
  for (const part of parts) {
    if (typeof node !== 'object' || node === null || !(part in node)) return undefined
    node = node[part]
  }
  return typeof node === 'string' ? node : undefined
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
}

interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  const setLanguage = useCallback((next: Language) => {
    localStorage.setItem(STORAGE_KEY, next)
    setLanguageState(next)
  }, [])

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    const value = getPath(TRANSLATIONS[language], key) ?? getPath(TRANSLATIONS.fr, key) ?? key
    return interpolate(value, vars)
  }, [language])

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within a LanguageProvider')
  return ctx
}
