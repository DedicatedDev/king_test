import { ConnectButton } from "@rainbow-me/rainbowkit";
export function Header() {
  return (
    <div className="px-12 py-5 bg-gray-500">
      <p className="bg-green-600">King of Fools</p>
      <ConnectButton></ConnectButton>
    </div>
  );
}
