import { useState, useEffect } from "react";

export default function ScrollProgressBar() {
  const [scrollPercentage, setScrollPercentage] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const documentHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / documentHeight) * 100;
      setScrollPercentage(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-gray-700 z-50">
      <div
        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-100"
        style={{ width: `${scrollPercentage}%` }}
      />
    </div>
  );
}
