import { Hero } from "@/components/home/Hero";
import { Testimonials } from "@/components/home/Testimonials";
import { Pipeline } from "@/components/home/Pipeline";
import { ThreeThings, Pricing } from "@/components/home/Features";

export default function Home() {
  return (
    <>
      <Hero />
      <Testimonials />
      <Pipeline />
      <ThreeThings />
      <Pricing />
    </>
  );
}
