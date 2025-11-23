<template>
  <section class="mx-auto flex max-w-4xl flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
    <div class="flex flex-col gap-2">
      <p class="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">Welcome</p>
      <h1 class="text-2xl font-semibold text-slate-900">Meet Lembas</h1>
      <p class="text-slate-600">
        Tuck your family staples and fresh experiments into one cozy spot. Tap the + to start a new recipe, or jump into the
        list on the left to keep cooking.
      </p>
    </div>
    <div class="rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm shadow-orange-100">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-sm font-semibold text-orange-800">Ready to cook?</p>
          <p class="text-sm text-orange-700">Start a fresh recipe and keep it with the rest of your collection.</p>
        </div>
        <RouterLink
          :to="{ name: 'recipe-new' }"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700 active:scale-[0.99]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create recipe
        </RouterLink>
      </div>
    </div>
    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-xl border border-orange-100 bg-orange-50 p-4 text-orange-800">
        <p class="font-semibold">Quick tips</p>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>Add a title, a few tags, and who you got it from.</li>
          <li>Keep ingredients and steps tidy so everyone can follow along.</li>
          <li>Save as you go - Lembas remembers where you left off.</li>
        </ul>
      </div>
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
        <p class="font-semibold text-slate-900">How it works</p>
        <p class="mt-2 text-sm leading-relaxed">
          Pick a recipe from the sidebar to read or edit it. Use the pencil to make changes, or the + button to start something
          new. Your collection stays sorted so favorites are always easy to find.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>
