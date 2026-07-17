"use client";
import React, { JSX } from "react";
import { ComponentProps } from "lib/component-props";
import Link from "next/link";

interface AboutUsProps extends ComponentProps {}

const FOUNDERS = [
  {
    name: "Krunal Modi",
    role: "Founder & CEO",
    bio: "Krunal Modi leads our corporate vision, growth strategies, and operations, shaping the future of premium digital shopping experiences.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400",
  },
  {
    name: "Akshay Rathod",
    role: "Co-Founder & CTO",
    bio: "Akshay Rathod drives our technological innovation, e-commerce mechanics, custom 3D sandbox visualizers, and digital design architecture.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400",
  },
];

const VALUES = [
  {
    title: "Quality Craftsmanship",
    desc: "Every piece in our catalog is handpicked and inspected to guarantee first-class durability, aesthetics, and texture.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#B88E2F]">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "Customer First",
    desc: "We prioritize our shoppers' satisfaction, providing free consultations, support, and seamless delivery.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#B88E2F]">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "Sustainable Sourcing",
    desc: "We are committed to our planet. Our wooden materials are ethically harvested and locally sourced from certified forests.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#B88E2F]">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: "Modern Aesthetics",
    desc: "Our design language blends mid-century simplicity with contemporary trends, ensuring your home looks state-of-the-art.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#B88E2F]">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
];

export const Default = (props: AboutUsProps): JSX.Element => {
  const { params } = props;
  const renderId = params.RenderingIdentifier;

  return (
    <section className="w-full bg-[#FCF8F3]" id={renderId || undefined}>
      {/* Hero Banner */}
      <div className="relative w-full h-[320px] bg-[url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200')] bg-cover bg-center flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-[48px] font-bold text-white font-poppins mb-2">Our Story</h1>
          <p className="text-white/80 font-poppins text-lg max-w-[600px] mx-auto">
            Crafting comfort, designing dreams, and engineering the future of home interiors.
          </p>
        </div>
      </div>

      {/* Brand Narrative Section */}
      <div className="max-w-[1240px] mx-auto px-4 py-[80px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[60px] items-center">
          <div>
            <span className="text-[#B88E2F] font-bold tracking-wider text-sm font-poppins uppercase block mb-2">
              Who We Are
            </span>
            <h2 className="text-[36px] font-bold text-[#3A3A3A] font-poppins mb-6 leading-tight">
              Reimagining Modern Living Spaces Since 2024
            </h2>
            <p className="text-[16px] text-[#616161] font-poppins leading-[28px] mb-4">
              Furniro was founded on a simple principle: high-quality design should be accessible, sustainable, and fully customizable. We bridge the gap between premium artisans and modern homeowners by curating collections that combine form, comfort, and longevity.
            </p>
            <p className="text-[16px] text-[#616161] font-poppins leading-[28px]">
              Through our unified e-commerce hub, interactive CDP personalizations, and real-time 3D styling sandbox engines, we invite you to design spaces that are truly inspired and tailored to your lifestyle.
            </p>
          </div>
          <div className="relative w-full h-[400px] overflow-hidden rounded-xl shadow-lg border border-white">
            <img
              src="https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=800"
              alt="Furniro Showroom"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Core Values Hub */}
      <div className="bg-white py-[80px] border-t border-b border-[#E8E8E8]">
        <div className="max-w-[1240px] mx-auto px-4">
          <div className="text-center mb-[50px]">
            <span className="text-[#B88E2F] font-bold tracking-wider text-sm font-poppins uppercase block mb-2">
              Our Foundations
            </span>
            <h2 className="text-[32px] font-bold text-[#3A3A3A] font-poppins">
              The Pillars of Furniro
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[30px]">
            {VALUES.map((val) => (
              <div
                key={val.title}
                className="bg-[#FCF8F3] p-8 rounded-lg border border-gray-100 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1"
              >
                <div className="w-[60px] h-[60px] rounded-full bg-white flex items-center justify-center shadow-sm mb-5">
                  {val.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#3A3A3A] mb-3 font-poppins">{val.title}</h3>
                <p className="text-sm text-[#898989] font-poppins leading-[22px]">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Meet the Founders Grid */}
      <div className="max-w-[1240px] mx-auto px-4 py-[80px]">
        <div className="text-center mb-[60px]">
          <span className="text-[#B88E2F] font-bold tracking-wider text-sm font-poppins uppercase block mb-2">
            The Visionaries
          </span>
          <h2 className="text-[32px] font-bold text-[#3A3A3A] font-poppins">
            Meet Our Founders
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[40px] max-w-[900px] mx-auto">
          {FOUNDERS.map((founder) => (
            <div
              key={founder.name}
              className="bg-white border border-gray-200/60 p-6 rounded-2xl flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-[150px] h-[150px] rounded-full overflow-hidden border-[4px] border-[#B88E2F] mb-6 shadow-md">
                <img
                  src={founder.image}
                  alt={founder.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-[22px] font-bold text-[#3A3A3A] font-poppins mb-1">
                {founder.name}
              </h3>
              <span className="text-sm font-semibold text-[#B88E2F] font-poppins mb-4 uppercase tracking-wider block">
                {founder.role}
              </span>
              <p className="text-sm text-[#616161] font-poppins leading-[24px] max-w-[340px]">
                {founder.bio}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action Banner */}
      <div className="bg-[#B88E2F] py-[60px] px-4 flex flex-col items-center text-center text-white">
        <h2 className="text-[32px] font-bold font-poppins mb-3">Ready to Style Your Living Space?</h2>
        <p className="text-white/80 font-poppins mb-6 text-sm max-w-[500px] text-center leading-[24px]">
          Browse our extensive catalog of hand-crafted sofas, chairs, tables, and lighting systems today.
        </p>
        <Link
          href="/Shop"
          className="inline-block px-10 py-3 bg-white text-[#B88E2F] hover:bg-[#FAF9F5] font-poppins font-bold text-sm rounded-sm transition-all shadow-sm"
        >
          Explore the Catalog
        </Link>
      </div>
    </section>
  );
};
