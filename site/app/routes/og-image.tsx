import { disableSSG } from "hono/ssg"
import { createRoute } from "honox/factory"
import { Logo } from "@/components/site-header"
import { siteConfig } from "@/lib/site"
import { AccountAccess } from "../../generated/home/account-access"
import { ClaimableBalance } from "../../generated/home/claimable-balance"
import { ContributionHistory } from "../../generated/home/contribution-history"
import { DividendIncome } from "../../generated/home/dividend-income"
import { NewMilestone } from "../../generated/home/new-milestone"
import { Payments } from "../../generated/home/payments"
import { PayoutThreshold } from "../../generated/home/payout-threshold"
import { QrConnect } from "../../generated/home/qr-connect"
import { SavingsTargets } from "../../generated/home/savings-targets"
import { TransferFunds } from "../../generated/home/transfer-funds"
import { UIElements } from "../../generated/home/ui-elements"

/**
 * The social image (public/og.png): the home page's cards beside the site's
 * name, at 1200×630. `bun run site:images` takes a screenshot of this page
 * from the dev server; it is not part of the built site.
 */
export default createRoute(disableSSG(), (c) =>
  c.render(
    <div class="relative h-[630px] w-[1200px] overflow-hidden bg-muted">
      <div
        aria-hidden="true"
        class="absolute top-[40px] left-[470px] flex origin-top-left gap-6 **:data-[slot=card]:w-full"
        style={{ transform: "rotate(-8deg) scale(0.72)" }}
      >
        <div class="flex w-[360px] flex-col gap-6">
          <UIElements />
          <SavingsTargets />
        </div>
        <div class="flex w-[360px] flex-col gap-6 pt-16">
          <ContributionHistory />
          <ClaimableBalance />
          <DividendIncome />
        </div>
        <div class="flex w-[360px] flex-col gap-6">
          <QrConnect />
          <TransferFunds />
          <Payments />
        </div>
        <div class="flex w-[360px] flex-col gap-6 pt-16">
          <NewMilestone />
          <PayoutThreshold />
          <AccountAccess />
        </div>
      </div>
      <div class="absolute inset-y-0 left-0 w-[600px] bg-linear-to-r from-muted from-75% to-transparent" />
      <div class="absolute inset-y-0 left-0 flex w-[600px] flex-col justify-center gap-7 pl-18">
        <Logo class="size-16" />
        <h1 class="text-7xl leading-[0.95] font-semibold tracking-tighter">
          shadcn/ui
          <br />
          Hono JSX
        </h1>
        <p class="max-w-[440px] text-2xl leading-snug text-balance text-muted-foreground">
          Accessible components translated from shadcn/ui. Server-rendered, no
          React.
        </p>
        <p class="font-mono text-lg text-muted-foreground">
          {new URL(siteConfig.url).host}
        </p>
      </div>
    </div>,
    { title: "Social image", bare: true }
  )
)
