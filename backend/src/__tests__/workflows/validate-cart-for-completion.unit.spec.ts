import { validateCartForCompletion } from "../../workflows/hooks/validate-cart-for-completion";
import { MANUAL_PROVIDER_ID } from "../../lib/payment";

const session = (over: Record<string, unknown> = {}) => ({
  status: "pending",
  provider_id: "pp_sumup_sumup",
  amount: 1000,
  currency_code: "eur",
  ...over,
});

const cart = (over: Record<string, unknown> = {}, sessions: unknown[] = [session()]) => ({
  items: [{ id: "i1" }],
  total: 1000,
  currency_code: "EUR",
  payment_collection: {
    amount: 1000,
    currency_code: "eur",
    payment_sessions: sessions,
  },
  ...over,
});

const run = (c: unknown, manualAllowed = false) =>
  validateCartForCompletion(c, { manualAllowed });

describe("validateCartForCompletion", () => {
  it("rejects a cart without items", () => {
    expect(() => run(cart({ items: [] }))).toThrow(
      expect.objectContaining({ type: "invalid_data" }),
    );
  });

  it("passes when there are no processable sessions", () => {
    expect(() => run(cart({}, [session({ status: "canceled" })]))).not.toThrow();
    expect(() => run(cart({ payment_collection: undefined }))).not.toThrow();
  });

  it("rejects the manual provider when not allowed", () => {
    const c = cart({}, [session({ provider_id: MANUAL_PROVIDER_ID })]);
    expect(() => run(c, false)).toThrow(expect.objectContaining({ type: "not_allowed" }));
    expect(() => run(c, true)).not.toThrow();
  });

  it("rejects two processable sessions", () => {
    expect(() => run(cart({}, [session(), session()]))).toThrow(
      expect.objectContaining({ type: "not_allowed" }),
    );
  });

  it("rejects a session amount different from the cart total", () => {
    expect(() => run(cart({}, [session({ amount: 500 })]))).toThrow(
      /does not match the cart total/,
    );
  });

  it("rejects a currency mismatch", () => {
    expect(() => run(cart({}, [session({ currency_code: "usd" })]))).toThrow(
      /does not match the cart total/,
    );
  });

  it("accepts equal BigNumber raw amounts", () => {
    const c = cart(
      { raw_total: { value: "10", precision: 20 } },
      [session({ raw_amount: { value: "10", precision: 20 } })],
    );
    c.payment_collection.raw_amount = { value: "10", precision: 20 } as never;
    expect(() => run(c)).not.toThrow();
  });

  it("accepts the happy path", () => {
    expect(() => run(cart())).not.toThrow();
  });
});
