import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">Menuva</p>
      <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
        Vaš meni v petih jezikih.
        <br />
        Z alergeni. Brez prepisovanja.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted">
        Fotografirajte meni ali naložite PDF. Prevedemo ga v angleščino, nemščino, italijanščino in hrvaščino —
        tako, da štruklji ostanejo štruklji. Gostje skenirajo QR kodo in izberejo svoj jezik.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/login" className="btn-primary px-6 py-3 text-base">
          Začnite brezplačno
        </Link>
        <Link href="/m/demo" className="btn-ghost px-6 py-3 text-base">
          Poglejte primer
        </Link>
      </div>
      <ul className="mt-16 grid gap-6 text-sm sm:grid-cols-3">
        <li>
          <p className="font-semibold">1. Naložite meni</p>
          <p className="mt-1 text-muted">Fotografija, PDF ali besedilo. AI prebere jedi, cene in kategorije.</p>
        </li>
        <li>
          <p className="font-semibold">2. Preverite</p>
          <p className="mt-1 text-muted">Popravite prevode in potrdite 14 alergenov EU za vsako jed.</p>
        </li>
        <li>
          <p className="font-semibold">3. Natisnite QR</p>
          <p className="mt-1 text-muted">Spremembe cene se takoj poznajo v vseh jezikih.</p>
        </li>
      </ul>
    </main>
  );
}
