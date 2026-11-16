import { Hero } from "@/components/home/Hero";
import { BandeCanaux } from "@/components/home/BandeCanaux";
import { Testimonials } from "@/components/home/Testimonials";
import { Pipeline } from "@/components/home/Pipeline";
import { ThreeThings, Pricing } from "@/components/home/Features";
import { Faq, AppelFinal } from "@/components/home/Faq";

export default function Home() {
  return (
    <>
      <Hero />
      <BandeCanaux />
      <Testimonials />
      <Pipeline />
      <ThreeThings />
      <Pricing />
      <Faq />
      <AppelFinal />
    </>
  );
}
