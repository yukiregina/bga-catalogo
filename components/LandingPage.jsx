'use client'

// Landing page ported from reference-lp/index.html, keeping its design and copy.
// The only structural change: the old "Catálogo" section (PDF download cards)
// is replaced by <ProductFinder /> — see that component for the new behavior.
// Header (logo, nav, cart) lives in components/Header.jsx, mounted once in
// app/layout.jsx — shared shell across home and catalog routes.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import config from '@/client.config.js'
import ProductFinder from './ProductFinder'
import WhatsappIcon from './WhatsappIcon'
import styles from '@/app/landing.module.css'

const WHATSAPP_NUMBER = config.contact.whatsapp.replace(/[^\d]/g, '')

function waLink(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

export default function LandingPage() {
  const [waFloatHidden, setWaFloatHidden] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [attachedFileName, setAttachedFileName] = useState('')
  const formWrapperRef = useRef(null)

  useEffect(() => {
    const el = formWrapperRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => setWaFloatHidden(entries[0].isIntersecting),
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function handleFileChange(e) {
    setAttachedFileName(e.target.files?.[0]?.name ?? '')
  }

  function handleContactSubmit(e) {
    e.preventDefault()
    const form = e.target
    const nombre = form.nombre.value.trim()
    const empresa = form.empresa.value.trim()
    const sector = form.sector.value
    const mensaje = form.mensaje.value.trim()

    const params = { nombre, empresa, sector, mensaje }
    if (config.data.leadWebhookUrl) {
      const search = new URLSearchParams(params)
      if (config.data.leadWebhookSecret) search.set('key', config.data.leadWebhookSecret)
      fetch(`${config.data.leadWebhookUrl}?${search}`, { method: 'GET', mode: 'no-cors' }).catch(() => {})
    }

    // WhatsApp's wa.me links only support pre-filled text — there's no way to push
    // a file into the chat automatically, so we just flag it in the message and
    // rely on the on-screen reminder telling the user to attach it themselves.
    const adjunto = attachedFileName ? `\n\n📎 Adjunto: ${attachedFileName} (lo adjunto acá mismo en el chat)` : ''
    const texto = `Hola, soy ${nombre} de ${empresa}.\nSector: ${sector}.\n\n${mensaje}${adjunto}\n\n(Mensaje enviado desde la web de ${config.brand.name})`

    setSubmitting(true)
    window.open(waLink(texto), '_blank', 'noopener,noreferrer')
    setTimeout(() => setSubmitting(false), 3000)
  }

  return (
    <div className={styles.landing}>

      <main>

        {/* HERO */}
        <section className={styles.hero} aria-label="Portada">
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div>
                <div className={styles.heroEyebrow}>
                  <svg viewBox="0 0 256 256" width="16" height="16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" aria-hidden="true"><line x1="80" y1="176" x2="108" y2="176"/><line x1="148" y1="176" x2="176" y2="176"/><polyline points="216 136 168 136 104 88 104 136 40 88 40 216"/><line x1="24" y1="216" x2="232" y2="216"/><path d="M153.55,125.16,167,30.87A8,8,0,0,1,174.94,24h18.12A8,8,0,0,1,201,30.87L216,136v80"/></svg>
                  <span>Fabricado en Paraguay</span>
                </div>
                <h1>Bandejas portacables y tableros eléctricos. <span className={styles.accent}>Con norma internacional.</span></h1>
                <p className={styles.heroSub}>Soluciones integrales para canalización eléctrica industrial. Fabricamos en Paraguay, atendemos al Mercosur. Especificación técnica clara y entrega que respeta plazos de obra.</p>
                <div className={styles.heroCtas}>
                  <a href="#contacto" className={styles.btnWaLarge}>
                    <WhatsappIcon size={20} />
                    <span>Solicitar cotización por WhatsApp</span>
                  </a>
                  <a href="#productos" className={styles.btnSecondaryLink}>Ver productos</a>
                </div>
                <p className={styles.heroDirect}>¿Tenés apuro? Escribínos directo: <a href={waLink(`Hola! Vi la web de ${config.brand.name} y quiero cotizar bandejas portacables.`)} target="_blank" rel="noopener noreferrer">{config.contact.phone}</a></p>
                <div className={styles.heroTrust}>
                  <div className={styles.trustItem}>
                    <b style={{ display: 'inline' }}>Mercosur</b> <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--gray-500)' }}>cobertura regional</span>
                  </div>
                  <div className={styles.normBadges}>
                    <span className={styles.normBadge}>NBR IEC 61537</span>
                    <span className={styles.normBadge}>NBR 7098</span>
                    <span className={styles.normBadge}>NBR 6323</span>
                    <span className={styles.normBadge}>Sistema CLINCH Top-L-Loc</span>
                  </div>
                </div>
              </div>
              <div aria-hidden="true"></div>
            </div>
          </div>
        </section>

        {/* CLIENTS STRIP */}
        <section className={styles.clientsStrip} aria-label="Empresas que confían en BGA">
          <div className={styles.container}>
            <div className={styles.clientsStripInner}>
              <span className={styles.clientsStripLabel}>Confían en BGA</span>
              <div className={styles.clientLogo}><img src="/clients/logo-electrosystem-distribuidor-bga-paraguay.png" alt="Electro System" loading="lazy" height="50" /></div>
              <div className={styles.clientLogo}><img src="/clients/logo-epesa-distribuidor-bga-paraguay.webp" alt="EPESA" loading="lazy" height="50" /></div>
              <div className={styles.clientLogo}><img src="/clients/logo-brasguay-distribuidor-bga-paraguay.webp" alt="Brasguay" loading="lazy" height="50" /></div>
              <div className={styles.clientLogo}><img src="/clients/logo-construlogica-cliente-bga-paraguay.png" alt="Construlógica" loading="lazy" height="50" /></div>
              <div className={styles.clientLogo}><img src="/clients/logo-tape-distribuidor-bga-paraguay.png" alt="Tapé" loading="lazy" height="50" /></div>
            </div>
          </div>
        </section>

        {/* PRODUCTS → PRODUCT FINDER */}
        <section id="productos" aria-labelledby="productos-title">
          <div className={styles.container}>
            <div className={styles.sectionEyebrow}>
              <svg viewBox="0 0 256 256" width="16" height="16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" aria-hidden="true"><rect x="32" y="48" width="192" height="160" rx="8"/><line x1="80" y1="96" x2="176" y2="96"/><line x1="80" y1="128" x2="176" y2="128"/><line x1="80" y1="160" x2="176" y2="160"/></svg>
              <span style={{ color: 'var(--ocean)' }}>Catálogo</span>
            </div>
            <h2 id="productos-title" className={styles.sectionTitle}>{config.catalog.title}</h2>
            <p className={styles.sectionLead}>{config.brand.tagline} Buscá el producto que necesitás o entrá directo por familia.</p>
            <ProductFinder />
          </div>
        </section>

        {/* SECTORS */}
        <section id="sectores" className={styles.sectorsSection} aria-labelledby="sectores-title">
          <div className={styles.container}>
            <div className={styles.sectionEyebrow}>
              <svg viewBox="0 0 256 256" width="16" height="16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" aria-hidden="true"><circle cx="128" cy="128" r="96"/><polygon points="176 80 112 112 80 176 144 144 176 80"/></svg>
              Aplicaciones
            </div>
            <h2 id="sectores-title" className={styles.sectionTitle}>Sectores que atendemos</h2>
            <p className={styles.sectionLead}>Productos fabricados para responder a la exigencia técnica y de plazo de cada sector.</p>
            <div className={styles.sectorsGrid}>
              <div className={styles.sectorTile}>
                <div className={styles.sectorIcon}><svg viewBox="0 0 256 256" width="32" height="32" fill="currentColor" aria-hidden="true"><path d="M215.79,118.17a8,8,0,0,0-5-5.66L153.18,90.9l14.66-73.33a8,8,0,0,0-13.69-7l-112,120a8,8,0,0,0,3,13l57.63,21.61L88.16,238.43a8,8,0,0,0,13.69,7l112-120A8,8,0,0,0,215.79,118.17ZM109.37,214l10.47-52.38a8,8,0,0,0-5-9.06L62,132.71l84.62-90.66L136.16,94.43a8,8,0,0,0,5,9.06l52.8,19.8Z"/></svg></div>
                <h4>Energía</h4>
              </div>
              <div className={styles.sectorTile}>
                <div className={styles.sectorIcon}><svg viewBox="0 0 256 256" width="32" height="32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" aria-hidden="true"><polyline points="56 232 128 88 200 232"/><path d="M88.64,95.17a40,40,0,1,1,78.72,0"/><path d="M70.53,131.38a72,72,0,1,1,114.94,0"/><line x1="72" y1="200" x2="184" y2="200"/><line x1="88" y1="168" x2="168" y2="168"/></svg></div>
                <h4>Telecomunicaciones</h4>
              </div>
              <div className={styles.sectorTile}>
                <div className={styles.sectorIcon}><svg viewBox="0 0 256 256" width="32" height="32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" aria-hidden="true"><line x1="64" y1="56" x2="64" y2="200"/><line x1="192" y1="56" x2="192" y2="200"/><path d="M24,115.35A64,64,0,0,0,64,56a64,64,0,0,0,128,0,64,64,0,0,0,40,59.35"/><line x1="152" y1="115.35" x2="152" y2="168"/><line x1="104" y1="115.35" x2="104" y2="168"/><line x1="24" y1="168" x2="232" y2="168"/></svg></div>
                <h4>Infraestructura</h4>
              </div>
              <div className={styles.sectorTile}>
                <div className={styles.sectorIcon}><svg viewBox="0 0 256 256" width="32" height="32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" aria-hidden="true"><line x1="80" y1="176" x2="108" y2="176"/><line x1="148" y1="176" x2="176" y2="176"/><polyline points="216 136 168 136 104 88 104 136 40 88 40 216"/><line x1="24" y1="216" x2="232" y2="216"/><path d="M153.55,125.16,167,30.87A8,8,0,0,1,174.94,24h18.12A8,8,0,0,1,201,30.87L216,136v80"/></svg></div>
                <h4>Industria</h4>
              </div>
              <div className={styles.sectorTile}>
                <div className={styles.sectorIcon}><svg viewBox="0 0 256 256" width="32" height="32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" aria-hidden="true"><rect x="24" y="160" width="208" height="40" rx="8"/><path d="M104,160V40a8,8,0,0,1,8-8h32a8,8,0,0,1,8,8V160"/><path d="M216,160V136a88,88,0,0,0-64-84.69"/><path d="M40,160V136a88,88,0,0,1,64-84.69"/></svg></div>
                <h4>Construcción</h4>
              </div>
              <div className={styles.sectorTile}>
                <div className={styles.sectorIcon}><svg viewBox="0 0 256 256" width="32" height="32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" aria-hidden="true"><circle cx="212" cy="188" r="28"/><circle cx="68" cy="172" r="44"/><circle cx="68" cy="172" r="12" fill="currentColor"/><path d="M232,168V134a8,8,0,0,0-5.7-7.66L144,104V48H56V96"/><line x1="40" y1="48" x2="56" y2="48"/><line x1="144" y1="48" x2="160" y2="48"/><path d="M40,96H68a76,76,0,0,1,76,76v12h40.28"/><line x1="144" y1="104" x2="144" y2="184"/><line x1="184" y1="114.83" x2="184" y2="72"/></svg></div>
                <h4>Agroindustria</h4>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES / WHY BGA */}
        <section id="nosotros" aria-labelledby="nosotros-title">
          <div className={styles.container}>
            <div className={styles.sectionEyebrow}>
              <span aria-hidden="true">✓</span>
              <span style={{ color: 'var(--ocean)' }}>Por qué BGA</span>
            </div>
            <h2 id="nosotros-title" className={styles.sectionTitle}>Excelencia, responsabilidad y parceria</h2>
            <p className={styles.sectionLead}>Tres compromisos que guían cómo fabricamos y cómo atendemos.</p>
            <div className={styles.featuresGrid}>
              <div className={styles.feature}>
                <div className={styles.featureNum}>01 · Excelencia</div>
                <h3>Norma antes que adjetivo</h3>
                <p>Acero galvanizado en caliente, unión CLINCH sin soldadura, normas NBR e IEC aplicadas. La calidad se prueba con dato técnico, no con afirmación.</p>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureNum}>02 · Responsabilidad</div>
                <h3>Compromiso con el entorno</h3>
                <p>Fabricamos localmente con cadena productiva paraguaya. Cuidamos el plazo de obra, la seguridad de la instalación y el impacto de producir en el país.</p>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureNum}>03 · Parceria</div>
                <h3>Atención de quien entiende de obra</h3>
                <p>Sin formularios largos, sin scripts. Hablás directo con quien especifica y cotiza. WhatsApp como canal real, no como línea automática.</p>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className={styles.testimonials} aria-labelledby="testimonials-title">
          <div className={styles.container}>
            <div className={styles.sectionEyebrow}>
              <svg viewBox="0 0 256 256" width="16" height="16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" aria-hidden="true"><circle cx="128" cy="96" r="64"/><path d="M32,216c19.37-33.47,54.55-56,96-56s76.63,22.53,96,56"/></svg>
              <span style={{ color: 'var(--ocean)' }}>Clientes</span>
            </div>
            <h2 id="testimonials-title" className={styles.sectionTitle}>Lo que dicen los que ya trabajan con BGA</h2>
            <p className={styles.sectionLead}>Empresas que confían en BGA para obras industriales y de infraestructura en Paraguay y la región.</p>
            <div className={styles.testimonialsGrid}>
              <div className={styles.testimonial}>
                <p className={styles.testimonialQuote}>"Casi 10 años con BGA. Calidad constante, atención excepcional y respuesta inmediata. Productos adaptados a cada obra, con seguimiento post-obra, flexibilidad de pago y agilidad en las entregas."</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar} aria-hidden="true">FC</div>
                  <div>
                    <div className={styles.testimonialName}>Fernando Carrenho</div>
                    <div className={styles.testimonialCompany}>Construlógica</div>
                  </div>
                </div>
              </div>
              <div className={styles.testimonial}>
                <p className={styles.testimonialQuote}>"Excelente variedad de productos y un equipo que siempre responde a los detalles y exigencias de cada proyecto, incluso los caprichos de los arquitectos."</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar} aria-hidden="true">GR</div>
                  <div>
                    <div className={styles.testimonialName}>Gustavo Ruiz</div>
                    <div className={styles.testimonialCompany}>ABS Montajes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DISTRIBUTORS */}
        <section className={styles.distributorsSection} aria-labelledby="distributors-title">
          <div className={styles.container}>
            <div className={styles.sectionEyebrow} style={{ justifyContent: 'center', color: 'var(--ocean)' }}>
              <svg viewBox="0 0 256 256" width="16" height="16" fill="none" stroke="rgb(255,198,0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" aria-hidden="true"><rect x="104" y="32" width="48" height="48" rx="8"/><rect x="40" y="168" width="48" height="48" rx="8"/><rect x="168" y="168" width="48" height="48" rx="8"/><line x1="128" y1="80" x2="128" y2="120"/><line x1="192" y1="120" x2="192" y2="168"/><line x1="64" y1="168" x2="64" y2="120"/><line x1="24" y1="120" x2="232" y2="120"/></svg>
              Red de distribuidores
            </div>
            <h2 id="distributors-title" className={styles.sectionTitle} style={{ textAlign: 'center' }}>Dónde encontrar productos BGA</h2>
            <div className={styles.distributorsGrid}>
              <a href="https://electrosystem.com.py/" target="_blank" rel="noopener noreferrer" className={styles.distributorLogo} title="Electro System"><img src="/distributors/logo-electrosystem-distribuidor-bga-paraguay.png" alt="Electro System – distribuidor BGA Paraguay" loading="lazy" /></a>
              <a href="https://brasguay.com/" target="_blank" rel="noopener noreferrer" className={styles.distributorLogo} title="Brasguay"><img src="/distributors/logo-brasguay-distribuidor-bga-paraguay.webp" alt="Brasguay – distribuidor BGA Paraguay" loading="lazy" /></a>
              <a href="https://www.tape.com.py/" target="_blank" rel="noopener noreferrer" className={styles.distributorLogo} title="Tapé"><img src="/distributors/logo-tape-distribuidor-bga-paraguay.png" alt="Tapé – distribuidor BGA Paraguay" loading="lazy" /></a>
              <a href="https://www.puntoelectrico.com.py/" target="_blank" rel="noopener noreferrer" className={styles.distributorLogo} title="Punto Eléctrico"><img src="/distributors/logo-puntoelectrico-distribuidor-bga-paraguay.png" alt="Punto Eléctrico – distribuidor BGA Paraguay" loading="lazy" /></a>
              <a href="https://saimco.my.canva.site/saimco/" target="_blank" rel="noopener noreferrer" className={styles.distributorLogo} title="Saimco"><img src="/distributors/logo-saimco-distribuidor-bga-paraguay.png" alt="Saimco – distribuidor BGA Paraguay" loading="lazy" /></a>
              <a href="https://www.instagram.com/todohogarpy/" target="_blank" rel="noopener noreferrer" className={styles.distributorLogo} title="Todo Hogar"><img src="/distributors/logo-todohogar-distribuidor-bga-paraguay.jpg" alt="Todo Hogar – distribuidor BGA Paraguay" loading="lazy" /></a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={styles.faqSection} aria-labelledby="faq-title">
          <div className={styles.container}>
            <div className={styles.sectionEyebrow} style={{ justifyContent: 'center' }}>
              <svg viewBox="0 0 256 256" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180Zm-12-108c-23.14,0-40,17.36-40,40a8,8,0,0,0,16,0c0-13.36,10.94-24,24-24s24,10.64,24,24c0,9.44-6.1,14.67-16.21,22.43C124.51,140.6,112,150.67,112,172a8,8,0,0,0,16,0c0-12.84,8.5-19.32,18.84-27.22C158.12,136,176,122.5,176,112,176,89.36,151.14,72,128,72Z"/></svg>
              <span style={{ color: 'var(--ocean)' }}>Preguntas frecuentes</span>
            </div>
            <h2 id="faq-title" className={styles.sectionTitle} style={{ textAlign: 'center' }}>Lo que más nos preguntan antes de cotizar</h2>
            <p className={styles.sectionLead} style={{ textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>Si tu duda no está acá, escribínos por WhatsApp. Respondemos en menos de 1 hora hábil.</p>
            <div className={styles.faqList}>
              <details className={styles.faqItem}>
                <summary>¿Cuál es el plazo de entrega?</summary>
                <p>Para productos de stock, 3 a 7 días en Paraguay. Para fabricación a medida o pedidos grandes, definimos plazo en la cotización según volumen.</p>
              </details>
              <details className={styles.faqItem}>
                <summary>¿Atienden obras grandes y construcciones?</summary>
                <p>Sí. Trabajamos con constructoras y proyectos industriales en Paraguay y el Mercosur. Atendemos personalmente los pedidos de obra.</p>
              </details>
              <details className={styles.faqItem}>
                <summary>¿Tienen factura legal y RUC?</summary>
                <p>Sí. Emitimos factura legal paraguaya. Para clientes del Mercosur, ajustamos documentación según el destino de la mercadería.</p>
              </details>
              <details className={styles.faqItem}>
                <summary>¿Cuál es el pedido mínimo?</summary>
                <p>No hay mínimo rígido. Atendemos desde una bandeja para reposición hasta pedidos completos para obra. La cotización se ajusta al volumen.</p>
              </details>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contacto" className={styles.ctaSection} aria-labelledby="contacto-title">
          <div className={styles.container}>
            <div className={styles.ctaGrid}>
              <div className={styles.ctaLeft}>
                <div className={styles.sectionEyebrow}><span style={{ color: 'var(--ocean)' }}>Cotización</span></div>
                <h2 id="contacto-title">Pasanos los datos de tu proyecto. Te respondemos por WhatsApp.</h2>
                <p>Completá el formulario y disparamos un mensaje pre-armado a nuestro equipo. Hablás directo con quien cotiza, sin pasar por filtros.</p>
                <div className={styles.ctaInfoBlock}>
                  <div className={styles.ctaInfoIcon}><svg viewBox="0 0 256 256" width="24" height="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" aria-hidden="true"><circle cx="128" cy="128" r="96"/><polyline points="128 72 128 128 184 128"/></svg></div>
                  <div><strong>Tiempo de respuesta</strong><span>Te saludamos en menos de 1 hora hábil. La cotización depende del largo de la lista.</span></div>
                </div>
                <div className={styles.ctaInfoBlock}>
                  <div className={styles.ctaInfoIcon}><svg viewBox="0 0 256 256" width="24" height="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" aria-hidden="true"><path d="M224,200v8a32,32,0,0,1-32,32H136"/><path d="M224,128H192a16,16,0,0,0-16,16v40a16,16,0,0,0,16,16h32V128a96,96,0,1,0-192,0v56a16,16,0,0,0,16,16H64a16,16,0,0,0,16-16V144a16,16,0,0,0-16-16H32"/></svg></div>
                  <div><strong>Quién responde</strong><span>Equipo directo de ventas. Sin call center.</span></div>
                </div>
                <div className={styles.ctaInfoBlock}>
                  <div className={styles.ctaInfoIcon}><svg viewBox="0 0 256 256" width="24" height="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" aria-hidden="true"><circle cx="128" cy="80" r="16" fill="currentColor"/><path d="M184,80c0,56-56,88-56,88S72,136,72,80a56,56,0,0,1,112,0Z"/><path d="M200,155.14c19.72,7.28,32,17.52,32,28.86,0,22.09-46.56,40-104,40S24,206.09,24,184c0-11.34,12.28-21.58,32-28.86"/></svg></div>
                  <div><strong>Atendemos</strong><span>Paraguay y Mercosur. Pedidos industriales y obras grandes.</span></div>
                </div>
                <Link href="/catalogo" className={styles.ctaCatalogLink}>
                  <strong>¿No sabés qué pedir?</strong>
                  <span>Mirá el catálogo, armá tu lista con medida, material y espesor, y mandala en un mensaje. Así la cotización sale más rápido.</span>
                </Link>
              </div>
              <div className={styles.formWrapper} ref={formWrapperRef}>
                <h3>Solicitar cotización</h3>
                <p className={styles.formSub}>4 datos. 30 segundos. Tu mensaje sale por WhatsApp.</p>
                <form onSubmit={handleContactSubmit}>
                  <div className={styles.formField}>
                    <label htmlFor="nombre">Nombre completo</label>
                    <input id="nombre" name="nombre" type="text" required placeholder="Ej. In. Carlos Martínez" />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="empresa">Empresa o RUC</label>
                    <input id="empresa" name="empresa" type="text" required placeholder="Ej. Construlógica · 80000000-0" />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="sector">Rubro</label>
                    <div className={styles.selectWrapper}>
                      <select id="sector" name="sector" required defaultValue="">
                        <option value="">Seleccioná un rubro</option>
                        <option>Obra propia</option>
                        <option>Instalación eléctrica</option>
                        <option>Distribución de materiales eléctricos</option>
                      </select>
                      <span className={styles.selectIcon} aria-hidden="true">
                        <svg viewBox="0 0 256 256" width="16" height="16" fill="currentColor"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/></svg>
                      </span>
                    </div>
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="mensaje">¿Qué necesitás cotizar?</label>
                    <textarea id="mensaje" name="mensaje" required placeholder="Ej. Bandejas portacables tipo escalera, ~200 m, para obra industrial en Asunción. Plazo de entrega previsto: 30 días."></textarea>
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="archivo">Adjuntar plano o foto (opcional)</label>
                    <input
                      id="archivo"
                      name="archivo"
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
                      onChange={handleFileChange}
                      className={styles.fileInput}
                    />
                    <label htmlFor="archivo" className={styles.fileDrop}>
                      <svg viewBox="0 0 256 256" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M208,88H152V32a8,8,0,0,0-13.66-5.66l-88,88A8,8,0,0,0,56,128h56v56a8,8,0,0,0,13.66,5.66l88-88A8,8,0,0,0,208,88ZM136,164.69V120a8,8,0,0,0-8-8H75.31L136,51.31V96a8,8,0,0,0,8,8h44.69Z"/></svg>
                      <span>{attachedFileName || 'Elegir archivo · PNG, JPEG o PDF'}</span>
                    </label>
                    <p className={styles.fileHint}>
                      WhatsApp no permite adjuntar archivos automáticamente desde la web: al enviar, vas a ver el chat abierto con tu mensaje — adjuntá el archivo ahí mismo.
                    </p>
                  </div>
                  <button type="submit" className={styles.formSubmit} disabled={submitting}>
                    <WhatsappIcon size={20} />
                    {submitting ? 'Abriendo WhatsApp…' : 'Enviar por WhatsApp'}
                  </button>
                  <p className={styles.formNote}>Al enviar, abrimos WhatsApp con tu mensaje pre-formado. Usamos tus datos solo para responderte: no los vendemos ni los cedemos para publicidad. <Link href="/politica-de-privacidad/" className={styles.formNoteLink}>Política de privacidad</Link></p>
                </form>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <a href="#" className={styles.logo} aria-label={`${config.brand.name} – inicio`}>
                <img src="/logo-bga-bandejas-portacables-paraguay-white.png" alt={`${config.brand.name} Paraguay`} height="44" />
              </a>
              <p>Bandejas portacables y tableros eléctricos. Fabricados en Paraguay, con norma internacional.</p>
            </div>
            <div className={styles.footerCol}>
              <h4>Productos</h4>
              <a href="#productos">Bandejas portacables</a>
              <a href="#productos">Tableros eléctricos</a>
              <Link href="/catalogo">Catálogo</Link>
            </div>
            <div className={styles.footerCol}>
              <h4>Sectores</h4>
              <a href="#sectores">Energía</a>
              <a href="#sectores">Industria</a>
              <a href="#sectores">Construcción</a>
              <a href="#sectores">Agroindustria</a>
            </div>
            <div className={styles.footerCol}>
              <h4>Contacto</h4>
              <address style={{ fontStyle: 'normal' }}>
                <a href={waLink(`Hola ${config.brand.name}, quisiera información sobre productos y precios.`)} target="_blank" rel="noopener noreferrer">WhatsApp {config.contact.phone}</a>
                <a href={`mailto:${config.contact.email}`}>{config.contact.email}</a>
                <p>{config.brand.address}</p>
              </address>
              <a href="https://www.instagram.com/bgapy/" target="_blank" rel="noopener noreferrer" className={styles.footerIg}>
                <svg viewBox="0 0 256 256" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"/></svg>
                @bgapy
              </a>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 {config.brand.name} · Todos los derechos reservados</span>
            <Link href="/politica-de-privacidad/">Política de privacidad</Link>
            <span>Hecho en Paraguay</span>
          </div>
        </div>
      </footer>

      <a
        href={waLink(`Hola! Estoy en la web de ${config.brand.name} y quiero más información.`)}
        className={`${styles.waFloat} ${waFloatHidden ? styles.waFloatHidden : ''}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
      >
        <WhatsappIcon size={32} />
      </a>
    </div>
  )
}
