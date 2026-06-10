import { useMemo, useState } from 'react'
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
} from '@/hooks/useApiQueries'

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
  const [buyerSearch, setBuyerSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
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

  const posProductsQuery = usePosProductsQuery({
    page: 1,
    pageSize: 100,
    search: productSearch,
    status: productStatus === 'all' ? undefined : productStatus,
    enabled: useApiMode && isActive,
  })
  const productCategoriesQuery = useProductCategoriesQuery({
    page: 1,
    pageSize: 100,
    search: categorySearch,
    status: categoryStatus === 'all' ? undefined : categoryStatus,
    enabled: useApiMode && isActive,
  })
  const membershipPackagesQuery = useMembershipPackagesQuery({
    enabled: useApiMode && isActive,
  })
  const buyerClientsQuery = useAdminClientsQuery({
    page: 1,
    pageSize: 20,
    search: buyerSearch,
    status: 'active',
    enabled: useApiMode && isActive,
  })
  const posSalesQuery = usePosSalesQuery({
    page: 1,
    pageSize: 8,
    enabled: useApiMode && isActive,
  })
  const createSaleMutation = useCreatePosSaleMutation()
  const createCategoryMutation = useCreateProductCategoryMutation()
  const updateCategoryMutation = useUpdateProductCategoryMutation()
  const updateCategoryStatusMutation = useUpdateProductCategoryStatusMutation()
  const deleteCategoryMutation = useDeleteProductCategoryMutation()

  const apiProducts = posProductsQuery.data?.items ?? []
  const apiCategories = productCategoriesQuery.data?.items ?? []
  const apiPackages = membershipPackagesQuery.data ?? []
  const buyerClients = buyerClientsQuery.data?.items ?? []
  const recentSales = posSalesQuery.data?.items ?? []

  const selectedCustomer = useMemo(() => {
    if (!useApiMode) return null
    return buyerClients.find((client) => String(client.id) === String(selectedCustomerId)) ?? null
  }, [buyerClients, selectedCustomerId, useApiMode])

  const cartTotalComputed = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.quantity ?? 1) * Number(item.unitPriceMxn ?? item.price ?? 0), 0),
    [cart]
  )
  const subtotalToShow = useApiMode ? cartTotalComputed : cartSubtotal
  const ivaToShow = useApiMode ? Math.round(cartTotalComputed * 0.16 * 100) / 100 : cartIva
  const totalToShow = useApiMode ? Math.round((cartTotalComputed + (Math.round(cartTotalComputed * 0.16 * 100) / 100)) * 100) / 100 : cartTotal

  const categoryOptions = useMemo(() => {
    if (!useApiMode) {
      return ['Todos', '📦 Paquetes', 'Accesorios', 'Nutrici?n', 'Equipo', 'Ropa']
    }
    const categories = apiCategories.map((item) => item.name ?? item.nombre).filter(Boolean)
    return ['Todos', '📦 Paquetes', ...categories]
  }, [apiCategories, useApiMode])
  const visibleItems = useMemo(() => {
    if (!useApiMode) return []
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
  }, [apiPackages, apiProducts, posFilter, productSearch, useApiMode])

  function addProductToCart(item) {
    if (!useApiMode) {
      addToCart?.(item)
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
    const payload = item.kind === 'package'
      ? {
          type: 'package',
          id: item.item.id,
          name: getPackageDisplayName(item.item),
          quantity: 1,
          unitPriceMxn: Number(item.item.priceMxn ?? item.item.price_mxn ?? item.item.precio ?? 0),
          beneficiariesText: '',
          packageId: item.item.id,
          isShareable: Boolean(item.item.isShareable),
          maxBeneficiaries: Number(item.item.maxBeneficiaries ?? 0),
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

  async function submitSale() {
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
        MAX_BENEFICIARIES_EXCEEDED: 'Se excedió número máximo de beneficiarios.',
        CUSTOMER_REQUIRED_FOR_PACKAGE: 'Selecciona cliente para vender paquete.',
        VALIDATION_ERROR: raw || 'No pudimos completar la venta.',
      }
      toast.error(messageByCode[code] || raw || 'No pudimos completar la venta.')
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
                  <button
                    className={`${styles.btn} ${styles.btnGhost}`}
                    type="button"
                    onClick={openProductModal}
                    disabled={!apiCategories.length}
                  >
                    Nuevo producto
                  </button>
                  <button className={`${styles.btn} ${styles.btnPrimary}`} type="button" onClick={() => openCategoryModal()}>
                    Nueva categoría
                  </button>
                </div>
              </div>
              {!apiCategories.length && (
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
                {apiCategories.map((category) => (
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
                      <button type="button" className={styles.btn} onClick={() => openCategoryModal(category)}>Editar</button>
                      <button type="button" className={styles.btn} onClick={() => toggleCategoryStatus(category)}>
                        {category.isActive ? 'Inactivar' : 'Activar'}
                      </button>
                      <button type="button" className={styles.btn} onClick={() => removeCategory(category)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                {!apiCategories.length && !productCategoriesQuery.isLoading && (
                  <div style={{ color: 'var(--muted)' }}>Sin categorías para mostrar.</div>
                )}
              </div>
            </div>

            <div className={styles.productGrid}>
              {visibleItems.map(({ kind, item }) => {
                const isPackage = kind === 'package'
                const name = isPackage ? getPackageDisplayName(item) : item.name
                const price = isPackage ? Number(item.priceMxn ?? item.price_mxn ?? item.precio ?? 0) : Number(item.priceMxn ?? item.price_mxn ?? item.precio ?? 0)
                const categoryLabel = getCategoryName(item)
                const emoji = isPackage ? (item.isFeatured ? '⭐' : '📦') : categoryEmoji(categoryLabel)
                const isInactive = !isPackage && item.isActive === false
                const isOutOfStock = !isPackage && Number(item.stock ?? 0) <= 0
                return (
                  <div key={`${kind}-${item.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button
                      className={styles.productCard}
                      onClick={() => addProductToCart({ kind, item, isActive: item.isActive, stock: item.stock })}
                      disabled={isInactive || isOutOfStock}
                      type="button"
                    >
                      <div className={styles.productEmoji}>{emoji}</div>
                      <div className={styles.productName}>{name}</div>
                      <div className={styles.productPrice}>{money(price)}</div>
                      {isPackage ? (
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                          <div>{formatPackageCreditsLabel(item)}</div>
                          <div>{formatPackageValidityLabel(item)}</div>
                          <div>{formatPackageShareabilityLabel(item) || 'No compartible'}</div>
                        </div>
                      ) : (
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                          <div>Categoría: {categoryLabel}</div>
                          <div>Stock: {item.stock}</div>
                          <div>{item.description || 'Sin descripción'}</div>
                        </div>
                      )}
                    </button>
                    {!isPackage && (
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
                  No hay items para estos filtros.
                </div>
              )}
            </div>

            {canUseApiCatalog && posSalesQuery.data?.items?.length > 0 && (
              <div className={styles.card} style={{ marginTop: 20 }}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>Ventas recientes</div>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}></span>
                </div>
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Folio</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Método</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.map((sale) => (
                        <tr key={sale.id}>
                          <td>{sale.folio}</td>
                          <td>{sale.customerName || sale.customerEmail || 'Venta mostrador'}</td>
                          <td>{formatDateTime(sale.createdAt)}</td>
                          <td>{translatePaymentMethod(sale.paymentMethod)}</td>
                          <td>{money(sale.totalMxn)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
              <input
                className={styles.searchInput}
                placeholder="Buscar cliente..."
                value={buyerSearch}
                onChange={(event) => setBuyerSearch(event.target.value)}
                style={{ maxWidth: '100%', marginBottom: 8 }}
              />
              <select
                className={styles.formSelect}
                value={selectedCustomerId}
                onChange={(event) => setSelectedCustomerId(event.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">Selecciona cliente</option>
                {selectedCustomerId && !selectedCustomer && (
                  <option value={selectedCustomerId}>Cliente seleccionado</option>
                )}
                {buyerClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name ?? client.nombre ?? client.email}
                  </option>
                ))}
              </select>
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

                      {isPackage && (
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
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <div className={styles.cartTotal}>
              <div className={styles.cartTotalRow}><span>Subtotal</span><span>{money(subtotalToShow)}</span></div>
              {!useApiMode && <div className={styles.cartTotalRow}><span>IVA (16%)</span><span>{money(ivaToShow)}</span></div>}
              <div className={styles.cartTotalMain}><span>Total</span><span>{money(totalToShow)}</span></div>
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
              disabled={useApiMode && createSaleMutation.isPending}
              type="button"
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
            className={`${styles.modalOverlay} ${styles.open}`}
            onClick={(event) => {
              if (event.target === event.currentTarget) setCategoryModal(null)
            }}
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
        )}      </>
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
            <div className={styles.cartTotalRow}><span>IVA (16%)</span><span>${cartIva.toLocaleString()}</span></div>
            <div className={styles.cartTotalMain}><span>Total</span><span>${cartTotal.toLocaleString()}</span></div>
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
