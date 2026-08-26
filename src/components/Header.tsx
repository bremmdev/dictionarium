import { Link } from "@tanstack/react-router";
import mosaic from "#/assets/mosaic-bold.svg";
import scroll from "#/assets/scroll-sketch.svg";
import templum from "#/assets/temple-sketch.svg";
import { Tooltip, TooltipTrigger, TooltipContent } from "@bremmdev/m7kit";
import { Info } from "lucide-react";

export function Header() {
  return (
    <header className="bg-parchment-50 font-display">
      <nav className="border-parchment-200 border-b">
        <div className="mx-auto flex h-14 w-full max-w-page-width items-center px-8">
          <Link
            to="/"
            lang="la"
            className="text-lg font-bold uppercase tracking-wide flex items-center gap-2"
          >
            <img src={mosaic} alt="" aria-hidden="true" className="h-8 w-8" />
            <span className="text-ink-900">Dictionarium</span>{" "}
            <span className="text-gold-600">Latinum</span>
          </Link>
        </div>
      </nav>

      <div className="overflow-hidden border-parchment-200 border-b bg-linear-to-b from-parchment-50 to-parchment-100">
        <div className="mx-auto grid max-w-page-width grid-cols-1 items-center gap-12 px-8 py-12 md:grid-cols-3 md:gap-10 md:py-16">
          <div className="text-center md:col-span-2 md:text-left">
            <p className="text-gold-600 text-sm font-medium uppercase tracking-[0.32em] md:text-base">
              A dictionary for the Latin student
            </p>
            <div className="mt-6 flex items-center justify-center gap-4 md:justify-start">
              <h1
                className="text-ink-900 text-5xl leading-tight sm:text-6xl lg:text-7xl"
                lang="la"
              >
                Verba sub manū.
              </h1>
              <Tooltip hoverDelay={200} touchBehavior="tap">
                <TooltipTrigger className="my-0 rounded-full bg-parchment-50 p-2 text-gold-600 transition-colors hover:border-accent hover:bg-parchment-100 hover:text-accent">
                  <Info size={20} aria-hidden="true" />
                  <span className="sr-only">
                    What does <span lang="la">Verba sub manū</span> mean?
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  placement="bottom right"
                  className="w-72 p-3 text-left text-base shadow-md shadow-ink-900/10"
                >
                  <p className="text-ink-700 leading-relaxed">
                    <span className="font-semibold text-ink-900">
                      &ldquo;Words at hand&rdquo; or &ldquo;words within
                      reach.&rdquo;
                    </span>{" "}
                    The macron on <span className="text-accent">ū</span> marks a
                    long vowel — length alone can tell two words apart.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="mx-auto mt-6 text-lg leading-relaxed md:mx-0 md:text-xl max-w-[80%]">
              Look up any Latin word and read its principal parts, its part of
              speech, and its senses in order of use. Explore meaning, usage and
              more.
            </p>
          </div>

          <div className="mx-auto flex w-full max-w-xs md:max-w-lg items-center justify-center">
            <img
              src={scroll}
              alt=""
              aria-hidden="true"
              className="-translate-y-4 -rotate-8 flex-1 select-none"
            />
            <img
              src={templum}
              alt=""
              aria-hidden="true"
              className="flex-1 translate-y-4 rotate-7 select-none"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
