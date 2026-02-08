"use client";
import Script from 'next/script';
import { useEffect, useRef } from "react";

export default function FormAfzar() {
  return (
    <div>
      <Script
        src="https://formafzar.com/pages/formbuilder/ravesh-formbuilder.js"
        strategy="afterInteractive"
        data-form-url="https://formafzar.com/form/saderat04"
        data-form-style="inline"
        data-form-theme=""
      />
    </div>
  );
}
