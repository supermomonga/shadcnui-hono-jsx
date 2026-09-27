/**
 * The home page's showcase: shadcn/ui's cards (apps/v4/app/(app)/(root)/cards,
 * translated into site/generated/home/ by `bun run site:generate`), laid out
 * as on ui.shadcn.com. The message scroller has no Hono JSX version yet;
 * upstream's transfer funds card takes its place.
 */
import { AccountAccess } from "../../generated/home/account-access"
import { AnalyticsCard } from "../../generated/home/analytics-card"
import { ClaimableBalance } from "../../generated/home/claimable-balance"
import { ContributionHistory } from "../../generated/home/contribution-history"
import { DividendIncome } from "../../generated/home/dividend-income"
import { EmptyDistributeTrack } from "../../generated/home/empty-distribute-track"
import { NewMilestone } from "../../generated/home/new-milestone"
import { NotificationSettings } from "../../generated/home/notification-settings"
import { Payments } from "../../generated/home/payments"
import { PayoutThreshold } from "../../generated/home/payout-threshold"
import { PowerUsage } from "../../generated/home/power-usage"
import { QrConnect } from "../../generated/home/qr-connect"
import { SavingsTargets } from "../../generated/home/savings-targets"
import { SidebarNav } from "../../generated/home/sidebar-nav"
import { TransferFunds } from "../../generated/home/transfer-funds"
import { UIElements } from "../../generated/home/ui-elements"

export function CardsDemo() {
  return (
    <div
      data-slot="demo"
      class="relative flex w-full max-w-none flex-col gap-(--gap) overflow-hidden bg-muted p-4 pb-0! [--gap:--spacing(8)] md:p-12 3xl:[--gap:--spacing(8)] min-[1900px]:p-12 min-[1900px]:[--gap:--spacing(10)]! lg:p-6 lg:[--gap:--spacing(6)] dark:bg-background"
    >
      <div class="relative z-10 mx-auto grid gap-(--gap) **:data-[slot=card]:w-full min-[1400px]:grid-cols-4! min-[1900px]:grid-cols-5! md:max-w-3xl md:grid-cols-2 lg:max-w-none lg:grid-cols-3 xl:max-w-[1600px] 2xl:max-w-[1900px]">
        <div class="flex flex-col items-start gap-(--gap)">
          <UIElements />
          <SidebarNav />
          <SavingsTargets />
        </div>
        <div class="hidden flex-col gap-(--gap) lg:flex">
          <ContributionHistory />
          <ClaimableBalance />
          <DividendIncome />
        </div>
        <div class="hidden flex-col gap-(--gap) min-[1400px]:flex">
          <NewMilestone />
          <PayoutThreshold />
          <AccountAccess />
        </div>
        <div class="hidden flex-col gap-(--gap) md:flex">
          <QrConnect />
          <TransferFunds />
          <Payments />
        </div>
        <div class="hidden flex-col gap-(--gap) min-[1900px]:flex">
          <EmptyDistributeTrack />
          <AnalyticsCard />
          <NotificationSettings />
          <PowerUsage />
        </div>
      </div>
      <div class="absolute inset-x-0 top-0 z-1 h-120 bg-linear-to-b from-background via-muted to-transparent dark:hidden" />
      <div class="absolute inset-x-0 bottom-0 z-20 h-48 bg-linear-to-t from-background via-muted/80 to-transparent lg:h-80 xl:h-64 dark:via-background/80" />
    </div>
  )
}
