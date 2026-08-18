export default function ScanPrompt() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-black px-6 py-12 text-center">
      <p className="text-sm font-semibold tracking-[0.2em] text-gold [text-shadow:0_0_18px_rgba(250,208,100,0.4)]">
        HANGOVER LOUNGE
      </p>
      <p className="max-w-xs text-sm text-text-muted">
        Please scan the QR code on your Invitation card.
      </p>
    </div>
  );
}
