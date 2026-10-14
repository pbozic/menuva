import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto grid w-full max-w-5xl items-center gap-12 px-6 pt-16 pb-20 md:grid-cols-[1.2fr_1fr] md:pt-24">
        <div>
          <p className="text-sm font-medium tracking-widest text-accent uppercase">Menuva</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
            Fotografirajte tablo.
            <br />
            Malica je objavljena.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            Vsako jutro ista zgodba: prepisovanje malice na Facebook, Instagram in spletno stran. Z Menuvo jo
            fotografirate enkrat — v 20 sekundah dobite lepo sliko za zgodbo, besedilo za objavo, prevod v angleščino
            in alergene. Spletna stran se posodobi sama.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/login" className="btn-primary px-6 py-3 text-base">
              14 dni brezplačno
            </Link>
            <Link href="/d/demo" className="btn-ghost px-6 py-3 text-base">
              Poglejte primer
            </Link>
          </div>
          <p className="mt-3 text-sm text-muted">Brez kartice. Nato 12,90 € na mesec.</p>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/api/card/demo?format=story"
          alt="Primer slike dnevne malice za Instagram zgodbo"
          className="mx-auto w-64 rounded-2xl border border-line shadow-xl md:w-72"
        />
      </section>

      <section className="border-t border-line bg-card">
        <ul className="mx-auto grid max-w-5xl gap-8 px-6 py-16 text-sm sm:grid-cols-3">
          <li>
            <p className="text-base font-semibold">📷 1. Fotografija ali besedilo</p>
            <p className="mt-2 text-muted">Fotografirajte tablo, list ali prilepite besedilo. AI prebere jedi, cene in predlaga alergene.</p>
          </li>
          <li>
            <p className="text-base font-semibold">✨ 2. Vse oblike naenkrat</p>
            <p className="mt-2 text-muted">Slika za zgodbo in objavo, besedilo za Facebook, Instagram in Google profil — v slovenščini in angleščini.</p>
          </li>
          <li>
            <p className="text-base font-semibold">🌐 3. Spletna stran in QR</p>
            <p className="mt-2 text-muted">En košček kode na vaši strani in QR koda v izlogu vedno kažeta današnjo malico.</p>
          </li>
        </ul>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-serif text-2xl">Tudi celoten jedilni list v petih jezikih</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Naložite meni in ga dobite v angleščini, nemščini, italijanščini in hrvaščini — tako, da štruklji ostanejo
          štruklji, z opisom za tujce in 14 alergeni EU.{" "}
          <Link href="/m/demo" className="underline">
            Primer jedilnega lista
          </Link>
        </p>
      </section>
    </main>
  );
}
