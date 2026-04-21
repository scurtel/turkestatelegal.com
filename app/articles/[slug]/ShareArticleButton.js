"use client";

export default function ShareArticleButton({ url, title, className }) {
  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          url
        });
        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }
      }
    }

    const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(url)}`;
    if (typeof window !== "undefined") {
      window.open(whatsappShareUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <button type="button" onClick={handleShare} className={className}>
      Share Article
    </button>
  );
}
