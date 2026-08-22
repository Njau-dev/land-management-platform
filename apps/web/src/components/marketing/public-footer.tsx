import Link from "next/link";

import { Brand } from "./brand";

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-emerald-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.3fr_1fr] lg:px-10">
        <div>
          <Brand inverse />
          <p className="mt-5 max-w-md text-sm leading-6 text-emerald-100/65">
            A clear workspace for reviewing consolidated land information from
            synthetic development data.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="font-semibold text-white">Explore</p>
            <div className="mt-4 flex flex-col gap-3 text-emerald-100/65">
              <Link href="#features" className="hover:text-white">Features</Link>
              <Link href="#how-it-works" className="hover:text-white">How it works</Link>
              <Link href="#pricing" className="hover:text-white">Pricing</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold text-white">Account</p>
            <div className="mt-4 flex flex-col gap-3 text-emerald-100/65">
              <Link href="/login" className="hover:text-white">Login</Link>
              <Link href="/signup" className="hover:text-white">Sign up</Link>
              <Link href="/admin/login" className="hover:text-white">Administration</Link>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-5 text-xs text-emerald-100/50 sm:px-8 lg:px-10">
          © {new Date().getFullYear()} Ardhi. Product development environment.
        </div>
      </div>
    </footer>
  );
}
