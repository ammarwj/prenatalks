import type { SVGProps } from "react";

/**
 * lucide-react dropped brand/social icons, so these are hand-drawn
 * to match lucide's stroke style (round caps/joins, 2px stroke).
 */

function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M14 9.5h2.5V6.2c-.43-.06-1.9-.2-3.13-.2C10.9 6 9.3 7.66 9.3 10.14v2.19H6.8v3.6h2.5V22h3.5v-6.07h2.63l.42-3.6H12.8v-1.86c0-1.04.28-1.97 1.2-1.97Z" />
    </Base>
  );
}

export function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="3.5" />
      <path d="M10.5 9.7v4.6l4-2.3-4-2.3Z" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function TiktokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M14 4v9.6a2.9 2.9 0 1 1-2.4-2.86" />
      <path d="M14 4c.3 2 1.8 3.5 4 3.8" />
    </Base>
  );
}

export function WhatsappIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3.5 20.5 4.8 16.4A8 8 0 1 1 7.9 19.4L3.5 20.5Z" />
      <path d="M9.2 9c-.2 1.6 1 3.3 1.9 4.1.9.9 2.5 2 4 1.8" />
    </Base>
  );
}

export function TelegramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M21 4.5 2.8 11.3l4.9 1.7L21 4.5Z" />
      <path d="M21 4.5 7.7 13l.4 5.4L11 15" />
      <path d="M8.1 18.4 21 4.5l-3 15.1-6.9-4.6" />
    </Base>
  );
}
