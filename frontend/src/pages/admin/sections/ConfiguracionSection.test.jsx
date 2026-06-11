import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  upload: vi.fn(),
  storeUpdate: vi.fn(),
  toast: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

const backendConfig = vi.hoisted(() => ({
  carouselHero: [{ tipo: 'imagen', url: '/media/site/hero.webp' }],
  carouselNosotros: ['/media/site/team.webp'],
  imagenBannerClases: '/media/site/classes.webp',
  imagenStryde: '/media/site/stryde-old.webp',
  imagenSlow: '/media/site/slow.webp',
  imagenCoachesBanner: '/media/site/coaches.webp',
  telefono: '+52 999 100 2000',
  instagramHandle: '@backend',
  instagram: 'https://instagram.com/backend',
  whatsapp: '529991002000',
  direccion: 'Mérida, Yucatán',
  nosotrosTexto1: 'Texto backend',
  nosotrosTexto2: 'Subtítulo backend',
  nombreEstudio: 'Casa Backend',
  ciudad: 'Mérida',
}))

vi.mock('@/stores/configuracionStore', () => ({
  CONFIG_DEFAULTS: backendConfig,
  useConfiguracionStore: () => ({
    config: backendConfig,
    get: (key) => backendConfig[key],
    actualizar: mocks.storeUpdate,
  }),
}))

vi.mock('@/hooks/useSiteConfiguration', () => ({
  useEffectiveSiteConfiguration: () => ({
    apiMode: true,
    config: backendConfig,
    get: (key) => backendConfig[key],
    isLoading: false,
    isError: false,
    source: 'api',
  }),
}))

vi.mock('@/hooks/useApiQueries', () => ({
  useUpdateSiteConfigurationMutation: () => ({
    mutateAsync: mocks.update,
  }),
  useUploadSiteConfigurationMediaMutation: () => ({
    mutateAsync: mocks.upload,
  }),
}))

vi.mock('react-hot-toast', () => {
  const toast = (...args) => mocks.toast(...args)
  toast.success = (...args) => mocks.toastSuccess(...args)
  toast.error = (...args) => mocks.toastError(...args)
  return { default: toast }
})

vi.mock('./ConfiguracionCorreoSection', () => ({
  default: () => <div>Correo mock</div>,
}))

vi.mock('../components/rbac/RolesPermissionsSection', () => ({
  default: () => <div>RBAC mock</div>,
}))

describe('ConfiguracionSection', () => {
  beforeEach(() => {
    mocks.update.mockReset().mockResolvedValue(backendConfig)
    mocks.upload.mockReset().mockResolvedValue({
      url: 'http://127.0.0.1:8000/media/site/stryde-new.webp',
    })
    mocks.storeUpdate.mockReset()
    mocks.toast.mockReset()
    mocks.toastSuccess.mockReset()
    mocks.toastError.mockReset()
  })

  it('usuario sin roles.read no ve pestaña roles y permisos', async () => {
    const { default: ConfiguracionSection } = await import('./ConfiguracionSection')
    render(<ConfiguracionSection currentUser={{ permissions: ['settings.read'] }} />)

    expect(screen.queryByRole('button', { name: 'Roles y permisos' })).not.toBeInTheDocument()
  })

  it('usuario con roles.read sí ve pestaña roles y permisos', async () => {
    const { default: ConfiguracionSection } = await import('./ConfiguracionSection')
    render(<ConfiguracionSection currentUser={{ permissions: ['settings.read', 'roles.read'] }} />)

    expect(screen.getByRole('button', { name: 'Roles y permisos' })).toBeInTheDocument()
  })

  it('carga contacto backend y guarda campos mediante PUT mutation', async () => {
    const user = userEvent.setup()
    const { default: ConfiguracionSection } = await import('./ConfiguracionSection')
    render(
      <ConfiguracionSection
        currentUser={{ permissions: ['settings.read', 'settings.update'] }}
      />
    )

    const phone = screen.getByDisplayValue('+52 999 100 2000')
    await user.clear(phone)
    await user.type(phone, '+52 999 300 4000')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
        telefono: '+52 999 300 4000',
        instagram: 'https://instagram.com/backend',
        whatsapp: '529991002000',
        direccion: 'Mérida, Yucatán',
      }))
    })
    expect(mocks.storeUpdate).not.toHaveBeenCalled()
  })

  it('upload Stryde usa backend y deja URL pendiente para guardar', async () => {
    const user = userEvent.setup()
    const { default: ConfiguracionSection } = await import('./ConfiguracionSection')
    const { container } = render(
      <ConfiguracionSection
        currentUser={{ permissions: ['settings.read', 'settings.update'] }}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Imagenes' }))
    await user.click(screen.getByRole('button', { name: 'Subir Imagen disciplina Stryde X' }))
    const file = new File(['image'], 'stryde.webp', { type: 'image/webp' })
    await user.upload(container.querySelector('input[type="file"]'), file)

    await waitFor(() => {
      expect(mocks.upload).toHaveBeenCalledWith({
        field: 'imagenStryde',
        file,
      })
    })
    expect(await screen.findByDisplayValue('http://127.0.0.1:8000/media/site/stryde-new.webp')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => {
      expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
        imagenStryde: 'http://127.0.0.1:8000/media/site/stryde-new.webp',
      }))
    })
  })

  it('muestra error amigable cuando backend rechaza WhatsApp', async () => {
    const user = userEvent.setup()
    mocks.update.mockRejectedValueOnce({ code: 'SITE_CONFIG_INVALID_WHATSAPP' })
    const { default: ConfiguracionSection } = await import('./ConfiguracionSection')
    render(
      <ConfiguracionSection
        currentUser={{ permissions: ['settings.read', 'settings.update'] }}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith('WhatsApp debe contener solo números.')
    })
  })

  it('muestra error amigable cuando imagen supera tamaño permitido', async () => {
    const user = userEvent.setup()
    mocks.upload.mockRejectedValueOnce({ code: 'SITE_MEDIA_TOO_LARGE' })
    const { default: ConfiguracionSection } = await import('./ConfiguracionSection')
    const { container } = render(
      <ConfiguracionSection
        currentUser={{ permissions: ['settings.read', 'settings.update'] }}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Imagenes' }))
    await user.click(screen.getByRole('button', { name: 'Subir Imagen disciplina Stryde X' }))
    await user.upload(
      container.querySelector('input[type="file"]'),
      new File(['large'], 'large.webp', { type: 'image/webp' })
    )

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith('La imagen supera el tamaño máximo permitido.')
    })
  })

  it('bloquea upload de video local con mensaje backend MVP', async () => {
    const user = userEvent.setup()
    const { default: ConfiguracionSection } = await import('./ConfiguracionSection')
    render(
      <ConfiguracionSection
        currentUser={{ permissions: ['settings.read', 'settings.update'] }}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Imagenes' }))
    await user.selectOptions(screen.getByRole('combobox'), 'videolocal')
    await user.click(screen.getByRole('button', { name: 'Subir slide 1 del carrusel de inicio' }))

    expect(mocks.toastError).toHaveBeenCalledWith('El video local aún no está soportado.')
    expect(mocks.upload).not.toHaveBeenCalled()
  })
})
