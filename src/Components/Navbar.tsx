import Link from "next/link";
export default function Navbar() {
  return (
    <nav className="w-full border-b border-zinc-800 bg-black px-6 py-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="hover:text-white transition">
        <h1 className="text-2xl font-bold text-white"> Press Club </h1>
        </Link>
        <div className="flex gap-6 text-zinc-300">
          <Link href="/" className="hover:text-white transition"> Home </Link>
          {/* <button className="hover:text-white transition"> Events </button> */}
          {/* <button className="hover:text-white transition"> Team </button> */}
          <Link href="/NNN" className="hover:text-white transition"> NNN </Link>
          <Link href="/Entelechy" className="hover:text-white transition"> Entelechy </Link>
        </div>
      </div>
    </nav>
  );
}