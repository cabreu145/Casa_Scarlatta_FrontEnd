import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import BrandBlob from '@/components/ui/BrandBlob'
import SectionHeader from '@/components/ui/SectionHeader'
import styles from './Contacto.module.css'

const schema = z.object({
  nombre: z.string().min(2, 'Ingresa tu nombre'),
  email: z.string().email('Correo inválido'),
  telefono: z.string().optional(),
  mensaje: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
})

export default function Contacto() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    await new Promise(r => setTimeout(r, 1000))
    toast.success('¡Mensaje enviado! Te contactaremos pronto.')
    reset()
  }

  return (
    <main className={styles.page}>
      <BrandBlob className={styles.blob} width={450} height={450} opacity={0.22} />
      <div className={styles.inner}>
        <div className={styles.info}>
          <SectionHeader
            label="Contacto"
            title="Hablemos"
            subtitle="Estamos aquí para responder tus preguntas y ayudarte a encontrar la clase perfecta."
            size="lg"
          />

          <div className={styles.divider} />

          {[
            { icon: <MapPin size={18} />, label: 'Ubicación', value: 'Colonia Polanco, Ciudad de México' },
            { icon: <Phone size={18} />, label: 'Teléfono', value: <a href="tel:+525512345678">+52 55 1234 5678</a> },
            { icon: <Mail size={18} />, label: 'Correo', value: <a href="mailto:hola@casascarlatta.com">hola@casascarlatta.com</a> },
            {
              icon: <Clock size={18} />, label: 'Horarios', value: (
                <>Lun–Vie: 6:00–21:00<br />Sáb: 7:00–18:00<br />Dom: 8:00–14:00</>
              )
            },
          ].map(({ icon, label, value }) => (
            <div key={label} className={styles.infoItem}>
              <span className={styles.infoLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {icon} {label}
              </span>
              <span className={styles.infoValue}>{value}</span>
            </div>
          ))}
        </div>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <h2 className={styles.formTitle}>Envíanos un mensaje</h2>

          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="nombre">Nombre *</label>
              <input id="nombre" placeholder="Tu nombre" {...register('nombre')} />
              {errors.nombre && <span className={styles.error}>{errors.nombre.message}</span>}
            </div>
            <div className={styles.field}>
              <label htmlFor="email">Correo *</label>
              <input id="email" type="email" placeholder="tu@correo.com" {...register('email')} />
              {errors.email && <span className={styles.error}>{errors.email.message}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="telefono">Teléfono</label>
            <input id="telefono" placeholder="+52 55 0000 0000" {...register('telefono')} />
          </div>

          <div className={styles.field}>
            <label htmlFor="mensaje">Mensaje *</label>
            <textarea
              id="mensaje"
              rows={5}
              placeholder="¿En qué podemos ayudarte?"
              {...register('mensaje')}
            />
            {errors.mensaje && <span className={styles.error}>{errors.mensaje.message}</span>}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
          </button>
        </form>
      </div>
    </main>
  )
}
