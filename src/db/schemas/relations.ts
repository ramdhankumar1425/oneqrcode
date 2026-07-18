import { defineRelations } from "drizzle-orm";
import { account, session, user, verification } from "./auth";
import { qrCode, qrDesign, qrRedirect, qrScan } from "./core";
import { payment, subscription, webhookEvent } from "./subscriptions";

/** Tables the relational query builder is aware of (db.query.<key>). */
export const schema = {
  user,
  session,
  account,
  verification,
  qrCode,
  qrDesign,
  qrRedirect,
  qrScan,
  subscription,
  payment,
  webhookEvent,
};

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
    qrCodes: r.many.qrCode(),
    subscriptions: r.many.subscription(),
  },
  session: {
    user: r.one.user({ from: r.session.userId, to: r.user.id }),
  },
  account: {
    user: r.one.user({ from: r.account.userId, to: r.user.id }),
  },
  qrCode: {
    user: r.one.user({ from: r.qrCode.userId, to: r.user.id }),
    design: r.one.qrDesign({ from: r.qrCode.id, to: r.qrDesign.qrCodeId }),
    redirects: r.many.qrRedirect(),
    scans: r.many.qrScan(),
  },
  qrDesign: {
    qrCode: r.one.qrCode({ from: r.qrDesign.qrCodeId, to: r.qrCode.id }),
  },
  qrRedirect: {
    qrCode: r.one.qrCode({ from: r.qrRedirect.qrCodeId, to: r.qrCode.id }),
  },
  qrScan: {
    qrCode: r.one.qrCode({ from: r.qrScan.qrCodeId, to: r.qrCode.id }),
  },
  subscription: {
    user: r.one.user({ from: r.subscription.userId, to: r.user.id }),
    payments: r.many.payment(),
  },
  payment: {
    subscription: r.one.subscription({
      from: r.payment.subscriptionId,
      to: r.subscription.id,
    }),
  },
}));
