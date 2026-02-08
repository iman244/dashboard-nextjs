"use client";
import Script from 'next/script';
import { useEffect, useRef } from "react";

export default function FormAfzar() {
  return (
    <div>
      <Script
        src="https://formafzar.com/pages/formbuilder/ravesh-formbuilder.js"
        strategy="afterInteractive"
        form-url="https://formafzar.com/form/saderat04"
        form-style="inline"
        form-theme=""
      />
    </div>
  );
}
