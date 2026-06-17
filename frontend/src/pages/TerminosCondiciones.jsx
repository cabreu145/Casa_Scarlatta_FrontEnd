export default function TerminosCondiciones() {
  return (
    <main className="min-h-screen bg-[#0D0608] py-20 px-6">
      <div className="mx-auto max-w-3xl">
        <h1
          className="mb-4 font-serif text-4xl text-[#F5EDE8]"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Términos y condiciones
        </h1>
        <p
          className="mb-12 text-sm text-[#A08878]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Última actualización: junio 2026
        </p>

        <div
          className="space-y-10 text-[#C9B8B0]"
          style={{ fontFamily: 'var(--font-body)', lineHeight: 1.8, fontSize: 15 }}
        >
          <Section titulo="1. Aceptación de los términos">
            Al acceder y utilizar los servicios de Casa Scarlatta, incluyendo la reserva de clases,
            adquisición de paquetes y uso de la plataforma en línea, aceptas quedar sujeto a estos
            términos y condiciones. Si no estás de acuerdo con alguno de ellos, te pedimos no utilizar
            nuestros servicios.
          </Section>

          <Section titulo="2. Reservas y cancelaciones">
            Las reservas de clases pueden cancelarse sin costo hasta <strong className="text-[#F5EDE8]">6 horas antes</strong> del
            inicio de la clase. Pasado ese tiempo, la clase se contabilizará como utilizada y el
            crédito correspondiente no será reembolsable. Casa Scarlatta se reserva el derecho de
            cancelar o reprogramar clases por causas de fuerza mayor, en cuyo caso se restablecerá
            el crédito al usuario.
          </Section>

          <Section titulo="3. Paquetes y créditos">
            Los paquetes adquiridos tienen una vigencia determinada según el plan elegido. Los créditos
            no utilizados dentro del periodo de vigencia no se acumulan ni se transfieren a periodos
            posteriores, salvo acuerdo escrito con Casa Scarlatta. Los paquetes son personales e
            intransferibles, excepto los paquetes compartibles bajo las condiciones específicas de
            cada plan.
          </Section>

          <Section titulo="4. Pagos">
            Todos los pagos realizados a través de la plataforma son procesados de forma segura.
            Casa Scarlatta no almacena datos de tarjetas de crédito o débito. Una vez confirmado
            el pago, no se realizarán reembolsos, salvo en casos excepcionales evaluados por el
            equipo administrativo.
          </Section>

          <Section titulo="5. Conducta en las instalaciones">
            Los usuarios se comprometen a mantener un comportamiento respetuoso hacia el personal,
            coaches y demás asistentes. Casa Scarlatta se reserva el derecho de suspender o cancelar
            la membresía de cualquier usuario que incumpla estas normas de convivencia.
          </Section>

          <Section titulo="6. Privacidad">
            La información personal recopilada en la plataforma es utilizada exclusivamente para la
            gestión de reservas, paquetes y comunicaciones relacionadas con los servicios de Casa
            Scarlatta. No compartimos ni vendemos datos personales a terceros.
          </Section>

          <Section titulo="7. Modificaciones">
            Casa Scarlatta se reserva el derecho de actualizar estos términos en cualquier momento.
            Las modificaciones entrarán en vigor a partir de su publicación en esta página. El uso
            continuado del servicio después de dichas modificaciones implica la aceptación de los
            nuevos términos.
          </Section>

          <Section titulo="8. Contacto">
            Si tienes dudas o comentarios sobre estos términos, puedes contactarnos a través de
            nuestro formulario de contacto o escribirnos directamente a nuestras instalaciones.
          </Section>
        </div>
      </div>
    </main>
  )
}

function Section({ titulo, children }) {
  return (
    <section>
      <h2
        className="mb-3 text-lg font-semibold text-[#E8A4AD]"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {titulo}
      </h2>
      <p>{children}</p>
    </section>
  )
}
