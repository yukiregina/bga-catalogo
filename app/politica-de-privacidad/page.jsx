import Link from 'next/link'
import config from '@/client.config.js'

export function generateMetadata() {
  return {
    title: 'Política de Privacidad | BGA Electric',
    description: 'Qué datos recoge el sitio de BGA Electric, para qué se usan, con quién se comparten y cómo pedir acceso, corrección o eliminación.',
    alternates: { canonical: '/politica-de-privacidad/' },
  }
}

export default function PoliticaDePrivacidadPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[1180px] mx-auto px-6 py-8">

        <div className="text-xs text-text-muted mb-4">
          <Link href="/" className="hover:underline">Inicio</Link>
          <span className="mx-1">›</span>
          <span className="text-text-primary">Política de Privacidad</span>
        </div>

        <h1 className="font-brand text-3xl font-bold text-brand-primary mb-3">Política de Privacidad</h1>

        <div className="max-w-3xl">
          <p className="text-sm text-text-secondary mb-8 leading-relaxed">
            Última actualización: 31 de agosto de 2026
          </p>

          <section className="mb-10">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-3">1. Quién es responsable de tus datos</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              {config.brand.name} S.A. — RUC [CONFIRMAR CON EL CLIENTE] —, con domicilio en {config.brand.address}.
              Para cualquier tema de datos personales: <a href={`mailto:${config.contact.email}`} className="underline hover:text-brand-primary">{config.contact.email}</a> o
              WhatsApp {config.contact.phone}.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-3">2. Qué datos recogemos y cuándo</h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-3">
              Este sitio no pide registro ni crea cuentas de usuario. Recogemos datos en tres momentos:
            </p>
            <p className="text-sm text-text-secondary leading-relaxed mb-3">
              Cuando pedís una cotización: lo que escribís en el formulario — nombre o empresa, RUC y rubro —
              junto con la lista de productos, las cantidades y las observaciones que hayas cargado.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed mb-3">
              Cuando seguís por WhatsApp: al abrirse la conversación vemos tu número de teléfono y el nombre de
              tu perfil, como en cualquier mensaje de WhatsApp.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed mb-3">
              Mientras navegás: datos de uso del sitio a través de Google Analytics — páginas vistas, tipo de
              dispositivo, ciudad aproximada y desde dónde llegaste. Google procesa tu dirección IP para eso;
              nosotros no la vemos junto a tu nombre.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              La lista de productos que vas armando se guarda en tu propio navegador y no sale de tu equipo
              hasta que apretás enviar. Si limpiás los datos del navegador, se borra.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-3">3. Para qué los usamos</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Para preparar y responder tu cotización, y para contactarte por ese pedido. También para entender
              qué productos se consultan más y mejorar el catálogo. No vendemos ni cedemos tus datos, y no
              usamos este formulario para enviarte publicidad masiva.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-3">4. Con quién se comparten</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Solo con los proveedores que hacen funcionar el sitio: Google — Sheets, donde queda registrado el
              pedido en una cuenta de {config.brand.name}, y Analytics, para la medición —, Meta (WhatsApp) si
              elegís seguir la conversación por ahí, y Amazon Web Services, donde está alojado el sitio. Cada
              uno trata los datos según sus propias políticas.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-3">5. Cuánto tiempo los guardamos</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Los pedidos de cotización quedan registrados mientras dure la relación comercial y por
              [CONFIRMAR: 5 años] más, por razones contables y de historial de obra. Podés pedirnos que los
              borremos antes.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-3">6. Tus derechos</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Podés pedirnos acceder a tus datos, corregirlos, eliminarlos, oponerte a su uso o pedir una copia.
              Escribí a <a href={`mailto:${config.contact.email}`} className="underline hover:text-brand-primary">{config.contact.email}</a> con
              el asunto "Datos personales". Respondemos dentro de los 30 días.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-3">7. Cookies y medición</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Usamos Google Analytics 4, que instala cookies para contar visitas y entender el recorrido por el
              catálogo. No usamos cookies de publicidad ni de remarketing. Podés bloquearlas desde la
              configuración de tu navegador o con el complemento de inhabilitación de Google Analytics: el
              catálogo sigue funcionando igual.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-3">8. Seguridad</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              El sitio se sirve por conexión cifrada (HTTPS). El registro de cotizaciones está en una cuenta de
              Google de {config.brand.name}, con acceso limitado al equipo comercial.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-3">9. Menores de edad</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Este es un sitio de venta entre empresas. No está dirigido a menores de edad ni recogemos sus
              datos de forma intencional.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-3">10. Cambios en esta política</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Si cambiamos algo, actualizamos la fecha del encabezado.
            </p>
          </section>

          <p className="text-sm text-text-secondary leading-relaxed">
            Esta política sigue los principios de la Ley N° 7593/2025 de Protección de Datos Personales del Paraguay.
          </p>
        </div>

      </div>
    </div>
  )
}
