import { Button } from "@/components/ui/button"
import { LifeBuoy } from "lucide-react"

export function HelpBar() {
  return (
    <section id="ayuda" className="bg-gradient-to-r from-royal-blue to-sky-blue py-4 shadow-lg">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-lg">Centro de ayuda</span>
            <span className="mx-3 hidden sm:inline text-white/60">|</span>
            <span className="block text-sm text-white/90 sm:inline">
              Consulta recursos de formalización y soporte operativo cuando lo necesites.
            </span>
          </div>
        </div>
        <Button
          asChild
          size="lg"
          className="bg-card hover:bg-card/90 text-royal-blue font-bold shadow-lg px-6"
        >
          <a href="/recursos">Ver recursos</a>
        </Button>
      </div>
    </section>
  )
}
