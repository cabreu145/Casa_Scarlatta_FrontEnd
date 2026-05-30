export function resolveFinancialUiState({
  useApiFinancialState,
  financialState,
  activeMembership,
  creditsBalance,
  isFinancialStateLoading,
  financialStateError,
  usuario,
}) {
  if (!useApiFinancialState) {
    const mockCredits = usuario?.clasesPaquete === 999 ? '∞' : (usuario?.clasesPaquete ?? 0)
    const mockTotal = usuario?.clasesPaqueteTotal ?? 0
    const mockUsed = usuario?.clasesPaquete === 999 ? 0 : (mockTotal - (usuario?.clasesPaquete ?? 0))
    return {
      status: 'ready',
      isLoading: false,
      planNombre: usuario?.paquete ?? 'Sin plan',
      clasesRestantes: mockCredits,
      clasesTotal: mockTotal,
      clasesUsadas: mockUsed,
      canShowProgress: mockCredits !== '∞' && mockTotal > 0,
    }
  }

  const hasLoadedFinancialState = Boolean(financialState)
  const isLoading = Boolean(isFinancialStateLoading) && !hasLoadedFinancialState

  if (isLoading) {
    return {
      status: 'loading',
      isLoading: true,
      planNombre: 'Cargando...',
      clasesRestantes: '--',
      clasesTotal: 0,
      clasesUsadas: 0,
      canShowProgress: false,
    }
  }

  if (financialStateError && !hasLoadedFinancialState) {
    return {
      status: 'error',
      isLoading: false,
      planNombre: 'Estado no disponible',
      clasesRestantes: '--',
      clasesTotal: 0,
      clasesUsadas: 0,
      canShowProgress: false,
    }
  }

  if (!activeMembership) {
    return {
      status: 'no_membership',
      isLoading: false,
      planNombre: 'Sin plan',
      clasesRestantes: creditsBalance ?? 0,
      clasesTotal: 0,
      clasesUsadas: 0,
      canShowProgress: false,
    }
  }

  const resolvedRestantes = activeMembership.creditsAvailable ?? creditsBalance ?? 0
  const resolvedTotal = activeMembership.creditsTotal ?? 0
  const resolvedUsadas = activeMembership.creditsUsed ?? 0

  return {
    status: 'ready',
    isLoading: false,
    planNombre: activeMembership.packageName ?? 'Sin plan',
    clasesRestantes: resolvedRestantes,
    clasesTotal: resolvedTotal,
    clasesUsadas: resolvedUsadas,
    canShowProgress: resolvedTotal > 0,
  }
}
