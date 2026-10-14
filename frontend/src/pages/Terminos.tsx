export default function TerminosPage() {
  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <p className="eyebrow">// Legal</p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Términos y Condiciones
          </h1>
          <p className="mt-2 text-sm text-mute">
            Última actualización: Octubre de 2026
          </p>
        </header>

        <Section title="1. Aceptación de los términos">
          <p>
            Al acceder y utilizar el sitio web{" "}
            <span className="mono text-accent">sorteo.novalinkdo.com</span> (en
            adelante, la «Plataforma»), operada por NovaLink, aceptas estos
            Términos y Condiciones. Si no estás de acuerdo con alguno de ellos,
            no debes utilizar la Plataforma.
          </p>
        </Section>

        <Section title="2. Descripción del servicio">
          <p>
            La Plataforma permite a los usuarios participar en rifas y sorteos
            mediante la compra de boletos numerados electrónicos. Las rifas
            constituyen juegos de azar sujetos a la autorización de la
            Dirección de Casinos y Juegos de Azar del Ministerio de Hacienda de
            la República Dominicana.
          </p>
        </Section>

        <Section title="3. Elegibilidad">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Solo pueden participar personas <strong>mayores de 18 años</strong>.
              La participación de menores de edad está prohibida.
            </li>
            <li>
              No pueden participar el organizador, sus familiares directos ni
              las personas vinculadas a la organización o fiscalización de la
              rifa.
            </li>
            <li>
              El usuario es responsable de la veracidad de los datos que
              suministra al participar.
            </li>
          </ul>
        </Section>

        <Section title="4. Cómo participar">
          <p>
            Para participar, el usuario selecciona la rifa, elige la cantidad de
            boletos, completa sus datos personales (nombre, teléfono/WhatsApp y
            correo electrónico) y sube el comprobante de la transferencia
            realizada. La participación queda registrada una vez enviado el
            formulario y sujeta a la confirmación del pago.
          </p>
        </Section>

        <Section title="5. Precios y pago">
          <p>
            El precio de cada boleto se indica en la página de la rifa. El pago
            se realiza mediante transferencia bancaria a las cuentas indicadas
            en el formulario de participación. El organizador confirmará la
            recepción del pago antes de activar los boletos.
          </p>
        </Section>

        <Section title="6. Verificación y confirmación de la compra">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Tras el envío del formulario, la orden queda en estado
              «pendiente».
            </li>
            <li>
              El organizador verifica la transferencia y confirma la orden, con
              lo cual los boletos quedan «activos» para el sorteo.
            </li>
            <li>
              En caso de que el pago no sea verificado, la orden podrá ser
              rechazada.
            </li>
          </ul>
        </Section>

        <Section title="7. Premios y entrega">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Los premios se describen en las bases de cada rifa y no son
              canjeables por dinero ni transferibles, salvo indicación expresa.
            </li>
            <li>
              La entrega del premio se coordina con el ganador a través de
              WhatsApp, dentro de la República Dominicana.
            </li>
            <li>
              El ganador deberá reclamar su premio dentro del plazo indicado en
              las bases de la rifa.
            </li>
          </ul>
        </Section>

        <Section title="8. Mecánica del sorteo">
          <p>
            La mecánica, fechas y criterios para determinar a los ganadores se
            describen en las bases de cada rifa y en la página del sorteo. El
            organizador se reserva el derecho de modificar cualquier aspecto
            previa autorización de las autoridades competentes.
          </p>
        </Section>

        <Section title="9. Obligaciones del usuario">
          <p>
            El usuario se compromete a no utilizar la Plataforma con fines
            ilícitos, a no suministrar información falsa y a no intentar
            manipular el sistema de venta de boletos o los sorteos. El
            incumplimiento podrá dar lugar a la descalificación.
          </p>
        </Section>

        <Section title="10. Cancelaciones y reembolsos">
          <p>
            Los boletos adquiridos y confirmados no son reembolsables, salvo en
            los casos en que el sorteo sea cancelado por causas imputables al
            organizador. En tal supuesto, se informará a los participantes sobre
            el procedimiento aplicable.
          </p>
        </Section>

        <Section title="11. Propiedad intelectual">
          <p>
            Todo el contenido de la Plataforma (textos, imágenes, marcas y
            diseño) es propiedad de NovaLink o de sus respectivos titulares y
            está protegido por las leyes de propiedad intelectual. No está
            permitida su reproducción sin autorización previa.
          </p>
        </Section>

        <Section title="12. Limitación de responsabilidad">
          <p>
            NovaLink no será responsable por interrupciones del servicio,
            fallos técnicos ajenos a su control, ni por daños derivados del uso
            de los premios una vez entregados. La participación se rige
            asimismo por las bases de cada rifa.
          </p>
        </Section>

        <Section title="13. Modificaciones">
          <p>
            NovaLink podrá modificar estos Términos y Condiciones en cualquier
            momento. Los cambios entrarán en vigor al ser publicados en esta
            página. El uso continuado de la Plataforma implica la aceptación de
            los términos actualizados.
          </p>
        </Section>

        <Section title="14. Legislación aplicable y jurisdicción">
          <p>
            Estos Términos se rigen por las leyes de la República Dominicana.
            Cualquier controversia se someterá a la jurisdicción de los
            tribunales dominicanos competentes.
          </p>
        </Section>

        <Section title="15. Contacto">
          <p>
            Para cualquier consulta sobre estos Términos, puedes escribirnos a{" "}
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
