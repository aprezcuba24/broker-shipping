import { ArrowLeft, Download } from "lucide-react";
import { BtnLink, PageWrapper } from "@broker/ui";

export function InstallExtensions() {
  return (
    <PageWrapper
      title="Instalar extensiones"
      description="Instala la extensión en chrome para poder publicar mensajes en Facebook. No funciona en el teléfono."
      icon={Download}
      buttons={[
        <BtnLink key="back" to="/ads-messages" variant="outline" icon={ArrowLeft}>
          Atrás
        </BtnLink>,
      ]}
    >
      <ul className="list-decimal list-inside space-y-2">
        <li>Descarga el archivo <a className=" text-amber-500 hover:text-amber-600" href="/vendelo360-chrome-extension.zip" target="_blank" rel="noopener noreferrer">vendelo360-chrome-extension.zip</a></li>
        <li>Descomprime el archivo</li>
        <li>Navega a <strong>chrome://extensions</strong> en el navegador</li>
        <li>Activa el modo desarrollador (Developer mode)</li>
        <li>Carga la extensión descompresada. Botón <strong>Load unpacked</strong></li>
        <li>Ya está lista para usar</li>
        <li>Si tienes algún problema, recarga la aplicación o contacta a <a className=" text-amber-500 hover:text-amber-600" href="https://vendelo360.com/contacto" target="_blank" rel="noopener noreferrer">soporte</a></li>
      </ul>
    </PageWrapper>
  );
}