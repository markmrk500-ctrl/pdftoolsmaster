interface AdSlotProps {
  label?: string;
  className?: string;
}

/**
 * AdSense placeholder. After approval, replace inner content with:
 * <ins class="adsbygoogle" ... data-ad-client="ca-pub-XXX" data-ad-slot="YYY" />
 * and uncomment the AdSense script in index.html.
 */
export const AdSlot = ({ label = "Advertisement", className = "" }: AdSlotProps) => (
  <div className={`ad-slot ${className}`} aria-label="advertisement">
    <span>{label}</span>
  </div>
);
