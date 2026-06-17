import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useConfiguracionStore } from '@/stores/configuracionStore'
import { useEffectiveSiteConfiguration } from '@/hooks/useSiteConfiguration'
import { useUpdateSiteConfigurationMutation } from '@/hooks/useApiQueries'
import { hasPermission } from '@/auth/permissions'
import { uploadCloudinaryMediaApi } from '@/services/cloudinaryUploadService'
import { uploadSiteConfigurationMediaApi } from '@/services/siteConfigurationApiService'
import { createDefaultFooterConfig, createDefaultSuetConfig, createDefaultFlowConfig, createDefaultYogaConfig, createDefaultTerminosConfig } from '@/constants/siteConfigurationDefaults'
import PageContentEditor from '@/components/admin/site/PageContentEditor'
import FooterEditor from '@/components/admin/site/FooterEditor'
import TerminosEditor from '@/components/admin/site/TerminosEditor'

const SITE_TABS = [
  { id: 'suet', label: 'STRYDE X' },
  { id: 'flow', label: 'SLOW' },
  { id: 'yoga', label: 'YOGA' },
  { id: 'footer', label: 'Footer' },
  { id: 'terminos', label: 'Términos y condiciones' },
]

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value ?? {}))
}

function compressImage(file, maxWidth = 1920, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (event) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  })
}

function normalizeLegacyUploadResult(file, dataUrl) {
  const isVideo = String(file?.type ?? '').startsWith('video/')
  return {
    type: isVideo ? 'video' : 'image',
    url: dataUrl,
    secureUrl: dataUrl,
    resourceType: isVideo ? 'video' : 'image',
    alt: '',
  }
}

export default function SiteConfigurationSection({ currentUser = null }) {
  const store = useConfiguracionStore()
  const site = useEffectiveSiteConfiguration()
  const updateMutation = useUpdateSiteConfigurationMutation()
  const [activeTab, setActiveTab] = useState('suet')
  const [draft, setDraft] = useState(() => clone(site.config ?? {
    pages: {
      suet: createDefaultSuetConfig(),
      flow: createDefaultFlowConfig(),
      yoga: createDefaultYogaConfig(),
    },
    footer: createDefaultFooterConfig(),
  }))
  const [dirtyTabs, setDirtyTabs] = useState([])
  const canEdit = !currentUser || hasPermission(currentUser, 'settings.update')

  useEffect(() => {
    if (dirtyTabs.length > 0) return
    setDraft(clone(site.config))
  }, [site.config, dirtyTabs.length])

  const markDirty = useCallback((tabId) => {
    setDirtyTabs((prev) => (prev.includes(tabId) ? prev : [...prev, tabId]))
  }, [])

  const clearDirty = useCallback((tabId) => {
    setDirtyTabs((prev) => prev.filter((id) => id !== tabId))
  }, [])

  const updatePage = useCallback((pageKey, nextPage) => {
    setDraft((prev) => ({
      ...(prev ?? {}),
      pages: {
        ...(prev?.pages ?? {}),
        [pageKey]: nextPage,
      },
    }))
    markDirty(pageKey)
  }, [markDirty])

  const updateFooter = useCallback((nextFooter) => {
    setDraft((prev) => ({
      ...(prev ?? {}),
      footer: nextFooter,
    }))
    markDirty('footer')
  }, [markDirty])

  const uploadMedia = useCallback(async ({ file, field, resourceType = 'image', folder = 'site', context = 'site_configuration', publicIdPrefix = 'site', alt = '' }) => {
    if (!file) return null
    if (site.apiMode) {
      try {
        return await uploadCloudinaryMediaApi({ file, folder, resourceType, context, publicIdPrefix, alt })
      } catch (error) {
        try {
          return await uploadSiteConfigurationMediaApi({ field, file })
        } catch (fallbackError) {
          if (String(file.type ?? '').startsWith('video/')) {
            const legacyError = new Error('El video local aún no está soportado.')
            legacyError.code = 'SITE_VIDEO_UPLOAD_NOT_SUPPORTED'
            throw legacyError
          }
          throw fallbackError
        }
      }
    }

    if (String(file.type ?? '').startsWith('video/')) {
      const blobUrl = URL.createObjectURL(file)
      return normalizeLegacyUploadResult(file, blobUrl)
    }

    const dataUrl = await compressImage(file)
    return normalizeLegacyUploadResult(file, dataUrl)
  }, [site.apiMode])

  const handleSave = useCallback(async (tabId) => {
    const payload = tabId === 'footer'
      ? { footer: draft.footer }
      : { pages: { [tabId]: draft.pages?.[tabId] } }

    try {
      if (site.apiMode) {
        await updateMutation.mutateAsync(payload)
      } else {
        store.actualizar(payload)
      }
      toast.success(tabId === 'footer' ? 'Footer guardado' : 'Contenido publicado')
      clearDirty(tabId)
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo guardar contenido del sitio.')
    }
  }, [clearDirty, draft.footer, draft.pages, site.apiMode, store, updateMutation])

  const currentDirty = useMemo(() => dirtyTabs.includes(activeTab), [activeTab, dirtyTabs])

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {SITE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: activeTab === tab.id ? '1px solid #7B1E22' : '1px solid var(--muted-2)',
              background: activeTab === tab.id ? 'rgba(123,30,34,0.14)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--muted)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {tab.label}
            {dirtyTabs.includes(tab.id) ? ' •' : ''}
          </button>
        ))}
      </div>

      {site.apiMode && site.isError && (
        <div style={{ padding: 14, borderRadius: 12, border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.08)', color: 'var(--text-secondary)', fontSize: 13 }}>
          No se pudo cargar `site_configuration`. Se muestra fallback local mientras se resuelve.
        </div>
      )}

      {activeTab === 'suet' && (
        <>
          <PageContentEditor
            pageKey="suet"
            title="STRYDE X"
            value={draft.pages?.suet ?? createDefaultSuetConfig()}
            onChange={(next) => updatePage('suet', next)}
            onUploadFile={uploadMedia}
            canEdit={canEdit}
          />
          <button type="button" onClick={() => handleSave('suet')} disabled={!canEdit || !currentDirty} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#7B1E22', color: '#fff', cursor: canEdit ? 'pointer' : 'not-allowed' }}>
            Guardar STRYDE X
          </button>
        </>
      )}

      {activeTab === 'flow' && (
        <>
          <PageContentEditor
            pageKey="flow"
            title="SLOW"
            value={draft.pages?.flow ?? createDefaultFlowConfig()}
            onChange={(next) => updatePage('flow', next)}
            onUploadFile={uploadMedia}
            canEdit={canEdit}
          />
          <button type="button" onClick={() => handleSave('flow')} disabled={!canEdit || !currentDirty} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#7B1E22', color: '#fff', cursor: canEdit ? 'pointer' : 'not-allowed' }}>
            Guardar SLOW
          </button>
        </>
      )}

      {activeTab === 'yoga' && (
        <>
          <PageContentEditor
            pageKey="yoga"
            title="YOGA"
            value={draft.pages?.yoga ?? createDefaultYogaConfig()}
            onChange={(next) => updatePage('yoga', next)}
            onUploadFile={uploadMedia}
            canEdit={canEdit}
          />
          <button type="button" onClick={() => handleSave('yoga')} disabled={!canEdit || !currentDirty} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#7B1E22', color: '#fff', cursor: canEdit ? 'pointer' : 'not-allowed' }}>
            Guardar YOGA
          </button>
        </>
      )}

      {activeTab === 'footer' && (
        <>
          <FooterEditor
            value={draft.footer ?? createDefaultFooterConfig()}
            onChange={updateFooter}
            onUploadFile={uploadMedia}
            canEdit={canEdit}
          />
          <button type="button" onClick={() => handleSave('footer')} disabled={!canEdit || !currentDirty} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#7B1E22', color: '#fff', cursor: canEdit ? 'pointer' : 'not-allowed' }}>
            Guardar Footer
          </button>
        </>
      )}

      {activeTab === 'terminos' && (
        <>
          <TerminosEditor
            value={draft.pages?.terminos ?? createDefaultTerminosConfig()}
            onChange={(next) => updatePage('terminos', next)}
            onUploadFile={uploadMedia}
            canEdit={canEdit}
          />
          <button type="button" onClick={() => handleSave('terminos')} disabled={!canEdit || !currentDirty} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#7B1E22', color: '#fff', cursor: canEdit ? 'pointer' : 'not-allowed' }}>
            Guardar Términos y condiciones
          </button>
        </>
      )}
    </div>
  )
}
