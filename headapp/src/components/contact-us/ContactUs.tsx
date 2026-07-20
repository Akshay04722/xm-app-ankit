"use client";
import { useTranslations } from "next-intl";
import React, { JSX, useState } from "react";
import { ComponentProps } from "lib/component-props";

interface ContactUsProps extends ComponentProps {}

export const Default = (props: ContactUsProps): JSX.Element => {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);

  const { params } = props;
  const id = params.RenderingIdentifier;
  const styles = `component contact-us w-full ${params.styles || ""}`.trim();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus("error");
      return;
    }

    setStatus("submitting");
    // Simulate API call
    setTimeout(() => {
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1500);
  };

  return (
    <section className={styles} id={id || undefined}>
      {/* Page Title Header */}
      <div className="relative w-full h-[316px] bg-[url('https://xmc-sourceved1d977-ankitxmclou91bb-devf710.sitecorecloud.io/-/media/Project/akshay/akshayxmc/Rectangle-68.jpg')] bg-cover bg-center flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]" />
        <div className="relative z-10 flex flex-col items-center">
          {/* Brand Icon/Logo Placeholder */}
          <div className="w-[50px] h-[50px] mb-2 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B88E2F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <h1 className="text-[48px] font-medium text-black font-poppins mb-1">{t('Global-Contact')}</h1>
          <div className="flex items-center gap-2 text-[16px] font-poppins font-light">
            <a href="/" className="font-medium text-black hover:text-[#B88E2F] transition-colors">{t('Global-Home')}</a>
            <span className="text-black font-medium">{t('Global-Gt')}</span>
            <span className="text-black/60">{t('Global-Contact')}</span>
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="max-w-[1240px] mx-auto px-4 py-[80px]">
        {/* Section Intro */}
        <div className="text-center max-w-[644px] mx-auto mb-[60px]">
          <h2 className="text-[36px] font-semibold text-black font-poppins mb-[15px]">{t('ContactUs-GetInTouchWith')}</h2>
          <p className="text-[16px] text-[#9F9F9F] font-poppins font-normal leading-[24px]">
            {t('ContactUs-ForMoreInformationAbout')}
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-[80px] lg:gap-[100px] px-0 md:px-[50px]">
          
          {/* Left Column: Contact info */}
          <div className="flex flex-col gap-[40px] py-[10px]">
            
            {/* Address */}
            <div className="flex gap-[30px]">
              <div className="mt-1">
                <svg width="22" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h4 className="text-[24px] font-medium text-black font-poppins mb-[6px]">{t('Global-Address')}</h4>
                <p className="text-[16px] text-black font-poppins font-normal leading-[22px] max-w-[212px]">
                  {t('ContactUs-2365thSeAvenue')}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex gap-[30px]">
              <div className="mt-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h4 className="text-[24px] font-medium text-black font-poppins mb-[6px]">{t('ContactUs-Phone')}</h4>
                <p className="text-[16px] text-black font-poppins font-normal leading-[22px]">
                  {t('ContactUs-Mobile845466789')}<br />
                  {t('ContactUs-Hotline844566789')}
                </p>
              </div>
            </div>

            {/* Working Time */}
            <div className="flex gap-[30px]">
              <div className="mt-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h4 className="text-[24px] font-medium text-black font-poppins mb-[6px]">{t('ContactUs-WorkingTime')}</h4>
                <p className="text-[16px] text-black font-poppins font-normal leading-[22px]">
                  {t('ContactUs-Mondayfriday9002200')}<br />
                  {t('ContactUs-Saturdaysunday9002100')}
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Contact form */}
          <div className="flex flex-col p-4 bg-white rounded-md shadow-sm border border-gray-100/50">
            <form onSubmit={handleSubmit} className="flex flex-col gap-[36px]">
              
              {/* Name */}
              <div className="flex flex-col gap-[12px]">
                <label className="text-[16px] font-medium text-black font-poppins">{t('ContactUs-YourName')}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('ContactUs-Abc')}
                  className="w-full h-[75px] px-[30px] border border-[#9F9F9F] rounded-[10px] font-poppins text-[16px] focus:outline-none focus:border-[#B88E2F] transition-colors"
                  required
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-[12px]">
                <label className="text-[16px] font-medium text-black font-poppins">{t('Global-EmailAddress')}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('ContactUs-Abcdefcom')}
                  className="w-full h-[75px] px-[30px] border border-[#9F9F9F] rounded-[10px] font-poppins text-[16px] focus:outline-none focus:border-[#B88E2F] transition-colors"
                  required
                />
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-[12px]">
                <label className="text-[16px] font-medium text-black font-poppins">{t('ContactUs-Subject')}</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder={t('ContactUs-ThisIsAnOptional')}
                  className="w-full h-[75px] px-[30px] border border-[#9F9F9F] rounded-[10px] font-poppins text-[16px] focus:outline-none focus:border-[#B88E2F] transition-colors"
                />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-[12px]">
                <label className="text-[16px] font-medium text-black font-poppins">{t('ContactUs-Message')}</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t('ContactUs-HiIdLikeTo')}
                  rows={4}
                  className="w-full min-h-[120px] p-[30px] border border-[#9F9F9F] rounded-[10px] font-poppins text-[16px] focus:outline-none focus:border-[#B88E2F] transition-colors resize-y"
                  required
                />
              </div>

              {/* Submit Button & Status Alerts */}
              <div className="flex flex-col gap-[16px]">
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full md:w-[237px] h-[55px] bg-[#B88E2F] text-white font-poppins font-normal text-[16px] rounded-[5px] transition-all duration-300 hover:bg-[#9E7624] disabled:bg-gray-400 flex items-center justify-center"
                >
                  {status === "submitting" ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t('Global-Sending')}
                    </span>
                  ) : "Submit"}
                </button>

                {status === "success" && (
                  <div className="p-4 bg-green-50 text-green-700 rounded-md font-poppins text-sm border border-green-200">
                    {t('ContactUs-MessageSentSuccessfullyWe')}
                  </div>
                )}
                {status === "error" && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-md font-poppins text-sm border border-red-200">
                    {t('ContactUs-FailedToSendMessage')}
                  </div>
                )}
              </div>

            </form>
          </div>

        </div>
      </div>

      {/* Feature Showcase Banner */}
      <div className="w-full bg-[#FAF3EA] py-[80px] border-t border-[#E8E8E8]">
        <div className="max-w-[1240px] mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[40px]">
          
          {/* High Quality */}
          <div className="flex items-center gap-[10px]">
            <svg width="53" height="60" viewBox="0 0 53 60" fill="none" stroke="black" strokeWidth="2.5">
              <path d="M26.5 2L2 14v32l24.5 12L51 46V14L26.5 2z" />
              <circle cx="26.5" cy="30" r="10" />
            </svg>
            <div className="flex flex-col">
              <h4 className="text-[25px] font-semibold text-black font-poppins">{t('ContactUs-HighQuality')}</h4>
              <p className="text-[16px] text-[#898989] font-poppins font-normal">{t('ContactUs-CraftedFromTopMaterials')}</p>
            </div>
          </div>

          {/* Warranty Protection */}
          <div className="flex items-center gap-[10px]">
            <svg width="53" height="60" viewBox="0 0 53 60" fill="none" stroke="black" strokeWidth="2.5">
              <path d="M26.5 2L2 14v32l24.5 12L51 46V14L26.5 2z" />
              <path d="M16 30l7 7 14-14" />
            </svg>
            <div className="flex flex-col">
              <h4 className="text-[25px] font-semibold text-black font-poppins">{t('ContactUs-WarrantyProtection')}</h4>
              <p className="text-[16px] text-[#898989] font-poppins font-normal">{t('ContactUs-Over2Years')}</p>
            </div>
          </div>

          {/* Free Shipping */}
          <div className="flex items-center gap-[10px]">
            <svg width="60" height="46" viewBox="0 0 60 46" fill="none" stroke="black" strokeWidth="2.5">
              <rect x="2" y="10" width="38" height="26" />
              <path d="M40 18h10l8 8v10H40V18z" />
              <circle cx="14" cy="40" r="4" />
              <circle cx="48" cy="40" r="4" />
            </svg>
            <div className="flex flex-col">
              <h4 className="text-[25px] font-semibold text-black font-poppins">{t('ContactUs-FreeShipping')}</h4>
              <p className="text-[16px] text-[#898989] font-poppins font-normal">{t('ContactUs-OrderOver150')}</p>
            </div>
          </div>

          {/* 24 / 7 Support */}
          <div className="flex items-center gap-[10px]">
            <svg width="53" height="53" viewBox="0 0 53 53" fill="none" stroke="black" strokeWidth="2.5">
              <circle cx="26.5" cy="26.5" r="24" />
              <path d="M18 26.5c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5" />
              <circle cx="26.5" cy="26.5" r="3" />
            </svg>
            <div className="flex flex-col">
              <h4 className="text-[25px] font-semibold text-black font-poppins">{t('ContactUs-247Support')}</h4>
              <p className="text-[16px] text-[#898989] font-poppins font-normal">{t('ContactUs-DedicatedSupport')}</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
