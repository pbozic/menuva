import { createRestaurant } from "./actions";

export function CreateRestaurant() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-20">
      <h1 className="font-serif text-3xl">Dobrodošli</h1>
      <p className="mt-2 text-muted">Kako se imenuje vaša restavracija?</p>
      <form action={createRestaurant} className="mt-6 space-y-4">
        <input name="name" required className="input" placeholder="Gostilna Pri Lojzetu" />
        <button className="btn-primary w-full">Nadaljuj</button>
      </form>
      <p className="mt-4 text-sm text-muted">14 dni brezplačno, brez kartice.</p>
    </main>
  );
}
