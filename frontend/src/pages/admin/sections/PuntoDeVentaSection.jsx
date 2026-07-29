import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import styles from '../AdminPanel.module.css'
import SaleConfirmationCard from '@/components/ui/SaleConfirmationCard'
import PosEntityModal from '../components/PosEntityModal'
import {
  formatPackageCreditsLabel,
  formatPackagePriceLabel,
  formatPackageShareabilityLabel,
  formatPackageValidityLabel,
  getPackageDisplayName,
} from '@/utils/packageDisplay'
import {
  useAdminClientsQuery,
  useCreatePosSaleMutation,
  useCreateProductCategoryMutation,
  useMembershipPackagesQuery,
  usePosProductsQuery,
  usePosSalesQuery,
  useProductCategoriesQuery,
  useUpdateProductCategoryMutation,
  useUpdateProductCategoryStatusMutation,
  useDeleteProductCategoryMutation,
  useVoidSaleMutation,
} from '@/hooks/useApiQueries'
import { useAuthStore } from '@/stores/authStore'
import { hasAnyPermission, hasPermission } from '@/auth/permissions'
import { resolvePackagePurchaseErrorMessage } from '@/utils/packagePurchasePolicy'
import { buscarClientePorEmailApi } from '@/services/paymentsApiService'

function FilterChips({ options, active, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((option) => (
        <button
          key={option}
          className={`${styles.filterChip}${active === option ? ` ${styles.active}` : ''}`}
          onClick={() => onChange(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function categoryEmoji(categoria) {
  return { Accesorios: '🎽', Nutrición: '🧴', Equipo: '🏋️', Ropa: '👕' }[categoria] || '📦'
}

function money(value) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function translatePaymentMethod(value) {
  const raw = String(value ?? '').trim().toLowerCase()
  return {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    other: 'Otro',
  }[raw] || raw || '—'
}

function resolveUrl(path) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const base = String(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').trim()
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

function splitEmails(value) {
  return String(value ?? '')
    .split(/[\n,;]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function getCartLineKey(item) {
  return `${String(item.type ?? 'product')}:${String(item.id ?? item.productId ?? item.packageId)}`
}

function getCategoryName(item) {
  return item?.categoryName ?? item?.category ?? item?.categoria ?? 'General'
}

export default function PuntoDeVentaSection({
  paquetes,
  productos,
  agregarProducto,
  editarProducto,
  eliminarProducto,
  cart,
  posFilter,
  setPosFilter,
  prodModal,
  setProdModal,
  prodForm,
  setProdForm,
  confirmarEliminarProd,
  setConfirmarEliminarProd,
  pendingAsignacion,
  cartSubtotal,
  cartIva,
  cartTotal,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  updateCartItem,
  clearCart,
  handleCobrar,
  handleSaveProducto,
  handleEliminarProducto,
  useApiMode = false,
  isActive = false,
}) {
  const { usuario } = useAuthStore()
  const [buyerSearch, setBuyerSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null)
  const [buyerDropdownOpen, setBuyerDropdownOpen] = useState(false)
  const [buyerDropdownPos, setBuyerDropdownPos] = useState({ top: 0, left: 0, width: 0, maxH: 260 })
  const buyerBtnRef = useRef(null)
  const buyerDropdownRef = useRef(null)
  useEffect(() => {
    if (!buyerDropdownOpen) return
    const handleClickOutside = (e) => {
      if (buyerDropdownRef.current && !buyerDropdownRef.current.contains(e.target) &&
          buyerBtnRef.current && !buyerBtnRef.current.contains(e.target)) {
        setBuyerDropdownOpen(false)
        setBuyerSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [buyerDropdownOpen])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [bogoModal, setBogoModal] = useState(null) // { item } pending cart add
  const [bogoSearch, setBogoSearch] = useState('')
  const [bogoBeneficiario, setBogoBeneficiario] = useState(null)
  const [bogoBeneficiarioError, setBogoBeneficiarioError] = useState('')
  const [bogoBuscando, setBogoBuscando] = useState(false)
  const bogoDebounceRef = useRef(null)
  const [notes, setNotes] = useState('')
  const [saleResult, setSaleResult] = useState(null)
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [whatsappError, setWhatsappError] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productStatus, setProductStatus] = useState('active')
  const [categorySearch, setCategorySearch] = useState('')
  const [categoryStatus, setCategoryStatus] = useState('active')
  const [categoryModal, setCategoryModal] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', isActive: true })
  const [salesDateFilter, setSalesDateFilter] = useState('')
  const [voidSaleModal, setVoidSaleModal] = useState(null)
  const [voidSaleReason, setVoidSaleReason] = useState('')
  const [voidSaleReasonError, setVoidSaleReasonError] = useState('')
  const canViewPos = hasAnyPermission(usuario, ['pos.read', 'pos.sell', 'pos.products.read', 'pos.categories.read', 'pos.products.manage', 'pos.categories.manage'])
  const canSellPos = hasPermission(usuario, 'pos.sell')
  const canReadProducts = hasAnyPermission(usuario, ['pos.products.read', 'pos.sell', 'pos.products.manage'])
  const canReadCategories = hasAnyPermission(usuario, ['pos.categories.read', 'pos.sell', 'pos.categories.manage'])
  const canManagePosProducts = hasPermission(usuario, 'pos.products.manage')
  const canManagePosCategories = hasPermission(usuario, 'pos.categories.manage')

  const posProductsQuery = usePosProductsQuery({
    page: 1,
    pageSize: 100,
    search: productSearch,
    status: productStatus === 'all' ? undefined : productStatus,
    enabled: useApiMode && isActive && canReadProducts,
  })
  const productCategoriesQuery = useProductCategoriesQuery({
    page: 1,
    pageSize: 100,
    search: categorySearch,
    status: categoryStatus === 'all' ? undefined : categoryStatus,
    enabled: useApiMode && isActive && canReadCategories,
  })
  const membershipPackagesQuery = useMembershipPackagesQuery({
    enabled: useApiMode && isActive && canSellPos,
  })
  const buyerClientsQuery = useAdminClientsQuery({
    page: 1,
    pageSize: 20,
    search: buyerSearch,
    status: 'active',
    enabled: useApiMode && isActive && canSellPos,
  })
  const posSalesQuery = usePosSalesQuery({
    page: 1,
    pageSize: salesDateFilter ? 100 : 8,
    from: salesDateFilter || undefined,
    to: salesDateFilter || undefined,
    enabled: useApiMode && isActive && canViewPos,
  })
  const createSaleMutation = useCreatePosSaleMutation()
  const voidSaleMutation = useVoidSaleMutation()
  const createCategoryMutation = useCreateProductCategoryMutation()
  const updateCategoryMutation = useUpdateProductCategoryMutation()
  const updateCategoryStatusMutation = useUpdateProductCategoryStatusMutation()
  const deleteCategoryMutation = useDeleteProductCategoryMutation()

  const apiProducts = posProductsQuery.data?.items ?? []
  const apiCategories = productCategoriesQuery.data?.items ?? []
  const apiPackages = membershipPackagesQuery.data ?? []
  const buyerClients = buyerClientsQuery.data?.items ?? []
  const recentSales = posSalesQuery.data?.items ?? []

  const openVoidSaleModal = (sale) => {
    setVoidSaleReason('')
    setVoidSaleReasonError('')
    setVoidSaleModal(sale)
  }

  const closeVoidSaleModal = () => {
    setVoidSaleModal(null)
    setVoidSaleReason('')
    setVoidSaleReasonError('')
  }

  const confirmVoidSale = async () => {
    const reason = voidSaleReason.trim()
    if (!voidSaleModal) return
    if (reason.length < 3) {
      const message = 'Escribe un motivo de al menos 3 caracteres para anular la venta.'
      setVoidSaleReasonError(message)
      toast.error(message)
      return
    }
    try {
      await voidSaleMutation.mutateAsync({ id: voidSaleModal.id, reason })
      toast.success('Venta anulada correctamente.')
      closeVoidSaleModal()
    } catch (error) {
      const errorMessages = {
        SALE_ALREADY_CANCELLED: 'Esta venta ya estaba anulada.',
        SALE_CASH_CLOSURE_CLOSED: 'No se puede anular: el corte de caja de este turno ya está cerrado.',
        SALE_CREDITS_ALREADY_USED: 'No se puede anular: ya se usó al menos un crédito de este paquete.',
        VALIDATION_ERROR: 'El motivo para anular la venta debe tener al menos 3 caracteres.',
        POS_VOID_REASON_INVALID: 'El motivo para anular la venta debe tener al menos 3 caracteres.',
      }
      const status = error?.status ?? error?.response?.status
      toast.error(errorMessages[error?.code] || (status === 422 ? 'El motivo para anular la venta debe tener al menos 3 caracteres.' : null) || error?.message || 'No se pudo anular la venta.')
    }
  }

  const selectedCustomer = useMemo(() => {
    if (!useApiMode) return null
    if (selectedCustomerObj && String(selectedCustomerObj.id) === String(selectedCustomerId)) return selectedCustomerObj
    return buyerClients.find((client) => String(client.id) === String(selectedCustomerId)) ?? null
  }, [buyerClients, selectedCustomerId, selectedCustomerObj, useApiMode])

  const cartTotalComputed = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.quantity ?? 1) * Number(item.unitPriceMxn ?? item.price ?? 0), 0),
    [cart]
  )
  const subtotalToShow = useApiMode ? cartTotalComputed : cartSubtotal
  const ivaToShow = useApiMode ? 0 : cartIva
  const totalToShow = useApiMode ? cartTotalComputed : cartTotal

  const categoryOptions = useMemo(() => {
    if (!useApiMode) {
      return ['Todos', '📦 Paquetes', 'Accesorios', 'Nutrici?n', 'Equipo', 'Ropa']
    }
    if (!canReadCategories) {
      return ['Todos', '📦 Paquetes']
    }
    const categories = apiCategories.map((item) => item.name ?? item.nombre).filter(Boolean)
    return ['Todos', '📦 Paquetes', ...categories]
  }, [apiCategories, canReadCategories, useApiMode])
  const visibleItems = useMemo(() => {
    if (!useApiMode) return []
    if (!canReadProducts) return []
    const search = String(productSearch ?? '').trim().toLowerCase()
    const productsFiltered = apiProducts.filter((item) => {
      if (posFilter !== 'Todos' && posFilter !== '📦 Paquetes' && item.category !== posFilter) return false
      if (search) {
        const haystack = [item.name, item.category, item.description].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(search)) return false
      }
      return true
    })

    const packagesFiltered = apiPackages.filter((item) => {
      if (posFilter !== 'Todos' && posFilter !== '📦 Paquetes') return false
      if (search) {
        const haystack = [getPackageDisplayName(item), item.displayName, item.name, item.description].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(search)) return false
      }
      return true
    })

    if (posFilter === '📦 Paquetes') return packagesFiltered.map((item) => ({ kind: 'package', item }))
    if (posFilter === 'Todos') {
      return [
        ...productsFiltered.map((item) => ({ kind: 'product', item })),
        ...packagesFiltered.map((item) => ({ kind: 'package', item })),
      ]
    }
    return productsFiltered.map((item) => ({ kind: 'product', item }))
  }, [apiPackages, apiProducts, canReadProducts, posFilter, productSearch, useApiMode])

  function addProductToCart(item) {
    // Intercept BOGO packages before any other logic
    if (item.kind === 'package') {
      const pkgPromoRaw = item.item.activePromotion ?? null
      const pkgPromo = pkgPromoRaw?.remainingCount === 0 ? null : pkgPromoRaw
      if (pkgPromo?.type === 'buy_one_get_one') {
        if (item.kind === 'package' && !selectedCustomerId) {
          toast.error('Selecciona cliente para vender paquete.')
          return
        }
        setBogoModal({ item, pkgPromo })
        setBogoSearch('')
        setBogoBeneficiario(null)
        setBogoBeneficiarioError('')
        return
      }
    }

    if (!useApiMode) {
      addToCart?.(item)
      return
    }
    if (!canSellPos) {
      toast.error('No tienes permisos para vender en POS.')
      return
    }

    if (!item.isActive && item.kind === 'product') {
      toast.error('Producto inactivo')
      return
    }
    if (item.kind === 'product' && Number(item.stock ?? 0) <= 0) {
      toast.error('Sin stock disponible')
      return
    }
    if (item.kind === 'package' && !selectedCustomerId) {
      toast.error('Selecciona cliente para vender paquete.')
      return
    }
    const pkgPromoRaw = item.kind === 'package' ? (item.item.activePromotion ?? null) : null
    const pkgPromo = pkgPromoRaw?.remainingCount === 0 ? null : pkgPromoRaw

    const payload = item.kind === 'package'
      ? {
          type: 'package',
          id: item.item.id,
          name: getPackageDisplayName(item.item),
          quantity: 1,
          unitPriceMxn: Number(pkgPromo?.finalPriceMxn ?? item.item.priceMxn ?? item.item.price_mxn ?? item.item.precio ?? 0),
          beneficiariesText: '',
          packageId: item.item.id,
          isShareable: Boolean(item.item.isShareable),
          maxBeneficiaries: Number(item.item.maxBeneficiaries ?? 0),
          promotionId: pkgPromo?.id ?? null,
          activePromotion: pkgPromo,
          beneficiaryUserId: null,
        }
      : {
          type: 'product',
          id: item.item.id,
          name: item.item.name,
          quantity: 1,
          unitPriceMxn: Number(item.item.priceMxn ?? item.item.price_mxn ?? item.item.precio ?? 0),
          stock: Number(item.item.stock ?? 0),
          category: item.item.category,
        }
    addToCart?.(payload)
  }

  function handleBogoEmailChange(e) {
    const val = e.target.value
    setBogoSearch(val)
    setBogoBeneficiario(null)
    setBogoBeneficiarioError('')
    clearTimeout(bogoDebounceRef.current)
    if (val.length >= 5 && val.includes('@')) {
      bogoDebounceRef.current = setTimeout(async () => {
        setBogoBuscando(true)
        try {
          const result = await buscarClientePorEmailApi(val.trim())
          if (result?.id && String(result.id) !== String(selectedCustomerId)) {
            setBogoBeneficiario(result)
          } else if (String(result?.id) === String(selectedCustomerId)) {
            setBogoBeneficiarioError('El beneficiario no puede ser el mismo comprador.')
          }
        } catch (err) {
          const msg = err?.payload?.detail?.message ?? err?.message ?? 'No se encontró un cliente con ese correo.'
          setBogoBeneficiarioError(msg)
        } finally {
          setBogoBuscando(false)
        }
      }, 600)
    }
  }

  function confirmBogoAdd() {
    if (!bogoModal || !bogoBeneficiario) return
    const { item, pkgPromo } = bogoModal
    const payload = {
      type: 'package',
      id: item.item.id,
      name: getPackageDisplayName(item.item),
      quantity: 1,
      unitPriceMxn: Number(item.item.priceMxn ?? item.item.price_mxn ?? item.item.precio ?? 0),
      beneficiariesText: '',
      packageId: item.item.id,
      isShareable: Boolean(item.item.isShareable),
      maxBeneficiaries: Number(item.item.maxBeneficiaries ?? 0),
      promotionId: pkgPromo?.id ?? null,
      activePromotion: pkgPromo,
      beneficiaryUserId: bogoBeneficiario.id,
      beneficiaryName: bogoBeneficiario.name,
    }
    addToCart?.(payload)
    setBogoModal(null)
  }

  async function submitSale() {
    if (useApiMode && !canSellPos) {
      toast.error('No tienes permisos para vender en POS.')
      return
    }
    if (!cart.length) {
      toast.error('Agrega items a la orden primero')
      return
    }
    const hasPackage = cart.some((item) => String(item.type ?? '').toLowerCase() === 'package')
    if (hasPackage && !selectedCustomerId) {
      toast.error('Selecciona cliente para vender paquete.')
      return
    }

    try {
      const payload = {
        customerId: selectedCustomerId || null,
        items: cart.map((item) => ({
          ...item,
          beneficiaries: splitEmails(item.beneficiariesText ?? item.beneficiaries ?? ''),
        })),
        paymentMethod,
        subtotalMxn: subtotalToShow,
        taxMxn: ivaToShow,
        totalMxn: totalToShow,
        notes,
      }
      const response = await createSaleMutation.mutateAsync(payload)
      setSaleResult(response)
      setWhatsappPhone('')
      setWhatsappError('')
      clearCart?.()
      toast.success('Venta registrada')
    } catch (error) {
      const code = String(error?.code ?? '').trim()
      const raw = String(error?.message ?? '').trim()
      const messageByCode = {
        SALE_TOTAL_MISMATCH: 'Total no coincide con backend.',
        INSUFFICIENT_STOCK: 'Stock insuficiente.',
        PRODUCT_INACTIVE: 'Producto inactivo.',
        PACKAGE_INACTIVE: 'Paquete inactivo.',
        PACKAGE_NOT_SHAREABLE: 'Paquete no compartible.',
        SHARED_CREDITS_NOT_DIVISIBLE: 'Este paquete no se puede dividir exactamente entre los beneficiarios seleccionados.',
        BENEFICIARY_NOT_FOUND: 'No encontramos un cliente con ese correo.',
        /* MAX_BENEFICIARIES_EXCEEDED: 'Se excedió número máximo de beneficiarios.', */
        CUSTOMER_REQUIRED_FOR_PACKAGE: 'Selecciona cliente para vender paquete.',
        VALIDATION_ERROR: raw || 'No pudimos completar la venta.',
      }
      toast.error(
        resolvePackagePurchaseErrorMessage(error, { admin: true }) ||
        messageByCode[code] ||
        raw ||
        'No pudimos completar la venta.'
      )
    }
  }

  function openWhatsAppShare() {
    const phone = String(whatsappPhone ?? '').replace(/[^\d]/g, '')
    if (!phone) {
      setWhatsappError('Ingresa número telefónico.')
      return
    }
    const ticketUrl = saleResult?.publicTicketUrl || saleResult?.ticketUrl
    const resolvedTicket = resolveUrl(ticketUrl)
    const message = encodeURIComponent(
      `Hola, te compartimos tu ticket de Casa Scarlatta.\n\nFolio: ${saleResult?.folio ?? 'N/D'}\nTotal: ${money(saleResult?.totalMxn ?? 0)}\nTicket: ${resolvedTicket ?? 'N/D'}\n\nGracias por tu compra.`
    )
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  function openCategoryModal(category = null) {
    if (category) {
      setCategoryModal(category)
      setCategoryForm({
        name: category.name ?? category.nombre ?? '',
        description: category.description ?? '',
        isActive: category.isActive !== false,
      })
      return
    }
    setCategoryModal('nuevo')
    setCategoryForm({ name: '', description: '', isActive: true })
  }

  function openProductModal() {
    if (!canManagePosProducts) {
      toast.error('No tienes permisos para gestionar productos.')
      return
    }
    const firstCategory = apiCategories[0] ?? null
    setProdModal('nuevo')
    setProdForm({
      nombre: '',
      categoria: firstCategory?.name ?? firstCategory?.nombre ?? '',
      categoryId: firstCategory?.id ?? '',
      precio: '',
      stock: '',
      emoji: '',
    })
  }

  async function saveCategory() {
    if (!canManagePosCategories) {
      toast.error('No tienes permisos para gestionar categorías.')
      return
    }
    try {
      const payload = {
        name: categoryForm.name,
        description: categoryForm.description,
        isActive: Boolean(categoryForm.isActive),
      }
      if (categoryModal === 'nuevo') {
        await createCategoryMutation.mutateAsync(payload)
        toast.success('Categoría creada')
      } else {
        await updateCategoryMutation.mutateAsync({ id: categoryModal.id, payload })
        toast.success('Categoría actualizada')
      }
      setCategoryModal(null)
      setCategoryForm({ name: '', description: '', isActive: true })
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo guardar categoría')
    }
  }

  async function toggleCategoryStatus(category) {
    if (!canManagePosCategories) {
      toast.error('No tienes permisos para gestionar categorías.')
      return
    }
    try {
      await updateCategoryStatusMutation.mutateAsync({
        id: category.id,
        status: !category.isActive,
      })
      toast.success(category.isActive ? 'Categoría inactivada' : 'Categoría activada')
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo cambiar estado')
    }
  }

  async function removeCategory(category) {
    if (!canManagePosCategories) {
      toast.error('No tienes permisos para gestionar categorías.')
      return
    }
    try {
      await deleteCategoryMutation.mutateAsync(category.id)
      toast.success('Categoría eliminada')
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo eliminar categoría')
    }
  }

  const canUseApiCatalog = useApiMode && isActive

  if (useApiMode) {
    return (
      <>
        <div className={styles.posGrid}>
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
              <FilterChips options={categoryOptions} active={posFilter} onChange={setPosFilter} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 10 }}>
                <input
                  className={styles.searchInput}
                  placeholder="Buscar producto o paquete..."
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                />
                <select
                  className={styles.formSelect}
                  value={productStatus}
                  onChange={(event) => setProductStatus(event.target.value)}
                >
                  <option value="active">Activos</option>
                  <option value="all">Todos</option>
                </select>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-body)' }} />
            </div>

            {posProductsQuery.isLoading && <div style={{ color: 'var(--muted)', marginBottom: 10 }}>Cargando productos...</div>}
            {posProductsQuery.error && <div style={{ color: '#f87171', marginBottom: 10 }}>{posProductsQuery.error?.message ?? 'No pudimos cargar productos.'}</div>}
            {membershipPackagesQuery.isLoading && <div style={{ color: 'var(--muted)', marginBottom: 10 }}>Cargando paquetes activos...</div>}
            {membershipPackagesQuery.error && <div style={{ color: '#f87171', marginBottom: 10 }}>{membershipPackagesQuery.error?.message ?? 'No pudimos cargar paquetes.'}</div>}

            <div className={styles.card} style={{ marginBottom: 20 }}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>Categorías POS</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {canManagePosProducts && (
                    <button
                      className={`${styles.btn} ${styles.btnGhost}`}
                      type="button"
                      onClick={openProductModal}
                      disabled={!apiCategories.length}
                    >
                      Nuevo producto
                    </button>
                  )}
                  {canManagePosCategories && (
                    <button className={`${styles.btn} ${styles.btnPrimary}`} type="button" onClick={() => openCategoryModal()}>
                      Nueva categoría
                    </button>
                  )}
                  </div>
                </div>
              {!canReadCategories && !canManagePosCategories && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                  No tienes permisos para ver categorías POS.
                </div>
              )}
              {canReadCategories && !apiCategories.length && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                  Crea una categoría antes de registrar productos.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 10, marginBottom: 12 }}>
                <input
                  className={styles.searchInput}
                  placeholder="Buscar categoría..."
                  value={categorySearch}
                  onChange={(event) => setCategorySearch(event.target.value)}
                />
                <select
                  className={styles.formSelect}
                  value={categoryStatus}
                  onChange={(event) => setCategoryStatus(event.target.value)}
                >
                  <option value="active">Activas</option>
                  <option value="inactive">Inactivas</option>
                  <option value="all">Todas</option>
                </select>
              </div>
              {productCategoriesQuery.isLoading && <div style={{ color: 'var(--muted)' }}>Cargando categorías...</div>}
              {productCategoriesQuery.error && <div style={{ color: '#f87171' }}>{productCategoriesQuery.error?.message ?? 'No pudimos cargar categorías.'}</div>}
              <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                {canReadCategories && apiCategories.map((category) => (
                  <div
                    key={category.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 12,
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 12,
                      border: '1px solid var(--muted-2)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{category.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{category.description || 'Sin descripción'}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{category.isActive ? 'Activa' : 'Inactiva'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {canManagePosCategories && (
                        <>
                          <button type="button" className={styles.btn} onClick={() => openCategoryModal(category)}>Editar</button>
                          <button type="button" className={styles.btn} onClick={() => toggleCategoryStatus(category)}>
                            {category.isActive ? 'Inactivar' : 'Activar'}
                          </button>
                          <button type="button" className={styles.btn} onClick={() => removeCategory(category)}>
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {!canReadCategories && !canManagePosCategories && !productCategoriesQuery.isLoading && (
                  <div style={{ color: 'var(--muted)' }}>Permiso insuficiente para mostrar categorías.</div>
                )}
                {canReadCategories && !apiCategories.length && !productCategoriesQuery.isLoading && (
                  <div style={{ color: 'var(--muted)' }}>Sin categorías para mostrar.</div>
                )}
              </div>
            </div>

            <div className={styles.productGrid}>
              {visibleItems.map(({ kind, item }) => {
                const isPackage = kind === 'package'
                const name = isPackage ? getPackageDisplayName(item) : item.name
                const pkgPromoRaw = isPackage ? (item.activePromotion ?? null) : null
                const pkgPromoCard = pkgPromoRaw?.remainingCount === 0 ? null : pkgPromoRaw
                const pkgPromoIsBogo = pkgPromoCard?.type === 'buy_one_get_one'
                const basePrice = Number(item.priceMxn ?? item.price_mxn ?? item.precio ?? 0)
                const promoPrice = pkgPromoCard?.finalPriceMxn != null && !pkgPromoIsBogo ? Number(pkgPromoCard.finalPriceMxn) : null
                const price = promoPrice ?? basePrice
                const categoryLabel = getCategoryName(item)
                const emoji = isPackage ? (item.isFeatured ? '⭐' : '📦') : categoryEmoji(categoryLabel)
                const isInactive = !isPackage && item.isActive === false
                const isOutOfStock = !isPackage && Number(item.stock ?? 0) <= 0
                return (
                  <div key={`${kind}-${item.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button
                      className={styles.productCard}
                      onClick={() => addProductToCart({ kind, item, isActive: item.isActive, stock: item.stock })}
                      disabled={isInactive || isOutOfStock || (useApiMode && !canSellPos)}
                      type="button"
                      style={pkgPromoCard ? { position: 'relative', overflow: 'hidden' } : undefined}
                    >
                      {pkgPromoCard?.badgeLabel && (
                        <div style={{
                          position: 'absolute', top: 0, left: 0, right: 0,
                          background: pkgPromoCard.type === 'buy_one_get_one' ? '#4E6855' : '#A07830',
                          color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                          textAlign: 'center', padding: '3px 0', lineHeight: 1.4,
                        }}>
                          🏷 {pkgPromoCard.badgeLabel}
                        </div>
                      )}
                      <div className={styles.productEmoji} style={pkgPromoCard?.badgeLabel ? { marginTop: 16 } : undefined}>{emoji}</div>
                      <div className={styles.productName}>{name}</div>
                      {promoPrice != null ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <div style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'line-through' }}>{money(basePrice)}</div>
                          <div className={styles.productPrice} style={{ color: '#4ade80' }}>{money(promoPrice)}</div>
                        </div>
                      ) : (
                        <div className={styles.productPrice}>{money(price)}</div>
                      )}
                      {isPackage ? (
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                          <div>{formatPackageCreditsLabel(item)}</div>
                          <div>{formatPackageValidityLabel(item)}</div>
                          <div>{formatPackageShareabilityLabel(item) || 'No compartible'}</div>
                          {pkgPromoCard?.type === 'buy_one_get_one' && pkgPromoCard?.bonusPackageName && (
                            <div style={{ color: '#86efac', marginTop: 2 }}>+1 {pkgPromoCard.bonusPackageName}</div>
                          )}
                          {pkgPromoCard?.remainingCount != null && pkgPromoCard.remainingCount > 0 && (
                            <div style={{
                              color: pkgPromoCard.remainingCount <= 5 ? '#f87171' : pkgPromoCard.remainingCount <= 10 ? '#fb923c' : '#86efac',
                              marginTop: 2, fontWeight: pkgPromoCard.remainingCount <= 10 ? 700 : 'normal',
                            }}>
                              {pkgPromoCard.remainingCount <= 5 ? '🔴' : pkgPromoCard.remainingCount <= 10 ? '⚠️' : '🎟️'} {pkgPromoCard.remainingCount <= 10 ? `¡Solo quedan ${pkgPromoCard.remainingCount}!` : `${pkgPromoCard.remainingCount} disponibles`}
                            </div>
                          )}
                          {pkgPromoCard?.remainingCount === 0 && (
                            <div style={{ color: '#f87171', marginTop: 2, fontWeight: 700 }}>🔴 Agotada</div>
                          )}
                        </div>
                      ) : (
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                          <div>Categoría: {categoryLabel}</div>
                          <div>Stock: {item.stock}</div>
                          <div>{item.description || 'Sin descripción'}</div>
                        </div>
                      )}
                      </button>
                    {!isPackage && canManagePosProducts && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          style={{ flex: 1, fontSize: 11, padding: '3px 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-muted)' }}
                          onClick={() => {
                            setProdForm({
                              nombre: item.name,
                              categoria: item.category ?? item.categoryName ?? '',
                              categoryId: item.categoryId ?? item.category_id ?? '',
                              precio: String(item.priceMxn ?? item.price_mxn ?? item.precio ?? 0),
                              stock: String(item.stock ?? 0),
                              emoji: '',
                            })
                            setProdModal({ producto: item })
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          style={{ flex: 1, fontSize: 11, padding: '3px 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, cursor: 'pointer', color: '#ef4444' }}
                          onClick={() => setConfirmarEliminarProd(item)}
                        >
                          🗑
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
              {!visibleItems.length && !posProductsQuery.isLoading && !membershipPackagesQuery.isLoading && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '24px 0', color: 'var(--muted)' }}>
                  {!canReadProducts ? 'No tienes permisos para ver productos en POS.' : 'No hay items para estos filtros.'}
                </div>
              )}
            </div>

            {canUseApiCatalog && (
              <div className={styles.card} style={{ marginTop: 20 }}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>Ventas recientes</div>
                  <input
                    type="date"
                    className={styles.searchInput}
                    style={{ width: 'auto' }}
                    value={salesDateFilter}
                    onChange={(event) => setSalesDateFilter(event.target.value)}
                  />
                  {salesDateFilter && (
                    <button
                      type="button"
                      onClick={() => setSalesDateFilter('')}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}
                    >
                      Limpiar fecha
                    </button>
                  )}
                </div>
                {recentSales.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)' }}>
                    {salesDateFilter ? 'No hay ventas en esta fecha.' : 'No hay ventas recientes.'}
                  </div>
                ) : (
                  <div className={styles.tableWrap}>
                    <table>
                      <thead>
                        <tr>
                          <th>Folio</th>
                          <th>Cliente</th>
                          <th>Fecha</th>
                          <th>Método</th>
                          <th>Total</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSales.map((sale) => {
                          const isCancelled = sale.status === 'cancelled'
                          return (
                            <tr key={sale.id} style={isCancelled ? { opacity: 0.6 } : undefined}>
                              <td style={isCancelled ? { textDecoration: 'line-through' } : undefined}>{sale.folio}</td>
                              <td style={isCancelled ? { textDecoration: 'line-through' } : undefined}>
                                {sale.customerName || sale.customerEmail || 'Venta mostrador'}
                              </td>
                              <td>{formatDateTime(sale.createdAt)}</td>
                              <td>{translatePaymentMethod(sale.paymentMethod)}</td>
                              <td style={isCancelled ? { textDecoration: 'line-through' } : undefined}>{money(sale.totalMxn)}</td>
                              <td>
                                {isCancelled ? (
                                  <span
                                    title={sale.cancelReason || undefined}
                                    style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                                  >
                                    Anulada
                                  </span>
                                ) : canSellPos ? (
                                  <button
                                    type="button"
                                    title="Anular venta"
                                    onClick={() => openVoidSaleModal(sale)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 15, fontWeight: 700, padding: '0 4px' }}
                                  >
                                    ✕
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.cartSection}>
            <div className={styles.cartTitle}>🛒 Orden actual</div>

            {pendingAsignacion && (
              <div style={{ margin: '0 0 10px', padding: '10px 12px', background: 'rgba(234,179,8,0.1)', borderRadius: 8, border: '1px solid rgba(234,179,8,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>🔒</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24', fontFamily: 'var(--font-body)' }}>
                    Paquete pendiente de cobro
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                  👤 <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{pendingAsignacion.userName}</strong> recibirá el paquete <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{pendingAsignacion.paqSel?.nombre ?? pendingAsignacion.paqSel?.name ?? 'Paquete'}</strong> al confirmar el cobro.
                </div>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                Cliente para paquetes
              </div>
              <div style={{ position: 'relative' }}>
                <button
                  ref={buyerBtnRef}
                  type="button"
                  className={styles.formSelect}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: 13 }}
                  onClick={() => {
                    if (buyerBtnRef.current) {
                      const r = buyerBtnRef.current.getBoundingClientRect()
                      const DROPDOWN_H = 260
                      const spaceBelow = window.innerHeight - r.bottom - 8
                      const spaceAbove = r.top - 8
                      if (spaceBelow >= DROPDOWN_H || spaceBelow >= spaceAbove) {
                        setBuyerDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width, maxH: Math.min(DROPDOWN_H, spaceBelow) })
                      } else {
                        setBuyerDropdownPos({ top: r.top - Math.min(DROPDOWN_H, spaceAbove) - 4, left: r.left, width: r.width, maxH: Math.min(DROPDOWN_H, spaceAbove) })
                      }
                    }
                    setBuyerDropdownOpen(o => !o)
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedCustomer ? (selectedCustomer.name ?? selectedCustomer.nombre ?? selectedCustomer.email) : 'Selecciona cliente'}
                  </span>
                  <span style={{ opacity: 0.6, flexShrink: 0 }}>▾</span>
                </button>
                {buyerDropdownOpen && createPortal(
                  <div
                    ref={buyerDropdownRef}
                    style={{
                      position: 'fixed',
                      top: buyerDropdownPos.top,
                      left: buyerDropdownPos.left,
                      width: buyerDropdownPos.width,
                      maxHeight: buyerDropdownPos.maxH,
                      zIndex: 9999,
                      background: '#2a171e',
                      border: '1px solid rgba(255,255,255,0.18)',
                      borderRadius: 8,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      overflowY: 'auto',
                    }}
                  >
                    <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <input
                        type="text"
                        style={{ width: '100%', fontSize: 12, padding: '5px 8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', outline: 'none' }}
                        placeholder="Buscar cliente..."
                        autoFocus
                        value={buyerSearch}
                        onChange={e => setBuyerSearch(e.target.value)}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    <div
                      style={{ padding: '8px 12px', fontSize: 13, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                      onClick={() => { setSelectedCustomerId(''); setSelectedCustomerObj(null); setBuyerDropdownOpen(false); setBuyerSearch('') }}
                    >
                      Selecciona cliente
                    </div>
                    {buyerClients.map(client => (
                      <div
                        key={client.id}
                        style={{
                          padding: '8px 12px',
                          fontSize: 13,
                          color: '#fff',
                          cursor: 'pointer',
                          background: String(selectedCustomerId) === String(client.id) ? 'rgba(255,255,255,0.1)' : 'transparent',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = String(selectedCustomerId) === String(client.id) ? 'rgba(255,255,255,0.1)' : 'transparent'}
                        onClick={() => { setSelectedCustomerId(String(client.id)); setSelectedCustomerObj(client); setBuyerDropdownOpen(false); setBuyerSearch('') }}
                      >
                        {client.name ?? client.nombre ?? client.email}
                      </div>
                    ))}
                  </div>,
                  document.body
                )}
              </div>
              {selectedCustomer && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                  Cliente: <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{selectedCustomer.name ?? selectedCustomer.nombre}</strong>
                </div>
              )}
            </div>

            <div className={styles.cartItems}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontSize: 13 }}>
                  Selecciona productos o paquetes para agregar
                </div>
              ) : (
                cart.map((item, idx) => {
                  const isPackage = String(item.type ?? '').toLowerCase() === 'package'
                  return (
                    <div key={getCartLineKey(item) + `-${idx}`} style={{ display: 'grid', gap: 8, padding: 10, border: '1px solid var(--muted-2)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
                            {isPackage ? '📦' : item.emoji ?? '🛍️'} {item.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {money(Number(item.unitPriceMxn ?? item.price ?? 0))} c/u
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.cartRemoveBtn}
                          onClick={() => removeFromCart?.(idx)}
                        >
                          ×
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            type="button"
                            className={styles.btn}
                            onClick={() => updateCartItemQuantity?.(idx, Math.max(1, Number(item.quantity ?? 1) - 1))}
                            disabled={(item.quantity ?? 1) <= 1}
                          >
                            −
                          </button>
                          <strong>{item.quantity ?? 1}</strong>
                          <button
                            type="button"
                            className={styles.btn}
                            onClick={() => updateCartItemQuantity?.(idx, Number(item.quantity ?? 1) + 1)}
                          >
                            +
                          </button>
                        </div>
                        <strong className={styles.cartItemPrice}>{money((Number(item.quantity ?? 1)) * Number(item.unitPriceMxn ?? item.price ?? 0))}</strong>
                      </div>

                      {/* {isPackage && (
                        <div style={{ display: 'grid', gap: 6 }}>
                          <label style={{ fontSize: 11, color: 'var(--muted)' }}>
                            Beneficiarios opcionales
                          </label>
                          <textarea
                            className={styles.formInput}
                            rows={3}
                            placeholder="emails separados por coma"
                            value={item.beneficiariesText ?? ''}
                            onChange={(event) => {
                              const next = event.target.value
                              updateCartItem?.(idx, { beneficiariesText: next })
                            }}
                          />
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {formatPackageShareabilityLabel(item.package ?? item) || 'No compartible'}
                          </div>
                        </div>
                      )} */}
                    </div>
                  )
                })
              )}
            </div>

            <div className={styles.cartTotal}>
              <div className={styles.cartTotalRow}><span>Subtotal</span><span>{money(subtotalToShow)}</span></div>
              <div className={styles.cartTotalMain}><span>Total a cobrar</span><span>{money(totalToShow)}</span></div>
            </div>

            {useApiMode && (
              <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
                <select className={styles.formSelect} value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                  <option value="other">Otro</option>
                </select>
                <textarea
                  className={styles.formInput}
                  rows={3}
                  placeholder="Notas de venta"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
            )}

            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ width: '100%', justifyContent: 'center', padding: 12 }}
              onClick={useApiMode ? submitSale : handleCobrar}
              disabled={(useApiMode && createSaleMutation.isPending) || (useApiMode && !canSellPos)}
              type="button"
              title={useApiMode && !canSellPos ? 'No tienes permisos para vender en POS' : undefined}
            >
              {useApiMode && createSaleMutation.isPending ? 'Procesando...' : '💳 Cobrar'}
            </button>
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              style={{ width: '100%', justifyContent: 'center', padding: 10, marginTop: 8 }}
              onClick={() => {
                clearCart?.()
                if (useApiMode) {
                  setSelectedCustomerId('')
                  setPaymentMethod('cash')
                  setNotes('')
                }
              }}
              type="button"
            >
              Limpiar orden
            </button>
          </div>
        </div>

                        {saleResult && createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.72)',
              zIndex: 9999,
              display: 'grid',
              placeItems: 'center',
              padding: 20,
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => setSaleResult(null)}
          >
            <div onClick={(event) => event.stopPropagation()}>
              <SaleConfirmationCard
                folio={saleResult.folio}
                paymentMethod={saleResult.paymentMethod || paymentMethod}
                dateTime={saleResult.createdAt}
                subtotalAmount={saleResult.subtotalMxn ?? saleResult.totalMxn}
                taxAmount={saleResult.taxMxn ?? 0}
                totalAmount={saleResult.totalMxn}
                publicTicketImageUrl={saleResult.publicTicketImageUrl}
                publicTicketUrl={saleResult.publicTicketUrl}
                onViewTicket={() => {
                  const url = resolveUrl(saleResult.publicTicketImageUrl || saleResult.publicTicketUrl)
                  if (!url) return toast.error('No hay link público disponible para este ticket.')
                  window.open(url, '_blank', 'noopener,noreferrer')
                }}
                onSendWhatsApp={(phone) => {
                  const ticketUrl = saleResult?.publicTicketImageUrl || saleResult?.publicTicketUrl
                  const resolvedTicket = resolveUrl(ticketUrl)
                  if (!resolvedTicket) {
                    toast.error('No hay link público disponible para enviar el ticket por WhatsApp.')
                    return
                  }
                  const normalizedPhone = String(phone ?? '').replace(/[^\d]/g, '')
                  const normalized = normalizedPhone.length === 10 ? ('52' + normalizedPhone) : normalizedPhone
                  const message = encodeURIComponent('Hola, te compartimos tu ticket de Casa Scarlatta.\n\nFolio: ' + (saleResult?.folio ?? 'N/D') + '\nTotal: ' + money(saleResult?.totalMxn ?? 0) + '\nTicket: ' + resolvedTicket + '\n\nGracias por tu compra.')
                  window.open('https://wa.me/' + normalized + '?text=' + message, '_blank', 'noopener,noreferrer')
                }}
                onClose={() => setSaleResult(null)}
              />
            </div>
          </div>,
          document.body
        )}
        {categoryModal && createPortal(
          <div
            className={`${styles.root} ${styles.modalOverlay} ${styles.open}`}
          >
            <PosEntityModal
              title={categoryModal === 'nuevo' ? 'Nueva categoría' : 'Editar categoría'}
              ariaLabel={categoryModal === 'nuevo' ? 'Nueva categoría' : 'Editar categoría'}
              onClose={() => setCategoryModal(null)}
              footer={(
                <>
                  <button className={`${styles.btn} ${styles.btnGhost}`} type="button" onClick={() => setCategoryModal(null)}>Cancelar</button>
                  <button className={`${styles.btn} ${styles.btnPrimary}`} type="button" onClick={saveCategory}>Guardar</button>
                </>
              )}
            >
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nombre</label>
                  <input
                    className={styles.formInput}
                    placeholder="Ej: Accesorios"
                    value={categoryForm.name}
                    onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Estado</label>
                  <select
                    className={styles.formSelect}
                    value={categoryForm.isActive ? 'active' : 'inactive'}
                    onChange={(event) =>
                      setCategoryForm((current) => ({
                        ...current,
                        isActive: event.target.value === 'active',
                      }))
                    }
                  >
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                </div>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.formLabel}>Descripción</label>
                  <textarea
                    className={styles.formInput}
                    rows={3}
                    placeholder="Opcional: texto descriptivo para identificar la categoría"
                    value={categoryForm.description}
                    onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </div>
              </div>
            </PosEntityModal>
          </div>,
          document.body
        )}

      {/* Modal beneficiario 2×1 */}
      {bogoModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1E1218', borderRadius: 18, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', color: '#F5EDE8' }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>🎁 Paquete 2×1</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
              Este paquete incluye un regalo para otro cliente. Ingresa el correo del beneficiario (quien recibirá el paquete extra).
            </div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Correo del beneficiario</label>
            <input
              type="email"
              autoFocus
              placeholder="correo@ejemplo.com"
              value={bogoSearch}
              onChange={handleBogoEmailChange}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'var(--surface-alt, rgba(255,255,255,0.07))', color: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
            {bogoBuscando && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Buscando...</div>}
            {bogoBeneficiario && (
              <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(78,104,85,0.15)', border: '1px solid rgba(78,104,85,0.4)', fontSize: 13 }}>
                ✅ <strong>{bogoBeneficiario.name}</strong> — {bogoBeneficiario.email}
              </div>
            )}
            {bogoBeneficiarioError && <div style={{ marginTop: 6, fontSize: 12, color: '#f87171' }}>⚠️ {bogoBeneficiarioError}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setBogoModal(null)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'inherit', fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={confirmBogoAdd} disabled={!bogoBeneficiario}
                style={{ flex: 2, padding: '10px 0', borderRadius: 10, border: 'none', background: bogoBeneficiario ? 'linear-gradient(90deg,#2D4A33,#4E6855,#6B8F72)' : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: bogoBeneficiario ? 'pointer' : 'not-allowed' }}>
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {voidSaleModal && createPortal(
        <div className={`${styles.root} ${styles.modalOverlay} ${styles.open}`}>
          <PosEntityModal
            title="Anular venta"
            ariaLabel="Anular venta"
            onClose={closeVoidSaleModal}
            footer={(
              <>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={closeVoidSaleModal}>
                  No
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={confirmVoidSale}
                  disabled={voidSaleReason.trim().length < 3 || voidSaleMutation.isPending}
                >
                  {voidSaleMutation.isPending ? 'Anulando...' : 'Sí, anular venta'}
                </button>
              </>
            )}
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ color: 'var(--muted)' }}>
                ¿Seguro que deseas anular la venta <strong>{voidSaleModal?.folio}</strong> por {money(voidSaleModal?.totalMxn)}?
                Esto revierte el stock y los créditos que haya generado, y ya no contará en finanzas ni reportes.
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel} htmlFor="void-sale-reason">Motivo (mínimo 3 caracteres)</label>
                <textarea
                  id="void-sale-reason"
                  className={styles.formInput}
                  rows={3}
                  value={voidSaleReason}
                  onChange={(event) => {
                    setVoidSaleReason(event.target.value)
                    if (voidSaleReasonError) setVoidSaleReasonError('')
                  }}
                  placeholder="Ejemplo: Venta capturada por error"
                  autoFocus
                  aria-invalid={Boolean(voidSaleReasonError)}
                  aria-describedby={voidSaleReasonError ? 'void-sale-reason-error' : undefined}
                />
                {voidSaleReasonError && <small id="void-sale-reason-error" style={{ color: '#dc2626' }}>{voidSaleReasonError}</small>}
              </div>
            </div>
          </PosEntityModal>
        </div>,
        document.body
      )}
      </>
    )
  }

  return (
    <>
      <div className={styles.posGrid}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <FilterChips
              options={['Todos', '📦 Paquetes', 'Accesorios', 'Nutrición', 'Equipo', 'Ropa']}
              active={posFilter}
              onChange={setPosFilter}
            />
            {posFilter !== '📦 Paquetes' && (
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ fontSize: 13, padding: '6px 14px' }}
                onClick={() => {
                  setProdModal('nuevo')
                  setProdForm({ nombre: '', categoria: posFilter === 'Todos' ? 'Accesorios' : posFilter, categoryId: '', precio: '', stock: '', emoji: '' })
                }}
                type="button"
              >
                + Agregar producto
              </button>
            )}
          </div>
          <div className={styles.productGrid}>
            {(posFilter === '📦 Paquetes'
              ? paquetes.map((p) => ({
                ...p,
                emoji: p.clases === 0 ? '⭐' : '📦',
                name: `${p.nombre} — ${p.clases === 0 ? 'Ilimitadas' : `${p.clases} clases`}`,
                price: p.precio,
              }))
              : productos.filter((p) => p.activo && (posFilter === 'Todos' || p.categoria === posFilter))
            ).map((p) => {
              const isPaquete = posFilter === '📦 Paquetes'
              const emoji = p.emoji || categoryEmoji(p.categoria)
              const nombre = p.nombre ?? p.name
              const precio = p.precio ?? p.price
              return (
                <div key={p.id ?? p.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    className={styles.productCard}
                    onClick={() => addToCart({ name: nombre, price: precio, emoji })}
                    type="button"
                  >
                    <div className={styles.productEmoji}>{emoji}</div>
                    <div className={styles.productName}>{nombre}</div>
                    <div className={styles.productPrice}>${precio.toLocaleString()}</div>
                  </button>
                  {!isPaquete && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        style={{ flex: 1, fontSize: 11, padding: '3px 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-muted)' }}
                        onClick={() => {
                          setProdForm({ nombre: p.nombre, categoria: p.categoria, categoryId: p.categoryId ?? p.category_id ?? '', precio: String(p.precio), stock: String(p.stock), emoji: p.emoji || '' })
                          setProdModal({ producto: p })
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        style={{ flex: 1, fontSize: 11, padding: '3px 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, cursor: 'pointer', color: '#ef4444' }}
                        onClick={() => setConfirmarEliminarProd(p)}
                      >
                        🗑
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.cartSection}>
          <div className={styles.cartTitle}>🛒 Orden actual</div>
          {pendingAsignacion && (
            <div style={{ margin: '0 0 10px', padding: '10px 12px', background: 'rgba(234,179,8,0.1)', borderRadius: 8, border: '1px solid rgba(234,179,8,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13 }}>🔒</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24', fontFamily: 'var(--font-body)' }}>
                  Paquete pendiente de cobro
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                👤 <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{pendingAsignacion.userName}</strong> recibirá el paquete <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{pendingAsignacion.paqSel.nombre}</strong> al confirmar el cobro.
              </div>
            </div>
          )}
          <div className={styles.cartItems}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontSize: 13 }}>
                Selecciona productos para agregar
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className={styles.cartItem}>
                  <span>{item.emoji} {item.name}</span>
                  <span className={styles.cartItemPrice}>${item.price.toLocaleString()}</span>
                  <button className={styles.cartRemoveBtn} onClick={() => removeFromCart(idx)} type="button">×</button>
                </div>
              ))
            )}
          </div>
          <div className={styles.cartTotal}>
            <div className={styles.cartTotalRow}><span>Subtotal</span><span>${cartSubtotal.toLocaleString()}</span></div>
            <div className={styles.cartTotalMain}><span>Total a cobrar</span><span>${cartTotal.toLocaleString()}</span></div>
          </div>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ width: '100%', justifyContent: 'center', padding: 12 }}
            onClick={handleCobrar}
            type="button"
          >
            💳 Cobrar
          </button>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            style={{ width: '100%', justifyContent: 'center', padding: 10, marginTop: 8 }}
            onClick={clearCart}
            type="button"
          >
            Limpiar orden
          </button>
        </div>
      </div>

    </>
  )
}
