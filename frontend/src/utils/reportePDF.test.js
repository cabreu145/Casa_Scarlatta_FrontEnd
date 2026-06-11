import { describe, expect, test } from 'vitest'
import { calcularStats, construirFilasTabla } from './reportePDF'

const FINANCE_ROWS_1500_MERCADO_PAGO = [
  { Concepto: 'Ingresos totales', Monto: 1500, Detalle: 'POS + Mercado Pago' },
  { Concepto: 'Gastos totales', Monto: -0, Detalle: 'Cortes 0' },
  { Concepto: 'Utilidad neta', Monto: 1500, Detalle: 'Rango Mes actual' },
  { Concepto: 'Ticket promedio', Monto: 1500, Detalle: 'Promedio operativo' },
  { Concepto: 'Efectivo', Monto: 0, Detalle: 'Método de pago' },
  { Concepto: 'Tarjeta', Monto: 0, Detalle: 'Método de pago' },
  { Concepto: 'Transferencia', Monto: 0, Detalle: 'Método de pago' },
  { Concepto: 'Mercado Pago', Monto: 1500, Detalle: 'Método de pago' },
]

describe('reportePDF financiero', () => {
  test('no suma ticket promedio ni métodos de pago como ingresos', () => {
    const stats = calcularStats('financiero', FINANCE_ROWS_1500_MERCADO_PAGO)

    expect(stats).toHaveLength(4)
    expect(stats[0]).toMatchObject({ valor: '8', etiqueta: 'Conceptos del reporte' })
    expect(stats[1]).toMatchObject({ valor: '$1,500', etiqueta: 'Ingresos' })
    expect(stats[2]).toMatchObject({ valor: '$0', etiqueta: 'Gastos' })
    expect(stats[3]).toMatchObject({ valor: '$1,500', etiqueta: 'Utilidad' })
  })

  test('bloque final INGRESOS/GASTOS/UTILIDAD usa los totales explícitos, no la suma de filas', () => {
    const html = construirFilasTabla(FINANCE_ROWS_1500_MERCADO_PAGO, 'financiero')

    expect(html).toContain('<td>INGRESOS</td>')
    expect(html).toMatch(/INGRESOS<\/td>(?:<td><\/td>)*<td>\$1,500<\/td>/)
    expect(html).toMatch(/GASTOS<\/td>(?:<td><\/td>)*<td style="color:#B91C1C;">−\$0<\/td>/)
    expect(html).toMatch(/UTILIDAD<\/td>(?:<td><\/td>)*<td>\$1,500<\/td>/)

    expect(html).not.toContain('$6,000')
  })

  test('Ticket promedio y Mercado Pago no se suman dos veces a INGRESOS', () => {
    const html = construirFilasTabla(FINANCE_ROWS_1500_MERCADO_PAGO, 'financiero')
    const ingresosMatch = html.match(/INGRESOS<\/td>(?:<td><\/td>)*<td>\$([\d,]+)<\/td>/)

    expect(ingresosMatch).not.toBeNull()
    expect(ingresosMatch[1]).toBe('1,500')
  })
})
