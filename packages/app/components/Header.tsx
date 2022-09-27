import { ConnectButton } from "@rainbow-me/rainbowkit";
export function Header() {
  return (
    <div className="flex justify-between px-12 py-5">
      <div className="text-2xl font-bold font-sub">King of Fools</div>
      <ConnectButton />
    </div>
  );
}
