"use client";

import React from "react";
import Script from "next/script";

const FormPage = () => {
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
};

export default FormPage;
