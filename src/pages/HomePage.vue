<template>
  <section class="mx-auto flex max-w-4xl flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
    <div class="flex flex-col gap-2">
      <p class="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">Welcome</p>
      <h1 class="text-2xl font-semibold text-slate-900">Your shared recipe book</h1>
      <p class="text-slate-600">
        Create, edit, and browse recipes with instant syncing across every open tab. Use the + in the top right to add a new
        recipe, or pick one from the sidebar to view and edit it.
      </p>
    </div>
    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-xl border border-orange-100 bg-orange-50 p-4 text-orange-800">
        <p class="font-semibold">Quick tips</p>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>Use tags to group recipes (e.g., brunch, vegetarian, weeknight).</li>
          <li>Ingredients and steps are editable—hit the pencil on any recipe.</li>
          <li>Everything saves via Socket.IO so multiple windows stay in sync.</li>
        </ul>
      </div>
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
        <p class="font-semibold text-slate-900">How it works</p>
        <p class="mt-2 text-sm leading-relaxed">
          Recipes live in a local JSON file on the server. Add or edit a recipe, click save, and every open session will refresh
          instantly. Perfect for cooking together from different devices.
        </p>
      </div>
    </div>
  </section>
</template>
