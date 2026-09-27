import { getContext } from "telefunc";
import { appError } from "@/lib/app-error";
import { enforceOrderRequestRateLimit } from "@/server/order/rate-limit";
import { telefuncAction } from "@/server/telefunc-action";
import type { TelefuncContext } from "@/server/telefunc-context";
import { PaymentFlowService } from "./flow-service";
import type { PaymentCreateInput } from "./types";

async function internalOnCreatePayment(input: PaymentCreateInput) {
  const context = getContext<TelefuncContext>();
  if (!context.env?.DB) appError("DATABASE_UNAVAILABLE");
  const userId = context.user?.id ?? null;
  // Every pending order holds physical stock and discount-code slots until it
  // expires and calls the payment provider's API, so scripted checkout must be
  // throttled like the other public order endpoints.
  await enforceOrderRequestRateLimit(context.env.DB, {
    action: "CREATE",
    userId,
    clientIp: context.clientIp,
  });
  return new PaymentFlowService(context.env.DB, context.env).create(input, userId);
}

export const onCreatePayment = telefuncAction(internalOnCreatePayment);

export type { PaymentCreateInput };
