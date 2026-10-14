export default function PrivacidadPage() {
  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <p className="eyebrow">// Legal</p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Política de Privacidad
          </h1>
          <p className="mt-2 text-sm text-mute">
            Última actualización: Octubre de 2026
          </p>
        </header>

        <Section title="1. Responsable del tratamiento">
          <p>
            NovaLink es el responsable del tratamiento de los datos personales
            recopilados a través de la Plataforma{" "}
            <span className="mono text-accent">sorteo.novalinkdo.com</span>. Esta
            Política describe cómo recopilamos, utilizamos y protegemos tus
            datos personales, de conformidad con la Ley No. 172-13 sobre
            Protección de Datos Personales de la República Dominicana.
          </p>
        </Section>

        <Section title="2. Datos que recopilamos">
          <p>Al participar en una rifa, recopilamos los siguientes datos:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Nombre completo.</li>
            <li>Número de teléfono / WhatsApp.</li>
            <li>Correo electrónico.</li>
            <li>Comprobante de la transferencia realizada (imagen o PDF).</li>
            <li>Números de boletos asignados y registro de la compra.</li>
          </ul>
        </Section>

        <Section title="3. Finalidad del tratamiento">
          <p>Utilizamos tus datos personales exclusivamente para:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Gestionar tu participación en las rifas.</li>
            <li>Verificar y confirmar el pago de tus boletos.</li>
            <li>Contactarte en caso de resultar ganador.</li>
            <li>Atender consultas y solicitudes de soporte.</li>
          </ul>
        </Section>

        <Section title="4. Base legal">
          <p>
            El tratamiento de tus datos se fundamenta en tu consentimiento
            expreso al participar y en la ejecución del contrato de compra de
            boletos. No utilizaremos tus datos con fines distintos a los
            descritos sin tu autorización.
          </p>
        </Section>

        <Section title="5. Compartir datos con terceros">
          <p>
            No vendemos, alquilamos ni compartimos tus datos personales con
            terceros con fines comerciales. Únicamente podremos divulgar datos
            cuando sea requerido por obligación legal o por autoridades
            competentes.
          </p>
        </Section>

        <Section title="6. Conservación de los datos">
          <p>
            Conservaremos tus datos personales durante el tiempo necesario para
            cumplir con las finalidades descritas y, en todo caso, por el plazo
            que exija la normativa aplicable.
          </p>
        </Section>

        <Section title="7. Derechos del titular">
          <p>
            De conformidad con la Ley No. 172-13, tienes derecho a acceder,
            rectificar, cancelar y oponerte al tratamiento de tus datos
            personales, así como a revocar tu consentimiento en cualquier
            momento. Para ejercer estos derechos, escríbenos a{" "}
            <span className="mono text-accent">soporte@novalinkdo.com</span>.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            La Plataforma puede utilizar cookies y tecnologías similares para
            el correcto funcionamiento del sitio y para recordar tu sesión.
            Puedes configurar tu navegador para rechazar las cookies, aunque
            algunas funciones podrían no estar disponibles.
          </p>
        </Section>

        <Section title="9. Seguridad">
          <p>
            Adoptamos medidas técnicas y organizativas razonables para proteger
            tus datos personales contra accesos no autorizados, pérdida o
            alteración. No obstante, ningún sistema es completamente seguro.
          </p>
        </Section>

        <Section title="10. Contacto">
          <p>
            Si tienes preguntas sobre esta Política de Privacidad o sobre el
            tratamiento de tus datos, puedes contactarnos en{" "}
            <span className="mono text-accent">soporte@novalinkdo.com</span>.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-mute">
        {children}
      </div>
    </section>
  );
}
