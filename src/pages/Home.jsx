import Header from "../components/Header";
import HeroSection from "../components/Hero";
import PresaleMetrics from "../components/PresaleMetrics";
import StakingBenefits from "../components/StakingBenefits";
import ScrollProgressBar from "../components/ScrollProgressBar";
import TokenomicsOverview from "../components/TokenomicsOverview";
import FAQAccordion from "../components/FAQAccordion";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div>
      <Header />
     <ScrollProgressBar />
      <HeroSection />
      <PresaleMetrics />
      <StakingBenefits />
      <TokenomicsOverview />
      <FAQAccordion />
      <Footer /> 
    </div>
  );
}
