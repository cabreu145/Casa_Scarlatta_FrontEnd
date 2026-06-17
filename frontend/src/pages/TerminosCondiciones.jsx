import { useEffectiveSiteConfiguration } from '@/hooks/useSiteConfiguration'
import { createDefaultTerminosConfig } from '@/constants/siteConfigurationDefaults'
import { resolveSiteMediaUrl } from '@/adapters/siteConfigurationAdapter'

export default function TerminosCondiciones() {
  const cfg = useEffectiveSiteConfiguration()
  const data = cfg.config?.pages?.terminos ?? createDefaultTerminosConfig()

  const sections = Array.isArray(data.sections) ? data.sections : []
  const images   = Array.isArray(data.images)   ? data.images.filter((img) => img?.url) : []

  return (
    <main className="min-h-screen bg-[#0D0608] py-20 px-6">
      <div className="mx-auto max-w-3xl">
        <h1
          className="mb-4 font-serif text-4xl text-[#F5EDE8]"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Términos y condiciones
        </h1>
        {data.lastUpdated && (
          <p
            className="mb-12 text-sm text-[#A08878]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Última actualización: {data.lastUpdated}
          </p>
        )}

        {/* Imágenes opcionales */}
        {images.length > 0 && (
          <div className="mb-12 flex flex-wrap gap-4">
            {images.map((img, i) => (
              <img
                key={img.id ?? i}
                src={resolveSiteMediaUrl(img)}
                alt={img.alt || 'Imagen de términos'}
                className="rounded-xl object-cover"
                style={{ maxHeight: 260, maxWidth: '100%' }}
              />
            ))}
          </div>
        )}

        {/* Secciones de texto */}
        <div
          className="space-y-10 text-[#C9B8B0]"
          style={{ fontFamily: 'var(--font-body)', lineHeight: 1.8, fontSize: 15 }}
        >
          {sections.map((sec, i) => (
            <section key={sec.id ?? i}>
              <h2
                className="mb-3 text-lg font-semibold text-[#E8A4AD]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {sec.titulo}
              </h2>
              <p style={{ whiteSpace: 'pre-line' }}>{sec.contenido}</p>
            </section>
          ))}

          {sections.length === 0 && (
            <p className="text-[#A08878]">Sin contenido configurado todavía.</p>
          )}
        </div>
      </div>
    </main>
  )
}
