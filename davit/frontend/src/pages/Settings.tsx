import { useState } from 'react'
import {
  Check, Sun, Moon, Monitor, FileText, ExternalLink, RotateCw,
  AlertTriangle, Plus, Trash2, Pencil, PlugZap, Loader2, X,
} from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import { useTheme, type Theme } from '../theme'
import { useTranslation, type Language } from '../i18n'

interface ProxyConfig {
  httpProxy: string
  httpsProxy: string
  noProxy: string
}

interface DockerContext {
  name: string
  description: string
  socketUrl: string
  active: boolean
  proxy: ProxyConfig
}

const MOCK_CONTEXTS: DockerContext[] = [
  {
    name: 'default',
    description: 'Connexion locale WSL2',
    socketUrl: 'unix:///var/run/docker.sock',
    active: true,
    proxy: { httpProxy: '', httpsProxy: '', noProxy: '' },
  },
  {
    name: 'remote-vps',
    description: 'Serveur de production',
    socketUrl: 'tcp://192.168.1.100:2375',
    active: false,
    proxy: { httpProxy: 'http://proxy.company.com:3128', httpsProxy: 'http://proxy.company.com:3128', noProxy: 'localhost,127.0.0.1' },
  },
]

const WSL_CONFIG_PATH = 'C:\\Users\\user\\.wslconfig'
const DOCKER_CONFIG_PATH = 'C:\\Users\\user\\.docker\\config.json'

const LANGUAGE_OPTIONS: { value: Language; flag: string; labelKey: string }[] = [
  { value: 'fr', flag: '🇫🇷', labelKey: 'settings.languageFr' },
  { value: 'en', flag: '🇬🇧', labelKey: 'settings.languageEn' },
]

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; labelKey: string }[] = [
  { value: 'light',  icon: Sun,     labelKey: 'settings.themeLight' },
  { value: 'dark',   icon: Moon,    labelKey: 'settings.themeDark' },
  { value: 'system', icon: Monitor, labelKey: 'settings.themeSystem' },
]

function SliderField({
  label, subtext, min, max, step, value, unit, onChange,
}: {
  label: string
  subtext: string
  min: number
  max: number
  step: number
  value: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtext}</p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs font-semibold border border-blue-100 dark:border-blue-800/60 shrink-0 tabular-nums">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
    </div>
  )
}

function ConfigFileRow({ label, path, onOpen }: { label: string; path: string; onOpen: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
      <FileText size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">{label}</span>
      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate flex-1 min-w-0">{path}</span>
      <button
        onClick={onOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors shrink-0"
      >
        <ExternalLink size={12} />
        {t('settings.openInEditor')}
      </button>
    </div>
  )
}

export default function Settings() {
  const { language, setLanguage, t } = useTranslation()
  const { theme, setTheme } = useTheme()

  const [memory, setMemory] = useState(8)
  const [processors, setProcessors] = useState(4)
  const [swap, setSwap] = useState(2)
  const detectedCores = navigator.hardwareConcurrency || 8

  const [contexts, setContexts] = useState<DockerContext[]>(MOCK_CONTEXTS)
  const activeContext = contexts.find(c => c.active)
  const isLocalContext = activeContext?.name === 'default'

  const [testingContext, setTestingContext] = useState<string | null>(null)
  const [testedContext, setTestedContext] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DockerContext | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingOriginalName, setEditingOriginalName] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formSocketUrl, setFormSocketUrl] = useState('unix:///var/run/docker.sock')
  const [formHttpProxy, setFormHttpProxy] = useState('')
  const [formHttpsProxy, setFormHttpsProxy] = useState('')
  const [formNoProxy, setFormNoProxy] = useState('')
  const [testingModal, setTestingModal] = useState(false)
  const [modalTestOk, setModalTestOk] = useState(false)

  function openAddModal() {
    setEditingOriginalName(null)
    setFormName('')
    setFormDescription('')
    setFormSocketUrl('unix:///var/run/docker.sock')
    setFormHttpProxy('')
    setFormHttpsProxy('')
    setFormNoProxy('')
    setModalTestOk(false)
    setModalOpen(true)
  }

  function openEditModal(ctx: DockerContext) {
    setEditingOriginalName(ctx.name)
    setFormName(ctx.name)
    setFormDescription(ctx.description)
    setFormSocketUrl(ctx.socketUrl)
    setFormHttpProxy(ctx.proxy.httpProxy)
    setFormHttpsProxy(ctx.proxy.httpsProxy)
    setFormNoProxy(ctx.proxy.noProxy)
    setModalTestOk(false)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setTestingModal(false)
  }

  function handleTestModal() {
    setTestingModal(true)
    setModalTestOk(false)
    setTimeout(() => {
      setTestingModal(false)
      setModalTestOk(true)
    }, 900)
  }

  function handleSaveContext() {
    const updated: DockerContext = {
      name: formName.trim(),
      description: formDescription.trim(),
      socketUrl: formSocketUrl.trim(),
      active: editingOriginalName ? (contexts.find(c => c.name === editingOriginalName)?.active ?? false) : false,
      proxy: { httpProxy: formHttpProxy.trim(), httpsProxy: formHttpsProxy.trim(), noProxy: formNoProxy.trim() },
    }
    if (editingOriginalName) {
      setContexts(prev => prev.map(c => (c.name === editingOriginalName ? updated : c)))
    } else {
      setContexts(prev => [...prev, updated])
    }
    setModalOpen(false)
  }

  function handleTestContext(name: string) {
    setTestingContext(name)
    setTestedContext(null)
    setTimeout(() => {
      setTestingContext(null)
      setTestedContext(name)
      setTimeout(() => setTestedContext(null), 1500)
    }, 900)
  }

  function handleDeleteContext() {
    if (!deleteTarget) return
    setContexts(prev => prev.filter(c => c.name !== deleteTarget.name))
    setDeleteTarget(null)
  }

  const isFormValid = formName.trim() !== '' && formSocketUrl.trim() !== ''

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('settings.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-base">{t('settings.subtitle')}</p>
      </div>

      {/* Section 1 — Préférences Davit */}
      <div className="grid grid-cols-2 gap-4">
        {/* Langue */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('settings.languageCard')}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('settings.languageSubtitle')}</p>
          </div>
          <div className="space-y-2">
            {LANGUAGE_OPTIONS.map(opt => {
              const selected = language === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setLanguage(opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                    selected ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                  }`}
                >
                  <span className="flex items-center gap-2.5 text-sm font-medium text-gray-800 dark:text-gray-200">
                    <span className="text-lg leading-none">{opt.flag}</span>
                    {t(opt.labelKey)}
                  </span>
                  {selected && <Check size={16} className="text-blue-600 dark:text-blue-400" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Thème */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('settings.themeCard')}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('settings.themeSubtitle')}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(opt => {
              const selected = theme === opt.value
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`relative flex flex-col items-center gap-1.5 py-3 rounded-lg border transition-colors ${
                    selected ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                  }`}
                >
                  {selected && <Check size={12} className="absolute top-1.5 right-1.5 text-blue-600 dark:text-blue-400" />}
                  <Icon size={18} className={selected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t(opt.labelKey)}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Section 2 — WSL2 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('settings.wslTitle')}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('settings.wslSubtitle')}</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium border border-gray-200 dark:border-gray-700">
            {t('settings.localOnly')}
          </span>
        </div>

        {!isLocalContext && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-800/50 text-xs text-orange-700 dark:text-orange-400">
            <AlertTriangle size={14} className="shrink-0" />
            {t('settings.wslUnavailable')}
          </div>
        )}

        <div className={`space-y-5 ${!isLocalContext ? 'opacity-50 pointer-events-none' : ''}`}>
          <SliderField
            label={t('settings.memoryLabel')}
            subtext={t('settings.memoryHint')}
            min={1}
            max={32}
            step={1}
            value={memory}
            unit="GB"
            onChange={setMemory}
          />
          <SliderField
            label={t('settings.processorsLabel')}
            subtext={t('settings.processorsHint')}
            min={1}
            max={detectedCores}
            step={1}
            value={processors}
            unit={t('settings.processorsUnit')}
            onChange={setProcessors}
          />
          <SliderField
            label={t('settings.swapLabel')}
            subtext={t('settings.swapHint')}
            min={0}
            max={16}
            step={1}
            value={swap}
            unit="GB"
            onChange={setSwap}
          />

          <ConfigFileRow label="~/.wslconfig" path={WSL_CONFIG_PATH} onOpen={() => {}} />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button className="px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {t('settings.applyChanges')}
              </button>
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                  <RotateCw size={14} />
                  {t('settings.restartWsl')}
                </button>
                <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-20 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                    {t('settings.restartWslTooltip')}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/50 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle size={14} className="shrink-0" />
              {t('settings.restartWarning')}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 — Contextes Docker */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('settings.contextsTitle')}</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('settings.contextsSubtitle')}</p>
        </div>

        <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-700/40 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
          {contexts.map(ctx => (
            <div key={ctx.name} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {ctx.active && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ctx.name}</span>
                  {ctx.active && <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('settings.active')}</span>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ctx.description}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="hidden md:inline text-xs text-gray-400 dark:text-gray-500 font-mono truncate max-w-[220px]">{ctx.socketUrl}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTestContext(ctx.name)}
                    disabled={testingContext === ctx.name}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {testingContext === ctx.name ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : testedContext === ctx.name ? (
                      <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <PlugZap size={12} />
                    )}
                    {t('settings.test')}
                  </button>
                  <button
                    onClick={() => openEditModal(ctx)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Pencil size={12} />
                    {t('settings.edit')}
                  </button>
                  {ctx.name !== 'default' && (
                    <button
                      onClick={() => setDeleteTarget(ctx)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <Trash2 size={12} />
                      {t('common.delete')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={14} />
            {t('settings.addContext')}
          </button>
        </div>

        <ConfigFileRow label="~/.docker/config.json" path={DOCKER_CONFIG_PATH} onOpen={() => {}} />
      </div>

      {/* Delete context confirmation */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteContext}
        title={t('settings.deleteConfirmTitle')}
        description={deleteTarget ? (
          <>
            {t('settings.deleteConfirmDescBefore')}{' '}
            <span className="font-semibold text-gray-800 dark:text-gray-200">{deleteTarget.name}</span>{' '}
            {t('settings.deleteConfirmDescAfter')}
          </>
        ) : null}
        confirmLabel={t('common.delete')}
        danger
      />

      {/* Add / edit context modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {editingOriginalName ? t('settings.editContextTitle') : t('settings.addContextTitle')}
              </h2>
              <button onClick={closeModal} className="p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('settings.contextNameLabel')} <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder={t('settings.contextNamePlaceholder')}
                  autoFocus
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('settings.descriptionLabel')} <span className="text-gray-400 dark:text-gray-500">{t('common.optional')}</span>
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder={t('settings.descriptionPlaceholder')}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('settings.socketUrlLabel')} <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formSocketUrl}
                  onChange={e => setFormSocketUrl(e.target.value)}
                  placeholder="unix:///var/run/docker.sock"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('settings.socketUrlExamples')}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('settings.proxySection')}</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('settings.httpProxyLabel')} <span className="text-gray-400 dark:text-gray-500">{t('common.optional')}</span>
                    </label>
                    <input
                      type="text"
                      value={formHttpProxy}
                      onChange={e => setFormHttpProxy(e.target.value)}
                      placeholder="http://proxy.company.com:3128"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('settings.httpsProxyLabel')} <span className="text-gray-400 dark:text-gray-500">{t('common.optional')}</span>
                    </label>
                    <input
                      type="text"
                      value={formHttpsProxy}
                      onChange={e => setFormHttpsProxy(e.target.value)}
                      placeholder="http://proxy.company.com:3128"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('settings.noProxyLabel')} <span className="text-gray-400 dark:text-gray-500">{t('common.optional')}</span>
                    </label>
                    <input
                      type="text"
                      value={formNoProxy}
                      onChange={e => setFormNoProxy(e.target.value)}
                      placeholder="localhost,127.0.0.1,192.168.1.0/24"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {t('settings.noProxyExample')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('settings.registriesSection')}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2.5">
                  {t('settings.registriesPlaceholder')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleTestModal}
                disabled={!formSocketUrl.trim() || testingModal}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {testingModal ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : modalTestOk ? (
                  <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <PlugZap size={13} />
                )}
                {t('settings.testConnection')}
              </button>
              <button
                disabled={!isFormValid}
                onClick={handleSaveContext}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('settings.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
