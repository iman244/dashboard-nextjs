import React from "react";
import { useGlobal } from "../_global";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNetworkError } from "../_side-effects/network-error";
import { useTranslations } from "next-intl";
import { useDirection } from "@/lib/use-direction";

/**
 * Shown when a request fails with `ERR_NETWORK`.
 *
 * A `Dialog`, not an `AlertDialog`. AlertDialog is the primitive for an
 * interruption that demands an answer — a delete confirmation — so Radix gives
 * it no close button and refuses to dismiss it on an outside click. That is
 * the wrong contract here: losing the connection is something the user is
 * told, not asked, and they may well want to keep looking at the page they
 * already have while the network comes back.
 *
 * Dismissing is safe because it is not a decision. `useNetworkError`
 * subscribes to the query *and* mutation caches and reopens this on every
 * `ERR_NETWORK`, so if the connection is still down the next failed request
 * brings it straight back — closing it cannot strand anyone in an app that is
 * quietly broken.
 */
const NetworkErrorDialog = () => {
  const t = useTranslations("common.NetworkErrorDialog");
  const tDictionary = useTranslations("common.Dictionary");
  const dir = useDirection();
  const { networkErrorOpen, setNetworkErrorOpen } = useGlobal();

  useNetworkError();

  return (
    <Dialog open={networkErrorOpen} onOpenChange={setNetworkErrorOpen}>
      <DialogContent dir={dir} closeLabel={tDictionary("Close")}>
        <DialogHeader className="items-start">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button className="self-end" onClick={() => window.location.reload()}>
            {t("action")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NetworkErrorDialog;
